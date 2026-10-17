/**
 * Quiz sound cues, synthesised with Web Audio so there are no asset files.
 *
 * Browsers only let an AudioContext start after a user gesture; every cue here
 * is triggered by a tap or key press (the verdict plays right after the answer
 * was sent from one), and any failure is swallowed — sound is garnish.
 */
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new window.AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  audio: AudioContext,
  { freq, start, duration, type = "sine", gain = 0.15 }: {
    freq: number;
    start: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
  },
) {
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  const t0 = audio.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Short tick when an option is picked. */
export function playSelect() {
  const audio = context();
  if (!audio) return;
  tone(audio, { freq: 660, start: 0, duration: 0.06, type: "triangle", gain: 0.1 });
}

/** Rising two-note chime for a right answer. */
export function playCorrect() {
  const audio = context();
  if (!audio) return;
  tone(audio, { freq: 784, start: 0, duration: 0.14 });
  tone(audio, { freq: 1175, start: 0.12, duration: 0.28 });
}

/** Low falling buzz for a wrong answer. */
export function playWrong() {
  const audio = context();
  if (!audio) return;
  tone(audio, { freq: 220, start: 0, duration: 0.18, type: "sawtooth", gain: 0.08 });
  tone(audio, { freq: 160, start: 0.16, duration: 0.3, type: "sawtooth", gain: 0.08 });
}
