// Contexto central de la lámpara. TODA la lógica Bluetooth vive aquí:
// las pantallas solo consumen useLampara() y nunca hablan directo con la librería.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { crearServicioReal, traducirError } from '../services/bluetoothReal';
import { crearServicioDemo } from '../services/bluetoothDemo';
import { crearCola, dormir } from '../services/colaComandos';
import {
  COMANDOS,
  PAUSA_ANTES_TEMPORIZADOR_MS,
  comandoColor,
  comandoTemporizador,
} from '../services/protocolo';
import { RUTINAS_FABRICA, ID_APAGAR_TODO, TIPOS_PASO, nuevoId, presetPorId } from '../services/rutinas';
import { EVENTO_FIN_TEMPORIZADOR } from '../services/consumo';
import { tienePermisos } from '../services/permisos';
import { haptica } from '../services/haptica';
import { almacen, AJUSTES_POR_DEFECTO } from '../storage/almacen';
import { useToast } from './useToast';
import { PRESETS_COLOR } from '../theme';

export const ESTADOS_CONEXION = {
  DESCONECTADA: 'desconectada',
  CONECTANDO: 'conectando',
  CONECTADA: 'conectada',
  ERROR: 'error',
};

const INTENTOS_RECONEXION = 3;
const ESPERA_ENTRE_INTENTOS_MS = 2000;
const INTERVALO_RUTINAS_PROGRAMADAS_MS = 20 * 1000;
const MS_MINUTO = 60 * 1000;
const INTENSIDAD_INICIAL = 60;

const DISPOSITIVO_DEMO = { address: 'DE:M0:00:00:00:01', name: 'Arrullú (demo)', emparejado: true };

const ESTADO_LAMPARA_INICIAL = {
  luz: false,
  audio: false,
  presetId: PRESETS_COLOR[0].id,
  color: { r: PRESETS_COLOR[0].r, g: PRESETS_COLOR[0].g, b: PRESETS_COLOR[0].b },
  intensidad: INTENSIDAD_INICIAL,
};

const LamparaContext = createContext(null);

