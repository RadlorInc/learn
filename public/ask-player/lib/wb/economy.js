// Whiteboard economy: markets, money, business and personal finance. Every number on a chart is computed from the
// call (totals, nets, break-even points), so one line serves any values. Helpers stay private to this block.
(() => {
const K = '#2f3640', DK = '#2f3a45', SOFT = '#cfd8e0', TICK = '#4a5560', GRN = '#2c6a22', RED = '#c0392b';
const GOLD = '#f3c33b', GOLDK = '#8a6414', PAPER = '#fdfcf6', PAPERK = '#8a8f96';
const PAL = ['#7fb7ea', '#f4a531', '#5fae3a', '#e04b3a', '#ffd84a', '#b48ad8', '#4fc1b0', '#f08a9a'];
const PINK = ['#2b6cc4', '#c97a10', '#2c6a22', '#c0392b', '#b08a00', '#6a3fa0', '#1f7f72', '#a3324a'];
const SKIN = ['#f6d2b0', '#e0ac7e', '#b9794a', '#7d4a2a'];
const RAD = Math.PI / 180;

// ── parsing: "3,5,2" numbers, "Rent:40,Food:25" pairs, "_" = space
const nlist = s => String(s ?? '').split(',').filter(x => x.trim() !== '').map(Number).filter(Number.isFinite);
const words = s => String(s ?? '').split(',').map(x => x.trim().replace(/_/g, ' ')).filter(Boolean);
const pairs = s => words(s).map(w => { const m = w.match(/^(.*?)\s*[:=]\s*(-?[\d.]+(?:x-?[\d.]+)?)$/); return m ? [m[1], m[2]] : [w, '']; });
const opt = (o, k, d) => (o[k] === undefined || o[k] === '' || !Number.isFinite(+o[k]) ? d : +o[k]);
const txt = s => String(s ?? '').replace(/_/g, ' ');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = v => { const r = Math.round(v * 100) / 100; return (Object.is(r, -0) ? 0 : r).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
const cents = v => (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (v, cur = '$', f = fmt) => (v < 0 ? '-' : '') + cur + f(Math.abs(v));
const curOf = o => txt(o.cur ?? '$');
const showLab = o => o.lab !== '0' && o.labels !== '0';   // lab=0 / labels=0 hide the recipe's own words

// ── geometry (local drawings use screen angles: 0° = right, clockwise; charts use x y w h boxes)
const G = (cx, cy, s, o, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${s})` }, parent);
const F = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...extra }, g);
const P = (g, d, fill, ink = DK, w = 3) => { if (fill) F(g, d, fill); return line(g, d, ink, w); };
const R = (x, y, w, h, r = 0) => r
  ? `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
  : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
const E = (x, y, rx, ry = rx) => `M${x + rx} ${y} A${rx} ${ry} 0 1 0 ${x - rx} ${y} A${rx} ${ry} 0 1 0 ${x + rx} ${y} Z`;
const pt = (x, y, r, a) => [x + r * Math.cos(a * RAD), y + r * Math.sin(a * RAD)];
const arc = (x, y, r, a0, a1) => { const [x0, y0] = pt(x, y, r, a0), [x1, y1] = pt(x, y, r, a1); return `M${x0} ${y0} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`; };
// annular sector between radii r0<r1, from a0 to a1 (screen degrees, a1 > a0)
const sector = (x, y, r0, r1, a0, a1) => { const big = a1 - a0 > 180 ? 1 : 0, p = (r, a) => pt(x, y, r, a).join(' ');
  return r0 > 0 ? `M${p(r1, a0)} A${r1} ${r1} 0 ${big} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 ${big} 0 ${p(r0, a0)} Z`
    : `M${x} ${y} L${p(r1, a0)} A${r1} ${r1} 0 ${big} 1 ${p(r1, a1)} Z`; };
const polyD = (pts, close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ') + (close ? ' Z' : '');
const arrow = (g, x0, y0, x1, y1, col = K, w = 3, h = 13) => { line(g, `M${x0} ${y0} L${x1} ${y1}`, col, w); line(g, head(x1, y1, x0, y0, h), col, w, { class: 'ink head' }); };
// dashes as separate sub-paths: the player animates ink with stroke-dasharray, which would erase a real dash pattern
const dashD = (pts, on = 9, off = 7) => { let d = '', ph = 0, pen = true;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0); let u = 0;
    while (u < L - 1e-9) { const st = Math.min((pen ? on : off) - ph, L - u), at = s => `${x0 + (x1 - x0) * s / L} ${y0 + (y1 - y0) * s / L}`;
      if (pen) d += `M${at(u)} L${at(u + st)} `; u += st; ph += st; if (ph >= (pen ? on : off) - 1e-9) { ph = 0; pen = !pen; } } }
  return d || `M${pts[0][0]} ${pts[0][1]} l0.1 0`; };
const dash = (g, pts, col = K, w = 2.4) => line(g, dashD(pts), col, w);
const tw = (s, size) => String(s).length * size * 0.5;
const fit = (s, w, max) => clamp(w / Math.max(1, String(s).length * 0.52), 10, max);   // font size so s fits in w

// ── value axis inside the box x y w h: grid lines, ticks, numbers with pre/suf. lo/hi are widened to nice steps.
const niceStep = (span, n) => { const raw = Math.abs(span || 1) / Math.max(1, n), p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; };
const chart = (g, x, y, w, h, lo, hi, o = {}) => {
  const L = o.left ?? 62, px = x + L, py = y + (o.top ?? 28), pw = w - L - (o.right ?? 10), ph = h - (o.top ?? 28) - (o.bottom ?? 42);
  const n = Math.max(2, Math.round(ph / 55)); if (!(hi > lo)) hi = lo + 1;
  const s = niceStep(hi - lo, n); lo = Math.floor(lo / s + 1e-9) * s; hi = Math.ceil(hi / s - 1e-9) * s;
  const Y = v => py + ph - (v - lo) / (hi - lo) * ph, ys = [];
  for (let v = lo; v <= hi + s * 1e-6; v += s) ys.push(+v.toPrecision(12));
  const pre = txt(o.pre || ''), suf = txt(o.suf || ''), show = v => (v < 0 ? '-' : '') + pre + fmt(Math.abs(v)) + suf, base = Y(clamp(0, lo, hi));
  line(g, ys.filter(v => Y(v) !== base).map(v => `M${px} ${Y(v)} L${px + pw} ${Y(v)}`).join(' ') || `M${px} ${py} l0.1 0`, SOFT, 1.4);
  line(g, `M${px} ${py + ph} L${px} ${py - 12}`, K, 3);
  line(g, `M${px} ${base} L${px + pw} ${base}`, K, 3);
  ys.forEach(v => label(g, px - 9, Y(v) + 6, show(v), TICK, 17, 'end'));
  if (o.yl) label(g, px + 8, py - 8, txt(o.yl), TXT.blue, 19);
  return { px, py, pw, ph, Y, base, lo, hi, show };
};

// ── small shared parts
const coinAt = (g, x, y, r) => { P(g, E(x, y, r), GOLD, GOLDK, 2.4); line(g, E(x, y, r * .7), '#c98a00', 1.6); };
const noteAt = (g, x, y, w, t) => { const h = w * .5; P(g, R(x - w / 2, y - h / 2, w, h, 4), '#b6dfa8', GRN, 2.6);
  P(g, E(x, y, h * .32), '#e4f2d0', GRN, 2); if (t) label(g, x, y + h * .14, t, GRN, h * .34, 'middle'); };
const head1 = (g, x, y, r, skin, shirt) => { P(g, `M${x - r * 1.5} ${y + r * 2.6} Q${x - r * 1.5} ${y + r * 1.1} ${x} ${y + r * 1.1} Q${x + r * 1.5} ${y + r * 1.1} ${x + r * 1.5} ${y + r * 2.6} Z`, shirt, DK, 2.4);
  P(g, E(x, y, r), skin, DK, 2.4); };
const check = (g, x, y, s, col = '#ffffff', w = 5) => line(g, `M${x - s * .5} ${y} L${x - s * .12} ${y + s * .38} L${x + s * .55} ${y - s * .4}`, col, w);
const paper = (g, x, y, w, h) => { F(g, R(x + 6, y + 6, w, h, 6), '#000000', { opacity: .08 }); P(g, R(x, y, w, h, 6), PAPER, PAPERK, 2.6); };
const apple = (g, x, y, r) => { P(g, `M${x} ${y - r * .7} C${x - r * 1.3} ${y - r * 1.3} ${x - r * 1.2} ${y + r} ${x} ${y + r * .9} C${x + r * 1.2} ${y + r} ${x + r * 1.3} ${y - r * 1.3} ${x} ${y - r * .7} Z`, FILL.red, '#8e2a1f', 2.2);
  line(g, `M${x} ${y - r * .7} L${x + r * .15} ${y - r * 1.2}`, '#5a3a1a', 2.2); P(g, `M${x + r * .15} ${y - r * 1.05} Q${x + r * .7} ${y - r * 1.4} ${x + r * .8} ${y - r * .9} Q${x + r * .4} ${y - r * .75} ${x + r * .15} ${y - r * 1.05} Z`, FILL.green, GRN, 1.6); };
// rows of "name … amount" on a document; returns the y after the last row
const rows = (g, x, w, y, list, gap, size, cur, f = fmt) => { list.forEach(([n, v]) => { label(g, x, y, n, K, size); label(g, x + w, y, money(v, cur, f), v < 0 ? RED : K, size, 'end'); y += gap; }); return y; };

Object.assign(window.RECIPES, {
  // "candles x y w h vals=20,22,21,25 pre=$ | label" — stock candles from closing prices, close line
  candles: ([x = 120, y = 40, w = 720, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), c = nlist(o.vals || '20,22,21,25,24,28,27,31,29,34');
    if (c.length < 2) throw new Error('candles: need 2+ vals');
    const span = (Math.max(...c) - Math.min(...c)) || Math.abs(c[0]) || 1;
    const k = c.map((v, i) => { const op = i ? c[i - 1] : c[0] - span * .06, wk = span * (.04 + .03 * ((i * 7) % 3));
      return { op, cl: v, hi: Math.max(op, v) + wk, lo: Math.min(op, v) - wk * .8 }; });
    const f = chart(g, x, y, w, h, Math.min(...k.map(q => q.lo)), Math.max(...k.map(q => q.hi)), { pre: o.pre ?? '$', suf: o.suf, yl: o.yl });
    const slot = f.pw / c.length, bw = slot * .5, X = i => f.px + slot * (i + .5);
    k.forEach((q, i) => { const up = q.cl >= q.op, top = f.Y(Math.max(q.op, q.cl)), bot = f.Y(Math.min(q.op, q.cl));
      F(g, R(X(i) - bw / 2, top, bw, Math.max(2, bot - top)), up ? FILL.green : FILL.red); });
    k.forEach((q, i) => { const up = q.cl >= q.op, ink = up ? GRN : RED, top = f.Y(Math.max(q.op, q.cl)), bot = f.Y(Math.min(q.op, q.cl));
      line(g, `M${X(i)} ${f.Y(q.hi)} L${X(i)} ${top} M${X(i)} ${Math.max(top + 2, bot)} L${X(i)} ${f.Y(q.lo)} ` + R(X(i) - bw / 2, top, bw, Math.max(2, bot - top)), ink, 2.6); });
    line(g, polyD(c.map((v, i) => [X(i), f.Y(v)]), false), INK.blue, 2.2, { opacity: .7 });
    const last = c.at(-1), up = last >= c[0];
    label(g, f.px + f.pw - 4, f.py + 4, `${f.show(last)}  ${up ? '▲' : '▼'} ${fmt(Math.abs((last - c[0]) / (c[0] || 1) * 100))}%`, up ? GRN : RED, 24, 'end');
    if (t) label(g, f.px + 14, f.py + 4, t, TXT.blue, 24);
    return g;
  },

  // "market cx cy size k=up|down | text" — zig-zag market arrow over bars, green up or red down
  market: ([cx = 480, cy = 270, S = 300], o, t, parent) => {
    const g = G(cx, cy, S / 300, o, parent), up = o.k !== 'down', col = up ? GRN : RED, fill = up ? FILL.green : FILL.red;
    const hs = up ? [50, 80, 110, 150] : [150, 110, 80, 50];
    hs.forEach((h, i) => P(g, R(-130 + i * 66, 100 - h, 46, h, 3), up ? '#cfe8c4' : '#f6cdc6', up ? '#8fbf80' : '#e2a198', 2));
    line(g, 'M-150 100 H150', K, 3);
    const z = up ? [[-140, 60], [-70, 0], [-20, 30], [60, -60], [120, -110]] : [[-140, -110], [-70, -50], [-20, -80], [60, 10], [120, 60]];
    line(g, polyD(z, false), col, 12);
    const [ax, ay] = z.at(-1), [bx, by] = z.at(-2), a = Math.atan2(ay - by, ax - bx), tip = [ax + 26 * Math.cos(a), ay + 26 * Math.sin(a)];
    P(g, polyD([tip, [ax + 24 * Math.cos(a + 2.2), ay + 24 * Math.sin(a + 2.2)], [ax + 24 * Math.cos(a - 2.2), ay + 24 * Math.sin(a - 2.2)]]), fill, col, 4);
    if (t || showLab(o)) label(g, 0, 140, t || (up ? 'market up' : 'market down'), col, 30, 'middle');
    return g;
  },

  // "inflation cx cy width pct=100 money=$20 | 2000,2025" — same note buys a smaller basket later
  inflation: ([cx = 480, cy = 280, S = 640], o, t, parent) => {
    const g = G(cx, cy, S / 640, o, parent), pct = Math.max(0, opt(o, 'pct', 100)), yrs = t ? words(t) : ['then', 'now'];
    const n0 = 8, n1 = clamp(Math.round(n0 / (1 + pct / 100)), 1, n0), note = txt(o.money ?? '$20');
    const basket = (bx, n) => {
      for (let i = 0; i < n; i++) { const row = i < 4 ? 0 : 1, col = i % 4, x = bx - 66 + col * 44 + row * 22, y = 18 - row * 34;
        if (i % 3 === 0) apple(g, x, y, 17);
        else if (i % 3 === 1) { P(g, E(x, y, 22, 14), '#e8b86a', '#8a5a1a', 2.2); line(g, `M${x - 8} ${y - 9} l6 8 M${x + 2} ${y - 11} l6 8`, '#8a5a1a', 1.8); }
        else { P(g, R(x - 13, y - 22, 26, 38, 2), '#ffffff', '#5a7a9a', 2.2); P(g, `M${x - 13} ${y - 22} L${x} ${y - 32} L${x + 13} ${y - 22} Z`, '#7fb7ea', '#5a7a9a', 2); } }
      P(g, `M${bx - 110} 34 L${bx + 110} 34 L${bx + 88} 110 L${bx - 88} 110 Z`, '#d9a15a', '#7a4a1a', 3);
      line(g, `M${bx - 102} 60 H${bx + 102} M${bx - 96} 85 H${bx + 96}` + [-60, -20, 20, 60].map(d => ` M${bx + d} 34 L${bx + d * .8} 110`).join(''), '#7a4a1a', 1.8);
      line(g, `M${bx - 100} 34 Q${bx} -110 ${bx + 100} 34`, '#7a4a1a', 4); };
    basket(-170, n0); basket(170, n1);
    noteAt(g, -170, -150, 120, note); noteAt(g, 170, -150, 120, note);
    if (t || showLab(o)) label(g, -170, 150, yrs[0], K, 28, 'middle'); if (t || showLab(o)) label(g, 170, 150, yrs[1] || '', K, 28, 'middle');
    arrow(g, -50, -150, 50, -150, RED, 4); label(g, 0, -178, showLab(o) ? `prices +${fmt(pct)}%` : `+${fmt(pct)}%`, RED, 22, 'middle');
    if (showLab(o)) label(g, 0, 190, `same ${note}, ${n0} items → ${n1}`, TXT.blue, 22, 'middle');
    return g;
  },

  // "interest x y w h p=100 r=10 n=5 cur=$" — simple vs compound interest bars side by side each year
  interest: ([x = 120, y = 40, w = 720, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), p = opt(o, 'p', 100), r = opt(o, 'r', 10) / 100, n = clamp(Math.round(opt(o, 'n', 5)), 1, 15), cur = curOf(o);
    const sv = i => p * (1 + r * i), cv = i => p * (1 + r) ** i;
    const f = chart(g, x, y, w, h, 0, Math.max(sv(n), cv(n)), { pre: cur });
    const slot = f.pw / (n + 1), bw = slot * .32, X = i => f.px + slot * (i + .5), every = Math.ceil((n + 1) / 12);
    for (let i = 0; i <= n; i++) { F(g, R(X(i) - bw, f.Y(sv(i)), bw, f.base - f.Y(sv(i))), FILL.blue); F(g, R(X(i), f.Y(cv(i)), bw, f.base - f.Y(cv(i))), FILL.orange); }
    let d1 = '', d2 = '';
    for (let i = 0; i <= n; i++) { d1 += R(X(i) - bw, f.Y(sv(i)), bw, f.base - f.Y(sv(i))) + ' '; d2 += R(X(i), f.Y(cv(i)), bw, f.base - f.Y(cv(i))) + ' '; }
    line(g, d1, INK.blue, 2.4); line(g, d2, INK.orange, 2.4);
    for (let i = 0; i <= n; i += every) label(g, X(i), f.base + 28, String(i), K, 18, 'middle');
    if (showLab(o)) label(g, f.px + f.pw, f.base + 28, n > 1 ? 'years' : '', TICK, 16, 'end');
    const ty = Math.min(f.Y(sv(n)), f.Y(cv(n))) - 10;
    label(g, X(n) + bw, ty - 22, money(cv(n), cur), TXT.orange, 20, 'end'); label(g, X(n) + bw, ty, money(sv(n), cur), TXT.blue, 20, 'end');
    F(g, R(f.px + 16, f.py + 2, 20, 16), FILL.blue); line(g, R(f.px + 16, f.py + 2, 20, 16), INK.blue, 2);
    F(g, R(f.px + 16, f.py + 30, 20, 16), FILL.orange); line(g, R(f.px + 16, f.py + 30, 20, 16), INK.orange, 2);
    if (showLab(o)) { label(g, f.px + 44, f.py + 17, 'simple', TXT.blue, 20); label(g, f.px + 44, f.py + 45, 'compound', TXT.orange, 20); }
    if (t || showLab(o)) label(g, f.px + 150, f.py + 17, t || `${cur}${fmt(p)} at ${fmt(r * 100)}% a year`, K, 20);
    return g;
  },

  // "loan x y w h amt=1000 pay=250 r=0 cur=$" — balance falling with each repayment until paid off
  loan: ([x = 120, y = 40, w = 720, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), amt = opt(o, 'amt', 1000), pay = Math.max(0, opt(o, 'pay', 250)), r = opt(o, 'r', 0) / 100, cur = curOf(o);
    const bal = [amt]; let paid = 0;
    while (bal.at(-1) > 1e-9 && bal.length < 25) { const b = bal.at(-1) * (1 + r), p = Math.min(pay, b); paid += p; bal.push(b - p); }
    const done = bal.at(-1) <= 1e-9, f = chart(g, x, y, w, h, 0, Math.max(...bal), { pre: cur, yl: o.yl, top: 74 });
    const slot = f.pw / bal.length, bw = slot * .6, X = i => f.px + slot * (i + .5), every = Math.ceil(bal.length / 13);
    bal.forEach((b, i) => b > 0 && F(g, R(X(i) - bw / 2, f.Y(b), bw, f.base - f.Y(b)), i ? '#f4b2a8' : FILL.red));
    line(g, bal.map((b, i) => b > 0 ? R(X(i) - bw / 2, f.Y(b), bw, f.base - f.Y(b)) : '').join(' '), RED, 2.4);
    if (bal.length > 2 && bal.length <= 13) line(g, bal.slice(1).map((b, i) => { const x0 = X(i) + bw / 2 + 2, x1 = X(i + 1) - bw / 2 - 2; return `M${x0} ${f.Y(bal[i]) - 6} Q${(x0 + x1) / 2} ${f.Y(bal[i]) - 26} ${x1} ${f.Y(b) - 6}`; }).join(' '), GRN, 2.2);
    bal.forEach((_, i) => i % every === 0 && label(g, X(i), f.base + 28, String(i), K, 18, 'middle'));
    const vs = clamp(slot * .3, 12, 18);
    if (slot > 30) bal.forEach((b, i) => b > 0 && label(g, X(i), f.Y(b) - 8, fmt(b), K, vs, 'middle'));
    if (showLab(o)) label(g, f.px + f.pw - 4, y + 20, `${money(pay, cur)} a month${r ? `, ${fmt(r * 100)}% a month` : ''}`, GRN, 21, 'end');
    if (showLab(o)) label(g, f.px + f.pw - 4, y + 46, done ? `paid off: ${bal.length - 1} months, total ${money(paid, cur)}` : 'still owing after 24 months', done ? TXT.blue : RED, 21, 'end');
    if (done) check(g, X(bal.length - 1), f.base - 22, 30, GRN, 5);
    if (t) label(g, f.px + 16, y + 20, t, TXT.blue, 22);
    return g;
  },

  // "budget cx cy r cur=$ | Rent:40,Food:25,Travel:15,Savings:20" — budget pie with a legend of amounts
  budget: ([cx = 480, cy = 270, r = 170], o, t, parent) => {
    const g = mk('g', {}, parent), cats = pairs(t || 'Rent:40,Food:25,Travel:15,Savings:20').map(([n, v]) => [n, +v]).filter(([, v]) => v > 0);
    const sum = cats.reduce((s, [, v]) => s + v, 0); if (!sum) throw new Error('budget: give categories like Rent:40,Food:25');
    const pcx = cx - r * .8, cur = curOf(o); let a = -90;
    const sl = cats.map(([, v]) => { const a0 = a; a += v / sum * 360; return [a0, a]; });
    sl.forEach(([a0, a1], i) => F(g, cats.length === 1 ? E(pcx, cy, r) : sector(pcx, cy, 0, r, a0, a1), PAL[i % 8]));
    line(g, E(pcx, cy, r), K, 3);
    if (cats.length > 1) line(g, sl.map(([a0]) => `M${pcx} ${cy} L${pt(pcx, cy, r, a0).join(' ')}`).join(' '), K, 2.4);
    sl.forEach(([a0, a1], i) => { const pc = cats[i][1] / sum * 100; if (pc >= 7) { const [lx, ly] = pt(pcx, cy, r * .62, (a0 + a1) / 2); label(g, lx, ly + 8, `${Math.round(pc)}%`, K, clamp(r * .13, 14, 24), 'middle'); } });
    const lx = cx + r * .45, gap = clamp(r * 2 / Math.max(cats.length + 1, 4), 26, 46), y0 = cy - gap * (cats.length) / 2, fs = clamp(gap * .55, 15, 24);
    cats.forEach(([n, v], i) => { const yy = y0 + i * gap; F(g, R(lx, yy - fs * .7, fs * .9, fs * .9, 3), PAL[i % 8]); line(g, R(lx, yy - fs * .7, fs * .9, fs * .9, 3), PINK[i % 8], 2);
      label(g, lx + fs * 1.3, yy + fs * .1, `${n}  ${money(v, cur)}`, PINK[i % 8], fs); });
    line(g, `M${lx} ${y0 + cats.length * gap - gap * .55} h${fs * 7}`, K, 2);
    label(g, lx + fs * 1.3, y0 + cats.length * gap + fs * .1, `${showLab(o) ? 'Total  ' : ''}${money(sum, cur)}`, K, fs);
    return g;
  },

  // "cashflow x y w h in=3000,3200 out=2500,3400 cur=$ | Jan,Feb" — income vs expenses bars, net per group
  cashflow: ([x = 120, y = 40, w = 720, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), ins = nlist(o.in || '3000,3200,3100'), outs = nlist(o.out || '2500,3400,2800'), n = Math.max(ins.length, outs.length), cur = curOf(o);
    if (!n) throw new Error('cashflow: give in= and out=');
    const names = t ? words(t) : n === 1 ? [''] : Array.from({ length: n }, (_, i) => `month ${i + 1}`);
    const f = chart(g, x, y, w, h, 0, Math.max(...ins, ...outs) * 1.12, { pre: cur, top: 58 });
    const slot = f.pw / n, bw = slot * .3, X = i => f.px + slot * (i + .5);
    for (let i = 0; i < n; i++) { const a = ins[i] || 0, b = outs[i] || 0;
      F(g, R(X(i) - bw - 3, f.Y(a), bw, f.base - f.Y(a)), FILL.green); F(g, R(X(i) + 3, f.Y(b), bw, f.base - f.Y(b)), FILL.red); }
    line(g, Array.from({ length: n }, (_, i) => R(X(i) - bw - 3, f.Y(ins[i] || 0), bw, f.base - f.Y(ins[i] || 0))).join(' '), GRN, 2.4);
    line(g, Array.from({ length: n }, (_, i) => R(X(i) + 3, f.Y(outs[i] || 0), bw, f.base - f.Y(outs[i] || 0))).join(' '), RED, 2.4);
    const fs = clamp(slot * .16, 14, 22);
    for (let i = 0; i < n; i++) { const net = (ins[i] || 0) - (outs[i] || 0);
      label(g, X(i), f.Y(Math.max(ins[i] || 0, outs[i] || 0)) - 10, (net >= 0 ? '+' : '') + money(net, cur), net >= 0 ? GRN : RED, fs, 'middle');
      if (names[i] && (t || showLab(o))) label(g, X(i), f.base + 28, names[i], K, clamp(slot / (names[i].length * .55), 12, 20), 'middle'); }
    F(g, R(f.px + 10, y + 6, 20, 16), FILL.green); line(g, R(f.px + 10, y + 6, 20, 16), GRN, 2); if (showLab(o)) label(g, f.px + 38, y + 21, 'income', GRN, 20);
    F(g, R(f.px + 140, y + 6, 20, 16), FILL.red); line(g, R(f.px + 140, y + 6, 20, 16), RED, 2); if (showLab(o)) label(g, f.px + 168, y + 21, 'expenses', RED, 20);
    return g;
  },

  // "savegoal cx cy height pct=60 goal=1000 cur=$ | label" — savings goal thermometer filled to a percent
  savegoal: ([cx = 480, cy = 270, S = 440], o, t, parent) => {
    const g = G(cx, cy, S / 440, o, parent), pct = clamp(opt(o, 'pct', 60), 0, 100), goal = opt(o, 'goal', 1000), cur = curOf(o);
    const top = -170, bot = 120, Yp = p => bot - (bot - top) * p / 100;
    P(g, R(-24, top - 20, 48, bot - top + 40, 24), '#ffffff', DK, 3);
    F(g, R(-14, Yp(pct), 28, bot - Yp(pct) + 30), FILL.red);
    P(g, E(0, 160, 42), FILL.red, DK, 3); line(g, R(-24, top - 20, 48, bot - top + 40, 24), DK, 3);
    line(g, `M-14 ${Yp(pct)} H14`, RED, 3);
    [0, 25, 50, 75, 100].forEach(p => { line(g, `M24 ${Yp(p)} h14`, DK, 2.4); label(g, 46, Yp(p) + 7, money(goal * p / 100, cur), TICK, 19); });
    P(g, `M-4 ${top - 22} V${top - 76} L40 ${top - 64} L-4 ${top - 52}`, FILL.yellow, '#8a6a00', 2.5);
    label(g, 46, top - 52, showLab(o) ? `goal ${money(goal, cur)}` : money(goal, cur), TXT.green, 22);
    arrow(g, -96, Yp(pct), -32, Yp(pct), RED, 3);
    label(g, -104, Yp(pct) - 8, money(goal * pct / 100, cur), RED, 26, 'end'); label(g, -104, Yp(pct) + 20, `${fmt(pct)}%`, RED, 20, 'end');
    if (t) label(g, 0, 232, t, TXT.blue, 26, 'middle');
    return g;
  },

  // "creditscore cx cy size score=720 min=300 max=850" — credit score gauge: poor to excellent bands, needle
  creditscore: ([cx = 480, cy = 330, S = 420], o, t, parent) => {
    const g = G(cx, cy, S / 420, o, parent), lo = opt(o, 'min', 300), hi = opt(o, 'max', 850), sc = clamp(opt(o, 'score', 720), lo, hi);
    const bands = t ? words(t) : ['Poor', 'Fair', 'Good', 'Excellent'], cols = [FILL.red, FILL.orange, FILL.yellow, FILL.green], inks = [RED, INK.orange, '#b08a00', GRN];
    bands.forEach((b, i) => { const a0 = 180 + 180 * i / bands.length, a1 = 180 + 180 * (i + 1) / bands.length;
      F(g, sector(0, 0, 120, 180, a0, a1), cols[i % 4]); line(g, sector(0, 0, 120, 180, a0, a1), inks[i % 4], 2.4);
      const [lx, ly] = pt(0, 0, 205, (a0 + a1) / 2); if (t || showLab(o)) label(g, lx, ly + 8, b, inks[i % 4], 20, lx > 30 ? 'start' : lx < -30 ? 'end' : 'middle'); });
    const a = 180 + 180 * (sc - lo) / (hi - lo), [nx, ny] = pt(0, 0, 160, a), [bx1, by1] = pt(0, 0, 12, a + 90), [bx2, by2] = pt(0, 0, 12, a - 90);
    P(g, polyD([[nx, ny], [bx1, by1], [bx2, by2]]), DK, DK, 2.5); P(g, E(0, 0, 16), '#c9d1d9', DK, 3);
    label(g, -150, 30, fmt(lo), TICK, 18, 'middle'); label(g, 150, 30, fmt(hi), TICK, 18, 'middle');
    label(g, 0, 62, fmt(sc), K, 48, 'middle'); if (showLab(o)) label(g, 0, 94, 'credit score', TXT.blue, 22, 'middle');
    return g;
  },

  // "paytax cx cy width pay=3000 tax=20 cur=$" — tax slice cut from a paycheck, take-home left
  paytax: ([cx = 480, cy = 270, S = 640], o, t, parent) => {
    const g = G(cx, cy, S / 640, o, parent), pay = opt(o, 'pay', 3000), tx = clamp(opt(o, 'tax', 20), 0, 100), cur = curOf(o);
    const x0 = -280, W = 520, cut = x0 + W * (1 - tx / 100);
    label(g, x0, -88, t || (showLab(o) ? `paycheck ${money(pay, cur)}` : money(pay, cur)), K, 26);
    dash(g, [[cut, -66], [x0 + W, -66], [x0 + W, 66], [cut, 66]], PAPERK, 2);
    P(g, R(x0, -66, cut - x0, 132, 8), '#d8efcc', GRN, 3);
    line(g, `M${x0 + 20} -30 h${(cut - x0) * .45} M${x0 + 20} -6 h${(cut - x0) * .3}`, '#5fae3a', 3);
    label(g, (x0 + cut) / 2, 44, showLab(o) ? `take-home ${money(pay * (1 - tx / 100), cur)}` : money(pay * (1 - tx / 100), cur), GRN, clamp((cut - x0) / 9, 14, 26), 'middle');
    const sg = mk('g', { transform: `translate(${40} ${36}) rotate(8 ${cut} 0)` }, g);
    if (tx > 0) { P(sg, R(cut, -66, x0 + W - cut, 132, 8), '#f6cdc6', RED, 3);
      label(sg, (cut + x0 + W) / 2, 6, `${fmt(tx)}%`, RED, clamp((x0 + W - cut) / 4, 14, 30), 'middle'); }
    label(g, (cut + x0 + W) / 2 + 40, 150, showLab(o) ? `tax ${money(pay * tx / 100, cur)}` : money(pay * tx / 100, cur), RED, 26, 'middle');
    line(g, `M${cut} -80 V80`, RED, 2.4);
    return g;
  },

  // "payslip cx cy size cur=$ | Basic_pay:3000,Bonus:200,Tax:-600" — payslip rows, net pay computed
  payslip: ([cx = 480, cy = 270, S = 440], o, t, parent) => {
    const g = G(cx, cy, S / 440, o, parent), cur = curOf(o), list = pairs(t || 'Basic pay:3000,Overtime:250,Tax:-650,Pension:-150').map(([n, v]) => [n, +v || 0]);
    const H = Math.max(300, 150 + list.length * 34), y0 = -H / 2;
    paper(g, -170, y0, 340, H);
    F(g, R(-170, y0, 340, 54, 6), '#2b6cc4'); line(g, `M-170 ${y0 + 54} H170`, '#1f4f8f', 2);
    label(g, -150, y0 + 37, 'PAYSLIP', '#ffffff', 28); if (o.month !== undefined || showLab(o)) label(g, 150, y0 + 36, txt(o.month ?? 'this month'), '#ffffff', 18, 'end');
    let yy = rows(g, -150, 300, y0 + 92, list, 34, 21, cur);
    line(g, `M-150 ${yy - 18} H150`, K, 2.4);
    const net = list.reduce((s, [, v]) => s + v, 0);
    P(g, R(-156, yy - 8, 312, 46, 6), '#d8efcc', GRN, 2.5);
    label(g, -144, yy + 23, 'Net pay', GRN, 24); label(g, 144, yy + 23, money(net, cur), GRN, 26, 'end');
    return g;
  },

  // "invoice cx cy size tax=10 paid=0 cur=$ | Design:500,Hosting:120" — invoice lines, tax, total due, PAID stamp
  invoice: ([cx = 480, cy = 270, S = 460], o, t, parent) => {
    const g = G(cx, cy, S / 460, o, parent), cur = curOf(o), tax = opt(o, 'tax', 0), list = pairs(t || 'Design:500,Hosting:120,Support:80').map(([n, v]) => [n, +v || 0]);
    const H = 210 + list.length * 32 + (tax ? 32 : 0), y0 = -H / 2;
    paper(g, -180, y0, 360, H);
    label(g, -160, y0 + 40, 'INVOICE', INK.blue, 32); label(g, 160, y0 + 30, txt(o.no ?? 'No. 0042'), TICK, 17, 'end'); label(g, 160, y0 + 52, 'due in 30 days', TICK, 17, 'end');
    label(g, -160, y0 + 78, 'Bill to: ' + txt(o.to ?? 'Client'), K, 18);
    F(g, R(-166, y0 + 90, 332, 28), '#e4eef9'); line(g, `M-166 ${y0 + 118} H166`, INK.blue, 2);
    label(g, -156, y0 + 110, 'Item', INK.blue, 18); label(g, 156, y0 + 110, 'Amount', INK.blue, 18, 'end');
    const sub = list.reduce((s, [, v]) => s + v, 0);
    let yy = rows(g, -156, 312, y0 + 146, list, 32, 20, cur, cents);
    line(g, `M-60 ${yy - 18} H156`, K, 2);
    if (tax) yy = rows(g, -60, 216, yy + 4, [[`Tax ${fmt(tax)}%`, sub * tax / 100]], 32, 19, cur, cents);
    P(g, R(-70, yy - 6, 236, 42, 6), '#fff3c4', '#b08a00', 2.5);
    label(g, -58, yy + 22, 'Total due', K, 21); label(g, 156, yy + 23, money(sub * (1 + tax / 100), cur, cents), K, 23, 'end');
    if (o.paid === '1') { const sg = mk('g', { transform: `rotate(-14 -90 ${yy - 50})` }, g); line(sg, R(-160, yy - 78, 130, 54, 8), RED, 4); label(sg, -95, yy - 38, 'PAID', RED, 36, 'middle'); }
    return g;
  },

  // "receipt cx cy height tax=0 cur=$ | Milk:2x1.50,Bread:2.25" — shop till receipt, line totals and total computed
  receipt: ([cx = 480, cy = 270, S = 460], o, t, parent) => {
    const items = pairs(t || 'Milk:2x1.50,Bread:2.25,Apples:3x0.80,Rice:4.10').map(([n, v]) => { const [a, b] = String(v).split('x').map(Number); return b === undefined ? [n, 1, a || 0] : [n, a || 0, b || 0]; });
    const tax = opt(o, 'tax', 0), cur = curOf(o), H = 170 + items.length * 30 + (tax ? 60 : 0), g = G(cx, cy, S / Math.max(H, 460), o, parent), y0 = -H / 2, w = 260, x0 = -w / 2;
    let zig = `M${x0} ${y0} H${-x0} V${y0 + H}`; for (let x = -x0; x > x0; x -= 13) zig += ` L${x - 6.5} ${y0 + H - 9} L${Math.max(x0, x - 13)} ${y0 + H}`;
    F(g, zig + ' Z', '#000', { opacity: .07, transform: 'translate(5 5)' }); P(g, zig + ' Z', '#ffffff', PAPERK, 2.4);
    label(g, 0, y0 + 36, 'RECEIPT', K, 26, 'middle'); line(g, dashD([[x0 + 14, y0 + 52], [-x0 - 14, y0 + 52]], 6, 5), TICK, 1.8);
    let yy = y0 + 80, sub = 0;
    items.forEach(([n, q, p]) => { const tot = q * p; sub += tot; label(g, x0 + 14, yy, q !== 1 ? `${fmt(q)} × ${n}` : n, K, 18); label(g, -x0 - 14, yy, cents(tot), K, 18, 'end'); yy += 30; });
    line(g, dashD([[x0 + 14, yy - 16], [-x0 - 14, yy - 16]], 6, 5), TICK, 1.8);
    if (tax) { yy += 6; label(g, x0 + 14, yy, 'Subtotal', TICK, 17); label(g, -x0 - 14, yy, cents(sub), TICK, 17, 'end'); yy += 28;
      label(g, x0 + 14, yy, `Tax ${fmt(tax)}%`, TICK, 17); label(g, -x0 - 14, yy, cents(sub * tax / 100), TICK, 17, 'end'); yy += 26; }
    label(g, x0 + 14, yy + 14, 'TOTAL', K, 24); label(g, -x0 - 14, yy + 14, money(sub * (1 + tax / 100), cur, cents), RED, 26, 'end');
    label(g, 0, yy + 50, txt(o.msg ?? 'thank you!'), TICK, 17, 'middle');
    return g;
  },

  // "vault cx cy size k=closed|open" — round bank vault door with wheel and bolts, or open with gold bars
  vault: ([cx = 480, cy = 270, S = 340], o, t, parent) => {
    const g = G(cx, cy, S / 340, o, parent);
    P(g, R(-170, -160, 340, 320, 6), '#c9d1d9', DK, 3);
    line(g, 'M-170 -80 H170 M-170 0 H-150 M150 0 H170 M-170 80 H170 M-90 -160 V-140 M90 140 V160', '#9aa3ad', 2);
    if (o.k === 'open') {
      P(g, E(0, 0, 126), '#3a4450', DK, 4);
      const bar = (x, y) => P(g, `M${x - 34} ${y} L${x - 24} ${y - 26} L${x + 24} ${y - 26} L${x + 34} ${y} Z`, GOLD, GOLDK, 2.4);
      [[-70, 70], [0, 70], [70, 70], [-35, 44], [35, 44], [0, 18]].forEach(([x, y]) => bar(x, y));
      line(g, 'M-90 70 H90', '#1f262d', 3);
      P(g, `M126 -110 Q200 -120 222 -100 L222 100 Q200 120 126 110 Z`, '#9aa3ad', DK, 3); line(g, 'M150 -60 V60', DK, 6);
    } else {
      P(g, E(0, 0, 140), '#9aa3ad', DK, 4); P(g, E(0, 0, 118), '#b8c0c8', DK, 3);
      for (let i = 0; i < 12; i++) { const [bx, by] = pt(0, 0, 129, i * 30); P(g, E(bx, by, 5), '#6a737c', DK, 1.6); }
      line(g, [0, 60, 120].map(a => { const [x1, y1] = pt(0, 0, 70, a), [x2, y2] = pt(0, 0, 70, a + 180); return `M${x1} ${y1} L${x2} ${y2}`; }).join(' '), DK, 7);
      line(g, E(0, 0, 70), DK, 4); P(g, E(0, 0, 20), '#c9d1d9', DK, 3);
      P(g, R(-160, -50, 16, 100, 4), '#6a737c', DK, 2.5);
    }
    if (t) label(g, 0, 200, t, K, 26, 'middle');
    return g;
  },

  // "atm cx cy height | text" — cash machine: screen, keypad, card slot, banknote coming out
  atm: ([cx = 480, cy = 270, S = 400], o, t, parent) => {
    const g = G(cx, cy, S / 400, o, parent);
    P(g, R(-130, -190, 260, 380, 12), '#7fb7ea', '#1f4f8f', 3);
    P(g, R(-130, -190, 260, 44, 12), '#2b6cc4', '#1f4f8f', 3); label(g, 0, -158, 'ATM', '#ffffff', 26, 'middle');
    P(g, R(-100, -128, 200, 110, 6), '#e8f6ff', DK, 3);
    label(g, 0, -88, t || 'Welcome', TXT.blue, fit(t || 'Welcome', 180, 26), 'middle'); label(g, 0, -52, 'insert card', TICK, 16, 'middle');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) P(g, R(-100 + c * 32, 2 + r * 26, 26, 20, 3), r === 3 && c !== 1 ? (c ? FILL.green : FILL.red) : '#ffffff', DK, 1.8);
    P(g, R(28, 8, 72, 14, 4), '#2f3a45', DK, 2); P(g, R(40, -4, 48, 16, 2), '#4f93d6', '#1f4f8f', 2);
    label(g, 64, 50, 'card', '#1f4f8f', 15, 'middle');
    P(g, R(-90, 128, 180, 16, 5), '#2f3a45', DK, 2.5);
    P(g, R(-60, 136, 120, 40, 3), '#b6dfa8', GRN, 2.4); P(g, E(0, 158, 11), '#e4f2d0', GRN, 1.8);
    return g;
  },

  // "mobilepay cx cy height | $12.50" — phone shows a green tick, paid by tapping a card reader
  mobilepay: ([cx = 480, cy = 270, S = 400], o, t, parent) => {
    const g = G(cx, cy, S / 400, o, parent);
    P(g, R(-190, -170, 170, 330, 22), '#3a4450', DK, 3); P(g, R(-178, -146, 146, 278, 8), '#ffffff', DK, 2);
    P(g, E(-105, -60, 42), FILL.green, GRN, 3); check(g, -105, -58, 46, '#ffffff', 6);
    label(g, -105, 20, 'Paid', GRN, 30, 'middle'); label(g, -105, 58, t || '$12.50', K, fit(t || '$12.50', 130, 30), 'middle');
    [22, 38, 54].forEach(r => line(g, arc(-10, -20, r, -45, 45), INK.sky, 4));
    P(g, `M60 -50 L170 -50 L180 150 L50 150 Z`, '#c9d1d9', DK, 3); P(g, R(76, -34, 88, 60, 6), '#e8f6ff', DK, 2.5);
    if (showLab(o)) label(g, 120, 4, 'tap', TXT.blue, 20, 'middle');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) P(g, R(80 + c * 28, 46 + r * 26, 22, 18, 3), '#ffffff', DK, 1.6);
    return g;
  },

  // "exchange cx cy width rate=0.92 | USD,EUR" — two currency coins, arrows both ways with both rates
  exchange: ([cx = 480, cy = 270, S = 560], o, t, parent) => {
    const g = G(cx, cy, S / 560, o, parent), [a, b] = (w => w.length >= 2 ? w : ['USD', 'EUR'])(words(t));
    const rate = opt(o, 'rate', 0.92);
    P(g, E(-180, 0, 82), GOLD, GOLDK, 3); line(g, E(-180, 0, 66), '#c98a00', 2); label(g, -180, 12, a, '#7a4a00', fit(a, 110, 36), 'middle');
    P(g, E(180, 0, 82), '#d9dee3', '#5a636c', 3); line(g, E(180, 0, 66), '#9aa3ad', 2); label(g, 180, 12, b, '#3a4450', fit(b, 110, 36), 'middle');
    line(g, 'M-110 -66 Q0 -150 110 -66', INK.blue, 4); line(g, head(110, -66, 60, -108), INK.blue, 4, { class: 'ink head' });
    line(g, 'M110 66 Q0 150 -110 66', INK.orange, 4); line(g, head(-110, 66, -60, 108), INK.orange, 4, { class: 'ink head' });
    label(g, 0, -126, `1 ${a} = ${+rate.toPrecision(4)} ${b}`, TXT.blue, 24, 'middle');
    label(g, 0, 144, `1 ${b} = ${rate ? +(1 / rate).toPrecision(4) : '?'} ${a}`, TXT.orange, 24, 'middle');
    return g;
  },

  // "gdp x y w h vals=25,18,5 pre=$ suf=T | Land_A,Land_B,Land_C" — GDP bars per country, largest first, flags
  gdp: ([x = 120, y = 40, w = 720, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), v = nlist(o.vals || '25,18,5,4,3'), nm = t ? words(t) : v.map((_, i) => `Country ${String.fromCharCode(65 + i)}`);
    if (!v.length) throw new Error('gdp: no vals');
    const d = v.map((q, i) => [nm[i] || '', q, i]); if (o.sort !== '0') d.sort((p, q) => q[1] - p[1]);
    const pre = txt(o.pre ?? '$'), suf = txt(o.suf ?? ''), top = y + 46, slot = (h - 50) / d.length, bh = Math.min(slot * .62, 56), fs = clamp(bh * .55, 14, 22);
    const nw = clamp(Math.max(...d.map(q => tw(q[0], fs))) + 50, 90, w * .32), x0 = x + nw, mx = Math.max(...v, 0) || 1, bwMax = w - nw - 110;
    if (o.yl !== undefined || showLab(o)) label(g, x, y + 22, txt(o.yl ?? 'GDP'), TXT.blue, 24);
    line(g, `M${x0} ${top - 6} V${top + slot * d.length}`, K, 3);
    d.forEach(([n, q, i], j) => { const yy = top + slot * j + (slot - bh) / 2, bw = Math.max(2, bwMax * Math.max(0, q) / mx);
      F(g, R(x0, yy, bw, bh, 3), PAL[i % 8]); line(g, R(x0, yy, bw, bh, 3), PINK[i % 8], 2.4);
      label(g, x0 + bw + 8, yy + bh / 2 + fs * .35, pre + fmt(q) + suf, K, fs);
      const fy = yy + bh / 2; line(g, `M${x0 - 34} ${fy + 12} V${fy - 14}`, DK, 2); P(g, R(x0 - 34, fy - 14, 22, 14), PAL[(i + 3) % 8], DK, 1.8);
      if (t || showLab(o)) label(g, x0 - 42, fy + fs * .35, n, K, fs, 'end'); });
    return g;
  },


  // "bizcycle x y w h | Boom,Recession,Trough,Recovery" — business cycle wave around a rising trend line
  bizcycle: ([x = 120, y = 50, w = 720, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), [boom, rec, tro, recov] = (w => w.length >= 4 ? w : ['Boom', 'Recession', 'Trough', 'Recovery'])(words(t));
    const px = x + 30, py = y + 30, pw = w - 50, ph = h - 70, A = ph * .2, wl = words(t).length >= 4 || showLab(o);
    const X = u => px + 10 + u * (pw - 20), trend = u => py + ph * .72 - u * ph * .32, Y = u => trend(u) - A * Math.sin(3 * Math.PI * u);
    arrow(g, px, py + ph, px + pw, py + ph, K, 3); arrow(g, px, py + ph, px, py - 6, K, 3);
    if (o.xl !== undefined || showLab(o)) label(g, px + pw, py + ph + 28, txt(o.xl ?? 'time'), TICK, 19, 'end'); if (o.yl !== undefined || showLab(o)) label(g, px + 10, py + 2, txt(o.yl ?? 'output (GDP)'), TICK, 19);
    line(g, dashD([[X(0), trend(0)], [X(1), trend(1)]]), TICK, 2.2); if (showLab(o)) label(g, X(1) - 4, trend(1) + 24, 'trend', TICK, 17, 'end');
    const pts = Array.from({ length: 121 }, (_, i) => [X(i / 120), Y(i / 120)]);
    line(g, polyD(pts, false), INK.blue, 4.5);
    const dotAt = (u, c) => { F(g, E(X(u), Y(u), 7), c); line(g, E(X(u), Y(u), 7), DK, 2); };
    dotAt(1 / 6, FILL.green); dotAt(5 / 6, FILL.green); dotAt(1 / 2, FILL.red);
    if (wl) { label(g, X(1 / 6), Y(1 / 6) - 18, boom, GRN, 24, 'middle'); label(g, X(5 / 6), Y(5 / 6) - 18, boom, GRN, 24, 'middle');
    label(g, X(1 / 2), Y(1 / 2) + 36, tro, RED, 24, 'middle');
    label(g, X(1 / 3), py + ph - 14, rec + ' ↘', TXT.orange, 22, 'middle');   // the curve crosses the trend here: label on the floor
    label(g, X(2 / 3), py + ph - 14, '↗ ' + recov, TXT.blue, 22, 'middle'); }
    return g;
  },

  // "profit cx cy height rev=500 cost=300 cur=$" — revenue minus cost blocks equal profit (or loss in red)
  profit: ([cx = 480, cy = 280, S = 400], o, t, parent) => {
    const g = G(cx, cy, S / 400, o, parent), rev = Math.max(0, opt(o, 'rev', 500)), cost = Math.max(0, opt(o, 'cost', 300)), pr = rev - cost, cur = curOf(o);
    const mx = Math.max(rev, cost, Math.abs(pr)) || 1, H = v => 260 * Math.abs(v) / mx, base = 120;
    const col = (x, v, fill, ink, name) => { const hh = Math.max(3, H(v)); P(g, R(x - 60, base - hh, 120, hh, 4), fill, ink, 3);
      label(g, x, base - hh - 12, money(v, cur), ink, 26, 'middle'); if (showLab(o)) label(g, x, base + 36, name, ink, 24, 'middle'); };
    col(-220, rev, FILL.blue, INK.blue, 'revenue'); col(0, cost, FILL.orange, INK.orange, 'cost');
    col(220, pr, pr >= 0 ? FILL.green : FILL.red, pr >= 0 ? GRN : RED, pr >= 0 ? 'profit' : 'loss');
    line(g, `M-300 ${base} H300`, K, 3);
    label(g, -110, base - 60, '−', K, 54, 'middle'); label(g, 110, base - 60, '=', K, 54, 'middle');
    if (t) label(g, 0, base + 76, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "breakeven x y w h fixed=200 vc=5 price=10 cur=$" — cost and revenue lines cross at the break-even point
  breakeven: ([x = 120, y = 40, w = 720, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), fx = Math.max(0, opt(o, 'fixed', 200)), vc = opt(o, 'vc', 5), pr = opt(o, 'price', 10), cur = curOf(o);
    const ok = pr > vc, qb = ok ? fx / (pr - vc) : NaN, qm = ok ? niceStep(qb * 2.2, 1) * Math.ceil(qb * 2 / niceStep(qb * 2.2, 1)) || 10 : 100;
    const f = chart(g, x, y, w, h, 0, Math.max(pr * qm, fx + vc * qm), { pre: cur, bottom: 46 }), X = q => f.px + q / qm * f.pw;
    const st = niceStep(qm, Math.max(2, Math.round(f.pw / 90)));
    for (let q = st; q <= qm + 1e-9; q += st) { line(g, `M${X(q)} ${f.base} v6`, K, 2); label(g, X(q), f.base + 26, fmt(q), TICK, 17, 'middle'); }
    if (o.xl !== undefined || showLab(o)) label(g, f.px + f.pw, f.base + 46, txt(o.xl ?? 'units sold'), TICK, 17, 'end');
    const C = q => fx + vc * q, Rv = q => pr * q;
    if (ok) { F(g, polyD([[X(0), f.Y(C(0))], [X(qb), f.Y(C(qb))], [X(0), f.Y(0)]]), '#f6cdc6', { opacity: .75 });
      F(g, polyD([[X(qb), f.Y(C(qb))], [X(qm), f.Y(Rv(qm))], [X(qm), f.Y(C(qm))]]), '#cfe8c4', { opacity: .8 }); }
    line(g, dashD([[X(0), f.Y(fx)], [X(qm), f.Y(fx)]]), TICK, 2.2); if (showLab(o)) label(g, X(qm) - 4, f.Y(fx) + 22, 'fixed cost', TICK, 17, 'end');
    line(g, `M${X(0)} ${f.Y(C(0))} L${X(qm)} ${f.Y(C(qm))}`, RED, 4); line(g, `M${X(0)} ${f.Y(0)} L${X(qm)} ${f.Y(Rv(qm))}`, GRN, 4);
    if (showLab(o)) label(g, X(qm) - 6, f.Y(C(qm)) + (Rv(qm) >= C(qm) ? 26 : -12), 'total cost', RED, 20, 'end');
    if (showLab(o)) label(g, X(qm) - 6, f.Y(Rv(qm)) + (Rv(qm) >= C(qm) ? -12 : 26), 'revenue', GRN, 20, 'end');
    if (ok) { const bx = X(qb), by = f.Y(Rv(qb));
      line(g, dashD([[bx, by], [bx, f.base]]), K, 2); F(g, E(bx, by, 8), FILL.yellow); line(g, E(bx, by, 8), DK, 2.4);
      const bt = showLab(o) ? `break-even: ${fmt(qb)} units, ${money(Rv(qb), cur)}` : `${fmt(qb)}, ${money(Rv(qb), cur)}`, left = bx - tw(bt, 20) - 14 > f.px + 10;
      label(g, left ? bx - 14 : bx + 14, left ? by - 14 : by + 34, bt, K, 20, left ? 'end' : 'start');
      const mid = q => f.Y((C(q) + Rv(q)) / 2) + 7;
      if (showLab(o)) { label(g, X(qb * .3), mid(qb * .3), 'loss', RED, 20, 'middle'); label(g, X(qb + (qm - qb) * .5), mid(qb + (qm - qb) * .5), 'profit', GRN, 22, 'middle'); }
    } else if (showLab(o)) label(g, f.px + 20, f.py + 8, 'price ≤ cost per unit: never breaks even', RED, 20);
    if (t) label(g, f.px + 16, f.py + 8, t, TXT.blue, 22);
    return g;
  },

  // "hockeystick x y w h yl=users | Idea,Launch,Growth" — startup growth: flat start then a steep climb
  hockeystick: ([x = 120, y = 50, w = 720, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), st = t ? words(t) : ['Idea', 'Launch', 'Growth'];
    const px = x + 30, py = y + 30, pw = w - 60, ph = h - 70, X = u => px + 14 + u * (pw - 50), Y = u => py + ph - 14 - (ph - 40) * (0.04 + 0.96 * (Math.exp(5 * u) - 1) / (Math.exp(5) - 1));
    arrow(g, px, py + ph, px + pw, py + ph, K, 3); arrow(g, px, py + ph, px, py - 6, K, 3);
    if (o.xl !== undefined || showLab(o)) label(g, px + pw, py + ph + 28, txt(o.xl ?? 'time'), TICK, 19, 'end'); if (o.yl !== undefined || showLab(o)) label(g, px + 10, py + 2, txt(o.yl ?? 'users'), TICK, 19);
    const pts = Array.from({ length: 81 }, (_, i) => [X(i / 80), Y(i / 80)]);
    F(g, polyD([[X(0), py + ph], ...pts, [X(1), py + ph]]), '#cfe8c4', { opacity: .6 });
    line(g, polyD(pts, false), GRN, 5);
    line(g, head(X(1) + 8, Y(1) - 12, X(.97), Y(.97), 18), GRN, 5, { class: 'ink head' });
    st.forEach((s, i) => { const u = st.length === 1 ? .9 : .08 + .82 * i / (st.length - 1), [qx, qy] = [X(u), Y(u)];
      F(g, E(qx, qy, 8), FILL.yellow); line(g, E(qx, qy, 8), DK, 2.2);
      if (t || showLab(o)) label(g, i === st.length - 1 ? qx - 18 : qx, i === st.length - 1 ? qy + 8 : qy - 20, s, i === st.length - 1 ? GRN : K, 24, i === st.length - 1 ? 'end' : 'middle'); });
    return g;
  },


  // "supplychain cx cy width | Factory,Truck,Shop,Customer" — factory → truck → shop → customer with arrows
  supplychain: ([cx = 480, cy = 270, S = 860], o, t, parent) => {
    const g = G(cx, cy, S / 860, o, parent), nm = [...(t ? words(t) : []), ...['Factory', 'Truck', 'Shop', 'Customer'].slice(t ? words(t).length : 0)];
    const xs = [-330, -110, 110, 330];
    RECIPES.building([xs[0], -10, 170], { k: 'factory' }, '', g);
    const tg = mk('g', { transform: `translate(${xs[1]} 20)` }, g);
    P(tg, R(-80, -70, 110, 80, 4), '#e8b86a', '#7a4a1a', 3); line(tg, 'M-60 -70 V10 M-30 -70 V10 M0 -70 V10', '#9a6a2a', 1.8);
    P(tg, 'M30 -46 H64 L84 -20 V10 H30 Z', FILL.red, '#8e2a1f', 3); P(tg, 'M38 -40 H60 L72 -22 H38 Z', '#e8f6ff', DK, 2);
    for (const wx of [-54, 56]) { P(tg, E(wx, 14, 16), '#3a4450', DK, 3); P(tg, E(wx, 14, 6), '#c9d1d9', DK, 2); }
    RECIPES.building([xs[2], -10, 170], { k: 'shop', lab: o.lab, labels: o.labels }, '', g);
    RECIPES.person([xs[3], -10, 170], { k: 'waving' }, '', g);
    for (let i = 0; i < 3; i++) arrow(g, xs[i] + 74, -10, xs[i + 1] - 74, -10, INK.blue, 4, 16);
    nm.slice(0, 4).forEach((n, i) => (i < words(t).length || showLab(o)) && label(g, xs[i], 112, n, K, fit(n, 190, 26), 'middle'));
    return g;
  },

  // "oppcost cx cy size | Bike,Books" — fork in the road: pick one, the other is the opportunity cost
  oppcost: ([cx = 480, cy = 270, S = 440], o, t, parent) => {
    const g = G(cx, cy, S / 440, o, parent), [a, b] = (w => w.length >= 2 ? w : ['Bike', 'Books'])(words(t));
    F(g, 'M-40 210 L-28 40 L-190 -150 L-120 -150 L0 -10 L120 -150 L190 -150 L28 40 L40 210 Z', '#e8dcc0');
    line(g, 'M-40 210 L-28 40 L-190 -150 M-120 -150 L0 -10 L120 -150 M190 -150 L28 40 L40 210', '#8a7a5a', 3);
    line(g, dashD([[0, 200], [0, 60]], 14, 12) + dashD([[-12, 20], [-140, -130]], 14, 12) + dashD([[12, 20], [140, -130]], 14, 12), '#ffffff', 3);
    line(g, 'M0 160 V50', '#7a4a1a', 6);
    P(g, 'M-6 70 H-110 L-130 88 L-110 106 H-6 Z', '#f4d9a0', '#7a4a1a', 2.5); P(g, 'M6 74 H110 L130 92 L110 110 H6 Z', '#f4d9a0', '#7a4a1a', 2.5);
    if (words(t).length >= 2 || showLab(o)) { label(g, -66, 97, a, '#5a3a1a', fit(a, 96, 22), 'middle'); label(g, 66, 101, b, '#5a3a1a', fit(b, 96, 22), 'middle'); }
    P(g, E(-165, -170, 26), FILL.green, GRN, 3); check(g, -165, -170, 28, '#ffffff', 5);
    if (showLab(o)) label(g, -165, -210, 'chosen', GRN, 22, 'middle');
    P(g, E(165, -170, 26), '#e3e7eb', '#9aa3ad', 3); line(g, 'M152 -183 L178 -157 M178 -183 L152 -157', '#9aa3ad', 4);
    if (showLab(o)) label(g, 165, -210, 'opportunity cost', RED, 22, 'middle');
    return g;
  },

  // "scarcity cx cy width n=7 items=2 | text" — many hands reach up for a few goods on a shelf
  scarcity: ([cx = 480, cy = 270, S = 720], o, t, parent) => {
    const g = G(cx, cy, S / 720, o, parent), n = clamp(Math.round(opt(o, 'n', 7)), 2, 14), k = clamp(Math.round(opt(o, 'items', 2)), 0, 8);
    P(g, R(-170, -120, 340, 14, 3), '#d9a15a', '#7a4a1a', 2.5); line(g, 'M-150 -106 L-150 -60 M150 -106 L150 -60', '#7a4a1a', 3);
    for (let i = 0; i < k; i++) apple(g, (i - (k - 1) / 2) * 56, -146, 22);
    const gap = 660 / n;
    for (let i = 0; i < n; i++) { const hx = (i - (n - 1) / 2) * gap, top = -20 + ((i * 37) % 3) * 22, sk = SKIN[i % 4], w = Math.min(34, gap * .55);
      P(g, R(hx - w / 2, top + 30, w, 220 - top, 6), PAL[(i + 1) % 8], DK, 2.4);
      P(g, `M${hx - w * .55} ${top + 34} V${top} Q${hx - w * .55} ${top - 22} ${hx - w * .3} ${top - 22} V${top - 6} V${top - 30} Q${hx - w * .1} ${top - 36} ${hx + w * .05} ${top - 28} V${top - 8} V${top - 30} Q${hx + w * .3} ${top - 34} ${hx + w * .4} ${top - 24} V${top} Q${hx + w * .58} ${top - 6} ${hx + w * .62} ${top + 6} L${hx + w * .5} ${top + 34} Z`, sk, '#8a5a3a', 2.2); }
    if (t || showLab(o)) label(g, 0, -196, t || `${n} people want it, ${k} to go round`, TXT.blue, 26, 'middle');
    return g;
  },

  // "insurance cx cy size | text" — umbrella shields a house from the rain
  insurance: ([cx = 480, cy = 280, S = 420], o, t, parent) => {
    const g = G(cx, cy, S / 420, o, parent);
    for (const [x, y] of [[-150, -200], [-90, -230], [-20, -210], [60, -232], [130, -205], [-200, -40], [190, -50], [-210, 40], [205, 30], [-180, 120], [190, 110]]) P(g, `M${x} ${y} q-6 12 0 16 q6 -4 0 -16 Z`, '#7fb7ea', INK.blue, 2);
    P(g, 'M-190 -60 Q0 -260 190 -60 Q158 -80 127 -60 Q95 -80 63 -60 Q32 -80 0 -60 Q-32 -80 -63 -60 Q-95 -80 -127 -60 Q-158 -80 -190 -60 Z', FILL.blue, '#1f4f8f', 3);
    line(g, 'M-63 -60 Q-40 -150 0 -158 M63 -60 Q40 -150 0 -158', '#1f4f8f', 2);
    line(g, 'M0 -158 V-176', DK, 4); line(g, 'M0 -60 V-30', DK, 4);
    P(g, 'M-100 30 L0 -30 L100 30 Z', FILL.red, '#8e2a1f', 3);
    P(g, R(-80, 30, 160, 120), '#f4e3c3', '#7a4a1a', 3); P(g, R(-20, 80, 40, 70, 3), '#c97a3a', '#7a4a1a', 2.5);
    P(g, R(-64, 52, 32, 28), '#e8f6ff', DK, 2); P(g, R(32, 52, 32, 28), '#e8f6ff', DK, 2);
    line(g, 'M-130 150 H130', '#5fae3a', 4);
    if (t) label(g, 0, 196, t, TXT.blue, 26, 'middle');
    return g;
  },

  // "shares cx cy r vals=50,30,20 | Founder,Investors,Staff" — who owns a company: share donut round a building
  shares: ([cx = 480, cy = 270, r = 170], o, t, parent) => {
    const g = mk('g', {}, parent), v = nlist(o.vals || '50,30,20').filter(q => q > 0), sum = v.reduce((s, q) => s + q, 0), nm = t ? words(t) : [];
    if (!sum) throw new Error('shares: vals must be positive');
    let a = -90; const sl = v.map(q => { const a0 = a; a += q / sum * 360; return [a0, a]; }), r0 = r * .48;
    sl.forEach(([a0, a1], i) => F(g, v.length === 1 ? E(cx, cy, r) : sector(cx, cy, r0, r, a0, a1), PAL[i % 8]));
    line(g, E(cx, cy, r) + ' ' + E(cx, cy, r0), K, 3);
    if (v.length > 1) line(g, sl.map(([a0]) => `M${pt(cx, cy, r0, a0).join(' ')} L${pt(cx, cy, r, a0).join(' ')}`).join(' '), K, 2.4);
    const s = r0 / 70; P(g, R(cx - 34 * s, cy - 30 * s, 68 * s, 62 * s), '#c9d1d9', DK, 2.4); P(g, `M${cx - 42 * s} ${cy - 30 * s} L${cx} ${cy - 54 * s} L${cx + 42 * s} ${cy - 30 * s} Z`, '#9aa3ad', DK, 2.4);
    line(g, [-20, 0, 20].map(d => `M${cx + d * s} ${cy - 22 * s} V${cy + 26 * s}`).join(' '), DK, 3 * s);
    sl.forEach(([a0, a1], i) => { const m = (a0 + a1) / 2, pc = Math.round(v[i] / sum * 1000) / 10;
      if (pc >= 6) { const [lx, ly] = pt(cx, cy, (r + r0) / 2, m); label(g, lx, ly + 8, `${pc}%`, K, clamp(r * .12, 14, 22), 'middle'); }
      if (nm[i]) { const [nx, ny] = pt(cx, cy, r + 16, m), c = Math.cos(m * RAD), sn = Math.sin(m * RAD);
        label(g, nx, ny + 7 + (sn > .6 ? 12 : sn < -.6 ? -4 : 0), nm[i], PINK[i % 8], 22, c > .25 ? 'start' : c < -.25 ? 'end' : 'middle'); } });
    return g;
  },

  // "crowdfund cx cy width raised=7500 goal=10000 backers=120 cur=$ | label" — backers chip in, funding bar fills
  crowdfund: ([cx = 480, cy = 270, S = 680], o, t, parent) => {
    const g = G(cx, cy, S / 680, o, parent), goal = Math.max(1e-9, opt(o, 'goal', 10000)), got = Math.max(0, opt(o, 'raised', 7500)), cur = curOf(o), pc = got / goal * 100;
    if (t) label(g, 0, -170, t, TXT.blue, 28, 'middle');
    P(g, R(-300, -120, 600, 50, 25), '#ffffff', DK, 3);
    if (pc > 0) F(g, R(-300, -120, 600 * Math.min(1, pc / 100), 50, 25), FILL.green);
    line(g, R(-300, -120, 600, 50, 25), DK, 3);
    label(g, -300, -40, showLab(o) ? `${money(got, cur)} raised` : money(got, cur), GRN, 24); label(g, 300, -40, showLab(o) ? `goal ${money(goal, cur)}` : money(goal, cur), K, 22, 'end');
    label(g, -300 + 600 * Math.min(1, pc / 100) - (pc > 15 ? 10 : -10), -86, `${Math.round(pc)}%`, pc > 15 ? '#ffffff' : GRN, 24, pc > 15 ? 'end' : 'start');
    for (let i = 0; i < 6; i++) { const hx = -250 + i * 100; head1(g, hx, 110, 20, SKIN[i % 4], PAL[(i + 2) % 8]);
      coinAt(g, hx + 20, 40 - (i % 2) * 30, 13); line(g, `M${hx + 20} ${24 - (i % 2) * 30} Q${hx + 20} ${-10 - (i % 2) * 20} ${hx + 50} -20`, '#c98a00', 2); }
    label(g, 0, 200, showLab(o) ? `${fmt(opt(o, 'backers', 120))} backers` : fmt(opt(o, 'backers', 120)), TXT.blue, 24, 'middle');
    return g;
  },

  // "pricetag cx cy size was=50 off=20 cur=$" — price tag: old price struck out, sale price, discount burst
  pricetag: ([cx = 480, cy = 270, S = 420], o, t, parent) => {
    const g = G(cx, cy, S / 420, o, parent), was = opt(o, 'was', 50), off = clamp(opt(o, 'off', 20), 0, 100), cur = curOf(o), now = was * (1 - off / 100);
    line(g, 'M-170 -10 C-210 -80 -150 -150 -110 -120', '#8a6414', 2.6);
    P(g, 'M-140 0 L-70 -90 H170 V90 H-70 Z', '#fff3c4', '#b08a00', 3); P(g, E(-92, 0, 12), '#ffffff', '#b08a00', 2.5);
    const ws = money(was, cur, Number.isInteger(was) ? fmt : cents), ns = money(now, cur, Number.isInteger(now) ? fmt : cents);
    label(g, 50, -32, ws, TICK, fit(ws, 160, 34), 'middle'); line(g, `M${50 - tw(ws, fit(ws, 160, 34)) / 2 - 6} -42 L${50 + tw(ws, fit(ws, 160, 34)) / 2 + 6} -50`, RED, 4);
    label(g, 50, 52, ns, RED, fit(ns, 200, 56), 'middle');
    let d = ''; for (let i = 0; i < 24; i++) { const [px, py] = pt(150, -100, i % 2 ? 46 : 60, i * 15); d += `${i ? 'L' : 'M'}${px} ${py} `; }
    P(g, d + 'Z', FILL.red, '#8e2a1f', 2.5); label(g, 150, -92, `-${fmt(off)}%`, '#ffffff', 26, 'middle');
    if (t) label(g, 0, 140, t, TXT.blue, 26, 'middle');
    return g;
  },

  // "productbox cx cy size | Toy" — cardboard product box: taped top, front label, this-way-up arrows
  productbox: ([cx = 480, cy = 280, S = 360], o, t, parent) => {
    const g = G(cx, cy, S / 360, o, parent), d = 70;
    P(g, R(-140, -70, 220, 200), '#d9a15a', '#7a4a1a', 3);
    P(g, `M80 -70 L${80 + d} ${-70 - d * .6} V${130 - d * .6} L80 130 Z`, '#b9813f', '#7a4a1a', 3);
    P(g, `M-140 -70 L${-140 + d} ${-70 - d * .6} H${80 + d} L80 -70 Z`, '#e8b86a', '#7a4a1a', 3);
    F(g, `M-35 -70 L${-35 + d} ${-70 - d * .6} H${-5 + d} L-5 -70 Z`, '#f4e3c3');
    line(g, `M-35 -70 L${-35 + d} ${-70 - d * .6} M-5 -70 L${-5 + d} ${-70 - d * .6} M-20 -70 L${-20 + d} ${-70 - d * .6}`, '#9a6a2a', 2);
    F(g, R(-35, -70, 30, 50), '#f4e3c3'); line(g, R(-35, -70, 30, 50), '#9a6a2a', 2);
    P(g, R(-110, 0, 160, 90, 6), '#ffffff', '#7a4a1a', 2.5);
    if (t || showLab(o)) label(g, -30, 54, t || 'Product', K, fit(t || 'Product', 140, 32), 'middle');
    for (const ax of [96, 126]) arrow(g, ax, 60 - (ax - 80) * .6, ax, 20 - (ax - 80) * .6, '#5a3a1a', 3, 9);
    line(g, `M90 ${70 - 16 * .6} H132`, '#5a3a1a', 3);
    return g;
  },
});
})();
