import { useState } from "react";
import { c, type, space, ease } from "../tokens";
import { PageTitle, Segmented, TextInput, Field, Section } from "../components/ui";
import { getSettings, setSettings, DEFAULT_SETTINGS, type Settings, type TargetMedium } from "../lib/store";
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
      <PageTitle sub="Cleanup, destinations, and connection">Settings</PageTitle>

      <Section title="Cleanup">
        <Field label="How much to edit" hint="Light is conservative: fillers and punctuation only. Raw skips the AI entirely.">
          <Segmented<CleanupLevel>
            value={s.cleanup_level}
            onChange={(v) => update("cleanup_level", v)}
            options={[
              { value: "none", label: "Raw" },
              { value: "light", label: "Light" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
        </Field>
        <Field label="Shape it for" hint="Adjusts tone and structure for where the text is headed.">
          <Segmented<TargetMedium>
            value={s.target_medium}
            onChange={(v) => update("target_medium", v)}
            options={[
              { value: "none", label: "Any" },
              { value: "email", label: "Email" },
              { value: "sms", label: "Text" },
              { value: "chat", label: "Chat" },
              { value: "docs", label: "Notes" },
            ]}
          />
        </Field>
      </Section>

      <Section title="Destinations">
        <Field label="Obsidian vault name" hint="Used by the Obsidian button (obsidian:// deep link). Needs the app installed.">
          <TextInput value={s.obsidian_vault} onChange={(e) => update("obsidian_vault", e.target.value)} placeholder="My Vault" />
        </Field>
        <Field label="n8n / automation webhook" hint="The Webhook button POSTs the transcript JSON here.">
          <TextInput
            value={s.webhook_url}
            onChange={(e) => update("webhook_url", e.target.value)}
            placeholder="https://…/webhook/…"
            inputMode="url"
            autoCapitalize="none"
          />
        </Field>
        <ToggleRow label="Sound on start" value={s.sound_on_start} onChange={(v) => update("sound_on_start", v)} />
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

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${space.xs}px 0 ${space.md}px` }}>
      <span style={{ fontSize: type.body, fontWeight: 600, color: c.text }}>{label}</span>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        style={{
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
            background: c.textHi,
            transition: `left 180ms ${ease}`,
          }}
        />
      </button>
    </div>
  );
}
