// POST /api/cleanup — run the shared cleanup pipeline (identical prompts to the
// desktop app) against an OpenAI-compatible chat endpoint, apply the
// deterministic gates + post-process, and fall back to the raw transcript on any
// gate failure or provider error. Returns { cleaned, usedRaw }.

import { buildMessages } from "../src/pipeline/pipeline";
import { preNormalizeLayout, postProcess } from "../src/pipeline/pipeline";
import { evaluate } from "../src/pipeline/gates";
import { bypassesLlm } from "../src/pipeline/levels";
import type { CleanupContext, CleanupLevel, VocabEntry } from "../src/pipeline/types";

const DEFAULT_BASE = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

interface Body {
  raw?: string;
  level?: CleanupLevel;
  vocab?: VocabEntry[];
  model?: string;
  appBundleId?: string | null;
  apiKey?: string;
  baseUrl?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body: Body = req.body || {};
  const raw = (body.raw || "").trim();
  const level: CleanupLevel = body.level || "light";
  if (!raw) {
    res.status(400).json({ error: "Missing transcript." });
    return;
  }

  // None bypasses the model entirely — return the raw transcript verbatim.
  if (bypassesLlm(level)) {
    res.status(200).json({ cleaned: raw, usedRaw: true });
    return;
  }

  const serverKey = process.env.LLM_API_KEY || process.env.WHIMPR_API_KEY || "";
  const apiKey = serverKey || body.apiKey || "";
  if (!apiKey) {
    res.status(400).json({
      error:
        "No API key configured. Set LLM_API_KEY (or WHIMPR_API_KEY) on the server, or add a key in the app's Settings.",
    });
    return;
  }

  const base = (body.baseUrl || process.env.LLM_BASE_URL || process.env.WHIMPR_BASE_URL || DEFAULT_BASE).replace(
    /\/$/,
    "",
  );
  const model = body.model || process.env.LLM_MODEL || DEFAULT_MODEL;

  const normalized = preNormalizeLayout(raw);
  const ctx: CleanupContext = {
    level,
    vocab: Array.isArray(body.vocab) ? body.vocab.slice(0, 15) : [],
    appBundleId: body.appBundleId ?? null,
    windowContext: null,
  };
  const messages = buildMessages(normalized, ctx);

  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 800 }),
    });

    if (!upstream.ok) {
      // Cleanup is never a hard gate — hand back the raw transcript.
      res.status(200).json({ cleaned: raw, usedRaw: true });
      return;
    }
    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const cleaned = postProcess(content);

    if (!cleaned.trim()) {
      res.status(200).json({ cleaned: raw, usedRaw: true });
      return;
    }
    // Gate against the RAW spoken transcript (before layout normalization).
    const verdict = evaluate(raw, cleaned, level);
    if (!verdict.pass) {
      res.status(200).json({ cleaned: raw, usedRaw: true });
      return;
    }
    res.status(200).json({ cleaned, usedRaw: false });
  } catch {
    res.status(200).json({ cleaned: raw, usedRaw: true });
  }
}
