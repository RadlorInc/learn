// Blind answer key for g6m5's practice ladders — written from the printed questions
// (`npx tsx scripts/ladder-questions.mts g6m5 N`), never from the generator.
// Every value is computed from the question's own words; choices are evaluated, and a question where
// zero or two choices fit throws. Where a picture restates the question (an `eq` line, a power), it is
// cross-checked and a disagreement throws — a picture that disagrees with its text is a defect.
type Q = { text: string; picture: any; choices?: string[] }

const err = (q: Q, why: string): never => { throw new Error(`g6m5 key: ${why} in "${q.text}"`) }
const m = (q: Q, re: RegExp): RegExpMatchArray => q.text.match(re) ?? err(q, `no match for ${re}`)
const num = (x: number, q: Q): string => (Number.isInteger(x) ? String(x) : err(q, `non-whole answer ${x}`))

// ── a tiny expression evaluator: numbers, one-letter variables, + − × ÷, ( ), ²³… and ^, implied × ──
const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }
function ev(src: string, vars: Record<string, number> = {}): number {
  const s = src.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, t => '^' + [...t].map(c => SUP[c]).join(''))
    .replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/')
  const toks = s.match(/\d+|[a-z]|[-+*/^()]/g) ?? []
  if (toks.join('') !== s.replace(/\s+/g, '')) throw new Error(`bad expression "${src}"`)
  // implied multiplication: 3n, 2(x + 1), (a)(b), n(…)
  const t: string[] = []
  for (const k of toks) {
    const p = t[t.length - 1]
    if (p !== undefined && /^(\d+|[a-z]|\))$/.test(p) && /^([a-z]|\()$/.test(k)) t.push('*')
    t.push(k)
  }
  let i = 0
  const atom = (): number => {
    const k = t[i++]
    if (k === '(') { const v = sum(); if (t[i++] !== ')') throw new Error(`unbalanced "${src}"`); return v }
    if (k === '-') return -pow()
    if (k !== undefined && /^\d+$/.test(k)) return +k
    if (k !== undefined && /^[a-z]$/.test(k)) {
      if (!(k in vars)) throw new Error(`no value for ${k} in "${src}"`)
      return vars[k]
    }
    throw new Error(`bad token ${k} in "${src}"`)
  }
  const pow = (): number => { const b = atom(); return t[i] === '^' ? (i++, b ** pow()) : b }
  const prod = (): number => {
    let v = pow()
    while (t[i] === '*' || t[i] === '/') { const o = t[i++]; const r = pow(); v = o === '*' ? v * r : v / r }
    return v
  }
  const sum = (): number => {
    let v = prod()
    while (t[i] === '+' || t[i] === '-') { const o = t[i++]; const r = prod(); v = o === '+' ? v + r : v - r }
    return v
  }
  const v = sum()
  if (i !== t.length) throw new Error(`trailing tokens in "${src}"`)
  return v
}

/** "n = 20" / "a = 7 and b = 6" → { n: 20 } */
const assigns = (s: string): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const a of s.matchAll(/\b([a-z]) = (\d+)/g)) out[a[1]] = +a[2]
  return out
}

/** exactly one choice satisfying `ok`, else throw */
function pick(q: Q, ok: (c: string) => boolean): string {
  const cs = q.choices ?? err(q, 'no choices')
  const hits = cs.filter(c => { try { return ok(c) } catch { return false } })
  if (hits.length !== 1) err(q, `${hits.length} choices fit (${hits.join(' | ')})`)
  return hits[0]
}

/** the choice equivalent to f(v) at several values of its variable */
const pickSame = (q: Q, f: (v: number) => number) => pick(q, c => {
  const letter = c.match(/[a-z]/)?.[0] ?? 'n'
  return [2, 3, 5, 7, 11, 0.5].every(v => Math.abs(ev(c, { [letter]: v }) - f(v)) < 1e-9)
})

/** a phrase "8 more than n" / "7 less than n" / "8 times n" / "6 more than 3 times n" → f(n) */
function phrase(q: Q, p: string): (n: number) => number {
  let r = p.match(/^(\d+) (more|less) than (\d+) times n$/)
  if (r) { const a = +r[1], b = +r[3]; return r[2] === 'more' ? n => b * n + a : n => b * n - a }
  r = p.match(/^(\d+) (more|less) than n$/)
  if (r) { const a = +r[1]; return r[2] === 'more' ? n => n + a : n => n - a }
  r = p.match(/^(\d+) times n$/)
  if (r) { const a = +r[1]; return n => a * n }
  return err(q, `unknown phrase "${p}"`)
}

