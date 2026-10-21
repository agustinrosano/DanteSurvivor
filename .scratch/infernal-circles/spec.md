# Lujuria y Gula
Status: in-progress
Baseline: 352c0a6249e7404ce5fdd92b71ed5e820c4435bc
Branch: feat/android-mobile-port

## Approved design
- Four freely selectable maps for testing: Bosque, Limbo, Lujuria, Gula. Preserve existing saves and browser/touch play.
- Enemy HP at creation = base type HP (including elite) × map factor × (1 + 0.08 × elapsed minutes + 0.01 × (hero level - 1)). Factors 1, 1.25, 1.5, 1.8. Continuous elapsed gameplay time; pause/background do not advance it. Never recalculate living enemy HP. Use highest active hero level if a party exists.
- Preserve the 250-enemy cap, also for batches and summons. Do not automatically scale damage or speed.
- Lujuria: subdued rose/red ruins, storm souls and ranged enemies; warning gusts push players through collision-aware movement.
- Gula: green/gray mud, dirty freezing rain, resilient gluttons and creatures leaving slowing puddles.
- Surface map events begin after the first minute. Active 8–12 seconds, every 35–50 seconds, two-second warning. Localized hazards leave safe paths. Puddles can remain after rain, but expire by age or distance and have a global count cap. Clear all hazards on session/world changes. Boss attacks own hazards during the boss fight.
- Bosses awaken on approaching the altar, as before. Lujuria: Señor de la Tempestad (tornadoes, gusts, safe zones). Gula: Cerbero with visibly three heads (bites, charge, coordinated heads). Three phases at 65% and 30%; HP fixed at activation and gentler time/level scaling than normal enemies.
- After 120 seconds, surface minimap shows an arrow toward the altar, including when off-map; replace with boss marker when awakened. No misleading surface arrow in a crypt.
- Victory on defeating boss, larger rewards through existing souls/XP economy. New persistent items/skills/reward systems deferred.
- Bundle art locally, bound visual effects, preserve Android landscape/lifecycle controls. Generate a new debug APK for Moto G75/Android16 testing, not a Play Store release.

## Validation
Use the already agreed player-interface and packaged-APK seams: browser regression, new map selection/persistence, gameplay and boss journeys, pause/events, Android16 emulator smoke where available. Review against this spec and project standards. Real Moto G75 performance must be reported as pending when no phone is attached.

## Tickets
01 scaling; 02 Lujuria (blocked by 01); 03 Gula (blocked by 02 shared events);
04 altar guide (independent); 05 validation/APK (blocked by 01–04).
