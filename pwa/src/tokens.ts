// WhimprFlow PWA design tokens.
//
// Every token's *value* is a CSS custom property reference, not a literal. The
// actual colors, fonts and radii are written onto :root by lib/theme.ts from the
// definitions in themes.ts. That indirection is what makes the theme picker
// possible without touching the ~170 style call sites across the app: a
// component asking for `c.bg` gets `var(--wf-bg)`, which resolves to whatever
// world the user is currently in.
//
// Add a token here only alongside a value for it in EVERY theme (themes.ts has a
// exhaustive type that will fail the build otherwise) — a missing custom
// property resolves to nothing, which silently renders transparent.

// Semantic color roles. See themes.ts for each world's actual palette.
export const c = {
  bg: "var(--wf-bg)", // app ground
  bgDeep: "var(--wf-bg-deep)", // recessed wells (textarea, chart floor)
  surface: "var(--wf-surface)", // raised panels
  surfaceHi: "var(--wf-surface-hi)", // pressed / active chips
  line: "var(--wf-line)", // hairline dividers & borders
  lineHi: "var(--wf-line-hi)", // stronger borders

  textHi: "var(--wf-text-hi)", // headlines
  text: "var(--wf-text)", // body
  textDim: "var(--wf-text-dim)", // secondary
  textMute: "var(--wf-text-mute)", // captions / labels

  accent: "var(--wf-accent)", // live / primary
  accentHi: "var(--wf-accent-hi)", // accent highlight
  accentDeep: "var(--wf-accent-deep)", // accent pressed
  onAccent: "var(--wf-on-accent)", // ink on accent

  warm: "var(--wf-warm)", // streak / attention
  warmDeep: "var(--wf-warm-deep)",

  error: "var(--wf-error)",
  success: "var(--wf-success)",
} as const;

// Type scale — 1.28 ratio. Sizes are fixed across themes; only the faces change.
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

// Radii are themed: Bikini is all pills, Cascade is nearly square.
export const radius = {
  sm: "var(--wf-radius-sm)",
  md: "var(--wf-radius-md)",
  lg: "var(--wf-radius-lg)",
  pill: 999,
} as const;

export const font = {
  ui: "var(--wf-font-ui)",
  serif: "var(--wf-font-display)",
  mono: "var(--wf-font-mono)",
} as const;

// State-transition easing. Themed: Cascade is instant, Bikini overshoots.
export const ease = "var(--wf-ease)" as const;

// ── Backward-compatible aliases (legacy `palette` shape) ─────────────────────
// Older components referenced palette.slateXXX / accentXXX; map them onto the
// semantic roles so the whole app resolves.
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
  accentGlow: "var(--wf-accent-glow)",

  pillText: c.text,
  pillTextMuted: c.textMute,
  waveBar: c.accentHi,

  error: c.error,
  warn: c.warm,
  info: "var(--wf-info)",
  success: c.success,
} as const;

export const motion = { ease } as const;
