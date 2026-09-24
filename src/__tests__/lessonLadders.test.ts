/**
 * The gate for practice ladders (features/lessons/adaptive.ts, features/lessons/ladders/).
 *
 * ⚠️ Deliberately NOT derived from the ladders themselves:
 *   - which modules must be laddered is written out below (LADDERED), so a module that silently loses its ladders fails;
 *   - the answers come from an independent SOLVER (./ladderKeys/<module>.ts), written by someone who saw only sample
 *     questions (scripts/ladder-questions.mts) — never the generator source;
 *   - "a level is a different kind of question, not bigger numbers" is measured on the rendered question with every
 *     number taken out, and the detector is itself watched failing on a numbers-only ladder (first test).
 */
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { MODULES } from '@/features/lessons/modules'
import { Pic } from '@/features/lessons/Pictures'
import { LADDERS } from '@/features/lessons/ladders'
import { rng, step, startLevel, draw, beginRun, advance, reviewTopic, nextModuleTopic, FRESH, CHECKPOINT, DONE_AFTER, runDone, toSaved, fromSaved, type Level, type Standing } from '@/features/lessons/adaptive'
import { isCorrect, showAnswer, type Answer, type Problem } from '@/features/lessons/script'

// Every built module, written out (not read from MODULES): a module that silently loses its ladders must fail here.
const LADDERED = [
  'g3m1', 'g3m2', 'g3m3', 'g3m4', 'g3m5', 'g3m6', 'g4m1', 'g4m2', 'g4m3', 'g4m4', 'g4m5', 'g4m6',
  'g5m1', 'g5m2', 'g5m3', 'g5m4', 'g5m5', 'g5m6', 'g6m1', 'g6m2', 'g6m3', 'g6m4', 'g6m5', 'g6m6', 'g6m7',
  'g7m1', 'g7m2', 'g7m3', 'g7m4', 'g7m5', 'g8m1', 'g8m2', 'g8m3', 'g8m4', 'g8m5', 'g8m6',
]
const SEEDS = 60

const sample = (lv: Level, i: number): Problem[] => Array.from({ length: SEEDS }, (_, s) => lv.make(rng(7919 * (i + 1) + s)))

/** A question with every number, and the words around nothing else, taken out: what KIND of question it is. */
const skeleton = (p: Problem) => {
  const a = p.answer
  const choices = a && typeof a === 'object' && 'choices' in a ? a.choices.join(' | ') : ''
  return `${p.text} ${JSON.stringify(p.picture)} ${choices}`.replace(/\d[\d,.]*/g, '#')
}
/** Pairs of levels whose questions share a skeleton — i.e. the harder one is the easier one with other numbers. */
const sameKind = (ladder: readonly Level[]) => {
  const sets = ladder.map((lv, i) => new Set(sample(lv, i).map(skeleton)))
  const out: string[] = []
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
    const shared = [...sets[i]].filter(k => sets[j].has(k))
    if (shared.length) out.push(`levels ${i + 1} "${ladder[i].style}" and ${j + 1} "${ladder[j].style}" ask the same kind of question: ${shared[0].slice(0, 120)}`)
  }
  return out
}

it('the same-kind detector flags a ladder that only makes the numbers bigger (positive control)', () => {
  const numbersOnly: Level[] = [
    { style: 'small', make: r => ({ text: `Find ${2 + Math.floor(r() * 7)} × 10.`, picture: { kind: 'eq', text: '? × 10' }, answer: 1, steps: ['a', '1'] }) },
    { style: 'big', make: r => ({ text: `Find ${2000 + Math.floor(r() * 7000)} × 10.`, picture: { kind: 'eq', text: '? × 10' }, answer: 1, steps: ['a', '1'] }) },
  ]
  expect(sameKind(numbersOnly)).toHaveLength(1)
})

