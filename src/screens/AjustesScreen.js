// Ajustes: dispositivo, nombre y zona, reintento, potencia, Modo Demo, Luz tenue y Acerca de.
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Chip from '../components/Chip';
import Interruptor from '../components/Interruptor';
import { useLampara } from '../hooks/useLampara';
import { ZONAS } from './InicioScreen';
import { COLORES, ESPACIO, FUENTES, RADIOS, TACTIL_MINIMO, TIPO } from '../theme';

const POTENCIA_MIN = 0.1;
const POTENCIA_MAX = 60;

export default function AjustesScreen({ navigation }) {
  const {
    ajustes,
    actualizarAjustes,
    dispositivo,
    conectada,
    reconectar,
    olvidarDispositivo,
    modoDemo,
    demoForzado,
    simularCaida,
  } = useLampara();
  const [nombre, setNombre] = useState(ajustes.nombreLampara);
  const [potencia, setPotencia] = useState(String(ajustes.potenciaW).replace('.', ','));

  const guardarPotencia = () => {
    const v = parseFloat(potencia.replace(',', '.'));
    if (Number.isNaN(v) || v < POTENCIA_MIN || v > POTENCIA_MAX) {
      Alert.alert('Potencia no válida', `Escribe un valor entre ${POTENCIA_MIN} y ${POTENCIA_MAX} W.`);
      setPotencia(String(ajustes.potenciaW).replace('.', ','));
      return;
    }
    actualizarAjustes({ potenciaW: v });
  };

  const confirmarOlvidar = () =>
    Alert.alert('Olvidar lámpara', 'La app dejará de reconectarse sola a esta lámpara.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Olvidar', style: 'destructive', onPress: olvidarDispositivo },
    ]);

  return (
    <Pantalla titulo="Ajustes" atras>
      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Dispositivo guardado</Texto>
        {dispositivo ? (
          <View>
            <Texto variante="negrita">{dispositivo.name} · Lámpara principal</Texto>
            <Texto variante="etiqueta">{dispositivo.address}</Texto>
          </View>
        ) : (
          <Texto variante="cuerpoChico">No hay ninguna lámpara guardada.</Texto>
        )}
        <View style={styles.botones}>
          <Boton titulo="Cambiar" variante="secundario" compacto onPress={() => navigation.navigate('Conectar')} />
          <Boton titulo="Reconectar" icono="recargar" variante="secundario" compacto onPress={() => reconectar()} />
          {dispositivo && <Boton titulo="Olvidar" variante="peligro" compacto onPress={confirmarOlvidar} />}
        </View>
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Lámpara</Texto>
        <Texto variante="negrita">Nombre</Texto>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          onEndEditing={() => nombre.trim() && actualizarAjustes({ nombreLampara: nombre.trim() })}
          style={styles.input}
          maxLength={30}
          placeholderTextColor={COLORES.textoSecundario}
          accessibilityLabel="Nombre de la lámpara"
        />
        <Texto variante="negrita">Zona</Texto>
        <View style={styles.botones}>
          {ZONAS.filter((z) => z !== 'Todas').map((z) => (
            <Chip key={z} etiqueta={z} activo={ajustes.zona === z} onPress={() => actualizarAjustes({ zona: z })} />
          ))}
        </View>
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Comandos y consumo</Texto>
        <FilaInterruptor
          titulo="Reintento de comandos"
          detalle="Envía cada orden dos veces (150 ms de diferencia) por si se pierde alguna."
          valor={ajustes.reintento}
          onCambio={(v) => actualizarAjustes({ reintento: v })}
        />
        <Texto variante="negrita">Potencia estimada de la lámpara (W)</Texto>
        <TextInput
          value={potencia}
          onChangeText={setPotencia}
          onEndEditing={guardarPotencia}
          keyboardType="decimal-pad"
          style={styles.input}
          accessibilityLabel="Potencia estimada en vatios"
        />
        <Texto variante="etiqueta">Se usa solo para calcular el consumo estimado del Historial.</Texto>
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Interfaz</Texto>
        <FilaInterruptor
          titulo="Modo Demo"
          detalle={
            demoForzado
              ? 'Activado automáticamente: este teléfono no tiene Bluetooth clásico disponible.'
              : 'Simula la lámpara para probar la app sin hardware.'
          }
          valor={modoDemo}
          disabled={demoForzado}
          onCambio={(v) => actualizarAjustes({ modoDemo: v })}
        />
        {modoDemo && conectada && (
          <Boton titulo="Simular caída de conexión" variante="secundario" compacto onPress={simularCaida} />
        )}
        <FilaInterruptor
          titulo="Luz tenue"
          detalle="Oscurece aún más la interfaz para usarla de noche."
          valor={ajustes.luzTenue}
          onCambio={(v) => actualizarAjustes({ luzTenue: v })}
        />
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <Texto variante="subtitulo">Acerca de</Texto>
        <Texto variante="negrita">Arrullú · Acompañamiento Nocturno & Iluminación</Texto>
        <Texto variante="cuerpoChico">Versión {Constants.expoConfig?.version || '1.0.0'}</Texto>
        <Texto variante="cuerpoChico">
          Lámpara de noche infantil con Arduino Nano, HC-05, tira WS2812B, sensor LDR, botón táctil TTP223 y placa de
          audio PAM8403. La lámpara solo recibe órdenes: todo lo que ves en la app es estimado.
        </Texto>
        <Texto variante="etiqueta">Proyecto Arrullú · App de control hecha con React Native y Expo.</Texto>
      </Tarjeta>
    </Pantalla>
  );
}

function FilaInterruptor({ titulo, detalle, valor, onCambio, disabled }) {
  return (
    <View style={styles.fila}>
      <View style={{ flex: 1 }}>
        <Texto variante="negrita">{titulo}</Texto>
        {detalle ? <Texto variante="etiqueta">{detalle}</Texto> : null}
      </View>
      <Interruptor valor={valor} onCambio={onCambio} disabled={disabled} accessibilityLabel={titulo} />
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: ESPACIO.m },
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.s },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
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
});
