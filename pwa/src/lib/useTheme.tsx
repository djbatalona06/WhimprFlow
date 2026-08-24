// Theme state for React. The palette itself is applied to :root as custom
// properties (lib/theme.ts) — this context exists only for the parts of a theme
// that components need to *branch* on: which record button to draw, which
// waveform, which ambient layer, and which voice to speak in.

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { applyTheme, getThemeChoice, saveThemeChoice, type ThemeChoice } from "./theme";
import { resolveTheme, type ShinobiVariant, type Theme, type ThemeId } from "../themes";

interface Ctx {
  theme: Theme;
  choice: ThemeChoice;
  setTheme: (id: ThemeId) => void;
  setVariant: (v: ShinobiVariant) => void;
}

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>(() => getThemeChoice());

  const commit = useCallback((next: ThemeChoice) => {
    applyTheme(next);
    saveThemeChoice(next);
    setChoice(next);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      theme: resolveTheme(choice.id, choice.variant),
      choice,
      setTheme: (id) => commit({ ...choice, id }),
      setVariant: (variant) => commit({ ...choice, variant }),
    }),
    [choice, commit],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
