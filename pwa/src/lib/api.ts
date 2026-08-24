// Client calls to the hosted backend (/api serverless functions). The backend
// holds the speech/LLM key server-side; if the user set a key in Settings we
// forward it (the backend uses it only when no server key is configured).

import type { CleanupLevel, VocabEntry } from "../pipeline/types";
import type { Settings } from "./store";

export interface TranscribeResult {
  text: string;
}

/** Why the raw transcript came back instead of a cleaned one. */
export type RawReason =
  | "level-none" // the user chose Raw — working as intended
  | "gate" // the safety gate caught too much drift
  | "unreachable" // cleanup never answered
  | "no-key"
  | "other";

export interface CleanupResult {
  cleaned: string;
  usedRaw: boolean;
  reason?: RawReason;
}

/** A transcription failure the UI can explain in the user's terms. */
export class TranscribeError extends Error {
  readonly stage: string;
  readonly status: number;
  constructor(message: string, stage: string, status: number) {
    super(message);
    this.name = "TranscribeError";
    this.stage = stage;
    this.status = status;
  }
}

/** App-id hint for the Formatting Mode, derived from the chosen target medium. */
function mediumToAppId(medium: Settings["target_medium"]): string | null {
  switch (medium) {
    case "email":
      return "mail";
    case "sms":
      return "imessage";
    case "chat":
      return "slack";
    case "docs":
      return "notes";
    default:
      return null;
  }
}

async function asError(res: Response): Promise<never> {
  let detail = `The server returned ${res.status}.`;
  let stage = "network";
  try {
    const body = await res.json();
    if (body?.error) detail = body.error;
    if (body?.stage) stage = body.stage;
  } catch {
    // A non-JSON body means the function crashed before our code ran, or a
    // proxy answered instead. Say so rather than showing a bare status code.
    detail = `The server returned ${res.status} without a readable reason. This is a backend fault, not something you did.`;
    stage = "server";
  }
  throw new TranscribeError(detail, stage, res.status);
}

export async function transcribe(audio: Blob, settings: Settings): Promise<TranscribeResult> {
  // Send the raw audio bytes with metadata in headers; the backend re-wraps them
  // into a multipart request to the speech API. Avoids inbound multipart parsing.
  const headers: Record<string, string> = {
    "content-type": audio.type || "audio/webm",
    "x-model": settings.speech_model,
  };
  if (settings.api_key) headers["x-api-key"] = settings.api_key;
  if (settings.api_base_url) headers["x-base-url"] = settings.api_base_url;

  let res: Response;
  try {
    res = await fetch("/api/transcribe", { method: "POST", headers, body: audio });
  } catch {
    throw new TranscribeError(
      "Couldn't reach WhimprFlow. Check your connection and try again — your recording wasn't lost.",
      "offline",
      0,
    );
  }
  if (!res.ok) await asError(res);
  return (await res.json()) as TranscribeResult;
}

/**
 * Clean up a transcript. This never throws: cleanup is an enhancement, not a
 * gate, so every failure path hands back the raw transcript with a reason. A
 * backend fault must never cost the user the words they just spoke.
 */
export async function cleanup(
  raw: string,
  level: CleanupLevel,
  vocab: VocabEntry[],
  settings: Settings,
): Promise<CleanupResult> {
  const fallback = (reason: RawReason): CleanupResult => ({ cleaned: raw, usedRaw: true, reason });
  try {
    const res = await fetch("/api/cleanup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        raw,
        level,
        vocab,
        model: settings.cleanup_model,
        appBundleId: mediumToAppId(settings.target_medium),
        apiKey: settings.api_key || undefined,
        baseUrl: settings.api_base_url || undefined,
      }),
    });
    if (!res.ok) return fallback("unreachable");
    const body = (await res.json()) as CleanupResult;
    if (typeof body?.cleaned !== "string" || !body.cleaned.trim()) return fallback("other");
    return body;
  } catch {
    return fallback("unreachable");
  }
}

export interface Health {
  ok: boolean;
  speechKey: boolean;
  llmKey: boolean;
  pipeline: boolean;
  speechBase: string;
  llmBase: string;
  cleanupModel: string;
}

/** Ask the backend whether it is actually configured. Never throws. */
export async function health(): Promise<Health | null> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return null;
    return (await res.json()) as Health;
  } catch {
    return null;
  }
}
