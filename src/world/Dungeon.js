// ============================================================================
// DANTE QUEST — Diablo 1 Inspired Procedural Dungeon (Catacombs & Crypts)
// ============================================================================

export class ProceduralDungeon {
  constructor(seed = 42, mapId = 'bosque') {
    this.seed = seed;
    this.mapId = mapId;
    this.width = 40; // in tiles
    this.height = 40;
    this.tileSize = 48; // px

    this.grid = []; // 0: Wall, 1: Floor
    this.rooms = [];
    this.chests = [];
    this.torches = [];
    this.exitPortal = { x: 0, y: 0, radius: 36 };
    this.spawnPoint = { x: 0, y: 0 };

    this.floorTexture = new Image();
    this.floorTexture.src = '/assets/ancient-dark-mossy-cracked-cobblestone-s-cmvbmvpa.jpg';
    this.textureLoaded = false;
    this.floorTexture.onload = () => {
      this.textureLoaded = true;
    };

    this.generate();
  }

  generate() {
    // 1. Initialize with solid walls (0)
    this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(0));
    this.rooms = [];
    this.chests = [];
    this.torches = [];

    const numRooms = 7 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numRooms; i++) {
      const rw = 5 + Math.floor(Math.random() * 4);
      const rh = 5 + Math.floor(Math.random() * 4);
      const rx = 2 + Math.floor(Math.random() * (this.width - rw - 4));
      const ry = 2 + Math.floor(Math.random() * (this.height - rh - 4));

      // Carve room
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          this.grid[y][x] = 1;
        }
      }

      this.rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: rx + Math.floor(rw / 2), cy: ry + Math.floor(rh / 2) });
    }

    // 2. Connect rooms with corridors
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const rA = this.rooms[i];
      const rB = this.rooms[i + 1];

      // Horizontal then vertical
      let curX = rA.cx;
      let curY = rA.cy;

      while (curX !== rB.cx) {
        this.grid[curY][curX] = 1;
        curX += (rB.cx > curX) ? 1 : -1;
      }
      while (curY !== rB.cy) {
        this.grid[curY][curX] = 1;
        curY += (rB.cy > curY) ? 1 : -1;
      }
    }

    // 3. Set Player spawn at Room 0, Exit portal at Last Room
    const firstRoom = this.rooms[0];
    const lastRoom = this.rooms[this.rooms.length - 1];

    this.spawnPoint = {
      x: firstRoom.cx * this.tileSize + this.tileSize / 2,
      y: firstRoom.cy * this.tileSize + this.tileSize / 2
    };

    this.exitPortal = {
      x: lastRoom.cx * this.tileSize + this.tileSize / 2,
      y: lastRoom.cy * this.tileSize + this.tileSize / 2,
      radius: 36
    };

    // 4. Place chests and braziers in rooms
    for (let i = 1; i < this.rooms.length; i++) {
      const r = this.rooms[i];
      // Treasure chest
      this.chests.push({
        x: r.cx * this.tileSize + this.tileSize / 2,
        y: r.cy * this.tileSize + this.tileSize / 2,
        opened: false,
        radius: 20
      });

      // Wall torch
      this.torches.push({
        x: (r.x + 1) * this.tileSize,
        y: (r.y + 1) * this.tileSize,
        lightRadius: 190
      });
    }
  }

  checkCollision(x, y, radius) {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);

    // Out of bounds check
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return { colliding: true, pushX: 0, pushY: 0 };
    }

    // Check surrounding 3x3 tiles
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = tileX + dx;
        const ty = tileY + dy;

        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height || this.grid[ty][tx] === 0) {
          // Solid wall tile AABB
          const left = tx * this.tileSize;
          const right = left + this.tileSize;
          const top = ty * this.tileSize;
          const bottom = top + this.tileSize;

          // Closest point on AABB to circle
          const closestX = Math.max(left, Math.min(x, right));
          const closestY = Math.max(top, Math.min(y, bottom));

          const distX = x - closestX;
          const distY = y - closestY;
          const distSq = distX * distX + distY * distY;

          if (distSq < radius * radius && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const overlap = radius - dist;
            return {
              colliding: true,
              pushX: (distX / dist) * overlap,
              pushY: (distY / dist) * overlap
            };
          }
        }
      }
    }

    return { colliding: false, pushX: 0, pushY: 0 };
  }

  render(ctx, camera) {
    // 1. Render floor and walls
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const wx = x * this.tileSize;
        const wy = y * this.tileSize;

        if (!camera.isInView(wx + this.tileSize / 2, wy + this.tileSize / 2, this.tileSize)) continue;

        if (this.grid[y][x] === 1) {
          // Crypt stone floor with tiled generated cobblestone texture
          if (this.textureLoaded) {
            ctx.drawImage(this.floorTexture, wx, wy, this.tileSize, this.tileSize);
            ctx.fillStyle = this.mapId === 'limbo' ? 'rgba(28, 12, 45, 0.55)' : 'rgba(10, 8, 16, 0.45)';
            ctx.fillRect(wx, wy, this.tileSize, this.tileSize);
          } else {
            ctx.fillStyle = this.mapId === 'limbo' ? '#1c1228' : '#181520';
            ctx.fillRect(wx, wy, this.tileSize, this.tileSize);
            ctx.fillStyle = this.mapId === 'limbo' ? '#2d1e3d' : '#221e2d';
            ctx.fillRect(wx + 2, wy + 2, this.tileSize - 4, this.tileSize - 4);
          }
        } else {
          // Gothic stone brick wall
          ctx.fillStyle = this.mapId === 'limbo' ? '#120a1c' : '#0a0810';
          ctx.fillRect(wx, wy, this.tileSize, this.tileSize);
          ctx.fillStyle = this.mapId === 'limbo' ? '#1e142b' : '#14121e';
          ctx.fillRect(wx + 2, wy + 2, this.tileSize - 4, this.tileSize / 2 - 2);
          ctx.fillRect(wx + 2, wy + this.tileSize / 2 + 1, this.tileSize - 4, this.tileSize / 2 - 2);
        }
      }
    }

    // 2. Render Exit Portal
    const portal = this.exitPortal;
    if (camera.isInView(portal.x, portal.y, 80)) {
      const isLimbo = this.mapId === 'limbo';
      ctx.fillStyle = isLimbo ? '#c084fc' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isLimbo ? '#581c87' : '#0369a1';
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(isLimbo ? '🌌 REGRESAR AL LIMBO 🌌' : '⚡ VOLVER A SUPERFICIE ⚡', portal.x, portal.y - 36);
    }

    // 3. Render Treasure Chests
    for (const chest of this.chests) {
      if (!camera.isInView(chest.x, chest.y, 40)) continue;

      ctx.fillStyle = chest.opened ? '#475569' : '#e6b849';
      ctx.fillRect(chest.x - 14, chest.y - 10, 28, 20);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(chest.x - 12, chest.y - 8, 24, 16);

      if (!chest.opened) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(chest.x - 4, chest.y - 2, 8, 8);
        ctx.fillStyle = '#fef08a';
        ctx.font = '9px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('COFRE', chest.x, chest.y - 14);
      }
    }
  }
}
