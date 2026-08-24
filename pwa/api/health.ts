// GET /api/health — a one-tap answer to "is the backend actually configured?".
// Reports only whether keys are present, never any key material, so it is safe
// to call from the client and safe to paste into a bug report.

const DEFAULT_BASE = "https://api.groq.com/openai/v1";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const speechKey = Boolean(process.env.SPEECH_API_KEY || process.env.WHIMPR_API_KEY);
  const llmKey = Boolean(process.env.LLM_API_KEY || process.env.WHIMPR_API_KEY);

  // Confirm the shared pipeline actually resolves at runtime. This is the exact
  // failure that took /api/cleanup down, so it is worth reporting explicitly.
  let pipeline = false;
  try {
    const mod = await import("../src/pipeline/index.js");
    pipeline = typeof mod.buildMessages === "function";
  } catch (e) {
    console.error("health: pipeline import failed —", e);
  }

  res.status(200).json({
    ok: speechKey && llmKey && pipeline,
    speechKey,
    llmKey,
    pipeline,
    speechBase: (process.env.SPEECH_BASE_URL || process.env.WHIMPR_BASE_URL || DEFAULT_BASE).replace(/\/$/, ""),
    llmBase: (process.env.LLM_BASE_URL || process.env.WHIMPR_BASE_URL || DEFAULT_BASE).replace(/\/$/, ""),
    cleanupModel: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
  });
}
