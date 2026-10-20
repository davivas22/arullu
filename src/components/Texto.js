// Texto con la tipografía Nunito y los tamaños del tema (mínimo 12 px).
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORES, FUENTES, TIPO } from '../theme';

const VARIANTES = StyleSheet.create({
  titulo: { fontFamily: FUENTES.bold, fontSize: TIPO.titulo, color: COLORES.texto },
  subtitulo: { fontFamily: FUENTES.bold, fontSize: TIPO.subtitulo, color: COLORES.texto },
  cuerpo: { fontFamily: FUENTES.semibold, fontSize: TIPO.cuerpoGrande, color: COLORES.texto },
  cuerpoChico: { fontFamily: FUENTES.semibold, fontSize: TIPO.cuerpo, color: COLORES.textoSecundario },
  etiqueta: { fontFamily: FUENTES.semibold, fontSize: TIPO.etiqueta, color: COLORES.textoSecundario },
  negrita: { fontFamily: FUENTES.bold, fontSize: TIPO.cuerpoGrande, color: COLORES.texto },
});

export default function Texto({ variante = 'cuerpo', style, children, ...resto }) {
  return (
    <Text style={[VARIANTES[variante], style]} maxFontSizeMultiplier={1.6} {...resto}>
      {children}
    </Text>
  );
}
