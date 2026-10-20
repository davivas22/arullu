// Equivalente a prefers-reduced-motion: si está activo se desactivan las animaciones decorativas.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion() {
  const [reducir, setReducir] = useState(false);
  useEffect(() => {
    let activo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => activo && setReducir(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReducir(!!v));
    return () => {
      activo = false;
      sub?.remove?.();
    };
  }, []);
  return reducir;
}
