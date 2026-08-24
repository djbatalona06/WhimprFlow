// Generate WhimprFlow PWA icons as compact flat-color PNGs (no deps).
// Aqua rounded-square ground + dark slate microphone glyph. Flat palette keeps
// the PNGs tiny so they can be inlined into a Vercel deploy payload.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../public/icons");
fs.mkdirSync(OUT, { recursive: true });

// Palette (sRGB approximations of the OKLCH brand tokens).
const AQUA = [63, 224, 208];
const INK = [18, 24, 33];
const TRANSPARENT = [0, 0, 0, 0];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, px) {
  // px: Uint8ClampedArray RGBA length size*size*4
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Supersample 2x for smooth edges, then box-downsample.
function render(size) {
  const S = size * 2;
  const buf = Buffer.alloc(S * S * 4);
  const R = S * 0.22; // corner radius
  const cx = S / 2;
  const micW = S * 0.16;
  const micTop = S * 0.3;
  const micH = S * 0.28;
  const micR = micW / 2;
  const armR = S * 0.19; // stand arc radius
  const armY = S * 0.5;
  const stemTop = armY + armR;
  const stemBot = S * 0.76;
  const stroke = S * 0.035;

  const set = (buf2, x, y, S2, col) => {
    const i = (y * S2 + x) * 4;
    buf2[i] = col[0];
    buf2[i + 1] = col[1];
    buf2[i + 2] = col[2];
    buf2[i + 3] = col[3] ?? 255;
  };
  const inRoundedRect = (x, y, x0, y0, x1, y1, r) => {
    const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
    const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
    return dx * dx + dy * dy <= r * r || (x >= x0 && x <= x1 && (y >= y0 + r && y <= y1 - r)) || (y >= y0 && y <= y1 && (x >= x0 + r && x <= x1 - r));
  };

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let col = TRANSPARENT;
      // Ground: rounded square.
      if (inRoundedRect(x, y, 0, 0, S - 1, S - 1, R)) col = AQUA;
      if (col === AQUA) {
        // Mic capsule.
        if (inRoundedRect(x, y, cx - micW / 2, micTop, cx + micW / 2, micTop + micH, micR)) col = INK;
        // Stand arc (ring segment, lower half).
        const dx = x - cx;
        const dy = y - armY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dy > 0 && Math.abs(dist - armR) < stroke) col = INK;
        // Stem.
        if (Math.abs(x - cx) < stroke && y > stemTop - 1 && y < stemBot) col = INK;
        // Base foot.
        if (inRoundedRect(x, y, cx - micW * 0.55, stemBot - stroke, cx + micW * 0.55, stemBot + stroke, stroke)) col = INK;
      }
      set(buf, x, y, S, col);
    }
  }

  // Downsample 2x -> size (box filter).
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const i = ((y * 2 + dy) * S + (x * 2 + dx)) * 4;
          const al = buf[i + 3];
          r += buf[i] * al;
          g += buf[i + 1] * al;
          b += buf[i + 2] * al;
          a += al;
        }
      }
      const o = (y * size + x) * 4;
      if (a === 0) {
        out[o + 3] = 0;
      } else {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
        out[o + 3] = Math.round(a / 4);
      }
    }
  }
  return out;
}

for (const [name, size] of [
  ["icon-512.png", 512],
  ["icon-192.png", 192],
  ["apple-touch-icon.png", 180],
  ["favicon.png", 64],
]) {
  const png = encodePNG(size, render(size));
  fs.writeFileSync(path.join(OUT, name), png);
  console.log(`${name}\t${png.length} bytes`);
}
