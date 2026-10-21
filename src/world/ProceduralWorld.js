// ============================================================================
// DANTE QUEST — Procedural Infinite World (Chunk Generation & Biomes)
// ============================================================================

import { MAPS } from '../systems/Maps.js';

// Simple deterministic PRNG based on Mulberry32
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 2D Perlin-like pseudo noise using coordinate hashing
function hash2D(x, y, seed) {
  let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, y, seed) {
  const iX = Math.floor(x);
  const iY = Math.floor(y);
  const fX = x - iX;
  const fY = y - iY;

  // Cubic interpolation curve
  const u = fX * fX * (3.0 - 2.0 * fX);
  const v = fY * fY * (3.0 - 2.0 * fY);

  const n00 = hash2D(iX, iY, seed);
  const n10 = hash2D(iX + 1, iY, seed);
  const n01 = hash2D(iX, iY + 1, seed);
  const n11 = hash2D(iX + 1, iY + 1, seed);

  return (
    n00 * (1 - u) * (1 - v) +
    n10 * u * (1 - v) +
    n01 * (1 - u) * v +
    n11 * u * v
  );
}

export class ProceduralWorld {
  constructor(seed = 1337, mapId = 'bosque') {
    this.seed = seed;
    this.mapId = mapId;
    this.map = MAPS[mapId] || MAPS.bosque;
    this.theme = this.map.terrain;
    this.tileSize = 48; // px
    this.chunkSize = 16; // 16x16 tiles per chunk
    this.chunkPx = this.tileSize * this.chunkSize; // 768px

    this.loadedChunks = new Map(); // key "cx,cy" -> chunk data
    this.torches = []; // Animated world lights: { x, y, lightRadius: 180 }
    this.surfaceChests = []; // Rare surface treasure chests

    const isLimbo = this.mapId === 'limbo';
    this.dungeonEntrances = [
      { id: 'crypt_1', name: isLimbo ? 'Vórtice de las Sombras' : 'Cripta Maldita', x: 350, y: -280, radius: 42, seed: this.seed + 101, dungeonLevel: 1 },
      { id: 'crypt_2', name: isLimbo ? 'Sagrario Astral' : 'Catacumbas del Olvido', x: -750, y: -450, radius: 42, seed: this.seed + 202, dungeonLevel: 2 },
      { id: 'crypt_3', name: isLimbo ? 'Abismo del Vacío' : 'Fosa de los Herejes', x: 700, y: 720, radius: 42, seed: this.seed + 303, dungeonLevel: 3 },
      { id: 'crypt_4', name: isLimbo ? 'Pórtico del Destino' : 'Sepulcro Antiguo', x: -650, y: 680, radius: 42, seed: this.seed + 404, dungeonLevel: 4 }
    ];
    this.cryptEntrance = this.dungeonEntrances[0]; // Backwards compatibility
    if (this.map.dungeonNames) this.dungeonEntrances.forEach((entrance, i) => { entrance.name = this.map.dungeonNames[i]; });
    this.altar = { x: -400, y: 400, radius: 50, activated: false }; // Regional Altar to summon Boss!

    this.lanternImg = new Image();
    this.lanternImg.src = '/assets/sprites/props/lantern.png';
  }

  getChunkKey(cx, cy) {
    return `${cx},${cy}`;
  }

  update(playerX, playerY) {
    const currentChunkX = Math.floor(playerX / this.chunkPx);
    const currentChunkY = Math.floor(playerY / this.chunkPx);
    const viewRadius = 2; // Render 5x5 chunks around player

    const activeKeys = new Set();

    for (let dx = -viewRadius; dx <= viewRadius; dx++) {
      for (let dy = -viewRadius; dy <= viewRadius; dy++) {
        const cx = currentChunkX + dx;
        const cy = currentChunkY + dy;
        const key = this.getChunkKey(cx, cy);
        activeKeys.add(key);

        if (!this.loadedChunks.has(key)) {
          this.loadedChunks.set(key, this.generateChunk(cx, cy));
        }
      }
    }

    // Unload chunks far away to maintain 60 FPS
    for (const [key, chunk] of this.loadedChunks.entries()) {
      if (!activeKeys.has(key)) {
        // Remove torches and chests of this chunk
        this.torches = this.torches.filter(t => t.chunkKey !== key);
        this.surfaceChests = this.surfaceChests.filter(c => c.chunkKey !== key);
        this.loadedChunks.delete(key);
      }
    }
  }

