// Blocks, items, the procedurally painted texture atlas, and inventory icons.
// All art is generated here — no external textures.
import { mulberry32 } from './noise.js';

export const TILE = 16;
export const ATLAS_COLS = 16;

// ---------------------------------------------------------------- tiles
const TILES = [
  'grass_top', 'grass_side', 'dirt', 'stone', 'cobble', 'sand', 'log_side', 'log_top',
  'planks', 'leaves', 'glass', 'water', 'coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore',
  'bedrock', 'snow', 'snow_side', 'gravel', 'brick', 'table_top', 'table_side', 'table_front',
  'cactus_side', 'cactus_top', 'sandstone', 'sandstone_top', 'flower_red', 'flower_yellow', 'tallgrass', 'spruce_leaves',
  'spruce_log', 'spruce_top', 'torch', 'furnace_front', 'furnace_side', 'furnace_top', 'wool', 'ice',
  'chest_front', 'chest_side', 'chest_top', 'bookshelf', 'mossy', 'clay', 'pumpkin_side', 'pumpkin_top',
  'bed_top', 'bed_side',
  'lava', 'obsidian', 'door_bottom', 'door_top', 'ladder', 'farmland', 'wheat0', 'wheat1', 'wheat2', 'wheat3',
  'sapling', 'spruce_sapling', 'sugar_cane', 'netherrack', 'soul_sand', 'glowstone',
  'quartz_ore', 'nether_brick', 'portal', 'end_stone', 'frame_side', 'frame_top', 'frame_eye', 'end_portal',
  'stone_brick', 'enchant_top', 'enchant_side', 'lapis_ore', 'emerald_ore', 'iron_block', 'gold_block', 'diamond_block',
  'dragon_egg', 'fence',
  'rail', 'redstone_dust', 'redstone_torch', 'redstone_torch_off', 'lever', 'lamp_off', 'lamp_on', 'piston_side',
  'piston_top', 'piston_bottom', 'piston_inner', 'redstone_block', 'redstone_ore', 'anvil_top', 'anvil_side', 'brewing',
  'wart0', 'wart1', 'prismarine', 'dark_prismarine', 'sea_lantern', 'dark_log', 'dark_log_top', 'dark_planks',
  'purpur', 'melon_side', 'melon_top', 'cobweb', 'gateway', 'rail_x',
  'crack0', 'crack1', 'crack2', 'crack3', 'crack4', 'crack5', 'crack6', 'crack7', 'crack8', 'crack9',
];
export const T = Object.fromEntries(TILES.map((n, i) => [n, i]));

const clamp = (v) => Math.max(0, Math.min(255, v | 0));

