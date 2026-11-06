// Whiteboard maths: graphs, data, geometry, number sense. Every position and number is computed from the call,
// never eyeballed, so the same line works for any values. Wrapped in a block so the helpers stay private.
(() => {
const K = '#2f3640', SOFT = '#cfd8e0', TICK = '#4a5560', RED = '#c0392b';
const PAL = ['#7fb7ea', '#f4a531', '#5fae3a', '#e04b3a', '#ffd84a', '#b48ad8', '#4fc1b0', '#f08a9a'];
const PINK = ['#2b6cc4', '#c97a10', '#2c6a22', '#c0392b', '#b08a00', '#6a3fa0', '#1f7f72', '#a3324a'];
const RAD = Math.PI / 180;

// ── value parsing: "3,5,2" lists, "1,2;3,4" point lists, "Mon,Tue" words ("_" = space)
const nlist = s => String(s ?? '').split(',').filter(x => x.trim() !== '').map(Number).filter(Number.isFinite);
const plist = s => String(s ?? '').split(';').filter(Boolean).map(p => p.split(',').map(Number)).filter(p => p.length >= 2 && p.every(Number.isFinite));
const words = s => String(s ?? '').split(',').map(x => x.trim().replace(/_/g, ' '));
const opt = (o, k, d) => (o[k] === undefined || o[k] === '' || !Number.isFinite(+o[k]) ? d : +o[k]);
const txt = s => String(s ?? '').replace(/_/g, ' ');
const fmt = v => { const r = Math.round(v * 100) / 100; return (Object.is(r, -0) ? 0 : r).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (a, b) => { if (!Number.isInteger(a) || !Number.isInteger(b)) return fmt(a / b); const g = gcd(a, b) || 1; return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const showLab = o => o.lab !== '0' && o.labels !== '0';   // lab=0 / labels=0 hide the recipe's own words

// ── geometry → path strings (pol uses maths angles: 0° = right, counter-clockwise, screen y down)
const pol = (cx, cy, r, a) => [cx + r * Math.cos(a * RAD), cy - r * Math.sin(a * RAD)];
const arcD = (cx, cy, r, a0, a1) => { const [x0, y0] = pol(cx, cy, r, a0), [x1, y1] = pol(cx, cy, r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${x1} ${y1}`; };
const ell = (cx, cy, rx, ry) => `M${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}`;
const ring = (cx, cy, r) => ell(cx, cy, r, r);
const rectD = (x, y, w, h) => `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
const polyD = (pts, close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ') + (close ? ' Z' : '');
const ellPts = (cx, cy, rx, ry, a0, a1, n = 48) => Array.from({ length: n + 1 }, (_, i) => pol(0, 0, 1, a0 + (a1 - a0) * i / n)).map(([u, v]) => [cx + rx * u, cy + ry * v]);

// ── drawing helpers in the house layers: wash (watercolour fill) → line (ink) → label
const wash = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...extra }, g);
const dot = (g, x, y, r, fill, ink = K) => { wash(g, ring(x, y, r), fill); line(g, ring(x, y, r), ink, 2.2); };
const arrow = (g, x0, y0, x1, y1, col = K, w = 3, h = 13) => { line(g, `M${x0} ${y0} L${x1} ${y1}`, col, w); line(g, head(x1, y1, x0, y0, h), col, w, { class: 'ink head' }); };
// dashes as separate sub-paths: the player animates ink with stroke-dasharray, which would erase a real dash pattern
const dashD = (pts, on = 9, off = 7) => {
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
const dash = (g, pts, col = K, w = 2.4) => line(g, dashD(pts), col, w);
const tw = (s, size) => String(s).length * size * 0.5;               // rough handwritten text width

// ── nice ticks: 1-2-5 steps
const niceStep = (span, n) => { const raw = Math.abs(span || 1) / Math.max(1, n), p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; };
const ticks = (lo, hi, n, s = niceStep(hi - lo, n)) => { const out = [];
  for (let i = Math.ceil(lo / s - 1e-9); i * s <= hi + 1e-9 * Math.abs(s); i++) out.push(+(i * s).toPrecision(12)); return out; };
const niceRange = (lo, hi, n) => { if (!(hi > lo)) { lo -= 1; hi += 1; } const s = niceStep(hi - lo, n);
  return [+(Math.floor(lo / s + 1e-9) * s).toPrecision(12), +(Math.ceil(hi / s - 1e-9) * s).toPrecision(12)]; };

// ── a value frame inside the box x y w h: axes through 0 (or the nearest edge), ticks, numbers, optional grid.
//    eq: one unit is the same length on both axes (true angles and squares)
const frame = (g, x, y, w, h, xr, yr, o = {}) => {
  const px = x + 46, py = y + 22, pw = w - 46 - 30, ph = h - 22 - 38;
  if (o.eq) {
    const s = Math.max((xr[1] - xr[0]) / pw, (yr[1] - yr[0]) / ph), mx = (xr[0] + xr[1]) / 2, my = (yr[0] + yr[1]) / 2;
    xr = [mx - s * pw / 2, mx + s * pw / 2]; yr = [my - s * ph / 2, my + s * ph / 2];
  }
  const X = v => px + (v - xr[0]) / (xr[1] - xr[0]) * pw, Y = v => py + ph - (v - yr[0]) / (yr[1] - yr[0]) * ph;
  const ox = clamp(0, xr[0], xr[1]), oy = clamp(0, yr[0], yr[1]);
  const xs = ticks(xr[0], xr[1], 0, o.unit ? 1 : niceStep(xr[1] - xr[0], Math.max(2, Math.round(pw / 70))));
  const ys = ticks(yr[0], yr[1], 0, o.unit ? 1 : niceStep(yr[1] - yr[0], Math.max(2, Math.round(ph / 50))));
  if (o.grid) line(g, [...xs.map(v => `M${X(v)} ${py} L${X(v)} ${py + ph}`), ...ys.map(v => `M${px} ${Y(v)} L${px + pw} ${Y(v)}`)].join(' '), SOFT, 1.5);
  arrow(g, px, Y(oy), px + pw + 16, Y(oy), K, 3);
  arrow(g, X(ox), py + ph, X(ox), py - 16, K, 3);
  line(g, [...xs.map(v => `M${X(v)} ${Y(oy) - 5} L${X(v)} ${Y(oy) + 5}`), ...ys.map(v => `M${X(ox) - 5} ${Y(v)} L${X(ox) + 5} ${Y(v)}`)].join(' '), K, 2);
  const xEvery = Math.max(1, Math.ceil(30 / Math.max(1, (X(xs[1] ?? xs[0]) - X(xs[0])) || 99))), skipX = yr[0] < oy, skipY = xr[0] < ox;
  xs.forEach((v, i) => { if ((skipX && v === ox) || i % xEvery) return; label(g, X(v), Y(oy) + 24, fmt(v), TICK, 18, 'middle'); });
  ys.forEach(v => { if (skipY && v === oy) return; label(g, X(ox) - 9, Y(v) + 6, fmt(v), TICK, 18, 'end'); });
  if (skipX && skipY) label(g, X(ox) - 7, Y(oy) + 21, '0', TICK, 18, 'end');
  if (o.xl) label(g, px + pw + 16, Y(oy) - 12, txt(o.xl), TXT.blue, 22, 'end');
  if (o.yl) label(g, X(ox) + 12, py - 2, txt(o.yl), TXT.blue, 22, 'start');
  const id = 'mathC' + clipN++;
  mk('clipPath', { id }, g).append(mk('rect', { x: px - 4, y: py - 4, width: pw + 8, height: ph + 8 }));
  return { X, Y, px, py, pw, ph, xr, yr, clip: `url(#${id})` };
};
const rangeOf = (vals, pad = 0, withZero = true, n = 6) => niceRange(Math.min(...vals, ...(withZero ? [0] : [])) - pad, Math.max(...vals, ...(withZero ? [0] : [])) + pad, n);

// ── a category frame for bar/line charts: one slot per value, value axis on the left
const catFrame = (g, x, y, w, h, vals, names, o) => {
  const px = x + 54, py = y + 28, pw = w - 54 - 8, ph = h - 28 - 40, n = Math.max(2, Math.round(ph / 55));
  const [lo, hi] = o.y ? nlist(o.y) : niceRange(Math.min(0, ...vals), Math.max(0, ...vals), n);
  const Y = v => py + ph - (v - lo) / (hi - lo) * ph, slot = pw / vals.length, CX = i => px + slot * (i + .5), base = Y(clamp(0, lo, hi));
  const ys = ticks(lo, hi, n), pre = txt(o.pre || ''), suf = txt(o.suf || '');
  line(g, ys.filter(v => Y(v) !== base).map(v => `M${px} ${Y(v)} L${px + pw} ${Y(v)}`).join(' ') || `M${px} ${py} l0.1 0`, SOFT, 1.4);
  line(g, `M${px} ${py + ph} L${px} ${py - 12}`, K, 3);
  line(g, `M${px} ${base} L${px + pw} ${base}`, K, 3);
  line(g, ys.map(v => `M${px - 5} ${Y(v)} L${px} ${Y(v)}`).join(' '), K, 2);
  ys.forEach(v => label(g, px - 9, Y(v) + 6, (v < 0 ? '-' : '') + pre + fmt(Math.abs(v)) + suf, TICK, 17, 'end'));
  const longest = Math.max(1, ...names.map(s => s.length)), ns = clamp(slot / (longest * 0.52), 11, 20);
  names.forEach((s, i) => s && label(g, CX(i), py + ph + 28, s, K, ns, 'middle'));
  if (o.yl) label(g, px + 8, py - 6, txt(o.yl), TXT.blue, 20);
  return { Y, CX, slot, base, py, ph, px, pw, show: v => (v < 0 ? '-' : '') + pre + fmt(Math.abs(v)) + suf };
};

const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];
const PLACE1 = ['O', 'T', 'H', 'Th', 'TTh', 'HTh'];
const POLY = { 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };

Object.assign(window.RECIPES, {
  // "axes x y w h x=-5,5 y=-4,4 grid=1 xl=time yl=distance" — box top-left + size
  axes: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), xr = o.x ? nlist(o.x) : [-5, 5], yr = o.y ? nlist(o.y) : [-5, 5];
    frame(g, x, y, w, h, xr, yr, { ...o, grid: o.grid === '1' });
    return g;
  },

  // "plot x y w h k=line|parabola|sine|exp|log a= b= c= x=-5,5 y=lo,hi pts=0,1;2,3 c=red | y = x²"
  plot: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.pts ? 'pts' : (o.k || 'parabola'), a = opt(o, 'a', 1);
    const b = opt(o, 'b', { sine: 1, exp: 2, log: 10 }[k] ?? 0), c = opt(o, 'c', 0);
    const F = { line: v => a * v + b, parabola: v => a * v * v + b * v + c, cubic: v => a * v ** 3 + b * v + c,
      sine: v => a * Math.sin(b * v + c), exp: v => a * b ** v + c, log: v => a * Math.log(v) / Math.log(b) + c }[k];
    if (k !== 'pts' && !F) throw new Error(`plot: unknown k="${k}"`);
    const P = k === 'pts' ? plist(o.pts) : null;
    const xr = o.x ? nlist(o.x) : P ? rangeOf(P.map(p => p[0])) : k === 'log' ? [0, 10] : [-5, 5];
    const S = P || Array.from({ length: 401 }, (_, i) => { const v = xr[0] + (xr[1] - xr[0]) * i / 400; return [v, F(v)]; });
    const fin = S.filter(p => Number.isFinite(p[1]) && Math.abs(p[1]) < 1e6);
    const yr = o.y ? nlist(o.y) : rangeOf(fin.map(p => p[1]));
    const f = frame(g, x, y, w, h, xr, yr, o), col = INK[o.c] || RED;
    let d = '', pen = false;
    for (const [u, v] of S) {
      const ok = Number.isFinite(v) && v > yr[0] - (yr[1] - yr[0]) && v < yr[1] + (yr[1] - yr[0]);
      if (ok) { d += `${pen ? 'L' : 'M'}${f.X(u).toFixed(2)} ${f.Y(v).toFixed(2)} `; pen = true; } else pen = false;
    }
    line(g, d || `M${f.px} ${f.py} l0.1 0`, col, 4, { 'clip-path': f.clip });
    if (P) P.forEach(([u, v]) => dot(g, f.X(u), f.Y(v), 6, FILL[o.c] || FILL.red, col));
    if (t) { // the plot corner with the fewest curve points gets the label
      const bw = tw(t, 24) + 20, scr = S.filter(p => Number.isFinite(p[1])).map(([u, v]) => [f.X(u), f.Y(v)]);
      const spots = [[f.px + 12, f.py + 8, 'start'], [f.px + f.pw - 8, f.py + 8, 'end'], [f.px + 12, f.py + f.ph - 36, 'start'], [f.px + f.pw - 8, f.py + f.ph - 36, 'end']];
      const hits = ([sx, sy, an]) => { const x0 = an === 'end' ? sx - bw : sx - 10; return scr.filter(([X, Y]) => X > x0 && X < x0 + bw && Y > sy - 6 && Y < sy + 36).length; };
      const [sx, sy, an] = spots.reduce((b, c) => (hits(c) < hits(b) ? c : b));
      label(g, sx, sy + 22, t, TXT[o.c] || RED, 24, an); }
    return g;
  },

  // "scatter x y w h pts=1,2;2,3;4,5 fit=1 xl= yl= | label" — dots, optional best-fit line (least squares)
  scatter: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), P = plist(o.pts || '1,2;2,3;3,3;4,5;5,4;6,6;7,7;8,7');
    if (!P.length) throw new Error('scatter: no pts');
    const xr = o.x ? nlist(o.x) : rangeOf(P.map(p => p[0])), yr = o.y ? nlist(o.y) : rangeOf(P.map(p => p[1]));
    const f = frame(g, x, y, w, h, xr, yr, o);
    if (o.fit === '1' && P.length > 1) {
      const n = P.length, mx = P.reduce((s, p) => s + p[0], 0) / n, my = P.reduce((s, p) => s + p[1], 0) / n;
      const sxx = P.reduce((s, p) => s + (p[0] - mx) ** 2, 0), m = sxx ? P.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / sxx : 0, b0 = my - m * mx;
      line(g, `M${f.X(xr[0])} ${f.Y(m * xr[0] + b0)} L${f.X(xr[1])} ${f.Y(m * xr[1] + b0)}`, RED, 3.5, { 'clip-path': f.clip });
      if (t || showLab(o)) label(g, f.px + 14, f.py + 6, t || `y ≈ ${fmt(m)}x ${b0 < 0 ? '-' : '+'} ${fmt(Math.abs(b0))}`, RED, 22);
    } else if (t) label(g, f.px + 14, f.py + 6, t, TXT.blue, 22);
    P.forEach(([u, v]) => dot(g, f.X(u), f.Y(v), 7, FILL.blue, INK.blue));
    return g;
  },

  // "bars x y w h vals=3,5,2,8 c=multi hi=2 pre=$ suf=% | Mon,Tue,Wed,Thu" — bar chart, values written on top
  bars: ([x = 140, y = 50, w = 680, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), vals = nlist(o.vals || '3,5,2,8');
    if (!vals.length) throw new Error('bars: no vals');
    const names = t ? words(t) : vals.map((_, i) => String(i + 1)), f = catFrame(g, x, y, w, h, vals, names, o), bw = f.slot * .62;
    const colour = i => +o.hi === i + 1 ? [FILL.red, INK.red] : o.c === 'multi' ? [PAL[i % 8], PINK[i % 8]] : [FILL[o.c] || FILL.orange, INK[o.c] || INK.orange];
    vals.forEach((v, i) => { const top = f.Y(v), [fl] = colour(i);
      wash(g, rectD(f.CX(i) - bw / 2, Math.min(top, f.base), bw, Math.abs(f.base - top) || 1), fl); });
    vals.forEach((v, i) => { const top = f.Y(v), [, ink] = colour(i);
      line(g, `M${f.CX(i) - bw / 2} ${f.base} L${f.CX(i) - bw / 2} ${top} L${f.CX(i) + bw / 2} ${top} L${f.CX(i) + bw / 2} ${f.base}`, ink, 3); });
    const vs = clamp(f.slot * .3, 12, 20);
    vals.forEach((v, i) => label(g, f.CX(i), v >= 0 ? f.Y(v) - 8 : f.Y(v) + vs + 4, f.show(v), K, vs, 'middle'));
    return g;
  },

  // "linechart x y w h vals=4,6,5,9 area=1 pre= suf= | Jan,Feb,Mar,Apr" — points joined by a line, values shown
  linechart: ([x = 140, y = 50, w = 680, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), vals = nlist(o.vals || '4,6,5,9,8,12');
    if (!vals.length) throw new Error('linechart: no vals');
    const names = t ? words(t) : vals.map((_, i) => String(i + 1)), f = catFrame(g, x, y, w, h, vals, names, o), col = INK[o.c] || INK.blue;
    const pts = vals.map((v, i) => [f.CX(i), f.Y(v)]);
    if (o.area !== '0') wash(g, polyD([[pts[0][0], f.base], ...pts, [pts.at(-1)[0], f.base]]), FILL[o.c] || FILL.blue, { opacity: .45 });
    line(g, polyD(pts, false), col, 4);
    pts.forEach(([px, py]) => dot(g, px, py, 6, '#ffffff', col));
    const vs = clamp(f.slot * .3, 12, 19);
    if (f.slot > 26) vals.forEach((v, i) => label(g, pts[i][0], pts[i][1] - 14, f.show(v), K, vs, 'middle'));
    return g;
  },

  // "pie cx cy r vals=3,5,2 | Red,Blue,Green" — slices in proportion, percent inside, names outside
  pie: ([cx = 480, cy = 270, r = 170], o, t, parent) => {
    const g = mk('g', {}, parent), vals = nlist(o.vals || '3,5,2').filter(v => v > 0), sum = vals.reduce((s, v) => s + v, 0);
    if (!sum) throw new Error('pie: vals must be positive');
    const names = t ? words(t) : [], sl = []; let a = 90;
    for (const v of vals) { const span = v / sum * 360; sl.push([a, a - span, v]); a -= span; }
    sl.forEach(([a0, a1], i) => wash(g, sl.length === 1 ? ring(cx, cy, r) :
      `M${cx} ${cy} L${pol(cx, cy, r, a0).join(' ')} A${r} ${r} 0 ${a0 - a1 > 180 ? 1 : 0} 1 ${pol(cx, cy, r, a1).join(' ')} Z`, PAL[i % 8]));
    line(g, ring(cx, cy, r), K, 3);
    if (sl.length > 1) line(g, sl.map(([a0]) => `M${cx} ${cy} L${pol(cx, cy, r, a0).join(' ')}`).join(' '), K, 2.6);
    sl.forEach(([a0, a1, v], i) => { const m = (a0 + a1) / 2, pct = Math.round(v / sum * 1000) / 10;
      if (pct >= 6) { const [lx, ly] = pol(cx, cy, r * .62, m); label(g, lx, ly + 8, `${pct}%`, K, clamp(r * .14, 15, 24), 'middle'); }
      if (names[i]) { const [nx, ny] = pol(cx, cy, r + 16, m), c = Math.cos(m * RAD), s = Math.sin(m * RAD);
        label(g, nx, ny + 7 + (s < -.6 ? 12 : s > .6 ? -4 : 0), names[i], PINK[i % 8], 22, c > .25 ? 'start' : c < -.25 ? 'end' : 'middle'); } });
    return g;
  },

  // "numberline x y w min=0 max=10 step=1 at=3 hops=4,-2 den=4 pts=7" — marked start, hop arrows with +n labels
  numberline: ([x = 80, y = 330, w = 800], o, t, parent) => {
    const g = mk('g', {}, parent), lo = opt(o, 'min', 0), hi = opt(o, 'max', 10);
    if (!(hi > lo)) throw new Error('numberline: max must be above min');
    let st = opt(o, 'step', niceStep(hi - lo, 10)); if ((hi - lo) / st > 80) st = niceStep(hi - lo, 20);
    const X = v => x + 24 + (v - lo) / (hi - lo) * (w - 48), den = opt(o, 'den', 0);
    const name = v => den ? frac(Math.round(v * den), den) : fmt(v);
    line(g, `M${x} ${y} L${x + w} ${y}`, K, 3);
    line(g, head(x + w, y, x, y) + ' ' + head(x, y, x + w, y), K, 3, { class: 'ink head' });
    const tv = ticks(lo, hi, 0, st), px = X(lo + st) - X(lo), longest = Math.max(...tv.map(v => name(v).length));
    const every = [1, 2, 5, 10, 20, 50].find(k => k * px >= Math.max(30, longest * 11)) || 100;
    const lab = tv.filter((v, i) => Math.round((v - lo) / st) % every === 0);
    line(g, tv.map(v => { const L = lab.includes(v) ? 11 : 7; return `M${X(v)} ${y - L} L${X(v)} ${y + L}`; }).join(' '), K, 2.4);
    lab.forEach(v => label(g, X(v), y + 36, name(v), K, 22, 'middle'));
    let cur = opt(o, 'at', NaN);
    const hops = nlist(o.hops), keys = ['blue', 'orange', 'green', 'red'];
    if (Number.isFinite(cur)) {
      hops.forEach((hp, i) => {
        const x0 = X(cur), x1 = X(cur + hp), ht = clamp(Math.abs(x1 - x0) * .38, 26, 90), qx = (x0 + x1) / 2, qy = y - 8 - 2 * ht, col = INK[keys[i % 4]];
        line(g, `M${x0} ${y - 8} Q${qx} ${qy} ${x1} ${y - 8}`, col, 3);
        line(g, head(x1, y - 8, (qx + x1) / 2, (qy + y - 8) / 2, 12), col, 3, { class: 'ink head' });
        label(g, qx, y - 18 - ht, (hp >= 0 ? '+' : '') + name(hp), TXT[keys[i % 4]], 22, 'middle');
        cur += hp;
      });
      dot(g, X(opt(o, 'at', 0)), y, 8, FILL.red, INK.red);
      if (hops.length) dot(g, X(cur), y, 8, FILL.green, INK.green);
    }
    nlist(o.pts).forEach(v => dot(g, X(v), y, 7, FILL.yellow, INK.orange));
    if (t) label(g, x + w / 2, y + 72, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "fraction cx cy size n=3 d=4 k=pie|bar" — n/d shaded (n > d draws several wholes), n/d written below
  fraction: ([cx = 480, cy = 220, S = 240], o, t, parent) => {
    const g = mk('g', {}, parent), d = Math.max(1, Math.round(opt(o, 'd', 4))), n = Math.max(0, Math.round(opt(o, 'n', 3)));
    const W = clamp(Math.ceil(n / d), 1, 6), shaded = wi => clamp(n - wi * d, 0, d);
    let bottom;
    if (o.k === 'bar') {
      const bw = S * 1.6, bh = clamp(S * .3, 30, 80), gap = 14, h0 = W * bh + (W - 1) * gap, top = cy - h0 / 2, pw = bw / d;
      for (let wi = 0; wi < W; wi++) { const yy = top + wi * (bh + gap);
        if (shaded(wi)) wash(g, rectD(cx - bw / 2, yy, pw * shaded(wi), bh), FILL.orange);
        line(g, rectD(cx - bw / 2, yy, bw, bh), K, 3);
        if (d > 1) line(g, Array.from({ length: d - 1 }, (_, j) => `M${cx - bw / 2 + pw * (j + 1)} ${yy} L${cx - bw / 2 + pw * (j + 1)} ${yy + bh}`).join(' '), K, 2.4); }
      bottom = top + h0;
    } else {
      const r = Math.min(S / 2, S * 1.6 / W / 2 / 1.15), gap = r * .3, total = W * 2 * r + (W - 1) * gap;
      for (let wi = 0; wi < W; wi++) { const ox = cx - total / 2 + r + wi * (2 * r + gap), s = shaded(wi);
        if (s === d) wash(g, ring(ox, cy, r), FILL.orange);
        else for (let j = 0; j < s; j++) wash(g, `M${ox} ${cy} L${pol(ox, cy, r, 90 - j * 360 / d).join(' ')} A${r} ${r} 0 ${360 / d > 180 ? 1 : 0} 1 ${pol(ox, cy, r, 90 - (j + 1) * 360 / d).join(' ')} Z`, FILL.orange);
        line(g, ring(ox, cy, r), K, 3);
        if (d > 1) line(g, Array.from({ length: d }, (_, j) => `M${ox} ${cy} L${pol(ox, cy, r, 90 - j * 360 / d).join(' ')}`).join(' '), K, 2.4); }
      bottom = cy + r;
    }
    const fs = 34, nw = Math.max(tw(n, fs), tw(d, fs)) + 10;
    label(g, cx, bottom + 44, String(n), TXT.orange, fs, 'middle');
    line(g, `M${cx - nw / 2} ${bottom + 56} L${cx + nw / 2} ${bottom + 56}`, TXT.orange, 3);
    label(g, cx, bottom + 88, String(d), TXT.orange, fs, 'middle');
    if (t) label(g, cx + nw / 2 + 16, bottom + 72, t, TXT.blue, 24);
    return g;
  },

  // "coordgrid x y w h x=-5,5 y=-4,4 pts=2,3;-3,1 proj=1 | A,B" — unit grid, labelled points with coordinates
  coordgrid: ([x = 200, y = 40, w = 560, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), P = plist(o.pts || '2,3;-3,1;-2,-2'), names = t ? words(t) : P.map((_, i) => String.fromCharCode(65 + i));
    const xr = o.x ? nlist(o.x) : [-5, 5], yr = o.y ? nlist(o.y) : [-5, 5];
    const f = frame(g, x, y, w, h, xr, yr, { ...o, grid: true, eq: true, unit: (xr[1] - xr[0]) <= 24 });
    if (o.proj === '1') P.forEach(([u, v]) => dash(g, [[f.X(0), f.Y(v)], [f.X(u), f.Y(v)], [f.X(u), f.Y(0)]], INK.sky, 2.2));
    P.forEach(([u, v], i) => { dot(g, f.X(u), f.Y(v), 7, PAL[(i + 3) % 8], PINK[(i + 3) % 8]);
      const right = f.X(u) < f.px + f.pw - 120;
      label(g, f.X(u) + (right ? 12 : -12), f.Y(v) - 10, `${names[i] || ''}(${fmt(u)}, ${fmt(v)})`, PINK[(i + 3) % 8], 21, right ? 'start' : 'end'); });
    return g;
  },

  // "angle cx cy length deg=50 rot=0 name=1 | x" — vertex at cx cy; arc + degrees (square mark at 90°)
  angle: ([cx = 330, cy = 400, L = 360], o, t, parent) => {
    const g = mk('g', {}, parent), deg = opt(o, 'deg', 50), rot = opt(o, 'rot', 0), ar = clamp(L * .26, 34, 80);
    if (Math.abs(deg - 90) < 1e-6) {
      const s = ar * .5, [ax, ay] = pol(cx, cy, s, rot), [bx, by] = pol(cx, cy, s, rot + 90), [qx, qy] = [ax + bx - cx, ay + by - cy];
      wash(g, polyD([[cx, cy], [ax, ay], [qx, qy], [bx, by]]), FILL.yellow);
      line(g, `M${ax} ${ay} L${qx} ${qy} L${bx} ${by}`, INK.orange, 2.6);
    } else {
      wash(g, `M${cx} ${cy} L${pol(cx, cy, ar, rot).join(' ')} ${arcD(cx, cy, ar, rot, rot + deg).replace(/^M[^A]+/, '')} Z`, FILL.yellow);
      line(g, arcD(cx, cy, ar, rot, rot + deg), INK.orange, 3);
    }
    line(g, `M${pol(cx, cy, L, rot).join(' ')} L${cx} ${cy} L${pol(cx, cy, L, rot + deg).join(' ')}`, K, 3.4);
    const lr = ar + 30 + Math.max(0, 30 - deg) * 2.2, [lx, ly] = pol(cx, cy, lr, rot + deg / 2);
    label(g, lx, ly + 9, t || `${fmt(deg)}°`, TXT.orange, 28, 'middle');
    if (o.name === '1') { const kind = deg < 90 ? 'acute' : deg === 90 ? 'right angle' : deg < 180 ? 'obtuse' : deg === 180 ? 'straight' : 'reflex';
      if (showLab(o)) label(g, cx, cy + 44, kind, TXT.blue, 24, 'middle'); }
    dot(g, cx, cy, 4.5, K);
    return g;
  },

  // "protractor cx cy r deg=60" — cx cy = centre of the baseline; 0–180 scales, optional measured ray
  protractor: ([cx = 480, cy = 440, r = 330], o, t, parent) => {
    const g = mk('g', {}, parent), half = `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z`;
    wash(g, half, '#d6ebfa', { opacity: .8 });
    const deg = opt(o, 'deg', NaN);
    if (Number.isFinite(deg)) wash(g, `M${cx} ${cy} L${cx + r * .3} ${cy} ${arcD(cx, cy, r * .3, 0, deg).replace(/^M[^A]+/, '')} Z`, FILL.yellow);
    line(g, half, INK.blue, 3);
    line(g, arcD(cx, cy, r * .16, 0, 180), INK.blue, 2);
    const fine = r * RAD >= 4;
    let d = '';
    for (let a = 0; a <= 180; a += fine ? 1 : 5) { const L = a % 10 === 0 ? r * .09 : a % 5 === 0 ? r * .06 : r * .035;
      const [x0, y0] = pol(cx, cy, r, a), [x1, y1] = pol(cx, cy, r - L, a); d += `M${x0} ${y0} L${x1} ${y1} `; }
    line(g, d, INK.blue, 1.4);
    const fs = clamp(r * .05, 11, 17);
    for (let a = 0; a <= 180; a += 10) {
      const [ox, oy] = pol(cx, cy, r * .82, a); label(g, ox, oy + fs * .35, String(a), INK.blue, fs, 'middle');
      if (r >= 180) { const [ix, iy] = pol(cx, cy, r * .68, a); label(g, ix, iy + fs * .35, String(180 - a), TXT.sky, fs * .85, 'middle'); }
    }
    line(g, `M${cx} ${cy - 10} L${cx} ${cy}`, INK.blue, 2.4);
    if (Number.isFinite(deg)) {
      arrow(g, cx, cy, ...pol(cx, cy, r + 22, deg), RED, 3.4);
      line(g, `M${cx} ${cy} L${cx + r + 22} ${cy}`, RED, 3.4);
      const [lx, ly] = pol(cx, cy, r * .3 + 26, deg / 2);
      label(g, lx, ly + 8, t || `${fmt(deg)}°`, RED, 26, 'middle');
    }
    return g;
  },

  // "ruler x y length units=10 u=cm at=7.5" — x y = top-left; unit, half and tenth ticks; at= measures a strip
  ruler: ([x = 110, y = 240, L = 740], o, t, parent) => {
    const g = mk('g', {}, parent), n = Math.max(1, Math.round(opt(o, 'units', 10))), H = 72, per = (L - 36) / n, x0 = x + 18, u = txt(o.u || 'cm');
    wash(g, rectD(x, y, L, H), '#ffe8a3');
    line(g, rectD(x, y, L, H), INK.orange, 3);
    let d = ''; const sub = per / 10 >= 5 ? 10 : per / 2 >= 6 ? 2 : 1;
    for (let i = 0; i <= n * sub; i++) { const len = i % sub === 0 ? 26 : sub === 10 && i % 5 === 0 ? 18 : 10, xx = x0 + i * per / sub;
      d += `M${xx} ${y} L${xx} ${y + len} `; }
    line(g, d, K, 1.6);
    const every = [1, 2, 5, 10].find(k => k * per >= 26) || 20;
    for (let i = 0; i <= n; i += every) label(g, x0 + i * per, y + 50, String(i), K, 18, 'middle');
    label(g, x + L - 8, y + H - 6, u, TICK, 15, 'end');
    const at = opt(o, 'at', NaN);
    if (Number.isFinite(at)) {
      const xe = x0 + clamp(at, 0, n) * per;
      wash(g, rectD(x0, y - 34, xe - x0, 20), FILL.blue);
      line(g, rectD(x0, y - 34, xe - x0, 20), INK.blue, 2.6);
      line(g, `M${xe} ${y - 40} L${xe} ${y + 30}`, RED, 2.6);
      label(g, xe + 8, y - 44, t || `${fmt(at)} ${u}`, RED, 24, 'start');
    }
    return g;
  },

  // "triangle cx cy size a=3 b=4 c=5 u=cm hide=c angles=0 | A,B,C" — built from its three sides; right angle marked
  triangle: ([cx = 480, cy = 280, S = 400], o, t, parent) => {
    const g = mk('g', {}, parent), a = opt(o, 'a', 3), b = opt(o, 'b', 4), c = opt(o, 'c', 5);
    if (!(a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a)) throw new Error('triangle: sides do not make a triangle');
    const Ax = (c * c + a * a - b * b) / (2 * a), Ay = Math.sqrt(Math.max(0, c * c - Ax * Ax)), xs = [0, a, Ax];
    const minx = Math.min(...xs), bw = Math.max(...xs) - minx, s = Math.min(S / bw, S * .7 / Ay);
    const M = (px, py) => [cx + (px - minx - bw / 2) * s, cy + (Ay / 2 - py) * s];
    const B = M(0, 0), C = M(a, 0), A = M(Ax, Ay), V = [A, B, C], G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    const ang = [Math.acos((b * b + c * c - a * a) / (2 * b * c)), Math.acos((a * a + c * c - b * b) / (2 * a * c)), Math.acos((a * a + b * b - c * c) / (2 * a * b))].map(v => v / RAD);
    wash(g, polyD(V), '#bfe3a8');
    line(g, polyD(V), K, 3.4);
    const hide = String(o.hide || '').split(','), u = txt(o.u || '');
    [[B, C, 'a', a], [C, A, 'b', b], [A, B, 'c', c]].forEach(([P, Q, k, len]) => {
      const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2, ex = Q[0] - P[0], ey = Q[1] - P[1], el = Math.hypot(ex, ey);
      let nx = -ey / el, ny = ex / el; if (nx * (mx - G[0]) + ny * (my - G[1]) < 0) { nx = -nx; ny = -ny; }
      label(g, mx + nx * 24, my + ny * 24 + 8, hide.includes(k) ? '?' : fmt(len) + (u ? ' ' + u : ''), TXT.blue, 24, nx > .3 ? 'start' : nx < -.3 ? 'end' : 'middle');
    });
    V.forEach((P, i) => {
      const Q = V[(i + 1) % 3], R = V[(i + 2) % 3], dir = T => Math.atan2(-(T[1] - P[1]), T[0] - P[0]) / RAD;
      let a0 = dir(Q), sweep = ((dir(R) - a0) % 360 + 360) % 360; if (sweep > 180) { a0 = dir(R); sweep = 360 - sweep; }
      if (Math.abs(ang[i] - 90) < .05) {
        const p1 = pol(P[0], P[1], 18, a0), p3 = pol(P[0], P[1], 18, a0 + 90), p2 = [p1[0] + p3[0] - P[0], p1[1] + p3[1] - P[1]];
        line(g, `M${p1.join(' ')} L${p2.join(' ')} L${p3.join(' ')}`, RED, 2.6);
      } else if (o.angles !== '0') {
        line(g, arcD(P[0], P[1], 28, a0, a0 + sweep), RED, 2.4);
        const [lx, ly] = pol(P[0], P[1], 28 + 26 + Math.max(0, 35 - ang[i]), a0 + sweep / 2);
        label(g, lx, ly + 7, `${Math.round(ang[i] * 10) / 10}°`, RED, 18, 'middle');
      }
    });
    if (t) words(t).forEach((nm, i) => { const P = V[i], dx = P[0] - G[0], dy = P[1] - G[1], dl = Math.hypot(dx, dy) || 1;
      label(g, P[0] + dx / dl * 22, P[1] + dy / dl * 22 + 8, nm, K, 26, 'middle'); });
    return g;
  },

  // "circleparts cx cy r val=5 u=cm show=radius,diameter,chord,circumference,arc,sector" — parts named, or measured from val
  circleparts: ([cx = 480, cy = 270, r = 180], o, t, parent) => {
    const g = mk('g', {}, parent), show = words(o.show || 'radius,diameter,chord,circumference'), v = opt(o, 'val', NaN), u = txt(o.u ? ' ' + o.u : '');
    const has = k => show.includes(k), m = Number.isFinite(v);
    wash(g, ring(cx, cy, r), '#d6ebfa');
    if (has('sector')) wash(g, `M${cx} ${cy} L${cx + r} ${cy} ${arcD(cx, cy, r, 0, 50).replace(/^M[^A]+/, '')} Z`, FILL.yellow);
    line(g, ring(cx, cy, r), K, 3.4);
    if (has('diameter')) { line(g, `M${cx - r} ${cy} L${cx + r} ${cy}`, INK.blue, 3.2); if (m || showLab(o)) label(g, cx - r / 2, cy + 30, m ? `d = ${fmt(2 * v)}${u}` : 'diameter', TXT.blue, 22, 'middle'); }
    if (has('radius')) { const [ex, ey] = pol(cx, cy, r, 50); line(g, `M${cx} ${cy} L${ex} ${ey}`, RED, 3.2);
      const [lx, ly] = pol(cx, cy, r * .5, 50); if (m || showLab(o)) label(g, lx - 12, ly - 6, m ? `r = ${fmt(v)}${u}` : 'radius', RED, 22, 'end'); }
    if (has('chord')) { const p = pol(cx, cy, r, 218), q = pol(cx, cy, r, 322); line(g, `M${p.join(' ')} L${q.join(' ')}`, INK.green, 3.2);
      if (showLab(o)) label(g, cx, p[1] - 12, 'chord', TXT.green, 22, 'middle'); }
    if (has('arc')) { line(g, arcD(cx, cy, r, 0, 50), INK.orange, 6); const [lx, ly] = pol(cx, cy, r + 18, 25); if (showLab(o)) label(g, lx, ly + 6, 'arc', TXT.orange, 22); }
    if (has('sector')) { const [lx, ly] = pol(cx, cy, r * .72, 18); if (showLab(o)) label(g, lx, ly + 6, 'sector', TXT.orange, 20, 'middle'); }
    if (has('circumference')) { line(g, arcD(cx, cy, r + 12, 110, 165), INK.orange, 3); line(g, head(...pol(cx, cy, r + 12, 165), ...pol(cx, cy, r + 12, 160)), INK.orange, 3, { class: 'ink head' });
      const [lx, ly] = pol(cx, cy, r + 26, 140); if (m || showLab(o)) label(g, lx, ly, m ? `C = ${fmt(2 * Math.PI * v)}${u}` : 'circumference', TXT.orange, 22, 'end'); }
    dot(g, cx, cy, 4.5, K);
    if (t) label(g, cx, cy + r + 40, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "polygon cx cy r n=6 angles=1 | name" — regular n-gon on a flat base, equal-side marks, name; angles=1 shows interior angle
  polygon: ([cx = 480, cy = 250, r = 170], o, t, parent) => {
    const g = mk('g', {}, parent), n = clamp(Math.round(opt(o, 'n', 6)), 3, 40), a0 = -90 + 180 / n;
    const V = Array.from({ length: n }, (_, i) => pol(cx, cy, r, a0 + 360 * i / n));
    wash(g, polyD(V), PAL[n % 8]);
    line(g, polyD(V), K, 3.4);
    line(g, V.map((P, i) => { const Q = V[(i + 1) % n], mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2, ex = Q[0] - P[0], ey = Q[1] - P[1], L = Math.hypot(ex, ey);
      return `M${mx - ey / L * 8} ${my + ex / L * 8} L${mx + ey / L * 8} ${my - ex / L * 8}`; }).join(' '), K, 2.2);
    const bottom = cy + r * Math.cos(Math.PI / n);
    if (o.angles === '1') {
      const P = V[0], ia = (n - 2) * 180 / n, dir = T => Math.atan2(-(T[1] - P[1]), T[0] - P[0]) / RAD, s0 = dir(V[1]);
      line(g, arcD(P[0], P[1], 30, s0, s0 + ia), RED, 2.6);
      label(g, ...(([lx, ly]) => [lx, ly + 7])(pol(P[0], P[1], 58, s0 + ia / 2)), `${fmt(ia)}°`, RED, 20, 'middle');
      if (showLab(o)) label(g, cx, bottom + 64, `angles add to ${fmt((n - 2) * 180)}°`, RED, 22, 'middle');
    }
    if (t || showLab(o)) label(g, cx, bottom + 34, t || POLY[n] || `${n}-gon`, TXT.blue, 26, 'middle');
    return g;
  },

  // "solid cx cy size k=cube|cuboid|cylinder|cone|sphere|pyramid l= w= h= r= | label" — 3D shape, hidden edges dashed, dims shown when given
  solid: ([cx = 480, cy = 270, S = 260], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'cube', light = '#cfe6f8', mid = '#9cc9ee', dark = '#6fa6d6', show = v => fmt(v) + (o.u ? ' ' + txt(o.u) : '');
    const face = (pts, fill) => wash(g, polyD(pts), fill);
    if (k === 'cube' || k === 'cuboid' || k === 'pyramid') {
      const l = opt(o, 'l', k === 'cuboid' ? 6 : 4), w = opt(o, 'w', k === 'cuboid' ? 3 : 4), h = opt(o, 'h', k === 'cuboid' ? 4 : 4);
      const dk = [.55, -.42], s = Math.min(S * 1.25 / (l + w * dk[0]), S / (h + w * -dk[1])), L = l * s, H = h * s, dx = w * s * dk[0], dy = w * s * dk[1];
      const x0 = cx - (L + dx) / 2, y0 = cy + (H - dy) / 2;
      const F0 = [x0, y0], F1 = [x0 + L, y0], B0 = [x0 + dx, y0 + dy], B1 = [x0 + L + dx, y0 + dy];
      if (k === 'pyramid') {
        const Ap = [x0 + (L + dx) / 2, y0 + dy / 2 - H];
        face([F0, F1, Ap], mid); face([F1, B1, Ap], dark);
        dash(g, [F0, B0, B1]); dash(g, [B0, Ap]);
        line(g, polyD([F0, F1, B1], false) + ` M${F0.join(' ')} L${Ap.join(' ')} L${F1.join(' ')} M${Ap.join(' ')} L${B1.join(' ')}`, K, 3.2);
        if (o.h) { const Bc = [x0 + (L + dx) / 2, y0 + dy / 2]; dash(g, [Ap, Bc], RED); label(g, Bc[0] + 8, (Ap[1] + Bc[1]) / 2, `h = ${show(h)}`, RED, 20); }
        if (o.l) label(g, x0 + L / 2, y0 + 30, show(l), TXT.blue, 22, 'middle');
      } else {
        const F2 = [x0 + L, y0 - H], F3 = [x0, y0 - H], B2 = [F2[0] + dx, F2[1] + dy], B3 = [F3[0] + dx, F3[1] + dy];
        face([F0, F1, F2, F3], mid); face([F3, F2, B2, B3], light); face([F1, B1, B2, F2], dark);
        dash(g, [F0, B0, B1]); dash(g, [B0, B3]);
        line(g, polyD([F0, F1, F2, F3]) + ` M${F3.join(' ')} L${B3.join(' ')} L${B2.join(' ')} L${F2.join(' ')} M${B2.join(' ')} L${B1.join(' ')} L${F1.join(' ')}`, K, 3.2);
        if (o.l || o.w || o.h) {
          label(g, x0 + L / 2, y0 + 30, show(l), TXT.blue, 22, 'middle');
          label(g, x0 - 12, y0 - H / 2 + 8, show(h), TXT.blue, 22, 'end');
          label(g, x0 + L + dx / 2 + 12, y0 + dy / 2 + 14, show(w), TXT.blue, 22, 'start');
        }
      }
    } else if (k === 'cylinder' || k === 'cone') {
      const r0 = opt(o, 'r', 3), h = opt(o, 'h', k === 'cone' ? 6 : 5), s = Math.min(S * .9 / (2 * r0), S / (h + r0 * .6)), rx = r0 * s, ry = rx * .3, H = h * s;
      const yb = cy + H / 2, yt = cy - H / 2;
      if (k === 'cylinder') {
        wash(g, `M${cx - rx} ${yt} L${cx - rx} ${yb} A${rx} ${ry} 0 0 0 ${cx + rx} ${yb} L${cx + rx} ${yt} Z`, mid);
        wash(g, ell(cx, yt, rx, ry), light);
        dash(g, ellPts(cx, yb, rx, ry, 0, 180));
        line(g, `M${cx - rx} ${yt} L${cx - rx} ${yb} A${rx} ${ry} 0 0 0 ${cx + rx} ${yb} L${cx + rx} ${yt} ` + ell(cx, yt, rx, ry), K, 3.2);
        if (o.r) { line(g, `M${cx} ${yt} L${cx + rx} ${yt}`, RED, 2.6); label(g, cx + rx / 2, yt - 10, `r = ${show(r0)}`, RED, 20, 'middle'); }
        if (o.h) label(g, cx + rx + 12, cy + 8, `h = ${show(h)}`, TXT.blue, 22);
      } else {
        const ap = [cx, yt - ry];
        wash(g, `M${ap.join(' ')} L${cx - rx} ${yb} A${rx} ${ry} 0 0 0 ${cx + rx} ${yb} Z`, mid);
        dash(g, ellPts(cx, yb, rx, ry, 0, 180));
        line(g, `M${ap.join(' ')} L${cx - rx} ${yb} A${rx} ${ry} 0 0 0 ${cx + rx} ${yb} L${ap.join(' ')}`, K, 3.2);
        if (o.h) { dash(g, [ap, [cx, yb]], RED); label(g, cx + 8, cy + 8, `h = ${show(h)}`, RED, 20); }
        if (o.r) { line(g, `M${cx} ${yb} L${cx + rx} ${yb}`, INK.blue, 2.6); label(g, cx + rx / 2, yb + ry + 24, `r = ${show(r0)}`, TXT.blue, 20, 'middle'); }
      }
    } else if (k === 'sphere') {
      const r = S / 2, ry = r * .28;
      wash(g, ring(cx, cy, r), mid);
      wash(g, ring(cx - r * .35, cy - r * .35, r * .32), '#ffffff', { opacity: .55 });
      dash(g, ellPts(cx, cy, r, ry, 0, 180));
      line(g, ring(cx, cy, r) + ` M${cx - r} ${cy} A${r} ${ry} 0 0 0 ${cx + r} ${cy}`, K, 3.2);
      if (o.r) { line(g, `M${cx} ${cy} L${cx + r} ${cy}`, RED, 2.6); dot(g, cx, cy, 3.5, K); label(g, cx + r / 2, cy - 10, `r = ${show(opt(o, 'r', 1))}`, RED, 20, 'middle'); }
    } else throw new Error(`solid: unknown k="${k}"`);
    if (t) label(g, cx, cy + S * .62 + 30, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "areagrid x y cell cols=8 rows=5 shade=3,4 | area = 12" — unit squares, a w×h block shaded, sides and area written
  areagrid: ([x = 200, y = 60, cell = 50], o, t, parent) => {
    const g = mk('g', {}, parent), cols = clamp(Math.round(opt(o, 'cols', 8)), 1, 40), rows = clamp(Math.round(opt(o, 'rows', 5)), 1, 30);
    const [sw = 3, sh = 4] = nlist(o.shade || '3,4').map(v => Math.round(v)), W = clamp(sw, 0, cols), H = clamp(sh, 0, rows);
    const ox = x + 34, oy = y + 30;
    if (W && H) wash(g, rectD(ox, oy, W * cell, H * cell), FILL.green);
    line(g, [...Array.from({ length: cols + 1 }, (_, i) => `M${ox + i * cell} ${oy} L${ox + i * cell} ${oy + rows * cell}`),
             ...Array.from({ length: rows + 1 }, (_, j) => `M${ox} ${oy + j * cell} L${ox + cols * cell} ${oy + j * cell}`)].join(' '), '#9aa4ae', 1.6);
    if (W && H) {
      line(g, rectD(ox, oy, W * cell, H * cell), INK.green, 3.6);
      label(g, ox + W * cell / 2, oy - 10, String(W), TXT.green, 24, 'middle');
      label(g, ox - 10, oy + H * cell / 2 + 8, String(H), TXT.green, 24, 'end');
      if (t || showLab(o)) label(g, ox + cols * cell / 2, oy + rows * cell + 36, t || `${W} × ${H} = ${W * H} squares`, TXT.green, 26, 'middle');
    }
    return g;
  },

  // "venn cx cy size sets=2|3 vals=4,2,5 u=U | A,B,C" — overlapping sets; vals fill regions (2: A,AB,B · 3: A,B,C,AB,AC,BC,ABC)
  venn: ([cx = 480, cy = 270, S = 420], o, t, parent) => {
    const g = mk('g', {}, parent), names = t ? words(t) : [], n = +o.sets === 3 || names.length === 3 ? 3 : 2;
    const r = n === 2 ? S * .3 : S * .27;
    const C = n === 2 ? [[cx - r * .6, cy], [cx + r * .6, cy]] : [[cx - r * .58, cy - r * .33], [cx + r * .58, cy - r * .33], [cx, cy + r * .67]];
    const xs = C.map(c => c[0]), ys = C.map(c => c[1]), bx = Math.min(...xs) - r - 26, by = Math.min(...ys) - r - 30, bw = Math.max(...xs) + r + 26 - bx, bh = Math.max(...ys) + r + 22 - by;
    C.forEach((c, i) => wash(g, ring(c[0], c[1], r), PAL[[0, 1, 2][i]], { opacity: .5 }));
    if (o.box !== '0') { line(g, rectD(bx, by, bw, bh), TICK, 2.4); label(g, bx + 10, by + bh - 10, txt(o.u || 'U'), TICK, 22); }
    C.forEach((c, i) => line(g, ring(c[0], c[1], r), PINK[i], 3.2));
    const nm = n === 2 ? [[C[0][0] - r * .55, cy - r - 10, 'end'], [C[1][0] + r * .55, cy - r - 10, 'start']]
      : [[C[0][0] - r * .7, C[0][1] - r * .78, 'end'], [C[1][0] + r * .7, C[1][1] - r * .78, 'start'], [C[2][0] + r * .78, C[2][1] + r * .82, 'start']];
    names.forEach((s, i) => nm[i] && label(g, nm[i][0], nm[i][1], s, PINK[i], 26, nm[i][2]));
    const vals = String(o.vals || '').split(',').filter(s => s !== '');
    const away = (P, Q, d) => { const dx = P[0] - Q[0], dy = P[1] - Q[1], L = Math.hypot(dx, dy) || 1; return [P[0] + dx / L * d, P[1] + dy / L * d]; };
    const mid = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], G = [cx, (ys.reduce((s, v) => s + v, 0)) / ys.length];
    const spots = n === 2 ? [[C[0][0] - r * .5, cy], [cx, cy], [C[1][0] + r * .5, cy]]
      : [away(C[0], G, r * .38), away(C[1], G, r * .38), away(C[2], G, r * .38), away(mid(C[0], C[1]), C[2], r * .3), away(mid(C[0], C[2]), C[1], r * .3), away(mid(C[1], C[2]), C[0], r * .3), G];
    vals.forEach((v, i) => spots[i] && label(g, spots[i][0], spots[i][1] + 10, txt(v), K, 28, 'middle'));
    if (vals.length > spots.length) label(g, bx + bw - 14, by + bh - 12, txt(vals[spots.length]), K, 26, 'end');
    return g;
  },

  // "tally x y height n=13 per=5 sum=1 | Apples" — bundles of five (four strokes + a slash); content is the row name, left of x
  tally: ([x = 260, y = 200, H = 80], o, t, parent) => {
    const g = mk('g', {}, parent), n = Math.max(0, Math.round(opt(o, 'n', 13))), per = Math.max(1, Math.round(opt(o, 'per', 5)));
    const sw = H * .24, gw = 4 * sw + H * .55, groups = Math.ceil(n / 5);
    for (let gi = 0; gi < groups; gi++) {
      const gx = x + (gi % per) * gw, gy = y + Math.floor(gi / per) * H * 1.4, k = Math.min(5, n - gi * 5);
      for (let i = 0; i < Math.min(4, k); i++) line(g, `M${gx + i * sw + 2} ${gy} L${gx + i * sw - 2} ${gy + H}`, K, 3.4);
      if (k === 5) line(g, `M${gx - sw * .5} ${gy + H * .78} L${gx + 3.5 * sw} ${gy + H * .2}`, RED, 3.4);
    }
    if (t) label(g, x - 20, y + H * .62, t, TXT.blue, 26, 'end');
    if (o.sum === '1') { const last = Math.min(groups, per), row = Math.floor(Math.max(0, groups - 1) / per);
      label(g, x + (groups > per ? per : last) * gw + 4, y + row * H * 1.4 + H * .62, `= ${n}`, TXT.orange, 30); }
    return g;
  },

  // "abacus cx cy size vals=3,0,5 num=1 | H,T,O" — one rod per digit (0–9 beads), place names under, number above
  abacus: ([cx = 480, cy = 280, S = 420], o, t, parent) => {
    const g = mk('g', {}, parent), vals = nlist(o.vals || '3,0,5').map(v => clamp(Math.round(v), 0, 9)), m = vals.length;
    const W = S, H = S * .72, x0 = cx - W / 2, y0 = cy - H / 2, bar = 18, sp = W / (m + 1), inner = H - 2 * bar;
    const ry = inner / 2 / 11.5, rx = Math.min(sp * .4, ry * 2.6);
    const names = t ? words(t) : vals.map((_, i) => PLACE1[m - 1 - i] || '');
    for (const d of [rectD(x0, y0, W, bar), rectD(x0, y0 + H - bar, W, bar)]) wash(g, d, '#c89b6d');
    vals.forEach((_, i) => line(g, `M${x0 + sp * (i + 1)} ${y0 + bar} L${x0 + sp * (i + 1)} ${y0 + H - bar}`, '#8a8f96', 2.4));
    vals.forEach((v, i) => { for (let j = 0; j < v; j++) wash(g, ell(x0 + sp * (i + 1), y0 + H - bar - ry - 2 - j * 2 * ry, rx, ry * .92), PAL[i % 8]); });
    line(g, rectD(x0, y0, W, bar) + ' ' + rectD(x0, y0 + H - bar, W, bar), '#6b4423', 3);
    vals.forEach((v, i) => { if (v) line(g, Array.from({ length: v }, (_, j) => ell(x0 + sp * (i + 1), y0 + H - bar - ry - 2 - j * 2 * ry, rx, ry * .92)).join(' '), PINK[i % 8], 2.2); });
    names.forEach((s, i) => i < m && (t || showLab(o)) && label(g, x0 + sp * (i + 1), y0 + H + 30, s, PINK[i % 8], 24, 'middle'));
    if (o.num !== '0') label(g, cx, y0 - 16, vals.join('').replace(/^0+(?=\d)/, ''), TXT.blue, 34, 'middle');
    return g;
  },

  // "counters x y size n=8 a=3 cols=5 frame=1" — n round counters in rows; the first a are red, the rest yellow; frame=1 = ten-frame boxes
  counters: ([x = 240, y = 160, D = 64], o, t, parent) => {
    const g = mk('g', {}, parent), n = clamp(Math.round(opt(o, 'n', 8)), 0, 200), a = clamp(Math.round(opt(o, 'a', n)), 0, n);
    const cols = Math.max(1, Math.round(opt(o, 'cols', 5))), cell = D * 1.25, rows = Math.max(1, Math.ceil(n / cols)), slots = o.frame === '1' ? Math.max(rows, 2) * cols : n;
    const at = i => [x + (i % cols) * cell + cell / 2, y + Math.floor(i / cols) * cell + cell / 2];
    for (let i = 0; i < n; i++) wash(g, ring(...at(i), D / 2), i < a ? FILL.red : FILL.yellow);
    if (o.frame === '1') { const R = Math.ceil(slots / cols);
      line(g, [...Array.from({ length: cols + 1 }, (_, i) => `M${x + i * cell} ${y} L${x + i * cell} ${y + R * cell}`), ...Array.from({ length: R + 1 }, (_, j) => `M${x} ${y + j * cell} L${x + cols * cell} ${y + j * cell}`)].join(' '), K, 2.6); }
    for (let i = 0; i < n; i++) line(g, ring(...at(i), D / 2), i < a ? INK.red : INK.orange, 2.6);
    if (t) label(g, x + cols * cell / 2, y + Math.ceil(slots / cols) * cell + 40, t, TXT.blue, 28, 'middle');
    return g;
  },

  // "placevalue x y w h n=243" — base-ten blocks: hundred flats, ten rods, one cubes, counts written under
  placevalue: ([x = 100, y = 80, w = 760, h = 380], o, t, parent) => {
    const g = mk('g', {}, parent), n = clamp(Math.round(opt(o, 'n', 243)), 0, 999), Hn = Math.floor(n / 100), Tn = Math.floor(n / 10) % 10, On = n % 10;
    const groups = [Hn, Tn, On].filter(Boolean).length || 1, Tw = Tn ? 1.6 * Tn - .6 : 0, Ow = On ? 1.6 * Math.ceil(On / 5) - .6 : 0;
    const fit = fr => { const per = Math.ceil(Hn / fr), Hw = Hn ? 10 * per + .8 * (per - 1) : 0, tall = 10 * fr + .8 * (fr - 1);
      return { fr, per, Hw, tall, u: Math.min((h - 80) / tall, w / (Hw + Tw + Ow + 3 * (groups - 1))) }; };
    const { fr, per, Hw, tall, u } = [fit(1), fit(2)].reduce((a, b) => (b.u > a.u * 1.05 && Hn > 1 ? b : a));
    const total = (Hw + Tw + Ow + 3 * (groups - 1)) * u, base = y + tall * u;
    let cx = x + (w - total) / 2;
    const block = (bx, by, cw, ch, fill, ink) => { wash(g, rectD(bx, by, cw * u, ch * u), fill);
      line(g, [...Array.from({ length: cw - 1 }, (_, i) => `M${bx + (i + 1) * u} ${by} L${bx + (i + 1) * u} ${by + ch * u}`), ...Array.from({ length: ch - 1 }, (_, j) => `M${bx} ${by + (j + 1) * u} L${bx + cw * u} ${by + (j + 1) * u}`)].join(' ') || `M${bx} ${by} l0.1 0`, ink, 1.2, { opacity: .7 });
      line(g, rectD(bx, by, cw * u, ch * u), ink, 2.6); };
    const caption = (gx, gw, v, nm, col) => label(g, gx + gw / 2, base + 34, showLab(o) ? `${v} ${nm}` : String(v), col, 22, 'middle');
    if (Hn) { const gx = cx; for (let i = 0; i < Hn; i++) block(cx + (i % per) * 10.8 * u, base - 10 * u - Math.floor(i / per) * 10.8 * u, 10, 10, FILL.blue, INK.blue); caption(gx, Hw * u, Hn, Hn === 1 ? 'hundred' : 'hundreds', TXT.blue); cx += (Hw + 3) * u; }
    if (Tn) { const gx = cx; for (let i = 0; i < Tn; i++) block(cx + i * 1.6 * u, base - 10 * u, 1, 10, FILL.green, INK.green); caption(gx, Tw * u, Tn, Tn === 1 ? 'ten' : 'tens', TXT.green); cx += (Tw + 3) * u; }
    if (On) { const gx = cx; for (let i = 0; i < On; i++) block(cx + Math.floor(i / 5) * 1.6 * u, base - (i % 5 + 1) * 1.2 * u + .2 * u, 1, 1, FILL.orange, INK.orange); caption(gx, Ow * u, On, On === 1 ? 'one' : 'ones', TXT.orange); }
    label(g, x + w / 2, base + 72, t || `${n} = ${[Hn * 100, Tn * 10, On].filter(Boolean).join(' + ') || 0}`, K, 28, 'middle');
    return g;
  },

  // "eqbalance cx cy size tilt=0 | 2x + 3 = 11" — a pan balance, each side of the equation on a pan; tilt=-1|1 = left|right side heavier
  eqbalance: ([cx = 480, cy = 250, S = 560], o, t, parent) => {
    const g = mk('g', {}, parent), [L = '2x + 3', Rt = '11'] = (t || '2x + 3 = 11').split('=').map(s => s.trim()), tilt = clamp(opt(o, 'tilt', 0), -1, 1);
    const piv = [cx, cy - S * .2], Lb = S * .42, A = tilt * 9 * RAD;
    const El = [piv[0] - Lb * Math.cos(A), piv[1] - Lb * Math.sin(A)], Er = [piv[0] + Lb * Math.cos(A), piv[1] + Lb * Math.sin(A)];
    const baseY = cy + S * .3, pw = S * .3, drop = S * .26;
    wash(g, `M${cx - S * .14} ${baseY} L${cx + S * .14} ${baseY} L${cx + 14} ${piv[1] + 12} L${cx - 14} ${piv[1] + 12} Z`, '#c89b6d');
    line(g, `M${cx - S * .14} ${baseY} L${cx + S * .14} ${baseY} L${cx + 14} ${piv[1] + 12} L${cx - 14} ${piv[1] + 12} Z`, '#6b4423', 3);
    line(g, `M${El.join(' ')} L${Er.join(' ')}`, K, 6);
    [[El, L, 0], [Er, Rt, 1]].forEach(([E, s, i]) => {
      const py = E[1] + drop, fs = 28, bw = Math.max(70, tw(s, fs) + 34), bh = 46;
      line(g, `M${E[0]} ${E[1]} L${E[0] - pw / 2 + 8} ${py} M${E[0]} ${E[1]} L${E[0] + pw / 2 - 8} ${py}`, TICK, 2);
      wash(g, `M${E[0] - pw / 2} ${py} Q${E[0]} ${py + 40} ${E[0] + pw / 2} ${py} Z`, '#b9c3cc');
      line(g, `M${E[0] - pw / 2} ${py} Q${E[0]} ${py + 40} ${E[0] + pw / 2} ${py} Z`, K, 3);
      wash(g, rectD(E[0] - bw / 2, py - bh - 2, bw, bh), i ? '#ffe08a' : '#cfe6f8');
      line(g, rectD(E[0] - bw / 2, py - bh - 2, bw, bh), i ? INK.orange : INK.blue, 2.6);
      label(g, E[0], py - bh / 2 + 7, s, K, fs, 'middle');
    });
    dot(g, ...piv, 7, FILL.yellow, '#6b4423');
    if (!tilt) label(g, cx, piv[1] - 22, '=', RED, 40, 'middle');
    return g;
  },

  // "yearline x y w dates=1903,1969,2012 | first plane,moon landing,rover on Mars" — ticks spaced by real date, labels alternate above/below
  yearline: ([x = 80, y = 280, w = 800], o, t, parent) => {
    const g = mk('g', {}, parent), D = nlist(o.dates || '1903,1969,2012'), names = t ? words(t) : [];
    if (!D.length) throw new Error('yearline: no dates');
    const lo = Math.min(...D), hi = Math.max(...D), pad = (hi - lo || 10) * .08, X = v => x + 20 + (v - lo + pad) / (hi - lo + 2 * pad) * (w - 50);
    arrow(g, x, y, x + w, y, K, 3.4);
    line(g, D.map(v => `M${X(v)} ${y - 12} L${X(v)} ${y + 12}`).join(' '), K, 3);
    const order = D.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
    order.forEach(([v, i], r) => { const up = r % 2 === 0, col = PINK[i % 8];
      dot(g, X(v), y, 7, PAL[i % 8], col);
      label(g, X(v), up ? y + 40 : y - 24, v < 0 ? `${-v} BC` : String(v), K, 22, 'middle');
      if (names[i]) { line(g, `M${X(v)} ${up ? y - 14 : y + 14} L${X(v)} ${up ? y - 44 : y + 46}`, col, 2);
        label(g, X(v), up ? y - 54 : y + 72, names[i], col, 22, 'middle'); } });
    return g;
  },

  // "datatable x y w h | Name,Score;Ali,7;Sara,9" — rows split by ";", cells by ","; first row is the shaded header
  datatable: ([x = 180, y = 80, w = 600, h = 300], o, t, parent) => {
    const g = mk('g', {}, parent), rows = (t || 'Fruit,Count;Apples,6;Pears,4;Plums,9').split(';').map(r => r.split(',').map(s => s.trim()));
    const R = rows.length, C = Math.max(...rows.map(r => r.length)), cw = w / C, rh = h / R;
    const longest = Math.max(...rows.flat().map(s => s.length), 1), fs = Math.min(26, rh * .5, cw / (longest * .55));
    wash(g, rectD(x, y, w, rh), '#cfe6f8');
    line(g, rectD(x, y, w, h), K, 3);
    line(g, [...Array.from({ length: C - 1 }, (_, i) => `M${x + (i + 1) * cw} ${y} L${x + (i + 1) * cw} ${y + h}`), ...Array.from({ length: R - 1 }, (_, j) => `M${x} ${y + (j + 1) * rh} L${x + w} ${y + (j + 1) * rh}`)].join(' ') || `M${x} ${y} l0.1 0`, K, 2.2);
    rows.forEach((r, j) => r.forEach((s, i) => label(g, x + (i + .5) * cw, y + (j + .5) * rh + fs * .35, s, j ? K : INK.blue, fs, 'middle')));
    return g;
  },

  // "percentbar x y w h pct=35 k=bar|grid | label" — a 0–100% bar with tens marks, or a 10×10 hundred square
  percentbar: ([x = 140, y = 200, w = 680, h = 80], o, t, parent) => {
    const g = mk('g', {}, parent), p = clamp(opt(o, 'pct', 35), 0, 100);
    if (o.k === 'grid') {
      const s = Math.min(w, h) / 10, ox = x + (w - 10 * s) / 2, full = Math.floor(p), cell = i => [ox + (i % 10) * s, y + Math.floor(i / 10) * s];
      for (let i = 0; i < Math.ceil(p); i++) { const [cx, cy] = cell(i); wash(g, rectD(cx, cy, s * (i < full ? 1 : p - full), s), FILL.orange); }
      line(g, [...Array.from({ length: 11 }, (_, i) => `M${ox + i * s} ${y} L${ox + i * s} ${y + 10 * s}`), ...Array.from({ length: 11 }, (_, j) => `M${ox} ${y + j * s} L${ox + 10 * s} ${y + j * s}`)].join(' '), K, 1.8);
      label(g, ox + 10 * s + 18, y + 5 * s + 12, t || `${fmt(p)}%`, TXT.orange, 34);
      return g;
    }
    if (p) wash(g, rectD(x, y, w * p / 100, h), FILL.orange);
    line(g, rectD(x, y, w, h), K, 3);
    line(g, Array.from({ length: 9 }, (_, i) => `M${x + w * (i + 1) / 10} ${y + h} L${x + w * (i + 1) / 10} ${y + h - (i === 4 ? h * .5 : h * .25)}`).join(' '), K, 2);
    for (const v of [0, 25, 50, 75, 100]) label(g, x + w * v / 100, y + h + 28, `${v}%`, TICK, 18, 'middle');
    line(g, `M${x + w * p / 100} ${y - 14} L${x + w * p / 100} ${y + h}`, RED, 3);
    label(g, x + w * p / 100, y - 22, t || `${fmt(p)}%`, RED, 30, 'middle');
    return g;
  },

  // "spinner cx cy r vals=1,1,2 at=200 prob=1 | red,blue,green" — sectors sized by weight, pointer at at=deg, P(each) as a fraction
  spinner: ([cx = 480, cy = 270, r = 180], o, t, parent) => {
    const g = mk('g', {}, parent), vals = nlist(o.vals || '1,1,2').filter(v => v > 0), sum = vals.reduce((s, v) => s + v, 0);
    if (!sum) throw new Error('spinner: vals must be positive');
    const names = t ? words(t) : vals.map((_, i) => String(i + 1)); let a = 90; const sl = [];
    for (const v of vals) { const span = v / sum * 360; sl.push([a, a - span, v]); a -= span; }
    sl.forEach(([a0, a1], i) => wash(g, sl.length === 1 ? ring(cx, cy, r) : `M${cx} ${cy} L${pol(cx, cy, r, a0).join(' ')} A${r} ${r} 0 ${a0 - a1 > 180 ? 1 : 0} 1 ${pol(cx, cy, r, a1).join(' ')} Z`, PAL[i % 8]));
    line(g, ring(cx, cy, r) + ` ${ring(cx, cy, r + 8)}`, K, 3);
    if (sl.length > 1) line(g, sl.map(([a0]) => `M${cx} ${cy} L${pol(cx, cy, r, a0).join(' ')}`).join(' '), K, 2.6);
    sl.forEach(([a0, a1, v], i) => { const [lx, ly] = pol(cx, cy, r * .66, (a0 + a1) / 2), fs = clamp(r * .13, 14, 24);
      label(g, lx, ly + (o.prob === '0' ? fs * .35 : -2), names[i] || '', K, fs, 'middle');
      if (o.prob !== '0') label(g, lx, ly + fs + 2, frac(v, sum), PINK[i % 8], fs * .9, 'middle'); });
    const at = opt(o, 'at', 200), tip = pol(cx, cy, r * .82, at), tail = pol(cx, cy, r * .22, at + 180), side = s => pol(cx, cy, r * .07, at + s * 90);
    wash(g, polyD([tip, side(1), tail, side(-1)]), '#5a6470');
    line(g, polyD([tip, side(1), tail, side(-1)]), K, 2.6);
    dot(g, cx, cy, 8, FILL.yellow, K);
    return g;
  },

  // "dice cx cy size vals=3,5 sum=1" — one die per value (1–6 pips), side by side; sum=1 writes the total
  dice: ([cx = 480, cy = 270, S = 150], o, t, parent) => {
    const g = mk('g', {}, parent), vals = nlist(o.vals || '3,5').map(v => clamp(Math.round(v), 1, 6)), gap = S * .45, depth = S * .14;
    const total = vals.length * S + (vals.length - 1) * gap + (o.sum === '1' ? S * .9 : 0);
    const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    vals.forEach((v, i) => {
      const x0 = cx - total / 2 + i * (S + gap), y0 = cy - S / 2 + depth / 2, q = S * .16;
      const front = `M${x0 + q} ${y0} L${x0 + S - q} ${y0} Q${x0 + S} ${y0} ${x0 + S} ${y0 + q} L${x0 + S} ${y0 + S - q} Q${x0 + S} ${y0 + S} ${x0 + S - q} ${y0 + S} L${x0 + q} ${y0 + S} Q${x0} ${y0 + S} ${x0} ${y0 + S - q} L${x0} ${y0 + q} Q${x0} ${y0} ${x0 + q} ${y0} Z`;
      const top = `M${x0 + q * .6} ${y0} L${x0 + depth + q} ${y0 - depth} L${x0 + S + depth - q * .4} ${y0 - depth} L${x0 + S + depth} ${y0 - depth + q * .4} L${x0 + S + depth} ${y0 + S - depth - q} L${x0 + S} ${y0 + S - q * .6}`;
      wash(g, top + ` L${x0 + S} ${y0 + q} Z`, '#d9dee4');
      wash(g, front, '#ffffff');
      line(g, front, K, 3.2);
      line(g, top + ` M${x0 + S - q * .4} ${y0 + q * .4} L${x0 + S + depth - q * .4} ${y0 - depth + q * .4}`, K, 2.6);
      PIPS[v].forEach(([u, w]) => { const px = x0 + S / 2 + u * S * .27, py = y0 + S / 2 + w * S * .27; wash(g, ring(px, py, S * .075), v === 1 ? FILL.red : '#2f3640'); line(g, ring(px, py, S * .075), v === 1 ? INK.red : K, 1.6); });
    });
    if (o.sum === '1') label(g, cx + total / 2 - S * .85, cy + depth / 2 + 14, `= ${vals.reduce((s, v) => s + v, 0)}`, TXT.blue, 40);
    if (t) label(g, cx, cy + S / 2 + depth + 40, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "coinflip cx cy r seq=HTH" — coins showing H (heads) or T (tails), in a row
  coinflip: ([cx = 480, cy = 260, r = 80], o, t, parent) => {
    const g = mk('g', {}, parent), seq = String(o.seq || 'HT').toUpperCase().replace(/[^HT]/g, '').split('').slice(0, 12), gap = r * .45;
    const total = seq.length * 2 * r + (seq.length - 1) * gap;
    seq.forEach((s, i) => { const x = cx - total / 2 + r + i * (2 * r + gap), th = r * .14;
      wash(g, ell(x, cy + th, r, r * .98), '#c99a1a');
      wash(g, ring(x, cy, r), s === 'H' ? '#ffd84a' : '#f3c33b');
      line(g, `M${x - r} ${cy} L${x - r} ${cy + th} A${r} ${r * .98} 0 0 0 ${x + r} ${cy + th} L${x + r} ${cy}`, '#8a6414', 2.6);
      line(g, ring(x, cy, r) + ' ' + ring(x, cy, r * .8), '#8a6414', 2.6);
      label(g, x, cy + r * .36, s, '#8a6414', r, 'middle'); });
    if (t) label(g, cx, cy + r + 50, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "matrix x y cell name=A | 1,2;3,4" — square brackets around rows (";") of entries (",")
  matrix: ([x = 300, y = 140, s = 70], o, t, parent) => {
    const g = mk('g', {}, parent), rows = (t || '1,2;3,4').split(';').map(r => r.split(',').map(v => v.trim().replace(/_/g, ' ')));
    const R = rows.length, C = Math.max(...rows.map(r => r.length)), longest = Math.max(...rows.flat().map(v => v.length)), fs = s * .48;
    const cw = Math.max(s, tw('x'.repeat(longest), fs) + 22), H = R * s, nameW = o.name ? tw(o.name + ' =', fs) + 22 : 0, bx = x + nameW, W = C * cw + 24;
    if (o.name) label(g, x, y + H / 2 + fs * .35, `${txt(o.name)} =`, TXT.blue, fs);
    line(g, `M${bx + 14} ${y} L${bx} ${y} L${bx} ${y + H} L${bx + 14} ${y + H} M${bx + W - 14} ${y} L${bx + W} ${y} L${bx + W} ${y + H} L${bx + W - 14} ${y + H}`, K, 3.4);
    rows.forEach((r, j) => r.forEach((v, i) => label(g, bx + 12 + (i + .5) * cw, y + (j + .5) * s + fs * .35, v, K, fs, 'middle')));
    return g;
  },

  // "vector x y w h v=3,4;-2,1 comp=1 sum=1 | a,b" — arrows from the origin on equal-unit axes, components dashed, length shown
  vector: ([x = 200, y = 40, w = 560, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), V = plist(o.v || '3,4'), names = t ? words(t) : V.length === 1 ? ['v'] : V.map((_, i) => String.fromCharCode(97 + i));
    if (!V.length) throw new Error('vector: no v');
    const S = o.sum === '1' && V.length > 1 ? V.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]) : null, all = [...V, ...(S ? [S] : [])];
    const xr = rangeOf(all.map(p => p[0]), 1), yr = rangeOf(all.map(p => p[1]), 1);
    const f = frame(g, x, y, w, h, xr, yr, { ...o, grid: true, eq: true, unit: Math.max(xr[1] - xr[0], yr[1] - yr[0]) <= 24 });
    const comp = o.comp === '1' || (o.comp !== '0' && V.length === 1);
    V.forEach(([vx, vy], i) => { if (!comp) return;
      dash(g, [[f.X(0), f.Y(0)], [f.X(vx), f.Y(0)], [f.X(vx), f.Y(vy)]], INK.sky, 2.6);
      label(g, f.X(vx / 2), f.Y(0) + (vy >= 0 ? 26 : -12), fmt(vx), TXT.sky, 22, 'middle');
      label(g, f.X(vx) + (vx >= 0 ? 10 : -10), f.Y(vy / 2) + 8, fmt(vy), TXT.sky, 22, vx >= 0 ? 'start' : 'end'); });
    const draw = ([vx, vy], col, nm) => {
      arrow(g, f.X(0), f.Y(0), f.X(vx), f.Y(vy), col, 4, 16);
      const L = Math.hypot(vx, vy), nx = -vy / (L || 1), ny = vx / (L || 1), mx = f.X(vx * .55) - nx * 16, my = f.Y(vy * .55) - ny * 16;
      label(g, mx, my + 8, `|${nm}| = ${fmt(L)}`, col, 22, nx <= 0 ? 'start' : 'end');
      label(g, f.X(vx) + (vx >= 0 ? 8 : -8), f.Y(vy) - 10, `${nm}(${fmt(vx)}, ${fmt(vy)})`, col, 20, vx >= 0 ? 'start' : 'end');
    };
    V.forEach((p, i) => draw(p, [RED, INK.blue, INK.green, INK.orange][i % 4], names[i] || ''));
    if (S) draw(S, '#6a3fa0', names[V.length] || 'sum');
    return g;
  },

  // "slope x y w h pts=1,2;4,8 | y = 2x" — line through two points (or m= b=), run/rise triangle, slope = rise/run
  slope: ([x = 160, y = 40, w = 640, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent);
    let P = plist(o.pts || '');
    if (P.length < 2) { const m = opt(o, 'm', 2), b = opt(o, 'b', 1), x1 = opt(o, 'x1', 1), run = opt(o, 'run', 2); P = [[x1, m * x1 + b], [x1 + run, m * (x1 + run) + b]]; }
    const [[x1, y1], [x2, y2]] = P; if (x1 === x2) throw new Error('slope: the two points share x (vertical line)');
    const m = (y2 - y1) / (x2 - x1), xr = rangeOf([x1, x2], 1), yr = rangeOf([y1, y2], 1), f = frame(g, x, y, w, h, xr, yr, { ...o, grid: true });
    const yAt = v => y1 + m * (v - x1);
    line(g, `M${f.X(xr[0])} ${f.Y(yAt(xr[0]))} L${f.X(xr[1])} ${f.Y(yAt(xr[1]))}`, INK.blue, 4, { 'clip-path': f.clip });
    const run = x2 - x1, rise = y2 - y1;
    wash(g, polyD([[f.X(x1), f.Y(y1)], [f.X(x2), f.Y(y1)], [f.X(x2), f.Y(y2)]]), FILL.yellow, { opacity: .6 });
    line(g, `M${f.X(x1)} ${f.Y(y1)} L${f.X(x2)} ${f.Y(y1)}`, INK.green, 3.4);
    line(g, `M${f.X(x2)} ${f.Y(y1)} L${f.X(x2)} ${f.Y(y2)}`, RED, 3.4);
    label(g, f.X((x1 + x2) / 2), f.Y(y1) + (rise >= 0 ? 28 : -12), showLab(o) ? `run = ${fmt(run)}` : fmt(run), TXT.green, 22, 'middle');
    label(g, f.X(x2) + 12, f.Y((y1 + y2) / 2) + 8 + (Math.abs(f.Y((y1 + y2) / 2) - f.Y(clamp(0, f.yr[0], f.yr[1]))) < 22 ? 26 : 0), showLab(o) ? `rise = ${fmt(rise)}` : fmt(rise), RED, 22, 'start');
    P.forEach(([u, v]) => dot(g, f.X(u), f.Y(v), 7, FILL.blue, INK.blue));
    label(g, f.X(x1) - 10, f.Y(y1) - 12, `(${fmt(x1)}, ${fmt(y1)})`, TXT.blue, 20, 'end');
    label(g, f.X(x2) - 10, f.Y(y2) - 12, `(${fmt(x2)}, ${fmt(y2)})`, TXT.blue, 20, 'end');
    if (t || showLab(o)) label(g, f.px + f.pw - 6, m >= 0 ? f.py + f.ph - 44 : f.py + 10, t || `slope = ${fmt(rise)} ÷ ${fmt(run)} = ${frac(Math.round(rise * 1e6), Math.round(run * 1e6))}`, K, 24, 'end');
    return g;
  },

  // "symmetry cx cy size k=butterfly|house|tree|star|polygon n=5 rot=0" — shape with its dashed mirror line(s)
  symmetry: ([cx = 480, cy = 270, S = 300], o, t, parent) => {
    const g = mk('g', { transform: `rotate(${opt(o, 'rot', 0)} ${cx} ${cy})` }, parent), k = o.k || 'butterfly', s = S / 200;
    const P = (x, y) => `${cx + x * s} ${cy + y * s}`, mir = d => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, a, b) => `${2 * cx - +a} ${b}`);
    let lines = [90];
    if (k === 'star' || k === 'polygon') {
      const n = k === 'star' ? 5 : clamp(Math.round(opt(o, 'n', 5)), 3, 12), V = [];
      for (let i = 0; i < n * (k === 'star' ? 2 : 1); i++) V.push(pol(cx, cy, k === 'star' && i % 2 ? S * .2 : S / 2, 90 + i * 360 / (k === 'star' ? 2 * n : n)));
      wash(g, polyD(V), k === 'star' ? FILL.yellow : PAL[n % 8]); line(g, polyD(V), K, 3.2);
      lines = Array.from({ length: n }, (_, i) => 90 + i * 180 / n);
    } else {
      const half = { // left halves, drawn at cx, mirrored for the right
        butterfly: { fill: '#f4a531', d: `M${P(0, -70)} C${P(-40, -120)} ${P(-100, -100)} ${P(-92, -40)} C${P(-88, -10)} ${P(-40, 0)} ${P(0, 0)} C${P(-50, 10)} ${P(-90, 40)} ${P(-70, 80)} C${P(-50, 110)} ${P(-14, 80)} ${P(0, 50)}`,
          extra: [`M${P(-50, -60)} C${P(-60, -40)} ${P(-40, -30)} ${P(-30, -46)}`, `M${P(-2, -76)} C${P(-10, -100)} ${P(-24, -104)} ${P(-30, -100)}`] },
        house: { fill: '#e04b3a', d: `M${P(0, -95)} L${P(-90, -20)} L${P(-70, -20)} L${P(-70, 85)} L${P(0, 85)}`, extra: [`M${P(-55, 0)} L${P(-25, 0)} L${P(-25, 30)} L${P(-55, 30)} Z`, `M${P(-15, 85)} L${P(-15, 35)} L${P(0, 35)}`] },
        tree: { fill: '#5fae3a', d: `M${P(0, -95)} L${P(-50, -30)} L${P(-30, -30)} L${P(-75, 30)} L${P(-12, 30)} L${P(-12, 85)} L${P(0, 85)}`, extra: [] },
      }[k];
      if (!half) throw new Error(`symmetry: unknown k="${k}"`);
      wash(g, half.d + ' Z', half.fill); wash(g, mir(half.d) + ' Z', half.fill);
      if (k === 'butterfly') { wash(g, `M${P(-6, -60)} L${P(6, -60)} L${P(6, 60)} L${P(-6, 60)} Z`, '#5a4636'); }
      line(g, half.d, K, 3.2); line(g, mir(half.d), K, 3.2);
      half.extra.forEach(d => { line(g, d, K, 2.4); line(g, mir(d), K, 2.4); });
    }
    lines.forEach(a => dash(g, [pol(cx, cy, S * .62, a), pol(cx, cy, S * .62, a + 180)], RED, 3));
    if (t) label(g, cx, cy + S * .62 + 34, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "pythagoras cx cy size a=3 b=4" — right triangle with a square on each side; areas a², b², c² and a² + b² = c²
  pythagoras: ([cx = 470, cy = 250, S = 400], o, t, parent) => {
    const g = mk('g', {}, parent), a = opt(o, 'a', 3), b = opt(o, 'b', 4), c = Math.hypot(a, b);
    const T = [[0, 0], [b, 0], [0, a]];                                   // maths coords: right angle at origin
    const sq = (P, Q, R) => { const ex = Q[0] - P[0], ey = Q[1] - P[1]; let nx = -ey, ny = ex;
      const mx = (P[0] + Q[0]) / 2 - R[0], my = (P[1] + Q[1]) / 2 - R[1]; if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
      return [P, Q, [Q[0] + nx, Q[1] + ny], [P[0] + nx, P[1] + ny]]; };
    const SQ = [sq(T[0], T[2], T[1]), sq(T[0], T[1], T[2]), sq(T[1], T[2], T[0])], all = SQ.flat();
    const mnx = Math.min(...all.map(p => p[0])), mxx = Math.max(...all.map(p => p[0])), mny = Math.min(...all.map(p => p[1])), mxy = Math.max(...all.map(p => p[1]));
    const s = Math.min(S * 1.3 / (mxx - mnx), (S - 40) / (mxy - mny)), M = ([px, py]) => [cx + (px - (mnx + mxx) / 2) * s, cy - 20 - (py - (mny + mxy) / 2) * s];
    const cols = [[FILL.blue, INK.blue], [FILL.green, INK.green], [FILL.orange, INK.orange]], len = [a, b, c];
    SQ.forEach((q, i) => wash(g, polyD(q.map(M)), cols[i][0], { opacity: .75 }));
    wash(g, polyD(T.map(M)), '#ffffff');
    SQ.forEach((q, i) => { const L = len[i], n = Math.round(L);
      if (Math.abs(L - n) < 1e-9 && n > 1 && n <= 12) { const [P, Q, , R] = q, d = [];
        for (let j = 1; j < n; j++) { const u = j / n; d.push(`M${M([P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u]).join(' ')} L${M([R[0] + (q[2][0] - R[0]) * u, R[1] + (q[2][1] - R[1]) * u]).join(' ')}`,
          `M${M([P[0] + (R[0] - P[0]) * u, P[1] + (R[1] - P[1]) * u]).join(' ')} L${M([Q[0] + (q[2][0] - Q[0]) * u, Q[1] + (q[2][1] - Q[1]) * u]).join(' ')}`); }
        line(g, d.join(' '), cols[i][1], 1.3, { opacity: .6 }); }
      line(g, polyD(q.map(M)), cols[i][1], 3); });
    line(g, polyD(T.map(M)), K, 3.6);
    const r0 = M([0, 0]), rm = Math.min(16, a * s * .3, b * s * .3);
    line(g, `M${r0[0] + rm} ${r0[1]} L${r0[0] + rm} ${r0[1] - rm} L${r0[0]} ${r0[1] - rm}`, RED, 2.4);
    const nm = ['a²', 'b²', 'c²'];
    SQ.forEach((q, i) => { const m = M([(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2]), str = `${nm[i]} = ${fmt(len[i] ** 2)}`, fs = clamp(len[i] * s * .85 / (str.length * .5), 12, 30);
      wash(g, rectD(m[0] - tw(str, fs) / 2 - 4, m[1] - fs * .55, tw(str, fs) + 8, fs * 1.1), '#ffffff', { opacity: .8 });
      label(g, m[0], m[1] + fs * .35, str, K, fs, 'middle'); });
    const bottom = Math.max(...all.map(p => M(p)[1]));
    label(g, cx, Math.min(bottom + 40, cy + S / 2 + 20), t || `${fmt(a * a)} + ${fmt(b * b)} = ${fmt(c * c)}`, RED, 28, 'middle');
    return g;
  },

  // "moneygrow x y w h p=100 r=10 n=10 cur=$ simple=1" — coin stacks for each year of compound growth, value = p(1+r%)^year
  moneygrow: ([x = 120, y = 40, w = 720, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), p = opt(o, 'p', 100), r = opt(o, 'r', 10) / 100, n = clamp(Math.round(opt(o, 'n', 10)), 1, 40), cur = txt(o.cur ?? '$');
    const vals = Array.from({ length: n + 1 }, (_, i) => p * (1 + r) ** i), every = Math.ceil((n + 1) / 12);
    const names = vals.map((_, i) => i % every === 0 || i === n ? String(i) : '');
    const f = catFrame(g, x, y, w, h, vals, names, { ...o, pre: cur });
    const cw = f.slot * .62, ry = Math.min(cw * .2, 7), coin = clamp(f.ph / 40, 5, 12);
    vals.forEach((v, i) => { const xc = f.CX(i), top = f.Y(v);
      wash(g, `M${xc - cw / 2} ${top} L${xc - cw / 2} ${f.base} A${cw / 2} ${ry} 0 0 0 ${xc + cw / 2} ${f.base} L${xc + cw / 2} ${top} Z`, '#f3c33b');
      wash(g, ell(xc, top, cw / 2, ry), '#ffe08a'); });
    vals.forEach((v, i) => { const xc = f.CX(i), top = f.Y(v); let d = `M${xc - cw / 2} ${top} L${xc - cw / 2} ${f.base} A${cw / 2} ${ry} 0 0 0 ${xc + cw / 2} ${f.base} L${xc + cw / 2} ${top} ` + ell(xc, top, cw / 2, ry);
      for (let yy = f.base - coin; yy > top + coin * .6; yy -= coin) d += ` M${xc - cw / 2} ${yy} A${cw / 2} ${ry} 0 0 0 ${xc + cw / 2} ${yy}`;
      line(g, d, '#8a6414', 2); });
    if (o.simple === '1') { const sv = i => p * (1 + r * i);
      dash(g, [[f.CX(0), f.Y(sv(0)) - ry], [f.CX(n), f.Y(sv(n)) - ry]], INK.blue, 3);
      if (showLab(o)) label(g, f.px + 16, f.py + (t ? 36 : 6), `- - simple interest: ${cur}${fmt(sv(n))}`, TXT.blue, 20); }
    label(g, f.CX(0), f.Y(vals[0]) - ry - 10, cur + fmt(vals[0]), K, 20, 'middle');
    label(g, f.CX(n) - cw / 2, f.Y(vals[n]) - ry - 10, cur + fmt(vals[n]), RED, 24, 'end');
    if (t) label(g, f.px + 16, f.py + 6, t, TXT.blue, 24);
    return g;
  },
});
})();
