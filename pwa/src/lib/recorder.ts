// Browser mic capture: getUserMedia + MediaRecorder for the audio blob, plus a
// Web Audio AnalyserNode that emits RMS waveform bars (the same 0..1 bar shape
// the desktop overlay's DottedWaveform consumes, so the canvas is reused as-is).

export interface Recorder {
  stop(): Promise<Blob>;
  cancel(): void;
  mimeType: string;
}

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) {
      return c;
    }
  }
  return "";
}

/**
 * Start recording. `onBars` is called ~30fps with an array of normalized bar
 * heights (0..1) for the live waveform. Resolves once the mic is live.
 */
export async function startRecording(
  onBars: (bars: number[]) => void,
  barCount = 7,
): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickMimeType();
  const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  rec.start(100);

  // Waveform metering.
  const AudioCtx: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const buf = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;
  const tick = () => {
    analyser.getByteFrequencyData(buf);
    const step = Math.floor(buf.length / barCount) || 1;
    const bars: number[] = [];
    for (let b = 0; b < barCount; b += 1) {
      let sum = 0;
      for (let k = 0; k < step; k += 1) sum += buf[b * step + k] ?? 0;
      bars.push(Math.min(1, sum / step / 200));
    }
    onBars(bars);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const teardown = () => {
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((t) => t.stop());
    audioCtx.close().catch(() => {});
  };

  return {
    mimeType: rec.mimeType || mimeType || "audio/webm",
    stop(): Promise<Blob> {
      return new Promise((resolve) => {
        rec.onstop = () => {
          teardown();
          resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        };
        rec.stop();
      });
    },
    cancel(): void {
      try {
        rec.onstop = null;
        if (rec.state !== "inactive") rec.stop();
      } catch {
        /* ignore */
      }
      teardown();
    },
  };
}
