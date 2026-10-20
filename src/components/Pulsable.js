// Área táctil que se "hunde" ligeramente al presionarla (microinteracción).
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { DURACION, TACTIL_MINIMO } from '../theme';
import { useReduceMotion } from '../hooks/useReduceMotion';

const ESCALA_PRESIONADO = 0.96;
// Propiedades de posición que deben ir en el contenedor (Pressable) y no en la vista animada
const CLAVES_EXTERNAS = ['flex', 'flexBasis', 'flexGrow', 'flexShrink', 'alignSelf', 'minWidth', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical', 'position', 'top', 'left', 'right', 'bottom', 'zIndex'];

function separarEstilos(style) {
  const plano = StyleSheet.flatten(style) || {};
  const externo = {};
  const interno = {};
  Object.entries(plano).forEach(([k, v]) => {
    if (CLAVES_EXTERNAS.includes(k)) externo[k] = v;
    else interno[k] = v;
  });
  // Si el contenedor se estira, la vista interior también debe ocupar todo el espacio
  if (externo.flex || externo.flexGrow || externo.flexBasis) interno.flexGrow = 1;
  return { externo, interno };
}

export default function Pulsable({ style, children, disabled, onPressIn, onPressOut, ...resto }) {
  const escala = useRef(new Animated.Value(1)).current;
  const reducir = useReduceMotion();
  const { externo, interno } = separarEstilos(style);

  const animar = (valor) => {
    if (reducir) return;
    Animated.timing(escala, { toValue: valor, duration: DURACION.rapida, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={(e) => {
        animar(ESCALA_PRESIONADO);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animar(1);
        onPressOut?.(e);
      }}
      hitSlop={4}
      style={externo}
      {...resto}
    >
      <Animated.View
        style={[{ minHeight: TACTIL_MINIMO, transform: [{ scale: escala }] }, disabled && { opacity: 0.5 }, interno]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
