// World generators for the three dimensions, plus structures (villages, dungeons, stronghold) and chest loot.
import { hash3, mulberry32 } from './noise.js';
import { B, I, BLOCKS, toolId } from './blocks.js';

export const CS = 16, CH = 128, SEA = 62;
export const idx = (x, y, z) => x + z * CS + y * CS * CS;
const ckey = (cx, cz) => cx + ',' + cz;

export function generateChunk(w, c) {
  if (w.dim === 'nether') return genNether(w, c);
  if (w.dim === 'end') return genEnd(w, c);
  return genOverworld(w, c);
}

// ------------------------------------------------------------------ overworld
function genOverworld(w, c) {
  const { blocks } = c;
  const n = w.noise, seed = w.seed;
  const cols = [];
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const wx = c.cx * CS + lx, wz = c.cz * CS + lz;
    const { h, biome, temp } = w.biomeAt(wx, wz);
    cols.push({ lx, lz, wx, wz, h, biome });
    const beach = h <= SEA + 1 && h >= SEA - 2 && biome !== 'snowy';
    let top, fill;
    if (biome === 'desert') { top = B.SAND; fill = B.SAND; }
    else if (biome === 'ocean') { top = hash3(wx, 1, wz, seed) < 0.3 ? B.GRAVEL : (hash3(wx >> 3, 2, wz >> 3, seed) < 0.15 ? B.CLAY : B.SAND); fill = B.SAND; }
    else if (beach || biome === 'shore') { top = B.SAND; fill = B.SAND; }
    else if (biome === 'snowy' || (biome === 'mountains' && h > 100)) { top = h > 108 ? B.SNOW : B.SNOW_GRASS; fill = B.DIRT; }
    else if (biome === 'mountains' && h > 88) { top = B.STONE; fill = B.STONE; }
    else { top = B.GRASS; fill = B.DIRT; }

    for (let y = 0; y < CH; y++) {
      let id = B.AIR;
      if (y === 0 || (y <= 3 && hash3(wx, y, wz, seed) < 0.5 - y * 0.12)) id = B.BEDROCK;
      else if (y <= h) {
        const depth = h - y;
        if (depth === 0) id = top;
        else if (depth < 4) id = fill === B.SAND && depth >= 3 ? B.SANDSTONE : fill;
        else id = B.STONE;
        // caves: intersecting noise sheets make winding tunnels; lava fills the deepest ones
        const canCarve = y > 4 && (h > SEA + 1 ? true : y < h - 4);
        if (canCarve) {
          const a = n.n3(wx / 38, y / 22, wz / 38), b2 = n.n3(wx / 38 + 97, y / 22 + 31, wz / 38 - 53);
          if (a * a + b2 * b2 < 0.012 * (y < 20 ? 2.2 : 1)) id = y < 11 ? B.LAVA : B.AIR;
          else if (y < 44 && n.n3(wx / 55, y / 30, wz / 55) > 0.68) id = y < 11 ? B.LAVA : B.AIR;
        }
        if (id === B.STONE) {
          const r = hash3(wx, y, wz, seed + 11);
          const cl = n.n3(wx / 6, y / 6, wz / 6);
          if (cl > 0.55 && r < 0.6 && y < 100) id = B.COAL_ORE;
          else if (cl < -0.62 && r < 0.6 && y < 64) id = B.IRON_ORE;
          else if (r < 0.0016 && y < 32) id = B.GOLD_ORE;
          else if (r > 0.9993 && y < 16) id = B.DIAMOND_ORE;
          else if (r > 0.9985 && r <= 0.9993 && y < 32) id = B.LAPIS_ORE;
          else if (r > 0.9978 && r <= 0.9985 && biome === 'mountains' && y < 70) id = B.EMERALD_ORE;
          else if (r > 0.994 && r < 0.9965) id = B.GRAVEL;
          else if (r > 0.9965 && r <= 0.9978 && y < 16) id = B.REDSTONE_ORE;
        }
      } else if (y <= SEA) id = (y === SEA && temp < -0.35) ? B.ICE : B.WATER;
      if (id) blocks[idx(lx, y, lz)] = id;
    }
  }

  // decorations (kept inside the chunk so generation never touches neighbours)
  for (const col of cols) {
    const { lx, lz, wx, wz, h, biome } = col;
    const topId = blocks[idx(lx, h, lz)];
    if (h + 1 >= CH - 10) continue;
    if (blocks[idx(lx, h + 1, lz)] !== B.AIR) continue;
    const r = hash3(wx, 7, wz, seed);
    const inner = lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13;
    // sugar cane on the water's edge
    if ((topId === B.SAND || topId === B.GRASS) && h === SEA && r < 0.12) {
      const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => w.biomeAt(wx + dx, wz + dz).h < SEA);
      if (wet) { const ht = 1 + Math.floor(hash3(wx, 8, wz, seed) * 3); for (let i = 1; i <= ht; i++) blocks[idx(lx, h + i, lz)] = B.SUGAR_CANE; continue; }
    }
    if (topId === B.GRASS) {
      const treeP = biome === 'forest' ? 0.045 : 0.004;
      if (inner && r < treeP) { oak(c.blocks, lx, h + 1, lz, hash3(wx, 3, wz, seed), (a, b, cc) => hash3(wx + a, b, wz + cc, seed)); continue; }
      if (r > 0.85) blocks[idx(lx, h + 1, lz)] = B.TALLGRASS;
      else if (r > 0.83) blocks[idx(lx, h + 1, lz)] = r > 0.84 ? B.FLOWER_RED : B.FLOWER_YELLOW;
      else if (r > 0.8295 && biome === 'plains') blocks[idx(lx, h + 1, lz)] = B.PUMPKIN;
      else if (r > 0.828 && biome === 'forest') blocks[idx(lx, h + 1, lz)] = B.MELON;
    } else if (topId === B.SNOW_GRASS) {
      if (inner && r < 0.02) spruce(c.blocks, lx, h + 1, lz, hash3(wx, 5, wz, seed));
    } else if (topId === B.SAND && biome === 'desert') {
      if (r < 0.006 && lx > 0 && lx < 15 && lz > 0 && lz < 15) {
        const ht = 1 + Math.floor(hash3(wx, 9, wz, seed) * 3);
        for (let i = 1; i <= ht; i++) blocks[idx(lx, h + i, lz)] = B.CACTUS;
      }
    }
  }

  const spawns = [];
  dungeon(w, c);
  applyStructures(w, c, spawns);
  return spawns;
}

