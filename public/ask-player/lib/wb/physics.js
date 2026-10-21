// Whiteboard library: physics — magnets, circuits, forces, machines, waves, light, heat, atoms, motion, energy.
// Wrapped in a function so its helpers never clash with another category's top-level names.
// `line` = a moving line (the player's `flow` loop marches dashes along it); `still` = an ink line flow leaves alone
// (it carries the `head` class, which the flow loop skips), so only field lines, wires, rays and ropes march.
(() => {
  const DK = '#33363b';
  const G = (cx, cy, s, rot, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${rot || 0}) scale(${s})` }, parent);
  const fl = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...extra }, g);
  const still = (g, d, c, w = 3, extra = {}) => line(g, d, c, w, { ...extra, class: 'ink head' });
  const part = (g, d, fill, ink = DK, w = 3) => { fl(g, d, fill); return still(g, d, ink, w); };
  const C = (x, y, r) => `M${x + r} ${y} A${r} ${r} 0 1 1 ${x - r} ${y} A${r} ${r} 0 1 1 ${x + r} ${y} Z`;
  const R = (x, y, w, h) => `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  const tip = (g, x, y, ax, ay, c, w = 4) => still(g, head(x, y, ax, ay, 8 + w * 1.6), c, w);
  const arrow = (g, x1, y1, x2, y2, c, w = 4, moving = false) => { (moving ? line : still)(g, `M${x1} ${y1} L${x2} ${y2}`, c, w); tip(g, x2, y2, x1, y1, c, w); };
  const lb = (g, x, y, t, c = TXT.blue, s = 22, a = 'middle') => label(g, x, y, t, c, s, a);
  const showLab = o => o.lab !== '0' && o.labels !== '0';   // lab=0 / labels=0 hide the recipe's own words
  const hatch = (g, x1, x2, y, c = '#777', down = 1) => { let d = ''; for (let x = x1; x <= x2; x += 18) d += `M${x} ${y} l-11 ${13 * down} `; still(g, d, c, 2); };
  const P = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const rad = d => d * Math.PI / 180;
  // a sunflower cluster of balls (nuclei): alternating protons and neutrons, outer ones drawn first
  const cluster = (g, x, y, n, r = 10) => {
    for (let i = n - 1; i >= 0; i--) {
      const a = i * 2.39996, d = r * 1.05 * Math.sqrt(i + .3), bx = x + d * Math.cos(a), by = y + d * Math.sin(a);
      part(g, C(bx, by, r), i % 2 ? '#9bb4d8' : '#e04b3a', i % 2 ? '#2f4f7a' : '#7a1f1f', 1.8);
    }
  };
  const flame = (g, x, y, s = 1) => {
    const f = mk('g', { transform: `translate(${x} ${y}) scale(${s})` }, g);
    part(f, 'M0 -80 C22 -52 36 -30 28 -10 C22 6 -22 6 -28 -10 C-36 -30 -16 -46 0 -80 Z', '#f4a531', '#c0392b', 2.5);
    fl(f, 'M0 -46 C10 -32 16 -20 12 -8 C8 2 -8 2 -12 -8 C-16 -20 -6 -30 0 -46 Z', '#ffd84a');
  };
  const burner = (g, x, y) => part(g, `M${x - 16} ${y} L${x + 16} ${y} L${x + 22} ${y + 40} L${x - 22} ${y + 40} Z`, '#8a929c');
  const cellSym = (g, x, y, c = '#333') => {   // long plate (+) left, short plate (−) right, centred on x
    still(g, `M${x - 10} ${y - 30} L${x - 10} ${y + 30}`, c, 4); still(g, `M${x + 10} ${y - 16} L${x + 10} ${y + 16}`, c, 7);
    lb(g, x - 26, y - 22, '+', TXT.red, 26); lb(g, x + 28, y - 18, '−', TXT.blue, 26);
  };

  Object.assign(window.RECIPES, {
    // "magnet cx cy length k=bar|horseshoe lines=0 rot=deg"
    magnet: ([cx, cy, L = 300], o, t, p) => {
      const g = G(cx, cy, L / 300, o.rot, p), field = o.lines !== '0', fc = '#4f6fb0';
      if (o.k === 'horseshoe') {
        const out = 'M-110 -100 L-110 10 A110 110 0 0 0 110 10 L110 -100 L50 -100 L50 10 A50 50 0 0 1 -50 10 L-50 -100 Z';
        fl(g, out, '#b9bec4');
        fl(g, R(-110, -100, 60, 60), '#e04b3a'); fl(g, R(50, -100, 60, 60), '#5d93d6');
        if (field) {
          for (const y of [-88, -70, -52]) { line(g, `M-50 ${y} L50 ${y}`, fc, 2.2); tip(g, 8, y, -2, y, fc, 2.2); }
          for (const [x, h] of [[80, -175], [100, -215]]) {
            line(g, `M-${x} -100 C-${x} ${h} ${x} ${h} ${x} -100`, fc, 2.2);
            const my = -25 + .75 * h; tip(g, 8, my, -2, my, fc, 2.2);
          }
        }
        still(g, out, DK, 3.2); still(g, 'M-110 -40 L-50 -40 M50 -40 L110 -40', DK, 2.5);
        still(g, 'M-92 6 A92 92 0 0 0 -30 84', '#ffffff', 6, { opacity: .6 });
        lb(g, -80, -60, 'N', '#ffffff', 30); lb(g, 80, -60, 'S', '#ffffff', 30);
      } else {
        fl(g, R(-150, -34, 150, 68), '#e04b3a'); fl(g, R(0, -34, 150, 68), '#5d93d6');
        if (field) {
          for (const h of [70, 125, 190]) for (const s of [-1, 1]) {
            const c = 170 + h * .5;
            line(g, `M-150 ${s * 12} C-${c} ${s * h} ${c} ${s * h} 150 ${s * 12}`, fc, 2.2);
            const my = s * (3 + .75 * h); tip(g, 8, my, -2, my, fc, 2.2);
          }
          line(g, 'M-150 0 L-250 0', fc, 2.2); tip(g, -250, 0, -240, 0, fc, 2.2);
          line(g, 'M250 0 L150 0', fc, 2.2); tip(g, 152, 0, 162, 0, fc, 2.2);
        }
        still(g, R(-150, -34, 300, 68), DK, 3.2); still(g, 'M0 -34 L0 34', DK, 2.5);
        still(g, 'M-135 -21 L-25 -21', '#ffffff', 5, { opacity: .5 });
        lb(g, -75, 12, 'N', '#ffffff', 34); lb(g, 75, 12, 'S', '#ffffff', 34);
      }
      return g;
    },

    // "cell cx cy length k=part|symbol rot=deg | 1.5 V"
    cell: ([cx, cy, L = 220], o, t, p) => {
      const g = G(cx, cy, L / 220, o.rot, p);
      if (o.k === 'symbol') {
        still(g, 'M-110 0 L-10 0 M10 0 L110 0', '#333', 3); cellSym(g, 0, 0);
        if (t) lb(g, 0, 62, t);
        return g;
      }
      fl(g, R(-100, -40, 130, 80), '#3d4452'); fl(g, R(30, -40, 40, 80), '#e8a33a'); fl(g, R(70, -15, 18, 30), '#b9bec4');
      still(g, 'M-92 -40 L70 -40 L70 40 L-92 40 Q-100 40 -100 32 L-100 -32 Q-100 -40 -92 -40 Z', '#1d1f24', 3);
      still(g, 'M30 -40 L30 40', '#1d1f24', 2.5); still(g, R(70, -15, 18, 30), '#1d1f24', 2.5);
      still(g, 'M-86 -26 L18 -26', '#ffffff', 5, { opacity: .45 });
      lb(g, 50, 12, '+', '#1d1f24', 34); lb(g, -72, 12, '−', '#ffffff', 34);
      if (t) lb(g, -20, 12, t, '#ffffff', 22);
      return g;
    },

    // "switch cx cy length k=open|closed"
    switch: ([cx, cy, L = 240], o, t, p) => {
      const g = G(cx, cy, L / 240, o.rot, p), closed = o.k === 'closed';
      part(g, R(-90, 12, 180, 22), '#d8b07a', '#7a5a2e');
      line(g, 'M-120 0 L-70 0', '#333', 3); line(g, 'M70 0 L120 0', '#333', 3);
      part(g, C(-70, 0, 9), '#b9bec4'); part(g, C(70, 0, 9), '#b9bec4');
      const [ex, ey] = closed ? [70, -4] : [48, -62];
      still(g, `M-70 0 L${ex} ${ey}`, '#44484f', 6);
      part(g, C(ex, ey, 8), '#e04b3a', '#7a1f1f', 2.5);
      if (t || showLab(o)) lb(g, 0, 70, t || (closed ? 'Closed' : 'Open'), TXT.blue, 22);
      return g;
    },

    // "resistor cx cy length k=part|symbol rot=deg"
    resistor: ([cx, cy, L = 260], o, t, p) => {
      const g = G(cx, cy, L / 260, o.rot, p);
      if (o.k === 'symbol') {
        still(g, 'M-130 0 L-60 0 L-50 -20 L-30 20 L-10 -20 L10 20 L30 -20 L50 20 L60 0 L130 0', '#333', 3.2);
      } else {
        const body = 'M-55 -20 L55 -20 Q70 -20 70 0 Q70 20 55 20 L-55 20 Q-70 20 -70 0 Q-70 -20 -55 -20 Z';
        still(g, 'M-130 0 L-70 0 M70 0 L130 0', '#777', 3.5);
        fl(g, body, '#e8d3a8');
        for (const [x, c] of [[-42, '#8b5a2b'], [-22, '#222'], [-2, '#e04b3a'], [38, '#d4a73a']]) fl(g, R(x, -20, 9, 40), c);
        still(g, body, '#7a6428', 3); still(g, 'M-50 -11 L40 -11', '#ffffff', 4, { opacity: .5 });
      }
      if (t) lb(g, 0, 56, t);
      return g;
    },

    // "circuit cx cy width k=closed|open | Current" — wire loop with cell, lamp, switch; loop flow moves the current
    circuit: ([cx, cy, W = 420], o, t, p) => {
      const g = G(cx, cy, W / 420, o.rot, p), open = o.k === 'open', red = '#c0392b';
      for (const d of ['M-10 125 L-210 125 L-210 -125 L-28 -125', 'M28 -125 L210 -125 L210 -30', 'M210 30 L210 125 L10 125']) line(g, d, '#333', 3.5);
      cellSym(g, 0, 125);
      // lamp on the top wire
      for (let i = 0; i < 5; i++) { const a = rad(-160 + i * 35), c = Math.cos(a), s = Math.sin(a);
        if (!open) still(g, `M${P(c * 38, -125 + s * 38)} L${P(c * 54, -125 + s * 54)}`, INK.yellow, 3.5); }
      part(g, C(0, -125, 26), open ? '#eef2f6' : '#fff1a0', '#7a6a2a', 3);
      still(g, 'M-18 -107 L18 -143 M-18 -143 L18 -107', '#7a6a2a', 2.5);
      // switch on the right wire
      part(g, C(210, 30, 6), '#b9bec4'); part(g, C(210, -30, 6), '#b9bec4');
      const [sx, sy] = open ? [244, -19] : [216, -30];
      still(g, `M210 30 L${sx} ${sy}`, '#44484f', 5); part(g, C(sx, sy, 7), '#e04b3a', '#7a1f1f', 2);
      if (!open) for (const [x, y, ax, ay] of [[-110, 125, -100, 125], [-210, -5, -210, 5], [-100, -125, -110, -125], [110, -125, 100, -125], [210, 85, 210, 75], [105, 125, 115, 125]]) tip(g, x, y, ax, ay, red, 3.5);
      if (t) lb(g, -195, -142, t, TXT.red, 22, 'start');
      return g;
    },

    // "motor cx cy width k=motor|generator" — magnet poles, coil, split ring, brushes, cell (or lamp)
    motor: ([cx, cy, W = 340], o, t, p) => {
      const g = G(cx, cy, W / 340, o.rot, p), gen = o.k === 'generator', cu = '#c9772e';
      part(g, R(-170, -70, 60, 140), '#e04b3a'); part(g, R(110, -70, 60, 140), '#5d93d6');
      lb(g, -140, 12, 'N', '#ffffff', 34); lb(g, 140, 12, 'S', '#ffffff', 34);
      for (const y of [-30, 10]) { still(g, `M-104 ${y} L-88 ${y} M88 ${y} L104 ${y}`, '#4f6fb0', 2); }
      line(g, 'M-12 60 L-12 40 L-80 40 L-80 -50 L80 -50 L80 40 L12 40 L12 60', cu, 5);
      part(g, 'M-3 57 A18 18 0 0 0 -3 93 Z', '#d9963a', '#7a4a14', 2.5); part(g, 'M3 57 A18 18 0 0 1 3 93 Z', '#d9963a', '#7a4a14', 2.5);
      part(g, R(-38, 68, 16, 14), '#555b66'); part(g, R(22, 68, 16, 14), '#555b66');
      line(g, 'M-38 75 L-90 75 L-90 140 L-20 140', '#333', 3); line(g, 'M38 75 L90 75 L90 140 L20 140', '#333', 3);
      if (gen) { part(g, C(0, 140, 20), '#fff1a0', '#7a6a2a', 3); still(g, 'M-12 128 L12 152 M-12 152 L12 128', '#7a6a2a', 2);
        for (const a of [-140, -90, -40]) { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); still(g, `M${P(c * 28, 140 + s * 28)} L${P(c * 40, 140 + s * 40)}`, INK.yellow, 3); } }
      else { still(g, 'M-20 140 L-10 140 M10 140 L20 140', '#333', 3); cellSym(g, 0, 140); }
      line(g, 'M-60 -76 Q0 -104 60 -76', '#2b6cc4', 3); tip(g, 60, -76, 0, -104, '#2b6cc4', 3);
      if (t || showLab(o)) lb(g, 0, -108, t || (gen ? 'Turn it' : 'It turns'), TXT.blue, 22);
      return g;
    },

    // "electromagnet cx cy length" — iron nail wrapped in a coil, cell, paper clips stuck at the tip
    electromagnet: ([cx, cy, L = 360], o, t, p) => {
      const g = G(cx, cy, L / 360, o.rot, p), cu = '#c9772e';
      part(g, 'M-150 -12 L130 -12 L170 0 L130 12 L-150 12 Z', '#9aa0a8', DK, 2.5); part(g, R(-162, -26, 12, 52), '#8a929c', DK, 2.5);
      let coil = 'M-120 110 L-120 -18';
      for (let x = -120; x < 100; x += 14) coil += ` L${x + 7} 18 L${x + 14} -18`;
      line(g, coil + ' L106 -18 L106 110 L20 110', cu, 3.2);
      line(g, 'M-120 110 L-20 110', '#333', 3); cellSym(g, 0, 110);
      const clip = 'M0 0 L0 24 A5 5 0 0 0 10 24 L10 4 A3.5 3.5 0 0 0 3 4 L3 20';
      for (const [x, y, r] of [[176, 6, -10], [172, 34, 12], [180, 62, -6]]) still(g, clip, '#6b7280', 2.5, { transform: `translate(${x} ${y}) rotate(${r})` });
      if (t) lb(g, -20, -40, t);
      return g;
    },

    // "forcebox cx cy size k=all|push|gravity" — box on the ground with labelled force arrows
    forcebox: ([cx, cy, S = 200], o, t, p) => {
      const g = G(cx, cy, S / 200, 0, p), k = o.k || 'all';
      still(g, 'M-220 60 L220 60', '#555', 3); hatch(g, -205, 215, 62);
      part(g, R(-70, -60, 140, 120), '#e0b47a', '#7a5a2e'); fl(g, R(-12, -60, 24, 120), '#c9965a', { opacity: .7 });
      still(g, 'M-12 -60 L-12 60 M12 -60 L12 60', '#7a5a2e', 2);
      if (k !== 'gravity') { const sl = showLab(o);
        arrow(g, -215, 0, -80, 0, INK.red, 5); if (sl) lb(g, -150, -16, 'Push', TXT.red);
        arrow(g, 215, 40, 80, 40, INK.orange, 5); if (sl) lb(g, 150, 26, 'Friction', TXT.orange);
      }
      if (k !== 'push') { const sl = showLab(o);
        arrow(g, 0, 62, 0, 160, INK.blue, 5); if (sl) lb(g, 14, 150, 'Weight', TXT.blue, 22, 'start');
        arrow(g, 0, -62, 0, -170, INK.green, 5); if (sl) lb(g, 14, -150, 'Normal', TXT.green, 22, 'start');
      }
      if (t) lb(g, 0, 8, t, '#5a3a1c', 22);
      return g;
    },

    // "incline cx cy width" — ramp, block, weight / normal / friction arrows, angle θ
    incline: ([cx, cy, W = 380], o, t, p) => {
      const g = G(cx, cy, W / 380, 0, p), a = Math.atan2(200, 380), deg = a * 180 / Math.PI;
      const u = [Math.cos(a), -Math.sin(a)], n = [-Math.sin(a), -Math.cos(a)], y0 = 100 - 210 * 200 / 380, b = [20 + n[0] * 30, y0 + n[1] * 30];
      part(g, 'M-190 100 L190 100 L190 -100 Z', '#cfe0c3', '#4e6658');
      still(g, `M-130 100 A60 60 0 0 0 ${P(-190 + 60 * Math.cos(a), 100 - 60 * Math.sin(a))}`, '#4e6658', 2.5);
      if (showLab(o)) lb(g, -108, 92, 'θ', '#4e6658', 24);
      const blk = mk('g', { transform: `translate(${P(...b)}) rotate(${-deg})` }, g);
      part(blk, R(-40, -28, 80, 56), '#f4a531', '#8a5a14');
      arrow(g, b[0], b[1], b[0], b[1] + 125, INK.blue, 4); if (showLab(o)) lb(g, b[0] + 10, b[1] + 118, 'Weight', TXT.blue, 20, 'start');
      const nx = b[0] + n[0] * 125, ny = b[1] + n[1] * 125;
      arrow(g, b[0] + n[0] * 30, b[1] + n[1] * 30, nx, ny, INK.green, 4); if (showLab(o)) lb(g, nx - 8, ny - 6, 'Normal', TXT.green, 20, 'end');
      const fx = b[0] + u[0] * 150, fy = b[1] + u[1] * 150;
      arrow(g, b[0] + u[0] * 44, b[1] + u[1] * 44, fx, fy, INK.orange, 4); if (showLab(o)) lb(g, fx - 6, fy - 14, 'Friction', TXT.orange, 20, 'end');
      if (t) lb(g, 0, 136, t);
      return g;
    },

    // "pendulum cx topY length" — support, string, bob, swing arc; loop swing swings string and bob
    pendulum: ([cx, cy, L = 260], o, t, p) => {
      const g = G(cx, cy, L / 260, 0, p), a = rad(20), bx = Math.sin(a) * 230, by = Math.cos(a) * 230;
      part(g, R(-80, -14, 160, 14), '#b98a5a', '#5e3b1c'); hatch(g, -70, 80, -14, '#5e3b1c', -1);
      still(g, 'M0 0 L0 230', '#aab2bc', 2, { 'stroke-dasharray': '6 8' });
      still(g, `M${P(-bx, by)} A230 230 0 0 0 ${P(bx, by)}`, '#aab2bc', 2, { 'stroke-dasharray': '6 8' });
      fl(g, C(-bx, by, 24), '#f4a531', { opacity: .3 });
      still(g, `M0 50 A50 50 0 0 0 ${P(Math.sin(a) * 50, Math.cos(a) * 50)}`, '#666', 2); if (showLab(o)) lb(g, 8, 80, 'θ', '#555', 20);
      const arm = mk('g', {}, g); g.swing = arm;                 // loop swing rotates the string + bob about the pivot (0,0)
      still(arm, `M0 0 L${P(bx, by)}`, '#555', 2.5);
      const bob = mk('g', {}, arm); g.anim = bob;
      part(bob, C(bx, by, 24), '#f4a531', '#8a5a14'); still(bob, `M${P(bx - 12, by - 8)} A13 13 0 0 1 ${P(bx - 2, by - 16)}`, '#ffffff', 4, { opacity: .7 });
      part(g, C(0, 0, 5), '#333');
      if (t) lb(g, 0, 290, t);
      return g;
    },

    // "spring cx topY length | 1 kg" — coil spring hanging a mass
    spring: ([cx, cy, L = 260], o, t, p) => {
      const g = G(cx, cy, L / 260, 0, p);
      part(g, R(-70, -14, 140, 14), '#b9bec4'); hatch(g, -60, 70, -14, '#777', -1);
      let d = 'M0 0 L0 18'; const n = 8, h = 140 / n;
      for (let i = 0; i < n; i++) d += ` L28 ${18 + h * (i + .25)} L-28 ${18 + h * (i + .75)}`;
      still(g, d + ' L0 158 L0 182', '#555', 3);
      part(g, 'M-40 182 L40 182 L52 252 L-52 252 Z', '#8a929c');
      still(g, 'M-30 194 L-38 240', '#ffffff', 4, { opacity: .5 });
      lb(g, 0, 226, t || '1 kg', '#ffffff', 22);
      return g;
    },

    // "lever cx cy width" — plank on a fulcrum, load on the short side, effort arrow
    lever: ([cx, cy, W = 400], o, t, p) => {
      const g = G(cx, cy, W / 400, 0, p);
      still(g, 'M-210 70 L210 70', '#555', 3); hatch(g, -200, 210, 72);
      part(g, 'M-70 6 L-110 70 L-30 70 Z', '#8a929c');
      part(g, R(-195, -6, 390, 12), '#d8a868', '#7a5a2e');
      part(g, R(-185, -66, 70, 60), '#7fb7ea', '#1f4f8f'); if (showLab(o)) lb(g, -150, -78, 'Load', TXT.blue);
      arrow(g, 160, -130, 160, -14, INK.red, 5); if (showLab(o)) lb(g, 172, -100, 'Effort', TXT.red, 22, 'start');
      if (showLab(o)) lb(g, -70, 102, 'Fulcrum', '#555');
      if (t) lb(g, 0, -150, t);
      return g;
    },

    // "pulley cx topY size" — fixed pulley, rope, load, pull arrow; loop flow moves the rope
    pulley: ([cx, cy, S = 280], o, t, p) => {
      const g = G(cx, cy, S / 280, 0, p);
      part(g, R(-90, -14, 180, 14), '#b98a5a', '#5e3b1c'); hatch(g, -80, 90, -14, '#5e3b1c', -1);
      still(g, 'M0 0 L0 60', '#6b7280', 6);
      part(g, C(0, 60, 46), '#b9bec4'); still(g, C(0, 60, 37), '#6b7280', 2);
      still(g, 'M0 26 L0 94 M-34 60 L34 60', '#6b7280', 2.5); part(g, C(0, 60, 7), '#33363b');
      line(g, 'M-46 200 L-46 60 A46 46 0 0 1 46 60 L46 196', '#a0743c', 3.5);
      part(g, R(-86, 200, 80, 70), '#7fb7ea', '#1f4f8f'); if (showLab(o)) lb(g, -46, 243, 'Load', '#ffffff');
      arrow(g, 46, 200, 46, 262, INK.red, 5); if (showLab(o)) lb(g, 60, 250, 'Pull', TXT.red, 22, 'start');
      if (t) lb(g, 0, 300, t);
      return g;
    },

    // "wheelaxle cx cy size" — big wheel on a small axle lifting a bucket; loop flow moves the rope
    wheelaxle: ([cx, cy, S = 280], o, t, p) => {
      const g = G(cx, cy, S / 280, 0, p);
      fl(g, C(0, 0, 100), '#b07a42'); fl(g, C(0, 0, 86), '#f6e6c8');
      for (let i = 0; i < 6; i++) { const c = Math.cos(i * Math.PI / 3), s = Math.sin(i * Math.PI / 3); still(g, `M${P(c * 30, s * 30)} L${P(c * 86, s * 86)}`, '#8a5a2e', 4); }
      still(g, C(0, 0, 100), '#5e3b1c', 3); still(g, C(0, 0, 86), '#5e3b1c', 2);
      part(g, C(0, 0, 30), '#8a929c'); part(g, C(0, 0, 6), '#33363b');
      line(g, 'M-30 150 L-30 0', '#a0743c', 3.5);
      part(g, 'M-62 150 L2 150 L-6 205 L-54 205 Z', '#5d93d6', '#1f4f8f'); still(g, 'M-62 150 Q-30 122 2 150', '#555', 2);
      arrow(g, 114, -20, 114, 100, INK.red, 5); if (showLab(o)) lb(g, 126, 70, 'Effort', TXT.red, 22, 'start');
      if (showLab(o)) { lb(g, 60, -108, 'Wheel', '#5e3b1c', 22, 'start'); lb(g, -68, 190, 'Load', TXT.blue, 22, 'end'); }
      return g;
    },

    // "wave cx cy width k=transverse|longitudinal|sound" — labelled waves; loop flow moves them
    wave: ([cx, cy, W = 440], o, t, p) => {
      const g = G(cx, cy, W / 440, o.rot, p), b = INK.blue;
      if (o.k === 'longitudinal') {
        for (let i = 0; i <= 35; i++) { const x0 = -220 + i * 440 / 35, x = x0 - 10 * Math.sin(2 * Math.PI * x0 / 150); still(g, `M${P(x, -45)} L${P(x, 45)}`, b, 2.6); }
        if (showLab(o)) { lb(g, 0, -62, 'Compression', TXT.blue, 22); lb(g, 75, 78, 'Rarefaction', TXT.sky, 22); }
        line(g, 'M-110 108 L100 108', INK.red, 3); tip(g, 100, 108, 90, 108, INK.red, 3); if (showLab(o)) lb(g, 116, 116, 'travels', TXT.red, 20, 'start');
      } else if (o.k === 'sound') {
        part(g, R(-220, -30, 30, 60), '#555b66'); part(g, 'M-190 -30 L-150 -70 L-150 70 L-190 30 Z', '#8a929c');
        for (let i = 0; i < 5; i++) { const r = 40 + i * 48, c = Math.cos(rad(40)) * r, s = Math.sin(rad(40)) * r;
          line(g, `M${P(-150 + c, -s)} A${r} ${r} 0 0 1 ${P(-150 + c, s)}`, b, 3.2, { opacity: 1 - i * .15 }); }
        if (t) lb(g, -185, 104, t, TXT.blue, 22, 'start');
      } else {
        still(g, 'M-230 0 L230 0', '#9aa0a8', 2, { 'stroke-dasharray': '6 8' });
        let d = ''; for (let x = -220; x <= 220; x += 4) d += `${d ? 'L' : 'M'}${P(x, -70 * Math.sin(2 * Math.PI * (x + 220) / 200))} `;
        line(g, d, b, 3.5);
        still(g, 'M-170 -118 L30 -118', '#555', 2); tip(g, -170, -118, -160, -118, '#555', 2); tip(g, 30, -118, 20, -118, '#555', 2);
        if (showLab(o)) lb(g, -70, -128, 'Wavelength', '#555', 20);
        if (showLab(o)) { lb(g, 30, -80, 'Crest', TXT.blue, 20); lb(g, -70, 96, 'Trough', TXT.blue, 20); }
        still(g, 'M130 0 L130 68', INK.red, 2.5); tip(g, 130, 68, 130, 58, INK.red, 2.5); tip(g, 130, 0, 130, 10, INK.red, 2.5);
        if (showLab(o)) lb(g, 130, 96, 'Amplitude', TXT.red, 20);
      }
      return g;
    },

    // "prism cx cy size" — white light splitting into a rainbow; loop flow moves the light
    prism: ([cx, cy, S = 280], o, t, p) => {
      const g = G(cx, cy, S / 280, o.rot, p);
      part(g, 'M0 -120 L-139 120 L139 120 Z', '#cfe9f7', '#4f93d6');
      still(g, 'M-14 -86 L-110 80', '#ffffff', 5, { opacity: .7 });
      line(g, 'M-250 52 L-69 0', '#555', 4); tip(g, -150, 18, -160, 21, '#555', 4);
      if (showLab(o)) lb(g, -250, 84, 'White light', '#555', 20, 'start');
      fl(g, 'M-69 0 L66 -6 L82 22 Z', '#f6f0d8', { opacity: .9 });
      ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'].forEach((c, i) => line(g, `M72 5 L250 ${32 + i * 20}`, c, 4.5));
      if (showLab(o)) { lb(g, 258, 40, 'Red', '#e53935', 20, 'start'); lb(g, 258, 160, 'Violet', '#8e24aa', 20, 'start'); }
      return g;
    },

    // "lens cx cy size k=convex|concave" — lens, axis, rays to a focal point F; loop flow moves the rays
    lens: ([cx, cy, S = 280], o, t, p) => {
      const g = G(cx, cy, S / 280, 0, p), cave = o.k === 'concave', ray = '#e0802a';
      still(g, 'M-250 0 L250 0', '#9aa0a8', 2, { 'stroke-dasharray': '6 8' });
      part(g, cave ? 'M-30 -110 L30 -110 Q8 0 30 110 L-30 110 Q-8 0 -30 -110 Z' : 'M0 -110 Q48 0 0 110 Q-48 0 0 -110 Z', '#cfe9f7', '#4f93d6');
      for (const y of [-55, 0, 55]) {
        if (cave) {
          line(g, `M-240 ${y} L0 ${y} L240 ${(y * 370 / 130).toFixed(1)}`, ray, 3);
          if (y) still(g, `M0 ${y} L-130 0`, ray, 2, { 'stroke-dasharray': '5 7', opacity: .7 });
        } else line(g, `M-240 ${y} L0 ${y} L230 ${(y * (1 - 230 / 130)).toFixed(1)}`, ray, 3);
        tip(g, -120, y, -130, y, ray, 3);
      }
      const fx = cave ? -130 : 130;
      part(g, C(fx, 0, 5), '#c0392b', '#7a1f1f', 2); if (showLab(o)) lb(g, fx, 30, 'F', TXT.red, 24);
      if (t) lb(g, 0, 145, t);
      return g;
    },

    // "mirror cx cy width" — plane mirror, incident and reflected rays, normal, equal angles
    mirror: ([cx, cy, W = 360], o, t, p) => {
      const g = G(cx, cy, W / 360, o.rot, p), ray = '#e0802a';
      part(g, R(-170, 80, 340, 12), '#cfe9f7', '#4f93d6'); hatch(g, -160, 175, 92, '#4f93d6');
      still(g, 'M0 80 L0 -110', '#9aa0a8', 2, { 'stroke-dasharray': '6 8' }); if (showLab(o)) lb(g, 0, -120, 'Normal', '#777', 20);
      line(g, 'M-150 -90 L0 80 L150 -90', ray, 3.5);
      tip(g, -75, -5, -80, -10.7, ray, 3.5); tip(g, 75, -5, 70, 0.7, ray, 3.5);
      const ai = Math.atan2(-170, -150), ar = Math.atan2(-170, 150), r = 55;
      still(g, `M0 25 A${r} ${r} 0 0 0 ${P(r * Math.cos(ai), 80 + r * Math.sin(ai))}`, '#555', 2);
      still(g, `M${P(r * Math.cos(ar), 80 + r * Math.sin(ar))} A${r} ${r} 0 0 0 0 25`, '#555', 2);
      if (showLab(o)) { lb(g, -16, 14, 'i', '#555', 20); lb(g, 16, 14, 'r', '#555', 20); }
      if (showLab(o)) { lb(g, -150, -100, 'Incident ray', TXT.orange, 20, 'start'); lb(g, 150, -100, 'Reflected ray', TXT.orange, 20, 'end'); }
      return g;
    },

    // "thermometer cx cy height level=0.6" — glass tube, red liquid, °C scale
    thermometer: ([cx, cy, H = 300], o, t, p) => {
      const g = G(cx, cy, H / 300, o.rot, p), lv = Math.max(0, Math.min(1, o.level ?? .6)), top = 90 - lv * 210;
      const glass = 'M-15 90 L-15 -128 A15 15 0 0 1 15 -128 L15 90 A29 29 0 1 1 -15 90 Z';
      fl(g, glass, '#eef5fb');
      fl(g, C(0, 115, 21), '#e04b3a'); fl(g, R(-6, top, 12, 104 - top), '#e04b3a');
      still(g, glass, '#5a6b7a', 3);
      let d = ''; for (let i = 0; i <= 10; i++) d += `M15 ${90 - i * 21} L${i % 5 ? 25 : 32} ${90 - i * 21} `;
      still(g, d, '#5a6b7a', 2);
      lb(g, 38, 96, '0', '#555', 16, 'start'); lb(g, 38, -9, '50', '#555', 16, 'start'); lb(g, 38, -114, '100', '#555', 16, 'start');
      still(g, 'M-8 80 L-8 -124', '#ffffff', 3, { opacity: .7 });
      lb(g, 0, -152, t || '°C', '#555', 20);
      return g;
    },

    // "heat cx cy size k=conduction|convection|radiation" — heat moving; loop flow moves the arrows
    heat: ([cx, cy, S = 300], o, t, p) => {
      const g = G(cx, cy, S / 300, 0, p), red = '#c0392b';
      if (o.k === 'convection') {
        part(g, 'M-108 -70 L108 -70 L108 98 L-108 98 Z', '#9ccbf3', '#9ccbf3', .1);
        still(g, 'M-110 -110 L-110 90 Q-110 100 -100 100 L100 100 Q110 100 110 90 L110 -110', '#5a6b7a', 3.2);
        still(g, 'M-108 -70 Q-81 -78 -54 -70 T0 -70 T54 -70 T108 -70', '#2f7fd6', 2.5);
        for (const s of [1, -1]) {
          line(g, `M${10 * s} 70 L${10 * s} -30 Q${10 * s} -45 ${25 * s} -45 L${75 * s} -45 Q${90 * s} -45 ${90 * s} -30 L${90 * s} 60 Q${90 * s} 75 ${75 * s} 75 L${28 * s} 75`, red, 3);
          tip(g, 28 * s, 75, 38 * s, 75, red, 3); tip(g, 10 * s, -10, 10 * s, 0, red, 3); tip(g, 90 * s, 20, 90 * s, 10, red, 3);
        }
        flame(g, 0, 184, 1); burner(g, 0, 186);
      } else if (o.k === 'radiation') {
        part(g, 'M-200 70 L-90 40 L-84 54 L-194 84 Z', '#8b5a2b', '#4a2a16', 2.5); part(g, 'M-200 44 L-90 74 L-96 88 L-206 58 Z', '#a0743c', '#4a2a16', 2.5);
        flame(g, -145, 52, 1.5);
        for (const y of [-60, -10, 40]) {
          let d = ''; for (let x = -60; x <= 100; x += 3) d += `${d ? 'L' : 'M'}${P(x, y - 8 * Math.sin((x + 60) * Math.PI / 20))} `;
          line(g, d, INK.orange, 3); tip(g, 102, y, 94, y, INK.orange, 3);
        }
        part(g, R(120, -80, 70, 150), '#e8907a', '#7a1f1f');
        if (t) lb(g, 20, 110, t, TXT.orange);
      } else {
        const id = 'condG' + clipN++, gr = mk('linearGradient', { id }, mk('defs', {}, g));
        for (const [off, c] of [[0, '#d9483c'], [.35, '#f4a531'], [1, '#b9bec4']]) mk('stop', { offset: off, 'stop-color': c }, gr);
        fl(g, R(-180, -72, 370, 24), `url(#${id})`); still(g, R(-180, -72, 370, 24), '#5a6b7a', 3);
        flame(g, -130, 30, .9); burner(g, -130, 32);
        for (const x of [-120, -10, 100]) { line(g, `M${x} -104 L${x + 70} -104`, red, 3); tip(g, x + 70, -104, x + 60, -104, red, 3); }
        if (t) lb(g, 20, -124, t, TXT.red);
      }
      return g;
    },

    // "bohr cx cy size shells=2,8,1 | Sodium" — nucleus and electron shells; loop flow spins the orbits
    bohr: ([cx, cy, S = 280], o, t, p) => {
      const g = G(cx, cy, S / 280, 0, p), sh = String(o.shells || '2,8,1').split(',').map(Number), n = sh.length;
      sh.forEach((cnt, i) => {
        const r = 52 + (i + 1) * (140 - 52) / n;
        line(g, C(0, 0, r), '#7a8899', 2);
        for (let j = 0; j < cnt; j++) { const a = j * 2 * Math.PI / cnt + i * .5; part(g, C(r * Math.cos(a), r * Math.sin(a), 9), '#4f93d6', '#1f4f8f', 2); }
      });
      cluster(g, 0, 0, 9, 9);
      if (t) lb(g, 0, 178, t);
      return g;
    },

    // "spectrum cx cy width" — electromagnetic spectrum bar, radio to gamma, visible rainbow
    spectrum: ([cx, cy, W = 600], o, t, p) => {
      const g = G(cx, cy, W / 600, 0, p), bw = 600 / 7, id = 'specG' + clipN++;
      const gr = mk('linearGradient', { id }, mk('defs', {}, g));
      ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'].forEach((c, i) => mk('stop', { offset: i / 6, 'stop-color': c }, gr));
      const names = ['Radio', 'Microwave', 'Infrared', 'Visible', 'UV', 'X-ray', 'Gamma'];
      ['#d6c4a8', '#e6b98a', '#e8907a', `url(#${id})`, '#b9a0e0', '#9bb4d8', '#8fa3b8'].forEach((c, i) => fl(g, R(-300 + i * bw, -25, bw, 50), c));
      still(g, R(-300, -25, 600, 50), DK, 3);
      let d = ''; for (let i = 1; i < 7; i++) d += `M${P(-300 + i * bw, -25)} L${P(-300 + i * bw, 25)} `; still(g, d, DK, 2);
      if (showLab(o)) names.forEach((s, i) => lb(g, -300 + (i + .5) * bw, 52, s, '#444', 17));
      const f0 = 1 / 110, rr = 12, k = 2 * Math.PI * f0 * 600 / Math.log(rr);
      let w = ''; for (let x = -300; x <= 300; x += 1.5) w += `${w ? 'L' : 'M'}${P(x, -62 - 22 * Math.sin(k * (rr ** ((x + 300) / 600) - 1)))} `;
      line(g, w, INK.blue, 2.5);
      still(g, 'M-290 84 L290 84', '#555', 2); tip(g, -290, 84, -280, 84, '#555', 2); tip(g, 290, 84, 280, 84, '#555', 2);
      if (showLab(o)) { lb(g, -290, 108, 'longer waves', '#555', 18, 'start'); lb(g, 290, 108, 'more energy', '#555', 18, 'end'); }
      return g;
    },

    // "rocket cx cy size arrows=0 rot=deg" — rocket with flame, thrust and exhaust arrows
    rocket: ([cx, cy, S = 260], o, t, p) => {
      const g = G(cx, cy, S / 260, o.rot, p);
      part(g, 'M-24 90 Q-32 132 0 182 Q32 132 24 90 Z', '#f4a531', '#c0392b', 2.5); fl(g, 'M-12 90 Q-14 120 0 152 Q14 120 12 90 Z', '#ffd84a');
      part(g, 'M-36 20 L-70 70 L-70 100 L-36 72 Z', '#e04b3a'); part(g, 'M36 20 L70 70 L70 100 L36 72 Z', '#e04b3a');
      part(g, 'M-22 72 L22 72 L28 90 L-28 90 Z', '#8a929c');
      part(g, R(-36, -60, 72, 132), '#eef2f6'); fl(g, R(-36, 40, 72, 12), '#e04b3a');
      part(g, 'M-36 -60 Q-30 -110 0 -136 Q30 -110 36 -60 Z', '#e04b3a');
      part(g, C(0, -16, 18), '#7fb7ea'); still(g, 'M-8 -24 A10 10 0 0 1 2 -28', '#ffffff', 3);
      still(g, 'M-24 -50 L-24 30', '#ffffff', 5, { opacity: .7 });
      if (o.arrows !== '0') {
        arrow(g, 110, 70, 110, -90, INK.green, 5); if (showLab(o)) lb(g, 124, -50, 'Thrust', TXT.green, 22, 'start');
        arrow(g, -100, 100, -100, 190, INK.orange, 5); if (showLab(o)) lb(g, -114, 170, 'Hot gas', TXT.orange, 22, 'end');
      }
      if (t) lb(g, 0, 214, t);
      return g;
    },

    // "gravity cx cy width" — planet and moon pulling on each other; loop flow moves the arrows
    gravity: ([cx, cy, W = 420], o, t, p) => {
      const g = G(cx, cy, W / 420, 0, p);
      fl(g, C(-130, 0, 85), '#5d93d6');
      fl(g, 'M-180 -50 C-160 -70 -120 -66 -110 -44 C-100 -20 -130 -6 -150 -14 C-170 -20 -196 -30 -180 -50 Z', '#5fae3a');
      fl(g, 'M-120 18 C-96 8 -70 20 -76 44 C-82 66 -112 70 -122 52 C-130 38 -136 26 -120 18 Z', '#5fae3a');
      still(g, C(-130, 0, 85), '#1f4f8f', 3.2); still(g, 'M-190 -30 A70 70 0 0 1 -150 -68', '#ffffff', 6, { opacity: .55 });
      part(g, C(170, 0, 40), '#c9ccd1', '#6b7280'); for (const [x, y, r] of [[158, -12, 9], [182, 14, 7], [176, -20, 5]]) part(g, C(x, y, r), '#9aa0a8', '#6b7280', 1.8);
      arrow(g, -38, 0, 18, 0, INK.red, 5, true); arrow(g, 124, 0, 66, 0, INK.red, 5, true);
      if (t || showLab(o)) lb(g, 42, -24, t || 'Gravity', TXT.red, 22);
      return g;
    },

    // "gauge cx cy size k=speed|pressure val=0.6" — dial with numbers and needle (speedometer or pressure gauge)
    gauge: ([cx, cy, S = 220], o, t, p) => {
      const g = G(cx, cy, S / 220, 0, p), pr = o.k === 'pressure', v = Math.max(0, Math.min(1, o.val ?? .6)), max = pr ? 10 : 120;
      if (pr) { part(g, R(-14, 104, 28, 46), '#d4a73a', '#7a5a14'); part(g, R(-24, 118, 48, 16), '#d4a73a', '#7a5a14'); }
      part(g, C(0, 0, 108), '#3d4452', '#1d1f24'); part(g, C(0, 0, 94), '#f7f5ee', '#1d1f24', 2);
      const at = (u, r) => { const a = rad(135 + 270 * u); return [r * Math.cos(a), r * Math.sin(a)]; };
      still(g, `M${P(...at(.8, 86))} A86 86 0 0 1 ${P(...at(1, 86))}`, '#e04b3a', 7);
      let d = ''; for (let i = 0; i <= 12; i++) { const u = i / 12; d += `M${P(...at(u, i % 2 ? 82 : 74))} L${P(...at(u, 92))} `; }
      still(g, d, '#333', 2.5);
      for (let i = 0; i <= 12; i += 2) { const [x, y] = at(i / 12, 60); lb(g, x, y + 6, String(Math.round(max * i / 12)), '#333', 16); }
      lb(g, 0, 56, pr ? 'bar' : 'km/h', '#555', 18);
      const [nx, ny] = at(v, 78), [px, py] = at(v + .25, 5);
      part(g, `M${P(px, py)} L${P(nx, ny)} L${P(-px, -py)} Z`, '#e04b3a', '#7a1f1f', 2);
      part(g, C(0, 0, 9), '#33363b');
      if (t) lb(g, 0, pr ? 180 : 140, t);
      return g;
    },

    // "stopwatch cx cy size sec=20" — stopwatch with buttons and a hand
    stopwatch: ([cx, cy, S = 220], o, t, p) => {
      const g = G(cx, cy, S / 220, 0, p), sec = +(o.sec ?? 20);
      part(g, R(-10, -104, 20, 16), '#8a929c'); part(g, R(-22, -118, 44, 14), '#8a929c');
      const side = mk('g', { transform: 'rotate(45)' }, g); part(side, R(-8, -110, 16, 14), '#8a929c');
      part(g, C(0, 0, 100), '#e04b3a', '#7a1f1f'); part(g, C(0, 0, 84), '#f7f5ee', '#7a1f1f', 2);
      let d = ''; for (let i = 0; i < 60; i++) { const a = rad(i * 6 - 90), r0 = i % 5 ? 76 : 68; d += `M${P(r0 * Math.cos(a), r0 * Math.sin(a))} L${P(82 * Math.cos(a), 82 * Math.sin(a))} `; }
      still(g, d, '#444', 1.8);
      for (const [s, x, y] of [['60', 0, -44], ['15', 52, 6], ['30', 0, 58], ['45', -52, 6]]) lb(g, x, y, s, '#333', 18);
      const a = rad(sec * 6 - 90);
      still(g, `M${P(-14 * Math.cos(a), -14 * Math.sin(a))} L${P(70 * Math.cos(a), 70 * Math.sin(a))}`, '#c0392b', 3.5);
      part(g, C(0, 0, 7), '#33363b');
      still(g, 'M-70 -40 A80 80 0 0 1 -40 -70', '#ffffff', 5, { opacity: .6 });
      if (t) lb(g, 0, 136, t);
      return g;
    },

    // "energy cx cy size k=coaster|bars pe=0.7" — ball on a half-pipe (PE ↔ KE), or PE/KE bar chart
    energy: ([cx, cy, S = 300], o, t, p) => {
      const g = G(cx, cy, S / 300, 0, p);
      if (o.k === 'bars') {
        const pe = Math.max(0, Math.min(1, o.pe ?? .7)), H = 180;
        part(g, R(-90, 100 - pe * H, 60, pe * H), '#7fb7ea', '#1f4f8f'); part(g, R(10, 100 - (1 - pe) * H, 60, (1 - pe) * H), '#f4a531', '#8a5a14');
        still(g, 'M-120 -110 L-120 100 L110 100', '#333', 3); tip(g, -120, -110, -120, -100, '#333', 3);
        still(g, 'M-120 -80 L100 -80', '#9aa0a8', 2, { 'stroke-dasharray': '6 8' }); if (showLab(o)) lb(g, 104, -76, 'Total', '#777', 18, 'start');
        if (showLab(o)) { lb(g, -60, 126, 'PE', TXT.blue); lb(g, 40, 126, 'KE', TXT.orange); lb(g, -120, -122, 'Energy', '#555', 20); }
        return g;
      }
      const tr = [[-210, -110], [-170, 120], [170, 120], [210, -110]];
      const bz = u => [0, 1].map(k => (1 - u) ** 3 * tr[0][k] + 3 * (1 - u) ** 2 * u * tr[1][k] + 3 * (1 - u) * u * u * tr[2][k] + u ** 3 * tr[3][k]);
      const track = `M-210 -110 C-170 120 170 120 210 -110`;
      fl(g, track + ' L210 130 L-210 130 Z', '#e8d3a8');
      line(g, track, '#7a5a2e', 3.5); still(g, 'M-210 130 L210 130', '#7a5a2e', 2);
      const [x1, y1] = bz(.06), [x2, y2] = bz(.5);
      fl(g, C(x2, y2 - 17, 15), '#e04b3a', { opacity: .3 }); still(g, `M${P(x2 - 46, y2 - 17)} L${P(x2 - 24, y2 - 17)}`, '#e04b3a', 2.5, { opacity: .6 });
      part(g, C(x1 + 15, y1 - 10, 15), '#e04b3a', '#7a1f1f');
      if (showLab(o)) { lb(g, x1 + 36, y1 - 26, 'Most PE', TXT.blue, 22, 'start'); lb(g, x2, y2 + 34, 'Most KE', TXT.orange, 22); }
      return g;
    },

    // "projectile cx cy width" — ball's curved path, launch arrow, max height, range; loop flow moves the path
    projectile: ([cx, cy, W = 440], o, t, p) => {
      const g = G(cx, cy, W / 440, 0, p), q = (u, a, b, c) => (1 - u) ** 2 * a + 2 * (1 - u) * u * b + u * u * c;
      still(g, 'M-230 100 L230 100', '#555', 3); hatch(g, -220, 230, 102);
      line(g, 'M-200 86 Q0 -246 200 86', '#7a8899', 2.5);
      for (const u of [.25, .5, .75]) fl(g, C(q(u, -200, 0, 200), q(u, 86, -246, 86), 11), '#f4a531', { opacity: .35 });
      still(g, 'M0 -80 L0 98', '#9aa0a8', 2, { 'stroke-dasharray': '6 8' }); if (showLab(o)) lb(g, 10, 20, 'Max height', '#777', 18, 'start');
      part(g, C(-200, 86, 14), '#f4a531', '#8a5a14');
      const L = Math.hypot(200, 332), ux = 200 / L, uy = -332 / L; arrow(g, -200 + ux * 18, 86 + uy * 18, -200 + ux * 110, 86 + uy * 110, INK.red, 4);
      if (showLab(o)) lb(g, -200 + ux * 110 - 10, 86 + uy * 110 - 6, 'Velocity', TXT.red, 20, 'end');
      still(g, 'M-200 128 L200 128', '#555', 2); tip(g, -200, 128, -190, 128, '#555', 2); tip(g, 200, 128, 190, 128, '#555', 2);
      if (showLab(o)) lb(g, 0, 154, 'Range', '#555', 20);
      return g;
    },

    // "friction cx cy width" — block on rough ground, close-up bumps, push and friction arrows
    friction: ([cx, cy, W = 420], o, t, p) => {
      const g = G(cx, cy, W / 420, 0, p);
      let gd = 'M-170 60 L-170 6'; for (let x = -170; x < 170; x += 20) gd += ` L${x + 10} -4 L${x + 20} 6`; gd += ' L170 60 Z';
      let bd = 'M-100 -90 L100 -90 L100 0'; for (let x = 100; x > -100; x -= 20) bd += ` L${x - 10} -10 L${x - 20} 0`; bd += ' Z';
      part(g, gd, '#b9a58a', '#5e4a2e'); part(g, bd, '#e0b47a', '#7a5a2e');
      arrow(g, -250, -46, -108, -46, INK.red, 5); if (showLab(o)) lb(g, -180, -62, 'Push', TXT.red);
      arrow(g, 250, -30, 108, -30, INK.orange, 5); if (showLab(o)) lb(g, 180, -46, 'Friction', TXT.orange);
      if (t || showLab(o)) lb(g, 0, 92, t || 'Rough surfaces grip', '#5e4a2e', 20);
      return g;
    },

    // "density cx cy width" — water tank: wood floats, ball half under, stone sinks
    density: ([cx, cy, W = 340], o, t, p) => {
      const g = G(cx, cy, W / 340, 0, p), water = 'M-168 -40 L168 -40 L168 108 L-168 108 Z';
      fl(g, water, '#9ccbf3');
      part(g, R(-140, -66, 76, 42), '#d8a868', '#7a5a2e');
      part(g, C(20, -40, 30), '#f4a531', '#8a5a14');
      part(g, 'M74 106 C70 84 92 70 112 74 C134 78 142 96 136 106 Z', '#8a929c', '#4a4f57');
      fl(g, water, '#5d93d6', { opacity: .3 });
      still(g, 'M-168 -40 Q-140 -46 -112 -40 T-56 -40 T0 -40 T56 -40 T112 -40 T168 -40', '#2f7fd6', 2.5);
      still(g, 'M-170 -110 L-170 110 L170 110 L170 -110', '#5a6b7a', 3.2);
      if (showLab(o)) { lb(g, -102, -80, 'Wood', '#7a5a2e', 20); lb(g, 20, -82, 'Ball', '#8a5a14', 20); lb(g, 106, 60, 'Stone', '#4a4f57', 20); }
      if (t) lb(g, 0, 140, t);
      return g;
    },

    // "fission cx cy width" — neutron hits a big nucleus; it splits into two, more neutrons, energy
    fission: ([cx, cy, W = 500], o, t, p) => {
      const g = G(cx, cy, W / 500, 0, p), gn = '#8fa3b8';
      part(g, C(-240, 0, 10), gn, '#2f4f7a', 2); arrow(g, -224, 0, -150, 0, '#555', 3, true);
      cluster(g, -90, 0, 19, 10); if (t || showLab(o)) lb(g, -90, 76, t || 'Big nucleus', '#555', 20);
      let s = ''; for (let i = 0; i < 16; i++) { const r = i % 2 ? 14 : 34, a = i * Math.PI / 8; s += `${s ? 'L' : 'M'}${P(30 + r * Math.cos(a), r * Math.sin(a))} `; }
      part(g, s + 'Z', '#ffd84a', '#d27b0c', 2.5); if (showLab(o)) lb(g, 30, 58, 'Energy', TXT.orange, 20);
      arrow(g, 56, -18, 104, -48, '#555', 3, true); arrow(g, 56, 18, 104, 48, '#555', 3, true);
      cluster(g, 140, -78, 9, 10); cluster(g, 140, 78, 9, 10);
      for (const [x, y] of [[236, -26], [250, 8], [232, 40]]) { arrow(g, 66, y / 4, x - 16, y, '#555', 2.5, true); part(g, C(x, y, 10), gn, '#2f4f7a', 2); }
      return g;
    },

    // "cradle cx cy width" — Newton's cradle, five steel balls, the left one pulled back
    cradle: ([cx, cy, W = 400], o, t, p) => {
      const g = G(cx, cy, W / 400, 0, p);
      part(g, R(-210, 110, 420, 20), '#8a929c'); still(g, 'M-190 110 L-190 -120 L190 -120 L190 110', '#555b66', 5);
      const a = rad(35), xs = [-88, -44, 0, 44, 88];
      xs.forEach((x, i) => {
        const [bx, by] = i ? [x, 60] : [x - 180 * Math.sin(a), -120 + 180 * Math.cos(a)];
        still(g, `M${x - 14} -120 L${P(bx, by)} L${x + 14} -120`, '#777', 1.8);
        part(g, C(bx, by, 22), '#b9c0c7', '#4a4f57'); still(g, `M${P(bx - 12, by - 6)} A12 12 0 0 1 ${P(bx - 4, by - 14)}`, '#ffffff', 4, { opacity: .8 });
      });
      if (t) lb(g, 0, 160, t);
      return g;
    },
  });
})();
