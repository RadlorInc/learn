// Peak Rider: screens, controls, missions, the map, the garage and saving around the rules (physics.js), the worlds
// (levels.js) and the 3D view (render3d.js). Like the other games, it plays standalone (on localhost only), or inside
// the app with ?key=<save key>&learner=<child id>: it plays the time the database says and goes back to /play.
import { DT, newState, step, carStats, rot } from './physics.js';
import { LEVELS } from './levels.js';
import { createView } from './render3d.js';
import * as audio from './audio.js';

const { sfx } = audio;
const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const PLAY = Q.has('key') && Q.has('learner') ? { key: Q.get('key'), learner: Q.get('learner') } : null;
const SAVE_KEY = PLAY ? PLAY.key : 'peak.save';
// `game=peak` keeps Peak Rider picked on /play when the child comes back
const BACK = '/play?game=peak', STOP = '/play?stop=1&game=peak';
const SLOW = 0.75; // slow mode: the whole game at 75% — the same worlds, more time to think
const CAN_BACK = 40; // seconds until a boost can that was taken is back
const REWARD = { chest: 25, beacon: 15, deliver: 30 };

// cars only change the look; upgrades make the worlds easier (every mission can be done without any — check.mjs)
const CARS = [
  { id: 'jeep', name: 'Jeep', color: 0xe63946, css: '#e63946', price: 0, shape: 'jeep' },
  { id: 'buggy', name: 'Buggy', color: 0xffb703, css: '#ffb703', price: 50, shape: 'buggy' },
  { id: 'truck', name: 'Truck', color: 0x2a9d8f, css: '#2a9d8f', price: 100, shape: 'truck' },
  { id: 'rally', name: 'Rally', color: 0x7b2cbf, css: '#7b2cbf', price: 180, shape: 'jeep' },
];
const UPGRADES = [
  { id: 'engine', name: '⚙️ Engine', about: 'More power up the hills', cost: [40, 80, 140] },
  { id: 'tires', name: '🛞 Tyres', about: 'Better grip on mud and ice', cost: [40, 80, 140] },
  { id: 'suspension', name: '🌀 Suspension', about: 'Softer landings', cost: [40, 80, 140] },
  { id: 'boost', name: '⚡ Boost', about: 'Each can burns longer', cost: [40, 80, 140] },
];

// ------------------------------------------------------------------ save
const blank = () => ({ car: 'jeep', cars: ['jeep'], coins: 0, up: { engine: 0, tires: 0, suspension: 0, boost: 0 }, worlds: {}, slow: false });
let save = (() => { try { const b = blank(), s = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; return { ...b, ...s, up: { ...b.up, ...s.up }, worlds: s.worlds ?? {} }; } catch { return blank(); } })();
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...save, savedAt: Date.now() })); } catch { /* full or private */ } };
const doneIn = (id) => new Set(save.worlds[id]?.done ?? []);
const model = () => CARS.find((c) => c.id === save.car) ?? CARS[0];
const starsFor = (lv, n) => (n >= lv.missions.length ? 3 : n >= Math.ceil((lv.missions.length * 2) / 3) ? 2 : n >= Math.ceil(lv.missions.length / 3) ? 1 : 0);

// ------------------------------------------------------------------ view
const view = createView($('cv'));
const fx = $('fx'), fxc = fx.getContext('2d');
function fitFx() { const dpr = Math.min(devicePixelRatio || 1, 2); fx.width = innerWidth * dpr; fx.height = innerHeight * dpr; fxc.setTransform(dpr, 0, 0, dpr, 0, 0); }
addEventListener('resize', fitFx); fitFx();

// ------------------------------------------------------------------ state
let state = 'title', run = null, clock = 0, demo = null;
const keys = { gas: false, brake: false, left: false, right: false, boost: false };
const floats = [];

