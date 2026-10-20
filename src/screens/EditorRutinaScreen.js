// Editor de rutinas: nombre, icono, hora opcional (con días) y pasos que se pueden
// agregar, reordenar (arrastrando el asa o con flechas) y borrar.
import React, { useRef, useState } from 'react';
import { Alert, Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Chip from '../components/Chip';
import Pulsable from '../components/Pulsable';
import Icono from '../components/Icono';
import Interruptor from '../components/Interruptor';
import { useLampara } from '../hooks/useLampara';
import { useToast } from '../hooks/useToast';
import {
  CATALOGO_PASOS,
  DIAS_SEMANA,
  ICONOS_RUTINA,
  TIPOS_PASO,
  describirPaso,
  horaValida,
  nuevoId,
} from '../services/rutinas';
import { MINUTOS_TEMPORIZADOR } from '../services/protocolo';
import { COLORES, ESPACIO, FUENTES, PRESETS_COLOR, RADIOS, TACTIL_MINIMO, TIPO } from '../theme';

const SEGUNDOS_MIN = 1;
const SEGUNDOS_MAX = 600;
const NOMBRES_DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export default function EditorRutinaScreen({ navigation, route }) {
  const { rutinas, guardarRutina } = useLampara();
  const { mostrar } = useToast();
  const original = route.params?.id ? rutinas.find((r) => r.id === route.params.id) : null;

  const [nombre, setNombre] = useState(original?.nombre || '');
  const [icono, setIcono] = useState(original?.icono || ICONOS_RUTINA[0]);
  const [programada, setProgramada] = useState(!!original?.hora);
  const [hora, setHora] = useState(original?.hora || '20:30');
  const [dias, setDias] = useState(original?.dias || []);
  // Cada paso lleva una clave estable para poder reordenarlo
  const [pasos, setPasos] = useState(() =>
    (original?.pasos || []).map((p) => ({ ...p, _clave: nuevoId() }))
  );
  const [eligiendoPaso, setEligiendoPaso] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const alturas = useRef({});

  const actualizarPaso = (i, cambios) => setPasos((l) => l.map((p, j) => (j === i ? { ...p, ...cambios } : p)));
  const mover = (desde, hasta) =>
    setPasos((l) => {
      if (hasta < 0 || hasta >= l.length || desde === hasta) return l;
      const copia = [...l];
      const [x] = copia.splice(desde, 1);
      copia.splice(hasta, 0, x);
      return copia;
    });
  const borrar = (i) => setPasos((l) => l.filter((_, j) => j !== i));

  const agregar = (item) => {
    setPasos((l) => [...l, { tipo: item.tipo, ...(item.defecto || {}), _clave: nuevoId() }]);
    setEligiendoPaso(false);
  };

  /** Calcula a qué posición cae un paso arrastrado según las alturas medidas. */
  const indiceDestino = (desde, dy) => {
    const lista = pasos.map((p) => alturas.current[p._clave] || 80);
    let destino = desde;
    let acumulado = 0;
    if (dy > 0) {
      for (let j = desde + 1; j < lista.length; j++) {
        acumulado += lista[j];
        if (dy > acumulado - lista[j] / 2) destino = j;
      }
    } else {
      for (let j = desde - 1; j >= 0; j--) {
        acumulado += lista[j];
        if (-dy > acumulado - lista[j] / 2) destino = j;
      }
    }
    return destino;
  };

  const guardar = () => {
    if (!nombre.trim()) return Alert.alert('Falta el nombre', 'Ponle un nombre a la rutina.');
    if (pasos.length === 0) return Alert.alert('Sin pasos', 'Agrega al menos un paso.');
    if (programada && !horaValida(hora)) return Alert.alert('Hora no válida', 'Usa el formato HH:MM, por ejemplo 20:30.');
    if (programada && dias.length === 0) return Alert.alert('Elige los días', 'Marca al menos un día de la semana.');
    guardarRutina({
      id: original?.id || nuevoId(),
      nombre: nombre.trim(),
      icono,
      hora: programada ? hora : null,
      dias: programada ? [...dias].sort() : [],
      pasos: pasos.map(({ _clave, ...p }) => p),
      // Las rutinas de fábrica traen un resumen fijo; si se editan, se recalcula
      resumen: undefined,
    });
    mostrar('Rutina guardada');
    navigation.goBack();
  };

  return (
    <Pantalla
      titulo={original ? 'Editar rutina' : 'Nueva rutina'}
      atras
      scrollEnabled={!arrastrando}
      pie={
        <View style={styles.pie}>
          <Boton titulo="Cancelar" variante="secundario" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
          <Boton titulo="Guardar" icono="check" style={{ flex: 1 }} onPress={guardar} />
        </View>
      }
    >
      <Tarjeta style={styles.seccion}>
        <Texto variante="negrita">Nombre</Texto>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Siesta"
          placeholderTextColor={COLORES.textoSecundario}
          style={styles.input}
          maxLength={40}
          accessibilityLabel="Nombre de la rutina"
        />
        <Texto variante="negrita">Icono</Texto>
        <View style={styles.iconos}>
          {ICONOS_RUTINA.map((ic) => (
            <Pulsable
              key={ic}
              onPress={() => setIcono(ic)}
              accessibilityLabel={`Icono ${ic}`}
              accessibilityState={{ selected: icono === ic }}
              style={[styles.iconoOpcion, icono === ic && styles.iconoActivo]}
            >
              <Icono nombre={ic} color={icono === ic ? COLORES.textoSobreAmbar : COLORES.textoSecundario} />
            </Pulsable>
          ))}
        </View>
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <View style={styles.fila}>
          <View style={{ flex: 1 }}>
            <Texto variante="negrita">Programar a una hora</Texto>
            <Texto variante="etiqueta">Solo funciona con la app abierta y conectada</Texto>
          </View>
          <Interruptor valor={programada} onCambio={setProgramada} accessibilityLabel="Programar rutina a una hora" />
        </View>
        {programada && (
          <>
            <TextInput
              value={hora}
              onChangeText={(t) => setHora(t.replace(/[^\d:]/g, '').slice(0, 5))}
              placeholder="HH:MM"
              placeholderTextColor={COLORES.textoSecundario}
              keyboardType="numbers-and-punctuation"
              style={[styles.input, !horaValida(hora) && { borderColor: COLORES.rojo }]}
              accessibilityLabel="Hora de la rutina en formato 24 horas"
            />
            <View style={styles.dias}>
              {DIAS_SEMANA.map((d, i) => (
                <Chip
                  key={i}
                  etiqueta={d}
                  activo={dias.includes(i)}
                  onPress={() => setDias((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]))}
                  accessibilityLabel={NOMBRES_DIAS_LARGOS[i]}
                />
              ))}
            </View>
          </>
        )}
      </Tarjeta>

      <Texto variante="subtitulo">Pasos</Texto>
      <Texto variante="etiqueta">
        Se envían en orden con 150 ms entre ellos (300 ms antes de un temporizador). Arrastra el asa para reordenar.
      </Texto>
      <View>
        {pasos.map((p, i) => (
          <FilaPaso
            key={p._clave}
            paso={p}
            indice={i}
            total={pasos.length}
            onLayoutAltura={(h) => (alturas.current[p._clave] = h)}
            onCambiar={(c) => actualizarPaso(i, c)}
            onMover={(destino) => mover(i, destino)}
            onBorrar={() => borrar(i)}
            onArrastrando={setArrastrando}
            calcularDestino={(dy) => indiceDestino(i, dy)}
          />
        ))}
      </View>
      <Boton titulo="Agregar paso" icono="mas" variante="secundario" onPress={() => setEligiendoPaso(true)} />

      <Modal visible={eligiendoPaso} transparent animationType="fade" onRequestClose={() => setEligiendoPaso(false)}>
        <Pressable style={styles.velo} onPress={() => setEligiendoPaso(false)} accessibilityLabel="Cerrar">
          <Pressable style={styles.hoja} onPress={() => {}}>
            <Texto variante="subtitulo">Agregar paso</Texto>
            <ScrollView contentContainerStyle={{ gap: ESPACIO.s }} style={{ maxHeight: 420 }}>
              {CATALOGO_PASOS.map((item) => (
                <Pulsable key={item.tipo} style={styles.opcion} onPress={() => agregar(item)} accessibilityLabel={`Agregar ${item.etiqueta}`}>
                  <Texto variante="negrita">{item.etiqueta}</Texto>
                </Pulsable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Pantalla>
  );
}

/** Un paso del editor, con asa para arrastrar, flechas, borrar y sus parámetros. */
function FilaPaso({ paso, indice, total, onLayoutAltura, onCambiar, onMover, onBorrar, onArrastrando, calcularDestino }) {
  const dy = useRef(new Animated.Value(0)).current;
  const [activo, setActivo] = useState(false);
  const cb = useRef({});
  cb.current = { onMover, onArrastrando, calcularDestino };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        setActivo(true);
        cb.current.onArrastrando(true);
      },
      onPanResponderMove: (_, g) => dy.setValue(g.dy),
      onPanResponderRelease: (_, g) => {
        const destino = cb.current.calcularDestino(g.dy);
        dy.setValue(0);
        setActivo(false);
        cb.current.onArrastrando(false);
        cb.current.onMover(destino);
      },
      onPanResponderTerminate: () => {
        dy.setValue(0);
        setActivo(false);
        cb.current.onArrastrando(false);
      },
    })
  ).current;

  return (
    <Animated.View
      onLayout={(e) => onLayoutAltura(e.nativeEvent.layout.height)}
      style={[
        styles.paso,
        activo && styles.pasoActivo,
        { transform: [{ translateY: dy }], zIndex: activo ? 10 : 0 },
      ]}
    >
      <View style={styles.fila}>
        <View {...pan.panHandlers} style={styles.asa} accessible accessibilityLabel={`Arrastrar paso ${indice + 1}`}>
          <Icono nombre="arrastrar" color={COLORES.textoSecundario} grosor={3} />
        </View>
        <View style={styles.numero}>
          <Texto style={styles.numeroTexto}>{indice + 1}</Texto>
        </View>
        <Texto variante="negrita" style={{ flex: 1 }}>
          {describirPaso(paso)}
        </Texto>
        <Pulsable onPress={() => onMover(indice - 1)} disabled={indice === 0} accessibilityLabel={`Subir paso ${indice + 1}`} style={styles.botonMini}>
          <Icono nombre="arriba" color={COLORES.textoSecundario} />
        </Pulsable>
        <Pulsable onPress={() => onMover(indice + 1)} disabled={indice === total - 1} accessibilityLabel={`Bajar paso ${indice + 1}`} style={styles.botonMini}>
          <Icono nombre="abajo" color={COLORES.textoSecundario} />
        </Pulsable>
        <Pulsable onPress={onBorrar} accessibilityLabel={`Borrar paso ${indice + 1}`} style={styles.botonMini}>
          <Icono nombre="basura" color={COLORES.rojo} />
        </Pulsable>
      </View>

      {paso.tipo === TIPOS_PASO.COLOR && (
        <View style={{ gap: ESPACIO.s }}>
          <View style={styles.fila}>
            {PRESETS_COLOR.map((c) => (
              <Pulsable
                key={c.id}
                onPress={() => onCambiar({ preset: c.id })}
                accessibilityLabel={`Color ${c.nombre}`}
                accessibilityState={{ selected: paso.preset === c.id }}
                style={[styles.colorMini, { backgroundColor: c.hex }, paso.preset === c.id && styles.colorActivo]}
              >
                {paso.preset === c.id ? <Icono nombre="check" grosor={3} /> : null}
              </Pulsable>
            ))}
          </View>
          <Texto variante="etiqueta">Intensidad: {paso.porcentaje} %</Texto>
          <Slider
            style={{ height: TACTIL_MINIMO }}
            minimumValue={0}
            maximumValue={100}
            step={5}
            value={paso.porcentaje}
            onValueChange={(v) => onCambiar({ porcentaje: Math.round(v) })}
            minimumTrackTintColor={COLORES.ambar}
            maximumTrackTintColor={COLORES.fondoProfundo}
            thumbTintColor={COLORES.ambar}
            accessibilityLabel="Intensidad del color"
          />
        </View>
      )}

      {paso.tipo === TIPOS_PASO.TEMPORIZADOR && (
        <View style={styles.chips}>
          {MINUTOS_TEMPORIZADOR.map((m) => (
            <Chip key={m} etiqueta={`${m} min`} activo={paso.minutos === m} onPress={() => onCambiar({ minutos: m })} />
          ))}
        </View>
      )}

      {paso.tipo === TIPOS_PASO.ESPERAR && (
        <View style={styles.fila}>
          <Boton
            titulo="−"
            variante="secundario"
            compacto
            accessibilityLabel="Menos segundos"
            onPress={() => onCambiar({ segundos: Math.max(SEGUNDOS_MIN, paso.segundos - 5) })}
          />
          <Texto variante="negrita" style={{ flex: 1, textAlign: 'center' }}>
            {paso.segundos} s
          </Texto>
          <Boton
            titulo="+"
            variante="secundario"
            compacto
            accessibilityLabel="Más segundos"
            onPress={() => onCambiar({ segundos: Math.min(SEGUNDOS_MAX, paso.segundos + 5) })}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: ESPACIO.m },
  input: {
    minHeight: TACTIL_MINIMO,
    borderRadius: RADIOS.tarjetaChica,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.fondoProfundo,
    color: COLORES.texto,
    paddingHorizontal: ESPACIO.l,
    fontFamily: FUENTES.semibold,
    fontSize: TIPO.cuerpoGrande,
  },
  iconos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.s },
  iconoOpcion: {
    width: TACTIL_MINIMO,
    height: TACTIL_MINIMO,
    borderRadius: RADIOS.pildora,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondoProfundo,
  },
  iconoActivo: { backgroundColor: COLORES.ambar },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  dias: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.xs },
  paso: {
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.tarjetaChica,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIO.s,
    marginBottom: ESPACIO.s,
    gap: ESPACIO.s,
  },
  pasoActivo: { borderColor: COLORES.ambar, opacity: 0.95 },
  asa: { width: 36, height: TACTIL_MINIMO, alignItems: 'center', justifyContent: 'center' },
  numero: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORES.fondoProfundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: { fontSize: TIPO.minimo, fontFamily: FUENTES.bold, color: COLORES.ambar },
  botonMini: { width: 40, minHeight: TACTIL_MINIMO, alignItems: 'center', justifyContent: 'center' },
  colorMini: {
    width: TACTIL_MINIMO,
    height: TACTIL_MINIMO,
    borderRadius: TACTIL_MINIMO / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorActivo: { borderWidth: 3, borderColor: COLORES.ambar },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.xs },
  pie: { flexDirection: 'row', gap: ESPACIO.m, paddingHorizontal: ESPACIO.l, paddingVertical: ESPACIO.m },
  velo: { flex: 1, backgroundColor: COLORES.velo, justifyContent: 'flex-end' },
  hoja: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: RADIOS.tarjetaGrande,
    borderTopRightRadius: RADIOS.tarjetaGrande,
    padding: ESPACIO.l,
    gap: ESPACIO.m,
    paddingBottom: ESPACIO.xxl,
  },
  opcion: {
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.tarjetaChica,
    padding: ESPACIO.m,
    justifyContent: 'center',
  },
});
