// Bulk export: moving many dictations somewhere useful at once.
//
// The single-note destinations live in exports.ts. This file is about the "I
// have three weeks of captured thoughts and I want them in my vault" case —
// Markdown, clipboard, one combined Obsidian note, JSON, and CSV.

import type { HistoryItem } from "./stats";
import { copyToClipboard, type ExportResult } from "./exports";

/**
 * Obsidian's obsidian:// handler goes through the OS URL router, which caps
 * length well below what a browser address bar allows. Chrome and the iOS
 * handler both start failing in the low tens of thousands of characters, and a
 * silently truncated note is worse than a refusal — so cap conservatively and
 * point at the .md download instead.
 */
export const OBSIDIAN_URL_LIMIT = 8000;

function stamp(tsUnix: number): string {
  return new Date(tsUnix * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isoDay(tsUnix: number): string {
  const d = new Date(tsUnix * 1000);
  // Local calendar day, not UTC — a 11pm dictation belongs to that evening.
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Newest first, so the top of an exported file is the most recent thought. */
function ordered(items: HistoryItem[]): HistoryItem[] {
  return [...items].sort((a, b) => b.ts_unix - a.ts_unix);
}

/**
 * Markdown with one `##` section per dictation, grouped under `#` day headings.
 * Drops straight into a vault folder and reads correctly in any Markdown app.
 */
export function toMarkdown(items: HistoryItem[], title = "WhimprFlow dictations"): string {
  const rows = ordered(items);
  const lines: string[] = [`# ${title}`, "", `*${rows.length} dictations · exported ${stamp(Date.now() / 1000)}*`, ""];

  let currentDay = "";
  for (const it of rows) {
    const day = isoDay(it.ts_unix);
    if (day !== currentDay) {
      currentDay = day;
      lines.push(`## ${day}`, "");
    }
    const time = new Date(it.ts_unix * 1000).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    lines.push(`### ${time} · ${it.words} words`, "", it.text.trim(), "");
  }
  return lines.join("\n");
}

export function toJson(items: HistoryItem[]): string {
  return JSON.stringify(
    {
      source: "whimprflow",
      exported_at: new Date().toISOString(),
      count: items.length,
      dictations: ordered(items).map((it) => ({
        created_at: new Date(it.ts_unix * 1000).toISOString(),
        words: it.words,
        chars: it.text.length,
        text: it.text,
      })),
    },
    null,
    2,
  );
}

/** RFC 4180 quoting: double the quotes, wrap every field. */
function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function toCsv(items: HistoryItem[]): string {
  const head = ["created_at", "words", "chars", "text"].map(csvCell).join(",");
  const rows = ordered(items).map((it) =>
    [new Date(it.ts_unix * 1000).toISOString(), it.words, it.text.length, it.text]
      .map(csvCell)
      .join(","),
  );
  return [head, ...rows].join("\r\n");
}

/** Hand the browser a file to save. */
export function download(filename: string, mime: string, content: string): ExportResult {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick — revoking synchronously can cancel the download
    // in some mobile browsers before it has read the blob.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true, message: `Saved ${filename}` };
  } catch {
    return { ok: false, message: "This browser blocked the download" };
  }
}

/** A filename stem that sorts chronologically and never collides in a day. */
function filestem(count: number): string {
  const now = new Date();
  const d = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return `whimprflow-${d.toISOString().slice(0, 16).replace("T", "-").replace(":", "")}-${count}`;
}

export function downloadMarkdown(items: HistoryItem[]): ExportResult {
  if (items.length === 0) return { ok: false, message: "Nothing selected" };
  return download(`${filestem(items.length)}.md`, "text/markdown", toMarkdown(items));
}

export function downloadJson(items: HistoryItem[]): ExportResult {
  if (items.length === 0) return { ok: false, message: "Nothing selected" };
  return download(`${filestem(items.length)}.json`, "application/json", toJson(items));
}

export function downloadCsv(items: HistoryItem[]): ExportResult {
  if (items.length === 0) return { ok: false, message: "Nothing selected" };
  return download(`${filestem(items.length)}.csv`, "text/csv", toCsv(items));
}

export async function copyAll(items: HistoryItem[]): Promise<ExportResult> {
  if (items.length === 0) return { ok: false, message: "Nothing selected" };
  const r = await copyToClipboard(toMarkdown(items));
  return r.ok ? { ok: true, message: `Copied ${items.length} dictations` } : r;
}

/** The obsidian:// URL for one combined note, and whether it will actually fit. */
export function obsidianBulkUrl(
  items: HistoryItem[],
  vault: string,
): { url: string; length: number; withinLimit: boolean } {
  const title = `WhimprFlow export ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
  const url =
    "obsidian://new?vault=" +
    encodeURIComponent(vault.trim()) +
    "&name=" +
    encodeURIComponent(title) +
    "&content=" +
    encodeURIComponent(toMarkdown(items, title));
  return { url, length: url.length, withinLimit: url.length <= OBSIDIAN_URL_LIMIT };
}

/** Send everything selected to Obsidian as a single note. */
export function sendBulkToObsidian(items: HistoryItem[], vault: string): ExportResult {
  if (items.length === 0) return { ok: false, message: "Nothing selected" };
  if (!vault.trim()) return { ok: false, message: "Set your Obsidian vault name in Settings first" };

  const { url, withinLimit } = obsidianBulkUrl(items, vault);
  if (!withinLimit) {
    return {
      ok: false,
      message: "Too much for one link — use Download .md instead",
    };
  }
  try {
    window.location.href = url;
    return { ok: true, message: `Opening Obsidian with ${items.length} dictations…` };
  } catch {
    return { ok: false, message: "Could not open Obsidian" };
  }
}
