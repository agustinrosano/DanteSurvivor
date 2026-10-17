// ============================================================================
// DANTE QUEST — Player Entity (Movement, Combat, Dodge Roll, Co-op Revival)
// ============================================================================

import { CHARACTERS } from '../systems/Characters.js';

export class Player {
  constructor(id = 'local', charId = 'dante', x = 0, y = 0, isLocal = true) {
    this.id = id;
    this.isLocal = isLocal;
    this.charData = CHARACTERS[charId] || CHARACTERS.dante;

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 16;
    this.facing = 1; // 1: Right, -1: Left

    // Base & Modified Stats
    this.stats = { ...this.charData.stats };
    this.hp = this.stats.hp;
    this.maxHp = this.stats.hp;

    // Progression
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 15;
    this.kills = 0;
    this.souls = 0;

    // Equipped Weapons & Upgrades
    this.weapons = [{ id: this.charData.weapon, level: 1, timer: 0 }];
    this.passives = {};

    // Dodge Roll
    this.isDodging = false;
    this.dodgeDuration = 0.28;
    this.dodgeTimer = 0;
    this.dodgeCooldown = 2.2;
    this.dodgeCooldownTimer = 0;
    this.dodgeDirX = 1;
    this.dodgeDirY = 0;
    this.dodgeTrails = []; // Ghost trail for visual flair

    // Active Skill
    this.skillCooldown = 14.0;
    this.skillCooldownTimer = 0;
    this.skillActiveDuration = 0;

    // State
    this.isAlive = true;
    this.isDowned = false; // Co-op downed state
    this.reviveProgress = 0; // 0 to 1
    this.damageFlashTimer = 0;
    this.invulnerabilityTimer = 0;
    this.walkAnimTimer = 0;

    // Weapon Swing Visual
    this.swordAngle = 0;
    this.isAttacking = false;
    this.attackAnimTimer = 0;
  }

  takeDamage(amount) {
    if (!this.isAlive || this.isDodging || this.isDowned || this.invulnerabilityTimer > 0) return 0;

    // Armor damage reduction formula
    const reduction = this.stats.defense / (this.stats.defense + 50);
    const actualDamage = Math.max(1, Math.round(amount * (1 - reduction)));

    this.hp = Math.max(0, this.hp - actualDamage);
    this.damageFlashTimer = 0.2;
    this.invulnerabilityTimer = 0.6; // 0.6s grace period

    if (this.hp <= 0) {
      this.isDowned = true;
      this.reviveProgress = 0;
    }

    return actualDamage;
  }

  heal(amount) {
    if (!this.isAlive || this.isDowned) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addXp(amount) {
    if (!this.isAlive || this.isDowned) return false;
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.round(this.xpToNext * 1.35 + 10);
      return true; // Leveled up!
    }
    return false;
  }

  triggerDodge(moveVector) {
    if (this.dodgeCooldownTimer > 0 || this.isDodging || this.isDowned) return false;

    let dx = moveVector.x;
    let dy = moveVector.y;
    if (dx === 0 && dy === 0) {
      dx = this.facing;
      dy = 0;
    }

    const len = Math.hypot(dx, dy) || 1;
    this.dodgeDirX = dx / len;
    this.dodgeDirY = dy / len;
    this.isDodging = true;
    this.dodgeTimer = this.dodgeDuration;
    this.dodgeCooldownTimer = this.dodgeCooldown;
    return true;
  }

  triggerSkill() {
    if (this.skillCooldownTimer > 0 || this.isDowned) return false;
    this.skillCooldownTimer = this.skillCooldown;
    this.skillActiveDuration = 6.0; // 6s duration buff
    return true;
  }

