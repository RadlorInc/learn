// Chunked voxel world: streaming, edits, fluids, random ticks, lighting, meshing, raycasts.
import * as THREE from 'three';
import { makeNoise } from './noise.js';
import { B, BLOCKS, ATLAS_COLS, T, isFluid } from './blocks.js';
import { shapeOf, pickBoxes } from './shapes.js';
import { generateChunk, oak, spruce, CS, CH, SEA, idx } from './gen.js';

export { CS, CH, SEA };
const key = (cx, cz) => cx + ',' + cz;

// Face table: dir, 4 corners (pos xyz + uv). Indices 0,1,2 / 2,1,3.
const FACES = [
  { dir: [-1, 0, 0], shade: 0.8, tex: 'side', c: [[0, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 0, 1, 1, 0]] },
  { dir: [1, 0, 0], shade: 0.8, tex: 'side', c: [[1, 1, 1, 0, 1], [1, 0, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 0, 1, 0]] },
  { dir: [0, -1, 0], shade: 0.5, tex: 'bottom', c: [[1, 0, 1, 1, 0], [0, 0, 1, 0, 0], [1, 0, 0, 1, 1], [0, 0, 0, 0, 1]] },
  { dir: [0, 1, 0], shade: 1.0, tex: 'top', c: [[0, 1, 1, 1, 1], [1, 1, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 0]] },
  { dir: [0, 0, -1], shade: 0.65, tex: 'front', c: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 1, 1]] },
  { dir: [0, 0, 1], shade: 0.65, tex: 'front', c: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 1], [1, 1, 1, 1, 1]] },
];
// uv for a point on a face, from its block-local position (matches the cube table above)
const FACE_UV = [
  (x, y, z) => [z, y], (x, y, z) => [1 - z, y], (x, y, z) => [x, 1 - z],
  (x, y, z) => [1 - x, z], (x, y, z) => [1 - x, y], (x, y, z) => [x, y],
];
const AO = [0.45, 0.62, 0.8, 1];
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const HDIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const TICKABLE = new Set([B.WHEAT_CROP, B.SAPLING, B.SPRUCE_SAPLING, B.SUGAR_CANE, B.NETHER_WART]);

class Chunk {
  constructor(cx, cz) {
    this.cx = cx; this.cz = cz;
    this.blocks = new Uint8Array(CS * CS * CH);
    this.meta = new Uint8Array(CS * CS * CH);
    this.light = new Uint8Array(CS * CS * CH); // block light 0..15
    this.heights = new Uint8Array(CS * CS);    // highest sky-blocking y
    this.meshes = null;
    this.dirty = true;
    this.lightDirty = true;
    this.ticks = new Set();
  }
}

export class World {
  // state: { edits: Map(chunkKey -> Map(idx -> id | meta<<8)), extra: Map }
  constructor(dim, seed, scene, materials, state) {
    this.dim = dim;
    this.seed = (seed + (dim === 'nether' ? 1013 : dim === 'end' ? 2027 : 0)) | 0;
    this.noise = makeNoise(this.seed);
    this.scene = scene;
    this.mats = materials;
    this.chunks = new Map();
    this.edits = state.edits;
    this.extra = state.extra;
    this.structCache = new Map();
    this.renderDist = 6;
    this.fluidQ = { [B.WATER]: new Set(), [B.LAVA]: new Set() };
    this.fluidT = { [B.WATER]: 0, [B.LAVA]: 0 };
    this.tickT = 0;
    this.spawns = [];
    this.onBlockChange = null;
    // non-overworld dimensions have no sky: a flat ambient instead
    this.ambient = dim === 'nether' ? 0.55 : dim === 'end' ? 0.7 : null;
  }

  // -------------------------------------------------------------- access
  chunkAt(wx, wz) { return this.chunks.get(key(Math.floor(wx / CS), Math.floor(wz / CS))); }

  getBlock(wx, wy, wz) {
    if (wy < 0) return this.dim === 'end' ? B.AIR : B.BEDROCK;
    if (wy >= CH) return B.AIR;
    const c = this.chunks.get(key(Math.floor(wx / CS), Math.floor(wz / CS)));
    if (!c) return B.AIR;
    return c.blocks[idx(wx - c.cx * CS, wy, wz - c.cz * CS)];
  }
  getMeta(wx, wy, wz) {
    if (wy < 0 || wy >= CH) return 0;
    const c = this.chunkAt(wx, wz);
    return c ? c.meta[idx(wx - c.cx * CS, wy, wz - c.cz * CS)] : 0;
  }
  getLight(wx, wy, wz) {
    if (wy < 0 || wy >= CH) return 0;
    const c = this.chunkAt(wx, wz);
    if (!c) return 0;
    return c.light[idx(wx - c.cx * CS, wy, wz - c.cz * CS)];
  }
  heightAt(wx, wz) {
    const c = this.chunkAt(wx, wz);
    if (!c) return 0;
    return c.heights[(wx - c.cx * CS) + (wz - c.cz * CS) * CS];
  }
  isLoaded(wx, wz) { return !!this.chunkAt(wx, wz); }

