// ============================================================================
// DANTE QUEST — Enemy Entities & Mass Horde AI
// ============================================================================

import { drawSprite, directionFromVector } from '../core/Sprites.js';

export class Enemy {
  constructor(type = 'zombie', x = 0, y = 0, isElite = false) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isElite = isElite;
    this.isAlive = true;
    this.damageFlashTimer = 0;
    this.attackCooldownTimer = 0;
    this.facing = 1;
    this.animTimer = Math.random() * 10;

    // Type Configuration
    if (type === 'wolf') {
      this.hp = isElite ? 180 : 38;
      this.maxHp = this.hp;
      this.speed = isElite ? 155 : 130;
      this.damage = 12;
      this.radius = isElite ? 22 : 14;
      this.xpValue = isElite ? 15 : 2;
    } else if (type === 'skeleton') {
      this.hp = isElite ? 160 : 32;
      this.maxHp = this.hp;
      this.speed = isElite ? 100 : 85;
      this.damage = 10;
      this.radius = isElite ? 20 : 13;
      this.xpValue = isElite ? 12 : 2;
      this.shootCooldown = 2.5;
      this.shootTimer = 1.0 + Math.random() * 1.5;
    } else if (type === 'knight') {
      this.hp = isElite ? 350 : 95;
      this.maxHp = this.hp;
      this.speed = isElite ? 85 : 70;
      this.damage = 22;
      this.radius = isElite ? 24 : 17;
      this.xpValue = isElite ? 30 : 6;
    } else if (type === 'wraith') {
      this.hp = isElite ? 220 : 50;
      this.maxHp = this.hp;
      this.speed = isElite ? 120 : 100;
      this.damage = 16;
      this.radius = isElite ? 22 : 15;
      this.xpValue = isElite ? 20 : 4;
      this.phasesThroughWalls = true;
    } else {
      // Zombie (Caminante Putrefacto)
      this.hp = isElite ? 200 : 25;
      this.maxHp = this.hp;
      this.speed = isElite ? 90 : 68;
      this.damage = 10;
      this.radius = isElite ? 22 : 14;
      this.xpValue = isElite ? 10 : 1;
    }
  }

  takeDamage(amount, particles, sourceAngle = null) {
    if (!this.isAlive) return 0;
    this.hp -= amount;
    this.damageFlashTimer = 0.12;

    // Blood splatters
    particles.addBlood(this.x, this.y, sourceAngle, this.isElite ? 10 : 5);

    // Knockback
    if (sourceAngle !== null) {
      const kb = this.isElite ? 25 : 70;
      this.x += Math.cos(sourceAngle) * kb * 0.1;
      this.y += Math.sin(sourceAngle) * kb * 0.1;
    }

    if (this.hp <= 0) {
      this.isAlive = false;
    }

    return amount;
  }

  update(dt, players, world, nearbyEnemies) {
    if (!this.isAlive) return;

    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
    this.animTimer += dt;

    // 1. Target closest living player
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

    // Direction to player
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    let desiredVx = Math.cos(angle) * this.speed;
    let desiredVy = Math.sin(angle) * this.speed;

    // 2. Horde Separation (Soft repulsion from nearby horde members)
    let sepX = 0;
    let sepY = 0;
    let sepCount = 0;

    for (let i = 0; i < nearbyEnemies.length; i++) {
      const other = nearbyEnemies[i];
      if (other === this || !other.isAlive) continue;
      const d = Math.hypot(this.x - other.x, this.y - other.y);
      const minSep = this.radius + other.radius + 4;
      if (d < minSep && d > 0.1) {
        const push = (minSep - d) / minSep;
        sepX += ((this.x - other.x) / d) * push * 60;
        sepY += ((this.y - other.y) / d) * push * 60;
        sepCount++;
      }
    }

    if (sepCount > 0) {
      desiredVx += sepX;
      desiredVy += sepY;
    }

    this.vx = desiredVx;
    this.vy = desiredVy;

    if (this.vx !== 0) {
      this.facing = this.vx > 0 ? 1 : -1;
    }

    // 3. Movement with collision
    this.x += this.vx * dt;
    if (!this.phasesThroughWalls) {
      const colX = world.checkCollision(this.x, this.y, this.radius);
      if (colX.colliding) this.x += colX.pushX;
    }

    this.y += this.vy * dt;
    if (!this.phasesThroughWalls) {
      const colY = world.checkCollision(this.x, this.y, this.radius);
      if (colY.colliding) this.y += colY.pushY;
    }

    // 4. Melee attack collision with player
    const distToTarget = Math.hypot(target.x - this.x, target.y - this.y);
    if (distToTarget < this.radius + target.radius && this.attackCooldownTimer <= 0) {
      target.takeDamage(this.damage);
      this.attackCooldownTimer = 0.8; // 0.8s between bites/strikes
    }
  }

  render(ctx, camera) {
    if (!camera.isInView(this.x, this.y, 40)) return;

    // Elite Glowing Aura
    if (this.isElite) {
      ctx.fillStyle = 'rgba(230, 184, 73, 0.25)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.7, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    const isFlashing = this.damageFlashTimer > 0;
    const dir = directionFromVector(this.vx, this.vy, this.facing > 0 ? 'east' : 'west');
    const scale = this.isElite ? 1.3 : 1.0;
    const drawn = drawSprite(ctx, `enemies/${this.type}`, this.x, this.y + this.radius, {
      dir,
      anim: 'walk',
      time: this.animTimer,
      tint: isFlashing ? '#ffffff' : null,
      scale
    });

    if (drawn) {
      // Health bar for Elites
      if (this.isElite) {
        const barW = 32;
        const barH = 4;
        const pct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW, barH);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW * pct, barH);
      }
      return;
    }

    const bob = Math.sin(this.animTimer) * 2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    if (this.type === 'wolf') {
      // Corrupted Wolf
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e1b24';
      ctx.beginPath();
      ctx.ellipse(0, bob, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wolf Head
      ctx.beginPath();
      ctx.arc(8, -4 + bob, 6, 0, Math.PI * 2);
      ctx.fill();
      // Glowing Eyes
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(9, -5 + bob, 2, 2);
    } else if (this.type === 'skeleton') {
      // Skeleton
      ctx.fillStyle = isFlashing ? '#ffffff' : '#e2e8f0';
      ctx.fillRect(-3, -6 + bob, 6, 12); // Ribcage
      ctx.beginPath();
      ctx.arc(0, -11 + bob, 5, 0, Math.PI * 2); // Skull
      ctx.fill();
      ctx.fillStyle = '#ef4444'; // Red eyes
      ctx.fillRect(1, -12 + bob, 2, 2);
      // Bow
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(6, -6 + bob, 8, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    } else if (this.type === 'knight') {
      // Undead Armored Knight
      ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
      ctx.fillRect(-8, -10 + bob, 16, 18);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, -15 + bob, 7, 0, Math.PI * 2);
      ctx.fill();
      // Shield
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(7, -8 + bob, 5, 14);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(1, -16 + bob, 3, 2);
    } else if (this.type === 'wraith') {
      // Shadow Wraith
      ctx.fillStyle = isFlashing ? '#ffffff' : 'rgba(88, 28, 135, 0.85)';
      ctx.beginPath();
      ctx.arc(0, -8 + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(2, -9 + bob, 3, 2);
    } else {
      // Default: Zombie (Caminante Putrefacto)
      // Torso with rotting clothes
      ctx.fillStyle = isFlashing ? '#ffffff' : '#3f2e22';
      ctx.fillRect(-6, -6 + bob, 12, 14);
      // Decayed Green Flesh Head
      ctx.fillStyle = isFlashing ? '#ffffff' : '#4d7c0f';
      ctx.beginPath();
      ctx.arc(0, -12 + bob, 6, 0, Math.PI * 2);
      ctx.fill();
      // Glowing bloodshot eye
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(1, -13 + bob, 2, 2);
      // Outstretched claw arms
      ctx.fillStyle = isFlashing ? '#ffffff' : '#365314';
      ctx.fillRect(3, -5 + bob, 9, 3);
    }

    ctx.restore();

    // Health bar for Elites
    if (this.isElite) {
      const barW = 32;
      const barH = 4;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#000000';
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW, barH);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW * pct, barH);
    }
  }
}
