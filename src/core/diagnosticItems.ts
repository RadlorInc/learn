/**
 * Diagnostic probe items — ONE quick question per skill, used only to triage (pass/fail) during
 * the diagnostic. Lightweight and separate from the rich practice content in the chapters; a skill
 * with no generator here is treated as "can't probe → assume ok" by the engine driver.
 *
 * ⚠️⚠️ v2 — THE ANSWER SURFACE IS THE WHOLE ACCURACY STORY, AND IT WAS THE DEFECT.
 * v1 asked every skill as a 4-choice MCQ (four of them as 2-choice). Simulated against learners
 * with a planted gap, the probe named the EXACT root gap only 26–34% of the time, and told 10–38%
 * of children with a real gap that they were "at or above grade level" — because a lucky guess on
 * an ENTRY skill closes that whole branch for ever. Measured, the causes multiply:
 *   · one 4-choice item = 25% lucky pass (50% on the four 2-choice ones, two of them entries);
 *   · the fail-confirmation strike re-offers a missed skill, so a broken child gets TWO shots at
 *     the guess — p + (1−p)p, i.e. 25% → 44%, and 50% → 75%.
 * The descent logic was never the problem: driven with clean items it resolves the exact root
 * 90–98% of the time. So the fix is the INPUT, not the engine.
 *
 * **Where the answer is a number, the child types it on a pad (`input: 'num'`) — guess ≈ 0.**
 * A fraction gets two boxes (`input: 'frac'`). `input: 'pick'` survives only where the answer is
 * genuinely categorical and small (acute/right/obtuse, a quadrant, the next bead) — and those are
 * widened to 6 choices where the answer space allows. Measured after: exact root 73–89%,
 * "no gap found" 23% → 2–4%, at the same probe length. The pad is also what the chapters
 * themselves use (BuildingBlocks, CoinShop, the whole teen band), so it is not a new thing to learn
 * and it removes the eliminate-your-way-through that chapter-craft §0b forbids everywhere else.
 *
 * ⚠️ THE PAD'S EXTRA KEYS ARE A PROPERTY OF THE QUESTION TYPE, NEVER OF THE ANSWER. Deriving the
 * minus key from "the answer is negative" would put the answer's SIGN on screen before the child
 * touches anything — the printed-answer rule arriving through the keyboard. `keys` is set by the
 * generator for every draw of that type.
 *
 * Coverage: every skill in the graph that a band probe can reach, plus the leaf chapters added to
 * PROBE_SWEEP (money, time, story problems, rounding, angles, units, word problems, subtraction).
 * Correctness of the math matters — each generator returns a valid question. Runs client-side.
 */
/** A probe item.
 *  · `kind:'parent'` = a 3–5 readiness activity the PARENT does with the child, then reports the
 *    outcome (the `choices`); `passSet` is which outcomes count as "can do".
 *  · `kind:'child'` (default) = the child answers. HOW they answer is `input`:
 *      'num'  → a number pad; `answer` is the numeral to type (graded numerically, so 07 == 7)
 *      'frac' → two boxes; `answer` is "n/d"
 *      'pick' → tap one of `choices` (the default, and the only one that carries a guess rate) */
export interface DiagItem {
  prompt: string
  choices: string[]
  answer: string
  kind?: 'child' | 'parent'
  input?: 'pick' | 'num' | 'frac'
  /** Extra pad keys this QUESTION TYPE needs — set per type, never derived from the answer. */
  keys?: { neg?: boolean; dot?: boolean }
  passSet?: string[]
  visual?: DiagVisual
}

/** A picture for a probe item — DECLARATIVE (core stays React-free); drawn by features/diagnostic/DiagVisual.
 *  Only added where the words alone are abstract (a chart, a point, a fraction, an angle…); plain
 *  arithmetic stays text-only — a picture of "47 + 26" teaches nothing. */
export type DiagVisual =
  | { t: 'bars'; labels: string[]; vals: number[] }              // a bar chart to read
  | { t: 'point'; x: number; y: number }                         // a point on the coordinate plane
  | { t: 'slope'; rise: number; run: number }                    // rise-over-run staircase
  | { t: 'frac'; parts: [number, number][] }                     // 1–2 bars, each [numerator, denominator]
  | { t: 'array'; rows: number; cols: number }                   // rows × cols of unit squares
  | { t: 'angle'; deg: number }                                  // two rays + an arc
  | { t: 'rtri'; a: number; b: number; labels: [string, string, string] }  // right triangle [base, height, hyp]
  | { t: 'numline'; lo: number; hi: number; mark: number }        // a value between two landmarks

