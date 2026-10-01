// Physics shared by the player, mobs and dropped items; animal models and AI; thrown items.
import * as THREE from 'three';
import { BLOCKS, B, I, iconCanvas } from './blocks.js';
import { shapeOf } from './shapes.js';

const EPS = 1e-4;
const FULL = [[0, 0, 0, 1, 1, 1]];

function collideBoxes(world, x, y, z) {
  const id = world.getBlock(x, y, z);
  const b = BLOCKS[id];
  if (!b || !b.solid) return null;
  if (!b.shape) return FULL;
  return shapeOf(id, world.getMeta(x, y, z), world, x, y, z).collide;
}
// world-space boxes overlapping an entity AABB (pos = feet centre)
function overlapping(world, pos, hw, h) {
  const out = [];
  const x0 = Math.floor(pos.x - hw), x1 = Math.floor(pos.x + hw - EPS);
  const y0 = Math.floor(pos.y) - 1, y1 = Math.floor(pos.y + h - EPS);
  const z0 = Math.floor(pos.z - hw), z1 = Math.floor(pos.z + hw - EPS);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const bs = collideBoxes(world, x, y, z);
    if (!bs) continue;
    for (const b of bs) {
      const w = [x + b[0], y + b[1], z + b[2], x + b[3], y + b[4], z + b[5]];
      if (pos.x + hw > w[0] + EPS && pos.x - hw < w[3] - EPS && pos.y + h > w[1] + EPS && pos.y < w[4] - EPS && pos.z + hw > w[2] + EPS && pos.z - hw < w[5] - EPS) out.push(w);
    }
  }
  return out;
}
export const blocked = (world, pos, hw, h) => overlapping(world, pos, hw, h).length > 0;

// Axis-separated AABB sweep with optional step-up (stairs, slabs). Returns {ground, hitX, hitZ, hitCeil}.
export function moveAABB(world, pos, vel, dt, hw, h, step = 0, grounded = false) {
  const res = { ground: false, hitX: false, hitZ: false, hitCeil: false };
  for (const ax of ['y', 'x', 'z']) {
    const d = vel[ax] * dt;
    if (!d) continue;
    const before = pos[ax];
    pos[ax] += d;
    let hits = overlapping(world, pos, hw, h);
    if (!hits.length) continue;
    if (ax !== 'y' && step > 0 && grounded) {
      const y0 = pos.y;
      pos.y += step;
      if (!blocked(world, pos, hw, h)) {
        pos.y -= step;
        const under = overlapping(world, pos, hw, h);
        if (under.length) pos.y = Math.max(...under.map((b) => b[4]));
        continue;
      }
      pos.y = y0;
      hits = overlapping(world, pos, hw, h);
    }
    if (ax === 'y') {
      if (d < 0) { pos.y = Math.max(...hits.map((b) => b[4])); res.ground = true; }
      else { pos.y = Math.min(...hits.map((b) => b[1])) - h - EPS; res.hitCeil = true; }
    } else if (ax === 'x') {
      pos.x = d > 0 ? Math.min(...hits.map((b) => b[0])) - hw - EPS : Math.max(...hits.map((b) => b[3])) + hw + EPS; res.hitX = true;
      if (Math.abs(pos.x - before) > Math.abs(d) + 0.01) pos.x = before;
    } else {
      pos.z = d > 0 ? Math.min(...hits.map((b) => b[2])) - hw - EPS : Math.max(...hits.map((b) => b[5])) + hw + EPS; res.hitZ = true;
      if (Math.abs(pos.z - before) > Math.abs(d) + 0.01) pos.z = before;
    }
    vel[ax] = 0;
  }
  return res;
}

export function aabbOverlapsBlock(pos, hw, h, bx, by, bz) {
  return pos.x + hw > bx && pos.x - hw < bx + 1 && pos.y + h > by && pos.y < by + 1 && pos.z + hw > bz && pos.z - hw < bz + 1;
}
const inFluid = (world, pos, dy, id) => world.getBlock(Math.floor(pos.x), Math.floor(pos.y + dy), Math.floor(pos.z)) === id;

