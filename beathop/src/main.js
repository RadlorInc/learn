// BeatHop: screens, input, drawing and saving around the rules in game.js.
// Like BlockCraft, it plays standalone, or inside the app with ?key=<save key>&until=<ms>: it stops at `until` and
// goes back to /play. Nothing in the app opens it yet.
import { H, SIZE, DT, makeLevel, newState, step } from './game.js';
import { LEVELS } from './levels.js';
import * as audio from './audio.js';

const { sfx } = audio;
const $ = (id) => document.getElementById(id);
const cv = $('cv'), cx = cv.getContext('2d');
const Q = new URLSearchParams(location.search);
const PLAY = Q.has('key') && Q.has('until') ? { key: Q.get('key'), until: +Q.get('until') } : null;
const SAVE_KEY = PLAY ? PLAY.key : 'beathop.save';
// `game=beathop` keeps BeatHop picked on /play when the child comes back
const BACK = '/play?game=beathop', STOP = '/play?stop=1&game=beathop';
const COLORS = ['#ff7a1a', '#2f9bff', '#22c55e', '#e64ba0', '#8b5cf6', '#f5c400'];

// kind: 'day' = clouds (and a sun if `sun`), 'dark' = twinkling dots in the deco colour (and a moon if `sun`),
// 'cave' = dark with a rocky ceiling
const THEMES = {
  meadow: { kind: 'day', sky: ['#6cc8ff', '#dff5ff'], far: '#a6e08a', near: '#74c95e', dirt: '#9a6438', grass: '#5cc43e', brick: '#d0703f', thorn: '#4f7f3a' },
  cave: { kind: 'cave', sky: ['#140f33', '#3b2b72'], far: '#2b2160', near: '#3d2f80', dirt: '#4a3b6b', grass: '#9b87ff', brick: '#5c4a8a', thorn: '#c9bcff', deco: '#7ee7ff' },
  sky: { kind: 'day', sun: '#fff3b0', sky: ['#ff8f87', '#ffd6a5'], far: '#ffe5d0', near: '#ffffff', dirt: '#7a5a3c', grass: '#3fb37f', brick: '#e07a5f', thorn: '#3d405b' },
  desert: { kind: 'day', sun: '#fff7d6', sky: ['#ffc46b', '#fff1cc'], far: '#f2c46d', near: '#e6a94f', dirt: '#c98b45', grass: '#f4d58d', brick: '#c1693c', thorn: '#4f8a3a' },
  snow: { kind: 'day', sky: ['#9fd4ff', '#f0f8ff'], far: '#dfeefa', near: '#ffffff', dirt: '#7d8fa6', grass: '#ffffff', brick: '#8fb3d9', thorn: '#3f5f80' },
  night: { kind: 'dark', sun: '#f4f1d0', sky: ['#0b1a3a', '#27406e'], far: '#1c3157', near: '#24406b', dirt: '#3a2f2a', grass: '#3f8f5a', brick: '#5a6b8c', thorn: '#a7f3d0', deco: '#ffffff' },
  volcano: { kind: 'dark', sky: ['#3a1010', '#a8341b'], far: '#5a1d14', near: '#7a2a18', dirt: '#3b2a26', grass: '#ff7a1a', brick: '#6b3a2a', thorn: '#ffd23f', deco: '#ffb347' },
  beach: { kind: 'day', sun: '#fff3b0', sky: ['#5ec8f2', '#d9f7ff'], far: '#3fa9d9', near: '#f6dd9b', dirt: '#d9b26b', grass: '#f6dd9b', brick: '#e8a87c', thorn: '#2e8b57' },
  space: { kind: 'dark', sky: ['#05051a', '#1b1450'], far: '#2a1f66', near: '#3b2c88', dirt: '#555b6e', grass: '#9aa5b8', brick: '#6c7a93', thorn: '#ff6bd6', deco: '#ffffff' },
  rainbow: { kind: 'day', sun: '#fff3b0', sky: ['#ffd1ec', '#d6f0ff'], far: '#c3f0ca', near: '#a3e4b5', dirt: '#b07cc6', grass: '#7bdcb5', brick: '#ff9f80', thorn: '#7c5cff' },
};

// ------------------------------------------------------------------ save
const blank = () => ({ color: COLORS[0], levels: {}, bank: 0, hat: 'none', slow: false });
// hats are bought with no gems: they open once this many gems have ever been collected (an idea from endless runners'
// unlockable looks)
const HATS = [{ id: 'none', label: 'No hat', at: 0 }, { id: 'cap', label: '🧢 Cap', at: 25 }, { id: 'bow', label: '🎀 Bow', at: 60 }, { id: 'crown', label: '👑 Crown', at: 120 }];
const SLOW = 0.7; // slow mode: the whole game at 70% speed — the same jumps, more time to react
let save = (() => { try { return { ...blank(), ...JSON.parse(localStorage.getItem(SAVE_KEY)) }; } catch { return blank(); } })();
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...save, savedAt: Date.now() })); } catch { /* full or private */ } };
const record = (id) => (save.levels[id] ||= { done: false, stars: [], gems: 0, best: 0 });

