// The worlds. Each is an open piece of land SIZE × SIZE metres (heights every metre), made from a seed, with no road
// to follow: the child drives anywhere, and does missions —
//   chest   — find a treasure chest (on a summit, across a ravine, deep in a tunnel…) and open it
//   beacon  — reach a peak and light its lamp; light them all and the world shines
//   deliver — carry a crate from the camp to a village without a hard landing or a roll (either breaks it)
// Trails lead out from the camp to every mission (each trail is a list of legs) — the ways the land is shaped, not
// roads: the land between them is drivable too — and along them sit the dangers to master:
//   steep  — a sudden steep climb or drop          river — a ford: shallow on the trail, deep either side
//   mud    — slow and slippery                     ice / lake — very slippery (a lake is a wide frozen plain)
//   rocks  — rocks to steer round                  ridge — a narrow crest, drops on both sides
//   tunnel — through the inside of a mountain      ramp + gap — a ravine between two mountains, too wide without BOOST
// Any leg can be icy too (`ice: true`). A leg marked `bite` is a danger that must punish a child who does not control
// the speed. The trails are not drawn: the child finds the way with the arrow and the map. Off the trails: kicker ramps
// and rock arches to play with, boost cans and rings of coins to collect.
// `node peak/check.mjs` proves, with the car as it comes, that every mission can be done by driving its trail from the
// camp; that every `bite` danger punishes a held GAS pedal; and that no gap can be jumped without boost.

export const SIZE = 512;
const N = SIZE + 1, RB = 30; // heights per side; how far a trail shapes the land around it

