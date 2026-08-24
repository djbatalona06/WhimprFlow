import { useMemo } from "react";
import { c, font, type, space } from "../tokens";
import { PageTitle } from "../components/ui";
import { getHistory } from "../lib/store";
import { summary } from "../lib/stats";

function fmtDuration(secs: number): string {
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.round(secs / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function InsightsScreen() {
  const s = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const tz = new Date().getTimezoneOffset();
    return summary(getHistory(), tz, now);
  }, []);

  if (s.total_sessions === 0) {
    return (
      <div>
        <PageTitle>Insights</PageTitle>
        <div style={{ marginTop: 80, textAlign: "center", padding: `0 ${space.lg}px` }}>
          <div style={{ fontFamily: font.serif, fontSize: type.h2, color: c.textDim, marginBottom: space.sm }}>
            Nothing to measure yet
          </div>
          <p style={{ fontSize: type.body, color: c.textMute, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
            Your first dictation starts the numbers here: words, speaking speed, a day
            streak, and the time you save over typing.
          </p>
        </div>
      </div>
    );
  }

  const maxBar = Math.max(1, ...s.last7_words);
  const todayIdx = new Date().getDay();
  const dayLetter = (i: number) => DAY_LETTERS[(todayIdx - (6 - i) + 7) % 7];

  return (
    <div>
      <PageTitle>Insights</PageTitle>

      {/* Hero figure — editorial, no card, no gradient. */}
      <div style={{ marginBottom: space.xl }}>
        <div
          style={{
            fontFamily: font.serif,
            fontSize: 60,
            lineHeight: 1,
            fontWeight: 600,
            color: c.textHi,
            letterSpacing: -1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {s.total_words.toLocaleString()}
        </div>
        <div style={{ marginTop: space.sm, fontSize: type.body, color: c.textDim }}>
          words dictated across {s.total_sessions} session{s.total_sessions === 1 ? "" : "s"}, saving
          you about <span style={{ color: c.accent, fontWeight: 600 }}>{fmtDuration(s.time_saved_secs)}</span> over
          typing.
        </div>
      </div>

      {/* Cadence — inline, rule-separated figures (not a card grid). */}
      <div
        style={{
          display: "flex",
          borderTop: `1px solid ${c.line}`,
          borderBottom: `1px solid ${c.line}`,
          padding: `${space.md}px 0`,
          marginBottom: space.xl,
        }}
      >
        <Figure value={String(s.avg_wpm)} label="avg wpm" />
        <Rule />
        <Figure value={String(s.best_wpm)} label="best wpm" />
        <Rule />
        <Figure value={String(s.day_streak)} label="day streak" accent={s.day_streak > 0 ? c.warm : undefined} suffix={s.day_streak > 0 ? "🔥" : ""} />
      </div>

      {/* 7-day chart — real baseline, today in aqua. */}
      <div style={{ fontSize: type.micro, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: c.textMute, marginBottom: space.md }}>
        Last 7 days
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: space.sm, height: 132, borderBottom: `1px solid ${c.line}`, paddingBottom: 2 }}>
        {s.last7_words.map((w, i) => {
          const isToday = i === 6;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 8, height: "100%" }}>
              {w > 0 && (
                <span style={{ fontSize: type.micro, color: isToday ? c.accent : c.textMute, fontVariantNumeric: "tabular-nums" }}>{w}</span>
              )}
              <div
                style={{
                  width: "100%",
                  maxWidth: 34,
                  height: `${Math.max(w > 0 ? 6 : 2, (w / maxBar) * 96)}px`,
                  borderRadius: "4px 4px 0 0",
                  background: isToday ? c.accent : w > 0 ? c.lineHi : c.line,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: space.sm, marginTop: 6 }}>
        {s.last7_words.map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: type.micro, fontWeight: 600, color: i === 6 ? c.accent : c.textMute }}>
            {dayLetter(i)}
          </div>
        ))}
      </div>

      <p style={{ marginTop: space.xl, fontSize: type.micro + 1, color: c.textMute, lineHeight: 1.5 }}>
        Computed on this device. Time saved assumes 45 wpm typing.
      </p>
    </div>
  );
}

function Figure({ value, label, accent, suffix }: { value: string; label: string; accent?: string; suffix?: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontFamily: font.serif, fontSize: type.h1, fontWeight: 600, color: accent ?? c.textHi, fontVariantNumeric: "tabular-nums" }}>
        {value}
        {suffix}
      </div>
      <div style={{ fontSize: type.micro, color: c.textMute, marginTop: 3, letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

function Rule() {
  return <div style={{ width: 1, alignSelf: "stretch", background: c.line }} />;
}
