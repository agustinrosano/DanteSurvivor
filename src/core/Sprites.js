// ============================================================================
// DANTE QUEST — Pixel-art Sprite Registry (PixelLab assets)
// ----------------------------------------------------------------------------
// Layout on disk (public/assets/sprites/<category>/<id>/):
//   <direction>.png                       -> static rotation (idle)
//   <anim>/<direction>/<frame>.png        -> animation frames (0.png, 1.png...)
// ============================================================================

const BASE = '/assets/sprites';

export const DIRECTIONS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
const ALL8 = DIRECTIONS;

const MIRROR = {
  east: 'west', west: 'east',
  'south-east': 'south-west', 'south-west': 'south-east',
  'north-east': 'north-west', 'north-west': 'north-east',
  south: 'south', north: 'north'
};

export const SPRITE_MANIFEST = {
  // --- Heroes --------------------------------------------------------------
  'heroes/dante': {
    size: 68,
    anchorY: 0.80,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south', 'east', 'north'], frames: 8, fps: 10, loop: true },
      attack: { dirs: ['south', 'east'], frames: 9, fps: 18, loop: false }
    }
  },
  'heroes/thorin': {
    size: 68,
    anchorY: 0.80,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south'], frames: 8, fps: 8, loop: true },
      attack: { dirs: ['south'], frames: 9, fps: 16, loop: false }
    }
  },
  'heroes/lyra': {
    size: 68,
    anchorY: 0.80,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south'], frames: 8, fps: 8, loop: true },
      attack: { dirs: ['south'], frames: 9, fps: 16, loop: false }
    }
  },
  'heroes/kael': {
    size: 68,
    anchorY: 0.80,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south'], frames: 8, fps: 8, loop: true },
      attack: { dirs: ['south'], frames: 9, fps: 16, loop: false }
    }
  },
  'heroes/morgana': {
    size: 68,
    anchorY: 0.80,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south'], frames: 8, fps: 8, loop: true },
      attack: { dirs: ['south'], frames: 9, fps: 16, loop: false }
    }
  },

  // --- Enemies -------------------------------------------------------------
  'enemies/zombie': {
    size: 68,
    anchorY: 0.80,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south'], frames: 8, fps: 8, loop: true }
    }
  },
  'enemies/skeleton': {
    size: 68,
    anchorY: 0.80,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south'], frames: 8, fps: 8, loop: true }
    }
  },
  'enemies/knight': {
    size: 68,
    anchorY: 0.80,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south'], frames: 8, fps: 8, loop: true }
    }
  },
  'enemies/wolf': { size: 68, anchorY: 0.80, rotations: ALL8, anims: {} },
  'enemies/wraith': { size: 68, anchorY: 0.80, rotations: ALL8, anims: {} },

  'boss/mounted_knight': {
    size: 136,
    anchorY: 0.85,
    rotations: ALL8,
    anims: {
      walk: { dirs: ['south'], frames: 8, fps: 8, loop: true }
    }
  }
};

class SpriteEntry {
  constructor(key, def) {
    this.key = key;
    this.def = def;
    this.rotations = {}; // dir -> Image
    this.anims = {}; // name -> { dir -> Image[] }
    for (const dir of def.rotations || []) {
      this.rotations[dir] = loadImage(`${BASE}/${key}/${dir}.png`);
    }
    for (const [name, a] of Object.entries(def.anims || {})) {
      this.anims[name] = {};
      for (const dir of a.dirs) {
        const frames = [];
        for (let i = 0; i < a.frames; i++) {
          frames.push(loadImage(`${BASE}/${key}/${name}/${dir}/${i}.png`));
        }
        this.anims[name][dir] = frames;
      }
    }
  }

  resolve(dir, anim, time) {
    if (anim && this.anims[anim]) {
      const a = this.def.anims[anim];
      const pick = (d) => this.anims[anim][d];
      let frames = pick(dir);
      let flip = false;
      if (!frames) {
        frames = pick(MIRROR[dir]);
        flip = !!frames;
      }
      if (!frames) {
        const h = dir.includes('east') ? 'east' : dir.includes('west') ? 'west' : null;
        if (h) {
          frames = pick(h);
          if (!frames) { frames = pick(MIRROR[h]); flip = !!frames; }
        }
      }
      if (!frames) {
        const availableDirs = Object.keys(this.anims[anim]);
        if (availableDirs.length > 0) {
          const fallbackDir = availableDirs.includes('south') ? 'south' : availableDirs[0];
          frames = this.anims[anim][fallbackDir];
          if (dir.includes('west')) flip = true;
        }
      }
      if (frames && frames.length > 0) {
        const idx = a.loop === false
          ? Math.min(frames.length - 1, Math.floor(time * a.fps))
          : Math.floor(time * a.fps) % frames.length;
        const img = frames[idx];
        if (img && img.complete && img.naturalWidth) return { img, flip };
      }
    }
    let img = this.rotations[dir];
    let flip = false;
    if (!img || !img.naturalWidth) {
      img = this.rotations[MIRROR[dir]];
      flip = true;
    }
    if (!img || !img.naturalWidth) {
      const rotDirs = Object.keys(this.rotations);
      if (rotDirs.length > 0) {
        const fb = rotDirs.includes('south') ? 'south' : rotDirs[0];
        img = this.rotations[fb];
        if (dir.includes('west')) flip = true;
      }
    }
    if (img && img.complete && img.naturalWidth) return { img, flip };
    return null;
  }
}

const imageCache = new Map();
function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

const entries = new Map();
export function getSprite(key) {
  if (!SPRITE_MANIFEST[key]) return null;
  if (!entries.has(key)) entries.set(key, new SpriteEntry(key, SPRITE_MANIFEST[key]));
  return entries.get(key);
}

export function directionFromVector(x, y, fallback = 'south') {
  if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) return fallback;
  const angle = Math.atan2(y, x);
  const idx = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
  return DIRECTIONS[idx];
}

let tintCanvas = null;
let tintCtx = null;

export function drawSprite(ctx, key, x, y, { dir = 'south', anim = null, time = 0, tint = null, scale = 1 } = {}) {
  const entry = getSprite(key);
  if (!entry) return false;
  const res = entry.resolve(dir, anim, time);
  if (!res) return false;

  const { img, flip } = res;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const anchorY = entry.def.anchorY ?? 0.8;

  let source = img;
  if (tint) {
    if (!tintCanvas) {
      tintCanvas = document.createElement('canvas');
      tintCtx = tintCanvas.getContext('2d');
    }
    tintCanvas.width = img.naturalWidth;
    tintCanvas.height = img.naturalHeight;
    tintCtx.clearRect(0, 0, tintCanvas.width, tintCanvas.height);
    tintCtx.globalCompositeOperation = 'source-over';
    tintCtx.drawImage(img, 0, 0);
    tintCtx.globalCompositeOperation = 'source-atop';
    tintCtx.fillStyle = tint;
    tintCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
    source = tintCanvas;
  }

  ctx.save();
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(source, Math.round(-w / 2), Math.round(-h * anchorY), w, h);
  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.restore();
  return true;
}
