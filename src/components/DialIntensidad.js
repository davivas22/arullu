// Dial circular de intensidad (0–100 %) que se arrastra con el dedo.
// Solo avisa con onSoltar al levantar el dedo: ahí se envía el comando K.
import React, { useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import Texto from './Texto';
import { COLORES, FUENTES, TIPO } from '../theme';

const TAMANO = 240;
const GROSOR = 22;
const RADIO = (TAMANO - GROSOR) / 2 - 8;
const CENTRO = TAMANO / 2;
const ANGULO_INICIO = 135; // abajo a la izquierda
const RECORRIDO = 270; // grados del arco
const PASO_ACCESIBLE = 10;

const aRad = (g) => (g * Math.PI) / 180;
const punto = (g) => ({ x: CENTRO + RADIO * Math.cos(aRad(g)), y: CENTRO + RADIO * Math.sin(aRad(g)) });

function arco(desde, hasta) {
  if (hasta - desde < 0.5) return '';
  const a = punto(desde);
  const b = punto(hasta);
  const grande = hasta - desde > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${RADIO} ${RADIO} 0 ${grande} 1 ${b.x} ${b.y}`;
}

/** Convierte una posición del dedo (relativa al dial) en un valor 0–100. */
function valorDesdePosicion(x, y) {
  const angulo = (Math.atan2(y - CENTRO, x - CENTRO) * 180) / Math.PI; // -180..180
  let rel = (angulo - ANGULO_INICIO + 720) % 360;
  if (rel > RECORRIDO) rel = rel > (360 + RECORRIDO) / 2 ? 0 : RECORRIDO; // zona muerta inferior
  return Math.round((rel / RECORRIDO) * 100);
}

export default function DialIntensidad({ valor, onCambio, onSoltar, onArrastrando, colorVista = COLORES.ambar }) {
  const origen = useRef({ x: 0, y: 0 });
  const ultimo = useRef(valor);
  // Guardamos los callbacks en refs porque el PanResponder se crea una sola vez
  const cb = useRef({ onCambio, onSoltar, onArrastrando });
  cb.current = { onCambio, onSoltar, onArrastrando };
  const arrastrando = useRef(false);
  if (!arrastrando.current) ultimo.current = valor;

  const terminar = () => {
    arrastrando.current = false;
    cb.current.onArrastrando?.(false);
    cb.current.onSoltar(ultimo.current);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { pageX, pageY, locationX, locationY } = e.nativeEvent;
        origen.current = { x: pageX - locationX, y: pageY - locationY };
        arrastrando.current = true;
        cb.current.onArrastrando?.(true);
        const v = valorDesdePosicion(locationX, locationY);
        ultimo.current = v;
        cb.current.onCambio(v);
      },
      onPanResponderMove: (_, g) => {
        const v = valorDesdePosicion(g.moveX - origen.current.x, g.moveY - origen.current.y);
        if (v !== ultimo.current) {
          ultimo.current = v;
          cb.current.onCambio(v);
        }
      },
      onPanResponderRelease: () => terminar(),
      onPanResponderTerminate: () => terminar(),
    })
  ).current;

  const anguloValor = ANGULO_INICIO + (valor / 100) * RECORRIDO;
  const perilla = punto(anguloValor);

  return (
    <View
      style={styles.contenedor}
      {...pan.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Intensidad de la luz"
      accessibilityValue={{ min: 0, max: 100, now: valor, text: `${valor} %` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const delta = e.nativeEvent.actionName === 'increment' ? PASO_ACCESIBLE : -PASO_ACCESIBLE;
        const v = Math.max(0, Math.min(100, valor + delta));
        onCambio(v);
        onSoltar(v);
      }}
    >
      <Svg width={TAMANO} height={TAMANO} pointerEvents="none">
        <Defs>
          <RadialGradient id="brillo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colorVista} stopOpacity={0.35 * (valor / 100)} />
            <Stop offset="100%" stopColor={colorVista} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={CENTRO} cy={CENTRO} r={RADIO - GROSOR} fill="url(#brillo)" />
        <Path
          d={arco(ANGULO_INICIO, ANGULO_INICIO + RECORRIDO)}
          stroke={COLORES.fondoProfundo}
          strokeWidth={GROSOR}
          strokeLinecap="round"
          fill="none"
        />
        <Path d={arco(ANGULO_INICIO, anguloValor)} stroke={COLORES.ambar} strokeWidth={GROSOR} strokeLinecap="round" fill="none" />
        <Circle cx={perilla.x} cy={perilla.y} r={GROSOR / 2 + 4} fill={COLORES.texto} stroke={COLORES.ambar} strokeWidth={3} />
      </Svg>
      <View style={styles.centro} pointerEvents="none">
        <Texto style={styles.valor}>{valor} %</Texto>
        <Texto variante="etiqueta">Intensidad</Texto>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { width: TAMANO, height: TAMANO, alignSelf: 'center' },
  centro: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  valor: { fontSize: TIPO.valorGrande, fontFamily: FUENTES.bold, color: COLORES.texto },
});
