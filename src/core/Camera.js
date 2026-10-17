// ============================================================================
// DANTE QUEST — Camera System with Smooth Tracking, Zoom & Screen Shake
// ============================================================================

export class Camera {
  constructor(viewportWidth = 800, viewportHeight = 600) {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.zoom = 1.0;
    this.lerpSpeed = 8.0;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  resize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Responsive zoom: closer on smaller mobile screens, wider on desktop
    if (width < 768) {
      this.zoom = 1.15;
    } else {
      this.zoom = 1.0;
    }
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  shake(intensity = 8, duration = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(dt) {
    // Smooth lerp to target
    this.x += (this.targetX - this.x) * Math.min(1.0, this.lerpSpeed * dt);
    this.y += (this.targetY - this.y) * Math.min(1.0, this.lerpSpeed * dt);

    // Screen shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.shakeIntensity;
      this.shakeOffsetX = Math.cos(angle) * dist;
      this.shakeOffsetY = Math.sin(angle) * dist;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - 20 * dt);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeIntensity = 0;
    }
  }

  applyTransform(ctx) {
    ctx.save();
    // Center on screen
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x - this.shakeOffsetX, -this.y - this.shakeOffsetY);
  }

  restoreTransform(ctx) {
    ctx.restore();
  }

  worldToScreen(wx, wy) {
    const cx = (wx - (this.x + this.shakeOffsetX)) * this.zoom + this.viewportWidth / 2;
    const cy = (wy - (this.y + this.shakeOffsetY)) * this.zoom + this.viewportHeight / 2;
    return { x: cx, y: cy };
  }

  screenToWorld(sx, sy) {
    const wx = (sx - this.viewportWidth / 2) / this.zoom + this.x + this.shakeOffsetX;
    const wy = (sy - this.viewportHeight / 2) / this.zoom + this.y + this.shakeOffsetY;
    return { x: wx, y: wy };
  }

  isInView(wx, wy, radius = 50) {
    const margin = radius + 60;
    const halfW = (this.viewportWidth / 2) / this.zoom + margin;
    const halfH = (this.viewportHeight / 2) / this.zoom + margin;
    return (
      wx >= this.x - halfW &&
      wx <= this.x + halfW &&
      wy >= this.y - halfH &&
      wy <= this.y + halfH
    );
  }
}
