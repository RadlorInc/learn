// Recipes: ek chhoti line → poori illustrated drawing.
// AI sirf "leaf 455 265 390 rot=-12" likhta hai; hilti outline, watercolour, nasein, chhaya yahan se aati hain.
// Isliye quality yahan badhti hai, tokens wahi rehte hain.

document.querySelector('svg').insertAdjacentHTML('afterbegin', `<defs>
  <filter id="rough" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/>
    <feDisplacementMap in="SourceGraphic" scale="3.2"/>
  </filter>
  <filter id="wc" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="7" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.45 1.05" result="g2"/>
    <feComposite in="d" in2="g2" operator="in"/>
  </filter>
  <linearGradient id="leafG" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0" stop-color="#9ad35a"/><stop offset=".55" stop-color="#5fae3a"/><stop offset="1" stop-color="#2f7d27"/>
  </linearGradient>
  <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f5"/><stop offset="1" stop-color="#2f7fd6"/></linearGradient>
  <linearGradient id="mountG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9bfae"/><stop offset="1" stop-color="#5f7a6c"/></linearGradient>
  <linearGradient id="cloudG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cdd8e4"/></linearGradient>
  <linearGradient id="hbG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ccbf3"/><stop offset="1" stop-color="#3d78c2"/></linearGradient>
  <linearGradient id="hrG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7a094"/><stop offset="1" stop-color="#c9352b"/></linearGradient>
  <radialGradient id="sunG"><stop offset="0" stop-color="#fff3a6"/><stop offset=".6" stop-color="#ffd84a"/><stop offset="1" stop-color="#f7b51c"/></radialGradient>
</defs>`);

const INK = { blue: '#2b6cc4', sky: '#7fb7ea', orange: '#c97a10', yellow: '#f3c33b', green: '#24561c', red: '#c0392b' };
const TXT = { blue: '#2b6cc4', sky: '#4f93d6', orange: '#d27b0c', yellow: '#d18b00', green: '#2c6a22', red: '#c0392b' };
const FILL = { orange: '#f4a531', yellow: '#ffd84a', green: '#5fae3a', red: '#e04b3a', blue: '#7fb7ea' };
let clipN = 0;