function startLevel(i) {
  audio.init();
  const lv = LEVELS[i];
  view.setLevel(lv, model()); demo = null;
  run = { i, lv, coins: 0, crashes: 0, outT: 0, acc: 0, car: carStats(save.up), done: doneIn(lv.id), carrying: null, canTaken: new Map(), safe: [], lastSafe: 0, at: 0 };
  place(lv.spawn(), new Set());
  drawMapBase();
  floats.length = 0;
  for (const k in keys) keys[k] = false;
  show(null); state = 'playing';
  hint(lv.hint, 7);
}
function place(sp, got) {
  const s = newState(run.lv, sp.x, sp.z, sp.yaw);
  s.boost = run.s ? run.s.boost : 0; s.got = got;
  // a mission already done is not reached again; a village counts again only for a new crate
  for (const id of run.done) s.reached.add(id);
  run.s = s; run.prev = { p: [...s.p], q: [...s.q] }; run.acc = 0; run.outT = 0;
}
// after a crash: back to where the car was safe a few seconds before (or the camp)
function respawn() {
  const spot = run.safe.filter((p) => p.t < run.s.t - 2).pop() ?? run.lv.spawn();
  const got = run.s.got;
  place(spot, got);
  run.safe = [];
}
function toCamp() { run.safe = []; place(run.lv.spawn(), run.s.got); }

// ------------------------------------------------------------------ missions
function complete(m) {
  run.done.add(m.id);
  const w = (save.worlds[run.lv.id] ||= { done: [] });
  w.done = [...run.done];
  run.coins += REWARD[m.kind]; save.coins += REWARD[m.kind];
  persist(); sfx.win();
  view.burst([m.x, m.y + 2, m.z], 0xffd23f, 30);
  float(`+${REWARD[m.kind]}`, m, '#ffd23f');
  const left = run.lv.missions.length - run.done.size;
  toast(m.kind === 'chest' ? '🎁 Treasure found!' : m.kind === 'beacon' ? '💡 The beacon is lit!' : `📦 Delivered to ${m.name}!`);
  if (!left) setTimeout(() => { $('winStats').textContent = `🪙 ${run.coins} coins this drive · ${run.crashes} ${run.crashes === 1 ? 'crash' : 'crashes'}`; show('win'); state = 'won'; }, 1500);
}
// the next crate at the camp is for the first village not yet delivered to
const nextDelivery = () => run.lv.missions.find((m) => m.kind === 'deliver' && !run.done.has(m.id));
// a crate is loaded when the car stops by the stack of crates at the camp
function checkCamp() {
  const s = run.s, d = nextDelivery(), stack = run.lv.crates, slow = Math.hypot(s.v[0], s.v[2]) < 3;
  if (!run.carrying && d && slow && Math.hypot(s.p[0] - stack.x, s.p[2] - stack.z) < 5) {
    run.carrying = d; run.hearts = 3; s.reached.delete(d.id); sfx.can(); toast(`📦 A crate for ${d.name}! Drive gently: each hard landing cracks it.`);
  }
}
// the crate has three hearts: a hard landing costs one, a crash or a very hard one breaks it at once
function hurtCrate(hit) {
  if (!run.carrying) return;
  run.hearts = hit > 11 ? 0 : run.hearts - 1;
  if (run.hearts > 0) { sfx.bump(); toast(`Careful! The crate cracked ${'❤️'.repeat(run.hearts)}`); return; }
  run.carrying = null; sfx.flip(); toast('💥 The crate broke! Get another at the camp.');
}

// ------------------------------------------------------------------ events from the rules
function onEvents(ev) {
  const s = run.s, { lv } = run;
  for (const e of ev) {
    if (e.t === 'coin') { run.coins++; save.coins++; sfx.coin(run.coins % 5 + 1); float('+1', lv.items[e.idx], '#ffd23f'); }
    else if (e.t === 'boost' && e.idx != null) { run.canTaken.set(e.idx, s.t); sfx.can(); toast('⚡ Boost can!'); }
    else if (e.t === 'boost') sfx.boost();
    else if (e.t === 'bump') sfx.bump();
    else if (e.t === 'slam') hurtCrate(e.hit);
    else if (e.t === 'reach') {
      const m = lv.missions.find((x) => x.id === e.id);
      if (m.kind !== 'deliver') complete(m);
      else if (run.carrying?.id === m.id) { run.carrying = null; complete(m); }
    } else if (e.t === 'flip' || e.t === 'fall' || e.t === 'deep') {
      run.crashes++; e.t === 'deep' ? sfx.splash() : sfx.flip(); hurtCrate(99);
      toast(e.t === 'flip' ? 'Oops, upside down!' : e.t === 'deep' ? 'Too deep! Cross where the water is shallow.' : 'Down you go!');
      run.outT = e.t === 'flip' ? 1.3 : 1.8;
    }
  }
}
function float(text, at, color) { floats.push({ text, x: at.x, y: (at.y ?? 0) + 1, z: at.z, color, life: 0.9 }); }

