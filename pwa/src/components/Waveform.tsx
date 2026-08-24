// Live waveform. Takes backend-agnostic bar heights (0..1) and draws them in the
// active theme's language: a calm bar column, a growing stem, falling glyphs,
// rising bubbles, or brush strokes. One canvas, five readings of the same data.

import { useEffect, useRef } from "react";
import type { WaveForm } from "../themes";

const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789<>[]{}/\\|=+*";

export function Waveform({
  bars,
  active,
  form = "bars",
}: {
  bars: number[];
  active: boolean;
  form?: WaveForm;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const barsRef = useRef<number[]>(bars);
  barsRef.current = bars;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const dpr = window.devicePixelRatio || 1;
    let raf = 0;
    let t = 0;

    // Resolve themed colors once per mount — canvas can't read var().
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue("--wf-accent").trim() || "#5ee";
    const accentDeep = css.getPropertyValue("--wf-accent-deep").trim() || accent;
    const mute = css.getPropertyValue("--wf-text-mute").trim() || "#888";

    // Per-form persistent state.
    const drops: { x: number; y: number; speed: number; len: number }[] = [];
    const bubbles: { x: number; y: number; r: number; speed: number; drift: number }[] = [];

    const amplitude = () => {
      const d = barsRef.current;
      if (d.length === 0) return 0;
      return d.reduce((a, b) => a + b, 0) / d.length;
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const data = barsRef.current;

      if (form === "rain") drawRain(ctx, w, h, drops, amplitude(), active, accent, accentDeep, t);
      else if (form === "bubbles") drawBubbles(ctx, w, h, bubbles, amplitude(), active, accent, accentDeep);
      else if (form === "stem") drawStem(ctx, w, h, data, active, accent, accentDeep, mute, t);
      else if (form === "ink") drawInk(ctx, w, h, data, active, accent, mute);
      else drawBars(ctx, w, h, data, active, accent, mute, t);

      t += 1;
      if (!reduced || active) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active, form]);

  return <canvas ref={ref} style={{ width: "100%", height: 96, display: "block" }} />;
}

