// Pantalla de carga: logo con fundido + escalado (0.94 → 1, 900 ms), flotación suave
// de 8 px (ciclo de 4 s) y tres puntos ámbar. Mínimo 1.5 s visible o hasta que el usuario toque.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import PuntosCarga from '../components/PuntosCarga';
import Texto from '../components/Texto';
import { useLampara } from '../hooks/useLampara';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { COLORES, DURACION, ESPACIO, TIPO } from '../theme';

const TIEMPO_MINIMO_MS = 1500;
const FLOTACION_PX = 8;
const ESCALA_INICIAL = 0.94;
const ANCHO_LOGO_MAX = 300;

export default function SplashScreen({ navigation }) {
  const { cargado, permisosOk, modoDemo } = useLampara();
  const reducir = useReduceMotion();
  const { width } = useWindowDimensions();
  const [minimoCumplido, setMinimoCumplido] = useState(false);
  const [tocado, setTocado] = useState(false);
  const salio = useRef(false);

  const opacidad = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(ESCALA_INICIAL)).current;
  const flotar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => setMinimoCumplido(true), TIEMPO_MINIMO_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reducir) {
      opacidad.setValue(1);
      escala.setValue(1);
      return undefined;
    }
    Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: DURACION.entradaSplash, useNativeDriver: true }),
      Animated.timing(escala, {
        toValue: 1,
        duration: DURACION.entradaSplash,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(flotar, { toValue: 1, duration: DURACION.flotarSplash / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flotar, { toValue: 0, duration: DURACION.flotarSplash / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [reducir, opacidad, escala, flotar]);

  // Pasa sola a Inicio cuando termina de cargar (o antes si el usuario toca)
  useEffect(() => {
    if (salio.current || !cargado || !(minimoCumplido || tocado)) return;
    salio.current = true;
    // En Modo Demo no hacen falta permisos; con hardware real se explican antes de pedirlos
    navigation.replace(permisosOk || modoDemo ? 'Principal' : 'Permisos');
  }, [cargado, minimoCumplido, tocado, permisosOk, modoDemo, navigation]);

  const anchoLogo = Math.min(width * 0.75, ANCHO_LOGO_MAX);
  const desplazamiento = flotar.interpolate({ inputRange: [0, 1], outputRange: [FLOTACION_PX / 2, -FLOTACION_PX / 2] });

  return (
    <Pressable
      style={styles.fondo}
      onPress={() => setTocado(true)}
      accessibilityRole="button"
      accessibilityLabel="Arrullú. Toca para continuar"
    >
      <View style={styles.centro}>
        <Animated.View style={{ opacity: opacidad, transform: [{ scale: escala }, { translateY: desplazamiento }] }}>
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: anchoLogo, height: anchoLogo }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            accessibilityLabel="Logo de Arrullú: nube dormida con luna y sol. Acompañamiento Nocturno e Iluminación"
          />
        </Animated.View>
        <View style={{ marginTop: ESPACIO.xl }}>
          <PuntosCarga reducirMovimiento={reducir} />
        </View>
      </View>
      <Texto style={styles.pie}>Toca para continuar</Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: COLORES.fondo, alignItems: 'center', justifyContent: 'center' },
  centro: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  pie: { color: COLORES.textoSecundario, fontSize: TIPO.etiqueta, marginBottom: ESPACIO.xxl * 1.5 },
});
