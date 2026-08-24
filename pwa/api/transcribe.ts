// POST /api/transcribe — proxy raw audio bytes to an OpenAI-compatible speech
// endpoint (Groq whisper-large-v3 by default) and return { text }. The key lives
// server-side (env), with an optional per-request key from the client used only
// when no server key is configured.
//
// The client sends the raw audio as the request body with metadata in headers,
// so this function never has to parse inbound multipart.

export const config = { api: { bodyParser: false } };

const DEFAULT_BASE = "https://api.groq.com/openai/v1";

function extFor(contentType: string): string {
  if (contentType.includes("mp4") || contentType.includes("m4a")) return "mp4";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("ogg")) return "ogg";
  return "webm";
}

async function readBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const serverKey = process.env.SPEECH_API_KEY || process.env.WHIMPR_API_KEY || "";
  const clientKey = (req.headers["x-api-key"] as string) || "";
  const apiKey = serverKey || clientKey;
  if (!apiKey) {
    res.status(400).json({
      error:
        "No API key configured. Set SPEECH_API_KEY (or WHIMPR_API_KEY) on the server, or add a key in the app's Settings.",
    });
    return;
  }

  const base = (
    (req.headers["x-base-url"] as string) ||
    process.env.SPEECH_BASE_URL ||
    process.env.WHIMPR_BASE_URL ||
    DEFAULT_BASE
  ).replace(/\/$/, "");
  const model = (req.headers["x-model"] as string) || "whisper-large-v3";
  const contentType = (req.headers["content-type"] as string) || "audio/webm";

  try {
    const audio = await readBody(req);
    if (audio.length === 0) {
      res.status(400).json({ error: "Empty audio." });
      return;
    }

    const form = new FormData();
    const blob = new Blob([new Uint8Array(audio)], { type: contentType });
    form.append("file", blob, `dictation.${extFor(contentType)}`);
    form.append("model", model);
    form.append("response_format", "json");

    const upstream = await fetch(`${base}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(upstream.status).json({ error: `Transcription failed: ${detail.slice(0, 400)}` });
      return;
    }
    const data = (await upstream.json()) as { text?: string };
    res.status(200).json({ text: (data.text || "").trim() });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Transcription error" });
  }
}
