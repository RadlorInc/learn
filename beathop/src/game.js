// BeatHop rules: the level grid, the physics and one fixed step. No DOM — the game and check.mjs run exactly this.
// Units are tiles; y points up; a tile (x, y) covers [x, x+1] × [y, y+1].
//
// Cells: '=' ground, '#' brick, '?' bump block (a gem pops out), 'b' a used bump block, '^' thorn on the floor,
// 'v' thorn hanging from a ceiling, '*' gem, 'S' big star (three per level), 'J' jump pad, 'o' jump ring (press in it),
// 'H' shield bubble (survives one thorn), 'M' gem magnet (the magnet itself is main.js's: it never changes the path).
// Column triggers (crossed whatever the height): 'P' glider, 'C' cube, 'U' gravity up, 'D' gravity down,
// 'F' checkpoint flag, 'G' goal.

export const H = 10, SIZE = 0.8, DT = 1 / 120;
export const SPEED = 7, GRAV = 60, JUMP = 19.6, CUT = 0.45, TERM = 24;
export const GLIDE_ACC = 42, GLIDE_MAX = 7.5, PAD = 23, RING = 18;
export const COYOTE = 0.1, BUFFER = 0.12, NUDGE = 0.3;
const SOLID = '=#?b';

export function makeLevel(def) {
  const { w } = def, cells = new Array(w * H).fill(' '), trig = new Map();
  const set = (x, y, ch) => { if (x >= 0 && x < w && y >= 0 && y < H) cells[x * H + y] = ch; };
  def.build({
    set,
    fill: (x0, x1, y0, y1, ch) => { for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) set(x, y, ch); },
    row: (x, y, str) => [...str].forEach((c, i) => c !== '.' && set(x + i, y, c)),
    trig: (x, ch) => trig.set(x, ch),
  });
  const at = (x, y) => (x < 0 || x >= w || y < 0 || y >= H ? ' ' : cells[x * H + y]);
  const stars = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < H; y++) if (at(x, y) === 'S') stars.push(x * H + y);
  const goal = [...trig].find(([, c]) => c === 'G')[0];
  return { ...def, cells, trig, at, set, stars, goal };
}

export const newState = () => ({
  x: 2, y: 1, vy: 0, mode: 'cube', flip: false, grounded: true, coyote: 0, buffer: 0,
  held: false, cut: false, pad: -1, ring: -1, dead: false, won: false, shield: false, ghost: 0,
});

// the tiles the player's box overlaps
function cellsUnder(x, y) {
  const out = [];
  for (let i = Math.floor(x); i <= Math.floor(x + SIZE - 1e-6); i++)
    for (let j = Math.floor(y); j <= Math.floor(y + SIZE - 1e-6); j++) out.push(i, j);
  return out;
}
function solids(lv, x, y) {
  const c = cellsUnder(x, y), out = [];
  for (let k = 0; k < c.length; k += 2) if (SOLID.includes(lv.at(c[k], c[k + 1]))) out.push(c[k], c[k + 1]);
  return out;
}
const tops = (h) => { let m = -Infinity; for (let k = 1; k < h.length; k += 2) m = Math.max(m, h[k] + 1); return m; };
const bottoms = (h) => { let m = Infinity; for (let k = 1; k < h.length; k += 2) m = Math.min(m, h[k]); return m; };
const boxHits = (s, x0, x1, y0, y1) => s.x < x1 && s.x + SIZE > x0 && s.y < y1 && s.y + SIZE > y0;

