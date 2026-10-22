// Whiteboard calculus, statistics and advanced maths. Every number on the board is computed here from the call
// (quartiles, r, areas, limits, asymptotes, probabilities), never typed in by the model. Functions are written as
// plain expressions (f=x^2-3x, f=sin(x)/x, f=x-y) and read by a small safe parser: no eval.
// The value syntax follows math.js: x=lo,hi ranges, vals=3,5,2 lists, pts=x,y;x,y points, "| text" for names.
(() => {
const K = '#2f3640', SOFT = '#cfd8e0', TICK = '#4a5560', RED = '#c0392b', PURPLE = '#6a3fa0';
const PAL = ['#7fb7ea', '#f4a531', '#5fae3a', '#e04b3a', '#ffd84a', '#b48ad8', '#4fc1b0', '#f08a9a'];
const PINK = ['#2b6cc4', '#c97a10', '#2c6a22', '#c0392b', '#b08a00', '#6a3fa0', '#1f7f72', '#a3324a'];
const RAD = Math.PI / 180, TAU = 2 * Math.PI;

// ── value parsing (same conventions as math.js)
const nlist = s => String(s ?? '').split(',').filter(x => x.trim() !== '').map(Number).filter(Number.isFinite);
const plist = s => String(s ?? '').split(';').filter(Boolean).map(p => p.split(',').map(Number)).filter(p => p.length >= 2 && p.every(Number.isFinite));
const words = s => String(s ?? '').split(',').map(x => x.trim().replace(/_/g, ' '));
const opt = (o, k, d) => (o[k] === undefined || o[k] === '' || !Number.isFinite(+o[k]) ? d : +o[k]);
const txt = s => String(s ?? '').replace(/_/g, ' ');
const fm = (v, d = 2) => { const r = Math.round(v * 10 ** d) / 10 ** d; return (Object.is(r, -0) ? 0 : r).toLocaleString('en-US', { maximumFractionDigits: d }); };
const fmt = v => fm(v, 2);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const showLab = o => o.lab !== '0' && o.labels !== '0';   // lab=0 / labels=0 hide the recipe's own words
const snap = v => { const r = Math.round(v * 1e6) / 1e6; return Math.abs(r - Math.round(r)) < 1e-6 ? Math.round(r) : r; };
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '⁺', n: 'ⁿ', x: 'ˣ', '.': '·' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '-': '₋', '+': '₊', n: 'ₙ', '.': '.' };
const sup = s => [...String(s)].map(c => SUP[c] ?? c).join(''), sub = s => [...String(s)].map(c => SUB[c] ?? c).join('');
const minus = s => String(s).replace(/-/g, '−');

// ── a safe expression reader: numbers, x (or the given variables), + − × ÷ ^, brackets, implicit ×, pi, e,
//    sin cos tan sec csc cot asin acos atan sqrt abs exp ln log floor. compile('x^2-3x')(2) → -2
const FNS = { asin: Math.asin, acos: Math.acos, atan: Math.atan, sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
  sec: v => 1 / Math.cos(v), csc: v => 1 / Math.sin(v), cot: v => 1 / Math.tan(v), abs: Math.abs, exp: Math.exp, ln: Math.log, log: Math.log10, floor: Math.floor };
const CONSTS = { pi: Math.PI, e: Math.E };
const compile = (src, vars = ['x'], who = 'f') => {
  const s = String(src ?? '').toLowerCase().replace(/π/g, 'pi').replace(/θ/g, 't').replace(/\*\*/g, '^').replace(/[−–]/g, '-').replace(/\s+/g, '');
  if (!s) throw new Error(`${who}: missing expression`);
  const names = [...Object.keys(FNS), ...Object.keys(CONSTS), ...vars].sort((a, b) => b.length - a.length);
  let i = 0;
  const bad = () => { throw new Error(`${who}: cannot read "${src}" at "${s.slice(i) || 'the end'}"`); };
  const sum = () => { let L = term(); while (s[i] === '+' || s[i] === '-') { const op = s[i++], R = term(), A = L; L = op === '+' ? e => A(e) + R(e) : e => A(e) - R(e); } return L; };
  const term = () => { let L = unary(); for (;;) { const c = s[i];
    if (c === '*' || c === '/') { i++; const R = unary(), A = L; L = c === '*' ? e => A(e) * R(e) : e => A(e) / R(e); }
    else if (c && /[0-9.a-z(]/.test(c)) { const R = power(), A = L; L = e => A(e) * R(e); }
    else return L; } };
  const unary = () => { if (s[i] === '-') { i++; const A = unary(); return e => -A(e); } if (s[i] === '+') { i++; return unary(); } return power(); };
  const power = () => { const B = atom(); if (s[i] === '^') { i++; const X = unary(); return e => B(e) ** X(e); } return B; };
  const atom = () => {
    if (/[0-9.]/.test(s[i] || '')) { const m = /^\d*\.?\d*/.exec(s.slice(i))[0]; if (m === '.') bad(); i += m.length; const v = +m; return () => v; }
    if (s[i] === '(') { i++; const A = sum(); if (s[i++] !== ')') { i--; bad(); } return A; }
    const nm = names.find(n => s.startsWith(n, i)); if (!nm) bad(); i += nm.length;
    if (nm in FNS) { const F = FNS[nm], A = s[i] === '(' ? atom() : power(); return e => F(A(e)); }
    if (nm in CONSTS) { const v = CONSTS[nm]; return () => v; }
    return e => e[nm];
  };
  const root = sum(); if (i < s.length) bad();
  return v => root(typeof v === 'object' ? v : { [vars[0]]: v });
};
// expression → how it is written on the board: x^2 → x², * → ·, pi → π, sqrt → √
const pretty = s => minus(String(s ?? '').replace(/\*\*/g, '^').replace(/\s+/g, '').replace(/\^\((-?[\dnx])\)|\^(-?\d+|[nx])/g, (_, a, b) => sup(a ?? b))
  .replace(/\*/g, '·').replace(/pi/g, 'π').replace(/sqrt/g, '√').replace(/(?<=[\w)²³¹⁰⁴-⁹π])([+-])/g, ' $1 ').replace(/\bt\b/g, 'θ'));

// ── numerics
const simpson = (F, a, b, n = 2000) => { const h = (b - a) / n; let s = F(a) + F(b); for (let i = 1; i < n; i++) s += F(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
const slopeAt = (F, a, who) => { const h = 1e-5 * Math.max(1, Math.abs(a)), y = F(a), L = (y - F(a - h)) / h, R = (F(a + h) - y) / h, m = (F(a + h) - F(a - h)) / (2 * h);
  if (!Number.isFinite(y) || !Number.isFinite(m)) throw new Error(`${who}: f is not defined at x = ${fmt(a)}`);
  if (Math.abs(L - R) > 1e-3 * Math.max(1, Math.abs(m))) throw new Error(`${who}: f has no single slope at x = ${fmt(a)} (a corner)`);
  return snap(m); };
const erf = z => { const s = Math.sign(z), a = Math.abs(z), t = 1 / (1 + .3275911 * a);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-a * a)); };
const Phi = z => (z === Infinity ? 1 : z === -Infinity ? 0 : .5 * (1 + erf(z / Math.SQRT2)));
const invPhi = p => { // Acklam's rational approximation (error < 1.2e-9)
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239],
    b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
    c = [-.007784894002430293, -.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
    d = [.007784695709041462, .3224671290700398, 2.445134137142996, 3.754408661907416];
  const tail = q => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < .02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - .02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - .5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); };
const median = A => { const m = A.length >> 1; return A.length % 2 ? A[m] : (A[m - 1] + A[m]) / 2; };
// polynomials, highest power first: [1,-1,-2] = x² − x − 2
const pev = (c, x) => c.reduce((s, k) => s * x + k, 0);
const pder = c => c.slice(0, -1).map((v, i) => v * (c.length - 1 - i));
const ptrim = c => { const i = c.findIndex(v => Math.abs(v) > 1e-12); return i < 0 ? [] : c.slice(i); };
const proots = c => { c = ptrim(c); const n = c.length - 1; if (n < 1) return []; if (n === 1) return [snap(-c[1] / c[0])];
  const B = 1 + Math.max(...c.slice(1).map(v => Math.abs(v / c[0]))), tol = 1e-9 * Math.max(...c.map(Math.abs));
  const cps = proots(pder(c)).filter(v => v > -B && v < B), pts = [-B, ...cps, B].sort((a, b) => a - b), out = [];
  for (let i = 0; i < pts.length - 1; i++) { let lo = pts[i], hi = pts[i + 1], flo = pev(c, lo); const fhi = pev(c, hi);
    if (flo * fhi < 0) { for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2, fmv = pev(c, m); if (flo * fmv <= 0) hi = m; else { lo = m; flo = fmv; } } out.push((lo + hi) / 2); } }
  cps.forEach(v => { if (Math.abs(pev(c, v)) < tol) out.push(v); });
  return out.map(snap).sort((a, b) => a - b).filter((v, i, A) => !i || Math.abs(v - A[i - 1]) > 1e-7); };
const pmult = (c, r) => { let k = 0, tol = 1e-7 * Math.max(1, ...c.map(Math.abs)); while (c.length > 1 && Math.abs(pev(c, r)) < tol) { k++; c = pder(c); } return k; };
const pstr = c => { c = ptrim(c); const n = c.length - 1; if (!c.length) return '0';
  return minus(c.map((k, i) => { const p = n - i; if (!k) return ''; const a = Math.abs(k), sg = k < 0 ? '-' : '+';
    const body = (a === 1 && p ? '' : fmt(a)) + (p ? 'x' + (p > 1 ? sup(p) : '') : ''); return ` ${sg} ${body}`; }).join('').trim().replace(/^\+ /, '').replace(/^- /, '-')); };
const linEq = (m, b, v = 'x') => { m = snap(m); b = snap(b); const mt = m === 0 ? '' : m === 1 ? v : m === -1 ? '-' + v : fmt(m) + v;
  return minus(`y = ${mt}${mt && b ? (b < 0 ? ' - ' : ' + ') + fmt(Math.abs(b)) : mt ? '' : fmt(b)}`); };
const piLabel = v => { const r = v / Math.PI; for (let d = 1; d <= 12; d++) { const n = Math.round(r * d);
  if (Math.abs(r * d - n) < 1e-9) { if (!n) return '0'; const g0 = gcd(n, d), N = n / g0, D = d / g0; return minus(`${N === 1 ? '' : N === -1 ? '-' : N}π${D === 1 ? '' : '/' + D}`); } } return fmt(v); };

