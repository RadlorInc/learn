// Whiteboard library: daily — home, kitchen, food, school, sports, music, art, clothes.
// Catalogue: daily.txt. Halal and child-safe: no pork, no alcohol, no gambling, modest clothes, no brands.
(() => {
  const DK = '#2f3a45';
  const P = (g, d, fill, ink = DK, w = 3) => { if (fill) mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable' }, g); return line(g, d, ink, w); };
  const R = (x, y, w, h, r = 0) => r
    ? `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
    : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  const E = (x, y, rx, ry = rx) => `M${x + rx} ${y} A${rx} ${ry} 0 1 0 ${x - rx} ${y} A${rx} ${ry} 0 1 0 ${x + rx} ${y} Z`;
  const C = (x, y, r) => E(x, y, r);
  const poly = (x, y, r, n, a0 = -90) => 'M' + Array.from({ length: n }, (_, i) => { const a = (a0 + i * 360 / n) * Math.PI / 180; return `${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`; }).join(' L') + ' Z';
  const spin = (el, x, y, secs) => mk('animateTransform', { attributeName: 'transform', type: 'rotate', from: `0 ${x} ${y}`, to: `360 ${x} ${y}`, dur: `${secs}s`, repeatCount: 'indefinite' }, el);
  const pick = (K, k, d, what) => { const f = K[k || d]; if (!f) throw new Error(`Unknown ${what} "${k}" (use ${Object.keys(K).join('|')})`); return f; };
  const showLab = o => o.lab !== '0' && o.labels !== '0';
  const list = t => (t || '').split(',').map(s => s.trim()).filter(Boolean);
  // a drawing in its own unit box: base = default size; cx cy is its centre
  const make = (base, draw) => ([cx, cy, size = base], o, t, parent) => {
    const s = size / base, g = mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${s})` }, parent);
    draw(g, o, t); return g;
  };
  // rising steam wisps that drift up and fade (always visible)
  const steam = (g, x, y, xs = [-24, 0, 24], h = 1) => {
    const sg = mk('g', {}, g);
    xs.forEach(dx => line(sg, `M${x + dx} ${y} q${10 * h} ${-12 * h} 0 ${-24 * h} q${-10 * h} ${-12 * h} 0 ${-24 * h}`, '#a9b4be', 3));
    mk('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;0 -8;0 0', dur: '2.4s', repeatCount: 'indefinite' }, sg);
    mk('animate', { attributeName: 'opacity', values: '1;.5;1', dur: '2.4s', repeatCount: 'indefinite' }, sg);
  };
  const knob = (g, x, y, r = 7, f = '#9aa3ad') => P(g, C(x, y, r), f, DK, 2);

  // ---------- fruit ----------
  const FRUIT = {
    apple: g => {
      P(g, 'M0 -46 C-30 -72 -84 -58 -80 0 C-76 50 -40 82 0 68 C40 82 76 50 80 0 C84 -58 30 -72 0 -46 Z', '#e04b3a');
      line(g, 'M0 -46 Q2 -66 10 -80', '#6b4a2a', 5); P(g, 'M8 -66 Q36 -88 54 -66 Q30 -54 8 -66 Z', '#5fae3a', '#2c6a22', 2.4);
      line(g, 'M-52 -18 Q-54 -36 -38 -44', '#fff', 4);
    },
    banana: g => {
      P(g, 'M-92 -38 Q-70 62 46 52 Q88 44 102 8 Q68 30 30 28 Q-40 26 -72 -46 Z', '#ffd84a', '#8a6a10');
      line(g, 'M-78 -30 Q-46 36 40 40', '#d9b030', 2.4); P(g, 'M-96 -38 L-92 -52 L-74 -48 L-72 -42 Z', '#6b4a2a', '#4a3a20', 2);
      line(g, 'M102 8 l6 -2', '#4a3a20', 6);
    },
    orange: g => {
      P(g, C(0, 8, 74), '#f4a531', '#b8650c'); line(g, 'M0 -66 Q2 -76 6 -82', '#6b4a2a', 5);
      P(g, 'M6 -72 Q30 -94 50 -74 Q28 -62 6 -72 Z', '#5fae3a', '#2c6a22', 2.4);
      for (const [x, y] of [[-30, -10], [20, 20], [-10, 40], [36, -20], [-40, 30], [10, -30]]) line(g, `M${x} ${y} l.01 0`, '#d27b0c', 4);
      line(g, 'M-48 -28 Q-40 -46 -22 -52', '#fff', 4);
    },
    grapes: g => {
      line(g, 'M0 -66 Q4 -84 16 -92', '#6b4a2a', 5); P(g, 'M10 -76 Q44 -96 66 -72 Q40 -60 10 -76 Z', '#5fae3a', '#2c6a22', 2.4);
      const rows = [[-42, -14, 14, 42], [-28, 0, 28], [-42, -14, 14, 42], [-28, 0, 28], [-14, 14], [0]];
      rows.forEach((r, i) => r.forEach(x => P(g, C(x, -50 + i * 24, 16), '#8e5bbf', '#4a2a6a', 2.4)));
      line(g, 'M-36 -58 q4 -6 10 -6 M-8 -34 q4 -6 10 -6', '#fff', 3);
    },
    mango: g => {
      P(g, 'M-70 24 C-82 -48 0 -82 50 -52 C92 -26 82 50 30 66 C-20 80 -64 62 -70 24 Z', '#ffb43a', '#b8650c');
      mk('path', { d: 'M30 66 C82 50 92 -26 50 -52 C70 -10 60 40 30 66 Z', fill: '#e9603a', filter: 'url(#wc)', class: 'fillable', opacity: .7 }, g);
      line(g, 'M44 -54 Q50 -66 58 -72', '#6b4a2a', 5); P(g, 'M56 -68 Q86 -84 100 -60 Q76 -50 56 -68 Z', '#5fae3a', '#2c6a22', 2.4);
      line(g, 'M-50 -10 Q-46 -36 -22 -48', '#fff', 4);
    },
    watermelon: g => {
      P(g, 'M-96 -40 A96 96 0 0 0 96 -40 Z', '#4e9a33', '#24561c');
      P(g, 'M-84 -40 A84 84 0 0 0 84 -40 Z', '#eef4d4', '#9ab86a', 2);
      P(g, 'M-76 -40 A76 76 0 0 0 76 -40 Z', '#ef5a5a', '#c0392b', 2.4);
      for (const [x, y] of [[-40, -14], [-10, -2], [22, -14], [48, -4], [-26, 14], [8, 20], [34, 14], [-50, -28], [0, -26]]) P(g, E(x, y, 3.5, 6), '#2f2a28', '#2f2a28', 2);
    },
    strawberry: g => {
      P(g, 'M0 72 C-62 42 -76 -18 -54 -44 Q0 -58 54 -44 C76 -18 62 42 0 72 Z', '#e04b3a', '#a12a20');
      for (const [x, y] of [[-30, -20], [0, -24], [30, -20], [-38, 6], [-12, 0], [14, 0], [38, 6], [-24, 26], [0, 24], [24, 26], [-10, 48], [12, 48]]) line(g, `M${x} ${y} l2 5`, '#ffe58a', 3);
      P(g, 'M-50 -46 L-34 -66 L-18 -52 L0 -74 L18 -52 L34 -66 L50 -46 Q0 -32 -50 -46 Z', '#5fae3a', '#2c6a22', 2.4);
      line(g, 'M0 -64 V-86', '#2c6a22', 5);
    },
  };

  // ---------- vegetables ----------
  const VEG = {
    carrot: g => {
      for (const d of ['M48 -38 Q50 -80 30 -98', 'M54 -36 Q76 -80 70 -100', 'M58 -34 Q96 -60 106 -82']) line(g, d, '#2c6a22', 6);
      P(g, 'M-82 74 Q-70 52 36 -36 Q56 -50 66 -34 Q72 -20 52 -8 Q-40 62 -82 74 Z', '#f4a531', '#b8650c');
      line(g, 'M-20 26 l10 10 M8 4 l10 10 M-46 50 l8 8 M30 -16 l8 8', '#b8650c', 2.4);
    },
    tomato: g => {
      P(g, E(0, 12, 76, 64), '#e04b3a', '#a12a20');
      P(g, 'M0 -50 L-30 -60 L-12 -46 L-36 -36 L-6 -40 L0 -26 L6 -40 L36 -36 L12 -46 L30 -60 Z', '#5fae3a', '#2c6a22', 2.4);
      line(g, 'M0 -50 V-70', '#2c6a22', 5); line(g, 'M-48 -10 Q-44 -30 -26 -38', '#fff', 4);
    },
    potato: g => {
      P(g, 'M-86 6 C-90 -40 -40 -62 10 -54 C60 -48 92 -26 86 14 C80 52 30 64 -16 58 C-60 52 -84 40 -86 6 Z', '#c8a06a', '#7a5a2a');
      for (const [x, y] of [[-40, -20], [20, -30], [50, 10], [-10, 30], [-56, 24]]) line(g, `M${x - 4} ${y} q4 -4 8 0`, '#7a5a2a', 2.6);
    },
    onion: g => {
      P(g, 'M0 -82 Q8 -52 48 -24 Q82 8 62 48 Q42 76 0 76 Q-42 76 -62 48 Q-82 8 -48 -24 Q-8 -52 0 -82 Z', '#d9a25a', '#8a5a2a');
      line(g, 'M0 -70 Q-36 -10 -24 70 M0 -70 Q36 -10 24 70 M0 -60 V74', '#b07a3a', 2);
      line(g, 'M-14 76 l-6 12 M0 76 v14 M14 76 l6 12', '#8a5a2a', 2.4); line(g, 'M0 -82 l-4 -12 M0 -82 l6 -12', '#8a5a2a', 2.4);
    },
    broccoli: g => {
      P(g, 'M-22 82 L-14 -4 L14 -4 L22 82 Q0 90 -22 82 Z', '#9ccc6a', '#4a7a2a');
      line(g, 'M-8 6 L-30 -24 M8 6 L32 -20', '#4a7a2a', 4);
      for (const [x, y, r] of [[-50, -26, 28], [50, -24, 28], [-24, -52, 30], [24, -54, 30], [0, -28, 30], [0, -76, 22]]) P(g, C(x, y, r), '#4f9a3a', '#24561c', 2.6);
      for (const [x, y] of [[-50, -30], [20, -60], [0, -30], [46, -24], [-24, -54]]) line(g, `M${x - 6} ${y} q6 -6 12 0`, '#24561c', 2);
    },
    corn: g => {
      P(g, E(0, -6, 36, 84), '#ffd84a', '#b8900c');
      let d = ''; for (let y = -70; y <= 60; y += 16) d += `M${-Math.sqrt(Math.max(0, 1 - ((y + 6) / 84) ** 2)) * 34} ${y} H${Math.sqrt(Math.max(0, 1 - ((y + 6) / 84) ** 2)) * 34} `;
      line(g, d + 'M-12 -84 V74 M12 -84 V74', '#d9a510', 2);
      P(g, 'M-8 90 Q-80 30 -52 -60 Q-38 10 6 72 Z', '#7fbf4a', '#2c6a22', 2.6);
      P(g, 'M8 90 Q80 30 52 -60 Q38 10 -6 72 Z', '#5fae3a', '#2c6a22', 2.6);
    },
  };

  // ---------- musical instruments ----------
  const INSTR = {
    piano: g => {
      P(g, R(-150, -100, 300, 70, 8), '#3a3430', DK); P(g, R(-60, -136, 120, 40, 4), '#fffdf5');
      line(g, 'M-44 -122 H40 M-44 -110 H30', '#9aa3ad', 2);
      P(g, R(-150, -30, 300, 90, 4), '#ffffff'); let d = ''; for (let i = 1; i < 14; i++) d += `M${-150 + i * 300 / 14} -30 V60 `; line(g, d, DK, 2);
      for (let i = 0; i < 14; i++) if ([0, 1, 3, 4, 5].includes(i % 7) && i < 13) P(g, R(-150 + (i + 1) * 300 / 14 - 7, -30, 14, 52, 2), '#2f2a28', '#2f2a28', 2);
      line(g, 'M-140 60 V110 M140 60 V110', DK, 6);
    },
    drum: g => {
      line(g, 'M-90 -110 L-10 -40', '#c8935a', 7); line(g, 'M90 -110 L10 -40', '#c8935a', 7);
      P(g, 'M-100 -30 L-100 60 A100 22 0 0 0 100 60 L100 -30 Z', '#e04b3a');
      line(g, 'M-100 -10 L-64 66 M-60 -14 L-24 80 M-20 -10 L20 82 M20 -10 L56 80 M60 -14 L90 70', '#f3c33b', 3);
      P(g, E(0, -30, 100, 22), '#f6f2e8'); P(g, E(0, -30, 100, 22), null, '#c9d1d9', 5);
    },
    guitar: g => {
      P(g, R(-10, -140, 20, 140), '#7a4a2a', '#4a2a10'); P(g, R(-15, -172, 30, 36, 6), '#5a3a1a', '#4a2a10');
      for (const y of [-164, -152, -142]) { line(g, `M-15 ${y} h-8`, DK, 4); line(g, `M15 ${y} h8`, DK, 4); }
      P(g, 'M0 -10 C40 -10 70 10 60 45 C90 70 84 130 0 130 C-84 130 -90 70 -60 45 C-70 10 -40 -10 0 -10 Z', '#e0a050', '#7a4a1a');
      P(g, C(0, 52, 19), '#3a2a1a', '#3a2a1a'); P(g, R(-24, 92, 48, 9, 3), '#5a3a1a', '#4a2a10', 2);
      line(g, 'M-6 -168 V96 M-2 -168 V96 M2 -168 V96 M6 -168 V96', '#c9d1d9', 1.4);
    },
    flute: g => {
      P(g, R(-170, -11, 340, 22, 11), '#d5dce2'); P(g, E(-128, -4, 10, 5), '#7a848e', DK, 2);
      for (const x of [-40, -10, 20, 50, 80, 110, 140]) P(g, C(x, 0, 7), '#aeb7c0', DK, 2);
      line(g, 'M-166 -4 H-150 M150 -4 H166', '#fff', 3);
      for (const [x, y] of [[-60, -60], [30, -80]]) { P(g, E(x, y, 9, 7), '#2b6cc4', '#2b6cc4', 2); line(g, `M${x + 8} ${y} V${y - 34} l12 8`, '#2b6cc4', 3); }
    },
    violin: g => {
      line(g, 'M-120 120 L100 -130', '#7a4a2a', 5); line(g, 'M-112 122 L106 -124', '#e9e2d2', 2);
      P(g, R(-7, -150, 14, 80), '#2f2a28', '#2f2a28'); P(g, C(0, -158, 11), '#7a3a1a', '#4a2a10');
      P(g, 'M0 -80 C40 -80 50 -50 40 -30 C30 -15 30 5 42 20 C62 50 50 100 0 100 C-50 100 -62 50 -42 20 C-30 5 -30 -15 -40 -30 C-50 -50 -40 -80 0 -80 Z', '#b5562a', '#5a2a10');
      line(g, 'M-20 4 Q-26 20 -18 40 M20 4 Q26 20 18 40', '#3a1a0a', 3); P(g, R(-18, 46, 36, 6, 2), '#e8c48e', '#5a3a1a', 2);
      P(g, R(-8, 64, 16, 30, 4), '#2f2a28', '#2f2a28', 2); line(g, 'M-4 -150 V66 M0 -150 V66 M4 -150 V66', '#c9d1d9', 1.2);
    },
  };

  // ---------- clothes (modest) ----------
  const CLOTH = {
    shirt: g => {
      P(g, 'M-40 -92 Q0 -70 40 -92 L100 -62 L80 -18 L60 -30 L60 100 L-60 100 L-60 -30 L-80 -18 L-100 -62 Z', '#7fb7ea', '#2b6cc4');
      P(g, 'M-40 -92 L-6 -60 L-20 -52 Z M40 -92 L6 -60 L20 -52 Z', '#ffffff', '#2b6cc4', 2.4);
      line(g, 'M0 -58 V96', '#2b6cc4', 2); for (const y of [-40, -10, 20, 50, 80]) P(g, C(6, y, 3), '#fff', '#2b6cc4', 2);
      P(g, R(-46, -26, 28, 26, 3), null, '#2b6cc4', 2.4);
    },
    dress: g => {
      P(g, 'M-28 -100 Q0 -86 28 -100 L52 -90 L96 38 L76 46 L42 -45 L36 -10 L80 125 L-80 125 L-36 -10 L-42 -45 L-76 46 L-96 38 L-52 -90 Z', '#e07a9a', '#9a3a5a');
      line(g, 'M-28 -100 Q0 -76 28 -100', '#9a3a5a', 2.6); line(g, 'M-36 -10 H36', '#9a3a5a', 4);
      line(g, 'M-74 104 Q-56 112 -38 104 Q-20 112 0 104 Q20 112 38 104 Q56 112 74 104', '#ffffff', 3);
    },
    jacket: g => {
      P(g, 'M-45 -96 L-100 -70 L-112 82 L-86 86 L-72 -20 L-70 112 L70 112 L72 -20 L86 86 L112 82 L100 -70 L45 -96 Q0 -64 -45 -96 Z', '#c0392b', '#6a1a12');
      P(g, 'M-45 -96 L-30 -52 L0 -66 Z M45 -96 L30 -52 L0 -66 Z', '#e04b3a', '#6a1a12', 2.4);
      line(g, 'M0 -66 V112', '#3a3430', 3); P(g, R(-4, -60, 8, 14, 2), '#c9d1d9', DK, 2);
      line(g, 'M-58 40 L-26 40 M58 40 L26 40 M-110 70 H-88 M110 70 H88', '#6a1a12', 3);
    },
    shoe: g => {
      P(g, 'M-110 40 L-110 -10 Q-100 -42 -60 -40 L-24 -52 Q10 -20 62 -12 Q112 -2 116 30 L116 40 Z', '#2b6cc4', '#1a3a6a');
      P(g, R(-116, 38, 236, 18, 9), '#ffffff', DK, 2.6);
      line(g, 'M-20 -44 L4 -26 M-10 -50 L14 -30 M0 -54 L22 -34', '#ffffff', 3.4);
      line(g, 'M60 -10 Q80 20 116 28 M-110 10 Q-80 18 -60 4', '#1a3a6a', 2.4);
    },
    cap: g => {
      P(g, 'M74 6 Q132 6 152 28 Q120 38 60 26 Z', '#a12a20', '#5a1a12');
      P(g, 'M-84 24 Q-86 -70 0 -72 Q74 -70 84 24 Z', '#e04b3a', '#6a1a12');
      line(g, 'M0 -72 Q-10 -20 -14 24 M0 -72 Q36 -30 42 24', '#a12a20', 2.4); P(g, E(0, -74, 10, 5), '#a12a20', '#5a1a12', 2);
      line(g, 'M-84 24 Q0 38 84 24', '#6a1a12', 3);
    },
  };

  const BALL = {
    football: g => {
      P(g, C(0, 0, 80), '#ffffff'); P(g, poly(0, 0, 24, 5), '#2f3a45');
      for (let i = 0; i < 5; i++) {
        const a = (-90 + i * 72) * Math.PI / 180, b = (-54 + i * 72) * Math.PI / 180;
        line(g, `M${24 * Math.cos(a)} ${24 * Math.sin(a)} L${54 * Math.cos(a)} ${54 * Math.sin(a)}`, DK, 2.4);
        P(g, poly(66 * Math.cos(b), 66 * Math.sin(b), 13, 5, -54 + i * 72 + 180), '#2f3a45', DK, 2);
      }
    },
    basketball: g => { P(g, C(0, 0, 80), '#f08a2c', '#7a3a10'); line(g, 'M0 -80 V80 M-80 0 H80 M-56 -57 Q-20 0 -56 57 M56 -57 Q20 0 56 57', '#3a2010', 3); },
    cricket: g => {
      P(g, C(0, 0, 70), '#c0392b', '#6a1a12'); line(g, 'M-26 -64 Q-2 0 -26 64 M-12 -69 Q12 0 -12 69', '#f6f2e8', 2.6);
      let d = ''; for (let y = -50; y <= 50; y += 14) { const x = -14 + 12 * (1 - (y / 66) ** 2) - 5; d += `M${x - 6} ${y} l5 0 M${x + 9} ${y} l5 0 `; } line(g, d, '#f6f2e8', 2);
      line(g, 'M-44 -30 Q-40 -46 -26 -52', '#fff', 3);
    },
    tennis: g => { P(g, C(0, 0, 70), '#d6e84a', '#7a8a1a'); line(g, 'M-50 -49 Q-14 0 -50 49 M50 -49 Q14 0 50 49', '#ffffff', 5); },
    volleyball: g => {
      P(g, C(0, 0, 80), '#fdf6dc');
      mk('path', { d: 'M0 0 Q-40 -30 -30 -76 A80 80 0 0 1 40 -69 Q16 -30 0 0 Z', fill: '#7fb7ea', filter: 'url(#wc)', class: 'fillable' }, g);
      mk('path', { d: 'M0 0 Q48 -6 76 24 A80 80 0 0 1 20 77 Q-6 40 0 0 Z', fill: '#ffd84a', filter: 'url(#wc)', class: 'fillable' }, g);
      line(g, 'M0 0 Q-40 -30 -30 -76 M0 0 Q48 -6 76 24 M0 0 Q-6 40 20 77 M0 0 Q16 -30 40 -69 M0 0 Q-44 30 -78 18', DK, 2.6); line(g, C(0, 0, 80), DK, 3);
    },
  };

  // music staff: letter → y (E is the bottom line)
  const NOTE_Y = { C: 60, D: 50, E: 40, F: 30, G: 20, A: 10, B: 0, C5: -10, D5: -20, E5: -30, F5: -40, G5: -50 };

  Object.assign(window.RECIPES, {
    // ---------- kitchen ----------
    // "stove cx cy size" — cooker: pot on flames, steam rising
    stove: make(280, g => {
      P(g, R(-105, 20, 210, 120, 6), '#eef1f4'); P(g, R(-85, 52, 170, 80, 6), '#d9dee3'); P(g, R(-65, 72, 130, 48, 4), '#4a5560');
      line(g, 'M-55 62 H55', DK, 5); for (const x of [-70, -35, 35, 70]) knob(g, x, 36, 6);
      for (const x of [-42, -14, 14, 42]) P(g, `M${x - 9} 8 Q${x - 11} -4 ${x} -16 Q${x + 11} -4 ${x + 9} 8 Z`, '#f4a531', '#d0551f', 2);
      P(g, R(-110, 8, 220, 12, 3), '#9aa3ad');
      P(g, 'M-58 -76 L-52 -24 Q-50 -18 -44 -18 L44 -18 Q50 -18 52 -24 L58 -76 Z', '#c9d1d9');
      line(g, 'M-57 -66 H-74 V-56 H-56 M57 -66 H74 V-56 H56', DK, 3);
      P(g, 'M-62 -76 Q0 -96 62 -76 Z', '#aeb7c0'); knob(g, 0, -90, 6, '#3a4450');
      steam(g, 0, -100);
    }),
    // "fridge cx cy height" — two-door fridge with magnets and a note
    fridge: make(260, g => {
      P(g, R(-65, -125, 130, 245, 12), '#f2f5f7'); line(g, 'M-65 -40 H65', DK, 3);
      P(g, R(-52, -110, 8, 50, 4), '#9aa3ad', DK, 2); P(g, R(-52, -28, 8, 64, 4), '#9aa3ad', DK, 2);
      P(g, R(-50, 120, 16, 8), '#3a4450', DK, 2); P(g, R(34, 120, 16, 8), '#3a4450', DK, 2);
      P(g, 'M4 -20 L44 -24 L46 12 L6 16 Z', '#fff3a6', DK, 2); line(g, 'M12 -10 H38 M12 0 H34', '#9aa3ad', 2);
      P(g, C(25, -22, 6), '#e04b3a', DK, 2); P(g, C(30, -96, 7), '#5fae3a', DK, 2); P(g, C(10, -80, 6), '#ffd84a', DK, 2);
    }),
    // "microwave cx cy width" — microwave: bowl on plate inside, timer
    microwave: make(240, g => {
      P(g, R(-120, -70, 240, 140, 12), '#e8ecef'); P(g, R(-105, -55, 150, 110, 8), '#ffe8a8');
      P(g, E(-30, 30, 56, 10), '#cfd6dc', DK, 2); P(g, 'M-62 26 Q-30 -12 2 26 Z', '#e04b3a', DK, 2.4); steam(g, -30, 0, [-12, 12], .6);
      P(g, R(60, -54, 46, 22, 3), '#2a3a2a', DK, 2); label(g, 83, -37, '1:30', '#7fe08a', 16, 'middle');
      for (const x of [68, 83, 98]) for (const y of [-14, 2, 18]) P(g, C(x, y, 4.5), '#c9d1d9', DK, 1.6);
      P(g, R(60, 34, 46, 16, 4), '#5fae3a', DK, 2); line(g, 'M-100 70 v8 M100 70 v8', DK, 6);
    }),
    // "kettle cx cy height" — electric kettle on its base, steam from spout
    kettle: make(220, g => {
      line(g, 'M40 -40 Q96 -40 86 20 Q80 50 58 50', DK, 10); line(g, 'M40 -40 Q96 -40 86 20 Q80 50 58 50', '#c0392b', 5);
      P(g, 'M-50 -12 L-94 -46 L-86 -54 L-42 -32 Z', '#e04b3a');
      P(g, 'M-60 72 Q-72 -10 -40 -50 L40 -50 Q72 -10 60 72 Z', '#e04b3a'); line(g, 'M-44 -20 Q-56 20 -46 56', '#fff', 4);
      P(g, 'M-40 -50 Q0 -70 40 -50 Z', '#c0392b'); knob(g, 0, -64, 6, '#3a4450');
      P(g, R(-75, 70, 150, 16, 6), '#4a5560'); steam(g, -98, -60, [-8, 8], .8);
    }),
    // "toaster cx cy width" — toaster with two slices popping up
    toaster: make(240, g => {
      for (const x of [-68, 22]) { P(g, `M${x} -36 L${x} -80 Q${x} -98 ${x + 23} -98 Q${x + 46} -98 ${x + 46} -80 L${x + 46} -36 Z`, '#e9b86a', '#a8682a'); P(g, `M${x + 6} -40 L${x + 6} -78 Q${x + 6} -90 ${x + 23} -90 Q${x + 40} -90 ${x + 40} -78 L${x + 40} -40 Z`, '#f6dfae', '#e0b070', 1.5); }
      P(g, R(-100, -44, 200, 120, 30), '#c9d1d9'); P(g, R(-72, -44, 54, 10, 4), '#3a4450', DK, 2); P(g, R(18, -44, 54, 10, 4), '#3a4450', DK, 2);
      line(g, 'M-76 -16 Q-80 20 -70 50', '#fff', 4); P(g, R(100, -6, 18, 12, 3), '#3a4450', DK, 2); knob(g, 60, 40, 9, '#3a4450');
      line(g, 'M-80 76 v8 M80 76 v8', DK, 6);
    }),
    // "oven cx cy size" — wall oven, warm glow, cake baking inside
    oven: make(240, g => {
      P(g, R(-110, -110, 220, 220, 10), '#e8ecef'); P(g, R(-30, -102, 60, 16, 3), '#2a3a2a', DK, 2); label(g, 0, -89, '180°', '#ffb43a', 14, 'middle');
      for (const x of [-80, -55, 55, 80]) knob(g, x, -94, 7);
      P(g, R(-95, -72, 190, 168, 8), '#d9dee3'); line(g, 'M-70 -60 H70', DK, 6);
      P(g, R(-75, -46, 150, 120, 6), '#ffcf7a'); line(g, 'M-68 34 H68', '#7a848e', 3);
      P(g, 'M-40 32 Q-40 -8 0 -10 Q40 -8 40 32 Z', '#d99a4e', '#8a5020');
      line(g, 'M-56 -30 q6 -8 0 -16 M56 -30 q6 -8 0 -16 M-56 60 H56', '#e9603a', 2.4);
    }),
    // "sink cx cy width" — kitchen sink and tap; loop flow runs the water
    sink: make(300, g => {
      P(g, R(-140, 14, 280, 96), '#f2ead9', '#7a5a3a'); line(g, 'M0 14 V110', '#7a5a3a', 2.4); P(g, C(-14, 50, 4), '#9aa3ad', DK, 2); P(g, C(14, 50, 4), '#9aa3ad', DK, 2);
      P(g, 'M-150 0 L-130 -30 L130 -30 L150 0 Z', '#d9c7a8', '#7a5a3a'); P(g, R(-150, 0, 300, 14, 3), '#c8b090', '#7a5a3a');
      P(g, E(0, -15, 82, 11), '#9fb0bd');
      line(g, 'M0 -26 V-96 Q0 -104 10 -104 L34 -104 Q44 -104 44 -94 V-86', DK, 14); line(g, 'M0 -26 V-96 Q0 -104 10 -104 L34 -104 Q44 -104 44 -94 V-86', '#d5dce2', 8);
      P(g, C(-24, -34, 7), '#e04b3a', DK, 2); P(g, C(24, -34, 7), '#4f93d6', DK, 2);
      line(g, 'M40 -84 V-18 M48 -84 V-16', '#4f93d6', 3, { 'stroke-dasharray': '10 6' }); line(g, 'M30 -14 q-6 -6 -12 0 M58 -14 q6 -6 12 0', '#4f93d6', 2.4);
    }),
    // "washer cx cy height spin=1" — front-loading washing machine; spin=1 turns the clothes
    washer: make(260, (g, o) => {
      P(g, R(-100, -120, 200, 240, 12), '#f2f5f7'); line(g, 'M-100 -82 H100', DK, 3);
      P(g, R(-86, -110, 62, 18, 3), '#2a3a2a', DK, 2); knob(g, 64, -101, 11);
      P(g, C(0, 22, 74), '#c9d1d9'); P(g, C(0, 22, 58), '#bfe3fa');
      const c = mk('g', {}, g);
      P(c, E(-18, 36, 24, 12), '#e04b3a', DK, 2); P(c, E(16, 4, 22, 10), '#ffd84a', DK, 2); P(c, E(18, 44, 16, 10), '#5fae3a', DK, 2);
      for (const [x, y] of [[-20, 0], [-30, 16], [30, 22]]) line(c, C(x, y, 4), '#fff', 2);
      if (+o.spin) spin(c, 0, 22, 2);
      line(g, 'M-36 -6 Q-30 -22 -14 -26', '#fff', 4);
      line(g, 'M-90 120 v6 M90 120 v6', DK, 6);
    }),
    // "ceilingfan cx cy size spin=1" — ceiling fan seen from below; spin=1 turns the blades
    ceilingfan: ([cx, cy, size = 300], o, t, parent) => {
      const s = size / 300, g = mk('g', { transform: `translate(${cx} ${cy}) scale(${s})` }, parent), b = mk('g', {}, g);
      for (let i = 0; i < 4; i++) { const r = mk('g', { transform: `rotate(${i * 90 + 20})` }, b); P(r, 'M24 -12 Q90 -30 142 -18 Q152 0 142 18 Q90 30 24 12 Z', '#c8935a', '#6a4a2a'); line(r, 'M40 0 H128', '#a8733a', 2); }
      P(g, C(0, 0, 30), '#d5dce2'); P(g, C(0, 0, 14), '#fff3a6', DK, 2);
      if (+o.spin) spin(b, 0, 0, 1.6);
      return g;
    },
    // "aircon cx cy width" — wall air conditioner blowing cool air
    aircon: make(320, g => {
      P(g, R(-160, -60, 320, 90, 20), '#f6f8fa'); line(g, 'M-140 14 H140', '#aeb7c0', 2);
      P(g, 'M-140 30 L140 30 L128 46 L-128 46 Z', '#dfe5ea'); label(g, 116, -24, '18°', '#2b6cc4', 20, 'middle'); P(g, C(140, -30, 4), '#5fae3a', DK, 1.6);
      const air = mk('g', {}, g);
      for (const x of [-100, -40, 20, 80]) line(air, `M${x} 60 q12 14 0 28 q-12 14 0 28`, INK.sky, 3);
      mk('animate', { attributeName: 'opacity', values: '1;.4;1', dur: '2s', repeatCount: 'indefinite' }, air);
    }),
    // ---------- home ----------
    // "room cx cy width" — bedroom: window with curtains, bed, desk and chair
    room: make(480, g => {
      P(g, R(-240, -135, 480, 215), '#fdf3e1', '#b8a080'); P(g, 'M-240 80 H240 V135 H-240 Z', '#d9b48a', '#8a6a3a');
      line(g, 'M-240 106 H240 M-160 80 L-170 135 M-40 80 L-44 135 M80 80 L82 135 M200 80 L206 135', '#b8905a', 2);
      P(g, R(-205, -112, 120, 92), '#bfe3fa'); line(g, 'M-145 -112 V-20 M-205 -66 H-85', DK, 3);
      P(g, 'M-218 -118 L-186 -118 Q-190 -60 -202 -14 L-218 -14 Z', '#e07a6a', '#9a3a2a', 2.4); P(g, 'M-72 -118 L-104 -118 Q-100 -60 -88 -14 L-72 -14 Z', '#e07a6a', '#9a3a2a', 2.4);
      line(g, 'M-224 -120 H-66', '#7a5a3a', 4);
      P(g, R(-225, 10, 150, 10, 2), '#c8935a', '#6a4a2a'); line(g, 'M-215 20 V80 M-85 20 V80', '#6a4a2a', 5);
      P(g, R(-210, -6, 40, 16, 2), '#7fb7ea', DK, 2); P(g, 'M-110 -30 L-120 -8 L-100 -8 Z', '#ffd84a', DK, 2); line(g, 'M-110 -8 V10', DK, 3);
      P(g, R(-64, 30, 40, 8, 2), '#c8935a', '#6a4a2a', 2.4); line(g, 'M-24 34 V-10 M-60 38 V80 M-28 38 V80', '#6a4a2a', 4);
      P(g, R(40, -30, 18, 110, 6), '#a8682a', '#5a3a1a'); P(g, R(52, 28, 176, 38, 8), '#7fb7ea', '#2b6cc4');
      P(g, E(84, 20, 26, 11), '#ffffff'); line(g, 'M100 28 Q120 44 100 66', '#2b6cc4', 2); line(g, 'M60 66 V84 M220 66 V84', '#5a3a1a', 5);
      P(g, R(110, -100, 70, 50, 2), '#fffaf0', '#a8682a'); P(g, 'M116 -56 L140 -84 L156 -66 L166 -76 L176 -56 Z', '#7fbf4a', '#2c6a22', 2);
    }),
    // "sofa cx cy width" — three-seat sofa with cushions
    sofa: make(320, g => {
      P(g, R(-150, -64, 300, 76, 24), '#5f8fc9', '#1f4a7a'); P(g, R(-150, 26, 300, 40, 6), '#4f7fb9', '#1f4a7a');
      for (const x of [-132, -43, 46]) P(g, R(x, -4, 86, 34, 10), '#7fa8dc', '#1f4a7a', 2.6);
      P(g, R(-176, -26, 42, 96, 18), '#5f8fc9', '#1f4a7a'); P(g, R(134, -26, 42, 96, 18), '#5f8fc9', '#1f4a7a');
      P(g, 'M-120 -40 L-80 -50 L-74 -12 L-116 -6 Z', '#f4a531', '#b8650c', 2.4);
      line(g, 'M-150 70 v14 M150 70 v14', '#3a2a20', 6);
    }),
    // "lamp cx cy height k=on|off" — table lamp; on glows with rays
    lamp: make(240, (g, o) => {
      const on = o.k !== 'off';
      if (on) { mk('path', { d: C(0, -20, 92), fill: '#fff3a6', opacity: .55, class: 'fillable', filter: 'url(#wc)' }, g); line(g, 'M-70 -10 l-24 22 M70 -10 l24 22 M-30 6 l-8 30 M30 6 l8 30', '#f3c33b', 3); }
      P(g, 'M-30 96 Q-48 50 -16 18 L16 18 Q48 50 30 96 Z', '#7fb7ea'); line(g, 'M0 18 V-30', DK, 5);
      P(g, 'M-62 -6 L-38 -104 L38 -104 L62 -6 Z', on ? '#ffd84a' : '#e8e0c8', '#8a6a10'); P(g, R(-40, 94, 80, 10, 4), '#4a5560');
    }),
    // "door cx cy height k=closed|open" — wooden door, lever handle and keyhole lock
    door: make(300, (g, o) => {
      P(g, R(-82, -150, 164, 300), '#a8682a', '#5a3a1a');
      if (o.k === 'open') {
        P(g, R(-70, -140, 140, 290), '#fff3c4', '#5a3a1a', 2); line(g, 'M-70 150 L70 150 M-30 60 L20 150', '#e8d8a0', 2);
        P(g, 'M-70 -140 L-18 -122 L-18 132 L-70 150 Z', '#d99a5e', '#5a3a1a'); P(g, R(-34, -6, 12, 6, 2), '#f3c33b', DK, 2);
      } else {
        P(g, R(-70, -140, 140, 290, 3), '#d99a5e', '#5a3a1a'); P(g, R(-50, -120, 100, 110, 6), null, '#8a5a2a', 2.4); P(g, R(-50, 14, 100, 116, 6), null, '#8a5a2a', 2.4);
        P(g, R(36, -12, 16, 32, 5), '#f3c33b', '#8a6a10', 2); P(g, R(18, -8, 34, 9, 4), '#f3c33b', '#8a6a10', 2);
        P(g, 'M44 6 a4 4 0 1 1 0.01 0 M42 9 L40 17 L48 17 L46 9', '#2f2a28', '#2f2a28', 2);
      }
    }),
    // ---------- food ----------
    fruit: make(200, (g, o) => pick(FRUIT, o.k, 'apple', 'fruit')(g)),
    veg: make(200, (g, o) => pick(VEG, o.k, 'carrot', 'vegetable')(g)),
    // "bread cx cy width" — loaf with scored crust and a slice
    bread: make(280, g => {
      P(g, 'M-136 40 Q-146 -36 -90 -48 Q-40 -58 10 -48 Q60 -36 54 40 Z', '#d99a4e', '#8a5020');
      line(g, 'M-110 -20 l20 -24 M-76 -14 l20 -30 M-42 -12 l20 -30 M-8 -14 l20 -26', '#8a5020', 3); line(g, 'M-136 40 H54', '#8a5020', 3);
      P(g, 'M70 62 L70 -6 Q56 -36 90 -42 Q106 -60 128 -44 Q160 -38 148 -6 L148 62 Z', '#c98a3a', '#8a5020');
      P(g, 'M80 54 L80 -2 Q70 -26 94 -32 Q108 -46 124 -34 Q148 -30 138 -2 L138 54 Z', '#f6dfae', '#e0b070', 1.5);
    }),
    // "ricebowl cx cy size" — bowl of steaming white rice
    ricebowl: make(240, g => {
      P(g, 'M-100 0 Q-90 -50 -40 -54 Q0 -74 40 -54 Q90 -50 100 0 Z', '#ffffff', '#9aa3ad', 2.4);
      let d = ''; for (const [x, y] of [[-60, -24], [-30, -40], [0, -54], [30, -38], [60, -22], [-10, -20], [20, -14], [-44, -6], [50, -6]]) d += `M${x} ${y} l7 -3 `; line(g, d, '#c9d1d9', 3);
      P(g, 'M-104 0 Q-96 84 0 88 Q96 84 104 0 Z', '#7fb7ea', '#2b6cc4'); line(g, 'M-96 26 Q0 44 96 26', '#2b6cc4', 3);
      P(g, R(-34, 84, 68, 12, 3), '#5f97cf', '#2b6cc4', 2.4); line(g, 'M-104 0 Q0 16 104 0', '#2b6cc4', 3);
      steam(g, 0, -70);
    }),
    // "egg cx cy height k=whole|cracked" — an egg, or cracked open with the yolk dropping out
    egg: make(200, (g, o) => {
      if (o.k === 'cracked') {
        P(g, 'M-64 30 L-48 12 L-32 30 L-16 10 L0 30 L16 10 L32 30 L48 12 L64 30 C62 74 32 90 0 90 C-32 90 -62 74 -64 30 Z', '#f5e6c8', '#8a6a3a');
        const top = mk('g', { transform: 'translate(-24 -54) rotate(-28)' }, g);
        P(top, 'M-50 0 L-36 16 L-22 -2 L-6 16 L10 -2 L26 16 L40 -2 L50 0 C46 -46 26 -66 0 -66 C-26 -66 -46 -46 -50 0 Z', '#f5e6c8', '#8a6a3a');
        P(g, E(18, -6, 30, 18), '#ffffff', '#c9d1d9', 2); P(g, C(18, -8, 14), '#f7a81c', '#c97a10', 2.4);
      } else {
        P(g, 'M0 -84 C46 -84 70 -6 66 30 C62 72 32 88 0 88 C-32 88 -62 72 -66 30 C-70 -6 -46 -84 0 -84 Z', '#f5e6c8', '#8a6a3a');
        line(g, 'M-34 -30 Q-30 -54 -14 -64', '#fff', 5);
      }
    }),
    // "milk cx cy height |text" — milk carton; |text replaces MILK
    milk: make(240, (g, o, t) => {
      P(g, 'M50 -50 L80 -70 L80 90 L50 110 Z', '#dfe5ea'); P(g, 'M50 -50 L40 -90 L68 -106 L80 -70 Z', '#5f97cf');
      P(g, R(-50, -50, 100, 160), '#ffffff'); P(g, 'M-50 -50 L-40 -90 L40 -90 L50 -50 Z', '#7fb7ea');
      P(g, R(-40, -100, 80, 10, 2), '#7fb7ea', DK, 2.4); P(g, R(-50, 4, 100, 46), '#7fb7ea', '#2b6cc4', 2);
      label(g, 0, 37, (t || 'MILK').toUpperCase(), '#ffffff', 26, 'middle'); P(g, 'M0 66 Q-14 84 0 92 Q14 84 0 66 Z', '#bfe3fa', '#2b6cc4', 2);
    }),
    // "cheese cx cy width" — wedge of cheese with holes
    cheese: make(240, g => {
      P(g, 'M90 -50 L115 -14 L115 56 L90 20 Z', '#e0aa20', '#8a6a10');
      P(g, 'M-110 10 L90 -50 L115 -14 Z', '#ffe58a', '#8a6a10');
      P(g, 'M-110 10 L115 -14 L115 56 L-110 70 Z', '#ffd84a', '#8a6a10');
      for (const [x, y, rx, ry] of [[-60, 40, 10, 8], [0, 22, 14, 10], [60, 40, 11, 9], [26, 50, 6, 5], [90, 16, 7, 6]]) P(g, E(x, y, rx, ry), '#e9b52a', '#a8800c', 2);
      P(g, E(40, -26, 9, 4), '#e9b52a', '#a8800c', 2);
    }),
    // "waterglass cx cy height level=0-100" — glass of water filled to level
    waterglass: make(200, (g, o) => {
      const lv = Math.max(0, Math.min(100, o.level == null ? 70 : +o.level)) / 100, y = 86 - 168 * lv, xe = yy => 55 - 10 * (yy + 90) / 180;
      if (lv > 0) { P(g, `M${-xe(y)} ${y} L${xe(y)} ${y} L45 90 L-45 90 Z`, '#7fc4ef', '#4f93d6', 2); line(g, `M${-xe(y)} ${y} Q0 ${y + 8} ${xe(y)} ${y}`, '#4f93d6', 2); }
      for (const [x, yy] of [[-12, 60], [10, 40], [-4, 20]]) if (yy > y + 10) line(g, C(x, yy, 4), '#ffffff', 2);
      P(g, 'M-55 -90 L55 -90 L45 90 L-45 90 Z', null, '#7a8a9a', 3); line(g, 'M-40 -70 L-34 60', '#ffffff', 4);
    }),
    // "lunchbox cx cy width" — open lunchbox: cheese sandwich, apple, carrot sticks
    lunchbox: make(300, g => {
      P(g, R(-140, -70, 280, 150, 18), '#5fae3a', '#24561c'); P(g, R(-126, -56, 252, 122, 12), '#f6f8fa', '#24561c', 2.4);
      line(g, 'M10 -56 V66 M10 4 H126', '#24561c', 2.4);
      P(g, 'M-112 52 L-112 -40 L-12 52 Z', '#f6dfae', '#a8682a'); line(g, 'M-106 -30 L-20 48', '#ffd84a', 5); line(g, 'M-112 -40 L-12 52', '#a8682a', 3);
      P(g, 'M68 -26 C52 -50 22 -40 24 -18 C26 0 46 4 68 -4 C90 4 110 0 112 -18 C114 -40 84 -50 68 -26 Z', '#e04b3a', '#a12a20', 2.4); line(g, 'M68 -26 l4 -14', '#6b4a2a', 3);
      for (const y of [22, 34, 46]) P(g, R(30, y, 80, 8, 4), '#f4a531', '#b8650c', 2);
    }),
    // "recipe cx cy width | Title: item, item" — recipe card: title and ingredient list from |text
    recipe: make(380, (g, o, t) => {
      const [title, rest] = (t || 'Pancakes: 1 cup flour, 1 cup milk, 2 eggs, 1 spoon sugar').split(':');
      P(g, R(-190, -120, 380, 240, 10), '#fffaf0', '#a8682a'); P(g, R(-190, -120, 380, 46, 10), '#f4a531', '#a8682a', 2);
      label(g, -170, -88, (title || '').trim(), '#ffffff', 28);
      list(rest).slice(0, 5).forEach((s, i) => { line(g, `M-168 ${-46 + i * 34} l.01 0`, '#d27b0c', 8); label(g, -152, -38 + i * 34, s, '#2b6cc4', 22); });
      P(g, 'M120 40 Q120 90 150 90 Q180 90 180 40 Z', '#7fb7ea', '#2b6cc4', 2.4); line(g, 'M160 0 L140 60', '#a8682a', 4);
    }),
    // "measuring cx cy width k=cups|spoons" — measuring jug with cup marks, or a set of spoons
    measuring: make(300, (g, o) => {
      if (o.k === 'spoons') {
        [[-60, 34, '1 tbsp'], [0, 26, '1 tsp'], [60, 20, '½ tsp']].forEach(([y, r, txt]) => {
          P(g, R(-120 + r * 2, y - 7, 210 - r * 2, 14, 7), '#c9d1d9'); P(g, E(-120 + r, y, r, r * .7), '#e8ecef'); label(g, 108, y + 7, txt, '#2b6cc4', 20);
        });
      } else {
        line(g, 'M62 -50 Q120 -44 100 30 L60 44', DK, 12); line(g, 'M62 -50 Q120 -44 100 30 L60 44', '#7fb7ea', 6);
        P(g, 'M-24 -10 L54 -10 L48 92 L-62 92 L-68 -10 Z', '#ffffff', '#c9d1d9', 2);
        P(g, 'M-90 -82 L70 -82 L58 96 L-74 96 L-80 -60 Z', null, '#7a8a9a', 3);
        [[-50, '1 cup'], [0, '½'], [46, '¼']].forEach(([y, txt]) => { line(g, `M-74 ${y} h26`, '#c0392b', 3); label(g, -42, y + 7, txt, '#c0392b', 18); });
      }
    }),
    // ---------- school ----------
    // "backpack cx cy height" — school backpack with front pocket and zip
    backpack: make(260, g => {
      line(g, 'M-24 -110 Q0 -138 24 -110', DK, 6);
      P(g, 'M-80 108 L-80 -40 Q-80 -110 0 -110 Q80 -110 80 -40 L80 108 Q80 120 68 120 L-68 120 Q-80 120 -80 108 Z', '#e04b3a', '#6a1a12');
      line(g, 'M-68 -42 Q0 -104 68 -42', '#6a1a12', 2.4, { 'stroke-dasharray': '6 5' }); P(g, R(56, -54, 8, 20, 3), '#c9d1d9', DK, 2);
      P(g, R(-58, 18, 116, 84, 16), '#c0392b', '#6a1a12'); line(g, 'M-50 38 H50', '#6a1a12', 2.4, { 'stroke-dasharray': '6 5' });
      P(g, R(-12, 40, 8, 18, 3), '#c9d1d9', DK, 2); P(g, R(-30, -20, 60, 14, 6), '#ffd84a', '#8a6a10', 2);
    }),
    // "pencilcase cx cy width" — zipped pencil case with pencils and ruler sticking out
    pencilcase: make(320, g => {
      const pencil = (x, a, c) => { const p = mk('g', { transform: `translate(${x} 0) rotate(${a})` }, g); P(p, R(-7, -96, 14, 100), c, DK, 2.4); P(p, 'M-7 -96 L0 -118 L7 -96 Z', '#f6dfae', DK, 2); line(p, 'M-2 -112 L0 -118 L2 -112', DK, 3); };
      pencil(-80, -14, '#ffd84a'); pencil(-50, -4, '#e04b3a'); pencil(70, 10, '#5fae3a');
      const r = mk('g', { transform: 'translate(10 0) rotate(6)' }, g); P(r, R(-12, -110, 24, 110, 2), '#f6e7b0', '#8a6a10', 2.4);
      line(r, 'M-12 -96 h8 M-12 -84 h5 M-12 -72 h8 M-12 -60 h5 M-12 -48 h8 M-12 -36 h5', '#8a6a10', 2);
      P(g, R(-150, -24, 300, 84, 30), '#7fb7ea', '#2b6cc4'); line(g, 'M-126 -12 H126', '#2b6cc4', 2.4, { 'stroke-dasharray': '6 5' });
      P(g, R(116, -18, 22, 12, 4), '#ffd84a', '#8a6a10', 2);
    }),
    // "notebook cx cy width |line, line" — spiral notebook page; |text written on its lines
    notebook: make(320, (g, o, t) => {
      P(g, R(-130, -110, 260, 220, 8), '#fffdf5', '#7a8a9a'); let d = ''; for (let y = -60; y <= 90; y += 30) d += `M-120 ${y} H120 `; line(g, d, '#9fc4e6', 2);
      line(g, 'M-90 -90 V104', '#e07a6a', 2); for (let x = -110; x <= 110; x += 22) line(g, `M${x} -102 q0 -18 6 -18 q6 0 6 18`, DK, 2.4);
      list(t).slice(0, 6).forEach((s, i) => label(g, -82, -66 + i * 30, s, '#2b6cc4', 24));
    }),
    // "board cx cy width k=black|white |text" — chalkboard or whiteboard with |text (commas = new lines)
    board: make(440, (g, o, t) => {
      const white = o.k === 'white', ls = list(t);
      P(g, R(-220, -130, 440, 250, 8), white ? '#c9d1d9' : '#a8682a', white ? '#5a6570' : '#5a3a1a');
      P(g, R(-205, -115, 410, 220, 4), white ? '#ffffff' : '#2f5d3a', white ? '#9aa3ad' : '#1a3a20', 2);
      ls.slice(0, 4).forEach((s, i) => label(g, 0, -5 + (i - (Math.min(ls.length, 4) - 1) / 2) * 50 + 12, s, white ? '#2b6cc4' : '#f4f4ee', 42, 'middle'));
      P(g, R(-190, 118, 380, 10, 3), white ? '#c9d1d9' : '#a8682a', DK, 2);
      if (white) { P(g, R(-150, 106, 50, 12, 5), '#e04b3a', DK, 2); P(g, R(-90, 106, 50, 12, 5), '#2b6cc4', DK, 2); }
      else { P(g, R(-150, 108, 30, 8, 3), '#ffffff', DK, 2); P(g, R(-110, 108, 22, 8, 3), '#ffd84a', DK, 2); }
      P(g, R(100, 102, 60, 16, 3), '#5a4a3a', DK, 2);
    }),
    // ---------- sports ----------
    ball: make(200, (g, o) => pick(BALL, o.k, 'football', 'ball')(g)),
    // "cricketbat cx cy height rot=deg" — cricket bat with a red ball
    cricketbat: make(300, g => {
      P(g, R(-9, -142, 18, 110, 6), '#4a5560'); line(g, 'M-9 -128 l18 8 M-9 -112 l18 8 M-9 -96 l18 8 M-9 -80 l18 8 M-9 -64 l18 8', '#9aa3ad', 2);
      P(g, 'M-24 -34 L24 -34 L30 126 Q0 140 -30 126 Z', '#efd29a', '#8a6a3a'); line(g, 'M0 -20 V120', '#c8a060', 2.4);
      P(g, C(70, 110, 22), '#c0392b', '#6a1a12'); line(g, 'M58 92 Q74 110 58 128', '#f6f2e8', 2.4);
    }),
    // "track cx cy width" — running track seen from above: four numbered lanes, start line
    track: make(560, g => {
      P(g, R(-280, -130, 560, 260, 130), '#e0784a', '#8a3a1a'); P(g, R(-200, -50, 400, 100, 50), '#5fae3a', '#24561c');
      for (const i of [20, 40, 60]) line(g, R(-280 + i, -130 + i, 560 - 2 * i, 260 - 2 * i, 130 - i), '#ffffff', 2);
      line(g, 'M0 50 V130', '#ffffff', 4); [1, 2, 3, 4].forEach(n => label(g, 18, 46 + n * 20, String(n), '#ffffff', 18, 'middle'));
    }),
    // "pool cx cy width" — swimming pool from above: lane ropes, lane lines, a swimmer
    pool: make(480, g => {
      P(g, R(-240, -130, 480, 260, 10), '#e9e2d2', '#8a7a5a'); P(g, R(-220, -110, 440, 220, 6), '#5fb8e8', '#2b6cc4');
      for (const y of [-82, -27, 28, 83]) line(g, `M-180 ${y} H180 M-180 ${y - 8} v16 M180 ${y - 8} v16`, '#2b5c9a', 4);
      for (const y of [-55, 0, 55]) { line(g, `M-220 ${y} H220`, '#e04b3a', 6, { 'stroke-dasharray': '8 8' }); line(g, `M-212 ${y} H220`, '#ffffff', 6, { 'stroke-dasharray': '8 8' }); }
      line(g, 'M230 -100 v40 M240 -100 v40 M230 -90 h10 M230 -76 h10', '#7a848e', 3);
      line(g, 'M-40 -36 Q-70 -50 -86 -30 M-40 -18 Q-10 -6 6 -24', '#e0a070', 5); P(g, C(-40, -27, 11), '#e04b3a', '#8a1a12', 2);
      line(g, 'M-110 -27 q8 -6 16 0 q8 6 16 0', '#ffffff', 2);
    }),
    // "helmet cx cy width" — bicycle helmet with vents and chin strap
    helmet: make(280, g => {
      line(g, 'M-40 26 L6 92 L60 26', DK, 3); P(g, R(-2, 86, 16, 10, 3), '#3a4450', DK, 2);
      P(g, 'M-122 30 Q-122 -88 10 -94 Q108 -94 130 10 L112 30 Q0 42 -122 30 Z', '#5fae3a', '#24561c');
      P(g, 'M104 -6 L152 0 L130 18 Z', '#3a4450', DK, 2.4);
      for (const [x, a] of [[-70, -30], [-20, -8], [34, 10], [80, 30]]) P(g, `M${x - 16} ${-56 + Math.abs(x) * .2} q16 -${14} 32 0 q-16 8 -32 0 Z`, '#2f3a45', DK, 2);
      line(g, 'M-118 14 Q0 22 116 8', '#ffd84a', 5);
    }),
    // "podium cx cy width |first, second, third" — winners' podium 1-2-3, names from |text
    podium: make(420, (g, o, t) => {
      const n = list(t);
      [[-70, -60, 140, 160, '#ffd84a', '1', n[0]], [-210, -10, 140, 110, '#d5dce2', '2', n[1]], [70, 20, 140, 80, '#e0a46a', '3', n[2]]].forEach(([x, y, w, h, c, k, who]) => {
        P(g, R(x, y, w, h, 3), c, '#5a4a3a'); label(g, x + w / 2, y + 52, k, '#5a4a3a', 44, 'middle'); if (who) label(g, x + w / 2, y - 12, who, '#2b6cc4', 24, 'middle');
      });
      line(g, 'M-230 100 H230', '#5a4a3a', 3);
    }),
    // ---------- music & art ----------
    instrument: make(300, (g, o) => pick(INSTR, o.k, 'guitar', 'instrument')(g)),
    // "musicstaff cx cy width |C D E F G" — five-line staff, treble clef, notes from |text
    musicstaff: make(520, (g, o, t) => {
      let d = ''; for (let y = -40; y <= 40; y += 20) d += `M-250 ${y} H250 `; line(g, d, DK, 2); line(g, 'M-250 -40 V40 M250 -40 V40', DK, 3);
      line(g, 'M-206 74 Q-208 90 -220 84 Q-230 76 -216 70 M-210 74 L-214 -58 Q-210 -84 -196 -74 Q-186 -56 -224 -20 Q-244 4 -226 24 Q-208 38 -192 20 Q-182 0 -202 -6 Q-220 -6 -216 14', '#2f2a28', 4);
      const notes = (t || 'C D E F G A B C5').split(/[\s,]+/).filter(n => NOTE_Y[n.toUpperCase()] != null).map(n => n.toUpperCase()).slice(0, 12);
      const step = Math.min(56, 400 / Math.max(1, notes.length));
      notes.forEach((n, i) => {
        const x = -150 + step * (i + .5), y = NOTE_Y[n];
        if (y >= 60) line(g, `M${x - 18} 60 H${x + 18}`, DK, 2); if (y <= -60) line(g, `M${x - 18} -60 H${x + 18}`, DK, 2);
        P(g, E(x, y, 11, 8), '#2f2a28', '#2f2a28', 2); line(g, y > 0 ? `M${x + 10} ${y} V${y - 56}` : `M${x - 10} ${y} V${y + 56}`, '#2f2a28', 3);
        if (showLab(o)) label(g, x, 102, n.replace('5', ''), TXT.orange, 20, 'middle');
      });
    }),
    // "palette cx cy width" — artist's palette with paint blobs and a brush
    palette: make(300, g => {
      P(g, 'M-130 10 C-140 -70 -40 -110 40 -100 C120 -90 150 -30 130 30 C115 75 60 70 30 60 C0 50 -10 80 -30 95 C-80 110 -125 70 -130 10 Z', '#e8c48e', '#8a6a3a');
      P(g, C(-58, 42, 15), '#fdfdfb', '#8a6a3a', 2.4);
      for (const [x, y, c] of [[-90, -10, '#e04b3a'], [-50, -60, '#ffd84a'], [10, -74, '#5fae3a'], [66, -60, '#2b6cc4'], [100, -10, '#ffffff'], [70, 30, '#8e5bbf']]) P(g, C(x, y, 16), c, DK, 2);
      line(g, 'M150 100 L46 -14', '#c0392b', 9); P(g, 'M46 -14 L36 -26 L28 -20 L38 -6 Z', '#c9d1d9', DK, 2);
      P(g, 'M32 -24 Q14 -50 4 -54 Q16 -36 26 -16 Z', '#2b6cc4', DK, 2);
    }),
    clothes: make(240, (g, o) => pick(CLOTH, o.k, 'shirt', 'clothes')(g)),
    // "umbrella cx cy height" — open umbrella with curved handle
    umbrella: make(300, g => {
      line(g, 'M0 0 V110 Q0 134 -20 134 Q-38 134 -38 116', '#4a3a2a', 6); line(g, 'M0 -116 V-132', DK, 4);
      P(g, 'M-140 0 Q-130 -110 0 -116 Q130 -110 140 0 Q117 -18 93 0 Q70 -18 47 0 Q23 -18 0 0 Q-23 -18 -47 0 Q-70 -18 -93 0 Q-117 -18 -140 0 Z', '#2b6cc4', '#1a3a6a');
      for (const [x, c] of [[-93, '#e04b3a'], [0, '#ffd84a'], [93, '#e04b3a']]) mk('path', { d: `M${x - 47} 0 Q${x - 40} -86 0 -116 Q${x === 0 ? 30 : x + 20} -86 ${x + 47} 0 Q${x + 23} -18 ${x} 0 Q${x - 23} -18 ${x - 47} 0 Z`, fill: c, filter: 'url(#wc)', class: 'fillable', opacity: x === 0 ? 0 : .9 }, g);
      line(g, 'M0 -116 Q-60 -80 -93 0 M0 -116 Q-24 -70 -47 0 M0 -116 V0 M0 -116 Q24 -70 47 0 M0 -116 Q60 -80 93 0', '#1a3a6a', 2);
    }),
    // "toothbrush cx cy width" — toothbrush with paste on the bristles, and a tube
    toothbrush: make(320, g => {
      P(g, 'M-150 0 Q-150 -12 -130 -12 L60 -8 L124 -8 Q134 -8 134 2 L134 8 Q134 16 124 16 L60 14 L-130 12 Q-150 12 -150 0 Z', '#7fb7ea', '#2b6cc4');
      P(g, R(70, -40, 58, 32, 2), '#ffffff', '#9aa3ad', 2); line(g, 'M80 -40 V-8 M92 -40 V-8 M104 -40 V-8 M116 -40 V-8', '#9aa3ad', 1.6);
      P(g, 'M66 -42 Q78 -60 90 -44 Q102 -60 114 -44 Q126 -58 132 -42 Z', '#ffffff', '#4f93d6', 2.4); line(g, 'M74 -46 Q86 -52 96 -46 Q108 -52 122 -46', '#5fae3a', 2.4);
      P(g, 'M-120 42 L56 40 L78 50 L78 70 L56 80 L-120 78 Q-128 60 -120 42 Z', '#ffffff', '#7a8a9a'); P(g, R(78, 52, 24, 16, 3), '#e04b3a', DK, 2);
      line(g, 'M-90 50 V70 M-60 52 H20 M-60 66 H0', '#e04b3a', 3);
    }),
  });
})();