it('the reveal reader sees a place chart row and a point label, and not a scale (positive control)', () => {
  expect(shownNumbers({ kind: 'table', head: ['Hundreds', 'Tens', 'Ones'], rows: [['7', '7', '0']] }).has('770')).toBe(true)
  expect(shownNumbers({ kind: 'numline', min: 0, max: 40, ticks: 4, points: [{ at: 30, label: '30' }] }).has('30')).toBe(true)
  expect(shownNumbers({ kind: 'numline', min: 0, max: 40, ticks: 4, labels: 'ends' }).has('40')).toBe(false)
  expect(shownNumbers({ kind: 'measure', tool: 'scale', max: 1000, step: 100, labelEvery: 5, value: 350, unit: 'g' }).has('350')).toBe(false)
  // A right CHOICE is looked for in the labels too — not in a dot's numeric position.
  expect(choiceShown({ kind: 'numline', min: 0, max: 1, ticks: 10, points: [{ at: 0.4 }] }, '0.4')).toBe(false)
  expect(choiceShown({ kind: 'eq', text: '3 × (4 + 5) = ?' }, '3 × (4 + 5)')).toBe(true)
  expect(choiceShown({ kind: 'columns', rows: ['732', '408'], op: '−' }, '324')).toBe(false)
  expect(choiceShown({ kind: 'numline', min: 0, max: 1, ticks: 4, labels: ['impossible', null, null, null, 'certain'], points: [{ at: 0.2, label: 'unlikely' }] }, 'likely')).toBe(false)
  expect(choiceShown({ kind: 'numline', min: 0, max: 1, ticks: 4, points: [{ at: 0.8, label: 'likely' }] }, 'likely')).toBe(true)
})

