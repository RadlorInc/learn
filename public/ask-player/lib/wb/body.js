// Whiteboard library — body: human anatomy and health. Catalogue: body.txt. Clinical-friendly, no gore, no nudity.
(() => {
  // local helpers (wrapped so nothing leaks into other category files)
  const G = (cx, cy, S, D, o, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${S / D})` }, parent);
  const fill = (g, d, f, ex = {}) => mk('path', { d, fill: f, filter: 'url(#wc)', class: 'fillable', ...ex }, g);
  const part = (g, d, f, ink, w = 3) => { fill(g, d, f); return line(g, d, ink, w); };
  const ell = (x, y, rx, ry = rx) => `M${x - rx} ${y} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
  const sheen = (g, d, w = 6) => line(g, d, '#ffffff', w, { opacity: .55 });
  const lbl = (o) => o.lbl !== '0' && o.lab !== '0' && o.labels !== '0';
  const L = (g, x, y, t, c = '#444', s = 20, a = 'middle') => label(g, x, y, t, c, s, a);
  const arrow = (g, x1, y1, x2, y2, c, w = 2.5) => { line(g, `M${x1} ${y1} L${x2} ${y2}`, c, w); line(g, head(x2, y2, x1, y1, 10), c, w, { class: 'ink head' }); };
  const DK = '#5b1a1a';

  // a red disc (dimpled) used by several drawings
  const rbc = (g, x, y, r = 14) => { fill(g, ell(x, y, r), '#d9483c'); fill(g, ell(x, y, r * .45), '#a8302a', { opacity: .6 }); line(g, ell(x, y, r), '#7a1f1f', 2); };

  Object.assign(window.RECIPES, {
    // "torso cx cy height" — plain body outline (head, neck, shoulders, trunk) to place organs on
    torso: ([cx, cy, S = 380], o, t, parent) => {
      const g = G(cx, cy, S, 380, o, parent), INKT = '#6b4a30';
      const d = 'M-18 -122 C-18 -114 -20 -110 -28 -106 C-66 -100 -104 -94 -116 -66 C-124 -40 -122 0 -116 40 C-110 80 -112 120 -104 170 L104 170 C112 120 110 80 116 40 C122 0 124 -40 116 -66 C104 -94 66 -100 28 -106 C20 -110 18 -114 18 -122';
      fill(g, d + ' Z', '#f3e2cf'); fill(g, ell(0, -162, 36, 42), '#f3e2cf');
      fill(g, 'M60 -100 C100 -92 116 -70 116 -40 C120 20 108 100 104 170 L70 170 C84 100 92 0 60 -100 Z', '#e5c9ad', { opacity: .7 });
      line(g, d, INKT, 4); line(g, ell(0, -162, 36, 42), INKT, 4);
      line(g, 'M-60 -92 C-40 -84 -20 -84 -6 -88 M60 -92 C40 -84 20 -84 6 -88', '#b08a6a', 2, { opacity: .7 });
      sheen(g, 'M-104 -60 C-96 -80 -76 -92 -56 -96', 6); sheen(g, 'M-22 -186 C-14 -196 -2 -200 10 -198', 5);
      return g;
    },

    // "lungs cx cy size" — two lungs, windpipe and branching bronchi (loop beat = breathing)
    lungs: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      const Lp = 'M-22 -70 C-40 -100 -70 -104 -92 -80 C-122 -46 -130 40 -122 100 C-118 122 -96 126 -70 116 C-46 106 -20 98 -14 80 C-10 30 -12 -30 -22 -70 Z';
      const Rp = Lp.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => `${-x} ${y}`);
      part(g, Lp, '#f4a3a8', '#9a3b46', 3.2); part(g, Rp, '#f4a3a8', '#9a3b46', 3.2);
      sheen(g, 'M-100 -50 C-108 -20 -110 10 -108 40'); sheen(g, 'M84 -60 C96 -40 100 -10 100 20');
      const tr = 'M-9 -130 L-9 -48 M9 -130 L9 -48';
      fill(g, 'M-9 -130 L9 -130 L9 -48 L-9 -48 Z', '#dfe7ee');
      line(g, tr, '#5a6a7a', 3);
      for (let y = -122; y < -54; y += 12) line(g, `M-9 ${y} L9 ${y}`, '#8a9aaa', 2);
      for (const s of [-1, 1]) {
        line(g, `M${s * 9} -48 Q${s * 30} -36 ${s * 48} -10`, '#5a6a7a', 4);
        line(g, `M${s * 48} -10 Q${s * 70} 10 ${s * 82} 50 M${s * 48} -10 Q${s * 62} -30 ${s * 80} -46 M${s * 48} -10 Q${s * 50} 20 ${s * 48} 70`, '#9a3b46', 2.4);
        line(g, `M${s * 66} 14 L${s * 92} 20 M${s * 74} 34 L${s * 64} 60 M${s * 62} -26 L${s * 66} -54`, '#9a3b46', 1.8);
      }
      if (lbl(o)) { L(g, 0, -140, 'windpipe', '#5a6a7a', 18); }
      return g;
    },

    // "alveolus cx cy size" — grape-like air sacs on a bronchiole, capillary net, O₂ in, CO₂ out
    alveolus: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S, 260, o, parent);
      const tube = 'M-9 -132 L-9 -70 C-20 -60 -34 -50 -40 -40 L-26 -32 C-20 -42 -10 -52 0 -58 C10 -52 20 -42 26 -32 L40 -40 C34 -50 20 -60 9 -70 L9 -132 Z';
      part(g, tube, '#f4c3c6', '#9a3b46', 2.8);
      for (let y = -124; y < -76; y += 12) line(g, `M-9 ${y} L9 ${y}`, '#c77a84', 1.6);
      // grapes: back row first, each sac's fill covers the sac behind it
      const sacs = [[-32, -14, 30], [32, -14, 30], [-62, 30, 30], [62, 30, 30], [0, 22, 32], [-32, 70, 30], [32, 70, 30], [0, 108, 26]];
      for (const [x, y, r] of sacs) {
        fill(g, ell(x, y, r), '#f7b8bc'); fill(g, ell(x + r * .2, y + r * .25, r * .62), '#ef9aa2', { opacity: .55 });
        line(g, ell(x, y, r), '#9a3b46', 2.6); sheen(g, `M${x - r * .6} ${y - r * .2} C${x - r * .5} ${y - r * .6} ${x - r * .2} ${y - r * .75} ${x + r * .1} ${y - r * .78}`, 4);
      }
      // capillary net: blue in (left), red out (right), fine mesh over the sacs
      line(g, 'M-132 120 C-110 90 -100 50 -96 20 C-92 -10 -76 -40 -50 -48', '#3d78c2', 6);
      line(g, 'M50 -48 C76 -40 92 -10 96 20 C100 50 110 90 132 120', '#c9352b', 6);
      for (const d of ['M-92 6 C-50 -6 -10 14 30 0 C60 -10 80 0 94 8', 'M-94 44 C-50 30 -10 50 30 36 C60 26 80 40 96 46', 'M-62 92 C-30 80 0 100 30 88 C46 82 56 86 66 92',
                       'M-50 -48 C-60 -10 -40 30 -60 60 C-66 76 -50 94 -30 100', 'M50 -48 C60 -10 40 30 60 60 C66 76 50 94 30 100', 'M0 -12 C-10 20 10 50 0 82 C-6 100 0 120 0 132'])
        line(g, d, '#a0507a', 1.8, { opacity: .85 });
      if (lbl(o)) { arrow(g, -150, -70, -58, -36, '#2b6cc4', 3); L(g, -150, -80, 'O₂ in', '#2b6cc4', 22, 'start');
        arrow(g, 58, -36, 150, -70, '#8a6414', 3); L(g, 150, -80, 'CO₂ out', '#8a6414', 22, 'end');
        L(g, 16, -110, 'bronchiole', '#9a3b46', 17, 'start'); }
      return g;
    },

    // "brain cx cy size" — side view, lobes coloured, cerebellum and brain stem
    brain: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      const out = 'M-130 10 C-150 -60 -100 -120 -20 -122 C60 -126 130 -90 138 -20 C142 20 120 40 96 44 L40 48 C10 60 -40 62 -80 56 C-110 52 -126 40 -130 10 Z';
      const id = 'brc' + clipN++; mk('clipPath', { id }, g).append(mk('path', { d: out }));
      const c = mk('g', { 'clip-path': `url(#${id})` }, g);
      fill(c, 'M-160 -140 L10 -140 C0 -80 -10 -40 -20 0 L-160 60 Z', '#9cc3ef');              // frontal
      fill(c, 'M10 -140 L150 -140 L150 -40 C110 -40 60 -30 20 -10 C0 -40 2 -90 10 -140 Z', '#ffd56a'); // parietal
      fill(c, 'M150 -40 L150 80 L90 80 C90 40 70 0 40 -14 C80 -32 110 -40 150 -40 Z', '#f6a35a');      // occipital
      fill(c, 'M-160 60 L-20 0 C10 -14 40 -16 60 -4 C80 10 90 40 90 80 L-160 80 Z', '#8fd18a');         // temporal
      fill(g, 'M40 48 C50 84 110 86 124 56 C128 44 116 40 96 44 Z', '#f4a3c4');                       // cerebellum
      fill(g, 'M14 54 C14 80 20 110 26 128 L46 128 C44 104 44 80 46 50 Z', '#e8c8a8');                  // stem
      line(g, out, '#6a4a5a', 3.4);
      line(g, 'M40 48 C50 84 110 86 124 56', '#6a4a5a', 3); line(g, 'M14 54 C14 80 20 110 26 128 M46 50 C44 80 44 104 46 128', '#6a4a5a', 3);
      line(g, 'M10 -122 C0 -80 -8 -40 -20 0', '#5a4a6a', 2.6);                                        // central groove
      line(g, 'M-110 30 C-60 10 -10 -14 60 -4 C80 6 88 24 92 42', '#5a4a6a', 2.6);                   // lateral groove
      line(g, 'M40 -14 C80 -32 110 -40 138 -40', '#5a4a6a', 2);
      for (const d of ['M-96 -70 q14 -16 28 0 t28 0', 'M-110 -30 q12 -14 24 0 t24 0 t24 0', 'M40 -96 q14 -14 28 0 t28 0', 'M30 -56 q12 -12 24 0 t24 0',
                       'M-80 34 q12 -10 24 0 t24 0', 'M98 0 q10 -10 20 0', 'M70 66 q10 -8 20 0 t20 0'])
        line(g, d, '#6a4a5a', 1.8, { opacity: .7 });
      sheen(g, 'M-110 -60 C-96 -96 -60 -112 -20 -114', 5);
      if (lbl(o)) for (const [x, y, s] of [[-70, -14, 'frontal'], [72, -74, 'parietal'], [-30, 40, 'temporal'], [114, 6, 'occip.']])
        L(g, x, y, s, '#3a3a4a', 18);
      return g;
    },

    // "neuron cx cy length" — dendrites, cell body, myelinated axon, terminals (loop flow = signal)
    neuron: ([cx, cy, S = 380], o, t, parent) => {
      const g = G(cx, cy, S, 380, o, parent);
      for (const [a, l] of [[150, 60], [190, 64], [230, 58], [120, 50], [260, 46]]) {
        const r = a * Math.PI / 180, x = -130 + Math.cos(r) * l, y = Math.sin(r) * l;
        line(g, `M-130 0 Q${-130 + Math.cos(r) * l * .5 + 6} ${Math.sin(r) * l * .5} ${x} ${y}`, '#8a5aa8', 3);
        line(g, `M${x} ${y} l${Math.cos(r + .5) * 18} ${Math.sin(r + .5) * 18} M${x} ${y} l${Math.cos(r - .5) * 18} ${Math.sin(r - .5) * 18}`, '#8a5aa8', 2.2);
      }
      fill(g, 'M-160 -6 C-160 -36 -110 -40 -98 -14 L-90 -5 L-90 5 C-100 30 -150 34 -160 6 Z', '#c8a2e0');
      fill(g, ell(-132, 0, 11), '#7a4aa0');
      line(g, 'M-160 -6 C-160 -36 -110 -40 -98 -14 L-90 -5 L-90 5 C-100 30 -150 34 -160 6 Z', '#6a3a88', 3);
      line(g, 'M-90 0 L140 0', '#6a3a88', 3);
      for (let x = -76; x < 120; x += 46) { fill(g, `M${x} -10 L${x + 36} -10 Q${x + 42} 0 ${x + 36} 10 L${x} 10 Q${x - 6} 0 ${x} -10 Z`, '#fff1b8');
        line(g, `M${x} -10 L${x + 36} -10 Q${x + 42} 0 ${x + 36} 10 L${x} 10 Q${x - 6} 0 ${x} -10 Z`, '#b08a20', 2.2); }
      for (const a of [-40, -12, 16, 42]) { const r = a * Math.PI / 180, x = 140 + Math.cos(r) * 40, y = Math.sin(r) * 40;
        line(g, `M140 0 Q${140 + Math.cos(r) * 20} ${y * .3} ${x} ${y}`, '#6a3a88', 2.4); fill(g, ell(x + 4, y, 7), '#c8a2e0'); line(g, ell(x + 4, y, 7), '#6a3a88', 2); }
      if (lbl(o)) { L(g, -128, 56, 'cell body', '#6a3a88', 18); L(g, 30, -22, 'axon', '#6a3a88', 18); }
      return g;
    },

    // "synapse cx cy size" — nerve ending releases messenger dots across a gap to receptors
    synapse: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S, 260, o, parent);
      const top = 'M-50 -130 L-50 -60 C-110 -50 -110 0 -80 6 L80 6 C110 0 110 -50 50 -60 L50 -130';
      part(g, top + ' Z', '#c8a2e0', '#6a3a88', 3);
      for (const [x, y] of [[-46, -26], [-14, -40], [20, -24], [50, -34], [0, -10], [-30, -6], [36, -6]]) { fill(g, ell(x, y, 10), '#fff1b8'); line(g, ell(x, y, 10), '#b08a20', 1.8); }
      const bot = 'M-120 44 C-60 34 60 34 120 44 L120 120 L-120 120 Z';
      part(g, bot, '#b9d6f2', '#2f5f96', 3);
      for (const x of [-60, -20, 20, 60]) line(g, `M${x - 8} 30 L${x - 8} 38 L${x + 8} 38 L${x + 8} 30`, '#2f5f96', 2.6);
      for (const [x, y] of [[-40, 18], [-6, 22], [28, 16], [52, 22]]) { fill(g, ell(x, y, 4), '#e0a100'); line(g, ell(x, y, 4), '#8a6414', 1.6); }
      if (lbl(o)) { L(g, 128, 26, 'gap', '#555', 18, 'start'); }
      return g;
    },

    // "kidney cx cy size" — bean: pale cortex, cone pyramids (medulla), pelvis, artery, vein, ureter
    kidney: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S, 260, o, parent);
      const out = 'M10 -110 C-60 -118 -100 -60 -100 0 C-100 60 -60 118 10 110 C50 106 60 70 40 40 C30 20 30 -20 40 -40 C60 -70 50 -106 10 -110 Z';
      fill(g, out, '#7a2e2a'); fill(g, 'M10 -98 C-52 -104 -88 -54 -88 0 C-88 54 -52 104 10 98 C40 94 46 66 30 40 C20 20 20 -20 30 -40 C46 -66 40 -94 10 -98 Z', '#e8a08e');
      // renal pyramids: cones, wide base at the cortex, tip pointing in to the pelvis
      const P = [34, 0];
      for (const a of [118, 150, 180, 210, 242]) {
        const pt = (deg, r) => { const q = deg * Math.PI / 180; return [P[0] + Math.cos(q) * r, P[1] + Math.sin(q) * r]; };
        const [ax, ay] = pt(a, 50), [lx, ly] = pt(a - 13, 100), [rx, ry] = pt(a + 13, 100), [mx, my] = pt(a, 110), [hx, hy] = pt(a - 6, 74), [kx, ky] = pt(a + 6, 74);
        const d = `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${hx.toFixed(1)} ${hy.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${rx.toFixed(1)} ${ry.toFixed(1)} Q${kx.toFixed(1)} ${ky.toFixed(1)} ${ax.toFixed(1)} ${ay.toFixed(1)} Z`;
        part(g, d, '#b5473f', '#6a1f1c', 2.2);
        for (const s of [-6, 0, 6]) { const [bx, by] = pt(a + s, 96), [cx2, cy2] = pt(a + s * .3, 60); line(g, `M${bx.toFixed(1)} ${by.toFixed(1)} L${cx2.toFixed(1)} ${cy2.toFixed(1)}`, '#8a2e2a', 1.4, { opacity: .7 }); }
      }
      part(g, 'M-14 -46 C4 -40 14 -26 34 -16 L46 -12 L46 14 L34 18 C14 26 4 40 -14 46 C-2 22 -2 -22 -14 -46 Z', '#f6e3c0', '#9a7a3a', 2.2);
      line(g, out, '#5b1a1a', 3.6);
      line(g, 'M40 -24 C70 -28 90 -32 124 -32', '#c9352b', 8); line(g, 'M42 2 C70 2 90 6 124 6', '#3d78c2', 8);
      line(g, 'M42 16 C60 40 64 80 60 130', '#d6b45a', 7);
      sheen(g, 'M-76 -60 C-66 -84 -40 -98 -12 -100');
      if (lbl(o)) { L(g, 128, -38, 'artery', '#c0392b', 17, 'start'); L(g, 128, 12, 'vein', '#2b6cc4', 17, 'start'); L(g, 70, 124, 'ureter', '#8a6414', 17, 'start');
        L(g, -96, -100, 'cortex', '#a0483e', 17, 'end'); L(g, -96, 118, 'pyramid', '#6a1f1c', 17, 'end'); }
      return g;
    },

    // "nephron cx cy size" — glomerulus ball in its cup, wide winding tubule, loop of Henle, collecting duct (loop flow)
    nephron: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      const tube = (d, edge, light, w = 12) => { line(g, d, edge, w + 6, { filter: 'url(#wc)', class: 'fillable' }); line(g, d, light, w, { filter: 'url(#wc)', class: 'fillable' }); line(g, d, edge, 2, { opacity: .8 }); };
      // collecting duct (back), then the tubule that joins it
      tube('M110 -132 L110 134', '#7a5a8a', '#d9c6e8', 18);
      tube('M-70 -48 C-40 -40 -64 -10 -36 0 C-10 10 -40 30 -10 40 L-10 116 Q8 140 26 116 L26 -10 C40 -40 14 -56 44 -72 C70 -86 96 -76 110 -60', '#b0702a', '#f6d29a', 12);
      // blood in and out of the filter
      line(g, 'M-150 -128 C-140 -106 -132 -94 -112 -86', '#c9352b', 7); line(g, 'M-112 -70 C-130 -64 -140 -54 -150 -36', '#9a3b7a', 6);
      fill(g, ell(-92, -78, 40), '#f6e3d8'); line(g, 'M-129.6 -91.7 A40 40 0 1 1 -129.6 -64.3', '#7a5a4a', 3);
      fill(g, ell(-92, -78, 27), '#e0645a');
      line(g, 'M-110 -88 c4 -12 14 -10 16 0 c2 10 12 12 16 2 c4 -10 14 -8 14 4 M-114 -72 c6 -10 14 -6 16 2 c2 8 12 10 16 0 c4 -8 12 -6 14 4 M-104 -58 c6 -6 12 -2 16 2 c4 4 10 2 12 -4', '#9a1f1f', 2.4);
      line(g, ell(-92, -78, 27), '#7a1f1f', 2.6);
      sheen(g, 'M-106 -94 C-100 -102 -90 -104 -82 -102', 4);
      if (lbl(o)) { L(g, -92, -134, 'glomerulus', '#7a1f1f', 18); L(g, -34, 70, 'tubule', '#9a5a1a', 17, 'end'); L(g, 8, 152, 'loop of Henle', '#9a5a1a', 17);
        L(g, 128, -110, 'collecting', '#5a3a6a', 17, 'start'); L(g, 128, -90, 'duct', '#5a3a6a', 17, 'start'); L(g, 126, 130, 'urine ↓', '#5a3a6a', 16, 'start'); }
      return g;
    },

    // "liver cx cy size" — wedge-shaped liver with green gallbladder below
    liver: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      const out = 'M-140 -20 C-150 -70 -80 -90 0 -86 C70 -84 130 -80 146 -60 C150 -40 110 -10 60 20 C20 44 -20 64 -60 60 C-110 54 -134 20 -140 -20 Z';
      part(g, out, '#b5544a', '#5b1e18', 3.4);
      line(g, 'M10 -86 C0 -40 -4 0 -10 50', '#5b1e18', 2.4);
      fill(g, 'M10 40 C0 70 20 92 36 82 C50 72 40 50 34 34 Z', '#7cc06a'); line(g, 'M10 40 C0 70 20 92 36 82 C50 72 40 50 34 34', '#2f6a24', 2.6);
      sheen(g, 'M-120 -40 C-100 -70 -50 -78 0 -76');
      return g;
    },

    // "stomach cx cy size" — J-shaped stomach with food pipe and inner folds
    stomach: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S, 260, o, parent);
      const out = 'M-10 -130 L-10 -86 C-60 -84 -80 -30 -70 20 C-60 80 0 110 60 90 C90 80 100 60 110 40 L130 40 L130 16 L104 16 C80 40 40 50 20 20 C10 0 20 -60 14 -86 L14 -130 Z';
      part(g, out, '#f2a2a8', '#8a2e3e', 3.4);
      for (const d of ['M-50 -20 C-30 10 -40 40 -20 60', 'M-30 -40 C-10 -10 -20 30 0 60', 'M0 70 C20 66 40 70 60 64']) line(g, d, '#c75a6a', 2, { opacity: .8 });
      sheen(g, 'M-58 -20 C-60 -50 -40 -76 -16 -80');
      return g;
    },

    // "intestines cx cy size" — large intestine framing coiled small intestine
    intestines: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      const big = 'M30 110 C80 110 100 90 110 70 L110 -80 C110 -100 90 -106 70 -106 L-80 -106 C-104 -106 -112 -96 -112 -80 L-112 80 C-112 100 -96 110 -76 110 L-50 110';
      line(g, big, '#b06a3a', 26, { opacity: .9, filter: 'url(#wc)', class: 'fillable' });
      line(g, big, '#7a4520', 3);
      let d = 'M-76 -76';
 for (let i = 0; i < 6; i++) { const y = -76 + i * 28, r = i % 2 === 0; d += r ? ` C-40 ${y + 6} 40 ${y - 6} 70 ${y}` : ` C40 ${y - 6} -40 ${y + 6} -76 ${y}`;
        if (i < 5) d += r ? ` Q86 ${y + 14} 70 ${y + 28}` : ` Q-92 ${y + 14} -76 ${y + 28}`; }
      line(g, d, '#f0a6a0', 14, { opacity: .95, filter: 'url(#wc)', class: 'fillable' });
      line(g, d, '#a8484a', 2.4);
      if (lbl(o)) { L(g, 0, -118, 'large', '#7a4520', 18); L(g, 0, 140, 'small (inside)', '#a8484a', 18); }
      return g;
    },

    // "digestive cx cy height" — body outline with food pipe, stomach, liver, intestines
    digestive: ([cx, cy, S = 420], o, t, parent) => {
      const g = G(cx, cy, S, 420, o, parent);
      RECIPES.torso([0, 0, 380], {}, '', g);
      line(g, 'M0 -150 C0 -100 4 -60 10 -36', '#c75a6a', 6);
      part(g, 'M10 -40 C-6 -38 -14 -14 -10 6 C-4 30 30 40 54 30 C66 24 72 14 76 4 L64 -2 C50 12 34 14 26 0 C20 -12 24 -30 22 -40 Z', '#f2a2a8', '#8a2e3e', 2.6);
      part(g, 'M-90 -40 C-94 -64 -40 -70 10 -60 C26 -56 20 -44 6 -36 C-20 -20 -50 -10 -70 -12 C-84 -14 -88 -26 -90 -40 Z', '#b5544a', '#5b1e18', 2.6);
      const big = 'M10 140 C40 140 70 130 70 112 L70 30 C70 20 60 16 50 16 L-56 16 C-70 16 -76 24 -76 34 L-76 120 C-76 134 -66 140 -50 140';
      line(g, big, '#b06a3a', 16, { opacity: .9, filter: 'url(#wc)', class: 'fillable' }); line(g, big, '#7a4520', 2.4);
      let d = 'M-52 40'; for (let i = 0; i < 4; i++) { const y = 40 + i * 24; d += i % 2 === 0 ? ` C-20 ${y + 4} 20 ${y - 4} 46 ${y}` : ` C20 ${y - 4} -20 ${y + 4} -52 ${y}`;
        if (i < 3) d += i % 2 === 0 ? ` Q62 ${y + 12} 46 ${y + 24}` : ` Q-68 ${y + 12} -52 ${y + 24}`; }
      line(g, d, '#f0a6a0', 9, { opacity: .95, filter: 'url(#wc)', class: 'fillable' }); line(g, d, '#a8484a', 2);
      return g;
    },

    // "pancreas cx cy size" — long yellow gland with its duct
    pancreas: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      const out = 'M-130 10 C-140 -30 -100 -50 -70 -30 C-30 -10 30 -40 80 -40 C120 -40 140 -20 136 -4 C130 16 90 10 50 20 C10 30 -20 50 -60 50 C-100 50 -124 36 -130 10 Z';
      part(g, out, '#f6cf7a', '#9a6a14', 3.2);
      for (const [x, y] of [[-100, 10], [-60, 20], [-20, 10], [20, -6], [60, -14], [100, -20], [-80, -10], [40, 8]]) line(g, `M${x - 6} ${y} q6 -8 12 0`, '#c9962a', 1.8);
      line(g, 'M-120 12 C-60 26 20 0 120 -22', '#c97a10', 2.2);
      sheen(g, 'M-110 -14 C-96 -30 -80 -30 -66 -22', 5);
      return g;
    },

    // "skeleton cx cy height" — simple friendly full skeleton, front view
    skeleton: ([cx, cy, S = 420], o, t, parent) => {
      const g = G(cx, cy, S, 420, o, parent), B = '#5a5a5a', W = '#fbf7ee';
      part(g, 'M-26 -170 C-30 -206 30 -206 26 -170 C26 -152 14 -146 0 -146 C-14 -146 -26 -152 -26 -170 Z', W, B, 3);
      fill(g, ell(-10, -172, 6, 7), '#7a7a7a'); fill(g, ell(10, -172, 6, 7), '#7a7a7a');
      line(g, ell(-10, -172, 6, 7), B, 2); line(g, ell(10, -172, 6, 7), B, 2); line(g, 'M-8 -156 L8 -156', B, 2);
      line(g, 'M0 -144 L0 40', B, 5);
      line(g, 'M-50 -124 L50 -124', B, 4);
      for (let i = 0; i < 5; i++) { const y = -110 + i * 16, w = 40 - i * 2; line(g, `M0 ${y} C${-w} ${y - 4} ${-w - 4} ${y + 10} ${-w + 6} ${y + 14} M0 ${y} C${w} ${y - 4} ${w + 4} ${y + 10} ${w - 6} ${y + 14}`, B, 2.6); }
      part(g, 'M-44 30 C-40 60 -14 60 0 50 C14 60 40 60 44 30 C30 40 -30 40 -44 30 Z', W, B, 3);
      for (const s of [-1, 1]) {
        line(g, `M${s * 50} -124 L${s * 62} -40 L${s * 70} 40`, B, 4);
        line(g, `M${s * 70} 40 l${s * -4} 14 M${s * 70} 40 l${s * 2} 16 M${s * 70} 40 l${s * 8} 12`, B, 2);
        line(g, `M${s * 24} 54 L${s * 30} 140 L${s * 32} 210`, B, 4.5);
        line(g, `M${s * 32} 210 L${s * 48} 214`, B, 4);
        for (const [x, y] of [[50, -124], [62, -40], [30, 140]]) fill(g, ell(s * x, y, 5), W);
      }
      return g;
    },

    // "skull cx cy size" — friendly simple front-view skull
    skull: ([cx, cy, S = 220], o, t, parent) => {
      const g = G(cx, cy, S, 220, o, parent), B = '#5a5a5a';
      const out = 'M-80 -10 C-90 -110 90 -110 80 -10 C78 20 64 30 54 40 L50 80 L-50 80 L-54 40 C-64 30 -78 20 -80 -10 Z';
      part(g, out, '#fbf7ee', B, 3.4);
      for (const s of [-1, 1]) { part(g, ell(s * 34, 4, 22, 24), '#8a8a8a', B, 2.6); }
      part(g, 'M0 30 L-10 50 L10 50 Z', '#8a8a8a', B, 2.4);
      line(g, 'M-40 64 L40 64', B, 2.4);
      for (let x = -30; x <= 30; x += 15) line(g, `M${x} 56 L${x} 76`, B, 2);
      sheen(g, 'M-50 -60 C-30 -80 0 -84 20 -80');
      return g;
    },

    // "bone cx cy length k=whole|section" — long bone, or its cut showing compact, spongy, marrow
    bone: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent), B = '#7a6a4a';
      const shape = 'M-100 -16 C-108 -44 -140 -40 -136 -16 C-150 -4 -150 12 -136 18 C-140 42 -108 46 -100 18 L100 18 C108 46 140 42 136 18 C150 12 150 -4 136 -16 C140 -40 108 -44 100 -16 Z';
      if (o.k === 'section') {
        part(g, shape, '#f3e6c4', B, 3.2);
        fill(g, 'M-96 -8 L96 -8 L96 8 L-96 8 Z', '#e8a24a');
        for (const s of [-1, 1]) for (const [x, y] of [[112, -14], [124, 0], [112, 12], [130, -26], [130, 26], [100, 0]])
          line(g, ell(s * x, y, 5, 4), '#b89a5a', 1.6);
        line(g, 'M-96 -8 L96 -8 M-96 8 L96 8', '#b8742a', 2);
        if (lbl(o)) { L(g, 0, -30, 'compact bone', B, 18); L(g, 0, 50, 'marrow', '#b8742a', 18); L(g, -124, 70, 'spongy', '#9a7a3a', 18); }
      } else {
        part(g, shape, '#fbf4e2', B, 3.2);
        sheen(g, 'M-90 -10 L90 -10', 4);
      }
      return g;
    },

    // "joint cx cy size" — knee: thigh bone, shin bone, cartilage caps, fluid capsule
    joint: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent), B = '#7a6a4a';
      part(g, 'M-90 -40 C-110 -60 -90 -90 -50 -84 L-50 -140 L50 -140 L50 -84 C90 -90 110 -60 90 -40 C70 -20 40 -18 0 -22 C-40 -18 -70 -20 -90 -40 Z', '#fbf4e2', B, 3);
      part(g, 'M-90 30 C-90 14 -40 14 0 18 C40 14 90 14 90 30 C90 50 60 54 50 60 L50 140 L-50 140 L-50 60 C-60 54 -90 50 -90 30 Z', '#fbf4e2', B, 3);
      line(g, 'M-86 -36 C-60 -14 60 -14 86 -36', '#4fa6c9', 6); line(g, 'M-86 24 C-40 10 40 10 86 24', '#4fa6c9', 6);
      line(g, 'M-104 -60 C-120 -10 -120 20 -104 60 M104 -60 C120 -10 120 20 104 60', '#c97a10', 2.4, { 'stroke-dasharray': '6 6' });
      if (lbl(o)) { L(g, 0, 4, 'cartilage', '#2b8ab0', 16); L(g, 0, -110, 'thigh bone', B, 18); L(g, 0, 110, 'shin bone', B, 18); }
      return g;
    },

    // "muscle cx cy size k=flexed|relaxed lbl=0" — arm with biceps bulging (flexed) or long (relaxed)
    muscle: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent), SK = '#8a5a3a', SKF = '#f3cfb0', flex = o.k !== 'relaxed';
      const bone = (d) => line(g, d, '#e9e1cc', 9, { opacity: .9 });
      if (flex) {
        const arm = 'M-150 -24 C-146 -62 -104 -70 -82 -44 C-60 -96 16 -100 34 -44 C38 -64 40 -86 42 -104 L90 -106 C90 -70 90 -24 82 10 C76 42 56 52 30 50 L-110 48 C-140 46 -154 20 -150 -24 Z';
        part(g, arm, SKF, SK, 3.4);
        fill(g, 'M-110 48 L30 50 C56 52 76 42 82 10 L72 4 C66 30 50 38 30 36 L-110 34 Z', '#e2b48e', { opacity: .7 });
        bone('M-126 10 L36 22 L66 -96');
        part(g, 'M-82 -24 C-70 -88 10 -92 26 -28 C0 -6 -50 -6 -82 -24 Z', '#e0645a', '#7a1f1f', 3);
        line(g, 'M-82 -24 L-114 -16 M26 -28 L50 -60', '#c9a07a', 3);
        for (const d of ['M-60 -30 C-52 -66 -10 -72 6 -32', 'M-40 -24 C-34 -50 -12 -54 -2 -28']) line(g, d, '#a83a32', 1.8, { opacity: .8 });
        sheen(g, 'M-58 -56 C-42 -76 -12 -78 6 -62', 5);
        part(g, 'M36 -100 C30 -130 46 -150 68 -150 C92 -150 102 -130 96 -100 Z', SKF, SK, 3.2);
        line(g, 'M48 -146 L50 -124 M62 -150 L62 -126 M76 -148 L76 -124', SK, 2, { opacity: .7 });
        line(g, 'M-40 -112 C-30 -124 -14 -124 -4 -112', '#d27b0c', 2.6); line(g, head(-4, -112, -12, -122, 9), '#d27b0c', 2.6, { class: 'ink head' });
        if (lbl(o)) { L(g, -64, -128, 'biceps bulges', '#a83a32', 20); L(g, -128, 76, 'shoulder', SK, 17); L(g, 56, 76, 'elbow', SK, 17); L(g, 100, -60, 'forearm', SK, 17, 'start'); }
      } else {
        const arm = 'M-150 -24 C-146 -62 -104 -70 -82 -44 C-40 -54 0 -52 40 -40 L120 -26 C130 -24 132 -10 132 0 C132 10 128 20 118 20 L40 30 C20 44 -80 46 -110 44 C-140 44 -154 20 -150 -24 Z';
        part(g, arm, SKF, SK, 3.4);
        fill(g, 'M-110 44 C-80 46 20 44 40 30 L118 20 L118 8 L40 18 C20 30 -80 32 -110 30 Z', '#e2b48e', { opacity: .7 });
        bone('M-126 4 L40 6 L124 -2');
        part(g, ell(150, -2, 26, 22), SKF, SK, 3.2);
        part(g, 'M-82 -30 C-50 -54 4 -52 30 -32 C0 -22 -50 -20 -82 -30 Z', '#e0645a', '#7a1f1f', 3);
        line(g, 'M-82 -30 L-114 -20 M30 -32 L60 -28', '#c9a07a', 3);
        line(g, 'M-60 -34 C-36 -44 -6 -44 14 -34', '#a83a32', 1.8, { opacity: .8 });
        sheen(g, 'M-58 -42 C-36 -50 -10 -50 8 -44', 4);
        if (lbl(o)) { L(g, -28, -64, 'biceps long and relaxed', '#a83a32', 20); L(g, -128, 72, 'shoulder', SK, 17); L(g, 40, 62, 'elbow', SK, 17); L(g, 90, 52, 'forearm', SK, 17, 'start'); }
      }
      return g;
    },

    // "eye cx cy size" — eye cross-section: cornea, iris, lens, retina, optic nerve, light rays
    eye: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      part(g, ell(0, 0, 100), '#fbfbf7', '#5a6a7a', 3.4);
      line(g, 'M70 -71 A100 100 0 0 1 70 71', '#c9352b', 6, { opacity: .8 });
      part(g, 'M-96 -40 C-130 -30 -130 30 -96 40', '#d8eefc', '#2f5f96', 2.6);
      line(g, 'M-90 -42 L-90 -14 M-90 14 L-90 42', '#2f8a5a', 6);
      part(g, ell(-70, 0, 12, 30), '#e8f1c8', '#8a8a3a', 2.4);
      part(g, 'M96 -20 L150 -26 L150 26 L96 20 Z', '#f6d58a', '#9a6a14', 2.6);
      if (o.rays !== '0') { line(g, 'M-170 -30 L-70 -12 L96 0', '#e0a100', 2, { opacity: .9 }); line(g, 'M-170 30 L-70 12 L96 0', '#e0a100', 2, { opacity: .9 }); }
      if (lbl(o)) { L(g, -112, -60, 'cornea', '#2f5f96', 16); L(g, -66, 54, 'lens', '#6a6a2a', 16); L(g, 72, -86, 'retina', '#c0392b', 16, 'start'); L(g, 124, 50, 'nerve', '#9a6a14', 16); }
      return g;
    },

    // "ear cx cy size lbl=0" — outer ear, canal, eardrum, three tiny bones, cochlea spiral, nerve, sound waves
    ear: ([cx, cy, S = 300], o, t, parent) => {
      const g0 = G(cx, cy, S, 300, o, parent), g = mk('g', { transform: 'translate(18 0)' }, g0);
      fill(g, 'M-40 -96 C30 -110 130 -100 150 -40 C160 10 150 70 120 92 C60 110 -20 104 -40 80 Z', '#f4ece0', { opacity: .9 });
      part(g, 'M-90 -60 C-96 -112 -164 -124 -172 -60 C-176 -20 -152 10 -146 40 C-140 74 -136 104 -112 106 C-92 108 -88 90 -90 66 Z', '#f3cfb0', '#8a5a3a', 3.2);
      line(g, 'M-102 -56 C-110 -96 -152 -98 -156 -58 C-158 -26 -138 0 -132 26', '#b07a5a', 2.4);
      line(g, 'M-110 -24 C-126 -22 -128 6 -112 14', '#b07a5a', 2.2);
      part(g, 'M-92 -16 L-8 -18 L-8 18 L-92 16 Z', '#f8e2cc', '#8a5a3a', 2.4);
      part(g, ell(-4, 0, 7, 28), '#f4c46a', '#c97a10', 2.6);
      part(g, 'M2 -20 C10 -30 22 -28 22 -18 L12 2 L4 -2 Z', '#efe3c4', '#6a5a3a', 2);
      part(g, 'M18 -24 C28 -34 42 -28 40 -16 L34 4 L28 2 L26 -10 Z', '#efe3c4', '#6a5a3a', 2);
      part(g, 'M34 0 L52 -8 L56 10 L36 8 Z', '#efe3c4', '#6a5a3a', 2);
      for (const e of [ell(66, -54, 20, 15), ell(90, -66, 13, 20), ell(96, -42, 18, 10)]) line(g, e, '#4fa6c9', 4.4);
      fill(g, ell(90, 14, 34), '#f6d58a');
      let sp = ''; for (let a = 0; a <= 4.2 * Math.PI; a += .2) { const r = 32 - a * 2.1; sp += (sp ? ' L' : 'M') + `${(90 + r * Math.cos(a + Math.PI)).toFixed(1)} ${(14 + r * Math.sin(a + Math.PI)).toFixed(1)}`; }
      line(g, sp, '#9a6a14', 3); line(g, ell(90, 14, 34), '#9a6a14', 2.4);
      line(g, 'M122 22 C138 30 146 46 150 72 M140 40 C150 46 156 52 162 58', '#e0a100', 5);
      for (const [dx, r] of [[0, 22], [14, 32], [28, 42]]) line(g, `M${-186 - dx} ${-r} Q${-170 - dx * 1.6} 0 ${-186 - dx} ${r}`, '#7a4aa0', 2.4, { opacity: .85 });
      if (lbl(o)) { L(g, -130, 136, 'outer ear', '#8a5a3a', 16); L(g, -50, -26, 'canal', '#8a5a3a', 15); L(g, -6, 48, 'eardrum', '#c97a10', 16);
        L(g, 30, -40, 'ear bones', '#6a5a3a', 15, 'end'); L(g, 90, 70, 'cochlea', '#9a6a14', 16); L(g, 150, 92, 'nerve', '#b08000', 16); }
      return g0;
    },

    // "nose cx cy size lbl=0" — side-view head outline, nasal cavity, smell receptors to brain, scent waves in
    nose: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      const hd = 'M70 -136 C-4 -146 -74 -116 -86 -56 C-88 -42 -92 -34 -96 -28 L-128 16 C-134 26 -128 34 -116 34 C-110 34 -104 38 -100 44 C-104 54 -100 62 -96 68 C-100 82 -94 96 -80 102 C-60 110 -30 106 -10 96 L4 140 L96 140 C98 100 116 60 124 20 C134 -60 120 -126 70 -136 Z';
      fill(g, hd, '#f3d9c2');
      fill(g, 'M-60 -96 C-30 -126 40 -128 70 -100 C90 -70 80 -40 50 -34 C10 -30 -30 -40 -50 -56 C-62 -66 -66 -84 -60 -96 Z', '#f6d3e2', { opacity: .9 });
      part(g, 'M-110 30 C-98 6 -84 -14 -66 -32 C-44 -46 -14 -48 6 -36 C16 -18 10 12 -8 28 C-34 40 -74 40 -110 30 Z', '#f6bcbc', '#b0606a', 2.6);
      line(g, 'M-62 -6 C-48 -18 -30 -18 -16 -8 M-70 14 C-54 2 -32 2 -16 12', '#c97a84', 2.2, { opacity: .8 });
      line(g, hd, '#7a5236', 3.6);
      line(g, 'M60 -10 C80 -24 96 -4 88 16 C82 30 70 30 64 22', '#a0704e', 2.6);
      for (let x = -52; x <= -4; x += 8) { line(g, `M${x} ${-42 - (x + 28) * (x + 28) * .006} l0 9`, '#d18b00', 1.8); }
      fill(g, ell(-28, -48, 26, 7), '#ffd84a', { opacity: .7 });
      part(g, ell(-24, -72, 18, 8), '#f3c33b', '#9a6a14', 2.2);
      line(g, 'M-38 -50 L-34 -66 M-24 -52 L-24 -64 M-10 -50 L-14 -66', '#9a6a14', 1.8);
      line(g, 'M-8 -74 C10 -80 26 -86 40 -90', '#9a6a14', 3);
      for (const dy of [-12, 0, 12]) line(g, `M-206 ${30 + dy * 1.4} q10 -8 20 0 t20 0 t20 0 t20 0`, '#7a4aa0', 2.4, { opacity: .9 });
      line(g, head(-122, 30, -134, 30, 10), '#7a4aa0', 2.6, { class: 'ink head' });
      for (const [x, y] of [[-196, -6], [-176, 66], [-150, -14]]) fill(g, ell(x, y, 4), '#b48ad0');
      if (lbl(o)) { L(g, -82, -96, 'smell receptors', '#9a6a14', 16, 'end'); line(g, 'M-80 -92 L-44 -58', '#9a6a14', 1.6); L(g, 50, -112, 'brain', '#a0507a', 16); L(g, -40, 60, 'nasal cavity', '#b0606a', 16); L(g, -166, 82, 'scent', '#7a4aa0', 16); }
      return g;
    },

    // "tooth cx cy size" — tooth layers: enamel, dentin, pulp, two roots in the gum
    tooth: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      fill(g, 'M-110 -20 C-60 -40 60 -40 110 -20 L110 130 L-110 130 Z', '#f4a8b0'); line(g, 'M-110 -20 C-60 -40 60 -40 110 -20', '#a8484a', 2.6);
      const out = 'M-64 -60 C-74 -110 -40 -130 -20 -116 C-6 -108 6 -108 20 -116 C40 -130 74 -110 64 -60 C60 -20 50 20 40 110 C34 126 18 120 16 100 L6 30 L-6 30 L-16 100 C-18 120 -34 126 -40 110 C-50 20 -60 -20 -64 -60 Z';
      part(g, out, '#fff8e8', '#7a6a4a', 3.2);
      fill(g, 'M-58 -60 C-66 -102 -40 -120 -20 -108 C-6 -100 6 -100 20 -108 C40 -120 66 -102 58 -60 C40 -70 -40 -70 -58 -60 Z', '#ffffff');
      line(g, 'M-58 -60 C-40 -70 40 -70 58 -60', '#9ab0c4', 2);
      part(g, 'M-26 -46 C-26 -70 26 -70 26 -46 C26 -10 22 10 16 80 L10 80 L4 10 L-4 10 L-10 80 L-16 80 C-22 10 -26 -10 -26 -46 Z', '#f08a8a', '#a8484a', 2.4);
      if (lbl(o)) { L(g, 72, -96, 'enamel', '#5a7a9a', 16, 'start'); L(g, 64, -30, 'dentin', '#7a6a4a', 16, 'start'); L(g, 0, -20, 'pulp', '#7a1f1f', 16); L(g, 70, 30, 'gum', '#a8484a', 16, 'start'); }
      return g;
    },

    // "skin cx cy size" — skin layers with a hair, its follicle, sweat gland, blood vessel
    skin: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      const top = 'M-140 -70 q35 -10 70 0 t70 0 t70 0 t70 0';
      fill(g, `${top} L140 -40 L-140 -40 Z`, '#f3c6a8'); fill(g, 'M-140 -40 L140 -40 L140 40 L-140 40 Z', '#f6a8a0'); fill(g, 'M-140 40 L140 40 L140 110 L-140 110 Z', '#fbe7a6');
      for (const [x, y] of [[-110, 70], [-70, 80], [-30, 64], [60, 76], [100, 68], [-110, 98], [20, 96], [110, 98]]) line(g, ell(x, y, 14, 10), '#c9a83a', 1.6);
      line(g, top, '#8a5a3a', 3); line(g, 'M-140 -40 L140 -40 M-140 40 L140 40', '#8a5a3a', 2);
      line(g, 'M-140 -70 L-140 110 L140 110 L140 -70', '#8a5a3a', 2.4);
      part(g, 'M-50 50 C-64 30 -60 -40 -54 -70 L-46 -70 C-40 -40 -36 30 -50 50 Z', '#f8e2cc', '#8a5a3a', 2.4);
      line(g, 'M-50 46 L-52 -70 C-54 -100 -60 -120 -76 -134', '#4a3a2a', 3);
      line(g, 'M50 -66 L50 20 c-10 10 10 14 0 24 c-10 10 10 14 0 24', '#2b6cc4', 2.6);
      line(g, 'M-140 20 C-80 10 -20 30 40 14 C80 4 110 16 140 10', '#c9352b', 3.4);
      if (lbl(o)) { L(g, 148, -50, 'epidermis', '#8a5a3a', 15, 'start'); L(g, 148, 8, 'dermis', '#a8484a', 15, 'start'); L(g, 148, 80, 'fat', '#9a7a1a', 15, 'start');
        L(g, -50, 132, 'hair root', '#4a3a2a', 15); L(g, 60, 132, 'sweat gland', '#2b6cc4', 15); }
      return g;
    },

    // "vessel cx cy length k=artery|vein|capillary" — cut-open blood vessel, wall and blood (loop flow)
    vessel: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent), k = o.k || 'artery';
      const [h, wall, col, blood, ink] = { artery: [44, 16, '#e8857a', '#d9483c', '#7a1f1f'], vein: [44, 6, '#8fb6e6', '#4e7fc2', '#1f4f8f'], capillary: [14, 3, '#e8a0a0', '#b85a8a', '#7a3a5a'] }[k];
      fill(g, `M-130 ${-h} L130 ${-h} L130 ${h} L-130 ${h} Z`, col);
      fill(g, `M-130 ${-h + wall} L130 ${-h + wall} L130 ${h - wall} L-130 ${h - wall} Z`, k === 'capillary' ? '#f6d4dc' : '#fbe4e0');
      line(g, `M-130 ${-h} L130 ${-h} M-130 ${h} L130 ${h}`, ink, 3);
      line(g, `M-130 ${-h + wall} L130 ${-h + wall} M-130 ${h - wall} L130 ${h - wall}`, ink, 1.8, { opacity: .7 });
      part(g, ell(-130, 0, 14, h), col, ink, 2.6); fill(g, ell(-130, 0, 14 - wall * .5, h - wall), '#fbe4e0');
      if (k === 'capillary') { for (const x of [-80, -30, 20, 70]) { fill(g, ell(x, 0, 6, 9), '#d9483c'); line(g, ell(x, 0, 6, 9), '#7a1f1f', 1.6); } }
      else for (const [x, y] of [[-70, -8], [-20, 8], [30, -6], [80, 6]]) rbc(g, x, y, 12);
      if (k === 'vein') for (const x of [-40, 60]) line(g, `M${x - 12} ${-h + wall} L${x + 12} -4 M${x - 12} ${h - wall} L${x + 12} 4`, ink, 2.4);
      arrow(g, -60, -h - 22, 60, -h - 22, ink);
      if (lbl(o)) L(g, 0, h + 34, { artery: 'artery: thick wall', vein: 'vein: thin wall, valves', capillary: 'capillary: one cell thin' }[k], ink, 20);
      return g;
    },

    // "bloodcell cx cy size k=red|white|platelet" — one blood cell
    bloodcell: ([cx, cy, S = 160], o, t, parent) => {
      const g = G(cx, cy, S, 160, o, parent), k = o.k || 'red';
      if (k === 'red') { part(g, ell(0, 0, 70, 66), '#d9483c', '#7a1f1f', 3.2); fill(g, ell(0, 4, 32, 28), '#a8302a', { opacity: .7 }); line(g, 'M-28 10 C-20 30 20 30 30 8', '#7a1f1f', 2); sheen(g, 'M-50 -30 C-40 -50 -10 -58 10 -56'); }
      else if (k === 'white') {
        part(g, 'M-60 -20 C-70 -60 -20 -76 10 -64 C50 -74 76 -40 64 -6 C80 24 50 64 16 60 C-20 74 -64 50 -62 20 C-76 10 -72 -10 -60 -20 Z', '#eef0f8', '#5a6a9a', 3);
        for (const [x, y, r] of [[-18, -10, 20], [12, 10, 18], [-10, 24, 14]]) part(g, ell(x, y, r), '#8a6ac8', '#4a3a8a', 2.2);
        for (const [x, y] of [[36, -30], [-40, 30], [40, 34], [-36, -40]]) fill(g, ell(x, y, 3), '#a89ad8');
      } else {
        for (const [x, y] of [[-30, -10], [24, -20], [0, 26]]) { const d = `M${x - 22} ${y} C${x - 26} ${y - 16} ${x - 4} ${y - 22} ${x + 8} ${y - 14} C${x + 26} ${y - 14} ${x + 26} ${y + 10} ${x + 10} ${y + 14} C${x - 4} ${y + 22} ${x - 22} ${y + 14} ${x - 22} ${y} Z`;
          part(g, d, '#f6c8a0', '#9a5a2a', 2.4); fill(g, ell(x, y, 4), '#c97a3a'); }
      }
      return g;
    },

    // "blooddrop cx cy size" — a drop of blood opened up: red cells, a white cell, platelets
    blooddrop: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S, 260, o, parent);
      const out = 'M0 -120 C30 -70 90 -20 90 34 C90 86 50 120 0 120 C-50 120 -90 86 -90 34 C-90 -20 -30 -70 0 -120 Z';
      part(g, out, '#fbe0b0', '#9a3a2a', 3.4);
      for (const [x, y] of [[-40, 20], [0, -10], [40, 30], [-10, 70], [44, 80], [-56, 66], [20, -54]]) rbc(g, x, y, 16);
      fill(g, ell(-30, -40, 18), '#eef0f8'); fill(g, ell(-30, -40, 9), '#8a6ac8'); line(g, ell(-30, -40, 18), '#5a6a9a', 2);
      for (const [x, y] of [[50, -10], [10, 36], [-60, 40]]) { fill(g, ell(x, y, 5, 4), '#f6c8a0'); line(g, ell(x, y, 5, 4), '#9a5a2a', 1.6); }
      sheen(g, 'M-60 -10 C-58 -40 -36 -70 -16 -94', 5);
      if (lbl(o)) { L(g, 100, -20, 'plasma', '#9a7a3a', 17, 'start'); L(g, 100, 10, 'red cells', '#c0392b', 17, 'start'); L(g, 100, 40, 'white cell', '#5a6a9a', 17, 'start'); L(g, 100, 70, 'platelets', '#9a5a2a', 17, 'start'); }
      return g;
    },

    // "bloodtube cx cy height" — spun test tube: plasma 55%, white cells, red cells 45%
    bloodtube: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      fill(g, 'M-34 -100 L34 -100 L34 0 L-34 0 Z', '#f8de7e');
      fill(g, 'M-34 0 L34 0 L34 8 L-34 8 Z', '#ffffff');
      fill(g, 'M-34 8 L34 8 L34 110 C34 150 -34 150 -34 110 Z', '#c0392b');
      line(g, 'M-40 -140 L-40 110 C-40 158 40 158 40 110 L40 -140', '#5a6a7a', 3.2); line(g, 'M-48 -140 L48 -140', '#5a6a7a', 3.2);
      line(g, 'M-34 0 L34 0 M-34 8 L34 8', '#8a8a8a', 1.6);
      sheen(g, 'M-26 -120 L-26 100', 4);
      if (lbl(o)) { L(g, 54, -46, 'plasma 55%', '#9a7a1a', 18, 'start'); L(g, 54, 10, 'white cells, platelets', '#5a6a7a', 16, 'start'); L(g, 54, 80, 'red cells 45%', '#c0392b', 18, 'start'); }
      return g;
    },

    // "immune cx cy size" — friendly germ caught by Y-shaped antibodies, a white cell nearby
    immune: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, x = Math.cos(a), y = Math.sin(a);
        line(g, `M${-40 + x * 44} ${y * 44} L${-40 + x * 60} ${y * 60}`, '#4a7a2a', 3); fill(g, ell(-40 + x * 64, y * 64, 5), '#9ad35a'); }
      part(g, ell(-40, 0, 46), '#9ad35a', '#4a7a2a', 3.2);
      for (const [x, y] of [[-56, -10], [-30, 14], [-34, -24]]) fill(g, ell(x, y, 5), '#5f9a3a');
      const Y = (x, y, a) => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), P = (u, v) => `${x + u * c - v * s} ${y + u * s + v * c}`;
        line(g, `M${P(0, 0)} L${P(22, 0)} M${P(22, 0)} L${P(38, -12)} M${P(22, 0)} L${P(38, 12)}`, '#2b6cc4', 4); };
      Y(60, -50, 200); Y(70, 30, 160); Y(-40, -110, 90); Y(-40, 110, -90);
      fill(g, ell(110, -100, 28), '#eef0f8'); fill(g, ell(112, -100, 12), '#8a6ac8'); line(g, ell(110, -100, 28), '#5a6a9a', 2.6);
      if (lbl(o)) { L(g, -40, 110 + 30, 'germ', '#4a7a2a', 18); L(g, 104, 74, 'antibodies', '#2b6cc4', 18); }
      return g;
    },

    // "gland cx cy size" — butterfly-shaped thyroid gland releasing hormone drops (loop rise)
    gland: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S, 240, o, parent);
      fill(g, 'M-14 -110 L14 -110 L14 100 L-14 100 Z', '#dfe7ee'); line(g, 'M-14 -110 L-14 100 M14 -110 L14 100', '#5a6a7a', 2.4);
      for (const s of [-1, 1]) part(g, `M${s * 10} 20 C${s * 30} 30 ${s * 70} 40 ${s * 80} 0 C${s * 92} -50 ${s * 60} -80 ${s * 40} -50 C${s * 30} -30 ${s * 20} 0 ${s * 10} 0 Z`, '#e8858a', '#8a2e3e', 3);
      part(g, 'M-12 0 L12 0 L12 20 L-12 20 Z', '#e8858a', '#8a2e3e', 2.4);
      sheen(g, 'M-66 -40 C-60 -56 -50 -60 -42 -54', 4);
      for (const [x, y] of [[-100, -70], [-120, -30], [100, -70], [120, -30], [-96, 30], [96, 30]]) { fill(g, `M${x} ${y - 9} C${x + 6} ${y} ${x + 6} ${y + 6} ${x} ${y + 6} C${x - 6} ${y + 6} ${x - 6} ${y} ${x} ${y - 9} Z`, '#f6c84c'); line(g, `M${x} ${y - 9} C${x + 6} ${y} ${x + 6} ${y + 6} ${x} ${y + 6} C${x - 6} ${y + 6} ${x - 6} ${y} ${x} ${y - 9} Z`, '#c97a10', 1.8); }
      if (t || lbl(o)) L(g, 0, 130, t || 'hormones', '#c97a10', 20);
      return g;
    },

    // "ecg x1 y x2 h" — heartbeat trace on a grid monitor strip (loop flow = live pulse)
    ecg: ([x1 = 260, y = 270, x2 = 700, h = 80], o, t, parent) => {
      const g = mk('g', {}, parent), w = x2 - x1;
      fill(g, `M${x1 - 10} ${y - h * 1.3} L${x2 + 10} ${y - h * 1.3} L${x2 + 10} ${y + h * .8} L${x1 - 10} ${y + h * .8} Z`, '#eaf7ee');
      for (let x = x1; x <= x2; x += 20) mk('path', { d: `M${x} ${y - h * 1.3} L${x} ${y + h * .8}`, stroke: '#bfe3c8', 'stroke-width': 1 }, g);
      for (let yy = y - h * 1.2; yy <= y + h * .8; yy += 20) mk('path', { d: `M${x1 - 10} ${yy} L${x2 + 10} ${yy}`, stroke: '#bfe3c8', 'stroke-width': 1 }, g);
      const beats = Math.max(1, Math.round(w / 150)), bw = w / beats; let d = `M${x1} ${y}`;
      for (let i = 0; i < beats; i++) { const b = x1 + i * bw, u = bw / 150;
        d += ` L${b + 30 * u} ${y} Q${b + 38 * u} ${y - h * .2} ${b + 46 * u} ${y} L${b + 56 * u} ${y} L${b + 62 * u} ${y + h * .2} L${b + 70 * u} ${y - h} L${b + 78 * u} ${y + h * .4} L${b + 84 * u} ${y} L${b + 100 * u} ${y} Q${b + 112 * u} ${y - h * .3} ${b + 124 * u} ${y} L${b + bw} ${y}`; }
      line(g, d, '#1f8a4a', 3);
      line(g, `M${x1 - 10} ${y - h * 1.3} L${x2 + 10} ${y - h * 1.3} L${x2 + 10} ${y + h * .8} L${x1 - 10} ${y + h * .8} Z`, '#5a7a6a', 2.4);
      if (t) label(g, x1, y - h * 1.3 - 12, t, '#1f8a4a', 22);
      return g;
    },

    // "feverthermo cx cy height k=fever|normal" — body thermometer, red level high or normal
    feverthermo: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent), hot = o.k !== 'normal', top = hot ? -100 : -10;
      const tube = 'M-14 -120 C-14 -138 14 -138 14 -120 L14 80 C34 92 34 132 0 132 C-34 132 -34 92 -14 80 Z';
      fill(g, tube, '#f4f8fb');
      fill(g, `M-6 ${top} L6 ${top} L6 90 C22 100 22 124 0 124 C-22 124 -22 100 -6 90 Z`, '#e04b3a');
      line(g, tube, '#5a6a7a', 3);
      for (let y = -110; y <= 60; y += 17) line(g, `M14 ${y} L${(y + 110) % 34 ? 22 : 28} ${y}`, '#5a6a7a', 2);
      sheen(g, 'M-8 -110 L-8 60', 3);
      if (lbl(o)) L(g, 34, top + 6, hot ? '39 °C' : '37 °C', hot ? '#c0392b' : '#2c6a22', 22, 'start');
      return g;
    },

    // "pill cx cy size k=capsule|tablet rot=deg" — two-colour capsule or a round scored tablet
    pill: ([cx, cy, S = 160], o, t, parent) => {
      const g = G(cx, cy, S, 160, o, parent);
      if (o.k === 'tablet') { part(g, ell(0, 0, 60), '#ffffff', '#7a8a9a', 3); line(g, 'M-44 0 L44 0', '#9aa8b6', 3); line(g, ell(0, 0, 50), '#c8d0d8', 1.6); sheen(g, 'M-34 -30 C-20 -44 0 -48 14 -44', 4); }
      else { part(g, 'M0 -30 L-50 -30 C-90 -30 -90 30 -50 30 L0 30 Z', '#e04b3a', '#7a1f1f', 3); part(g, 'M0 -30 L50 -30 C90 -30 90 30 50 30 L0 30 Z', '#ffffff', '#7a8a9a', 3); sheen(g, 'M-56 -16 L-10 -16', 5); }
      return g;
    },

    // "syringe cx cy length rot=deg" — clear syringe with blue liquid, plunger and short needle
    syringe: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S, 300, o, parent);
      fill(g, 'M-60 -18 L80 -18 L80 18 L-60 18 Z', '#f4f8fb'); fill(g, 'M10 -16 L78 -16 L78 16 L10 16 Z', '#7fb7ea');
      line(g, 'M-60 -18 L80 -18 L80 18 L-60 18 Z', '#5a6a7a', 3);
      for (let x = 0; x <= 70; x += 14) line(g, `M${x} -18 L${x} -8`, '#5a6a7a', 1.8);
      part(g, 'M-70 -28 L-60 -28 L-60 28 L-70 28 Z', '#dfe7ee', '#5a6a7a', 2.4);
      part(g, 'M2 -16 L10 -16 L10 16 L2 16 Z', '#5a6a7a', '#3a4a5a', 2);
      line(g, 'M2 0 L-120 0', '#5a6a7a', 5); part(g, 'M-128 -22 L-120 -22 L-120 22 L-128 22 Z', '#dfe7ee', '#5a6a7a', 2.4);
      part(g, 'M80 -8 L96 -8 L96 8 L80 8 Z', '#dfe7ee', '#5a6a7a', 2.2);
      line(g, 'M96 0 L140 0', '#8a9aaa', 2);
      return g;
    },

    // "stethoscope cx cy size" — ear pieces, tubing and round chest piece
    stethoscope: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S, 280, o, parent);
      line(g, 'M-50 -120 C-60 -60 -50 -10 0 10 C50 -10 60 -60 50 -120', '#7a8a9a', 5);
      for (const s of [-1, 1]) { fill(g, ell(s * 50, -124, 8), '#3a4a5a'); line(g, ell(s * 50, -124, 8), '#2a3a4a', 2); }
      line(g, 'M0 10 C0 60 60 60 80 30 C100 0 120 20 110 60', '#2b6cc4', 6);
      part(g, ell(110, 90, 30), '#c8d0d8', '#5a6a7a', 3); fill(g, ell(110, 90, 18), '#eef2f6'); line(g, ell(110, 90, 18), '#7a8a9a', 2);
      sheen(g, 'M92 76 C98 68 106 66 114 66', 3);
      return g;
    },

    // "bandage cx cy length rot=deg" — adhesive strip with pad and tiny air holes
    bandage: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S, 260, o, parent);
      part(g, 'M-110 -34 L110 -34 C140 -34 140 34 110 34 L-110 34 C-140 34 -140 -34 -110 -34 Z', '#f3c6a0', '#9a6a3a', 3);
      part(g, 'M-40 -24 L40 -24 L40 24 L-40 24 Z', '#fbf4ea', '#b89a7a', 2.4);
      for (const x of [-100, -80, -60, 60, 80, 100]) for (const y of [-12, 12]) fill(g, ell(x, y, 2.4), '#c99a6a');
      line(g, 'M-110 -20 L-60 -20', '#ffffff', 4, { opacity: .5 });
      return g;
    },
  });
})();
