// Web data layer — the PWA's replacement for the desktop app's Tauri `invoke`
// surface (ui/src/hub/api.ts). Settings, history, and dictionary persist in
// localStorage (per-device); transcription/cleanup go over the network to our
// own /api functions. Everything is wrapped so a private-window / disabled-
// storage browser still renders with defaults.

import type { CleanupLevel, VocabEntry } from "../pipeline/types";
import type { SessionRecord } from "./stats";

export type TargetMedium = "none" | "email" | "sms" | "chat" | "docs";

export interface Settings {
  cleanup_level: CleanupLevel;
  /** Chat model used for cleanup (OpenAI-compatible id). */
  cleanup_model: string;
  /** Speech-to-text model id (OpenAI-compatible; Groq default). */
  speech_model: string;
  /** Formatting Mode target for the cleanup prompt. */
  target_medium: TargetMedium;
  /** Obsidian vault name for the obsidian:// deep link. */
  obsidian_vault: string;
  /** Optional n8n / automation webhook the result is POSTed to. */
  webhook_url: string;
  /** Optional per-request key, used only if the backend has no server key set. */
  api_key: string;
  /** Optional OpenAI-compatible base URL override (blank = backend default). */
  api_base_url: string;
  sound_on_start: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  cleanup_level: "light",
  cleanup_model: "llama-3.3-70b-versatile",
  speech_model: "whisper-large-v3",
  target_medium: "none",
  obsidian_vault: "",
  webhook_url: "",
  api_key: "",
  api_base_url: "",
  sound_on_start: true,
};

export interface DictEntry {
  correct: string;
  mishears: string[];
  auto: boolean;
}

const K_SETTINGS = "whimpr.settings";
const K_HISTORY = "whimpr.history";
const K_DICT = "whimpr.dictionary";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — best effort */
  }
}

// ── Settings ────────────────────────────────────────────────────────────────
export function getSettings(): Settings {
  return read<Settings>(K_SETTINGS, DEFAULT_SETTINGS);
}
export function setSettings(s: Settings): void {
  write(K_SETTINGS, s);
}

// ── History ─────────────────────────────────────────────────────────────────
export function getHistory(): SessionRecord[] {
  return readArray<SessionRecord>(K_HISTORY);
}
export function addHistory(rec: SessionRecord): SessionRecord[] {
  const all = getHistory();
  all.push(rec);
  // Cap the log so a long-lived device doesn't bloat localStorage.
  const capped = all.slice(-2000);
  write(K_HISTORY, capped);
  return capped;
}
export function clearHistory(): void {
  write(K_HISTORY, []);
}

// ── Dictionary ──────────────────────────────────────────────────────────────
export function getDictionary(): DictEntry[] {
  return readArray<DictEntry>(K_DICT);
}
export function addDictionaryEntry(correct: string, mishears: string[]): DictEntry[] {
  const all = getDictionary();
  const idx = all.findIndex((e) => e.correct.toLowerCase() === correct.toLowerCase());
  if (idx >= 0) {
    const merged = new Set([...all[idx].mishears, ...mishears].map((m) => m.trim()).filter(Boolean));
    all[idx] = { ...all[idx], correct, mishears: [...merged] };
  } else {
    all.push({ correct, mishears: mishears.map((m) => m.trim()).filter(Boolean), auto: false });
  }
  write(K_DICT, all);
  return all;
}
export function removeDictionaryEntry(correct: string): DictEntry[] {
  const all = getDictionary().filter((e) => e.correct !== correct);
  write(K_DICT, all);
  return all;
}

/** Dictionary entries as pipeline VocabEntry (drop the `auto` UI flag). */
export function vocab(): VocabEntry[] {
  return getDictionary().map((e) => ({ correct: e.correct, mishears: e.mishears }));
}