  generateChunk(cx, cy) {
    const chunkSeed = Math.abs(Math.sin(cx * 374761393 + cy * 668265263 + this.seed) * 100000);
    const rng = mulberry32(chunkSeed);

    const tiles = [];
    const obstacles = [];

    // Determine biome from macro noise
    const macroVal = smoothNoise(cx * 0.15, cy * 0.15, this.seed);
    const isLimbo = this.mapId === 'limbo';
    let biome = isLimbo ? 'limbo_eter' : 'bosque';

    if (isLimbo) {
      if (macroVal > 0.62) biome = 'limbo_abismo';
      else if (macroVal < 0.32) biome = 'limbo_cenizas';
    } else {
      if (macroVal > 0.65) biome = 'tierras_malditas';
      else if (macroVal < 0.25) biome = 'sombras';
    }

    for (let ty = 0; ty < this.chunkSize; ty++) {
      for (let tx = 0; tx < this.chunkSize; tx++) {
        const worldTileX = cx * this.chunkSize + tx;
        const worldTileY = cy * this.chunkSize + ty;
        const noise = smoothNoise(worldTileX * 0.08, worldTileY * 0.08, this.seed);

        let tileType = 'grass';
        if (this.theme) {
          tileType = noise < 0.3 ? 'circle_dust' : noise > 0.65 ? 'circle_path' : 'circle_stone';
        } else if (isLimbo) {
          if (biome === 'limbo_abismo') {
            tileType = noise > 0.4 ? 'spectral_slate' : 'ethereal_void';
          } else if (biome === 'limbo_cenizas') {
            tileType = noise > 0.4 ? 'soul_ash' : 'spectral_slate';
          } else {
            tileType = noise > 0.5 ? 'spectral_slate' : (noise > 0.25 ? 'astral_path' : 'ethereal_void');
          }
        } else {
          if (biome === 'tierras_malditas') {
            tileType = noise > 0.4 ? 'dirt' : 'corrupted';
          } else if (biome === 'sombras') {
            tileType = noise > 0.4 ? 'obsidian' : 'void';
          } else {
            tileType = noise > 0.5 ? 'deep_grass' : (noise > 0.25 ? 'grass' : 'path');
          }
        }

        tiles.push({ x: tx, y: ty, type: tileType });

        // World coordinates
        const wx = (cx * this.chunkSize + tx) * this.tileSize + this.tileSize / 2;
        const wy = (cy * this.chunkSize + ty) * this.tileSize + this.tileSize / 2;

        // Skip obstacles near spawn, crypt entrance or altar
        const distSpawn = Math.hypot(wx, wy);
        const distCrypt = Math.hypot(wx - this.cryptEntrance.x, wy - this.cryptEntrance.y);
        const distAltar = Math.hypot(wx - this.altar.x, wy - this.altar.y);

        const nearEntrance = this.dungeonEntrances.some(entrance => Math.hypot(wx - entrance.x, wy - entrance.y) < 100);
        if (distSpawn > 120 && distCrypt > 100 && !nearEntrance && distAltar > 220) {
          const rand = rng();
          if (this.theme) {
            if (rand < 0.06) {
              obstacles.push({ x: wx, y: wy, radius: 16, type: 'circle_ruin', variant: rand < 0.03 ? 'pillar' : 'remains' });
            } else if (rand < 0.075) {
              const torch = { x: wx, y: wy, radius: 10, type: 'circle_light', lightRadius: 180, chunkKey: this.getChunkKey(cx, cy) };
              obstacles.push(torch); this.torches.push(torch);
            }
          } else if (isLimbo) {
            // Limbo specific obstacles
            if (rand < 0.055) {
              // Runic Monolith
              obstacles.push({
                x: wx,
                y: wy,
                radius: 20,
                type: 'monolith',
                variant: Math.floor(rand * 3)
              });
            } else if (rand < 0.08) {
              // Soul Crystal cluster
              obstacles.push({
                x: wx,
                y: wy,
                radius: 14,
                type: 'soul_crystal'
              });
            } else if (rand < 0.09) {
              // Ethereal Will-o'-the-wisp lantern
              const torch = {
                x: wx,
                y: wy,
                radius: 12,
                type: 'soul_lantern',
                lightRadius: 190 + rng() * 25,
                chunkKey: this.getChunkKey(cx, cy)
              };
              obstacles.push(torch);
              this.torches.push(torch);
            }
          } else {
            // Forest specific obstacles
            if (rand < 0.055) {
              // Tree
              obstacles.push({
                x: wx,
                y: wy,
                radius: 20,
                type: 'tree',
                height: 48,
                variant: Math.floor(rand * 3)
              });
            } else if (rand < 0.08) {
              // Tombstone / Ruin
              obstacles.push({
                x: wx,
                y: wy,
                radius: 14,
                type: 'tombstone'
              });
            } else if (rand < 0.09) {
              // Torch Brazier
              const torch = {
                x: wx,
                y: wy,
                radius: 12,
                type: 'brazier',
                lightRadius: 180 + rng() * 20,
                chunkKey: this.getChunkKey(cx, cy)
              };
              obstacles.push(torch);
              this.torches.push(torch);
            }
          }
        }
      }
    }

    // Rare surface chests (few scattered in the world, far from center)
    const distCenter = Math.hypot(cx * this.chunkPx, cy * this.chunkPx);
    if (rng() < 0.12 && distCenter > 320) {
      const tx = 3 + Math.floor(rng() * 10);
      const ty = 3 + Math.floor(rng() * 10);
      const chestX = (cx * this.chunkSize + tx) * this.tileSize + this.tileSize / 2;
      const chestY = (cy * this.chunkSize + ty) * this.tileSize + this.tileSize / 2;
      this.surfaceChests.push({
        x: chestX,
        y: chestY,
        radius: 22,
        opened: false,
        chunkKey: this.getChunkKey(cx, cy),
        lootValue: 35 + Math.floor(rng() * 25)
      });
    }

    return { cx, cy, biome, tiles, obstacles };
  }

