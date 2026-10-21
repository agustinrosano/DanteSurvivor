// Circle guardians share their encounter clock, but have distinct attack plans.
export class CircleBoss {
  constructor(x, y, definition, playerCount = 1) {
    this.x = x; this.y = y;
    this.kind = definition.kind;
    this.name = definition.name;
    this.radius = this.kind === 'cerberus' ? 42 : 36;
    this.maxHp = 1800 * (1 + Math.max(0, playerCount - 1) * 0.7);
    this.hp = this.maxHp;
    this.isAlive = true;
    this.phase = 1;
    this.attackTimer = 2;
    this.attackIndex = 0;
    this.windup = 0;
    this.attack = null;
    this.charge = null;
    this.strikes = [];
    this.time = 0;
    this.damageFlashTimer = 0;
    this.sprite = new Image();
    this.sprite.src = definition.sprite;
    this.facing = 1;
  }

  takeDamage(amount, particles, sourceAngle = null) {
    if (!this.isAlive) return 0;
    this.hp = Math.max(0, this.hp - amount);
    this.damageFlashTimer = 0.12;
    particles.addBlood(this.x, this.y, sourceAngle, 8);
    const phase = this.hp / this.maxHp <= 0.3 ? 3 : this.hp / this.maxHp <= 0.65 ? 2 : 1;
    if (phase > this.phase && this.hp > 0) {
      this.phase = phase;
      particles.addFloatingText(this.x, this.y - 65, `¡FASE ${phase}!`, '#f4b7c8', 22, true);
    }
    if (this.hp <= 0) this.isAlive = false;
    return amount;
  }