import { mulberry32 } from './rand'

// ── Phase 4 — per-child generated items ──────────────────────────────────────────────────
// A given child gets a STABLE, reproducible probe seeded from (learner, skill, attempt): re-takes
// vary by `nonce`, and the same child re-hydrates the same items. Prompts are flavored with the
// child's `name` + a `theme` (emoji set). No context passed → falls back to Math.random (legacy).
export type ItemTheme = 'stars' | 'space' | 'animals' | 'fruit' | 'sports'
export interface DiagContext { name?: string; theme?: ItemTheme; seed?: string; nonce?: number }
export const ITEM_THEMES: ItemTheme[] = ['stars', 'space', 'animals', 'fruit', 'sports']
const THEME_GLYPH: Record<ItemTheme, string> = { stars: '★', space: '🚀', animals: '🐢', fruit: '🍎', sports: '⚽' }

let _rand: () => number = Math.random
let _ctx: DiagContext | null = null
function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
/** Deterministic theme for a child when they don't have one set — varies the flavor per child. */
export function pickThemeFor(seed: string): ItemTheme { return ITEM_THEMES[hashStr(seed) % ITEM_THEMES.length] }

// ⚠️ SEEDED, and deliberately NOT `@/core/rand`. These run off `_rand` (mulberry32 keyed to the
// child + skill + attempt), which is what makes a probe reproducible for one child and different
// on a re-take. Swapping them for the shared unseeded helpers would silently destroy that.
const R = (lo: number, hi: number) => lo + Math.floor(_rand() * (hi - lo + 1))
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(_rand() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
/** ⚠️ SEEDED pick. This file used to import `pick` from `@/core/rand`, which is Math.random by
 *  design — and that file's own header says reproducible cases must not use it. Fourteen
 *  generators did, so the per-child probe was NOT reproducible: `resolve()` rebuilds the current
 *  question from the seed on a mid-probe resume, and those items came back DIFFERENT. */
const pk = <T,>(a: readonly T[]): T => a[R(0, a.length - 1)]
const glyph = () => (_ctx?.theme && THEME_GLYPH[_ctx.theme]) || '★'
const kidName = () => _ctx?.name?.trim() || 'your child'
/** Run a generator under a context: seed the RNG (if a seed is given) + expose name/theme, restore after. */
function withCtx(ctx: DiagContext | undefined, key: string, gen: () => DiagItem): DiagItem {
  const prevR = _rand, prevC = _ctx
  if (ctx) { _ctx = ctx; if (ctx.seed != null) _rand = mulberry32(hashStr(`${ctx.seed}|${key}|${ctx.nonce ?? 0}`)) }
  try { return gen() } finally { _rand = prevR; _ctx = prevC }
}
/** Build an MCQ from a correct answer + candidate distractors (deduped, valid).
 *  ⚠️ SIX, not four. `input:'pick'` is the only surface left that a child can guess, so it gets as
 *  wide an answer space as the question honestly allows — 25% → 17% where six distractors exist.
 *  A genuinely small space (acute/right/obtuse; four quadrants) simply returns what it has. */
function mc(answer: string | number, distractors: (string | number)[]): { choices: string[]; answer: string; input: 'pick' } {
  const ans = String(answer)
  const set = new Set<string>([ans])
  for (const d of distractors) { const s = String(d); if (set.size >= 6) break; if (s !== ans) set.add(s) }
  return { choices: shuffle([...set]), answer: ans, input: 'pick' }
}
/** A typed-number answer. No `choices` — nothing to eliminate, so the guess rate is ~0.
 *  `keys` is per QUESTION TYPE (see the header): pass `{neg:true}` on a type whose answer can be
 *  negative for ANY draw, never on the draws that happen to be. */
function num(answer: string | number, keys?: { neg?: boolean; dot?: boolean }): { choices: string[]; answer: string; input: 'num'; keys?: { neg?: boolean; dot?: boolean } } {
  return { choices: [], answer: String(answer), input: 'num', ...(keys ? { keys } : null) }
}
/** A fraction answer, entered as two boxes. */
function frac(n: number, d: number): { choices: string[]; answer: string; input: 'frac' } {
  return { choices: [], answer: `${n}/${d}`, input: 'frac' }
}

/** Grade a response against an item. Numbers compare NUMERICALLY (so "07" and "7.0" both pass);
 *  everything else is exact. Parent readiness items use their own `passSet`. */
export function gradeItem(item: DiagItem, response: string): boolean {
  if (item.passSet) return item.passSet.includes(response)
  if (item.input === 'num') {
    const a = Number(item.answer), b = Number(response)
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-9
  }
  return response === item.answer
}

type Gen = () => DiagItem

export const ITEM_GENERATORS: Record<string, Gen> = {
  // ── 3–5 (deep prereqs; a 9–11 kid should pass these — they exist to bound the descent) ──
  'e.counting10': () => { const n = R(3, 12); return { prompt: `${n - 2}, ${n - 1}, ${n}, ?`, ...num(n + 1) } },
  // Stays a PICK on purpose: naming the glyph IS the skill, so the glyphs have to be on screen.
  'e.numeralRecog': () => { const n = R(4, 9); return { prompt: `Tap the number ${n}.`, ...mc(n, [n + 1, n - 1, n + 2, n + 3, n - 2]) } },
  'e.matchQty': () => { const n = R(2, 10); return { prompt: `How many? ${glyph().repeat(n)}`, ...num(n) } },
  'e.compare': () => { const a = R(2, 9); let b = R(2, 9); if (b === a) b = a === 9 ? a - 1 : a + 1; return { prompt: `Which is more, ${a} or ${b}? Type it.`, ...num(Math.max(a, b)) } },
  'e.numberOrder': () => { const n = R(2, 14); return { prompt: `What comes just after ${n}?`, ...num(n + 1) } },
  'e.addWithin10': () => { const a = R(1, 5), b = R(1, 4); return { prompt: `${a} + ${b} = ?`, ...num(a + b) } },
  'e.subWithin10': () => { const a = R(5, 9), b = R(1, 4); return { prompt: `${a} − ${b} = ?`, ...num(a - b) } },
  'e.shapes2d': () => { const [name, n] = pk([['square', 4], ['triangle', 3], ['circle', 0], ['rectangle', 4], ['pentagon', 5], ['hexagon', 6], ['star', 5], ['oval', 0]] as [string, number][]); return { prompt: `How many corners does a ${name} have?`, ...num(n) } },
  // A rhythm is categorical — there is nothing to type. Four shapes is the honest answer space.
  'e.patterns': () => { const [a, b] = shuffle(['●', '▲', '■', '★']); return { prompt: `${a} ${b} ${a} ${b} ${a} — what comes next?`, ...mc(b, ['●', '▲', '■', '★'].filter(x => x !== b)) } },
  'e.measureCompare': () => { const a = R(2, 6), b = a + R(2, 5); return { prompt: `One ribbon is ${a} cm. The other is ${b} cm. How long is the LONGER one?`, ...num(b) } },

  // ── 6–8 ──
  'p.numbersTo100': () => { const n = R(31, 89); return { prompt: `What comes just after ${n}?`, ...num(n + 1) } },
  'p.placeValue2': () => { const n = R(23, 89); return { prompt: `How many tens are in ${n}?`, ...num(Math.floor(n / 10)) } },
  'p.compare100': () => { const a = R(21, 88), b = a + pk([1, -1, 10, -10, 7, -7]); return { prompt: `Which is greater, ${a} or ${b}? Type it.`, ...num(Math.max(a, b)) } },
  'p.skipCount': () => { const s = pk([2, 5, 10]), k = R(2, 5), a = s * k; return { prompt: `${a}, ${a + s}, ${a + 2 * s}, … what number comes next?`, ...num(a + 3 * s) } },
  'p.addTo100': () => { const a = R(24, 68), b = R(15, 30); return { prompt: `${a} + ${b} = ?`, ...num(a + b) } },
  'p.subTo100': () => { const a = R(52, 96), b = R(15, 39); return { prompt: `${a} − ${b} = ?`, ...num(a - b) } },
  'p.multConcept': () => { const g = R(2, 5), per = R(2, 5); return { prompt: `${g} groups of ${per} — how many altogether?`, visual: { t: 'array', rows: g, cols: per }, ...num(g * per) } },
  'p.fractionsIntro': () => { const d = pk([2, 3, 4, 5, 6, 8, 10, 12]); return { prompt: `A pizza is cut into ${d} equal parts and you take 1. What fraction is that?`, visual: { t: 'frac', parts: [[1, d]] }, ...frac(1, d) } },
  'p.shapes2d3d': () => { const [name, n] = pk([['triangle', 3], ['square', 4], ['pentagon', 5], ['hexagon', 6], ['heptagon', 7], ['octagon', 8], ['nonagon', 9], ['decagon', 10]] as [string, number][]); return { prompt: `How many sides does a ${name} have?`, ...num(n) } },
  'p.money': () => { const d = R(2, 6), c = R(1, 8); return { prompt: `You have ${d} dimes and ${c} pennies. How many cents is that?`, ...num(d * 10 + c) } },
  // No clock visual exists, so the question names the hand's position rather than drawing it —
  // which is the reading step (a number on the face is five minutes), not a picture-recognition step.
  'p.time': () => { const k = pk([2, 3, 4, 6, 7, 8, 9, 10, 11]); return { prompt: `The long hand of a clock points at ${k}. How many minutes past the hour is it?`, ...num(k * 5) } },
  'p.wordProbAddSub': () => { const a = R(24, 68), b = R(9, 19); return { prompt: `${kidName()} had ${a} stickers and gave ${b} away. How many are left?`, ...num(a - b) } },

  // ── 9–11 ──
  // Plain digits, not toLocaleString: the child types the number back, and a thousands comma is a
  // key the pad does not have (and a notation the question is not about).
  'i.bigNumbers': () => { const a = R(2, 9) * 1000 + R(0, 999); const b = a + pk([1000, -1000, 100, -100, 111, -111]); return { prompt: `Which is greater, ${a} or ${b}? Type it.`, ...num(Math.max(a, b)) } },
  // n is never a multiple of 10 — "round 30 to the nearest 10" asks nothing (and puts the number
  // line's marker on top of a landmark).
  'i.rounding': () => { const n = R(1, 8) * 10 + R(1, 9); return { prompt: `Round ${n} to the nearest 10.`, visual: { t: 'numline', lo: Math.floor(n / 10) * 10, hi: Math.floor(n / 10) * 10 + 10, mark: n }, ...num(Math.round(n / 10) * 10) } },
  'i.multFacts': () => { const a = R(4, 9), b = R(4, 9); return { prompt: `${a} × ${b} = ?`, visual: { t: 'array', rows: a, cols: b }, ...num(a * b) } },
  'i.multMultiDigit': () => { const a = R(13, 29), b = R(3, 6); return { prompt: `${a} × ${b} = ?`, ...num(a * b) } },
  'i.division': () => { const b = R(3, 9), q = R(3, 9), a = b * q; return { prompt: `${a} ÷ ${b} = ?`, ...num(q) } },
  // Was "which is a factor of 12?" — a question with SEVERAL right answers, so it could only ever
  // be asked as a pick. A greatest common factor has exactly one, so it can be typed; gcd(2g,3g) = g.
  'i.factors': () => { const g = R(2, 9); return { prompt: `What is the largest number that divides exactly into both ${2 * g} and ${3 * g}?`, ...num(g) } },
  'i.fractionEquiv': () => { const d = pk([2, 3, 4, 5]), k = pk([2, 3]); return { prompt: `Write a fraction equal to 1/${d}, using ${k * d} as the bottom number.`, visual: { t: 'frac', parts: [[1, d]] }, ...frac(k, k * d) } },
  'i.fractionOps': () => { const d = pk([4, 5, 6, 8]); const a = R(1, d - 2), b = R(1, d - 1 - a); return { prompt: `${a}/${d} + ${b}/${d} = ?`, visual: { t: 'frac', parts: [[a, d], [b, d]] }, ...frac(a + b, d) } },
  // ⚠️ The maths form, never the money form: $0.60 beside $0.55 is obviously bigger, so padding to
  // two places deletes the misconception this chapter exists for (chapter-craft §0a).
  'i.decimals': () => { const a = R(2, 8) / 10; let b = R(21, 79) / 100; if (Math.abs(a - b) < 1e-9) b = b + 0.01; const A = a.toFixed(1), B = b.toFixed(2); return { prompt: `Which is greater, ${A} or ${B}? Type it.`, ...num(a > b ? A : B, { dot: true }) } },
  'i.measureUnits': () => { const [from, to, k, u] = pk([['meters', 'centimeters', 100, 'm'], ['kilograms', 'grams', 1000, 'kg'], ['liters', 'milliliters', 1000, 'l'], ['kilometers', 'meters', 1000, 'km'], ['meters', 'millimeters', 1000, 'm']] as [string, string, number, string][]); const m = R(2, 9); return { prompt: `${m} ${from} is how many ${to}?`, ...num(m * k) } },
  'i.areaPerimeter': () => { const w = R(2, 9), h = R(2, 9); return { prompt: `A rectangle is ${w} by ${h}. What is its area?`, visual: { t: 'array', rows: h, cols: w }, ...num(w * h) } },
  /** ⚠️ WAS "acute, right or obtuse" — three choices, so a THIRD of the children who cannot do it
   *  came back right, and with a retry that becomes more than half. Asking how far the angle sits
   *  from a square corner probes the same knowledge (you cannot answer without knowing a square
   *  corner is 90°) and has no answer space to guess in. ⚠️ The 90 is deliberately NOT stated — say
   *  it and the item stops being about angles and becomes a subtraction. */
  'i.anglesSymmetry': () => { const d = pk([20, 25, 35, 40, 50, 55, 65, 70, 75, 110, 115, 125, 135, 140, 150, 160]); return { prompt: `Look at the angle. It measures ${d}°. How many degrees is that away from a square corner?`, visual: { t: 'angle', deg: d }, ...num(Math.abs(d - 90)) } },
  // "Which bar is tallest?" is answerable by looking; "how many MORE" is the reading plus the
  // comparison, and it has a number for an answer.
  /** ⚠️ THE BARS ARE DRAWN, NOT PICKED FROM A FIXED SET. This used to shuffle `[2,4,6,9]`, so the
   *  tallest minus the shortest was **always 7** — one possible answer across every draw the
   *  generator could make, which a child meets once and knows for ever, and a guesser types
   *  straight away. Found by measuring the SIZE of each item's answer space rather than by reading
   *  it: the numbers looked varied because the bars were. */
  'i.dataGraphs': () => {
    const labels = shuffle(['Red', 'Blue', 'Green', 'Gold', 'Teal', 'Plum']).slice(0, 4)
    const lo = R(1, 4), gap = R(2, 9)
    const mid = [lo + R(1, Math.max(1, gap - 1)), lo + R(1, Math.max(1, gap - 1))]
    const vals = shuffle([lo, lo + gap, ...mid])
    let hi = 0, lw = 0
    for (let i = 1; i < vals.length; i++) { if (vals[i] > vals[hi]) hi = i; if (vals[i] < vals[lw]) lw = i }
    return { prompt: `Look at the chart. How many more ${labels[hi]} than ${labels[lw]}?`, visual: { t: 'bars', labels, vals }, ...num(vals[hi] - vals[lw]) }
  },
  'i.wordProbMulti': () => { const box = R(3, 6), per = R(4, 8), give = R(3, 9); return { prompt: `${box} boxes hold ${per} pencils each. ${kidName()} gives ${give} away. How many pencils are left?`, ...num(box * per - give) } },

  // ── 12–14 (middle) ──
  'm.integers': () => { const s = new Set<number>(); while (s.size < 4) s.add(R(-9, 9)); const xs = [...s]; return { prompt: `Which is greatest:  ${xs.join(',  ')} ?`, ...num(Math.max(...xs), { neg: true }) } },
  'm.signedOps': () => { const a = pk([-1, 1]) * R(2, 9), b = pk([-1, 1]) * R(2, 9); return { prompt: `${a} + (${b}) = ?`, ...num(a + b, { neg: true }) } },
  'm.rationalOps': () => { const b = pk([2, 3, 4, 5, 6]), d = pk([2, 3, 4, 5, 7, 8].filter(x => x !== b)); return { prompt: `1/${b} × 1/${d} = ?`, ...frac(1, b * d) } },
  'm.ratioProportion': () => { const rate = R(2, 6), a = R(2, 5), b = a + R(1, 4); return { prompt: `${a} tickets cost $${rate * a}. What do ${b} tickets cost?`, ...num(rate * b) } },
  'm.exponentsRoots': () => { if (_rand() < 0.5) { const b = R(3, 12); return { prompt: `What is ${b}²?`, ...num(b * b) } } const b = R(3, 12); return { prompt: `√${b * b} = ?`, ...num(b) } },
  'm.orderOps': () => { const a = R(2, 6), b = R(2, 5), c = R(2, 5); return { prompt: `${a} + ${b} × ${c} = ?`, ...num(a + b * c) } },
  'm.algExpressions': () => { const x = R(2, 6), m = R(2, 5), b = R(1, 6); return { prompt: `If x = ${x}, what is ${m}x + ${b}?`, ...num(m * x + b) } },
  'm.equationsIneq': () => { const a = R(2, 5), x = R(2, 8), b = R(1, 9); return { prompt: `What is x?    ${a}x + ${b} = ${a * x + b}`, ...num(x) } },
  /** ⚠️ WAS "which quadrant" — one of exactly four names, so a quarter of the children who cannot
   *  read the plane came back right. READING the point off the grid is the same skill with nothing
   *  to guess at, and it exercises the sign, which is the half children actually get wrong. */
  'm.coordinatePlane': () => { const x = pk([-1, 1]) * R(1, 6), y = pk([-1, 1]) * R(1, 6); const askX = _rand() < 0.5; return { prompt: `Look at the grid. What is the point's ${askX ? 'x' : 'y'}-coordinate?`, visual: { t: 'point', x, y }, ...num(askX ? x : y, { neg: true }) } },
  'm.linearRel': () => { const run = pk([2, 3, 4, 5]), slope = R(2, 9), rise = slope * run; return { prompt: `Look at the line. It goes up ${rise} for every ${run} across. What is its slope?`, visual: { t: 'slope', rise, run }, ...num(slope) } },
  'm.geomMeasure': () => { const b = R(2, 6) * 2, h = R(3, 9); return { prompt: `Look at the triangle. Its base is ${b} and its height is ${h}. What is its area?`, visual: { t: 'rtri', a: b, b: h, labels: [`${b}`, `${h}`, ''] }, ...num(b * h / 2) } },
  'm.percentages': () => { const p = pk([10, 20, 25, 50]), n = pk([20, 40, 60, 80]); return { prompt: `What is ${p}% of ${n}?`, ...num(n * p / 100) } },

  // ── 15–16 (Algebra I / Geometry) ──
  'a.signedFluency': () => { const a = pk([-1, 1]) * R(2, 9), b = pk([-1, 1]) * R(2, 9); return { prompt: `${a} × ${b} = ?`, ...num(a * b, { neg: true }) } },
  /** ⚠️ Was a pick over "7x"-shaped strings. The COEFFICIENT alone is the skill and it is a number,
   *  so the question names the shape of the answer and the child supplies the only part in doubt. */
  'a.expressions': () => { const a = R(2, 9), b = R(2, 9); return { prompt: `Simplify:  ${a}x + ${b}x = ?x   — type the number in front of x.`, ...num(a + b) } },
  'a.linearEqIneq': () => { const a = R(2, 5), x = R(2, 9), b = pk([-1, 1]) * R(1, 9); const bt = b < 0 ? `− ${-b}` : `+ ${b}`; return { prompt: `Solve:  ${a}x ${bt} = ${a * x + b}`, ...num(x) } },
  'a.slopeGraphs': () => { const m = pk([-1, 1]) * R(2, 5), x1 = R(0, 3), x2 = x1 + pk([1, 2]), y1 = R(1, 6); return { prompt: `Slope of the line through (${x1}, ${y1}) and (${x2}, ${y1 + m * (x2 - x1)})?`, ...num(m, { neg: true }) } },
  'a.functions': () => { const m = R(2, 4), b = R(1, 5), x = R(2, 6); return { prompt: `If f(x) = ${m}x + ${b}, what is f(${x})?`, ...num(m * x + b) } },
  'a.systems': () => { const x = R(4, 14), y = R(2, x - 1); return { prompt: `If x + y = ${x + y} and x − y = ${x - y}, what is x?`, ...num(x) } },
  // Was a pick over "x^7"-shaped strings; the exponent alone is the skill and it is a number.
  'a.expPolynomials': () => { const a = R(2, 5), b = R(2, 5); return { prompt: `x^${a} · x^${b} = x^?   — type the power.`, ...num(a + b) } },
  'a.radicals': () => { const [a, b, c] = pk([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29], [10, 24, 26], [15, 20, 25], [9, 40, 41], [14, 48, 50]] as [number, number, number][]); return { prompt: `Look at the right triangle. Its two legs are ${a} and ${b}. How long is the slanted side (the hypotenuse)?`, visual: { t: 'rtri', a, b, labels: [`${a}`, `${b}`, '?'] }, ...num(c) } },
  /** ⚠️ Was a pick over factored forms. Naming ONE of the two numbers inside the brackets is the
   *  same work — you cannot find it without factoring — and it is typed. "Smaller" is stated so the
   *  answer is unique; a round where both are equal is refused for the same reason. */
  'a.factoring': () => { const r1 = R(2, 9); let r2 = R(2, 9); if (r1 === r2) r2 = r1 === 9 ? r1 - 1 : r1 + 1; const lo = Math.min(r1, r2); return { prompt: `x² + ${r1 + r2}x + ${r1 * r2} factors into (x + a)(x + b).  Type the SMALLER of a and b.`, ...num(lo) } },
  'a.quadratics': () => { const r1 = R(2, 9), r2 = r1 + R(1, 5); return { prompt: `Solve:  x² − ${r1 + r2}x + ${r1 * r2} = 0.  Type the SMALLER solution.`, ...num(r1) } },
  'a.geomTransform': () => { const x = R(1, 6), y = pk([-1, 1]) * R(1, 6); return { prompt: `Look at the grid. Flip the point (${x}, ${y}) over the x-axis. Type the new y.`, visual: { t: 'point', x, y }, ...num(-y, { neg: true }) } },
  'a.proofTrig': () => { const a = pk([20, 25, 30, 35, 40, 50, 55, 60, 65, 70]); return { prompt: `One acute angle of a right triangle is ${a}°. How many degrees is the other acute angle?`, ...num(90 - a) } },

  // ── 17–18 (Algebra II / Pre-Calc / Stats / Calc) ──
  'c.functionToolkit': () => { const x = R(2, 5), b = R(1, 6); return { prompt: `If f(x) = x² + ${b}, what is f(${x})?`, ...num(x * x + b) } },
  'c.quadraticAnalysis': () => { const h = pk([-1, 1]) * R(1, 5), k = R(1, 6); const ht = h < 0 ? `+ ${-h}` : `− ${h}`; return { prompt: `y = (x ${ht})² + ${k}.  What is the x-coordinate of the vertex?`, ...num(h, { neg: true }) } },
  'c.polynomialFns': () => { const d = R(3, 9), a = R(2, 5), b = R(2, 6), c = R(1, 9); return { prompt: `What is the degree of  ${a}x^${d} + ${b}x² + ${c} ?`, ...num(d) } },
  'c.complex': () => { const fmt = (re: number, im: number) => `${re} ${im < 0 ? '−' : '+'} ${Math.abs(im)}i`; const a = R(1, 6), b = pk([-1, 1]) * R(1, 6), c = R(1, 6), d = pk([-1, 1]) * R(1, 6); return { prompt: `(${fmt(a, b)}) + (${fmt(c, d)}) = ?   Type the imaginary part (the number in front of i).`, ...num(b + d, { neg: true }) } },
  'c.rationalFns': () => { const a = pk([-1, 1]) * R(2, 7); const at = a < 0 ? `+ ${-a}` : `− ${a}`; return { prompt: `f(x) = 1 / (x ${at}).  Its vertical asymptote is x = ?`, ...num(a, { neg: true }) } },
  'c.expLog': () => { const b = pk([2, 3, 5]), e = R(2, 6); return { prompt: `log_${b}(${Math.pow(b, e)}) = ?`, ...num(e) } },
  // Stays a PICK: the exact values are surds, which a number pad cannot express.
  'c.unitCircleTrig': () => { const [q, ans] = pk([['sin 30°', '1/2'], ['cos 60°', '1/2'], ['sin 90°', '1'], ['cos 0°', '1'], ['sin 0°', '0'], ['cos 90°', '0'], ['sin 45°', '√2/2'], ['cos 45°', '√2/2']] as [string, string][]); return { prompt: `${q} = ?`, ...mc(ans, (['0', '1/2', '1', '√2/2', '√3/2', '-1'] as string[]).filter(v => v !== ans)) } },
  'c.trigGraphsId': () => { const a = R(2, 12); return { prompt: `What is the amplitude of  y = ${a} sin(x) ?`, ...num(a) } },
  'c.conics': () => { const r = R(2, 8); return { prompt: `What is the radius of the circle  x² + y² = ${r * r} ?`, ...num(r) } },
  'c.systemsMatrices': () => { const a = R(1, 5), b = R(1, 5), c = R(1, 5), d = R(1, 5); return { prompt: `The determinant of  [[${a}, ${b}], [${c}, ${d}]]  = ?`, ...num(a * d - b * c, { neg: true }) } },
  'c.sequencesSeries': () => { const a1 = R(1, 6), d = R(2, 5), t = [a1, a1 + d, a1 + 2 * d, a1 + 3 * d]; return { prompt: `What comes next:  ${t.join(', ')}, ?`, ...num(a1 + 4 * d) } },
  'c.statsInference': () => { const m = R(3, 14), nums = shuffle([m - 3, m - 1, m + 1, m + 3]); return { prompt: `What is the mean (average) of  ${nums.join(', ')} ?`, ...num(m) } },
  'c.introCalculus': () => { const n = R(3, 10); return { prompt: `The derivative of x^${n} is ${n}x^k.  What is k?`, ...num(n - 1) } },
}

