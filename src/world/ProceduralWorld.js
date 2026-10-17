// ============================================================================
// DANTE QUEST — Procedural Infinite World (Chunk Generation & Biomes)
// ============================================================================

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
  constructor(seed = 1337) {
    this.seed = seed;
    this.tileSize = 48; // px
    this.chunkSize = 16; // 16x16 tiles per chunk
    this.chunkPx = this.tileSize * this.chunkSize; // 768px

    this.loadedChunks = new Map(); // key "cx,cy" -> chunk data
    this.torches = []; // Animated world lights: { x, y, lightRadius: 180 }
    this.cryptEntrance = { x: 300, y: -250, radius: 40, active: true }; // Portal to Diablo dungeon
    this.altar = { x: -400, y: 400, radius: 50, activated: false }; // Regional Altar to summon Boss!
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
        // Remove torches of this chunk
        this.torches = this.torches.filter(t => t.chunkKey !== key);
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
    let biome = 'bosque'; // default
    if (macroVal > 0.65) biome = 'tierras_malditas';
    else if (macroVal < 0.25) biome = 'sombras';

    for (let ty = 0; ty < this.chunkSize; ty++) {
      for (let tx = 0; tx < this.chunkSize; tx++) {
        const worldTileX = cx * this.chunkSize + tx;
        const worldTileY = cy * this.chunkSize + ty;
        const noise = smoothNoise(worldTileX * 0.08, worldTileY * 0.08, this.seed);

        let tileType = 'grass';
        if (biome === 'tierras_malditas') {
          tileType = noise > 0.4 ? 'dirt' : 'corrupted';
        } else if (biome === 'sombras') {
          tileType = noise > 0.4 ? 'obsidian' : 'void';
        } else {
          // Bosque
          tileType = noise > 0.5 ? 'deep_grass' : (noise > 0.25 ? 'grass' : 'path');
        }

        tiles.push({ x: tx, y: ty, type: tileType });

        // World coordinates
        const wx = (cx * this.chunkSize + tx) * this.tileSize + this.tileSize / 2;
        const wy = (cy * this.chunkSize + ty) * this.tileSize + this.tileSize / 2;

        // Skip obstacles near spawn, crypt entrance or altar
        const distSpawn = Math.hypot(wx, wy);
        const distCrypt = Math.hypot(wx - this.cryptEntrance.x, wy - this.cryptEntrance.y);
        const distAltar = Math.hypot(wx - this.altar.x, wy - this.altar.y);

        if (distSpawn > 120 && distCrypt > 100 && distAltar > 100) {
          const rand = rng();
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

        if (tile.type === 'deep_grass') {
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
      }
    }

    // 2. Render Special Landmarks (Crypt Entrance & Altar)
    this.renderLandmarks(ctx, camera);

    // 3. Render Obstacles (Trees, Tombstones, Braziers)
    for (const chunk of this.loadedChunks.values()) {
      for (const obs of chunk.obstacles) {
        if (!camera.isInView(obs.x, obs.y, 60)) continue;

        if (obs.type === 'tree') {
          // Tree trunk shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y + 10, obs.radius * 1.3, obs.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Trunk
          ctx.fillStyle = '#2d1f18';
          ctx.fillRect(obs.x - 7, obs.y - 15, 14, 25);

          // Foliage layers (dark gothic fantasy pine/dead oak)
          ctx.fillStyle = '#0f2015';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y - 28, 26, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#162e1e';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y - 38, 20, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'tombstone') {
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y + 6, 16, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Stone cross/slab
          ctx.fillStyle = '#475569';
          ctx.fillRect(obs.x - 8, obs.y - 18, 16, 22);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(obs.x - 6, obs.y - 16, 4, 18);
        } else if (obs.type === 'brazier') {
          // Metal tripod
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
          ctx.fill();

          // Dancing flame
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

  renderLandmarks(ctx, camera) {
    // Crypt Entrance (Diablo 1 Inspired Portal)
    const crypt = this.cryptEntrance;
    if (camera.isInView(crypt.x, crypt.y, 80)) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(crypt.x, crypt.y + 10, 48, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stone archway
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

      // Glowing runes
      ctx.fillStyle = '#a855f7';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ CRIPTA MALDITA ⚡', crypt.x, crypt.y - 44);
      ctx.fillStyle = '#c084fc';
      ctx.fillText('[ ENTRAR ]', crypt.x, crypt.y + 30);
    }

    // Regional Altar (Summons Boss)
    const altar = this.altar;
    if (camera.isInView(altar.x, altar.y, 90)) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(altar.x, altar.y + 10, 52, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Altar slab
      ctx.fillStyle = '#1e1b2e';
      ctx.fillRect(altar.x - 35, altar.y - 20, 70, 36);
      ctx.strokeStyle = '#e6b849';
      ctx.lineWidth = 2;
      ctx.strokeRect(altar.x - 35, altar.y - 20, 70, 36);

      // Skull on altar
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(altar.x, altar.y - 12, 10, 0, Math.PI * 2);
      ctx.fill();

      // Altar prompt
      ctx.fillStyle = altar.activated ? '#ef4444' : '#e6b849';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(altar.activated ? '☠️ EL REY HA DESPERTADO ☠️' : '🔥 ALTAR DEL REY CONDENADO 🔥', altar.x, altar.y - 36);
      if (!altar.activated) {
        ctx.fillStyle = '#fef08a';
        ctx.fillText('[ ACÉRCATE PARA DESPERTAR ]', altar.x, altar.y + 32);
      }
    }
  }
}