/** "Solve 27 + x = 39" — linear in x */
function solveX(q: Q, eqn: string): number {
  const [l, r] = eqn.split('=')
  if (r === undefined) err(q, 'no equation')
  const f = (x: number) => ev(l, { x }) - ev(r, { x })
  const x = -f(0) / (f(1) - f(0))
  if (Math.abs(f(x)) > 1e-9 || Math.abs(f(x + 1) - f(x) - (f(1) - f(0))) > 1e-9) err(q, 'not linear')
  return x
}

/** picture `eq` text, cross-checked against a value */
const checkPic = (q: Q, v: number) => {
  if (q.picture?.kind === 'eq' && Math.abs(ev(q.picture.text) - v) > 1e-9) err(q, `picture ${q.picture.text} ≠ ${v}`)
}

// ── inequalities ────────────────────────────────────────────────────────────────────────────────
type Ineq = { op: string; v: number }
const holds = ({ op, v }: Ineq, x: number) => (op === '>' ? x > v : op === '≥' ? x >= v : op === '<' ? x < v : x <= v)
/** "open dot at 2, arrow right" → the inequality it draws */
const lineIneq = (c: string): Ineq => {
  const r = c.match(/^(open|filled) dot at (\d+), arrow (left|right)$/)
  if (!r) throw new Error(`bad line choice "${c}"`)
  const open = r[1] === 'open', right = r[3] === 'right'
  return { op: right ? (open ? '>' : '≥') : open ? '<' : '≤', v: +r[2] }
}
const sameIneq = (a: Ineq, b: Ineq) => a.op === b.op && a.v === b.v

