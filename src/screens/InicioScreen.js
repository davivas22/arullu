// Panel principal: estado de conexión, zonas, lámpara, audio, rutinas rápidas y temporizador activo.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Pantalla, { BotonIcono } from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import Interruptor from '../components/Interruptor';
import Chip from '../components/Chip';
import Pulsable from '../components/Pulsable';
import Icono from '../components/Icono';
import Boton from '../components/Boton';
import Estimado from '../components/Estimado';
import EstadoVacio from '../components/EstadoVacio';
import { useLampara } from '../hooks/useLampara';
import { useCuentaRegresiva } from '../hooks/useCuentaRegresiva';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { haptica } from '../services/haptica';
import { ID_APAGAR_TODO, ID_HORA_DORMIR, ID_LUZ_NOCHE, resumenRutina } from '../services/rutinas';
import { COLORES, DURACION, ESPACIO, FUENTES, RADIOS, RESPLANDOR_AMBAR, TIPO } from '../theme';

export const ZONAS = ['Todas', 'Dormitorio', 'Sala', 'Otra'];

function saludo(conectada) {
  const h = new Date().getHours();
  const base = h >= 5 && h < 12 ? 'Buenos días' : h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches';
  return `${base} · ${conectada ? 'todo listo' : 'lámpara sin conectar'}`;
}

export default function InicioScreen({ navigation }) {
  const {
    ajustes,
    conectada,
    lampara,
    temporizador,
    rutinas,
    rutinaEnCurso,
    necesitaConectar,
    iniciarConexionAutomatica,
    encenderLuz,
    apagarLuz,
    cambiarAudio,
    apagarTodo,
    ejecutarRutina,
    cancelarTemporizador,
    actualizarAjustes,
  } = useLampara();
  const [zona, setZona] = useState('Todas');
  const [eligiendoAcceso, setEligiendoAcceso] = useState(false);
  const cuenta = useCuentaRegresiva(temporizador);

  // Al entrar: reconexión automática con la lámpara guardada (3 intentos, 2 s entre ellos)
  useEffect(() => {
    iniciarConexionAutomatica();
  }, [iniciarConexionAutomatica]);

  // Si no hay lámpara guardada o la reconexión falló, mostramos Conectar
  useEffect(() => {
    if (necesitaConectar) navigation.navigate('Conectar');
  }, [necesitaConectar, navigation]);

  const rutinaPorId = (id) => rutinas.find((r) => r.id === id);
  const accesos = [
    rutinaPorId(ID_HORA_DORMIR),
    rutinaPorId(ID_LUZ_NOCHE),
    rutinaPorId(ID_APAGAR_TODO),
  ];
  const cuarta = ajustes.rutinaRapidaId ? rutinaPorId(ajustes.rutinaRapidaId) : null;

  const mostrarLampara = zona === 'Todas' || zona === ajustes.zona;

  const celdas = [
    ...accesos.map((r, i) =>
      r ? (
        <AccesoRapido key={r.id} rutina={r} enCurso={rutinaEnCurso === r.id} onPress={() => ejecutarRutina(r)} />
      ) : (
        <View key={`vacio-${i}`} style={styles.acceso} />
      )
    ),
    cuarta ? (
      <AccesoRapido
        key="cuarta"
        rutina={cuarta}
        enCurso={rutinaEnCurso === cuarta.id}
        onPress={() => ejecutarRutina(cuarta)}
        onLongPress={() => setEligiendoAcceso(true)}
        pista="Mantén presionado para cambiar este acceso"
      />
    ) : (
      <Pulsable
        key="cuarta"
        style={[styles.acceso, styles.accesoVacio]}
        onPress={() => setEligiendoAcceso(true)}
        accessibilityLabel="Configurar cuarto acceso rápido"
      >
        <Icono nombre="mas" color={COLORES.textoSecundario} tamano={28} />
        <Texto variante="negrita">Elegir acceso</Texto>
        <Texto variante="etiqueta">Toca para configurarlo</Texto>
      </Pulsable>
    ),
  ];

  return (
    <Pantalla
      titulo="Arrullú"
      subtitulo={saludo(conectada)}
      accionDerecha={
        <BotonIcono icono="ajustes" onPress={() => navigation.navigate('Ajustes')} accessibilityLabel="Abrir ajustes" />
      }
    >
      {/* Zonas de la casa (solo organizan la vista: el hardware es una sola lámpara) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zonas}>
        {ZONAS.map((z) => (
          <Chip key={z} etiqueta={z} activo={zona === z} onPress={() => setZona(z)} accessibilityLabel={`Zona ${z}`} />
        ))}
      </ScrollView>

      {!mostrarLampara ? (
        <EstadoVacio
          icono="inicio"
          titulo={`No hay lámparas en ${zona}`}
          mensaje={`Tu lámpara está en ${ajustes.zona}. Puedes moverla a esta zona.`}
          accion={`Mover lámpara a ${zona}`}
          onAccion={() => actualizarAjustes({ zona })}
        />
      ) : (
        <>
          <TarjetaLampara
            titulo={`${ajustes.nombreLampara} · ${ajustes.zona}`}
            encendida={lampara.luz}
            onCambio={(v) => (v ? encenderLuz() : apagarLuz())}
            onApagarTodo={() => {
              haptica.media();
              apagarTodo();
            }}
          />

          <Tarjeta style={styles.tarjetaFila}>
            <View style={[styles.iconoCirculo, lampara.audio && { backgroundColor: COLORES.ambarSuave }]}>
              <Icono nombre="musica" color={lampara.audio ? COLORES.ambar : COLORES.textoSecundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Texto variante="negrita">Música</Texto>
              <Texto variante="cuerpoChico">{lampara.audio ? 'Audio activo (estimado)' : 'Encender el audio'}</Texto>
            </View>
            <Interruptor
              valor={lampara.audio}
              onCambio={(v) => cambiarAudio(v)}
              accessibilityLabel="Audio de la lámpara"
            />
          </Tarjeta>
        </>
      )}

      {cuenta.activo && (
        <Tarjeta style={styles.tarjetaFila}>
          <View style={[styles.iconoCirculo, { backgroundColor: COLORES.ambarSuave }]}>
            <Icono nombre="reloj" color={COLORES.ambar} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto variante="negrita">Temporizador activo</Texto>
            <Texto style={styles.tiempo}>{cuenta.texto}</Texto>
            <Texto variante="etiqueta">Cuenta llevada por la app</Texto>
          </View>
          <Boton titulo="Cancelar" variante="peligro" compacto onPress={() => cancelarTemporizador()} accessibilityLabel="Cancelar temporizador" />
        </Tarjeta>
      )}

      <Texto variante="subtitulo">Rutinas rápidas</Texto>
      {/* Cuadrícula 2×2: tres rutinas de fábrica + un acceso configurable */}
      <View style={styles.cuadricula}>
        {[0, 2].map((inicio) => (
          <View key={inicio} style={styles.filaCuadricula}>
            {celdas.slice(inicio, inicio + 2)}
          </View>
        ))}
      </View>

      <SelectorRutina
        visible={eligiendoAcceso}
        rutinas={rutinas}
        onElegir={(id) => {
          actualizarAjustes({ rutinaRapidaId: id });
          setEligiendoAcceso(false);
        }}
        onCerrar={() => setEligiendoAcceso(false)}
      />
    </Pantalla>
  );
}