function paintTiles() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = TILE * ATLAS_COLS;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(cv.width, cv.height);

  for (const name of TILES) {
    const i = T[name];
    const ox = (i % ATLAS_COLS) * TILE, oy = Math.floor(i / ATLAS_COLS) * TILE;
    const rnd = mulberry32(i * 9973 + 17);
    const paint = PAINTERS[name] || PAINTERS.missing;
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const c = paint(x, y, rnd);
      const o = ((oy + y) * cv.width + ox + x) * 4;
      img.data[o] = clamp(c[0]); img.data[o + 1] = clamp(c[1]); img.data[o + 2] = clamp(c[2]);
      img.data[o + 3] = c.length > 3 ? clamp(c[3]) : 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

const vary = (rgb, r, amt) => { const d = (r() - 0.5) * amt; return [rgb[0] + d, rgb[1] + d, rgb[2] + d]; };
const noisy = (rgb, amt) => (x, y, r) => vary(rgb, r, amt);
const stoneC = (x, y, r) => { const v = r(); return vary(v < 0.12 ? [100, 100, 100] : v > 0.9 ? [150, 150, 150] : [125, 125, 125], r, 18); };
const ore = (col) => {
  // deterministic blobs per tile
  const spots = [[3, 3], [10, 4], [5, 10], [12, 11], [8, 7]];
  return (x, y, r) => {
    for (const [sx, sy] of spots) {
      const d = Math.abs(x - sx) + Math.abs(y - sy);
      if (d <= 1 && r() > 0.15) return vary(col, r, 40);
    }
    return stoneC(x, y, r);
  };
};
const plank = (base) => (x, y, r) => {
  const row = y % 4;
  if (row === 3) return vary([base[0] * 0.6, base[1] * 0.6, base[2] * 0.6], r, 10);
  const seam = ((Math.floor(y / 4) % 2) ? 4 : 11);
  if (x === seam) return vary([base[0] * 0.7, base[1] * 0.7, base[2] * 0.7], r, 8);
  return vary(base, r, 16);
};
const crack = (stage) => (x, y) => {
  const r = mulberry32(777)(); void r;
  // radial crack lines, more with stage
  const rr = mulberry32(4242);
  const pts = new Set();
  const lines = 2 + stage;
  for (let l = 0; l < lines; l++) {
    let px = 8, py = 8; const ang = rr() * Math.PI * 2;
    const len = 2 + stage * 0.9;
    for (let s = 0; s < len; s++) {
      px += Math.cos(ang + (rr() - 0.5)) * 1.2; py += Math.sin(ang + (rr() - 0.5)) * 1.2;
      pts.add((Math.round(px) & 15) + ',' + (Math.round(py) & 15));
    }
  }
  return pts.has(x + ',' + y) ? [20, 20, 20, 200] : [0, 0, 0, 0];
};

const PAINTERS = {
  missing: (x, y) => ((x >> 2) + (y >> 2)) % 2 ? [255, 0, 255] : [0, 0, 0],
  grass_top: noisy([95, 159, 53], 40),
  dirt: (x, y, r) => { const v = r(); return vary(v < 0.1 ? [105, 75, 50] : v > 0.9 ? [150, 110, 80] : [134, 96, 67], r, 20); },
  grass_side: (x, y, r) => {
    const edge = 3 + ((x * 7) % 3 === 0 ? 1 : 0) + (x % 5 === 0 ? -1 : 0);
    if (y < edge) return vary([95, 159, 53], r, 36);
    return PAINTERS.dirt(x, y, r);
  },
  stone: stoneC,
  cobble: (x, y, r) => {
    const cx = (x + (Math.floor(y / 5) % 2) * 3) % 6, cy = y % 5;
    if (cx === 0 || cy === 0) return vary([80, 80, 80], r, 14);
    return vary(cy < 2 ? [150, 150, 150] : [118, 118, 118], r, 22);
  },
  sand: noisy([219, 207, 163], 22),
  gravel: (x, y, r) => { const v = r(); return vary(v < 0.3 ? [110, 100, 100] : v > 0.75 ? [160, 150, 150] : [135, 128, 126], r, 20); },
  log_side: (x, y, r) => vary((x % 4 === 0) ? [80, 60, 35] : [106, 82, 48], r, 16),
  log_top: (x, y, r) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 6.5) return vary([106, 82, 48], r, 14);
    return vary(Math.floor(d) % 2 ? [150, 118, 70] : [180, 145, 90], r, 12);
  },
  spruce_log: (x, y, r) => vary((x % 3 === 0) ? [45, 30, 15] : [60, 42, 22], r, 12),
  spruce_top: (x, y, r) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 6.5) return vary([60, 42, 22], r, 12);
    return vary(Math.floor(d) % 2 ? [110, 80, 45] : [135, 100, 60], r, 12);
  },
  planks: plank([162, 130, 78]),
  leaves: (x, y, r) => { const v = r(); return v < 0.18 ? [0, 0, 0, 0] : vary(v > 0.8 ? [70, 130, 40] : [55, 110, 30], r, 30); },
  spruce_leaves: (x, y, r) => { const v = r(); return v < 0.15 ? [0, 0, 0, 0] : vary([45, 85, 50], r, 26); },
  glass: (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [200, 230, 240, 255];
    if ((x === y || x === y + 1) && x > 2 && x < 8) return [255, 255, 255, 200];
    return [0, 0, 0, 0];
  },
  water: (x, y, r) => { const c = vary([45, 90, 210], r, 20); c.push(180); return c; },
  ice: (x, y, r) => { const c = vary([150, 190, 250], r, 16); c.push(210); return c; },
  coal_ore: ore([30, 30, 30]),
  iron_ore: ore([216, 175, 147]),
  gold_ore: ore([250, 220, 60]),
  diamond_ore: ore([90, 230, 225]),
  bedrock: (x, y, r) => { const v = r(); return vary(v < 0.4 ? [40, 40, 40] : v > 0.8 ? [120, 120, 120] : [80, 80, 80], r, 20); },
  snow: noisy([240, 248, 250], 10),
  snow_side: (x, y, r) => (y < 4 + (x % 3 === 0 ? 1 : 0)) ? vary([240, 248, 250], r, 10) : PAINTERS.dirt(x, y, r),
  brick: (x, y, r) => {
    const off = (Math.floor(y / 4) % 2) * 4;
    if (y % 4 === 3 || (x + off) % 8 === 7) return vary([170, 165, 160], r, 10);
    return vary([150, 70, 55], r, 22);
  },
  table_top: (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15 || x === 7 || y === 7) ? vary([100, 70, 40], r, 10) : plank([175, 140, 85])(x, y, r),
  table_side: (x, y, r) => y < 3 ? vary([100, 70, 40], r, 10) : ((x > 2 && x < 6 && y > 5 && y < 13) ? vary([140, 140, 140], r, 12) : plank([162, 130, 78])(x, y, r)),
  table_front: (x, y, r) => y < 3 ? vary([100, 70, 40], r, 10) : ((x > 9 && x < 13 && y > 5 && y < 13) ? vary([120, 90, 60], r, 12) : plank([162, 130, 78])(x, y, r)),
  cactus_side: (x, y, r) => (x === 0 || x === 15) ? [0, 0, 0, 0] : ((x % 4 === 1 && y % 4 === 2) ? [230, 230, 200] : vary([30, 120, 40], r, 24)),
  cactus_top: (x, y, r) => (x === 0 || x === 15 || y === 0 || y === 15) ? [0, 0, 0, 0] : vary([60, 150, 60], r, 20),
  sandstone: (x, y, r) => vary(y % 5 === 4 ? [190, 175, 130] : [215, 200, 155], r, 12),
  sandstone_top: noisy([220, 205, 160], 14),
  flower_red: (x, y, r) => {
    if (y > 7 && x === 7) return [40, 120, 30];
    if (y > 10 && (x === 6 || x === 8) && y % 2) return [50, 140, 40];
    if (y >= 3 && y <= 7 && x >= 5 && x <= 9 && Math.abs(x - 7) + Math.abs(y - 5) <= 3) return (x === 7 && y === 5) ? [255, 220, 60] : vary([220, 30, 40], r, 20);
    return [0, 0, 0, 0];
  },
  flower_yellow: (x, y, r) => {
    if (y > 7 && x === 7) return [40, 120, 30];
    if (y >= 4 && y <= 7 && x >= 5 && x <= 9 && Math.abs(x - 7) + Math.abs(y - 5.5) <= 2.5) return vary([250, 220, 40], r, 20);
    return [0, 0, 0, 0];
  },
  tallgrass: (x, y, r) => {
    const h = [9, 5, 11, 3, 8, 6, 10, 4, 7, 12, 5, 9, 6, 10, 4, 8][x];
    return (y > h && (x % 2 === 0 || r() > 0.4)) ? vary([80, 150, 45], r, 36) : [0, 0, 0, 0];
  },
  torch: (x, y) => {
    if (x < 7 || x > 8) return [0, 0, 0, 0];
    if (y < 6) return y < 4 ? [255, 230, 90] : [255, 150, 30];
    if (y < 16) return [110, 80, 45];
    return [0, 0, 0, 0];
  },
  furnace_side: (x, y, r) => PAINTERS.cobble(x, y, r),
  furnace_top: (x, y, r) => vary([110, 110, 110], r, 20),
  furnace_front: (x, y, r) => (x > 3 && x < 12 && y > 8 && y < 14) ? vary([30, 25, 25], r, 10) : ((y === 3 || y === 4) && x > 2 && x < 13 ? [70, 70, 70] : PAINTERS.cobble(x, y, r)),
  wool: noisy([235, 235, 235], 14),
  chest_side: (x, y, r) => (x === 0 || x === 15 || y === 0 || y === 15 || y === 5) ? vary([70, 45, 20], r, 10) : vary([160, 110, 50], r, 18),
  chest_front: (x, y, r) => (x >= 7 && x <= 8 && y >= 4 && y <= 7) ? [200, 200, 200] : PAINTERS.chest_side(x, y, r),
  chest_top: (x, y, r) => (x === 0 || x === 15 || y === 0 || y === 15) ? vary([70, 45, 20], r, 10) : vary([160, 110, 50], r, 18),
  bookshelf: (x, y, r) => {
    if (y < 2 || y > 13 || y === 7 || y === 8) return plank([162, 130, 78])(x, y, r);
    const cols = [[160, 40, 40], [40, 80, 160], [60, 130, 60], [170, 140, 60]];
    return vary(cols[Math.floor(x / 2) % 4], r, 20);
  },
  mossy: (x, y, r) => r() < 0.35 ? vary([70, 110, 60], r, 20) : PAINTERS.cobble(x, y, r),
  clay: noisy([160, 165, 178], 12),
  pumpkin_side: (x, y, r) => vary(x % 4 === 0 ? [190, 110, 20] : [225, 140, 30], r, 16),
  bed_top: (x, y, r) => (y < 5 ? vary([235, 235, 235], r, 10) : (x === 0 || x === 15) ? vary([150, 30, 30], r, 10) : vary([190, 40, 40], r, 16)),
  bed_side: (x, y, r) => (y < 7 ? [0, 0, 0, 0] : y < 11 ? (x < 5 ? vary([235, 235, 235], r, 10) : vary([190, 40, 40], r, 16)) : ((x < 3 || x > 12) ? plank([162, 130, 78])(x, y, r) : [0, 0, 0, 0])),
  lava: (x, y, r) => { const v = r(); return vary(v < 0.2 ? [255, 200, 60] : v > 0.85 ? [180, 50, 10] : [230, 110, 20], r, 30); },
  obsidian: (x, y, r) => { const v = r(); return vary(v > 0.9 ? [70, 50, 100] : [20, 15, 32], r, 12); },
  door_bottom: (x, y, r) => (x < 2 || x > 13 || y > 13 || y === 7) ? vary([120, 90, 50], r, 10) : (x === 12 && y === 2 ? [40, 40, 40] : plank([165, 132, 80])(x, y, r)),
  door_top: (x, y, r) => (x < 2 || x > 13 || y < 2 || x === 7 || x === 8 || y === 7) ? vary([120, 90, 50], r, 10) : (y < 13 ? [0, 0, 0, 0] : plank([165, 132, 80])(x, y, r)),
  ladder: (x, y, r) => (x === 2 || x === 3 || x === 12 || x === 13 || (y % 4 === 1 && x > 1 && x < 14)) ? vary([130, 95, 50], r, 16) : [0, 0, 0, 0],
  farmland: (x, y, r) => vary(y % 4 === 0 ? [70, 45, 25] : [105, 70, 40], r, 16),
  wheat0: (x, y, r) => (y > 11 && x % 3 === 1) ? vary([60, 170, 40], r, 30) : [0, 0, 0, 0],
  wheat1: (x, y, r) => (y > 7 && x % 3 === 1) ? vary([70, 160, 40], r, 30) : [0, 0, 0, 0],
  wheat2: (x, y, r) => (y > 4 && x % 3 === 1) ? vary(y < 8 ? [150, 170, 50] : [90, 150, 40], r, 30) : [0, 0, 0, 0],
  wheat3: (x, y, r) => ((y > 2 && x % 3 === 1) || (y > 2 && y < 7 && x % 3 === 2)) ? vary(y < 8 ? [220, 190, 80] : [170, 150, 60], r, 30) : [0, 0, 0, 0],
  sapling: (x, y, r) => (x >= 7 && x <= 8 && y > 9) ? [100, 70, 35] : (Math.hypot(x - 7.5, y - 6) < 5 && r() > 0.25) ? vary([60, 130, 40], r, 30) : [0, 0, 0, 0],
  spruce_sapling: (x, y, r) => (x >= 7 && x <= 8 && y > 11) ? [70, 45, 25] : (Math.abs(x - 7.5) < (y - 1) / 2.2 && y < 12 && y > 1) ? vary([45, 90, 50], r, 20) : [0, 0, 0, 0],
  sugar_cane: (x, y, r) => ((x === 3 || x === 4 || x === 8 || x === 9 || x === 12) ? (y % 5 === 0 ? [140, 190, 90] : vary([110, 170, 70], r, 20)) : [0, 0, 0, 0]),
  netherrack: (x, y, r) => { const v = r(); return vary(v < 0.2 ? [90, 25, 25] : v > 0.85 ? [150, 60, 60] : [115, 40, 40], r, 20); },
  soul_sand: (x, y, r) => (((x % 6 === 2 || x % 6 === 4) && y % 7 === 3) || (y % 7 === 5 && x % 6 === 3)) ? [40, 28, 20] : vary([85, 65, 50], r, 18),
  glowstone: (x, y, r) => { const v = r(); return vary(v > 0.6 ? [255, 230, 150] : v > 0.3 ? [220, 170, 80] : [160, 110, 50], r, 20); },
  quartz_ore: (x, y, r) => ((x * 3 + y * 5) % 11 === 0 || (x * 7 + y) % 13 === 0) ? vary([235, 225, 215], r, 10) : PAINTERS.netherrack(x, y, r),
  nether_brick: (x, y, r) => { const off = (Math.floor(y / 4) % 2) * 4; return (y % 4 === 3 || (x + off) % 8 === 7) ? vary([30, 15, 18], r, 6) : vary([70, 30, 35], r, 14); },
  portal: (x, y, r) => { const v = Math.sin(x * 0.8 + y * 0.5) + Math.cos(y * 0.9 - x * 0.3); const c = vary(v > 0.5 ? [180, 90, 255] : [110, 30, 200], r, 30); c.push(190); return c; },
  end_stone: (x, y, r) => { const v = r(); return vary(v > 0.9 ? [200, 200, 150] : [225, 225, 170], r, 14); },
  frame_side: (x, y, r) => y < 4 ? vary([40, 90, 80], r, 14) : PAINTERS.end_stone(x, y, r),
  frame_top: (x, y, r) => (Math.hypot(x - 7.5, y - 7.5) < 3.5) ? [20, 40, 40] : vary([50, 110, 95], r, 14),
  frame_eye: (x, y, r) => { const d = Math.hypot(x - 7.5, y - 7.5); return d < 1.5 ? [10, 20, 10] : d < 3.5 ? vary([60, 150, 80], r, 20) : vary([50, 110, 95], r, 14); },
  end_portal: (x, y, r) => (r() > 0.93 ? vary([120, 200, 190], r, 60) : [8, 12, 18]),
  stone_brick: (x, y, r) => { const off = (Math.floor(y / 8) % 2) * 8; return (y % 8 === 7 || (x + off) % 16 === 15) ? vary([85, 85, 85], r, 8) : vary([125, 125, 125], r, 16); },
  enchant_top: (x, y, r) => (x < 2 || y < 2 || x > 13 || y > 13) ? vary([30, 20, 40], r, 10) : (Math.abs(x - 7.5) + Math.abs(y - 7.5) < 3 ? [80, 230, 220] : vary([160, 30, 40], r, 16)),
  enchant_side: (x, y, r) => y < 5 ? vary([160, 30, 40], r, 16) : PAINTERS.obsidian(x, y, r),
  lapis_ore: ore([40, 70, 200]),
  emerald_ore: ore([40, 200, 90]),
  iron_block: (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15) ? [170, 170, 170] : vary([220, 220, 220], r, 8),
  gold_block: (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15) ? [200, 150, 30] : vary([250, 215, 60], r, 10),
  diamond_block: (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15) ? [40, 170, 170] : vary([110, 235, 230], r, 10),
  dragon_egg: (x, y, r) => r() > 0.85 ? vary([120, 60, 160], r, 20) : vary([20, 10, 25], r, 8),
  fence: (x, y, r) => plank([162, 130, 78])(x, y, r),
  rail: (x, y, r) => (x === 3 || x === 4 || x === 11 || x === 12) ? vary([160, 160, 165], r, 10) : (y % 4 === 1 ? vary([110, 80, 45], r, 12) : [0, 0, 0, 0]),
  rail_x: (x, y, r) => PAINTERS.rail(y, x, r),
  redstone_dust: (x, y, r) => ((Math.abs(x - 7.5) < 2 || Math.abs(y - 7.5) < 2) && r() > 0.15) ? vary([230, 30, 20], r, 30) : [0, 0, 0, 0],
  redstone_torch: (x, y) => (x < 7 || x > 8) ? [0, 0, 0, 0] : y < 5 ? [255, 60, 40] : y < 16 ? [110, 80, 45] : [0, 0, 0, 0],
  redstone_torch_off: (x, y) => (x < 7 || x > 8) ? [0, 0, 0, 0] : y < 5 ? [90, 25, 20] : y < 16 ? [110, 80, 45] : [0, 0, 0, 0],
  lever: (x, y, r) => (y > 10 && x > 3 && x < 12) ? vary([120, 120, 120], r, 20) : (x >= 7 && x <= 8 && y > 1 && y <= 10) ? vary([120, 85, 45], r, 10) : [0, 0, 0, 0],
  lamp_off: (x, y, r) => ((x + y) % 4 === 0 || x === 0 || y === 0) ? vary([60, 40, 25], r, 10) : vary([110, 70, 40], r, 16),
  lamp_on: (x, y, r) => ((x + y) % 4 === 0 || x === 0 || y === 0) ? vary([140, 90, 40], r, 10) : vary([255, 215, 140], r, 20),
  piston_side: (x, y, r) => y < 4 ? plank([165, 132, 80])(x, y, r) : (x > 5 && x < 10 && y < 12) ? vary([160, 140, 100], r, 10) : PAINTERS.cobble(x, y, r),
  piston_top: (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15) ? vary([90, 70, 40], r, 8) : (Math.abs(x - 7.5) < 2 && Math.abs(y - 7.5) < 2 ? [150, 150, 150] : plank([175, 140, 85])(x, y, r)),
  piston_bottom: (x, y, r) => PAINTERS.cobble(x, y, r),
  piston_inner: (x, y, r) => (Math.abs(x - 7.5) < 2 && Math.abs(y - 7.5) < 2) ? [150, 150, 150] : PAINTERS.cobble(x, y, r),
  redstone_block: (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15) ? [140, 10, 10] : vary([200, 25, 20], r, 20),
  redstone_ore: ore([230, 30, 20]),
  anvil_top: (x, y, r) => (x > 2 && x < 13) ? vary([70, 70, 72], r, 10) : [0, 0, 0, 0],
  anvil_side: (x, y, r) => vary([60, 60, 62], r, 10),
  brewing: (x, y, r) => (x >= 7 && x <= 8 && y > 2) ? [200, 170, 60] : (y > 12 && x > 2 && x < 13) ? vary([90, 90, 90], r, 10) : (y > 6 && y < 12 && (x < 4 || x > 11)) ? [120, 170, 220, 200] : [0, 0, 0, 0],
  wart0: (x, y, r) => (y > 10 && x % 4 === 1) ? vary([150, 30, 40], r, 20) : [0, 0, 0, 0],
  wart1: (x, y, r) => (y > 4 && (x % 4 === 1 || (y < 8 && x % 4 === 2))) ? vary([170, 30, 45], r, 20) : [0, 0, 0, 0],
  prismarine: (x, y, r) => vary(((x * 3 + y * 7) % 11 < 5) ? [100, 170, 150] : [80, 150, 150], r, 18),
  dark_prismarine: (x, y, r) => (x % 8 === 0 || y % 8 === 0) ? vary([40, 70, 60], r, 8) : vary([55, 95, 80], r, 14),
  sea_lantern: (x, y, r) => (x % 5 === 0 || y % 5 === 0) ? vary([170, 210, 200], r, 10) : vary([225, 245, 240], r, 10),
  dark_log: (x, y, r) => vary(x % 4 === 0 ? [45, 32, 18] : [62, 45, 25], r, 10),
  dark_log_top: (x, y, r) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); return d > 6.5 ? vary([62, 45, 25], r, 10) : vary(Math.floor(d) % 2 ? [80, 58, 35] : [100, 75, 45], r, 10); },
  dark_planks: plank([70, 48, 25]),
  purpur: (x, y, r) => (x % 8 === 0 || y % 8 === 0) ? vary([140, 100, 140], r, 8) : vary([170, 125, 170], r, 14),
  melon_side: (x, y, r) => vary(x % 4 < 2 ? [100, 150, 40] : [70, 120, 30], r, 16),
  melon_top: (x, y, r) => (Math.abs(x - 7.5) < 1 && Math.abs(y - 7.5) < 1) ? [110, 90, 40] : vary([110, 155, 45], r, 14),
  cobweb: (x, y) => (x === y || x === 15 - y || x === 8 || y === 8 || (Math.abs(Math.hypot(x - 7.5, y - 7.5) - 5) < 0.5)) ? [230, 230, 230, 220] : [0, 0, 0, 0],
  gateway: (x, y, r) => (r() > 0.9 ? vary([200, 220, 120], r, 50) : [10, 8, 20]),
  pumpkin_top: (x, y, r) => (Math.abs(x - 7.5) < 1.5 && Math.abs(y - 7.5) < 1.5) ? [90, 70, 30] : vary([215, 130, 25], r, 16),
};
for (let s = 0; s < 10; s++) PAINTERS['crack' + s] = crack(s);