  setBlock(wx, wy, wz, id, meta = 0) {
    if (wy < 0 || wy >= CH) return false;
    const cx = Math.floor(wx / CS), cz = Math.floor(wz / CS);
    const c = this.chunks.get(key(cx, cz));
    if (!c) {
      // not loaded: remember it, it is applied when the chunk is generated
      let m = this.edits.get(key(cx, cz));
      if (!m) this.edits.set(key(cx, cz), (m = new Map()));
      m.set(idx(wx - cx * CS, wy, wz - cz * CS), id | (meta << 8));
      return false;
    }
    const lx = wx - cx * CS, lz = wz - cz * CS, i = idx(lx, wy, lz);
    const old = c.blocks[i];
    c.blocks[i] = id; c.meta[i] = meta;
    if (this.emits(old) || this.emits(id)) c.hasLight = this.scanLight(c);
    if (TICKABLE.has(id)) c.ticks.add(i); else c.ticks.delete(i);
    let m = this.edits.get(key(cx, cz));
    if (!m) this.edits.set(key(cx, cz), (m = new Map()));
    m.set(i, id | (meta << 8));
    this.recomputeHeight(c, lx, lz);
    const lightReach = 15;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const n = this.chunks.get(key(cx + dx, cz + dz));
      if (!n) continue;
      const nearX = dx === 0 || (dx < 0 ? lx < lightReach : lx >= CS - lightReach);
      const nearZ = dz === 0 || (dz < 0 ? lz < lightReach : lz >= CS - lightReach);
      if (nearX && nearZ) { n.dirty = true; n.lightDirty = true; }
    }
    this.dirtyNow = true;
    // wake fluids around the change
    this.wakeFluid(wx, wy, wz);
    for (const [dx, dy, dz] of DIRS) this.wakeFluid(wx + dx, wy + dy, wz + dz);
    this.onBlockChange?.(wx, wy, wz, old, id);
    return true;
  }

  // remembers where the light sources are, so lighting never rescans whole chunks
  scanLight(c) {
    c.lights = [];
    for (let i = 0; i < c.blocks.length; i++) if (this.emits(c.blocks[i])) c.lights.push(i);
    return c.lights.length > 0;
  }
  // lava in the nether is everywhere: it is lit by the ambient instead of flood-filled
  emits(id) { const l = BLOCKS[id]?.light || 0; return id === B.LAVA && this.dim === 'nether' ? 0 : l; }

  recomputeHeight(c, lx, lz) {
    let y = CH - 1;
    for (; y > 0; y--) {
      const b = BLOCKS[c.blocks[idx(lx, y, lz)]];
      if (b && (b.opaque || (b.shape && b.solid))) break;
    }
    c.heights[lx + lz * CS] = y;
  }

  // -------------------------------------------------------------- terrain
  biomeAt(wx, wz) {
    const n = this.noise;
    const temp = n.fbm2(wx / 700 + 300, wz / 700 - 200, 2);
    const hum = n.fbm2(wx / 600 - 500, wz / 600 + 700, 2);
    const mnt = n.fbm2(wx / 500 + 100, wz / 500, 3);
    const cont = n.fbm2(wx / 450, wz / 450, 4);
    const hills = n.fbm2(wx / 110, wz / 110, 4);
    let h = 64 + cont * 22 + hills * 7;
    const m = smooth(0.2, 0.55, mnt);
    if (m > 0) h += m * (1 - Math.abs(n.fbm2(wx / 70, wz / 70, 3))) * 50;
    h = Math.max(4, Math.min(CH - 12, Math.round(h)));
    let biome = 'plains';
    if (h <= SEA) biome = h < SEA - 6 ? 'ocean' : 'shore';
    else if (m > 0.55) biome = 'mountains';
    else if (temp > 0.28 && hum < 0.1) biome = 'desert';
    else if (temp < -0.3) biome = 'snowy';
    else if (hum > 0.18) biome = 'forest';
    if (this.dim !== 'overworld') biome = this.dim;
    return { h, biome, temp };
  }

  generate(c) {
    const spawns = generateChunk(this, c);
    if (spawns?.length) this.spawns.push(...spawns);
    const m = this.edits.get(key(c.cx, c.cz));
    if (m) for (const [i, v] of m) { c.blocks[i] = v & 255; c.meta[i] = v >> 8; }
    for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) this.recomputeHeight(c, lx, lz);
    for (let i = 0; i < c.blocks.length; i++) if (TICKABLE.has(c.blocks[i])) c.ticks.add(i);
    c.hasLight = this.scanLight(c);
  }

  // grow a tree from a sapling, only through air/plants/leaves and inside loaded chunks
  growTree(x, y, z, spruceTree) {
    const bl = new Uint8Array(CS * CS * CH);
    const lx = 8, lz = 8;
    if (spruceTree) spruce(bl, lx, y, lz, Math.random()); else oak(bl, lx, y, lz, Math.random(), () => Math.random());
    for (let i = 0; i < bl.length; i++) {
      const id = bl[i]; if (!id) continue;
      const bx = i % CS, bz = Math.floor(i / CS) % CS, by = Math.floor(i / (CS * CS));
      if (by === y - 1) continue; // leave the soil
      const wx = x + bx - lx, wz = z + bz - lz;
      const cur = this.getBlock(wx, by, wz);
      const log = id === B.LOG || id === B.SPRUCE_LOG;
      if (cur === B.AIR || BLOCKS[cur]?.replaceable || cur === B.SAPLING || cur === B.SPRUCE_SAPLING || (log && (cur === B.LEAVES || cur === B.SPRUCE_LEAVES))) this.setBlock(wx, by, wz, id);
    }
  }

  // -------------------------------------------------------------- random ticks (crops, saplings, cane)
  randomTicks(dt, boost = 1) {
    this.tickT += dt;
    if (this.tickT < 1) return;
    this.tickT = 0;
    for (const c of this.chunks.values()) {
      if (!c.meshes || !c.ticks.size) continue;
      for (const i of [...c.ticks]) {
        if (c.blocks[i] !== undefined) this.tickBlock(c, i, boost);
      }
    }
  }
  tickBlock(c, i, boost = 1) {
    const id = c.blocks[i];
    const lx = i % CS, lz = Math.floor(i / CS) % CS, y = Math.floor(i / (CS * CS));
    const wx = c.cx * CS + lx, wz = c.cz * CS + lz;
    const r = Math.random() / boost;
    if (id === B.WHEAT_CROP) {
      const st = c.meta[i];
      if (st < 7 && r < (this.nearWater(wx, y - 1, wz) ? 0.1 : 0.05)) this.setBlock(wx, y, wz, id, st + 1);
    } else if (id === B.NETHER_WART) {
      if (c.meta[i] < 3 && r < 0.04) this.setBlock(wx, y, wz, id, c.meta[i] + 1);
    } else if (id === B.SAPLING || id === B.SPRUCE_SAPLING) {
      if (r < 0.02) this.growTree(wx, y, wz, id === B.SPRUCE_SAPLING);
    } else if (id === B.SUGAR_CANE) {
      let h = 1; while (this.getBlock(wx, y - h, wz) === B.SUGAR_CANE) h++;
      if (h < 3 && r < 0.03 && this.getBlock(wx, y + 1, wz) === B.AIR) this.setBlock(wx, y + 1, wz, B.SUGAR_CANE);
    }
  }
  nearWater(x, y, z) {
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if (this.getBlock(x + dx, y, z + dz) === B.WATER) return true;
    return false;
  }

  // -------------------------------------------------------------- fluids
  // meta: level 0 = source, 1..7 flowing (higher is weaker), 8 = falling
  wakeFluid(x, y, z) {
    const id = this.getBlock(x, y, z);
    if (isFluid(id)) this.fluidQ[id].add(x + ',' + y + ',' + z);
  }
  stepFluids(dt) {
    for (const f of [B.WATER, B.LAVA]) {
      this.fluidT[f] += dt;
      const period = f === B.WATER ? 0.25 : (this.dim === 'nether' ? 0.5 : 1.25);
      if (this.fluidT[f] < period) continue;
      this.fluidT[f] = 0;
      const q = this.fluidQ[f];
      if (!q.size) continue;
      const cells = [...q].slice(0, 400);
      for (const k of cells) q.delete(k);
      for (const k of cells) { const [x, y, z] = k.split(',').map(Number); this.flowCell(x, y, z); }
    }
  }
  canFlowInto(id) { return id === B.AIR || !!BLOCKS[id]?.replaceable; }
  flowCell(x, y, z) {
    const id = this.getBlock(x, y, z);
    if (!isFluid(id) || !this.isLoaded(x, z)) return;
    const other = id === B.WATER ? B.LAVA : B.WATER;
    const nether = this.dim === 'nether';
    const max = id === B.WATER ? 7 : (nether ? 6 : 6);
    const step = id === B.WATER ? 1 : (nether ? 1 : 2);
    let meta = this.getMeta(x, y, z);
    // lava touching water hardens: a source into obsidian, flowing lava into cobblestone
    if (id === B.LAVA) {
      const touching = DIRS.some(([dx, dy, dz]) => dy !== -1 && this.getBlock(x + dx, y + dy, z + dz) === B.WATER);
      if (touching) { this.setBlock(x, y, z, meta === 0 ? B.OBSIDIAN : B.COBBLE); return; }
    }
    // a flowing cell survives only while something stronger feeds it
    if (meta !== 0) {
      const above = this.getBlock(x, y + 1, z) === id;
      let best = above ? 0 : 99, sources = 0;
      for (const [dx, dz] of HDIRS) {
        if (this.getBlock(x + dx, y, z + dz) !== id) continue;
        const nm = this.getMeta(x + dx, y, z + dz);
        if (nm === 0) sources++;
        if (!(nm & 8)) best = Math.min(best, (nm & 7) + step);
      }
      const bId = this.getBlock(x, y - 1, z);
      const belowSolid = BLOCKS[bId]?.solid || (bId === id && this.getMeta(x, y - 1, z) === 0);
      if (id === B.WATER && sources >= 2 && belowSolid) { this.setBlock(x, y, z, id, 0); return; }
      if (best > max) { this.setBlock(x, y, z, B.AIR); return; }
      const nm = above ? 8 : best;
      if (nm !== meta) { this.setBlock(x, y, z, id, nm); meta = nm; }
    }
    // fall first
    const below = this.getBlock(x, y - 1, z);
    if (below === other) {
      if (id === B.WATER) this.setBlock(x, y - 1, z, this.getMeta(x, y - 1, z) === 0 ? B.OBSIDIAN : B.COBBLE);
      else this.setBlock(x, y - 1, z, B.STONE);
      return;
    }
    if (y > 0 && this.canFlowInto(below)) { this.setBlock(x, y - 1, z, id, 8); return; }
    if (below === id) {
      const bm = this.getMeta(x, y - 1, z);
      if (bm !== 0 && bm !== 8) this.setBlock(x, y - 1, z, id, 8);
      return;
    }
    // then spread sideways
    const L = (meta & 8 ? 0 : meta & 7) + step;
    if (L > max) return;
    for (const [dx, dz] of HDIRS) {
      const nx = x + dx, nz = z + dz;
      const n = this.getBlock(nx, y, nz);
      if (n === other) { if (id === B.WATER) this.setBlock(nx, y, nz, this.getMeta(nx, y, nz) === 0 ? B.OBSIDIAN : B.COBBLE); continue; }
      if (this.canFlowInto(n)) this.setBlock(nx, y, nz, id, L);
      else if (n === id) { const nm = this.getMeta(nx, y, nz); if (nm !== 0 && !(nm & 8) && (nm & 7) > L) this.setBlock(nx, y, nz, id, L); }
    }
  }

  // -------------------------------------------------------------- block light
  // Flood fill from every light source in this chunk and its 8 neighbours, so light crosses edges.
  computeLight(c) {
    c.light.fill(0);
    const q = [];
    const ox = c.cx * CS - 15, oz = c.cz * CS - 15;
    const W = CS + 30;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const n = this.chunks.get(key(c.cx + dx, c.cz + dz));
      if (!n || !n.hasLight) continue;
      for (const i of n.lights) {
        const l = this.emits(n.blocks[i]);
        if (!l) continue;
        const lx = i % CS, lz = Math.floor(i / CS) % CS, y = Math.floor(i / (CS * CS));
        const wx = n.cx * CS + lx, wz = n.cz * CS + lz;
        if (wx < ox || wx >= ox + W || wz < oz || wz >= oz + W) continue;
        // lava buried in lava or stone cannot light anything
        if (n.blocks[i] === B.LAVA && DIRS.every(([a, b, cc]) => { const t = this.getBlock(wx + a, y + b, wz + cc); return t === B.LAVA || BLOCKS[t]?.opaque; })) continue;
        q.push(wx, y, wz, l);
      }
    }
    if (!q.length) return;
    const grid = new Uint8Array(W * W * CH);
    const gi = (x, y, z) => (x - ox) + (z - oz) * W + y * W * W;
    for (let k = 0; k < q.length; k += 4) grid[gi(q[k], q[k + 1], q[k + 2])] = q[k + 3];
    let head = 0;
    while (head < q.length) {
      const x = q[head], y = q[head + 1], z = q[head + 2], l = q[head + 3]; head += 4;
      if (l <= 1) continue;
      for (const [dx, dy, dz] of DIRS) {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (ny < 0 || ny >= CH || nx < ox || nx >= ox + W || nz < oz || nz >= oz + W) continue;
        const b = BLOCKS[this.getBlock(nx, ny, nz)];
        if (b && b.opaque) continue;
        const g = gi(nx, ny, nz);
        if (grid[g] >= l - 1) continue;
        grid[g] = l - 1;
        q.push(nx, ny, nz, l - 1);
      }
    }
    for (let y = 0; y < CH; y++) for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
      c.light[idx(lx, y, lz)] = grid[gi(c.cx * CS + lx, y, c.cz * CS + lz)];
    }
  }

  // -------------------------------------------------------------- meshing
  fluidHeight(x, y, z, id) {
    if (this.getBlock(x, y + 1, z) === id) return 1;
    const m = this.getMeta(x, y, z);
    if (m === 0 || m & 8) return 0.875;
    return Math.max(0.12, (8 - (m & 7)) / 9);
  }

  buildMesh(c) {
    const solid = { pos: [], uv: [], col: [], ind: [] };
    const water = { pos: [], uv: [], col: [], ind: [] };
    const bx = c.cx * CS, bz = c.cz * CS;
    // copy this chunk plus a one-block border into flat arrays: the map lookups were most of the cost
    const P = CS + 2, PP = P * P;
    const pb = new Uint8Array(PP * CH), pm = new Uint8Array(PP * CH), pl = new Uint8Array(PP * CH), ph = new Uint8Array(PP);
    for (let z = -1; z <= CS; z++) for (let x = -1; x <= CS; x++) {
      const n = this.chunks.get(key(c.cx + (x < 0 ? -1 : x >= CS ? 1 : 0), c.cz + (z < 0 ? -1 : z >= CS ? 1 : 0)));
      if (!n) continue;
      const nx = (x + CS) % CS, nz = (z + CS) % CS, col = (x + 1) + (z + 1) * P;
      ph[col] = n.heights[nx + nz * CS];
      for (let y = 0; y < CH; y++) { const i = idx(nx, y, nz), j = col + y * PP; pb[j] = n.blocks[i]; pm[j] = n.meta[i]; pl[j] = n.light[i]; }
    }
    const below = this.dim === 'end' ? B.AIR : B.BEDROCK;
    const gb = (x, y, z) => (y < 0 ? below : y >= CH ? 0 : pb[(x - bx + 1) + (z - bz + 1) * P + y * PP]);
    const gm = (x, y, z) => (y < 0 || y >= CH ? 0 : pm[(x - bx + 1) + (z - bz + 1) * P + y * PP]);
    const gl = (x, y, z) => (y < 0 || y >= CH ? 0 : pl[(x - bx + 1) + (z - bz + 1) * P + y * PP]);
    const gh = (x, z) => ph[(x - bx + 1) + (z - bz + 1) * P];
    const fh = (x, y, z, id) => {
      if (gb(x, y + 1, z) === id) return 1;
      const m = gm(x, y, z);
      if (m === 0 || m & 8) return 0.875;
      return Math.max(0.12, (8 - (m & 7)) / 9);
    };
    const opq = (x, y, z) => { const b = BLOCKS[gb(x, y, z)]; return b && b.opaque ? 1 : 0; };
    const e = 0.0008;
    const uvOf = (t, u, v) => {
      const col = t % ATLAS_COLS, row = Math.floor(t / ATLAS_COLS);
      return [(col + e + u * (1 - 2 * e)) / ATLAS_COLS, 1 - (row + 1 - e - v * (1 - 2 * e)) / ATLAS_COLS];
    };
    const amb = this.ambient;
    // Approximate sky light: open sky = 1, next to an open column = 0.8, then fading with depth under cover.
    const lightAt = (x, y, z) => {
      const bl = gl(x, y, z) / 15;
      if (amb != null) return { sky: amb, bl };
      const h = gh(x, z);
      let sky = 1;
      if (y <= h) {
        let side = false;
        for (let dx = -1; dx <= 1 && !side; dx++) for (let dz = -1; dz <= 1; dz++) if (((x + dx - bx + 1) >>> 0) < P && ((z + dz - bz + 1) >>> 0) < P ? gh(x + dx, z + dz) < y : this.heightAt(x + dx, z + dz) < y) { side = true; break; }
        sky = side ? 0.8 : 0.65 * Math.max(0, 1 - (h - y) / 7);
      }
      return { sky, bl };
    };
    const quad = (target, pts, uvs, col, L) => {
      const n = target.pos.length / 3;
      for (let k = 0; k < 4; k++) { target.pos.push(...pts[k]); target.uv.push(...uvs[k]); target.col.push(col, L.sky, L.bl); }
      target.ind.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
    };
    let maxY = 0;
    for (let i = 0; i < CS * CS; i++) maxY = Math.max(maxY, c.heights[i]);
    maxY = Math.min(CH - 1, Math.max(maxY + 3, SEA + 1));
    if (amb != null) maxY = CH - 1;

    for (let y = 0; y <= maxY; y++) for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
      const i = idx(lx, y, lz);
      const id = c.blocks[i];
      if (!id) continue;
      const b = BLOCKS[id];
      const meta = c.meta[i];
      const wx = bx + lx, wz = bz + lz;

      if (b.cross) {
        const L = lightAt(wx, y, wz);
        const t = id === B.WHEAT_CROP ? T['wheat' + Math.min(3, meta >> 1)] : id === B.NETHER_WART ? T['wart' + (meta >= 2 ? 1 : 0)] : b.top;
        const quads = [[[0.15, 0, 0.15], [0.85, 0, 0.85], [0.15, 1, 0.15], [0.85, 1, 0.85]], [[0.85, 0, 0.15], [0.15, 0, 0.85], [0.85, 1, 0.15], [0.15, 1, 0.85]]];
        const uvs = [[0, 0], [1, 0], [0, 1], [1, 1]];
        for (const q of quads) for (const flip of [false, true]) {
          const order = flip ? [1, 0, 3, 2] : [0, 1, 2, 3];
          quad(solid, order.map((o) => [lx + q[o][0], y + q[o][1], lz + q[o][2]]), order.map((o) => uvOf(t, ...uvs[o])), 0.9, L);
        }
        continue;
      }

      if (b.shape) {
        const s = shapeOf(id, meta, this, wx, y, wz);
        const target = b.transparent ? water : solid;
        for (const part of s.render) {
          const [x0, y0, z0, x1, y1, z1] = part.b;
          const tex = part.t || b;
          FACES.forEach((f, fi) => {
            // cull only faces lying on the block boundary against an opaque neighbour
            const onEdge = (f.dir[0] === -1 && x0 === 0) || (f.dir[0] === 1 && x1 === 1) || (f.dir[1] === -1 && y0 === 0) || (f.dir[1] === 1 && y1 === 1) || (f.dir[2] === -1 && z0 === 0) || (f.dir[2] === 1 && z1 === 1);
            if (onEdge && opq(wx + f.dir[0], y + f.dir[1], wz + f.dir[2])) return;
            if (id === B.PORTAL && onEdge && gb(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]) === B.PORTAL) return;
            const L = onEdge ? lightAt(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]) : lightAt(wx, y, wz);
            if (b.light) L.bl = Math.max(L.bl, b.light / 15);
            const t = tex.faces ? tex.faces[fi] : (tex[f.tex] ?? tex.side);
            const pts = [], uvs = [];
            for (const [px, py, pz] of f.c) {
              const X = px ? x1 : x0, Y = py ? y1 : y0, Z = pz ? z1 : z0;
              pts.push([lx + X, y + Y, lz + Z]);
              uvs.push(uvOf(t, ...FACE_UV[fi](X, Y, Z)));
            }
            quad(target, pts, uvs, id === B.WIRE ? 0.35 + (meta / 15) * 0.65 : f.shade, L);
          });
        }
        continue;
      }

      const fluid = b.liquid;
      const target = b.transparent ? water : solid;
      const top = fluid ? fh(wx, y, wz, id) : 1;
      for (let fi = 0; fi < 6; fi++) {
        const f = FACES[fi];
        const nx = wx + f.dir[0], ny = y + f.dir[1], nz = wz + f.dir[2];
        const nid = gb(nx, ny, nz);
        const nb = BLOCKS[nid];
        if (nb && nb.opaque) continue;
        if (nid === id && !fluid && (b.transparent || id === B.GLASS)) continue;
        if (fluid && nid === id) {
          if (f.dir[1] !== 0) continue;
          if (fh(nx, ny, nz, id) >= top) continue;
        }
        if (fluid && nid === B.ICE) continue;
        if (fluid && f.dir[1] === -1 && nb && nb.solid) continue;
        const L = lightAt(nx, ny, nz);
        const t = b[f.tex];
        const n = target.pos.length / 3;
        const ao = [];
        for (const [px, py, pz, u, v] of f.c) {
          let a = 3;
          if (!fluid && b.opaque) {
            const s = [];
            for (let ax = 0; ax < 3; ax++) { if (f.dir[ax] !== 0) continue; s.push([ax, [px, py, pz][ax] ? 1 : -1]); }
            const o1 = [nx, ny, nz], o2 = [nx, ny, nz], o3 = [nx, ny, nz];
            o1[s[0][0]] += s[0][1];
            o2[s[1][0]] += s[1][1];
            o3[s[0][0]] += s[0][1]; o3[s[1][0]] += s[1][1];
            const s1 = opq(...o1), s2 = opq(...o2), cn = opq(...o3);
            a = s1 && s2 ? 0 : 3 - (s1 + s2 + cn);
          }
          ao.push(a);
          target.pos.push(lx + px, y + (py ? top : 0), lz + pz);
          target.uv.push(...uvOf(t, u, v));
          target.col.push(f.shade * AO[a], L.sky, b.light ? 1 : L.bl);
        }
        if (ao[0] + ao[3] > ao[1] + ao[2]) target.ind.push(n, n + 1, n + 3, n, n + 3, n + 2);
        else target.ind.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
        // underside of a water surface, visible when swimming
        if (fluid && f.dir[1] === 1 && b.transparent) {
          const m = target.pos.length / 3;
          for (let k = 0; k < 4; k++) {
            target.pos.push(target.pos[(n + k) * 3], target.pos[(n + k) * 3 + 1], target.pos[(n + k) * 3 + 2]);
            target.uv.push(target.uv[(n + k) * 2], target.uv[(n + k) * 2 + 1]);
            target.col.push(0.6, L.sky, L.bl);
          }
          target.ind.push(m + 2, m + 1, m, m + 3, m + 1, m + 2);
        }
      }
    }

    const make = (d, mat) => {
      if (!d.ind.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(d.pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(d.uv, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(d.col, 3));
      g.setIndex(d.ind);
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, mat);
      mesh.position.set(bx, 0, bz);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      return mesh;
    };
    this.disposeMeshes(c);
    c.meshes = [make(solid, this.mats.solid), make(water, this.mats.water)].filter(Boolean);
    for (const m of c.meshes) this.scene.add(m);
    c.dirty = false;
  }

  disposeMeshes(c) {
    if (!c.meshes) return;
    for (const m of c.meshes) { this.scene.remove(m); m.geometry.dispose(); }
    c.meshes = null;
  }
  dispose() { for (const c of this.chunks.values()) this.disposeMeshes(c); this.chunks.clear(); }

  // -------------------------------------------------------------- streaming
  // Generates chunks within rd+2, meshes within rd+0.5 once all neighbours exist.
  update(px, pz, budgetMs = 8) {
    const pcx = Math.floor(px / CS), pcz = Math.floor(pz / CS);
    const rd = this.renderDist;
    const t0 = performance.now();
    const want = [];
    for (let dx = -rd - 2; dx <= rd + 2; dx++) for (let dz = -rd - 2; dz <= rd + 2; dz++) {
      if (dx * dx + dz * dz > (rd + 2) * (rd + 2)) continue;
      want.push([pcx + dx, pcz + dz, dx * dx + dz * dz]);
    }
    want.sort((a, b) => a[2] - b[2]);
    for (const [cx, cz] of want) {
      if (this.chunks.has(key(cx, cz))) continue;
      this.ensureChunk(cx, cz);
      if (performance.now() - t0 > budgetMs) break;
    }
    for (const [cx, cz, d2] of want) {
      if (d2 > (rd + 0.5) * (rd + 0.5)) continue;
      const c = this.chunks.get(key(cx, cz));
      if (!c || !c.dirty) continue;
      let ready = true;
      for (let dx = -1; dx <= 1 && ready; dx++) for (let dz = -1; dz <= 1; dz++) if (!this.chunks.has(key(cx + dx, cz + dz))) { ready = false; break; }
      if (!ready) continue;
      if (c.lightDirty) { this.computeLight(c); c.lightDirty = false; }
      this.buildMesh(c);
      if (performance.now() - t0 > budgetMs * 1.5 && !this.dirtyNow) break;
    }
    this.dirtyNow = false;
    for (const [k, c] of this.chunks) {
      const dx = c.cx - pcx, dz = c.cz - pcz;
      if (dx * dx + dz * dz > (rd + 4) * (rd + 4)) { this.disposeMeshes(c); this.chunks.delete(k); }
    }
  }
  ensureChunk(cx, cz) {
    let c = this.chunks.get(key(cx, cz));
    if (!c) { c = new Chunk(cx, cz); this.generate(c); this.chunks.set(key(cx, cz), c); }
    return c;
  }

  meshedCount() { let n = 0; for (const c of this.chunks.values()) if (c.meshes) n++; return n; }

  // first standable air above solid ground, top-down (nether: below the roof)
  surfaceY(wx, wz) {
    if (this.isLoaded(wx, wz)) {
      const top = this.dim === 'nether' ? 118 : CH - 3;
      for (let y = top; y > 0; y--) {
        const b = BLOCKS[this.getBlock(wx, y, wz)];
        if (b && b.solid && !this.getBlock(wx, y + 1, wz) && !this.getBlock(wx, y + 2, wz)) return y + 1;
      }
    }
    return Math.max(this.biomeAt(wx, wz).h, SEA) + 1;
  }

  // -------------------------------------------------------------- raycast (DDA, then exact boxes for shaped blocks)
  raycast(origin, dir, maxDist, liquids = false) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const sx = Math.sign(dir.x), sy = Math.sign(dir.y), sz = Math.sign(dir.z);
    const tdx = Math.abs(1 / dir.x), tdy = Math.abs(1 / dir.y), tdz = Math.abs(1 / dir.z);
    let tmx = sx > 0 ? (x + 1 - origin.x) * tdx : (origin.x - x) * tdx;
    let tmy = sy > 0 ? (y + 1 - origin.y) * tdy : (origin.y - y) * tdy;
    let tmz = sz > 0 ? (z + 1 - origin.z) * tdz : (origin.z - z) * tdz;
    let normal = [0, 0, 0], t = 0;
    while (t <= maxDist) {
      const id = this.getBlock(x, y, z);
      if (id) {
        const b = BLOCKS[id];
        const meta = this.getMeta(x, y, z);
        if (b.liquid) {
          if (liquids && meta === 0) return { x, y, z, id, meta, normal, dist: t, hitY: 0.5 };
        } else {
          const boxes = pickBoxes(id, meta, this, x, y, z);
          if (!boxes) return { x, y, z, id, meta, normal, dist: t, hitY: origin.y + dir.y * t - y };
          let best = null;
          for (const bb of boxes) {
            const h = rayBox(origin, dir, [x + bb[0], y + bb[1], z + bb[2], x + bb[3], y + bb[4], z + bb[5]]);
            if (h && (!best || h.t < best.t)) best = h;
          }
          if (best && best.t <= maxDist) return { x, y, z, id, meta, normal: best.n, dist: best.t, hitY: origin.y + dir.y * best.t - y };
        }
      }
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; normal = [-sx, 0, 0]; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; normal = [0, -sy, 0]; }
      else { z += sz; t = tmz; tmz += tdz; normal = [0, 0, -sz]; }
    }
    return null;
  }
}

