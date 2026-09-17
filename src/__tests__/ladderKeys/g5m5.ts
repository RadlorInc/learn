// Blind answer key for g5m5's practice ladders. Written from the QUESTIONS only
// (`npx tsx scripts/ladder-questions.mts g5m5 N`), never from the generator.
// Every picture that restates the text's numbers is checked against them; a disagreement throws.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule for'): never => { throw new Error(`g5m5 key: ${why}: ${q.text}`) }
const same = (q: Q, a: unknown, b: unknown, what: string) => { if (String(a) !== String(b)) fail(q, `picture disagrees (${what}: ${a} vs ${b})`) }
const m = (q: Q, re: RegExp) => q.text.match(re)

// ── exact fractions ─────────────────────────────────────────────────────────
type F = [number, number]
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const F = (n: number, d = 1): F => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g] }
const mul = (a: F, b: F) => F(a[0] * b[0], a[1] * b[1])
const add = (a: F, b: F) => F(a[0] * b[1] + b[0] * a[1], a[1] * b[1])
const eq = (a: F, b: F) => a[0] * b[1] === b[0] * a[1]
function parse(s: string): F {
  const t = s.trim()
  let r = t.match(/^(\d+) (\d+)\/(\d+)$/)
  if (r) return F(+r[1] * +r[3] + +r[2], +r[3])
  r = t.match(/^(\d+)\/(\d+)$/)
  if (r) return F(+r[1], +r[2])
  if (/^\d+$/.test(t)) return F(+t)
  throw new Error(`g5m5 key: cannot read number "${s}"`)
}
/** "7", "3/4" or "5 1/4". */
const show = (f: F) => f[1] === 1 ? String(f[0]) : f[0] < f[1] ? `${f[0]}/${f[1]}` : `${Math.floor(f[0] / f[1])} ${f[0] % f[1]}/${f[1]}`
const NUM = String.raw`\d+ \d+\/\d+|\d+\/\d+|\d+`

function pick(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) throw new Error(`g5m5 key: ${hits.length} choices fit: ${q.text} ${JSON.stringify(q.choices)}`)
  return hits[0]
}

const cubes = (q: Q) => (q.picture?.kind === 'cubes' ? q.picture : fail(q, 'no cubes picture'))
const vol = (p: { l: number; w: number; h: number }) => p.l * p.w * p.h
const div = (q: Q, a: number, b: number) => (a % b === 0 ? a / b : fail(q, `${a} ÷ ${b} is not whole`))

// "<n> <unit>" labels in a table row or a solid picture.
const len = (q: Q, s: string, unit: string) => {
  const r = s.match(/^(\d+) (ft|in|cm)$/)
  if (!r) fail(q, `cannot read length "${s}"`)
  same(q, r![2], unit, 'unit')
  return +r![1]
}
const UNIT: Record<string, string> = { feet: 'ft', inches: 'in', centimeters: 'cm' }

// ── quadrilateral families ──────────────────────────────────────────────────
type Fam = 'square' | 'rectangle' | 'rhombus' | 'parallelogram'
const FAMS: Fam[] = ['square', 'rectangle', 'rhombus', 'parallelogram']
/** Every name that fits a parallelogram with these properties. */
const names = (right: boolean, equal: boolean): Fam[] =>
  FAMS.filter(f => f === 'parallelogram' || (f === 'rectangle' && right) || (f === 'rhombus' && equal) || (f === 'square' && right && equal))
/** Is every X a Y? (X ⊆ Y) — true when every property Y needs, X guarantees. */
const need = (f: Fam) => ({ right: f === 'square' || f === 'rectangle', equal: f === 'square' || f === 'rhombus' })
const subset = (x: Fam, y: Fam) => (!need(y).right || need(x).right) && (!need(y).equal || need(x).equal)
const PLURAL: Record<string, Fam> = { squares: 'square', rectangles: 'rectangle', rhombuses: 'rhombus', rhombi: 'rhombus', parallelograms: 'parallelogram' }
const fam = (q: Q, s: string): Fam => (FAMS as string[]).includes(s) ? s as Fam : PLURAL[s] ?? fail(q, `unknown shape "${s}"`)

