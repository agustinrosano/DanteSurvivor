# 05: Validación y APK

**What to build:** Los cuatro mapas funcionan en navegador y se entrega una APK instalable para probar en Android.

**Blocked by:** 01, 02, 03, 04.

**Status:** done

- [x] Pruebas de interfaz y regresión móvil pasan.
- [x] Build web y APK debug pasan; smoke Android16 si disponible.
- [x] Revisión de estándares y especificación resuelta.
- [x] Documentar ruta APK y límites de validación física.

## Validation
Full suite: 25 passed, 1 desktop touch-only skip. Web and debug APK1.1 builds pass. Extended Android16 smoke installs APK and checks both circles plus lifecycle/persistence. Reviews resolved in d58f24c. Versioned APK and SHA256 documented in docs/CIRCLES_VALIDATION.md. No physical phone attached; performance, full-run balance and manual boss-phase playthrough on Moto G75 remain pending and are not claimed as tested.
