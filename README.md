# Arrullú — App de control de la lámpara

**Acompañamiento Nocturno & Iluminación.** App en React Native (Expo, JavaScript) para controlar la lámpara de noche infantil Arrullú (Arduino Nano + HC-05) por Bluetooth clásico (perfil SPP).

> ⚠️ **Solo Android.** `react-native-bluetooth-classic` no funciona en iOS (iOS no permite SPP con el HC-05). Tampoco funciona en **Expo Go**: necesitas una *development build*. En Expo Go, en un emulador o en un teléfono sin Bluetooth clásico, la app entra sola en **Modo Demo**.

## Qué hace (y qué no)

| Puede | No puede (el hardware no lo permite) |
|---|---|
| Encender / apagar la luz (`A` / `B`) | Leer batería, sensores o brillo real |
| Cambiar color (`K r,g,b`), con el brillo simulado escalando RGB | Recibir respuestas: la lámpara **no devuelve nada** |
| Temporizador (`T<min>`) y cancelarlo (`X`) | Controlar el volumen de la lámpara (se usa el del teléfono) |
| Encender / apagar la alimentación del audio (`M` / `N`) | Transmitir música (el teléfono se empareja con la placa de audio como bocina) |
| Rutinas por hora **con la app abierta y conectada** | Ejecutar horarios con la app cerrada (el Arduino no tiene reloj) |

Todo estado en pantalla está rotulado como **estimado según el último comando enviado**.

## Instalación

Requisitos: Node 20+, Android Studio (SDK + un teléfono con depuración USB activada) y JDK 17.

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

`expo run:android` crea la **development build**, la instala en el teléfono conectado y arranca Metro. Las siguientes veces basta con:

```bash
npx expo start --dev-client
```

También puedes compilarla en la nube con EAS: `npx eas-cli@latest build --profile development --platform android`.

### Si compilas en Windows

- **Rutas largas:** activa `LongPathsEnabled` (PowerShell como administrador):
  `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force`
- **CMake 3.31.6:** la app lo pide (plugin `plugins/withCmakeVersion.js`) porque el Ninja de CMake 3.22 no soporta rutas largas. Instálalo desde Android Studio → SDK Manager → SDK Tools → CMake 3.31.6.
- **ANDROID_HOME:** define la variable apuntando a `%LOCALAPPDATA%\Android\Sdk` si `expo run:android` no encuentra el SDK.
- La librería Bluetooth se corrige sola con `patch-package` (carpeta `patches/`) al hacer `npm install`.

### Logo

Reemplaza `assets/logo.png` por el logo oficial (versión con **fondo transparente** y letras en azul hielo). El archivo actual es un marcador provisional con las mismas proporciones. Después de cambiarlo vuelve a ejecutar `npx expo prebuild --platform android --clean` para actualizar el splash nativo.

## Emparejar el HC-05

1. Enciende la lámpara (el LED del HC-05 parpadea rápido).
2. En el teléfono: **Ajustes → Bluetooth → Vincular nuevo dispositivo → HC-05**. PIN **1234** (o **0000**).
3. Abre Arrullú, acepta el permiso de Bluetooth y elige “HC-05” en **Conectar lámpara**. Queda guardada como *Lámpara principal* y la app se reconecta sola al abrir (3 intentos, 2 s entre ellos).
4. Para la música: empareja también la **placa de audio** como bocina desde los ajustes Bluetooth (botón *Abrir ajustes Bluetooth* en Control). Activa el audio con el interruptor (`M`) antes, porque la placa solo tiene corriente cuando el relé está cerrado.

## Modo Demo

- Se activa en **Ajustes → Modo Demo**, desde la pantalla de permisos (“Probar sin lámpara”) o solo si el teléfono no tiene Bluetooth clásico.
- Simula una lámpara que “conecta” en 1 s y acepta todos los comandos (se ven en la consola de Metro como `[DEMO] → "A\n"`).
- Muestra el chip **DEMO** en la cabecera. En Historial aparecen **Datos de ejemplo** hasta que haya datos reales.
- En Ajustes hay un botón **Simular caída de conexión** para probar el banner y la reconexión.

## Protocolo

Texto ASCII terminado en `\n`, a 9600 baudios:

