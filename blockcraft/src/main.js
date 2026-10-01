// BlockCraft — game loop, player, input, HUD, menus, dimensions, saving.
import * as THREE from 'three';
import { World, makeMaterials, CS, CH, SEA, rayBox } from './world.js';
import { B, I, BLOCKS, info, isBlock, isFluid, getAtlas, iconURL, stackIcon, stackName, POTIONS, TILE, ATLAS_COLS, T } from './blocks.js';
import { moveAABB, aabbOverlapsBlock, blocked, ItemDrop, Mob, Projectile, MOB_TYPES, Boat, Minecart, Bobber } from './entities.js';
import { Redstone } from './redstone.js';
import { Inventory, InventoryUI, tickFurnace, newFurnace, newChest, newBrewing, tickBrewing, maxStack, enchLabel } from './inventory.js';
import { strongholdPos, buildExitPortal } from './gen.js';
import { Audio } from './audio.js';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'blockcraft.save.v2';
// Opened from the learning app's /play page (?key=…&until=…): /play bought the game time, put the child's newest save on
// this device under `key`, and gets the child back when the time is up — it uploads that save to the account then.
// The game only plays until `until` (ms), saves under `key`, and returns to /play. Standalone, it keeps its own save
// and shows the title screen.
// ponytail: `until` comes from the URL, so a child who edits it plays longer; the points were already spent by the
// database either way. Move the check into the game (read game_wallet) if that ever matters.
const Q = new URLSearchParams(location.search);
const PLAY = Q.has('key') && Q.has('until') ? { key: Q.get('key'), until: +Q.get('until') } : null;
const BACK = '/play';
const SETTINGS_KEY = 'blockcraft.settings';
const DAY = 1200; // seconds per full day
const REACH = 5;
const P_HW = 0.3, P_H = 1.8, EYE = 1.62;
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const FACING = (yaw) => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); return Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : 3) : (fz > 0 ? 2 : 0); };

// ------------------------------------------------------------------ renderer / scene
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 1000);
camera.rotation.order = 'YXZ';
scene.fog = new THREE.Fog(0x87ceeb, 60, 100);
const hemi = new THREE.HemisphereLight(0xffffff, 0x666666, 1.0); scene.add(hemi);
const dirL = new THREE.DirectionalLight(0xffffff, 0.8); dirL.position.set(0.4, 1, 0.3); scene.add(dirL);

const atlasTex = new THREE.CanvasTexture(getAtlas());
atlasTex.magFilter = THREE.NearestFilter; atlasTex.minFilter = THREE.NearestFilter; atlasTex.generateMipmaps = false;
atlasTex.colorSpace = THREE.NoColorSpace; // custom shader outputs raw sRGB
const mats = makeMaterials(atlasTex);

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ------------------------------------------------------------------ sky
const sky = new THREE.Group(); scene.add(sky);
const sun = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0xfff3a0, fog: false }));
const moon = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), new THREE.MeshBasicMaterial({ color: 0xdfe6ff, fog: false }));
sky.add(sun, moon);
const starGeo = new THREE.BufferGeometry();
{
  const p = [];
  for (let i = 0; i < 900; i++) {
    const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.05, Math.random() - 0.5).normalize().multiplyScalar(450);
    p.push(v.x, v.y, v.z);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
}
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true }));
sky.add(stars);
const cloudCv = document.createElement('canvas'); cloudCv.width = cloudCv.height = 64;
{
  const c = cloudCv.getContext('2d');
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const v = Math.sin(x * 0.35) * Math.cos(y * 0.28) + Math.sin((x + y) * 0.17) + Math.cos(x * 0.09 - y * 0.21) * 0.8;
    if (v > 0.9) { c.fillStyle = '#fff'; c.fillRect(x, y, 1, 1); }
  }
}
const cloudTex = new THREE.CanvasTexture(cloudCv);
cloudTex.magFilter = THREE.NearestFilter; cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping;
const CLOUD_SPAN = 64 * 12, CLOUD_SIZE = 1400;
cloudTex.repeat.set(CLOUD_SIZE / CLOUD_SPAN, CLOUD_SIZE / CLOUD_SPAN);
const clouds = new THREE.Mesh(new THREE.PlaneGeometry(CLOUD_SIZE, CLOUD_SIZE), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
clouds.rotation.x = -Math.PI / 2; clouds.position.y = CH + 4;
scene.add(clouds);

// ------------------------------------------------------------------ selection + cracks
const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }));
outline.visible = false; scene.add(outline);
const crackTex = [];
for (let s = 0; s < 10; s++) {
  const cv = document.createElement('canvas'); cv.width = cv.height = TILE;
  const t = T['crack' + s];
  cv.getContext('2d').drawImage(getAtlas(), (t % ATLAS_COLS) * TILE, Math.floor(t / ATLAS_COLS) * TILE, TILE, TILE, 0, 0, TILE, TILE);
  const tx = new THREE.CanvasTexture(cv); tx.magFilter = THREE.NearestFilter; tx.minFilter = THREE.NearestFilter;
  crackTex.push(tx);
}
const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.006, 1.006, 1.006), new THREE.MeshBasicMaterial({ map: crackTex[0], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
crackMesh.visible = false; scene.add(crackMesh);

// ------------------------------------------------------------------ state
const audio = new Audio();
const settings = Object.assign({ rd: isTouch ? 4 : 6, fov: 75, vol: 50 }, safeParse(localStorage.getItem(SETTINGS_KEY)));
const newDimState = () => ({ edits: new Map(), extra: new Map(), portals: [] });
const G = {
  state: 'title', // title | loading | playing | paused | dead
  world: null, dim: 'overworld', dims: null,
  inv: new Inventory(), mobs: [], drops: [], projectiles: [], effects: [], vehicles: [], bobber: null, red: null,
  weather: { rain: 0, target: 0, thunder: false, t: 300 + Math.random() * 600, flash: 0 },
  time: 0.02, mode: 'creative', seed: 0, audio, enchantSeed: 0,
  spawnedVillages: new Set(),
  dropStack: (s) => dropStack(s),
  levels: () => player.level,
  spendLevels: (n) => { player.level = Math.max(0, player.level - n); updateHUD(true); },
  creative: () => G.mode === 'creative',
  addXp: (n) => addXp(n),
};
const player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0,
  ground: false, flying: false, spawn: null,
  sprint: false, stepT: 0,
  level: 0, xpProg: 0, portalT: 0, inPortal: false, effects: {}, riding: null, gliding: false,
  get mode() { return G.mode; },
};
const invUI = new InventoryUI($('inventory'), G);

function lockPointer() { try { const p = canvas.requestPointerLock(); p?.catch?.(() => {}); } catch { /* needs a user gesture */ } }
function safeParse(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }
const saveSettings = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage full or blocked */ } };

// ------------------------------------------------------------------ save / load
const packDim = (d) => ({ edits: [...d.edits].map(([k, m]) => [k, [...m]]), extra: [...d.extra], portals: d.portals, exitBuilt: d.exitBuilt });
const unpackDim = (d) => ({ edits: new Map((d?.edits || []).map(([k, arr]) => [k, new Map(arr)])), extra: new Map(d?.extra || []), portals: d?.portals || [], exitBuilt: !!d?.exitBuilt });
function save() {
  if (!G.world) return;
  const data = {
    v: 2, seed: G.seed, mode: G.mode, time: G.time, dim: G.dim, enchantSeed: G.enchantSeed,
    player: { pos: player.pos.toArray(), yaw: player.yaw, pitch: player.pitch, flying: player.flying, spawn: player.spawn, level: player.level, xpProg: player.xpProg },
    inv: G.inv.slots, armor: G.inv.armor, sel: G.inv.sel,
    dims: Object.fromEntries(Object.entries(G.dims).map(([k, d]) => [k, packDim(d)])),
    // things that should still be there next time: pets and vehicles near the player
    pets: G.mobs.filter((m) => m.owner).map((m) => ({ pos: m.pos.toArray(), sitting: !!m.sitting, hp: m.hp })),
    vehicles: G.vehicles.map((v) => ({ kind: v.kind, pos: v.pos.toArray(), yaw: v.yaw || 0, dir: v.dir })),
    effects: player.effects,
    savedAt: Date.now(),
  };
  try { localStorage.setItem(PLAY ? PLAY.key : SAVE_KEY, JSON.stringify(data)); } catch { toast('Could not save — browser storage is full'); }
}
const hasSave = () => !!localStorage.getItem(SAVE_KEY);

function clearEntities() {
  for (const list of [G.mobs, G.drops, G.projectiles, G.vehicles]) list.forEach((e) => e.dispose());
  G.mobs = []; G.drops = []; G.projectiles = []; G.vehicles = [];
  if (G.bobber) { G.bobber.dispose(); G.bobber = null; }
  player.riding = null; player.gliding = false;
  G.effects.forEach((e) => scene.remove(e.mesh)); G.effects = [];
}

function makeWorld(dim) {
  if (G.world) G.world.dispose();
  G.dim = dim;
  const w = new World(dim, G.seed, scene, mats, G.dims[dim]);
  w.renderDist = settings.rd;
  w.onBlockChange = onBlockChange;
  G.world = w;
  G.red = new Redstone(w, {
    pushEntities: (x, y, z, d) => { if (aabbOverlapsBlock(player.pos, P_HW, P_H, x, y, z)) player.pos.add(new THREE.Vector3(...d)); for (const m of G.mobs) if (aabbOverlapsBlock(m.pos, m.hw, m.h, x, y, z)) m.pos.add(new THREE.Vector3(...d)); },
    sound: (k) => (k === 'piston' ? audio.material('wood', 1.2) : k === 'door' ? audio.material('wood', 0.8) : audio.click()),
  });
  return w;
}

function startWorld(data) {
  clearEntities();
  G.seed = data.seed; G.mode = 'creative'; // creative only: a calm break for kids, no survival G.time = data.time ?? 0.02; G.enchantSeed = data.enchantSeed || 0;
  G.dims = { overworld: unpackDim(data.dims?.overworld), nether: unpackDim(data.dims?.nether), end: unpackDim(data.dims?.end) };
  G.spawnedVillages = new Set();
  const w = makeWorld(data.dim || 'overworld');
  G.inv = new Inventory(data.inv || null, data.armor || null); G.inv.sel = data.sel || 0;
  if (!data.inv && G.mode === 'creative') [B.GRASS, B.DIRT, B.STONE, B.PLANKS, B.LOG, B.GLASS, B.BRICK, B.TORCH, B.LEAVES].forEach((id, i) => (G.inv.slots[i] = { id, count: 64 }));
  const p = data.player;
  player.spawn = p?.spawn || findSpawn(w);
  if (p) { player.pos.fromArray(p.pos); player.yaw = p.yaw; player.pitch = p.pitch; player.flying = p.flying && G.mode === 'creative'; player.level = p.level || 0; player.xpProg = p.xpProg || 0; }
  else { player.pos.set(player.spawn[0] + 0.5, player.spawn[1], player.spawn[2] + 0.5); player.flying = false; player.level = 0; player.xpProg = 0; }
  player.vel.set(0, 0, 0); player.effects = {};
  for (const p of data.pets || []) { const m = new Mob(scene, 'wolf', ...p.pos); m.owner = true; m.sitting = p.sitting; m.hp = p.hp; G.mobs.push(m); }
  for (const v of data.vehicles || []) { const o = v.kind === 'boat' ? new Boat(scene, ...v.pos, v.yaw) : new Minecart(scene, ...v.pos); if (v.dir) o.dir = v.dir; G.vehicles.push(o); }
  player.effects = data.effects || {};
  G.state = 'loading';
  show('loading');
}

