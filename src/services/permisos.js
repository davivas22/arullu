// Permisos de Bluetooth en Android.
// Android 12+ (API 31): BLUETOOTH_CONNECT y BLUETOOTH_SCAN. Antes: ACCESS_FINE_LOCATION.

import { PermissionsAndroid, Platform } from 'react-native';

const API_ANDROID_12 = 31;

function permisosNecesarios() {
  if (Platform.OS !== 'android') return [];
  if (Platform.Version >= API_ANDROID_12) {
    return [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ];
  }
  return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
}

/** ¿Ya están concedidos todos los permisos? (no muestra ningún diálogo) */
export async function tienePermisos() {
  const lista = permisosNecesarios();
  if (lista.length === 0) return true;
  try {
    const resultados = await Promise.all(lista.map((p) => PermissionsAndroid.check(p)));
    return resultados.every(Boolean);
  } catch {
    return false;
  }
}

/**
 * Pide los permisos con el diálogo del sistema.
 * Devuelve 'concedidos', 'denegados' o 'bloqueados' (el usuario marcó "No volver a preguntar").
 */
export async function pedirPermisos() {
  const lista = permisosNecesarios();
  if (lista.length === 0) return 'concedidos';
  try {
    const res = await PermissionsAndroid.requestMultiple(lista);
    const valores = Object.values(res);
    if (valores.every((v) => v === PermissionsAndroid.RESULTS.GRANTED)) return 'concedidos';
    if (valores.some((v) => v === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)) return 'bloqueados';
    return 'denegados';
  } catch {
    return 'denegados';
  }
}
