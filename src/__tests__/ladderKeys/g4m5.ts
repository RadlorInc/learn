// Blind answer key for g4m5's practice ladders. Written from the QUESTIONS (text + picture data) only;
// every answer is computed here from the words and coordinates, never read from the generator.
type Q = { text: string; picture: any; choices?: string[] }
type P = [number, number]

const fail = (q: Q, why = 'no rule matches'): never => { throw new Error(`g4m5 key: ${why}: ${q.text}`) }
const nums = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).map(Number)

/** The one choice that satisfies `ok`; throws if zero or several do. */
function pick(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit ${JSON.stringify(q.choices)}`)
  return hits[0]
}

/** "X says … Which is true?" — "X is right" when the claim is the truth, else "No, it is <article> <truth>". */
function verdict(q: Q, claim: string, truth: string, noun = ''): string {
  if (claim === truth) return pick(q, c => / is right\.?$/.test(c) || / is right\. /.test(c))
  const art = /^[aeiou]/.test(truth) ? 'an' : 'a'
  return pick(q, c => c === `No, it is ${art} ${truth}${noun}` || c === `No, it is ${truth}${noun}`)
}

// ---------- geometry ----------
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]]
const len = (v: P) => Math.hypot(v[0], v[1])
/** Angle between two directions as lines, 0..90. */
function lineAngle(u: P, v: P): number {
  const c = Math.abs(u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v))
  return (Math.acos(Math.min(1, c)) * 180) / Math.PI
}
/** Interior angle at b in degrees. */
function cornerDeg(a: P, b: P, c: P): number {
  const u = sub(a, b), v = sub(c, b)
  return (Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v))))) * 180) / Math.PI
}
function relation(q: Q, u: P, v: P): 'parallel' | 'perpendicular' | 'neither' {
  const a = lineAngle(u, v)
  if (a < 1.5) return 'parallel'
  if (a > 88.5) return 'perpendicular'
  if (a > 6 && a < 84) return 'neither'
  return fail(q, `lines at ${a.toFixed(1)}° are too close to call`)
}
const classOf = (deg: number) => (deg < 90 ? 'acute' : deg === 90 ? 'right' : deg < 180 ? 'obtuse' : fail({ text: `${deg}°`, picture: null }, 'not an angle class'))
const classOfNear = (deg: number) => (Math.abs(deg - 90) < 1 ? 'right' : deg < 90 ? 'acute' : 'obtuse')

// ---------- t1: line / ray / segment ----------
type Seg = { a: P; b: P; arrow?: 'end' | 'both'; dots?: boolean; label?: string }
const same = (p: P, r: P) => Math.abs(p[0] - r[0]) < 1e-6 && Math.abs(p[1] - r[1]) < 1e-6
/** Classify one drawn path from its real segment plus any lone dots sitting on its ends. */
function pathKind(q: Q, s: Seg, all: Seg[]): 'line' | 'ray' | 'line segment' {
  const lone = all.filter(d => d.dots && same(d.a, d.b))
  if (s.arrow === 'both') return 'line'
  if (s.arrow === 'end') {
    if (!lone.some(d => same(d.a, s.a))) fail(q, 'a ray with no dot at its start')
    return 'ray'
  }
  if (s.dots) return 'line segment'
  return fail(q, 'a path with no ends drawn')
}
const realSegs = (pic: any): Seg[] => (pic.segs as Seg[]).filter(s => !same(s.a, s.b))

// ---------- t7: quadrilaterals ----------
function quadFacts(pts: P[]) {
  const side = (i: number) => sub(pts[(i + 1) % 4], pts[i])
  const par = (i: number, j: number) => lineAngle(side(i), side(j)) < 1.5
  const pairs = (par(0, 2) ? 1 : 0) + (par(1, 3) ? 1 : 0)
  const corners = pts.filter((_, i) => Math.abs(cornerDeg(pts[(i + 3) % 4], pts[i], pts[(i + 1) % 4]) - 90) < 1).length
  const L = [0, 1, 2, 3].map(i => len(side(i)))
  const equal = L.every(x => Math.abs(x - L[0]) < 0.05)
  return { pairs, corners, equal }
}
function bestQuad(q: Q, pairs: number, corners: number, equal: boolean): string {
  if (pairs === 1) return 'trapezoid'
  if (pairs !== 2) return fail(q, `${pairs} parallel pairs`)
  if (corners === 4) return equal ? 'square' : 'rectangle'
  if (corners !== 0) return fail(q, `${corners} square corners with 2 parallel pairs`)
  return equal ? 'rhombus' : 'parallelogram'
}

// ---------- t8: symmetry ----------
function reflect(p: P, a: P, b: P): P {
  const d = sub(b, a), t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2)
  const f: P = [a[0] + t * d[0], a[1] + t * d[1]]
  return [2 * f[0] - p[0], 2 * f[1] - p[1]]
}
const matches = (pts: P[], a: P, b: P) => pts.every(p => { const r = reflect(p, a, b); return pts.some(s => Math.hypot(r[0] - s[0], r[1] - s[1]) < 0.05) })
function foldLines(pts: P[]): number {
  const c: P = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
  const mids = pts.map((p, i) => [(p[0] + pts[(i + 1) % pts.length][0]) / 2, (p[1] + pts[(i + 1) % pts.length][1]) / 2] as P)
  const dirs: number[] = []
  for (const t of [...pts, ...mids]) {
    if (Math.hypot(t[0] - c[0], t[1] - c[1]) < 1e-6) continue
    const ang = ((Math.atan2(t[1] - c[1], t[0] - c[0]) * 180) / Math.PI + 180) % 180
    if (dirs.some(d => Math.min(Math.abs(d - ang), 180 - Math.abs(d - ang)) < 0.5)) continue
    const r = (ang * Math.PI) / 180
    if (matches(pts, c, [c[0] + Math.cos(r), c[1] + Math.sin(r)])) dirs.push(ang)
  }
  return dirs.length
}
function shapeName(pts: P[]): string {
  if (pts.length === 5) return 'house'
  if (pts.length !== 4) return '?'
  const f = quadFacts(pts)
  if (f.pairs === 2 && f.corners === 4) return f.equal ? 'square' : 'rectangle'
  return 'kite'
}

const angleSumLabels = (labels: (string | null)[]) => labels.filter(l => l && l !== '?').map(l => nums(l!)[0])

export const SOLVE: Record<string, (q: Q) => string> = {
  'g4m5-t1': q => {
    const t = q.text, pic = q.picture
    if (/^Look at the ends\. What is this\?/.test(t)) {
      const s = realSegs(pic)
      if (s.length !== 1) fail(q, 'expected one path')
      const k = pathKind(q, s[0], pic.segs)
      return pick(q, c => c === k)
    }
    let m = t.match(/Which path is (a line segment|a ray|a line)\?/)
    if (m) {
      const want = m[1].slice(2)
      const byY = new Map<number, string>()
      for (const s of realSegs(pic)) {
        if (s.a[1] !== s.b[1]) fail(q, 'path not horizontal')
        byY.set(s.a[1], pathKind(q, s, pic.segs))
      }
      const names = (pic.labels as { at: P; text: string }[]).filter(l => byY.get(l.at[1]) === want).map(l => l.text)
      if (names.length !== 1) fail(q, `${names.length} paths are a ${want}`)
      return pick(q, c => c === `path ${names[0]}`)
    }
    m = t.match(/says the (short|long) path is (a line segment|a ray|a line), because/)
    if (m) {
      const segs = realSegs(pic).map(s => ({ s, L: len(sub(s.b, s.a)) })).sort((x, y) => x.L - y.L)
      if (segs.length !== 2 || segs[0].L === segs[1].L) fail(q, 'expected one short and one long path')
      const s = m[1] === 'short' ? segs[0].s : segs[1].s
      return verdict(q, m[2].slice(2), pathKind(q, s, pic.segs))
    }
    if (/How many of them are rays\?/.test(t)) {
      const segs = realSegs(pic)
      segs.forEach(s => { if (!same(s.a, [0, 0])) fail(q, 'path does not start at the middle dot') })
      return String(segs.filter(s => pathKind(q, s, pic.segs) === 'ray').length)
    }
    if (/Which should you draw for it\?/.test(t)) {
      const k = /no start and no end|forever both ways/.test(t) ? 'line'
        : /forever|on and on/.test(t) ? 'ray'
        : /stops there|stretched tight from .* to /.test(t) ? 'line segment'
        : fail(q, 'story names no ends')
      return pick(q, c => c === k)
    }
    return fail(q)
  },

  'g4m5-t2': q => {
    const t = q.text, pic = q.picture
    if (pic?.kind !== 'angle') fail(q, 'no angle picture')
    if (pic.parts && pic.parts.reduce((a: number, b: number) => a + b, 0) !== pic.deg) fail(q, 'parts do not add to the whole')
    const m = t.match(/says this angle is an? (acute|right|obtuse) angle, because/)
    if (m) return verdict(q, m[1], classOf(pic.deg), ' angle')
    let deg = pic.deg
    if (/Is the part along the bottom ray/.test(t)) deg = pic.parts[0]
    if (/fill a square corner exactly/.test(t) && pic.deg !== 90) fail(q, 'text says square corner, picture disagrees')
    if (/part along the bottom ray is a whole square corner/.test(t) && pic.parts?.[0] !== 90) fail(q, 'text says bottom part is a square corner, picture disagrees')
    if (/acute, right or obtuse\?/.test(t)) return pick(q, c => c === classOf(deg))
    return fail(q)
  },

  'g4m5-t3': q => {
    const t = q.text, pic = q.picture
    let m = t.match(/the other ray is (one|two|three|four) small marks? past the (\d+)\. Each small mark is (\d+) more/)
    if (m) return String(Number(m[2]) + (['one', 'two', 'three', 'four'].indexOf(m[1]) + 1) * Number(m[3]))
    if (/^The angle is drawn on a protractor\. How many degrees/.test(t)) return String(pic.deg)
    if (/narrower or wider than a square corner\? Use that to pick its measure/.test(t)) {
      const k = classOf(pic.deg)
      const out = pick(q, c => classOf(nums(c)[0]) === k)
      if (nums(out)[0] !== pic.deg) fail(q, `the only ${k} choice ${out} is not the drawn ${pic.deg}°`)
      return out
    }
    m = t.match(/^(\w+) says this angle is (\d+)°\. Which is true\?/)
    if (m) {
      const claim = Number(m[2])
      if (claim === pic.deg) return pick(q, c => c === `${m![1]} is right. It is ${pic.deg}°.`)
      if (claim !== 180 - pic.deg) fail(q, `claim ${claim}° is not the far-end reading of ${pic.deg}°`)
      return pick(q, c => c === `${m![1]} counted from the far end. It is ${pic.deg}°.`)
    }
    m = t.match(/Then (?:it )?(closes|is lowered|is lifted|opens) (\d+)°( more)?\. How many degrees/)
    if (m) return String(/closes|lowered/.test(m[1]) ? pic.deg - Number(m[2]) : pic.deg + Number(m[2]))
    return fail(q)
  },

  'g4m5-t4': q => {
    const t = q.text, pic = q.picture
    if (/^Two angles sit side by side\. How many degrees is the whole angle\?/.test(t)) {
      if (pic.partLabels.includes('?') || pic.partLabels.some((l: any) => !l)) fail(q, 'a part is unlabelled')
      return String(angleSumLabels(pic.partLabels).reduce((a, b) => a + b, 0))
    }
    let m = t.match(/^The whole angle is a (right angle|straight line), (\d+)°\. One part is (\d+)°\. How many degrees is the other part\?/)
    if (m) return String(Number(m[2]) - Number(m[3]))
    m = t.match(/^The whole angle is a (right angle|straight line), (\d+)°\. One part is (\d+)°\. \w+ says the other part is (\d+)°\. What is the other part\?/)
    if (m) {
      const other = Number(m[2]) - Number(m[3])
      return pick(q, c => nums(c)[0] === other)
    }
    m = t.match(/^The three parts make a (straight line|right angle), (\d+)°\. How many degrees is the part marked with a question mark\?/)
    if (m) {
      if (pic.partLabels.filter((l: any) => l === '?').length !== 1) fail(q, 'not exactly one ? part')
      return String(Number(m[2]) - angleSumLabels(pic.partLabels).reduce((a, b) => a + b, 0))
    }
    m = t.match(/The first part opens (\d+)°, the next (\d+)°, and the last (\d+)°\. How many degrees is the whole fan open\?/)
    if (m) return String(Number(m[1]) + Number(m[2]) + Number(m[3]))
    m = t.match(/(\d+)° from one end to the other\. First it turns (\d+)°\. Then it turns (\d+)° more\. How many more degrees/)
    if (m) return String(Number(m[1]) - Number(m[2]) - Number(m[3]))
    return fail(q)
  },

  'g4m5-t5': q => {
    const t = q.text, pic = q.picture
    const segs = (pic.segs ?? []) as Seg[]
    const lines = segs.filter(s => s.arrow === 'both')
    const dir = (s: Seg) => sub(s.b, s.a)
    if (/^Are these lines parallel, perpendicular or neither\?/.test(t)) {
      if (lines.length !== 2) fail(q, 'expected two lines')
      return pick(q, c => c === relation(q, dir(lines[0]), dir(lines[1])))
    }
    if (/gap between these lines is measured near both ends\. Are the lines parallel\?/.test(t)) {
      const gaps = segs.filter(s => s.label).map(s => s.label!)
      if (gaps.length !== 2) fail(q, 'expected two gap labels')
      const byLabel = gaps[0] === gaps[1]
      const byDrawing = relation(q, dir(lines[0]), dir(lines[1])) === 'parallel'
      if (byLabel !== byDrawing) fail(q, `gaps ${gaps.join('/')} disagree with the drawing`)
      return pick(q, c => c === (byLabel ? 'yes' : 'no'))
    }
    let m = t.match(/says these lines are (parallel|perpendicular|neither parallel nor perpendicular), because/)
    if (m) {
      if (lines.length !== 2) fail(q, 'expected two lines')
      const truth = relation(q, dir(lines[0]), dir(lines[1]))
      const claim = m[1].startsWith('neither') ? 'neither' : m[1]
      if (claim === truth) return pick(q, c => / is right$/.test(c))
      const said = truth === 'neither' ? 'neither parallel nor perpendicular' : truth
      return pick(q, c => c === `No, they are ${said}`)
    }
    m = t.match(/Which two streets are (parallel|perpendicular)\?/)
    if (m) {
      const want = m[1]
      return pick(q, c => {
        const [x, y] = c.split(' and ').map(n => lines.find(s => s.label === n))
        if (!x || !y) fail(q, `street in "${c}" not on the map`)
        return relation(q, dir(x!), dir(y!)) === want
      })
    }
    m = t.match(/^Look at side ([A-D])([A-D]) and side ([A-D])([A-D])\. Are they parallel, perpendicular or neither\?/)
    if (m) {
      const sh = pic.shapes[0], at = (n: string) => sh.pts[sh.names.indexOf(n)] as P
      if (m.slice(1).some(n => sh.names.indexOf(n) < 0)) fail(q, 'side letter not on the shape')
      return pick(q, c => c === relation(q, sub(at(m![2]), at(m![1])), sub(at(m![4]), at(m![3]))))
    }
    return fail(q)
  },

  'g4m5-t6': q => {
    const t = q.text, pic = q.picture
    const tri = (degs: number[]) => {
      if (degs.length !== 3 || degs.reduce((a, b) => a + b, 0) !== 180) fail(q, `angles ${degs} are not a triangle`)
      const big = Math.max(...degs)
      return big < 90 ? 'acute' : big === 90 ? 'right' : 'obtuse'
    }
    const fromPts = () => {
      const p = pic.shapes[0].pts as P[]
      const big = Math.max(...p.map((_, i) => cornerDeg(p[(i + 2) % 3], p[i], p[(i + 1) % 3])))
      return classOfNear(big)
    }
    if (/Each list shows the three angles of a triangle\. Which one is an? (acute|right|obtuse) triangle\?/.test(t)) {
      const want = t.match(/is an? (acute|right|obtuse) triangle/)![1]
      return pick(q, c => tri(nums(c)) === want)
    }
    // The drawn triangle's class, checked against every number the question gives.
    let truth = fromPts()
    const labels: (string | null)[] | undefined = pic.shapes?.[0]?.angles
    if (labels) {
      const right: number[] = pic.shapes[0].right ?? []
      const degs = labels.map((l, i) => (l ? nums(l)[0] : right.includes(i) ? 90 : NaN))
      if (degs.some(Number.isNaN)) fail(q, 'an unlabelled, unmarked corner')
      if (tri(degs) !== truth) fail(q, `labels say ${tri(degs)}, drawing says ${truth}`)
    }
    const told = t.match(/a triangle with angles of (\d+)°, (\d+)° and (\d+)°/)
    if (told) {
      const k = tri(told.slice(1).map(Number))
      if (k !== truth) fail(q, `text says ${k}, drawing says ${truth}`)
      truth = k
    }
    const m = t.match(/says this is an? (acute|right|obtuse) triangle, because it has an? (\d+)° angle/)
    if (m) return verdict(q, m[1], truth, ' triangle')
    if (/Is (this|it) an acute triangle, a right triangle or an obtuse triangle\?/.test(t)) return pick(q, c => c === `${truth} triangle`)
    return fail(q)
  },

  'g4m5-t7': q => {
    const t = q.text, pic = q.picture
    const drawn = () => {
      if (pic?.kind !== 'poly' || pic.shapes.length !== 1 || pic.shapes[0].pts.length !== 4) fail(q, 'expected one four-sided shape')
      const sh = pic.shapes[0], f = quadFacts(sh.pts)
      // Marks the child is told to read must agree with the drawing.
      const marks = (sh.right ?? []).length
      if (marks && marks !== f.corners) fail(q, `${marks} corner marks on ${f.corners} square corners`)
      if (sh.sides) {
        const L = sh.sides.map((s: string) => nums(s)[0])
        const P = [0, 1, 2, 3].map(i => len(sub(sh.pts[(i + 1) % 4], sh.pts[i])))
        if (L.some((x: number, i: number) => Math.abs(x - P[i]) > 0.05)) fail(q, `side labels ${sh.sides} do not match the drawing`)
      }
      if (sh.ticks && sh.ticks.length === 4 && !f.equal) fail(q, 'all sides ticked equal but drawn unequal')
      return f
    }
    if (/^How many pairs of parallel sides does this shape have\?/.test(t)) return String(drawn().pairs)
    if (/^(Count the pairs of parallel sides|The little squares show square corners)\..* Which name fits this shape( best)?\?$/.test(t)) {
      const f = drawn()
      const best = bestQuad(q, f.pairs, f.corners, f.equal)
      return pick(q, c => c === best)
    }
    let m = t.match(/says this is an? (square|rectangle|rhombus|parallelogram|trapezoid), because/)
    if (m) {
      const f = drawn()
      return verdict(q, m[1], bestQuad(q, f.pairs, f.corners, f.equal))
    }
    m = t.match(/ has (only 1 pair|\d+ pairs) of parallel sides, (no|\d+) square corners, and (?:sides of (\d+) ft, (\d+) ft, (\d+) ft and (\d+) ft|all 4 sides (\d+) ft long)\. Which name fits it best\?/)
    if (m) {
      const pairs = m[1].startsWith('only') ? 1 : Number(m[1].split(' ')[0])
      const corners = m[2] === 'no' ? 0 : Number(m[2])
      const L = m[7] ? [1, 1, 1, 1].map(() => Number(m![7])) : m.slice(3, 7).map(Number)
      const equal = L.every(x => x === L[0])
      if (pairs === 2 && (L[0] !== L[2] || L[1] !== L[3])) fail(q, 'two parallel pairs with unequal opposite sides')
      if (pic?.lines && pic.lines.some((l: string) => !t.includes(l))) fail(q, 'card lines differ from the text')
      return pick(q, c => c === bestQuad(q, pairs, corners, equal))
    }
    return fail(q)
  },

  'g4m5-t8': q => {
    const t = q.text, pic = q.picture
    if (/Fold along (the dashed line|it)\. Do the two halves match exactly\?/.test(t)) {
      const folds = (pic.segs as Seg[]).filter((s: any) => s.dashed)
      if (folds.length !== 1 || pic.shapes.length !== 1) fail(q, 'expected one shape and one fold')
      const pts = pic.shapes[0].pts as P[]
      if (/cuts this shape into two parts the same size/.test(t)) {
        const c: P = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
        const d = sub(folds[0].b, folds[0].a), e = sub(c, folds[0].a)
        if (Math.abs(d[0] * e[1] - d[1] * e[0]) / len(d) > 0.05) fail(q, 'fold does not pass through the middle, so the parts are not the same size')
      }
      return pick(q, c => c === (matches(pts, folds[0].a, folds[0].b) ? 'yes' : 'no'))
    }
    if (/^How many matching fold lines does this shape have\?/.test(t)) {
      if (pic.shapes.length !== 1) fail(q, 'expected one shape')
      return String(foldLines(pic.shapes[0].pts))
    }
    let m = t.match(/says this (kite|square|house|rectangle) has (\d+) matching fold lines?\. Which is true\?/)
    if (m) {
      const pts = pic.shapes[0].pts as P[]
      if (shapeName(pts) !== m[1]) fail(q, `text says ${m[1]}, drawing is a ${shapeName(pts)}`)
      const n = foldLines(pts)
      if (Number(m[2]) === n) return pick(q, c => / is right$/.test(c))
      return pick(q, c => c === `No, it has ${n}`)
    }
    m = t.match(/cuts out an? (\w+) and an? (\w+)\. How many (more matching fold lines does the (\w+) have than the (\w+)|matching fold lines do they have altogether)\?/)
    if (m) {
      const got = new Map<string, number>()
      for (const sh of pic.shapes) got.set(shapeName(sh.pts), foldLines(sh.pts))
      for (const n of [m[1], m[2]]) if (!got.has(n)) fail(q, `no ${n} in the picture`)
      if (got.size !== 2 || pic.shapes.length !== 2) fail(q, 'expected two different shapes')
      return String(m[4] ? got.get(m[4])! - got.get(m[5])! : got.get(m[1])! + got.get(m[2])!)
    }
    return fail(q)
  },
}
