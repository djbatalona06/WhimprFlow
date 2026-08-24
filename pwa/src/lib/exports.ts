// Export destinations for a single cleaned dictation: clipboard, Apple Notes
// (via the native share sheet), and Obsidian (via its obsidian:// URL scheme).
// Each returns a small result so the UI can show what happened without assuming
// a particular platform. Bulk destinations live in bulk.ts.

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
