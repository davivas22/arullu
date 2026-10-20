// Pantalla explicativa ANTES del diálogo de permisos del sistema (no se piden de golpe).
import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Texto from '../components/Texto';
import Boton from '../components/Boton';
import Tarjeta from '../components/Tarjeta';
import Icono from '../components/Icono';
import { pedirPermisos } from '../services/permisos';
import { useLampara } from '../hooks/useLampara';
import { COLORES, ESPACIO } from '../theme';

const PUNTOS = [
  { icono: 'bluetooth', texto: 'Conectar con la lámpara por Bluetooth (módulo HC-05).' },
  { icono: 'foco', texto: 'Enviar órdenes: encender, apagar, color, temporizador y audio.' },
  { icono: 'info', texto: 'No usamos tu ubicación. En Android 11 o anterior el sistema la exige para buscar dispositivos Bluetooth.' },
];

export default function PermisosScreen({ navigation }) {
  const { marcarPermisosOk, actualizarAjustes } = useLampara();
  const [estado, setEstado] = useState(null); // null | 'denegados' | 'bloqueados'

  const solicitar = async () => {
    const r = await pedirPermisos();
    if (r === 'concedidos') {
      marcarPermisosOk();
      navigation.replace('Principal');
    } else {
      setEstado(r);
    }
  };

  const usarDemo = async () => {
    await actualizarAjustes({ modoDemo: true });
    navigation.replace('Principal');
  };

  return (
    <SafeAreaView style={styles.zona}>
      <View style={styles.contenido}>
        <View style={styles.iconoGrande}>
          <Icono nombre="bluetooth" tamano={48} color={COLORES.ambar} />
        </View>
        <Texto variante="titulo" accessibilityRole="header">
          Permiso de Bluetooth
        </Texto>
        <Texto variante="cuerpoChico">
          Para hablar con tu lámpara Arrullú, el teléfono necesita permiso para usar el Bluetooth.
        </Texto>
        <Tarjeta style={{ gap: ESPACIO.m }}>
          {PUNTOS.map((p) => (
            <View key={p.icono} style={styles.punto}>
              <Icono nombre={p.icono} color={COLORES.textoSecundario} />
              <Texto variante="cuerpoChico" style={{ flex: 1 }}>
                {p.texto}
              </Texto>
            </View>
          ))}
        </Tarjeta>
        {estado === 'denegados' && (
          <Texto style={styles.aviso}>
            Sin este permiso no podemos conectar con la lámpara. Puedes intentarlo de nuevo o probar el Modo Demo.
          </Texto>
        )}
        {estado === 'bloqueados' && (
          <Texto style={styles.aviso}>
            Android bloqueó la solicitud. Activa el permiso "Dispositivos cercanos" en los ajustes de la app.
          </Texto>
        )}
      </View>
      <View style={styles.acciones}>
        {estado === 'bloqueados' ? (
          <Boton titulo="Abrir ajustes de la app" onPress={() => Linking.openSettings()} />
        ) : (
          <Boton titulo="Permitir Bluetooth" icono="check" onPress={solicitar} />
        )}
        <Boton titulo="Probar sin lámpara (Modo Demo)" variante="secundario" onPress={usarDemo} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  zona: { flex: 1, backgroundColor: COLORES.fondo },
  contenido: { flex: 1, padding: ESPACIO.l, gap: ESPACIO.l, justifyContent: 'center' },
  iconoGrande: { alignItems: 'center' },
  punto: { flexDirection: 'row', gap: ESPACIO.m, alignItems: 'center' },
  aviso: { color: COLORES.rojo },
  acciones: { padding: ESPACIO.l, gap: ESPACIO.m },
});
