// Tema visual "noche" de Arrullú: colores, tipografía, radios y espaciados.
// Todas las pantallas toman sus valores de aquí (nada de números mágicos sueltos).

export const COLORES = {
  fondo: '#1E1B4B', // índigo principal
  fondoProfundo: '#151338', // barra inferior y sombras
  superficie: '#3D3A85', // tarjetas
  borde: '#7C78C9', // borde sutil de tarjetas
  texto: '#F8FAFC',
  textoSecundario: '#C7D2FE',
  ambar: '#FBBF24', // luz encendida, primarios, progreso
  ambarSuave: 'rgba(251, 191, 36, 0.18)',
  verde: '#34D399', // conectada / correcto
  rojo: '#F87171', // error / apagar
  azul: '#60A5FA', // acento frío
  textoSobreAmbar: '#1E1B4B',
  velo: 'rgba(0, 0, 0, 0.55)',
  superficieApagada: '#2B2870', // tarjeta de lámpara apagada (índigo)
};

// Presets de color de la lámpara (valores que se envían con K r,g,b)
export const PRESETS_COLOR = [
  { id: 'calido', nombre: 'Cálido', r: 255, g: 150, b: 40, hex: '#FF9628' },
  { id: 'rosa', nombre: 'Rosa', r: 255, g: 60, b: 120, hex: '#FF3C78' },
  { id: 'azul', nombre: 'Azul', r: 30, g: 80, b: 255, hex: '#1E50FF' },
  { id: 'verde', nombre: 'Verde', r: 0, g: 200, b: 80, hex: '#00C850' },
];

export const FUENTES = {
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
};

// Tamaños tipográficos (mínimo 12 px en toda la app)
export const TIPO = {
  titulo: 30,
  subtitulo: 20,
  cuerpoGrande: 16,
  cuerpo: 14,
  etiqueta: 13,
  minimo: 12,
  valorGrande: 44,
};

export const RADIOS = {
  tarjeta: 24,
  tarjetaGrande: 28,
  tarjetaChica: 20,
  pildora: 999,
};

export const ESPACIO = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

// Objetivo táctil mínimo recomendado (accesibilidad)
export const TACTIL_MINIMO = 48;

// Duraciones de animación (lentas y suaves para uso nocturno)
export const DURACION = {
  rapida: 150,
  transicion: 300,
  toast: 2000,
  entradaSplash: 900,
  flotarSplash: 4000,
  pulsoPuntos: 160,
};

// Sombras suaves
export const SOMBRA = {
  shadowColor: '#000',
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

export const RESPLANDOR_AMBAR = {
  shadowColor: COLORES.ambar,
  shadowOpacity: 0.7,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 0 },
  elevation: 14,
};
