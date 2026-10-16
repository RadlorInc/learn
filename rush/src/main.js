// Rescue Rush: screens, controls, the garage and saving around the rules (rules.js), the calls (levels.js) and the 3D
// view (view.js). Like the other games, it plays standalone (on localhost only), or inside the
// app with ?key=<save key>&learner=<child id>: it plays the time the database says and goes back to /play.
import { DT, newRun, step, vehicleStats } from './rules.js';
import { LEVELS } from './levels.js';
import { createView } from './view.js';
import * as audio from './audio.js';

const { sfx } = audio;
const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const PLAY = Q.has('key') && Q.has('learner') ? { key: Q.get('key'), learner: Q.get('learner') } : null;
const SAVE_KEY = PLAY ? PLAY.key : 'rush.save';
// `game=rush` keeps Rescue Rush picked on /play when the child comes back
const BACK = '/play?game=rush', STOP = '/play?stop=1&game=rush';
// the paid clock's { pause, resume } (public/play-time.js): the Pause screen stops it, leaving that screen starts it
let time = null;
const SLOW = 0.75; // slow mode: the whole game at 75% — the same calls, more time to think

// vehicles change the feel a little; upgrades make the calls easier (every call can be done without any — check.mjs)
const VEHICLES = [
  { id: 'ambulance', name: 'Ambulance', about: 'Quick and steady', price: 0 },
  { id: 'jeep', name: 'Rescue Jeep', about: 'Fast, nimble steering', price: 120 },
  { id: 'fire', name: 'Fire Engine', about: 'A longer siren', price: 220 },
];
const UPGRADES = [
  { id: 'engine', name: '⚙️ Engine', about: 'Faster, quicker to speed up', cost: [40, 80, 140] },
  { id: 'brakes', name: '🛑 Brakes', about: 'Stop sooner', cost: [40, 80, 140] },
  { id: 'handling', name: '🛞 Handling', about: 'Change lanes faster', cost: [40, 80, 140] },
  { id: 'siren', name: '🚨 Siren', about: 'Sounds for longer', cost: [40, 80, 140] },
];
const starsFor = (lv, r) => (r.clock >= lv.time * 0.25 ? 3 : r.clock >= lv.time * 0.12 ? 2 : 1);

// ------------------------------------------------------------------ save
const blank = () => ({ vehicle: 'ambulance', owned: ['ambulance'], coins: 0, up: { engine: 0, brakes: 0, handling: 0, siren: 0 }, calls: {}, slow: false });
let save = (() => { try { const b = blank(), s = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; return { ...b, ...s, up: { ...b.up, ...s.up }, calls: s.calls ?? {} }; } catch { return blank(); } })();
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...save, savedAt: Date.now() })); } catch { /* full or private */ } };

// ------------------------------------------------------------------ state
const view = createView($('cv'));
let state = 'title', run = null, prev = null, acc = 0, i0 = 0, demo = null;
const keys = { brake: false, left: false, right: false, siren: false };

function startLevel(i) {
  audio.init();
  const lv = LEVELS[i];
  view.setLevel(lv, save.vehicle);
  run = newRun(lv, vehicleStats(save.up, save.vehicle)); run.coins = 0; run.lv = lv; i0 = i;
  prev = { x: run.x, z: run.z }; acc = 0; demo = null;
  for (const k in keys) keys[k] = false;
  show(null); state = 'playing';
  hint(lv.hint, 6);
}
function onEvents(ev) {
  for (const e of ev) {
    if (e.t === 'coin') { run.coins++; save.coins++; sfx.coin(run.coins % 4 + 1); }
    else if (e.t === 'clock') { sfx.clock(); toast('⏱ +3 seconds!'); }
    else if (e.t === 'siren') sfx.siren(run.car.sirenLen);
    else if (e.t === 'crash') { sfx.crash(); toast(e.hearts > 0 ? `Crash! Careful with the patient ${'❤️'.repeat(e.hearts)}` : 'Oh no!'); navigator.vibrate?.(120); }
    else if (e.t === 'fail') end(false, e.why);
    else if (e.t === 'arrive') end(true);
  }
}
function end(ok, why) {
  state = 'over';
  const lv = run.lv, rec = (save.calls[lv.id] ||= { stars: 0 });
  if (ok) { const st = starsFor(lv, run), bonus = 10 + 10 * st; rec.stars = Math.max(rec.stars, st); run.coins += bonus; save.coins += bonus; sfx.win(); }
  else sfx.fail();
  persist();
  setTimeout(() => {
    $('endTitle').textContent = ok ? 'The patient is at the hospital!' : why === 'time' ? 'Out of time!' : 'Too many crashes!';
    $('endStars').textContent = ok ? '★'.repeat(starsFor(lv, run)) + '☆'.repeat(3 - starsFor(lv, run)) : '';
    $('endStats').textContent = ok ? `⏱ ${run.clock.toFixed(1)} s to spare · 🪙 ${run.coins} coins` : why === 'time' ? 'Go faster, and use the siren when your lane is blocked.' : 'Change lanes early, and watch for blinking lights.';
    $('bNext').classList.toggle('hidden', !ok || i0 === LEVELS.length - 1);
    show('end');
  }, 900);
}

