// Cola de comandos: garantiza 150 ms entre envíos (el Arduino tiene un buffer pequeño)
// y, si está activado el "Reintento", manda cada comando dos veces.

import { FIN_DE_LINEA, SEPARACION_MS } from './protocolo';

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {object} opciones
 * @param {(texto:string)=>Promise<any>} opciones.escribir  función que escribe en el puerto serie
 * @param {()=>boolean} opciones.usarReintento  lee el ajuste "Reintento" en el momento del envío
 * @param {(cmd:string, ok:boolean, error?:any)=>void} opciones.alRegistrar  guarda en el historial
 */
export function crearCola({ escribir, usarReintento, alRegistrar }) {
  let cadena = Promise.resolve();
  let ultimoEnvio = 0;

  /** Encola un comando. Devuelve una promesa con true/false según el resultado. */
  return function encolar(cmd, { pausaPrevia = 0 } = {}) {
    const tarea = cadena.then(async () => {
      const espera = Math.max(0, ultimoEnvio + SEPARACION_MS - Date.now()) + pausaPrevia;
      if (espera > 0) await dormir(espera);

      const veces = usarReintento() ? 2 : 1;
      let algunoOk = false;
      let ultimoError = null;
      for (let i = 0; i < veces; i++) {
        if (i > 0) await dormir(SEPARACION_MS);
        try {
          await escribir(cmd + FIN_DE_LINEA);
          algunoOk = true;
        } catch (e) {
          ultimoError = e;
        }
        ultimoEnvio = Date.now();
      }
      alRegistrar(cmd, algunoOk, algunoOk ? null : ultimoError);
      return algunoOk;
    });
    // Un fallo no debe bloquear los comandos siguientes
    cadena = tarea.catch(() => {});
    return tarea;
  };
}