// ---------------------------------------------------------------- blocks
export const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLE: 4, SAND: 5, LOG: 6, PLANKS: 7, LEAVES: 8, GLASS: 9,
  WATER: 10, COAL_ORE: 11, IRON_ORE: 12, GOLD_ORE: 13, DIAMOND_ORE: 14, BEDROCK: 15, SNOW: 16,
  SNOW_GRASS: 17, GRAVEL: 18, BRICK: 19, TABLE: 20, CACTUS: 21, SANDSTONE: 22, FLOWER_RED: 23,
  FLOWER_YELLOW: 24, TALLGRASS: 25, SPRUCE_LOG: 26, SPRUCE_LEAVES: 27, TORCH: 28, FURNACE: 29,
  WOOL: 30, ICE: 31, CHEST: 32, BOOKSHELF: 33, MOSSY: 34, CLAY: 35, PUMPKIN: 36, BED: 37,
  LAVA: 38, OBSIDIAN: 39, DOOR: 40, LADDER: 41, SLAB_STONE: 42, SLAB_WOOD: 43, STAIRS_WOOD: 44,
  STAIRS_COBBLE: 45, FENCE: 46, FARMLAND: 47, WHEAT_CROP: 48, SAPLING: 49, SPRUCE_SAPLING: 50,
  SUGAR_CANE: 51, NETHERRACK: 53, SOUL_SAND: 54, GLOWSTONE: 55, QUARTZ_ORE: 56,
  NETHER_BRICK: 57, PORTAL: 58, END_STONE: 59, END_FRAME: 60, END_PORTAL: 61, STONE_BRICK: 62,
  ENCHANT_TABLE: 63, LAPIS_ORE: 64, EMERALD_ORE: 65, IRON_BLOCK: 66, GOLD_BLOCK: 67, DIAMOND_BLOCK: 68,
  DRAGON_EGG: 69, RAIL: 70, WIRE: 71, RTORCH: 72, RTORCH_OFF: 73, LEVER: 74, BUTTON: 75, PLATE: 76,
  LAMP: 77, LAMP_ON: 78, PISTON: 79, PISTON_HEAD: 80, REDSTONE_BLOCK: 81, REDSTONE_ORE: 82, ANVIL: 83, BREWING: 84,
  NETHER_WART: 85, PRISMARINE: 86, DARK_PRISMARINE: 87, SEA_LANTERN: 88, DARK_LOG: 89, DARK_PLANKS: 90, PURPUR: 91,
  MELON: 92, COBWEB: 93, GATEWAY: 94,
};