// ------------------------------------------------------------------ loop
let last = performance.now();
let autopilot = null; // set from the console on localhost only (PK.auto), to drive the game for screenshots
function input() { return autopilot ? autopilot(run) : { gas: keys.gas, brake: keys.brake, steer: (keys.right ? 1 : 0) - (keys.left ? 1 : 0), boost: keys.boost }; }
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; clock += dt;
  let alpha = 1;
  if (state === 'playing') {
    const s = run.s, dead = s.flipped || s.fell;
    run.acc += dt * (save.slow ? SLOW : 1);
    while (run.acc >= DT) {
      run.prev = { p: [...s.p], q: [...s.q] };
      const ev = [];
      if (dead) { if (s.fell) step(s, {}, run.lv, run.car, []); } // down a ravine or under water the car keeps falling while the child watches
      else { step(s, input(), run.lv, run.car, ev); onEvents(ev); }
      run.acc -= DT;
    }
    alpha = run.acc / DT;
    if (dead) { run.outT -= dt; if (run.outT <= 0) respawn(); }
    else {
      checkCamp();
      // a safe spot every half second: all four wheels down, upright, not in water
      if (s.t - run.lastSafe > 0.5 && s.contact === 4 && rot(s.q, [0, 1, 0])[1] > 0.9 && run.lv.water(s.p[0], s.p[2]) === null) {
        run.lastSafe = s.t; const f = rot(s.q, [0, 0, -1]);
        run.safe.push({ x: s.p[0], z: s.p[2], yaw: Math.atan2(f[0], -f[2]), t: s.t }); if (run.safe.length > 20) run.safe.shift();
      }
      for (const [k, t] of run.canTaken) if (s.t - t > CAN_BACK) { s.got.delete(k); run.canTaken.delete(k); }
    }
    run.at = run.lv.S[Math.round(Math.max(0, Math.min(run.lv.size, s.p[2]))) * run.lv.N + Math.round(Math.max(0, Math.min(run.lv.size, s.p[0])))];
  }
  if (run && state !== 'title') {
    const s = run.s, p = run.prev, l = (a, b) => a + (b - a) * alpha;
    const fwd = rot(s.q, [0, 0, -1]);
    view.render({
      s: { ...s, p: [l(p.p[0], s.p[0]), l(p.p[1], s.p[1]), l(p.p[2], s.p[2])] }, at: Math.max(0, run.at), taken: s.got, dt,
      speed: s.v[0] * fwd[0] + s.v[1] * fwd[1] + s.v[2] * fwd[2], flipT: s.flipped ? run.outT : 0,
      done: run.done, carrying: run.carrying?.id ?? null, cratesLeft: !!nextDelivery() && !run.carrying,
    });
    drawMap();
  } else if (demo) view.render({ s: demo, at: 0, taken: new Set(), dt, speed: 0, title: true, done: new Set() });
  drawFloats(dt);
  hud();
  requestAnimationFrame(frame);
}
function drawFloats(dt) {
  fxc.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.life -= dt; f.y += dt * 1.5;
    if (f.life <= 0) { floats.splice(i, 1); continue; }
    const p = view.project(f.x, f.y, f.z);
    if (!p.front) continue;
    fxc.globalAlpha = Math.min(1, f.life * 2); fxc.font = '900 26px system-ui'; fxc.textAlign = 'center';
    fxc.lineWidth = 5; fxc.strokeStyle = '#1d3557'; fxc.strokeText(f.text, p.x, p.y); fxc.fillStyle = f.color; fxc.fillText(f.text, p.x, p.y);
  }
  fxc.globalAlpha = 1;
}