const WORLDS = [
  {
    id: 'safari', name: 'Safari Valley', theme: 'safari', seed: 5, camp: [256, 256], y0: 30, half: 3.6,
    hint: 'Drive anywhere! W / GAS, S / BRAKE, A D / ◀ ▶ to steer, SPACE / ⚡ to boost. The arrow points to the nearest mission.',
    villages: { riverside: 'Riverside', acacia: 'Acacia Village' },
    trails: [
      { id: 'north', heading: 0, legs: [
        { len: 40, speed: 10 }, { len: 40, climb: -6, speed: 11 },
        { len: 45, climb: -20, kind: 'steep', speed: 7, bite: true }, { len: 20, turn: -110, kind: 'ridge', speed: 7 },
        { len: 20, turn: 10, speed: 9 }, { len: 16, kind: 'river', speed: 6 },
        { len: 40, turn: 30, kind: 'mud', speed: 8 }, { len: 25, speed: 8 },
      ], end: { village: 'riverside' } },
      { id: 'lookout', heading: 45, legs: [
        { len: 40, speed: 10 }, { len: 50, turn: -30, climb: 12, speed: 11 }, { len: 40, climb: 16, kind: 'steep', speed: 12 }, { len: 25, climb: 4, speed: 7 },
      ], end: { beacon: true } },
      { id: 'east', heading: 90, legs: [
        { len: 50, turn: 20, climb: 6, speed: 11 }, { len: 40, climb: 14, kind: 'steep', speed: 12, cans: 1 },
        { len: 35, turn: -30, kind: 'rocks', speed: 9 }, { len: 35, climb: 12, kind: 'steep', speed: 11 }, { len: 20, speed: 7 },
      ], end: { beacon: true } },
      { id: 'crag', from: ['east', 50], turn: 60, legs: [
        { len: 60, turn: 40, climb: 10, speed: 11 }, { len: 40, climb: 14, kind: 'steep', speed: 12 }, { len: 18, speed: 7 },
      ], end: { beacon: true } },
      { id: 'south', heading: 180, legs: [
        { len: 40, speed: 10 }, { len: 80, turn: 30, climb: -2, kind: 'tunnel', speed: 12, chest: 0.5 },
        { len: 40, climb: -8, speed: 12 }, { len: 30, speed: 9 },
      ], end: { village: 'acacia' } },
      { id: 'cliffs', from: ['south', 'end'], turn: -110, legs: [
        { len: 40, climb: 12, speed: 11 }, { len: 35, climb: -12, kind: 'steep', speed: 6, bite: true },
        { len: 20, turn: -110, kind: 'ridge', speed: 6 }, { len: 25, turn: 100, kind: 'ridge', speed: 7 }, { len: 20, speed: 6 },
      ], end: { chest: true } },
      { id: 'west', heading: 270, legs: [
        { len: 30, speed: 12 }, { len: 50, speed: 99, cans: 2 }, { len: 10, climb: 3, kind: 'ramp', speed: 99 },
        { len: 24, climb: -2.5, kind: 'gap', speed: 99 }, { len: 40, turn: 30, climb: -6, speed: 12 }, { len: 20, speed: 8 },
      ], end: { chest: true } },
    ],
    deliveries: ['riverside', 'acacia'],
  },
  {
    id: 'snowpass', name: 'Snow Pass', theme: 'snow', seed: 11, camp: [256, 256], y0: 34, half: 3.4,
    hint: 'Ice is slippery: steer gently and slow down BEFORE a steep drop. The arrow points to the nearest mission.',
    villages: { lakeside: 'Lakeside Huts', pinecamp: 'Pine Camp' },
    trails: [
      { id: 'north', heading: 0, legs: [
        { len: 40, speed: 9 }, { len: 40, turn: -60, climb: 6, speed: 10 }, { len: 40, turn: -30, kind: 'ice', speed: 7 },
        { len: 50, climb: -20, kind: 'ice', speed: 5, bite: true }, { len: 30, turn: 70, kind: 'ridge', ice: true, speed: 6 },
        { len: 20, speed: 9 }, { len: 45, turn: -40, kind: 'lake', speed: 8 }, { len: 15, speed: 8 },
      ], end: { village: 'lakeside' } },
      { id: 'frost', from: ['north', 'end'], turn: 150, legs: [
        { len: 50, climb: 12, speed: 11 }, { len: 40, climb: 16, kind: 'steep', speed: 12 }, { len: 20, speed: 7 },
      ], end: { beacon: true } },
      { id: 'east', heading: 90, legs: [
        { len: 40, climb: 4, speed: 10 }, { len: 15, climb: 1, kind: 'ridge', speed: 8 },
        { len: 15, turn: -110, climb: 1.5, kind: 'ridge', speed: 6, bite: true }, { len: 25, turn: 100, climb: 1.5, kind: 'ridge', speed: 7 },
        { len: 40, climb: 10, kind: 'rocks', speed: 9 }, { len: 40, climb: 14, kind: 'steep', speed: 12 }, { len: 15, speed: 7 },
      ], end: { beacon: true } },
      { id: 'south', heading: 180, legs: [
        { len: 40, speed: 10 }, { len: 80, turn: -30, climb: 2, kind: 'tunnel', speed: 11, chest: 0.5 },
        { len: 40, climb: -6, kind: 'ice', speed: 8 }, { len: 30, speed: 9 },
      ], end: { village: 'pinecamp' } },
      { id: 'peak', from: ['south', 'end'], turn: -110, legs: [
        { len: 60, turn: -30, climb: 14, speed: 11 }, { len: 40, climb: 16, kind: 'steep', speed: 12 }, { len: 18, speed: 7 },
      ], end: { beacon: true } },
      { id: 'west', heading: 270, legs: [
        { len: 40, speed: 12 }, { len: 55, speed: 99, cans: 2 }, { len: 10, climb: 3, kind: 'ramp', speed: 99 },
        { len: 25, climb: -2.5, kind: 'gap', speed: 99 }, { len: 40, climb: -6, speed: 12 }, { len: 20, speed: 8 },
      ], end: { chest: true } },
      { id: 'glacier', from: ['west', 30], turn: -80, legs: [
        { len: 50, climb: 4, kind: 'ice', speed: 8 }, { len: 40, climb: 14, kind: 'steep', ice: true, speed: 10 }, { len: 20, speed: 6 },
      ], end: { chest: true } },
    ],
    deliveries: ['lakeside', 'pinecamp'],
  },
];

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (n) => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
function noise(seed) {
  const g = (i, j) => hash(Math.imul(i, 374761393) + Math.imul(j, 668265263) + seed * 982451653);
  return (x, z) => {
    const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    const a = g(i, j) + (g(i + 1, j) - g(i, j)) * su, b = g(i, j + 1) + (g(i + 1, j + 1) - g(i, j + 1)) * su;
    return (a + (b - a) * sv) * 2 - 1;
  };
}