// ------------------------------------------------------------------ item drops
export class ItemDrop {
  constructor(scene, stack, x, y, z) {
    this.stack = stack; this.age = 0;
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3((Math.random() - 0.5) * 3, 3.5, (Math.random() - 0.5) * 3);
    const tex = new THREE.CanvasTexture(iconCanvas(stack.id, stack.pot));
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaTest: 0.1 }));
    this.sprite.scale.set(0.4, 0.4, 0.4);
    scene.add(this.sprite);
    this.scene = scene;
  }
  update(world, dt) {
    this.age += dt;
    this.vel.y -= 20 * dt;
    this.vel.x *= 0.9; this.vel.z *= 0.9;
    moveAABB(world, this.pos, this.vel, dt, 0.12, 0.25);
    if (inFluid(world, this.pos, 0.1, B.LAVA) && this.age > 0.5) this.stack.count = 0;
    this.sprite.position.set(this.pos.x, this.pos.y + 0.25 + Math.sin(this.age * 3) * 0.06, this.pos.z);
  }
  dispose() { this.scene.remove(this.sprite); this.sprite.material.map.dispose(); this.sprite.material.dispose(); }
}

// ------------------------------------------------------------------ projectiles
export class Projectile {
  constructor(scene, kind, pos, vel, owner, damage, pot) {
    this.kind = kind; this.pos = pos.clone(); this.vel = vel.clone(); this.owner = owner; this.damage = damage; this.pot = pot;
    this.age = 0; this.dead = false; this.scene = scene;
    const icon = { eye: I.EYE_OF_ENDER, pearl: I.ENDER_PEARL, egg: I.EGG, potion: I.SPLASH }[kind];
    const tex = new THREE.CanvasTexture(iconCanvas(icon, pot)); tex.magFilter = THREE.NearestFilter;
    this.mesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); this.mesh.scale.setScalar(0.4);
    scene.add(this.mesh);
  }
  update(world, dt, ctx) {
    this.age += dt;
    if (this.age > 20) this.dead = true;
    if (this.kind === 'eye') {
      // float toward the target, then drop
      this.vel.multiplyScalar(0.98);
      if (this.age > 2.2) { this.dead = true; ctx.eyeLanded(this.pos); }
    } else this.vel.y -= 20 * dt;
    const steps = Math.ceil(this.vel.length() * dt / 0.3);
    for (let s = 0; s < steps && !this.dead; s++) {
      this.pos.addScaledVector(this.vel, dt / steps);
      if (this.kind === 'eye') continue;
      const b = BLOCKS[world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y), Math.floor(this.pos.z))];
      if (b && b.solid) { this.dead = true; ctx.projectileBurst(this); break; }
      const hit = ctx.hitTest(this);
      if (hit) { this.dead = true; break; }
    }
    this.mesh.position.copy(this.pos);
  }
  dispose() { this.scene.remove(this.mesh); this.mesh.material.map.dispose(); this.mesh.material.dispose(); }
}

// ------------------------------------------------------------------ mob models
const box = (w, h, d, color, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
};
// A limb pivoting at its top
const limb = (w, h, d, color, x, y, z) => {
  const g = new THREE.Group();
  g.add(box(w, h, d, color, 0, -h / 2, 0)); g.position.set(x, y, z);
  return g;
};
const eyes = (g, y, z, dx, color = 0x111111, s = 0.08) => { g.add(box(s, s, 0.02, color, -dx, y, z)); g.add(box(s, s, 0.02, color, dx, y, z)); };
const quad = (g, color, legH, bodyY, len, wid) => {
  const legs = [[-wid, len], [wid, len], [-wid, -len], [wid, -len]].map(([x, z]) => limb(0.25, legH, 0.25, color, x, legH, z));
  legs.forEach((l) => g.add(l));
  return legs;
};

