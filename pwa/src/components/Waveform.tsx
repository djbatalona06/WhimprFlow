// Live waveform. Renders backend-agnostic bar heights (0..1) to a canvas: a calm
// centered column of rounded bars, aqua when live, dim and near-flat at rest. No
// glow, no blur — the motion is the signal.

import { useEffect, useRef } from "react";
import { c } from "../tokens";

export function Waveform({ bars, active }: { bars: number[]; active: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const barsRef = useRef<number[]>(bars);
  barsRef.current = bars;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    let raf = 0;
    let t = 0;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const data = barsRef.current;
      const n = 13;
      const bw = 4;
      const gap = (w - n * bw) / (n - 1);
      const midY = h / 2;

      for (let i = 0; i < n; i += 1) {
        const src = data[i % Math.max(data.length, 1)] ?? 0;
        // Gentle center-weighted envelope so the column reads as one shape.
        const envelope = 0.55 + 0.45 * Math.sin((i / (n - 1)) * Math.PI);
        const idle = active ? 0.05 : 0.06 + 0.05 * (0.5 + 0.5 * Math.sin(t / 22 + i * 0.5));
        const amp = Math.max(idle, src * envelope);
        const barH = Math.max(bw, amp * (h - 8));
        const x = i * (bw + gap);
        const y = midY - barH / 2;
        ctx.fillStyle = active ? c.accent : c.textMute;
        ctx.globalAlpha = active ? 0.55 + 0.45 * envelope : 0.5;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, barH, bw / 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      t += 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={ref} style={{ width: "100%", height: 96, display: "block" }} />;
}
