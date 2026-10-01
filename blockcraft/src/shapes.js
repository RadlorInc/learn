// Non-cube block geometry: boxes in block-local 0..1 coordinates, for rendering, collision and raycasts.
// Facing index: 0 = -z (north), 1 = +x (east), 2 = +z (south), 3 = -x (west).
import { B, BLOCKS, T } from './blocks.js';

export const DIR4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function plate(f, th) {
  if (f === 0) return [0, 0, 0, 1, 1, th];
  if (f === 2) return [0, 0, 1 - th, 1, 1, 1];
  if (f === 1) return [1 - th, 0, 0, 1, 1, 1];
  return [0, 0, 0, th, 1, 1];
}
const one = (b, t) => [{ b, t }];
void B;

// Returns { render: [{b, t?}], collide: [box] } or null for a plain cube.
export function shapeOf(id, meta, world, x, y, z) {
  const blk = BLOCKS[id];
  switch (blk?.shape) {
    case 'slab': { const b = meta & 1 ? [0, 0.5, 0, 1, 1, 1] : [0, 0, 0, 1, 0.5, 1]; return { render: one(b), collide: [b] }; }
    case 'stairs': {
      const f = meta & 3;
      const hi = [[0, 0.5, 0, 1, 1, 0.5], [0.5, 0.5, 0, 1, 1, 1], [0, 0.5, 0.5, 1, 1, 1], [0, 0.5, 0, 0.5, 1, 1]][f];
      const lo = [0, 0, 0, 1, 0.5, 1];
      return { render: [{ b: lo }, { b: hi }], collide: [lo, hi] };
    }
    case 'door': {
      const f = meta & 3, open = meta & 4, top = meta & 8;
      const b = plate(open ? (f + 1) % 4 : f, 0.1875);
      const t = top ? T.door_top : T.door_bottom;
      return { render: [{ b, t: { top: t, side: t, bottom: t } }], collide: [b] };
    }
    case 'ladder': return { render: one(plate(meta & 3, 0.0625)), collide: [] };
    case 'fence': {
      const r = [{ b: [0.375, 0, 0.375, 0.625, 1, 0.625] }];
      const c = [[0.375, 0, 0.375, 0.625, 1.5, 0.625]];
      if (world) {
        DIR4.forEach(([dx, dz], f) => {
          const n = world.getBlock(x + dx, y, z + dz);
          if (n !== B.FENCE && !(BLOCKS[n]?.opaque)) return;
          const arm = (y0, y1) => (f === 0 ? [0.4375, y0, 0, 0.5625, y1, 0.375] : f === 2 ? [0.4375, y0, 0.625, 0.5625, y1, 1]
            : f === 1 ? [0.625, y0, 0.4375, 1, y1, 0.5625] : [0, y0, 0.4375, 0.375, y1, 0.5625]);
          r.push({ b: arm(0.375, 0.5625) }, { b: arm(0.75, 0.9375) });
          const a = arm(0, 1.5); c.push(a);
        });
      }
      return { render: r, collide: c };
    }
    case 'farmland': { const b = [0, 0, 0, 1, 0.9375, 1]; return { render: one(b), collide: [b] }; }
    case 'bed': { const b = [0, 0, 0, 1, 0.5625, 1]; return { render: one(b), collide: [b] }; }
    case 'enchant': { const b = [0, 0, 0, 1, 0.75, 1]; return { render: one(b), collide: [b] }; }
    case 'cactus': { const b = [0.0625, 0, 0.0625, 0.9375, 1, 0.9375]; return { render: one(b), collide: [b] }; }
    case 'endportal': return { render: one([0, 0, 0, 1, 0.75, 1]), collide: [] };
    case 'portal': return { render: one(meta & 1 ? [0.375, 0, 0, 0.625, 1, 1] : [0, 0, 0.375, 1, 1, 0.625]), collide: [] };
    case 'frame': {
      const base = [0, 0, 0, 1, 0.8125, 1];
      const r = [{ b: base }];
      if (meta & 1) { const e = T.frame_eye; r.push({ b: [0.25, 0.8125, 0.25, 0.75, 1, 0.75], t: { top: e, side: e, bottom: e } }); }
      return { render: r, collide: [base] };
    }
    case 'rail': return { render: one([0, 0, 0, 1, 0.0625, 1], railTex(meta)), collide: [] };
    case 'wire': return { render: one([0, 0, 0, 1, 0.03, 1]), collide: [] };
    case 'plate': { const b = meta & 1 ? [0.0625, 0, 0.0625, 0.9375, 0.03, 0.9375] : [0.0625, 0, 0.0625, 0.9375, 0.0625, 0.9375]; return { render: one(b), collide: [] }; }
    case 'button': { const b = meta & 1 ? [0.3125, 0, 0.375, 0.6875, 0.0625, 0.625] : [0.3125, 0, 0.375, 0.6875, 0.125, 0.625]; return { render: one(b), collide: [] }; }
    case 'lever': {
      const on = meta & 1, st = { top: T.cobble, side: T.cobble, bottom: T.cobble }, wood = { top: T.log_side, side: T.log_side, bottom: T.log_side };
      const handle = on ? [0.44, 0.1, 0.25, 0.56, 0.7, 0.4] : [0.44, 0.1, 0.6, 0.56, 0.7, 0.75];
      return { render: [{ b: [0.25, 0, 0.3, 0.75, 0.12, 0.7], t: st }, { b: handle, t: wood }], collide: [] };
    }
    case 'anvil': {
      const t = { top: T.anvil_side, side: T.anvil_side, bottom: T.anvil_side };
      const top = [0.1875, 0.625, 0, 0.8125, 1, 1];
      return { render: [{ b: [0.125, 0, 0.125, 0.875, 0.25, 0.875], t }, { b: [0.3125, 0.25, 0.25, 0.6875, 0.625, 0.75], t }, { b: top }], collide: [[0.125, 0, 0, 0.875, 1, 1]] };
    }
    case 'brewing': {
      const t = { top: T.cobble, side: T.cobble, bottom: T.cobble }, rod = { top: T.gold_block, side: T.gold_block, bottom: T.gold_block };
      return { render: [{ b: [0.0625, 0, 0.0625, 0.9375, 0.125, 0.9375], t }, { b: [0.4375, 0.125, 0.4375, 0.5625, 0.875, 0.5625], t: rod }], collide: [[0.0625, 0, 0.0625, 0.9375, 0.875, 0.9375]] };
    }
    case 'piston': {
      const f = meta & 7, ext = meta & 8;
      const faces = pistonFaces(f, ext ? T.piston_inner : T.piston_top);
      const b = ext ? cut(f, 0.75) : [0, 0, 0, 1, 1, 1];
      return { render: [{ b, t: { faces } }], collide: [b] };
    }
    case 'pistonhead': {
      const f = meta & 7;
      const plateB = plate6(f, 0.25), rod = rod6(f);
      const faces = pistonFaces(f, T.piston_top);
      return { render: [{ b: plateB, t: { faces } }, { b: rod, t: { top: T.planks, side: T.planks, bottom: T.planks } }], collide: [plateB, rod] };
    }
    default: return null;
  }
}