| Comando | Acción |
|---|---|
| `A` | Encender luz (sube gradualmente) |
| `B` | Apagar luz (baja en ~30 s y luego corta el audio) |
| `M` / `N` | Audio encendido / apagado |
| `T<min>` | Temporizador, p. ej. `T45` |
| `X` | Cancelar temporizador |
| `K r,g,b` | Color 0–255, p. ej. `K255,150,40` |

- Cola con **150 ms** entre comandos; en rutinas, **300 ms** extra antes de un `T`.
- **Reintento** (Ajustes, desactivado por defecto): envía cada comando dos veces con 150 ms de diferencia.
- Sin conexión no se envía nada y se muestra un aviso.
- Cada envío queda en el historial local (fecha, comando, resultado).

**Supuesto:** al terminar el temporizador la app asume que la lámpara se apaga como con `B` (luz y audio). Si tu firmware hace otra cosa, ajusta `finalizarTemporizador` en `src/hooks/useLampara.js`.

## Estructura

```
App.js                    navegación, fuentes y proveedores
src/hooks/useLampara.js   contexto: TODA la lógica Bluetooth, estado estimado, rutinas, historial
src/services/             protocolo, BT real, BT demo, cola, permisos, rutinas, consumo, háptica
src/storage/almacen.js    AsyncStorage
src/screens/              Splash, Permisos, Conectar, Inicio, Control, Rutinas, EditorRutina, Historial, Ajustes
src/components/           tarjetas, interruptor, dial, anillo, gráfica, iconos SVG, toast…
src/theme/                colores, tipografía, radios y duraciones
```

Ninguna pantalla importa la librería Bluetooth: todo pasa por `useLampara()`.

## Pruebas manuales con la lámpara real

- [ ] **Permisos:** primera apertura → pantalla explicativa → diálogo del sistema. Al rechazar se ve el aviso y la opción de Modo Demo.
- [ ] **Bluetooth apagado:** apaga el BT del teléfono → banner “Bluetooth apagado” con botón *Activar Bluetooth*.
- [ ] **Conectar:** el HC-05 aparece en emparejados; al tocarlo pasa a “Conectando…” y luego “Conectada”, con toast.
- [ ] **Reconexión al abrir:** cierra y abre la app → se reconecta sola sin pasar por Conectar.
- [ ] **Fuera de alcance:** apaga la lámpara y abre la app → tras 3 intentos aparece Conectar con un mensaje claro.
- [ ] **Encender / apagar:** el interruptor de Inicio enciende (sube gradual) y apaga (baja en ~30 s). La tarjeta cambia a ámbar con resplandor y vibra suave.
- [ ] **Color:** cada preset cambia el color; los deslizadores RGB muestran “Se enviará K…” y *Aplicar color* lo envía.
- [ ] **Intensidad:** arrastra el dial y suelta → la luz cambia al soltar, no durante el arrastre.
- [ ] **Temporizador:** inicia 15 min → el anillo cuenta hacia atrás; cierra la app y vuelve → el tiempo se recalcula. *Cancelar* envía `X`. Al terminar vibra distinto y la tarjeta pasa a “Apagada”.
- [ ] **Audio:** el interruptor de Música enciende la placa (`M`); empareja la placa como bocina y reproduce algo; el deslizador cambia el volumen del teléfono; `N` la apaga.
- [ ] **Rutina completa:** *Hora de dormir* → luz, cálido 40 %, audio y temporizador 45 min, en orden.
- [ ] **Apagar todo:** mantén presionada la tarjeta de la lámpara → `X`, `B`, `N`.
- [ ] **Desconexión inesperada:** con la app abierta apaga la lámpara → banner “Se perdió la conexión. Reintentando…”, y después *Reconectar*.
- [ ] **Sin conexión:** desconectada, toca cualquier control → aviso claro y no se envía nada.
- [ ] **Reintento:** actívalo en Ajustes y revisa que el historial siga mostrando un solo evento por orden.
- [ ] **Rutina por hora:** programa una rutina 2 minutos después con la app abierta y conectada → se ejecuta sola.
- [ ] **Historial:** tras encender/apagar, las horas de hoy y el consumo estimado se actualizan; *Borrar historial* pide confirmación.
- [ ] **Accesibilidad:** con TalkBack, todos los botones se anuncian; con “Quitar animaciones” activo, el splash y los interruptores no se animan.
