// Tres puntos ámbar que pulsan en secuencia (160 ms de retraso entre cada uno).
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORES, DURACION } from '../theme';

const TAMANO = 12;
const DURACION_PULSO = 480;

export default function PuntosCarga({ reducirMovimiento }) {
  const valores = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (reducirMovimiento) {
      valores.forEach((v) => v.setValue(1));
      return undefined;
    }
    const animaciones = valores.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * DURACION.pulsoPuntos),
          Animated.timing(v, { toValue: 1, duration: DURACION_PULSO, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: DURACION_PULSO, useNativeDriver: true }),
          Animated.delay((valores.length - 1 - i) * DURACION.pulsoPuntos),
        ])
      )
    );
    animaciones.forEach((a) => a.start());
    return () => animaciones.forEach((a) => a.stop());
  }, [reducirMovimiento, valores]);

  return (
    <View style={styles.fila} accessible accessibilityLabel="Cargando" accessibilityRole="progressbar">
      {valores.map((v, i) => (
        <Animated.View
          key={i}
          style={[styles.punto, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.15] }) }] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  punto: { width: TAMANO, height: TAMANO, borderRadius: TAMANO / 2, backgroundColor: COLORES.ambar },
});
