/**
 * Grade 7 · Module 3 — equivalent expressions, equations and inequalities: the practice ladders (see ../adaptive.ts).
 * Every level is a different KIND of question; numbers are picked per problem and the answer computed from them.
 * Expressions are built from their coefficients, so two choices are the same expression exactly when their coefficients
 * match — that is how no two choices can both be right. Equation choices are compared by their solutions.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

// ── Writing numbers, terms and expressions the way the lessons do ────────────────────────────────────────
/** −4, not -4. */
const N = (n: number) => (n < 0 ? `−${-n}` : String(n))
/** In brackets when negative: 3 × (−4). */
const P = (n: number) => (n < 0 ? `(${N(n)})` : String(n))
const term = (a: number, v = 'x') => (a === 1 ? v : a === -1 ? `−${v}` : `${N(a)}${v}`)
/** ax + b, written short: 3x − 12, −x + 8, 5x, 7. */
const lin = (a: number, b: number, v = 'x') =>
  a === 0 ? N(b) : b === 0 ? term(a, v) : `${term(a, v)} ${b > 0 ? '+' : '−'} ${Math.abs(b)}`
/** k(ax + b). */
const bra = (k: number, a: number, b: number) => `${k === -1 ? '−' : N(k)}(${lin(a, b)})`
const pl = (n: number, one: string, many: string) => (n === 1 ? one : many)
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))

// ── Pictures (the lesson's own shapes) ───────────────────────────────────────────────────────────────────
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const cards = (wrong: string, right: string): Picture => ({ kind: 'cards', wrong, right })
const tiles = (parts: string[]): Picture =>
  ({ kind: 'tape', rows: [{ cells: parts.map(t => /[a-z]/.test(t) ? { w: 2, text: t } : { w: 1, text: t }) }] })
const box = (outside: string, inside: string[], cells?: (string | null)[][]): Picture =>
  ({ kind: 'area', rows: [outside], cols: inside, cells, widths: inside.map(t => /[a-z]/.test(t) ? 3 : 1) })
const bal = (left: string, right: string): Picture => ({ kind: 'balance', left, right })
const sides = (rows: string[][]): Picture => ({ kind: 'table', head: ['Left side', '', 'Right side'], rows })
const groups = (n: number, q: string, brace: string, x = 'x'): Picture =>
  ({ kind: 'tape', rows: [{ cells: Array.from({ length: n }, () => [{ w: 3, text: x }, { w: 1, text: q, shade: true }]).flat(), brace }] })

// ── Choices ──────────────────────────────────────────────────────────────────────────────────────────────
/** Right first, then wrong ones by key; any wrong one with the right one's key (i.e. also right), or a key already
 *  used, is dropped. Up to three wrong ones are kept. */
function chooseBy<T>(r: Rng, right: T, wrong: T[], key: (t: T) => string, show: (t: T) => string) {
  const seen = new Set([key(right)])
  const keep: T[] = []
  for (const w of wrong) { const k = key(w); if (!seen.has(k) && keep.length < 3) { seen.add(k); keep.push(w) } }
  if (keep.length < 2) throw new Error('fewer than 3 choices')
  const choices = shuffle(r, [right, ...keep].map(show))
  return { choices, correct: choices.indexOf(show(right)) }
}
type Lin = [number, number]
/** Expressions ax + b: the same coefficients means the same expression. */
const chooseLin = (r: Rng, right: Lin, wrong: Lin[]) => chooseBy(r, right, wrong.filter(([a]) => a !== 0), ([a, b]) => `${a},${b}`, ([a, b]) => lin(a, b))
/** Bracket forms k(ax + b): compared by what they multiply out to. */
type Bra = [number, number, number]
const chooseBra = (r: Rng, right: Bra, wrong: Bra[]) =>
  chooseBy(r, right, wrong, ([k, a, b]) => `${k * a},${k * b}`, ([k, a, b]) => bra(k, a, b))
/** Plain text choices, all different. */
const choose = (r: Rng, right: string, wrong: string[]) => chooseBy(r, right, wrong, s => s, s => s)
/** Equations ax + b = c, compared by their solution. `show` writes them. */
type Eqn = { a: number; b: number; c: number; show: string }
const chooseEqn = (r: Rng, right: Eqn, wrong: Eqn[]) =>
  chooseBy(r, right, wrong.filter(e => e.a !== 0), e => String((e.c - e.b) / e.a), e => e.show)

const until = <T>(make: () => T, ok: (t: T) => boolean): T => { let t = make(); while (!ok(t)) t = make(); return t }

/** Every string a picture prints, plus each list of strings joined (a table row). */
const labels = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) out.push(v.join('')); v.forEach(x => labels(x, out)) }
  else if (v && typeof v === 'object') Object.values(v).forEach(x => labels(x, out))
  return out
}
/** Does the picture print the answer? A number anywhere in its labels, or the right choice's text. */
const shows = (p: Problem) => {
  const s = labels(p.picture), a = p.answer
  if (typeof a === 'number') return s.some(t => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(m => m.replace(/,/g, '') === String(Math.abs(a))))
  if (a && typeof a === 'object' && 'choices' in a) return s.some(t => t.includes(a.choices[a.correct]))
  return false
}
/** A level whose picture never prints its own answer: numbers that would are picked again. */
const L = (style: string, make: (r: Rng) => Problem): Level => ({
  style,
  make: r => {
    for (let i = 0; i < 300; i++) { const p = make(r); if (!shows(p)) return p }
    throw new Error(`${style}: the picture keeps showing the answer`)
  },
})

const KIDS = ['Mia', 'Leo', 'Ava', 'Ben', 'Zoe', 'Sam', 'Kai', 'Jo'] as const
const two = (r: Rng) => { const [a, b] = shuffle(r, KIDS); return [a, b] as const }

