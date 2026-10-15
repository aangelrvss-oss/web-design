import type { Settings } from '../core/save';

/**
 * All sound is synthesized with the Web Audio API — no files, no network.
 * The context is created lazily on the first user gesture (autoplay policy), and every
 * call is a no-op until then, so nothing throws on startup.
 */
type Sfx =
  | 'shoot' | 'hit' | 'crit' | 'kill' | 'eliteKill' | 'pickup' | 'levelup' | 'select' | 'dash' | 'hurt'
  | 'boom' | 'zap' | 'missile' | 'explode' | 'bossWarn' | 'bossRoar' | 'victory' | 'defeat' | 'uiMove'
  | 'uiClick' | 'overdrive' | 'heal' | 'crate' | 'enemyShot' | 'slam' | 'deny' | 'telegraph' | 'synergy';

const MIN_GAP: Partial<Record<Sfx, number>> = {
  shoot: 0.045, hit: 0.03, crit: 0.05, kill: 0.035, pickup: 0.03, zap: 0.06, missile: 0.08, explode: 0.05,
  enemyShot: 0.08, uiMove: 0.03, telegraph: 0.15, heal: 0.1,
};

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noise!: AudioBuffer;
  private last: Partial<Record<Sfx, number>> = {};
  private voices = 0;
  private settings: Settings | null = null;
  readonly music = new Music(this);

  /** Call from a real user gesture handler. Safe to call repeatedly. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC({ latencyHint: 'interactive' });
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.knee.value = 10;
        comp.ratio.value = 5;
        this.master = this.ctx.createGain();
        this.sfxBus = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();
        this.sfxBus.connect(this.master);
        this.musicBus.connect(this.master);
        this.master.connect(comp).connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        if (this.settings) this.apply(this.settings);
        this.music.attach(this.ctx, this.musicBus, this.noise);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  apply(s: Settings): void {
    this.settings = s;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.02);
    this.sfxBus.gain.setTargetAtTime(s.sfx * 0.9, t, 0.02);
    this.musicBus.gain.setTargetAtTime(s.music * 0.55, t, 0.05);
  }

  suspend(): void {
    if (this.ctx?.state === 'running') void this.ctx.suspend();
  }
  resume(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  private ok(name: Sfx): boolean {
    if (!this.ctx || this.ctx.state !== 'running') return false;
    const now = this.ctx.currentTime;
    const gap = MIN_GAP[name] ?? 0;
    if (now - (this.last[name] ?? -1) < gap) return false;
    if (this.voices > 26) return false;
    this.last[name] = now;
    return true;
  }

  private env(g: GainNode, t: number, a: number, peak: number, d: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private track(node: AudioScheduledSourceNode, end: number) {
    this.voices++;
    node.onended = () => { this.voices--; };
    node.stop(end);
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0, detune = 0) {
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.detune.value = detune;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    this.env(g, t, 0.004, vol, dur);
    o.connect(g).connect(this.sfxBus);
    o.start(t);
    this.track(o, t + dur + 0.05);
  }

  private hiss(dur: number, vol: number, freq: number, q = 1, type: BiquadFilterType = 'bandpass', delay = 0, sweepTo?: number) {
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    this.env(g, t, 0.003, vol, dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t, Math.random() * 0.5);
    this.track(src, t + dur + 0.05);
  }

  play(name: Sfx, p = 1): void {
    if (!this.ok(name)) return;
    const j = 1 + (Math.random() - 0.5) * 0.08; // small pitch variation keeps repeats alive
    switch (name) {
      case 'shoot': this.tone('square', 980 * j * p, 420, 0.06, 0.05); this.hiss(0.03, 0.04, 4000, 2); break;
      case 'hit': this.tone('triangle', 300 * j, 120, 0.05, 0.07); break;
      case 'crit': this.tone('square', 1500 * j, 600, 0.08, 0.06); this.tone('triangle', 2200 * j, 1800, 0.06, 0.04, 0.02); break;
      case 'kill': this.hiss(0.09, 0.14, 1400 * j, 1.2, 'bandpass', 0, 300); this.tone('sine', 220 * j, 60, 0.08, 0.1); break;
      case 'eliteKill':
        this.hiss(0.5, 0.3, 900, 0.8, 'lowpass', 0, 120);
        this.tone('sawtooth', 180, 40, 0.5, 0.2);
        [523, 659, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.1, 0.05, 0.08 + i * 0.06));
        break;
      case 'pickup': this.tone('sine', 880 * p, 1320 * p, 0.06, 0.06); break;
      case 'levelup':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f * 1.01, 0.12, 0.06, i * 0.055));
        this.tone('sine', 262, 262, 0.5, 0.08, 0);
        break;
      case 'select': this.tone('square', 660, 1320, 0.12, 0.07); this.hiss(0.2, 0.08, 3000, 0.7, 'highpass', 0.02); break;
      case 'dash': this.hiss(0.18, 0.16, 600, 0.9, 'bandpass', 0, 3500); break;
      case 'hurt': this.tone('sawtooth', 240, 70, 0.22, 0.17); this.hiss(0.14, 0.15, 900, 1.5); break;
      case 'boom':
        // the deep "boom" that every meme edit needs
        this.tone('sine', 120, 38, 0.65, 0.4);
        this.tone('triangle', 240, 50, 0.25, 0.15);
        this.hiss(0.3, 0.16, 400, 0.6, 'lowpass', 0, 80);
        break;
      case 'zap': this.hiss(0.12, 0.12, 5000, 4, 'bandpass', 0, 1500); this.tone('sawtooth', 1800, 300, 0.1, 0.04); break;
      case 'missile': this.tone('triangle', 500, 900, 0.12, 0.04); break;
      case 'explode': this.hiss(0.25, 0.2, 1200, 0.7, 'lowpass', 0, 150); this.tone('sine', 140, 45, 0.22, 0.14); break;
      case 'enemyShot': this.tone('sawtooth', 340, 180, 0.14, 0.05); break;
      case 'slam': this.tone('sine', 90, 30, 0.5, 0.35); this.hiss(0.4, 0.22, 500, 0.6, 'lowpass', 0, 60); break;
      case 'telegraph': this.tone('square', 880, 880, 0.07, 0.035); this.tone('square', 660, 660, 0.07, 0.035, 0.09); break;
      case 'bossWarn':
        for (let i = 0; i < 3; i++) { this.tone('sawtooth', 440, 880, 0.35, 0.09, i * 0.5); this.tone('sawtooth', 446, 890, 0.35, 0.07, i * 0.5); }
        break;
      case 'bossRoar':
        this.tone('sawtooth', 110, 55, 1.1, 0.25, 0, 0);
        this.tone('sawtooth', 112, 50, 1.1, 0.2, 0, 15);
        this.hiss(1, 0.18, 300, 0.5, 'lowpass', 0, 80);
        break;
      case 'victory':
        [392, 523, 659, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.22, 0.07, i * 0.12));
        [523, 659, 784].forEach((f) => this.tone('triangle', f, f, 1.2, 0.06, 0.65));
        break;
      case 'defeat':
        [392, 349, 311, 262].forEach((f, i) => this.tone('triangle', f, f * 0.98, 0.3, 0.09, i * 0.22));
        this.tone('sawtooth', 130, 40, 1.2, 0.12, 0.8);
        break;
      case 'uiMove': this.tone('triangle', 1200, 1200, 0.03, 0.03); break;
      case 'uiClick': this.tone('square', 900, 1400, 0.05, 0.05); break;
      case 'deny': this.tone('square', 200, 160, 0.12, 0.06); break;
      case 'overdrive':
        this.hiss(0.9, 0.2, 200, 1, 'bandpass', 0, 8000);
        [440, 554, 659, 880].forEach((f, i) => this.tone('sawtooth', f, f * 2, 0.4, 0.05, i * 0.05));
        break;
      case 'heal': [660, 880, 1100].forEach((f, i) => this.tone('sine', f, f, 0.12, 0.06, i * 0.05)); break;
      case 'crate': [784, 988, 1175, 1568].forEach((f, i) => this.tone('square', f, f, 0.08, 0.05, i * 0.04)); break;
      case 'synergy':
        [523, 784, 1047, 1568, 2093].forEach((f, i) => this.tone('triangle', f, f, 0.3, 0.06, i * 0.07));
        this.hiss(0.6, 0.08, 6000, 0.7, 'highpass', 0.1);
        break;
    }
  }
}

/**
 * Procedural soundtrack: a 16-step sequencer (A minor, i–VI–III–VII) scheduled ahead with a
 * lookahead timer. `intensity` adds layers (0 menu → 3 boss); overdrive opens the filter.
 */