  checkCollision(x, y, radius) {
    const cx = Math.floor(x / this.chunkPx);
    const cy = Math.floor(y / this.chunkPx);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const chunk = this.loadedChunks.get(this.getChunkKey(cx + dx, cy + dy));
        if (!chunk) continue;

        for (const obs of chunk.obstacles) {
          const dist = Math.hypot(x - obs.x, y - obs.y);
          if (dist < radius + obs.radius) {
            // Push out vector
            const angle = Math.atan2(y - obs.y, x - obs.x);
            const overlap = (radius + obs.radius) - dist;
            return {
              colliding: true,
              pushX: Math.cos(angle) * overlap,
              pushY: Math.sin(angle) * overlap
            };
          }
        }
      }
    }

    return { colliding: false, pushX: 0, pushY: 0 };
  }

  render(ctx, camera) {
    // 1. Render terrain tiles
    for (const chunk of this.loadedChunks.values()) {
      const chunkWorldX = chunk.cx * this.chunkPx;
      const chunkWorldY = chunk.cy * this.chunkPx;

      // Frustum check for chunk
      if (!camera.isInView(chunkWorldX + this.chunkPx / 2, chunkWorldY + this.chunkPx / 2, this.chunkPx / 2)) {
        continue;
      }

      for (const tile of chunk.tiles) {
        const tx = chunkWorldX + tile.x * this.tileSize;
        const ty = chunkWorldY + tile.y * this.tileSize;

        if (!camera.isInView(tx + this.tileSize / 2, ty + this.tileSize / 2, this.tileSize)) continue;

        let baseColor = '#1c281e';
        let detailColor = '#152016';

        if (this.theme) {
          const index = tile.type === 'circle_dust' ? 0 : tile.type === 'circle_path' ? 2 : 1;
          baseColor = this.theme.floors[index];
          detailColor = this.theme.details[index];
        } else if (tile.type === 'spectral_slate') {
          baseColor = '#181428';
          detailColor = '#291e42';
        } else if (tile.type === 'ethereal_void') {
          baseColor = '#0c0818';
          detailColor = '#1c1230';
        } else if (tile.type === 'soul_ash') {
          baseColor = '#221330';
          detailColor = '#381c4e';
        } else if (tile.type === 'astral_path') {
          baseColor = '#2d2048';
          detailColor = '#432e6a';
        } else if (tile.type === 'deep_grass') {
          baseColor = '#152217';
          detailColor = '#0f1911';
        } else if (tile.type === 'path') {
          baseColor = '#3b3228';
          detailColor = '#2b2319';
        } else if (tile.type === 'dirt') {
          baseColor = '#382218';
          detailColor = '#291811';
        } else if (tile.type === 'corrupted') {
          baseColor = '#2d182e';
          detailColor = '#1c0c1d';
        } else if (tile.type === 'obsidian') {
          baseColor = '#161421';
          detailColor = '#0d0c14';
        }

        ctx.fillStyle = baseColor;
        ctx.fillRect(tx, ty, this.tileSize, this.tileSize);

        // Subtle tile texture details
        ctx.fillStyle = detailColor;
        ctx.fillRect(tx + 4, ty + 4, 6, 6);
        ctx.fillRect(tx + 24, ty + 20, 8, 4);

        // Occasional faint glowing rune markings in Limbo
        if (tile.type === 'spectral_slate' && ((tx * 31 + ty * 17) % 7 === 0)) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
          ctx.fillRect(tx + 16, ty + 16, 4, 12);
          ctx.fillRect(tx + 12, ty + 20, 12, 4);
        }
      }
    }

    // 2. Render Special Landmarks (Crypt Entrance & Altar)
    this.renderLandmarks(ctx, camera);

    // 3. Render Obstacles
    for (const chunk of this.loadedChunks.values()) {
      for (const obs of chunk.obstacles) {
        if (!camera.isInView(obs.x, obs.y, 60)) continue;

        if (obs.type === 'circle_ruin' || obs.type === 'circle_light') {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath(); ctx.ellipse(obs.x, obs.y + 8, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = this.theme.prop;
          if (obs.type === 'circle_light') {
            ctx.fillRect(obs.x - 7, obs.y - 14, 14, 20);
            ctx.fillStyle = this.theme.accent;
            ctx.beginPath(); ctx.arc(obs.x, obs.y - 20 + Math.sin(Date.now() * 0.003 + obs.x) * 3, 5, 0, Math.PI * 2); ctx.fill();
          } else if (obs.variant === 'pillar') {
            ctx.fillRect(obs.x - 12, obs.y - 25, 24, 32);
            ctx.fillStyle = this.theme.wall; ctx.fillRect(obs.x - 7, obs.y - 23, 3, 28);
            ctx.fillStyle = this.theme.accent; ctx.fillRect(obs.x - 14, obs.y - 28, 28, 5);
          } else {
            ctx.fillRect(obs.x - 17, obs.y - 4, 34, 10);
            ctx.fillStyle = this.theme.accent;
            ctx.fillRect(obs.x - 8, obs.y - 10, 10, 9);
            ctx.fillRect(obs.x + 7, obs.y - 6, 3, 14);
          }
        } else if (obs.type === 'monolith') {
          // Limbo Runic Monolith (Levitating ancient obsidian obelisk)
          const levitate = Math.sin(Date.now() * 0.002 + obs.x) * 3;

          // Shadow on ground
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y + 12, obs.radius * 1.4, obs.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Obsidian Pillar Body
          ctx.fillStyle = '#110c1c';
          ctx.beginPath();
          ctx.moveTo(obs.x - 14, obs.y + 8 + levitate);
          ctx.lineTo(obs.x - 10, obs.y - 40 + levitate);
          ctx.lineTo(obs.x + 10, obs.y - 40 + levitate);
          ctx.lineTo(obs.x + 14, obs.y + 8 + levitate);
          ctx.closePath();
          ctx.fill();

          // Dark crystal edges
          ctx.strokeStyle = '#381c5a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Glowing Runic Inscriptions (Cyan / Violet)
          const runePulse = 0.5 + Math.sin(Date.now() * 0.004 + obs.y) * 0.3;
          ctx.fillStyle = `rgba(168, 85, 247, ${runePulse})`;
          ctx.fillRect(obs.x - 3, obs.y - 30 + levitate, 6, 18);
          ctx.fillStyle = `rgba(56, 189, 248, ${runePulse})`;
          ctx.fillRect(obs.x - 6, obs.y - 20 + levitate, 12, 3);
          ctx.fillRect(obs.x - 4, obs.y - 12 + levitate, 8, 3);

          // Levitating Crystal Tip
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y - 48 + levitate, 4, 0, Math.PI * 2);
          ctx.fill();

        } else if (obs.type === 'soul_crystal') {
          // Limbo Soul Crystal Cluster
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y + 6, 16, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sharp crystal cluster
          ctx.fillStyle = '#581c87';
          ctx.beginPath();
          ctx.moveTo(obs.x - 10, obs.y + 4);
          ctx.lineTo(obs.x - 6, obs.y - 22);
          ctx.lineTo(obs.x - 2, obs.y + 4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.moveTo(obs.x - 4, obs.y + 4);
          ctx.lineTo(obs.x + 2, obs.y - 28);
          ctx.lineTo(obs.x + 8, obs.y + 4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(obs.x + 4, obs.y + 4);
          ctx.lineTo(obs.x + 10, obs.y - 16);
          ctx.lineTo(obs.x + 13, obs.y + 4);
          ctx.closePath();
          ctx.fill();

        } else if (obs.type === 'soul_lantern') {
          // Limbo Will-o'-the-wisp soul lantern
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y + 6, 14, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Ornate spectral pedestal
          ctx.fillStyle = '#1e162a';
          ctx.fillRect(obs.x - 6, obs.y - 14, 12, 18);
          ctx.fillStyle = '#3b2454';
          ctx.fillRect(obs.x - 9, obs.y - 16, 18, 4);

          // Levitating flame
          const flameBob = Math.sin(Date.now() * 0.006 + obs.x) * 4;
          ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y - 26 + flameBob, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y - 26 + flameBob, 4, 0, Math.PI * 2);
          ctx.fill();

        } else if (obs.type === 'tree') {
          // Forest Tree trunk shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y + 10, obs.radius * 1.3, obs.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Trunk
          ctx.fillStyle = '#2d1f18';
          ctx.fillRect(obs.x - 7, obs.y - 15, 14, 25);

          // Foliage layers
          ctx.fillStyle = '#0f2015';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y - 28, 26, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#162e1e';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y - 38, 20, 0, Math.PI * 2);
          ctx.fill();

        } else if (obs.type === 'tombstone') {
          // Forest Tombstone
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y + 6, 16, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#475569';
          ctx.fillRect(obs.x - 8, obs.y - 18, 16, 22);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(obs.x - 6, obs.y - 16, 4, 18);

        } else if (obs.type === 'brazier') {
          // Forest Brazier
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y + 6, 14, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          if (this.lanternImg.complete && this.lanternImg.naturalWidth) {
            const w = 32;
            const h = 42;
            ctx.drawImage(this.lanternImg, Math.round(obs.x - w / 2), Math.round(obs.y - h + 6), w, h);
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
            ctx.fill();

            const flameOffset = Math.sin(Date.now() * 0.01 + obs.x) * 3;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(obs.x + flameOffset, obs.y - 8, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(obs.x + flameOffset, obs.y - 9, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  renderLandmarks(ctx, camera) {
    const isLimbo = this.mapId === 'limbo';

    // 1. Multiple Dungeon / Crypt Entrances
    for (const crypt of (this.dungeonEntrances || [this.cryptEntrance])) {
      if (!camera.isInView(crypt.x, crypt.y, 80)) continue;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(crypt.x, crypt.y + 10, 48, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isLimbo) {
        // Swirling Cosmic Vortex
        const spin = Date.now() * 0.003;
        ctx.fillStyle = '#1e0c38';
        ctx.beginPath();
        ctx.arc(crypt.x, crypt.y, 34, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(crypt.x, crypt.y, 26, spin, spin + Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(crypt.x, crypt.y, 16, -spin, -spin + Math.PI * 1.3);
        ctx.stroke();

        ctx.fillStyle = '#06020c';
        ctx.beginPath();
        ctx.arc(crypt.x, crypt.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c084fc';
        ctx.font = '10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🌌 ${crypt.name.toUpperCase()} 🌌`, crypt.x, crypt.y - 44);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('[ CRUZAR UMBRAL ]', crypt.x, crypt.y + 36);

      } else {
        // Gothic stone archway
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(crypt.x, crypt.y - 10, 36, Math.PI, 0);
        ctx.lineTo(crypt.x + 36, crypt.y + 16);
        ctx.lineTo(crypt.x - 36, crypt.y + 16);
        ctx.closePath();
        ctx.fill();

        // Portal void with purple mist
        ctx.fillStyle = '#090514';
        ctx.beginPath();
        ctx.arc(crypt.x, crypt.y - 6, 26, Math.PI, 0);
        ctx.lineTo(crypt.x + 26, crypt.y + 16);
        ctx.lineTo(crypt.x - 26, crypt.y + 16);
        ctx.closePath();
        ctx.fill();

        // Glowing runes & Title
        ctx.fillStyle = '#a855f7';
        ctx.font = '10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ ${crypt.name.toUpperCase()} ⚡`, crypt.x, crypt.y - 44);
        ctx.fillStyle = '#c084fc';
        ctx.fillText('[ ENTRAR ]', crypt.x, crypt.y + 30);
      }
    }

    // 2. Rare Surface Treasure Chests
    for (const chest of (this.surfaceChests || [])) {
      if (!camera.isInView(chest.x, chest.y, 50)) continue;

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(chest.x, chest.y + 8, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chest Body (Wood & Golden Trim)
      ctx.fillStyle = chest.opened ? '#475569' : '#854d0e';
      ctx.fillRect(chest.x - 14, chest.y - 10, 28, 18);
      ctx.fillStyle = chest.opened ? '#334155' : '#a16207';
      ctx.fillRect(chest.x - 12, chest.y - 8, 24, 14);

      // Gold Corners & Iron Lock
      ctx.fillStyle = chest.opened ? '#64748b' : '#e6b849';
      ctx.fillRect(chest.x - 14, chest.y - 10, 3, 18);
      ctx.fillRect(chest.x + 11, chest.y - 10, 3, 18);
      ctx.fillRect(chest.x - 14, chest.y - 2, 28, 3);

      if (!chest.opened) {
        // Glowing Golden Keyhole
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(chest.x - 3, chest.y - 4, 6, 6);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(chest.x - 1, chest.y - 3, 2, 4);

        // Pulsing Floating Prompt
        const pulse = 0.7 + Math.sin(Date.now() * 0.005 + chest.x) * 0.3;
        ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
        ctx.font = '9px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ COFRE ANCESTRAL ✨', chest.x, chest.y - 16);
      }
    }

    // Regional Altar (Boss Awakening)
    const altar = this.altar;
    if (camera.isInView(altar.x, altar.y, 90)) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(altar.x, altar.y + 10, 52, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Altar slab
      ctx.fillStyle = this.theme?.wall || (isLimbo ? '#140c24' : '#1e1b2e');
      ctx.fillRect(altar.x - 35, altar.y - 20, 70, 36);
      ctx.strokeStyle = this.theme?.accent || (isLimbo ? '#a855f7' : '#e6b849');
      ctx.lineWidth = 2;
      ctx.strokeRect(altar.x - 35, altar.y - 20, 70, 36);

      // Skull or Core on altar
      ctx.fillStyle = isLimbo ? '#c084fc' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(altar.x, altar.y - 12, 10, 0, Math.PI * 2);
      ctx.fill();

      // Altar prompt
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'center';
      if (this.theme) {
        const atmosphere = this.map.atmosphere;
        ctx.fillStyle = this.theme.accent;
        ctx.fillText(altar.activated ? atmosphere.altarBossActive : atmosphere.altarTitle, altar.x, altar.y - 36);
        if (!altar.activated) ctx.fillText(atmosphere.altarPrompt, altar.x, altar.y + 32);
      } else if (isLimbo) {
        ctx.fillStyle = altar.activated ? '#ef4444' : '#c084fc';
        ctx.fillText(altar.activated ? '☠️ EL ARCONTE HA DESPERTADO ☠️' : '🔥 TRONO DEL ARCONTE DE LAS ÁNIMAS 🔥', altar.x, altar.y - 36);
        if (!altar.activated) {
          ctx.fillStyle = '#e9d5ff';
          ctx.fillText('[ ACÉRCATE PARA DESPERTAR ]', altar.x, altar.y + 32);
        }
      } else {
        ctx.fillStyle = altar.activated ? '#ef4444' : '#e6b849';
        ctx.fillText(altar.activated ? '☠️ EL REY HA DESPERTADO ☠️' : '🔥 ALTAR DEL REY CONDENADO 🔥', altar.x, altar.y - 36);
        if (!altar.activated) {
          ctx.fillStyle = '#fef08a';
          ctx.fillText('[ ACÉRCATE PARA DESPERTAR ]', altar.x, altar.y + 32);
        }
      }
    }
  }
}

