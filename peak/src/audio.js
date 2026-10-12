// Every sound is synthesised here: no audio files and no music, only short sound effects.
let ac = null, out = null, noiseBuf = null;
const MUTE_KEY = 'peak.muted';
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
  star: () => { if (ok()) [784, 988, 1175, 1568].forEach((f, i) => tone(f, now() + i * 0.07, 0.2, 'triangle', 0.15)); },
  can: () => { if (ok()) [523, 659, 784].forEach((f, i) => tone(f, now() + i * 0.06, 0.12, 'triangle', 0.12)); },
  boost: () => { if (ok()) { noise(now(), 0.7, 0.18, 300); tone(160, now(), 0.6, 'sawtooth', 0.08, 420); } },
  bump: () => { if (ok()) noise(now(), 0.15, 0.2, 200); },
  splash: () => { if (ok()) noise(now(), 0.5, 0.16, 900); },
  air: () => { if (ok()) [660, 880].forEach((f, i) => tone(f, now() + i * 0.08, 0.15, 'triangle', 0.12)); },
  land: () => { if (ok()) noise(now(), 0.12, 0.12, 500); },
  flip: () => { if (ok()) { tone(300, now(), 0.4, 'triangle', 0.15, 90); noise(now(), 0.2, 0.15, 600); } },
  flag: () => { if (ok()) { tone(660, now(), 0.1, 'triangle', 0.12); tone(880, now() + 0.1, 0.15, 'triangle', 0.12); } },
  win: () => { if (ok()) [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, now() + i * 0.11, 0.25, 'triangle', 0.15)); },
  buy: () => { if (ok()) [660, 880, 1320].forEach((f, i) => tone(f, now() + i * 0.07, 0.15, 'sine', 0.12)); },
};
