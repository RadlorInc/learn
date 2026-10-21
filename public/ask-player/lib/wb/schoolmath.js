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
});
})();
