// Chip seleccionable (zonas, minutos del temporizador, días, filtros).
import React from 'react';
import { StyleSheet } from 'react-native';
import Pulsable from './Pulsable';
import Texto from './Texto';
import { COLORES, ESPACIO, FUENTES, RADIOS, TACTIL_MINIMO, TIPO } from '../theme';

export default function Chip({ etiqueta, activo, onPress, accessibilityLabel, style }) {
  return (
    <Pulsable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!activo }}
      accessibilityLabel={accessibilityLabel || etiqueta}
      style={[styles.chip, activo && styles.activo, style]}
    >
      <Texto style={[styles.texto, activo && styles.textoActivo]}>{etiqueta}</Texto>
    </Pulsable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: TACTIL_MINIMO,
    minWidth: TACTIL_MINIMO,
    paddingHorizontal: ESPACIO.l,
    borderRadius: RADIOS.pildora,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.superficie,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activo: { backgroundColor: COLORES.ambar, borderColor: COLORES.ambar },
  texto: { fontSize: TIPO.cuerpo, fontFamily: FUENTES.bold, color: COLORES.textoSecundario },
  textoActivo: { color: COLORES.textoSobreAmbar },
});
