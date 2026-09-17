// Blind answer key for g8m1's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g8m1 N`), never from the generator.
// Exact arithmetic throughout: exponents as integers, values as BigInt rationals.
type Q = { text: string; picture: any; choices?: string[] }

const fail = (q: Q, why = 'no rule'): never => { throw new Error(`g8m1 key: ${why} for "${q.text}"`) }

// ---------- superscripts ----------
const SUP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-',
}
const SUPCH = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'
function supInt(s: string): number {
  const t = [...s].map(c => { const v = SUP[c]; if (v === undefined) throw new Error(`g8m1 key: bad superscript "${s}"`); return v }).join('')
  if (!/^-?\d+$/.test(t)) throw new Error(`g8m1 key: bad superscript "${s}"`)
  return Number(t)
}

// ---------- BigInt rationals ----------
const Z = BigInt(0), ONE = BigInt(1), TWO = BigInt(2), FIVE = BigInt(5), TEN = BigInt(10)
type R = { n: bigint; d: bigint }
const abs = (a: bigint) => (a < Z ? -a : a)
function gcd(a: bigint, b: bigint): bigint { a = abs(a); b = abs(b); while (b !== Z) { const t = a % b; a = b; b = t } return a }
function rat(n: bigint, d: bigint = ONE): R {
  if (d === Z) throw new Error('g8m1 key: divide by zero')
  if (d < Z) { n = -n; d = -d }
  const g = gcd(n, d) || ONE
  return { n: n / g, d: d / g }
}
const mul = (a: R, b: R) => rat(a.n * b.n, a.d * b.d)
const dv = (a: R, b: R) => rat(a.n * b.d, a.d * b.n)
const eqR = (a: R, b: R) => a.n === b.n && a.d === b.d
function bpow(b: bigint, e: number): bigint { let r = ONE; for (let i = 0; i < e; i++) r *= b; return r }
const powR = (b: bigint, e: number): R => (e >= 0 ? rat(bpow(b, e)) : rat(ONE, bpow(b, -e)))

function parseDec(s: string): R {
  const m = s.replace(/,/g, '').replace(/−/g, '-').trim().match(/^(-?)(\d+)(?:\.(\d+))?$/)
  if (!m) throw new Error(`g8m1 key: not a number "${s}"`)
  const frac = m[3] ?? ''
  const n = BigInt(m[2] + frac)
  return rat(m[1] ? -n : n, bpow(TEN, frac.length))
}
/** Parses "1/8", "−8", "0.5". */
function parseVal(s: string): R {
  const m = s.replace(/−/g, '-').trim().match(/^(-?\d+)\/(\d+)$/)
  return m ? rat(BigInt(m[1]), BigInt(m[2])) : parseDec(s)
}
function fmtDec(r: R): string {
  let d = r.d, k = 0, twos = 0, fives = 0
  while (d % TWO === Z) { d /= TWO; twos++ }
  while (d % FIVE === Z) { d /= FIVE; fives++ }
  if (d !== ONE) throw new Error(`g8m1 key: ${r.n}/${r.d} is not a terminating decimal`)
  k = Math.max(twos, fives)
  const scaled = abs(r.n) * (bpow(TEN, k) / r.d)
  let s = scaled.toString().padStart(k + 1, '0')
  if (k) s = (s.slice(0, s.length - k) + '.' + s.slice(s.length - k)).replace(/0+$/, '').replace(/\.$/, '')
  return (r.n < Z ? '-' : '') + s
}
const fmtFrac = (r: R) => (r.d === ONE ? r.n.toString() : `${r.n}/${r.d}`)
/** k with 10^k === r, or throws. */
function log10(r: R): number {
  if (r.n <= Z) throw new Error('g8m1 key: not a power of 10')
  for (let k = -40; k <= 40; k++) if (eqR(powR(TEN, k), r)) return k
  throw new Error(`g8m1 key: ${r.n}/${r.d} is not a power of 10`)
}

