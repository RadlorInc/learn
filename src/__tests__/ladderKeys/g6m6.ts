// Blind answer key for g6m6's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g6m6 N`), never from the generator.
// Lengths are read from the LABELS a child reads; the drawn geometry is only used to check that the
// picture agrees with its labels (a mismatch throws — a picture that disagrees with its numbers is a defect).
type Q = { text: string; picture: any; choices?: string[] }
type Pt = [number, number]

const err = (q: Q, why: string): never => { throw new Error(`g6m6 key: ${why} in "${q.text}"`) }
const fail = (q: Q): never => err(q, 'no rule')
const r6 = (x: number) => Math.round(x * 1e6) / 1e6
const fmt = (x: number) => String(r6(x))
const eq = (a: number, b: number) => Math.abs(a - b) < 1e-6

// ── exact fractions (small numbers only) ───────────────────────────────────────────────────────────
type F = [number, number]
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const fr = (n: number, d = 1): F => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g] }
const mul = (a: F, b: F) => fr(a[0] * b[0], a[1] * b[1])
const sub = (a: F, b: F) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1])
const dvd = (a: F, b: F) => fr(a[0] * b[1], a[1] * b[0])
const feq = (a: F, b: F) => a[0] * b[1] === b[0] * a[1]
/** "3", "1/2", "11 1/4" (a unit may follow). */
function pf(s: string): F | null {
  const m = s.trim().match(/^(\d+)(?: (\d+)\/(\d+))?(?:\s|$)/) ?? null
  const p = s.trim().match(/^(\d+)\/(\d+)(?:\s|$)/)
  if (p) return fr(+p[1], +p[2])
  if (!m) return null
  return m[2] ? fr(+m[1] * +m[3] + +m[2], +m[3]) : fr(+m[1])
}
const ffmt = ([n, d]: F, q: Q) => {
  if (n < 0) err(q, 'negative answer')
  if (d === 1) return String(n)
  const w = Math.floor(n / d), r = n % d
  return w ? `${w} ${r}/${d}` : `${r}/${d}`
}

// ── pictures ─────────────────────────────────────────────────────────────────────────────────────
const len = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])
const shoelace = (p: Pt[]) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0)) / 2
const num = (lab: unknown, q: Q): number => {
  const m = typeof lab === 'string' ? lab.match(/^(\d+(?:\.\d+)?) [a-z]+$/) : null
  return m ? +m[1] : err(q, `unreadable label ${JSON.stringify(lab)}`)
}
/** Every numeric side/segment label must equal its drawn length. */
function checkPoly(q: Q) {
  const p = q.picture
  if (p?.kind !== 'poly') err(q, 'expected a poly picture')
  for (const s of p.shapes) (s.sides ?? []).forEach((lab: string | null, i: number) => {
    if (lab && lab !== '?' && !eq(num(lab, q), len(s.pts[i], s.pts[(i + 1) % s.pts.length]))) err(q, `side label ${lab} disagrees with the drawing`)
  })
  for (const g of p.segs ?? []) if (g.label && g.label !== '?' && !eq(num(g.label, q), len(g.a, g.b))) err(q, `segment label ${g.label} disagrees with the drawing`)
}
const shape0 = (q: Q) => q.picture.shapes[0] as { pts: Pt[]; sides?: (string | null)[]; right?: number[] }
/** The base (bottom side, labelled) and the dashed height perpendicular to it. */
function baseHeight(q: Q): { b: number | null; h: number | null } {
  checkPoly(q)
  const s = shape0(q), [p0, p1] = s.pts
  const seg = (q.picture.segs ?? []).filter((g: any) => g.dashed)
  if (seg.length !== 1) err(q, 'expected one dashed height')
  const g = seg[0]
  if (p0[1] !== p1[1] || g.a[0] !== g.b[0]) err(q, 'height is not perpendicular to the base')
  // the height must span from the base line to the far side of the shape
  const top = Math.max(...s.pts.map(v => v[1]))
  if (!eq(Math.abs(g.a[1] - g.b[1]), top - p0[1])) err(q, 'dashed segment is not the full height')
  const lab = s.sides?.[0]
  return { b: lab && lab !== '?' ? num(lab, q) : null, h: g.label && g.label !== '?' ? num(g.label, q) : null }
}
const need = (x: number | null, q: Q, what: string): number => (x === null ? err(q, `no ${what}`) : x)

