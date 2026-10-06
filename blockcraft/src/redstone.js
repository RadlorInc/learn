// Redstone: wires carry power 15 -> 0; levers, buttons, pressure plates, torches and redstone blocks are sources;
// lamps, doors and pistons respond. Torches invert the block they stand on (NOT gates).
import { B, BLOCKS } from './blocks.js';
import { DIR6 } from './shapes.js';

const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const H4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const REDSTONE = new Set([B.WIRE, B.RTORCH, B.RTORCH_OFF, B.LEVER, B.BUTTON, B.PLATE, B.REDSTONE_BLOCK, B.LAMP, B.LAMP_ON, B.PISTON, B.PISTON_HEAD, B.DOOR]);
const IMMOVABLE = new Set([B.BEDROCK, B.OBSIDIAN, B.END_FRAME, B.END_PORTAL, B.PORTAL, B.PISTON_HEAD, B.GATEWAY, B.CHEST, B.FURNACE, B.BREWING, B.ENCHANT_TABLE, B.ANVIL]);
const k3 = (x, y, z) => x + ',' + y + ',' + z;

export class Redstone {
  // hooks: { pushEntities(x,y,z,dir), sound(kind) }
  constructor(world, hooks) {
    this.w = world; this.h = hooks; this.busy = false; this.timers = []; this.plates = new Map();
  }

