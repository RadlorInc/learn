/**
 * Diagnostic probe items — ONE quick multiple-choice question per skill, used only to triage
 * (pass/fail) during the diagnostic. These are intentionally lightweight and separate from the
 * rich practice content in the chapters; a skill with no generator here is treated as "can't
 * probe → assume ok" by the engine driver (it only bounds the descent; it's never on a core spine
 * for the 9–11 band we prove first).
 *
 * v1: covers the 9–11 diagnostic reachable set (9–11 skills + their 6–8 / 3–5 prerequisites).
 * v1.1: the 6–8 band diagnostic (PROBE_ENTRY['6-8']) reuses this same set — its reachable skills
 *   (compare-to-100, add-to-100, multiply-as-groups, unit fractions + their 3–5 prereqs) are a
 *   subset of the 9–11 prereqs above, so every 6–8-reachable skill already has a generator here.
 * Correctness of the math matters — each generator returns a valid question. Runs client-side.
 */
/** A probe item. `kind:'parent'` = a 3–5 readiness activity the PARENT does with the child, then
 *  reports the outcome (the `choices`); `passSet` is which outcomes count as "can do". `kind:'child'`
 *  (default, undefined) = a child-facing MCQ where `choices`/`answer` are literal. */
export interface DiagItem { prompt: string; choices: string[]; answer: string; kind?: 'child' | 'parent'; passSet?: string[] }

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
function mulberry32(a: number): () => number { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
/** Deterministic theme for a child when they don't have one set — varies the flavor per child. */
export function pickThemeFor(seed: string): ItemTheme { return ITEM_THEMES[hashStr(seed) % ITEM_THEMES.length] }

const R = (lo: number, hi: number) => lo + Math.floor(_rand() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[R(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(_rand() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
const glyph = () => (_ctx?.theme && THEME_GLYPH[_ctx.theme]) || '★'
const kidName = () => _ctx?.name?.trim() || 'your child'
/** Run a generator under a context: seed the RNG (if a seed is given) + expose name/theme, restore after. */
function withCtx(ctx: DiagContext | undefined, key: string, gen: () => DiagItem): DiagItem {
  const prevR = _rand, prevC = _ctx
  if (ctx) { _ctx = ctx; if (ctx.seed != null) _rand = mulberry32(hashStr(`${ctx.seed}|${key}|${ctx.nonce ?? 0}`)) }
  try { return gen() } finally { _rand = prevR; _ctx = prevC }
}
/** Build a 4-choice MCQ from a correct answer + candidate distractors (deduped, valid). */
function mc(answer: string | number, distractors: (string | number)[]): { choices: string[]; answer: string } {
  const ans = String(answer)
  const set = new Set<string>([ans])
  for (const d of distractors) { const s = String(d); if (set.size >= 4) break; if (s !== ans) set.add(s) }
  return { choices: shuffle([...set]), answer: ans }
}

type Gen = () => DiagItem

export const ITEM_GENERATORS: Record<string, Gen> = {
  // ── 3–5 (deep prereqs; a 9–11 kid should pass these — they exist to bound the descent) ──
  'e.counting10': () => { const n = R(3, 8); return { prompt: `${n - 2}, ${n - 1}, ${n}, ?`, ...mc(n + 1, [n, n + 2, n - 1]) } },
  'e.numeralRecog': () => { const n = R(4, 9); return { prompt: `Tap the number ${n}.`, ...mc(n, [n + 1, n - 1, n + 2]) } },
  'e.matchQty': () => { const n = R(3, 7); return { prompt: `How many? ${glyph().repeat(n)}`, ...mc(n, [n + 1, n - 1, n + 2]) } },
  'e.compare': () => { const a = R(2, 9), b = R(2, 9) + (Math.random() < .5 ? 0 : 0); const x = a, y = a === b ? b + 1 : b; return { prompt: `Which is more?`, ...mc(Math.max(x, y), [Math.min(x, y)]) } },
  'e.numberOrder': () => { const n = R(3, 8); return { prompt: `What comes just after ${n}?`, ...mc(n + 1, [n - 1, n + 2, n]) } },
  'e.addWithin10': () => { const a = R(1, 5), b = R(1, 4); return { prompt: `${a} + ${b} = ?`, ...mc(a + b, [a + b + 1, a + b - 1, a + b + 2]) } },
  'e.subWithin10': () => { const a = R(5, 9), b = R(1, 4); return { prompt: `${a} − ${b} = ?`, ...mc(a - b, [a - b + 1, a - b - 1, a - b + 2]) } },

  // ── 6–8 prerequisites ──
  'p.numbersTo100': () => { const n = R(31, 89); return { prompt: `What comes just after ${n}?`, ...mc(n + 1, [n - 1, n + 10, n + 2]) } },
  'p.placeValue2': () => { const n = R(23, 89); return { prompt: `How many tens are in ${n}?`, ...mc(Math.floor(n / 10), [n % 10, Math.floor(n / 10) + 1, n]) } },
  'p.compare100': () => { const a = R(21, 98), b = a + pick([1, -1, 10, -10, 7]); return { prompt: `Which is greater, ${a} or ${b}?`, ...mc(Math.max(a, b), [Math.min(a, b)]) } },
  'p.skipCount': () => { const s = pick([2, 5, 10]), k = R(2, 5), a = s * k; return { prompt: `${a}, ${a + s}, ${a + 2 * s}, ?`, ...mc(a + 3 * s, [a + 2 * s, a + 4 * s, a + 3 * s + 1]) } },
  'p.addTo100': () => { const a = R(24, 68), b = R(15, 30); return { prompt: `${a} + ${b} = ?`, ...mc(a + b, [a + b + 10, a + b - 1, a + b + 1]) } },
  'p.subTo100': () => { const a = R(52, 96), b = R(15, 39); return { prompt: `${a} − ${b} = ?`, ...mc(a - b, [a - b + 10, a - b - 1, a - b + 1]) } },
  'p.multConcept': () => { const g = R(2, 5), per = R(2, 5); return { prompt: `${g} groups of ${per} — how many altogether?`, ...mc(g * per, [g + per, g * per + per, g * per - 1]) } },
  'p.fractionsIntro': () => { const d = pick([2, 3, 4]); const w = d === 2 ? 'half' : d === 3 ? 'third' : 'quarter'; return { prompt: `A pizza is cut into ${d} equal parts and you take 1. What fraction is that?`, ...mc(`1/${d}`, [`1/${d + 1}`, `${d}/1`, `2/${d}`]) } },

  // ── 9–11 core ──
  'i.bigNumbers': () => { const a = R(2, 9) * 1000 + R(0, 999); const b = a + pick([1000, -1000, 100, -100, 111]); return { prompt: `Which is greater, ${a.toLocaleString()} or ${b.toLocaleString()}?`, ...mc(Math.max(a, b).toLocaleString(), [Math.min(a, b).toLocaleString()]) } },
  'i.rounding': () => { const n = R(11, 89); return { prompt: `Round ${n} to the nearest 10.`, ...mc(Math.round(n / 10) * 10, [Math.floor(n / 10) * 10, Math.ceil(n / 10) * 10 + 10, n]) } },
  'i.multFacts': () => { const a = R(4, 9), b = R(4, 9); return { prompt: `${a} × ${b} = ?`, ...mc(a * b, [a * b + a, a * b - b, a * b + 1]) } },
  'i.multMultiDigit': () => { const a = R(13, 29), b = R(3, 6); return { prompt: `${a} × ${b} = ?`, ...mc(a * b, [a * b + b, a * b - a, a * b + 10]) } },
  'i.division': () => { const b = R(3, 9), q = R(3, 9), a = b * q; return { prompt: `${a} ÷ ${b} = ?`, ...mc(q, [q + 1, q - 1, q + 2]) } },
  'i.factors': () => { const n = pick([12, 16, 18, 20, 24]); const f = pick([2, 3, 4, 6].filter(x => n % x === 0)); const non = [5, 7, 9, 11].filter(x => n % x !== 0); return { prompt: `Which is a factor of ${n}?`, ...mc(f, non) } },
  'i.fractionEquiv': () => { const d = pick([2, 3, 4, 5]), k = pick([2, 3]); return { prompt: `Which fraction equals 1/${d}?`, ...mc(`${k}/${k * d}`, [`${k}/${k * d + 1}`, `${k + 1}/${k * d}`, `1/${d + 1}`]) } },
  'i.fractionOps': () => { const d = pick([4, 5, 6, 8]); const a = R(1, d - 2), b = R(1, d - 1 - a); return { prompt: `${a}/${d} + ${b}/${d} = ?`, ...mc(`${a + b}/${d}`, [`${a + b}/${2 * d}`, `${a + b + 1}/${d}`, `${a * b}/${d}`]) } },
  'i.decimals': () => { const a = R(2, 8) / 10, b = R(21, 79) / 100; const A = a.toFixed(1), B = b.toFixed(2); return { prompt: `Which is greater, ${A} or ${B}?`, ...mc(a > b ? A : B, [a > b ? B : A]) } },
  'i.measureUnits': () => { const m = R(2, 6); return { prompt: `${m} meters = ? centimeters`, ...mc(m * 100, [m * 10, m * 1000, m * 100 + 10]) } },
  'i.areaPerimeter': () => { const w = R(2, 9), h = R(2, 9); return { prompt: `A rectangle is ${w} by ${h}. What is its area?`, ...mc(w * h, [2 * (w + h), w * h + w, w * h - h]) } },
  'i.anglesSymmetry': () => { const [d, k] = pick([[40, 'Acute'], [55, 'Acute'], [90, 'Right'], [120, 'Obtuse'], [135, 'Obtuse']] as [number, string][]); return { prompt: `An angle measures ${d}°. Is it acute, right, or obtuse?`, ...mc(k, (['Acute', 'Right', 'Obtuse'] as string[]).filter(x => x !== k)) } },
  'i.dataGraphs': () => { const labels = ['Red', 'Blue', 'Green', 'Gold']; const vals = labels.map(() => R(2, 9)); let mi = 0; for (let i = 1; i < vals.length; i++) if (vals[i] > vals[mi]) mi = i; if (vals.filter(v => v === vals[mi]).length > 1) vals[mi] += 1; return { prompt: `A chart shows ${labels.map((l, i) => `${l} ${vals[i]}`).join(', ')}. Which has the most?`, ...mc(labels[mi], labels.filter((_, i) => i !== mi)) } },

  // ── 12–14 (middle) ── (new for the 12–14 band; MCQ, math-without-fear: no free-typed answers)
  'm.integers': () => { const s = new Set<number>(); while (s.size < 4) s.add(R(-9, 9)); const xs = [...s]; const ans = Math.max(...xs); return { prompt: `Which is greatest:  ${xs.join(',  ')} ?`, ...mc(ans, xs.filter(x => x !== ans)) } },
  'm.signedOps': () => { const a = pick([-1, 1]) * R(2, 9), b = pick([-1, 1]) * R(2, 9); const r = a + b; return { prompt: `${a} + (${b}) = ?`, ...mc(r, [a - b, -r, Math.abs(a) + Math.abs(b), r + 1]) } },
  'm.rationalOps': () => { const b = pick([2, 3, 4]), d = pick([2, 3, 5].filter(x => x !== b)); return { prompt: `1/${b} × 1/${d} = ?`, ...mc(`1/${b * d}`, [`1/${b + d}`, `2/${b * d}`, `1/${Math.abs(b - d) || 1}`]) } },
  'm.ratioProportion': () => { const rate = R(2, 6), a = R(2, 5), b = a + R(1, 4); return { prompt: `${a} tickets cost $${rate * a}. What do ${b} tickets cost?`, ...mc(rate * b, [rate * a + (b - a), rate * b + rate, rate * (b - 1), rate * b - 1]) } },
  'm.exponentsRoots': () => { if (Math.random() < 0.5) { const b = R(3, 12); return { prompt: `What is ${b}²?`, ...mc(b * b, [b * 2, b * b - b, (b + 1) * (b + 1), b * b + b]) } } const b = R(3, 12), s = b * b; return { prompt: `√${s} = ?`, ...mc(b, [b + 1, b - 1, Math.round(s / 2)]) } },
  'm.orderOps': () => { const a = R(2, 6), b = R(2, 5), c = R(2, 5); return { prompt: `${a} + ${b} × ${c} = ?`, ...mc(a + b * c, [(a + b) * c, a + b + c, a * b + c, a + b * c + 1]) } },
  'm.algExpressions': () => { const x = R(2, 6), m = R(2, 5), b = R(1, 6); return { prompt: `If x = ${x}, what is ${m}x + ${b}?`, ...mc(m * x + b, [m + x + b, m * x, m * (x + b), m * x + b + 1]) } },
  'm.equationsIneq': () => { const a = R(2, 5), x = R(2, 8), b = R(1, 9), c = a * x + b; return { prompt: `Solve:  ${a}x + ${b} = ${c}`, ...mc(x, [x + 1, x - 1, c - b, Math.round(c / a)]) } },
  'm.coordinatePlane': () => { const x = pick([-1, 1]) * R(1, 6), y = pick([-1, 1]) * R(1, 6); const q = x > 0 && y > 0 ? 'Quadrant I' : x < 0 && y > 0 ? 'Quadrant II' : x < 0 && y < 0 ? 'Quadrant III' : 'Quadrant IV'; return { prompt: `Which quadrant is (${x}, ${y}) in?`, ...mc(q, (['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'] as string[]).filter(z => z !== q)) } },
  'm.linearRel': () => { const run = pick([2, 3, 4]), slope = R(2, 5), rise = slope * run; return { prompt: `A line goes up ${rise} for every ${run} across. What is its slope?`, ...mc(slope, [rise, run, slope + 1, rise + run]) } },
  'm.geomMeasure': () => { const b = R(2, 6) * 2, h = R(3, 9); return { prompt: `A triangle has base ${b} and height ${h}. What is its area?`, ...mc(b * h / 2, [b * h, b + h, b * h / 2 + b, b * h / 2 - h]) } },
  'm.percentages': () => { const p = pick([10, 20, 25, 50]), n = pick([20, 40, 60, 80]); const r = n * p / 100; return { prompt: `What is ${p}% of ${n}?`, ...mc(r, [n * p / 10, n - p, p, r + 1]) } },

  // ── 15–16 (Algebra I / Geometry) ── (new for the 15–16 band; MCQ only, no free-typed answers)
  'a.signedFluency': () => { const a = pick([-1, 1]) * R(2, 9), b = pick([-1, 1]) * R(2, 9); const r = a * b; return { prompt: `${a} × ${b} = ?`, ...mc(r, [-r, a + b, r + 1, r - 1]) } },
  'a.expressions': () => { const a = R(2, 6), b = R(2, 6); return { prompt: `Simplify:  ${a}x + ${b}x`, ...mc(`${a + b}x`, [`${a * b}x`, `${a + b}x²`, `${a + b}`, `${a}x + ${b}`]) } },
  'a.linearEqIneq': () => { const a = R(2, 5), x = R(2, 9), b = pick([-1, 1]) * R(1, 9), c = a * x + b; const bt = b < 0 ? `− ${-b}` : `+ ${b}`; return { prompt: `Solve:  ${a}x ${bt} = ${c}`, ...mc(x, [x + 1, x - 1, c - b, Math.round(c / a)]) } },
  'a.slopeGraphs': () => { const m = R(2, 5), x1 = R(0, 3), x2 = x1 + pick([1, 2]), y1 = R(1, 6), y2 = y1 + m * (x2 - x1); return { prompt: `Slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`, ...mc(m, [m + 1, m - 1, x2 - x1, -m]) } },
  'a.functions': () => { const m = R(2, 4), b = R(1, 5), x = R(2, 6); return { prompt: `If f(x) = ${m}x + ${b}, what is f(${x})?`, ...mc(m * x + b, [m + x + b, m * x, m * (x + b), m * x + b + 1]) } },
  'a.systems': () => { const x = R(4, 9), y = R(2, x - 1), sum = x + y, diff = x - y; return { prompt: `If x + y = ${sum} and x − y = ${diff}, what is x?`, ...mc(x, [y, Math.round(sum / 2), diff, x + 1]) } },
  'a.expPolynomials': () => { const a = R(2, 5), b = R(2, 5); return { prompt: `x^${a} · x^${b} = ?`, ...mc(`x^${a + b}`, [`x^${a * b}`, `x^${a}`, `x^${Math.abs(a - b) || 1}`, `2x^${a + b}`]) } },
  'a.radicals': () => { const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]] as [number, number, number][]); return { prompt: `A right triangle has legs ${a} and ${b}. What is the hypotenuse?`, ...mc(c, [a + b, c - 1, c + 2, Math.max(a, b) + 1]) } },
  'a.factoring': () => { const r1 = R(2, 5), r2 = R(2, 6); return { prompt: `Factor:  x² + ${r1 + r2}x + ${r1 * r2}`, ...mc(`(x+${r1})(x+${r2})`, [`(x+${r1})(x+${r2 + 1})`, `(x+${r1 * r2})(x+1)`, `(x+${r1 + r2})(x+1)`, `(x+${r1 + 1})(x+${r2})`]) } },
  'a.quadratics': () => { const r1 = R(2, 5), r2 = r1 + R(1, 4); return { prompt: `Solve:  x² − ${r1 + r2}x + ${r1 * r2} = 0`, ...mc(`x = ${r1} or ${r2}`, [`x = ${-r1} or ${-r2}`, `x = ${r1} or ${r2 + 1}`, `x = ${r1 + r2} or ${r1 * r2}`, `x = ${r1 - 1} or ${r2}`]) } },
  'a.geomTransform': () => { const x = R(1, 6), y = R(1, 6); return { prompt: `Reflect the point (${x}, ${y}) over the x-axis. Where does it land?`, ...mc(`(${x}, ${-y})`, [`(${-x}, ${y})`, `(${-x}, ${-y})`, `(${y}, ${x})`]) } },
  'a.proofTrig': () => { const a = pick([20, 25, 30, 35, 40, 50, 55, 60, 65, 70]); return { prompt: `One acute angle of a right triangle is ${a}°. What is the other acute angle?`, ...mc(`${90 - a}°`, [`${180 - a}°`, `${a}°`, `${90 + a}°`, `${90 - a + 5}°`]) } },

  // ── 17–18 (Algebra II / Pre-Calc / Stats / Calc) ── (new for the 17–18 band; MCQ only)
  'c.functionToolkit': () => { const x = R(2, 5), b = R(1, 6); return { prompt: `If f(x) = x² + ${b}, what is f(${x})?`, ...mc(x * x + b, [2 * x + b, x * x, (x + b) * (x + b), x * x + b + 1]) } },
  'c.quadraticAnalysis': () => { const h = R(1, 5), k = R(1, 6); return { prompt: `What is the vertex of  y = (x − ${h})² + ${k} ?`, ...mc(`(${h}, ${k})`, [`(${-h}, ${k})`, `(${h}, ${-k})`, `(${k}, ${h})`]) } },
  'c.polynomialFns': () => { const d = R(3, 6), a = R(2, 5), b = R(2, 6), c = R(1, 9); return { prompt: `What is the degree of  ${a}x^${d} + ${b}x² + ${c} ?`, ...mc(d, [d - 1, d + 1, a, d + 2]) } },
  'c.complex': () => { const fmt = (re: number, im: number) => `${re} ${im < 0 ? '−' : '+'} ${Math.abs(im)}i`; const a = R(1, 6), b = pick([-1, 1]) * R(1, 6), c = R(1, 6), d = pick([-1, 1]) * R(1, 6); return { prompt: `(${fmt(a, b)}) + (${fmt(c, d)}) = ?`, ...mc(fmt(a + c, b + d), [fmt(a + c, b - d), fmt(a - c, b + d), fmt(a * c, b + d)]) } },
  'c.rationalFns': () => { const a = R(2, 7); return { prompt: `What is the vertical asymptote of  f(x) = 1 / (x − ${a}) ?`, ...mc(`x = ${a}`, [`x = ${-a}`, `y = ${a}`, `x = 0`, `x = ${a + 1}`]) } },
  'c.expLog': () => { const b = pick([2, 3, 5]), e = R(2, 4), v = Math.pow(b, e); return { prompt: `log_${b}(${v}) = ?`, ...mc(e, [e + 1, e - 1, v / b, b]) } },
  'c.unitCircleTrig': () => { const [q, ans] = pick([['sin 30°', '1/2'], ['cos 60°', '1/2'], ['sin 90°', '1'], ['cos 0°', '1'], ['sin 0°', '0'], ['cos 90°', '0'], ['sin 45°', '√2/2'], ['cos 45°', '√2/2']] as [string, string][]); return { prompt: `${q} = ?`, ...mc(ans, (['0', '1/2', '1', '√2/2', '√3/2'] as string[]).filter(v => v !== ans)) } },
  'c.trigGraphsId': () => { const a = R(2, 6); return { prompt: `What is the amplitude of  y = ${a} sin(x) ?`, ...mc(a, [2 * a, 1, a + 1, a - 1]) } },
  'c.conics': () => { const r = R(2, 8); return { prompt: `What is the radius of the circle  x² + y² = ${r * r} ?`, ...mc(r, [r * r, 2 * r, r + 1, Math.round(r * r / 2)]) } },
  'c.systemsMatrices': () => { const a = R(1, 5), b = R(1, 5), c = R(1, 5), d = R(1, 5); return { prompt: `The determinant of  [[${a}, ${b}], [${c}, ${d}]]  = ?`, ...mc(a * d - b * c, [a * d + b * c, a * b - c * d, a * c - b * d, a * d - b * c + 1]) } },
  'c.sequencesSeries': () => { const a1 = R(1, 6), d = R(2, 5), t = [a1, a1 + d, a1 + 2 * d, a1 + 3 * d], ans = a1 + 4 * d; return { prompt: `What comes next:  ${t.join(', ')}, ?`, ...mc(ans, [ans + 1, ans - 1, ans + d, a1 * 4]) } },
  'c.statsInference': () => { const m = R(3, 8), nums = shuffle([m - 3, m - 1, m + 1, m + 3]); return { prompt: `What is the mean (average) of  ${nums.join(', ')} ?`, ...mc(m, [m + 1, m - 1, 4 * m, m + 2]) } },
  'c.introCalculus': () => { const n = R(2, 5), p = n - 1, ans = p === 1 ? `${n}x` : `${n}x^${p}`; return { prompt: `What is the derivative of  x^${n} ?`, ...mc(ans, [`x^${p}`, `${n}x^${n}`, `${p}x^${n}`, `${n}x^${n + 1}`]) } },

  // ── shape prereqs (reached when a geometry entry descends) ──
  'p.shapes2d3d': () => { const [name, n] = pick([['triangle', 3], ['square', 4], ['pentagon', 5], ['hexagon', 6]] as [string, number][]); return { prompt: `How many sides does a ${name} have?`, ...mc(n, [n + 1, n - 1, n + 2]) } },
  'e.shapes2d': () => ({ prompt: `How many corners does a square have?`, ...mc(4, [3, 5, 6]) }),
}

export function makeItem(skillId: string, ctx?: DiagContext): DiagItem | null {
  const gen = ITEM_GENERATORS[skillId]
  return gen ? withCtx(ctx, skillId, gen) : null
}

// ── 3–5 READINESS ITEMS (Phase 3) ────────────────────────────────────────────────────────
// Parent-guided/observational: a pre-reader can't take an MCQ, so the PARENT does a short hands-on
// activity with the child and taps how it went. "Ready" = can do it (on their own or with a nudge);
// "Not yet" = a growing edge. Framing is readiness, NOT remediation. Personalized via name + theme.
const READY_OUTCOMES = ['Yes, on their own', 'With a little help', 'Not yet']
const READY_PASS = ['Yes, on their own', 'With a little help']
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