export class Music {
  private ctx: AudioContext | null = null;
  private out!: GainNode;
  private filter!: BiquadFilterNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private bpm = 128;
  intensity = 0;
  private boosted = false;
  private playing = false;

  constructor(private readonly engine: AudioEngine) {}

  attach(ctx: AudioContext, bus: GainNode, noise: AudioBuffer) {
    this.ctx = ctx;
    this.noise = noise;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2400;
    this.out = ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(this.filter).connect(bus);
    if (this.playing) this.startLoop();
  }

  start(intensity: number) {
    this.intensity = intensity;
    this.playing = true;
    if (this.ctx) this.startLoop();
  }

  private startLoop() {
    if (!this.ctx || this.timer !== null) return;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stop() {
    this.playing = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  setIntensity(i: number) {
    this.intensity = i;
    this.bpm = i >= 3 ? 140 : 128;
  }

  setBoost(on: boolean) {
    if (!this.ctx || on === this.boosted) return;
    this.boosted = on;
    this.filter.frequency.setTargetAtTime(on ? 9000 : 2400, this.ctx.currentTime, 0.2);
  }

  /** Low-pass "underwater" duck while paused / in menus over gameplay. */
  duck(on: boolean) {
    if (!this.ctx) return;
    this.filter.frequency.setTargetAtTime(on ? 500 : this.boosted ? 9000 : 2400, this.ctx.currentTime, 0.08);
  }

  private schedule() {
    const c = this.ctx;
    if (!c) return;
    // after a long stall (tab hidden) skip ahead instead of bursting notes
    if (this.nextTime < c.currentTime - 0.2) this.nextTime = c.currentTime + 0.05;
    const stepDur = 60 / this.bpm / 4;
    while (this.nextTime < c.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  private note(type: OscillatorType, freq: number, t: number, dur: number, vol: number, cutoff = 0, detune = 0) {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (cutoff) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(cutoff * 2.5, t);
      f.frequency.exponentialRampToValueAtTime(cutoff, t + dur * 0.7);
      o.connect(f).connect(g);
    } else o.connect(g);
    g.connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private drum(kind: 'kick' | 'snare' | 'hat', t: number, vol: number) {
    const c = this.ctx!;
    if (kind === 'kick') {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(this.out);
      o.start(t);
      o.stop(t + 0.25);
      return;
    }
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = kind === 'hat' ? 'highpass' : 'bandpass';
    f.frequency.value = kind === 'hat' ? 7000 : 1800;
    const g = c.createGain();
    const d = kind === 'hat' ? 0.04 : 0.14;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(this.out);
    s.start(t, Math.random() * 0.5);
    s.stop(t + d + 0.02);
  }

  private playStep(step: number, t: number, sd: number) {
    const I = this.intensity;
    const s16 = step % 16;
    const bar = Math.floor(step / 16) % 4;
    const roots = [55, 43.65, 65.41, 49]; // A1 F1 C2 G1
    const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
    const root = roots[bar];
    // pad: always, quiet; carries the menu
    if (s16 === 0) for (const f of chords[bar]) {
      this.note('sawtooth', f / 2, t, sd * 16, 0.018, 900, -8);
      this.note('sawtooth', f / 2, t, sd * 16, 0.018, 900, 8);
    }
    // arp
    const arp = chords[bar];
    if ((I === 0 && s16 % 4 === 2) || (I >= 2 && s16 % 2 === 0)) this.note('square', arp[(step >> 1) % 3] * 2, t, sd * 1.4, I === 0 ? 0.016 : 0.022, 3000);
    if (I >= 1) {
      if (s16 % 4 === 0) this.drum('kick', t, 0.55);
      const bassHits = [0, 3, 6, 8, 11, 14];
      if (bassHits.includes(s16)) this.note('sawtooth', s16 === 14 ? root * 1.5 : root, t, sd * 1.8, 0.09, 420);
    }
    if (I >= 2) {
      if (s16 % 4 === 2) this.drum('hat', t, 0.06);
      if (s16 === 4 || s16 === 12) this.drum('snare', t, 0.13);
    }
    if (I >= 3) {
      if (s16 % 2 === 1) this.drum('hat', t, 0.035);
      const lead = [0, 3, 5, 7, 10, 7, 5, 3];
      if (s16 % 2 === 0) this.note('sawtooth', root * 8 * Math.pow(2, lead[(s16 / 2) | 0] / 12), t, sd * 1.6, 0.025, 2600, 6);
    }
    void this.engine;
  }
}

export const audio = new AudioEngine();
