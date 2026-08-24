// Deterministic cleanup gates — the cheap, always-on guard against the LLM
// over-editing or hallucinating. Ported 1:1 from
// `crates/whimpr-core/src/cleanup/gates.rs`. On any failure the caller falls
// back to the raw transcript.

import type { CleanupLevel } from "./types";
import { bypassesLlm, maxNoveltyRatio } from "./levels";

export type GateReason =
  | { kind: "EditRatioTooHigh"; ratio: number; ceiling: number }
  | { kind: "LostEntity"; entity: string }
  | { kind: "OverDeletion"; shrink: number }
  | { kind: "Hallucination" }
  | { kind: "BannedPattern"; pattern: string };

export type GateVerdict = { pass: true } | { pass: false; reason: GateReason };

/** Phrases that should never be introduced by cleanup (the model answering/chatting). */
const BANNED_PREFIXES = [
  "sure,",
  "sure!",
  "here is",
  "here's",
  "i'm sorry",
  "i am sorry",
  "as an ai",
  "certainly",
  "of course",
  "i cannot",
  "i can't help",
];

const ASCII_PUNCT = new Set(
  Array.from("!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"),
);

function isAsciiPunct(ch: string): boolean {
  return ASCII_PUNCT.has(ch);
}

/** Trim leading/trailing chars matching `pred`. */
function trimMatches(s: string, pred: (ch: string) => boolean): string {
  let start = 0;
  let end = s.length;
  while (start < end && pred(s[start])) start += 1;
  while (end > start && pred(s[end - 1])) end -= 1;
  return s.slice(start, end);
}

function countDigits(s: string): number {
  let n = 0;
  for (const ch of s) if (ch >= "0" && ch <= "9") n += 1;
  return n;
}

/** Evaluate a cleanup output against the raw transcript for the given level. */
export function evaluate(raw: string, cleaned: string, level: CleanupLevel): GateVerdict {
  // None never invokes the model, so there is nothing to gate.
  if (bypassesLlm(level)) {
    return { pass: true };
  }

  // 1) Introduced assistant-style / greeting prefixes.
  const cleanedLc = cleaned.replace(/^\s+/, "").toLowerCase();
  const rawLc = raw.toLowerCase();
  for (const p of BANNED_PREFIXES) {
    if (cleanedLc.startsWith(p) && !rawLc.includes(p)) {
      return { pass: false, reason: { kind: "BannedPattern", pattern: p } };
    }
  }

  // 2) Must-preserve entities present in raw must survive in cleaned.
  for (const ent of mustPreserveEntities(raw)) {
    if (!cleaned.includes(ent)) {
      return { pass: false, reason: { kind: "LostEntity", entity: ent } };
    }
  }

  // 3) Gross length changes.
  const rawLen = Math.max(Array.from(raw).length, 1);
  const cleanLen = Array.from(cleaned).length;
  const shrink = (rawLen - cleanLen) / rawLen;
  if (shrink > 0.55) {
    return { pass: false, reason: { kind: "OverDeletion", shrink } };
  }
  if (cleanLen > rawLen * 1.6) {
    return { pass: false, reason: { kind: "Hallucination" } };
  }

  // 4) Novelty: how many output words were never spoken.
  const ratio = noveltyRatio(raw, cleaned);
  const ceiling = maxNoveltyRatio(level);
  if (ratio > ceiling) {
    return { pass: false, reason: { kind: "EditRatioTooHigh", ratio, ceiling } };
  }

  return { pass: true };
}

/** Tokens that must survive verbatim: URLs, emails, and 4+-digit strings. */
function mustPreserveEntities(text: string): string[] {
  const out: string[] = [];
  for (const tok of text.split(/\s+/).filter(Boolean)) {
    const trimmed = trimMatches(tok, (c) => isAsciiPunct(c) && c !== "@" && c !== "#");
    if (trimmed === "") continue;
    const isUrl = trimmed.includes("://") || trimmed.includes(".com") || trimmed.includes("@");
    if (isUrl || countDigits(trimmed) >= 4) {
      out.push(trimmed);
    }
  }
  return out;
}

/** Lowercase a token and strip surrounding punctuation, so "3." == "3". */
function normalizeTok(t: string): string {
  return trimMatches(t, isAsciiPunct).toLowerCase();
}

/** Fraction of output words that were never spoken. */
function noveltyRatio(raw: string, cleaned: string): number {
  const rawSet = new Set(
    raw
      .split(/\s+/)
      .map(normalizeTok)
      .filter((s) => s !== ""),
  );
  const cleanToks = cleaned
    .split(/\s+/)
    .map(normalizeTok)
    .filter((s) => s !== "");
  if (cleanToks.length === 0) {
    return 0.0;
  }
  const novel = cleanToks.filter((t) => !rawSet.has(t)).length;
  return novel / cleanToks.length;
}
