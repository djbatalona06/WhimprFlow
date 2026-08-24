// The theme picker: a grid of tiles, each rendering itself in its own world's
// colors and typeface rather than describing them. Picking a theme is a visual
// decision, so the tile has to actually look like the thing.

import React from "react";
import { c, font, radius, space, type } from "../tokens";
import { RecordButton } from "./RecordButton";
import { useTheme } from "../lib/useTheme";
import {
  resolveTheme,
  SHINOBI_VARIANTS,
  THEME_ORDER,
  type ShinobiVariant,
  type Theme,
} from "../themes";

export function ThemePicker() {
  const { choice, setTheme, setVariant } = useTheme();

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.sm }}>
        {THEME_ORDER.map((id) => (
          <ThemeTile
            key={id}
            theme={resolveTheme(id, choice.variant)}
            selected={id === choice.id}
            onSelect={() => setTheme(id)}
          />
        ))}
      </div>

      {choice.id === "shinobi" && (
        <div style={{ marginTop: space.md }}>
          <div style={{ fontSize: type.sm, fontWeight: 600, color: c.textDim, marginBottom: space.xs }}>
            Shinobi stroke
          </div>
          <div style={{ display: "flex", gap: space.sm }}>
            {SHINOBI_VARIANTS.map((v) => (
              <VariantChip
                key={v.value}
                variant={v}
                selected={choice.variant === v.value}
                onSelect={() => setVariant(v.value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One tile, painted in its own theme's palette. The colors are inlined from
 * `theme.palette` rather than read from custom properties, because a tile has to
 * show a world the app is *not* currently in.
 */
function ThemeTile({
  theme,
  selected,
  onSelect,
}: {
  theme: Theme;
  selected: boolean;
  onSelect: () => void;
}) {
  const p = theme.palette;
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        appearance: "none",
        textAlign: "left",
        cursor: "pointer",
        padding: 0,
        overflow: "hidden",
        background: p.bg,
        borderRadius: radius.md,
        // The current theme's accent marks the selection, so the ring reads the
        // same across the grid regardless of what each tile contains.
        border: `2px solid ${selected ? c.accent : "transparent"}`,
        outline: `1px solid ${selected ? "transparent" : c.line}`,
        outlineOffset: -1,
        transition: `border-color 160ms var(--wf-ease)`,
      }}
    >
      <div
        style={{
          height: 86,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: p.bgDeep,
          borderBottom: `1px solid ${p.line}`,
        }}
      >
        {/* Scoped custom properties so the mini button paints in THIS theme. */}
        <div
          style={
            {
              "--wf-accent": p.accent,
              "--wf-accent-deep": p.accentDeep,
              "--wf-on-accent": p.onAccent,
              "--wf-line": p.line,
              "--wf-line-hi": p.lineHi,
              "--wf-ease": theme.ease,
              lineHeight: 0,
            } as React.CSSProperties
          }
        >
          <RecordButton form={theme.record} size={54} decorative />
        </div>
      </div>

      <div style={{ padding: `${space.sm}px ${space.sm + 2}px ${space.sm + 2}px` }}>
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontSize: type.body,
            fontWeight: 700,
            color: p.textHi,
            letterSpacing: -0.2,
          }}
        >
          {theme.name}
        </div>
        <div
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: type.micro,
            color: p.textMute,
            marginTop: 3,
            lineHeight: 1.4,
            minHeight: 30,
          }}
        >
          {theme.blurb}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: space.xs }}>
          {[p.accent, p.warm, p.textDim, p.surfaceHi].map((swatch, i) => (
            <span
              key={i}
              style={{ width: 14, height: 6, borderRadius: 999, background: swatch }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

function VariantChip({
  variant,
  selected,
  onSelect,
}: {
  variant: { value: ShinobiVariant; label: string; hint: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        flex: 1,
        appearance: "none",
        cursor: "pointer",
        textAlign: "left",
        padding: `${space.sm}px ${space.sm + 2}px`,
        borderRadius: radius.md,
        background: selected ? c.surfaceHi : c.bgDeep,
        border: `1px solid ${selected ? c.accent : c.line}`,
        fontFamily: font.ui,
      }}
    >
      <div style={{ fontSize: type.sm, fontWeight: 600, color: selected ? c.textHi : c.text }}>
        {variant.label}
      </div>
      <div style={{ fontSize: type.micro, color: c.textMute, marginTop: 2 }}>{variant.hint}</div>
    </button>
  );
}