// ------------------------------------------------------------------ the map: the land from above, the trails, the missions, the car
const map = $('map'), mapc = map.getContext('2d'), MAP = 132;
let mapBase = null;
function drawMapBase() {
  const lv = run.lv, c = document.createElement('canvas'); c.width = c.height = MAP;
  const x = c.getContext('2d'), img = x.createImageData(MAP, MAP), k = lv.size / MAP;
  let lo = Infinity, hi = -Infinity; for (const p of lv.track) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); }
  for (let j = 0; j < MAP; j++) for (let i = 0; i < MAP; i++) {
    const wx = i * k, wz = j * k, c0 = Math.round(wz) * lv.N + Math.round(wx), h = lv.H[c0], o = (j * MAP + i) * 4;
    const t = Math.max(0, Math.min(1, (h - lo + 10) / (hi - lo + 40))), shade = 0.75 + 0.25 * (lv.height(wx + 1, wz) - lv.height(wx - 1, wz));
    let r = 120 + 110 * t, g = 150 + 70 * t, b = 90 + 100 * t;
    if (lv.theme === 'snow') { r = g = 200 + 50 * t; b = 230; }
    if (lv.water(wx, wz) !== null || h < lo - 20) { r = 60; g = 140; b = 200; }
    if (lv.D[c0] < lv.half) { r = 160; g = 110; b = 70; }
    img.data[o] = r * shade; img.data[o + 1] = g * shade; img.data[o + 2] = b * shade; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  mapBase = c;
}
function drawMap() {
  if (!mapBase) return;
  const lv = run.lv, s = run.s, k = MAP / lv.size;
  mapc.clearRect(0, 0, MAP, MAP); mapc.drawImage(mapBase, 0, 0);
  const dot = (x, z, color, r = 4) => { mapc.beginPath(); mapc.arc(x * k, z * k, r, 0, 7); mapc.fillStyle = color; mapc.fill(); mapc.lineWidth = 1.5; mapc.strokeStyle = '#1d3557'; mapc.stroke(); };
  dot(lv.camp.x, lv.camp.z, '#2a9d8f', 5);
  for (const m of lv.missions) {
    if (m.kind === 'deliver') { if (!run.done.has(m.id)) dot(m.x, m.z, run.carrying?.id === m.id ? '#ff8c42' : '#c8924f'); continue; }
    if (!run.done.has(m.id)) dot(m.x, m.z, m.kind === 'chest' ? '#ffd23f' : '#ffffff');
  }
  const f = rot(s.q, [0, 0, -1]), a = Math.atan2(f[0], -f[2]);
  mapc.save(); mapc.translate(s.p[0] * k, s.p[2] * k); mapc.rotate(a);
  mapc.beginPath(); mapc.moveTo(0, -7); mapc.lineTo(5, 5); mapc.lineTo(-5, 5); mapc.closePath(); mapc.fillStyle = '#e63946'; mapc.fill(); mapc.strokeStyle = '#fff'; mapc.stroke(); mapc.restore();
}