export function oak(bl, x, y, z, r0, rnd) {
  const ht = 4 + Math.floor(r0 * 3);
  for (let dy = ht - 3; dy <= ht; dy++) {
    const rad = dy >= ht - 1 ? 1 : 2;
    for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
      if (Math.abs(dx) === rad && Math.abs(dz) === rad && (dy === ht || rnd(dx, dy, dz) < 0.5)) continue;
      const i = idx(x + dx, y + dy, z + dz);
      if (bl[i] === B.AIR) bl[i] = B.LEAVES;
    }
  }
  for (let dy = 0; dy < ht; dy++) bl[idx(x, y + dy, z)] = B.LOG;
  bl[idx(x, y - 1, z)] = B.DIRT;
}

export function spruce(bl, x, y, z, r0) {
  const ht = 6 + Math.floor(r0 * 3);
  for (let dy = 2; dy <= ht; dy++) {
    const rad = dy === ht ? 0 : ((ht - dy) % 2 === 0 ? 1 : 2);
    for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
      if (rad === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
      const i = idx(x + dx, y + dy, z + dz);
      if (bl[i] === B.AIR) bl[i] = B.SPRUCE_LEAVES;
    }
  }
  bl[idx(x, y + ht + 1, z)] = B.SPRUCE_LEAVES;
  for (let dy = 0; dy < ht; dy++) bl[idx(x, y + dy, z)] = B.SPRUCE_LOG;
}

// ------------------------------------------------------------------ dungeons (one chunk each)
function dungeon(w, c) {
  const r = hash3(c.cx, 77, c.cz, w.seed);
  if (r > 0.02) return;
  const y0 = 12 + Math.floor(hash3(c.cx, 78, c.cz, w.seed) * 26);
  const h = w.biomeAt(c.cx * CS + 8, c.cz * CS + 8).h;
  if (y0 + 8 > h) return;
  const rnd = mulberry32((c.cx * 73856093) ^ (c.cz * 19349663) ^ w.seed);
  for (let x = 3; x <= 11; x++) for (let z = 3; z <= 11; z++) for (let y = y0; y <= y0 + 5; y++) {
    const wall = x === 3 || x === 11 || z === 3 || z === 11 || y === y0 || y === y0 + 5;
    c.blocks[idx(x, y, z)] = wall ? (rnd() < 0.4 ? B.MOSSY : B.COBBLE) : B.AIR;
  }
  const chests = [[4, 4], [10, 10]].slice(0, 1 + (rnd() < 0.5 ? 1 : 0));
  for (const [x, z] of chests) addChest(w, c, x, y0 + 1, z, 'dungeon');
  c.blocks[idx(7, y0 + 1, 7)] = B.TORCH;
  for (const [x, z] of [[4, 10], [10, 4]]) c.blocks[idx(x, y0 + 4, z)] = B.COBWEB;
}

// ------------------------------------------------------------------ structures spanning chunks
// A structure is built once as a list of placements bucketed by chunk; each chunk applies its bucket.
function applyStructures(w, c, spawns) {
  const REG = 384;
  const rx0 = Math.floor((c.cx * CS - 64) / REG), rx1 = Math.floor((c.cx * CS + 80) / REG);
  const rz0 = Math.floor((c.cz * CS - 64) / REG), rz1 = Math.floor((c.cz * CS + 80) / REG);
  for (let rx = rx0; rx <= rx1; rx++) for (let rz = rz0; rz <= rz1; rz++) {
    const v = village(w, rx, rz, REG);
    if (v) applyBucket(w, c, v, spawns);
  }
  const sh = stronghold(w);
  if (sh) applyBucket(w, c, sh, spawns);
  for (const [R, fn] of [[512, monument], [768, mansion]]) {
    const ax0 = Math.floor((c.cx * CS - 40) / R), ax1 = Math.floor((c.cx * CS + 56) / R);
    const az0 = Math.floor((c.cz * CS - 40) / R), az1 = Math.floor((c.cz * CS + 56) / R);
    for (let rx = ax0; rx <= ax1; rx++) for (let rz = az0; rz <= az1; rz++) { const st = cached(w, fn.name + rx + ',' + rz, () => fn(w, rx, rz, R)); if (st) applyBucket(w, c, st, spawns); }
  }
}
function cached(w, k, make) { if (!w.structCache.has(k)) w.structCache.set(k, make()); return w.structCache.get(k); }