const rnd = (n) => Math.floor(Math.random() * (n + 1));
export const MOB_TYPES = {
  cow: {
    hp: 10, hw: 0.45, h: 1.3, speed: 1.2, passive: true, breed: I.WHEAT, drops: () => [{ id: I.BEEF, count: 1 + rnd(2) }, { id: I.LEATHER, count: rnd(2) }],
    build() {
      const g = new THREE.Group(); const brown = 0x5a3a22;
      g.add(box(0.9, 0.8, 1.4, brown, 0, 1.0, 0)); g.add(box(0.5, 0.4, 0.5, 0xeeeeee, 0.2, 1.1, 0.2));
      const head = box(0.6, 0.6, 0.45, brown, 0, 1.3, 0.9); g.add(head);
      g.add(box(0.4, 0.25, 0.1, 0xd9a0a0, 0, 1.1, 1.14));
      g.add(box(0.12, 0.1, 0.1, 0xdddddd, -0.35, 1.6, 0.9)); g.add(box(0.12, 0.1, 0.1, 0xdddddd, 0.35, 1.6, 0.9));
      eyes(g, 1.4, 1.13, 0.18);
      return { g, legs: quad(g, brown, 0.6, 1, 0.5, 0.28), head };
    },
  },
  sheep: {
    hp: 8, hw: 0.45, h: 1.25, speed: 1.2, passive: true, breed: I.WHEAT, drops: () => [{ id: B.WOOL, count: 1 }],
    build() {
      const g = new THREE.Group(); const face = 0xc9b8a6;
      g.add(box(0.9, 0.8, 1.3, 0xeeeeee, 0, 0.95, 0));
      const head = box(0.5, 0.5, 0.55, face, 0, 1.2, 0.8); g.add(head);
      g.add(box(0.6, 0.35, 0.3, 0xeeeeee, 0, 1.4, 0.7)); eyes(g, 1.28, 1.08, 0.14);
      return { g, legs: quad(g, face, 0.55, 0.95, 0.45, 0.25), head };
    },
  },
  villager: {
    hp: 20, hw: 0.3, h: 1.95, speed: 0.9, passive: true, villager: true, drops: () => [],
    build() {
      const g = new THREE.Group();
      const robe = [0x7a5230, 0xeeeeee, 0x333333, 0x9a3a3a][Math.random() * 4 | 0];
      const head = box(0.5, 0.6, 0.5, 0xc59a78, 0, 1.7, 0); g.add(head);
      g.add(box(0.12, 0.25, 0.15, 0xb2876a, 0, 1.6, 0.3)); eyes(g, 1.75, 0.26, 0.12, 0x2e7d32);
      g.add(box(0.55, 1.05, 0.35, robe, 0, 0.95, 0));
      g.add(box(0.6, 0.2, 0.3, 0xa77b58, 0, 1.2, 0.25));
      const legs = [-0.13, 0.13].map((x) => limb(0.24, 0.45, 0.24, robe, x, 0.45, 0)); legs.forEach((l) => g.add(l));
      return { g, legs, head };
    },
  },
  chicken: {
    hp: 4, hw: 0.25, h: 0.7, speed: 1.2, passive: true, breed: I.SEEDS, drops: () => [{ id: I.FEATHER, count: rnd(2) }, { id: I.CHICKEN, count: 1 }],
    build() {
      const g = new THREE.Group();
      g.add(box(0.4, 0.4, 0.5, 0xf5f5f5, 0, 0.45, 0));
      const head = box(0.25, 0.35, 0.2, 0xf5f5f5, 0, 0.75, 0.25); g.add(head);
      g.add(box(0.12, 0.08, 0.1, 0xf0a020, 0, 0.72, 0.4)); g.add(box(0.08, 0.1, 0.06, 0xd02020, 0, 0.64, 0.37));
      eyes(g, 0.8, 0.36, 0.08, 0x111111, 0.05);
      const legs = [-0.08, 0.08].map((x) => limb(0.05, 0.25, 0.05, 0xf0a020, x, 0.25, 0)); legs.forEach((l) => g.add(l));
      return { g, legs, head };
    },
  },
  wolf: {
    hp: 8, hw: 0.3, h: 0.85, speed: 2.6, wolf: true, drops: () => [],
    build() {
      const g = new THREE.Group(); const grey = 0xd6d2cc;
      g.add(box(0.45, 0.45, 0.9, grey, 0, 0.6, 0));
      const head = box(0.4, 0.4, 0.35, grey, 0, 0.8, 0.55); g.add(head);
      g.add(box(0.2, 0.15, 0.2, 0xb8b2aa, 0, 0.72, 0.8)); eyes(g, 0.86, 0.73, 0.1);
      g.add(box(0.1, 0.12, 0.08, grey, -0.12, 1.05, 0.5)); g.add(box(0.1, 0.12, 0.08, grey, 0.12, 1.05, 0.5));
      const tail = box(0.1, 0.1, 0.45, grey, 0, 0.75, -0.6); tail.rotation.x = 0.6; g.add(tail);
      const collar = box(0.42, 0.08, 0.1, 0xd02020, 0, 0.7, 0.4); collar.visible = false; g.add(collar);
      return { g, legs: quad(g, grey, 0.4, 0.6, 0.3, 0.14), head, collar };
    },
  },
};