// ------------------------------------------------------------------ HUD, screens, messages
// where the arrow points: the village for the crate being carried, else the nearest mission not done (deliveries
// start at the camp)
function target() {
  const s = run.s, lv = run.lv;
  if (run.carrying) return run.carrying;
  const pick = lv.missions.find((m) => m.id === run.pick && !run.done.has(m.id));
  if (pick) return pick.kind === 'deliver' ? lv.crates : pick;
  let best = null, bd = Infinity;
  for (const m of lv.missions) {
    if (run.done.has(m.id)) continue;
    const at = m.kind === 'deliver' ? lv.crates : m, d = Math.hypot(at.x - s.p[0], at.z - s.p[2]);
    if (d < bd) { bd = d; best = at; }
  }
  return best;
}
let lastHud = '';
function hud() {
  if (!run || state === 'title') return;
  const s = run.s, goal = target();
  const deg = goal ? Math.round(((Math.atan2(goal.x - s.p[0], -(goal.z - s.p[2])) + view.yaw) * 180) / Math.PI / 5) * 5 : 0;
  const dist = goal ? Math.round(Math.hypot(goal.x - s.p[0], goal.z - s.p[2]) / 5) * 5 : 0;
  const key = `${run.done.size}|${run.coins}|${s.boost}|${s.boostT > 0}|${deg}|${!!run.carrying}|${run.hearts}|${dist}|${!!goal}`;
  if (key === lastHud) return;
  lastHud = key;
  $('missions').textContent = `🎯 ${run.done.size}/${run.lv.missions.length}${run.carrying ? `  📦${'❤️'.repeat(run.hearts)}` : ''}`;
  $('dist').textContent = goal ? (dist < 10 ? 'Here!' : `${dist} m`) : '';
  $('coins').textContent = '🪙 ' + run.coins + (save.slow ? '  🐢' : '');
  $('boostHud').textContent = '⚡'.repeat(s.boost) + '·'.repeat(3 - s.boost);
  $('bBoost').classList.toggle('empty', s.boost === 0 && s.boostT <= 0);
  $('arrow').style.transform = `rotate(${deg}deg)`;
  $('arrow').classList.toggle('hidden', !goal); $('dist').classList.toggle('hidden', !goal);
}
function show(name) {
  for (const id of ['title', 'pause', 'win']) $(id).classList.toggle('hidden', id !== name);
  for (const id of ['hud', 'arrow', 'dist', 'map']) $(id).classList.toggle('hidden', name === 'title');
  $('pads').classList.toggle('hidden', name !== null);
}
let toastT = 0;
function toast(text) { const el = $('toast'); el.textContent = text; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => (el.style.opacity = 0), 1800); }
let hintT = 0;
function hint(text, secs) { const el = $('hint'); el.textContent = text; el.style.opacity = 1; clearTimeout(hintT); hintT = setTimeout(() => (el.style.opacity = 0), secs * 1000); }

function tile(html, cls, onClick, label) {
  const b = document.createElement('button');
  b.className = 'tile ' + cls; b.innerHTML = html; b.onclick = onClick;
  if (label) b.setAttribute('aria-label', label);
  return b;
}
function titleScreen() {
  state = 'title'; run = null; floats.length = 0;
  if (!demo) { const lv = LEVELS[0], sp = lv.spawn(); view.setLevel(lv, model()); demo = newState(lv, sp.x, sp.z, sp.yaw); }
  $('bank').textContent = `🪙 ${save.coins} coins`;
  $('cars').replaceChildren(...CARS.map((c) => {
    const owned = save.cars.includes(c.id), on = save.car === c.id;
    return tile(`<b><span style="color:${c.css}">■</span> ${c.name}</b><small>${on ? 'Driving' : owned ? 'Tap to drive' : `🪙 ${c.price} to buy`}</small>`,
      (on ? 'on' : '') + (!owned && save.coins < c.price ? ' locked' : ''),
      () => {
        if (owned) save.car = c.id;
        else if (save.coins >= c.price) { save.coins -= c.price; save.cars.push(c.id); save.car = c.id; sfx.buy(); }
        else return;
        persist(); demo = null; titleScreen();
      }, `${c.name}: ${owned ? 'owned' : `${c.price} coins`}`);
  }));
  $('garage').replaceChildren(...UPGRADES.map((u) => {
    const lvl = save.up[u.id] ?? 0, max = u.cost.length, cost = u.cost[lvl];
    return tile(`<b>${u.name}</b><small>${u.about}</small><span>${'●'.repeat(lvl)}${'○'.repeat(max - lvl)}</span><small>${lvl === max ? 'All done!' : `🪙 ${cost}`}</small>`,
      lvl < max && save.coins < cost ? 'locked' : '',
      () => { if (lvl < max && save.coins >= cost) { save.coins -= cost; save.up[u.id] = lvl + 1; sfx.buy(); persist(); titleScreen(); } },
      `${u.name.slice(u.name.indexOf(' ') + 1)}: level ${lvl} of ${max}`);
  }));
  $('levels').replaceChildren(...LEVELS.map((lv, i) => {
    const n = doneIn(lv.id).size, st = starsFor(lv, n);
    return tile(`<b>${i + 1}. ${lv.name}</b><span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span><small>🎯 ${n} of ${lv.missions.length} missions</small>`, '', () => startLevel(i));
  }));
  $('bSlow').textContent = save.slow ? '🐢 Slow mode: on' : '🐢 Slow mode: off';
  $('bMute').textContent = audio.isMuted() ? '🔇 Sound off' : '🔊 Sound on';
  show('title');
}
function pause() {
  if (state !== 'playing') return;
  state = 'paused'; for (const k in keys) keys[k] = false; persist();
  listMissions();
  show('pause');
}
// the missions in the pause menu: tap one and the arrow points to it
function listMissions() {
  $('pauseList').replaceChildren(...run.lv.missions.map((m) => {
    const li = document.createElement('li'), b = document.createElement('button'), done = run.done.has(m.id);
    b.className = 'mission' + (run.pick === m.id ? ' on' : ''); b.disabled = done;
    const at = m.kind === 'deliver' && run.carrying?.id !== m.id ? run.lv.crates : m, far = Math.round(Math.hypot(at.x - run.s.p[0], at.z - run.s.p[2]) / 10) * 10;
    b.textContent = `${done ? '✅' : run.pick === m.id ? '👉' : '⬜'} ${m.kind === 'chest' ? '🎁 Find a treasure chest' : m.kind === 'beacon' ? '💡 Light a beacon on a peak' : `📦 Take a crate from the camp to ${m.name}`}${done ? '' : ` · ${far} m`}`;
    b.onclick = () => { run.pick = run.pick === m.id ? null : m.id; listMissions(); };
    li.append(b); return li;
  }));
}
function resume() { if (state !== 'paused') return; show(null); state = 'playing'; last = performance.now(); }

