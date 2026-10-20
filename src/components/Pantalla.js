// Contenedor de pantalla: zona segura, cabecera (título + estado + DEMO), banner de conexión
// y contenido desplazable. Las acciones frecuentes quedan abajo, al alcance del pulgar.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Texto from './Texto';
import ChipConexion from './ChipConexion';
import BannerConexion from './BannerConexion';
import Pulsable from './Pulsable';
import Icono from './Icono';
import { useLampara, ESTADOS_CONEXION } from '../hooks/useLampara';
import { COLORES, ESPACIO, FUENTES, RADIOS, TACTIL_MINIMO, TIPO } from '../theme';

export default function Pantalla({
  titulo,
  subtitulo,
  accionDerecha,
  atras = false,
  children,
  scrollEnabled = true,
  pie,
}) {
  const navigation = useNavigation();
  const { modoDemo, conexion, reconectar, dispositivo } = useLampara();

  const tocarEstado = () => {
    if (conexion.estado === ESTADOS_CONEXION.CONECTANDO) return;
    if (conexion.estado === ESTADOS_CONEXION.CONECTADA || (!dispositivo && !modoDemo)) {
      navigation.navigate('Conectar');
    } else {
      reconectar();
    }
  };

  return (
    <SafeAreaView style={styles.zona} edges={['top', 'left', 'right']}>
      <View style={styles.cabecera}>
        <View style={styles.filaTitulo}>
          {atras ? (
            <Pulsable
              onPress={() => navigation.goBack()}
              accessibilityLabel="Volver"
              style={styles.botonIcono}
            >
              <Icono nombre="atras" />
            </Pulsable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Texto variante="titulo" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} accessibilityRole="header">
              {titulo}
            </Texto>
          </View>
          {accionDerecha}
        </View>
        <View style={styles.filaEstado}>
          {subtitulo ? (
            <Texto variante="cuerpoChico" style={{ flex: 1 }} numberOfLines={2}>
              {subtitulo}
            </Texto>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {modoDemo ? (
            <View style={styles.demo} accessibilityLabel="Modo demo activo">
              <Texto style={styles.demoTexto}>DEMO</Texto>
            </View>
          ) : null}
          <ChipConexion onPress={tocarEstado} />
        </View>
      </View>
      <BannerConexion />
      <ScrollView
        contentContainerStyle={styles.contenido}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {pie}
    </SafeAreaView>
  );
}

export function BotonIcono({ icono, onPress, accessibilityLabel, color }) {
  return (
    <Pulsable onPress={onPress} accessibilityLabel={accessibilityLabel} style={styles.botonIcono}>
      <Icono nombre={icono} color={color} />
    </Pulsable>
  );
}

const styles = StyleSheet.create({
  zona: { flex: 1, backgroundColor: COLORES.fondo },
  cabecera: { paddingHorizontal: ESPACIO.l, paddingTop: ESPACIO.s, gap: ESPACIO.xs },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  filaEstado: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  contenido: { padding: ESPACIO.l, paddingBottom: ESPACIO.xxl * 3, gap: ESPACIO.l },
  botonIcono: {
    width: TACTIL_MINIMO,
    height: TACTIL_MINIMO,
    borderRadius: RADIOS.pildora,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.superficie,
  },
  demo: {
    backgroundColor: COLORES.azul,
    borderRadius: RADIOS.pildora,
    paddingHorizontal: ESPACIO.s,
    paddingVertical: 2,
  },
  demoTexto: { fontSize: TIPO.minimo, fontFamily: FUENTES.bold, color: COLORES.fondoProfundo },
});
