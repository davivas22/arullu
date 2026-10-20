// Banner NO bloqueante cuando la conexión se cae o hay un error (Bluetooth apagado, permisos…).
import React from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import Texto from './Texto';
import Boton from './Boton';
import Icono from './Icono';
import { useLampara, ESTADOS_CONEXION } from '../hooks/useLampara';
import { COLORES, ESPACIO, RADIOS } from '../theme';

export default function BannerConexion() {
  const { banner, conexion, reconectar, activarBluetooth, cerrarBanner } = useLampara();

  // Errores de conexión con su acción correspondiente
  const error = conexion.estado === ESTADOS_CONEXION.ERROR ? conexion.error : null;
  if (!banner && !error) return null;

  const reconectando = banner?.tipo === 'reconectando';
  const mensaje = banner?.mensaje || error?.mensaje;

  let accion = { titulo: 'Reconectar', fn: () => reconectar() };
  if (error?.codigo === 'bt_apagado') accion = { titulo: 'Activar Bluetooth', fn: activarBluetooth };
  if (error?.codigo === 'permisos') accion = { titulo: 'Dar permisos', fn: () => Linking.openSettings() };
  if (error?.codigo === 'emparejamiento')
    accion = { titulo: 'Emparejar', fn: () => Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => {}) };

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <View style={styles.fila}>
        {reconectando ? (
          <ActivityIndicator color={COLORES.ambar} />
        ) : (
          <Icono nombre="alerta" color={COLORES.rojo} tamano={20} />
        )}
        <Texto variante="cuerpoChico" style={styles.texto}>
          {mensaje}
        </Texto>
      </View>
      {!reconectando && (
        <View style={styles.acciones}>
          <Boton titulo={accion.titulo} onPress={accion.fn} compacto variante="primario" />
          {banner && <Boton titulo="Cerrar" variante="texto" onPress={cerrarBanner} compacto />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: ESPACIO.l,
    marginTop: ESPACIO.s,
    padding: ESPACIO.m,
    borderRadius: RADIOS.tarjetaChica,
    backgroundColor: COLORES.fondoProfundo,
    borderWidth: 1,
    borderColor: COLORES.rojo,
    gap: ESPACIO.s,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  texto: { flex: 1, color: COLORES.texto },
  acciones: { flexDirection: 'row', gap: ESPACIO.s, flexWrap: 'wrap' },
});
