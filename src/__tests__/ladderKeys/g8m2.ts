// Blind answer key for g8m2's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g8m2 N`), never from the generator.
// Exact rationals (small numbers, so plain integers are safe). Every choice is evaluated and
// exactly one must fit; a picture that disagrees with its text throws.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule'): never => { throw new Error(`g8m2 key: ${why} for "${q.text}"`) }

// ---------- rationals ----------
type F = { n: number; d: number }
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t } return a }
function fr(n: number, d = 1): F {
  if (d === 0) throw new Error('g8m2 key: divide by zero')
  if (d < 0) { n = -n; d = -d }
  const g = gcd(n, d) || 1
  return { n: n / g, d: d / g }
}
const add = (a: F, b: F) => fr(a.n * b.d + b.n * a.d, a.d * b.d)
const sub = (a: F, b: F) => fr(a.n * b.d - b.n * a.d, a.d * b.d)
const mul = (a: F, b: F) => fr(a.n * b.n, a.d * b.d)
const dv = (a: F, b: F) => fr(a.n * b.d, a.d * b.n)
const same = (a: F, b: F) => a.n === b.n && a.d === b.d
const isZ = (a: F) => a.n === 0
const fmt = (a: F) => (a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`)
function num(s: string): F {
  const m = s.replace(/−/g, '-').replace(/[$,\s+]/g, '').match(/^(-?\d+)(?:\/(\d+))?$/)
  if (!m) throw new Error(`g8m2 key: not a number "${s}"`)
  return fr(Number(m[1]), m[2] ? Number(m[2]) : 1)
}

// ---------- linear expressions / equations ----------
type Lin = { c: Record<string, F>; k: F }
const coef = (l: Lin, v: string) => l.c[v] ?? fr(0)
function lin(src: string): Lin {
  const s = src.replace(/−/g, '-').replace(/\s+/g, '')
  const terms: string[] = []
  let depth = 0, cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if ((ch === '+' || ch === '-') && depth === 0 && cur !== '' && !/[+-]$/.test(cur)) { terms.push(cur); cur = ch } else cur += ch
  }
  if (cur) terms.push(cur)
  const out: Lin = { c: {}, k: fr(0) }
  for (const t of terms) {
    const m = t.match(/^([+-]*)(\d+(?:\/\d+)?|\(\d+(?:\/\d+)?\))?(?:\((.+)\)|([a-z]))?$/)
    if (!m || (!m[2] && m[3] === undefined && !m[4])) throw new Error(`g8m2 key: cannot read "${src}"`)
    const sign = (m[1].match(/-/g) ?? []).length % 2 ? -1 : 1
    const k = mul(m[2] ? num(m[2].replace(/[()]/g, '')) : fr(1), fr(sign))
    if (m[3] !== undefined) {
      const inner = lin(m[3])
      for (const v of Object.keys(inner.c)) out.c[v] = add(coef(out, v), mul(k, inner.c[v]))
      out.k = add(out.k, mul(k, inner.k))
    } else if (m[4]) out.c[m[4]] = add(coef(out, m[4]), k)
    else out.k = add(out.k, k)
  }
  return out
}
/** "L = R" as L − R. */
function eqn(src: string): Lin {
  const parts = src.split('=')
  if (parts.length !== 2) throw new Error(`g8m2 key: not an equation "${src}"`)
  const l = lin(parts[0]), r = lin(parts[1])
  const out: Lin = { c: {}, k: sub(l.k, r.k) }
  for (const v of new Set([...Object.keys(l.c), ...Object.keys(r.c)])) out.c[v] = sub(coef(l, v), coef(r, v))
  return out
}
const onlyVars = (e: Lin, vars: string[]) => Object.keys(e.c).every(v => vars.includes(v) || isZ(e.c[v]))
type Sol = { kind: 'one'; x: F } | { kind: 'none' } | { kind: 'all' }
function solveX(src: string): Sol {
  const e = eqn(src)
  if (!onlyVars(e, ['x'])) throw new Error(`g8m2 key: not an x equation "${src}"`)
  const a = coef(e, 'x')
  if (!isZ(a)) return { kind: 'one', x: dv(fr(-e.k.n, e.k.d), a) }
  return isZ(e.k) ? { kind: 'all' } : { kind: 'none' }
}
const sameSol = (p: Sol, q: Sol) => p.kind === q.kind && (p.kind !== 'one' || (q.kind === 'one' && same(p.x, q.x)))
/** y = mx + b, as {m, b}. */
function line(src: string): { m: F; b: F } {
  const e = eqn(src)
  const cy = coef(e, 'y')
  if (isZ(cy) || !onlyVars(e, ['x', 'y'])) throw new Error(`g8m2 key: not a y-line "${src}"`)
  return { m: dv(fr(-coef(e, 'x').n, coef(e, 'x').d), cy), b: dv(fr(-e.k.n, e.k.d), cy) }
}
const onLine = (l: { m: F; b: F }, x: F, y: F) => same(y, add(mul(l.m, x), l.b))
function solve2(e1: Lin, e2: Lin, u: string, v: string): { u: F; v: F } {
  const a = coef(e1, u), b = coef(e1, v), c = coef(e2, u), d = coef(e2, v)
  const det = sub(mul(a, d), mul(b, c))
  if (isZ(det)) throw new Error('g8m2 key: system has no single solution')
  const r1 = fr(-e1.k.n, e1.k.d), r2 = fr(-e2.k.n, e2.k.d)
  return { u: dv(sub(mul(r1, d), mul(b, r2)), det), v: dv(sub(mul(a, r2), mul(r1, c)), det) }
}
/** The value of ? when f(?) must be 0 and f is linear in ?. */
function solveQ(q: Q, f: (s: string) => F): F {
  const f0 = f('0'), f1 = f('1')
  const slope = sub(f1, f0)
  if (isZ(slope)) fail(q, 'the ? does not change anything')
  const ans = dv(fr(-f0.n, f0.d), slope)
  if (!isZ(f(fmt(ans)))) fail(q, 'the ? is not linear')
  return ans
}
const put = (s: string, v: string) => s.replace(/\?/g, v)
function pts(s: string): [F, F][] {
  return [...s.matchAll(/\(([−-]?\d+), ([−-]?\d+)\)/g)].map(m => [num(m[1]), num(m[2])])
}
const slopeOf = (p: [F, F], r: [F, F]) => dv(sub(r[1], p[1]), sub(r[0], p[0]))

function pickOne(q: Q, fits: (c: string) => boolean): string {
  const cs = q.choices ?? fail(q, 'no choices')
  const ok = cs.filter(fits)
  if (ok.length !== 1) fail(q, `${ok.length} choices fit ${JSON.stringify(cs)}`)
  return ok[0]
}
const tableCell = (q: Q, r: number, c: number): string => {
  const v = q.picture?.rows?.[r]?.[c]
  return typeof v === 'string' ? v : fail(q, `no table cell ${r},${c}`)
}
const picPts = (q: Q): [F, F][] => (q.picture?.points ?? []).map((p: { x: number; y: number }) => [fr(p.x), fr(p.y)] as [F, F])
const picLine = (q: Q, i: number): { m: F; b: F } => {
  const l = q.picture?.lines?.[i] ?? fail(q, `no picture line ${i}`)
  const m = slopeOf([fr(l.a[0]), fr(l.a[1])], [fr(l.b[0]), fr(l.b[1])])
  return { m, b: sub(fr(l.a[1]), mul(m, fr(l.a[0]))) }
}
const sameLine = (p: { m: F; b: F }, r: { m: F; b: F }) => same(p.m, r.m) && same(p.b, r.b)
/** The picture's two lines must be exactly the two equations named in the text (either order). */
function checkPicLines(q: Q, l1: { m: F; b: F }, l2: { m: F; b: F }) {
  const a = picLine(q, 0), b = picLine(q, 1)
  if (!((sameLine(a, l1) && sameLine(b, l2)) || (sameLine(a, l2) && sameLine(b, l1)))) fail(q, 'picture lines disagree with the equations')
}
const nums = (s: string) => [...s.matchAll(/\d+/g)].map(m => Number(m[0]))

// ---------- stories ----------
type Pair = { names: [string, string]; per: [number, number]; count: number; total: number }
function story(q: Q): Pair {
  const t = q.text
  let m = t.match(/has (\w+) and (\w+): (\d+) \w+ and (\d+) \w+\. An? \w+ has (\d+) \w+ and an? \w+ has (\d+)\./)
  if (m) return { names: [m[1], m[2]], per: [+m[5], +m[6]], count: +m[3], total: +m[4] }
  m = t.match(/buys (\d+) tickets\. (\w+) tickets cost \$(\d+) and (\w+) tickets cost \$(\d+)\. They pay \$(\d+)\./)
  if (m) return { names: [m[2], m[4]], per: [+m[3], +m[5]], count: +m[1], total: +m[6] }
  m = t.match(/(\w+) cost \$(\d+) and (\w+) cost \$(\d+)\. \w+ buys (\d+) items and pays \$(\d+)\./)
  if (m) return { names: [m[1], m[3]], per: [+m[2], +m[4]], count: +m[5], total: +m[6] }
  return fail(q, 'unknown story')
}
const stem = (w: string) => w.toLowerCase().replace(/s$/, '')
function which(q: Q, p: Pair, word: string): 0 | 1 {
  const hits = ([0, 1] as const).filter(i => stem(p.names[i]) === stem(word))
  return hits.length === 1 ? hits[0] : fail(q, `cannot tell which item "${word}" is`)
}
function counts(q: Q, p: Pair): [number, number] {
  const first = (p.total - p.per[1] * p.count) / (p.per[0] - p.per[1])
  const second = p.count - first
  if (!Number.isInteger(first) || first < 0 || second < 0) fail(q, `story has no whole-number answer (${first}, ${second})`)
  return [first, second]
}
function positiveWhole(q: Q, x: F): F {
  if (x.d !== 1 || x.n < 0) fail(q, `story answer ${fmt(x)} is not a whole count`)
  return x
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g8m2-t1': q => {
    const t = q.text
    if (/dashed lines show the run and the rise/.test(t) || /How steep is it\?/.test(t)) {
      const [p, r] = picPts(q)
      if (!p || !r) return fail(q, 'need two points')
      const s = slopeOf(p, r)
      for (const l of q.picture.lines ?? []) {
        const lm = typeof l.label === 'string' ? l.label.match(/^(run|rise) (\S+)$/) : null
        if (!lm) continue
        const want = lm[1] === 'run' ? sub(r[0], p[0]) : sub(r[1], p[1])
        if (!same(num(lm[2]), want)) fail(q, `picture label "${l.label}" disagrees with the points`)
      }
      return fmt(s)
    }
    let m = t.match(/says this line is (\S+) steep\. Is \w+ right\?/)
    if (m) {
      const [p, r] = picPts(q)
      if (!p || !r) return fail(q, 'need two points')
      const s = slopeOf(p, r), right = same(num(m[1]), s)
      return pickOne(q, c => {
        const cm = c.match(/^(Yes|No), it is (\S+)$/) ?? fail(q, `odd choice "${c}"`)
        return (cm[1] === 'Yes') === right && same(num(cm[2]), s)
      })
    }
    m = t.match(/has a slope of (\S+)\. It goes through \(([−-]?\d+), ([−-]?\d+)\) and \(([−-]?\d+), \?\)\. What is the missing y\?/)
    if (m) {
      const run = sub(num(m[4]), num(m[2]))
      const lab = (q.picture?.lines ?? []).map((l: { label?: string }) => l.label).find((s: unknown) => typeof s === 'string' && /^run /.test(s))
      if (lab && !same(num(lab.slice(4)), run)) fail(q, 'picture run disagrees with text')
      return fmt(add(num(m[3]), mul(num(m[1]), run)))
    }
    if (/skate ramps/.test(t)) {
      if (!/Rise/.test(q.picture.head[1]) || !/Run/.test(q.picture.head[2])) fail(q, 'unexpected table columns')
      const sA = dv(num(tableCell(q, 0, 1)), num(tableCell(q, 0, 2)))
      const sB = dv(num(tableCell(q, 1, 1)), num(tableCell(q, 1, 2)))
      if (tableCell(q, 0, 0) !== 'Ramp A' || tableCell(q, 1, 0) !== 'Ramp B') fail(q, 'unexpected rows')
      const d = sub(sA, sB)
      const want = isZ(d) ? 'They are just as steep' : d.n > 0 ? 'Ramp A is steeper' : 'Ramp B is steeper'
      return pickOne(q, c => c === want)
    }
    return fail(q)
  },

  'g8m2-t2': q => {
    const t = q.text
    const tablePts = (): [F, F][] => [[num(tableCell(q, 0, 1)), num(tableCell(q, 1, 1))], [num(tableCell(q, 0, 2)), num(tableCell(q, 1, 2))]]
    if (/A line goes through these two points\. What is its slope\?/.test(t) || /steady rate/.test(t)) {
      const [p, r] = tablePts()
      return fmt(slopeOf(p, r))
    }
    let m = t.match(/^A line goes through (\(.+?\)) and (\(.+?\))\. What is its slope\? Type it as a fraction\.$/)
    if (m) {
      const [p, r] = pts(t)
      return fmt(slopeOf(p, r))
    }
    m = t.match(/finds the slope of the line through \(.+?\) and \(.+?\) like this, and gets (\S+)\. Is \w+ right\?/)
    if (m) {
      const [p, r] = pts(t)
      const s = slopeOf(p, r), right = same(num(m[1]), s)
      return pickOne(q, c => {
        const cm = c.match(/^(Yes|No), the slope is (\S+)$/) ?? fail(q, `odd choice "${c}"`)
        return (cm[1] === 'Yes') === right && same(num(cm[2]), s)
      })
    }
    m = t.match(/^This line has a slope of (\S+)\. What number goes where the \? is\?$/)
    if (m) {
      const slope = num(m[1])
      const cells = [tableCell(q, 0, 1), tableCell(q, 1, 1), tableCell(q, 0, 2), tableCell(q, 1, 2)]
      if (cells.filter(c => c === '?').length !== 1) fail(q, 'need exactly one ?')
      return fmt(solveQ(q, v => {
        const [x1, y1, x2, y2] = cells.map(c => num(c === '?' ? v : c))
        return sub(sub(y2, y1), mul(slope, sub(x2, x1)))
      }))
    }
    return fail(q)
  },

  'g8m2-t3': q => {
    const t = q.text
    let m = t.match(/^A line has the equation (y = .+?)\. (Where does it cross the y-axis\? Give the y-value\.|What is its slope\?)$/)
    if (m) {
      const l = line(m[1])
      return fmt(/slope/.test(m[2]) ? l.m : l.b)
    }
    m = t.match(/^This line crosses the y-axis at \(0, ([−-]?\d+)\)\. Its equation is y = mx [+−] (\d+)\. What is m\?$/)
    if (m) {
      const [p, r] = picPts(q)
      if (!p || !r) return fail(q, 'need two points')
      const l = picLine(q, 0)
      if (!same(l.b, num(m[1]))) fail(q, 'picture intercept disagrees with text')
      if (!same(slopeOf(p, r), l.m)) fail(q, 'points are not on the line')
      return fmt(l.m)
    }
    if (/^Which equation matches this line\?$/.test(t)) {
      const [p, r] = picPts(q)
      const s = slopeOf(p, r), b = sub(p[1], mul(s, p[0]))
      return pickOne(q, c => sameLine(line(c), { m: s, b }))
    }
    m = t.match(/says the line (y = .+?) has a slope of (\S+) and crosses the y-axis at (\S+)\. Is \w+ right\?/)
    if (m) {
      const l = line(m[1]), right = same(num(m[2]), l.m) && same(num(m[3]), l.b)
      return pickOne(q, c => {
        const cm = c.match(/^(Yes|No): the slope is (\S+) and it crosses at (\S+)$/) ?? fail(q, `odd choice "${c}"`)
        return (cm[1] === 'Yes') === right && same(num(cm[2]), l.m) && same(num(cm[3]), l.b)
      })
    }
    if (/Which equation gives the cost\?/.test(t)) {
      m = t.match(/\$(\d+)[^$]* plus \$(\d+) (?:for )?each \w+\. Let x be the number of (\w+)/)
      if (!m) return fail(q, 'cannot read the story')
      const want = { m: fr(+m[2]), b: fr(+m[1]) }
      return pickOne(q, c => sameLine(line(c), want))
    }
    return fail(q)
  },

  'g8m2-t4': q => {
    const t = q.text
    let m = t.match(/^You graph (y = .+?)\. You start at \(([−-]?\d+), ([−-]?\d+)\) and step (\d+) across and (\d+) (up|down), (\d+) times?\. What is the y of the dot you land on\?$/)
    if (m) {
      const l = line(m[1]), x0 = num(m[2]), y0 = num(m[3])
      if (!onLine(l, x0, y0)) fail(q, 'start point is not on the line')
      const n = +m[7], x = add(x0, fr(n * +m[4]))
      const y = add(mul(l.m, x), l.b)
      const walked = add(y0, fr(n * +m[5] * (m[6] === 'up' ? 1 : -1)))
      if (!same(y, walked)) fail(q, 'the steps do not follow the slope')
      return fmt(y)
    }
    m = t.match(/^What is y on the line (y = .+?) when x = (\S+)\?$/)
    if (m) {
      const l = line(m[1])
      return fmt(add(mul(l.m, num(m[2])), l.b))
    }
    m = t.match(/^Which point is on the line (y = .+)\?$/)
    if (m) {
      const l = line(m[1])
      return pickOne(q, c => { const [p] = pts(c); return !!p && onLine(l, p[0], p[1]) })
    }
    m = t.match(/starts to graph (y = .+?)\. \w+'s first dot is at \(([−-]?\d+), ([−-]?\d+)\)\. Is that right\?/)
    if (m) {
      const l = line(m[1])
      const right = same(num(m[2]), fr(0)) && same(num(m[3]), l.b)
      const pp = picPts(q)[0]
      if (!pp || !same(pp[0], num(m[2])) || !same(pp[1], num(m[3]))) fail(q, 'picture dot disagrees with the claimed dot')
      return pickOne(q, c => {
        const cm = c.match(/^(Yes, the first dot goes|No, it goes) at \(.+\)$/) ?? fail(q, `odd choice "${c}"`)
        const [p] = pts(c)
        return cm[1].startsWith('Yes') === right && same(p[0], fr(0)) && same(p[1], l.b)
      })
    }
    if (/each (hour|week|minute)/.test(t) && /after (\d+) \w+\?$/.test(t)) {
      const [start, rate, time] = nums(t)
      const sign = /burns down|drops/.test(t) ? -1 : /grows|adds/.test(t) ? 1 : fail(q, 'cannot tell up or down')
      const pic0 = nums(tableCell(q, 0, 1))[0], pic1 = tableCell(q, 1, 1)
      if (pic0 !== start || !same(num(pic1.split(' ')[0]), fr(sign * rate))) fail(q, 'table disagrees with story')
      return `${start + sign * rate * time}`
    }
    return fail(q)
  },

  'g8m2-t5': q => {
    const t = q.text
    let m = t.match(/^Solve (.+)\. What is x\?$/)
    if (m) {
      const s = solveX(m[1])
      return s.kind === 'one' ? fmt(s.x) : fail(q, `equation has ${s.kind} solutions`)
    }
    if (/^Which value of x makes both sides equal\?/.test(t)) {
      const e = `${tableCell(q, 0, 0)} = ${tableCell(q, 0, 2)}`
      return pickOne(q, c => {
        const cm = c.match(/^x = (\S+)$/) ?? fail(q, `odd choice "${c}"`)
        const d = eqn(e)
        return isZ(add(mul(coef(d, 'x'), num(cm[1])), d.k))
      })
    }
    m = t.match(/^\w+ solves (.+?)\. \w+'s first step is (.+?)\. Is that right\?$/)
    if (m) {
      const orig = solveX(m[1])
      const good = (s: string) => {
        const [l, r] = s.split('=').map(lin)
        const oneSided = isZ(coef(l, 'x')) || isZ(coef(r, 'x'))
        return oneSided && sameSol(solveX(s), orig)
      }
      const right = good(m[2])
      return pickOne(q, c => {
        if (c === 'Yes, that is the right first step') return right
        const cm = c.match(/^No, it should be (.+)$/) ?? fail(q, `odd choice "${c}"`)
        return !right && good(cm[1])
      })
    }
    m = t.match(/^In (.+), the answer is x = (\S+)\. What number goes where the \? is\?$/)
    if (m) {
      const eq = m[1], x = num(m[2])
      return fmt(solveQ(q, v => { const d = eqn(put(eq, v)); return add(mul(coef(d, 'x'), x), d.k) }))
    }
    if (/^.+ After how many \w+ do they (?:cost|have|hold) the same/.test(t)) {
      const sents = t.split(/(?<=\.) /)
      const [a0, a1] = nums(sents[0]), [b0, b1] = nums(sents[1])
      const l = lin(q.picture.left), r = lin(q.picture.right)
      if (!same(l.k, fr(a0)) || !same(coef(l, 'x'), fr(a1)) || !same(r.k, fr(b0)) || !same(coef(r, 'x'), fr(b1))) fail(q, 'balance disagrees with story')
      const s = solveX(`${a1}x + ${a0} = ${b1}x + ${b0}`)
      return s.kind === 'one' ? fmt(positiveWhole(q, s.x)) : fail(q, `story has ${s.kind} solutions`)
    }
    return fail(q)
  },

  'g8m2-t6': q => {
    const t = q.text
    const say = (s: Sol) => (s.kind === 'one' ? 'one solution' : s.kind === 'none' ? 'no solution' : 'infinitely many solutions')
    let m = t.match(/How many solutions does (.+) have\?$/)
    if (m) { const want = say(solveX(m[1])); return pickOne(q, c => c === want) }
    m = t.match(/takes the x parts off both sides of (.+?) and gets (.+?)\. \w+ says (every number works|there is no solution|x = [−-]?\d+|the only answer is x = [−-]?\d+)\. Is \w+ right\?$/)
    if (m) {
      const truth = solveX(m[1]), e = eqn(m[1])
      if (isZ(coef(e, 'x'))) {
        const [l, r] = m[1].split('=').map(lin), [gl, gr] = m[2].split('=').map(lin)
        if (!same(l.k, gl.k) || !same(r.k, gr.k) || Object.keys(gl.c).length + Object.keys(gr.c).length) fail(q, `"gets ${m[2]}" is not what is left`)
      }
      const claim: Sol = m[3] === 'every number works' ? { kind: 'all' } : m[3] === 'there is no solution' ? { kind: 'none' } : { kind: 'one', x: num(m[3].replace(/^.*x = /, '')) }
      const right = sameSol(claim, truth)
      return pickOne(q, c => {
        if (/^Yes, \w+ is right$/.test(c)) return right
        if (c === 'No: every number works') return !right && truth.kind === 'all'
        if (c === 'No: there is no solution') return !right && truth.kind === 'none'
        return fail(q, `odd choice "${c}"`)
      })
    }
    m = t.match(/so that (.+) has (INFINITELY MANY solutions|NO solution|ONE solution)\?$/)
    if (m) {
      const kind = m[2].startsWith('INF') ? 'all' : m[2].startsWith('NO') ? 'none' : 'one'
      const hits: number[] = []
      for (let v = -200; v <= 200; v++) if (solveX(put(m[1], `${v}`)).kind === kind) hits.push(v)
      return hits.length === 1 ? `${hits[0]}` : fail(q, `${hits.length} values of ? work`)
    }
    if (/Is there a number of hours when the two cost the same\?$/.test(t)) {
      const sents = t.split(/(?<=\.) /)
      const cost = (s: string): string => {
        let cm = s.match(/charges \$(\d+) plus \$(\d+) an hour\.$/)
        if (cm) return `${cm[2]}x + ${cm[1]}`
        cm = s.match(/charges \$(\d+) an hour(?:, but always adds (\d+) extra hours?| for the hours you rent plus (\d+) more hours?)\.$/)
        if (cm) return `${cm[1]}(x + ${cm[2] ?? cm[3]})`
        return fail(q, `cannot read "${s}"`)
      }
      const a = cost(sents[1]), b = cost(sents[2])
      const pa = String(q.picture.text).split(': ')[1], pb = String(q.picture.lines?.[0]).split(': ')[1]
      if (!pa || !pb || !sameSol(solveX(`${pa} = ${a}`), { kind: 'all' }) || !sameSol(solveX(`${pb} = ${b}`), { kind: 'all' })) fail(q, 'picture disagrees with story')
      const s = solveX(`${a} = ${b}`)
      if (s.kind === 'one' && s.x.n < 0) fail(q, `they only match at ${fmt(s.x)} hours`)
      const want = s.kind === 'one' ? 'For exactly one number of hours' : s.kind === 'all' ? 'For every number of hours' : 'Never'
      return pickOne(q, c => c === want)
    }
    return fail(q)
  },

  'g8m2-t7': q => {
    const t = q.text
    const cross = (a: { m: F; b: F }, b: { m: F; b: F }) => {
      if (same(a.m, b.m)) fail(q, 'lines do not cross once')
      const x = dv(sub(b.b, a.b), sub(a.m, b.m))
      return { x, y: add(mul(a.m, x), a.b) }
    }
    let m = t.match(/^The two lines cross at one point\. What is its (x|y)-value\?$/)
    if (m) {
      const p = cross(picLine(q, 0), picLine(q, 1))
      return fmt(m[1] === 'x' ? p.x : p.y)
    }
    m = t.match(/^Which point is on both (y = .+?) and (y = .+)\?$/)
    if (m) {
      const a = line(m[1]), b = line(m[2])
      return pickOne(q, c => { const [p] = pts(c); return onLine(a, p[0], p[1]) && onLine(b, p[0], p[1]) })
    }
    m = t.match(/says the lines (y = .+?) and (y = .+?) cross at \(([−-]?\d+), ([−-]?\d+)\)\. Is \w+ right\?$/)
    if (m) {
      const eqs = [m[1], m[2]], ls = eqs.map(line), x = num(m[3]), y = num(m[4])
      checkPicLines(q, ls[0], ls[1])
      const on = ls.map(l => onLine(l, x, y))
      return pickOne(q, c => {
        if (c === 'Yes, it is on both lines') return on[0] && on[1]
        const cm = c.match(/^No, it is only on (y = .+)$/) ?? fail(q, `odd choice "${c}"`)
        const i = eqs.indexOf(cm[1])
        if (i < 0) fail(q, `choice names a line not in the question "${c}"`)
        return on[i] && !on[1 - i]
      })
    }
    m = t.match(/^The lines (y = .+?) and (y = .+?) cross at x = (\S+)\. What number goes where the \? is\?$/)
    if (m) {
      const e1 = m[1], e2 = line(m[2]), x = num(m[3])
      const y = add(mul(e2.m, x), e2.b)
      return fmt(solveQ(q, v => { const l = line(put(e1, v)); return sub(add(mul(l.m, x), l.b), y) }))
    }
    if (/How many dollars do they cost when they cost the same\?$/.test(t)) {
      const plans = [...t.matchAll(/Plan [AB] costs \$(\d+)(?: plus \$(\d+))? for each [\w ]+?: (y = [^.]+)\./g)]
      if (plans.length !== 2) return fail(q, 'cannot read both plans')
      const ls = plans.map(p => {
        const l = line(p[3])
        const want = p[2] ? { m: fr(+p[2]), b: fr(+p[1]) } : { m: fr(+p[1]), b: fr(0) }
        if (!sameLine(l, want)) fail(q, `plan words disagree with "${p[3]}"`)
        return l
      })
      checkPicLines(q, ls[0], ls[1])
      return fmt(cross(ls[0], ls[1]).y)
    }
    return fail(q)
  },

  'g8m2-t8': q => {
    const t = q.text
    let m = t.match(/^(.+?) and (.+?)\. What is (x|y)\?$/)
    if (m) {
      const s = solve2(eqn(m[1]), eqn(m[2]), 'x', 'y')
      return fmt(m[3] === 'x' ? s.u : s.v)
    }
    m = t.match(/^To solve (.+?) and (.+?), \w+'s first step is (.+?)\. Is that right\?$/)
    if (m) {
      const x = solve2(eqn(m[1]), eqn(m[2]), 'x', 'y').u
      const good = (s: string) => { const e = eqn(s); if (!onlyVars(e, ['x'])) return false; const r = solveX(s); return r.kind === 'one' && same(r.x, x) }
      const right = good(m[3])
      return pickOne(q, c => {
        if (c === 'Yes, that is the right first step') return right
        const cm = c.match(/^No, it should be (.+)$/) ?? fail(q, `odd choice "${c}"`)
        return !right && good(cm[1])
      })
    }
    m = t.match(/^(.+?) and (.+?)\. The two equations are both true when x = (\S+)\. What number goes where the \? is\?$/)
    if (m) {
      const e1 = m[1], e2 = m[2], x = num(m[3])
      return fmt(solveQ(q, v => {
        const a = eqn(put(e1, v)), b = eqn(put(e2, v))
        const rest = add(mul(coef(a, 'x'), x), a.k)
        const ya = dv(fr(-rest.n, rest.d), coef(a, 'y'))
        return add(add(mul(coef(b, 'x'), x), mul(coef(b, 'y'), ya)), b.k)
      }))
    }
    m = t.match(/^(\w+) is (\d+) times as old as (?:her|his) (\w+)\. Their ages add up to (\d+)\. How old is (?:(\w+)|(?:her|his) (\w+))\?$/)
    if (m) {
      const k = +m[2], total = +m[4], small = fr(total, k + 1)
      const ask = m[5] ?? m[6]
      return fmt(positiveWhole(q, ask === m[1] ? mul(small, fr(k)) : ask === m[3] ? small : fail(q, 'who?')))
    }
    m = t.match(/^(\w+) has (\d+) more (\w+) than (\w+)\. Together they have (\d+) \w+\. How many \w+ does (\w+) have\?$/)
    if (m) {
      const d = +m[2], total = +m[5]
      const big = fr(total + d, 2)
      return fmt(positiveWhole(q, m[6] === m[1] ? big : m[6] === m[4] ? sub(big, fr(d)) : fail(q, 'who?')))
    }
    m = t.match(/^A (\d+)-foot rope is cut into a long piece and a short piece\. The long piece is (\d+) times as long as the short piece\. How many feet long is the (long|short) piece\?$/)
    if (m) {
      const short = fr(+m[1], +m[2] + 1)
      return fmt(positiveWhole(q, m[3] === 'short' ? short : mul(short, fr(+m[2]))))
    }
    return fail(q)
  },

  'g8m2-t9': q => {
    const t = q.text
    const checkTable = (p: Pair, c: [number, number]) => {
      const flat = JSON.stringify(q.picture?.rows ?? [])
      if (!flat.includes(`"${p.count}"`) || !flat.includes(`"${p.total}"`)) fail(q, `table totals disagree with story (${c})`)
    }
    let m = t.match(/How many (\w+)(?: tickets)? are there\?$/)
    if (m) {
      const p = story(q), c = counts(q, p)
      checkTable(p, c)
      return `${c[which(q, p, m[1])]}`
    }
    m = t.match(/How many \w+ do the (\w+) have in all\?$/) ?? t.match(/How many dollars did the (\w+) tickets cost in all\?$/) ?? t.match(/How many dollars did \w+ spend on (\w+)\?$/)
    if (m) {
      const p = story(q), c = counts(q, p), i = which(q, p, m[1])
      checkTable(p, c)
      return `${c[i] * p.per[i]}`
    }
    m = t.match(/costs \$(\d+) to (?:join|start) plus \$(\d+) a (\w+)\. \w+ \w+ costs \$(\d+) to (?:join|start) plus \$(\d+) a \w+\. After how many \w+ do they cost the same\?$/)
    if (m) {
      const s = solveX(`${m[1]} + ${m[2]}x = ${m[4]} + ${m[5]}x`)
      return s.kind === 'one' ? fmt(positiveWhole(q, s.x)) : fail(q, `story has ${s.kind} solutions`)
    }
    m = t.match(/Let (\w) be the (\w+)(?: tickets)? and (\w) the (\w+)(?: tickets)?\. Which pair of equations fits the story\?$/)
    if (m) {
      const p = story(q)
      const vars: [string, string] = which(q, p, m[2]) === 0 ? [m[1], m[3]] : [m[3], m[1]]
      if (which(q, p, m[4]) !== (vars[1] === m[3] ? 1 : 0)) fail(q, 'letters do not name both items')
      const key = (e: Lin) => `${fmt(coef(e, vars[0]))},${fmt(coef(e, vars[1]))},${fmt(e.k)}`
      const want = [key(eqn(`${vars[0]} + ${vars[1]} = ${p.count}`)), key(eqn(`${p.per[0]}${vars[0]} + ${p.per[1]}${vars[1]} = ${p.total}`))].sort().join('|')
      return pickOne(q, c => {
        const parts = c.split(' and ')
        if (parts.length !== 2) fail(q, `odd choice "${c}"`)
        const es = parts.map(eqn)
        if (!es.every(e => onlyVars(e, vars))) return false
        return es.map(key).sort().join('|') === want
      })
    }
    return fail(q)
  },
}
