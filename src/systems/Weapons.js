// ============================================================================
// DANTE QUEST — Weapons, Auto-Attacks & Synergy Evolutions
// ============================================================================

export class WeaponSystem {
  constructor() {
    this.orbitAngle = 0;
  }

  update(dt, players, enemies, boss, projectiles, particles, sound, camera) {
    this.orbitAngle += dt * 4.0; // Orbit speed for blades

    for (const player of players) {
      if (!player.isAlive || player.isDowned) continue;

      for (const w of player.weapons) {
        w.timer -= dt;

        if (w.id === 'espadon') {
          // Cooldown: 1.2s - reduced with levels or Furia buff
          let cooldown = Math.max(0.4, 1.2 - (w.level - 1) * 0.12);
          if (player.skillActiveDuration > 0 && player.charData.id === 'dante') {
            cooldown *= 0.55; // 50% faster attack during Furia!
          }

          if (w.timer <= 0) {
            this.fireEspadon(player, w.level, enemies, boss, particles, sound, camera);
            w.timer = cooldown;
          }
        } else if (w.id === 'cuchillas') {
          // Orbiting blades collision check
          this.updateCuchillas(player, w.level, enemies, boss, particles, sound);
        } else if (w.id === 'bola_fuego') {
          const cooldown = Math.max(0.8, 2.2 - (w.level - 1) * 0.2);
          if (w.timer <= 0) {
            this.fireBolaFuego(player, w.level, enemies, boss, projectiles, sound);
            w.timer = cooldown;
          }
        } else if (w.id === 'rayos') {
          const cooldown = Math.max(0.9, 2.0 - (w.level - 1) * 0.18);
          if (w.timer <= 0) {
            this.fireRayos(player, w.level, enemies, boss, particles, sound);
            w.timer = cooldown;
          }
        } else if (w.id === 'arco_largo') {
          const cooldown = Math.max(0.35, 1.0 - (w.level - 1) * 0.12);
          if (w.timer <= 0) {
            this.fireArco(player, w.level, enemies, boss, projectiles, sound);
            w.timer = cooldown;
          }
        }
      }
    }
  }

  // --- 1. Espadón de dos manos (Dante's signature Greatsword) ---
  fireEspadon(player, level, enemies, boss, particles, sound, camera) {
    // Find closest enemy or boss within range
    const range = 85 + level * 8;
    let targetX = player.x + player.facing * 50;
    let targetY = player.y;
    let closestDist = Infinity;

    if (boss && boss.isAlive) {
      const d = Math.hypot(boss.x - player.x, boss.y - player.y);
      if (d < range + boss.radius) {
        targetX = boss.x;
        targetY = boss.y;
        closestDist = d;
      }
    }

    if (closestDist === Infinity) {
      for (const e of enemies) {
        if (!e.isAlive) continue;
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < range + e.radius && d < closestDist) {
          closestDist = d;
          targetX = e.x;
          targetY = e.y;
        }
      }
    }

    const slashAngle = Math.atan2(targetY - player.y, targetX - player.x);
    player.facing = Math.cos(slashAngle) >= 0 ? 1 : -1;
    player.attackAnimTimer = 0.2;

    // Visual Slash Arc & Sound
    sound.playSlash();
    particles.addSlash(player.x, player.y, slashAngle, range, '#e2e8f0', level >= 4);

    // Calculate Base Damage
    let baseDmg = Math.round((player.stats.attack + level * 8) * (player.skillActiveDuration > 0 ? 1.5 : 1.0));
    const isCrit = Math.random() < player.stats.critChance;
    if (isCrit) baseDmg = Math.round(baseDmg * 2.0);

    // Hit Boss if in range
    if (boss && boss.isAlive) {
      const dist = Math.hypot(boss.x - player.x, boss.y - player.y);
      const angle = Math.atan2(boss.y - player.y, boss.x - player.x);
      const diff = Math.abs(angle - slashAngle);
      if (dist < range + boss.radius && (diff < Math.PI / 2.2 || diff > Math.PI * 1.54)) {
        boss.takeDamage(baseDmg, particles, slashAngle);
        particles.addFloatingText(boss.x, boss.y, `${baseDmg}!`, '#e6b849', 18, true);
        sound.playHit();
        camera.shake(6, 0.15);
      }
    }