type Rel = '>' | '<' | '≥' | '≤'
const RELS: Rel[] = ['>', '<', '≥', '≤']
const flip = (o: Rel): Rel => ({ '>': '<', '<': '>', '≥': '≤', '≤': '≥' } as const)[o]
const strictness = (o: Rel): Rel => ({ '>': '≥', '≥': '>', '<': '≤', '≤': '<' } as const)[o]
const strict = (o: Rel) => o === '>' || o === '<'
const up = (o: Rel) => o === '>' || o === '≥'

// ── t1 · Combine like terms ──────────────────────────────────────────────────────────────────────────────
const T1: Level[] = [
  L('with algebra tiles, all adding', r => {
    const a = int(r, 1, 4), c = int(r, 1, 3), b = int(r, 1, 9), d = int(r, 1, 9)
    const expr = `${term(a)} + ${b} + ${term(c)} + ${d}`, right: Lin = [a + c, b + d]
    return { text: `Which is the same as ${expr}?`,
      picture: tiles([...Array(a).fill('x'), String(b), ...Array(c).fill('x'), String(d)]),
      answer: chooseLin(r, right, [[a + b + c + d, 0], [a + c + b, d], [b + d, a + c], [a + c, b]]),
      steps: [`The x parts: ${term(a)} + ${term(c)} = ${term(a + c)}.`, `The plain numbers: ${b} + ${d} = ${b + d}.`, `So it is ${lin(...right)}.`] }
  }),
  L('take-aways, bare: find the plain number part', r => {
    const a = int(r, 3, 9), c = int(r, 1, a - 1)
    const { b, d } = until(() => ({ b: int(r, 1, 15), d: int(r, 1, 15) }), ({ b, d }) => b !== d)
    const expr = r() < 0.5 ? `${term(a)} + ${b} − ${term(c)} − ${d}` : `${b} + ${term(a)} − ${d} − ${term(c)}`
    return { text: `Make ${expr} shorter. The x part is ${term(a - c)}. What is the plain number part?`,
      picture: eq(expr), answer: b - d,
      steps: [`${c === 1 ? 'A lone x means 1x. ' : ''}The x parts: ${term(a)} − ${term(c)} = ${term(a - c)}.`,
        `The plain numbers: ${b} − ${d} = ${N(b - d)}.`, `So the plain number part is ${N(b - d)}.`] }
  }),
  L('fix the mistake: an x part joined to a plain number', r => {
    const { a, b, c, d } = until(() => ({ a: int(r, 2, 6), b: int(r, 2, 9), c: int(r, 2, 5), d: int(r, 1, 9) }),
      ({ a, b, c, d }) => b !== d && a + b + c - d >= 2)
    const who = pick(r, KIDS), expr = `${term(a)} + ${b} + ${term(c)} − ${d}`, W = a + b + c - d
    const right: Lin = [a + c, b - d]
    return { text: `${who} says ${expr} is the same as ${term(W)}. Which is right?`,
      picture: cards(`${expr} = ${term(W)}`, `${expr} = ?`),
      answer: chooseLin(r, right, [[W, 0], [a + c, b + d], [a - c, b - d], [a + c + b, -d]]),
      steps: [`${who} joined x parts with plain numbers, and they never join.`,
        `The x parts: ${term(a)} + ${term(c)} = ${term(a + c)}. The plain numbers: ${b} − ${d} = ${N(b - d)}.`, `So it is ${lin(...right)}.`] }
  }),
  L('a lone x and a take-away x, bare', r => {
    const { a, b, c, d } = until(() => ({ a: int(r, 2, 7), b: int(r, 1, 9), c: int(r, 1, 12), d: int(r, 2, 6) }),
      ({ a, b, c, d }) => a - 1 - d !== 0 && c !== b)
    const expr = `${term(a)} − ${b} − x + ${c} − ${term(d)}`, A = a - 1 - d, C = c - b
    const right: Lin = [A, C]
    return { text: `Which is the same as ${expr}?`, picture: eq(expr),
      answer: chooseLin(r, right, [[a - d, C], [a - 1 + d, C], [A, b + c], [A, b - c], [a + 1 - d, C]]),
      steps: [`A lone x means 1x. The x parts: ${a} − 1 − ${d} = ${N(A)}, so that is ${term(A)}.`,
        `The plain numbers: −${b} + ${c} = ${N(C)}.`, `So it is ${lin(...right)}.`] }
  }),
  L('a story: write it shorter, then work it out', r => {
    const [x, y] = two(r)
    const { a, b, c, d } = until(() => ({ a: int(r, 2, 5), b: int(r, 2, 9), c: int(r, 2, 5), d: int(r, 1, 9) }), ({ b, d }) => b !== d)
    const v = int(r, 6, 15), k = d - b, ans = (a + c) * v + k
    return { text: `T-shirts cost x dollars each. ${x} buys ${a} and uses a ${b}-dollar coupon. ${y} buys ${c} and pays a ${d}-dollar fee. Together they pay ${term(a)} − ${b} + ${term(c)} + ${d} dollars. How many dollars is that when a T-shirt costs ${v} dollars?`,
      picture: eq(`${term(a)} − ${b} + ${term(c)} + ${d}`), answer: ans,
      steps: [`The x parts: ${term(a)} + ${term(c)} = ${term(a + c)}. The plain numbers: −${b} + ${d} = ${N(k)}.`,
        `So they pay ${lin(a + c, k)}. Put ${v} in for x: ${a + c} × ${v} ${k < 0 ? '−' : '+'} ${Math.abs(k)}.`, `So they pay ${fmt(ans)} dollars.`] }
  }),
]