// ------------------------------------------------------------------ ocean monument
function monument(w, rx, rz, R) {
  if (hash3(rx, 101, rz, w.seed) > 0.6) return null;
  const cx = rx * R + 64 + Math.floor(hash3(rx, 102, rz, w.seed) * (R - 128)), cz = rz * R + 64 + Math.floor(hash3(rx, 103, rz, w.seed) * (R - 128));
  const b = w.biomeAt(cx, cz);
  if (b.biome !== 'ocean') return null;
  const S = new Builder();
  const y0 = SEA - 10, half = 11;
  for (let x = -half; x <= half; x++) for (let z = -half; z <= half; z++) for (let y = w.biomeAt(cx + x, cz + z).h; y < y0; y++) S.set(cx + x, y, cz + z, B.PRISMARINE);
  for (let i = 0; i <= 8; i++) {
    const hs = half - i;
    for (let x = -hs; x <= hs; x++) for (let z = -hs; z <= hs; z++) {
      const edge = Math.abs(x) === hs || Math.abs(z) === hs;
      const door = i < 3 && (Math.abs(x) <= 1 || Math.abs(z) <= 1);
      const y = y0 + i;
      if (i === 0) S.set(cx + x, y, cz + z, (x + z) % 4 === 0 ? B.DARK_PRISMARINE : B.PRISMARINE);
      else if (edge && !door) S.set(cx + x, y, cz + z, (Math.abs(x) === hs && Math.abs(z) === hs) ? B.SEA_LANTERN : (i % 3 === 0 ? B.DARK_PRISMARINE : B.PRISMARINE));
      else S.set(cx + x, y, cz + z, B.WATER);
    }
  }
  // the treasure room
  S.box(cx - 2, y0 + 1, cz - 2, cx + 1, y0 + 4, cz + 1, B.DARK_PRISMARINE);
  S.box(cx - 1, y0 + 2, cz - 1, cx, y0 + 3, cz, B.GOLD_BLOCK);
  S.set(cx - 2, y0 + 2, cz - 1, B.WATER); S.set(cx - 2, y0 + 2, cz, B.SEA_LANTERN);
  S.center = [cx, y0, cz];
  return S;
}

// ------------------------------------------------------------------ woodland mansion
function mansion(w, rx, rz, R) {
  if (hash3(rx, 111, rz, w.seed) > 0.45) return null;
  const cx = rx * R + 64 + Math.floor(hash3(rx, 112, rz, w.seed) * (R - 128)), cz = rz * R + 64 + Math.floor(hash3(rx, 113, rz, w.seed) * (R - 128));
  const b = w.biomeAt(cx, cz);
  if (b.biome !== 'forest') return null;
  const S = new Builder();
  const rnd = mulberry32(w.seed ^ (rx * 7919) ^ (rz * 104729));
  const X0 = cx - 12, X1 = cx + 12, Z0 = cz - 9, Z1 = cz + 9, y0 = Math.max(b.h, SEA) + 1;
  for (let x = X0 - 2; x <= X1 + 2; x++) for (let z = Z0 - 2; z <= Z1 + 2; z++) {
    const g = w.biomeAt(x, z).h;
    for (let y = Math.min(g, y0 - 1); y < y0; y++) S.set(x, y, z, B.COBBLE);
    S.box(x, y0, z, x, y0 + 16, z, B.AIR);
  }
  for (const fl of [0, 1]) {
    const yb = y0 + fl * 6;
    S.box(X0, yb, Z0, X1, yb, Z1, fl ? B.DARK_PLANKS : B.COBBLE);
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      const edge = x === X0 || x === X1 || z === Z0 || z === Z1;
      const inner = (z === cz - 2 || z === cz + 2) && x !== cx && (x - X0) % 6 !== 3; // corridor walls with doorways
      const cross = (x - X0) % 6 === 0 && z !== cz - 1 && z !== cz && z !== cz + 1;
      if (!edge && !inner && !cross) continue;
      for (let y = yb + 1; y <= yb + 5; y++) {
        const pillar = (x - X0) % 6 === 0 && (z === Z0 || z === Z1) || ((x === X0 || x === X1) && (z - Z0) % 6 === 0);
        const win = edge && y === yb + 3 && !pillar && (x + z) % 3 === 0;
        S.set(x, y, z, win ? B.GLASS : pillar ? B.DARK_LOG : B.DARK_PLANKS);
      }
    }
    // rooms: beds, tables, chests, bookshelves
    for (let rx2 = X0 + 3; rx2 < X1; rx2 += 6) for (const rz2 of [Z0 + 3, Z1 - 3]) {
      const pick = rnd();
      if (pick < 0.3) { S.set(rx2, yb + 1, rz2, B.CHEST); S.loot.push([rx2, yb + 1, rz2, 'mansion']); }
      else if (pick < 0.55) { S.set(rx2, yb + 1, rz2, B.BED); S.set(rx2 + 1, yb + 1, rz2, B.BED); }
      else if (pick < 0.8) S.box(rx2 - 1, yb + 1, rz2, rx2 + 1, yb + 2, rz2, B.BOOKSHELF);
      else S.set(rx2, yb + 1, rz2, B.TABLE);
      S.set(rx2 + 2, yb + 1, rz2 + (rz2 < cz ? 1 : -1), B.TORCH);
    }
    S.set(cx - 1, yb + 1, cz, B.TORCH);
  }
  // doors in the front wall, a ladder up, a flat roof with a rim
  S.set(cx, y0 + 1, Z1, B.DOOR, 2); S.set(cx, y0 + 2, Z1, B.DOOR, 10);
  for (let y = y0 + 1; y <= y0 + 6; y++) S.set(cx + 1, y, Z0 + 1, B.LADDER, 0);
  S.set(cx + 1, y0 + 6, Z0 + 1, B.LADDER, 0);
  S.box(X0 - 1, y0 + 12, Z0 - 1, X1 + 1, y0 + 12, Z1 + 1, B.DARK_PLANKS);
  for (let x = X0 - 1; x <= X1 + 1; x++) for (const z of [Z0 - 1, Z1 + 1]) S.set(x, y0 + 13, z, B.SLAB_WOOD);
  S.center = [cx, y0, cz];
  return S;
}

