// Blind answer key for g6m1's practice ladders. Written from the QUESTIONS only
// (`npx tsx scripts/ladder-questions.mts g6m1 N`), never from the generator.
// Where a picture restates the text's numbers it is checked against them; a disagreement throws.
// Choice questions evaluate EVERY choice and require exactly one to fit.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule for'): never => { throw new Error(`g6m1 key: ${why}: ${q.text}`) }

// ── exact rationals ─────────────────────────────────────────────────────────
type R = [number, number]
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const R = (n: number, d = 1): R => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g] }
const mul = (a: R, b: R) => R(a[0] * b[0], a[1] * b[1])
const div = (a: R, b: R) => { if (!b[0]) throw new Error('g6m1 key: divide by zero'); return R(a[0] * b[1], a[1] * b[0]) }
const add = (a: R, b: R) => R(a[0] * b[1] + b[0] * a[1], a[1] * b[1])
const sub = (a: R, b: R) => add(a, [-b[0], b[1]])
const cmp = (a: R, b: R) => Math.sign(a[0] * b[1] - b[0] * a[1])
const same = (a: R, b: R) => cmp(a, b) === 0
const isInt = (a: R) => a[1] === 1
/** "1,000", "$8.75", "3.5" → exact. */
function num(s: string): R {
  const t = s.replace(/[$,]/g, '')
  const m = t.match(/^(\d+)(?:\.(\d+))?$/)
  if (!m) throw new Error(`g6m1 key: cannot read number "${s}"`)
  const dec = m[2] ?? ''
  return R(+(m[1] + dec), 10 ** dec.length)
}
/** Exact decimal, or throw when it does not terminate. */
function show(a: R): string {
  if (a[0] < 0) throw new Error(`g6m1 key: negative answer ${a}`)
  let d = a[1]
  let places = 0
  while (d % 2 === 0 || d % 5 === 0) { d /= d % 2 === 0 ? 2 : 5; places++ }
  if (d !== 1) throw new Error(`g6m1 key: answer ${a[0]}/${a[1]} is not a terminating decimal`)
  const s = (a[0] / a[1]).toFixed(places)
  return places ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}
const whole = (q: Q, a: R, what: string) => (isInt(a) ? a : fail(q, `${what} is not a whole number (${a[0]}/${a[1]})`))
const N = String.raw`\$?\d[\d,]*(?:\.\d+)?`
const m = (q: Q, re: RegExp) => q.text.match(re)
const lc = (s: string) => s.toLowerCase().trim()

/** Exactly one choice satisfies `ok`. */
function one(q: Q, ok: (c: string) => boolean): string {
  const fits = (q.choices ?? fail(q, 'no choices')).filter(ok)
  if (fits.length !== 1) fail(q, `${fits.length} choices fit [${fits.join(' | ')}]`)
  return fits[0]
}

/** "x op y = z[, then x op y = z]" — every step's arithmetic must be right, and the last result must be `target`. */
function stepsReach(c: string, target: R): boolean {
  let last: R | null = null
  for (const seg of c.split(', then ')) {
    const s = seg.match(new RegExp(`^(${N}) ([×÷+−]) (${N}) = (${N})(?: [a-z ]+)?$`))
    if (!s) throw new Error(`g6m1 key: cannot read step "${seg}" in "${c}"`)
    const [a, b, z] = [num(s[1]), num(s[3]), num(s[4])]
    const got = s[2] === '×' ? mul(a, b) : s[2] === '÷' ? div(a, b) : s[2] === '+' ? add(a, b) : sub(a, b)
    if (!same(got, z)) return false
    last = z
  }
  return last !== null && same(last, target)
}

