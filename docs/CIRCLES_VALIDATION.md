# Validación de círculos — Android 1.1

## Entrega

- Rama: `feat/android-mobile-port`.
- APK: `artifacts/android/dante-quest-circles-v1.1-debug.apk` y ruta habitual `artifacts/android/dante-quest-debug.apk`.
- App: `com.agustinrosano.dantequest`, versionName 1.1, versionCode 2, minSDK 24, targetSDK 36.
- Tamaño: 31,018,524 bytes (aprox. 29.6 MiB).
- SHA256: `2A743DFC726A9864C1C3B77AF9EB33A7E7E619E769630556186B8690F4455A47`.
- Los cuatro PNG de los círculos están presentes dentro del APK.

## Verificación ejecutada

- `npm.cmd run build`: pasa.
- `npm.cmd run android:apk`: pasa; Gradle firma el APK debug.
- Pruebas focalizadas: Lujuria/Gula seleccionables, inicio sin servicios externos, persistencia y activación del boss por proximidad: 4 pasan en navegador táctil.
- Partida larga con reloj de prueba y simulación real: lluvia desde el minuto 1, pausa que conserva el evento/reloj y guía al altar después de 02:00 lejos del origen: pasa.
- `npm.cmd run test:mobile`: **25 pasan, 1 omitida**, 5.0 minutos. La omitida corresponde a gestos táctiles en el proyecto desktop; ese caso pasa en android-web. Incluye recorridos nuevos y regresiones de controles, pausa, mejoras y guardado.
- `npm.cmd run android:smoke`: pasa en emulador Android 16/API36. Instalación, horizontal, recursos locales, partida, Atrás, Home/regreso pausado, selección tras reiniciar el proceso y ambos mapas nuevos. Sin reemplazar datos de guardado del dispositivo.
- Capturas nativas: `artifacts/android/android-device-lujuria.png`, `android-device-gula.png`. Capturas de bosses y guía: `lujuria-boss-web.png`, `gula-boss-web.png`, `gula-altar-guide-web.png`.
- Revisiones independientes de estándares y especificación cerradas: [revisión](CIRCLES_REVIEW.md).

## Alcance y comprobaciones pendientes

Las pruebas de interfaz alcanzan el altar y reconocen cada guardián; la lógica de fases, límites y limpieza también se revisó estáticamente. No equivalen a completar todos los combates en un teléfono real. Quedan el balance de una partida completa, las tres fases jugando, la fluidez sostenida, audio e interrupciones y recortes de pantalla en el Moto G75. No se conectó un teléfono físico; la APK queda lista para instalar y probar allí.

El cooperativo conserva la limitación de sincronización documentada en el port Android anterior; esta entrega no rediseña la red. Habilidades y objetos persistentes nuevos siguen fuera de alcance.