// ------------------------------------------------------------------ canvas
let W = 0, HP = 0, ts = 32;
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; HP = innerHeight;
  cv.width = W * dpr; cv.height = HP * dpr;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ts = Math.min(HP / (H + 1.5), W / 14);
}
addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ state
let state = 'title', run = null, held = false, demoX = 0, clock = 0;
const parts = [];

function startLevel(i) {
  audio.init();
  const def = LEVELS[i], lv = makeLevel(def), rec = record(def.id);
  run = {
    i, def, lv, s: newState(), cp: null, tries: 1, gems: 0, taken: new Set(), stars: new Set(rec.stars),
    flags: new Set(), bumps: new Map(), deadT: 0, wonT: 0, rot: 0, squash: 0, acc: 0, seenGlide: false,
    life: new Set(), combo: 0, lastGem: -9, magnetT: 0,
  };
  // stars found on an earlier play stay found: they are drawn faded and still count
  parts.length = 0;
  show(null);
  state = 'playing';
  hint(def.hint, 4.5);
}

function respawn() {
  run.s = run.cp ? { ...run.cp } : newState();
  run.tries++; run.acc = 0; run.rot = 0; run.life.clear(); run.magnetT = 0; run.combo = 0;
}

function finish() {
  state = 'won';
  const rec = record(run.def.id);
  rec.done = true; rec.best = 100;
  rec.stars = [...run.stars];
  rec.gems = Math.max(rec.gems, run.gems);
  persist();
  sfx.win();
  for (let k = 0; k < 80; k++) spark(run.s.x, run.s.y + 2, COLORS[k % COLORS.length], 10, 1.6);
  setTimeout(() => {
    const got = run.lv.stars.filter((k) => run.stars.has(k)).length;
    $('winStars').textContent = '★'.repeat(got) + '☆'.repeat(3 - got);
    $('winStats').textContent = `💎 ${run.gems} points · ${run.tries} ${run.tries === 1 ? 'try' : 'tries'}`;
    $('winTitle').textContent = got === 3 ? 'Perfect! All three stars!' : 'Level complete!';
    $('bNext').classList.toggle('hidden', run.i === LEVELS.length - 1);
    show('win');
  }, 1300);
}

// ------------------------------------------------------------------ events from the rules
function onEvents(ev) {
  const s = run.s;
  for (const e of ev) {
    if (e.t === 'jump') { e.ring ? sfx.ring() : sfx.jump(); for (let k = 0; k < 6; k++) spark(s.x + 0.4, s.flip ? s.y + SIZE : s.y, '#ffffffcc', 2, 0.35); }
    else if (e.t === 'pad') sfx.pad();
    else if (e.t === 'pick') {
      const k = e.x * H + e.y;
      if (e.ch === 'H' || e.ch === 'M') {
        if (run.life.has(k)) continue;
        run.life.add(k);
        if (e.ch === 'H') { s.shield = true; sfx.shield(); toast('Shield! One thorn can not hurt you'); }
        else { run.magnetT = 6; sfx.magnet(); toast('Magnet! Gems fly to you'); }
        continue;
      }
      if (run.taken.has(k)) continue;
      run.taken.add(k);
      if (e.ch === 'S') { run.stars.add(k); sfx.star(); toast('★ Star!'); points(10, e.x + 0.5, e.y + 1); for (let n = 0; n < 24; n++) spark(e.x + 0.5, e.y + 0.5, '#ffd23f', 6, 0.8); }
      else gotGem(e.x + 0.5, e.y + 0.5);
    } else if (e.t === 'bump') {
      run.lv.set(e.x, e.y, 'b'); run.bumps.set(e.x * H + e.y, clock);
      sfx.bump(); setTimeout(() => gotGem(e.x + 0.5, e.y + 1.5, true), 90);
      parts.push({ x: e.x + 0.5, y: e.y + 1.2, vx: 0, vy: 7, life: 0.5, max: 0.5, color: '#7df0ff', gem: true });
    } else if (e.t === 'trig') {
      if (e.ch === 'F' && !run.flags.has(e.x)) {
        run.flags.add(e.x); run.cp = { ...s, held: false, buffer: 0 };
        sfx.flag(); toast('Checkpoint!');
      } else if ('PCUD'.includes(e.ch)) {
        sfx.gate();
        if (e.ch === 'P' && !run.seenGlide) { run.seenGlide = true; hint('Hold to fly up, let go to glide down', 3); }
        if (e.ch === 'U') toast('Upside down!');
      }
    } else if (e.t === 'shield') {
      sfx.pop(); toast('Phew! The shield saved you');
      for (let k = 0; k < 18; k++) spark(s.x + 0.4, s.y + 0.4, '#9be7ff', 6, 0.5);
    } else if (e.t === 'crash') {
      sfx.oops();
      for (let k = 0; k < 26; k++) spark(s.x + 0.4, s.y + 0.4, save.color, 7, 0.7);
      run.deadT = 0.75;
      const rec = record(run.def.id);
      rec.best = Math.max(rec.best, pct());
      persist();
    }
  }
}