// ── picture cross-checks ────────────────────────────────────────────────────
const tapeRow = (q: Q, label: string) => {
  const rows = q.picture?.kind === 'tape' ? q.picture.rows : fail(q, 'expected a tape')
  const r = rows.find((x: any) => lc(String(x.label)) === lc(label)) ?? fail(q, `tape has no row "${label}"`)
  return r as { cells: { w: number; shade?: boolean }[] }
}
const checkTapeCount = (q: Q, label: string, n: R) => {
  const units = tapeRow(q, label).cells.reduce((s, c) => s + c.w, 0)
  if (!same(R(units), n)) fail(q, `tape row "${label}" has ${units} units, text says ${show(n)}`)
}
/** Solve a two-row ratio table from the picture alone, requiring every known column to agree. */
function tableSolve(q: Q): R {
  const p = q.picture
  if (p?.kind !== 'table' || p.rows.length !== 2) return fail(q, 'expected a two-row table')
  const [a, b] = p.rows.map((r: string[]) => r.slice(1))
  let qr = -1, qc = -1
  for (const [ri, row] of [a, b].entries()) row.forEach((v: string, ci: number) => { if (v === '?') { qr = ri; qc = ci } })
  if (qr < 0) fail(q, 'table has no ?')
  const ask = qr ? b : a, other = qr ? a : b
  let ans: R | null = null
  for (let j = 0; j < ask.length; j++) {
    if (j === qc) continue
    const got = mul(num(ask[j]), div(num(other[qc]), num(other[j])))
    if (ans && !same(ans, got)) fail(q, 'table columns are not all the same ratio')
    ans = got
  }
  return ans ?? fail(q, 'table has no known column')
}
const agree = (q: Q, text: R, pic: R) => (same(text, pic) ? text : fail(q, `text gives ${show(text)}, picture gives ${show(pic)}`))

/** "uses A u1 for (every) B u2 … how many uX go with C uY" */
function goWith(q: Q): R {
  const r = m(q, new RegExp(`(${N}) (.+?) for (?:every )?(${N}) (.+?)\\. .*?[Hh]ow many (.+?) go with (${N}) (.+?)\\?`))
  if (!r) return fail(q)
  const [A, u1, B, u2, ask, C, known] = [num(r[1]), r[2], num(r[3]), r[4], r[5], num(r[6]), r[7]]
  if (ask === u2 && known === u1) return mul(B, div(C, A))
  if (ask === u1 && known === u2) return mul(A, div(C, B))
  return fail(q, 'cannot match the units')
}

// ── units ───────────────────────────────────────────────────────────────────
const UNIT: Record<string, [string, number]> = {
  foot: ['in', 12], feet: ['in', 12], inch: ['in', 1], inches: ['in', 1], yard: ['in', 36], yards: ['in', 36],
  hour: ['min', 60], hours: ['min', 60], minute: ['min', 1], minutes: ['min', 1],
  kilometer: ['m', 1000], kilometers: ['m', 1000], meter: ['m', 1], meters: ['m', 1],
}
function convert(q: Q, v: R, from: string, to: string): R {
  const f = UNIT[from] ?? fail(q, `unknown unit ${from}`), t = UNIT[to] ?? fail(q, `unknown unit ${to}`)
  if (f[0] !== t[0]) fail(q, `cannot convert ${from} to ${to}`)
  return mul(v, R(f[1], t[1]))
}
const UNITS = Object.keys(UNIT).join('|')
/** Every "number unit" pair in a string. */
const measures = (s: string) => [...s.matchAll(new RegExp(`(${N}) (${UNITS})\\b`, 'g'))].map(x => ({ v: num(x[1]), u: x[2] }))

// ── t1 shared ───────────────────────────────────────────────────────────────
/** "has A x things for every B y things" → counts keyed by colour word. */
function forEvery(q: Q) {
  const r = m(q, new RegExp(`has (${N}) (\\w+) \\w+ for every (${N}) (\\w+) (\\w+)`)) ?? fail(q)
  return { [r[2]]: num(r[1]), [r[4]]: num(r[3]) } as Record<string, R>
}
const total = (c: Record<string, R>) => Object.values(c).reduce(add, R(0))

