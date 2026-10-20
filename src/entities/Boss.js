// ============================================================================
// DANTE QUEST — Epic Boss: El Rey de los Condenados (Multi-Phase Boss AI)
// ============================================================================

import { drawSprite, directionFromVector } from '../core/Sprites.js';

export class Boss {
  constructor(x, y, playerCount = 1, name = 'El Rey de los Condenados') {
    this.name = name;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 38; // Colossal 3x size
    this.facing = 1;

    // HP scales with party size
    this.maxHp = 1800 * (1 + (playerCount - 1) * 0.7);
    this.hp = this.maxHp;
    this.phase = 1; // 1: 100-70%, 2: 70-35%, 3: 35-0%
    this.isAlive = true;
    this.damageFlashTimer = 0;

    // Attack Patterns & Cooldowns
    this.attackTimer = 2.0;
    this.currentAttack = null; // 'cleave', 'charge', 'stomp', 'nova'
    this.telegraphTimer = 0; // Red warning decal duration
    this.telegraphData = null; // Decal parameters

    this.chargeDirX = 0;
    this.chargeDirY = 0;
    this.chargeSpeed = 380;
    this.chargeDuration = 0;

    this.orbitingSwordsAngle = 0;
    this.animTimer = 0;
  }

  takeDamage(amount, particles, sourceAngle = null) {
    if (!this.isAlive) return 0;
    this.hp -= amount;
    this.damageFlashTimer = 0.12;

    particles.addBlood(this.x, this.y, sourceAngle, 12);

    // Phase transitions
    const pct = this.hp / this.maxHp;
    if (pct <= 0.35 && this.phase < 3) {
      this.phase = 3;
      particles.addFloatingText(this.x, this.y - 40, '¡FURIA DEL REY!', '#ef4444', 22, true);
    } else if (pct <= 0.70 && this.phase < 2) {
      this.phase = 2;
      particles.addFloatingText(this.x, this.y - 40, '¡FASE 2: INVOCACIÓN!', '#c084fc', 20, true);
    }

    if (this.hp <= 0) {
      this.isAlive = false;
    }

    return amount;
  }

  update(dt, players, particles, sound, camera, onSpawnMinions, onSpawnProjectile) {
    if (!this.isAlive) return;

    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;
    this.animTimer += dt * 6;
    this.orbitingSwordsAngle += dt * 3.5;

    // Target closest living player
    let target = null;
    let minDist = Infinity;
    for (const p of players) {
      if (!p.isAlive || p.isDowned) continue;
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < minDist) {
        minDist = d;
        target = p;
      }
    }

    if (!target) return;

    const angleToTarget = Math.atan2(target.y - this.y, target.x - this.x);

    // 1. Handling active telegraphing
    if (this.telegraphTimer > 0) {
      this.telegraphTimer -= dt;

      if (this.telegraphTimer <= 0) {
        // Execute telegraphed attack
        this.executeAttack(target, particles, sound, camera, onSpawnMinions, onSpawnProjectile);
      }
      return; // Stand still while telegraphing
    }

    // 2. Handling active charge dash
    if (this.chargeDuration > 0) {
      this.chargeDuration -= dt;
      this.x += this.chargeDirX * this.chargeSpeed * dt;
      this.y += this.chargeDirY * this.chargeSpeed * dt;

      // Damage player if charged through
      for (const p of players) {
        if (!p.isAlive || p.isDowned) continue;
        if (Math.hypot(p.x - this.x, p.y - this.y) < this.radius + p.radius) {
          p.takeDamage(35);
          camera.shake(12, 0.3);
        }
      }
      return;
    }

    // 3. Movement towards player
    const speed = this.phase === 3 ? 120 : (this.phase === 2 ? 95 : 75);
    this.x += Math.cos(angleToTarget) * speed * dt;
    this.y += Math.sin(angleToTarget) * speed * dt;
    this.facing = target.x > this.x ? 1 : -1;

    // Contact damage
    if (minDist < this.radius + target.radius) {
      target.takeDamage(18);
    }