// ── t2 · Expand brackets ─────────────────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  L('with an area model, a number outside', r => {
    const p = int(r, 2, 9), q = until(() => int(r, -9, 9), q => q !== 0)
    const right: Lin = [p, p * q]
    return { text: `Which is the same as ${bra(p, 1, q)}?`, picture: box(String(p), ['x', N(q)]),
      answer: chooseLin(r, right, [[p, q], [p, -p * q], [1, p * q], [p + 1, q]]),
      steps: [`Multiply ${p} by each part inside.`, `${p} × x = ${p}x, and ${p} × ${P(q)} = ${N(p * q)}.`, `So it is ${lin(...right)}.`] }
  }),
  L('a negative outside, bare', r => {
    const k = -int(r, 2, 9), a = int(r, 2, 5), b = until(() => int(r, -9, 9), b => b !== 0)
    const right: Lin = [k * a, k * b]
    return { text: `Which is the same as ${bra(k, a, b)}?`, picture: eq(bra(k, a, b)),
      answer: chooseLin(r, right, [[k * a, -k * b], [k * a, b], [-k * a, -k * b], [k + a, k * b]]),
      steps: [`Multiply ${N(k)} by each part inside.`,
        `${N(k)} × ${a}x = ${term(k * a)}, and ${N(k)} × ${P(b)} = ${N(k * b)}, because a negative times a ${b < 0 ? 'negative is positive' : 'positive is negative'}.`,
        `So it is ${lin(...right)}.`] }
  }),
  L('what went wrong?', r => {
    const k = -int(r, 2, 9), q = int(r, 2, 9), who = pick(r, KIDS)
    const reachQ = `The ${N(k)} has to multiply the ${q} too.`
    const negNeg = `${N(k)} × (−${q}) is positive, so it is +${-k * q}.`
    const xPart = `The x part should be ${-k}x.`, fine = 'Nothing. It is right.'
    if (r() < 0.5) {
      const expr = bra(k, 1, q), wrote = lin(k, q)
      return { text: `${who} writes ${expr} = ${wrote}. What went wrong?`, picture: cards(`${expr} = ${wrote}`, `${expr} = ?`),
        answer: choose(r, reachQ, [`${N(k)} × ${q} is positive, so it is +${-k * q}.`, xPart, fine]),
        steps: [`Multiply ${N(k)} by each part: ${N(k)} × x = ${term(k)}, and ${N(k)} × ${q} = ${N(k * q)}.`,
          `So ${expr} = ${lin(k, k * q)}. ${who} left the ${q} as it was.`, `So the answer is: ${reachQ}`] }
    }
    const expr = bra(k, 1, -q), wrote = lin(k, k * q)
    return { text: `${who} writes ${expr} = ${wrote}. What went wrong?`, picture: cards(`${expr} = ${wrote}`, `${expr} = ?`),
      answer: choose(r, negNeg, [reachQ, xPart, fine]),
      steps: [`Multiply ${N(k)} by each part: ${N(k)} × x = ${term(k)}, and ${N(k)} × (−${q}) = +${-k * q}.`,
        `A negative times a negative is positive, so ${expr} = ${lin(k, -k * q)}.`, `So the answer is: ${negNeg}`] }
  }),
  L('work backwards: the number outside', r => {
    const k = until(() => int(r, -9, 9), k => Math.abs(k) >= 2 && (k < 0 || r() < 0.4))
    const a = int(r, 2, 4), b = until(() => int(r, -9, 9), b => Math.abs(b) >= 2)
    return { text: `?(${lin(a, b)}) = ${lin(k * a, k * b)}. What number goes in the ?`,
      picture: box('?', [term(a), N(b)], [[term(k * a), N(k * b)]]), answer: k,
      steps: [`The ? times ${term(a)} makes ${term(k * a)}, so ? = ${N(k * a)} ÷ ${a} = ${N(k)}.`,
        `Check the other part: ${N(k)} × ${P(b)} = ${N(k * b)}. It matches.`, `So the number is ${N(k)}.`] }
  }),
  L('a story with a deal and a fee', r => {
    const { p, q, f } = until(() => ({ p: int(r, 2, 6), q: int(r, 2, 9), f: int(r, 5, 30) }), ({ p, q, f }) => f !== p * q)
    const who = pick(r, KIDS), right: Lin = [p, f - p * q]
    return { text: `A gym costs x dollars a month, and a deal takes ${q} dollars off every month. ${who} pays for ${p} months and a ${f}-dollar sign-up fee. Which shows what ${who} pays, with no parentheses?`,
      picture: eq(`${p} months of x − ${q}`, [`fee: ${f} dollars, once`]),
      answer: chooseLin(r, right, [[p, f - q], [p, -f - p * q], [1, f - p * q], [p, f + p * q]]),
      steps: [`One month costs x − ${q}, so ${p} months cost ${p}(x − ${q}) = ${p}x − ${p * q}.`,
        `The fee is paid once: ${p}x − ${p * q} + ${f}.`, `So it is ${lin(...right)}.`] }
  }),
]

// ── t3 · Factor out a common number ──────────────────────────────────────────────────────────────────────
const coprime = (r: Rng, alo: number) => until(() => ({ a: int(r, alo, 9), b: int(r, 1, 9) }), ({ a, b }) => gcd(a, b) === 1)

