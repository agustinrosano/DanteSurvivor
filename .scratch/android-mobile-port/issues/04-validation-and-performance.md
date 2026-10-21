# 04: Validate progression, cooperative access and performance

**What to build:** a verified APK handoff and regression checks for permanent progression, browser compatibility and mobile play, with remaining physical-device/network checks clearly recorded.

**Blocked by:** 02: Play comfortably with touch in landscape; 03: Leave and return to a run safely.

**Status:** done

- [x] Browser behavior tests and production build pass.
- [x] Permanent progression and hero/map selection survive relaunch.
- [x] Cooperative room workflow is checked; existing gaps and real-network limitations are reported accurately.
- [x] Avoidable repeated HUD/render work is reduced without changing game balance.
- [x] An APK and reproducible install instructions are available.
- [x] Moto G75 / Android 16 manual performance results are recorded, or explicitly pending when the phone is unavailable.

## Verification

Verified: 15 browser tests passed, one desktop touch case skipped; production APK build and Android 16 native smoke passed, including process-restart hero/map persistence. Permanent upgrade/spent-souls UI regression passed. Cooperative synchronization was already incomplete in master and is documented. Moto G75 physical performance/audio checks are explicitly pending because no phone was connected.
