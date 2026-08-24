// The hero record control, drawn per theme.
//
// This is the one element people actually aim at, so each world gets its own
// geometry rather than a recolor: rings, an unfurling vine, a terminal cursor, a
// porous sponge, a brush stroke. All are drawn from scratch as SVG — original
// shapes, no borrowed artwork.

import { c } from "../tokens";
import type { RecordForm } from "../themes";

interface Props {
  onClick: () => void;
  form: RecordForm;
  size?: number;
  label?: string;
}

export function RecordButton({ onClick, form, size = 128, label = "Start recording" }: Props) {
  const Art = ART[form] ?? Rings;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="wf-record"
      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
    >
      <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
        <Art />
      </svg>
      <style>{RECORD_CSS}</style>
    </button>
  );
}

/** The mic glyph that sits at the centre of most forms. */
function Mic({ color = c.onAccent, scale = 1 }: { color?: string; scale?: number }) {
  return (
    <g
      transform={`translate(64 64) scale(${scale}) translate(-64 -64)`}
      stroke={color}
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x="57.5" y="47" width="13" height="24" rx="6.5" fill={color} stroke="none" />
      <path d="M52 63a12 12 0 0 0 24 0" />
      <path d="M64 75v6" />
    </g>
  );
}

// ── Signature: concentric rings, precise geometry, no blur ──────────────────
function Rings() {
  return (
    <>
      <circle cx="64" cy="64" r="62" fill="none" stroke={c.line} strokeWidth="1" />
      <circle cx="64" cy="64" r="50" fill="none" stroke={c.lineHi} strokeWidth="1" />
      <circle cx="64" cy="64" r="40" fill={c.accent} />
      <Mic />
    </>
  );
}

// ── Eden: a vine ring, leaves alternating around the circumference ──────────
function Vine() {
  // Leaves placed on the ring by angle; each is a two-arc almond on a stem.
  const leaves = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <>
      <circle cx="64" cy="64" r="58" fill="none" stroke={c.lineHi} strokeWidth="1.5" />
      <g className="wf-vine">
        {leaves.map((deg, i) => (
          <g key={deg} transform={`rotate(${deg} 64 64)`}>
            <path
              d="M64 6 C71 10 71 18 64 22 C57 18 57 10 64 6 Z"
              fill={i % 2 === 0 ? c.accent : c.accentDeep}
              opacity={i % 2 === 0 ? 0.95 : 0.6}
            />
            <path d="M64 22 L64 6" stroke={c.accentDeep} strokeWidth="0.9" opacity="0.5" />
          </g>
        ))}
      </g>
      <circle cx="64" cy="64" r="41" fill={c.accent} />
      <circle cx="64" cy="64" r="41" fill="none" stroke={c.accentDeep} strokeWidth="1" opacity="0.5" />
      <Mic />
    </>
  );
}

// ── Cascade: a terminal frame with a blinking block cursor ──────────────────
function Terminal() {
  return (
    <>
      <rect x="6" y="6" width="116" height="116" fill="none" stroke={c.line} strokeWidth="1" />
      <rect x="18" y="18" width="92" height="92" fill="none" stroke={c.accentDeep} strokeWidth="1" />
      <rect x="26" y="26" width="76" height="76" fill={c.accent} />
      {/* Prompt caret, then the mic as the "command". */}
      <path d="M34 44 L42 52 L34 60" stroke={c.onAccent} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Mic scale={0.72} />
      <rect className="wf-caret" x="86" y="44" width="7" height="16" fill={c.onAccent} />
      {/* Sweeping scanline over the fill. */}
      <rect className="wf-sweep" x="26" y="26" width="76" height="10" fill={c.onAccent} opacity="0.16" />
    </>
  );
}

// ── Bikini: a rounded square with a porous, sponge-like dot field ───────────
function Sponge() {
  // A fixed pseudo-random scatter — deterministic so it never flickers.
  const pores = [
    [42, 40, 5], [58, 34, 3.4], [76, 42, 4.4], [88, 56, 3], [40, 58, 3.6],
    [52, 52, 2.6], [86, 76, 4.8], [44, 78, 4], [64, 88, 3.2], [78, 90, 2.8],
    [34, 68, 2.4], [70, 66, 2.2], [56, 72, 2.6], [92, 40, 2.4],
  ];
  return (
    <>
      <rect x="8" y="8" width="112" height="112" rx="34" fill="none" stroke={c.lineHi} strokeWidth="1.5" />
      <rect x="18" y="18" width="92" height="92" rx="28" fill={c.accent} />
      <g fill={c.accentDeep} opacity="0.42">
        {pores.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      <Mic />
    </>
  );
}

// ── Shinobi: a brush-drawn open circle, one decisive stroke ─────────────────
function Enso() {
  return (
    <>
      {/* The stroke thins and lifts at the end, the way a brush does. */}
      <path
        d="M92 26 A46 46 0 1 0 104 74"
        fill="none"
        stroke={c.accent}
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M104 74 A46 46 0 0 0 96 34"
        fill="none"
        stroke={c.accent}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="64" cy="64" r="37" fill={c.accent} />
      <Mic />
    </>
  );
}

const ART: Record<RecordForm, () => JSX.Element> = {
  rings: Rings,
  vine: Vine,
  terminal: Terminal,
  sponge: Sponge,
  enso: Enso,
};

// Press feedback plus the two forms that carry their own idle motion. Kept to
// transform/opacity so nothing here triggers layout.
const RECORD_CSS = `
.wf-record{transition:transform 200ms var(--wf-ease)}
.wf-record:active{transform:scale(0.94)}
.wf-caret{animation:wf-blink 1.1s steps(1,end) infinite}
@keyframes wf-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.wf-sweep{animation:wf-sweep 3.2s linear infinite}
@keyframes wf-sweep{0%{transform:translateY(0)}100%{transform:translateY(66px)}}
.wf-vine{transform-origin:64px 64px;animation:wf-turn 64s linear infinite}
@keyframes wf-turn{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){
  .wf-sweep,.wf-vine,.wf-caret{animation:none}
  .wf-record{transition:none}
}
`;