const T3: Level[] = [
  L('with an area model: the biggest number outside', r => {
    const g = int(r, 2, 9), { a, b } = coprime(r, 1)
    const A = g * a, B = g * b
    return { text: `What is the biggest number you can put outside the parentheses in ${term(A)} + ${B}?`,
      picture: box('?', ['?', '?'], [[term(A), String(B)]]), answer: g,
      steps: [`${A} and ${B} can both be divided by ${g} with nothing left over. Nothing bigger works.`,
        `${term(A)} + ${B} = ${bra(g, a, b)}.`, `So the number is ${g}.`] }
  }),
  L('pick the factored form, with a minus', r => {
    const g = int(r, 2, 9), { a, b } = coprime(r, 2), A = g * a, B = g * b
    const right: Bra = [g, a, -b]
    return { text: `Which is the same as ${A}x − ${B}?`, picture: eq(`${A}x − ${B}`),
      answer: chooseBra(r, right, [[g, a, -B], [g, a, b], [g, A, -b], [a, g, -b], [g, a + 1, -b]]),
      steps: [`The biggest number that divides ${A} and ${B} is ${g}.`,
        `${A}x ÷ ${g} = ${term(a)}, and ${B} ÷ ${g} = ${b}. Keep the minus sign.`, `So it is ${bra(...right)}.`] }
  }),
  L('work backwards: a missing number inside', r => {
    const g = int(r, 2, 9), { a, b } = coprime(r, 2), A = g * a, B = g * b, minus = r() < 0.5, s = minus ? '−' : '+'
    const hideX = r() < 0.5, ans = hideX ? a : b
    const shown = hideX ? `${g}(?x ${s} ${b})` : `${g}(${a}x ${s} ?)`
    return { text: `${A}x ${s} ${B} = ${shown}. What number goes in the ?`, picture: eq(`${A}x ${s} ${B} = ${shown}`), answer: ans,
      steps: [`Divide each part by ${g}.`, `${A}x ÷ ${g} = ${term(a)}, and ${B} ÷ ${g} = ${b}.`, `So the number is ${ans}.`] }
  }),
  L('finish a half-done factoring', r => {
    const g = pick(r, [4, 6, 8, 9]), h = pick(r, ({ 4: [2], 6: [2, 3], 8: [2, 4], 9: [3] } as Record<number, number[]>)[g])
    const { a, b } = coprime(r, 1), A = g * a, B = g * b, c = A / h, d = B / h, who = pick(r, KIDS)
    const right: Bra = [g, a, b]
    return { text: `${who} writes ${term(A)} + ${B} = ${bra(h, c, d)}. That is true, but ${h} is not the biggest number. Which is the same, with the biggest number outside?`,
      picture: eq(`${term(A)} + ${B} = ${bra(h, c, d)}`),
      answer: chooseBra(r, right, [[g, c, d], [g, a, d], [h, a, b], [g, c, b]]),
      steps: [`${h} is not the biggest: ${c} and ${d} can both still be divided by ${g / h}.`,
        `The biggest number that divides ${A} and ${B} is ${g}. ${term(A)} ÷ ${g} = ${term(a)}, and ${B} ÷ ${g} = ${b}.`, `So it is ${bra(...right)}.`] }
  }),
  L('a story: share into the most equal bags', r => {
    const g = int(r, 2, 9), { a, b } = until(() => coprime(r, 2), ({ a, b }) => a !== b && b >= 2)
    const A = g * a, B = g * b, packs = r() < 0.5, ans = packs ? a : b
    return { text: `A class has ${A} packs with x pencils in each, and ${B} erasers. They make as many equal gift bags as they can, with nothing left over. Every bag gets the same packs and the same erasers. How many ${packs ? 'packs' : 'erasers'} go in each bag?`,
      picture: eq(`${term(A)} + ${B}`, [`${A} packs of x pencils`, `${B} erasers`]), answer: ans,
      steps: [`The most bags is the biggest number that divides ${A} and ${B}, which is ${g}.`,
        `${term(A)} + ${B} = ${bra(g, a, b)}, so each bag gets ${a} ${pl(a, 'pack', 'packs')} and ${b} ${pl(b, 'eraser', 'erasers')}.`,
        `So each bag gets ${ans} ${packs ? pl(ans, 'pack', 'packs') : pl(ans, 'eraser', 'erasers')}.`] }
  }),
]

// ── t4 · Two-step equations ──────────────────────────────────────────────────────────────────────────────
const T4: Level[] = [
  L('with a balance', r => {
    const p = int(r, 2, 6), x = int(r, 1, 9), q = int(r, 1, 15), rr = p * x + q
    return { text: `Solve ${p}x + ${q} = ${rr}. What is x?`, picture: bal(`${p}x + ${q}`, String(rr)), answer: x,
      steps: [`Take ${q} off both sides: ${p}x = ${p * x}.`, `Divide both sides by ${p}: x = ${p * x} ÷ ${p}.`, `So x = ${x}.`] }
  }),
  L('bare, a minus or a negative answer', r => {
    const { p, x, q, minus } = until(() => ({ p: int(r, 2, 9), x: int(r, -9, 12), q: int(r, 1, 20), minus: r() < 0.5 }),
      ({ x, minus }) => x !== 0 && (minus || x < 0))
    const rr = minus ? p * x - q : p * x + q
    return { text: `Solve ${p}x ${minus ? '−' : '+'} ${q} = ${N(rr)}. What is x?`, picture: eq(`${p}x ${minus ? '−' : '+'} ${q} = ${N(rr)}`), answer: x,
      steps: [minus ? `${q} is taken away, so add ${q} to both sides: ${p}x = ${N(rr)} + ${q} = ${N(p * x)}.`
        : `Take ${q} off both sides: ${p}x = ${N(rr)} − ${q} = ${N(p * x)}.`,
      `Divide both sides by ${p}: x = ${N(p * x)} ÷ ${p}.`, `So x = ${N(x)}.`] }
  }),
  L('pick the right next line', r => {
    const p = int(r, 2, 6), x = int(r, 1, 9), q = int(r, 1, 12)
    const rr = p * x + q, right: Eqn = { a: p, b: 0, c: rr - q, show: `${p}x = ${rr - q}` }
    return { text: `You solve ${p}x + ${q} = ${rr}. Which is the right next line?`,
      picture: sides([[`${p}x + ${q}`, '=', String(rr)], ['?', '', '']]),
      answer: chooseEqn(r, right, shuffle(r, [
        { a: p, b: 0, c: rr + q, show: `${p}x = ${rr + q}` },
        { a: 1, b: q, c: rr / p, show: `x + ${q} = ${rr} ÷ ${p}` },
        { a: 1, b: 0, c: rr - q, show: `x = ${rr - q}` },
        { a: p, b: q, c: rr - q, show: `${p}x + ${q} = ${rr - q}` },
      ])),
      steps: [`The ${q} was added last, so it comes off first.`, `Take ${q} off both sides: ${rr} − ${q} = ${rr - q}.`, `So it is ${right.show}.`] }
  }),
  L('work backwards: a missing number in the equation', r => {
    const v = int(r, 2, 9), p = int(r, 2, 9), q = int(r, 1, 20), rr = p * v + q
    return { text: `x = ${v} makes ${p}x + ? = ${rr} true. What number goes in the ?`, picture: eq(`${p}x + ? = ${rr}`, [`x = ${v}`]), answer: q,
      steps: [`Put ${v} in for x: ${p} × ${v} = ${p * v}.`, `So ${p * v} + ? = ${rr}, and ? = ${rr} − ${p * v}.`, `So the number is ${q}.`] }
  }),
  L('a story that takes away each time', r => {
    const p = int(r, 2, 9), m = int(r, 2, 12), left = int(r, 5, 40), s = left + p * m
    return { text: `A tank holds ${s} liters of water. It drains ${p} liters each minute. Now it holds ${left} liters. How many minutes has it been draining?`,
      picture: { kind: 'tape', rows: [{ cells: [{ w: 6, text: `${p} each minute` }, { w: 3, text: `${left} left` }], brace: `${s} liters` }] },
      answer: m,
      steps: [`Let m be the minutes: ${s} − ${p}m = ${left}.`, `Take ${s} off both sides: −${p}m = −${p * m}. Divide both sides by −${p}.`,
        `So it has been draining for ${m} minutes.`] }
  }),
]