/** "Name is right" iff the claim is correct; "No, it is V ..." iff the claim is wrong and V is correct. */
function judge(q: Q, claim: number, correct: number): string {
  const ok = (q.choices ?? []).filter(c => {
    if (/ is right$/.test(c)) return eq(claim, correct)
    const m = c.match(/^No, it is (\d+(?:\.\d+)?)/)
    return !!m && !eq(claim, correct) && eq(+m[1], correct)
  })
  if (ok.length !== 1) err(q, `${ok.length} choices fit ${JSON.stringify(q.choices)}`)
  return ok[0]
}
function judgeF(q: Q, claim: F, correct: F): string {
  const ok = (q.choices ?? []).filter(c => {
    if (/ is right$/.test(c)) return feq(claim, correct)
    const m = c.match(/^No, it is (.+?) cubic \w+$/)
    const v = m ? pf(m[1]) : null
    return !!v && !feq(claim, correct) && feq(v, correct)
  })
  if (ok.length !== 1) err(q, `${ok.length} choices fit ${JSON.stringify(q.choices)}`)
  return ok[0]
}
const claimed = (q: Q) => { const m = q.text.match(/= (\d+(?:\.\d+)?)/); return m ? +m[1] : err(q, 'no claim') }

// house: rectangle wall + triangle roof. pts [0,0],[w,0],[w,h],[peak],[0,h]
function house(q: Q): number {
  checkPoly(q)
  const s = shape0(q), P = s.pts
  if (P.length !== 5 || P[0][1] !== P[1][1] || P[1][0] !== P[2][0] || P[4][0] !== P[0][0] || P[2][1] !== P[4][1]) err(q, 'not a house shape')
  const w = num(s.sides?.[0], q), h = num(s.sides?.[1], q)
  const roof = (q.picture.segs ?? []).find((g: any) => g.label && g.label !== '?')
  const r = num(roof?.label, q)
  const a = w * h + (w * r) / 2
  if (!eq(a, shoelace(P))) err(q, 'house area disagrees with the drawing')
  return a
}

function prism(q: Q): [number, number, number] {
  const L = q.picture?.labels
  if (q.picture?.kind !== 'solid' || !L) err(q, 'expected a solid')
  return [num(L.l, q), num(L.w, q), num(L.h, q)]
}
const sa = ([l, w, h]: number[]) => 2 * (l * w + l * h + w * h)
function prismF(q: Q): [F, F, F] {
  const L = q.picture?.labels
  if (q.picture?.kind !== 'solid' || !L) err(q, 'expected a solid')
  const g = (s: string) => pf(s) ?? err(q, `unreadable label ${s}`)
  return [g(L.l), g(L.w), g(L.h)]
}
const vol = (d: F[]) => d.reduce(mul, fr(1))
/** "A long, B wide and C tall" → three fractions. */
function dimsIn(s: string, q: Q): F[] | null {
  const m = s.match(/is ([\d /]+?) \w+ long, ([\d /]+?) \w+ wide and ([\d /]+?) \w+ tall/)
  return m ? [m[1], m[2], m[3]].map(x => pf(x) ?? err(q, `unreadable ${x}`)) : null
}

// angles on a straight line
function lineAngle(q: Q): { known: number[]; unknown: number; parts: number[] } {
  const p = q.picture
  if (p?.kind !== 'angle' || p.deg !== 180) err(q, 'expected a straight-line angle')
  const known: number[] = []
  let unknown = 0
  ;(p.partLabels as (string | null)[]).forEach(l => {
    if (l === '?') unknown++
    else if (l) known.push(+(l.match(/^(\d+)°$/) ?? err(q, `label ${l}`))[1])
  })
  return { known, unknown, parts: p.parts }
}
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0)
/** The drawing must show the answer's size where the "?" is. */
function checkQ(q: Q, ans: number) {
  const { parts } = lineAngle(q)
  ;(q.picture.partLabels as (string | null)[]).forEach((l, i) => { if (l === '?' && parts[i] !== ans) err(q, `"?" is drawn ${parts[i]}°, answer ${ans}°`) })
  if (sum(parts) !== 180) err(q, 'parts do not make a straight line')
}

