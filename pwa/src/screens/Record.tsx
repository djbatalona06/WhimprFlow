import React, { useEffect, useRef, useState } from "react";
import { c, font, type, space, radius, ease } from "../tokens";
import { Button } from "../components/ui";
import { Waveform } from "../components/Waveform";
import { CopyIcon, ShareIcon, NoteIcon, WebhookIcon } from "../components/icons";
import { startRecording, Recorder } from "../lib/recorder";
import { transcribe, cleanup, TranscribeError, type RawReason } from "../lib/api";
import { getSettings, addHistory, vocab } from "../lib/store";
import { countWords, type SessionRecord } from "../lib/stats";
import {
  copyToClipboard,
  shareText,
  sendToObsidian,
  sendToWebhook,
  type ExportResult,
} from "../lib/exports";

type Phase = "idle" | "recording" | "processing" | "result" | "error";

export function RecordScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [bars, setBars] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [text, setText] = useState("");
  const [usedRaw, setUsedRaw] = useState(false);
  const [rawReason, setRawReason] = useState<RawReason | undefined>(undefined);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [toast, setToast] = useState("");
  const [progress, setProgress] = useState("");

  const recRef = useRef<Recorder | null>(null);
  const blobMime = useRef("");
  const blobBytes = useRef(0);
  const startedRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      recRef.current?.cancel();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function flashToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function begin() {
    setFailure(null);
    try {
      const rec = await startRecording((b) => setBars(b));
      recRef.current = rec;
      startedRef.current = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedRef.current) / 1000));
      }, 250);
    } catch (e) {
      setFailure(micFailure(e));
      setPhase("error");
    }
  }

  async function finish() {
    const rec = recRef.current;
    if (!rec) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    const durationMs = Date.now() - startedRef.current;
    setPhase("processing");
    setProgress("Transcribing");
    try {
      const blob = await rec.stop();
      recRef.current = null;
      blobMime.current = blob.type;
      blobBytes.current = blob.size;
      const settings = getSettings();
      const { text: raw } = await transcribe(blob, settings);
      if (!raw.trim()) {
        setFailure({
          title: "Nothing to transcribe",
          message: "The recording came through silent. Move a little closer to the mic and try again.",
        });
        setPhase("error");
        return;
      }
      setProgress("Cleaning up");
      const { cleaned, usedRaw: fellBack, reason } = await cleanup(
        raw,
        settings.cleanup_level,
        vocab(),
        settings,
      );
      setText(cleaned);
      setUsedRaw(fellBack);
      setRawReason(reason);

      const record: SessionRecord = {
        ts_unix: Math.floor(Date.now() / 1000),
        words: countWords(cleaned),
        duration_ms: durationMs,
        chars: cleaned.length,
        text: cleaned,
        app: null,
      };
      addHistory(record);
      setPhase("result");
    } catch (e) {
      setFailure(transcribeFailure(e, { mime: blobMime.current, bytes: blobBytes.current }));
      setPhase("error");
    }
  }

  function cancel() {
    recRef.current?.cancel();
    recRef.current = null;
    if (timerRef.current) window.clearInterval(timerRef.current);
    setPhase("idle");
  }

  function reset() {
    setText("");
    setUsedRaw(false);
    setRawReason(undefined);
    setFailure(null);
    setPhase("idle");
  }

  async function runExport(fn: () => Promise<ExportResult> | ExportResult) {
    const r = await fn();
    flashToast(r.message);
  }

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: space.sm, marginBottom: space.sm }}>
        <span style={{ fontFamily: font.serif, fontSize: type.h2, fontWeight: 600, color: c.textHi, letterSpacing: -0.3 }}>
          WhimprFlow
        </span>
        <span style={{ fontSize: type.micro, color: c.textMute, letterSpacing: 0.5 }}>
          speak, clean, send
        </span>
      </header>

      {phase === "idle" && <IdleView onStart={begin} />}
      {phase === "recording" && <RecordingView bars={bars} time={mmss} onStop={finish} onCancel={cancel} />}
      {phase === "processing" && <ProcessingView progress={progress} />}

      {phase === "error" && failure && (
        <div style={{ marginTop: space.xl, textAlign: "center", padding: `0 ${space.md}px` }}>
          <div style={{ fontSize: type.lg, fontWeight: 600, color: c.error, marginBottom: space.sm }}>
            {failure.title}
          </div>
          <div style={{ color: c.textDim, fontSize: type.body, marginBottom: space.lg, lineHeight: 1.5 }}>
            {failure.message}
          </div>
          <Button onClick={reset}>Try again</Button>
          {failure.diagnostics && (
            <button
              onClick={() => runExport(() => copyToClipboard(failure.diagnostics!))}
              style={{ marginTop: space.md, background: "transparent", border: "none", color: c.textMute, fontSize: type.sm, fontWeight: 600, cursor: "pointer" }}
            >
              Copy diagnostics
            </button>
          )}
        </div>
      )}

      {phase === "result" && (
        <div style={{ marginTop: space.sm }}>
          {usedRaw && rawReason !== "level-none" && (
            <div style={{ fontSize: type.sm, color: c.warm, marginBottom: space.sm, lineHeight: 1.5 }}>
              {rawReasonCopy(rawReason)}
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Cleaned dictation"
            style={{
              width: "100%",
              minHeight: 220,
              boxSizing: "border-box",
              background: c.bgDeep,
              border: `1px solid ${c.line}`,
              borderRadius: radius.lg,
              padding: space.md,
              fontSize: type.lg,
              lineHeight: 1.6,
              color: c.textHi,
              resize: "vertical",
              outline: "none",
              fontFamily: font.ui,
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.sm, marginTop: space.md }}>
            <ExportButton icon={<CopyIcon />} label="Copy" onClick={() => runExport(() => copyToClipboard(text))} />
            <ExportButton icon={<ShareIcon />} label="Notes / Share" onClick={() => runExport(() => shareText(text))} />
            <ExportButton icon={<NoteIcon />} label="Obsidian" onClick={() => runExport(() => sendToObsidian(text, getSettings().obsidian_vault))} />
            <ExportButton
              icon={<WebhookIcon />}
              label="n8n / Webhook"
              onClick={() => runExport(() => sendToWebhook(text, getSettings().webhook_url, { words: countWords(text), durationMs: 0 }))}
            />
          </div>
          <button
            onClick={reset}
            style={{ marginTop: space.md, width: "100%", background: "transparent", border: "none", color: c.textMute, fontSize: type.sm, fontWeight: 600, padding: space.sm, cursor: "pointer" }}
          >
            New dictation
          </button>
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 96,
            transform: "translateX(-50%)",
            background: c.surfaceHi,
            border: `1px solid ${c.lineHi}`,
            color: c.textHi,
            padding: "10px 18px",
            borderRadius: radius.pill,
            fontSize: type.sm,
            fontWeight: 600,
            boxShadow: "0 10px 30px oklch(0% 0 0 / 0.5)",
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/** Crafted concentric-ring record control — precise geometry, no blur/glow. */
function RecordButton({ onClick, size = 128 }: { onClick: () => void; size?: number }) {
  return (
    <button
      onClick={onClick}
      aria-label="Start recording"
      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
    >
      <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r="62" fill="none" stroke={c.line} strokeWidth="1" />
        <circle cx="64" cy="64" r="50" fill="none" stroke={c.lineHi} strokeWidth="1" />
        <circle cx="64" cy="64" r="40" fill={c.accent} />
        <g stroke={c.onAccent} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <rect x="57.5" y="47" width="13" height="24" rx="6.5" fill={c.onAccent} stroke="none" />
          <path d="M52 63a12 12 0 0 0 24 0" />
          <path d="M64 75v6" />
        </g>
      </svg>
    </button>
  );
}

function IdleView({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 40 }}>
      <RecordButton onClick={onStart} />
      <div style={{ marginTop: space.lg, fontSize: type.lg, color: c.text, fontWeight: 600 }}>Tap to dictate</div>
      <p style={{ marginTop: space.xs, fontSize: type.sm, color: c.textMute, textAlign: "center", maxWidth: 300, lineHeight: 1.55 }}>
        Speak naturally. WhimprFlow strips the ums, fixes the punctuation, and hands back clean text.
      </p>
    </div>
  );
}

function RecordingView({
  bars,
  time,
  onStop,
  onCancel,
}: {
  bars: number[];
  time: string;
  onStop: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: space.sm, marginBottom: space.lg }}>
        <span className="wf-live" style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent }} />
        <span style={{ fontSize: type.display, fontWeight: 600, fontFamily: font.serif, color: c.textHi, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
          {time}
        </span>
      </div>
      <div style={{ width: "100%", maxWidth: 320, marginBottom: space.xl }}>
        <Waveform bars={bars} active />
      </div>
      <button
        onClick={onStop}
        aria-label="Stop and clean up"
        style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          border: `2px solid ${c.accent}`,
          background: c.surface,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: `transform 160ms ${ease}`,
        }}
      >
        <span style={{ width: 26, height: 26, borderRadius: 6, background: c.accent }} />
      </button>
      <button onClick={onCancel} style={{ marginTop: space.lg, background: "transparent", border: "none", color: c.textMute, fontSize: type.sm, fontWeight: 600, cursor: "pointer" }}>
        Cancel
      </button>
      <style>{`.wf-live{animation:wfpulse 1.4s ${ease} infinite}@keyframes wfpulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  );
}

function ProcessingView({ progress }: { progress: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: space.lg, paddingBottom: 40 }}>
      <div className="wf-spin" style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${c.line}`, borderTopColor: c.accent }} />
      <div style={{ color: c.textDim, fontSize: type.body, fontWeight: 600, letterSpacing: 0.3 }}>
        {progress}
        <span className="wf-dots" />
      </div>
      <style>{`.wf-spin{animation:wfspin 0.9s linear infinite}@keyframes wfspin{to{transform:rotate(360deg)}}
      .wf-dots::after{content:'';animation:wfdots 1.4s steps(4,end) infinite}@keyframes wfdots{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}`}</style>
    </div>
  );
}

function ExportButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: space.sm,
        background: c.surface,
        border: `1px solid ${c.line}`,
        borderRadius: radius.md,
        padding: "14px 10px",
        color: c.text,
        fontSize: type.sm,
        fontWeight: 600,
        cursor: "pointer",
        transition: `background 160ms ${ease}`,
      }}
    >
      <span style={{ color: c.accent, display: "inline-flex" }}>{icon}</span>
      {label}
    </button>
  );
}

/** A failure the user can act on: what happened, and what to do about it. */
interface Failure {
  title: string;
  message: string;
  /** Optional technical detail, copyable for a bug report. */
  diagnostics?: string;
}

/** Why the raw transcript came back, in the user's terms. */
function rawReasonCopy(reason: RawReason | undefined): string {
  switch (reason) {
    case "gate":
      return "The safety gate found the edit drifted too far from what you said, so this is your raw transcript.";
    case "unreachable":
      return "Cleanup couldn't be reached, so this is your raw transcript — nothing was lost.";
    case "no-key":
      return "No cleanup key is configured, so this is your raw transcript. Settings → Check connection has the details.";
    default:
      return "Cleanup didn't return a usable result, so this is your raw transcript.";
  }
}

function micFailure(e: unknown): Failure {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return {
      title: "Microphone blocked",
      message:
        "Your browser is denying mic access. Open the site settings (the lock or ⓘ icon in the address bar), allow the microphone, then try again.",
    };
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return {
      title: "No microphone found",
      message: "This device didn't offer a microphone. Check that one is connected and not in use by another app.",
    };
  }
  if (name === "NotReadableError") {
    return {
      title: "Microphone busy",
      message: "Another app is holding the mic. Close it and try again.",
    };
  }
  return {
    title: "Couldn't start recording",
    message: "The microphone didn't start. Try again, or reload the app if it keeps happening.",
  };
}

