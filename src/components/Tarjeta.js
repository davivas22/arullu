// Tarjeta de superficie con bordes muy redondeados y sombra suave.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORES, ESPACIO, RADIOS, SOMBRA } from '../theme';

export default function Tarjeta({ style, children, ...resto }) {
  return (
    <View style={[styles.tarjeta, style]} {...resto}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderColor: COLORES.borde,
    borderWidth: 1,
    borderRadius: RADIOS.tarjeta,
    padding: ESPACIO.l,
    ...SOMBRA,
  },
});