export function LamparaProvider({ children }) {
  const { mostrar } = useToast();

  // ---------- Estado ----------
  const [cargado, setCargado] = useState(false);
  const [permisosOk, setPermisosOk] = useState(false);
  const [ajustes, setAjustes] = useState(AJUSTES_POR_DEFECTO);
  const [demoForzado, setDemoForzado] = useState(false); // el teléfono no tiene BT clásico
  const [dispositivo, setDispositivo] = useState(null); // lámpara principal guardada
  const [conexion, setConexion] = useState({ estado: ESTADOS_CONEXION.DESCONECTADA, error: null });
  const [banner, setBanner] = useState(null); // aviso no bloqueante de conexión caída
  const [lampara, setLampara] = useState(ESTADO_LAMPARA_INICIAL); // estado ESTIMADO
  const [temporizador, setTemporizador] = useState(null); // { inicio: ms, minutos }
  const [rutinas, setRutinas] = useState(RUTINAS_FABRICA);
  const [historial, setHistorial] = useState([]);
  const [necesitaConectar, setNecesitaConectar] = useState(false);
  const [rutinaEnCurso, setRutinaEnCurso] = useState(null);

  const modoDemo = ajustes.modoDemo || demoForzado;

  // ---------- Referencias (valores actuales dentro de callbacks) ----------
  const servicioRealRef = useRef(null);
  const servicioDemoRef = useRef(null);
  const servicioRef = useRef(null);
  const conexionRef = useRef(conexion);
  const ajustesRef = useRef(ajustes);
  const dispositivoRef = useRef(dispositivo);
  const desconexionManualRef = useRef(false);
  const reconectandoRef = useRef(false);
  const rutinasEjecutadasRef = useRef(new Set());
  const autoIniciadoRef = useRef(false);

  conexionRef.current = conexion;
  ajustesRef.current = ajustes;
  dispositivoRef.current = dispositivo;

  if (!servicioRealRef.current) servicioRealRef.current = crearServicioReal();
  if (!servicioDemoRef.current) servicioDemoRef.current = crearServicioDemo();
  servicioRef.current = modoDemo ? servicioDemoRef.current : servicioRealRef.current;

  const fijarConexion = useCallback((estado, error = null) => {
    const nueva = { estado, error };
    conexionRef.current = nueva;
    setConexion(nueva);
  }, []);

  // ---------- Historial ----------
  const registrar = useCallback((comando, ok, error) => {
    const entrada = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fecha: new Date().toISOString(),
      comando,
      resultado: ok ? 'ok' : 'error',
      detalle: error ? String(error.message || error) : undefined,
    };
    setHistorial((h) => [...h, entrada]);
  }, []);

  // Cola única de comandos (150 ms entre envíos, reintento opcional)
  const colaRef = useRef(null);
  if (!colaRef.current) {
    colaRef.current = crearCola({
      escribir: (texto) => servicioRef.current.escribir(texto),
      usarReintento: () => ajustesRef.current.reintento,
      alRegistrar: registrar,
    });
  }

  // ---------- Carga inicial (mientras se ve el Splash) ----------
  useEffect(() => {
    (async () => {
      const [aj, disp, rut, hist, est, permisos, disponible] = await Promise.all([
        almacen.leerAjustes(),
        almacen.leerDispositivo(),
        almacen.leerRutinas(),
        almacen.leerHistorial(),
        almacen.leerEstado(),
        tienePermisos(),
        servicioRealRef.current.estaDisponible(),
      ]);
      setAjustes(aj);
      setDispositivo(disp);
      if (rut) setRutinas(rut);
      setHistorial(hist || []);
      if (est) {
        setLampara({ ...ESTADO_LAMPARA_INICIAL, ...est.lampara });
        setTemporizador(est.temporizador || null);
      }
      setPermisosOk(permisos);
      // Sin Bluetooth clásico (emulador, Expo Go, iOS…) se activa el Modo Demo automáticamente
      setDemoForzado(!disponible);
      setCargado(true);
    })();
  }, []);

  // ---------- Persistencia ----------
  useEffect(() => {
    if (cargado) almacen.guardarHistorial(historial);
  }, [historial, cargado]);
  useEffect(() => {
    if (cargado) almacen.guardarRutinas(rutinas);
  }, [rutinas, cargado]);
  useEffect(() => {
    if (cargado) almacen.guardarEstado({ lampara, temporizador });
  }, [lampara, temporizador, cargado]);

  // ---------- Conexión ----------
  /**
   * Conecta con un dispositivo. Hace hasta `intentos` intentos separados 2 s.
   * Devuelve true si quedó conectada.
   */
  const conectar = useCallback(
    async (disp, { intentos = 1, guardar = true, silencioso = false } = {}) => {
      const servicio = servicioRef.current;
      if (!disp) return false;
      fijarConexion(ESTADOS_CONEXION.CONECTANDO);

      if (!servicio.esDemo) {
        if (!(await tienePermisos())) {
          fijarConexion(ESTADOS_CONEXION.ERROR, traducirError('permission'));
          return false;
        }
        const activo = await servicio.estaActivado().catch(() => false);
        if (!activo) {
          fijarConexion(ESTADOS_CONEXION.ERROR, traducirError('not enabled'));
          return false;
        }
      }

      let ultimoError = null;
      for (let i = 0; i < intentos; i++) {
        try {
          if (disp.emparejado === false) {
            try {
              await servicio.emparejar(disp.address);
            } catch (e) {
              throw new Error('pair: ' + (e?.message || e));
            }
          }
          const conectado = await servicio.conectar(disp.address);
          const guardado = { address: conectado.address, name: disp.name || conectado.name, emparejado: true };
          fijarConexion(ESTADOS_CONEXION.CONECTADA);
          setBanner(null);
          setNecesitaConectar(false);
          if (guardar && !servicio.esDemo) {
            setDispositivo(guardado);
            almacen.guardarDispositivo(guardado);
          }
          if (!silencioso) {
            haptica.exito();
            mostrar('Lámpara conectada');
          }
          return true;
        } catch (e) {
          ultimoError = e;
          if (i < intentos - 1) await dormir(ESPERA_ENTRE_INTENTOS_MS);
        }
      }
      fijarConexion(ESTADOS_CONEXION.ERROR, traducirError(ultimoError));
      if (!silencioso) haptica.error();
      return false;
    },
    [fijarConexion, mostrar]
  );

  /** Reconecta con la lámpara guardada (o la de demo) con 3 intentos. */
  const reconectar = useCallback(
    async ({ silencioso = false } = {}) => {
      const disp = servicioRef.current.esDemo ? DISPOSITIVO_DEMO : dispositivoRef.current;
      if (!disp) {
        setNecesitaConectar(true);
        return false;
      }
      return conectar(disp, { intentos: INTENTOS_RECONEXION, silencioso });
    },
    [conectar]
  );

  /** Se llama una vez al entrar a la app (tras Splash/Permisos). */
  const iniciarConexionAutomatica = useCallback(async () => {
    if (autoIniciadoRef.current) return;
    autoIniciadoRef.current = true;
    const ok = await reconectar({ silencioso: true });
    if (ok) mostrar('Lámpara conectada');
    else setNecesitaConectar(true);
  }, [reconectar, mostrar]);

  const desconectar = useCallback(async () => {
    desconexionManualRef.current = true;
    try {
      await servicioRef.current.desconectar();
    } catch (e) {
      console.warn('Error al desconectar', e);
    } finally {
      desconexionManualRef.current = false;
      fijarConexion(ESTADOS_CONEXION.DESCONECTADA);
      setBanner(null);
    }
  }, [fijarConexion]);

  const olvidarDispositivo = useCallback(async () => {
    await desconectar();
    setDispositivo(null);
    await almacen.guardarDispositivo(null);
    mostrar('Lámpara olvidada', 'info');
  }, [desconectar, mostrar]);

  const activarBluetooth = useCallback(async () => {
    try {
      const ok = await servicioRef.current.pedirActivar();
      if (ok) {
        mostrar('Bluetooth activado');
        return reconectar();
      }
    } catch (e) {
      mostrar('No se pudo activar el Bluetooth', 'error');
    }
    return false;
  }, [mostrar, reconectar]);

  const listarEmparejados = useCallback(async () => {
    try {
      return { dispositivos: await servicioRef.current.listarEmparejados(), error: null };
    } catch (e) {
      return { dispositivos: [], error: traducirError(e) };
    }
  }, []);

  const buscarNuevos = useCallback(async () => {
    try {
      return { dispositivos: await servicioRef.current.buscarNuevos(), error: null };
    } catch (e) {
      return { dispositivos: [], error: traducirError(e) };
    }
  }, []);

  const cancelarBusqueda = useCallback(() => servicioRef.current.cancelarBusqueda(), []);

  // Escucha caídas de conexión del servicio activo y reintenta en segundo plano
  useEffect(() => {
    if (!cargado) return undefined; // esperamos a saber si se usa el servicio real o el demo
    const servicio = servicioRef.current;
    const quitarCaida = servicio.alDesconectarse(async () => {
      if (desconexionManualRef.current || reconectandoRef.current) return;
      reconectandoRef.current = true;
      fijarConexion(ESTADOS_CONEXION.CONECTANDO);
      setBanner({ tipo: 'reconectando', mensaje: 'Se perdió la conexión. Reintentando…' });
      haptica.error();
      const ok = await reconectar({ silencioso: true });
      reconectandoRef.current = false;
      if (ok) {
        setBanner(null);
        mostrar('Conexión recuperada');
      } else {
        setBanner({ tipo: 'fallo', mensaje: 'No se pudo reconectar con la lámpara.' });
      }
    });
    const quitarBt = servicio.alApagarBluetooth(() => {
      fijarConexion(ESTADOS_CONEXION.ERROR, traducirError('not enabled'));
      setBanner({ tipo: 'fallo', mensaje: 'El Bluetooth del teléfono se apagó.' });
    });
    return () => {
      quitarCaida();
      quitarBt();
    };
  }, [cargado, modoDemo, reconectar, fijarConexion, mostrar]);

  // ---------- Envío de comandos ----------
  /** Envía un comando por la cola. Si no hay conexión avisa y NO envía nada. */
  const enviar = useCallback(
    async (cmd, { silencioso = false, pausaPrevia = 0 } = {}) => {
      if (conexionRef.current.estado !== ESTADOS_CONEXION.CONECTADA) {
        if (!silencioso) {
          haptica.error();
          mostrar('La lámpara no está conectada. Conéctala para enviar órdenes.', 'error');
        }
        return false;
      }
      const ok = await colaRef.current(cmd, { pausaPrevia });
      if (!ok && !silencioso) {
        haptica.error();
        mostrar('No se pudo enviar la orden. Revisa la conexión.', 'error');
      }
      return ok;
    },
    [mostrar]
  );

  const encenderLuz = useCallback(
    async ({ silencioso = false } = {}) => {
      const ok = await enviar(COMANDOS.ENCENDER_LUZ, { silencioso });
      if (ok) {
        setLampara((l) => ({ ...l, luz: true }));
        if (!silencioso) {
          haptica.suave();
          mostrar('Luz encendiéndose');
        }
      }
      return ok;
    },
    [enviar, mostrar]
  );

  const apagarLuz = useCallback(
    async ({ silencioso = false } = {}) => {
      const ok = await enviar(COMANDOS.APAGAR_LUZ, { silencioso });
      if (ok) {
        // B baja la luz en ~30 s y después corta el audio: lo reflejamos como estimado
        setLampara((l) => ({ ...l, luz: false, audio: false }));
        if (!silencioso) {
          haptica.suave();
          mostrar('Luz apagándose (unos 30 s)');
        }
      }
      return ok;
    },
    [enviar, mostrar]
  );

  const cambiarAudio = useCallback(
    async (encender, { silencioso = false } = {}) => {
      const ok = await enviar(encender ? COMANDOS.AUDIO_ON : COMANDOS.AUDIO_OFF, { silencioso });
      if (ok) {
        setLampara((l) => ({ ...l, audio: encender }));
        if (!silencioso) {
          haptica.suave();
          mostrar(encender ? 'Audio encendido' : 'Audio apagado');
        }
      }
      return ok;
    },
    [enviar, mostrar]
  );

  /** Aplica un color base escalado por la intensidad (0–100 %). Envía K r,g,b. */
  const aplicarColor = useCallback(
    async (colorBase, intensidad, { presetId = null, silencioso = false } = {}) => {
      const ok = await enviar(comandoColor(colorBase, intensidad), { silencioso });
      if (ok) {
        setLampara((l) => ({ ...l, color: { ...colorBase }, intensidad, presetId }));
        if (!silencioso) {
          haptica.seleccion();
          mostrar(`Color aplicado al ${Math.round(intensidad)} %`);
        }
      }
      return ok;
    },
    [enviar, mostrar]
  );

  const iniciarTemporizador = useCallback(
    async (minutos, { silencioso = false, pausaPrevia = 0 } = {}) => {
      const ok = await enviar(comandoTemporizador(minutos), { silencioso, pausaPrevia });
      if (ok) {
        setTemporizador({ inicio: Date.now(), minutos });
        if (!silencioso) {
          haptica.suave();
          mostrar(`Temporizador de ${minutos} min iniciado`);
        }
      }
      return ok;
    },
    [enviar, mostrar]
  );

  const cancelarTemporizador = useCallback(
    async ({ silencioso = false } = {}) => {
      const ok = await enviar(COMANDOS.CANCELAR_TEMPORIZADOR, { silencioso });
      if (ok) {
        setTemporizador(null);
        if (!silencioso) {
          haptica.suave();
          mostrar('Temporizador cancelado');
        }
      }
      return ok;
    },
    [enviar, mostrar]
  );

  // Fin del temporizador: la app lleva su propia cuenta (el Arduino no avisa).
  // Si la app estuvo cerrada, se recalcula con la hora de inicio guardada.
  const finalizarTemporizador = useCallback(() => {
    setTemporizador(null);
    setLampara((l) => ({ ...l, luz: false, audio: false }));
    registrar(EVENTO_FIN_TEMPORIZADOR, true);
    haptica.exito();
    mostrar('Temporizador terminado · la lámpara se apaga', 'info');
  }, [registrar, mostrar]);

  useEffect(() => {
    if (!temporizador) return undefined;
    const fin = temporizador.inicio + temporizador.minutos * MS_MINUTO;
    const revisar = () => {
      if (Date.now() >= fin) finalizarTemporizador();
    };
    const id = setTimeout(revisar, Math.max(0, fin - Date.now()));
    const sub = AppState.addEventListener('change', (s) => s === 'active' && revisar());
    return () => {
      clearTimeout(id);
      sub.remove();
    };
  }, [temporizador, finalizarTemporizador]);

  // ---------- Rutinas ----------
  const ejecutarPaso = useCallback(
    async (paso) => {
      const op = { silencioso: true };
      switch (paso.tipo) {
        case TIPOS_PASO.LUZ_ON:
          return encenderLuz(op);
        case TIPOS_PASO.LUZ_OFF:
          return apagarLuz(op);
        case TIPOS_PASO.AUDIO_ON:
          return cambiarAudio(true, op);
        case TIPOS_PASO.AUDIO_OFF:
          return cambiarAudio(false, op);
        case TIPOS_PASO.COLOR: {
          const p = presetPorId(paso.preset);
          return aplicarColor({ r: p.r, g: p.g, b: p.b }, paso.porcentaje, { ...op, presetId: p.id });
        }
        case TIPOS_PASO.TEMPORIZADOR:
          return iniciarTemporizador(paso.minutos, { ...op, pausaPrevia: PAUSA_ANTES_TEMPORIZADOR_MS });
        case TIPOS_PASO.CANCELAR_TEMPORIZADOR:
          return cancelarTemporizador(op);
        case TIPOS_PASO.ESPERAR:
          await dormir(paso.segundos * 1000);
          return true;
        default:
          return true;
      }
    },
    [encenderLuz, apagarLuz, cambiarAudio, aplicarColor, iniciarTemporizador, cancelarTemporizador]
  );

  /** Ejecuta los pasos en orden, uno tras otro. Se detiene si un paso falla. */
  const ejecutarRutina = useCallback(
    async (rutina, { programada = false } = {}) => {
      if (conexionRef.current.estado !== ESTADOS_CONEXION.CONECTADA) {
        haptica.error();
        mostrar(
          programada
            ? `"${rutina.nombre}" no se ejecutó: la lámpara está desconectada`
            : 'La lámpara no está conectada. Conéctala para ejecutar la rutina.',
          'error'
        );
        return false;
      }
      setRutinaEnCurso(rutina.id);
      mostrar(`Ejecutando "${rutina.nombre}"…`, 'info');
      let ok = true;
      for (const paso of rutina.pasos) {
        ok = await ejecutarPaso(paso);
        if (!ok) break;
      }
      setRutinaEnCurso(null);
      if (ok) {
        haptica.exito();
        mostrar(`"${rutina.nombre}" enviada`);
      } else {
        haptica.error();
        mostrar(`"${rutina.nombre}" se detuvo: un paso no se pudo enviar`, 'error');
      }
      return ok;
    },
    [ejecutarPaso, mostrar]
  );

  const apagarTodo = useCallback(() => {
    const rutina = rutinas.find((r) => r.id === ID_APAGAR_TODO) || RUTINAS_FABRICA[2];
    return ejecutarRutina(rutina);
  }, [rutinas, ejecutarRutina]);

  const guardarRutina = useCallback((rutina) => {
    setRutinas((lista) => {
      const existe = lista.some((r) => r.id === rutina.id);
      return existe ? lista.map((r) => (r.id === rutina.id ? rutina : r)) : [...lista, rutina];
    });
  }, []);

  const eliminarRutina = useCallback((id) => setRutinas((l) => l.filter((r) => r.id !== id)), []);

  const duplicarRutina = useCallback((id) => {
    setRutinas((l) => {
      const original = l.find((r) => r.id === id);
      if (!original) return l;
      const copia = {
        ...original,
        id: nuevoId(),
        nombre: `${original.nombre} (copia)`,
        resumen: undefined,
        hora: null,
        dias: [],
        pasos: original.pasos.map((p) => ({ ...p })),
      };
      return [...l, copia];
    });
  }, []);

  // Rutinas por hora: SOLO se ejecutan con la app abierta y conectada (el Arduino no tiene reloj).
  useEffect(() => {
    if (!cargado) return undefined;
    const revisar = () => {
      const ahora = new Date();
      const hhmm = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      const fecha = ahora.toDateString();
      for (const r of rutinas) {
        if (!r.hora || r.hora !== hhmm || !r.dias?.includes(ahora.getDay())) continue;
        const clave = `${r.id}@${fecha}@${hhmm}`;
        if (rutinasEjecutadasRef.current.has(clave)) continue;
        rutinasEjecutadasRef.current.add(clave);
        ejecutarRutina(r, { programada: true });
      }
    };
    revisar();
    const id = setInterval(revisar, INTERVALO_RUTINAS_PROGRAMADAS_MS);
    return () => clearInterval(id);
  }, [cargado, rutinas, ejecutarRutina]);

  // ---------- Ajustes ----------
  const actualizarAjustes = useCallback(
    async (parcial) => {
      const anterior = ajustesRef.current;
      const nuevos = { ...anterior, ...parcial };
      ajustesRef.current = nuevos;
      setAjustes(nuevos);
      almacen.guardarAjustes(nuevos);

      // Cambio de Modo Demo: cerramos la conexión del servicio anterior y reconectamos con el nuevo
      if ('modoDemo' in parcial && parcial.modoDemo !== anterior.modoDemo && !demoForzado) {
        await desconectar();
        servicioRef.current = nuevos.modoDemo ? servicioDemoRef.current : servicioRealRef.current;
        if (nuevos.modoDemo) {
          conectar(DISPOSITIVO_DEMO, { guardar: false });
        } else if (dispositivoRef.current) {
          conectar(dispositivoRef.current, { intentos: INTENTOS_RECONEXION });
        } else {
          setNecesitaConectar(true);
        }
      }
    },
    [demoForzado, desconectar, conectar]
  );

  const borrarHistorial = useCallback(() => {
    setHistorial([]);
    mostrar('Historial borrado', 'info');
  }, [mostrar]);

  const marcarPermisosOk = useCallback(() => setPermisosOk(true), []);

  const valor = useMemo(
    () => ({
      // estado
      cargado,
      permisosOk,
      ajustes,
      modoDemo,
      demoForzado,
      dispositivo,
      conexion,
      conectada: conexion.estado === ESTADOS_CONEXION.CONECTADA,
      banner,
      lampara,
      temporizador,
      rutinas,
      historial,
      necesitaConectar,
      rutinaEnCurso,
      // conexión
      conectar,
      reconectar,
      desconectar,
      olvidarDispositivo,
      activarBluetooth,
      listarEmparejados,
      buscarNuevos,
      cancelarBusqueda,
      iniciarConexionAutomatica,
      marcarPermisosOk,
      setNecesitaConectar,
      cerrarBanner: () => setBanner(null),
      simularCaida: () => servicioDemoRef.current.simularCaida(),
      // comandos
      encenderLuz,
      apagarLuz,
      cambiarAudio,
      aplicarColor,
      iniciarTemporizador,
      cancelarTemporizador,
      apagarTodo,
      // rutinas
      ejecutarRutina,
      guardarRutina,
      eliminarRutina,
      duplicarRutina,
      // ajustes e historial
      actualizarAjustes,
      borrarHistorial,
    }),
    [
      cargado, permisosOk, ajustes, modoDemo, demoForzado, dispositivo, conexion, banner, lampara,
      temporizador, rutinas, historial, necesitaConectar, rutinaEnCurso, conectar, reconectar,
      desconectar, olvidarDispositivo, activarBluetooth, listarEmparejados, buscarNuevos,
      cancelarBusqueda, iniciarConexionAutomatica, marcarPermisosOk, encenderLuz, apagarLuz,
      cambiarAudio, aplicarColor, iniciarTemporizador, cancelarTemporizador, apagarTodo,
      ejecutarRutina, guardarRutina, eliminarRutina, duplicarRutina, actualizarAjustes, borrarHistorial,
    ]
  );

  return <LamparaContext.Provider value={valor}>{children}</LamparaContext.Provider>;
}

/** Hook que usan las pantallas para leer el estado y mandar órdenes a la lámpara. */
export function useLampara() {
  const ctx = useContext(LamparaContext);
  if (!ctx) throw new Error('useLampara debe usarse dentro de <LamparaProvider>');
  return ctx;
}
