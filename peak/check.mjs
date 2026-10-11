// For every world, with the car as it comes (no upgrades), an autopilot drives the game's own step() from the camp
// along a mission's trail (and the trails it branches from) and proves:
//   1. every mission can be done: the chest or beacon is reached; a delivery reaches its village with no slam and no
//      roll (either would break the crate) — starting with no boost cans, picking up only those on the way;
//   2. every danger marked `bite` (a steep drop, an icy one, a ridge) punishes a child who does not control the speed:
//      the same drive, but GAS held all along that leg and the next (the turn at the foot of a drop), ends in a fall,
//      a flip or deep water there;
//   3. no gap can be jumped without BOOST: the same drive without boost falls in.
// The autopilot looks a few metres down the trail, steers for it (round rocks, towards boost cans), keeps to each
// leg's speed, levels the car in the air, and boosts on a ramp. It is one way to drive, not the only one: a pass shows
// a mission CAN be done; a fail says where the autopilot's drive ended and why. The land between the trails is not
// proved — it is free play.
// Exit 0 = every world passes, 1 = a world fails, 2 = could not run.
//   node peak/check.mjs
import { newState, step, carStats, rot } from './src/physics.js';
import { LEVELS } from './src/levels.js';

const car = carStats();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// route: track indices from the camp to the target, in order
export function pilot(s, lv, mem, route, useBoost = true) {
  const P = lv.track, fwd = rot(s.q, [0, 0, -1]), last = route.length - 1;
  if (!mem.pos) { mem.pos = new Map(route.map((i, k) => [i, k])); mem.k = 0; }
  let best = mem.k, bd = Infinity;
  for (let k = Math.max(0, mem.k - 30); k <= Math.min(last, mem.k + 60); k++) { const p = P[route[k]], d = Math.hypot(p.x - s.p[0], p.z - s.p[2]); if (d < bd) { bd = d; best = k; } }
  const k = (mem.k = best), i = route[k], speed = s.v[0] * fwd[0] + s.v[1] * fwd[1] + s.v[2] * fwd[2];
  const T = P[route[Math.min(last, k + Math.round(5 + Math.abs(speed) * 0.45))]];
  // where across the trail to be: round the next rock, else at the next boost can
  const ahead = (at) => { const j = mem.pos.get(at); return j !== undefined && j > k - 2 && j < k + 18; };
  let off = 0;
  const rock = lv.things.find((o) => o.kind === 'rock' && ahead(o.at));
  const can = lv.items.find((it, n) => !s.got.has(n) && it.kind === 'boost' && it.at >= 0 && ahead(it.at));
  if (rock) off = -Math.sign(rock.off) * (lv.half - 1.4); else if (can) off = can.off;
  const tx = T.x + Math.cos(T.h) * off, tz = T.z + Math.sin(T.h) * off; // +off is to the right of the trail
  const err = wrap(Math.atan2(tx - s.p[0], -(tz - s.p[2])) - Math.atan2(fwd[0], -fwd[2]));
  // the slowest leg in the next stretch (a longer look the faster the car goes)
  let vt = 99;
  for (let n = 0; n < 10 + Math.abs(speed) * 1.6; n++) vt = Math.min(vt, lv.legAt(route[Math.min(last, k + n)]).speed);
  if (k > last - 12) vt = Math.min(vt, 6); // arriving
  let gas = speed < vt - 0.3, brake = speed > vt + 1.5;
  if (lv.legAt(i).flat) { gas = true; brake = false; } // a test of a danger: flat out on this leg
  if (!s.contact) {
    // in the air: bring the nose to the slope of the trail ahead
    const a = P[route[Math.min(last, k + 4)]], b = P[route[Math.min(last, k + 10)]], pitch = Math.asin(fwd[1]), target = Math.atan2(b.y - a.y, 6);
    gas = pitch < target - 0.06; brake = pitch > target + 0.1;
  }
  return { gas, brake, steer: Math.max(-1, Math.min(1, err * 2.2)), boost: useBoost && lv.legAt(i).kind === 'ramp' && speed > 6 };
}

// from the camp (facing the mission's trail) along the route to track index `to`; done when mission `id` is reached
// (or, with no id, the end of the route)
export function drive(lv, to, { id = null, boost = true, careful = false, maxT = 240 } = {}) {
  const route = lv.route(to), P = lv.track, first = P[route[0]], s = newState(lv, lv.camp.x, lv.camp.z, first.h), mem = {};
  let best = 0, bestT = 0;
  while (s.t < maxT) {
    const ev = [];
    step(s, pilot(s, lv, mem, route, boost), lv, car, ev);
    const where = () => `track metre ${route[mem.k]} (${P[route[mem.k]].trail} trail, ${lv.legAt(route[mem.k]).kind ?? 'plain'} leg)`;
    for (const e of ev) {
      if (e.t === 'flip' || e.t === 'fall' || e.t === 'deep') return { ok: false, at: route[mem.k], why: `${e.t === 'deep' ? 'drove into deep water' : e.t === 'fall' ? 'fell' : 'flipped'} at ${where()}` };
      if (e.t === 'slam' && careful) return { ok: false, at: route[mem.k], why: `slammed down (${e.hit.toFixed(1)} m/s) at ${where()} — the crate breaks` };
      if (e.t === 'reach' && e.id === id) return { ok: true };
    }
    if (!id && mem.k >= route.length - 3) return { ok: true };
    if (mem.k > best + 1) { best = mem.k; bestT = s.t; }
    if (s.t - bestT > 20) return { ok: false, at: route[mem.k], why: `stuck at ${where()} for 20 s` };
  }
  return { ok: false, why: 'out of time' };
}

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) { // run as a script (the browser imports pilot() for screenshots)
  let bad = 0;
  const say = (ok, id, text) => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}: ${text}`); };
  try {
    for (const lv of LEVELS) {
      for (const m of lv.missions) {
        const r = drive(lv, m.at, { id: m.id, careful: m.kind === 'deliver' });
        say(r.ok, lv.id, `${m.id}: ${r.ok ? (m.kind === 'deliver' ? 'delivered, the crate whole' : 'reached') : r.why}`);
      }
      lv.legs.forEach((leg, li) => {
        if (!leg.bite) return;
        const next = lv.legs[li + 1]?.trail === leg.trail ? lv.legs[li + 1] : null;
        leg.flat = true; if (next) next.flat = true;
        const c = drive(lv, lv.trailsById[leg.trail].to - 1);
        delete leg.flat; if (next) delete next.flat;
        const there = !c.ok && c.at >= leg.from - 5 && c.at < leg.to + 60;
        say(there, lv.id, `GAS held through the ${leg.kind} on the ${leg.trail} trail: ${c.ok ? 'gets through — it does not need control' : there ? c.why : `${c.why} — not at this danger`}`);
      });
      for (const g of lv.gaps) {
        const trail = lv.track[g.from].trail, c = drive(lv, lv.trailsById[trail].to - 1, { boost: false });
        say(!c.ok && /fell/.test(c.why) && c.at >= g.from - 15 && c.at < g.to + 10, lv.id, `without boost, the gap on the ${trail} trail: ${c.ok ? 'is jumped — it does not need boost' : c.why}`);
      }
    }
  } catch (e) { console.error('could not run the check:', e); process.exit(2); }
  process.exit(bad ? 1 : 0);
}