function findSpawn(w) {
  for (let r = 0; r < 800; r += 8) {
    for (let a = 0; a < 8; a++) {
      const x = Math.round(Math.cos(a * Math.PI / 4) * r), z = Math.round(Math.sin(a * Math.PI / 4) * r);
      const { h, biome } = w.biomeAt(x, z);
      if (h > SEA + 1 && biome !== 'mountains') return [x, h + 1, z];
      if (r === 0) break;
    }
  }
  return [0, 90, 0];
}

// ------------------------------------------------------------------ menus
const screens = ['title', 'pause', 'loading', 'inventory'];
function show(name) {
  for (const s of screens) $(s).classList.toggle('hidden', s !== name);
  $('hud').classList.toggle('hidden', !['playing', 'paused', 'dead'].includes(G.state) && name !== 'inventory');
  $('touch').classList.toggle('hidden', !isTouch || G.state !== 'playing' || name === 'inventory');
  if (name === 'title') $('bContinue').classList.toggle('hidden', !hasSave());
}
if (PLAY) {
  const goBack = () => { save(); location.replace(BACK); };
  $('bQuit').textContent = 'Save and go back';
  $('bQuit').onclick = goBack;
  if (Date.now() >= PLAY.until) location.replace(BACK);
  // after the rest of this module has run, as the old message-driven start was
  else { show('loading'); setTimeout(() => startWorld(safeParse(localStorage.getItem(PLAY.key)) || { seed: (Math.random() * 2 ** 31) | 0 })); }
  const tick = setInterval(() => {
    const left = Math.max(0, Math.ceil((PLAY.until - Date.now()) / 1000));
    $('timer').textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    // time is up: save, freeze, say so, and go back to /play, which uploads the save
    if (left === 0 && G.world) {
      clearInterval(tick); save(); G.state = 'title'; document.exitPointerLock?.(); keys.clear();
      toast("Time's up! Your world is saved."); setTimeout(() => location.replace(BACK), 2500);
    }
  }, 1000);
} else show('title');

$('bNew').onclick = () => { audio.unlock(); $('newWorld').classList.toggle('hidden'); $('help').classList.add('hidden'); $('overwriteWarn').classList.toggle('hidden', !hasSave()); };
$('bHelp').onclick = () => { $('help').classList.toggle('hidden'); $('newWorld').classList.add('hidden'); };
$('bContinue').onclick = () => { audio.unlock(); const d = safeParse(localStorage.getItem(SAVE_KEY)); if (d) startWorld(d); };
$('bCreate').onclick = () => {
  audio.unlock();
  const s = $('seed').value.trim();
  let seed = s ? (/^-?\d+$/.test(s) ? +s : [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7)) : (Math.random() * 2 ** 31) | 0;
  seed |= 0;
  startWorld({ seed });
};
$('bResume').onclick = () => resume();
$('bQuit').onclick = () => { save(); G.state = 'title'; clearEntities(); show('title'); };
for (const [id, k, fmt] of [['rd', 'rd', (v) => v + ' chunks'], ['fov', 'fov', (v) => v + '°'], ['vol', 'vol', (v) => v + '%']]) {
  const el = $(id);
  el.value = settings[k]; $(id + 'v').textContent = fmt(settings[k]);
  el.oninput = () => { settings[k] = +el.value; $(id + 'v').textContent = fmt(settings[k]); applySettings(); saveSettings(); };
}
function applySettings() {
  camera.fov = settings.fov; camera.updateProjectionMatrix();
  audio.vol = settings.vol / 100;
  if (G.world) G.world.renderDist = settings.rd;
}
applySettings();

function pause() {
  if (G.state !== 'playing') return;
  if (invUI.open) invUI.hide();
  G.state = 'paused'; keys.clear(); mouse.left = mouse.right = false;
  show('pause'); save();
}
function resume() {
  audio.unlock();
  G.state = 'playing'; show(null);
  if (!isTouch) lockPointer();
}
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas && G.state === 'playing' && !invUI.open) pause();
});

// ------------------------------------------------------------------ input
const keys = new Set();
const mouse = { left: false, right: false };
let lastW = 0, lastSpace = 0;
const sneaking = () => keys.has('ShiftLeft') || keys.has('ShiftRight');
addEventListener('keydown', (e) => {
  if (G.state === 'title') return;
  if (invUI.open) {
    if (e.code === 'KeyE' || e.code === 'Escape') { closeInventory(); e.preventDefault(); }
    return;
  }
  if (G.state !== 'playing') { if (e.code === 'Escape' && G.state === 'paused') resume(); return; }
  if (e.repeat && !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) return;
  keys.add(e.code);
  const now = performance.now();
  if (e.code === 'KeyW') { if (now - lastW < 280) player.sprint = true; lastW = now; }
  if (e.code === 'ControlLeft' || e.code === 'ControlRight') player.sprint = true;
  if (e.code === 'Space') {
    if (G.mode === 'creative' && now - lastSpace < 300) { player.flying = !player.flying; player.vel.y = 0; }
    lastSpace = now;
    e.preventDefault();
  }
  if (e.code.startsWith('Digit')) { const n = +e.code.slice(5); if (n >= 1 && n <= 9) selectSlot(n - 1); }
  if (e.code === 'KeyE') openInventory(G.mode === 'creative' ? 'creative' : 'inv');
  if (e.code === 'KeyQ') dropHeld(e.ctrlKey);
  if (e.code === 'F3') { $('debug').classList.toggle('hidden'); e.preventDefault(); }
  if (e.code === 'Escape') pause();
});
addEventListener('keyup', (e) => {
  keys.delete(e.code);
  if (e.code === 'KeyW') player.sprint = false;
});
addEventListener('blur', () => { keys.clear(); mouse.left = mouse.right = false; });
canvas.addEventListener('mousedown', (e) => {
  if (isTouch || G.state !== 'playing') return;
  if (document.pointerLockElement !== canvas) { lockPointer(); return; }
  if (e.button === 0) { mouse.left = true; attackOrStart(); }
  if (e.button === 2) { mouse.right = true; useItem(); useRepeat = 0.3; }
  if (e.button === 1) pickBlock();
});
addEventListener('mouseup', (e) => {
  if (e.button === 0) mouse.left = false;
  if (e.button === 2) mouse.right = false;
});
addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousemove', (e) => {
  if (G.state !== 'playing' || document.pointerLockElement !== canvas) return;
  look(e.movementX, e.movementY, 0.0022);
});
addEventListener('wheel', (e) => {
  if (G.state !== 'playing' || invUI.open) return;
  selectSlot((G.inv.sel + (e.deltaY > 0 ? 1 : -1) + 9) % 9);
}, { passive: true });
function look(dx, dy, s) {
  player.yaw -= dx * s;
  player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, player.pitch - dy * s));
}
function selectSlot(i) { G.inv.sel = i; breakState = null; updateHotbar(); showItemName(); }

// ------------------------------------------------------------------ touch controls
const touch = { moveX: 0, moveZ: 0, stickId: null, lookId: null, lookStart: 0, lookMoved: 0, lx: 0, ly: 0, holdTimer: 0 };
if (isTouch) {
  const stick = $('stick'), knob = $('knob');
  const stickMove = (t) => {
    const r = stick.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy), max = r.width / 2;
    if (len > max) { dx *= max / len; dy *= max / len; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    touch.moveX = dx / max; touch.moveZ = dy / max;
    player.sprint = len > max * 0.95;
  };
  stick.addEventListener('touchstart', (e) => { e.preventDefault(); audio.unlock(); const t = e.changedTouches[0]; touch.stickId = t.identifier; stickMove(t); });
  stick.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === touch.stickId) stickMove(t); });
  const endStick = (e) => { for (const t of e.changedTouches) if (t.identifier === touch.stickId) { touch.stickId = null; touch.moveX = touch.moveZ = 0; knob.style.transform = ''; player.sprint = false; } };
  stick.addEventListener('touchend', endStick); stick.addEventListener('touchcancel', endStick);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); audio.unlock();
    if (G.state !== 'playing' || touch.lookId !== null) return;
    const t = e.changedTouches[0];
    touch.lookId = t.identifier; touch.lx = t.clientX; touch.ly = t.clientY; touch.lookStart = performance.now(); touch.lookMoved = 0;
    clearTimeout(touch.holdTimer);
    touch.holdTimer = setTimeout(() => { if (touch.lookId !== null && touch.lookMoved < 14) { mouse.left = true; attackOrStart(); } }, 300);
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === touch.lookId) {
      const dx = t.clientX - touch.lx, dy = t.clientY - touch.ly;
      touch.lookMoved += Math.abs(dx) + Math.abs(dy);
      touch.lx = t.clientX; touch.ly = t.clientY;
      look(dx, dy, 0.006);
    }
  }, { passive: false });
  const endLook = (e) => {
    for (const t of e.changedTouches) if (t.identifier === touch.lookId) {
      clearTimeout(touch.holdTimer);
      const short = performance.now() - touch.lookStart < 280 && touch.lookMoved < 14;
      if (short && G.state === 'playing' && !attackMob()) useItem();
      touch.lookId = null; mouse.left = false;
    }
  };
  canvas.addEventListener('touchend', endLook); canvas.addEventListener('touchcancel', endLook);
  const hold = (id, code) => {
    const el = $(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys.add(code); if (code === 'Space') { const now = performance.now(); if (G.mode === 'creative' && now - lastSpace < 300) player.flying = !player.flying; lastSpace = now; } });
    el.addEventListener('touchend', (e) => { e.preventDefault(); keys.delete(code); });
    el.addEventListener('touchcancel', () => keys.delete(code));
  };
  hold('tJump', 'Space'); hold('tDown', 'ShiftLeft');
  const tap = (id, fn) => $(id).addEventListener('touchstart', (e) => { e.preventDefault(); fn(); });
  tap('tFly', () => { if (G.mode === 'creative') { player.flying = !player.flying; player.vel.y = 0; } });
  tap('tInv', () => openInventory(G.mode === 'creative' ? 'creative' : 'inv'));
  tap('tPause', () => pause());
  tap('tDrop', () => dropHeld(false));
  $('inventory').addEventListener('touchstart', (e) => { if (e.target.id === 'inventory') { e.preventDefault(); closeInventory(); } });
  $('inventory').addEventListener('touchstart', (e) => {
    const el = e.target.closest('.slot, button.opt'); if (!el) return;
    e.preventDefault();
    const t = e.touches[0]; invUI.mx = t.clientX; invUI.my = t.clientY;
    invUI.onClick({ target: el, button: 0, shiftKey: false, preventDefault() {} });
  }, { passive: false });
}
$('hotbar').addEventListener('pointerdown', (e) => { const s = e.target.closest('.slot'); if (s) selectSlot(+s.dataset.i); });

// ------------------------------------------------------------------ inventory screens
function openInventory(mode, container) {
  if (G.state !== 'playing') return;
  invUI.show(mode, container);
  document.exitPointerLock?.();
  keys.clear(); mouse.left = mouse.right = false;
  show('inventory');
}
function closeInventory() {
  invUI.hide();
  show(null);
  updateHotbar();
  if (!isTouch) lockPointer();
}

// ------------------------------------------------------------------ targeting
let target = null;      // { x,y,z,id,meta,normal } or { mob }
let breakState = null;  // { x,y,z,t }
let useRepeat = 0, attackCD = 0, placeCD = 0;
const eyePos = () => new THREE.Vector3(player.pos.x, player.pos.y + EYE, player.pos.z);
const lookDir = () => new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ'));

