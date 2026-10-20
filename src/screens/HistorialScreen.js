// Historial y consumo ESTIMADO, calculado con el registro de comandos de la app.
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import Chip from '../components/Chip';
import Boton from '../components/Boton';
import Icono from '../components/Icono';
import Estimado from '../components/Estimado';
import EstadoVacio from '../components/EstadoVacio';
import GraficaBarras from '../components/GraficaBarras';
import { useLampara } from '../hooks/useLampara';
import { COMANDOS, describirComando } from '../services/protocolo';
import {
  EVENTO_FIN_TEMPORIZADOR,
  POTENCIA_BOMBILLA_W,
  historialDeEjemplo,
  horasPorDia,
  resumenConsumo,
} from '../services/consumo';
import { COLORES, ESPACIO, FUENTES, RADIOS, TIPO } from '../theme';

const PERIODOS = [
  { dias: 7, etiqueta: 'Últimos 7 días' },
  { dias: 14, etiqueta: 'Últimos 14 días' },
];
const EVENTOS_RECIENTES = 25;

const formatoHoras = (h) => (h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} h`);
const formatoHora = (iso) => {
  const d = new Date(iso);
  const hoy = new Date().toDateString() === d.toDateString();
  const hh = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  return hoy ? hh : `${d.toLocaleDateString('es', { day: '2-digit', month: 'short' })} ${hh}`;
};

const iconoComando = (c) => {
  if (c === COMANDOS.ENCENDER_LUZ || c === COMANDOS.APAGAR_LUZ || c.startsWith(COMANDOS.PREFIJO_COLOR)) return 'foco';
  if (c === COMANDOS.AUDIO_ON || c === COMANDOS.AUDIO_OFF) return 'musica';
  return 'reloj';
};

export default function HistorialScreen() {
  const { historial, modoDemo, ajustes, borrarHistorial } = useLampara();
  const [dias, setDias] = useState(7);

  // En Modo Demo, si aún no hay datos reales de encendido, se muestran datos de ejemplo
  const hayDatosReales = historial.some((h) => h.comando === COMANDOS.ENCENDER_LUZ && h.resultado === 'ok');
  const usarEjemplo = modoDemo && !hayDatosReales;
  const fuente = useMemo(() => (usarEjemplo ? historialDeEjemplo(dias) : historial), [usarEjemplo, historial, dias]);

  const porDia = useMemo(() => horasPorDia(fuente, dias), [fuente, dias]);
  const resumen = resumenConsumo(porDia, ajustes.potenciaW);
  const recientes = useMemo(() => [...fuente].reverse().slice(0, EVENTOS_RECIENTES), [fuente]);

  const confirmarBorrado = () =>
    Alert.alert('Borrar historial', 'Se eliminarán todos los registros de comandos. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: borrarHistorial },
    ]);

  return (
    <Pantalla titulo="Historial" subtitulo="Uso y consumo de la lámpara">
      <View style={styles.periodos}>
        {PERIODOS.map((p) => (
          <Chip key={p.dias} etiqueta={p.etiqueta} activo={dias === p.dias} onPress={() => setDias(p.dias)} />
        ))}
      </View>

      <View style={styles.etiquetas}>
        {usarEjemplo && (
          <View style={[styles.sello, { borderColor: COLORES.azul }]}>
            <Texto style={[styles.selloTexto, { color: COLORES.azul }]}>Datos de ejemplo</Texto>
          </View>
        )}
        <Estimado texto="Calculado por la app, no medido por la lámpara" />
      </View>

      <View style={styles.resumen}>
        <Resumen icono="sol" titulo="Luz hoy" valor={formatoHoras(resumen.horasHoy)} />
        <Resumen icono="luna" titulo={`Luz ${dias} días`} valor={formatoHoras(resumen.horasPeriodo)} />
        <Resumen icono="foco" titulo={`Consumo (${ajustes.potenciaW} W)`} valor={`${resumen.consumoWh.toFixed(1)} Wh`} />
        <Resumen
          icono="estrella"
          titulo={`Ahorro vs ${POTENCIA_BOMBILLA_W} W`}
          valor={`${resumen.ahorroKWh.toFixed(3)} kWh`}
          destacado
        />
      </View>

      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Horas de luz por día</Texto>
        <GraficaBarras datos={porDia.map((d) => ({ etiqueta: d.etiqueta, valor: d.horas }))} unidad="horas" />
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Consumo estimado por día (Wh)</Texto>
        <GraficaBarras
          datos={porDia.map((d) => ({ etiqueta: d.etiqueta, valor: d.horas * ajustes.potenciaW }))}
          unidad="vatios hora"
        />
      </Tarjeta>

      <Texto variante="subtitulo">Eventos recientes</Texto>
      {recientes.length === 0 ? (
        <EstadoVacio
          icono="historial"
          titulo="Aún no hay eventos"
          mensaje="Cuando enciendas la lámpara o uses una rutina, lo verás aquí."
        />
      ) : (
        <Tarjeta style={{ gap: ESPACIO.s }}>
          {recientes.map((h) => (
            <View key={h.id} style={styles.evento}>
              <Icono
                nombre={h.resultado === 'ok' ? iconoComando(h.comando) : 'alerta'}
                color={h.resultado === 'ok' ? COLORES.textoSecundario : COLORES.rojo}
                tamano={20}
              />
              <Texto variante="cuerpoChico" style={{ flex: 1, color: COLORES.texto }}>
                {h.comando === EVENTO_FIN_TEMPORIZADOR ? 'Temporizador terminado' : describirComando(h.comando)}
                {h.resultado !== 'ok' ? ' · no enviado' : ''}
              </Texto>
              <Texto variante="etiqueta">{formatoHora(h.fecha)}</Texto>
            </View>
          ))}
        </Tarjeta>
      )}

      {!usarEjemplo && historial.length > 0 && (
        <Boton titulo="Borrar historial" icono="basura" variante="peligro" onPress={confirmarBorrado} />
      )}
    </Pantalla>
  );
}

function Resumen({ icono, titulo, valor, destacado }) {
  return (
    <Tarjeta style={styles.tarjetaResumen} accessible accessibilityLabel={`${titulo}: ${valor}, estimado`}>
      <Icono nombre={icono} color={destacado ? COLORES.verde : COLORES.ambar} tamano={22} />
      <Texto variante="etiqueta">{titulo}</Texto>
      <Texto style={styles.valor}>{valor}</Texto>
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  periodos: { flexDirection: 'row', gap: ESPACIO.s, flexWrap: 'wrap' },
  etiquetas: { gap: ESPACIO.s },
  sello: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIOS.pildora,
    paddingHorizontal: ESPACIO.m,
    paddingVertical: 2,
  },
  selloTexto: { fontSize: TIPO.etiqueta, fontFamily: FUENTES.bold },
  resumen: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.m },
  tarjetaResumen: { flexBasis: '47%', flexGrow: 1, gap: ESPACIO.xs, padding: ESPACIO.m },
  valor: { fontSize: TIPO.subtitulo, fontFamily: FUENTES.bold, color: COLORES.texto },
  seccion: { gap: ESPACIO.m },
  evento: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s, minHeight: 32 },
});