function applyBucket(w, c, s, spawns) {
  const list = s.chunks.get(ckey(c.cx, c.cz));
  if (!list) return;
  for (const [x, y, z, id, meta] of list) {
    const i = idx(x - c.cx * CS, y, z - c.cz * CS);
    c.blocks[i] = id; c.meta[i] = meta || 0;
  }
  for (const [x, y, z, table] of s.loot) if (Math.floor(x / CS) === c.cx && Math.floor(z / CS) === c.cz) fillLoot(w, x, y, z, table);
  if (s.center && Math.floor(s.center[0] / CS) === c.cx && Math.floor(s.center[2] / CS) === c.cz) for (const sp of s.spawns) spawns.push(sp);
}

class Builder {
  constructor() { this.chunks = new Map(); this.loot = []; this.spawns = []; }
  set(x, y, z, id, meta = 0) {
    if (y < 1 || y >= CH) return;
    const k = ckey(Math.floor(x / CS), Math.floor(z / CS));
    let l = this.chunks.get(k); if (!l) this.chunks.set(k, (l = []));
    l.push([x, y, z, id, meta]);
  }
  box(x0, y0, z0, x1, y1, z1, id, meta = 0) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) this.set(x, y, z, id, meta); }
}

function village(w, rx, rz, REG) {
  const key = 'v' + rx + ',' + rz;
  if (w.structCache.has(key)) return w.structCache.get(key);
  let res = null;
  const seed = w.seed;
  if (hash3(rx, 91, rz, seed) < 0.65) {
    const cx = rx * REG + 64 + Math.floor(hash3(rx, 92, rz, seed) * (REG - 128));
    const cz = rz * REG + 64 + Math.floor(hash3(rx, 93, rz, seed) * (REG - 128));
    const bio = w.biomeAt(cx, cz);
    if (['plains', 'desert', 'snowy'].includes(bio.biome)) res = buildVillage(w, cx, cz, bio.biome, mulberry32(seed ^ (rx * 928371) ^ (rz * 1237)));
  }
  w.structCache.set(key, res);
  return res;
}