// ── t5 · Equations with brackets ─────────────────────────────────────────────────────────────────────────
const T5: Level[] = [
  L('with equal boxes on a tape', r => {
    const p = int(r, 2, 4), q = int(r, 1, 9), x = int(r, 1, 9), rr = p * (x + q)
    return { text: `Solve ${p}(x + ${q}) = ${rr}. What is x?`, picture: groups(p, String(q), String(rr)), answer: x,
      steps: [`Divide both sides by ${p}: x + ${q} = ${x + q}.`, `Take ${q} off both sides: x = ${x + q} − ${q}.`, `So x = ${x}.`] }
  }),
  L('bare, a minus inside', r => {
    const { p, q, x } = until(() => ({ p: int(r, 2, 9), q: int(r, 1, 9), x: int(r, -9, 15) }), ({ q, x }) => x !== 0 && x !== q)
    const rr = p * (x - q)
    return { text: `Solve ${p}(x − ${q}) = ${N(rr)}. What is x?`, picture: eq(`${p}(x − ${q}) = ${N(rr)}`), answer: x,
      steps: [`Divide both sides by ${p}: x − ${q} = ${N(x - q)}.`, `Add ${q} to both sides: x = ${N(x - q)} + ${q}.`, `So x = ${N(x)}.`] }
  }),
  L('pick a right first step', r => {
    const p = int(r, 2, 6), q = int(r, 1, 9), x = int(r, 1, 9), rr = p * (x + q)
    const divide = r() < 0.5
    const right: Eqn = divide ? { a: 1, b: q, c: x + q, show: `x + ${q} = ${x + q}` } : { a: p, b: p * q, c: rr, show: `${p}x + ${p * q} = ${rr}` }
    return { text: `Which is a right first step to solve ${p}(x + ${q}) = ${rr}?`, picture: eq(`${p}(x + ${q}) = ${rr}`),
      answer: chooseEqn(r, right, shuffle(r, [
        { a: p, b: q, c: rr, show: `${p}x + ${q} = ${rr}` },
        { a: 1, b: q, c: rr - p, show: `x + ${q} = ${rr - p}` },
        { a: 1, b: 0, c: rr / p, show: `x = ${rr / p}` },
        { a: 1, b: p * q, c: rr / p, show: `x + ${p * q} = ${rr / p}` },
        { a: p, b: 0, c: rr, show: `${p}x = ${rr}` },
      ])),
      steps: divide
        ? ['The parentheses are one group. Divide both sides by the number outside.', `${rr} ÷ ${p} = ${x + q}.`, `So it is ${right.show}.`]
        : [`Multiply out: ${p} × x = ${p}x, and ${p} × ${q} = ${p * q}, because the ${p} multiplies every part inside.`, `The right side stays ${rr}.`, `So it is ${right.show}.`] }
  }),
  L('a negative outside', r => {
    const { k, q, x } = until(() => ({ k: -int(r, 2, 6), q: int(r, -9, 9), x: int(r, -9, 12) }), ({ q, x }) => q !== 0 && x !== 0 && x + q !== 0)
    const rr = k * (x + q), inner = lin(1, q)
    return { text: `Solve ${N(k)}(${inner}) = ${N(rr)}. What is x?`, picture: eq(`${N(k)}(${inner}) = ${N(rr)}`), answer: x,
      steps: [`Divide both sides by ${N(k)}: ${inner} = ${N(rr)} ÷ (${N(k)}) = ${N(x + q)}.`,
        q > 0 ? `Take ${q} off both sides: x = ${N(x + q)} − ${q}.` : `Add ${-q} to both sides: x = ${N(x + q)} + ${-q}.`, `So x = ${N(x)}.`] }
  }),
  L('a story with equal groups', r => {
    const p = int(r, 2, 6), q = int(r, 1, 5), x = int(r, 3, 15), rr = p * (x + q)
    return { text: `${p} friends each buy a ticket and a ${q}-dollar snack. Together they pay ${rr} dollars. How many dollars is one ticket?`,
      picture: groups(p, String(q), `${rr} dollars`, 'ticket'), answer: x,
      steps: [`Let t be one ticket. Each friend pays t + ${q}, so ${p}(t + ${q}) = ${rr}.`,
        `Divide both sides by ${p}: t + ${q} = ${x + q}. Take ${q} off both sides.`, `So one ticket is ${x} dollars.`] }
  }),
]

