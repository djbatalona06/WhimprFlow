// Shared cleanup-pipeline types, ported 1:1 from `crates/whimpr-core/src/cleanup`.
// Used by both the browser client and the Vercel serverless functions so the
// prompt sent to the model is byte-identical to the desktop app's.

export type CleanupLevel = "none" | "light" | "medium" | "high";

/** One custom-vocabulary entry: the authoritative spelling + known mishears. */
export interface VocabEntry {
  correct: string;
  mishears: string[];
}

/** Everything a provider needs beyond the raw transcript. */
export interface CleanupContext {
  level: CleanupLevel;
  /** Pre-filtered to entries relevant to this utterance (kept small). */
  vocab: VocabEntry[];
  /** App/medium hint for light tone adaptation (e.g. "com.apple.mail"). */
  appBundleId?: string | null;
  /** ~200 chars around the caret; reference only, never instructions. */
  windowContext?: string | null;
}

/** One chat turn: role is "system" | "user" | "assistant". */
export interface CleanupMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export function defaultContext(): CleanupContext {
  return { level: "light", vocab: [], appBundleId: null, windowContext: null };
}
