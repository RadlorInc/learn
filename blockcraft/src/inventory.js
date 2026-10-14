// Inventory model, crafting recipes, furnaces/chests, enchanting, trading, and the inventory screens.
import { B, I, info, iconURL, stackIcon, stackName, toolId, armorId, SMELT, FUEL, ALL_IDS, POTIONS, TOOL_MATS } from './blocks.js';

export const maxStack = (id) => info(id)?.stack ?? 64;
const sameKind = (a, b) => a.id === b.id && a.dmg == null && b.dmg == null && !a.ench && !b.ench && a.pot === b.pot;

export class Inventory {
  constructor(slots, armor) { this.slots = slots || Array(36).fill(null); this.armor = armor || Array(4).fill(null); this.sel = 0; }
  get held() { return this.slots[this.sel]; }
  // adds a stack; returns how many did not fit
  add(stack) {
    let n = stack.count;
    const ms = maxStack(stack.id);
    for (let i = 0; i < 36 && n > 0; i++) {
      const s = this.slots[i];
      if (s && sameKind(s, stack) && s.count < ms) { const k = Math.min(n, ms - s.count); s.count += k; n -= k; }
    }
    for (let i = 0; i < 36 && n > 0; i++) {
      if (!this.slots[i]) { const k = Math.min(n, ms); this.slots[i] = { ...stack, count: k }; n -= k; }
    }
    return n;
  }
  count(id) { return this.slots.reduce((a, s) => a + (s && s.id === id ? s.count : 0), 0); }
  take(id, n) {
    for (let i = 35; i >= 0 && n > 0; i--) {
      const s = this.slots[i];
      if (!s || s.id !== id) continue;
      const k = Math.min(n, s.count); s.count -= k; n -= k;
      if (s.count <= 0) this.slots[i] = null;
    }
    return n === 0;
  }
  consumeHeld(n = 1) {
    const s = this.slots[this.sel];
    if (!s) return;
    s.count -= n;
    if (s.count <= 0) this.slots[this.sel] = null;
  }
}

// ------------------------------------------------------------------ recipes
const RECIPES = [];
function shaped(rows, keys, id, count = 1) { RECIPES.push({ rows, keys, out: { id, count } }); }
function shapeless(ids, id, count = 1) { RECIPES.push({ ids, out: { id, count } }); }

