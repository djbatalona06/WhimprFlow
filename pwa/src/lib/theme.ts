// Applying a theme: write its palette onto :root as custom properties, load its
// web fonts, and remember the choice.
//
// tokens.ts hands components `var(--wf-*)` rather than literal colors, so setting
// these properties re-skins the entire app without a single component re-render.
// That is the whole trick, and it is why five distinct worlds cost almost nothing
// at the call sites.

import { resolveTheme, type ShinobiVariant, type Theme, type ThemeId } from "../themes";

const K_THEME = "whimpr.theme";
const K_VARIANT = "whimpr.theme.variant";

export interface ThemeChoice {
  id: ThemeId;
  variant: ShinobiVariant;
}

const DEFAULT_CHOICE: ThemeChoice = { id: "signature", variant: "itachi" };

export function getThemeChoice(): ThemeChoice {
  try {
    const id = localStorage.getItem(K_THEME) as ThemeId | null;
    const variant = localStorage.getItem(K_VARIANT) as ShinobiVariant | null;
    return {
      id: id ?? DEFAULT_CHOICE.id,
      variant: variant ?? DEFAULT_CHOICE.variant,
    };
  } catch {
    // Private window or storage disabled — the default still renders.
    return DEFAULT_CHOICE;
  }
}

/** Fetch a theme's Google Fonts stylesheet once. Idempotent across calls. */
function loadWebFonts(theme: Theme): void {
  if (theme.webFonts.length === 0) return;
  const id = `wf-fonts-${theme.id}`;
  if (document.getElementById(id)) return;
  const href =
    "https://fonts.googleapis.com/css2?" +
    theme.webFonts.map((f) => `family=${f}`).join("&") +
    "&display=swap";
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/** Keep the browser chrome (status bar, tab strip) in step with the theme. */
function setMetaThemeColor(color: string): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}

/** camelCase palette key -> --wf-kebab-case custom property. */
function cssVarName(key: string): string {
  return "--wf-" + key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

/**
 * Apply a theme to the document. Safe to call before React mounts, which is what
 * main.tsx does to avoid a flash of the wrong world.
 */
export function applyTheme(choice: ThemeChoice): Theme {
  const theme = resolveTheme(choice.id, choice.variant);
  const root = document.documentElement;

  for (const [key, value] of Object.entries(theme.palette)) {
    root.style.setProperty(cssVarName(key), value);
  }
  root.style.setProperty("--wf-font-ui", theme.fonts.ui);
  root.style.setProperty("--wf-font-display", theme.fonts.display);
  root.style.setProperty("--wf-font-mono", theme.fonts.mono);
  root.style.setProperty("--wf-radius-sm", `${theme.radius.sm}px`);
  root.style.setProperty("--wf-radius-md", `${theme.radius.md}px`);
  root.style.setProperty("--wf-radius-lg", `${theme.radius.lg}px`);
  root.style.setProperty("--wf-ease", theme.ease);

  root.dataset.wfTheme = theme.id;
  root.dataset.wfVariant = choice.variant;
  root.style.colorScheme = theme.light ? "light" : "dark";
  setMetaThemeColor(theme.palette.bg);

  loadWebFonts(theme);
  return theme;
}

export function saveThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(K_THEME, choice.id);
    localStorage.setItem(K_VARIANT, choice.variant);
  } catch {
    /* storage unavailable — the theme still applies for this session */
  }
}
