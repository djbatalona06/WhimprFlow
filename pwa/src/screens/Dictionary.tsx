import { useState } from "react";
import { c, font, type, space } from "../tokens";
import { Panel, PageTitle, Button, TextInput, Field } from "../components/ui";
import { getDictionary, addDictionaryEntry, removeDictionaryEntry, type DictEntry } from "../lib/store";

export function DictionaryScreen() {
  const [entries, setEntries] = useState<DictEntry[]>(() => getDictionary());
  const [correct, setCorrect] = useState("");
  const [mishears, setMishears] = useState("");

  function add() {
    const cor = correct.trim();
    if (!cor) return;
    const m = mishears.split(",").map((x) => x.trim()).filter(Boolean);
    setEntries(addDictionaryEntry(cor, m));
    setCorrect("");
    setMishears("");
  }

  return (
    <div>
      <PageTitle sub="Names and terms the model should spell your way">Custom Words</PageTitle>

      <Panel style={{ marginBottom: space.xl }}>
        <Field label="Correct spelling">
          <TextInput value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="e.g. ChargeBee" />
        </Field>
        <Field label="Also heard as" hint="Comma-separated mishears the recognizer produces.">
          <TextInput value={mishears} onChange={(e) => setMishears(e.target.value)} placeholder="charge bee, chargebee" />
        </Field>
        <Button onClick={add} disabled={!correct.trim()}>
          Add word
        </Button>
      </Panel>

      {entries.length === 0 ? (
        <p style={{ color: c.textMute, fontSize: type.body, textAlign: "center", lineHeight: 1.6, marginTop: 40 }}>
          No custom words yet. Add the names and terms the recognizer keeps getting wrong.
        </p>
      ) : (
        entries.map((e, i) => (
          <div
            key={e.correct}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `${space.md}px 0`,
              borderTop: i === 0 ? "none" : `1px solid ${c.line}`,
            }}
          >
            <div>
              <div style={{ fontSize: type.lg, fontWeight: 600, color: c.textHi, fontFamily: font.ui }}>
                {e.correct} {e.auto && <span title="Auto-learned">✨</span>}
              </div>
              {e.mishears.length > 0 && (
                <div style={{ fontSize: type.sm, color: c.textMute, marginTop: 2 }}>heard as: {e.mishears.join(", ")}</div>
              )}
            </div>
            <button
              aria-label={`Remove ${e.correct}`}
              onClick={() => setEntries(removeDictionaryEntry(e.correct))}
              style={{ background: "transparent", border: "none", color: c.textMute, fontSize: 24, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
}
