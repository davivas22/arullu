// Interruptor grande con animación de deslizamiento. Acompaña el color con texto "Sí/No"
// para no depender solo del color.
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { COLORES, DURACION, FUENTES, TACTIL_MINIMO } from '../theme';
import { useReduceMotion } from '../hooks/useReduceMotion';
import Texto from './Texto';

const ANCHO = 64;
const ALTO = 36;
const PERILLA = 28;
const MARGEN = 4;

export default function Interruptor({
  valor,
  onCambio,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  colorActivo = COLORES.ambar,
  colorMarcaActiva = COLORES.textoSobreAmbar,
  disabled,
}) {
  const anim = useRef(new Animated.Value(valor ? 1 : 0)).current;
  const reducir = useReduceMotion();

  useEffect(() => {
    if (reducir) anim.setValue(valor ? 1 : 0);
    else Animated.timing(anim, { toValue: valor ? 1 : 0, duration: DURACION.transicion, useNativeDriver: false }).start();
  }, [valor, reducir, anim]);

  const x = anim.interpolate({ inputRange: [0, 1], outputRange: [MARGEN, ANCHO - PERILLA - MARGEN] });
  const fondo = anim.interpolate({ inputRange: [0, 1], outputRange: [COLORES.fondoProfundo, colorActivo] });

  return (
    <Pressable
      onPress={() => !disabled && onCambio?.(!valor)}
      onLongPress={onLongPress}
      delayLongPress={600}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!valor, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={8}
      style={styles.area}
    >
      <Animated.View style={[styles.pista, { backgroundColor: fondo }, disabled && { opacity: 0.5 }]}>
        <Texto style={[styles.marca, valor ? [styles.marcaIzq, { color: colorMarcaActiva }] : styles.marcaDer]}>{valor ? 'Sí' : 'No'}</Texto>
        <Animated.View style={[styles.perilla, { transform: [{ translateX: x }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: { minHeight: TACTIL_MINIMO, minWidth: TACTIL_MINIMO, justifyContent: 'center' },
  pista: {
    width: ANCHO,
    height: ALTO,
    borderRadius: ALTO / 2,
    borderWidth: 1,
    borderColor: COLORES.borde,
    justifyContent: 'center',
  },
  perilla: {
    position: 'absolute',
    width: PERILLA,
    height: PERILLA,
    borderRadius: PERILLA / 2,
    backgroundColor: COLORES.texto,
  },
  marca: { position: 'absolute', fontSize: 12, fontFamily: FUENTES.bold },
  marcaIzq: { left: 10 },
  marcaDer: { right: 10, color: COLORES.textoSecundario },
});