// ── t6 · Two-step inequalities ───────────────────────────────────────────────────────────────────────────
/** px ± q (rel) r whose answer is x (rel) v. */
const ineq = (r: Rng, vlo: number, vhi: number) => {
  const p = int(r, 2, 6), v = int(r, vlo, vhi), q = int(r, 1, 15), minus = r() < 0.5, o = pick(r, RELS)
  const rr = minus ? p * v - q : p * v + q
  const lhs = `${p}x ${minus ? '−' : '+'} ${q}`
  const first = minus ? `Add ${q} to both sides: ${p}x ${o} ${N(p * v)}.` : `Take ${q} off both sides: ${p}x ${o} ${N(p * v)}.`
  return { p, v, q, minus, o, rr, lhs, text: `${lhs} ${o} ${N(rr)}`, first }
}

const T6: Level[] = [
  L('solve it, with the two sides', r => {
    const s = ineq(r, 1, 9), right = `x ${s.o} ${s.v}`
    return { text: `Solve ${s.text}. Which is the answer?`, picture: sides([[s.lhs, s.o, N(s.rr)]]),
      answer: choose(r, right, [`x ${flip(s.o)} ${s.v}`, `x ${s.o} ${s.p * s.v}`, `x ${strictness(s.o)} ${s.v}`]),
      steps: [s.first, `Divide both sides by ${s.p}: ${s.p * s.v} ÷ ${s.p} = ${s.v}, and the ${s.o} stays.`, `So it is ${right}.`] }
  }),
  L('the greatest or least whole number', r => {
    const s = ineq(r, 1, 12), less = !up(s.o)
    const ans = s.o === '<' ? s.v - 1 : s.o === '>' ? s.v + 1 : s.v
    const word = less ? 'greatest' : 'least'
    return { text: `What is the ${word} whole number that makes ${s.text} true?`, picture: eq(s.text), answer: ans,
      steps: [s.first, `Divide both sides by ${s.p}: x ${s.o} ${s.v}. ${strict(s.o) ? `The ${s.v} itself does not work.` : `The ${s.o} means ${s.v} itself works too.`}`,
        `So the ${word} whole number is ${N(ans)}.`] }
  }),
  L('how to draw every answer', r => {
    const s = ineq(r, 1, 9)
    const say = (open: boolean, right: boolean) => `${open ? 'an open' : 'a filled-in'} dot at ${s.v}, arrow to the ${right ? 'right' : 'left'}`
    const ans = say(strict(s.o), up(s.o))
    return { text: `Solve ${s.text}. How do you draw every answer on a number line?`, picture: eq(s.text),
      answer: choose(r, ans, [say(!strict(s.o), up(s.o)), say(strict(s.o), !up(s.o)), say(!strict(s.o), !up(s.o))]),
      steps: [`Solve it like an equation: x ${s.o} ${s.v}.`,
        `${strict(s.o) ? `${s.v} itself does not work, so the dot is open.` : `${s.v} itself works, so the dot is filled in.`} The numbers ${up(s.o) ? 'more' : 'less'} than ${s.v} are to the ${up(s.o) ? 'right' : 'left'}.`,
        `So it is ${ans}.`] }
  }),
  L('test numbers: which one works?', r => {
    const s = ineq(r, 4, 9), v = s.v
    const yes = s.o === '>' ? int(r, v + 1, v + 3) : s.o === '≥' ? int(r, v, v + 2) : s.o === '<' ? int(r, v - 3, v - 1) : int(r, v - 2, v)
    const no = s.o === '>' ? [v, v - 1, v - 2] : s.o === '≥' ? [v - 1, v - 2, v - 3] : s.o === '<' ? [v, v + 1, v + 2] : [v + 1, v + 2, v + 3]
    const all = [yes, ...no]
    return { text: `Which number makes ${s.text} true?`,
      picture: { kind: 'numline', min: Math.min(...all) - 1, max: Math.max(...all) + 1, ticks: Math.max(...all) - Math.min(...all) + 2 },
      answer: choose(r, String(yes), no.map(String)),
      steps: [`Solve it like an equation: x ${s.o} ${v}.`,
        `Of the four, only ${yes} is ${up(s.o) ? 'more' : 'less'} than ${v}${strict(s.o) ? '' : ` or equal to it`}.`, `So the answer is ${yes}.`] }
  }),
  L('a story: the most or the fewest', r => {
    const who = pick(r, KIDS)
    if (r() < 0.5) {
      const e = int(r, 3, 9), f = int(r, 5, 25), T = f + e * int(r, 3, 12) + int(r, 0, e - 1), k = Math.floor((T - f) / e), exact = (T - f) % e === 0
      return { text: `A gym charges a ${f}-dollar fee plus ${e} dollars for each class. ${who} can spend at most ${T} dollars. What is the greatest number of classes ${who} can take?`,
        picture: eq(`${e}c + ${f} ≤ ${T}`), answer: k,
        steps: [`Take ${f} off both sides: ${e}c ≤ ${T - f}.`,
          `Divide both sides by ${e}: c ≤ ${T - f} ÷ ${e}, which is ${exact ? `${k}, and ${k} itself is allowed` : `a bit more than ${k}. There is no part of a class`}.`,
          `So the greatest number of classes is ${k}.`] }
    }
    const e = int(r, 3, 9), s = int(r, 2, 20), T = s + e * int(r, 3, 12) + int(r, 0, e - 1), k = Math.floor((T - s) / e), exact = (T - s) % e === 0
    return { text: `${who} has ${s} dollars and saves ${e} dollars each week. ${who} wants MORE than ${T} dollars. What is the fewest number of weeks that works?`,
      picture: eq(`${e}w + ${s} > ${T}`), answer: k + 1,
      steps: [`Take ${s} off both sides: ${e}w > ${T - s}.`,
        `Divide both sides by ${e}: w > ${T - s} ÷ ${e}, which is ${exact ? `${k}. At exactly ${k} weeks there are ${T} dollars, and that is not more` : `a bit more than ${k}`}.`,
        `So the fewest number of weeks is ${k + 1}.`] }
  }),
]