function pick(q: Q, fits: (c: string) => boolean): string {
  const ok = (q.choices ?? []).filter(fits)
  if (ok.length !== 1) return fail(q, `${ok.length} choices fit ${JSON.stringify(q.choices)}`)
  return ok[0]
}
function same(q: Q, a: string, b: string, what: string): string {
  if (a !== b) fail(q, `${what} gives ${b}, text gives ${a}`)
  return a
}

// ---------- exponent expressions over one base (t1–t4) ----------
// exponent as a linear form c + x·u, where u is the one unknown "^?"
type L = { c: number; x: number }
type Tok = { t: string; n?: number; e?: L }
function tokenize(s: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === ' ') { i++; continue }
    if ('()×÷/='.includes(ch)) { out.push({ t: ch }); i++; continue }
    if (/\d/.test(ch)) {
      let j = i; while (j < s.length && /[\d,]/.test(s[j]) && !(s[j] === ',' && !/\d/.test(s[j + 1] ?? ''))) j++
      const n = Number(s.slice(i, j).replace(/,/g, ''))
      let e: L | undefined
      let k = j; while (k < s.length && SUPCH.includes(s[k])) k++
      if (k > j) e = { c: supInt(s.slice(j, k)), x: 0 }
      else if (s.slice(j, j + 2) === '^?') { e = { c: 0, x: 1 }; k = j + 2 }
      out.push({ t: 'num', n, e }); i = k; continue
    }
    if (ch === '^' && s[i + 1] === '?') { out.push({ t: 'pow?' }); i += 2; continue }
    if (SUPCH.includes(ch)) {
      let k = i; while (k < s.length && SUPCH.includes(s[k])) k++
      out.push({ t: 'pow', e: { c: supInt(s.slice(i, k)), x: 0 } }); i = k; continue
    }
    throw new Error(`g8m1 key: cannot read "${s}" at "${s.slice(i)}"`)
  }
  return out
}
function powL(a: L, b: L): L {
  if (a.x && b.x) throw new Error('g8m1 key: two unknowns')
  return { c: a.c * b.c, x: a.c * b.x + b.c * a.x }
}
/** Exponent of an expression, all in base `base`. */
function expo(s: string, base: number): L {
  const toks = tokenize(s)
  let p = 0
  const atom = (): L => {
    const tk = toks[p++]
    if (!tk) throw new Error(`g8m1 key: early end in "${s}"`)
    let e: L
    if (tk.t === '(') { e = expr(); if (toks[p++]?.t !== ')') throw new Error(`g8m1 key: unbalanced "${s}"`) }
    else if (tk.t === 'num') {
      const n = tk.n as number
      let k = -1
      for (let i = 0, v = 1; i < 60 && v <= n; i++, v *= base) if (v === n) { k = i; break }
      if (k < 0) throw new Error(`g8m1 key: ${n} is not a power of ${base} in "${s}"`)
      e = tk.e ? powL({ c: k, x: 0 }, tk.e) : { c: k, x: 0 }
      return e
    } else throw new Error(`g8m1 key: unexpected "${tk.t}" in "${s}"`)
    const nx = toks[p]
    if (nx?.t === 'pow') { p++; e = powL(e, nx.e as L) } else if (nx?.t === 'pow?') { p++; e = powL(e, { c: 0, x: 1 }) }
    return e
  }
  const expr = (): L => {
    let e = atom()
    while (toks[p] && '×÷/'.includes(toks[p].t)) {
      const op = toks[p++].t, r = atom()
      e = op === '×' ? { c: e.c + r.c, x: e.x + r.x } : { c: e.c - r.c, x: e.x - r.x }
    }
    return e
  }
  const e = expr()
  if (p !== toks.length) throw new Error(`g8m1 key: trailing tokens in "${s}"`)
  return e
}
const baseOf = (s: string) => {
  const m = s.match(/(\d+)(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]|\^\?)/)
  if (!m) throw new Error(`g8m1 key: no base in "${s}"`)
  return Number(m[1])
}
/** Solves "A = B" for the one unknown exponent. */
function solveExpo(eq: string, base = baseOf(eq)): number {
  const [a, b, ...rest] = eq.split('=')
  if (rest.length || b === undefined) throw new Error(`g8m1 key: not an equation "${eq}"`)
  const l = expo(a, base), r = expo(b, base)
  const dx = l.x - r.x
  if (!dx) throw new Error(`g8m1 key: no unknown in "${eq}"`)
  const u = (r.c - l.c) / dx
  if (!Number.isInteger(u)) throw new Error(`g8m1 key: non-whole exponent in "${eq}"`)
  return u
}
const expoValue = (s: string, base = baseOf(s)): R => {
  const e = expo(s, base)
  if (e.x) throw new Error(`g8m1 key: unknown in "${s}"`)
  return powR(BigInt(base), e.c)
}
/** When the picture is an equation with "?" in it, it must agree with the text's answer. */
function checkEqPic(q: Q, ans: string, solve: (s: string) => string): string {
  const p = q.picture
  const s: string | undefined = p?.kind === 'eq' ? p.text : p?.kind === 'cards' ? p.right : undefined
  if (s && s.includes('?') && s.includes('=')) same(q, ans, solve(s), 'the picture')
  return ans
}

