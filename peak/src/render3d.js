// Peak Rider's 3D view (three.js). It only draws: the rules live in physics.js and the land in levels.js. Low-poly:
// flat-shaded facets, a few calm colours per theme, hazy far mountains, a sky that lights the scene — all made in
// code, no image or model files. The land is the world's height map, with no road drawn on it (the arrow and the map
// show the way); on it rivers and a frozen lake, mud and ice, ravines, tunnels through mountains (an arched tube under
// the mountain's own surface), trees and rocks, kicker ramps and rock arches, the camp and the villages, and the
// missions: treasure chests that open, beacons that light, each with a column of light seen from afar until it is
// done. The camera rides behind the car; the car's shadow sits right under it.
import * as THREE from '../vendor/three.module.min.js';
import { WHEELS } from './physics.js';

const THEMES = {
  safari: { sky: [0x58a8e8, 0xfbe7c0], grass: 0xc9b45a, grass2: 0xb3a04c, green: 0x7fa34a, rock: 0xa58a68, road: 0xb4723f, mud: 0x5c3d24, ice: 0xbfe6f5, snow: null, tree: 'acacia', leaf: [0x6d8f3a, 0x7d9c42, 0x5e7f34], fog: 0xf3dcb4, water: 0x3d8fc4, sun: 2.7, sunDir: [0.5, 0.75, 0.3] },
  snow: { sky: [0x7fb2e0, 0xeef5fc], grass: 0xf1f5f9, grass2: 0xe3eaf1, green: 0xd8e2ec, rock: 0x7b8898, road: 0xc6cfd9, mud: 0x8a7a6a, ice: 0xa8dcf2, snow: 0xffffff, tree: 'pine', leaf: [0x2a5a42, 0x336648], fog: 0xe6eef6, water: 0x5a9ccc, sun: 2.3, sunDir: [0.35, 0.65, 0.55], snowing: true },
};
const hash = (n) => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