export class Mob {
  constructor(scene, type, x, y, z) {
    this.type = type; this.t = MOB_TYPES[type];
    this.hp = this.t.hp;
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.yaw = Math.random() * Math.PI * 2;
    this.walkT = 0; this.wanderT = 0; this.moving = false; this.hurtT = 0; this.dead = false; this.burnT = 0; this.fireT = 0;
    this.love = 0; this.age = 0; this.baby = 0;
    this.model = this.t.build();
    this.scene = scene;
    if (this.t.villager) this.profession = Math.random() * 4 | 0;
    scene.add(this.model.g);
  }
  get hw() { return this.t.hw; }
  get h() { return this.t.h; }
  update(world, dt, player, ctx) {
    const t = this.t;
    this.age += dt;
    let wish = 0;
    const toP = new THREE.Vector3().subVectors(player.pos, this.pos);
    const distP = toP.length();

    if (t.wolf && this.owner) {
      // a tame wolf: sit or follow
      if (this.sitting) wish = 0;
      else if (distP > 14) { this.teleportNear(world, player.pos); }
      else if (distP > 3.5) { this.yaw = Math.atan2(toP.x, toP.z); wish = 1.1; }
      else wish = 0;
    } else if (this.fleeT > 0) {
      this.fleeT -= dt; wish = 1.8;
    } else if (t.passive && ctx.heldFood === t.breed && distP < 8 && distP > 1.5) {
      // animals follow someone holding their food
      this.yaw = Math.atan2(toP.x, toP.z); wish = 0.8;
    } else if (this.love > 0 && ctx.mate(this)) {
      const m = ctx.mate(this); const d = new THREE.Vector3().subVectors(m.pos, this.pos);
      this.yaw = Math.atan2(d.x, d.z); wish = d.length() > 1 ? 1 : 0;
    } else {
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = 2 + Math.random() * 5;
        this.moving = Math.random() < 0.55;
        this.yaw += (Math.random() - 0.5) * 3;
      }
      wish = this.moving ? 1 : 0;
    }
    this.love = Math.max(0, this.love - dt);
    if (this.baby > 0) { this.baby -= dt; this.model.g.scale.setScalar(this.baby > 0 ? 0.55 : 1); }