/** Tarjeta de la lámpara: ámbar con resplandor cuando está encendida (transición ~300 ms). */
function TarjetaLampara({ titulo, encendida, onCambio, onApagarTodo }) {
  const reducir = useReduceMotion();
  const anim = useRef(new Animated.Value(encendida ? 1 : 0)).current;

  useEffect(() => {
    if (reducir) anim.setValue(encendida ? 1 : 0);
    else Animated.timing(anim, { toValue: encendida ? 1 : 0, duration: DURACION.transicion, useNativeDriver: false }).start();
  }, [encendida, reducir, anim]);

  const fondo = anim.interpolate({ inputRange: [0, 1], outputRange: [COLORES.superficieApagada, COLORES.ambar] });
  const colorTexto = encendida ? COLORES.textoSobreAmbar : COLORES.texto;
  const colorSec = encendida ? COLORES.textoSobreAmbar : COLORES.textoSecundario;

  return (
    <View>
      {/* Resplandor ámbar detrás de la tarjeta */}
      <Animated.View pointerEvents="none" style={[styles.resplandor, { opacity: anim }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={COLORES.ambar} stopOpacity={0.45} />
              <Stop offset="100%" stopColor={COLORES.ambar} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[styles.lampara, { backgroundColor: fondo }, encendida && RESPLANDOR_AMBAR]}
      >
        <Pressable
          onLongPress={onApagarTodo}
          delayLongPress={700}
          accessibilityLabel={`${titulo}. Mantén presionado para apagar todo`}
          accessibilityActions={[{ name: 'longpress', label: 'Apagar todo' }]}
          onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && onApagarTodo()}
          style={{ gap: ESPACIO.m }}
        >
          <View style={styles.filaLampara}>
            <View style={[styles.iconoGrande, { backgroundColor: encendida ? 'rgba(30,27,75,0.12)' : COLORES.fondoProfundo }]}>
              <Icono nombre="foco" tamano={36} color={encendida ? COLORES.textoSobreAmbar : COLORES.textoSecundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Texto variante="negrita" style={{ color: colorTexto }} numberOfLines={2}>
                {titulo}
              </Texto>
              <Texto style={[styles.estadoLampara, { color: colorTexto }]}>{encendida ? 'Encendida' : 'Apagada'}</Texto>
            </View>
            <Interruptor
              valor={encendida}
              onCambio={onCambio}
              onLongPress={onApagarTodo}
              colorActivo={COLORES.fondo}
              colorMarcaActiva={COLORES.texto}
              accessibilityLabel="Luz de la lámpara"
              accessibilityHint="Mantén presionado para apagar todo"
            />
          </View>
          <Estimado color={colorSec} />
          <Texto style={[styles.pista, { color: colorSec }]}>Mantén presionado para "Apagar todo"</Texto>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function AccesoRapido({ rutina, enCurso, onPress, onLongPress, pista }) {
  return (
    <Pulsable
      style={styles.acceso}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={`Rutina ${rutina.nombre}: ${resumenRutina(rutina)}`}
      accessibilityHint={pista}
    >
      <View style={styles.accesoCabecera}>
        <View style={[styles.iconoCirculo, { backgroundColor: COLORES.ambarSuave }]}>
          <Icono nombre={rutina.icono} color={COLORES.ambar} />
        </View>
        {enCurso ? <ActivityIndicator color={COLORES.ambar} /> : <Icono nombre="play" tamano={18} color={COLORES.textoSecundario} />}
      </View>
      <Texto variante="negrita" numberOfLines={1}>
        {rutina.nombre}
      </Texto>
      <Texto variante="etiqueta" numberOfLines={2}>
        {resumenRutina(rutina)}
      </Texto>
    </Pulsable>
  );
}

function SelectorRutina({ visible, rutinas, onElegir, onCerrar }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.velo} onPress={onCerrar} accessibilityLabel="Cerrar selector">
        <Pressable style={styles.hoja} onPress={() => {}}>
          <Texto variante="subtitulo">Elegir acceso rápido</Texto>
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: ESPACIO.s }}>
            {rutinas.map((r) => (
              <Pulsable key={r.id} style={styles.opcion} onPress={() => onElegir(r.id)} accessibilityLabel={`Usar ${r.nombre}`}>
                <View style={styles.filaLampara}>
                  <Icono nombre={r.icono} color={COLORES.ambar} />
                  <Texto variante="negrita" style={{ flex: 1 }}>
                    {r.nombre}
                  </Texto>
                </View>
              </Pulsable>
            ))}
          </ScrollView>
          <Boton titulo="Quitar acceso" variante="texto" onPress={() => onElegir(null)} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  zonas: { gap: ESPACIO.s },
  resplandor: { position: 'absolute', top: -40, bottom: -40, left: -30, right: -30 },
  lampara: {
    borderRadius: RADIOS.tarjetaGrande,
    padding: ESPACIO.l,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  filaLampara: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  iconoGrande: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  estadoLampara: { fontSize: TIPO.subtitulo, fontFamily: FUENTES.bold },
  pista: { fontSize: TIPO.minimo, fontFamily: FUENTES.semibold },
  tarjetaFila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  iconoCirculo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondoProfundo,
  },
  tiempo: { fontSize: TIPO.subtitulo, fontFamily: FUENTES.bold, color: COLORES.ambar, fontVariant: ['tabular-nums'] },
  cuadricula: { gap: ESPACIO.m },
  filaCuadricula: { flexDirection: 'row', gap: ESPACIO.m },
  acceso: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.tarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIO.l,
    gap: ESPACIO.xs,
    minHeight: 132,
  },
  accesoVacio: { borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  accesoCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIO.xs },
  velo: { flex: 1, backgroundColor: COLORES.velo, justifyContent: 'flex-end' },
  hoja: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: RADIOS.tarjetaGrande,
    borderTopRightRadius: RADIOS.tarjetaGrande,
    padding: ESPACIO.l,
    gap: ESPACIO.m,
    paddingBottom: ESPACIO.xxl,
  },
  opcion: {
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.tarjetaChica,
    padding: ESPACIO.m,
    justifyContent: 'center',
  },
});