  update(dt, moveVector, world) {
    // 1. Timers
    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;
    if (this.invulnerabilityTimer > 0) this.invulnerabilityTimer -= dt;
    if (this.dodgeCooldownTimer > 0) this.dodgeCooldownTimer -= dt;
    if (this.skillCooldownTimer > 0) this.skillCooldownTimer -= dt;
    if (this.skillActiveDuration > 0) this.skillActiveDuration -= dt;
    if (this.attackAnimTimer > 0) this.attackAnimTimer -= dt;

    // 2. Co-op Downed state check
    if (this.isDowned) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // 3. Movement or Dodge Roll
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      const dodgeSpeed = this.stats.speed * 2.5;
      this.vx = this.dodgeDirX * dodgeSpeed;
      this.vy = this.dodgeDirY * dodgeSpeed;

      // Spawn trail ghost
      this.dodgeTrails.push({ x: this.x, y: this.y, alpha: 0.6, facing: this.facing });

      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
      }
    } else {
      // Normal movement
      let speed = this.stats.speed;
      if (this.skillActiveDuration > 0 && this.charData.id === 'dante') {
        speed *= 1.35; // Furia del Guerrero speed buff
      }

      this.vx = moveVector.x * speed;
      this.vy = moveVector.y * speed;

      if (moveVector.x !== 0) {
        this.facing = moveVector.x > 0 ? 1 : -1;
      }

      if (this.vx !== 0 || this.vy !== 0) {
        this.walkAnimTimer += dt * 10;
      }
    }

    // 4. Update dodge trails decay
    for (let i = this.dodgeTrails.length - 1; i >= 0; i--) {
      this.dodgeTrails[i].alpha -= dt * 4;
      if (this.dodgeTrails[i].alpha <= 0) {
        this.dodgeTrails.splice(i, 1);
      }
    }

    // 5. Position integration with World Collision
    this.x += this.vx * dt;
    const colX = world.checkCollision(this.x, this.y, this.radius);
    if (colX.colliding) {
      this.x += colX.pushX;
    }

    this.y += this.vy * dt;
    const colY = world.checkCollision(this.x, this.y, this.radius);
    if (colY.colliding) {
      this.y += colY.pushY;
    }
  }

  render(ctx, camera) {
    if (!camera.isInView(this.x, this.y, 60)) return;

    // Render Dodge Ghost Trails
    for (const trail of this.dodgeTrails) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, trail.alpha * 0.5);
      this.drawHeroSprite(ctx, trail.x, trail.y, trail.facing, false, '#38bdf8');
      ctx.restore();
    }

    // Shadow under character
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 14, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Damage flash or normal render
    const isFlashing = this.damageFlashTimer > 0;
    this.drawHeroSprite(ctx, this.x, this.y, this.facing, isFlashing);

    // Downed / Revival Ring
    if (this.isDowned) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 32, 0, Math.PI * 2);
      ctx.stroke();

      if (this.reviveProgress > 0) {
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.reviveProgress);
        ctx.stroke();
      }

      ctx.fillStyle = '#ef4444';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡CAÍDO! (REVIVIR)', this.x, this.y - 32);
    }
  }

  drawHeroSprite(ctx, x, y, facing, isFlashing, tintColor = null) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    const bob = (this.vx !== 0 || this.vy !== 0) ? Math.sin(this.walkAnimTimer) * 2 : 0;
    const charId = this.charData.id || 'dante';

    if (charId === 'lyra') {
      // --- LYRA (Hechicera) ---
      // Flowing Violet Robes
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#6b21a8');
      ctx.beginPath();
      ctx.moveTo(-6, -6 + bob);
      ctx.lineTo(8, -6 + bob);
      ctx.lineTo(11, 14 + bob);
      ctx.lineTo(-9, 14 + bob);
      ctx.closePath();
      ctx.fill();

      // Mystic Gold Trim
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#e6b849');
      ctx.fillRect(-2, -5 + bob, 4, 18);

      // Sorceress Hood & Face
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#7e22ce');
      ctx.beginPath();
      ctx.arc(0, -15 + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      // Glowing violet eyes
      ctx.fillStyle = '#f0abfc';
      ctx.fillRect(1, -16 + bob, 3, 2);

      // Arcane Crystal Staff
      ctx.save();
      ctx.translate(9, -2 + bob);
      ctx.fillStyle = '#78350f'; // Wood shaft
      ctx.fillRect(-2, -26, 4, 36);
      // Glowing Crystal Orb
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, -28, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf4ff';
      ctx.beginPath();
      ctx.arc(1, -29, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else if (charId === 'kael') {
      // --- KAEL (Arquero) ---
      // Green Cloak / Dark Leather Tunic
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#14532d');
      ctx.fillRect(-7, -8 + bob, 14, 16);
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#78350f'); // Leather belt
      ctx.fillRect(-7, -1 + bob, 14, 3);

      // Legs
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#292524');
      ctx.fillRect(-5, 8 + bob, 3, 7);
      ctx.fillRect(2, 8 + bob, 3, 7);

      // Ranger Hood
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#166534');
      ctx.beginPath();
      ctx.arc(0, -15 + bob, 7.5, 0, Math.PI * 2);
      ctx.fill();
      // Keen eyes
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(1, -16 + bob, 2, 2);

      // Quiver on Back
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-10, -12 + bob, 4, 14);

      // Recurve Bow
      ctx.save();
      ctx.translate(7, -2 + bob);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
      ctx.restore();

    } else if (charId === 'morgana') {
      // --- MORGANA (Nigromante) ---
      // Dark Obsidian Robe with ragged hems
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#18181b');
      ctx.beginPath();
      ctx.moveTo(-7, -7 + bob);
      ctx.lineTo(7, -7 + bob);
      ctx.lineTo(10, 14 + bob);
      ctx.lineTo(-10, 14 + bob);
      ctx.closePath();
      ctx.fill();

      // Bone Talisman
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-2, -3 + bob, 4, 4);

      // Necromancer Hood
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#27272a');
      ctx.beginPath();
      ctx.arc(0, -15 + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      // Glowing green/purple soul eyes
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(1, -16 + bob, 3, 2);

      // Skull Staff
      ctx.save();
      ctx.translate(9, -2 + bob);
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(-1.5, -24, 3, 34);
      // Tiny Skull on Top
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, -26, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(0, -27, 2, 2);
      ctx.restore();

    } else if (charId === 'thorin') {
      // --- THORIN (Paladín) ---
      // Bulky Golden Dwarven Plate Armor
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#ca8a04');
      ctx.fillRect(-9, -8 + bob, 18, 16);
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#fef08a');
      ctx.fillRect(-6, -5 + bob, 12, 10);

      // Stout Sturdy Legs
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#854d0e');
      ctx.fillRect(-7, 7 + bob, 5, 7);
      ctx.fillRect(2, 7 + bob, 5, 7);

      // Dwarven Helm & Beard
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#eab308');
      ctx.beginPath();
      ctx.arc(0, -14 + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      // Long Ginger / Brown Beard
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#9a3412');
      ctx.beginPath();
      ctx.moveTo(-5, -11 + bob);
      ctx.lineTo(5, -11 + bob);
      ctx.lineTo(0, -2 + bob);
      ctx.closePath();
      ctx.fill();

      // Warhammer
      ctx.save();
      ctx.translate(8, -2 + bob);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -18, 4, 26);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-7, -23, 14, 8); // Hammer head
      ctx.restore();

    } else {
      // --- DANTE (Guerrero Protagonista) ---
      // 1. Flowing Crimson Cape
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#991b1b');
      ctx.beginPath();
      ctx.moveTo(-6, -8 + bob);
      ctx.quadraticCurveTo(-18, 4 + bob, -12, 14 + bob);
      ctx.lineTo(-2, 12 + bob);
      ctx.closePath();
      ctx.fill();

      // 2. Silver Plate Armor Legs
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#475569');
      ctx.fillRect(-6, 6 + bob, 4, 8);
      ctx.fillRect(2, 6 + bob, 4, 8);

      // 3. Shining Silver Plate Torso & Chestplate
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#cbd5e1');
      ctx.fillRect(-8, -10 + bob, 16, 17);
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#94a3b8');
      ctx.fillRect(-5, -7 + bob, 10, 11);
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#e6b849'); // Gold crest
      ctx.fillRect(-2, -5 + bob, 4, 5);

      // 4. Dante's Head & Dark Hair (Matching new portrait)
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#cbd5e1');
      ctx.beginPath();
      ctx.arc(0, -16 + bob, 7.5, 0, Math.PI * 2);
      ctx.fill();
      // Flowing dark hair
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#0f172a');
      ctx.beginPath();
      ctx.arc(0, -17 + bob, 8, Math.PI, 0);
      ctx.lineTo(-6, -11 + bob);
      ctx.closePath();
      ctx.fill();
      // Stern determined eyes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1, -16 + bob, 2, 2);

      // 5. Giant Two-Handed Steel Greatsword (Espadón)
      ctx.save();
      const swing = this.attackAnimTimer > 0 ? (this.attackAnimTimer / 0.2) * 1.6 : 0;
      ctx.translate(8, -2 + bob);
      ctx.rotate(0.3 + swing);

      // Crossguard
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#e6b849');
      ctx.fillRect(-4, -2, 8, 4);
      // Steel Blade
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#f8fafc');
      ctx.fillRect(-2, -32, 4, 30);
      ctx.fillStyle = isFlashing ? '#ffffff' : (tintColor || '#94a3b8');
      ctx.fillRect(-1, -30, 2, 28);
      ctx.restore();
    }

    ctx.restore();
  }
}
