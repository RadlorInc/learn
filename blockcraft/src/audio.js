// Tiny synthesized sound effects (WebAudio) — no audio files.
export class Audio {
  constructor() { this.ctx = null; this.vol = 0.5; }
  unlock() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  burst(freq, q, dur, gain, type = 'bandpass') {
    const c = this.ctx; if (!c || !this.vol) return;
    const src = c.createBufferSource(); src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); const t = c.currentTime;
    g.gain.setValueAtTime(gain * this.vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t, Math.random() * 0.5, dur);
  }
  tone(freq, dur, gain, type = 'sine', slide = 0) {
    const c = this.ctx; if (!c || !this.vol) return;
    const o = c.createOscillator(); o.type = type; const t = c.currentTime;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(gain * this.vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
  }
  material(kind, strength = 1) {
    const M = { stone: [900, 1.2], wood: [450, 2], grass: [1400, 0.7], sand: [3000, 0.5], snow: [2500, 0.6], glass: [3500, 3], wool: [700, 0.5] };
    const [f, q] = M[kind] || M.stone;
    this.burst(f, q, 0.12 * strength, 0.5 * strength);
    if (kind === 'wood') this.tone(180, 0.08, 0.15 * strength, 'triangle');
  }
  dig(kind) { this.material(kind, 0.6); }
  broke(kind) { this.material(kind, 1.2); if (kind === 'glass') this.tone(1800, 0.25, 0.2, 'triangle', -900); }
  place(kind) { this.material(kind, 1); }
  step(kind) { this.material(kind, 0.35); }
  pop() { this.tone(600 + Math.random() * 400, 0.08, 0.15, 'sine', 400); }
  hurt() { this.tone(220, 0.25, 0.35, 'square', -120); }
  eat() { for (let i = 0; i < 3; i++) setTimeout(() => this.burst(1200, 1, 0.08, 0.4), i * 120); }
  click() { this.tone(900, 0.03, 0.08, 'square'); }
  splash() { this.burst(1500, 0.4, 0.4, 0.5, 'lowpass'); }
  moo(pitch = 1) { this.tone(140 * pitch, 0.5, 0.2, 'sawtooth', -30); }
  boom() { this.burst(120, 0.4, 1.4, 1.2, 'lowpass'); this.tone(60, 0.8, 0.5, 'sine', -30); }
  rainLevel(v) {
    const c = this.ctx; if (!c) return;
    if (!this.rain) {
      const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      this.rain = c.createGain(); this.rain.gain.value = 0;
      src.connect(f).connect(this.rain).connect(c.destination); src.start();
    }
    this.rain.gain.value = v * 0.12 * this.vol;
  }
}