export function build(def) {
  const n1 = noise(def.seed), n2 = noise(def.seed + 1), n3 = noise(def.seed + 2), half = def.half, [cx, cz] = def.camp;

  // every trail: a point a metre, all in one list P (each knows its trail and leg); legs in one list too
  const P = [], legs = [], trails = {};
  for (const t of def.trails) {
    let x, z, h, y;
    if (!t.from) { h = (t.heading * Math.PI) / 180; x = cx + Math.sin(h) * 14; z = cz - Math.cos(h) * 14; y = def.y0; }
    else { const par = trails[t.from[0]], q = P[t.from[1] === 'end' ? par.to - 1 : par.start + t.from[1]]; x = q.x; z = q.z; y = q.y; h = q.h + ((t.turn ?? 0) * Math.PI) / 180; }
    t.start = P.length; trails[t.id] = t;
    for (const leg of t.legs) {
      leg.from = P.length; leg.trail = t.id; const li = legs.push(leg) - 1;
      for (let k = 0; k < leg.len; k++) {
        h += ((leg.turn ?? 0) * Math.PI) / 180 / leg.len; y += (leg.climb ?? 0) / leg.len;
        x += Math.sin(h); z -= Math.cos(h);
        P.push({ x, z, y, h, leg: li, trail: t.id });
      }
      leg.to = P.length;
    }
    t.to = P.length;
  }
  // ease each trail's height (not a ramp or a gap: their edges and slope stay sharp)
  const Y = P.map((p) => p.y), sharp = (i) => ['gap', 'ramp'].includes(legs[P[i].leg].kind);
  P.forEach((p, i) => {
    if (sharp(i)) return;
    let sum = 0, c = 0;
    for (let k = -6; k <= 6; k++) { const q = P[i + k]; if (q && q.trail === p.trail && !sharp(i + k)) { sum += Y[i + k]; c++; } }
    p.y = sum / c;
  });
  for (const p of P) if (p.x < 50 || p.x > SIZE - 50 || p.z < 50 || p.z > SIZE - 50) throw new Error(`${def.id}: trail ${p.trail} leaves the land near (${p.x | 0}, ${p.z | 0})`);
  const kindAt = (i) => legs[P[i].leg].kind;
  const legOf = (kind) => legs.filter((l) => l.kind === kind);
  const mid = (leg) => P[(leg.from + leg.to) >> 1];
  const dir = (p) => [Math.sin(p.h), -Math.cos(p.h)];

  // the camp and the villages: flat ground to stop on
  const flats = [{ x: cx, z: cz, y: def.y0, r: 16 }];
  const villages = {};
  for (const t of def.trails) if (t.end.village) { const p = P[t.to - 1]; villages[t.end.village] = { id: t.end.village, name: def.villages[t.end.village], x: p.x, z: p.z, y: p.y, h: p.h, trail: t.id }; flats.push({ x: p.x, z: p.z, y: p.y, r: 13 }); }

  // which trail point each piece of land is nearest, and how far (only near a trail)
  const D = new Float32Array(N * N).fill(Infinity), S = new Int32Array(N * N).fill(-1);
  P.forEach((p, i) => {
    const x0 = Math.max(0, Math.floor(p.x - RB)), x1 = Math.min(SIZE, Math.ceil(p.x + RB)), z0 = Math.max(0, Math.floor(p.z - RB)), z1 = Math.min(SIZE, Math.ceil(p.z + RB));
    for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++) {
      const d = Math.hypot(xx - p.x, zz - p.z), c = zz * N + xx;
      if (d < D[c]) { D[c] = d; S[c] = i; }
    }
  });

  const gaps = legOf('gap').map((leg) => { const c = mid(leg); return { c, u: dir(c), w: leg.len, across: 45, lip: P[leg.from - 1].y, land: P[leg.to - 1].y, from: leg.from, to: leg.to }; });
  const rivers = legOf('river').map((leg) => { const c = mid(leg); return { c, u: dir(c), w: leg.len, across: 30, level: c.y + 0.05, from: leg.from, to: leg.to }; });
  const tunnels = legOf('tunnel').map((leg) => ({ from: leg.from, to: leg.to, c: mid(leg) }));
  const lakes = legOf('lake').map((leg) => { const c = mid(leg); return { c, r: leg.len * 0.6 }; });
  const local = (o, px, pz) => { const dx = px - o.c.x, dz = pz - o.c.z; return [dx * o.u[0] + dz * o.u[1], -dx * o.u[1] + dz * o.u[0]]; }; // along, across
  // a gap or a river runs across the land; no other trail may cross it
  for (const o of [...gaps, ...rivers]) for (let i = 0; i < P.length; i++) {
    const [al, ac] = local(o, P[i].x, P[i].z);
    if ((i < o.from - 25 || i > o.to + 25) && Math.abs(al) < o.w / 2 + 6 && Math.abs(ac) < o.across + 5) throw new Error(`${def.id}: trail ${P[i].trail} crosses the ${gaps.includes(o) ? "gap" : "river"} on ${P[o.from].trail} at (${P[i].x | 0}, ${P[i].z | 0}), ${Math.round(al)} m along, ${Math.round(ac)} m across`);
  }

  // off the trails: kicker ramps and rock arches to play with (on gentle land, away from the trails)
  const r = (k) => hash(def.seed * 7919 + k);
  const ramps = [], arches = [];
  for (let k = 0; k < 400 && (ramps.length < 6 || arches.length < 4); k++) {
    const x = 70 + r(k * 3) * (SIZE - 140), z = 70 + r(k * 3 + 1) * (SIZE - 140), c = Math.round(z) * N + Math.round(x);
    if (D[c] < 16 || [...ramps, ...arches, ...flats].some((o) => Math.hypot(o.x - x, o.z - z) < 40)) continue;
    (ramps.length < 6 && (k % 2 || arches.length >= 4) ? ramps : arches).push({ x, z, h: r(k * 3 + 2) * 6.28 });
  }

  // the lie of the land follows the trails: low where they run low (a valley), high where they climb — a coarse grid
  // of trail heights nearby (inverse-distance), so trails sit in the land instead of cutting through it
  const G = 32, GN = SIZE / G + 1, BASE = new Float32Array(GN * GN);
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
    let sw = 0, sy = 0;
    for (let k = 0; k < P.length; k += 4) { const w = 1 / (1 + ((P[k].x - i * G) ** 2 + (P[k].z - j * G) ** 2) / 900) ** 2; sw += w; sy += w * P[k].y; }
    BASE[j * GN + i] = sy / sw;
  }
  const base = (px, pz) => { const fx = Math.min(GN - 1.001, px / G), fz = Math.min(GN - 1.001, pz / G), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, c = j * GN + i; return (BASE[c] * (1 - u) + BASE[c + 1] * u) * (1 - v) + (BASE[c + GN] * (1 - u) + BASE[c + GN + 1] * u) * v; };
  // hills, mountains at the edges, a ridge over each tunnel, two mountains either side of each gap (no way round),
  // and the kicker ramps
  function natural(px, pz) {
    let v = base(px, pz) + 2 + 12 * n1(px / 110, pz / 110) + 6 * n2(px / 42, pz / 42) + 2 * n3(px / 13, pz / 13);
    v += 70 * smooth(45, 5, Math.min(px, pz, SIZE - px, SIZE - pz));
    for (const t of tunnels) { let d = Infinity; for (let k = t.from - 10; k < t.to + 10; k += 4) d = Math.min(d, Math.hypot(px - P[k].x, pz - P[k].z)); v += 34 * smooth(70, 14, d); }
    for (const g of gaps) { const [al, ac] = local(g, px, pz); v += 55 * smooth(half + 6, half + 30, Math.abs(ac)) * smooth(45, 25, Math.abs(al)); }
    for (const a of ramps) { const dx = px - a.x, dz = pz - a.z, al = dx * Math.sin(a.h) - dz * Math.cos(a.h), ac = dx * Math.cos(a.h) + dz * Math.sin(a.h); if (Math.abs(ac) < 4 && al > -8 && al < 0) v += 2.4 * smooth(-8, 0, al) * smooth(4, 2.5, Math.abs(ac)); }
    return v;
  }

  const H = new Float32Array(N * N), NAT = new Float32Array(N * N), SURF = new Uint8Array(N * N); // surface: 0 ground, 1 mud, 2 ice
  for (let zz = 0; zz <= SIZE; zz++) for (let xx = 0; xx <= SIZE; xx++) {
    const c = zz * N + xx, nat = natural(xx, zz), d = D[c], i = S[c];
    NAT[c] = nat;
    let v = nat;
    if (i >= 0) {
      const leg = legs[P[i].leg], kind = leg.kind, road = P[i].y + 0.08 * n3(xx / 1.7, zz / 1.7); // a rough surface
      if (kind === 'tunnel') v = road + (nat - road) * smooth(half + 1.6, half + 3.2, d); // walls straight up from a wide floor
      else if (kind === 'ridge') v = road - 26 * smooth(half + 0.2, half + 5, d); // the crest falls away at the trail's edge
      else v = road + (nat - road) * smooth(half + 0.8, RB, d);
      if (kind === 'mud' && d < half + 3) SURF[c] = 1;
      if ((kind === 'ice' || leg.ice) && d < half + 5) SURF[c] = 2;
    }
    for (const f of flats) { const rr = Math.hypot(xx - f.x, zz - f.z); if (rr < f.r + 10) v = f.y + (v - f.y) * smooth(f.r, f.r + 10, rr); }
    const onOtherTrail = i >= 0 && d < half + 4 && legs[P[i].leg].kind !== 'lake'; // a trail leaving the lake keeps its own height
    for (const l of lakes) { const rr = Math.hypot(xx - l.c.x, zz - l.c.z); if (rr < l.r + 12 && !onOtherTrail) { v = l.c.y + (v - l.c.y) * smooth(l.r, l.r + 12, rr); if (rr < l.r + 2) SURF[c] = 2; } }
    for (const w of rivers) { const [al, ac] = local(w, xx, zz); if (Math.abs(al) < w.w / 2 && Math.abs(ac) < w.across) v = Math.min(v, w.level - (Math.abs(ac) < half + 0.5 ? 0.5 : 2.6)); }
    for (const g of gaps) { const [al, ac] = local(g, xx, zz); if (Math.abs(al) < g.w / 2 && Math.abs(ac) < g.across) v = Math.min(v, g.lip - 35); }
    if (def.theme === 'snow' && SURF[c] === 0 && (i < 0 || d > half + 6) && n2(xx / 30, zz / 30) > 0.55) SURF[c] = 2; // icy patches off the trails
    H[c] = v;
  }

  const at = (A, px, pz) => {
    const fx = Math.max(0, Math.min(SIZE - 1e-3, px)), fz = Math.max(0, Math.min(SIZE - 1e-3, pz)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, c = j * N + i;
    return (A[c] * (1 - u) + A[c + 1] * u) * (1 - v) + (A[c + N] * (1 - u) + A[c + N + 1] * u) * v;
  };
  const height = (px, pz) => at(H, px, pz);
  const normal = (px, pz) => { const dx = height(px + 0.5, pz) - height(px - 0.5, pz), dz = height(px, pz + 0.5) - height(px, pz - 0.5), l = Math.hypot(dx, 1, dz); return [-dx / l, 1 / l, -dz / l]; };
  const cell = (px, pz) => Math.round(Math.max(0, Math.min(SIZE, pz))) * N + Math.round(Math.max(0, Math.min(SIZE, px)));
  const SURFACES = [{ grip: def.theme === 'snow' ? 0.85 : 1 }, { grip: 0.6, drag: 0.08 }, { grip: 0.32 }];
  const surface = (px, pz) => SURFACES[SURF[cell(px, pz)]];
  const water = (px, pz) => { for (const w of rivers) { const [al, ac] = local(w, px, pz); if (Math.abs(al) < w.w / 2 + 1 && Math.abs(ac) < w.across) return w.level; } return null; };
  const ridges = legOf('ridge');
  function fall(px, py, pz) {
    for (const g of gaps) { const [al, ac] = local(g, px, pz); if (Math.abs(al) < g.w / 2 + 3 && Math.abs(ac) < g.across && py < Math.min(g.lip, g.land) - 6) return true; }
    const i = S[cell(px, pz)];
    return i >= 0 && ridges.some((l) => i >= l.from && i < l.to) && py < P[i].y - 9;
  }

  // rocks on the trails, trees off them, the pillars of the arches: things the car bumps into (an 8 m grid)
  const things = [];
  for (const leg of legOf('rocks')) for (let i = leg.from + 6, k = 0; i < leg.to - 4; i += 11, k++) {
    const p = P[i], [ux, uz] = dir(p), off = (k % 2 ? 1 : -1) * (half - 1.3);
    things.push({ kind: 'rock', x: p.x - uz * off, z: p.z + ux * off, r: 0.95, h: 1.3, at: i, off });
  }
  for (const a of arches) for (const s of [-1, 1]) things.push({ kind: 'pillar', x: a.x + Math.cos(a.h) * 5 * s, z: a.z + Math.sin(a.h) * 5 * s, r: 1.6, h: 9 });
  for (let k = 0; k < 2600 && things.length < 900; k++) {
    const tx = 20 + r(k) * (SIZE - 40), tz = 20 + r(k + 5000) * (SIZE - 40), c = cell(tx, tz);
    if (D[c] < half + 6 || normal(tx, tz)[1] < 0.8 || water(tx, tz) !== null || SURF[c] || lakes.some((l) => Math.hypot(tx - l.c.x, tz - l.c.z) < l.r + 14)) continue;
    if (gaps.some((g) => Math.abs(local(g, tx, tz)[0]) < g.w / 2 + 4) || [...flats, ...ramps, ...arches].some((o) => Math.hypot(o.x - tx, o.z - tz) < (o.r ?? 10) + 8)) continue;
    things.push({ kind: 'tree', x: tx, z: tz, r: 0.45, h: 4, size: 0.8 + r(k + 9000) * 0.8 });
  }
  for (const t of things) t.y = height(t.x, t.z);
  const grid = new Map(), key = (i, j) => i * 1000 + j;
  for (const t of things) { const k = key(Math.floor(t.x / 8), Math.floor(t.z / 8)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(t); }
  const NONE = [];
  const near = (px, pz) => { const i = Math.floor(px / 8), j = Math.floor(pz / 8), out = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const g = grid.get(key(i + a, j + b)); if (g) out.push(...g); } return out.length ? out : NONE; };

  // things to pick up: coins in snaking trails, boost cans (on the trails and scattered); and the missions
  const items = [];
  const spot = (i, off, up) => { const p = P[i], [ux, uz] = dir(p), px = p.x - uz * off, pz = p.z + ux * off; return { x: px, z: pz, y: (kindAt(i) === 'gap' ? p.y : height(px, pz)) + up, at: i, off }; };
  // coins in rings of six, scattered over the land (not along the trails: they are a reward for exploring)
  for (let k = 0, rings = 0; k < 600 && rings < 22; k++) {
    const x = 60 + r(k * 5 + 11) * (SIZE - 120), z = 60 + r(k * 5 + 12) * (SIZE - 120);
    if (normal(x, z)[1] < 0.85 || water(x, z) !== null || gaps.some((g) => Math.abs(local(g, x, z)[0]) < g.w / 2 + 6 && Math.abs(local(g, x, z)[1]) < g.across + 5)) continue;
    if (items.some((it) => it.kind === 'coin' && Math.hypot(it.x - x, it.z - z) < 35) || things.some((t) => Math.hypot(t.x - x, t.z - z) < 4)) continue;
    rings++;
    for (let c = 0; c < 6; c++) { const a = (c / 6) * 6.28, cx2 = x + Math.cos(a) * 3, cz2 = z + Math.sin(a) * 3; items.push({ kind: 'coin', x: cx2, z: cz2, y: height(cx2, cz2) + 1.1, at: -1 }); }
  }
  for (const leg of legs) for (let k = 0; k < (leg.cans ?? 0); k++) items.push({ kind: 'boost', ...spot(leg.from + Math.round(((k + 0.5) / leg.cans) * leg.len), (k % 2 ? 1 : -1) * (half - 1.5), 1.1) });
  for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + 0.4, x = cx + Math.cos(a) * 11, z = cz + Math.sin(a) * 11; items.push({ kind: 'boost', x, z, y: height(x, z) + 1.1, at: -1 }); }
  for (const a of ramps) { const x = a.x + Math.sin(a.h) * 6, z = a.z - Math.cos(a.h) * 6; items.push({ kind: 'boost', x, z, y: height(x, z) + 3.5, at: -1 }); }

  const missions = [];
  for (const t of def.trails) {
    for (const leg of t.legs) if (leg.chest) { const i = leg.from + Math.round(leg.chest * leg.len), p = P[i]; missions.push({ id: `chest-${t.id}-tunnel`, kind: 'chest', x: p.x, z: p.z, y: height(p.x, p.z), h: p.h, trail: t.id, at: i }); }
    if (t.end.chest || t.end.beacon) { const p = P[t.to - 1]; missions.push({ id: `${t.end.chest ? 'chest' : 'beacon'}-${t.id}`, kind: t.end.chest ? 'chest' : 'beacon', x: p.x, z: p.z, y: height(p.x, p.z), h: p.h, trail: t.id, at: t.to - 1 }); }
  }
  for (const v of def.deliveries) { const vil = villages[v]; missions.push({ id: `deliver-${v}`, kind: 'deliver', x: vil.x, z: vil.z, y: vil.y, h: vil.h, trail: vil.trail, at: trails[vil.trail].to - 1, to: v, name: vil.name }); }

  // the way from the camp to a trail point, through the trails it branches from (for check.mjs's autopilot)
  function route(i) {
    const t = trails[P[i].trail], out = [];
    if (t.from) { const par = trails[t.from[0]]; out.push(...route(t.from[1] === 'end' ? par.to - 1 : par.start + t.from[1])); }
    for (let k = t.start; k <= i; k++) out.push(k);
    return out;
  }

  return {
    ...def, size: SIZE, N, H, NAT, SURF, D, S, track: P, legs, trailsById: trails, height, normal, surface, water, fall, near, things,
    items, missions, villages, ramps, arches, flats, gaps, rivers, tunnels, lakes, route, kindAt,
    legAt: (i) => legs[P[Math.max(0, Math.min(P.length - 1, i))].leg],
    camp: { x: cx, z: cz, y: def.y0 },
    crates: { x: cx + 3.5, z: cz + 2.5 }, // the stack of crates to deliver, by the camp's flag
    spawn: () => ({ x: cx - 4, z: cz + 11, yaw: 0 }),
  };
}

export const LEVELS = WORLDS.map(build);
