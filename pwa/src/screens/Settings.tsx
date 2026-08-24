import { useState } from "react";
import { c, type, space, radius, ease, font } from "../tokens";
import { PageTitle, TextInput, Field, Section } from "../components/ui";
import { ThemePicker } from "../components/ThemePicker";
import { CleanupLevels } from "../components/CleanupLevels";
import { BulkExport } from "../components/BulkExport";
import { getSettings, setSettings, DEFAULT_SETTINGS, type Settings } from "../lib/store";
import { sendToObsidian } from "../lib/exports";
import { health, type Health } from "../lib/api";
import type { CleanupLevel } from "../pipeline/types";

export function SettingsScreen() {
  const [s, setS] = useState<Settings>(() => getSettings());
  const [showAdvanced, setShowAdvanced] = useState(false);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...s, [key]: value };
    setS(next);
    setSettings(next);
  }

  return (
    <div>
      <PageTitle sub="Look, cleanup, export, and connection">Settings</PageTitle>

      <Section title="Theme">
        <ThemePicker />
      </Section>

      <Section title="How much to edit">
        <CleanupLevels
          value={s.cleanup_level}
          onChange={(v: CleanupLevel) => update("cleanup_level", v)}
        />
      </Section>

      <Section title="Export">
        <BulkExport vault={s.obsidian_vault} />
      </Section>

      <Section title="Destinations">
        <ObsidianField value={s.obsidian_vault} onChange={(v) => update("obsidian_vault", v)} />
        <ToggleRow
          label="Sound on start"
          hint="A short tone when recording begins, so you know it's live without looking."
          value={s.sound_on_start}
          onChange={(v) => update("sound_on_start", v)}
        />
      </Section>

      <Section title="Connection">
        <ConnectionCheck />
      </Section>

      <button
        onClick={() => setShowAdvanced((x) => !x)}
        style={{ background: "transparent", border: "none", color: c.textDim, fontSize: type.sm, fontWeight: 600, cursor: "pointer", padding: `0 0 ${space.md}px` }}
      >
        {showAdvanced ? "▾ Advanced" : "▸ Advanced: models & key"}
      </button>

      {showAdvanced && (
        <Section>
          <Field label="Cleanup model" hint="OpenAI-compatible chat model id.">
            <TextInput value={s.cleanup_model} onChange={(e) => update("cleanup_model", e.target.value)} autoCapitalize="none" />
          </Field>
          <Field label="Speech model" hint="OpenAI-compatible transcription model id.">
            <TextInput value={s.speech_model} onChange={(e) => update("speech_model", e.target.value)} autoCapitalize="none" />
          </Field>
          <Field
            label="API key"
            hint="Only needed if the server has no key set. Stored on this device and sent to WhimprFlow's own backend, which proxies it — never to third parties directly."
          >
            <TextInput type="password" value={s.api_key} onChange={(e) => update("api_key", e.target.value)} placeholder="gsk_… or sk_…" autoCapitalize="none" />
          </Field>
          <Field label="API base URL" hint="Blank uses the backend default (Groq).">
            <TextInput value={s.api_base_url} onChange={(e) => update("api_base_url", e.target.value)} placeholder="https://api.groq.com/openai/v1" autoCapitalize="none" />
          </Field>
          <button
            onClick={() => { setS(DEFAULT_SETTINGS); setSettings(DEFAULT_SETTINGS); }}
            style={{ background: "transparent", border: "none", color: c.textMute, fontSize: type.sm, cursor: "pointer" }}
          >
            Reset to defaults
          </button>
        </Section>
      )}

      <p style={{ fontSize: type.micro + 1, color: c.textMute, textAlign: "center", lineHeight: 1.5, marginTop: space.md }}>
        Settings and history live only on this device.
      </p>
    </div>
  );
}

/**
 * The vault name is the one setting that fails silently — a typo just opens
 * Obsidian to nothing. So show the exact link being built, and offer to fire it.
 */
