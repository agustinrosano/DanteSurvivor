// ============================================================================
// DANTE QUEST — Enhanced Dynamic Lighting, Colored Auras & Projectile Glow
// ============================================================================

import { MAPS } from '../systems/Maps.js';

export class LightingSystem {
  constructor() {
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
    this.ambientDarkness = 0.85; // Atmospheric dark fantasy fog
  }

  resize(width, height) {
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
  }

  render(ctx, camera, player, torches, isDungeon = false, projectiles = [], particles = [], mapId = 'bosque') {
    const w = this.lightCanvas.width;
    const h = this.lightCanvas.height;
    if (w === 0 || h === 0) return;

    const lCtx = this.lightCtx;
    const isLimbo = mapId === 'limbo';
    const theme = MAPS[mapId]?.terrain;

    // 1. Fill light canvas with dark gothic ambient fog
    lCtx.clearRect(0, 0, w, h);
    if (theme) {
      lCtx.fillStyle = isDungeon ? theme.dungeonFog : theme.fog;
    } else if (isLimbo) {
      lCtx.fillStyle = isDungeon ? 'rgba(8, 4, 16, 0.96)' : 'rgba(10, 6, 22, 0.88)';
    } else {
      lCtx.fillStyle = isDungeon ? 'rgba(5, 3, 10, 0.95)' : `rgba(7, 5, 11, ${this.ambientDarkness})`;
    }
    lCtx.fillRect(0, 0, w, h);

    // 2. Cut out radial lights using destination-out
    lCtx.globalCompositeOperation = 'destination-out';

    // A. Player Torchlight / Aura
    if (player) {
      const pScreen = camera.worldToScreen(player.x, player.y);
      const playerRadius = (player.skillActiveDuration > 0 ? 230 : 180) * camera.zoom;
      this.drawRadialLight(lCtx, pScreen.x, pScreen.y, playerRadius);
    }

    // B. World Torches & Braziers with flickering
    for (const torch of torches) {
      if (camera.isInView(torch.x, torch.y, torch.lightRadius || 190)) {
        const tScreen = camera.worldToScreen(torch.x, torch.y);
        const radius = (torch.lightRadius || 190) * camera.zoom;
        const flicker = radius + Math.sin(Date.now() * 0.009 + torch.x) * 8;
        this.drawRadialLight(lCtx, tScreen.x, tScreen.y, flicker);
      }
    }

    // C. Flying Magic Projectiles illumination (Fireballs, Lightning, Boss Orbs)
    for (const p of projectiles) {
      if (camera.isInView(p.x, p.y, 80)) {
        const pScreen = camera.worldToScreen(p.x, p.y);
        const radius = (p.type === 'fireball' ? 95 : (p.type === 'boss_orb' ? 85 : 55)) * camera.zoom;
        this.drawRadialLight(lCtx, pScreen.x, pScreen.y, radius);
      }
    }

    // Reset composite operation
    lCtx.globalCompositeOperation = 'source-over';

    // 3. Draw dark lighting mask onto main canvas
    ctx.drawImage(this.lightCanvas, 0, 0);

    // 4. Color Glow Overlay (additive blend for rich embers or astral glow)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Torch amber glows (or ethereal cyan/purple in Limbo)
    for (const torch of torches) {
      if (camera.isInView(torch.x, torch.y, 140)) {
        const tScreen = camera.worldToScreen(torch.x, torch.y);
        const warmRadius = 110 * camera.zoom;
        const grad = ctx.createRadialGradient(tScreen.x, tScreen.y, 0, tScreen.x, tScreen.y, warmRadius);
        if (theme) {
          grad.addColorStop(0, theme.glow);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (isLimbo) {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.32)');
          grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.14)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          grad.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
          grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tScreen.x, tScreen.y, warmRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Projectile fiery or arcane glow
    for (const p of projectiles) {
      if (camera.isInView(p.x, p.y, 60)) {
        const pScreen = camera.worldToScreen(p.x, p.y);
        const glowRadius = (p.type === 'fireball' ? 65 : 45) * camera.zoom;
        const grad = ctx.createRadialGradient(pScreen.x, pScreen.y, 0, pScreen.x, pScreen.y, glowRadius);
        if (p.type === 'fireball') {
          grad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (p.type === 'boss_orb') {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pScreen.x, pScreen.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Screen Vignette (dark borders for cinematic focus)
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.7);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }

  drawRadialLight(ctx, x, y, radius) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(0.75, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