function exponentRules(q: Q): string {
  const t = q.text
  let m: RegExpMatchArray | null
  const pic = (a: number) => checkEqPic(q, String(a), s => String(solveExpo(s)))
  if ((m = t.match(/^Fill in the missing exponent: (.+?)\. What number goes in place of the \?$/))) return pic(solveExpo(m[1]))
  if ((m = t.match(/^Write (.+) as (\d+) with one exponent\. What is the exponent\?$/))) return pic(solveExpo(`${m[1]} = ${m[2]}^?`, Number(m[2])))
  if ((m = t.match(/^\w+ says (.+?) = .+?, because .+ What should the exponent really be\?$/))) return pic(solveExpo(`${m[1]} = ${baseOf(m[1])}^?`))
  if ((m = t.match(/^Which is the same as (.+)\?$/))) {
    const v = expoValue(m[1])
    return pick(q, c => { const cm = c.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)$/); return !!cm && eqR(powR(BigInt(cm[1]), supInt(cm[2])), v) })
  }
  // L0 with a tape picture: "2² × 2⁴ is two 2s multiplied, then four more." / "(2²)³ is three copies of 2² multiplied." / "In 2⁴ ÷ 2³, each 2 …"
  if ((m = t.match(/^(?:In )?(.+?)(?: is |, each ).*Written as (\d+) with one exponent, what is the exponent\?$/)) && q.picture?.kind === 'tape') {
    const a = solveExpo(`${m[1]} = ${m[2]}^?`, Number(m[2]))
    const rows: any[] = q.picture.rows
    const len = (r: any) => (r.cells as any[]).length
    const top = rows.find(r => r.label === 'top'), bottom = rows.find(r => r.label === 'bottom')
    const fromPic = top && bottom ? len(top) - len(bottom) : rows.reduce((s, r) => s + len(r), 0)
    return same(q, String(a), String(fromPic), 'the tape')
  }
  // word problems
  if (/Type the exponent\.$/.test(t)) {
    const wm = t.match(/Written as (\d+) with one exponent/)
    if (!wm) return fail(q)
    const base = Number(wm[1])
    const body = t.slice(0, t.indexOf('Written as'))
    const cube = body.match(/is (\S+) \w+ on each side, so its (volume|area) is (.+?) (?:cubic|square) \w+\. .* (\S+) of these/)
    let a: number
    if (cube) {
      const side = expo(cube[1], base).c, area = expo(cube[3], base).c
      if (area !== side * (cube[2] === 'volume' ? 3 : 2)) fail(q, `${cube[2]} ${cube[3]} does not match a side of ${cube[1]}`)
      a = area + expo(cube[4], base).c
    } else {
      const toks = body.match(/\d+[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]*/g) ?? []
      const exps = toks.map(s => expo(s, base).c)
      if (/copied .* times, and all the copies together are split into/.test(body) && exps.length === 3) a = exps[0] + exps[1] - exps[2]
      else if (!/split|share|divid|piece|equal|÷/.test(body)) a = exps.reduce((s, e) => s + e, 0)
      else return fail(q, 'unknown word problem')
    }
    return pic(a)
  }
  return fail(q)
}