  // is this a source giving full power to what touches it?
  source(x, y, z, except) {
    if (except && x === except[0] && y === except[1] && z === except[2]) return false;
    const id = this.w.getBlock(x, y, z), m = this.w.getMeta(x, y, z);
    if (id === B.RTORCH || id === B.REDSTONE_BLOCK) return true;
    if ((id === B.LEVER || id === B.BUTTON || id === B.PLATE) && (m & 1)) return true;
    return false;
  }
  // a solid block becomes a source when a lever/button/plate sits on it or a torch is under it
  strong(x, y, z, except) {
    const b = BLOCKS[this.w.getBlock(x, y, z)];
    if (!b || !b.opaque) return false;
    for (const [dx, dy, dz] of N6) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (except && nx === except[0] && ny === except[1] && nz === except[2]) continue;
      const id = this.w.getBlock(nx, ny, nz), m = this.w.getMeta(nx, ny, nz);
      if ((id === B.LEVER || id === B.BUTTON || id === B.PLATE) && (m & 1) && dy === 1) return true;
      if (id === B.RTORCH && dy === -1) return true;
    }
    return false;
  }
  // is the block at x,y,z receiving power from anything next to it?
  powered(x, y, z, except) {
    for (const [dx, dy, dz] of N6) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (except && nx === except[0] && ny === except[1] && nz === except[2]) continue;
      if (this.source(nx, ny, nz, except)) return true;
      if (this.w.getBlock(nx, ny, nz) === B.WIRE && this.w.getMeta(nx, ny, nz) > 0 && dy !== 1) return true;
      if (this.strong(nx, ny, nz, except)) return true;
    }
    return false;
  }
  wireNeighbours(x, y, z) {
    const out = [];
    for (const [dx, dz] of H4) for (const dy of [0, 1, -1]) {
      if (this.w.getBlock(x + dx, y + dy, z + dz) === B.WIRE) out.push([x + dx, y + dy, z + dz]);
    }
    return out;
  }

  // Recompute everything connected to a change at x,y,z.
  update(x, y, z, depth = 0) {
    if (this.busy || depth > 8) return;
    this.busy = true;
    const w = this.w;
    const changed = [];
    // 1. the wire network touching the change
    const net = new Map();
    const q = [];
    for (const [dx, dy, dz] of [[0, 0, 0], ...N6]) if (w.getBlock(x + dx, y + dy, z + dz) === B.WIRE) q.push([x + dx, y + dy, z + dz]);
    while (q.length && net.size < 600) {
      const p = q.pop(), kk = k3(...p);
      if (net.has(kk)) continue;
      net.set(kk, p);
      for (const n of this.wireNeighbours(...p)) if (!net.has(k3(...n))) q.push(n);
    }
    // 2. power levels: seeded by sources and strongly powered blocks, fading by one per wire
    const lvl = new Map();
    const bq = [];
    for (const [kk, p] of net) {
      const fed = N6.some(([dx, dy, dz]) => this.source(p[0] + dx, p[1] + dy, p[2] + dz) || (dy !== 1 && this.strong(p[0] + dx, p[1] + dy, p[2] + dz)));
      lvl.set(kk, fed ? 15 : 0);
      if (fed) bq.push(p);
    }
    while (bq.length) {
      const p = bq.shift(), l = lvl.get(k3(...p));
      if (l <= 1) continue;
      for (const n of this.wireNeighbours(...p)) {
        const nk = k3(...n);
        if (net.has(nk) && lvl.get(nk) < l - 1) { lvl.set(nk, l - 1); bq.push(n); }
      }
    }
    for (const [kk, p] of net) {
      const l = lvl.get(kk);
      if (w.getMeta(...p) !== l) w.setBlock(p[0], p[1], p[2], B.WIRE, l);
    }
    // 3. things that respond to power, around the network and the change
    const around = new Map();
    // everything touching, plus what stands on top of those blocks (torches on a powered block)
    const add = (px, py, pz) => { for (const [dx, dy, dz] of [[0, 0, 0], ...N6]) for (const up of [0, 1]) { const q2 = [px + dx, py + dy + up, pz + dz]; around.set(k3(...q2), q2); } };
    add(x, y, z);
    for (const p of net.values()) { add(...p); add(p[0], p[1] - 1, p[2]); }
    // a lever on a block powers things touching that block too
    for (const [dx, dy, dz] of N6) add(x + dx, y + dy, z + dz);
    for (const p of around.values()) {
      const [px, py, pz] = p;
      const id = w.getBlock(px, py, pz);
      if (!REDSTONE.has(id)) continue;
      const m = w.getMeta(px, py, pz);
      if (id === B.LAMP || id === B.LAMP_ON) {
        const on = this.powered(px, py, pz);
        if (on !== (id === B.LAMP_ON)) { w.setBlock(px, py, pz, on ? B.LAMP_ON : B.LAMP); changed.push(p); }
      } else if (id === B.RTORCH || id === B.RTORCH_OFF) {
        const off = this.powered(px, py - 1, pz, p) || this.strong(px, py - 1, pz, p);
        if (off !== (id === B.RTORCH_OFF)) { w.setBlock(px, py, pz, off ? B.RTORCH_OFF : B.RTORCH); changed.push(p); }
      } else if (id === B.DOOR && !(m & 8)) {
        const on = this.powered(px, py, pz) || this.powered(px, py + 1, pz);
        const wired = this.nearRedstone(px, py, pz) || this.nearRedstone(px, py + 1, pz);
        if (wired && !!(m & 4) !== on) {
          const nm = on ? m | 4 : m & ~4;
          w.setBlock(px, py, pz, B.DOOR, nm); w.setBlock(px, py + 1, pz, B.DOOR, nm | 8);
          this.h.sound?.('door');
        }
      } else if (id === B.PISTON) {
        const on = this.powered(px, py, pz, null);
        const ext = !!(m & 8);
        if (on && !ext) { if (this.extend(px, py, pz, m & 7)) changed.push(p); }
        else if (!on && ext) { this.retract(px, py, pz, m & 7); changed.push(p); }
      } else if (id === B.PISTON_HEAD) {
        const d = DIR6[m & 7];
        const bx = px - d[0], by = py - d[1], bz = pz - d[2];
        if (w.getBlock(bx, by, bz) !== B.PISTON) w.setBlock(px, py, pz, B.AIR);
      }
    }
    this.busy = false;
    for (const p of changed) this.update(...p, depth + 1);
  }
  nearRedstone(x, y, z) {
    return N6.some(([dx, dy, dz]) => { const id = this.w.getBlock(x + dx, y + dy, z + dz); return id === B.WIRE || id === B.LEVER || id === B.BUTTON || id === B.PLATE || id === B.RTORCH || id === B.RTORCH_OFF || id === B.REDSTONE_BLOCK; });
  }

  extend(x, y, z, f) {
    const w = this.w, d = DIR6[f];
    const line = [];
    let cx = x + d[0], cy = y + d[1], cz = z + d[2];
    for (let i = 0; i <= 12; i++) {
      const id = w.getBlock(cx, cy, cz);
      if (id === B.AIR || BLOCKS[id]?.replaceable || BLOCKS[id]?.liquid) break;
      if (IMMOVABLE.has(id) || (id === B.PISTON && (w.getMeta(cx, cy, cz) & 8)) || BLOCKS[id]?.hardness === Infinity) return false;
      if (i === 12) return false;
      line.push([cx, cy, cz, id, w.getMeta(cx, cy, cz)]);
      cx += d[0]; cy += d[1]; cz += d[2];
    }
    if (cy < 0 || cy >= 128) return false;
    for (let i = line.length - 1; i >= 0; i--) {
      const [bx, by, bz, id, m] = line[i];
      w.setBlock(bx + d[0], by + d[1], bz + d[2], id, m);
    }
    w.setBlock(x, y, z, B.PISTON, f | 8);
    w.setBlock(x + d[0], y + d[1], z + d[2], B.PISTON_HEAD, f);
    this.h.pushEntities?.(x + d[0], y + d[1], z + d[2], d, line.length);
    this.h.sound?.('piston');
    return true;
  }
  retract(x, y, z, f) {
    const w = this.w, d = DIR6[f];
    if (w.getBlock(x + d[0], y + d[1], z + d[2]) === B.PISTON_HEAD) w.setBlock(x + d[0], y + d[1], z + d[2], B.AIR);
    w.setBlock(x, y, z, B.PISTON, f);
    this.h.sound?.('piston');
  }

  // a block changed somewhere: react only if redstone is involved
  onChange(x, y, z, old, id) {
    if (this.busy) return;
    if (REDSTONE.has(old) || REDSTONE.has(id) || this.nearRedstone(x, y, z) || N6.some(([dx, dy, dz]) => REDSTONE.has(this.w.getBlock(x + dx, y + dy, z + dz)))) {
      // a piston losing its head (or the reverse) is fixed up here
      if (old === B.PISTON_HEAD) for (const [dx, dy, dz] of N6) {
        const bx = x - dx, by = y - dy, bz = z - dz;
        if (this.w.getBlock(bx, by, bz) === B.PISTON && (this.w.getMeta(bx, by, bz) & 8) && DIR6[this.w.getMeta(bx, by, bz) & 7].join() === [dx, dy, dz].join()) this.w.setBlock(bx, by, bz, B.PISTON, this.w.getMeta(bx, by, bz) & 7);
      }
      this.update(x, y, z);
    }
  }

  press(x, y, z, secs) {
    const id = this.w.getBlock(x, y, z);
    this.w.setBlock(x, y, z, id, 1);
    if (secs) this.timers.push({ x, y, z, t: secs });
    this.update(x, y, z);
  }
  // buttons pop back; plates release when nobody stands on them
  tick(dt, feet) {
    for (const t of this.timers) {
      t.t -= dt;
      if (t.t <= 0 && this.w.getBlock(t.x, t.y, t.z) === B.BUTTON) { this.w.setBlock(t.x, t.y, t.z, B.BUTTON, 0); this.update(t.x, t.y, t.z); this.h.sound?.('click'); }
    }
    this.timers = this.timers.filter((t) => t.t > 0);
    const on = new Set();
    for (const p of feet) {
      const x = Math.floor(p.x), y = Math.floor(p.y + 0.05), z = Math.floor(p.z);
      if (this.w.getBlock(x, y, z) === B.PLATE) on.add(k3(x, y, z));
    }
    for (const kk of on) if (!this.plates.has(kk)) { const [x, y, z] = kk.split(',').map(Number); this.plates.set(kk, true); this.press(x, y, z); this.h.sound?.('click'); }
    for (const kk of [...this.plates.keys()]) if (!on.has(kk)) {
      this.plates.delete(kk);
      const [x, y, z] = kk.split(',').map(Number);
      if (this.w.getBlock(x, y, z) === B.PLATE) { this.w.setBlock(x, y, z, B.PLATE, 0); this.update(x, y, z); }
    }
  }
}
