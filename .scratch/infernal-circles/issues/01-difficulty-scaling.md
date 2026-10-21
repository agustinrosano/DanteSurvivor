# 01: Escalado de dificultad

**What to build:** Los enemigos de los mapas actuales ganan vida según mapa, minuto y nivel, sin modificar los que ya están vivos.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Aplicar fórmula aprobada a hordas, élites y esbirros al crearlos.
- [x] Mantener daño y velocidad fuera de la curva automática.
- [x] Respetar límite 250 incluso en lotes e invocaciones.

## Validation
Web build passes. Worked examples via public Enemy constructor: Bosque zombie at 300s/level10 = 38HP (ceil 37.25); Limbo elite at 0s/level1 = 250HP. Creation is centralized for hordes and summons; living HP is never recalculated.