shapeless([B.LOG], B.PLANKS, 4);
shapeless([B.SPRUCE_LOG], B.PLANKS, 4);
shaped(['P', 'P'], { P: [B.PLANKS, B.DARK_PLANKS] }, I.STICK, 4);
shaped(['PP', 'PP'], { P: [B.PLANKS, B.DARK_PLANKS] }, B.TABLE);
shaped(['C', 'S'], { C: I.COAL, S: I.STICK }, B.TORCH, 4);
shaped(['CCC', 'C.C', 'CCC'], { C: [B.COBBLE, B.MOSSY] }, B.FURNACE);
shaped(['PPP', 'P.P', 'PPP'], { P: B.PLANKS }, B.CHEST);
shaped(['SS', 'SS'], { S: B.SAND }, B.SANDSTONE);
shaped(['WWW'], { W: I.WHEAT }, I.BREAD);
shaped(['PPP', 'BBB', 'PPP'], { P: B.PLANKS, B: I.BOOK }, B.BOOKSHELF);
shaped(['WWW', 'PPP'], { W: B.WOOL, P: B.PLANKS }, B.BED);
shaped(['SS', 'SS'], { S: I.STRING }, B.WOOL);
shaped(['PP', 'PP', 'PP'], { P: B.PLANKS }, I.DOOR_ITEM, 3);
shaped(['S.S', 'SSS', 'S.S'], { S: I.STICK }, B.LADDER, 3);
shaped(['CCC'], { C: [B.STONE, B.COBBLE] }, B.SLAB_STONE, 6);
shaped(['PPP'], { P: B.PLANKS }, B.SLAB_WOOD, 6);
shaped(['P..', 'PP.', 'PPP'], { P: B.PLANKS }, B.STAIRS_WOOD, 4);
shaped(['C..', 'CC.', 'CCC'], { C: B.COBBLE }, B.STAIRS_COBBLE, 4);
shaped(['PSP', 'PSP'], { P: B.PLANKS, S: I.STICK }, B.FENCE, 3);
shaped(['I.I', '.I.'], { I: I.IRON }, I.BUCKET);
shapeless([I.IRON, I.FLINT], I.FLINT_STEEL);
shaped(['CCC'], { C: B.SUGAR_CANE }, I.PAPER, 3);
shapeless([B.SUGAR_CANE], I.SUGAR);
shapeless([I.PAPER, I.PAPER, I.PAPER, I.LEATHER], I.BOOK);
shapeless([I.BONE], I.BONE_MEAL, 3);
shaped(['.B.', 'DOD', 'OOO'], { B: I.BOOK, D: I.DIAMOND, O: B.OBSIDIAN }, B.ENCHANT_TABLE);
shapeless([I.BLAZE_ROD], I.BLAZE_POWDER, 2);
shapeless([I.ENDER_PEARL, I.BLAZE_POWDER], I.EYE_OF_ENDER);
shaped(['SS', 'SS'], { S: B.STONE }, B.STONE_BRICK, 4);
shaped(['GG', 'GG'], { G: I.GLOWSTONE_DUST }, B.GLOWSTONE);
for (const [ing, blk] of [[I.IRON, B.IRON_BLOCK], [I.GOLD, B.GOLD_BLOCK], [I.DIAMOND, B.DIAMOND_BLOCK]]) {
  shaped(['XXX', 'XXX', 'XXX'], { X: ing }, blk);
  shapeless([blk], ing, 9);
}
[B.PLANKS, B.COBBLE, I.IRON, I.DIAMOND].forEach((m, mat) => {
  shaped(['MMM', '.S.', '.S.'], { M: m, S: I.STICK }, toolId(mat, 'pickaxe'));
  shaped(['MM', 'MS', '.S'], { M: m, S: I.STICK }, toolId(mat, 'axe'));
  shaped(['M', 'S', 'S'], { M: m, S: I.STICK }, toolId(mat, 'shovel'));
  shaped(['MM', '.S', '.S'], { M: m, S: I.STICK }, toolId(mat, 'hoe'));
});
[I.LEATHER, I.IRON, I.GOLD, I.DIAMOND].forEach((m, mat) => {
  shaped(['MMM', 'M.M'], { M: m }, armorId(mat, 0));
  shaped(['M.M', 'MMM', 'MMM'], { M: m }, armorId(mat, 1));
  shaped(['MMM', 'M.M', 'M.M'], { M: m }, armorId(mat, 2));
  shaped(['M.M', 'M.M'], { M: m }, armorId(mat, 3));
});
shaped(['..S', '.SX', 'S.X'], { S: I.STICK, X: I.STRING }, I.ROD);
shaped(['P.P', 'PPP'], { P: [B.PLANKS, B.DARK_PLANKS] }, I.BOAT);
shaped(['I.I', 'III'], { I: I.IRON }, I.MINECART);
shaped(['I.I', 'ISI', 'I.I'], { I: I.IRON, S: I.STICK }, B.RAIL, 16);
shaped(['.I.', 'IRI', '.I.'], { I: I.IRON, R: I.REDSTONE }, I.COMPASS);
shaped(['PPP', 'PCP', 'PPP'], { P: I.PAPER, C: I.COMPASS }, I.MAP);
shaped(['G.G', '.G.'], { G: B.GLASS }, I.BOTTLE, 3);
shaped(['.B.', 'CCC'], { B: I.BLAZE_ROD, C: B.COBBLE }, B.BREWING);
shaped(['BBB', '.I.', 'III'], { B: B.IRON_BLOCK, I: I.IRON }, B.ANVIL);
shaped(['R', 'S'], { R: I.REDSTONE, S: I.STICK }, B.RTORCH);
shaped(['S', 'C'], { S: I.STICK, C: B.COBBLE }, B.LEVER);
shapeless([B.STONE], B.BUTTON);
shaped(['SS'], { S: B.STONE }, B.PLATE);
shaped(['.R.', 'RGR', '.R.'], { R: I.REDSTONE, G: B.GLOWSTONE }, B.LAMP);
shaped(['PPP', 'CIC', 'CRC'], { P: B.PLANKS, C: B.COBBLE, I: I.IRON, R: I.REDSTONE }, B.PISTON);
shaped(['XXX', 'XXX', 'XXX'], { X: I.REDSTONE }, B.REDSTONE_BLOCK);
shapeless([B.REDSTONE_BLOCK], I.REDSTONE, 9);
shapeless([I.GOLD], I.NUGGET, 9);
shaped(['NNN', 'NNN', 'NNN'], { N: I.NUGGET }, I.GOLD);
shaped(['MMM', 'MMM', 'MMM'], { M: I.MELON_SLICE }, B.MELON);
shapeless([B.DARK_LOG], B.DARK_PLANKS, 4);
export const RECIPE_COUNT = RECIPES.length;

