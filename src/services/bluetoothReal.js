// Servicio Bluetooth clásico real (perfil SPP con el HC-05).
// Implementa la misma interfaz que el servicio Demo para que el resto de la app no sepa cuál usa.
// Solo funciona en Android con una development build (no en Expo Go ni en iOS).

import { Platform } from 'react-native';

let RNBluetoothClassic = null;
try {
  // Si el módulo nativo no existe (Expo Go, web, iOS) no rompemos la app: se usa el modo Demo.
  RNBluetoothClassic = require('react-native-bluetooth-classic').default;
} catch (e) {
  RNBluetoothClassic = null;
}

/** Traduce errores técnicos de la librería a mensajes claros para el usuario. */
export function traducirError(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  if (msg.includes('not enabled') || msg.includes('disabled') || msg.includes('adapter')) {
    return { codigo: 'bt_apagado', mensaje: 'El Bluetooth del teléfono está apagado.' };
  }
  if (msg.includes('permission') || msg.includes('permiso')) {
    return { codigo: 'permisos', mensaje: 'Faltan permisos de Bluetooth para conectar.' };
  }
  if (msg.includes('bond') || msg.includes('pair')) {
    return {
      codigo: 'emparejamiento',
      mensaje: 'La lámpara aún no está emparejada. Empareja el HC-05 (PIN 1234 o 0000).',
    };
  }
  if (msg.includes('timeout') || msg.includes('socket') || msg.includes('read failed') || msg.includes('connect')) {
    return {
      codigo: 'fuera_de_alcance',
      mensaje: 'No se encontró la lámpara. Revisa que esté encendida y cerca del teléfono.',
    };
  }
  return { codigo: 'desconocido', mensaje: 'No se pudo completar la acción por Bluetooth.' };
}

export function crearServicioReal() {
  let dispositivoActual = null;
  const suscripciones = [];

  // Crea una suscripción a eventos nativos sin romper la app si el módulo no está enlazado
  const suscribir = (crear) => {
    if (!RNBluetoothClassic) return () => {};
    try {
      const sub = crear();
      suscripciones.push(sub);
      return () => sub?.remove?.();
    } catch (e) {
      return () => {};
    }
  };

  const asegurarModulo = () => {
    if (!RNBluetoothClassic) throw new Error('Bluetooth clásico no disponible en este dispositivo');
  };

  return {
    esDemo: false,

    /** ¿El teléfono tiene Bluetooth clásico y el módulo nativo está cargado? */
    async estaDisponible() {
      if (Platform.OS !== 'android' || !RNBluetoothClassic) return false;
      try {
        return await RNBluetoothClassic.isBluetoothAvailable();
      } catch {
        return false;
      }
    },

    async estaActivado() {
      asegurarModulo();
      return RNBluetoothClassic.isBluetoothEnabled();
    },

    /** Muestra el diálogo del sistema para encender el Bluetooth. */
    async pedirActivar() {
      asegurarModulo();
      return RNBluetoothClassic.requestBluetoothEnabled();
    },

    async listarEmparejados() {
      asegurarModulo();
      const lista = await RNBluetoothClassic.getBondedDevices();
      return lista.map((d) => ({ address: d.address, name: d.name || d.address, emparejado: true }));
    },

    /** Busca dispositivos nuevos (tarda unos 12 s). */
    async buscarNuevos() {
      asegurarModulo();
      const lista = await RNBluetoothClassic.startDiscovery();
      return lista.map((d) => ({ address: d.address, name: d.name || d.address, emparejado: !!d.bonded }));
    },

    async cancelarBusqueda() {
      if (!RNBluetoothClassic) return;
      try {
        await RNBluetoothClassic.cancelDiscovery();
      } catch {
        // Si no había búsqueda en curso no pasa nada
      }
    },

    async emparejar(address) {
      asegurarModulo();
      return RNBluetoothClassic.pairDevice(address);
    },

    async conectar(address) {
      asegurarModulo();
      // Si ya estaba conectado lo reutilizamos
      const yaConectado = await RNBluetoothClassic.isDeviceConnected(address).catch(() => false);
      if (yaConectado) {
        dispositivoActual = await RNBluetoothClassic.getConnectedDevice(address);
      } else {
        dispositivoActual = await RNBluetoothClassic.connectToDevice(address, {
          delimiter: '\n',
          charset: 'ascii',
        });
      }
      return { address: dispositivoActual.address, name: dispositivoActual.name || address };
    },

    async desconectar() {
      if (!dispositivoActual) return;
      try {
        await dispositivoActual.disconnect();
      } finally {
        dispositivoActual = null;
      }
    },

    async estaConectado() {
      if (!dispositivoActual) return false;
      try {
        return await dispositivoActual.isConnected();
      } catch {
        return false;
      }
    },

    /** Escribe texto ASCII en el puerto serie. Lanza error si falla. */
    async escribir(texto) {
      if (!dispositivoActual) throw new Error('Sin conexión con la lámpara');
      const ok = await dispositivoActual.write(texto, 'ascii');
      if (ok === false) throw new Error('El comando no se pudo escribir');
      return true;
    },

    /** Avisa cuando la conexión se cae sin que el usuario la cierre. */
    alDesconectarse(callback) {
      return suscribir(() =>
        RNBluetoothClassic.onDeviceDisconnected((evento) => {
          if (dispositivoActual && evento?.device?.address === dispositivoActual.address) {
            dispositivoActual = null;
            callback();
          }
        })
      );
    },

    /** Avisa cuando el usuario apaga el Bluetooth del teléfono. */
    alApagarBluetooth(callback) {
      return suscribir(() =>
        RNBluetoothClassic.onBluetoothDisabled(() => {
          dispositivoActual = null;
          callback();
        })
      );
    },

    liberar() {
      suscripciones.forEach((s) => s?.remove?.());
      suscripciones.length = 0;
    },
  };
}
