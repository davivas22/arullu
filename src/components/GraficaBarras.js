// Gráfica de barras en SVG. El día actual (último) se resalta en ámbar.
import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import Texto from './Texto';
import { COLORES, FUENTES } from '../theme';

const ALTO = 160;
const MARGEN_INF = 22;
const MARGEN_SUP = 18;

export default function GraficaBarras({ datos, formato = (v) => (v < 1 ? v.toFixed(2) : v.toFixed(1)), unidad = '' }) {
  const [ancho, setAncho] = useState(0);
  const max = Math.max(...datos.map((d) => d.valor), 0.0001);
  const hueco = ancho / datos.length;
  const anchoBarra = Math.min(28, hueco * 0.6);
  const altoUtil = ALTO - MARGEN_INF - MARGEN_SUP;

  const descripcion = datos.map((d) => `${d.etiqueta}: ${formato(d.valor)} ${unidad}`).join(', ');

  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`Gráfica de barras. ${descripcion}`}
    >
      {ancho > 0 && (
        <Svg width={ancho} height={ALTO}>
          <Line x1={0} x2={ancho} y1={ALTO - MARGEN_INF} y2={ALTO - MARGEN_INF} stroke={COLORES.borde} strokeWidth={1} />
          {datos.map((d, i) => {
            const esHoy = i === datos.length - 1;
            const alto = Math.max(2, (d.valor / max) * altoUtil);
            const x = i * hueco + (hueco - anchoBarra) / 2;
            const y = ALTO - MARGEN_INF - alto;
            const color = esHoy ? COLORES.ambar : COLORES.azul;
            return (
              <React.Fragment key={i}>
                <Rect x={x} y={y} width={anchoBarra} height={alto} rx={8} fill={color} opacity={esHoy ? 1 : 0.75} />
                <SvgText
                  x={x + anchoBarra / 2}
                  y={y - 5}
                  fontSize={12}
                  fontFamily={FUENTES.semibold}
                  fill={COLORES.textoSecundario}
                  textAnchor="middle"
                >
                  {d.valor > 0 ? formato(d.valor) : ''}
                </SvgText>
                <SvgText
                  x={x + anchoBarra / 2}
                  y={ALTO - 5}
                  fontSize={12}
                  fontFamily={esHoy ? FUENTES.bold : FUENTES.semibold}
                  fill={esHoy ? COLORES.ambar : COLORES.textoSecundario}
                  textAnchor="middle"
                >
                  {esHoy ? 'Hoy' : d.etiqueta}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      )}
      {ancho === 0 && <Texto variante="etiqueta">Cargando gráfica…</Texto>}
    </View>
  );
}
