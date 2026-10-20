// Volumen multimedia del TELÉFONO (la lámpara no tiene comando de volumen).
// La música llega a la placa de audio por Bluetooth como si fuera una bocina.
import { useCallback, useEffect, useState } from 'react';

let VolumeManager = null;
try {
  VolumeManager = require('react-native-volume-manager').VolumeManager;
} catch {
  VolumeManager = null;
}

export function useVolumen() {
  const [volumen, setVolumenLocal] = useState(0.5);
  const [disponible, setDisponible] = useState(!!VolumeManager);

  useEffect(() => {
    if (!VolumeManager) return undefined;
    let sub;
    VolumeManager.getVolume()
      .then((r) => setVolumenLocal(typeof r === 'number' ? r : r?.volume ?? 0.5))
      .catch(() => setDisponible(false));
    try {
      sub = VolumeManager.addVolumeListener((r) => setVolumenLocal(r.volume));
    } catch {
      setDisponible(false);
    }
    return () => sub?.remove?.();
  }, []);

  const cambiarVolumen = useCallback(async (valor) => {
    setVolumenLocal(valor);
    if (!VolumeManager) return;
    try {
      await VolumeManager.setVolume(valor, { type: 'music', showUI: false, playSound: false });
    } catch {
      setDisponible(false);
    }
  }, []);

  return { volumen, cambiarVolumen, disponible };
}
