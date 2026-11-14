// Whiteboard school maths (grades 3–8, 21 Oct 2026): the written methods and models a school lesson draws — a clock,
// a bar model, column sums with their carries, long division, a double number line / ratio table. Every digit, carry
// and tick is computed from the call, never typed by the model, so the board is always right. Subject-only category:
// listed only in the maths subject's prompt. Wrapped in a block so the helpers stay private.
(() => {
const K = '#2f3640', SOFT = '#cfd8e0', TICK = '#4a5560', RED = '#c0392b';
const PAL = ['#7fb7ea', '#f4a531', '#5fae3a', '#ffd84a', '#b48ad8', '#4fc1b0', '#f08a9a', '#e04b3a'];
const RAD = Math.PI / 180;

const nlist = s => String(s ?? '').split(',').filter(x => x.trim() !== '').map(Number).filter(Number.isFinite);
const words = s => String(s ?? '').split(',').map(x => x.trim().replace(/_/g, ' '));
const opt = (o, k, d) => (o[k] === undefined || o[k] === '' || !Number.isFinite(+o[k]) ? d : +o[k]);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = v => { const r = Math.round(v * 1000) / 1000; return (Object.is(r, -0) ? 0 : r).toLocaleString('en-US', { maximumFractionDigits: 3 }); };
const rectD = (x, y, w, h) => `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
const pol = (cx, cy, r, a) => [cx + r * Math.cos(a * RAD), cy + r * Math.sin(a * RAD)];   // screen angles: 0° = 3 o'clock, clockwise
const ring = (cx, cy, r) => `M${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy}`;
const wash = (g, d, fill, extra = {}) => mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable', ...extra }, g);
const arrow = (g, x0, y0, x1, y1, col = K, w = 3, h = 13) => { line(g, `M${x0} ${y0} L${x1} ${y1}`, col, w); line(g, head(x1, y1, x0, y0, h), col, w, { class: 'ink head' }); };
const tw = (s, size) => String(s).length * size * 0.5;
const showLab = o => o.lab !== '0' && o.labels !== '0';
// a curly brace over (or under, dir=1) the span x0..x1 at height y
const brace = (g, x0, x1, y, dir = -1, col = K) => { const m = (x0 + x1) / 2, h = 14 * dir;
  line(g, `M${x0} ${y} Q${x0} ${y + h} ${x0 + 12} ${y + h} L${m - 10} ${y + h} Q${m} ${y + h} ${m} ${y + 2 * h} Q${m} ${y + h} ${m + 10} ${y + h} L${x1 - 12} ${y + h} Q${x1} ${y + h} ${x1} ${y}`, col, 2.6); return y + 2 * h; };

// digits of a non-negative decimal written with `dp` places, as a string with no point ("12.5", dp 2 → "1250")
const scaled = (v, dp) => String(Math.round(Math.abs(v) * 10 ** dp));
const dpOf = v => { const s = String(v); return s.includes('.') ? s.split('.')[1].length : 0; };

Object.assign(window.RECIPES, {
  // "timeclock cx cy r h=3 m=40 to=4:15 dig=1 | label" — a clock face set to h:m; to= shades the time that passes up to
  // that time (minute hand sweep) and writes how long it took; dig=1 writes the digital time under it
  timeclock: ([cx = 480, cy = 260, r = 170], o, t, parent) => {
    const g = mk('g', {}, parent), h = ((Math.round(opt(o, 'h', 3)) % 12) + 12) % 12, m = clamp(Math.round(opt(o, 'm', 0)), 0, 59);
    const hand = (deg, len, w, col) => { const [x, y] = pol(cx, cy, len, deg - 90); line(g, `M${cx} ${cy} L${x} ${y}`, col, w); };
    const mDeg = mm => mm * 6, hDeg = (hh, mm) => (hh % 12) * 30 + mm * 0.5;
    wash(g, ring(cx, cy, r), '#fdfcf6');
    const to = /^(\d{1,2}):(\d{2})$/.exec(o.to ?? '');
    if (to) {                                                   // the minutes that pass, as a shaded sweep from now to then
      const th = +to[1], tm = clamp(+to[2], 0, 59), start = h * 60 + m;
      let mins = (((th % 12) * 60 + tm) - start + 720) % 720;
      const a0 = mDeg(m) - 90, sweep = Math.min(mins, 60) * 6, a1 = a0 + sweep;
      if (sweep > 0 && sweep < 360) { const [x0, y0] = pol(cx, cy, r * .86, a0), [x1, y1] = pol(cx, cy, r * .86, a1);
        wash(g, `M${cx} ${cy} L${x0} ${y0} A${r * .86} ${r * .86} 0 ${sweep > 180 ? 1 : 0} 1 ${x1} ${y1} Z`, '#ffe08a'); }
      else if (sweep >= 360) wash(g, ring(cx, cy, r * .86), '#ffe08a');
      if (showLab(o)) { const hrs = Math.floor(mins / 60), mm = mins % 60;
        label(g, cx, cy + r + (o.dig === '1' ? 92 : 50), `${hrs ? `${hrs} h ` : ''}${mm || !hrs ? `${mm} min` : ''}`.trim(), TXT.orange, 30, 'middle'); }
    }
    line(g, ring(cx, cy, r), K, 4);
    for (let i = 0; i < 60; i++) { const big = i % 5 === 0, [x0, y0] = pol(cx, cy, r * (big ? .88 : .93), i * 6 - 90), [x1, y1] = pol(cx, cy, r * .98, i * 6 - 90);
      line(g, `M${x0} ${y0} L${x1} ${y1}`, big ? K : TICK, big ? 3 : 1.6); }
    for (let n = 1; n <= 12; n++) { const [x, y] = pol(cx, cy, r * .74, n * 30 - 90); label(g, x, y + r * .07, String(n), K, Math.max(16, r * .17), 'middle'); }
    hand(hDeg(h, m), r * .5, 8, K);
    hand(mDeg(m), r * .78, 5, INK.blue);
    wash(g, ring(cx, cy, 8), K);
    if (o.dig === '1') label(g, cx, cy + r + 46, `${h || 12}:${String(m).padStart(2, '0')}`, INK.blue, 36, 'middle');
    if (t) label(g, cx, cy - r - 22, t, TXT.blue, 26, 'middle');
    return g;
  },

  // "tape x y w h parts=4,4,4 q=2 total=12 rows=1 | names" — a bar model (tape diagram): each part a box sized by its
  // value with the value inside ("?" for q=<part number>, 1-based); a brace above shows total= (or the sum).
  // Two bars to compare: parts=8;5 (rows split by ";"), names = one per row; the gap shows as a dashed "?" box.
  tape: ([x = 120, y = 180, w = 720, h = 70], o, t, parent) => {
    const g = mk('g', {}, parent), rows = String(o.parts || '4,4,4').split(';').map(nlist).filter(r => r.length).slice(0, 3);
    if (!rows.length) throw new Error('tape: parts= needs numbers');
    const names = t ? words(t) : [], q = String(o.q ?? '').split(',').map(Number), big = Math.max(...rows.map(r => r.reduce((s, v) => s + v, 0)), 1e-9);
    const nameW = names.some(Boolean) ? Math.min(160, Math.max(...names.map(s => tw(s, 24))) + 20) : 0, bx = x + nameW, bw = w - nameW, gap = h * .7;
    rows.forEach((r, ri) => {
      const yy = y + ri * (h + gap), unit = bw / big; let cx = bx;
      r.forEach((v, i) => { const pw = v * unit, ask = rows.length === 1 && q.includes(i + 1);
        wash(g, rectD(cx, yy, pw, h), ask ? '#ffffff' : PAL[(ri * 3 + i) % PAL.length], { opacity: .75 });
        line(g, rectD(cx, yy, pw, h), K, 3);
        if (pw > 18) label(g, cx + pw / 2, yy + h / 2 + 10, ask ? '?' : fmt(v), ask ? RED : K, clamp(Math.min(h * .45, pw * .5), 14, 32), 'middle');
        cx += pw; });
      if (names[ri]) label(g, bx - 14, yy + h / 2 + 9, names[ri], TXT.blue, 24, 'end');
      if (rows.length > 1 && ri > 0 && r.reduce((s, v) => s + v, 0) < big - 1e-9) {     // the difference to the longest bar
        const end = bx + r.reduce((s, v) => s + v, 0) * unit, dw = bx + bw - end;
        line(g, `M${end} ${yy} L${end + dw} ${yy} M${end + dw} ${yy} L${end + dw} ${yy + h} M${end} ${yy + h} L${end + dw} ${yy + h}`, RED, 2.4);
        label(g, end + dw / 2, yy + h / 2 + 10, o.diff === '1' ? fmt(big - r.reduce((s, v) => s + v, 0)) : '?', RED, 26, 'middle');
      }
    });
    if (rows.length === 1 && o.total !== '0') {
      const top = brace(g, bx, bx + bw, y - 8);
      label(g, bx + bw / 2, top - 10, o.total ? String(o.total).replace(/_/g, ' ') : fmt(rows[0].reduce((s, v) => s + v, 0)), o.total === '?' ? RED : TXT.orange, 30, 'middle');
    }
    return g;
  },

  // "column x y size a=347 b=285 op=+|-|x carry=1 ans=1 | label" — the written column method, digits in place-value
  // columns (H T O shown over them, lab=0 hides). + writes the carries, − the borrows (crossed digit, new digit
  // above), x (two-digit b) the partial products then their sum. Decimals line up on the point (a=12.5 b=3.75).
  // ans=0 leaves the answer row empty (to fill in with a later write of the same line at ans=1).
  column: ([x = 360, y = 90, S = 56], o, t, parent) => {
    const g = mk('g', {}, parent), op = ['-', '−'].includes(o.op) ? '-' : ['x', '×', '*'].includes(o.op) ? 'x' : '+';
    const A = opt(o, 'a', 347), B = opt(o, 'b', 285), show = o.ans !== '0', carryOn = o.carry !== '0';
    const fs = S * .8, small = S * .42;
    if (op === 'x') {
      const ai = Math.round(Math.abs(A)), bi = Math.round(Math.abs(B)), bd = String(bi).split('').map(Number).reverse();
      const partial = bd.map((d, i) => ai * d * 10 ** i), prod = ai * bi;
      const cols = Math.max(String(prod).length, String(ai).length, String(bi).length + 1) + 1;
      const right = x + cols * S, cell = (s, row, col, colr = K, size = fs) => label(g, right - (col + .5) * S, y + row * S * 1.15 + fs, s, colr, size, 'middle');
      const num = (n, row, colr = K) => String(n).split('').reverse().forEach((c, i) => cell(c, row, i, colr));
      num(ai, 0); num(bi, 1); cell('×', 1, String(bi).length, K);
      line(g, `M${right - cols * S} ${y + 2 * S * 1.15 + 10} L${right} ${y + 2 * S * 1.15 + 10}`, K, 3);
      if (show) {
        partial.forEach((p, i) => { num(p, 2 + i, i ? TXT.green : TXT.blue); if (i && carryOn) cell(`(${String(bd[i])}${'0'.repeat(i)})`, 2 + i, String(p).length + .6, TICK, small); });
        if (partial.length > 1) {
          const ly = y + (2 + partial.length) * S * 1.15 + 10;
          line(g, `M${right - cols * S} ${ly} L${right} ${ly}`, K, 3); cell('+', 1 + partial.length, String(Math.max(...partial)).length, K);
          num(prod, 2 + partial.length, RED);
        }
      }
      if (t) label(g, right + 30, y + fs, t, TXT.blue, 26);
      return g;
    }
    const dp = Math.max(dpOf(A), dpOf(B)), big = Math.max(Math.abs(A), Math.abs(B)), sml = Math.min(Math.abs(A), Math.abs(B));
    const top = op === '-' ? big : Math.abs(A), bot = op === '-' ? sml : Math.abs(B);
    const res = op === '-' ? top - bot : top + bot;
    const ta = scaled(top, dp), tb = scaled(bot, dp), tr = scaled(res, dp);
    const L = Math.max(ta.length, tb.length, tr.length, dp + 1), cols = L + 1;
    const right = x + cols * S + (dp ? S * .3 : 0);
    const colX = i => right - (i + .5) * S - (dp && i >= dp ? S * .3 : 0);    // i = place from the right (0 = last digit)
    const rowY = r => y + S * .9 + r * S * 1.15 + fs;
    const pad = s => s.padStart(Math.max(s.length, dp + 1), '0');
    const write = (s, r, col = K) => pad(s).split('').reverse().forEach((c, i) => label(g, colX(i), rowY(r), c, col, fs, 'middle'));
    if (showLab(o)) { const PL = ['O', 'T', 'H', 'Th', 'TTh', 'HTh'], DL = ['t', 'h', 'th'];
      for (let i = 0; i < L; i++) { const nm = i < dp ? DL[dp - 1 - i] : PL[i - dp]; if (nm) label(g, colX(i), y + small, nm, TICK, small, 'middle'); } }
    write(ta, 0); write(tb, 1); label(g, right - (cols - .5) * S - (dp ? S * .3 : 0), rowY(1), op === '-' ? '−' : '+', K, fs, 'middle');
    if (dp) for (let r = 0; r < 3; r++) if (r < 2 || show) label(g, right - dp * S - S * .15, rowY(r), '.', K, fs, 'middle');
    const ly = rowY(1) + S * .35;
    line(g, `M${right - cols * S - (dp ? S * .3 : 0)} ${ly} L${right} ${ly}`, K, 3);
    if (carryOn) {
      const da = pad(ta).split('').reverse().map(Number), db = pad(tb).split('').reverse().map(Number);
      if (op === '+') { let c = 0;
        for (let i = 0; i < L; i++) { const s = (da[i] || 0) + (db[i] || 0) + c; c = s >= 10 ? 1 : 0;
          if (c && i + 1 < L + 1) label(g, colX(i + 1) + S * .28, rowY(0) - fs * .95, '1', RED, small, 'middle'); } }
      else { const d = [...da];                                    // borrow: cross out, write the new digit above
        for (let i = 0; i < L; i++) {
          if ((d[i] ?? 0) >= (db[i] || 0)) continue;
          let j = i + 1; while (j < L && !d[j]) j++;
          if (j >= L) break;
          for (let k = j; k > i; k--) { d[k] = k === j ? d[k] - 1 : 9;
            line(g, `M${colX(k) - fs * .3} ${rowY(0) - fs * .15} L${colX(k) + fs * .3} ${rowY(0) - fs * .75}`, RED, 2.6);
            label(g, colX(k), rowY(0) - fs * 1.05, String(d[k]), RED, small, 'middle'); }
          d[i] += 10; label(g, colX(i) - S * .32, rowY(0) - fs * .55, '1', RED, small, 'middle');
        } }
    }
    if (show) write(tr, 2, RED);
    if (t) label(g, right + 30, rowY(1), t, TXT.blue, 26);
    return g;
  },

  // "longdiv x y size n=852 d=4 steps=1 | label" — long division: the divisor, the bracket, the quotient digit by
  // digit, and under it each multiply-and-subtract with the next digit brought down; the remainder is written "r 2".
  // steps=0 draws only the set-up (divisor, bracket, number) for the voice to work through.
  longdiv: ([x = 300, y = 70, S = 50], o, t, parent) => {
    const g = mk('g', {}, parent), n = Math.max(0, Math.round(opt(o, 'n', 852))), d = Math.max(1, Math.round(opt(o, 'd', 4)));
    const ns = String(n), fs = S * .8, dw = tw(d, fs) + S * .6, x0 = x + dw, colX = i => x0 + (i + .5) * S, rowY = r => y + S * 1.2 + r * S * 1.05 + fs;
    label(g, x0 - S * .35, rowY(0), String(d), K, fs, 'end');
    line(g, `M${x0} ${rowY(0) + S * .3} Q${x0 + S * .3} ${rowY(0) - fs * .4} ${x0} ${rowY(0) - fs - S * .25} L${x0 + ns.length * S + S * .4} ${rowY(0) - fs - S * .25}`, K, 3.4);
    ns.split('').forEach((c, i) => label(g, colX(i), rowY(0), c, K, fs, 'middle'));
    const num = (v, r, end, col, last) => String(v).split('').reverse().forEach((c, k) => label(g, colX(end - k), rowY(r), c, k === 0 && last ? last : col, fs * .9, 'middle'));
    if (o.steps !== '0') {
      let i = 0, cur = +ns[0], row = 1;
      while (i < ns.length - 1 && cur < d) { i++; cur = cur * 10 + +ns[i]; }      // first part big enough to share
      for (;;) {
        const qd = Math.floor(cur / d), sub = qd * d, wide = Math.max(String(cur).length, String(sub).length);
        label(g, colX(i), rowY(0) - fs - S * .45, String(qd), RED, fs, 'middle');
        num(sub, row, i, TXT.blue);
        label(g, colX(i - wide + 1) - S * .6, rowY(row), '−', TXT.blue, fs * .9, 'middle');
        line(g, `M${colX(i - wide + 1) - S * .4} ${rowY(row) + S * .25} L${colX(i) + S * .4} ${rowY(row) + S * .25}`, K, 2.4);
        const left = cur - sub; row++;
        if (i === ns.length - 1) {
          num(left, row, i, K);
          if (left && showLab(o)) label(g, colX(i) + S * .7, rowY(0) - fs - S * .45, `r ${left}`, RED, fs * .8, 'start');
          break;
        }
        i++; cur = left * 10 + +ns[i];
        num(cur, row, i, K, TXT.orange);                                            // what is left, next digit brought down
        arrow(g, colX(i), rowY(0) + S * .3, colX(i), rowY(row) - fs * .95, TXT.orange, 2, 9);
        row++;
        if (row > 14) break;
      }
    }
    if (t) label(g, x0 + ns.length * S + S * 1.6, rowY(0), t, TXT.blue, 26);
    return g;
  },

  // "ratiotable x y w a=2 b=3 k=4 k=line|table | top name,bottom name" — equal ratios a:b, 2a:2b … k·a:k·b, as a
  // double number line (two lines, matching ticks, 0 at the left) or as a two-row ratio table with ×n arrows.
  // hi=3 rings column 3 (the one the lesson asks about); q=3 writes "?" in the bottom row of column 3.
  ratiotable: ([x = 120, y = 170, w = 720], o, t, parent) => {
    const g = mk('g', {}, parent), a = opt(o, 'a', 2), b = opt(o, 'b', 3), n = clamp(Math.round(opt(o, 'n', 4)), 1, 10);
    const names = t ? words(t) : ['', ''], hi = Math.round(opt(o, 'hi', 0)), q = Math.round(opt(o, 'q', 0));
    const nameW = names.some(Boolean) ? Math.min(170, Math.max(...names.map(s => tw(s, 24))) + 24) : 0, x0 = x + nameW, W = w - nameW;
    if (o.k === 'table') {
      const cw = W / n, rh = 64;
      wash(g, rectD(x0, y, W, rh), '#cfe6f8'); wash(g, rectD(x0, y + rh, W, rh), '#fde7c4');
      line(g, rectD(x0, y, W, 2 * rh), K, 3);
      line(g, [`M${x0} ${y + rh} L${x0 + W} ${y + rh}`, ...Array.from({ length: n - 1 }, (_, i) => `M${x0 + (i + 1) * cw} ${y} L${x0 + (i + 1) * cw} ${y + 2 * rh}`)].join(' '), K, 2.2);
      for (let i = 1; i <= n; i++) { const cx = x0 + (i - .5) * cw;
        label(g, cx, y + rh * .65, fmt(a * i), K, 28, 'middle');
        label(g, cx, y + rh * 1.65, q === i ? '?' : fmt(b * i), q === i ? RED : K, 28, 'middle');
        if (i > 1 && showLab(o)) { line(g, `M${x0 + .5 * cw} ${y - 8} Q${(x0 + .5 * cw + cx) / 2} ${y - 46} ${cx} ${y - 8}`, TXT.orange, 2.2);
          if (i === n || i === hi) label(g, (x0 + .5 * cw + cx) / 2, y - 40, `×${i}`, TXT.orange, 22, 'middle'); } }
      if (hi) line(g, rectD(x0 + (hi - 1) * cw + 4, y + 4, cw - 8, 2 * rh - 8), RED, 3.4);
      names.forEach((s, r) => s && label(g, x0 - 12, y + rh * (r + .62), s, TXT.blue, 24, 'end'));
      return g;
    }
    const gap = 110, step = W / (n + .4);
    for (const [r, v] of [[0, a], [1, b]]) { const yy = y + r * gap;
      arrow(g, x0, yy, x0 + W, yy, K, 3);
      for (let i = 0; i <= n; i++) { const xx = x0 + i * step;
        line(g, `M${xx} ${yy - 10} L${xx} ${yy + 10}`, K, 2.6);
        label(g, xx, r ? yy + 40 : yy - 20, r && q === i ? '?' : fmt(v * i), r && q === i ? RED : r ? TXT.orange : INK.blue, 26, 'middle'); }
      if (names[r]) label(g, x0 - 14, yy + 8, names[r], r ? TXT.orange : TXT.blue, 24, 'end'); }
    if (hi) line(g, `M${x0 + hi * step - 26} ${y - 52} L${x0 + hi * step + 26} ${y - 52} L${x0 + hi * step + 26} ${y + gap + 56} L${x0 + hi * step - 26} ${y + gap + 56} Z`, RED, 3);
    return g;
  },

  // "usmoney x y size items=q:3,d:2,n:1,p:4,b1:1,b5:1 sum=1 | label" — US money laid out to count: bills ($1 b1, $5 b5,
  // $10 b10, $20 b20) then coins (quarter q, dime d, nickel n, penny p), each its real relative size and colour, with
  // its value on it; sum=1 writes the total ("= $7.39"), computed from the items, never typed
  usmoney: ([x = 120, y = 120, S = 70], o, t, parent) => {
    const g = mk('g', {}, parent);
    const KIND = { b20: [2000, '$20'], b10: [1000, '$10'], b5: [500, '$5'], b1: [100, '$1'], q: [25, '25¢'], d: [10, '10¢'], n: [5, '5¢'], p: [1, '1¢'] };
    const R = { q: .5, n: .44, p: .39, d: .36 }, FILLC = { q: '#d5d8dc', n: '#c3c7cc', p: '#e0a066', d: '#dfe3e6' };
    const items = String(o.items || 'q:3,d:2,n:1,p:4').split(',').map(p => p.split(':')).filter(([k]) => k in KIND)
      .map(([k, n]) => [k, clamp(Math.round(+n || 0), 0, 12)]).sort((a, b) => KIND[b[0]][0] - KIND[a[0]][0]);
    let cx = x, cy = y, total = 0;
    const maxX = x + 760;
    for (const [k, n] of items) for (let i = 0; i < n; i++) {
      total += KIND[k][0];
      if (k.startsWith('b')) {
        const w = S * 2.2, h = S;
        if (cx + w > maxX) { cx = x; cy += S * 1.3; }
        wash(g, rectD(cx, cy, w, h), '#cfe8c6'); line(g, rectD(cx, cy, w, h), '#3f6b3a', 3);
        line(g, rectD(cx + 6, cy + 6, w - 12, h - 12), '#3f6b3a', 1.4);
        wash(g, ring(cx + w / 2, cy + h / 2, h * .28), '#e8f3e2'); line(g, ring(cx + w / 2, cy + h / 2, h * .28), '#3f6b3a', 1.8);
        label(g, cx + 16, cy + h * .38, KIND[k][1], '#2c4f28', S * .3); label(g, cx + w / 2, cy + h / 2 + S * .1, KIND[k][1].slice(1), '#2c4f28', S * .26, 'middle');
        cx += w + 14;
      } else {
        const r = S * R[k];
        if (cx + 2 * r > maxX) { cx = x; cy += S * 1.3; }
        wash(g, ring(cx + r, cy + S / 2, r), FILLC[k]); line(g, ring(cx + r, cy + S / 2, r), k === 'p' ? '#8a4a1e' : '#6b7178', 3);
        line(g, ring(cx + r, cy + S / 2, r * .8), k === 'p' ? '#8a4a1e' : '#6b7178', 1.2);
        label(g, cx + r, cy + S / 2 + r * .3, KIND[k][1], K, Math.max(12, r * .72), 'middle');
        cx += 2 * r + 12;
      }
    }
    if (o.sum === '1') label(g, x, cy + S * 1.75, `= $${(total / 100).toFixed(2)}`, TXT.orange, 36);
    if (t) label(g, x, y - 18, t, TXT.blue, 26);
    return g;
  },

  // "measure cx cy size k=jug|scale v=750 max=1000 step=250 u=mL | label" — a measuring jug filled to v (liquid volume)
  // or a kitchen scale whose needle points at v (mass); the marks every step= are numbered with the unit u=
  measure: ([cx = 480, cy = 270, S = 340], o, t, parent) => {
    const g = mk('g', {}, parent), max = Math.max(1e-9, opt(o, 'max', 1000)), v = clamp(opt(o, 'v', 750), 0, max);
    const step = Math.max(max / 20, opt(o, 'step', max / 4)), u = String(o.u ?? (o.k === 'scale' ? 'g' : 'mL')).replace(/_/g, ' ');
    if (o.k === 'scale') {
      const r = S * .36, dy = cy + S * .12;
      wash(g, rectD(cx - S * .5, dy - r * 1.25, S, r * 2.6), '#eef1f4'); line(g, rectD(cx - S * .5, dy - r * 1.25, S, r * 2.6), K, 3);
      wash(g, `M${cx - S * .45} ${dy - r * 1.25} Q${cx} ${dy - r * 2.1} ${cx + S * .45} ${dy - r * 1.25} Z`, '#cfd8e0');
      line(g, `M${cx - S * .45} ${dy - r * 1.25} Q${cx} ${dy - r * 2.1} ${cx + S * .45} ${dy - r * 1.25} Z`, K, 3);
      wash(g, ring(cx, dy, r), '#ffffff'); line(g, ring(cx, dy, r), K, 3);
      const ang = f => -225 + 270 * f;                         // the dial runs from 7:30 to 4:30, clockwise
      for (let m = 0; m <= max + 1e-9; m += step) { const a = ang(m / max), [x0, y0] = pol(cx, dy, r * .82, a), [x1, y1] = pol(cx, dy, r * .96, a), [lx, ly] = pol(cx, dy, r * .64, a);
        line(g, `M${x0} ${y0} L${x1} ${y1}`, K, 2.4); label(g, lx, ly + 7, fmt(m), TICK, Math.max(13, r * .15), 'middle'); }
      const [nx, ny] = pol(cx, dy, r * .86, ang(v / max));
      line(g, `M${cx} ${dy} L${nx} ${ny}`, RED, 4); wash(g, ring(cx, dy, 6), RED);
      label(g, cx, dy + r * .45, u, TICK, Math.max(14, r * .16), 'middle');
      label(g, cx, dy + r * 1.6, `${fmt(v)} ${u}`, TXT.orange, 32, 'middle');
    } else {
      const w = S * .62, h = S * .9, top = cy - h / 2, bot = cy + h / 2, x0 = cx - w / 2, x1 = cx + w / 2, lvl = bot - (h * .88) * v / max;
      const side = yy => (bot - yy) / h * w * .06;              // the jug widens a little to the top
      wash(g, `M${x0 - side(lvl)} ${lvl} L${x1 + side(lvl)} ${lvl} L${x1} ${bot} L${x0} ${bot} Z`, '#9fd1f2', { opacity: .85 });
      line(g, `M${x0 - w * .06} ${top} L${x0} ${bot} L${x1} ${bot} L${x1 + w * .06} ${top}`, K, 3.4);
      line(g, `M${x1 + w * .04} ${top + h * .12} Q${x1 + w * .38} ${top + h * .2} ${x1 + w * .05} ${top + h * .55}`, K, 3.4);
      for (let m = step; m <= max + 1e-9; m += step) { const yy = bot - (h * .88) * m / max;
        line(g, `M${x0 + 2} ${yy} L${x0 + w * .22} ${yy}`, K, 2.4); label(g, x0 + w * .26, yy + 7, `${fmt(m)} ${u}`, TICK, Math.max(13, S * .05)); }
      line(g, `M${x0 - 14} ${lvl} L${x0 - 2} ${lvl}`, RED, 3);
      label(g, x0 - 20, lvl + 8, `${fmt(v)} ${u}`, TXT.orange, 28, 'end');
    }
    if (t) label(g, cx, cy - S * .62, t, TXT.blue, 26, 'middle');
    return g;
  },

  // "shapenet cx cy size k=cube|cuboid|pyramid|prism l=4 w=3 h=2 u=cm area=1 | label" — the flat net of a solid: its
  // faces laid out as they unfold, fold lines dashed, edge lengths written; area=1 writes each face's area inside and
  // the total surface area under it (computed from l, w, h)
  shapenet: ([cx = 480, cy = 270, S = 60], o, t, parent) => {
    const g = mk('g', {}, parent), k = o.k || 'cuboid', u = String(o.u ?? '').replace(/_/g, ' ');
    let l = opt(o, 'l', 4), w = opt(o, 'w', 3), h = opt(o, 'h', 2);
    if (k === 'cube') { w = l; h = l; }
    const faces = [];                                          // [x, y, w, h, colour index, area] in units
    if (k === 'pyramid') {                                     // square base l x l, four triangles of slant height h
      const B = l * S, H = h * S, x0 = cx - B / 2, y0 = cy - B / 2;
      wash(g, rectD(x0, y0, B, B), PAL[0], { opacity: .7 }); line(g, rectD(x0, y0, B, B), K, 3);
      const tri = [[[x0, y0], [x0 + B, y0], [cx, y0 - H]], [[x0 + B, y0], [x0 + B, y0 + B], [x0 + B + H, cy]], [[x0, y0 + B], [x0 + B, y0 + B], [cx, y0 + B + H]], [[x0, y0], [x0, y0 + B], [x0 - H, cy]]];
      tri.forEach((p, i) => { const d = `M${p[0][0]} ${p[0][1]} L${p[1][0]} ${p[1][1]} L${p[2][0]} ${p[2][1]} Z`; wash(g, d, PAL[i + 1], { opacity: .7 }); line(g, d, K, 3); });
      if (o.area === '1') {
        label(g, cx, cy + 8, fmt(l * l), K, 22, 'middle');
        for (const [xx, yy] of [[cx, y0 - H / 3], [x0 + B + H / 3, cy + 8], [cx, y0 + B + H / 3 + 8], [x0 - H / 3, cy + 8]]) label(g, xx, yy, fmt(l * h / 2), K, 20, 'middle');
        label(g, cx, y0 + B + H + 44, `surface area = ${fmt(l * l)} + 4 × ${fmt(l * h / 2)} = ${fmt(l * l + 2 * l * h)} ${u}${u ? '²' : ''}`, TXT.orange, 26, 'middle');
      }
      label(g, cx, y0 + B - 10, `${fmt(l)} ${u}`, TICK, 18, 'middle');
      if (t) label(g, cx, y0 - H - 20, t, TXT.blue, 26, 'middle');
      return g;
    }
    // cuboid / cube / prism(rectangular): a cross of l x w (top, bottom), l x h (front, back), w x h (two sides)
    const W = l * S, D = w * S, Hh = h * S, x0 = cx - (W + 2 * D) / 2 + D, y0 = cy - (2 * Hh + 2 * D) / 2;
    faces.push([x0, y0, W, D, 0, l * w], [x0, y0 + D, W, Hh, 1, l * h], [x0, y0 + D + Hh, W, D, 0, l * w], [x0, y0 + 2 * D + Hh, W, Hh, 1, l * h],
      [x0 - D, y0 + D, D, Hh, 2, w * h], [x0 + W, y0 + D, D, Hh, 2, w * h]);
    for (const [fx, fy, fw, fh, c] of faces) { wash(g, rectD(fx, fy, fw, fh), PAL[c], { opacity: .7 }); }
    for (const [fx, fy, fw, fh] of faces) line(g, rectD(fx, fy, fw, fh), K, 3);
    const folds = [[x0, y0 + D, x0 + W, y0 + D], [x0, y0 + D + Hh, x0 + W, y0 + D + Hh], [x0, y0 + 2 * D + Hh, x0 + W, y0 + 2 * D + Hh], [x0, y0 + D, x0, y0 + D + Hh], [x0 + W, y0 + D, x0 + W, y0 + D + Hh]];
    for (const [a, b, c2, d] of folds) line(g, `M${a} ${b} L${c2} ${d}`, '#ffffff', 3.6);
    for (const [a, b, c2, d] of folds) { const L = Math.hypot(c2 - a, d - b), n = Math.max(1, Math.floor(L / 16));
      line(g, Array.from({ length: n }, (_, i) => `M${a + (c2 - a) * i / n} ${b + (d - b) * i / n} L${a + (c2 - a) * (i + .55) / n} ${b + (d - b) * (i + .55) / n}`).join(' '), TICK, 2); }
    label(g, x0 + W / 2, y0 - 10, `${fmt(l)} ${u}`, TICK, 18, 'middle');
    label(g, x0 + W + D + 10, y0 + D + Hh / 2 + 6, `${fmt(h)} ${u}`, TICK, 18);
    label(g, x0 - D / 2, y0 + D - 8, `${fmt(w)} ${u}`, TICK, 18, 'middle');
    if (o.area === '1') {
      for (const [fx, fy, fw, fh, , a] of faces) label(g, fx + fw / 2, fy + fh / 2 + 8, fmt(a), K, Math.min(24, fh * .5), 'middle');
      const sa = 2 * (l * w + l * h + w * h);
      label(g, cx, y0 + 2 * D + 2 * Hh + 40, `surface area = 2 × (${fmt(l * w)} + ${fmt(l * h)} + ${fmt(w * h)}) = ${fmt(sa)} ${u}${u ? '²' : ''}`, TXT.orange, 26, 'middle');
    }
    if (t) label(g, cx, y0 - 34, t, TXT.blue, 26, 'middle');
    return g;
  },

  // "picgraph x y w h vals=4,6,3 key=2 icon=star|circle|apple|book | names" — a picture graph: one row per name, one icon
  // per key= items (half an icon for an odd one left), and the key under it ("★ = 2"); every count is from vals
  picgraph: ([x = 140, y = 90, w = 680, h = 330], o, t, parent) => {
    const g = mk('g', {}, parent), vals = nlist(o.vals || '4,6,3').map(v => Math.max(0, v)), key = Math.max(1, opt(o, 'key', 2));
    const names = t ? words(t) : vals.map((_, i) => String.fromCharCode(65 + i)), n = vals.length, rh = h / Math.max(1, n);
    const nameW = Math.min(180, Math.max(...names.map(s => tw(s, 24))) + 24), most = Math.max(1, ...vals.map(v => Math.ceil(v / key)));
    const sz = Math.min(rh * .62, (w - nameW - 20) / most * .85), icon = o.icon || 'star';
    const draw = (ix, iy, half) => {
      let clip = {};
      if (half) {                                               // the left half of the icon's box only
        const id = 'smHalf' + clipN++;
        mk('clipPath', { id }, g).append(mk('rect', { x: ix - sz, y: iy - sz, width: sz, height: 2 * sz }));
        clip = { 'clip-path': `url(#${id})` };
      }
      if (icon === 'circle') { wash(g, ring(ix, iy, sz * .45), PAL[1], clip); if (!half) line(g, ring(ix, iy, sz * .45), K, 2.4); }
      else if (icon === 'apple') { const d = `M${ix} ${iy - sz * .3} C${ix - sz * .55} ${iy - sz * .55} ${ix - sz * .6} ${iy + sz * .35} ${ix} ${iy + sz * .45} C${ix + sz * .6} ${iy + sz * .35} ${ix + sz * .55} ${iy - sz * .55} ${ix} ${iy - sz * .3} Z`;
        wash(g, d, '#e04b3a', clip); if (!half) { line(g, d, '#8a1f14', 2.4); line(g, `M${ix} ${iy - sz * .3} L${ix + sz * .08} ${iy - sz * .5}`, '#5a3a1a', 2.4); } }
      else if (icon === 'book') { const d = rectD(ix - sz * .4, iy - sz * .35, sz * .8, sz * .7); wash(g, d, PAL[0], clip); if (!half) { line(g, d, K, 2.4); line(g, `M${ix} ${iy - sz * .35} L${ix} ${iy + sz * .35}`, K, 2); } }
      else { const pts = Array.from({ length: 10 }, (_, i) => pol(ix, iy, i % 2 ? sz * .2 : sz * .48, -90 + i * 36)), d = `M${pts.map(p => p.join(' ')).join(' L')} Z`;
        wash(g, d, '#ffd84a', clip); if (!half) line(g, d, '#b08a00', 2.4); }
      if (half) line(g, `M${ix} ${iy - sz * .5} L${ix} ${iy + sz * .5}`, TICK, 1.6);
    };
    vals.forEach((v, r) => { const yy = y + r * rh + rh / 2;
      label(g, x + nameW - 14, yy + 8, names[r] ?? '', TXT.blue, 24, 'end');
      line(g, `M${x} ${y + (r + 1) * rh} L${x + w} ${y + (r + 1) * rh}`, SOFT, 1.4);
      const full = Math.floor(v / key), part = v % key;
      for (let i = 0; i < full; i++) draw(x + nameW + 8 + sz * (i + .55), yy, false);
      if (part) draw(x + nameW + 8 + sz * (full + .55), yy, true); });
    line(g, `M${x + nameW} ${y} L${x + nameW} ${y + h}`, K, 2.4);
    draw(x + nameW + sz * .6, y + h + sz * .7, false);
    label(g, x + nameW + sz * 1.2, y + h + sz * .7 + 9, `= ${fmt(key)}`, K, 26);
    return g;
  },
});
})();
