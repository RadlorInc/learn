// Blind answer key for g7m1's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g7m1 N`), never from the generator.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule'): never => { throw new Error(`g7m1 key: ${why} for "${q.text}" ${JSON.stringify(q.choices ?? '')}`) }

// ── exact fractions (numbers stay small here) ──
type F = [number, number]
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const fr = (p: number, q = 1): F => {
  if (!q) throw new Error('g7m1 key: divide by zero')
  const g = gcd(p, q) || 1, s = q < 0 ? -1 : 1
  return [(s * p) / g, (s * q) / g]
}
const add = (a: F, b: F) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1])
const sub = (a: F, b: F) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1])
const mul = (a: F, b: F) => fr(a[0] * b[0], a[1] * b[1])
const dv = (a: F, b: F) => fr(a[0] * b[1], a[1] * b[0])
const eqF = (a: F, b: F) => a[0] === b[0] && a[1] === b[1]
const absF = (a: F): F => [Math.abs(a[0]), a[1]]
const gt = (a: F, b: F) => a[0] * b[1] > b[0] * a[1]
const pct = (p: F) => dv(p, fr(100))
/** "1,170" · "$12.50" · "37.8" · "5/6" → exact fraction. */
function num(s: string): F {
  const t = s.replace(/[$,%\s]/g, '')
  let m: RegExpMatchArray | null
  if ((m = t.match(/^(-?\d+)\/(\d+)$/))) return fr(+m[1], +m[2])
  if ((m = t.match(/^(-?\d+)(?:\.(\d+))?$/))) return fr(+(m[1] + (m[2] ?? '')), 10 ** (m[2]?.length ?? 0))
  throw new Error(`g7m1 key: not a number "${s}"`)
}
/** Exact decimal when it terminates, else "p/q". */
function out(f: F): string {
  let d = f[1]
  while (d % 2 === 0) d /= 2
  while (d % 5 === 0) d /= 5
  if (d !== 1) return `${f[0]}/${f[1]}`
  const v = f[0] / f[1]
  return String(Number(v.toFixed(10)))
}

function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) fail(q, `${ok.length} choices fit`)
  return ok[0]
}

const cells = (row: string[]) => row.slice(1)
/** Table with a numeric head row and one data row → pairs (x, y), '?' kept as null. */
function pairs(q: Q, rowIdx = 0): Array<[F | null, F | null]> {
  const p = q.picture
  if (p?.kind !== 'table' || !p.head) fail(q, 'expected a table')
  const xs = cells(p.head), ys = cells(p.rows[rowIdx])
  return xs.map((x: string, i: number) => [x === '?' ? null : num(x), ys[i] === '?' ? null : num(ys[i])])
}
/** The single y/x shared by all complete pairs, or null if it changes. */
function constK(ps: Array<[F | null, F | null]>): F | null {
  let k: F | null = null
  for (const [x, y] of ps) {
    if (!x || !y) continue
    const r = dv(y, x)
    if (k && !eqF(k, r)) return null
    k = r
  }
  return k
}
/** Fill the one '?' in a proportional table. */
function fillTable(q: Q): string {
  const ps = pairs(q)
  const k = constK(ps) ?? fail(q, 'table is not proportional')
  const miss = ps.filter(([x, y]) => !x || !y)
  if (miss.length !== 1) fail(q, 'expected one ?')
  const [x, y] = miss[0]
  return out(x ? mul(k, x) : dv(y as F, k))
}
/** 2×2 grid [[label,a,b],[label,c,d]] with one '?' — equal ratios down the columns. */
function cross(q: Q): string {
  const r = q.picture?.rows
  if (!r || r.length !== 2) fail(q, 'expected a 2-row table')
  const g = [cells(r[0]), cells(r[1])]
  if (g[0].length !== 2) fail(q, 'expected 2 columns')
  const at = [0, 1].flatMap(i => [0, 1].map(j => [i, j])).filter(([i, j]) => g[i][j] === '?')
  if (at.length !== 1) fail(q, 'expected one ?')
  const [i, j] = at[0]
  // g[0][0]/g[1][0] = g[0][1]/g[1][1]  →  missing = product of diagonal partners ÷ same-row partner
  const other = (a: number, b: number) => num(g[a][b])
  return out(dv(mul(other(1 - i, j), other(i, 1 - j)), other(1 - i, 1 - j)))
}
const kOfPoint = (pt: { x: number; y: number }) => fr(pt.y, pt.x)
const pctChange = (from: F, to: F) => mul(dv(absF(sub(to, from)), from), fr(100))