export function makeItem(skillId: string, ctx?: DiagContext): DiagItem | null {
  const gen = ITEM_GENERATORS[skillId]
  return gen ? withCtx(ctx, skillId, gen) : null
}

// ── 3–5 READINESS ITEMS (Phase 3) ────────────────────────────────────────────────────────
// Parent-guided/observational: a pre-reader can't take an MCQ, so the PARENT does a short hands-on
// activity with the child and taps how it went. "Ready" = can do it (on their own or with a nudge);
// "Not yet" = a growing edge. Framing is readiness, NOT remediation. Personalized via name + theme.
// These are the answers to "How did it go?" on the parent card, so each one has to finish THAT
// question. They used to open with 'Yes, on their own' — a yes/no answer to a question that asks
// neither, and not parallel with the other two. Wording is the tester's own (2026-08-20), with one
// change: they wrote "this activity" twice and "the activity" once, and being parallel is the whole
// point of the report, so all three say "this activity".
const READY_OUTCOMES = [
  'My child was able to complete this activity on their own',
  'My child was able to complete this activity with a little help',
  'My child was not able to complete this activity',
]
const READY_PASS = [READY_OUTCOMES[0], READY_OUTCOMES[1]]
const readyItem = (activity: string): DiagItem => ({ prompt: activity, choices: READY_OUTCOMES.slice(), answer: READY_OUTCOMES[0], kind: 'parent', passSet: READY_PASS.slice() })

