// Protocolo de comandos de la lámpara Arrullú (Arduino Nano + HC-05 a 9600 baudios).
// La lámpara SOLO recibe comandos: no responde nada. Todo estado en la app es estimado.

export const COMANDOS = {
  ENCENDER_LUZ: 'A', // sube gradualmente
  APAGAR_LUZ: 'B', // baja en ~30 s y luego corta el audio
  AUDIO_ON: 'M', // alimenta la placa de audio (PAM8403)
  AUDIO_OFF: 'N', // corta la alimentación de la placa de audio
  CANCELAR_TEMPORIZADOR: 'X',
  PREFIJO_TEMPORIZADOR: 'T', // T<min>, p. ej. T45
  PREFIJO_COLOR: 'K', // K r,g,b, p. ej. K255,150,40
};

export const FIN_DE_LINEA = '\n';

// Separación mínima entre comandos (el buffer del Arduino es pequeño)
export const SEPARACION_MS = 150;
// Pausa extra antes de un comando de temporizador dentro de una rutina
export const PAUSA_ANTES_TEMPORIZADOR_MS = 300;

export const VALOR_RGB_MAX = 255;
export const MINUTOS_TEMPORIZADOR = [15, 30, 45, 60, 90];
export const MINUTOS_TEMPORIZADOR_MAX = 999;

const limitar = (v, min, max) => Math.min(max, Math.max(min, Math.round(v)));

/** Escala un color base según la intensidad (0–100 %). El hardware no tiene comando de brillo. */
export function escalarColor({ r, g, b }, intensidad) {
  const f = limitar(intensidad, 0, 100) / 100;
  return {
    r: limitar(r * f, 0, VALOR_RGB_MAX),
    g: limitar(g * f, 0, VALOR_RGB_MAX),
    b: limitar(b * f, 0, VALOR_RGB_MAX),
  };
}

/** Construye el comando K a partir de un color base y su intensidad. */
export function comandoColor(colorBase, intensidad = 100) {
  const { r, g, b } = escalarColor(colorBase, intensidad);
  return `${COMANDOS.PREFIJO_COLOR}${r},${g},${b}`;
}

export function comandoTemporizador(minutos) {
  return `${COMANDOS.PREFIJO_TEMPORIZADOR}${limitar(minutos, 1, MINUTOS_TEMPORIZADOR_MAX)}`;
}

/** Texto legible de un comando para el historial. */
export function describirComando(cmd) {
  if (cmd === COMANDOS.ENCENDER_LUZ) return 'Luz encendida';
  if (cmd === COMANDOS.APAGAR_LUZ) return 'Luz apagada';
  if (cmd === COMANDOS.AUDIO_ON) return 'Audio encendido';
  if (cmd === COMANDOS.AUDIO_OFF) return 'Audio apagado';
  if (cmd === COMANDOS.CANCELAR_TEMPORIZADOR) return 'Temporizador cancelado';
  if (cmd.startsWith(COMANDOS.PREFIJO_TEMPORIZADOR)) return `Temporizador ${cmd.slice(1)} min`;
  if (cmd.startsWith(COMANDOS.PREFIJO_COLOR)) return `Color ${cmd.slice(1)}`;
  return cmd;
}

/** Convierte r,g,b a #RRGGBB para pintar vistas previas. */
export function rgbAHex({ r, g, b }) {
  const h = (v) => limitar(v, 0, VALOR_RGB_MAX).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}