function buildVillage(w, cx, cz, biome, rnd) {
  const S = new Builder();
  const ground = (x, z) => Math.max(w.biomeAt(x, z).h, SEA);
  const desert = biome === 'desert', snowy = biome === 'snowy';
  const WALL = desert ? B.SANDSTONE : B.PLANKS, CORNER = desert ? B.SANDSTONE : snowy ? B.SPRUCE_LOG : B.LOG;
  const PATH = desert ? B.SANDSTONE : B.GRAVEL;
  // well
  const y0 = ground(cx, cz);
  S.box(cx - 3, y0 + 1, cz - 3, cx + 2, y0 + 6, cz + 2, B.AIR);
  S.box(cx - 2, y0 - 3, cz - 2, cx + 1, y0, cz + 1, B.COBBLE);
  S.box(cx - 1, y0 - 2, cz - 1, cx, y0, cz, B.WATER);
  for (const [dx, dz] of [[-2, -2], [1, -2], [-2, 1], [1, 1]]) S.box(cx + dx, y0 + 1, cz + dz, cx + dx, y0 + 2, cz + dz, B.FENCE);
  S.box(cx - 2, y0 + 3, cz - 2, cx + 1, y0 + 3, cz + 1, B.SLAB_STONE);
  // roads
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dz] of dirs) {
    for (let r = 3; r <= 28; r++) for (let p = -1; p <= 1; p++) {
      const x = cx + dx * r + (dz ? p : 0), z = cz + dz * r + (dx ? p : 0);
      const g = w.biomeAt(x, z).h;
      if (g < SEA) S.set(x, SEA, z, B.PLANKS);
      else { S.set(x, g, z, PATH); S.box(x, g + 1, z, x, g + 10, z, B.AIR); }
    }
  }
  // houses and farms beside the roads
  let houses = 0;
  dirs.forEach(([dx, dz], di) => {
    for (const r of [11, 20]) for (const side of [-1, 1]) {
      if (rnd() < 0.3) continue;
      // footprint origin: 5x5 (house) or 5x7 (farm) set back 3 from the road centre
      const along = [cx + dx * r, cz + dz * r];
      const px = dz ? side : 0, pz = dx ? side : 0; // perpendicular
      const ox = along[0] + px * 3 + (px < 0 ? -4 : 0) - (dx ? 2 : 0);
      const oz = along[1] + pz * 3 + (pz < 0 ? -4 : 0) - (dz ? 2 : 0);
      // door faces the road: which wall of the footprint is nearest the road
      const facing = px ? (px > 0 ? 3 : 1) : (pz > 0 ? 0 : 2);
      if (rnd() < 0.25) farm(S, w, ox, oz);
      else { house(S, w, ox, oz, facing, { WALL, CORNER }, rnd); houses++; }
    }
    void di;
  });
  const n = 2 + Math.min(4, houses);
  for (let i = 0; i < n; i++) S.spawns.push({ type: 'villager', x: cx + (i % 2 ? 3 : -3) + 0.5, y: y0 + 1, z: cz + (i - n / 2) + 0.5 });
  S.center = [cx, y0, cz];
  return S;
}

function footprint(S, w, ox, oz, sx, sz, base) {
  for (let x = ox; x < ox + sx; x++) for (let z = oz; z < oz + sz; z++) {
    const g = w.biomeAt(x, z).h;
    for (let y = Math.min(g, base - 1); y < base; y++) S.set(x, y, z, B.COBBLE);
    S.box(x, base + 1, z, x, base + 7, z, B.AIR);
  }
}

function house(S, w, ox, oz, facing, M, rnd) {
  const base = Math.max(w.biomeAt(ox + 2, oz + 2).h, SEA);
  footprint(S, w, ox - 1, oz - 1, 7, 7, base);
  S.box(ox, base, oz, ox + 4, base, oz + 4, B.COBBLE);
  for (let x = ox; x <= ox + 4; x++) for (let z = oz; z <= oz + 4; z++) {
    const edgeX = x === ox || x === ox + 4, edgeZ = z === oz || z === oz + 4;
    if (!edgeX && !edgeZ) continue;
    const corner = edgeX && edgeZ;
    for (let y = base + 1; y <= base + 3; y++) S.set(x, y, z, corner ? M.CORNER : M.WALL);
    const mid = (edgeX && z === oz + 2) || (edgeZ && x === ox + 2);
    if (mid) S.set(x, base + 2, z, B.GLASS);
  }
  S.box(ox - 1, base + 4, oz - 1, ox + 5, base + 4, oz + 5, B.SLAB_WOOD);
  S.box(ox, base + 4, oz, ox + 4, base + 4, oz + 4, B.PLANKS);
  // door in the wall facing the road (facing = side of the house the road is on)
  const door = [[ox + 2, oz], [ox + 4, oz + 2], [ox + 2, oz + 4], [ox, oz + 2]][facing];
  S.set(door[0], base + 1, door[1], B.DOOR, facing);
  S.set(door[0], base + 2, door[1], B.DOOR, facing | 8);
  S.set(ox + 1, base + 1, oz + 1, B.BED);
  S.set(ox + 3, base + 1, oz + 3, B.TORCH);
  if (rnd() < 0.5) { S.set(ox + 3, base + 1, oz + 1, B.CHEST); S.loot.push([ox + 3, base + 1, oz + 1, 'village']); }
  else S.set(ox + 3, base + 1, oz + 1, B.TABLE);
}

function farm(S, w, ox, oz) {
  const base = Math.max(w.biomeAt(ox + 2, oz + 2).h, SEA);
  footprint(S, w, ox, oz, 5, 5, base);
  for (let x = ox; x <= ox + 4; x++) for (let z = oz; z <= oz + 4; z++) {
    const edge = x === ox || x === ox + 4 || z === oz || z === oz + 4;
    if (edge) { S.set(x, base, z, B.LOG); continue; }
    if (x === ox + 2) { S.set(x, base, z, B.WATER); continue; }
    S.set(x, base, z, B.FARMLAND);
    S.set(x, base + 1, z, B.WHEAT_CROP, (x * 7 + z * 3) & 7);
  }
}

