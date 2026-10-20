// Iconos de trazo redondeado dibujados con SVG (sin fuentes de iconos externas).
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { COLORES } from '../theme';

// Cada icono es una lista de elementos SVG en un lienzo de 24×24
const ICONOS = {
  inicio: [<Path key="a" d="M3 11l9-7 9 7" />, <Path key="b" d="M5 10v10h5v-6h4v6h5V10" />],
  control: [
    <Path key="a" d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />,
    <Circle key="b" cx="16" cy="6" r="2" />,
    <Circle key="c" cx="10" cy="12" r="2" />,
    <Circle key="d" cx="18" cy="18" r="2" />,
  ],
  rutinas: [
    <Rect key="a" x="4" y="4" width="16" height="16" rx="4" />,
    <Path key="b" d="M8 9h8M8 13h8M8 17h5" />,
  ],
  historial: [<Path key="a" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />],
  ajustes: [
    <Circle key="a" cx="12" cy="12" r="3" />,
    <Path
      key="b"
      d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"
    />,
  ],
  foco: [
    <Path key="a" d="M9 18h6M10 21h4" />,
    <Path key="b" d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />,
  ],
  musica: [
    <Path key="a" d="M9 18V5l11-2v13" />,
    <Circle key="b" cx="6" cy="18" r="3" />,
    <Circle key="c" cx="17" cy="16" r="3" />,
  ],
  reloj: [<Circle key="a" cx="12" cy="13" r="8" />, <Path key="b" d="M12 9v4l2.5 2.5M10 2h4" />],
  luna: [<Path key="a" d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />],
  sol: [
    <Circle key="a" cx="12" cy="12" r="4" />,
    <Path key="b" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />,
  ],
  apagar: [<Path key="a" d="M12 3v8" />, <Path key="b" d="M6.3 7.3a8 8 0 1 0 11.4 0" />],
  estrella: [<Path key="a" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />],
  corazon: [<Path key="a" d="M12 20s-7-4.4-9-8.6C1.6 8.1 3.6 5 6.8 5c2 0 3.3 1.1 4.2 2.4h2C13.9 6.1 15.2 5 17.2 5c3.2 0 5.2 3.1 3.8 6.4-2 4.2-9 8.6-9 8.6z" />],
  bluetooth: [<Path key="a" d="M7 7l10 10-5 4V3l5 4L7 17" />],
  recargar: [<Path key="a" d="M20 12a8 8 0 1 1-2.3-5.7" />, <Path key="b" d="M20 4v5h-5" />],
  mas: [<Path key="a" d="M12 5v14M5 12h14" />],
  basura: [<Path key="a" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />],
  copiar: [<Rect key="a" x="8" y="8" width="12" height="12" rx="3" />, <Path key="b" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />],
  editar: [<Path key="a" d="M4 20h4L19 9l-4-4L4 16z" />, <Path key="b" d="M13.5 6.5l4 4" />],
  arriba: [<Path key="a" d="M6 15l6-6 6 6" />],
  abajo: [<Path key="a" d="M6 9l6 6 6-6" />],
  atras: [<Path key="a" d="M15 6l-6 6 6 6" />],
  arrastrar: [<Path key="a" d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01" />],
  check: [<Path key="a" d="M5 12.5l4.5 4.5L19 7.5" />],
  alerta: [<Path key="a" d="M12 4L2.5 20h19z" />, <Path key="b" d="M12 10v4M12 17h.01" />],
  info: [<Circle key="a" cx="12" cy="12" r="9" />, <Path key="b" d="M12 11v5M12 8h.01" />],
  cerrar: [<Path key="a" d="M6 6l12 12M18 6L6 18" />],
  play: [<Path key="a" d="M8 5l11 7-11 7z" />],
  volumen: [<Path key="a" d="M4 9v6h4l5 4V5L8 9z" />, <Path key="b" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />],
  tenue: [<Circle key="a" cx="12" cy="12" r="8" />, <Path key="b" d="M12 4a8 8 0 0 1 0 16z" />],
  cargando: [<Path key="a" d="M12 3a9 9 0 1 0 9 9" />],
};

export default function Icono({ nombre, tamano = 24, color = COLORES.texto, grosor = 2 }) {
  const contenido = ICONOS[nombre] || ICONOS.info;
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      importantForAccessibility="no"
    >
      {contenido}
    </Svg>
  );
}
