// Every sound is synthesised here: no audio files and no music, only short sound effects.
let ac = null, out = null, noiseBuf = null;
const MUTE_KEY = 'rush.muted';
let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } })();

export function init() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  out = ac.createGain(); out.gain.value = muted ? 0 : 0.5; out.connect(ac.destination);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* private mode */ }
  if (out) out.gain.value = muted ? 0 : 0.5;
}

function tone(f, t, d, type = 'square', v = 0.15, f2 = 0) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g).connect(out); o.start(t); o.stop(t + d + 0.02);
}
function noise(t, d, v, hp) {
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + d);
}
const now = () => ac.currentTime;
const ok = () => ac && !muted;

export const sfx = {
  coin: (n = 1) => { if (ok()) { const f = 990 * 2 ** (Math.min(n - 1, 8) / 12); tone(f, now(), 0.07, 'sine', 0.12); tone(f * 1.5, now() + 0.05, 0.1, 'sine', 0.1); } },
  clock: () => { if (ok()) [660, 880, 1100].forEach((f, i) => tone(f, now() + i * 0.06, 0.12, 'triangle', 0.13)); },
  // the siren: two tones, up and down, for as long as it sounds
  siren: (secs) => { if (ok()) for (let k = 0; k < secs * 2; k++) tone(k % 2 ? 650 : 900, now() + k * 0.5, 0.48, 'sawtooth', 0.05); },
  crash: () => { if (ok()) { noise(now(), 0.35, 0.3, 150); tone(180, now(), 0.3, 'square', 0.12, 60); } },
  win: () => { if (ok()) [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, now() + i * 0.11, 0.25, 'triangle', 0.15)); },
  fail: () => { if (ok()) [440, 370, 311, 262].forEach((f, i) => tone(f, now() + i * 0.14, 0.22, 'triangle', 0.12)); },
  buy: () => { if (ok()) [660, 880, 1320].forEach((f, i) => tone(f, now() + i * 0.07, 0.15, 'sine', 0.12)); },
};
