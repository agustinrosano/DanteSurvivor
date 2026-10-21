# Validacion del port Android

Objetivo del usuario: Moto G75 con Android 16. No hubo un telefono fisico conectado durante este trabajo.

## Compilacion y artefacto

- `npm.cmd run android:apk`: correcto, con Vite 8.3.4, Capacitor 8.5.3, Java 21 y Gradle 8.14.3.
- APK: `artifacts/android/dante-quest-debug.apk`, aproximadamente 26.5 MB.
- SHA-256: `AA7D7AA49CDA0F41D7BF999C0E24C240F198CDD6F503D87BF1A1645A5018205A`.
- Los recursos web se compilan en `dist-android/`; no se reemplazo el `dist/` anterior.

## Navegador

Resultado final: **15 pruebas aprobadas, 1 omitida** (caso tactil en el perfil de PC), en 44.7 segundos.

La suite `npm.cmd run test:mobile` comprueba desde la interfaz:

- inicio individual bloqueando los servicios externos;
- menu completo en una pantalla horizontal de 800 x 360;
- joystick y acciones simultaneas mediante eventos tactiles reales del protocolo del navegador;
- cancelacion de los dedos y retorno del joystick al centro;
- pausa al ocultar la pagina, reloj detenido y reanudacion explicita;
- teclado/pausa y salida al menu;
- persistencia de heroe y escenario tras recargar;
- compra de mejora permanente y almas gastadas, comprobadas tras recargar desde un guardado inicial conocido y aislado;
- subida de nivel por combate con un guardado de heroe mejorado, proteccion frente a Escape, reloj detenido y eleccion de mejora para continuar.

El caso de subida de nivel usa reloj y azar controlados como condiciones de prueba. No constituye una medicion de rendimiento. El caso tactil se omite en el perfil de PC, que no tiene pantalla tactil.

## APK en Android 16

`ANDROID_SERIAL=emulator-5582` con `npm.cmd run android:smoke`: correcto sobre una imagen Android 16 / API 36, en un emulador de prueba independiente. Se comprobo:

- instalacion y arranque en frio del APK;
- orientacion horizontal;
- recursos de la app servidos localmente y peticiones a servicios externos bloqueadas durante la partida;
- seleccion de heroe y mapa e inicio de combate;
- Atras abre la pausa;
- Home y retorno rapido conservan la pausa; el tiempo no avanza hasta Continuar;
- salir al menu y recargar;
- detener el proceso y relanzarlo conserva heroe y mapa;
- ausencia de excepciones JavaScript observadas en el recorrido.

Capturas reales del dispositivo emulado: `artifacts/android/android-device-game.png`. El script tambien genera capturas del WebView; para valorar la imagen del juego se uso la captura nativa, que incluye la superficie acelerada del canvas.

La primera prueba nativa detecto que `appStateChange(false)` podia llegar tarde durante una salida muy breve. Se agrego el evento nativo `pause` y la comprobacion posterior en Android 16 paso.

## Revision independiente

Ver `ANDROID_REVIEW.md`. Se corrigio la retencion de efectos pausados en audio y se ampliaron las pruebas de progreso y modal de nivel. Se retiraron los dos tests de ejemplo del scaffold Android, que no probaban el juego.

## Pendiente en dispositivo fisico

- Fluidez, consumo, temperatura y audio perceptible durante partidas largas en el Moto G75.
- Cortes de audio, interrupciones y gestos del sistema propios del telefono.
- Ganancia de almas tras una expedicion y restauracion de mejoras tras cerrar y abrir en el telefono real.
- Comprobar el area segura del recorte de camara y navegacion por gestos del Moto.

## Cooperativo

Se audito el flujo existente comparandolo con `master`: la sala PeerJS y sus controles se conservaron. La version previa ya carecia de conexion entre el bucle del juego y los metodos de sincronizacion. No se afirma que exista combate cooperativo sincronizado ni que se haya validado entre redes reales. Su arquitectura quedo fuera del alcance aprobado.