    const sp = t.speed * wish * (this.baby > 0 ? 1.2 : 1);
    const inWater = inFluid(world, this.pos, 0.4, B.WATER);
    const inLava = inFluid(world, this.pos, 0.2, B.LAVA);
    const kb = this.kb || { x: 0, z: 0 };
    this.vel.x = Math.sin(this.yaw) * sp + kb.x;
    this.vel.z = Math.cos(this.yaw) * sp + kb.z;
    if (this.kb) { this.kb.multiplyScalar(Math.pow(0.02, dt)); if (this.kb.length() < 0.05) this.kb = null; }
    this.vel.y -= (inWater ? 6 : 28) * dt;
    if (inWater) { this.vel.y = Math.max(this.vel.y, -2); if (Math.random() < 0.2) this.vel.y = 2.5; }
    const r = moveAABB(world, this.pos, this.vel, dt, this.hw, this.h, 0.6, this.ground);
    this.ground = r.ground;
    if ((r.hitX || r.hitZ) && wish && r.ground) this.vel.y = 8.2;
    // animate
    this.walkT += dt * (wish ? 8 : 0);
    const sw = Math.sin(this.walkT) * 0.6 * (wish ? 1 : 0);
    this.model.legs.forEach((l, i) => { l.rotation.x = (i % 2 ? sw : -sw) * (i >= 2 && t.passive && !t.villager ? -1 : 1); });
    this.hurtT -= dt;
    const flash = this.hurtT > 0 ? 0x880000 : this.fireT > 0 ? 0x442200 : 0;
    this.model.g.traverse((o) => { if (o.material) o.material.emissive?.setHex(flash); });
    this.model.g.position.copy(this.pos);
    this.model.g.rotation.y = this.yaw;
    if (inLava) this.fireT = 5;
    if (this.model.collar) this.model.collar.visible = !!this.owner;
    if (t.wolf && this.sitting) this.model.g.rotation.x = -0.3; else this.model.g.rotation.x = 0;
    if (inWater) this.fireT = 0;
    if (this.fireT > 0) {
      this.fireT -= dt; this.burnT += dt;
      if (this.burnT > 1) { this.burnT = 0; this.damage(inLava ? 4 : 1, null); }
    }
    if (this.pos.y < -20) this.dead = true;
  }
  teleportNear(world, target) {
    for (let k = 0; k < 10; k++) {
      const x = Math.floor(target.x + (Math.random() - 0.5) * 12), z = Math.floor(target.z + (Math.random() - 0.5) * 12);
      if (!world.isLoaded(x, z)) continue;
      const y = world.surfaceY(x, z);
      if (Math.abs(y - target.y) > 8) continue;
      this.pos.set(x + 0.5, y, z + 0.5); this.vel.set(0, 0, 0);
      return true;
    }
    return false;
  }
  damage(n, fromPos, byPlayer) {
    if (this.t.villager) return; // villagers can never be hurt (children's app)
    this.hp -= n; this.hurtT = 0.3;
    if (byPlayer) this.byPlayer = true;
    if (fromPos) {
      const d = new THREE.Vector3().subVectors(this.pos, fromPos).setY(0).normalize().multiplyScalar(6);
      this.kb = d; this.vel.y = 5;
      if (this.t.passive) { this.fleeT = 4; this.yaw = Math.atan2(d.x, d.z); }
    }
    if (this.hp <= 0) this.dead = true;
  }
  // ray vs AABB; returns distance or null
  rayHit(origin, dir, max) {
    const s = this.baby > 0 ? 0.55 : 1, hw = this.hw * s, h = this.h * s;
    const min = [this.pos.x - hw, this.pos.y, this.pos.z - hw], mx = [this.pos.x + hw, this.pos.y + h, this.pos.z + hw];
    const o = [origin.x, origin.y, origin.z], d = [dir.x, dir.y, dir.z];
    let t0 = 0, t1 = max;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-9) { if (o[a] < min[a] || o[a] > mx[a]) return null; continue; }
      let ta = (min[a] - o[a]) / d[a], tb = (mx[a] - o[a]) / d[a];
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      if (t0 > t1) return null;
    }
    return t0;
  }
  contains(p, pad = 0) {
    return Math.abs(p.x - this.pos.x) < this.hw + pad && Math.abs(p.z - this.pos.z) < this.hw + pad && p.y > this.pos.y - pad && p.y < this.pos.y + this.h + pad;
  }
  dispose() {
    this.scene.remove(this.model.g);
    this.model.g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  }
}

