// ============================================================================
// DANTE QUEST — Particle & Floating Text System (High Performance Pooling)
// ============================================================================

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.slashes = []; // Arc swing animations
    this.animatedVFX = []; // Frame-by-frame spritesheet VFX

    // VFX Spritesheets
    this.lightningSheet = new Image();
    this.lightningSheet.src = '/assets/sprites/vfx/lightning_sheet.png';

    this.bombSheet = new Image();
    this.bombSheet.src = '/assets/sprites/vfx/magic_bomb_sheet.png';
  }

  addLightningStrike(x, y) {
    this.animatedVFX.push({
      type: 'lightning',
      x: x,
      y: y,
      duration: 0.32,
      timer: 0
    });
  }

  addMagicExplosion(x, y, radius = 54) {
    this.animatedVFX.push({
      type: 'magic_explosion',
      x: x,
      y: y,
      radius: radius,
      duration: 0.42,
      timer: 0
    });
  }

  addFloatingText(x, y, text, color = '#ffffff', fontSize = 14, isCrit = false) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      vy: -40 - Math.random() * 20,
      text: text,
      color: color,
      fontSize: isCrit ? fontSize * 1.4 : fontSize,
      alpha: 1.0,
      life: 0.8,
      maxLife: 0.8,
      isCrit: isCrit
    });
  }

  addBlood(x, y, dirAngle = null, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = dirAngle !== null ? dirAngle + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 100;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#991b1b' : '#dc2626',
        size: 2 + Math.random() * 3,
        alpha: 1.0,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        friction: 0.92
      });
    }
  }

  addSpark(x, y, color = '#e6b849', count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 80;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 2 + Math.random() * 2,
        alpha: 1.0,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        friction: 0.94
      });
    }
  }

  addSlash(x, y, angle, radius = 55, color = '#cbd5e1', isWide = false) {
    this.slashes.push({
      x: x,
      y: y,
      angle: angle,
      radius: radius,
      color: color,
      arcWidth: isWide ? Math.PI * 1.2 : Math.PI * 0.8,
      life: 0.18,
      maxLife: 0.18
    });
  }

  update(dt) {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.alpha = p.life / p.maxLife;
    }

    // 2. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
      t.alpha = t.life / t.maxLife;
    }

    // 3. Update slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // 4. Update Animated VFX Spritesheets
    for (let i = this.animatedVFX.length - 1; i >= 0; i--) {
      const v = this.animatedVFX[i];
      v.timer += dt;
      if (v.timer >= v.duration) {
        this.animatedVFX.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    // 1. Slashes (Blade trails)
    for (const s of this.slashes) {
      if (!camera.isInView(s.x, s.y, s.radius + 20)) continue;
      const progress = 1 - (s.life / s.maxLife);
      const alpha = 1 - progress;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      ctx.strokeStyle = s.color;
      ctx.lineWidth = 6 * (1 - progress);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, -s.arcWidth / 2, s.arcWidth / 2);
      ctx.stroke();

      // Inner blade glow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * (1 - progress);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Particles
    for (const p of this.particles) {
      if (!camera.isInView(p.x, p.y, 20)) continue;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }

    // 3. Animated VFX Spritesheets (Lightning strikes, Magic explosions)
    for (const v of this.animatedVFX) {
      if (!camera.isInView(v.x, v.y, 80)) continue;

      if (v.type === 'lightning') {
        const frame = Math.min(5, Math.floor((v.timer / v.duration) * 6));
        if (this.lightningSheet.complete && this.lightningSheet.naturalWidth) {
          // Draw lightning bolt coming down from sky (width 48, height 96)
          ctx.save();
          ctx.drawImage(
            this.lightningSheet,
            frame * 32, 0, 32, 64, // Source frame
            v.x - 24, v.y - 82, 48, 96 // Centered on target, base strikes ground
          );
          ctx.restore();
        }
      } else if (v.type === 'magic_explosion') {
        // Frames 2 to 5 for explosion ripple
        const frame = Math.min(3, Math.floor((v.timer / v.duration) * 4)) + 2;
        if (this.bombSheet.complete && this.bombSheet.naturalWidth) {
          const r = v.radius || 54;
          ctx.save();
          ctx.drawImage(
            this.bombSheet,
            frame * 32, 0, 32, 32,
            v.x - r, v.y - r, r * 2, r * 2
          );
          ctx.restore();
        }
      }
    }

    // 4. Floating Damage Numbers
    for (const t of this.floatingTexts) {
      if (!camera.isInView(t.x, t.y, 40)) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `${t.isCrit ? 'bold ' : ''}${Math.round(t.fontSize)}px Cinzel, sans-serif`;
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = t.isCrit ? 4 : 3;
      ctx.strokeText(t.text, t.x, t.y);

      // Fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    ctx.globalAlpha = 1.0;
  }
}
