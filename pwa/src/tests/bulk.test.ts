import { describe, it, expect } from "vitest";
import {
  toMarkdown,
  toJson,
  toCsv,
  obsidianBulkUrl,
  sendBulkToObsidian,
  OBSIDIAN_URL_LIMIT,
} from "../lib/bulk";
import type { HistoryItem } from "../lib/stats";

const at = (iso: string, text: string): HistoryItem => ({
  ts_unix: Math.floor(new Date(iso).getTime() / 1000),
  text,
  app: null,
  words: text.split(/\s+/).filter(Boolean).length,
});

const ITEMS: HistoryItem[] = [
  at("2026-03-01T09:15:00Z", "First thought of the morning."),
  at("2026-03-01T14:40:00Z", "Second one, same day."),
  at("2026-03-04T11:00:00Z", "A later day entirely."),
];

describe("toMarkdown", () => {
  it("orders newest first", () => {
    const md = toMarkdown(ITEMS);
    expect(md.indexOf("A later day entirely")).toBeLessThan(md.indexOf("First thought"));
  });

  it("groups same-day dictations under one day heading", () => {
    const md = toMarkdown(ITEMS);
    const dayHeadings = md.split("\n").filter((l) => /^## \d{4}-\d{2}-\d{2}$/.test(l));
    expect(dayHeadings).toHaveLength(2);
  });

  it("keeps every dictation's text verbatim", () => {
    const md = toMarkdown(ITEMS);
    for (const it of ITEMS) expect(md).toContain(it.text);
  });
});

describe("toJson", () => {
  it("round-trips every dictation", () => {
    const parsed = JSON.parse(toJson(ITEMS));
    expect(parsed.count).toBe(3);
    expect(parsed.dictations.map((d: { text: string }) => d.text)).toContain("Second one, same day.");
  });
});

describe("toCsv", () => {
  it("emits a header plus one row per dictation", () => {
    // Split on the record separator, not on newlines inside a quoted field.
    expect(toCsv(ITEMS).split("\r\n")).toHaveLength(4);
  });

  it("escapes embedded quotes rather than breaking the row", () => {
    const csv = toCsv([at("2026-03-01T09:00:00Z", 'He said "hello" twice')]);
    expect(csv).toContain('"He said ""hello"" twice"');
  });

  it("keeps a dictation containing a comma in one field", () => {
    const csv = toCsv([at("2026-03-01T09:00:00Z", "one, two, three")]);
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});

describe("obsidianBulkUrl", () => {
  it("encodes the vault name so spaces survive", () => {
    const { url } = obsidianBulkUrl(ITEMS, "My Vault");
    expect(url).toContain("vault=My%20Vault");
  });

  it("flags a payload too large for a URL handler", () => {
    const huge = Array.from({ length: 400 }, (_, i) =>
      at("2026-03-01T09:00:00Z", `Dictation number ${i} with a reasonable amount of text in it.`),
    );
    expect(obsidianBulkUrl(huge, "V").withinLimit).toBe(false);
    expect(obsidianBulkUrl(ITEMS, "V").length).toBeLessThan(OBSIDIAN_URL_LIMIT);
  });
});

describe("sendBulkToObsidian", () => {
  it("refuses without a vault name instead of opening a broken link", () => {
    expect(sendBulkToObsidian(ITEMS, "  ").ok).toBe(false);
  });

  it("refuses an empty selection", () => {
    expect(sendBulkToObsidian([], "V").ok).toBe(false);
  });

  it("points at the .md download when the link would be truncated", () => {
    const huge = Array.from({ length: 400 }, (_, i) =>
      at("2026-03-01T09:00:00Z", `Dictation number ${i} with a reasonable amount of text in it.`),
    );
    expect(sendBulkToObsidian(huge, "V").message).toMatch(/Download \.md/);
  });
});
