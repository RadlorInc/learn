// Whiteboard library — world: animals, nature, people & society, history, geography, economics, ideas.
// Catalogue: world.txt. Halal and child-safe: no pig, no dog, no weapons, no real flags, people or brands.
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
  // scalloped ellipse: wool, mane, tree crown, cloud of smoke
  const fluff = (cx, cy, rx, ry, n = 12, b = 1.25) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI, am = (a0 + a1) / 2;
      if (!i) d = `M${(cx + rx * Math.cos(a0)).toFixed(1)} ${(cy + ry * Math.sin(a0)).toFixed(1)}`;
      d += ` Q${(cx + rx * b * Math.cos(am)).toFixed(1)} ${(cy + ry * b * Math.sin(am)).toFixed(1)} ${(cx + rx * Math.cos(a1)).toFixed(1)} ${(cy + ry * Math.sin(a1)).toFixed(1)}`;
    }
    return d + ' Z';
  };
  const star = (x, y, R, r = R * .45) => 'M' + Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return `${(x + q * Math.cos(a)).toFixed(1)} ${(y + q * Math.sin(a)).toFixed(1)}`;
  }).join(' L') + ' Z';
  const arrow = (g, x1, y1, x2, y2, c, w = 3) => { line(g, `M${x1} ${y1} L${x2} ${y2}`, c, w); line(g, head(x2, y2, x1, y1, 12), c, w, { class: 'ink head' }); };
  const mirror = (g, f) => { f(g); f(mk('g', { transform: 'scale(-1 1)' }, g)); };
  const rot = (g, a, x = 0, y = 0) => mk('g', { transform: `rotate(${a} ${x} ${y})` }, g);
  // pick: the drawing, then its detail layers (DETAIL below, 19 Oct 2026) on top
  const pick = (K, k, d, what) => { const f = K[k || d]; if (!f) throw new Error(`Unknown ${what} "${k}" (use ${Object.keys(K).join('|')})`);
    const x = DETAIL[`${what}:${k || d}`], ground = what === 'animal' || what === 'wild animal';
    return x ? g => { if (ground) F(g, E(0, 94, 104, 9), '#000', { opacity: .12 }); const r = f(g); x(g); return r; } : f; };   // a soft shadow on the ground
  const showLab = o => o.lab !== '0' && o.labels !== '0';
  const list = (t, def) => (t || def).split(',').map(s => s.trim()).filter(Boolean);
  // a drawing in its own unit box: base = default size; flip=1 mirrors (faces left); draw may return a caption y
  const make = (base, draw) => ([cx, cy, size = base], o, t, parent) => {
    const outer = mk('g', {}, parent), s = size / base;
    const g = mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${o.flip ? -s : s} ${s})` }, outer);
    const by = draw(g, o, t, outer);
    if (t && typeof by === 'number') label(outer, cx, cy + by * s, t, TXT[o.c] || TXT.blue, 26, 'middle');
    return outer;
  };
  const legs = (g, xs, y0, y1, w, f, ink, hoof) => xs.forEach(x => {
    P(g, RR(x - w / 2, y0, w, y1 - y0, w * .4), f, ink);
    if (hoof) P(g, RR(x - w / 2, y1 - 10, w, 12, 3), hoof, ink, 2);
  });
  const whiskers = (g, x, y, s = 1) => { for (const dy of [-5, 3]) { line(g, `M${x} ${y + dy} l${22 * s} ${dy * 1.2}`, '#6a625a', 1.5); line(g, `M${x - 14 * s} ${y + dy} l${-22 * s} ${dy * 1.2}`, '#6a625a', 1.5); } };

  // ---------- animals ----------
  const ANIMAL = {
    cow: g => {
      const ink = '#3b3b3b', b = '#fbfaf5';
      line(g, 'M-88 -38 Q-112 -20 -106 28', ink, 3); P(g, E(-106, 34, 7, 10), '#4a4440', ink, 2);
      legs(g, [-76, -54, 42, 64], 20, 92, 17, b, ink, '#5a5450');
      P(g, 'M4 38 Q16 62 30 38 Z', '#f4b8c0', ink, 2.4);
      P(g, 'M-92 -36 Q-92 -58 -70 -58 L58 -58 Q80 -58 80 -36 L80 22 Q80 42 60 42 L-72 42 Q-92 42 -92 22 Z', b, ink);
      P(g, smooth([[-66, -50], [-34, -54], [-24, -30], [-48, -16], [-68, -28]]), '#4a4440', ink, 2);
      P(g, smooth([[2, -12], [30, -22], [44, 2], [22, 18], [4, 8]]), '#4a4440', ink, 2);
      P(g, smooth([[-64, 14], [-44, 8], [-40, 30], [-60, 32]]), '#4a4440', ink, 2);
      P(g, 'M80 -76 Q60 -84 56 -72 Q64 -62 82 -66 Z', b, ink, 2.4); P(g, 'M114 -76 Q134 -84 138 -72 Q130 -62 112 -66 Z', b, ink, 2.4);
      P(g, 'M86 -84 Q78 -100 88 -106 Q88 -96 93 -86 Z', '#efe3c4', ink, 2); P(g, 'M108 -84 Q116 -100 106 -106 Q106 -96 101 -86 Z', '#efe3c4', ink, 2);
      P(g, 'M80 -82 Q97 -92 114 -82 L120 -32 Q97 -24 74 -32 Z', b, ink);
      P(g, E(97, -26, 26, 16), '#f4b8c0', ink, 2.6);
      dot(g, 88, -26, '#7a3b45', 5); dot(g, 106, -26, '#7a3b45', 5); dot(g, 88, -60); dot(g, 106, -60);
      return 120;
    },
    horse: g => {
      const ink = '#4a2c17', c = '#b97a48', m = '#5a3a22';
      P(g, 'M-86 -40 Q-122 -30 -118 44 Q-104 12 -90 -16 Z', m, ink);
      legs(g, [-72, -52, 42, 62], 14, 92, 13, c, ink, '#3a2a20');
      P(g, 'M-90 -20 Q-92 -58 -50 -58 L40 -58 Q66 -58 74 -40 L78 -10 Q80 22 50 26 L-56 26 Q-90 24 -90 -20 Z', c, ink);
      P(g, 'M88 -116 L90 -138 L102 -120 Z', c, ink, 2.4);
      P(g, 'M40 -52 Q60 -100 84 -118 Q96 -126 106 -116 L138 -80 Q144 -66 130 -62 Q118 -60 104 -72 L88 -60 Q82 -30 74 -16 Z', c, ink);
      P(g, 'M42 -54 Q56 -98 82 -122 Q76 -98 66 -80 Q60 -62 54 -40 Z', m, ink, 2.4);
      dot(g, 104, -98); dot(g, 132, -70, ink, 4);
      return 120;
    },
    sheep: g => {
      const ink = '#7a7268';
      legs(g, [-56, -36, 30, 50], 20, 92, 10, '#3a3a3a', '#222');
      P(g, fluff(-6, -8, 82, 50, 14, 1.18), '#f8f5ec', ink);
      P(g, 'M72 -42 Q52 -40 54 -30 Q64 -30 74 -34 Z', '#3a3a3a', '#222', 2.4);
      P(g, smooth([[68, -46], [98, -48], [114, -12], [98, 8], [76, -4]]), '#3a3a3a', '#222');
      P(g, fluff(82, -50, 18, 10, 7, 1.35), '#f8f5ec', ink, 2.2);
      dot(g, 96, -26, '#fff', 6);
      for (const [x, y] of [[-50, -20], [-10, 10], [30, -24], [-30, 26]]) line(g, `M${x} ${y} q6 -8 12 0`, '#b8b0a2', 2);
      return 120;
    },
    goat: g => {
      const ink = '#5b4a36', c = '#ece3d3';
      P(g, 'M-80 -34 L-94 -58 L-82 -30 Z', c, ink, 2.4);
      legs(g, [-62, -44, 36, 54], 10, 92, 11, c, ink, '#4a3a2a');
      P(g, 'M-84 -18 Q-86 -48 -56 -48 L44 -48 Q66 -48 68 -24 Q70 14 44 18 L-54 18 Q-84 16 -84 -18 Z', c, ink);
      line(g, 'M78 -88 Q68 -114 46 -110', '#8a7660', 6); line(g, 'M86 -90 Q82 -118 58 -120', '#8a7660', 6);
      P(g, 'M44 -42 Q58 -70 74 -86 Q86 -94 96 -84 L118 -50 Q122 -40 112 -38 Q102 -38 94 -48 L80 -40 Q74 -20 64 -10 Z', c, ink);
      P(g, 'M78 -76 Q56 -74 52 -64 Q66 -62 80 -68 Z', c, ink, 2.4);
      P(g, 'M106 -40 Q106 -18 98 -10 Q94 -26 98 -42 Z', '#bfae94', ink, 2.2);
      dot(g, 92, -70); dot(g, 116, -46, ink, 4);
      return 120;
    },
    camel: g => {
      const ink = '#7a5326', c = '#dcaa62';
      line(g, 'M-80 -12 Q-94 4 -88 26', ink, 3); P(g, E(-88, 30, 5, 8), '#8a5a24', ink, 2);
      legs(g, [-60, -42, 36, 54], 8, 92, 11, c, ink, '#8a6a40');
      P(g, 'M-82 -6 Q-84 -30 -60 -36 Q-40 -102 -12 -40 Q10 -102 40 -38 Q66 -34 70 -10 Q72 18 48 20 L-56 20 Q-82 18 -82 -6 Z', c, ink);
      P(g, 'M50 -28 Q76 -22 84 -54 Q90 -84 106 -86 L132 -76 Q140 -66 128 -62 L110 -62 Q102 -30 92 -6 Q80 16 56 12 Z', c, ink);
      P(g, 'M104 -84 L102 -96 L112 -86 Z', c, ink, 2);
      dot(g, 112, -76); dot(g, 132, -68, ink, 4);
      return 120;
    },
    cat: g => {
      const ink = '#8a4b16', c = '#f2a65a';
      line(g, 'M30 86 Q100 92 94 36 Q92 14 76 18', ink, 20); line(g, 'M30 86 Q100 92 94 36 Q92 14 76 18', c, 13);
      P(g, 'M-48 90 Q-62 20 -30 -12 L30 -12 Q62 20 48 90 Z', c, ink);
      P(g, E(0, 50, 22, 32), '#fde3c2', ink, 2);
      P(g, E(-20, 88, 15, 8), '#fde3c2', ink, 2.4); P(g, E(20, 88, 15, 8), '#fde3c2', ink, 2.4);
      for (const s of [-1, 1]) line(g, `M${s * 40} 20 l${-s * 10} 4 M${s * 44} 38 l${-s * 12} 4`, ink, 2.4);
      P(g, 'M-42 -58 L-38 -98 L-10 -76 Z', c, ink); P(g, 'M42 -58 L38 -98 L10 -76 Z', c, ink);
      P(g, 'M-34 -66 L-34 -86 L-20 -74 Z', '#f4b8c0', ink, 1.6); P(g, 'M34 -66 L34 -86 L20 -74 Z', '#f4b8c0', ink, 1.6);
      P(g, E(0, -40, 48, 40), c, ink);
      for (const x of [-8, 0, 8]) line(g, `M${x} -79 L${x * .8} -66`, ink, 2.4);
      P(g, E(-17, -46, 8, 10), '#a6d468', ink, 2); P(g, E(17, -46, 8, 10), '#a6d468', ink, 2);
      line(g, 'M-17 -52 L-17 -40', '#222', 4); line(g, 'M17 -52 L17 -40', '#222', 4);
      P(g, 'M-6 -30 L6 -30 L0 -23 Z', '#f08a9a', ink, 2);
      line(g, 'M0 -23 Q-5 -15 -12 -19 M0 -23 Q5 -15 12 -19', ink, 2);
      whiskers(g, 14, -26);
      return 120;
    },
    rabbit: g => {
      const ink = '#6a625a', c = '#d6d0c8';
      P(g, fluff(-72, 44, 14, 14, 7, 1.35), '#ffffff', ink, 2);
      P(g, 'M-66 84 Q-82 20 -40 -8 Q0 -32 30 -4 Q54 22 44 84 Z', c, ink);
      P(g, E(-34, 84, 36, 10), c, ink); P(g, E(38, 84, 15, 8), c, ink, 2.4);
      P(g, 'M24 -48 Q6 -126 24 -138 Q42 -128 42 -50 Z', c, ink); P(g, 'M28 -58 Q18 -118 25 -126 Q34 -116 36 -60 Z', '#f4b8c0', ink, 1.6);
      P(g, 'M44 -46 Q48 -124 68 -128 Q80 -116 58 -44 Z', c, ink);
      P(g, E(50, -24, 36, 30), c, ink);
      dot(g, 60, -32); dot(g, 84, -22, '#f08a9a', 9); whiskers(g, 88, -16, .8);
      return 120;
    },
    mouse: g => {
      const ink = '#5d5955', c = '#bdb8b3';
      line(g, 'M-74 44 Q-124 56 -122 14 Q-120 -16 -100 -8', '#d99aa2', 4);
      P(g, E(-30, 50, 14, 6), '#f4b8c0', ink, 2); P(g, E(40, 50, 12, 6), '#f4b8c0', ink, 2);
      P(g, 'M-80 46 Q-92 -30 0 -40 Q60 -40 90 28 Q96 46 78 48 Z', c, ink);
      P(g, E(18, -44, 28, 28), c, ink); P(g, E(18, -44, 17, 17), '#f4b8c0', ink, 2);
      dot(g, 56, -2, '#222', 8); dot(g, 92, 32, '#f08a9a', 10); whiskers(g, 92, 28, .8);
      return 80;
    },
  };
  const WILD = {
    // 19 Oct 2026: food chains and adaptation lessons
    fox: g => {
      const ink = '#7a3a10', c = '#e8742a', lt = '#fff3e6';
      P(g, smooth([[-80, -6], [-126, -40], [-150, -10], [-130, 22], [-96, 18]]), c, ink);                 // bushy tail
      P(g, smooth([[-138, -14], [-150, -10], [-136, 14], [-124, 6]]), lt, ink, 2);                         // white tip
      legs(g, [-62, -44, 30, 48], 6, 90, 12, '#5a2a10', '#3a1a08');
      P(g, 'M-86 -14 Q-86 -46 -50 -48 L30 -48 Q58 -46 60 -16 Q60 14 36 18 L-58 18 Q-86 16 -86 -14 Z', c, ink);
      F(g, 'M-80 6 Q-20 22 50 8 Q44 18 30 18 L-58 18 Q-76 16 -80 6 Z', '#c75a18', { opacity: .7 });
      P(g, 'M40 -40 L62 -96 L76 -48 Z', c, ink, 2.6); P(g, 'M66 -42 L92 -94 L98 -40 Z', c, ink, 2.6);       // ears
      P(g, 'M52 -46 L62 -82 L70 -50 Z', '#3a1a08', ink, 1.6);
      P(g, smooth([[40, -44], [96, -50], [132, -24], [104, -8], [56, -6]]), c, ink);                       // head and snout
      P(g, smooth([[70, -14], [104, -12], [130, -22], [116, -6], [80, -2]]), lt, ink, 2);
      dot(g, 132, -24, '#1a1008', 9); dot(g, 88, -32, '#1a1008', 8); dot(g, 86, -34, '#fff', 3);
      line(g, 'M-60 -42 Q-10 -54 40 -44', '#fff', 3, { opacity: .45 });
      return 120;
    },
    polarbear: g => {
      const ink = '#7a8899', c = '#f7f9fb', sh = '#d8e2ec';
      legs(g, [-70, -46, 36, 60], 10, 90, 22, c, ink);
      P(g, smooth([[-100, -6], [-90, -50], [-30, -64], [40, -56], [72, -30], [70, 14], [40, 24], [-60, 26], [-98, 18]]), c, ink);
      F(g, smooth([[-96, 10], [-40, 24], [40, 22], [68, 8], [40, 26], [-60, 28]]), sh);
      P(g, smooth([[56, -40], [96, -48], [128, -30], [130, -10], [96, -2], [64, -10]]), c, ink);             // head
      F(g, smooth([[70, -8], [100, -4], [126, -12], [100, 0]]), sh);
      P(g, E(74, -50, 9), c, ink, 2.2); dot(g, 74, -50, '#9aa6b2', 6);
      dot(g, 130, -22, '#1a1a1a', 11); dot(g, 102, -34, '#1a1a1a', 7); dot(g, 100, -36, '#fff', 2.5);
      for (const x of [-70, -46, 36, 60]) line(g, `M${x - 8} 90 l0 -6 M${x} 90 l0 -6 M${x + 8} 90 l0 -6`, ink, 1.6);
      line(g, 'M-80 -40 Q-20 -64 40 -52', '#fff', 4, { opacity: .8 });
      return 120;
    },
    deer: g => {
      const ink = '#6a3a14', c = '#c98a4a', lt = '#f6e6d0';
      legs(g, [-56, -40, 30, 46], -4, 100, 9, c, ink, '#3a2010');
      P(g, smooth([[-70, -10], [-60, -40], [0, -44], [44, -38], [56, -10], [40, 10], [-50, 12]]), c, ink);
      F(g, smooth([[-64, 4], [0, 10], [44, 4], [30, 12], [-50, 12]]), lt, { opacity: .8 });
      for (const [x, y] of [[-40, -26], [-20, -32], [0, -24], [-28, -14], [12, -34]]) dot(g, x, y, '#fff7ea', 6);
      P(g, 'M-70 -20 l-12 -6 l4 14 Z', lt, ink, 1.8);                                                    // tail
      P(g, smooth([[36, -34], [56, -84], [72, -86], [62, -40], [50, -24]]), c, ink);                       // neck
      P(g, smooth([[56, -86], [90, -92], [110, -76], [96, -66], [64, -70]]), c, ink);                      // head
      P(g, E(56, -98, 12, 6), c, ink, 2); dot(g, 108, -78, '#1a1008', 7); dot(g, 80, -84, '#1a1008', 6); dot(g, 79, -86, '#fff', 2);
      line(g, 'M70 -94 L64 -124 L52 -136 M64 -124 L76 -140 M66 -112 L56 -114', '#7a5230', 3.4);           // antlers
      line(g, 'M80 -94 L88 -126 L80 -142 M88 -126 L102 -136 M86 -114 L96 -112', '#7a5230', 3.4);
      return 126;
    },
    lion: g => {
      const ink = '#8a5a1c', c = '#e8b25a', m = '#c9772a';
      line(g, 'M-88 -30 Q-122 -10 -112 28', ink, 4); P(g, E(-112, 34, 8, 11), m, ink, 2);
      legs(g, [-74, -54, 34, 54], 8, 90, 16, c, ink);
      P(g, 'M-90 -18 Q-90 -52 -56 -52 L40 -52 Q70 -52 72 -20 Q72 20 44 22 L-58 22 Q-90 20 -90 -18 Z', c, ink);
      P(g, fluff(70, -48, 50, 50, 12, 1.22), m, ink);
      P(g, E(48, -76, 10), c, ink, 2.4); P(g, E(92, -76, 10), c, ink, 2.4);
      P(g, E(70, -46, 32, 32), c, ink);
      P(g, E(70, -32, 17, 12), '#fbe2b4', ink, 2.2);
      P(g, 'M63 -42 L77 -42 L70 -35 Z', '#6b3a1a', ink, 2);
      line(g, 'M70 -35 Q66 -26 60 -28 M70 -35 Q74 -26 80 -28', ink, 2);
      dot(g, 58, -54); dot(g, 82, -54);
      return 120;
    },
    tiger: g => {
      const ink = '#7a3a10', c = '#f08a2c', k = '#2a2018';
      line(g, 'M-88 -30 Q-122 -10 -112 30', ink, 7); line(g, 'M-88 -30 Q-122 -10 -112 30', c, 4);
      legs(g, [-74, -54, 34, 54], 8, 90, 16, c, ink);
      P(g, 'M-90 -18 Q-90 -52 -56 -52 L40 -52 Q70 -52 72 -20 Q72 20 44 22 L-58 22 Q-90 20 -90 -18 Z', c, ink);
      P(g, 'M-70 18 Q-10 30 50 18 Q40 22 -50 22 Z', '#fff6ea', ink, 1.5);
      for (const x of [-70, -46, -22, 2, 26]) line(g, `M${x} -51 Q${x + 6} -34 ${x - 2} -20`, k, 4);
      P(g, E(56, -76, 10), c, ink, 2.4); P(g, E(100, -76, 10), c, ink, 2.4);
      dot(g, 56, -76, k, 7); dot(g, 100, -76, k, 7);
      P(g, E(78, -46, 36, 32), c, ink);
      P(g, E(68, -32, 14, 11), '#fff6ea', ink, 1.8); P(g, E(88, -32, 14, 11), '#fff6ea', ink, 1.8);
      for (const x of [70, 78, 86]) line(g, `M${x} -77 L${x} -66`, k, 3);
      line(g, 'M44 -50 L54 -48 M44 -40 L52 -40 M112 -50 L102 -48 M112 -40 L104 -40', k, 3);
      P(g, 'M72 -42 L84 -42 L78 -35 Z', '#e07a7a', ink, 2);
      dot(g, 66, -54); dot(g, 90, -54);
      return 120;
    },
    elephant: g => {
      const ink = '#4f5966', c = '#a9b0ba';
      line(g, 'M-98 -20 Q-112 0 -106 22', ink, 3);
      legs(g, [-76, -48, 26, 52], 10, 92, 26, c, ink);
      for (const x of [-76, -48, 26, 52]) line(g, `M${x - 7} 90 q4 -5 8 0 M${x + 1} 90 q4 -5 8 0`, ink, 1.8);
      P(g, 'M-102 0 Q-106 -70 -30 -72 Q40 -76 60 -40 Q72 0 56 30 L-80 30 Q-102 26 -102 0 Z', c, ink);
      P(g, smooth([[54, -80], [22, -64], [16, -14], [38, 14], [66, -6]]), '#c3c9d2', ink);
      P(g, E(84, -36, 36, 38), c, ink);
      P(g, 'M96 -14 Q124 10 118 54 Q116 70 130 72 Q120 88 102 74 Q96 30 76 -2 Z', c, ink);
      line(g, 'M110 18 l12 -4 M114 36 l12 -2 M114 54 l12 0', ink, 1.8);
      P(g, 'M84 2 Q90 24 112 30 Q96 16 94 0 Z', '#fffaf0', ink, 2);
      dot(g, 96, -46);
      return 120;
    },
    giraffe: g => {
      const ink = '#8a5a14', c = '#f3c552', pc = '#c9772a';
      line(g, 'M-60 -30 Q-72 -8 -66 12', ink, 3); dot(g, -66, 16, pc, 8);
      legs(g, [-48, -32, 30, 46], -8, 92, 10, c, ink, '#5a3a1a');
      P(g, 'M-62 -28 Q-64 -54 -40 -54 L44 -62 Q64 -64 64 -40 L62 -14 Q60 0 42 0 L-46 0 Q-62 0 -62 -28 Z', c, ink);
      P(g, 'M32 -58 L66 -150 L88 -144 L62 -36 Z', c, ink);
      line(g, 'M66 -150 L34 -58', pc, 5, { opacity: .8 });
      for (const x of [76, 90]) { line(g, `M${x} -164 L${x - 2} -182`, ink, 3); dot(g, x - 2, -184, pc, 9); }
      P(g, 'M64 -150 Q70 -172 92 -170 L124 -152 Q130 -140 118 -136 L90 -136 Q70 -136 64 -150 Z', c, ink);
      dot(g, 90, -156); dot(g, 122, -146, ink, 4);
      for (const [x, y, r] of [[-40, -36, 9], [-16, -24, 8], [6, -40, 9], [30, -30, 8], [-48, -14, 6], [10, -14, 6], [50, -50, 6], [56, -76, 6], [64, -104, 6], [72, -128, 5], [46, -18, 6]])
        P(g, E(x, y, r, r * .8), pc, ink, 1.6);
      return 120;
    },
    bear: g => {
      const ink = '#4a2c12', c = '#8b5a2b';
      legs(g, [-70, -44, 30, 56], 0, 90, 24, c, ink);
      for (const x of [-70, -44, 30, 56]) line(g, `M${x - 6} 88 l0 -6 M${x} 88 l0 -6 M${x + 6} 88 l0 -6`, '#d9c2a0', 1.8);
      P(g, 'M-98 12 Q-102 -60 -30 -66 Q30 -72 60 -40 Q78 -10 66 24 L-80 24 Q-98 22 -98 12 Z', c, ink);
      P(g, E(66, -62, 11), c, ink, 2.4); P(g, E(96, -62, 11), c, ink, 2.4);
      P(g, E(82, -34, 34, 30), c, ink);
      P(g, E(106, -24, 18, 13), '#d9b48a', ink, 2.4);
      dot(g, 118, -28, '#2a1a0a', 10); dot(g, 84, -44);
      return 120;
    },
  };
  const BIRD = {
    bird: g => {
      const ink = '#1f4f8f', c = '#5b9bdc';
      line(g, 'M-110 64 Q0 52 110 66', '#6b4a2b', 7);
      line(g, 'M70 62 q14 -18 30 -16 M-70 62 q-6 -16 -22 -20', '#3f8a2a', 4);
      P(g, 'M-44 6 L-102 -16 L-96 18 Z', '#3d7cc9', ink);
      line(g, 'M-6 38 L-8 60 M10 38 L12 60', '#c97a10', 3);
      P(g, E(0, 0, 52, 42), c, ink);
      P(g, E(12, 16, 34, 22), '#fbe6c8', ink, 2);
      P(g, E(44, -30, 28, 26), c, ink);
      P(g, 'M-32 -10 Q8 -26 30 0 Q0 24 -38 10 Z', '#3d7cc9', ink, 2.4);
      P(g, 'M70 -36 L94 -28 L70 -20 Z', '#f2a531', '#8a5a14', 2);
      dot(g, 54, -36);
      return 100;
    },
    eagle: g => {
      const ink = '#3d230e', c = '#7a4a24';
      mirror(g, h => {
        P(h, 'M-18 -8 Q-70 -58 -138 -44 L-126 -32 L-136 -20 L-120 -12 L-128 0 L-108 2 L-110 16 L-90 12 Q-56 10 -18 22 Z', c, ink);
        for (const x of [-120, -100, -80]) line(h, `M${x} ${-40 + (x + 120) * .2} L${x + 30} 0`, '#4a2c12', 1.8);
      });
      P(g, 'M-16 46 L-26 82 L0 74 L26 82 L16 46 Z', '#f4f1e8', ink, 2.4);
      P(g, E(0, 10, 26, 44), '#6b3f1e', ink);
      line(g, 'M-10 52 L-14 64 M10 52 L14 64', '#e0a100', 4);
      P(g, E(0, -38, 20, 20), '#faf8f2', ink);
      P(g, 'M-7 -32 L7 -32 Q5 -20 0 -14 Q-5 -20 -7 -32 Z', '#f3c33b', '#8a5a14', 2);
      dot(g, -8, -42); dot(g, 8, -42);
      return 100;
    },
    owl: g => {
      const ink = '#4a2c12', c = '#9a6b40';
      line(g, 'M-100 76 Q0 68 100 78', '#6b4a2b', 7);
      P(g, 'M-46 -48 L-42 -88 L-18 -62 Z', c, ink); P(g, 'M46 -48 L42 -88 L18 -62 Z', c, ink);
      P(g, E(0, 4, 58, 72), c, ink);
      P(g, E(0, 26, 38, 44), '#ecd7b4', ink, 2);
      for (const [x, y] of [[-14, 10], [10, 10], [-2, 28], [-16, 44], [12, 44]]) line(g, `M${x - 5} ${y} l5 5 l5 -5`, '#9a6b40', 2);
      P(g, 'M-56 -2 Q-70 40 -38 68 Q-44 30 -42 -2 Z', '#7a5230', ink, 2.4); P(g, 'M56 -2 Q70 40 38 68 Q44 30 42 -2 Z', '#7a5230', ink, 2.4);
      P(g, E(-22, -34, 24), '#f4e6cc', ink, 2.4); P(g, E(22, -34, 24), '#f4e6cc', ink, 2.4);
      P(g, E(-22, -34, 13), '#ffd84a', ink, 2); P(g, E(22, -34, 13), '#ffd84a', ink, 2);
      dot(g, -22, -34, '#222', 13); dot(g, 22, -34, '#222', 13); dot(g, -19, -37, '#fff', 4); dot(g, 25, -37, '#fff', 4);
      P(g, 'M-7 -18 L7 -18 L0 -2 Z', '#f2a531', '#8a5a14', 2);
      line(g, 'M-20 74 l-4 6 M-14 74 l0 7 M14 74 l0 7 M20 74 l4 6', '#c97a10', 3);
      return 104;
    },
    penguin: g => {
      const ink = '#15191f', c = '#2d3440';
      P(g, E(-22, 92, 18, 7), '#f2a531', '#8a5a14', 2.4); P(g, E(22, 92, 18, 7), '#f2a531', '#8a5a14', 2.4);
      P(g, 'M-54 -6 Q-88 30 -72 60 Q-56 32 -48 12 Z', c, ink); P(g, 'M54 -6 Q88 30 72 60 Q56 32 48 12 Z', c, ink);
      P(g, E(0, 6, 56, 84), c, ink);
      P(g, 'M0 -50 Q-22 -62 -28 -40 Q-44 10 -36 50 Q-20 84 0 84 Q20 84 36 50 Q44 10 28 -40 Q22 -62 0 -50 Z', '#fbfbf8', ink, 2);
      dot(g, -16, -54, '#fff', 12); dot(g, 16, -54, '#fff', 12); dot(g, -16, -54, '#111', 6); dot(g, 16, -54, '#111', 6);
      P(g, 'M-12 -40 L12 -40 L0 -24 Z', '#f2a531', '#8a5a14', 2);
      return 112;
    },
  };
  const SEA = {
    // 19 Oct 2026: invertebrates for classification lessons
    jellyfish: g => {
      const ink = '#7a4a9a', c = '#e6c8f4';
      for (const x of [-40, -20, 0, 20, 40]) line(g, `M${x} 10 q-10 30 0 56 q10 26 -4 56`, '#b58ad0', 2.6);
      for (const x of [-14, 10]) P(g, `M${x - 6} 10 q-8 40 4 80 q4 10 8 0 q-6 -40 6 -80 Z`, '#d6a8ec', ink, 1.6);
      P(g, 'M-62 12 Q-64 -70 0 -72 Q64 -70 62 12 Q30 22 0 14 Q-30 22 -62 12 Z', c, ink);
      F(g, 'M-50 -4 Q0 -40 50 -4 Q30 4 0 0 Q-30 4 -50 -4 Z', '#cfa0ea', { opacity: .8 });
      line(g, 'M-40 -40 Q-20 -62 10 -64', '#fff', 4, { opacity: .7 });
      return 140;
    },
    starfish: g => {
      const ink = '#a03a1a', c = '#f07a4a';
      P(g, star(0, 0, 100, 40), c, ink, 3);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        for (let r = 20; r < 90; r += 16) dot(g, r * Math.cos(a), r * Math.sin(a), '#ffd0b4', 7); }
      P(g, E(0, 0, 10), '#d0582a', ink, 2);
      return 110;
    },
    crab: g => {
      const ink = '#8a1f12', c = '#e0452e';
      for (const s of [-1, 1]) for (const [y, e] of [[6, 40], [18, 50], [30, 56]]) line(g, `M${s * 40} ${y} L${s * 74} ${y + 20} L${s * 84} ${y + e}`, ink, 4);
      for (const s of [-1, 1]) {
        line(g, `M${s * 46} -14 L${s * 70} -44`, ink, 5);
        P(g, `M${s * 62} -46 Q${s * 70} -92 ${s * 104} -76 L${s * 84} -62 L${s * 102} -52 Q${s * 84} -36 ${s * 62} -46 Z`, c, ink, 2.6);  // claw
        line(g, `M${s * 14} -30 L${s * 18} -56`, ink, 3); P(g, E(s * 18, -60, 7), '#fff', ink, 2); dot(g, s * 18, -60, '#111', 5);
      }
      P(g, 'M-58 -4 Q-56 -40 0 -42 Q56 -40 58 -4 Q50 28 0 30 Q-50 28 -58 -4 Z', c, ink);
      F(g, 'M-52 6 Q0 34 52 6 Q40 28 0 30 Q-40 28 -52 6 Z', '#b52e1c', { opacity: .6 });
      line(g, 'M-30 -30 Q0 -40 26 -32', '#fff', 3, { opacity: .5 });
      line(g, 'M-10 -2 Q0 4 10 -2', ink, 2.4);
      return 100;
    },
    octopus: g => {
      const ink = '#7a2a4a', c = '#e07aa0';
      for (let i = 0; i < 8; i++) { const x = -70 + i * 20, b = i % 2 ? 1 : -1;
        line(g, `M${x * .6} 20 Q${x} 60 ${x + b * 20} 80 Q${x + b * 40} 96 ${x + b * 24} 110`, ink, 15);
        line(g, `M${x * .6} 20 Q${x} 60 ${x + b * 20} 80 Q${x + b * 40} 96 ${x + b * 24} 110`, c, 10);
        for (const t of [.45, .7]) dot(g, x * (1 - t) * .6 + (x + b * 20) * t, 20 + 60 * t, '#f6c4d6', 5); }
      P(g, smooth([[0, -100], [52, -80], [62, -20], [40, 26], [0, 32], [-40, 26], [-62, -20], [-52, -80]]), c, ink);
      F(g, smooth([[-50, 0], [0, 28], [50, 0], [40, 26], [0, 32], [-40, 26]]), '#c75a84', { opacity: .6 });
      for (const s of [-1, 1]) { P(g, E(s * 22, -14, 12, 14), '#fff', ink, 2); dot(g, s * 22, -12, '#111', 8); dot(g, s * 20, -16, '#fff', 3); }
      for (const [x, y] of [[-20, -66], [16, -74], [30, -50], [-34, -44]]) dot(g, x, y, '#c75a84', 8);
      line(g, 'M-30 -82 Q0 -98 30 -84', '#fff', 4, { opacity: .55 });
      return 130;
    },
    fish: g => {
      const ink = '#a0560f', c = '#f4a531';
      P(g, 'M-72 0 L-118 -40 L-108 0 L-118 40 Z', '#f08a2c', ink);
      P(g, 'M-24 -40 Q6 -76 40 -38 Z', '#f08a2c', ink, 2.4);
      P(g, 'M-80 0 Q-30 -62 40 -42 Q86 -26 96 0 Q86 26 40 42 Q-30 62 -80 0 Z', c, ink);
      P(g, 'M10 20 Q20 44 -4 44 Z', '#f08a2c', ink, 2);
      for (const [x, y] of [[-40, -14], [-40, 14], [-14, -24], [-14, 2], [-14, 26], [12, -12], [12, 14]]) line(g, `M${x} ${y - 9} q9 9 0 18`, '#c9772a', 2);
      line(g, 'M42 -28 Q30 0 42 28', ink, 2.4);
      P(g, E(64, -8, 10), '#fff', ink, 2); dot(g, 66, -8, '#222', 9);
      line(g, 'M90 8 q-6 4 -12 2', ink, 2.4);
      for (const [x, y, r] of [[116, -30, 7], [128, -56, 5], [120, -76, 4]]) line(g, E(x, y, r), INK.sky, 2);
      return 90;
    },
    shark: g => {
      const ink = '#46505c', c = '#8e9aa8';
      P(g, 'M-102 0 L-140 -54 L-124 0 L-136 36 Z', c, ink);
      P(g, 'M-12 -32 L14 -86 L42 -32 Z', c, ink);
      P(g, 'M-110 0 Q-60 -36 30 -34 Q90 -30 126 4 Q90 28 30 30 Q-60 32 -110 0 Z', c, ink);
      P(g, 'M-60 12 Q30 34 116 10 Q90 28 30 30 Q-40 30 -60 12 Z', '#f4f6f8', ink, 1.6);
      P(g, 'M18 18 L-8 58 L42 24 Z', c, ink, 2.4);
      for (const x of [64, 72, 80]) line(g, `M${x} -12 q-4 10 0 20`, ink, 2);
      dot(g, 98, -6); line(g, 'M102 14 Q112 18 120 10', ink, 2.4);
      return 80;
    },
    whale: g => {
      const ink = '#1f4f8f', c = '#5a8fcf';
      for (const d of ['M64 -66 Q58 -92 40 -100', 'M64 -66 Q70 -94 88 -100', 'M64 -66 L64 -108']) line(g, d, INK.sky, 3);
      P(g, 'M-86 -20 Q-110 -60 -142 -66 Q-120 -46 -112 -40 Q-132 -30 -136 -6 Q-112 -14 -86 -18 Z', c, ink);
      P(g, 'M-90 -18 Q-60 -64 20 -64 Q112 -62 120 10 Q112 50 30 52 Q-40 52 -90 -18 Z', c, ink);
      P(g, 'M6 28 Q60 50 116 22 Q104 50 30 52 Q12 48 6 28 Z', '#d2e5f6', ink, 1.8);
      for (const x of [40, 60, 80]) line(g, `M${x} ${36 + (x - 40) * .1} l${x / 20} 12`, '#7fa7d6', 1.6);
      P(g, 'M20 30 Q4 60 -20 62 Q0 44 6 26 Z', c, ink, 2.4);
      dot(g, 84, 6); line(g, 'M96 24 Q108 26 116 18', ink, 2.4);
      return 90;
    },
    dolphin: g => {
      const ink = '#3f5f80', c = '#86aed2';
      P(g, 'M-100 40 L-138 28 Q-124 44 -132 66 Z', c, ink);
      P(g, 'M-2 -40 Q8 -78 34 -82 Q22 -60 34 -38 Z', c, ink);
      P(g, 'M-110 34 Q-60 -48 30 -42 Q70 -38 92 -22 L126 -16 Q128 -6 112 -4 L86 -2 Q60 12 28 12 Q-50 8 -100 48 Z', c, ink);
      P(g, 'M-60 18 Q0 4 60 4 Q40 12 28 12 Q-30 10 -60 18 Z', '#eef4f9', ink, 1.6);
      P(g, 'M30 6 Q20 34 -4 40 Q12 22 14 6 Z', c, ink, 2.4);
      dot(g, 72, -22); line(g, 'M100 -8 Q108 -6 116 -10', ink, 2);
      return 90;
    },
    turtle: g => {
      const ink = '#2c5a1a', c = '#b9d98a';
      for (const [x, y] of [[-64, 36], [-28, 40], [40, 40], [74, 36]]) P(g, E(x, y, 15, 12), c, ink, 2.4);
      P(g, 'M-90 16 L-104 24 L-90 26 Z', c, ink, 2);
      P(g, E(108, 0, 24, 19), c, ink); dot(g, 116, -4); line(g, 'M118 8 q6 2 10 -2', ink, 2);
      P(g, 'M-92 20 L92 20 Q94 34 80 34 L-80 34 Q-94 34 -92 20 Z', '#a8cf6a', ink);
      P(g, 'M-84 22 Q-80 -70 0 -72 Q80 -70 84 22 Z', '#6fa64a', ink);
      line(g, 'M-26 -46 L26 -46 L40 -12 L18 20 M-26 -46 L-40 -12 L-18 20 M-40 -12 L40 -12 M-26 -46 L-46 -60 M26 -46 L46 -60 M-40 -12 L-80 -10 M40 -12 L80 -10', '#2c5a1a', 2.4);
      return 80;
    },
  };
  const CRITTER = {
    snake: g => {
      const ink = '#2c5a1a', c = '#7cc04f';
      const pts = Array.from({ length: 41 }, (_, i) => { const u = i / 40; return [-130 + 210 * u, 46 * Math.sin(u * Math.PI * 2.2 + Math.PI)]; });
      const L = [], Rt = [];
      pts.forEach((p, i) => {
        const q = pts[Math.min(i + 1, 40)], r = pts[Math.max(i - 1, 0)], dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy), w = (3 + 22 * Math.min(1, i / 28)) / 2;
        L.push([p[0] - dy / l * w, p[1] + dx / l * w]); Rt.push([p[0] + dy / l * w, p[1] - dx / l * w]);
      });
      const end = pts[40];
      line(g, `M${end[0] + 26} ${end[1] - 4} l14 0 l6 -5 M${end[0] + 40} ${end[1] - 4} l6 4`, '#e04b3a', 2.4);
      P(g, 'M' + [...L, ...Rt.reverse()].map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + ' Z', c, ink);
      P(g, E(end[0] + 10, end[1] - 4, 22, 16), c, ink);
      for (let i = 8; i < 40; i += 5) dot(g, pts[i][0], pts[i][1], '#3f8a2a', 4 + 6 * Math.min(1, i / 28));
      dot(g, end[0] + 16, end[1] - 10);
      return 80;
    },
    butterfly: g => {
      const ink = '#5a2a10';
      mirror(g, h => {
        P(h, smooth([[-4, -6], [-34, -72], [-92, -82], [-104, -30], [-60, 0]]), '#f4a531', ink);
        P(h, smooth([[-4, 4], [-60, 8], [-84, 50], [-44, 72], [-8, 30]]), '#7fb7ea', '#1f4f8f');
        dot(h, -64, -44, '#5a2a10', 14); dot(h, -84, -30, '#fff', 8); dot(h, -46, 40, '#fff', 9);
        line(h, 'M-3 -40 Q-14 -76 -30 -84', '#3a2f28', 2.4); dot(h, -31, -86, '#3a2f28', 7);
      });
      P(g, E(0, 0, 8, 44), '#3a2f28', '#1d1712', 2);
      return 90;
    },
    bee: g => {
      const ink = '#3a2f28';
      P(g, 'M-52 6 L-76 12 L-52 18 Z', '#3a2f28', ink, 2);
      P(g, smooth([[-34, -18], [-6, -84], [16, -64], [6, -22]]), '#e6f2fb', '#7a8899', 2.4);
      P(g, E(0, 10, 56, 38), '#ffd84a', ink);
      for (const x of [-26, -2, 22]) line(g, `M${x} -26 Q${x - 7} 10 ${x} 46`, '#3a2f28', 11);
      P(g, smooth([[0, -22], [30, -86], [52, -60], [24, -18]]), '#e6f2fb', '#7a8899', 2.4);
      P(g, E(60, 4, 22, 22), '#3a2f28', ink);
      dot(g, 68, -2, '#fff', 8);
      line(g, 'M62 -16 Q66 -36 80 -42 M54 -16 Q52 -36 62 -48', ink, 2.4);
      return 70;
    },
    ant: g => {
      const ink = '#3d1a08', c = '#8a3f1a';
      for (const [x, s] of [[-14, -1], [0, 0], [14, 1]]) {
        line(g, `M${x} 4 L${x - 10 + s * 18} -28 L${x - 18 + s * 30} -36`, ink, 3.4);
        line(g, `M${x} 8 L${x - 6 + s * 16} 34 L${x - 12 + s * 28} 52`, ink, 3.4);
      }
      P(g, E(-66, 8, 36, 26), c, ink); P(g, E(-6, 4, 18, 13), c, ink); P(g, E(42, -6, 24, 20), c, ink);
      dot(g, 50, -12, '#fff', 6);
      line(g, 'M54 -22 Q66 -50 86 -52 M46 -24 Q48 -52 62 -62', ink, 2.6);
      return 70;
    },
    spider: g => {
      const ink = '#2a2424', c = '#5a4f4f';
      line(g, 'M0 -120 L0 -46', '#9a9a9a', 1.8);
      for (const s of [-1, 1]) for (const [a, b, e] of [[-34, -34, -60], [-14, -10, -24], [6, 14, 30], [22, 30, 66]])
        line(g, `M${s * 14} ${a / 2} Q${s * 50} ${b - 30} ${s * 74} ${b} L${s * 92} ${e}`, ink, 3.4);
      P(g, E(0, 12, 34, 30), c, ink);
      P(g, E(0, -30, 20, 17), c, ink);
      dot(g, -7, -32, '#fff', 9); dot(g, 7, -32, '#fff', 9); dot(g, -7, -32, '#111', 4); dot(g, 7, -32, '#111', 4);
      line(g, 'M-6 -20 Q0 -15 6 -20', '#fff', 2);
      return 70;
    },
    // detailed (19 Oct 2026, founder: "level up"): shading, highlights, real anatomy
    frog: g => {
      const ink = '#1f4a17', c = '#5fae3a', dk = '#3f8a2a', belly = '#e6f0b8';
      const toes = (x, y, dir, n = 4) => { for (let i = 0; i < n; i++) { const a = dir > 0 ? -30 + i * 22 : 210 - i * 22, r = 40,
        ex = x + r * Math.cos(a * Math.PI / 180), ey = y + r * Math.sin(a * Math.PI / 180) * .5 + 6;
        line(g, `M${x} ${y} Q${(x + ex) / 2} ${(y + ey) / 2 + 4} ${ex.toFixed(1)} ${ey.toFixed(1)}`, ink, 4.2); P(g, E(ex, ey, 4.6), '#8cc63f', ink, 1.6); } };
      // back legs: big folded thighs, shins, long webbed feet
      for (const s of [-1, 1]) {
        F(g, `M${s * 70} 92 L${s * 104} 72 Q${s * 112} 92 ${s * 108} 118 L${s * 84} 110 Z`, '#a8d65a', { opacity: .75 });   // web
        toes(s * 70, 92, s, 4);
        P(g, smooth([[s * 30, 40], [s * 76, 14], [s * 104, 46], [s * 92, 84], [s * 46, 88]]), c, ink);
        F(g, smooth([[s * 50, 70], [s * 90, 58], [s * 92, 82], [s * 54, 88]]), dk, { opacity: .55 });
        for (const [x, y, r] of [[78, 40, 8], [94, 62, 6], [62, 60, 5]]) P(g, E(s * x, y, r, r * .8), '#2f6e22', '#2f6e22', 1);
        line(g, `M${s * 46} 22 Q${s * 76} 10 ${s * 96} 34`, '#fff', 3, { opacity: .45 });
      }
      // body and belly
      P(g, smooth([[0, -28], [52, -18], [70, 30], [52, 82], [0, 92], [-52, 82], [-70, 30], [-52, -18]]), c, ink, 3.2);
      F(g, smooth([[-56, 40], [-40, 78], [0, 88], [40, 78], [56, 40], [30, 62], [0, 66], [-30, 62]]), dk, { opacity: .5 });
      P(g, smooth([[0, 4], [32, 14], [40, 48], [26, 78], [0, 84], [-26, 78], [-40, 48], [-32, 14]]), belly, '#9ab060', 2);
      for (const y of [30, 46, 62]) line(g, `M-18 ${y} Q0 ${y + 6} 18 ${y}`, '#c2d48a', 1.8);
      // front legs and four splayed fingers
      for (const s of [-1, 1]) {
        P(g, `M${s * 34} 30 Q${s * 46} 62 ${s * 40} 88 L${s * 28} 88 Q${s * 30} 62 ${s * 22} 38 Z`, c, ink, 2.6);
        for (const dx of [-12, -4, 4, 12]) { line(g, `M${s * 34} 88 L${s * 34 + dx * 1.1} 100`, ink, 3.2); dot(g, s * 34 + dx * 1.1, 101, '#8cc63f', 7); }
      }
      // head: wide, with eye bumps, ear drums, nostrils, mouth
      P(g, smooth([[0, -86], [44, -84], [84, -54], [80, -26], [40, -10], [0, -6], [-40, -10], [-80, -26], [-84, -54], [-44, -84]]), c, ink, 3.2);
      F(g, smooth([[-76, -30], [-40, -16], [0, -12], [40, -16], [76, -30], [40, -6], [0, -2], [-40, -6]]), dk, { opacity: .5 });
      for (const s of [-1, 1]) {
        P(g, E(s * 42, -84, 28, 24), c, ink, 3);                                      // eye bump
        P(g, E(s * 42, -86, 19, 17), '#e8c33a', '#6a4a10', 2);                        // golden iris
        mk('ellipse', { cx: s * 42, cy: -86, rx: 12, ry: 5.5, fill: '#111', class: 'fillable' }, g);   // horizontal pupil (no rough edge)
        dot(g, s * 42 - 6, -92, '#fff', 7); dot(g, s * 42 + 6, -80, '#fff', 3);
        P(g, E(s * 70, -50, 11, 10), '#8a6a2a', '#5a3a10', 2); P(g, E(s * 70, -50, 5, 4.5), '#b08a40', '#b08a40', 1);   // ear drum
        dot(g, s * 10, -60, '#1f4a17', 5);                                            // nostril
        P(g, E(s * 62, -100, 3, 2), '#2f6e22', '#2f6e22', 1);
      }
      line(g, 'M-66 -34 Q-30 -12 0 -16 Q30 -12 66 -34', ink, 3.2);                   // mouth
      line(g, 'M-58 -32 l-6 -6 M58 -32 l6 -6', ink, 2.4);
      for (const [x, y, r] of [[-20, -48, 6], [24, -44, 5], [0, -66, 4]]) P(g, E(x, y, r, r * .8), '#2f6e22', '#2f6e22', 1);
      line(g, 'M-30 -74 Q-10 -80 12 -78', '#fff', 4, { opacity: .5 });                 // sheen
      line(g, 'M-50 -6 Q-62 20 -60 44', '#fff', 3, { opacity: .35 });
      return 118;
    },
    grasshopper: g => {
      const ink = '#2b4f14', c = '#86c13c', lt = '#d3ea8c', dk = '#5c9128';
      // far legs, behind the body
      line(g, 'M40 14 L34 48 L42 62 M58 14 L66 46 L60 62', dk, 3);
      line(g, 'M10 6 L-50 -40 L-80 40', dk, 4);
      // abdomen: segments, pale underside, spiracles, tip
      P(g, smooth([[30, -16], [-30, -20], [-96, -14], [-122, 0], [-100, 16], [-30, 22], [30, 18]]), c, ink, 3);
      F(g, smooth([[24, 12], [-30, 16], [-100, 10], [-112, 6], [-96, 18], [-30, 22], [26, 18]]), lt);
      for (let x = -100; x <= 10; x += 15) line(g, `M${x} -14 Q${x - 4} 2 ${x} 18`, dk, 1.6);
      for (let x = -92; x <= 10; x += 15) dot(g, x, -2, '#4e7f1e', 3.4);
      P(g, 'M-120 -2 L-136 -6 L-128 6 Z', '#6ea32f', ink, 2);
      // forewing: narrow, leathery brown-green, along the back; the abdomen's tip shows beyond it
      P(g, smooth([[44, -26], [-20, -34], [-96, -30], [-108, -22], [-90, -16], [-20, -18]]), '#a8b04a', '#4e5a1a', 2.4);
      line(g, 'M40 -26 Q-30 -30 -100 -24 M-10 -32 l-4 12 M-40 -32 l-4 12 M-70 -30 l-4 12', '#6e7a28', 1.4);
      // thorax: saddle-shaped pronotum, dark side band, keel highlight
      P(g, smooth([[30, -30], [66, -36], [80, -8], [72, 22], [30, 20]]), c, ink, 3);
      F(g, smooth([[34, -14], [72, -20], [76, -6], [36, 0]]), dk, { opacity: .7 });
      line(g, 'M34 -30 Q52 -38 70 -34', '#fff', 3, { opacity: .5 });
      // near front and middle legs, jointed, with little feet
      line(g, 'M52 18 L44 46 L52 64 L62 66 M68 16 L82 42 L80 62 L92 64', ink, 3.2);
      // near hind leg: a big drumstick thigh up to the knee, herringbone muscle, spiny shin down to the foot
      P(g, smooth([[30, 8], [20, -14], [-20, -42], [-58, -66], [-70, -60], [-50, -32], [-6, 6]]), '#b5dc5a', ink, 3);
      for (let i = 0; i < 6; i++) { const x = 8 - i * 11, y = -10 - i * 8.5; line(g, `M${x + 2} ${y - 7} L${x - 5} ${y + 1} L${x + 4} ${y + 7}`, '#5c9128', 1.6); }
      line(g, 'M-24 -36 Q-46 -54 -60 -62', '#fff', 3, { opacity: .45 });
      line(g, 'M-64 -62 L-92 40', ink, 4);
      for (let i = 1; i < 7; i++) { const t = i / 7, x = -64 - 28 * t, y = -62 + 102 * t; line(g, `M${x} ${y} l7 2`, ink, 1.8); }
      line(g, 'M-92 40 L-112 44 M-100 42 l-3 6 M-108 44 l-3 6', ink, 2.6);
      // head: big, compound eye, mouthparts, segmented antennae
      P(g, smooth([[70, -34], [100, -38], [116, -12], [112, 22], [92, 34], [74, 18]]), c, ink, 3);
      F(g, smooth([[78, 14], [96, 26], [110, 16], [96, 32]]), dk, { opacity: .6 });
      P(g, E(98, -16, 12, 14), '#7a4a1e', '#3a220c', 2); dot(g, 94, -22, '#fff', 5);
      P(g, 'M104 24 L116 30 L106 36 Z', '#6a4a20', ink, 1.8);
      line(g, 'M108 14 q8 6 6 16', ink, 2);
      line(g, 'M92 -34 Q84 -84 52 -110 M100 -36 Q102 -88 82 -120', ink, 2.2);
      for (const [x, y] of [[88, -56], [78, -78], [66, -96], [100, -60], [96, -84], [88, -104]]) dot(g, x, y, ink, 4);
      line(g, 'M82 -30 Q96 -36 108 -28', '#fff', 3, { opacity: .5 });
      return 92;
    },
    // food chains and life cycles (19 Oct 2026): the animals and stages a school lesson needs
    lizard: g => {
      const ink = '#2c5a1a', c = '#79b94a';
      for (const [x, s] of [[-30, -1], [40, 1]]) {
        line(g, `M${x} 6 L${x - 18} -22 L${x - 30} -26 M${x - 18} -22 L${x - 22} -36`, ink, 3.4);
        line(g, `M${x} 20 L${x - 14} 46 L${x - 26} 50 M${x - 14} 46 L${x - 12} 58`, ink, 3.4);
      }
      P(g, smooth([[-56, 8], [-110, 20], [-150, 2], [-120, 34], [-56, 30], [0, 32], [60, 26], [96, 22], [118, 12], [100, -4], [60, -6], [0, -2]]), c, ink);
      for (const [x, y] of [[-20, 12], [10, 10], [40, 10], [-46, 16]]) dot(g, x, y, '#4e8f2a', 7);
      P(g, E(88, 2, 12, 9), '#fff', ink, 1.6); dot(g, 90, 2, '#111', 6);
      line(g, 'M108 14 l12 0', '#c0392b', 2);
      return 96;
    },
    caterpillar: g => {
      const ink = '#2d5a17';
      line(g, 'M-110 40 Q0 52 110 40', '#5a8f2a', 4);
      for (let i = 0; i < 7; i++) { const x = -84 + i * 26, y = 6 - 10 * Math.sin(i / 6 * Math.PI);
        line(g, `M${x - 4} ${y + 18} l-2 14 M${x + 6} ${y + 18} l2 14`, ink, 2.6);
        P(g, E(x, y, 18, 20), i % 2 ? '#8cc63f' : '#a8d65a', ink, 2.4); dot(g, x, y - 6, '#f3c33b', 6); }
      P(g, E(100, -8, 22, 22), '#e2873a', '#7a3a10');
      dot(g, 108, -12, '#111', 7); dot(g, 110, -14, '#fff', 3);
      line(g, 'M94 -28 Q90 -46 80 -52 M106 -28 Q112 -46 120 -50', '#7a3a10', 2.4);
      return 70;
    },
    chrysalis: g => {
      const ink = '#3e5a1f';
      line(g, 'M-90 -96 L90 -96', '#7a5230', 7);
      line(g, 'M0 -96 L0 -78', '#5a3a1a', 3);
      P(g, smooth([[0, -80], [24, -52], [34, 0], [20, 54], [0, 86], [-20, 54], [-34, 0], [-24, -52]]), '#9cc85a', ink);
      for (const y of [-30, -6, 18, 42]) line(g, `M${-30 + Math.abs(y) / 6} ${y} Q0 ${y + 10} ${30 - Math.abs(y) / 6} ${y}`, ink, 1.8);
      for (const [x, y] of [[-14, -56], [12, -56]]) dot(g, x, y, '#e9c23b', 6);
      line(g, 'M-16 -64 Q-26 -20 -18 30', '#fff', 4, { opacity: .5 });
      return 110;
    },
    larva: g => {                                                     // a bee or beetle grub, curled like a C
      const ink = '#8a7660';
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + i * 0.17), r = 50;
        P(g, E(r * Math.cos(a), -r * Math.sin(a) + 10, 26 - i * .8, 22 - i * .6), i % 2 ? '#fbf3e1' : '#f3e6c8', ink, 2.2); }
      dot(g, 44, -16, '#3a2f28', 6);
      return 110;
    },
    pupa: g => {                                                      // a bee pupa: the adult's shape, pale, wings folded
      const ink = '#8a7660', c = '#f3e6c8';
      for (const x of [-10, 10, 30]) line(g, `M${x} 14 L${x - 6} 40 L${x - 16} 48`, ink, 3);
      P(g, smooth([[-100, 4], [-80, -20], [-40, -26], [-30, 0], [-44, 26], [-84, 26]]), '#efdcb6', ink);
      for (const x of [-84, -66, -50]) line(g, `M${x} -18 q-6 22 0 40`, ink, 1.8);
      P(g, E(6, 0, 34, 26), c, ink);
      P(g, smooth([[-20, -16], [20, -18], [40, -6], [10, 6]]), '#fbf3e1', ink, 1.8);
      P(g, E(58, -4, 22, 24), c, ink);
      P(g, E(66, -10, 9, 12), '#c9a38a', ink, 1.8);
      line(g, 'M64 -26 Q70 -40 84 -44', ink, 2);
      return 70;
    },
    eggs: g => {                                                      // tiny insect eggs laid on a leaf
      P(g, smooth([[-110, 30], [-40, -40], [60, -50], [116, -20], [60, 40], [-30, 52]]), '#7cc04f', '#2f6a1e');
      line(g, 'M-104 30 Q0 0 112 -22', '#2f6a1e', 2.4);
      for (const [x, y] of [[-30, -6], [-8, -14], [14, -18], [-20, 14], [2, 6], [24, 0], [-42, 16], [36, -14], [12, 22]])
        { P(g, E(x, y, 8, 10), '#fff8dc', '#b59a5a', 1.6); line(g, `M${x - 3} ${y - 4} l2 -2`, '#fff', 2); }
      return 70;
    },
    tadpole: g => {
      const ink = '#1e2a20';
      P(g, 'M-20 0 C-60 -26 -90 18 -130 -6 C-96 30 -60 14 -20 10 Z', '#4a5a48', ink, 2.4);
      P(g, E(10, 4, 36, 28), '#4a5a48', ink);
      dot(g, 26, -6, '#fff', 9); dot(g, 28, -6, '#111', 5);
      line(g, 'M-6 -12 q8 -6 16 -4', '#8a9a88', 3);
      return 66;
    },
    spawn: g => {                                                     // frogspawn: eggs in clear jelly
      for (const [x, y] of [[-60, 0], [-30, -24], [0, 0], [30, -24], [60, 0], [-30, 24], [30, 24], [0, -46], [0, 46], [-60, -44], [60, 44]])
        { P(g, E(x, y, 20), '#e6f4fb', '#7aa8c4', 2); dot(g, x, y, '#1e2a20', 12); line(g, `M${x - 10} ${y - 8} l4 -3`, '#fff', 2.4); }
      return 80;
    },
    worm: g => {                                                      // earthworm
      const ink = '#9a4a52';
      const pts = Array.from({ length: 31 }, (_, i) => { const u = i / 30; return [-120 + 240 * u, 26 * Math.sin(u * Math.PI * 2.4)]; });
      line(g, smooth(pts, false), ink, 30); line(g, smooth(pts, false), '#e9a2a8', 24);
      for (let i = 3; i < 30; i += 2) { const [x, y] = pts[i]; line(g, `M${x} ${y - 10} l0 20`, '#c46a74', 2); }
      P(g, E(pts[19][0], pts[19][1], 16, 14), '#d98088', ink, 2);
      return 50;
    },
    snail: g => {
      const ink = '#5a3a1a';
      P(g, 'M-110 50 Q-80 30 -40 34 L70 34 Q100 30 110 4 Q118 -14 106 -20 Q96 -10 90 6 Q80 22 60 22 L-60 22 Q-100 26 -110 50 Z', '#d9c2a0', '#7a6040');
      line(g, 'M100 -16 L106 -48 M110 -14 L122 -42', '#7a6040', 2.6); dot(g, 106, -50, '#3a2f28', 7); dot(g, 122, -44, '#3a2f28', 7);
      P(g, E(-4, -26, 62, 56), '#e2a54a', ink);
      line(g, 'M-4 -26 m0 -5 a5 5 0 1 1 -5 5 a11 11 0 1 1 11 11 a19 19 0 1 1 -19 -19 a29 29 0 1 1 29 29 a40 40 0 1 1 -40 -36', ink, 3);
      return 84;
    },
  };


  // ---------- the detail pass (founder, 19 Oct 2026: "level up" to frog and grasshopper's level) ----------
  // On top of each older drawing: a shadow on its lower side, a white highlight along its top, an eye with a coloured
  // iris and a shine, and the details that make it real (mane, stripes, feathers, veins, scales). Keyed "what:name".
  const sh = (g, d, c) => F(g, d, c, { opacity: .75 });
  const hl = (g, d, w = 4) => line(g, d, '#fff', w, { opacity: .8 });
  const eye = (g, x, y, r, iris) => { P(g, E(x, y, r), iris, '#1a1008', 1.4); dot(g, x, y, '#111', r * .9); dot(g, x - r * .35, y - r * .35, '#fff', r * .45); };
  const fur = (g, pts, c, len = 8) => line(g, pts.map(([x, y]) => `M${x} ${y} q${len * .3} ${-len * .5} ${len * .1} ${-len}`).join(' '), c, 1.6);
  const DETAIL = {
    'animal:cow': g => { sh(g, 'M-90 22 Q-10 40 78 22 L78 30 Q78 42 60 42 L-72 42 Q-90 42 -90 30 Z', '#b9b3a6'); hl(g, 'M-70 -54 Q0 -60 60 -54');
      eye(g, 88, -60, 5, '#5a3a20'); eye(g, 106, -60, 5, '#5a3a20'); line(g, 'M90 -36 q7 4 14 0', '#7a3b45', 1.6); fur(g, [[90, -84], [97, -86], [104, -84]], '#8a8478', 7); },
    'animal:horse': g => { sh(g, 'M-86 4 Q0 30 76 2 Q74 22 50 26 L-56 26 Q-84 24 -86 4 Z', '#7a4a26'); hl(g, 'M-60 -54 Q0 -62 40 -54');
      eye(g, 104, -98, 5, '#3a2010'); line(g, 'M50 -60 q6 -6 4 -14 M58 -78 q6 -6 4 -14 M68 -96 q6 -6 4 -14 M-100 -10 q-6 10 -2 24', '#3a2510', 1.8);
      line(g, 'M-20 -40 q20 10 40 0', '#8a5530', 1.6, { opacity: .6 }); },
    'animal:sheep': g => { sh(g, E(-6, 26, 68, 16), '#cfc6b4'); hl(g, 'M-60 -46 Q-10 -62 40 -50'); eye(g, 92, -28, 5, '#d9b44a');
      for (const [x, y] of [[-60, 0], [-20, -30], [20, 10], [50, -20], [-40, 30], [10, 30]]) line(g, `M${x} ${y} q4 -6 8 0 q4 6 8 0`, '#d8d0c0', 1.6); },
    'animal:goat': g => { sh(g, 'M-82 0 Q-10 24 66 -2 Q66 14 44 18 L-54 18 Q-82 16 -82 0 Z', '#c4b59c'); hl(g, 'M-60 -44 Q0 -52 40 -44');
      eye(g, 92, -70, 5, '#d9a020'); line(g, 'M66 -100 q-6 -6 -12 -4 M74 -106 q-6 -6 -12 -4', '#6a5a46', 1.6); },
    'animal:camel': g => { sh(g, 'M-80 4 Q-10 26 68 -4 Q70 16 48 20 L-56 20 Q-80 18 -80 4 Z', '#b07d38'); hl(g, 'M-50 -40 Q-40 -94 -14 -46 M14 -46 Q14 -92 38 -44');
      eye(g, 112, -76, 5, '#4a2a10'); line(g, 'M106 -82 l-4 -4 M110 -83 l0 -5 M114 -82 l3 -4', '#4a2a10', 1.4); },
    'animal:cat': g => { sh(g, 'M-46 60 Q0 96 46 60 L48 90 L-48 90 Z', '#d9873e'); hl(g, 'M-30 -72 Q0 -82 30 -72');
      line(g, 'M-40 0 q8 4 10 14 M40 0 q-8 4 -10 14 M-44 34 q8 2 10 12 M44 34 q-8 2 -10 12 M-26 -20 l8 4 M26 -20 l-8 4', '#c9772a', 3);
      dot(g, -20, -50, '#fff', 4); dot(g, 14, -50, '#fff', 4); },
    'animal:rabbit': g => { sh(g, 'M-64 60 Q-10 92 42 64 L44 84 L-66 84 Z', '#aaa49c'); hl(g, 'M-50 -4 Q-10 -30 26 -8'); eye(g, 60, -32, 6, '#5a3020');
      F(g, E(44, -6, 14, 9), '#f6d6dc', { opacity: .6 }); fur(g, [[-60, 30], [-40, 0], [0, -20], [20, 60]], '#b6b0a8', 7); },
    'animal:mouse': g => { sh(g, 'M-78 30 Q0 58 86 30 Q94 46 78 48 L-80 46 Z', '#9c9792'); hl(g, 'M-60 -20 Q0 -44 60 -10');
      dot(g, 53, -5, '#fff', 3); line(g, 'M10 -44 a8 8 0 0 1 16 0', '#e0a0aa', 2); },
    'wild animal:lion': g => { sh(g, 'M-88 2 Q-10 26 70 0 Q70 18 44 22 L-58 22 Q-88 20 -88 2 Z', '#c4893a'); hl(g, 'M-60 -48 Q-10 -56 30 -50');
      eye(g, 58, -54, 5, '#c98a1a'); eye(g, 82, -54, 5, '#c98a1a');
      for (let a = 0; a < 6.28; a += .45) line(g, `M${70 + 40 * Math.cos(a)} ${-48 + 40 * Math.sin(a)} l${12 * Math.cos(a)} ${12 * Math.sin(a)}`, '#9a4f16', 2); },
    'wild animal:tiger': g => { sh(g, 'M-88 2 Q-10 26 70 0 Q70 18 44 22 L-58 22 Q-88 20 -88 2 Z', '#c4621a'); hl(g, 'M-60 -48 Q-10 -56 30 -50');
      eye(g, 66, -54, 5, '#d9c020'); eye(g, 90, -54, 5, '#d9c020'); for (const x of [-74, -50, 30, 54]) line(g, `M${x - 6} 40 l12 0 M${x - 6} 60 l12 0`, '#2a2018', 2.6); },
    'wild animal:elephant': g => { sh(g, 'M-100 6 Q-20 34 60 14 Q60 26 56 30 L-80 30 Q-100 26 -100 6 Z', '#828a96'); hl(g, 'M-80 -60 Q-20 -76 40 -60');
      eye(g, 96, -46, 5, '#4a3020'); line(g, 'M-60 -10 q8 6 4 16 M-20 -20 q8 6 4 16 M20 -16 q8 6 4 16 M40 -50 q10 10 6 24', '#828a96', 1.8); },
    'wild animal:giraffe': g => { sh(g, 'M-60 -14 Q0 6 62 -22 L62 -14 Q60 0 42 0 L-46 0 Q-60 0 -60 -14 Z', '#c99024'); hl(g, 'M40 -64 L68 -144');
      eye(g, 90, -156, 4, '#3a2010'); line(g, 'M64 -146 q-8 30 -24 70 M58 -128 l-6 -4 M50 -104 l-6 -4 M42 -80 l-6 -4', '#8a5a14', 1.8); },
    'wild animal:bear': g => { sh(g, 'M-96 6 Q-10 30 66 10 L66 24 L-80 24 Q-96 22 -96 6 Z', '#5a3418'); hl(g, 'M-80 -50 Q-30 -70 30 -60');
      eye(g, 84, -44, 5, '#2a1a0a'); P(g, E(66, -62, 5), '#c9a07a', '#4a2c12', 1); P(g, E(96, -62, 5), '#c9a07a', '#4a2c12', 1);
      fur(g, [[-70, -40], [-40, -54], [-10, -60], [20, -56], [-60, 0], [-20, 6]], '#6a4020', 9); },
    'bird:bird': g => { sh(g, 'M-46 20 Q0 46 46 20 Q30 42 0 42 Q-30 42 -46 20 Z', '#3d7cc9'); hl(g, 'M24 -50 Q44 -60 60 -50');
      line(g, 'M-20 -8 q10 8 22 8 M-16 4 q10 8 22 8 M-80 -6 l-14 -4 M-80 8 l-14 2', '#1f4f8f', 1.6); dot(g, 52, -38, '#fff', 3); },
    'bird:eagle': g => { sh(g, 'M-20 30 Q0 54 20 30 Q16 50 0 54 Q-16 50 -20 30 Z', '#3d230e'); hl(g, 'M-14 -50 Q0 -58 14 -50');
      eye(g, -8, -42, 4, '#e0a100'); eye(g, 8, -42, 4, '#e0a100'); line(g, 'M-12 -12 q12 6 24 0 M-14 4 q14 6 28 0 M-14 20 q14 6 28 0', '#4a2c12', 1.6); },
    'bird:owl': g => { sh(g, E(0, 50, 46, 22), '#7a5230'); hl(g, 'M-40 -40 Q0 -64 40 -40');
      for (const [x, y] of [[-40, 0], [40, 0], [-36, 30], [36, 30]]) line(g, `M${x - 6} ${y} l6 6 l6 -6`, '#6a4524', 1.8); },
    'bird:penguin': g => { sh(g, 'M28 -40 Q44 10 36 50 Q24 76 10 82 Q30 40 28 -40 Z', '#c8ced6'); hl(g, 'M-30 -62 Q-10 -78 20 -72');
      P(g, E(-34, -36, 7, 12), '#f6c445', '#c98a10', 1.4); P(g, E(34, -36, 7, 12), '#f6c445', '#c98a10', 1.4); dot(g, -18, -56, '#fff', 3); dot(g, 14, -56, '#fff', 3); },
    'sea creature:fish': g => { sh(g, 'M-60 20 Q0 50 80 14 Q40 42 -40 40 Z', '#d9821f'); hl(g, 'M-40 -36 Q10 -50 60 -30'); dot(g, 62, -11, '#fff', 3);
      line(g, 'M-110 -24 l10 18 M-112 24 l10 -18 M-100 -4 l12 4', '#c9772a', 1.4); },
    'sea creature:shark': g => { hl(g, 'M-60 -26 Q20 -44 100 -18'); dot(g, 96, -8, '#fff', 2.5); sh(g, 'M-80 -10 Q0 -34 90 -14 Q40 -26 -40 -18 Z', '#5a6674');
      line(g, 'M104 14 l4 4 l4 -4 l4 4 l4 -4', '#fff', 1.6); },
    'sea creature:whale': g => { sh(g, 'M-80 -20 Q-40 -60 20 -60 Q-30 -50 -70 -14 Z', '#3d6fae'); hl(g, 'M-40 -50 Q30 -70 100 -40'); dot(g, 82, 3, '#fff', 3);
      for (const [x, y] of [[0, -30], [30, -40], [-30, -20]]) line(g, E(x, y, 4), '#3d6fae', 1.4); },
    'sea creature:dolphin': g => { hl(g, 'M-40 -20 Q10 -46 70 -34'); dot(g, 70, -24, '#fff', 3); sh(g, 'M-90 30 Q-40 -20 30 -36 Q-20 -10 -70 30 Z', '#5f88b0'); },
    'sea creature:turtle': g => { sh(g, 'M-84 22 Q-80 -70 0 -72 Q-60 -60 -70 20 Z', '#3f7a2a'); hl(g, 'M-50 -52 Q0 -70 50 -52'); dot(g, 114, -6, '#fff', 3);
      for (const [x, y] of [[-64, 36], [74, 36]]) line(g, `M${x - 8} ${y + 6} l4 6 M${x} ${y + 8} l0 6 M${x + 8} ${y + 6} l-4 6`, '#2c5a1a', 1.4); },
    'critter:butterfly': g => { for (const s of [-1, 1]) line(g, `M0 -6 Q${s * 40} -40 ${s * 80} -60 M0 -2 Q${s * 50} -20 ${s * 90} -30 M0 6 Q${s * 40} 20 ${s * 60} 50`, '#7a3a10', 1.2, { opacity: .7 });
      hl(g, 'M-60 -70 Q-30 -82 -10 -60'); hl(g, 'M60 -70 Q30 -82 10 -60'); },
    'critter:bee': g => { sh(g, 'M-50 26 Q0 50 50 26 Q30 46 0 48 Q-30 46 -50 26 Z', '#c9a020'); hl(g, 'M-40 -14 Q0 -30 40 -14');
      line(g, 'M-20 -60 l20 26 M10 -72 l14 40', '#9aaab8', 1.2); dot(g, 66, -4, '#fff', 4); fur(g, [[-50, -10], [-30, -26], [30, -26], [50, -10]], '#3a2f28', 6); },
    'critter:ant': g => { hl(g, 'M-90 -6 Q-66 -18 -44 -10'); hl(g, 'M28 -20 Q42 -26 56 -18'); dot(g, 48, -14, '#fff', 3); sh(g, E(-66, 20, 30, 8), '#5a2810'); },
    'critter:spider': g => { hl(g, 'M-20 -6 Q0 -18 20 -6'); sh(g, E(0, 30, 28, 10), '#3a3434'); for (const [x, y] of [[-8, 6], [8, 6], [0, 20]]) dot(g, x, y, '#c9a040', 5); },
    'critter:snake': g => { const ex = 80, ey = 46 * Math.sin(Math.PI * 3.2); dot(g, ex + 14, ey - 12, '#fff', 3);
      hl(g, 'M-110 -2 Q-80 -36 -50 -20', 2.4); line(g, `M${ex + 4} ${ey + 4} q8 6 18 2`, '#2c5a1a', 1.4); },
    'critter:lizard': g => { hl(g, 'M-40 -2 Q20 -8 90 -4'); sh(g, 'M-60 26 Q0 36 60 24 Q20 32 -40 32 Z', '#4e8f2a'); },
    'critter:caterpillar': g => { hl(g, 'M-90 -10 Q-20 -30 70 -14', 2.4); sh(g, 'M-100 20 Q0 34 90 18 Q0 28 -100 26 Z', '#5c9128'); dot(g, 106, -16, '#fff', 3); },
    'critter:snail': g => { hl(g, 'M-40 -60 Q-4 -84 30 -66'); sh(g, 'M-60 0 Q-10 30 50 6 Q30 26 -10 28 Q-50 22 -60 0 Z', '#b07a2a'); },
    'critter:tadpole': g => { hl(g, 'M-10 -10 Q10 -22 30 -12', 2.4); },
    'critter:worm': g => { hl(g, 'M-110 -10 Q-80 -30 -50 -14', 2.4); },
    'critter:chrysalis': g => { sh(g, 'M10 -60 Q34 0 20 54 Q0 86 0 86 Q14 40 10 -60 Z', '#6a9a3a'); },
  };

  // ---------- nature ----------
  const TREE = {
    oak: g => {
      P(g, 'M-16 100 L-12 10 Q-30 -10 -48 -22 L-40 -28 Q-18 -14 -6 -4 L-5 -40 L8 -40 L8 -4 Q24 -18 42 -28 L48 -22 Q28 -8 14 12 L18 100 Z', '#9a6b40', '#5e3b1c');
      line(g, 'M-4 40 q4 10 0 22 M6 70 q-4 8 0 16', '#5e3b1c', 1.8);
      P(g, fluff(0, -68, 100, 66, 13, 1.2), '#5fae3a', '#24561c');
      F(g, fluff(24, -50, 60, 36, 9, 1.2), '#2f7d27', { opacity: .35 });
      for (const [x, y] of [[-50, -90], [-14, -110], [34, -96], [-60, -50], [60, -60], [10, -40]]) line(g, `M${x} ${y} q6 -6 12 0`, '#24561c', 2);
      for (const [x, y] of [[-30, -70], [40, -30], [70, -90]]) dot(g, x, y, '#e04b3a', 10);
      line(g, 'M-90 100 L90 100', '#5a7a3a', 3);
      return 128;
    },
    pine: g => {
      P(g, RR(-12, 60, 24, 40, 3), '#9a6b40', '#5e3b1c');
      for (const [y, w] of [[60, 86], [10, 70], [-40, 52]]) {
        let d = `M${-w} ${y}`; for (let x = -w; x < w; x += w / 4) d += ` Q${x + w / 8} ${y + 10} ${x + w / 4} ${y}`;
        P(g, `${d} L0 ${y - 82} Z`, '#3f8f45', '#1d4f22');
      }
      line(g, 'M-90 100 L90 100', '#5a7a3a', 3);
      return 128;
    },
    palm: g => {
      P(g, 'M-14 100 Q-6 20 22 -60 L34 -56 Q10 20 10 100 Z', '#c9965a', '#6b4a24');
      for (let i = 0; i < 8; i++) { const y = 90 - i * 20, x = -4 + i * 4.2; line(g, `M${x - 10} ${y} q12 4 22 0`, '#6b4a24', 1.8); }
      for (const [dx, dy, a] of [[-90, 10, -1], [-80, -50, -1], [-20, -100, -1], [80, -90, 1], [96, -20, 1], [60, 20, 1]]) {
        const tx = 28 + dx, ty = -60 + dy, mx = 28 + dx * .5, my = -60 + dy * .5 - 34;
        const d = `M28 -60 Q${mx} ${my - 14} ${tx} ${ty} Q${mx + a * 6} ${my + 14} 28 -60 Z`;
        P(g, d, '#5fae3a', '#24561c', 2.6);
        line(g, `M28 -60 Q${mx} ${my} ${tx} ${ty}`, '#24561c', 1.6);
      }
      for (const [x, y] of [[20, -50], [36, -48], [28, -40]]) P(g, E(x, y, 8), '#8a5a2b', '#4a2c12', 2);
      line(g, 'M-90 100 L90 100', '#c9a46a', 3);
      return 128;
    },
  };
  const FLOWER = {
    daisy: (g, h) => { for (let a = 0; a < 360; a += 30) P(rot(g, a, 0, h), E(0, h - 30, 9, 20), '#ffffff', '#8a8378', 2); P(g, E(0, h, 15), '#ffd84a', '#c97a10'); },
    tulip: (g, h) => {
      P(g, `M-26 ${h - 30} Q-34 ${h + 10} 0 ${h + 22} Q34 ${h + 10} 26 ${h - 30} L13 ${h - 12} L0 ${h - 36} L-13 ${h - 12} Z`, '#e04b3a', '#8a1f1a');
      line(g, `M0 ${h - 36} Q-6 ${h} 0 ${h + 22}`, '#8a1f1a', 1.8);
    },
    sunflower: (g, h) => { for (let a = 0; a < 360; a += 24) P(rot(g, a, 0, h), `M0 ${h - 24} Q-10 ${h - 40} 0 ${h - 58} Q10 ${h - 40} 0 ${h - 24} Z`, '#ffd84a', '#c97a10', 2); P(g, E(0, h, 26), '#8a5a2b', '#4a2c12');
      for (const [x, y] of [[-10, -8], [8, -10], [0, 6], [-12, 10], [12, 8]]) dot(g, x, h + y, '#4a2c12', 5); },
  };

  // ---------- people ----------
  const SKIN = ['#f6d2b0', '#e2aa7c', '#b9774a', '#7a4a2a'], HAIR = ['#3a2a1e', '#1f1a16', '#6b4424', '#2a2420'];
  const SHIRT = ['#7fb7ea', '#f4a531', '#5fae3a', '#e07a7a', '#b39ddb'];
  const person = (g, k, shirt, skin, hair) => {
    const ink = '#3a3430', tr = '#3d4f6b';
    const sw = { standing: [6, -6, 0, 0], walking: [-24, 24, 16, -16], waving: [6, -150, 0, 0] }[k];   // [left arm, right arm, left leg, right leg] degrees
    if (!sw) throw new Error(`Unknown person "${k}" (use standing|walking|waving)`);
    const [lA, rA, lL, rL] = [sw[0], sw[1], sw[2], sw[3]];
    const leg = (x, a) => { const h = rot(g, a, x, 22); P(h, RR(x - 8, 20, 16, 82, 5), tr, ink, 2.6); P(h, E(x + 3, 104, 13, 6), '#3a2f28', ink, 2); };
    leg(-10, lL); leg(10, rL);
    const arm = (s, a) => { const h = rot(g, a, s * 26, -44); P(h, `M${s * 22} -48 L${s * 32} -46 L${s * 38} 10 L${s * 26} 12 Z`, shirt, ink, 2.6); P(h, E(s * 32, 18, 8), skin, ink, 2); };
    arm(-1, lA);
    P(g, 'M-28 -46 Q-30 -54 -18 -56 L18 -56 Q30 -54 28 -46 L24 26 L-24 26 Z', shirt, ink);
    arm(1, rA);
    P(g, RR(-7, -66, 14, 14, 3), skin, ink, 2);
    P(g, E(0, -84, 24, 26), skin, ink);
    P(g, 'M-25 -86 Q-26 -114 0 -112 Q26 -114 25 -86 Q16 -100 0 -98 Q-16 -100 -25 -86 Z', hair, ink, 2.4);
    dot(g, -8, -84, '#2a2420', 6); dot(g, 8, -84, '#2a2420', 6);
    line(g, 'M-8 -72 Q0 -66 8 -72', ink, 2.4);
  };

  // ---------- geography ----------
  const LAND = [   // [longitude, -latitude] points, smoothed
    [[-166, -66], [-140, -70], [-110, -72], [-95, -74], [-80, -70], [-75, -62], [-62, -58], [-55, -50], [-66, -45], [-70, -42], [-76, -36], [-80, -31], [-80, -25], [-83, -29], [-90, -30], [-97, -26], [-96, -19], [-88, -21], [-84, -15], [-78, -8], [-86, -12], [-95, -16], [-106, -23], [-112, -30], [-118, -34], [-124, -42], [-124, -48], [-136, -58], [-152, -60], [-166, -58]],
    [[-60, -82], [-30, -83], [-20, -76], [-22, -70], [-42, -60], [-50, -64], [-56, -74]],
    [[-78, -10], [-72, -12], [-62, -10], [-50, -2], [-35, 6], [-38, 14], [-48, 25], [-58, 35], [-65, 42], [-69, 52], [-73, 52], [-74, 42], [-72, 28], [-71, 18], [-77, 12], [-81, 5], [-80, -2]],
    [[-17, -21], [-16, -28], [-9, -33], [-6, -35], [10, -36], [20, -32], [32, -31], [34, -28], [42, -13], [51, -11], [42, 0], [40, 10], [38, 20], [32, 28], [20, 34], [16, 24], [12, 6], [9, -3], [2, -6], [-8, -5], [-15, -10]],
    [[-9, -38], [-9, -43], [-2, -47], [2, -51], [6, -53], [9, -57], [6, -62], [12, -66], [18, -70], [28, -71], [40, -68], [60, -70], [80, -74], [105, -78], [140, -72], [178, -68], [172, -62], [162, -58], [156, -52], [150, -58], [142, -54], [140, -46], [132, -42], [128, -36], [122, -30], [120, -24], [110, -20], [106, -10], [104, -2], [100, -8], [97, -16], [92, -22], [88, -22], [80, -9], [73, -20], [67, -25], [58, -23], [52, -15], [45, -13], [39, -26], [35, -33], [36, -37], [28, -41], [22, -38], [16, -41], [10, -45], [4, -43], [-3, -38]],
    [[-6, -50], [2, -51], [-2, -58], [-6, -56]],
    [[130, -32], [142, -36], [143, -44], [136, -36]],
    [[44, 14], [50, 16], [47, 25], [43, 22]],
    [[96, -4], [106, 4], [104, 6], [96, 0]], [[110, -2], [118, -6], [118, 2], [111, 2]], [[132, 2], [142, 4], [150, 8], [140, 8]],
    [[114, 22], [122, 18], [130, 12], [136, 14], [142, 11], [146, 18], [153, 26], [150, 37], [144, 39], [136, 34], [130, 32], [115, 34]],
    [[172, 36], [178, 38], [172, 45], [167, 46]],
  ];

  // ---------- society ----------
  const BUILDING = {
    school: g => {
      const ink = '#7a2e1e', w = '#e07a5f';
      P(g, RR(-20, -126, 40, 30), '#f1ead8', ink, 2.4); P(g, 'M-26 -126 L0 -146 L26 -126 Z', '#9a4a3a', ink, 2.4);
      P(g, RR(-120, -40, 240, 136), w, ink);
      P(g, 'M-132 -38 L0 -100 L132 -38 Z', '#9a4a3a', ink);
      P(g, E(0, -62, 15), '#fffaf0', ink, 2); line(g, 'M0 -62 L0 -72 M0 -62 L8 -58', ink, 2);
      for (const x of [-96, -56, 32, 72]) for (const y of [-20, 30]) { P(g, RR(x, y, 26, 30, 2), '#cfe6f7', ink, 2); line(g, `M${x + 13} ${y} v30 M${x} ${y + 15} h26`, ink, 1.4); }
      P(g, `M-20 96 L-20 30 Q0 14 20 30 L20 96 Z`, '#8a5a2b', ink);
      for (let y = -24; y < 90; y += 18) line(g, `M-118 ${y} h20 M-60 ${y + 9} h18 M70 ${y} h18 M100 ${y + 9} h18`, '#c4593e', 1.4);
      return 128;
    },
    hospital: g => {
      const ink = '#46505c';
      P(g, RR(-120, -70, 240, 166), '#f4f6f8', ink);
      P(g, RR(-40, -110, 80, 44, 4), '#f4f6f8', ink);
      P(g, RR(-18, -102, 36, 30, 4), '#2b6cc4', '#1f4f8f', 2);
      line(g, 'M-8 -96 V-78 M8 -96 V-78 M-8 -87 H8', '#fff', 4);
      for (const x of [-104, -70, 44, 78]) for (const y of [-50, -6, 38]) P(g, RR(x, y, 26, 26, 2), '#cfe6f7', ink, 2);
      P(g, 'M-44 40 L44 40 L52 52 L-52 52 Z', '#7fb7ea', ink, 2.4);
      P(g, RR(-26, 52, 52, 44), '#cfe6f7', ink); line(g, 'M0 52 V96', ink, 2);
      return 128;
    },
    parliament: g => {
      const ink = '#6b5a3a', c = '#efe6d2';
      line(g, 'M0 -146 L0 -126', ink, 3); dot(g, 0, -148, '#d9b24a', 9);
      P(g, 'M-44 -70 Q-44 -128 0 -128 Q44 -128 44 -70 Z', '#9fb7c9', '#3e5a70');
      line(g, 'M-22 -76 Q-22 -118 0 -126 M22 -76 Q22 -118 0 -126', '#3e5a70', 1.8);
      P(g, RR(-56, -76, 112, 16), c, ink);
      P(g, RR(-140, -14, 280, 110), c, ink);
      P(g, 'M-70 -14 L0 -60 L70 -14 Z', c, ink);
      for (let x = -56; x <= 56; x += 28) { P(g, RR(x - 6, -12, 12, 92), '#fbf7ee', ink, 2); }
      for (const x of [-124, -100, 88, 112]) P(g, RR(x, 6, 14, 30, 6), '#cfe6f7', ink, 1.8);
      P(g, RR(-150, 80, 300, 16), '#e3d7bc', ink);
      return 128;
    },
  };
  const AWARD = {
    trophy: g => {
      const ink = '#8a6414', c = '#f3c33b';
      line(g, 'M-50 -66 Q-96 -66 -82 -24 Q-74 -6 -40 -4 M50 -66 Q96 -66 82 -24 Q74 -6 40 -4', ink, 6);
      P(g, RR(-50, 70, 100, 26, 4), '#8a5a2b', '#4a2c12');
      P(g, 'M-14 20 L14 20 L20 70 L-20 70 Z', c, ink);
      P(g, 'M-56 -80 L56 -80 Q56 20 0 26 Q-56 20 -56 -80 Z', c, ink);
      P(g, star(0, -32, 20), '#fff3a6', ink, 2);
      line(g, 'M-38 -66 Q-38 -10 -16 6', '#fff', 5, { opacity: .6 });
      return 124;
    },
    medal: g => {
      const ink = '#8a6414';
      P(g, 'M-50 -100 L-16 -100 L16 -10 L-16 -10 Z', '#2b6cc4', '#1f4f8f');
      P(g, 'M50 -100 L16 -100 L-16 -10 L16 -10 Z', '#e04b3a', '#8a1f1a');
      P(g, E(0, 34, 50), '#f3c33b', ink);
      P(g, E(0, 34, 36), '#ffd84a', ink, 2);
      P(g, star(0, 34, 24), '#fff3a6', ink, 2);
      return 112;
    },
    stars: (g, o) => {
      const n = Math.max(0, Math.min(5, +(o.n ?? 4)));
      for (let i = 0; i < 5; i++) P(g, star(-120 + i * 60, 0, 28, 13), i < n ? '#ffd84a' : '#eef0f2', i < n ? '#c97a10' : '#9aa3b2', 2.6);
      return 64;
    },
  };

  Object.assign(window.RECIPES, {
    // "animal cx cy size k=cow|horse|sheep|goat|camel|cat|rabbit|mouse flip=1 | Cow"
    animal: make(260, (g, o) => pick(ANIMAL, o.k, 'cow', 'animal')(g)),
    // "wild cx cy size k=lion|tiger|elephant|giraffe|bear flip=1"
    wild: make(260, (g, o) => pick(WILD, o.k, 'lion', 'wild animal')(g)),
    // "bird cx cy size k=bird|eagle|owl|penguin"
    bird: make(220, (g, o) => pick(BIRD, o.k, 'bird', 'bird')(g)),
    // "seacreature cx cy size k=fish|shark|whale|dolphin|turtle flip=1"
    seacreature: make(260, (g, o) => pick(SEA, o.k, 'fish', 'sea creature')(g)),
    // "critter cx cy size k=frog|snake|butterfly|bee|ant|spider"
    critter: make(220, (g, o) => pick(CRITTER, o.k, 'frog', 'critter')(g)),

    // "tree cx cy height k=oak|pine|palm" — cy is the middle; trunk stands on a ground line
    tree: make(260, (g, o) => pick(TREE, o.k, 'oak', 'tree')(g)),
    // "flower cx cy height k=daisy|tulip|sunflower"
    flower: make(220, (g, o) => {
      const f = pick(FLOWER, o.k, 'daisy', 'flower'), h = -50;
      line(g, `M0 100 Q-8 30 0 ${h}`, '#2f7d27', 5);
      P(g, 'M-2 50 Q-40 20 -60 34 Q-34 58 -2 50 Z', '#5fae3a', '#24561c', 2.4);
      P(g, 'M0 20 Q36 -6 56 8 Q34 30 0 20 Z', '#5fae3a', '#24561c', 2.4);
      f(g, h); return 124;
    }),
    // "grass x1 x2 y" — a strip of ground with tufts of grass along y
    grass: ([x1, x2, y], o, t, parent) => {
      const g = mk('g', {}, parent);
      F(g, `M${x1} ${y} L${x2} ${y} L${x2} ${y + 16} L${x1} ${y + 16} Z`, '#8fbf5a');
      line(g, `M${x1} ${y} L${x2} ${y}`, '#3f7a2a', 3);
      for (let x = x1 + 12, i = 0; x < x2 - 6; x += 22, i++) {
        const hgt = 18 + (i * 7) % 14;
        line(g, `M${x - 6} ${y} q-2 ${-hgt * .6} -8 ${-hgt} M${x} ${y} q1 ${-hgt * .7} 2 ${-hgt - 6} M${x + 6} ${y} q4 ${-hgt * .5} 10 ${-hgt + 4}`, i % 2 ? '#3f8a2a' : '#5fae3a', 2.4);
      }
      return g;
    },
    // "mushroom cx cy height"
    mushroom: make(200, g => {
      const ink = '#7a1f1a';
      line(g, 'M-90 92 L90 92', '#5a7a3a', 3);
      P(g, 'M-24 92 Q-20 40 -18 10 L18 10 Q20 40 24 92 Z', '#f6ecd6', '#8a7660');
      P(g, 'M-88 6 Q-90 -86 0 -88 Q90 -86 88 6 Q0 20 -88 6 Z', '#e04b3a', ink);
      for (const [x, y, r] of [[-46, -30, 12], [0, -60, 14], [44, -26, 11], [-10, -14, 8], [60, -60, 7], [-62, -60, 7]]) P(g, E(x, y, r, r * .8), '#fffaf0', ink, 1.8);
      line(g, 'M-60 -60 Q-40 -80 -10 -84', '#fff', 5, { opacity: .5 });
      return 120;
    }),
    // "pond cx cy width" — oval water with lily pads and reeds
    pond: make(300, g => {
      line(g, 'M-130 10 Q-138 -40 -128 -80 M-138 12 Q-150 -30 -152 -62 M130 10 Q140 -30 134 -60', '#5a7a3a', 3);
      for (const [x, y] of [[-128, -80], [-152, -62], [134, -60]]) P(g, E(x, y - 8, 4, 11), '#8a5a2b', '#4a2c12', 1.8);
      P(g, E(0, 20, 150, 56), '#8fd0f5', '#2b6cc4');
      for (const [x, y] of [[-60, 0], [40, 30], [80, -4]]) P(g, `M${x} ${y} m-22 0 a22 12 0 1 0 22 -12 L${x} ${y} Z`, '#5fae3a', '#24561c', 2);
      P(g, E(-60, -8, 7, 6), '#f7a6c0', '#a03a5a', 1.8);
      line(g, 'M-110 30 q14 -6 28 0 M0 52 q16 -6 32 0 M-30 20 q12 -5 24 0', '#d8eefc', 2.4);
      return 104;
    }),
    // "foodweb cx cy width k=chain|web | Grass, Rabbit, Snake, Eagle" — labelled nodes, arrows = eaten by
    foodweb: make(400, (g, o, t) => {
      const C = ['#5fae3a', '#f3c33b', '#f4a531', '#e07a5f', '#c0392b', '#7fb7ea'];
      const node = (x, y, s, i) => { P(g, RR(x - 54, y - 22, 108, 44, 14), C[i % 6], '#3a3430', 2.6); if (t || showLab(o)) label(g, x, y + 8, s, '#2a2420', 22, 'middle'); };
      const edge = ([ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, k = Math.min(62 / Math.abs(dx || 1e-9), 30 / Math.abs(dy || 1e-9)); return [ax + dx * k, ay + dy * k]; };
      const arr = (a, b) => arrow(g, ...edge(a, b), ...edge(b, a), INK.green, 2.6);
      if ((o.k || 'chain') === 'chain') {
        const L = list(t, 'Grass, Rabbit, Snake, Eagle'), n = L.length, gap = 380 / n;
        const at = L.map((s, i) => [-190 + gap * (i + .5), i % 2 ? -30 : 30]);
        at.forEach((p, i) => i && arr(at[i - 1], p)); L.forEach((s, i) => node(...at[i], s, i));
      } else if (o.k === 'web') {
        const L = list(t, 'Grass, Seeds, Rabbit, Mouse, Snake, Eagle');
        const at = [[-100, 110], [100, 110], [-120, 30], [80, 30], [140, -50], [-20, -120]];
        for (const [a, b] of [[0, 2], [0, 3], [1, 3], [3, 4], [2, 5], [3, 5], [4, 5]]) arr(at[a], at[b]);
        L.slice(0, 6).forEach((s, i) => node(...at[i], s, i));
      } else throw new Error(`Unknown foodweb "${o.k}" (use chain|web)`);
    }),

    // "person cx cy height k=standing|walking|waving c=blue skin=1-4 | Name"
    person: make(240, (g, o) => {
      const i = Math.max(1, Math.min(4, +(o.skin || 1))) - 1;
      person(g, o.k || 'standing', FILL[o.c] || SHIRT[0], SKIN[i], HAIR[i]); return 140;
    }),
    // "people cx cy width n=4" — a friendly group, mixed skin tones and shirts
    people: make(360, (g, o) => {
      const n = Math.max(2, Math.min(6, +(o.n || 4)));
      for (let i = 0; i < n; i++) {
        const x = -150 + 300 * (n === 1 ? .5 : i / (n - 1)), h = mk('g', { transform: `translate(${x} ${i % 2 ? 6 : 0}) scale(${i % 2 ? .9 : 1})` }, g);
        person(h, i === n - 1 ? 'waving' : 'standing', SHIRT[i % 5], SKIN[(i * 3) % 4], HAIR[(i * 3) % 4]);
      }
      return 150;
    }),
    // "familytree cx cy size | Grandma, Grandpa, Mother, Father, Me, Sister" — three generations of boxes
    familytree: make(320, (g, o, t) => {
      const L = list(t, ''), ink = '#3a3430', X = 92, Y = 124, W = 150, H = 96;
      const at = [[-X, -Y], [X, -Y], [-X, 0], [X, 0], [-X, Y], [X, Y]], C = ['#cfe6f7', '#fde3c2', '#cfe6f7', '#fde3c2', '#dff0c8', '#dff0c8'];
      for (const y of [-Y, 0]) line(g, `M${-X + W / 2} ${y} H${X - W / 2}`, ink, 3.4);
      line(g, `M0 ${-Y} V${-Y / 2} H${-X} V${-H / 2}`, ink, 3.4);
      line(g, `M0 0 V${Y / 2} M${-X} ${Y / 2} H${X} M${-X} ${Y / 2} V${Y - H / 2} M${X} ${Y / 2} V${Y - H / 2}`, ink, 3.4);
      at.forEach(([x, y], i) => {
        P(g, RR(x - W / 2, y - H / 2, W, H, 12), C[i], '#4f5966', 2.8);
        const hy = L[i] ? y - 12 : y + 4;
        P(g, `M${x - 20} ${hy + 24} Q${x - 20} ${hy + 2} ${x} ${hy + 2} Q${x + 20} ${hy + 2} ${x + 20} ${hy + 24} Z`, SHIRT[i % 5], '#4f5966', 2.2);
        P(g, E(x, hy - 10, 11), SKIN[i % 4], '#4f5966', 2.2);
        if (L[i]) label(g, x, y + 38, L[i], '#2a2420', 28, 'middle');
      });
    }),

    // "worldmap cx cy width" — flat world map, simplified continents on blue ocean
    worldmap: make(400, g => {
      const s = mk('g', { transform: 'scale(1.04)' }, g);
      P(s, RR(-186, -92, 372, 176, 14), '#cfe8f7', '#2b6cc4');
      for (const y of [-60, -30, 0, 30, 60]) line(s, `M-180 ${y} H180`, '#9cc9ea', 1.2, { 'stroke-dasharray': '4 6' });
      for (const x of [-120, -60, 0, 60, 120]) line(s, `M${x} -88 V80`, '#9cc9ea', 1.2, { 'stroke-dasharray': '4 6' });
      for (const p of LAND) P(s, smooth(p), '#8cc46a', '#2c6a22', 2.4);
      P(s, smooth([[-176, 70], [-130, 66], [-90, 68], [-64, 60], [-44, 66], [10, 64], [60, 65], [110, 63], [150, 66], [176, 70]], false) + ' L176 78 L-176 78 Z', '#f4f8fb', '#7a9ab5', 2.4);   // Antarctica
      return 112;
    }),
    // "mappin cx cy size | Here" — red map pin, tip at cx cy
    mappin: ([cx, cy, S = 90], o, t, parent) => {
      const g = mk('g', { transform: `translate(${cx} ${cy}) scale(${S / 90})` }, parent);
      F(g, E(0, 0, 20, 6), '#3a3430', { opacity: .2 });
      P(g, 'M0 0 C-10 -24 -34 -44 -34 -68 A34 34 0 1 1 34 -68 C34 -44 10 -24 0 0 Z', '#e04b3a', '#8a1f1a');
      P(g, E(0, -68, 13), '#fff', '#8a1f1a', 2);
      line(g, 'M-20 -86 Q-12 -96 0 -98', '#fff', 4, { opacity: .55 });
      if (t) label(g, 42, -62, t, TXT.red, 26);
      return g;
    },
    // "compassrose cx cy r" — eight-point compass rose with N E S W
    compassrose: make(120, g => {
      P(g, E(0, 0, 92), '#fdf6e3', '#8a6a3e', 2.4); line(g, E(0, 0, 80), '#c9a46a', 1.6);
      for (let a = 45; a < 360; a += 90) { const h = rot(g, a); P(h, 'M0 -62 L10 -10 L-10 -10 Z', '#b9c4d0', '#4f5966', 2); }
      for (let a = 0; a < 360; a += 90) {
        const h = rot(g, a);
        P(h, 'M0 -100 L0 0 L-16 -16 Z', a ? '#7fb7ea' : '#e04b3a', a ? '#1f4f8f' : '#8a1f1a', 2.4);
        P(h, 'M0 -100 L0 0 L16 -16 Z', '#f6f8fb', a ? '#1f4f8f' : '#8a1f1a', 2.4);
      }
      P(g, E(0, 0, 8), '#f3c33b', '#8a6414', 2);
      for (const [x, y, s] of [[0, -118, 'N'], [124, 9, 'E'], [0, 132, 'S'], [-124, 9, 'W']]) label(g, x, y, s, s === 'N' ? TXT.red : '#3a3430', 28, 'middle');
    }),
    // "routemap cx cy width" — folded paper map, river, roads, dashed route from start to pin
    routemap: make(340, g => {
      const ink = '#8a6a3e';
      P(g, 'M-160 -100 L-54 -88 L54 -100 L160 -88 L160 100 L54 88 L-54 100 L-160 88 Z', '#f6ecd0', ink);
      F(g, 'M-54 -88 L54 -100 L54 88 L-54 100 Z', '#e9dbb4', { opacity: .6 });
      line(g, 'M-54 -88 V100 M54 -100 V88', '#c9a46a', 2);
      P(g, smooth([[-130, -70], [-80, -76], [-70, -40], [-110, -30], [-140, -44]]), '#a8d48a', '#3f7a2a', 2);
      line(g, 'M-160 40 Q-80 10 -20 50 Q40 90 160 30', '#5b9bdc', 7);
      line(g, 'M-150 -10 L150 -40 M70 -100 L100 90', '#9aa3b2', 4);
      line(g, 'M-120 60 Q-100 -10 -30 -10 Q40 -10 40 -60 Q40 -76 110 -60', '#e04b3a', 3.4, { 'stroke-dasharray': '10 9' });
      P(g, E(-120, 60, 9), '#2b6cc4', '#1f4f8f', 2);
      for (const [x, y] of [[100, 40], [120, 54], [-20, -60]]) { P(g, E(x, y - 8, 9), '#5fae3a', '#24561c', 2); line(g, `M${x} ${y} v6`, '#5e3b1c', 2); }
      const pg = mk('g', { transform: 'translate(112 -60) scale(.45)' }, g);
      P(pg, 'M0 0 C-10 -24 -34 -44 -34 -68 A34 34 0 1 1 34 -68 C34 -44 10 -24 0 0 Z', '#e04b3a', '#8a1f1a'); P(pg, E(0, -68, 13), '#fff', '#8a1f1a', 2);
      return 128;
    }),

    // "skyline cx groundY width" — city skyline, lit windows
    skyline: make(400, g => {
      const ink = '#3e4a5a', B = [[-190, 70, 120, '#b9c4d0'], [-124, 50, 190, '#7fa7d6'], [-70, 60, 100, '#d6c6a8'], [-6, 44, 230, '#9aa8bd'], [42, 64, 140, '#c9b6d9'], [110, 40, 180, '#8fb3cf'], [154, 40, 90, '#d6c6a8']];
      line(g, 'M-6 -230 V-262 M16 -230 V-250', ink, 3); dot(g, -6, -264, '#e04b3a', 8);
      for (const [x, w, h, c] of B) {
        P(g, RR(x, -h, w, h), c, ink, 2.6);
        for (let y = -h + 14; y < -16; y += 24) for (let xx = x + 9; xx < x + w - 14; xx += 16) F(g, RR(xx, y, 9, 12), (xx * 7 + y * 3) % 5 ? '#fff3a6' : '#5a6a80');
      }
      line(g, 'M-200 0 H200', ink, 3);
      return 40;
    }),
    // "hut cx cy size" — village hut, round mud wall and thatched roof
    hut: make(240, g => {
      const ink = '#6b4a24';
      line(g, 'M-120 96 H120', '#8a6a3e', 3);
      P(g, 'M-84 -6 L-84 84 Q0 106 84 84 L84 -6 Z', '#d9a55e', ink);
      P(g, 'M-26 96 L-26 34 Q0 8 26 34 L26 96 Z', '#6b4a24', '#3a2410');
      P(g, 'M-112 6 Q0 26 112 6 L0 -110 Z', '#e8c46a', '#8a6414');
      for (const x of [-80, -50, -20, 10, 40, 70]) line(g, `M${x} ${10 + Math.abs(x) * -.05} L${x * .3} -80`, '#b8902a', 1.8);
      line(g, 'M-6 -110 L-12 -130 M6 -110 L12 -130 M0 -110 V-132', '#8a6414', 2.4);
      return 128;
    }),
    // "pyramids cx groundY width" — ancient Egyptian pyramids on desert sand
    pyramids: make(400, g => {
      const ink = '#8a5a14';
      const pyr = (x, w, h) => {
        P(g, `M${x - w / 2} 0 L${x} ${-h} L${x + w * .14} 0 Z`, '#f3d08a', ink);
        P(g, `M${x + w * .14} 0 L${x} ${-h} L${x + w / 2} 0 Z`, '#d9a55e', ink);
        for (let k = 1; k < 6; k++) { const y = -h * k / 6, f = 1 - k / 6; line(g, `M${x - w / 2 * f} ${y} L${x + w * .14 * f} ${y} L${x + w / 2 * f} ${y}`, '#b8862a', 1.4); }
      };
      pyr(70, 200, 150); pyr(-70, 240, 190); pyr(150, 110, 80);
      P(g, 'M-200 0 Q-100 -8 0 0 T200 0 L200 30 L-200 30 Z', '#f6dfa6', '#b8902a', 2.4);
      return 64;
    }),
    // "castle cx cy size" — stone castle, towers, gate, plain pennants
    castle: make(300, g => {
      const ink = '#4f5966', c = '#b9c0c9';
      const cren = (x, w, y) => { let d = `M${x} ${y}`; for (let i = 0; i < w / 16; i++) d += ` v-14 h8 v14 h8`; return d; };
      for (const x of [-120, 80]) {
        line(g, `M${x + 20} -110 V-150`, ink, 2.4); P(g, `M${x + 20} -150 L${x + 46} -142 L${x + 20} -134 Z`, x < 0 ? '#e04b3a' : '#2b6cc4', ink, 2);
        P(g, `${cren(x, 40, -96)} V96 H${x} Z`, c, ink); P(g, RR(x + 14, -60, 12, 22, 6), '#3a3430', ink, 1.6);
      }
      P(g, `${cren(-80, 160, -40)} V96 H-80 Z`, '#c9cfd7', ink);
      for (let y = -24; y < 90; y += 20) line(g, `M-74 ${y} h20 M-30 ${y + 10} h22 M30 ${y} h20`, '#8a94a3', 1.4);
      P(g, 'M-30 96 V40 Q0 6 30 40 V96 Z', '#8a5a2b', '#4a2c12');
      for (const x of [-20, -10, 0, 10, 20]) line(g, `M${x} ${x ? 96 : 96} V${36 + Math.abs(x) * .6}`, '#4a2c12', 1.4);
      line(g, 'M-150 96 H150', '#5a7a3a', 3);
      return 128;
    }),
    // "columns cx cy size" — ancient Greek / Roman temple front: steps, columns, pediment
    columns: make(300, g => {
      const ink = '#7a6a4a', c = '#f1ead8';
      P(g, 'M-140 -60 L0 -120 L140 -60 Z', c, ink); P(g, 'M-104 -68 L0 -110 L104 -68 Z', '#e3d7bc', ink, 1.8);
      P(g, RR(-140, -60, 280, 24), c, ink);
      for (let i = 0; i < 6; i++) { const x = -112 + i * 44.8; P(g, RR(x - 13, -36, 26, 110), c, ink, 2.4); line(g, `M${x - 4} -30 V68 M${x + 4} -30 V68`, '#c9b98e', 1.4); P(g, RR(x - 17, -40, 34, 8, 2), c, ink, 2); }
      P(g, RR(-150, 74, 300, 12), '#e3d7bc', ink); P(g, RR(-160, 86, 320, 12), '#e3d7bc', ink);
      return 124;
    }),
    // "sailship cx cy size" — wooden sailing ship of exploration on waves
    sailship: make(300, g => {
      const ink = '#4a2c12';
      for (const x of [-50, 20, 80]) line(g, `M${x} 30 V${x === 20 ? -130 : -100}`, ink, 4);
      P(g, 'M20 -130 L52 -122 L20 -114 Z', '#e04b3a', '#8a1f1a', 2);
      for (const [x, top, w] of [[-50, -94, 34], [20, -122, 42], [80, -92, 30]]) {
        P(g, `M${x - w} ${top} Q${x} ${top - 8} ${x + w} ${top} Q${x + w + 8} ${top + 32} ${x + w} ${top + 56} Q${x} ${top + 48} ${x - w} ${top + 56} Q${x - w + 8} ${top + 32} ${x - w} ${top} Z`, '#fbf5e6', '#8a7660', 2.4);
        P(g, `M${x - w * .8} ${top + 64} Q${x} ${top + 58} ${x + w * .8} ${top + 64} L${x + w * .8} ${top + 100} Q${x} ${top + 94} ${x - w * .8} ${top + 100} Z`, '#fbf5e6', '#8a7660', 2.4);
      }
      P(g, 'M-130 20 L140 20 L110 70 L-110 70 Z', '#9a6b40', ink);
      line(g, 'M-124 34 L134 34', '#e3c08a', 3); for (const x of [-60, -20, 20, 60]) P(g, E(x, 50, 5), '#4a2c12', ink, 1.6);
      line(g, 'M140 20 L170 2', ink, 3);
      P(g, 'M-160 74 Q-140 64 -120 74 T-80 74 T-40 74 T0 74 T40 74 T80 74 T120 74 T160 74 L160 96 L-160 96 Z', '#7fb7ea', '#2b6cc4', 2.4);
      return 124;
    }),
    // "scroll cx cy size | Text" — rolled parchment scroll; text written on it
    scroll: make(260, (g, o, t) => {
      const ink = '#8a6a3e';
      P(g, RR(-100, -70, 200, 140), '#f6ecd0', ink);
      for (const y of [-74, 74]) { P(g, RR(-116, y - 12, 232, 24, 12), '#e8d6a8', ink); P(g, E(-116, y, 7, 12), '#c9a46a', ink, 2); P(g, E(116, y, 7, 12), '#c9a46a', ink, 2); }
      if (t) label(g, 0, 10, t, '#5a3a1a', 30, 'middle');
      else for (const [y, w] of [[-36, 140], [-12, 150], [12, 130], [36, 100]]) line(g, `M${-w / 2} ${y} q${w / 4} -5 ${w / 2} 0 t${w / 2} 0`, '#8a6a3e', 2);
    }),
    // "document cx cy size" — official paper with writing, signature and red wax seal
    document: make(260, g => {
      const ink = '#6b5a3a';
      P(g, 'M-80 -110 L50 -110 L80 -80 L80 110 L-80 110 Z', '#fffdf6', ink);
      P(g, 'M50 -110 L50 -80 L80 -80 Z', '#e9e1cc', ink, 2);
      line(g, 'M-50 -82 H24', '#3a3430', 3.4);
      for (let y = -50; y < 40; y += 18) line(g, `M-56 ${y} H${y % 36 ? 40 : 56}`, '#9aa3b2', 2);
      line(g, 'M-56 74 q10 -18 18 0 t18 -4 t16 2', '#1f4f8f', 2.4);
      P(g, 'M38 86 L28 124 L42 116 L50 128 L54 90 Z', '#c0392b', '#7a1f1a', 2);
      P(g, fluff(46, 72, 24, 24, 9, 1.12), '#d9483c', '#7a1f1a', 2.4); P(g, E(46, 72, 14), '#c0392b', '#7a1f1a', 1.8);
    }),
    // "justice cx cy size" — balanced scales of justice
    justice: make(260, g => {
      const ink = '#8a6414', c = '#f3c33b';
      P(g, 'M-50 104 Q-50 86 0 84 Q50 86 50 104 Z', c, ink);
      P(g, RR(-6, -90, 12, 176), c, ink, 2.6);
      P(g, RR(-104, -84, 208, 10, 5), c, ink, 2.6);
      P(g, E(0, -98, 12), c, ink, 2.4);
      for (const s of [-1, 1]) {
        line(g, `M${s * 96} -76 L${s * 62} 10 M${s * 96} -76 L${s * 130} 10`, '#8a6414', 2);
        P(g, `M${s * 96 - 40} 10 Q${s * 96} 50 ${s * 96 + 40} 10 Z`, c, ink, 2.6);
      }
    }),
    // "ballot cx cy size | VOTE" — ballot box with a ticked paper going into the slot
    ballot: make(260, (g, o, t) => {
      const ink = '#1f4f8f';
      P(g, 'M-90 -30 L90 -30 L110 -50 L-70 -50 Z', '#cfe6f7', ink);
      P(g, 'M90 -30 L110 -50 L110 80 L90 100 Z', '#9cc9ea', ink);
      P(g, RR(-90, -30, 180, 130), '#e6f2fb', ink);
      line(g, 'M-24 -40 L56 -40', '#1f2d4a', 5);
      P(g, 'M-10 -40 L-4 -120 L56 -112 L46 -40 Z', '#fffdf6', '#6b5a3a', 2.4);
      line(g, 'M8 -86 L18 -74 L40 -104', '#2c6a22', 4);
      label(g, 0, 50, t || 'VOTE', '#1f4f8f', 34, 'middle');
    }),
    // "civic cx cy size k=school|hospital|parliament" — civic building (no flags)
    civic: make(300, (g, o) => pick(BUILDING, o.k, 'school', 'building')(g)),
    // "courtroom cx cy size" — judge at the raised bench, scales emblem, two tables
    courtroom: make(400, g => {
      const ink = '#4a2c12', wood = '#b07a48', dark = '#8a5a2b';
      P(g, RR(-190, -178, 380, 278, 8), '#f3ead8', '#8a6a3e', 2.4);
      // scales emblem on the wall
      P(g, E(0, -138, 26), '#f3c33b', '#8a6414', 2.4);
      line(g, 'M0 -154 V-122 M-16 -146 H16 M-8 -122 H8 M-16 -146 L-22 -134 M-16 -146 L-10 -134 M16 -146 L10 -134 M16 -146 L22 -134 M-24 -134 Q-16 -126 -8 -134 M8 -134 Q16 -126 24 -134', '#8a6414', 2);
      // judge: grey hair, dark robe, white collar, behind the bench
      P(g, 'M-50 -2 Q-50 -48 0 -48 Q50 -48 50 -2 Z', '#2a2f3a', '#111', 2.4);
      P(g, 'M-12 -46 L0 -30 L12 -46 Z', '#fbfbf8', '#8a8378', 1.8);
      P(g, RR(-8, -56, 16, 12, 3), SKIN[1], ink, 2);
      P(g, E(0, -72, 20, 22), SKIN[1], ink, 2.4);
      P(g, 'M-21 -72 Q-24 -98 0 -96 Q24 -98 21 -72 Q14 -86 0 -84 Q-14 -86 -21 -72 Z', '#d8d4cc', '#8a8378', 2);
      dot(g, -7, -72, '#2a2420', 5); dot(g, 7, -72, '#2a2420', 5);
      // raised bench
      P(g, RR(-118, -12, 236, 14, 4), dark, ink);
      P(g, RR(-104, 2, 208, 70, 3), wood, ink);
      P(g, RR(-30, 16, 60, 40, 3), '#c9965a', ink, 2);
      // two tables
      for (const x of [-180, 100]) { P(g, RR(x, 70, 80, 12, 3), dark, ink, 2.4); line(g, `M${x + 8} 82 V100 M${x + 72} 82 V100`, ink, 3); }
      line(g, 'M-190 100 H190', ink, 3);
    }),

    // "classroom cx cy size | 2 + 2 = 4" — chalkboard, teacher, pupils at desks (text on the board)
    classroom: make(400, (g, o, t) => {
      const ink = '#4a2c12';
      P(g, RR(-150, -130, 230, 120, 6), '#2f5d3a', '#6b4a24', 5);
      label(g, -35, -60, t || 'A B C  1 2 3', '#f6f8fb', 30, 'middle');
      const tg = mk('g', { transform: 'translate(140 -30) scale(.62)' }, g); person(tg, 'waving', '#f4a531', SKIN[2], HAIR[2]);
      for (const [x, y, i] of [[-130, 70, 0], [-30, 70, 1], [70, 70, 2], [-80, 110, 3], [20, 110, 0]]) {
        P(g, E(x + 30, y - 22, 13), SKIN[(i * 3) % 4], ink, 2); P(g, `M${x + 30} ${y - 30} q-14 -2 -13 8 q13 -14 26 0 q-1 -10 -13 -8 z`, HAIR[i], ink, 1.6);
        P(g, `M${x + 12} ${y} Q${x + 12} ${y - 12} ${x + 30} ${y - 12} Q${x + 48} ${y - 12} ${x + 48} ${y} Z`, SHIRT[i], ink, 2);
        P(g, RR(x, y - 2, 60, 12, 3), '#c9965a', ink, 2.4); line(g, `M${x + 6} ${y + 10} V${y + 26} M${x + 54} ${y + 10} V${y + 26}`, ink, 2.6);
      }
    }),

    // "supplydemand cx cy size" — price/quantity axes, supply and demand lines crossing at equilibrium
    supplydemand: make(300, (g, o) => {
      const ink = '#3a3430';
      arrow(g, -130, 110, -130, -130, ink, 3.6); arrow(g, -130, 110, 130, 110, ink, 3.6);
      line(g, 'M-100 84 L80 -96', INK.blue, 5); line(g, 'M-100 -96 L80 84', INK.orange, 5);
      line(g, 'M-130 -6 H-10 V110', '#9aa3b2', 2.4, { 'stroke-dasharray': '7 7' });
      P(g, E(-10, -6, 10), '#e04b3a', '#8a1f1a', 2.4);
      if (showLab(o)) { label(g, 88, -92, 'Supply', TXT.blue, 32); label(g, 88, 98, 'Demand', TXT.orange, 32); }
      if (showLab(o)) { label(g, -120, -122, 'Price', '#3a3430', 30); label(g, 130, 148, 'Quantity', '#3a3430', 30, 'end'); }
    }),

    // "stall cx cy size" — market stall: striped awning, fruit crates on the counter
    stall: make(300, g => {
      const ink = '#6b4a24';
      for (const x of [-120, 112]) P(g, RR(x, -70, 8, 166), '#b07a48', ink, 2.4);
      for (let i = 0; i < 8; i++) { const x = -136 + i * 34; P(g, `M${x} -90 L${x + 34} -90 L${x + 34} -60 Q${x + 17} -44 ${x} -60 Z`, i % 2 ? '#fffaf0' : '#e04b3a', '#8a1f1a', 2); }
      P(g, 'M-146 -90 L-120 -120 L120 -120 L146 -90 Z', '#e04b3a', '#8a1f1a', 2.4);
      P(g, RR(-130, 20, 260, 76, 4), '#c9965a', ink);
      for (let x = -130; x < 130; x += 26) line(g, `M${x} 22 V94`, '#a87a48', 1.4);
      const fruit = [['#f4a531', '#a0560f'], ['#e04b3a', '#7a1f1a'], ['#9ad35a', '#3f7a2a']];
      fruit.forEach(([f, k], j) => {
        const x0 = -110 + j * 80;
        for (const [dx, dy] of [[10, 6], [30, 6], [50, 6], [20, -10], [40, -10], [30, -24]]) P(g, E(x0 + dx, dy, 11), f, k, 2);
        P(g, RR(x0, 6, 60, 16, 2), '#e3c08a', ink, 2);
      });
      return 124;
    }),
    // "trade cx cy width | Goods" — two lands swapping goods: export and import arrows with crates
    trade: make(400, (g, o, t) => {
      P(g, smooth([[-190, -20], [-150, -70], [-100, -60], [-80, 0], [-110, 60], [-170, 50]]), '#8cc46a', '#2c6a22');
      P(g, smooth([[190, -30], [150, -66], [100, -50], [86, 10], [120, 66], [176, 40]]), '#e8cf7a', '#8a6414');
      for (const [x, c] of [[-150, '#e07a5f'], [-122, '#7fb7ea'], [120, '#b39ddb'], [148, '#e07a5f']]) { P(g, RR(x - 10, -4, 20, 18), '#fbf5e6', '#4f5966', 1.8); P(g, `M${x - 14} -4 L${x} -18 L${x + 14} -4 Z`, c, '#4f5966', 1.8); }
      line(g, 'M-80 -50 Q0 -110 80 -50', INK.blue, 3.4); line(g, head(80, -50, 40, -84), INK.blue, 3.4, { class: 'ink head' });
      line(g, 'M80 50 Q0 110 -80 50', INK.orange, 3.4); line(g, head(-80, 50, -40, 84), INK.orange, 3.4, { class: 'ink head' });
      P(g, RR(-16, -100, 32, 24, 3), '#c9965a', '#6b4a24', 2.2); line(g, 'M-16 -88 H16 M0 -100 V-76', '#6b4a24', 1.6);
      for (const [x, c] of [[-14, '#e04b3a'], [0, '#f4a531'], [14, '#9ad35a']]) P(g, E(x, 80, 9), c, '#5a3a1a', 2);
      if (t) label(g, 0, -114, t, TXT.blue, 22, 'middle');
    }),
    // "factory cx cy size" — factory with chimneys puffing grey smoke (pollution)
    factory: make(320, g => {
      const ink = '#4f5966';
      for (const [x, y, r] of [[-70, -130, 22], [-50, -158, 28], [-20, -178, 32], [60, -120, 20], [80, -146, 26]]) P(g, fluff(x, y, r, r * .8, 7, 1.25), '#9aa0a8', '#5a6068', 2);
      let d = 'M-150 100 L-150 -10'; for (let x = -150; x < 150; x += 60) d += ` L${x + 40} -50 L${x + 40} -10 L${x + 60} -10`;
      P(g, d + ' L150 100 Z', '#b9c0c9', ink);
      for (const x of [-90, 50]) { P(g, RR(x, -110, 28, 100), '#c96a4a', '#7a2e1e'); P(g, RR(x - 3, -110, 34, 10, 2), '#7a2e1e', '#4a1a10', 2); }
      for (const x of [-130, -70, -10, 50, 110]) P(g, RR(x, 14, 24, 22, 2), '#fff3a6', ink, 2);
      P(g, RR(-20, 50, 40, 50), '#7a8594', ink);
      line(g, 'M-170 100 H170', ink, 3);
      return 124;
    }),
    // "recycle cx cy size" — three green chasing arrows in a circle
    recycle: make(220, g => {
      for (let i = 0; i < 3; i++) {
        const h = rot(g, i * 120), R = 80, r = 56, a0 = -80, a1 = 10, p = (rr, a) => `${(rr * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(rr * Math.sin(a * Math.PI / 180)).toFixed(1)}`;
        const d = `M${p(R, a0)} A${R} ${R} 0 0 1 ${p(R, a1)} L${p(R + 14, a1)} L${p((R + r) / 2, a1 + 26)} L${p(r - 14, a1)} L${p(r, a1)} A${r} ${r} 0 0 0 ${p(r, a0)} Z`;
        P(h, d, '#5fae3a', '#24561c');
      }
    }),
    // "timeline x1 x2 y | Stone Age, Ancient, Middle Ages, Modern" — coloured eras with markers
    timeline: ([x1, x2, y], o, t, parent) => {
      const g = mk('g', {}, parent), L = list(t, 'Stone Age, Ancient, Middle Ages, Modern'), n = L.length, w = (x2 - x1 - 20) / n, C = ['#f3c33b', '#f4a531', '#e07a5f', '#7fb7ea', '#5fae3a', '#b39ddb'];
      L.forEach((s, i) => P(g, RR(x1 + i * w, y - 9, w, 18), C[i % 6], '#3a3430', 2.4));
      line(g, `M${x2 - 20} ${y} L${x2} ${y}`, '#3a3430', 3); line(g, head(x2 + 4, y, x2 - 20, y, 14), '#3a3430', 3, { class: 'ink head' });
      for (let i = 0; i <= n; i++) { const x = x1 + i * w; line(g, `M${x} ${y - 20} V${y + 20}`, '#3a3430', 3); }
      if (t || showLab(o)) L.forEach((s, i) => label(g, x1 + (i + .5) * w, i % 2 ? y + 46 : y - 30, s, TXT.blue, 24, 'middle'));
      return g;
    },

    // "idea cx cy size" — glowing light bulb: a bright idea
    idea: make(200, g => {
      for (let a = -150; a <= -30; a += 30) { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); line(g, `M${c * 78} ${-20 + s * 78} L${c * 102} ${-20 + s * 102}`, '#f6c84c', 5); }
      line(g, 'M-78 -20 L-102 -20 M78 -20 L102 -20', '#f6c84c', 5);
      P(g, 'M-24 40 Q-26 20 -40 6 Q-62 -18 -58 -46 Q-50 -90 0 -92 Q50 -90 58 -46 Q62 -18 40 6 Q26 20 24 40 Z', '#fff3a6', '#c97a10');
      line(g, 'M-12 40 L-12 6 L-6 -14 L0 4 L6 -14 L12 6 L12 40', '#e0a100', 2.4);
      P(g, RR(-26, 40, 52, 34, 6), '#b9c0c9', '#5a6068', 2.6);
      line(g, 'M-26 52 H26 M-26 62 H26', '#5a6068', 2);
      P(g, 'M-12 74 Q0 88 12 74 Z', '#5a6068', '#3a3f45', 2);
      line(g, 'M-38 -50 Q-34 -74 -12 -80', '#fff', 6, { opacity: .7 });
    }),
    // "quiz cx cy size k=tick|cross|question" — big green tick, red cross or question mark
    quiz: make(200, (g, o) => {
      const k = o.k || 'tick', C = { tick: ['#dff0c8', '#2c8a2c'], cross: ['#fbd9d4', '#c0392b'], question: ['#d6e8fa', '#2b6cc4'] }[k];
      if (!C) throw new Error(`Unknown quiz "${k}" (use tick|cross|question)`);
      P(g, E(0, 0, 90), C[0], C[1], 2.4);
      if (k === 'tick') line(g, 'M-50 2 L-14 40 L54 -46', C[1], 20);
      if (k === 'cross') line(g, 'M-42 -42 L42 42 M42 -42 L-42 42', C[1], 20);
      if (k === 'question') { line(g, 'M-30 -30 Q-30 -64 2 -64 Q34 -64 34 -36 Q34 -14 4 -4 L4 18', C[1], 18); dot(g, 4, 50, C[1], 22); }
    }),
    // "award cx cy size k=trophy|medal|stars n=4" — gold trophy, ribbon medal, or n-of-5 star rating
    award: make(240, (g, o) => pick(AWARD, o.k, 'trophy', 'award')(g, o)),
    // "handshake cx cy width" — two hands shaking: agreement, teamwork, deal
    handshake: make(320, g => {
      const ink = '#3a3430', A = SKIN[0], B = SKIN[2], kB = '#6b4424';
      // finger-shaped capsule from (x1,y1) to (x2,y2), half-width r
      const cap = (x1, y1, x2, y2, r) => {
        const L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L * r, ny = (x2 - x1) / L * r, f = v => v.toFixed(1);
        return `M${f(x1 + nx)} ${f(y1 + ny)} L${f(x2 + nx)} ${f(y2 + ny)} A${r} ${r} 0 0 0 ${f(x2 - nx)} ${f(y2 - ny)} L${f(x1 - nx)} ${f(y1 - ny)} Z`;
      };
      // sleeves and cuffs
      P(g, 'M-176 -28 L-96 -36 L-94 22 L-174 30 Z', '#7fb7ea', '#1f4f8f'); P(g, RR(-100, -40, 16, 66, 4), '#fbfbf8', '#1f4f8f', 2.4);
      P(g, 'M176 -28 L96 -36 L94 22 L174 30 Z', '#f4a531', '#a0560f'); P(g, RR(84, -40, 16, 66, 4), '#fbfbf8', '#a0560f', 2.4);
      // left hand (behind): palm reaching right, fingertips showing under the other hand
      P(g, 'M-86 -30 Q-50 -38 -10 -34 L40 -24 Q56 -18 52 -4 L46 18 Q20 28 -30 22 Q-62 22 -86 18 Z', A, ink);
      // right hand (front): back of the hand from the right cuff
      P(g, 'M86 -34 Q56 -42 20 -40 Q-4 -38 -14 -30 L-12 22 Q20 30 50 22 Q72 20 86 16 Z', B, kB);
      // its four fingers wrap down over the left hand
      for (let i = 3; i >= 0; i--) { const x = -30 + i * 15; P(g, cap(x + 16, -30 + i * 2, x - 6, 15 + i * 3, 8.5), B, kB, 2.6); }
      // left thumb lies over the top of the right hand
      P(g, 'M-64 -32 Q-40 -54 -4 -52 Q20 -50 26 -42 Q22 -34 4 -36 Q-24 -36 -40 -26 Z', A, ink, 2.6);
      line(g, 'M14 -48 Q22 -46 22 -40', ink, 1.8);
    }),

    // "love cx cy size" — red love-heart icon (loop beat pulses it)
    love: ([cx, cy, S = 160], o, t, parent) => {
      const outer = mk('g', { transform: `translate(${cx} ${cy}) scale(${S / 160})` }, parent);
      const g = mk('g', { class: 'pivot' }, outer); outer.anim = g;
      const d = 'M0 66 C-40 40 -84 8 -84 -30 C-84 -62 -58 -78 -36 -76 C-18 -74 -6 -62 0 -50 C6 -62 18 -74 36 -76 C58 -78 84 -62 84 -30 C84 8 40 40 0 66 Z';
      P(g, d, '#e04b3a', '#8a1f1a', 3.4);
      line(g, 'M-62 -34 Q-60 -56 -38 -60', '#fff', 7, { opacity: .6 });
      if (t) label(outer, 0, 104, t, TXT.red, 26, 'middle');
      return outer;
    },
  });
})();
