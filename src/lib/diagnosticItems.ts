/**
 * Diagnostic probe items — ONE quick multiple-choice question per skill, used only to triage
 * (pass/fail) during the diagnostic. These are intentionally lightweight and separate from the
 * rich practice content in the chapters; a skill with no generator here is treated as "can't
 * probe → assume ok" by the engine driver (it only bounds the descent; it's never on a core spine
 * for the 9–11 band we prove first).
 *
 * v1: covers the 9–11 diagnostic reachable set (9–11 skills + their 6–8 / 3–5 prerequisites).
 * Correctness of the math matters — each generator returns a valid question. Runs client-side.
 */
export interface DiagItem { prompt: string; choices: string[]; answer: string }

const R = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[R(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
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
  'e.matchQty': () => { const n = R(3, 7); return { prompt: `How many stars? ${'★'.repeat(n)}`, ...mc(n, [n + 1, n - 1, n + 2]) } },
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

  // ── shape prereqs (reached when a geometry entry descends) ──
  'p.shapes2d3d': () => { const [name, n] = pick([['triangle', 3], ['square', 4], ['pentagon', 5], ['hexagon', 6]] as [string, number][]); return { prompt: `How many sides does a ${name} have?`, ...mc(n, [n + 1, n - 1, n + 2]) } },
  'e.shapes2d': () => ({ prompt: `How many corners does a square have?`, ...mc(4, [3, 5, 6]) }),
}

export function makeItem(skillId: string): DiagItem | null {
  const gen = ITEM_GENERATORS[skillId]
  return gen ? gen() : null
}
