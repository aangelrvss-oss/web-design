// Tiny synthesized sound kit (Web Audio, no files, no network). Muted by default.
// Sounds are tied to PUBLIC moments only (phase changes everyone sees at once),
// never to a private role, so nothing leaks to people sitting nearby.
import { getPrefs } from './prefs';

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (!getPrefs().sound) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(c: AudioContext, dur: number, gain: number, freq: number, at = 0) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination);
  src.start(c.currentTime + at);
}

function tone(c: AudioContext, freq: number, dur: number, gain: number, at = 0, type: OscillatorType = 'sine') {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + at;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  /** Rubber stamp thump: locking an alibi, casting a vote, the verdict. */
  stamp() {
    const c = ac();
    if (!c) return;
    tone(c, 90, 0.18, 0.5, 0, 'triangle');
    noise(c, 0.12, 0.6, 900);
  },
  /** Paper slide: new evidence, phase change. */
  paper() {
    const c = ac();
    if (!c) return;
    noise(c, 0.35, 0.35, 2600);
  },
  /** Soft tick for the last seconds. */
  tick() {
    const c = ac();
    if (!c) return;
    tone(c, 1400, 0.05, 0.08, 0, 'square');
  },
  /** Small two-note chime: everyone's alibis flip. */
  reveal() {
    const c = ac();
    if (!c) return;
    tone(c, 523, 0.25, 0.18);
    tone(c, 784, 0.4, 0.16, 0.12);
  },
  /** Result sting, same for every outcome (the stamp says who won). */
  verdict() {
    const c = ac();
    if (!c) return;
    tone(c, 220, 0.6, 0.2, 0, 'sawtooth');
    tone(c, 330, 0.6, 0.12, 0.05, 'triangle');
    noise(c, 0.2, 0.5, 700, 0.05);
  },
};

/** Must be called from a user gesture once, to unlock audio on iOS. */
export function unlockAudio(): void {
  const c = ac();
  if (c) tone(c, 440, 0.01, 0.0001);
}