// ── t7 · Flip the sign ───────────────────────────────────────────────────────────────────────────────────
const T7: Level[] = [
  L('times a negative, on a number line', r => {
    const a = int(r, -5, 4), b = int(r, a + 1, 6), k = int(r, 1, 3), A = -k * a || 0, B = -k * b || 0
    const lo = Math.min(a, B) - 1, hi = Math.max(b, A) + 1
    const right = `${N(A)} > ${N(B)}`
    return { text: `${N(a)} < ${N(b)} is true. Multiply both sides by ${N(-k)}. Which is true now?`,
      picture: { kind: 'numline', min: lo, max: hi, ticks: hi - lo, points: [{ at: a }, { at: b }] },
      answer: choose(r, right, [`${N(A)} < ${N(B)}`, `${N(A)} = ${N(B)}`]),
      steps: [`${P(a)} × ${P(-k)} = ${N(A)}, and ${P(b)} × ${P(-k)} = ${N(B)}.`, `${N(A)} sits to the right of ${N(B)} on the number line, so it is the bigger one.`, `So it is ${right}.`] }
  }),
  L('divide by a negative, bare', r => {
    const c = -int(r, 2, 9), v = until(() => int(r, -9, 9), v => v !== 0), o = pick(r, RELS), rr = c * v
    const right = `x ${flip(o)} ${N(v)}`
    return { text: `Solve ${term(c)} ${o} ${N(rr)}. Which is the answer?`, picture: eq(`${term(c)} ${o} ${N(rr)}`),
      answer: choose(r, right, [`x ${o} ${N(v)}`, `x ${flip(o)} ${N(-v)}`, `x ${o} ${N(-v)}`]),
      steps: [`Divide both sides by ${N(c)}: ${N(rr)} ÷ (${N(c)}) = ${N(v)}.`, `You divided by a negative, so ${o} flips to ${flip(o)}.`, `So it is ${right}.`] }
  }),
  L('which step flips the sign?', r => {
    const p = int(r, 2, 9), q = int(r, 1, 12), o = pick(r, RELS), rr = until(() => int(r, -20, 30), x => x !== q)
    const right = `divide both sides by −${p}`
    return { text: `You solve −${p}x + ${q} ${o} ${N(rr)}. Which step makes you flip the sign?`, picture: sides([[`−${p}x + ${q}`, o, N(rr)]]),
      answer: choose(r, right, [`take ${q} off both sides`, `add ${p} to both sides`, `multiply both sides by ${p}`]),
      steps: [`Take ${q} off both sides: −${p}x ${o} ${N(rr - q)}. Taking away does not flip the sign.`,
        `Then divide both sides by −${p}, which is a negative number.`, `So the answer is: ${right}.`] }
  }),
  L('two steps, then flip', r => {
    const p = int(r, 2, 6), q = int(r, 1, 12), v = until(() => int(r, -9, 9), v => v !== 0), o = pick(r, RELS), rr = q - p * v
    const right = `x ${flip(o)} ${N(v)}`
    return { text: `Solve ${q} − ${p}x ${o} ${N(rr)}. Which is the answer?`, picture: eq(`${q} − ${p}x ${o} ${N(rr)}`),
      answer: choose(r, right, [`x ${o} ${N(v)}`, `x ${flip(o)} ${N(-v)}`, `x ${o} ${N(-v)}`]),
      steps: [`Take ${q} off both sides: −${p}x ${o} ${N(rr - q)}. The sign stays, because you only took away.`,
        `Divide both sides by −${p}: ${N(rr - q)} ÷ (−${p}) = ${N(v)}, and ${o} flips to ${flip(o)}.`, `So it is ${right}.`] }
  }),
  L('a story: when does it first get colder?', r => {
    const s = int(r, 1, 10), p = int(r, 2, 5), h = int(r, 2, 8), c = s - p * h
    return { text: `At noon it is ${s} degrees. The temperature drops ${p} degrees each hour. After how many whole hours is it first colder than ${N(c)} ${pl(Math.abs(c), 'degree', 'degrees')}?`,
      picture: eq(`${s} − ${p}h < ${N(c)}`), answer: h + 1,
      steps: [`Take ${s} off both sides: −${p}h < ${N(c - s)}.`,
        `Divide both sides by −${p} and flip the sign: h > ${h}. At exactly ${h} hours it is ${N(c)} ${pl(Math.abs(c), 'degree', 'degrees')}, which is not colder.`,
        `So it is first colder after ${h + 1} hours.`] }
  }),
]

// ── t8 · Equation stories ────────────────────────────────────────────────────────────────────────────────
const PLANS = [
  { once: 'to join', each: 'class', eachs: 'classes', l: 'c', story: (f: number, e: number, T: number, who: string) => `A gym costs ${f} dollars to join, plus ${e} dollars for each class. ${who} paid ${T} dollars. How many classes did ${who} take?` },
  { once: 'to start', each: 'mile', eachs: 'miles', l: 'm', story: (f: number, e: number, T: number) => `A taxi charges ${f} dollars to start, plus ${e} dollars for each mile. A ride costs ${T} dollars. How many miles long was the ride?` },
  { once: 'plan', each: 'GB', eachs: 'GB', l: 'g', story: (f: number, e: number, T: number) => `A phone plan costs ${f} dollars a month, plus ${e} dollars for each GB of data. The bill is ${T} dollars. How many GB were used?` },
  { once: 'to get in', each: 'ride', eachs: 'rides', l: 'r', story: (f: number, e: number, T: number, who: string) => `A water park costs ${f} dollars to get in, plus ${e} dollars for each slide ride. ${who} paid ${T} dollars. How many rides did ${who} take?` },
] as const

