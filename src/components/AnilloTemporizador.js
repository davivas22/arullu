// Anillo de progreso del temporizador con el tiempo restante en el centro.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Texto from './Texto';
import { COLORES, FUENTES } from '../theme';

export default function AnilloTemporizador({ progreso = 0, texto = '00:00', subtitulo, tamano = 180 }) {
  const grosor = 14;
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const desplazamiento = circunferencia * (1 - Math.max(0, Math.min(1, progreso)));

  return (
    <View
      style={{ width: tamano, height: tamano, alignSelf: 'center' }}
      accessible
      accessibilityLabel={`Tiempo restante del temporizador: ${texto}`}
    >
      <Svg width={tamano} height={tamano}>
        <Circle cx={tamano / 2} cy={tamano / 2} r={radio} stroke={COLORES.fondoProfundo} strokeWidth={grosor} fill="none" />
        <Circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          stroke={COLORES.ambar}
          strokeWidth={grosor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={desplazamiento}
          rotation={-90}
          origin={`${tamano / 2}, ${tamano / 2}`}
        />
      </Svg>
      <View style={styles.centro} pointerEvents="none">
        <Texto style={styles.tiempo}>{texto}</Texto>
        {subtitulo ? <Texto variante="etiqueta">{subtitulo}</Texto> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  tiempo: { fontSize: 36, fontFamily: FUENTES.bold, color: COLORES.texto, fontVariant: ['tabular-nums'] },
});