// a gem: quick gems in a row make a combo — each one a note higher, and from the 5th on each is worth 2
function gotGem(x, y, quiet = false) {
  run.combo = clock - run.lastGem < 0.8 ? run.combo + 1 : 1;
  run.lastGem = clock;
  sfx.gem(run.combo);
  points(run.combo >= 5 ? 2 : 1, x, y);
  if (run.combo === 5 || run.combo === 10 || run.combo === 20) toast(`Combo ×${run.combo}!`);
  if (!quiet) for (let n = 0; n < 8; n++) spark(x, y, '#7df0ff', 3, 0.4);
}
function points(n, x, y) {
  run.gems += n; save.bank += n;
  parts.push({ x: x + (Math.random() - 0.5) * 0.8, y, vx: 0, vy: 2.5, life: 0.7, max: 0.7, color: '#ffffff', text: '+' + n, drag: true });
}

const pct = () => Math.max(0, Math.min(100, Math.floor(((run.s.x - 2) / (run.lv.goal - 2)) * 100)));

function spark(x, y, color, speed, life) {
  const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.6);
  parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color });
}

// ------------------------------------------------------------------ loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; clock += dt;
  if (state === 'playing') {
    const s = run.s;
    if (s.dead) { run.deadT -= dt; if (run.deadT <= 0) respawn(); }
    else {
      run.acc += dt * (save.slow ? SLOW : 1);
      if (run.magnetT > 0) magnet(dt);
      while (run.acc >= DT && !s.dead && !s.won) {
        const ev = [], wasGrounded = s.grounded;
        step(s, held, run.lv, ev);
        onEvents(ev);
        if (!wasGrounded && s.grounded) run.squash = 1;
        run.acc -= DT;
      }
      if (s.won) finish();
      animatePlayer(dt);
    }
  }
  if (state === 'won') animatePlayer(dt);
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k];
    p.life -= dt; if (p.life <= 0) { parts.splice(k, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; if (!p.drag) p.vy -= (p.gem ? 14 : 9) * dt;
  }
  draw();
  hud();
  requestAnimationFrame(frame);
}

// the magnet pulls every gem within 3 tiles; it runs on real time, and only collects (the path never changes)
function magnet(dt) {
  run.magnetT -= dt;
  const s = run.s, px = s.x + SIZE / 2, py = s.y + SIZE / 2;
  for (let x = Math.floor(px - 3); x <= px + 3; x++) for (let y = Math.floor(py - 3); y <= py + 3; y++) {
    const k = x * H + y;
    if (run.lv.at(x, y) !== '*' || run.taken.has(k) || Math.hypot(x + 0.5 - px, y + 0.5 - py) > 3) continue;
    run.taken.add(k);
    gotGem(px, py + 0.6, true);
    parts.push({ x: x + 0.5, y: y + 0.5, vx: (px - x - 0.5) * 6, vy: (py - y - 0.5) * 6 + 2, life: 0.18, max: 0.18, color: '#3dd6f5', gem: true });
  }
}

function animatePlayer(dt) {
  const s = run.s, g = s.flip ? -1 : 1;
  run.squash = Math.max(0, run.squash - dt * 6);
  if (s.mode === 'glider') {
    run.rot = -s.vy * 0.06;
    if (!s.dead && Math.random() < 0.5) parts.push({ x: s.x, y: s.y + 0.3, vx: -2, vy: (Math.random() - 0.5), life: 0.4, max: 0.4, color: '#ffffffaa' });
  } else if (!s.grounded) run.rot += dt * 4.8 * g;
  else { const t = Math.round(run.rot / (Math.PI / 2)) * (Math.PI / 2); run.rot += (t - run.rot) * Math.min(1, dt * 20); }
}

// ------------------------------------------------------------------ drawing
let camX = 0, camY = 0;
const sx = (x) => (x - camX) * ts;
const sy = (y) => HP - (y - camY) * ts;

function draw() {
  const lv = run?.lv ?? demoLevel, theme = THEMES[(run?.def ?? LEVELS[0]).theme];
  if (run && state !== 'title') camX = run.s.x - (W / ts) * 0.28;
  else { demoX += 0.03; camX = demoX % (demoLevel.w - W / ts); }
  camY = (H - HP / ts) / 2;
  background(theme);
  tiles(lv, theme);
  triggers(lv);
  if (run && state !== 'title' && !run.s.dead) player();
  for (const p of parts) {
    cx.globalAlpha = Math.max(0, p.life / p.max);
    cx.fillStyle = p.color;
    if (p.text) { cx.font = `900 ${ts * 0.5}px system-ui`; cx.textAlign = 'center'; cx.lineWidth = ts * 0.1; cx.strokeStyle = '#1d3557'; cx.strokeText(p.text, sx(p.x), sy(p.y)); cx.fillText(p.text, sx(p.x), sy(p.y)); }
    else if (p.gem) gem(sx(p.x), sy(p.y), ts * 0.3, 1); else cx.fillRect(sx(p.x) - ts * 0.07, sy(p.y) - ts * 0.07, ts * 0.14, ts * 0.14);
  }
  cx.globalAlpha = 1;
}