export const I = {
  STICK: 100, COAL: 101, IRON: 102, GOLD: 103, DIAMOND: 104, APPLE: 105, BEEF: 107,
  COOKED_BEEF: 110, BREAD: 111, WHEAT: 112,
  SEEDS: 140, BUCKET: 141, WATER_BUCKET: 142, LAVA_BUCKET: 143, FLINT: 144, FLINT_STEEL: 145,
  STRING: 148, BONE: 149, BONE_MEAL: 150, GUNPOWDER: 151, LEATHER: 152,
  PAPER: 153, BOOK: 154, ENDER_PEARL: 155, BLAZE_ROD: 156, BLAZE_POWDER: 157, EYE_OF_ENDER: 158,
  LAPIS: 159, EMERALD: 160, QUARTZ: 161, GLOWSTONE_DUST: 162, DOOR_ITEM: 163, SUGAR: 164,
  FEATHER: 190, EGG: 191, CHICKEN: 192, COOKED_CHICKEN: 193, ROD: 194, FISH: 195, COOKED_FISH: 196, BOAT: 197,
  MINECART: 198, MAP: 199, COMPASS: 200, BOTTLE: 201, POTION: 202, SPLASH: 203, WART: 204,
  MELON_SLICE: 211,
  NUGGET: 212, REDSTONE: 213, ELYTRA: 214, MILK: 217,
};
// tools: 120 + mat*5 + kind
export const TOOL_KINDS = ['pickaxe', 'axe', 'shovel', 'hoe'];
export const TOOL_MATS = [
  { name: 'Wooden', tier: 1, speed: 2, dur: 60, dmg: 0, color: [150, 115, 65] },
  { name: 'Stone', tier: 2, speed: 4, dur: 132, dmg: 1, color: [135, 135, 135] },
  { name: 'Iron', tier: 3, speed: 6, dur: 251, dmg: 2, color: [225, 225, 225] },
  { name: 'Diamond', tier: 4, speed: 8, dur: 1562, dmg: 3, color: [90, 230, 225] },
];
export const toolId = (mat, kind) => 120 + mat * 5 + TOOL_KINDS.indexOf(kind);
// armour: 170 + mat*4 + piece
export const ARMOR_PIECES = ['helmet', 'chestplate', 'leggings', 'boots'];
export const ARMOR_MATS = [
  { name: 'Leather', pts: [1, 3, 2, 1], dur: 60, color: [150, 95, 55] },
  { name: 'Iron', pts: [2, 6, 5, 2], dur: 180, color: [220, 220, 220] },
  { name: 'Gold', pts: [2, 5, 3, 1], dur: 90, color: [250, 215, 60] },
  { name: 'Diamond', pts: [3, 8, 6, 3], dur: 400, color: [90, 230, 225] },
];
export const armorId = (mat, piece) => 170 + mat * 4 + piece;

