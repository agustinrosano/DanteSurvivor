// ============================================================================
// DANTE QUEST — Projectiles System (Fireballs, Arrows, Dark Magic)
// ============================================================================

export class ProjectileSystem {
  constructor() {
    this.projectiles = [];
  }

  spawn(x, y, vx, vy, speed, damage, type = 'arrow', pierce = 1, isFromEnemy = false) {
    this.projectiles.push({
      x: x,
      y: y,
      vx: vx * speed,
      vy: vy * speed,
      speed: speed,
      damage: damage,
      type: type,
      pierce: pierce,
      isFromEnemy: isFromEnemy,
      radius: type === 'fireball' || type === 'boss_orb' ? 12 : 6,
      life: 2.5,
      angle: Math.atan2(vy, vx)
    });
  }

  update(dt, enemies, players, boss, particles, sound, camera) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // 1. Enemy/Boss Projectiles hitting Players
      if (p.isFromEnemy) {
        for (const player of players) {
          if (!player.isAlive || player.isDowned) continue;
          const d = Math.hypot(player.x - p.x, player.y - p.y);
          if (d < p.radius + player.radius) {
            player.takeDamage(p.damage);
            particles.addSpark(p.x, p.y, '#ef4444', 8);
            this.projectiles.splice(i, 1);
            break;
          }
        }
        continue;
      }

      // 2. Player Projectiles hitting Boss
      if (boss && boss.isAlive) {
        const d = Math.hypot(boss.x - p.x, boss.y - p.y);
        if (d < p.radius + boss.radius) {
          const actualDmg = boss.takeDamage(p.damage, particles, p.angle);
          particles.addFloatingText(boss.x, boss.y, `${actualDmg}`, '#e6b849', 16, true);
          sound.playHit();

          if (p.type === 'fireball') {
            sound.playExplosion();
            particles.addSpark(p.x, p.y, '#f59e0b', 16);
          }

          p.pierce--;
          if (p.pierce <= 0) {
            this.projectiles.splice(i, 1);
            continue;
          }
        }
      }

      // 3. Player Projectiles hitting Horde Enemies
      for (let eIdx = 0; eIdx < enemies.length; eIdx++) {
        const enemy = enemies[eIdx];
        if (!enemy.isAlive) continue;

        const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (d < p.radius + enemy.radius) {
          const actualDmg = enemy.takeDamage(p.damage, particles, p.angle);
          particles.addFloatingText(enemy.x, enemy.y, `${actualDmg}`, '#f8fafc', 13);
          sound.playHit();

          if (p.type === 'fireball') {
            sound.playExplosion();
            particles.addSpark(p.x, p.y, '#f59e0b', 14);
            // AOE blast
            for (const other of enemies) {
              if (other !== enemy && other.isAlive && Math.hypot(other.x - p.x, other.y - p.y) < 65) {
                other.takeDamage(Math.round(p.damage * 0.7), particles, p.angle);
              }
            }
          }

          p.pierce--;
          if (p.pierce <= 0) {
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  render(ctx, camera) {
    for (const p of this.projectiles) {
      if (!camera.isInView(p.x, p.y, 30)) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      if (p.type === 'fireball') {
        // Outer glowing flame aura
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Fiery Core
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(3, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Flame tail points
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'boss_orb') {
        // Dark Necrotic Skull Orb
        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(2, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Arrow
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(4, -4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
