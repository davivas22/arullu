// Persistencia local con AsyncStorage: dispositivo, ajustes, rutinas, historial y último estado.

import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVES = {
  dispositivo: '@arrullu/dispositivo',
  ajustes: '@arrullu/ajustes',
  rutinas: '@arrullu/rutinas',
  historial: '@arrullu/historial',
  estado: '@arrullu/estado',
  permisosExplicados: '@arrullu/permisosExplicados',
};

// Límite del historial para que no crezca sin fin
export const MAX_HISTORIAL = 3000;

export const AJUSTES_POR_DEFECTO = {
  nombreLampara: 'Lámpara Arrullú',
  zona: 'Dormitorio',
  reintento: false,
  potenciaW: 1.5,
  modoDemo: false,
  luzTenue: false,
  rutinaRapidaId: null, // cuarto acceso configurable del Inicio
};

async function leer(clave, porDefecto) {
  try {
    const crudo = await AsyncStorage.getItem(clave);
    return crudo == null ? porDefecto : JSON.parse(crudo);
  } catch (e) {
    console.warn('Error leyendo', clave, e);
    return porDefecto;
  }
}

async function escribir(clave, valor) {
  try {
    if (valor == null) await AsyncStorage.removeItem(clave);
    else await AsyncStorage.setItem(clave, JSON.stringify(valor));
  } catch (e) {
    console.warn('Error guardando', clave, e);
  }
}

export const almacen = {
  leerDispositivo: () => leer(CLAVES.dispositivo, null),
  guardarDispositivo: (d) => escribir(CLAVES.dispositivo, d),

  leerAjustes: async () => ({ ...AJUSTES_POR_DEFECTO, ...(await leer(CLAVES.ajustes, {})) }),
  guardarAjustes: (a) => escribir(CLAVES.ajustes, a),

  leerRutinas: () => leer(CLAVES.rutinas, null),
  guardarRutinas: (r) => escribir(CLAVES.rutinas, r),

  leerHistorial: () => leer(CLAVES.historial, []),
  guardarHistorial: (h) => escribir(CLAVES.historial, h.slice(-MAX_HISTORIAL)),

  leerEstado: () => leer(CLAVES.estado, null),
  guardarEstado: (e) => escribir(CLAVES.estado, e),

  leerPermisosExplicados: () => leer(CLAVES.permisosExplicados, false),
  guardarPermisosExplicados: (v) => escribir(CLAVES.permisosExplicados, v),
};