// ---------- scientific notation (t5–t7) ----------
type Side = { k: R; u?: 'front' | 'exp' }
function sciSide(s: string): Side {
  let k = rat(ONE), u: Side['u']
  for (const raw of s.replace(/[()]/g, '').split('×')) {
    const f = raw.trim()
    if (f === '?') { if (u) throw new Error('two unknowns'); u = 'front' }
    else if (f === '10^?') { if (u) throw new Error('two unknowns'); u = 'exp' }
    else {
      const pm = f.match(/^10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)$/)
      k = mul(k, pm ? powR(TEN, supInt(pm[1])) : parseDec(f))
    }
  }
  return { k, u }
}
function solveSci(eq: string): string {
  const [a, b, ...rest] = eq.split('=')
  if (rest.length || b === undefined) throw new Error(`g8m1 key: not an equation "${eq}"`)
  const l = sciSide(a), r = sciSide(b)
  if (!!l.u === !!r.u) throw new Error(`g8m1 key: need exactly one unknown in "${eq}"`)
  const [have, other] = l.u ? [l, r] : [r, l]
  const v = dv(other.k, have.k)
  return have.u === 'front' ? fmtDec(v) : String(log10(v))
}
const sciValue = (s: string): R => { const sd = sciSide(s); if (sd.u) throw new Error(`g8m1 key: unknown in "${s}"`); return sd.k }

function sci(q: Q): string {
  const t = q.text
  let m: RegExpMatchArray | null
  if ((m = t.match(/^Which is (.+) written in scientific notation\?$/))) {
    const v = sciValue(m[1])
    return pick(q, c => {
      const cm = c.match(/^(\d+(?:\.\d+)?) × 10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)$/)
      if (!cm) return false
      const f = parseDec(cm[1])
      const proper = f.n >= f.d && f.n < TEN * f.d
      return proper && eqR(mul(f, powR(TEN, supInt(cm[2]))), v)
    })
  }
  if ((m = t.match(/^Write (.+) as (?:an ordinary number|a decimal)\. What is it\?$/))) return fmtDec(sciValue(m[1]))
  // word problem: "has 8 × 10⁵ boxes. Each box holds 2 × 10² screws. In scientific notation, there are 1.6 × 10^? screws in all."
  if (/In scientific notation, there are/.test(t)) {
    if (!/\. Each \w+ (?:holds|gets|has)/.test(t)) return fail(q, 'unknown word problem')
    const known = t.match(/\d+(?:\.\d+)? × 10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g) ?? []
    const unk = t.match(/there are (\d+(?:\.\d+)? × 10\^\?)/)
    if (known.length !== 2 || !unk) return fail(q)
    return checkEqPic(q, solveSci(`${known.join(' × ')} = ${unk[1]}`), solveSci)
  }
  const sentence = t.replace(/^Fill in the missing exponent: /, '').split(/\.\s+/).find(s => s.includes(' = ') && s.includes('?'))
  if (!sentence || !/(?:What is the exponent\?|What is the front number\?|What number goes in place of the \?)$/.test(t)) return fail(q)
  const ans = solveSci(sentence)
  if (/front number/.test(t) === /\^\?/.test(sentence)) fail(q, 'asks for the wrong unknown')
  return checkEqPic(q, ans, solveSci)
}

// ---------- roots (t8–t9) ----------
function iroot(n: number, k: 2 | 3, q: Q): number {
  const r = Math.round(k === 2 ? Math.sqrt(n) : Math.cbrt(n))
  if (r ** k !== n) fail(q, `${n} has no whole ${k === 2 ? 'square' : 'cube'} root`)
  return r
}
const rootOf = (sym: string, n: number, q: Q) => iroot(n, sym === '∛' ? 3 : 2, q)

