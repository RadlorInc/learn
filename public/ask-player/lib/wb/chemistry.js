// Whiteboard library: chemistry. Lab glass, particles, atoms and molecules, reactions.
// Wrapped in a block so its helpers never clash with another category's top-level names.
{
  const C = (x, y, r) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  const R = (x, y, w, h, r = 0) => r
    ? `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
    : `M${x} ${y} h${w} v${h} h${-w} Z`;
  const fl = (g, d, f, extra = {}) => mk('path', { d, fill: f, filter: 'url(#wc)', class: 'fillable', ...extra }, g);
  const part = (g, d, f, ink, w = 3) => { fl(g, d, f); return line(g, d, ink, w); };
  const grp = (cx, cy, s, rot, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${rot || 0}) scale(${s})` }, parent);
  const txt = (g, x, y, t, c = TXT.blue, s = 22) => label(g, x, y + s * .32, t, c, s, 'middle');
  const rand = s => () => (s = s * 16807 % 2147483647) / 2147483647;
  const LQ = { blue: '#8cc4ef', green: '#a6d872', red: '#f0806e', orange: '#f6b34e', yellow: '#ffe066', purple: '#b88ade', pink: '#f6a8c8', clear: '#d3eaf8', brown: '#b98a5a', white: '#f4f4f0' };
  const LI = { blue: '#2f6fae', green: '#3f7f25', red: '#a8382a', orange: '#b0701a', yellow: '#a88a10', purple: '#6a3d9a', pink: '#b0507a', clear: '#6f9cc0', brown: '#6e4a28', white: '#8a8a84' };
  const GL = '#eef7fd', GI = '#4a6782';
  const showLab = o => o.lab !== '0' && o.labels !== '0';   // lab=0 / labels=0 hide the words
  const num = (v, d) => (v === undefined || v === '' || isNaN(+v) ? d : +v);
  // liquid inside a closed body outline, up to line y, with a meniscus from xl to xr
  const liquid = (g, body, y, c, xl, xr) => {
    const id = 'chemL' + clipN++;
    mk('clipPath', { id }, g).append(mk('path', { d: body }));
    fl(g, `M-2000 ${y} H2000 V2000 H-2000 Z`, LQ[c] || LQ.blue, { 'clip-path': `url(#${id})` });
    line(g, `M${xl} ${y} Q${(xl + xr) / 2} ${y + 5} ${xr} ${y}`, LI[c] || LI.blue, 2.2);
  };
  // shared glassware, drawn in a 200-tall box centred on 0,0
  const beakerAt = (g, lv, c, marks = true) => {
    const body = 'M-66 -96 L66 -96 L66 90 Q66 100 56 100 L-56 100 Q-66 100 -66 90 Z';
    fl(g, body, GL);
    if (lv > 0) liquid(g, body, 100 - lv * 190, c, -66, 66);
    line(g, 'M-80 -105 Q-68 -101 -66 -90 L-66 90 Q-66 100 -56 100 L56 100 Q66 100 66 90 L66 -96 Q67 -101 73 -104', GI, 3.2);
    if (marks) line(g, 'M44 60 H62 M52 30 H62 M44 0 H62 M52 -30 H62 M44 -60 H62', GI, 2);
    line(g, 'M-54 -70 L-54 70', '#ffffff', 5, { opacity: .75 });
  };
  const tubeAt = (g, lv, c) => {
    const body = 'M-20 -94 L20 -94 L20 80 A20 20 0 0 1 -20 80 Z';
    fl(g, body, GL);
    if (lv > 0) liquid(g, body, 100 - lv * 194, c, -20, 20);
    line(g, 'M-27 -100 Q-20 -98 -20 -92 L-20 80 A20 20 0 0 0 20 80 L20 -92 Q20 -98 27 -100', GI, 3);
    line(g, 'M-11 -80 L-11 70', '#ffffff', 4, { opacity: .75 });
  };
  const conicalAt = (g, lv, c) => {
    const body = 'M-18 -105 L18 -105 L18 -40 L82 88 Q88 100 74 100 L-74 100 Q-88 100 -82 88 L-18 -40 Z';
    fl(g, body, GL);
    if (lv > 0) { const y = 100 - lv * 200, hw = y > -40 ? 18 + (y + 40) * .5 : 18; liquid(g, body, y, c, -hw, hw); }
    line(g, 'M-25 -110 Q-18 -108 -18 -100 L-18 -40 L-82 88 Q-88 100 -74 100 L74 100 Q88 100 82 88 L18 -40 L18 -100 Q18 -108 25 -110', GI, 3.2);
    line(g, 'M-34 0 L-62 60', '#ffffff', 5, { opacity: .75 });
  };
  const roundAt = (g, lv, c) => {
    const body = 'M-16 -105 L16 -105 L16 -40 A72 72 0 1 1 -16 -40 Z';
    fl(g, body, GL);
    if (lv > 0) { const y = 102 - lv * 140, hw = Math.sqrt(Math.max(0, 72 * 72 - (y - 30) ** 2)); liquid(g, body, y, c, -hw, hw); }
    line(g, 'M-23 -110 Q-16 -108 -16 -100 L-16 -40 A72 72 0 1 0 16 -40 L16 -100 Q16 -108 23 -110', GI, 3.2);
    line(g, 'M-40 0 Q-50 30 -40 60', '#ffffff', 5, { opacity: .75 });
  };
  const flameAt = (g, x, y, s, yellow) => {   // base of the flame at x,y; s = scale
    const f = mk('g', { class: 'pivot', transform: `translate(${x} ${y}) scale(${s})` }, g);
    if (yellow) {
      part(f, 'M-22 0 C-34 -40 -8 -60 -10 -100 C6 -80 4 -110 16 -128 C14 -90 34 -60 22 0 Z', '#ffd25a', '#d27b0c', 2.6);
      part(f, 'M-10 0 C-14 -26 0 -40 2 -62 C8 -40 14 -24 10 0 Z', '#ff9a3a', '#c25a10', 2);
    } else {
      part(f, 'M-22 0 C-30 -40 -6 -70 0 -108 C6 -70 30 -40 22 0 Z', '#a9c8f7', '#3a6fd0', 2.6);
      part(f, 'M-11 0 C-14 -22 -4 -40 0 -56 C4 -40 14 -22 11 0 Z', '#3f74e0', '#1f4fae', 2);
    }
    return f;
  };
  const EL = { H: ['#f6f6f2', '#6b6b6b', .17, '#555'], O: ['#ea5a44', '#7a1f14', .25, '#fff'], C: ['#50555c', '#1e2024', .26, '#fff'],
    N: ['#5b86dc', '#1f3f80', .25, '#fff'], Cl: ['#6cc04a', '#2c6a22', .3, '#fff'], Na: ['#a77ad8', '#4a2a78', .28, '#fff'] };
  const ball = (g, x, y, r, f, ink, t, tc) => {
    fl(g, C(x, y, r), f);
    line(g, C(x, y, r), ink, 2.8);
    line(g, `M${x - r * .55} ${y - r * .2} Q${x - r * .5} ${y - r * .55} ${x - r * .15} ${y - r * .62}`, '#ffffff', Math.max(2, r * .14), { opacity: .8 });
    if (t) txt(g, x, y, t, tc, r * .9);
  };
  const MOL = {
    water: [[['O', 0, -.15], ['H', -.62, .35], ['H', .62, .35]], [[0, 1, 1], [0, 2, 1]]],
    co2: [[['O', -.8, 0], ['C', 0, 0], ['O', .8, 0]], [[0, 1, 2], [1, 2, 2]]],
    o2: [[['O', -.32, 0], ['O', .32, 0]], [[0, 1, 2]]],
    h2: [[['H', -.25, 0], ['H', .25, 0]], [[0, 1, 1]]],
    methane: [[['C', 0, 0], ['H', 0, -.72], ['H', -.68, .3], ['H', .68, .3], ['H', .2, .64]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]],
    ammonia: [[['N', 0, -.12], ['H', -.66, .32], ['H', .66, .32], ['H', 0, .66]], [[0, 1, 1], [0, 2, 1], [0, 3, 1]]],
    hcl: [[['H', -.42, 0], ['Cl', .22, 0]], [[0, 1, 1]]],
    glucose: (() => {
      const at = [], bd = [];
      for (let i = 0; i < 6; i++) { const a = (-90 + 60 * i) * Math.PI / 180; at.push([i === 1 ? 'O' : 'C', .42 * Math.cos(a), .42 * Math.sin(a)]); bd.push([i, (i + 1) % 6, 1]); }
      for (const i of [0, 2, 3, 4, 5]) { const a = (-90 + 60 * i) * Math.PI / 180; at.push([i === 0 ? 'C' : 'O', .82 * Math.cos(a), .82 * Math.sin(a)]); bd.push([i, at.length - 1, 1]); }
      return [at, bd];
    })(),
  };

  Object.assign(window.RECIPES, {
    // "atom cx cy size e=2,8,1 | Sodium"
    atom: ([cx, cy, S = 260], o, t, parent) => {
      const g = mk('g', {}, parent), sh = String(o.e || '2,4').split(',').map(Number).filter(n => n >= 0), n = sh.length;
      const Ro = S / 2 - 10, rn = 24;
      sh.forEach((k, i) => {
        const r = n === 1 ? Ro * .6 : rn + 26 + (Ro - rn - 26) * i / (n - 1);
        line(g, C(cx, cy, r), '#8aa4bf', 2.2);
        for (let j = 0; j < k; j++) { const a = -Math.PI / 2 + i * .4 + j * 2 * Math.PI / k; ball(g, cx + r * Math.cos(a), cy + r * Math.sin(a), 8, '#5b9be8', '#1f4f8f'); }
      });
      for (const [dx, dy, p] of [[0, 0, 1], [-11, -7, 0], [11, -7, 1], [-11, 8, 1], [11, 8, 0], [0, -14, 0], [0, 15, 1]])
        ball(g, cx + dx, cy + dy, 9, p ? '#e85a48' : '#b8bec6', p ? '#7a1f14' : '#555b63');
      if (t) txt(g, cx, cy + S / 2 + 22, t);
      return g;
    },

    // "ecloud cx cy size | Electron cloud"
    ecloud: ([cx, cy, S = 240], o, t, parent) => {
      const g = mk('g', {}, parent), id = 'chemEC' + clipN++, R = S / 2, rnd = rand(7);
      const rg = mk('radialGradient', { id }, g);
      for (const [off, op] of [[0, .75], [.55, .35], [1, 0]]) mk('stop', { offset: off, 'stop-color': '#5b9be8', 'stop-opacity': op }, rg);
      fl(g, C(cx, cy, R), `url(#${id})`);
      let d = '';
      for (let i = 0; i < 110; i++) { const r = R * .92 * rnd() ** 1.4, a = rnd() * 2 * Math.PI; d += `M${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} l.1 0 `; }
      line(g, d, '#1f4f8f', 4);
      ball(g, cx, cy, 9, '#e85a48', '#7a1f14');
      if (t) txt(g, cx, cy + R + 22, t);
      return g;
    },

    // "molecule cx cy size k=water|co2|o2|h2|methane|ammonia|hcl|glucose rot=deg | Water"
    molecule: ([cx, cy, S = 240], o, t, parent) => {
      const m = MOL[o.k || 'water']; if (!m) throw new Error(`Unknown molecule "${o.k}"`);
      const outer = mk('g', {}, parent), g = grp(cx, cy, S / 240, o.rot, outer), U = 120, [at, bd] = m;
      for (const [i, j, ord] of bd) {
        const [, x1, y1] = at[i], [, x2, y2] = at[j], L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
        const a = EL[at[i][0]][2] * U * .7, b = EL[at[j][0]][2] * U * .7;
        for (const off of ord === 2 ? [-7, 7] : [0]) {
          const px = -uy * off, py = ux * off;
          line(g, `M${x1 * U + ux * a + px} ${y1 * U + uy * a + py} L${x2 * U - ux * b + px} ${y2 * U - uy * b + py}`, '#7d8792', ord === 2 ? 5 : 8);
        }
      }
      for (const [e, x, y] of at) { const [f, ink, r, tc] = EL[e]; ball(g, x * U, y * U, r * U, f, ink, e, tc); }
      if (t) txt(outer, cx, cy + S * .62, t);
      return outer;
    },

    // "lattice cx cy size | Salt crystal" — sodium chloride cube
    lattice: ([cx, cy, S = 220], o, t, parent) => {
      const g = grp(cx, cy, S / 220, 0, parent), sp = 66, P = (i, j, k) => [(i - 1) * sp - (k - 1) * sp * .42, (j - 1) * sp + (k - 1) * sp * .32];
      let d = '';
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
        const [x, y] = P(i, j, k);
        for (const [a, b, c] of [[i + 1, j, k], [i, j + 1, k], [i, j, k + 1]]) if (a < 3 && b < 3 && c < 3) { const [x2, y2] = P(a, b, c); d += `M${x} ${y} L${x2} ${y2} `; }
      }
      line(g, d, '#8a939c', 2.2);
      for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const [x, y] = P(i, j, k), na = (i + j + k) % 2;
        ball(g, x, y, na ? 13 : 21, na ? EL.Na[0] : EL.Cl[0], na ? EL.Na[1] : EL.Cl[1]);
      }
      if (t) txt(g, 0, 128, t);
      return g;
    },

    // "ion cx cy r q=+|-|2+|2- | Na"
    ion: ([cx, cy, r = 70], o, t, parent) => {
      const g = mk('g', {}, parent), q = String(o.q || '+'), neg = q.includes('-'), [f, ink] = neg ? ['#8cbaf0', '#1f4f8f'] : ['#f29a80', '#8a2f1a'];
      line(g, C(cx, cy, r + 12), ink, 2, { opacity: .45 });
      ball(g, cx, cy, r, f, ink, t || '', ink);
      const bx = cx + r * .78, by = cy - r * .78, br = r * .34;
      fl(g, C(bx, by, br), '#ffffff'); line(g, C(bx, by, br), ink, 2.6);
      txt(g, bx, by, q.replace('-', '−'), ink, br * 1.3);
      return g;
    },

    // "bond cx cy size k=ionic|covalent | Ionic bond"
    bond: ([cx, cy, S = 320], o, t, parent) => {
      const g = grp(cx, cy, S / 320, 0, parent), e = (x, y) => ball(g, x, y, 8, '#5b9be8', '#1f4f8f');
      if ((o.k || 'ionic') === 'ionic') {
        for (const [x, nu, n] of [[-100, 'Na', 1], [100, 'Cl', 7]]) {
          line(g, C(x, 0, 52), '#8aa4bf', 2.2);
          ball(g, x, 0, 20, EL[nu][0], EL[nu][1], nu, '#fff');
          for (let j = 0; j < n; j++) { const a = (x < 0 ? 0 : Math.PI) + (x < 0 ? 0 : (j + 1) * 2 * Math.PI / 8); e(x + 52 * Math.cos(a), 52 * Math.sin(a)); }
        }
        line(g, 'M-44 -18 Q0 -80 46 -20', TXT.orange, 3); line(g, head(46, -20, 30, -48), TXT.orange, 3, { class: 'ink head' });
        txt(g, 0, -72, 'e⁻', TXT.orange, 24);
        txt(g, -100, 80, 'Na⁺', EL.Na[1], 24); txt(g, 100, 80, 'Cl⁻', EL.Cl[1], 24);
      } else if (o.k === 'covalent') {
        for (const x of [-42, 42]) { fl(g, C(x, 0, 60), '#dcebf9'); line(g, C(x, 0, 60), '#8aa4bf', 2.2); ball(g, x, 0, 18, EL.H[0], EL.H[1], 'H', '#555'); }
        e(0, -14); e(0, 14);
        if (showLab(o)) txt(g, 0, 84, 'shared pair', TXT.blue, 20);
      } else throw new Error(`Unknown bond "${o.k}"`);
      if (t) txt(g, 0, 118, t);
      return g;
    },

    // "beaker cx cy size c=blue level=0.55 | Acid"
    beaker: ([cx, cy, S = 200], o, t, parent) => {
      const g = grp(cx, cy, S / 200, 0, parent); beakerAt(g, num(o.level, .55), o.c || 'blue');
      if (t) txt(g, 0, 130, t, TXT.blue, 26);
      return g;
    },

    // "flask cx cy size k=conical|round c=green level=0.4 | Solution"
    flask: ([cx, cy, S = 220], o, t, parent) => {
      const g = grp(cx, cy, S / 220, 0, parent), k = o.k || 'conical';
      if (k === 'conical') conicalAt(g, num(o.level, .4), o.c || 'green');
      else if (k === 'round') roundAt(g, num(o.level, .45), o.c || 'green');
      else throw new Error(`Unknown flask "${k}"`);
      if (t) txt(g, 0, 132, t, TXT.blue, 26);
      return g;
    },

    // "testtube cx cy length c=red level=0.35 rot=deg | Sample"
    testtube: ([cx, cy, L = 200], o, t, parent) => {
      const outer = mk('g', {}, parent), g = grp(cx, cy, L / 200, o.rot, outer); tubeAt(g, num(o.level, .35), o.c || 'red');
      if (t) txt(outer, cx, cy + L * .5 + 30, t, TXT.blue, 24);
      return outer;
    },

    // "tuberack cx cy width c=red,blue,green,yellow" — wooden rack of test tubes
    tuberack: ([cx, cy, W = 320], o, t, parent) => {
      const g = grp(cx, cy, W / 320, 0, parent), cs = String(o.c || 'red,blue,green,yellow').split(','), n = cs.length;
      part(g, R(-160, 72, 320, 16, 4), '#c8955e', '#6e4a28');
      part(g, R(-150, 4, 14, 68), '#b98250', '#6e4a28', 2.6); part(g, R(136, 4, 14, 68), '#b98250', '#6e4a28', 2.6);
      cs.forEach((c, i) => { const tg = grp(-110 + 220 * (n === 1 ? .5 : i / (n - 1)), -22, .8, 0, g); tubeAt(tg, .3 + .1 * (i % 3), c.trim()); });
      part(g, R(-160, -12, 320, 18, 4), '#d9a670', '#6e4a28');
      line(g, 'M-150 -6 H150', '#f0c995', 3, { opacity: .8 });
      if (t) txt(g, 0, 118, t);
      return g;
    },

    // "bunsen cx cy size k=blue|yellow" — gas burner with flame (loop beat flickers the flame)
    bunsen: ([cx, cy, S = 240], o, t, parent) => {
      const g = grp(cx, cy, S / 240, 0, parent);
      g.anim = flameAt(g, 0, -12, 1, o.k === 'yellow');
      part(g, 'M14 78 H58 Q64 78 64 84 Q64 90 58 90 H14 Z', '#9aa3ad', '#3e464f', 2.6);
      part(g, R(-13, -14, 26, 108, 3), '#b8c0c8', '#3e464f');
      part(g, R(-17, 52, 34, 16, 3), '#7d8792', '#3e464f', 2.6);
      line(g, C(0, 60, 3.5), '#1d2329', 2.4);
      part(g, 'M-62 94 H62 L56 114 H-56 Z', '#5d6670', '#2a3036');
      line(g, 'M-6 -6 V40', '#ffffff', 4, { opacity: .6 });
      if (t) txt(g, 0, 140, t);
      return g;
    },

    // "beakertherm cx cy size c=blue level=0.55 v=0.6 | 40 °C" — beaker of liquid with a thermometer in it
    beakertherm: ([cx, cy, S = 260], o, t, parent) => {
      const g = grp(cx, cy + S * .1, S / 260, 0, parent);
      beakerAt(g, num(o.level, .55), o.c || 'blue', false);
      const th = grp(18, 0, 1, 10, g), v = Math.min(1, Math.max(0, num(o.v, .6)));
      part(th, R(-8, -175, 16, 238, 8), '#fbfdff', '#55606b', 2.6);
      part(th, C(0, 74, 14), '#e04b3a', '#7a1f14', 2.6);
      fl(th, R(-3.5, 63 - v * 225, 7, v * 225 + 4), '#e04b3a');
      line(th, `M0 64 V${63 - v * 225}`, '#c0392b', 5);
      let d = ''; for (let y = 40; y > -165; y -= 20) d += `M8 ${y} h${(y / 20) % 2 ? 5 : 9} `;
      line(th, d, '#55606b', 1.8);
      if (t) txt(g, 66, -150, t, TXT.red, 26);
      return g;
    },

    // "dropper cx cy length c=purple rot=deg" — dropper with a drop at its tip
    dropper: ([cx, cy, L = 200], o, t, parent) => {
      const outer = mk('g', {}, parent), g = grp(cx, cy, L / 200, o.rot, outer), c = o.c || 'purple';
      part(g, 'M-15 -40 C-26 -60 -24 -96 0 -100 C24 -96 26 -60 15 -40 Z', '#e86a5a', '#7a2a1f');
      part(g, R(-17, -44, 34, 12, 4), '#c94a3a', '#7a2a1f', 2.4);
      const body = 'M-9 -32 L9 -32 L9 50 L2 82 L-2 82 L-9 50 Z';
      fl(g, body, GL); liquid(g, body, 30, c, -9, 9);
      line(g, body, GI, 2.8);
      part(g, 'M0 92 C-7 102 -8 110 0 112 C8 110 7 102 0 92 Z', LQ[c] || LQ.purple, LI[c] || LI.purple, 2.4);
      line(g, 'M-4 -24 V40', '#ffffff', 3, { opacity: .8 });
      if (t) txt(outer, cx + L * .3, cy, t);
      return outer;
    },

    // "mcylinder cx cy size c=blue level=0.6 | 60 mL" — measuring cylinder with scale
    mcylinder: ([cx, cy, S = 260], o, t, parent) => {
      const g = grp(cx, cy, S / 260, 0, parent), lv = num(o.level, .6), c = o.c || 'blue';
      const body = 'M-26 -112 L26 -112 L26 100 L-26 100 Z';
      fl(g, body, GL);
      liquid(g, body, 100 - lv * 205, c, -26, 26);
      line(g, 'M-34 -122 Q-26 -120 -26 -110 L-26 100 M26 100 L26 -116 Q27 -121 32 -122', GI, 3);
      part(g, 'M-28 100 H28 L58 112 V122 H-58 V112 Z', '#d4e6f3', GI, 3);
      let d = ''; for (let i = 0; i <= 10; i++) { const y = 100 - i * 20.5; d += `M-26 ${y} h${i % 2 ? 9 : 16} `; }
      line(g, d, GI, 2);
      for (let i = 2; i <= 10; i += 2) label(g, -6, 100 - i * 20.5 + 5, String(i * 10), '#4a6782', 14);
      line(g, 'M16 -100 V90', '#ffffff', 4, { opacity: .75 });
      if (t) txt(g, 0, 148, t);
      return g;
    },

    // "labscale cx cy size k=digital|pan tilt=deg | 25.0 g" — digital lab balance or two-pan balance
    labscale: ([cx, cy, S = 260], o, t, parent) => {
      const g = grp(cx, cy, S / 260, 0, parent), k = o.k || 'digital';
      if (k === 'digital') {
        part(g, R(-14, -30, 28, 14), '#9aa3ad', '#3e464f', 2.4);
        part(g, R(-104, -42, 208, 14, 7), '#cfd6dd', '#3e464f');
        part(g, 'M-124 -16 H124 L114 62 H-114 Z', '#e9edf1', '#3e464f');
        part(g, R(-58, 4, 116, 38, 5), '#2e3a2e', '#1d2329', 2.6);
        txt(g, 0, 23, t || '0.00 g', '#9ff08a', 26);
        line(g, C(80, 24, 8) + C(-80, 24, 8), '#3e464f', 2.4);
        line(g, 'M-90 -36 H60', '#ffffff', 3, { opacity: .8 });
      } else if (k === 'pan') {
        const a = (num(o.tilt, 0)) * Math.PI / 180, ex = 110 * Math.cos(a), ey = 110 * Math.sin(a);
        part(g, 'M-70 112 H70 L56 96 H-56 Z', '#b98250', '#6e4a28');
        part(g, R(-7, -70, 14, 168, 3), '#c8955e', '#6e4a28', 2.6);
        line(g, `M${-ex} ${-80 - ey} L${ex} ${-80 + ey}`, '#6e4a28', 6);
        part(g, 'M-12 -70 L0 -86 L12 -70 Z', '#7d8792', '#3e464f', 2.4);
        for (const s of [-1, 1]) {
          const x = s * ex, y = -80 + s * ey;
          line(g, `M${x} ${y} L${x - 40} ${y + 70} M${x} ${y} L${x + 40} ${y + 70}`, '#55606b', 2);
          part(g, `M${x - 50} ${y + 70} H${x + 50} Q${x} ${y + 98} ${x - 50} ${y + 70} Z`, '#d9b24a', '#7a5a14', 2.6);
        }
        if (t) txt(g, 0, 140, t);
      } else throw new Error(`Unknown labscale "${k}"`);
      return g;
    },

    // "matterbox cx cy size k=solid|liquid|gas c=orange | Solid" — particles in a box (loop beat/sway jiggles them)
    matterbox: ([cx, cy, S = 200], o, t, parent) => {
      const g = grp(cx, cy, S / 200, 0, parent), k = o.k || 'solid', c = o.c || 'orange', rnd = rand(k.length * 97 + 3);
      fl(g, R(-100, -100, 200, 200, 6), '#f4f8fb');
      const P = mk('g', { class: 'pivot' }, g); g.anim = P;
      const pts = [], r = 12;
      if (k === 'solid') { for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) pts.push([-62.5 + i * 25, 88 - r - j * 25]); }
      else if (k === 'liquid') { for (let j = 0; j < 4; j++) { const n = j % 2 ? 6 : 7, x0 = j % 2 ? -63.75 : -76.5; for (let i = 0; i < n; i++) pts.push([x0 + i * 25.5 + (rnd() - .5) * 3, 87 - j * 22.5 - rnd() * 2]); } }
      else if (k === 'gas') { for (const [x, y] of [[-60, -62], [10, -70], [64, -40], [-30, -10], [44, 20], [-70, 40], [0, 58], [70, 72], [-40, 76]]) pts.push([x + (rnd() - .5) * 8, y]); }
      else throw new Error(`Unknown matterbox "${k}"`);
      fl(P, pts.map(([x, y]) => C(x, y, r)).join(' '), FILL[c] || c);
      line(P, pts.map(([x, y]) => C(x, y, r)).join(' '), INK[c] || '#555', 2.2);
      if (k === 'gas') line(P, pts.map(([x, y], i) => { const a = i * 2.1; return `M${x - 17 * Math.cos(a)} ${y - 17 * Math.sin(a)} l${-12 * Math.cos(a)} ${-12 * Math.sin(a)} `; }).join(''), '#8a939c', 2);
      if (k === 'liquid') line(g, 'M-99 8 H99', '#5a9fd8', 2.6);
      line(g, R(-100, -100, 200, 200, 6), '#4a5560', 3.2);
      if (t) txt(g, 0, 132, t, TXT.blue, 26);
      return g;
    },

    // "statechange cx cy width" — solid ⇄ liquid ⇄ gas boxes with melting, boiling, condensing, freezing arrows
    statechange: ([cx, cy, W = 560], o, t, parent) => {
      const g = grp(cx, cy, W / 560, 0, parent), R2 = window.RECIPES;
      [['solid', -200], ['liquid', 0], ['gas', 200]].forEach(([k, x]) => { R2.matterbox([x, 0, 120], { k, c: o.c }, '', g); if (showLab(o)) txt(g, x, -84, k, TXT.blue, 22); });
      const arc = (x1, x2, y, up, s, c) => {
        const q = up ? y - 46 : y + 46; line(g, `M${x1} ${y} Q${(x1 + x2) / 2} ${q} ${x2} ${y}`, c, 3); line(g, head(x2, y, (x1 + x2) / 2, q), c, 3, { class: 'ink head' });
        if (showLab(o)) txt(g, (x1 + x2) / 2, up ? y - 44 : y + 44, s, c === INK.red ? TXT.red : TXT.blue, 18);
      };
      arc(-138, -62, -30, true, 'melting', INK.red); arc(62, 138, -30, true, 'boiling', INK.red);
      arc(-62, -138, 30, false, 'freezing', INK.blue); arc(138, 62, 30, false, 'condensing', INK.blue);
      return g;
    },

    // "dissolve cx cy size c=purple" — crystal dissolving, its particles spreading through water (loop sway drifts them)
    dissolve: ([cx, cy, S = 220], o, t, parent) => {
      const g = grp(cx, cy, S / 220, 0, parent), c = o.c || 'purple', rnd = rand(11);
      beakerAt(g, .7, 'clear');
      fl(g, 'M-34 96 C-60 60 -40 20 0 30 C40 20 60 60 34 96 Z', LQ[c] || c, { opacity: .45 });
      part(g, 'M-14 98 L-16 80 L0 72 L16 80 L14 98 Z', LI[c] || '#6a3d9a', '#3a1f5a', 2.4);
      const P = mk('g', { class: 'pivot' }, g); g.anim = P;
      let d = ''; for (let i = 0; i < 42; i++) { const a = Math.PI * (1 + rnd()), r = 26 + 80 * rnd() ** .8; d += `M${r * Math.cos(a) * .55} ${92 + r * Math.sin(a) * .95} l.1 0 `; }
      line(P, d, LI[c] || '#6a3d9a', 6);
      if (t) txt(g, 0, 130, t);
      return g;
    },

    // "phscale cx cy width at=3" — pH strip 0–14, acid red to alkali purple, optional marker
    phscale: ([cx, cy, W = 560], o, t, parent) => {
      const g = grp(cx, cy, W / 560, 0, parent), w = 560 / 15;
      const COL = ['#d7263d', '#e8432e', '#f2672a', '#f68c2a', '#f9b42b', '#f6d52c', '#d6e03a', '#8fcb4a', '#4fb05a', '#2fa48a', '#2f8fb8', '#3a6fc8', '#4f56b8', '#5f45a8', '#6a3a95'];
      COL.forEach((f, i) => fl(g, R(-280 + i * w, -26, w + .5, 52), f));
      let d = R(-280, -26, 560, 52, 4); for (let i = 1; i < 15; i++) d += ` M${-280 + i * w} -26 V26`;
      line(g, d, '#3e464f', 2.4);
      COL.forEach((f, i) => txt(g, -280 + (i + .5) * w, 0, String(i), i > 3 && i < 9 ? '#3e464f' : '#ffffff', 20));
      if (showLab(o)) { txt(g, -240, 52, 'acid', TXT.red, 24); txt(g, 0, 52, 'neutral', TXT.green, 24); txt(g, 240, 52, 'alkali', '#6a3a95', 24); }
      if (o.at !== undefined) { const x = -280 + (num(o.at, 7) + .5) * w; line(g, `M${x} -34 L${x - 10} -52 L${x + 10} -52 Z`, '#1d2329', 3); }
      if (t) txt(g, 0, -74, t);
      return g;
    },

    // "indicator cx cy size k=universal|litmus" — universal indicator colours in tubes, or litmus strips in acid/alkali
    indicator: ([cx, cy, S = 320], o, t, parent) => {
      const g = grp(cx, cy, S / 320, 0, parent), k = o.k || 'universal';
      if (k === 'universal') {
        [['red', 1], ['orange', 4], ['green', 7], ['blue', 10], ['purple', 13]].forEach(([c, p], i) => {
          const x = -128 + i * 64; tubeAt(grp(x, -10, .62, 0, g), .5, c); txt(g, x, 70, 'pH ' + p, LI[c], 18);
        });
        if (showLab(o)) { txt(g, -110, 104, 'acid', TXT.red, 22); txt(g, 110, 104, 'alkali', '#6a3a95', 22); }
      } else if (k === 'litmus') {
        [[-80, 'acid', '#7fb7ea', '#e8553f', 'red'], [80, 'alkali', '#f29a8a', '#4f7fd8', 'blue']].forEach(([x, s, top, bot, c]) => {
          const b = grp(x, 20, .6, 0, g); beakerAt(b, .45, 'clear', false);
          part(g, R(x - 10, -80, 20, 82), top, '#55606b', 2.2); part(g, R(x - 10, 2, 20, 70), bot, '#55606b', 2.2);
          if (showLab(o)) txt(g, x, 104, s, TXT[c], 22);
        });
      } else throw new Error(`Unknown indicator "${k}"`);
      if (t) txt(g, 0, -120, t);
      return g;
    },

    // "ptile cx cy size n=6 m=12.011 c=green | C Carbon" — one periodic-table tile
    ptile: ([cx, cy, S = 150], o, t, parent) => {
      const g = grp(cx, cy, S / 150, 0, parent), PT = { red: '#f7b3a8', orange: '#fbd29a', yellow: '#fff0a0', green: '#c5e8a6', blue: '#bcdcf6', purple: '#d9c3f0', grey: '#e2e4e6' };
      const [sym = 'H', ...rest] = String(t || 'H Hydrogen').split(/\s+/);
      const tile = R(-75, -75, 150, 150, 10);
      fl(g, tile, PT[o.c] || PT.blue);
      mk('path', { d: tile, fill: 'none', stroke: '#3e464f', 'stroke-width': 3, class: 'fillable' }, g);   // solid backing: the rough filter tears long straight edges
      line(g, tile, '#3e464f', 3.6);
      if (o.n) label(g, -62, -50, o.n, '#3e464f', 22);
      txt(g, 0, -2, sym, '#1d2329', 62);
      if (rest.length) txt(g, 0, 42, rest.join(' '), '#3e464f', 18);
      if (o.m) txt(g, 0, 62, o.m, '#55606b', 15);
      return g;
    },

    // "ptable cx cy width" — mini periodic table, blocks coloured (s, p, d, f, noble gases)
    ptable: ([cx, cy, W = 540], o, t, parent) => {
      const g = grp(cx, cy, W / 540, 0, parent), w = 30, x0 = -270, y0 = -144, cells = {};
      const add = (c, r, col) => (cells[col] = cells[col] || []).push(R(x0 + c * w, y0 + r * w, w, w));
      const col = c => c < 2 ? '#f4a7a0' : c < 12 ? '#a9cdf2' : c < 17 ? '#ffe08a' : '#d3b8ef';
      add(0, 0, '#ffe08a'); add(17, 0, col(17));
      for (let r = 1; r < 7; r++) for (let c = 0; c < 18; c++) if (r > 2 || c < 2 || c > 11) add(c, r, col(c));
      for (const r of [7.6, 8.6]) for (let c = 2; c < 16; c++) add(c, r, '#b9e3a5');
      for (const [f, ds] of Object.entries(cells)) fl(g, ds.join(' '), f);
      line(g, Object.values(cells).flat().join(' '), '#55606b', 1.6);
      for (const [s, c, r] of [['H', 0, 0], ['He', 17, 0], ['C', 13, 1], ['N', 14, 1], ['O', 15, 1], ['Na', 0, 2], ['Fe', 7, 3], ['Cu', 10, 3]])
        txt(g, x0 + (c + .5) * w, y0 + (r + .5) * w, s, '#1d2329', 15);
      if (t) txt(g, 0, y0 - 22, t);
      return g;
    },

    // "reaction cx cy scale | iron + oxygen -> rust" — reactants box → products box
    reaction: ([cx, cy, s = 1], o, t, parent) => {
      const g = grp(cx, cy, s, 0, parent), [lhs, rhs = '?'] = String(t || 'A + B -> C').split(/->|→/).map(x => x.trim());
      const bw = x => Math.max(120, x.length * 15 + 40), w1 = bw(lhs), w2 = bw(rhs), gap = 110, tot = w1 + gap + w2, x1 = -tot / 2, x2 = x1 + w1 + gap;
      part(g, R(x1, -36, w1, 72, 10), '#dcebf9', INK.blue);
      part(g, R(x2, -36, w2, 72, 10), '#dff2d2', INK.green);
      line(g, `M${x1 + w1 + 16} 0 H${x2 - 16}`, '#3e464f', 3.5); line(g, head(x2 - 16, 0, x1 + w1, 0, 16), '#3e464f', 3.5, { class: 'ink head' });
      txt(g, x1 + w1 / 2, 0, lhs, TXT.blue, 30); txt(g, x2 + w2 / 2, 0, rhs, TXT.green, 30);
      if (showLab(o)) { txt(g, x1 + w1 / 2, -56, 'reactants', '#55606b', 18); txt(g, x2 + w2 / 2, -56, 'products', '#55606b', 18); }
      return g;
    },

    // "gasbubbles cx bottomY height w=60" — column of rising gas bubbles (loop rise)
    gasbubbles: ([cx, yb, H = 200], o, t, parent) => {
      const g = mk('g', {}, parent), w = num(o.w, 60), rnd = rand(5), n = Math.max(4, Math.round(H / 26));
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), r = 5 + 8 * u + rnd() * 3, x = cx + (rnd() - .5) * w, y = yb - u * (H - 14) - 6;
        line(g, C(x, y, r), INK.sky, 2.4);
        line(g, `M${x - r * .5} ${y - r * .1} Q${x - r * .45} ${y - r * .5} ${x - r * .05} ${y - r * .55}`, '#ffffff', 2, { opacity: .9 });
      }
      if (t) label(g, cx + w / 2 + 16, yb - H / 2, t, TXT.sky, 22);
      return g;
    },

    // "precipitate cx cy size c=yellow | Precipitate" — test tube with solid settling out at the bottom
    precipitate: ([cx, cy, S = 240], o, t, parent) => {
      const g = grp(cx, cy, S / 240, 0, parent), c = o.c || 'yellow', body = 'M-20 -94 L20 -94 L20 80 A20 20 0 0 1 -20 80 Z', rnd = rand(3);
      const tg = grp(0, 0, 1.15, 0, g);
      fl(tg, body, GL); liquid(tg, body, 100 - .62 * 194, 'clear', -20, 20);
      const id = 'chemP' + clipN++; mk('clipPath', { id }, tg).append(mk('path', { d: body }));
      fl(tg, 'M-30 62 Q-10 56 0 60 Q10 64 30 58 V110 H-30 Z', LQ[c] || c, { 'clip-path': `url(#${id})` });
      let d = ''; for (let i = 0; i < 26; i++) { const y = -20 + rnd() ** .5 * 76; d += `M${(rnd() - .5) * 30} ${y} l.1 0 `; }
      line(tg, d, LI[c] || '#a88a10', 4.5);
      line(tg, 'M-27 -100 Q-20 -98 -20 -92 L-20 80 A20 20 0 0 0 20 80 L20 -92 Q20 -98 27 -100', GI, 3);
      line(tg, 'M-11 -80 L-11 40', '#ffffff', 4, { opacity: .75 });
      if (t) txt(g, 0, 148, t);
      return g;
    },

    // "crystals cx cy size c=purple|blue|green|white" — cluster of faceted crystals on a rock
    crystals: ([cx, cy, S = 220], o, t, parent) => {
      const g = grp(cx, cy, S / 220, 0, parent), CC = { purple: ['#cdb0f0', '#9a6ad0', '#4a2a78'], blue: ['#bfe2fb', '#6fb1e8', '#1f4f8f'], green: ['#c9f0b8', '#6cc04a', '#2c6a22'], white: ['#ffffff', '#d5dde5', '#6b7785'] }[o.c || 'purple'] || ['#cdb0f0', '#9a6ad0', '#4a2a78'];
      part(g, 'M-96 96 C-100 70 -70 58 -40 64 C-10 56 30 56 60 62 C90 60 104 80 96 96 Z', '#a7a29a', '#55504a');
      for (const [x, w, h, rot] of [[-44, 42, 92, -22], [48, 38, 74, 24], [2, 54, 128, 0]]) {
        const p = grp(x, 72, 1, rot, g), tip = -h - w * .8;
        fl(p, `M${-w / 2} 0 V${-h} L0 ${tip} L${w / 2} ${-h} V0 Z`, CC[0]);
        fl(p, `M0 0 V${-h} L0 ${tip} L${w / 2} ${-h} V0 Z`, CC[1], { opacity: .7 });
        line(p, `M${-w / 2} 0 V${-h} L0 ${tip} L${w / 2} ${-h} V0 M0 0 V${-h} L0 ${tip} M${-w / 2} ${-h} L0 ${-h + w * .25} L${w / 2} ${-h} M0 ${-h} V${-h + w * .25}`, CC[2], 2.6);
        line(p, `M${-w / 2 + 7} ${-10} V${-h + 6}`, '#ffffff', 3.5, { opacity: .8 });
      }
      if (t) txt(g, 0, 128, t);
      return g;
    },

    // "rust cx cy length k=rusty|clean | Rust" — iron nail, with or without rust patches
    rust: ([cx, cy, L = 320], o, t, parent) => {
      const g = grp(cx, cy, L / 320, 0, parent), out = 'M-156 -26 Q-148 -28 -146 -20 L-146 -9 L118 -9 L160 0 L118 9 L-146 9 L-146 20 Q-148 28 -156 26 Z';
      fl(g, out, '#b3bbc4');
      if (o.k !== 'clean') {
        const id = 'chemR' + clipN++; mk('clipPath', { id }, g).append(mk('path', { d: out }));
        const rg = mk('g', { 'clip-path': `url(#${id})` }, g);
        for (const [x, w, f] of [[-120, 50, '#b5562a'], [-40, 70, '#c9662e'], [50, 46, '#a84a22'], [110, 36, '#d9792e']]) fl(rg, `M${x} -14 Q${x + w / 2} -20 ${x + w} -10 Q${x + w + 6} 4 ${x + w} 14 Q${x + w / 2} 18 ${x} 14 Q${x - 8} 0 ${x} -14 Z`, f);
        line(g, 'M-90 22 l.1 0 M-20 26 l.1 0 M10 20 l.1 0 M70 24 l.1 0 M-60 30 l.1 0', '#a84a22', 5);
      }
      line(g, out, '#3e464f', 3);
      line(g, 'M-140 -4 H110', '#ffffff', 3, { opacity: .7 });
      if (t) txt(g, 0, 70, t, o.k === 'clean' ? TXT.blue : '#a84a22', 26);
      return g;
    },

    // "ecell cx cy size | Simple cell" — zinc and copper electrodes in solution, wire and bulb
    ecell: ([cx, cy, S = 300], o, t, parent) => {
      const g = grp(cx, cy, S / 300, 0, parent);
      beakerAt(grp(0, 40, .9, 0, g), .72, o.c || 'blue', false);
      part(g, R(-46, -80, 20, 190, 3), '#a7b0b9', '#3e464f', 2.6);
      part(g, R(26, -80, 20, 190, 3), '#d9874a', '#7a3f14', 2.6);
      line(g, 'M-36 -80 V-128 H-14 M14 -128 H36 V-80', '#3e464f', 3.2);
      part(g, R(-10, -132, 20, 14, 2), '#9aa3ad', '#3e464f', 2.4);
      part(g, C(0, -146, 17), '#ffe066', '#a88a10', 2.6);
      line(g, 'M-6 -138 L-3 -150 L3 -142 L6 -152', '#d27b0c', 2);
      line(g, head(-20, -128, -36, -128, 11) + ' ' + head(36, -98, 36, -128, 11), TXT.orange, 3, { class: 'ink head' });
      txt(g, -36, -60, '−', '#1d2329', 30); txt(g, 36, -60, '+', '#1d2329', 30);
      if (showLab(o)) { txt(g, -78, -100, 'zinc', '#55606b', 18); txt(g, 82, -100, 'copper', '#7a3f14', 18); }
      if (t) txt(g, 0, 160, t);
      return g;
    },

    // "distill cx cy width c=purple" — distillation: heated flask, cooled condenser, collecting flask
    distill: ([cx, cy, W = 600], o, t, parent) => {
      const g = grp(cx, cy, W / 600, 0, parent), A = [-180, -78], B = [158, 48];
      const dx = B[0] - A[0], dy = B[1] - A[1], Ln = Math.hypot(dx, dy), u = [dx / Ln, dy / Ln], nv = [-u[1], u[0]];
      const P = (s, k) => `${A[0] + u[0] * s + nv[0] * k} ${A[1] + u[1] * s + nv[1] * k}`;
      line(g, 'M-240 150 L-222 78 M-140 150 L-158 78 M-236 78 H-144', '#55606b', 3);
      part(g, R(-198, 116, 16, 26, 2), '#b8c0c8', '#3e464f', 2.4); part(g, R(-218, 140, 56, 10, 3), '#5d6670', '#2a3036', 2.4);
      flameAt(g, -190, 114, .3);
      roundAt(grp(-190, 4, .75, 0, g), .45, o.c || 'purple');
      part(g, R(-200, -104, 20, 14, 3), '#b98250', '#6e4a28', 2.4);
      fl(g, `M${P(40, -20)} L${P(270, -20)} L${P(270, 20)} L${P(40, 20)} Z`, '#cfe8f8');
      fl(g, `M${P(0, -5)} L${P(Ln, -5)} L${P(Ln, 5)} L${P(0, 5)} Z`, GL);
      const stub = (sa, k0, k1) => `M${P(sa - 8, k0)} L${P(sa - 8, k1)} L${P(sa + 8, k1)} L${P(sa + 8, k0)}`;
      fl(g, stub(240, 20, 60) + ' Z ' + stub(70, -20, -60) + ' Z', '#cfe8f8');
      line(g, `M${P(40, -20)} L${P(270, -20)} L${P(270, 20)} L${P(40, 20)} Z ${stub(240, 20, 60)} ${stub(70, -20, -60)}`, GI, 3);
      line(g, `M${P(0, -5)} L${P(Ln, -5)} M${P(0, 5)} L${P(Ln, 5)}`, GI, 2.6);
      conicalAt(grp(160, 95, .5, 0, g), .3, 'clear');
      part(g, 'M160 56 C156 62 156 66 160 67 C164 66 164 62 160 56 Z', LQ.clear, LI.clear, 2);
      const at = (sa, k) => P(sa, k).split(' ').map(Number);
      const [ix, iy] = at(240, 72), [ox, oy] = at(70, -72);
      line(g, `M${ix - 50} ${iy} L${ix - 6} ${iy - 4}`, TXT.blue, 2.6); line(g, head(ix - 6, iy - 4, ix - 50, iy, 10), TXT.blue, 2.6, { class: 'ink head' });
      if (showLab(o)) label(g, ix - 56, iy + 8, 'cold water in', TXT.blue, 24, 'end');
      line(g, `M${ox} ${oy} L${ox + 4} ${oy - 34}`, TXT.blue, 2.6); line(g, head(ox + 4, oy - 34, ox, oy, 10), TXT.blue, 2.6, { class: 'ink head' });
      if (showLab(o)) label(g, ox - 8, oy - 20, 'water out', TXT.blue, 24, 'end');
      if (t) txt(g, 0, -130, t);
      return g;
    },

    // "filtration cx cy size c=brown" — funnel with filter paper over a flask; residue stays, filtrate drips through
    filtration: ([cx, cy, S = 260], o, t, parent) => {
      const g = grp(cx, cy, S / 260, 0, parent), c = o.c || 'brown', rnd = rand(9);
      conicalAt(grp(0, 80, .5, 0, g), .28, 'clear');
      const funnel = 'M-82 -110 L82 -110 L10 -12 L6 46 L-6 46 L-10 -12 Z';
      fl(g, funnel, GL);
      const paper = 'M-72 -118 L72 -118 L0 -20 Z';
      fl(g, paper, '#fffdf6');
      const id = 'chemF' + clipN++; mk('clipPath', { id }, g).append(mk('path', { d: paper }));
      fl(g, 'M-90 -86 Q0 -80 90 -86 V0 H-90 Z', LQ[c] || c, { 'clip-path': `url(#${id})`, opacity: .85 });
      let d = ''; for (let i = 0; i < 14; i++) { const y = -60 + rnd() * 34, hw = (y + 20) * -.72; d += `M${(rnd() - .5) * hw * 1.4} ${y} l.1 0 `; }
      line(g, d, LI[c] || '#6e4a28', 5);
      line(g, paper + ' M0 -118 L0 -20', '#9a968c', 2);
      line(g, 'M-90 -116 Q-84 -110 -82 -108 L-10 -12 L-6 46 M6 46 L10 -12 L82 -108 Q84 -110 90 -116', GI, 3);
      part(g, 'M0 54 C-5 61 -5 66 0 67 C5 66 5 61 0 54 Z', LQ.clear, LI.clear, 2);
      if (t) txt(g, 0, 152, t);
      return g;
    },

    // "chroma cx cy size" — paper chromatography: ink spot separated into colours up a paper strip
    chroma: ([cx, cy, S = 260], o, t, parent) => {
      const g = grp(cx, cy, S / 260, 0, parent);
      beakerAt(grp(0, 30, .9, 0, g), .2, 'clear', false);
      part(g, R(-30, -74, 60, 178, 2), '#fffdf6', '#9a968c', 2.2);
      line(g, 'M-26 74 H26', '#6c6c6c', 1.8);
      line(g, 'M-26 -50 H26', '#7fb7ea', 2, { opacity: .8 });
      for (const [y, f, r] of [[74, '#55606b', 6], [44, '#e8553f', 8], [6, '#f2c230', 9], [-28, '#3a6fd0', 8]]) fl(g, `M0 ${y - r} C${r * 1.4} ${y - r} ${r * 1.4} ${y + r} 0 ${y + r} C${-r * 1.4} ${y + r} ${-r * 1.4} ${y - r} 0 ${y - r} Z`, f, { opacity: y === 74 ? .4 : 1 });
      part(g, R(-96, -84, 192, 12, 6), '#e9ecf1', '#55606b', 2.4);
      if (t) txt(g, 0, 160, t);
      return g;
    },

    // "catalyst cx cy width" — energy profile: high hump without catalyst, lower hump with one
    catalyst: ([cx, cy, W = 480], o, t, parent) => {
      const g = grp(cx, cy, W / 480, 0, parent);
      line(g, 'M-220 -130 V120 H220', '#3e464f', 3); line(g, head(-220, -132, -220, -100) + ' ' + head(222, 120, 190, 120), '#3e464f', 3, { class: 'ink head' });
      line(g, 'M-210 40 H-140 C-80 40 -50 -100 0 -100 C50 -100 80 85 140 85 H210', INK.red, 3.4);
      line(g, 'M-140 40 C-80 40 -50 -24 0 -24 C50 -24 80 85 140 85', INK.green, 3.4);
      if (showLab(o)) { label(g, 18, -108, 'without catalyst', TXT.red, 18); txt(g, 0, 32, 'with catalyst', TXT.green, 17);
      txt(g, -176, 22, 'reactants', '#55606b', 16); txt(g, 176, 66, 'products', '#55606b', 16);
      label(g, -212, -136, 'energy', '#55606b', 16); label(g, 214, 146, 'progress', '#55606b', 16, 'end'); }
      if (t) txt(g, 0, -150, t);
      return g;
    },

    // "polymer cx cy width n=8 | Polymer chain" — repeating units linked into a long chain
    polymer: ([cx, cy, W = 520], o, t, parent) => {
      const g = grp(cx, cy, W / 520, 0, parent), n = Math.max(3, num(o.n, 8)), sp = 440 / (n - 1);
      const pts = Array.from({ length: n }, (_, i) => [-220 + i * sp, (i % 2 ? 22 : -22)]);
      line(g, 'M-252 -8 L' + pts.map(p => p.join(' ')).join(' L') + ` L252 ${n % 2 ? -8 : 8}`, '#7d8792', 7);
      pts.forEach(([x, y], i) => ball(g, x, y, 22, i % 2 ? '#7fb7ea' : '#f4a531', i % 2 ? '#1f4f8f' : '#8a5a14'));
      if (t) txt(g, 0, 104, t);
      return g;
    },

    // "burette cx cy size c=pink" — titration: burette on a stand dripping into a conical flask
    burette: ([cx, cy, S = 320], o, t, parent) => {
      const g = grp(cx, cy, S / 320, 0, parent);
      part(g, R(-156, 148, 100, 12, 3), '#7d8792', '#3e464f', 2.4); part(g, R(-112, -156, 10, 304, 3), '#9aa3ad', '#3e464f', 2.4);
      part(g, R(-104, -110, 96, 10, 3), '#7d8792', '#3e464f', 2.4);
      const body = 'M-8 -156 L8 -156 L8 42 L-8 42 Z';
      fl(g, body, GL); liquid(g, body, -120, 'clear', -8, 8);
      line(g, 'M-8 -160 V42 M8 42 V-160', GI, 2.6);
      let d = ''; for (let y = -140; y < 40; y += 18) d += `M-8 ${y} h${(y / 18) % 2 ? 5 : 9} `; line(g, d, GI, 1.6);
      part(g, R(-10, 42, 20, 14, 3), '#d4e6f3', GI, 2.4); part(g, R(-24, 45, 48, 8, 4), '#3a6fd0', '#1f3f80', 2.2);
      line(g, 'M-4 56 L-2 74 M4 56 L2 74', GI, 2.4);
      part(g, 'M0 80 C-4 85 -4 89 0 90 C4 89 4 85 0 80 Z', LQ.clear, LI.clear, 2);
      conicalAt(grp(0, 150 - 50, .5, 0, g), .3, o.c || 'pink');
      if (t) txt(g, 70, -60, t);
      return g;
    },
  });
}