// ------------------------------------------------------------------ stronghold (the End portal room)
export function strongholdPos(w) {
  const a = hash3(1, 2, 3, w.seed) * Math.PI * 2;
  const d = 260 + hash3(4, 5, 6, w.seed) * 180;
  return [Math.floor(Math.cos(a) * d / CS) * CS + 8, 24, Math.floor(Math.sin(a) * d / CS) * CS + 8];
}
function stronghold(w) {
  if (w.structCache.has('sh')) return w.structCache.get('sh');
  const [cx, y, cz] = strongholdPos(w);
  const S = new Builder();
  const x0 = cx - 8, z0 = cz - 8;
  S.box(x0, y - 1, z0, x0 + 15, y + 8, z0 + 15, B.STONE_BRICK);
  S.box(x0 + 1, y, z0 + 1, x0 + 14, y + 7, z0 + 14, B.AIR);
  // 12 frames round a 3x3 lava pool
  const fx = x0 + 5, fz = z0 + 5;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const ring = i === 0 || i === 4 || j === 0 || j === 4;
    const corner = (i === 0 || i === 4) && (j === 0 || j === 4);
    if (ring && !corner) S.set(fx + i, y, fz + j, B.END_FRAME, hash3(fx + i, y, fz + j, w.seed) < 0.1 ? 1 : 0);
    else if (!ring) S.set(fx + i, y - 1, fz + j, B.LAVA);
  }
  S.box(x0 + 5, y + 1, z0 + 12, x0 + 9, y + 1, z0 + 12, B.STAIRS_COBBLE, 2);
  for (const [dx, dz] of [[1, 1], [14, 1], [1, 14], [14, 14]]) S.set(x0 + dx, y, z0 + dz, B.TORCH);
  S.set(x0 + 2, y, z0 + 13, B.CHEST); S.loot.push([x0 + 2, y, z0 + 13, 'stronghold']);
  S.set(x0 + 3, y, z0 + 13, B.BOOKSHELF); S.set(x0 + 4, y, z0 + 13, B.BOOKSHELF);
  w.structCache.set('sh', S);
  return S;
}

// ------------------------------------------------------------------ chest loot
const LOOT = {
  dungeon: [[I.BREAD, 1, 3], [I.WHEAT, 1, 4], [I.IRON, 1, 4], [I.GOLD, 1, 3], [I.STRING, 1, 4], [I.BONE, 1, 6], [I.GUNPOWDER, 1, 4], [I.APPLE, 1, 3], [I.BUCKET, 1, 1], [I.DIAMOND, 1, 2, 0.15], [I.SEEDS, 2, 5], [I.ENDER_PEARL, 1, 2, 0.4]],
  village: [[I.BREAD, 1, 4], [I.APPLE, 1, 3], [I.IRON, 1, 3], [I.WHEAT, 2, 6], [I.EMERALD, 1, 2], [B.SAPLING, 1, 3], [I.SEEDS, 2, 6], [toolId(2, 'pickaxe'), 1, 1, 0.2]],
  fortress: [[I.GOLD, 1, 3], [I.IRON, 1, 5], [I.DIAMOND, 1, 3, 0.3], [B.OBSIDIAN, 2, 4], [I.WART, 3, 7], [I.FLINT_STEEL, 1, 1, 0.4], [I.BLAZE_ROD, 1, 3]],
  mansion: [[I.DIAMOND, 1, 2, 0.3], [I.GOLD, 1, 4], [I.IRON, 1, 4], [I.REDSTONE, 4, 9], [I.LAPIS, 4, 9], [I.EMERALD, 1, 3], [I.BREAD, 1, 3], [I.BOOK, 1, 3]],
  endcity: [[I.DIAMOND, 2, 7, 0.5], [I.IRON, 4, 8], [I.GOLD, 2, 7], [I.EMERALD, 2, 6], [toolId(3, 'pickaxe'), 1, 1, 0.3]],
  stronghold: [[I.ENDER_PEARL, 1, 2], [I.BREAD, 1, 3], [I.IRON, 1, 5], [I.GOLD, 1, 3], [I.BOOK, 1, 3], [I.APPLE, 1, 3], [I.DIAMOND, 1, 3, 0.3], [I.EYE_OF_ENDER, 1, 2, 0.4], [I.BLAZE_POWDER, 1, 2, 0.4]],
};
function addChest(w, c, lx, y, lz, table) {
  c.blocks[idx(lx, y, lz)] = B.CHEST;
  fillLoot(w, c.cx * CS + lx, y, c.cz * CS + lz, table);
}
function fillLoot(w, x, y, z, table) {
  const k = `${x},${y},${z}`;
  if (w.extra.has(k)) return;
  const rnd = mulberry32((x * 73856093) ^ (y * 19349663) ^ (z * 83492791) ^ w.seed);
  const slots = Array(27).fill(null);
  const n = 3 + Math.floor(rnd() * 5);
  for (let i = 0; i < n; i++) {
    const [id, lo, hi, p = 1] = LOOT[table][Math.floor(rnd() * LOOT[table].length)];
    if (rnd() > p) continue;
    slots[Math.floor(rnd() * 27)] = { id, count: lo + Math.floor(rnd() * (hi - lo + 1)) };
  }
  if (table === 'endcity') slots[13] = { id: I.ELYTRA, count: 1, dmg: 0 };
  w.extra.set(k, { type: 'chest', slots });
}

