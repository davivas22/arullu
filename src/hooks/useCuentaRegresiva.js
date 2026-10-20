// Cuenta regresiva local del temporizador (se recalcula con la hora de inicio guardada).
import { useEffect, useState } from 'react';

const MS_MINUTO = 60 * 1000;
const TIC_MS = 1000;

export function useCuentaRegresiva(temporizador) {
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    if (!temporizador) return undefined;
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), TIC_MS);
    return () => clearInterval(id);
  }, [temporizador]);

  if (!temporizador) return { activo: false, restanteMs: 0, progreso: 0, texto: '00:00' };
  const totalMs = temporizador.minutos * MS_MINUTO;
  const restanteMs = Math.max(0, temporizador.inicio + totalMs - ahora);
  return {
    activo: restanteMs > 0,
    restanteMs,
    progreso: totalMs ? restanteMs / totalMs : 0,
    texto: formatearTiempo(restanteMs),
  };
}

export function formatearTiempo(ms) {
  const totalSeg = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  const dos = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
}
