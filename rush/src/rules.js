// Rescue Rush rules: an emergency vehicle on a straight road full of traffic, one fixed step. No DOM, no 3D — the game
// and check.mjs run exactly this; view.js only draws it. Units are metres and seconds; z is the distance along the road
// (forward), x is across it (0 = the middle, + = right).
//
// Each level is a call: reach the hospital `length` metres away within `time` seconds. The child steers across the
// lanes and BRAKEs — the vehicle speeds up by itself — and has a SIREN: while it sounds, vehicles ahead in the child's lane, going the same
// way, pull over into a free lane beside them (never into another vehicle, never the oncoming ones). The siren's
// charge runs down while it sounds and slowly fills again. A crash slows the vehicle hard and costs one of the
// patient's three hearts; with none left the call fails. Clocks on the road add time; coins buy vehicles and upgrades.
// Traffic comes from a seeded generator, so the same level plays out the same way for the same driving.

export const DT = 1 / 120;
export const LANE = 3.4;
const CAR_W = 2.0, CAR_L = 4.6; // the player's vehicle
export const TYPES = {
  car: { w: 1.8, l: 4.2, v: [13, 20] },
  auto: { w: 1.4, l: 2.8, v: [8, 12] }, // auto-rickshaw: slow, small
  scooter: { w: 0.8, l: 1.9, v: [10, 15] },
  bus: { w: 2.5, l: 10, v: [11, 16] },
  truck: { w: 2.5, l: 8.5, v: [9, 14] },
};

// the vehicle as it comes, and what the garage changes
export const BASE = { top: 30, accel: 6.5, brake: 14, steer: 6.5, siren: 1 };
export function vehicleStats(up = {}, kind = 'ambulance') {
  const k = { ambulance: { top: 1, steer: 1 }, jeep: { top: 1.04, steer: 1.12 }, fire: { top: 0.94, steer: 0.9, sirenLen: 1.3 } }[kind] ?? { top: 1, steer: 1 };
  return {
    top: BASE.top * k.top * (1 + 0.06 * (up.engine ?? 0)), accel: BASE.accel * (1 + 0.1 * (up.engine ?? 0)),
    brake: BASE.brake * (1 + 0.15 * (up.brakes ?? 0)), steer: BASE.steer * k.steer * (1 + 0.1 * (up.handling ?? 0)),
    sirenLen: 3 * (k.sirenLen ?? 1) * (1 + 0.2 * (up.siren ?? 0)),
  };
}

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// lanes: index 0 is the leftmost; `lanes` of them, the leftmost `oncoming` of them carry traffic towards the player
export const laneX = (lv, i) => (i - (lv.lanes - 1) / 2) * LANE;
const laneOf = (lv, x) => Math.max(0, Math.min(lv.lanes - 1, Math.round(x / LANE + (lv.lanes - 1) / 2)));

export function newRun(lv, car) {
  const firstLane = lv.oncoming; // start in the leftmost lane going our way
  return {
    t: 0, z: 0, x: laneX(lv, firstLane), v: 8, steer: 0, hearts: 3, siren: 1, sirenT: 0, hitT: 0, clock: lv.time,
    cars: [], next: 60, rand: rng(lv.seed), got: new Set(), done: false, failed: null, car,
  };
}

