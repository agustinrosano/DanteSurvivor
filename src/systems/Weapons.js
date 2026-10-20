// ============================================================================
// DANTE QUEST — Weapons, Auto-Attacks & Synergy Evolutions
// ============================================================================

export class WeaponSystem {
  constructor() {
    this.orbitAngle = 0;
    this.daggerImg = new Image();
    this.daggerImg.src = '/assets/sprites/weapons/dagger.png';
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
        } else if (w.id === 'bomba_magica') {
          const cooldown = Math.max(1.0, 2.5 - (w.level - 1) * 0.22);
          if (w.timer <= 0) {
            this.fireBombasMagicas(player, w.level, enemies, boss, projectiles, sound);
            w.timer = cooldown;
          }
        } else if (w.id === 'magia_misil') {
          const cooldown = Math.max(0.65, 1.8 - (w.level - 1) * 0.18);
          if (w.timer <= 0) {
            this.fireMisilesMagicos(player, w.level, enemies, boss, projectiles, sound);
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
    player.triggerAttackAnim(0.24);

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

  // --- 3. Bola de Fuego (Lanza ráfagas de fuego animadas con spritesheet) ---
  fireBolaFuego(player, level, enemies, boss, projectiles, sound) {
    let target = boss && boss.isAlive ? boss : null;
    let minDist = 320;

    for (const e of enemies) {
      if (!e.isAlive) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < minDist) {
        minDist = d;
        target = e;
      }
    }

    let baseAngle = player.facing > 0 ? 0 : Math.PI;
    if (target) {
      baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
      player.facing = target.x >= player.x ? 1 : -1;
    }
    player.triggerAttackAnim(0.28);

    // Cantidad de bolas de fuego aumenta con nivel (1 a 4)
    const fireballCount = 1 + Math.floor(level / 2);
    const damage = Math.round(player.stats.attack * 1.1 + level * 9);

    for (let i = 0; i < fireballCount; i++) {
      const spread = (i - (fireballCount - 1) / 2) * 0.22;
      const angle = baseAngle + spread;
      projectiles.spawn(
        player.x, player.y,
        Math.cos(angle), Math.sin(angle),
        270, damage,
        'fireball', 1, false,
        { aoeRadius: 65 + level * 6 }
      );
    }
  }

  // --- 4. Rayos Encadenados (Animación real spritesheet de relámpagos que caen del cielo) ---
  fireRayos(player, level, enemies, boss, particles, sound) {
    // Cantidad de rayos aumenta drásticamente con el nivel (4 a 12 impactos)
    const maxTargets = 2 + level * 2;
    const damage = Math.round(player.stats.attack * 0.95 + level * 7);

    const targets = [];
    if (boss && boss.isAlive && Math.hypot(boss.x - player.x, boss.y - player.y) < 280) {
      targets.push(boss);
    }

    for (const e of enemies) {
      if (!e.isAlive) continue;
      if (Math.hypot(e.x - player.x, e.y - player.y) < 280) {
        targets.push(e);
        if (targets.length >= maxTargets) break;
      }
    }

    for (const t of targets) {
      t.takeDamage(damage, particles);
      // Animación fotograma a fotograma del spritesheet de rayo eléctrico
      particles.addLightningStrike(t.x, t.y);
      particles.addFloatingText(t.x, t.y, `⚡${damage}`, '#38bdf8', 15, true);
    }

    if (targets.length > 0) {
      player.triggerAttackAnim(0.28);
      sound.playLightning();
    }
  }

  // --- 5. Arco Largo (Disparos en abanico perforantes que aumentan con nivel) ---
  fireArco(player, level, enemies, boss, projectiles, sound) {
    const arrowCount = 1 + level; // 2 a 6 flechas perforantes
    const damage = Math.round(player.stats.attack * 0.75 + level * 5);
    player.triggerAttackAnim(0.24);

    for (let i = 0; i < arrowCount; i++) {
      const spread = (i - (arrowCount - 1) / 2) * 0.16;
      const angle = (player.facing > 0 ? 0 : Math.PI) + spread;
      projectiles.spawn(player.x, player.y, Math.cos(angle), Math.sin(angle), 350, damage, 'arrow', 2, false);
    }
  }

  // --- 6. Bombas de Magia (Orbes arcanos con trayectoria y spritesheet de onda expansiva) ---
  fireBombasMagicas(player, level, enemies, boss, projectiles, sound) {
    // Cantidad de bombas lanzadas aumenta con el nivel (1 a 4 bombas)
    const bombCount = 1 + Math.floor(level / 2);
    const damage = Math.round(player.stats.attack * 1.35 + level * 14);
    const range = 200 + level * 12;

    player.triggerAttackAnim(0.30);
    const nearbyTargets = enemies.filter(e => e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < range);
    if (boss && boss.isAlive && Math.hypot(boss.x - player.x, boss.y - player.y) < range) {
      nearbyTargets.unshift(boss);
    }

    for (let i = 0; i < bombCount; i++) {
      let targetX, targetY;
      if (nearbyTargets.length > 0) {
        const picked = nearbyTargets[i % nearbyTargets.length];
        targetX = picked.x + (Math.random() - 0.5) * 24;
        targetY = picked.y + (Math.random() - 0.5) * 24;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const d = 90 + Math.random() * 90;
        targetX = player.x + Math.cos(angle) * d;
        targetY = player.y + Math.sin(angle) * d;
      }

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.hypot(dx, dy);
      const throwSpeed = 230;
      const throwTime = Math.max(0.42, Math.min(0.85, dist / throwSpeed));

      projectiles.spawn(
        player.x, player.y,
        dx / Math.max(0.1, dist), dy / Math.max(0.1, dist),
        throwSpeed, damage,
        'magic_bomb', 1, false,
        { targetX, targetY, life: throwTime, aoeRadius: 75 + level * 8 }
      );
    }
  }

  // --- 7. Magia Teledirigida (Misiles arcanos celestiales que persiguen enemigos) ---
  fireMisilesMagicos(player, level, enemies, boss, projectiles, sound) {
    // Cantidad de proyectiles teledirigidos aumenta con el nivel (4 a 12 misiles)
    const missileCount = 2 + level * 2;
    const damage = Math.round(player.stats.attack * 0.7 + level * 5);
    player.triggerAttackAnim(0.28);

    for (let i = 0; i < missileCount; i++) {
      const angle = (Math.PI * 2 / missileCount) * i + (Math.random() - 0.5) * 0.25;
      projectiles.spawn(
        player.x, player.y,
        Math.cos(angle), Math.sin(angle),
        250 + Math.random() * 40,
        damage,
        'magic_missile', 1, false,
        { turnRate: 8.5 + level * 0.6 }
      );
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

          if (this.daggerImg.complete && this.daggerImg.naturalWidth) {
            // Draw pixel-art spinning dagger centered
            ctx.drawImage(this.daggerImg, -16, -16, 32, 32);
          } else {
            // Shining steel blade fallback
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
          }

          ctx.restore();
        }
      }
    }
  }
}
