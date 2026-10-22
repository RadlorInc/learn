// Whiteboard library — history: early life, ancient wonders, inventions, industry, civics, maps and geography.
// Catalogue: history.txt. Halal and child-safe: no weapons or war, no real flags, people, brands or religious buildings.
(() => {
  // local helpers (wrapped so nothing leaks into other category files)
  const F = (g, d, f, ex = {}) => mk('path', { d, fill: f, filter: 'url(#wc)', class: 'fillable', ...ex }, g);
  const P = (g, d, f, ink = '#3a3430', w = 3) => { F(g, d, f); return line(g, d, ink, w); };
  const dot = (g, x, y, c = '#2a2420', w = 7) => line(g, `M${x} ${y} l.01 0`, c, w);
  const E = (x, y, rx, ry = rx) => `M${x - rx} ${y} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
  const RR = (x, y, w, h, r = 0) => `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  const smooth = (p, closed = true) => {
    const n = p.length, at = i => p[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const [a, b, c, e] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
      d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0]} ${c[1]}`;
    }
    return closed ? d + ' Z' : d;
  };
  const fluff = (cx, cy, rx, ry, n = 12, b = 1.25) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI, am = (a0 + a1) / 2;
      if (!i) d = `M${(cx + rx * Math.cos(a0)).toFixed(1)} ${(cy + ry * Math.sin(a0)).toFixed(1)}`;
      d += ` Q${(cx + rx * b * Math.cos(am)).toFixed(1)} ${(cy + ry * b * Math.sin(am)).toFixed(1)} ${(cx + rx * Math.cos(a1)).toFixed(1)} ${(cy + ry * Math.sin(a1)).toFixed(1)}`;
    }
    return d + ' Z';
  };
  const arrow = (g, x1, y1, x2, y2, c, w = 3) => { line(g, `M${x1} ${y1} L${x2} ${y2}`, c, w); line(g, head(x2, y2, x1, y1, 12), c, w, { class: 'ink head' }); };
  // curved arrow through control point (qx,qy)
  const carrow = (g, x1, y1, qx, qy, x2, y2, c, w = 3.4, ex = {}) => { line(g, `M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`, c, w, ex); line(g, head(x2, y2, qx, qy, 13), c, w, { class: 'ink head' }); };
  const pick = (K, k, d, what) => { const f = K[k || d]; if (!f) throw new Error(`Unknown ${what} "${k}" (use ${Object.keys(K).join('|')})`); return f; };
  const showLab = o => o.lab !== '0' && o.labels !== '0';
  const list = (t, def) => (t || def).split(',').map(s => s.trim()).filter(Boolean);
  const pt = (r, a) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)];
  // a drawing in its own unit box: base = default size; flip=1 mirrors; draw may return a caption y
  const make = (base, draw) => ([cx, cy, size = base], o, t, parent) => {
    const outer = mk('g', {}, parent), s = size / base;
    const g = mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${o.flip ? -s : s} ${s})` }, outer);
    const by = draw(g, o, t, outer);
    if (t && typeof by === 'number') label(outer, cx, cy + by * s, t, TXT[o.c] || TXT.blue, 26, 'middle');
    return outer;
  };
  const SKIN = ['#f6d2b0', '#e2aa7c', '#b9774a', '#7a4a2a'], SHIRT = ['#7fb7ea', '#f4a531', '#5fae3a', '#e07a5f', '#b39ddb', '#ffd84a'];
  // faceless simple figure, feet at (x, y), height h; arm=1 raises the right arm (holding a sign)
  const fig = (g, x, y, h, shirt, skin = SKIN[1], arm = 0) => {
    const s = h / 100;
    line(g, `M${x - 5 * s} ${y - 34 * s} L${x - 9 * s} ${y} M${x + 5 * s} ${y - 34 * s} L${x + 9 * s} ${y}`, '#3d4452', 8 * s);
    line(g, arm ? `M${x - 12 * s} ${y - 62 * s} L${x - 18 * s} ${y - 36 * s} M${x + 12 * s} ${y - 62 * s} L${x + 18 * s} ${y - 92 * s}`
      : `M${x - 12 * s} ${y - 62 * s} L${x - 18 * s} ${y - 36 * s} M${x + 12 * s} ${y - 62 * s} L${x + 18 * s} ${y - 36 * s}`, skin, 7 * s);
    P(g, RR(x - 14 * s, y - 72 * s, 28 * s, 42 * s, 10 * s), shirt, '#3a3430', 2.2);
    P(g, E(x, y - 84 * s, 11 * s), skin, '#5a3a22', 2.2);
  };
  const puff = (g, pts, c = '#e3e6ea', ink = '#8a9099') => pts.forEach(([x, y, r]) => P(g, fluff(x, y, r, r * .8, 7, 1.22), c, ink, 2));
  const flame = (g, x, y, s = 1) => {
    P(g, `M${x - 26 * s} ${y} Q${x - 34 * s} ${y - 30 * s} ${x - 12 * s} ${y - 52 * s} Q${x - 10 * s} ${y - 30 * s} ${x} ${y - 70 * s} Q${x + 12 * s} ${y - 36 * s} ${x + 16 * s} ${y - 50 * s} Q${x + 36 * s} ${y - 24 * s} ${x + 26 * s} ${y} Z`, '#f4a531', '#c0392b', 2.4);
    P(g, `M${x - 12 * s} ${y} Q${x - 16 * s} ${y - 18 * s} ${x - 2 * s} ${y - 36 * s} Q${x + 2 * s} ${y - 20 * s} ${x + 10 * s} ${y - 26 * s} Q${x + 18 * s} ${y - 12 * s} ${x + 12 * s} ${y} Z`, '#ffd84a', '#e08a10', 1.8);
  };
  const ground = (g, x1, x2, y, c = '#5a7a3a') => line(g, `M${x1} ${y} H${x2}`, c, 3);
  const caravel = (g, x, y, s = 1) => {
    const h = mk('g', { transform: `translate(${x} ${y}) scale(${s})` }, g);
    line(h, 'M-8 0 V-46 M14 0 V-36', '#4a2c12', 3);
    P(h, 'M-8 -44 Q12 -30 -6 -6 L-30 -8 Z', '#fbf5e6', '#8a7660', 2);
    P(h, 'M14 -34 Q30 -22 16 -6 L-2 -8 Z', '#fbf5e6', '#8a7660', 2);
    P(h, 'M-36 -4 L36 -4 L26 10 L-28 10 Z', '#9a6b40', '#4a2c12', 2.4);
  };
  const AGED = '#f3e6c4', AGEDK = '#9a7a46';

  const TABLET = {
    clay: g => {
      P(g, 'M-96 -110 Q-104 -110 -104 -100 L-108 100 Q-108 112 -96 112 L96 116 Q108 116 108 104 L102 -102 Q102 -114 90 -114 Z', '#d8a878', '#7a4a24');
      for (let r = 0; r < 7; r++) {
        const y = -86 + r * 28; line(g, `M-90 ${y + 12} H88`, '#b98a5a', 1.4);
        for (let i = 0; i < 6; i++) { const x = -78 + i * 28 + (r % 2) * 8, k = (r * 3 + i) % 3;
          line(g, k === 0 ? `M${x} ${y - 6} L${x + 8} ${y} L${x} ${y + 6}` : k === 1 ? `M${x - 4} ${y - 6} L${x + 4} ${y - 6} L${x} ${y + 6} Z` : `M${x} ${y - 6} V${y + 6} M${x + 8} ${y - 6} V${y + 6}`, '#6b3f1a', 2.4); }
      }
      line(g, 'M118 -40 L150 110', '#c9a46a', 8); line(g, 'M118 -40 L122 -24', '#7a4a24', 4);
    },
    papyrus: g => {
      P(g, 'M-120 -96 Q-60 -104 0 -96 T120 -96 L124 96 Q60 104 0 96 T-116 96 Z', '#f3dd9a', '#a07a2a');
      for (let x = -100; x <= 100; x += 20) line(g, `M${x} -92 V92`, '#e3c77a', 1);
      for (let y = -80; y <= 80; y += 20) line(g, `M-112 ${y} H116`, '#e3c77a', 1);
      const ink = '#4a3a24', glyph = [
        (x, y) => `M${x - 10} ${y} q5 -6 10 0 t10 0`,
        (x, y) => `M${x - 10} ${y + 8} Q${x - 4} ${y - 10} ${x + 8} ${y - 6} L${x + 12} ${y - 10} M${x - 2} ${y + 2} L${x - 2} ${y + 10}`,
        (x, y) => `M${x - 8} ${y - 8} H${x + 8} V${y + 8} H${x - 8} Z`,
        (x, y) => `M${x} ${y + 10} V${y - 10} Q${x + 10} ${y - 8} ${x + 6} ${y}`,
        (x, y) => `M${x - 10} ${y - 6} L${x - 4} ${y + 6} L${x + 2} ${y - 6} L${x + 8} ${y + 6}`,
        (x, y) => E(x, y, 6)];
      for (let c = 0; c < 5; c++) for (let r = 0; r < 5; r++) line(g, glyph[(c * 2 + r) % 6](-80 + c * 40, -60 + r * 30), ink, 2.4);
      for (const x of [-60, -20, 20, 60]) line(g, `M${x} -78 V78`, '#c9a85a', 1.4);
    },
  };

  const NAV = {
    compass: g => {
      P(g, RR(-120, -120, 240, 240, 16), '#b07a44', '#5a3a1a');
      P(g, E(0, 0, 100), '#e8c46a', '#8a6414'); P(g, E(0, 0, 84), '#fbf5e6', '#8a6414', 2.4);
      for (let a = 0; a < 360; a += 15) { const [x1, y1] = pt(84, a), [x2, y2] = pt(a % 90 ? 76 : 68, a); line(g, `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`, '#8a6414', a % 90 ? 1.4 : 2.4); }
      P(g, 'M0 -62 L12 0 L0 62 L-12 0 Z', '#ffffff', '#3a3430', 2);
      P(g, 'M0 -62 L12 0 L-12 0 Z', '#e04b3a', '#8a1f1a', 2.4); P(g, 'M0 62 L12 0 L-12 0 Z', '#7fb7ea', '#1f4f8f', 2.4);
      P(g, E(0, 0, 7), '#c9a46a', '#5a3a1a', 2);
      for (const [x, y, s] of [[0, -46, 'N'], [50, 8, 'E'], [0, 58, 'S'], [-50, 8, 'W']]) label(g, x, y, s, '#5a3a1a', 22, 'middle');
    },
    astrolabe: g => {
      P(g, 'M-14 -118 Q0 -140 14 -118 L10 -100 H-10 Z', '#d9a55e', '#7a5326', 2.4); P(g, E(0, -128, 10), 'none', '#7a5326', 3);
      P(g, E(0, 0, 104), '#e0b45a', '#7a5326'); P(g, E(0, 0, 86), '#f3d08a', '#7a5326', 2.4);
      for (let a = 0; a < 360; a += 10) { const [x1, y1] = pt(104, a), [x2, y2] = pt(a % 30 ? 97 : 90, a); line(g, `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`, '#7a5326', a % 30 ? 1.2 : 2.2); }
      line(g, 'M-86 0 H86 M0 -86 V86', '#a07a2a', 1.6);
      for (const r of [30, 54]) line(g, E(0, 18 - r * .3, r, r * .8), '#a07a2a', 1.6);
      line(g, 'M-70 -30 Q0 -80 70 -30 M-60 40 Q0 70 60 40', '#7a5326', 2.4);
      for (const [x, y] of [[-42, -52], [50, -38], [36, 30], [-30, 44], [8, -70]]) P(g, 'M' + [0, 1, 2].map(i => { const [a, b] = pt(7, -90 + i * 120); return `${(x + a).toFixed(1)} ${(y + b).toFixed(1)}`; }).join(' L') + ' Z', '#c97a10', '#7a5326', 1.6);
      P(g, 'M-110 8 L110 -8 L110 2 L-110 18 Z', '#c9965a', '#5a3a1a', 2.4);
      P(g, E(0, 5, 10), '#b07a44', '#5a3a1a', 2.4);
    },
  };

  const WHEEL = {
    solid: g => {
      P(g, E(0, 0, 100), '#c9965a', '#5a3a1a');
      line(g, 'M-34 -94 V94 M34 -94 V94', '#5a3a1a', 3);
      P(g, RR(-92, -12, 184, 24, 4), '#a8743e', '#5a3a1a', 2.4);
      for (const [x, y] of [[-64, -40], [62, 46], [-10, 70], [8, -66]]) line(g, `M${x} ${y} q8 -6 16 0`, '#8a5a2b', 1.6);
      P(g, E(0, 0, 18), '#7a5326', '#3a2410', 2.6); P(g, E(0, 0, 7), '#3a2410', '#3a2410', 2);
    },
    spoked: g => {
      P(g, E(0, 0, 100), '#c9965a', '#5a3a1a'); P(g, E(0, 0, 82), '#fdfdfb', '#5a3a1a', 2.6);
      for (let a = 0; a < 360; a += 45) { const [x, y] = pt(84, a); line(g, `M0 0 L${x.toFixed(1)} ${y.toFixed(1)}`, '#8a5a2b', 8); }
      P(g, E(0, 0, 20), '#a8743e', '#3a2410', 2.6); P(g, E(0, 0, 7), '#3a2410', '#3a2410', 2);
    },
  };

  const PHONE = {
    candlestick: g => {
      P(g, 'M-60 120 Q-60 96 0 92 Q60 96 60 120 Z', '#2f3338', '#111');
      P(g, RR(-10, -60, 20, 156, 6), '#3a3f45', '#111');
      P(g, 'M-30 -96 L30 -96 L14 -60 L-14 -60 Z', '#2f3338', '#111'); P(g, E(0, -96, 30, 10), '#5a6068', '#111', 2.4);
      line(g, 'M10 -30 H52 V-50', '#8a8f96', 4);
      P(g, RR(40, -40, 22, 60, 8), '#2f3338', '#111'); P(g, E(51, 22, 18, 8), '#3a3f45', '#111', 2.4);
      line(g, 'M51 30 Q60 80 90 90 Q120 100 110 120', '#2f3338', 3);
    },
    rotary: g => {
      P(g, 'M-110 90 L-90 -20 Q-80 -40 -50 -40 L50 -40 Q80 -40 90 -20 L110 90 Z', '#2f3338', '#111');
      P(g, 'M-120 -54 Q-120 -96 -84 -96 L84 -96 Q120 -96 120 -54 L96 -46 Q90 -70 70 -70 L-70 -70 Q-90 -70 -96 -46 Z', '#3a3f45', '#111');
      P(g, E(0, 26, 52), '#e3e6ea', '#111', 2.4);
      for (let i = 0; i < 10; i++) { const [x, y] = pt(36, -60 + i * 28); P(g, E(x, 26 + y, 7.5), '#ffffff', '#3a3430', 1.6); }
      P(g, E(0, 26, 16), '#fdfdfb', '#3a3430', 2);
      line(g, 'M42 4 L58 -6', '#8a8f96', 3);
    },
  };

  const CASE = {
    vase: g => {
      P(g, 'M-20 -84 L20 -84 L16 -70 Q50 -52 44 -10 Q38 26 18 34 L-18 34 Q-38 26 -44 -10 Q-50 -52 -16 -70 Z', '#d9894a', '#6b3a1a');
      line(g, 'M-42 -30 H42 M-38 2 H38', '#2a2420', 3); line(g, 'M-40 -16 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8', '#2a2420', 2);
    },
    crown: g => {
      P(g, 'M-50 30 L-56 -40 L-28 -12 L0 -50 L28 -12 L56 -40 L50 30 Z', '#f3c33b', '#8a6414');
      P(g, RR(-52, 14, 104, 16, 3), '#e0a100', '#8a6414', 2.4);
      for (const [x, c] of [[-28, '#e04b3a'], [0, '#2b6cc4'], [28, '#5fae3a']]) P(g, E(x, 22, 5), c, '#3a3430', 1.6);
      for (const [x, y] of [[-56, -40], [0, -50], [56, -40]]) P(g, E(x, y - 4, 6), '#fdfdfb', '#8a6414', 1.6);
    },
    tablet: g => {
      P(g, 'M-40 -80 Q-46 -80 -46 -72 L-46 30 L46 30 L46 -72 Q46 -80 40 -80 Z', '#d8a878', '#7a4a24');
      for (let y = -64; y < 24; y += 16) line(g, `M-34 ${y} l6 4 l-6 4 M-20 ${y} v8 M-10 ${y} l6 4 l-6 4 M4 ${y} h8 M20 ${y} l6 4 l-6 4`, '#6b3f1a', 2);
    },
  };

  Object.assign(window.RECIPES, {
    // "cavefire cx cy size" — stone-age cave with a campfire and wall painting
    cavefire: make(320, g => {
      P(g, 'M-160 100 L-158 -10 Q-150 -112 -40 -124 Q70 -134 134 -76 Q166 -40 162 100 Z', '#b3a594', '#5a4e42');
      P(g, 'M-112 100 L-110 4 Q-100 -72 -10 -78 Q84 -82 108 -4 L112 100 Z', '#5a4e44', '#2a221c');
      for (const [x, y] of [[-140, -60], [120, -40], [-20, -108], [70, -96]]) line(g, `M${x} ${y} q12 -6 24 2`, '#7a6c5c', 2);
      line(g, 'M-84 -26 q16 -16 44 -10 q14 4 18 14 q-16 10 -50 6 q-12 -2 -12 -10 M-78 -18 v20 M-62 -14 v18 M-38 -14 v16 M-28 -14 v16 M-24 -32 l10 -8 l2 10', '#e8a04a', 2.6);
      P(g, E(64, -34, 9, 11), '#e8a04a', '#c97a10', 1.6);
      line(g, 'M57 -42 l-4 -14 M62 -45 l-1 -16 M67 -45 l2 -15 M72 -40 l5 -12 M55 -30 l-10 -6', '#e8a04a', 4);
      line(g, 'M-40 92 L40 72 M-40 72 L40 92', '#6b4424', 10);
      for (const x of [-52, -32, -12, 12, 32, 52]) P(g, E(x, 96, 11, 7), '#8a8a86', '#4a4a46', 2);
      flame(g, 0, 84, 1.1);
      ground(g, -170, 170, 102, '#6b5a44');
      return 130;
    }),
    // "ploughfield cx cy size" — horse pulling a wooden plough, furrowed field
    ploughfield: make(360, g => {
      P(g, 'M-180 -10 L180 -10 L180 100 L-180 100 Z', '#c9a06a', '#7a5a34', 2.4);
      for (let i = 0; i < 6; i++) { const y = 2 + i * 17; line(g, `M10 ${y} H178`, '#8a6a3e', 2.2); }
      P(g, 'M-180 -10 L0 -10 L0 100 L-180 100 Z', '#a6d468', '#5a8a2a', 2.4);
      for (const x of [-160, -120, -80, -40]) for (const y of [12, 52, 86]) line(g, `M${x} ${y} l-4 -12 M${x} ${y} l0 -14 M${x} ${y} l5 -11`, '#4a7a24', 2);
      RECIPES.animal([-60, -6, 170], { k: 'horse', flip: 1 }, null, g);
      line(g, 'M-6 -16 L60 30', '#5a3a1a', 2.4);
      line(g, 'M50 44 L120 24', '#7a4a24', 7); line(g, 'M110 26 L150 -26 M120 24 L164 -16', '#7a4a24', 6);
      P(g, 'M40 38 L62 36 L52 60 Z', '#9aa3ad', '#4f5966', 2.4);
      line(g, 'M-180 -10 H180', '#5a7a3a', 3);
      return 130;
    }),
    // "oldwheel cx cy size k=solid|spoked" — early wheel: solid plank disc or spoked
    oldwheel: make(240, (g, o) => { pick(WHEEL, o.k, 'solid', 'oldwheel')(g); return 136; }),
    // "citywall cx cy size" — ancient walled city: mud-brick wall, towers, arched gate
    citywall: make(360, g => {
      const ink = '#7a5326', c = '#e3bf86';
      for (const [x, y, w, h] of [[-110, -78, 50, 40], [-50, -96, 60, 58], [30, -84, 46, 46], [86, -70, 40, 32]]) { P(g, RR(x, y, w, h), '#f0d6a6', ink, 2.4); P(g, RR(x + w / 2 - 6, y + 12, 12, 14, 2), '#6b4a24', ink, 1.6); }
      line(g, 'M150 -50 V-100', '#7a5326', 4); for (const a of [-140, -100, -60, -20]) { const [x, y] = pt(26, a); line(g, `M150 -100 q${(x / 2).toFixed(1)} ${(y / 2 - 4).toFixed(1)} ${x.toFixed(1)} ${(y + 8).toFixed(1)}`, '#3a8a2a', 4); }
      const cren = (x, w, y) => { let d = `M${x} ${y}`; for (let i = 0; i < w / 20; i++) d += ` v-12 h10 v12 h10`; return d; };
      P(g, `${cren(-170, 340, -40)} V96 H-170 Z`, c, ink);
      for (const x of [-170, 110]) P(g, `${cren(x, 60, -70)} V96 H${x} Z`, '#d9ab6a', ink);
      for (let y = -24; y < 90; y += 18) for (let x = -160 + ((y / 18) % 2) * 15; x < 160; x += 40) line(g, `M${x} ${y} h18`, '#c99a5a', 1.4);
      P(g, 'M-34 96 V20 Q0 -16 34 20 V96 Z', '#7a4a24', '#4a2c12');
      line(g, 'M-34 20 Q0 -16 34 20', '#4f8fd6', 4); line(g, 'M0 2 V96', '#4a2c12', 2);
      ground(g, -180, 180, 96, '#b8902a');
      return 130;
    }),
    // "ziggurat cx cy size" — stepped mud-brick ziggurat with a front stairway
    ziggurat: make(340, g => {
      const ink = '#7a5326';
      for (const [w, y, h, c] of [[320, 40, 56, '#e3bf86'], [230, -10, 50, '#ecc995'], [150, -56, 46, '#f3d6a6']]) {
        P(g, RR(-w / 2, y, w, h), c, ink);
        for (let yy = y + 14; yy < y + h; yy += 14) line(g, `M${-w / 2 + 6} ${yy} H${w / 2 - 6}`, '#c99a5a', 1.4);
      }
      P(g, RR(-36, -92, 72, 36), '#f8e3bc', ink); P(g, RR(-10, -82, 20, 26, 2), '#6b4a24', ink, 2);
      P(g, 'M-26 96 L-14 -56 L14 -56 L26 96 Z', '#d9ab6a', ink, 2.6);
      for (let y = -46; y < 96; y += 10) { const f = (y + 56) / 152; line(g, `M${-14 - 12 * f} ${y} H${14 + 12 * f}`, '#a07a3a', 1.4); }
      P(g, 'M-190 96 Q-100 88 0 96 T190 96 L190 112 L-190 112 Z', '#f6dfa6', '#b8902a', 2.4);
      return 136;
    }),
    // "longwall cx cy size" — long defensive wall with watchtowers winding over hills
    longwall: make(380, g => {
      P(g, smooth([[-190, 30], [-150, -40], [-90, -10], [-30, -70], [40, -20], [110, -80], [190, -10], [190, 100], [-190, 100]]), '#a6d468', '#4a7a24');
      P(g, smooth([[-190, 70], [-120, 40], [-40, 60], [60, 30], [140, 54], [190, 40], [190, 100], [-190, 100]]), '#8cc46a', '#4a7a24', 2.4);
      const y = x => -24 - 34 * Math.sin((x + 190) / 380 * Math.PI * 2.2) + x * .08;
      const xs = []; for (let x = -184; x <= 184; x += 8) xs.push(x);
      P(g, 'M' + xs.map(x => `${x} ${(y(x) - 14).toFixed(1)}`).join(' L') + ' L' + xs.reverse().map(x => `${x} ${(y(x) + 10).toFixed(1)}`).join(' L') + ' Z', '#d9cfbf', '#5a5046', 2.6);
      xs.reverse(); let d = ''; for (let x = -180; x <= 180; x += 16) d += `M${x} ${(y(x) - 14).toFixed(1)} v-8 h8 v8 `;
      line(g, d, '#5a5046', 2);
      for (const x of [-120, 10, 140]) { const yy = y(x); P(g, RR(x - 18, yy - 58, 36, 62, 2), '#e8dfd0', '#5a5046', 2.6); P(g, RR(x - 22, yy - 66, 44, 10, 2), '#c9bfae', '#5a5046', 2.2); P(g, RR(x - 5, yy - 44, 10, 14, 4), '#3a3430', '#3a3430', 1.4); }
      return 120;
    }),
    // "aqueduct cx cy size" — Roman-style aqueduct: two tiers of arches, water channel on top
    aqueduct: make(380, g => {
      const ink = '#7a6a4a', c = '#e8dcc0';
      P(g, 'M-190 100 Q-60 80 0 100 T190 96 L190 112 L-190 112 Z', '#7fb7ea', '#2b6cc4', 2.4);
      P(g, RR(-180, -10, 360, 110), c, ink); P(g, RR(-180, -80, 360, 66), c, ink);
      for (let i = 0; i < 6; i++) { const x = -150 + i * 60; P(g, `M${x - 20} 100 V30 Q${x} 4 ${x + 20} 30 V100 Z`, '#fdfdfb', ink, 2.4); }
      for (let i = 0; i < 9; i++) { const x = -160 + i * 40; P(g, `M${x - 12} -14 V-46 Q${x} -62 ${x + 12} -46 V-14 Z`, '#fdfdfb', ink, 2.2); }
      P(g, RR(-190, -96, 380, 18, 2), '#d9cfb0', ink, 2.6);
      line(g, 'M-186 -88 H186', '#2b6cc4', 5, { 'stroke-dasharray': '18 10' });
      line(g, 'M-180 -10 H180 M-180 -80 H180', ink, 2);
      return 132;
    }),
    // "amphitheatre cx cy size" — oval open-air arena: tiers of seats, sand floor, arched outer wall
    amphitheatre: make(380, g => {
      const ink = '#7a6a4a', c = '#e8dcc0', rx = 170, ry = 54, top = -40, h = 110;
      P(g, `M${-rx} ${top} A${rx} ${ry} 0 0 1 ${rx} ${top} L${rx} ${top + h} A${rx} ${ry} 0 0 1 ${-rx} ${top + h} Z`, c, ink);
      P(g, E(0, top, rx, ry), '#f1e8d2', ink);
      for (const k of [.82, .66]) line(g, E(0, top + 4 * (1 - k) * 10, rx * k, ry * k), '#b8a57a', 2);
      P(g, E(0, top + 10, rx * .46, ry * .42), '#f3d08a', '#a07a2a', 2.4);
      for (const row of [0, 1]) for (let i = -7; i <= 7; i++) {
        const x = i * 21, yb = top + Math.sqrt(1 - (x / rx) ** 2) * ry, y = yb + 18 + row * 44, w = 12 * Math.sqrt(1 - (x / rx) ** 2) + 2;
        P(g, `M${(x - w / 2).toFixed(1)} ${(y + 30).toFixed(1)} V${(y + 10).toFixed(1)} Q${x.toFixed(1)} ${(y).toFixed(1)} ${(x + w / 2).toFixed(1)} ${(y + 10).toFixed(1)} V${(y + 30).toFixed(1)} Z`, '#6b5a44', ink, 1.6);
      }
      ground(g, -190, 190, top + h + ry + 2, '#b8902a');
      return 150;
    }),
    // "tablets cx cy size k=clay|papyrus" — ancient writing: clay tablet with wedge marks or papyrus sheet
    tablets: make(260, (g, o) => { pick(TABLET, o.k, 'clay', 'tablets')(g); return 150; }),
    // "printpress cx cy size" — wooden screw printing press with printed pages
    printpress: make(320, g => {
      const ink = '#5a3a1a', w = '#b07a44';
      P(g, RR(-110, -130, 22, 236, 3), w, ink); P(g, RR(88, -130, 22, 236, 3), w, ink);
      P(g, RR(-124, -140, 248, 26, 4), '#9a6b40', ink); P(g, RR(-124, 28, 248, 22, 3), '#9a6b40', ink);
      P(g, RR(-14, -114, 28, 70, 3), '#9aa3ad', '#4f5966', 2.4); for (let y = -108; y < -48; y += 10) line(g, `M-14 ${y} L14 ${y + 6}`, '#4f5966', 1.8);
      line(g, 'M0 -82 L-90 -66', ink, 6); P(g, E(-92, -66, 8), '#7a4a24', ink, 2);
      P(g, RR(-70, -44, 140, 22, 3), '#c9965a', ink, 2.6);
      P(g, RR(-80, 4, 160, 24, 2), '#7a8594', '#3a3f45', 2.4);
      P(g, RR(-64, -10, 128, 14, 1), '#fffdf6', '#8a7660', 2);
      for (const [x, y] of [[-150, 60], [-144, 70], [-138, 80]]) P(g, RR(x - 40, y - 16, 70, 50, 2), '#fffdf6', '#8a7660', 2);
      for (let y = 74; y < 120; y += 9) line(g, `M-172 ${y} H-116`, '#3a3430', 2.2);
      for (const x of [130, 158]) { line(g, `M${x} 70 V40`, ink, 4); P(g, fluff(x, 80, 13, 12, 7, 1.2), '#3a3430', '#111', 2); }
      ground(g, -180, 180, 106, '#5a3a1a');
      return 136;
    }),
    // "navtool cx cy size k=compass|astrolabe" — ship's magnetic compass in a box or brass astrolabe
    navtool: make(260, (g, o) => { pick(NAV, o.k, 'compass', 'navtool')(g); return 152; }),
    // "voyage cx cy size | From, To" — old sea chart: dashed sailing route, small ship, labelled ports
    voyage: make(420, (g, o, t) => {
      const [A, B] = list(t, 'Home port, New land');
      P(g, 'M-200 -110 L200 -110 Q192 0 200 110 L-200 110 Q-192 0 -200 -110 Z', '#d6ebf5', AGEDK);
      P(g, smooth([[-200, -110], [-130, -110], [-120, -60], [-150, -20], [-128, 30], [-160, 80], [-200, 110]]), '#e8d6a0', '#8a6a3e', 2.6);
      P(g, smooth([[200, -110], [140, -96], [120, -40], [150, 0], [110, 50], [140, 110], [200, 110]]), '#e8d6a0', '#8a6a3e', 2.6);
      line(g, 'M-132 30 C-60 90 -20 -90 60 -40 S110 10 124 0', '#c0392b', 3.4, { 'stroke-dasharray': '10 8' });
      line(g, head(126, 0, 104, 10, 13), '#c0392b', 3.4, { class: 'ink head' });
      caravel(g, -4, -28, 1);
      for (const [x, y] of [[-60, 80], [30, 70], [70, -86], [-40, -84]]) line(g, `M${x} ${y} q8 -6 16 0 t16 0`, '#4f93d6', 2);
      const cr = mk('g', { transform: 'translate(-150 -72)' }, g);
      P(cr, 'M0 -26 L6 -6 L26 0 L6 6 L0 26 L-6 6 L-26 0 L-6 -6 Z', '#fdfdfb', '#5a3a1a', 2); label(cr, 0, -30, 'N', '#5a3a1a', 18, 'middle');
      P(g, E(-132, 30, 6), '#c0392b', '#7a1f1a', 2); P(g, E(128, 0, 6), '#c0392b', '#7a1f1a', 2);
      if (t || showLab(o)) label(g, -140, 58, A, '#5a3a1a', 22, 'middle'); if (t || showLab(o)) label(g, 150, 34, B, '#5a3a1a', 22, 'middle');
    }),
    // "windmill cx cy size" — old tower windmill with four lattice sails
    windmill: make(320, g => {
      const ink = '#5a4e42';
      P(g, 'M-50 120 L-34 -60 L34 -60 L50 120 Z', '#ecdcc0', ink);
      P(g, 'M-42 -58 Q0 -112 42 -58 Z', '#9a6b40', '#4a2c12');
      P(g, 'M-14 120 V82 Q0 68 14 82 V120 Z', '#7a4a24', '#4a2c12', 2.4); P(g, RR(-8, 6, 16, 22, 6), '#7fb7ea', ink, 2);
      const hub = mk('g', { transform: 'translate(0 -66)' }, g);
      for (const a of [45, 135, 225, 315]) {
        const s = mk('g', { transform: `rotate(${a})` }, hub);
        line(s, 'M0 0 L0 -126', '#5a3a1a', 4);
        P(s, RR(4, -124, 26, 96), '#fbf5e6', '#8a7660', 2.2);
        line(s, 'M4 -100 H30 M4 -76 H30 M4 -52 H30 M17 -124 V-28', '#8a7660', 1.4);
      }
      P(hub, E(0, 0, 9), '#7a4a24', '#4a2c12', 2.4);
      ground(g, -150, 150, 120);
      return 148;
    }),
    // "watermill cx cy size" — stone mill house with a big wooden water wheel in a stream
    watermill: make(340, g => {
      const ink = '#5a5046';
      P(g, RR(-150, -40, 160, 136), '#d9cfbf', ink); P(g, 'M-166 -38 L-70 -110 L26 -38 Z', '#b0503a', '#6b2a1a');
      for (let y = -20; y < 90; y += 20) line(g, `M-144 ${y} h24 M-100 ${y + 10} h30 M-50 ${y} h26`, '#a89a88', 1.4);
      P(g, RR(-120, -14, 30, 30, 2), '#7fb7ea', ink, 2); P(g, RR(-50, 40, 34, 56, 2), '#7a4a24', '#4a2c12', 2.4);
      const W = mk('g', { transform: 'translate(80 30)' }, g);
      P(W, E(0, 0, 82), 'none', '#7a4a24', 5); P(W, E(0, 0, 60), 'none', '#7a4a24', 3);
      for (let a = 0; a < 360; a += 30) { const [x1, y1] = pt(10, a), [x2, y2] = pt(82, a), [x3, y3] = pt(98, a + 6); line(W, `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`, '#8a5a2b', 3.4); line(W, `M${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)}`, '#7a4a24', 6); }
      P(W, E(0, 0, 12), '#7a4a24', '#4a2c12', 2.4);
      P(g, 'M-180 104 Q-80 94 0 104 T180 100 L180 124 L-180 124 Z', '#7fb7ea', '#2b6cc4', 2.4);
      for (const x of [-140, -60, 30, 120]) line(g, `M${x} 114 q8 -5 16 0 t16 0`, '#2b6cc4', 2);
      P(g, 'M140 -64 L190 -64 L190 -52 L150 -52 Q142 -40 150 -30', '#9a6b40', '#4a2c12', 2.4);
      line(g, 'M150 -50 Q140 -20 140 -6', '#4f93d6', 4, { 'stroke-dasharray': '8 6' });
      return 150;
    }),
    // "steamengine cx cy size" — early steam engine: boiler over fire, piston, flywheel, steam
    steamengine: make(360, g => {
      const ink = '#3f4650';
      puff(g, [[-110, -136, 18], [-96, -164, 24], [-74, -186, 28]]);
      P(g, RR(-124, -120, 26, 70), '#7a8594', ink, 2.6);
      P(g, RR(-170, -52, 150, 80, 36), '#c96a4a', '#6e2f1c');
      for (const x of [-130, -90, -50]) line(g, `M${x} -48 V24`, '#8a3a24', 2);
      P(g, RR(-160, 28, 130, 64, 4), '#5a5046', '#2a2420'); P(g, RR(-130, 46, 70, 38, 6), '#3a3430', '#111', 2.4); flame(g, -95, 84, .6);
      line(g, 'M-20 -12 H10', ink, 6);
      P(g, RR(10, -34, 70, 44, 4), '#9aa3ad', ink, 2.6); P(g, RR(32, -28, 14, 32), '#5a6068', ink, 2);
      line(g, 'M46 -12 L118 30', ink, 6);
      P(g, E(130, 40, 62), 'none', ink, 6);
      for (let a = 0; a < 360; a += 60) { const [x, y] = pt(60, a); line(g, `M130 40 L${(130 + x).toFixed(1)} ${(40 + y).toFixed(1)}`, '#5a6068', 4); }
      P(g, E(130, 40, 12), '#5a6068', ink, 2.4); P(g, E(118, 30, 6), '#c9cfd7', ink, 2);
      P(g, RR(-180, 92, 360, 14, 2), '#8a8f96', ink, 2.4);
      return 132;
    }),
    // "steamtrain cx cy length" — early steam locomotive with tender, smoke and rails
    steamtrain: make(420, g => {
      const ink = '#2a2e33';
      puff(g, [[150, -120, 20], [118, -142, 26], [76, -156, 30], [28, -160, 26]]);
      P(g, RR(-210, -34, 100, 74, 6), '#7a4a24', '#4a2c12'); P(g, RR(-206, -50, 92, 18, 4), '#3a3430', '#111', 2.4);
      P(g, RR(-80, -110, 80, 150, 6), '#c0392b', '#6e1f16'); P(g, RR(-88, -120, 96, 16, 4), '#2a2e33', ink, 2.4);
      P(g, RR(-64, -92, 48, 40, 4), '#ffe9a6', '#6e1f16', 2.4);
      P(g, RR(0, -66, 160, 74, 34), '#3f4650', ink); for (const x of [40, 90, 130]) line(g, `M${x} -66 V8`, '#c9a46a', 3);
      P(g, 'M130 -66 L126 -112 L170 -112 L160 -66 Z', '#2a2e33', ink, 2.6); P(g, E(80, -72, 14, 10), '#c9a46a', '#7a5326', 2.4);
      P(g, 'M160 10 L200 50 L160 50 Z', '#c0392b', '#6e1f16', 2.4);
      P(g, RR(-90, 8, 260, 22), '#2a2e33', ink, 2.4);
      for (const [x, r] of [[-180, 18], [-140, 18], [-40, 34], [40, 34], [120, 22]]) { P(g, E(x, 48, r), '#5a6068', ink, 2.6); P(g, E(x, 48, r * .3), '#c9cfd7', ink, 2); }
      line(g, 'M-40 52 L40 44', '#c9cfd7', 5);
      line(g, 'M-214 84 H214', '#5a5046', 4); for (let x = -200; x <= 200; x += 30) line(g, `M${x} 84 v10`, '#7a5326', 5);
      return 130;
    }),
    // "telegraph cx cy size | ··· — —" — telegraph poles and wire carrying a dot-dash message, tapping key
    telegraph: make(400, (g, o, t) => {
      const ink = '#5a3a1a';
      for (const x of [-120, 150]) { line(g, `M${x} 110 V-100`, '#8a5a2b', 8); line(g, `M${x - 34} -84 H${x + 34}`, '#8a5a2b', 6); for (const d of [-26, 26]) P(g, RR(x + d - 4, -98, 8, 12, 3), '#7fb7ea', '#2b6cc4', 1.6); }
      line(g, 'M-200 -80 Q-160 -64 -146 -86 M-94 -86 Q15 -56 124 -86 M176 -86 Q190 -68 200 -74', '#2a2420', 2.4);
      line(g, 'M-200 -100 Q-160 -84 -146 -100 M-94 -100 Q15 -70 124 -100 M176 -100 Q190 -84 200 -90', '#2a2420', 2.4);
      if (t) label(g, 15, -110, t, TXT.red, 30, 'middle');
      else line(g, 'M-50 -110 l.01 0 M-30 -110 l.01 0 M-10 -110 h24 M34 -110 h24 M78 -110 l.01 0', TXT.red, 9);
      P(g, RR(-60, 66, 130, 34, 4), '#b07a44', ink); P(g, RR(-40, 50, 90, 10, 3), '#9aa3ad', '#4f5966', 2.2);
      line(g, 'M-34 50 L44 40', '#5a6068', 5); P(g, E(46, 36, 12, 7), '#2a2e33', '#111', 2.4);
      line(g, 'M70 84 Q100 90 110 70 Q120 40 150 50', '#2a2420', 2.4);
      ground(g, -200, 200, 110);
    }),
    // "oldphone cx cy size k=candlestick|rotary" — early telephone: candlestick or rotary dial
    oldphone: make(260, (g, o) => { pick(PHONE, o.k, 'candlestick', 'oldphone')(g); return 156; }),
    // "inventbulb cx cy size" — inventor's bench: first glowing bulb wired to battery jars, notes
    inventbulb: make(360, g => {
      const ink = '#5a3a1a';
      for (let a = -165; a <= -15; a += 30) { const [x1, y1] = pt(66, a), [x2, y2] = pt(92, a); line(g, `M${(-40 + x1).toFixed(1)} ${(-96 + y1).toFixed(1)} L${(-40 + x2).toFixed(1)} ${(-96 + y2).toFixed(1)}`, '#f6c84c', 5); }
      P(g, 'M-58 -50 Q-60 -64 -72 -76 Q-88 -96 -84 -118 Q-76 -150 -40 -150 Q-4 -150 4 -118 Q8 -96 -8 -76 Q-20 -64 -22 -50 Z', '#fff3a6', '#c97a10');
      line(g, 'M-50 -50 L-50 -90 Q-40 -112 -30 -90 L-30 -50', '#e0a100', 2.4);
      P(g, RR(-62, -50, 44, 22, 4), '#b9c0c9', '#5a6068', 2.4); P(g, RR(-56, -28, 32, 30, 3), '#7a4a24', ink, 2.4);
      for (const x of [70, 120]) { P(g, RR(x - 18, -30, 36, 52, 6), '#cfe8f7', '#2b6cc4', 2.4); P(g, RR(x - 12, -6, 24, 26, 3), '#7fb7ea', '#2b6cc4', 1.6); line(g, `M${x - 6} -40 V-30 M${x + 6} -40 V-30`, '#5a6068', 3); }
      line(g, 'M-24 -10 Q20 -60 64 -40 M76 -40 Q96 -56 114 -40 M126 -40 Q160 -70 130 -96 Q60 -120 -30 -70', '#c0392b', 2.4);
      P(g, 'M-170 -14 L-112 -26 L-100 4 L-158 16 Z', '#fffdf6', '#8a7660', 2.2);
      line(g, 'M-158 -8 l40 -8 M-154 2 l36 -8 M-136 -18 q6 -8 12 -2', '#2b6cc4', 1.8);
      P(g, RR(-180, 2, 360, 18, 3), '#b07a44', ink); line(g, 'M-160 20 V110 M160 20 V110', ink, 8);
      return 134;
    }),
    // "biplane cx cy length" — early biplane: two fabric wings, struts, propeller, side view facing right
    biplane: make(420, g => {
      const ink = '#5a3a1a';
      P(g, 'M-190 -30 L-150 -40 L-140 -4 L-190 0 Z', '#f3e6c4', ink, 2.4); P(g, 'M-196 -62 L-170 -60 L-150 -38 L-186 -30 Z', '#f3e6c4', ink, 2.4);
      P(g, 'M-160 -24 Q-60 -36 100 -30 Q140 -26 150 -12 Q140 4 100 6 Q-60 8 -160 -8 Z', '#e8d6a0', ink);
      P(g, RR(-80, -100, 220, 16, 8), '#f3e6c4', ink); P(g, RR(-70, 14, 200, 14, 7), '#f3e6c4', ink);
      for (const x of [-50, 100]) line(g, `M${x} -84 L${x} 14 M${x + 24} -84 L${x} 14`, ink, 2.4);
      line(g, 'M-40 -84 L110 14 M-40 14 L110 -84', '#8a7660', 1.2);
      P(g, RR(10, -54, 34, 20, 8), '#7fb7ea', ink, 2); fig(g, 26, -40, 34, '#7a4a24');
      P(g, E(152, -12, 8), '#7a4a24', ink, 2.4); P(g, 'M156 -64 Q166 -12 156 40 Q150 -12 156 -64 Z', '#9a6b40', ink, 2.4);
      line(g, 'M30 28 L20 60 M60 28 L70 60', ink, 3); for (const x of [20, 70]) P(g, E(x, 64, 12), '#3a3430', '#111', 2.4);
      return 100;
    }),
    // "lander cx cy size" — moon landing: four-legged lander, astronaut, footprints, Earth in the sky
    lander: make(420, g => {
      const ink = '#3f4650';
      P(g, E(150, -100, 28), '#7fb7ea', '#2b6cc4'); P(g, smooth([[136, -112], [154, -118], [162, -100], [146, -90]]), '#8cc46a', '#2c6a22', 1.8);
      for (const [x, y] of [[-170, -110], [-110, -80], [60, -120], [-30, -130], [110, -60]]) line(g, `M${x - 6} ${y} h12 M${x} ${y - 6} v12`, '#c9a03a', 2);
      P(g, 'M-210 50 Q-100 34 0 46 T210 40 L210 120 L-210 120 Z', '#d0d3d6', '#6a7078');
      for (const [x, y, r] of [[-150, 80, 22], [120, 92, 16], [30, 104, 10]]) P(g, E(x, y, r, r * .35), '#b9bdc2', '#6a7078', 2);
      for (const [x, s] of [[-80, -1], [80, 1]]) line(g, `M${x * .5} -10 L${x} 52 M${x - 12 * s} 54 H${x + 12 * s}`, ink, 4);
      line(g, 'M-20 10 L-30 52 M20 10 L30 52', ink, 3);
      P(g, 'M-54 -30 L54 -30 L48 14 L-48 14 Z', '#f3c33b', '#a07a10'); for (let x = -40; x <= 40; x += 16) line(g, `M${x} -26 l6 36`, '#d18b00', 1.4);
      P(g, 'M-40 -30 L-48 -66 L-20 -94 L26 -94 L48 -66 L40 -30 Z', '#d9dde2', ink);
      P(g, 'M-24 -76 L-8 -84 L-6 -64 L-22 -60 Z', '#3a3f45', '#111', 2);
      line(g, 'M14 -94 V-114 M6 -114 H22', ink, 2.4);
      const ax = 130, ay = 66;
      P(g, RR(ax - 20, ay - 74, 14, 40, 4), '#c9cfd7', ink, 2.2);
      line(g, `M${ax - 6} ${ay - 30} L${ax - 10} ${ay} M${ax + 6} ${ay - 30} L${ax + 12} ${ay}`, '#eef1f4', 11);
      line(g, `M${ax - 6} ${ay - 30} L${ax - 10} ${ay} M${ax + 6} ${ay - 30} L${ax + 12} ${ay}`, ink, 1.4);
      P(g, RR(ax - 14, ay - 72, 28, 44, 10), '#eef1f4', ink, 2.4);
      line(g, `M${ax + 12} ${ay - 64} L${ax + 26} ${ay - 82}`, '#eef1f4', 9); line(g, `M${ax + 12} ${ay - 64} L${ax + 26} ${ay - 82}`, ink, 1.2);
      P(g, E(ax, ay - 86, 15), '#eef1f4', ink, 2.4); P(g, E(ax + 3, ay - 86, 10, 8), '#f3c33b', '#a07a10', 2);
      for (const [x, y] of [[96, 62], [76, 58], [58, 62]]) P(g, E(x, y, 5, 2.5), '#9aa0a8', '#6a7078', 1.2);
    }),
    // "millrow cx cy width" — industrial-revolution brick mills with many tall smoking chimneys
    millrow: make(420, g => {
      const ink = '#5a2e1e';
      puff(g, [[-150, -150, 18], [-130, -176, 24], [-30, -168, 20], [-6, -192, 26], [100, -150, 18], [124, -176, 24], [160, -190, 20]], '#b8bcc2', '#6a7078');
      for (const [x, h] of [[-160, 170], [-40, 190], [90, 170], [150, 150]]) { P(g, `M${x} 0 L${x + 4} ${-h} L${x + 20} ${-h} L${x + 24} 0 Z`, '#b0503a', ink, 2.4); P(g, RR(x, -h - 8, 24, 10, 2), '#6b2a1a', ink, 2); }
      const bld = (x, w, h) => {
        P(g, RR(x, -h, w, h + 100), '#c96a4a', ink);
        let d = `M${x} ${-h}`; for (let i = 0; i < w / 30; i++) d += ` l15 -18 l15 18`; P(g, d + ` L${x} ${-h} Z`, '#8a3a24', ink, 2.2);
        for (let yy = -h + 14; yy < 70; yy += 30) for (let xx = x + 10; xx < x + w - 14; xx += 22) P(g, RR(xx, yy, 12, 18, 1), '#ffe9a6', ink, 1.4);
      };
      bld(-200, 120, 70); bld(-74, 150, 90); bld(82, 120, 60);
      line(g, 'M-210 100 H210', '#3a3430', 3);
      return 128;
    }),
    // "assembly cx cy width" — assembly line: car bodies built step by step on a moving belt, workers
    assembly: make(440, (g, o) => {
      const ink = '#3f4650';
      fig(g, -66, 104, 120, '#2b6cc4', SKIN[2], 1); fig(g, 66, 104, 120, '#5fae3a', SKIN[3], 1);
      P(g, RR(-210, 40, 420, 22, 11), '#5a6068', ink); for (let x = -196; x <= 196; x += 28) P(g, E(x, 51, 7), '#9aa3ad', ink, 1.6);
      line(g, 'M-200 36 H200', '#3a3f45', 2.4, { 'stroke-dasharray': '10 8' });
      line(g, 'M-200 74 V110 M200 74 V110 M0 74 V110', ink, 6); line(g, 'M-210 70 H210', ink, 3);
      // 1: bare frame, 2: body shell, 3: painted car
      line(g, 'M-170 26 H-90 M-160 26 V14 M-100 26 V14', '#7a8594', 4); for (const x of [-160, -100]) P(g, E(x, 30, 10), '#3a3430', '#111', 2);
      P(g, 'M-40 26 L-40 4 L-20 -12 H20 L36 4 L40 26 Z', '#c9cfd7', ink, 2.4); for (const x of [-26, 28]) P(g, E(x, 30, 10), '#3a3430', '#111', 2);
      P(g, 'M90 26 L90 4 L112 -14 H150 L170 4 L184 8 L184 26 Z', '#e04b3a', '#8a1f1a', 2.6); P(g, 'M118 -8 H146 L158 4 H112 Z', '#bfe3fa', '#8a1f1a', 1.8); for (const x of [108, 166]) P(g, E(x, 30, 10), '#3a3430', '#111', 2);
      arrow(g, -60, -90, 60, -90, TXT.blue, 3.4);
      if (showLab(o)) label(g, -130, 108, '1', TXT.blue, 26, 'middle'); if (showLab(o)) label(g, 0, 108, '2', TXT.blue, 26, 'middle'); if (showLab(o)) label(g, 137, 108, '3', TXT.blue, 26, 'middle');
    }),
    // "march cx cy width | Clean Air, Fair Pay" — peaceful march: faceless crowd holding signs from |text
    march: make(420, (g, o, t) => {
      const S = list(t, 'Clean Air, Fair Pay, Our Future');
      for (let i = 0; i < 9; i++) fig(g, -176 + i * 44, 34, 82, SHIRT[(i + 3) % 6], SKIN[(i * 3 + 1) % 4]);
      const xs = S.map((_, i) => S.length === 1 ? 0 : -140 + i * 280 / (S.length - 1));
      xs.forEach((x, i) => {
        line(g, `M${x} 26 V-60`, '#8a5a2b', 5);
        const w = Math.max(84, S[i].length * 12 + 26);
        P(g, RR(x - w / 2, -124, w, 66, 6), '#fffdf6', '#3a3430', 2.6);
        label(g, x, -82, S[i], [TXT.red, TXT.blue, TXT.green][i % 3], 22, 'middle');
      });
      for (let i = 0; i < 8; i++) fig(g, -154 + i * 44, 104, 96, SHIRT[i % 6], SKIN[(i * 3) % 4], xs.some(x => Math.abs(x - (-154 + i * 44 + 18)) < 22) ? 1 : 0);
      ground(g, -200, 200, 106);
    }),
    // "votecount cx cy width | Option A:124, Option B:98" — vote counting: ballot piles and a tally board
    votecount: make(420, (g, o, t) => {
      const R = list(t, 'Option A:124, Option B:98, Option C:41').slice(0, 4).map(s => { const [n, v] = s.split(':'); return [n.trim(), +v || 0]; });
      const max = Math.max(...R.map(r => r[1]), 1), C = ['#7fb7ea', '#f4a531', '#5fae3a', '#e07a5f'];
      P(g, RR(-190, -130, 380, 40 + R.length * 34, 8), '#2f5a3a', '#1f3a26');
      R.forEach(([n, v], i) => {
        const y = -100 + i * 34;
        label(g, -176, y + 12, n, '#ffffff', 22, 'start');
        P(g, RR(-40, y - 8, 170 * v / max, 22, 4), C[i], '#ffffff', 2);
        label(g, 176, y + 12, String(v), '#ffe9a6', 24, 'end');
      });
      P(g, RR(-200, 60, 400, 16, 3), '#b07a44', '#5a3a1a'); line(g, 'M-180 76 V116 M180 76 V116', '#5a3a1a', 8);
      R.forEach(([, v], i) => {
        const x = -150 + i * (300 / Math.max(R.length - 1, 1)), n = Math.max(1, Math.round(6 * v / max));
        for (let k = 0; k < n; k++) P(g, `M${x - 30 + (k % 2) * 4} ${58 - k * 6} l60 0 l2 -5 l-60 0 Z`, '#fffdf6', '#8a7660', 1.4);
        P(g, RR(x - 18, 30 - n * 6, 36, 14, 3), C[i], '#3a3430', 1.6);
      });
      fig(g, -40, 58, 50, '#f4a531', SKIN[2]); fig(g, 50, 58, 50, '#b39ddb', SKIN[0]);
    }),
    // "branches cx cy width | Legislative, Executive, Judicial" — three branches of government with checks and balances
    branches: make(440, (g, o, t) => {
      const N = list(t, 'Legislative, Executive, Judicial'), D = ['makes laws', 'carries out laws', 'judges laws'], C = [['#d6e8fa', '#2b6cc4'], ['#fde3c2', '#c97a10'], ['#dff0c8', '#2c8a2c']];
      P(g, RR(-90, -140, 180, 44, 10), '#f3e6c4', AGEDK); if (showLab(o)) label(g, 0, -110, 'Constitution', '#5a3a1a', 24, 'middle');
      line(g, 'M0 -96 V-70 M-140 -70 H140 M-140 -70 V-50 M0 -70 V-50 M140 -70 V-50', '#3a3430', 2.6);
      [-140, 0, 140].forEach((x, i) => {
        P(g, RR(x - 66, -50, 132, 140, 10), C[i][0], C[i][1]);
        const y = -14;
        if (i === 0) { P(g, `M${x - 30} ${y} L${x} ${y - 22} L${x + 30} ${y} Z`, '#fdfdfb', C[i][1], 2); for (const d of [-20, -7, 7, 20]) line(g, `M${x + d} ${y + 2} V${y + 26}`, C[i][1], 3); line(g, `M${x - 32} ${y + 28} H${x + 32}`, C[i][1], 3); }
        if (i === 1) { P(g, RR(x - 26, y - 14, 52, 40, 3), '#fdfdfb', C[i][1], 2); for (const d of [-14, 0, 14]) P(g, RR(x + d - 4, y - 6, 8, 10, 1), '#7fb7ea', C[i][1], 1.2); P(g, RR(x - 5, y + 12, 10, 14, 1), C[i][1], C[i][1], 1.2); }
        if (i === 2) { line(g, `M${x} ${y - 20} V${y + 24} M${x - 14} ${y + 26} H${x + 14} M${x - 28} ${y - 12} H${x + 28}`, C[i][1], 3); for (const s of [-1, 1]) P(g, `M${x + s * 28 - 12} ${y + 6} Q${x + s * 28} ${y + 18} ${x + s * 28 + 12} ${y + 6} Z`, '#f3c33b', C[i][1], 2); line(g, `M${x - 40} ${y + 6} L${x - 28} ${y - 12} L${x - 16} ${y + 6} M${x + 16} ${y + 6} L${x + 28} ${y - 12} L${x + 40} ${y + 6}`, C[i][1], 1.4); }
        if (t || showLab(o)) label(g, x, 46, N[i] || '', C[i][1], 22, 'middle'); if (showLab(o)) label(g, x, 72, D[i], '#3a3430', 17, 'middle');
      });
      carrow(g, -100, 96, -70, 130, -40, 96, '#c0392b', 2.6); carrow(g, 40, 96, 70, 130, 100, 96, '#c0392b', 2.6);
      carrow(g, 120, 100, 0, 170, -120, 100, '#c0392b', 2.6);
      if (showLab(o)) label(g, 0, 160, 'checks and balances', '#c0392b', 18, 'middle');
    }),
    // "charter cx cy size | Constitution" — founding charter: large parchment, title, columns, signatures, quill
    charter: make(320, (g, o, t) => {
      const ink = AGEDK;
      P(g, 'M-110 -140 Q-100 -150 -90 -140 L100 -140 Q112 -132 106 -120 L106 128 Q100 140 90 132 L-100 132 Q-112 124 -110 112 Z', AGED, ink);
      label(g, -2, -100, t || 'We the People', '#4a3a24', t && t.length > 12 ? 24 : 30, 'middle');
      for (const x0 of [-90, 6]) for (let y = -70; y < 70; y += 13) line(g, `M${x0} ${y} H${x0 + (y % 39 ? 84 : 70)}`, '#8a7660', 1.6);
      for (const [x, y] of [[-80, 92], [-30, 100], [24, 90], [64, 102]]) line(g, `M${x} ${y} q6 -12 12 0 t12 -2 t10 2`, '#2a3a5a', 2);
      P(g, RR(110, 80, 34, 30, 6), '#3a3f45', '#111', 2.4);
      P(g, 'M128 82 Q150 10 190 -70 Q186 -20 150 40 Q140 66 130 82 Z', '#fdfdfb', '#8a8f96', 2.2);
      line(g, 'M128 84 Q150 10 188 -64', '#8a8f96', 1.6);
    }),
    // "regionmap cx cy width | North, East, South, West, Centre" — generic land with coloured regions, borders, capitals
    regionmap: make(420, (g, o, t) => {
      const N = list(t, 'North, East, South, West, Centre'), id = 'histReg' + clipN++;
      const land = smooth([[-170, -40], [-120, -100], [-30, -116], [60, -104], [140, -80], [178, -20], [150, 40], [160, 90], [70, 112], [-20, 100], [-90, 110], [-160, 70], [-180, 20]]);
      P(g, RR(-200, -130, 400, 260, 10), '#d6ebf5', '#4f93d6', 2);
      mk('clipPath', { id }, g).append(mk('path', { d: land }));
      const cl = mk('g', { 'clip-path': `url(#${id})` }, g), C = ['#f8d77a', '#a6d468', '#f4b08a', '#b9d4f2', '#d9c2ef'];
      const R = [['M-200 -140 L200 -140 L200 -40 L20 -20 L-80 -50 L-200 -40 Z', [10, -80]], ['M200 -40 L20 -20 L50 40 L200 60 Z', [120, 10]], ['M200 60 L50 40 L-30 50 L-40 140 L200 140 Z', [70, 86]], ['M-200 -40 L-80 -50 L-90 40 L-30 50 L-40 140 L-200 140 Z', [-130, 40]], ['M-80 -50 L20 -20 L50 40 L-30 50 L-90 40 Z', [-24, 14]]];
      R.forEach(([d], i) => F(cl, d, C[i]));
      line(g, land, '#2c6a22', 3);
      line(cl, 'M-80 -50 L20 -20 L200 -40 M20 -20 L50 40 L200 60 M50 40 L-30 50 L-40 140 M-30 50 L-90 40 L-80 -50 L-200 -40', '#7a4a7a', 2.2, { 'stroke-dasharray': '8 6' });
      R.forEach(([, [x, y]], i) => { if (!N[i]) return; P(g, E(x, y + 14, 5), '#c0392b', '#7a1f1a', 2); if (t || showLab(o)) label(g, x, y, N[i], '#3a3430', 20, 'middle'); });
      const cr = mk('g', { transform: 'translate(-170 -96)' }, g);
      P(cr, 'M0 -18 L7 6 L0 0 L-7 6 Z', '#3a3430', '#3a3430', 1.6); label(cr, 0, 26, 'N', '#3a3430', 18, 'middle');
    }),
    // "latlong cx cy r" — globe with latitude and longitude grid, equator and prime meridian labelled
    latlong: ([cx, cy, R = 130], o, t, parent) => {
      const outer = mk('g', {}, parent), g = mk('g', { transform: `translate(${cx} ${cy}) scale(${R / 130})` }, outer), id = 'histLat' + clipN++;
      P(g, E(0, 0, 130), '#bfe3fa', '#2b6cc4');
      mk('clipPath', { id }, g).append(mk('path', { d: E(0, 0, 130) }));
      const cl = mk('g', { 'clip-path': `url(#${id})` }, g);
      for (const p of [[[-110, -60], [-60, -90], [-30, -60], [-50, -20], [-80, 0], [-100, -30]], [[-40, 20], [-10, 10], [0, 60], [-30, 100], [-50, 60]], [[20, -90], [90, -80], [110, -30], [60, 0], [30, 30], [10, -30]], [[30, 30], [70, 30], [80, 80], [40, 100]]]) F(cl, smooth(p), '#a6d468');
      for (const lat of [-60, -30, 30, 60]) { const y = -130 * Math.sin(lat * Math.PI / 180), w = 130 * Math.cos(lat * Math.PI / 180); line(g, `M${(-w).toFixed(1)} ${y.toFixed(1)} Q0 ${(y + 12).toFixed(1)} ${w.toFixed(1)} ${y.toFixed(1)}`, '#2b6cc4', 1.6); }
      for (const lon of [-60, -30, 30, 60]) { const w = 130 * Math.sin(lon * Math.PI / 180); line(g, `M0 -130 Q${(w * 1.33).toFixed(1)} 0 0 130`, '#2b6cc4', 1.6); }
      line(g, 'M-130 0 Q0 12 130 0', '#c0392b', 3.4); line(g, 'M0 -130 V130', '#c97a10', 3.4);
      if (showLab(o)) label(outer, cx + R + 10, cy + 8, 'Equator 0°', TXT.red, 22, 'start');
      if (showLab(o)) label(outer, cx, cy - R - 12, 'Prime meridian 0°', TXT.orange, 22, 'middle');
      if (showLab(o)) for (const lat of [30, 60]) { const y = -R * Math.sin(lat * Math.PI / 180); label(outer, cx + R * Math.cos(lat * Math.PI / 180) + 8, cy + y + 6, `${lat}°N`, TXT.blue, 18, 'start'); label(outer, cx + R * Math.cos(lat * Math.PI / 180) + 8, cy - y + 6, `${lat}°S`, TXT.blue, 18, 'start'); }
      return outer;
    },
    // "timezones cx cy width start=6 step=3" — band of time zones, each with a clock; day fades to night
    timezones: make(480, (g, o) => {
      const n = 8, w = 440 / n, h0 = +(o.start ?? 6), st = +(o.step ?? 3);
      for (let i = 0; i < n; i++) {
        const hr = ((h0 + i * st) % 24 + 24) % 24, day = hr >= 6 && hr < 18, x = -220 + i * w;
        P(g, RR(x, -70, w, 140), day ? (hr >= 9 && hr < 15 ? '#fff3a6' : '#fbd38a') : (hr >= 21 || hr < 3 ? '#2f3f6a' : '#5a6aa0'), '#3a3430', 2);
        const cy = -10, cx = x + w / 2;
        P(g, E(cx, cy, 20), '#fdfdfb', '#3a3430', 2.2);
        const [hx, hy] = pt(11, (hr % 12) * 30 - 90); line(g, `M${cx} ${cy} l${hx.toFixed(1)} ${hy.toFixed(1)} M${cx} ${cy} l0 -15`, '#3a3430', 2.4);
        label(g, cx, 48, `${hr}:00`, day ? '#5a3a1a' : '#ffffff', 18, 'middle');
        if (hr === 12) P(g, E(cx, -50, 10), '#ffd84a', '#d18b00', 2);
        if (hr === 0) P(g, `M${cx + 4} -60 A11 11 0 1 0 ${cx + 4} -40 A8 8 0 1 1 ${cx + 4} -60 Z`, '#fdfdfb', '#c9cfd7', 2);
      }
      arrow(g, -200, 92, 200, 92, TXT.blue, 3); if (showLab(o)) label(g, 0, 120, `+${st} hours each zone, going east`, TXT.blue, 20, 'middle');
    }),
    // "poppyramid cx cy size | 9,8,7,6,5,4,3,2 / 9,8,8,6,5,4,4,3" — population pyramid: male and female bars by age
    poppyramid: make(400, (g, o, t) => {
      const [m, f] = (t || '9,8,8,7,6,5,4,3,2 / 9,8,8,7,6,5,4,4,3').split('/').map(s => s.split(',').map(Number).filter(v => !isNaN(v)));
      const F2 = f && f.length ? f : m, n = m.length, bh = Math.min(26, 230 / n), max = Math.max(...m, ...F2, 1), W = 150, base = 110;
      for (let i = 0; i < n; i++) {
        const y = base - (i + 1) * bh;
        P(g, RR(-20 - W * m[i] / max, y + 1, W * m[i] / max, bh - 2), '#7fb7ea', '#2b6cc4', 2);
        P(g, RR(20, y + 1, W * (F2[i] || 0) / max, bh - 2), '#f4a531', '#c97a10', 2);
        if (i % 2 === 0 || n <= 6) label(g, 0, y + bh / 2 + 6, `${i * 10}+`, '#3a3430', 14, 'middle');
      }
      line(g, `M-20 ${base} V${base - n * bh} M20 ${base} V${base - n * bh}`, '#3a3430', 2.4);
      line(g, `M-180 ${base} H180`, '#3a3430', 2.4);
      if (showLab(o)) label(g, -100, base - n * bh - 14, 'Male', TXT.blue, 24, 'middle'); if (showLab(o)) label(g, 100, base - n * bh - 14, 'Female', TXT.orange, 24, 'middle');
      if (showLab(o)) label(g, 0, base + 26, '% of people by age', '#3a3430', 18, 'middle');
    }),
    // "migrate cx cy width" — world map with curved migration arrows between continents
    migrate: make(420, g => {
      RECIPES.worldmap([0, 0, 400], {}, null, g);
      const M = [[20, 4, -6, -40, 4, -52], [92, -24, 30, -70, -96, -44], [26, -22, 56, -30, 110, -28], [-60, 24, -90, -6, -98, -32], [130, -28, 160, 16, 140, 26]];
      for (const [x1, y1, qx, qy, x2, y2] of M) carrow(g, x1 * 1.04, y1 * 1.04, qx * 1.04, qy * 1.04, x2 * 1.04, y2 * 1.04, '#c0392b', 3.6);
      for (const [x, y] of [[20, 4], [92, -24], [26, -22], [-60, 24], [130, -28]]) P(g, E(x * 1.04, y * 1.04, 5), '#c0392b', '#7a1f1a', 2);
      return 118;
    }),
    // "caravan cx cy width" — trade caravan: camels loaded with goods crossing desert dunes, a guide
    caravan: make(440, g => {
      P(g, E(150, -100, 30), '#ffd84a', '#d18b00');
      P(g, smooth([[-220, 40], [-140, 10], [-60, 30], [40, 0], [140, 24], [220, 10], [220, 120], [-220, 120]]), '#f3d08a', '#b8902a', 2.4);
      for (const [x, s] of [[-130, 130], [-10, 130], [110, 130]]) {
        RECIPES.animal([x, 30, s], { k: 'camel' }, null, g);
        const k = s / 260;
        P(g, RR(x - 30 * k, 30 - 112 * k, 34 * k, 30 * k, 6 * k), '#e07a5f', '#8a3a24', 2); P(g, RR(x + 10 * k, 30 - 108 * k, 28 * k, 26 * k, 6 * k), '#7fb7ea', '#2b6cc4', 2);
        line(g, `M${x - 40 * k} ${30 - 80 * k} H${x + 46 * k}`, '#7a4a24', 2);
      }
      fig(g, 190, 100, 70, '#f3e6c4', SKIN[2]); line(g, 'M177 75 Q160 40 172 -2', '#7a4a24', 2);
      line(g, 'M-160 100 Q-60 108 40 100 T200 104', '#a07a2a', 2, { 'stroke-dasharray': '6 8' });
      return 130;
    }),
    // "silkroad cx cy width | East City, Oasis, Mountain Pass, Market, West Port" — long trade route across mountains and desert, labelled stops
    silkroad: make(460, (g, o, t) => {
      const N = list(t, 'East City, Desert, Mountain Pass, Oasis, West Port');
      P(g, RR(-220, -110, 440, 220, 10), AGED, AGEDK);
      for (const [x, h] of [[-40, 60], [-10, 80], [20, 56]]) P(g, `M${x - 34} 0 L${x} ${-h} L${x + 34} 0 Z`, '#c9bfae', '#6b5a44', 2.4);
      for (const [x, h] of [[-10, 80]]) P(g, `M${x - 12} ${-h + 28} L${x} ${-h} L${x + 12} ${-h + 28} Z`, '#fdfdfb', '#6b5a44', 1.6);
      for (const x of [80, 120, 160]) P(g, `M${x - 26} 70 Q${x} 50 ${x + 26} 70 Z`, '#f3d08a', '#b8902a', 2);
      for (const x of [-160, -120]) line(g, `M${x} 70 q6 -8 12 0 t12 0`, '#4f93d6', 2.4);
      P(g, E(-60, 66, 18, 8), '#7fb7ea', '#2b6cc4', 2); line(g, 'M-60 60 V36', '#6b4424', 3); line(g, 'M-60 36 l-12 6 M-60 36 l12 6 M-60 36 l0 -10', '#3a8a2a', 3);
      const pts = [[190, -60], [100, 36], [0, 10], [-90, 50], [-190, -40]];
      line(g, smooth(pts, false), '#c97a10', 3.4, { 'stroke-dasharray': '10 7' });
      pts.forEach(([x, y], i) => { P(g, E(x, y, 8), '#c0392b', '#7a1f1a', 2); if (N[i] && (t || showLab(o))) label(g, x, y + (i % 2 ? 30 : -16), N[i], '#4a3a24', 18, 'middle'); });
      P(g, RR(150, 70, 44, 26, 13), '#e04b3a', '#8a1f1a', 2); line(g, 'M158 74 V92 M172 72 V94 M186 74 V92', '#ffd84a', 1.6);
      P(g, 'M-196 96 Q-200 70 -186 64 L-166 64 Q-152 70 -156 96 Z', '#d9894a', '#6b3a1a', 2); line(g, 'M-184 64 l8 -8 l8 8', '#6b3a1a', 2);
    }),
    // "oldcoins cx cy size" — ancient coins: stamped gold, silver and bronze pieces, one with a square hole
    oldcoins: make(280, g => {
      const coin = (x, y, r, c, ink, mark) => { P(g, fluff(x, y, r, r * .94, 11, 1.03), c, ink); line(g, E(x, y, r * .78), ink, 1.6); mark(x, y, r, ink); };
      coin(-70, -30, 64, '#f3c33b', '#8a6414', (x, y, r, k) => P(g, 'M' + Array.from({ length: 10 }, (_, i) => { const [a, b] = pt(i % 2 ? r * .22 : r * .5, -90 + i * 36); return `${(x + a).toFixed(1)} ${(y + b).toFixed(1)}`; }).join(' L') + ' Z', '#e0a100', k, 2));
      coin(70, -40, 52, '#d9dde2', '#5a6068', (x, y, r, k) => { line(g, `M${x - 20} ${y + 16} Q${x} ${y - 30} ${x + 20} ${y + 16} M${x} ${y + 18} V${y - 20} M${x - 12} ${y - 2} l12 -8 l12 8`, k, 2.6); });
      coin(-20, 70, 54, '#c98a4a', '#6b3a1a', (x, y, r, k) => { P(g, RR(x - 12, y - 12, 24, 24), '#fdfdfb', k, 2.4); for (const [a, b] of [[0, -30], [30, 0], [0, 30], [-30, 0]]) line(g, `M${x + a - 4} ${y + b} h8`, k, 3); });
      coin(96, 64, 40, '#f3c33b', '#8a6414', (x, y, r, k) => { for (let a = 0; a < 360; a += 45) { const [p, q] = pt(r * .5, a); line(g, `M${x} ${y} l${p.toFixed(1)} ${q.toFixed(1)}`, k, 2); } P(g, E(x, y, 5), '#e0a100', k, 1.6); });
      return 140;
    }),
    // "museumcase cx cy size k=vase|crown|tablet | Label" — museum glass display case with an artefact on a plinth
    museumcase: make(320, (g, o, t) => {
      P(g, RR(-90, 40, 180, 90, 4), '#e3e7eb', '#5a6068');
      P(g, RR(-80, -110, 160, 150, 4), '#eaf5fb', '#5a6068', 2.6);
      const a = mk('g', { transform: 'translate(0 6)' }, g); pick(CASE, o.k, 'vase', 'museumcase')(a);
      P(g, RR(-50, 36, 100, 8, 2), '#c9cfd7', '#5a6068', 2);
      line(g, 'M-64 -96 L-30 -60 M-50 -100 L-20 -70 M50 -40 L70 -20', '#ffffff', 4);
      line(g, 'M-80 -110 H80 V40 H-80 Z', '#5a6068', 3);
      P(g, RR(-50, 64, 100, 40, 3), '#fffdf6', '#8a7660', 2);
      if (t) label(g, 0, 92, t, '#3a3430', t.length > 9 ? 16 : 22, 'middle'); else for (const y of [76, 88]) line(g, `M-36 ${y} H36`, '#8a7660', 2);
      for (const x of [-150, 150]) { line(g, `M${x} 130 V60`, '#c9a03a', 5); P(g, E(x, 58, 7), '#f3c33b', '#8a6414', 2); }
      line(g, 'M-150 66 Q-120 96 -96 72 M150 66 Q120 96 96 72', '#c0392b', 4);
      ground(g, -170, 170, 130, '#8a7660');
    }),
  });
})();