function roots(q: Q): string {
  const t = q.text
  let m: RegExpMatchArray | null
  if ((m = t.match(/^What is ([√∛])([\d,]+)\?$/)) || (m = t.match(/ What is ([√∛])([\d,]+) really\?$/))) return String(rootOf(m[1], Number(m[2].replace(/,/g, '')), q))
  if ((m = t.match(/^The (square|cube) root of a number is (\d+)\. What is the number\?$/))) return String(Number(m[2]) ** (m[1] === 'cube' ? 3 : 2))
  if ((m = t.match(/^A square \w+ is covered by (\d+) square tiles\. How many tiles long is each side\?$/))) return String(iroot(Number(m[1]), 2, q))
  if ((m = t.match(/^A box shaped like a cube is packed with (\d+) small cubes\. How many cubes long is each side\?$/))) return String(iroot(Number(m[1]), 3, q))
  if ((m = t.match(/^A box shaped like a cube holds (\d+) cubic (\w+)\. What is the area of one face of the box, in square \2\?$/))) return String(iroot(Number(m[1]), 3, q) ** 2)
  if ((m = t.match(/^A square \w+ has an area of (\d+) square (\w+)\. A fence goes all the way around it\. How many \2 of fence is that\?$/))) return String(4 * iroot(Number(m[1]), 2, q))
  return fail(q)
}

const isqrtFloor = (n: number) => { let r = Math.floor(Math.sqrt(n)); while (r * r > n) r--; while ((r + 1) * (r + 1) <= n) r++; return r }
function estimate(q: Q): string {
  const t = q.text
  let m: RegExpMatchArray | null
  const notSquare = (n: number) => { const f = isqrtFloor(n); if (f * f === n) fail(q, `${n} is a perfect square`); return f }
  if ((m = t.match(/Between which two whole numbers is √(\d+)\?$/))) {
    const f = notSquare(Number(m[1]))
    return pick(q, c => c === `${f} and ${f + 1}`)
  }
  if ((m = t.match(/^√(\d+) is between two whole numbers\. What is the (bigger|smaller) one\?$/))) {
    const f = notSquare(Number(m[1]))
    return String(m[2] === 'bigger' ? f + 1 : f)
  }
  if ((m = t.match(/^Which is the (greatest|least|smallest): .+\?$/))) {
    // compare squares; every value here is ≥ 0
    const sq = (c: string) => { const cm = c.match(/^√(\d+)$/); if (cm) return Number(cm[1]); if (!/^\d+$/.test(c)) return fail(q, `cannot read choice "${c}"`); return Number(c) ** 2 }
    const vals = (q.choices ?? []).map(sq)
    const best = m[1] === 'greatest' ? Math.max(...vals) : Math.min(...vals)
    return pick(q, c => sq(c) === best)
  }
  const round = (n: number) => { const f = isqrtFloor(n); return String(n > f * f + f ? f + 1 : f) } // √(f²+f) < f+½ exactly
  if ((m = t.match(/^What is √(\d+), rounded to the nearest whole number\?$/))) return round(Number(m[1]))
  if ((m = t.match(/^A square \w+ has an area of (\d+) square (\w+)\. How long is each side, rounded to the nearest whole (\w+)\?$/))) return round(Number(m[1]))
  return fail(q)
}

// ---------- zero and negative exponents (t4) ----------
function negative(q: Q): string {
  const t = q.text
  let m: RegExpMatchArray | null
  if ((m = t.match(/What is (\d+[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\? Write it as a fraction\.$/))) return fmtFrac(expoValue(m[1]))
  if ((m = t.match(/^Work out (.+)\. Write the answer as a fraction\.$/))) return fmtFrac(expoValue(m[1]))
  if ((m = t.match(/^Which is equal to (.+)\?$/))) { const v = expoValue(m[1]); return pick(q, c => eqR(parseVal(c), v)) }
  if ((m = t.match(/^(.+ = \d+\^\?)\. What is the exponent\?$/))) return String(solveExpo(m[1]))
  return fail(q)
}

export const SOLVE: Record<string, (q: Q) => string> = {
  'g8m1-t1': exponentRules,
  'g8m1-t2': exponentRules,
  'g8m1-t3': exponentRules,
  'g8m1-t4': negative,
  'g8m1-t5': sci,
  'g8m1-t6': sci,
  'g8m1-t7': sci,
  'g8m1-t8': roots,
  'g8m1-t9': estimate,
}
