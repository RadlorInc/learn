// For every call, with the vehicle as it comes (no upgrades), the game's own step() proves:
//   1. it CAN be done: an autopilot reaches the hospital before the clock runs out, with the patient's hearts left;
//   2. the clock means hurrying: the same autopilot held to a steady 15 m/s (54 km/h) runs out of time;
//   3. the traffic means steering: driving straight down the starting lane (no steering, no brake, no siren) fails.
// The autopilot looks down each lane going its way, moves to the clearest one when the lane beside it is free, keeps a
// safe distance, and sounds the siren when its lane is blocked. It is one way to drive, not the only one.
// Exit 0 = every call passes, 1 = a call fails, 2 = could not run.
//   node rush/check.mjs
import { newRun, step, vehicleStats, laneX, LANE } from './src/rules.js';
import { LEVELS } from './src/levels.js';

export const starsFor = (lv, r) => (r.clock >= lv.time * 0.25 ? 3 : r.clock >= lv.time * 0.12 ? 2 : 1);

export function pilot(r, lv, mem = {}, cap = Infinity) {
  const own = []; for (let l = lv.oncoming; l < lv.lanes; l++) own.push(l);
  // how far a lane is clear ahead of the player (from the player's nose to the vehicle's tail)
  const clear = (l) => {
    let d = 200;
    for (const c of r.cars) if (Math.abs(c.x - laneX(lv, l)) < (c.w + 2) / 2 + 0.4 && c.z + c.l / 2 > r.z - 2.3) d = Math.min(d, c.z - c.l / 2 - (r.z + 2.3));
    return d;
  };
  const beside = (l) => !r.cars.some((c) => Math.abs(c.x - laneX(lv, l)) < (c.w + 2) / 2 + 0.4 && Math.abs(c.z - r.z) < (c.l + 4.6) / 2 + 4);
  const cur = mem.lane ?? own.reduce((a, l) => (Math.abs(laneX(lv, l) - r.x) < Math.abs(laneX(lv, a) - r.x) ? l : a), own[0]);
  let lane = cur;
  if (Math.abs(laneX(lv, cur) - r.x) < 0.5) {
    const here = clear(cur);
    for (const l of [cur - 1, cur + 1]) if (own.includes(l) && beside(l) && clear(l) > here + 15 && clear(l) > clear(lane)) lane = l;
  }
  mem.lane = lane;
  const ahead = clear(cur), safe = 10 + r.v * 0.9;
  const blocked = ahead < safe;
  const front = r.cars.filter((c) => Math.abs(c.x - r.x) < (c.w + 2) / 2 + 0.4 && c.z > r.z).sort((a, b) => a.z - b.z)[0];
  return {
    brake: (blocked && front && r.v > front.v * front.dir - 0.5) || r.v > cap + 0.5,
    steer: Math.max(-1, Math.min(1, (laneX(lv, lane) - r.x) * 0.9)),
    siren: ahead < 45 && lane === cur && r.siren >= 0.3,
  };
}

export function drive(lv, how = 'pilot', cap = Infinity) {
  const r = newRun(lv, vehicleStats()), mem = {};
  let crashes = 0;
  while (!r.done && !r.failed && r.t < lv.time + 60) {
    const ev = [], inp = how === 'pilot' ? pilot(r, lv, mem, cap) : {};
    step(r, inp, lv, ev);
    crashes += ev.filter((e) => e.t === 'crash').length;
  }
  return { r, crashes };
}

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  let bad = 0;
  const say = (ok, id, text) => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}: ${text}`); };
  try {
    for (const lv of LEVELS) {
      const a = drive(lv);
      say(a.r.done, lv.id, a.r.done ? `the autopilot arrives with ${a.r.clock.toFixed(1)} s left (${starsFor(lv, a.r)} stars), ${a.crashes} crashes` : `the autopilot fails: ${a.r.failed === 'time' ? 'out of time' : 'no hearts left'} at ${a.r.z.toFixed(0)} of ${lv.length} m`);
      const slow = drive(lv, 'pilot', 15);
      say(!slow.r.done, lv.id, slow.r.done ? `a steady 15 m/s also arrives (${slow.r.clock.toFixed(1)} s left) — the clock does not make anyone hurry` : `a steady 15 m/s ${slow.r.failed === 'time' ? 'runs out of time' : 'loses the hearts'} at ${slow.r.z.toFixed(0)} m`);
      const blind = drive(lv, 'blind');
      say(!blind.r.done, lv.id, blind.r.done ? 'driving straight down one lane also arrives — the traffic does not need steering' : `driving straight down one lane fails (${blind.r.failed === 'time' ? 'out of time' : `${blind.crashes} crashes`}) at ${blind.r.z.toFixed(0)} m`);
    }
  } catch (e) { console.error('could not run the check:', e); process.exit(2); }
  process.exit(bad ? 1 : 0);
}
