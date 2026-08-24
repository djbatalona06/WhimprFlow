// Export destinations for a cleaned dictation: clipboard, Apple Notes (via the
// native share sheet), Obsidian (via its obsidian:// URL scheme), and an n8n /
// automation webhook. Each returns a small result so the UI can show what
// happened without assuming a particular platform.

export interface ExportResult {
  ok: boolean;
  message: string;
}

export async function copyToClipboard(text: string): Promise<ExportResult> {
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, message: "Copied" };
  } catch {
    return { ok: false, message: "Clipboard blocked — long-press to copy" };
  }
}

/**
 * Send to Apple Notes / anywhere via the OS share sheet. On iOS the share sheet
 * lists Notes, Messages, Mail, etc. Falls back to clipboard where Web Share is
 * unavailable (most desktop browsers).
 */
export async function shareText(text: string): Promise<ExportResult> {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void>; canShare?: (d: ShareData) => boolean };
  if (nav.share) {
    try {
      await nav.share({ text });
      return { ok: true, message: "Shared" };
    } catch (e) {
      // AbortError = user dismissed the sheet; not a failure worth shouting about.
      if (e instanceof DOMException && e.name === "AbortError") {
        return { ok: false, message: "Share cancelled" };
      }
      return { ok: false, message: "Share unavailable" };
    }
  }
  const copied = await copyToClipboard(text);
  return { ok: copied.ok, message: copied.ok ? "Copied (sharing not supported here)" : copied.message };
}

/**
 * Open Obsidian with a new note (its `obsidian://new` scheme). Appends if the
 * note exists is not guaranteed by core Obsidian, so we always create with a
 * timestamped title. Requires Obsidian installed + a vault name.
 */
export function sendToObsidian(text: string, vault: string): ExportResult {
  if (!vault.trim()) {
    return { ok: false, message: "Set your Obsidian vault name in Settings first" };
  }
  const now = new Date();
  const title = `WhimprFlow ${now.toISOString().slice(0, 16).replace("T", " ")}`;
  const url =
    "obsidian://new?vault=" +
    encodeURIComponent(vault.trim()) +
    "&name=" +
    encodeURIComponent(title) +
    "&content=" +
    encodeURIComponent(text);
  try {
    window.location.href = url;
    return { ok: true, message: "Opening Obsidian…" };
  } catch {
    return { ok: false, message: "Could not open Obsidian" };
  }
}

/** POST the dictation to a user-configured webhook (n8n, Zapier, Make, …). */
export async function sendToWebhook(
  text: string,
  webhookUrl: string,
  meta: { words: number; durationMs: number },
): Promise<ExportResult> {
  if (!webhookUrl.trim()) {
    return { ok: false, message: "Set a webhook URL in Settings first" };
  }
  try {
    const res = await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "whimprflow",
        text,
        words: meta.words,
        duration_ms: meta.durationMs,
        created_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) return { ok: false, message: `Webhook returned ${res.status}` };
    return { ok: true, message: "Sent to your automation" };
  } catch {
    // Opaque/no-cors endpoints and CORS-less n8n test URLs can still succeed
    // server-side even when fetch can't read the response.
    return { ok: false, message: "Webhook posted (response blocked by CORS)" };
  }
}
