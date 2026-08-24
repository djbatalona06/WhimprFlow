// Auto Cleanup levels — how aggressively the LLM is allowed to edit.
// Ported 1:1 from `crates/whimpr-core/src/cleanup/levels.rs`.
//
// `none` bypasses the model entirely (raw ASR is used). The others append a
// modifier to the shared system prompt. Light is WhimprFlow's default: research
// found the more-aggressive default was the top "it changed what I said"
// complaint, so we bias conservative.

import type { CleanupLevel } from "./types.js";

/** True when no model should be invoked and the raw transcript is used verbatim. */
export function bypassesLlm(level: CleanupLevel): boolean {
  return level === "none";
}

/** Text appended to the shared system prompt for this level (empty for `none`). */
export function modifier(level: CleanupLevel): string {
  switch (level) {
    case "none":
      return "";
    case "light":
      return (
        "Be conservative: apply the allowed edits minimally. When unsure whether to " +
        "edit, leave the text as spoken."
      );
    case "medium":
      return (
        "You may also tighten wording for clarity and conciseness, but never change the " +
        "meaning."
      );
    case "high":
      return (
        "You may rewrite phrasing for brevity and polish while strictly preserving every " +
        "fact, name, number, and the speaker's intent."
      );
  }
}

/**
 * Ceiling on the novelty ratio (fraction of output words that were not spoken)
 * the deterministic gate tolerates. Filler deletion and punctuation don't count;
 * number/spoken-punctuation normalization introduces a little, so Light leaves
 * headroom for that while still catching full rewrites.
 */
export function maxNoveltyRatio(level: CleanupLevel): number {
  switch (level) {
    case "none":
      return 0.0;
    case "light":
      return 0.34;
    case "medium":
      return 0.55;
    case "high":
      return 0.85;
  }
}
