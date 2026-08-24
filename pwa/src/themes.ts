// The five worlds WhimprFlow can wear.
//
// A theme is more than a recolor: each carries its own palette, typeface pairing,
// corner language, easing, hero record control, waveform, ambient chrome, and
// voice. Swapping one should feel like opening a different app that happens to
// know your dictations.
//
// These are ORIGINAL interpretations — palettes, motifs and motion evoking a
// place or a mood. No character artwork, logos or copyrighted assets, so the app
// stays shippable.
//
// Contrast: every palette below is checked to clear WCAG AA (4.5:1) for body,
// dim and mute text against its own ground, and 3:1 for accent-on-ground UI.
// `npm run check:contrast` re-verifies. Do not eyeball a change here.

export type ThemeId = "signature" | "eden" | "cascade" | "bikini" | "shinobi";
export type ShinobiVariant = "itachi" | "kakashi";

/** The hero record control's drawn form. */
export type RecordForm = "rings" | "vine" | "terminal" | "sponge" | "enso";
/** How live audio is drawn while recording. */
export type WaveForm = "bars" | "stem" | "rain" | "bubbles" | "ink";
/** An ambient layer behind the whole app. */
export type Chrome = "none" | "scanlines" | "grain" | "motes" | "sunlight";

/** Every custom property a theme must define. Missing one renders transparent. */
export interface Palette {
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceHi: string;
  line: string;
  lineHi: string;
  textHi: string;
  text: string;
  textDim: string;
  textMute: string;
  accent: string;
  accentHi: string;
  accentDeep: string;
  onAccent: string;
  accentGlow: string;
  warm: string;
  warmDeep: string;
  error: string;
  success: string;
  info: string;
}

export interface ThemeCopy {
  /** Shown under the record button before the first tap. */
  idleTitle: string;
  idleBody: string;
  /** Progress verbs while the two backend hops run. */
  transcribing: string;
  cleaning: string;
  /** History empty state. */
  emptyTitle: string;
  emptyBody: string;
}

export interface Theme {
  id: ThemeId;
  /** Shown in the picker. */
  name: string;
  /** One line on what the world is, shown under the name. */
  blurb: string;
  palette: Palette;
  fonts: { ui: string; display: string; mono: string };
  /** Google Fonts families to load when this theme activates. */
  webFonts: string[];
  radius: { sm: number; md: number; lg: number };
  ease: string;
  record: RecordForm;
  wave: WaveForm;
  chrome: Chrome;
  copy: ThemeCopy;
  /** True for light-ground themes — needed for the browser UI meta color. */
  light?: boolean;
}

const STACK_SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const STACK_SERIF = "Georgia, 'Times New Roman', serif";
const STACK_MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

// ── Signature ────────────────────────────────────────────────────────────────
// The original: someone pulling out their phone mid-thought, in a meeting, on a
// walk, in bed. Slate tinted toward aqua; aqua is structural, reserved for the
// live capture state.
const signature: Theme = {
  id: "signature",
  name: "Signature",
  blurb: "Quiet slate and aqua. The default WhimprFlow.",
  palette: {
    bg: "oklch(15.5% 0.012 245)",
    bgDeep: "oklch(12.5% 0.012 248)",
    surface: "oklch(20% 0.014 244)",
    surfaceHi: "oklch(24.5% 0.016 244)",
    line: "oklch(29% 0.016 244)",
    lineHi: "oklch(38% 0.02 242)",
    textHi: "oklch(97% 0.006 230)",
    text: "oklch(91% 0.01 232)",
    textDim: "oklch(74% 0.018 234)",
    textMute: "oklch(62% 0.02 240)",
    accent: "oklch(80% 0.135 188)",
    accentHi: "oklch(87% 0.14 184)",
    accentDeep: "oklch(66% 0.12 192)",
    onAccent: "oklch(20% 0.03 244)",
    accentGlow: "oklch(80% 0.135 188 / 0.28)",
    warm: "oklch(82% 0.125 72)",
    warmDeep: "oklch(72% 0.15 55)",
    error: "oklch(70% 0.17 24)",
    success: "oklch(80% 0.135 188)",
    info: "oklch(72% 0.12 245)",
  },
  fonts: {
    ui: `"Inter", ${STACK_SANS}`,
    display: `"Fraunces", ${STACK_SERIF}`,
    mono: `"JetBrains Mono", ${STACK_MONO}`,
  },
  webFonts: [
    "Inter:wght@400;500;600;700",
    "Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700",
  ],
  radius: { sm: 10, md: 14, lg: 20 },
  ease: "cubic-bezier(0.16, 1, 0.3, 1)",
  record: "rings",
  wave: "bars",
  chrome: "none",
  copy: {
    idleTitle: "Tap to dictate",
    idleBody:
      "Speak naturally. WhimprFlow strips the ums, fixes the punctuation, and hands back clean text.",
    transcribing: "Transcribing",
    cleaning: "Cleaning up",
    emptyTitle: "No dictations yet",
    emptyBody:
      "Everything you dictate is saved here on this device, ready to copy or send again.",
  },
};