describe('the adaptive rules', () => {
  const at = (level: number, streak = 0): Standing => ({ level, streak, mastered: false })
  it('two first-try rights move up one level; one is not enough', () => {
    expect(step(at(1), 5, 'first')).toEqual(at(1, 1))
    expect(step(at(1, 1), 5, 'first')).toEqual(at(2, 0))
  })
  it('a right after a miss keeps the level and breaks the streak', () => expect(step(at(2, 1), 5, 'second')).toEqual(at(2, 0)))
  it('worked steps move down one level, never below the first', () => {
    expect(step(at(3, 1), 5, 'worked')).toEqual(at(2, 0))
    expect(step(at(0), 5, 'worked')).toEqual(at(0, 0))
  })
  it('two first-try rights at the top level is mastery', () => expect(step(at(4, 1), 5, 'first')).toEqual({ level: 4, streak: 0, mastered: true }))
  it('starts one level up after a first-try Screen 8, or where the child left off', () => {
    expect(startLevel(null, true, 5).level).toBe(1)
    expect(startLevel(null, false, 5).level).toBe(0)
    expect(startLevel({ level: 3, streak: 1, mastered: false }, false, 5)).toEqual(at(3, 0))
    expect(startLevel({ level: 9, streak: 0, mastered: true }, false, 5).level).toBe(4)
    expect(FRESH.level).toBe(0)
  })
  // A two-level toy ladder whose question text names its level, so each assertion can see which level was drawn.
  const toy = (name: string): Level[] => [0, 1].map(k => ({ style: `${name}${k}`, make: r => ({ text: `${name} L${k} ${Math.floor(r() * 1e9)}`, picture: { kind: 'eq', text: '' }, answer: 1, steps: ['a', '1'] }) }))
  const ladders: Record<string, Level[]> = { here: toy('here'), back: toy('back') }
  const of = (id: string) => ladders[id]

  it('a run moves up, is mastered at the top, and pauses for the child there', () => {
    let run = beginRun('here', ladders.here, at(0), rng(3), null)
    expect(run.current.problem.text).toMatch(/^here L0/)
    const outcomes = ['first', 'first', 'first', 'first'] as const
    const texts: string[] = [], pauses: unknown[] = []
    for (const o of outcomes) { const m = advance(run, 'here', of, o, rng(texts.length)); run = m.run; pauses.push(m.pause); texts.push(run.current.problem.text) }
    // one first-try right keeps L0, the second moves to L1, two more at the top is mastery
    expect(texts.slice(0, 3).map(t => t.slice(0, 7))).toEqual(['here L0', 'here L1', 'here L1'])
    expect(pauses).toEqual([null, null, null, 'mastered'])
    expect(run.standing).toEqual({ level: 1, streak: 0, mastered: true })
    expect(runDone(run)).toBe(true)
    // Keep going after mastery: a next problem is always there, from the top of the ladder.
    expect(run.current.problem.text).toMatch(/^here L1/)
  })
  it('practice never ends by itself: a checkpoint after every 5 answers, done after 12 without mastery', () => {
    // Written out, not derived from the constants: the founder's numbers are the spec (2026-09-24).
    expect([CHECKPOINT, DONE_AFTER]).toEqual([5, 12])
    let run = beginRun('here', ladders.here, at(0), rng(3), null)
    const at_: number[] = [], done: boolean[] = []
    for (let n = 1; n <= 23; n++) {
      const m = advance(run, 'here', of, 'second', rng(n)); run = m.run
      if (m.pause) at_.push(n)
      done.push(runDone(run))
      expect(run.current.problem.text).toMatch(/^here/)
    }
    expect(at_).toEqual([5, 10, 15, 20])
    expect(done.indexOf(true) + 1).toBe(12)
  })
  it('a saved run resumes exactly: same problem on screen, same count, nothing it has asked comes back', () => {
    const repeaty: Level[] = [{ style: 'x', make: r => { const n = Math.floor(r() * 30); return { text: `q${n}`, picture: { kind: 'eq', text: '' }, answer: n, steps: ['a', String(n)] } } }]
    const lad = (id: string) => (id === 'here' ? repeaty : undefined)
    let run = beginRun('here', repeaty, at(0), rng(3), null)
    for (let n = 0; n < 7; n++) run = advance(run, 'here', lad, 'second', rng(n)).run
    const saved = JSON.parse(JSON.stringify(toSaved(run)))          // through storage, as the device and the column do
    const back = fromSaved(saved, run.standing, null)
    expect(back).toEqual(run)
    const next = advance(back, 'here', lad, 'second', rng(99)).run
    expect(run.recent).not.toContain(next.current.problem.text)
    expect(next.asked).toBe(8)
  })
  it('the review problem comes third, from the earlier topic, and moves only that topic', () => {
    let run = beginRun('here', ladders.here, at(0), rng(3), { id: 'back', standing: at(1) })
    run = advance(run, 'here', of, 'second', rng(1)).run
    expect(run.current.from).toBe('here')
    run = advance(run, 'here', of, 'second', rng(2)).run
    expect(run.current).toMatchObject({ from: 'back' })
    expect(run.current.problem.text).toMatch(/^back L1/)
    const m = advance(run, 'here', of, 'worked', rng(4))
    expect(m.saved).toEqual([['back', at(0)]])
    expect(m.run.standing).toEqual(at(0))
    expect(m.run.current.from).toBe('here')
  })
  it('brings back the weakest finished, unmastered, laddered earlier topic', () => {
    const st: Record<string, Standing> = { a: at(2), b: at(1), c: { level: 0, streak: 0, mastered: true } }
    const all: Record<string, Level[]> = { a: toy('a'), b: toy('b'), c: toy('c'), d: toy('d') }
    expect(reviewTopic(['a', 'b', 'c', 'd', 'x'], id => id !== 'd', id => st[id] ?? null, id => all[id])).toEqual({ id: 'b', standing: at(1) })
    expect(reviewTopic(['c'], () => true, id => st[id] ?? null, id => all[id])).toBeNull()
  })
  it('module practice asks the weakest topic, never the same one twice running', () => {
    const st: Record<string, Standing> = { a: at(2), b: at(0), c: { level: 4, streak: 0, mastered: true } }
    const get = (id: string) => st[id] ?? null
    expect(nextModuleTopic(['a', 'b', 'c', 'd'], get, [], rng(1))).toBe('b')
    expect(nextModuleTopic(['a', 'b', 'c', 'd'], get, ['b'], rng(1))).toBe('a')
    expect(nextModuleTopic(['a', 'b', 'c', 'd'], () => ({ level: 4, streak: 0, mastered: true }), ['a'], rng(1))).not.toBe('a')
    // Two weak topics do not take every problem: once asked twice, a level-0 topic yields to a level-3 one.
    const weak: Record<string, Standing> = { x: at(0), y: at(0), z: at(3) }
    expect(nextModuleTopic(['x', 'y', 'z'], id => weak[id], ['x', 'y', 'x', 'y'], rng(1))).toBe('z')
    // A child missing everything: the first two asked drop to level 0, but the rest of the module still comes up.
    {
      const ids = Array.from({ length: 8 }, (_, k) => `t${k}`), asked: string[] = [], st: Record<string, Standing> = {}, r = rng(9)
      for (let k = 0; k < 10; k++) { const id = nextModuleTopic(ids, x => st[x] ?? null, asked, r); asked.push(id); st[id] = at(0) }
      expect(new Set(asked).size).toBeGreaterThanOrEqual(5)
    }
    // No history: ties are spread over the module, not its first topics.
    const ids = Array.from({ length: 20 }, (_, k) => `t${k}`), asked: string[] = [], r = rng(5)
    for (let k = 0; k < 10; k++) asked.push(nextModuleTopic(ids, () => null, asked, r))
    expect(asked.some(id => +id.slice(1) >= 10)).toBe(true)
  })
  it('does not repeat a question just asked when the generator can avoid it', () => {
    const ladder: Level[] = [{ style: 'x', make: r => { const n = r() < 0.5 ? 1 : 2; return { text: `q${n}`, picture: { kind: 'eq', text: '' }, answer: n, steps: ['a', String(n)] } } }]
    const r = rng(1)
    for (let i = 0; i < 50; i++) expect(draw(ladder, 0, r, ['q1']).text).toBe('q2')
  })
})