    // 4. Attack Decision Timer
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.decideNextAttack(minDist, angleToTarget);
    }
  }

  decideNextAttack(dist, angleToTarget) {
    const attacks = ['cleave', 'stomp'];
    if (this.phase >= 2) {
      attacks.push('charge', 'summon');
    }
    if (this.phase >= 3) {
      attacks.push('nova', 'charge');
    }

    const chosen = attacks[Math.floor(Math.random() * attacks.length)];
    this.currentAttack = chosen;

    if (chosen === 'cleave') {
      this.telegraphTimer = 0.75;
      this.telegraphData = { type: 'arc', angle: angleToTarget, radius: 95 };
    } else if (chosen === 'charge') {
      this.telegraphTimer = 0.9;
      this.telegraphData = { type: 'line', angle: angleToTarget, length: 280 };
    } else if (chosen === 'stomp') {
      this.telegraphTimer = 0.8;
      this.telegraphData = { type: 'circle', radius: 110 };
    } else if (chosen === 'nova' || chosen === 'summon') {
      this.telegraphTimer = 0.6;
      this.telegraphData = { type: 'circle', radius: 60 };
    }

    this.attackTimer = this.phase === 3 ? 2.5 : 3.5;
  }

  executeAttack(target, particles, sound, camera, onSpawnMinions, onSpawnProjectile) {
    if (this.currentAttack === 'cleave') {
      sound.playSlash();
      camera.shake(8, 0.25);
      particles.addSlash(this.x, this.y, this.telegraphData.angle, 95, '#ef4444', true);

      // Check hit on player
      const d = Math.hypot(target.x - this.x, target.y - this.y);
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      const diff = Math.abs(angle - this.telegraphData.angle);
      if (d < 100 && (diff < Math.PI / 3 || diff > Math.PI * 1.66)) {
        target.takeDamage(40);
      }
    } else if (this.currentAttack === 'charge') {
      this.chargeDirX = Math.cos(this.telegraphData.angle);
      this.chargeDirY = Math.sin(this.telegraphData.angle);
      this.chargeDuration = 0.55;
      sound.playBossRoar();
      camera.shake(10, 0.35);
    } else if (this.currentAttack === 'stomp') {
      sound.playExplosion();
      camera.shake(14, 0.4);
      particles.addSpark(this.x, this.y, '#f59e0b', 20);

      const d = Math.hypot(target.x - this.x, target.y - this.y);
      if (d < 115) {
        target.takeDamage(30);
      }
    } else if (this.currentAttack === 'summon') {
      sound.playBossRoar();
      onSpawnMinions(this.x, this.y, 6);
      particles.addFloatingText(this.x, this.y - 30, '¡LEVANTÁOS!', '#c084fc', 18);
    } else if (this.currentAttack === 'nova') {
      sound.playExplosion();
      for (let i = 0; i < 12; i++) {
        const pAngle = (Math.PI * 2 / 12) * i;
        onSpawnProjectile(this.x, this.y, Math.cos(pAngle), Math.sin(pAngle), 180, 20, 'boss_orb');
      }
    }

    this.telegraphData = null;
  }

  render(ctx, camera) {
    if (!camera.isInView(this.x, this.y, 140)) return;

    // 1. Render Red Telegraph Warnings
    if (this.telegraphData) {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;

      if (this.telegraphData.type === 'circle') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.telegraphData.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (this.telegraphData.type === 'arc') {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, this.telegraphData.radius, this.telegraphData.angle - Math.PI / 3, this.telegraphData.angle + Math.PI / 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (this.telegraphData.type === 'line') {
        const lx = Math.cos(this.telegraphData.angle) * this.telegraphData.length;
        const ly = Math.sin(this.telegraphData.angle) * this.telegraphData.length;
        ctx.lineWidth = 40;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + lx, this.y + ly);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Orbiting Spectral Swords in Phase 2 & 3
    if (this.phase >= 2) {
      const swordCount = this.phase === 3 ? 5 : 3;
      for (let i = 0; i < swordCount; i++) {
        const a = this.orbitingSwordsAngle + (Math.PI * 2 / swordCount) * i;
        const sx = this.x + Math.cos(a) * 65;
        const sy = this.y + Math.sin(a) * 65;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-3, -16, 6, 32);
        ctx.fillStyle = '#f3e8ff';
        ctx.fillRect(-1, -14, 2, 28);
        ctx.restore();
      }
    }

    // 3. Boss Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 36, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Boss Sprite (Huge Dark Gothic King / Mounted Knight)
    const isFlashing = this.damageFlashTimer > 0;
    const dir = directionFromVector(this.vx, this.vy, this.facing > 0 ? 'east' : 'west');
    const drawn = drawSprite(ctx, 'boss/mounted_knight', this.x, this.y + 36, {
      dir,
      anim: (this.vx !== 0 || this.vy !== 0) ? 'walk' : 'idle',
      time: this.animTimer,
      tint: isFlashing ? '#ffffff' : null,
      scale: 1.15
    });

    if (drawn) return;

    const bob = Math.sin(this.animTimer) * 3;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    // Dark Spiked Plate Legs
    ctx.fillStyle = isFlashing ? '#ffffff' : '#0f172a';
    ctx.fillRect(-16, 12 + bob, 10, 24);
    ctx.fillRect(6, 12 + bob, 10, 24);

    // Torso with Spiked Pauldrons
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1e1b2e';
    ctx.fillRect(-22, -24 + bob, 44, 38);
    // Dark Crimson Crest & Gold Trim
    ctx.fillStyle = isFlashing ? '#ffffff' : (this.phase === 3 ? '#ef4444' : '#e6b849');
    ctx.fillRect(-12, -18 + bob, 24, 6);
    ctx.fillRect(-4, -12 + bob, 8, 20);

    // Crowned Helm
    ctx.fillStyle = isFlashing ? '#ffffff' : '#090514';
    ctx.beginPath();
    ctx.arc(0, -38 + bob, 18, 0, Math.PI * 2);
    ctx.fill();
    // Crown spikes
    ctx.fillStyle = '#e6b849';
    ctx.fillRect(-14, -58 + bob, 6, 10);
    ctx.fillRect(-3, -64 + bob, 6, 14);
    ctx.fillRect(8, -58 + bob, 6, 10);

    // Menacing Glowing Crimson Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(2, -40 + bob, 6, 4);

    // Colossal Cursed Greatsword
    ctx.save();
    ctx.translate(24, -10 + bob);
    ctx.rotate(0.4);
    ctx.fillStyle = '#1e1b2e';
    ctx.fillRect(-8, -4, 16, 8); // Crossguard
    ctx.fillStyle = this.phase === 3 ? '#ef4444' : '#475569';
    ctx.fillRect(-4, -68, 8, 64); // Blade
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-1, -64, 2, 60); // Cursed bloodline groove
    ctx.restore();

    ctx.restore();
  }
}