function updateTarget() {
  const o = eyePos(), d = lookDir();
  const hit = G.world.raycast(o, d, REACH);
  let mob = null, md = hit ? hit.dist : REACH;
  for (const m of [...G.mobs, ...G.vehicles]) { if (m === player.riding) continue; const t = m.rayHit(o, d, md); if (t != null && t < md) { md = t; mob = m; } }
  target = mob ? { mob } : hit;
  if (hit && !mob) {
    outline.visible = true;
    outline.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    outline.scale.set(1.004, 1.004, 1.004);
  } else outline.visible = false;
}

const heldTool = () => { const s = G.inv.held; return s ? info(s.id)?.tool : null; };
const ench = (s, k) => s?.ench?.[k] || 0;

// ------------------------------------------------------------------ XP
const need = (lv) => (lv < 16 ? 2 * lv + 7 : lv < 31 ? 5 * lv - 38 : 9 * lv - 158);
function addXp(n) {
  if (n <= 0) return;
  player.xpProg += n;
  let up = false;
  while (player.xpProg >= need(player.level)) { player.xpProg -= need(player.level); player.level++; up = true; }
  if (up) audio.tone(880, 0.25, 0.2, 'triangle', 440); else audio.pop();
  updateHUD(true);
}

// ------------------------------------------------------------------ hitting animals
function attackMob() {
  if (!target?.mob || target.mob.t?.villager || attackCD > 0) return false;
  const m = target.mob;
  const tool = heldTool();
  m.damage(tool ? tool.dmg : 1, player.pos, true);
  attackCD = 0.45;
  swing();
  audio.hurt();
  if (tool) wearTool(2);
  return true;
}
function attackOrStart() {
  if (attackMob()) return;
  if (target && !target.mob && G.mode === 'creative') { breakBlock(target); placeCD = 0.25; }
}

function shoot(kind, from, vel, owner, dmg, pot) { G.projectiles.push(new Projectile(scene, kind, from, vel, owner, dmg, pot)); }

// ------------------------------------------------------------------ explosions
function explode(x, y, z, power) {
  const w = G.world;
  const r = Math.ceil(power);
  const resist = new Set([B.BEDROCK, B.OBSIDIAN, B.END_FRAME, B.END_PORTAL, B.PORTAL, B.WATER, B.LAVA, B.ENCHANT_TABLE]);
  for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
    const d = Math.hypot(dx, dy, dz);
    if (d > power * (0.7 + Math.random() * 0.5)) continue;
    const bx = Math.floor(x + dx), by = Math.floor(y + dy), bz = Math.floor(z + dz);
    const id = w.getBlock(bx, by, bz);
    if (!id || resist.has(id)) continue;
    if (G.dim === 'overworld' && w.extra.has(`${bx},${by},${bz}`)) spillContainer(bx, by, bz);
    w.setBlock(bx, by, bz, B.AIR);
    const b = BLOCKS[id];
    if (G.mode === 'survival' && Math.random() < 0.3 && b.drop > 0) spawnDrop({ id: b.drop, count: 1 }, bx + 0.5, by + 0.5, bz + 0.5);
  }
  const c = new THREE.Vector3(x, y, z);
  audio.boom();
  const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
  flash.position.copy(c); scene.add(flash);
  G.effects.push({ mesh: flash, t: 0, max: 0.5, grow: power * 1.5 });
}

// ------------------------------------------------------------------ breaking
function breakTime(b) {
  if (b.hardness === Infinity) return Infinity;
  const s = G.inv.held, tool = heldTool();
  const right = tool && tool.kind === b.tool;
  const harvest = b.tier === 0 || (right && tool.tier >= b.tier);
  let speed = right ? tool.speed : 1;
  if (right && ench(s, 'efficiency')) speed += ench(s, 'efficiency') ** 2 + 1;
  let t = b.hardness * (harvest ? 1.5 : 5) / speed;
  const eye = G.world.getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y + EYE), Math.floor(player.pos.z));
  if (eye === B.WATER) t *= 5;
  if (!player.ground && !player.flying && eye !== B.WATER && !onLadder()) t *= 3;
  return t;
}
function canHarvest(b) {
  const tool = heldTool();
  return b.tier === 0 || (tool && tool.kind === b.tool && tool.tier >= b.tier);
}
function spillContainer(x, y, z) {
  const w = G.world, k = `${x},${y},${z}`, extra = w.extra.get(k);
  if (!extra) return;
  w.extra.delete(k);
  if (G.mode !== 'survival') return;
  const items = extra.type === 'chest' ? extra.slots : Object.values(extra).filter((v) => v && typeof v === 'object' && v.id);
  for (const s of items) if (s) spawnDrop(s, x + 0.5, y + 0.5, z + 0.5);
}

function breakBlock(t) {
  const w = G.world, b = BLOCKS[t.id];
  if (b.hardness === Infinity && G.mode !== 'creative') return;
  const meta = w.getMeta(t.x, t.y, t.z);
  w.setBlock(t.x, t.y, t.z, B.AIR);
  audio.broke(b.sound);
  spillContainer(t.x, t.y, t.z);
  if (t.id === B.DOOR) { const oy = meta & 8 ? t.y - 1 : t.y + 1; if (w.getBlock(t.x, oy, t.z) === B.DOOR) w.setBlock(t.x, oy, t.z, B.AIR); }
  if (G.mode === 'survival') {
    if (canHarvest(b)) {
      const drops = [];
      const add = (id, n = 1) => { if (n > 0) drops.push({ id, count: n }); };
      if (b.drop === -1) {
        if (Math.random() < 0.06) add(t.id === B.SPRUCE_LEAVES ? B.SPRUCE_SAPLING : B.SAPLING);
        if (t.id === B.LEAVES && Math.random() < 0.03) add(I.APPLE);
        if (Math.random() < 0.03) add(I.STICK);
      } else if (b.drop === -3) { if (Math.random() < 0.12) add(I.SEEDS); }
      else if (b.drop === -4) add(Math.random() < 0.1 ? I.FLINT : B.GRAVEL);
      else if (b.drop === -5) { if (meta >= 7) { add(I.WHEAT); add(I.SEEDS, 1 + (Math.random() * 3 | 0)); } else add(I.SEEDS); }
      else if (t.id === B.GLOWSTONE) add(I.GLOWSTONE_DUST, 2 + (Math.random() * 3 | 0));
      else if (t.id === B.LAPIS_ORE) add(I.LAPIS, 4 + (Math.random() * 5 | 0));
      else if (t.id === B.BOOKSHELF) add(I.BOOK, 3);
      else if (t.id === B.REDSTONE_ORE) add(I.REDSTONE, 4 + (Math.random() * 2 | 0));
      else if (b.drop === -6) add(I.WART, meta >= 3 ? 2 + (Math.random() * 3 | 0) : 1);
      else if (b.drop === -7) add(I.MELON_SLICE, 3 + (Math.random() * 5 | 0));
      else if (b.drop > 0) add(b.drop);
      for (const d of drops) spawnDrop(d, t.x + 0.5, t.y + 0.3, t.z + 0.5);
      if (b.xp) addXp(b.xp);
    }
    const tool = heldTool();
    if (tool && b.hardness > 0) wearTool(1);
  }
  // blocks resting on it fall off (plants, torches, cactus, crops, doors)
  const above = w.getBlock(t.x, t.y + 1, t.z), ab = BLOCKS[above];
  if (ab && (ab.cross || above === B.CACTUS || (above === B.DOOR && t.id !== B.DOOR) || above === B.LADDER && false)) breakBlock({ x: t.x, y: t.y + 1, z: t.z, id: above });
  if (t.id === B.FARMLAND || t.id === B.SAND) { /* crops above already handled */ }
  settleFalling(t.x, t.y + 1, t.z);
  swing();
}

function settleFalling(x, y, z) {
  const w = G.world;
  for (let yy = y; yy < CH; yy++) {
    const id = w.getBlock(x, yy, z);
    if (id !== B.SAND && id !== B.GRAVEL) break;
    let dy = yy;
    while (dy > 0) { const bl = BLOCKS[w.getBlock(x, dy - 1, z)]; if (bl && bl.solid) break; dy--; }
    if (dy !== yy) { w.setBlock(x, yy, z, B.AIR); w.setBlock(x, dy, z, id); }
  }
}

function wearTool(n) {
  const s = G.inv.held; if (!s || G.mode === 'creative') return;
  const tool = info(s.id)?.tool; if (!tool) return;
  const u = ench(s, 'unbreaking');
  if (u && Math.random() > 1 / (u + 1)) return;
  s.dmg = (s.dmg || 0) + n;
  if (s.dmg >= tool.dur) { G.inv.slots[G.inv.sel] = null; audio.broke('glass'); toast('Your tool broke!'); }
  updateHotbar();
}

// ------------------------------------------------------------------ portals
function onBlockChange(x, y, z, old, id) {
  G.red?.onChange(x, y, z, old, id);
  // a broken frame collapses the whole portal (each removal re-triggers its neighbours)
  if ((old === B.OBSIDIAN || old === B.PORTAL) && id !== B.PORTAL) {
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      if (G.world.getBlock(x + dx, y + dy, z + dz) === B.PORTAL) G.world.setBlock(x + dx, y + dy, z + dz, B.AIR);
    }
  }
}
function tryLightPortal(x, y, z) {
  const w = G.world;
  for (const axis of [0, 1]) {
    const seen = new Set([`${x},${y},${z}`]), cells = [[x, y, z]];
    let ok = true;
    for (let i = 0; i < cells.length && ok; i++) {
      const [cx, cy, cz] = cells[i];
      const nb = axis === 0 ? [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]] : [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
      for (const [dx, dy, dz] of nb) {
        const nx = cx + dx, ny = cy + dy, nz = cz + dz, k = `${nx},${ny},${nz}`;
        if (seen.has(k)) continue;
        const id = w.getBlock(nx, ny, nz);
        if (id === B.OBSIDIAN) continue;
        if (id !== B.AIR) { ok = false; break; }
        seen.add(k); cells.push([nx, ny, nz]);
        if (cells.length > 21 * 21) { ok = false; break; }
      }
    }
    if (!ok) continue;
    const ys = cells.map((c) => c[1]), hs = cells.map((c) => c[axis === 0 ? 0 : 2]);
    if (Math.max(...ys) - Math.min(...ys) < 2 || Math.max(...hs) - Math.min(...hs) < 1) continue;
    for (const [cx, cy, cz] of cells) w.setBlock(cx, cy, cz, B.PORTAL, axis);
    G.dims[G.dim].portals.push([x, Math.min(...ys), z]);
    audio.tone(200, 1.2, 0.3, 'sawtooth', 300);
    return true;
  }
  return false;
}
function checkEndPortal(fx, fy, fz) {
  const w = G.world;
  for (let cx = fx - 3; cx <= fx + 3; cx++) for (let cz = fz - 3; cz <= fz + 3; cz++) {
    let good = true;
    for (let i = -2; i <= 2 && good; i++) for (let j = -2; j <= 2; j++) {
      const ring = Math.abs(i) === 2 || Math.abs(j) === 2, corner = Math.abs(i) === 2 && Math.abs(j) === 2;
      if (!ring || corner) continue;
      if (w.getBlock(cx + i, fy, cz + j) !== B.END_FRAME || !(w.getMeta(cx + i, fy, cz + j) & 1)) { good = false; break; }
    }
    if (!good) continue;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) w.setBlock(cx + i, fy, cz + j, B.END_PORTAL);
    audio.tone(120, 2, 0.4, 'sine', 400);
    toast('The End portal is open!');
    return true;
  }
  return false;
}