/** Properties from the MARKS, cross-checked against the drawn geometry. */
function shapeProps(q: Q, shape: any): { right: boolean; equal: boolean } {
  const pts: [number, number][] = shape.pts
  if (pts.length !== 4) fail(q, 'not a quadrilateral')
  const v = pts.map((p, i) => { const n = pts[(i + 1) % 4]; return [n[0] - p[0], n[1] - p[1]] })
  const L = v.map(([x, y]) => Math.hypot(x, y))
  // two pairs of parallel sides
  for (const [a, b] of [[0, 2], [1, 3]]) if (Math.abs(v[a][0] * v[b][1] - v[a][1] * v[b][0]) > 0.02 * L[a] * L[b]) fail(q, 'drawn shape is not a parallelogram')
  const geoRight = Math.abs(v[0][0] * v[1][0] + v[0][1] * v[1][1]) < 0.02 * L[0] * L[1]
  const geoEqual = Math.max(...L) - Math.min(...L) < 0.02 * Math.max(...L)
  const right = (shape.right?.length ?? 0) === 4
  if ((shape.right?.length ?? 0) % 4 !== 0) fail(q, 'some but not all corners marked square')
  let equal: boolean
  if (shape.sides) {
    const s = shape.sides.map((x: string) => x)
    equal = s.every((x: string) => x === s[0])
    s.forEach((x: string, i: number) => { const n = parseFloat(x); if (Math.abs(n - L[i]) > 0.02 * L[i]) fail(q, `side label ${x} vs drawn ${L[i].toFixed(2)}`) })
  } else {
    if ((shape.ticks?.length ?? 0) % 4 !== 0) fail(q, 'some but not all sides ticked')
    equal = (shape.ticks?.length ?? 0) === 4
  }
  same(q, geoRight, right, 'square-corner marks')
  same(q, geoEqual, equal, 'equal-side marks')
  return { right, equal }
}

// ── volume units ────────────────────────────────────────────────────────────
const TO_SMALL: Record<string, [string, number]> = {
  'cubic meters': ['cm', 1_000_000], 'cubic centimeters': ['cm', 1],
  'cubic feet': ['in', 1728], 'cubic inches': ['in', 1],
}
const SMALL_THINGS = ['lunch box', 'pencil box', 'shoe box', 'jewelry box', 'juice box']
const BIG_THINGS = ['shipping container', 'moving truck', 'swimming pool', 'classroom']