export const BLOCKS = [];
function def(id, name, tex, p = {}) {
  const t = typeof tex === 'string' ? { top: tex, bottom: tex, side: tex } : tex;
  BLOCKS[id] = {
    id, name,
    top: T[t.top], bottom: T[t.bottom ?? t.top], side: T[t.side ?? t.top], front: T[t.front ?? t.side ?? t.top],
    solid: p.solid ?? true,          // collides
    opaque: p.opaque ?? !p.shape,    // hides neighbour faces
    liquid: !!p.liquid,
    cross: !!p.cross,                // X-shaped plant sprite
    shape: p.shape ?? null,          // non-cube geometry, see shapes.js
    transparent: !!p.transparent,    // drawn in the blended pass
    hardness: p.hardness ?? 1,
    tool: p.tool ?? null,            // pickaxe/axe/shovel
    tier: p.tier ?? 0,               // min tool tier to get a drop
    drop: p.drop === undefined ? id : p.drop,
    sound: p.sound ?? 'stone',
    light: p.light ?? 0,
    xp: p.xp ?? 0,
    replaceable: !!p.replaceable,    // fluids and placing flow into it
    flatIcon: !!p.flatIcon,
  };
}
const PLANT = { solid: false, opaque: false, cross: true, hardness: 0, sound: 'grass', replaceable: true };
def(B.GRASS, 'Grass Block', { top: 'grass_top', bottom: 'dirt', side: 'grass_side' }, { hardness: 0.6, tool: 'shovel', drop: B.DIRT, sound: 'grass' });
def(B.DIRT, 'Dirt', 'dirt', { hardness: 0.5, tool: 'shovel', sound: 'grass' });
def(B.STONE, 'Stone', 'stone', { hardness: 1.5, tool: 'pickaxe', tier: 1, drop: B.COBBLE });
def(B.COBBLE, 'Cobblestone', 'cobble', { hardness: 2, tool: 'pickaxe', tier: 1 });
def(B.SAND, 'Sand', 'sand', { hardness: 0.5, tool: 'shovel', sound: 'sand' });
def(B.LOG, 'Oak Log', { top: 'log_top', side: 'log_side' }, { hardness: 2, tool: 'axe', sound: 'wood' });
def(B.PLANKS, 'Oak Planks', 'planks', { hardness: 2, tool: 'axe', sound: 'wood' });
def(B.LEAVES, 'Oak Leaves', 'leaves', { hardness: 0.2, opaque: false, drop: -1, sound: 'grass' });
def(B.GLASS, 'Glass', 'glass', { hardness: 0.3, opaque: false, drop: -2, sound: 'glass' });
def(B.WATER, 'Water', 'water', { solid: false, opaque: false, liquid: true, transparent: true, hardness: Infinity, drop: 0 });
def(B.LAVA, 'Lava', 'lava', { solid: false, opaque: false, liquid: true, hardness: Infinity, drop: 0, light: 15 });
def(B.COAL_ORE, 'Coal Ore', 'coal_ore', { hardness: 3, tool: 'pickaxe', tier: 1, drop: I.COAL, xp: 1 });
def(B.IRON_ORE, 'Iron Ore', 'iron_ore', { hardness: 3, tool: 'pickaxe', tier: 2 });
def(B.GOLD_ORE, 'Gold Ore', 'gold_ore', { hardness: 3, tool: 'pickaxe', tier: 3 });
def(B.DIAMOND_ORE, 'Diamond Ore', 'diamond_ore', { hardness: 3, tool: 'pickaxe', tier: 3, drop: I.DIAMOND, xp: 5 });
def(B.LAPIS_ORE, 'Lapis Lazuli Ore', 'lapis_ore', { hardness: 3, tool: 'pickaxe', tier: 2, drop: I.LAPIS, xp: 3 });
def(B.EMERALD_ORE, 'Emerald Ore', 'emerald_ore', { hardness: 3, tool: 'pickaxe', tier: 3, drop: I.EMERALD, xp: 5 });
def(B.BEDROCK, 'Bedrock', 'bedrock', { hardness: Infinity, drop: 0 });
def(B.SNOW, 'Snow Block', 'snow', { hardness: 0.2, tool: 'shovel', sound: 'snow' });
def(B.SNOW_GRASS, 'Snowy Grass', { top: 'snow', bottom: 'dirt', side: 'snow_side' }, { hardness: 0.6, tool: 'shovel', drop: B.DIRT, sound: 'snow' });
def(B.GRAVEL, 'Gravel', 'gravel', { hardness: 0.6, tool: 'shovel', sound: 'sand', drop: -4 });
def(B.BRICK, 'Bricks', 'brick', { hardness: 2, tool: 'pickaxe', tier: 1 });
def(B.TABLE, 'Crafting Table', { top: 'table_top', bottom: 'planks', side: 'table_side', front: 'table_front' }, { hardness: 2.5, tool: 'axe', sound: 'wood' });
def(B.CACTUS, 'Cactus', { top: 'cactus_top', bottom: 'cactus_top', side: 'cactus_side' }, { hardness: 0.4, shape: 'cactus', sound: 'wool' });
def(B.SANDSTONE, 'Sandstone', { top: 'sandstone_top', side: 'sandstone' }, { hardness: 0.8, tool: 'pickaxe', tier: 1 });
def(B.FLOWER_RED, 'Poppy', 'flower_red', PLANT);
def(B.FLOWER_YELLOW, 'Dandelion', 'flower_yellow', PLANT);
def(B.TALLGRASS, 'Grass', 'tallgrass', { ...PLANT, drop: -3 });
def(B.SPRUCE_LOG, 'Spruce Log', { top: 'spruce_top', side: 'spruce_log' }, { hardness: 2, tool: 'axe', sound: 'wood' });
def(B.SPRUCE_LEAVES, 'Spruce Leaves', 'spruce_leaves', { hardness: 0.2, opaque: false, drop: -1, sound: 'grass' });
def(B.TORCH, 'Torch', 'torch', { ...PLANT, sound: 'wood', light: 14, replaceable: false });
def(B.FURNACE, 'Furnace', { top: 'furnace_top', side: 'furnace_side', front: 'furnace_front' }, { hardness: 3.5, tool: 'pickaxe', tier: 1 });
def(B.WOOL, 'White Wool', 'wool', { hardness: 0.8, sound: 'wool' });
def(B.ICE, 'Ice', 'ice', { hardness: 0.5, tool: 'pickaxe', opaque: false, transparent: true, drop: 0, sound: 'glass' });
def(B.CHEST, 'Chest', { top: 'chest_top', side: 'chest_side', front: 'chest_front' }, { hardness: 2.5, tool: 'axe', sound: 'wood' });
def(B.BOOKSHELF, 'Bookshelf', { top: 'planks', side: 'bookshelf' }, { hardness: 1.5, tool: 'axe', sound: 'wood', drop: I.BOOK });
def(B.MOSSY, 'Mossy Cobblestone', 'mossy', { hardness: 2, tool: 'pickaxe', tier: 1 });
def(B.CLAY, 'Clay', 'clay', { hardness: 0.6, tool: 'shovel', sound: 'sand' });
def(B.BED, 'Bed', { top: 'bed_top', bottom: 'planks', side: 'bed_side' }, { hardness: 0.2, shape: 'bed', sound: 'wool' });
def(B.PUMPKIN, 'Pumpkin', { top: 'pumpkin_top', side: 'pumpkin_side' }, { hardness: 1, tool: 'axe', sound: 'wood' });
def(B.OBSIDIAN, 'Obsidian', 'obsidian', { hardness: 50, tool: 'pickaxe', tier: 4 });
def(B.DOOR, 'Oak Door', { top: 'door_bottom', side: 'door_bottom' }, { hardness: 3, tool: 'axe', shape: 'door', sound: 'wood', drop: I.DOOR_ITEM });
def(B.LADDER, 'Ladder', 'ladder', { hardness: 0.4, tool: 'axe', shape: 'ladder', solid: false, sound: 'wood', flatIcon: true });
def(B.SLAB_STONE, 'Stone Slab', 'stone', { hardness: 2, tool: 'pickaxe', tier: 1, shape: 'slab' });
def(B.SLAB_WOOD, 'Oak Slab', 'planks', { hardness: 2, tool: 'axe', shape: 'slab', sound: 'wood' });
def(B.STAIRS_WOOD, 'Oak Stairs', 'planks', { hardness: 2, tool: 'axe', shape: 'stairs', sound: 'wood' });
def(B.STAIRS_COBBLE, 'Cobblestone Stairs', 'cobble', { hardness: 2, tool: 'pickaxe', tier: 1, shape: 'stairs' });
def(B.FENCE, 'Oak Fence', 'fence', { hardness: 2, tool: 'axe', shape: 'fence', sound: 'wood' });
def(B.FARMLAND, 'Farmland', { top: 'farmland', side: 'dirt', bottom: 'dirt' }, { hardness: 0.6, tool: 'shovel', shape: 'farmland', drop: B.DIRT, sound: 'grass' });
def(B.WHEAT_CROP, 'Wheat Crops', 'wheat0', { ...PLANT, drop: -5, replaceable: false });
def(B.SAPLING, 'Oak Sapling', 'sapling', { ...PLANT, replaceable: false });
def(B.SPRUCE_SAPLING, 'Spruce Sapling', 'spruce_sapling', { ...PLANT, replaceable: false });
def(B.SUGAR_CANE, 'Sugar Cane', 'sugar_cane', { ...PLANT, replaceable: false });
def(B.NETHERRACK, 'Netherrack', 'netherrack', { hardness: 0.4, tool: 'pickaxe', tier: 1 });
def(B.SOUL_SAND, 'Soul Sand', 'soul_sand', { hardness: 0.5, tool: 'shovel', sound: 'sand' });
def(B.GLOWSTONE, 'Glowstone', 'glowstone', { hardness: 0.3, light: 15, drop: I.GLOWSTONE_DUST, sound: 'glass' });
def(B.QUARTZ_ORE, 'Nether Quartz Ore', 'quartz_ore', { hardness: 3, tool: 'pickaxe', tier: 1, drop: I.QUARTZ, xp: 3 });
def(B.NETHER_BRICK, 'Nether Bricks', 'nether_brick', { hardness: 2, tool: 'pickaxe', tier: 1 });
def(B.PORTAL, 'Nether Portal', 'portal', { solid: false, opaque: false, transparent: true, shape: 'portal', hardness: Infinity, drop: 0, light: 11 });
def(B.END_STONE, 'End Stone', 'end_stone', { hardness: 3, tool: 'pickaxe', tier: 1 });
def(B.END_FRAME, 'End Portal Frame', { top: 'frame_top', side: 'frame_side', bottom: 'end_stone' }, { hardness: Infinity, shape: 'frame', drop: 0, light: 1 });
def(B.END_PORTAL, 'End Portal', 'end_portal', { solid: false, opaque: false, shape: 'endportal', hardness: Infinity, drop: 0, light: 15 });
def(B.STONE_BRICK, 'Stone Bricks', 'stone_brick', { hardness: 1.5, tool: 'pickaxe', tier: 1 });
def(B.ENCHANT_TABLE, 'Enchanting Table', { top: 'enchant_top', side: 'enchant_side', bottom: 'obsidian' }, { hardness: 5, tool: 'pickaxe', tier: 1, shape: 'enchant', light: 7 });
def(B.IRON_BLOCK, 'Block of Iron', 'iron_block', { hardness: 5, tool: 'pickaxe', tier: 2 });
def(B.GOLD_BLOCK, 'Block of Gold', 'gold_block', { hardness: 3, tool: 'pickaxe', tier: 3 });
def(B.DIAMOND_BLOCK, 'Block of Diamond', 'diamond_block', { hardness: 5, tool: 'pickaxe', tier: 3 });
def(B.DRAGON_EGG, 'Dragon Egg', 'dragon_egg', { hardness: 3, light: 1 });

