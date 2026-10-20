// Control detallado: dial de intensidad, colores, RGB, música/volumen y temporizador.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import Pulsable from '../components/Pulsable';
import Boton from '../components/Boton';
import Chip from '../components/Chip';
import Interruptor from '../components/Interruptor';
import Icono from '../components/Icono';
import Estimado from '../components/Estimado';
import DialIntensidad from '../components/DialIntensidad';
import AnilloTemporizador from '../components/AnilloTemporizador';
import { useLampara } from '../hooks/useLampara';
import { useCuentaRegresiva, formatearTiempo } from '../hooks/useCuentaRegresiva';
import { useVolumen } from '../hooks/useVolumen';
import { comandoColor, escalarColor, rgbAHex, MINUTOS_TEMPORIZADOR, VALOR_RGB_MAX } from '../services/protocolo';
import { abrirAjustesBluetooth } from './ConectarScreen';
import { COLORES, ESPACIO, FUENTES, PRESETS_COLOR, RADIOS, TACTIL_MINIMO, TIPO } from '../theme';

const MS_MINUTO = 60 * 1000;
const MINUTOS_POR_DEFECTO = 45;
const TAMANO_PRESET = 56;

export default function ControlScreen() {
  const {
    ajustes,
    lampara,
    temporizador,
    aplicarColor,
    cambiarAudio,
    iniciarTemporizador,
    cancelarTemporizador,
  } = useLampara();
  const { volumen, cambiarVolumen, disponible: volumenDisponible } = useVolumen();
  const cuenta = useCuentaRegresiva(temporizador);

  const [intensidad, setIntensidad] = useState(lampara.intensidad);
  const [rgb, setRgb] = useState(lampara.color);
  const [arrastrando, setArrastrando] = useState(false);
  const [minutos, setMinutos] = useState(MINUTOS_POR_DEFECTO);

  // Si el estado cambia desde otra pantalla (rutina, etc.), sincronizamos los controles
  useEffect(() => {
    if (!arrastrando) setIntensidad(lampara.intensidad);
  }, [lampara.intensidad, arrastrando]);
  useEffect(() => setRgb(lampara.color), [lampara.color]);

  const colorVista = rgbAHex(escalarColor(rgb, Math.max(intensidad, 15)));
  const comandoPrevio = comandoColor(rgb, intensidad);

  const elegirPreset = (p) => {
    const base = { r: p.r, g: p.g, b: p.b };
    setRgb(base);
    aplicarColor(base, intensidad, { presetId: p.id });
  };

  return (
    <Pantalla
      titulo={`${ajustes.nombreLampara} · ${ajustes.zona}`}
      subtitulo="Control detallado"
      scrollEnabled={!arrastrando}
    >
      {/* Intensidad: se envía K al soltar el dedo */}
      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Intensidad</Texto>
        <DialIntensidad
          valor={intensidad}
          colorVista={colorVista}
          onCambio={setIntensidad}
          onArrastrando={setArrastrando}
          onSoltar={(v) => aplicarColor(rgb, v, { presetId: lampara.presetId })}
        />
        <Texto variante="etiqueta" style={styles.centro}>
          Arrastra el dial y suelta para enviar. La lámpara no tiene brillo propio: se escala el color.
        </Texto>
      </Tarjeta>

      {/* Colores predefinidos */}
      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Colores</Texto>
        <View style={styles.presets}>
          {PRESETS_COLOR.map((p) => {
            const activo = lampara.presetId === p.id;
            return (
              <Pulsable
                key={p.id}
                onPress={() => elegirPreset(p)}
                accessibilityLabel={`Color ${p.nombre}${activo ? ', seleccionado' : ''}`}
                accessibilityState={{ selected: activo }}
                style={styles.preset}
              >
                <View style={[styles.anilloPreset, activo && { borderColor: COLORES.ambar }]}>
                  <View style={[styles.circuloPreset, { backgroundColor: p.hex }]}>
                    {activo && <Icono nombre="check" color={COLORES.texto} grosor={3} />}
                  </View>
                </View>
                <Texto variante="etiqueta" style={activo && { color: COLORES.texto }}>
                  {p.nombre}
                </Texto>
              </Pulsable>
            );
          })}
        </View>

        <Texto variante="negrita" style={{ marginTop: ESPACIO.s }}>
          Color personalizado
        </Texto>
        {[
          { clave: 'r', nombre: 'Rojo', color: '#F87171' },
          { clave: 'g', nombre: 'Verde', color: '#34D399' },
          { clave: 'b', nombre: 'Azul', color: '#60A5FA' },
        ].map((c) => (
          <View key={c.clave}>
            <View style={styles.filaEtiqueta}>
              <Texto variante="cuerpoChico">{c.nombre}</Texto>
              <Texto variante="cuerpoChico" style={{ color: COLORES.texto }}>
                {rgb[c.clave]}
              </Texto>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={VALOR_RGB_MAX}
              step={1}
              value={rgb[c.clave]}
              onValueChange={(v) => setRgb((x) => ({ ...x, [c.clave]: Math.round(v) }))}
              minimumTrackTintColor={c.color}
              maximumTrackTintColor={COLORES.fondoProfundo}
              thumbTintColor={c.color}
              accessibilityLabel={`${c.nombre}, ${rgb[c.clave]} de 255`}
            />
          </View>
        ))}
        <View style={styles.vistaPrevia}>
          <View style={[styles.muestra, { backgroundColor: colorVista }]} />
          <Texto variante="cuerpoChico" style={{ flex: 1 }}>
            Se enviará <Texto style={styles.codigo}>{comandoPrevio}</Texto>
          </Texto>
        </View>
        <Boton titulo="Aplicar color" onPress={() => aplicarColor(rgb, intensidad, { presetId: null })} />
        <Estimado />
      </Tarjeta>

      {/* Música */}
      <Tarjeta style={styles.seccion}>
        <View style={styles.filaEtiqueta}>
          <View style={{ flexDirection: 'row', gap: ESPACIO.s, alignItems: 'center' }}>
            <Icono nombre="musica" color={lampara.audio ? COLORES.ambar : COLORES.textoSecundario} />
            <View>
              <Texto variante="subtitulo">Música</Texto>
              <Texto variante="etiqueta">{lampara.audio ? 'Audio activo (estimado)' : 'Audio apagado (estimado)'}</Texto>
            </View>
          </View>
          <Interruptor valor={lampara.audio} onCambio={(v) => cambiarAudio(v)} accessibilityLabel="Audio de la lámpara" />
        </View>
        <View style={styles.filaEtiqueta}>
          <View style={{ flexDirection: 'row', gap: ESPACIO.s, alignItems: 'center' }}>
            <Icono nombre="volumen" color={COLORES.textoSecundario} tamano={20} />
            <Texto variante="cuerpoChico">Volumen del teléfono</Texto>
          </View>
          <Texto variante="cuerpoChico" style={{ color: COLORES.texto }}>
            {Math.round(volumen * 100)} %
          </Texto>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={volumen}
          onValueChange={cambiarVolumen}
          minimumTrackTintColor={COLORES.ambar}
          maximumTrackTintColor={COLORES.fondoProfundo}
          thumbTintColor={COLORES.ambar}
          disabled={!volumenDisponible}
          accessibilityLabel={`Volumen del teléfono, ${Math.round(volumen * 100)} por ciento`}
        />
        <Texto variante="etiqueta">
          El volumen se controla desde el teléfono. La música llega a la lámpara por Bluetooth como a una bocina.
        </Texto>
        <Boton titulo="Abrir ajustes Bluetooth" icono="bluetooth" variante="secundario" onPress={abrirAjustesBluetooth} />
      </Tarjeta>

      {/* Temporizador */}
      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Temporizador de apagado</Texto>
        <AnilloTemporizador
          progreso={cuenta.activo ? cuenta.progreso : 1}
          texto={cuenta.activo ? cuenta.texto : formatearTiempo(minutos * MS_MINUTO)}
          subtitulo={cuenta.activo ? 'restante' : 'listo para iniciar'}
        />
        <View style={styles.chips}>
          {MINUTOS_TEMPORIZADOR.map((m) => (
            <Chip
              key={m}
              etiqueta={`${m}`}
              activo={minutos === m}
              onPress={() => setMinutos(m)}
              accessibilityLabel={`${m} minutos`}
            />
          ))}
        </View>
        <View style={styles.botones}>
          <Boton titulo="Iniciar" icono="play" style={{ flex: 1 }} onPress={() => iniciarTemporizador(minutos)} accessibilityLabel={`Iniciar temporizador de ${minutos} minutos`} />
          <Boton titulo="Cancelar" variante="peligro" style={{ flex: 1 }} disabled={!cuenta.activo} onPress={() => cancelarTemporizador()} accessibilityLabel="Cancelar temporizador" />
        </View>
        <Estimado texto="La cuenta la lleva la app; si la cierras, se recalcula al volver." />
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: ESPACIO.m },
  centro: { textAlign: 'center' },
  presets: { flexDirection: 'row', justifyContent: 'space-between' },
  preset: { alignItems: 'center', gap: ESPACIO.xs },
  anilloPreset: {
    padding: 3,
    borderRadius: RADIOS.pildora,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  circuloPreset: {
    width: TAMANO_PRESET,
    height: TAMANO_PRESET,
    borderRadius: TAMANO_PRESET / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaEtiqueta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slider: { width: '100%', height: TACTIL_MINIMO },
  vistaPrevia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.m,
    backgroundColor: COLORES.fondoProfundo,
    borderRadius: RADIOS.tarjetaChica,
    padding: ESPACIO.m,
  },
  muestra: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: COLORES.borde },
  codigo: { fontFamily: FUENTES.bold, color: COLORES.ambar, fontSize: TIPO.cuerpoGrande },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.s, justifyContent: 'center' },
  botones: { flexDirection: 'row', gap: ESPACIO.m },
});