export const SOLVE: Record<string, (q: Q) => string> = {
  'g5m5-t1': q => {
    const p = cubes(q)
    if (/^Each small cube is the same size\. How many cubes fill this box\?$/.test(q.text)) return String(vol(p))
    let r = m(q, /When it is full, the box will be (\d+) cubes tall\. How many cubes will fill it\?/)
    if (r) { same(q, p.h, r[1], 'height'); return String(p.l * p.w * +r[1]) }
    r = m(q, /counts only the top layer of this box and says it holds (\d+) cubes\. How many cubes really fill it\?/)
    if (r) { same(q, p.l * p.w, r[1], 'top layer'); return pick(q, c => c === `${vol(p)} cubes`) }
    r = m(q, /^Here is one layer of cubes\. A stack of layers just like it has (\d+) cubes\. How many layers are in the stack\?$/)
    if (r) { same(q, p.h, 1, 'one layer'); return String(div(q, +r[1], p.l * p.w)) }
    r = m(q, /packs sugar cubes into this box with no gaps\. Then \w+ uses (\d+) of them for tea\. How many sugar cubes are left in the box\?/)
    if (r) return String(vol(p) - +r[1])
    return fail(q)
  },

  'g5m5-t2': q => {
    let r = m(q, /^A box is (\d+) cubes long, (\d+) cubes wide and (\d+) layers high\. How many cubes fill it\?$/)
    if (r) { const p = cubes(q); same(q, [p.l, p.w, p.h], [r[1], r[2], r[3]], 'box'); return String(+r[1] * +r[2] * +r[3]) }
    r = m(q, /^One layer of a box holds (\d+) cubes\. The box is (\d+) layers high\. How many cubes fill the box\?$/)
    if (r) return String(+r[1] * +r[2])
    r = m(q, /^A box is (\d+) cubes long, (\d+) cubes wide and (\d+) layers high\. (\w+) says it holds (\d+) cubes\. What happened\?$/)
    if (r) {
      const [l, w, h, who, said] = [+r[1], +r[2], +r[3], r[4], +r[5]]
      const p = cubes(q); same(q, [p.l, p.w, p.h], [l, w, h], 'box')
      return pick(q, c =>
        c === `${who} is right.` ? said === l * w * h
          : c === `${who} stopped after one layer.` ? said === l * w
            : c === `${who} added instead of multiplying.` ? said === l + w + h
              : fail(q, `unknown choice "${c}"`))
    }
    r = m(q, /^A box is (\d+) layers high and holds (\d+) cubes\. Each layer is (\d+) cubes long\. How many cubes wide is the box\?$/)
    if (r) return String(div(q, +r[2], +r[1] * +r[3]))
    r = m(q, /^A (\w+) is packed with (.+) in layers\. Each layer is (\d+) .+ long and (\d+) wide, and there are (\d+) layers\. A store orders (\d+) \w+\. How many .+ is that\?$/)
    if (r) { const p = cubes(q); same(q, [p.l, p.w, p.h], [r[3], r[4], r[5]], 'crate'); return String(+r[3] * +r[4] * +r[5] * +r[6]) }
    return fail(q)
  },

  'g5m5-t3': q => {
    const solid = () => {
      const p = q.picture?.kind === 'solid' ? q.picture : fail(q, 'no solid picture')
      return p.labels as { l: string; w: string; h: string }
    }
    let r = m(q, /^What is the volume of this box in cubic (feet|inches|centimeters)\?$/)
    if (r) { const s = solid(), u = UNIT[r[1]]; return String(len(q, s.l, u) * len(q, s.w, u) * len(q, s.h, u)) }
    r = m(q, /^An? [a-z ]+ is (\d+) (ft|in|cm) long, (\d+) (ft|in|cm) wide and (\d+) (ft|in|cm) tall\. What is its volume in cubic (feet|inches|centimeters)\?$/)
    if (r) { for (const u of [r[2], r[4], r[6]]) same(q, u, UNIT[r[7]], 'unit'); return String(+r[1] * +r[3] * +r[5]) }
    r = m(q, /adds the edges of this box and gets (\d+)\. Which is the volume of the box\?$/)
    if (r) {
      const s = solid(), u = (s.l.split(' ')[1])
      const [l, w, h] = [len(q, s.l, u), len(q, s.w, u), len(q, s.h, u)]
      same(q, l + w + h, r[1], 'edge sum')
      const word = Object.keys(UNIT).find(k => UNIT[k] === u)
      return pick(q, c => c === `${l * w * h} cubic ${word}`)
    }
    r = m(q, /^This box has a volume of (\d+) cubic (feet|inches|centimeters)\. How tall is it\?$/)
    if (r) {
      const s = solid(), u = UNIT[r[2]]
      same(q, s.h, `? ${u}`, 'unknown height')
      return String(div(q, +r[1], len(q, s.l, u) * len(q, s.w, u)))
    }
    r = m(q, /^A sandbox is (\d+) feet long, (\d+) feet wide and (\d+) feet deep\. \w+ has already poured in (\d+) cubic feet of sand\. How many more cubic feet of sand will fill it\?$/)
    if (r) {
      const s = solid(); same(q, [s.l, s.w, s.h], [`${r[1]} ft`, `${r[2]} ft`, `${r[3]} ft`], 'sandbox')
      const left = +r[1] * +r[2] * +r[3] - +r[4]
      return left >= 0 ? String(left) : fail(q, 'poured more than fits')
    }
    return fail(q)
  },

  'g5m5-t4': q => {
    const rowsVol = (unit: string) => {
      const p = q.picture?.kind === 'table' ? q.picture : fail(q, 'no table picture')
      same(q, p.head.slice(1), ['length', 'width', 'height'], 'table head')
      if (p.rows.length !== 2) fail(q, 'not two boxes')
      return p.rows as string[][]
    }
    let r = m(q, /^Two boxes are joined\. What is the total volume in cubic (feet|inches|centimeters)\?$/)
    if (r) { const u = UNIT[r[1]]; return String(rowsVol(u).reduce((s, row) => s + row.slice(1).reduce((a, x) => a * len(q, x, u), 1), 0)) }
    if (q.text === 'Two boxes are joined. Which way finds the total volume?') {
      const rows = rowsVol('')
      const u = rows[0][1].split(' ')[1]
      const want = rows.reduce((s, row) => s + row.slice(1).reduce((a, x) => a * len(q, x, u), 1), 0)
      const ev = (c: string) => c.split(' + ').reduce((s, t) => s + t.split(' × ').reduce((a, x) => a * +x, 1), 0)
      return pick(q, c => { if (!/^\d+( [×+] \d+)*$/.test(c)) fail(q, `cannot read "${c}"`); return ev(c) === want })
    }
    r = m(q, /builds a step stool from two wooden boxes\. The bottom box is (\d+) inches long, (\d+) inches wide and (\d+) inches tall\. The top box is (\d+) inches long, (\d+) inches wide and (\d+) inches tall\. What is the volume of the stool in cubic inches\?$/)
    if (r) return String(+r[1] * +r[2] * +r[3] + +r[4] * +r[5] * +r[6])
    r = m(q, /^Two boxes are joined\. Their total volume is (\d+) cubic (feet|inches|centimeters)\. How tall is Box B\?$/)
    if (r) {
      const u = UNIT[r[2]], [a, b] = rowsVol(u)
      same(q, b[3], `? ${u}`, 'unknown height')
      const va = a.slice(1).reduce((s, x) => s * len(q, x, u), 1)
      const rest = +r[1] - va
      return rest > 0 ? String(div(q, rest, len(q, b[1], u) * len(q, b[2], u))) : fail(q, 'Box A already fills the total')
    }
    r = m(q, /^A planter is made of the two joined boxes in the table\. \w+ fills it with soil\. One bag of soil fills (\d+) cubic feet\. How many bags does \w+ need\?$/)
    if (r) {
      const v = rowsVol('ft').reduce((s, row) => s + row.slice(1).reduce((a, x) => a * len(q, x, 'ft'), 1), 0)
      // A part-bag still has to be bought, so round up.
      return String(Math.ceil(v / +r[1]))
    }
    return fail(q)
  },

  'g5m5-t5': q => {
    const grid = (a: F, b: F, top: string, left: string) => {
      const p = q.picture?.kind === 'grid' ? q.picture : fail(q, 'no grid picture')
      same(q, [p.top, p.left], [top, left], 'side labels')
      same(q, p.cols, show(mul(a, F(2))), 'columns of half-foot tiles')
      same(q, p.rows, show(mul(b, F(2))), 'rows of half-foot tiles')
      return p
    }
    let r = m(q, new RegExp(`^An? \\w+ is (${NUM}) (?:feet|foot) long and (${NUM}) (?:feet|foot) wide\\. Each small tile is 1\\/2 foot on a side\\. How many square feet is the \\w+\\?$`))
    if (r) { const a = parse(r[1]), b = parse(r[2]); grid(a, b, `${r[1]} ft`, `${r[2]} ft`); return show(mul(a, b)) }
    r = m(q, new RegExp(`^An? [a-z ]+ is (${NUM}) (?:feet|foot) long and (${NUM}) (?:feet|foot) wide\\. What is its area in square feet\\?$`))
    if (r) return show(mul(parse(r[1]), parse(r[2])))
    r = m(q, /counts (\d+) small tiles on this rug and says the rug is (\d+) square feet\. What is the real area\?$/)
    if (r) {
      const p = q.picture?.kind === 'grid' ? q.picture : fail(q, 'no grid picture')
      same(q, p.rows * p.cols, r[1], 'tile count')
      const a = parse(p.top.replace(/ ft$/, '')), b = parse(p.left.replace(/ ft$/, ''))
      grid(a, b, p.top, p.left)
      const area = mul(a, b)
      return pick(q, c => { const x = c.match(new RegExp(`^(${NUM}) square feet$`)); return x ? eq(parse(x[1]), area) : fail(q, `cannot read "${c}"`) })
    }
    r = m(q, new RegExp(`^A rug is (${NUM}) square feet\\. It is covered with small tiles that are 1\\/2 foot on a side\\. How many small tiles cover it\\?$`))
    if (r) { const n = mul(parse(r[1]), F(4)); return n[1] === 1 ? String(n[0]) : fail(q, 'not a whole number of tiles') }
    r = m(q, new RegExp(`^\\w+ puts two rugs in a room\\. One rug is (${NUM}) (?:feet|foot) long and (${NUM}) (?:feet|foot) wide\\. The other rug is (${NUM}) (?:feet|foot) long and (${NUM}) (?:feet|foot) wide\\. How many square feet do the two rugs cover\\?$`))
    if (r) return show(add(mul(parse(r[1]), parse(r[2])), mul(parse(r[3]), parse(r[4]))))
    return fail(q)
  },

  'g5m5-t6': q => {
    const shapes = q.picture?.kind === 'poly' ? q.picture.shapes : fail(q, 'no poly picture')
    if (/^Look for marks that show square corners and equal sides\. What is the best name for this shape\?$/.test(q.text)) {
      if (shapes.length !== 1) fail(q, 'not one shape')
      const { right, equal } = shapeProps(q, shapes[0])
      return pick(q, c => c === names(right, equal)[0]) // FAMS is ordered most specific first
    }
    let r = m(q, /^Is every (\w+) an? (\w+)\?$/)
    if (r) {
      const x = fam(q, r[1]), y = fam(q, r[2])
      shapes.forEach((s: any) => { const p = shapeProps(q, s); if (!names(p.right, p.equal).includes(x)) fail(q, `picture is not a ${x}`) })
      // The four families all share the square, so "none of them" is never the answer.
      return pick(q, c => c === (subset(x, y) ? 'Yes, every one is.' : 'No, only some are.'))
    }
    r = m(q, /^A tile has two pairs of parallel sides\. It has (4|no) square corners, and its (4 sides are equal|sides are not all equal)\. Which list gives all of its names\?$/)
    if (r) {
      const right = r[1] === '4', equal = r[2].startsWith('4')
      const p = shapeProps(q, shapes[0]); same(q, [p.right, p.equal], [right, equal], 'tile')
      const want = names(right, equal)
      return pick(q, c => {
        const listed = c.replace(/ only$/, '').split(/, | and /).map(s => fam(q, s))
        return listed.length === want.length && want.every(f => listed.includes(f))
      })
    }
    r = m(q, /^\w+ cuts a tile with two pairs of parallel sides\. The marks show any square corners\. \w+ says it is an? (\w+)\. Is \w+ right\?$/)
    if (r) {
      const p = shapeProps(q, shapes[0])
      const fits = names(p.right, p.equal).includes(fam(q, r[1]))
      return pick(q, c => c === (fits ? 'Yes, that name fits it.' : 'No, that name does not fit it.'))
    }
    if (q.text === 'Which sentence is true?') {
      return pick(q, c => {
        let s = c.match(/^Every (\w+) is an? (\w+)\.$/)
        if (s) return subset(fam(q, s[1]), fam(q, s[2]))
        s = c.match(/^Some (\w+) are (\w+)\.$/)
        if (s) { fam(q, s[1]); fam(q, s[2]); return true } // every pair of families overlaps at the square
        s = c.match(/^No (\w+) is an? (\w+)\.$/)
        if (s) return false
        return fail(q, `cannot read "${c}"`)
      })
    }
    return fail(q)
  },

  'g5m5-t7': q => {
    let r = m(q, /^Each cube is 1 cubic (foot|inch|centimeter)\. What is the volume of this box in cubic (feet|inches|centimeters)\?$/)
    if (r) return String(vol(cubes(q)))
    r = m(q, /^Which unit fits best for the space inside an? ([a-z ]+)\?$/)
    if (r) {
      const big = BIG_THINGS.includes(r[1]) ? true : SMALL_THINGS.includes(r[1]) ? false : fail(q, `unknown object "${r[1]}"`)
      return pick(q, c => {
        if (c.startsWith('square ')) return false
        const u = TO_SMALL[c] ?? fail(q, `unknown unit "${c}"`)
        return big ? (c === 'cubic meters' || c === 'cubic feet') : u[1] === 1
      })
    }
    r = m(q, /fills a box with 1-centimeter cubes\. Each layer has (\d+) rows of (\d+) cubes, and there are (\d+) layers\. What is the volume of the box\?$/)
    if (r) {
      const p = cubes(q); same(q, [p.w, p.l, p.h], [r[1], r[2], r[3]], 'box')
      return pick(q, c => c === `${+r![1] * +r![2] * +r![3]} cubic centimeters`)
    }
    r = m(q, /^Box A holds (\d+) (cubic \w+)\. Box B holds (\d+) (cubic \w+)\. Which box has more space inside\?$/)
    if (r) {
      const [ua, ka] = TO_SMALL[r[2]] ?? fail(q, 'unit'), [ub, kb] = TO_SMALL[r[4]] ?? fail(q, 'unit')
      if (ua !== ub) fail(q, 'units from different systems')
      const a = +r[1] * ka, b = +r[3] * kb
      return pick(q, c => c === (a > b ? 'Box A' : a < b ? 'Box B' : 'They hold the same.'))
    }
    r = m(q, /^Each cube is 1 cubic (inch|centimeter)\. \w+ has this box of cubes and a second box that is (\d+) (in|cm) long, (\d+) (in|cm) wide and (\d+) (in|cm) tall\. What is the volume of both boxes together in cubic (inches|centimeters)\?$/)
    if (r) return String(vol(cubes(q)) + +r[2] * +r[4] * +r[6])
    return fail(q)
  },
}
