// Whiteboard library: engineering — structures, construction, energy systems, water, transport infrastructure, environment.
// Wrapped in a function so its helpers never clash with another category's top-level names.
(() => {
  const DK = '#2f3a45', STEEL = '#c9d1d9', CONC = '#d5d9dd', WATER = '#9fd0f2', SOIL = '#c9a46a';
  const G = (cx, cy, s, o, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${s})` }, parent);
  const P = (g, d, fill, ink = DK, w = 3) => { if (fill) mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable' }, g); return line(g, d, ink, w); };
  const F = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...extra }, g);   // fill only
  const R = (x, y, w, h, r = 0) => r
    ? `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
    : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  const E = (x, y, rx, ry = rx) => `M${x + rx} ${y} A${rx} ${ry} 0 1 0 ${x - rx} ${y} A${rx} ${ry} 0 1 0 ${x + rx} ${y} Z`;
  const C = (x, y, r) => E(x, y, r);
  const arc = (x, y, r, a0, a1) => { const p = a => `${(x + r * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(y + r * Math.sin(a * Math.PI / 180)).toFixed(1)}`; return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`; };
  const spin = (el, x, y, secs, dir = 1) => mk('animateTransform', { attributeName: 'transform', type: 'rotate', from: `0 ${x} ${y}`, to: `${360 * dir} ${x} ${y}`, dur: `${secs}s`, repeatCount: 'indefinite' }, el);
  // loop flow dashes every .ink that is not .head: mark the fixed parts of a flowing drawing so only its water/wires/air move
  const still = el => { el.querySelectorAll('.ink').forEach(e => e.classList.add('head')); return el; };
  const arrow = (g, x1, y1, x2, y2, col, w = 4, h = 14) => { line(g, `M${x1} ${y1} L${x2} ${y2}`, col, w); line(g, head(x2, y2, x1, y1, h), col, w, { class: 'ink head' }); };
  const puff = (g, x, y, s = 1, col = '#eef1f4') => { for (const [dx, dy, r] of [[0, 0, 12], [12, -18, 16], [30, -38, 20]]) P(g, C(x + dx * s, y + dy * s, r * s), col, '#9aa3ad', 2); };
  const house = (g, x, y, s = 1, col = '#f7c873') => {     // little house, base centre at x,y
    P(g, `M${x - 22 * s} ${y} V${y - 26 * s} H${x + 22 * s} V${y} Z`, col);
    P(g, `M${x - 28 * s} ${y - 24 * s} L${x} ${y - 46 * s} L${x + 28 * s} ${y - 24 * s} Z`, '#e04b3a');
    P(g, R(x - 6 * s, y - 14 * s, 12 * s, 14 * s), '#8a6a45', DK, 2);
  };
  const tree = (g, x, y, s = 1) => { P(g, R(x - 5 * s, y - 34 * s, 10 * s, 34 * s), '#8a6a45', '#5a3f22', 2.5); P(g, `M${x - 26 * s} ${y - 40 * s} C${x - 36 * s} ${y - 76 * s} ${x - 6 * s} ${y - 96 * s} ${x + 8 * s} ${y - 82 * s} C${x + 34 * s} ${y - 84 * s} ${x + 36 * s} ${y - 48 * s} ${x + 20 * s} ${y - 36 * s} Z`, FILL.green, INK.green, 2.5); };
  const pylon = (g, x, by, h) => { F(g, `M${x - h * .16} ${by} L${x - 4} ${by - h} H${x + 4} L${x + h * .16} ${by} Z`, '#eef1f4');
    line(g, `M${x - h * .16} ${by} L${x - 4} ${by - h} H${x + 4} L${x + h * .16} ${by} M${x - h * .11} ${by - h * .3} L${x + h * .07} ${by - h * .62} M${x + h * .11} ${by - h * .3} L${x - h * .07} ${by - h * .62} M${x - h * .2} ${by - h * .82} H${x + h * .2}`, '#4a525c', 2.5); };
  const topCar = (g, x, y, a, col) => { const c = mk('g', { transform: `translate(${x} ${y}) rotate(${a})` }, g);   // car seen from above, nose to +x
    P(c, R(-26, -14, 52, 28, 8), col, DK, 2.5); P(c, R(6, -11, 9, 22, 3), '#bfe3fa', DK, 1.8); P(c, R(-19, -10, 7, 20, 3), '#bfe3fa', DK, 1.8); return c; };
  const labelsOn = o => o.labels !== '0' && o.lab !== '0';   // lab=0 or labels=0 hides the drawing's own words

  Object.assign(window.RECIPES, {
    // "bridge cx cy width k=beam|arch|suspension|cable|truss forces=1" — bridge over water; forces=1 adds push/pull arrows
    bridge: ([cx, cy, S = 440], o, t, parent) => {
      const k = o.k || 'beam', g = G(cx, cy, S / 440, o, parent), fz = o.forces === '1', RED = INK.red, BLU = INK.blue;
      F(g, 'M-220 30 H220 V100 H-220 Z', '#cfe8f8'); line(g, 'M-140 52 q12 -6 24 0 t24 0 M50 70 q12 -6 24 0 t24 0 M-60 88 q12 -6 24 0 t24 0', INK.sky, 2.5);
      P(g, 'M-220 2 H-178 Q-160 40 -150 100 H-220 Z', SOIL, '#7a5a2a'); P(g, 'M220 2 H178 Q160 40 150 100 H220 Z', SOIL, '#7a5a2a');
      const cmp = (x, y) => labelsOn(o) && label(g, x, y, 'compression', TXT.red, 19, 'middle'), ten = (x, y) => labelsOn(o) && label(g, x, y, 'tension', TXT.blue, 19, 'middle');
      if (k === 'beam') {
        for (const x of [-70, 50]) P(g, R(x, 6, 20, 94), '#b8c0c8');
        P(g, R(-185, -10, 370, 18, 2), STEEL);
        if (fz) { for (const x of [-130, 0, 130]) arrow(g, x, -80, x, -16, RED, 4); for (const x of [-60, 60]) arrow(g, x, 132, x, 106, BLU, 4); if (labelsOn(o)) { label(g, 0, -90, 'load', TXT.red, 20, 'middle'); label(g, 0, 128, 'supports push up', TXT.blue, 18, 'middle'); } }
      } else if (k === 'arch') {
        P(g, 'M-178 40 Q0 -36 178 40 L150 62 Q0 0 -150 62 Z', '#e3d5b8', '#7a6a4a');
        let d = ''; for (const x of [-140, -110, -80, -50, 50, 80, 110, 140]) { const u = (x + 178) / 356; d += `M${x} ${(40 - 152 * u * (1 - u)).toFixed(1)} V6 `; } line(g, d, '#7a6a4a', 3);
        P(g, R(-185, -8, 370, 14, 2), STEEL);
        if (fz) { arrow(g, 0, -80, 0, -14, RED, 4); arrow(g, -90, 6, -158, 46, RED, 4); arrow(g, 90, 6, 158, 46, RED, 4); cmp(0, -90); }
      } else if (k === 'suspension') {
        for (const x of [-110, 110]) P(g, R(x - 8, -134, 16, 234, 2), '#e04b3a', '#7a2a20');
        const y = x => { const u = (x + 110) / 220; return -126 + 404 * u - 404 * u * u; };
        let d = ''; for (let x = -90; x <= 90; x += 20) d += `M${x} ${y(x).toFixed(1)} V-8 `; for (const x of [-190, -170, -150, -130, 130, 150, 170, 190]) { const u = (Math.abs(x) - 110) / 105; d += `M${x} ${(-126 + 126 * u * u - 0 * u).toFixed(1)} V-8 `; }
        P(g, R(-185, -8, 370, 12, 2), STEEL);
        line(g, d, '#7a2a20', 1.8);
        line(g, 'M-215 0 Q-215 -10 -110 -126 Q0 76 110 -126 Q215 -10 215 0', DK, 4.5);
        if (fz) { arrow(g, -62, -74, -98, -116, BLU, 4); arrow(g, 62, -74, 98, -116, BLU, 4); arrow(g, -132, -100, -132, -34, RED, 4); arrow(g, 132, -100, 132, -34, RED, 4); ten(0, -110); cmp(-150, 125); }
      } else if (k === 'cable') {
        P(g, 'M-14 100 L-8 -150 H8 L14 100 Z', CONC);
        let d = ''; for (let i = 0; i < 5; i++) { const y = -140 + i * 16; d += `M0 ${y} L${-50 - 32 * i} -8 M0 ${y} L${50 + 32 * i} -8 `; }
        line(g, d, '#7a2a20', 2);
        P(g, R(-185, -8, 370, 12, 2), STEEL);
        if (fz) { arrow(g, -110, -40, -40, -112, BLU, 4); arrow(g, 30, -150, 30, -50, RED, 4); ten(-120, -70); cmp(80, -150); }
      } else {                                                      // truss
        P(g, R(-185, -8, 370, 14, 2), STEEL);
        let d = 'M-180 -6 L-150 -74 H150 L180 -6 '; for (let i = 0; i < 6; i++) { const xt = -150 + i * 60; d += `M${xt - 30} -6 L${xt} -74 L${xt + 30} -6 `; }
        line(g, d, '#c8562e', 4.5);
        if (fz) { arrow(g, -110, -92, -40, -92, RED, 4); arrow(g, 110, -92, 40, -92, RED, 4); arrow(g, -30, 24, -110, 24, BLU, 4); arrow(g, 30, 24, 110, 24, BLU, 4); cmp(0, -102); ten(0, 46); }
      }
      if (t) label(g, 0, 128, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "skyframe cx baseY height floors=8" — skyscraper steel skeleton going up, lower floors glazed
    skyframe: ([cx, by, H = 380], o, t, parent) => {
      const g = G(cx, by, H / 380, o, parent), n = +o.floors || 8, fh = 340 / n, xs = [-90, -45, 0, 45, 90];
      for (let i = 0; i < Math.min(3, n); i++) for (let j = 0; j < 4; j++) { P(g, R(xs[j] + 3, -(i + 1) * fh + 3, 39, fh - 6), '#bfe3fa', '#6b8fb0', 1.6); }
      line(g, 'M-150 0 H150', '#7a5a2a', 4);
      let cols = ''; for (const x of xs) cols += `M${x} 0 V${x > 0 ? -340 : -360} `; line(g, cols, '#c8562e', 5);
      let beams = ''; for (let i = 1; i <= n; i++) beams += `M-90 ${-i * fh} H${i === n ? 0 : 90} `; line(g, beams, '#c8562e', 4);
      let br = ''; for (let i = 3; i < n; i++) { const j = i % 2 ? 1 : 2; br += `M${xs[j]} ${-i * fh} L${xs[j + 1]} ${-(i + 1) * fh} M${xs[j + 1]} ${-i * fh} L${xs[j]} ${-(i + 1) * fh} `; } line(g, br, '#c8562e', 2.2);
      P(g, R(-30, -380, 22, 14, 2), '#f3c33b');                       // a beam being lifted in
      line(g, 'M-19 -380 V-410', DK, 2);
      return g;
    },

    // "foundation cx cy width k=pile|raft labels=1" — house on piles or a slab, soil layers to bedrock
    foundation: ([cx, cy, W = 440], o, t, parent) => {
      const k = o.k || 'pile', g = G(cx, cy, W / 440, o, parent);
      const layers = [[-40, 0, '#8a6a45', 'Topsoil'], [0, 45, '#c98e5a', 'Clay'], [45, 95, '#e8d39a', 'Sand and gravel'], [95, 150, '#a6adb5', 'Bedrock']];
      for (const [y0, y1, col] of layers) P(g, R(-220, y0, 440, y1 - y0), col, '#6b5a45', 2);
      let dots = ''; for (let i = 0; i < 26; i++) dots += C(-200 + (i * 53) % 400, 58 + (i * 17) % 30, 2.5) + ' '; line(g, dots, '#9a7a3a', 2);
      line(g, 'M-170 110 l20 14 l-6 18 M120 104 l-14 20 l10 16 M-30 130 l24 6', '#6b737c', 2);
      if (k === 'pile') { for (const x of [-62, -22, 18, 58]) P(g, R(x - 7, -44, 14, 154), CONC, DK, 2.5); P(g, R(-82, -52, 164, 14, 2), CONC); }
      else { P(g, 'M-100 -52 H100 L112 -24 H-112 Z', CONC); for (const x of [-80, -40, 0, 40, 80]) arrow(g, x, -14, x * 1.25, 34, '#5a6068', 2.5, 9); }
      P(g, R(-70, -132, 140, 80), '#f7e3b5'); P(g, 'M-86 -130 L0 -180 L86 -130 Z', '#e04b3a'); P(g, R(-14, -92, 28, 40), '#8a6a45', DK, 2.5); P(g, R(26, -116, 28, 24), '#bfe3fa', DK, 2.5); P(g, R(-56, -116, 28, 24), '#bfe3fa', DK, 2.5);
      if (labelsOn(o)) for (const [y0, y1, , name] of layers) label(g, 214, (y0 + y1) / 2 + 7, name, '#2b2b2b', 19, 'end');
      return g;
    },

    // "crane cx baseY height" — tower crane: lattice mast, jib, counterweight, cab, hook lifting a beam
    crane: ([cx, by, H = 400], o, t, parent) => {
      const g = mk('g', { transform: 'translate(-70 0)' }, G(cx, by, H / 400, o, parent)), Y = '#f3c33b', YI = '#8a6414';
      P(g, R(-44, -16, 88, 16, 2), CONC);
      let m = 'M-12 -16 V-330 M12 -16 V-330 '; for (let y = -16; y > -330; y -= 26) m += `M-12 ${y} L12 ${y - 26} M-12 ${y - 26} H12 `; line(g, m, YI, 3); F(g, 'M-12 -16 V-330 H12 V-16 Z', Y, { opacity: .5 });
      P(g, 'M-12 -340 L0 -392 L12 -340 Z', Y, YI, 3);
      let j = 'M-90 -340 H232 M-90 -324 H220 L232 -340 '; for (let x = -90; x < 220; x += 26) j += `M${x} -324 L${x + 13} -340 L${x + 26} -324 `; line(g, j, YI, 3);
      line(g, 'M0 -392 L232 -340 M0 -392 L-90 -340', DK, 2);
      P(g, R(-96, -336, 34, 40, 3), '#9aa3ad');
      P(g, R(14, -360, 34, 30, 4), Y, YI, 3); P(g, R(32, -354, 12, 14, 2), '#bfe3fa', DK, 2);
      P(g, R(140, -324, 26, 10, 2), '#5a6068');
      line(g, 'M150 -314 V-178 M156 -314 V-178', DK, 2);
      line(g, 'M153 -178 V-168 Q153 -156 145 -158', DK, 3.5);
      line(g, 'M153 -164 L112 -132 M153 -164 L194 -132', DK, 2);
      P(g, R(104, -132, 98, 18, 2), '#c8562e', '#7a2a20');
      line(g, 'M-170 0 H240', '#7a5a2a', 3);
      return g;
    },

    // "excavator cx cy length" — yellow digger: tracks, cab, boom, bucket in a dirt pile
    excavator: ([cx, cy, L = 440], o, t, parent) => {
      const g = G(cx, cy, L / 440, o, parent), Y = '#f3c33b', YI = '#8a6414';
      P(g, 'M110 72 Q180 14 240 72 Z', '#b07a45', '#6b4a28');
      P(g, R(-190, 30, 220, 42, 21), '#3a4450'); for (let x = -165; x <= 5; x += 42) P(g, C(x, 51, 12), '#7d8893', DK, 2);
      P(g, R(-130, 20, 110, 12, 3), '#5a6068');
      P(g, 'M-200 20 V-24 Q-200 -40 -184 -40 H30 V20 Z', Y, YI); line(g, 'M-180 -24 H-100 M-180 -12 H-100 M-180 0 H-100', YI, 2.5);
      P(g, 'M34 -20 L118 -142 L142 -130 L60 2 Z', Y, YI);
      line(g, 'M10 -10 L90 -100', '#5a6068', 7); line(g, 'M10 -10 L60 -66', '#c9d1d9', 4);
      P(g, 'M114 -140 L136 -148 L204 2 L184 10 Z', Y, YI);
      P(g, 'M180 4 Q166 46 200 50 L226 34 L210 -6 Z', '#e0a62a', YI); line(g, 'M200 50 l-4 10 M210 44 l-2 10 M220 38 l0 10', DK, 3);
      P(g, R(-50, -104, 74, 84, 8), Y, YI); P(g, 'M-40 -94 H12 V-58 H-40 Z', '#bfe3fa', DK, 2.5);
      return g;
    },

    // "dam cx cy width" — concrete dam across a valley, reservoir behind, spillway water falling (loop flow)
    dam: ([cx, cy, W = 460], o, t, parent) => {
      const g = G(cx, cy, W / 460, o, parent), st = mk('g', {}, g);
      P(st, 'M-230 -50 L-160 -122 L-90 -68 L0 -112 L90 -64 L160 -124 L230 -50 Z', '#a9bfae', '#5f7a6c');
      P(st, 'M-210 -52 Q0 -84 210 -52 L170 -38 Q0 -20 -170 -38 Z', '#7fb7ea', INK.blue, 2.5);
      P(st, 'M-170 -38 Q0 -20 170 -38 L92 96 Q0 106 -92 96 Z', CONC);
      line(st, 'M-150 -6 Q0 10 150 -6 M-128 30 Q0 46 128 30 M-108 64 Q0 78 108 64', '#aab2ba', 2);
      P(st, 'M-230 130 V-60 Q-200 -70 -172 -40 L-92 96 L-110 130 Z', '#8fb07a', '#4f6a3e'); P(st, 'M230 130 V-60 Q200 -70 172 -40 L92 96 L110 130 Z', '#8fb07a', '#4f6a3e');
      P(st, R(-14, -46, 28, 16, 2), '#9aa3ad', DK, 2);
      F(g, 'M-30 -28 H30 L26 98 H-26 Z', '#bfe3fa'); F(g, 'M-92 98 Q0 108 92 98 L110 130 H-110 Z', '#7fb7ea');
      still(st);
      line(g, 'M-20 -26 Q-20 40 -18 96 M0 -24 V100 M20 -26 Q20 40 18 96', INK.blue, 4);
      line(g, 'M-70 112 q14 -6 28 0 t28 0 M20 120 q14 -6 28 0 t28 0', '#2b6cc4', 3);
      return g;
    },

    // "hydro cx cy width labels=1" — hydroelectric cut-away: reservoir, dam, penstock, turbine, generator (loop flow)
    hydro: ([cx, cy, W = 480], o, t, parent) => {
      const g = G(cx, cy, W / 480, o, parent), st = mk('g', {}, g);
      P(st, 'M-240 -84 H-100 V120 H-240 Z', WATER, INK.blue, 2.5);
      P(st, 'M-112 -112 H-84 L16 120 H-112 Z', CONC);
      P(st, R(-240, 120, 480, 22), SOIL, '#7a5a2a');
      P(st, R(20, 30, 116, 90, 3), '#f2e6cf', '#7a5a2a'); P(st, 'M14 32 L78 4 L142 32 Z', '#c8562e', '#7a2a20');
      P(st, R(48, 44, 46, 30, 4), '#f3c33b', '#8a6414'); line(st, 'M74 48 L64 60 H76 L66 70', '#8a6414', 2.5); line(st, 'M71 74 V90', DK, 4);
      const tb = mk('g', {}, st); P(tb, C(71, 102, 15), '#9aa3ad', DK, 2.5); line(tb, 'M71 87 V117 M56 102 H86 M60 91 L82 113 M82 91 L60 113', DK, 2); spin(tb, 71, 102, 1.6);
      F(st, 'M136 96 H240 V120 H136 Z', WATER);
      pylon(st, 196, 30, 90);
      still(st);
      line(g, 'M-112 -20 L56 98', '#7d8893', 18); line(g, 'M-112 -20 L56 98', '#4f93d6', 8);
      line(g, 'M90 104 H230 M120 112 H230', INK.blue, 3);
      line(g, 'M110 30 Q150 -10 196 -58 M196 -58 Q220 -70 240 -70', '#5a6068', 2.5);
      if (labelsOn(o)) { const L = (x, y, s, a = 'middle') => label(g, x, y, s, '#2b2b2b', 18, a);
        L(-170, -94, 'Reservoir'); L(-60, -122, 'Dam'); L(-14, 48, 'Penstock', 'end'); L(78, 138, 'Turbine'); L(78, -10, 'Generator'); L(200, 90, 'River'); L(196, -80, 'Grid'); }
      return g;
    },

    // "nuclear cx baseY width" — nuclear power station: two cooling towers with steam, reactor dome, turbine hall
    nuclear: ([cx, by, W = 460], o, t, parent) => {
      const g = G(cx, by, W / 460, o, parent);
      F(g, 'M-230 0 H230 V20 H-230 Z', '#bfe3fa');
      for (const x of [-160, -70]) { P(g, `M${x - 48} 0 Q${x - 24} -84 ${x - 36} -170 H${x + 36} Q${x + 24} -84 ${x + 48} 0 Z`, '#e3e7eb', '#5a6068'); line(g, `M${x - 40} -20 H${x + 40}`, '#aab2ba', 2);
        for (const [dx, dy, r] of [[-14, -182, 20], [12, -196, 24], [-4, -222, 28]]) P(g, C(x + dx, dy, r), '#ffffff', '#aab2ba', 2); }
      P(g, R(20, -80, 100, 80), '#e9edf1'); P(g, 'M26 -80 A44 44 0 0 1 114 -80 Z', '#c9d1d9');
      P(g, R(124, -60, 92, 60), '#d5dde5'); for (let x = 134; x < 210; x += 22) P(g, R(x, -46, 14, 18, 2), '#bfe3fa', DK, 2);
      P(g, R(-20, -40, 40, 40), '#d5dde5');
      line(g, 'M-230 0 H230', '#5a6068', 3);
      tree(g, 220, 0, .6); tree(g, -222, 0, .5);
      return g;
    },

    // "geothermal cx cy width labels=1" — geothermal plant: cold water down, hot rock heats it, steam up (loop flow)
    geothermal: ([cx, cy, W = 460], o, t, parent) => {
      const g = G(cx, cy, W / 460, o, parent), st = mk('g', {}, g);
      P(st, R(-230, -50, 460, 50), '#b08a5a', '#7a5a2a', 2); P(st, R(-230, 0, 460, 80), '#a6adb5', '#6b737c', 2); P(st, R(-230, 80, 460, 60), '#f08a4b', '#b8452a', 2);
      line(st, 'M-200 112 q20 -10 40 0 t40 0 M60 120 q20 -10 40 0 t40 0', '#fff3a6', 2.5);
      P(st, R(-60, -108, 120, 58, 3), '#e9edf1'); P(st, R(20, -140, 26, 32), '#d5dde5'); line(st, 'M-30 -90 L-40 -76 H-26 L-36 -62', INK.orange, 3);
      puff(st, 28, -152, .9, '#ffffff');
      still(st);
      line(g, 'M-60 -70 H-120 V112 H110 V-70 H60', '#7d8893', 12);
      line(g, 'M-60 -70 H-120 V112', '#4f93d6', 5); line(g, 'M-120 112 H110', '#f4a531', 5); line(g, 'M110 112 V-70 H60', '#e04b3a', 5);
      line(g, head(-120, 40, -120, 20), INK.blue, 4, { class: 'ink head' }); line(g, head(110, 20, 110, 40), INK.red, 4, { class: 'ink head' });
      if (labelsOn(o)) { label(g, -132, 20, 'cold water in', TXT.blue, 18, 'end'); label(g, 122, 20, 'hot water up', TXT.red, 18); label(g, 0, 136, 'hot rock', '#7a2a10', 18, 'middle'); }
      return g;
    },

    // "tidal cx cy width" — underwater tidal turbine on the seabed, tidal current turning it (loop flow)
    tidal: ([cx, cy, W = 460], o, t, parent) => {
      const g = G(cx, cy, W / 460, o, parent), st = mk('g', {}, g);
      P(st, 'M-230 -110 q23 -8 46 0 t46 0 t46 0 t46 0 t46 0 t46 0 t46 0 t46 0 t46 0 t46 0 V100 H-230 Z', '#9fd0f2', INK.blue, 2.5);
      P(st, 'M-230 96 Q-100 84 0 94 Q120 104 230 92 V130 H-230 Z', '#e8d39a', '#9a7a3a');
      P(st, 'M-12 98 L-6 -8 H6 L12 98 Z', '#c9d1d9'); P(st, R(-46, -26, 96, 30, 15), '#f3c33b', '#8a6414');
      const rot = mk('g', {}, st);
      P(rot, 'M-50 -11 Q-36 -60 -48 -96 Q-62 -60 -50 -11 Z', '#e9edf1'); P(rot, 'M-50 -11 Q-36 40 -48 74 Q-62 40 -50 -11 Z', '#e9edf1'); P(rot, C(-50, -11, 9), '#5a6068');
      P(st, 'M150 50 q14 -12 30 0 q-16 12 -30 0 Z l-8 -7 v14 Z', '#f4a531', '#8a4a10', 2); P(st, 'M-170 30 q12 -10 26 0 q-14 10 -26 0 Z l-7 -6 v12 Z', '#f4a531', '#8a4a10', 2);
      still(st);
      for (const y of [-70, 10, 60]) arrow(g, -220, y, -110, y, INK.blue, 4); for (const y of [-60, 30]) arrow(g, 80, y, 200, y, INK.blue, 4);
      if (t) label(g, 0, 124, t, TXT.blue, 22, 'middle');
      return g;
    },

    // "biomass cx baseY width" — wood and crops burned in a power plant, CO2 taken back up by trees
    biomass: ([cx, by, W = 460], o, t, parent) => {
      const g = G(cx, by, W / 460, o, parent);
      for (const [x, y] of [[-200, -14], [-172, -14], [-144, -14], [-186, -38], [-158, -38], [-172, -62]]) { P(g, C(x, y, 13), '#d9a86a', '#7a5a2a', 2.5); line(g, C(x, y, 6), '#a8783e', 1.5); }
      line(g, 'M-116 0 L-106 -66 M-108 0 L-98 -72 M-100 0 L-88 -68', '#c99a2a', 3); P(g, 'M-110 -66 q-8 -14 4 -18 q10 8 -4 18 M-98 -70 q-6 -14 6 -18 q8 10 -6 18 M-88 -66 q-2 -14 10 -14 q4 10 -10 14', '#f3c33b', '#8a6414', 2);
      arrow(g, -76, -40, -40, -40, INK.orange, 4);
      P(g, R(-30, -100, 140, 100, 3), '#e9edf1'); P(g, R(70, -170, 24, 70), '#c9d1d9');
      P(g, R(-10, -66, 44, 40, 4), '#5a3a2a'); P(g, 'M0 -28 Q-4 -46 8 -58 Q10 -46 16 -42 Q20 -54 26 -60 Q34 -44 24 -28 Z', '#f4a531', '#c0392b', 2);
      line(g, 'M60 -78 L50 -62 H64 L54 -46', INK.orange, 3);
      puff(g, 78, -182, .9, '#e3e7eb');
      line(g, 'M120 -220 Q180 -230 192 -150', '#7d8893', 3); line(g, head(192, -150, 190, -170), '#7d8893', 3, { class: 'ink head' }); if (labelsOn(o)) label(g, 166, -232, 'CO₂', '#5a6068', 20, 'middle');
      tree(g, 196, 0, 1.2);
      line(g, 'M-225 0 H230', '#5a6068', 3);
      return g;
    },

    // "batterybank cx cy width" — grid battery storage: containers charged by wires to a pylon (loop flow)
    batterybank: ([cx, cy, W = 460], o, t, parent) => {
      const g = G(cx, cy, W / 460, o, parent), st = mk('g', {}, g);
      P(st, R(-230, 60, 380, 14), CONC);
      for (const x of [-225, -95]) { P(st, R(x, -40, 120, 100, 3), '#f2f4f6');
        line(st, `M${x + 10} -28 V48 M${x + 18} -28 V48 M${x + 102} -28 V48 M${x + 110} -28 V48`, '#aab2ba', 2);
        P(st, R(x + 32, -6, 50, 28, 4), '#ffffff', DK, 2.5); P(st, R(x + 82, 2, 6, 12), DK, DK, 2);
        for (let i = 0; i < 3; i++) P(st, R(x + 37 + i * 15, -1, 11, 18, 2), FILL.green, INK.green, 1.5); }
      P(st, R(40, -16, 60, 76, 3), '#c9d1d9'); line(st, 'M62 6 L52 22 H66 L56 38', INK.orange, 3);
      pylon(st, 190, 74, 150);
      still(st);
      line(g, 'M-165 -40 V-60 H-35 M-35 -40 V-60 H70 V-16 M70 -60 Q120 -80 158 -50', INK.orange, 3.5);
      if (t) label(g, -40, 100, t, TXT.blue, 22, 'middle');
      return g;
    },

    // "gridmap cx cy width labels=1" — electricity grid: power station, step-up, pylons, substation, homes (loop flow)
    gridmap: ([cx, cy, W = 500], o, t, parent) => {
      const g = G(cx, cy, W / 500, o, parent), st = mk('g', {}, g);
      line(st, 'M-250 30 H250', '#7a5a2a', 3);
      P(st, R(-248, -40, 64, 70, 3), '#d5dde5'); P(st, R(-234, -84, 14, 44), '#c9d1d9'); puff(st, -228, -96, .7);
      P(st, R(-164, -16, 34, 46, 3), '#9aa3ad'); line(st, 'M-160 -16 v-8 M-147 -16 v-8 M-134 -16 v-8', DK, 3);
      pylon(st, -70, 30, 120); pylon(st, 20, 30, 120);
      P(st, R(76, -10, 58, 40), '#eef1f4', '#7d8893', 2); line(st, 'M76 -10 V30 M86 -10 V30 M96 -10 V30 M106 -10 V30 M116 -10 V30 M126 -10 V30', '#aab2ba', 1.5); P(st, R(92, 0, 26, 24, 2), '#9aa3ad', DK, 2);
      house(st, 172, 30, .9); house(st, 230, 30, .9);
      still(st);
      line(g, 'M-200 -10 H-164 M-147 -24 L-70 -94 L20 -94 L105 0 M118 10 H150 L172 -2 M150 10 Q200 0 230 -2', INK.orange, 3);
      if (labelsOn(o)) { const L = (x, s) => label(g, x, 56, s, '#2b2b2b', 17, 'middle'); L(-216, 'Power station'); L(-130, 'Step-up'); L(-25, 'Pylons'); L(105, 'Substation'); L(200, 'Homes'); }
      return g;
    },

    // "transformer cx cy height |text" — pole-top transformer: high-voltage wires in, low-voltage out to homes
    transformer: ([cx, cy, H = 380], o, t, parent) => {
      const g = G(cx, cy, H / 380, o, parent);
      P(g, R(-9, -170, 18, 360, 3), '#a8783e', '#6b4a28');
      P(g, R(-80, -160, 160, 10, 2), '#8a6a45', '#6b4a28');
      for (const x of [-64, 0, 64]) P(g, R(x - 5, -178, 10, 18, 3), '#7fb7ea', '#2b6cc4', 2);
      line(g, 'M-200 -186 Q-130 -170 -64 -178 M-200 -170 Q-120 -150 -60 -160 M64 -178 Q130 -170 200 -186', DK, 2.2);
      P(g, R(14, -100, 62, 92, 10), '#9aa3ad'); line(g, 'M14 -82 H76 M14 -26 H76', '#6b737c', 2); P(g, R(4, -60, 12, 12, 2), '#5a6068', DK, 2);
      for (const x of [30, 60]) P(g, R(x - 4, -116, 8, 16, 2), '#7fb7ea', '#2b6cc4', 2);
      line(g, 'M30 -116 Q20 -150 -64 -176 M60 -116 Q80 -150 64 -176', '#5a6068', 2);
      line(g, 'M76 -40 Q140 -20 200 -40 M76 -20 Q140 0 200 -20', DK, 2.2);
      if (t) label(g, 45, 40, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "watertreat cx cy width labels=1" — drinking-water treatment: intake, settle, filter, chlorine, store, tap (loop flow)
    watertreat: ([cx, cy, W = 520], o, t, parent) => {
      const g = G(cx, cy, W / 520, o, parent), st = mk('g', {}, g);
      P(st, 'M-260 -10 Q-240 -16 -220 -10 V40 H-260 Z', WATER, INK.blue, 2.5); line(st, 'M-226 -24 V40 M-218 -24 V40 M-210 -24 V40', DK, 2.5);
      P(st, R(-176, -40, 74, 80, 3), 'none'); F(st, R(-174, -26, 70, 64), '#cfe3ee'); F(st, R(-174, 24, 70, 14), '#b08a5a');
      P(st, R(-80, -40, 66, 80, 3), 'none'); F(st, R(-78, -26, 62, 18), '#cfe8f8'); F(st, R(-78, -8, 62, 24), '#e8d39a'); F(st, R(-78, 16, 62, 22), '#a6adb5');
      line(st, 'M-74 22 h4 M-60 28 h4 M-40 22 h4 M-28 30 h4', '#6b737c', 3);
      P(st, R(10, -30, 46, 70, 8), '#f2f4f6'); label(st, 33, 12, 'Cl', '#2b6cc4', 22, 'middle'); P(st, R(24, -42, 18, 12, 2), '#9aa3ad', DK, 2);
      P(st, R(80, -100, 80, 54, 10), '#bfe3fa'); line(st, 'M90 -46 L84 40 M150 -46 L156 40 M90 -46 L150 40 M150 -46 L90 40', '#5a6068', 3);
      P(st, 'M196 -6 H230 V8 H214 V20 H200 V8 H196 Z', '#c9d1d9');
      P(st, 'M207 30 Q200 42 207 46 Q214 42 207 30 Z', '#7fb7ea', INK.blue, 2);
      still(st);
      line(g, 'M-220 20 H-176 M-102 20 H-80 M-14 30 H10 M56 30 H70 V-70 H80 M160 -70 H180 V0 H196', '#4f93d6', 5);
      if (labelsOn(o)) { const L = (x, s) => label(g, x, 74, s, '#2b2b2b', 18, 'middle'); L(-232, 'Intake'); L(-139, 'Settle'); L(-47, 'Filter'); L(33, 'Clean'); L(120, 'Store'); L(213, 'Tap'); }
      return g;
    },

    // "pipevalve cx cy width" — water pipes: gate valve with red wheel, tee branch, pressure gauge (loop flow)
    pipevalve: ([cx, cy, W = 440], o, t, parent) => {
      const g = G(cx, cy, W / 440, o, parent), st = mk('g', {}, g), pipe = 'M-220 30 H60 V-90 H220 M60 30 H220';
      line(st, pipe, DK, 36); line(st, pipe, '#b8c0c8', 28);
      for (const [x, y, v] of [[-160, 30], [140, 30], [140, -90], [60, -30, 1]]) P(st, v ? R(x - 22, y - 5, 44, 10, 2) : R(x - 5, y - 22, 10, 44, 2), '#8a96a3', DK, 2.5);
      P(st, 'M-112 30 L-80 4 L-48 30 L-80 56 Z', '#7d8893'); P(st, R(-86, -40, 12, 44), '#9aa3ad', DK, 2.5);
      P(st, E(-80, -48, 40, 10), 'none', '#c0392b', 6); line(st, 'M-120 -48 H-40 M-80 -58 V-38', '#c0392b', 4);
      P(st, R(158, -20, 8, 30), '#9aa3ad', DK, 2); P(st, C(162, -42, 24), '#ffffff'); line(st, 'M162 -42 L176 -54', '#c0392b', 3); line(st, arc(162, -42, 16, 150, 390), '#9aa3ad', 2);
      still(st);
      line(g, 'M-220 30 H-112 M-48 30 H60 V-90 H220 M60 30 H158 M172 30 H220', '#4f93d6', 5);
      return g;
    },

    // "pump cx cy size spin=1" — centrifugal pump: motor, spinning impeller in spiral casing, water in and out
    pump: ([cx, cy, S = 380], o, t, parent) => {
      const g = G(cx, cy, S / 380, o, parent), st = mk('g', {}, g);
      line(st, 'M-200 20 H-90 M10 -60 V-150', DK, 42); line(st, 'M-200 20 H-90 M10 -60 V-150', '#b8c0c8', 34);
      P(st, 'M10 -64 L-30 -50 A76 76 0 1 0 54 -10 L52 -64 Z', '#7fb7ea', '#2b6cc4', 3);
      P(st, C(-30, 20, 54), '#cfe8f8', '#2b6cc4', 2.5);
      P(st, R(46, 4, 30, 32, 3), '#7d8893'); P(st, R(76, -36, 120, 112, 10), '#4f93d6', '#1f4f8f'); for (let y = -24; y < 70; y += 16) line(st, `M86 ${y} H186`, '#1f4f8f', 2);
      const imp = mk('g', {}, st); P(imp, C(-30, 20, 12), '#5a6068');
      let v = ''; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; v += `M${-30 + 12 * Math.cos(a)} ${20 + 12 * Math.sin(a)} Q${-30 + 40 * Math.cos(a + .3)} ${20 + 40 * Math.sin(a + .3)} ${-30 + 46 * Math.cos(a + .9)} ${20 + 46 * Math.sin(a + .9)} `; }
      line(imp, v, '#1f4f8f', 3.5); if (o.spin === '1') spin(imp, -30, 20, 1.2, -1);
      still(st);
      line(g, 'M-200 20 H-90 M10 -66 V-150', '#ffffff', 4);
      arrow(g, -180, -24, -120, -24, INK.blue, 4); arrow(g, 54, -100, 54, -150, INK.blue, 4);
      return g;
    },

    // "wastewater cx cy width labels=1" — sewage works: screen, settling, aeration bubbles, clarifier, clean river (loop flow)
    wastewater: ([cx, cy, W = 520], o, t, parent) => {
      const g = G(cx, cy, W / 520, o, parent), st = mk('g', {}, g);
      house(st, -232, -40, .8);
      P(st, R(-200, -20, 60, 60, 3), 'none'); F(st, R(-198, -6, 56, 44), '#a88a5e'); line(st, 'M-184 -18 V40 M-172 -18 V40 M-160 -18 V40', DK, 2.5);
      P(st, R(-120, -20, 84, 60, 3), 'none'); F(st, R(-118, -6, 80, 44), '#b8a07a'); F(st, 'M-118 26 Q-78 18 -38 26 V38 H-118 Z', '#6b4a28');
      P(st, R(-16, -20, 96, 60, 3), 'none'); F(st, R(-14, -6, 92, 44), '#a6c4b8');
      let b = ''; for (let i = 0; i < 12; i++) b += C(-4 + (i * 23) % 84, 30 - (i * 11) % 32, 3 + i % 3) + ' '; line(st, b, '#ffffff', 2); line(st, 'M-10 38 H74', '#5a6068', 3);
      P(st, 'M100 -20 H180 L160 40 H120 Z', 'none'); F(st, 'M102 -6 H178 L162 38 H118 Z', '#bcd8e6'); F(st, 'M126 28 H154 L150 38 H130 Z', '#8a6a45');
      F(st, 'M196 20 Q230 10 262 20 V48 H196 Z', '#7fb7ea'); P(st, 'M224 34 q10 -8 20 0 q-10 8 -20 0 Z l-6 -5 v10 Z', '#f4a531', '#8a4a10', 1.8);
      still(st);
      line(g, 'M-226 -2 V10 H-200 M-142 10 H-120 M-36 10 H-16 M80 10 H104 M176 10 H200 V20', '#8a6a45', 5);
      line(g, 'M206 28 q10 -6 20 0 t20 0', INK.blue, 2.5);
      if (labelsOn(o)) { const L = (x, s) => label(g, x, 72, s, '#2b2b2b', 18, 'middle'); L(-170, 'Screen'); L(-78, 'Settle'); L(32, 'Air + microbes'); L(140, 'Clarify'); L(230, 'River'); }
      return g;
    },

    // "irrigation cx cy width" — farm irrigation: river, canal with sluice gate, channels between crop rows (loop flow)
    irrigation: ([cx, cy, W = 480], o, t, parent) => {
      const g = G(cx, cy, W / 480, o, parent), st = mk('g', {}, g);
      P(st, 'M-240 -130 H-190 Q-170 0 -196 130 H-240 Z', '#7fb7ea', INK.blue, 2.5);
      P(st, R(-170, -100, 410, 230), '#d9c08a', '#9a7a3a', 2.5);
      let crops = ''; for (let i = 0; i < 5; i++) { const x = -130 + i * 78; for (let y = -50; y < 125; y += 20) for (const dx of [-18, 18]) crops += C(x + dx, y, 7) + ' '; }
      P(st, crops, FILL.green, INK.green, 2);
      P(st, R(-176, -112, 20, 22, 2), '#8a6a45', '#5a3f22', 2.5);
      still(st);
      let ch = 'M-196 -90 H230 '; for (let i = 0; i < 5; i++) ch += `M${-130 + i * 78} -90 V126 `;
      line(g, ch, '#4f93d6', 7); line(g, 'M-222 -120 q8 20 0 40 t0 40 t0 40 t0 40 t0 40 t0 40', '#2b6cc4', 2.5);
      return g;
    },

    // "glasshouse cx baseY width" — farm greenhouse building: glass roof spans, open vent, crop rows inside
    glasshouse: ([cx, by, W = 460], o, t, parent) => {
      const g = G(cx, by, W / 460, o, parent);
      F(g, 'M-225 0 V-110 L-188 -150 L-150 -110 L-112 -150 L-75 -110 L-38 -150 L0 -110 L38 -150 L75 -110 L112 -150 L150 -110 L188 -150 L225 -110 V0 Z', '#e3f3fb', { opacity: .8 });
      for (let x = -200; x <= 200; x += 60) { P(g, R(x - 16, -48, 32, 40, 8), FILL.green, INK.green, 2); line(g, `M${x - 6} -36 h0.1 M${x + 8} -28 h0.1 M${x - 2} -20 h0.1`, '#e04b3a', 8); }
      line(g, 'M-225 0 V-110 L-188 -150 L-150 -110 L-112 -150 L-75 -110 L-38 -150 L0 -110 L38 -150 L75 -110 L112 -150 L150 -110 L188 -150 L225 -110 V0', '#5a7a8e', 3.5);
      let m = 'M-225 -110 H225 '; for (let x = -187.5; x < 225; x += 37.5) m += `M${x} 0 V${Math.round((x + 225) / 37.5) % 2 ? -150 : -110} `; line(g, m, '#7fa3b8', 2);
      P(g, 'M38 -150 L64 -160 L90 -128 L75 -110 Z', '#e3f3fb', '#5a7a8e', 2.5);
      P(g, R(-225, -14, 450, 14), '#c8562e', '#7a2a20', 2.5);
      return g;
    },

    // "trafficlight cx cy height k=red|amber|green" — traffic light, the named lamp lit
    trafficlight: ([cx, cy, H = 380], o, t, parent) => {
      const k = o.k || 'red', g = G(cx, cy, H / 380, o, parent);
      P(g, R(-8, 70, 16, 120), '#5a6068');
      P(g, R(-52, -186, 104, 260, 16), '#3a4450', '#1f262e');
      [['red', '#e04b3a', -126], ['amber', '#f4a531', -56], ['green', '#5fae3a', 14]].forEach(([n, col, y]) => {
        line(g, `M-40 ${y - 24} Q0 ${y - 48} 40 ${y - 24}`, '#1f262e', 5);
        if (n === k) F(g, C(0, y, 44), col, { opacity: .35 });
        P(g, C(0, y, 30), n === k ? col : '#5a5f66', '#1f262e', 3);
        if (n === k) line(g, arc(0, y, 20, 200, 260), '#ffffff', 4);
      });
      return g;
    },

    // "junction cx cy size" — crossroads from above: lanes, zebra crossings, stop lines, cars
    junction: ([cx, cy, S = 420], o, t, parent) => {
      const g = G(cx, cy, S / 420, o, parent);
      F(g, R(-210, -210, 420, 420), '#bfdc9a');
      P(g, 'M-210 -46 H-46 V-210 H46 V-46 H210 V46 H46 V210 H-46 V46 H-210 Z', '#7d8893', '#4a525c');
      line(g, 'M-210 0 H-78 M78 0 H210 M0 -210 V-78 M0 78 V210', '#ffffff', 3, { 'stroke-dasharray': '16 12' });
      let z = ''; for (let i = -38; i <= 38; i += 12) z += `M${i} -74 V-56 M${i} 56 V74 M-74 ${i} H-56 M56 ${i} H74 `; line(g, z, '#ffffff', 6);
      line(g, 'M-50 2 V44 M50 -2 V-44 M2 -50 H44 M-2 50 H-44', '#ffffff', 4);
      topCar(g, -140, 23, 0, '#e04b3a'); topCar(g, 140, -23, 180, '#f3c33b'); topCar(g, -23, -140, 90, '#7fb7ea'); topCar(g, 23, 120, -90, '#5fae3a');
      return g;
    },

    // "roundabout cx cy size" — roundabout from above: island, ring road, four roads, cars going round
    roundabout: ([cx, cy, S = 420], o, t, parent) => {
      const g = G(cx, cy, S / 420, o, parent), ro = 112, hw = 42, off = Math.asin(hw / ro) * 180 / Math.PI, m = Math.sqrt(ro * ro - hw * hw);
      F(g, R(-210, -210, 420, 420), '#bfdc9a');
      F(g, `M-210 -${hw} H210 V${hw} H-210 Z M-${hw} -210 H${hw} V210 H-${hw} Z`, '#7d8893'); F(g, C(0, 0, ro), '#7d8893');
      let curb = ''; for (const a of [0, 90, 180, 270]) curb += arc(0, 0, ro, a + off, a + 90 - off) + ' ';
      curb += `M-210 -${hw} H-${m} M-210 ${hw} H-${m} M210 -${hw} H${m} M210 ${hw} H${m} M-${hw} -210 V-${m} M${hw} -210 V-${m} M-${hw} 210 V${m} M${hw} 210 V${m}`;
      line(g, curb, '#4a525c', 3);
      P(g, C(0, 0, 54), '#8fc06a', INK.green, 3); P(g, C(-14, -10, 9) + ' ' + C(16, 8, 7) + ' ' + C(-4, 20, 6), '#f4a531', '#c97a10', 2);
      line(g, C(0, 0, 84), '#ffffff', 2.5, { 'stroke-dasharray': '14 12' });
      line(g, 'M-210 0 H-128 M128 0 H210 M0 -210 V-128 M0 128 V210', '#ffffff', 3, { 'stroke-dasharray': '16 12' });
      for (const a of [30, 160, 260]) { const r = 98, x = r * Math.cos(a * Math.PI / 180), y = r * Math.sin(a * Math.PI / 180); topCar(g, x, y, a - 90, ['#e04b3a', '#f3c33b', '#7fb7ea'][[30, 160, 260].indexOf(a)]); }
      topCar(g, -170, 22, 0, '#5fae3a');
      line(g, arc(0, 0, 70, 100, 150), '#ffffff', 3); line(g, head(-60.6, -35, -66, -24), '#ffffff', 3, { class: 'ink head' });
      return g;
    },

    // "railsignal cx cy height k=stop|go" — railway semaphore signal by the track: arm level (stop) or raised (go)
    railsignal: ([cx, cy, H = 380], o, t, parent) => {
      const k = o.k || 'stop', g = G(cx, cy, H / 380, o, parent);
      P(g, 'M-110 190 L0 40 H70 L210 190 Z', '#c9b9a0', '#8a7a5a', 2);
      let sl = ''; for (let i = 0; i < 7; i++) { const u = i / 6, y = 46 + 140 * u * u, xl = -80 + (0 - -80) * 0 - 80 * u - 0, w = 60 + 170 * u; sl += `M${35 - w / 2 - 14} ${y.toFixed(0)} H${35 + w / 2 + 14} `; }
      line(g, sl, '#8a6a3e', 5);
      line(g, 'M10 40 L-65 190 M60 40 L135 190', '#5a6068', 5);
      P(g, R(-176, -130, 14, 320, 3), '#e9edf1', '#5a6068');
      line(g, 'M-182 -148 H-156 M-169 -148 V-130', '#5a6068', 3);
      const arm = mk('g', { transform: `translate(-169 -100) rotate(${k === 'go' ? -45 : 0})` }, g);
      P(arm, R(0, -12, 130, 24, 3), '#e04b3a', '#7a2a20'); P(arm, R(100, -12, 10, 24), '#ffffff', '#7a2a20', 2);
      P(arm, R(-30, -14, 30, 28, 4), '#3a4450'); P(arm, C(-15, 0, 9), k === 'go' ? '#5fae3a' : '#e04b3a', '#1f262e', 2);
      P(g, C(-169, -100, 6), '#3a4450', '#1f262e', 2);
      return g;
    },

    // "runway cx cy width" — airport runway from above: threshold stripes, numbers, taxiway, terminal, plane
    runway: ([cx, cy, W = 500], o, t, parent) => {
      const g = G(cx, cy, W / 500, o, parent);
      F(g, R(-250, -140, 500, 280), '#bfdc9a');
      P(g, R(-240, -100, 480, 80), '#6b7480', '#4a525c');
      let s = ''; for (let i = 0; i < 6; i++) { const y = -92 + i * 12.6; s += `M-230 ${y} H-200 M200 ${y} H230 `; } line(g, s, '#ffffff', 6);
      line(g, 'M-160 -60 H160', '#ffffff', 3, { 'stroke-dasharray': '18 14' });
      label(g, -178, -52, '09', '#ffffff', 24, 'middle'); label(g, 178, -52, '27', '#ffffff', 24, 'middle');
      let d = ''; for (let x = -230; x <= 230; x += 30) d += C(x, -104, 2.5) + C(x, -16, 2.5); line(g, d, '#f3c33b', 3);
      F(g, 'M40 -20 H70 V60 H200 V88 H40 Z', '#8a929b'); line(g, 'M55 -20 V74 H200', '#f3c33b', 3);
      P(g, R(-200, 70, 200, 50, 4), '#e9edf1'); for (let x = -186; x < 0; x += 26) P(g, R(x, 78, 16, 10, 2), '#bfe3fa', DK, 1.6);
      const pl = mk('g', { transform: 'translate(140 74) rotate(180)' }, g);
      P(pl, 'M-2 -5 L14 -46 H24 L18 -5 Z M-2 5 L14 46 H24 L18 5 Z M30 -3 L40 -18 H46 L42 -3 Z M30 3 L40 18 H46 L42 3 Z', '#c9d1d9', DK, 2);
      P(pl, R(-40, -7, 92, 14, 7), '#ffffff', DK, 2.2);
      return g;
    },

    // "flightforces cx cy length labels=1" — plane with lift, weight, thrust and drag arrows
    flightforces: ([cx, cy, L = 460], o, t, parent) => {
      const g = G(cx, cy, L / 460, o, parent);
      window.RECIPES.airplane([0, 0, 280], {}, '', g);
      arrow(g, -6, -30, -6, -132, INK.blue, 5, 18); arrow(g, -6, 50, -6, 130, INK.red, 5, 18);
      arrow(g, 150, 2, 226, 2, INK.green, 5, 18); arrow(g, -140, 2, -222, 2, INK.orange, 5, 18);
      if (labelsOn(o)) { label(g, 8, -110, 'Lift', TXT.blue, 26); label(g, 8, 128, 'Weight', TXT.red, 26); label(g, 226, -14, 'Thrust', TXT.green, 26, 'end'); label(g, -222, -14, 'Drag', TXT.orange, 26); }
      return g;
    },

    // "aerocar cx cy length" — car with air streamlines over it and swirling wake behind (loop flow)
    aerocar: ([cx, cy, L = 460], o, t, parent) => {
      const g = G(cx, cy, L / 460, o, parent);
      still(window.RECIPES.vehicle([10, 30, 280], { k: 'car', c: 'blue' }, '', g));
      line(g, 'M-230 -96 C-80 -110 40 -112 230 -100 M-230 -64 C-120 -66 -60 -92 -20 -98 C40 -104 90 -90 130 -50 C160 -30 200 -36 230 -40 M-230 -24 C-170 -24 -150 -30 -126 -36 M-230 30 C-190 30 -160 32 -140 30 M-136 70 C-40 72 80 72 230 70',
        INK.sky, 3);
      line(g, 'M150 -20 c20 -10 30 10 14 18 c-12 6 -18 -8 -6 -10 M170 20 c18 -8 28 10 12 16 c-10 4 -14 -6 -4 -8 M200 -6 c14 -6 22 8 10 12', '#7d8893', 2.5);
      return g;
    },

    // "windtunnel cx cy width" — wind tunnel: fan, test window, wing model on a stand, smoke lines (loop flow)
    windtunnel: ([cx, cy, W = 480], o, t, parent) => {
      const g = G(cx, cy, W / 480, o, parent), st = mk('g', {}, g);
      P(st, 'M-240 -110 L-140 -60 H110 L240 -96 V96 L110 60 H-140 L-240 110 Z', '#e3e7eb', '#5a6068');
      P(st, R(-110, -50, 200, 100, 4), '#e6f4fb', '#5a6068', 2.5);
      P(st, E(226, 0, 10, 80), '#9aa3ad'); line(st, 'M226 -76 Q206 -40 226 0 Q246 40 226 76', DK, 3); P(st, C(226, 0, 10), '#5a6068', DK, 2);
      const w = mk('g', { transform: 'rotate(-8 0 0)' }, st);
      P(w, 'M-56 2 Q-50 -16 -6 -18 Q42 -14 64 2 Q20 8 -40 10 Q-58 8 -56 2 Z', '#f4a531', '#8a4a10');
      line(st, 'M0 8 V50', DK, 4); P(st, R(-16, 50, 32, 10, 2), '#7d8893', DK, 2);
      still(st);
      line(g, 'M-230 -60 C-160 -40 -100 -40 -60 -38 C-20 -50 40 -42 90 -30 L230 -54 M-230 -28 C-160 -22 -100 -20 -62 -16 C-20 -30 40 -18 90 -12 L230 -20 M-230 30 C-160 20 -100 20 -62 18 C-10 26 40 22 90 14 L230 24 M-230 64 C-150 44 -100 42 -60 40 C0 42 40 40 90 34 L230 58',
        '#7d8893', 2.2);
      arrow(g, -232, -84, -190, -70, INK.blue, 3.5, 11);
      return g;
    },

    // "beltdrive cx cy width spin=1" — motor turns a small pulley, belt turns a big one; belt moves on loop flow
    beltdrive: ([cx, cy, W = 440], o, t, parent) => {
      const g = G(cx, cy, W / 440, o, parent), st = mk('g', {}, g), A = [-110, 0, 40], B = [120, 0, 84];
      P(st, R(-230, -44, 90, 88, 8), '#4f93d6', '#1f4f8f'); for (let y = -32; y <= 32; y += 16) line(st, `M-222 ${y} H-150`, '#1f4f8f', 2);
      line(st, 'M-140 0 H-110', DK, 8);
      const pul = ([x, y, r], secs) => { const p = mk('g', {}, st); P(p, C(x, y, r), '#c9d1d9'); P(p, C(x, y, r * .22), '#5a6068', DK, 2);
        let s = ''; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; s += `M${x + r * .22 * Math.cos(a)} ${y + r * .22 * Math.sin(a)} L${x + r * .85 * Math.cos(a)} ${y + r * .85 * Math.sin(a)} M${x - r * .22 * Math.cos(a)} ${y - r * .22 * Math.sin(a)} L${x - r * .85 * Math.cos(a)} ${y - r * .85 * Math.sin(a)} `; }
        line(p, s, '#7d8893', 3); if (o.spin === '1') spin(p, x, y, secs); };
      pul(A, 1); pul(B, 1 * B[2] / A[2]);
      line(st, 'M110 84 L90 130 M130 84 L150 130 M70 130 H170', '#5a6068', 4);
      still(st);
      const d = B[0] - A[0], nx = -(B[2] - A[2]) / d, ny = -Math.sqrt(1 - nx * nx), f = v => v.toFixed(1);
      const p1t = [A[0] + A[2] * nx, A[1] + A[2] * ny], p2t = [B[0] + B[2] * nx, B[1] + B[2] * ny], p1b = [A[0] + A[2] * nx, A[1] - A[2] * ny], p2b = [B[0] + B[2] * nx, B[1] - B[2] * ny];
      const belt = `M${f(p1t[0])} ${f(p1t[1])} L${f(p2t[0])} ${f(p2t[1])} A${B[2]} ${B[2]} 0 1 1 ${f(p2b[0])} ${f(p2b[1])} L${f(p1b[0])} ${f(p1b[1])} A${A[2]} ${A[2]} 0 0 1 ${f(p1t[0])} ${f(p1t[1])}`;
      line(g, belt, '#3a4450', 7);
      return g;
    },

    // "hydraulic cx cy width k=press|lift" — small piston pushed down, big piston lifts (press block or car)
    hydraulic: ([cx, cy, W = 460], o, t, parent) => {
      const k = o.k || 'lift', g = G(cx, cy, W / 460, o, parent);
      F(g, 'M-170 -58 H-130 V60 H30 V-18 H190 V90 H-170 Z', '#f3c33b', { opacity: .75 });
      line(g, 'M-170 -120 V90 H190 V-60 M-130 -120 V60 H30 V-60', DK, 3.5);
      P(g, R(-168, -72, 36, 14, 2), '#9aa3ad'); line(g, 'M-150 -72 V-120', DK, 5); P(g, R(-176, -128, 52, 10, 4), '#5a6068', DK, 2);
      arrow(g, -150, -190, -150, -136, INK.red, 4); if (labelsOn(o)) label(g, -150, -198, 'small push', TXT.red, 19, 'middle');
      P(g, R(32, -32, 156, 16, 2), '#9aa3ad'); line(g, 'M110 -32 V-56', DK, 8); P(g, R(40, -68, 140, 12, 3), '#7d8893');
      if (k === 'press') { line(g, 'M30 -60 V-170 M190 -60 V-170', '#5a6068', 6); P(g, R(20, -184, 180, 16, 3), '#5a6068'); P(g, R(70, -168, 80, 100, 3), '#d9a86a', '#7a5a2a'); }
      else window.RECIPES.vehicle([110, -94, 160], { k: 'car', c: 'red' }, '', g);
      arrow(g, 226, -10, 226, -110, INK.green, 5, 16); if (labelsOn(o)) label(g, 226, -120, 'big lift', TXT.green, 19, 'middle');
      return g;
    },

    // "heatpump cx cy width" — air-source heat pump: outdoor fan unit pipes heat into a warm house (loop flow)
    heatpump: ([cx, cy, W = 480], o, t, parent) => {
      const g = G(cx, cy, W / 480, o, parent), st = mk('g', {}, g);
      P(st, 'M-60 120 V-50 L80 -150 L220 -50 V120 Z', '#fbeee0', '#7a5a2a');
      line(st, 'M-240 120 H240', '#7a5a2a', 3);
      P(st, R(-230, 20, 120, 100, 6), '#e9edf1'); P(st, C(-170, 70, 38), '#c9d1d9', DK, 2.5);
      line(st, 'M-170 32 V108 M-208 70 H-132 M-197 43 L-143 97 M-143 43 L-197 97', '#7d8893', 2); P(st, C(-170, 70, 8), '#5a6068', DK, 2);
      P(st, R(70, -40, 120, 36, 6), '#ffffff');
      line(st, 'M-226 -40 l8 8 m-8 0 l8 -8 M-222 -44 v16 M-230 -36 h16', INK.sky, 2.5);
      still(st);
      line(g, 'M-110 50 H-20 V-24 H70', '#e04b3a', 4);
      line(g, 'M190 -22 H204 V100 H-20 V90 H-110', INK.blue, 4);
      arrow(g, -238, 40, -214, 50, INK.sky, 3.5, 10);
      line(g, 'M90 4 q8 14 0 28 q-8 14 0 28 M130 4 q8 14 0 28 q-8 14 0 28 M170 4 q8 14 0 28 q-8 14 0 28', '#e04b3a', 3);
      if (t) label(g, 80, 150, t, TXT.blue, 22, 'middle');
      return g;
    },

    // "insulation cx cy width labels=1" — wall cut-away: plaster, insulation, air gap, brick; heat kept inside
    insulation: ([cx, cy, W = 440], o, t, parent) => {
      const g = G(cx, cy, W / 440, o, parent);
      F(g, R(-220, -120, 150, 240), '#fde3cf'); F(g, R(116, -120, 104, 240), '#e3f0fb');
      P(g, R(-70, -120, 14, 240), '#f7f4ee', '#9aa3ad', 2);
      P(g, R(-56, -120, 70, 240), '#f6b8c4', '#c0607a', 2);
      let z = ''; for (let y = -112; y < 116; y += 16) z += `M-50 ${y} q14 -8 29 0 t29 0 `; line(g, z, '#e08aa0', 2);
      P(g, R(36, -120, 80, 240), '#d0603a', '#7a2a20', 2.5);
      let mo = ''; for (let y = -96, r = 0; y < 120; y += 24, r++) { mo += `M36 ${y} H116 `; for (let x = 36 + (r % 2 ? 40 : 20); x < 116; x += 40) mo += `M${x} ${y - 24} V${y} `; } line(g, mo, '#f2e6cf', 2);
      arrow(g, -200, -50, -90, -50, INK.red, 5); arrow(g, -100, -20, -190, 10, INK.red, 4); arrow(g, -200, 60, -90, 60, INK.red, 5);
      arrow(g, 120, 70, 168, 70, INK.red, 2, 9);
      line(g, 'M176 -60 l12 12 m-12 0 l12 -12 M182 -64 v20 M172 -54 h20', INK.blue, 2.5);
      if (labelsOn(o)) { const L = (x, y, s, c = '#2b2b2b', a = 'middle') => label(g, x, y, s, c, 18, a);
        L(-63, -132, 'Plaster'); L(-21, 142, 'Insulation'); L(25, -132, 'Gap'); L(76, 142, 'Brick'); L(-145, -100, 'Warm inside', TXT.red); L(168, -100, 'Cold outside', TXT.blue); }
      return g;
    },

    // "deforest cx baseY width" — deforestation: thick forest on the left, stumps and logs on bare ground right
    deforest: ([cx, by, W = 480], o, t, parent) => {
      const g = G(cx, by, W / 480, o, parent);
      P(g, 'M-240 0 H0 V18 H-240 Z', '#7fae5a', INK.green, 2); P(g, 'M0 0 H240 V18 H0 Z', '#b08a5a', '#7a5a2a', 2);
      for (const [x, s] of [[-200, 1.9], [-120, 2.1], [-40, 1.8], [-160, 1.6], [-80, 1.7]]) tree(g, x, 0, s);
      for (const x of [40, 110, 190]) { P(g, `M${x - 18} 0 V-26 H${x + 18} V0 Z`, '#c99a6a', '#6b4a28', 2.5); P(g, E(x, -26, 18, 6), '#f2d9b0', '#6b4a28', 2); line(g, E(x, -26, 8, 3), '#a8783e', 1.5); }
      for (const [y, x0] of [[-8, 70], [-24, 80], [-8, 120]]) { P(g, R(x0, y - 8, 64, 16, 8), '#c99a6a', '#6b4a28', 2.5); P(g, E(x0 + 64, y, 5, 8), '#f2d9b0', '#6b4a28', 2); }
      return g;
    },

    // "oceanplastic cx cy width" — plastic bottles and a bag floating in the sea, turtle and fish nearby
    oceanplastic: ([cx, cy, W = 480], o, t, parent) => {
      const g = G(cx, cy, W / 480, o, parent);
      P(g, 'M-240 -70 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V120 H-240 Z', '#8fc8ee', INK.blue, 2.5);
      P(g, 'M-240 112 Q-80 100 40 112 Q160 122 240 108 V130 H-240 Z', '#e8d39a', '#9a7a3a', 2);
      const bottle = (x, y, a, col) => { const b = mk('g', { transform: `translate(${x} ${y}) rotate(${a})` }, g); P(b, 'M-30 -10 H14 Q22 -10 24 -5 H34 V5 H24 Q22 10 14 10 H-30 Q-36 10 -36 0 Q-36 -10 -30 -10 Z', col, '#2b6cc4', 2.5); P(b, R(34, -6, 8, 12, 2), '#e04b3a', DK, 2); };
      bottle(-150, -72, -10, '#cfe8f8'); bottle(90, -70, 14, '#bfe8c8'); bottle(-40, 108, 80, '#cfe8f8');
      P(g, 'M-6 -14 H56 L62 52 Q26 60 -12 52 Z', '#ffffff', '#9aa3ad', 2.5); line(g, 'M6 -14 Q6 -44 18 -44 Q30 -44 30 -14 M26 -14 Q26 -40 38 -40 Q50 -40 46 -14', '#9aa3ad', 2.5); line(g, 'M8 10 Q20 4 30 14 M18 34 Q34 28 44 38', '#c9d1d9', 2);
      P(g, R(-210, -80, 16, 12, 3), '#f3c33b', '#8a6414', 2); P(g, R(170, -78, 26, 12, 3), '#e04b3a', '#7a2a20', 2);
      P(g, E(-140, 30, 34, 22), '#8fae5a', '#4f6a3e'); line(g, 'M-160 18 L-120 42 M-120 18 L-160 42 M-140 10 V50', '#4f6a3e', 2);
      P(g, C(-96, 26, 12), '#a8c47a', '#4f6a3e', 2.5); P(g, C(-92, 22, 2), DK, DK, 2);
      P(g, 'M-160 10 Q-176 -6 -168 -14 Q-150 -4 -150 10 Z M-130 50 Q-112 64 -104 56 Q-116 44 -126 46 Z M-170 48 Q-190 56 -186 64 Q-168 60 -162 50 Z', '#a8c47a', '#4f6a3e', 2);
      P(g, 'M130 40 q20 -16 40 0 q-20 16 -40 0 Z l-10 -9 v18 Z', '#f4a531', '#8a4a10', 2); P(g, 'M170 70 q14 -12 28 0 q-14 12 -28 0 Z l-8 -7 v14 Z', '#f4a531', '#8a4a10', 2);
      return g;
    },

    // "smog cx baseY width" — air pollution: brown haze over a city, smoking chimneys, cars, dim sun
    smog: ([cx, by, W = 480], o, t, parent) => {
      const g = G(cx, by, W / 480, o, parent);
      P(g, C(150, -200, 26), '#f3c39a', '#c99a6a', 2);
      const bl = [[-236, 60, 150], [-170, 50, 210], [-114, 70, 120], [-38, 56, 240], [24, 40, 170], [70, 60, 130], [138, 46, 200], [190, 46, 140]];
      for (const [x, w, h] of bl) { P(g, R(x, -h, w, h), '#c9d1d9', '#5a6068', 2.5); let win = ''; for (let y = -h + 14; y < -14; y += 22) for (let xx = x + 10; xx < x + w - 12; xx += 16) win += R(xx, y, 8, 10) + ' '; line(g, win, '#8a96a3', 1.5); }
      for (const x of [-200, 100]) { P(g, R(x, -260, 16, 110), '#a6adb5', '#5a6068', 2.5); puff(g, x + 8, -272, 1.1, '#9a8f7a'); }
      F(g, 'M-240 -250 Q-120 -280 0 -250 Q120 -220 240 -256 V-100 Q120 -120 0 -96 Q-120 -76 -240 -104 Z', '#a89b78', { opacity: .55 });
      line(g, 'M-230 -230 Q-120 -250 0 -226 Q120 -204 230 -232 M-230 -150 Q-110 -170 10 -146 Q130 -126 230 -152', '#8a7a5a', 2.5);
      P(g, R(-240, 0, 480, 26), '#7d8893', '#4a525c', 2); line(g, 'M-220 13 H220', '#ffffff', 2, { 'stroke-dasharray': '14 12' });
      still(window.RECIPES.vehicle([-60, -4, 110], { k: 'car', c: 'red' }, '', g)); puff(g, -124, 0, .6, '#9a8f7a');
      still(window.RECIPES.vehicle([120, -4, 110], { k: 'car', c: 'yellow' }, '', g)); puff(g, 56, 0, .6, '#9a8f7a');
      return g;
    },

    // "footprint cx cy height |text" — carbon footprint: foot-shaped print with CO₂ (or the text) inside
    footprint: ([cx, cy, H = 380], o, t, parent) => {
      const g = G(cx, cy, H / 380, o, parent);
      P(g, 'M0 -110 C56 -112 72 -50 62 0 C54 50 64 100 24 136 C-12 166 -60 136 -54 90 C-48 44 -74 2 -64 -50 C-56 -96 -30 -110 0 -110 Z', '#3f7a3a', '#24561c', 3.5);
      for (const [x, y, r] of [[-34, -146, 24], [4, -158, 16], [32, -152, 14], [54, -136, 12], [70, -112, 10]]) P(g, C(x, y, r), '#3f7a3a', '#24561c', 3);
      if (t || labelsOn(o)) label(g, 2, 26, t || 'CO₂', '#ffffff', 46, 'middle');
      return g;
    },

    // "evpetrol cx cy width labels=1" — electric car charging (no fumes) above a petrol car at the pump with exhaust
    evpetrol: ([cx, cy, W = 480], o, t, parent) => {
      const g = G(cx, cy, W / 480, o, parent);
      window.RECIPES.vehicle([-40, -80, 230], { k: 'car', c: 'green' }, '', g);
      P(g, R(140, -150, 40, 88, 6), '#e9edf1'); P(g, R(148, -140, 24, 18, 3), '#bfe3fa', DK, 2); line(g, 'M162 -116 L154 -102 H166 L158 -88', INK.orange, 3);
      line(g, 'M140 -80 Q110 -60 74 -94', DK, 3);
      window.RECIPES.vehicle([-40, 74, 230], { k: 'car', c: 'red' }, '', g);
      P(g, R(140, 4, 44, 88, 6), '#e04b3a', '#7a2a20'); P(g, R(148, 14, 28, 18, 3), '#ffffff', DK, 2);
      line(g, 'M140 50 Q110 70 74 62', DK, 3);
      puff(g, -172, 88, .8, '#9aa3ad');
      if (labelsOn(o)) { label(g, -230, -146, 'Electric', TXT.green, 26); label(g, -230, 6, 'Petrol', TXT.red, 26); }
      return g;
    },
  });
})();