// ------------------------------------------------------------------ vehicles
const woodM = () => new THREE.MeshLambertMaterial({ color: 0x9a7040 });
export class Boat {
  constructor(scene, x, y, z, yaw) {
    this.kind = 'boat'; this.item = I.BOAT; this.hw = 0.7; this.h = 0.6;
    this.pos = new THREE.Vector3(x, y, z); this.vel = new THREE.Vector3(); this.yaw = yaw; this.scene = scene; this.hp = 3; this.dead = false;
    const g = new THREE.Group(), m = woodM();
    const add = (w, h, d, x2, y2, z2) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x2, y2, z2); g.add(o); };
    add(1.4, 0.1, 2.4, 0, 0.05, 0); add(0.1, 0.45, 2.4, -0.7, 0.3, 0); add(0.1, 0.45, 2.4, 0.7, 0.3, 0); add(1.4, 0.45, 0.1, 0, 0.3, 1.2); add(1.4, 0.45, 0.1, 0, 0.3, -1.2);
    this.g = g; this.mats = [m]; scene.add(g);
  }
  update(world, dt, input) {
    const water = (dy) => world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y + dy), Math.floor(this.pos.z)) === B.WATER;
    const inWater = water(0.1), under = water(-0.2);
    if (input) {
      this.yaw += (input.turn || 0) * dt * 2.2;
      const sp = (input.fwd || 0) * (inWater || under ? 6 : 1);
      this.vel.x += (-Math.sin(this.yaw) * sp - this.vel.x) * Math.min(1, dt * 2);
      this.vel.z += (-Math.cos(this.yaw) * sp - this.vel.z) * Math.min(1, dt * 2);
    } else { this.vel.x *= Math.pow(0.3, dt); this.vel.z *= Math.pow(0.3, dt); }
    if (inWater) this.vel.y = 1.5; else if (under) this.vel.y = Math.max(0, this.vel.y - 10 * dt) * 0.5; else this.vel.y -= 20 * dt;
    moveAABB(world, this.pos, this.vel, dt, 0.6, 0.6);
    this.g.position.copy(this.pos); this.g.rotation.y = this.yaw;
  }
  seat() { return new THREE.Vector3(this.pos.x, this.pos.y + 0.1, this.pos.z); }
  rayHit(o, d, max) { return rayAABB(o, d, max, this.pos, 0.8, 0.6); }
  contains(p, pad = 0) { return Math.abs(p.x - this.pos.x) < 0.8 + pad && Math.abs(p.z - this.pos.z) < 0.8 + pad && p.y > this.pos.y - pad && p.y < this.pos.y + 0.8 + pad; }
  damage() { this.hp--; if (this.hp <= 0) this.dead = true; }
  dispose() { this.scene.remove(this.g); this.g.traverse((o) => o.geometry?.dispose()); this.mats.forEach((m) => m.dispose()); }
}

export class Minecart {
  constructor(scene, x, y, z) {
    this.kind = 'minecart'; this.item = I.MINECART;
    this.pos = new THREE.Vector3(x, y, z); this.vel = new THREE.Vector3(); this.speed = 0; this.dir = [0, 1]; this.scene = scene; this.hp = 3; this.dead = false;
    const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0x8a8a90 });
    const add = (w, h, d, x2, y2, z2) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x2, y2, z2); g.add(o); };
    add(0.9, 0.1, 1.2, 0, 0.15, 0); add(0.1, 0.5, 1.2, -0.45, 0.4, 0); add(0.1, 0.5, 1.2, 0.45, 0.4, 0); add(0.9, 0.5, 0.1, 0, 0.4, 0.6); add(0.9, 0.5, 0.1, 0, 0.4, -0.6);
    this.g = g; this.mats = [m]; scene.add(g);
  }
  update(world, dt, input) {
    const x = Math.floor(this.pos.x), y = Math.floor(this.pos.y + 0.1), z = Math.floor(this.pos.z);
    const rail = (a, b, c) => world.getBlock(a, b, c) === B.RAIL;
    if (rail(x, y, z)) {
      // follow the track: keep going while there is rail ahead, turn onto a side rail at a corner, stop at the end
      if (input?.push && input.push.lengthSq() > 0.01) {
        const px = input.push.x, pz = input.push.z;
        const want = Math.abs(px) > Math.abs(pz) ? [Math.sign(px), 0] : [0, Math.sign(pz)];
        if (this.speed < 0.5 && rail(x + want[0], y, z + want[1])) this.dir = want;
        if (want[0] === this.dir[0] && want[1] === this.dir[1]) this.speed = Math.min(8, this.speed + dt * 6);
      }
      this.speed *= Math.pow(0.8, dt);
      const frac = this.dir[0] ? this.pos.x - x : this.pos.z - z;
      const past = (this.dir[0] + this.dir[1]) > 0 ? frac >= 0.5 : frac <= 0.5;
      if (past && !rail(x + this.dir[0], y, z + this.dir[1])) {
        const side = (this.dir[0] ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]).find(([a, b]) => rail(x + a, y, z + b));
        this.pos.x = x + 0.5; this.pos.z = z + 0.5;
        if (side) this.dir = side; else this.speed = 0;
      }
      if (this.dir[0]) this.pos.z = z + 0.5; else this.pos.x = x + 0.5;
      this.vel.set(this.dir[0] * this.speed, 0, this.dir[1] * this.speed);
      this.pos.y = y + 0.0625;
      this.pos.addScaledVector(this.vel, dt);
    } else {
      this.vel.x *= Math.pow(0.2, dt); this.vel.z *= Math.pow(0.2, dt); this.vel.y -= 20 * dt;
      moveAABB(world, this.pos, this.vel, dt, 0.45, 0.7);
    }
    this.g.position.copy(this.pos); this.g.rotation.y = this.dir[0] ? Math.PI / 2 : 0;
  }
  seat() { return new THREE.Vector3(this.pos.x, this.pos.y + 0.25, this.pos.z); }
  rayHit(o, d, max) { return rayAABB(o, d, max, this.pos, 0.55, 0.8); }
  contains(p, pad = 0) { return Math.abs(p.x - this.pos.x) < 0.55 + pad && Math.abs(p.z - this.pos.z) < 0.55 + pad && p.y > this.pos.y - pad && p.y < this.pos.y + 0.8 + pad; }
  damage() { this.hp--; if (this.hp <= 0) this.dead = true; }
  dispose() { this.scene.remove(this.g); this.g.traverse((o) => o.geometry?.dispose()); this.mats.forEach((m) => m.dispose()); }
}