function transcribeFailure(e: unknown, audio: { mime: string; bytes: number }): Failure {
  const meta = [
    `when: ${new Date().toISOString()}`,
    `audio: ${audio.mime || "unknown"} · ${(audio.bytes / 1024).toFixed(0)} KB`,
  ];

  if (e instanceof TranscribeError) {
    meta.unshift(`stage: ${e.stage}`, `status: ${e.status}`, `detail: ${e.message}`);
    const diagnostics = meta.join("\n");

    if (e.stage === "offline") {
      return { title: "No connection", message: e.message, diagnostics };
    }
    if (e.stage === "config") {
      return {
        title: "Backend not configured",
        message: "No speech key is set. Add one under Settings → Advanced, or set WHIMPR_API_KEY on the server.",
        diagnostics,
      };
    }
    if (e.stage === "speech-provider") {
      return {
        title: "The speech service refused it",
        message: `${e.message} Your recording is still here — try again in a moment.`,
        diagnostics,
      };
    }
    if (e.status === 413) {
      return {
        title: "Recording too long",
        message: "That clip was too large to upload. Try a shorter take.",
        diagnostics,
      };
    }
    return { title: "Transcription failed", message: e.message, diagnostics };
  }

  return {
    title: "Something went wrong",
    message: e instanceof Error ? e.message : "The dictation didn't finish. Try again.",
    diagnostics: meta.join("\n"),
  };
}
