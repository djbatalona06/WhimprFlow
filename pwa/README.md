# WhimprFlow — PWA (phone companion)

An installable Progressive Web App that brings WhimprFlow's dictation cleanup to
your phone: **record → transcribe → clean → send**. Because a browser can't type
into other apps the way the desktop app does (no global hotkey / paste-anywhere on
mobile), this is a capture-and-send tool — the cleaned text goes to your clipboard,
the iOS share sheet (Apple Notes, Messages, Mail…), or **Obsidian** (`obsidian://`
deep link). History can be exported in bulk as Markdown, JSON or CSV, or pushed
into Obsidian as one combined note.

The cleanup pipeline (prompts, levels, deterministic gates, layout normalization)
is ported 1:1 from the desktop `whimpr-core` crate, so the phone produces the same
edits as the desktop app. Only transcription differs: Whisper is native-only, so the
PWA calls an OpenAI-compatible speech API through its own backend.

## Architecture

- **Frontend** (`src/`) — Vite + React + TypeScript. Record/History/Insights/
  Words/Settings screens. Settings, history, and the custom dictionary persist in
  `localStorage` (per device).
- **Themes** (`src/themes.ts`, `src/lib/theme.ts`) — five worlds: Signature,
  Garden of Eden, The Matrix, Bikini Bottom, and Shinobi (Crimson/Lightning).
  Each carries its own palette, typefaces, corner language, easing, record
  control, waveform, ambient layer, and voice. `tokens.ts` exposes every token as
  a `var(--wf-*)` reference and `applyTheme()` writes the active palette onto
  `:root`, so switching costs no re-render and components need no colour edits.
  `scripts/check-contrast.mjs` enforces WCAG AA per palette as part of the build.
- **Ported pipeline** (`src/pipeline/`) — `prompts.ts`, `levels.ts`, `gates.ts`,
  `pipeline.ts`, mirrored from `crates/whimpr-core/src/cleanup/*`. Unit-tested for
  parity (`src/tests/`, Vitest).
- **Backend** (`api/`) — Vercel serverless functions:
  - `POST /api/transcribe` — proxies raw audio to an OpenAI-compatible
    `/audio/transcriptions` endpoint (Groq `whisper-large-v3` by default).
  - `POST /api/cleanup` — runs the ported pipeline against a chat endpoint, applies
    the gates + post-process, and falls back to the raw transcript on any failure.
  The API key lives server-side (env). If no server key is set, a key entered in the
  app's Settings is forwarded per request (proxied, never persisted).

## Configuration

Set one env var on the host (Vercel project settings) — a single Groq key covers both
whisper and the cleanup LLM:

```
WHIMPR_API_KEY=gsk_...        # or SPEECH_API_KEY + LLM_API_KEY separately
# optional overrides:
WHIMPR_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

No server key? Open the app → Settings → Advanced and paste a key there instead.

## Develop

```bash
pnpm install
pnpm dev            # Vite dev server (the /api routes need `vercel dev` or deploy)
pnpm build          # typecheck (app + api) + contrast check + production build
pnpm test           # Vitest — cleanup-pipeline parity and bulk export
pnpm typecheck:api  # NodeNext typecheck of api/ and the shared pipeline
pnpm check:contrast # WCAG AA across all five theme palettes
pnpm e2e            # Playwright browser review (mobile viewport)
```

### Two TypeScript configs, on purpose

`tsconfig.json` (the app) uses `moduleResolution: "bundler"`, which allows
extensionless relative imports because Vite resolves them. `tsconfig.api.json`
covers `api/` and the shared `src/pipeline/` under `nodenext`, which is what Node
actually uses at runtime — `package.json` is `"type": "module"`, so Vercel emits
the functions as native ESM where relative imports **must** carry a `.js`
extension.

This split exists because of a real outage: `api/cleanup.ts` imported
`"../src/pipeline/pipeline"`, compiled clean under the app config (which excludes
`api/` entirely), and then failed every request in production with
`ERR_MODULE_NOT_FOUND`. Keep both configs in the build.

## Install on a phone

Open the deployed HTTPS URL in the phone browser and choose **Add to Home Screen**.
It then launches standalone like a native app and works offline for the shell.