function rayAABB(o, d, max, c, hw, h) {
  const min = [c.x - hw, c.y, c.z - hw], mx = [c.x + hw, c.y + h, c.z + hw];
  const O = [o.x, o.y, o.z], D = [d.x, d.y, d.z];
  let t0 = 0, t1 = max;
  for (let a = 0; a < 3; a++) {
    if (Math.abs(D[a]) < 1e-9) { if (O[a] < min[a] || O[a] > mx[a]) return null; continue; }
    let ta = (min[a] - O[a]) / D[a], tb = (mx[a] - O[a]) / D[a];
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return null;
  }
  return t0;
}

// ------------------------------------------------------------------ fishing bobber
export class Bobber {
  constructor(scene, pos, vel) {
    this.pos = pos.clone(); this.vel = vel.clone(); this.state = 'fly'; this.wait = 0; this.bite = 0; this.scene = scene; this.dead = false;
    this.mesh = new THREE.Group();
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.15), new THREE.MeshBasicMaterial({ color: 0xe03030 }));
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.15), new THREE.MeshBasicMaterial({ color: 0xf5f5f5 })); w.position.y = -0.09;
    this.mesh.add(r, w);
    this.lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0x222222 }));
    this.line.frustumCulled = false;
    scene.add(this.mesh, this.line);
  }
  update(world, dt, hand, rain, ctx) {
    const water = world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y), Math.floor(this.pos.z)) === B.WATER;
    if (this.state === 'fly') {
      this.vel.y -= 20 * dt;
      moveAABB(world, this.pos, this.vel, dt, 0.08, 0.15);
      if (water) { this.state = 'float'; this.wait = 5 + Math.random() * (rain ? 10 : 20); this.vel.set(0, 0, 0); }
      else if (this.vel.lengthSq() < 0.01) this.state = 'ground';
    } else if (this.state === 'float' || this.state === 'bite') {
      const top = Math.floor(this.pos.y) + 0.85;
      if (!water && world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y) - 1, Math.floor(this.pos.z)) === B.WATER) this.pos.y -= dt;
      else this.pos.y += (top - this.pos.y) * Math.min(1, dt * 5);
      if (this.state === 'float') { this.wait -= dt; if (this.wait <= 0) { this.state = 'bite'; this.bite = 1.2; ctx.sound('splash'); } }
      else { this.bite -= dt; this.mesh.position.y -= 0.15; if (this.bite <= 0) { this.state = 'float'; this.wait = 4 + Math.random() * 12; } }
    }
    this.mesh.position.copy(this.pos);
    if (this.state === 'bite') this.mesh.position.y -= 0.2;
    const p = this.lineGeo.attributes.position;
    p.setXYZ(0, hand.x, hand.y, hand.z); p.setXYZ(1, this.pos.x, this.pos.y + 0.05, this.pos.z); p.needsUpdate = true;
    if (this.pos.distanceTo(hand) > 40) this.dead = true;
  }
  dispose() { this.scene.remove(this.mesh, this.line); this.lineGeo.dispose(); this.mesh.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); this.line.material.dispose(); }
}