const T8: Level[] = [
  L('with a tape: paid once, plus paid for each', r => {
    const k = pick(r, PLANS), f = int(r, 5, 30), e = int(r, 2, 9), n = int(r, 2, 12), T = f + e * n, who = pick(r, KIDS)
    return { text: k.story(f, e, T, who),
      picture: { kind: 'tape', rows: [{ cells: [{ w: 3, text: `${f} ${k.once}` }, { w: 6, text: `${e} for each ${k.each}` }], brace: `${T} dollars` }] },
      answer: n,
      steps: [`Let ${k.l} be the number of ${k.eachs}: ${f} + ${e}${k.l} = ${T}.`, `Take ${f} off both sides: ${e}${k.l} = ${e * n}. Then divide both sides by ${e}.`,
        `So it is ${n} ${k.eachs}.`] }
  }),
  L('which equation fits the story?', r => {
    const k = pick(r, PLANS), { f, e } = until(() => ({ f: int(r, 5, 30), e: int(r, 2, 9) }), ({ f, e }) => f !== e)
    const n = int(r, 2, 12), T = f + e * n, who = pick(r, KIDS), v = k.l
    const right: Eqn = { a: e, b: f, c: T, show: `${f} + ${e}${v} = ${T}` }
    return { text: `${k.story(f, e, T, who)} Which equation fits the story?`, picture: eq(`${v} = the number of ${k.eachs}`),
      answer: chooseEqn(r, right, shuffle(r, [
        { a: f, b: e, c: T, show: `${e} + ${f}${v} = ${T}` },
        { a: f + e, b: 0, c: T, show: `${f}${v} + ${e}${v} = ${T}` },
        { a: -e, b: f, c: T, show: `${f} − ${e}${v} = ${T}` },
        { a: e, b: 0, c: T + f, show: `${e}${v} = ${T} + ${f}` },
      ])),
      steps: [`${e} dollars is paid for each ${k.each}, so that part is ${e}${v}.`, `${f} dollars is paid once, so add it on. The total is ${T}.`, `So it is ${right.show}.`] }
  }),
  L('a story that uses some up each time', r => {
    const who = pick(r, KIDS), e = int(r, 3, 12), n = int(r, 2, 12), left = int(r, 4, 40), s = left + e * n
    const book = r() < 0.5
    const [thing, unit, units, l] = book ? ['pages', 'day', 'days', 'd'] : ['dollars', 'week', 'weeks', 'w']
    return { text: book
      ? `A book has ${s} pages. ${who} reads ${e} pages each day. Now ${left} pages are left. How many days has ${who} been reading?`
      : `${who} has ${s} dollars and spends ${e} dollars each week. Now ${who} has ${left} dollars left. How many weeks has it been?`,
      picture: { kind: 'tape', rows: [{ cells: [{ w: 6, text: `${e} each ${unit}` }, { w: 3, text: `${left} left` }], brace: `${s} ${thing}` }] },
      answer: n,
      steps: [`Let ${l} be the ${units}: ${s} − ${e}${l} = ${left}.`, `Take ${s} off both sides: −${e}${l} = −${e * n}. Divide both sides by −${e}.`,
        `So it has been ${n} ${units}.`] }
  }),
  L('two people: answer the question the story asks', r => {
    const [x, y] = two(r), m = int(r, 2, 4), k = int(r, 1, 9), v = int(r, 3, 12), ans = m * v + k, T = v + ans
    return { text: `${y} has ${k} more than ${m} times as many stickers as ${x}. Together they have ${T} stickers. How many stickers does ${y} have?`,
      picture: { kind: 'tape', rows: [{ label: x, cells: [{ w: 2, text: 'x' }] }, { label: y, cells: [...Array.from({ length: m }, () => ({ w: 2, text: 'x' })), { w: 1, text: String(k) }] }] },
      answer: ans,
      steps: [`Let x be ${x}'s stickers. ${y} has ${m}x + ${k}, so x + ${m}x + ${k} = ${T}.`,
        `Put the x parts together: ${m + 1}x + ${k} = ${T}, so ${m + 1}x = ${T - k} and x = ${v}.`,
        `The question asks about ${y}: ${m} × ${v} + ${k}, so ${y} has ${ans} stickers.`] }
  }),
  L('equal bags in a story, then the total asked for', r => {
    const p = int(r, 2, 6), q = int(r, 1, 9), x = int(r, 2, 12), T = p * (x + q), ans = p * x
    return { text: `${p} bags each hold the same number of apples and ${q} ${pl(q, 'pear', 'pears')}. There are ${T} pieces of fruit in all. How many apples are there in all?`,
      picture: { kind: 'tape', rows: [{ label: 'per bag', cells: Array.from({ length: p }, () => [{ w: 3, text: 'apples' }, { w: 1, text: String(q), shade: true }]).flat(), brace: `${T} in all` }] },
      answer: ans,
      steps: [`Let x be the apples in one bag: ${p}(x + ${q}) = ${T}.`, `Divide both sides by ${p}: x + ${q} = ${x + q}, so x = ${x}.`,
        `There are ${p} bags, so ${p} × ${x} = ${ans} apples in all.`] }
  }),
]

export const G7M3_LADDERS: Record<string, Level[]> = {
  'g7m3-t1': T1, 'g7m3-t2': T2, 'g7m3-t3': T3, 'g7m3-t4': T4,
  'g7m3-t5': T5, 'g7m3-t6': T6, 'g7m3-t7': T7, 'g7m3-t8': T8,
}
