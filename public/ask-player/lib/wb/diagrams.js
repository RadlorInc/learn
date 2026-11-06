// Whiteboard diagrams: the generic explainer structures (flowcharts, cycles, trees, matrices, cards) used by answers
// on any topic. Every label and count comes from the call's "| text"; lists are "a,b,c", groups are split by ";".
// Positions are computed from the call, never eyeballed. Wrapped in a block so the helpers stay private.
(() => {
const K = '#2f3640', GREY = '#8d969f', PAPER = '#fffdf5';
const LIGHT = ['#cfe6f8', '#ffe2ae', '#d3ecc2', '#f9cdc4', '#fff0a6', '#e4d6f3', '#c8eee6', '#fbd5dd'];
const MID = ['#7fb7ea', '#f4a531', '#5fae3a', '#e04b3a', '#ffd84a', '#b48ad8', '#4fc1b0', '#f08a9a'];
const INKS = ['#2b6cc4', '#c97a10', '#2c6a22', '#c0392b', '#b08a00', '#6a3fa0', '#1f7f72', '#a3324a'];
const RAD = Math.PI / 180;

// ── parsing: "| a,b,c" lists, "| head;a,b" groups, "_" = space
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const showLab = o => o.lab !== '0' && o.labels !== '0';   // lab=0 / labels=0 hide the recipe's own words (built-in placeholders too)
const say = (o, t) => !!t || showLab(o);                  // caller text always shows; built-in placeholder text only with labels on
const opt = (o, k, d) => (o[k] === undefined || o[k] === '' || !Number.isFinite(+o[k]) ? d : +o[k]);
const txt = s => String(s ?? '').replace(/_/g, ' ').trim();
const items = (s, def) => { const a = String(s ?? '').split(',').map(txt).filter(Boolean); return a.length ? a : def; };
const parts = s => String(s ?? '').split(';');
const steps = (o, word, d = 4) => Array.from({ length: clamp(Math.round(opt(o, 'n', d)), 1, 10) }, (_, i) => `${word} ${i + 1}`);

// ── paths
const rr = (x, y, w, h, r = 12) => { r = Math.min(r, w / 2, h / 2);
  return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`; };
const ring = (cx, cy, rx, ry = rx) => `M${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}`;
const polyD = (pts, close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ') + (close ? ' Z' : '');
// dashes as separate sub-paths: the player animates ink with stroke-dasharray, which would erase a real dash pattern
const dashD = (pts, on = 10, off = 8) => {
  let d = '', phase = 0, pen = true;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0); let u = 0;
    while (u < L - 1e-9) {
      const step = Math.min((pen ? on : off) - phase, L - u), at = s => `${x0 + (x1 - x0) * s / L} ${y0 + (y1 - y0) * s / L}`;
      if (pen) d += `M${at(u)} L${at(u + step)} `;
      u += step; phase += step;
      if (phase >= (pen ? on : off) - 1e-9) { phase = 0; pen = !pen; }
    }
  }
  return d || `M${pts[0][0]} ${pts[0][1]} l0.1 0`;
};
// distance from a box centre to its edge along direction (ux, uy)
const boxExt = (ux, uy, hw, hh) => 1 / Math.max(Math.abs(ux) / hw, Math.abs(uy) / hh, 1e-9);

// ── house layers: wash (watercolour fill) → line (ink) → label
const wash = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...extra }, g);
const box = (g, x, y, w, h, i, r = 12) => { const d = rr(x, y, w, h, r); wash(g, d, LIGHT[i % 8]); line(g, d, INKS[i % 8], 2.8); };
const disc = (g, x, y, r, fill, ink) => { wash(g, ring(x, y, r), fill); line(g, ring(x, y, r), ink, 2.6); };
const tip = (g, x, y, ax, ay, col, w = 3, h = 14) => line(g, head(x, y, ax, ay, h), col, w, { class: 'ink head' });
const arrow = (g, x0, y0, x1, y1, col = K, w = 3, h = 14) => { line(g, `M${x0} ${y0} L${x1} ${y1}`, col, w); tip(g, x1, y1, x0, y0, col, w, h); };
const tw = (s, size) => String(s).length * size * 0.46;               // rough handwritten text width
const wrap = (s, w, size) => { const out = []; let cur = '';
  for (const wd of s.split(/\s+/)) { const nx = cur ? `${cur} ${wd}` : wd; if (cur && tw(nx, size) > w) { out.push(cur); cur = wd; } else cur = nx; }
  if (cur) out.push(cur); return out; };
// text wrapped and shrunk to fit a w×h box centred on (x, cy); anchor 'start' makes x the left edge
const fit = (g, x, cy, w, h, s, col = K, max = 26, anchor = 'middle', bold = false) => {
  s = txt(s); if (!s) return;
  let size = max;
  for (; size > 12; size--) { const L = wrap(s, w, size); if (L.length * size * 1.15 <= h && L.every(l => tw(l, size) <= w)) break; }
  const L = wrap(s, w, size), lh = size * 1.15, y0 = cy - (L.length - 1) * lh / 2 + size * 0.35;
  L.forEach((l, i) => { const e = label(g, x, y0 + i * lh, l, col, size, anchor); if (bold) e.setAttribute('font-weight', 700); });
};
const bold = (g, x, y, s, col, size, anchor = 'middle') => { const e = label(g, x, y, s, col, size, anchor); e.setAttribute('font-weight', 700); return e; };
const tick = (g, x, y, s, col, w = 4) => line(g, `M${x - s * .5} ${y} L${x - s * .15} ${y + s * .38} L${x + s * .55} ${y - s * .42}`, col, w);
const cross = (g, x, y, s, col, w = 4) => line(g, `M${x - s * .4} ${y - s * .4} L${x + s * .4} ${y + s * .4} M${x + s * .4} ${y - s * .4} L${x - s * .4} ${y + s * .4}`, col, w);

// boxes round an ellipse joined by clockwise arrows (stagecycle, feedbackloop)
const cycle = (g, cx, cy, rx, ry, L, words = true) => {
  const n = L.length, P = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);
  const bw = clamp(P / n * .62, 96, 200), bh = clamp(bw * .42, 48, 74), pad = 10;
  const at = a => [cx + rx * Math.cos(a * RAD), cy + ry * Math.sin(a * RAD)], A = i => -90 + 360 * i / n;
  const C = L.map((_, i) => at(A(i))), inBox = ([x, y], [bx, by]) => Math.abs(x - bx) < bw / 2 + pad && Math.abs(y - by) < bh / 2 + pad;
  L.forEach((s, i) => {
    const j = (i + 1) % n, pts = [];
    for (let k = 0; k <= 80; k++) { const p = at(A(i) + 360 / n * k / 80); if (!inBox(p, C[i]) && !inBox(p, C[j])) pts.push(p); }
    if (pts.length > 2) { line(g, polyD(pts, false), K, 3); tip(g, ...pts.at(-1), ...pts.at(-3), K); }
  });
  L.forEach((s, i) => { box(g, C[i][0] - bw / 2, C[i][1] - bh / 2, bw, bh, i, 14); if (words) fit(g, C[i][0], C[i][1], bw - 16, bh - 8, s, K, 28); });
  return bw;
};

Object.assign(window.RECIPES, {
  // "flownode cx cy w h k=start|step|decision|io|end | text" — one flowchart shape with its text
  flownode: ([cx = 480, cy = 270, w = 240, h = 100], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'step', x = cx - w / 2, y = cy - h / 2;
    const S = { start: ['#d3ecc2', '#2c6a22', 'Start'], end: ['#f9cdc4', '#c0392b', 'End'], step: ['#cfe6f8', '#2b6cc4', 'Do the step'],
      decision: ['#fff0a6', '#b08a00', 'Is it done?'], io: ['#ffe2ae', '#c97a10', 'Read the input'] }[k];
    if (!S) throw new Error(`flownode: unknown k "${k}"`);
    let d, aw = w - 24, ah = h - 12;
    if (k === 'start' || k === 'end') { d = rr(x, y, w, h, h / 2); aw = w - h * .6; }
    else if (k === 'decision') { d = `M${cx} ${y} L${x + w} ${cy} L${cx} ${y + h} L${x} ${cy} Z`; aw = w * .58; ah = h * .56; }
    else if (k === 'io') { const s = h * .32; d = `M${x + s} ${y} L${x + w} ${y} L${x + w - s} ${y + h} L${x} ${y + h} Z`; aw = w - 2 * s - 10; }
    else d = rr(x, y, w, h, 8);
    wash(g, d, S[0]); line(g, d, S[1], 3.2);
    if (say(o, t)) fit(g, cx, cy, aw, ah, t || S[2], K, 30);
    return g;
  },

  // "connector x1 y1 x2 y2 k=straight|elbow|curve|both dash=1 | yes" — arrow between two points, optional label
  connector: ([x1 = 200, y1 = 160, x2 = 760, y2 = 380], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'straight', col = K;
    let pts, mid;
    if (k === 'elbow') {
      if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) { const mx = (x1 + x2) / 2; pts = [[x1, y1], [mx, y1], [mx, y2], [x2, y2]]; mid = [mx, (y1 + y2) / 2]; }
      else { const my = (y1 + y2) / 2; pts = [[x1, y1], [x1, my], [x2, my], [x2, y2]]; mid = [(x1 + x2) / 2, my]; }
    } else if (k === 'curve') {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, b = opt(o, 'bend', .3), c = [(x1 + x2) / 2 - (y2 - y1) / L * L * b, (y1 + y2) / 2 + (x2 - x1) / L * L * b];
      const q = u => [(1 - u) ** 2 * x1 + 2 * u * (1 - u) * c[0] + u * u * x2, (1 - u) ** 2 * y1 + 2 * u * (1 - u) * c[1] + u * u * y2];
      pts = Array.from({ length: 41 }, (_, i) => q(i / 40)); mid = q(.5);
    } else if (k === 'straight' || k === 'both') { pts = [[x1, y1], [x2, y2]]; mid = [(x1 + x2) / 2, (y1 + y2) / 2]; }
    else throw new Error(`connector: unknown k "${k}"`);
    pts = pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > .5);
    line(g, o.dash === '1' ? dashD(pts) : polyD(pts, false), col, 3.2);
    tip(g, ...pts.at(-1), ...pts.at(-2), col, 3.2);
    if (k === 'both') tip(g, ...pts[0], ...pts[1], col, 3.2);
    if (t) label(g, mid[0] + 10, mid[1] - 12, txt(t), INKS[3], 28, 'start');
    return g;
  },

  // "processrow x y w h k=box|chevron|circle join=so n=4 | Plan,Build,Test" — steps in a row joined by arrows
  processrow: ([x = 60, y = 200, w = 840, h = 130], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'box', L = items(t, steps(o, 'Step')), n = L.length, join = txt(o.join);
    if (k === 'chevron') {
      const gap = 6, cw = (w - gap * (n - 1)) / n, nt = Math.min(h * .35, 40, cw * .2);
      L.forEach((s, i) => { const bx = x + i * (cw + gap), cy = y + h / 2, last = i === n - 1; if (!say(o, t)) s = '';
        const d = polyD([[bx, y], [bx + cw - (last ? 0 : nt), y], [bx + cw, cy], [bx + cw - (last ? 0 : nt), y + h], [bx, y + h], ...(i ? [[bx + nt, cy]] : [])].filter((p, j, a) => !last || j !== 2));
        wash(g, d, LIGHT[i % 8]); line(g, d, INKS[i % 8], 2.8);
        const l = bx + (i ? nt * .7 : 8), r = bx + cw - (last ? 8 : nt * .7); fit(g, (l + r) / 2, cy, r - l - 6, h - 16, s, K, 32); });
      return g;
    }
    if (k !== 'box' && k !== 'circle') throw new Error(`processrow: unknown k "${k}"`);
    const gap = Math.max(64, join ? tw(join, 20) + 24 : 0), bw = (w - gap * (n - 1)) / n;
    L.forEach((s, i) => {
      const bx = x + i * (bw + gap); if (!say(o, t)) s = '';
      if (k === 'box') { box(g, bx, y, bw, h, i); fit(g, bx + bw / 2, y + h / 2, bw - 16, h - 12, s, K, 32); }
      else { const r = Math.min(bw / 2, h * .3), cy = y + r;
        disc(g, bx + bw / 2, cy, r, MID[i % 8], INKS[i % 8]); bold(g, bx + bw / 2, cy + r * .32, String(i + 1), '#fff', r * .9);
        fit(g, bx + bw / 2, y + 2 * r + (h - 2 * r) / 2 + 4, bw + gap * .6, h - 2 * r - 6, s, K, 28); }
      if (i < n - 1) { const ay = k === 'box' ? y + h / 2 : y + Math.min(bw / 2, h * .3), x0 = bx + bw + 7, x1 = bx + bw + gap - 7;
        arrow(g, x0, ay, x1, ay, K, 3.2, 13); if (join) label(g, (x0 + x1) / 2, ay - 12, join, INKS[3], 20, 'middle'); }
    });
    return g;
  },

  // "stagecycle cx cy r n=4 | Centre;Plan,Do,Check,Act" — stages round a loop with clockwise arrows
  stagecycle: ([cx = 480, cy = 270, r = 180], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), L = items(p.at(-1), steps(o, 'Stage')), centre = p.length > 1 ? txt(p[0]) : '';
    if (L.length < 2) throw new Error('stagecycle: needs 2+ stages');
    cycle(g, cx, cy, r * 1.35, r, L, !!p.at(-1).trim() || showLab(o));
    if (centre) fit(g, cx, cy, r * 1.1, r * .8, centre, INKS[0], 32, 'middle', true);
    return g;
  },

  // "feedbackloop cx cy w k=reinforcing|balancing | More sales,More money,More ads" — causal loop, sign in the middle
  feedbackloop: ([cx = 480, cy = 270, w = 640], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'reinforcing', bal = k === 'balancing';
    if (!bal && k !== 'reinforcing') throw new Error(`feedbackloop: unknown k "${k}"`);
    const L = items(t, bal ? ['Room too hot', 'Fan turns on', 'Room cools'] : ['More practice', 'More skill', 'More fun']);
    if (L.length < 2) throw new Error('feedbackloop: needs 2+ parts');
    cycle(g, cx, cy, w / 2, w * .3, L, say(o, t));
    const col = bal ? INKS[0] : INKS[2], R = 44, a0 = -60, a1 = 230, P = a => [cx + R * Math.cos(a * RAD), cy - 8 + R * Math.sin(a * RAD)];
    line(g, `M${P(a0).join(' ')} A${R} ${R} 0 1 1 ${P(a1).join(' ')}`, col, 3);
    tip(g, ...P(a1), ...P(a1 - 20), col, 3, 11);
    bold(g, cx, cy + 8, bal ? '−' : '+', col, 48);
    if (showLab(o)) label(g, cx, cy + 70, bal ? 'balancing' : 'reinforcing', col, 26, 'middle');
    return g;
  },

  // "orgtree x y w h | Head;A,B;A1,A2/B1" — hierarchy, one level per ";", "/" splits children between parents
  orgtree: ([x = 60, y = 40, w = 840, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), lv = parts(t || 'Head;Team A,Team B;One,Two/Three,Four').map(s => s.split('/').map(q => items(q, [])));
    const rows = lv.map(gs => gs.flat()).filter(r => r.length), nL = rows.length, rowH = h / nL, bh = Math.min(66, rowH * .56);
    const pos = rows.map((r, li) => { const bw = Math.min(190, w / r.length - 14);
      return r.map((s, i) => ({ s, x: x + w * (i + .5) / r.length, y: y + rowH * (li + .5), bw })); });
    for (let li = 1; li < nL; li++) {
      const P = pos[li - 1], C = pos[li], gs = lv[li].filter(q => q.length);
      const par = gs.length === P.length ? gs.flatMap((q, pi) => q.map(() => pi)) : C.map((_, i) => Math.floor(i * P.length / C.length));
      C.forEach((c, i) => { const p = P[par[i]], my = (p.y + bh / 2 + c.y - bh / 2) / 2;
        line(g, `M${p.x} ${p.y + bh / 2} V${my} H${c.x} V${c.y - bh / 2}`, GREY, 2.6); });
    }
    pos.forEach((r, li) => r.forEach(({ s, x: nx, y: ny, bw }) => { box(g, nx - bw / 2, ny - bh / 2, bw, bh, li, 10);
      if (say(o, t)) fit(g, nx, ny, bw - 14, bh - 8, s, K, li ? 24 : 28, 'middle', !li); }));
    return g;
  },

  // "mindmap cx cy size | Centre;idea,idea,idea" — central idea with curved branches to bubbles
  mindmap: ([cx = 480, cy = 270, S = 820], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), c = p.length > 1 ? txt(p[0]) : 'Big idea', L = items(p.at(-1), ['Who', 'What', 'Where', 'When', 'Why', 'How']), n = L.length;
    const bw = clamp(S * .21, 110, 190), bh = 54, rx = S / 2 - bw / 2, ry = Math.min(rx * .58, 196);
    const ew = clamp(tw(c, 30) + 56, 150, 260), eh = 96;
    const A = i => (-90 + 360 * i / n + (n % 2 ? 0 : 180 / n)) * RAD, N = L.map((_, i) => [cx + rx * Math.cos(A(i)), cy + ry * Math.sin(A(i))]);
    N.forEach(([nx, ny], i) => {
      const dx = nx - cx, dy = ny - cy, D = Math.hypot(dx, dy), ux = dx / D, uy = dy / D;
      const s = [cx + ux * boxExt(ux, uy, ew / 2, eh / 2) * .92, cy + uy * boxExt(ux, uy, ew / 2, eh / 2) * .92];
      const e = [nx - ux * boxExt(ux, uy, bw / 2, bh / 2), ny - uy * boxExt(ux, uy, bw / 2, bh / 2)];
      const m = [(s[0] + e[0]) / 2 - uy * 22, (s[1] + e[1]) / 2 + ux * 22];
      line(g, `M${s.join(' ')} Q${m.join(' ')} ${e.join(' ')}`, INKS[i % 8], 4);
    });
    wash(g, ring(cx, cy, ew / 2, eh / 2), '#fff0a6'); line(g, ring(cx, cy, ew / 2, eh / 2), INKS[4], 3.4);
    if (p.length > 1 || showLab(o)) fit(g, cx, cy, ew - 40, eh - 20, c, K, 32, 'middle', true);
    N.forEach(([nx, ny], i) => { box(g, nx - bw / 2, ny - bh / 2, bw, bh, i, bh / 2); if (say(o, t)) fit(g, nx, ny, bw - 26, bh - 8, L[i], K, 24); });
    return g;
  },

  // "twocol x y w h k=proscons|beforeafter|versus | Pros,a,b;Cons,c,d" — two columns side by side, header first in each
  twocol: ([x = 80, y = 50, w = 800, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'proscons';
    const def = { proscons: 'Pros,Quick to make,Costs little,Easy to share;Cons,Breaks easily,Needs power',
      beforeafter: 'Before,Messy notes,Lost homework,Late;After,One folder,Checklist,On time',
      versus: 'Sun,A star,Makes its own light,Very hot;Moon,A rock,Reflects light,Cold at night' }[k];
    if (!def) throw new Error(`twocol: unknown k "${k}"`);
    const G = (t && t.includes(';') ? t : def).split(';').slice(0, 2).map(s => items(s, ['…']));
    const ci = { proscons: [2, 3], beforeafter: [6, 1], versus: [0, 1] }[k], gap = k === 'proscons' ? 30 : 90, cw = (w - gap) / 2;
    const maxN = Math.max(1, ...G.map(c => c.length - 1)), rowH = Math.min(76, (h - 90) / maxN);
    G.forEach((col, j) => {
      const cx = x + j * (cw + gap), c = ci[j];
      wash(g, rr(cx, y, cw, h, 16), PAPER); wash(g, rr(cx, y, cw, 64, 16), LIGHT[c]);
      line(g, rr(cx, y, cw, h, 16), INKS[c], 3); line(g, `M${cx} ${y + 64} H${cx + cw}`, INKS[c], 2.4);
      const sw = (t && t.includes(';')) || showLab(o);
      if (sw) fit(g, cx + cw / 2, y + 33, cw - 30, 52, col[0], INKS[c], 32, 'middle', true);
      col.slice(1).forEach((s, i) => { const ry = y + 90 + rowH * (i + .5) - 10;
        if (k === 'proscons') (j ? cross : tick)(g, cx + 30, ry, 24, INKS[c], 3.6); else disc(g, cx + 30, ry, 7, MID[c], INKS[c]);
        if (sw) fit(g, cx + 54, ry, cw - 72, rowH - 6, s, K, 30, 'start'); });
    });
    const mx = x + w / 2, my = y + h / 2;
    if (k === 'versus') { disc(g, mx, my, 34, '#fff0a6', INKS[4]); bold(g, mx, my + 9, 'VS', INKS[3], 26); }
    if (k === 'beforeafter') { const d = `M${mx - 34} ${my - 12} H${mx + 4} V${my - 26} L${mx + 34} ${my} L${mx + 4} ${my + 26} V${my + 12} H${mx - 34} Z`;
      wash(g, d, MID[1]); line(g, d, INKS[1], 2.8); }
    return g;
  },

  // "cardgrid x y w h cols=3 num=1 | Title:detail,Title:detail" — grid of cards; "title:detail" adds a line under
  cardgrid: ([x = 60, y = 50, w = 840, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), L = items(t, ['Idea:what if?', 'Plan:pick steps', 'Build:make it', 'Test:try it', 'Share:show it', 'Learn:fix it']), n = L.length;
    const cols = clamp(Math.round(opt(o, 'cols', n <= 3 ? n : n === 4 ? 2 : 3)), 1, 6), rows = Math.ceil(n / cols), gap = 20;
    const cw = (w - gap * (cols - 1)) / cols, ch = Math.min((h - gap * (rows - 1)) / rows, cw * .75), y0 = y + (h - rows * ch - (rows - 1) * gap) / 2;
    L.forEach((s, i) => {
      const bx = x + (i % cols) * (cw + gap), by = y0 + Math.floor(i / cols) * (ch + gap), [hd, ...rest] = s.split(':'), body = rest.join(':').trim();
      box(g, bx, by, cw, ch, i, 14);
      if (o.num === '1') { disc(g, bx + 24, by + 24, 15, MID[i % 8], INKS[i % 8]); bold(g, bx + 24, by + 31, String(i + 1), '#fff', 20); }
      if (!say(o, t)) {} else if (body) { fit(g, bx + cw / 2, by + ch * .32, cw - (o.num === '1' ? 70 : 24), ch * .36, hd, INKS[i % 8], 28, 'middle', true);
        fit(g, bx + cw / 2, by + ch * .7, cw - 24, ch * .5, body, K, 26); }
      else fit(g, bx + cw / 2, by + ch / 2, cw - 24, ch - 16, hd, K, 28, 'middle', true);
    });
    return g;
  },

  // "tierpyramid cx y w h | top,…,base" — triangle cut into levels, top level first (Maslow-style)
  tierpyramid: ([cx = 430, y = 40, w = 620, h = 450], o, t, parent) => {
    const g = mk('g', {}, parent), L = items(t, ['Dreams', 'Respect', 'Friends', 'Safety', 'Food and sleep']), n = L.length, gap = 6;
    const bandH = (h - gap * (n - 1)) / n, hw = d => w / 2 * d / h;
    L.forEach((s, i) => {
      const top = y + i * (bandH + gap), bot = top + bandH, d = polyD([[cx - hw(top - y), top], [cx + hw(top - y), top], [cx + hw(bot - y), bot], [cx - hw(bot - y), bot]]);
      wash(g, d, MID[i % 8], { opacity: .8 }); line(g, d, INKS[i % 8], 2.8);
      const ty = i ? (top + bot) / 2 : top + bandH * .66, room = 2 * hw(ty - y) * .78;
      if (room >= 110) { if (say(o, t)) fit(g, cx, ty, room, bandH - 10, s, K, 28, 'middle', true); }
      else { const ex = cx + hw(ty - y) + 8; line(g, `M${ex} ${ty} L${cx + w / 2 + 14} ${ty}`, GREY, 2);
        if (say(o, t)) bold(g, cx + w / 2 + 22, ty + 8, txt(s), INKS[i % 8], 24, 'start'); }
    });
    return g;
  },

  // "funnel cx y w h vals=1000,400,90 | Visit,Try,Buy" — narrowing stages, widest first, optional numbers at the side
  funnel: ([cx = 450, y = 50, w = 620, h = 430], o, t, parent) => {
    const g = mk('g', {}, parent), L = items(t, ['Hear about it', 'Visit', 'Try it', 'Buy']), n = L.length, gap = 6;
    const V = String(o.vals ?? '').split(',').filter(Boolean), bandH = (h - gap * (n - 1)) / n, hw = d => w / 2 * (1 - .7 * d / h);
    L.forEach((s, i) => {
      const top = y + i * (bandH + gap), bot = top + bandH, d = polyD([[cx - hw(top - y), top], [cx + hw(top - y), top], [cx + hw(bot - y), bot], [cx - hw(bot - y), bot]]);
      wash(g, d, MID[i % 8], { opacity: .8 }); line(g, d, INKS[i % 8], 2.8);
      if (say(o, t)) fit(g, cx, (top + bot) / 2, 2 * hw(bot - y) - 24, bandH - 10, s, K, 28, 'middle', true);
      if (V[i]) bold(g, cx + hw(top - y) + 18, (top + bot) / 2 + 9, txt(V[i]), INKS[i % 8], 26, 'start');
    });
    return g;
  },

  // "layerstack x y w h k=flat|slab num=1 | top,…,bottom" — stacked layers (OSI-like); slab draws 3D slabs
  layerstack: ([x = 200, y = 40, w = 560, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'flat', L = items(t, ['App', 'Transport', 'Network', 'Link', 'Physical']), n = L.length;
    if (k !== 'flat' && k !== 'slab') throw new Error(`layerstack: unknown k "${k}"`);
    const slab = k === 'slab', dx = slab ? w * .1 : 0, dy = slab ? Math.min(24, h / n * .3) : 0, pitch = (h - dy) / n, fh = slab ? pitch - dy - 4 : pitch - 8;
    L.forEach((s, i) => {
      const top = y + dy + i * pitch, fw = w - dx, c = i % 8;
      if (slab) { const tp = polyD([[x, top], [x + dx, top - dy], [x + w, top - dy], [x + fw, top]]), sd = polyD([[x + fw, top], [x + w, top - dy], [x + w, top - dy + fh], [x + fw, top + fh]]);
        wash(g, tp, LIGHT[c]); wash(g, sd, MID[c]); line(g, tp, INKS[c], 2.4); line(g, sd, INKS[c], 2.4); }
      const d = slab ? polyD([[x, top], [x + fw, top], [x + fw, top + fh], [x, top + fh]]) : rr(x, top, w, fh, 10);
      wash(g, d, slab ? MID[c] : LIGHT[c], slab ? { opacity: .75 } : {}); line(g, d, INKS[c], 2.8);
      const nx = o.num === '1' ? 56 : 0;
      if (nx) bold(g, x + 28, top + fh / 2 + 10, String(n - i), INKS[c], 28);
      if (say(o, t)) fit(g, x + nx + (fw - nx) / 2, top + fh / 2, fw - nx - 24, fh - 8, s, K, 28, 'middle', true);
    });
    return g;
  },

  // "concentric cx cy r | inner,…,outer" — nested circles, innermost first, each ring named
  concentric: ([cx = 480, cy = 270, r = 230], o, t, parent) => {
    const g = mk('g', {}, parent), L = items(t, ['Me', 'Family', 'School', 'Town', 'World']), n = L.length, R = i => r * (i + 1) / n;
    for (let i = n - 1; i >= 0; i--) { wash(g, ring(cx, cy, R(i)), LIGHT[i % 8]); line(g, ring(cx, cy, R(i)), INKS[i % 8], 2.8); }
    L.forEach((s, i) => { const band = r / n; if (!say(o, t)) return;
      if (!i) fit(g, cx, cy, R(0) * 1.6, R(0) * 1.2, s, K, 28, 'middle', true);
      else fit(g, cx, cy - R(i) + band / 2, Math.sqrt(R(i) ** 2 - (R(i) - band / 2) ** 2) * 1.6, band - 6, s, INKS[i % 8], 26, 'middle', true); });
    return g;
  },

  // "causefan x y w h | Effect;cause,cause,cause" — several causes with arrows converging on one effect
  causefan: ([x = 60, y = 50, w = 840, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), eff = p.length > 1 ? txt(p[0]) : 'Plant wilts', C = items(p.at(-1), ['No water', 'Too much sun', 'Poor soil']), n = C.length;
    const cw = w * .36, ew = w * .3, eh = Math.min(150, h * .45), gap = 14, ch = Math.min(90, (h - 40 - gap * (n - 1)) / n);
    const ex = x + w - ew, ey = y + 20 + (h - 20) / 2 - eh / 2, top = y + 20 + (h - 20 - n * ch - (n - 1) * gap) / 2;
    if (showLab(o)) { label(g, x + cw / 2, y + 12, 'causes', GREY, 26, 'middle'); label(g, ex + ew / 2, ey - 14, 'effect', GREY, 26, 'middle'); }
    C.forEach((s, i) => { const by = top + i * (ch + gap), cy = by + ch / 2, ty = ey + eh * (i + 1) / (n + 1);
      box(g, x, by, cw, ch, i, 12); if (say(o, t)) fit(g, x + cw / 2, cy, cw - 20, ch - 10, s, K, 30);
      arrow(g, x + cw + 8, cy, ex - 8, ty, INKS[i % 8], 3); });
    wash(g, rr(ex, ey, ew, eh, 16), '#f9cdc4'); line(g, rr(ex, ey, ew, eh, 16), INKS[3], 3.4);
    if (say(o, t)) fit(g, ex + ew / 2, ey + eh / 2, ew - 24, eh - 16, eff, K, 32, 'middle', true);
    return g;
  },

  // "fishbone x y w h | Problem;Cat/sub/sub,Cat,…" — cause-and-effect fishbone, categories on slanted ribs
  fishbone: ([x = 30, y = 40, w = 900, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), prob = p.length > 1 ? txt(p[0]) : 'Late to school';
    const C = items(p.at(-1), ['People/slept late', 'Morning/no plan/slow breakfast', 'Travel/bus late', 'Things/lost shoes']).map(s => s.split('/').map(txt));
    const hw = w * .19, hh = Math.min(120, h * .3), cy = y + h / 2, sx = x + 30, se = x + w - hw - 8, m = Math.ceil(C.length / 2);
    line(g, `M${sx} ${cy} L${se} ${cy}`, K, 4.4); line(g, `M${sx} ${cy} L${sx - 24} ${cy - 30} M${sx} ${cy} L${sx - 24} ${cy + 30}`, K, 3.4);
    wash(g, rr(x + w - hw, cy - hh / 2, hw, hh, 14), '#f9cdc4'); line(g, rr(x + w - hw, cy - hh / 2, hw, hh, 14), INKS[3], 3.2);
    if (say(o, t)) fit(g, x + w - hw / 2, cy, hw - 20, hh - 14, prob, K, 28, 'middle', true);
    const reach = h / 2 - 34, slant = reach * .55, span = se - sx - 30;
    C.forEach(([cat, ...subs], i) => {
      const up = i % 2 === 0, j = Math.floor(i / 2), ax = sx + 30 + span * (j + 1) / (m + .4), s = up ? -1 : 1;
      const ex = ax - slant, ey = cy + s * reach, c = i % 8, cbw = Math.min(170, span / m - 10);
      line(g, `M${ax} ${cy} L${ex} ${ey}`, INKS[c], 3.2);
      box(g, ex - cbw / 2, up ? ey - 44 : ey, cbw, 44, c, 10); if (say(o, t)) fit(g, ex, up ? ey - 22 : ey + 22, cbw - 12, 38, cat, K, 26, 'middle', true);
      subs.slice(0, 3).forEach((sb, k) => { const f = (k + 1) / (Math.min(3, subs.length) + 1), py = cy + s * reach * (1 - f);
        const qx = ax - slant * (1 - f), sl = Math.min(170, tw(sb, 22) + 16); line(g, `M${qx} ${py} L${qx - sl} ${py}`, INKS[c], 2.2);
        if (say(o, t)) fit(g, qx - 8, up ? py + 16 : py - 14, 170, 26, sb, K, 22, 'end'); });
    });
    return g;
  },

  // "milestones x y w | when:what,when:what" — evenly spaced events on a line, cards alternate above/below
  milestones: ([x = 60, y = 270, w = 840], o, t, parent) => {
    const g = mk('g', {}, parent), L = items(t, ['Mon:Idea', 'Tue:Sketch', 'Wed:Build', 'Thu:Test', 'Fri:Share']), n = L.length;
    const X = i => n === 1 ? x + w / 2 : x + 50 + i * (w - 100) / (n - 1), cw = Math.min(210, n === 1 ? 210 : 2 * (w - 100) / (n - 1) - 16), chh = 86;
    arrow(g, x, y, x + w, y, K, 3.6);
    L.forEach((s, i) => {
      const up = i % 2 === 0, c = i % 8, [a, ...b] = s.split(':'), what = b.join(':').trim(), bx = clamp(X(i) - cw / 2, x - 20, x + w + 20 - cw), by = up ? y - 50 - chh : y + 50;
      line(g, `M${X(i)} ${y} L${X(i)} ${up ? y - 50 : y + 50}`, INKS[c], 2.4);
      disc(g, X(i), y, 9, MID[c], INKS[c]); box(g, bx, by, cw, chh, c, 12);
      if (!say(o, t)) {} else if (what) { bold(g, bx + cw / 2, by + 30, txt(a), INKS[c], 26); fit(g, bx + cw / 2, by + 60, cw - 16, 36, what, K, 26); }
      else fit(g, bx + cw / 2, by + chh / 2, cw - 16, chh - 12, a, K, 28);
    });
    return g;
  },

  // "ganttbars x y w h u=Week now=4 | Task,start,end;Task,start,end" — schedule bars on a numbered time axis
  ganttbars: ([x = 40, y = 50, w = 880, h = 420], o, t, parent) => {
    const g = mk('g', {}, parent), R = parts(t || 'Plan,0,2;Design,1,4;Build,3,8;Test,6,9;Launch,9,10').map(s => s.split(',').map(txt)).filter(r => r.length >= 3 && Number.isFinite(+r[1]) && Number.isFinite(+r[2]));
    if (!R.length) throw new Error('ganttbars: rows are "name,start,end"');
    const hi = Math.max(...R.map(r => +r[2])), lo = Math.min(0, ...R.map(r => +r[1])), nw = Math.min(200, w * .24), ax = x + nw, aw = w - nw - 10, n = R.length;
    const X = v => ax + (v - lo) / (hi - lo || 1) * aw, step = Math.max(1, Math.ceil((hi - lo) / 12)), rowH = Math.min(64, (h - 50) / n), top = y + 46;
    for (let v = lo; v <= hi; v += step) { line(g, dashD([[X(v), top - 6], [X(v), top + n * rowH]], 5, 7), '#c2c9cf', 1.6); label(g, X(v), y + 26, String(v), GREY, 22, 'middle'); }
    if (o.u) label(g, ax - 14, y + 26, txt(o.u), GREY, 22, 'end');
    line(g, `M${ax} ${top - 6} H${ax + aw}`, K, 2.4);
    R.forEach(([nm, a, b], i) => { const ry = top + i * rowH, c = i % 8, bx = X(+a), bw = Math.max(8, X(+b) - X(+a));
      if (say(o, t)) fit(g, ax - 14, ry + rowH / 2, nw - 20, rowH - 6, nm, K, 28, 'end');
      wash(g, rr(bx, ry + rowH * .18, bw, rowH * .64, 8), MID[c], { opacity: .85 }); line(g, rr(bx, ry + rowH * .18, bw, rowH * .64, 8), INKS[c], 2.6); });
    if (o.now !== undefined && Number.isFinite(+o.now)) { const nx = X(+o.now);
      line(g, dashD([[nx, top - 14], [nx, top + n * rowH + 6]]), INKS[3], 3); if (showLab(o)) label(g, nx, top + n * rowH + 32, 'now', INKS[3], 26, 'middle'); }
    return g;
  },

  // "quadrants x y w h | TL,TR,BL,BR;x axis,y axis" — 2×2 matrix with named quadrants and axis arrows
  quadrants: ([x = 180, y = 30, w = 620, h = 470], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), Q = items(p[0], ['Plan it', 'Do it now', 'Drop it', 'Hand it off']), A = items(p[1], ['Urgent', 'Important']);
    const bx = x + 44, bw = w - 44, bh = h - 44, qw = bw / 2, qh = bh / 2;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([cx, cy], i) => { const qx = bx + cx * qw, qy = y + cy * qh, c = [0, 3, 6, 1][i];
      wash(g, rr(qx + 4, qy + 4, qw - 8, qh - 8, 12), LIGHT[c]); line(g, rr(qx + 4, qy + 4, qw - 8, qh - 8, 12), INKS[c], 2.6);
      if (p[0] || showLab(o)) fit(g, qx + qw / 2, qy + qh / 2, qw - 40, qh - 30, Q[i] || '', K, 32, 'middle', true); });
    arrow(g, bx, y + bh + 14, bx + bw, y + bh + 14, K, 3); arrow(g, bx - 14, y + bh, bx - 14, y, K, 3);
    if (p[1] || showLab(o)) label(g, bx + bw / 2, y + bh + 42, A[0] || '', INKS[0], 24, 'middle');
    if (A[1] && (p[1] || showLab(o))) label(g, bx - 26, y + bh / 2, A[1], INKS[0], 24, 'middle').setAttribute('transform', `rotate(-90 ${bx - 26} ${y + bh / 2})`);
    return g;
  },

  // "scalemark x y w at=0.7 | Cold,Warm,Hot;Today" — coloured scale bar, labels spread below, marker at a fraction
  scalemark: ([x = 120, y = 270, w = 720], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), E = items(p[0], ['Low', 'High']), cap = p.length > 1 ? txt(p[1]) : '', at = clamp(opt(o, 'at', .7), 0, 1);
    const C = ['#7fb7ea', '#9fd3c7', '#ffd84a', '#f4a531', '#e04b3a'], sw = w / C.length, bh = 40;
    C.forEach((c, i) => wash(g, rr(x + i * sw, y, sw, bh, i === 0 || i === C.length - 1 ? 14 : 0), c));
    line(g, rr(x, y, w, bh, 16), K, 3);
    if (p[0] || showLab(o)) E.forEach((s, i) => label(g, x + (E.length === 1 ? .5 : i / (E.length - 1)) * w, y + bh + 34, s, K, 24, E.length === 1 ? 'middle' : i === 0 ? 'start' : i === E.length - 1 ? 'end' : 'middle'));
    const mx = x + at * w, d = `M${mx} ${y - 4} L${mx - 16} ${y - 30} L${mx + 16} ${y - 30} Z`;
    wash(g, d, '#e04b3a'); line(g, d, INKS[3], 2.8); line(g, `M${mx} ${y - 2} L${mx} ${y + bh + 2}`, INKS[3], 3);
    if (cap) bold(g, clamp(mx, x + tw(cap, 26) / 2, x + w - tw(cap, 26) / 2), y - 44, cap, INKS[3], 26);
    return g;
  },

  // "levelmeter cx cy r val=0.7 | Low,High;caption" — half-dial with green/yellow/red zones and a needle
  levelmeter: ([cx = 480, cy = 360, r = 230], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), E = items(p[0], ['Low', 'High']), cap = p.length > 1 ? txt(p[1]) : '', v = clamp(opt(o, 'val', .7), 0, 1), r2 = r * .62;
    const P = (rad, a) => [cx + rad * Math.cos(a * RAD), cy - rad * Math.sin(a * RAD)];
    const zone = (a0, a1) => `M${P(r, a0).join(' ')} A${r} ${r} 0 0 1 ${P(r, a1).join(' ')} L${P(r2, a1).join(' ')} A${r2} ${r2} 0 0 0 ${P(r2, a0).join(' ')} Z`;
    [[180, 120, MID[2]], [120, 60, MID[4]], [60, 0, MID[3]]].forEach(([a0, a1, c]) => wash(g, zone(a0, a1), c, { opacity: .85 }));
    line(g, `${zone(180, 0)}`, K, 3);
    line(g, Array.from({ length: 11 }, (_, i) => { const a = 180 - i * 18; return `M${P(r2, a).join(' ')} L${P(r2 + (i % 5 ? 12 : 22), a).join(' ')}`; }).join(' '), K, 2.2);
    const a = 180 - v * 180, nt = P(r * .9, a);
    line(g, `M${cx} ${cy} L${nt.join(' ')}`, K, 5); disc(g, cx, cy, 14, '#5b6670', K);
    if (p[0] || showLab(o)) { label(g, cx - r * .81, cy + 34, E[0], K, 24, 'middle'); label(g, cx + r * .81, cy + 34, E.at(-1), K, 24, 'middle'); }
    if (cap) bold(g, cx, cy + 52, cap, INKS[0], 30);
    return g;
  },

  // "checksteps x y w done=2 | Sign up,Verify,Profile,Go" — progress tracker: done steps ticked, current ringed
  checksteps: ([x = 80, y = 230, w = 800], o, t, parent) => {
    const g = mk('g', {}, parent), L = items(t, steps(o, 'Step')), n = L.length, done = clamp(Math.round(opt(o, 'done', 2)), 0, n), r = 28;
    const X = i => n === 1 ? x + w / 2 : x + r + 20 + i * (w - 2 * r - 40) / (n - 1), sp = n === 1 ? w : (w - 2 * r - 40) / (n - 1);
    for (let i = 0; i < n - 1; i++) { const a = X(i) + r + 4, b = X(i + 1) - r - 4;
      i < done ? line(g, `M${a} ${y} L${b} ${y}`, INKS[2], 5) : line(g, dashD([[a, y], [b, y]]), '#aab3bb', 3); }
    L.forEach((s, i) => {
      if (i < done) { disc(g, X(i), y, r, MID[2], INKS[2]); tick(g, X(i), y, 30, '#fff', 5); }
      else if (i === done) { disc(g, X(i), y, r, '#fff0a6', INKS[1]); line(g, ring(X(i), y, r + 7), INKS[1], 2.4); bold(g, X(i), y + 9, String(i + 1), INKS[1], 26); }
      else { disc(g, X(i), y, r, '#eef1f4', '#aab3bb'); bold(g, X(i), y + 9, String(i + 1), GREY, 26); }
      if (say(o, t)) fit(g, X(i), y + r + 44, Math.min(sp - 10, 200), 56, s, i <= done ? K : GREY, 24);
    });
    return g;
  },

  // "ipo x y w h | inputs;process;output" — input → process → output boxes with headings
  ipo: ([x = 60, y = 130, w = 840, h = 260], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t || 'Flour, eggs, milk;Mix and cook;Pancakes'), H = ['INPUT', 'PROCESS', 'OUTPUT'], C = [0, 1, 2], gap = 60, bw = (w - 2 * gap) / 3;
    H.forEach((hd, i) => { const bx = x + i * (bw + gap), c = C[i];
      if (showLab(o)) label(g, bx + bw / 2, y + 26, hd, INKS[c], 24, 'middle').setAttribute('font-weight', 700);
      const d = i === 1 ? rr(bx, y + 44, bw, h - 44, 18) : polyD(i ? [[bx, y + 44], [bx + bw - 24, y + 44], [bx + bw, y + 44 + (h - 44) / 2], [bx + bw - 24, y + h], [bx, y + h]] : [[bx, y + 44], [bx + bw, y + 44], [bx + bw, y + h], [bx, y + h], [bx + 24, y + 44 + (h - 44) / 2]]);
      wash(g, d, LIGHT[c]); line(g, d, INKS[c], 3);
      if (say(o, t)) fit(g, bx + bw / 2, y + 44 + (h - 44) / 2, bw - 60, h - 64, p[i] || '…', K, 28);
      if (i < 2) arrow(g, bx + bw + 10, y + 44 + (h - 44) / 2, bx + bw + gap - 10, y + 44 + (h - 44) / 2, K, 3.4); });
    return g;
  },

  // "nodenet cx cy r links=0-1,1-2 | Hub;A,B,C,D" — network of named nodes; a "Hub;" part adds a centre node
  nodenet: ([cx = 480, cy = 270, r = 190], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), hub = p.length > 1 ? txt(p[0]) : '', L = items(p.at(-1), steps(o, 'Node', 6)), n = L.length, nr = 48;
    const N = L.map((_, i) => [cx + r * 1.45 * Math.cos((-90 + 360 * i / n) * RAD), cy + r * Math.sin((-90 + 360 * i / n) * RAD)]);
    const H = hub ? [cx, cy] : null, all = hub ? [...N, H] : N;
    const E = o.links ? String(o.links).split(',').map(s => s.split('-').map(Number)).filter(([a, b]) => all[a] && all[b] && a !== b)
      : [...N.map((_, i) => [i, (i + 1) % n]).slice(0, n > 2 ? n : 1), ...(hub ? N.map((_, i) => [i, n]) : N.map((_, i) => [i, (i + 2) % n]).filter((_, i) => n > 4 && i % 2 === 0))];
    E.forEach(([a, b]) => { const [x0, y0] = all[a], [x1, y1] = all[b], D = Math.hypot(x1 - x0, y1 - y0), ra = a === n && hub ? 54 : nr, rb = b === n && hub ? 54 : nr;
      line(g, `M${x0 + (x1 - x0) * ra / D} ${y0 + (y1 - y0) * ra / D} L${x1 - (x1 - x0) * rb / D} ${y1 - (y1 - y0) * rb / D}`, GREY, 3); });
    N.forEach(([nx, ny], i) => { disc(g, nx, ny, nr, LIGHT[i % 8], INKS[i % 8]); if (say(o, t)) fit(g, nx, ny, nr * 1.7, nr * 1.2, L[i], K, 26, 'middle', true); });
    if (hub) { disc(g, cx, cy, 54, '#fff0a6', INKS[4]); fit(g, cx, cy, 92, 64, hub, K, 26, 'middle', true); }
    return g;
  },

  // "callout x y w h tip=x,y k=speech|thought | text" — speech or thought bubble with its tail on a point
  callout: ([x = 330, y = 70, w = 380, h = 150], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'speech', [px, py] = String(o.tip || `${x + w * .25},${y + h + 110}`).split(',').map(Number), r = 22;
    if (k === 'speech') {
      const side = py > y + h ? 'b' : py < y ? 't' : px > x + w ? 'r' : 'l', bx = clamp(px, x + r + 22, x + w - r - 22), by = clamp(py, y + r + 22, y + h - r - 22), b = 18;
      const d = `M${x + r} ${y} ${side === 't' ? `L${bx - b} ${y} L${px} ${py} L${bx + b} ${y}` : ''} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r}`
        + ` ${side === 'r' ? `L${x + w} ${by - b} L${px} ${py} L${x + w} ${by + b}` : ''} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h}`
        + ` ${side === 'b' ? `L${bx + b} ${y + h} L${px} ${py} L${bx - b} ${y + h}` : ''} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r}`
        + ` ${side === 'l' ? `L${x} ${by + b} L${px} ${py} L${x} ${by - b}` : ''} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`;
      wash(g, d, '#ffffff'); line(g, d, K, 3.2);
    } else if (k === 'thought') {
      const ecx = x + w / 2, ecy = y + h / 2, m = 14, Q = Array.from({ length: m }, (_, i) => [ecx + w / 2 * Math.cos(2 * Math.PI * i / m), ecy + h / 2 * Math.sin(2 * Math.PI * i / m)]);
      const d = Q.map((q, i) => { const nq = Q[(i + 1) % m], cr = Math.hypot(nq[0] - q[0], nq[1] - q[1]) * .62; return `${i ? '' : `M${q[0]} ${q[1]} `}A${cr} ${cr} 0 0 1 ${nq[0]} ${nq[1]}`; }).join(' ') + ' Z';
      wash(g, d, '#ffffff'); line(g, d, K, 3);
      const dx = px - ecx, dy = py - ecy, D = Math.hypot(dx, dy) || 1, e = boxExt(dx / D, dy / D, w / 2, h / 2) * .95;
      [[.3, 13], [.62, 9], [.9, 6]].forEach(([f, cr]) => { const u = e + (D - e) * f, qx = ecx + dx / D * u, qy = ecy + dy / D * u; wash(g, ring(qx, qy, cr), '#ffffff'); line(g, ring(qx, qy, cr), K, 2.6); });
    } else throw new Error(`callout: unknown k "${k}"`);
    if (say(o, t)) fit(g, x + w / 2, y + h / 2, w - 50, h - 30, t || 'Did you know?', K, 30);
    return g;
  },

  // "sticky cx cy size c=yellow|pink|blue|green|orange rot=-3 | text" — sticky note with tape and folded corner
  sticky: ([cx = 480, cy = 270, S = 260], o, t, parent) => {
    const C = { yellow: ['#ffe97a', '#c9a400'], pink: ['#ffc2d1', '#c2557a'], blue: ['#bfe0ff', '#2b6cc4'], green: ['#c8f0b0', '#2c6a22'], orange: ['#ffd29a', '#c97a10'] }[o.c || 'yellow'] || ['#ffe97a', '#c9a400'];
    const g = mk('g', { transform: `translate(${cx} ${cy}) rotate(${opt(o, 'rot', -3)})` }, parent), s = S / 2, f = S * .14;
    wash(g, `M${-s + 8} ${-s + 10} H${s + 8} V${s + 10} H${-s + 8} Z`, '#000', { opacity: .12 });
    const d = `M${-s} ${-s} H${s} V${s - f} L${s - f} ${s} H${-s} Z`;
    wash(g, d, C[0]); line(g, d, C[1], 2.6);
    wash(g, `M${s} ${s - f} L${s - f} ${s - f} L${s - f} ${s} Z`, C[1], { opacity: .45 }); line(g, `M${s} ${s - f} L${s - f} ${s - f} L${s - f} ${s}`, C[1], 2.2);
    const tp = `M${-S * .17} ${-s - 14} H${S * .17} V${-s + 14} H${-S * .17} Z`; wash(g, tp, '#e8e2d0', { opacity: .75 }); line(g, tp, '#b9b19a', 1.6);
    if (say(o, t)) fit(g, 0, 4, S * .8, S * .66, t || 'Remember this!', K, 34);
    return g;
  },

  // "numlist x y w | Title;first,second,third" — card with an optional title and numbered points
  numlist: ([x = 260, y = 40, w = 440], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t), ttl = p.length > 1 ? txt(p[0]) : '', L = items(p.at(-1), ['Read the question', 'Draw a picture', 'Solve it', 'Check it']), rowH = 64;
    const head = ttl ? 70 : 18, H = head + L.length * rowH + 14;
    wash(g, rr(x, y, w, H, 16), PAPER); line(g, rr(x, y, w, H, 16), K, 3);
    if (ttl) { fit(g, x + w / 2, y + 36, w - 40, 44, ttl, INKS[0], 32, 'middle', true); line(g, `M${x + 24} ${y + 64} H${x + w - 24}`, INKS[0], 2.2); }
    L.forEach((s, i) => { const ry = y + head + rowH * (i + .5) + 4;
      disc(g, x + 38, ry, 18, MID[i % 8], INKS[i % 8]); bold(g, x + 38, ry + 8, String(i + 1), '#fff', 24);
      if (say(o, t)) fit(g, x + 70, ry, w - 92, rowH - 6, s, K, 30, 'start'); });
    return g;
  },

  // "highlight cx cy w h k=circle|box|underline|wavy|band|star c=red" — marker emphasis drawn around or under a spot
  highlight: ([cx = 480, cy = 270, w = 320, h = 120], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'circle', col = INKS[{ red: 3, blue: 0, green: 2, orange: 1, purple: 5 }[o.c] ?? 3];
    const x = cx - w / 2, y = cy - h / 2;
    if (k === 'circle') line(g, polyD(Array.from({ length: 73 }, (_, i) => { const a = (-160 + i * 5.3) * RAD, f = 1.08 - .1 * i / 72; return [cx + w / 2 * f * Math.cos(a), cy + h / 2 * f * Math.sin(a)]; }), false), col, 4);
    else if (k === 'box') line(g, `M${x - 14} ${y} H${x + w + 6} M${x + w} ${y - 12} V${y + h + 8} M${x + w + 12} ${y + h} H${x - 8} M${x} ${y + h + 12} V${y - 10}`, col, 4);
    else if (k === 'underline') line(g, `M${x} ${y + h} Q${cx} ${y + h + 10} ${x + w} ${y + h - 6} M${x + 20} ${y + h + 14} Q${cx} ${y + h + 20} ${x + w - 10} ${y + h + 8}`, col, 4);
    else if (k === 'wavy') { let d = `M${x} ${y + h}`; const m = Math.max(4, Math.round(w / 36)); for (let i = 0; i < m; i++) d += ` q${w / m / 2} ${i % 2 ? 12 : -12} ${w / m} 0`; line(g, d, col, 4); }
    else if (k === 'band') { const d = `M${x} ${y + 6} L${x + w} ${y} L${x + w + 6} ${y + h} L${x + 4} ${y + h + 4} Z`; wash(g, d, '#ffe94a', { opacity: .55 }); line(g, `M${x + 2} ${y + h + 6} L${x + w + 4} ${y + h + 2}`, '#e0c400', 3); }
    else if (k === 'star') { const R = Math.min(w, h) / 2, d = polyD(Array.from({ length: 10 }, (_, i) => { const a = (-90 + i * 36) * RAD, q = i % 2 ? R * .45 : R; return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
      wash(g, d, '#ffd84a'); line(g, d, INKS[1], 3.4); }
    else throw new Error(`highlight: unknown k "${k}"`);
    if (t) label(g, cx, y - 24, txt(t), col, 26, 'middle');
    return g;
  },

  // "bigarrow cx cy size k=right|left|up|down|growth|decline c=orange | text" — fat block arrow or a rising/falling trend arrow
  bigarrow: ([cx = 480, cy = 270, S = 320], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'right', ci = { orange: 1, blue: 0, green: 2, red: 3, yellow: 4, purple: 5 }[o.c];
    if (k === 'growth' || k === 'decline') {
      const up = k === 'growth' ? -1 : 1, c = ci ?? (k === 'growth' ? 2 : 3), s = S / 2;
      const P = [[-s, -up * s * .5], [-s * .4, up * s * .05], [-s * .05, -up * s * .2], [s * .8, up * s * .55]].map(([a, b]) => [cx + a, cy + b]);
      const [ex, ey] = P[3], [qx, qy] = P[2], a = Math.atan2(ey - qy, ex - qx), hl = S * .2, hw = S * .14;
      const hd = polyD([[ex + Math.cos(a) * hl * .6, ey + Math.sin(a) * hl * .6], [ex - Math.sin(a) * hw, ey + Math.cos(a) * hw], [ex + Math.sin(a) * hw, ey - Math.cos(a) * hw]]);
      line(g, polyD(P, false), INKS[c], S * .06); wash(g, hd, MID[c]); line(g, hd, INKS[c], 3);
      if (t) label(g, cx - s, cy + (up < 0 ? s * .5 + 44 : -s * .5 - 24), txt(t), INKS[c], 30, 'start');
      return g;
    }
    const rot = { right: 0, down: 90, left: 180, up: -90 }[k];
    if (rot === undefined) throw new Error(`bigarrow: unknown k "${k}"`);
    const c = ci ?? 1, sh = S * .3, hh = S * .6, hl = S * .38, s = S / 2, a = mk('g', { transform: `translate(${cx} ${cy}) rotate(${rot})` }, g);
    const d = polyD([[-s, -sh / 2], [s - hl, -sh / 2], [s - hl, -hh / 2], [s, 0], [s - hl, hh / 2], [s - hl, sh / 2], [-s, sh / 2]]);
    wash(a, d, MID[c]); line(a, d, INKS[c], 3.2);
    if (t) { if (rot % 180 === 0) fit(g, cx + (rot ? hl / 2 : -hl / 2), cy, S - hl - 20, sh - 8, t, K, 30, 'middle', true);
      else label(g, cx + hh / 2 + 16, cy + 10, txt(t), INKS[c], 30, 'start').setAttribute('font-weight', 700); }
    return g;
  },

  // "brace x1 y1 x2 y2 | text" — curly brace along a segment, tip to its right-hand side (swap ends to flip), label at the tip
  brace: ([x1 = 200, y1 = 330, x2 = 760, y2 = 330], o, t, parent) => {
    const g = mk('g', {}, parent), L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux, D = clamp(L * .1, 16, 40);
    const P = (s, n) => `${x1 + s * ux + n * nx} ${y1 + s * uy + n * ny}`;
    line(g, `M${P(0, 0)} Q${P(0, D / 2)} ${P(D / 2, D / 2)} L${P(L / 2 - D / 2, D / 2)} Q${P(L / 2, D / 2)} ${P(L / 2, D)} Q${P(L / 2, D / 2)} ${P(L / 2 + D / 2, D / 2)} L${P(L - D / 2, D / 2)} Q${P(L, D / 2)} ${P(L, 0)}`, INKS[0], 3.4);
    if (t) { const tx = x1 + L / 2 * ux + (D + 14) * nx, ty = y1 + L / 2 * uy + (D + 14) * ny, an = Math.abs(nx) < .5 ? 'middle' : nx > 0 ? 'start' : 'end';
      label(g, tx, ty + (Math.abs(nx) < .5 ? (ny > 0 ? 24 : -4) : 9), txt(t), INKS[0], 28, an); }
    return g;
  },

  // "bigsym cx cy size k=plus|minus|times|divide|equals|notequal|question|check|cross" — big marker symbol on a soft spot
  bigsym: ([cx = 480, cy = 270, S = 160], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'plus', s = S / 2, w = S * .11;
    const M = { plus: [0, `M${cx - s * .7} ${cy} H${cx + s * .7} M${cx} ${cy - s * .7} V${cy + s * .7}`], minus: [3, `M${cx - s * .7} ${cy} H${cx + s * .7}`],
      times: [5, `M${cx - s * .5} ${cy - s * .5} L${cx + s * .5} ${cy + s * .5} M${cx + s * .5} ${cy - s * .5} L${cx - s * .5} ${cy + s * .5}`],
      divide: [6, `M${cx - s * .7} ${cy} H${cx + s * .7} M${cx} ${cy - s * .48} l.1 0 M${cx} ${cy + s * .48} l.1 0`],
      equals: [1, `M${cx - s * .65} ${cy - s * .24} H${cx + s * .65} M${cx - s * .65} ${cy + s * .24} H${cx + s * .65}`],
      notequal: [3, `M${cx - s * .65} ${cy - s * .24} H${cx + s * .65} M${cx - s * .65} ${cy + s * .24} H${cx + s * .65} M${cx + s * .3} ${cy - s * .65} L${cx - s * .3} ${cy + s * .65}`],
      question: [0, `M${cx - s * .38} ${cy - s * .3} Q${cx - s * .38} ${cy - s * .72} ${cx} ${cy - s * .72} Q${cx + s * .42} ${cy - s * .72} ${cx + s * .42} ${cy - s * .34} Q${cx + s * .42} ${cy - s * .05} ${cx} ${cy + s * .1} V${cy + s * .3} M${cx} ${cy + s * .64} l.1 0`],
      check: [2, `M${cx - s * .55} ${cy} L${cx - s * .15} ${cy + s * .42} L${cx + s * .6} ${cy - s * .5}`],
      cross: [3, `M${cx - s * .5} ${cy - s * .5} L${cx + s * .5} ${cy + s * .5} M${cx + s * .5} ${cy - s * .5} L${cx - s * .5} ${cy + s * .5}`] }[k];
    if (!M) throw new Error(`bigsym: unknown k "${k}"`);
    wash(g, ring(cx, cy, s), LIGHT[M[0]], { opacity: .8 });
    line(g, M[1], INKS[M[0]], k === 'divide' || k === 'question' ? w * 1.05 : w);
    return g;
  },

  // "qacard x y w h | question;answer" — question panel above its answer panel, Q and A badges
  qacard: ([x = 180, y = 50, w = 600, h = 430], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t || 'Why is the sky blue?;Air scatters blue light the most'), gap = 18, qh = (h - gap) * .45, ah = h - gap - qh;
    [[y, qh, 'Q', 0, p[0]], [y + qh + gap, ah, 'A', 2, p[1] || '…']].forEach(([by, bh, b, c, s]) => {
      wash(g, rr(x, by, w, bh, 16), LIGHT[c]); line(g, rr(x, by, w, bh, 16), INKS[c], 3);
      disc(g, x + 44, by + bh / 2, 26, MID[c], INKS[c]); bold(g, x + 44, by + bh / 2 + 11, b, '#fff', 32);
      if (say(o, t)) fit(g, x + 86, by + bh / 2, w - 110, bh - 24, s, K, b === 'Q' ? 40 : 34, 'start', b === 'Q'); });
    return g;
  },

  // "termcard x y w h | Term;definition;example" — index card: term on top, ruled definition, e.g. line
  termcard: ([x = 200, y = 80, w = 560, h = 360], o, t, parent) => {
    const g = mk('g', {}, parent), p = parts(t || 'Habitat;The natural home of a plant or animal;A pond for a frog');
    const ex = p[2] ? txt(p[2]).replace(/^(e\.g\.?\s*)?/i, showLab(o) ? 'e.g. ' : '') : '';
    wash(g, rr(x + 6, y + 8, w, h, 10), '#000', { opacity: .1 }); wash(g, rr(x, y, w, h, 10), PAPER); line(g, rr(x, y, w, h, 10), '#9aa4ad', 2.6);
    line(g, Array.from({ length: Math.floor((h - 110) / 42) }, (_, i) => `M${x + 20} ${y + 120 + i * 42} H${x + w - 20}`).join(' '), '#bcd6ee', 1.4);
    line(g, `M${x + 16} ${y + 80} H${x + w - 16}`, INKS[3], 2.4);
    if (say(o, t)) fit(g, x + w / 2, y + 44, w - 40, 56, p[0], INKS[0], 40, 'middle', true);
    if (say(o, t)) fit(g, x + w / 2, y + 80 + (h - 80 - (ex ? 56 : 0)) / 2, w - 50, h - 100 - (ex ? 56 : 0), p[1] || '…', K, 36);
    if (ex && say(o, t)) fit(g, x + w / 2, y + h - 32, w - 50, 40, ex, INKS[2], 28);
    return g;
  },
});
})();
