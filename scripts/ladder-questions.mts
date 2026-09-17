/**
 * Print sample questions from a module's practice ladders WITHOUT answers, worked steps or style names — for whoever
 * writes the independent solver (src/__tests__/ladderKeys/<module>.ts). The solver sees what a child sees.
 *
 *   npx tsx scripts/ladder-questions.mts g5m1 [samples per level, default 8] [topic numbers, e.g. 7,8,9]
 */
import { LADDERS } from '../src/features/lessons/ladders/index.ts'
import { rng } from '../src/features/lessons/adaptive.ts'

const [id, n = '8', only] = process.argv.slice(2)
const topics = only ? new Set(only.split(',').map(t => `${id}-t${t}`)) : null
if (!/^g\d+m\d+$/.test(id ?? '')) { console.error('usage: npx tsx scripts/ladder-questions.mts g5m1 [n]'); process.exit(2) }
const out = Object.entries(LADDERS).filter(([lid]) => lid.startsWith(`${id}-`) && (!topics || topics.has(lid))).map(([lid, ladder]) => ({
  id: lid,
  levels: ladder.map((lv, i) => Array.from({ length: +n }, (_, s) => {
    const p = lv.make(rng(1000 * i + s + 7))
    const a = p.answer
    return { text: p.text, picture: p.picture,
      answerForm: typeof a === 'number' ? 'number' : a && 'frac' in a ? 'fraction' : a && 'time' in a ? 'time h:mm' : 'pick one choice (return its exact text)',
      ...(a && typeof a === 'object' && 'choices' in a ? { choices: a.choices } : {}) }
  })),
}))
if (!out.length) { console.error(`no ladders for ${id}`); process.exit(2) }
console.log(JSON.stringify(out, null, 1))
