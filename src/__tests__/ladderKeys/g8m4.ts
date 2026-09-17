// Independent answer key for the g8m4 practice ladders — written from the QUESTIONS only
// (scripts/ladder-questions.mts output), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }
type P = [number, number]

const fail = (q: Q, why: string): never => { throw new Error(`g8m4 key: ${why} — ${q.text}`) }
const num = (s: string) => Number(s.replace(/−/g, '-'))
const pt = (s: string): P => { const m = s.match(/\((−?\d+),\s*(−?\d+)\)/); if (!m) throw new Error(`no point in ${s}`); return [num(m[1]), num(m[2])] }
const sq = (q: Q, n: number): number => { const r = Math.round(Math.sqrt(n)); if (n < 0 || r * r !== n) fail(q, `√${n} is not whole`); return r }
const out = (n: number) => String(n)
const same = (a: P, b: P) => a[0] === b[0] && a[1] === b[1]
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Exactly one choice satisfying `fits`, or throw. */
function pick(q: Q, fits: (c: string) => boolean): string {
  const hits = (q.choices ?? fail(q, 'no choices')).filter(fits)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit`)
  return hits[0]
}

/** "X says it is <claim>. Which is true?" — choices "X is right" / "No, it is <v>". */
function judge<T>(q: Q, claim: T, correct: T, parse: (s: string) => T, eq: (a: T, b: T) => boolean): string {
  return pick(q, c => /is right$/.test(c) ? eq(claim, correct) : /^No, it is /.test(c) ? !eq(claim, correct) && eq(parse(c.slice(10)), correct) : fail(q, `odd choice ${c}`))
}
const judgePt = (q: Q, claim: P, correct: P) => judge(q, claim, correct, pt, same)
const judgeNum = (q: Q, claim: number, correct: number) => judge(q, claim, correct, s => num(s.match(/−?\d+/)![0]), (a, b) => a === b)

const coordOf = (q: Q): 0 | 1 => { const m = q.text.match(/What (?:is|was) (?:the|its) ([xy])-coordinate/); if (!m) return fail(q, 'which coordinate?'); return m[1] === 'x' ? 0 : 1 }

/** Named vertices from every poly shape on the grid. */
function vertices(q: Q): Record<string, P> {
  const v: Record<string, P> = {}
  for (const s of q.picture?.shapes ?? []) (s.names ?? []).forEach((n: string, i: number) => { v[n] = s.pts[i] })
  return v
}
/** The transform every named A→A′ pair agrees on. */
function moves(q: Q): (f: (p: P) => P) => boolean {
  const v = vertices(q)
  const pairs = Object.keys(v).filter(n => !n.includes('′') && v[n + '′'])
  if (pairs.length < 3) fail(q, 'image triangle not found')
  return f => pairs.every(n => same(f(v[n]), v[n + '′']))
}

// ---- leak checks: an unknown "?" must not be drawn at its answer's size ----
function sideLeak(q: Q, shape: any, idx: number, answer: number) {
  const n = shape.pts.length
  const len = (i: number) => dist(shape.pts[i], shape.pts[(i + 1) % n])
  const unit = len(idx) / answer
  shape.sides.forEach((s: string | null, i: number) => {
    const m = s?.match(/^(\d+)/)
    if (i !== idx && m && Math.abs(len(i) / num(m[1]) / unit - 1) < 0.02) fail(q, `"?" side drawn to scale with the ${s} side`)
  })
}
function interior(pts: number[][], i: number): number {
  const n = pts.length, a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n]
  const u = [a[0] - b[0], a[1] - b[1]], w = [c[0] - b[0], c[1] - b[1]]
  return Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]))) * 180 / Math.PI
}
const angleLeak = (q: Q, drawn: number, answer: number) => { if (Math.abs(drawn - answer) < 1.5) fail(q, `"?" angle drawn at ${answer}°`) }

// ---- similar triangles: sides listed in corresponding order ----
function similarMissing(q: Q, a: (number | null)[], b: (number | null)[]): number {
  let ratio: number | null = null
  a.forEach((x, i) => { const y = b[i]; if (x != null && y != null) { const r = y / x; if (ratio != null && Math.abs(r - ratio) > 1e-9) fail(q, 'sides not in one ratio'); ratio = r } })
  const r = ratio ?? fail(q, 'no ratio')
  const i = a.findIndex((x, k) => x == null || b[k] == null)
  const ans = a[i] == null ? b[i]! / r : a[i]! * r
  if (!Number.isInteger(ans)) fail(q, `missing side ${ans} not whole`)
  // an independent read: sorting both triangles must pair the same way
  const full = (t: (number | null)[]) => t.map(x => x ?? ans).sort((x, y) => x - y)
  const fa = full(a), fb = full(b)
  if (!fa.every((x, k) => Math.abs(fb[k] / x - r) < 1e-9)) fail(q, 'sorted sides do not correspond')
  return ans
}
const labelNums = (sides: (string | null)[]) => sides.map(s => (s == null || s.startsWith('?')) ? null : num(s.split(' ')[0]))

export const SOLVE: Record<string, (q: Q) => string> = {
  // translations
  'g8m4-t1': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const step = (h: string, hd: string, v: string, vd: string): P => [(hd === 'right' ? 1 : -1) * num(h), (vd === 'up' ? 1 : -1) * num(v)]
    if ((m = t.match(/^Point A is at (\(.+?\))\. The triangle slides (\d+) (left|right) and (\d+) (up|down)\. What/))) {
      const a = pt(m[1]), d = step(m[2], m[3], m[4], m[5])
      if (!same(vertices(q).A, a)) fail(q, 'picture A disagrees')
      return out(a[coordOf(q)] + d[coordOf(q)])
    }
    if ((m = t.match(/^Point P is at (\(.+?\))\. The triangle slides (\d+) (left|right) and (\d+) (up|down)\. \w+ says P′ is at (\(.+?\))/))) {
      const p = pt(m[1]), d = step(m[2], m[3], m[4], m[5])
      return judgePt(q, pt(m[6]), [p[0] + d[0], p[1] + d[1]])
    }
    if (/Which rule describes the slide\?/.test(t)) {
      const fits = moves(q)
      const term = (s: string) => { const r = s.trim().match(/^[xy](?:\s*([+−])\s*(\d+))?$/); if (!r) return fail(q, `rule ${s}`); return r[1] ? (r[1] === '+' ? 1 : -1) * num(r[2]) : 0 }
      return pick(q, c => { const r = c.match(/→ \((.+), (.+)\)$/); if (!r) return fail(q, c); const dx = term(r[1]), dy = term(r[2]); return fits(p => [p[0] + dx, p[1] + dy]) })
    }
    if ((m = t.match(/A \((.+?)\) lands on A′ \((.+?)\)\. Point ([BC]) is at \((.+?)\)/))) {
      const a = pt(`(${m[1]})`), a2 = pt(`(${m[2]})`), p = pt(`(${m[4]})`), k = coordOf(q)
      if (!same(vertices(q)[m[3]], p)) fail(q, 'picture point disagrees')
      return out(p[k] + a2[k] - a[k])
    }
    if ((m = t.match(/is at (\(.+?\))\. It moves (\d+) (left|right) and (\d+) (up|down), then (\d+) (left|right) and (\d+) (up|down), without turning/))) {
      const p = pt(m[1]), d1 = step(m[2], m[3], m[4], m[5]), d2 = step(m[6], m[7], m[8], m[9]), k = coordOf(q)
      return out(p[k] + d1[k] + d2[k])
    }
    return fail(q, 'unknown question')
  },

  // reflections
  'g8m4-t2': q => {
    const t = q.text
    const flip = (p: P, ax: string): P => ax === 'x' ? [p[0], -p[1]] : [-p[0], p[1]]
    let m: RegExpMatchArray | null
    if ((m = t.match(/^Point B is at (\(.+?\))\. The triangle flips over the ([xy])-axis, and then that new triangle flips over the ([xy])-axis\./))) {
      const b = pt(m[1]); if (!same(vertices(q).B, b)) fail(q, 'picture B disagrees')
      return out(flip(flip(b, m[2]), m[3])[coordOf(q)])
    }
    if ((m = t.match(/^Point A is at (\(.+?\))\. The triangle flips over the ([xy])-axis\. What/))) return out(flip(pt(m[1]), m[2])[coordOf(q)])
    if ((m = t.match(/^Point P is at (\(.+?\))\. The triangle flips over the ([xy])-axis\. Where is P′\?/))) { const c = flip(pt(m[1]), m[2]); return pick(q, s => same(pt(s), c)) }
    if ((m = t.match(/^Point P is at (\(.+?\))\. \w+ flips the triangle over the ([xy])-axis and says P′ is at (\(.+?\))/))) return judgePt(q, pt(m[3]), flip(pt(m[1]), m[2]))
    if (/What move was it\?/.test(t)) return whichMove(q)
    return fail(q, 'unknown question')
  },

  // rotations around (0, 0)
  'g8m4-t3': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/around \((?!0, 0\))/.test(t)) fail(q, 'centre is not the origin')
    const half = (p: P): P => [-p[0], -p[1]], ccw = (p: P): P => [-p[1], p[0]]
    if ((m = t.match(/^Point A is at (\(.+?\))\. The triangle makes a half turn around/))) return out(half(pt(m[1]))[coordOf(q)])
    if ((m = t.match(/^Point A is at (\(.+?\))\. The triangle turns a quarter turn counterclockwise around .* Where is A′\?/))) { const c = ccw(pt(m[1])); return pick(q, s => same(pt(s), c)) }
    if ((m = t.match(/^Point P is at (\(.+?\))\. \w+ turns the triangle a quarter turn counterclockwise around \(0, 0\) and says P′ is at (\(.+?\))/))) return judgePt(q, pt(m[2]), ccw(pt(m[1])))
    if ((m = t.match(/quarter turn counterclockwise around \(0, 0\)\. Corner A landed on A′ at (\(.+?\))/))) {
      const a2 = pt(m[1]); if (!same(vertices(q)['A′'], a2)) fail(q, 'picture A′ disagrees')
      const a: P = [a2[1], -a2[0]]
      if (!same(ccw(a), a2)) fail(q, 'inverse wrong')
      return out(a[coordOf(q)])
    }
    if (/What move was it\?/.test(t)) return whichMove(q)
    return fail(q, 'unknown question')
  },

  // dilations from (0, 0)
  'g8m4-t4': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/from \((?!0, 0\))/.test(t)) fail(q, 'centre is not the origin')
    const scale = (s: string) => { const f = s.split('/'); return f.length === 2 ? num(f[0]) / num(f[1]) : num(s) }
    const whole = (x: number) => Number.isInteger(x) ? x : fail(q, `non-whole coordinate ${x}`)
    if ((m = t.match(/^Point A is at (\(.+?\))\. The triangle is stretched from \(0, 0\) by a scale factor of ([\d/]+)\./))) {
      const a = pt(m[1]), k = scale(m[2]); return out(whole(a[coordOf(q)] * k))
    }
    if ((m = t.match(/^Corner B of a triangle is at (\(.+?\))\. The triangle shrinks from \(0, 0\) by a scale factor of ([\d/]+)\. Where is B′\?/))) {
      const b = pt(m[1]), k = scale(m[2]), c: P = [whole(b[0] * k), whole(b[1] * k)]
      if (!same(vertices(q).B, b)) fail(q, 'picture B disagrees')
      return pick(q, s => same(pt(s), c))
    }
    if ((m = t.match(/^Point A is at (\(.+?\))\. \w+ stretches the triangle from \(0, 0\) by a scale factor of ([\d/]+) and says A′ is at (\(.+?\))/))) {
      const a = pt(m[1]), k = scale(m[2]); return judgePt(q, pt(m[3]), [whole(a[0] * k), whole(a[1] * k)])
    }
    if (/^The dashed triangle is triangle ABC stretched from \(0, 0\)\. What is the scale factor\?/.test(t)) {
      const v = vertices(q), k = v['A′'][0] / v.A[0]
      if (!moves(q)(p => [p[0] * k, p[1] * k])) fail(q, 'not one scale factor')
      if (!Number.isInteger(k)) fail(q, `scale factor ${k} is not whole`)
      return out(k)
    }
    if ((m = t.match(/Corner A at (\(.+?\)) moves to (\(.+?\))\. Corner B is at (\(.+?\))/))) {
      const a = pt(m[1]), a2 = pt(m[2]), b = pt(m[3])
      const k = a2[0] !== 0 || a[0] !== 0 ? a2[0] / a[0] : a2[1] / a[1]
      if (a[0] * k !== a2[0] || a[1] * k !== a2[1]) fail(q, 'A′ is not a stretch of A')
      return out(whole(b[coordOf(q)] * k))
    }
    return fail(q, 'unknown question')
  },

  // similar triangles
  'g8m4-t5': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const list = (s: string) => s.split(/, | and /).map(x => x === '?' ? null : num(x))
    const shapes = q.picture?.shapes ?? []
    const checkPic = (tri: (number | null)[], shape: any) => {
      const lab = labelNums(shape.sides)
      if (lab.some((x, i) => x !== tri[i])) fail(q, 'picture labels disagree with text')
    }
    const leak = (ans: number) => shapes.forEach((s: any) => s.sides?.forEach((x: string | null, i: number) => { if (x?.startsWith('?')) sideLeak(q, s, i, ans) }))
    if ((m = t.match(/The small one has sides (.+?) (?:in|ft|cm|m)\. The big one has sides (.+?) (?:in|ft|cm|m)\./))) {
      const a = list(m[1]), b = list(m[2]); checkPic(a, shapes[0]); checkPic(b, shapes[1])
      const ans = similarMissing(q, a, b); leak(ans); return out(ans)
    }
    if ((m = t.match(/The big one has sides (.+?) (?:in|ft|cm|m)\. The small one has sides (.+?) (?:in|ft|cm|m)\./))) {
      const b = list(m[1]), a = list(m[2]); checkPic(a, shapes[0]); checkPic(b, shapes[1])
      const ans = similarMissing(q, a, b); leak(ans); return out(ans)
    }
    if ((m = t.match(/says the missing side is (\d+) (in|ft|cm|m)\. Which is true\?/))) {
      if (shapes.length !== 2) fail(q, 'need two triangles')
      const ans = similarMissing(q, labelNums(shapes[0].sides), labelNums(shapes[1].sides))
      leak(ans)
      return judgeNum(q, num(m[1]), ans)
    }
    if ((m = t.match(/^A triangle has sides of (.+?) (?:in|ft|cm|m)\. Which triangle has the same angles\?/))) {
      const base = list(m[1]).map(x => x!).sort((x, y) => x - y)
      return pick(q, c => { const s = list(c.replace(/ (in|ft|cm|m)$/, '')).map(x => x!).sort((x, y) => x - y); const r = s[0] / base[0]; return s.every((x, i) => Math.abs(x / base[i] - r) < 1e-9) })
    }
    if ((m = t.match(/^A [\w ]+? (\d+) ft tall casts a shadow (\d+) ft long\. At the same time, a [\w ]+? casts a shadow (\d+) ft long\./))) {
      const h = num(m[1]), s = num(m[2]), S = num(m[3]), ans = h * S / s
      if (!Number.isInteger(ans)) fail(q, `height ${ans} not whole`)
      const big = shapes[1]; if (big) { const i = big.sides.findIndex((x: string | null) => x?.startsWith('?')); if (i >= 0) sideLeak(q, big, i, ans) }
      return out(ans)
    }
    return fail(q, 'unknown question')
  },

  // triangle angles
  'g8m4-t6': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const shape = q.picture?.shapes?.[0]
    const deg = (s: string | null) => s == null || s === '?' ? null : num(s.replace('°', ''))
    if (/^What is the missing angle of this triangle/.test(t)) {
      const a = shape.angles.map(deg), i = a.indexOf(null)
      if (a.filter((x: number | null) => x == null).length !== 1) fail(q, 'need exactly one unknown')
      const ans = 180 - a.reduce((s: number, x: number | null) => s + (x ?? 0), 0)
      if (ans <= 0) fail(q, 'impossible triangle')
      angleLeak(q, interior(shape.pts, i), ans); return out(ans)
    }
    if ((m = t.match(/The two inside angles far from that corner are (\d+)° and (\d+)°\. What is the angle outside/))) {
      const ans = num(m[1]) + num(m[2])
      const i = shape.angles.findIndex((x: string | null) => x == null)
      const known = shape.angles.map(deg).filter((x: number | null) => x != null)
      if (known.length !== 2 || known[0] + known[1] !== ans) fail(q, 'picture angles disagree with text')
      angleLeak(q, 180 - interior(shape.pts, i), ans); return out(ans)
    }
    if ((m = t.match(/The angle at the (?:tip|top) is (\d+)°, and the (?:other two|two bottom) angles are the same size/))) {
      const ans = (180 - num(m[1])) / 2
      shape.angles.forEach((x: string | null, i: number) => { if (x === '?') angleLeak(q, interior(shape.pts, i), ans) })
      return out(ans)
    }
    if ((m = t.match(/^A triangle has angles of (\d+)° and (\d+)°\. \w+ says the third angle is (\d+)°/))) return judgeNum(q, num(m[3]), 180 - num(m[1]) - num(m[2]))
    if ((m = t.match(/^The angle outside the right corner of this triangle is (\d+)°\. The angle at the left corner is (\d+)°\. What is the angle at the top/))) {
      const ans = num(m[1]) - num(m[2])
      if (ans <= 0) fail(q, 'impossible')
      if (shape.angles[2] !== '?' || deg(shape.angles[0]) !== num(m[2])) fail(q, 'picture angles disagree with text')
      angleLeak(q, interior(shape.pts, 2), ans); return out(ans)
    }
    return fail(q, 'unknown question')
  },

  // Pythagorean theorem: the long side
  'g8m4-t7': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const leakHyp = (ans: number) => { const s = q.picture?.shapes?.[0]; const i = s?.sides?.findIndex((x: string | null) => x === '?'); if (s && i >= 0) sideLeak(q, s, i, ans) }
    if ((m = t.match(/The two small squares hold (\d+) and (\d+) little squares/))) return out(num(m[1]) + num(m[2]))
    if ((m = t.match(/^A right triangle has short sides of (\d+) \w+ and (\d+) \w+\. How long is the long side/))) { const c = sq(q, num(m[1]) ** 2 + num(m[2]) ** 2); leakHyp(c); return out(c) }
    if ((m = t.match(/^A right triangle has short sides of (\d+) \w+ and (\d+) \w+\. \w+ says the long side is (\d+) \w+/))) { const c = sq(q, num(m[1]) ** 2 + num(m[2]) ** 2); leakHyp(c); return judgeNum(q, num(m[3]), c) }
    if ((m = t.match(/(\d+) (?:m|in|blocks) (?:long|wide) and (\d+) (?:m|in|blocks) (?:wide|tall)\..*(?:corner to the opposite corner|opposite corner)/)) && !/shorter/.test(t)) return out(sq(q, num(m[1]) ** 2 + num(m[2]) ** 2))
    if ((m = t.match(/field (\d+) m long and (\d+) m wide, from one corner to the opposite corner\. How many meters shorter/))) { const a = num(m[1]), b = num(m[2]); return out(a + b - sq(q, a * a + b * b)) }
    return fail(q, 'unknown question')
  },

  // Pythagorean theorem: a missing leg
  'g8m4-t8': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const leakLeg = (ans: number) => { const s = q.picture?.shapes?.[0]; const i = s?.sides?.findIndex((x: string | null) => x?.startsWith('?')); if (s && i >= 0) sideLeak(q, s, i, ans) }
    if ((m = t.match(/The square on the long side holds (\d+) little squares, and the square on the left side holds (\d+)\. How many little squares does the bottom square hold/))) {
      const ans = num(m[1]) - num(m[2]); if (ans <= 0) fail(q, 'impossible'); return out(ans)
    }
    if ((m = t.match(/^A right triangle has a long side of (\d+) \w+ and a short side of (\d+) \w+\. How long is the other short side/))) { const b = sq(q, num(m[1]) ** 2 - num(m[2]) ** 2); leakLeg(b); return out(b) }
    if ((m = t.match(/^A right triangle has a hypotenuse of (\d+) \w+ and a leg of (\d+) \w+\. Which is the right way to start/))) {
      const c = num(m[1]), a = num(m[2])
      return pick(q, s => { const r = s.match(/^(\d+)² − (\d+)² = (\d+)$/); return !!r && num(r[1]) === c && num(r[2]) === a && num(r[3]) === c * c - a * a })
    }
    if ((m = t.match(/^A ramp is (\d+) ft long and rises (\d+) ft\. How far along the ground/)) || (m = t.match(/^A ladder (\d+) ft long leans against a wall\. Its foot is (\d+) ft from the wall\. How high/))) {
      const b = sq(q, num(m[1]) ** 2 - num(m[2]) ** 2); leakLeg(b); return out(b)
    }
    if ((m = t.match(/opposite corner that is (\d+) m long\. One side of the \w+ is (\d+) m\. How many meters of fence go all the way around/))) {
      const d = num(m[1]), a = num(m[2]), b = sq(q, d * d - a * a); leakLeg(b); return out(2 * (a + b))
    }
    return fail(q, 'unknown question')
  },

  // distance between points
  'g8m4-t9': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const pts: P[] = (q.picture?.points ?? []).map((p: any) => [p.x, p.y])
    const d = (a: P, b: P) => sq(q, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
    const hasPt = (p: P) => pts.some(x => same(x, p)) || fail(q, 'point not on the grid')
    if (/^The legs of a right triangle are drawn between these two points\. How far apart/.test(t)) {
      if (pts.length !== 2) fail(q, 'need two points')
      for (const l of q.picture.lines ?? []) if (l.label != null && num(l.label) !== Math.abs(l.a[0] - l.b[0]) + Math.abs(l.a[1] - l.b[1])) fail(q, 'leg label disagrees with the grid')
      return out(d(pts[0], pts[1]))
    }
    if ((m = t.match(/^How far apart are the points (\(.+?\)) and (\(.+?\))/))) { const a = pt(m[1]), b = pt(m[2]); hasPt(a); hasPt(b); return out(d(a, b)) }
    if ((m = t.match(/finds the distance between (\(.+?\)) and (\(.+?\)) and says it is (\d+) units/))) { const a = pt(m[1]), b = pt(m[2]); hasPt(a); hasPt(b); return judgeNum(q, num(m[3]), d(a, b)) }
    if ((m = t.match(/^Point A is at (\(.+?\))\. Point B is up and to the right of A, on the dashed line x = (−?\d+)\. A and B are (\d+) units apart\. What is the y-coordinate of B/))) {
      const a = pt(m[1]), x = num(m[2]), dist = num(m[3]); hasPt(a)
      if (x <= a[0]) fail(q, 'line is not to the right of A')
      return out(a[1] + sq(q, dist * dist - (x - a[0]) ** 2))
    }
    if ((m = t.match(/the \w+ is at (\(.+?\)) and the \w+ is at (\(.+?\))\. Each square is 1 block\. How many blocks shorter is the straight line than walking along the streets, across and then (up|down)/))) {
      const a = pt(m[1]), b = pt(m[2]); hasPt(a); hasPt(b)
      if ((b[1] > a[1]) !== (m[3] === 'up')) fail(q, `"then ${m[3]}" disagrees with the points`)
      return out(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) - d(a, b))
    }
    return fail(q, 'unknown question')
  },
}

/** "What move was it?" — test each named move against every vertex pair. */
function whichMove(q: Q): string {
  const fits = moves(q)
  const v = vertices(q), dx = v['A′'][0] - v.A[0], dy = v['A′'][1] - v.A[1]
  const moveOf = (c: string): ((p: P) => P) => {
    if (c === 'a slide') return p => (dx || dy) ? [p[0] + dx, p[1] + dy] : [NaN, NaN]
    if (c === 'a flip over the x-axis') return p => [p[0], -p[1]]
    if (c === 'a flip over the y-axis') return p => [-p[0], p[1]]
    if (c === 'a half turn') return p => [-p[0], -p[1]]
    if (c === 'a quarter turn counterclockwise') return p => [-p[1], p[0]]
    if (c === 'a quarter turn clockwise') return p => [p[1], -p[0]]
    return fail(q, `unknown move ${c}`)
  }
  return pick(q, c => fits(moveOf(c)))
}
