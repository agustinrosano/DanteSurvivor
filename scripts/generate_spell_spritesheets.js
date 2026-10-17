import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, getPixel) {
  // getPixel(x, y) -> [r, g, b, a] (0-255)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crcTarget = buf.subarray(4, 8 + len);
  const crc = crc32(crcTarget);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Ensure vfx folder exists
fs.mkdirSync('public/assets/sprites/vfx', { recursive: true });

// 1. Generate Arcane Missile Spritesheet (192x32 -> 6 frames of 32x32)
const missilePNG = createPNG(192, 32, (x, y) => {
  const frameIdx = Math.floor(x / 32);
  const fx = x % 32;
  const fy = y;

  const cx = 20;
  const cy = 16;
  const phase = (frameIdx / 6) * Math.PI * 2;

  // Swirling comet tail
  const tailDx = cx - fx;
  const tailDy = cy - fy;
  const dist = Math.hypot(fx - cx, fy - cy);

  // Core energy
  if (dist <= 3) {
    return [255, 255, 255, 255]; // Pure white core
  }
  if (dist <= 5.5) {
    return [103, 232, 249, 255]; // Bright cyan
  }
  if (dist <= 8.5) {
    return [6, 182, 212, 230]; // Cyan aura
  }
  if (dist <= 11) {
    return [30, 58, 138, 160]; // Deep astral blue border
  }

  // Wavy spirit tail to the left (fx < cx)
  if (fx < cx && fx > 2) {
    const progress = (cx - fx) / (cx - 2); // 0 at head, 1 at tail tip
    const wave = Math.sin(progress * 7 + phase) * (3.5 * progress);
    const wave2 = Math.cos(progress * 5 - phase * 1.5) * (2 * progress);
    const targetY = cy + wave;
    const dy = Math.abs(fy - targetY);
    const tailWidth = (1 - progress * 0.7) * 4;

    if (dy <= tailWidth) {
      const alpha = Math.max(0, Math.min(255, Math.floor((1 - progress * 0.85) * 240)));
      if (dy <= 1.5) {
        return [165, 243, 252, alpha]; // Cyan-white inner flame
      } else if (dy <= 3) {
        return [14, 165, 233, alpha]; // Celestial blue
      } else {
        return [147, 51, 234, Math.floor(alpha * 0.6)]; // Purple fringe
      }
    }
  }

  // Orbiting sparkles
  for (let s = 0; s < 3; s++) {
    const sAngle = phase * 2 + (s * Math.PI * 2) / 3;
    const sx = Math.round(cx + Math.cos(sAngle) * (8 + s * 2));
    const sy = Math.round(cy + Math.sin(sAngle) * (5 + s));
    if (Math.abs(fx - sx) <= 1 && Math.abs(fy - sy) <= 1) {
      return [255, 255, 255, 220];
    }
  }

  return [0, 0, 0, 0];
});

fs.writeFileSync('public/assets/sprites/vfx/arcane_missile_sheet.png', missilePNG);
console.log('arcane_missile_sheet.png generated (192x32, 6 frames)');

// 2. Generate Fireball Spritesheet (192x32 -> 6 frames of 32x32)
const fireballPNG = createPNG(192, 32, (x, y) => {
  const frameIdx = Math.floor(x / 32);
  const fx = x % 32;
  const fy = y;

  const cx = 20;
  const cy = 16;
  const phase = (frameIdx / 6) * Math.PI * 2;
  const dist = Math.hypot(fx - cx, fy - cy);

  // Flame core
  if (dist <= 3.5) {
    return [254, 240, 138, 255]; // Yellow-white core
  }
  if (dist <= 6) {
    return [249, 115, 22, 255]; // Intense orange
  }
  if (dist <= 9) {
    return [220, 38, 38, 230]; // Deep red
  }
  if (dist <= 11) {
    return [69, 10, 10, 160]; // Dark char outline
  }

  // Licking flame tail to the left
  if (fx < cx && fx > 1) {
    const progress = (cx - fx) / (cx - 1);
    const flick1 = Math.sin(progress * 8 + phase * 2) * (4 * progress);
    const flick2 = Math.cos(progress * 6 - phase) * (3 * progress);
    const targetY1 = cy + flick1;
    const targetY2 = cy - 2 + flick2;

    const dy1 = Math.abs(fy - targetY1);
    const dy2 = Math.abs(fy - targetY2);

    const minDy = Math.min(dy1, dy2);
    const flameW = (1 - progress * 0.6) * 4.5;

    if (minDy <= flameW) {
      const alpha = Math.max(0, Math.min(255, Math.floor((1 - progress * 0.9) * 255)));
      if (minDy <= 1.2) {
        return [253, 224, 71, alpha]; // Bright yellow
      } else if (minDy <= 2.5) {
        return [234, 88, 12, alpha]; // Orange
      } else {
        return [185, 28, 28, Math.floor(alpha * 0.8)]; // Crimson smoke
      }
    }
  }

  // Embers popping off
  const emberX = Math.round(cx - 10 - Math.sin(phase) * 6);
  const emberY = Math.round(cy + Math.cos(phase * 1.5) * 8);
  if (Math.abs(fx - emberX) <= 1 && Math.abs(fy - emberY) <= 1) {
    return [254, 240, 138, 200];
  }

  return [0, 0, 0, 0];
});

fs.writeFileSync('public/assets/sprites/vfx/fireball_sheet.png', fireballPNG);
console.log('fireball_sheet.png generated (192x32, 6 frames)');
