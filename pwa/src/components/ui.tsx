// Shared presentational primitives. Mobile-first, dark, editorial. Cards are used
// sparingly (never nested); most structure is sections separated by rhythm + rules.

import React from "react";
import { c, font, type, radius, space, ease } from "../tokens";

/** A raised panel. Use only when the content is a genuine discrete object; never nest. */
export function Panel({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: c.surface,
        border: `1px solid ${c.line}`,
        borderRadius: radius.lg,
        padding: space.md,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A titled full-width band. The default structural unit — no box, just rhythm. */
export function Section({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section style={{ marginBottom: space.xl, ...style }}>
      {title && (
        <h2
          style={{
            margin: `0 0 ${space.md}px`,
            fontSize: type.micro,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: c.textMute,
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    appearance: "none",
    border: "none",
    borderRadius: radius.md,
    padding: "14px 18px",
    fontSize: type.body,
    fontWeight: 600,
    fontFamily: font.ui,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: `transform 160ms ${ease}, background 160ms ${ease}`,
    width: "100%",
  };
  const skins: Record<string, React.CSSProperties> = {
    primary: { background: c.accent, color: c.onAccent },
    ghost: { background: "transparent", color: c.text, border: `1px solid ${c.line}` },
    danger: { background: "transparent", color: c.error, border: `1px solid ${c.line}` },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...skins[variant], ...style }}>
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        background: c.bgDeep,
        border: `1px solid ${c.line}`,
        borderRadius: radius.md,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              appearance: "none",
              border: "none",
              borderRadius: radius.sm,
              padding: "9px 6px",
              fontSize: type.sm,
              fontWeight: 600,
              fontFamily: font.ui,
              cursor: "pointer",
              transition: `background 160ms ${ease}, color 160ms ${ease}`,
              background: active ? c.accent : "transparent",
              color: active ? c.onAccent : c.textMute,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block", marginBottom: space.lg }}>
      <div style={{ fontSize: type.sm, fontWeight: 600, color: c.textDim, marginBottom: space.xs }}>
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: type.micro + 1, color: c.textMute, marginTop: space.xs, lineHeight: 1.45 }}>
          {hint}
        </div>
      )}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: c.bgDeep,
        border: `1px solid ${c.line}`,
        borderRadius: radius.md,
        padding: "12px 14px",
        fontSize: type.body,
        color: c.textHi,
        fontFamily: font.ui,
        outline: "none",
        ...props.style,
      }}
    />
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: space.lg }}>
      <h1
        style={{
          margin: 0,
          fontSize: type.h1,
          fontWeight: 600,
          color: c.textHi,
          fontFamily: font.serif,
          letterSpacing: -0.3,
        }}
      >
        {children}
      </h1>
      {sub && <div style={{ marginTop: 4, fontSize: type.sm, color: c.textMute }}>{sub}</div>}
    </div>
  );
}
