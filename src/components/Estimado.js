// Rótulo para todo lo que NO es una lectura real de la lámpara.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Texto from './Texto';
import Icono from './Icono';
import { COLORES, ESPACIO } from '../theme';

export default function Estimado({ texto = 'Estado estimado según el último comando enviado', style, color = COLORES.textoSecundario }) {
  return (
    <View style={[styles.fila, style]}>
      <Icono nombre="info" tamano={14} color={color} />
      <Texto variante="etiqueta" style={{ flex: 1, color }}>
        {texto}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.xs },
});
