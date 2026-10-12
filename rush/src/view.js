// Rescue Rush's 3D view (three.js, shared with Peak Rider: ../../peak/vendor). It only draws: the rules are in
// rules.js. Everything is made in code — no image or model files. The road runs along -z in the scene (the rules' z is
// the distance travelled); x is across. Low-poly, flat-shaded: the road with its lanes, the roadside of each call's
// place (tea gardens, a market, the coast, the desert, a rainy city, a mountain road, a night market, a snowy pass),
// the traffic (cars, auto-rickshaws, scooters, buses, painted trucks), the player's rescue vehicle with its light bar,
// and the hospital at the end.
import * as THREE from '../../peak/vendor/three.module.min.js';
import { LANE, laneX } from './rules.js';

const THEMES = {
  tea: { sky: [0x6cb8ec, 0xe6f4ff], ground: 0x6fae4a, ground2: 0x5c9a3e, side: 'tea', fog: 0xdcefe6, fogD: 0.006 },
  market: { sky: [0x6aaee8, 0xf6ecd8], ground: 0xb9a888, ground2: 0xa89676, side: 'market', fog: 0xefe4d0, fogD: 0.006 },
  coast: { sky: [0x4fb0f0, 0xe8f7ff], ground: 0xe7d6a6, ground2: 0x8fbf5a, side: 'coast', fog: 0xd8eefa, fogD: 0.004, sea: 0x2f8fd0 },
  desert: { sky: [0x7ab8e8, 0xfbe3b8], ground: 0xe2bf84, ground2: 0xd4ad70, side: 'desert', fog: 0xf6dfb8, fogD: 0.004 },
  monsoon: { sky: [0x6b7c8e, 0xb7c3cc], ground: 0x5f8a4e, ground2: 0x4e7642, side: 'city', fog: 0x9aa8b4, fogD: 0.011, rain: true },
  ghat: { sky: [0x8fb4d8, 0xe0ebf2], ground: 0x5f9a4c, ground2: 0x7a8a6a, side: 'ghat', fog: 0xd6e2ea, fogD: 0.012 },
  night: { sky: [0x0b1430, 0x2a2f5a], ground: 0x2a3a2c, ground2: 0x223024, side: 'night', fog: 0x1a2040, fogD: 0.009, night: true },
  snow: { sky: [0x8ab4dc, 0xf2f6fa], ground: 0xf1f5f9, ground2: 0xdfe7ef, side: 'snow', fog: 0xe6eef6, fogD: 0.007, snow: true },
};
const COLOURS = [0xe63946, 0xf4a261, 0x2a9d8f, 0x457b9d, 0xe9c46a, 0x8d99ae, 0xffffff, 0x6a4c93];
const hash = (n) => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true, ...extra });
function canvasTexture(draw, w = 256, h = 64) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function box(w, h, l, m, x = 0, y = 0, z = 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); b.position.set(x, y, z); return b; }

