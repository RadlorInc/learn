// Dev-only test helpers for driving the game from the browser console:
//   await import('/dev-harness.js')   then use window.H
// Not referenced by index.html, so it never ships in the build.
const bc = window.__bc;
const { G, player } = bc;
const H = {
  play() { G.state = 'playing'; },
  run(sec, dt = 0.05) { for (let t = 0; t < sec; t += dt) { G.state = 'playing'; bc.tick(dt); } },
  async load() {
    let n = 0;
    while (G.state === 'loading' && n < 600) { bc.tick(0.016); n++; }
    return n;
  },
  aim(bx, by, bz, fy = 0.5) {
    const eye = player.pos.clone(); eye.y += 1.62;
    const tx = bx + 0.5 - eye.x, ty = by + fy - eye.y, tz = bz + 0.5 - eye.z;
    player.yaw = Math.atan2(-tx, -tz); player.pitch = Math.atan2(ty, Math.hypot(tx, tz));
    bc.updateTarget();
    return bc.target;
  },
  aimAt(v, dy = 0.8) {
    const eye = player.pos.clone(); eye.y += 1.62;
    const tx = v.x - eye.x, ty = v.y + dy - eye.y, tz = v.z - eye.z;
    player.yaw = Math.atan2(-tx, -tz); player.pitch = Math.atan2(ty, Math.hypot(tx, tz));
    bc.updateTarget();
    return bc.target;
  },
  give(id, count = 1, extra = {}) { G.inv.slots[G.inv.sel] = { id, count, ...extra }; },
  // a clean stone platform in the air around the player
  pad(y = 100, R = 8, id = 3) {
    const w = G.world;
    const x = Math.floor(player.pos.x), z = Math.floor(player.pos.z);
    for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) { w.setBlock(x + a, y, z + b, id); for (let k = 1; k < 5; k++) w.setBlock(x + a, y + k, z + b, 0); }
    player.pos.set(x + 0.5, y + 1, z + 0.5); player.vel.set(0, 0, 0); player.fallStart = null;
    H.run(0.3);
    return [x, y, z];
  },
  click(src, o = {}) {
    const el = document.querySelector(`#inventory [data-src="${src}"]`);
    if (!el) throw new Error('no slot ' + src + ' mode=' + bc.invUI.mode);
    bc.invUI.onClick({ target: el, button: o.right ? 2 : 0, shiftKey: !!o.shift, preventDefault() {} });
  },
  inv() { return G.inv.slots.map((s, i) => s && `${i}:${s.id}x${s.count}`).filter(Boolean).join(' '); },
  clearMobs() { G.mobs.forEach((m) => m.dispose()); G.mobs.length = 0; },
};
window.H = H;
export default H;