const line = (g, d, color, w = 3, extra = {}) =>
  mk('path', { d, stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#rough)', class: 'ink', ...extra }, g);
// Sub- and superscripts (19 Oct 2026): the hand fonts have no glyphs for ⁺ ⁻ ² ₆₀ …, so "e⁻", "C₆₀", "x²" lost their
// marks. Unicode super/subscript characters, "^{..}" / "^x" and "_{..}" / "_x" become smaller raised or lowered
// tspans in the same font (Q_H, E_{ion}, e^{-x}). Plain text is left as it is.
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ', SUB = '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₙ', NORM = '0123456789+–=()ni', NORMSUB = '0123456789+–=()aeoxn';
const richText = (t, text) => {
  text = String(text ?? '');
  if (!/[_^⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₙ]/.test(text)) { t.textContent = text; return t; }
  const ch = [...text], runs = []; let i = 0, buf = '';
  const push = (s, k) => { if (s) runs.push([s, k]); };
  while (i < ch.length) {
    const c = ch[i];
    if ((c === '_' || c === '^') && i + 1 < ch.length && ch[i + 1] !== ' ') {
      push(buf, 0); buf = ''; let body;
      if (ch[i + 1] === '{') { const j = ch.indexOf('}', i + 2); body = ch.slice(i + 2, j < 0 ? ch.length : j).join(''); i = j < 0 ? ch.length : j + 1; }
      else { body = ch[i + 1]; i += 2; }
      push(body, c === '^' ? 1 : -1);
    } else if (SUP.includes(c) || SUB.includes(c)) {
      push(buf, 0); buf = ''; const sup = SUP.includes(c); let s = '';
      while (i < ch.length && (sup ? SUP : SUB).includes(ch[i])) { s += (sup ? NORM[SUP.indexOf(ch[i])] : NORMSUB[SUB.indexOf(ch[i])]); i++; }
      push(s, sup ? 1 : -1);
    } else { buf += c; i++; }
  }
  push(buf, 0);
  let at = 0;                                                     // current baseline offset, in em of the main size
  for (const [s, k] of runs) {
    const to = k > 0 ? -.42 : k < 0 ? .22 : 0;
    const sp = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    sp.setAttribute('dy', `${((to - at) * (k ? (/^[+–=]+$/.test(s) ? 1.1 : 1.5) : 1)).toFixed(2)}em`);   // a 66% run's em is smaller: 1.5x
    if (k) sp.setAttribute('font-size', '66%');
    if (k && /^[+–=]+$/.test(s)) { sp.setAttribute('font-size', '90%'); sp.setAttribute('font-weight', 700); }   // a lone charge sign at 66% all but vanished
    sp.textContent = s; t.append(sp); at = to;
  }
  return t;
};
const label = (g, x, y, text, color, size = 22, anchor = 'start') => {
  const t = mk('text', { x, y, class: 'hand lbl', 'font-family': 'Kalam, cursive', 'font-size': size, fill: color, 'text-anchor': anchor }, g);
  return richText(t, text);
};
// teer ka sira: aakhri point aur uski disha se
const head = (x, y, ax, ay, h = 13) => {
  const a = Math.atan2(y - ay, x - ax), p = d => `${x - h * Math.cos(a + d)} ${y - h * Math.sin(a + d)}`;
  return `M${p(-.5)} L${x} ${y} L${p(.5)}`;
};

window.RECIPES = {
  // "title | Leaf captures energy"
  title: (n, o, t, parent) => {
    const e = mk('text', { x: n[0] ?? 40, y: n[1] ?? 66, class: 'hand', 'font-family': 'Kalam, cursive', 'font-weight': 700, 'font-size': o.s || 40, fill: TXT[o.c] || TXT.blue, 'letter-spacing': 1 }, parent);
    e.textContent = t.toUpperCase(); return e;
  },

  // "leaf cx cy length rot=deg"
  leaf: ([cx, cy, L = 384], o, t, parent) => {
    const g = mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${L / 384})` }, parent);
    const outline = 'M-192 35 C-132 -87 70 -117 192 -17 C112 69 -50 119 -192 35 Z', id = 'lc' + clipN++;
    mk('clipPath', { id }, g).append(mk('path', { d: outline }));
    mk('path', { d: outline, fill: 'url(#leafG)', filter: 'url(#wc)', class: 'fillable' }, g);
    const shade = mk('g', { 'clip-path': `url(#${id})`, opacity: .35 }, g);
    mk('path', { d: 'M-192 35 C-74 7 66 -19 192 -17 C112 69 -50 119 -192 35 Z', fill: '#2f7d27', filter: 'url(#wc)', class: 'fillable' }, shade);
    line(g, outline, INK.green, 3.2);
    line(g, 'M-190 35 C-74 7 66 -18 186 -15', '#2c6a22', 3.5);
    for (const d of ['M-132 22 Q-118 -13 -102 -39', 'M-132 22 Q-120 47 -110 69', 'M-54 10 Q-34 -29 -10 -59', 'M-54 10 Q-38 43 -24 75',
                     'M24 -3 Q46 -41 72 -71', 'M24 -3 Q42 29 56 59', 'M102 -11 Q122 -39 142 -59', 'M102 -11 Q118 15 130 35']) line(g, d, '#2c6a22', 2);
    line(g, 'M-154 -15 C-94 -65 6 -83 86 -69', '#c8ec8f', 7, { opacity: .6 });
    line(g, 'M-192 35 C-222 51 -238 75 -248 107', INK.green, 5);
    return g;
  },

  // "sun cx cy r | Sunlight"
  sun: ([cx, cy, r = 40], o, t, parent) => {
    const g = mk('g', {}, parent);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
      line(g, `M${cx + c * (r + 14)} ${cy + s * (r + 14)} L${cx + c * (r + 32)} ${cy + s * (r + 32)}`, '#f6c84c', 5);
    }
    mk('circle', { cx, cy, r, fill: 'url(#sunG)', filter: 'url(#wc)', class: 'fillable' }, g);
    line(g, `M${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx + r - .01} ${cy - .5}`, '#e0a100', 2.5);
    if (t) label(g, cx + r + 22, cy + r + 32, t, TXT.yellow);
    return g;
  },

  // "beams x1 y1 x2 y2" — 3 roshni ki lakeerein
  beams: ([x1, y1, x2, y2], o, t, parent) => {
    const g = mk('g', { opacity: .9 }, parent), len = Math.hypot(x2 - x1, y2 - y1), px = -(y2 - y1) / len, py = (x2 - x1) / len;
    for (const k of [-14, 0, 14]) line(g, `M${x1 + px * k} ${y1 + py * k} L${x2 + px * k} ${y2 + py * k}`, INK.yellow, 3);
    return g;
  },

  // "flow x1 y1 x2 y2 c=blue n=3 dots=1 | Water" — halke mude teer, chaahe to bulbule
  flow: ([x1, y1, x2, y2], o, t, parent) => {
    const g = mk('g', {}, parent), n = +o.n || 1, col = INK[o.c] || INK.blue;
    const len = Math.hypot(x2 - x1, y2 - y1), px = -(y2 - y1) / len, py = (x2 - x1) / len, bend = +o.bend || 18;
    for (let i = 0; i < n; i++) {
      const k = (i - (n - 1) / 2) * 24, ax = x1 + px * k, ay = y1 + py * k, bx = x2 + px * k * .5, by = y2 + py * k * .5;
      const qx = (ax + bx) / 2 + px * bend, qy = (ay + by) / 2 + py * bend;
      line(g, `M${ax} ${ay} Q${qx} ${qy} ${bx} ${by}`, col, n > 1 ? 3 : 2.5);
      line(g, head(bx, by, qx, qy), col, n > 1 ? 3 : 2.5, { class: 'ink head' });
      if (o.dots) for (const s of [.35, .62]) {
        const u = 1 - s, x = u * u * ax + 2 * u * s * qx + s * s * bx, y = u * u * ay + 2 * u * s * qy + s * s * by;
        line(g, `M${x + 5} ${y} A5 5 0 1 1 ${x + 4.99} ${y - .3}`, col, 2.2);
      }
    }
    const left = x2 < x1, [lx, ly] = o.at === 'end' ? [x2, y2 - 16] : [x1 + (left ? -4 : 4), y1 - (n - 1) * 12 - 18];
    if (t) label(g, lx, ly, t, TXT[o.c] || TXT.blue, 24, left ? 'end' : 'start');
    return g;
  },

  // "trail x1 y1 x2 y2 c=orange | Sugar" — rangeen boondein ek raaste par
  trail: ([x1, y1, x2, y2], o, t, parent) => {
    const g = mk('g', {}, parent), k = +o.k || 4, fill = FILL[o.c] || FILL.orange, ink = INK[o.c] || INK.orange;
    for (let i = 0; i < k; i++) {
      const x = x1 + (x2 - x1) * i / (k - 1), y = y1 + (y2 - y1) * i / (k - 1);
      mk('circle', { cx: x, cy: y, r: 8, fill, filter: 'url(#wc)', class: 'fillable' }, g);
      line(g, `M${x + 8} ${y} A8 8 0 1 1 ${x + 7.99} ${y - .4}`, ink, 2);
    }
    if (t) label(g, x2 + 24, y2 - 4, t, TXT[o.c] || TXT.orange);
    return g;
  },
  // "label x y c=blue s=22 | text"
  label: ([x, y], o, t, parent) => { const g = mk('g', {}, parent); label(g, x, y, t, TXT[o.c] || TXT.blue, +o.s || 22); return g; },

  // "sea x1 x2 y" — lehron wala samundar, neeche board ke kinaare tak
  sea: ([x1, x2, y], o, t, parent) => {
    const g = mk('g', {}, parent), waves = (yy, amp) => {
      let d = `M${x1} ${yy}`;
      for (let x = x1; x < x2; x += 60) d += ` Q${x + 15} ${yy - amp} ${x + 30} ${yy} T${Math.min(x + 60, x2)} ${yy}`;
      return d;
    };
    mk('path', { d: `${waves(y, 9)} L${x2} 560 L${x1} 560 Z`, fill: 'url(#seaG)', filter: 'url(#wc)', class: 'fillable' }, g);
    line(g, waves(y, 9), '#1f5fa8', 3);
    const inner = mk('g', {}, g); g.anim = inner;
    for (const [dy, a] of [[34, 6], [66, 5]]) line(inner, waves(y + dy, a).replace(`M${x1}`, `M${x1 + 40}`), '#d8eefc', 2.5, { opacity: .8 });
    return g;
  },

  // "mountain cx baseY width height"
  mountain: ([cx, by, w, h], o, t, parent) => {
    const g = mk('g', {}, parent), P = (fx, fy) => `${cx + w * fx} ${by - h * fy}`;
    const out = `M${P(-.5, 0)} L${P(-.2, .5)} L${P(-.1, .58)} L${P(0, 1)} L${P(.13, .68)} L${P(.24, .6)} L${P(.5, 0)} Z`;
    mk('path', { d: out, fill: 'url(#mountG)', filter: 'url(#wc)', class: 'fillable' }, g);
    mk('path', { d: `M${P(0, 1)} L${P(.13, .68)} L${P(.24, .6)} L${P(.5, 0)} L${P(.05, 0)} Z`, fill: '#4e6658', opacity: .35, filter: 'url(#wc)', class: 'fillable' }, g);
    mk('path', { d: `M${P(-.1, .58)} L${P(0, 1)} L${P(.13, .68)} L${P(.07, .64)} L${P(.02, .7)} L${P(-.04, .62)} Z`, fill: '#ffffff', filter: 'url(#wc)', class: 'fillable' }, g);
    line(g, out, '#3e5446', 3);
    line(g, `M${P(-.1, .58)} L${P(-.04, .62)} L${P(.02, .7)} L${P(.07, .64)} L${P(.13, .68)}`, '#7d93a0', 2);
    return g;
  },

  // "cloud cx cy scale"
  cloud: ([cx, cy, s = 1.4], o, t, parent) => {
    const g = mk('g', { transform: `translate(${cx} ${cy}) scale(${s})` }, parent);
    const d = 'M-58 20 C-80 20 -82 -10 -56 -14 C-50 -40 -12 -44 0 -24 C14 -44 54 -38 54 -14 C80 -14 84 20 62 20 Z';
    mk('path', { d, fill: 'url(#cloudG)', filter: 'url(#wc)', class: 'fillable' }, g);
    line(g, d, '#7a8899', 2.2);
    line(g, 'M-40 -6 C-34 -22 -18 -26 -8 -18', '#ffffff', 3, { opacity: .9 });
    return g;
  },

  // "rain x1 y1 x2 y2 | Precipitation" — gir-ti boondein (loop rain fall)
  rain: ([x1, y1, x2, y2], o, t, parent) => {
    const g = mk('g', {}, parent), cols = 5, rows = 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = x1 + (x2 - x1) * (c + (r % 2) * .5) / cols, y = y1 + (y2 - y1) * r / rows;
      line(g, `M${x} ${y} L${x - 5} ${y + 18}`, '#2b6cc4', 3);
    }
    if (t) label(g, x2 + 16, (y1 + y2) / 2, t, TXT.blue, 24);
    return g;
  },

  // "vapour x1 x2 yBottom yTop | Evaporation" — upar uthti lehrein (loop vapour rise)
  vapour: ([x1, x2, yb, yt], o, t, parent) => {
    const g = mk('g', {}, parent);
    for (let i = 0; i < 3; i++) {
      const x = x1 + (x2 - x1) * i / 2; let d = `M${x} ${yb}`;
      for (let y = yb, k = 0; y > yt; y -= 30, k++) d += ` Q${x + (k % 2 ? -10 : 10)} ${y - 15} ${x} ${y - 30}`;
      line(g, d, INK.sky, 2.8);
      const ye = yb - 30 * Math.ceil((yb - yt) / 30);
      line(g, head(x, ye, x, ye + 20), INK.sky, 2.8, { class: 'ink head' });
    }
    if (t) label(g, x2 + 18, (yb + yt) / 2, t, TXT.sky, 24);
    return g;
  },

  // "heart cx cy size" — daayan hissa neela (purana khoon), baayan laal (taaza), loop heart beat
  heart: ([cx, cy, S = 300], o, t, parent) => {
    const outer = mk('g', { transform: `translate(${cx} ${cy}) scale(${S / 300})` }, parent);
    const g = mk('g', { class: 'pivot' }, outer); outer.anim = g;
    const H = 'M0 125 C-55 92 -150 40 -150 -38 C-150 -98 -104 -128 -60 -120 C-30 -114 -10 -98 0 -82 C10 -98 30 -114 60 -120 C104 -128 150 -98 150 -38 C150 40 55 92 0 125 Z';
    const vena = 'M-96 -104 L-96 -172 Q-96 -184 -84 -184 L-60 -184 Q-48 -184 -48 -172 L-48 -112';
    const aorta = 'M8 -96 C6 -176 96 -200 128 -152 L104 -136 C86 -164 44 -156 44 -100';
    mk('path', { d: vena + ' Z', fill: '#5d93d6', filter: 'url(#wc)', class: 'fillable' }, g);
    mk('path', { d: aorta + ' Z', fill: '#d9483c', filter: 'url(#wc)', class: 'fillable' }, g);
    line(g, vena, '#1f4f8f', 3); line(g, aorta, '#7a1f1f', 3);
    const L = 'hl' + clipN++, R = 'hr' + clipN++;
    mk('clipPath', { id: L }, g).append(mk('rect', { x: -200, y: -200, width: 200, height: 400 }));
    mk('clipPath', { id: R }, g).append(mk('rect', { x: 0, y: -200, width: 200, height: 400 }));
    mk('path', { d: H, fill: 'url(#hbG)', 'clip-path': `url(#${L})`, filter: 'url(#wc)', class: 'fillable' }, g);
    mk('path', { d: H, fill: 'url(#hrG)', 'clip-path': `url(#${R})`, filter: 'url(#wc)', class: 'fillable' }, g);
    line(g, H, '#5b1a1a', 3.6);
    line(g, 'M0 -82 C-8 -20 8 60 0 125', '#5b1a1a', 3);
    line(g, 'M-146 -30 C-86 -16 -24 -22 0 -26 C28 -22 90 -16 146 -30', '#5b1a1a', 2.4);
    line(g, 'M-120 -66 C-112 -94 -88 -108 -66 -104', '#ffffff', 7, { opacity: .55 });
    for (const [x, y, s] of [[-75, -60, 'RA'], [75, -60, 'LA'], [-60, 40, 'RV'], [60, 40, 'LV']]) {
      const tt = mk('text', { x, y, 'text-anchor': 'middle', 'font-family': 'Kalam, cursive', 'font-size': 22, fill: '#ffffff', class: 'fillable' }, g);
      tt.textContent = s;
    }
    return outer;
  },

  // "tool cx cy length k=stick|reed|quill|pencil|pen|stylus rot=deg" — a writing tool, tip pointing along rot
  tool: ([cx, cy, L = 150], o, t, parent) => {
    const g = mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot ?? -50}) scale(${L / 200})` }, parent);
    const part = (d, fill, ink, w = 3) => { mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable' }, g); line(g, d, ink, w); };
    const K = {
      stick: () => { part('M-100 -6 Q-20 -10 60 -5 L100 0 L60 5 Q-20 10 -100 7 Z', '#b98a5a', '#5e3b1c'); line(g, 'M-40 -7 L-58 -24', '#5e3b1c', 3); },
      reed: () => { part('M-100 -8 L70 -8 L100 0 L70 8 L-100 8 Z', '#d8c07a', '#7a6428'); for (const x of [-45, 15]) line(g, `M${x} -8 L${x} 8`, '#7a6428', 2.5); },
      quill: () => { part('M-100 -4 Q-40 -38 52 -6 L60 -2 L60 2 Q-20 16 -100 4 Z', '#f4f1e8', '#7a7a7a'); line(g, 'M-100 0 L62 0', '#9a968c', 2);
        part('M60 -3 L100 0 L60 3 Z', '#3a3a3a', '#1d1d1f', 2); },
      pencil: () => { part('M-100 -9 L-86 -9 L-86 9 L-100 9 Z', '#f08a9a', '#8a3a46'); part('M-86 -9 L-76 -9 L-76 9 L-86 9 Z', '#b9bec4', '#5a6068');
        part('M-76 -9 L52 -9 L52 9 L-76 9 Z', '#f3c33b', '#8a6414'); part('M52 -9 L84 -3 L84 3 L52 9 Z', '#e8c99a', '#8a6414'); part('M84 -3 L100 0 L84 3 Z', '#3a3a3a', '#1d1d1f', 2); },
      pen: () => { part('M-100 -10 Q-104 0 -100 10 L40 10 L40 -10 Z', '#1f2d4a', '#0c1424'); part('M-10 -10 L2 -10 L2 10 L-10 10 Z', '#d4a73a', '#7a5a14', 2);
        part('M40 -7 L60 -7 L60 7 L40 7 Z', '#2e3f63', '#0c1424', 2); part('M60 -7 L100 0 L60 7 Z', '#d9b24a', '#7a5a14'); line(g, 'M70 0 L96 0', '#6b5410', 1.5); },
      stylus: () => { part('M-100 -6 Q-104 0 -100 6 L80 6 L80 -6 Z', '#e9ecf1', '#7a808c'); part('M80 -6 L100 0 L80 6 Z', '#9aa3b2', '#5a6068', 2); line(g, 'M-90 -2 L70 -2', '#ffffff', 2, { opacity: .8 }); },
    };
    if (!K[o.k]) throw new Error(`Unknown tool "${o.k}"`);
    K[o.k](); return g;
  },

  // "mark cx cy k=groove|wedge|ink|graphite|blue|glow" — the mark that tool leaves, about 90 wide
  mark: ([cx, cy], o, t, parent) => {
    const g = mk('g', {}, parent), wave = dy => { let d = `M${cx - 45} ${cy + dy}`; for (let i = 0; i < 6; i++) d += ` q7.5 ${i % 2 ? 12 : -12} 15 0`; return d; };
    if (o.k === 'groove') { line(g, wave(0), '#8a6a3e', 6); line(g, wave(2), '#f1dcb0', 1.5); }
    else if (o.k === 'wedge') for (let i = 0; i < 6; i++) { const x = cx - 42 + i * 16, d = `M${x} ${cy - 6} L${x + 10} ${cy} L${x} ${cy + 6} Z`; mk('path', { d, fill: '#6e3f28', class: 'fillable' }, g); line(g, d, '#6e3f28', 2.5); }
    else if (o.k === 'ink') line(g, wave(0), '#4a2a16', 3.2);
    else if (o.k === 'graphite') line(g, wave(0), '#6c6c6c', 2.4, { opacity: .85 });
    else if (o.k === 'blue') line(g, wave(0), '#1f4fae', 3);
    else if (o.k === 'glow') { line(g, wave(0), '#9ff0ff', 7, { opacity: .45 }); line(g, wave(0), '#1aa6c9', 3); }
    else throw new Error(`Unknown mark "${o.k}"`);
    return g;
  },
};