// ── Eden ─────────────────────────────────────────────────────────────────────
// A garden at first light. The only light-ground world: warm parchment, deep
// foliage, gold. Growth is the metaphor — the button unfurls, the waveform is a
// stem putting out leaves as you speak.
const eden: Theme = {
  id: "eden",
  name: "Garden of Eden",
  blurb: "Parchment and foliage. Words grow as you speak them.",
  light: true,
  palette: {
    bg: "oklch(96.5% 0.014 92)",
    bgDeep: "oklch(93% 0.02 90)",
    surface: "oklch(98.5% 0.008 92)",
    surfaceHi: "oklch(91% 0.03 108)",
    line: "oklch(86% 0.025 95)",
    lineHi: "oklch(74% 0.04 100)",
    textHi: "oklch(22% 0.045 145)",
    text: "oklch(30% 0.042 145)",
    textDim: "oklch(38% 0.04 142)",
    textMute: "oklch(46% 0.038 132)",
    accent: "oklch(45% 0.115 150)",
    accentHi: "oklch(53% 0.13 148)",
    accentDeep: "oklch(36% 0.10 152)",
    onAccent: "oklch(97% 0.015 100)",
    accentGlow: "oklch(45% 0.115 150 / 0.18)",
    warm: "oklch(45% 0.14 68)",
    warmDeep: "oklch(38% 0.14 58)",
    error: "oklch(45% 0.19 26)",
    success: "oklch(45% 0.115 150)",
    info: "oklch(45% 0.11 235)",
  },
  fonts: {
    ui: `"Inter", ${STACK_SANS}`,
    display: `"Cormorant Garamond", ${STACK_SERIF}`,
    mono: `"JetBrains Mono", ${STACK_MONO}`,
  },
  webFonts: ["Inter:wght@400;500;600;700", "Cormorant+Garamond:wght@500;600;700"],
  radius: { sm: 12, md: 18, lg: 26 },
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  record: "vine",
  wave: "stem",
  chrome: "sunlight",
  copy: {
    idleTitle: "Speak it into being",
    idleBody:
      "Say what you mean, however it comes out. The tangle gets pruned; the meaning is left standing.",
    transcribing: "Listening",
    cleaning: "Tending",
    emptyTitle: "Nothing planted yet",
    emptyBody: "Everything you dictate takes root here on this device, ready to gather again.",
  },
};

