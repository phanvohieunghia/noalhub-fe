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

/**
 * The pick sound: a soft, dry "pop", fitted to a measured sample.
 *
 * What the sample is, frame by frame (2ms steps): **one pitched sine**, not a click
 * and not a chord — everything above ~1.6kHz is 40dB down. Its pitch glides up from
 * ~580Hz to ~900Hz over the first 13ms (the "pop"), then relaxes to ~830Hz; the
 * level rises over ~5ms, holds a moment, and is down to a few percent by 22ms. After
 * that only a faint ~770Hz ring-down remains, for roughly 100ms.
 *
 * This is built from exactly those curves: one sine with the glide, the measured
 * amplitude envelope, and a quiet second sine for the ring-down.
 *
 * Picking again (un-ticking a multiple-choice option) is the same pop a minor
 * third lower and softer, so the two directions can be told apart by ear.
 */
export function playSelect(on = true) {
  const audio = context();
  if (!audio) return;
  const pitch = on ? 1 : 0.8;
  const t0 = audio.currentTime;
  const master = audio.createGain();
  master.gain.value = on ? 0.8 : 0.5;
  master.connect(audio.destination);

  // The pop: a sine gliding 580 → 900 → 830Hz under the measured envelope.
  const osc = audio.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(580 * pitch, t0);
  osc.frequency.exponentialRampToValueAtTime(900 * pitch, t0 + 0.014);
  osc.frequency.exponentialRampToValueAtTime(830 * pitch, t0 + 0.05);
  const amp = audio.createGain();
  const envelope: [number, number][] = [
    [0, 0],
    [0.002, 0.12],
    [0.004, 0.38],
    [0.006, 0.57],
    [0.008, 0.57],
    [0.01, 0.42],
    [0.012, 0.24],
    [0.014, 0.23],
    [0.016, 0.19],
    [0.018, 0.09],
    [0.02, 0.055],
    [0.022, 0.03],
    [0.031, 0.026],
    [0.061, 0.012],
    [0.2, 0],
  ];
  amp.gain.setValueAtTime(0, t0);
  for (const [at, value] of envelope)
    amp.gain.linearRampToValueAtTime(value, t0 + at);
  osc.connect(amp).connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.21);

  // Ring-down: a quiet sine near 770Hz that fades in under the pop and rings out.
  const ring = audio.createOscillator();
  ring.type = "sine";
  ring.frequency.value = 770 * pitch;
  const ringAmp = audio.createGain();
  ringAmp.gain.setValueAtTime(0, t0 + 0.007);
  ringAmp.gain.linearRampToValueAtTime(0.025, t0 + 0.013);
  ringAmp.gain.setTargetAtTime(0, t0 + 0.013, 0.05);
  ring.connect(ringAmp).connect(master);
  ring.start(t0 + 0.007);
  ring.stop(t0 + 0.3);
}

type Overtone = {
  freq: number;
  gain: number;
  decay: number;
  attack?: number;
  /** The bar keeps swelling for a moment after the hit: it starts at this share of `gain` and reaches it over `swell` seconds. */
  swell?: { from: number; over: number };
};

/**
 * One struck glockenspiel bar: a set of sines, each rising over `attack` seconds and
 * then dying away exponentially with its own time constant `decay` (seconds).
 * A bar is not a string — its overtones are not whole multiples of the pitch — so
 * every partial carries its own frequency instead of deriving it from the first.
 */
function strike(
  audio: AudioContext,
  out: AudioNode,
  start: number,
  partials: Overtone[],
) {
  const t0 = audio.currentTime + start;
  for (const { freq, gain, decay, attack = 0.003, swell } of partials) {
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0, t0);
    const settle = swell ? attack + swell.over : attack;
    amp.gain.linearRampToValueAtTime(
      swell ? gain * swell.from : gain,
      t0 + attack,
    );
    if (swell) amp.gain.linearRampToValueAtTime(gain, t0 + settle);
    amp.gain.setTargetAtTime(0, t0 + settle, decay);
    osc.connect(amp).connect(out);
    osc.start(t0);
    osc.stop(t0 + settle + decay * 7);
  }
}

/**
 * The success cue: a glockenspiel "ding-ding", fitted to a measured sample.
 *
 * What the sample is: two bar strikes 140ms apart — A6 (1757Hz) then D7 (2367Hz),
 * a perfect fourth up — both left to ring together for ~1.5s. Each strike is very
 * bright: at the hit the 5.2× overtone (~9.1kHz) is louder than the pitch itself and
 * dies within ~40ms, a 2.7× overtone (4.8kHz / 6.4kHz) lasts ~100ms, and only the
 * pitch rings on (time constant ≈ 0.26s for A6, ≈ 0.34s for D7, fitted to the level at 400–1000ms). The levels and time
 * constants below are measured from it, partial by partial.
 */
export function playCorrect() {
  const audio = context();
  if (!audio) return;
  const master = audio.createGain();
  master.gain.value = 1.6;
  master.connect(audio.destination);

  strike(audio, master, 0, [
    {
      freq: 1757,
      gain: 0.083,
      decay: 0.26,
      attack: 0.012,
      swell: { from: 0.8, over: 0.07 },
    },
    { freq: 4781, gain: 0.016, decay: 0.15 },
    { freq: 9140, gain: 0.09, decay: 0.035 },
    { freq: 8296, gain: 0.013, decay: 0.02 },
    { freq: 3530, gain: 0.01, decay: 0.01, attack: 0.001 },
  ]);
  strike(audio, master, 0.14, [
    { freq: 2367, gain: 0.0275, decay: 0.34, attack: 0.012 },
    { freq: 6375, gain: 0.04, decay: 0.08 },
    { freq: 8296, gain: 0.013, decay: 0.05 },
  ]);
}

/**
 * A wrong answer: a clarinet-like "uh-oh" — two steady reed notes falling a minor
 * third (G4 then E4).
 *
 * Deliberately not a bell: the correct cue is a high, bright glockenspiel, so a
 * wrong answer is told apart by timbre as well as by direction. The notes are held
 * (no glide, no noise) in the 300–400Hz range, where the ear hears pitch most easily.
 * The reed's hollow sound comes from odd harmonics only — a square wave through a
 * lowpass at ~1kHz.
 */
export function playWrong() {
  const audio = context();
  if (!audio) return;

  const note = (
    freq: number,
    start: number,
    duration: number,
    cutoff: number,
    release: number,
  ) => {
    const t0 = audio.currentTime + start;
    const osc = audio.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const amp = audio.createGain();
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.linearRampToValueAtTime(0.1, t0 + 0.03);
    amp.gain.setValueAtTime(0.1, t0 + duration - release);
    amp.gain.linearRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(filter).connect(amp).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  };

  note(392, 0, 0.2, 1100, 0.06);
  note(330, 0.2, 0.34, 1000, 0.14);
}
