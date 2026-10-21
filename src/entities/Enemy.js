// ============================================================================
// DANTE QUEST — Enemy Entities & Mass Horde AI
// ============================================================================

import { drawSprite, directionFromVector } from '../core/Sprites.js';

const CIRCLE_ENEMIES = {
  tempest_soul: { hp: 40, speed: 145, damage: 12, radius: 15, xpValue: 4, sprite: 'wraith', tint: 'rgba(235, 139, 171, 0.35)', scale: 1, phasesThroughWalls: true },
  siren: { hp: 48, speed: 82, damage: 13, radius: 15, xpValue: 5, sprite: 'skeleton', tint: 'rgba(224, 120, 158, 0.30)', scale: 1 },
  glutton: { hp: 130, speed: 50, damage: 20, radius: 22, xpValue: 7, sprite: 'zombie', tint: 'rgba(133, 163, 124, 0.35)', scale: 1.35 },
  mireling: { hp: 42, speed: 110, damage: 12, radius: 14, xpValue: 4, sprite: 'wolf', tint: 'rgba(155, 193, 171, 0.35)', scale: 0.95 }
};

export class Enemy {
  constructor(type = 'zombie', x = 0, y = 0, isElite = false, healthMultiplier = 1) {
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
    } else if (type === 'vampire') {
      // Vampiro Sombrío (rápido, drena vida al golpear)
      this.hp = isElite ? 240 : 45;
      this.maxHp = this.hp;
      this.speed = isElite ? 160 : 135;
      this.damage = 18;
      this.radius = isElite ? 22 : 15;
      this.xpValue = isElite ? 24 : 5;
    } else if (type === 'plant') {
      // Planta Carnívora / Espina Maldita (resistente, pesada, daño de espinas)
      this.hp = isElite ? 320 : 70;
      this.maxHp = this.hp;
      this.speed = isElite ? 60 : 42;
      this.damage = 16;
      this.radius = isElite ? 26 : 18;
      this.xpValue = isElite ? 22 : 4;
    } else if (type === 'slime') {
      // Ameba / Slime estilo Dragon Quest en paleta oscura
      this.hp = isElite ? 120 : 22;
      this.maxHp = this.hp;
      this.speed = isElite ? 120 : 95;
      this.damage = 9;
      this.radius = isElite ? 20 : 13;
      this.xpValue = isElite ? 10 : 2;
    } else if (type === 'demon') {
      // Demonio menor estilo Dragon Quest (alado, cornudo, con tridente)
      this.hp = isElite ? 180 : 38;
      this.maxHp = this.hp;
      this.speed = isElite ? 140 : 115;
      this.damage = 15;
      this.radius = isElite ? 20 : 14;
      this.xpValue = isElite ? 18 : 4;
      this.phasesThroughWalls = true; // Vuela sobre muros
    } else {
      // Zombie (Caminante Putrefacto)
      this.hp = isElite ? 200 : 25;
      this.maxHp = this.hp;
      this.speed = isElite ? 90 : 68;
      this.damage = 10;
      this.radius = isElite ? 22 : 14;
      this.xpValue = isElite ? 10 : 1;
    }
    this.variant = CIRCLE_ENEMIES[type] || null;
    if (this.variant) {
      const { hp, speed, damage, radius, xpValue, phasesThroughWalls } = this.variant;
      this.hp = hp * (isElite ? 4 : 1);
      this.speed = speed * (isElite ? 1.12 : 1);
      this.damage = damage;
      this.radius = radius * (isElite ? 1.2 : 1);
      this.xpValue = xpValue * (isElite ? 4 : 1);
      this.phasesThroughWalls = Boolean(phasesThroughWalls);
      this.shootTimer = 1.2 + Math.random();
    }
    this.hp = Math.ceil(this.hp * healthMultiplier);
    this.maxHp = this.hp;
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

