// "How much to edit" — an expanded picker that says what the AI actually does at
// each level instead of offering four bare words.
//
// Every claim below is drawn from the real pipeline: the ALLOWED-edits list in
// src/pipeline/prompts.ts, the per-level modifier in levels.ts, and the drift
// ceiling from maxNoveltyRatio(). Nothing here is decorative copy — if the
// prompt changes, this has to change with it.

import { c, font, radius, space, type } from "../tokens";
import { maxNoveltyRatio } from "../pipeline/levels";
import type { CleanupLevel } from "../pipeline/types";

interface LevelSpec {
  value: CleanupLevel;
  label: string;
  /** The one-line difference from the level above it. */
  headline: string;
  /** What the AI is allowed to touch, in plain terms. */
  edits: string[];
  /** The hard limit that defines this level. */
  limit: string;
}

/** One sentence, run through every level, so the escalation is visible. */
const SAMPLE_SPOKEN =
  "um so i think we should uh meet at 2 actually 3 period does that work question mark";

const SAMPLE_RESULT: Record<CleanupLevel, string> = {
  none: "um so i think we should uh meet at 2 actually 3 period does that work question mark",
  light: "So I think we should meet at 3. Does that work?",
  medium: "I think we should meet at 3. Does that work?",
  high: "Can we meet at 3 instead?",
};

const LEVELS: LevelSpec[] = [
  {
    value: "none",
    label: "Raw",
    headline: "No AI at all.",
    edits: ["Exactly what the transcriber heard, ums and all. Nothing is sent to a model."],
    limit: "Nothing is changed.",
  },
  {
    value: "light",
    label: "Light",
    headline: "Cleans up delivery. Never rewords you.",
    edits: [
      "Deletes fillers — “um”, “uh”, “like”, “you know” — and collapses stutters",
      "Resolves self-corrections: “meet at 2, actually 3” becomes “meet at 3”",
      "Adds punctuation and capitals, and turns spoken “period / comma / new line” into real marks",
      "Normalizes numbers, dates, times and currency",
      "Spells names and technical terms from your Words list",
      "Turns a spoken “one… two… three” into a real numbered or bulleted list",
    ],
    limit: "Your word choice, tone and sentence structure are left alone.",
  },
  {
    value: "medium",
    label: "Medium",
    headline: "Everything in Light, plus tightening.",
    edits: [
      "Everything Light does",
      "Tightens wording for clarity and concision — trims the slack out of a rambling sentence",
    ],
    limit: "Meaning stays fixed. It may drop words, but it won't reach for new ones.",
  },
  {
    value: "high",
    label: "High",
    headline: "Everything in Medium, plus rephrasing.",
    edits: [
      "Everything Medium does",
      "Rewrites phrasing for brevity and polish — the sentences may not be the ones you spoke",
    ],
    limit: "Every fact, name, number, date and your intent are preserved. The wording may not be.",
  },
];

export function CleanupLevels({
  value,
  onChange,
}: {
  value: CleanupLevel;
  onChange: (v: CleanupLevel) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
        {LEVELS.map((spec) => (
          <LevelCard
            key={spec.value}
            spec={spec}
            selected={spec.value === value}
            onSelect={() => onChange(spec.value)}
          />
        ))}
      </div>

      <p
        style={{
          marginTop: space.md,
          fontSize: type.micro + 1,
          color: c.textMute,
          lineHeight: 1.6,
          borderLeft: `2px solid ${c.line}`,
          paddingLeft: space.sm,
        }}
      >
        At every level the AI treats your dictation as text to clean, never as a question to answer
        or an instruction to follow — and it never adds facts, opinions, greetings or sign-offs you
        didn't say. Afterwards a safety gate compares the result against what you actually spoke and
        falls back to Raw if it drifted too far.
      </p>
    </div>
  );
}

function LevelCard({
  spec,
  selected,
  onSelect,
}: {
  spec: LevelSpec;
  selected: boolean;
  onSelect: () => void;
}) {
  const drift = Math.round(maxNoveltyRatio(spec.value) * 100);
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        appearance: "none",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        padding: space.md,
        borderRadius: radius.md,
        background: selected ? c.surface : "transparent",
        border: `1px solid ${selected ? c.accent : c.line}`,
        fontFamily: font.ui,
        transition: `background 160ms var(--wf-ease), border-color 160ms var(--wf-ease)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: space.sm }}>
        <span
          style={{
            fontSize: type.lg,
            fontWeight: 700,
            color: selected ? c.accent : c.textHi,
            fontFamily: font.serif,
          }}
        >
          {spec.label}
        </span>
        <DriftMeter percent={drift} active={selected} />
      </div>

      <div style={{ fontSize: type.sm, color: c.text, fontWeight: 600, marginTop: 4 }}>
        {spec.headline}
      </div>

      {selected && (
        <>
          <ul
            style={{
              margin: `${space.sm}px 0 0`,
              padding: `0 0 0 ${space.md}px`,
              fontSize: type.sm,
              color: c.textDim,
              lineHeight: 1.6,
            }}
          >
            {spec.edits.map((e) => (
              <li key={e} style={{ marginBottom: 3 }}>
                {e}
              </li>
            ))}
          </ul>

          <div style={{ fontSize: type.micro + 1, color: c.textMute, marginTop: space.sm, lineHeight: 1.5 }}>
            {spec.limit}
          </div>

          <Example result={SAMPLE_RESULT[spec.value]} raw={spec.value === "none"} />
        </>
      )}
    </button>
  );
}

/** The same spoken line, before and after, at this level. */
function Example({ result, raw }: { result: string; raw: boolean }) {
  return (
    <div
      style={{
        marginTop: space.md,
        background: c.bgDeep,
        borderRadius: radius.sm,
        padding: space.sm,
        fontSize: type.sm,
        lineHeight: 1.5,
      }}
    >
      <Line label="You say" text={SAMPLE_SPOKEN} color={c.textMute} />
      <div style={{ height: space.xs }} />
      <Line
        label={raw ? "You get" : "You get"}
        text={result}
        color={raw ? c.textMute : c.textHi}
      />
    </div>
  );
}

function Line({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: space.sm }}>
      <span
        style={{
          flex: "0 0 52px",
          fontSize: type.micro,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: c.textMute,
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <span style={{ color, flex: 1 }}>{text}</span>
    </div>
  );
}

/**
 * How far the output is allowed to drift from what was spoken before the gate
 * rejects it. This is a real number from the pipeline, not an illustration.
 */
function DriftMeter({ percent, active }: { percent: number; active: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <span
        aria-hidden="true"
        style={{
          width: 46,
          height: 4,
          borderRadius: 999,
          background: c.line,
          overflow: "hidden",
          display: "inline-block",
        }}
      >
        <span
          style={{
            display: "block",
            width: `${percent}%`,
            height: "100%",
            background: active ? c.accent : c.textMute,
          }}
        />
      </span>
      <span style={{ fontSize: type.micro, color: c.textMute, fontVariantNumeric: "tabular-nums" }}>
        {percent}% drift
      </span>
    </span>
  );
}
