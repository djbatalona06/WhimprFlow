// Client calls to the hosted backend (/api serverless functions). The backend
// holds the speech/LLM key server-side; if the user set a key in Settings we
// forward it (the backend uses it only when no server key is configured).

import type { CleanupLevel, VocabEntry } from "../pipeline/types";
import type { Settings } from "./store";

export interface TranscribeResult {
  text: string;
}

export interface CleanupResult {
  cleaned: string;
  usedRaw: boolean;
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
  let detail = `${res.status} ${res.statusText}`;
  try {
    const body = await res.json();
    if (body?.error) detail = body.error;
  } catch {
    /* non-JSON body */
  }
  throw new Error(detail);
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

  const res = await fetch("/api/transcribe", { method: "POST", headers, body: audio });
  if (!res.ok) await asError(res);
  return (await res.json()) as TranscribeResult;
}

export async function cleanup(
  raw: string,
  level: CleanupLevel,
  vocab: VocabEntry[],
  settings: Settings,
): Promise<CleanupResult> {
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
  if (!res.ok) await asError(res);
  return (await res.json()) as CleanupResult;
}