export function rayBox(o, d, b) {
  const O = [o.x, o.y, o.z], D = [d.x, d.y, d.z];
  let t0 = 0, t1 = Infinity, n = null;
  for (let a = 0; a < 3; a++) {
    if (Math.abs(D[a]) < 1e-9) { if (O[a] < b[a] || O[a] > b[a + 3]) return null; continue; }
    let ta = (b[a] - O[a]) / D[a], tb = (b[a + 3] - O[a]) / D[a];
    if (ta > tb) [ta, tb] = [tb, ta];
    if (ta > t0) { t0 = ta; n = [0, 0, 0]; n[a] = -Math.sign(D[a]); }
    t1 = Math.min(t1, tb);
    if (t0 > t1) return null;
  }
  return { t: t0, n: n || [0, 1, 0] };
}

function smooth(a, b, v) { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }

// Shader: color attr = (faceShade*AO, skyLight, blockLight); uniform daylight mixes them.
export function makeMaterials(atlasTex) {
  const common = {
    uniforms: {
      map: { value: atlasTex },
      daylight: { value: 1 },
      fogColor: { value: new THREE.Color() },
      fogNear: { value: 60 },
      fogFar: { value: 100 },
      underwater: { value: 0 },
    },
    vertexShader: `
      attribute vec3 color;
      varying vec2 vUv; varying vec3 vC; varying float vDist;
      void main(){
        vUv = uv; vC = color;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vDist = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform float daylight; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
      uniform float alphaCut; uniform float opacity; uniform float underwater;
      varying vec2 vUv; varying vec3 vC; varying float vDist;
      void main(){
        vec4 t = texture2D(map, vUv);
        if (t.a < alphaCut) discard;
        float sky = vC.y * daylight;
        float bl = vC.z;
        float l = max(max(sky, bl * 0.95), 0.06);
        vec3 col = t.rgb * vC.x * l;
        col += t.rgb * vec3(0.25,0.12,0.0) * bl * (1.0 - daylight*vC.y);
        float f = smoothstep(fogNear, fogFar, vDist);
        col = mix(col, fogColor, f);
        if (underwater > 0.5 && underwater < 1.5) col = mix(col, vec3(0.1,0.2,0.5)*daylight, 0.35);
        if (underwater > 1.5) col = mix(col, vec3(0.9,0.3,0.0), 0.6);
        gl_FragColor = vec4(col, t.a * opacity);
      }`,
  };
  const solid = new THREE.ShaderMaterial({ ...common, uniforms: { ...common.uniforms, alphaCut: { value: 0.5 }, opacity: { value: 1 } } });
  const water = new THREE.ShaderMaterial({
    ...common,
    uniforms: { ...common.uniforms, alphaCut: { value: 0.01 }, opacity: { value: 1 } },
    transparent: true, depthWrite: false, side: THREE.FrontSide,
  });
  return { solid, water };
}