export const SOLVE: Record<string, (q: Q) => string> = {
  'g6m1-t1': q => {
    let r
    if ((r = m(q, /for every .*\. (\w+) \w+ are (\d+) out of every how many/))) {
      const c = forEvery(q)
      for (const k of Object.keys(c)) checkTapeCount(q, k, c[k])
      if (!same(c[lc(r[1])] ?? fail(q), num(r[2]))) fail(q, 'restated count disagrees')
      return show(total(c))
    }
    if ((r = m(q, /^There are (\d+) (\w+) \w+ and (\d+) (\w+) \w+\. What number goes where the \? is\?$/))) {
      const c: Record<string, R> = { [r[2]]: num(r[1]), [r[4]]: num(r[3]) }
      const e = String(q.picture?.text).match(/^(\w+) to (\w+) = (\S+) : (\S+)$/) ?? fail(q, 'cannot read eq')
      const [L, Rt] = [c[e[1]] ?? fail(q), c[e[2]] ?? fail(q)]
      if (e[3] === '?' && same(num(e[4]), Rt)) return show(L)
      if (e[4] === '?' && same(num(e[3]), L)) return show(Rt)
      return fail(q, 'eq disagrees with text')
    }
    if (/Which one is true\?$/.test(q.text)) {
      const c = forEvery(q)
      for (const k of Object.keys(c)) checkTapeCount(q, k, c[k])
      const all = total(c)
      return one(q, ch => {
        let x
        if ((x = ch.match(/^(\w+) \w+ are (\d+) out of every (\d+) \w+$/))) return same(c[lc(x[1])] ?? fail(q), num(x[2])) && same(num(x[3]), all)
        if ((x = ch.match(/^(\w+) to (\w+) is (\d+) : (\d+)$/))) {
          const a = c[lc(x[1])] ?? fail(q), b = c[lc(x[2])] ?? fail(q)
          return same(div(num(x[3]), num(x[4])), div(a, b))
        }
        return fail(q, `cannot read choice "${ch}"`)
      })
    }
    if ((r = m(q, /are (\d+) out of every (\d+) \w+\. The rest are \w+\. How many/))) {
      const e = String(q.picture?.text)
      if (!e.includes(`${r[1]} out of ${r[2]}`)) fail(q, 'eq disagrees with text')
      return show(sub(num(r[2]), num(r[1])))
    }
    if ((r = m(q, /has (\d+) ([^,]+), (\d+) ([^,]+?) and (\d+) (.+?)\. (.+?) (?:are (\d+) out of every how many|together are how many out of every (\d+)) \w+\?$/))) {
      const parts: Record<string, R> = { [r[2]]: num(r[1]), [r[4]]: num(r[3]), [r[6]]: num(r[5]) }
      const all = total(parts)
      const pe = String(q.picture?.text).split(' = ')[1]?.split(' : ').map(num) ?? fail(q, 'cannot read eq')
      if (pe.length !== 3 || !same(pe[0], num(r[1])) || !same(pe[1], num(r[3])) || !same(pe[2], num(r[5]))) fail(q, 'eq disagrees with text')
      if (r[8]) {
        if (!same(parts[lc(r[7])] ?? fail(q, 'unknown part'), num(r[8]))) fail(q, 'restated count disagrees')
        return show(all)
      }
      if (!same(num(r[9]), all)) fail(q, 'stated total disagrees')
      const names = lc(r[7]).split(' and ')
      return show(names.map(n => parts[n] ?? fail(q, `unknown part ${n}`)).reduce(add))
    }
    return fail(q)
  },

  'g6m1-t2': q => {
    let r
    if (/go with/.test(q.text)) return show(agree(q, goWith(q), tableSolve(q)))
    if (/^These two ratios are the same mix/.test(q.text)) {
      const e = String(q.picture?.text).match(/^(\S+) : (\S+) = (\S+) : (\S+)$/) ?? fail(q, 'cannot read eq')
      const v = e.slice(1)
      const i = v.indexOf('?')
      if (i < 0 || v.filter(x => x === '?').length !== 1) fail(q)
      const [a, b, c, d] = v.map(x => (x === '?' ? R(0) : num(x)))
      // a : b = c : d  ⇔  a·d = b·c
      const got = [() => div(mul(b, c), d), () => div(mul(a, d), c), () => div(mul(a, d), b), () => div(mul(b, c), a)][i]()
      return show(whole(q, got, 'missing term'))
    }
    if ((r = m(q, /^Which ratio is the same mix as (\d+) : (\d+)\?$/))) {
      const base = div(num(r[1]), num(r[2]))
      return one(q, ch => { const x = ch.match(/^(\d+) : (\d+)$/) ?? fail(q, `cannot read "${ch}"`); return same(div(num(x[1]), num(x[2])), base) })
    }
    if ((r = m(q, /uses (\d+) .+? for every (\d+) .+?\. Columns A, B and C should each be the same mix\. Which column is not\?$/))) {
      const p = q.picture
      const col = (h: string) => { const i = p.head.indexOf(h); return [num(p.rows[0][i]), num(p.rows[1][i])] }
      const [ra, rb] = col('Recipe')
      if (!same(ra, num(r[1])) || !same(rb, num(r[2]))) fail(q, 'recipe column disagrees with text')
      return one(q, ch => { const [x, y] = col(ch.replace('Column ', '')); return !same(div(x, y), div(ra, rb)) })
    }
    if ((r = m(q, /(?:takes|uses) (\d+) (\w+) for (\d+) (\w+)\. Keep the same plan\. How many (\w+) do (\d+) (\w+) need\?$/))) {
      if (r[5] !== r[2] || r[7] !== r[4]) fail(q, 'cannot match the units')
      return show(agree(q, whole(q, mul(num(r[1]), div(num(r[6]), num(r[3]))), r[2]), tableSolve(q)))
    }
    return fail(q)
  },

  'g6m1-t3': q => {
    let r
    if ((r = m(q, new RegExp(`of (\\d+) (.+?) costs (${N})\\. (How much does one|Which one finds the cost of one)`)))) {
      const n = num(r[1])
      if (q.picture?.kind !== 'tape' || q.picture.rows.length !== 1 || q.picture.rows[0].cells.length !== n[0]) fail(q, 'tape does not show the pack size')
      const each = div(num(r[3]), n)
      if (!isInt(mul(each, R(100)))) fail(q, 'unit price is not whole cents')
      return r[4].startsWith('How') ? show(each) : one(q, ch => stepsReach(ch, each))
    }
    if ((r = m(q, /^A \w+ \w+ (\d+) (\w+) in (\d+) (\w+)\. How many \2 does it \w+ in one \w+\?$/))) {
      const e = String(q.picture?.text)
      if (!e.startsWith(`${r[1]} ${r[2]} in ${r[3]} ${r[4]}`)) fail(q, 'eq disagrees with text')
      return show(div(num(r[1]), num(r[3])))
    }
    if ((r = m(q, new RegExp(`^Each .+? costs (${N})\\. An? \\w+ of them costs (${N})\\. How many`)))) {
      if (q.picture?.text !== `? × ${r[1]} = ${r[2]}`) fail(q, 'eq disagrees with text')
      return show(whole(q, div(num(r[2]), num(r[1])), 'count'))
    }
    if ((r = m(q, new RegExp(`^Store A sells (\\d+) .+? for (${N})\\. Store B sells (\\d+) .+? for (${N})\\. Which store has the lower price`)))) {
      const [a, b] = [div(num(r[2]), num(r[1])), div(num(r[4]), num(r[3]))]
      const rows = q.picture?.rows ?? fail(q, 'no table')
      if (rows[0][1] !== r[1] || rows[0][2] !== r[2] || rows[1][1] !== r[3] || rows[1][2] !== r[4]) fail(q, 'table disagrees with text')
      const want = cmp(a, b) < 0 ? 'Store A' : cmp(a, b) > 0 ? 'Store B' : 'They cost the same'
      return one(q, ch => ch === want)
    }
    return fail(q)
  },

  'g6m1-t4': q => {
    let r
    // "N things cost $P." — every level but the rate one starts like this
    const head = q.text.match(new RegExp(`^(\\d+) (.+?) cost (${N})\\.`))
    const tapeOk = () => {
      const n = head ? +head[1] : 0
      if (q.picture?.kind !== 'tape' || q.picture.rows[0].cells.length !== n) fail(q, 'tape does not show the count')
    }
    if (head) {
      const [n, P] = [num(head[1]), num(head[3])]
      const each = div(P, n)
      const cents = (x: R) => (isInt(mul(x, R(100))) ? x : fail(q, 'not whole cents'))
      if ((r = m(q, /How much do (\d+) \w+ cost\?$/))) { tapeOk(); return show(cents(mul(each, num(r[1])))) }
      if ((r = m(q, /Which way finds the cost of (\d+) \w+\?$/))) { tapeOk(); const t = mul(each, num(r[1])); return one(q, ch => stepsReach(ch, t)) }
      if ((r = m(q, new RegExp(`How many .+? can you buy with (${N})\\?$`)))) { tapeOk(); return show(whole(q, div(num(r[1]), each), 'count')) }
      if ((r = m(q, new RegExp(`buys (\\d+) \\w+ and pays with (${N})\\. How much change`)))) {
        const e = q.picture
        if (e?.kind !== 'eq' || !String(e.text).endsWith(`cost ${head[3]}`) || e.lines?.[0] !== `buy ${r[1]} ${String(e.text).split(' ')[1]}` || e.lines?.[1] !== `pay with ${r[2]}`) fail(q, 'eq disagrees with text')
        return show(cents(sub(num(r[2]), cents(mul(each, num(r[1]))))))
      }
      return fail(q)
    }
    if ((r = m(q, /^A \w+ \w+ (\d+) (\w+) in (\d+) (\w+)\. How many \2 does it \w+ in (\d+) \4\?$/)))
      return show(mul(num(r[1]), div(num(r[5]), num(r[3]))))
    if ((r = m(q, /uses (\d+) gallons of gas to drive (\d+) miles\. How far can it drive on (\d+) gallons\?$/)))
      return show(mul(num(r[2]), div(num(r[3]), num(r[1]))))
    return fail(q)
  },

  'g6m1-t5': q => {
    let r
    if (/go with/.test(q.text)) return show(agree(q, goWith(q), tableSolve(q)))
    if (/Which pair could go in a new column\?$/.test(q.text)) {
      const rows: string[][] = q.picture.rows
      const key = (label: string) => lc(label.split(' ')[0])
      const ratio: Record<string, R> = { [key(rows[0][0])]: num(rows[0][1]), [key(rows[1][0])]: num(rows[1][1]) }
      for (let j = 2; j < rows[0].length; j++) if (!same(div(num(rows[0][j]), num(rows[1][j])), div(ratio[key(rows[0][0])], ratio[key(rows[1][0])]))) fail(q, 'table columns differ')
      return one(q, ch => {
        const x = ch.match(/^(\d+) (?:cups of )?(\w+) and (\d+) (?:cups of )?(\w+)$/) ?? fail(q, `cannot read "${ch}"`)
        const [a, b] = [ratio[x[2]] ?? fail(q, `unknown ${x[2]}`), ratio[x[4]] ?? fail(q, `unknown ${x[4]}`)]
        return same(div(num(x[1]), num(x[3])), div(a, b))
      })
    }
    if ((r = m(q, /uses (\d+) (.+?) for every (\d+) (.+?)\. \w+ uses (\d+) \2 and (\d+) \4\. Compared with the (\w+), (?:is|are) there too (?:much|many) (\w+), too (?:little|few) \8, or the right amount\?$/))) {
      // "compared with" must name the first ingredient, the verdict is about the second
      if (r[7] !== r[2].split(' ').pop() || r[8] !== r[4].split(' ').pop()) fail(q, 'compared-with names the wrong ingredient')
      const want = mul(num(r[3]), div(num(r[5]), num(r[1])))
      const t = q.picture.rows
      if (t[0][1] !== r[1] || t[0][2] !== r[5] || t[1][1] !== r[3] || t[1][2] !== r[6]) fail(q, 'table disagrees with text')
      const c = cmp(num(r[6]), want)
      const noun = r[8]
      return one(q, ch => (c === 0 ? ch === 'The right amount' : c > 0 ? new RegExp(`^Too (much|many) ${noun}$`).test(ch) : new RegExp(`^Too (little|few) ${noun}$`).test(ch)))
    }
    return fail(q)
  },

  'g6m1-t6': q => {
    let r
    const pair = m(q, /has (\d+) (\w+) for every (\d+) (\w+)\./)
    if (pair) {
      const c: Record<string, R> = { [pair[2]]: num(pair[1]), [pair[4]]: num(pair[3]) }
      const all = total(c)
      const tapeCheck = () => { for (const k of Object.keys(c)) checkTapeCount(q, k, c[k]) }
      if ((r = m(q, /There are (\d+) .+ in all\. How many (\w+) are there\?$/))) {
        tapeCheck()
        const shaded = q.picture.rows.filter((x: any) => x.cells.every((y: any) => y.shade)).map((x: any) => lc(x.label))
        if (shaded.join() !== r[2]) fail(q, `tape shades ${shaded} but asks ${r[2]}`)
        return show(whole(q, mul(div(num(r[1]), all), c[r[2]] ?? fail(q)), 'count'))
      }
      if ((r = m(q, /There are (\d+) [^.]+\. Which way finds the number of (\w+)\?$/))) {
        const t = mul(div(num(r[1]), all), c[r[2]] ?? fail(q))
        return one(q, ch => stepsReach(ch, t))
      }
      if ((r = m(q, /There are (\d+) (\w+)\. How many .+ in all\?$/))) {
        tapeCheck()
        return show(whole(q, mul(div(num(r[1]), c[r[2]] ?? fail(q)), all), 'count'))
      }
      if ((r = m(q, /There are (\d+) more (\w+) than (\w+)\. How many .+ in all\?$/))) {
        const diff = sub(c[r[2]] ?? fail(q), c[r[3]] ?? fail(q))
        if (diff[0] <= 0) fail(q, 'the "more" group is not bigger')
        return show(whole(q, mul(div(num(r[1]), diff), all), 'count'))
      }
      return fail(q)
    }
    if ((r = m(q, /mixed (\d+) parts? ([^,]+), (\d+) parts? (.+?) and (\d+) parts? (.+?)\. You mix (\d+) cups\. How many cups of (.+?) do you use\?$/))) {
      const c: Record<string, R> = { [r[2]]: num(r[1]), [r[4]]: num(r[3]), [r[6]]: num(r[5]) }
      for (const k of Object.keys(c)) checkTapeCount(q, k, c[k])
      return show(whole(q, mul(div(num(r[7]), total(c)), c[r[8]] ?? fail(q, 'unknown part')), 'cups'))
    }
    return fail(q)
  },

  'g6m1-t7': q => {
    let r
    const ms = measures(q.text)
    if ((r = m(q, /^A [\w ]+ is (\S+) (\w+) long\. 1 (\w+) is (\S+) (\w+)\. How many (\w+) long/))) {
      const stated = convert(q, R(1), r[3], r[5])
      if (!same(stated, num(r[4]))) fail(q, 'stated unit fact is wrong')
      return show(agree(q, convert(q, num(r[1]), r[2], r[6]), tableSolve(q)))
    }
    if ((r = m(q, /^A [\w ]+ is (\S+) (\w+) long\. How many (\w+) long is it\?$/))) {
      const v = convert(q, num(r[1]), r[2], r[3])
      return show(q.picture?.kind === 'table' ? agree(q, v, tableSolve(q)) : v)
    }
    if ((r = m(q, /^Change (\S+) (\w+) to (\w+)\. Which one is right\?$/))) {
      const t = convert(q, num(r[1]), r[2], r[3])
      return one(q, ch => stepsReach(ch, t))
    }
    if (/left\?$/.test(q.text) && ms.length === 2) {
      const ask = (m(q, /How many (\w+) of/) ?? fail(q))[1]
      if (ask !== ms[1].u) fail(q, 'asked unit is not the used unit')
      return show(sub(convert(q, ms[0].v, ms[0].u, ask), ms[1].v))
    }
    return fail(q)
  },

  'g6m1-t8': q => {
    let r
    if ((r = m(q, /^A car goes (\d+) miles in (\d+) hours\. A bus goes (\d+) miles in (\d+) hours\. Which one is faster\?$/))) {
      const t = q.picture.rows
      if (t[0][1] !== r[1] || t[0][2] !== r[2] || t[1][1] !== r[3] || t[1][2] !== r[4]) fail(q, 'table disagrees with text')
      const c = cmp(div(num(r[1]), num(r[2])), div(num(r[3]), num(r[4])))
      const want = c > 0 ? 'The car' : c < 0 ? 'The bus' : 'They go the same speed'
      return one(q, ch => ch === want)
    }
    if ((r = m(q, /^A \w+ \w+ (\S+) (miles|kilometers) in (\S+) hours\. (How many \2 does it go in one hour|What is its speed in \2 per hour|Which one finds its speed)\?$/))) {
      const p = q.picture
      if (p?.kind === 'numline') {
        // every tick is labelled with its time; the last label must be the trip's hours
        const labels: string[] = p.labels
        const hr = (l: string) => { const x = l.match(/^(\d*)(½?) hr$/) ?? fail(q, `cannot read tick "${l}"`); return add(R(+(x[1] || 0)), R(x[2] ? 1 : 0, 2)) }
        if (!Array.isArray(labels) || labels.length !== p.ticks + 1) fail(q, 'tick labels do not match tick count')
        if (!same(hr(labels[labels.length - 1]), num(r[3]))) fail(q, 'last tick label disagrees with the hours')
        const step = sub(hr(labels[1]), hr(labels[0]))
        labels.forEach((l, i) => { if (!same(hr(l), mul(step, R(i)))) fail(q, `tick "${l}" is out of step`) })
      }
      if (p?.kind === 'eq' && !String(p.text).startsWith(`${r[1]} ${r[2]} in ${r[3]} hours`)) fail(q, 'eq disagrees with text')
      const v = div(num(r[1]), num(r[3]))
      return r[4].startsWith('Which') ? one(q, ch => stepsReach(ch, v)) : show(v)
    }
    return fail(q)
  },
}
