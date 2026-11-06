// Whiteboard library — earth: earth science, weather and space. Catalogue: earth.txt.
(() => {
  // local helpers (wrapped so nothing leaks into other category files)
  const O = (r, x = 0, y = 0) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  const E = (rx, ry, x = 0, y = 0) => `M${x - rx} ${y} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
  const fl = (g, d, fill, ex = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...ex }, g);
  const part = (g, d, fill, ink, w = 3) => { fl(g, d, fill); line(g, d, ink, w); };
  const grp = (cx, cy, s, o, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${s})` }, parent);
  const clip = (g, d, name) => { const id = name + clipN++; mk('clipPath', { id }, g).append(mk('path', { d })); return mk('g', { 'clip-path': `url(#${id})` }, g); };
  const arrow = (g, d, x, y, ax, ay, col, w = 3) => { line(g, d, col, w); line(g, head(x, y, ax, ay, 9 + w * 2), col, w, { class: 'ink head' }); };
  const straight = (g, x1, y1, x2, y2, col, w = 3) => arrow(g, `M${x1} ${y1} L${x2} ${y2}`, x2, y2, x1, y1, col, w);
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const starD = (n, R, r, x = 0, y = 0) => { let d = ''; for (let i = 0; i < 2 * n; i++) { const a = (-90 + i * 180 / n) * Math.PI / 180, q = i % 2 ? r : R; d += `${i ? 'L' : 'M'}${(x + q * Math.cos(a)).toFixed(1)} ${(y + q * Math.sin(a)).toFixed(1)} `; } return d + 'Z'; };
  // scalloped (puffy) ellipse: clouds, smoke, canopies
  const puff = (rx, ry, n = 9, x = 0, y = 0, a0 = 0) => {
    const P = i => { const a = a0 + i * 2 * Math.PI / n; return [x + rx * Math.cos(a), y + ry * Math.sin(a)]; };
    let d = `M${P(0).map(v => v.toFixed(1)).join(' ')}`;
    for (let i = 1; i <= n; i++) { const [ax, ay] = P(i - 1), [bx, by] = P(i), rr = Math.hypot(bx - ax, by - ay) * .62; d += ` A${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`; }
    return d + ' Z';
  };
  const wavy = (x1, y1, x2, y2, n = 4, amp = 7) => {
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L; let d = `M${x1} ${y1}`;
    for (let i = 0; i < n; i++) { const s = (i + .5) / n, e = (i + 1) / n, k = i % 2 ? -amp : amp;
      d += ` Q${x1 + (x2 - x1) * s - uy * k} ${y1 + (y2 - y1) * s + ux * k} ${x1 + (x2 - x1) * e} ${y1 + (y2 - y1) * e}`; }
    return d;
  };
  const need = (K, k, what) => { if (!K[k]) throw new Error(`Unknown ${what} "${k}" (use ${Object.keys(K).join('|')})`); return K[k]; };
  const shadeBall = (g, r, name) => { const c = clip(g, O(r), name); fl(c, `M${-2 * r} ${-2 * r} h${4 * r} v${4 * r} h${-4 * r} Z ` + O(r * 1.05, -r * .28, -r * .28), '#0b1a33', { opacity: .2, 'fill-rule': 'evenodd' }); return c; };
  const showLab = o => o.lab !== '0' && o.labels !== '0';
  const sheen = (g, r) => line(g, `M${-r * .62} ${-r * .38} A${r * .75} ${r * .75} 0 0 1 ${-r * .2} ${-r * .72}`, '#ffffff', r * .07, { opacity: .7 });

  // the globe in r=100 units, reused by planet k=earth, tide, seasons, eclipse
  const globe100 = g => {
    fl(g, O(100), '#5aa7e6');
    const c = clip(g, O(100), 'globeC');
    for (const d of ['M-70 -55 C-50 -75 -20 -70 -15 -50 C-10 -35 -30 -25 -28 -10 C-26 5 -10 15 -15 35 C-20 55 -35 75 -42 70 C-50 60 -40 40 -50 25 C-60 10 -75 0 -78 -20 C-80 -35 -80 -45 -70 -55 Z',
                     'M20 -60 C40 -70 60 -60 55 -45 C70 -40 75 -25 65 -15 C70 0 60 20 50 40 C42 55 35 60 30 50 C25 35 30 20 20 10 C10 0 5 -15 15 -25 C10 -40 10 -52 20 -60 Z',
                     'M-60 92 C-30 82 30 82 60 92 L60 120 L-60 120 Z']) { fl(c, d, '#6dbb4a'); line(c, d, '#2c6a22', 2); }
    fl(c, `M-200 -200 h400 v400 h-400 Z ${O(108, -30, -30)}`, '#0b1a33', { opacity: .2, 'fill-rule': 'evenodd' });
    line(g, O(100), '#1f5fa8', 3.2);
    sheen(g, 100);
  };

  Object.assign(window.RECIPES, {
    // "globe cx cy r"
    globe: ([cx, cy, r = 120], o, t, parent) => {
      const g = grp(cx, cy, r / 100, o, parent); globe100(g);
      if (t) label(g, 0, 140, t, TXT.blue, 26, 'middle');
      return g;
    },

    // "earthlayers cx cy r labels=0" — cut-away Earth: crust, mantle, outer core, inner core
    earthlayers: ([cx, cy, r = 130], o, t, parent) => {
      const g = grp(cx, cy, r / 100, o, parent); globe100(g);
      const W = R => `M0 0 L0 ${-R} A${R} ${R} 0 0 1 ${R} 0 Z`;
      for (const [R, f, ink] of [[100, '#a8754a', '#5e3b1c'], [92, '#e0703a', '#8a3a18'], [55, '#f4a531', '#a8641a'], [30, '#ffe066', '#c98a10']]) { fl(g, W(R), f); line(g, W(R), ink, 2.4); }
      if (showLab(o)) for (const [pr, ly, s] of [[96, -88, 'Crust'], [74, -58, 'Mantle'], [42, -30, 'Outer core'], [12, -4, 'Inner core']]) {
        const p = pr * Math.SQRT1_2; line(g, `M${p} ${-p} L118 ${ly - 5}`, '#555', 1.6); label(g, 122, ly, s, '#333', 17);
      }
      return g;
    },

    // "plates cx cy width k=converge|diverge|slide" — two tectonic plates and how they move
    plates: ([cx, cy, w = 440], o, t, parent) => {
      const g = grp(cx, cy, w / 420, o, parent), red = '#c0392b', k = o.k || 'converge';
      const mantle = () => { part(g, 'M-210 70 L210 70 L210 140 L-210 140 Z', '#f0a35e', '#a8641a', 2.5); for (const x of [-150, -50, 60, 160]) line(g, `M${x} 120 q10 -14 20 0`, '#c97a10', 2); };
      need({
        converge: () => {
          // mantle below, then the thick continental plate (left), then the thin oceanic plate diving under it
          part(g, 'M-210 24 L210 24 L210 150 L-210 150 Z', '#f0a35e', '#a8641a', 2.5);
          fl(g, 'M-210 100 L210 100 L210 150 L-210 150 Z', '#e0702e', { opacity: .55 });
          for (const [x, y] of [[-170, 120], [-120, 88], [110, 80], [160, 118], [60, 128]]) line(g, `M${x} ${y} q12 -16 24 0`, '#c0561a', 2.2);
          fl(g, 'M30 -22 L210 -22 L210 0 L22 0 Z', '#7fc0ee'); line(g, 'M30 -22 H210', '#1f5fa8', 2.5);   // ocean
          for (const x of [80, 140, 190]) line(g, `M${x} -12 q7 -5 14 0`, '#d8eefc', 2);
          part(g, 'M-210 -10 L-6 -10 Q8 -6 14 2 Q-6 40 -40 76 L-210 76 Z', '#c79a62', '#5e3b1c', 3);   // continental crust
          line(g, 'M-210 30 Q-120 26 -26 34', '#8a6a3e', 2.2); fl(g, 'M-210 30 Q-120 26 -26 34 L-40 76 L-210 76 Z', '#8a6a3e', { opacity: .35 });
          part(g, 'M210 0 L36 0 Q6 4 -12 34 L-92 150 L-58 150 L10 50 Q34 32 210 32 Z', '#6f7f8c', '#2f3a45', 3);   // oceanic plate
          line(g, 'M210 10 L36 10 Q12 14 -4 38 L-80 150', '#9aa7b0', 2);                     // basalt top layer
          line(g, 'M-30 70 Q-60 40 -78 -6 L-82 -58', '#e04b3a', 6); line(g, 'M-30 70 Q-60 40 -78 -6 L-82 -58', '#ffd84a', 2);   // rising magma
          part(g, 'M-140 -10 L-94 -76 L-70 -76 L-24 -10 Z', '#9a7350', '#5e3b1c', 3);        // volcano
          part(g, 'M-94 -76 Q-82 -70 -70 -76 L-74 -60 Q-82 -56 -90 -60 Z', '#e04b3a', '#8a1f14', 2);
          part(g, 'M-195 -10 L-170 -40 L-150 -24 L-140 -10 Z', '#a0774c', '#5e3b1c', 2.5);   // smaller mountain
          straight(g, -205, -100, -150, -100, red, 4); straight(g, 205, -50, 140, -50, red, 4);
        },
        diverge: () => {
          mantle();
          part(g, 'M-22 70 L-22 4 Q0 -18 22 4 L22 70 Z', '#e04b3a', '#8a1f14');
          part(g, 'M-210 0 L-60 0 Q-38 -12 -22 -4 L-22 70 L-210 70 Z', '#9a8f84', '#4a423b');
          part(g, 'M210 0 L60 0 Q38 -12 22 -4 L22 70 L210 70 Z', '#9a8f84', '#4a423b');
          straight(g, 0, 60, 0, 18, '#ffd84a', 3);
          straight(g, -70, -32, -170, -32, red, 4); straight(g, 70, -32, 170, -32, red, 4);
        },
        slide: () => {
          const f = 'L8 -30 L-6 10 L10 50 L-4 90 L0 110';
          part(g, `M-210 -70 L-10 -70 ${f} L-210 110 Z`, '#c79a62', '#5e3b1c');
          part(g, `M210 -70 L-10 -70 ${f} L210 110 Z`, '#b5a06e', '#5e3b1c');
          line(g, `M-10 -70 ${f}`, '#5e3b1c', 4);
          line(g, 'M-210 30 L-4 30', '#2b6cc4', 5); line(g, 'M6 -10 L210 -10', '#2b6cc4', 5);
          straight(g, -110, 90, -110, -50, red, 4); straight(g, 110, -50, 110, 90, red, 4);
        },
      }, k, 'plates')();
      if (t) label(g, 0, 175, t, '#333', 24, 'middle');
      return g;
    },

    // "volcano cx baseY width | label" — cross-section: cone, vent, lava, magma chamber
    volcano: ([cx, by, w = 340], o, t, parent) => {
      const g = grp(cx, by, w / 360, o, parent);
      part(g, 'M-200 0 L200 0 L200 130 L-200 130 Z', '#d9b68a', '#7a5a34', 2.5);
      for (const y of [45, 95]) line(g, `M-200 ${y} Q-100 ${y - 8} 0 ${y} T200 ${y}`, '#a8865c', 2);
      const cone = 'M-185 0 L-42 -186 Q-22 -176 0 -180 Q22 -176 42 -186 L185 0 Z';
      part(g, cone, '#9a7350', '#5e3b1c', 3.2);
      fl(g, 'M0 -180 Q22 -176 42 -186 L185 0 L40 0 Z', '#5e3b1c', { opacity: .25 });
      part(g, 'M-13 -178 Q-10 -90 -14 0 L-18 60 L18 60 L14 0 Q10 -90 13 -178 Z', '#e04b3a', '#8a1f14', 2.5);
      part(g, E(95, 36, 0, 85), '#e04b3a', '#8a1f14', 3);
      fl(g, E(55, 18, -8, 80), '#f4a531', { opacity: .8 });
      // two bold lava streams down the flanks, each with a bright core
      part(g, 'M-38 -184 Q-62 -134 -84 -100 Q-106 -64 -108 -24 Q-96 -14 -80 -22 Q-80 -60 -60 -94 Q-36 -134 -10 -182 Z', '#e8541e', '#8a1f14', 3);
      line(g, 'M-28 -178 Q-50 -134 -70 -100 Q-92 -62 -94 -28', '#ffd84a', 4);
      part(g, 'M12 -184 Q40 -142 64 -112 Q92 -78 100 -40 Q114 -34 124 -46 Q114 -88 86 -124 Q58 -160 40 -186 Z', '#e8541e', '#8a1f14', 3);
      line(g, 'M26 -182 Q50 -144 74 -116 Q100 -82 110 -46', '#ffd84a', 4);
      part(g, E(40, 9, 0, -184), '#ffb347', '#c0392b', 2.6);
      if (t) label(g, 102, 95, t, TXT.red, 24);
      return g;
    },

    // "plume cx baseY height" — rising smoke or steam puffs (loop rise)
    plume: ([cx, by, h = 190], o, t, parent) => {
      const g = grp(cx, by, h / 190, o, parent);
      for (const [x, y, r, a] of [[0, -20, 30, 0], [-14, -78, 40, .4], [10, -150, 52, .9]]) { fl(g, puff(r, r * .82, 8, x, y, a), o.c === 'white' ? '#f3f6f9' : '#b9bec4'); line(g, puff(r, r * .82, 8, x, y, a), '#7a808c', 2.6); }
      return g;
    },

    // "quakewaves cx cy size k=rings|seismograph"
    quakewaves: ([cx, cy, s = 300], o, t, parent) => {
      const g = grp(cx, cy, s / 300, o, parent);
      need({
        rings: () => {
          for (const d of ['M0 0 L-60 30 L-80 70 L-120 85', 'M0 0 L40 -50 L90 -60 L120 -100', 'M0 0 L50 40 L60 95', 'M0 0 L-45 -35 L-50 -90']) line(g, d, '#7a5a34', 3);
          [40, 78, 116, 150].forEach((R, i) => { let d = ''; for (let j = 0; j <= 48; j++) { const a = j * Math.PI / 24, q = R + (j % 2 ? 5 : -5); d += `${j ? 'L' : 'M'}${(q * Math.cos(a)).toFixed(1)} ${(q * Math.sin(a)).toFixed(1)} `; }
            line(g, d, '#c0392b', 3.4 - i * .5, { opacity: 1 - i * .2 }); });
          part(g, starD(6, 24, 10), '#ffd84a', '#c0392b', 2.6);
        },
        seismograph: () => {
          part(g, 'M-200 -90 L200 -90 L200 90 L-200 90 Z', '#fbf6e6', '#8a8a8a', 2.5);
          for (let y = -60; y <= 60; y += 30) line(g, `M-196 ${y} L196 ${y}`, '#e0d6bd', 1.5);
          let d = 'M-185 0';
          for (let x = -180; x <= 170; x += 5) { const a = 4 + 72 * Math.exp(-(((x + 10) / (x < -10 ? 26 : 60)) ** 2)); d += ` L${x} ${(x / 5) % 2 ? -a * (.6 + .4 * rnd(x)) : a * (.6 + .4 * rnd(x + 1))}`; }
          line(g, d, '#c0392b', 2.4);
          part(g, 'M172 -6 L196 0 L172 6 Z', '#333', '#333', 2);
        },
      }, o.k || 'rings', 'quakewaves')();
      if (t) label(g, 0, 128, t, '#333', 24, 'middle');
      return g;
    },

    // "folds cx cy width" — rock layers squeezed into folds by pushing arrows
    folds: ([cx, cy, w = 440], o, t, parent) => {
      const g = grp(cx, cy, w / 470, o, parent), Y = (x, b) => b - 55 * Math.cos(Math.PI * x / 170);
      const curve = (b, rev) => { const xs = []; for (let x = -170; x <= 170; x += 10) xs.push(x); if (rev) xs.reverse(); return xs.map((x, i) => `${i ? 'L' : ''}${x} ${Y(x, b).toFixed(1)}`).join(' '); };
      const B = [-60, -25, 10, 45, 80], C = ['#e8c58a', '#c98f5a', '#a8b07a', '#d9a56c'];
      for (let i = 0; i < 4; i++) fl(g, `M${curve(B[i])} L${curve(B[i + 1], true)} Z`, C[i]);
      for (const b of B) line(g, 'M' + curve(b), '#6b4a2a', b === B[0] || b === B[4] ? 3 : 2.2);
      line(g, `M-170 ${Y(-170, B[0])} L-170 ${Y(-170, B[4])}`, '#6b4a2a', 3); line(g, `M170 ${Y(170, B[0])} L170 ${Y(170, B[4])}`, '#6b4a2a', 3);
      straight(g, -232, 40, -182, 40, '#c0392b', 5); straight(g, 232, 40, 182, 40, '#c0392b', 5);
      if (t) label(g, 0, 170, t, '#333', 24, 'middle');
      return g;
    },

    // "rock cx cy size k=igneous|sedimentary|metamorphic | label"
    rock: ([cx, cy, s = 200], o, t, parent) => {
      const g = grp(cx, cy, s / 200, o, parent);
      // an angular, chipped hand sample (not a round blob, so it never reads as a planet)
      const out = 'M-96 34 L-84 -26 L-50 -62 L8 -72 L62 -54 L98 -12 L90 40 L44 68 L-36 70 Z', c = clip(g, out, 'rockC');
      need({
        igneous: () => { fl(c, out, '#5d6066'); for (let i = 0; i < 40; i++) fl(c, O(3 + 3 * rnd(i + 9), -90 + 185 * rnd(i), -70 + 140 * rnd(i + 50)), i % 3 ? '#ece6dc' : '#e7a3a3'); },
        sedimentary: () => {   // flat strata of different thickness, one pebbly layer, sand grains
          const ys = [-80, -52, -36, -10, 14, 34, 54, 80], cols = ['#e3c48e', '#b9844f', '#ead7ae', '#c9965e', '#a07a52', '#e3c48e', '#c9965e'];
          cols.forEach((f, i) => fl(c, `M-110 ${ys[i]} L110 ${ys[i] + 3} L110 ${ys[i + 1] + 3} L-110 ${ys[i + 1]} Z`, f));
          for (let i = 1; i < 7; i++) line(c, `M-110 ${ys[i]} L110 ${ys[i] + 3}`, '#6b4a2a', 2);
          for (let i = 0; i < 9; i++) part(c, E(5 + 3 * rnd(i), 3.5 + 2 * rnd(i + 3), -90 + 21 * i + 5 * rnd(i + 7), 24 + 4 * rnd(i + 11)), i % 2 ? '#d8d2c4' : '#b9b2a4', '#5e4a30', 1.6);
          for (let i = 0; i < 26; i++) fl(c, O(1.6, -95 + 190 * rnd(i + 20), (i % 2 ? -76 : -32) + 14 * rnd(i + 40)), '#8a6a3e');
        },
        metamorphic: () => { fl(c, out, '#8b8f99'); for (let i = 0; i < 7; i++) { const y = -90 + i * 28, d = `M-110 ${y} Q-60 ${y - 26} -20 ${y} T60 ${y} T140 ${y}`;
          line(c, d, i % 2 ? '#f1efe8' : '#d8a4b0', 8); line(c, d, '#5a5e68', 1.4); } },
      }, o.k || 'igneous', 'rock')();
      fl(g, 'M62 -54 L98 -12 L90 40 L44 68 L40 4 Z', '#000000', { opacity: .14 });            // shaded facet
      line(g, out, '#3a3a3a', 3.4);
      line(g, 'M62 -54 L40 4 L44 68 M40 4 L90 40', '#3a3a3a', 2);                              // chipped edges
      line(g, 'M-70 -24 L-44 -52 L4 -60', '#ffffff', 4, { opacity: .5 });
      if (t) label(g, 0, 110, t, '#333', 26, 'middle');
      return g;
    },

    // "fossil cx cy width" — rock layers with an ammonite and a fish skeleton
    fossil: ([cx, cy, w = 400], o, t, parent) => {
      const g = grp(cx, cy, w / 400, o, parent), ink = '#5e4a30';
      for (const [y1, y2, f] of [[-130, -112, '#7fbf5a'], [-112, -50, '#c9965e'], [-50, 40, '#e3c48e'], [40, 130, '#b9a27a']]) fl(g, `M-200 ${y1} L200 ${y1} L200 ${y2} L-200 ${y2} Z`, f);
      for (const y of [-112, -50, 40]) line(g, `M-200 ${y} Q-100 ${y - 5} 0 ${y} T200 ${y}`, '#8a6a3e', 2);
      line(g, 'M-200 -130 L200 -130 L200 130 L-200 130 Z', '#6b4a2a', 3);
      // ammonite
      fl(g, O(38, -80, -5), '#f1e3c2');
      let d = ''; for (let a = 0; a <= 4 * Math.PI; a += .2) { const r = 3 + 35 * a / (4 * Math.PI); d += `${a ? 'L' : 'M'}${(-80 + r * Math.cos(a)).toFixed(1)} ${(-5 + r * Math.sin(a)).toFixed(1)} `; }
      line(g, d, ink, 3);
      for (let i = 0; i < 14; i++) { const a = 2 * Math.PI + i * .44, r1 = 3 + 35 * (a - 2 * Math.PI) / (4 * Math.PI), r2 = 3 + 35 * a / (4 * Math.PI); line(g, `M${-80 + r1 * Math.cos(a)} ${-5 + r1 * Math.sin(a)} L${-80 + r2 * Math.cos(a)} ${-5 + r2 * Math.sin(a)}`, ink, 1.6); }
      // fish skeleton
      fl(g, 'M30 85 Q90 55 150 85 Q90 115 30 85 Z', '#d9c9a4', { opacity: .7 });
      line(g, 'M42 85 L150 85', ink, 3);
      for (let x = 60; x <= 138; x += 13) line(g, `M${x} 70 Q${x + 4} 85 ${x} 100`, ink, 2);
      line(g, 'M150 85 L175 68 L170 85 L175 102 Z', ink, 2.6);
      line(g, 'M30 85 Q36 74 48 72 M30 85 Q36 96 48 98', ink, 2.6); line(g, O(3, 40, 82), ink, 2);
      if (t) label(g, 0, 165, t, '#333', 24, 'middle');
      return g;
    },

    // "river cx cy width labels=1" — map view: winding river, meanders, delta into the sea
    river: ([cx, cy, w = 440], o, t, parent) => {
      const g = grp(cx, cy, w / 420, o, parent);
      part(g, 'M-210 -130 L210 -130 L210 130 L-210 130 Z', '#a8d77f', '#2c6a22', 2.5);
      part(g, 'M210 -70 Q150 -10 150 40 Q140 90 104 130 L210 130 Z', '#7fc0ee', '#1f5fa8', 2.5);
      part(g, 'M78 48 Q126 18 158 36 Q154 92 116 126 Q90 98 78 48 Z', '#efd9a0', '#b08a4a', 2);
      const r = 'M-205 -112 C-150 -112 -160 -40 -110 -40 C-60 -40 -72 -110 -22 -102 C28 -94 -10 0 30 22 C52 34 68 42 84 54';
      line(g, r, '#2f7fd6', 13); line(g, r, '#9fd0f5', 4);
      for (const d of ['M84 54 L156 44', 'M84 54 Q118 64 146 84', 'M84 54 Q102 88 122 116']) { line(g, d, '#2f7fd6', 6); line(g, d, '#9fd0f5', 2); }
      for (const [x, y] of [[-170, 50], [-140, 80], [-60, 60], [-90, 100], [140, -100], [100, -80]]) part(g, puff(14, 12, 6, x, y), '#4f9a36', '#24561c', 2);
      if (o.labels && showLab(o)) { label(g, -110, -12, 'Meander', '#24561c', 20, 'middle'); label(g, 60, 112, 'Delta', '#8a6414', 20, 'end'); }
      return g;
    },

    // "glacier cx baseY width" — ice flowing down a mountain, calving icebergs into water
    glacier: ([cx, by, w = 440], o, t, parent) => {
      const g = grp(cx, by, w / 420, o, parent);
      part(g, 'M-210 0 L-150 -170 L-115 -140 L-62 -205 L-10 -130 L50 -150 L110 -70 L130 -40 L130 0 Z', '#9aa7b0', '#4e5a64');
      part(g, 'M-150 -170 L-115 -140 L-62 -205 L-40 -168 L-90 -150 L-130 -140 Z', '#ffffff', '#7d93a0', 2);
      part(g, 'M10 -14 L210 -14 L210 60 L10 60 Z', '#7fc0ee', '#1f5fa8', 2.5);            // meltwater lake
      fl(g, 'M10 24 L210 24 L210 60 L10 60 Z', '#4f93d6', { opacity: .35 });
      const ice = 'M-132 -142 Q-86 -156 -54 -182 Q-8 -118 54 -96 Q110 -78 146 -70 L146 -14 Q90 -18 30 -36 Q-50 -62 -150 -112 Z';
      part(g, ice, '#f2fafe', '#2f72b8', 3.4);
      fl(g, 'M-150 -112 Q-50 -62 30 -36 Q90 -18 146 -14 L146 -32 Q80 -36 20 -56 Q-60 -86 -140 -124 Z', '#a8d4f2', { opacity: .7 });   // shadowed lower edge
      line(g, 'M-110 -132 Q-40 -100 30 -66 Q90 -44 146 -42', '#8a7a6a', 2.4, { 'stroke-dasharray': '7 6' });   // moraine stripe
      for (const [x, y] of [[-90, -136], [-50, -122], [-14, -98], [24, -80], [62, -66], [100, -58]]) line(g, `M${x - 7} ${y - 14} L${x} ${y} L${x + 7} ${y - 14}`, '#2f72b8', 2.6);   // crevasses
      line(g, 'M146 -70 V-14', '#2f72b8', 2.6);                                            // snout ice cliff
      fl(g, 'M150 -14 L210 -14 L210 34 L182 50 L154 26 Z', '#cfe9fb', { opacity: .75 });   // iceberg below water
      part(g, 'M154 -14 L160 -52 L180 -76 L200 -50 L208 -14 Z', '#f2fafe', '#2f72b8', 2.6);   // iceberg above water
      line(g, 'M180 -76 L174 -34', '#a8d4f2', 2);
      for (const x of [30, 70, 110]) line(g, `M${x} 10 q8 -5 16 0`, '#d8eefc', 2.4);
      if (t) label(g, 0, 60, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "dune cx baseY width" — desert sand dunes with ripples and a cactus
    dune: ([cx, by, w = 440], o, t, parent) => {
      const g = grp(cx, by, w / 420, o, parent);
      part(g, 'M-210 0 Q-140 -100 -40 -120 Q20 -90 80 -60 Q150 -110 210 -90 L210 0 Z', '#e8bf72', '#a8782e');
      fl(g, 'M-40 -120 Q20 -90 80 -60 Q60 -20 30 0 L-40 0 Z', '#b88a3e', { opacity: .35 });
      part(g, 'M-210 0 L-210 -30 Q-120 -70 -30 -40 Q60 -10 210 -30 L210 0 Z', '#f4d79e', '#b08a4a');
      for (const [x, y] of [[-160, -26], [-110, -30], [-60, -24], [0, -16], [70, -14], [130, -16]]) line(g, `M${x} ${y} q12 -6 24 0 t24 0`, '#c9a060', 2);
      const cac = 'M-9 0 L-9 -38 L-24 -38 Q-32 -38 -32 -46 L-32 -64 Q-32 -70 -27 -70 Q-22 -70 -22 -64 L-22 -50 L-9 -50 L-9 -84 Q-9 -94 0 -94 Q9 -94 9 -84 L9 -58 L22 -58 L22 -72 Q22 -78 27 -78 Q32 -78 32 -72 L32 -52 Q32 -46 26 -46 L9 -46 L9 0 Z';
      const c = mk('g', { transform: 'translate(130 -18) scale(1.15)' }, g);
      part(c, cac, '#5fae3a', '#24561c', 2.6); line(c, 'M0 -86 L0 -4', '#24561c', 1.6);
      if (t) label(g, 0, 36, t, '#8a6414', 24, 'middle');
      return g;
    },

    // "rainforest cx baseY width" — dense tall trees, layered canopy, hanging vines, big leaves
    rainforest: ([cx, by, w = 440], o, t, parent) => {
      const g = grp(cx, by, w / 420, o, parent);
      part(g, 'M-210 0 L210 0 L210 18 L-210 18 Z', '#7a5a34', '#4a3820', 2.4);
      const tree = (x, h, crx, cry, f) => {
        part(g, `M${x - 8} 0 Q${x - 5} ${-h / 2} ${x - 4} ${-h + 10} L${x + 4} ${-h + 10} Q${x + 5} ${-h / 2} ${x + 8} 0 Z`, '#8a5a30', '#4a3018', 2.4);
        part(g, puff(crx, cry, 10, x, -h), f, '#1f4a18', 2.6);
      };
      tree(0, 225, 80, 38, '#3c8a30'); tree(-140, 160, 66, 46, '#4f9a36'); tree(140, 170, 68, 44, '#2f7d27');
      tree(-65, 110, 52, 38, '#6dbb4a'); tree(75, 120, 54, 36, '#5aa83c');
      for (const [x, y, L] of [[-30, -200, 70], [30, -205, 90], [-120, -125, 60], [118, -135, 70]]) line(g, `M${x} ${y} q8 ${L / 4} 0 ${L / 2} t0 ${L / 2}`, '#2c6a22', 2.4);
      for (const [x, a] of [[-180, -60], [-170, -20], [175, 20], [165, 60], [-20, -30], [20, 30]]) {
        const l = mk('g', { transform: `translate(${x} 0) rotate(${a})` }, g);
        part(l, 'M0 0 Q-16 -30 0 -60 Q16 -30 0 0 Z', '#5fae3a', '#24561c', 2); line(l, 'M0 0 L0 -56', '#24561c', 1.4);
      }
      if (t) label(g, 0, 50, t, TXT.green, 24, 'middle');
      return g;
    },

    // "currents cx cy width" — world map with warm (red) and cold (blue) ocean currents (loop flow)
    currents: ([cx, cy, w = 460], o, t, parent) => {
      const g = grp(cx, cy, w / 440, o, parent);
      part(g, 'M-220 -120 L220 -120 L220 120 L-220 120 Z', '#a9d8f5', '#1f5fa8', 2.5);
      line(g, 'M-220 0 L220 0', '#7fb7ea', 1.5, { 'stroke-dasharray': '8 8' });
      for (const d of ['M-125 -105 L-60 -108 L-40 -85 L-55 -60 L-70 -40 L-80 -20 L-95 -28 L-110 -55 L-128 -75 Z', 'M-80 -5 L-55 0 L-38 20 L-48 50 L-62 85 L-72 92 L-70 55 L-85 25 Z',
                       'M5 -100 L40 -104 L45 -78 L28 -62 L55 -50 L68 -20 L58 22 L40 62 L30 60 L22 25 L2 5 L-2 -22 L15 -45 L2 -70 Z', 'M50 -104 L170 -108 L205 -85 L185 -55 L160 -42 L140 -20 L110 -30 L80 -40 L55 -62 Z',
                       'M150 35 L190 30 L205 55 L185 75 L152 65 Z']) part(g, d, '#a8d77f', '#2c6a22', 2.2);
      for (const [x, y, rx, ry, north] of [[-178, -55, 26, 30, 1], [-165, 50, 30, 34, 0], [-22, -42, 17, 26, 1], [-8, 50, 22, 30, 0], [100, 40, 30, 30, 0]]) {
        if (north) { arrow(g, `M${x} ${y + ry} A${rx} ${ry} 0 0 1 ${x} ${y - ry}`, x, y - ry, x - 10, y - ry, '#d9483c', 3); arrow(g, `M${x + 3} ${y - ry} A${rx} ${ry} 0 0 1 ${x + 3} ${y + ry}`, x + 3, y + ry, x + 13, y + ry, '#2b6cc4', 3); }
        else { arrow(g, `M${x} ${y - ry} A${rx} ${ry} 0 0 0 ${x} ${y + ry}`, x, y + ry, x - 10, y + ry, '#d9483c', 3); arrow(g, `M${x + 3} ${y + ry} A${rx} ${ry} 0 0 0 ${x + 3} ${y - ry}`, x + 3, y - ry, x + 13, y - ry, '#2b6cc4', 3); }
      }
      if (t) label(g, 0, 150, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "shorewave cx baseY width" — a curling wave breaking on a sandy beach
    shorewave: ([cx, by, w = 440], o, t, parent) => {
      const g = grp(cx, by, w / 420, o, parent);
      part(g, 'M-210 50 L-210 30 Q0 20 80 -8 Q140 -30 210 -40 L210 50 Z', '#f4d79e', '#b08a4a', 2.6);
      const sea = 'M-210 -12 Q-130 -14 -85 -38 Q-55 -118 5 -112 Q48 -104 42 -72 Q28 -88 6 -82 Q-18 -62 -14 -24 Q30 -14 80 -8 Q0 20 -210 30 Z';
      part(g, sea, '#5aa7e6', '#1f5fa8', 3);
      fl(g, 'M-85 -38 Q-55 -118 5 -112 Q48 -104 42 -72 Q28 -88 6 -82 Q-18 -62 -14 -24 Q-50 -20 -85 -38 Z', '#9fd4f7', { opacity: .8 });
      line(g, 'M-60 -96 Q-20 -122 30 -104', '#ffffff', 6, { opacity: .9 });
      for (const [x, y] of [[44, -96], [52, -82], [36, -116], [60, -104]]) line(g, O(3.5, x, y), '#ffffff', 2.5);
      line(g, 'M-14 -24 Q30 -14 80 -8', '#ffffff', 5, { opacity: .9 });
      for (const [x, y] of [[-190, 5], [-150, -2], [-120, 14]]) line(g, `M${x} ${y} q10 -6 20 0 t20 0`, '#d8eefc', 2.2);
      if (t) label(g, 0, 85, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "tide cx cy width | label" — Moon pulls Earth's ocean into two bulges
    tide: ([cx, cy, w = 380], o, t, parent) => {
      const g = grp(cx, cy, w / 380, o, parent);
      part(g, E(98, 72, -80, 0), '#bfe3f9', '#2b6cc4', 2.5);
      globe100(mk('g', { transform: 'translate(-80 0) scale(.6)' }, g));
      const m = mk('g', { transform: 'translate(175 0)' }, g);
      fl(m, O(30), '#cfcfc8'); for (const [x, y, r] of [[-9, -8, 7], [10, 6, 5], [-4, 14, 4]]) part(m, O(r, x, y), '#a9a9a0', '#77776e', 1.5); line(m, O(30), '#5f5f58', 2.8);
      straight(g, 135, 0, 34, 0, '#c0392b', 3.2);
      if (showLab(o)) label(g, 175, 56, 'Moon', '#555', 20, 'middle');
      if (t || showLab(o)) label(g, 86, -14, t || 'Pull', TXT.red, 20, 'middle');
      return g;
    },

    // "weatherfront cx baseY width k=cold|warm" — air masses meeting, cloud, and the map symbol line
    weatherfront: ([cx, by, w = 440], o, t, parent) => {
      const g = grp(cx, by, w / 420, o, parent), cold = (o.k || 'cold') === 'cold';
      if (!['cold', 'warm'].includes(o.k || 'cold')) throw new Error(`Unknown weatherfront "${o.k}" (use cold|warm)`);
      fl(g, 'M-210 -200 L210 -200 L210 0 L-210 0 Z', '#fde3dc');
      const wedge = cold ? 'M-210 0 L-210 -140 Q-150 -140 -80 -60 Q-40 -12 20 0 Z' : 'M210 0 L210 -110 Q100 -84 -120 0 Z';
      part(g, wedge, '#b9dbf6', '#2b6cc4', 2.6);
      line(g, 'M-210 0 L210 0', '#555', 3);
      if (cold) {
        straight(g, -195, -30, -105, -30, '#2b6cc4', 4);
        arrow(g, 'M80 -20 Q20 -40 0 -110', 0, -110, 4, -90, '#c0392b', 4);
        part(g, puff(60, 44, 9, 0, -160), '#a4adb9', '#5f6b7a', 2.6);
        for (const x of [-30, -10, 10, 30]) line(g, `M${x} -112 l-6 22`, '#2b6cc4', 2.4);
        part(g, 'M-210 30 L210 30', 'none', '#2b6cc4', 3);
        for (let x = -180; x < 210; x += 50) part(g, `M${x} 30 L${x + 12} 12 L${x + 24} 30 Z`, '#4f93d6', '#2b6cc4', 2);
      } else {
        arrow(g, 'M-190 -20 Q0 -80 150 -150', 150, -150, 130, -140, '#c0392b', 4);
        straight(g, 120, -30, 195, -30, '#2b6cc4', 4);
        part(g, puff(110, 18, 12, 40, -170), '#c5ccd6', '#5f6b7a', 2.4);
        part(g, 'M-210 30 L210 30', 'none', '#c0392b', 3);
        for (let x = -180; x < 210; x += 50) part(g, `M${x} 30 A12 12 0 0 1 ${x + 24} 30 Z`, '#e04b3a', '#c0392b', 2);
      }
      if (showLab(o)) { label(g, cold ? -200 : 200, cold ? -50 : -50, 'Cold air', TXT.blue, 20, cold ? 'start' : 'end'); label(g, cold ? 200 : -200, -176, 'Warm air', TXT.red, 20, cold ? 'end' : 'start'); }
      if (t) label(g, 0, 62, t, '#333', 24, 'middle');
      return g;
    },

    // "storm cx cy size" — dark thundercloud with a lightning bolt and rain
    storm: ([cx, cy, s = 300], o, t, parent) => {
      const g = grp(cx, cy, s / 300, o, parent);
      for (const x of [-110, -80, -50, 60, 90, 120]) line(g, `M${x} 30 l-10 34`, '#2b6cc4', 3);
      part(g, 'M-10 0 L-40 68 L-12 68 L-34 135 L38 44 L8 44 L30 0 Z', '#ffd84a', '#c97a10', 3);
      const cl = 'M-140 10 C-170 10 -170 -40 -130 -46 C-130 -90 -70 -100 -50 -70 C-40 -115 40 -118 50 -76 C70 -100 130 -88 128 -46 C168 -44 168 10 138 10 Z';
      part(g, cl, '#7d8796', '#3e4652', 3.2);
      line(g, 'M-110 -50 C-100 -76 -76 -82 -60 -70', '#c5ccd6', 4, { opacity: .8 });
      if (t) label(g, 0, 175, t, '#333', 24, 'middle');
      return g;
    },

    // "tornado cx baseY height" — funnel cloud with swirls and dust (loop sway)
    tornado: ([cx, by, h = 300], o, t, parent) => {
      const outer = grp(cx, by, h / 320, o, parent), g = mk('g', {}, outer); outer.anim = g;
      const hw = y => 6 + 104 * Math.pow(-y / 290, 1.7);
      let L = '', R = ''; for (let y = -290; y <= -8; y += 10) { const x = hw(y) + 8 * Math.sin(y / 30); L += `${L ? 'L' : 'M'}${(-x).toFixed(1)} ${y} `; R = `L${(x).toFixed(1)} ${y} ` + R; }
      part(g, L + R + 'Z', '#a3abb8', '#4e5866', 3);
      for (const y of [-260, -215, -170, -128, -90, -56]) { const x = hw(y) + 8 * Math.sin(y / 30); line(g, `M${-x} ${y} Q${x * .1} ${y + 14} ${x} ${y - 4}`, '#5f6b7a', 2.4); }
      part(g, puff(170, 26, 12, 0, -298), '#7d8796', '#3e4652', 2.8);
      part(g, puff(52, 14, 9, 0, -8), '#c9a36b', '#7a5a34', 2.4);
      for (const [x, y] of [[-60, -40], [58, -30], [-44, -70], [70, -60]]) line(g, `M${x} ${y} l6 -4`, '#6b4a2a', 3);
      if (t) label(g, 0, 40, t, '#333', 24, 'middle');
      return outer;
    },

    // "hurricane cx cy r" — top view: spiral cloud bands round a calm eye
    hurricane: ([cx, cy, r = 150], o, t, parent) => {
      const g = grp(cx, cy, r / 150, o, parent);
      fl(g, O(150), '#9fcdf0', { opacity: .6 });
      for (let k = 0; k < 3; k++) {
        let d = ''; for (let s = 0; s <= 1.0001; s += .04) { const a = -(k * 2 * Math.PI / 3 + s * 3.4), q = 20 + 128 * s; d += `${s ? 'L' : 'M'}${(q * Math.cos(a)).toFixed(1)} ${(q * Math.sin(a)).toFixed(1)} `; }
        line(g, d, '#f7f9fb', 30); line(g, d, '#6b7a8c', 3);
      }
      part(g, O(16), '#5aa7e6', '#1f5fa8', 2.6);
      if (t) label(g, 0, 182, t, '#333', 24, 'middle');
      return g;
    },

    // "snowflake cx cy r" — six-armed ice crystal with branches
    snowflake: ([cx, cy, r = 110], o, t, parent) => {
      const g = grp(cx, cy, r / 100, o, parent);
      let hex = ''; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; hex += `${i ? 'L' : 'M'}${(22 * Math.cos(a)).toFixed(1)} ${(22 * Math.sin(a)).toFixed(1)} `; }
      part(g, hex + 'Z', '#cfe8fb', '#4f93d6', 3);
      for (let i = 0; i < 6; i++) {
        const a = mk('g', { transform: `rotate(${i * 60 - 90})` }, g);
        line(a, 'M22 0 L100 0', '#3d7fd0', 5);
        for (const [x, L] of [[48, 22], [72, 16]]) line(a, `M${x + L * .8} ${-L} L${x} 0 L${x + L * .8} ${L}`, '#3d7fd0', 4);
        fl(a, 'M92 0 L100 -6 L108 0 L100 6 Z', '#cfe8fb'); line(a, 'M92 0 L100 -6 L108 0 L100 6 Z', '#3d7fd0', 2.4);
      }
      if (t) label(g, 0, 140, t, TXT.blue, 26, 'middle');
      return g;
    },

    // "rainbow cx baseY r" — seven colour bands with a cloud at each end
    rainbow: ([cx, by, r = 220], o, t, parent) => {
      const g = grp(cx, by, r / 200, o, parent), C = ['#e04b3a', '#f4a531', '#ffd84a', '#5fae3a', '#4f93d6', '#3d5bb8', '#8a5cc2'], bw = 76 / 7;
      C.forEach((c, i) => { const R = 200 - i * bw, q = R - bw; fl(g, `M${-R} 0 A${R} ${R} 0 0 1 ${R} 0 L${q} 0 A${q} ${q} 0 0 0 ${-q} 0 Z`, c); });
      line(g, 'M-200 0 A200 200 0 0 1 200 0', '#b04030', 2.4); line(g, 'M-124 0 A124 124 0 0 1 124 0', '#6a4a9a', 2.4);
      for (const x of [-162, 162]) part(g, puff(62, 26, 9, x, -4), '#ffffff', '#7a8899', 2.6);
      if (t) label(g, 0, 60, t, '#333', 24, 'middle');
      return g;
    },

    // "greenhouse cx cy size" — sunlight in, heat out, some trapped by the gas layer
    greenhouse: ([cx, cy, s = 420], o, t, parent) => {
      const g = grp(cx, cy, s / 420, o, parent), Y0 = 430.8, gy = x => Y0 - Math.sqrt(420 * 420 - x * x);
      fl(g, `M-215 ${Y0 - Math.sqrt(520 * 520 - 215 * 215)} A520 520 0 0 1 215 ${Y0 - Math.sqrt(520 * 520 - 215 * 215)} L215 ${gy(215)} A420 420 0 0 0 -215 ${gy(215)} Z`, '#bfe0f7', { opacity: .75 });
      line(g, `M-215 ${Y0 - Math.sqrt(520 * 520 - 215 * 215)} A520 520 0 0 1 215 ${Y0 - Math.sqrt(520 * 520 - 215 * 215)}`, '#4f93d6', 2.4, { 'stroke-dasharray': '10 7' });
      part(g, `M-215 ${gy(215)} A420 420 0 0 1 215 ${gy(215)} L215 120 L-215 120 Z`, '#6dbb4a', '#2c6a22', 3);
      fl(g, `M60 ${gy(60) + 4} Q130 10 210 ${gy(210) + 6} L210 120 L60 120 Z`, '#5aa7e6', { opacity: .9 });
      part(g, O(32, -170, -160), '#ffd84a', '#e0a100', 2.6);
      straight(g, -146, -136, -70, gy(-70) - 4, '#e0a100', 3.6); straight(g, -134, -146, -20, gy(-20) - 4, '#e0a100', 3.6);
      arrow(g, wavy(30, gy(30) - 6, 70, -70, 4, 6), 70, -70, 64, -58, '#d9483c', 3.2);
      arrow(g, wavy(80, -66, 112, gy(112) - 6, 3, 6), 112, gy(112) - 6, 104, gy(112) - 18, '#d9483c', 3.2);
      arrow(g, wavy(150, gy(150) - 6, 196, -150, 6, 6), 196, -150, 192, -136, '#d9483c', 3.2);
      if (o.labels && showLab(o)) { label(g, -200, -40, 'Greenhouse gases', TXT.blue, 18); label(g, 4, -100, 'Heat trapped', TXT.red, 18, 'middle'); }
      if (t) label(g, 0, 150, t, '#333', 24, 'middle');
      return g;
    },

    // "atmosphere cx baseY height labels=0" — layers from troposphere up to thermosphere
    atmosphere: ([cx, by, h = 380], o, t, parent) => {
      const g = grp(cx, by, h / 420, o, parent), B = [[0, -90, '#d6ecfb', 'Troposphere'], [-90, -190, '#a9cdf0', 'Stratosphere'], [-190, -285, '#7fa9de', 'Mesosphere'], [-285, -400, '#4a6fb8', 'Thermosphere']];
      for (const [a, b, f] of B) fl(g, `M-130 ${a} L130 ${a} L130 ${b} L-130 ${b} Z`, f);
      for (const [, b] of B.slice(0, 3)) line(g, `M-130 ${b} L130 ${b}`, '#2b5a9a', 2, { 'stroke-dasharray': '9 6' });
      line(g, 'M-130 -400 L130 -400 L130 0 L-130 0 Z', '#2b5a9a', 2.6);
      part(g, 'M-130 0 L-80 -50 L-55 -30 L-20 -70 L30 0 Z', '#9aa7b0', '#4e5a64', 2.4);
      part(g, 'M-130 0 L130 0 L130 20 L-130 20 Z', '#6dbb4a', '#2c6a22', 2.4);
      part(g, puff(36, 16, 8, 70, -50), '#ffffff', '#7a8899', 2.2);
      line(g, 'M-130 -170 L130 -170', '#8a5cc2', 4, { opacity: .7 });
      arrow(g, 'M60 -260 L10 -220', 10, -220, 60, -260, '#f4a531', 3);
      line(g, 'M66 -265 L80 -276', '#ffd84a', 2, { opacity: .8 });
      line(g, 'M-110 -330 Q-60 -360 -10 -330 T90 -330', '#7ee08a', 6, { opacity: .8 });
      if (showLab(o)) B.forEach(([a, b, , s]) => label(g, 142, (a + b) / 2 + 7, s, '#2b5a9a', 21));
      return g;
    },

    // "carboncycle cx cy size" — CO2 moving between air, trees, ground and a factory (loop flow)
    carboncycle: ([cx, cy, s = 420], o, t, parent) => {
      const g = grp(cx, cy, s / 420, o, parent);
      part(g, 'M-210 90 L210 90 L210 130 L-210 130 Z', '#8a6a44', '#4a3820', 2.4);
      part(g, 'M-90 106 Q0 98 90 108 L90 120 Q0 112 -90 120 Z', '#2e2a26', '#1d1d1f', 2);
      part(g, 'M-148 90 L-146 30 L-134 30 L-132 90 Z', '#8a5a30', '#4a3018', 2.4); part(g, puff(48, 42, 9, -140, 4), '#4f9a36', '#24561c', 2.6);
      part(g, 'M100 90 L100 40 L130 24 L130 40 L160 24 L160 40 L190 24 L190 90 Z', '#c9b8a4', '#5a4a3a', 2.6);
      part(g, 'M168 30 L168 -18 L184 -18 L184 30 Z', '#a8402e', '#5a2a1a', 2.4);
      for (const x of [112, 142]) part(g, `M${x} 60 h14 v14 h-14 Z`, '#ffd84a', '#5a4a3a', 1.8);
      part(g, puff(20, 14, 7, 176, -36), '#b9bec4', '#7a808c', 2);
      part(g, puff(60, 30, 9, 0, -112), '#ffffff', '#7a8899', 2.6);
      if (showLab(o)) label(g, 0, -103, 'CO₂', '#555', 26, 'middle');
      const A = (d, x, y, ax, ay, c) => arrow(g, d, x, y, ax, ay, c, 3.4);
      A('M-62 -104 Q-130 -96 -146 -50', -146, -50, -140, -66, '#2c6a22');
      A('M-100 50 Q-70 80 -40 98', -40, 98, -56, 92, '#7a5a34');
      A('M40 98 Q70 82 96 70', 96, 70, 82, 76, '#5a4a3a');
      A('M168 -54 Q140 -110 64 -112', 64, -112, 80, -116, '#7a808c');
      if (t) label(g, 0, 160, t, '#333', 24, 'middle');
      return g;
    },

    // "solarsystem cx cy width n=8" — Sun and the first n planets on their orbits
    solarsystem: ([cx, cy, w = 520], o, t, parent) => {
      const g = grp(cx, cy, w / 510, o, parent), n = Math.max(1, Math.min(8, +o.n || 8)), sx = -232;
      const P = [[95, 6, '#a8a29a'], [125, 10, '#e8c27a'], [158, 11, '#5aa7e6'], [190, 8, '#d9673a'], [248, 26, '#d9a56c'], [310, 20, '#e8d29a'], [362, 14, '#9fe0e8'], [408, 13, '#3d6fd6']];
      for (const [R] of P.slice(0, n)) { const a = Math.min(1.2, Math.asin(Math.min(1, 125 / R))); line(g, `M${sx + R * Math.cos(a)} ${-R * Math.sin(a)} A${R} ${R} 0 0 1 ${sx + R * Math.cos(a)} ${R * Math.sin(a)}`, '#9aa3b2', 1.6); }
      fl(g, `M${sx} -78 A78 78 0 0 1 ${sx} 78 Z`, '#ffd84a'); line(g, `M${sx} -78 A78 78 0 0 1 ${sx} 78`, '#e0a100', 3);
      P.slice(0, n).forEach(([R, r, f], i) => {
        const x = sx + R;
        if (i === 5) { line(g, `M${x - 36} 4 A36 9 0 0 1 ${x + 36} 4`, '#b08a4a', 3); }
        part(g, O(r, x, 0), f, '#4a4a4a', r > 12 ? 2.4 : 2);
        if (i === 4) for (const y of [-9, 3]) line(g, `M${x - 24} ${y} Q${x} ${y + 4} ${x + 24} ${y}`, '#a8641a', 2);
        if (i === 5) line(g, `M${x - 36} 4 A36 9 0 0 0 ${x + 36} 4`, '#b08a4a', 3);
      });
      if (t) label(g, 0, 150, t, '#333', 24, 'middle');
      return g;
    },

    // "planet cx cy r k=mercury|venus|earth|mars|jupiter|saturn|uranus|neptune|moon | label"
    planet: ([cx, cy, r = 90], o, t, parent) => {
      const g = grp(cx, cy, r / 100, o, parent), k = o.k || 'mars';
      const ball = (f, ink, extra) => { fl(g, O(100), f); const c = clip(g, O(100), 'plC'); extra && extra(c); shadeBall(g, 100, 'plS'); line(g, O(100), ink, 3.2); sheen(g, 100); };
      const craters = (c, col, ink) => { for (const [x, y, q] of [[-40, -30, 16], [30, 10, 22], [-10, 50, 12], [50, -50, 10], [-60, 30, 9]]) { fl(c, O(q, x, y), col); line(c, `M${x - q} ${y} A${q} ${q} 0 0 1 ${x + q} ${y}`, ink, 2); } };
      need({
        mercury: () => ball('#a8a29a', '#5a5550', c => craters(c, '#8a847c', '#5a5550')),
        venus: () => ball('#e8c27a', '#9a7030', c => { for (const y of [-50, -10, 30, 64]) line(c, `M-110 ${y} Q-40 ${y - 22} 0 ${y} T110 ${y}`, '#f6dfae', 8, { opacity: .8 }); }),
        earth: () => globe100(g),
        mars: () => ball('#d9673a', '#7a2f18', c => { fl(c, E(46, 20, 0, -96), '#ffffff'); for (const [x, y, rx, ry] of [[-30, 10, 34, 16], [40, 40, 24, 12]]) fl(c, E(rx, ry, x, y), '#a8452a', { opacity: .7 }); }),
        jupiter: () => ball('#ecd3ae', '#7a5030', c => { ['#c98f5a', '#f1dcc0', '#b97a4a', '#f1dcc0', '#c98f5a'].forEach((f, i) => fl(c, `M-110 ${-70 + i * 30} Q0 ${-62 + i * 30} 110 ${-70 + i * 30} L110 ${-52 + i * 30} Q0 ${-44 + i * 30} -110 ${-52 + i * 30} Z`, f));
          fl(c, E(22, 12, 34, 34), '#c0392b'); line(c, E(22, 12, 34, 34), '#7a1f14', 2); }),
        saturn: () => { const rg = mk('g', { transform: 'rotate(-14)' }, g), gg = g; ringG(rg, true); ball('#e8d29a', '#8a6a3e', c => { for (const y of [-40, 10, 50]) fl(c, `M-110 ${y} L110 ${y} L110 ${y + 14} L-110 ${y + 14} Z`, '#d4b77a'); }); ringG(mk('g', { transform: 'rotate(-14)' }, gg), false); },
        uranus: () => { const rg = mk('g', { transform: 'rotate(-8)' }, g); line(rg, 'M0 -150 A26 150 0 0 0 0 150', '#9ab8c0', 4); ball('#9fe0e8', '#3a8a96'); line(mk('g', { transform: 'rotate(-8)' }, g), 'M0 -150 A26 150 0 0 1 0 150', '#9ab8c0', 4); },
        neptune: () => ball('#3d6fd6', '#1a3a7a', c => { fl(c, 'M-110 -20 Q0 -10 110 -20 L110 0 Q0 10 -110 0 Z', '#6f98e6'); fl(c, E(20, 11, -30, 30), '#1f3f8f'); }),
        moon: () => ball('#d6d6cf', '#5f5f58', c => craters(c, '#b3b3aa', '#77776e')),
      }, k, 'planet')();
      function ringG(rg, back) { const d = `M-190 0 A190 42 0 0 ${back ? 1 : 0} 190 0`; line(rg, d, '#d9bf86', 22, { opacity: .9 }); line(rg, d, '#8a6a3e', 2.4); line(rg, `M-150 0 A150 30 0 0 ${back ? 1 : 0} 150 0`, '#8a6a3e', 1.6); }
      if (t) label(g, 0, k === 'saturn' || k === 'uranus' ? 175 : 140, t, '#333', 28, 'middle');
      return g;
    },

    // "moonphases cx cy width labels=0" — eight Moon phases in a row, new to waning crescent
    moonphases: ([cx, cy, w = 820], o, t, parent) => {
      const g = grp(cx, cy, w / 800, o, parent), r = 40, N = ['New', 'Crescent', 'Quarter', 'Gibbous', 'Full', 'Gibbous', 'Quarter', 'Crescent'];
      for (let i = 0; i < 8; i++) {
        const m = mk('g', { transform: `translate(${-350 + i * 100} 0)` }, g), rx = (r * Math.abs(Math.cos(i * Math.PI / 4))).toFixed(1);
        fl(m, O(r), '#3a4258');
        const lit = i === 0 ? null : i === 4 ? O(r) : i < 4 ? `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${i === 3 ? 1 : 0} 0 ${-r} Z` : `M0 ${-r} A${r} ${r} 0 0 0 0 ${r} A${rx} ${r} 0 0 ${i === 7 ? 1 : 0} 0 ${-r} Z`;
        if (lit) { fl(m, lit, '#f5ecc8'); line(m, lit, '#c9b878', 1.6); }
        line(m, O(r), '#2a3044', 2.6);
        if (showLab(o)) label(m, 0, 72, N[i], '#444', 19, 'middle');
      }
      return g;
    },

    // "seasons cx cy width labels=0" — tilted Earth at four points of its orbit round the Sun
    seasons: ([cx, cy, w = 480], o, t, parent) => {
      const g = grp(cx, cy, w / 470, o, parent), rx = 190, ry = 72;
      line(g, E(rx, ry), '#7a8899', 2, { 'stroke-dasharray': '10 7' });
      for (const p of [3 * Math.PI / 4, -Math.PI / 4]) { const x = rx * Math.cos(p), y = ry * Math.sin(p); line(g, head(x, y, x - rx * Math.sin(p) * .1, y + ry * Math.cos(p) * .1), '#7a8899', 2.4, { class: 'ink head' }); }
      const sun = mk('g', {}, g); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(sun, `M${48 * Math.cos(a)} ${48 * Math.sin(a)} L${60 * Math.cos(a)} ${60 * Math.sin(a)}`, '#f6c84c', 4); }
      part(sun, O(38), '#ffd84a', '#e0a100', 2.6);
      for (const [x, y, s] of [[-rx, 0, 'Jun'], [0, ry, 'Sep'], [rx, 0, 'Dec'], [0, -ry, 'Mar']]) {
        const e = mk('g', { transform: `translate(${x} ${y})` }, g), L = Math.hypot(x, y), ux = -x / L, uy = -y / L, R = 26;
        globe100(mk('g', { transform: `scale(${R / 100})` }, e));
        const p1 = [-uy * R, ux * R]; fl(e, `M${p1[0]} ${p1[1]} A${R} ${R} 0 0 1 ${-p1[0]} ${-p1[1]} Z`, '#0b1a33', { opacity: .45 });
        const ax = Math.sin(23.5 * Math.PI / 180), ay = -Math.cos(23.5 * Math.PI / 180);
        line(e, `M${-ax * 40} ${-ay * 40} L${ax * 40} ${ay * 40}`, '#c0392b', 2.6);
        if (showLab(o)) label(e, x < 0 ? -36 : x > 0 ? 36 : 44, y > 0 ? 30 : y < 0 ? -18 : 52, s, '#444', 22, x < 0 ? 'end' : 'start');
      }
      return g;
    },

    // "eclipse cx cy width k=solar|lunar labels=0" — Sun, Moon and Earth in line, with the shadow
    eclipse: ([cx, cy, w = 480], o, t, parent) => {
      const g = grp(cx, cy, w / 470, o, parent), solar = (o.k || 'solar') === 'solar';
      if (!['solar', 'lunar'].includes(o.k || 'solar')) throw new Error(`Unknown eclipse "${o.k}" (use solar|lunar)`);
      const [mx, ex] = solar ? [40, 185] : [200, 60], er = 42, mr = 14;
      part(g, O(70, -180), '#ffd84a', '#e0a100', 3);
      const [tx, tr] = solar ? [mx, mr] : [ex, er];
      for (const sgn of [-1, 1]) line(g, `M-180 ${sgn * 70} L${tx} ${sgn * tr}`, '#f3c33b', 1.8, { 'stroke-dasharray': '7 6' });
      if (solar) {
        globe100(mk('g', { transform: `translate(${ex} 0) scale(${er / 100})` }, g));
        fl(g, `M${mx} ${-mr} L${ex - er + 4} -4 L${ex - er + 4} 4 L${mx} ${mr} Z`, '#2a3044', { opacity: .55 });
        fl(g, `M${mx} ${-mr} L${ex - er + 6} -26 L${ex - er + 6} 26 L${mx} ${mr} Z`, '#2a3044', { opacity: .2 });
        part(g, O(9, ex - er + 9, 0), '#2a3044', '#2a3044', 1.5);
        part(g, O(mr, mx), '#cfcfc8', '#5f5f58', 2.4);
      } else {
        globe100(mk('g', { transform: `translate(${ex} 0) scale(${er / 100})` }, g));
        fl(g, `M${ex} ${-er} L230 -16 L230 16 L${ex} ${er} Z`, '#2a3044', { opacity: .45 });
        part(g, O(mr, mx), '#b8553a', '#6a2a1a', 2.4);
      }
      if (showLab(o)) for (const [x, s] of [[-180, 'Sun'], [mx, 'Moon'], [ex, 'Earth']]) label(g, x, x === -180 ? 104 : 72, s, '#444', 20, 'middle');
      return g;
    },

    // "starshine cx cy r" — glowing five-point star with sparkles (loop beat)
    starshine: ([cx, cy, r = 100], o, t, parent) => {
      const outer = grp(cx, cy, r / 100, o, parent), g = mk('g', { class: 'pivot' }, outer); outer.anim = g;
      for (const [x, y, s] of [[-105, -70, 16], [110, -60, 12], [95, 80, 14], [-100, 70, 10]]) { line(g, `M${x - s} ${y} L${x + s} ${y} M${x} ${y - s} L${x} ${y + s}`, '#f3c33b', 3); }
      const st = starD(5, 100, 42, 0, 8);
      part(g, st, '#ffd84a', '#c97a10', 3.4);
      line(g, 'M-14 -52 L-4 -78', '#ffffff', 6, { opacity: .7 });
      if (t) label(g, 0, 140, t, TXT.yellow, 26, 'middle');
      return outer;
    },

    // "constellation cx cy width k=bigdipper|orion|cassiopeia" — star dots joined on a night-sky card
    constellation: ([cx, cy, w = 420], o, t, parent) => {
      const g = grp(cx, cy, w / 400, o, parent);
      const S = need({
        bigdipper: [[[-170, -70], [-110, -52], [-60, -32], [-10, -22], [10, 40], [100, 52], [112, -16]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]],
        orion: [[[-60, -88], [60, -78], [-25, 2], [0, -4], [25, -10], [-55, 88], [70, 82], [0, -110]], [[0, 7], [7, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]]],
        cassiopeia: [[[-150, -30], [-80, 40], [-10, -10], [70, 50], [150, -40]], [[0, 1], [1, 2], [2, 3], [3, 4]]],
      }, o.k || 'bigdipper', 'constellation');
      part(g, 'M-200 -130 L200 -130 Q210 -130 210 -120 L210 120 Q210 130 200 130 L-200 130 Q-210 130 -210 120 L-210 -120 Q-210 -130 -200 -130 Z', '#1f2d4a', '#0c1424', 3);
      for (let i = 0; i < 26; i++) fl(g, O(1.8, -195 + 390 * rnd(i), -115 + 230 * rnd(i + 40)), '#c9d6ee');
      for (const [a, b] of S[1]) line(g, `M${S[0][a][0]} ${S[0][a][1]} L${S[0][b][0]} ${S[0][b][1]}`, '#8fb0e6', 2.2);
      for (const [x, y] of S[0]) part(g, starD(4, 11, 4, x, y), '#fff3a6', '#f3c33b', 2);
      if (t) label(g, 0, 165, t, '#333', 24, 'middle');
      return g;
    },

    // "galaxy cx cy r" — spiral galaxy: bright core, two starry arms
    galaxy: ([cx, cy, r = 150], o, t, parent) => {
      const g = grp(cx, cy, r / 150, o, parent);
      fl(g, E(150, 120), '#c9b8f0', { opacity: .45 });
      for (let k = 0; k < 2; k++) {
        let d = ''; for (let a = 0; a <= 11; a += .25) { const q = 14 * Math.exp(.21 * a), b = a + k * Math.PI; d += `${a ? 'L' : 'M'}${(q * Math.cos(b)).toFixed(1)} ${(q * Math.sin(b) * .8).toFixed(1)} `; }
        line(g, d, '#e6defa', 22, { opacity: .9 }); line(g, d, '#7b5cc2', 3);
      }
      for (let i = 0; i < 30; i++) { const a = 2 + 9 * rnd(i), k = i % 2, q = 14 * Math.exp(.21 * a) + 12 * (rnd(i + 7) - .5), b = a + k * Math.PI; fl(g, O(2.2, q * Math.cos(b), q * Math.sin(b) * .8), '#ffffff'); }
      part(g, E(26, 22), '#fff3a6', '#e0a100', 2.4);
      if (t) label(g, 0, 160, t, '#5a3e9a', 24, 'middle');
      return g;
    },

    // "blackhole cx cy r" — black disc with a glowing orange swirl of matter
    blackhole: ([cx, cy, r = 120], o, t, parent) => {
      const g = grp(cx, cy, r / 120, o, parent), disc = sw => `M-160 0 A160 38 0 0 ${sw} 160 0 L112 0 A112 22 0 0 ${1 - sw} -112 0 Z`;
      part(g, disc(1), '#f4a531', '#c0592b', 2.4);
      fl(g, 'M-78 2 A78 70 0 0 1 78 2 L66 2 A66 58 0 0 0 -66 2 Z', '#ffb347');
      line(g, 'M-78 2 A78 70 0 0 1 78 2', '#c0592b', 2.2);
      part(g, O(56), '#111111', '#000000', 3);
      line(g, O(60), '#ffd84a', 3);
      part(g, disc(0), '#f4a531', '#c0592b', 2.4);
      for (const d of ['M-140 8 Q-60 30 20 30', 'M40 30 Q100 26 140 8']) line(g, d, '#ffe08a', 3);
      if (t) label(g, 0, 120, t, '#333', 24, 'middle');
      return g;
    },

    // "comet cx cy length rot=deg" — icy head with a glowing coma and long tails
    comet: ([cx, cy, L = 380], o, t, parent) => {
      const g = grp(cx, cy, L / 380, { rot: o.rot ?? -18 }, parent);
      part(g, 'M150 -32 Q-20 -62 -220 18 Q-20 -6 150 32 Z', '#fdf3c4', '#d1a640', 2.4);
      part(g, 'M146 -14 L-230 -48 L-226 -30 L146 12 Z', '#a9d4f5', '#4f93d6', 2.2);
      fl(g, O(34, 150), '#e8f4ff', { opacity: .9 });
      line(g, O(34, 150), '#9fc9ec', 2);
      part(g, O(15, 152), '#ffffff', '#4f93d6', 2.6);
      for (const d of ['M100 -6 L-120 -20', 'M90 12 L-100 4']) line(g, d, '#f3c33b', 2, { opacity: .8 });
      if (t) label(g, 0, 80, t, '#333', 24, 'middle');
      return g;
    },

    // "asteroid cx cy size" — lumpy cratered space rock
    asteroid: ([cx, cy, s = 200], o, t, parent) => {
      const g = grp(cx, cy, s / 200, o, parent);
      const out = 'M-90 -10 C-95 -50 -50 -75 -5 -70 C40 -78 85 -50 92 -10 C100 30 70 60 25 62 C-10 70 -60 65 -80 35 C-92 20 -88 5 -90 -10 Z';
      fl(g, out, '#9a8f84'); const c = clip(g, out, 'astC');
      fl(c, 'M-120 -120 h260 v260 h-260 Z ' + O(110, -30, -40), '#3a332c', { opacity: .3, 'fill-rule': 'evenodd' });
      for (const [x, y, rx, ry] of [[-40, -25, 18, 14], [30, -30, 14, 11], [20, 25, 22, 15], [-45, 30, 10, 8], [60, 5, 8, 6]]) { fl(c, E(rx, ry, x, y), '#7d7369'); line(c, `M${x - rx} ${y} A${rx} ${ry} 0 0 1 ${x + rx} ${y}`, '#4a423b', 2.2); }
      line(g, out, '#4a423b', 3.2);
      if (o.trail) for (const y of [-30, 0, 30]) line(g, `M-120 ${y} L-170 ${y}`, '#9aa3b2', 3);
      if (t) label(g, 0, 105, t, '#333', 24, 'middle');
      return g;
    },

    // "spacerocket cx cy height rot=deg" — space rocket with flame (smoke: add plume)
    spacerocket: ([cx, cy, h = 300], o, t, parent) => {
      const g = grp(cx, cy, h / 300, o, parent);
      part(g, 'M-26 64 Q-32 112 0 150 Q32 112 26 64 Z', '#f4a531', '#c0592b', 2.6);
      part(g, 'M-13 64 Q-14 100 0 124 Q14 100 13 64 Z', '#ffd84a', '#e0a100', 2);
      part(g, 'M-25 40 L25 40 L32 64 L-32 64 Z', '#9aa3b2', '#4a5568', 2.6);
      part(g, 'M-40 0 L-80 58 L-80 84 L-40 50 Z', '#e04b3a', '#7a1f14', 2.6);
      part(g, 'M40 0 L80 58 L80 84 L40 50 Z', '#e04b3a', '#7a1f14', 2.6);
      const body = 'M0 -150 C40 -112 45 -60 42 42 L-42 42 C-45 -60 -40 -112 0 -150 Z';
      fl(g, body, '#f2f4f7');
      part(g, 'M0 -150 C24 -128 33 -106 36 -84 L-36 -84 C-33 -106 -24 -128 0 -150 Z', '#e04b3a', '#7a1f14', 2.4);
      line(g, body, '#4a5568', 3.2);
      part(g, O(19, 0, -36), '#7fb7ea', '#4a5568', 3); line(g, 'M-9 -44 Q-4 -50 4 -50', '#ffffff', 3);
      line(g, 'M28 -100 Q34 -40 32 30', '#c5ccd6', 4);
      if (t) label(g, 0, 190, t, '#333', 24, 'middle');
      return g;
    },

    // "spacesat cx cy size rot=deg" — satellite: gold body, two solar panels, dish
    spacesat: ([cx, cy, s = 320], o, t, parent) => {
      const g = grp(cx, cy, s / 320, { rot: o.rot ?? -12 }, parent);
      for (const sg of [-1, 1]) {
        line(g, `M${sg * 30} 0 L${sg * 48} 0`, '#4a5568', 4);
        part(g, `M${sg * 48} -30 L${sg * 158} -30 L${sg * 158} 30 L${sg * 48} 30 Z`, '#3d6fd6', '#1a3a7a', 2.6);
        for (const x of [70, 92, 114, 136]) line(g, `M${sg * x} -30 L${sg * x} 30`, '#9fc0f0', 1.6);
        line(g, `M${sg * 48} 0 L${sg * 158} 0`, '#9fc0f0', 1.6);
      }
      part(g, 'M-30 -38 L30 -38 L30 38 L-30 38 Z', '#e0b84a', '#7a5a14', 2.8);
      for (const d of ['M-30 -12 L30 -12', 'M-30 14 L30 14', 'M-8 -38 L-8 38']) line(g, d, '#a8862a', 1.6);
      line(g, 'M0 -38 L0 -56', '#4a5568', 3);
      part(g, 'M-28 -74 Q0 -44 28 -74 Q0 -62 -28 -74 Z', '#c5ccd6', '#4a5568', 2.4);
      line(g, 'M0 -64 L0 -88', '#4a5568', 2.4); part(g, O(4, 0, -90), '#e04b3a', '#7a1f14', 1.6);
      if (t) label(g, 0, 85, t, '#333', 24, 'middle');
      return g;
    },

    // "astronaut cx cy height" — friendly astronaut in a white suit, waving
    astronaut: ([cx, cy, h = 300], o, t, parent) => {
      const g = grp(cx, cy, h / 300, o, parent), ink = '#4a5568', suit = '#f4f6f8';
      part(g, 'M-52 -48 L52 -48 L52 52 L-52 52 Z', '#c9ced6', ink, 2.6);
      for (const s of [-1, 1]) { part(g, `M${s * 36} 56 L${s * 6} 56 L${s * 8} 124 L${s * 36} 124 Z`, suit, ink, 2.8); part(g, `M${s * 40} 120 L${s * 4} 120 L${s * 4} 140 L${s * 44} 140 Q${s * 46} 128 ${s * 40} 120 Z`, '#9aa3b2', ink, 2.6); }
      part(g, 'M-40 -50 Q0 -58 40 -50 L42 62 Q0 68 -42 62 Z', suit, ink, 3);
      part(g, 'M-40 -42 Q-70 -20 -72 25 L-52 28 Q-52 -5 -36 -20 Z', suit, ink, 2.8); part(g, O(13, -62, 37), '#9aa3b2', ink, 2.4);
      part(g, 'M40 -42 Q70 -58 80 -88 L98 -80 Q88 -44 44 -20 Z', suit, ink, 2.8); part(g, O(13, 91, -94), '#9aa3b2', ink, 2.4);
      part(g, 'M-20 -18 L20 -18 L20 14 L-20 14 Z', '#c5ccd6', ink, 2.2);
      for (const [x, c] of [[-10, '#e04b3a'], [0, '#ffd84a'], [10, '#4f93d6']]) part(g, O(3.6, x, -2), c, ink, 1.4);
      part(g, O(50, 0, -95), suit, ink, 3.2);
      part(g, E(36, 28, 0, -92), '#3d6fd6', '#1a3a7a', 2.6);
      line(g, 'M-22 -104 Q-12 -114 2 -114', '#ffffff', 5, { opacity: .85 });
      if (t) label(g, 0, 178, t, '#333', 24, 'middle');
      return g;
    },

    // "spacescope cx cy size" — telescope on a tripod, pointing up at the sky
    spacescope: ([cx, cy, s = 300], o, t, parent) => {
      const g = grp(cx, cy, s / 300, o, parent), ink = '#1a2a4a';
      for (const x of [-80, 80, 14]) line(g, `M0 24 L${x} 140`, '#6b4a2a', 5);
      const tb = mk('g', { transform: 'translate(0 -10) rotate(-28)' }, g);
      part(tb, 'M-40 -38 L40 -38 L40 -28 L-40 -28 Z', '#9aa3b2', ink, 2);
      part(tb, 'M-120 -16 L92 -24 L92 24 L-120 16 Z', '#3d6fd6', ink, 3);
      part(tb, 'M92 -30 L114 -30 L114 30 L92 30 Z', '#2a4a8a', ink, 2.8);
      part(tb, E(6, 27, 116, 0), '#bfe3f9', ink, 2.2);
      part(tb, 'M-120 -8 L-148 -8 L-148 8 L-120 8 Z', '#4a5568', ink, 2.4);
      line(tb, 'M-100 -10 L80 -18', '#9fc0f0', 3, { opacity: .7 });
      part(g, O(11, 0, 22), '#4a5568', ink, 2.4);
      if (t) label(g, 0, 180, t, '#333', 24, 'middle');
      return g;
    },
  });
})();
