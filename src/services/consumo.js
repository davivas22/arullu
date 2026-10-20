// Cálculo de horas de luz y consumo ESTIMADO a partir del registro de comandos de la app.
// No es una medición de la lámpara: se basa en los comandos A (encender) y B (apagar)
// enviados con éxito, y en el fin de los temporizadores.

import { COMANDOS } from './protocolo';

export const EVENTO_FIN_TEMPORIZADOR = 'FIN_TEMPORIZADOR';
export const POTENCIA_BOMBILLA_W = 40; // referencia para calcular el ahorro
const MS_HORA = 3600 * 1000;
const MS_DIA = 24 * MS_HORA;

const inicioDelDia = (fecha) => {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Devuelve intervalos [inicio, fin] en ms en los que la luz estuvo (estimadamente) encendida. */
export function intervalosEncendido(historial, ahora = Date.now()) {
  const eventos = historial
    .filter((h) => h.resultado === 'ok')
    .map((h) => ({ t: new Date(h.fecha).getTime(), c: h.comando }))
    .sort((a, b) => a.t - b.t);

  const intervalos = [];
  let inicio = null;
  for (const e of eventos) {
    if (e.c === COMANDOS.ENCENDER_LUZ) {
      if (inicio === null) inicio = e.t;
    } else if (e.c === COMANDOS.APAGAR_LUZ || e.c === EVENTO_FIN_TEMPORIZADOR) {
      if (inicio !== null) {
        intervalos.push([inicio, e.t]);
        inicio = null;
      }
    }
  }
  if (inicio !== null) intervalos.push([inicio, ahora]);
  return intervalos;
}

/**
 * Horas de luz por día para los últimos `dias` días (el último elemento es hoy).
 * @returns {{fecha:number, etiqueta:string, horas:number}[]}
 */
export function horasPorDia(historial, dias = 7, ahora = Date.now()) {
  const hoy = inicioDelDia(ahora);
  const resultado = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = hoy - i * MS_DIA;
    resultado.push({ fecha, etiqueta: etiquetaDia(fecha), horas: 0 });
  }
  for (const [a, b] of intervalosEncendido(historial, ahora)) {
    for (const dia of resultado) {
      const ini = Math.max(a, dia.fecha);
      const fin = Math.min(b, dia.fecha + MS_DIA);
      if (fin > ini) dia.horas += (fin - ini) / MS_HORA;
    }
  }
  return resultado;
}

const NOMBRES_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const etiquetaDia = (ms) => NOMBRES_DIA[new Date(ms).getDay()];

/** Resumen para las tarjetas del Historial. */
export function resumenConsumo(porDia, potenciaW) {
  const horasHoy = porDia[porDia.length - 1]?.horas || 0;
  const horasPeriodo = porDia.reduce((s, d) => s + d.horas, 0);
  const consumoWh = horasPeriodo * potenciaW;
  const ahorroKWh = (horasPeriodo * Math.max(0, POTENCIA_BOMBILLA_W - potenciaW)) / 1000;
  return { horasHoy, horasPeriodo, consumoWh, ahorroKWh };
}

/** Historial de ejemplo para el Modo Demo (se rotula como "Datos de ejemplo"). */
export function historialDeEjemplo(dias = 14, ahora = Date.now()) {
  const salida = [];
  const hoy = inicioDelDia(ahora);
  // Patrón fijo para que la gráfica se vea estable
  const patron = [
    [20.5, 2.5], [20.75, 3], [21, 1.75], [20.25, 4], [20.5, 2], [21.25, 2.75], [20, 3.5],
  ];
  for (let i = dias - 1; i >= 0; i--) {
    const [horaIni, duracion] = patron[i % patron.length];
    const ini = hoy - i * MS_DIA + horaIni * MS_HORA;
    const fin = ini + duracion * MS_HORA;
    if (ini > ahora) continue;
    salida.push({ id: `demo-a-${i}`, fecha: new Date(ini).toISOString(), comando: COMANDOS.ENCENDER_LUZ, resultado: 'ok' });
    salida.push({ id: `demo-m-${i}`, fecha: new Date(ini + 60000).toISOString(), comando: COMANDOS.AUDIO_ON, resultado: 'ok' });
    salida.push({ id: `demo-t-${i}`, fecha: new Date(ini + 120000).toISOString(), comando: 'T45', resultado: 'ok' });
    if (fin <= ahora) {
      salida.push({ id: `demo-b-${i}`, fecha: new Date(fin).toISOString(), comando: COMANDOS.APAGAR_LUZ, resultado: 'ok' });
    }
  }
  return salida;
}
