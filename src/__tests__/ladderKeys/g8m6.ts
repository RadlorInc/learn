/**
 * Independent answer key for g8m6 practice ladders — written from the printed questions only
 * (scripts/ladder-questions.mts), never from the generator. Throws rather than guesses.
 */
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why: string): never => { throw new Error(`g8m6 key: ${why} — "${q.text}"`) }
const N = (s: string) => Number(s.replace(/−/g, '-').replace(/,/g, ''))
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const fstr = (n: number, d: number) => {
  if (d < 0) { n = -n; d = -d }
  const g = gcd(n, d) || 1
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`
}
/** exactly one choice satisfies `ok`, or throw */
function pick(q: Q, ok: (c: string) => boolean): string {
  const hits = (q.choices ?? []).filter(ok)
  if (hits.length !== 1) fail(q, `${hits.length} choices fit`)
  return hits[0]
}
const num = (q: Q, v: number) => {
  if (!Number.isFinite(v) || Math.abs(v - Math.round(v)) > 1e-9) fail(q, `non-integer answer ${v}`)
  return String(Math.round(v))
}

// ── scatter plots ───────────────────────────────────────────────────────────────────────────────
type P = [number, number]
function corr(ps: P[]): number {
  const n = ps.length, mx = ps.reduce((s, p) => s + p[0], 0) / n, my = ps.reduce((s, p) => s + p[1], 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (const [x, y] of ps) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2 }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0
}
/** Pearson r: ≥ 0.6 positive, ≤ −0.6 negative, |r| ≤ 0.35 no pattern; between is borderline → throw */
function pattern(q: Q, ps: P[]): 'positive' | 'negative' | 'no pattern' {
  const r = corr(ps)
  if (r >= 0.6) return 'positive'
  if (r <= -0.6) return 'negative'
  if (Math.abs(r) <= 0.35) return 'no pattern'
  return fail(q, `borderline pattern r=${r.toFixed(2)}`)
}
function tablePoints(q: Q): P[] {
  const rows: string[][] = q.picture.rows
  if (rows?.length !== 2) fail(q, 'expected two table rows')
  return rows[0].slice(1).map((x, i) => [N(x), N(rows[1][i + 1])] as P)
}
const PAIRS: Record<string, 'positive' | 'negative' | 'no pattern'> = {
  'Age of a car and its value': 'negative',
  'Pages in a book and time to read it': 'positive',
  'Shoe size and test score': 'no pattern',
  'Speed of a runner and time to finish a race': 'negative',
  'Temperature and ice creams sold': 'positive',
  'Birth month and math score': 'no pattern',
  'Letters in a first name and height': 'no pattern',
  'Days absent and test score': 'negative',
  'Hours worked and money earned': 'positive',
  'Letters in a pet’s name and its weight': 'no pattern',
  'Hours of practice and free throws made': 'positive',
  'Last digit of a phone number and height': 'no pattern',
  'Temperature and cups of hot chocolate sold': 'negative',
  'Miles driven and gas used': 'positive',
  'Hours of screen time and hours of sleep': 'negative',
}

/** least-squares residual of p against the line fit to the other points, in units of their residual spread */
function looScore(ps: P[], p: P): number {
  const rest = ps.filter(o => o !== p)
  const n = rest.length, mx = rest.reduce((s, o) => s + o[0], 0) / n, my = rest.reduce((s, o) => s + o[1], 0) / n
  let sxy = 0, sxx = 0
  for (const [x, y] of rest) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2 }
  const m = sxx ? sxy / sxx : 0, b = my - m * mx
  const sd = Math.sqrt(rest.reduce((s, [x, y]) => s + (y - (m * x + b)) ** 2, 0) / Math.max(1, n - 2)) || 1e-9
  return Math.abs(p[1] - (m * p[0] + b)) / sd
}

function t1(q: Q): string {
  const t = q.text
  if (/What pattern does the plot show\?$/.test(t)) {
    const p = pattern(q, q.picture.points)
    return pick(q, c => c === p)
  }
  if (/One dot is far from the rest\. Which dot is it\?$/.test(t)) {
    const ps: P[] = q.picture.points
    const scored = (q.choices ?? []).map(c => {
      const m = c.match(/^\((−?\d+), (−?\d+)\)$/) ?? fail(q, `choice ${c}`)
      const pt = ps.find(p => p[0] === N(m[1]) && p[1] === N(m[2])) ?? fail(q, `choice ${c} not a dot`)
      return { c, s: looScore(ps, pt) }
    }).sort((a, b) => b.s - a.s)
    if (scored.length < 2 || scored[0].s < 2.5 || scored[0].s < 2 * scored[1].s) fail(q, `no clear outlier ${scored.map(x => x.s.toFixed(1))}`)
    return scored[0].c
  }
  let m = t.match(/ and says it shows (a positive pattern|a negative pattern|no pattern)\. Is (\w+) right\?$/)
  if (m) {
    const claim = m[1].replace(/^a | pattern$/g, '').replace(/^no$/, 'no pattern')
    const real = pattern(q, q.picture.points)
    const who = m[2]
    return pick(q, c => c === `Yes, ${who} is right` ? claim === real
      : c === 'No, it shows no pattern' ? real === 'no pattern' && claim !== real
      : c === 'No, it is a positive pattern' ? real === 'positive' && claim !== real
      : c === 'No, it is a negative pattern' ? real === 'negative' && claim !== real
      : fail(q, `choice ${c}`))
  }
  if (/If you made a scatter plot of them, what pattern would it show\?$/.test(t)) {
    const p = pattern(q, tablePoints(q))
    return pick(q, c => c === p)
  }
  m = t.match(/^Which pair would most likely show (a positive pattern|a negative pattern|no pattern) on a scatter plot\?$/)
  if (m) {
    const want = m[1] === 'no pattern' ? 'no pattern' : m[1].split(' ')[1]
    return pick(q, c => (PAIRS[c] ?? fail(q, `unknown pair ${c}`)) === want)
  }
  return fail(q, 'unrecognised')
}

function slopeOf(q: Q, s: string): [number, number] {
  const m = s.match(/\((−?\d+), (−?\d+)\) and \((−?\d+), (−?\d+)\)/) ?? fail(q, 'two points')
  const [x1, y1, x2, y2] = [m[1], m[2], m[3], m[4]].map(N)
  if (x1 === x2) fail(q, 'vertical')
  // picture check: both named points should sit on the drawn line
  const fit: P[] | undefined = q.picture?.fit
  if (fit) {
    const on = (x: number, y: number) => Math.abs((fit[1][1] - fit[0][1]) * (x - fit[0][0]) - (y - fit[0][1]) * (fit[1][0] - fit[0][0])) < 1e-9
    if (!on(x1, y1) || !on(x2, y2)) fail(q, 'named points are not on the drawn line')
  }
  return [y2 - y1, x2 - x1]
}

function t2(q: Q): string {
  const t = q.text
  let m = t.match(/How many dots sit (above|below) the line\?$/)
  if (m) {
    const [[x0, y0], [x1, y1]]: P[] = q.picture.fit
    let above = 0, below = 0
    for (const [x, y] of q.picture.points as P[]) {
      const d = (y - y0) * (x1 - x0) - (y1 - y0) * (x - x0) // sign of y − line(x), x1 > x0
      if (d === 0) fail(q, 'a dot sits on the line')
      if (d > 0) above++; else below++
    }
    return String(m[1] === 'above' ? above : below)
  }
  if (/Which line fits best\?$/.test(t)) {
    const n = Number((t.match(/these (\d+) dots/) ?? fail(q, 'count'))[1])
    const opts = (q.choices ?? []).map(c => {
      const r = c.match(/^A line with (\d+) dots? above it and (\d+) below$/) ?? fail(q, `choice ${c}`)
      if (+r[1] + +r[2] !== n) fail(q, `choice ${c} does not total ${n}`)
      return { c, gap: Math.abs(+r[1] - +r[2]) }
    })
    const best = Math.min(...opts.map(o => o.gap))
    return pick(q, c => opts.find(o => o.c === c)!.gap === best)
  }
  if (/What is its slope\?$/.test(t)) {
    const [dy, dx] = slopeOf(q, t)
    return fstr(dy, dx)
  }
  m = t.match(/(\w+) says it is (−?\d+)\. Is \1 right\?$/)
  if (m && /found the slope/.test(t)) {
    const [dy, dx] = slopeOf(q, t)
    const s = dy / dx
    return pick(q, c => {
      const y = c.match(/^Yes, (−?\d+) is right$/)
      if (y) return N(y[1]) === s && N(m![2]) === s
      const n = c.match(/^No, it is (−?\d+)$/) ?? fail(q, `choice ${c}`)
      return N(n[1]) === s && N(m![2]) !== s
    })
  }
  m = t.match(/has a slope of (−?\d+)\. It passes through \((−?\d+), (−?\d+)\) and \((−?\d+), \?\)\. What is the missing y value\?$/)
  if (m) {
    const [s, x1, y1, x2] = [m[1], m[2], m[3], m[4]].map(N)
    return num(q, y1 + s * (x2 - x1))
  }
  return fail(q, 'unrecognised')
}

function line(q: Q): [number, number] {
  const m = q.text.match(/y = (−?\d*)x(?: ([+−]) (\d+))?/) ?? fail(q, 'equation')
  const slope = m[1] === '' ? 1 : m[1] === '−' ? -1 : N(m[1])
  const b = m[2] ? (m[2] === '+' ? 1 : -1) * N(m[3]) : 0
  return [slope, b]
}

function t3(q: Q): string {
  const t = q.text
  let m = t.match(/is y = [^.]*\. Predict .* (?:for|after) (\d+) \w+(?: of \w+)?\.$/)
  if (m) { const [s, b] = line(q); return num(q, s * N(m[1]) + b) }
  m = t.match(/starts at (−?\d+) at 0 \w+ and passes through \((−?\d+), (−?\d+)\)\. Use it to predict .* (?:for|after) (\d+) \w+(?: of \w+)?\.$/)
  if (m) {
    const [b, x1, y1, x] = [m[1], m[2], m[3], m[4]].map(N)
    const fit: P[] | undefined = q.picture?.fit
    if (fit) {
      const at = (xx: number) => fit[0][1] + ((fit[1][1] - fit[0][1]) * (xx - fit[0][0])) / (fit[1][0] - fit[0][0])
      if (Math.abs(at(0) - b) > 1e-9 || Math.abs(at(x1) - y1) > 1e-9) fail(q, 'text disagrees with the drawn line')
    }
    return num(q, b + ((y1 - b) * x) / x1)
  }
  m = t.match(/What does the (−?\d+) mean\?$/)
  if (m) {
    const [s, b] = line(q), k = N(m[1])
    const isSlope = Math.abs(k) === Math.abs(s), isB = k === b
    if (isSlope === isB) fail(q, 'cannot tell slope from start value')
    return pick(q, c => {
      const a = c.match(/^About (\d+) (more|fewer) \w+ for each extra \w+$/)
      if (a) return isSlope && N(a[1]) === Math.abs(s) && (a[2] === 'more') === (s > 0)
      const z = c.match(/^(−?\d+) \w+ at 0 \w+$/)
      if (z) return isB && N(z[1]) === b
      if (/^−?\d+ \w+$/.test(c)) return false // "5 hours": neither slope nor start value
      return fail(q, `choice ${c}`)
    })
  }
  m = t.match(/uses the line y = [^ ]+(?: [+−] \d+)? to predict .* (?:for|after) (\d+) \w+(?: of \w+)?\. (\w+) gets (−?\d+)\. Is \2 right\?$/)
  if (m) {
    const [s, b] = line(q), y = s * N(m[1]) + b, got = N(m[3])
    return pick(q, c => {
      const yes = c.match(/^Yes, (−?\d+) is right$/)
      if (yes) return N(yes[1]) === got && got === y
      const no = c.match(/^No, it is (−?\d+)$/) ?? fail(q, `choice ${c}`)
      return N(no[1]) === y && got !== y
    })
  }
  m = t.match(/(?:predict for (?:a score of )?(−?\d+)(?: dollars earned)?|predict (?:a height of )?(−?\d+)(?: inches| pages read)?)\?$/)
  if (m) {
    const [s, b] = line(q), y = N(m[1] ?? m[2])
    return num(q, (y - b) / s)
  }
  return fail(q, 'unrecognised')
}

// ── two-way tables ──────────────────────────────────────────────────────────────────────────────
type G = (number | null)[][]
function grid(q: Q): G {
  const rows: string[][] = q.picture.rows
  if (rows?.length !== 3 || rows.some(r => r.length !== 4)) fail(q, 'expected a 2×2 table with totals')
  return rows.map(r => r.slice(1).map(v => (v === '?' ? null : N(v))))
}
function solve(q: Q, g: G): number[][] {
  for (let pass = 0; pass < 10; pass++) {
    for (let i = 0; i < 3; i++) {
      const row = g[i], nr = row.filter(v => v === null).length
      if (nr === 1) { const j = row.indexOf(null); row[j] = j === 2 ? row[0]! + row[1]! : row[2]! - row[1 - j]! }
      const col = [g[0][i], g[1][i], g[2][i]], nc = col.filter(v => v === null).length
      if (nc === 1) { const k = col.indexOf(null); g[k][i] = k === 2 ? col[0]! + col[1]! : col[2]! - col[1 - k]! }
    }
  }
  if (g.some(r => r.some(v => v === null))) fail(q, 'table cannot be completed')
  const s = g as number[][]
  for (let i = 0; i < 3; i++) {
    if (s[i][0] + s[i][1] !== s[i][2] || s[0][i] + s[1][i] !== s[2][i]) fail(q, 'table totals disagree')
  }
  if (s.some(r => r.some(v => v < 0))) fail(q, 'negative count')
  return s
}
function rowOf(q: Q, phrase: string): number {
  const labels: string[] = q.picture.rows.slice(0, 2).map((r: string[]) => r[0])
  const keys = labels.map(l => { const a = l.match(/^Age (\d+)$/); return a ? `${a[1]}-year-olds` : l.toLowerCase() })
  const hits = keys.map((k, i) => (new RegExp(`\\b${k}\\b`).test(phrase.toLowerCase()) ? i : -1)).filter(i => i >= 0)
  if (hits.length !== 1) fail(q, `row for "${phrase}"`)
  return hits[0]
}
function colOf(q: Q, phrase: string): number {
  const head: string[] = q.picture.head.slice(1, 3)
  const p = phrase.toLowerCase()
  const neg = /\bdo(es)? not\b/.test(p)
  const want = neg ? 'Does not'
    : /pizza/.test(p) ? 'Likes pizza' : /sport/.test(p) ? 'Plays a sport'
    : /swim/.test(p) ? 'Swim' : /hik/.test(p) ? 'Hike' : /walk/.test(p) ? 'Walks' : /ride/.test(p) ? 'Rides'
    : /\btea\b/.test(p) ? 'Tea' : /\bcoffee\b/.test(p) ? 'Coffee' : fail(q, `column for "${phrase}"`)
  if (neg && !/pizza|sport/.test(p)) fail(q, `negated column "${phrase}"`)
  const j = head.indexOf(want)
  if (j < 0) fail(q, `no column ${want}`)
  return j
}

function t4(q: Q): string {
  const t = q.text
  let m = t.match(/^A survey asked (\d+) \w+\. (\d+) of them are (.+?), and (\d+) of them (.+?)\. (\d+) of the (.+?)\. How many (.+)\?$/)
  if (m) {
    const g = grid(q)
    if (g.some(r => r.some(v => v !== null))) fail(q, 'expected a blank table')
    const r = rowOf(q, m[3]), c = colOf(q, m[5])
    g[2][2] = N(m[1]); g[r][2] = N(m[2]); g[2][c] = N(m[4])
    const r2 = rowOf(q, m[7]), c2 = colOf(q, m[7])
    if (r2 !== r || c2 !== c) fail(q, 'third fact is not the crossing cell')
    g[r][c] = N(m[6])
    const s = solve(q, g)
    return String(s[rowOf(q, m[8])][colOf(q, m[8])])
  }
  m = t.match(/^How many (.+)\?$/)
  if (m) { const s = solve(q, grid(q)); return String(s[rowOf(q, m[1])][colOf(q, m[1])]) }
  if (t === 'Which statement does the table show?') {
    const s = solve(q, grid(q))
    return pick(q, c => {
      const r = c.match(/^(\d+) of the (.+)$/) ?? fail(q, `choice ${c}`)
      return s[rowOf(q, r[2])][colOf(q, r[2])] === N(r[1])
    })
  }
  m = t.match(/^(\w+) adds (\d+) and (\d+) from this table and says (\d+) (\w+) were asked in all\. Is \1 right\?$/)
  if (m) {
    const g = grid(q), said = N(m[4]), who = m[1], things = m[5]
    if (N(m[2]) + N(m[3]) !== said) fail(q, 'sum in text is wrong')
    solve(q, grid(q)) // the table itself must be consistent
    // every visible entry except the grand total, with the inner cells [row, col] it counts
    const spots: { i: number; j: number; cells: number[][] }[] = []
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      if ((i === 2 && j === 2) || g[i][j] === null) continue
      const cells = i < 2 && j < 2 ? [[i, j]] : i < 2 ? [[i, 0], [i, 1]] : [[0, j], [1, j]]
      spots.push({ i, j, cells })
    }
    const at = (v: number) => spots.filter(sp => g[sp.i][sp.j] === v)
    const verdicts = new Set<string>()
    for (const a of at(N(m[2]))) for (const b of at(N(m[3]))) {
      if (a === b) continue
      const cover = [0, 0, 0, 0]
      for (const [r, c] of [...a.cells, ...b.cells]) cover[r * 2 + c]++
      const twice = cover.some(k => k > 1), missed = cover.some(k => k === 0)
      verdicts.add(!twice && !missed ? 'yes' : twice && missed ? 'both' : missed ? 'missed' : 'twice-only')
    }
    if (verdicts.size !== 1) fail(q, `named numbers are ambiguous in the table: ${[...verdicts]}`)
    const v = [...verdicts][0]
    if (v === 'twice-only') fail(q, 'counted twice but left nobody out — no choice for that')
    return pick(q, c => c === `Yes, ${who} is right` ? v === 'yes'
      : c === `No, ${who} only left some ${things} out` ? v === 'missed'
      : c === `No, ${who} counted some ${things} twice and left some out` ? v === 'both'
      : fail(q, `choice ${c}`))
  }
  return fail(q, 'unrecognised')
}

function t5(q: Q): string {
  const t = q.text
  let m = t.match(/^What percent of (.+)\? Type the number without the % sign\.$/)
  if (m) {
    const s = solve(q, grid(q)), r = rowOf(q, m[1]), c = colOf(q, m[1])
    return num(q, (100 * s[r][c]) / s[r][2])
  }
  m = t.match(/^Of the \w+ who (.+), what fraction (?:are|are in) (.+)\? Write it as a fraction\.$/)
  if (m) {
    const s = solve(q, grid(q)), c = colOf(q, m[1]), r = rowOf(q, m[2])
    return fstr(s[r][c], s[2][c])
  }
  m = t.match(/^(\w+) says (\d+(?:\.\d)?)% of (.+)\. Is \1 right\?$/)
  if (m) {
    const s = solve(q, grid(q)), who = m[1], p = N(m[2]), r = rowOf(q, m[3]), c = colOf(q, m[3])
    const p10 = Math.round(p * 10), is = (den: number) => 1000 * s[r][c] === p10 * den // exact percent, tenths allowed
    const right = is(s[r][2])
    return pick(q, ch => {
      if (ch === `Yes, ${who} is right`) return right
      let x = ch.match(new RegExp(`^No, ${who} divided by all (\\d+) \\w+$`))
      if (x) return !right && N(x[1]) === s[2][2] && is(s[2][2])
      x = ch.match(new RegExp(`^No, ${who} divided by the (\\d+) who (.+)$`)) ?? fail(q, `choice ${ch}`)
      return !right && colOf(q, x[2]) === c && N(x[1]) === s[2][c] && is(s[2][c])
    })
  }
  m = t.match(/^(\d+)% of the (.+)\. How many (.+)\?$/)
  if (m) {
    const g = grid(q), r = rowOf(q, m[2]), c = colOf(q, m[2])
    const tot = g[r][2] ?? fail(q, 'row total unknown')
    const cell = (N(m[1]) * tot) / 100
    if (!Number.isInteger(cell)) fail(q, `percent gives ${cell}`)
    if (g[r][c] !== null && g[r][c] !== cell) fail(q, 'table disagrees with percent')
    g[r][c] = cell
    const r2 = rowOf(q, m[3])
    if (r2 !== r) fail(q, 'asks about another group')
    const s = solve(q, g)
    return String(s[r2][colOf(q, m[3])])
  }
  m = t.match(/^Which group has a bigger share of \w+ who (.+)\?$/)
  if (m) {
    const s = solve(q, grid(q)), c = colOf(q, m[1])
    const d = s[0][c] * s[1][2] - s[1][c] * s[0][2] // row0 share − row1 share, cross-multiplied
    return pick(q, ch => ch === 'They have the same share' ? d === 0 : (rowOf(q, ch) === 0 ? d > 0 : d < 0))
  }
  return fail(q, 'unrecognised')
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g8m6-t1': t1,
  'g8m6-t2': t2,
  'g8m6-t3': t3,
  'g8m6-t4': t4,
  'g8m6-t5': t5,
}
