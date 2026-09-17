// Blind answer key for the g8m3 practice ladders — written from the generated QUESTIONS only.
type Q = { text: string; picture: any; choices?: string[] }

const num = (s: string): number => Number(s.replace(/−/g, '-').replace(/,/g, ''))
const fail = (q: Q, why = 'no solver matched'): never => { throw new Error(`${why}: ${q.text}`) }
const fmt = (n: number): string => {
  if (!Number.isFinite(n)) throw new Error(`not finite: ${n}`)
  return String(Math.round(n * 1e9) / 1e9)
}
const choices = (q: Q): string[] => q.choices ?? fail(q, 'no choices')
const one = (q: Q, ok: (c: string) => boolean): string => {
  const hits = choices(q).filter(ok)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit (${hits.join(' / ')})`)
  return hits[0]
}

// ---- table / graph helpers ----
type Pt = { x: number; y: number }
const tablePairs = (q: Q): Pt[] => {
  const p = q.picture
  if (p?.kind !== 'table') fail(q, 'expected a table')
  const xs: string[] = p.head.slice(1)
  const ys: string[] = p.rows[0].slice(1)
  return xs.map((x, i) => ({ x: num(x), y: num(ys[i]) }))
}
const sameRate = (pts: Pt[]): number | null => {
  const s = [...pts].sort((a, b) => a.x - b.x)
  const r = (s[1].y - s[0].y) / (s[1].x - s[0].x)
  for (let i = 1; i < s.length; i++) {
    const dx = s[i].x - s[i - 1].x
    if (Math.abs((s[i].y - s[i - 1].y) - r * dx) > 1e-9) return null
  }
  return r
}
const stepDys = (pts: Pt[]): number[] => pts.slice(1).map((p, i) => p.y - pts[i].y)
const isFunction = (pairs: Array<[string, string]>): boolean => {
  const m = new Map<string, Set<string>>()
  for (const [i, o] of pairs) m.set(i, (m.get(i) ?? new Set<string>()).add(o))
  return [...m.values()].every(s => s.size === 1)
}
const outputsOf = (pairs: Array<[string, string]>, input: string): Set<string> =>
  new Set(pairs.filter(p => p[0] === input).map(p => p[1]))
const norm = (s: string) => String(num(s))

// y = mx + b, parsed from "y = 4x", "y = 2x + 15", "y = 2x − 40", "y = −3x + 1"
const parseLine = (s: string): { m: number; b: number } | null => {
  const r = /y = (−?\d*)x(?: ([+−]) (\d+))?/.exec(s)
  if (!r) return null
  const m = r[1] === '' ? 1 : r[1] === '−' ? -1 : num(r[1])
  const b = r[2] ? (r[2] === '+' ? 1 : -1) * num(r[3]) : 0
  return { m, b }
}

// piecewise graph: y at x, and rate over [a,b] (must be one straight piece or constant sign)
type Seg = { a: [number, number]; b: [number, number] }
const segs = (q: Q): Seg[] => {
  if (q.picture?.kind !== 'coord' || !q.picture.lines) fail(q, 'expected a graph with lines')
  return q.picture.lines as Seg[]
}
// signs of each piece inside [p, q]; all pieces must agree for a single answer
const trendIn = (q: Q, p: number, r: number): number => {
  const inside = segs(q).filter(s => Math.min(s.a[0], s.b[0]) >= p && Math.max(s.a[0], s.b[0]) <= r)
  if (!inside.length) fail(q, `no piece between ${p} and ${r}`)
  const signs = new Set(inside.map(s => Math.sign((s.b[1] - s.a[1]) * Math.sign(s.b[0] - s.a[0]))))
  if (signs.size !== 1) fail(q, `mixed trend between ${p} and ${r}`)
  return [...signs][0]
}
const rateIn = (q: Q, p: number, r: number): number => {
  const inside = segs(q).filter(s => Math.min(s.a[0], s.b[0]) >= p && Math.max(s.a[0], s.b[0]) <= r)
  const rates = new Set(inside.map(s => (s.b[1] - s.a[1]) / (s.b[0] - s.a[0])))
  if (rates.size !== 1) fail(q, `not one straight piece between ${p} and ${r}`)
  return [...rates][0]
}

// ---- t1: is it a function ----
const t1 = (q: Q): string => {
  const t = q.text
  if (/^Is this table a function\?/.test(t)) {
    const pairs = tablePairs(q).map(p => [String(p.x), String(p.y)] as [string, string])
    const fn = isFunction(pairs)
    return one(q, c => {
      if (c === 'Yes: each input has one output') return fn
      let r = /^No: input (−?\d+) has two outputs$/.exec(c)
      if (r) return outputsOf(pairs, norm(r[1])).size >= 2
      r = /^No: output (−?\d+) repeats$/.exec(c)
      if (r) return false // a repeated output never stops a function
      return fail(q, `unknown choice "${c}"`)
    })
  }
  if (/^Each set lists pairs/.test(t)) {
    return one(q, c => {
      const pairs = [...c.matchAll(/\((−?\d+), (−?\d+)\)/g)].map(m => [norm(m[1]), norm(m[2])] as [string, string])
      if (!pairs.length) fail(q, `unparsed set "${c}"`)
      return isFunction(pairs)
    })
  }
  let r = /^(\w+) says this table is (not )?a function because (.+)\. Is \1 right\?$/.exec(t)
  if (r) {
    const [, who, not, reason] = r
    const pairs = tablePairs(q).map(p => [String(p.x), String(p.y)] as [string, string])
    const fn = isFunction(pairs)
    const claimFn = !not
    if (claimFn !== fn) return one(q, c => c === `${who} is wrong: it is ${fn ? '' : 'not '}a function`)
    let valid: boolean
    let m: RegExpExecArray | null
    if ((m = /^input (−?\d+) has two outputs$/.exec(reason))) valid = outputsOf(pairs, norm(m[1])).size >= 2
    else if (reason === 'no output repeats' || /^output (−?\d+) repeats$/.test(reason)) valid = false
    else return fail(q, 'unknown reason')
    if (!valid) fail(q, 'conclusion right but reason wrong — ambiguous')
    return one(q, c => c === `${who} is right`)
  }
  if (/^One input shows up twice/.test(t)) {
    const p = q.picture
    const xs: string[] = p.head.slice(1).map(norm)
    const ys: string[] = p.rows[0].slice(1)
    const hole = ys.indexOf('?')
    if (hole < 0) fail(q, 'no ?')
    const others = xs.map((x, i) => ({ x, y: ys[i], i })).filter(e => e.x === xs[hole] && e.i !== hole)
    if (others.length !== 1) fail(q, 'the ? input is not a repeat')
    return norm(others[0].y)
  }
  r = /^The table lists each (.+) with its (.+)\. Is the (.+) a function of the (.+)\? Pick/.exec(t)
  if (r) {
    const [, colName, rowName, outName, inName] = r
    const tp = tablePairs(q).map(p => [String(p.x), String(p.y)] as [string, string])
    let pairs: Array<[string, string]>
    if (inName === colName && outName === rowName) pairs = tp
    else if (inName === rowName && outName === colName) pairs = tp.map(([a, b]) => [b, a] as [string, string])
    else return fail(q, 'names do not match')
    const fn = isFunction(pairs)
    return one(q, c => {
      if (c === `Yes: each ${inName} has one ${outName}`) return fn
      let m = new RegExp(`^No: (${colName}|${rowName}) (−?\\d+) (has two .+|has more than one .+|shows up twice|repeats)$`).exec(c)
      if (!m) return fail(q, `unknown choice "${c}"`)
      if (m[1] !== inName) return false // an output repeating never stops a function
      if (/^(shows up twice|repeats)$/.test(m[3])) return false // repeat alone is not two outputs
      return outputsOf(pairs, norm(m[2])).size >= 2
    })
  }
  return fail(q)
}

// ---- t2: evaluating f(x) ----
const affine = (s: string): { a: number; b: number } | null => {
  const r = /(?:output = (−?\d+) × input|f\(x\) = (−?\d*)x|C\(x\) = (−?\d*)x)(?: ([+−]) (\d+))?/.exec(s)
  if (!r) return null
  const raw = r[1] ?? r[2] ?? r[3]
  const a = raw === '' ? 1 : raw === '−' ? -1 : num(raw)
  const b = r[4] ? (r[4] === '+' ? 1 : -1) * num(r[5]) : 0
  return { a, b }
}
const t2 = (q: Q): string => {
  const t = q.text
  const f = affine(t) ?? fail(q, 'no rule')
  let r = /What is the output when the input is (−?\d+)\?/.exec(t) ?? /What is f\((−?\d+)\)\?/.exec(t)
  if (r) return fmt(f.a * num(r[1]) + f.b)
  if ((r = /worked out f\((−?\d+)\)/.exec(t))) {
    const x = num(r[1])
    return one(q, c => {
      const m = /^(−?\d+) × (−?\d+) ([+−]) (\d+) = (−?\d+)$/.exec(c) ?? fail(q, `unparsed "${c}"`)
      const lhs = num(m[1]) * num(m[2]) + (m[3] === '+' ? 1 : -1) * num(m[4])
      return num(m[1]) === f.a && num(m[2]) === x && (m[3] === '+' ? 1 : -1) * num(m[4]) === f.b && lhs === num(m[5])
    })
  }
  if ((r = /For what input x is f\(x\) = (−?\d+)\?/.exec(t))) {
    const x = (num(r[1]) - f.b) / f.a
    if (!Number.isInteger(x)) fail(q, 'non-integer input')
    return fmt(x)
  }
  if (/How many more dollars/.test(t)) {
    const m = /do (\d+) hours? cost than (\d+) hours?\?/.exec(t) ?? /does a (\d+)-mile ride cost than a (\d+)-mile ride\?/.exec(t)
    if (!m) return fail(q)
    return fmt(f.a * (num(m[1]) - num(m[2])))
  }
  return fail(q)
}

// ---- t3: linear or not ----
const t3 = (q: Q): string => {
  const t = q.text
  const pts: Pt[] = q.picture?.kind === 'coord'
    ? (q.picture.points as Pt[]).slice().sort((a, b) => a.x - b.x)
    : q.picture?.kind === 'table' && !/What number goes/.test(t) ? tablePairs(q) : []
  if (/^Is this table linear\?|^Do these points make a straight line\?/.test(t)) {
    const rate = sameRate(pts)
    const dys = stepDys(pts)
    return one(q, c => {
      if (/^(Not linear|No):/.test(c)) return rate === null
      const m = /^(?:Linear|Yes): y goes (up|down) (\d+) (?:every|each) step$/.exec(c) ?? fail(q, `unknown choice "${c}"`)
      const k = (m[1] === 'up' ? 1 : -1) * num(m[2])
      return rate !== null && dys.every(d => d === k)
    })
  }
  let r = /^(\w+) says this table is (not )?linear because (.+)\. Is \1 right\?$/.exec(t)
  if (r) {
    const [, who, not, reason] = r
    const lin = sameRate(pts) !== null
    if (!not !== lin) return one(q, c => c === `${who} is wrong: it is ${lin ? '' : 'not '}linear`)
    const dys = stepDys(pts)
    let valid: boolean
    let m: RegExpExecArray | null
    if ((m = /^y goes up (.+)$/.exec(reason)) && /then/.test(reason)) {
      // listing step changes is only a reason when the x steps are equal
      const listed = m[1].split(/, then | then /).map(num)
      const dxs = stepDys(pts.map(p => ({ x: 0, y: p.x })))
      valid = listed.length === dys.length && listed.every((v, i) => v === dys[i]) && new Set(dxs).size === 1
    } else if ((m = /^y goes up (\d+) every step$/.exec(reason))) valid = dys.every(d => d === num(m![1]))
    else if (/^y changes by a different amount for each 1 in x$/.test(reason)) valid = !lin
    else return fail(q, 'unknown reason')
    if (!valid) fail(q, 'conclusion right but reason wrong — ambiguous')
    return one(q, c => c === `${who} is right`)
  }
  if (/^This table is linear\. What number goes where the \? is\?/.test(t)) {
    const p = q.picture
    const xs: number[] = p.head.slice(1).map(num)
    const ys: string[] = p.rows[0].slice(1)
    const hole = ys.indexOf('?')
    const known = xs.map((x, i) => ({ x, y: ys[i] })).filter(e => e.y !== '?').map(e => ({ x: e.x, y: num(e.y) }))
    const rate = sameRate(known)
    if (hole < 0 || rate === null) fail(q, 'known points not linear')
    const v = known[0].y + rate! * (xs[hole] - known[0].x)
    if (!Number.isInteger(Math.round(v * 1e9) / 1e9)) fail(q, 'non-integer fill')
    return fmt(v)
  }
  if (/Is (its|its amount of) .*linear\? Pick/.test(t)) {
    const rate = sameRate(pts)
    return one(q, c => {
      if (/^Not linear:/.test(c)) return rate === null
      const m = /^Linear: it (drops|grows) (\d+) \w+ each \w+$/.exec(c) ?? fail(q, `unknown choice "${c}"`)
      return rate !== null && rate === (m[1] === 'grows' ? 1 : -1) * num(m[2])
    })
  }
  return fail(q)
}

// ---- t4: comparing functions ----
const t4 = (q: Q): string => {
  const t = q.text
  if (/^This table is a linear function\. How much does y go up for each 1 in x\?/.test(t)) {
    return fmt(sameRate(tablePairs(q)) ?? fail(q, 'table not linear'))
  }
  const eq = parseLine(t)
  let r = /^Function A is the table\. Function B is y = .+ Which grows faster\?$/.exec(t)
  if (r) {
    const a = sameRate(tablePairs(q)) ?? fail(q, 'table not linear'), b = eq!.m
    const want = a === b ? 'they grow at the same rate' : a > b ? 'function A' : 'function B'
    return one(q, c => c === want)
  }
  if (/^Function A is y = .+ Function B is the table\./.test(t)) {
    const pts = tablePairs(q)
    const rB = sameRate(pts) ?? fail(q, 'table not linear')
    const startB = pts[0].y - rB * pts[0].x
    const rA = eq!.m, startA = eq!.b
    if (/how much more does the faster one go up\?/.test(t)) return fmt(Math.abs(rA - rB))
    if (/Which one is true\?/.test(t)) {
      if (startA === startB || rA === rB) fail(q, 'a tie makes every choice false')
      const higher = startA > startB ? 'A' : 'B', faster = rA > rB ? 'A' : 'B'
      return one(q, c => {
        const m = /^Function (A|B) starts higher(?:, but function (A|B)| and) grows faster$/.exec(c) ?? fail(q, `unknown choice "${c}"`)
        return m[1] === higher && (m[2] ?? m[1]) === faster && (m[2] === undefined) === (higher === faster)
      })
    }
  }
  if ((r = /Pool B starts with (\d+) (?:feet|foot) of water and rises (\d+) (?:feet|foot) each hour\. Which pool's water rises faster\?/.exec(t))) {
    const a = sameRate((q.picture.points as Pt[]).slice().sort((u, v) => u.x - v.x)) ?? fail(q, 'graph points not linear')
    for (const s of segs(q)) if ((s.b[1] - s.a[1]) / (s.b[0] - s.a[0]) !== a) fail(q, 'line disagrees with points')
    const b = num(r[2])
    const want = a === b ? 'They rise at the same rate' : a > b ? 'Pool A' : 'Pool B'
    return one(q, c => c === want)
  }
  return fail(q)
}

// ---- t5: building linear models ----
const model = (q: Q): { m: number; b: number } => {
  const t = q.text
  const r =
    /costs \$(\d+) to join, plus \$(\d+) (?:each|for each)/.exec(t) ??
    /charges \$(\d+) for shoes, plus \$(\d+) for each/.exec(t) ??
    /charges \$(\d+) to come out, plus \$(\d+) for each/.exec(t) ??
    /has \$(\d+) saved and adds \$(\d+) each/.exec(t)
  if (r) return { b: num(r[1]), m: num(r[2]) }
  const d = /holds (\d+) gallons\. It drains (\d+) gallons every/.exec(t) ?? /is at (\d+) percent\. It drops (\d+) percent every/.exec(t)
  if (d) return { b: num(d[1]), m: -num(d[2]) }
  return fail(q, 'no story model')
}
const t5 = (q: Q): string => {
  const t = q.text
  const { m, b } = model(q)
  if (/Which rule gives/.test(t)) return one(q, c => { const e = parseLine(c) ?? fail(q, `unparsed "${c}"`); return e.m === m && e.b === b })
  let r = /What is (m|b)\? Type the number\./.exec(t)
  if (r) return fmt(r[1] === 'm' ? m : b)
  if ((r = /(\w+) wrote (y = [^ ]+(?: [+−] \d+)?) for .+ Is \1 right\?$/.exec(t))) {
    const w = parseLine(r[2]) ?? fail(q, 'unparsed claim')
    const right = w.m === m && w.b === b
    return one(q, c => {
      if (c === `${r![1]} is right`) return right
      const e = parseLine(c) ?? fail(q, `unparsed "${c}"`)
      return !right && e.m === m && e.b === b
    })
  }
  if ((r = /after (\d+) (?:months|games|visits|weeks|hours)\? Type the number\./.exec(t))) return fmt(b + m * num(r[1]))
  if ((r = /After how many \w+ is the (?:cost|amount saved) (\d+)\?/.exec(t))) {
    const x = (num(r[1]) - b) / m
    if (!Number.isInteger(x) || x < 0) fail(q, 'no whole-number answer')
    return fmt(x)
  }
  return fail(q)
}

// ---- t6: graph stories ----
const t6 = (q: Q): string => {
  const t = q.text
  let r = /What is the distance doing between hour (\d+) and hour (\d+)\?/.exec(t)
  if (r) {
    const s = trendIn(q, num(r[1]), num(r[2]))
    return one(q, c => c === (s > 0 ? 'increasing' : s < 0 ? 'decreasing' : 'not changing'))
  }
  const span = (c: string): [number, number] => {
    const m = /^hour (\d+) to (\d+)$/.exec(c) ?? fail(q, `unparsed "${c}"`)
    return [num(m[1]), num(m[2])]
  }
  if (/During which hours did the distance not change\?/.test(t)) return one(q, c => trendIn(q, ...span(c)) === 0)
  if ((r = /What does the piece from hour (\d+) to hour (\d+) tell you\?/.exec(t))) {
    const s = trendIn(q, num(r[1]), num(r[2]))
    return one(q, c => {
      if (/is getting closer to home$/.test(c)) return s < 0
      if (/is riding away from home$/.test(c)) return s > 0
      if (/has stopped: the distance is not changing$/.test(c)) return s === 0
      if (/is riding (up|down) a hill$/.test(c)) return false // a distance graph shows no hills
      return fail(q, `unknown choice "${c}"`)
    })
  }
  if ((r = /During which part is the distance (shrinking|growing) fastest\?/.exec(t))) {
    const dir = r[1] === 'growing' ? 1 : -1
    const scored = choices(q).map(c => ({ c, v: dir * rateIn(q, ...span(c)) }))
    const best = Math.max(...scored.map(s => s.v))
    if (best <= 0) fail(q, 'no part moves that way')
    // the graph's steepest piece that way must be one of the choices
    const allBest = Math.max(...segs(q).map(s => dir * (s.b[1] - s.a[1]) / (s.b[0] - s.a[0])))
    if (allBest !== best) fail(q, 'steepest piece is not among the choices')
    return one(q, c => scored.find(s => s.c === c)!.v === best)
  }
  if ((r = /While .+ is (riding back home|riding away from home|filling|draining), (?:how many|by how many)/.exec(t))) {
    const dir = /away|filling/.test(r[1]) ? 1 : -1
    const rates = new Set(segs(q).map(s => (s.b[1] - s.a[1]) / (s.b[0] - s.a[0])).filter(v => Math.sign(v) === dir))
    if (rates.size !== 1) fail(q, `${rates.size} different rates that way`)
    // "by how many" with no "may be negative" hint: the size of the change
    return fmt(Math.abs([...rates][0]))
  }
  return fail(q)
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g8m3-t1': t1,
  'g8m3-t2': t2,
  'g8m3-t3': t3,
  'g8m3-t4': t4,
  'g8m3-t5': t5,
  'g8m3-t6': t6,
}
