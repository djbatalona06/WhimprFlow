# WhimprFlow — PWA + suggested additions (code review)

This note accompanies the new `pwa/` phone companion. It records what shipped, and a
prioritized set of further additions with concrete entry points in the existing code.

## What shipped in this change

A phone-installable **PWA** (`pwa/`) that reuses WhimprFlow's cleanup pipeline (ported
1:1 to TypeScript, unit-tested for parity) and adds mobile-appropriate delivery:

- **Record → transcribe → clean → send.** Browser mic capture, cloud transcription
  (Groq/OpenAI-compatible), the same cleanup prompts + gates as desktop.
- **Apple Notes** via the iOS share sheet (`navigator.share`).
- **Obsidian** via the `obsidian://new` deep link (vault set in Settings).
- **n8n / automation webhook** — POSTs the transcript JSON to a URL you configure.
  Built in because it's the most direct on-ramp from a spoken thought into a workflow.
- History, Insights, and a custom dictionary, all stored on-device.
- Hosted backend (Vercel functions) holds the key server-side; a Settings key is a
  per-request fallback.

## Suggested additions (prioritized)

### 1. Webhook / automation export on the desktop app too
The PWA has it; the desktop app doesn't. Add a `Settings.webhook_url` and, in the
finalize path (`src-tauri/src/hotkey.rs`, `Action::StopCaptureAndFinalize`, right after
`record_dictation`), fire a non-blocking POST of the cleaned transcript. Same JSON shape
the PWA uses. Turns every desktop dictation into a workflow trigger.

### 2. Configurable push-to-talk hotkey (Windows)
Windows is hardcoded to Right Ctrl: `const PTT_VK = VK_RCONTROL` in
`src-tauri/src/win.rs`. Thread a `Settings.hotkey` value (already have a settings store
in `whimpr-core/src/settings.rs`) down to the `WH_KEYBOARD_LL` hook so it can be rebound
from the Hub. This is the most-requested gap in the README.

### 3. Wire the local LLM cleanup on Windows
`hotkey.rs` logs "local cleanup model not wired yet — pasting raw" and
`CleanupMode::Local` is stubbed on the Windows path; the worker in
`src-tauri/src/local_llm.rs` already spawns `whimpr-llm-worker`. Connecting them gives
Windows an offline cleanup path (currently Windows users must use a cloud key).

### 4. Reconcile the stale "UNVERIFIED" header
`src-tauri/src/win.rs` (and the Windows dep block in `src-tauri/Cargo.toml`) still say
"written on macOS, never compiled or run on Windows," which now contradicts the README /
BUILD-STATUS ("compiles and runs on real Windows 11… verified end-to-end"). Update or
remove so the source of truth is consistent.

### 5. History export (both platforms)
Add Markdown/JSON export of the dictation log. Desktop: a `#[tauri::command]` over
`StatsStore::history`. PWA: a download from `localStorage`. Small, high-utility.

### 6. Voice snippets / text-expansion
The desktop Hub already routes a `ComingSoon` "Snippets" page. Spoken triggers that
expand to canned blocks (signatures, addresses, boilerplate) would pair well with the
dictation flow and the dictionary you already maintain.

### 7. Build + test CI
The only workflow today is an auto-fix agent (`.github/workflows/publik-patch-agent.yml`)
with a placeholder toolchain step. Add a matrix that builds on macOS + Windows and runs
`cargo test` (the 50 unit tests) plus the PWA's `pnpm test`. Catches regressions the
manual local builds miss.

### 8. Cross-device sync (natural next step for the hosted backend)
History/dictionary are per-device today. A small Supabase (or similar) table behind the
existing Vercel backend would sync them across the phone PWA and desktop — the reason a
hosted backend was chosen over a purely client-side design.

## Desktop Notes/Obsidian (parity with the PWA)
- **Obsidian (desktop):** either write a Markdown file directly into the vault folder,
  or reuse the same `obsidian://new` URL the PWA uses (Tauri can open it via the shell).
- **Apple Notes (macOS):** an AppleScript `osascript` call to append to a named note is
  the only reliable no-API route; gate it behind a Settings toggle.
