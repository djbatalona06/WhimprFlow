// Mass note transfer: pick a range of dictations, send them all somewhere.
//
// Lives in Settings (as a range-based export over everything on the device) and
// is reused by History (over an explicit selection). The four destinations are
// the ones that survive a phone: a Markdown file, the clipboard, one combined
// Obsidian note, and structured JSON/CSV.

import { useMemo, useState } from "react";
import { c, font, radius, space, type } from "../tokens";
import { CopyIcon, DownloadIcon, NoteIcon, TableIcon } from "./icons";
import { getHistory } from "../lib/store";
import { history as toHistory, type HistoryItem } from "../lib/stats";
import {
  copyAll,
  downloadCsv,
  downloadJson,
  downloadMarkdown,
  obsidianBulkUrl,
  sendBulkToObsidian,
} from "../lib/bulk";
import type { ExportResult } from "../lib/exports";

type Range = "all" | "30" | "7" | "1";

const RANGES: { value: Range; label: string }[] = [
  { value: "1", label: "24 hours" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "all", label: "Everything" },
];

function withinRange(items: HistoryItem[], range: Range): HistoryItem[] {
  if (range === "all") return items;
  const cutoff = Date.now() / 1000 - Number(range) * 86_400;
  return items.filter((i) => i.ts_unix >= cutoff);
}

/** Range-based export over everything stored on this device. */
export function BulkExport({ vault }: { vault: string }) {
  const [range, setRange] = useState<Range>("all");
  const all = useMemo(() => toHistory(getHistory(), 5000), []);
  const selected = useMemo(() => withinRange(all, range), [all, range]);

  if (all.length === 0) {
    return (
      <p style={{ fontSize: type.sm, color: c.textMute, lineHeight: 1.6, margin: 0 }}>
        Nothing to export yet. Once you've dictated, everything on this device can be sent out in
        one go — as a Markdown file for your vault, to the clipboard, straight into Obsidian, or as
        JSON/CSV for a spreadsheet.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.xs, marginBottom: space.md }}>
        {RANGES.map((r) => {
          const count = withinRange(all, r.value).length;
          const active = r.value === range;
          return (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              aria-pressed={active}
              style={{
                appearance: "none",
                cursor: "pointer",
                padding: "9px 13px",
                borderRadius: radius.pill,
                textAlign: "center",
                fontSize: type.sm,
                fontWeight: 600,
                fontFamily: font.ui,
                background: active ? c.accent : "transparent",
                color: active ? c.onAccent : c.textDim,
                border: `1px solid ${active ? c.accent : c.line}`,
              }}
            >
              {r.label} · {count}
            </button>
          );
        })}
      </div>
      <ExportActions items={selected} vault={vault} />
    </div>
  );
}

/** The four destinations. Shared by Settings and History's selection mode. */
export function ExportActions({ items, vault }: { items: HistoryItem[]; vault: string }) {
  const [toast, setToast] = useState("");
  const words = items.reduce((n, i) => n + i.words, 0);

  // Whether one combined Obsidian note will actually survive the URL handler.
  const obsidian = useMemo(
    () => (vault.trim() ? obsidianBulkUrl(items, vault) : null),
    [items, vault],
  );
  const obsidianBlocked = obsidian !== null && !obsidian.withinLimit;

  async function run(fn: () => Promise<ExportResult> | ExportResult) {
    const r = await fn();
    setToast(r.message);
    window.setTimeout(() => setToast(""), 3200);
  }

  const disabled = items.length === 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.sm }}>
        <Action
          icon={<DownloadIcon />}
          label="Download .md"
          sub="One file for your vault"
          disabled={disabled}
          onClick={() => run(() => downloadMarkdown(items))}
        />
        <Action
          icon={<CopyIcon />}
          label="Copy all"
          sub="Markdown to clipboard"
          disabled={disabled}
          onClick={() => run(() => copyAll(items))}
        />
        <Action
          icon={<NoteIcon />}
          label="To Obsidian"
          sub={
            !vault.trim()
              ? "Set a vault name below"
              : obsidianBlocked
                ? "Too much — use .md"
                : "One combined note"
          }
          disabled={disabled || !vault.trim() || obsidianBlocked}
          onClick={() => run(() => sendBulkToObsidian(items, vault))}
        />
        <Action
          icon={<TableIcon />}
          label="Data export"
          sub="JSON or CSV"
          disabled={disabled}
          onClick={() => setToast("__data__")}
        />
      </div>

      {toast === "__data__" && (
        <div style={{ display: "flex", gap: space.sm, marginTop: space.sm }}>
          <SmallButton label="Download .json" onClick={() => run(() => downloadJson(items))} />
          <SmallButton label="Download .csv" onClick={() => run(() => downloadCsv(items))} />
        </div>
      )}

      <div style={{ marginTop: space.sm, fontSize: type.micro + 1, color: c.textMute, lineHeight: 1.5 }}>
        {items.length} dictation{items.length === 1 ? "" : "s"} · {words.toLocaleString()} words
        {obsidianBlocked && " · the Obsidian link is over the length a vault handler accepts, so use Download .md for this many"}
      </div>

      {toast && toast !== "__data__" && (
        <div style={{ marginTop: space.sm, fontSize: type.sm, color: c.accent, fontWeight: 600 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function Action({
  icon,
  label,
  sub,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: "none",
        textAlign: "left",
        background: c.surface,
        border: `1px solid ${c.line}`,
        borderRadius: radius.md,
        padding: `${space.sm + 2}px ${space.sm + 2}px`,
        color: c.text,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontFamily: font.ui,
      }}
    >
      <span style={{ color: c.accent, display: "inline-flex", marginBottom: 6 }}>{icon}</span>
      <div style={{ fontSize: type.sm, fontWeight: 700, color: c.textHi }}>{label}</div>
      <div style={{ fontSize: type.micro, color: c.textMute, marginTop: 2, lineHeight: 1.35 }}>
        {sub}
      </div>
    </button>
  );
}

function SmallButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        appearance: "none",
        background: "transparent",
        border: `1px solid ${c.line}`,
        borderRadius: radius.sm,
        color: c.accent,
        fontSize: type.sm,
        fontWeight: 600,
        fontFamily: font.ui,
        padding: "9px 10px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