// ------------------------------------------------------------------ loop
let last = performance.now();
let autopilot = null; // set from the console on localhost only (RR.auto), to drive the game for screenshots
function input() { return autopilot ? autopilot(run) : { brake: keys.brake, steer: (keys.right ? 1 : 0) - (keys.left ? 1 : 0), siren: keys.siren }; }
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === 'playing') {
    acc += dt * (save.slow ? SLOW : 1);
    while (acc >= DT && state === 'playing') { prev = { x: run.x, z: run.z }; const ev = []; step(run, input(), run.lv, ev); onEvents(ev); acc -= DT; }
  }
  if (run) { const a = state === 'playing' ? acc / DT : 1; view.render(run, { x: prev.x + (run.x - prev.x) * a, z: prev.z + (run.z - prev.z) * a }, dt); hud(); }
  else if (demo) view.render(demo, { x: demo.x, z: 0 }, dt, true);
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ HUD, screens, messages
let lastHud = '';
function hud() {
  const r = run, key = `${Math.round(r.v * 3.6)}|${Math.ceil(r.clock)}|${r.hearts}|${Math.round(r.siren * 10)}|${r.coins}|${Math.round((r.z / r.lv.length) * 100)}`;
  if (key === lastHud) return;
  lastHud = key;
  $('speed').textContent = `${Math.round(r.v * 3.6)} km/h`;
  $('clock').textContent = `⏳ ${Math.max(0, Math.ceil(r.clock))}`;
  $('clock').classList.toggle('low', r.clock < 10);
  $('hearts').textContent = '❤️'.repeat(Math.max(0, r.hearts)) + '🤍'.repeat(3 - Math.max(0, r.hearts));
  $('coins').textContent = `🪙 ${r.coins}`;
  $('barIn').style.width = `${Math.min(100, (r.z / r.lv.length) * 100)}%`;
  $('sirenIn').style.width = `${r.siren * 100}%`;
  $('bSiren').classList.toggle('empty', r.siren < 0.3 && r.sirenT <= 0);
}
function show(name) {
  time?.[name === 'pause' ? 'pause' : 'resume']();
  for (const id of ['title', 'pause', 'end']) $(id).classList.toggle('hidden', id !== name);
  $('hud').classList.toggle('hidden', name === 'title');
  $('pads').classList.toggle('hidden', name !== null);
}
let toastT = 0;
function toast(text) { const el = $('toast'); el.textContent = text; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => (el.style.opacity = 0), 1500); }
let hintT = 0;
function hint(text, secs) { const el = $('hint'); el.textContent = text; el.style.opacity = 1; clearTimeout(hintT); hintT = setTimeout(() => (el.style.opacity = 0), secs * 1000); }