const PL = { hardness: 0, solid: false, opaque: false, shape: null };
def(B.RAIL, 'Rail', 'rail', { hardness: 0.7, tool: 'pickaxe', solid: false, shape: 'rail', flatIcon: true });
def(B.WIRE, 'Redstone Dust', 'redstone_dust', { ...PL, shape: 'wire', drop: I.REDSTONE, flatIcon: true });
def(B.RTORCH, 'Redstone Torch', 'redstone_torch', { ...PLANT, sound: 'wood', light: 7, replaceable: false });
def(B.RTORCH_OFF, 'Redstone Torch', 'redstone_torch_off', { ...PLANT, sound: 'wood', replaceable: false, drop: B.RTORCH });
def(B.LEVER, 'Lever', 'lever', { ...PL, shape: 'lever', sound: 'wood', flatIcon: true, hardness: 0.5 });
def(B.BUTTON, 'Stone Button', 'stone', { ...PL, shape: 'button', hardness: 0.5 });
def(B.PLATE, 'Pressure Plate', 'stone', { ...PL, shape: 'plate', hardness: 0.5, tool: 'pickaxe' });
def(B.LAMP, 'Redstone Lamp', 'lamp_off', { hardness: 0.3, sound: 'glass' });
def(B.LAMP_ON, 'Redstone Lamp', 'lamp_on', { hardness: 0.3, sound: 'glass', light: 15, drop: B.LAMP });
def(B.PISTON, 'Piston', { top: 'piston_top', side: 'piston_side', bottom: 'piston_bottom' }, { hardness: 1.5, shape: 'piston', opaque: false });
def(B.PISTON_HEAD, 'Piston Head', 'piston_top', { hardness: 1.5, shape: 'pistonhead', drop: 0 });
def(B.REDSTONE_BLOCK, 'Block of Redstone', 'redstone_block', { hardness: 5, tool: 'pickaxe', tier: 1 });
def(B.REDSTONE_ORE, 'Redstone Ore', 'redstone_ore', { hardness: 3, tool: 'pickaxe', tier: 3, drop: I.REDSTONE, xp: 2 });
def(B.ANVIL, 'Anvil', { top: 'anvil_top', side: 'anvil_side' }, { hardness: 5, tool: 'pickaxe', tier: 1, shape: 'anvil' });
def(B.BREWING, 'Brewing Stand', 'brewing', { hardness: 0.5, tool: 'pickaxe', shape: 'brewing', light: 1, flatIcon: true });
def(B.NETHER_WART, 'Nether Wart', 'wart0', { ...PLANT, drop: -6, replaceable: false });
def(B.PRISMARINE, 'Prismarine', 'prismarine', { hardness: 1.5, tool: 'pickaxe', tier: 1 });
def(B.DARK_PRISMARINE, 'Dark Prismarine', 'dark_prismarine', { hardness: 1.5, tool: 'pickaxe', tier: 1 });
def(B.SEA_LANTERN, 'Sea Lantern', 'sea_lantern', { hardness: 0.3, light: 15, sound: 'glass' });
def(B.DARK_LOG, 'Dark Oak Log', { top: 'dark_log_top', side: 'dark_log' }, { hardness: 2, tool: 'axe', sound: 'wood' });
def(B.DARK_PLANKS, 'Dark Oak Planks', 'dark_planks', { hardness: 2, tool: 'axe', sound: 'wood' });
def(B.PURPUR, 'Purpur Block', 'purpur', { hardness: 1.5, tool: 'pickaxe', tier: 1 });
def(B.MELON, 'Melon', { top: 'melon_top', side: 'melon_side' }, { hardness: 1, tool: 'axe', drop: -7, sound: 'wood' });
def(B.COBWEB, 'Cobweb', 'cobweb', { ...PLANT, hardness: 4, drop: I.STRING, replaceable: false });
def(B.GATEWAY, 'End Gateway', 'gateway', { solid: false, opaque: false, shape: 'endportal', hardness: Infinity, drop: 0, light: 15 });

export const isBlock = (id) => id > 0 && id < 100 && !!BLOCKS[id];
export const isFluid = (id) => id === B.WATER || id === B.LAVA;