// ------------------------------------------------------------------ nether
function genNether(w, c) {
  const n = w.noise, seed = w.seed;
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const wx = c.cx * CS + lx, wz = c.cz * CS + lz;
    const soul = n.n2(wx / 30, wz / 30) > 0.45;
    for (let y = 0; y < CH; y++) {
      let id = B.AIR;
      if (y === 0 || y === CH - 1 || (y <= 3 && hash3(wx, y, wz, seed) < 0.5) || (y >= CH - 4 && hash3(wx, y, wz, seed) < 0.5)) id = B.BEDROCK;
      else {
        let d = n.n3(wx / 48, y / 30, wz / 48) + n.n3(wx / 16, y / 14, wz / 16) * 0.35 - 0.15;
        if (y < 30) d += (30 - y) / 14;
        if (y > 100) d += (y - 100) / 9;
        if (d > 0) {
          id = B.NETHERRACK;
          const r = hash3(wx, y, wz, seed + 5);
          if (r < 0.012) id = B.QUARTZ_ORE;
          else if (soul && y < 40 && y > 28) id = B.SOUL_SAND;
        } else if (y <= 31) id = B.LAVA;
      }
      if (id) c.blocks[idx(lx, y, lz)] = id;
    }
    // glowstone hanging from the roof
    for (let y = CH - 5; y > 60; y--) {
      const i = idx(lx, y, lz);
      if (c.blocks[i] === B.NETHERRACK && c.blocks[idx(lx, y - 1, lz)] === B.AIR && hash3(wx, y, wz, seed + 9) < 0.03) {
        for (let k = 1; k <= 3; k++) if (c.blocks[idx(lx, y - k, lz)] === B.AIR) c.blocks[idx(lx, y - k, lz)] = B.GLOWSTONE;
        break;
      }
    }
  }
  const spawns = [];
  const R = 256;
  for (let rx = Math.floor((c.cx * CS - 60) / R); rx <= Math.floor((c.cx * CS + 76) / R); rx++)
    for (let rz = Math.floor((c.cz * CS - 60) / R); rz <= Math.floor((c.cz * CS + 76) / R); rz++) {
      const f = cached(w, 'nf' + rx + ',' + rz, () => fortress(w, rx, rz, R));
      if (f) applyBucket(w, c, f, spawns);
    }
  return spawns;
}

function fortress(w, rx, rz, R) {
  if (hash3(rx, 121, rz, w.seed) > 0.6) return null;
  const cx = rx * R + 64 + Math.floor(hash3(rx, 122, rz, w.seed) * (R - 128)), cz = rz * R + 64 + Math.floor(hash3(rx, 123, rz, w.seed) * (R - 128));
  const y = 64;
  const S = new Builder();
  const NB = B.NETHER_BRICK;
  // bridges in a cross, with walls and pillars down into the lava
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (let r = 6; r <= 44; r++) for (let p = -2; p <= 2; p++) {
      const x = cx + dx * r + (dz ? p : 0), z = cz + dz * r + (dx ? p : 0);
      S.set(x, y, z, NB);
      S.box(x, y + 1, z, x, y + 5, z, B.AIR);
      if (Math.abs(p) === 2) S.set(x, y + 1, z, NB);
      if (r % 8 === 0 && Math.abs(p) === 2) S.box(x, 20, z, x, y - 1, z, NB);
    }
    // a small room at each end
    const ex = cx + dx * 48, ez = cz + dz * 48;
    S.box(ex - 4, y, ez - 4, ex + 4, y + 6, ez + 4, NB);
    S.box(ex - 3, y + 1, ez - 3, ex + 3, y + 5, ez + 3, B.AIR);
    S.box(ex - dx * 4 + (dz ? -1 : 0), y + 1, ez - dz * 4 + (dx ? -1 : 0), ex - dx * 4 + (dz ? 1 : 0), y + 3, ez - dz * 4 + (dx ? 1 : 0), B.AIR);
  }
  // the centre room with nether wart
  S.box(cx - 6, y, cz - 6, cx + 6, y + 7, cz + 6, NB);
  S.box(cx - 5, y + 1, cz - 5, cx + 5, y + 6, cz + 5, B.AIR);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) S.box(cx + dx * 6 - (dz ? 1 : 0), y + 1, cz + dz * 6 - (dx ? 1 : 0), cx + dx * 6 + (dz ? 1 : 0), y + 3, cz + dz * 6 + (dx ? 1 : 0), B.AIR);
  for (let x = cx - 4; x <= cx + 4; x++) for (const z of [cz - 4, cz - 3, cz + 3, cz + 4]) { S.set(x, y, z, B.SOUL_SAND); S.set(x, y + 1, z, B.NETHER_WART, (x + z) & 3); }
  S.set(cx, y + 1, cz, B.CHEST); S.loot.push([cx, y + 1, cz, 'fortress']);
  S.center = [cx, y, cz];
  return S;
}