function tile(html, cls, onClick, label) {
  const b = document.createElement('button');
  b.className = 'tile ' + cls; b.innerHTML = html; b.onclick = onClick;
  if (label) b.setAttribute('aria-label', label);
  return b;
}
function titleScreen() {
  state = 'title'; run = null;
  if (!demo) { view.setLevel(LEVELS[0], save.vehicle); demo = newRun(LEVELS[0], vehicleStats()); }
  $('bank').textContent = `🪙 ${save.coins} coins`;
  $('vehicles').replaceChildren(...VEHICLES.map((v) => {
    const owned = save.owned.includes(v.id), on = save.vehicle === v.id;
    return tile(`<b>${v.name}</b><small>${v.about}</small><small>${on ? 'Driving' : owned ? 'Tap to drive' : `🪙 ${v.price} to buy`}</small>`,
      (on ? 'on' : '') + (!owned && save.coins < v.price ? ' locked' : ''),
      () => {
        if (owned) save.vehicle = v.id;
        else if (save.coins >= v.price) { save.coins -= v.price; save.owned.push(v.id); save.vehicle = v.id; sfx.buy(); }
        else return;
        persist(); demo = null; titleScreen();
      }, `${v.name}: ${owned ? 'owned' : `${v.price} coins`}`);
  }));
  $('garage').replaceChildren(...UPGRADES.map((u) => {
    const lvl = save.up[u.id] ?? 0, max = u.cost.length, cost = u.cost[lvl];
    return tile(`<b>${u.name}</b><small>${u.about}</small><span>${'●'.repeat(lvl)}${'○'.repeat(max - lvl)}</span><small>${lvl === max ? 'All done!' : `🪙 ${cost}`}</small>`,
      lvl < max && save.coins < cost ? 'locked' : '',
      () => { if (lvl < max && save.coins >= cost) { save.coins -= cost; save.up[u.id] = lvl + 1; sfx.buy(); persist(); titleScreen(); } },
      `${u.name.slice(u.name.indexOf(' ') + 1)}: level ${lvl} of ${max}`);
  }));
  $('levels').replaceChildren(...LEVELS.map((lv, i) => {
    const st = save.calls[lv.id]?.stars ?? 0, open = i === 0 || (save.calls[LEVELS[i - 1].id]?.stars ?? 0) > 0;
    return tile(`<b>${i + 1}. ${lv.name}</b><span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span><small>${!open ? '🔒 Finish the call before' : st ? 'Done!' : `${(lv.length / 1000).toFixed(1)} km in ${lv.time} s`}</small>`,
      open ? '' : 'locked', () => open && startLevel(i));
  }));
  $('bSlow').textContent = save.slow ? '🐢 Slow mode: on' : '🐢 Slow mode: off';
  $('bMute').textContent = audio.isMuted() ? '🔇 Sound off' : '🔊 Sound on';
  show('title');
}
function pause() { if (state !== 'playing') return; state = 'paused'; for (const k in keys) keys[k] = false; persist(); show('pause'); }
function resume() { if (state !== 'paused') return; show(null); state = 'playing'; last = performance.now(); }

$('bPause').onclick = pause;
$('bResume').onclick = resume;
$('bRestart').onclick = () => startLevel(i0);
$('bLevels').onclick = $('bLevels2').onclick = () => { persist(); titleScreen(); };
$('bAgain').onclick = () => startLevel(i0);
$('bNext').onclick = () => startLevel(i0 + 1);
$('bSlow').onclick = () => { save.slow = !save.slow; persist(); titleScreen(); };
$('bMute').onclick = () => { audio.init(); audio.toggleMute(); titleScreen(); };

// ------------------------------------------------------------------ controls: four buttons, or A S D / arrows and Space (the vehicle speeds up by itself)
function pad(id, name) {
  const el = $(id), down = (e) => { e.preventDefault(); audio.init(); keys[name] = true; el.classList.add('down'); el.setPointerCapture?.(e.pointerId); };
  const up = () => { keys[name] = false; el.classList.remove('down'); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}
pad('bBrake', 'brake'); pad('bLeft', 'left'); pad('bRight', 'right'); pad('bSiren', 'siren');
const KEYS = { KeyS: 'brake', ArrowDown: 'brake', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'siren', KeyH: 'siren' };
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
  $('bLeave2').classList.remove('hidden');
  $('bLeave').onclick = $('bLeave2').onclick = () => { persist(); location.replace(STOP); };
  $('timer').classList.remove('hidden');
}
import('/play-time.js').then(({ playTime }) => (time = playTime({
  learner: PLAY?.learner, back: BACK,
  show: (left) => { $('timer').textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; },
  done: () => { persist(); state = 'paused'; toast("Time's up! Your coins are saved."); },
})), () => { if (!['localhost', '127.0.0.1'].includes(location.hostname)) location.replace(BACK); });

// for poking at the game from the console while building it; never on a real host
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.RR = { run: () => run, start: startLevel, keys, save: () => save, LEVELS, auto: (f) => (autopilot = f) };

titleScreen();
requestAnimationFrame(frame);