// ---------------------------------------------------------------- items
const ITEMS = {};
function item(id, name, icon, p = {}) { ITEMS[id] = { id, name, icon, stack: p.stack ?? 64, food: p.food ?? 0, place: p.place }; }
item(I.STICK, 'Stick', 'stick');
item(I.COAL, 'Coal', 'lump');
item(I.IRON, 'Iron Ingot', 'ingot');
item(I.GOLD, 'Gold Ingot', 'ingot');
item(I.DIAMOND, 'Diamond', 'gem');
item(I.APPLE, 'Apple', 'apple', { food: 4 });
item(I.BEEF, 'Raw Beef', 'meat', { food: 3 });
item(I.COOKED_BEEF, 'Steak', 'meat', { food: 8 });
item(I.BREAD, 'Bread', 'bread', { food: 5 });
item(I.WHEAT, 'Wheat', 'wheat');
item(I.SEEDS, 'Wheat Seeds', 'seeds', { place: B.WHEAT_CROP });
item(I.BUCKET, 'Bucket', 'bucket', { stack: 16 });
item(I.WATER_BUCKET, 'Water Bucket', 'bucket', { stack: 1 });
item(I.LAVA_BUCKET, 'Lava Bucket', 'bucket', { stack: 1 });
item(I.FLINT, 'Flint', 'flint');
item(I.FLINT_STEEL, 'Flint and Steel', 'flintsteel', { stack: 1 });
item(I.STRING, 'String', 'string');
item(I.BONE, 'Bone', 'bone');
item(I.BONE_MEAL, 'Bone Meal', 'powder');
item(I.GUNPOWDER, 'Gunpowder', 'powder');
item(I.LEATHER, 'Leather', 'leather');
item(I.PAPER, 'Paper', 'paper');
item(I.BOOK, 'Book', 'book');
item(I.ENDER_PEARL, 'Ender Pearl', 'pearl', { stack: 16 });
item(I.BLAZE_ROD, 'Blaze Rod', 'rod');
item(I.BLAZE_POWDER, 'Blaze Powder', 'powder');
item(I.EYE_OF_ENDER, 'Eye of Ender', 'pearl');
item(I.LAPIS, 'Lapis Lazuli', 'lump');
item(I.EMERALD, 'Emerald', 'gem');
item(I.QUARTZ, 'Nether Quartz', 'gem');
item(I.GLOWSTONE_DUST, 'Glowstone Dust', 'powder');
item(I.DOOR_ITEM, 'Oak Door', 'door', { place: B.DOOR });
item(I.SUGAR, 'Sugar', 'powder');
const ITEM_COLORS = {
  [I.STICK]: [140, 100, 55], [I.COAL]: [40, 40, 40], [I.IRON]: [220, 220, 220], [I.GOLD]: [250, 215, 60],
  [I.DIAMOND]: [90, 230, 225], [I.APPLE]: [220, 30, 30], [I.BEEF]: [200, 60, 60],
  [I.COOKED_BEEF]: [120, 70, 40],
  [I.BREAD]: [200, 150, 70], [I.WHEAT]: [220, 200, 90], [I.SEEDS]: [90, 160, 60], [I.BUCKET]: [190, 190, 190],
  [I.WATER_BUCKET]: [190, 190, 190], [I.LAVA_BUCKET]: [190, 190, 190], [I.FLINT]: [60, 60, 65], [I.FLINT_STEEL]: [200, 200, 200],
  [I.STRING]: [235, 235, 235], [I.BONE]: [235, 230, 210],
  [I.BONE_MEAL]: [240, 240, 235], [I.GUNPOWDER]: [90, 90, 90], [I.LEATHER]: [150, 95, 55], [I.PAPER]: [240, 240, 230],
  [I.BOOK]: [140, 60, 40], [I.ENDER_PEARL]: [30, 110, 100], [I.BLAZE_ROD]: [250, 190, 40], [I.BLAZE_POWDER]: [250, 160, 30],
  [I.EYE_OF_ENDER]: [40, 130, 110], [I.LAPIS]: [40, 70, 200], [I.EMERALD]: [40, 200, 90], [I.QUARTZ]: [235, 230, 220],
  [I.GLOWSTONE_DUST]: [250, 220, 110], [I.DOOR_ITEM]: [165, 130, 80], [I.SUGAR]: [250, 250, 250],
};
const ITEM_COLORS2 = {
  [I.WATER_BUCKET]: [50, 90, 220], [I.LAVA_BUCKET]: [240, 120, 20],
  [I.FLINT_STEEL]: [60, 60, 65], [I.ENDER_PEARL]: [10, 40, 40], [I.EYE_OF_ENDER]: [120, 230, 90], [I.BOOK]: [230, 225, 210],
};
item(I.FEATHER, 'Feather', 'feather');
item(I.EGG, 'Egg', 'egg', { stack: 16 });
item(I.CHICKEN, 'Raw Chicken', 'meat', { food: 2 });
item(I.COOKED_CHICKEN, 'Cooked Chicken', 'meat', { food: 6 });
item(I.ROD, 'Fishing Rod', 'rod2', { stack: 1 });
item(I.FISH, 'Raw Fish', 'fish', { food: 2 });
item(I.COOKED_FISH, 'Cooked Fish', 'fish', { food: 5 });
item(I.BOAT, 'Boat', 'boat', { stack: 1 });
item(I.MINECART, 'Minecart', 'cart', { stack: 1 });
item(I.MAP, 'Map', 'map', { stack: 1 });
item(I.COMPASS, 'Compass', 'compass', { stack: 1 });
item(I.BOTTLE, 'Glass Bottle', 'bottle', { stack: 16 });
item(I.POTION, 'Potion', 'bottle', { stack: 1 });
item(I.SPLASH, 'Splash Potion', 'bottle', { stack: 1 });
item(I.WART, 'Nether Wart', 'wart', { place: B.NETHER_WART });
item(I.MELON_SLICE, 'Melon Slice', 'slice', { food: 2 });
item(I.NUGGET, 'Gold Nugget', 'nugget');
item(I.REDSTONE, 'Redstone Dust', 'powder', { place: B.WIRE });
item(I.ELYTRA, 'Elytra', 'elytra', { stack: 1 });
item(I.MILK, 'Milk Bucket', 'bucket', { stack: 1 });
Object.assign(ITEM_COLORS, {
  [I.FEATHER]: [240, 240, 240], [I.EGG]: [240, 225, 190], [I.CHICKEN]: [240, 190, 170], [I.COOKED_CHICKEN]: [200, 140, 80],
  [I.ROD]: [130, 90, 45], [I.FISH]: [120, 160, 190], [I.COOKED_FISH]: [190, 140, 90], [I.BOAT]: [150, 110, 60], [I.MINECART]: [150, 150, 155],
  [I.MAP]: [230, 220, 180], [I.COMPASS]: [170, 170, 175], [I.BOTTLE]: [200, 225, 240], [I.POTION]: [200, 225, 240], [I.SPLASH]: [200, 225, 240],
  [I.WART]: [170, 30, 45], [I.MELON_SLICE]: [220, 60, 60],
  [I.NUGGET]: [250, 215, 60], [I.REDSTONE]: [220, 30, 20], [I.ELYTRA]: [140, 130, 170], [I.MILK]: [190, 190, 190],
});
Object.assign(ITEM_COLORS2, { [I.ROD]: [220, 220, 220], [I.MAP]: [120, 150, 90], [I.COMPASS]: [220, 40, 40], [I.MILK]: [250, 250, 250] });
ITEMS[I.ROD].tool = { kind: 'rod', dur: 64, dmg: 1 };
ITEMS[I.ELYTRA].armor = { slot: 1, pts: 0, dur: 432 };
// potions: stack.pot names one of these
export const POTIONS = {
  water: { name: 'Water Bottle', color: [60, 90, 230] }, awkward: { name: 'Awkward Potion', color: [80, 110, 230] },
  swiftness: { name: 'Potion of Swiftness', color: [120, 190, 240], secs: 180 },
  night_vision: { name: 'Potion of Night Vision', color: [40, 40, 160], secs: 180 },
};
for (let m = 0; m < 4; m++) for (let k = 0; k < TOOL_KINDS.length; k++) {
  const id = toolId(m, TOOL_KINDS[k]), mat = TOOL_MATS[m], kind = TOOL_KINDS[k];
  ITEMS[id] = {
    id, name: `${mat.name} ${kind[0].toUpperCase() + kind.slice(1)}`, icon: kind, stack: 1,
    tool: { kind, tier: mat.tier, speed: mat.speed, dur: mat.dur, dmg: kind === 'axe' ? 3 + mat.dmg : kind === 'hoe' ? 1 : 2 + (mat.dmg >> 1) },
  };
  ITEM_COLORS[id] = mat.color;
}
ITEMS[I.FLINT_STEEL].tool = { kind: 'flint', dur: 64, dmg: 1 };
for (let m = 0; m < 4; m++) for (let p = 0; p < 4; p++) {
  const id = armorId(m, p), mat = ARMOR_MATS[m];
  const piece = ARMOR_PIECES[p];
  ITEMS[id] = { id, name: `${mat.name} ${piece[0].toUpperCase() + piece.slice(1)}`, icon: piece, stack: 1, armor: { slot: p, pts: mat.pts[p], dur: mat.dur * (p === 1 ? 1.5 : 1) | 0 } };
  ITEM_COLORS[id] = mat.color;
}
// smelting
export const SMELT = {
  [B.IRON_ORE]: I.IRON, [B.GOLD_ORE]: I.GOLD, [B.SAND]: B.GLASS, [B.COBBLE]: B.STONE,
  [I.BEEF]: I.COOKED_BEEF, [B.LOG]: I.COAL, [B.SPRUCE_LOG]: I.COAL, [B.CLAY]: B.BRICK, [B.NETHERRACK]: B.NETHER_BRICK,
  [I.CHICKEN]: I.COOKED_CHICKEN, [I.FISH]: I.COOKED_FISH, [B.REDSTONE_ORE]: I.REDSTONE, [B.DARK_LOG]: I.COAL,
};
export const FUEL = { [I.COAL]: 80, [B.LOG]: 15, [B.SPRUCE_LOG]: 15, [B.PLANKS]: 15, [I.STICK]: 5, [B.TABLE]: 15, [B.BOOKSHELF]: 15, [B.CHEST]: 15, [I.LAVA_BUCKET]: 1000, [I.BLAZE_ROD]: 120, [B.SAPLING]: 5, [B.SLAB_WOOD]: 8, [B.FENCE]: 15, [B.DARK_LOG]: 15, [B.DARK_PLANKS]: 15, [B.REDSTONE_BLOCK]: 0 };

export function info(id) {
  if (isBlock(id)) {
    const b = BLOCKS[id];
    return { id, name: b.name, stack: 64, food: 0, block: b };
  }
  return ITEMS[id];
}
const HIDDEN = new Set([B.WATER, B.LAVA, B.DOOR, B.WHEAT_CROP, B.PORTAL, B.END_PORTAL, B.FARMLAND, B.WIRE, B.RTORCH_OFF, B.LAMP_ON, B.PISTON_HEAD, B.NETHER_WART, B.GATEWAY]);
export const ALL_IDS = [
  ...BLOCKS.filter((b) => b && !HIDDEN.has(b.id)).map((b) => b.id),
  ...Object.keys(ITEMS).map(Number),
];

