// WhimprFlow PWA design tokens.
//
// Committed dark theme, justified by scene: someone pulling out their phone
// mid-thought — in a meeting, on a walk, in bed at night — to capture and clean a
// spoken idea in seconds. Neutrals are tinted toward the slate/aqua brand hue in
// OKLCH (no pure black/white); aqua is a *structural* signal reserved for the live
// capture state, and a warm amber carries streak/attention so the app is never
// mono-teal.

// Semantic color roles (OKLCH: lightness chroma hue).
export const c = {
  bg: "oklch(15.5% 0.012 245)", // app ground
  bgDeep: "oklch(12.5% 0.012 248)", // recessed wells (textarea, chart floor)
  surface: "oklch(20% 0.014 244)", // raised panels
  surfaceHi: "oklch(24.5% 0.016 244)", // pressed / active chips
  line: "oklch(29% 0.016 244)", // hairline dividers & borders
  lineHi: "oklch(38% 0.02 242)", // stronger borders

  textHi: "oklch(97% 0.006 230)", // headlines
  text: "oklch(91% 0.01 232)", // body
  textDim: "oklch(74% 0.018 234)", // secondary
  textMute: "oklch(60% 0.02 240)", // captions / labels

  accent: "oklch(80% 0.135 188)", // aqua — live/primary
  accentHi: "oklch(87% 0.14 184)", // aqua highlight
  accentDeep: "oklch(66% 0.12 192)", // aqua pressed
  onAccent: "oklch(20% 0.03 244)", // ink on aqua

  warm: "oklch(82% 0.125 72)", // amber — streak / attention
  warmDeep: "oklch(72% 0.15 55)",

  error: "oklch(68% 0.17 24)",
  success: "oklch(80% 0.135 188)",
} as const;

// Type scale — 1.28 ratio, display in Fraunces, body in Inter.
export const type = {
  display: 34,
  h1: 26,
  h2: 20,
  lg: 17,
  body: 15.5,
  sm: 13.5,
  micro: 11.5,
} as const;

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 } as const;
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

export const font = {
  ui: '"Inter", system-ui, -apple-system, sans-serif',
  serif: '"Fraunces", "Newsreader", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

// Ease-out expo for state transitions (no bounce, no elastic).
export const ease = "cubic-bezier(0.16, 1, 0.3, 1)" as const;

// ── Backward-compatible aliases (legacy `palette` shape) ─────────────────────
// Older components referenced palette.slateXXX / accentXXX; map them onto the new
// semantic roles so the whole app resolves during the refactor.
export const palette = {
  slate950: c.bgDeep,
  slate900: c.bg,
  slate850: c.surface,
  slate800: c.surfaceHi,
  slate700: c.line,
  slate600: c.lineHi,
  slate500: c.textMute,
  slate400: c.textDim,
  slate300: c.textDim,
  slate200: c.text,
  slate100: c.text,
  slate050: c.textHi,

  accent400: c.accentHi,
  accent500: c.accent,
  accent600: c.accentDeep,
  accentGlow: "oklch(80% 0.135 188 / 0.28)",

  pillText: c.text,
  pillTextMuted: c.textMute,
  waveBar: c.accentHi,

  error: c.error,
  warn: c.warm,
  info: "oklch(72% 0.12 245)",
  success: c.success,
} as const;

export const motion = { ease } as const;