export const SOLVE: Record<string, (q: Q) => string> = {
  // parallelograms
  'g6m6-t1': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^This shape has a base of (\d+) \w+ and a height of (\d+) \w+\. What is its area/))) {
      const { b, h } = baseHeight(q)
      if (b !== +m[1] || h !== +m[2]) err(q, 'text and picture disagree')
      return fmt(+m[1] * +m[2])
    }
    if (/^Find the area of this parallelogram/.test(t)) { const { b, h } = baseHeight(q); return fmt(need(b, q, 'base') * need(h, q, 'height')) }
    if (/^\w+ says the area is \d+ × \d+ = \d+ square \w+\. Which is true\?$/.test(t)) {
      const { b, h } = baseHeight(q)
      return judge(q, claimed(q), need(b, q, 'base') * need(h, q, 'height'))
    }
    if ((m = t.match(/^A parallelogram has an area of (\d+) square \w+\. Its base is (\d+) \w+\. How tall is it/))) {
      const { b } = baseHeight(q)
      if (b !== +m[2]) err(q, 'text and picture disagree')
      const h = +m[1] / +m[2]
      // The "?" height must NOT be drawn at its answer — that gives it away by size.
      if (eq(h, len(q.picture.segs[0].a, q.picture.segs[0].b))) err(q, '"?" height drawn at its answer')
      return fmt(h)
    }
    if ((m = t.match(/^An? [\w ]+ is shaped like a parallelogram\. [\w ]+ costs \$(\d+) for each square foot\. How many dollars does it cost to cover/))) {
      const { b, h } = baseHeight(q)
      return fmt(+m[1] * need(b, q, 'base') * need(h, q, 'height'))
    }
    return fail(q)
  },

  // triangles
  'g6m6-t2': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/^A triangle has a base of (\d+) \w+ and a height of (\d+) \w+\. What is its area/))) {
      const { b, h } = baseHeight(q)
      if (b !== +m[1] || h !== +m[2]) err(q, 'text and picture disagree')
      return fmt((+m[1] * +m[2]) / 2)
    }
    if (/^This triangle has a square corner\. What is its area/.test(t)) {
      checkPoly(q)
      const s = shape0(q), r = s.right ?? []
      if (r.length !== 1) err(q, 'no single right-angle mark')
      const i = r[0], n = s.pts.length, v = s.pts[i], a = s.pts[(i + n - 1) % n], b = s.pts[(i + 1) % n]
      if (!eq((a[0] - v[0]) * (b[0] - v[0]) + (a[1] - v[1]) * (b[1] - v[1]), 0)) err(q, 'marked corner is not square')
      const area = (num(s.sides?.[(i + n - 1) % n], q) * num(s.sides?.[i], q)) / 2
      return fmt(area)
    }
    if (/^\w+ says this triangle's area is \d+ × \d+ = \d+ square \w+\. Which is true\?$/.test(t)) {
      const { b, h } = baseHeight(q)
      return judge(q, claimed(q), (need(b, q, 'base') * need(h, q, 'height')) / 2)
    }
    if ((m = t.match(/^A triangle has an area of (\d+(?:\.\d+)?) square \w+ and a height of (\d+) \w+\. How long is its base/))) {
      const { h } = baseHeight(q)
      if (h !== +m[2]) err(q, 'text and picture disagree')
      const b = (2 * +m[1]) / +m[2]
      const s = shape0(q)
      // The "?" base must NOT be drawn at its answer — that gives it away by size.
      if (eq(b, len(s.pts[0], s.pts[1]))) err(q, '"?" base drawn at its answer')
      return fmt(b)
    }
    if ((m = t.match(/^A [\w ]+? (\d+) triangle \w+, all the same size\. Each one is (\d+) \w+ along the bottom and (\d+) \w+ tall\. How many square \w+ of cloth/))) {
      const { b, h } = baseHeight(q)
      if (b !== +m[2] || h !== +m[3]) err(q, 'text and picture disagree')
      return fmt((+m[1] * +m[2] * +m[3]) / 2)
    }
    return fail(q)
  },

  // composite shapes
  'g6m6-t3': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^The dashed line cuts this wall into a rectangle and a triangle roof\. What is its area/.test(t)) return fmt(house(q))
    if (/^What is the area of this L shape/.test(t)) {
      checkPoly(q)
      const s = shape0(q), P = s.pts, n = P.length
      // walk the outline using each side's LABEL for its length, the drawing only for its direction
      const walk: Pt[] = [[0, 0]]
      for (let i = 0; i < n - 1; i++) {
        const a = P[i], b = P[i + 1], d = len(a, b), L = num(s.sides?.[i], q), c = walk[i]
        walk.push([c[0] + ((b[0] - a[0]) / d) * L, c[1] + ((b[1] - a[1]) / d) * L])
      }
      if (!eq(len(walk[n - 1], walk[0]), num(s.sides?.[n - 1], q))) err(q, 'side labels do not close')
      return fmt(shoelace(walk))
    }
    if (/^This shape is a rectangle with a triangle on one end\. What is its area/.test(t)) {
      checkPoly(q)
      const s = shape0(q), P = s.pts
      if (P.length !== 4 || P[0][1] !== P[1][1] || P[2][1] !== P[3][1] || P[3][0] !== P[0][0]) err(q, 'unexpected shape')
      const bottom = num(s.sides?.[0], q), top = num(s.sides?.[2], q), side = num(s.sides?.[3], q)
      const a = top * side + ((bottom - top) * side) / 2
      if (!eq(a, shoelace(P))) err(q, 'area disagrees with the drawing')
      return fmt(a)
    }
    if (/^\w+ multiplies the widest across by the tallest up: \d+ × \d+ = \d+ square \w+\. Which is true\?$/.test(t)) return judge(q, claimed(q), house(q))
    if ((m = t.match(/^A shed has two end walls shaped like this\. Paint costs \$(\d+) for each square foot\. How many dollars does it cost to paint both walls\?$/)))
      return fmt(2 * +m[1] * house(q))
    return fail(q)
  },

  // nets and surface area
  'g6m6-t4': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^A box is unfolded flat\. The number on each flat side is its area\. How many square \w+ of paper cover the box\?$/.test(t)) {
      checkPoly(q)
      const shapes = q.picture.shapes as { pts: Pt[] }[], labels = q.picture.labels as { at: Pt; text: string }[]
      if (shapes.length !== 6 || labels.length !== 6) err(q, 'not a six-face net')
      for (const s of shapes) {
        const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1])
        const inside = labels.filter(l => l.at[0] > Math.min(...xs) && l.at[0] < Math.max(...xs) && l.at[1] > Math.min(...ys) && l.at[1] < Math.max(...ys))
        if (inside.length !== 1 || !eq(+inside[0].text, shoelace(s.pts))) err(q, 'a face label disagrees with its face')
      }
      return fmt(sum(labels.map(l => +l.text)))
    }
    if (/^This box is unfolded flat below\. How many square \w+ of paper cover it\?$/.test(t)) {
      checkPoly(q)
      const shapes = q.picture.shapes as { pts: Pt[]; sides?: (string | null)[] }[]
      const labs = shapes.flatMap(s => (s.sides ?? []).filter((x): x is string => !!x)).map(x => num(x, q))
      if (labs.length !== 3) err(q, 'expected three edge labels')
      const area = sa(labs)
      if (!eq(area, sum(shapes.map(s => shoelace(s.pts))))) err(q, 'net faces disagree with the three edges')
      return fmt(area)
    }
    if (/^\w+ adds the three sides you can see: \d+ \+ \d+ \+ \d+ = \d+ square \w+\. \w+ says that is all the paper this box needs\. Which is true\?$/.test(t))
      return judge(q, claimed(q), sa(prism(q)))
    if ((m = t.match(/^A cube has a surface area of (\d+) square \w+\. How long is each edge/))) {
      const e = Math.sqrt(+m[1] / 6)
      if (!Number.isInteger(e)) err(q, 'edge is not whole')
      return fmt(e)
    }
    if ((m = t.match(/^\w+ has a sheet of wrapping paper with (\d+) square \w+\. \w+ covers every side of this gift box with no overlap\. How many square \w+ of paper are left\?$/))) {
      const left = +m[1] - sa(prism(q))
      if (left < 0) err(q, 'not enough paper')
      return fmt(left)
    }
    return fail(q)
  },

  // volume with fraction edges
  'g6m6-t5': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^A box is .* tall\. What is its volume/.test(t)) {
      const d = dimsIn(t, q) ?? fail(q), p = prismF(q)
      if (!d.every((x, i) => feq(x, p[i]))) err(q, 'text and picture disagree')
      return ffmt(vol(d), q)
    }
    if (/^What is the volume of this box/.test(t)) return ffmt(vol(prismF(q)), q)
    if ((m = t.match(/^\w+ drops the halves and says the volume is (\d+) × (\d+) × (\d+) = (\d+) cubic \w+\. Which is true\?$/)))
      return judgeF(q, fr(+m[4]), vol(prismF(q)))
    if ((m = t.match(/^A box holds ([\d /]+?) cubic \w+\. It is (\d+) \w+ long and (\d+) \w+ wide\. How tall is it/))) {
      const V = pf(m[1]) ?? fail(q), L = q.picture?.labels
      if (q.picture?.kind !== 'solid' || L?.h !== '?') err(q, 'expected a box with an unknown height')
      const l = pf(L.l), w = pf(L.w)
      if (!l || !w || !feq(l, fr(+m[2])) || !feq(w, fr(+m[3]))) err(q, 'text and picture disagree')
      return ffmt(dvd(V, fr(+m[2] * +m[3])), q)
    }
    if ((m = t.match(/^The (\w+) (\w+) is (.+?) tall\. The (\w+) \2 is (.+?) tall\. How many more cubic \w+ does the \1 \2 hold than the \4 \2\?$/))) {
      const a = dimsIn(`is ${m[3]} tall`, q) ?? fail(q), b = dimsIn(`is ${m[5]} tall`, q) ?? fail(q)
      const rows = q.picture?.rows as string[][] | undefined
      const row = (name: string) => rows?.find(r => r[0] === name)?.slice(1).map(x => pf(x) ?? err(q, `cell ${x}`)) ?? err(q, `no ${name} row`)
      const ra = row(m[1]), rb = row(m[4])
      if (!a.every((x, i) => feq(x, ra[i])) || !b.every((x, i) => feq(x, rb[i]))) err(q, 'text and table disagree')
      const diff = sub(vol(a), vol(b))
      if (diff[0] <= 0) err(q, `the ${m[1]} one does not hold more`)
      return ffmt(diff, q)
    }
    return fail(q)
  },

  // angles on a straight line
  'g6m6-t6': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^(Two|Three) angles sit side by side on a straight line\. How many degrees is the missing angle\?$/.test(t)) {
      const { known, unknown, parts } = lineAngle(q)
      const want = t.startsWith('Two') ? 2 : 3
      if (unknown !== 1 || parts.length !== want) err(q, 'picture does not match the count')
      const a = 180 - sum(known)
      checkQ(q, a)
      return fmt(a)
    }
    if (/^\w+ says the missing angle is \d+ − \d+ = \d+°\. Which is true\?$/.test(t)) {
      const { known, unknown } = lineAngle(q)
      if (unknown !== 1) err(q, 'expected one "?"')
      const a = 180 - sum(known)
      // A choice level: the "?" must NOT be drawn at the answer, or the child picks it by eye.
      const { parts } = lineAngle(q)
      ;(q.picture.partLabels as (string | null)[]).forEach((l, i) => { if (l === '?' && parts[i] === a) err(q, `"?" drawn at its answer ${a}°`) })
      if (sum(parts) !== 180) err(q, 'parts do not make a straight line')
      const ok = (q.choices ?? []).filter(c => / is right$/.test(c) ? claimed(q) === a : claimed(q) !== a && c === `No, it is ${a}°`)
      if (ok.length !== 1) err(q, `${ok.length} choices fit ${JSON.stringify(q.choices)}`)
      return ok[0]
    }
    if ((m = t.match(/^A straight line is split into three angles\. One is (\d+)°\. The other two are equal\. How many degrees is each equal angle\?$/))) {
      const { known, unknown } = lineAngle(q)
      if (unknown !== 2 || known.length !== 1 || known[0] !== +m[1]) err(q, 'text and picture disagree')
      const a = (180 - +m[1]) / 2
      if (!Number.isInteger(a)) err(q, 'not whole')
      checkQ(q, a)
      return fmt(a)
    }
    if ((m = t.match(/^An? \w+ (?:leans|rests) on (?:a )?flat \w+\. The angle on its right side is (\d+)° bigger than the angle on its left side\. How many degrees is the angle on the left side\?$/))) {
      const left = (180 - +m[1]) / 2
      if (!Number.isInteger(left)) err(q, 'not whole')
      // parts are drawn counter-clockwise from the right-hand ray, so parts[0] is the right side
      const { parts } = lineAngle(q)
      if (parts.length !== 2 || parts[0] !== left + +m[1]) err(q, 'drawn right-side angle disagrees')
      checkQ(q, left)
      return fmt(left)
    }
    return fail(q)
  },
}