// ── Signature: a centred column of rounded bars ─────────────────────────────
function drawBars(
  ctx: CanvasRenderingContext2D, w: number, h: number, data: number[],
  active: boolean, accent: string, mute: string, t: number,
) {
  const n = 13;
  const bw = 4;
  const gap = (w - n * bw) / (n - 1);
  const midY = h / 2;
  for (let i = 0; i < n; i += 1) {
    const src = data[i % Math.max(data.length, 1)] ?? 0;
    const envelope = 0.55 + 0.45 * Math.sin((i / (n - 1)) * Math.PI);
    const idle = active ? 0.05 : 0.06 + 0.05 * (0.5 + 0.5 * Math.sin(t / 22 + i * 0.5));
    const amp = Math.max(idle, src * envelope);
    const barH = Math.max(bw, amp * (h - 8));
    ctx.fillStyle = active ? accent : mute;
    ctx.globalAlpha = active ? 0.55 + 0.45 * envelope : 0.5;
    ctx.beginPath();
    ctx.roundRect(i * (bw + gap), midY - barH / 2, bw, barH, bw / 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Eden: a stem that puts out leaves as you speak ──────────────────────────
function drawStem(
  ctx: CanvasRenderingContext2D, w: number, h: number, data: number[],
  active: boolean, accent: string, accentDeep: string, mute: string, t: number,
) {
  const baseY = h - 8;
  const n = 13;
  ctx.strokeStyle = active ? accentDeep : mute;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(6, baseY);
  ctx.lineTo(w - 6, baseY);
  ctx.stroke();

  for (let i = 0; i < n; i += 1) {
    const x = 10 + (i * (w - 20)) / (n - 1);
    const src = data[i % Math.max(data.length, 1)] ?? 0;
    const idle = active ? 0.08 : 0.1 + 0.06 * Math.sin(t / 30 + i);
    const amp = Math.max(idle, src);
    const stemH = amp * (h - 22);
    const sway = Math.sin(t / 34 + i * 0.7) * 3 * amp;

    ctx.strokeStyle = active ? accentDeep : mute;
    ctx.globalAlpha = active ? 0.85 : 0.4;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + sway, baseY - stemH * 0.6, x + sway, baseY - stemH);
    ctx.stroke();

    // A leaf at the tip, sized by how loud this band is.
    const leaf = 2 + amp * 7;
    ctx.fillStyle = active ? accent : mute;
    ctx.globalAlpha = active ? 0.9 : 0.35;
    ctx.beginPath();
    ctx.ellipse(x + sway, baseY - stemH, leaf, leaf * 0.55, -0.5 + sway * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Cascade: falling glyph columns, speed driven by loudness ────────────────
function drawRain(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  drops: { x: number; y: number; speed: number; len: number }[],
  amp: number, active: boolean, accent: string, accentDeep: string, t: number,
) {
  const cell = 11;
  const cols = Math.max(1, Math.floor(w / cell));
  while (drops.length < cols) {
    drops.push({
      x: drops.length * cell,
      y: Math.random() * -h,
      speed: 0.6 + Math.random() * 1.4,
      len: 3 + Math.floor(Math.random() * 5),
    });
  }
  drops.length = cols;

  ctx.font = `${cell - 1}px ui-monospace, monospace`;
  ctx.textBaseline = "top";
  const boost = active ? 0.6 + amp * 5 : 0.35;

  for (const d of drops) {
    for (let k = 0; k < d.len; k += 1) {
      const y = d.y - k * cell;
      if (y < -cell || y > h) continue;
      // The head is bright; the tail fades out behind it.
      const head = k === 0;
      ctx.fillStyle = head ? accent : accentDeep;
      ctx.globalAlpha = head ? (active ? 1 : 0.55) : Math.max(0, (1 - k / d.len) * (active ? 0.6 : 0.25));
      const g = GLYPHS[(Math.floor(t / 3) + k * 7 + d.x) % GLYPHS.length];
      ctx.fillText(g, d.x, y);
    }
    d.y += d.speed * boost;
    if (d.y - d.len * cell > h) {
      d.y = -cell;
      d.speed = 0.6 + Math.random() * 1.4;
      d.len = 3 + Math.floor(Math.random() * 5);
    }
  }
  ctx.globalAlpha = 1;
}

// ── Bikini: bubbles rising, spawn rate driven by loudness ───────────────────
function drawBubbles(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  bubbles: { x: number; y: number; r: number; speed: number; drift: number }[],
  amp: number, active: boolean, accent: string, accentDeep: string,
) {
  const wanted = active ? 10 + Math.round(amp * 40) : 6;
  if (bubbles.length < wanted && Math.random() < (active ? 0.5 : 0.12)) {
    bubbles.push({
      x: Math.random() * w,
      y: h + 8,
      r: 2 + Math.random() * (active ? 5 + amp * 8 : 3),
      speed: 0.4 + Math.random() * (active ? 1.6 + amp * 3 : 0.6),
      drift: (Math.random() - 0.5) * 0.5,
    });
  }

  for (let i = bubbles.length - 1; i >= 0; i -= 1) {
    const b = bubbles[i];
    ctx.strokeStyle = active ? accent : accentDeep;
    ctx.globalAlpha = active ? 0.75 : 0.3;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
    // A highlight dot so they read as bubbles rather than rings.
    ctx.fillStyle = active ? accent : accentDeep;
    ctx.globalAlpha = active ? 0.5 : 0.2;
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(0.6, b.r * 0.2), 0, Math.PI * 2);
    ctx.fill();

    b.y -= b.speed;
    b.x += b.drift;
    if (b.y + b.r < -4) bubbles.splice(i, 1);
  }
  ctx.globalAlpha = 1;
}

// ── Shinobi: brush strokes, thick where loud, tapering at the ends ──────────
function drawInk(
  ctx: CanvasRenderingContext2D, w: number, h: number, data: number[],
  active: boolean, accent: string, mute: string,
) {
  const n = 7;
  const midY = h / 2;
  const slot = (w - 16) / n;
  ctx.lineCap = "round";
  for (let i = 0; i < n; i += 1) {
    const src = data[i % Math.max(data.length, 1)] ?? 0;
    const amp = Math.max(active ? 0.06 : 0.09, src);
    const x = 8 + i * slot + slot / 2;
    const len = amp * (h - 16);
    // Two overlaid strokes: a wet core and a drier, wider ghost.
    ctx.strokeStyle = active ? accent : mute;
    ctx.globalAlpha = active ? 0.22 : 0.12;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x, midY - len / 2);
    ctx.lineTo(x, midY + len / 2);
    ctx.stroke();

    ctx.globalAlpha = active ? 0.95 : 0.4;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, midY - len / 2 + 2);
    ctx.lineTo(x, midY + len / 2 - 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