function ObsidianField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tested, setTested] = useState("");
  const trimmed = value.trim();

  return (
    <Field
      label="Obsidian vault name"
      hint="The exact vault name as it appears in Obsidian's sidebar — not a file path. Needs Obsidian installed on this device."
    >
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="My Vault"
        autoCapitalize="none"
      />
      {trimmed ? (
        <div style={{ marginTop: space.sm }}>
          <code
            style={{
              display: "block",
              fontSize: type.micro,
              fontFamily: font.mono,
              color: c.textMute,
              background: c.bgDeep,
              borderRadius: radius.sm,
              padding: "7px 9px",
              overflowWrap: "anywhere",
            }}
          >
            obsidian://new?vault={encodeURIComponent(trimmed)}&…
          </code>
          <button
            onClick={() => {
              const r = sendToObsidian(
                "This is a WhimprFlow test note. If you can read this, your vault link works.",
                trimmed,
              );
              setTested(r.message);
            }}
            style={{
              marginTop: space.sm,
              background: "transparent",
              border: `1px solid ${c.line}`,
              borderRadius: radius.sm,
              color: c.accent,
              fontSize: type.sm,
              fontWeight: 600,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Test link
          </button>
          {tested && (
            <span style={{ fontSize: type.micro + 1, color: c.textMute, marginLeft: space.sm }}>
              {tested}
            </span>
          )}
        </div>
      ) : null}
    </Field>
  );
}

/** One tap to find out whether the backend is actually configured. */
function ConnectionCheck() {
  const [state, setState] = useState<"idle" | "checking" | "done">("idle");
  const [result, setResult] = useState<Health | null>(null);

  async function check() {
    setState("checking");
    setResult(await health());
    setState("done");
  }

  return (
    <div>
      <button
        onClick={check}
        disabled={state === "checking"}
        style={{
          appearance: "none",
          background: "transparent",
          border: `1px solid ${c.line}`,
          borderRadius: radius.md,
          color: c.text,
          fontSize: type.body,
          fontWeight: 600,
          padding: "12px 18px",
          cursor: state === "checking" ? "default" : "pointer",
          width: "100%",
        }}
      >
        {state === "checking" ? "Checking…" : "Check connection"}
      </button>

      {state === "done" && (
        <div style={{ marginTop: space.md, fontSize: type.sm, lineHeight: 1.7 }}>
          {result === null ? (
            <span style={{ color: c.error }}>
              The backend didn't answer. If you're running the app locally, the /api routes need
              `vercel dev` or a deploy.
            </span>
          ) : (
            <>
              <StatusRow ok={result.speechKey} label="Speech key configured" />
              <StatusRow ok={result.llmKey} label="Cleanup key configured" />
              <StatusRow ok={result.pipeline} label="Cleanup pipeline loaded" />
              <div style={{ color: c.textMute, fontSize: type.micro + 1, marginTop: space.xs }}>
                Cleanup model: {result.cleanupModel}
              </div>
              {!result.ok && (
                <div style={{ color: c.warm, marginTop: space.xs }}>
                  Dictation still works for anything marked good above — a missing cleanup key just
                  means you get the raw transcript.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: space.sm, color: ok ? c.text : c.error }}>
      <span aria-hidden="true" style={{ fontWeight: 700 }}>{ok ? "✓" : "✕"}</span>
      <span>{label}</span>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ padding: `${space.xs}px 0 ${space.md}px` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
        <span style={{ fontSize: type.body, fontWeight: 600, color: c.text }}>{label}</span>
        <button
          role="switch"
          aria-checked={value}
          aria-label={label}
          onClick={() => onChange(!value)}
          style={{
            flexShrink: 0,
            width: 48,
            height: 28,
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: value ? c.accent : c.line,
            position: "relative",
            transition: `background 180ms ${ease}`,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: value ? 23 : 3,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: value ? c.onAccent : c.textHi,
              transition: `left 180ms ${ease}`,
            }}
          />
        </button>
      </div>
      {hint && (
        <div style={{ fontSize: type.micro + 1, color: c.textMute, marginTop: space.xs, lineHeight: 1.45, maxWidth: 300 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