export function createView(canvas) {
  const mobile = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1200);
  let scene, lv, theme, player, sun, lights = [], drops = null, items = [], meshes = new Map(), camX = 0;

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 74 : 60; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ---------------------------------------------------------------- vehicles
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 8), wheelMat = mat(0x222428);
  function wheels(g, w, l, r = 0.38) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const m = new THREE.Mesh(wheelGeo, wheelMat); m.scale.setScalar(r / 0.38); m.rotation.z = Math.PI / 2; m.position.set(sx * (w / 2 - 0.05), r, sz * (l / 2 - r - 0.35)); g.add(m); } }
  function lamps(g, w, l, y, night) {
    const head = mat(0xfff6d6, { emissive: 0xfff2c0, emissiveIntensity: night ? 2 : 0.5 }), tail = mat(0xff3030, { emissive: 0xff1010, emissiveIntensity: night ? 1.6 : 0.6 });
    for (const sx of [-1, 1]) { g.add(box(0.35, 0.2, 0.08, head, sx * (w / 2 - 0.3), y, -l / 2 - 0.02)); g.add(box(0.3, 0.18, 0.08, tail, sx * (w / 2 - 0.3), y, l / 2 + 0.02)); }
    // blinkers: orange, lit while the vehicle signals a lane change
    const blink = mat(0xffa024, { emissive: 0xff8c00, emissiveIntensity: 0 }), L = box(0.16, 0.16, 0.3, blink, -w / 2 - 0.02, y, -l / 2 + 0.3), R = box(0.16, 0.16, 0.3, blink.clone(), w / 2 + 0.02, y, -l / 2 + 0.3);
    g.add(L, R); g.userData.blink = [L, R];
  }
  function makeTraffic(c) {
    const g = new THREE.Group(), col = COLOURS[c.colour], night = !!theme.night;
    if (c.type === 'car') {
      g.add(box(c.w, 0.75, c.l, mat(col), 0, 0.75)); g.add(box(c.w - 0.2, 0.6, c.l * 0.5, mat(0x3a5a78), 0, 1.4, 0.15));
      wheels(g, c.w, c.l); lamps(g, c.w, c.l, 0.85, night);
    } else if (c.type === 'auto') {
      // an auto-rickshaw: a small green-yellow cab with a black canopy, three wheels
      g.add(box(c.w, 0.7, c.l, mat(0x2e9e48), 0, 0.65)); g.add(box(c.w, 0.12, c.l * 0.85, mat(0x1d1d1d), 0, 1.75, 0.1));
      g.add(box(c.w - 0.1, 0.9, 0.08, mat(0xf2c12e), 0, 1.25, -c.l / 2 + 0.25));
      for (const [x, z] of [[0, -c.l / 2 + 0.4], [-c.w / 2, c.l / 2 - 0.4], [c.w / 2, c.l / 2 - 0.4]]) { const m = new THREE.Mesh(wheelGeo, wheelMat); m.scale.setScalar(0.75); m.rotation.z = Math.PI / 2; m.position.set(x, 0.29, z); g.add(m); }
      lamps(g, c.w, c.l, 0.7, night);
    } else if (c.type === 'scooter') {
      g.add(box(0.5, 0.5, c.l, mat(col), 0, 0.6)); g.add(box(0.55, 0.55, 0.5, mat(0x30343a), 0, 1.15, 0.3));
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat(0xf1f1f1)); helmet.position.set(0, 1.65, 0.25); g.add(helmet);
      for (const z of [-c.l / 2 + 0.3, c.l / 2 - 0.3]) { const m = new THREE.Mesh(wheelGeo, wheelMat); m.scale.setScalar(0.7); m.rotation.z = Math.PI / 2; m.position.set(0, 0.27, z); g.add(m); }
      lamps(g, 0.6, c.l, 0.7, night);
    } else if (c.type === 'bus') {
      g.add(box(c.w, 2.4, c.l, mat(col), 0, 1.6)); g.add(box(c.w + 0.02, 0.7, c.l - 1, mat(0x2b3f55), 0, 2.2));
      g.add(box(c.w + 0.03, 0.25, c.l, mat(0xffffff), 0, 1.0)); wheels(g, c.w, c.l, 0.5); lamps(g, c.w, c.l, 0.9, night);
    } else {
      // a painted truck: a bright cab and a tall box with stripes
      const cab = mat([0xe76f51, 0x2a9d8f, 0xe9c46a][c.colour % 3]);
      g.add(box(c.w, 1.8, 2.2, cab, 0, 1.5, -c.l / 2 + 1.1)); g.add(box(c.w - 0.1, 0.6, 0.06, mat(0x2b3f55), 0, 1.9, -c.l / 2 - 0.01));
      const body = box(c.w, 2.6, c.l - 2.4, mat(0xf4f1de), 0, 1.9, 1.2); g.add(body);
      for (let k = 0; k < 3; k++) g.add(box(c.w + 0.04, 0.22, c.l - 2.4, mat(COLOURS[(c.colour + k + 1) % 8]), 0, 1.0 + k * 0.7, 1.2));
      wheels(g, c.w, c.l, 0.5); lamps(g, c.w, c.l, 0.9, night);
    }
    if (c.dir < 0) g.rotation.y = Math.PI;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g); return g;
  }
  // the player's rescue vehicle: white with a blue stripe and a heart, a light bar that flashes with the siren
  function makePlayer(kind) {
    const g = new THREE.Group(), w = 2, l = 4.6, night = !!theme.night;
    const body = kind === 'fire' ? 0xd62828 : kind === 'jeep' ? 0xf77f00 : 0xf8f9fb, stripe = kind === 'ambulance' ? 0x1e6fd9 : 0xffffff;
    g.add(box(w, 1.0, l, mat(body), 0, 0.95)); g.add(box(w, 1.1, l * 0.62, mat(body), 0, 2.0, 0.55));
    g.add(box(w + 0.02, 0.25, l, mat(stripe), 0, 1.25));
    g.add(box(w - 0.2, 0.55, 0.06, mat(0x2b3f55), 0, 2.15, -l * 0.31 + 0.55 - 0.02));
    if (kind === 'fire') { g.add(box(0.5, 0.15, l * 0.9, mat(0xc0c0c0), 0.4, 2.65, 0.2)); g.add(box(0.5, 0.15, l * 0.9, mat(0xc0c0c0), -0.4, 2.65, 0.2)); }
    const heart = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: canvasTexture((x) => { x.fillStyle = '#e63946'; x.beginPath(); x.moveTo(64, 112); x.bezierCurveTo(10, 70, 6, 30, 36, 22); x.bezierCurveTo(52, 18, 62, 30, 64, 40); x.bezierCurveTo(66, 30, 76, 18, 92, 22); x.bezierCurveTo(122, 30, 118, 70, 64, 112); x.fill(); }, 128, 128), transparent: true }));
    heart.position.set(0, 2.1, l * 0.62 / 2 + 0.55 + 0.04); g.add(heart);
    const red = mat(0xff2a2a, { emissive: 0xff0000, emissiveIntensity: 0.2 }), blue = mat(0x2a6bff, { emissive: 0x0040ff, emissiveIntensity: 0.2 });
    const bar = [box(0.7, 0.25, 0.35, red, -0.4, 2.7, -0.3), box(0.7, 0.25, 0.35, blue, 0.4, 2.7, -0.3)];
    g.add(...bar); wheels(g, w, l, 0.42); lamps(g, w, l, 0.95, night);
    if (night) {
      const hl = new THREE.SpotLight(0xfff2c0, 160, 70, 0.5, 0.6, 1.3); hl.position.set(0, 1, -2.4); hl.target.position.set(0, 0, -20); g.add(hl, hl.target);
      const glow = new THREE.PointLight(0xffffff, 14, 9); glow.position.set(0, 4, 3); g.add(glow); // so the child can see their own vehicle
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.userData.bar = bar; scene.add(g); return g;
  }

  // ---------------------------------------------------------------- the road and its place
  function road() {
    const L = lv.length + 300, W = lv.lanes * LANE, mid = -L / 2 + 100;
    const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.6, L), mat(theme.night ? 0x2a2c33 : 0x45484f, { roughness: 0.95 }));
    asphalt.rotation.x = -Math.PI / 2; asphalt.position.set(0, 0.01, mid); asphalt.receiveShadow = true; scene.add(asphalt);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, L + 600), mat(theme.ground, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, mid); ground.receiveShadow = true; scene.add(ground);
    // edges and lane lines: white dashes between same-way lanes, a double yellow line between the directions
    const paint = mat(0xf2f2f2, { emissive: theme.night ? 0x444444 : 0x000000 }), yellow = mat(0xffcc33, { emissive: theme.night ? 0x554400 : 0x000000 });
    const dash = new THREE.BoxGeometry(0.15, 0.02, 3), n = Math.ceil(L / 9);
    for (let k = 1; k < lv.lanes; k++) {
      const x = -W / 2 + k * LANE;
      if (k === lv.oncoming) { for (const dx of [-0.15, 0.15]) { const y2 = box(0.1, 0.02, L, yellow, x + dx, 0.03, mid); scene.add(y2); } continue; }
      const im = new THREE.InstancedMesh(dash, paint, n), m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { m4.makeTranslation(x, 0.03, 100 - i * 9); im.setMatrixAt(i, m4); }
      scene.add(im);
    }
    for (const s of [-1, 1]) scene.add(box(0.18, 0.02, L, paint, s * (W / 2 - 0.2), 0.03, mid));
    // kerbs
    for (const s of [-1, 1]) scene.add(box(0.5, 0.25, L, mat(0xb8b8b0), s * (W / 2 + 0.3), 0.12, mid));
  }
  // the roadside, by place: instanced so a long road stays cheap
  function roadside() {
    const W = lv.lanes * LANE, L = lv.length + 300, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    const place = (geo, material, every, sides, offset, scaleFn, yFn = () => 0, colours) => {
      const spots = [];
      for (let z = 100; z > -L; z -= every) for (const side of sides) { const h = hash(Math.floor(z * 7) + side * 13); if (h < 0.15) continue; spots.push([side * (W / 2 + offset + h * 6), z + h * every * 0.5, h]); }
      const im = new THREE.InstancedMesh(geo, material, spots.length);
      spots.forEach(([x, z, h], i) => { const sc = scaleFn(h); m4.compose(p.set(x, yFn(sc), z), q.setFromEuler(e.set(0, h * 6, 0)), s.set(sc, sc, sc)); im.setMatrixAt(i, m4); if (colours) im.setColorAt(i, new THREE.Color(colours[i % colours.length])); });
      im.castShadow = true; scene.add(im); return im;
    };
    const both = [-1, 1], trunk = mat(0x6d4a30);
    const tree = (leaf, every = 14, off = 4) => { place(new THREE.CylinderGeometry(0.15, 0.25, 3, 5), trunk, every, both, off, (h) => 0.8 + h * 0.6, (sc) => 1.5 * sc); place(new THREE.IcosahedronGeometry(1.8, 0), mat(leaf), every, both, off, (h) => 0.8 + h * 0.6, (sc) => 3.6 * sc); };
    const buildings = (colours, every = 11, lit = false) => {
      const geo = new THREE.BoxGeometry(6, 1, 6); geo.translate(0, 0.5, 0);
      const spots = []; for (let z = 100; z > -L; z -= every) for (const side of both) spots.push([side * (W / 2 + 7 + hash(Math.floor(z) + side) * 4), z, 6 + hash(Math.floor(z * 3) + side) * 14]);
      const im = new THREE.InstancedMesh(geo, mat(0xffffff, lit ? { emissive: 0xffd27a, emissiveIntensity: 0.25 } : {}), spots.length);
      spots.forEach(([x, z, h], i) => { m4.compose(p.set(x, 0, z), q.identity(), s.set(1, h, 1)); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color(colours[i % colours.length])); });
      im.castShadow = true; scene.add(im);
    };
    switch (theme.side) {
      case 'tea': // rows of round tea bushes on the slopes, shade trees between
        place(new THREE.IcosahedronGeometry(0.9, 0), mat(0x3f8f3a), 3, both, 2, (h) => 0.8 + h * 0.4, (sc) => 0.5 * sc);
        tree(0x4f9a3e, 30, 10); break;
      case 'market':
        buildings([0xf4a261, 0xe9c46a, 0x2a9d8f, 0xe76f51, 0xf1faee, 0x90be6d]);
        break;
      case 'coast': {
        const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, L + 600), mat(theme.sea, { roughness: 0.2, metalness: 0.1 }));
        sea.rotation.x = -Math.PI / 2; sea.position.set(-W / 2 - 320, 0.0, -L / 2 + 100); scene.add(sea);
        place(new THREE.CylinderGeometry(0.15, 0.25, 6, 5), trunk, 16, [1, -1], 3, (h) => 0.9 + h * 0.4, (sc) => 3 * sc);
        place(new THREE.ConeGeometry(2.4, 1, 6), mat(0x3a9a4a), 16, [1, -1], 3, (h) => 0.9 + h * 0.4, (sc) => 6.2 * sc); break;
      }
      case 'desert':
        place(new THREE.SphereGeometry(10, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(theme.ground2), 40, both, 30, (h) => 1 + h * 1.5); // dunes
        tree(0x8aa04a, 40, 8); break;
      case 'city':
        buildings([0x9aa5b1, 0xb8c0c8, 0x7d8b99, 0xc9b79c]); break;
      case 'ghat': { // a rock wall on the left, a guard rail and a drop on the right
        scene.add(box(4, 30, L, mat(0x7a7064), -W / 2 - 3, 15, -L / 2 + 100));
        scene.add(box(0.15, 0.6, L, mat(0xd8dde3, { metalness: 0.6 }), W / 2 + 0.9, 0.6, -L / 2 + 100));
        const drop = new THREE.Mesh(new THREE.PlaneGeometry(700, L + 600), mat(0x4f7f45)); drop.rotation.x = -Math.PI / 2; drop.position.set(W / 2 + 352, -30, -L / 2 + 100); scene.add(drop);
        tree(0x2f6b3a, 18, 4); break;
      }
      case 'night':
        buildings([0x2a3b5c, 0x3b2a5c, 0x2a5c4a, 0x5c3b2a], 11, true);
        place(new THREE.SphereGeometry(0.25, 6, 4), mat(0xffe08a, { emissive: 0xffd060, emissiveIntensity: 2 }), 4, both, 1.5, () => 1, () => 4.2); // string lights
        break;
      case 'snow':
        place(new THREE.ConeGeometry(1.6, 4, 6), mat(0x2a5a42), 10, both, 4, (h) => 0.8 + h * 0.6, (sc) => 2 * sc);
        place(new THREE.ConeGeometry(30, 60, 5), mat(0xe8eef5), 80, both, 60, (h) => 0.6 + h, (sc) => 30 * sc); break;
    }
    // the hospital at the end: a white building with a red heart and its name
    const H = new THREE.Group(), sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.2), new THREE.MeshBasicMaterial({ map: canvasTexture((x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#e63946'; x.font = '900 40px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('♥ HOSPITAL', w / 2, h / 2 + 2); }) }));
    H.add(box(22, 12, 10, mat(0xf4f6f8), 0, 6, 0)); sign.position.set(0, 10, 5.05); H.add(sign);
    for (let k = -3; k <= 3; k++) H.add(box(2, 1.6, 0.1, mat(0x7fb3e0), k * 3, 5, 5.05));
    H.position.set(W / 2 + 14, 0, -lv.length - 4); scene.add(H);
    const arch = new THREE.Group(); for (const sx of [-1, 1]) arch.add(box(0.3, 5, 0.3, mat(0xffffff), sx * (W / 2 + 0.6), 2.5, 0));
    arch.add(box(W + 1.6, 1, 0.3, new THREE.MeshBasicMaterial({ map: canvasTexture((x, w, h) => { x.fillStyle = '#2a9d8f'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = '900 34px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('HOSPITAL ▶', w / 2, h / 2 + 2); }) }), 0, 5, 0));
    arch.position.z = -lv.length; scene.add(arch);
  }

  function setLevel(level, kind) {
    if (scene) scene.traverse((o) => { o.geometry?.dispose(); for (const m of [].concat(o.material ?? [])) { m.map?.dispose(); m.dispose(); } });
    lv = level; theme = THEMES[lv.theme]; meshes = new Map();
    scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(theme.fog, theme.fogD);
    scene.background = new THREE.Color(theme.sky[0]).lerp(new THREE.Color(theme.sky[1]), 0.5);
    scene.add(new THREE.HemisphereLight(theme.night ? 0x5a6aa8 : 0xffffff, theme.ground2, theme.night ? 0.5 : 0.9));
    sun = new THREE.DirectionalLight(theme.night ? 0x8090c0 : 0xfff0d8, theme.night ? 0.4 : 2.2);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 30, bottom: -30, near: 1, far: 120 });
    scene.add(sun, sun.target);
    road(); roadside();
    // clocks (+3 s) and coins in the lanes
    const coin = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16), gold = mat(0xffc83d, { metalness: 0.8, roughness: 0.3, emissive: 0x5a3c00, emissiveIntensity: 0.5 });
    const clockTex = canvasTexture((x) => { x.fillStyle = '#2ecc71'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '900 52px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('+3', 64, 68); }, 128, 128);
    items = lv.items.map((it) => {
      const m = it.kind === 'coin' ? new THREE.Mesh(coin, gold) : new THREE.Sprite(new THREE.SpriteMaterial({ map: clockTex }));
      if (it.kind === 'coin') m.rotation.x = Math.PI / 2; else m.scale.set(1.6, 1.6, 1);
      m.position.set(laneX(lv, it.lane), 1.1, -it.z); scene.add(m); return m;
    });
    player = makePlayer(kind);
    if (theme.rain || theme.snow) {
      const p = []; for (let i = 0; i < 1500; i++) p.push((hash(i) - 0.5) * 50, hash(i * 3) * 25, (hash(i * 7) - 0.8) * 70);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      drops = new THREE.Points(g, new THREE.PointsMaterial({ color: theme.snow ? 0xffffff : 0xaac8e8, size: theme.snow ? 0.25 : 0.12, transparent: true, opacity: 0.8 })); scene.add(drops);
    } else drops = null;
    camX = 0;
  }

  // one frame: r is the run (rules.js), interpolated position in `at` ({x, z}); title: a slow look at the start
  function render(r, at, dt, title = false) {
    const t = performance.now() / 1000;
    player.position.set(at.x, 0, -at.z); player.rotation.y = -r.steer * 0.12 * Math.min(1, r.v / 10);
    player.visible = !(r.hitT > 0 && Math.floor(t * 10) % 2);
    const on = r.sirenT > 0, [red, blue] = player.userData.bar;
    red.material.emissiveIntensity = on && Math.floor(t * 8) % 2 ? 3 : 0.2; blue.material.emissiveIntensity = on && !(Math.floor(t * 8) % 2) ? 3 : 0.2;
    // traffic: a mesh per vehicle, made when it appears, dropped when it goes
    const seen = new Set();
    for (const c of r.cars) {
      let m = meshes.get(c); if (!m) { m = makeTraffic(c); meshes.set(c, m); }
      seen.add(c); m.position.set(c.x, 0, -c.z);
      const [L, R] = m.userData.blink, b = c.signal > 0 && Math.floor(t * 5) % 2 ? 2.5 : 0, left = (c.to < c.lane) === (c.dir > 0);
      L.material.emissiveIntensity = left ? b : 0; R.material.emissiveIntensity = left ? 0 : b;
    }
    for (const [c, m] of meshes) if (!seen.has(c)) { scene.remove(m); m.traverse((o) => o.geometry?.dispose()); meshes.delete(c); }
    items.forEach((m, i) => { m.visible = !r.got.has(i); if (lv.items[i].kind === 'coin') m.rotation.z = t * 3 + i; });
    // the camera: behind and above, easing across with the player
    camX += (at.x * 0.6 - camX) * Math.min(1, dt * 4);
    if (title) { camera.position.set(Math.cos(t * 0.2) * 9, 3.5, -at.z + Math.sin(t * 0.2) * 9); camera.lookAt(at.x, 1, -at.z); }
    else { camera.position.set(camX, 4.2, -at.z + 8.5); camera.lookAt(camX * 0.8, 1.2, -at.z - 18); }
    sun.position.set(at.x + 20, 40, -at.z + 20); sun.target.position.set(at.x, 0, -at.z - 8);
    if (drops) { drops.position.set(at.x, 0, -at.z); const p = drops.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * (theme.snow ? 3 : 22); if (y < 0) y += 25; p.setY(i, y); } p.needsUpdate = true; }
    renderer.render(scene, camera);
  }
  return { setLevel, render, renderer };
}