// grid: array of ids (0 = empty), w = 2 or 3
export function matchRecipe(grid, w) {
  const cells = [];
  let minX = 9, minY = 9, maxX = -1, maxY = -1;
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const id = grid[y * w + x];
    if (id) { cells.push(id); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  if (!cells.length) return null;
  const pw = maxX - minX + 1, ph = maxY - minY + 1;
  const at = (x, y) => grid[(minY + y) * w + minX + x];
  const ok = (want, id) => (Array.isArray(want) ? want.includes(id) : want === id);
  for (const r of RECIPES) {
    if (r.ids) {
      if (r.ids.length !== cells.length) continue;
      const pool = [...cells];
      if (r.ids.every((id) => { const k = pool.indexOf(id); if (k < 0) return false; pool.splice(k, 1); return true; })) return r.out;
      continue;
    }
    const rh = r.rows.length, rw = r.rows[0].length;
    if (rh !== ph || rw !== pw) continue;
    for (const mirror of [false, true]) {
      let good = true;
      for (let y = 0; y < rh && good; y++) for (let x = 0; x < rw; x++) {
        const ch = r.rows[y][mirror ? rw - 1 - x : x];
        const id = at(x, y);
        if (ch === '.') { if (id) { good = false; break; } }
        else if (!ok(r.keys[ch], id)) { good = false; break; }
      }
      if (good) return r.out;
    }
  }
  return null;
}

// ------------------------------------------------------------------ furnaces
export function tickFurnace(f, dt) {
  const canSmelt = () => {
    if (!f.input) return false;
    const out = SMELT[f.input.id];
    if (!out) return false;
    return !f.output || (f.output.id === out && f.output.count < maxStack(out));
  };
  if (f.burn <= 0 && canSmelt() && f.fuel && FUEL[f.fuel.id]) {
    f.burnMax = f.burn = FUEL[f.fuel.id];
    if (f.fuel.id === I.LAVA_BUCKET) f.fuel = { id: I.BUCKET, count: 1 };
    else if (--f.fuel.count <= 0) f.fuel = null;
  }
  if (f.burn > 0) {
    f.burn -= dt;
    if (canSmelt()) {
      f.cook += dt;
      if (f.cook >= 5) {
        f.cook = 0;
        const out = SMELT[f.input.id];
        if (f.output) f.output.count++; else f.output = { id: out, count: 1 };
        if (--f.input.count <= 0) f.input = null;
      }
    } else f.cook = 0;
  } else f.cook = Math.max(0, f.cook - dt * 2);
}
export const newFurnace = () => ({ type: 'furnace', input: null, fuel: null, output: null, burn: 0, burnMax: 1, cook: 0 });
export const newChest = () => ({ type: 'chest', slots: Array(27).fill(null) });

// ------------------------------------------------------------------ brewing
export const newBrewing = () => ({ type: 'brewing', b0: null, b1: null, b2: null, ingredient: null, fuel: null, uses: 0, t: 0 });
const BREW = {
  water: { [I.WART]: 'awkward' },
  awkward: { [I.SUGAR]: 'swiftness', [I.NUGGET]: 'night_vision' },
};
function brewOne(bottle, ing) {
  if (!bottle || !bottle.pot) return null;
  if (ing === I.GUNPOWDER) return bottle.id === I.POTION && bottle.pot !== 'water' ? { ...bottle, id: I.SPLASH } : null;
  const to = BREW[bottle.pot]?.[ing];
  return to ? { ...bottle, pot: to } : null;
}
export function tickBrewing(b, dt) {
  if (b.uses <= 0 && b.fuel?.id === I.BLAZE_POWDER) { b.uses = 20; if (--b.fuel.count <= 0) b.fuel = null; }
  const ing = b.ingredient?.id;
  const can = ing && b.uses > 0 && ['b0', 'b1', 'b2'].some((k) => brewOne(b[k], ing));
  if (!can) { b.t = 0; return; }
  b.t += dt;
  if (b.t < 5) return;
  b.t = 0;
  for (const k of ['b0', 'b1', 'b2']) { const r = brewOne(b[k], ing); if (r) b[k] = r; }
  if (--b.ingredient.count <= 0) b.ingredient = null;
  b.uses--;
}

// ------------------------------------------------------------------ anvil
const REPAIR = { 0: B.PLANKS, 1: B.COBBLE, 2: I.IRON, 3: I.DIAMOND };
const ARMOR_REPAIR = { 0: I.LEATHER, 1: I.IRON, 2: I.GOLD, 3: I.DIAMOND };
function repairMaterial(id) {
  if (id >= 120 && id < 140) return REPAIR[Math.floor((id - 120) / 5)];
  if (id >= 170 && id < 186) return ARMOR_REPAIR[Math.floor((id - 170) / 4)];
  return null;
}
export function anvilResult(l, r) {
  if (!l || !r) return null;
  const it = info(l.id), dur = it?.tool?.dur || it?.armor?.dur;
  if (!dur) return null;
  if (r.id === l.id) {
    const out = { ...l, count: 1, dmg: Math.max(0, (l.dmg || 0) - (dur - (r.dmg || 0)) - Math.floor(dur * 0.12)) };
    const e = { ...(l.ench || {}) };
    for (const [k, v] of Object.entries(r.ench || {})) e[k] = e[k] === v ? Math.min(3, v + 1) : Math.max(e[k] || 0, v);
    if (Object.keys(e).length) out.ench = e;
    return { out, cost: 3 + Object.keys(e).length, useRight: 1 };
  }
  if (r.id === repairMaterial(l.id) && l.dmg > 0) {
    const n = Math.min(r.count, Math.ceil(l.dmg / (dur / 4)));
    return { out: { ...l, dmg: Math.max(0, l.dmg - Math.floor(n * dur / 4)) }, cost: 1 + n, useRight: n };
  }
  return null;
}
void TOOL_MATS;

// ------------------------------------------------------------------ enchanting
export const ENCH_NAMES = { efficiency: 'Efficiency', unbreaking: 'Unbreaking', protection: 'Protection' };
const ROMAN = ['', 'I', 'II', 'III'];
export function enchantsFor(id) {
  const it = info(id);
  if (it?.armor) return ['protection', 'unbreaking'];
  const k = it?.tool?.kind;
  if (['pickaxe', 'axe', 'shovel', 'hoe'].includes(k)) return ['efficiency', 'unbreaking'];
  return null;
}
export const ENCH_COST = [2, 5, 10];
export const enchLabel = (e) => Object.entries(e || {}).map(([k, v]) => `${ENCH_NAMES[k]} ${ROMAN[v]}`).join(', ');

// ------------------------------------------------------------------ trading
export const TRADES = [
  // farmer
  [[[I.WHEAT, 20], [I.EMERALD, 1]], [[I.EMERALD, 1], [I.BREAD, 6]], [[I.EMERALD, 1], [I.APPLE, 4]], [[B.PUMPKIN, 6], [I.EMERALD, 1]]],
  // librarian
  [[[I.PAPER, 24], [I.EMERALD, 1]], [[I.EMERALD, 3], [I.BOOK, 1]], [[I.EMERALD, 4], [B.BOOKSHELF, 1]], [[I.EMERALD, 2], [B.GLASS, 4]], [[I.EMERALD, 3], [I.ENDER_PEARL, 1]]],
  // smith
  [[[I.COAL, 15], [I.EMERALD, 1]], [[I.EMERALD, 4], [toolId(2, 'pickaxe'), 1]], [[I.EMERALD, 7], [armorId(1, 1), 1]], [[I.EMERALD, 12], [toolId(3, 'pickaxe'), 1]]],
  // butcher
  [[[I.BEEF, 12], [I.EMERALD, 1]], [[I.CHICKEN, 12], [I.EMERALD, 1]], [[I.EMERALD, 1], [I.COOKED_CHICKEN, 5]], [[I.EMERALD, 1], [I.COOKED_BEEF, 5]]],
];
export const PROFESSIONS = ['Farmer', 'Librarian', 'Smith', 'Butcher'];

// ------------------------------------------------------------------ screen
export class InventoryUI {
  constructor(root, game) {
    this.root = root; this.game = game;
    this.cursor = null; this.mode = null;
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'slot cursor';
    document.body.appendChild(this.cursorEl);
    addEventListener('mousemove', (e) => { this.mx = e.clientX; this.my = e.clientY; this.placeCursor(); });
    addEventListener('touchmove', (e) => { if (!this.mode) return; const t = e.touches[0]; this.mx = t.clientX; this.my = t.clientY; this.placeCursor(); }, { passive: true });
    root.addEventListener('mousedown', (e) => this.onClick(e));
    root.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  get open() { return !!this.mode; }
  placeCursor() { this.cursorEl.style.left = (this.mx - 20) + 'px'; this.cursorEl.style.top = (this.my - 20) + 'px'; }

  show(mode, container) {
    this.mode = mode; this.container = container;
    const w = mode === 'table' ? 3 : 2;
    this.craftW = w;
    this.craft = Array(w * w).fill(null);
    this.ench = { item: null, lapis: null };
    this.anvil = { l: null, r: null };
    this.root.classList.remove('hidden');
    this.render();
  }
  hide() {
    if (!this.mode) return;
    for (const s of this.craft || []) if (s) this.giveBack(s);
    for (const s of [this.ench?.item, this.ench?.lapis, this.anvil?.l, this.anvil?.r]) if (s) this.giveBack(s);
    if (this.cursor) { this.giveBack(this.cursor); this.cursor = null; }
    this.mode = null; this.container = null;
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
    this.renderCursor();
  }
  giveBack(s) {
    const left = this.game.inv.add(s);
    if (left > 0) this.game.dropStack({ ...s, count: left });
  }

  slotHTML(stack, src, extra = '', ph = '') {
    let inner = '';
    if (stack) {
      inner = `<img src="${stackIcon(stack)}" draggable="false">`;
      if (stack.count > 1) inner += `<span class="count">${stack.count}</span>`;
      const it = info(stack.id);
      const dur = it?.tool?.dur || it?.armor?.dur;
      if (dur && stack.dmg) {
        const f = 1 - stack.dmg / dur;
        inner += `<span class="dur"><i style="width:${f * 100}%;background:hsl(${f * 120},90%,45%)"></i></span>`;
      }
    } else if (ph) inner = `<span class="ph">${ph}</span>`;
    const title = stack ? stackName(stack) + (stack.ench ? ' — ' + enchLabel(stack.ench) : '') : '';
    return `<div class="slot ${extra} ${stack?.ench ? 'glint' : ''}" data-src="${src}" title="${title}">${inner}</div>`;
  }

  render() {
    if (!this.mode) return;
    const g = this.game, inv = g.inv;
    let top = '';
    if (this.mode === 'creative') {
      const pots = Object.keys(POTIONS).flatMap((p) => [[I.POTION, p], [I.SPLASH, p]]).filter(([id, p]) => !(id === I.SPLASH && (p === 'water' || p === 'awkward')));
      top = `<div class="title">Creative inventory — click to take a stack</div><div class="palette">${ALL_IDS.filter((id) => id !== I.POTION && id !== I.SPLASH).map((id) => this.slotHTML({ id, count: 1 }, 'creative:' + id)).join('')}${pots.map(([id, p]) => this.slotHTML({ id, count: 1, pot: p }, 'creative:' + id + ':' + p)).join('')}</div>`;
    } else if (this.mode === 'furnace') {
      const f = this.container;
      const fire = f.burn > 0 ? Math.max(0, f.burn / f.burnMax) : 0;
      top = `<div class="title">Furnace</div><div class="furnace">
        <div class="fcol">${this.slotHTML(f.input, 'f:input')}<div class="fire"><i style="height:${fire * 100}%"></i></div>${this.slotHTML(f.fuel, 'f:fuel')}</div>
        <div class="arrow"><i style="width:${(f.cook / 5) * 100}%"></i></div>
        ${this.slotHTML(f.output, 'f:output', 'big')}</div>`;
    } else if (this.mode === 'brewing') {
      const b = this.container;
      top = `<div class="title">Brewing Stand</div><div class="brewing"><div class="fcol">${this.slotHTML(b.fuel, 'b:fuel', '', '🔥')}<small>${b.uses} uses</small></div>
        <div class="fcol">${this.slotHTML(b.ingredient, 'b:ingredient', '', '⚗')}<div class="arrow down"><i style="width:${(b.t / 5) * 100}%"></i></div>
        <div class="row3">${this.slotHTML(b.b0, 'b:b0', '', '🧪')}${this.slotHTML(b.b1, 'b:b1', '', '🧪')}${this.slotHTML(b.b2, 'b:b2', '', '🧪')}</div></div></div>`;
    } else if (this.mode === 'anvil') {
      const r = anvilResult(this.anvil.l, this.anvil.r);
      top = `<div class="title">Repair & combine</div><div class="crafting">${this.slotHTML(this.anvil.l, 'an:l')}<span>+</span>${this.slotHTML(this.anvil.r, 'an:r')}<div class="arrow static">➜</div>${this.slotHTML(r?.out, 'an:out', 'big')}</div>
        <div class="hint">${r ? `Cost: ${r.cost} level${r.cost === 1 ? '' : 's'}${!g.creative() && g.levels() < r.cost ? ' — not enough' : ''}` : 'Put a damaged tool or armour on the left, and the same item or its material on the right.'}</div>`;
    } else if (this.mode === 'chest') {
      top = `<div class="title">Chest</div><div class="grid9">${this.container.slots.map((s, i) => this.slotHTML(s, 'c:' + i)).join('')}</div>`;
    } else if (this.mode === 'enchant') {
      const it = this.ench.item, lap = this.ench.lapis;
      const list = it && !it.ench && enchantsFor(it.id);
      const lv = g.levels();
      const opts = [0, 1, 2].map((i) => {
        if (!list) return `<button class="opt" disabled>—</button>`;
        const kind = list[(it.id + i + g.enchantSeed) % list.length];
        const cost = ENCH_COST[i];
        const ok = g.creative() || (lv >= cost && (lap?.count || 0) >= i + 1);
        return `<button class="opt" data-ench="${i}" ${ok ? '' : 'disabled'}>${ENCH_NAMES[kind]} ${ROMAN[i + 1]} <small>${cost} levels · ${i + 1} lapis</small></button>`;
      }).join('');
      top = `<div class="title">Enchant — you have ${lv} level${lv === 1 ? '' : 's'}</div><div class="enchant"><div class="fcol">${this.slotHTML(it, 'e:item', '', '⚒')}${this.slotHTML(lap, 'e:lapis', '', '◆')}</div><div class="opts">${opts}</div></div>`;
    } else if (this.mode === 'trade') {
      const v = this.container;
      const rows = TRADES[v.profession].map(([[gid, gn], [rid, rn]], i) => {
        const can = inv.count(gid) >= gn;
        return `<div class="trade">${this.slotHTML({ id: gid, count: gn }, 'x')}<span>➜</span>${this.slotHTML({ id: rid, count: rn }, 'x')}<button class="opt" data-trade="${i}" ${can ? '' : 'disabled'}>Trade</button></div>`;
      }).join('');
      top = `<div class="title">${PROFESSIONS[v.profession]}</div><div class="trades">${rows}</div>`;
    } else {
      const w = this.craftW;
      const res = this.result();
      const armor = this.mode === 'inv' ? `<div class="armor">${inv.armor.map((s, i) => this.slotHTML(s, 'a:' + i, '', ['⛑', '👕', '👖', '👢'][i])).join('')}</div>` : '';
      top = `<div class="title">Crafting</div><div class="crafting">${armor}
        <div class="cgrid" style="grid-template-columns:repeat(${w},var(--slot))">${this.craft.map((s, i) => this.slotHTML(s, 'k:' + i)).join('')}</div>
        <div class="arrow static">➜</div>${this.slotHTML(res, 'result', 'big')}</div>
        ${this.mode === 'inv' ? '<div class="hint">Need a 3×3 grid? Place a Crafting Table and right-click it.</div>' : ''}`;
    }
    this.root.innerHTML = `<div class="panel">${top}
      <div class="title">Inventory</div>
      <div class="grid9">${inv.slots.slice(9).map((s, i) => this.slotHTML(s, 'i:' + (i + 9))).join('')}</div>
      <div class="grid9 hot">${inv.slots.slice(0, 9).map((s, i) => this.slotHTML(s, 'i:' + i)).join('')}</div>
      <div class="hint">Left-click: pick up / place · Right-click: split / place one · Shift-click: quick move · E: close</div>
    </div>`;
    this.renderCursor();
  }
  renderCursor() {
    const c = this.cursor;
    this.cursorEl.style.display = c ? 'block' : 'none';
    this.cursorEl.innerHTML = c ? `<img src="${stackIcon(c)}">${c.count > 1 ? `<span class="count">${c.count}</span>` : ''}` : '';
    this.placeCursor();
  }
  result() {
    const grid = this.craft.map((s) => (s ? s.id : 0));
    return matchRecipe(grid, this.craftW);
  }

  // get/set a slot by its data-src
  get(src) {
    const [k, v] = src.split(':');
    if (k === 'i') return this.game.inv.slots[+v];
    if (k === 'a') return this.game.inv.armor[+v];
    if (k === 'k') return this.craft[+v];
    if (k === 'c') return this.container.slots[+v];
    if (k === 'f') return this.container[v];
    if (k === 'e') return this.ench[v];
    if (k === 'b') return this.container[v];
    if (k === 'an') return this.anvil[v];
    return null;
  }
  set(src, s) {
    const [k, v] = src.split(':');
    if (s && s.count <= 0) s = null;
    if (k === 'i') this.game.inv.slots[+v] = s;
    else if (k === 'a') this.game.inv.armor[+v] = s;
    else if (k === 'k') this.craft[+v] = s;
    else if (k === 'c') this.container.slots[+v] = s;
    else if (k === 'f') this.container[v] = s;
    else if (k === 'e') this.ench[v] = s;
    else if (k === 'b') this.container[v] = s;
    else if (k === 'an') this.anvil[v] = s;
  }
  // which stacks a slot accepts
  accepts(src, s) {
    if (!s) return true;
    const [k, v] = src.split(':');
    if (k === 'a') return info(s.id)?.armor?.slot === +v;
    if (k === 'e' && v === 'lapis') return s.id === I.LAPIS;
    if (k === 'e' && v === 'item') return !!enchantsFor(s.id);
    if (k === 'b' && v === 'fuel') return s.id === I.BLAZE_POWDER;
    if (k === 'b' && v.startsWith('b')) return (s.id === I.POTION || s.id === I.SPLASH) && s.count === 1;
    return true;
  }

  onClick(e) {
    if (!this.mode) return;
    const btn = e.target.closest('button.opt');
    if (btn) { e.preventDefault(); if (btn.disabled) return; if (btn.dataset.ench) this.doEnchant(+btn.dataset.ench); else this.doTrade(+btn.dataset.trade); return; }
    const el = e.target.closest('.slot');
    if (!el || el.dataset.src === 'x') return;
    e.preventDefault();
    const src = el.dataset.src;
    const right = e.button === 2;
    this.game.audio?.click();
    if (src.startsWith('creative:')) {
      const [, sid, pot] = src.split(':'); const id = +sid;
      const tooly = info(id)?.tool || info(id)?.armor;
      const extra = { ...(tooly ? { dmg: 0 } : {}), ...(pot ? { pot } : {}) };
      if (this.cursor) this.cursor = null;
      else if (e.shiftKey) this.game.inv.add({ id, count: maxStack(id), ...extra });
      else this.cursor = { id, count: right ? 1 : maxStack(id), ...extra };
      return this.render();
    }
    if (src === 'an:out') {
      const r = anvilResult(this.anvil.l, this.anvil.r);
      if (!r || this.cursor) return;
      if (!this.game.creative()) { if (this.game.levels() < r.cost) return; this.game.spendLevels(r.cost); }
      this.cursor = r.out; this.anvil.l = null;
      this.anvil.r.count -= r.useRight; if (this.anvil.r.count <= 0) this.anvil.r = null;
      this.game.audio?.material('stone', 1);
      return this.render();
    }
    if (src === 'result') return this.takeResult(e.shiftKey);
    if (src === 'f:output') {
      const s = this.get(src);
      if (!s) return;
      if (!this.cursor) { this.cursor = s; this.set(src, null); }
      else if (this.cursor.id === s.id && this.cursor.count + s.count <= maxStack(s.id)) { this.cursor.count += s.count; this.set(src, null); }
      else return;
      this.game.addXp?.(Math.ceil(s.count * 0.3));
      return this.render();
    }
    if (e.shiftKey && !right) return this.quickMove(src);
    const s = this.get(src);
    const c = this.cursor;
    if (c && !this.accepts(src, c)) return;
    if (!right) {
      if (!c) { this.cursor = s; this.set(src, null); }
      else if (!s) { this.set(src, c); this.cursor = null; }
      else if (sameKind(s, c)) {
        const k = Math.min(c.count, maxStack(s.id) - s.count);
        s.count += k; c.count -= k; if (c.count <= 0) this.cursor = null;
      } else { this.set(src, c); this.cursor = s; }
    } else {
      if (!c && s) { const half = Math.ceil(s.count / 2); this.cursor = { ...s, count: half }; s.count -= half; this.set(src, s.count ? s : null); }
      else if (c && (!s || (sameKind(s, c) && s.count < maxStack(s.id)))) {
        if (s) s.count++; else this.set(src, { ...c, count: 1 });
        c.count--; if (c.count <= 0) this.cursor = null;
      }
    }
    this.render();
  }

  quickMove(src) {
    const s = this.get(src);
    if (!s) return;
    const [k, v] = src.split(':');
    const inv = this.game.inv;
    if (k === 'i') {
      const arm = info(s.id)?.armor;
      if (this.mode === 'chest') {
        const left = addTo(this.container.slots, s);
        this.set(src, left ? { ...s, count: left } : null);
      } else if (this.mode === 'furnace') {
        const target = SMELT[s.id] ? 'input' : FUEL[s.id] ? 'fuel' : null;
        if (target && (!this.container[target] || this.container[target].id === s.id)) {
          const cur = this.container[target];
          const k2 = Math.min(s.count, maxStack(s.id) - (cur?.count || 0));
          this.container[target] = { id: s.id, count: (cur?.count || 0) + k2 };
          s.count -= k2; this.set(src, s.count ? s : null);
        }
      } else if (this.mode === 'brewing') {
        const b = this.container;
        const slot = s.id === I.BLAZE_POWDER && !b.fuel ? 'fuel' : (s.id === I.POTION || s.id === I.SPLASH) ? ['b0', 'b1', 'b2'].find((q) => !b[q]) : !b.ingredient ? 'ingredient' : null;
        if (slot) { if (slot.startsWith('b') && s.count > 1) { b[slot] = { ...s, count: 1 }; s.count--; } else { b[slot] = s; this.set(src, null); } }
      } else if (this.mode === 'anvil') {
        const slot = !this.anvil.l ? 'l' : !this.anvil.r ? 'r' : null;
        if (slot) { this.anvil[slot] = s; this.set(src, null); }
      } else if (this.mode === 'enchant') {
        const slot = s.id === I.LAPIS ? 'lapis' : enchantsFor(s.id) ? 'item' : null;
        if (slot && !this.ench[slot]) { this.ench[slot] = s; this.set(src, null); }
      } else if (arm && this.mode === 'inv' && !inv.armor[arm.slot]) {
        inv.armor[arm.slot] = s; this.set(src, null);
      } else {
        const i = +v;
        const range = i < 9 ? [9, 36] : [0, 9];
        const tmp = inv.slots.slice(range[0], range[1]);
        const left = addTo(tmp, s);
        inv.slots.splice(range[0], range[1] - range[0], ...tmp);
        this.set(src, left ? { ...s, count: left } : null);
      }
    } else {
      const left = inv.add(s);
      this.set(src, left ? { ...s, count: left } : null);
    }
    this.render();
  }

  takeResult(all) {
    let crafted = 0;
    do {
      const res = this.result();
      if (!res) break;
      const made = { ...res, ...(info(res.id)?.tool || info(res.id)?.armor ? { dmg: 0 } : {}) };
      if (all) {
        const left = this.game.inv.add(made);
        if (left) this.game.dropStack({ ...made, count: left });
      } else {
        const c = this.cursor;
        if (c && (!sameKind(c, res) || c.count + res.count > maxStack(res.id))) break;
        if (c) c.count += res.count; else this.cursor = made;
      }
      for (let i = 0; i < this.craft.length; i++) {
        const s = this.craft[i];
        if (!s) continue;
        if (--s.count <= 0) this.craft[i] = null;
      }
      crafted++;
    } while (all && crafted < 64);
    this.render();
  }

  doEnchant(i) {
    const g = this.game, it = this.ench.item;
    const list = it && enchantsFor(it.id);
    if (!list || it.ench) return;
    const cost = ENCH_COST[i];
    if (!g.creative()) {
      if (g.levels() < cost || (this.ench.lapis?.count || 0) < i + 1) return;
      g.spendLevels(cost);
      this.ench.lapis.count -= i + 1;
      if (this.ench.lapis.count <= 0) this.ench.lapis = null;
    }
    const kind = list[(it.id + i + g.enchantSeed) % list.length];
    it.ench = { [kind]: i + 1 };
    if (i === 2 && kind !== 'unbreaking') it.ench.unbreaking = 1;
    g.enchantSeed++;
    g.audio?.pop();
    this.render();
  }
  doTrade(i) {
    const [[gid, gn], [rid, rn]] = TRADES[this.container.profession][i];
    const inv = this.game.inv;
    if (inv.count(gid) < gn) return;
    inv.take(gid, gn);
    const made = { id: rid, count: rn, ...(info(rid)?.tool || info(rid)?.armor ? { dmg: 0 } : {}) };
    const left = inv.add(made);
    if (left) this.game.dropStack({ ...made, count: left });
    this.game.addXp?.(2);
    this.game.audio?.pop();
    this.render();
  }
}

function addTo(slots, stack) {
  let n = stack.count;
  const ms = maxStack(stack.id);
  for (let i = 0; i < slots.length && n > 0; i++) {
    const s = slots[i];
    if (s && sameKind(s, stack) && s.count < ms) { const k = Math.min(n, ms - s.count); s.count += k; n -= k; }
  }
  for (let i = 0; i < slots.length && n > 0; i++) if (!slots[i]) { const k = Math.min(n, ms); slots[i] = { ...stack, count: k }; n -= k; }
  return n;
}