function background(t) {
  const grd = cx.createLinearGradient(0, 0, 0, HP);
  grd.addColorStop(0, t.sky[0]); grd.addColorStop(1, t.sky[1]);
  cx.fillStyle = grd; cx.fillRect(0, 0, W, HP);
  if (t.kind !== 'day') {
    cx.fillStyle = t.deco;
    for (let k = 0; k < 40; k++) { // glints, stars or embers
      const x = ((k * 97.3 - camX * ts * 0.1) % (W + 50) + W + 50) % (W + 50), y = (k * 53.7) % HP;
      cx.globalAlpha = 0.25 + 0.25 * Math.sin(clock * 2 + k);
      cx.fillRect(x, y, 2, 2);
    }
    cx.globalAlpha = 1;
  } else for (let k = 0; k < 7; k++) { // clouds
    const x = ((k * 230 - camX * ts * 0.12) % (W + 260) + W + 260) % (W + 260) - 130, y = HP * (0.1 + 0.07 * (k % 3));
    cloud(x, y, ts * (0.55 + (k % 3) * 0.2), '#ffffffdd');
  }
  if (t.sun) { cx.fillStyle = t.sun; cx.beginPath(); cx.arc(W * 0.78, HP * 0.24, ts * (t.kind === 'day' ? 1.4 : 0.9), 0, 7); cx.fill(); }
  if (t.kind === 'cave') ridge(0.15, H - 0.5, 1.2, t.far, true);
  ridge(0.2, 3.0, 1.2, t.far, false); ridge(0.45, 1.8, 0.9, t.near, false);
}
function ridge(par, base, amp, color, fromTop) {
  cx.fillStyle = color; cx.beginPath();
  cx.moveTo(0, fromTop ? 0 : HP);
  for (let px = 0; px <= W + 8; px += 8) {
    const wx = px / ts + camX * par;
    const y = base + (fromTop ? -1 : 1) * amp * (Math.sin(wx * 0.31) + 0.6 * Math.sin(wx * 0.13 + 1.7) + (fromTop ? 0.8 * Math.abs(Math.sin(wx * 1.3)) : 0));
    cx.lineTo(px, HP - (y - camY) * ts);
  }
  cx.lineTo(W, fromTop ? 0 : HP); cx.fill();
}
function cloud(x, y, r, c) {
  cx.fillStyle = c; cx.beginPath();
  cx.arc(x, y, r, 0, 7); cx.arc(x + r * 0.9, y + r * 0.2, r * 0.8, 0, 7); cx.arc(x - r * 0.9, y + r * 0.25, r * 0.7, 0, 7);
  cx.fill();
}

