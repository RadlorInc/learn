// Peak Rider rules: a car on four sprung wheels driving over a world's ground (a height map), one fixed step. No DOM,
// no 3D library — the game and check.mjs run exactly this; render3d.js only draws it.
// World axes: x east, z south, y up. The car's own axes (as three.js draws it): x right, y up, -z forward.
//
// Each wheel is a spring pushed down from the body until it meets the ground; where it touches, the tyre drives or
// brakes along the ground and grips sideways — never more than the ground's grip allows (mud, ice and water give less).
// The front wheels steer, less at speed. In the air GAS tips the nose up and BRAKE tips it down; nothing straightens
// the car for the driver. BOOST burns one can: a hard push forward for a moment. The body itself meets the ground
// too (a wall, a bump, the far side of a gap); its roof on the ground is a flip. Falling into a ravine, off a ridge or
// into deep water is a fall. Either way the car goes back to a safe spot. A hard landing
// (meeting the ground fast and square on) is a slam: it breaks a crate being delivered.

export const DT = 1 / 120;
export const G = 12;
const R = 0.5, REST = 0.45, TRAVEL = 0.35; // wheel radius, spring length at rest, how far it can squash beyond that
export const WHEELS = [[-0.95, -0.35, -1.25], [0.95, -0.35, -1.25], [-0.95, -0.35, 1.25], [0.95, -0.35, 1.25]]; // front left, front right, back left, back right
const HULL = [[-0.9, -0.15, -1.75], [0.9, -0.15, -1.75], [-0.9, -0.15, 1.75], [0.9, -0.15, 1.75], [0, 0.3, -1.85], [0, 0.3, 1.85], [-1, 0.3, 0], [1, 0.3, 0]];
const ROOF = [[-0.75, 0.85, -0.4], [0.75, 0.85, -0.4], [-0.75, 0.85, 0.9], [0.75, 0.85, 0.9]];
const INERTIA = [1.6, 1.8, 0.9]; // about the car's x (pitch), y (turn), z (roll)
const CAR_R = 1.3; // how close the car's middle comes to a rock or a tree trunk

// the car as it comes, and what the garage changes
export const BASE = { drive: 13, grip: 1.0, top: 17, steer: 0.55, spring: 45, damp: 4.5, air: 7, boost: 1.2, push: 16 };
export function carStats(up = {}) {
  return {
    ...BASE,
    drive: BASE.drive * (1 + 0.12 * (up.engine ?? 0)), top: BASE.top * (1 + 0.08 * (up.engine ?? 0)),
    grip: BASE.grip * (1 + 0.1 * (up.tires ?? 0)), damp: BASE.damp * (1 + 0.15 * (up.suspension ?? 0)),
    boost: BASE.boost * (1 + 0.25 * (up.boost ?? 0)),
  };
}

// ------------------------------------------------------------------ small vector helpers (arrays, no allocation games)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// a vector turned by the quaternion q = [x, y, z, w]
export function rot(q, v) {
  const [x, y, z, w] = q, tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}
const unrot = (q, v) => rot([-q[0], -q[1], -q[2], q[3]], v);

// a car at rest on the ground at (x, z), facing `yaw` (0 = north, -z; turning right is +)
export function newState(world, x, z, yaw) {
  return {
    t: 0, p: [x, world.height(x, z) + 1.2, z], v: [0, 0, 0], q: [0, -Math.sin(yaw / 2), 0, Math.cos(yaw / 2)], w: [0, 0, 0],
    steer: 0, spin: 0, comp: [0, 0, 0, 0], contact: 0, air: 0, boost: 0, boostT: 0, splash: 0,
    flipped: false, fell: false, got: new Set(), reached: new Set(),
  };
}