  update(dt, players, world, nearbyEnemies, projectiles = null) {
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
    if (this.type === 'siren') {
      const approach = minDist < 180 ? -1 : minDist < 260 ? 0 : 1;
      desiredVx *= approach; desiredVy *= approach;
      this.shootTimer -= dt;
      if (projectiles && minDist < 500 && this.shootTimer <= 0) {
        projectiles.spawn(this.x, this.y, Math.cos(angle), Math.sin(angle), 145, this.damage, 'boss_orb', 1, true);
        this.shootTimer = 3;
      }
    } else if (this.type === 'tempest_soul') {
      const drift = Math.sin(this.animTimer * 3) * 30;
      desiredVx += Math.cos(angle + Math.PI / 2) * drift;
      desiredVy += Math.sin(angle + Math.PI / 2) * drift;
    }

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
      // Vampiro drena vida
      if (this.type === 'vampire') {
        this.hp = Math.min(this.maxHp, this.hp + 6);
      }
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
    const scale = (this.isElite ? 1.3 : 1.0) * (this.variant?.scale || 1);
    const drawn = drawSprite(ctx, `enemies/${this.variant?.sprite || this.type}`, this.x, this.y + this.radius, {
      dir,
      anim: 'walk',
      time: this.animTimer,
      tint: isFlashing ? '#ffffff' : this.variant?.tint,
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
    } else if (this.type === 'vampire') {
      // Vampiro Sombrío (Capa carmesí, ojos rojos, garras oscuras)
      const capeFlutter = Math.sin(this.animTimer * 6) * 3;
      // Capa carmesí
      ctx.fillStyle = isFlashing ? '#ffffff' : '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(-7, -14 + bob);
      ctx.lineTo(8, -14 + bob);
      ctx.lineTo(12 + capeFlutter, 10 + bob);
      ctx.lineTo(-12 - capeFlutter, 10 + bob);
      ctx.closePath();
      ctx.fill();

      // Cuello alto gótico de vampiro
      ctx.fillStyle = isFlashing ? '#ffffff' : '#991b1b';
      ctx.fillRect(-8, -16 + bob, 16, 4);

      // Traje aristocrático oscuro
      ctx.fillStyle = isFlashing ? '#ffffff' : '#18181b';
      ctx.fillRect(-5, -10 + bob, 10, 14);

      // Rostro pálido cadavérico
      ctx.fillStyle = isFlashing ? '#ffffff' : '#e4e4e7';
      ctx.beginPath();
      ctx.arc(0, -14 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      // Ojos escarlata brillante
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(1, -15 + bob, 2.5, 2);

      // Colmillos afilados
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, -11 + bob, 1.5, 2);
      ctx.fillRect(3, -11 + bob, 1.5, 2);

    } else if (this.type === 'plant') {
      // Planta Carnívora / Espina Maldita
      const snap = Math.sin(this.animTimer * 5);
      // Raíces y vides espinosas
      ctx.fillStyle = isFlashing ? '#ffffff' : '#14532d';
      ctx.beginPath();
      ctx.ellipse(0, 8 + bob, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tallo oscuro con espinas
      ctx.fillStyle = isFlashing ? '#ffffff' : '#166534';
      ctx.fillRect(-3, -8 + bob, 6, 16);

      // Mandíbula carnívora superior (boca que abre y cierra)
      ctx.fillStyle = isFlashing ? '#ffffff' : '#831843';
      ctx.beginPath();
      ctx.arc(0, -10 + bob + snap * 2, 11, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Mandíbula carnívora inferior
      ctx.fillStyle = isFlashing ? '#ffffff' : '#9d174d';
      ctx.beginPath();
      ctx.arc(0, -6 + bob - snap * 2, 11, 0, Math.PI);
      ctx.closePath();
      ctx.fill();

      // Dientes afilados de la trampa
      ctx.fillStyle = '#f8fafc';
      for (let d = -8; d <= 8; d += 4) {
        ctx.fillRect(d, -10 + bob + snap * 2, 2, 3);
        ctx.fillRect(d, -8 + bob - snap * 2, 2, 3);
      }

      // Ojo/Pétalo tóxico violeta brillante
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(2, -14 + bob, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'slime') {
      // Ameba / Slime estilo Dragon Quest (silueta de gota con ojos saltones y sonrisa)
      const hop = Math.abs(Math.sin(this.animTimer * 5));
      const squish = (hop - 0.5) * 0.3; // Squash & stretch

      ctx.save();
      ctx.scale(1 + squish, 1 - squish);

      // Cuerpo en forma de lágrima/gota
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(0, -18 + bob);
      ctx.bezierCurveTo(14, -6 + bob, 15, 8 + bob, 0, 8 + bob);
      ctx.bezierCurveTo(-15, 8 + bob, -14, -6 + bob, 0, -18 + bob);
      ctx.closePath();
      ctx.fill();

      // Brillo interior traslúcido
      ctx.fillStyle = isFlashing ? '#ffffff' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(-2, -4 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      // Ojos saltones estilo Dragon Quest (grandes círculos blancos con pupilas negras)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3, -2 + bob, 3.5, 0, Math.PI * 2);
      ctx.arc(5, -2 + bob, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupilas orientadas hacia adelante
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-2, -2 + bob, 1.8, 0, Math.PI * 2);
      ctx.arc(6, -2 + bob, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Sonrisa picara estilo DQ
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(1, 1 + bob, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();

      ctx.restore();

    } else if (this.type === 'demon') {
      // Demonio menor estilo Dragon Quest (diablillo cornudo con alas de murciélago y tridente)
      const wingFlap = Math.sin(this.animTimer * 8) * 4;

      // Alas de murciélago moradas/oscuras
      ctx.fillStyle = isFlashing ? '#ffffff' : '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(-4, -6 + bob);
      ctx.lineTo(-18, -16 + bob + wingFlap);
      ctx.lineTo(-12, 0 + bob);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(4, -6 + bob);
      ctx.lineTo(18, -16 + bob + wingFlap);
      ctx.lineTo(12, 0 + bob);
      ctx.closePath();
      ctx.fill();

      // Cola puntiaguda de diablo
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, 4 + bob);
      ctx.quadraticCurveTo(-14, 8 + bob, -16, 0 + bob);
      ctx.stroke();
      // Flecha de la cola
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(-16, 0 + bob);
      ctx.lineTo(-13, -3 + bob);
      ctx.lineTo(-13, 3 + bob);
      ctx.closePath();
      ctx.fill();

      // Cuerpo rechoncho diablesco (rojo/púrpura)
      ctx.fillStyle = isFlashing ? '#ffffff' : '#b91c1c';
      ctx.beginPath();
      ctx.arc(0, -2 + bob, 8, 0, Math.PI * 2);
      ctx.fill();

      // Cabeza diablilla
      ctx.beginPath();
      ctx.arc(0, -10 + bob, 7, 0, Math.PI * 2);
      ctx.fill();

      // Cuernos afilados amarillos
      ctx.fillStyle = isFlashing ? '#ffffff' : '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-4, -15 + bob);
      ctx.lineTo(-7, -22 + bob);
      ctx.lineTo(-2, -16 + bob);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(4, -15 + bob);
      ctx.lineTo(7, -22 + bob);
      ctx.lineTo(2, -16 + bob);
      ctx.closePath();
      ctx.fill();

      // Ojos amarillos con pupilas verticales
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, -12 + bob, 3, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(1, -12 + bob, 1.5, 3);

      // Pequeño tridente dorado
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, -16 + bob);
      ctx.lineTo(8, 10 + bob);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, -18 + bob, 5, 2);
      ctx.fillRect(5, -20 + bob, 2, 4);
      ctx.fillRect(8, -21 + bob, 2, 5);
      ctx.fillRect(10, -20 + bob, 2, 4);

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