const SOLID = '=#?b';
function tiles(lv, t) {
  const x0 = Math.floor(camX) - 1, x1 = Math.ceil(camX + W / ts) + 1;
  for (let x = x0; x <= x1; x++) for (let y = 0; y < H; y++) {
    const ch = lv.at(x, y);
    if (ch === ' ') continue;
    const X = sx(x), Y = sy(y + 1), k = x * H + y;
    if (ch === '=') {
      cx.fillStyle = t.dirt; cx.fillRect(X, Y, ts + 1, ts + 1);
      cx.fillStyle = '#00000022';
      if ((x * 7 + y * 3) % 5 === 0) cx.fillRect(X + ts * 0.25, Y + ts * 0.55, ts * 0.12, ts * 0.12);
      if ((x * 3 + y) % 4 === 1) cx.fillRect(X + ts * 0.65, Y + ts * 0.7, ts * 0.1, ts * 0.1);
      if (!SOLID.includes(lv.at(x, y + 1))) {
        cx.fillStyle = t.grass; cx.fillRect(X, Y, ts + 1, ts * 0.26);
        cx.beginPath();
        for (let n = 0; n < 4; n++) cx.arc(X + ts * (0.125 + n * 0.25), Y + ts * 0.26, ts * 0.11, 0, Math.PI);
        cx.fill();
      }
    } else if (ch === '#' || ch === 'b') {
      cx.fillStyle = ch === 'b' ? '#a77b52' : t.brick; cx.fillRect(X, Y, ts + 1, ts + 1);
      cx.strokeStyle = '#00000030'; cx.lineWidth = Math.max(1, ts * 0.05);
      cx.beginPath();
      cx.moveTo(X, Y + ts / 2); cx.lineTo(X + ts, Y + ts / 2);
      cx.moveTo(X + ts * (y % 2 ? 0.25 : 0.75), Y); cx.lineTo(X + ts * (y % 2 ? 0.25 : 0.75), Y + ts / 2);
      cx.moveTo(X + ts * (y % 2 ? 0.75 : 0.25), Y + ts / 2); cx.lineTo(X + ts * (y % 2 ? 0.75 : 0.25), Y + ts);
      cx.stroke();
    } else if (ch === '?') {
      const since = run?.bumps.get(k);
      const off = since !== undefined && clock - since < 0.2 ? -Math.sin(((clock - since) / 0.2) * Math.PI) * ts * 0.25 : 0;
      roundRect(X + 1, Y + 1 + off, ts - 2, ts - 2, ts * 0.12, '#f7b32b');
      cx.strokeStyle = '#c47f00'; cx.lineWidth = ts * 0.06; cx.stroke();
      cx.fillStyle = '#fff'; cx.font = `900 ${ts * 0.62}px system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText('?', X + ts / 2, Y + ts / 2 + off + 1);
    } else if (ch === '^' || ch === 'v') thorn(X, Y, ch === 'v', t.thorn);
    else if ((ch === '*' || ch === 'S') && run?.taken.has(k)) continue;
    else if (ch === '*') { cx.fillStyle = '#3dd6f5'; gem(X + ts / 2, Y + ts / 2, ts * 0.3, Math.max(0.25, Math.abs(Math.cos(clock * 3 + x)))); }
    else if (ch === 'S') starShape(X + ts / 2, Y + ts / 2, ts * 0.42 * (1 + 0.08 * Math.sin(clock * 5)), run?.stars.has(k) ? 0.45 : 1);
    else if (ch === 'J') pad(lv, x, y, X, Y);
    else if (ch === 'H' || ch === 'M') { if (!run?.life.has(k)) powerUp(ch, X + ts / 2, Y + ts / 2 + Math.sin(clock * 4 + x) * ts * 0.08); }
    else if (ch === 'o') {
      cx.strokeStyle = '#ffd23f'; cx.lineWidth = ts * 0.1;
      cx.beginPath(); cx.arc(X + ts / 2, Y + ts / 2, ts * (0.36 + 0.04 * Math.sin(clock * 8)), 0, 7); cx.stroke();
      cx.fillStyle = '#ffd23f44'; cx.fill();
    }
  }
}
function powerUp(ch, x, y) {
  cx.fillStyle = ch === 'H' ? '#9be7ff66' : '#ff6b6b33'; cx.beginPath(); cx.arc(x, y, ts * 0.42, 0, 7); cx.fill();
  cx.strokeStyle = '#ffffff'; cx.lineWidth = ts * 0.06; cx.stroke();
  if (ch === 'H') { // a bubble with a shine
    cx.fillStyle = '#ffffffcc'; cx.beginPath(); cx.ellipse(x - ts * 0.13, y - ts * 0.15, ts * 0.1, ts * 0.06, -0.6, 0, 7); cx.fill();
  } else { // a horseshoe magnet
    cx.lineCap = 'butt'; cx.lineWidth = ts * 0.13; cx.strokeStyle = '#ef4444';
    cx.beginPath(); cx.arc(x, y - ts * 0.02, ts * 0.17, Math.PI, 0, true); cx.stroke();
    cx.fillStyle = '#e8e8e8';
    cx.fillRect(x - ts * 0.235, y - ts * 0.04, ts * 0.13, ts * 0.12); cx.fillRect(x + ts * 0.105, y - ts * 0.04, ts * 0.13, ts * 0.12);
  }
}
function roundRect(x, y, w, h, r, fill) {
  cx.beginPath(); cx.roundRect(x, y, w, h, r); cx.fillStyle = fill; cx.fill();
}
function thorn(X, Y, down, color) {
  cx.fillStyle = color; cx.beginPath();
  if (down) { cx.moveTo(X + ts * 0.12, Y); cx.lineTo(X + ts * 0.88, Y); cx.lineTo(X + ts * 0.5, Y + ts * 0.82); }
  else { cx.moveTo(X + ts * 0.12, Y + ts); cx.lineTo(X + ts * 0.88, Y + ts); cx.lineTo(X + ts * 0.5, Y + ts * 0.18); }
  cx.fill();
  cx.fillStyle = '#ffffff55'; cx.beginPath();
  if (down) { cx.moveTo(X + ts * 0.5, Y + ts * 0.82); cx.lineTo(X + ts * 0.42, Y + ts * 0.5); cx.lineTo(X + ts * 0.5, Y + ts * 0.5); }
  else { cx.moveTo(X + ts * 0.5, Y + ts * 0.18); cx.lineTo(X + ts * 0.42, Y + ts * 0.5); cx.lineTo(X + ts * 0.5, Y + ts * 0.5); }
  cx.fill();
}
function gem(x, y, r, w) {
  cx.beginPath(); cx.moveTo(x, y - r); cx.lineTo(x + r * 0.75 * w, y); cx.lineTo(x, y + r); cx.lineTo(x - r * 0.75 * w, y); cx.fill();
  cx.fillStyle = '#ffffffaa'; cx.beginPath(); cx.moveTo(x, y - r); cx.lineTo(x + r * 0.3 * w, y - r * 0.2); cx.lineTo(x, y); cx.fill();
}
function starShape(x, y, r, alpha) {
  cx.globalAlpha = alpha;
  cx.beginPath();
  for (let n = 0; n < 10; n++) {
    const a = -Math.PI / 2 + (n * Math.PI) / 5, rr = n % 2 ? r * 0.45 : r;
    cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  cx.closePath(); cx.fillStyle = '#ffd23f'; cx.fill();
  cx.strokeStyle = '#e09a00'; cx.lineWidth = ts * 0.06; cx.stroke();
  cx.globalAlpha = 1;
}
function pad(lv, x, y, X, Y) {
  const onCeiling = SOLID.includes(lv.at(x, y + 1)) && !SOLID.includes(lv.at(x, y - 1));
  const by = onCeiling ? Y : Y + ts, dir = onCeiling ? 1 : -1;
  cx.fillStyle = '#ffd23f'; cx.beginPath();
  cx.ellipse(X + ts / 2, by, ts * 0.45, ts * 0.22, 0, 0, Math.PI * 2); cx.fill();
  cx.fillStyle = '#ffd23f88';
  const lift = ((clock * 2) % 1) * ts * 0.4;
  cx.fillRect(X + ts * 0.3, by + dir * (ts * 0.25 + lift), ts * 0.4, ts * 0.06);
}

const TRIG_COLOR = { P: '#ff4fd8', C: '#3ddc84', U: '#3d9bff', D: '#3d9bff' };
function triggers(lv) {
  for (const [col, ch] of lv.trig) {
    const X = sx(col);
    if (X < -ts * 3 || X > W + ts * 3) continue;
    if (TRIG_COLOR[ch]) {
      const c = TRIG_COLOR[ch];
      cx.fillStyle = c + '33'; cx.fillRect(X + ts * 0.2, sy(H), ts * 0.6, H * ts);
      cx.fillStyle = c; cx.fillRect(X + ts * 0.42, sy(H), ts * 0.16, H * ts);
      for (let n = 0; n < 3; n++) {
        const y = sy(2 + n * 3 + ((clock * 1.5) % 1) * (ch === 'D' ? -1 : 1) * (ch === 'U' || ch === 'D' ? 1 : 0));
        cx.save(); cx.translate(X + ts / 2, y);
        cx.fillStyle = '#fff'; cx.strokeStyle = c; cx.lineWidth = ts * 0.08;
        cx.beginPath();
        if (ch === 'U' || ch === 'D') { const d = ch === 'U' ? -1 : 1; cx.moveTo(-ts * 0.3, -d * ts * 0.1); cx.lineTo(0, d * ts * 0.25); cx.lineTo(ts * 0.3, -d * ts * 0.1); }
        else if (ch === 'P') { cx.moveTo(-ts * 0.35, ts * 0.1); cx.lineTo(ts * 0.35, 0); cx.lineTo(-ts * 0.35, -ts * 0.18); cx.closePath(); }
        else cx.rect(-ts * 0.2, -ts * 0.2, ts * 0.4, ts * 0.4);
        cx.fill(); cx.stroke(); cx.restore();
      }
    } else if (ch === 'F') {
      // stands on the floor, or hangs from the ceiling where there is no floor (upside-down parts)
      let base = 0, d = 1;
      while (base < H && SOLID.includes(lv.at(col, base))) base++;
      if (base === 0 && SOLID.includes(lv.at(col, H - 1))) { base = H - 1; d = -1; while (base > 0 && SOLID.includes(lv.at(col, base - 1))) base--; }
      const reached = run?.flags.has(col), wave = Math.sin(clock * 6) * ts * 0.08;
      cx.fillStyle = '#ffffff'; cx.fillRect(X + ts * 0.45, Math.min(sy(base), sy(base + d * 2.6)), ts * 0.1, ts * 2.6);
      cx.fillStyle = reached ? '#22c55e' : '#ef4444';
      cx.beginPath(); cx.moveTo(X + ts * 0.55, sy(base + d * 2.6)); cx.lineTo(X + ts * 1.35, sy(base + d * 2.3) + wave); cx.lineTo(X + ts * 0.55, sy(base + d * 2)); cx.fill();
    } else if (ch === 'G') {
      let gy = 0; while (gy < H && SOLID.includes(lv.at(col, gy))) gy++;
      const top = gy + 6;
      cx.fillStyle = '#e8e8e8'; cx.fillRect(X + ts * 0.42, sy(top), ts * 0.16, ts * 6);
      cx.fillStyle = '#ffd23f'; cx.beginPath(); cx.arc(X + ts / 2, sy(top), ts * 0.22, 0, 7); cx.fill();
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        cx.fillStyle = (r + c) % 2 ? '#1d3557' : '#ffffff';
        const wave = Math.sin(clock * 5 + c) * ts * 0.06;
        cx.fillRect(X + ts * (0.58 + c * 0.35), sy(top - 0.2 - r * 0.35) + wave, ts * 0.35 + 1, ts * 0.35 + 1);
      }
    }
  }
}

function player() {
  const s = run.s, X = sx(s.x + SIZE / 2), Y = sy(s.y + SIZE / 2), r = SIZE * ts;
  const sq = run.squash * 0.18;
  if (run.magnetT > 0) {
    cx.strokeStyle = `rgba(255,107,107,${0.35 + 0.2 * Math.sin(clock * 10)})`; cx.lineWidth = ts * 0.05;
    cx.beginPath(); cx.arc(X, Y, ts * (1.2 + ((clock * 2) % 1) * 1.6), 0, 7); cx.stroke();
  }
  if (s.ghost > 0 && Math.floor(clock * 16) % 2) return; // blinking: the shield just popped
  if (s.shield) {
    cx.fillStyle = '#9be7ff44'; cx.strokeStyle = '#ffffffcc'; cx.lineWidth = ts * 0.05;
    cx.beginPath(); cx.arc(X, Y, r * 0.95, 0, 7); cx.fill(); cx.stroke();
  }
  cx.save(); cx.translate(X, Y);
  if (s.flip) cx.scale(1, -1);
  if (s.mode === 'glider') {
    cx.rotate(s.flip ? -run.rot : run.rot);
    cx.fillStyle = '#ffffff'; cx.strokeStyle = '#1d3557'; cx.lineWidth = ts * 0.05;
    cx.beginPath(); cx.moveTo(-r * 0.8, r * 0.2); cx.lineTo(r * 0.9, r * 0.25); cx.lineTo(-r * 0.6, r * 0.55); cx.closePath(); cx.fill(); cx.stroke();
    face(r * 0.7, -r * 0.1);
  } else {
    cx.rotate(s.flip ? -run.rot : run.rot);
    cx.scale(1 + sq, 1 - sq);
    face(r, 0);
  }
  cx.restore();
}
function face(r, dy) {
  roundRect(-r / 2, -r / 2 + dy, r, r, r * 0.22, save.color);
  cx.strokeStyle = '#00000040'; cx.lineWidth = r * 0.08; cx.stroke();
  cx.fillStyle = '#ffffff';
  cx.beginPath(); cx.arc(r * 0.05, -r * 0.08 + dy, r * 0.15, 0, 7); cx.arc(r * 0.32, -r * 0.08 + dy, r * 0.15, 0, 7); cx.fill();
  cx.fillStyle = '#1d3557';
  cx.beginPath(); cx.arc(r * 0.1, -r * 0.06 + dy, r * 0.07, 0, 7); cx.arc(r * 0.37, -r * 0.06 + dy, r * 0.07, 0, 7); cx.fill();
  cx.strokeStyle = '#1d3557'; cx.lineWidth = r * 0.07;
  cx.beginPath(); cx.arc(r * 0.2, r * 0.12 + dy, r * 0.13, 0.2, Math.PI - 0.2); cx.stroke();
  hat(r, dy - r / 2);
}
function hat(r, top) {
  if (save.hat === 'cap') {
    cx.fillStyle = '#2f6fdf'; cx.beginPath(); cx.ellipse(0, top, r * 0.42, r * 0.3, 0, Math.PI, 0); cx.fill();
    cx.fillRect(0, top - r * 0.06, r * 0.62, r * 0.1);
  } else if (save.hat === 'bow') {
    cx.fillStyle = '#ff5fa2'; cx.beginPath();
    cx.moveTo(0, top); cx.lineTo(-r * 0.3, top - r * 0.2); cx.lineTo(-r * 0.3, top + r * 0.14); cx.closePath();
    cx.moveTo(0, top); cx.lineTo(r * 0.3, top - r * 0.2); cx.lineTo(r * 0.3, top + r * 0.14); cx.closePath(); cx.fill();
    cx.beginPath(); cx.arc(0, top, r * 0.08, 0, 7); cx.fill();
  } else if (save.hat === 'crown') {
    cx.fillStyle = '#ffd23f'; cx.strokeStyle = '#e09a00'; cx.lineWidth = r * 0.04; cx.beginPath();
    cx.moveTo(-r * 0.32, top + r * 0.02); cx.lineTo(-r * 0.36, top - r * 0.3); cx.lineTo(-r * 0.15, top - r * 0.12); cx.lineTo(0, top - r * 0.36);
    cx.lineTo(r * 0.15, top - r * 0.12); cx.lineTo(r * 0.36, top - r * 0.3); cx.lineTo(r * 0.32, top + r * 0.02); cx.closePath(); cx.fill(); cx.stroke();
  }
}

// ------------------------------------------------------------------ HUD, screens, messages
let lastHud = '';
function hud() {
  if (!run || state === 'title') return;
  const p = state === 'won' ? 100 : pct(), key = `${p}|${run.gems}|${run.tries}`;
  if (key === lastHud) return;
  lastHud = key;
  $('barIn').style.width = p + '%';
  $('pct').textContent = p + '%';
  $('gems').textContent = '💎 ' + run.gems + (save.slow ? '  🐢' : '');
  $('tries').textContent = 'Try ' + run.tries;
}
function show(name) {
  for (const id of ['title', 'pause', 'win']) $(id).classList.toggle('hidden', id !== name);
  $('hud').classList.toggle('hidden', name === 'title');
}
let toastT = 0;
function toast(text) {
  const el = $('toast'); el.textContent = text; el.style.opacity = 1;
  clearTimeout(toastT); toastT = setTimeout(() => (el.style.opacity = 0), 1100);
}
let hintT = 0;
function hint(text, secs) {
  const el = $('hint'); el.textContent = text; el.style.opacity = 1;
  clearTimeout(hintT); hintT = setTimeout(() => (el.style.opacity = 0), secs * 1000);
}

function titleScreen() {
  state = 'title'; run = null; held = false; parts.length = 0;
  $('swatches').replaceChildren(...COLORS.map((c) => {
    const b = document.createElement('button');
    b.className = 'sw' + (c === save.color ? ' on' : ''); b.style.background = c; b.setAttribute('aria-label', 'Colour ' + c);
    b.onclick = () => { save.color = c; persist(); titleScreen(); };
    return b;
  }));
  $('levels').replaceChildren(...LEVELS.map((def, i) => {
    const rec = save.levels[def.id], open = i === 0 || save.levels[LEVELS[i - 1].id]?.done;
    const b = document.createElement('button');
    b.className = 'lvl' + (open ? '' : ' locked');
    const got = rec?.stars.length ?? 0;
    b.innerHTML = `<b>${i + 1}. ${def.name}</b><span class="stars">${'★'.repeat(got)}${'☆'.repeat(3 - got)}</span>` +
      `<small>${!open ? '🔒 Finish the level before' : rec?.done ? 'Done!' : rec?.best ? `Best: ${rec.best}%` : 'New'}</small>`;
    b.onclick = () => open && startLevel(i);
    return b;
  }));
  $('hats').replaceChildren(...HATS.map((h) => {
    const b = document.createElement('button'), open = save.bank >= h.at;
    b.className = 'plain hat' + (save.hat === h.id ? ' on' : '') + (open ? '' : ' locked');
    b.textContent = open ? h.label : `🔒 ${h.at} 💎`;
    b.onclick = () => { if (open) { save.hat = h.id; persist(); titleScreen(); } };
    return b;
  }));
  $('bank').textContent = `💎 ${save.bank} gems collected`;
  $('bSlow').textContent = save.slow ? '🐢 Slow mode: on' : '🐢 Slow mode: off';
  $('bMute').textContent = audio.isMuted() ? '🔇 Sound off' : '🔊 Sound on';
  show('title');
}

function pause() {
  if (state !== 'playing') return;
  state = 'paused'; held = false; persist(); show('pause');
}
function resume() {
  if (state !== 'paused') return;
  show(null); state = 'playing'; last = performance.now();
}

$('bPause').onclick = pause;
$('bResume').onclick = resume;
$('bRestart').onclick = () => startLevel(run.i);
$('bLevels').onclick = $('bLevels2').onclick = titleScreen;
$('bAgain').onclick = () => startLevel(run.i);
$('bNext').onclick = () => startLevel(run.i + 1);
$('bSlow').onclick = () => { save.slow = !save.slow; persist(); titleScreen(); };
$('bMute').onclick = () => { audio.init(); audio.toggleMute(); titleScreen(); };

// ------------------------------------------------------------------ input: one button
const press = () => { audio.init(); if (state === 'playing') held = true; };
const release = () => { held = false; };
cv.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); if (!e.repeat) press(); }
  else if (e.code === 'Escape' || e.code === 'KeyP') state === 'paused' ? resume() : pause();
});
addEventListener('keyup', (e) => { if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) release(); });
addEventListener('blur', () => { release(); pause(); });
document.addEventListener('visibilitychange', () => document.hidden && pause());

// ------------------------------------------------------------------ inside the app: a time limit
if (PLAY) {
  $('bLeave').classList.remove('hidden');
  $('bLeave').onclick = () => { persist(); location.replace(STOP); };
  if (Date.now() >= PLAY.until) location.replace(BACK);
  $('timer').classList.remove('hidden');
  const tick = setInterval(() => {
    const left = Math.max(0, Math.ceil((PLAY.until - Date.now()) / 1000));
    $('timer').textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    if (left === 0) {
      clearInterval(tick); persist(); state = 'paused';
      toast("Time's up! Your stars are saved."); setTimeout(() => location.replace(BACK), 2500);
    }
  }, 1000);
}

// for poking at the game from the console while building it; never on a real host
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.BH = { run: () => run, hold: (v) => (held = v), start: startLevel };

const demoLevel = makeLevel(LEVELS[0]);
titleScreen();
requestAnimationFrame(frame);
