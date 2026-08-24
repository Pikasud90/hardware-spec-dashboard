#!/usr/bin/env node
/**
 * Generates the application icon with zero image dependencies.
 *
 * The mark is rasterised from signed-distance fields (which gives clean
 * anti-aliased edges without supersampling) and encoded straight to PNG using
 * only `node:zlib`. Run with `node scripts/generate-icons.mjs`.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SIZE = 1024;

/* ----------------------------------------------------------------- geometry */

/** Signed distance to a rounded rectangle centred at (cx, cy). */
function sdRoundRect(px, py, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(px - cx) - (halfW - r);
  const qy = Math.abs(py - cy) - (halfH - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

/** Convert a signed distance into a 0..1 coverage value (1px feather). */
function coverage(d) {
  return Math.min(1, Math.max(0, 0.5 - d));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hex(value) {
  const n = parseInt(value.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* --------------------------------------------------------------- compositor */

const buffer = new Float32Array(SIZE * SIZE * 4);

/** Alpha-over composite of a flat colour, masked by `alphaAt(x, y)`. */
function paint(colorAt, alphaAt) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const a = alphaAt(x + 0.5, y + 0.5);
      if (a <= 0) continue;
      const [r, g, b] = colorAt(x + 0.5, y + 0.5);
      const i = (y * SIZE + x) * 4;
      const dst = buffer[i + 3];
      const out = a + dst * (1 - a);
      if (out <= 0) continue;
      buffer[i] = (r * a + buffer[i] * dst * (1 - a)) / out;
      buffer[i + 1] = (g * a + buffer[i + 1] * dst * (1 - a)) / out;
      buffer[i + 2] = (b * a + buffer[i + 2] * dst * (1 - a)) / out;
      buffer[i + 3] = out;
    }
  }
}

const INK_TOP = hex("#101d36");
const INK_BOTTOM = hex("#05070d");
const CYAN = hex("#22d3ee");
const EMERALD = hex("#34d399");
const VIOLET = hex("#a78bfa");
const SLATE = hex("#243247");

const C = SIZE / 2;

// 1. Rounded-square base plate with a vertical gradient.
paint(
  (_x, y) => {
    const t = y / SIZE;
    return [
      lerp(INK_TOP[0], INK_BOTTOM[0], t),
      lerp(INK_TOP[1], INK_BOTTOM[1], t),
      lerp(INK_TOP[2], INK_BOTTOM[2], t),
    ];
  },
  (x, y) => coverage(sdRoundRect(x, y, C, C, 500, 500, 224)),
);

// 2. Hairline bezel so the mark reads against dark docks and taskbars.
paint(
  () => SLATE,
  (x, y) => {
    const d = sdRoundRect(x, y, C, C, 496, 496, 220);
    return coverage(Math.abs(d) - 2.5);
  },
);

// 3. Die package outline — the "chip" silhouette.
paint(
  (_x, y) => {
    const t = Math.min(1, Math.max(0, (y - 250) / 520));
    return [lerp(CYAN[0], VIOLET[0], t), lerp(CYAN[1], VIOLET[1], t), lerp(CYAN[2], VIOLET[2], t)];
  },
  (x, y) => {
    const d = sdRoundRect(x, y, C, C, 288, 288, 56);
    return coverage(Math.abs(d) - 9);
  },
);

// 4. Package pins along all four edges.
const PIN_OFFSETS = [-186, -62, 62, 186];
paint(
  () => SLATE,
  (x, y) => {
    let a = 0;
    for (const o of PIN_OFFSETS) {
      a = Math.max(a, coverage(sdRoundRect(x, y, C + o, C - 336, 26, 48, 13)));
      a = Math.max(a, coverage(sdRoundRect(x, y, C + o, C + 336, 26, 48, 13)));
      a = Math.max(a, coverage(sdRoundRect(x, y, C - 336, C + o, 48, 26, 13)));
      a = Math.max(a, coverage(sdRoundRect(x, y, C + 336, C + o, 48, 26, 13)));
    }
    return a;
  },
);

// 5. Comparison bars inside the die: the analytical half of the product.
const BARS = [
  { dx: -132, h: 108, color: SLATE },
  { dx: -44, h: 168, color: CYAN },
  { dx: 44, h: 236, color: EMERALD },
  { dx: 132, h: 300, color: VIOLET },
];
for (const bar of BARS) {
  const baseline = C + 196;
  paint(
    () => bar.color,
    (x, y) =>
      coverage(sdRoundRect(x, y, C + bar.dx, baseline - bar.h / 2, 32, bar.h / 2, 24)),
  );
}

/* ------------------------------------------------------------ PNG encoding */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([len, typed, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const rgba = Buffer.alloc(SIZE * SIZE * 4);
for (let i = 0; i < SIZE * SIZE; i++) {
  rgba[i * 4] = Math.round(Math.min(255, Math.max(0, buffer[i * 4])));
  rgba[i * 4 + 1] = Math.round(Math.min(255, Math.max(0, buffer[i * 4 + 1])));
  rgba[i * 4 + 2] = Math.round(Math.min(255, Math.max(0, buffer[i * 4 + 2])));
  rgba[i * 4 + 3] = Math.round(Math.min(255, Math.max(0, buffer[i * 4 + 3] * 255)));
}

const png = encodePng(SIZE, SIZE, rgba);
for (const target of ["build/icon.png", "public/icon.png"]) {
  const out = resolve(process.cwd(), target);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log(`wrote ${target} (${SIZE}x${SIZE}, ${(png.length / 1024).toFixed(1)} KB)`);
}
