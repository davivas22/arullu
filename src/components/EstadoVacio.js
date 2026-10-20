// Estado vacío / de error con mensaje amable y una acción clara.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Tarjeta from './Tarjeta';
import Texto from './Texto';
import Icono from './Icono';
import Boton from './Boton';
import { COLORES, ESPACIO } from '../theme';

export default function EstadoVacio({ icono = 'luna', titulo, mensaje, accion, onAccion }) {
  return (
    <Tarjeta style={styles.tarjeta}>
      <View style={styles.icono}>
        <Icono nombre={icono} tamano={36} color={COLORES.textoSecundario} />
      </View>
      <Texto variante="subtitulo" style={styles.centro}>
        {titulo}
      </Texto>
      {mensaje ? (
        <Texto variante="cuerpoChico" style={styles.centro}>
          {mensaje}
        </Texto>
      ) : null}
      {accion ? <Boton titulo={accion} onPress={onAccion} style={{ alignSelf: 'center' }} /> : null}
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  tarjeta: { alignItems: 'stretch', gap: ESPACIO.m, paddingVertical: ESPACIO.xl },
  icono: { alignItems: 'center' },
  centro: { textAlign: 'center' },
});
