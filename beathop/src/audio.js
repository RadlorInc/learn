// Every sound is synthesised here: no audio files, and no background music (sound effects only).
let ac = null, out = null, noiseBuf = null;
const MUTE_KEY = 'beathop.muted';
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
  return muted;
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
  jump: () => ok() && tone(330, now(), 0.12, 'square', 0.08, 660),
  ring: () => ok() && tone(520, now(), 0.18, 'triangle', 0.15, 1040),
  pad: () => ok() && tone(200, now(), 0.3, 'sine', 0.25, 900),
  // each gem in a quick run of gems sounds one step higher on a pentatonic scale
  gem: (combo = 1) => {
    if (!ok()) return;
    const n = Math.min(combo - 1, 14), f = 880 * 2 ** ((Math.floor(n / 5) * 12 + [0, 2, 4, 7, 9][n % 5]) / 12);
    tone(f, now(), 0.08, 'sine', 0.12); tone(f * 1.5, now() + 0.05, 0.12, 'sine', 0.1);
  },
  shield: () => ok() && tone(440, now(), 0.4, 'sine', 0.2, 1320),
  pop: () => { if (ok()) { noise(now(), 0.15, 0.2, 2500); tone(900, now(), 0.2, 'triangle', 0.12, 300); } },
  magnet: () => { if (ok()) [660, 880, 660, 880].forEach((f, i) => tone(f, now() + i * 0.06, 0.08, 'square', 0.06)); },
  star: () => { if (ok()) [784, 988, 1175, 1568].forEach((f, i) => tone(f, now() + i * 0.07, 0.2, 'triangle', 0.15)); },
  bump: () => ok() && tone(160, now(), 0.1, 'square', 0.12, 120),
  gate: () => ok() && tone(300, now(), 0.35, 'sawtooth', 0.06, 1200),
  flag: () => { if (ok()) { tone(660, now(), 0.1, 'triangle', 0.12); tone(880, now() + 0.1, 0.15, 'triangle', 0.12); } },
  oops: () => { if (ok()) { noise(now(), 0.25, 0.25, 400); tone(300, now(), 0.3, 'triangle', 0.12, 90); } },
  win: () => { if (ok()) [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, now() + i * 0.11, 0.25, 'triangle', 0.15)); },
};