$('bPause').onclick = pause;
$('bResume').onclick = resume;
$('bCamp').onclick = () => { resume(); toCamp(); };
$('bLevels').onclick = $('bLevels2').onclick = () => { persist(); titleScreen(); };
$('bAgain').onclick = () => { show(null); state = 'playing'; };
$('bSlow').onclick = () => { save.slow = !save.slow; persist(); titleScreen(); };
$('bMute').onclick = () => { audio.init(); audio.toggleMute(); titleScreen(); };

// ------------------------------------------------------------------ controls: five buttons, or W A S D / arrows and Space
function pad(id, name) {
  const el = $(id), down = (e) => { e.preventDefault(); audio.init(); keys[name] = true; el.classList.add('down'); el.setPointerCapture?.(e.pointerId); };
  const up = () => { keys[name] = false; el.classList.remove('down'); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}
pad('bGas', 'gas'); pad('bBrake', 'brake'); pad('bLeft', 'left'); pad('bRight', 'right'); pad('bBoost', 'boost');
const KEYS = { KeyW: 'gas', ArrowUp: 'gas', KeyS: 'brake', ArrowDown: 'brake', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'boost', ShiftLeft: 'boost', ShiftRight: 'boost' };
addEventListener('keydown', (e) => {
  if (KEYS[e.code]) { e.preventDefault(); audio.init(); keys[KEYS[e.code]] = true; }
  else if (e.code === 'Escape' || e.code === 'KeyP') state === 'paused' ? resume() : pause();
});
addEventListener('keyup', (e) => { if (KEYS[e.code]) keys[KEYS[e.code]] = false; });
addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => document.hidden && pause());

// ------------------------------------------------------------------ inside the app: a time limit
// how long is decided by the database (public/play-time.js), never by the URL or this device's clock
if (PLAY) {
  $('bLeave').classList.remove('hidden');
  $('bLeave').onclick = () => { persist(); location.replace(STOP); };
  $('timer').classList.remove('hidden');
}
import('/play-time.js').then(({ playTime }) => playTime({
  learner: PLAY?.learner, back: BACK,
  show: (left) => { $('timer').textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; },
  done: () => { persist(); state = 'paused'; toast("Time's up! Your coins are saved."); },
}), () => { if (!['localhost', '127.0.0.1'].includes(location.hostname)) location.replace(BACK); });

// for poking at the game from the console while building it; never on a real host
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.PK = { view, run: () => run, start: startLevel, save: () => save, keys, LEVELS, auto: (f) => (autopilot = f) };

titleScreen();
requestAnimationFrame(frame);
