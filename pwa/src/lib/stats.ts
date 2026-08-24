// Dictation usage stats — words, speaking time, WPM, streaks, time saved.
// Ported from `crates/whimpr-core/src/stats.rs`. Pure functions over an array of
// session records; day/streak bucketing uses the browser's tz offset so day
// boundaries line up with the user's own clock.

/** Average typing speed (words/min) we compare speaking against for "time saved". */
const TYPING_WPM_BASELINE = 45.0;
const DAY_SECS = 86_400;

/** One completed dictation. */
export interface SessionRecord {
  /** Seconds since the Unix epoch (UTC) when the dictation was committed. */
  ts_unix: number;
  words: number;
  duration_ms: number;
  chars: number;
  text: string;
  app: string | null;
}

export interface HistoryItem {
  ts_unix: number;
  text: string;
  app: string | null;
  words: number;
}

export interface StatsSummary {
  total_words: number;
  total_sessions: number;
  total_speaking_secs: number;
  avg_wpm: number;
  best_wpm: number;
  words_today: number;
  wpm_today: number;
  day_streak: number;
  time_saved_secs: number;
  last7_words: number[];
}

export const EMPTY_STATS: StatsSummary = {
  total_words: 0,
  total_sessions: 0,
  total_speaking_secs: 0,
  avg_wpm: 0,
  best_wpm: 0,
  words_today: 0,
  wpm_today: 0,
  day_streak: 0,
  time_saved_secs: 0,
  last7_words: [0, 0, 0, 0, 0, 0, 0],
};

/** Count whitespace-delimited words. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Local calendar day index for a UTC timestamp, given the tz offset (JS getTimezoneOffset). */
function localDay(tsUnix: number, tzOffsetMinutes: number): number {
  const local = tsUnix - tzOffsetMinutes * 60;
  return Math.floor(local / DAY_SECS);
}

/** Words/min from words and a duration, rounded; 0 for empty/instant sessions. */
function wpm(words: number, secs: number): number {
  if (secs <= 0 || words === 0) return 0;
  return Math.round(words / (secs / 60));
}

export function history(sessions: SessionRecord[], limit: number): HistoryItem[] {
  const out: HistoryItem[] = [];
  for (let i = sessions.length - 1; i >= 0 && out.length < limit; i -= 1) {
    const s = sessions[i];
    if (s.text.length === 0) continue;
    out.push({ ts_unix: s.ts_unix, text: s.text, app: s.app, words: s.words });
  }
  return out;
}

/** Aggregate everything the dashboard shows. */
export function summary(
  sessions: SessionRecord[],
  tzOffsetMinutes: number,
  nowUnix: number,
): StatsSummary {
  const total_words = sessions.reduce((a, s) => a + s.words, 0);
  const total_sessions = sessions.length;
  const total_speaking_secs = sessions.reduce((a, s) => a + s.duration_ms / 1000, 0);

  const avg_wpm = wpm(total_words, total_speaking_secs);

  let best_wpm = 0;
  for (const s of sessions) {
    if (s.words >= 3 && s.duration_ms >= 1000) {
      best_wpm = Math.max(best_wpm, wpm(s.words, s.duration_ms / 1000));
    }
  }

  const today = localDay(nowUnix, tzOffsetMinutes);
  let words_today = 0;
  let secs_today = 0;
  const last7_words = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessions) {
    const day = localDay(s.ts_unix, tzOffsetMinutes);
    if (day === today) {
      words_today += s.words;
      secs_today += s.duration_ms / 1000;
    }
    const ago = today - day;
    if (ago >= 0 && ago < 7) {
      last7_words[6 - ago] += s.words;
    }
  }
  const wpm_today = wpm(words_today, secs_today);

  const active = new Set(sessions.map((s) => localDay(s.ts_unix, tzOffsetMinutes)));
  let day_streak = 0;
  let d = active.has(today) ? today : today - 1;
  while (active.has(d)) {
    day_streak += 1;
    d -= 1;
  }

  const typed_secs = (total_words / TYPING_WPM_BASELINE) * 60;
  const time_saved_secs = Math.max(typed_secs - total_speaking_secs, 0);

  return {
    total_words,
    total_sessions,
    total_speaking_secs,
    avg_wpm,
    best_wpm,
    words_today,
    wpm_today,
    day_streak,
    time_saved_secs,
    last7_words,
  };
}