function buildPortalAt(w, x, y, z) {
  for (let dx = -1; dx <= 2; dx++) for (let dy = -1; dy <= 3; dy++) {
    const frame = dx === -1 || dx === 2 || dy === -1 || dy === 3;
    w.setBlock(x + dx, y + dy, z, frame ? B.OBSIDIAN : B.PORTAL, 0);
    for (const dz of [-1, 1]) {
      if (dy === -1) { if (!BLOCKS[w.getBlock(x + dx, y - 1, z + dz)]?.solid) w.setBlock(x + dx, y - 1, z + dz, B.OBSIDIAN); }
      else if (dy < 3 && dx >= 0 && dx <= 1) w.setBlock(x + dx, y + dy, z + dz, B.AIR);
    }
  }
  G.dims[w.dim].portals.push([x, y, z]);
}

// switch dimension; how = 'portal' | 'end' | 'spawn'
function travel(dim, how) {
  const from = G.dim;
  save();
  const pets = G.mobs.filter((m) => m.owner && !m.sitting && m.pos.distanceTo(player.pos) < 16).map((m) => m.hp);
  clearEntities();
  const px = player.pos.x, pz = player.pos.z;
  const w = makeWorld(dim);
  const load = (x, z) => { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) w.ensureChunk(Math.floor(x / CS) + dx, Math.floor(z / CS) + dz); };
  if (how === 'portal') {
    const scale = from === 'overworld' ? 1 / 8 : 8;
    const tx = Math.floor(px * scale), tz = Math.floor(pz * scale);
    const near = G.dims[dim].portals.map((p) => [p, Math.hypot(p[0] - tx, p[2] - tz)]).filter(([, d]) => d < (dim === 'nether' ? 16 : 128)).sort((a, b) => a[1] - b[1])[0];
    let arrive;
    if (near) { load(near[0][0], near[0][2]); arrive = near[0]; }
    else {
      load(tx, tz);
      let y = dim === 'nether' ? 0 : w.surfaceY(tx, tz);
      if (dim === 'nether') {
        for (let yy = 34; yy < 100 && !y; yy++) if (BLOCKS[w.getBlock(tx, yy - 1, tz)]?.solid && !w.getBlock(tx, yy, tz) && !w.getBlock(tx, yy + 1, tz) && !w.getBlock(tx, yy + 2, tz)) y = yy;
        if (!y) y = 64;
      }
      buildPortalAt(w, tx, y, tz);
      arrive = [tx, y, tz];
    }
    player.pos.set(arrive[0] + 1, arrive[1], arrive[2] + 1.5);
    player.inPortal = true;
  } else if (how === 'end') {
    load(100, 0);
    player.pos.set(100.5, 49, 0.5); player.yaw = Math.PI / 2;
    player.inPortal = true;
  } else {
    const [x, , z] = player.spawn;
    load(x, z);
    player.pos.set(x + 0.5, w.surfaceY(x, z), z + 0.5);
  }
  player.vel.set(0, 0, 0); player.portalT = 0;
  for (const hp of pets) { const m = new Mob(scene, 'wolf', player.pos.x + 1, player.pos.y, player.pos.z); m.owner = true; m.hp = hp; G.mobs.push(m); }
  G.state = 'loading';
  show('loading');
}
// ------------------------------------------------------------------ using items
function useItem() {
  const s = G.inv.held;
  const w = G.world;
  // right-click a vehicle to ride it
  if (target?.mob && (target.mob instanceof Boat || target.mob instanceof Minecart)) return mount(target.mob);
  // right-click a mob
  if (target?.mob && target.mob instanceof Mob) {
    const m = target.mob;
    if (m.t.villager) return openInventory('trade', m);
    if (m.t.wolf) {
      if (!m.owner && s?.id === I.BONE) { if (G.mode === 'survival') G.inv.consumeHeld(); if (Math.random() < 0.34) { m.owner = true; m.hp = 20; m.sitting = true; toast('Tamed! Right-click it to make it sit or follow.'); audio.pop(); } else audio.click(); updateHotbar(); return; }
      if (m.owner && s && [I.BEEF, I.CHICKEN, I.COOKED_BEEF, I.COOKED_CHICKEN].includes(s.id) && m.hp < 20) { m.hp = Math.min(20, m.hp + 6); if (G.mode === 'survival') G.inv.consumeHeld(); updateHotbar(); return; }
      if (m.owner) { m.sitting = !m.sitting; toast(m.sitting ? 'Your wolf sits.' : 'Your wolf follows you.'); return; }
    }
    if (m.type === 'cow' && s?.id === I.BUCKET) { const milk = { id: I.MILK, count: 1 }; if (s.count > 1) { s.count--; if (G.inv.add(milk)) dropStack(milk); } else G.inv.slots[G.inv.sel] = milk; audio.splash(); updateHotbar(); return; }
    if (s && m.t.breed === s.id && m.love <= 0 && !(m.baby > 0)) { m.love = 30; if (G.mode === 'survival') G.inv.consumeHeld(); audio.pop(); updateHotbar(); return; }
  }
  // buckets need to see fluids
  if (s && (s.id === I.BUCKET || s.id === I.WATER_BUCKET || s.id === I.LAVA_BUCKET)) return useBucket(s);
  if (s && (s.id === I.ENDER_PEARL || (s.id === I.EYE_OF_ENDER && target?.id !== B.END_FRAME))) return throwItem(s);
  if (s?.id === I.ROD) return useRod(s);
  if (s?.id === I.EGG) { const d = lookDir(); shoot('egg', eyePos().addScaledVector(d, 0.5), d.multiplyScalar(18), 'player', 0); if (G.mode === 'survival') G.inv.consumeHeld(); updateHotbar(); return; }
  if (s?.id === I.SPLASH) { const d = lookDir(); shoot('potion', eyePos().addScaledVector(d, 0.5), d.multiplyScalar(12).add(new THREE.Vector3(0, 3, 0)), 'player', 0, s.pot); if (G.mode === 'survival') G.inv.consumeHeld(); swing(); updateHotbar(); return; }
  if (s?.id === I.POTION) { applyPotion(s.pot, 1); if (G.mode === 'survival') G.inv.slots[G.inv.sel] = { id: I.BOTTLE, count: 1 }; audio.eat(); updateHotbar(); return; }
  if (s?.id === I.MILK) { player.effects = {}; if (G.mode === 'survival') G.inv.slots[G.inv.sel] = { id: I.BUCKET, count: 1 }; audio.eat(); updateHotbar(); return; }
  if (s?.id === I.BOTTLE) {
    const hit = G.world.raycast(eyePos(), lookDir(), REACH, true);
    if (hit?.id === B.WATER) { const full = { id: I.POTION, count: 1, pot: 'water' }; if (G.mode === 'survival') { s.count--; if (s.count <= 0) G.inv.slots[G.inv.sel] = null; } if (G.inv.add(full)) dropStack(full); audio.splash(); updateHotbar(); }
    return;
  }
  if (s && (s.id === I.BOAT || s.id === I.MINECART)) return placeVehicle(s);
  // interact with blocks first
  if (target && !target.mob && !sneaking()) {
    const k = `${target.x},${target.y},${target.z}`;
    const id = target.id;
    if (id === B.TABLE) return openInventory('table');
    if (id === B.FURNACE) { if (!w.extra.has(k)) w.extra.set(k, newFurnace()); return openInventory('furnace', w.extra.get(k)); }
    if (id === B.CHEST) { if (!w.extra.has(k)) w.extra.set(k, newChest()); return openInventory('chest', w.extra.get(k)); }
    if (id === B.ENCHANT_TABLE) return openInventory('enchant');
    if (id === B.BREWING) { if (!w.extra.has(k)) w.extra.set(k, newBrewing()); return openInventory('brewing', w.extra.get(k)); }
    if (id === B.ANVIL) return openInventory('anvil');
    if (id === B.LEVER) { w.setBlock(target.x, target.y, target.z, B.LEVER, target.meta ^ 1); G.red.update(target.x, target.y, target.z); audio.click(); swing(); return; }
    if (id === B.BUTTON) { if (!(target.meta & 1)) { G.red.press(target.x, target.y, target.z, 1); audio.click(); swing(); } return; }
    if (id === B.DOOR) {
      const top = target.meta & 8, by = top ? target.y - 1 : target.y;
      const m = w.getMeta(target.x, by, target.z) ^ 4;
      w.setBlock(target.x, by, target.z, B.DOOR, m & ~8);
      w.setBlock(target.x, by + 1, target.z, B.DOOR, m | 8);
      audio.material('wood', 0.8); swing();
      return;
    }
    if (id === B.BED) {
      player.spawn = [target.x, target.y + 1, target.z];
      if (G.dim !== 'overworld') { explode(target.x + 0.5, target.y + 0.5, target.z + 0.5, 4); return; }
      if (mats.solid.uniforms.daylight.value < 0.5) { G.time = 0.0; toast('Good morning! Spawn point set.'); } else toast('Spawn point set. You can only sleep at night.');
      return;
    }
    if (id === B.END_FRAME && s?.id === I.EYE_OF_ENDER && !(target.meta & 1)) {
      w.setBlock(target.x, target.y, target.z, B.END_FRAME, 1);
      if (G.mode === 'survival') G.inv.consumeHeld();
      audio.pop(); updateHotbar();
      checkEndPortal(target.x, target.y, target.z);
      return;
    }
  }
  if (!s) return;
  const it = info(s.id);
  if (!it) return;
  if (it.armor) {
    const slot = it.armor.slot;
    const cur = G.inv.armor[slot];
    G.inv.armor[slot] = s; G.inv.slots[G.inv.sel] = cur;
    audio.material('stone', 0.6); updateHotbar(); updateHUD(true);
    return;
  }
  if (!target || target.mob) return;
  const hb = BLOCKS[target.id];
  // tools used on blocks
  if (it.tool?.kind === 'hoe') {
    if ([B.GRASS, B.DIRT].includes(target.id) && !w.getBlock(target.x, target.y + 1, target.z) && target.normal[1] !== -1) {
      w.setBlock(target.x, target.y, target.z, B.FARMLAND); audio.material('grass'); swing(); wearTool(1);
    }
    return;
  }
  if (s.id === I.FLINT_STEEL) {
    const fx = target.x + target.normal[0], fy = target.y + target.normal[1], fz = target.z + target.normal[2];
    if (target.id === B.OBSIDIAN && w.getBlock(fx, fy, fz) === B.AIR && G.dim !== 'end') { if (tryLightPortal(fx, fy, fz)) wearTool(1); else toast('That frame is not a closed obsidian ring'); }
    swing();
    return;
  }
  if (s.id === I.BONE_MEAL) {
    const id = target.id, m = target.meta;
    let used = false;
    if (id === B.WHEAT_CROP && m < 7) { w.setBlock(target.x, target.y, target.z, id, Math.min(7, m + 2 + (Math.random() * 3 | 0))); used = true; }
    else if (id === B.SAPLING || id === B.SPRUCE_SAPLING) { if (Math.random() < 0.45) w.growTree(target.x, target.y, target.z, id === B.SPRUCE_SAPLING); used = true; }
    else if (id === B.GRASS) {
      for (let k = 0; k < 12; k++) {
        const x = target.x + (Math.random() * 7 | 0) - 3, z = target.z + (Math.random() * 7 | 0) - 3;
        for (let y = target.y + 2; y >= target.y - 2; y--) if (w.getBlock(x, y, z) === B.GRASS && !w.getBlock(x, y + 1, z)) { w.setBlock(x, y + 1, z, [B.TALLGRASS, B.TALLGRASS, B.FLOWER_RED, B.FLOWER_YELLOW][Math.random() * 4 | 0]); break; }
      }
      used = true;
    }
    if (used) { if (G.mode === 'survival') G.inv.consumeHeld(); audio.pop(); swing(); updateHotbar(); }
    return;
  }
  const placeId = it.place || (isBlock(s.id) ? s.id : 0);
  if (!placeId) return;
  placeBlock(placeId, s, hb);
}

