# DANTE QUEST — 2D Multiplayer Fantasy Survival RPG ⚔️

**DANTE QUEST** es un videojuego RPG de acción y supervivencia en 2D con vista cenital (*top-down*), inspirado en *Vampire Survivors*, *Diablo 1* y los clásicos juegos de fantasía medieval oscura.

Lucha contra hordas masivas de criaturas malditas, desciende a catacumbas procedurales, sube de nivel forjando poderosas combinaciones de armas y juega en cooperativo multijugador en tiempo real entre navegadores PC y Android.

---

## 🎮 Características Principales

- **Combate de Acción & Hordas:** Ataques automáticos inteligentes, volteretas de esquiva con fotogramas de invulnerabilidad (*iFrames*), y habilidades especiales activables.
- **Roster de 5 Héroes con Habilidades y Sprites Únicos:**
  - ⚔️ **Dante (Guerrero):** Armadura completa plateada de acero, capa carmesí y espadón de dos manos con barridos en arco. Habilidad: *Furia del Guerrero*.
  - 🔮 **Lyra (Hechicera):** Túnica violeta, báculo arcano y bolas de fuego explosivas. Habilidad: *Tormenta Ígnea*.
  - 🏹 **Kael (Arquero):** Cazador élfico con arco curvado y flechas perforantes rápidas. Habilidad: *Lluvia de Flechas*.
  - 💀 **Morgana (Nigromante):** Sacerdotisa oscura con báculo de calavera y relámpagos arcanos. Habilidad: *Drenaje de Almas*.
  - 🛡️ **Thorin (Paladín):** Enano en armadura dorada con martillo y escudos orbitantes. Habilidad: *Consagración Divina*.
- **Mundo Procedural Infinito:** Generación por *chunks* deterministas basados en semillas, con biomas diferenciados (*Bosque de los Condenados, Tierras Malditas, Reino de las Sombras*).
- **Mazmorras Procedurales (Estilo Diablo 1):** Desciende por el portal de la *Cripta Maldita* a un laberinto de piedra con cofres de tesoros, antorchas y portales de escape.
- **Jefe Regional Épico — El Rey de los Condenados:** Combate en 3 fases con ataques telegrafiados en rojo (espadazos masivos, pisotones con ondas expansivas, cargas en estampida y novas oscuras).
- **Cooperativo Multijugador en Tiempo Real:** Sistema P2P WebRTC con códigos de sala de 4 caracteres. Los aliados caídos pueden ser revividos en su círculo sagrado.
- **Iluminación Dinámica & Audio Medieval:** Niebla nocturna gótica cortada por antorchas y proyectiles, música de batalla instrumental en bucle y efectos de sonido medievales generados con **Genex Tools**.
- **Controles Multiplataforma:** Teclado y ratón para PC y Joystick virtual táctil adaptativo para móviles y Android.

---

## 🕹️ Controles

### PC
- **[W] [A] [S] [D]** o **Flechas:** Mover personaje
- **[ESPACIO]:** Esquivar / Voltereta (*Dodge Roll*)
- **[Q]** o **[E]:** Habilidad especial activa
- **[Ratón]:** Menús y selección

### Móvil / Android
- **Joystick Virtual:** En la esquina inferior izquierda
- **Botón Esquivar:** En la esquina inferior derecha
- **Botón Habilidad:** En la esquina inferior derecha

---

## 🚀 Instalación y Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/agustinrosano/DanteSurvivor.git
   cd DanteSurvivor
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir en el navegador:
   ```
   http://localhost:5173/
   ```

---

## 🛠️ Tecnologías

- **Motor:** HTML5 Canvas 2D + Vanilla JavaScript moderno (ES Modules).
- **Bundler & DevServer:** [Vite](https://vitejs.dev/).
- **Networking Multijugador:** [PeerJS](https://peerjs.com/) (WebRTC DataChannels P2P).
- **Generación de Assets IA:** [Genex Tools](https://genex.games) (imágenes transparentes, texturas de terreno, música instrumental en bucle y efectos de sonido).