// ---------------------------------------------------------------- icons
// 8x8 masks: m = main colour, d = darker main, h = wooden handle, c = second colour
const MASKS = {
  stick: ['.......h', '......h.', '.....h..', '....h...', '...h....', '..h.....', '.h......', 'h.......'],
  pickaxe: ['.mmmmm..', 'm....hm.', '....h.m.', '...h..m.', '..h.....', '.h......', 'h.......', '........'],
  axe: ['...mm...', '..mmmh..', '..mmh...', '...h....', '..h.....', '.h......', 'h.......', '........'],
  shovel: ['......mm', '.....mmm', '....mmm.', '....hm..', '...h....', '..h.....', '.h......', 'h.......'],
  hoe: ['..mmmm..', '.....hm.', '....h...', '...h....', '..h.....', '.h......', 'h.......', '........'],
  ingot: ['........', '........', '..mmmm..', '.mmmmmm.', 'mmmmmmd.', 'dddddd..', '........', '........'],
  gem: ['........', '..mmmm..', '.mmmmmm.', 'mmmmmmmm', '.mmmmmm.', '..mmmm..', '...mm...', '........'],
  lump: ['........', '...mm...', '.mmmmm..', 'mmmmmmm.', '.mmmmmmm', '..mmmmm.', '...mm...', '........'],
  apple: ['....h...', '...h....', '.mmmmm..', 'mmmmmmm.', 'mmmmmmm.', 'mmmmmmm.', '.mmmmm..', '..m.m...'],
  meat: ['........', '..mmm...', '.mmmmm..', 'mmmmmmm.', 'mmmmmmmd', '.mmmmmd.', '..ddd...', '........'],
  bread: ['........', '........', '.mmmmmm.', 'mmdmdmmm', 'mmmmmmmm', '.dddddd.', '........', '........'],
  wheat: ['...m.m..', '..m.m.m.', '...mmm..', '....h...', '...h.h..', '....h...', '...h....', '..h.....'],
  seeds: ['........', '..m..m..', '.m..m...', '...m..m.', '.m...m..', '..m.m...', '....m...', '........'],
  bucket: ['........', 'm......m', 'mccccccm', '.mccccm.', '.mmmmmm.', '..mmmm..', '........', '........'],
  flint: ['........', '...mm...', '..mmmm..', '.mmmmdd.', '.mmmdd..', '..mdd...', '...d....', '........'],
  flintsteel: ['....mmm.', '...m...m', '...m...m', '....mmm.', '.cc.....', 'cccc....', '.cc.....', '........'],
  string: ['......m.', '.....m..', '....m...', '...mm...', '...m....', '..m.....', '.m......', 'm.......'],
  bone: ['......mm', '.....mmm', '....mm..', '...mm...', '..mm....', 'mmm.....', 'mm......', '........'],
  powder: ['........', '........', '........', '...m....', '..mmm...', '.mmmmm..', 'mmmmmmm.', '........'],
  leather: ['........', '.mmmmmm.', 'mmmmmmmm', 'mmmmmmmm', '.mmmmmm.', '.mmmmmm.', 'mm....mm', '........'],
  paper: ['........', '.mmmmmm.', '.mddddm.', '.mmmmmm.', '.mddddm.', '.mmmmmm.', '.mmmmmm.', '........'],
  book: ['........', '.mmmmmm.', '.mcccmm.', '.mmmmmm.', '.mcccmm.', '.mmmmmm.', '.mmmmmm.', '........'],
  pearl: ['........', '..mmmm..', '.mmccmm.', '.mcccdm.', '.mcccdm.', '.mmddmm.', '..mmmm..', '........'],
  rod: ['......m.', '.....m..', '....m...', '...m....', '..m.....', '.m......', 'm.......', '........'],
  door: ['..mmmm..', '..mddm..', '..mddm..', '..mmmm..', '..mmmm..', '..mmmd..', '..mmmm..', '..mmmm..'],
  helmet: ['........', '.mmmmmm.', 'mmmmmmmm', 'mm....mm', 'mm....mm', '........', '........', '........'],
  chestplate: ['mm....mm', 'mmm..mmm', '.mmmmmm.', '.mmmmmm.', '.mmmmmm.', '.mmmmmm.', '.mmmmmm.', '........'],
  leggings: ['.mmmmmm.', '.mmmmmm.', '.mm..mm.', '.mm..mm.', '.mm..mm.', '.mm..mm.', '.mm..mm.', '........'],
  feather: ['......mm', '.....mmm', '....mmm.', '...mmm..', '..mmm...', '.mhm....', '.h......', 'h.......'],
  egg: ['........', '...mm...', '..mmmm..', '.mmmmmm.', '.mmmmmm.', '.mmmmmm.', '..mmmm..', '........'],
  rod2: ['......hc', '.....h.c', '....h..c', '...h...c', '..h....c', '.h....cc', 'h.......', '........'],
  fish: ['........', '........', 'm..mmm..', 'mmmmmmm.', 'mmmmmdmm', 'm..mmm..', '........', '........'],
  boat: ['........', '........', '........', 'm......m', 'mmmmmmmm', '.mmmmmm.', '..dddd..', '........'],
  cart: ['........', '........', 'm......m', 'mmmmmmmm', 'mmmmmmmm', 'mmmmmmmm', '.d....d.', '........'],
  map: ['mmmmmmmm', 'mccmcccm', 'mcccmccm', 'mmcccmcm', 'mccmcccm', 'mcccccmm', 'mcmccccm', 'mmmmmmmm'],
  compass: ['..mmmm..', '.mddddm.', 'mdddcddm', 'mddcdddm', 'mdddmddm', 'mddddddm', '.mddddm.', '..mmmm..'],
  bottle: ['...hh...', '...mm...', '...mm...', '..mccm..', '.mccccm.', '.mccccm.', '.mccccm.', '..mmmm..'],
  wart: ['........', '..m..m..', '.mmm.mm.', '..m.mmm.', '.mm..m..', '.mmm....', '..m.....', '........'],
  slice: ['........', '.......m', '......mm', '.....mcm', '....mccm', '...mcccm', '..mmmmmm', '........'],
  nugget: ['........', '........', '...mm...', '..mmmm..', '..mmmd..', '...dd...', '........', '........'],
  elytra: ['.mm..mm.', 'mmmmmmmm', 'mmm..mmm', 'mm....mm', 'mm....mm', 'm......m', 'm......m', '........'],
  boots: ['........', '........', '........', '.mm..mm.', '.mm..mm.', 'mmm.mmm.', 'mmm.mmm.', '........'],
};

let _atlas = null;
export function getAtlas() { return (_atlas ??= paintTiles()); }

const iconCache = new Map();
export function iconCanvas(id, pot) {
  const ck = pot ? id + ':' + pot : id;
  if (iconCache.has(ck)) return iconCache.get(ck);
  const cv = document.createElement('canvas');
  cv.width = cv.height = 32;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const atlas = getAtlas();
  const src = (t) => [(t % ATLAS_COLS) * TILE, Math.floor(t / ATLAS_COLS) * TILE, TILE, TILE];
  if (isBlock(id)) {
    const b = BLOCKS[id];
    if (b.cross || b.flatIcon) {
      ctx.drawImage(atlas, ...src(b.top), 0, 0, 32, 32);
    } else {
      // isometric cube
      ctx.setTransform(1, 0.5, -1, 0.5, 16, 0); ctx.drawImage(atlas, ...src(b.top), 0, 0, 16, 16);
      ctx.setTransform(1, 0.5, 0, 1, 0, 8); ctx.drawImage(atlas, ...src(b.side), 0, 0, 16, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.globalCompositeOperation = 'source-atop'; ctx.fillRect(0, 0, 16, 16); ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, -0.5, 0, 1, 16, 16); ctx.drawImage(atlas, ...src(b.front), 0, 0, 16, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.globalCompositeOperation = 'source-atop'; ctx.fillRect(0, 0, 16, 16); ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  } else {
    const it = ITEMS[id];
    const mask = MASKS[it?.icon] || MASKS.lump;
    const col = ITEM_COLORS[id] || [200, 200, 200];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const ch = mask[y][x];
      if (ch === '.') continue;
      const col2 = pot ? POTIONS[pot]?.color : (id === I.BOTTLE ? null : ITEM_COLORS2[id]);
      if (ch === 'c' && !col2) continue;
      let c = ch === 'h' ? [120, 85, 45] : ch === 'd' ? col.map((v) => v * 0.6) : ch === 'c' ? col2 : col;
      if (ch === 'm' && (x + y) % 5 === 0) c = c.map((v) => Math.min(255, v * 1.2));
      ctx.fillStyle = `rgb(${c.map((v) => v | 0).join(',')})`;
      ctx.fillRect(x * 4, y * 4, 4, 4);
    }
  }
  if (id === I.SPLASH) { ctx.fillStyle = '#555'; ctx.fillRect(12, 0, 8, 4); }
  iconCache.set(ck, cv);
  return cv;
}
const urlCache = new Map();
export function iconURL(id, pot) {
  const k = pot ? id + ':' + pot : id;
  if (!urlCache.has(k)) urlCache.set(k, iconCanvas(id, pot).toDataURL());
  return urlCache.get(k);
}
export const stackIcon = (s) => iconURL(s.id, s.pot);
export const stackName = (s) => (s.pot ? (s.id === I.SPLASH ? 'Splash ' : '') + POTIONS[s.pot].name : info(s.id)?.name || '');
