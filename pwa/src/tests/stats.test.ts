import { describe, it, expect } from "vitest";
import { summary, countWords, SessionRecord } from "../lib/stats";

// Mirrors the #[cfg(test)] module in crates/whimpr-core/src/stats.rs.

const NOW = 1_610_107_200; // 2021-01-08 12:00:00 UTC
const DAY = 86_400;

function rec(
  words: number,
  duration_ms: number,
  chars: number,
  ts_unix: number,
): SessionRecord {
  return { words, duration_ms, chars, ts_unix, text: "", app: null };
}

describe("stats", () => {
  it("counts words", () => {
    expect(countWords("  hello   there  world ")).toBe(3);
    expect(countWords("")).toBe(0);
  });

  it("aggregates totals and wpm", () => {
    const s = [rec(60, 60_000, 300, NOW), rec(30, 15_000, 150, NOW)];
    const sum = summary(s, 0, NOW);
    expect(sum.total_words).toBe(90);
    expect(sum.total_sessions).toBe(2);
    expect(sum.avg_wpm).toBe(72);
    expect(sum.best_wpm).toBe(120);
    expect(sum.words_today).toBe(90);
  });

  it("streak counts consecutive days including today gap", () => {
    const s = [
      rec(10, 5_000, 50, NOW - DAY),
      rec(10, 5_000, 50, NOW - 2 * DAY),
      rec(10, 5_000, 50, NOW - 3 * DAY),
      rec(10, 5_000, 50, NOW - 5 * DAY),
    ];
    const sum = summary(s, 0, NOW);
    expect(sum.day_streak).toBe(3);
    expect(sum.words_today).toBe(0);
  });

  it("last7 buckets by local day", () => {
    const s = [rec(5, 3_000, 25, NOW), rec(7, 3_000, 35, NOW - 2 * DAY)];
    const sum = summary(s, 0, NOW);
    expect(sum.last7_words[6]).toBe(5);
    expect(sum.last7_words[4]).toBe(7);
    expect(sum.last7_words[5]).toBe(0);
  });
});
