// Bounded, local hazards shared by weather, creatures and circle bosses.
export class MapEvents {
  constructor(mapId = 'bosque') {
    this.mapId = mapId;
    this.zones = [];
    this.nextEvent = 60;
    this.event = null;
    this.poolTimer = 0;
    this.elapsed = 0;
  }

  clear() {
    this.zones.length = 0;
    this.event = null;
  }

  addZone(type, x, y, options = {}) {
    if (this.zones.length >= 24) this.zones.shift();
    const zone = { type, x, y, radius: 48, age: 0, warning: 2, duration: 12, angle: 0, source: 'map', ...options };
    this.zones.push(zone);
    return zone;
  }

  update(dt, { time, players, world, bossActive = false, isDungeon = false }) {
    this.elapsed += dt;
    const living = players.filter(p => p.isAlive && !p.isDowned);
    for (const player of players) player.environmentSpeedMultiplier = 1;
    if (isDungeon) return;

    this.zones = this.zones.filter(zone => {
      zone.age += dt;
      return zone.age < zone.warning + zone.duration && living.some(p => Math.hypot(p.x - zone.x, p.y - zone.y) < 1400);
    });

    if (bossActive) {
      this.event = null;
      this.nextEvent = time + 35;
    } else if (living.length && (this.mapId === 'lujuria' || this.mapId === 'gula')) {
      if (!this.event && time >= this.nextEvent) this.startEvent(time, living[0]);
      if (this.event) {
        if (time >= this.event.endsAt) this.event = null;
        else if (this.mapId === 'gula' && time >= this.event.startsAt + 2) {
          this.poolTimer -= dt;
          if (this.poolTimer <= 0) {
            this.poolTimer = 1.6;
            const target = living[Math.floor(Math.random() * living.length)];
            const angle = Math.random() * Math.PI * 2;
            const distance = 90 + Math.random() * 240;
            const x = target.x + Math.cos(angle) * distance;
            const y = target.y + Math.sin(angle) * distance;
            if (!world.checkCollision(x, y, 48).colliding) this.addZone('puddle', x, y, { duration: 30, warning: 2 });
          }
        }
      }
    }

    for (const zone of this.zones) {
      if (zone.age < zone.warning || zone.type !== 'puddle') continue;
      for (const player of living) {
        if (!player.isDodging && Math.hypot(player.x - zone.x, player.y - zone.y) < zone.radius + player.radius) {
          player.environmentSpeedMultiplier = 0.6;
        }
      }
    }
  }

  startEvent(time, player) {
    const duration = 8 + Math.random() * 4;
    this.event = { startsAt: time, endsAt: time + 2 + duration };
    this.nextEvent = time + 35 + Math.random() * 15;
    this.poolTimer = 0;
    if (this.mapId === 'lujuria') {
      const angle = Math.random() * Math.PI * 2;
      for (let i = 0; i < 4; i++) {
        const offset = (i - 1.5) * 140;
        this.addZone('gust', player.x + Math.cos(angle + Math.PI / 2) * offset,
          player.y + Math.sin(angle + Math.PI / 2) * offset,
          { radius: 52, angle, duration, warning: 2 });
      }
    }
  }

  applyForces(players, world, dt) {
    for (const zone of this.zones) {
      if (zone.age < zone.warning || zone.type === 'puddle') continue;
      for (const player of players) {
        if (!player.isAlive || player.isDowned || player.isDodging) continue;
        const distance = Math.hypot(player.x - zone.x, player.y - zone.y);
        if (distance >= zone.radius + player.radius) continue;
        const angle = zone.type === 'tornado' ? Math.atan2(player.y - zone.y, player.x - zone.x) + Math.PI / 3 : zone.angle;
        const force = zone.type === 'tornado' ? 140 : 100;
        // Resolve each axis through the same collision boundary as player movement.
        player.x += Math.cos(angle) * force * dt;
        const colX = world.checkCollision(player.x, player.y, player.radius);
        if (colX.colliding) player.x += colX.pushX;
        player.y += Math.sin(angle) * force * dt;
        const colY = world.checkCollision(player.x, player.y, player.radius);
        if (colY.colliding) player.y += colY.pushY;
      }
    }
  }

  get status() {
    if (!this.event) return '';
    return this.mapId === 'lujuria' ? 'TEMPESTAD · Esquivá las ráfagas' : 'LLUVIA HELADA · Evitá los charcos';
  }

  render(ctx, camera) {
    for (const zone of this.zones) {
      if (!camera.isInView(zone.x, zone.y, zone.radius + 10)) continue;
      const warning = zone.age < zone.warning;
      ctx.save();
      ctx.translate(zone.x, zone.y);
      ctx.globalAlpha = Math.min(1, (zone.warning + zone.duration - zone.age) / 2);
      ctx.strokeStyle = warning ? '#fde68a' : zone.type === 'puddle' ? '#b5ded0' : '#f2afc6';
      ctx.fillStyle = warning ? 'rgba(253, 230, 138, 0.10)' : zone.type === 'puddle' ? 'rgba(102, 158, 139, 0.42)' : 'rgba(235, 137, 168, 0.18)';
      ctx.lineWidth = 2;
      if (warning) ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      if (zone.type !== 'puddle') {
        ctx.rotate(zone.type === 'tornado' ? zone.age * 3 : zone.angle);
        for (let i = -1; i <= 1; i++) {
          const offset = i * 16;
          ctx.beginPath();
          ctx.moveTo(-18, offset - 7); ctx.lineTo(8, offset); ctx.lineTo(-18, offset + 7);
          ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(22, 0);
        ctx.moveTo(0, -22); ctx.lineTo(0, 22); ctx.stroke();
      }
      ctx.restore();
    }
  }

  renderWeather(ctx, width, height) {
    if (!this.event || this.mapId !== 'gula') return;
    ctx.save();
    ctx.strokeStyle = 'rgba(197, 225, 215, 0.28)';
    ctx.lineWidth = 1;
    // Constant count, independent of screen size, no particle allocations.
    for (let i = 0; i < 48; i++) {
      const x = ((i * 173 + this.elapsed * 90) % width);
      const y = ((i * 97 + this.elapsed * 380) % height);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 14); ctx.stroke();
    }
    ctx.restore();
  }
}