// a soft round dot texture, for clouds, dust, splashes, sparkles and the car's shadow
function softDot(inner = 'rgba(255,255,255,1)') {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function canvasTexture(draw, w = 128, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createView(canvas) {
  const mobile = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  const dotTex = softDot();
  const boltTex = canvasTexture((x) => { x.fillStyle = '#ffd23f'; x.beginPath(); x.moveTo(74, 8); x.lineTo(34, 72); x.lineTo(62, 72); x.lineTo(50, 120); x.lineTo(96, 50); x.lineTo(66, 50); x.closePath(); x.fill(); });
  let scene, lv, theme, car, shade, sun, light, sunDir, itemMeshes = [], marks = {}, columns = {}, crateStack = null, snow, dust = [], camPos = null, camYaw = 0, look = null, envRT = null;

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < h ? 72 : 58; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------- helpers on the track
  // the point d metres to the right of track point i
  const across = (i, d) => { const p = lv.track[i]; return [p.x + Math.cos(p.h) * d, p.z + Math.sin(p.h) * d]; };
  const tunnelAt = (i) => lv.tunnels.find((t) => i >= t.from && i < t.to);
  const natAt = (x, z) => { const N = lv.N, i = Math.max(0, Math.min(N - 1, Math.round(x))), j = Math.max(0, Math.min(N - 1, Math.round(z))); return lv.NAT[j * N + i]; };
  // the tunnel's inside: straight walls, then an arched roof (height above the track, d across)
  const archY = (d) => { const a = Math.abs(d), w = lv.half + 1.6; return a >= w ? 0 : a > lv.half ? 3.6 + ((w - a) / 1.6) * 1.8 : 5.4 + (1 - a / lv.half) * 0.7; };

  // one flat colour per triangle, from `colour(triangle index, normal, centre)`
  function facets(pos, idx, colour, opts = {}) {
    let geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo = geo.toNonIndexed();
    const Pa = geo.attributes.position, col = new Float32Array(Pa.count * 3);
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), n = new THREE.Vector3(), ctr = new THREE.Vector3();
    for (let t = 0; t < Pa.count; t += 3) {
      va.fromBufferAttribute(Pa, t); vb.fromBufferAttribute(Pa, t + 1); vc.fromBufferAttribute(Pa, t + 2);
      n.subVectors(vb, va).cross(vc.clone().sub(va)).normalize();
      // every ground facet must face up (counter-clockwise from above), or it is culled and shows a hole
      if (opts.up !== false && n.y < 0) { n.negate(); for (let k = 0; k < 3; k++) { const tmp = Pa.getComponent(t + 1, k); Pa.setComponent(t + 1, k, Pa.getComponent(t + 2, k)); Pa.setComponent(t + 2, k, tmp); } }
      ctr.copy(va).add(vb).add(vc).multiplyScalar(1 / 3);
      const c = colour(t / 3, n, ctr);
      for (let k = 0; k < 3; k++) { col[(t + k) * 3] = c.r; col[(t + k) * 3 + 1] = c.g; col[(t + k) * 3 + 2] = c.b; }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, side: opts.side ?? THREE.FrontSide }));
    mesh.receiveShadow = true; mesh.castShadow = !!opts.cast; scene.add(mesh);
    return mesh;
  }
  // a strip along the track from i0 to i1: rows(i) = [[d across, y], ...]
  function strip(i0, i1, rows, colour, opts) {
    const pos = [], idx = []; let n = 0;
    for (let i = i0; i <= i1; i++, n++) {
      const rs = rows(i), R = rs.length;
      for (const [d, y] of rs) { const [x, z] = across(i, d); pos.push(x, y, z); }
      if (n) for (let j = 0; j < R - 1; j++) { const a = (n - 1) * R + j; idx.push(a, a + R, a + 1, a + 1, a + R, a + R + 1); }
    }
    return facets(pos, idx, colour, opts);
  }

  // ---------------------------------------------------------------- the land
  function terrain() {
    const STEP = 4, n = lv.size / STEP + 1, pos = [], idx = [], skip = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = i * STEP, z = j * STEP, c = z * lv.N + x;
      let y = lv.H[c];
      const t0 = lv.S[c] >= 0 ? lv.legs[lv.track[lv.S[c]].leg].kind : null;
      if (['tunnel', 'river', 'ramp'].includes(t0) && lv.D[c] < lv.half + 2) y -= 0.4; // under a drawn floor, so the coarse land never pokes through it
      // inside a tunnel's mountain: left out (the tube and the mountain's own surface over it are drawn instead)
      const t = lv.S[c] >= 0 && tunnelAt(lv.S[c]);
      skip.push(!!t && lv.D[c] < 13 && lv.S[c] > t.from + 1 && lv.S[c] < t.to - 2);
      pos.push(x + (hash(c) - 0.5) * 0.8, y, z + (hash(c * 3) - 0.5) * 0.8);
    }
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, e = a + n, f = e + 1;
      if (skip[a] || skip[b] || skip[e] || skip[f]) continue;
      if ((i + j) % 2) idx.push(a, e, b, b, e, f); else idx.push(a, e, f, a, f, b);
    }
    const C = (h) => new THREE.Color(h), grass = C(theme.grass), grass2 = C(theme.grass2), green = C(theme.green), rock = C(theme.rock), rock2 = C(theme.rock).offsetHSL(0, 0, -0.07);
    const ice = C(theme.ice), mud = C(theme.mud), snowC = theme.snow ? C(theme.snow) : null, c = new THREE.Color();
    const top = lv.track.reduce((m, p) => Math.max(m, p.y), -1e9);
    facets(pos, idx, (t, nrm, ctr) => {
      const cell = Math.round(Math.max(0, Math.min(lv.size, ctr.z))) * lv.N + Math.round(Math.max(0, Math.min(lv.size, ctr.x))), v = hash(t * 7 + 3), surf = lv.SURF[cell];
      if (nrm.y < 0.5) return c.copy(v > 0.5 ? rock : rock2);
      if (nrm.y < 0.66) return c.copy(v > 0.5 ? grass2 : grass).lerp(rock, 0.45); // steep grass, not bare rock
      if (surf === 2) return c.copy(ice).offsetHSL(0, 0, (v - 0.5) * 0.04);
      if (surf === 1) return c.copy(mud);
      if (snowC && ctr.y > top + 10) return c.copy(snowC);
      c.copy(v > 0.5 ? grass : grass2);
      return v > 0.82 ? c.lerp(green, 0.6) : c;
    });
    const base = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: theme.grass2, roughness: 1 }));
    base.rotation.x = -Math.PI / 2; base.position.set(lv.size / 2, lv.track[0].y - 60, lv.size / 2); scene.add(base);
  }

  // No road is drawn: the child finds the way with the arrow and the map. Only what the land itself cannot show is
  // laid down: a tunnel's stone floor, the stepping stones of a ford (and posts marking its edges), the wooden ramp
  // before a ravine.
  function track() {
    const h = lv.half, c = new THREE.Color(), stone = new THREE.Color(theme.rock), plank = new THREE.Color(0xb07a45), ford = new THREE.Color(0xd9cfb8);
    const rows = [[-h - 0.4, -0.2], [-h, 0], [0, 0], [h, 0], [h + 0.4, -0.2]];
    const post = new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 1, flatShading: true });
    for (const leg of lv.legs) {
      if (!['tunnel', 'river', 'ramp'].includes(leg.kind)) continue;
      const base = leg.kind === 'tunnel' ? stone : leg.kind === 'ramp' ? plank : ford;
      strip(leg.from, leg.to - 1, (i) => rows.map(([d, dy]) => { const [x, z] = across(i, d); return [d, lv.height(x, z) + 0.06 + dy]; }),
        (t) => c.copy(base).multiplyScalar(0.85 + hash(t >> 1) * 0.25));
      if (leg.kind === 'river') for (const i of [leg.from, leg.to - 1]) for (const d of [-h - 0.3, h + 0.3]) {
        const [x, z] = across(i, d), m = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.2, 6), post);
        m.position.set(x, lv.height(x, z) + 1.1, z); m.castShadow = true; scene.add(m);
      }
    }
  }

  // a tunnel: an arched tube on the track, the mountain's own surface over it, and a face round each mouth
  function tunnels() {
    const stone = new THREE.Color(theme.rock).multiplyScalar(0.8), stone2 = new THREE.Color(theme.rock).multiplyScalar(0.65), c = new THREE.Color(), w = lv.half + 1.6;
    const h = lv.half, arch = [[-w, 0], [-w, 3.6], [-h, 5.4], [-h / 2, 5.85], [0, 6.1], [h / 2, 5.85], [h, 5.4], [w, 3.6], [w, 0]];
    const lamp = new THREE.MeshStandardMaterial({ color: 0xfff1c0, emissive: 0xffd27a, emissiveIntensity: 1.6 });
    const rock = new THREE.Color(theme.rock), cover = new THREE.Color(theme.snow ?? theme.grass2);
    const span = []; for (let d = -15; d <= 15; d += 1.5) span.push(d);
    for (const t of lv.tunnels) {
      const road = (i) => lv.track[i].y, lid = (i, d) => { const [x, z] = across(i, d); return Math.max(natAt(x, z), road(i) + 6.6); };
      strip(t.from, t.to - 1, (i) => arch.map(([d, y]) => [d, road(i) + y]), (k) => c.copy(k % 2 ? stone : stone2), { up: false, side: THREE.DoubleSide, cast: true });
      strip(t.from + 1, t.to - 2, (i) => span.map((d) => [d, lid(i, d)]), (k, n) => c.copy(n.y < 0.6 ? rock : cover), { cast: true });
      // the faces round the mouths: from the arch (or the ground beside it) up to the mountain's surface
      for (const i of [t.from + 1, t.to - 2]) {
        const pos = [], idx = [];
        span.forEach((d, k) => {
          const [x, z] = across(i, d), a = Math.abs(d) < w ? road(i) + archY(d) : lv.height(x, z) - 0.5;
          pos.push(x, a, z, x, lid(i, d), z);
          if (k) { const b = (k - 1) * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
        });
        facets(pos, idx, () => c.copy(rock).multiplyScalar(0.75), { up: false, side: THREE.DoubleSide, cast: true });
      }
      // lamps along the walls
      for (let i = t.from + 6; i < t.to - 4; i += 10) for (const d of [-w + 0.15, w - 0.15]) {
        const [x, z] = across(i, d), m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.5), lamp);
        m.position.set(x, road(i) + 3.2, z); m.rotation.y = -lv.track[i].h; scene.add(m);
      }
    }
  }

  function water() {
    const mat = new THREE.MeshStandardMaterial({ color: theme.water, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.82 });
    for (const r of lv.rivers) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(90, r.w + 2), mat);
      m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, -r.c.h, 0);
      m.position.set(r.c.x, r.level, r.c.z); scene.add(m);
    }
  }

  function things() {
    const C = (x) => new THREE.Color(x), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const trees = lv.things.filter((o) => o.kind === 'tree'), rocks = lv.things.filter((o) => o.kind === 'rock');
    const bark = new THREE.MeshStandardMaterial({ color: 0x6d4a30, roughness: 1, flatShading: true }), leaf = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
    const acacia = theme.tree === 'acacia';
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.3, acacia ? 3.4 : 2, 5), bark, trees.length);
    const crowns = acacia ? [[new THREE.CylinderGeometry(2.6, 1.6, 0.9, 7), 3.6]] : [[new THREE.ConeGeometry(1.5, 2.8, 6), 2.6], [new THREE.ConeGeometry(1.05, 2.1, 6), 4]];
    const crownMeshes = crowns.map(([g]) => new THREE.InstancedMesh(g, leaf, trees.length));
    trees.forEach((o, k) => {
      const sc = o.size;
      m.compose(p.set(o.x, o.y + (acacia ? 1.7 : 1) * sc, o.z), q.identity(), s.set(sc, sc, sc)); trunk.setMatrixAt(k, m);
      crowns.forEach(([, y], j) => { m.compose(p.set(o.x, o.y + y * sc, o.z), q.setFromEuler(e.set(0, hash(k) * 6, 0)), s.set(sc, sc, sc)); crownMeshes[j].setMatrixAt(k, m); crownMeshes[j].setColorAt(k, C(theme.leaf[k % theme.leaf.length]).offsetHSL(0, 0, (hash(k * 3) - 0.5) * 0.08)); });
    });
    for (const t of [trunk, ...crownMeshes]) { t.castShadow = true; scene.add(t); }
    const stone = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: C(theme.rock).multiplyScalar(0.7), roughness: 1, flatShading: true }), Math.max(1, rocks.length));
    stone.count = rocks.length;
    rocks.forEach((o, k) => { m.compose(p.set(o.x, o.y + 0.35, o.z), q.setFromEuler(e.set(hash(k), hash(k * 5) * 6, 0)), s.set(1.15, 1.05, 1.15)); stone.setMatrixAt(k, m); });
    stone.castShadow = true; stone.receiveShadow = true; scene.add(stone);
  }

  function backdrop() {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(theme.sky[0]) }, bottom: { value: new THREE.Color(theme.sky[1]) }, sun: { value: sunDir.clone() } },
      vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 bottom; uniform vec3 sun; varying vec3 vd;
        void main(){ float h = clamp(vd.y * 1.6, 0.0, 1.0); vec3 c = mix(bottom, top, pow(h, 0.8));
          float s = max(dot(normalize(vd), normalize(sun)), 0.0); c += vec3(1.0, 0.85, 0.6) * pow(s, 24.0) * 0.6 + vec3(1.0, 0.95, 0.8) * pow(s, 600.0) * 3.0;
          gl_FragColor = vec4(c, 1.0); }`,
    }));
    sky.userData.follow = true; sky.renderOrder = -1; scene.add(sky);
    // far mountains in a ring round the land
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), haze = new THREE.Color(theme.fog);
    [[520, 0.35, 40], [760, 0.6, 46]].forEach(([R, mixFog, count], ri) => {
      const far = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 5, 1), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true, fog: false }), count);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + hash(i + ri * 100) * 0.1, r = R + hash(i * 3 + ri) * 90, h = (120 + hash(i * 7 + ri) * 160) * (1 + ri * 0.3), w = (130 + hash(i * 5 + ri) * 110) * (1 + ri * 0.3);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash(i * 11 + ri) * 6.28);
        m.compose(new THREE.Vector3(lv.size / 2 + Math.cos(a) * r, h / 2 - 40, lv.size / 2 + Math.sin(a) * r), q, new THREE.Vector3(w, h, w));
        far.setMatrixAt(i, m); far.setColorAt(i, c.setHex(theme.rock).lerp(haze, mixFog + hash(i * 5) * 0.08));
      }
      scene.add(far);
    });
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.25, fog: false }), geo = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 18; i++) {
      const a = hash(i * 11) * 6.28, r = 200 + hash(i * 5) * 420, g = new THREE.Group();
      for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(geo, mat), sz = 14 + hash(i * 9 + k) * 12; b.scale.set(sz * 1.5, sz * 0.7, sz); b.position.set((k - 1.5) * 18, (k % 2) * 6, hash(i * 2 + k) * 9); g.add(b); }
      g.position.set(lv.size / 2 + Math.cos(a) * r, 150 + hash(i * 13) * 80, lv.size / 2 + Math.sin(a) * r); g.rotation.y = a; scene.add(g);
    }
  }

  // ---------------------------------------------------------------- the car
  function sideShape(points) {
    const s = new THREE.Shape(); s.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) { const p = points[i]; if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]); }
    return s;
  }
  function extrudeSide(shape, width, mat, bevel = 0.12) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 3, steps: 1 });
    g.translate(0, 0, -(width - bevel * 2) / 2); g.rotateY(-Math.PI / 2); // the outline's x becomes the car's z (back is +z)
    g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  }
  function makeCar(model) {
    const g = new THREE.Group(), body = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({ color: model.color, roughness: 0.6, flatShading: true });
    const trim = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.8, flatShading: true });
    const glass = new THREE.MeshStandardMaterial({ color: 0x3a5a78, roughness: 0.3, flatShading: true });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, roughness: 0.5, flatShading: true });
    const lamp = new THREE.MeshStandardMaterial({ color: 0xfff7d6, emissive: 0xfff2c0, emissiveIntensity: 0.8 });
    const tail = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff1010, emissiveIntensity: 0.9 });
    const shape = model.shape;
    const lower = shape === 'buggy'
      ? [[1.6, -0.15], [1.65, 0.2, 1.45, 0.3], [-1.2, 0.3], [-1.6, 0.25, -1.65, 0.0], [-1.6, -0.15]]
      : [[1.65, -0.2], [1.7, 0.3, 1.45, 0.38], [-1.15, 0.36], [-1.62, 0.32, -1.68, 0.05], [-1.65, -0.2]];
    body.add(extrudeSide(sideShape(lower), 1.78, paint, 0.14));
    if (shape !== 'buggy') {
      const tall = shape === 'truck' ? 0.72 : shape === 'jeep' ? 0.66 : 0.5;
      const back = shape === 'truck' ? 0.05 : 1.15, front = shape === 'truck' ? -1.0 : -0.55;
      body.add(extrudeSide(sideShape([[back, 0.3], [back, 0.3 + tall * 0.9, back - 0.12, 0.3 + tall], [front + 0.35, 0.3 + tall], [front + 0.05, 0.3 + tall * 0.95, front - 0.05, 0.3]]), 1.56, paint, 0.1));
      body.add(extrudeSide(sideShape([[back - 0.12, 0.42], [back - 0.12, 0.3 + tall * 0.82], [front + 0.38, 0.3 + tall * 0.86], [front + 0.12, 0.42]]), 1.6, glass, 0.04));
      if (shape === 'truck') body.add(extrudeSide(sideShape([[1.6, 0.3], [1.6, 0.62], [0.2, 0.62], [0.2, 0.3]]), 1.72, trim, 0.05));
      if (model.id === 'rally') { const wing = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 1.5, 4, 8), trim); wing.rotation.z = Math.PI / 2; wing.position.set(0, 0.95, 1.45); body.add(wing); }
    } else {
      for (const [z, h] of [[0.6, 0.95], [-0.3, 0.85]]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.055, 10, 24, Math.PI), trim); hoop.position.set(0, 0.3, z); hoop.scale.y = h; body.add(hoop); }
      const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 6, 12), trim); seat.position.set(0, 0.55, 0.25); seat.rotation.x = 0.2; body.add(seat);
    }
    for (const z of [-1.72, 1.72]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.5, 6, 12), shape === 'buggy' ? trim : chrome); b.rotation.z = Math.PI / 2; b.position.set(0, -0.08, z); body.add(b); }
    for (const x of [-0.6, 0.6]) {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), lamp); h.scale.z = 0.5; h.position.set(x, 0.16, -1.74); body.add(h);
      const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), tail); t.rotation.z = Math.PI / 2; t.position.set(x, 0.18, 1.76); body.add(t);
    }
    // the boost flame behind
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0x6ad7ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    flame.position.set(0, 0.1, 2.1); flame.visible = false; body.add(flame);
    g.add(body);
    // wheels: a chunky tyre round a rim; the front pair steers
    const wheels = [], tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.42, 8), rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.44, 6);
    const rubber = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.9, flatShading: true });
    for (const [x, y, z] of WHEELS) {
      const hub = new THREE.Group(), spin = new THREE.Group(), t = new THREE.Mesh(tireGeo, rubber), r = new THREE.Mesh(rimGeo, chrome);
      t.rotation.z = Math.PI / 2; r.rotation.z = Math.PI / 2; spin.add(t, r); hub.add(spin);
      hub.position.set(x, y, z); hub.userData = { y, spin }; g.add(hub); wheels.push(hub);
    }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.userData = { wheels, body, flame };
    return g;
  }

  // ---------------------------------------------------------------- things to pick up, checkpoints, the flag
  const starShape = (() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.26 : 0.6; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); } return s; })();
  const gold = () => new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.9, roughness: 0.22, emissive: 0x5a3c00, emissiveIntensity: 0.6 });
  function makeItem(it) {
    let m;
    if (it.kind === 'coin') {
      m = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 24), gold()); c.rotation.x = Math.PI / 2; m.add(c);
    } else {
      // a boost can: blue, glowing, with a lightning bolt
      m = new THREE.Group();
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1, 12), new THREE.MeshStandardMaterial({ color: 0x1e88e5, emissive: 0x0b4fa0, emissiveIntensity: 0.7, roughness: 0.35, flatShading: true }));
      const bolt = new THREE.Sprite(new THREE.SpriteMaterial({ map: boltTex, depthWrite: false })); bolt.scale.set(0.9, 0.9, 1);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0x7fd4ff, transparent: true, opacity: 0.6, depthWrite: false })); glow.scale.set(2.6, 2.6, 1);
      m.add(can, bolt, glow);
    }
    m.position.set(it.x, it.y, it.z); scene.add(m);
    return m;
  }
  // the camp: tents round a flag; a village: huts and a sign with its name
  const wood = () => new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 1, flatShading: true });
  function camp() {
    const g = new THREE.Group(), cloth = [0xe76f51, 0x2a9d8f, 0xe9c46a, 0x457b9d];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.8, t = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.6, 4), new THREE.MeshStandardMaterial({ color: cloth[k], roughness: 0.9, flatShading: true }));
      t.position.set(Math.cos(a) * 9, 1.3, Math.sin(a) * 9); t.rotation.y = a; g.add(t);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 6), new THREE.MeshStandardMaterial({ color: 0xeeeeee })); pole.position.y = 3; g.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshStandardMaterial({ color: 0x2a9d8f, side: THREE.DoubleSide })); flag.position.set(0.9, 5.3, 0); g.add(flag);
    crateStack = new THREE.Group();
    for (let k = 0; k < 3; k++) { const c = crate(); c.position.set(lv.crates.x - lv.camp.x - 0.5 + (k % 2) * 1.1, 0.5 + (k > 1 ? 1 : 0), lv.crates.z - lv.camp.z); crateStack.add(c); }
    g.add(crateStack);
    g.position.set(lv.camp.x, lv.height(lv.camp.x, lv.camp.z), lv.camp.z); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
  }
  function crate() {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xc8924f, roughness: 1, flatShading: true }));
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.16, 1.04), new THREE.MeshStandardMaterial({ color: 0x6d4a30, roughness: 1 })); c.add(band);
    return c;
  }
  function village(v) {
    const g = new THREE.Group(), roof = new THREE.MeshStandardMaterial({ color: lv.theme === 'snow' ? 0x9c4a3a : 0xc9a24e, roughness: 1, flatShading: true });
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.3, hut = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.9, 2.2, 7), new THREE.MeshStandardMaterial({ color: 0xe8d8b8, roughness: 1, flatShading: true }));
      const top = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.8, 7), roof); wall.position.y = 1.1; top.position.y = 3.1; hut.add(wall, top);
      hut.position.set(Math.cos(a) * 9, 0, Math.sin(a) * 9); g.add(hut);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: canvasTexture((x) => { x.fillStyle = '#6d4a30'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#fff'; x.font = '900 30px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(v.name, 128, 34); }, 256, 64), side: THREE.DoubleSide }));
    sign.position.set(0, 3.2, 0); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.7, 5), wood()); post.position.y = 1.35; g.add(sign, post);
    g.position.set(v.x, lv.height(v.x, v.z), v.z); g.rotation.y = -v.h; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
  }
  // a treasure chest (the lid opens) and a beacon (a stone tower with a lamp that lights)
  function chest(m) {
    const g = new THREE.Group(), box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.1), wood()), trim = new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.8, roughness: 0.3 });
    box.position.y = 0.45; g.add(box);
    const lid = new THREE.Group(), top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 8, 1, false, 0, Math.PI), wood());
    top.rotation.z = Math.PI / 2; lid.add(top); const band = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 1.16), trim); band.position.y = 0.2; lid.add(band);
    lid.position.set(0, 0.9, 0.55); top.position.z = -0.55; band.position.z = -0.55; g.add(lid);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xffd23f, transparent: true, opacity: 0.6, depthWrite: false })); glow.scale.set(5, 5, 1); glow.position.y = 1; g.add(glow);
    g.position.set(m.x, lv.height(m.x, m.z), m.z); g.rotation.y = -m.h; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
    return { kind: 'chest', g, lid, glow };
  }
  function beacon(m) {
    const g = new THREE.Group(), stone = new THREE.MeshStandardMaterial({ color: theme.rock, roughness: 1, flatShading: true });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 5, 6), stone); tower.position.y = 2.5; g.add(tower);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.8, 0.6, 8), stone); bowl.position.y = 5.3; g.add(bowl);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffc83d, emissiveIntensity: 0, roughness: 0.4 })); bulb.position.y = 6.2; g.add(bulb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xffd86b, transparent: true, opacity: 0, depthWrite: false, fog: false })); halo.scale.set(16, 16, 1); halo.position.y = 6.2; g.add(halo);
    g.position.set(m.x + Math.cos(m.h) * 5, lv.height(m.x + Math.cos(m.h) * 5, m.z + Math.sin(m.h) * 5), m.z + Math.sin(m.h) * 5); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
    return { kind: 'beacon', g, bulb, halo };
  }
  // kicker ramps: wooden boards on the land's own ramp; arches: two rock pillars and a span
  function playthings() {
    for (const a of lv.ramps) {
      const len = 8.2, rise = 2.4, board = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, len), new THREE.MeshStandardMaterial({ color: 0xb07a45, roughness: 1, flatShading: true }));
      const x = a.x - Math.sin(a.h) * 4, z = a.z + Math.cos(a.h) * 4;
      board.position.set(x, lv.height(x, z) + 0.15, z); board.rotation.order = 'YXZ'; board.rotation.set(Math.atan2(rise, len) , -a.h, 0);
      board.receiveShadow = true; scene.add(board);
    }
    const rock = new THREE.MeshStandardMaterial({ color: theme.rock, roughness: 1, flatShading: true });
    for (const a of lv.arches) {
      const g = new THREE.Group();
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, 9, 6), rock); p.position.set(s * 5, 4.5, 0); g.add(p); }
      const span = new THREE.Mesh(new THREE.TorusGeometry(5, 1.4, 5, 10, Math.PI), rock); span.position.y = 8; g.add(span);
      g.position.set(a.x, lv.height(a.x, a.z) - 0.5, a.z); g.rotation.y = -a.h; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
    }
  }

  // ---------------------------------------------------------------- building a world
  function setLevel(level, model) {
    if (scene) scene.traverse((o) => { o.geometry?.dispose(); for (const m of [].concat(o.material ?? [])) { if (m.map && m.map !== dotTex && m.map !== boltTex) m.map.dispose(); m.dispose(); } });
    lv = level; theme = THEMES[level.theme];
    sunDir = new THREE.Vector3(...theme.sunDir).normalize();
    // the light comes from high above, so the car's shadow falls right under it (the sky's sun glow stays where it is)
    light = new THREE.Vector3(sunDir.x * 0.3, 1, sunDir.z * 0.3).normalize();
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(theme.fog, 0.0028);
    const skyScene = new THREE.Scene(); skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 16, 8), new THREE.MeshBasicMaterial({ color: theme.sky[0], side: THREE.BackSide })));
    envRT?.dispose(); envRT = pmrem.fromScene(skyScene, 0.02); scene.environment = envRT.texture;
    scene.add(new THREE.HemisphereLight(0xffffff, theme.grass2, 0.75));
    sun = new THREE.DirectionalLight(0xfff0d8, theme.sun);
    sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 160 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    backdrop(); terrain(); track(); tunnels(); water(); things(); playthings(); camp();
    Object.values(lv.villages).forEach(village);
    marks = {};
    for (const m of lv.missions) if (m.kind !== 'deliver') marks[m.id] = m.kind === 'chest' ? chest(m) : beacon(m);
    // a column of light over each mission (and the camp, while it has crates), seen from far away through the haze
    columns = {};
    const column = (x, z, color) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 70, 10, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      c.position.set(x, lv.height(x, z) + 35, z); scene.add(c); return c;
    };
    for (const m of lv.missions) columns[m.id] = column(m.x, m.z, m.kind === 'chest' ? 0xffc83d : m.kind === 'beacon' ? 0xfff6c8 : 0xff8c42);
    columns.camp = column(lv.camp.x, lv.camp.z, 0x2ad1c0);
    itemMeshes = lv.items.map(makeItem);
    car = makeCar(model); scene.add(car);
    const load = crate(); load.position.set(0, 1.25, 0.9); load.scale.setScalar(0.9); load.visible = false; car.add(load); car.userData.load = load;
    // a soft dark patch on the ground right under the car: what makes it sit on the ground rather than hover
    shade = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 4.1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: dotTex, color: 0x000000, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: false }));
    scene.add(shade);
    if (theme.snowing) {
      const p = []; for (let i = 0; i < 900; i++) p.push((hash(i) - 0.5) * 60, hash(i * 3) * 30, (hash(i * 7) - 0.5) * 60);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, map: dotTex, transparent: true, depthWrite: false })); scene.add(snow);
    } else snow = null;
    dust = []; camPos = null; look = null;
  }

  function puff(x, y, z, color, up = 1, size = 0.9, life = 0.9) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color, transparent: true, opacity: 0.55, depthWrite: false }));
    s.position.set(x, y, z); s.scale.setScalar(size);
    s.userData = { life, size, v: new THREE.Vector3((Math.random() - 0.5) * 1.6, up * (0.5 + Math.random() * 0.9), (Math.random() - 0.5) * 1.6) };
    scene.add(s); dust.push(s);
  }
  function burst(p, color, n = 12) { for (let i = 0; i < n; i++) puff(p[0], p[1], p[2], color, 3, 0.5); }

  // ---------------------------------------------------------------- one frame
  // view: { s: the car (p, q, steer, spin, comp, boostT, splash, contact), at (track index), speed, taken (Set of item
  //   indexes), dt, title, flipT, hidden }
  const fwd = new THREE.Vector3(), want = new THREE.Vector3(), target = new THREE.Vector3(), upY = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3();
  function render(view) {
    const { s, dt } = view, t = performance.now() / 1000;
    car.position.set(s.p[0], s.p[1], s.p[2]); car.quaternion.set(s.q[0], s.q[1], s.q[2], s.q[3]);
    if (view.flipT) car.rotateZ(Math.sin(view.flipT * 20) * 0.25);
    car.visible = !view.hidden;
    car.userData.wheels.forEach((w, i) => {
      w.position.y = w.userData.y - (0.45 - (s.comp?.[i] ?? 0.1)); // the spring: a wheel hangs lower in the air
      w.rotation.y = i < 2 ? -s.steer : 0; w.userData.spin.rotation.x = -s.spin;
    });
    const fl = car.userData.flame; fl.visible = s.boostT > 0; fl.scale.setScalar(1.2 + Math.random() * 0.6);
    // the shadow on the ground under the car, fading as the car rises
    const gy = lv.height(s.p[0], s.p[2]), lift = s.p[1] - gy - 1.15, n = lv.normal(s.p[0], s.p[2]);
    fwd.set(0, 0, -1).applyQuaternion(car.quaternion);
    shade.position.set(s.p[0], gy + 0.06, s.p[2]);
    shade.quaternion.setFromUnitVectors(upY, nrm.set(n[0], n[1], n[2])); shade.rotateY(Math.atan2(-fwd.x, -fwd.z));
    shade.material.opacity = car.visible && lift > -0.6 ? 0.7 * Math.min(1, Math.max(0, 1 - lift / 2.5)) : 0;
    // the missions: an opened chest's lid stands up, a lit beacon glows; the crate rides on the car
    for (const [id, m] of Object.entries(marks)) {
      const done = view.done?.has(id);
      if (m.kind === 'chest') { m.lid.rotation.x += ((done ? -1.9 : 0) - m.lid.rotation.x) * Math.min(1, dt * 4); m.glow.material.opacity = done ? 0 : 0.35 + Math.sin(t * 3) * 0.2; }
      else { m.bulb.material.emissiveIntensity = done ? 2.5 : 0; m.halo.material.opacity = done ? 0.75 + Math.sin(t * 2) * 0.1 : 0; }
    }
    car.userData.load.visible = !!view.carrying;
    for (const m of lv.missions) columns[m.id].visible = !view.done?.has(m.id) && (m.kind !== 'deliver' || view.carrying === m.id);
    columns.camp.visible = !!view.cratesLeft;
    for (const c of Object.values(columns)) c.material.opacity = 0.26 + Math.sin(t * 2.5) * 0.08;
    if (crateStack) crateStack.visible = !!view.cratesLeft;
    // the things to pick up turn and bob
    itemMeshes.forEach((m, i) => {
      m.visible = !view.taken.has(i);
      if (m.visible) { const it = lv.items[i]; m.rotation.y = t * 2 + i; m.position.y = it.y + Math.sin(t * 3 + i) * 0.12; }
    });
    // dust behind the wheels, spray in water, the boost's trail
    if (s.contact && view.speed > 3 && dust.length < 70 && Math.random() < 0.5) {
      const b = new THREE.Vector3(0, -0.7, 1.6).applyQuaternion(car.quaternion).add(car.position), surf = lv.surface(b.x, b.z);
      puff(b.x + (Math.random() - 0.5) * 1.6, b.y, b.z, surf.grip < 0.4 ? 0xffffff : surf.drag ? 0x6b4a2f : theme.snow ? 0xffffff : 0xd9b98a);
    }
    if (s.splash > 0.3 && dust.length < 90) for (let k = 0; k < 2; k++) puff(s.p[0] + (Math.random() - 0.5) * 2.4, s.p[1] - 0.6, s.p[2] + (Math.random() - 0.5) * 2.4, 0xd8f0ff, 3.5, 0.7, 0.6);
    if (s.boostT > 0 && dust.length < 90) { const b = new THREE.Vector3(0, 0.1, 2.2).applyQuaternion(car.quaternion).add(car.position); puff(b.x, b.y, b.z, 0x9fe3ff, 0.3, 0.6, 0.4); }
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i]; d.userData.life -= dt;
      if (d.userData.life <= 0) { scene.remove(d); d.material.dispose(); dust.splice(i, 1); continue; }
      d.position.addScaledVector(d.userData.v, dt); d.scale.setScalar(d.userData.size * (1 + (0.9 - d.userData.life) * 2.2)); d.material.opacity = d.userData.life * 0.6;
    }
    // the camera: behind the car, turning with it (eased), never under the ground; in a tunnel, lower and closer
    const at = view.at ?? 0, inTunnel = !!tunnelAt(at) && lv.D[Math.round(Math.max(0, Math.min(lv.size, s.p[2]))) * lv.N + Math.round(Math.max(0, Math.min(lv.size, s.p[0])))] < lv.half + 2;
    let dy = Math.atan2(-fwd.x, -fwd.z) - camYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (view.title) camYaw += dt * 0.15; else camYaw += dy * (1 - Math.exp(-dt * 3));
    const back = inTunnel ? 6.5 : camera.aspect < 1 ? 10 : 8.5, high = inTunnel ? 2.6 : camera.aspect < 1 ? 4.2 : 3.4;
    want.set(s.p[0] + Math.sin(camYaw) * back, s.p[1] + high, s.p[2] + Math.cos(camYaw) * back);
    const floor = lv.height(want.x, want.z) + 1.4;
    if (want.y < floor) want.y = floor;
    if (inTunnel) want.y = Math.min(want.y, lv.track[at].y + 5);
    target.set(s.p[0] - Math.sin(camYaw) * 5, s.p[1] + 0.9, s.p[2] - Math.cos(camYaw) * 5);
    camPos = camPos ? camPos.lerp(want, 1 - Math.exp(-dt * 5)) : want.clone();
    look = look ? look.lerp(target, 1 - Math.exp(-dt * 8)) : target.clone();
    camera.position.copy(camPos); camera.lookAt(look);
    // the light's shadow box follows the car; the sky follows the camera
    sun.position.copy(car.position).addScaledVector(light, 80); sun.target.position.copy(car.position);
    scene.traverse((o) => { if (o.userData.follow) o.position.copy(camera.position); });
    if (snow) { snow.position.copy(car.position); const p = snow.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * 3; if (y < -2) y += 30; p.setY(i, y); } p.needsUpdate = true; }
    renderer.render(scene, camera);
  }

  // a point on the screen (for the floating "+1" text)
  function project(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(camera);
    return { x: (v.x * 0.5 + 0.5) * canvas.clientWidth, y: (-v.y * 0.5 + 0.5) * canvas.clientHeight, front: v.z < 1 };
  }

  return { setLevel, render, burst, project, resize, get yaw() { return camYaw; }, get scene() { return scene; }, renderer };
}
