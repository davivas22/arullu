// Gestor de rutinas: lista, ejecutar, editar, duplicar y eliminar (con confirmación).
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Pulsable from '../components/Pulsable';
import Icono from '../components/Icono';
import EstadoVacio from '../components/EstadoVacio';
import { useLampara } from '../hooks/useLampara';
import { describirPaso } from '../services/rutinas';
import { COLORES, ESPACIO, FUENTES, RADIOS, TACTIL_MINIMO, TIPO } from '../theme';

const NOMBRES_DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function RutinasScreen({ navigation }) {
  const { rutinas, ejecutarRutina, eliminarRutina, duplicarRutina, rutinaEnCurso } = useLampara();

  const confirmarEliminar = (r) =>
    Alert.alert('Eliminar rutina', `¿Seguro que quieres eliminar "${r.nombre}"? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarRutina(r.id) },
    ]);

  return (
    <Pantalla
      titulo="Rutinas"
      subtitulo="Pasos que se envían en orden, uno tras otro"
      pie={
        <View style={styles.pie}>
          <Boton titulo="Nueva rutina" icono="mas" onPress={() => navigation.navigate('EditorRutina')} />
        </View>
      }
    >
      <View style={styles.aviso} accessibilityRole="text">
        <Icono nombre="alerta" color={COLORES.ambar} />
        <Texto variante="cuerpoChico" style={{ flex: 1, color: COLORES.texto }}>
          Las rutinas con hora solo se ejecutan con la app abierta y la lámpara conectada. La lámpara no tiene reloj
          ni guarda horarios.
        </Texto>
      </View>

      {rutinas.length === 0 ? (
        <EstadoVacio
          icono="rutinas"
          titulo="Sin rutinas todavía"
          mensaje="Crea una rutina para encender la luz, poner música y programar el apagado con un toque."
          accion="Crear rutina"
          onAccion={() => navigation.navigate('EditorRutina')}
        />
      ) : (
        rutinas.map((r) => (
          <Tarjeta key={r.id} style={{ gap: ESPACIO.m }}>
            <View style={styles.cabecera}>
              <View style={styles.icono}>
                <Icono nombre={r.icono} color={COLORES.ambar} />
              </View>
              <View style={{ flex: 1 }}>
                <Texto variante="subtitulo">{r.nombre}</Texto>
                {r.hora ? (
                  <Texto variante="etiqueta" style={{ color: COLORES.azul }}>
                    {r.hora} · {r.dias?.length ? r.dias.map((d) => NOMBRES_DIAS[d]).join(', ') : 'sin días'}
                  </Texto>
                ) : (
                  <Texto variante="etiqueta">Manual</Texto>
                )}
              </View>
            </View>

            <View style={{ gap: ESPACIO.xs }}>
              {r.pasos.map((p, i) => (
                <View key={i} style={styles.paso}>
                  <View style={styles.numero}>
                    <Texto style={styles.numeroTexto}>{i + 1}</Texto>
                  </View>
                  <Texto variante="cuerpoChico" style={{ flex: 1 }}>
                    {describirPaso(p)}
                  </Texto>
                </View>
              ))}
            </View>

            <View style={styles.acciones}>
              <Boton
                titulo={rutinaEnCurso === r.id ? 'Enviando…' : 'Ejecutar'}
                icono={rutinaEnCurso === r.id ? undefined : 'play'}
                compacto
                style={{ flex: 1 }}
                disabled={!!rutinaEnCurso}
                onPress={() => ejecutarRutina(r)}
                accessibilityLabel={`Ejecutar rutina ${r.nombre}`}
              />
              {rutinaEnCurso === r.id && <ActivityIndicator color={COLORES.ambar} />}
              <BotonAccion icono="editar" etiqueta={`Editar ${r.nombre}`} onPress={() => navigation.navigate('EditorRutina', { id: r.id })} />
              <BotonAccion icono="copiar" etiqueta={`Duplicar ${r.nombre}`} onPress={() => duplicarRutina(r.id)} />
              <BotonAccion icono="basura" etiqueta={`Eliminar ${r.nombre}`} color={COLORES.rojo} onPress={() => confirmarEliminar(r)} />
            </View>
          </Tarjeta>
        ))
      )}
    </Pantalla>
  );
}

function BotonAccion({ icono, etiqueta, onPress, color = COLORES.textoSecundario }) {
  return (
    <Pulsable onPress={onPress} accessibilityLabel={etiqueta} style={styles.botonAccion}>
      <Icono nombre={icono} color={color} />
    </Pulsable>
  );
}


const styles = StyleSheet.create({
  pie: { paddingHorizontal: ESPACIO.l, paddingVertical: ESPACIO.m, backgroundColor: COLORES.fondo },
  aviso: {
    flexDirection: 'row',
    gap: ESPACIO.m,
    alignItems: 'center',
    padding: ESPACIO.m,
    borderRadius: RADIOS.tarjetaChica,
    borderWidth: 1,
    borderColor: COLORES.ambar,
    backgroundColor: COLORES.ambarSuave,
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORES.ambarSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paso: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  numero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORES.fondoProfundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: { fontSize: TIPO.minimo, fontFamily: FUENTES.bold, color: COLORES.ambar },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  botonAccion: {
    width: TACTIL_MINIMO,
    height: TACTIL_MINIMO,
    borderRadius: RADIOS.pildora,
    borderWidth: 1,
    borderColor: COLORES.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