function placeBlock(id, s, hb) {
  const w = G.world;
  const nb = BLOCKS[id];
  let px, py, pz;
  // slab on slab of the same kind -> full block
  if (nb.shape === 'slab' && target.id === id) {
    const top = target.meta & 1;
    if ((!top && target.normal[1] === 1) || (top && target.normal[1] === -1)) {
      w.setBlock(target.x, target.y, target.z, id === B.SLAB_STONE ? B.STONE : B.PLANKS);
      return afterPlace(nb, s);
    }
  }
  if (hb.replaceable && s.id !== target.id) { px = target.x; py = target.y; pz = target.z; }
  else { px = target.x + target.normal[0]; py = target.y + target.normal[1]; pz = target.z + target.normal[2]; }
  if (py < 0 || py >= CH) return;
  const cur = w.getBlock(px, py, pz);
  if (cur !== B.AIR && !BLOCKS[cur].replaceable) return;
  const below = w.getBlock(px, py - 1, pz);
  let meta = 0;
  const facing = FACING(player.yaw);
  switch (nb.shape || (nb.cross ? 'cross' : '')) {
    case 'slab': meta = target.normal[1] === -1 || (target.normal[1] === 0 && target.hitY > 0.5) ? 1 : 0; break;
    case 'stairs': meta = facing; break;
    case 'ladder': {
      if (target.normal[1] !== 0 || !BLOCKS[target.id].opaque) return;
      meta = target.normal[0] === 1 ? 3 : target.normal[0] === -1 ? 1 : target.normal[2] === 1 ? 0 : 2;
      break;
    }
    case 'door': {
      if (!BLOCKS[below]?.solid || (w.getBlock(px, py + 1, pz) && !BLOCKS[w.getBlock(px, py + 1, pz)].replaceable)) return;
      meta = facing;
      break;
    }
    case 'wire': case 'lever': case 'button': case 'plate': case 'rail': {
      if (!BLOCKS[below]?.solid || !BLOCKS[below]?.opaque) return;
      if (nb.shape === 'rail') meta = facing % 2;
      break;
    }
    case 'piston': {
      meta = player.pitch > 0.8 ? 0 : player.pitch < -0.8 ? 1 : [3, 4, 2, 5][facing];
      break;
    }
    case 'cross': {
      let ok;
      if (id === B.TORCH) ok = BLOCKS[below]?.solid;
      else if (id === B.WHEAT_CROP) ok = below === B.FARMLAND;
      else if (id === B.NETHER_WART) ok = below === B.SOUL_SAND;
      else if (id === B.RTORCH) ok = BLOCKS[below]?.solid;
      else if (id === B.COBWEB) ok = true;
      else if (id === B.SUGAR_CANE) ok = below === B.SUGAR_CANE || ([B.SAND, B.GRASS, B.DIRT].includes(below) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => w.getBlock(px + dx, py - 1, pz + dz) === B.WATER));
      else ok = [B.GRASS, B.DIRT, B.SNOW_GRASS, B.FARMLAND].includes(below);
      if (!ok) return;
      break;
    }
  }
  if (id === B.CACTUS && ![B.SAND, B.CACTUS].includes(below)) return;
  if (nb.solid) {
    if (aabbOverlapsBlock(player.pos, P_HW, P_H, px, py, pz)) return;
    for (const m of G.mobs) if (aabbOverlapsBlock(m.pos, m.t.hw, m.t.h, px, py, pz)) return;
  }
  w.setBlock(px, py, pz, id, meta);
  if (id === B.DOOR) w.setBlock(px, py + 1, pz, B.DOOR, meta | 8);
  settleFalling(px, py, pz);
  afterPlace(nb, s);
}
function afterPlace(nb, s) {
  audio.place(nb.sound);
  swing();
  if (G.mode === 'survival') { s.count--; if (s.count <= 0) G.inv.slots[G.inv.sel] = null; }
  updateHotbar();
}

function useBucket(s) {
  const w = G.world;
  const hit = w.raycast(eyePos(), lookDir(), REACH, true);
  if (!hit) return;
  if (s.id === I.BUCKET) {
    if (!isFluid(hit.id) || hit.meta !== 0) return;
    w.setBlock(hit.x, hit.y, hit.z, B.AIR);
    const full = { id: hit.id === B.WATER ? I.WATER_BUCKET : I.LAVA_BUCKET, count: 1 };
    if (G.mode === 'survival') { if (s.count > 1) { s.count--; const left = G.inv.add(full); if (left) dropStack(full); } else G.inv.slots[G.inv.sel] = full; }
    audio.splash(); updateHotbar();
    return;
  }
  const fluid = s.id === I.WATER_BUCKET ? B.WATER : B.LAVA;
  let px = hit.x, py = hit.y, pz = hit.z;
  if (!(BLOCKS[hit.id]?.replaceable || isFluid(hit.id))) { px += hit.normal[0]; py += hit.normal[1]; pz += hit.normal[2]; }
  const cur = w.getBlock(px, py, pz);
  if (cur !== B.AIR && !BLOCKS[cur].replaceable && !isFluid(cur)) return;
  if (fluid === B.WATER && G.dim === 'nether') { toast('The water boils away!'); audio.splash(); }
  else w.setBlock(px, py, pz, fluid, 0);
  if (G.mode === 'survival') G.inv.slots[G.inv.sel] = { id: I.BUCKET, count: 1 };
  audio.splash(); swing(); updateHotbar();
}

function throwItem(s) {
  const d = lookDir();
  if (s.id === I.ENDER_PEARL) shoot('pearl', eyePos().addScaledVector(d, 0.5), d.clone().multiplyScalar(22), 'player', 0);
  else {
    if (G.dim !== 'overworld') return toast('The eye does nothing here');
    const [sx, , sz] = strongholdPos(G.world);
    const dir = new THREE.Vector3(sx - player.pos.x, 0, sz - player.pos.z);
    const far = dir.length();
    dir.normalize().multiplyScalar(far < 12 ? 0 : 6); dir.y = far < 12 ? -2 : 3;
    shoot('eye', eyePos(), dir, 'player', 0);
    if (far < 12) toast('The eye points down — dig here');
  }
  if (G.mode === 'survival') G.inv.consumeHeld();
  audio.tone(500, 0.2, 0.15, 'sine', 300); swing(); updateHotbar();
}

function pickBlock() {
  if (!target || target.mob) return;
  let id = target.id;
  if (id === B.DOOR) id = I.DOOR_ITEM;
  if (id === B.WHEAT_CROP) id = I.SEEDS;
  const i = G.inv.slots.findIndex((s) => s && s.id === id);
  if (i >= 0 && i < 9) return selectSlot(i);
  if (G.mode === 'creative') { G.inv.slots[G.inv.sel] = { id, count: 64 }; updateHotbar(); }
  else if (i >= 9) { const tmp = G.inv.slots[G.inv.sel]; G.inv.slots[G.inv.sel] = G.inv.slots[i]; G.inv.slots[i] = tmp; updateHotbar(); }
}

function dropHeld(all) {
  const s = G.inv.held; if (!s) return;
  const n = all ? s.count : 1;
  const d = lookDir();
  const drop = spawnDrop({ ...s, count: n }, player.pos.x + d.x * 0.6, player.pos.y + EYE - 0.3, player.pos.z + d.z * 0.6);
  drop.vel.set(d.x * 5, 2 + d.y * 4, d.z * 5); drop.age = -1.5;
  s.count -= n; if (s.count <= 0) G.inv.slots[G.inv.sel] = null;
  updateHotbar();
}

function spawnDrop(stack, x, y, z) { const d = new ItemDrop(scene, stack, x, y, z); G.drops.push(d); return d; }
function dropStack(s) { spawnDrop(s, player.pos.x, player.pos.y + 1, player.pos.z); }

function swing() { const h = $('hand'); h.classList.remove('swing'); void h.offsetWidth; h.classList.add('swing'); }

// ------------------------------------------------------------------ potions
function applyPotion(pot, strength = 1) {
  const p = POTIONS[pot];
  if (p?.secs) player.effects[pot] = Math.max(player.effects[pot] || 0, p.secs * strength);
}
function splashAt(pos, pot) {
  const d = pos.distanceTo(player.pos.clone().setY(player.pos.y + 1));
  if (d < 4) applyPotion(pot, 1 - d / 5);
  audio.broke('glass');
}

// ------------------------------------------------------------------ vehicles
function placeVehicle(s) {
  const hit = G.world.raycast(eyePos(), lookDir(), REACH, true);
  if (!hit) return;
  if (s.id === I.BOAT) {
    const on = hit.id === B.WATER ? [hit.x + 0.5, hit.y + 0.9, hit.z + 0.5] : [hit.x + 0.5 + hit.normal[0], hit.y + 1, hit.z + 0.5 + hit.normal[2]];
    G.vehicles.push(new Boat(scene, ...on, player.yaw));
  } else {
    if (hit.id !== B.RAIL) return toast('Place a minecart on rails');
    const c = new Minecart(scene, hit.x + 0.5, hit.y + 0.0625, hit.z + 0.5); c.dir = (hit.meta & 1) ? [1, 0] : [0, 1];
    G.vehicles.push(c);
  }
  if (G.mode === 'survival') G.inv.consumeHeld();
  updateHotbar(); swing();
}
function mount(v) { player.riding = v; player.vel.set(0, 0, 0); toast('Shift to get off'); }
function dismount() {
  const v = player.riding; if (!v) return;
  player.riding = null;
  player.pos.set(v.pos.x, v.pos.y + 1, v.pos.z);
  for (const [dx, dz] of [[1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) {
    const p = new THREE.Vector3(v.pos.x + dx, v.pos.y + 0.2, v.pos.z + dz);
    if (!blocked(G.world, p, P_HW, P_H)) { player.pos.copy(p); break; }
  }
 
}

// ------------------------------------------------------------------ fishing
const handPos = () => { const d = lookDir(); const r = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw)); return eyePos().addScaledVector(d, 0.6).addScaledVector(r, 0.35).add(new THREE.Vector3(0, -0.25, 0)); };
function useRod() {
  if (G.bobber) {
    const b = G.bobber;
    if (b.state === 'bite') {
      const r = Math.random();
      const loot = r < 0.7 ? { id: I.FISH, count: 1 } : r < 0.9 ? [{ id: I.STICK, count: 1 }, { id: I.LEATHER, count: 1 }, { id: I.BONE, count: 1 }, { id: I.STRING, count: 1 }, { id: I.BOTTLE, count: 1 }][Math.random() * 5 | 0]
        : [{ id: I.BOOK, count: 1 }, { id: I.NUGGET, count: 3 }, { id: I.EMERALD, count: 1 }][Math.random() * 3 | 0];
      const drop = spawnDrop(loot, b.pos.x, b.pos.y + 0.5, b.pos.z);
      drop.vel.copy(player.pos.clone().sub(b.pos).multiplyScalar(1.2)).setY(6);
      addXp(1 + (Math.random() * 3 | 0));
      toast(r < 0.7 ? 'You caught a fish!' : 'You caught something!');
      wearTool(1);
    }
    b.dispose(); G.bobber = null; audio.click();
    return;
  }
  const d = lookDir();
  G.bobber = new Bobber(scene, handPos(), d.multiplyScalar(12).add(new THREE.Vector3(0, 3, 0)));
  swing(); audio.tone(700, 0.15, 0.1, 'sine', -300);
}

