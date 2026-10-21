# Port Android: investigacion inicial

Estado: investigacion completada; decisiones de producto pendientes.

## Punto de partida

- Rama creada: `feat/android-mobile-port`.
- Se conserva el cambio preexistente en `src/core/Engine.js` que impide abrir la pausa sobre los modales de subida de nivel y fin de partida.
- El juego usa Canvas 2D, JavaScript con modulos ES, Vite y PeerJS.
- Existen joystick tactil, botones de esquiva y habilidad, y boton de pausa.
- No existe todavia un proyecto Android nativo ni configuracion Capacitor.

## Hallazgos del explorador

- `src/core/Input.js`: controles mediante eventos `touch*`. Revisar multitouch y restablecimiento del input al perder el foco.
- `src/core/Engine.js`: canvas ligado a `innerWidth/innerHeight`; falta verificar orientacion, resolucion y comportamiento al volver del segundo plano.
- `src/core/Audio.js`: audio inicializado al empezar la sesion; falta verificar suspension y reanudacion en Android.
- `src/style.css` e `index.html`: interfaz tactil y viewport existentes; falta validar margenes seguros, superposiciones y menus en pantallas pequeñas.
- Recursos locales con rutas `/assets/...` y fuentes externas: comprobar que el empaquetado incluya lo necesario para jugar sin conexion en modo individual.
- Multijugador PeerJS/WebRTC: requiere pruebas entre navegador y Android, con redes reales. No se ha verificado esa compatibilidad.

## Entorno detectado y verificacion

- Android Studio instalado en `C:/Program Files/Android/Android Studio`.
- Java incluido en Android Studio: OpenJDK 21.0.10.
- SDK presente en `%LOCALAPPDATA%/Android/Sdk`; falta confirmar las plataformas y herramientas requeridas para la version elegida de Capacitor.
- Node: v25.8.2.
- ADB funciona; no hay dispositivos conectados.
- La compilacion web actual paso con Vite 8.3.4, con salida a una carpeta temporal para preservar `dist/`.
- En PowerShell, usar `npm.cmd` y `npx.cmd` si la politica local bloquea los lanzadores `.ps1`; no es necesario cambiar esa politica.
- No se ha generado un APK ni probado la ejecucion del juego en Android.

## Decisiones pendientes

1. Primer entregable: APK Android con Capacitor o version para navegador Android.
2. Orientacion horizontal o ambas orientaciones.
3. Modelo de telefono y version de Android para las pruebas de aceptacion.

## Propuesta para revisar

APK Android con Capacitor, experiencia horizontal y controles tactiles a ambos lados. Preservar las funciones existentes, incluidos guardado y cooperativo. Validar el recorrido real: iniciar partida, moverse y usar acciones simultaneamente, subir de nivel, pausar, cambiar de aplicacion y volver, terminar partida y recuperar el progreso tras reiniciar.

Con las decisiones resueltas, sintetizar la especificacion con `to-spec`, proponer tickets con sus dependencias mediante `to-tickets` e implementar con pruebas de comportamiento y revision. El setup local de las skills aun no fue aplicado: la propuesta anterior de tickets Markdown sigue pendiente de confirmacion.

## Documentacion consultada

- [Capacitor: instalar en un proyecto web existente](https://capacitorjs.com/docs/getting-started).
- [Capacitor: entorno de desarrollo](https://capacitorjs.com/docs/getting-started/environment-setup).
- [Capacitor: Android](https://capacitorjs.com/docs/android).
- [Capacitor App: eventos del ciclo de vida y boton atras](https://capacitorjs.com/docs/apis/app).
