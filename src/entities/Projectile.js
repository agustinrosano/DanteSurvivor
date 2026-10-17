// ============================================================================
// DANTE QUEST — Projectiles System (Fireballs, Arrows, Dark Magic, Homing Missiles, Magic Bombs)
// ============================================================================

export class ProjectileSystem {
  constructor() {
    this.projectiles = [];

    // Spritesheets
    this.fireballSheet = new Image();
    this.fireballSheet.src = '/assets/sprites/vfx/fireball_sheet.png';

    this.missileSheet = new Image();
    this.missileSheet.src = '/assets/sprites/vfx/arcane_missile_sheet.png';

    this.bombSheet = new Image();
    this.bombSheet.src = '/assets/sprites/vfx/magic_bomb_sheet.png';
  }

  spawn(x, y, vx, vy, speed, damage, type = 'arrow', pierce = 1, isFromEnemy = false, extra = {}) {
    const isBomb = type === 'magic_bomb';
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
      radius: type === 'fireball' ? 14 : (isBomb ? 16 : (type === 'boss_orb' ? 12 : 8)),
      life: isBomb ? (extra.life || 0.75) : (type === 'magic_missile' ? 3.5 : 2.5),
      maxLife: isBomb ? (extra.life || 0.75) : (type === 'magic_missile' ? 3.5 : 2.5),
      angle: Math.atan2(vy, vx),
      animTime: 0,
      startX: x,
      startY: y,
      targetX: extra.targetX ?? null,
      targetY: extra.targetY ?? null,
      aoeRadius: extra.aoeRadius || (isBomb ? 75 : 60),
      homingTurnRate: extra.turnRate || 9.0
    });
  }

  update(dt, enemies, players, boss, particles, sound, camera) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.animTime += dt;

      // Handle Magic Bomb detonation timer / landing
      if (p.type === 'magic_bomb') {
        if (p.life <= 0) {
          // Detonate!
          particles.addMagicExplosion(p.x, p.y, p.aoeRadius);
          sound.playExplosion();
          camera.shake(5, 0.2);

          // AOE damage to enemies
          for (const enemy of enemies) {
            if (!enemy.isAlive) continue;
            const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
            if (d < p.aoeRadius + enemy.radius) {
              const dmg = enemy.takeDamage(p.damage, particles, Math.atan2(enemy.y - p.y, enemy.x - p.x));
              particles.addFloatingText(enemy.x, enemy.y, `${dmg}!`, '#c084fc', 15, true);
            }
          }

          // AOE damage to boss
          if (boss && boss.isAlive) {
            const d = Math.hypot(boss.x - p.x, boss.y - p.y);
            if (d < p.aoeRadius + boss.radius) {
              const dmg = boss.takeDamage(p.damage, particles);
              particles.addFloatingText(boss.x, boss.y, `${dmg}!`, '#e879f9', 18, true);
            }
          }

          this.projectiles.splice(i, 1);
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        continue;
      }

      // Handle Magic Missile Homing steering
      if (p.type === 'magic_missile') {
        // Find closest target
        let target = null;
        let minDist = 400;

        if (boss && boss.isAlive) {
          const d = Math.hypot(boss.x - p.x, boss.y - p.y);
          if (d < minDist) {
            minDist = d;
            target = boss;
          }
        }

        for (const e of enemies) {
          if (!e.isAlive) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < minDist) {
            minDist = d;
            target = e;
          }
        }

        if (target) {
          const desiredAngle = Math.atan2(target.y - p.y, target.x - p.x);
          let diff = desiredAngle - p.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          p.angle += diff * Math.min(1.0, p.homingTurnRate * dt);
          p.vx = Math.cos(p.angle) * p.speed;
          p.vy = Math.sin(p.angle) * p.speed;
        }
      }

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
          } else if (p.type === 'magic_missile') {
            particles.addSpark(p.x, p.y, '#38bdf8', 12);
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
          const color = p.type === 'magic_missile' ? '#38bdf8' : (p.type === 'fireball' ? '#f97316' : '#f8fafc');
          particles.addFloatingText(enemy.x, enemy.y, `${actualDmg}`, color, 13);
          sound.playHit();

          if (p.type === 'fireball') {
            sound.playExplosion();
            particles.addSpark(p.x, p.y, '#f59e0b', 14);
            // AOE blast
            for (const other of enemies) {
              if (other !== enemy && other.isAlive && Math.hypot(other.x - p.x, other.y - p.y) < p.aoeRadius) {
                other.takeDamage(Math.round(p.damage * 0.7), particles, p.angle);
              }
            }
          } else if (p.type === 'magic_missile') {
            particles.addSpark(p.x, p.y, '#38bdf8', 8);
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
      if (!camera.isInView(p.x, p.y, 40)) continue;

      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'fireball') {
        ctx.rotate(p.angle);
        if (this.fireballSheet.complete && this.fireballSheet.naturalWidth) {
          const frame = Math.floor(p.animTime * 12) % 6;
          ctx.drawImage(this.fireballSheet, frame * 32, 0, 32, 32, -18, -16, 36, 32);
        } else {
          // Flame fallback
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'magic_missile') {
        ctx.rotate(p.angle);
        if (this.missileSheet.complete && this.missileSheet.naturalWidth) {
          const frame = Math.floor(p.animTime * 14) % 6;
          ctx.drawImage(this.missileSheet, frame * 32, 0, 32, 32, -18, -16, 36, 32);
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'magic_bomb') {
        // Parabolic height arc effect
        const progress = 1 - (p.life / p.maxLife);
        const arcY = -Math.sin(progress * Math.PI) * 26;

        // Shadow under bomb
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 * (1 - progress * 0.3), 5 * (1 - progress * 0.3), 0, 0, Math.PI * 2);
        ctx.fill();

        // Bomb orb
        ctx.translate(0, arcY);
        if (this.bombSheet.complete && this.bombSheet.naturalWidth) {
          const frame = Math.floor(p.animTime * 8) % 2; // Frames 0 and 1
          ctx.drawImage(this.bombSheet, frame * 32, 0, 32, 32, -16, -16, 32, 32);
        } else {
          ctx.fillStyle = '#9333ea';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'boss_orb') {
        ctx.rotate(p.angle);
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
        ctx.rotate(p.angle);
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