// ------------------------------------------------------------------ HUD
function updateHotbar() {
  $('hotbar').innerHTML = G.inv.slots.slice(0, 9).map((s, i) => {
    let inner = '';
    if (s) {
      inner = `<img src="${stackIcon(s)}">` + (s.count > 1 ? `<span class="count">${s.count}</span>` : '');
      const it = info(s.id), dur = it?.tool?.dur || it?.armor?.dur;
      if (dur && s.dmg) { const f = 1 - s.dmg / dur; inner += `<span class="dur"><i style="width:${f * 100}%;background:hsl(${f * 120},90%,45%)"></i></span>`; }
    }
    return `<div class="slot ${i === G.inv.sel ? 'sel' : ''} ${s?.ench ? 'glint' : ''}" data-i="${i}">${inner}</div>`;
  }).join('');
  const h = G.inv.held;
  const hand = $('hand');
  if (h) { hand.src = stackIcon(h); hand.style.visibility = 'visible'; } else hand.style.visibility = 'hidden';
  $('mapview').classList.toggle('hidden', h?.id !== I.MAP);
  $('compass').classList.toggle('hidden', h?.id !== I.COMPASS);
  if (h?.id !== I.ROD && G.bobber) { G.bobber.dispose(); G.bobber = null; }
}
let nameTimer = 0;
function showItemName() {
  const h = G.inv.held;
  const el = $('itemname');
  el.textContent = h ? stackName(h) + (h.ench ? ' — ' + enchLabel(h.ench) : '') : '';
  el.style.opacity = 1;
  clearTimeout(nameTimer); nameTimer = setTimeout(() => (el.style.opacity = 0), 1500);
}
let lastHUD = '';
function updateHUD(force) {
  const surv = G.mode === 'survival';
  const key = [surv, player.level, Math.floor(player.xpProg)].join();
  if (key === lastHUD && !force) return;
  lastHUD = key;
  $('xpfill').style.width = (player.xpProg / need(player.level) * 100) + '%';
  $('xplevel').textContent = player.level ? player.level : '';
  $('xp').style.visibility = surv ? 'visible' : 'hidden';
  $('tFly').classList.toggle('hidden', surv);
}
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }

// ------------------------------------------------------------------ player physics
function onLadder() {
  const w = G.world;
  const x = Math.floor(player.pos.x), z = Math.floor(player.pos.z);
  return w.getBlock(x, Math.floor(player.pos.y), z) === B.LADDER || w.getBlock(x, Math.floor(player.pos.y + 1), z) === B.LADDER;
}
function rideStep(dt) {
  const v = player.riding, w = G.world;
  let fwd = 0, turn = 0;
  if (keys.has('KeyW')) fwd += 1;
  if (keys.has('KeyS')) fwd -= 1;
  if (keys.has('KeyA')) turn += 1;
  if (keys.has('KeyD')) turn -= 1;
  fwd -= touch.moveZ; turn -= touch.moveX;
  if (v instanceof Boat) v.update(w, dt, { fwd, turn });
  else { const d = lookDir().setY(0).normalize().multiplyScalar(fwd); v.update(w, dt, { push: d }); }
  player.pos.copy(v.seat()); player.vel.set(0, 0, 0); player.ground = true;
  if (sneaking() || v.dead) dismount();
}
function gateway() {
  const outer = player.pos.x > 500;
  const [x, z] = outer ? [0, -70] : [1000, 0];
  player.pos.set(x + 0.5, outer ? 80 : 61, z + 0.5); player.vel.set(0, 0, 0); player.gliding = false;
  G.pendingSurface = outer ? [x, z] : null;
  G.state = 'loading'; show('loading');
  audio.tone(300, 0.6, 0.25, 'sine', 500);
}
function stepPlayer(dt) {
  const w = G.world;
  if (player.riding) return rideStep(dt);
  const blockAt = (dy) => w.getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y + dy), Math.floor(player.pos.z));
  const inWater = blockAt(0.1) === B.WATER || blockAt(0.9) === B.WATER;
  const inLava = blockAt(0.1) === B.LAVA || blockAt(0.9) === B.LAVA;
  const eyeBlock = blockAt(EYE);
  const eyeWater = eyeBlock === B.WATER, eyeLava = eyeBlock === B.LAVA;
  const sneak = sneaking();
  const ladder = onLadder();
  const onSoul = w.getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y - 0.1), Math.floor(player.pos.z)) === B.SOUL_SAND;

  let fx = 0, fz = 0;
  if (keys.has('KeyW')) fz -= 1;
  if (keys.has('KeyS')) fz += 1;
  if (keys.has('KeyA')) fx -= 1;
  if (keys.has('KeyD')) fx += 1;
  fx += touch.moveX; fz += touch.moveZ;
  const len = Math.hypot(fx, fz);
  if (len > 1) { fx /= len; fz /= len; }
  if (fz >= 0) player.sprint = player.sprint && touch.stickId !== null && touch.moveZ < 0;
  const sprinting = player.sprint && fz < 0 && !sneak;
  let speed = player.flying ? (sprinting ? 21 : 10.9) : inLava ? 1.2 : inWater ? 2.2 : sneak ? 1.3 : sprinting ? 5.6 : 4.3;
  if (onSoul) speed *= 0.5;
  if (player.effects.swiftness) speed *= 1.3;
  const inWeb = blockAt(0.1) === B.COBWEB || blockAt(1) === B.COBWEB;
  if (inWeb) speed *= 0.15;
  const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  const wx = (fx * cos + fz * sin) * speed, wz = (-fx * sin + fz * cos) * speed;
  const acc = player.flying ? 10 : player.ground ? 20 : (inWater || inLava) ? 6 : 4;
  const k = 1 - Math.exp(-acc * dt);
  player.vel.x += (wx - player.vel.x) * k;
  player.vel.z += (wz - player.vel.z) * k;

  if (player.flying) {
    let vy = 0;
    if (keys.has('Space')) vy += 8;
    if (sneak) vy -= 8;
    player.vel.y += (vy - player.vel.y) * (1 - Math.exp(-10 * dt));
  } else if (ladder) {
    if (keys.has('Space') || (len > 0.1 && fz < 0)) player.vel.y = 3;
    else if (sneak) player.vel.y = 0;
    else player.vel.y = Math.max(player.vel.y - 30 * dt, -2.5);
   
  } else if (inWater || inLava) {
    player.vel.y -= (inLava ? 5 : 9) * dt;
    player.vel.y = Math.max(player.vel.y, inLava ? -1.5 : -3);
    if (keys.has('Space')) player.vel.y = Math.min(player.vel.y + 25 * dt, inLava ? 2 : 3.2);
  } else if (player.gliding) {
    // elytra: look down to dive and gain speed, look up to climb and lose it
    const d = lookDir();
    let sp = player.vel.length();
    sp += (-d.y * 16 - 1.5) * dt;
    sp = Math.max(4, Math.min(34, sp));
    player.vel.copy(d.multiplyScalar(sp)); player.vel.y -= 1.2;
   
    player.glideWear = (player.glideWear || 0) + dt;
    if (player.glideWear > 1) { player.glideWear = 0; const el = G.inv.armor[1]; if (el && G.mode === 'survival') { el.dmg = (el.dmg || 0) + 1; if (el.dmg >= info(el.id).armor.dur) { G.inv.armor[1] = null; player.gliding = false; } } }
  } else {
    player.vel.y -= 30 * dt;
    player.vel.y = Math.max(player.vel.y, -60);
    if (keys.has('Space') && player.ground) player.vel.y = 8.9;
    // start gliding: jump again while falling with elytra on
    if (keys.has('Space') && !player._spaceHeld && !player.ground && player.vel.y < -1 && G.inv.armor[1]?.id === I.ELYTRA) player.gliding = true;
  }
  if (inWeb) player.vel.y = Math.max(player.vel.y, -1.2);
  player._spaceHeld = keys.has('Space');

  const prevX = player.pos.x, prevZ = player.pos.z;
  const r = moveAABB(w, player.pos, player.vel, dt, P_HW, P_H, player.flying ? 0 : 0.6, player.ground);
  if (sneak && player.ground && !player.flying) {
    const below = (x, z) => {
      for (const ox of [-P_HW, P_HW]) for (const oz of [-P_HW, P_HW]) {
        const b = BLOCKS[w.getBlock(Math.floor(x + ox), Math.floor(player.pos.y - 0.05), Math.floor(z + oz))];
        if (b && b.solid) return true;
      }
      return false;
    };
    if (!below(player.pos.x, player.pos.z)) {
      if (below(prevX, player.pos.z)) player.pos.x = prevX; else if (below(player.pos.x, prevZ)) player.pos.z = prevZ; else { player.pos.x = prevX; player.pos.z = prevZ; }
    }
  }
  const wasGround = player.ground;
  player.ground = r.ground;
  if (player.gliding) {
    if (r.ground || inWater || inLava) player.gliding = false;
    else if ((r.hitX || r.hitZ) && Math.hypot(player.vel.x, player.vel.z) < 1) player.gliding = false;
  }
  if (player.flying && r.ground && G.mode === 'creative') player.flying = false;

  if (!wasGround && player.ground) audio.step(BLOCKS[w.getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y - 0.1), Math.floor(player.pos.z))]?.sound);

  const hs = Math.hypot(player.vel.x, player.vel.z);
  if (player.ground && hs > 1) {
    player.stepT += hs * dt;
    if (player.stepT > 1.8) {
      player.stepT = 0;
      const b = BLOCKS[w.getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y - 0.1), Math.floor(player.pos.z))];
      if (b) audio.step(b.sound);
    }
  }
  if (inWater && !player._wasWater && player.vel.y < -4) audio.splash();
  player._wasWater = inWater;

  // portals: stand inside for a moment
  if ([0.1, 1].map(blockAt).includes(B.GATEWAY)) { gateway(); return; }
  const portalBlock = [0.1, 1].map(blockAt).find((b) => b === B.PORTAL || b === B.END_PORTAL);
  if (portalBlock) {
    if (!player.inPortal) {
      player.portalT += dt;
      $('portalOverlay').style.opacity = Math.min(1, player.portalT / 2);
      const wait = G.mode === 'creative' || portalBlock === B.END_PORTAL ? 0.3 : 2.5;
      if (player.portalT > wait) {
        $('portalOverlay').style.opacity = 0;
        if (portalBlock === B.END_PORTAL) travel(G.dim === 'end' ? 'overworld' : 'end', G.dim === 'end' ? 'spawn' : 'end');
        else travel(G.dim === 'nether' ? 'overworld' : 'nether', 'portal');
        return;
      }
    }
  } else { player.inPortal = false; player.portalT = 0; $('portalOverlay').style.opacity = 0; }

  for (const k in player.effects) { player.effects[k] -= dt; if (player.effects[k] <= 0) delete player.effects[k]; }
  // fell out of the world: back up top, unhurt
  if (player.pos.y < -30) { player.pos.y = CH; player.vel.y = 0; }

  $('waterOverlay').style.display = eyeWater ? 'block' : 'none';
  $('fireOverlay').style.display = eyeLava ? 'block' : 'none';
  mats.solid.uniforms.underwater.value = eyeLava ? 2 : eyeWater ? 1 : 0;
}