  update(dt, players, particles, sound, camera, onSpawnMinions, onSpawnProjectile, { events, world }) {
    if (!this.isAlive) return;
    this.time += dt;
    this.damageFlashTimer = Math.max(0, this.damageFlashTimer - dt);
    const living = players.filter(p => p.isAlive && !p.isDowned);
    const target = living.reduce((best, p) => !best || Math.hypot(p.x - this.x, p.y - this.y) < Math.hypot(best.x - this.x, best.y - this.y) ? p : best, null);
    if (!target) return;
    this.facing = target.x >= this.x ? 1 : -1;

    // The three heads strike at staggered times, aimed at the warned direction.
    for (const strike of this.strikes) {
      strike.delay -= dt;
      if (strike.delay > 0 || strike.fired) continue;
      strike.fired = true;
      particles.addSlash(this.x, this.y, strike.angle, 120, '#b9ddc6', true);
      for (const p of living) {
        const angle = Math.atan2(p.y - this.y, p.x - this.x);
        const diff = Math.atan2(Math.sin(angle - strike.angle), Math.cos(angle - strike.angle));
        if (Math.abs(diff) < 0.42 && Math.hypot(p.x - this.x, p.y - this.y) < 120 + p.radius) p.takeDamage(28);
      }
      onSpawnProjectile(this.x + Math.cos(strike.angle) * 40, this.y + Math.sin(strike.angle) * 40,
        Math.cos(strike.angle), Math.sin(strike.angle), 170, 18, 'boss_orb');
      sound.playSlash();
    }
    this.strikes = this.strikes.filter(s => !s.fired);
    if (this.windup > 0) {
      this.windup -= dt;
      if (this.windup <= 0) this.execute(living, particles, sound, camera, onSpawnProjectile, events);
      return;
    }
    if (this.charge) {
      const distance = Math.min(this.charge.remaining, 340 * dt);
      const oldX = this.x, oldY = this.y;
      this.move(Math.cos(this.charge.angle) * distance, Math.sin(this.charge.angle) * distance, world);
      this.charge.remaining -= distance;
      for (const p of living) if (Math.hypot(p.x - this.x, p.y - this.y) < this.radius + p.radius) p.takeDamage(32);
      if (this.charge.remaining <= 0 || Math.hypot(this.x - oldX, this.y - oldY) < 0.1) this.charge = null;
      return;
    }
    if (this.strikes.length) return;

    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const distance = Math.hypot(target.x - this.x, target.y - this.y);
    if (distance > this.radius + 45) {
      const speed = (this.kind === 'cerberus' ? 64 : 58) + this.phase * 8;
      this.move(Math.cos(angle) * speed * dt, Math.sin(angle) * speed * dt, world);
    }
    if (distance < this.radius + target.radius) target.takeDamage(18);
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      const plans = this.kind === 'tempest'
        ? [['gust'], ['gust', 'tornado'], ['gust', 'tornado', 'spiral']]
        : [['bite'], ['bite', 'charge'], ['bite', 'charge', 'frost']];
      const plan = plans[this.phase - 1];
      this.attack = { type: plan[this.attackIndex++ % plan.length], angle, x: target.x, y: target.y };
      this.windup = this.attack.type === 'charge' ? 1.2 : 1;
      this.attackTimer = this.phase === 3 ? 2.7 : 3.7;
    }
  }

  move(dx, dy, world) {
    this.x += dx;
    const colX = world.checkCollision(this.x, this.y, this.radius);
    if (colX.colliding) this.x += colX.pushX;
    this.y += dy;
    const colY = world.checkCollision(this.x, this.y, this.radius);
    if (colY.colliding) this.y += colY.pushY;
  }

  execute(players, particles, sound, camera, onSpawnProjectile, events) {
    const attack = this.attack;
    sound.playBossRoar();
    camera.shake(5, 0.15);
    if (attack.type === 'charge') {
      this.charge = { angle: attack.angle, remaining: 280 };
    } else if (attack.type === 'bite') {
      this.strikes = [-0.65, 0, 0.65].map((offset, i) => ({ angle: attack.angle + offset, delay: i * 0.35, fired: false }));
    } else if (attack.type === 'frost') {
      for (let i = -1; i <= 1; i++) events.addZone('puddle', attack.x + i * 135, attack.y + Math.abs(i) * 70,
        { radius: 46, duration: 10, warning: 2, source: 'boss' });
    } else if (attack.type === 'tornado') {
      for (let i = 0; i < this.phase; i++) {
        const angle = attack.angle + (i - (this.phase - 1) / 2) * 1.2;
        events.addZone('tornado', this.x + Math.cos(angle) * 160, this.y + Math.sin(angle) * 160,
          { radius: 55, duration: 8, source: 'boss' });
      }
    } else if (attack.type === 'gust') {
      for (let i = -1; i <= 1; i++) {
        const angle = attack.angle + i * 0.8;
        events.addZone('gust', this.x + Math.cos(angle) * 120, this.y + Math.sin(angle) * 120,
          { radius: 48, angle, duration: 8, source: 'boss' });
        onSpawnProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 160, 16, 'boss_orb');
      }
    } else if (attack.type === 'spiral') {
      // Leave a broad wedge behind the boss free of projectiles.
      for (let i = -4; i <= 4; i++) {
        const angle = attack.angle + i * 0.35;
        onSpawnProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 155, 18, 'boss_orb');
      }
    }
    this.attack = null;
  }

  render(ctx, camera) {
    if (!camera.isInView(this.x, this.y, 180)) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    const attack = this.attack;
    if (attack) {
      ctx.save(); ctx.rotate(attack.angle);
      ctx.strokeStyle = '#fde68a'; ctx.fillStyle = 'rgba(253, 230, 138, 0.16)'; ctx.lineWidth = 2;
      if (attack.type === 'charge') {
        ctx.fillRect(0, -this.radius, 280, this.radius * 2);
        ctx.strokeRect(0, -this.radius, 280, this.radius * 2);
      } else {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.arc(0, 0, attack.type === 'bite' ? 125 : 180, -1.4, 1.4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
    for (const strike of this.strikes) {
      ctx.save(); ctx.rotate(strike.angle);
      ctx.fillStyle = 'rgba(253, 230, 138, 0.15)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 125, -0.42, 0.42); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 27, 48, 17, 0, 0, Math.PI * 2); ctx.fill();
    if (this.sprite.complete && this.sprite.naturalWidth) {
      const width = this.kind === 'cerberus' ? 155 : 140;
      const height = width * this.sprite.naturalHeight / this.sprite.naturalWidth;
      ctx.imageSmoothingEnabled = false;
      ctx.scale(this.facing, 1);
      if (this.damageFlashTimer > 0) ctx.globalAlpha = 0.65;
      ctx.drawImage(this.sprite, -width / 2, -height + 38 + Math.sin(this.time * 3) * 2, width, height);
    }
    ctx.restore();
  }
}
