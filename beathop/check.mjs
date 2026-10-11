// Can a person finish every level, and get all three stars in one run? A search over the one button, decided only
// every 100 ms (no quick-fingered timing), running the game's own step(). Exit 0 = every level passes, 1 = a level
// fails (it says how far the best try got), 2 = could not run.
//   node beathop/check.mjs
import { H, makeLevel, newState, step } from './src/game.js';
import { LEVELS } from './src/levels.js';

const EVERY = 12; // steps per decision: 12 × 1/120 s = 100 ms
const q = (v, k) => Math.round(v * k);

function search(lv) {
  let front = [{ s: newState(), stars: 0 }], furthest = 0, finished = false;
  const all = (1 << lv.stars.length) - 1;
  for (let n = 0; front.length && n < 100000; n++) {
    const next = new Map();
    for (const { s, stars } of front) for (const held of [false, true]) {
      const t = { ...s };
      let got = stars;
      for (let k = 0; k < EVERY && !t.dead && !t.won; k++) {
        const ev = [];
        step(t, held, lv, ev);
        for (const e of ev) if (e.t === 'pick' && e.ch === 'S') got |= 1 << lv.stars.indexOf(e.x * H + e.y);
      }
      if (t.dead) continue;
      furthest = Math.max(furthest, t.x);
      if (t.won) { finished = true; if (got === all) return { finished, stars: true }; continue; }
      const key = [q(t.y, 20), q(t.vy, 2), t.mode, t.flip, t.grounded, t.held, t.cut, t.ring, t.pad, got].join();
      if (!next.has(key)) next.set(key, { s: t, stars: got });
    }
    front = [...next.values()];
  }
  return { finished, stars: false, furthest };
}

// A shield takes exactly one thorn: run straight along a floor with thorns at x=8 and x=20, never pressing.
function shieldRun(shield) {
  const lv = makeLevel({ w: 30, build: (b) => { b.fill(0, 30, 0, 1, '='); b.set(8, 1, '^'); b.set(20, 1, '^'); b.trig(28, 'G'); } });
  const s = { ...newState(), shield };
  while (!s.dead && !s.won) step(s, false, lv, []);
  return { diedAt: s.dead ? Math.floor(s.x + 0.5) : null, shieldLeft: s.shield };
}

let bad = 0;
try {
  const none = shieldRun(false), one = shieldRun(true);
  // without a shield the first thorn (x=8) stops the run; with one, the second (x=20) does and the shield is gone
  const shieldOk = none.diedAt >= 7 && none.diedAt <= 8 && one.diedAt >= 19 && one.diedAt <= 20 && !one.shieldLeft;
  if (!shieldOk) bad++;
  console.log(`${shieldOk ? 'ok  ' : 'FAIL'} shield: no shield dies near x=${none.diedAt}, a shield dies near x=${one.diedAt} (expected about 8 and 20)`);
  for (const def of LEVELS) {
    const lv = makeLevel(def), r = search(lv);
    const msg = !r.finished ? `cannot be finished — the best try dies near x=${r.furthest.toFixed(1)} of ${lv.goal}`
      : !r.stars ? `can be finished, but not with all ${lv.stars.length} stars in one run` : `finishable, all ${lv.stars.length} stars in one run`;
    if (!r.finished || !r.stars || lv.stars.length !== 3) bad++;
    console.log(`${r.finished && r.stars && lv.stars.length === 3 ? 'ok  ' : 'FAIL'} ${def.id}: ${msg}`);
  }
} catch (e) { console.error('could not run the check:', e); process.exit(2); }
process.exit(bad ? 1 : 0);