// ------------------------------------------------------------------ the End
export const END_PILLARS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { x: Math.round(Math.cos(a) * 42), z: Math.round(Math.sin(a) * 42), h: 76 + ((i * 7) % 5) * 5 };
});
function genEnd(w, c) {
  const n = w.noise;
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const wx = c.cx * CS + lx, wz = c.cz * CS + lz;
    const r = Math.hypot(wx, wz);
    if (r < 96) {
      const top = Math.round(62 + n.n2(wx / 30, wz / 30) * 3 - Math.max(0, r - 76) * 0.4);
      const bottom = Math.round(62 - (96 - r) * 0.4 - 4 + n.n2(wx / 12, wz / 12) * 3);
      for (let y = Math.max(1, bottom); y <= top; y++) c.blocks[idx(lx, y, lz)] = B.END_STONE;
    }
    for (const p of END_PILLARS) {
      if (Math.hypot(wx - p.x, wz - p.z) <= 3.2) for (let y = 50; y <= p.h; y++) c.blocks[idx(lx, y, lz)] = B.OBSIDIAN;
    }
    // arrival platform
    if (wx >= 98 && wx <= 102 && wz >= -2 && wz <= 2) c.blocks[idx(lx, 48, lz)] = B.OBSIDIAN;
    // outer islands, far from the centre
    if (r > 280) {
      const d = n.n2(wx / 70, wz / 70) + n.n2(wx / 25, wz / 25) * 0.3;
      if (d > 0.3) {
        const top = Math.round(58 + (d - 0.3) * 20), bottom = Math.round(58 - (d - 0.3) * 40);
        for (let y = bottom; y <= top; y++) c.blocks[idx(lx, y, lz)] = B.END_STONE;
      }
    }
    // the gateway home from the outer islands
    if (Math.abs(wx - 1000) <= 2 && Math.abs(wz) <= 2) for (let y = 55; y <= 60; y++) c.blocks[idx(lx, y, lz)] = y === 60 ? B.END_STONE : c.blocks[idx(lx, y, lz)] || B.END_STONE;
    if (wx === 1000 && wz === 3) { c.blocks[idx(lx, 61, lz)] = B.BEDROCK; c.blocks[idx(lx, 62, lz)] = B.GATEWAY; c.blocks[idx(lx, 63, lz)] = B.BEDROCK; }
  }
  const spawns = [];
  const R = 160;
  for (let rx = Math.floor((c.cx * CS - 20) / R); rx <= Math.floor((c.cx * CS + 36) / R); rx++)
    for (let rz = Math.floor((c.cz * CS - 20) / R); rz <= Math.floor((c.cz * CS + 36) / R); rz++) {
      const ec = cached(w, 'ec' + rx + ',' + rz, () => endCity(w, rx, rz, R));
      if (ec) applyBucket(w, c, ec, spawns);
    }
  return spawns;
}

function endCity(w, rx, rz, R) {
  const cx = rx * R + 40 + Math.floor(hash3(rx, 131, rz, w.seed) * (R - 80)), cz = rz * R + 40 + Math.floor(hash3(rx, 132, rz, w.seed) * (R - 80));
  if (Math.hypot(cx, cz) < 400 || hash3(rx, 133, rz, w.seed) > 0.55) return null;
  const S = new Builder();
  const y0 = 60;
  S.box(cx - 6, y0 - 4, cz - 6, cx + 6, y0 - 1, cz + 6, B.END_STONE);
  // a tower with floors, a ladder, and a treasure room on top
  const H = 22;
  for (let y = y0; y <= y0 + H; y++) for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    const edge = Math.abs(x) === 4 || Math.abs(z) === 4;
    const floor = (y - y0) % 7 === 0;
    S.set(cx + x, y, cz + z, edge || floor ? B.PURPUR : B.AIR);
  }
  for (let y = y0 + 1; y <= y0 + H; y++) S.set(cx + 3, y, cz, B.LADDER, 1);
  for (let y = y0 + 7; y <= y0 + H; y += 7) S.set(cx + 3, y, cz, B.LADDER, 1);
  S.set(cx, y0 + 1, cz + 4, B.AIR); S.set(cx, y0 + 2, cz + 4, B.AIR);
  const top = y0 + H;
  S.box(cx - 6, top, cz - 6, cx + 6, top + 5, cz + 6, B.PURPUR);
  S.box(cx - 5, top + 1, cz - 5, cx + 5, top + 4, cz + 5, B.AIR);
  S.set(cx + 3, top, cz, B.LADDER, 1);
  S.set(cx - 3, top + 1, cz, B.CHEST); S.loot.push([cx - 3, top + 1, cz, 'endcity']);
  S.set(cx, top + 1, cz - 4, B.GLOWSTONE); S.set(cx, top + 1, cz + 4, B.GLOWSTONE);
  S.center = [cx, y0, cz];
  return S;
}

// the exit portal home, built the first time the player reaches the End
export function buildExitPortal(w) {
  const y = 62;
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
    const d = Math.hypot(x, z);
    if (d > 3.5) continue;
    w.setBlock(x, y, z, B.BEDROCK);
    if (d < 2.6 && !(x === 0 && z === 0)) w.setBlock(x, y + 1, z, B.END_PORTAL);
    else if (d >= 2.6) w.setBlock(x, y + 1, z, B.BEDROCK);
  }
  for (let k = 1; k <= 4; k++) w.setBlock(0, y + k, 0, B.BEDROCK);
  w.setBlock(0, y + 5, 0, B.DRAGON_EGG);
  w.setBlock(0, 74, -80, B.BEDROCK); w.setBlock(0, 75, -80, B.GATEWAY); w.setBlock(0, 76, -80, B.BEDROCK);
}
void BLOCKS;