// ── geometry → path strings (maths angles: 0° = right, counter-clockwise)
const pol = (cx, cy, r, a) => [cx + r * Math.cos(a * RAD), cy - r * Math.sin(a * RAD)];
const arcD = (cx, cy, r, a0, a1) => { const [x0, y0] = pol(cx, cy, r, a0), [x1, y1] = pol(cx, cy, r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${x1} ${y1}`; };
const ring = (cx, cy, r) => `M${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy}`;
const rectD = (x, y, w, h) => `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
const polyD = (pts, close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${(+p[0]).toFixed(2)} ${(+p[1]).toFixed(2)}`).join(' ') + (close ? ' Z' : '');

// ── house layers: wash (watercolour fill) → line (ink) → label
const wash = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...extra }, g);
const dot = (g, x, y, r, fill, ink = K) => { wash(g, ring(x, y, r), fill); line(g, ring(x, y, r), ink, 2.2); };
const hole = (g, x, y, r, ink) => { mk('path', { d: ring(x, y, r), fill: '#fdfdfb' }, g); line(g, ring(x, y, r), ink, 2.6); };
const arrow = (g, x0, y0, x1, y1, col = K, w = 3, h = 13) => { line(g, `M${x0} ${y0} L${x1} ${y1}`, col, w); line(g, head(x1, y1, x0, y0, h), col, w, { class: 'ink head' }); };
// dashes as separate sub-paths: the player animates ink with stroke-dasharray, which would erase a real dash pattern
const dashD = (pts, on = 9, off = 7) => {
  let d = '', phase = 0, pen = true;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0); let u = 0;
    while (u < L - 1e-9) {
      const step = Math.min((pen ? on : off) - phase, L - u), at = s => `${(x0 + (x1 - x0) * s / L).toFixed(2)} ${(y0 + (y1 - y0) * s / L).toFixed(2)}`;
      if (pen) d += `M${at(u)} L${at(u + step)} `;
      u += step; phase += step;
      if (phase >= (pen ? on : off) - 1e-9) { phase = 0; pen = !pen; }
    }
  }
  return d || `M${pts[0][0]} ${pts[0][1]} l0.1 0`;
};
const dash = (g, pts, col = K, w = 2.4, extra) => line(g, dashD(pts), col, w, extra);
const tw = (s, size) => String(s).length * size * 0.5;
const tag = (g, x, y, s, col, size, anchor = 'start') => { const w0 = tw(s, size) + 10, x0 = anchor === 'end' ? x - w0 + 5 : anchor === 'middle' ? x - w0 / 2 : x - 5;
  wash(g, rectD(x0, y - size * .85, w0, size * 1.1), '#ffffff', { opacity: .85 }); label(g, x, y, s, col, size, anchor); };

// ── nice ticks: 1-2-5 steps
const niceStep = (span, n) => { const raw = Math.abs(span || 1) / Math.max(1, n), p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; };
const ticks = (lo, hi, n, s = niceStep(hi - lo, n)) => { const out = [];
  for (let i = Math.ceil(lo / s - 1e-9); i * s <= hi + 1e-9 * Math.abs(s); i++) out.push(+(i * s).toPrecision(12)); return out; };
const niceRange = (lo, hi, n) => { if (!(hi > lo)) { lo -= 1; hi += 1; } const s = niceStep(hi - lo, n);
  return [+(Math.floor(lo / s + 1e-9) * s).toPrecision(12), +(Math.ceil(hi / s - 1e-9) * s).toPrecision(12)]; };
const rangeOf = (vals, pad = 0, withZero = true, n = 6) => niceRange(Math.min(...vals, ...(withZero ? [0] : [])) - pad, Math.max(...vals, ...(withZero ? [0] : [])) + pad, n);

// ── a value frame (the math.js frame, plus xstep/xfmt for π ticks)
const frame = (g, x, y, w, h, xr, yr, o = {}) => {
  const px = x + 46, py = y + 22, pw = w - 46 - 30, ph = h - 22 - 38;
  if (o.eq) {
    const s = Math.max((xr[1] - xr[0]) / pw, (yr[1] - yr[0]) / ph), mx = (xr[0] + xr[1]) / 2, my = (yr[0] + yr[1]) / 2;
    xr = [mx - s * pw / 2, mx + s * pw / 2]; yr = [my - s * ph / 2, my + s * ph / 2];
  }
  const X = v => px + (v - xr[0]) / (xr[1] - xr[0]) * pw, Y = v => py + ph - (v - yr[0]) / (yr[1] - yr[0]) * ph;
  const ox = clamp(0, xr[0], xr[1]), oy = clamp(0, yr[0], yr[1]), xf = o.xfmt || fmt;
  const xs = ticks(xr[0], xr[1], 0, o.xstep || (o.unit ? 1 : niceStep(xr[1] - xr[0], Math.max(2, Math.round(pw / 70)))));
  const ys = ticks(yr[0], yr[1], 0, o.unit ? 1 : niceStep(yr[1] - yr[0], Math.max(2, Math.round(ph / 50))));
  if (o.grid) line(g, [...xs.map(v => `M${X(v)} ${py} L${X(v)} ${py + ph}`), ...ys.map(v => `M${px} ${Y(v)} L${px + pw} ${Y(v)}`)].join(' '), SOFT, 1.5);
  arrow(g, px, Y(oy), px + pw + 16, Y(oy), K, 3);
  arrow(g, X(ox), py + ph, X(ox), py - 16, K, 3);
  line(g, [...xs.map(v => `M${X(v)} ${Y(oy) - 5} L${X(v)} ${Y(oy) + 5}`), ...ys.map(v => `M${X(ox) - 5} ${Y(v)} L${X(ox) + 5} ${Y(v)}`)].join(' '), K, 2);
  const longest = Math.max(...xs.map(v => xf(v).length)), xEvery = Math.max(1, Math.ceil(Math.max(30, longest * 10) / Math.max(1, (X(xs[1] ?? xs[0]) - X(xs[0])) || 99)));
  const skipX = yr[0] < oy, skipY = xr[0] < ox;
  xs.forEach((v, i) => { if ((skipX && v === ox) || i % xEvery) return; label(g, X(v), Y(oy) + 24, xf(v), TICK, 18, 'middle'); });
  ys.forEach(v => { if (skipY && v === oy) return; label(g, X(ox) - 9, Y(v) + 6, fmt(v), TICK, 18, 'end'); });
  if (skipX && skipY) label(g, X(ox) - 7, Y(oy) + 21, '0', TICK, 18, 'end');
  if (o.xl) label(g, px + pw + 16, Y(oy) - 12, txt(o.xl), TXT.blue, 22, 'end');
  if (o.yl) label(g, X(ox) + 12, py - 2, txt(o.yl), TXT.blue, 22, 'start');
  const id = 'calcC' + clipN++;
  mk('clipPath', { id }, g).append(mk('rect', { x: px - 4, y: py - 4, width: pw + 8, height: ph + 8 }));
  const axisPts = [...Array.from({ length: 40 }, (_, i) => [px + pw * i / 39, Y(oy)]), ...Array.from({ length: 40 }, (_, i) => [X(ox), py + ph * i / 39])];
  return { X, Y, px, py, pw, ph, xr, yr, ax: X(ox), ay: Y(oy), clip: `url(#${id})`, scr: axisPts };
};
// a function's curve inside a frame; breaks the pen at gaps and jumps (asymptotes, steps). Adds its points to f.scr.
const curveD = (F, f, lo = f.xr[0], hi = f.xr[1], N = 600) => {
  const span = f.yr[1] - f.yr[0]; let d = '', pen = false, prev;
  for (let i = 0; i <= N; i++) { const u = lo + (hi - lo) * i / N, v = F(u), ok = Number.isFinite(v) && v > f.yr[0] - span && v < f.yr[1] + span;
    if (ok && pen && Math.abs(v - prev) > span * .9) pen = false;
    if (ok) { d += `${pen ? 'L' : 'M'}${f.X(u).toFixed(2)} ${f.Y(v).toFixed(2)} `; pen = true; prev = v; if (i % 4 === 0) f.scr.push([f.X(u), f.Y(v)]); } else pen = false; }
  return d || `M${f.px} ${f.py} l0.1 0`;
};
const fcurve = (g, F, f, col, w = 4, lo, hi) => line(g, curveD(F, f, lo, hi), col, w, { 'clip-path': f.clip });
// y range that shows a function: ignores blow-ups near asymptotes (values beyond 6 IQRs of the median)
const fnRange = (F, xr, extra = [], who = 'f') => {
  const v = []; for (let i = 0; i <= 300; i++) { const y = F(xr[0] + (xr[1] - xr[0]) * i / 300); if (Number.isFinite(y)) v.push(y); }
  if (!v.length) throw new Error(`${who}: f has no values for x in ${fmt(xr[0])} to ${fmt(xr[1])}`);
  const s = [...v].sort((a, b) => a - b), q1 = s[Math.floor(s.length * .25)], q3 = s[Math.floor(s.length * .75)], m = s[s.length >> 1], k = Math.max(q3 - q1, 1) * 6;
  const keep = [...s.filter(y => Math.abs(y - m) <= k), ...extra.filter(Number.isFinite)], lo = Math.min(...keep), hi = Math.max(...keep), pad = (hi - lo || 1) * .08;
  return rangeOf([lo - pad, hi + pad]);
};
// a text block in the frame corner with the fewest curve points under it
const block = (g, f, rows, size = 22) => {
  rows = rows.filter(Boolean); if (!rows.length) return;
  const lh = size + 9, bw = Math.max(...rows.map(r => tw(r[0], size))) + 18, bh = rows.length * lh + 10;
  // clear of the y-axis numbers on the left and the x-axis numbers at the bottom
  const lx = f.ax > f.px + 20 && f.ax < f.px + f.pw * .45 ? f.ax + 16 : f.px + 14, low = f.ay > f.py + f.ph * .7 && f.ay < f.py + f.ph - 20 ? f.ay - bh - 14 : f.py + f.ph - bh - 30;
  const spots = [[lx, f.py + 2, 'start'], [f.px + f.pw - 4, f.py + 2, 'end'], [lx, low, 'start'], [f.px + f.pw - 4, low, 'end']];
  const box = ([sx, sy, an]) => [an === 'end' ? sx - bw + 6 : sx - 8, sy];
  const hits = s => { const [x0, y0] = box(s); return f.scr.filter(([X, Y]) => X > x0 && X < x0 + bw && Y > y0 && Y < y0 + bh).length; };
  const best = spots.reduce((b, c) => (hits(c) < hits(b) ? c : b)), [bx, by] = box(best);
  wash(g, rectD(bx, by, bw, bh), '#ffffff', { opacity: .85 });
  rows.forEach(([s, c], i) => label(g, best[0], by + 4 + (i + 1) * lh - 8, s, c || K, size, best[2]));
};
const sampleF = (F, f, lo = f.xr[0], hi = f.xr[1]) => { for (let i = 0; i <= 150; i++) { const u = lo + (hi - lo) * i / 150, v = F(u); if (Number.isFinite(v)) f.scr.push([f.X(u), f.Y(v)]); } };

// equal-width bins over values: [a, b) and the last bin closed
const binsOf = (V, o, who) => {
  const mn = Math.min(...V), mx = Math.max(...V), bw = o.width !== undefined ? opt(o, 'width', NaN) : niceStep(mx - mn || 1, opt(o, 'bins', Math.ceil(Math.log2(V.length) + 1)));
  if (!(bw > 0)) throw new Error(`${who}: width must be above 0`);
  const start = +(Math.floor(mn / bw + 1e-9) * bw).toPrecision(12), nb = Math.max(1, Math.ceil((mx - start) / bw - 1e-9));
  if (nb > 40) throw new Error(`${who}: ${nb} bins is too many, give a bigger width=`);
  const E = Array.from({ length: nb + 1 }, (_, i) => +(start + i * bw).toPrecision(12)), F = Array(nb).fill(0);
  V.forEach(v => F[Math.min(nb - 1, Math.floor((v - start) / bw + 1e-9))]++);
  return [E, F];
};

// exact fractions for probability trees: "3/5", "0.35", "1"
const qOf = s => { const m = /^(\d+)\/(\d+)$/.exec(s); if (m) { if (!+m[2]) throw new Error(`probtree: ${s} divides by 0`); return [+m[1], +m[2], true]; }
  if (!/^\d*\.?\d+$/.test(s)) throw new Error(`probtree: "${s}" is not a probability`);
  const dp = (s.split('.')[1] || '').length; return [Math.round(+s * 10 ** dp), 10 ** dp, false]; };
const qRed = ([n, d, f]) => { const k = gcd(n, d) || 1; return [n / k, d / k, f]; };
const qStr = ([n, d, f]) => (f ? (d === 1 ? String(n) : `${n}/${d}`) : fm(n / d, 4));

const COS_REF = { 0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0' }, TANS = { 0: '0', 30: '√3/3', 45: '1', 60: '√3', 90: 'undefined' };

Object.assign(window.RECIPES, {
  // "normal x y w h mean=0 sd=1 from=-1 to=1" — bell curve, σ ticks, area between from and to shaded and computed
  normal: ([x = 120, y = 40, w = 720, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), mu = opt(o, 'mean', 0), sd = opt(o, 'sd', 1);
    if (!(sd > 0)) throw new Error('normal: sd must be above 0');
    const a = o.from === undefined ? -Infinity : opt(o, 'from', NaN), b = o.to === undefined ? Infinity : opt(o, 'to', NaN);
    if (Number.isNaN(a) || Number.isNaN(b)) throw new Error('normal: from and to must be numbers');
    if (a >= b) throw new Error('normal: from must be below to');
    const lo = mu - 4 * sd, hi = mu + 4 * sd, px = x + 20, pw = w - 40, base = y + h - 86, top = y + 66;
    const X = v => px + (v - lo) / (hi - lo) * pw, Y = v => base - Math.exp(-(((v - mu) / sd) ** 2) / 2) * (base - top);
    const shade = o.from !== undefined || o.to !== undefined, s0 = Math.max(a, lo), s1 = Math.min(b, hi);
    if (shade && s1 > s0) wash(g, polyD([[X(s0), base], ...Array.from({ length: 121 }, (_, i) => { const v = s0 + (s1 - s0) * i / 120; return [X(v), Y(v)]; }), [X(s1), base]]), FILL.blue, { opacity: .75 });
    line(g, `M${px - 10} ${base} L${px + pw + 10} ${base}`, K, 3);
    line(g, polyD(Array.from({ length: 241 }, (_, i) => { const v = lo + (hi - lo) * i / 240; return [X(v), Y(v)]; }), false), INK.blue, 4);
    dash(g, [[X(mu), base], [X(mu), Y(mu)]], TICK, 2);
    const marks = [a, b].filter(v => Number.isFinite(v) && v >= lo && v <= hi);
    line(g, [-3, -2, -1, 0, 1, 2, 3].map(k => `M${X(mu + k * sd)} ${base - 6} L${X(mu + k * sd)} ${base + 6}`).join(' '), K, 2);
    [-3, -2, -1, 0, 1, 2, 3].forEach(k => { const v = mu + k * sd;
      if (!marks.some(m => Math.abs(X(m) - X(v)) < 34)) label(g, X(v), base + 26, fmt(v), TICK, 18, 'middle');
      label(g, X(v), base + 50, k ? minus(`${k}σ`) : 'μ', TXT.sky, 16, 'middle'); });
    marks.forEach(m => { line(g, `M${X(m)} ${base} L${X(m)} ${Y(m)}`, RED, 3); label(g, X(m), base + 26, fmt(m), RED, 20, 'middle'); });
    if (shade) { const p = Phi((b - mu) / sd) - Phi((a - mu) / sd);
      const what = `${Number.isFinite(a) ? fmt(a) + ' < ' : ''}X${Number.isFinite(b) ? ' < ' + fmt(b) : ''}`;
if (showLab(o)) label(g, x + w / 2, y + 30, minus(`P(${what}) = ${p.toFixed(4)} ≈ ${fm(p * 100, 1)}%`), RED, 26, 'middle'); }
    if (t || showLab(o)) label(g, x + w / 2, base + 80, t || minus(`mean μ = ${fmt(mu)}, standard deviation σ = ${fmt(sd)}`), TXT.blue, 20, 'middle');
    return g;
  },

  // "histogram x y w h vals=… bins=5 width= hi= xl= yl= | label" — equal bins [a, b), bars touching, counts on bars
  histogram: ([x = 140, y = 40, w = 680, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), V = nlist(o.vals || '12,15,18,22,23,25,27,28,31,33,34,36,38,41,45,47,52');
    if (V.length < 2) throw new Error('histogram: needs at least 2 vals');
    const [E, F] = binsOf(V, o, 'histogram'), px = x + 56, py = y + 34, pw = w - 56 - 20, ph = h - 34 - 64;
    const mxF = Math.max(...F), st = Math.max(1, niceStep(mxF, Math.max(2, Math.round(ph / 55)))), top = Math.ceil(mxF / st) * st;
    const X = v => px + 10 + (v - E[0]) / (E.at(-1) - E[0]) * (pw - 20), Y = v => py + ph - v / top * ph;
    const ys = ticks(0, top, 0, st);
    line(g, ys.filter(v => v).map(v => `M${px} ${Y(v)} L${px + pw} ${Y(v)}`).join(' ') || `M${px} ${py} l0.1 0`, SOFT, 1.4);
    F.forEach((c, i) => c && wash(g, rectD(X(E[i]), Y(c), X(E[i + 1]) - X(E[i]), Y(0) - Y(c)), +o.hi === i + 1 ? FILL.red : FILL.blue));
    line(g, `M${px} ${py + ph} L${px} ${py - 14} M${px} ${py + ph} L${px + pw} ${py + ph}`, K, 3);
    line(g, ys.map(v => `M${px - 5} ${Y(v)} L${px} ${Y(v)}`).join(' '), K, 2);
    ys.forEach(v => label(g, px - 9, Y(v) + 6, fmt(v), TICK, 17, 'end'));
    line(g, F.map((c, i) => c ? `M${X(E[i])} ${Y(0)} L${X(E[i])} ${Y(c)} L${X(E[i + 1])} ${Y(c)} L${X(E[i + 1])} ${Y(0)}` : '').join(' ') || `M${px} ${py} l0.1 0`, INK.blue, 3);
    const bwPx = X(E[1]) - X(E[0]), vs = clamp(bwPx * .4, 12, 20);
    F.forEach((c, i) => label(g, (X(E[i]) + X(E[i + 1])) / 2, Y(c) - 8, String(c), K, vs, 'middle'));
    const every = Math.max(1, Math.ceil(Math.max(...E.map(e => fmt(e).length)) * 10 / bwPx));
    E.forEach((e, i) => i % every === 0 && label(g, X(e), py + ph + 24, fmt(e), TICK, 17, 'middle'));
    if (o.yl || showLab(o)) label(g, px + 8, py - 10, txt(o.yl || 'frequency'), TXT.blue, 20);
    if (o.xl) label(g, px + pw / 2, py + ph + 54, txt(o.xl), TXT.blue, 20, 'middle');
    if (t || showLab(o)) label(g, px + pw, py - 10, t || `n = ${V.length}, bin width ${fmt(E[1] - E[0])}`, TXT.blue, 20, 'end');
    return g;
  },

  // "boxplot x y w vals=… | label" — five-number summary computed (quartiles = medians of the halves), 1.5·IQR outliers
  boxplot: ([x = 100, y = 220, w = 760], o, t, parent) => {
    const g = mk('g', {}, parent), S = nlist(o.vals || '3,7,8,5,12,14,21,13,18,9,10,35').sort((a, b) => a - b), n = S.length;
    if (n < 3) throw new Error('boxplot: needs at least 3 vals');
    const Q1 = median(S.slice(0, n >> 1)), Q2 = median(S), Q3 = median(S.slice(Math.ceil(n / 2))), iqr = Q3 - Q1;
    const out = S.filter(v => v < Q1 - 1.5 * iqr || v > Q3 + 1.5 * iqr), inn = S.filter(v => !out.includes(v)), lo = inn[0], hi = inn.at(-1);
    const [r0, r1] = niceRange(S[0], S.at(-1), Math.round(w / 70)), X = v => x + 20 + (v - r0) / (r1 - r0) * (w - 40), ly = y + 110, bt = y, bb = y + 70, my = y + 35;
    wash(g, rectD(X(Q1), bt, X(Q3) - X(Q1), bb - bt), FILL.blue, { opacity: .7 });
    line(g, `M${x} ${ly} L${x + w} ${ly}`, K, 3);
    const tk = ticks(r0, r1, 0, niceStep(r1 - r0, Math.round(w / 70)));
    line(g, tk.map(v => `M${X(v)} ${ly - 6} L${X(v)} ${ly + 6}`).join(' '), K, 2);
    tk.forEach(v => label(g, X(v), ly + 28, fmt(v), TICK, 18, 'middle'));
    line(g, rectD(X(Q1), bt, X(Q3) - X(Q1), bb - bt), INK.blue, 3.4);
    line(g, `M${X(lo)} ${my} L${X(Q1)} ${my} M${X(Q3)} ${my} L${X(hi)} ${my} M${X(lo)} ${bt + 16} L${X(lo)} ${bb - 16} M${X(hi)} ${bt + 16} L${X(hi)} ${bb - 16}`, K, 3);
    line(g, `M${X(Q2)} ${bt} L${X(Q2)} ${bb}`, RED, 4);
    out.forEach(v => hole(g, X(v), my, 7, RED));
    const five = [['min', lo], ['Q1', Q1], ['median', Q2], ['Q3', Q3], ['max', hi]]; let lvl = 0, prev = -1e9;
    five.forEach(([nm, v]) => { lvl = X(v) - prev < 64 && !lvl ? 1 : 0; prev = X(v); const yy = bt - 12 - lvl * 46;
      label(g, X(v), yy, fmt(v), nm === 'median' ? RED : K, 20, 'middle'); if (showLab(o)) label(g, X(v), yy - 22, nm, nm === 'median' ? RED : TXT.blue, 17, 'middle'); });
    if (showLab(o)) label(g, x + w / 2, ly + 66, `n = ${n} · IQR = ${fmt(Q3)} − ${fmt(Q1)} = ${fmt(iqr)}${out.length ? ` · outliers: ${out.map(fmt).join(', ')}` : ''}`, TXT.blue, 20, 'middle');
    if (t) label(g, x + w / 2, bt - 110, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "dotplot x y w vals=… | label" — one dot per value stacked over a number line; n, mean, median, mode
  dotplot: ([x = 100, y = 380, w = 760], o, t, parent) => {
    const g = mk('g', {}, parent), V = nlist(o.vals || '2,3,3,4,4,4,5,5,5,5,6,6,7,9');
    if (!V.length) throw new Error('dotplot: no vals');
    const C = new Map(); V.forEach(v => { const k = snap(v); C.set(k, (C.get(k) || 0) + 1); });
    const keys = [...C.keys()].sort((a, b) => a - b), mn = keys[0], mx = keys.at(-1), ints = V.every(Number.isInteger);
    const st = ints && mx - mn <= 24 ? 1 : niceStep(mx - mn || 1, Math.round(w / 70)), r0 = Math.floor(mn / st) * st - (ints ? 1 : 0) * st, r1 = Math.ceil(mx / st) * st + (ints ? 1 : 0) * st;
    const X = v => x + 20 + (v - r0) / ((r1 - r0) || 1) * (w - 40), gap = Math.min(...keys.slice(1).map((k, i) => X(k) - X(keys[i])), X(r0 + st) - X(r0));
    const most = Math.max(...C.values()), r = clamp(Math.min(gap * .42, (y - 70) / (most * 2.15)), 4, 16);
    line(g, `M${x} ${y} L${x + w} ${y}`, K, 3);
    const tk = ticks(r0, r1, 0, st), every = Math.max(1, Math.ceil(28 / (X(r0 + st) - X(r0))));
    line(g, tk.map(v => `M${X(v)} ${y - 6} L${X(v)} ${y + 6}`).join(' '), K, 2);
    tk.forEach((v, i) => i % every === 0 && label(g, X(v), y + 28, fmt(v), TICK, 18, 'middle'));
    keys.forEach(k => { for (let j = 0; j < C.get(k); j++) dot(g, X(k), y - 8 - r - j * 2.15 * r, r, FILL.orange, INK.orange); });
    const S = [...V].sort((a, b) => a - b), mean = V.reduce((s, v) => s + v, 0) / V.length, modes = keys.filter(k => C.get(k) === most);
    if (showLab(o)) label(g, x + w / 2, y + 66, `n = ${V.length} · mean = ${fmt(mean)} · median = ${fmt(median(S))} · mode = ${most > 1 && modes.length <= 3 ? modes.map(fmt).join(', ') : 'none'}`, TXT.blue, 20, 'middle');
    if (t) label(g, x + w / 2, y + 98, t, TXT.blue, 22, 'middle');
    return g;
  },

  // "stemleaf x y vals=… leaf=1 | label" — stem-and-leaf table, leaves sorted, empty stems kept, key
  stemleaf: ([x = 300, y = 80], o, t, parent) => {
    const g = mk('g', {}, parent), V = nlist(o.vals || '12,15,21,24,24,28,31,33,35,35,39,42,47,50,56'), lf = opt(o, 'leaf', 1);
    if (!V.length) throw new Error('stemleaf: no vals');
    if (!(lf > 0)) throw new Error('stemleaf: leaf must be above 0');
    if (V.some(v => v < 0)) throw new Error('stemleaf: negative values are not supported');
    const U = V.map(v => { const L = Math.round(v / lf); if (Math.abs(v / lf - L) > 1e-6) throw new Error(`stemleaf: ${v} has more digits than leaf=${lf} shows`); return L; }).sort((a, b) => a - b);
    const s0 = Math.floor(U[0] / 10), s1 = Math.floor(U.at(-1) / 10);
    if (s1 - s0 > 13) throw new Error('stemleaf: more than 14 stems, use a bigger leaf=');
    const rows = Array.from({ length: s1 - s0 + 1 }, (_, i) => [s0 + i, U.filter(u => Math.floor(u / 10) === s0 + i).map(u => u % 10)]);
    const lh = clamp(380 / rows.length, 30, 42), fs = clamp(lh * .7, 20, 28), sp = fs * .9, sx = x + 70, lx = x + 100, wide = Math.max(4, ...rows.map(r => r[1].length));
    if (t) label(g, x + 50, y - 34, t, TXT.blue, 24, 'start');
    if (showLab(o)) { label(g, sx, y, 'stem', TXT.blue, 22, 'end'); label(g, lx, y, 'leaf', TXT.blue, 22, 'start'); }
    line(g, `M${x} ${y + 12} L${lx + wide * sp + 10} ${y + 12} M${sx + 15} ${y - 22} L${sx + 15} ${y + 18 + rows.length * lh}`, K, 3);
    rows.forEach(([s, L], i) => { const yy = y + 12 + (i + 1) * lh - lh * .28;
      label(g, sx, yy, String(s), K, fs, 'end'); L.forEach((d, j) => label(g, lx + j * sp, yy, String(d), INK.blue, fs, 'start')); });
    const k0 = U[0];
    if (showLab(o)) label(g, x, y + 46 + rows.length * lh, `key: ${Math.floor(k0 / 10)} | ${k0 % 10} = ${fmt(k0 * lf)}   ·   n = ${V.length}`, TXT.orange, 20, 'start');
    return g;
  },

  // "cumfreq x y w h edges=0,10,20,30 freq=4,9,6 q=1 xl= | label" — ogive through class ends; median (and quartiles) read off
  cumfreq: ([x = 140, y = 40, w = 680, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent); let E, F;
    if (o.edges) { E = nlist(o.edges); F = nlist(o.freq);
      if (F.length !== E.length - 1) throw new Error('cumfreq: freq needs one number per class (one fewer than edges)');
      if (E.some((v, i) => i && v <= E[i - 1])) throw new Error('cumfreq: edges must go up');
      if (F.some(v => v < 0)) throw new Error('cumfreq: freq cannot be negative');
    } else [E, F] = binsOf(nlist(o.vals || '12,15,18,22,23,25,27,28,31,33,34,36,38,41,45,47,52,55'), o, 'cumfreq');
    const cum = F.reduce((a, v) => [...a, a.at(-1) + v], [0]), N = cum.at(-1);
    if (!N) throw new Error('cumfreq: total frequency is 0');
    const f = frame(g, x, y, w, h, [E[0], E.at(-1)], [0, niceRange(0, N, 6)[1]], { grid: true, xl: o.xl, yl: o.yl || (showLab(o) ? 'cumulative frequency' : '') });
    const P = E.map((e, i) => [f.X(e), f.Y(cum[i])]); f.scr.push(...P);
    line(g, polyD(P, false), INK.blue, 4);
    P.forEach(([u, v]) => dot(g, u, v, 5.5, '#ffffff', INK.blue));
    const at = q => { const i = cum.findIndex(c => c >= q); if (i <= 0) return E[0]; return E[i - 1] + (q - cum[i - 1]) / (cum[i] - cum[i - 1]) * (E[i] - E[i - 1]); };
    const marks = [['median', N / 2, RED, 2], ...(o.q === '1' ? [['Q1', N / 4, INK.green, 1], ['Q3', 3 * N / 4, INK.green, 3]] : [])];
    marks.forEach(([nm, q, col, lv]) => { const v = at(q);
      dash(g, [[f.X(E[0]), f.Y(q)], [f.X(v), f.Y(q)], [f.X(v), f.Y(0)]], col, 2.6);
      if (showLab(o)) label(g, f.X(v) + 6, f.Y(0) - 10 - (lv - 1) * 24, `${nm} ≈ ${fmt(v)}`, col, 20, 'start'); });
    const rows = [[t || `n = ${fmt(N)}`, TXT.blue], ...marks.map(([nm, q, col]) => [`${nm} at ${fmt(q)} → ${fmt(at(q))}`, col])];
    if (o.q === '1') rows.push([`IQR ≈ ${fmt(at(3 * N / 4) - at(N / 4))}`, INK.green]);
    block(g, f, showLab(o) ? rows : [t && [t, TXT.blue]], 20);
    return g;
  },

  // "correl x y w h pts=x,y;x,y resid=1 xl= yl= | label" — scatter, least-squares line, r computed and named
  correl: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), P = plist(o.pts || '1,52;2,55;3,61;4,60;5,68;6,70;7,74;8,79');
    if (P.length < 3) throw new Error('correl: needs at least 3 pts');
    const n = P.length, mx = P.reduce((s, p) => s + p[0], 0) / n, my = P.reduce((s, p) => s + p[1], 0) / n;
    const sxx = P.reduce((s, p) => s + (p[0] - mx) ** 2, 0), syy = P.reduce((s, p) => s + (p[1] - my) ** 2, 0), sxy = P.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
    if (!sxx || !syy) throw new Error('correl: the points need spread in both x and y');
    const r = sxy / Math.sqrt(sxx * syy), m = sxy / sxx, b0 = my - m * mx;
    const xr = o.x ? nlist(o.x) : rangeOf(P.map(p => p[0]), 0, P.some(p => p[0] <= 0)), yr = o.y ? nlist(o.y) : rangeOf(P.map(p => p[1]), 0, P.some(p => p[1] <= 0));
    const f = frame(g, x, y, w, h, xr, yr, o);
    if (o.resid === '1') P.forEach(([u, v]) => dash(g, [[f.X(u), f.Y(v)], [f.X(u), f.Y(m * u + b0)]], INK.orange, 2, { 'clip-path': f.clip }));
    line(g, `M${f.X(xr[0])} ${f.Y(m * xr[0] + b0)} L${f.X(xr[1])} ${f.Y(m * xr[1] + b0)}`, RED, 3.5, { 'clip-path': f.clip });
    sampleF(v => m * v + b0, f);
    P.forEach(([u, v]) => { dot(g, f.X(u), f.Y(v), 7, FILL.blue, INK.blue); f.scr.push([f.X(u), f.Y(v)]); });
    const a = Math.abs(r), word = a >= .8 ? 'strong' : a >= .5 ? 'moderate' : a >= .3 ? 'weak' : 'no clear';
    block(g, f, showLab(o) ? [t && [t, TXT.blue], [minus(`r = ${r.toFixed(3)}`), RED], [`${word} ${a < .3 ? 'correlation' : r > 0 ? 'positive' : 'negative'}`, RED], [`best fit: ${linEq(+m.toFixed(3), +b0.toFixed(3))}`, K]] : [t && [t, TXT.blue]], 22);
    return g;
  },

  // "probtree x y w h | Rain:0.3(Late:0.6,On_time:0.4),Dry:0.7(Late:0.1,On_time:0.9)" — branches with p, outcome products
  //   "A:1/2,B:1/2;C:1/3,D:2/3" = the same second level after every branch. Each group must add to 1.
  probtree: ([x = 80, y = 40, w = 800, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), src = String(t || 'Red:3/5(Red:2/4,Blue:2/4),Blue:2/5(Red:3/4,Blue:1/4)');
    const parseList = s => { let i = 0; const list = () => { const out = [];
      for (;;) { const m = /^\s*([^:,();]+?)\s*:\s*([\d./]+)\s*/.exec(s.slice(i));
        if (!m) throw new Error(`probtree: cannot read "${s.slice(i)}" (want Name:p, e.g. Rain:0.3)`);
        i += m[0].length; const nd = { name: m[1].replace(/_/g, ' '), q: qOf(m[2]), kids: [] };
        if (s[i] === '(') { i++; nd.kids = list(); if (s[i++] !== ')') throw new Error('probtree: a "(" is not closed'); }
        out.push(nd); while (s[i] === ' ') i++; if (s[i] === ',') { i++; continue; } return out; } };
      const r = list(); if (i < s.length) throw new Error(`probtree: cannot read "${s.slice(i)}"`); return r; };
    const levels = src.split(';').map(parseList), clone = L => L.map(n => ({ ...n, kids: clone(n.kids) }));
    const leavesOf = L => L.flatMap(n => (n.kids.length ? leavesOf(n.kids) : [n]));
    const root = levels[0]; levels.slice(1).forEach(L => leavesOf(root).forEach(n => { n.kids = clone(L); }));
    const check = L => { const [sn, sd] = L.reduce(([an, ad], { q: [n, d] }) => qRed([an * d + n * ad, ad * d]), [0, 1]);
      if (sn !== sd) throw new Error(`probtree: ${L.map(n => n.name).join(', ')} add to ${sn}/${sd}, not 1`); L.forEach(n => n.kids.length && check(n.kids)); };
    check(root);
    const D = (function depth(L) { return 1 + Math.max(0, ...L.map(n => (n.kids.length ? depth(n.kids) : 0))); })(root);
    if (D > 4) throw new Error('probtree: at most 4 levels');
    const leaves = [], walk = (L, path) => L.forEach(n => { const p = [...path, n]; n.path = p; n.kids.length ? walk(n.kids, p) : leaves.push(n); }); walk(root, []);
    if (leaves.length > 16) throw new Error('probtree: at most 16 outcomes');
    const nameW = Array(D).fill(0); (function wid(L, d) { L.forEach(n => { nameW[d] = Math.max(nameW[d], tw(n.name, 22)); wid(n.kids, d + 1); }); })(root, 0);
    const outcome = n => { const q = qRed(n.path.reduce(([an, ad, af], { q: [m, d, f] }) => [an * m, ad * d, af && f], [1, 1, true]));
      return `${n.path.map(p => p.name).join(', ')}: ${n.path.map(p => qStr(p.q)).join(' × ')} = ${qStr(q)}`; };
    const outs = leaves.map(outcome), ofs = clamp(Math.min(20, (h / leaves.length) * .6), 13, 20), outW = Math.max(...outs.map(s => tw(s, ofs))) + 20;
    const blen = Math.max(60, (w - 20 - outW - nameW.reduce((s, v) => s + v + 22, 0)) / D);
    const colX = [x + 14]; nameW.forEach((nw, d) => colX.push(colX[d] + blen + 8 + nw + 14));
    const LY = i => y + 30 + (h - 40) * (i + .5) / leaves.length;
    const ys = new Map(); (function place(L) { L.forEach(n => { if (n.kids.length) { place(n.kids); ys.set(n, n.kids.reduce((s, k) => s + ys.get(k), 0) / n.kids.length); } else ys.set(n, LY(leaves.indexOf(n))); }); })(root);
    const rootY = root.reduce((s, n) => s + ys.get(n), 0) / root.length;
    dot(g, x + 14, rootY, 5, K);
    const draw = (L, d, ax, ay) => L.forEach(n => {
      const ex = colX[d] + blen, ey = ys.get(n), mx = (ax + ex) / 2, my = (ay + ey) / 2, up = ey < ay - 2, down = ey > ay + 2;
      line(g, `M${ax} ${ay} L${ex} ${ey}`, PINK[d % 8], 3);
      label(g, up || down ? mx - 4 : mx, up ? my - 8 : down ? my + 22 : my - 10, qStr(n.q), RED, 19, up || down ? 'end' : 'middle');
      label(g, ex + 8, ey + 8, n.name, K, 22, 'start');
      if (n.kids.length) draw(n.kids, d + 1, colX[d + 1], ey); });
    draw(root, 0, x + 14, rootY);
    const ox = x + w - outW + 10;
    leaves.forEach((n, i) => { line(g, `M${colX[D - 1] + blen + 14 + nameW[D - 1]} ${LY(i)} L${ox - 8} ${LY(i)}`, SOFT, 1.4);
      if (showLab(o)) label(g, ox, LY(i) + 6, outs[i], TXT.blue, ofs, 'start'); });
    return g;
  },

  // "samplespace cx cy size k=sum|product|diff|max a=6 b=6 hi=7 | label" — two-dice grid, matching cells shaded, P computed
  //   hi=7 or hi=7,11 or hi=>9 or hi=<4
  samplespace: ([cx = 480, cy = 250, S = 400], o, t, parent) => {
    const g = mk('g', {}, parent), A = clamp(Math.round(opt(o, 'a', 6)), 1, 10), B = clamp(Math.round(opt(o, 'b', 6)), 1, 10), k = o.k || 'sum';
    const OP = { sum: [(p, q) => p + q, '+', 'sum'], product: [(p, q) => p * q, '×', 'product'], diff: [(p, q) => Math.abs(p - q), '|−|', 'difference'], max: [(p, q) => Math.max(p, q), 'max', 'larger'], min: [(p, q) => Math.min(p, q), 'min', 'smaller'] }[k];
    if (!OP) throw new Error(`samplespace: unknown k="${k}"`);
    const hs = String(o.hi ?? '7'), gt = /^>/.test(hs), lt = /^</.test(hs), set = nlist(hs.replace(/^[<>]/, ''));
    const hit = v => (gt ? v > set[0] : lt ? v < set[0] : set.includes(v)), c = S / (Math.max(A, B) + 1), x0 = cx - (B + 1) * c / 2, y0 = cy - (A + 1) * c / 2;
    let n = 0;
    wash(g, rectD(x0 + c, y0, B * c, c), '#d6ebfa'); wash(g, rectD(x0, y0 + c, c, A * c), '#d6ebfa');
    for (let i = 1; i <= A; i++) for (let j = 1; j <= B; j++) if (hit(OP[0](i, j))) { n++; wash(g, rectD(x0 + j * c, y0 + i * c, c, c), FILL.yellow); }
    line(g, [...Array.from({ length: B + 2 }, (_, j) => `M${x0 + j * c} ${y0} L${x0 + j * c} ${y0 + (A + 1) * c}`), ...Array.from({ length: A + 2 }, (_, i) => `M${x0} ${y0 + i * c} L${x0 + (B + 1) * c} ${y0 + i * c}`)].join(' '), K, 2.2);
    const fs = clamp(c * .42, 12, 28);
    label(g, x0 + c / 2, y0 + c / 2 + fs * .35, OP[1], RED, fs * .9, 'middle');
    for (let j = 1; j <= B; j++) label(g, x0 + (j + .5) * c, y0 + c / 2 + fs * .35, String(j), INK.blue, fs, 'middle');
    for (let i = 1; i <= A; i++) { label(g, x0 + c / 2, y0 + (i + .5) * c + fs * .35, String(i), INK.blue, fs, 'middle');
      for (let j = 1; j <= B; j++) label(g, x0 + (j + .5) * c, y0 + (i + .5) * c + fs * .35, String(OP[0](i, j)), hit(OP[0](i, j)) ? RED : K, fs * .9, 'middle'); }
    if (showLab(o)) { label(g, x0 + (B + 1) * c / 2 + c / 2, y0 - 10, 'second die →', TXT.blue, 18, 'middle');
    label(g, x0 - 10, y0 + c * 1.5, 'first', TXT.blue, 18, 'end'); label(g, x0 - 10, y0 + c * 1.5 + 22, 'die ↓', TXT.blue, 18, 'end'); }
    const total = A * B, gg = gcd(n, total) || 1, what = gt ? `> ${set[0]}` : lt ? `< ${set[0]}` : set.length > 1 ? `is ${set.join(' or ')}` : `= ${set[0]}`;
    if (t || showLab(o)) label(g, cx, y0 + (A + 1) * c + 38, t || `P(${OP[2]} ${what}) = ${n}/${total}${!n ? ' = 0' : gg > 1 ? ` = ${n / gg}/${total / gg}` : ''}`, RED, 26, 'middle');
    return g;
  },

  // "zscore x y w mean=70 sd=10 at=85 | label" — value scale over z scale, the point on both, z = (x − μ) ÷ σ, % below
  zscore: ([x = 100, y = 60, w = 760], o, t, parent) => {
    const g = mk('g', {}, parent), mu = opt(o, 'mean', 70), sd = opt(o, 'sd', 10), at = opt(o, 'at', mu + 1.5 * sd);
    if (!(sd > 0)) throw new Error('zscore: sd must be above 0');
    const z = (at - mu) / sd, zr = clamp(Math.ceil(Math.abs(z) + .2), 3, 6), X = v => x + 30 + (v + zr) / (2 * zr) * (w - 60);
    const b1 = y + 150, b2 = y + 250, Y = v => b1 - Math.exp(-v * v / 2) * 120;
    if (z > -zr) wash(g, polyD([[X(-zr), b1], ...Array.from({ length: 81 }, (_, i) => { const v = -zr + (Math.min(z, zr) + zr) * i / 80; return [X(v), Y(v)]; }), [X(Math.min(z, zr)), b1]]), FILL.blue, { opacity: .6 });
    line(g, polyD(Array.from({ length: 161 }, (_, i) => { const v = -zr + 2 * zr * i / 160; return [X(v), Y(v)]; }), false), INK.blue, 3);
    line(g, `M${x} ${b1} L${x + w} ${b1} M${x} ${b2} L${x + w} ${b2}`, K, 3);
    const ks = Array.from({ length: 2 * zr + 1 }, (_, i) => i - zr);
    line(g, ks.map(k => `M${X(k)} ${b1 - 6} L${X(k)} ${b1 + 6} M${X(k)} ${b2 - 6} L${X(k)} ${b2 + 6}`).join(' '), K, 2);
    ks.forEach(k => { dash(g, [[X(k), b1 + 34], [X(k), b2 - 8]], SOFT, 1.6);
      label(g, X(k), b1 + 26, fmt(mu + k * sd), TICK, 17, 'middle'); label(g, X(k), b2 + 26, minus(String(k)), TICK, 17, 'middle'); });
    label(g, x - 8, b1 + 6, 'x', TXT.blue, 24, 'end'); label(g, x - 8, b2 + 6, 'z', TXT.orange, 24, 'end');
    line(g, `M${X(z)} ${Y(z)} L${X(z)} ${b2}`, RED, 3);
    dot(g, X(z), b1, 7, FILL.red, RED); dot(g, X(z), b2, 7, FILL.red, RED);
    const side = z > zr - 1.6 ? 'end' : 'start', dx = side === 'end' ? -12 : 12;
    label(g, X(z) + dx, b1 - 12, `x = ${fmt(at)}`, RED, 22, side); label(g, X(z) + dx, b2 - 12, minus(`z = ${fmt(z)}`), RED, 22, side);
    if (showLab(o)) label(g, x + w / 2, b2 + 76, minus(`z = (${fmt(at)} - ${fmt(mu)}) ÷ ${fmt(sd)} = ${fmt(z)}`), K, 26, 'middle');
    if (t || showLab(o)) label(g, x + w / 2, b2 + 112, t || `${fm(Phi(z) * 100, 1)}% of values lie below ${fmt(at)}`, TXT.blue, 22, 'middle');
    return g;
  },

  // "confint x y w mean=50 sd=8 n=36 conf=95 moe= mu= | label" — interval bar on a number line, margin computed (z*)
  confint: ([x = 100, y = 200, w = 760], o, t, parent) => {
    const g = mk('g', {}, parent), mean = opt(o, 'mean', 50), conf = opt(o, 'conf', 95), sd = opt(o, 'sd', NaN), n = opt(o, 'n', NaN);
    if (!(conf > 0 && conf < 100)) throw new Error('confint: conf must be between 0 and 100');
    const zs = invPhi(1 - (1 - conf / 100) / 2);
    let moe = opt(o, 'moe', NaN);
    if (!Number.isFinite(moe)) { if (o.sd === undefined && o.n === undefined) { moe = zs * 8 / 6; }
      else { if (!(sd > 0 && n >= 2)) throw new Error('confint: give moe=, or sd= above 0 and n= of 2 or more'); moe = zs * sd / Math.sqrt(n); } }
    if (!(moe > 0)) throw new Error('confint: the margin must be above 0');
    const lo = mean - moe, hi = mean + moe, mu = opt(o, 'mu', NaN), ext = [lo - moe * .8, hi + moe * .8, ...(Number.isFinite(mu) ? [mu - moe * .3, mu + moe * .3] : [])];
    const [r0, r1] = niceRange(Math.min(...ext), Math.max(...ext), 8), X = v => x + 20 + (v - r0) / (r1 - r0) * (w - 40), ly = y + 70;
    line(g, `M${x} ${ly} L${x + w} ${ly}`, K, 3);
    const tk = ticks(r0, r1, 0, niceStep(r1 - r0, 8));
    line(g, tk.map(v => `M${X(v)} ${ly - 6} L${X(v)} ${ly + 6}`).join(' '), K, 2);
    tk.forEach(v => label(g, X(v), ly + 28, fmt(v), TICK, 18, 'middle'));
    wash(g, rectD(X(lo), y - 9, X(hi) - X(lo), 18), FILL.blue);
    line(g, `${rectD(X(lo), y - 9, X(hi) - X(lo), 18)} M${X(lo)} ${y - 24} L${X(lo)} ${y + 24} M${X(hi)} ${y - 24} L${X(hi)} ${y + 24}`, INK.blue, 3);
    dash(g, [[X(lo), y + 26], [X(lo), ly]], INK.sky, 2); dash(g, [[X(hi), y + 26], [X(hi), ly]], INK.sky, 2);
    dot(g, X(mean), y, 7, FILL.red, RED);
    label(g, X(lo), y - 34, fmt(lo), INK.blue, 22, 'middle'); label(g, X(hi), y - 34, fmt(hi), INK.blue, 22, 'middle'); label(g, X(mean), y - 34, fmt(mean), RED, 22, 'middle');
    if (Number.isFinite(mu)) { line(g, `M${X(mu)} ${y - 60} L${X(mu)} ${ly}`, INK.green, 3); label(g, X(mu), y - 68, showLab(o) ? `true μ = ${fmt(mu)}` : `μ = ${fmt(mu)}`, TXT.green, 20, 'middle'); }
    if (showLab(o)) label(g, x + w / 2, ly + 76, `${fmt(conf)}% confidence interval: ${fmt(mean)} ± ${fmt(moe)} = (${fmt(lo)}, ${fmt(hi)})`, K, 24, 'middle');
    if (Number.isFinite(sd) && Number.isFinite(n) && !Number.isFinite(opt(o, 'moe', NaN)) && showLab(o)) label(g, x + w / 2, ly + 110, `margin = z* × σ ÷ √n = ${fmt(zs)} × ${fmt(sd)} ÷ √${fmt(n)} = ${fmt(moe)}`, TXT.blue, 20, 'middle');
    if (t) label(g, x + w / 2, y - 100, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "unitcircle cx cy r deg=30 rad=1 | label" — unit circle, angle θ, point (cos θ, sin θ), cos and sin as projections
  unitcircle: ([cx = 330, cy = 270, r = 190], o, t, parent) => {
    const g = mk('g', {}, parent), deg = opt(o, 'deg', 30), [Px, Py] = pol(cx, cy, r, deg), c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
    const nrm = ((deg % 360) + 360) % 360, special = Math.abs(nrm % 30) < 1e-9 || Math.abs(nrm % 45) < 1e-9;
    const ref = Math.round(Math.abs(Math.atan2(Math.abs(s), Math.abs(c)) / RAD));
    const sgn = v => (v < 0 ? '−' : ''), cosE = special ? (Math.abs(c) < 1e-9 ? '0' : sgn(c) + COS_REF[ref]) : null, sinE = special ? (Math.abs(s) < 1e-9 ? '0' : sgn(s) + COS_REF[90 - ref]) : null;
    const tanE = Math.abs(c) < 1e-9 ? 'undefined' : special ? (Math.abs(s) < 1e-9 ? '0' : (s * c < 0 ? '−' : '') + TANS[ref]) : null;
    wash(g, `M${cx} ${cy} L${cx + r * .2} ${cy} ${arcD(cx, cy, r * .2, 0, deg).replace(/^M[^A]+/, '')} Z`, FILL.yellow);
    line(g, `M${cx - r - 30} ${cy} L${cx + r + 30} ${cy} M${cx} ${cy + r + 30} L${cx} ${cy - r - 30}`, K, 2.6);
    line(g, head(cx + r + 30, cy, cx, cy) + ' ' + head(cx, cy - r - 30, cx, cy), K, 2.6, { class: 'ink head' });
    line(g, ring(cx, cy, r), K, 3.4);
    line(g, arcD(cx, cy, r * .2, 0, deg), INK.orange, 3);
    label(g, cx + r + 8, cy + 24, '1', TICK, 18); label(g, cx - r - 8, cy + 24, '−1', TICK, 18, 'end');
    label(g, cx + 8, cy - r - 8, '1', TICK, 18); label(g, cx + 8, cy + r + 24, '−1', TICK, 18);
    label(g, cx + r + 30, cy - 10, 'x', TXT.blue, 22, 'end'); label(g, cx + 12, cy - r - 18, 'y', TXT.blue, 22);
    line(g, `M${cx} ${cy} L${Px} ${Py}`, K, 3.4);
    line(g, `M${cx} ${cy} L${Px} ${cy}`, INK.blue, 6);
    line(g, `M${Px} ${cy} L${Px} ${Py}`, RED, 6);
    dot(g, Px, Py, 7, FILL.yellow, K);
    const [tx, ty] = pol(cx, cy, r * .2 + 22, deg / 2); label(g, tx, ty + 8, 'θ', TXT.orange, 24, 'middle');
    if (Math.abs(c) > .15 && showLab(o)) label(g, (cx + Px) / 2, cy + (s >= 0 ? 28 : -12), 'cos θ', TXT.blue, 20, 'middle');
    if (Math.abs(s) > .15 && showLab(o)) label(g, Px + (c >= 0 ? 10 : -10), (cy + Py) / 2 + 7, 'sin θ', RED, 20, c >= 0 ? 'start' : 'end');
    const [lx, ly] = pol(cx, cy, r + 20, deg); label(g, lx, ly + (s >= 0 ? 0 : 16), `(${fmt(c)}, ${fmt(s)})`, K, 20, c > .2 ? 'start' : c < -.2 ? 'end' : 'middle');
    const px = cx + r + 64, show = (e, v) => (e ? (/[√]/.test(e) ? `= ${e} ≈ ${fm(v, 3)}` : `= ${e}`) : `≈ ${fm(v, 3)}`);
    const rows = [[`θ = ${fmt(deg)}°${o.rad === '0' ? '' : ` = ${piLabel(deg * RAD)}`}`, TXT.orange], [`cos θ ${show(cosE, c)}`, TXT.blue], [`sin θ ${show(sinE, s)}`, RED],
      [`tan θ ${tanE === 'undefined' ? 'is undefined' : show(tanE, s / c)}`, K]];
    if (t) rows.unshift([t, TXT.blue]);
    (showLab(o) ? rows : rows.slice(0, t ? 1 : 0)).forEach(([str, col], i) => label(g, px, cy - 60 + i * 40, minus(str), col, 24, 'start'));
    return g;
  },

  // "trigtri cx cy size deg=35 hyp=10 | label" — right triangle (or opp= adj= hyp= any two); SOH CAH TOA ratios
  trigtri: ([cx = 260, cy = 290, S = 300], o, t, parent) => {
    const g = mk('g', {}, parent); let d = opt(o, 'deg', NaN), H = opt(o, 'hyp', NaN), O = opt(o, 'opp', NaN), A = opt(o, 'adj', NaN);
    if (!Object.keys(o).some(k => ['deg', 'hyp', 'opp', 'adj'].includes(k))) { d = 35; H = 10; }
    if ([H, O, A].some(v => Number.isFinite(v) && !(v > 0))) throw new Error('trigtri: sides must be above 0');
    if (Number.isFinite(d)) { if (!(d > 0 && d < 90)) throw new Error('trigtri: deg must be between 0 and 90');
      const r = d * RAD; if (Number.isFinite(H)) { O = H * Math.sin(r); A = H * Math.cos(r); } else if (Number.isFinite(O)) { H = O / Math.sin(r); A = O / Math.tan(r); }
      else if (Number.isFinite(A)) { H = A / Math.cos(r); O = A * Math.tan(r); } else throw new Error('trigtri: give one side with deg='); }
    else if (Number.isFinite(O) && Number.isFinite(A)) H = Math.hypot(O, A);
    else if (Number.isFinite(H) && Number.isFinite(O)) { if (O >= H) throw new Error('trigtri: opp must be shorter than hyp'); A = Math.sqrt(H * H - O * O); }
    else if (Number.isFinite(H) && Number.isFinite(A)) { if (A >= H) throw new Error('trigtri: adj must be shorter than hyp'); O = Math.sqrt(H * H - A * A); }
    else throw new Error('trigtri: give deg= with one side, or two sides');
    d = Math.atan2(O, A) / RAD;
    const s = Math.min(S / A, S * .8 / O), P0 = [cx - A * s / 2, cy + O * s / 2], C = [cx + A * s / 2, cy + O * s / 2], T = [cx + A * s / 2, cy - O * s / 2];
    wash(g, polyD([P0, C, T]), '#bfe3a8');
    line(g, polyD([P0, C, T]), K, 3.4);
    line(g, `M${C[0] - 18} ${C[1]} L${C[0] - 18} ${C[1] - 18} L${C[0]} ${C[1] - 18}`, K, 2.4);
    line(g, arcD(...P0, 40, 0, d), INK.orange, 3);
    const [ax, ay] = pol(...P0, 62 + Math.max(0, 30 - d), d / 2); label(g, ax, ay + 8, `${fmt(d)}°`, TXT.orange, 20, 'start');
    label(g, cx, C[1] + 32, showLab(o) ? `adjacent ${fmt(A)}` : fmt(A), TXT.blue, 22, 'middle');
    label(g, C[0] + 12, cy + 8, showLab(o) ? `opposite ${fmt(O)}` : fmt(O), RED, 22, 'start');
    const L = Math.hypot(T[0] - P0[0], T[1] - P0[1]), nx = (T[1] - P0[1]) / L, ny = -(T[0] - P0[0]) / L; // outward normal (up-left)
    label(g, cx + nx * 20, cy + ny * 20, showLab(o) ? `hypotenuse ${fmt(H)}` : fmt(H), INK.green, 22, 'end');
    const px = C[0] + 30 + tw(`opposite ${fmt(O)}`, 22), dd = fmt(d);
    if (showLab(o)) label(g, px, cy - 92, 'SOH  CAH  TOA', TXT.orange, 24);
    [[`sin ${dd}° = O/H = ${fmt(O)}/${fmt(H)} = ${fm(O / H, 3)}`, RED], [`cos ${dd}° = A/H = ${fmt(A)}/${fmt(H)} = ${fm(A / H, 3)}`, TXT.blue], [`tan ${dd}° = O/A = ${fmt(O)}/${fmt(A)} = ${fm(O / A, 3)}`, INK.green]]
      .forEach(([str, col], i) => showLab(o) && label(g, px, cy - 46 + i * 38, str, col, 20));
    if (t) label(g, cx, P0[1] - O * s - 30, t, TXT.blue, 24, 'middle');
    return g;
  },

  // "trigwave x y w h k=sin|cos a=2 b=1 c=0 d=0 | label" — y = a·sin(b(x − c)) + d over two periods, amplitude and period marked
  trigwave: ([x = 120, y = 40, w = 720, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'sin', A = opt(o, 'a', 2), B = opt(o, 'b', 1), C = opt(o, 'c', 0), Dd = opt(o, 'd', 0);
    if (!['sin', 'cos'].includes(k)) throw new Error(`trigwave: unknown k="${k}"`);
    if (!(B > 0)) throw new Error('trigwave: b must be above 0');
    if (!A) throw new Error('trigwave: a must not be 0');
    const P = TAU / B, F = v => A * Math[k](B * (v - C)) + Dd, xr = o.x ? nlist(o.x) : [0, 2 * P], aa = Math.abs(A);
    const yr = o.y ? nlist(o.y) : [Math.min(0, Dd - aa) - .25 * aa, Math.max(0, Dd + aa) + .7 * aa];
    let xstep = P / 4; while ((xr[1] - xr[0]) / xstep > 16) xstep *= 2;
    const f = frame(g, x, y, w, h, xr, yr, { xstep, xfmt: piLabel, xl: 'x', yl: 'y' });
    if (Dd) { dash(g, [[f.px, f.Y(Dd)], [f.px + f.pw, f.Y(Dd)]], INK.sky, 2.4); label(g, f.px + f.pw - 4, f.Y(Dd) + 24, minus(`${showLab(o) ? 'midline ' : ''}y = ${fmt(Dd)}`), TXT.sky, 20, 'end'); }
    fcurve(g, F, f, RED, 4);
    const ph0 = k === 'sin' ? (A > 0 ? Math.PI / 2 : 1.5 * Math.PI) : (A > 0 ? 0 : Math.PI);
    const peaks = []; for (let i = -40; i < 40; i++) { const v = C + (ph0 + TAU * i) / B; if (v >= xr[0] - 1e-9 && v <= xr[1] + 1e-9) peaks.push(v); }
    if (peaks.length) { const p1 = peaks[0], top = Dd + aa;
      arrow(g, f.X(p1), f.Y(Dd), f.X(p1), f.Y(top) + 2, INK.orange, 3, 11); line(g, head(f.X(p1), f.Y(Dd), f.X(p1), f.Y(top)), INK.orange, 3, { class: 'ink head' });
      tag(g, f.X(p1) + 10, f.Y((Dd + top) / 2) + 6, showLab(o) ? `amplitude ${fmt(aa)}` : fmt(aa), TXT.orange, 20, 'start');
      if (peaks[1] !== undefined) { const p2 = peaks[1], by = f.Y(top) - 22;
        line(g, `M${f.X(p1)} ${by - 8} L${f.X(p1)} ${by + 8} M${f.X(p2)} ${by - 8} L${f.X(p2)} ${by + 8}`, INK.green, 2.6);
        arrow(g, (f.X(p1) + f.X(p2)) / 2, by, f.X(p2), by, INK.green, 2.6, 10); arrow(g, (f.X(p1) + f.X(p2)) / 2, by, f.X(p1), by, INK.green, 2.6, 10);
        label(g, (f.X(p1) + f.X(p2)) / 2, by - 10, showLab(o) ? `period ${piLabel(P)}` : piLabel(P), TXT.green, 20, 'middle'); } }
    const inner = `${B === 1 ? '' : fmt(B)}${C ? `(x ${C > 0 ? '−' : '+'} ${piLabel(Math.abs(C))})` : 'x'}`;
    if (t || showLab(o)) label(g, f.px + f.pw - 4, f.py + 6, t || minus(`y = ${aa === 1 ? (A < 0 ? '-' : '') : fmt(A) + ' '}${k}(${inner})${Dd ? (Dd > 0 ? ' + ' : ' - ') + fmt(Math.abs(Dd)) : ''}`), RED, 24, 'end');
    return g;
  },

  // "tangent x y w h f=x^2 at=1 x=lo,hi y=lo,hi | label" — curve, the point, tangent line; slope f'(a) and its equation
  tangent: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), F = compile(o.f || 'x^2', ['x'], 'tangent'), a = opt(o, 'at', 1), m = slopeAt(F, a, 'tangent'), ya = snap(F(a));
    const xr = o.x ? nlist(o.x) : [a - 3, a + 3], yr = o.y ? nlist(o.y) : fnRange(F, xr, [ya], 'tangent');
    const f = frame(g, x, y, w, h, xr, yr, o);
    fcurve(g, F, f, INK.blue, 4);
    fcurve(g, v => ya + m * (v - a), f, RED, 3.4);
    dot(g, f.X(a), f.Y(ya), 7, FILL.red, RED);
    label(g, f.X(a) + (m > 0 ? -12 : 12), f.Y(ya) - 14, `(${fmt(a)}, ${fmt(ya)})`, K, 20, m > 0 ? 'end' : 'start');
    block(g, f, showLab(o) ? [[t || `f(x) = ${pretty(o.f || 'x^2')}`, INK.blue], [minus(`slope f′(${fmt(a)}) = ${fm(m, 3)}`), RED], [`tangent: ${linEq(m, ya - m * a)}`, RED]] : [t && [t, INK.blue]]);
    return g;
  },

  // "secant x y w h f=x^2 at=1 h=2,1,0.5 | label" — secant lines from a to a+h shrinking towards the tangent; slopes listed
  secant: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), src = o.f || 'x^2', F = compile(src, ['x'], 'secant'), a = opt(o, 'at', 1), hs = nlist(o.h || '2,1,0.5');
    if (!hs.length || hs.some(v => !v)) throw new Error('secant: h values must not be 0');
    const m = slopeAt(F, a, 'secant'), ya = F(a), ends = [a, ...hs.map(v => a + v)];
    hs.forEach(v => { if (!Number.isFinite(F(a + v))) throw new Error(`secant: f is not defined at x = ${fmt(a + v)}`); });
    const xr = o.x ? nlist(o.x) : [Math.min(...ends) - 1.2, Math.max(...ends) + 1.2], yr = o.y ? nlist(o.y) : fnRange(F, xr, ends.map(F), 'secant');
    const f = frame(g, x, y, w, h, xr, yr, o), cols = [INK.orange, INK.green, PURPLE, INK.sky, '#1f7f72'];
    fcurve(g, F, f, INK.blue, 4);
    const rows = [[t || `f(x) = ${pretty(src)}`, INK.blue]];
    hs.forEach((v, i) => { const q = a + v, sl = (F(q) - ya) / v, col = cols[i % cols.length];
      line(g, `M${f.X(xr[0])} ${f.Y(ya + sl * (xr[0] - a))} L${f.X(xr[1])} ${f.Y(ya + sl * (xr[1] - a))}`, col, 2.8, { 'clip-path': f.clip });
      dot(g, f.X(q), f.Y(F(q)), 6, '#ffffff', col); rows.push([`h = ${fmt(v)}: slope ${fm(sl, 3)}`, col]); });
    dash(g, [[f.X(xr[0]), f.Y(ya + m * (xr[0] - a))], [f.X(xr[1]), f.Y(ya + m * (xr[1] - a))]], RED, 3, { 'clip-path': f.clip });
    sampleF(v => ya + m * (v - a), f);
    dot(g, f.X(a), f.Y(ya), 7, FILL.red, RED);
    rows.push([minus(`h → 0: slope → f′(${fmt(a)}) = ${fm(m, 3)}`), RED]);
    block(g, f, showLab(o) ? rows : [t && [t, INK.blue]], 20);
    return g;
  },

  // "riemann x y w h f=x^2 a=0 b=2 n=4 k=left|right|mid|trap | label" — rectangles (or trapezoids) under f, sum vs exact integral
  riemann: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), src = o.f || 'x^2', F = compile(src, ['x'], 'riemann'), a = opt(o, 'a', 0), b = opt(o, 'b', 2), n = Math.round(opt(o, 'n', 4)), k = o.k || 'left';
    if (!(b > a)) throw new Error('riemann: b must be above a');
    if (!(n >= 1 && n <= 200)) throw new Error('riemann: n must be 1 to 200');
    const kind = { left: 'left', right: 'right', mid: 'midpoint', trap: 'trapezoid' }[k]; if (!kind) throw new Error(`riemann: unknown k="${k}"`);
    for (let i = 0; i <= 200; i++) if (!Number.isFinite(F(a + (b - a) * i / 200))) throw new Error(`riemann: f is not defined everywhere from ${fmt(a)} to ${fmt(b)}`);
    const pad = (b - a) * .15, xr = o.x ? nlist(o.x) : rangeOf([a - pad, b + pad], 0, true, 8), yr = o.y ? nlist(o.y) : fnRange(F, xr, [0], 'riemann');
    const f = frame(g, x, y, w, h, xr, yr, o), dx = (b - a) / n; let sum = 0; const shapes = [];
    for (let i = 0; i < n; i++) { const x0 = a + i * dx, x1 = x0 + dx;
      if (k === 'trap') { sum += (F(x0) + F(x1)) / 2 * dx; shapes.push([[x0, 0], [x0, F(x0)], [x1, F(x1)], [x1, 0]]); }
      else { const hgt = F(k === 'left' ? x0 : k === 'right' ? x1 : (x0 + x1) / 2); sum += hgt * dx; shapes.push([[x0, 0], [x0, hgt], [x1, hgt], [x1, 0]]); } }
    shapes.forEach(S => wash(g, polyD(S.map(([u, v]) => [f.X(u), f.Y(v)])), (S[1][1] + S[2][1]) >= 0 ? FILL.yellow : FILL.red, { opacity: .8 }));
    line(g, shapes.map(S => polyD(S.map(([u, v]) => [f.X(u), f.Y(v)]))).join(' '), INK.orange, n > 40 ? 1.2 : 2.2);
    shapes.forEach(S => { for (let j = 0; j <= 4; j++) for (let q = 0; q <= 4; q++) f.scr.push([f.X(S[0][0] + (S[3][0] - S[0][0]) * j / 4), f.Y((S[1][1] + (S[2][1] - S[1][1]) * j / 4) * q / 4)]); });
    fcurve(g, F, f, INK.blue, 4);
    const exact = simpson(F, a, b);
    block(g, f, !showLab(o) ? [t && [t, INK.blue]] : [[t || `f(x) = ${pretty(src)}`, INK.blue], [`${kind} sum, n = ${n}: ${fm(sum, 4)}`, TXT.orange], [minus(`exact ∫${sub(fmt(a))}${sup(fmt(b))} f dx = ${fm(exact, 4)}`), RED]], 21);
    return g;
  },

  // "integral x y w h f=x^2 a=0 b=2 g= | label" — area under f (or between f and g) from a to b shaded, value computed
  integral: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), src = o.f || 'x^2', F = compile(src, ['x'], 'integral'), G = o.g ? compile(o.g, ['x'], 'integral') : () => 0, a = opt(o, 'a', 0), b = opt(o, 'b', 2);
    if (!(b > a)) throw new Error('integral: b must be above a');
    for (let i = 0; i <= 200; i++) { const u = a + (b - a) * i / 200; if (!Number.isFinite(F(u)) || !Number.isFinite(G(u))) throw new Error(`integral: f is not defined everywhere from ${fmt(a)} to ${fmt(b)}`); }
    const pad = (b - a) * .25, xr = o.x ? nlist(o.x) : rangeOf([a - pad, b + pad], 0, true, 8), yr = o.y ? nlist(o.y) : fnRange(v => F(v), xr, [0, ...(o.g ? [G(a), G(b), G((a + b) / 2)] : [])], 'integral');
    const f = frame(g, x, y, w, h, xr, yr, o), N = 160, us = Array.from({ length: N + 1 }, (_, i) => a + (b - a) * i / N);
    if (o.g) wash(g, polyD([...us.map(u => [f.X(u), f.Y(F(u))]), ...[...us].reverse().map(u => [f.X(u), f.Y(G(u))])]), FILL.blue, { opacity: .7 });
    else { wash(g, polyD([[f.X(a), f.Y(0)], ...us.map(u => [f.X(u), f.Y(Math.max(0, F(u)))]), [f.X(b), f.Y(0)]]), FILL.blue, { opacity: .7 });
      if (us.some(u => F(u) < 0)) wash(g, polyD([[f.X(a), f.Y(0)], ...us.map(u => [f.X(u), f.Y(Math.min(0, F(u)))]), [f.X(b), f.Y(0)]]), FILL.red, { opacity: .6 }); }
    line(g, `M${f.X(a)} ${f.Y(G(a))} L${f.X(a)} ${f.Y(F(a))} M${f.X(b)} ${f.Y(G(b))} L${f.X(b)} ${f.Y(F(b))}`, K, 2.6);
    us.forEach((u, i) => { if (i % 8 === 0) for (let q = 0; q <= 5; q++) f.scr.push([f.X(u), f.Y(G(u) + (F(u) - G(u)) * q / 5)]); });
    if (o.g) fcurve(g, G, f, INK.green, 4);
    fcurve(g, F, f, INK.blue, 4);
    const lim = `∫${sub(fmt(a))}${sup(fmt(b))}`, rows = [[t || `f(x) = ${pretty(src)}`, INK.blue]];
    if (o.g) { rows.push([`g(x) = ${pretty(o.g)}`, INK.green], [minus(`area = ${lim} |f − g| dx = ${fm(simpson(v => Math.abs(F(v) - G(v)), a, b), 4)}`), RED]); }
    else { rows.push([minus(`${lim} ${pretty(src)} dx = ${fm(simpson(F, a, b), 4)}`), RED]);
      if (us.some(u => F(u) < 0)) rows.push([minus(`total area ${lim} |f| dx = ${fm(simpson(v => Math.abs(F(v)), a, b), 4)}`), TXT.orange]); }
    block(g, f, showLab(o) ? rows : [t && [t, INK.blue]], 21);
    return g;
  },

  // "slopefield x y w h f=x-y x=-3,3 y=-3,3 sol=0,1 | label" — dy/dx = f(x, y) as short slope marks; solution curves through sol points
  slopefield: ([x = 180, y = 30, w = 600, h = 480], o, t, parent) => {
    const g = mk('g', {}, parent), src = o.f || 'x-y', F = compile(src, ['x', 'y'], 'slopefield'), xr = o.x ? nlist(o.x) : [-3, 3], yr = o.y ? nlist(o.y) : [-3, 3];
    const f = frame(g, x, y, w, h, xr, yr, o), nx = Math.max(4, Math.round(f.pw / 40)), ny = Math.max(4, Math.round(f.ph / 40)), L = Math.min(f.pw / nx, f.ph / ny) * .34;
    const sx = f.pw / (xr[1] - xr[0]), sy = f.ph / (yr[1] - yr[0]); let d = '';
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const u = xr[0] + (xr[1] - xr[0]) * (i + .5) / nx, v = yr[0] + (yr[1] - yr[0]) * (j + .5) / ny, m = F({ x: u, y: v });
      const dx = Number.isFinite(m) ? sx : 0, dy = Number.isFinite(m) ? -m * sy : 1, l = Math.hypot(dx, dy) || 1, X0 = f.X(u), Y0 = f.Y(v);
      d += `M${(X0 - dx / l * L).toFixed(2)} ${(Y0 - dy / l * L).toFixed(2)} L${(X0 + dx / l * L).toFixed(2)} ${(Y0 + dy / l * L).toFixed(2)} `; }
    line(g, d, TICK, 2);
    const span = yr[1] - yr[0], hstep = (xr[1] - xr[0]) / 400;
    plist(o.sol ?? '0,1').forEach(([u0, v0], i) => {
      const run = dir => { const pts = []; let u = u0, v = v0;
        for (let s = 0; s < 800 && u >= xr[0] - 1e-9 && u <= xr[1] + 1e-9 && v > yr[0] - span && v < yr[1] + span; s++) { pts.push([f.X(u), f.Y(v)]);
          const hh = dir * hstep, k1 = F({ x: u, y: v }), k2 = F({ x: u + hh / 2, y: v + hh / 2 * k1 }), k3 = F({ x: u + hh / 2, y: v + hh / 2 * k2 }), k4 = F({ x: u + hh, y: v + hh * k3 });
          if (![k1, k2, k3, k4].every(Number.isFinite)) break; v += hh / 6 * (k1 + 2 * k2 + 2 * k3 + k4); u += hh; } return pts; };
      const P = [...run(-1).reverse(), ...run(1).slice(1)]; f.scr.push(...P.filter((_, k) => k % 6 === 0));
      if (P.length > 1) line(g, polyD(P, false), [RED, INK.blue, INK.green, PURPLE][i % 4], 3.6, { 'clip-path': f.clip });
      dot(g, f.X(u0), f.Y(v0), 6, FILL.red, RED); });
    block(g, f, [(t || showLab(o)) && [t || minus(`dy/dx = ${pretty(src)}`), RED]], 24);
    return g;
  },

  // "derivplot x y w h f=x^3-3x x=lo,hi | label" — f above, its slope f′ below; f′ = 0 lined up with f's peaks and dips
  derivplot: ([x = 160, y = 20, w = 640, h = 500], o, t, parent) => {
    const g = mk('g', {}, parent), src = o.f || 'x^3-3x', F = compile(src, ['x'], 'derivplot'), xr = o.x ? nlist(o.x) : [-2.5, 2.5];
    const D = v => { const hh = 1e-5 * Math.max(1, Math.abs(v)); return (F(v + hh) - F(v - hh)) / (2 * hh); };
    const f1 = frame(g, x, y, w, h / 2, xr, fnRange(F, xr, [], 'derivplot'), { yl: 'f(x)' }), f2 = frame(g, x, y + h / 2, w, h / 2, xr, fnRange(D, xr, [], 'derivplot'), { yl: 'f′(x)', xl: 'x' });
    const zs = []; let pu = xr[0], pv = D(pu);
    for (let i = 1; i <= 400; i++) { const u = xr[0] + (xr[1] - xr[0]) * i / 400, v = D(u);
      if (Number.isFinite(v) && Number.isFinite(pv) && pv * v < 0) { let lo = pu, hi = u; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (D(lo) * D(m) <= 0) hi = m; else lo = m; } zs.push([snap((lo + hi) / 2), pv > 0]); }
      pu = u; pv = v; }
    zs.forEach(([z]) => dash(g, [[f1.X(z), f1.Y(F(z))], [f2.X(z), f2.Y(0)]], INK.sky, 2.2));
    fcurve(g, F, f1, INK.blue, 4); fcurve(g, D, f2, RED, 4);
    zs.forEach(([z, max]) => { dot(g, f1.X(z), f1.Y(F(z)), 6, FILL.blue, INK.blue); dot(g, f2.X(z), f2.Y(0), 6, FILL.red, RED);
      if (showLab(o)) label(g, f1.X(z), f1.Y(F(z)) + (max ? -14 : 30), `${max ? 'max' : 'min'} x = ${fmt(z)}`, TXT.blue, 18, 'middle'); f1.scr.push([f1.X(z), f1.Y(F(z)) + (max ? -20 : 20)]); });
    block(g, f1, [(t || showLab(o)) && [t || `f(x) = ${pretty(src)}`, INK.blue]], 22);
    if (showLab(o)) block(g, f2, [['f′(x): the slope of f', RED], ['f′ = 0 where f turns', TXT.sky]], 20);
    return g;
  },

  // "limit x y w h f=(x^2-1)/(x-1) at=1 val= | label" — graph with a hole at x = a, both sides approaching, limit computed
  limit: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), src = o.f || '(x^2-1)/(x-1)', F = compile(src, ['x'], 'limit'), a = opt(o, 'at', 1);
    const side = s => { const v6 = F(a + s * 1e-6), v7 = F(a + s * 1e-7); if (!Number.isFinite(v6) || Math.abs(v6) > 1e5 || Math.abs(v6 - v7) > 1e-3 * Math.max(1, Math.abs(v6))) return NaN;
      return Math.round(v7 * 1e4) / 1e4; };
    const Lm = side(-1), Lp = side(1), both = Number.isFinite(Lm) && Number.isFinite(Lp), exists = both && Math.abs(Lm - Lp) < 1e-3 * Math.max(1, Math.abs(Lm));
    const fa = Number.isFinite(opt(o, 'val', NaN)) ? +o.val : F(a);
    const xr = o.x ? nlist(o.x) : [a - 3, a + 3], yr = o.y ? nlist(o.y) : fnRange(F, xr, [Lm, Lp, fa].filter(Number.isFinite), 'limit');
    const f = frame(g, x, y, w, h, xr, yr, o), e = (xr[1] - xr[0]) * 1e-4;
    if (Number.isFinite(Lm)) dash(g, [[f.X(a), f.Y(0)], [f.X(a), f.Y(Lm)]], INK.sky, 2);
    fcurve(g, F, f, INK.blue, 4, xr[0], a - e); fcurve(g, F, f, INK.blue, 4, a + e, xr[1]);
    const dl = (xr[1] - xr[0]) * .07;
    [[-1, Lm], [1, Lp]].forEach(([s, L]) => { if (!Number.isFinite(L)) return; const u0 = a + s * 2.2 * dl, u1 = a + s * 1.1 * dl;
      if ([F(u0), F(u1)].every(Number.isFinite)) { line(g, curveD(F, f, Math.min(u0, u1), Math.max(u0, u1), 20), INK.orange, 7, { 'clip-path': f.clip });
        line(g, head(f.X(u1), f.Y(F(u1)), f.X(u0), f.Y(F(u0)), 16), INK.orange, 5, { class: 'ink head' }); } });
    if (Number.isFinite(Lm)) hole(g, f.X(a), f.Y(Lm), 7, INK.blue);
    if (Number.isFinite(Lp) && !exists) hole(g, f.X(a), f.Y(Lp), 7, INK.blue);
    if (Number.isFinite(fa) && !(exists && Math.abs(fa - Lm) < 1e-6)) dot(g, f.X(a), f.Y(fa), 7, FILL.blue, INK.blue);
    const rows = [[t || `f(x) = ${pretty(src)}`, INK.blue]], near = v => (Number.isFinite(F(v)) ? fm(F(v), 4) : 'undefined');
    rows.push([minus(`f(${fmt(a - .01)}) = ${near(a - .01)},  f(${fmt(a + .01)}) = ${near(a + .01)}`), TXT.orange]);
    if (exists) rows.push([minus(`lim x→${fmt(a)} f(x) = ${fm(Lm, 4)}`), RED]);
    else { rows.push([minus(`from the left → ${Number.isFinite(Lm) ? fm(Lm, 4) : '±∞'}`), RED], [minus(`from the right → ${Number.isFinite(Lp) ? fm(Lp, 4) : '±∞'}`), RED], ['so the limit does not exist', RED]); }
    rows.push([minus(`f(${fmt(a)}) ${Number.isFinite(fa) ? '= ' + fm(fa, 4) : 'is undefined'}`), K]);
    block(g, f, showLab(o) ? rows : [t && [t, INK.blue]], 20);
    return g;
  },

  // "piecewise x y w h pieces=-x(-inf,0);x^2[0,2);4[2,inf) | label" — each piece on its interval, closed ● and open ○ ends
  piecewise: ([x = 160, y = 50, w = 640, h = 440], o, t, parent) => {
    const g = mk('g', {}, parent), raw = String(o.pieces || 'x+3[-4,-1);x^2(-1,2];5-x(2,4]').split(';').filter(Boolean);
    const P = raw.map(s => { const m = /^(.+?)([[(])(-?[\d.]+|-inf),(-?[\d.]+|inf)([\])])$/.exec(s);
      if (!m) throw new Error(`piecewise: cannot read "${s}" (want expr[lo,hi), e.g. x^2[0,2))`);
      const lo = m[3] === '-inf' ? -Infinity : +m[3], hi = m[4] === 'inf' ? Infinity : +m[4];
      if (!(hi > lo)) throw new Error(`piecewise: in "${s}" hi must be above lo`);
      return { src: m[1], F: compile(m[1], ['x'], 'piecewise'), lo, hi, lc: m[2] === '[' && lo > -Infinity, hc: m[5] === ']' && hi < Infinity }; });
    if (!P.length) throw new Error('piecewise: no pieces');
    P.forEach((p, i) => P.slice(i + 1).forEach(q => {
      if (Math.max(p.lo, q.lo) < Math.min(p.hi, q.hi)) throw new Error(`piecewise: pieces "${p.src}" and "${q.src}" overlap, so f is not a function`);
      const sh = p.hi === q.lo ? [p.hc, q.lc, p.hi] : q.hi === p.lo ? [q.hc, p.lc, p.lo] : null;
      if (sh && sh[0] && sh[1] && Math.abs(p.F(sh[2]) - q.F(sh[2])) > 1e-9) throw new Error(`piecewise: x = ${fmt(sh[2])} is in two pieces, so f is not a function`); }));
    const fin = P.flatMap(p => [p.lo, p.hi]).filter(Number.isFinite), spanF = (Math.max(...fin) - Math.min(...fin)) || 4;
    const xr = o.x ? nlist(o.x) : rangeOf([Math.min(...fin) - (P.some(p => p.lo === -Infinity) ? spanF * .4 : spanF * .1), Math.max(...fin) + (P.some(p => p.hi === Infinity) ? spanF * .4 : spanF * .1)], 0, true, 8);
    const part = p => [Math.max(p.lo, xr[0]), Math.min(p.hi, xr[1])], all = v => { const p = P.find(q => v >= q.lo && v <= q.hi); return p ? p.F(v) : NaN; };
    const yr = o.y ? nlist(o.y) : fnRange(all, xr, [], 'piecewise'), f = frame(g, x, y, w, h, xr, yr, o);
    P.forEach((p, i) => { const [l, r] = part(p); if (r > l) fcurve(g, p.F, f, PINK[i % 8], 4, l, r); });
    P.forEach((p, i) => [[p.lo, p.lc, 1], [p.hi, p.hc, -1]].forEach(([v, closed, s]) => { if (!Number.isFinite(v) || v < xr[0] || v > xr[1]) return;
      const yv = Number.isFinite(p.F(v)) ? p.F(v) : p.F(v + s * 1e-7); if (!Number.isFinite(yv)) return;
      closed ? dot(g, f.X(v), f.Y(yv), 6.5, PINK[i % 8], PINK[i % 8]) : hole(g, f.X(v), f.Y(yv), 6.5, PINK[i % 8]); }));
    const cond = p => minus(Number.isFinite(p.lo) && Number.isFinite(p.hi) ? `${fmt(p.lo)} ${p.lc ? '≤' : '<'} x ${p.hc ? '≤' : '<'} ${fmt(p.hi)}` : Number.isFinite(p.lo) ? `x ${p.lc ? '≥' : '>'} ${fmt(p.lo)}` : Number.isFinite(p.hi) ? `x ${p.hc ? '≤' : '<'} ${fmt(p.hi)}` : 'all x');
    block(g, f, !showLab(o) ? [t && [t, K]] : [[t || 'f(x) =', K], ...P.map((p, i) => [`${pretty(p.src)}   if ${cond(p)}`, PINK[i % 8]])], 20);
    return g;
  },

  // "asymptote x y w h num=1,0 den=1,-1,-2 | label" — rational function from coefficients; vertical, horizontal or slant asymptotes and holes
  asymptote: ([x = 160, y = 40, w = 640, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), N = ptrim(nlist(o.num || '2,1')), Dn = ptrim(nlist(o.den || '1,-1,-2'));
    if (!Dn.length) throw new Error('asymptote: den must not be 0');
    if (!N.length) throw new Error('asymptote: num is 0, so f is just 0');
    if (Dn.length === 1) throw new Error('asymptote: den is a constant, so there is no asymptote');
    const F = v => pev(N, v) / pev(Dn, v), R = proots(Dn), VA = [], HO = [];
    R.forEach(r => (pmult(N, r) >= pmult(Dn, r) ? HO : VA).push(r));
    const dn = N.length - 1, dd = Dn.length - 1; let HA = null, SL = null;
    if (dn < dd) HA = 0; else if (dn === dd) HA = N[0] / Dn[0];
    else if (dn === dd + 1) { const q0 = N[0] / Dn[0], rem = N.map((v, i) => v - q0 * ([...Dn, 0][i] ?? 0)).slice(1), q1 = rem[0] / Dn[0]; SL = [q0, q1]; }
    const key = [...R, ...proots(N)], c0 = key.length ? (Math.min(...key) + Math.max(...key)) / 2 : 0, half = Math.max(4, (key.length ? Math.max(...key) - Math.min(...key) : 0) / 2 + 3);
    const xr = o.x ? nlist(o.x) : rangeOf([c0 - half, c0 + half], 0, true, 10);
    const far = v => VA.every(r => Math.abs(v - r) > (xr[1] - xr[0]) * .06);
    const yr = o.y ? nlist(o.y) : fnRange(v => (far(v) ? F(v) : NaN), xr, HA !== null ? [HA - 2, HA + 2] : [], 'asymptote');
    const f = frame(g, x, y, w, h, xr, yr, o);
    VA.forEach(r => { dash(g, [[f.X(r), f.py], [f.X(r), f.py + f.ph]], RED, 2.6); label(g, f.X(r) + 8, f.py + 18, minus(`x = ${fmt(r)}`), RED, 20, 'start'); });
    if (HA !== null) { dash(g, [[f.px, f.Y(HA)], [f.px + f.pw, f.Y(HA)]], INK.green, 2.6); label(g, f.px + f.pw - 4, f.Y(HA) - 10, minus(`y = ${fmt(HA)}`), TXT.green, 20, 'end'); }
    if (SL) { dash(g, [[f.X(xr[0]), f.Y(SL[0] * xr[0] + SL[1])], [f.X(xr[1]), f.Y(SL[0] * xr[1] + SL[1])]], INK.green, 2.6, { 'clip-path': f.clip }); sampleF(v => SL[0] * v + SL[1], f); }
    const cuts = [xr[0], ...VA.filter(r => r > xr[0] && r < xr[1]), xr[1]], e = (xr[1] - xr[0]) * 1e-4;
    cuts.slice(1).forEach((r, i) => fcurve(g, F, f, INK.blue, 4, cuts[i] + (i ? e : 0), r - (i < cuts.length - 2 ? e : 0)));
    HO.forEach(r => { const yh = snap((F(r - 1e-6) + F(r + 1e-6)) / 2); if (Number.isFinite(yh)) hole(g, f.X(r), f.Y(yh), 7, INK.blue); });
    block(g, f, !showLab(o) ? [t && [t, INK.blue]] : [[t || `f(x) = (${pstr(N)}) / (${pstr(Dn)})`, INK.blue], VA.length && [minus(`vertical: x = ${VA.map(fmt).join(', ')}`), RED],
      HA !== null && [minus(`horizontal: y = ${fmt(HA)}`), TXT.green], SL && [`slant: ${linEq(+SL[0].toFixed(3), +SL[1].toFixed(3))}`, TXT.green],
      HO.length && [minus(`hole at x = ${HO.map(fmt).join(', ')}`), K]], 20);
    return g;
  },

  // "growth x y w h fs=2x;x^2;2^x x=0,6 | linear,quadratic,exponential" — curves compared on one axes; where the winner overtakes
  growth: ([x = 160, y = 40, w = 640, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), srcs = String(o.fs || '3x;x^2;2^x').split(';').filter(Boolean), Fs = srcs.map(s => compile(s, ['x'], 'growth'));
    if (srcs.length < 2) throw new Error('growth: give at least 2 curves in fs=');
    const names = t ? words(t) : srcs.map(pretty), xr = o.x ? nlist(o.x) : [0, 6];
    const vals = Fs.flatMap(F => Array.from({ length: 61 }, (_, i) => F(xr[0] + (xr[1] - xr[0]) * i / 60)).filter(Number.isFinite));
    const yr = o.y ? nlist(o.y) : rangeOf(vals), f = frame(g, x, y, w, h, xr, yr, { xl: 'x', yl: 'y', ...o }), cols = [INK.green, INK.orange, RED, INK.blue, PURPLE];
    Fs.forEach((F, i) => fcurve(g, F, f, cols[i % 5], 4));
    const ends = Fs.map((F, i) => { let u = xr[1]; for (let k = 0; k <= 300 && !(F(u) <= yr[1] && F(u) >= yr[0]); k++) u = xr[1] - (xr[1] - xr[0]) * k / 300; return [i, f.X(u), f.Y(F(u))]; }).sort((a, b) => a[2] - b[2]);
    ends.forEach((e, k) => { if (k && e[2] - ends[k - 1][2] < 26) e[2] = ends[k - 1][2] + 26; });
    ends.forEach(([i, ex, ey]) => label(g, Math.min(ex, f.px + f.pw) - 8, ey - 8, names[i] || '', cols[i % 5], 22, 'end'));
    const win = Fs.map((F, i) => [i, F(xr[1])]).filter(p => Number.isFinite(p[1])).sort((a, b) => b[1] - a[1])[0][0]; let last = null;
    Fs.forEach((F, j) => { if (j === win) return; const d = v => Fs[win](v) - F(v); let pu = xr[0], pv = d(pu);
      for (let i = 1; i <= 600; i++) { const u = xr[0] + (xr[1] - xr[0]) * i / 600, v = d(u);
        if (pv < 0 && v >= 0) { let lo = pu, hi = u; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (d(m) < 0) lo = m; else hi = m; } if (!last || hi > last[0]) last = [hi, j]; }
        pu = u; pv = v; } });
    if (last) { const [u, j] = last; dot(g, f.X(u), f.Y(Fs[win](u)), 7, FILL.yellow, K);
      if (showLab(o)) label(g, f.px + 14, f.py + 12, `${names[win]} passes ${names[j]} at x ≈ ${fmt(u)}`, K, 22); }
    return g;
  },

  // "logscale x y w lo=1 hi=100000 vals=3,250,4000 | names" — log axis: equal steps are ×10, minor 2–9 ticks, values placed
  logscale: ([x = 80, y = 300, w = 800], o, t, parent) => {
    const g = mk('g', {}, parent), V = nlist(o.vals || '3,45,800,12000'), names = t ? words(t) : [];
    if ([...V, opt(o, 'lo', 1), opt(o, 'hi', 1)].some(v => !(v > 0))) throw new Error('logscale: a log scale needs values above 0');
    const e0 = Math.floor(Math.log10(opt(o, 'lo', Math.min(...V, 1e9)))), e1 = Math.max(e0 + 1, Math.ceil(Math.log10(opt(o, 'hi', Math.max(...V, 1e-9)))));
    if (e1 - e0 > 12) throw new Error('logscale: more than 12 powers of ten');
    const X = v => x + 30 + (Math.log10(v) - e0) / (e1 - e0) * (w - 60), dec = (w - 60) / (e1 - e0);
    line(g, `M${x} ${y} L${x + w} ${y}`, K, 3);
    let d = ''; for (let e = e0; e <= e1; e++) { d += `M${X(10 ** e)} ${y - 13} L${X(10 ** e)} ${y + 13} `; if (e < e1 && dec >= 60) for (let m = 2; m <= 9; m++) d += `M${X(m * 10 ** e)} ${y - 7} L${X(m * 10 ** e)} ${y + 7} `; }
    line(g, d, K, 2);
    const big = e0 < -3 || e1 > 6;
    for (let e = e0; e <= e1; e++) { label(g, X(10 ** e), y + 36, big ? `10${sup(e)}` : (10 ** e).toLocaleString('en-US', { maximumFractionDigits: 6 }), TICK, 18, 'middle');
      if (!big) label(g, X(10 ** e), y + 60, `10${sup(e)}`, TXT.sky, 16, 'middle');
      if (e < e1) { const a0 = X(10 ** e), a1 = X(10 ** (e + 1)), m = (a0 + a1) / 2;
        line(g, `M${a0 + 4} ${y + 72} Q${m} ${y + 102} ${a1 - 4} ${y + 72}`, INK.orange, 2.4); line(g, head(a1 - 4, y + 72, m, y + 100, 10), INK.orange, 2.4, { class: 'ink head' });
        label(g, m, y + 122, '×10', TXT.orange, 18, 'middle'); } }
    V.forEach((v, i) => { const hy = y - 40 - (i % 2) * 44;
      line(g, `M${X(v)} ${y - 10} L${X(v)} ${hy + 8}`, INK.sky, 1.8); dot(g, X(v), y, 7, FILL.red, RED);
      label(g, X(v), hy, `${names[i] ? names[i] + ' ' : ''}${v.toLocaleString('en-US', { maximumFractionDigits: 4 })}`, RED, 20, 'middle'); });
    if (showLab(o)) label(g, x + w / 2, y + 160, 'each equal step multiplies by 10', TXT.blue, 20, 'middle');
    return g;
  },

  // "sequence x y w h k=arith|geom a=2 d=3 r=2 n=8 | label" — terms as dots, nth-term rule, common difference or ratio, sum
  sequence: ([x = 160, y = 40, w = 640, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'arith', a = opt(o, 'a', 2), n = Math.round(opt(o, 'n', 8)), dd = opt(o, 'd', 3), r = opt(o, 'r', 2);
    if (!['arith', 'geom'].includes(k)) throw new Error(`sequence: unknown k="${k}"`);
    if (!(n >= 2 && n <= 30)) throw new Error('sequence: n must be 2 to 30');
    if (k === 'geom' && !r) throw new Error('sequence: r must not be 0');
    const T = Array.from({ length: n }, (_, i) => snap(k === 'arith' ? a + i * dd : a * r ** i)), S = T.reduce((s, v) => s + v, 0);
    const f = frame(g, x, y, w, h, [0, n + .5], rangeOf(T, (Math.max(...T) - Math.min(...T)) * .08 || 1), { xstep: n > 15 ? 2 : 1, xl: 'n', yl: 'aₙ' });
    dash(g, T.map((v, i) => [f.X(i + 1), f.Y(v)]), INK.sky, 2);
    const vs = clamp(f.pw / n * .32, 12, 20);
    T.forEach((v, i) => { const X0 = f.X(i + 1), Y0 = f.Y(v); dot(g, X0, Y0, 6.5, FILL.red, RED); f.scr.push([X0, Y0], [X0, Y0 - 20]);
      label(g, X0, Y0 + (v >= 0 ? -14 : 28), fmt(v), K, vs, 'middle'); });
    const rule = k === 'arith' ? minus(`aₙ = ${fmt(a)} ${dd < 0 ? '-' : '+'} ${fmt(Math.abs(dd))}(n - 1)`) : minus(`aₙ = ${fmt(a)} · ${r < 0 ? `(${fmt(r)})` : fmt(r)}ⁿ⁻¹`);
    block(g, f, !showLab(o) ? [t && [t, TXT.blue]] : [[t || (k === 'arith' ? 'arithmetic sequence' : 'geometric sequence'), TXT.blue], [rule, RED],
      [k === 'arith' ? minus(`common difference d = ${fmt(dd)}`) : minus(`common ratio r = ${fmt(r)}`), TXT.orange], [`S${sub(n)} = ${fmt(S)}`, K]], 21);
    return g;
  },

  // "sigma cx cy size f=k^2 from=1 to=5 | label" — Σ notation card, the terms written out and the total computed
  sigma: ([cx = 480, cy = 200, H = 150], o, t, parent) => {
    const g = mk('g', {}, parent), src = o.f || 'k^2', F = compile(src, ['k', 'n', 'i'], 'sigma'), a = opt(o, 'from', 1), b = opt(o, 'to', 5);
    if (!Number.isInteger(a) || !Number.isInteger(b)) throw new Error('sigma: from and to must be whole numbers');
    if (b < a) throw new Error('sigma: to must not be below from');
    if (b - a > 1e6) throw new Error('sigma: more than a million terms');
    const v = /\bn\b/.test(src) ? 'n' : /\bi\b/.test(src) && !/\bk\b/.test(src) ? 'i' : 'k';
    const T = []; for (let k = a; k <= b; k++) { const y0 = F({ k, n: k, i: k }); if (!Number.isFinite(y0)) throw new Error(`sigma: term ${v} = ${k} is undefined`); T.push(snap(y0)); }
    const total = T.reduce((s, y0) => s + y0, 0), term = pretty(src), fs = H * .42, W = H * .7 + 24 + tw(term, fs), sx = cx - W / 2, tp = cy - H / 2, bt = cy + H / 2;
    line(g, `M${sx + H * .66} ${tp + H * .1} L${sx + H * .66} ${tp} L${sx} ${tp} L${sx + H * .4} ${cy} L${sx} ${bt} L${sx + H * .66} ${bt} L${sx + H * .66} ${bt - H * .1}`, K, 5);
    label(g, sx + H * .33, tp - 12, String(b), K, H * .24, 'middle');
    label(g, sx + H * .33, bt + H * .26, `${v} = ${a}`, K, H * .2, 'middle');
    label(g, sx + H * .7 + 24, cy + fs * .35, term, INK.blue, fs, 'start');
    const nm = v => (v && Math.abs(v) < .01 ? String(+v.toPrecision(3)) : fm(v, 3)), pick = T.length <= 7 ? T : [...T.slice(0, 3), null, T.at(-1)];
    const expand = pick.map((y0, i) => (y0 === null ? ' + …' : i ? (y0 < 0 ? ` − ${nm(-y0)}` : ` + ${nm(y0)}`) : minus(nm(y0)))).join('');
    label(g, cx, bt + H * .26 + 60, `= ${expand}`, K, 30, 'middle');
    label(g, cx, bt + H * .26 + 112, minus(`= ${nm(snap(total))}`), RED, 40, 'middle');
    if (t || showLab(o)) label(g, cx, tp - H * .24 - 48, t || `add ${pretty(src)} for ${v} = ${a} to ${b} (${T.length} terms)`, TXT.blue, 22, 'middle');
    return g;
  },

  // "axes3d cx cy size p=3,4,5 v=1 | P" — x y z axes (x toward you), point boxed by dashed lines, optional vector and its length
  axes3d: ([cx = 440, cy = 330, S = 280], o, t, parent) => {
    const g = mk('g', {}, parent), P = (o.p ?? '3,4,5').split(';').map(s => s.split(',').map(Number)).filter(p => p.length === 3 && p.every(Number.isFinite));
    if (!P.length) throw new Error('axes3d: p needs x,y,z');
    const names = t ? words(t) : P.map((_, i) => String.fromCharCode(80 + i)), m = Math.ceil(Math.max(1, ...P.flat().map(Math.abs))) + 1, u = S / m;
    const Pr = (a, b, c) => [cx + (b - .42 * a) * u, cy - (c - .42 * a) * u], neg = P.flat().some(v => v < 0);
    const ax = [[[m, 0, 0], 'x'], [[0, m, 0], 'y'], [[0, 0, m], 'z']];
    ax.forEach(([e]) => { const [X1, Y1] = Pr(...e.map(v => -v * (neg ? 1 : .25))); dash(g, [[cx, cy], [X1, Y1]], TICK, 1.8); });
    ax.forEach(([e, nm]) => { const [X1, Y1] = Pr(...e); arrow(g, cx, cy, X1, Y1, K, 3); label(g, X1 + (nm === 'y' ? 10 : -8), Y1 + (nm === 'x' ? 24 : nm === 'z' ? -6 : 7), nm, TXT.blue, 24, nm === 'y' ? 'start' : 'end'); });
    const every = u < 26 ? Math.ceil(26 / u) : 1;
    let d = ''; for (let i = 1; i < m; i++) { const [a1, a2] = Pr(i, 0, 0), [b1, b2] = Pr(0, i, 0), [c1, c2] = Pr(0, 0, i); d += `M${a1 - 5} ${a2} L${a1 + 5} ${a2} M${b1} ${b2 - 5} L${b1} ${b2 + 5} M${c1 - 5} ${c2} L${c1 + 5} ${c2} `;
      if (i % every === 0) { label(g, a1 - 10, a2 + 6, String(i), TICK, 15, 'end'); label(g, b1, b2 + 22, String(i), TICK, 15, 'middle'); label(g, c1 - 10, c2 + 5, String(i), TICK, 15, 'end'); } }
    line(g, d, K, 1.8);
    P.forEach(([a, b, c], i) => { const col = PINK[(i + 3) % 8];
      dash(g, [Pr(0, 0, 0), Pr(a, 0, 0), Pr(a, b, 0), Pr(0, b, 0)], INK.sky, 2); dash(g, [Pr(a, b, 0), Pr(a, b, c)], INK.sky, 2);
      dash(g, [Pr(0, 0, c), Pr(a, 0, c), Pr(a, b, c), Pr(0, b, c), Pr(0, 0, c)], INK.sky, 1.6);
      if (o.v === '1') arrow(g, cx, cy, ...Pr(a, b, c), col, 4, 16);
      const [X1, Y1] = Pr(a, b, c); dot(g, X1, Y1, 7, PAL[(i + 3) % 8], col);
      label(g, X1 + 12, Y1 - 10, minus(`${names[i] || ''}(${fmt(a)}, ${fmt(b)}, ${fmt(c)})`), col, 22, 'start'); });
    if (o.v === '1') { const [a, b, c] = P[0], L2 = snap(a * a + b * b + c * c), r = Math.sqrt(L2);
      if (showLab(o)) label(g, cx, Pr(m, 0, 0)[1] + 46, `|O${names[0]}| = √(${fmt(a)}² + ${fmt(b)}² + ${fmt(c)}²) = ${Number.isInteger(r) ? r : `√${fmt(L2)} ≈ ${fmt(r)}`}`.replace(/\(-/g, '(−').replace(/\+ -/g, '+ −'), RED, 22, 'middle'); }
    return g;
  },

  // "complex x y w h z=3,4;-2,1 conj=1 | z,w" — Argand plane: a + bi as point and arrow, modulus |z| and argument θ
  complex: ([x = 160, y = 40, w = 640, h = 460], o, t, parent) => {
    const g = mk('g', {}, parent), Z = plist(o.z || '3,4');
    if (!Z.length) throw new Error('complex: z needs a,b');
    const names = t ? words(t) : Z.length === 1 ? ['z'] : Z.map((_, i) => `z${sub(i + 1)}`), conj = o.conj === '1';
    const m = Math.ceil(Math.max(1, ...Z.flatMap(([a, b]) => [Math.abs(a), Math.abs(b)]))) + 1, yr = [conj || Z.some(p => p[1] < 0) ? -m : -1, m], xr = [Z.some(p => p[0] < 0) ? -m : -1, m];
    const f = frame(g, x, y, w, h, xr, yr, { grid: true, eq: true, unit: m <= 12, xl: 'Re', yl: 'Im' });
    const cs = (a, b) => minus(a && b ? `${fmt(a)} ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : fmt(Math.abs(b))}i` : b ? `${b === 1 ? '' : b === -1 ? '-' : fmt(b)}i` : fmt(a));
    const rows = [];
    Z.forEach(([a, b], i) => { const col = [RED, INK.blue, INK.green, PURPLE][i % 4], r2 = snap(a * a + b * b), r = Math.sqrt(r2), th = Math.atan2(b, a) / RAD;
      dash(g, [[f.X(a), f.Y(0)], [f.X(a), f.Y(b)], [f.X(0), f.Y(b)]], INK.sky, 2);
      if (i < 2 && (a || b)) { const ar = 26 + i * 16; line(g, arcD(f.X(0), f.Y(0), ar, 0, th), col, 2.4); const [lx, ly] = pol(f.X(0), f.Y(0), ar + 14, th / 2); label(g, lx, ly + 6, 'θ', col, 18, 'middle'); }
      arrow(g, f.X(0), f.Y(0), f.X(a), f.Y(b), col, 4, 15); dot(g, f.X(a), f.Y(b), 6, '#ffffff', col);
      label(g, f.X(a) + (a >= 0 ? 10 : -10), f.Y(b) + (b >= 0 ? -12 : 26), `${names[i]} = ${cs(a, b)}`, col, 22, a >= 0 ? 'start' : 'end');
      if (conj) { dash(g, [[f.X(0), f.Y(0)], [f.X(a), f.Y(-b)]], col, 2.6); dot(g, f.X(a), f.Y(-b), 6, '#ffffff', col);
        label(g, f.X(a) + (a >= 0 ? 10 : -10), f.Y(-b) + (b >= 0 ? 26 : -12), `${names[i]}̄ = ${cs(a, -b)}`, col, 20, a >= 0 ? 'start' : 'end'); }
      rows.push([`|${names[i]}| = ${Number.isInteger(r) ? r : `√${fmt(r2)} ≈ ${fmt(r)}`},  θ = ${minus(fmt(th))}°`, col]);
      f.scr.push(...Array.from({ length: 12 }, (_, k) => [f.X(a * k / 11), f.Y(b * k / 11)]), [f.X(a) + 60, f.Y(b) - 12]); });
    if (showLab(o)) block(g, f, rows, 20);
    return g;
  },

  // "polar cx cy r k=rose|cardioid|limacon|spiral|circle a=1 n=3 b=0.5 f= | label" — polar grid and r(θ) curve, petals counted
  polar: ([cx = 560, cy = 270, R = 210], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.f ? 'custom' : o.k || 'rose', a = opt(o, 'a', 1), n = opt(o, 'n', 3), b = opt(o, 'b', .5);
    const C = { rose: [th => a * Math.cos(n * th), TAU, `r = ${a === 1 ? '' : fmt(a) + ' '}cos(${fmt(n)}θ)`, Number.isInteger(n) ? `rose: ${n % 2 ? n : 2 * n} petals` : 'rose'],
      cardioid: [th => a * (1 + Math.cos(th)), TAU, a === 1 ? 'r = 1 + cos θ' : `r = ${fmt(a)}(1 + cos θ)`, 'cardioid (heart shape)'],
      limacon: [th => b + a * Math.cos(th), TAU, `r = ${fmt(b)} + ${a === 1 ? '' : fmt(a) + ' '}cos θ`, Math.abs(b) < Math.abs(a) ? 'limaçon with inner loop' : 'limaçon'],
      spiral: [th => a * th, 2 * TAU, `r = ${a === 1 ? '' : fmt(a)}θ`, 'spiral of Archimedes'], circle: [() => a, TAU, `r = ${fmt(a)}`, 'circle'],
      custom: [o.f ? compile(o.f, ['t'], 'polar') : null, opt(o, 'turns', 1) * TAU, `r = ${pretty(o.f)}`, ''] }[k];
    if (!C) throw new Error(`polar: unknown k="${k}"`);
    if (!a && k !== 'limacon') throw new Error('polar: a must not be 0');
    const Fr = C[0], N = 900, S = Array.from({ length: N + 1 }, (_, i) => { const th = C[1] * i / N; return [th, Fr(th)]; });
    const rs = S.map(p => Math.abs(p[1])).filter(Number.isFinite); if (!rs.length) throw new Error('polar: r has no values');
    const rmax = niceRange(0, Math.max(...rs), 4)[1] || 1, st = niceStep(rmax, 4), s = R / rmax;
    line(g, ticks(st, rmax, 0, st).map(v => ring(cx, cy, v * s)).join(' '), SOFT, 1.6);
    line(g, Array.from({ length: 12 }, (_, i) => `M${cx} ${cy} L${pol(cx, cy, R, i * 30).join(' ')}`).join(' '), SOFT, 1.4);
    line(g, `M${cx - R - 14} ${cy} L${cx + R + 14} ${cy} M${cx} ${cy - R - 14} L${cx} ${cy + R + 14}`, K, 2.4);
    ticks(st, rmax, 0, st).forEach(v => label(g, cx + v * s + 3, cy + 20, fmt(v), TICK, 15, 'start'));
    for (let i = 0; i < 12; i++) { const [lx, ly] = pol(cx, cy, R + 22, i * 30); label(g, lx, ly + 6, o.rad === '1' ? piLabel(i * Math.PI / 6) : `${i * 30}°`, TXT.sky, 15, 'middle'); }
    let d = '', pen = false; S.forEach(([th, r]) => { if (!Number.isFinite(r)) { pen = false; return; } const [px, py] = pol(cx, cy, r * s, th / RAD); d += `${pen ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)} `; pen = true; });
    if (k !== 'spiral') wash(g, d, FILL.orange, { opacity: .35 });
    line(g, d, RED, 4);
    if (t || showLab(o)) label(g, cx - R - 50, cy - R + 20, t || C[2], RED, 26, 'end');
    if (C[3] && showLab(o)) label(g, cx - R - 50, cy - R + 56, C[3], TXT.blue, 20, 'end');
    return g;
  },

  // "conic x y w h k=circle|ellipse|parabola|hyperbola a=4 b=3 p=1 c=h,k | label" — the curve on a grid with foci, vertices, directrix or asymptotes
  conic: ([x = 180, y = 30, w = 600, h = 480], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'ellipse', a = opt(o, 'a', 4), b = opt(o, 'b', 3), p = opt(o, 'p', 1), [h0 = 0, k0 = 0] = nlist(o.c || '0,0');
    if (!(a > 0 && b > 0)) throw new Error('conic: a and b must be above 0');
    if (k === 'parabola' && !p) throw new Error('conic: p must not be 0');
    const sq = (v, n) => (v ? `(${n} ${v > 0 ? '−' : '+'} ${fmt(Math.abs(v))})²` : `${n}²`), rows = [];
    let pts = [], pts2 = null, ext;
    if (k === 'circle' || k === 'ellipse') { const B = k === 'circle' ? a : b; pts = Array.from({ length: 241 }, (_, i) => [h0 + a * Math.cos(TAU * i / 240), k0 + B * Math.sin(TAU * i / 240)]); ext = Math.max(a, B) * 1.25; }
    else if (k === 'parabola') { const X = 4 * Math.abs(p); pts = Array.from({ length: 121 }, (_, i) => { const u = -X + 2 * X * i / 120; return [h0 + u, k0 + u * u / (4 * p)]; }); ext = X * 1.1; }
    else if (k === 'hyperbola') { const c = Math.hypot(a, b), U = Math.acosh((c + a * 1.2) / a);
      pts = Array.from({ length: 121 }, (_, i) => { const u = -U + 2 * U * i / 120; return [h0 + a * Math.cosh(u), k0 + b * Math.sinh(u)]; }); pts2 = pts.map(([u, v]) => [2 * h0 - u, v]); ext = (c + a * 1.2) * 1.1; }
    else throw new Error(`conic: unknown k="${k}"`);
    const xr = [h0 - ext, h0 + ext], yr = k === 'parabola' ? (p > 0 ? [k0 - 2 * Math.abs(p), k0 + ext] : [k0 - ext, k0 + 2 * Math.abs(p)]) : [k0 - ext, k0 + ext];
    const f = frame(g, x, y, w, h, xr, yr, { grid: true, eq: true, unit: ext * 2 <= 24, xl: 'x', yl: 'y' }), S = ([u, v]) => [f.X(u), f.Y(v)];
    const mark = (u, v, col, nm, dy = -12) => { dot(g, f.X(u), f.Y(v), 6, '#ffffff', col); label(g, f.X(u) + 8, f.Y(v) + dy, minus(`${nm}(${fmt(u)}, ${fmt(v)})`), col, 18); f.scr.push([f.X(u) + 40, f.Y(v) - 10]); };
    if (k === 'hyperbola') { [1, -1].forEach(sg => dash(g, [S([h0 - ext * 2, k0 - sg * b / a * ext * 2]), S([h0 + ext * 2, k0 + sg * b / a * ext * 2])], INK.green, 2.2, { 'clip-path': f.clip })); }
    if (k === 'parabola') { dash(g, [S([xr[0], k0 - p]), S([xr[1], k0 - p])], INK.green, 2.4); label(g, f.px + f.pw - 4, f.Y(k0 - p) + (p > 0 ? 24 : -10), minus(`${showLab(o) ? 'directrix ' : ''}y = ${fmt(k0 - p)}`), TXT.green, 18, 'end'); }
    wash(g, polyD(pts.map(S), k !== 'parabola' && k !== 'hyperbola'), FILL.blue, { opacity: k === 'circle' || k === 'ellipse' ? .45 : 0 });
    line(g, polyD(pts.map(S), k === 'circle' || k === 'ellipse'), RED, 4, { 'clip-path': f.clip });
    if (pts2) line(g, polyD(pts2.map(S), false), RED, 4, { 'clip-path': f.clip });
    f.scr.push(...pts.map(S), ...(pts2 || []).map(S));
    if (k === 'circle') { line(g, `M${f.X(h0)} ${f.Y(k0)} L${f.X(h0 + a * Math.cos(.7))} ${f.Y(k0 + a * Math.sin(.7))}`, INK.blue, 3);
      label(g, f.X(h0 + a * .5 * Math.cos(.7)) - 8, f.Y(k0 + a * .5 * Math.sin(.7)) - 8, `r = ${fmt(a)}`, TXT.blue, 20, 'end'); dot(g, f.X(h0), f.Y(k0), 5, K);
      rows.push([`${sq(h0, 'x')} + ${sq(k0, 'y')} = ${fmt(a * a)}`, RED]); }
    if (k === 'ellipse') { const c = Math.sqrt(Math.abs(a * a - b * b)), hor = a >= b, M = Math.max(a, b);
      [1, -1].forEach(sg => mark(h0 + (hor ? sg * c : 0), k0 + (hor ? 0 : sg * c), RED, `F${sub(sg > 0 ? 1 : 2)}`, sg > 0 || hor ? -12 : 26));
      rows.push([`${sq(h0, 'x')}/${fmt(a * a)} + ${sq(k0, 'y')}/${fmt(b * b)} = 1`, RED], [`foci ${fmt(c)} from the centre`, K], [`e = c/a = ${fm(c / M, 3)}`, TXT.blue]); }
    if (k === 'parabola') { mark(h0, k0 + p, RED, 'F', p > 0 ? 24 : -12); dot(g, f.X(h0), f.Y(k0), 5, K);
      rows.push([`${sq(h0, 'x')} = ${fmt(4 * p)}${k0 ? sq(k0, 'y').replace('²', '') : 'y'}`, RED], [`focus ${fmt(Math.abs(p))} from the vertex, e = 1`, K]); }
    if (k === 'hyperbola') { const c = Math.hypot(a, b); [1, -1].forEach(sg => { mark(h0 + sg * c, k0, RED, `F${sub(sg > 0 ? 1 : 2)}`, -12); dot(g, f.X(h0 + sg * a), f.Y(k0), 5, K); });
      rows.push([`${sq(h0, 'x')}/${fmt(a * a)} − ${sq(k0, 'y')}/${fmt(b * b)} = 1`, RED], [`asymptotes slope ±${fmt(b / a)}`, TXT.green], [`e = c/a = ${fm(c / a, 3)}`, TXT.blue]); }
    if (t) rows.unshift([t, TXT.blue]);
    block(g, f, showLab(o) ? rows : rows.slice(0, t ? 1 : 0), 20);
    return g;
  },

  // "transform x y w h pts=1,1;4,1;1,3 k=translate|reflect|rotate|dilate by=3,-2 ax=x|y|yx|ynx deg=90 s=2 c=0,0 | A,B,C"
  //   — shape before (blue) and after (red) on a grid, with the rule
  transform: ([x = 180, y = 30, w = 600, h = 480], o, t, parent) => {
    const g = mk('g', {}, parent), P = plist(o.pts || '1,1;4,1;1,3'), k = o.k || 'translate', names = t ? words(t) : P.map((_, i) => String.fromCharCode(65 + i));
    if (!P.length) throw new Error('transform: pts needs at least one point');
    const [cxv = 0, cyv = 0] = nlist(o.c || '0,0'), atO = !cxv && !cyv, at = atO ? 'the origin' : `(${fmt(cxv)}, ${fmt(cyv)})`; let M, rule, extra = [];
    if (k === 'translate') { const [dx = 3, dy = -2] = nlist(o.by || '3,-2'); M = ([u, v]) => [u + dx, v + dy];
      rule = minus(`(x, y) → (x ${dx < 0 ? '-' : '+'} ${fmt(Math.abs(dx))}, y ${dy < 0 ? '-' : '+'} ${fmt(Math.abs(dy))})`); }
    else if (k === 'reflect') { const ax = o.ax || 'y', R = { x: [([u, v]) => [u, -v], '(x, y) → (x, −y)', 'in the x-axis'], y: [([u, v]) => [-u, v], '(x, y) → (−x, y)', 'in the y-axis'],
        yx: [([u, v]) => [v, u], '(x, y) → (y, x)', 'in the line y = x'], ynx: [([u, v]) => [-v, -u], '(x, y) → (−y, −x)', 'in the line y = −x'] }[ax];
      if (!R) throw new Error(`transform: unknown ax="${ax}" (x, y, yx or ynx)`); [M, rule] = R; extra = [ax, R[2]]; }
    else if (k === 'rotate') { const d = opt(o, 'deg', 90), c = Math.cos(d * RAD), s = Math.sin(d * RAD);
      M = ([u, v]) => [snap(cxv + (u - cxv) * c - (v - cyv) * s), snap(cyv + (u - cxv) * s + (v - cyv) * c)];
      rule = minus(atO && d % 90 === 0 ? { 0: '(x, y) → (x, y)', 90: '(x, y) → (−y, x)', 180: '(x, y) → (−x, −y)', 270: '(x, y) → (y, −x)' }[((d % 360) + 360) % 360] : `turn ${fmt(d)}° about ${at}`); extra = [d]; }
    else if (k === 'dilate') { const s = opt(o, 's', 2); if (!s) throw new Error('transform: scale factor s must not be 0');
      M = ([u, v]) => [cxv + s * (u - cxv), cyv + s * (v - cyv)]; rule = atO ? minus(`(x, y) → (${fmt(s)}x, ${fmt(s)}y)`) : `scale ×${fmt(s)} from ${at}`; extra = [s]; }
    else throw new Error(`transform: unknown k="${k}"`);
    const Q = P.map(M), all = [...P, ...Q, ...(k === 'rotate' || k === 'dilate' ? [[cxv, cyv]] : [])];
    const xr = [Math.floor(Math.min(0, ...all.map(p => p[0]))) - 1, Math.ceil(Math.max(0, ...all.map(p => p[0]))) + 1], yr = [Math.floor(Math.min(0, ...all.map(p => p[1]))) - 1, Math.ceil(Math.max(0, ...all.map(p => p[1]))) + 1];
    const f = frame(g, x, y, w, h, xr, yr, { grid: true, eq: true, unit: Math.max(xr[1] - xr[0], yr[1] - yr[0]) <= 24 }), S = ([u, v]) => [f.X(u), f.Y(v)];
    if (k === 'reflect') { const L = 40, ln = { x: [[-L, 0], [L, 0]], y: [[0, -L], [0, L]], yx: [[-L, -L], [L, L]], ynx: [[-L, L], [L, -L]] }[extra[0]];
      dash(g, ln.map(S), RED, 3, { 'clip-path': f.clip }); P.forEach((p, i) => dash(g, [S(p), S(Q[i])], INK.sky, 1.8)); }
    if (k === 'translate') P.forEach((p, i) => { const [a0, a1] = S(p), [b0, b1] = S(Q[i]), L = Math.hypot(b0 - a0, b1 - a1) || 1; if (L > 30) arrow(g, a0 + (b0 - a0) * 10 / L, a1 + (b1 - a1) * 10 / L, b0 - (b0 - a0) * 10 / L, b1 - (b1 - a1) * 10 / L, INK.sky, 2.4, 11); });
    if (k === 'dilate') P.forEach((p, i) => dash(g, [S([cxv, cyv]), S(Math.abs(extra[0]) >= 1 ? Q[i] : p)], INK.sky, 1.8));
    if (k === 'rotate' && P.length) { const [u, v] = P[0], r = Math.hypot(u - cxv, v - cyv) * (f.pw / (f.xr[1] - f.xr[0])), a0 = Math.atan2(v - cyv, u - cxv) / RAD;
      if (r > 8) { line(g, arcD(f.X(cxv), f.Y(cyv), r, a0, a0 + extra[0]), INK.orange, 2.6); const e = pol(f.X(cxv), f.Y(cyv), r, a0 + extra[0]), e0 = pol(f.X(cxv), f.Y(cyv), r, a0 + extra[0] - Math.sign(extra[0]) * 8);
        line(g, head(...e, ...e0, 12), INK.orange, 2.6, { class: 'ink head' }); } }
    if (k === 'rotate' || k === 'dilate') dot(g, f.X(cxv), f.Y(cyv), 6, FILL.yellow, K);
    if (P.length > 2) { wash(g, polyD(P.map(S)), FILL.blue, { opacity: .55 }); wash(g, polyD(Q.map(S)), FILL.red, { opacity: .45 }); }
    line(g, polyD(P.map(S), P.length > 2), INK.blue, 3.4); line(g, polyD(Q.map(S), P.length > 2), RED, 3.4);
    const cen = A => [A.reduce((s, p) => s + p[0], 0) / A.length, A.reduce((s, p) => s + p[1], 0) / A.length];
    [[P, INK.blue, ''], [Q, RED, '′']].forEach(([A, col, pr]) => { const [gx, gy] = S(cen(A));
      A.forEach((p, i) => { const [px, py] = S(p), dx = px - gx, dy = py - gy, L = Math.hypot(dx, dy) || 1; dot(g, px, py, 4.5, '#ffffff', col);
        label(g, px + dx / L * 16, py + dy / L * 16 + 7, `${names[i] || ''}${pr}${P.length <= 4 ? `(${minus(fmt(p[0]))}, ${minus(fmt(p[1]))})` : ''}`, col, 17, dx / L > .3 ? 'start' : dx / L < -.3 ? 'end' : 'middle'); f.scr.push([px + dx / L * 30, py + dy / L * 16]); }); });
    if (showLab(o)) block(g, f, [[`${{ translate: 'translation', reflect: `reflection ${extra[1] || ''}`, rotate: 'rotation', dilate: 'dilation (enlargement)' }[k]}`, TXT.blue], [rule, RED]], 20);
    return g;
  },
});
})();