// input: { gas, brake, steer (-1 left … 1 right), boost } — booleans except steer
export function step(s, inp, world, car, ev) {
  s.t += DT;
  const q = s.q, p = s.p, up = rot(q, [0, 1, 0]), fwd = rot(q, [0, 0, -1]), right = rot(q, [1, 0, 0]);
  const speed = dot(s.v, fwd);
  // the steering wheel turns towards where the child holds it; less lock the faster the car goes
  const want = (inp.steer || 0) * car.steer / (1 + Math.abs(speed) / 14);
  s.steer += Math.max(-3 * DT, Math.min(3 * DT, want - s.steer));
  const F = [0, -G, 0], T = [0, 0, 0];
  const push = (at, f) => { F[0] += f[0]; F[1] += f[1]; F[2] += f[2]; const t = cross([at[0] - p[0], at[1] - p[1], at[2] - p[2]], f); T[0] += t[0]; T[1] += t[1]; T[2] += t[2]; };
  const velAt = (at) => { const r = [at[0] - p[0], at[1] - p[1], at[2] - p[2]], c = cross(s.w, r); return [s.v[0] + c[0], s.v[1] + c[1], s.v[2] + c[2]]; };
  const water = world.water(p[0], p[2]);
  let touching = 0;

  for (let i = 0; i < 4; i++) {
    const m = rot(q, WHEELS[i]), mx = p[0] + m[0], my = p[1] + m[1], mz = p[2] + m[2];
    const len = (my - world.height(mx, mz)) / Math.max(0.3, up[1]) - R, comp = REST - len;
    s.comp[i] = Math.max(0, Math.min(REST + TRAVEL, comp));
    if (comp <= 0) continue; // in the air
    const c = [mx - up[0] * (len + R), my - up[1] * (len + R), mz - up[2] * (len + R)], vc = velAt(c), n = world.normal(c[0], c[2]);
    // squashed past its travel: on steep ground that is a wall (the body meets it below); on a landing, the bump stop
    if (comp > REST + TRAVEL && n[1] < 0.6) continue;
    touching++;
    const N = Math.max(0, car.spring * comp + 400 * Math.max(0, comp - REST - TRAVEL) - car.damp * dot(vc, up));
    // the tyre's forward along the ground (the front ones turned by the steering), and its side
    const st = i < 2 ? s.steer : 0;
    let f = [fwd[0] * Math.cos(st) + right[0] * Math.sin(st), fwd[1] * Math.cos(st) + right[1] * Math.sin(st), fwd[2] * Math.cos(st) + right[2] * Math.sin(st)];
    const fn = dot(f, n); f = norm([f[0] - n[0] * fn, f[1] - n[1] * fn, f[2] - n[2] * fn]);
    const side = cross(f, n), vf = dot(vc, f), vs = dot(vc, side);
    let Fd = -0.3 * vf; // rolling: four-wheel drive, each wheel a quarter
    if (inp.gas) Fd = vf < car.top ? car.drive / 4 : 0;
    else if (inp.brake) Fd = vf > 0.6 ? -car.drive * 0.65 / 4 : vf > -5 ? -car.drive * 0.28 / 4 : 0;
    let Fs = -3 * vs;
    const surf = world.surface(c[0], c[2]), lim = car.grip * surf.grip * (water !== null && c[1] < water ? 0.7 : 1) * N, mag = Math.hypot(Fd, Fs);
    if (mag > lim) { Fd *= lim / mag; Fs *= lim / mag; }
    if (surf.drag) Fd -= surf.drag * vf;
    push(c, [up[0] * N, up[1] * N, up[2] * N]);
    // the tyre's grip acts as if from near the car's middle height, so a hard turn on flat ground slides the car
    // rather than rolling it over (rolls come from crashes and side slopes)
    const lo = dot([c[0] - p[0], c[1] - p[1], c[2] - p[2]], up) * 0.75;
    push([c[0] - up[0] * lo, c[1] - up[1] * lo, c[2] - up[2] * lo], [f[0] * Fd + side[0] * Fs, f[1] * Fd + side[1] * Fs, f[2] * Fd + side[2] * Fs]);
  }
  s.contact = touching;
  // the body against the ground: a stiff push out, a scrape along it
  let scraped = false;
  for (const b of HULL) {
    const m = rot(q, b), at = [p[0] + m[0], p[1] + m[1], p[2] + m[2]], g = world.height(at[0], at[2]);
    if (at[1] >= g) continue;
    scraped = true;
    const n = world.normal(at[0], at[2]), vc = velAt(at), vn = dot(vc, n), pen = Math.min(0.6, g - at[1]) * n[1] + 0.02;
    const k = Math.max(0, 160 * pen - 10 * vn), slide = [vc[0] - n[0] * vn, vc[1] - n[1] * vn, vc[2] - n[2] * vn];
    const fr = Math.min(0.6, (0.5 * k) / (Math.hypot(slide[0], slide[1], slide[2]) || 1)); // a scrape: never more than half the push
    push(at, [n[0] * k - fr * slide[0], n[1] * k - fr * slide[1], n[2] * k - fr * slide[2]]);
  }
  if (touching && s.air > 0.3) {
    // a landing: how fast the car met the ground, square on (a soft touch down a slope is not a slam)
    const n = world.normal(p[0], p[2]), hit = -(s.v[0] * n[0] + s.v[1] * n[1] + s.v[2] * n[2]);
    if (hit > 7) ev.push({ t: 'slam', hit });
  }
  if (!touching) {
    s.air += DT;
    // in the air: GAS tips the nose up, BRAKE tips it down
    const a = inp.gas ? car.air : inp.brake ? -car.air : 0;
    T[0] += right[0] * a; T[1] += right[1] * a; T[2] += right[2] * a;
  } else s.air = 0;
  // boost: one can at a time, a hard push forward for a moment
  if (inp.boost && s.boostT <= 0 && s.boost > 0) { s.boost--; s.boostT = car.boost; ev.push({ t: 'boost' }); }
  if (s.boostT > 0) { s.boostT -= DT; F[0] += fwd[0] * car.push; F[1] += fwd[1] * car.push; F[2] += fwd[2] * car.push; }

  // move
  for (let k = 0; k < 3; k++) s.v[k] += F[k] * DT;
  const sp = Math.hypot(s.v[0], s.v[1], s.v[2]);
  for (let k = 0; k < 3; k++) s.v[k] -= 0.01 * s.v[k] * sp * DT;
  if (water !== null && p[1] - 0.8 < water) { for (let k = 0; k < 3; k++) s.v[k] *= 1 - 1.5 * DT; s.splash = Math.min(1, s.splash + DT * 4); } else s.splash = Math.max(0, s.splash - DT * 2);
  const wb = unrot(q, s.w), tb = unrot(q, T), damp = touching || scraped ? 0.99 : 0.998;
  for (let k = 0; k < 3; k++) wb[k] = (wb[k] + (tb[k] / INERTIA[k]) * DT) * damp;
  s.w = rot(q, wb);
  for (let k = 0; k < 3; k++) p[k] += s.v[k] * DT;
  const [ax, ay, az] = s.w, [x, y, z, w] = q;
  q[0] += 0.5 * DT * (ax * w + ay * z - az * y); q[1] += 0.5 * DT * (ay * w + az * x - ax * z);
  q[2] += 0.5 * DT * (az * w + ax * y - ay * x); q[3] += 0.5 * DT * (-ax * x - ay * y - az * z);
  const ql = Math.hypot(q[0], q[1], q[2], q[3]); for (let k = 0; k < 4; k++) q[k] /= ql;
  s.spin += (speed / R) * DT;

  // rocks and tree trunks: the car slides off them, and loses the speed it had into them
  for (const o of world.near(p[0], p[2])) {
    const dx = p[0] - o.x, dz = p[2] - o.z, d = Math.hypot(dx, dz), min = o.r + CAR_R;
    if (d >= min || d < 1e-6 || p[1] > o.y + o.h + 0.8) continue;
    const nx = dx / d, nz = dz / d, into = s.v[0] * nx + s.v[2] * nz;
    p[0] += nx * (min - d); p[2] += nz * (min - d);
    if (into < 0) { s.v[0] -= 1.4 * into * nx; s.v[2] -= 1.4 * into * nz; if (into < -3) ev.push({ t: 'bump' }); }
  }
  // the world's edge
  const lo = 4, hi = world.size - 4;
  for (const k of [0, 2]) if (p[k] < lo || p[k] > hi) { p[k] = Math.max(lo, Math.min(hi, p[k])); s.v[k] = 0; }

  // the roof on the ground is a flip; lying on its side or roof, stopped, too
  const up2 = rot(q, [0, 1, 0]);
  for (const b of ROOF) {
    const m = rot(q, b);
    if (up2[1] < 0.3 && p[1] + m[1] < world.height(p[0] + m[0], p[2] + m[2]) + 0.05) { s.flipped = true; ev.push({ t: 'flip' }); return; }
  }
  if (up2[1] < 0.2 && !touching && sp < 1.5 && scraped) { s.flipped = true; ev.push({ t: 'flip' }); return; }
  if (world.fall(p[0], p[1], p[2])) { s.fell = true; ev.push({ t: 'fall' }); return; }
  if (water !== null && p[1] < water - 0.3) { s.fell = true; ev.push({ t: 'deep' }); return; }

  // things to pick up, the checkpoints in order, the flag
  for (let i = 0; i < world.items.length; i++) {
    if (s.got.has(i)) continue;
    const it = world.items[i], d = Math.hypot(p[0] - it.x, p[1] - it.y, p[2] - it.z);
    if (d > (it.kind === 'boost' ? 2.2 : 1.9)) continue;
    s.got.add(i);
    if (it.kind === 'boost') s.boost = Math.min(3, s.boost + 1);
    ev.push({ t: it.kind, idx: i });
  }
  // a mission's place: a chest, a beacon, a village
  for (const m of world.missions) if (!s.reached.has(m.id) && Math.hypot(p[0] - m.x, p[2] - m.z) < (m.kind === 'deliver' ? 9 : 4.5) && Math.abs(p[1] - m.y) < 4) { s.reached.add(m.id); ev.push({ t: 'reach', id: m.id }); }
}