const READINESS_GENERATORS: Record<string, () => DiagItem> = {
  'e.counting10': () => { const n = R(5, 9); return readyItem(`Lay out ${n} small objects (${glyph().repeat(n)}). Ask ${kidName()} to count them out loud, touching each one.`) },
  'e.numeralRecog': () => { const ns = shuffle([2, 3, 5, 7, 8, 9]).slice(0, 3); return readyItem(`Write these numbers where ${kidName()} can see them:  ${ns.join('   ')} .  Point to each and ask them to name it.`) },
  'e.matchQty': () => { const n = R(4, 8); return readyItem(`Show ${kidName()} this group:  ${glyph().repeat(n)} .  Ask "how many?" — can they answer ${n} without slowly recounting?`) },
  'e.compare': () => { const a = R(2, 4), b = a + R(2, 4); return readyItem(`Make two groups:  ${glyph().repeat(a)}  and  ${glyph().repeat(b)} .  Ask ${kidName()} which group has MORE.`) },
  'e.numberOrder': () => { const n = R(3, 7); return readyItem(`Ask ${kidName()}: "When we count, what number comes right after ${n}?"`) },
  'e.addWithin10': () => { const a = R(2, 4), b = R(2, 4); return readyItem(`Put out ${a} objects, then add ${b} more. Ask ${kidName()} how many there are altogether.`) },
  'e.subWithin10': () => { const a = R(5, 8), b = R(2, 3); return readyItem(`Put out ${a} objects, then take ${b} away. Ask ${kidName()} how many are left.`) },
  'e.shapes2d': () => readyItem(`Point to a circle, a square, and a triangle around the room. Can ${kidName()} name each shape?`),
  'e.patterns': () => readyItem(`Make a pattern with toys or blocks — red, blue, red, blue… Ask ${kidName()} what comes next.`),
  'e.measureCompare': () => readyItem(`Hold up two objects of clearly different sizes. Ask ${kidName()} which one is bigger.`),
}
/** A 3–5 readiness (parent-guided) item for a skill, or null if the skill has no readiness activity. */
export function makeReadinessItem(skillId: string, ctx?: DiagContext): DiagItem | null {
  const gen = READINESS_GENERATORS[skillId]
  return gen ? withCtx(ctx, `ready:${skillId}`, gen) : null
}
