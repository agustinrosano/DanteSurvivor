// ============================================================================
// DANTE QUEST — Loot & XP Drops System (Crystals, Potions, Magnetism)
// ============================================================================

export class DropSystem {
  constructor() {
    this.drops = [];
  }

  spawnXpGem(x, y, amount = 1) {
    let type = 'green';
    let color = '#22c55e';
    let size = 6;

    if (amount >= 50) {
      type = 'purple';
      color = '#a855f7';
      size = 11;
    } else if (amount >= 15) {
      type = 'red';
      color = '#ef4444';
      size = 9;
    } else if (amount >= 5) {
      type = 'blue';
      color = '#38bdf8';
      size = 7;
    }

    this.drops.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      type: 'xp',
      amount: amount,
      color: color,
      size: size,
      radius: size + 2,
      isAttracted: false,
      vx: 0,
      vy: 0,
      bobOffset: Math.random() * Math.PI * 2
    });
  }

  spawnHealthPotion(x, y) {
    this.drops.push({
      x: x,
      y: y,
      type: 'potion',
      amount: 35,
      color: '#f43f5e',
      size: 10,
      radius: 12,
      isAttracted: false,
      vx: 0,
      vy: 0,
      bobOffset: Math.random() * Math.PI * 2
    });
  }

  update(dt, players, onCollectXp, onCollectPotion) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];

      // Check distance to closest alive player
      let closestPlayer = null;
      let minDist = Infinity;

      for (const p of players) {
        if (!p.isAlive) continue;
        const d = Math.hypot(p.x - drop.x, p.y - drop.y);
        if (d < minDist) {
          minDist = d;
          closestPlayer = p;
        }
      }

      if (closestPlayer) {
        const pickupRadius = closestPlayer.stats.pickupRadius;

        if (minDist < pickupRadius || drop.isAttracted) {
          drop.isAttracted = true;
          const angle = Math.atan2(closestPlayer.y - drop.y, closestPlayer.x - drop.x);
          const pullSpeed = 480;

          drop.vx = Math.cos(angle) * pullSpeed;
          drop.vy = Math.sin(angle) * pullSpeed;
          drop.x += drop.vx * dt;
          drop.y += drop.vy * dt;

          // Collected!
          if (minDist < 18) {
            if (drop.type === 'xp') {
              onCollectXp(closestPlayer, drop.amount);
            } else if (drop.type === 'potion') {
              onCollectPotion(closestPlayer, drop.amount);
            }
            this.drops.splice(i, 1);
            continue;
          }
        }
      }
    }
  }

  render(ctx, camera) {
    const time = Date.now() * 0.005;

    for (const drop of this.drops) {
      if (!camera.isInView(drop.x, drop.y, 25)) continue;

      const bob = Math.sin(time + drop.bobOffset) * 3;
      const dy = drop.y + bob;

      // Drop glow shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(drop.x, drop.y + 6, drop.size * 0.9, drop.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (drop.type === 'xp') {
        // Glowing Rhombus Gem
        ctx.save();
        ctx.translate(drop.x, dy);

        ctx.fillStyle = drop.color;
        ctx.beginPath();
        ctx.moveTo(0, -drop.size);
        ctx.lineTo(drop.size * 0.7, 0);
        ctx.lineTo(0, drop.size);
        ctx.lineTo(-drop.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();

        // Inner bright facet
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -drop.size * 0.6);
        ctx.lineTo(drop.size * 0.3, 0);
        ctx.lineTo(0, drop.size * 0.3);
        ctx.lineTo(-drop.size * 0.3, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      } else if (drop.type === 'potion') {
        // Crimson flask
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(drop.x, dy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(drop.x - 2, dy - 10, 4, 4);
      }
    }
  }
}