// ------------------------------------------------------------------ mobs, projectiles, drops
let spawnT = 0;
const mobCtx = {
  sound: (s) => { if (s === 'splash') audio.splash(); },
  mate(m) {
    let best = null, bd = 8;
    for (const o of G.mobs) if (o !== m && o.type === m.type && o.love > 0) { const d = o.pos.distanceTo(m.pos); if (d < bd) { bd = d; best = o; } }
    if (best && bd < 1.5) {
      m.love = 0; best.love = 0;
      const baby = new Mob(scene, m.type, m.pos.x, m.pos.y, m.pos.z); baby.baby = 90;
      G.mobs.push(baby); addXp(1 + (Math.random() * 6 | 0));
      return null;
    }
    return best;
  },
  hitTest(p) {
    for (const m of G.mobs) if (m.contains(p.pos, 0.3)) {
      if (p.kind === 'egg') m.damage(0, p.pos);
      this.projectileBurst(p); return true;
    }
    return false;
  },
  projectileBurst(p) {
    if (p.kind === 'pearl') pearlLand(p);
    if (p.kind === 'potion') splashAt(p.pos, p.pot);
    if (p.kind === 'egg') { audio.click(); if (Math.random() < 0.125) { const c = new Mob(scene, 'chicken', p.pos.x, Math.floor(p.pos.y) + 1, p.pos.z); c.baby = 90; G.mobs.push(c); } }
  },
  eyeLanded(pos) { spawnDrop({ id: I.EYE_OF_ENDER, count: 1 }, pos.x, pos.y, pos.z); audio.pop(); },
};
function pearlLand(p) {
  player.pos.set(p.pos.x, Math.floor(p.pos.y) + 0.01, p.pos.z);
  for (let i = 0; i < 4 && blocked(G.world, player.pos, P_HW, P_H); i++) player.pos.y += 1;
  player.vel.set(0, 0, 0);
  audio.tone(900, 0.3, 0.2, 'sine', -600);
}

function stepEntities(dt, daylight) {
  const w = G.world;
  mobCtx.heldFood = G.inv.held?.id;
  for (const m of G.mobs) {
    if (!w.isLoaded(Math.floor(m.pos.x), Math.floor(m.pos.z))) continue;
    m.update(w, dt, player, mobCtx);
    if (Math.random() < dt * 0.05) { if (m.type === 'cow') audio.moo(1); else if (m.type === 'sheep') audio.moo(2.6); else if (m.type === 'villager') audio.moo(1.4); }
  }
  for (const m of G.mobs) if (m.type === 'chicken' && !(m.baby > 0) && Math.random() < dt * 0.004) { spawnDrop({ id: I.EGG, count: 1 }, m.pos.x, m.pos.y + 0.3, m.pos.z); audio.pop(); }
  G.mobs = G.mobs.filter((m) => {
    const far = m.pos.distanceTo(player.pos) > (m.t.villager || m.owner ? 200 : 96);
    if (m.dead && !far) {
      for (const d of m.t.drops()) if (d.count > 0) spawnDrop(d, m.pos.x, m.pos.y + 0.5, m.pos.z);
      if (m.byPlayer) addXp(m.t.xp || (1 + (Math.random() * 3 | 0)));
      audio.pop();
    }
    if (m.dead || far) { m.dispose(); return false; }
    return true;
  });
  // villagers from generated villages
  for (let i = w.spawns.length - 1; i >= 0; i--) {
    const s = w.spawns[i];
    const k = `${Math.floor(s.x / 32)},${Math.floor(s.z / 32)},${s.x},${s.z}`;
    if (G.spawnedVillages.has(k)) { w.spawns.splice(i, 1); continue; }
    if (Math.hypot(s.x - player.pos.x, s.z - player.pos.z) < 80 && w.isLoaded(Math.floor(s.x), Math.floor(s.z))) {
      const y = s.type === 'villager' ? w.surfaceY(Math.floor(s.x), Math.floor(s.z)) : s.y;
      G.mobs.push(new Mob(scene, s.type, s.x, y, s.z));
      G.spawnedVillages.add(k); w.spawns.splice(i, 1);
    }
  }
  // spawning
  spawnT -= dt;
  if (spawnT <= 0) {
    spawnT = 2;
    const count = (f) => G.mobs.filter(f).length;
    const tryAt = (min, max) => {
      const a = Math.random() * Math.PI * 2, r = min + Math.random() * (max - min);
      const x = Math.floor(player.pos.x + Math.cos(a) * r), z = Math.floor(player.pos.z + Math.sin(a) * r);
      if (!w.isLoaded(x, z)) return null;
      return { x, z };
    };
    const standable = (x, y, z) => BLOCKS[w.getBlock(x, y - 1, z)]?.solid && !BLOCKS[w.getBlock(x, y - 1, z)]?.liquid && !w.getBlock(x, y, z) && !w.getBlock(x, y + 1, z);
    if (G.dim === 'overworld') {
      if (count((m) => (m.t.passive || m.t.wolf) && !m.t.villager && !m.owner) < 12) {
        const p = tryAt(24, 56);
        if (p) {
          const y = w.heightAt(p.x, p.z) + 1;
          if (w.getBlock(p.x, y - 1, p.z) === B.GRASS && standable(p.x, y, p.z)) {
            const bio = w.biomeAt(p.x, p.z).biome;
            const type = (bio === 'forest' || bio === 'snowy') && Math.random() < 0.25 ? 'wolf' : ['cow', 'sheep', 'chicken'][Math.random() * 3 | 0];
            const n = 1 + (Math.random() * 3 | 0);
            for (let i = 0; i < n; i++) G.mobs.push(new Mob(scene, type, p.x + 0.5 + i * 0.7, y, p.z + 0.5));
          }
        }
      }
    }
  }
  // thrown items
  for (const p of G.projectiles) p.update(w, dt, mobCtx);
  G.projectiles = G.projectiles.filter((p) => {
    if (!p.dead) return true;
    p.dispose(); return false;
  });
  // effects
  for (const e of G.effects) { e.t += dt; e.mesh.scale.setScalar(1 + e.grow * (e.t / e.max)); e.mesh.material.opacity = Math.max(0, 0.8 * (1 - e.t / e.max)); }
  G.effects = G.effects.filter((e) => { if (e.t < e.max) return true; scene.remove(e.mesh); e.mesh.geometry.dispose(); e.mesh.material.dispose(); return false; });
  // drops
  for (const d of G.drops) {
    d.update(w, dt);
    const chest = player.pos.clone().setY(player.pos.y + 0.8);
    const dist = d.pos.distanceTo(chest);
    if (d.age > 0.6 && dist < 3) d.pos.lerp(chest, Math.min(1, dt * 10));
    if (d.age > 0.6 && dist < 1.2) {
      const left = G.inv.add(d.stack);
      if (left < d.stack.count) { audio.pop(); updateHotbar(); }
      d.stack.count = left;
    }
  }
  G.drops = G.drops.filter((d) => {
    if (d.stack.count <= 0 || d.age > 300 || d.pos.y < -20) { d.dispose(); return false; }
    return true;
  });
  // vehicles that nobody rides keep moving, and break into their item
  for (const v of G.vehicles) if (v !== player.riding) v.update(w, dt, null);
  G.vehicles = G.vehicles.filter((v) => {
    if (!v.dead) return true;
    if (player.riding === v) dismount();
    if (G.mode === 'survival') spawnDrop({ id: v.item, count: 1 }, v.pos.x, v.pos.y + 0.5, v.pos.z);
    v.dispose(); return false;
  });
  if (G.bobber) { G.bobber.update(w, dt, handPos(), G.weather.rain > 0.5, mobCtx); if (G.bobber.dead) { G.bobber.dispose(); G.bobber = null; } }
  // furnaces and brewing stands tick everywhere in this dimension
  for (const v of w.extra.values()) { if (v.type === 'furnace') tickFurnace(v, dt); else if (v.type === 'brewing') tickBrewing(v, dt); }
  if (invUI.mode === 'furnace' || invUI.mode === 'brewing') { furnaceRedraw -= dt; if (furnaceRedraw <= 0) { furnaceRedraw = 0.25; invUI.render(); } }
  G.red.tick(dt, [player.pos, ...G.mobs.map((m) => m.pos)]);
  w.stepFluids(dt);
  w.randomTicks(dt, G.weather.rain > 0.5 ? 1.5 : 1);
}
let furnaceRedraw = 0;

// ------------------------------------------------------------------ day / night
const DAY_SKY = new THREE.Color(0x87ceeb), NIGHT_SKY = new THREE.Color(0x05070f), DUSK = new THREE.Color(0xf09860);
const NETHER_SKY = new THREE.Color(0x3a0c08), END_SKY = new THREE.Color(0x0e0b18);
const skyCol = new THREE.Color();
function updateSky(dt) {
  const uw = mats.solid.uniforms.underwater.value;
  const rd = G.world.renderDist * CS;
  let daylight = 1, fogC, near = rd * 0.55, far = rd * 0.95;
  if (G.dim === 'overworld') {
    G.time = (G.time + dt / DAY) % 1;
    const a = G.time * Math.PI * 2;
    const sh = Math.sin(a);
    daylight = 0.22 + 0.78 * smooth(-0.2, 0.25, sh);
    skyCol.copy(NIGHT_SKY).lerp(DAY_SKY, smooth(-0.25, 0.3, sh));
    const dusk = Math.max(0, 1 - Math.abs(sh) / 0.25) * 0.55;
    skyCol.lerp(DUSK, dusk * (sh > -0.15 ? 1 : 0));
    fogC = skyCol;
    sun.position.set(Math.cos(a) * 400, Math.sin(a) * 400, 60); sun.lookAt(camera.position);
    moon.position.set(-Math.cos(a) * 400, -Math.sin(a) * 400, -60); moon.lookAt(camera.position);
    stars.material.opacity = Math.max(0, 1 - daylight * 1.6);
    sun.visible = moon.visible = clouds.visible = true;
  } else {
    fogC = G.dim === 'nether' ? NETHER_SKY : END_SKY;
    sun.visible = moon.visible = clouds.visible = false;
    stars.material.opacity = G.dim === 'end' ? 0.6 : 0;
    if (G.dim === 'nether') { near = 12; far = Math.min(far, 70); }
  }
  // weather: rain (snow in the cold) comes and goes; storms bring lightning
  const W = G.weather;
  if (G.dim === 'overworld') {
    W.t -= dt;
    if (W.t <= 0) {
      if (W.target === 0) { W.target = 1; W.thunder = Math.random() < 0.3; W.t = 120 + Math.random() * 180; }
      else { W.target = 0; W.thunder = false; W.t = 300 + Math.random() * 600; }
    }
    W.rain += (W.target - W.rain) * Math.min(1, dt * 0.2);
    daylight *= 1 - W.rain * (W.thunder ? 0.45 : 0.3);
    fogC = fogC.clone().lerp(new THREE.Color(0x6a7280).multiplyScalar(daylight + 0.2), W.rain * 0.6);
    far *= 1 - W.rain * 0.3;
    if (W.thunder && W.rain > 0.8 && Math.random() < dt * 0.05) { W.flash = 0.25; setTimeout(() => audio.boom(), 300 + Math.random() * 1500); }
    if (W.flash > 0) { W.flash -= dt; daylight = 1; fogC = new THREE.Color(0xdfe6ff); }
  } else W.rain = 0;
  updateRain(dt, W.rain);
  audio.rainLevel?.(G.dim === 'overworld' ? W.rain : 0);
  if (player.effects.night_vision) daylight = Math.max(daylight, 0.95);
  if (uw === 1) { fogC = new THREE.Color(0x1a3a80).multiplyScalar(daylight); near = 2; far = player.effects.night_vision ? 60 : 22; }
  if (uw === 2) { fogC = new THREE.Color(0xc04000); near = 0.5; far = 4; }
  scene.background = fogC;
  scene.fog.color.copy(fogC);
  mats.solid.uniforms.fogColor.value.copy(fogC);
  mats.solid.uniforms.daylight.value = daylight;
  mats.solid.uniforms.fogNear.value = near; mats.solid.uniforms.fogFar.value = far;
  scene.fog.near = near; scene.fog.far = far;
  hemi.intensity = 0.3 + daylight * 0.8; dirL.intensity = daylight * 0.7;
  sky.position.copy(camera.position);
  clouds.position.x = camera.position.x; clouds.position.z = camera.position.z;
  cloudTex.offset.set((camera.position.x + performance.now() / 1000 * 1.5) / CLOUD_SPAN, -camera.position.z / CLOUD_SPAN);
  clouds.material.color.setScalar(0.25 + daylight * 0.75);
  return daylight;
}
function smooth(a, b, v) { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }

