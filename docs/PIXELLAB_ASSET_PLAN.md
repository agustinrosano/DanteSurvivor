# Dante Quest — Plan de assets con PixelLab

Estética: **fantasía medieval oscura / gótica** (Infierno de Dante). Paleta apagada:
negros, grises fríos, carmesí (#991b1b), oro viejo (#e6b849), violeta arcano (#6b21a8),
brasas naranjas. Contorno oscuro, sombreado medio, vista **top-down 3/4 (low top-down)**.

## Estado actual del código
- Todo se dibuja con primitivas de Canvas (`fillRect`/`arc`), sin sprites.
- Personajes/enemigos: ~32–40 px de alto en pantalla, `radius` 13–24, solo voltean izq/der (`facing` ±1).
- Tiles: `tileSize = 48` ([ProceduralWorld.js](../src/world/ProceduralWorld.js), [Dungeon.js](../src/world/Dungeon.js)).
- Antorchas/braseros: `world.torches` con luz dinámica en [Lighting.js](../src/world/Lighting.js).
- Retratos ya existen en `public/assets/` (usarlos como referencia de diseño).

## Sprites a generar (tamaño canvas sugerido 64 px, 8 direcciones)

### Héroes — [Player.js](../src/entities/Player.js) `drawHeroSprite`
| id | Descripción | Animaciones |
|---|---|---|
| dante | Caballero, armadura de placas plateada con detalles dorados, ropaje/capa rojo, pelo oscuro, espada larga | idle, walk, attack (slash espada larga), hurt, death, dodge-roll |
| lyra | Hechicera, vestido blanco, pelo rubio, ropaje celeste, bastón | idle, walk, cast, hurt, death |
| kael | Arquero, ropaje verde con detalles marrones y plateados, arco de madera ornamentado | idle, walk, shoot bow, hurt, death |
| morgana | Nigromante, pelo negro, piel pálida, vestido violeta y negro gastado, grimorio flotando en la mano | idle, walk, cast, hurt, death |
| thorin | Paladín enano, armadura dorada con detalles plateados, mazo y escudo | idle, walk, mace smash, shield block, hurt, death |

#### Paleta confirmada de Dante (personaje de referencia del estilo)
| Elemento | Color |
|---|---|
| Armadura de placas | Plata/acero (#cbd5e1 luces, #94a3b8 medios, #475569 sombras) |
| Detalles de la armadura (bordes, hombreras, cinturón, emblema) | Dorado (#e6b849, sombra #a16207) |
| Ropaje: capa, tabardo/faldón | Rojo carmesí (#b91c1c, sombra #7f1d1d) |
| Espada larga | Hoja de acero claro (#f8fafc / #94a3b8), guarda y pomo dorados |
| Pelo | Oscuro (#0f172a) |

Prompt PixelLab sugerido:
> dark medieval fantasy knight, silver steel plate armor with gold trim and gold engravings,
> flowing crimson red cape and red tabard, dark hair, wielding a longsword with gold crossguard,
> grim heroic, dark outline, medium shading, low top-down view, 64px

#### Paletas confirmadas del resto de héroes
| Héroe | Colores clave | Prompt PixelLab sugerido |
|---|---|---|
| Thorin | Armadura dorada (#e6b849 / #a16207), detalles plateados (#cbd5e1), mazo y escudo | stout dwarf paladin, golden plate armor with silver trim, braided beard, holding a heavy flanged mace and a round gold-and-silver shield, dark medieval fantasy, dark outline, low top-down view, 64px |
| Lyra | Vestido blanco (#f1f5f9), ropaje/manto celeste (#7dd3fc / #0369a1), pelo rubio (#facc15), bastón | young sorceress, long blonde hair, white dress with light sky-blue mantle and sleeves, holding a slender magic staff with a glowing pale-blue crystal, dark medieval fantasy, dark outline, low top-down view, 64px |
| Kael | Ropaje verde (#166534 / #14532d), detalles marrones (#78350f) y plateados (#cbd5e1), arco de madera ornamentado | ranger archer, green hooded cloak and tunic, brown leather straps belt and quiver, small silver buckles and bracers, carved wooden longbow with ornate engraved details, dark medieval fantasy, dark outline, low top-down view, 64px |
| Morgana | Piel pálida (#e7e5e4), pelo negro (#0a0a0a), vestido violeta (#6b21a8) y negro (#18181b) gastado/rasgado, grimorio flotante | pale necromancer woman, long black hair, worn tattered violet and black dress, floating open grimoire hovering above her hand with faint purple glow, dark medieval fantasy, dark outline, low top-down view, 64px |

### Jefes — [Boss.js](../src/entities/Boss.js)
Actual: **El Rey de los Condenados** (caballero no-muerto colosal, espadas orbitando, 3 fases).
Propuesta de nuevos jefes (inspirados en los círculos del Infierno de Dante), ~128 px:
| id | Jefe | Concepto | Ataques sugeridos |
|---|---|---|---|
| king_damned | El Rey de los Condenados | Rey esqueleto con corona oxidada y armadura negra | cleave, charge, stomp, nova (ya existe) |
| cerberus | Cerbero | Perro infernal de tres cabezas, pelaje negro y brasas | mordisco triple, aliento de fuego en cono, embestida |
| minos | Minos, el Juez | Gigante con cola de serpiente, toga roja raída | latigazo de cola, sentencia (zona marcada), invoca almas |
| harpy_queen | Reina Arpía | Arpía gigante de plumas negras, Bosque de los Suicidas | lluvia de plumas, picado, espinas del bosque |
| geryon | Gerión | Bestia con rostro humano, alas de murciélago, aguijón | aguijón venenoso, vuelo rasante, engaño (clones) |
| lucifer | Lucifer (jefe final) | Demonio colosal de tres caras atrapado en hielo | ráfagas de hielo, aleteo, tres fases por cara |

### Enemigos — [Enemy.js](../src/entities/Enemy.js)
| tipo | Descripción | Animaciones |
|---|---|---|
| zombie | Caminante putrefacto, piel verde podrida, ropa harapienta | walk, attack, death |
| wolf | Lobo corrupto negro, ojos violetas brillantes | run, bite, death |
| skeleton | Esqueleto arquero, ojos rojos | walk, shoot, death |
| knight | Caballero no-muerto, armadura oscura, escudo | walk, attack, death |
| wraith | Espectro sombrío violeta translúcido | float, attack, death |
| boss | Ver sección **Jefes** arriba | idle, walk, attacks, death |

### Efectos (VFX) — [Weapons.js](../src/systems/Weapons.js), [Projectile.js](../src/entities/Projectile.js)
- Arco de corte del espadón (slash)
- Dagas giratorias orbitando (cuchillas)
- Bola de fuego + explosión
- Rayo arcano / relámpago
- Flecha con estela
- Habilidades: Furia del Guerrero (aura roja), Tormenta Ígnea (meteoritos),
  Lluvia de Flechas, Drenaje de Almas (hilos de alma verdes/violetas), Consagración Divina (círculo sagrado dorado)
- Impacto/sangre, subida de nivel, recogida de almas/XP

### Escenografía — tiles 48 px
- Tileset top-down: suelo de adoquín agrietado con musgo ↔ tierra/ceniza ↔ lava
- Muros de mazmorra, ruinas góticas
- Objetos: farol/brasero con llama animada, antorcha de pared, tumbas, columnas rotas,
  árboles muertos, cofres, calaveras, estandartes rasgados

## Integración
1. Guardar en `public/assets/sprites/<categoria>/`.
2. Crear `src/core/Sprites.js` (cargador + animador por spritesheet/dirección).
3. Reemplazar `drawHeroSprite` y `Enemy.render` por dibujo de sprites, manteniendo el
   flash de daño (filtro/blanco) y las sombras actuales; conservar el dibujo procedural como fallback.