// rails: meta 0 = along z, 1 = along x (texture rotated by using a sideways tile)
function railTex(meta) { return meta & 1 ? { top: T.rail_x, side: T.rail_x, bottom: T.rail_x } : undefined; }
// six-way facing: 0 down, 1 up, 2 north (-z), 3 south (+z), 4 west (-x), 5 east (+x)
export const DIR6 = [[0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0]];
const FACE_OF = [2, 3, 4, 5, 0, 1]; // facing -> mesher face index
function pistonFaces(f, front) {
  const faces = Array(6).fill(T.piston_side);
  faces[FACE_OF[f]] = front;
  faces[FACE_OF[f ^ 1]] = T.piston_bottom;
  return faces;
}
// the part of a unit cube left after cutting `keep` of it towards facing f
function cut(f, keep) {
  const b = [0, 0, 0, 1, 1, 1], ax = [1, 1, 2, 2, 0, 0][f], neg = f % 2 === 0;
  if (neg) b[ax] = 1 - keep; else b[ax + 3] = keep;
  return b;
}
function plate6(f, th) {
  const b = [0, 0, 0, 1, 1, 1], ax = [1, 1, 2, 2, 0, 0][f], neg = f % 2 === 0;
  if (neg) b[ax + 3] = th; else b[ax] = 1 - th;
  return b;
}
function rod6(f) {
  const ax = [1, 1, 2, 2, 0, 0][f], neg = f % 2 === 0;
  const b = [0.375, 0.375, 0.375, 0.625, 0.625, 0.625];
  if (neg) { b[ax] = 0.25; b[ax + 3] = 1; } else { b[ax] = 0; b[ax + 3] = 0.75; }
  return b;
}

// Box used to target a block with the crosshair.
export function pickBoxes(id, meta, world, x, y, z) {
  const b = BLOCKS[id];
  if (b.cross) return [[0.15, 0, 0.15, 0.85, 0.8, 0.85]];
  const s = shapeOf(id, meta, world, x, y, z);
  return s ? s.render.map((r) => r.b) : null;
}
