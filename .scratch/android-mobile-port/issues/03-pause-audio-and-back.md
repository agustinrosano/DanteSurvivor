# 03: Leave and return to a run safely

**What to build:** backgrounding pauses the game and audio, returning awaits the player's resume action, and Android Back pauses or navigates safely.

**Blocked by:** 01: Install and launch the game offline.

**Status:** done

- [x] Backgrounding stops active input and pauses gameplay/audio.
- [x] Returning does not advance simulation by the elapsed background time.
- [x] Resume works and honors the player's sound preference.
- [x] Back pauses a run or returns from a menu without bypassing upgrade/end-game modals.

## Verification

Verified: browser lifecycle and level-up modal guard; native Android 16 Back and quick Home/return. Audio cleanup is implemented; audible interruption behavior on the physical Moto remains on the device checklist.