describe.each(LADDERED.map(id => [id, MODULES.find(m => m.id === id)!] as const))('%s ladders', (id, m) => {
  it('every topic has a ladder of at least 4 styles, and there are no ladders for topics that do not exist', () => {
    const ids = m.lessons.map(l => l.id)
    expect(ids.length).toBeGreaterThan(0)
    for (const lid of ids) {
      expect(LADDERS[lid], `${lid} has no ladder`).toBeDefined()
      expect(LADDERS[lid].length, `${lid} levels`).toBeGreaterThanOrEqual(4)
      expect(new Set(LADDERS[lid].map(l => l.style)).size, `${lid}: two levels share a style name`).toBe(LADDERS[lid].length)
    }
    expect(Object.keys(LADDERS).filter(k => k.startsWith(`${id}-`)).sort()).toEqual([...ids].sort())
  })

  it.each(m.lessons.map(l => [l.id] as const))('%s: every level is a different kind of question, not bigger numbers', lid => {
    expect(sameKind(LADDERS[lid])).toEqual([])
  })

  it.each(m.lessons.map(l => [l.id] as const))('%s: every generated problem is well formed, reaches its answer, and hides it', lid => {
    const bad: string[] = []
    LADDERS[lid].forEach((lv, i) => {
      for (const p of sample(lv, i)) {
        const where = `${lid} L${i + 1} "${lv.style}": ${p.text}`
        const a = p.answer
        if (a === undefined || p.op || !p.steps) { bad.push(`${where} — needs answer + steps, no op`); continue }
        const why = invalidAnswer(a)
        if (why) { bad.push(`${where} — ${why}`); continue }
        if (p.steps.length < 2) bad.push(`${where} — fewer than 2 worked steps`)
        if (!p.steps.at(-1)!.includes(showAnswer(a))) bad.push(`${where} — last step does not state "${showAnswer(a)}"`)
        if (/NaN|undefined|Infinity|\[object/.test(`${p.text} ${p.steps.join(' ')} ${JSON.stringify(a)}`)) bad.push(`${where} — broken text`)
        const html = renderToStaticMarkup(createElement(Pic, { p: p.picture }))
        if (/NaN|undefined|Infinity/.test(html)) bad.push(`${where} — picture draws NaN/undefined`)
        // The picture must not show the answer: a number answer of 10 or more as a whole token, or the right choice's text.
        if (lv.dataShown && !['chart', 'table', 'numline'].includes(p.picture.kind)) bad.push(`${where} — dataShown on a ${p.picture.kind} picture, which is not a data display`)
        if (!lv.dataShown && typeof a === 'number' && Math.abs(a) >= 10 && shownNumbers(p.picture).has(String(Math.abs(a)))) bad.push(`${where} — picture shows the answer ${showAnswer(a)}`)
        if (typeof a === 'object' && 'choices' in a && choiceShown(p.picture, a.choices[a.correct])) bad.push(`${where} — picture shows the right choice`)
      }
    })
    expect(bad.slice(0, 10)).toEqual([])
  })

  it('agrees with its independent solver on every sampled problem', async () => {
    const file = `src/__tests__/ladderKeys/${id}.ts`
    expect(existsSync(file), `${file} is missing: a ladder does not ship without a solver written from the questions alone`).toBe(true)
    const SOLVE: Record<string, (q: { text: string; picture: unknown; choices?: string[] }) => string> = (await import(`./ladderKeys/${id}.ts`)).SOLVE
    const wrong: string[] = []
    for (const l of m.lessons) {
      expect(SOLVE[l.id], `${l.id} has no solver`).toBeDefined()
      LADDERS[l.id].forEach((lv, i) => {
        for (const p of sample(lv, i)) {
          const a = p.answer!
          const choices = typeof a === 'object' && 'choices' in a ? a.choices : undefined
          let k = ''
          try { k = SOLVE[l.id]({ text: p.text, picture: p.picture, choices }) } catch (e) { k = `threw ${(e as Error).message}` }
          const ok = choices ? choices[(a as { correct: number }).correct] === k : isCorrect(a, k)
          if (!ok) wrong.push(`${l.id} L${i + 1}: generator says ${showAnswer(a)}, solver says ${k} — "${p.text}"`)
        }
      })
    }
    expect(wrong.slice(0, 10)).toEqual([])
  })
})

/**
 * Every number a picture's own LABELS print, commas dropped: the strings in its data, plus each list of strings joined
 * (a table spells 1,100 as 1 | 1 | 0 | 0 in four cells — a first version read whole tokens only and passed a place chart
 * showing the answer). Numbers the renderer prints from numeric data are deliberately NOT read: those are SCALES — a
 * clock's 1–12, a jug's 100s, a number line's ends, a scratch line's multiples — and reading a scale is the skill. A
 * version that read the rendered markup flagged every clock, jug and skip-count line in Grade 3, i.e. cried wolf.
 */
function labelsOf(pic: unknown): string[] {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return texts
}
/** A right choice is shown when a single label contains it, or a table row joined up IS it — never when it only
 *  happens to sit inside a joined row (732 | 408 joined is "732408", which contains 324 by accident). */
function choiceShown(pic: unknown, choice: string): boolean {
  const single: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') single.push(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  // Whole words only: "likely" is not shown by a label reading "unlikely".
  const esc = choice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const word = new RegExp(`(^|[^\\p{L}\\p{N}])${esc}($|[^\\p{L}\\p{N}])`, 'u')
  return single.some(t => word.test(t)) || labelsOf(pic).includes(choice)
}
function shownNumbers(pic: unknown): Set<string> {
  const texts = labelsOf(pic)
  return new Set(texts.flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, '')))
}

function invalidAnswer(a: Answer): string | null {
  if (typeof a === 'number') return Number.isFinite(a) ? null : 'answer is not a finite number'
  if ('frac' in a) return a.frac[1] > 0 && Number.isInteger(a.frac[0]) && Number.isInteger(a.frac[1]) ? null : 'bad fraction'
  if ('time' in a) return a.time[0] >= 1 && a.time[0] <= 12 && a.time[1] >= 0 && a.time[1] < 60 ? null : 'bad time'
  if (a.choices.length < 2) return 'fewer than 2 choices'
  if (new Set(a.choices).size !== a.choices.length) return `duplicate choices ${a.choices.join(' | ')}`
  return a.correct >= 0 && a.correct < a.choices.length ? null : 'correct index out of range'
}