// rain and snow: short lines / points recycled in a box around the camera, hidden under roofs
const RAIN_N = 1200;
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(RAIN_N * 6), 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x9fb4d0, transparent: true, opacity: 0.6 }));
rain.frustumCulled = false; rain.visible = false; scene.add(rain);
const drops = Array.from({ length: RAIN_N }, () => [Math.random() * 40 - 20, Math.random() * 30 - 10, Math.random() * 40 - 20]);
function updateRain(dt, level) {
  rain.visible = level > 0.05;
  if (!rain.visible) return;
  const w = G.world, c = camera.position;
  const snow = w.biomeAt(Math.floor(c.x), Math.floor(c.z)).temp < -0.3;
  rain.material.color.setHex(snow ? 0xffffff : 0x9fb4d0);
  const a = rainGeo.attributes.position.array;
  const n = Math.floor(RAIN_N * level);
  for (let i = 0; i < RAIN_N; i++) {
    const d = drops[i];
    d[1] -= dt * (snow ? 3 : 18);
    if (snow) d[0] += Math.sin(performance.now() / 700 + i) * dt * 0.5;
    if (d[1] < -10) { d[1] += 30; d[0] = Math.random() * 40 - 20; d[2] = Math.random() * 40 - 20; }
    const x = c.x + d[0], y = c.y + d[1], z = c.z + d[2];
    const hide = i >= n || y < w.heightAt(Math.floor(x), Math.floor(z)) + 1;
    const len = snow ? 0.08 : 0.7;
    a.set(hide ? [0, -999, 0, 0, -999, 0] : [x, y, z, x, y + len, z], i * 6);
  }
  rainGeo.attributes.position.needsUpdate = true;
}

// ------------------------------------------------------------------ map and compass
const mapCv = $('mapview'), mapCtx = mapCv.getContext('2d');
const blockColor = (() => {
  const a = getAtlas().getContext('2d').getImageData(0, 0, TILE * ATLAS_COLS, TILE * ATLAS_COLS).data;
  const cache = new Map();
  return (id) => {
    if (cache.has(id)) return cache.get(id);
    const t = BLOCKS[id]?.top ?? 0, ox = (t % ATLAS_COLS) * TILE, oy = Math.floor(t / ATLAS_COLS) * TILE;
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const o = ((oy + y) * TILE * ATLAS_COLS + ox + x) * 4; if (a[o + 3] < 128) continue; r += a[o]; g += a[o + 1]; b += a[o + 2]; n++; }
    const c = n ? [r / n | 0, g / n | 0, b / n | 0] : [0, 0, 0];
    cache.set(id, c); return c;
  };
})();
let mapT = 0;
function drawMapAndCompass(dt) {
  const held = G.inv.held?.id;
  if (held === I.COMPASS) {
    const [sx, , sz] = player.spawn;
    const ang = Math.atan2(sx + 0.5 - player.pos.x, sz + 0.5 - player.pos.z) - Math.atan2(-Math.sin(player.yaw), -Math.cos(player.yaw));
    $('needle').style.transform = `rotate(${-ang}rad)`;
  }
  if (held !== I.MAP) return;
  mapT -= dt; if (mapT > 0) return; mapT = 0.5;
  const w = G.world, img = mapCtx.createImageData(128, 128);
  const px = Math.floor(player.pos.x), pz = Math.floor(player.pos.z);
  for (let z = 0; z < 128; z++) for (let x = 0; x < 128; x++) {
    const wx = px + x - 64, wz = pz + z - 64, o = (z * 128 + x) * 4;
    img.data[o + 3] = 255;
    if (!w.isLoaded(wx, wz)) { img.data.set([30, 26, 20], o); continue; }
    const h = w.heightAt(wx, wz);
    const top = w.getBlock(wx, h + 1, wz) === B.WATER ? B.WATER : w.getBlock(wx, h, wz);
    const c = top === B.WATER ? [60, 90, 200] : top === B.AIR ? [18, 16, 26] : blockColor(top);
    const shade = 0.85 + Math.max(-0.2, Math.min(0.2, (h - w.heightAt(wx, wz - 1)) * 0.08));
    img.data.set([c[0] * shade, c[1] * shade, c[2] * shade], o);
  }
  mapCtx.putImageData(img, 0, 0);
  mapCtx.save(); mapCtx.translate(64, 64); mapCtx.rotate(-player.yaw);
  mapCtx.fillStyle = '#fff'; mapCtx.strokeStyle = '#000';
  mapCtx.beginPath(); mapCtx.moveTo(0, -5); mapCtx.lineTo(4, 4); mapCtx.lineTo(-4, 4); mapCtx.closePath(); mapCtx.fill(); mapCtx.stroke();
  mapCtx.restore();
}
function drawEffects() {
  const e = Object.entries(player.effects).filter(([k]) => POTIONS[k]);
  $('effectsHud').innerHTML = e.map(([k, t]) => `<div>${POTIONS[k].name.replace('Potion of ', '')} ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}</div>`).join('');
}

// ------------------------------------------------------------------ main loop
let last = performance.now(), fpsAcc = 0, fpsN = 0, fps = 0, autosave = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tick(dt);
}
function tick(dt) {
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 0.5) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }

  if (G.state === 'title' || !G.world) { renderer.setClearColor(0x000000); renderer.clear(); return; }

  const w = G.world;
  w.update(player.pos.x, player.pos.z, G.state === 'loading' ? 30 : 6);

  if (G.state === 'loading') {
    // chunks the mesher will build inside a radius of min(rd, 4) — counted, not estimated
    const r = Math.min(w.renderDist, 4) + 0.5;
    let need = 0;
    for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) if (dx * dx + dz * dz <= r * r) need++;
    const pct = Math.min(1, w.meshedCount() / need);
    $('loadbar').style.width = (pct * 100) + '%';
    if (pct >= 1 && w.isLoaded(Math.floor(player.pos.x), Math.floor(player.pos.z))) {
      if (G.dim === 'end' && !G.dims.end.exitBuilt) { buildExitPortal(w); G.dims.end.exitBuilt = true; }
      if (G.pendingSurface) { player.pos.y = w.surfaceY(...G.pendingSurface); G.pendingSurface = null; }
      for (let i = 0; i < CH && blocked(w, player.pos, P_HW, P_H); i++) player.pos.y += 1;
      G.state = 'playing';
      show(null); updateHotbar(); updateHUD(true); showItemName();
      if (!isTouch) lockPointer();
      if (!G.welcomed) { G.welcomed = true; toast(G.mode === 'creative' ? 'Creative mode — double-tap Space to fly' : 'Punch a tree to get started!'); }
      else if (G.dim === 'nether') toast('The Nether');
      else if (G.dim === 'end') toast('The End — the portal in the middle takes you home');
    }
  }

  if (G.state === 'playing') {
    const steps = Math.ceil(dt / 0.02);
    for (let i = 0; i < steps && G.state === 'playing'; i++) {
      if (!w.isLoaded(Math.floor(player.pos.x), Math.floor(player.pos.z))) break;
      stepPlayer(dt / steps);
    }
    if (G.world !== w || G.state !== 'playing') { renderer.render(scene, camera); return; }
    updateTarget();
    attackCD -= dt; placeCD -= dt;
    if (mouse.left && target && !target.mob) {
      if (G.mode === 'creative') {
        if (placeCD <= 0) { breakBlock(target); placeCD = 0.25; updateTarget(); }
      } else {
        const b = BLOCKS[target.id];
        if (!breakState || breakState.x !== target.x || breakState.y !== target.y || breakState.z !== target.z) breakState = { x: target.x, y: target.y, z: target.z, t: 0, snd: 0 };
        const total = breakTime(b);
        breakState.t += dt;
        breakState.snd -= dt;
        if (breakState.snd <= 0) { breakState.snd = 0.25; audio.dig(b.sound); swing(); }
        if (breakState.t >= total) { breakBlock(target); breakState = null; updateTarget(); }
        else {
          crackMesh.visible = true;
          crackMesh.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
          crackMesh.material.map = crackTex[Math.min(9, Math.floor((breakState.t / total) * 10))];
        }
      }
    } else if (mouse.left && target?.mob) { attackMob(); breakState = null; }
    else breakState = null;
    if (!breakState) crackMesh.visible = false;
    if (mouse.right) { useRepeat -= dt; if (useRepeat <= 0) { useRepeat = 0.22; useItem(); } }
    autosave += dt;
    if (autosave > 15) { autosave = 0; save(); }
  }

  let daylight = mats.solid.uniforms.daylight.value;
  if (G.state === 'playing') {
    daylight = updateSky(dt);
    stepEntities(dt, daylight);
    updateHUD();
  } else updateSky(0);

  if (G.state === 'playing') { drawMapAndCompass(dt); drawEffects(); }
  camera.position.set(player.pos.x, player.pos.y + EYE - ((sneaking() && !player.flying && !player.riding) ? 0.12 : 0), player.pos.z);
  const bob = player.ground ? Math.sin(player.stepT * Math.PI) * 0.03 * Math.min(1, Math.hypot(player.vel.x, player.vel.z) / 4) : 0;
  camera.position.y += bob;
  camera.rotation.set(player.pitch, player.yaw, 0);
  let targetFov = settings.fov * (player.sprint && Math.hypot(player.vel.x, player.vel.z) > 5 ? 1.12 : 1);
  if (Math.abs(camera.fov - targetFov) > 0.1) { camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 10); camera.updateProjectionMatrix(); }

  if (!$('debug').classList.contains('hidden')) {
    const p = player.pos;
    const bio = w.biomeAt(Math.floor(p.x), Math.floor(p.z)).biome;
    $('debug').textContent = `BlockCraft  ${fps} fps\nXYZ ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}  (${G.dim})\nChunk ${Math.floor(p.x / CS)} ${Math.floor(p.z / CS)}  loaded ${w.chunks.size}  meshed ${w.meshedCount()}\nBiome ${bio}  Seed ${G.seed}\nTime ${(G.time * 24).toFixed(1)}h  Mobs ${G.mobs.length}  Drops ${G.drops.length}\nLooking at ${target && !target.mob ? BLOCKS[target.id].name + ` (${target.x},${target.y},${target.z})` : target?.mob ? (target.mob.type || target.mob.kind) : '-'}`;
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

addEventListener('pagehide', () => { if (G.world && G.state !== 'title') save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'playing') pause(); });

// exposed for automated checks
window.__bc = { tick, Boat, Minecart, applyPotion, mount, dismount, useRod, gateway, Mob, MOB_TYPES, G, player, renderer, scene, camera, keys, mouse, useItem, breakBlock, save, openInventory, closeInventory, invUI, get target() { return target; }, updateTarget, maxStack, travel, explode, addXp, strongholdPos, rayBox };
