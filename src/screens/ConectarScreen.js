// Conectar: lista los dispositivos ya emparejados y permite buscar nuevos.
// El HC-05 se empareja primero desde los ajustes de Android (PIN 1234 o 0000).
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import Pantalla, { BotonIcono } from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Pulsable from '../components/Pulsable';
import Icono from '../components/Icono';
import EstadoVacio from '../components/EstadoVacio';
import { useLampara, ESTADOS_CONEXION } from '../hooks/useLampara';
import { COLORES, ESPACIO, FUENTES, RADIOS } from '../theme';

export const abrirAjustesBluetooth = () =>
  Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => Linking.openSettings());

export default function ConectarScreen({ navigation }) {
  const {
    listarEmparejados,
    buscarNuevos,
    cancelarBusqueda,
    conectar,
    conexion,
    dispositivo,
    modoDemo,
    activarBluetooth,
    setNecesitaConectar,
  } = useLampara();
  const [emparejados, setEmparejados] = useState([]);
  const [nuevos, setNuevos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  const [conectandoA, setConectandoA] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const r = await listarEmparejados();
    setEmparejados(r.dispositivos);
    setError(r.error);
    setCargando(false);
  }, [listarEmparejados]);

  useEffect(() => {
    setNecesitaConectar(false);
    cargar();
    return () => {
      cancelarBusqueda();
    };
  }, [cargar, cancelarBusqueda, setNecesitaConectar]);

  const buscar = async () => {
    setBuscando(true);
    const r = await buscarNuevos();
    setNuevos(r.dispositivos.filter((d) => !emparejados.some((e) => e.address === d.address)));
    if (r.error) setError(r.error);
    setBuscando(false);
  };

  const elegir = async (d) => {
    setConectandoA(d.address);
    const ok = await conectar(d, { guardar: true });
    setConectandoA(null);
    if (ok) navigation.goBack();
  };

  const renderDispositivo = (d) => {
    const esPrincipal = dispositivo?.address === d.address;
    const enCurso = conectandoA === d.address;
    return (
      <Pulsable
        key={d.address}
        onPress={() => elegir(d)}
        disabled={!!conectandoA}
        accessibilityLabel={`Conectar con ${d.name}${esPrincipal ? ', lámpara principal' : ''}`}
        style={[styles.fila, esPrincipal && styles.filaPrincipal]}
      >
        <View style={styles.filaInterior}>
          <Icono nombre="bluetooth" color={esPrincipal ? COLORES.ambar : COLORES.textoSecundario} />
          <View style={{ flex: 1 }}>
            <Texto variante="negrita">{d.name}</Texto>
            <Texto variante="etiqueta">
              {d.address}
              {esPrincipal ? ' · Lámpara principal' : ''}
              {d.emparejado === false ? ' · Sin emparejar' : ''}
            </Texto>
          </View>
          {enCurso ? <ActivityIndicator color={COLORES.ambar} /> : <Texto style={styles.accion}>Conectar</Texto>}
        </View>
      </Pulsable>
    );
  };

  return (
    <Pantalla
      titulo="Conectar lámpara"
      atras
      subtitulo={modoDemo ? 'Modo Demo: dispositivos simulados' : 'Elige tu lámpara Arrullú (HC-05)'}
      accionDerecha={<BotonIcono icono="recargar" onPress={cargar} accessibilityLabel="Actualizar lista" />}
    >
      {conexion.estado === ESTADOS_CONEXION.ERROR && conexion.error?.codigo === 'bt_apagado' && (
        <EstadoVacio
          icono="bluetooth"
          titulo="Bluetooth apagado"
          mensaje="Enciende el Bluetooth del teléfono para ver tu lámpara."
          accion="Activar Bluetooth"
          onAccion={async () => {
            await activarBluetooth();
            cargar();
          }}
        />
      )}

      <Tarjeta style={{ gap: ESPACIO.s }}>
        <Texto variante="subtitulo">Antes de empezar</Texto>
        <Texto variante="cuerpoChico">
          1. Enciende la lámpara.{'\n'}2. Empareja el módulo "HC-05" desde los ajustes Bluetooth del teléfono (PIN 1234 o 0000).
          {'\n'}3. Vuelve aquí y tócalo en la lista.
        </Texto>
        <Boton titulo="Abrir ajustes Bluetooth" icono="bluetooth" variante="secundario" onPress={abrirAjustesBluetooth} />
      </Tarjeta>

      <Texto variante="subtitulo">Dispositivos emparejados</Texto>
      {cargando ? (
        <ActivityIndicator color={COLORES.ambar} accessibilityLabel="Cargando dispositivos" />
      ) : error && emparejados.length === 0 ? (
        <EstadoVacio icono="alerta" titulo="No pudimos leer el Bluetooth" mensaje={error.mensaje} accion="Reintentar" onAccion={cargar} />
      ) : emparejados.length === 0 ? (
        <EstadoVacio
          icono="bluetooth"
          titulo="Aún no hay dispositivos"
          mensaje="Empareja tu lámpara desde los ajustes de Android y vuelve aquí."
          accion="Abrir ajustes Bluetooth"
          onAccion={abrirAjustesBluetooth}
        />
      ) : (
        <View style={{ gap: ESPACIO.s }}>{emparejados.map(renderDispositivo)}</View>
      )}

      <Texto variante="subtitulo">Dispositivos nuevos</Texto>
      {nuevos.length > 0 && <View style={{ gap: ESPACIO.s }}>{nuevos.map(renderDispositivo)}</View>}
      <Boton
        titulo={buscando ? 'Buscando… (unos 12 s)' : 'Buscar dispositivos nuevos'}
        icono={buscando ? undefined : 'recargar'}
        variante="secundario"
        disabled={buscando}
        onPress={buscar}
      />
      {conexion.estado === ESTADOS_CONEXION.ERROR && conexion.error && conexion.error.codigo !== 'bt_apagado' && (
        <Texto style={{ color: COLORES.rojo }}>{conexion.error.mensaje}</Texto>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: {
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.tarjetaChica,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIO.m,
    justifyContent: 'center',
  },
  filaPrincipal: { borderColor: COLORES.ambar },
  filaInterior: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  accion: { color: COLORES.ambar, fontFamily: FUENTES.bold },
});
