// Whiteboard library — health: nursing, clinical care, public health, nutrition, fitness. Catalogue: health.txt.
// Clinical-friendly, non-gory, respectful; people are faceless or simply drawn; no brands.
(() => {
  const G = (cx, cy, S, D, o, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${S / D})` }, parent);
  const fill = (g, d, f, ex = {}) => mk('path', { d, fill: f, filter: 'url(#wc)', class: 'fillable', ...ex }, g);
  const part = (g, d, f, ink, w = 3) => { fill(g, d, f); return line(g, d, ink, w); };
  const ell = (x, y, rx, ry = rx) => `M${x - rx} ${y} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
  const R = (x, y, w, h, r = 0) => r ? `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
    : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  const sheen = (g, d, w = 6) => line(g, d, '#ffffff', w, { opacity: .55 });
  const lbl = (o) => o.lbl !== '0' && o.lab !== '0' && o.labels !== '0';
  const L = (g, x, y, t, c = '#444', s = 20, a = 'middle') => label(g, x, y, t, c, s, a);
  const arrow = (g, x1, y1, x2, y2, c, w = 2.5) => { line(g, `M${x1} ${y1} L${x2} ${y2}`, c, w); line(g, head(x2, y2, x1, y1, 10), c, w); };
  const rad = a => a * Math.PI / 180, P = (r, a) => [r * Math.cos(rad(a)), r * Math.sin(rad(a))];
  const f1 = n => +n.toFixed(1);
  // annular sector, angles in degrees (0 = right, clockwise)
  const sector = (r0, r1, a0, a1) => { const [x0, y0] = P(r1, a0), [x1, y1] = P(r1, a1), [x2, y2] = P(r0, a1), [x3, y3] = P(r0, a0), big = a1 - a0 > 180 ? 1 : 0;
    return `M${f1(x0)} ${f1(y0)} A${r1} ${r1} 0 ${big} 1 ${f1(x1)} ${f1(y1)} ` + (r0 ? `L${f1(x2)} ${f1(y2)} A${r0} ${r0} 0 ${big} 0 ${f1(x3)} ${f1(y3)} Z` : 'L0 0 Z'); };
  // shrink text to fit a width (Kalam is about half an em wide per character)
  const fit = (s, w, max) => Math.min(max, w / (String(s).length * .5));
  const split = (t, d) => (t || d).split(';').map(s => s.trim()).filter(Boolean);
  const SKIN = '#f3dcc4', SKINK = '#8a5a3a';

  // an open hand, fingers up, palm centre near 0,0 (about 100 x 190)
  const HAND = 'M-24 70 L-28 0 C-40 -4 -56 -18 -60 -32 C-62 -42 -50 -46 -42 -36 L-28 -20 L-28 -84 Q-28 -94 -19 -94 Q-10 -94 -10 -84 L-10 -44 L-9 -44 L-9 -98 Q-9 -106 0 -106 Q9 -106 9 -98 L9 -44 L10 -44 L10 -90 Q10 -98 18 -98 Q26 -98 26 -90 L26 -40 L27 -40 L27 -70 Q27 -78 34 -78 Q41 -78 41 -70 L41 -10 C42 20 34 50 26 70 Z';
  const hand = (g, x, y, s, rot = 0, flip = 1, f = SKIN, ink = SKINK) => {
    const h = mk('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s * flip} ${s})` }, g);
    fill(h, HAND, f); line(h, HAND, ink, 3 / s); return h;
  };
  // a simple faceless figure from joints: thick limbs, round head
  const figure = (g, j, shirt = '#5b8fd0', skin = '#e8c09a', pants = '#4a5a78') => {
    const seg = (pts, c, w) => line(g, 'M' + pts.map(p => p.join(' ')).join(' L'), c, w);
    if (j.legB) seg(j.legB, pants, 15); if (j.armB) seg(j.armB, skin, 11);
    seg(j.body, shirt, 30);
    if (j.legF) seg(j.legF, pants, 15); if (j.armF) seg(j.armF, skin, 11);
    const [hx, hy] = j.head; fill(g, ell(hx, hy, 22), skin); line(g, ell(hx, hy, 22), '#7a5a3a', 2.6);
  };
  const curvedArrow = (g, x, y, r, c = '#2b6cc4') => { line(g, `M${x + r} ${y} A${r} ${r} 0 1 1 ${x} ${y - r}`, c, 3); line(g, head(x, y - r, x - 8, y - r - 1, 10), c, 3); };
  const bubbles = (g, pts) => { for (const [x, y, r] of pts) { fill(g, ell(x, y, r), '#e6f3fb', { opacity: .8 }); line(g, ell(x, y, r), '#7fb7ea', 1.6); } };

  Object.assign(window.RECIPES, {
    // "ivbag cx cy height | Saline" — IV pole, fluid bag, drip chamber, roller clamp, line (loop flow)
    ivbag: ([cx, cy, S = 340], o, t, parent) => {
      const g = G(cx, cy, S, 340, o, parent);
      line(g, 'M-60 150 L-130 164 M-60 150 L10 164 M-60 150 L-60 166', '#5a6470', 5);
      for (const x of [-130, 10]) part(g, ell(x, 166, 7), '#3a4450', '#2a3440', 2);
      line(g, 'M-60 150 L-60 -160', '#7a8490', 7); line(g, 'M-60 -150 L30 -150 L30 -138', '#7a8490', 5);
      const bag = 'M2 -134 Q30 -142 58 -134 L62 -52 Q60 -34 40 -30 L36 -18 L24 -18 L20 -30 Q0 -34 -2 -52 Z';
      fill(g, bag, '#eef6fb'); const id = 'ivb' + clipN++; mk('clipPath', { id }, g).append(mk('path', { d: bag }));
      fill(g, R(-10, -104, 80, 90), '#8ec7ee', { 'clip-path': `url(#${id})` });
      line(g, bag, '#4a6a8a', 3);
      for (let y = -120; y <= -60; y += 15) line(g, `M2 ${y} L10 ${y}`, '#4a6a8a', 1.5);
      L(g, 34, -76, t || 'Saline', '#1f3f60', fit(t || 'Saline', 48, 16));
      line(g, 'M30 -18 L30 -8', '#4a6a8a', 3);
      fill(g, R(20, -8, 20, 44, 6), '#f4f9fc'); fill(g, R(21, 22, 18, 13, 4), '#8ec7ee');
      line(g, R(20, -8, 20, 44, 6), '#4a6a8a', 2.4); fill(g, ell(30, 8, 3, 4.5), '#3d8ad0');
      line(g, 'M30 36 C30 90 60 96 80 120 C96 140 120 150 150 150', '#6a8aa8', 3.5);
      part(g, R(37, 82, 22, 15, 3), '#e0e6ec', '#4a5a6a', 2); line(g, ell(48, 89, 4), '#4a5a6a', 1.6);
      part(g, R(150, 145, 14, 10, 2), '#dfe7ee', '#4a5a6a', 2);
      if (lbl(o)) { L(g, 46, 14, 'drip chamber', '#4a6a8a', 15, 'start'); L(g, 30, 116, 'clamp', '#4a6a8a', 15, 'end'); }
      return g;
    },

    // "infpump cx cy size | 125 mL/h" — infusion pump: rate screen, keypad, tubing through the door (loop flow)
    infpump: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      line(g, 'M-170 -110 C-170 0 -150 35 -110 35 M110 35 C150 35 160 80 160 120', '#6a8aa8', 4);
      part(g, R(-110, -90, 220, 170, 14), '#e8eef3', '#4a5a6a', 3.2);
      part(g, R(-92, -72, 112, 56, 6), '#d3ecd8', '#3a5a4a', 2.4);
      L(g, -36, -36, t || '125 mL/h', '#1f4a2a', fit(t || '125 mL/h', 100, 24));
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) part(g, R(36 + c * 22, -72 + r * 20, 16, 14, 3), '#c8d4de', '#5a6a7a', 1.6);
      part(g, ell(88, 0, 7), '#5fbf5a', '#2f6a24', 1.8);
      part(g, R(-92, 10, 184, 52, 6), '#f6f8fa', '#5a6a7a', 2.2);
      line(g, 'M-110 35 L110 35', '#6a8aa8', 4);
      for (const x of [-60, -10, 40]) line(g, `M${x} 48 L${x + 24} 48`, '#9aa8b6', 2), line(g, head(x + 24, 48, x, 48, 7), '#9aa8b6', 2);
      sheen(g, 'M-96 -82 L60 -82', 4);
      return g;
    },

    // "bpcuff cx cy size | 120/80" — cuff on the upper arm, tube, pressure dial, squeeze bulb
    bpcuff: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent);
      const arm = 'M-170 -30 C-90 -40 -10 -36 30 -30 C50 -28 60 -10 60 10 C60 30 50 44 30 46 C-10 50 -90 50 -170 40';
      fill(g, arm + ' Z', SKIN); line(g, arm, SKINK, 3);
      part(g, R(-120, -46, 90, 104, 10), '#4a7fc0', '#24456e', 3);
      for (const y of [-26, -6, 14, 34]) line(g, `M-112 ${y} L-38 ${y}`, '#6f9ad2', 2, { opacity: .8 });
      line(g, 'M-60 -46 C-60 -90 -10 -100 34 -94', '#3a3a3a', 3.5);
      line(g, 'M-90 58 C-90 90 -60 100 -40 108', '#3a3a3a', 3.5);
      part(g, ell(-20, 124, 30, 22), '#3a3f46', '#1f2328', 2.6); part(g, R(-46, 104, 12, 12, 3), '#9aa8b6', '#4a5a6a', 1.6);
      part(g, ell(80, -90, 48), '#fdfdfb', '#3a4a5a', 3.4);
      for (let i = 0; i <= 10; i++) { const a = 135 + i * 27, [x1, y1] = P(40, a), [x2, y2] = P(i % 2 ? 34 : 30, a); line(g, `M${f1(80 + x1)} ${f1(-90 + y1)} L${f1(80 + x2)} ${f1(-90 + y2)}`, '#3a4a5a', 1.6); }
      const [nx, ny] = P(34, 135 + 4 * 27); line(g, `M80 -90 L${f1(80 + nx)} ${f1(-90 + ny)}`, '#c0392b', 3); part(g, ell(80, -90, 4), '#3a4a5a', '#3a4a5a', 1);
      if (t || lbl(o)) L(g, 136, -84, t || '120/80', '#c0392b', 22, 'start'); if (lbl(o)) L(g, 136, -60, 'mmHg', '#555', 15, 'start');
      return g;
    },

    // "pulseox cx cy size | 98%" — fingertip clip with SpO₂ and pulse readout
    pulseox: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 230, o, parent);
      const fin = 'M-150 -24 L20 -24 C46 -24 56 -10 56 0 C56 12 46 24 20 24 L-150 24';
      fill(g, fin + ' Z', SKIN); line(g, fin, SKINK, 3);
      part(g, 'M-50 -18 C-50 -60 -40 -66 0 -66 L84 -66 Q100 -66 100 -50 L100 -22 Q100 -16 92 -16 L-50 -16 Z', '#e9eef3', '#3a4a5a', 3);
      part(g, 'M-50 18 L92 18 Q100 18 100 24 L100 48 Q100 62 84 62 L0 62 C-40 62 -50 56 -50 18 Z', '#e9eef3', '#3a4a5a', 3);
      line(g, 'M-50 -16 L-50 18', '#3a4a5a', 3);
      part(g, R(-34, -58, 120, 34, 5), '#1f3340', '#0f1a20', 2);
      L(g, -28, -34, 'SpO₂', '#7fd0ff', 16, 'start'); L(g, 82, -34, t || '98%', '#7ff09a', 20, 'end');
      fill(g, ell(30, 20, 10, 4), '#ff6a5a', { opacity: .6 });
      if (lbl(o)) L(g, 26, 92, '♥ 72 bpm', '#c0392b', 20);
      return g;
    },

    // "o2mask cx cy size k=mask|cannula" — oxygen face mask or nasal cannula on a simple face, tubing
    o2mask: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      for (const s of [-1, 1]) part(g, ell(s * 82, -10, 12, 22), SKIN, SKINK, 2.6);
      part(g, ell(0, -20, 80, 100), SKIN, SKINK, 3.2);
      part(g, 'M-78 -40 C-80 -110 -40 -122 0 -122 C40 -122 80 -110 78 -40 C70 -80 40 -96 0 -96 C-40 -96 -70 -80 -78 -40 Z', '#6a4a3a', '#4a3020', 2);
      line(g, 'M-40 -40 q10 6 20 0 M20 -40 q10 6 20 0', '#4a3020', 2.6);
      line(g, 'M0 -26 Q8 -4 0 2', SKINK, 2.4);
      if (o.k === 'cannula') {
        line(g, 'M-28 30 Q0 44 28 30', '#a05a4a', 2.6);
        line(g, 'M-86 -14 C-60 24 -20 16 0 12 C20 16 60 24 86 -14 M-86 -14 C-104 30 -60 110 0 130 M86 -14 C104 30 60 110 0 130 L0 160', '#5fae3a', 3.2);
        line(g, 'M-7 12 L-7 4 M7 12 L7 4', '#2f6a24', 3);
      } else {
        line(g, 'M-40 8 L-82 -2 M40 8 L82 -2', '#5a6a7a', 2.6);
        part(g, 'M-34 -8 Q0 -30 34 -8 L44 44 Q0 70 -44 44 Z', '#cfeaf6', '#3a7aa0', 3);
        sheen(g, 'M-26 -2 L-32 36', 4);
        line(g, 'M0 58 C0 100 30 120 40 160', '#5fae3a', 6);
      }
      return g;
    },

    // "nebulizer cx cy size" — compressor, tube, medicine cup and mouthpiece, mist rising (loop rise)
    nebulizer: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      part(g, R(-150, 30, 120, 80, 12), '#e3e8ee', '#4a5a6a', 3);
      for (const x of [-130, -118, -106, -94]) line(g, `M${x} 50 L${x} 90`, '#9aa8b6', 2);
      part(g, R(-74, 52, 26, 16, 4), '#5fbf5a', '#2f6a24', 2);
      line(g, 'M-30 70 C30 70 50 70 50 34', '#7fb7ea', 5);
      part(g, 'M30 -40 L70 -40 L66 20 Q50 36 34 20 Z', '#f4f9fc', '#4a6a8a', 2.6);
      fill(g, 'M33 0 L67 0 L66 20 Q50 36 34 20 Z', '#9fd0f0');
      part(g, R(-30, -56, 150, 18, 7), '#f4f9fc', '#4a6a8a', 2.6);
      part(g, R(-50, -60, 24, 26, 8), '#dfe7ee', '#4a6a8a', 2.4);
      for (const [x, d] of [[126, 0], [142, 6], [158, -4]]) line(g, `M${x} ${-56 + d} q12 -16 0 -32 t0 -32 t0 -30`, '#9fc4e6', 3, { opacity: .85 });
      if (lbl(o)) { L(g, 74, 10, 'medicine', '#4a6a8a', 15, 'start'); L(g, -38, -72, 'mouthpiece', '#4a6a8a', 15); }
      return g;
    },

    // "hospbed cx cy length" — hospital bed, head raised, side rails, pillow, wheels
    hospbed: ([cx, cy, S = 380], o, t, parent) => {
      const g = G(cx, cy, S, 380, o, parent);
      line(g, 'M-176 -60 L-176 110 M-190 -60 L-162 -60 M184 -10 L184 110 M170 -10 L198 -10', '#5a6470', 7);
      line(g, 'M-176 70 L184 70', '#7a8490', 6);
      for (const x of [-140, 140]) { line(g, `M${x} 70 L${x} 100`, '#7a8490', 5); part(g, ell(x, 108, 10), '#3a4450', '#2a3440', 2); }
      const mat = 'M-150 -34 L-40 30 L170 30 Q178 30 178 40 L178 48 Q178 56 170 56 L-40 56 L-160 -12 Q-166 -24 -150 -34 Z';
      part(g, mat, '#cfe0f0', '#3a5a7a', 3);
      fill(g, 'M10 30 L170 30 Q178 30 178 40 L178 48 Q178 56 170 56 L10 56 Z', '#a8d8b0', { opacity: .9 });
      line(g, 'M10 30 L10 56', '#3a6a4a', 2);
      const pil = mk('g', { transform: 'rotate(30 -128 -36)' }, g); part(pil, R(-160, -52, 64, 26, 12), '#fdfdfb', '#7a8a9a', 2.4);
      line(g, 'M-20 12 L120 12 M-20 12 L-20 44 M120 12 L120 44 M27 12 L27 44 M74 12 L74 44 M-20 44 L120 44', '#4a5a6a', 3.4);
      line(g, 'M-60 4 L-140 -42 M-60 4 L-60 30 M-140 -42 L-140 -16 M-100 -19 L-100 7', '#4a5a6a', 3.4);
      return g;
    },

    // "wheelchair cx cy size" — side view: big wheel with hand rim, seat, backrest, armrest, footrest
    wheelchair: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      part(g, 'M-64 -24 L80 -24 L80 -8 L-64 -8 Z', '#4a7fc0', '#24456e', 2.6);
      part(g, 'M-64 -8 L-74 -110 L-60 -112 L-50 -24 Z', '#4a7fc0', '#24456e', 2.6);
      line(g, 'M-74 -110 L-104 -114 M-64 -8 L80 -8 L104 96 M80 -8 L118 76 L148 76 M-50 -56 L60 -56 M60 -56 L60 -24', '#4a5560', 5);
      fill(g, ell(-20, 40, 80), '#ffffff', { opacity: .4 });
      line(g, ell(-20, 40, 80), '#2f3640', 7); line(g, ell(-20, 40, 70), '#8a96a2', 2.6);
      for (let a = 0; a < 180; a += 30) { const [x, y] = P(76, a); line(g, `M${f1(-20 - x)} ${f1(40 - y)} L${f1(-20 + x)} ${f1(40 + y)}`, '#9aa8b6', 1.6); }
      part(g, ell(-20, 40, 8), '#5a6470', '#2f3640', 2);
      part(g, ell(104, 108, 12), '#3a4450', '#2a3440', 2.6);
      return g;
    },

    // "walker cx cy height k=walker|crutch" — walking frame with front wheels, or a pair of crutches
    walker: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      if (o.k === 'crutch') {
        for (const s of [-1, 1]) {
          const x = s * 50, c = mk('g', { transform: `translate(${x} 0) rotate(${s * 4})` }, g);
          line(c, 'M-16 -130 C-22 -40 -14 40 0 80 M16 -130 C22 -40 14 40 0 80 M0 80 L0 140', '#8a96a2', 5);
          part(c, R(-32, -146, 64, 18, 9), '#4a5560', '#2a3440', 2.4);
          part(c, R(-18, -34, 36, 12, 6), '#4a5560', '#2a3440', 2);
          part(c, R(-7, 136, 14, 14, 4), '#3a4450', '#2a3440', 2);
        }
        return g;
      }
      line(g, 'M-50 -84 L-50 124 M70 -84 L70 116 M-56 -84 L76 -84 M-50 30 L70 30', '#b0bac4', 5, { opacity: .7 });
      line(g, 'M-70 -70 L-70 140 M50 -70 L50 128 M-76 -70 L56 -70 M-70 44 L50 44', '#7a8490', 6);
      part(g, R(-74, -80, 34, 18, 8), '#3a4450', '#2a3440', 2); part(g, R(18, -80, 34, 18, 8), '#3a4450', '#2a3440', 2);
      part(g, ell(50, 132, 12), '#3a4450', '#2a3440', 2.4); part(g, ell(70, 124, 9), '#5a6470', '#2a3440', 2);
      part(g, R(-77, 136, 14, 10, 3), '#3a4450', '#2a3440', 2);
      return g;
    },

    // "insulinpen cx cy length rot=deg | 10" — insulin pen: needle, cartridge window, dose window, dial
    insulinpen: ([cx, cy, S = 340], o, t, parent) => {
      const g = G(cx, cy, S, 340, o, parent);
      line(g, 'M-196 0 L-160 0', '#8a9aaa', 2);
      part(g, R(-162, -9, 18, 18, 3), '#dfe7ee', '#5a6a7a', 2);
      part(g, R(-146, -20, 290, 40, 16), '#7fa8d8', '#24456e', 3);
      part(g, R(-126, -10, 80, 20, 6), '#eaf4fb', '#24456e', 2); fill(g, R(-110, -8, 62, 16, 4), '#c9e6f8');
      part(g, R(60, -12, 34, 24, 4), '#fdfdfb', '#24456e', 2);
      L(g, 77, 7, t || '10', '#1f2a3a', 18);
      part(g, R(140, -22, 34, 44, 8), '#3d5f8e', '#1f3456', 2.6);
      for (const x of [148, 156, 164]) line(g, `M${x} -18 L${x} 18`, '#7fa0c8', 1.6);
      line(g, 'M-30 -20 L-30 -30 L40 -30 L40 -20', '#24456e', 3);
      sheen(g, 'M-130 -12 L130 -12', 4);
      return g;
    },

    // "glucometer cx cy size | 112" — glucose meter: reading in mg/dL, strip with a drop
    glucometer: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      part(g, R(-13, -168, 26, 78, 4), '#f6f0d8', '#8a7a4a', 2.4);
      line(g, 'M-6 -110 L-6 -96 M0 -110 L0 -96 M6 -110 L6 -96', '#b0902a', 2);
      part(g, 'M0 -194 C-7 -184 -9 -178 -9 -174 A9 9 0 0 0 9 -174 C9 -178 7 -184 0 -194 Z', '#d9483c', '#7a1f1f', 2);
      part(g, R(-70, -100, 140, 220, 30), '#dfe6ee', '#3a4a5a', 3.2);
      part(g, R(-52, -78, 104, 76, 8), '#d6ecd2', '#3a5a4a', 2.4);
      L(g, 0, -32, t || '112', '#1f3a2a', 36); L(g, 0, -10, 'mg/dL', '#3a5a4a', 14);
      for (const x of [-26, 26]) part(g, ell(x, 34, 14), '#9aa8b6', '#4a5a6a', 2);
      sheen(g, 'M-56 -92 L40 -92', 4);
      return g;
    },

    // "vial cx cy size k=vial|dose | Vaccine" — medicine vial, or a syringe drawing a dose from it
    vial: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      const v = o.k === 'dose' ? mk('g', { transform: 'translate(0 -75) rotate(180) scale(.65)' }, g) : g;
      part(v, R(-24, -62, 48, 24), '#e6edf3', '#5a6a7a', 2.4);
      part(v, R(-30, -84, 60, 24, 3), '#c4ccd4', '#5a6a7a', 2.4);
      part(v, R(-32, -100, 64, 18, 5), '#e8834a', '#8a3a14', 2.4);
      const body = 'M-24 -40 L24 -40 Q40 -40 40 -24 L40 92 Q40 104 28 104 L-28 104 Q-40 104 -40 92 L-40 -24 Q-40 -40 -24 -40 Z';
      fill(v, body, '#f4f9fc', { opacity: .9 }); fill(v, 'M-40 10 L40 10 L40 92 Q40 104 28 104 L-28 104 Q-40 104 -40 92 Z', '#bfe0f4');
      fill(v, R(-40, 22, 80, 54), '#ffffff'); line(v, body, '#4a6a8a', 3);
      line(v, 'M-40 22 L40 22 M-40 76 L40 76', '#7a8a9a', 1.6);
      if (o.k !== 'dose') { L(v, 0, 46, t || 'Vaccine', '#2b4a6a', fit(t || 'Vaccine', 72, 17)); L(v, 0, 68, '0.5 mL', '#555', 13); sheen(v, 'M-30 -26 L-30 4', 5); return g; }
      line(g, 'M0 -26 L0 25', '#8a9aaa', 2);
      part(g, R(-8, 22, 16, 10, 2), '#dfe7ee', '#5a6a7a', 2);
      fill(g, R(-16, 32, 32, 84), '#f4f8fb'); fill(g, R(-14, 34, 28, 34), '#bfe0f4');
      line(g, R(-16, 32, 32, 84), '#5a6a7a', 2.6);
      for (let y = 44; y <= 104; y += 12) line(g, `M-16 ${y} L-7 ${y}`, '#5a6a7a', 1.6);
      part(g, R(-14, 68, 28, 6), '#5a6a7a', '#3a4a5a', 1.6);
      line(g, 'M0 74 L0 136', '#5a6a7a', 5);
      part(g, R(-26, 114, 52, 8, 2), '#dfe7ee', '#5a6a7a', 2); part(g, R(-18, 136, 36, 8, 3), '#dfe7ee', '#5a6a7a', 2);
      if (t || lbl(o)) L(g, 30, 60, t || '0.5 mL', '#2b6cc4', 17, 'start');
      return g;
    },

    // "medcup cx cy size k=liquid|pills" — small dosing cup with mL marks, holding liquid or pills
    medcup: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S, 180, o, parent);
      const cup = 'M-62 -70 L62 -70 L46 80 Q0 90 -46 80 Z';
      fill(g, cup, '#f8fbfd', { opacity: .9 });
      if (o.k === 'pills') {
        part(g, ell(-18, 64, 16, 10), '#ffffff', '#7a8a9a', 2.2); part(g, ell(18, 62, 15, 9), '#f6c64a', '#8a6414', 2.2);
        part(g, 'M-6 42 L-30 42 C-46 42 -46 58 -30 58 L-6 58 Z', '#e04b3a', '#7a1f1f', 2); part(g, 'M-6 42 L18 42 C34 42 34 58 18 58 L-6 58 Z', '#ffffff', '#7a8a9a', 2);
      } else {
        const id = 'mcc' + clipN++; mk('clipPath', { id }, g).append(mk('path', { d: cup }));
        fill(g, R(-70, 0, 140, 100), '#f2b04a', { 'clip-path': `url(#${id})`, opacity: .85 });
        line(g, 'M-55 0 L55 0', '#c97a10', 2);
      }
      line(g, cup, '#5a6a7a', 3); line(g, 'M-62 -70 Q0 -60 62 -70', '#5a6a7a', 2);
      for (const [y, n] of [[-46, '30'], [0, '15'], [46, '5']]) { const x = 62 - (y + 70) * 16 / 150; line(g, `M${f1(x - 18)} ${y} L${f1(x - 4)} ${y}`, '#5a6a7a', 2); L(g, f1(x + 6), y + 6, n + ' mL', '#555', 16, 'start'); }
      sheen(g, 'M-50 -56 L-40 50', 5);
      return g;
    },

    // "pillbox cx cy length" — weekly pill organiser, seven days, AM and PM rows with pills
    pillbox: ([cx, cy, S = 380], o, t, parent) => {
      const g = G(cx, cy, S, 380, o, parent), days = 'SMTWTFS', cols = ['#f28b80', '#f8c56a', '#f6e27a', '#9bd27a', '#8fd0e0', '#9cc6ee', '#c8a8e8'];
      for (let i = 0; i < 7; i++) {
        const x = -150 + i * 44;
        part(g, R(x, -84, 40, 24, 5), cols[i], '#5a5a6a', 2.2); L(g, x + 20, -65, days[i], '#333', 18);
        for (const [r, y] of [[0, -54], [1, 4]]) {
          part(g, R(x, y, 40, 52, 6), '#fdfdfb', '#5a5a6a', 2.4);
          fill(g, R(x + 2, y + 2, 36, 48, 5), cols[i], { opacity: .35 });
          const k = (i + r) % 3; part(g, ell(x + 13, y + 34, 7), '#ffffff', '#7a8a9a', 1.6);
          if (k) part(g, ell(x + 27, y + 34, 6), '#f6c64a', '#8a6414', 1.6);
          if (k === 2) part(g, R(x + 10, y + 14, 20, 10, 5), '#e04b3a', '#7a1f1f', 1.6);
        }
      }
      if (lbl(o)) { L(g, -160, -22, 'AM', '#555', 16, 'end'); L(g, -160, 36, 'PM', '#555', 16, 'end'); }
      return g;
    },

    // "rxlabel cx cy size | Drug 500 mg; Take 1 ...; Qty 30" — medicine bottle with a label, lines split by ;
    rxlabel: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent);
      part(g, R(-120, -110, 240, 44, 8), '#fdfdfb', '#5a6a7a', 3);
      for (let x = -104; x <= 104; x += 13) line(g, `M${x} -104 L${x} -72`, '#c8d0d8', 1.6);
      part(g, R(-112, -66, 224, 206, 18), '#d98a2a', '#7a4a10', 3.2);
      part(g, R(-104, -46, 208, 168, 6), '#fdfdfb', '#7a6a5a', 2.2);
      L(g, -94, -22, 'Rx', '#c0392b', 22, 'start');
      const rows = split(t, 'Amoxicillin 500 mg; Take 1 capsule 3 times a day; Qty: 30   Refills: 0');
      rows.slice(0, 5).forEach((s, i) => L(g, i ? -94 : -62, -22 + (i ? 10 + i * 28 : 0), s, i ? '#333' : '#1f3a6a', fit(s, i ? 192 : 160, i ? 17 : 20), 'start'));
      sheen(g, 'M-104 -56 L104 -56', 4);
      return g;
    },

    // "dressing cx cy size lbl=0" — wound dressing layers lifted apart: cover film, pad, contact layer, skin
    dressing: ([cx, cy, S = 340], o, t, parent) => {
      const g = G(cx, cy, S, 340, o, parent);
      part(g, 'M-170 70 L-70 70 Q-50 70 -46 80 Q-30 94 -14 80 Q-10 70 10 70 L60 70 L60 130 L-170 130 Z', '#f0c4a8', '#8a5a3a', 3);
      fill(g, 'M-46 80 Q-30 94 -14 80 Z', '#f29a9a');
      line(g, 'M-170 84 L-60 84 M4 84 L60 84', '#d8a088', 1.6);
      part(g, R(-150, 36, 190, 10, 3), '#eef2f5', '#7a8a9a', 2);
      for (let x = -140; x < 40; x += 12) line(g, `M${x} 41 L${x + 6} 41`, '#9aa8b6', 1.4);
      part(g, R(-130, -16, 150, 32, 12), '#fdfdfb', '#7a8a9a', 2.6);
      for (const [x, y] of [[-110, -2], [-80, 6], [-50, -4], [-20, 4], [6, -2]]) fill(g, ell(x, y, 3), '#c8d0d8');
      part(g, R(-170, -52, 230, 12, 5), '#bfe0f4', '#3a7aa0', 2.4);
      for (const x of [-60, 0]) arrow(g, x - 50, -78, x - 50, -58, '#888', 2);
      if (lbl(o)) for (const [y, s] of [[-42, 'cover film'], [4, 'absorbent pad'], [46, 'contact layer'], [102, 'wound bed']]) L(g, 76, y, s, '#3a4a5a', 17, 'start');
      return g;
    },

    // "ulcer cx cy size k=1|2|3|4 lbl=0" — pressure injury stage 1-4 on a skin cross-section (non-graphic)
    ulcer: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent), k = +o.k || 1;
      const lay = [[-60, 12, '#f3cdb4', 'skin'], [-48, 38, '#f0b8a2', ''], [-10, 40, '#f7e3a0', 'fat'], [30, 40, '#d9907e', 'muscle'], [70, 30, '#efe8d8', 'bone']];
      for (const [y, h, c] of lay) fill(g, R(-150, y, 300, h), c);
      for (const [y] of lay.slice(1)) line(g, `M-150 ${y} C-80 ${y + 4} 80 ${y - 4} 150 ${y}`, '#b07a6a', 1.4, { opacity: .7 });
      const crater = { 2: 'M-50 -60 Q0 -24 50 -60 Z', 3: 'M-62 -60 Q-56 12 0 14 Q56 12 62 -60 Z', 4: 'M-72 -60 Q-66 76 0 78 Q66 76 72 -60 Z' }[k];
      if (k === 1) { fill(g, ell(0, -58, 56, 9), '#e0645a', { opacity: .55 }); line(g, 'M-56 -60 Q0 -66 56 -60', '#b0453a', 2.4); }
      else { fill(g, crater, { 2: '#f6a8a8', 3: '#f3c58a', 4: '#eaa494' }[k]); if (k === 4) fill(g, ell(0, 72, 26, 6), '#f7f2e6'); line(g, crater.slice(0, -2), '#9a4a3a', 2.4); }
      line(g, R(-150, -60, 300, 160), '#7a5a4a', 3);
      if (lbl(o)) L(g, 0, -78, 'Stage ' + k, '#7a2f2a', 22);
      if (lbl(o)) for (const [y, h, , s] of lay) if (s) L(g, -158, y + h / 2 + 6, s, '#5a4a3a', 18, 'end');
      return g;
    },

    // "handwash cx cy size k=1|2|3|4|5|6|strip" — handwashing step (palms, backs, between, fingers, thumbs, tips) or all six
    handwash: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S, 200, o, parent);
      const step = (h, k) => {
        const B = '#e8c8a8', s = .7;
        if (k === 1) { hand(h, -16, 10, s, -12, -1); hand(h, 16, 10, s, 12, 1, B); curvedArrow(h, 0, -6, 70); }
        if (k === 2) { hand(h, 0, 20, s, 0, 1); hand(h, 10, -4, s, 80, 1, B); arrow(h, -60, -88, 60, -88, '#2b6cc4', 3); arrow(h, 60, -88, -60, -88, '#2b6cc4', 3); }
        if (k === 3) { hand(h, -20, 18, s, -30, -1); hand(h, 20, 18, s, 30, 1, B); arrow(h, 0, -100, 0, -70, '#2b6cc4', 3); arrow(h, 0, -70, 0, -100, '#2b6cc4', 3); }
        if (k === 4) { hand(h, -26, 0, s, -90, -1); hand(h, 26, 0, s, 90, 1, B); arrow(h, -40, -70, 40, -70, '#2b6cc4', 3); arrow(h, 40, -70, -40, -70, '#2b6cc4', 3); }
        if (k === 5) { hand(h, 0, 20, s, 0, 1); line(h, ell(-36, -6, 22), '#e0a100', 3.4); curvedArrow(h, -36, -6, 34); }
        if (k === 6) { hand(h, -10, 20, s, -20, 1); hand(h, 30, -40, s * .8, 160, -1, B); curvedArrow(h, 10, -34, 40); }
        bubbles(h, [[-80, -60, 9], [-90, -30, 6], [80, 40, 8], [92, 10, 5], [70, 70, 6]]);
        if (lbl(o)) L(h, 0, 116, ['', '1 palm to palm', '2 backs of hands', '3 between fingers', '4 backs of fingers', '5 thumbs', '6 fingertips'][k], '#2b4a6a', 20);
      };
      if (o.k === 'strip') { for (let i = 0; i < 6; i++) step(mk('g', { transform: `translate(${-210 + (i % 3) * 210} ${-100 + Math.floor(i / 3) * 210}) scale(.72)` }, g), i + 1); }
      else step(g, Math.min(6, Math.max(1, +o.k || 1)));
      return g;
    },

    // "ppe cx cy size k=gloves|mask|gown" — protective gear: pair of gloves, surgical mask, or gown
    ppe: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S, 260, o, parent);
      if (o.k === 'mask') {
        const m = 'M-100 -50 Q0 -64 100 -50 L100 46 Q0 70 -100 46 Z';
        line(g, 'M-100 -36 C-150 -50 -150 30 -100 30 M100 -36 C150 -50 150 30 100 30', '#7a8a9a', 3);
        part(g, m, '#9fd2ee', '#2f6a96', 3);
        for (const y of [-20, 6, 32]) line(g, `M-96 ${y} Q0 ${y + 10} 96 ${y}`, '#5a9ac8', 2);
        line(g, 'M-30 -54 L30 -54', '#7a8a9a', 4);
      } else if (o.k === 'gown') {
        const d = 'M-40 -130 Q0 -110 40 -130 L80 -110 L130 20 L104 30 L70 -50 L76 130 L-76 130 L-70 -50 L-104 30 L-130 20 L-80 -110 Z';
        part(g, d, '#f6e27a', '#8a7414', 3);
        line(g, 'M-40 -130 Q0 -100 40 -130', '#8a7414', 2.6);
        line(g, 'M-72 0 L-110 10 M72 0 L110 10', '#8a7414', 2.4);
        part(g, R(-128, 14, 28, 18, 4), '#7fb7ea', '#2b5a8a', 2); part(g, R(100, 14, 28, 18, 4), '#7fb7ea', '#2b5a8a', 2);
      } else {
        for (const s of [-1, 1]) { const h = hand(g, s * 60, -10, .95, s * 8, s, '#8fc1ec', '#2b5a8a'); part(h, R(-30, 66, 64, 50, 6), '#8fc1ec', '#2b5a8a', 3); }
      }
      return g;
    },

    // "droplets cx cy size" — faceless figure coughing a spray of droplets, 6 ft distance (loop flow)
    droplets: ([cx, cy, S = 340], o, t, parent) => {
      const g = G(cx, cy, S, 340, o, parent);
      part(g, 'M-180 130 C-180 40 -170 0 -120 -10 C-90 -14 -80 10 -76 60 L-70 130 Z', '#9cc6ee', '#2b5a8a', 3);
      part(g, ell(-118, -54, 32), '#e8c09a', '#7a5a3a', 3);
      line(g, 'M-90 -44 Q-80 -42 -78 -38', '#7a5a3a', 2.4);
      const R0 = (n) => { let x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
      for (let i = 0; i < 34; i++) {
        const u = R0(i + 1), v = R0(i + 50), d = 30 + u * 200, a = (v - .5) * 0.7, x = -76 + d * Math.cos(a), y = -40 + d * Math.sin(a) + (d > 120 ? (d - 120) * .35 : 0), r = 2.5 + (1 - u) * 5;
        fill(g, ell(f1(x), f1(y), f1(r)), '#7fb7ea', { opacity: .85 }); if (i % 6 === 0) line(g, ell(f1(x), f1(y), f1(r)), '#2b6cc4', 1.4);
      }
      line(g, 'M-70 -42 Q30 -80 130 -60 M-70 -38 Q30 0 130 50', '#9fc4e6', 2, { 'stroke-dasharray': '6 8' });
      arrow(g, -60, 112, 150, 112, '#555', 2.4); arrow(g, 150, 112, -60, 112, '#555', 2.4);
      if (lbl(o)) L(g, 45, 136, '6 ft (2 m)', '#333', 18);
      return g;
    },

    // "infchain cx cy size cut=1-6 | Infection" — chain of infection, six links; cut= breaks one link
    infchain: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent), cut = +o.cut || 0;
      const names = [['infectious', 'agent'], ['reservoir'], ['portal', 'of exit'], ['mode of', 'transmission'], ['portal', 'of entry'], ['susceptible', 'host']];
      const cols = ['#e04b3a', '#f4a531', '#f3c33b', '#5fae3a', '#2b9ad0', '#8a5ab0'];
      for (let i = 0; i < 6; i++) {
        const a = -90 + i * 60, [x, y] = P(100, a), c = mk('g', { transform: `translate(${f1(x)} ${f1(y)}) rotate(${a + 90})` }, g);
        fill(c, ell(0, 0, 44, 24), cols[i], { opacity: .35 });
        line(c, ell(0, 0, 44, 24), cols[i], 9); line(c, ell(0, 0, 44, 24), '#333', 1.6, { opacity: .5 });
        if (cut === i + 1) { line(c, 'M-12 -34 L12 34', '#fdfdfb', 14); line(c, 'M-24 -24 L24 24 M24 -24 L-24 24', '#c0392b', 5); }
        const [lx, ly] = P(158, a), an = Math.abs(lx) < 20 ? 'middle' : lx > 0 ? 'start' : 'end', ys = ly < -20 ? -18 : ly > 20 ? 14 : -4;
        if (lbl(o)) names[i].forEach((s, j) => L(g, f1(lx + (an === 'middle' ? 0 : lx > 0 ? -18 : 18)), f1(ly + ys + j * 20), s, '#333', 18, an));
      }
      if (t || lbl(o)) L(g, 0, 8, t || 'Infection', '#7a2f2a', fit(t || 'Infection', 110, 24));
      return g;
    },

    // "fluidbal cx cy size in=2000 out=1800" — balance of fluid intake vs output in mL; beam tilts
    fluidbal: ([cx, cy, S = 340], o, t, parent) => {
      const g = G(cx, cy, S, 340, o, parent), vin = +(o.in ?? 2000), vout = +(o.out ?? 1800);
      const th = Math.max(-14, Math.min(14, (vout - vin) / 40)), dy = 130 * Math.sin(rad(th));
      part(g, 'M-50 130 L50 130 L20 116 L-20 116 Z', '#9aa8b6', '#4a5a6a', 2.4);
      line(g, 'M0 116 L0 -60', '#5a6470', 6);
      line(g, `M${f1(-130 * Math.cos(rad(th)))} ${f1(-60 - dy)} L${f1(130 * Math.cos(rad(th)))} ${f1(-60 + dy)}`, '#5a6470', 7);
      part(g, ell(0, -60, 8), '#c97a10', '#7a4a10', 2);
      for (const s of [-1, 1]) {
        const x = s * 130 * Math.cos(rad(th)), y = -60 + s * dy;
        line(g, `M${f1(x)} ${f1(y)} L${f1(x - 44)} ${f1(y + 60)} M${f1(x)} ${f1(y)} L${f1(x + 44)} ${f1(y + 60)}`, '#7a8490', 2);
        part(g, `M${f1(x - 54)} ${f1(y + 60)} L${f1(x + 54)} ${f1(y + 60)} Q${f1(x)} ${f1(y + 90)} ${f1(x - 54)} ${f1(y + 60)} Z`, '#dfe7ee', '#4a5a6a', 2.6);
        const bx = x, by = y + 60;
        if (s < 0) { part(g, `M${f1(bx - 34)} ${f1(by - 50)} L${f1(bx - 10)} ${f1(by - 50)} L${f1(bx - 13)} ${f1(by)} L${f1(bx - 31)} ${f1(by)} Z`, '#bfe0f4', '#3a7aa0', 2);
          part(g, `M${f1(bx + 22)} ${f1(by - 42)} C${f1(bx + 12)} ${f1(by - 26)} ${f1(bx + 8)} ${f1(by - 18)} ${f1(bx + 8)} ${f1(by - 12)} A14 14 0 0 0 ${f1(bx + 36)} ${f1(by - 12)} C${f1(bx + 36)} ${f1(by - 18)} ${f1(bx + 32)} ${f1(by - 26)} ${f1(bx + 22)} ${f1(by - 42)} Z`, '#7fb7ea', '#2b6cc4', 2); }
        else { part(g, R(f1(bx - 26), f1(by - 52), 52, 52, 6), '#fdfdfb', '#7a6a3a', 2); fill(g, R(f1(bx - 24), f1(by - 30), 48, 28, 4), '#f6dc6a');
          for (const k of [-40, -28, -16]) line(g, `M${f1(bx + 14)} ${f1(by + k)} L${f1(bx + 24)} ${f1(by + k)}`, '#7a6a3a', 1.4); }
        if (lbl(o)) L(g, f1(x), f1(y + 112), s < 0 ? 'Intake' : 'Output', s < 0 ? '#2b6cc4' : '#8a6414', 20);
        L(g, f1(x), f1(y + 134), (s < 0 ? vin : vout) + ' mL', '#333', 18);
      }
      return g;
    },

    // "dehydration cx cy size" — low water drop with six warning signs around it
    dehydration: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent);
      const drop = 'M0 -100 C-30 -50 -64 -10 -64 30 A64 64 0 0 0 64 30 C64 -10 30 -50 0 -100 Z';
      fill(g, drop, '#eef6fb'); const id = 'dhc' + clipN++; mk('clipPath', { id }, g).append(mk('path', { d: drop }));
      fill(g, R(-70, 50, 140, 50), '#7fb7ea', { 'clip-path': `url(#${id})` });
      line(g, drop, '#2b6cc4', 3.4); line(g, 'M-58 50 Q0 44 58 50', '#2b6cc4', 2);
      arrow(g, 0, -40, 0, 20, '#c0392b', 3);
      const signs = [['thirst', -1, -70], ['dry mouth', -1, 0], ['headache', -1, 70], ['dark urine', 1, -70], ['dizziness', 1, 0], ['tiredness', 1, 70]];
      for (const [s, side, y] of signs) { line(g, `M${side * 72} ${y * .6 + 10} L${side * 96} ${y}`, '#c97a10', 2); part(g, ell(side * 104, y - 6, 6), '#f4a531', '#c97a10', 1.6); if (lbl(o)) L(g, side * 116, y, s, '#7a4a10', 20, side < 0 ? 'end' : 'start'); }
      return g;
    },

    // "urinechart cx cy height" — urine colour chart, pale (hydrated) to dark amber (dehydrated)
    urinechart: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent), cs = ['#fbf8e0', '#f8f0b4', '#f5e47e', '#f1d555', '#e9be35', '#dca322', '#c98a1c', '#a86c1a'];
      cs.forEach((c, i) => part(g, R(-60, -150 + i * 37, 70, 33, 6), c, '#7a6a3a', 2.2));
      for (const [y0, y1, c, s] of [[-148, -40, '#2c6a22', 'hydrated'], [-34, 34, '#c97a10', 'drink more'], [40, 146, '#c0392b', 'drink water now']]) {
        line(g, `M20 ${y0} L28 ${y0} L28 ${y1} L20 ${y1}`, c, 2.6); if (lbl(o)) L(g, 38, (y0 + y1) / 2 + 6, s, c, 20, 'start');
      }
      return g;
    },

    // "myplate cx cy size" — healthy plate: vegetables, fruits, grains, protein, plus a dairy cup
    myplate: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent), x0 = -30;
      part(g, ell(x0, 10, 132), '#fdfdfb', '#7a8a9a', 3);
      const secs = [[100, 200, '#9bd27a', 'vegetables'], [200, 270, '#f28b80', 'fruits'], [270, 370, '#f8c56a', 'grains'], [10, 100, '#b9a0dc', 'protein']];
      const pg = mk('g', { transform: `translate(${x0} 10)` }, g);
      for (const [a0, a1, c, s] of secs) { part(pg, sector(0, 112, a0, a1), c, '#5a5a5a', 2.4); const [x, y] = P(62, (a0 + a1) / 2); if (lbl(o)) L(pg, f1(x), f1(y + 6), s, '#2a2a2a', 19); }
      part(g, 'M100 -120 L150 -120 L144 -54 Q125 -46 106 -54 Z', '#9cc6ee', '#2b5a8a', 2.6);
      if (lbl(o)) L(g, 125, -26, 'dairy', '#2a2a2a', 19);
      return g;
    },

    // "nutrilabel cx cy size | Calories 230; Total Fat 8g; ..." — food label, rows split by ;
    nutrilabel: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent);
      const rows = split(t, 'Serving 1 cup (228g); Calories 230; Total Fat 8g; Sodium 160mg; Total Carbs 37g; Sugars 12g; Protein 3g').slice(0, 9), h = Math.min(32, 236 / rows.length);
      part(g, R(-110, -150, 220, f1(rows.length * h + 90), 4), '#fdfdfb', '#222', 3);
      L(g, -98, -116, 'Nutrition Facts', '#111', 30, 'start');
      line(g, 'M-100 -104 L100 -104', '#222', 7);
      rows.forEach((s, i) => {
        const y = -82 + i * h, m = s.match(/^(.*?)\s+(\S*\d\S*)$/), big = /^calories/i.test(s), sz = big ? 22 : 17;
        L(g, -100, y + 6, m ? m[1] : s, '#111', sz, 'start'); if (m) L(g, 100, y + 6, m[2], '#111', sz, 'end');
        line(g, `M-100 ${f1(y + h / 2 + 2)} L100 ${f1(y + h / 2 + 2)}`, '#222', big || i === 0 ? 4 : 1.4);
      });
      return g;
    },

    // "bmi cx cy length v=22" — BMI bar: under, healthy, over, obese bands, pointer at the value
    bmi: ([cx, cy, S = 420], o, t, parent) => {
      const g = G(cx, cy, S, 420, o, parent), X = b => -200 + (Math.max(15, Math.min(40, b)) - 15) * 16, v = +(o.v ?? 22);
      for (const [a, b, c, s] of [[15, 18.5, '#7fb7ea', 'under'], [18.5, 25, '#7cc46a', 'healthy'], [25, 30, '#f3d34a', 'over'], [30, 40, '#ef7a5a', 'obese']]) {
        part(g, R(X(a), -20, X(b) - X(a), 40), c, '#4a4a4a', 2.4); if (lbl(o)) L(g, (X(a) + X(b)) / 2, 8, s, '#222', 19);
      }
      for (const b of [18.5, 25, 30]) L(g, X(b), 46, String(b), '#555', 17);
      part(g, `M${X(v)} -26 L${X(v) - 12} -48 L${X(v) + 12} -48 Z`, '#333', '#111', 2);
      L(g, X(v), -58, 'BMI ' + v, '#111', 22);
      if (t || lbl(o)) L(g, 0, 82, t || 'BMI = weight (kg) ÷ height (m)²', '#555', 17);
      return g;
    },

    // "exercise cx cy size k=run|stretch|lift" — faceless figure running, stretching, or lifting dumbbells
    exercise: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      line(g, 'M-120 142 L120 142', '#9aa8b6', 3);
      if (o.k === 'stretch') figure(g, { head: [-32, -90], body: [[-20, -62], [0, 30]], armB: [[-14, -56], [14, -112], [-40, -140]], armF: [[-16, -54], [-10, -10], [-16, 30]],
        legB: [[0, 30], [-24, 86], [-46, 138]], legF: [[0, 30], [24, 86], [46, 138]] });
      else if (o.k === 'lift') { figure(g, { head: [0, -96], body: [[0, -64], [0, 30]], armB: [[-2, -56], [-50, -70], [-54, -134]], armF: [[2, -56], [50, -70], [54, -134]],
          legB: [[-2, 30], [-30, 86], [-36, 138]], legF: [[2, 30], [30, 86], [36, 138]] });
        for (const s of [-1, 1]) { line(g, `M${s * 54 - 22} -138 L${s * 54 + 22} -138`, '#4a4a4a', 5); part(g, R(s * 54 - 30, -152, 12, 28, 3), '#5a5a6a', '#2a2a3a', 2); part(g, R(s * 54 + 18, -152, 12, 28, 3), '#5a5a6a', '#2a2a3a', 2); } }
      else { figure(g, { head: [16, -96], body: [[8, -66], [-6, 24]], armB: [[6, -56], [-30, -34], [-50, -8]], armF: [[6, -56], [36, -36], [52, -64]],
          legB: [[-6, 24], [-40, 70], [-84, 82]], legF: [[-6, 24], [34, 64], [16, 120]] });
        line(g, 'M-110 -40 L-70 -40 M-120 -10 L-80 -10 M-104 20 L-64 20', '#9aa8b6', 3); }
      return g;
    },

    // "hrzones cx cy length v=70" — heart-rate zones as % of max, five rising bars, pointer
    hrzones: ([cx, cy, S = 420], o, t, parent) => {
      const g = G(cx, cy, S, 420, o, parent), z = [['very light', '#c8d0d8'], ['light', '#7fb7ea'], ['moderate', '#7cc46a'], ['hard', '#f4a531'], ['max', '#e04b3a']];
      z.forEach(([s, c], i) => { const x = -200 + i * 80, h = 40 + i * 22; part(g, R(x, 60 - h, 76, h, 4), c, '#4a4a4a', 2.4); if (lbl(o)) L(g, x + 38, 50 - h, s, '#333', 17); L(g, x + 38, 50, 'Z' + (i + 1), '#222', 18); });
      for (let i = 0; i <= 5; i++) L(g, -202 + i * 80, 84, (50 + i * 10) + '%', '#555', 16);
      if (o.v) { const x = -200 + (Math.max(50, Math.min(100, +o.v)) - 50) * 8; part(g, `M${x} 66 L${x - 10} 96 L${x + 10} 96 Z`, '#c0392b', '#7a1f1f', 1.6); }
      if (t || lbl(o)) L(g, -200, -116, t || '% of max heart rate', '#c0392b', 19, 'start');
      return g;
    },

    // "sleepcycle cx cy length" — hypnogram: awake, REM, light and deep sleep over 8 hours (loop flow)
    sleepcycle: ([cx, cy, S = 440], o, t, parent) => {
      const g = G(cx, cy, S, 440, o, parent), lv = { W: -90, R: -50, 1: -10, 2: 30, 3: 70 }, X = h => -150 + h * 45;
      line(g, 'M-160 -110 L-160 90 L220 90', '#555', 2.6);
      for (const [k, s] of [['W', 'awake'], ['R', 'REM'], ['1', 'light'], ['2', 'N2'], ['3', 'deep']]) if (lbl(o)) L(g, -168, lv[k] + 6, s, '#444', 17, 'end');
      for (let h = 0; h <= 8; h += 2) L(g, X(h), 112, h + 'h', '#555', 16);
      const seq = [[0, 'W'], [.2, '1'], [.4, '2'], [.8, '3'], [1.4, '2'], [1.6, 'R'], [1.8, '2'], [2.2, '3'], [2.8, '2'], [3.2, 'R'], [3.6, '2'], [4.2, '3'], [4.5, '2'], [4.9, 'R'], [5.5, '2'], [6, '1'], [6.3, 'R'], [7.1, '1'], [7.4, 'R'], [7.9, 'W'], [8, 'W']];
      let d = `M${X(0)} ${lv.W}`; for (let i = 1; i < seq.length; i++) d += ` L${f1(X(seq[i][0]))} ${lv[seq[i - 1][1]]} L${f1(X(seq[i][0]))} ${lv[seq[i][1]]}`;
      for (let i = 0; i < seq.length - 1; i++) if (seq[i][1] === 'R') fill(g, R(f1(X(seq[i][0])), -58, f1(X(seq[i + 1][0]) - X(seq[i][0])), 16), '#f28b80');
      line(g, d, '#3a5aa8', 3.4);
      if (t) L(g, 30, -122, t, '#3a5aa8', 20);
      return g;
    },


    // "posture cx cy height k=good|bad" — side view, spine shown: upright with plumb line, or slouched
    posture: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent), bad = o.k === 'bad';
      const j = bad ? { head: [44, -110], body: [[20, -80], [-26, -36], [6, 44]], armF: [[6, -68], [28, -16], [40, 30]], legB: [[6, 44], [8, 100], [0, 150]], legF: [[6, 44], [18, 100], [10, 150]] }
                    : { head: [4, -122], body: [[0, -90], [-6, -20], [2, 44]], armF: [[0, -76], [4, -20], [8, 30]], legB: [[2, 44], [0, 100], [-4, 150]], legF: [[2, 44], [6, 100], [4, 150]] };
      figure(g, j, '#cfe0f0', '#e8c09a', '#8a9ab0');
      line(g, bad ? 'M14 152 L44 152' : 'M0 152 L32 152', '#7a5a3a', 6);
      const sp = bad ? [[24, -94], [-26, -40], [8, 40]] : [[2, -100], [-10, -26], [4, 40]];
      for (let i = 0; i <= 9; i++) { const u = i / 9, x = (1 - u) ** 2 * sp[0][0] + 2 * u * (1 - u) * sp[1][0] + u * u * sp[2][0], y = (1 - u) ** 2 * sp[0][1] + 2 * u * (1 - u) * sp[1][1] + u * u * sp[2][1];
        part(g, ell(f1(x), f1(y), 6, 4.5), '#fdfdfb', '#7a6a5a', 1.6); }
      line(g, 'M4 -160 L4 160', bad ? '#c0392b' : '#2c6a22', 2, { 'stroke-dasharray': '6 7' });
      if (bad) line(g, 'M90 -110 L120 -80 M120 -110 L90 -80', '#c0392b', 5); else line(g, 'M84 -96 L98 -82 L124 -116', '#2c6a22', 5);
      if (t || lbl(o)) L(g, 104, -58, t || (bad ? 'slouched' : 'upright'), bad ? '#c0392b' : '#2c6a22', 20);
      return g;
    },

    // "firstaid cx cy size" — green first-aid box with white plus, handle and latches
    firstaid: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      line(g, 'M-40 -70 L-40 -96 Q-40 -104 -32 -104 L32 -104 Q40 -104 40 -96 L40 -70', '#2a5a34', 8);
      part(g, R(-130, -70, 260, 160, 18), '#3f9a54', '#1f5a2c', 3.4);
      line(g, 'M-130 -36 L130 -36', '#1f5a2c', 2.6);
      for (const x of [-90, 74]) part(g, R(x, -44, 16, 16, 3), '#c8d0d8', '#4a5a6a', 2);
      part(g, 'M-14 -16 L14 -16 L14 14 L44 14 L44 42 L14 42 L14 72 L-14 72 L-14 42 L-44 42 L-44 14 L-14 14 Z', '#ffffff', '#1f5a2c', 2.4);
      sheen(g, 'M-116 -58 L60 -58', 5);
      return g;
    },

    // "cpr cx cy size" — chest outline, stacked hands on lower breastbone, push rate and depth (loop beat)
    cpr: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent);
      const d = 'M-30 -150 C-30 -134 -34 -128 -46 -124 C-90 -116 -130 -108 -140 -78 C-148 -40 -144 40 -136 140 L136 140 C144 40 148 -40 140 -78 C130 -108 90 -116 46 -124 C34 -128 30 -134 30 -150';
      fill(g, d + ' Z', '#f3e2cf'); line(g, d, '#6b4a30', 3.4);
      line(g, 'M0 -110 L0 30', '#c8a888', 3, { 'stroke-dasharray': '6 6' });
      fill(g, ell(0, 4, 26), '#e0645a', { opacity: .35 });
      hand(g, 20, 10, .75, -90, 1, '#e8c09a', SKINK); hand(g, 14, -4, .75, -90, -1, '#f3d2b0', SKINK);
      for (const x of [-100, 100]) arrow(g, x, -40, x, 10, '#c0392b', 3.4);
      if (t || lbl(o)) L(g, 0, 90, t || '100–120 a minute', '#c0392b', 20); if (lbl(o)) L(g, 0, 118, '2 in (5 cm) deep', '#555', 18);
      return g;
    },

    // "recovery cx cy length" — seen from above: figure on its side, top knee bent, hand under cheek, near arm out
    recovery: ([cx, cy, S = 380], o, t, parent) => {
      const g = G(cx, cy, S, 380, o, parent);
      figure(g, { head: [-140, 2], armB: [[-96, -8], [-96, -70], [-134, -92]], body: [[-100, 0], [40, 0]],
        legB: [[40, -6], [110, -8], [190, -6]], legF: [[40, 8], [74, 80], [150, 86]], armF: [[-96, 8], [-66, 56], [-136, 30]] });
      if (t) L(g, 0, 134, t, '#333', 20);
      return g;
    },

    // "allergy cx cy size" — peanut leads to hives (raised itchy welts) on skin
    allergy: ([cx, cy, S = 340], o, t, parent) => {
      const g = G(cx, cy, S, 340, o, parent);
      const nut = 'M-120 -70 C-90 -72 -84 -44 -96 -22 C-104 -8 -86 6 -92 30 C-100 66 -150 66 -156 30 C-160 6 -144 -8 -146 -24 C-150 -50 -146 -68 -120 -70 Z';
      part(g, nut, '#e8c48a', '#8a6420', 3);
      for (const [x, y] of [[-132, -40], [-112, -30], [-124, 20], [-108, 36], [-136, 40], [-118, -54]]) line(g, `M${x} ${y} l8 4 M${x + 8} ${y} l-8 4`, '#b08a4a', 1.4);
      arrow(g, -64, 0, -6, 0, '#c0392b', 3.4);
      part(g, R(10, -70, 160, 140, 24), '#f3dcc4', '#8a5a3a', 3);
      for (const [x, y, rx, ry] of [[50, -30, 22, 14], [110, -40, 16, 12], [80, 12, 26, 16], [136, 26, 18, 13], [44, 44, 14, 10]]) {
        fill(g, ell(x, y, rx + 8, ry + 6), '#f4a3a3', { opacity: .55 }); part(g, ell(x, y, rx, ry), '#fbd0cc', '#d0605a', 2);
      }
      for (const [x, y] of [[150, -56], [24, -10], [104, 52]]) line(g, `M${x} ${y} l6 -6 M${x + 6} ${y} l6 -6`, '#c0392b', 1.8);
      if (lbl(o)) { L(g, -124, 96, 'peanut', '#8a6420', 19); L(g, 90, 96, 'hives', '#c0392b', 19); }
      return g;
    },

    // "diabetes cx cy size k=balanced|high|low" — see-saw: insulin against glucose; tilts when out of balance
    diabetes: ([cx, cy, S = 340], o, t, parent) => {
      const g = G(cx, cy, S, 340, o, parent), th = { high: 12, low: -12 }[o.k] || 0;
      part(g, 'M0 50 L-40 120 L40 120 Z', '#9aa8b6', '#4a5a6a', 2.6);
      const p = mk('g', { transform: `translate(0 46) rotate(${th})` }, g);
      part(p, R(-170, -8, 340, 14, 5), '#c97a10', '#7a4a10', 2.6);
      part(p, R(-140, -70, 36, 18, 3), '#e8834a', '#8a3a14', 2); part(p, R(-146, -54, 48, 46, 8), '#bfe0f4', '#3a7aa0', 2.6);
      L(p, -122, -26, 'ins', '#2b4a6a', 14);
      for (const [x, y] of [[90, -36], [126, -36], [108, -70]]) { part(p, R(x, y, 32, 28, 3), '#fdfdfb', '#7a8a9a', 2.2); line(p, `M${x} ${y} l6 -6 l32 0 l0 28 l-6 6 M${x + 32} ${y} l6 -6`, '#7a8a9a', 1.8); }
      if (lbl(o)) { L(p, -122, 34, 'insulin', '#2b6cc4', 20); L(p, 126, 34, 'glucose', '#c97a10', 20); }
      if (t || lbl(o)) L(g, 0, 150, t || { high: 'blood sugar high', low: 'blood sugar low' }[o.k] || 'balanced', '#333', 20);
      return g;
    },

    // "scorebar x1 y x2 min=3 max=15 v=9 | GCS" — generic score bar, low red to high green, marker at v
    scorebar: ([x1 = 200, y = 300, x2 = 760], o, t, parent) => {
      const g = mk('g', {}, parent), lo = +(o.min ?? 3), hi = +(o.max ?? 15), v = +(o.v ?? 9), n = Math.min(20, hi - lo + 1), w = (x2 - x1) / n;
      for (let i = 0; i < n; i++) { const u = i / Math.max(1, n - 1), h = 0 + u * 120; part(g, R(f1(x1 + i * w), y - 18, f1(w - 3), 36, 4), `hsl(${f1(h)} 70% 62%)`, '#4a4a4a', 1.6); }
      const k = Math.round((v - lo) / Math.max(1, hi - lo) * (n - 1)), mx = f1(x1 + (k + .5) * w);
      part(g, `M${mx} ${y - 24} L${mx - 12} ${y - 46} L${mx + 12} ${y - 46} Z`, '#333', '#111', 2); L(g, mx, y - 54, String(v), '#111', 24);
      L(g, x1, y + 44, String(lo), '#c0392b', 20, 'start'); L(g, x2, y + 44, String(hi), '#2c6a22', 20, 'end');
      if (t) L(g, x1, y - 54, t, '#333', 22, 'start');
      return g;
    },

    // "painscale cx cy length v=0-10" — six kind faces 0-10, green to red, word under each
    painscale: ([cx, cy, S = 460], o, t, parent) => {
      const g = G(cx, cy, S, 460, o, parent), cs = ['#7cc46a', '#b4d65a', '#f3d34a', '#f4b53a', '#ef8a4a', '#e8634a'], w = ['no hurt', 'a little', 'more', 'even more', 'a lot', 'worst'];
      for (let i = 0; i < 6; i++) {
        const x = -200 + i * 80, m = 12 - i * 5;
        if (o.v != null && Math.round(+o.v / 2) === i) line(g, ell(x, -10, 42), '#2b6cc4', 4);
        part(g, ell(x, -10, 32), cs[i], '#5a4a2a', 2.6);
        line(g, `M${x - 11} -20 l0 3 M${x + 11} -20 l0 3`, '#3a2a1a', 4);
        if (i >= 3) line(g, `M${x - 17} ${-30 + (i - 3) * -2} l10 ${4 + i - 3} M${x + 17} ${-30 + (i - 3) * -2} l-10 ${4 + i - 3}`, '#3a2a1a', 2.2);
        line(g, `M${x - 13} 4 Q${x} ${4 + m} ${x + 13} 4`, '#3a2a1a', 2.6);
        L(g, x, 44, String(i * 2), '#222', 20); if (lbl(o)) L(g, x, 66, w[i], '#555', 15);
      }
      return g;
    },

    // "triage cx cy size k=red|yellow|green" — triage tag: red immediate, yellow delayed, green minor
    triage: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S, 240, o, parent), [c, ink, s, n] = { yellow: ['#f6d34a', '#7a6414', 'DELAYED', '2'], green: ['#6cc06a', '#1f5a2c', 'MINOR', '3'] }[o.k] || ['#e85a4a', '#7a1f1f', 'IMMEDIATE', '1'];
      line(g, 'M0 -96 C-20 -130 30 -150 20 -170', '#8a7a5a', 2.6);
      part(g, 'M-40 -110 L40 -110 L70 -80 L70 120 L-70 120 L-70 -80 Z', c, ink, 3);
      part(g, ell(0, -84, 10), '#fdfdfb', ink, 2.4);
      L(g, 0, 10, n, ink, 70); L(g, 0, 70, t || s, ink, fit(t || s, 126, 24));
      line(g, 'M-56 90 L56 90', ink, 2);
      return g;
    },

    // "patientchart cx cy size | Name: …; BP 120/80; …" — clipboard chart, lines split by ;
    patientchart: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S, 320, o, parent);
      part(g, R(-120, -150, 240, 300, 12), '#c89a64', '#6a4a20', 3);
      part(g, R(-104, -124, 208, 262, 3), '#fdfdfb', '#8a8a8a', 2);
      part(g, R(-40, -160, 80, 30, 8), '#b0bac4', '#4a5560', 2.6);
      L(g, 0, -92, 'Patient chart', '#1f3a6a', 22);
      const rows = split(t, 'Name: ________; BP 120/80 mmHg; HR 72 /min; Temp 98.6 °F; SpO₂ 98%; Pain 2/10').slice(0, 8);
      rows.forEach((s, i) => { const y = -58 + i * 28; L(g, -92, y, s, '#333', fit(s, 184, 17), 'start'); line(g, `M-94 ${y + 7} L94 ${y + 7}`, '#b9d0e6', 1.2); });
      return g;
    },
  });
})();
