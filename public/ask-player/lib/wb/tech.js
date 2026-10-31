// Whiteboard library: tech — computers, networks, energy, transport, buildings, money, everyday objects.
// Wrapped in a function so its helpers never clash with another category's top-level names.
(() => {
  const DK = '#2f3a45';                                   // dark marker outline for machines
  const showLab = o => o.lab !== '0' && o.labels !== '0';   // lab=0 / labels=0 hide the recipe's own words
  const G = (cx, cy, s, o, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${s})` }, parent);
  const P = (g, d, fill, ink = DK, w = 3) => { if (fill) mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable' }, g); return line(g, d, ink, w); };
  const F = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...extra }, g);   // fill only
  const R = (x, y, w, h, r = 0) => r
    ? `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
    : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  const E = (x, y, rx, ry = rx) => `M${x + rx} ${y} A${rx} ${ry} 0 1 0 ${x - rx} ${y} A${rx} ${ry} 0 1 0 ${x + rx} ${y} Z`;
  const C = (x, y, r) => E(x, y, r);
  const arc = (x, y, r, a0, a1) => { const p = a => `${x + r * Math.cos(a * Math.PI / 180)} ${y + r * Math.sin(a * Math.PI / 180)}`; return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`; };
  const waves = (g, x, y, a0, a1, rs, col = INK.sky, w = 3) => rs.forEach(r => line(g, arc(x, y, r, a0, a1), col, w));
  const spin = (el, x, y, secs, dir = 1) => mk('animateTransform', { attributeName: 'transform', type: 'rotate', from: `0 ${x} ${y}`, to: `${360 * dir} ${x} ${y}`, dur: `${secs}s`, repeatCount: 'indefinite' }, el);
  const gearD = (x, y, r, n) => { let d = ''; for (let i = 0; i < n * 4; i++) { const a = (i / (n * 4)) * 2 * Math.PI, rr = i % 4 < 2 ? r + 7 : r - 7; d += `${i ? 'L' : 'M'}${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)} `; } return d + 'Z'; };
  const wheel = (g, x, y, r) => { P(g, C(x, y, r), '#3a4450', DK, 3); P(g, C(x, y, r * .42), '#c9d1d9', DK, 2.5); };
  const codeLines = (g, x, y, w, rows = 5) => { const cols = ['#9fe0a0', '#ffd84a', '#7fd0ff', '#f7a094']; for (let i = 0; i < rows; i++) { const ind = [0, 14, 14, 28, 0, 14][i % 6], len = [.55, .7, .45, .6, .35, .5][i % 6] * w; line(g, `M${x + ind} ${y + i * 16} H${x + ind + len}`, cols[i % 4], 4); } };
  const pageLines = (g, x, y, w, rows, col = '#9aa3ad', gap = 14) => { let d = ''; for (let i = 0; i < rows; i++) d += `M${x} ${y + i * gap} H${x + w * (i % 3 === 2 ? .7 : 1)} `; line(g, d, col, 2); };
  const smoke = (g, x, y) => { for (const [dx, dy, r] of [[0, 0, 12], [10, -22, 16], [26, -48, 20]]) P(g, C(x + dx, y + dy, r), '#e3e7eb', '#9aa3ad', 2); };

  // car side view, nose to the right, wheels on y≈22 (local units, 250 long)
  const carBody = (g, col = '#e04b3a') => {
    P(g, 'M-120 20 L-120 -8 Q-118 -24 -100 -26 L-60 -30 L-30 -62 Q-24 -68 -12 -68 L50 -68 Q62 -68 70 -60 L98 -30 L116 -24 Q126 -20 126 -6 L126 20 Z', col);
    P(g, 'M-22 -32 L-2 -58 L22 -58 L22 -32 Z', '#bfe3fa', DK, 2.5);
    P(g, 'M32 -32 L32 -58 L54 -58 Q60 -58 64 -52 L82 -32 Z', '#bfe3fa', DK, 2.5);
    line(g, 'M27 -30 V16 M10 -14 H22', DK, 2.5);
    P(g, R(108, -18, 14, 9, 3), '#ffe58a', DK, 2);
    wheel(g, -68, 20, 22); wheel(g, 76, 20, 22);
  };

  Object.assign(window.RECIPES, {
    // "laptop cx cy width rot=deg |text" — open laptop; text shows on its screen, else code lines
    laptop: ([cx, cy, S = 260], o, t, parent) => {
      const g = mk('g', { transform: 'translate(0 39)' }, G(cx, cy, S / 260, o, parent));
      P(g, R(-95, -120, 190, 130, 10), '#4a5563');
      P(g, R(-83, -108, 166, 104, 4), t ? '#dff1ff' : '#1f3b4d', DK, 2.5);
      if (!t) codeLines(g, -70, -88, 140);
      P(g, 'M-112 12 L112 12 L128 34 Q128 42 120 42 L-120 42 Q-128 42 -128 34 Z', '#c9d1d9');
      line(g, 'M-90 22 H90', '#7d8893', 2); line(g, 'M-24 33 H24', '#7d8893', 3);
      if (t) label(g, 0, -48, t, TXT.blue, 28, 'middle');
      return g;
    },

    // "computer cx cy width |text" — desktop monitor, keyboard and tower; code on screen unless text
    computer: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S / 300, o, parent);
      P(g, R(-150, -120, 210, 140, 10), '#4a5563');
      P(g, R(-138, -108, 186, 114, 4), t ? '#dff1ff' : '#1f3b4d', DK, 2.5);
      if (!t) codeLines(g, -122, -86, 150, 6); else label(g, -45, -42, t, TXT.blue, 28, 'middle');
      P(g, 'M-58 20 L-32 20 L-26 52 L-64 52 Z', '#7d8893');
      P(g, R(-100, 52, 110, 12, 5), '#c9d1d9');
      P(g, R(82, -100, 64, 164, 8), '#c9d1d9');
      line(g, 'M94 -80 H134 M94 -64 H134', '#5a6068', 3);
      P(g, C(114, 34, 8), '#7fd07f', DK, 2);
      P(g, R(-130, 76, 200, 26, 6), '#e9edf1', DK, 2.5);
      line(g, 'M-118 85 H58 M-118 94 H58', '#9aa3ad', 2, { 'stroke-dasharray': '8 5' });
      return g;
    },

    // "smartphone cx cy height |text" — phone with app icons, or text on the screen
    smartphone: ([cx, cy, S = 220], o, t, parent) => {
      const g = G(cx, cy, S / 220, o, parent);
      P(g, R(-58, -110, 116, 220, 18), '#3a4450');
      P(g, R(-48, -92, 96, 176, 6), '#dff1ff', DK, 2);
      line(g, 'M-14 -101 H14', '#9aa3ad', 3); P(g, C(0, 98, 6), '#5a6675', '#9aa3ad', 2);
      if (t) label(g, 0, 4, t, TXT.blue, 24, 'middle');
      else { const cols = ['#f4a531', '#5fae3a', '#e04b3a', '#7fb7ea', '#ffd84a', '#b48ad8'];
        for (let i = 0; i < 9; i++) P(g, R(-38 + (i % 3) * 28, -78 + Math.floor(i / 3) * 30, 20, 20, 5), cols[i % 6], DK, 1.8); }
      return g;
    },

    // "server cx cy height" — server rack with blinking-style lights
    server: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S / 260, o, parent);
      P(g, R(-75, -130, 150, 260, 8), '#4a5563');
      for (let i = 0; i < 5; i++) {
        const y = -116 + i * 48;
        P(g, R(-62, y, 124, 38, 4), '#7d8893', DK, 2.5);
        line(g, `M-10 ${y + 13} H48 M-10 ${y + 25} H48`, '#3a4450', 2.5);
        P(g, C(-44, y + 19, 5), i % 2 ? '#ffd84a' : '#7fd07f', DK, 1.6); P(g, C(-28, y + 19, 5), '#7fd07f', DK, 1.6);
      }
      return g;
    },

    // "router cx cy width |text" — wifi router, two antennas, signal waves above
    router: ([cx, cy, S = 220], o, t, parent) => {
      const g = G(cx, cy, S / 220, o, parent);
      line(g, 'M-62 0 L-74 -70', DK, 6); line(g, 'M62 0 L74 -70', DK, 6);
      P(g, R(-95, -6, 190, 56, 12), '#e9edf1');
      for (let i = 0; i < 4; i++) P(g, C(-60 + i * 22, 22, 5), '#7fd07f', DK, 1.6);
      line(g, 'M30 22 H72', '#9aa3ad', 3);
      waves(g, 0, -20, 225, 315, [26, 48, 70], INK.blue, 4);
      P(g, C(0, -20, 6), INK.blue, INK.blue, 2);
      if (t) label(g, 0, 90, t, TXT.blue, 26, 'middle');
      return g;
    },

    // "netcloud cx cy width |text" — cloud-computing cloud with upload and download arrows
    netcloud: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S / 260, o, parent);
      P(g, 'M-90 55 C-135 55 -135 -5 -92 -10 C-92 -60 -30 -78 -2 -42 C18 -82 92 -70 88 -14 C135 -12 132 55 92 55 Z', '#dff1ff', INK.blue, 3.4);
      for (const [x, up] of [[-26, 1], [26, 0]]) {
        const y0 = up ? 34 : -26, y1 = up ? -26 : 34;
        line(g, `M${x} ${y0} L${x} ${y1}`, up ? INK.orange : INK.green, 5); line(g, head(x, y1, x, y0, 14), up ? INK.orange : INK.green, 5, { class: 'ink head' });
      }
      if (t) label(g, 0, 95, t, TXT.blue, 26, 'middle');
      return g;
    },

    // "envelope cx cy width |3" — a letter; text adds a numbered tag, so it doubles as a data packet
    envelope: ([cx, cy, S = 200], o, t, parent) => {
      const g = G(cx, cy, S / 200, o, parent);
      P(g, R(-100, -62, 200, 124, 6), '#fff4d6', '#8a6414');
      line(g, 'M-100 -60 L0 12 L100 -60', '#8a6414', 3); line(g, 'M-100 62 L-28 -8 M100 62 L28 -8', '#8a6414', 2.5);
      if (t) { P(g, C(78, -58, 26), '#ffd84a', '#8a6414', 3); label(g, 78, -49, t, '#7a4a00', 26, 'middle'); }
      return g;
    },

    // "cable x1 y1 x2 y2 k=wire|fibre" — sagging cable with plugs; fibre glows (loop flow)
    cable: ([x1, y1, x2, y2], o, t, parent) => {
      const g = mk('g', {}, parent), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + Math.hypot(x2 - x1, y2 - y1) * .12, d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
      if (o.k === 'fibre') { line(g, d, '#f3c33b', 26, { opacity: .3 }); line(g, d, '#a85a08', 13); line(g, d, '#f4a531', 8); line(g, d, '#fff3a6', 3); }
      else { line(g, d, DK, 16); line(g, d, '#5a6470', 10); line(g, d, '#9aa5b0', 3); }
      for (const [x, y, ax, ay] of [[x1, y1, mx, my], [x2, y2, mx, my]]) {
        const a = Math.atan2(y - ay, x - ax) * 180 / Math.PI, p = mk('g', { transform: `translate(${x} ${y}) rotate(${a})` }, g);
        P(p, 'M-30 -8 L-12 -12 V12 L-30 8 Z', '#5a6470', DK, 2.5);                       // strain relief
        P(p, R(-14, -18, 34, 36, 6), '#c9d1d9', DK, 3); line(p, 'M-4 -12 V12 M4 -12 V12', '#9aa3ad', 2);
        P(p, R(20, -11, 16, 7, 2), '#e3c35a', '#8a6414', 2); P(p, R(20, 4, 16, 7, 2), '#e3c35a', '#8a6414', 2);
      }
      if (t) label(g, mx, my + 30, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "chip cx cy size |CPU" — processor chip with pins; text on its face (default CPU)
    chip: ([cx, cy, S = 200], o, t, parent) => {
      const g = G(cx, cy, S / 200, o, parent);
      let pins = ''; for (let i = 0; i < 6; i++) { const k = -50 + i * 20; pins += `M${k} -72 V-92 M${k} 72 V92 M-72 ${k} H-92 M72 ${k} H92 `; }
      line(g, pins, '#8a96a3', 5);
      P(g, R(-72, -72, 144, 144, 10), '#3d4a57');
      P(g, R(-40, -40, 80, 80, 6), '#d9b24a', '#7a5a14', 2.5);
      if (t || showLab(o)) label(g, 0, 10, t || 'CPU', '#4a3300', 26, 'middle');
      return g;
    },

    // "ram cx cy width" — memory stick: green board, black chips, gold contacts
    ram: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S / 260, o, parent);
      P(g, 'M-125 -40 H125 V40 H10 V30 H-4 V40 H-125 Z', '#3f9a5c', '#1d4f2c');
      for (let i = 0; i < 4; i++) P(g, R(-112 + i * 58, -28, 44, 34, 3), '#262c33', '#111', 2);
      let d = ''; for (let x = -118; x < 120; x += 9) if (x < -8 || x > 14) d += `M${x} 28 V38 `;
      line(g, d, '#c9a43a', 4);
      return g;
    },

    // "harddrive cx cy height" — open hard drive: spinning platter and read arm
    harddrive: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      P(g, R(-90, -120, 180, 240, 10), '#c9d1d9');
      P(g, C(0, -20, 74), '#e3e9f0', '#5a6068', 3);
      line(g, arc(0, -20, 52, 200, 300), '#ffffff', 5, { opacity: .9 }); line(g, arc(0, -20, 30, 20, 120), '#9aa3ad', 2);
      P(g, C(0, -20, 12), '#7d8893', DK, 2.5);
      line(g, 'M58 90 L8 -6', DK, 8); line(g, 'M58 90 L8 -6', '#9aa3ad', 3);
      P(g, C(58, 90, 14), '#7d8893', DK, 2.5);
      for (const [x, y] of [[-76, -106], [76, -106], [-76, 106], [76, 106]]) P(g, C(x, y, 5), '#9aa3ad', DK, 1.6);
      return g;
    },

    // "keyboard cx cy width" — computer keyboard with keys and space bar
    keyboard: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S / 300, o, parent);
      P(g, R(-150, -55, 300, 110, 12), '#c9d1d9');
      let keys = ''; for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) keys += R(-134 + c * 24.5 + r * 6, -42 + r * 24, 19, 18, 3) + ' ';
      keys += R(-70, 30, 140, 16, 4);
      P(g, keys, '#f7f9fb', '#5a6068', 2);
      return g;
    },

    // "robot cx cy height |text" — friendly robot waving, antenna, screen belly
    robot: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S / 260, o, parent);
      line(g, 'M0 -110 V-128', DK, 4); P(g, C(0, -134, 8), '#e04b3a', DK, 2.5);
      P(g, R(-52, -110, 104, 76, 18), '#9ccbf3');
      P(g, C(-22, -76, 12), '#ffffff', DK, 2.5); P(g, C(22, -76, 12), '#ffffff', DK, 2.5);
      P(g, C(-20, -74, 5), DK, DK, 1.5); P(g, C(24, -74, 5), DK, DK, 1.5);
      line(g, 'M-16 -52 Q0 -40 16 -52', DK, 3);
      P(g, 'M-58 -20 L-96 -64', null, DK, 10); line(g, 'M-58 -20 L-96 -64', '#7fb7ea', 5);
      P(g, C(-100, -70, 10), '#7fb7ea');
      line(g, 'M58 -20 L84 30', DK, 10); line(g, 'M58 -20 L84 30', '#7fb7ea', 5); P(g, C(86, 36, 10), '#7fb7ea');
      P(g, R(-62, -30, 124, 96, 16), '#7fb7ea');
      P(g, R(-38, -14, 76, 40, 6), '#dff1ff', DK, 2.5);
      if (t) label(g, 0, 12, t, TXT.blue, 20, 'middle'); else line(g, 'M-26 6 L-12 6 L-6 -6 L2 16 L8 6 L26 6', '#2b9a4a', 3);
      P(g, C(-24, 46, 6), '#ffd84a', DK, 2); P(g, C(0, 46, 6), '#e04b3a', DK, 2); P(g, C(24, 46, 6), '#5fae3a', DK, 2);
      P(g, R(-44, 66, 28, 46, 6), '#9ccbf3'); P(g, R(16, 66, 28, 46, 6), '#9ccbf3');
      return g;
    },

    // "neuralnet cx cy width height layers=3,4,4,2 |text" — AI network: layers of nodes and links (loop flow)
    neuralnet: ([cx, cy, W = 380, H = 240], o, t, parent) => {
      const g = mk('g', {}, parent), L = String(o.layers || '3,4,4,2').split(',').map(Number);
      const pos = L.map((n, i) => Array.from({ length: n }, (_, j) => [cx - W / 2 + W * i / (L.length - 1), cy - H / 2 + H * (j + .5) / n]));
      const r = Math.min(20, H / (2.6 * Math.max(...L)));
      for (let i = 0; i < pos.length - 1; i++) { let d = ''; for (const a of pos[i]) for (const b of pos[i + 1]) d += `M${a[0]} ${a[1]} L${b[0]} ${b[1]} `; line(g, d, '#9aa3ad', 1.8); }
      pos.forEach((col, i) => col.forEach(([x, y]) => P(g, C(x, y, r), i === 0 ? '#7fb7ea' : i === pos.length - 1 ? '#7fd07f' : '#f4a531', DK, 2.5)));
      if (t) label(g, cx, cy + H / 2 + 34, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "padlock cx cy height k=locked|open" — padlock for security, shut or open
    padlock: ([cx, cy, S = 200], o, t, parent) => {
      const g = G(cx, cy, S / 200, o, parent), open = o.k === 'open';
      const sh = open ? 'M-36 -6 V-58 A36 36 0 0 1 36 -58 V-40' : 'M-36 6 V-30 A36 36 0 0 1 36 -30 V6';
      const sg = mk('g', { transform: open ? 'translate(0 -18)' : '' }, g);
      line(sg, sh, DK, 18); line(sg, sh, '#c9d1d9', 10);
      P(g, R(-62, -8, 124, 104, 14), '#f3c33b', '#8a6414');
      P(g, 'M0 22 A12 12 0 0 1 7 44 L10 70 L-10 70 L-7 44 A12 12 0 0 1 0 22 Z', '#4a3300', '#4a3300', 2);
      return g;
    },

    // "key cx cy length rot=deg" — a door key, gold
    key: ([cx, cy, S = 220], o, t, parent) => {
      const g = G(cx, cy, S / 220, o, parent);
      P(g, 'M-50 -9 H105 V9 H95 V28 H82 V9 H70 V22 H58 V9 H-50 Z', '#f3c33b', '#8a6414');
      P(g, C(-76, 0, 34), '#f3c33b', '#8a6414'); P(g, C(-84, 0, 12), '#fdfdfb', '#8a6414', 2.5);
      return g;
    },

    // "database cx cy height |text" — database cylinder with stacked bands
    database: ([cx, cy, S = 220], o, t, parent) => {
      const g = G(cx, cy, S / 220, o, parent);
      P(g, 'M-80 -80 V80 A80 22 0 0 0 80 80 V-80', '#7fb7ea', '#1f4f8f');
      line(g, 'M-80 -26 A80 22 0 0 0 80 -26 M-80 28 A80 22 0 0 0 80 28', '#1f4f8f', 2.5);
      P(g, E(0, -80, 80, 22), '#bfe3fa', '#1f4f8f');
      if (t) label(g, 0, 128, t, TXT.blue, 26, 'middle');
      return g;
    },

    // "satdish cx cy height" — satellite dish on a stand catching signal waves
    satdish: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      // the dish faces up-right (local: opens toward -y); its hub sits on a post
      const d = mk('g', { transform: 'translate(-6 -16) rotate(38)' }, g);
      P(d, 'M-84 0 Q-70 60 0 64 Q70 60 84 0 Z', '#c9d1d9');                                // back of the bowl
      P(d, R(-12, 58, 24, 16, 4), '#7d8893', DK, 2.5);                                     // hub
      P(d, E(0, 0, 84, 26), '#f4f6f8');                                                    // dish face
      line(d, `${E(0, 4, 56, 15)} ${E(0, 8, 26, 7)}`, '#b6bec7', 2);                       // parabolic rings
      line(d, 'M-62 -6 L0 -84 M62 -6 L0 -84 M0 20 L0 -84', '#5a6068', 2.6);                // feed arms
      P(d, R(-9, -96, 18, 16, 3), '#e04b3a', DK, 2.5);                                     // feed horn
      // feed horn in board units: rotate (0,-88) by 38°, then translate
      const fx = -6 + 88 * Math.sin(38 * Math.PI / 180), fy = -16 - 88 * Math.cos(38 * Math.PI / 180);
      waves(g, fx, fy, -80, -10, [26, 46, 66], INK.orange, 3.5);
      P(g, R(-53, 40, 14, 56, 3), '#9aa3ad');                                              // post from the hub
      P(g, 'M-72 112 L-58 92 H-34 L-20 112 Z', '#7d8893');                                 // base
      line(g, 'M-110 112 H40', '#7d8893', 3);
      return g;
    },

    // "satellite cx cy width rot=deg" — satellite with two solar wings and a small dish
    satellite: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S / 300, o, parent);
      line(g, 'M-110 0 H110', DK, 4);
      for (const x0 of [-146, 40]) {
        P(g, R(x0, -26, 106, 52, 3), '#2b5fa8', '#1a2f55');
        line(g, `M${x0 + 26.5} -26 V26 M${x0 + 53} -26 V26 M${x0 + 79.5} -26 V26 M${x0} 0 H${x0 + 106}`, '#9ccbf3', 1.8);
      }
      P(g, R(-30, -34, 60, 68, 6), '#f3c33b', '#8a6414');
      line(g, 'M0 34 V50', DK, 3); P(g, 'M-20 50 A20 10 0 0 0 20 50 Z', '#e9edf1', DK, 2.5);
      return g;
    },

    // "celltower cx cy height" — mobile phone mast with antennas and signal waves
    celltower: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S / 280, o, parent);
      let br = ''; for (let i = 0; i < 5; i++) { const y0 = 130 - i * 40, y1 = y0 - 40, w0 = 44 - i * 7.5, w1 = 44 - (i + 1) * 7.5; br += `M${-w0} ${y0} L${w1} ${y1} M${w0} ${y0} L${-w1} ${y1} M${-w1} ${y1} H${w1} `; }
      F(g, 'M-44 130 L-6 -70 L6 -70 L44 130 Z', '#dfe5ea');
      line(g, 'M-44 130 L-6 -70 M44 130 L6 -70', '#5a6068', 4); line(g, br, '#7d8893', 2);
      for (const x of [-24, -6, 12]) P(g, R(x, -116, 12, 46, 3), '#f7f9fb', DK, 2.5);
      waves(g, 0, -92, 135, 225, [52, 74], INK.blue, 3.5); waves(g, 0, -92, -45, 45, [52, 74], INK.blue, 3.5);
      return g;
    },

    // "gpsmap cx cy width" — folded map with a road and a red location pin
    gpsmap: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S / 280, o, parent);
      P(g, 'M-140 -60 L-48 -80 L48 -60 L140 -80 L140 80 L48 100 L-48 80 L-140 100 Z', '#e4f2d0', '#5f7a4c');
      F(g, 'M-48 -80 L48 -60 L48 100 L-48 80 Z', '#c9e2a8');
      line(g, 'M-48 -80 V80 M48 -60 V100', '#7f9a6a', 2);
      line(g, 'M-130 60 C-80 40 -60 -10 0 0 S90 -40 130 -50', '#c97a10', 4, { 'stroke-dasharray': '10 8' });
      const pin = mk('g', { transform: 'translate(20 0)' }, g);
      P(pin, 'M0 0 C-8 -18 -30 -36 -30 -58 A30 30 0 0 1 30 -58 C30 -36 8 -18 0 0 Z', '#e04b3a', '#7a1f1f');
      P(pin, C(0, -58, 11), '#ffffff', '#7a1f1f', 2.5);
      return g;
    },

    // "bulb cx cy height k=on|off" — light bulb, glowing with rays when on
    bulb: ([cx, cy, S = 220], o, t, parent) => {
      const g = mk('g', { transform: 'translate(0 32)' }, G(cx, cy, S / 220, o, parent)), on = o.k !== 'off';
      if (on) { mk('circle', { cx: 0, cy: -38, r: 82, fill: '#fff3a6', opacity: .55, filter: 'url(#wc)', class: 'fillable' }, g);
        for (let i = 0; i < 7; i++) { const a = (200 + i * 23.3) * Math.PI / 180; line(g, `M${92 * Math.cos(a)} ${-38 + 92 * Math.sin(a)} L${118 * Math.cos(a)} ${-38 + 118 * Math.sin(a)}`, '#f3b51c', 5); } }
      P(g, 'M-28 40 C-28 14 -58 0 -58 -38 A58 58 0 0 1 58 -38 C58 0 28 14 28 40 Z', on ? '#ffe066' : '#eef2f5', on ? '#c98a00' : '#7d8893');
      line(g, 'M-12 40 V8 L-18 -14 L-6 -4 L0 -16 L6 -4 L18 -14 L12 8 V40', on ? '#e07a10' : '#7d8893', 2.5);
      P(g, R(-30, 40, 60, 38, 6), '#c9d1d9', '#5a6068');
      line(g, 'M-30 52 H30 M-30 64 H30', '#5a6068', 2.5);
      P(g, 'M-14 78 H14 L8 92 H-8 Z', '#4a5563', DK, 2.5);
      return g;
    },

    // "led cx cy height c=red|green|blue|yellow k=on|off" — LED with two legs, glows when on
    led: ([cx, cy, S = 160], o, t, parent) => {
      const g = G(cx, cy, S / 160, o, parent), col = { red: '#e04b3a', green: '#5fae3a', blue: '#4f93d6', yellow: '#ffd84a' }[o.c || 'red'], on = o.k !== 'off';
      if (on) { mk('circle', { cx: 0, cy: -30, r: 50, fill: col, opacity: .25, filter: 'url(#wc)', class: 'fillable' }, g);
        for (const a of [-150, -110, -70, -30]) { const r = a * Math.PI / 180; line(g, `M${58 * Math.cos(r)} ${-30 + 58 * Math.sin(r)} L${74 * Math.cos(r)} ${-30 + 74 * Math.sin(r)}`, col, 4); } }
      line(g, 'M-10 26 V80 M10 26 V70', '#7d8893', 4);
      P(g, 'M-24 18 V-34 A24 24 0 0 1 24 -34 V18 Z', col, DK);
      P(g, R(-30, 16, 60, 12, 3), col, DK, 2.5);
      line(g, 'M-12 -40 Q-12 -50 -4 -52', '#ffffff', 4, { opacity: .8 });
      return g;
    },

    // "battery cx cy width level=0-100 |text" — battery filled to its level (green, amber or red)
    battery: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent), lv = Math.max(0, Math.min(100, +(o.level ?? 75))) / 100;
      P(g, R(100, -22, 18, 44, 4), '#7d8893');
      P(g, R(-112, -54, 212, 108, 14), '#f7f9fb');
      if (lv > 0) P(g, R(-100, -42, 188 * lv, 84, 6), lv > .5 ? '#5fae3a' : lv > .2 ? '#f4a531' : '#e04b3a', lv > .5 ? '#2c6a22' : lv > .2 ? '#a0600a' : '#7a1f1f', 2);
      if (t) label(g, -6, 12, t, DK, 30, 'middle');
      return g;
    },

    // "plug cx cy height k=plug|socket" — electric plug with cable, or a wall socket
    plug: ([cx, cy, S = 220], o, t, parent) => {
      const g = G(cx, cy, S / 220, o, parent);
      if (o.k === 'socket') {
        P(g, R(-80, -80, 160, 160, 20), '#f7f9fb'); P(g, C(0, 0, 52), '#e3e7eb', '#5a6068');
        P(g, R(-26, -18, 12, 36, 4), DK, DK, 2); P(g, R(14, -18, 12, 36, 4), DK, DK, 2);
        return g;
      }
      P(g, R(-28, -100, 14, 50, 3), '#d9b24a', '#7a5a14', 2.5); P(g, R(14, -100, 14, 50, 3), '#d9b24a', '#7a5a14', 2.5);
      P(g, 'M-50 -52 H50 V0 Q50 30 20 34 H-20 Q-50 30 -50 0 Z', '#e9edf1');
      line(g, 'M0 34 V60 C0 100 60 80 60 110', DK, 8);
      return g;
    },

    // "solarpanel cx cy width" — tilted solar panel on legs, cells in a grid
    solarpanel: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S / 300, o, parent);
      line(g, 'M-60 30 V100 M60 30 V100 M-20 -40 L-20 100', '#5a6068', 5);
      line(g, 'M-150 100 H150', '#7d8893', 3);
      const tl = [-90, -90], tr = [150, -90], br = [90, 30], bl = [-150, 30];
      P(g, `M${bl} L${tl} L${tr} L${br} Z`, '#2b5fa8', '#1a2f55');
      const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      let d = ''; for (let i = 1; i < 6; i++) { const k = i / 6; d += `M${lerp(bl, br, k)} L${lerp(tl, tr, k)} `; }
      for (let i = 1; i < 3; i++) { const k = i / 3; d += `M${lerp(bl, tl, k)} L${lerp(br, tr, k)} `; }
      line(g, d, '#9ccbf3', 2);
      line(g, 'M-70 -60 L-40 -80', '#ffffff', 4, { opacity: .8 });
      return g;
    },

    // "turbine cx cy height spin=1" — wind turbine; spin=1 turns the blades forever
    turbine: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S / 280, o, parent);
      P(g, 'M-5 -40 L-12 140 H12 L5 -40 Z', '#eef2f5', '#5a6068');
      P(g, R(-12, -52, 34, 22, 7), '#e3e7eb', '#5a6068');
      const hub = mk('g', { transform: 'translate(0 -41)' }, g), b = mk('g', {}, hub);
      for (const a of [0, 120, 240]) P(mk('g', { transform: `rotate(${a})` }, b), 'M-6 -6 C-14 -40 -8 -88 0 -112 C10 -88 12 -40 6 -6 Z', '#e3e9f0', '#5a6068', 2.5);
      P(b, C(0, 0, 9), '#c9d1d9', '#5a6068', 2.5);
      if (+o.spin) spin(b, 0, 0, 3);
      return g;
    },

    // "powerplant cx cy width" — power station: cooling tower with steam, chimney, hall with a bolt
    powerplant: ([cx, cy, S = 300], o, t, parent) => {
      const g = mk('g', { transform: 'translate(0 45)' }, G(cx, cy, S / 300, o, parent));
      P(g, R(-118, -96, 26, 86), '#c96a4a', '#6e2f1c'); smoke(g, -104, -114);
      P(g, R(-150, -10, 160, 110), '#d9c3a5', '#6e5232');
      P(g, 'M-58 16 L-74 52 H-58 L-66 80 L-38 40 H-54 L-42 16 Z', '#ffd84a', '#a0600a', 2.5);
      for (const x of [-136, -20]) P(g, R(x, 20, 18, 26, 2), '#bfe3fa', DK, 2);
      P(g, 'M30 100 C48 40 50 -10 40 -60 H128 C118 -10 120 40 138 100 Z', '#cfd8dc', '#5a6068');
      line(g, 'M40 -60 H128', '#5a6068', 3);
      for (const [x, y, r] of [[70, -80, 22], [98, -86, 18], [84, -112, 26], [112, -122, 20]]) P(g, C(x, y, r), '#f2f4f6', '#9aa3ad', 2);
      line(g, 'M-160 100 H160', '#7d8893', 3);
      return g;
    },

    // "powerline x1 x2 baseY height" — two pylons with three sagging wires (loop flow)
    powerline: ([x1, x2, by, h = 220], o, t, parent) => {
      // three crossarms; each carries ONE wire, hung from the arm tip that faces the other pylon
      const g = mk('g', {}, parent), arms = [[-.6, 50], [-.76, 42], [-.92, 34]], span = Math.abs(x2 - x1), dir = Math.sign(x2 - x1) || 1;
      const leg = y => 34 - 26 * (by - y) / h;                                             // half-width at height y
      for (const [x, s] of [[x1, dir], [x2, -dir]]) {
        F(g, `M${x - 34} ${by} L${x - 8} ${by - h} H${x + 8} L${x + 34} ${by} Z`, '#eef1f4');
        line(g, `M${x - 34} ${by} L${x - 8} ${by - h} L${x} ${by - h - 14} L${x + 8} ${by - h} L${x + 34} ${by}`, '#4a525c', 3.4);
        let d = ''; const ys = [by, by - h * .2, by - h * .4, by - h * .6];                 // three lattice panels, one brace each
        for (let i = 0; i < 3; i++) { const a = ys[i], b = ys[i + 1], sg = i % 2 ? 1 : -1; d += `M${x + sg * leg(a)} ${a} L${x - sg * leg(b)} ${b} M${x - leg(b)} ${b} H${x + leg(b)} `; }
        line(g, d, '#6b7480', 2.2);
        for (const [k, w] of arms) {
          const y = by + h * k;
          line(g, `M${x - w} ${y} H${x + w} M${x - w} ${y} L${x - leg(y)} ${y + 12} M${x + w} ${y} L${x + leg(y)} ${y + 12}`, '#4a525c', 3);
          line(g, `M${x + s * w} ${y} V${y + 12}`, '#8a6414', 4);                            // insulator
        }
      }
      const sag = Math.max(18, span * .08);
      for (const [k, w] of arms) {
        const y = by + h * k + 12, a = x1 + dir * w, b = x2 - dir * w;
        line(g, `M${a} ${y} Q${(a + b) / 2} ${y + 2 * sag} ${b} ${y}`, DK, 2.6);
      }
      return g;
    },

    // "evcharge cx cy width" — electric car plugged into a charging post
    evcharge: ([cx, cy, S = 360], o, t, parent) => {
      const g = G(cx, cy, S / 360, o, parent);
      carBody(mk('g', { transform: 'translate(-50 40) scale(1)' }, g), '#5fae3a');
      P(g, R(112, -70, 54, 152, 8), '#e9edf1');
      P(g, R(122, -56, 34, 30, 4), '#bfe3fa', DK, 2.5);
      P(g, 'M142 -52 L130 -40 H140 L134 -30 L148 -44 H138 Z', '#ffd84a', '#a0600a', 1.8);
      line(g, 'M112 0 C80 0 92 50 70 30', DK, 6);
      line(g, 'M90 82 H190', '#7d8893', 3);
      return g;
    },

    // "vehicle cx cy length k=car|bus|train" — side view, facing right
    vehicle: ([cx, cy, S = 280], o, t, parent) => {
      const k = o.k || 'car', g = G(cx, cy, S / (k === 'car' ? 250 : 300), o, parent);
      if (k === 'car') carBody(g, FILL[o.c] || '#e04b3a');
      else if (k === 'bus') {
        P(g, R(-150, -90, 300, 112, 14), '#ffd84a', '#8a6414');
        for (let i = 0; i < 5; i++) P(g, R(-136 + i * 48, -76, 38, 36, 4), '#bfe3fa', DK, 2.5);
        P(g, R(106, -76, 32, 86, 4), '#bfe3fa', DK, 2.5);
        line(g, 'M-150 -26 H106', '#c97a10', 4);
        wheel(g, -96, 22, 22); wheel(g, 92, 22, 22);
      } else if (k === 'train') {
        line(g, 'M-160 34 H160', '#5a6068', 4); line(g, 'M-150 40 V44 M-110 40 V44 M-70 40 V44 M-30 40 V44 M10 40 V44 M50 40 V44 M90 40 V44 M130 40 V44', '#8a6a3e', 4);
        P(g, 'M-150 18 V-62 Q-150 -72 -140 -72 H90 Q150 -70 156 0 V18 Z', '#4f93d6', '#1f4f8f');
        for (let i = 0; i < 4; i++) P(g, R(-136 + i * 52, -58, 40, 30, 4), '#dff1ff', DK, 2.5);
        P(g, 'M100 -58 Q136 -54 144 -26 H100 Z', '#dff1ff', DK, 2.5);
        line(g, 'M-150 -12 H154', '#ffffff', 5);
        for (const x of [-120, -80, 60, 100]) P(g, C(x, 22, 12), '#3a4450', DK, 2.5);
      } else throw new Error(`Unknown vehicle "${k}"`);
      return g;
    },

    // "bicycle cx cy length" — side-view bicycle
    bicycle: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S / 260, o, parent);
      for (const x of [-75, 75]) { P(g, C(x, 30, 48), null, DK, 5); line(g, `M${x - 46} 30 H${x + 46} M${x} -16 V76 M${x - 33} -3 L${x + 33} 63 M${x + 33} -3 L${x - 33} 63`, '#9aa3ad', 1.5); }
      line(g, 'M-75 30 L-5 30 L-28 -40 Z M-5 30 L50 -40 H-28 M50 -40 L75 30', '#e04b3a', 5);
      line(g, 'M-28 -40 L-32 -52 M50 -40 L44 -64 H66', DK, 4);
      P(g, 'M-50 -56 H-14 Q-12 -50 -18 -48 H-46 Z', '#3a4450', DK, 2.5);
      P(g, C(-5, 30, 9), '#c9d1d9', DK, 2.5);
      return g;
    },

    // "airplane cx cy length rot=deg" — passenger plane, side view facing right
    airplane: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S / 320, o, parent);
      P(g, 'M-128 -16 L-150 -84 H-122 L-84 -20 Z', '#4f93d6', '#1f4f8f');
      P(g, 'M-150 0 Q-150 -18 -120 -22 H110 Q150 -20 162 2 Q150 18 110 20 H-120 Q-150 16 -150 0 Z', '#f7f9fb');
      P(g, 'M10 6 L-50 70 H-22 L60 6 Z', '#9ccbf3', '#1f4f8f');
      P(g, E(-6, 36, 22, 9), '#c9d1d9', DK, 2.5);
      let w = ''; for (let x = -100; x < 100; x += 20) w += C(x, -6, 4) + ' ';
      P(g, w, '#bfe3fa', DK, 1.6);
      P(g, 'M124 -14 Q142 -12 150 -4 H124 Z', '#bfe3fa', DK, 2);
      line(g, 'M-150 4 H150', '#4f93d6', 3);
      return g;
    },

    // "ship cx cy length" — cargo ship on waves, funnel and cabins
    ship: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S / 320, o, parent);
      for (const [x, c] of [[-120, '#e04b3a'], [-86, '#4f93d6'], [-52, '#5fae3a'], [-18, '#f4a531']]) P(g, R(x, -26, 32, 26, 2), c, DK, 2.2);
      P(g, R(30, -60, 80, 60, 4), '#f7f9fb');
      for (const x of [46, 70, 94]) P(g, C(x, -34, 6), '#bfe3fa', DK, 1.8);
      P(g, R(56, -100, 26, 40, 3), '#f4a531', '#a0600a'); P(g, R(56, -100, 26, 10), '#3a4450', DK, 2);
      P(g, 'M-160 0 H160 L132 54 H-136 Z', '#2f4a6e', '#1a2f55');
      line(g, 'M-150 18 H150', '#e04b3a', 5);
      line(g, 'M-170 56 Q-150 46 -130 56 T-90 56 T-50 56 T-10 56 T30 56 T70 56 T110 56 T150 56 T170 52', '#2b6cc4', 3);
      return g;
    },

    // "piston cx cy height k=burn" — engine cylinder cutaway: piston, rod, crank, spark plug; burn shows the flame
    piston: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S / 300, o, parent);
      if (o.k === 'burn') P(g, 'M-58 -120 H58 V-62 H-58 Z', '#ffb347', '#e07a10', 2);
      P(g, R(-80, -140, 20, 160), '#9aa3ad'); P(g, R(60, -140, 20, 160), '#9aa3ad');
      P(g, R(-80, -150, 160, 18), '#7d8893');
      P(g, R(-7, -172, 14, 26, 3), '#f7f9fb'); line(g, 'M0 -146 V-126', DK, 3);
      P(g, C(0, 110, 44), '#e3e7eb', '#5a6068');
      line(g, 'M0 -30 L26 120', DK, 16); line(g, 'M0 -30 L26 120', '#c9d1d9', 9);
      P(g, R(-58, -62, 116, 58, 4), '#c9d1d9');
      line(g, 'M-58 -50 H58 M-58 -40 H58', '#5a6068', 2);
      P(g, C(0, -30, 8), '#7d8893', DK, 2.5); P(g, C(26, 120, 9), '#7d8893', DK, 2.5); P(g, C(0, 110, 6), DK, DK, 2);
      return g;
    },

    // "gears cx cy width spin=1" — three meshing gears; spin=1 turns them
    gears: ([cx, cy, S = 300], o, t, parent) => {
      const g = G(cx, cy, S / 300, o, parent);
      for (const [x, y, r, n, c, dir] of [[-78, 22, 56, 10, '#f4a531', 1], [14, -32, 41, 7, '#7fb7ea', -1], [84, 10, 28, 5, '#5fae3a', 1]]) {
        const gg = mk('g', {}, g);
        P(gg, gearD(x, y, r, n), c, DK, 2.8); P(gg, C(x, y, r * .3), '#fdfdfb', DK, 2.5);
        if (+o.spin) spin(gg, x, y, r / 12, dir);
      }
      return g;
    },

    // "conveyor cx cy length" — conveyor belt with rollers carrying boxes (loop flow)
    conveyor: ([cx, cy, S = 320], o, t, parent) => {
      const g = G(cx, cy, S / 320, o, parent);
      for (const x of [-120, 0, 120]) line(g, `M${x} 18 V70`, '#5a6068', 5);
      line(g, 'M-145 70 H145', '#7d8893', 3);
      P(g, 'M-140 -14 H140 A16 16 0 0 1 140 18 H-140 A16 16 0 0 1 -140 -14 Z', '#5a6068', DK);
      for (const x of [-140, -70, 0, 70, 140]) P(g, C(x, 2, 9), '#c9d1d9', DK, 2);
      for (const [x, w, h] of [[-110, 54, 44], [-20, 44, 36], [60, 58, 50]]) { P(g, R(x, -14 - h, w, h, 3), '#d9a86a', '#7a5a2a'); line(g, `M${x} ${-14 - h + 12} H${x + w}`, '#a8783e', 2); }
      return g;
    },

    // "building cx cy width k=house|factory|shop|bank |text" — a building; text is the shop's sign
    building: ([cx, cy, S = 260], o, t, parent) => {
      const k = o.k || 'house', g = G(cx, cy, S / 260, o, parent);
      if (k === 'house') {
        P(g, R(50, -110, 24, 50), '#c96a4a', '#6e2f1c');
        P(g, R(-90, -30, 180, 130), '#f4d9a8', '#8a6414');
        P(g, 'M-112 -24 L0 -112 L112 -24 Z', '#e04b3a', '#7a1f1f');
        P(g, R(-18, 34, 36, 66, 3), '#b07a4a', '#5e3b1c');
        for (const x of [-72, 34]) { P(g, R(x, 4, 38, 34, 2), '#bfe3fa', DK, 2.5); line(g, `M${x + 19} 4 V38 M${x} 21 H${x + 38}`, DK, 2); }
      } else if (k === 'factory') {
        P(g, R(76, -120, 28, 110), '#c96a4a', '#6e2f1c'); smoke(g, 92, -138);
        P(g, 'M-130 100 V-60 L-74 -24 V-60 L-18 -24 V-60 L38 -24 V-10 H130 V100 Z', '#cfd8dc', '#5a6068');
        for (let i = 0; i < 4; i++) P(g, R(-112 + i * 50, 10, 30, 30, 2), '#ffe58a', DK, 2.2);
        P(g, R(84, 40, 34, 60, 2), '#7d8893', DK, 2.5);
      } else if (k === 'shop') {
        P(g, R(-110, -40, 220, 140), '#fff4d6', '#8a6414');
        P(g, 'M-124 -40 L-110 -80 H110 L124 -40 Z', '#ffffff', '#7a1f1f');
        for (let i = 0; i < 6; i += 2) F(g, `M${-124 + i * 41.3} -40 L${-110 + i * 36.7} -80 H${-110 + (i + 1) * 36.7} L${-124 + (i + 1) * 41.3} -40 Z`, '#e04b3a');
        line(g, 'M-124 -40 L-110 -80 H110 L124 -40 Z', '#7a1f1f', 3);
        P(g, R(-62, -124, 124, 36, 6), '#f7f9fb', '#8a6414'); if (t || showLab(o)) label(g, 0, -97, t || 'SHOP', TXT.red, 24, 'middle');
        P(g, R(-92, -14, 100, 70, 3), '#bfe3fa', DK, 2.5); P(g, R(32, 0, 50, 100, 3), '#b07a4a', '#5e3b1c');
      } else if (k === 'bank') {
        P(g, 'M-130 -60 L0 -120 L130 -60 Z', '#e9e4d8', '#6e6250'); label(g, 0, -70, '$', '#6e6250', 30, 'middle');
        P(g, R(-130, -60, 260, 18), '#e9e4d8', '#6e6250');
        for (let i = 0; i < 5; i++) P(g, R(-112 + i * 50, -42, 24, 112), '#f4f0e6', '#6e6250', 2.5);
        P(g, R(-140, 70, 280, 14), '#e9e4d8', '#6e6250'); P(g, R(-150, 84, 300, 14), '#d9d2c2', '#6e6250');
      } else throw new Error(`Unknown building "${k}"`);
      return g;
    },

    // "coin cx cy size |$1" — gold coin with its value
    coin: ([cx, cy, S = 140], o, t, parent) => {
      const g = G(cx, cy, S / 140, o, parent);
      P(g, C(0, 0, 66), '#f3c33b', '#8a6414'); line(g, C(0, 0, 52), '#c98a00', 2);
      line(g, arc(0, 0, 58, 200, 250), '#fff3a6', 4);
      label(g, 0, 12, t || '$', '#7a4a00', 34, 'middle');
      return g;
    },

    // "banknote cx cy width |$10" — paper money with its value in the middle
    banknote: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S / 260, o, parent);
      P(g, R(-130, -64, 260, 128, 6), '#b6dfa8', '#2c6a22');
      line(g, R(-116, -50, 232, 100, 4), '#5fae3a', 2);
      P(g, E(0, 0, 40, 34), '#e4f2d0', '#2c6a22', 2.5);
      label(g, 0, 11, t || '$', '#2c6a22', 30, 'middle');
      for (const [x, y] of [[-96, -24], [96, 32]]) P(g, C(x, y, 10), '#e4f2d0', '#2c6a22', 2);
      return g;
    },

    // "card cx cy width" — plain bank card: chip, contactless waves, number
    card: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S / 260, o, parent);
      P(g, R(-128, -80, 256, 160, 14), '#4f93d6', '#1f4f8f');
      P(g, R(-100, -36, 44, 34, 5), '#d9b24a', '#7a5a14', 2.5); line(g, 'M-100 -19 H-56 M-78 -36 V-2', '#7a5a14', 1.8);
      waves(g, -46, -19, -40, 40, [10, 18, 26], '#ffffff', 2.5);
      label(g, -100, 34, t || '•••• •••• •••• 1234', '#ffffff', 22);
      line(g, 'M-100 56 H-20', '#dff1ff', 3);
      return g;
    },

    // "moneyjar cx cy height |text" — glass savings jar full of coins and a note
    moneyjar: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      const jar = 'M-50 -82 Q-50 -66 -66 -58 Q-78 -50 -78 -30 V84 Q-78 108 -54 108 H54 Q78 108 78 84 V-30 Q78 -50 66 -58 Q50 -66 50 -82 Z';
      F(g, jar, '#e6f4fd');
      P(g, 'M-8 -70 L22 -66 L18 0 L-12 -4 Z', '#b6dfa8', '#2c6a22', 2.5); line(g, 'M3 -50 V-20', '#2c6a22', 2); // rolled-up note
      const coin = (x, y) => { P(g, `M${x - 20} ${y} V${y + 7} A20 6 0 0 0 ${x + 20} ${y + 7} V${y} Z`, '#d9a520', '#8a6414', 2); P(g, E(x, y, 20, 6), '#f7cf4a', '#8a6414', 2); };
      for (const [x, n] of [[-46, 4], [-4, 7], [40, 5]]) for (let i = 0; i < n; i++) coin(x, 92 - i * 8);  // three neat stacks
      for (const [x, y] of [[-24, 96], [20, 96]]) coin(x, y);                              // two lying in front
      line(g, jar, '#4f93d6', 3);
      P(g, R(-58, -104, 116, 26, 6), '#d9b24a', '#7a5a14'); line(g, 'M-18 -92 H18', '#4a3300', 4);   // lid with slot
      P(g, 'M-78 2 Q0 12 78 2 V34 Q0 44 -78 34 Z', '#fff7e0', '#b08a4a', 2.5);            // label strip
      label(g, 0, 32, t || '$', TXT.blue, t ? 24 : 28, 'middle');
      line(g, 'M62 -36 V-6 M62 44 V70', '#ffffff', 5, { opacity: .85 });
      return g;
    },

    // "wallet cx cy width" — leather wallet with a note peeking out
    wallet: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      P(g, R(-86, -88, 150, 60, 3), '#b6dfa8', '#2c6a22', 2.5);
      P(g, R(-112, -60, 224, 130, 16), '#a8703e', '#5e3b1c');
      P(g, 'M114 -22 H48 Q28 -22 28 -2 V16 Q28 36 48 36 H114 Z', '#8a5a2e', '#5e3b1c');
      P(g, C(52, 7, 8), '#d9b24a', '#7a5a14', 2);
      line(g, R(-100, -48, 200, 106, 10), '#e0b888', 1.8, { 'stroke-dasharray': '6 6' });
      return g;
    },

    // "cart cx cy width" — shopping cart with groceries
    cart: ([cx, cy, S = 280], o, t, parent) => {
      const g = G(cx, cy, S / 280, o, parent);
      P(g, C(-50, -66, 22), '#e04b3a', '#7a1f1f', 2.5); P(g, R(-14, -96, 40, 46, 4), '#f4a531', '#a0600a', 2.5);
      P(g, E(54, -62, 26, 16), '#ffd84a', '#c98a00', 2.5);
      P(g, 'M-104 -50 H120 L96 30 H-80 Z', '#e9edf1', '#5a6068');
      line(g, 'M-60 -50 L-48 30 M-14 -50 L-10 30 M30 -50 L28 30 M74 -50 L64 30 M-94 -16 H110', '#9aa3ad', 2);
      line(g, 'M-146 -80 H-118 L-80 30 L-72 52 H96', DK, 5);
      P(g, C(-56, 72, 14), '#3a4450', DK, 2.5); P(g, C(80, 72, 14), '#3a4450', DK, 2.5);
      return g;
    },

    // "clock cx cy size h=3 m=0" — wall clock showing h:m
    clock: ([cx, cy, S = 220], o, t, parent) => {
      const g = G(cx, cy, S / 220, o, parent), h = +(o.h ?? 10) % 12, m = +(o.m ?? 10);
      P(g, C(0, 0, 100), '#4f93d6', '#1f4f8f'); P(g, C(0, 0, 86), '#fdfdfb', '#1f4f8f', 2.5);
      let d = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r0 = i % 3 ? 74 : 66; d += `M${r0 * Math.sin(a)} ${-r0 * Math.cos(a)} L${80 * Math.sin(a)} ${-80 * Math.cos(a)} `; }
      line(g, d, DK, 3);
      const ha = (h + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
      line(g, `M0 0 L${44 * Math.sin(ha)} ${-44 * Math.cos(ha)}`, DK, 7);
      line(g, `M0 0 L${66 * Math.sin(ma)} ${-66 * Math.cos(ma)}`, DK, 4);
      P(g, C(0, 0, 7), '#e04b3a', DK, 2);
      return g;
    },

    // "calendar cx cy height |14" — calendar page with a big day number
    calendar: ([cx, cy, S = 220], o, t, parent) => {
      const g = G(cx, cy, S / 220, o, parent);
      P(g, R(-90, -86, 180, 186, 10), '#fdfdfb');
      P(g, 'M-90 -40 V-76 Q-90 -86 -80 -86 H80 Q90 -86 90 -76 V-40 Z', '#e04b3a', '#7a1f1f');
      for (const x of [-46, 46]) { P(g, R(x - 7, -104, 14, 32, 6), '#c9d1d9', DK, 2.5); }
      label(g, 0, 60, t || '1', DK, 84, 'middle');
      return g;
    },

    // "book cx cy width k=open|closed |text" — open book with text lines, or a closed one with a title
    book: ([cx, cy, S = 260], o, t, parent) => {
      const g = G(cx, cy, S / 260, o, parent);
      if (o.k === 'closed') {
        P(g, R(-76, -104, 156, 208, 6), '#4f93d6', '#1f4f8f'); line(g, 'M-58 -104 V104', '#1f4f8f', 3);
        P(g, R(-34, -60, 92, 40, 4), '#fdfdfb', '#1f4f8f', 2); if (t) label(g, 12, -32, t, TXT.blue, 20, 'middle');
        return g;
      }
      P(g, 'M-136 -54 L-136 84 Q-70 70 0 92 Q70 70 136 84 V-54 Z', '#4f93d6', '#1f4f8f');
      P(g, 'M0 -60 Q-60 -84 -126 -64 V72 Q-60 54 0 78 Z', '#fdfdfb', '#5a6068');
      P(g, 'M0 -60 Q60 -84 126 -64 V72 Q60 54 0 78 Z', '#fdfdfb', '#5a6068');
      let d = ''; for (let i = 0; i < 6; i++) { const y = -48 + i * 18; d += `M-108 ${y - 4} Q-60 ${y - 18} -16 ${y} M16 ${y} Q60 ${y - 18} 108 ${y - 4} `; }
      line(g, d, '#9aa3ad', 2);
      if (t) label(g, 0, 124, t, TXT.blue, 26, 'middle');
      return g;
    },

    // "newspaper cx cy width |NEWS" — newspaper page: masthead, headline, picture, columns
    newspaper: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      P(g, R(-100, -120, 200, 240, 4), '#f4f1e8', '#5a6068');
      label(g, 0, -80, t || 'NEWS', DK, 38, 'middle');
      line(g, 'M-86 -66 H86', DK, 3); line(g, 'M-86 -48 H70', DK, 7);
      P(g, R(-86, -32, 80, 66, 2), '#bfe3fa', '#5a6068', 2); line(g, 'M-86 30 L-58 0 L-40 16 L-24 -4 L-6 30', '#5f7a6c', 2.5);
      pageLines(g, 8, -28, 78, 5); pageLines(g, -86, 50, 78, 4); pageLines(g, 8, 50, 78, 4);
      return g;
    },

    // "camera cx cy width" — photo camera: lens, flash, shutter button
    camera: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      P(g, R(-92, -78, 26, 14, 4), '#e04b3a', DK, 2.5);
      P(g, 'M-40 -60 L-28 -84 H28 L40 -60 Z', '#4a5563');
      P(g, R(-118, -62, 236, 140, 18), '#4a5563');
      P(g, R(70, -48, 32, 18, 3), '#fdfdfb', DK, 2.5);
      P(g, C(0, 8, 54), '#c9d1d9'); P(g, C(0, 8, 38), '#2b5fa8', '#1a2f55'); P(g, C(0, 8, 18), '#1a2f55', '#1a2f55', 2);
      line(g, arc(0, 8, 28, 200, 250), '#ffffff', 4, { opacity: .85 });
      return g;
    },

    // "mic cx cy height" — microphone on a stand
    mic: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      line(g, 'M-50 -40 Q-50 26 0 26 Q50 26 50 -40', DK, 5); line(g, 'M0 26 V96', DK, 6);
      P(g, E(0, 104, 48, 12), '#4a5563');
      P(g, R(-34, -120, 68, 110, 34), '#c9d1d9');
      line(g, 'M-34 -70 H34 M-30 -94 H30 M-34 -46 H34 M-12 -118 V-12 M12 -118 V-12', '#7d8893', 1.8);
      return g;
    },

    // "headphones cx cy width" — over-ear headphones
    headphones: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      line(g, 'M-90 10 C-96 -110 96 -110 90 10', DK, 12); line(g, 'M-90 10 C-96 -110 96 -110 90 10', '#7d8893', 5);
      for (const s of [-1, 1]) { P(g, R(s < 0 ? -118 : 78, -10, 40, 90, 18), '#f4a531', '#a0600a'); P(g, R(s < 0 ? -84 : 70, 0, 14, 70, 6), '#3a4450', DK, 2.5); }
      return g;
    },

    // "speaker cx cy height waves=1" — loudspeaker box with sound waves
    speaker: ([cx, cy, S = 240], o, t, parent) => {
      const g = G(cx, cy, S / 240, o, parent);
      P(g, R(-110, -110, 140, 220, 12), '#c99a66', '#5e3b1c');
      P(g, C(-40, 40, 46), '#3a4450'); P(g, C(-40, 40, 16), '#7d8893', DK, 2.5);
      P(g, C(-40, -60, 22), '#3a4450'); P(g, C(-40, -60, 8), '#7d8893', DK, 2);
      if (o.waves !== '0') waves(g, 36, 0, -40, 40, [30, 56, 82], INK.blue, 4);
      return g;
    },
  });
})();