    // Hit Enemies in Arc
    let hitCount = 0;
    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist < range + enemy.radius) {
        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        const diff = Math.abs(angle - slashAngle);
        if (diff < Math.PI / 2.2 || diff > Math.PI * 1.54) {
          enemy.takeDamage(baseDmg, particles, slashAngle);
          particles.addFloatingText(enemy.x, enemy.y, `${baseDmg}`, isCrit ? '#facc15' : '#ffffff', 14, isCrit);
          hitCount++;
        }
      }
    }

    if (hitCount > 0) {
      sound.playHit();
    }
  }

  // --- 2. Cuchillas Orbitantes ---
  updateCuchillas(player, level, enemies, boss, particles, sound) {
    const bladeCount = 2 + level; // 3 to 7 blades
    const orbitRadius = 60 + level * 5;
    const damage = Math.round(player.stats.attack * 0.45 + level * 3);

    for (let i = 0; i < bladeCount; i++) {
      const a = this.orbitAngle + (Math.PI * 2 / bladeCount) * i;
      const bx = player.x + Math.cos(a) * orbitRadius;
      const by = player.y + Math.sin(a) * orbitRadius;

      // Hit boss
      if (boss && boss.isAlive && Math.hypot(boss.x - bx, boss.y - by) < boss.radius + 12) {
        boss.takeDamage(damage, particles, a);
        particles.addFloatingText(boss.x, boss.y, `${damage}`, '#38bdf8', 12);
      }

      // Hit enemies
      for (const e of enemies) {
        if (!e.isAlive) continue;
        if (Math.hypot(e.x - bx, e.y - by) < e.radius + 12) {
          e.takeDamage(damage, particles, a);
          particles.addFloatingText(e.x, e.y, `${damage}`, '#93c5fd', 11);
        }
      }
    }
  }

  // --- 3. Bola de Fuego ---
  fireBolaFuego(player, level, enemies, boss, projectiles, sound) {
    // Find nearest enemy or boss
    let target = boss && boss.isAlive ? boss : null;
    let minDist = 300;

    for (const e of enemies) {
      if (!e.isAlive) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < minDist) {
        minDist = d;
        target = e;
      }
    }

    let dirX = player.facing;
    let dirY = 0;
    if (target) {
      const a = Math.atan2(target.y - player.y, target.x - player.x);
      dirX = Math.cos(a);
      dirY = Math.sin(a);
    }

    const damage = Math.round(player.stats.attack * 1.2 + level * 10);
    projectiles.spawn(player.x, player.y, dirX, dirY, 260, damage, 'fireball', 1, false);
  }

  // --- 4. Rayos Encadenados ---
  fireRayos(player, level, enemies, boss, particles, sound) {
    const maxTargets = 2 + level;
    let count = 0;
    const damage = Math.round(player.stats.attack * 0.9 + level * 6);

    const targets = [];
    if (boss && boss.isAlive && Math.hypot(boss.x - player.x, boss.y - player.y) < 220) {
      targets.push(boss);
    }

    for (const e of enemies) {
      if (!e.isAlive) continue;
      if (Math.hypot(e.x - player.x, e.y - player.y) < 220) {
        targets.push(e);
        if (targets.length >= maxTargets) break;
      }
    }

    for (const t of targets) {
      t.takeDamage(damage, particles);
      particles.addFloatingText(t.x, t.y, `⚡${damage}`, '#38bdf8', 14, true);
      particles.addSpark(t.x, t.y, '#38bdf8', 10);
    }

    if (targets.length > 0) {
      sound.playLightning();
    }
  }

  // --- 5. Arco Largo ---
  fireArco(player, level, enemies, boss, projectiles, sound) {
    const arrowCount = 1 + Math.floor(level / 2); // 1 to 3 arrows
    const damage = Math.round(player.stats.attack * 0.75 + level * 5);

    for (let i = 0; i < arrowCount; i++) {
      const spread = (i - (arrowCount - 1) / 2) * 0.15;
      const angle = (player.facing > 0 ? 0 : Math.PI) + spread;
      projectiles.spawn(player.x, player.y, Math.cos(angle), Math.sin(angle), 340, damage, 'arrow', 2, false);
    }
  }

  render(ctx, camera, players) {
    // Render Orbiting Blades
    for (const player of players) {
      if (!player.isAlive || player.isDowned) continue;

      const cuchillas = player.weapons.find(w => w.id === 'cuchillas');
      if (cuchillas) {
        const bladeCount = 2 + cuchillas.level;
        const orbitRadius = 60 + cuchillas.level * 5;

        for (let i = 0; i < bladeCount; i++) {
          const a = this.orbitAngle + (Math.PI * 2 / bladeCount) * i;
          const bx = player.x + Math.cos(a) * orbitRadius;
          const by = player.y + Math.sin(a) * orbitRadius;

          if (!camera.isInView(bx, by, 20)) continue;

          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(a + Math.PI / 2);

          // Shining steel blade
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(4, 0);
          ctx.lineTo(0, 12);
          ctx.lineTo(-4, 0);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        }
      }
    }
  }
}
