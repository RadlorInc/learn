// Whiteboard library — cells: cell biology, genetics, microbes, plants.
// Each drawing is drawn in its own local units and scaled to the size in the call. Helpers live inside this
// closure so they never clash with another category's globals.
(() => {
  const W = 'url(#wc)', LC = '#3b4a5a';
  const showLab = o => o.lab !== '0' && o.labels !== '0';
  const E = (x, y, rx, ry = rx) => `M${x - rx} ${y} A${rx} ${ry} 0 1 0 ${x + rx} ${y} A${rx} ${ry} 0 1 0 ${x - rx} ${y} Z`;
  const fillp = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: W, class: 'fillable', ...extra }, g);
  const part = (g, d, fill, ink, w = 3) => { fillp(g, d, fill); line(g, d, ink, w); };
  const grp = (parent, x, y, s = 1, rot = 0) => mk('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})` }, parent);
  const base = (parent, cx, cy, size, b, o) => grp(parent, cx, cy, size / b, +o.rot || 0);
  const poly = pts => 'M' + pts.map(p => `${+p[0].toFixed(1)} ${+p[1].toFixed(1)}`).join(' L');
  const rr = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  const cap = (L, w) => `M${-w} 0 L${-w} ${-L + w} A${w} ${w} 0 0 1 ${w} ${-L + w} L${w} 0 Z`;
  // a leader line from a part to its handwritten name
  const tag = (g, px, py, lx, ly, text) => {
    line(g, `M${px} ${py} L${lx} ${ly}`, '#8a96a3', 1.6);
    label(g, lx + (lx < px ? -6 : 6), ly + 6, text, LC, 20, lx < px ? 'end' : 'start');
  };
  const arrow = (g, d, x, y, ax, ay, c, w = 3) => { line(g, d, c, w); line(g, head(x, y, ax, ay, 12), c, w, { class: 'ink head' }); };
  const caption = (g, y, t, c = LC) => { if (t) label(g, 0, y, t, c, 26, 'middle'); };
  // smooth a list of points (Catmull-Rom) and drop beads every `step` units along it
  const smooth = pts => { const out = [];
    for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for (let k = 0; k < 10; k++) { const t = k / 10, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } }
    out.push(pts[pts.length - 1]); return out; };
  const beadsAlong = (pts, step) => { const res = [pts[0]]; let acc = 0;
    for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc >= step) { res.push(pts[i]); acc = 0; } }
    return res; };

  // ---- organelles in base units (reused inside the cells) ----
  const mitoD = g => {               // 200 long
    part(g, E(0, 0, 100, 46), '#f39a6b', '#a3441f', 3.2);
    fillp(g, E(0, 0, 86, 34), '#fbd0b0');
    let d = '';
    for (let i = 0; i < 7; i++) { const x = -66 + i * 22, yE = 34 * Math.sqrt(1 - ((Math.abs(x) + 5) / 86) ** 2) - 1, s = i % 2 ? 1 : -1;
      d += `M${x - 5} ${s * yE} L${x - 5} ${-s * 12} Q${x} ${-s * 20} ${x + 5} ${-s * 12} L${x + 5} ${s * yE} `; }
    line(g, E(0, 0, 86, 34), '#c0552a', 2.2); line(g, d, '#c0552a', 2.4);
    line(g, 'M-62 -30 C-30 -42 20 -42 48 -36', '#ffffff', 5, { opacity: .5 });
  };
  const chloroD = g => {             // 200 long
    part(g, E(0, 0, 100, 50), '#9fd37a', '#2f6b21', 3.2);
    line(g, E(0, 0, 90, 41), '#5f9e3f', 1.8);
    line(g, 'M-75 2 C-40 -6 40 8 75 0', '#5f9e3f', 2);
    for (const [x, y0] of [[-55, -12], [-18, -4], [20, -16], [56, -8]]) for (let j = 0; j < 4; j++) {
      const d = E(x, y0 + j * 9, 14, 4.5); fillp(g, d, '#3f8f2e'); line(g, d, '#1f4f17', 1.6); }
  };
  const nucD = g => {                // 190 wide
    part(g, E(0, 0, 95, 85), '#d9c2ef', '#6b3f8a', 3.2);
    line(g, E(0, 0, 86, 76), '#6b3f8a', 1.8);
    let pores = '';
    for (let k = 0; k < 8; k++) { const a = (k * 45 + 20) * Math.PI / 180; pores += E(90.5 * Math.cos(a), 80.5 * Math.sin(a), 4.5); }
    fillp(g, pores, '#fdfdfb'); line(g, pores, '#6b3f8a', 1.5);
    line(g, 'M-62 -22 q10 -14 20 0 t20 0 t20 0 M-54 32 q10 12 20 0 t20 0 M-4 -50 q9 -10 18 0 t18 0 M-30 52 q8 10 16 0', '#9b6fc0', 2.2);
    part(g, E(20, 10, 26, 22), '#7b4fa3', '#4a2370', 2.4);
  };
  const golgiD = g => {              // 200 wide
    for (let i = 0; i < 5; i++) {
      const y = -46 + i * 23, w = 80 - Math.abs(i - 2) * 8;
      const d = `M${-w} ${y} C${-w * .5} ${y - 22} ${w * .5} ${y - 22} ${w} ${y} C${w + 4} ${y + 8} ${w - 4} ${y + 12} ${w - 10} ${y + 9} C${w * .4} ${y - 6} ${-w * .4} ${y - 6} ${-w + 10} ${y + 9} C${-w + 4} ${y + 12} ${-w - 4} ${y + 8} ${-w} ${y} Z`;
      part(g, d, '#f2b8cf', '#a3406b', 2.6);
    }
    const v = E(88, -48, 7) + E(84, 2, 7) + E(-86, -20, 7) + E(-80, 52, 7);
    fillp(g, v, '#f7d3e1'); line(g, v, '#a3406b', 2);
  };
  const riboD = g => {               // 230 wide: big subunit on top, small below, mRNA through the gap, chain out the top
    part(g, 'M-104 2 C-114 -58 -72 -106 -6 -104 C62 -108 112 -66 104 2 C86 -6 66 -4 50 4 C24 -8 -24 -8 -50 4 C-66 -4 -86 -6 -104 2 Z', '#9fb7e0', '#2c4f8a', 3.2);
    part(g, 'M-92 32 C-70 22 70 22 92 32 C100 60 64 84 0 84 C-64 84 -100 60 -92 32 Z', '#c6d6f0', '#2c4f8a', 3.2);
    line(g, 'M-60 -60 C-40 -76 -10 -80 14 -74 M-70 50 C-40 62 30 64 60 54', '#ffffff', 5, { opacity: .55 });
    const bc = { A: '#e04b3a', U: '#d9a400', G: '#3f8f2e', C: '#2b6cc4' };
    let ticks = {}; [...'AUGGCAUUCGAAUGC'].forEach((b, i) => { const x = -112 + i * 16; ticks[b] = (ticks[b] || '') + `M${x} 17 L${x} 9 `; });
    for (const b in ticks) line(g, ticks[b], bc[b], 3);
    line(g, 'M-115 17 H115', '#d9483c', 4);
    const cols = ['#f3c33b', '#5fae3a', '#e88a3a', '#9b7fd4', '#7fb7ea', '#e9748a'];
    const ch = [[4, -104], [10, -120], [22, -132], [38, -138], [54, -136], [68, -128], [84, -124], [100, -130], [110, -142]];
    line(g, poly(ch), '#555', 2.4);
    ch.forEach(([x, y], i) => part(g, E(x, y, 8), cols[i % 6], '#444', 1.8));
  };
  const chromatid = g => part(g, 'M-52 -88 C-40 -100 -18 -96 -14 -80 L-6 -8 Q-4 0 -6 8 L-14 80 C-18 96 -40 100 -52 88 C-60 78 -52 60 -44 40 L-26 6 Q-24 0 -26 -6 L-44 -40 C-52 -60 -60 -78 -52 -88 Z', '#e9748a', '#8a2a46', 3);
  const miniX = (g, x, y, s, col, rot = 0) => {
    const h = grp(g, x, y, s, rot);
    for (const r of [-20, 20]) { const c = grp(h, 0, 0, 1, r), d = `M-5 -22 A5 5 0 0 1 5 -22 L5 22 A5 5 0 0 1 -5 22 Z`; part(c, d, col, '#4a2a3a', 1.8); }
  };

  Object.assign(window.RECIPES, {
    // "animalcell cx cy size lab=1"
    animalcell: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 300, o);
      const out = 'M-140 0 C-140 -80 -70 -125 10 -122 C90 -120 145 -70 142 5 C140 80 80 125 0 122 C-80 120 -140 75 -140 0 Z';
      fillp(g, out, '#fde3c6');
      fillp(g, 'M142 5 C140 80 80 125 0 122 C-60 120 -110 95 -130 55 C-80 95 60 100 142 5 Z', '#f2c19a', { opacity: .6 });
      line(g, out, '#c26a3a', 3.6);
      const n = grp(g, -25, -10, .5); nucD(n);
      let er = '';
      for (const r of [60, 72, 84]) { const a0 = -62 * Math.PI / 180, a1 = 62 * Math.PI / 180;
        er += `M${-25 + r * Math.cos(a0)} ${-10 + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${-25 + r * Math.cos(a1)} ${-10 + r * Math.sin(a1)} `; }
      line(g, er, '#3c8fb5', 2.6);
      let rib = '';
      for (let k = -5; k <= 5; k++) { const a = k * 11 * Math.PI / 180; rib += E(-25 + 90 * Math.cos(a), -10 + 90 * Math.sin(a), 2.6); }
      for (const [x, y] of [[10, 62], [32, 44], [-30, 96], [112, 8], [-118, 20], [-60, -92], [50, -96]]) rib += E(x, y, 2.6);
      fillp(g, rib, '#2c4f8a'); line(g, rib, '#2c4f8a', 1.2);
      mitoD(grp(g, 82, -60, .3, 30)); mitoD(grp(g, -75, 72, .3, -15));
      golgiD(grp(g, 74, 58, .34, -20));
      const v = E(-98, -52, 8) + E(18, 96, 7) + E(-62, -80, 6);
      fillp(g, v, '#f7d3e1'); line(g, v, '#a3406b', 1.8);
      if (o.lab && showLab(o)) {
        tag(g, -45, -22, -178, -96, 'Nucleus'); tag(g, -139, 12, -178, 12, 'Membrane'); tag(g, -82, 74, -178, 104, 'Mitochondrion');
        tag(g, 98, -66, 178, -100, 'Mitochondrion'); tag(g, 59, -6, 178, -30, 'ER'); tag(g, 92, 50, 178, 52, 'Golgi'); tag(g, 40, 100, 178, 118, 'Cytoplasm');
      }
      return g;
    },

    // "plantcell cx cy size lab=1"
    plantcell: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 300, o);
      const outer = rr(-150, -105, 300, 210, 18), inner = rr(-138, -93, 276, 186, 12);
      fillp(g, outer, '#a9d47a'); fillp(g, inner, '#eef7d9');
      line(g, outer, '#3c7a2a', 3.6); line(g, inner, '#6aa84f', 2);
      const vac = 'M-35 -60 C10 -78 85 -72 100 -42 C115 -5 108 50 70 62 C25 74 -25 68 -40 40 C-55 12 -60 -45 -35 -60 Z';
      const vg = grp(g, 10, 0, .88); part(vg, vac, '#cfe6f7', '#3a7ab8', 2.8);
      line(vg, 'M-20 -48 C10 -60 50 -60 70 -48', '#ffffff', 6, { opacity: .6 });
      nucD(grp(g, -100, -45, .3));
      for (const [x, y, r] of [[-110, 30, 90], [-95, 76, 15], [-50, -80, 0], [30, -82, 0], [115, -60, 70], [125, 40, 90], [60, 82, -5]]) chloroD(grp(g, x, y, .22, r));
      mitoD(grp(g, -62, 46, .2, -20));
      if (o.lab && showLab(o)) {
        tag(g, 148, -78, 186, -100, 'Cell wall'); tag(g, 137, -16, 186, -16, 'Membrane'); tag(g, 70, -30, 186, 22, 'Vacuole');
        tag(g, 125, 50, 186, 76, 'Chloroplast'); tag(g, -118, -50, -186, -60, 'Nucleus'); tag(g, -112, 12, -186, 12, 'Chloroplast');
      }
      return g;
    },

    // "mitochondrion cx cy length rot=deg"
    mitochondrion: ([cx, cy, L = 220], o, t, parent) => { const g = base(parent, cx, cy, L, 200, o); mitoD(g); return g; },
    // "chloroplast cx cy length rot=deg"
    chloroplast: ([cx, cy, L = 220], o, t, parent) => { const g = base(parent, cx, cy, L, 200, o); chloroD(g); return g; },
    // "cellnucleus cx cy size"
    cellnucleus: ([cx, cy, S = 200], o, t, parent) => { const g = base(parent, cx, cy, S, 200, o); nucD(g); caption(g, 120, t); return g; },
    // "golgi cx cy size rot=deg"
    golgi: ([cx, cy, S = 200], o, t, parent) => { const g = base(parent, cx, cy, S, 200, o); golgiD(g); caption(g, 100, t); return g; },
    // "ribosome cx cy size"
    ribosome: ([cx, cy, S = 320], o, t, parent) => { const g = base(parent, cx, cy, S, 230, o); riboD(g); caption(g, 116, t); return g; },

    // "cellmembrane cx cy width k=channel|plain | text"
    cellmembrane: ([cx, cy, Wd = 400], o, t, parent) => {
      const g = base(parent, cx, cy, Wd, 400, o), ch = o.k !== 'plain';
      fillp(g, 'M-200 -30 H200 V30 H-200 Z', '#fbefd9');
      let heads = '', tails = '';
      for (let x = -190; x <= 190; x += 20) {
        if (ch && Math.abs(x) < 40) continue;
        heads += E(x, -40, 9) + E(x, 40, 9);
        tails += `M${x - 4} -31 q-4 7 0 14 t0 14 M${x + 4} -31 q4 7 0 14 t0 14 M${x - 4} 31 q-4 -7 0 -14 t0 -14 M${x + 4} 31 q4 -7 0 -14 t0 -14 `;
      }
      line(g, tails, '#c9a46a', 2);
      fillp(g, heads, '#f4a531'); line(g, heads, '#a35f0c', 2);
      if (ch) {
        const L = 'M-36 -62 C-46 -30 -46 30 -36 62 L-12 62 C-18 30 -18 -30 -12 -62 Z';
        part(g, L, '#9b7fd4', '#4f3a8a', 2.8); part(grp(g, 0, 0, 1).appendChild(mk('g', { transform: 'scale(-1 1)' })), L, '#9b7fd4', '#4f3a8a', 2.8);
        arrow(g, 'M0 -100 L0 96', 0, 96, 0, 80, '#2b6cc4', 3);
        const m = E(-1, -78, 6) + E(1, -10, 6) + E(-1, 66, 6); fillp(g, m, '#7fb7ea'); line(g, m, '#2b6cc4', 1.8);
      }
      if (t) label(g, -200, -70, t, LC, 24);
      return g;
    },

    // "dna cx cy length rot=deg" — double helix, base pairs as rungs (loop sway)
    dna: ([cx, cy, L = 400], o, t, parent) => {
      const g = base(parent, cx, cy, L, 400, o), A = 48, lam = 160, s = x => A * Math.sin(2 * Math.PI * x / lam);
      const pairs = [['#f3c33b', '#5fae3a'], ['#e88a3a', '#7fb7ea'], ['#5fae3a', '#f3c33b'], ['#7fb7ea', '#e88a3a']];
      const by = {};
      for (let i = 0, x = -192; x <= 192; x += 16, i++) { const y = s(x); if (Math.abs(y) < 8) continue;
        const [c1, c2] = pairs[(i * 7) % 4]; (by[c1] ??= []).push(`M${x} ${y} L${x} 0`); (by[c2] ??= []).push(`M${x} 0 L${x} ${-y}`); }
      for (const [c, ds] of Object.entries(by)) line(g, ds.join(' '), c, 4.5);
      const xs = []; for (let x = -200; x <= 200; x += 5) xs.push(x);
      line(g, poly(xs.map(x => [x, s(x)])), '#2b6cc4', 6);
      line(g, poly(xs.map(x => [x, -s(x)])), '#c0392b', 6);
      if (t) label(g, 0, -80, t, LC, 26, 'middle');
      return g;
    },

    // "chromosome cx cy size k=x|single" — X-shaped copied chromosome, or one chromatid
    chromosome: ([cx, cy, S = 200], o, t, parent) => {
      const g = base(parent, cx, cy, S, 200, o), single = o.k === 'single';
      const sides = single ? [grp(g, 30, 0)] : [grp(g, 0, 0), mk('g', { transform: 'scale(-1 1)' }, g)];
      for (const h of sides) { chromatid(h);
        line(h, 'M-54 -70 L-16 -66 M-44 -46 L-12 -46 M-44 46 L-12 46 M-54 70 L-16 66', '#b0405e', 4, { opacity: .75 });
        line(h, 'M-48 -82 C-42 -90 -30 -90 -24 -84', '#ffffff', 4, { opacity: .6 }); }
      if (!single) part(g, E(0, 0, 9), '#f3c33b', '#8a6414', 2);
      caption(g, 120, t);
      return g;
    },

    // "gene cx cy length | Gene" — a stretch of DNA with one gene highlighted
    gene: ([cx, cy, L = 400], o, t, parent) => {
      const g = base(parent, cx, cy, L, 400, o);
      fillp(g, 'M-56 -28 H76 V28 H-56 Z', '#ffd84a', { opacity: .8 });
      let grey = '', gold = '';
      for (let x = -192; x <= 192; x += 14) { const d = `M${x} -16 L${x} 16 `; if (x > -56 && x < 76) gold += d; else grey += d; }
      line(g, grey, '#b8c0c8', 3); line(g, gold, '#e88a3a', 3.4);
      line(g, 'M-200 -16 H200', '#2b6cc4', 5); line(g, 'M-200 16 H200', '#c0392b', 5);
      line(g, 'M-50 -38 Q-50 -50 -38 -50 L0 -50 Q10 -50 10 -60 Q10 -50 20 -50 L58 -50 Q70 -50 70 -38', '#c97a10', 2.6);
      if (t || showLab(o)) label(g, 10, -72, t || 'Gene', TXT.orange, 26, 'middle');
      return g;
    },

    // "rna cx cy length | mRNA" — single strand with lettered bases A U G C
    rna: ([cx, cy, L = 400], o, t, parent) => {
      const g = base(parent, cx, cy, L, 400, o), yb = x => 10 * Math.sin(2 * Math.PI * x / 120) - 20;
      const col = { A: '#e04b3a', U: '#d9a400', G: '#3f8f2e', C: '#2b6cc4' }, seq = 'AUGCCGAUUGCAUGGC';
      [...seq].forEach((b, i) => { const x = -180 + i * 24, y = yb(x); line(g, `M${x} ${y} L${x} ${y + 30}`, col[b], 4); });
      const xs = []; for (let x = -196; x <= 196; x += 5) xs.push(x);
      line(g, poly(xs.map(x => [x, yb(x)])), '#7b4fa3', 5.5);
      [...seq].forEach((b, i) => { const x = -180 + i * 24, y = yb(x) + 40; part(g, E(x, y, 10), col[b] + '55', col[b], 2); label(g, x, y + 7, b, col[b], 18, 'middle'); });
      if (t) label(g, -196, -48, t, '#7b4fa3', 24);
      return g;
    },

    // "protein cx cy size k=chain|folded" — amino-acid beads, straight chain or folded
    protein: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 300, o);
      if (o.k === 'chain') {
        const path = smooth(Array.from({ length: 15 }, (_, i) => [-140 + i * 20, 18 * Math.sin(i * .9)]));
        line(g, poly(path), '#555', 3);
        const cols = ['#e04b3a', '#f3c33b', '#5fae3a', '#7fb7ea', '#9b7fd4', '#f4a531'];
        let outl = '';
        beadsAlong(path, 21).forEach(([x, y], i) => { const d = E(x, y, 9); fillp(g, d, cols[(i * 5) % 6]); outl += d; });
        line(g, outl, '#444', 1.8);
      } else {
        // ribbon diagram: loops (thin), alpha helices (coiled ribbons), beta strands (broad arrows)
        line(g, 'M-150 100 C-140 96 -132 86 -130 74 M-130 -62 C-128 -100 -96 -114 -66 -100 M64 -100 C96 -100 112 -78 110 -48 M110 84 C110 110 70 110 70 84 M70 -46 C70 -72 30 -72 30 -46 M30 86 C28 112 -40 112 -60 84 C-72 66 -66 40 -50 30', '#7a8592', 4.5);
        const helix = (x0, y0, x1, y1, n, r) => { const L = Math.hypot(x1 - x0, y1 - y0), a = [(x1 - x0) / L, (y1 - y0) / L], nn = [-a[1], a[0]], pts = [];
          for (let i = 0; i <= n * 24; i++) { const u = i / (n * 24), th = 2 * Math.PI * n * u, s = u * L + r * .5 * Math.sin(th), k = r * Math.cos(th) - r * (1 - u) * 0 ;
            pts.push([x0 + a[0] * s + nn[0] * k, y0 + a[1] * s + nn[1] * k]); }
          const d = poly(pts); line(g, d, '#8a1f2c', 13); line(g, d, '#e9748a', 8); };
        helix(-130, 74, -130, -62, 4.5, 20);
        helix(-66, -100, 64, -100, 4.5, 18);
        const strand = (x, y0, y1) => { const s = Math.sign(y1 - y0), hy = y1 - s * 26;
          part(g, poly([[x - 11, y0], [x + 11, y0], [x + 11, hy], [x + 21, hy], [x, y1], [x - 21, hy], [x - 11, hy]]) + ' Z', '#f3c33b', '#8a6a10', 2.6); };
        strand(110, -48, 86); strand(70, 84, -48); strand(30, -46, 88);
        line(g, 'M-52 -110 C-20 -118 20 -118 50 -112', '#ffffff', 3, { opacity: .5 });
      }
      caption(g, 132, t);
      return g;
    },

    // "mitosis cx cy size k=interphase|prophase|metaphase|anaphase|telophase|daughters | label"
    mitosis: ([cx, cy, S = 220], o, t, parent) => {
      const g = base(parent, cx, cy, S, 220, o), k = o.k || 'metaphase', R = '#e9748a', B = '#5d93d6';
      const cellF = '#fde2c4', cellI = '#b5652d', nF = '#ecdcf8', nI = '#6b3f8a';
      const poles = () => { line(g, 'M-86 -8 L-86 8 M-94 0 L-78 0 M-92 -6 L-80 6 M-92 6 L-80 -6 M86 -8 L86 8 M94 0 L78 0 M92 -6 L80 6 M92 6 L80 -6', '#c97a10', 2.4); };
      const chromatin = (x, y, c) => line(g, `M${x - 14} ${y - 6} q5 -8 10 0 t10 0 M${x - 10} ${y + 8} q5 6 10 0 t10 0`, c, 2.2);
      if (k === 'telophase') {
        part(g, 'M0 -36 C-20 -70 -100 -76 -104 0 C-100 76 -20 70 0 36 C20 70 100 76 104 0 C100 -76 20 -70 0 -36 Z', cellF, cellI, 3.2);
        for (const x of [-54, 54]) { part(g, E(x, 0, 28, 24), nF, nI, 2.4); chromatin(x, 0, x < 0 ? R : B); }
      } else if (k === 'daughters') {
        for (const x of [-58, 58]) { part(g, E(x, 0, 50, 46), cellF, cellI, 3.2); part(g, E(x, 0, 21, 18), nF, nI, 2.2); chromatin(x, 0, x < 0 ? R : B); }
      } else {
        part(g, E(0, 0, k === 'anaphase' ? 104 : 96, k === 'anaphase' ? 74 : 80), cellF, cellI, 3.2);
        if (k === 'interphase') { part(g, E(0, 0, 44, 38), nF, nI, 2.6); chromatin(-12, -10, R); chromatin(10, 14, B); part(g, E(18, -12, 8), '#9b6fc0', nI, 1.8); }
        if (k === 'prophase') { fillp(g, E(0, 0, 48, 42), nF); line(g, E(0, 0, 48, 42), nI, 2.4, { 'stroke-dasharray': '8 7' }); poles();
          [[-18, -14, R, 20], [16, -16, B, -30], [-14, 18, B, 60], [20, 14, R, -10]].forEach(([x, y, c, r]) => miniX(g, x, y, .6, c, r)); }
        if (k === 'metaphase') { poles(); const ys = [-42, -14, 14, 42];
          line(g, ys.map(y => `M-86 0 L-6 ${y} M86 0 L6 ${y}`).join(' '), '#9aa3b2', 1.6);
          ys.forEach((y, i) => miniX(g, 0, y, .55, i % 2 ? B : R, 90)); }
        if (k === 'anaphase') { poles(); const ys = [-36, -12, 12, 36];
          line(g, ys.map(y => `M-86 0 L-44 ${y} M86 0 L44 ${y}`).join(' '), '#9aa3b2', 1.6);
          ys.forEach((y, i) => { const c = i % 2 ? B : R; line(g, `M-30 ${y - 9} L-44 ${y} L-30 ${y + 9} M30 ${y - 9} L44 ${y} L30 ${y + 9}`, c, 6.5); }); }
      }
      caption(g, 112, t);
      return g;
    },

    // "meiosis cx cy width | label" — one cell → two → four, halving the chromosomes
    meiosis: ([cx, cy, Wd = 400], o, t, parent) => {
      const g = base(parent, cx, cy, Wd, 400, o), R = '#e9748a', B = '#5d93d6', cf = '#fde2c4', ci = '#b5652d';
      part(g, E(-150, 0, 48), cf, ci, 3); miniX(g, -164, 0, .7, R); miniX(g, -136, 0, .7, B);
      for (const s of [-1, 1]) arrow(g, `M-98 ${s * 12} L-60 ${s * 40}`, -60, s * 40, -98, s * 12, '#8a96a3', 2.6);
      [[-55, R], [55, B]].forEach(([y, c]) => { part(g, E(-20, y, 36), cf, ci, 3); miniX(g, -20, y, .6, c); });
      [[-55, -110, -38, R], [55, 38, 110, B]].forEach(([y0, ya, yb2, c]) => {
        for (const y of [ya, yb2]) { arrow(g, `M18 ${y0 + (y - y0) * .2} L100 ${y - (y - y0) * .2}`, 100, y - (y - y0) * .2, 18, y0 + (y - y0) * .2, '#8a96a3', 2.4);
          part(g, E(132, y, 27), cf, ci, 2.8); line(g, `M132 ${y - 10} L132 ${y + 10}`, c, 7); } });
      if (t) label(g, -150, 80, t, LC, 24, 'middle');
      return g;
    },

    // "bacterium cx cy length rot=deg" — rod bacterium with flagellum, DNA loop, pili (loop sway swims)
    bacterium: ([cx, cy, L = 280], o, t, parent) => {
      const g = base(parent, cx, cy, L, 280, o);
      line(g, 'M48 0 C58 -16 68 -16 78 0 S98 16 108 0 S128 -16 138 0', '#3c7a2a', 2.8);
      let pili = ''; for (let x = -100; x <= 10; x += 22) pili += `M${x} -34 L${x - 4} -45 M${x + 8} 34 L${x + 12} 45 `;
      line(g, pili, '#3c7a2a', 1.6);
      part(g, 'M-100 -34 L14 -34 A34 34 0 0 1 14 34 L-100 34 A34 34 0 0 1 -100 -34 Z', '#a8d98a', '#3c7a2a', 3.2);
      line(g, 'M-100 -26 L14 -26 A26 26 0 0 1 14 26 L-100 26 A26 26 0 0 1 -100 -26 Z', '#6aa84f', 1.8);
      line(g, 'M-80 -4 C-70 -18 -55 10 -45 -6 S-25 12 -15 -4 S0 -14 -5 6 S-40 16 -60 8 S-85 10 -80 -4', '#3a5fa8', 2.4);
      const r = [[-112, -8], [-100, 12], [-30, 16], [6, -14], [22, 10], [-60, -16]].map(([x, y]) => E(x, y, 3.2)).join('');
      fillp(g, r, '#2c4f8a'); line(g, r, '#2c4f8a', 1);
      line(g, 'M-96 -22 L4 -22', '#ffffff', 4, { opacity: .55 });
      return g;
    },

    // "virus cx cy size" — many-sided capsid with spikes
    virus: ([cx, cy, S = 200], o, t, parent) => {
      const g = base(parent, cx, cy, S, 210, o), P = (r, deg) => [r * Math.cos(deg * Math.PI / 180), r * Math.sin(deg * Math.PI / 180)];
      let sp = '', knobs = '';
      for (let k = 0; k < 12; k++) { const a = k * 30 + 15, [x1, y1] = P(56, a), [x2, y2] = P(84, a), [x3, y3] = P(90, a); sp += `M${x1} ${y1} L${x2} ${y2} `; knobs += E(x3, y3, 7); }
      line(g, sp, '#5b3a8a', 3);
      fillp(g, knobs, '#e04b3a'); line(g, knobs, '#8a2a1a', 1.8);
      const hex = [30, 90, 150, 210, 270, 330].map(a => P(62, a)), inr = [90, 210, 330].map(a => P(26, a));
      part(g, poly(hex) + ' Z', '#c6a7e8', '#5b3a8a', 3.2);
      const link = { 0: [30, 90, 150], 1: [150, 210, 270], 2: [270, 330, 30] };
      let f = poly(inr) + ' Z ';
      inr.forEach(([x, y], i) => link[i].forEach(a => { const [hx, hy] = P(62, a); f += `M${x.toFixed(1)} ${y.toFixed(1)} L${hx.toFixed(1)} ${hy.toFixed(1)} `; }));
      line(g, f, '#7b5aa8', 1.8);
      caption(g, 130, t);
      return g;
    },

    // "antibody cx cy size rot=deg" — Y-shaped antibody: heavy chains blue, light chains orange
    antibody: ([cx, cy, S = 200], o, t, parent) => {
      const g = base(parent, cx, cy, S, 200, o);
      const stem = grp(g, 0, -8, 1, 180); part(stem, cap(92, 14), '#5d93d6', '#1f4f8f', 3); line(stem, 'M0 4 L0 -84', '#1f4f8f', 1.6);
      for (const s of [-1, 1]) {
        const a = grp(g, 0, -8, 1, s * 38);
        part(a, cap(104, 11), '#5d93d6', '#1f4f8f', 3);
        part(grp(a, s * 22, -40), cap(62, 9), '#f4a531', '#a35f0c', 2.6);
        line(a, 'M0 -36 L' + (s * 13) + ' -36 M0 -50 L' + (s * 13) + ' -50', '#1f4f8f', 1.8);
      }
      line(g, 'M-8 -2 L8 -2 M-8 6 L8 6', '#1f4f8f', 1.8);
      caption(g, 116, t);
      return g;
    },

    // "phagocyte cx cy size" — white blood cell engulfing a bacterium (loop beat)
    phagocyte: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 300, o);
      const out = 'M-120 10 C-130 -60 -60 -110 10 -100 C60 -95 90 -80 100 -60 C110 -45 140 -55 150 -40 C158 -28 140 -22 120 -28 C100 -32 80 -20 80 -8 C80 6 100 14 120 10 C140 8 158 14 150 28 C140 44 110 34 100 50 C80 90 20 110 -40 100 C-100 90 -115 60 -120 10 Z';
      part(g, out, '#e6e3f7', '#5a5aa0', 3.4);
      let gr = ''; for (const [x, y] of [[-90, -40], [-10, -70], [40, -60], [20, 70], [-80, 60], [60, 30], [-100, 20], [10, -40]]) gr += E(x, y, 3.5);
      fillp(g, gr, '#b9a7e3'); line(g, gr, '#8a78c0', 1);
      for (const [x, y, rx, ry] of [[-72, -12, 26, 20], [-42, -36, 24, 18], [-36, 14, 22, 18]]) part(g, E(x, y, rx, ry), '#9b7fd4', '#4f3a8a', 2.4);
      part(g, E(118, -9, 26, 11), '#a8d98a', '#3c7a2a', 2.6);
      line(g, 'M144 -9 C152 -16 158 -2 166 -9', '#3c7a2a', 2);
      part(g, E(20, 44, 24, 20), '#f2eefc', '#5a5aa0', 2);
      part(g, E(20, 44, 10, 5), '#cfe0a8', '#6aa84f', 1.6);
      caption(g, 140, t);
      return g;
    },

    // "enzyme cx cy size k=apart|fit|split lab=1" — lock-and-key: substrate and active site
    enzyme: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 300, o), k = o.k || 'apart';
      part(g, 'M-120 30 C-128 -20 -95 -52 -50 -52 L-30 -52 L0 -12 L30 -52 L50 -52 C95 -52 128 -20 120 30 C112 80 70 92 0 92 C-70 92 -112 80 -120 30 Z', '#7fb7ea', '#2b5c99', 3.2);
      line(g, 'M-96 -20 C-80 -40 -60 -44 -46 -44', '#ffffff', 6, { opacity: .5 });
      const sub = 'M-28 -52 L0 -14 L28 -52 L28 -86 Q28 -92 22 -92 L-22 -92 Q-28 -92 -28 -86 Z';
      if (k === 'split') {
        part(grp(g, -40, -58, 1, -20), 'M-28 -52 L0 -14 L0 -92 L-22 -92 Q-28 -92 -28 -86 Z', '#f4a531', '#a35f0c', 3);
        part(grp(g, 40, -58, 1, 20), 'M28 -52 L0 -14 L0 -92 L22 -92 Q28 -92 28 -86 Z', '#f4a531', '#a35f0c', 3);
      } else part(grp(g, 0, k === 'fit' ? -2 : -58), sub, '#f4a531', '#a35f0c', 3);
      if (o.lab && showLab(o)) { label(g, 0, 50, 'Enzyme', '#1f4f8f', 26, 'middle'); label(g, 40, k === 'fit' ? -70 : -126, k === 'split' ? '' : 'Substrate', TXT.orange, 22); }
      caption(g, 132, t);
      return g;
    },

    // "microscope cx cy height" — light microscope, side view
    microscope: ([cx, cy, H = 300], o, t, parent) => {
      const g = base(parent, cx, cy, H, 300, o), metal = '#5a6878', dk = '#2f3a46';
      part(g, 'M-44 83 L-36 83 L-36 124 L-44 124 Z', metal, dk, 2);
      part(g, 'M-26 -98 C20 -108 58 -70 56 -10 L56 124 L30 124 L30 -6 C30 -50 10 -72 -26 -70 Z', '#7d8ea3', '#3f4a57', 3);
      part(g, 'M-100 150 L100 150 L100 136 Q100 124 86 124 L-86 124 Q-100 124 -100 136 Z', metal, dk, 3);
      part(g, 'M-54 -115 L-26 -115 L-26 -40 L-54 -40 Z', '#9aa8b8', dk, 3);
      part(g, 'M-50 -142 L-30 -142 L-30 -115 L-50 -115 Z', metal, dk, 3);
      part(g, E(-40, -142, 10, 3), '#bfe3f5', dk, 1.6);
      part(g, 'M-60 -40 L-20 -40 L-26 -28 L-54 -28 Z', metal, dk, 2.6);
      part(g, 'M-50 -28 L-38 -28 L-40 -6 L-48 -6 Z', '#c9d1da', dk, 2.2);
      part(g, 'M-34 -28 L-24 -28 L-16 -12 L-24 -9 Z', '#c9d1da', dk, 2.2);
      part(g, 'M-110 6 L40 6 L40 18 L-110 18 Z', '#3f4a57', '#232b33', 2.6);
      part(g, 'M-75 1 L-5 1 L-5 6 L-75 6 Z', '#cfeaf7', '#5a8aa8', 1.6);
      part(g, E(43, 46, 15), '#c9d1da', dk, 2.6); line(g, E(43, 46, 6), dk, 2);
      line(g, 'M-40 54 L-40 24 M-48 54 L-46 24 M-32 54 L-34 24', '#f3c33b', 2.2);
      part(g, E(-40, 70, 13), '#ffd84a', '#b88a00', 2.4);
      line(g, 'M-50 -110 L-50 -46', '#ffffff', 3, { opacity: .55 });
      return g;
    },

    // "petridish cx cy size" — dish of agar with bacterial colonies
    petridish: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 300, o);
      fillp(g, 'M-140 0 L-140 16 A140 70 0 0 0 140 16 L140 0 A140 70 0 0 1 -140 0 Z', '#d5e6ee');
      fillp(g, E(0, 0, 140, 70), '#eef6fa');
      fillp(g, E(0, 6, 128, 60), '#f5e6a8');
      line(g, 'M-140 0 L-140 16 A140 70 0 0 0 140 16 L140 0', '#6d8ea3', 2.8);
      line(g, E(0, 0, 140, 70), '#6d8ea3', 2.8);
      line(g, E(0, 6, 128, 60), '#c9b06a', 1.6);
      let outl = '';
      for (const [x, y, r, c] of [[-80, -8, 12, '#f4f1e8'], [-40, 22, 8, '#f3c33b'], [10, -18, 16, '#f4f1e8'], [60, 12, 10, '#e88a3a'], [92, -20, 7, '#f3c33b'],
        [-20, -32, 6, '#e88a3a'], [32, 32, 9, '#f4f1e8'], [-96, 26, 6, '#e88a3a'], [-58, -34, 7, '#f3c33b'], [70, -38, 6, '#f4f1e8'], [-4, 44, 7, '#f3c33b'], [108, 16, 6, '#f4f1e8']]) {
        const d = E(x, y, r, r * .6); fillp(g, d, c); outl += d; }
      line(g, outl, '#a08a5a', 1.5);
      line(g, 'M-110 -30 C-80 -56 -30 -66 10 -66', '#ffffff', 4, { opacity: .8 });
      caption(g, 120, t);
      return g;
    },

    // "rootsystem cx cy size k=tap|fibrous" — seedling shoot above soil, roots below
    rootsystem: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 300, o);
      fillp(g, 'M-150 -40 H150 V140 H-150 Z', '#d9b98c', { opacity: .6 });
      line(g, 'M-150 -40 Q-75 -46 0 -40 T150 -40', '#8a6a3e', 3);
      line(g, 'M0 -40 L0 -122', '#2f6b21', 4);
      for (const s of [-1, 1]) part(grp(g, 0, s < 0 ? -98 : -116, 1).appendChild(mk('g', { transform: `scale(${s} 1)` })), 'M0 0 C-20 -25 -50 -20 -55 -5 C-40 5 -15 5 0 0 Z', '#7cc25a', '#2f6b21', 2.6);
      if (o.k === 'fibrous') {
        let d = '';
        for (let i = 0; i < 9; i++) { const a = (-64 + i * 16) * Math.PI / 180, L = 130 + (i % 3) * 18, ex = L * Math.sin(a), ey = -40 + L * Math.cos(a);
          d += `M0 -40 Q${ex * .4 + (i % 2 ? 10 : -10)} ${-40 + (ey + 40) * .5} ${ex.toFixed(1)} ${ey.toFixed(1)} `; }
        line(g, d, '#a87a4a', 3);
      } else {
        line(g, 'M0 -40 C3 10 -4 60 0 130', '#a87a4a', 6);
        line(g, 'M0 -10 C-25 0 -50 10 -70 30 M0 -4 C25 6 50 16 76 40 M-1 30 C-25 40 -45 55 -60 80 M1 40 C25 50 45 65 58 95 M0 75 C-15 85 -28 100 -35 118 M0 85 C15 95 26 110 30 125', '#a87a4a', 3);
        line(g, 'M-50 12 L-54 4 M-60 22 L-66 18 M50 18 L54 10 M62 28 L68 24 M-40 58 L-46 54 M40 64 L46 60', '#a87a4a', 1.4);
      }
      caption(g, 168, t);
      return g;
    },

    // "stemcut cx cy size k=dicot|monocot lab=1" — stem cross-section with vascular bundles
    stemcut: ([cx, cy, S = 260], o, t, parent) => {
      const g = base(parent, cx, cy, S, 260, o), mono = o.k === 'monocot';
      part(g, E(0, 0, 120), '#bfe29a', '#3c7a2a', 3.6);
      line(g, E(0, 0, 112), '#7cbf5a', 1.6);
      if (!mono) part(g, E(0, 0, 48), '#eef7d9', '#9cc77e', 1.6);
      const bundle = (x, y, rot, s) => { const b = grp(g, x, y, s, rot);
        part(b, E(0, -12, 14, 9), '#f4a531', '#a35f0c', 2); part(b, E(0, 8, 12, 11), '#5d93d6', '#1f4f8f', 2); line(b, 'M-12 -2 L12 -2', '#2f6b21', 1.6); };
      if (mono) for (const [x, y] of [[0, -88], [-52, -66], [52, -66], [-84, -14], [84, -14], [-70, 46], [70, 46], [-26, 84], [30, 84], [-34, -24], [34, -24], [0, 22], [-36, 30], [38, 30], [0, -50]]) bundle(x, y, 0, .62);
      else for (let k = 0; k < 8; k++) { const a = k * 45 - 90; bundle(78 * Math.cos(a * Math.PI / 180), 78 * Math.sin(a * Math.PI / 180), a + 90, 1); }
      if (o.lab && showLab(o)) {
        if (mono) { tag(g, 6, -94, 150, -100, 'Phloem'); tag(g, 6, -82, 150, -66, 'Xylem'); }
        else { tag(g, 10, -92, 150, -100, 'Phloem'); tag(g, 10, -70, 150, -62, 'Xylem'); label(g, 0, 8, 'Pith', LC, 20, 'middle'); }
        tag(g, 116, 30, 150, 40, 'Epidermis');
      }
      caption(g, 150, t);
      return g;
    },

    // "flowerparts cx cy size lab=1" — flower side view: petals, stamens, pistil, sepals
    flowerparts: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 300, o), mir = (d, fill, ink, w) => { part(g, d, fill, ink, w); part(mk('g', { transform: 'scale(-1 1)' }, g), d, fill, ink, w); };
      line(g, 'M0 150 C-4 100 4 60 0 30', '#2f6b21', 5);
      part(g, 'M-2 100 C-30 80 -60 85 -70 100 C-50 112 -20 110 -2 100 Z', '#7cc25a', '#2f6b21', 2.6);
      part(g, 'M-20 0 C-40 -50 -30 -110 0 -125 C30 -110 40 -50 20 0 Z', '#f8c3d0', '#b0405e', 2.6);
      mir('M-6 26 C-30 26 -48 14 -56 0 C-36 4 -18 12 -4 20 Z', '#7cc25a', '#2f6b21', 2.4);
      mir('M-8 20 C-60 10 -110 -40 -100 -90 C-80 -100 -40 -70 -14 -10 Z', '#f39ab0', '#b0405e', 3);
      part(g, E(0, 28, 18, 9), '#7cc25a', '#2f6b21', 2.4);
      line(g, 'M-12 0 C-24 -30 -34 -50 -42 -68 M12 0 C24 -30 34 -50 42 -68 M-8 -2 C-14 -30 -18 -45 -22 -56 M8 -2 C14 -30 18 -45 22 -56', '#9a8a3a', 2.2);
      for (const [x, y, r] of [[-44, -76, -25], [44, -76, 25], [-23, -64, -15], [23, -64, 15]]) part(grp(g, x, y, 1, r), E(0, 0, 6, 10), '#ffd84a', '#b88a00', 2);
      line(g, 'M0 -8 L0 -78', '#4f9a35', 4);
      part(g, E(0, -84, 10, 7), '#b6e07a', '#2f6b21', 2.2);
      part(g, E(0, 8, 15, 17), '#9fd37a', '#2f6b21', 2.4);
      const ov = E(-5, 8, 3.5) + E(5, 3, 3.5) + E(2, 15, 3.5); fillp(g, ov, '#fff6d0'); line(g, ov, '#8a7a3a', 1.2);
      if (o.lab && showLab(o)) {
        tag(g, -84, -60, -150, -40, 'Petal'); tag(g, -48, -84, -150, -110, 'Stamen'); tag(g, 10, -88, 130, -110, 'Stigma');
        tag(g, 14, 10, 130, 0, 'Ovary'); tag(g, 46, 6, 130, 40, 'Sepal');
      }
      return g;
    },

    // "seedling cx cy size k=seed|sprout|plant" — germination: seed in soil, sprouting, young plant
    seedling: ([cx, cy, S = 300], o, t, parent) => {
      const g = base(parent, cx, cy, S, 200, o), k = o.k || 'sprout';
      fillp(g, 'M-100 0 H100 V100 H-100 Z', '#d9b98c', { opacity: .6 });
      line(g, 'M-100 0 Q-50 -5 0 0 T100 0', '#8a6a3e', 3);
      line(g, 'M-80 30 l.1 0 M-62 76 l.1 0 M-40 20 l.1 0 M52 18 l.1 0 M70 64 l.1 0 M84 34 l.1 0 M-84 90 l.1 0 M40 92 l.1 0', '#8a6a3e', 4);
      const seed = (x, y, s, open) => { const h = grp(g, x, y, s);
        part(h, 'M-34 0 C-38 -24 -6 -28 12 -20 C36 -10 40 20 20 30 C0 40 -32 30 -34 0 Z', '#c98a4a', '#6e3f1c', 3);
        line(h, open ? 'M-26 -6 L-8 2 L-14 12 L2 20' : 'M-6 -4 Q4 4 14 0', '#6e3f1c', 2.2);
        line(h, 'M-24 -12 C-18 -20 -8 -22 0 -20', '#f0d0a8', 3, { opacity: .8 }); };
      const leaf = (x, y, rot, L, w, f = '#7cc25a') => { const h = grp(g, x, y, 1, rot);
        part(h, `M0 0 C${L * .3} ${-w} ${L * .8} ${-w} ${L} 0 C${L * .8} ${w} ${L * .3} ${w} 0 0 Z`, f, '#2f6b21', 2.6);
        line(h, `M4 0 L${L * .85} 0`, '#2f6b21', 1.6); };
      if (k === 'seed') {
        seed(0, 52, 1.5);
        line(g, 'M-20 -40 C-24 -32 -24 -28 -20 -27 C-16 -28 -16 -32 -20 -40 Z M20 -58 C16 -50 16 -46 20 -45 C24 -46 24 -50 20 -58 Z M44 -30 C40 -22 40 -18 44 -17 C48 -18 48 -22 44 -30 Z', '#4a8fd6', 2.2);
      } else if (k === 'sprout') {
        line(g, 'M10 74 C16 84 6 90 10 98 M12 84 L22 88 M8 92 L0 96', '#a87a4a', 3.6);
        line(g, 'M2 38 C-4 10 -6 -30 6 -54 C12 -64 22 -62 26 -52', '#4f9a35', 6);
        leaf(26, -52, -70, 30, 10, '#9fd37a'); leaf(26, -52, 10, 30, 10, '#9fd37a');
        seed(4, 58, 1.2, true);
      } else {
        line(g, 'M0 0 C-2 30 2 60 0 96 M0 26 C-14 34 -26 44 -36 60 M0 44 C14 52 26 60 32 76 M0 64 C-10 72 -16 80 -20 92 M-24 50 L-30 44 M20 60 L28 56', '#a87a4a', 3);
        line(g, 'M0 2 L0 -84', '#3c8a2a', 6);
        leaf(0, -26, 200, 42, 13, '#a6d872'); leaf(0, -26, -20, 42, 13, '#a6d872');
        leaf(0, -70, 205, 64, 19); leaf(0, -70, -25, 64, 19);
        part(g, 'M0 -82 C-5 -88 -4 -96 0 -100 C4 -96 5 -88 0 -82 Z', '#9fd37a', '#2f6b21', 2);
      }
      caption(g, 128, t);
      return g;
    },

    // "pollen cx cy size" — spiky pollen grain with pores
    pollen: ([cx, cy, S = 200], o, t, parent) => {
      const g = base(parent, cx, cy, S, 160, o);
      let sp = ''; for (let k = 0; k < 28; k++) { const a = k * Math.PI * 2 / 28; sp += `M${58 * Math.cos(a)} ${58 * Math.sin(a)} L${74 * Math.cos(a)} ${74 * Math.sin(a)} `; }
      line(g, sp, '#b88a00', 2.6);
      part(g, E(0, 0, 60), '#ffd84a', '#b88a00', 3);
      let dots = ''; for (const [x, y] of [[-30, -20], [-8, -38], [20, -24], [36, 6], [12, 20], [-20, 14], [-38, 30], [4, 42], [30, 34], [-42, -4], [0, 0], [16, -6]]) dots += E(x, y, 3);
      fillp(g, dots, '#e0a800'); line(g, dots, '#c9930a', 1);
      for (const a of [-90, 30, 150]) part(grp(g, 38 * Math.cos(a * Math.PI / 180), 38 * Math.sin(a * Math.PI / 180), 1, a + 90), E(0, 0, 14, 5), '#fff3b8', '#b88a00', 2);
      line(g, 'M-38 -32 C-28 -44 -14 -50 0 -50', '#ffffff', 4, { opacity: .7 });
      caption(g, 100, t);
      return g;
    },

    // "stoma cx cy size k=open|closed" — leaf pore between two guard cells
    stoma: ([cx, cy, S = 260], o, t, parent) => {
      const g = base(parent, cx, cy, S, 260, o), gp = o.k === 'closed' ? 2 : 18, c = -2.4 * gp;
      fillp(g, rr(-130, -115, 260, 230, 16), '#e3f2d3');
      line(g, 'M-130 -50 L-80 -60 L-70 -115 M-80 -60 L-85 55 L-130 45 M-85 55 L-72 115 M130 -50 L80 -60 L70 -115 M80 -60 L85 55 L130 45 M85 55 L72 115', '#9cbf86', 2);
      line(g, rr(-130, -115, 260, 230, 16), '#7aa866', 2.4);
      part(g, `M0 -95 C${c} -50 ${c} 50 0 95 C${-c} 50 ${-c} -50 0 -95 Z`, '#5a4a3a', '#3a2a1a', 2);
      for (const s of [-1, 1]) { const h = mk('g', { transform: `scale(${s} 1)` }, g);
        part(h, `M0 -95 C-95 -95 -95 95 0 95 C${c} 50 ${c} -50 0 -95 Z`, '#7cc25a', '#2f6b21', 3);
        const cl = E(-56, -42, 7, 4.5) + E(-60, 0, 7, 4.5) + E(-56, 42, 7, 4.5); fillp(h, cl, '#2f7d27'); line(h, cl, '#1f4f17', 1.2); }
      caption(g, 142, t);
      return g;
    },

    // "vessels cx cy height lab=0" — xylem (water up) and phloem (sugar both ways), labelled
    vessels: ([cx, cy, H = 300], o, t, parent) => {
      const g = base(parent, cx, cy, H, 320, o);
      fillp(g, 'M-90 -130 H-30 V130 H-90 Z', '#d6ebf9');
      fillp(g, 'M20 -130 H80 V130 H20 Z', '#fde7cf'); fillp(g, 'M84 -130 H102 V130 H84 Z', '#f8d3a8');
      let sp = ''; for (let y = -120; y <= 130; y += 20) sp += `M-90 ${y} L-30 ${y - 16} `;
      line(g, sp, '#7fb7ea', 2);
      line(g, 'M-90 -130 V130 M-30 -130 V130', '#1f4f8f', 3);
      line(g, 'M20 -130 V130 M80 -130 V130 M84 -130 V130 M102 -130 V130', '#a35f0c', 3);
      line(g, 'M20 -65 H80 M20 0 H80 M20 65 H80', '#a35f0c', 3, { 'stroke-dasharray': '5 5' });
      const nu = E(93, -95, 4) + E(93, -30, 4) + E(93, 35, 4) + E(93, 100, 4); fillp(g, nu, '#a35f0c'); line(g, nu, '#a35f0c', 1);
      arrow(g, 'M-60 112 L-60 -112', -60, -112, -60, -90, '#2b6cc4', 3.4);
      arrow(g, 'M40 -100 L40 100', 40, 100, 40, 80, '#d27b0c', 3);
      arrow(g, 'M62 100 L62 -100', 62, -100, 62, -80, '#d27b0c', 3);
      if (showLab(o)) { label(g, -60, -142, 'Xylem', TXT.blue, 26, 'middle'); label(g, 58, -142, 'Phloem', TXT.orange, 26, 'middle');
        label(g, -60, 158, 'water', TXT.blue, 20, 'middle'); label(g, 58, 158, 'sugar', TXT.orange, 20, 'middle'); }
      return g;
    },

    // "punnett cx cy size | Bb x Bb" — 2×2 Punnett square from two parents' alleles
    punnett: ([cx, cy, S = 260], o, t, parent) => {
      const g = base(parent, cx, cy, S, 220, o), m = (t || 'Bb x Bb').match(/(\w\w)\s*[x×*]\s*(\w\w)/i), [p1, p2] = m ? [m[1], m[2]] : ['Bb', 'Bb'];
      const cells = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const combo = [p1[c], p2[r]].sort().join(''), dom = combo !== combo.toLowerCase();
        fillp(g, `M${-35 + c * 70} ${-35 + r * 70} h70 v70 h-70 Z`, dom ? '#cfe9a8' : '#f6d0c4'); cells.push([c, r, combo]); }
      line(g, 'M-35 -105 H105 V105 H-105 V-35 M-35 -105 V105 M35 -105 V105 M-105 -35 H105 M-105 35 H105', LC, 3);
      [...p1].forEach((a, i) => label(g, i * 70, -58, a, TXT.blue, 38, 'middle'));
      [...p2].forEach((a, i) => label(g, -70, i * 70 + 12, a, TXT.red, 38, 'middle'));
      for (const [c, r, combo] of cells) label(g, c * 70, r * 70 + 12, combo, LC, 34, 'middle');
      return g;
    },


    // "photosynth cx cy size" — sun, leaf, CO₂ and water in, oxygen and sugar out
    photosynth: ([cx, cy, S = 400], o, t, parent) => {
      const g = base(parent, cx, cy, S, 420, o);
      RECIPES.sun([-150, -100, 30], {}, '', g);
      RECIPES.beams([-112, -70, -50, -14], {}, '', g);
      RECIPES.leaf([30, 20, 230], { rot: -15 }, '', g);
      arrow(g, 'M-205 10 Q-150 0 -96 14', -96, 14, -130, 6, '#6c6c6c', 3);
      if (showLab(o)) label(g, -205, -6, 'CO₂', '#555', 24);
      arrow(g, 'M40 150 Q30 110 40 68', 40, 68, 34, 92, INK.blue, 3);
      if (showLab(o)) label(g, 52, 150, 'H₂O', TXT.blue, 24);
      arrow(g, 'M120 -40 Q150 -80 196 -110', 196, -110, 166, -96, INK.sky, 3);
      if (showLab(o)) label(g, 196, -124, 'O₂', TXT.sky, 24, 'end');
      arrow(g, 'M150 40 Q170 80 206 104', 206, 104, 180, 92, INK.orange, 3);
      if (showLab(o)) label(g, 206, 130, 'Sugar', TXT.orange, 24, 'end');
      return g;
    },

    // "amoeba cx cy size" — single-celled amoeba with pseudopods, nucleus, vacuoles (loop sway)
    amoeba: ([cx, cy, S = 260], o, t, parent) => {
      const g = base(parent, cx, cy, S, 260, o);
      const out = 'M-90 -10 C-120 -40 -100 -80 -60 -70 C-40 -100 10 -95 20 -70 C40 -90 100 -80 95 -40 C130 -30 125 20 95 25 C110 60 60 85 30 65 C10 95 -50 90 -55 60 C-95 70 -125 30 -90 -10 Z';
      part(g, out, '#cfe0f5', '#3a6aa8', 3.2);
      let gr = ''; for (const [x, y] of [[-70, 10], [-30, -50], [60, -50], [70, 0], [0, 40], [-20, 60], [90, 10], [-60, -40]]) gr += E(x, y, 3);
      fillp(g, gr, '#9fb7e0'); line(g, gr, '#7a9acb', 1);
      part(g, E(-10, 0, 22, 18), '#9b7fd4', '#4f3a8a', 2.6);
      part(g, E(48, -28, 14), '#eef6fd', '#3a6aa8', 2);
      part(g, E(-50, 30, 9), '#f3c33b', '#b88a00', 1.8); part(g, E(40, 30, 8), '#9fd37a', '#3c7a2a', 1.8); part(g, E(-44, -42, 7), '#f3c33b', '#b88a00', 1.8);
      caption(g, 120, t);
      return g;
    },
  });
})();