// ── Cascade ──────────────────────────────────────────────────────────────────
// Terminal green on near-black. Everything is monospaced, corners are nearly
// square, motion is instantaneous — no easing, no softness. Glyph rain replaces
// the waveform and a scanline sits over the whole app.
const cascade: Theme = {
  id: "cascade",
  name: "The Matrix",
  blurb: "Phosphor green on black. Your voice, decoded.",
  palette: {
    bg: "oklch(10% 0.012 150)",
    bgDeep: "oklch(6.5% 0.01 150)",
    surface: "oklch(14% 0.016 150)",
    surfaceHi: "oklch(19% 0.024 148)",
    line: "oklch(26% 0.032 148)",
    lineHi: "oklch(36% 0.05 146)",
    textHi: "oklch(92% 0.14 145)",
    text: "oklch(80% 0.145 145)",
    textDim: "oklch(68% 0.13 146)",
    textMute: "oklch(56% 0.10 147)",
    accent: "oklch(84% 0.19 145)",
    accentHi: "oklch(92% 0.20 144)",
    accentDeep: "oklch(66% 0.17 146)",
    onAccent: "oklch(8% 0.02 150)",
    accentGlow: "oklch(84% 0.19 145 / 0.3)",
    warm: "oklch(85% 0.16 100)",
    warmDeep: "oklch(72% 0.15 92)",
    error: "oklch(68% 0.21 25)",
    success: "oklch(84% 0.19 145)",
    info: "oklch(72% 0.12 200)",
  },
  fonts: {
    ui: `"JetBrains Mono", ${STACK_MONO}`,
    display: `"JetBrains Mono", ${STACK_MONO}`,
    mono: `"JetBrains Mono", ${STACK_MONO}`,
  },
  webFonts: ["JetBrains+Mono:wght@400;500;700"],
  radius: { sm: 2, md: 3, lg: 4 },
  ease: "linear",
  record: "terminal",
  wave: "rain",
  chrome: "scanlines",
  copy: {
    idleTitle: "AWAITING INPUT",
    idleBody: "Speak. The signal is captured, stripped of noise, and returned as clean text.",
    transcribing: "DECODING",
    cleaning: "COMPILING",
    emptyTitle: "NO RECORDS",
    emptyBody: "Every transmission is stored locally on this device. Nothing has been logged yet.",
  },
};

// ── Bikini ───────────────────────────────────────────────────────────────────
// Under the sea and relentlessly cheerful. Deep-ocean ground, sunny yellow,
// coral. Everything is round, and it is the one world where motion overshoots —
// the record button squashes, bubbles rise instead of bars.
const bikini: Theme = {
  id: "bikini",
  name: "Bikini Bottom",
  blurb: "Sunny yellow under deep water. Bubbly and loud.",
  palette: {
    bg: "oklch(24% 0.075 245)",
    bgDeep: "oklch(18% 0.07 248)",
    surface: "oklch(30% 0.085 240)",
    surfaceHi: "oklch(37% 0.09 236)",
    line: "oklch(41% 0.08 234)",
    lineHi: "oklch(53% 0.09 230)",
    textHi: "oklch(98% 0.02 100)",
    text: "oklch(93% 0.03 95)",
    textDim: "oklch(83% 0.05 95)",
    textMute: "oklch(72% 0.06 200)",
    accent: "oklch(88% 0.17 95)",
    accentHi: "oklch(94% 0.15 98)",
    accentDeep: "oklch(78% 0.17 88)",
    onAccent: "oklch(22% 0.07 250)",
    accentGlow: "oklch(88% 0.17 95 / 0.32)",
    warm: "oklch(76% 0.16 30)",
    warmDeep: "oklch(66% 0.19 26)",
    error: "oklch(72% 0.19 22)",
    success: "oklch(82% 0.15 165)",
    info: "oklch(80% 0.11 215)",
  },
  fonts: {
    ui: `"Nunito", ${STACK_SANS}`,
    display: `"Baloo 2", ${STACK_SANS}`,
    mono: `"JetBrains Mono", ${STACK_MONO}`,
  },
  webFonts: ["Nunito:wght@400;600;700;800", "Baloo+2:wght@600;700;800"],
  radius: { sm: 16, md: 22, lg: 30 },
  // The one theme that overshoots. Everywhere else this would be a bug.
  ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  record: "sponge",
  wave: "bubbles",
  chrome: "motes",
  copy: {
    idleTitle: "Ready when you are!",
    idleBody: "Just talk. The ums and uhs float away and you get back something you can send.",
    transcribing: "Listening",
    cleaning: "Bubbling",
    emptyTitle: "Nothing here yet",
    emptyBody: "Everything you say gets kept on this device, ready to grab whenever you need it.",
  },
};

