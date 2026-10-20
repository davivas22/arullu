// Chip de estado de conexión: punto de color + texto (no depende solo del color).
// Al tocarlo reconecta (o abre Conectar si no hay lámpara guardada).
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Pulsable from './Pulsable';
import Texto from './Texto';
import Icono from './Icono';
import { useLampara, ESTADOS_CONEXION } from '../hooks/useLampara';
import { COLORES, ESPACIO, FUENTES, RADIOS, TIPO } from '../theme';

const PRESENTACION = {
  [ESTADOS_CONEXION.CONECTADA]: { texto: 'Conectada', color: COLORES.verde, icono: 'check' },
  [ESTADOS_CONEXION.CONECTANDO]: { texto: 'Conectando…', color: COLORES.azul, icono: null },
  [ESTADOS_CONEXION.DESCONECTADA]: { texto: 'Desconectada', color: COLORES.rojo, icono: 'alerta' },
  [ESTADOS_CONEXION.ERROR]: { texto: 'Error', color: COLORES.rojo, icono: 'alerta' },
};

export default function ChipConexion({ onPress }) {
  const { conexion } = useLampara();
  const p = PRESENTACION[conexion.estado];
  return (
    <Pulsable
      onPress={onPress}
      accessibilityLabel={`Estado de la lámpara: ${p.texto}. Toca para ${
        conexion.estado === ESTADOS_CONEXION.CONECTADA ? 'ver opciones de conexión' : 'reconectar'
      }`}
      style={[styles.chip, { borderColor: p.color }]}
    >
      <View style={styles.fila}>
        {conexion.estado === ESTADOS_CONEXION.CONECTANDO ? (
          <ActivityIndicator size="small" color={p.color} />
        ) : (
          <View style={[styles.punto, { backgroundColor: p.color }]} />
        )}
        <Texto style={[styles.texto, { color: p.color }]}>{p.texto}</Texto>
        {p.icono && conexion.estado !== ESTADOS_CONEXION.CONECTADA ? (
          <Icono nombre="recargar" tamano={16} color={p.color} />
        ) : null}
      </View>
    </Pulsable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderRadius: RADIOS.pildora,
    paddingHorizontal: ESPACIO.m,
    justifyContent: 'center',
    backgroundColor: COLORES.fondoProfundo,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  punto: { width: 10, height: 10, borderRadius: 5 },
  texto: { fontSize: TIPO.etiqueta, fontFamily: FUENTES.bold },
});
