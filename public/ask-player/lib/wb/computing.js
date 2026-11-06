// Whiteboard library: computing — computer-science ideas (data structures, binary, logic, networks, security, ML).
// Data-driven where it helps: values and labels come from the call (vals=, keys=, |text). Wrapped so helpers stay private.
(() => {
  const DK = '#2f3a45', BOX = '#eaf4ff', HI = '#ffc061', OK = '#9fe08a', BAD = '#f7a094';
  const G = (cx, cy, s, o, parent) => mk('g', { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0}) scale(${s})` }, parent);
  const P = (g, d, fill, ink = DK, w = 3) => { if (fill) mk('path', { d, fill, filter: 'url(#wc)', class: 'fillable' }, g); return line(g, d, ink, w); };
  const R = (x, y, w, h, r = 0) => r
    ? `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
    : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  const C = (x, y, r) => `M${x + r} ${y} A${r} ${r} 0 1 0 ${x - r} ${y} A${r} ${r} 0 1 0 ${x + r} ${y} Z`;
  const T = (g, x, y, s, col = DK, size = 24, anchor = 'middle') => label(g, x, y + size * .32, String(s), col, size, anchor);   // text centred on y
  // arrow x1,y1 → x2,y2; bend > 0 bows it to the left of travel
  const arr = (g, x1, y1, x2, y2, col = INK.blue, w = 3, bend = 0) => {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1, qx = (x1 + x2) / 2 + (y2 - y1) / len * bend * len, qy = (y1 + y2) / 2 - (x2 - x1) / len * bend * len;
    const e = line(g, bend ? `M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`, col, w);
    line(g, head(x2, y2, bend ? qx : x1, bend ? qy : y1, 12), col, w, { class: 'ink head' }); return e;
  };
  const list = (s, def) => String(s ?? def).split(',').map(x => x.trim());
  const fit = (S, natural, max = 1.5) => Math.min(S / natural, max);
  const showLab = o => o.lab !== '0' && o.labels !== '0';   // lab=0 / labels=0 hide the recipe's own words
  const sub = (g, s, x, y) => mk('g', { transform: `translate(${x} ${y}) scale(${s})` }, g);   // nest another recipe
  const fileIcon = (g, x, y, s = 1, fill = '#fdfdfb') => { P(g, `M${x - 16 * s} ${y - 20 * s} H${x + 6 * s} L${x + 16 * s} ${y - 10 * s} V${y + 20 * s} H${x - 16 * s} Z`, fill, DK, 2.5); line(g, `M${x - 9 * s} ${y - 2 * s} H${x + 9 * s} M${x - 9 * s} ${y + 7 * s} H${x + 5 * s}`, '#9aa3ad', 2); };
  const folderIcon = (g, x, y, s = 1) => P(g, `M${x - 18 * s} ${y - 13 * s} H${x - 5 * s} L${x} ${y - 8 * s} H${x + 18 * s} V${y + 13 * s} H${x - 18 * s} Z`, '#ffd84a', '#8a6414', 2.5);
  const keyShape = (g, x, y, s, col, ink) => { P(g, `M${x - 20 * s} ${y - 6 * s} H${x + 60 * s} V${y + 6 * s} H${x + 52 * s} V${y + 18 * s} H${x + 42 * s} V${y + 6 * s} H${x + 34 * s} V${y + 15 * s} H${x + 25 * s} V${y + 6 * s} H${x - 20 * s} Z`, col, ink, 2.5);
    P(g, C(x - 36 * s, y, 22 * s), col, ink, 2.5); P(g, C(x - 42 * s, y, 7 * s), '#fdfdfb', ink, 2); };
  const cloudD = 'M-90 55 C-135 55 -135 -5 -92 -10 C-92 -60 -30 -78 -2 -42 C18 -82 92 -70 88 -14 C135 -12 132 55 92 55 Z';

  // tree helpers: nodes are {heap index: value}; level-order slots give the x position
  const treeXY = (i, W, LH) => { const d = Math.floor(Math.log2(i + 1)), p = i - (2 ** d - 1); return [(p + .5) / 2 ** d * W - W / 2, d * LH]; };
  const drawTree = (g, nodes, W, hiNodes = new Set(), hiEdges = new Set(), okNode = -1) => {
    const ids = Object.keys(nodes).map(Number), maxD = Math.max(...ids.map(i => Math.floor(Math.log2(i + 1)))), LH = 92, dy = -maxD * LH / 2;
    const xy = i => { const [x, y] = treeXY(i, W, LH); return [x, y + dy]; };
    for (const i of ids) if (i) { const pi = (i - 1) >> 1, [x, y] = xy(i), [px, py] = xy(pi), on = hiEdges.has(i);
      line(g, `M${px} ${py + 26} L${x} ${y - 26}`, on ? INK.orange : DK, on ? 5 : 3); }
    for (const i of ids) { const [x, y] = xy(i); P(g, C(x, y, 26), i === okNode ? OK : hiNodes.has(i) ? HI : BOX, i === okNode ? INK.green : hiNodes.has(i) ? INK.orange : INK.blue, 3); }
    for (const i of ids) { const [x, y] = xy(i); T(g, x, y, nodes[i], DK, 24); }
    return { xy, maxD, LH };
  };
  const gateOut = (k, a, b) => ({ and: a & b, or: a | b, xor: a ^ b, nand: 1 - (a & b), nor: 1 - (a | b), not: 1 - a })[k];

  Object.assign(window.RECIPES, {
    // "arraybox cx cy width vals=7,2,9 hi=1 |name" — array cells with values and indices, one highlighted
    arraybox: ([cx, cy, S = 480], o, t, parent) => {
      const v = list(o.vals, '7,2,9,4,5,1'), B = 64, NW = v.length * B, g = G(cx, cy, fit(S, NW), o, parent), x0 = -NW / 2, hi = o.hi === undefined ? -1 : +o.hi;
      v.forEach((x, i) => P(g, R(x0 + i * B, -B / 2, B, B), i === hi ? HI : BOX, INK.blue, 3));
      v.forEach((x, i) => { T(g, x0 + i * B + B / 2, 0, x, DK, 30); T(g, x0 + i * B + B / 2, B / 2 + 20, i, TXT.sky, 19); });
      if (showLab(o)) label(g, x0 - 10, B / 2 + 26, 'index', TXT.sky, 17, 'end');
      if (t) label(g, x0, -B / 2 - 14, t, TXT.blue, 26);
      return g;
    },

    // "linkedlist cx cy width vals=3,8,5" — nodes (value + pointer) joined by arrows, head and null; loop flow
    linkedlist: ([cx, cy, S = 560], o, t, parent) => {
      const v = list(o.vals, '3,8,5'), step = 140, NW = v.length * step + 30, g = G(cx, cy, fit(S, NW), o, parent), x0 = -NW / 2;
      v.forEach((x, i) => { const nx = x0 + i * step; P(g, R(nx, -25, 58, 50, 6), BOX, INK.blue); P(g, R(nx + 58, -25, 30, 50, 6), '#d3e6fa', INK.blue); });
      v.forEach((x, i) => { const nx = x0 + i * step; P(g, C(nx + 73, 0, 4), DK, DK, 2);
        arr(g, nx + 77, 0, i < v.length - 1 ? nx + step - 4 : nx + 118, 0, INK.orange, 3); T(g, nx + 29, 0, x, DK, 28); });
      if (showLab(o)) label(g, x0 + (v.length - 1) * step + 124, 8, 'null', TXT.sky, 22);
      arr(g, x0 + 29, -78, x0 + 29, -30, INK.blue, 3); if (t || showLab(o)) label(g, x0 + 29, -86, t || 'head', TXT.blue, 22, 'middle');
      return g;
    },

    // "pushstack cx cy height vals=4,7,2 k=push|pop" — stack of blocks; last value pushed in or popped off the top
    pushstack: ([cx, cy, S = 360], o, t, parent) => {
      const v = list(o.vals, '4,7,2'), n = v.length, BH = 46, inH = (n - 1) * BH + 14, H = inH + 120, g = G(cx, cy, fit(S, H, 1.3), o, parent);
      const bot = H / 2, topY = bot - inH, pop = o.k === 'pop';
      for (let i = 0; i < n - 1; i++) { const y = bot - 7 - (i + 1) * BH; P(g, R(-70, y + 3, 140, BH - 6, 6), i === n - 2 ? '#d3e6fa' : BOX, INK.blue); T(g, 0, y + BH / 2, v[i], DK, 26); }
      line(g, `M-82 ${topY - 30} V${bot} H82 V${topY - 30}`, DK, 4);
      const fy = -H / 2 + 26; P(g, R(-70, fy - 20, 140, 40, 6), HI, INK.orange); T(g, 0, fy, v[n - 1], DK, 26);
      if (pop) arr(g, 120, topY - 6, 120, fy - 10, INK.orange, 3.5, .25); else arr(g, 120, fy, 120, topY + 14, INK.orange, 3.5, -.25);
      if (showLab(o)) label(g, 140, (fy + topY) / 2 + 6, pop ? 'pop' : 'push', TXT.orange, 26);
      if (n > 1) { arr(g, -150, topY + 16, -92, topY + 16, INK.blue, 2.5); if (showLab(o)) label(g, -158, topY + 22, 'top', TXT.blue, 20, 'end'); }
      if (t) label(g, 0, bot + 36, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "queueline cx cy width vals=5,1,8,3" — queue in a tube: enqueue at the back, dequeue at the front; loop flow
    queueline: ([cx, cy, S = 600], o, t, parent) => {
      const v = list(o.vals, '5,1,8,3'), B = 66, IW = v.length * B, NW = IW + 260, g = G(cx, cy, fit(S, NW), o, parent), x0 = -IW / 2;
      line(g, `M${x0 - 16} -40 H${x0 + IW + 16} M${x0 - 16} 40 H${x0 + IW + 16}`, DK, 4);
      v.forEach((x, i) => { P(g, R(x0 + i * B + 5, -28, B - 10, 56, 8), i === 0 ? HI : BOX, i === 0 ? INK.orange : INK.blue); T(g, x0 + i * B + B / 2, 0, x, DK, 28); });
      arr(g, x0 - 24, 0, x0 - 110, 0, INK.orange, 4); if (showLab(o)) label(g, x0 - 70, -22, 'dequeue', TXT.orange, 20, 'middle');
      arr(g, x0 + IW + 110, 0, x0 + IW + 24, 0, INK.green, 4); if (showLab(o)) label(g, x0 + IW + 70, -22, 'enqueue', TXT.green, 20, 'middle');
      if (showLab(o)) { label(g, x0 + B / 2, 68, 'front', TXT.blue, 20, 'middle'); label(g, x0 + IW - B / 2, 68, 'back', TXT.blue, 20, 'middle'); }
      if (t) label(g, 0, -62, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "bintree cx cy width vals=8,3,10,1,6,_,14 hi=6" — binary tree from level-order values (_ = empty), one node highlighted
    bintree: ([cx, cy, S = 520], o, t, parent) => {
      const v = list(o.vals, '8,3,10,1,6,_,14'), nodes = {}; v.forEach((x, i) => { if (x !== '' && x !== '_') nodes[i] = x; });
      const g = G(cx, cy, fit(S, 560, 1.2), o, parent), hi = new Set(Object.keys(nodes).filter(i => o.hi !== undefined && nodes[i] === String(o.hi)).map(Number));
      const { maxD, LH } = drawTree(g, nodes, 560, hi);
      if (t) label(g, 0, -maxD * LH / 2 - 44, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "bstpath cx cy width vals=8,3,10,1,6,14 find=6" — search tree built from vals; the search path for find lit up
    bstpath: ([cx, cy, S = 520], o, t, parent) => {
      const v = list(o.vals, '8,3,10,1,6,14,4').map(Number), find = +(o.find ?? 6), nodes = {};
      for (const x of v) { let i = 0; while (nodes[i] !== undefined) i = x < nodes[i] ? 2 * i + 1 : 2 * i + 2; if (i < 31) nodes[i] = x; }
      const path = new Set(), edges = new Set(); let i = 0, hit = -1;
      while (nodes[i] !== undefined) { path.add(i); if (i) edges.add(i); if (nodes[i] === find) { hit = i; break; } i = find < nodes[i] ? 2 * i + 1 : 2 * i + 2; }
      const g = G(cx, cy, fit(S, 560, 1.2), o, parent), { xy, maxD, LH } = drawTree(g, nodes, 560, path, edges, hit);
      for (const j of path) if (j !== hit && showLab(o)) { const [x, y] = xy(j), left = find < nodes[j]; label(g, x + (left ? -34 : 34), y + 6, left ? `${find} < ${nodes[j]}` : `${find} > ${nodes[j]}`, TXT.orange, 20, left ? 'end' : 'start'); }
      if (t || showLab(o)) label(g, 0, -maxD * LH / 2 - 44, t || (hit < 0 ? `find ${find}: not there` : `find ${find}`), TXT.blue, 24, 'middle');
      return g;
    },

    // "nodegraph cx cy width nodes=A,B,C,D,E edges=A-B:4,B-C:3 path=A,B,C" — weighted graph, a path highlighted
    nodegraph: ([cx, cy, S = 560], o, t, parent) => {
      const names = list(o.nodes, 'A,B,C,D,E'), n = names.length, g = G(cx, cy, fit(S, 560, 1.3), o, parent), pos = {};
      names.forEach((nm, i) => { const a = Math.PI + i * 2 * Math.PI / n; pos[nm] = [230 * Math.cos(a), 130 * Math.sin(a)]; });
      const path = list(o.path, o.edges ? '' : 'A,E,D').filter(Boolean), onPath = (a, b) => path.some((p, i) => i && ((path[i - 1] === a && p === b) || (path[i - 1] === b && p === a)));
      const edges = list(o.edges, 'A-B:4,A-E:2,B-C:3,C-D:1,E-D:5,B-E:6').filter(Boolean).map(e => { const [ab, w] = e.split(':'), [a, b] = ab.split('-'); return [a, b, w]; }).filter(([a, b]) => pos[a] && pos[b]);
      for (const [a, b] of edges) line(g, `M${pos[a][0]} ${pos[a][1]} L${pos[b][0]} ${pos[b][1]}`, onPath(a, b) ? INK.orange : DK, onPath(a, b) ? 6 : 3);
      for (const [a, b, w] of edges) if (w !== undefined) { const mx = (pos[a][0] + pos[b][0]) / 2, my = (pos[a][1] + pos[b][1]) / 2; P(g, C(mx, my, 17), '#fdfdfb', '#9aa3ad', 2); T(g, mx, my, w, onPath(a, b) ? TXT.orange : DK, 22); }
      for (const nm of names) P(g, C(...pos[nm], 30), path.includes(nm) ? HI : BOX, path.includes(nm) ? INK.orange : INK.blue, 3);
      for (const nm of names) T(g, ...pos[nm], nm, DK, 26);
      if (t) label(g, 0, -170, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "hashtable cx cy width keys=apple,kiwi,plum buckets=5" — keys through a hash into numbered buckets, collisions chained
    hashtable: ([cx, cy, S = 600], o, t, parent) => {
      const keys = list(o.keys, 'apple,kiwi,plum,fig,lime'), m = Math.max(1, +(o.buckets || 5)), H = 54, chains = Array.from({ length: m }, () => []);
      const h = k => [...k].reduce((s, c) => s + c.charCodeAt(0), 0) % m;
      keys.forEach(k => chains[h(k)].push(k));
      const maxC = Math.max(1, ...chains.map(c => c.length)), left = -320, right = 66 + maxC * 124, rows = Math.max(keys.length, m);
      const g0 = G(cx, cy, fit(S, right - left, 1.2), o, parent), g = mk('g', { transform: `translate(${-(left + right) / 2} 0)` }, g0);
      const ky = i => (i - (keys.length - 1) / 2) * H, by = j => (j - (m - 1) / 2) * H, hy = rows * H / 2 - 4;
      P(g, R(-150, -hy, 76, 2 * hy, 10), '#e6dcf7', '#6a4fa0'); if (showLab(o)) T(g, -112, 0, 'hash', '#6a4fa0', 22);
      keys.forEach((k, i) => { P(g, R(-310, ky(i) - 18, 116, 36, 8), '#fdfdfb', DK, 2.5); T(g, -252, ky(i), k, DK, 20); arr(g, -192, ky(i), -152, ky(i), '#6a4fa0', 2.5); });
      chains.forEach((c, j) => { P(g, R(0, by(j) - 20, 46, 40, 4), '#d3e6fa', INK.blue); T(g, 23, by(j), j, TXT.blue, 22);
        c.forEach((k, q) => { const x = 66 + q * 124; arr(g, x - 18 + (q ? -4 : 0), by(j), x + 2, by(j), INK.orange, 2.5); P(g, R(x + 4, by(j) - 18, 96, 36, 8), HI, INK.orange, 2.5); T(g, x + 52, by(j), k, DK, 20); }); });
      keys.forEach((k, i) => arr(g, -72, ky(i), -4, by(h(k)), INK.sky, 2));
      if (t) label(g, (left + right) / 2, -hy - 20, t, TXT.blue, 24, 'middle');
      return g0;
    },

    // "sortbars cx cy width vals=5,2,8,1 hi=0,1 k=compare|swap|sorted" — sorting bars; compared pair, a swap, or done
    sortbars: ([cx, cy, S = 560], o, t, parent) => {
      let v = list(o.vals, '5,2,8,1,9,3').map(Number); if (o.k === 'sorted') v = [...v].sort((a, b) => a - b);
      const hi = o.k === 'sorted' ? [] : list(o.hi, '0,1').map(Number), BW = 60, GAP = 18, NW = v.length * (BW + GAP), g = G(cx, cy, fit(S, NW), o, parent), max = Math.max(...v, 1), x0 = -NW / 2 + GAP / 2, base = 120;
      const bx = i => x0 + i * (BW + GAP);
      v.forEach((x, i) => { const hgt = 30 + x / max * 190, on = hi.includes(i); P(g, R(bx(i), base - hgt, BW, hgt, 4), o.k === 'sorted' ? OK : on ? HI : BOX, o.k === 'sorted' ? INK.green : on ? INK.orange : INK.blue); T(g, bx(i) + BW / 2, base - hgt - 18, x, DK, 24); T(g, bx(i) + BW / 2, base + 20, i, TXT.sky, 18); });
      line(g, `M${x0 - 10} ${base} H${x0 + NW - GAP + 10}`, DK, 3);
      if (hi.length === 2 && o.k === 'swap') { const [a, b] = hi.map(i => bx(i) + BW / 2); arr(g, a, -112, b - 6, -112, INK.orange, 3, .3); arr(g, b, -112, a + 6, -112, INK.orange, 3, .3); if (showLab(o)) label(g, (a + b) / 2, -160, 'swap', TXT.orange, 22, 'middle'); }
      else if (hi.length === 2 && showLab(o)) { const [a, b] = hi.map(i => bx(i) + BW / 2); label(g, (a + b) / 2, -112, v[hi[0]] > v[hi[1]] ? `${v[hi[0]]} > ${v[hi[1]]} ?` : `${v[hi[0]]} < ${v[hi[1]]} ?`, TXT.orange, 24, 'middle'); }
      if (t) label(g, 0, -170, t, TXT.blue, 24, 'middle'); else if (o.k === 'sorted' && showLab(o)) label(g, 0, -126, 'sorted', TXT.green, 24, 'middle');
      return g;
    },

    // "binarynum cx cy width n=13 bits=8" — a number in binary: place values, bit boxes, and the sum
    binarynum: ([cx, cy, S = 560], o, t, parent) => {
      const n = Math.max(0, Math.floor(+(o.n ?? 13))), bits = Math.max(+(o.bits || 8), n.toString(2).length), B = 62, NW = bits * B, g = G(cx, cy, fit(S, NW), o, parent), x0 = -NW / 2, on = [];
      for (let i = 0; i < bits; i++) { const pv = 2 ** (bits - 1 - i), b = (n >> (bits - 1 - i)) & 1, x = x0 + i * B; if (b) on.push(pv);
        P(g, R(x + 3, -30, B - 6, 60, 6), b ? '#ffe58a' : BOX, b ? INK.orange : INK.blue); T(g, x + B / 2, 0, b, DK, 32); T(g, x + B / 2, -52, pv, TXT.sky, pv > 999 ? 15 : 19); }
      if (showLab(o)) label(g, 0, 76, `${on.join(' + ') || '0'} = ${n}`, TXT.orange, 26, 'middle');
      if (t) label(g, 0, -86, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "bitrow cx cy width |Hi" — each letter as one byte of 8 bits, braced with its code
    bitrow: ([cx, cy, S = 600], o, t, parent) => {
      const chars = [...(t || 'Hi')].slice(0, 4), B = 30, BY = 8 * B, GAP = 34, NW = chars.length * BY + (chars.length - 1) * GAP, g = G(cx, cy, fit(S, NW, 1.8), o, parent), x0 = -NW / 2;
      chars.forEach((ch, j) => { const code = ch.charCodeAt(0) & 255, bx = x0 + j * (BY + GAP);
        for (let i = 0; i < 8; i++) { const b = (code >> (7 - i)) & 1; P(g, R(bx + i * B + 2, -22, B - 4, 44, 4), b ? '#ffe58a' : BOX, b ? INK.orange : INK.blue, 2.2); T(g, bx + i * B + B / 2, 0, b, DK, 22); }
        line(g, `M${bx + 2} 34 Q${bx + 2} 46 ${bx + 14} 46 H${bx + BY / 2 - 10} L${bx + BY / 2} 56 L${bx + BY / 2 + 10} 46 H${bx + BY - 14} Q${bx + BY - 2} 46 ${bx + BY - 2} 34`, INK.blue, 2.5);
        if (showLab(o)) label(g, bx + BY / 2, 84, `'${ch}' = ${code}`, TXT.blue, 22, 'middle'); });
      arr(g, x0 + B / 2 - 30, -70, x0 + B / 2 - 3, -28, INK.orange, 2.5); if (showLab(o)) label(g, x0 + B / 2 - 34, -74, '1 bit', TXT.orange, 19, 'end');
      if (showLab(o)) label(g, x0 + BY / 2 + 40, -40, '1 byte = 8 bits', TXT.blue, 20, 'middle');
      return g;
    },

    // "logicgate cx cy width k=and|or|not|xor|nand a=1 b=0" — gate symbol, input wires with values, computed output
    logicgate: ([cx, cy, S = 420], o, t, parent) => {
      const k = o.k || 'and', a = +(o.a ?? 1) ? 1 : 0, b = +(o.b ?? 0) ? 1 : 0, q = gateOut(k, a, b), g = G(cx, cy, S / 420, o, parent), wc = x => x ? INK.green : '#9aa3ad';
      const ins = k === 'not' ? [[0, a, 'A']] : [[-25, a, 'A'], [25, b, 'B']];
      for (const [y, v] of ins) line(g, `M-160 ${y} H${k === 'not' ? -50 : -58}`, wc(v), 5);
      const body = { and: 'M-60 -50 H0 A50 50 0 0 1 0 50 H-60 Z', nand: 'M-60 -50 H0 A50 50 0 0 1 0 50 H-60 Z', or: 'M-70 -50 Q-10 -50 50 0 Q-10 50 -70 50 Q-45 0 -70 -50 Z',
        xor: 'M-62 -50 Q-2 -50 58 0 Q-2 50 -62 50 Q-37 0 -62 -50 Z', not: 'M-50 -45 L40 0 L-50 45 Z' }[k] || 'M-60 -50 H0 A50 50 0 0 1 0 50 H-60 Z';
      P(g, body, '#e6dcf7', '#6a4fa0', 3.4);
      if (k === 'xor') line(g, 'M-80 -50 Q-55 0 -80 50', '#6a4fa0', 3.4);
      const bub = k === 'not' ? 48 : k === 'nand' ? 58 : 0; if (bub) P(g, C(bub, 0, 8), '#fdfdfb', '#6a4fa0', 3);
      const ox = bub ? bub + 8 : k === 'and' ? 50 : 50; line(g, `M${ox} 0 H160`, wc(q), 5);
      P(g, C(176, 0, 14), q ? '#ffe58a' : '#e3e7eb', q ? INK.orange : '#9aa3ad', 3);
      for (const [y, v, nm] of ins) label(g, -172, y + 8, `${nm} = ${v}`, v ? TXT.green : '#7d8893', 24, 'end');
      label(g, 176, 46, `Q = ${q}`, q ? TXT.green : '#7d8893', 26, 'middle');
      if (t || showLab(o)) label(g, k === 'not' ? -10 : -20, 92, t || k.toUpperCase(), '#6a4fa0', 28, 'middle');
      return g;
    },

    // "truthtable cx cy width k=and|or|xor|nand|not" — truth table of a gate, rows with output 1 shaded
    truthtable: ([cx, cy, S = 320], o, t, parent) => {
      const k = o.k || 'and', one = k === 'not', cols = one ? ['A', 'Q'] : ['A', 'B', 'Q'], rows = one ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      const CW = 80, RH = 46, W = cols.length * CW, Ht = (rows.length + 1) * RH, g = G(cx, cy, fit(S, W, 1.6), o, parent), x0 = -W / 2, y0 = -Ht / 2 + 16;
      P(g, R(x0, y0, W, RH), '#d3e6fa', INK.blue);
      rows.forEach((r, i) => { const q = gateOut(k, r[0], r[1] ?? 0); if (q) mk('path', { d: R(x0 + W - CW, y0 + (i + 1) * RH, CW, RH), fill: OK, filter: 'url(#wc)', class: 'fillable' }, g); });
      line(g, R(x0, y0, W, Ht), DK, 3);
      let d = ''; for (let i = 1; i <= rows.length; i++) d += `M${x0} ${y0 + i * RH} H${x0 + W} `; for (let j = 1; j < cols.length; j++) d += `M${x0 + j * CW} ${y0} V${y0 + Ht} `;
      line(g, d, DK, 2); line(g, `M${x0 + W - CW} ${y0} V${y0 + Ht}`, DK, 4);
      cols.forEach((c, j) => T(g, x0 + j * CW + CW / 2, y0 + RH / 2, c, TXT.blue, 26));
      rows.forEach((r, i) => [...r, gateOut(k, r[0], r[1] ?? 0)].forEach((v, j) => T(g, x0 + j * CW + CW / 2, y0 + (i + 1.5) * RH, v, DK, 26)));
      if (t || showLab(o)) label(g, 0, y0 - 16, t || `${k.toUpperCase()} gate`, '#6a4fa0', 26, 'middle');
      return g;
    },

    // "cpubus cx cy width" — CPU (control unit, ALU, registers), memory cells and input/output on a shared bus; loop flow
    cpubus: ([cx, cy, S = 640], o, t, parent) => {
      const g = G(cx, cy, S / 640, o, parent);
      P(g, R(-320, -130, 220, 200, 12), '#dbe7f3', INK.blue, 3.4); if (showLab(o)) label(g, -210, -102, 'CPU', TXT.blue, 28, 'middle');
      for (const [y, nm, f] of [[-84, 'Control unit', '#fdfdfb'], [-36, 'ALU', '#ffe58a'], [12, 'Registers', '#d8f0d0']]) { P(g, R(-300, y, 180, 40, 6), f, DK, 2.5); if (showLab(o)) T(g, -210, y + 20, nm, DK, 20); }
      P(g, R(100, -130, 220, 200, 12), '#f3ead8', '#8a6414', 3.4); if (showLab(o)) label(g, 210, -102, 'Memory', '#8a6414', 28, 'middle');
      for (let i = 0; i < 4; i++) { const y = -84 + i * 36; P(g, R(160, y, 140, 32, 3), '#fdfdfb', '#8a6414', 2); T(g, 140, y + 16, i, '#8a6414', 18); if (i === 3 || showLab(o)) T(g, 230, y + 16, ['LOAD 5', 'ADD 3', 'STORE 6', '42'][i], DK, 18); }
      line(g, 'M-100 -40 H100', INK.orange, 5); line(g, head(100, -40, 0, -40, 14), INK.orange, 5, { class: 'ink head' }); if (showLab(o)) label(g, 0, -54, 'address bus', TXT.orange, 19, 'middle');
      line(g, 'M-96 20 H96', INK.green, 5); line(g, head(100, 20, 0, 20, 14), INK.green, 5, { class: 'ink head' }); line(g, head(-100, 20, 0, 20, 14), INK.green, 5, { class: 'ink head' });
      if (showLab(o)) label(g, 50, 44, 'data bus', TXT.green, 19, 'middle');
      line(g, 'M0 20 V110', INK.green, 4);
      P(g, R(-90, 110, 180, 44, 8), '#e6dcf7', '#6a4fa0'); if (showLab(o)) T(g, 0, 132, 'Input / Output', '#6a4fa0', 20);
      if (t) label(g, 0, -150, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "fdecycle cx cy size" — fetch → decode → execute cycle of a CPU, arrows round a loop; loop flow
    fdecycle: ([cx, cy, S = 420], o, t, parent) => {
      const g = G(cx, cy, S / 420, o, parent), pts = [[0, -120, 'Fetch', 'get next', '#d3e6fa'], [140, 95, 'Decode', 'what is it?', '#ffe58a'], [-140, 95, 'Execute', 'do it', '#d8f0d0']];
      for (let i = 0; i < 3; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 3], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), f = 72 / L;
        arr(g, x1 + dx * f, y1 + dy * f, x2 - dx * f, y2 - dy * f, INK.orange, 4, -.22); }
      for (const [x, y, nm, s, f] of pts) { P(g, C(x, y, 62), f, INK.blue, 3.4); if (showLab(o)) { T(g, x, y - 8, nm, DK, 28); T(g, x, y + 22, s, TXT.blue, 17); } }
      if (t || showLab(o)) label(g, 0, 40, t || 'repeat', TXT.orange, 24, 'middle');
      return g;
    },

    // "clientserver cx cy width |request,response" — laptop asks a server; request and response arrows; loop flow
    clientserver: ([cx, cy, S = 640], o, t, parent) => {
      const [rq, rs] = list(t, 'GET /page,200 OK + page'), g = G(cx, cy, S / 640, o, parent);
      RECIPES.laptop([-220, 0, 200], {}, '', g); RECIPES.server([230, -10, 190], {}, '', g);
      if (showLab(o)) { label(g, -220, 110, 'Client', TXT.blue, 26, 'middle'); label(g, 230, 110, 'Server', TXT.blue, 26, 'middle'); }
      arr(g, -110, -60, 160, -60, INK.orange, 4, .12); if (t || showLab(o)) label(g, 25, -112, showLab(o) ? `request: ${rq}` : rq, TXT.orange, 22, 'middle');
      arr(g, 160, 40, -100, 40, INK.green, 4, .12); if (t || showLab(o)) label(g, 30, 110, showLab(o) ? `response: ${rs}` : rs, TXT.green, 22, 'middle');
      return g;
    },

    // "dnslookup cx cy width |name,ip" — DNS turns a web name into an IP: ask, answer, then connect (3 numbered steps)
    dnslookup: ([cx, cy, S = 640], o, t, parent) => {
      const [nm, ip] = list(t, 'example.com,93.184.216.34'), g = G(cx, cy, S / 640, o, parent);
      RECIPES.laptop([-230, 60, 170], {}, '', g); RECIPES.server([0, -90, 140], {}, '', g); RECIPES.server([230, 60, 140], {}, '', g);
      if (showLab(o)) { label(g, 0, -170, 'DNS server', TXT.blue, 22, 'middle'); label(g, 230, 150, 'website', TXT.blue, 22, 'middle'); label(g, -230, 150, 'you', TXT.blue, 22, 'middle'); }
      const step = (x, y, n) => { P(g, C(x, y, 14), '#ffe58a', INK.orange, 2.5); T(g, x, y, n, DK, 18); };
      arr(g, -170, -10, -70, -100, INK.orange, 3.5, .1); step(-170, -80, 1); if (t || showLab(o)) label(g, -170, -112, `${nm} ?`, TXT.orange, 22, 'middle');
      arr(g, -60, -40, -140, 20, INK.green, 3.5, .1); step(-60, 6, 2); if (t || showLab(o)) label(g, -36, 12, ip, TXT.green, 20, 'start');
      arr(g, -120, 80, 160, 80, INK.blue, 3.5); step(20, 104, 3); if (showLab(o)) label(g, 44, 110, 'connect', TXT.blue, 20, 'start');
      return g;
    },

    // "packetroute cx cy width" — message split into numbered packets taking different router paths; loop flow
    packetroute: ([cx, cy, S = 680], o, t, parent) => {
      const g = G(cx, cy, S / 680, o, parent), rt = { a: [-110, -90], b: [-110, 90], c: [110, -90], d: [110, 90] };
      RECIPES.computer([-300, 10, 110], {}, '', g); RECIPES.computer([300, 10, 110], {}, '', g);
      for (const [p, q] of [['a', 'c'], ['b', 'd'], ['a', 'd'], ['a', 'b'], ['c', 'd']]) line(g, `M${rt[p][0]} ${rt[p][1]} L${rt[q][0]} ${rt[q][1]}`, '#9aa3ad', 3);
      for (const r of ['a', 'b']) line(g, `M-250 0 L${rt[r][0]} ${rt[r][1]}`, '#9aa3ad', 3);
      for (const r of ['c', 'd']) line(g, `M250 0 L${rt[r][0]} ${rt[r][1]}`, '#9aa3ad', 3);
      for (const [x, y] of Object.values(rt)) { P(g, C(x, y, 30), '#d3e6fa', INK.blue, 3); line(g, `M${x - 16} ${y} H${x + 16} M${x} ${y - 16} V${y + 16}`, INK.blue, 3);
        for (const [hx, hy, ax, ay] of [[x + 16, y, x, y], [x - 16, y, x, y], [x, y + 16, x, y], [x, y - 16, x, y]]) line(g, head(hx, hy, ax, ay, 7), INK.blue, 3, { class: 'ink head' }); }
      RECIPES.envelope([0, -112, 64], {}, '1', g); RECIPES.envelope([0, 112, 64], {}, '2', g); RECIPES.envelope([-6, 30, 64], {}, '3', g);
      if (t || showLab(o)) label(g, -300, 100, t || 'message', TXT.blue, 22, 'middle'); if (showLab(o)) { label(g, 300, 100, 'put back in order', TXT.blue, 20, 'middle'); label(g, 0, 170, 'routers', TXT.blue, 22, 'middle'); }
      return g;
    },

    // "encrypt cx cy width shift=3 |HELLO" — plaintext → key → ciphertext (a real shift cipher of the text)
    encrypt: ([cx, cy, S = 640], o, t, parent) => {
      const plain = (t || 'HELLO').toUpperCase().slice(0, 10), sh = +(o.shift ?? 3), g = G(cx, cy, S / 640, o, parent);
      const ct = [...plain].map(c => /[A-Z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 65 + ((sh % 26) + 26)) % 26 + 65) : c).join('');
      const fs = Math.min(30, 300 / plain.length);
      P(g, R(-320, -36, 190, 72, 10), '#fdfdfb', DK); T(g, -225, 0, plain, DK, fs); if (showLab(o)) label(g, -225, -50, 'plaintext', TXT.blue, 22, 'middle');
      P(g, R(130, -36, 190, 72, 10), '#e3e7eb', DK); T(g, 225, 0, ct, '#6a4fa0', fs); if (showLab(o)) label(g, 225, -50, 'ciphertext', '#6a4fa0', 22, 'middle');
      arr(g, -122, 0, 122, 0, INK.orange, 4); keyShape(g, -10, -44, 1, '#f3c33b', '#8a6414');
      if (showLab(o)) label(g, 0, 40, `key: shift ${sh}`, TXT.orange, 22, 'middle');
      arr(g, 225, 46, -225, 46, INK.green, 3, .18); if (showLab(o)) label(g, 0, 122, 'the same key turns it back', TXT.green, 20, 'middle');
      return g;
    },

    // "keypair cx cy width" — public key locks a message, only the matching private key opens it
    keypair: ([cx, cy, S = 640], o, t, parent) => {
      const g = G(cx, cy, S / 640, o, parent);
      keyShape(g, -250, -40, 1.1, OK, INK.green); if (showLab(o)) { label(g, -250, 20, 'public key', TXT.green, 24, 'middle'); label(g, -250, 48, 'anyone can lock', TXT.green, 18, 'middle'); }
      keyShape(g, 250, -40, 1.1, BAD, INK.red); if (showLab(o)) { label(g, 250, 20, 'private key', TXT.red, 24, 'middle'); label(g, 250, 48, 'only you can open', TXT.red, 18, 'middle'); }
      RECIPES.padlock([0, -20, 150], { k: 'locked' }, '', g); RECIPES.envelope([0, 100, 120], {}, '', g);
      arr(g, -170, -40, -70, -30, INK.green, 4); arr(g, 170, -40, 70, -30, INK.red, 4);
      if (t) label(g, 0, -126, t, TXT.blue, 24, 'middle');
      return g;
    },

    // "filetree cx cy height |Home,>Docs,>>report.txt,>Photos,>>sun.png" — folders and files; ">" = one level deeper, "." = file
    filetree: ([cx, cy, S = 360], o, t, parent) => {
      const rows = list(t, 'Home,>Docs,>>report.txt,>>notes.txt,>Photos,>>sun.png').map(s => { const lv = s.match(/^>*/)[0].length; return [lv, s.slice(lv)]; });
      const RH = 46, IND = 44, H = rows.length * RH, W = Math.max(...rows.map(([lv, nm]) => lv * IND + 40 + nm.length * 12)), g0 = G(cx, cy, fit(S, H, 1.3), o, parent), g = mk('g', { transform: `translate(${-W / 2} ${-H / 2 + RH / 2})` }, g0);
      rows.forEach(([lv, nm], i) => { if (!lv) return; let p = i - 1; while (p > 0 && rows[p][0] >= lv) p--; const px = (lv - 1) * IND + 14;
        line(g, `M${px} ${p * RH + 18} V${i * RH} H${lv * IND - 6}`, '#9aa3ad', 2.5); });
      rows.forEach(([lv, nm], i) => { const x = lv * IND + 14, y = i * RH; nm.includes('.') ? fileIcon(g, x, y, .8) : folderIcon(g, x, y, 1); if (t || showLab(o)) label(g, x + 28, y + 8, nm, nm.includes('.') ? DK : TXT.orange, 22); });
      return g0;
    },

    // "codewin cx cy width hi=2 |line;  indented line;line" — code editor window with numbered lines, one highlighted
    codewin: ([cx, cy, S = 520], o, t, parent) => {
      const L = (t || 'for i in range(3):;    print(i);print("done")').split(';').slice(0, 12), RH = 38, H = 50 + L.length * RH + 16, g = G(cx, cy, S / 520, o, parent), y0 = -H / 2;
      P(g, R(-260, y0, 520, H, 12), '#26323d', DK); P(g, R(-260, y0, 520, 38, 12), '#3a4652', DK, 2);
      ['#e04b3a', '#f3c33b', '#5fae3a'].forEach((c, i) => P(g, C(-236 + i * 22, y0 + 19, 7), c, DK, 1.5));
      if (o.hi) mk('path', { d: R(-250, y0 + 46 + (o.hi - 1) * RH, 500, RH), fill: '#4a5a2a', filter: 'url(#wc)', class: 'fillable' }, g);
      line(g, `M-206 ${y0 + 46} V${y0 + H - 10}`, '#5a6675', 2);
      const kw = /^(for|while|if|else|elif|def|return|print|let|const|function|var|class|import|from)\b/;
      L.forEach((s, i) => { const y = y0 + 46 + i * RH + RH / 2, ind = s.match(/^ */)[0].length, txt = s.trim(), m = txt.match(kw);
        T(g, -224, y, i + 1, '#7d8893', 18);
        label(g, -190 + ind * 9, y + 8, txt, m ? '#ffd27a' : '#9fe0a0', 24); });
      return g;
    },

    // "ctrlflow cx cy height k=if|loop |condition" — flowchart: if (yes/no branches) or loop (repeat until false); loop flow
    ctrlflow: ([cx, cy, S = 420], o, t, parent) => {
      const loop = o.k === 'loop', cond = t || (loop ? 'i < 3 ?' : 'x > 5 ?'), g = G(cx, cy, S / 420, o, parent);
      const pill = (x, y, s) => { P(g, R(x - 60, y - 22, 120, 44, 22), '#e3e7eb', DK, 2.5); if (showLab(o)) T(g, x, y, s, DK, 20); };
      const box = (x, y, s, f = BOX) => { P(g, R(x - 80, y - 26, 160, 52, 6), f, INK.blue, 2.5); if (showLab(o)) T(g, x, y, s, DK, 20); };
      pill(0, -180, 'start'); arr(g, 0, -158, 0, -114, DK, 3);
      P(g, 'M0 -112 L110 -50 L0 12 L-110 -50 Z', '#ffe58a', INK.orange, 3); if (t || showLab(o)) T(g, 0, -50, cond, DK, 22);
      if (!loop) {
        arr(g, -110, -50, -170, 40, INK.green, 3, -.15); if (showLab(o)) label(g, -170, -50, 'yes', TXT.green, 22, 'middle'); box(-170, 68, 'do this');
        arr(g, 110, -50, 170, 40, INK.red, 3, .15); if (showLab(o)) label(g, 170, -50, 'no', TXT.red, 22, 'middle'); box(170, 68, 'do that', '#f3ead8');
        arr(g, -170, 94, -50, 160, DK, 3); arr(g, 170, 94, 50, 160, DK, 3); pill(0, 182, 'end');
      } else {
        arr(g, 0, 12, 0, 74, INK.green, 3); if (showLab(o)) label(g, 14, 48, 'yes', TXT.green, 22); box(0, 100, 'repeat step');
        line(g, 'M-80 100 H-170 V-50', INK.orange, 3); arr(g, -170, -50, -114, -50, INK.orange, 3); if (showLab(o)) label(g, -180, 30, 'loop', TXT.orange, 22, 'end');
        arr(g, 110, -50, 190, -50, INK.red, 3); if (showLab(o)) label(g, 150, -64, 'no', TXT.red, 22, 'middle'); pill(190, 10, 'end'); line(g, 'M190 -50 V-12', INK.red, 3);
      }
      return g;
    },

    // "recursion cx cy width depth=4 |fact" — nested calls f(4) ⊃ f(3) … down to the base case, answers returning out
    recursion: ([cx, cy, S = 560], o, t, parent) => {
      const d = Math.min(5, Math.max(2, +(o.depth || 4))), nm = t || 'fact', g = G(cx, cy, S / 560, o, parent);
      const cols = ['#d3e6fa', '#e6dcf7', '#ffe9b3', '#dff1ff', '#f3ead8', '#e3e7eb'], fact = n => n <= 1 ? 1 : n * fact(n - 1);
      for (let i = 0; i < d; i++) { const n = d - i, base = n === 1, w = 440 - i * 60, h = 300 - i * 56, x = -250 + i * 30, y = -150 + i * 40;
        P(g, R(x, y, w, h, 14), base ? OK : cols[i % cols.length], base ? INK.green : INK.blue, 3);
        if (showLab(o)) label(g, x + 14, y + 26, base ? `${nm}(1) = 1 (base)` : `${nm}(${n}) = ${n} × ${nm}(${n - 1})`, base ? TXT.green : TXT.blue, 19); }
      arr(g, 240, -120, 240, 110, INK.blue, 3); if (showLab(o)) label(g, 254, -60, 'calls', TXT.blue, 20);
      arr(g, 272, 110, 272, -120, INK.orange, 3); if (showLab(o)) label(g, 254, 140, `returns ${fact(d)}`, TXT.orange, 20, 'middle');
      return g;
    },

    // "apicall cx cy width |App,Service,request,response" — one app asks another through its API; loop flow
    apicall: ([cx, cy, S = 640], o, t, parent) => {
      const [a, b, rq, rs] = list(t, 'Weather app,Weather service,GET /weather?city=Paris,{ temp: 21 }'), g = G(cx, cy, S / 640, o, parent);
      for (const [x, nm, f] of [[-220, a, '#dff1ff'], [220, b, '#f3ead8']]) { P(g, R(x - 100, -80, 200, 160, 12), f, DK); P(g, R(x - 100, -80, 200, 30, 12), '#c9d1d9', DK, 2);
        ['#e04b3a', '#f3c33b', '#5fae3a'].forEach((c, i) => P(g, C(x - 82 + i * 16, -65, 5), c, DK, 1.4)); if (t || showLab(o)) label(g, x, 116, nm, TXT.blue, 22, 'middle'); }
      P(g, C(-220, 10, 24), '#ffd84a', INK.orange, 2.5); P(g, R(170, -30, 100, 70, 4), '#fdfdfb', '#8a6414', 2); line(g, 'M182 -12 H258 M182 4 H258 M182 20 H236', '#9aa3ad', 2);
      P(g, R(-36, -50, 72, 100, 10), '#e6dcf7', '#6a4fa0'); if (showLab(o)) T(g, 0, 0, 'API', '#6a4fa0', 26);
      arr(g, -112, -30, 112, -30, INK.orange, 3.5, .08); if (t || showLab(o)) label(g, 0, -88, rq, TXT.orange, 19, 'middle');
      arr(g, 112, 40, -112, 40, INK.green, 3.5, .08); if (t || showLab(o)) label(g, 0, 104, rs, TXT.green, 20, 'middle');
      return g;
    },

    // "cloudsync cx cy width |file name" — the same file kept in step on a phone, the cloud and a laptop; loop flow
    cloudsync: ([cx, cy, S = 620], o, t, parent) => {
      const g = G(cx, cy, S / 620, o, parent), cl = mk('g', { transform: 'translate(0 -100) scale(.9)' }, g);
      P(cl, cloudD, '#dff1ff', INK.blue, 3.4); fileIcon(cl, -14, 4, 1.2);
      line(cl, 'M40 -6 A20 20 0 1 1 30 -24', INK.green, 3.5); line(cl, head(30, -24, 40, -14, 9), INK.green, 3.5, { class: 'ink head' });
      RECIPES.smartphone([-240, 60, 180], {}, '', g); RECIPES.laptop([240, 70, 200], {}, '', g);
      fileIcon(g, -240, 60, 1); fileIcon(g, 240, 46, .9);
      arr(g, -200, -40, -110, -90, INK.green, 3.5, .1); arr(g, -120, -60, -190, -10, INK.orange, 3.5, .1);
      arr(g, 110, -90, 200, -36, INK.green, 3.5, .1); arr(g, 190, -6, 120, -60, INK.orange, 3.5, .1);
      if (t || showLab(o)) label(g, 0, 160, t || 'same file everywhere', TXT.blue, 24, 'middle');
      return g;
    },

    // "pixelgrid cx cy width" — a small smiley image and the grid of brightness numbers that stores it
    pixelgrid: ([cx, cy, S = 660], o, t, parent) => {
      const pic = ['..####..', '.#oooo#.', '#o#oo#o#', '#oooooo#', '#o#oo#o#', '#oo##oo#', '.#oooo#.', '..####..'], val = { '.': 255, '#': 0, o: 200 }, sh = { '.': '#fdfdfb', '#': '#2f3a45', o: '#cfd5db' };
      const g = G(cx, cy, S / 660, o, parent), A = 26, B = 44, lx = -330, rx = 330 - 8 * B, y0 = -4 * B + 10;
      pic.forEach((r, i) => [...r].forEach((c, j) => mk('path', { d: R(lx + j * A, y0 + 70 + i * A, A, A), fill: sh[c], filter: 'url(#wc)', class: 'fillable' }, g)));
      let d = ''; for (let i = 0; i <= 8; i++) d += `M${lx} ${y0 + 70 + i * A} H${lx + 8 * A} M${lx + i * A} ${y0 + 70} V${y0 + 70 + 8 * A} `; line(g, d, '#9aa3ad', 1.5);
      line(g, R(lx, y0 + 70, 8 * A, 8 * A), DK, 3);
      let e = ''; for (let i = 0; i <= 8; i++) e += `M${rx} ${y0 + i * B} H${rx + 8 * B} M${rx + i * B} ${y0} V${y0 + 8 * B} `; line(g, e, '#9aa3ad', 1.5); line(g, R(rx, y0, 8 * B, 8 * B), DK, 3);
      pic.forEach((r, i) => [...r].forEach((c, j) => T(g, rx + j * B + B / 2, y0 + i * B + B / 2, val[c], c === '#' ? TXT.blue : '#9aa3ad', 15)));
      arr(g, lx + 8 * A + 14, 0, rx - 14, 0, INK.orange, 4); if (showLab(o)) { label(g, (lx + 8 * A + rx) / 2, -18, 'each pixel', TXT.orange, 20, 'middle'); label(g, (lx + 8 * A + rx) / 2, 34, 'is a number', TXT.orange, 20, 'middle'); }
      if (t || showLab(o)) label(g, lx + 4 * A, y0 + 56, t || 'image', TXT.blue, 22, 'middle'); if (showLab(o)) label(g, lx + 4 * A, y0 + 300, '0 = dark, 255 = light', '#7d8893', 16, 'middle');
      return g;
    },

    // "compress cx cy width |AAAAABBBCC" — run-length compression of the text: long row of letters → short code
    compress: ([cx, cy, S = 600], o, t, parent) => {
      const s = (t || 'AAAAABBBCC').slice(0, 14), runs = s.match(/(.)\1*/g), code = runs.map(r => r.length + r[0]).join(''), B = 40;
      const W = Math.max(s.length, code.length) * B, g = G(cx, cy, fit(S, W + 40, 1.4), o, parent);
      [...s].forEach((c, i) => { P(g, R(-s.length * B / 2 + i * B, -110, B, 50, 3), BOX, INK.blue, 2.2); T(g, -s.length * B / 2 + i * B + B / 2, -85, c, DK, 24); });
      [...code].forEach((c, i) => { const num = /\d/.test(c); P(g, R(-code.length * B / 2 + i * B, 50, B, 50, 3), num ? '#ffe58a' : OK, num ? INK.orange : INK.green, 2.2); T(g, -code.length * B / 2 + i * B + B / 2, 75, c, DK, 24); });
      arr(g, 0, -50, 0, 40, INK.orange, 4);
      if (showLab(o)) label(g, 16, 0, 'compress', TXT.orange, 22); label(g, -s.length * B / 2 - 10, -78, `${s.length}`, '#7d8893', 22, 'end'); label(g, -code.length * B / 2 - 10, 82, `${code.length}`, '#7d8893', 22, 'end');
      return g;
    },

    // "qrcode cx cy size" — generic square scan code: three corner finder squares and data dots
    qrcode: ([cx, cy, S = 280], o, t, parent) => {
      const N = 21, M = 12, g = G(cx, cy, S / (N * M + 32), o, parent), x0 = -N * M / 2; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      const inF = (i, j) => (i < 8 && j < 8) || (i < 8 && j > N - 9) || (i > N - 9 && j < 8);
      P(g, R(x0 - 16, x0 - 16, N * M + 32, N * M + 32, 8), '#fdfdfb', DK, 3);
      let d = ''; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (!inF(i, j) && (rnd() < .48 || (i === 6 && j % 2 === 0) || (j === 6 && i % 2 === 0))) d += R(x0 + j * M, x0 + i * M, M, M);
      mk('path', { d, fill: DK, class: 'fillable' }, g);
      for (const [i, j] of [[0, 0], [0, N - 7], [N - 7, 0]]) { const x = x0 + j * M, y = x0 + i * M; line(g, R(x + 6, y + 6, 6 * M, 6 * M), DK, M); P(g, R(x + 2 * M, y + 2 * M, 3 * M, 3 * M), DK, DK, 2); }
      if (t) label(g, 0, -x0 + 52, t, TXT.blue, 26, 'middle');
      return g;
    },

    // "firewall cx cy width" — brick wall between the internet and your network: safe packets pass, bad ones bounce; loop flow
    firewall: ([cx, cy, S = 640], o, t, parent) => {
      const g = G(cx, cy, S / 640, o, parent);
      P(g, R(-60, -140, 120, 280, 4), '#e08a5a', '#8a3a1a', 3.4);
      let d = ''; for (let r = 1; r < 10; r++) d += `M-60 ${-140 + r * 28} H60 `; for (let r = 0; r < 10; r++) for (const x of (r % 2 ? [-30, 30] : [0])) d += `M${x} ${-140 + r * 28} V${-112 + r * 28} `;
      line(g, d, '#8a3a1a', 2); mk('path', { d: R(-62, 6, 124, 40), fill: '#fdfdfb', class: 'fillable' }, g); line(g, 'M-60 6 H60 M-60 46 H60', '#8a3a1a', 3);
      const cl = mk('g', { transform: 'translate(-250 -10) scale(.6)' }, g); P(cl, cloudD, '#dff1ff', INK.blue, 4); if (showLab(o)) label(g, -250, 60, 'internet', TXT.blue, 22, 'middle');
      RECIPES.computer([250, -20, 150], {}, '', g); if (showLab(o)) label(g, 250, 70, 'your network', TXT.blue, 22, 'middle');
      arr(g, -170, 26, 180, 26, INK.green, 4); P(g, R(-150, 12, 34, 26, 4), OK, INK.green, 2.5); if (showLab(o)) label(g, -130, 104, 'allowed', TXT.green, 20, 'middle');
      P(g, R(-170, -93, 34, 26, 4), BAD, INK.red, 2.5); arr(g, -130, -80, -68, -80, INK.red, 4);
      line(g, 'M-102 -120 L-82 -100 M-82 -120 L-102 -100', INK.red, 4); if (showLab(o)) label(g, -153, -112, 'blocked', TXT.red, 20, 'middle');
      if (t || showLab(o)) label(g, 0, 172, t || 'firewall', '#8a3a1a', 26, 'middle');
      return g;
    },

    // "pwmeter cx cy width |password" — password box and a strength meter worked out from the password itself
    pwmeter: ([cx, cy, S = 520], o, t, parent) => {
      const pw = t || 'sunflower7', s = (pw.length >= 8) + (pw.length >= 12) + /\d/.test(pw) + /[^A-Za-z0-9]/.test(pw) + (/[a-z]/.test(pw) && /[A-Z]/.test(pw));
      const lvl = Math.max(1, Math.min(4, s)), cols = ['#e04b3a', '#f4a531', '#ffd84a', '#5fae3a'], words = ['Weak', 'Fair', 'Good', 'Strong'], g = G(cx, cy, S / 520, o, parent);
      P(g, R(-240, -100, 480, 64, 10), '#fdfdfb', DK); label(g, -220, -58, pw.length > 22 ? pw.slice(0, 21) + '…' : pw, DK, 30); if (showLab(o)) label(g, -240, -112, 'password', TXT.blue, 20);
      for (let i = 0; i < 4; i++) P(g, R(-240 + i * 122, 0, 114, 30, 8), i < lvl ? cols[lvl - 1] : '#e3e7eb', i < lvl ? DK : '#9aa3ad', 2.5);
      if (showLab(o)) label(g, 0, 78, words[lvl - 1], [TXT.red, TXT.orange, TXT.yellow, TXT.green][lvl - 1], 32, 'middle');
      if (showLab(o)) label(g, 0, 116, `${pw.length} characters${/\d/.test(pw) ? ', digits' : ''}${/[^A-Za-z0-9]/.test(pw) ? ', symbols' : ''}${/[a-z]/.test(pw) && /[A-Z]/.test(pw) ? ', mixed case' : ''}`, '#7d8893', 18, 'middle');
      return g;
    },

    // "commits cx cy width k=line|branch |msg,msg,msg" — version history: commits on a line, HEAD on the newest; branch adds a merged side branch
    commits: ([cx, cy, S = 640], o, t, parent) => {
      const msgs = list(t, 'start,add menu,fix typo,new page'), n = msgs.length, STEP = 150, NW = (n - 1) * STEP + 120, g = G(cx, cy, fit(S, NW + 60, 1.3), o, parent), x0 = -(n - 1) * STEP / 2, br = o.k === 'branch' && n >= 3;
      const hex = (m, i) => ([...m].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7 + i) % 4096).toString(16).padStart(3, '0');
      line(g, `M${x0 - 40} 0 H${x0 + (n - 1) * STEP}`, INK.blue, 5);
      if (br) { const a = x0 + STEP, b = x0 + (n - 1) * STEP; line(g, `M${a} 0 Q${a + 30} -90 ${a + 70} -90 H${b - 70} Q${b - 30} -90 ${b} 0`, INK.orange, 4);
        P(g, C((a + b) / 2, -90, 14), HI, INK.orange, 3); if (showLab(o)) label(g, (a + b) / 2, -116, 'feature', TXT.orange, 20, 'middle'); }
      msgs.forEach((m, i) => { const x = x0 + i * STEP; P(g, C(x, 0, 18), i === n - 1 ? '#ffe58a' : BOX, INK.blue, 3); if (t || showLab(o)) label(g, x, 50, m, DK, 20, 'middle'); label(g, x, 76, hex(m, i), '#9aa3ad', 16, 'middle'); });
      const hx = x0 + (n - 1) * STEP; P(g, R(hx - 34, br ? 106 : -66, 68, 28, 6), '#e6dcf7', '#6a4fa0', 2.5); if (showLab(o)) T(g, hx, br ? 120 : -52, 'HEAD', '#6a4fa0', 18);
      return g;
    },

    // "mltrain cx cy width" — training loop: data → model → prediction → error → adjust the model; loop flow
    mltrain: ([cx, cy, S = 640], o, t, parent) => {
      const g = G(cx, cy, S / 640, o, parent);
      // data: a little table
      P(g, R(-320, -40, 130, 90, 6), '#fdfdfb', DK); line(g, 'M-320 -10 H-190 M-320 20 H-190 M-276 -40 V50 M-233 -40 V50', '#9aa3ad', 2); if (showLab(o)) label(g, -255, -54, 'data', TXT.blue, 24, 'middle');
      // model: small network
      P(g, R(-75, -170, 150, 110, 12), '#e6dcf7', '#6a4fa0'); const ln = [[-45, [-140, -90]], [0, [-150, -115, -80]], [45, [-115]]]; let d = '';
      for (let i = 0; i < 2; i++) for (const y1 of ln[i][1]) for (const y2 of ln[i + 1][1]) d += `M${ln[i][0]} ${y1} L${ln[i + 1][0]} ${y2} `;
      line(g, d, '#9a86c4', 1.8); for (const [x, ys] of ln) for (const y of ys) P(g, C(x, y, 9), '#fdfdfb', '#6a4fa0', 2.2); if (showLab(o)) label(g, 0, -182, 'model', '#6a4fa0', 24, 'middle');
      // prediction and error
      P(g, C(255, 5, 48), '#ffe58a', INK.orange); T(g, 255, 0, '7 ?', DK, 30); if (showLab(o)) label(g, 255, -60, 'prediction', TXT.orange, 22, 'middle');
      P(g, R(-80, 110, 160, 64, 10), BAD, INK.red); if (showLab(o)) { T(g, 0, 132, 'error', DK, 22); T(g, 0, 156, 'answer was 9', TXT.red, 17); }
      arr(g, -186, -20, -84, -100, INK.blue, 3.5, .08); arr(g, 84, -100, 200, -20, INK.orange, 3.5, .08); arr(g, 220, 50, 88, 132, INK.red, 3.5, -.08);
      arr(g, 0, 104, 0, -52, '#6a4fa0', 3.5); if (showLab(o)) label(g, 14, 30, 'adjust', '#6a4fa0', 22);
      if (t) label(g, 0, 214, t, TXT.blue, 22, 'middle');
      return g;
    },
  });
})();