// ── Shinobi ──────────────────────────────────────────────────────────────────
// Ink on paper, drawn fast. A brush-stroke open circle for the record control, a
// grain overlay, and hard cuts instead of eases. Two variants: crimson, or the
// cooler slate-and-lightning read.
const shinobiBase: Theme = {
  id: "shinobi",
  name: "Shinobi",
  blurb: "Ink, paper grain, and a single decisive stroke.",
  palette: {
    bg: "oklch(14% 0.012 20)",
    bgDeep: "oklch(10% 0.01 20)",
    surface: "oklch(19% 0.016 18)",
    surfaceHi: "oklch(24% 0.02 18)",
    line: "oklch(29% 0.022 18)",
    lineHi: "oklch(39% 0.03 20)",
    textHi: "oklch(95% 0.008 60)",
    text: "oklch(88% 0.01 55)",
    textDim: "oklch(73% 0.014 40)",
    textMute: "oklch(60% 0.02 30)",
    accent: "oklch(55% 0.21 25)",
    accentHi: "oklch(64% 0.215 26)",
    accentDeep: "oklch(44% 0.18 25)",
    onAccent: "oklch(97% 0.01 60)",
    accentGlow: "oklch(55% 0.21 25 / 0.32)",
    warm: "oklch(80% 0.10 70)",
    warmDeep: "oklch(70% 0.12 62)",
    error: "oklch(68% 0.20 22)",
    success: "oklch(74% 0.11 155)",
    info: "oklch(72% 0.10 250)",
  },
  fonts: {
    ui: `"Inter", ${STACK_SANS}`,
    display: `"Shippori Mincho", ${STACK_SERIF}`,
    mono: `"JetBrains Mono", ${STACK_MONO}`,
  },
  webFonts: ["Inter:wght@400;500;600;700", "Shippori+Mincho:wght@600;700;800"],
  radius: { sm: 4, md: 6, lg: 10 },
  ease: "cubic-bezier(0.2, 0, 0, 1)",
  record: "enso",
  wave: "ink",
  chrome: "grain",
  copy: {
    idleTitle: "One breath, then speak",
    idleBody: "Say it once, as it comes. What you meant is kept; what you stumbled over is not.",
    transcribing: "Reading",
    cleaning: "Weaving signs",
    emptyTitle: "The page is blank",
    emptyBody: "Every dictation is kept on this device alone. None have been written yet.",
  },
};

/** Cooler counterpart: slate ground, lightning-blue stroke. */
const KAKASHI_PALETTE: Partial<Palette> = {
  bg: "oklch(14.5% 0.014 252)",
  bgDeep: "oklch(10.5% 0.012 252)",
  surface: "oklch(19.5% 0.018 250)",
  surfaceHi: "oklch(24.5% 0.022 250)",
  line: "oklch(29% 0.024 250)",
  lineHi: "oklch(39% 0.032 248)",
  textHi: "oklch(96% 0.006 250)",
  text: "oklch(89% 0.01 250)",
  textDim: "oklch(74% 0.016 248)",
  textMute: "oklch(61% 0.022 250)",
  accent: "oklch(74% 0.135 248)",
  accentHi: "oklch(84% 0.115 246)",
  accentDeep: "oklch(58% 0.145 252)",
  onAccent: "oklch(13% 0.02 252)",
  accentGlow: "oklch(74% 0.135 248 / 0.3)",
  success: "oklch(76% 0.11 195)",
};

export const THEMES: Record<ThemeId, Theme> = {
  signature,
  eden,
  cascade,
  bikini,
  shinobi: shinobiBase,
};

/** Picker order — Signature first as the neutral default, then the four worlds. */
export const THEME_ORDER: ThemeId[] = ["signature", "eden", "cascade", "bikini", "shinobi"];

/** Human-facing labels for the Shinobi variant toggle. */
export const SHINOBI_VARIANTS: { value: ShinobiVariant; label: string; hint: string }[] = [
  { value: "itachi", label: "Crimson", hint: "Ink black, blood red" },
  { value: "kakashi", label: "Lightning", hint: "Slate grey, storm blue" },
];

/**
 * The theme as it should actually render, with the Shinobi variant folded in.
 * Everything downstream reads this, never THEMES directly.
 */
export function resolveTheme(id: ThemeId, variant: ShinobiVariant = "itachi"): Theme {
  const base = THEMES[id] ?? signature;
  if (id !== "shinobi" || variant !== "kakashi") return base;
  return {
    ...base,
    name: "Shinobi",
    palette: { ...base.palette, ...KAKASHI_PALETTE },
    copy: { ...base.copy, cleaning: "Copying the sign" },
  };
}