// input: { brake, steer (-1 … 1), siren }
export function step(r, inp, lv, ev) {
  const car = r.car;
  r.t += DT; r.clock -= DT;
  // speed: up by itself towards the top speed; BRAKE slows hard
  if (inp.brake) r.v = Math.max(0, r.v - car.brake * DT);
  else r.v = Math.min(car.top, r.v + car.accel * (1 - (r.v / car.top) ** 2 * 0.5) * DT);
  // steering: across the road, quicker at speed (on a wet road less), never off it
  const grip = lv.wet ? 0.75 : 1, edge = (lv.lanes * LANE) / 2 - CAR_W / 2;
  r.steer += Math.max(-6 * DT, Math.min(6 * DT, (inp.steer || 0) - r.steer));
  r.x += r.steer * car.steer * grip * Math.min(1, 0.35 + r.v / 18) * DT;
  if (Math.abs(r.x) > edge) { r.x = Math.sign(r.x) * edge; r.v = Math.max(0, r.v - 8 * DT); } // scraping the kerb
  r.z += r.v * DT;
  // the siren: sounds for a while when there is charge, fills again slowly
  if (inp.siren && r.sirenT <= 0 && r.siren >= 0.3) { r.sirenT = car.sirenLen; ev.push({ t: 'siren' }); }
  if (r.sirenT > 0) { r.sirenT -= DT; r.siren = Math.max(0, r.siren - DT / (car.sirenLen * 1.2)); }
  else r.siren = Math.min(1, r.siren + 0.06 * DT);
  r.hitT = Math.max(0, r.hitT - DT);

  // traffic: new vehicles appear far ahead; old ones go once far behind
  while (r.next < r.z + 230 && r.next < lv.length + 60) { spawn(r, lv); r.next += lv.gap * (0.6 + r.rand() * 0.8); }
  weave(r, lv);
  const lane = laneOf(lv, r.x);
  for (const c of r.cars) {
    c.z += c.v * c.dir * DT;
    // a lane change, slow and signalled (its blinker shows for a second before it moves)
    if (c.signal > 0) { c.signal -= DT; if (c.signal <= 0) c.lane = c.to; }
    c.x += Math.max(-2.2 * DT, Math.min(2.2 * DT, laneX(lv, c.lane) - c.x));
    // the siren: same-way vehicles ahead in the player's lane pull over, if a lane beside them is free
    if (r.sirenT > 0 && c.dir > 0 && c.lane === lane && c.z > r.z && c.z - r.z < 75 && c.signal <= 0) {
      for (const to of [c.lane + 1, c.lane - 1].filter((l) => l >= lv.oncoming && l < lv.lanes)) if (free(r, lv, c, to)) { c.to = to; c.signal = 0.25; c.pulled = true; break; }
    }
    // a same-way vehicle never drives into the one ahead of it in its lane
    if (c.dir > 0) { const ahead = r.cars.find((o) => o !== c && o.dir > 0 && o.lane === c.lane && o.z > c.z && o.z - c.z < (c.l + o.l) / 2 + 6); if (ahead) c.v = Math.min(c.v, ahead.v); }
  }
  r.cars = r.cars.filter((c) => c.z > r.z - 40 && c.z < r.z + 400);

  // a crash: the player's box overlaps a vehicle's
  if (r.hitT <= 0) for (const c of r.cars) {
    if (Math.abs(c.x - r.x) < (c.w + CAR_W) / 2 - 0.1 && Math.abs(c.z - r.z) < (c.l + CAR_L) / 2 - 0.1) {
      r.hearts--; r.hitT = 1.5; r.v = c.dir > 0 ? Math.min(r.v, c.v * 0.5) : 0;
      c.z += c.dir > 0 ? 3 : 0; c.v *= 0.5;
      ev.push({ t: 'crash', hearts: r.hearts });
      if (r.hearts <= 0) { r.failed = 'hearts'; ev.push({ t: 'fail', why: 'hearts' }); return; }
      break;
    }
  }
  // things on the road: clocks (+time) and coins
  for (let i = 0; i < lv.items.length; i++) {
    const it = lv.items[i];
    if (r.got.has(i) || Math.abs(it.z - r.z) > 2.5 || Math.abs(laneX(lv, it.lane) - r.x) > 1.8) continue;
    r.got.add(i);
    if (it.kind === 'clock') r.clock += 3;
    ev.push({ t: it.kind, idx: i });
  }
  if (r.z >= lv.length) { r.done = true; ev.push({ t: 'arrive' }); return; }
  if (r.clock <= 0) { r.clock = 0; r.failed = 'time'; ev.push({ t: 'fail', why: 'time' }); }
}

// is lane `to` free around vehicle c (room before and behind it)?
function free(r, lv, c, to) {
  if (Math.abs(laneX(lv, to) - r.x) < 2.6 && Math.abs(r.z - c.z) < 12) return false;
  return !r.cars.some((o) => o !== c && (o.lane === to || o.to === to) && Math.abs(o.z - c.z) < (o.l + c.l) / 2 + 5);
}

function spawn(r, lv) {
  const R = r.rand, z = r.z + 200 + R() * 30;
  const lane = Math.floor(R() * lv.lanes), dir = lane < lv.oncoming ? -1 : 1;
  const mix = lv.mix, pick = R() * mix.reduce((a, [, w]) => a + w, 0);
  let acc = 0, type = mix[0][0];
  for (const [k, w] of mix) { acc += w; if (pick <= acc) { type = k; break; } }
  const T = TYPES[type];
  if (r.cars.some((o) => o.lane === lane && Math.abs(o.z - z) < 18)) return;
  const c = { type, lane, to: lane, x: laneX(lv, lane), z, dir, w: T.w, l: T.l, v: T.v[0] + R() * (T.v[1] - T.v[0]), signal: 0, colour: Math.floor(R() * 8) };
  // some same-way vehicles will change lane once, a little ahead of the player (blinker first)
  if (dir > 0 && R() < lv.weave) c.weaveAt = 25 + R() * 50;
  r.cars.push(c);
}

// a same-way vehicle marked to weave changes lane once, when the player comes within `weaveAt` metres behind it
function weave(r, lv) {
  for (const c of r.cars) {
    if (c.weaveAt == null || c.signal > 0 || c.z - r.z > c.weaveAt) continue;
    const to = c.lane + (r.rand() < 0.5 ? -1 : 1);
    if (to >= lv.oncoming && to < lv.lanes && free(r, lv, c, to)) { c.to = to; c.signal = 1; }
    c.weaveAt = null;
  }
}
