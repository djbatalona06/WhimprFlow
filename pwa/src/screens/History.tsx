import React, { useMemo, useState } from "react";
import { c, font, type, space, radius } from "../tokens";
import { PageTitle, Button } from "../components/ui";
import { CopyIcon, ShareIcon, CheckIcon } from "../components/icons";
import { ExportActions } from "../components/BulkExport";
import { getHistory, clearHistory, getSettings } from "../lib/store";
import { history as toHistory, type HistoryItem } from "../lib/stats";
import { copyToClipboard, shareText } from "../lib/exports";
import { useTheme } from "../lib/useTheme";

function dayLabel(tsUnix: number): string {
  const d = new Date(tsUnix * 1000);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yest = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export function HistoryScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<HistoryItem[]>(() => toHistory(getHistory(), 500));
  const [q, setQ] = useState("");
  const [selecting, setSelecting] = useState(false);
  // Timestamps are unique per dictation, so they serve as stable keys.
  const [picked, setPicked] = useState<Set<number>>(() => new Set());

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

  const selected = useMemo(() => items.filter((i) => picked.has(i.ts_unix)), [items, picked]);

  function toggle(ts: number) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(ts)) next.delete(ts);
      else next.add(ts);
      return next;
    });
  }

  function toggleAll() {
    setPicked((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.ts_unix)),
    );
  }

  function exitSelect() {
    setSelecting(false);
    setPicked(new Set());
  }

  if (items.length === 0) {
    return (
      <div>
        <PageTitle>History</PageTitle>
        <div style={{ marginTop: 80, textAlign: "center", padding: `0 ${space.lg}px` }}>
          <div style={{ fontFamily: font.serif, fontSize: type.h2, color: c.textDim, marginBottom: space.sm }}>
            {theme.copy.emptyTitle}
          </div>
          <p style={{ fontSize: type.body, color: c.textMute, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
            {theme.copy.emptyBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: space.sm }}>
        <PageTitle sub={`${items.length} on this device`}>History</PageTitle>
        <button
          onClick={() => (selecting ? exitSelect() : setSelecting(true))}
          style={{
            flexShrink: 0,
            marginTop: 6,
            background: "transparent",
            border: `1px solid ${selecting ? c.accent : c.line}`,
            borderRadius: radius.pill,
            color: selecting ? c.accent : c.textDim,
            fontSize: type.sm,
            fontWeight: 600,
            padding: "7px 14px",
            cursor: "pointer",
          }}
        >
          {selecting ? "Done" : "Select"}
        </button>
      </div>

      {selecting && (
        <div style={{ marginBottom: space.lg }}>
          <button
            onClick={toggleAll}
            style={{
              background: "transparent",
              border: "none",
              color: c.accent,
              fontSize: type.sm,
              fontWeight: 600,
              cursor: "pointer",
              padding: `0 0 ${space.sm}px`,
            }}
          >
            {picked.size === filtered.length ? "Clear selection" : `Select all ${filtered.length}`}
          </button>
          <ExportActions items={selected} vault={getSettings().obsidian_vault} />
        </div>
      )}

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
          {rows.map((it, i) => {
            const isPicked = picked.has(it.ts_unix);
            return (
            <article
              key={i}
              onClick={selecting ? () => toggle(it.ts_unix) : undefined}
              style={{
                display: "flex",
                gap: space.sm,
                padding: `${space.md}px 0`,
                borderTop: i === 0 ? "none" : `1px solid ${c.line}`,
                cursor: selecting ? "pointer" : "default",
              }}
            >
              {selecting && (
                <span
                  role="checkbox"
                  aria-checked={isPicked}
                  aria-label="Select dictation"
                  style={{
                    flexShrink: 0,
                    marginTop: 2,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `1.5px solid ${isPicked ? c.accent : c.lineHi}`,
                    background: isPicked ? c.accent : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isPicked && <CheckIcon size={14} color={c.onAccent} />}
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: type.body, color: c.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {it.text.length > 240 ? it.text.slice(0, 240) + "…" : it.text}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: space.sm }}>
                <span style={{ fontSize: type.micro + 1, color: c.textMute, fontVariantNumeric: "tabular-nums" }}>
                  {it.words} words · {new Date(it.ts_unix * 1000).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
                {!selecting && (
                  <span style={{ display: "flex", gap: 18 }}>
                    <button aria-label="Copy" onClick={() => copyToClipboard(it.text)} style={iconBtn}>
                      <CopyIcon size={17} color={c.textDim} />
                    </button>
                    <button aria-label="Share" onClick={() => shareText(it.text)} style={iconBtn}>
                      <ShareIcon size={17} color={c.textDim} />
                    </button>
                  </span>
                )}
              </div>
              </div>
            </article>
            );
          })}
        </div>
      ))}

      <Button variant="danger" onClick={() => { clearHistory(); setItems([]); exitSelect(); }} style={{ marginTop: space.sm }}>
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