export const SOLVE: Record<string, (q: Q) => string> = {
  'g7m1-t1': q => {
    const t = q.text
    if (/^Divide each bottom number by the top number above it\. Which one is true about this table\?$/.test(t)) {
      const k = constK(pairs(q))
      return pick(q, c => {
        if (/^Not proportional: y ÷ x changes$/.test(c)) return k === null
        const m = c.match(/^Proportional: every y ÷ x is ([\d./]+)$/)
        return !!m && !!k && eqF(k, num(m[1]))
      })
    }
    if (/Which pair breaks the steady rate\?$/.test(t)) {
      const ps = (q.choices ?? []).map(c => {
        const m = c.match(/^\((\d+), (\d+)\)$/) ?? fail(q, 'bad pair')
        return dv(num(m[2]), num(m[1]))
      })
      return pick(q, c => {
        const i = (q.choices ?? []).indexOf(c)
        const rest = ps.filter((_, j) => j !== i)
        return rest.every(r => eqF(r, rest[0])) && !eqF(ps[i], rest[0])
      })
    }
    if (/says this table is proportional because the bottom row goes up by the same amount each time\. Is \w+ right\?$/.test(t)) {
      const ps = pairs(q)
      const k = constK(ps)
      return pick(q, c => {
        if (/^Yes: it goes up by/.test(c)) return false // a steady step is not the test
        let m = c.match(/^Yes: every y ÷ x is ([\d./]+)$/)
        if (m) return !!k && eqF(k, num(m[1]))
        m = c.match(/^No: ([\d.]+) ÷ ([\d.]+) = ([\d.]+), but ([\d.]+) ÷ ([\d.]+) = ([\d.]+)$/)
        if (!m || k) return false
        const has = (y: string, x: string) => ps.some(([px, py]) => px && py && eqF(px, num(x)) && eqF(py, num(y)))
        return has(m[1], m[2]) && has(m[4], m[5]) &&
          eqF(dv(num(m[1]), num(m[2])), num(m[3])) && eqF(dv(num(m[4]), num(m[5])), num(m[6])) && !eqF(num(m[3]), num(m[6]))
      })
    }
    if (/^This table is proportional\. What number goes where the \? is\?$/.test(t)) return fillTable(q)
    if (/^The table shows what two .+ cost in all\. Which one has a cost proportional to the months\?$/.test(t)) {
      const rows = q.picture.rows as string[][]
      if (rows.length !== 2) fail(q, 'expected two rows')
      const name = (r: string[]) => r[0].replace(/\s*\(\$\)$/, '')
      const prop = rows.map((_, i) => constK(pairs(q, i)) !== null)
      const want = prop[0] && prop[1] ? 'Both' : prop[0] ? `Only ${name(rows[0])}` : prop[1] ? `Only ${name(rows[1])}` : 'Neither'
      return pick(q, c => c === want)
    }
    return fail(q)
  },

  'g7m1-t2': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^This table is proportional\. What is k in y = kx\?$/.test(t)) return out(constK(pairs(q)) ?? fail(q, 'not proportional'))
    if ((m = t.match(/^A \w+ \w+ (.+?) (?:for|in) (.+?)\. The rate stays steady\. In y = kx, x is the (.+?) and y is the (.+?)\. What is k\?$/))) {
      const [, a, b, xu, yu] = m
      const read = (s: string, unit: string) => {
        const mm = s.match(/^([\d.]+) (.+)$/) ?? fail(q, 'bad quantity')
        return mm[2] === unit ? num(mm[1]) : null
      }
      const y = read(a, yu) ?? read(b, yu) ?? fail(q, 'no y quantity')
      const x = read(b, xu) ?? read(a, xu) ?? fail(q, 'no x quantity')
      const lines: string[] = q.picture?.lines ?? []
      if (lines.length && (lines[0] !== `x = ${out(x)} ${xu}` || lines[1] !== `y = ${out(y)} ${yu}`)) fail(q, 'picture disagrees with text')
      return out(dv(y, x))
    }
    if (/^This table is proportional\. Which equation matches it\?$/.test(t)) {
      const ps = pairs(q)
      return pick(q, c => {
        const e = c.match(/^y = ([\d.]+)x$/)
        if (e) return ps.every(([x, y]) => !!x && !!y && eqF(mul(num(e[1]), x), y))
        const s = c.match(/^y = x ([+−]) ([\d.]+)$/)
        if (s) return ps.every(([x, y]) => !!x && !!y && eqF(s[1] === '+' ? add(x, num(s[2])) : sub(x, num(s[2])), y))
        return fail(q, `unknown equation "${c}"`)
      })
    }
    if ((m = t.match(/^A hose fills a pool at a steady rate\. How many gallons are in the pool after (\d+) minutes\?$/))) {
      const ps = pairs(q)
      const last = ps.find(([x, y]) => x && !y) ?? fail(q, 'no ?')
      if (!eqF(last[0] as F, num(m[1]))) fail(q, 'picture minutes disagree with text')
      return fillTable(q)
    }
    if ((m = t.match(/^Hose A fills a tank at the steady rate in the table\. Hose B pours ([\d.]+) gallons in ([\d.]+) minutes\. How many more gallons each minute does the faster hose pour\?$/))) {
      const a = constK(pairs(q)) ?? fail(q, 'Hose A not steady')
      return out(absF(sub(a, dv(num(m[1]), num(m[2])))))
    }
    return fail(q)
  },

  'g7m1-t3': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const onlyPoint = () => {
      const pts = (q.picture?.points ?? []).filter((p: any) => p.x !== 0)
      if (pts.length !== 1 || q.picture.lines?.[0]?.a?.[0] !== 0 || q.picture.lines[0].a[1] !== 0) fail(q, 'expected one point on a line through 0')
      return pts[0]
    }
    if ((m = t.match(/^This graph is proportional\. It goes through (?:\(0, 0\) and )?the point shown\. What is y when x = (\d+)\?$/)))
      return out(mul(kOfPoint(onlyPoint()), num(m[1])))
    if ((m = t.match(/^A proportional graph is a straight line through \(0, 0\) and \((\d+), (\d+)\)\. What is k in y = kx\?/)))
      return out(fr(+m[2], +m[1]))
    if (/^Which one is true about this graph\?$/.test(t)) {
      const ln = q.picture?.lines?.[0] ?? fail(q, 'no line')
      const through0 = ln.a[0] * (ln.b[1] - ln.a[1]) === ln.a[1] * (ln.b[0] - ln.a[0]) // (0,0) on line a–b
      const k = ln.b[0] !== ln.a[0] ? fr(ln.b[1] - ln.a[1], ln.b[0] - ln.a[0]) : null
      return pick(q, c => {
        if (/^Not proportional: it does not go through \(0, 0\)$/.test(c)) return !through0
        const e = c.match(/^Proportional: y = ([\d./]+)x$/)
        return !!e && through0 && !!k && eqF(k, num(e[1]))
      })
    }
    if (/each earn money at a steady rate\. On the graph, x is hours and y is dollars\. Line A is \w+ and line B is \w+\. How many more dollars an hour does the one who earns faster make\?$/.test(t)) {
      const pt = (tag: string) => (q.picture.points as any[]).find(p => p.label.startsWith(tag + ' ')) ?? fail(q, `no point ${tag}`)
      return out(absF(sub(kOfPoint(pt('A')), kOfPoint(pt('B')))))
    }
    return fail(q)
  },

  'g7m1-t4': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const FR = '(\\d+/\\d+|\\d+)'
    if ((m = t.match(new RegExp(`^You walk ${FR} miles? in ${FR} hours?\\. At that pace, how many miles do you walk in one hour\\?$`))))
      return out(dv(num(m[1]), num(m[2])))
    if ((m = t.match(new RegExp(`^A snail crawls ${FR} meters? in ${FR} minutes?\\. How many meters does it crawl in one minute\\?`))))
      return out(dv(num(m[1]), num(m[2])))
    if ((m = t.match(new RegExp(`^\\w+ jogs ${FR} miles? in ${FR} hours?\\. Which one finds the speed in miles per hour\\?$`)))) {
      const mi = num(m[1]), h = num(m[2])
      return pick(q, c => {
        const e = c.match(new RegExp(`^${FR} ([÷×]) ${FR} = ${FR}$`)) ?? fail(q, `bad choice "${c}"`)
        const a = num(e[1]), b = num(e[3]), r = num(e[4])
        const valueRight = eqF(e[2] === '÷' ? dv(a, b) : mul(a, b), r)
        return valueRight && e[2] === '÷' && eqF(a, mi) && eqF(b, h) && eqF(r, dv(mi, h))
      })
    }
    if ((m = t.match(new RegExp(`^\\w+ paints ${FR} of a fence in ${FR} hours?\\. At that pace, how many hours does the whole fence take\\?`))))
      return out(dv(num(m[2]), num(m[1])))
    if ((m = t.match(new RegExp(`^\\w+ walks ${FR} miles? in ${FR} hours?\\. \\w+ walks ${FR} miles? in ${FR} hours?\\. How many more miles per hour does the faster walker go\\?`))))
      return out(absF(sub(dv(num(m[1]), num(m[2])), dv(num(m[3]), num(m[4])))))
    return fail(q)
  },

  'g7m1-t5': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if (/^The two columns are equal ratios\. What number goes where the \? is\?$/.test(t)) return cross(q)
    if ((m = t.match(/^Solve the proportion ([\d?]+)\/([\d?]+) = ([\d?]+)\/([\d?]+)\.$/))) {
      const g = [[m[1], m[3]], [m[2], m[4]]]
      return cross({ ...q, picture: { rows: [['', ...g[0]], ['', ...g[1]]] } })
    }
    if ((m = t.match(/^On a map, (\d+) inches stands for (\d+) miles\. Two towns are (\d+) inches apart\. Which one finds how far apart they really are\?$/))) {
      const real = dv(mul(num(m[2]), num(m[3])), num(m[1]))
      return pick(q, c => {
        const e = c.match(/^(\d+) ([×+]) (\d+) = (\d+) miles$/) ?? fail(q, `bad choice "${c}"`)
        const v = e[2] === '×' ? +e[1] * +e[3] : +e[1] + +e[3]
        return v === +e[4] && eqF(num(e[4]), real)
      })
    }
    if ((m = t.match(/^A car goes (\d+) miles on (\d+) gallons of gas\. How many gallons does it need to go (\d+) miles\?$/)))
      return out(dv(mul(num(m[2]), num(m[3])), num(m[1])))
    if ((m = t.match(/^At Store A, (\d+) (.+?) cost \$([\d.]+)\. At Store B, (\d+) \2 cost \$([\d.]+)\. You need (\d+) \2\. How many dollars do you save at the cheaper store\?$/))) {
      const need = num(m[6])
      const a = mul(dv(num(m[3]), num(m[1])), need), b = mul(dv(num(m[5]), num(m[4])), need)
      return out(absF(sub(a, b)))
    }
    return fail(q)
  },

  'g7m1-t6': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    if ((m = t.match(/cost \$([\d.,]+)\. Now it costs \$([\d.,]+)\. By what percent did the price go up\?/)))
      return out(pctChange(num(m[1]), num(m[2])))
    if ((m = t.match(/^An amount drops from ([\d.,]+) to ([\d.,]+)\. What is the percent decrease\?/)))
      return out(pctChange(num(m[1]), num(m[2])))
    if ((m = t.match(/went from ([\d,]+) \w+ to ([\d,]+) \w+\. Which calculation finds the percent (increase|decrease)\?$/))) {
      const from = num(m[1]), to = num(m[2])
      if ((m[3] === 'increase') !== gt(to, from)) fail(q, 'direction word disagrees with the numbers')
      const change = absF(sub(to, from))
      return pick(q, c => {
        const e = c.match(/^(\d+) ÷ (\d+) × 100$/) ?? fail(q, `bad choice "${c}"`)
        return eqF(num(e[1]), change) && eqF(num(e[2]), from)
      })
    }
    if ((m = t.match(/(?:cost|was|had) ([\d.,]+) .*?\. Then it went (up|down) by (\d+)%\. What is the new amount\?$/))) {
      const p = pct(num(m[3]))
      return out(mul(num(m[1]), m[2] === 'up' ? add(fr(1), p) : sub(fr(1), p)))
    }
    if ((m = t.match(/^(.+?) grew from ([\d,]+) to ([\d,]+) people\. (.+?) grew from ([\d,]+) to ([\d,]+) people\. Which town grew by the greater percent\?/))) {
      const a = pctChange(num(m[2]), num(m[3])), b = pctChange(num(m[5]), num(m[6]))
      if (eqF(a, b)) fail(q, 'both towns grew by the same percent')
      return out(gt(a, b) ? a : b)
    }
    return fail(q)
  },

  'g7m1-t7': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const up = (base: F, p: string) => mul(base, add(fr(1), pct(num(p))))
    if ((m = t.match(/^A shop pays \$([\d.]+) for .+? and adds (\d+)% on top\. What is the price, in dollars\?$/)))
      return out(up(num(m[1]), m[2]))
    if ((m = t.match(/costs \$([\d.]+)\. The sales tax is (\d+)%\. Find the total with ONE multiplication\. What is the total, in dollars\?$/)))
      return out(up(num(m[1]), m[2]))
    if ((m = t.match(/^A meal costs \$([\d.]+)\. You leave an? (\d+)% tip\. Which one is what you pay in all\?$/))) {
      const total = up(num(m[1]), m[2])
      return pick(q, c => /^\$[\d.]+$/.test(c) && eqF(num(c), total))
    }
    if ((m = t.match(/^A store pays \$([\d.]+) for .+? and sells it for \$([\d.]+)\. What percent markup is that\?/)))
      return out(pctChange(num(m[1]), num(m[2])))
    if ((m = t.match(/dinner costs \$([\d.]+)\. They pay (\d+)% tax and leave an? (\d+)% tip, both on the \$([\d.]+)\. What do they pay in all, in dollars\?$/))) {
      if (!eqF(num(m[1]), num(m[4]))) fail(q, 'two different bases')
      return out(mul(num(m[1]), add(fr(1), add(pct(num(m[2])), pct(num(m[3]))))))
    }
    if ((m = t.match(/^A store pays \$([\d.]+) for .+? and adds (\d+)% on top\. Then (\d+)% sales tax is added to that price\. What is the total, in dollars\?$/)))
      return out(up(up(num(m[1]), m[2]), m[3]))
    return fail(q)
  },

  'g7m1-t8': q => {
    const t = q.text
    let m: RegExpMatchArray | null
    const err = (guess: F, real: F) => pctChange(real, guess)
    if ((m = t.match(/^You guess a jar holds ([\d,]+) .+?\. The real count is ([\d,]+)\. By what percent was your guess off\?/)))
      return out(err(num(m[1]), num(m[2])))
    if ((m = t.match(/^You measure a .+? as ([\d.]+) .+?\. It is really ([\d.]+) .+?\. What is the percent error\?/)))
      return out(err(num(m[1]), num(m[2])))
    if ((m = t.match(/^\w+ guessed ([\d,]+) people would come to a game\. The real count was ([\d,]+)\. Which one is \w+'s percent error\?$/))) {
      const e = err(num(m[1]), num(m[2]))
      return pick(q, c => /^[\d.]+%$/.test(c) && eqF(num(c), e))
    }
    if ((m = t.match(/^A rope is really ([\d.]+) feet long\. \w+'s measurement was (\d+)% too (long|short)\. What did \w+ measure, in feet\?$/))) {
      const p = pct(num(m[2]))
      return out(mul(num(m[1]), m[3] === 'long' ? add(fr(1), p) : sub(fr(1), p)))
    }
    if ((m = t.match(/^\w+ guessed ([\d,]+) for a real count of ([\d,]+)\. \w+ guessed ([\d,]+) for a real count of ([\d,]+)\. Which guess has the smaller percent error\?/))) {
      const a = err(num(m[1]), num(m[2])), b = err(num(m[3]), num(m[4]))
      if (eqF(a, b)) fail(q, 'both guesses have the same percent error')
      return out(gt(a, b) ? b : a)
    }
    return fail(q)
  },
}
