// Punto de entrada de Arrullú: fuentes, proveedores (toast + lámpara) y navegación.
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashNativo from 'expo-splash-screen';
import { useFonts } from 'expo-font';
// Solo los dos pesos que usa la app (600 y 700)
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from './src/hooks/useToast';
import { LamparaProvider, useLampara } from './src/hooks/useLampara';
import Icono from './src/components/Icono';
import SplashScreen from './src/screens/SplashScreen';
import PermisosScreen from './src/screens/PermisosScreen';
import ConectarScreen from './src/screens/ConectarScreen';
import InicioScreen from './src/screens/InicioScreen';
import ControlScreen from './src/screens/ControlScreen';
import RutinasScreen from './src/screens/RutinasScreen';
import EditorRutinaScreen from './src/screens/EditorRutinaScreen';
import HistorialScreen from './src/screens/HistorialScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import { COLORES, FUENTES, TIPO } from './src/theme';

// Mantiene el splash nativo hasta que carguen las fuentes; luego se ve nuestro Splash animado
SplashNativo.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const TEMA_NAVEGACION = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORES.ambar,
    background: COLORES.fondo,
    card: COLORES.fondoProfundo,
    text: COLORES.texto,
    border: COLORES.fondoProfundo,
    notification: COLORES.ambar,
  },
};

const PESTANAS = [
  { nombre: 'Inicio', componente: InicioScreen, icono: 'inicio' },
  { nombre: 'Control', componente: ControlScreen, icono: 'control' },
  { nombre: 'Rutinas', componente: RutinasScreen, icono: 'rutinas' },
  { nombre: 'Historial', componente: HistorialScreen, icono: 'historial' },
];

function Principal() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORES.ambar,
        tabBarInactiveTintColor: COLORES.textoSecundario,
        tabBarStyle: { backgroundColor: COLORES.fondoProfundo, borderTopWidth: 0 },
        tabBarLabelStyle: { fontFamily: FUENTES.bold, fontSize: TIPO.minimo },
        tabBarItemStyle: { minHeight: 48 },
      }}
    >
      {PESTANAS.map((p) => (
        <Tabs.Screen
          key={p.nombre}
          name={p.nombre}
          component={p.componente}
          options={{
            tabBarAccessibilityLabel: `Pestaña ${p.nombre}`,
            tabBarIcon: ({ color }) => <Icono nombre={p.icono} color={color} />,
          }}
        />
      ))}
    </Tabs.Navigator>
  );
}

/** Capa que baja aún más el brillo de la interfaz (modo "Luz tenue"). */
function CapaLuzTenue() {
  const { ajustes } = useLampara();
  if (!ajustes.luzTenue) return null;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tenue]} />;
}

function Navegacion() {
  return (
    <NavigationContainer theme={TEMA_NAVEGACION}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORES.fondo }, animation: 'fade' }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Permisos" component={PermisosScreen} />
        <Stack.Screen name="Principal" component={Principal} />
        <Stack.Screen name="Conectar" component={ConectarScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Ajustes" component={AjustesScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditorRutina" component={EditorRutinaScreen} options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
      <CapaLuzTenue />
    </NavigationContainer>
  );
}

export default function App() {
  const [fuentesListas, errorFuentes] = useFonts({ Nunito_600SemiBold, Nunito_700Bold });
  const listo = fuentesListas || !!errorFuentes;

  useEffect(() => {
    if (listo) SplashNativo.hideAsync().catch(() => {});
  }, [listo]);

  if (!listo) return <View style={{ flex: 1, backgroundColor: COLORES.fondo }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ToastProvider>
        <LamparaProvider>
          <Navegacion />
        </LamparaProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tenue: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
});