export const SOLVE: Record<string, (q: Q) => string> = {
  'g6m5-t1': q => {
    if (/What does n stand for\?/.test(q.text)) {
      const r = m(q, /^A (\w+) holds n (\w+)\./)
      return pick(q, c => c === `how many ${r[2]} are in the ${r[1]}`)
    }
    const r = q.text.match(/^(\w+) has (.+?) stickers\. (\w+) has (.+?) stickers\. When n = (\d+), how many more stickers does (\w+) have than (\w+)\?$/)
    if (r) {
      const e: Record<string, string> = { [r[1]]: r[2], [r[3]]: r[4] }
      if (!(r[6] in e) || !(r[7] in e) || r[6] === r[7]) err(q, 'names')
      return num(ev(e[r[6]], { n: +r[5] }) - ev(e[r[7]], { n: +r[5] }), q)
    }
    let e = q.text.match(/so you have (.+?) \w+\. How many/)?.[1] ?? q.text.match(/That is (.+?)\. How many/)?.[1]
      ?? q.text.match(/^What is (.+?) when/)?.[1]
    if (!e) return err(q, 'no rule')
    const loose = q.text.match(/You have two \w+ with n \w+ in each, and (\d+) loose/)
    if (loose && ev(e, { n: 3 }) !== 6 + +loose[1]) err(q, 'story and expression disagree')
    const more = q.text.match(/You also have (\d+) more/)
    if (more && ev(e, { n: 3 }) !== 3 + +more[1]) err(q, 'story and expression disagree')
    return num(ev(e, assigns(m(q, /when (.+)\?/)[1])), q)
  },

  'g6m5-t2': q => {
    let r = q.text.match(/^(\w+) has n stickers\. (\w+) has (\d+) (more|fewer) than \1\. Which shows how many stickers \2 has\?$/)
    if (r) { const k = +r[3]; return pickSame(q, r[4] === 'more' ? n => n + k : n => n - k) }
    r = q.text.match(/"(.+?)"/)
    if (r && /^(Which shows|\w+ writes)/.test(q.text)) return pickSame(q, phrase(q, r[1]))
    r = q.text.match(/^A class has (\d+) boxes with n (\w+) in each\. Then (\d+) \2 get lost\. Which shows how many \2 are left\?$/)
    if (r) { const b = +r[1], l = +r[3]; return pickSame(q, n => b * n - l) }
    r = q.text.match(/^Tickets cost (\d+) dollars each\. The whole order also has a fee of (\d+) dollars\. Which shows the cost, in dollars, of t tickets\?$/)
    if (r) { const p = +r[1], f = +r[2]; return pickSame(q, t => p * t + f) }
    return err(q, 'no rule')
  },

  'g6m5-t3': q => {
    let r = q.text.match(/^What is (.+?) when (.+)\?$/)
    if (r) return num(ev(r[1], assigns(r[2])), q)
    r = q.text.match(/^\w+ works out (.+?) when (n = \d+)\./)
    if (r) return num(ev(r[1], assigns(r[2])), q)
    r = q.text.match(/costs (\d+) dollars to (?:start|join), plus (\d+) dollars for each (?:mile|visit)\. For m \w+ it costs (.+?) dollars\. (\w+) (?:rides|goes) (\d+) (?:miles|times) and (\w+) (?:rides|goes) (\d+) (?:miles|times)\. How many more dollars does (\w+) pay\?$/)
    if (r) {
      const start = +r[1], each = +r[2]
      if (ev(r[3], { m: 4 }) !== start + 4 * each) err(q, 'rule and expression disagree')
      const cost = (k: number) => start + each * k
      const pays: Record<string, number> = { [r[4]]: cost(+r[5]), [r[6]]: cost(+r[7]) }
      const other = r[8] === r[4] ? r[6] : r[8] === r[6] ? r[4] : err(q, 'names')
      return num(pays[r[8]] - pays[other], q)
    }
    return err(q, 'no rule')
  },

  'g6m5-t4': q => {
    let r = q.text.match(/What is (\d+[²³⁴⁵⁶⁷⁸⁹])\?$/)
    if (r) {
      const means = q.text.match(/means (.+?)\. What/)
      if (means && ev(means[1]) !== ev(r[1])) err(q, 'the "means" line disagrees')
      return num(ev(r[1]), q)
    }
    r = q.text.match(/^Which is the same as (.+)\?$/)
    if (r) { const v = ev(r[1]); return pick(q, c => ev(c) === v) }
    r = q.text.match(/^A square garden is (\d+) feet long on each side\. Its area in square feet is (.+?)\. What is/)
    if (r) { const a = +r[1] * +r[1]; if (ev(r[2]) !== a) err(q, 'power disagrees'); return num(a, q) }
    r = q.text.match(/^A store has (\d+) shelves\. Each shelf has (\d+) boxes, and each box holds (\d+) toys\. That is (.+?) toys\./)
    if (r) {
      const a = +r[1] * +r[2] * +r[3]
      if (ev(r[4]) !== a) err(q, 'power disagrees')
      const row = q.picture?.rows?.[0]
      if (row && row.map(Number).join() !== [r[1], r[2], r[3]].join()) err(q, 'table disagrees')
      return num(a, q)
    }
    r = q.text.match(/says (\d+[²³⁴⁵⁶⁷⁸⁹]) and (\d+[²³⁴⁵⁶⁷⁸⁹]) are the same/)
    if (r) return num(Math.abs(ev(r[1]) - ev(r[2])), q)
    return err(q, 'no rule')
  },

  'g6m5-t5': q => {
    let r = q.text.match(/^What is (.+)\?$/)
    if (r) return num(ev(r[1]), q)
    r = q.text.match(/^(\w+) works out (.+?) and gets (\d+)\. (\w+) gets (\d+)\. Who is right\?$/)
    if (r) {
      const v = ev(r[2]), a = +r[3] === v, b = +r[5] === v
      const want = a && b ? 'Both of them' : a ? r[1] : b ? r[4] : err(q, 'nobody is right')
      return pick(q, c => c === want)
    }
    r = q.text.match(/^Where do the parentheses go so that (.+) = (\d+)\?$/)
    if (r) {
      const bare = r[1], target = +r[2]
      return pick(q, c => c.replace(/[()]/g, '') === bare && ev(c) === target)
    }
    r = q.text.match(/^(\w+) has (\d+) stickers\. (?:He|She) buys (\d+) sheets with (\d+) stickers on each, then gives (\d+) to a friend\./)
    if (r) { const v = +r[2] + +r[3] * +r[4] - +r[5]; checkPic(q, v); return num(v, q) }
    r = q.text.match(/^(\w+) has (\d+) red beads and (\d+) blue beads\. (?:He|She) shares them equally into (\d+) bags, then adds (\d+) gold beads? to each bag\./)
    if (r) { const v = (+r[2] + +r[3]) / +r[4] + +r[5]; checkPic(q, v); return num(v, q) }
    return err(q, 'no rule')
  },

  'g6m5-t6': q => {
    let r = q.text.match(/^Which is the same as (.+)\?$/)
    if (r) { const e = r[1]; return pickSame(q, x => ev(e, { x })) }
    r = q.text.match(/^Each of (\d+) teams has x players and (\d+) coach(?:es)?\./)
    if (r) { const k = +r[1], c = +r[2]; return pickSame(q, x => k * (x + c)) }
    return err(q, 'no rule')
  },

  'g6m5-t7': q => {
    let r = q.text.match(/^Solve (.+?)\. What is x\?$/) ?? q.text.match(/^\w+ solves (.+?) and says/)
    if (r) return num(solveX(q, r[1]), q)
    r = q.text.match(/^Which value of x makes (.+) true\?$/)
    if (r) { const e = r[1]; return pick(q, c => Math.abs(solveX(q, e) - +c) < 1e-9 && /^\d+$/.test(c)) }
    r = q.text.match(/^(\w+) had x \w+\. (?:He|She) got (\d+) from a friend and (\d+) more at school\. Now (?:he|she) has (\d+)\./)
    if (r) return num(+r[4] - +r[2] - +r[3], q)
    return err(q, 'no rule')
  },

  'g6m5-t8': q => {
    let r = q.text.match(/^Solve (.+?)\. What is x\?$/) ?? q.text.match(/^\w+ solves (.+?) and says/)
    if (r) return num(solveX(q, r[1]), q)
    r = q.text.match(/^To solve (\d+)x = (\d+), what do you do to both sides\?$/)
    if (r) { const want = `divide both sides by ${r[1]}`; return pick(q, c => c === want) }
    r = q.text.match(/^(\d+) movie tickets cost (\d+) dollars in all\./) ?? q.text.match(/^(\d+) packs hold (\d+) cards in all/)
    if (r) return num(+r[2] / +r[1], q)
    r = q.text.match(/^(\d+) chairs are set out in (\d+) equal rows\./)
    if (r) return num(+r[1] / +r[2], q)
    r = q.text.match(/^(\d+) notebooks cost (\d+) dollars\. Each one costs the same\. How many dollars do (\d+) notebooks cost\?$/)
    if (r) {
      const each = +r[2] / +r[1]
      if (!Number.isInteger(each)) err(q, 'price not whole')
      return num(each * +r[3], q)
    }
    return err(q, 'no rule')
  },

  'g6m5-t9': q => {
    const ineq = (s: string): Ineq => {
      const r = s.match(/x ([<>≤≥]) (\d+)/) ?? err(q, 'no inequality')
      return { op: r[1], v: +r[2] }
    }
    let r = q.text.match(/^Which number line shows (x [<>≤≥] \d+)\?$/)
    if (r) { const w = ineq(r[1]); return pick(q, c => sameIneq(lineIneq(c), w)) }
    r = q.text.match(/^Which number is a solution of (x [<>≤≥] \d+)\?$/)
    if (r) { const w = ineq(r[1]); return pick(q, c => /^\d+$/.test(c) && holds(w, +c)) }
    if (/^Which inequality does this number line show\?$/.test(q.text)) {
      const ray = q.picture?.ray ?? err(q, 'no ray')
      const w: Ineq = { op: ray.dir === 'right' ? (ray.open ? '>' : '≥') : ray.open ? '<' : '≤', v: ray.from }
      return pick(q, c => sameIneq(ineq(c), w) && c === `x ${w.op} ${w.v}`)
    }
    r = q.text.match(/^What is the (least|greatest) whole number that makes (x [<>≤≥] \d+) true\?$/)
    if (r) {
      const w = ineq(r[2])
      if (r[1] === 'least' && (w.op === '>' || w.op === '≥')) return num(w.op === '>' ? w.v + 1 : w.v, q)
      if (r[1] === 'greatest' && (w.op === '<' || w.op === '≤')) return num(w.op === '<' ? w.v - 1 : w.v, q)
      return err(q, 'no such whole number')
    }
    const words: [RegExp, string][] = [[/at most (\d+)/, '≤'], [/at least (\d+)/, '≥'], [/less than (\d+)/, '<'], [/more than (\d+)/, '>']]
    for (const [re, op] of words) {
      const hit = q.text.match(re)
      if (hit && /Which number line shows/.test(q.text)) { const w = { op, v: +hit[1] }; return pick(q, c => sameIneq(lineIneq(c), w)) }
    }
    return err(q, 'no rule')
  },
}
