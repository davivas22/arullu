// Botón tipo píldora. Variantes: primario (ámbar), secundario (contorno), peligro (rojo), texto.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Pulsable from './Pulsable';
import Texto from './Texto';
import Icono from './Icono';
import { COLORES, ESPACIO, FUENTES, RADIOS, TACTIL_MINIMO, TIPO } from '../theme';

const ESTILOS_VARIANTE = {
  primario: { fondo: COLORES.ambar, texto: COLORES.textoSobreAmbar, borde: COLORES.ambar },
  secundario: { fondo: 'transparent', texto: COLORES.texto, borde: COLORES.borde },
  peligro: { fondo: 'transparent', texto: COLORES.rojo, borde: COLORES.rojo },
  exito: { fondo: 'transparent', texto: COLORES.verde, borde: COLORES.verde },
  texto: { fondo: 'transparent', texto: COLORES.textoSecundario, borde: 'transparent' },
};

export default function Boton({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  disabled,
  accessibilityLabel,
  style,
  compacto = false,
  ...resto
}) {
  const v = ESTILOS_VARIANTE[variante];
  return (
    <Pulsable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || titulo}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.boton,
        { backgroundColor: v.fondo, borderColor: v.borde },
        compacto && styles.compacto,
        style,
      ]}
      {...resto}
    >
      <View style={styles.fila}>
        {icono ? <Icono nombre={icono} color={v.texto} tamano={20} /> : null}
        {titulo ? <Texto style={[styles.texto, { color: v.texto }]}>{titulo}</Texto> : null}
      </View>
    </Pulsable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: TACTIL_MINIMO,
    borderRadius: RADIOS.pildora,
    borderWidth: 1.5,
    paddingHorizontal: ESPACIO.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compacto: { paddingHorizontal: ESPACIO.l },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  texto: { fontSize: TIPO.cuerpoGrande, fontFamily: FUENTES.bold },
});