// one fixed step of DT; `held` is the one button; what happened is pushed onto `ev`
export function step(s, held, lv, ev) {
  const g = s.flip ? -1 : 1;
  const pressed = held && !s.held;
  s.held = held;
  s.buffer = pressed ? BUFFER : Math.max(0, s.buffer - DT);

  let ring = -1, pad = -1;
  const c = cellsUnder(s.x, s.y);
  for (let k = 0; k < c.length; k += 2) {
    const i = c[k], j = c[k + 1], ch = lv.at(i, j);
    if (ch === 'o') ring = i * H + j;
    else if (ch === 'J') pad = i * H + j;
    else if ('*SHM'.includes(ch)) ev.push({ t: 'pick', x: i, y: j, ch });
  }

  if (s.mode === 'cube') {
    s.coyote = s.grounded ? COYOTE : Math.max(0, s.coyote - DT);
    if (pressed && ring >= 0 && ring !== s.ring) {
      s.vy = RING * g; s.ring = ring; s.cut = false; s.buffer = 0; ev.push({ t: 'jump', ring: true });
    } else if ((s.buffer > 0 || held) && s.coyote > 0) {
      s.vy = JUMP * g; s.grounded = false; s.coyote = 0; s.buffer = 0; s.cut = true; ev.push({ t: 'jump' });
    }
    // let go while rising and the jump is cut short: tap = a hop, hold = a big jump
    if (!held && s.cut && s.vy * g > 0) { s.vy *= CUT; s.cut = false; }
    s.vy -= GRAV * g * DT;
    if (s.vy * g < -TERM) s.vy = -TERM * g;
  } else {
    s.vy += (held ? GLIDE_ACC : -GLIDE_ACC) * g * DT;
    s.vy = Math.max(-GLIDE_MAX, Math.min(GLIDE_MAX, s.vy));
  }
  if (pad >= 0 && pad !== s.pad) {
    s.vy = PAD * g; s.pad = pad; s.cut = false; s.grounded = false; s.coyote = 0; ev.push({ t: 'pad' });
  }

  // forward; a lip of up to NUDGE is stepped over (or ducked under), anything taller is a crash
  const lastCol = Math.floor(s.x + SIZE / 2);
  s.x += SPEED * DT;
  let hit = solids(lv, s.x, s.y);
  if (hit.length) {
    const up = tops(hit) - s.y, down = s.y + SIZE - bottoms(hit);
    if (up <= NUDGE && !solids(lv, s.x, s.y + up).length) {
      s.y += up;
      if (g > 0) { s.vy = 0; s.grounded = true; } else if (s.vy > 0) s.vy = 0;
    } else if (down <= NUDGE && !solids(lv, s.x, s.y - down).length) {
      s.y -= down;
      if (g < 0) { s.vy = 0; s.grounded = true; } else if (s.vy < 0) s.vy = 0;
    } else return crash(s, ev);
  }

  // up/down
  s.grounded = false;
  s.y += s.vy * DT;
  hit = solids(lv, s.x, s.y);
  if (hit.length) {
    s.y = s.vy < 0 ? tops(hit) : bottoms(hit) - SIZE;
    if (s.vy * g <= 0) { s.grounded = true; s.cut = false; }
    else for (let k = 0; k < hit.length; k += 2) if (lv.at(hit[k], hit[k + 1]) === '?') ev.push({ t: 'bump', x: hit[k], y: hit[k + 1] });
    s.vy = 0;
  }

  // thorns have a small hitbox: only the point hurts. A shield takes one thorn, then thorns miss for a moment.
  s.ghost = Math.max(0, s.ghost - DT);
  const near = cellsUnder(s.x, s.y);
  for (let k = 0; k < near.length && !s.ghost; k += 2) {
    const i = near[k], j = near[k + 1], ch = lv.at(i, j);
    if ((ch === '^' && boxHits(s, i + 0.25, i + 0.75, j, j + 0.55)) || (ch === 'v' && boxHits(s, i + 0.25, i + 0.75, j + 0.45, j + 1))) {
      if (!s.shield) return crash(s, ev);
      s.shield = false; s.ghost = 0.8; ev.push({ t: 'shield' });
    }
  }
  if (s.y < -1.5 || s.y > H + 0.5) return crash(s, ev);

  const col = Math.floor(s.x + SIZE / 2);
  if (col !== lastCol && lv.trig.has(col)) {
    const t = lv.trig.get(col);
    if (t === 'P') s.mode = 'glider';
    if (t === 'C') { s.mode = 'cube'; s.cut = false; }
    if (t === 'U' && !s.flip) { s.flip = true; s.vy *= 0.5; s.grounded = false; }
    if (t === 'D' && s.flip) { s.flip = false; s.vy *= 0.5; s.grounded = false; }
    if (t === 'G') s.won = true;
    ev.push({ t: 'trig', ch: t, x: col });
  }
}

function crash(s, ev) { s.dead = true; ev.push({ t: 'crash' }); }
