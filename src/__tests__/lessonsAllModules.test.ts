/**
 * The gate every Grade 3–8 module passes (Module 1 has its own, older test).
 *
 * ⚠️ Three things here are deliberately NOT derived from the lesson data, because a check that reads its expectation
 * out of the thing under test passes on any mistake:
 *   - topic titles come from docs/new-flow/curriculum.md;
 *   - the answers come from an ANSWER KEY (./answerKeys/<module>.ts) written by someone who saw only the questions;
 *   - the 9-screen structure is written out below.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { MODULES } from '@/features/lessons/modules'
import { Pic } from '@/features/lessons/Pictures'
import { solutionOf, stepsOf, showAnswer, isCorrect, type Answer, type Picture, type Problem, type Lesson } from '@/features/lessons/script'

const built = MODULES.filter(m => m.id !== 'g3m1' && m.lessons.length > 0)

/** Topic titles per module, read from the curriculum document ("1 Title · 2 Title · …" lines under each module heading). */
function curriculumTopics(): Record<string, string[]> {
  const doc = readFileSync('docs/new-flow/curriculum.md', 'utf8')
  const out: Record<string, string[]> = {}
  let grade = 0
  for (const block of doc.split('\n\n')) {
    const g = block.match(/^## Grade (\d)/m)
    if (g) grade = +g[1]
    const m = block.match(/^\*\*Module (\d) · [^*]+\*\*.*\n([\s\S]+)$/)
    if (!m || !grade) continue
    out[`g${grade}m${m[1]}`] = m[2].replace(/\n/g, ' ').split(/\s·\s(?=\d+ )/).map(t => t.trim().replace(/^\d+ /, ''))
  }
  return out
}

const problemsOf = (l: Lesson): [string, Problem][] =>
  [['your turn', l.turn], ['twin', l.turn.twin], ...l.practice.map((p, i) => [`practice ${i + 1}`, p.problem] as [string, Problem])]

const WHY_FIRST = 'Almost a copy of the lesson', WHY_SECOND = 'Same idea, new numbers', WHY_FOURTH = 'A little harder', WHY_LAST = 'Same math in a story'

it('the curriculum parser reads every module (positive control)', () => {
  const t = curriculumTopics()
  expect(Object.keys(t)).toHaveLength(36)
  expect(t.g3m2[0]).toBe('Read the clock to 5 minutes')
  expect(t.g8m6.at(-1)).toBe('Relative frequency')
})

describe.each(built.map(m => [m.id, m] as const))('%s', (id, m) => {
  const topics = curriculumTopics()[id]

  it('has the topics of the curriculum, in order, with ids g<grade>m<module>-t<n>', () => {
    expect(m.lessons.map(l => l.title)).toEqual(topics)
    expect(m.lessons.map(l => l.id)).toEqual(topics.map((_, i) => `${id}-t${i + 1}`))
  })

  it.each(m.lessons.map(l => [l.id, l] as const))('%s follows the 9-screen script', (_lid, l) => {
    expect(l.screens).toHaveLength(7)
    expect(l.screens[2].title).toBe('The big idea')
    expect(l.screens[2].text).toBe(l.bigIdea)
    expect(l.screens[6].title).toBe('One thing not to do')
    expect(l.screens.every(s => s.title && s.text && s.pictures.length > 0)).toBe(true)
    expect(l.screens.some(s => s.pictures.some(p => 'motion' in p && p.motion)), 'at least one step animates').toBe(true)
    expect(l.practice).toHaveLength(5)
    expect(l.practice.map(p => p.why)).toEqual([WHY_FIRST, WHY_SECOND, expect.stringMatching(/\S/), WHY_FOURTH, WHY_LAST])
    for (const s of [l.skill, l.turn.prompt, l.turn.hint1, l.turn.hint2, l.won.text, l.won.sticker, l.twinWon.text, l.twinWon.sticker]) expect(s.trim()).not.toBe('')
  })

  it.each(m.lessons.map(l => [l.id, l] as const))('%s: every answer is well formed and its worked steps reach it', (_lid, l) => {
    for (const [where, p] of problemsOf(l)) {
      const a = solutionOf(p)
      expect(a, `${where}: no answer`).toBeDefined()
      expect(p.op === undefined || p.answer === undefined, `${where}: op AND answer`).toBe(true)
      validAnswer(a, `${l.id} ${where}`)
      const steps = stepsOf(p)
      expect(steps.length, `${where}: worked steps`).toBeGreaterThanOrEqual(2)
      expect(steps.at(-1), `${l.id} ${where}: the last worked step must state the answer "${showAnswer(a)}"`).toContain(showAnswer(a))
    }
    const t = l.turn.twin
    if (!t.op) expect(t.hint1 && t.hint2, 'a twin without op needs its own hints').toBeTruthy()
  })

  it.each(m.lessons.map(l => [l.id, l] as const))('%s: hints and Screen 9 never give the wrong numbers away', (_lid, l) => {
    const words = (s: string) => new Set(s.match(/\d+(?:\.\d+)?/g) ?? [])
    for (const [hints, p] of [[[l.turn.hint1, l.turn.hint2], l.turn], [[l.turn.twin.hint1 ?? '', l.turn.twin.hint2 ?? ''], l.turn.twin]] as const) {
      const a = solutionOf(p)
      if (typeof a === 'number' && Math.abs(a) >= 10) {
        for (const h of hints) expect(words(h).has(String(Math.abs(a))), `${l.id}: hint "${h}" states the answer ${a}`).toBe(false)
      }
    }
    // Screen 9 after the twin speaks only about the twin: no number that is not in the twin's own text or answer.
    const allowed = new Set([...words(l.turn.twin.text), ...words(showAnswer(solutionOf(l.turn.twin))), ...words(l.bigIdea)])
    for (const n of words(`${l.twinWon.text} ${l.twinWon.sticker}`)) {
      expect(allowed.has(n), `${l.id}: "${n}" in Screen 9 after the twin is not from the twin`).toBe(true)
    }
  })

  it.each(m.lessons.map(l => [l.id, l] as const))('%s: every picture is well formed and draws without throwing', (_lid, l) => {
    const pics: Picture[] = [...l.screens.flatMap(s => s.pictures), ...problemsOf(l).map(([, p]) => p.picture)]
    for (const p of pics) {
      validPicture(p, l.id)
      let html = ''
      expect(() => { html = renderToStaticMarkup(createElement(Pic, { p })) }, `${l.id} ${p.kind}`).not.toThrow()
      // A bad coordinate does not throw — it draws nothing, silently. It shows up as NaN/undefined in the markup.
      expect(html.match(/NaN|undefined|Infinity/g), `${l.id} ${p.kind}: ${JSON.stringify(p).slice(0, 160)}`).toBeNull()
    }
  })

  it('matches its independent answer key', async () => {
    const file = `src/__tests__/answerKeys/${id}.ts`
    expect(existsSync(file), `${file} is missing: a module does not ship without an answer key written from the questions alone`).toBe(true)
    const key: Record<string, string[]> = (await import(`./answerKeys/${id}.ts`)).KEY
    expect(Object.keys(key).sort()).toEqual(m.lessons.map(l => l.id).sort())
    const wrong: string[] = []
    for (const l of m.lessons) {
      const problems = problemsOf(l)
      expect(key[l.id], l.id).toHaveLength(7)
      problems.forEach(([where, p], i) => {
        const a = solutionOf(p), k = key[l.id][i]
        const ok = typeof a === 'object' && 'choices' in a ? a.choices[a.correct] === k : isCorrect(a, k)
        if (!ok) wrong.push(`${l.id} ${where}: lesson says ${showAnswer(a)}, key says ${k} — "${p.text}"`)
      })
    }
    expect(wrong).toEqual([])
  })
})

function validAnswer(a: Answer, where: string) {
  if (typeof a === 'number') { expect(Number.isFinite(a), where).toBe(true); return }
  if ('frac' in a) { expect(a.frac[1], where).toBeGreaterThan(0); expect(Number.isInteger(a.frac[0]) && Number.isInteger(a.frac[1]), where).toBe(true); return }
  if ('time' in a) { expect(a.time[0] >= 1 && a.time[0] <= 12 && a.time[1] >= 0 && a.time[1] < 60, where).toBe(true); return }
  expect(a.choices.length, where).toBeGreaterThanOrEqual(2)
  expect(new Set(a.choices).size, `${where}: duplicate choices`).toBe(a.choices.length)
  expect(a.correct >= 0 && a.correct < a.choices.length, where).toBe(true)
}

function validPicture(p: Picture, where: string) {
  const w = `${where} ${p.kind}`
  switch (p.kind) {
    case 'numline':
      expect(p.max, w).toBeGreaterThan(p.min); expect(p.ticks, w).toBeGreaterThanOrEqual(1); expect(p.ticks, w).toBeLessThanOrEqual(24)
      if (Array.isArray(p.labels)) expect(p.labels, w).toHaveLength(p.ticks + 1)
      for (const x of [...(p.points ?? []).map(q => q.at), ...(p.jumps ?? []).flatMap(j => [j.from, j.to])]) expect(x >= p.min && x <= p.max, `${w}: ${x} is off the line`).toBe(true)
      break
    case 'bars': for (const b of p.bars) expect(b.shaded + (b.shade2 ?? 0) <= b.parts && b.parts <= 24, w).toBe(true); break
    case 'grid': expect(p.rows <= 20 && p.cols <= 20 && p.rows > 0 && p.cols > 0, w).toBe(true); break
    case 'chart': expect(p.labels, w).toHaveLength(p.values.length); break
    case 'table': { const n = p.head?.length ?? p.rows[0].length; for (const r of p.rows) expect(r, w).toHaveLength(n); break }
    case 'area': if (p.cells) { expect(p.cells, w).toHaveLength(p.rows.length); for (const r of p.cells) expect(r, w).toHaveLength(p.cols.length) } break
    case 'measure': expect(p.max > (p.min ?? 0) && p.step > 0 && (p.max - (p.min ?? 0)) / p.step <= 60, w).toBe(true); break
    case 'clock': expect(p.h >= 1 && p.h <= 12 && p.m >= 0 && p.m < 60, w).toBe(true); break
    case 'cubes': expect(p.l * p.w * (p.layers ?? p.h) <= 120, w).toBe(true); break
    case 'blocks': expect(p.hundreds <= 9 && p.tens <= 20 && p.ones <= 20, w).toBe(true); break
    case 'poly': expect(p.shapes.length + (p.segs?.length ?? 0) + (p.circles?.length ?? 0), w).toBeGreaterThan(0); break
  }
}
