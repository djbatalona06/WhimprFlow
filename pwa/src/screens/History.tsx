import React, { useMemo, useState } from "react";
import { c, font, type, space, radius } from "../tokens";
import { PageTitle, Button } from "../components/ui";
import { CopyIcon, ShareIcon } from "../components/icons";
import { getHistory, clearHistory } from "../lib/store";
import { history as toHistory, type HistoryItem } from "../lib/stats";
import { copyToClipboard, shareText } from "../lib/exports";

function dayLabel(tsUnix: number): string {
  const d = new Date(tsUnix * 1000);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yest = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export function HistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>(() => toHistory(getHistory(), 500));
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => items.filter((i) => i.text.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const groups = useMemo(() => {
    const m = new Map<string, HistoryItem[]>();
    for (const it of filtered) {
      const k = dayLabel(it.ts_unix);
      (m.get(k) ?? m.set(k, []).get(k)!).push(it);
    }
    return [...m.entries()];
  }, [filtered]);

  if (items.length === 0) {
    return (
      <div>
        <PageTitle>History</PageTitle>
        <div style={{ marginTop: 80, textAlign: "center", padding: `0 ${space.lg}px` }}>
          <div style={{ fontFamily: font.serif, fontSize: type.h2, color: c.textDim, marginBottom: space.sm }}>
            No dictations yet
          </div>
          <p style={{ fontSize: type.body, color: c.textMute, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
            Everything you dictate is saved here on this device, ready to copy or send again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle sub={`${items.length} on this device`}>History</PageTitle>
      <input
        placeholder="Search dictations"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: c.bgDeep,
          border: `1px solid ${c.line}`,
          borderRadius: radius.md,
          padding: "11px 14px",
          fontSize: type.body,
          color: c.textHi,
          outline: "none",
          marginBottom: space.lg,
        }}
      />

      {groups.map(([label, rows]) => (
        <div key={label} style={{ marginBottom: space.lg }}>
          <div style={{ fontSize: type.micro, fontWeight: 700, color: c.textMute, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: space.sm }}>
            {label}
          </div>
          {rows.map((it, i) => (
            <article key={i} style={{ padding: `${space.md}px 0`, borderTop: i === 0 ? "none" : `1px solid ${c.line}` }}>
              <div style={{ fontSize: type.body, color: c.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {it.text.length > 240 ? it.text.slice(0, 240) + "…" : it.text}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: space.sm }}>
                <span style={{ fontSize: type.micro + 1, color: c.textMute, fontVariantNumeric: "tabular-nums" }}>
                  {it.words} words · {new Date(it.ts_unix * 1000).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
                <span style={{ display: "flex", gap: 18 }}>
                  <button aria-label="Copy" onClick={() => copyToClipboard(it.text)} style={iconBtn}>
                    <CopyIcon size={17} color={c.textDim} />
                  </button>
                  <button aria-label="Share" onClick={() => shareText(it.text)} style={iconBtn}>
                    <ShareIcon size={17} color={c.textDim} />
                  </button>
                </span>
              </div>
            </article>
          ))}
        </div>
      ))}

      <Button variant="danger" onClick={() => { clearHistory(); setItems([]); }} style={{ marginTop: space.sm }}>
        Clear history
      </Button>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 2,
  display: "inline-flex",
};
