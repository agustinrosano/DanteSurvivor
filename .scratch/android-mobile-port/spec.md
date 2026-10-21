# Android mobile port

Status: ready-for-agent

## Problem Statement

The player wants to install DANTE QUEST on a Moto G75 running Android 16 and play comfortably with touch controls. The current browser game has basic touch support but no Android package, lifecycle handling or verified landscape layouts.

## Solution

Package the existing game with Capacitor as a landscape Android APK, keep its browser build, and make the player journey work on a phone: choose a hero and map, play, use movement and actions together, pause, switch apps, return, and retain permanent progress.

## User Stories

1. As a player, I want an APK so I can install and launch the game from Android.
2. As a solo player, I want bundled art, audio and fonts so I can start without internet.
3. As a player, I want landscape fullscreen so I have room to see and control combat.
4. As a player, I want menus that fit or scroll so every hero, map and upgrade is reachable.
5. As a player, I want movement and actions to work simultaneously so I can dodge while moving.
6. As a player, I want cancelled touches to release so my hero cannot get stuck moving.
7. As a player, I want safe screen margins so system bars and cutouts do not hide controls.
8. As a player, I want switching apps or locking the screen to pause safely and silence audio.
9. As a player, I want returning to keep the game paused until I choose to continue.
10. As a player, I want Android Back to pause or navigate menus without losing a run accidentally.
11. As a player, I want my chosen hero, map and earned permanent progress to persist after relaunch.
12. As a browser player, I want keyboard and mouse controls to keep working.
13. As a cooperative player, I want the existing room workflow to remain available and its device/network limitations clearly verified.

## Implementation Decisions

- Reuse the Canvas/JavaScript game and locally bundled assets. Capacitor 8 packages the static build with no production remote server URL.
- Landscape orientation, joystick on the left and action buttons on the right. Maintain existing desktop behavior.
- Centralize platform lifecycle and Back integration behind a small mobile adapter; retain game state and modal ownership in the engine/menu interface.
- Clear input on cancellation, backgrounding and modal transitions. Resume the clock without simulating elapsed background time.
- Persist the existing permanent progression format. Resuming an interrupted active run after process termination is outside this port.
- Avoid high-DPI rendering costs on mobile; bound render resolution and reduce repeated HUD work without changing game balance.
- The prior pause/modal guard already present in the user's working tree must be preserved.

## Testing Decisions

The user approved testing through the player interface and the packaged APK. Browser integration checks cover menu navigation, touch actions, modal/pause behavior, background/foreground, persistence and desktop input. These are observable behavior checks, not tests of internal collaborators.

Android checks cover building/installing the APK, local assets, orientation, lifecycle, Back and storage. An emulator can validate integration but cannot establish performance on a Moto G75. Real-phone performance and real-network cooperativo are reported separately if no device is connected.

No preexisting automated test suite was found. Establish a small browser regression suite and use one failing behavior check at a time during implementation.

## Out of Scope

iOS, Google Play publication, release signing, new generated art, monetization, backend services, and redesigning the multiplayer game architecture.

## Further Notes

The user approved this plan and four local tickets. Hardware target: Moto G75, Android 16. Branch: `feat/android-mobile-port`. A web baseline build already passes; no Android APK existed at the start.
