// Fails the build if any theme's text or accent falls below WCAG AA against its
// own ground. Five palettes across two ground polarities is exactly the kind of
// thing that quietly regresses, so it is checked rather than eyeballed.
//
// Parses the OKLCH literals in src/themes.ts, converts to sRGB, and computes
// contrast ratios the same way a browser does.

import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("../src/themes.ts", import.meta.url), "utf8");

function oklchToSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;

  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((v) => Math.min(1, Math.max(0, v)));
}

/** WCAG relative luminance from linear-light sRGB. */
const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function parseOklch(str) {
  const m = str.match(/oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return null;
  return oklchToSrgb(Number(m[1]) / 100, Number(m[2]), Number(m[3]));
}

// Pull each `const <name>: Theme = { ... palette: { ... } ... }` block.
const themes = [];
const paletteRe = /(\w+)\s*:\s*Theme\s*=\s*\{[\s\S]*?palette:\s*\{([\s\S]*?)\n  \}/g;
let match;
while ((match = paletteRe.exec(SRC))) {
  const entries = {};
  for (const line of match[2].split("\n")) {
    const kv = line.match(/(\w+)\s*:\s*"([^"]+)"/);
    if (kv) entries[kv[1]] = kv[2];
  }
  themes.push({ name: match[1], palette: entries });
}

// The Kakashi variant overrides a subset; check it against its own ground too.
const kakashiBlock = SRC.match(/KAKASHI_PALETTE[^{]*\{([\s\S]*?)\n\};/);
if (kakashiBlock) {
  const base = themes.find((t) => t.name === "shinobiBase");
  if (base) {
    const overrides = {};
    for (const line of kakashiBlock[1].split("\n")) {
      const kv = line.match(/(\w+)\s*:\s*"([^"]+)"/);
      if (kv) overrides[kv[1]] = kv[2];
    }
    themes.push({ name: "shinobi(kakashi)", palette: { ...base.palette, ...overrides } });
  }
}

// role -> minimum ratio against the theme's own ground.
const RULES = [
  ["textHi", 4.5], ["text", 4.5], ["textDim", 4.5], ["textMute", 4.5],
  ["accent", 3], ["warm", 4.5], ["error", 4.5],
];

let failures = 0;
for (const { name, palette } of themes) {
  const bg = parseOklch(palette.bg);
  if (!bg) continue;
  for (const [role, min] of RULES) {
    const fg = parseOklch(palette[role]);
    if (!fg) continue;
    const ratio = contrast(fg, bg);
    if (ratio < min) {
      console.error(
        `FAIL ${name}.${role}: ${ratio.toFixed(2)}:1 against bg (needs ${min}:1) — ${palette[role]}`,
      );
      failures += 1;
    }
  }
  // Ink on the accent fill must be legible too (buttons, the record control).
  const onAccent = parseOklch(palette.onAccent);
  const accent = parseOklch(palette.accent);
  if (onAccent && accent) {
    const ratio = contrast(onAccent, accent);
    if (ratio < 4.5) {
      console.error(`FAIL ${name}.onAccent: ${ratio.toFixed(2)}:1 on accent (needs 4.5:1)`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} contrast failure(s) across ${themes.length} palettes.`);
  process.exit(1);
}
console.log(`Contrast OK — ${themes.length} palettes clear WCAG AA.`);
