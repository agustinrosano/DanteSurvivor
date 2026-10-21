# DANTE QUEST en Android

Port en la rama `feat/android-mobile-port`, con Capacitor 8.5.3. Objetivo de prueba fisica: Moto G75 con Android 16. El juego se ejecuta en horizontal y sirve los recursos desde el APK; no necesita un servidor web para jugar en solitario.

## Compilar

Requisitos: Node 22 o posterior, Android Studio, JDK 21 y SDK Android API 36. La primera compilacion descarga Gradle y sus dependencias, por lo que requiere internet. El script detecta el JDK incluido en Android Studio y el SDK en la ubicacion habitual de Windows, sin cambiar variables del sistema.

```powershell
npm.cmd ci
npm.cmd run android:apk
```

Resultado: `artifacts/android/dante-quest-debug.apk`. Es un APK de desarrollo instalable, firmado con la clave debug local. No es una publicacion en Google Play.

Otros comandos:

```powershell
npm.cmd run android:sync   # compila el juego y sincroniza los recursos nativos
npm.cmd run android:open   # abre el proyecto en Android Studio
npm.cmd run test:mobile    # regresiones del recorrido del jugador en navegador
```

La salida Android es `dist-android/`; la carpeta `dist/` existente se conserva. La version web continua disponible con `npm.cmd run dev`.

## Instalar en el Moto G75

Copiar `dante-quest-debug.apk` al telefono y abrirlo. Android puede pedir habilitar la instalacion desde esa aplicacion. Con depuracion USB habilitada, tambien se puede instalar desde Android Studio o mediante:

```powershell
& "$env:LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" devices
& "$env:LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" -s <serial-del-moto> install -r artifacts/android/dante-quest-debug.apk
```

La primera vez Android puede mostrar su aviso de pantalla completa; pulsar el boton de confirmacion del sistema.

## Controles y comportamiento

- Joystick izquierdo para moverse; botones derechos para esquivar y usar la habilidad. Funcionan con varios dedos a la vez. Los botones muestran su tiempo de recarga.
- Los menus tienen desplazamiento tactil y las acciones principales quedan accesibles en pantallas horizontales bajas.
- Pausa desde el HUD o con el boton/gesto Atras de Android. Atras tambien vuelve desde los menus; en el menu principal minimiza la app.
- Al cambiar de aplicacion o bloquear la pantalla, se detienen el input, la simulacion y el audio. Al volver, pulsar Continuar; no se simula el tiempo transcurrido fuera.
- La eleccion de heroe/escenario y el progreso permanente siguen usando el guardado local de la app. El guardado del navegador de PC es independiente. Desinstalar o borrar los datos de la app elimina su guardado.
- No se agrega un guardado de la partida activa tras terminar el proceso: si Android cierra la app, se inicia una nueva expedicion y se conserva el progreso permanente que ya estaba guardado.

## Prueba nativa automatizada

Con un emulador arrancado y el APK compilado:

```powershell
npm.cmd run android:smoke
```

Selecciona por defecto un emulador. Para un dispositivo concreto, definir `ANDROID_SERIAL` antes de ejecutarlo. Instala el APK y comprueba el arranque, orientacion, recursos locales, partida, Atras, salir/volver y persistencia de seleccion. Las capturas quedan en `artifacts/android/`.

## Comprobacion en el telefono real

- [ ] Instalar y abrir en el Moto G75 / Android 16.
- [ ] Iniciar en modo avion y comprobar arte, fuentes, musica y efectos.
- [ ] Probar los cinco heroes y ambos escenarios; verificar que se alcanzan los botones de cada menu.
- [ ] Moverse, esquivar y usar la habilidad con varios dedos; soltar/cancelar el gesto no debe dejar movimiento activo.
- [ ] Elegir una mejora al subir de nivel; Atras no debe cerrar esa decision ni reanudar por detras del modal.
- [ ] Usar Home, bloqueo/desbloqueo y Atras; volver requiere Continuar y el audio respeta el silencio elegido.
- [ ] Reabrir la app y revisar heroe, escenario y mejoras permanentes.
- [ ] Jugar al menos diez minutos con hordas y jefe; observar fluidez, temperatura, bateria y audio. El emulador no certifica el rendimiento de este telefono.

## Limite previo del cooperativo

El flujo de salas PeerJS permanece disponible y necesita internet. La investigacion de `master` encontro una limitacion anterior al port: existen metodos para transmitir estado e inputs, pero el bucle de juego no los conecta; tampoco conserva de forma completa el grupo al iniciar la expedicion. Conectar la sala no demuestra una partida sincronizada.

Este port no reescribe esa arquitectura. No considerar validado el juego cooperativo entre Android y PC hasta completar su sincronizacion y probarla entre dispositivos/redes reales. Ver `ANDROID_VALIDATION.md` para los resultados efectivamente ejecutados.

## Fuentes y recursos

Se reutiliza el arte/audio local existente del proyecto. Cinzel, MedievalSharp y Outfit estan empaquetadas en `public/fonts/`, con sus licencias OFL; no se descargan de Google Fonts durante la partida.
