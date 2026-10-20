// Mensajes breves tipo "toast" (2 s) para confirmar cada acción.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Texto from '../components/Texto';
import Icono from '../components/Icono';
import { COLORES, DURACION, ESPACIO, RADIOS, SOMBRA, TIPO } from '../theme';

const ToastContext = createContext({ mostrar: () => {} });

const ICONO_POR_TIPO = { ok: 'check', error: 'alerta', info: 'info' };
const COLOR_POR_TIPO = { ok: COLORES.verde, error: COLORES.rojo, info: COLORES.azul };
// Altura aproximada de la barra inferior, para que el toast no la tape
const MARGEN_SOBRE_BARRA = 84;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacidad = useRef(new Animated.Value(0)).current;
  const temporizador = useRef(null);
  const insets = useSafeAreaInsets();

  const mostrar = useCallback(
    (mensaje, tipo = 'ok') => {
      clearTimeout(temporizador.current);
      setToast({ mensaje, tipo, id: Date.now() });
      AccessibilityInfo.announceForAccessibility?.(mensaje);
      Animated.timing(opacidad, { toValue: 1, duration: DURACION.rapida, useNativeDriver: true }).start();
      temporizador.current = setTimeout(() => {
        Animated.timing(opacidad, { toValue: 0, duration: DURACION.transicion, useNativeDriver: true }).start(
          () => setToast(null)
        );
      }, DURACION.toast);
    },
    [opacidad]
  );

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.contenedor, { bottom: insets.bottom + MARGEN_SOBRE_BARRA, opacity: opacidad }]}
        >
          <View style={[styles.toast, { borderColor: COLOR_POR_TIPO[toast.tipo] }]}>
            <Icono nombre={ICONO_POR_TIPO[toast.tipo]} color={COLOR_POR_TIPO[toast.tipo]} tamano={20} />
            <Texto style={styles.texto}>{toast.mensaje}</Texto>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  contenedor: { position: 'absolute', left: ESPACIO.l, right: ESPACIO.l, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.s,
    backgroundColor: COLORES.fondoProfundo,
    borderWidth: 1,
    borderRadius: RADIOS.pildora,
    paddingVertical: ESPACIO.m,
    paddingHorizontal: ESPACIO.l,
    maxWidth: '100%',
    ...SOMBRA,
  },
  texto: { fontSize: TIPO.cuerpo, flexShrink: 1 },
});
