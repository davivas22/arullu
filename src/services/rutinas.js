// Definición de rutinas: tipos de paso, rutinas de fábrica y utilidades.
// Cada paso se traduce a un comando real del protocolo (o a una espera local).

import { PRESETS_COLOR } from '../theme';

export const TIPOS_PASO = {
  LUZ_ON: 'luz_on',
  LUZ_OFF: 'luz_off',
  COLOR: 'color',
  AUDIO_ON: 'audio_on',
  AUDIO_OFF: 'audio_off',
  TEMPORIZADOR: 'temporizador',
  CANCELAR_TEMPORIZADOR: 'cancelar_temporizador',
  ESPERAR: 'esperar',
};

// Catálogo para el editor (etiqueta + valores por defecto)
export const CATALOGO_PASOS = [
  { tipo: TIPOS_PASO.LUZ_ON, etiqueta: 'Encender luz' },
  { tipo: TIPOS_PASO.LUZ_OFF, etiqueta: 'Apagar luz' },
  { tipo: TIPOS_PASO.COLOR, etiqueta: 'Color y porcentaje', defecto: { preset: 'calido', porcentaje: 40 } },
  { tipo: TIPOS_PASO.AUDIO_ON, etiqueta: 'Audio encendido' },
  { tipo: TIPOS_PASO.AUDIO_OFF, etiqueta: 'Audio apagado' },
  { tipo: TIPOS_PASO.TEMPORIZADOR, etiqueta: 'Temporizador (minutos)', defecto: { minutos: 45 } },
  { tipo: TIPOS_PASO.CANCELAR_TEMPORIZADOR, etiqueta: 'Cancelar temporizador' },
  { tipo: TIPOS_PASO.ESPERAR, etiqueta: 'Esperar (segundos)', defecto: { segundos: 5 } },
];

export const ICONOS_RUTINA = ['luna', 'foco', 'apagar', 'estrella', 'corazon', 'musica'];

export const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // índice = Date.getDay()

export const presetPorId = (id) => PRESETS_COLOR.find((p) => p.id === id) || PRESETS_COLOR[0];

/** Texto legible de un paso, p. ej. "Color cálido al 40 %". */
export function describirPaso(paso) {
  switch (paso.tipo) {
    case TIPOS_PASO.LUZ_ON:
      return 'Encender luz';
    case TIPOS_PASO.LUZ_OFF:
      return 'Apagar luz';
    case TIPOS_PASO.COLOR:
      return `Color ${presetPorId(paso.preset).nombre.toLowerCase()} al ${paso.porcentaje} %`;
    case TIPOS_PASO.AUDIO_ON:
      return 'Audio encendido';
    case TIPOS_PASO.AUDIO_OFF:
      return 'Audio apagado';
    case TIPOS_PASO.TEMPORIZADOR:
      return `Iniciar temporizador de ${paso.minutos} minutos`;
    case TIPOS_PASO.CANCELAR_TEMPORIZADOR:
      return 'Cancelar temporizador';
    case TIPOS_PASO.ESPERAR:
      return `Esperar ${paso.segundos} s`;
    default:
      return 'Paso desconocido';
  }
}

export const ID_HORA_DORMIR = 'fabrica-dormir';
export const ID_LUZ_NOCHE = 'fabrica-noche';
export const ID_APAGAR_TODO = 'fabrica-apagar';

export const RUTINAS_FABRICA = [
  {
    id: ID_HORA_DORMIR,
    nombre: 'Hora de dormir',
    icono: 'luna',
    resumen: 'Luz tenue, música y 45 min',
    hora: null,
    dias: [],
    pasos: [
      { tipo: TIPOS_PASO.LUZ_ON },
      { tipo: TIPOS_PASO.COLOR, preset: 'calido', porcentaje: 40 },
      { tipo: TIPOS_PASO.AUDIO_ON },
      { tipo: TIPOS_PASO.TEMPORIZADOR, minutos: 45 },
    ],
  },
  {
    id: ID_LUZ_NOCHE,
    nombre: 'Luz de noche',
    icono: 'foco',
    resumen: 'Cálido al 20 %',
    hora: null,
    dias: [],
    pasos: [{ tipo: TIPOS_PASO.LUZ_ON }, { tipo: TIPOS_PASO.COLOR, preset: 'calido', porcentaje: 20 }],
  },
  {
    id: ID_APAGAR_TODO,
    nombre: 'Apagar todo',
    icono: 'apagar',
    resumen: 'Luz, audio y temporizador',
    hora: null,
    dias: [],
    pasos: [
      { tipo: TIPOS_PASO.CANCELAR_TEMPORIZADOR },
      { tipo: TIPOS_PASO.LUZ_OFF },
      { tipo: TIPOS_PASO.AUDIO_OFF },
    ],
  },
];

export const nuevoId = () => `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Resumen corto para la tarjeta si la rutina no trae uno propio. */
export function resumenRutina(rutina) {
  if (rutina.resumen) return rutina.resumen;
  if (!rutina.pasos?.length) return 'Sin pasos';
  return rutina.pasos.slice(0, 2).map(describirPaso).join(', ') + (rutina.pasos.length > 2 ? '…' : '');
}

/** Valida "HH:MM" (24 h). */
export const horaValida = (h) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h || '');
