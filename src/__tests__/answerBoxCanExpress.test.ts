/**
 * Every answer a lesson or a ladder asks for must be TYPEABLE in the box the lesson draws. The box's shape is decided per
 * lesson (see AnswerInput), so a negative answer anywhere in the lesson must give the whole lesson a "−" key — for a
 * fraction box as much as a number box.
 * ⚠️ Found 2026-09-17: the fraction box had no "−" key at all, so g8m2-t2's −3/4 (live since 2026-09-14) could not be
 * entered by anyone. Asserted on the RENDERED box, not on needsSign, because a flag the renderer ignores is the bug.
 */
import { it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { MODULES } from '@/features/lessons/modules'
import { ladderOf, ladderAnswers } from '@/features/lessons/ladders'
import { AnswerInput, needsSign, needsWhole } from '@/features/lessons/AnswerInput'
import { solutionOf, type Answer } from '@/features/lessons/script'

const negative = (a: Answer) =>
  typeof a === 'number' ? a < 0 : typeof a === 'object' && 'frac' in a ? a.frac[0] < 0 || (a.whole ?? 0) < 0 : false

it('every negative answer can be typed: its box has a "−" key', () => {
  const stuck: string[] = []
  for (const m of MODULES) for (const l of m.lessons) {
    const all = [l.turn, l.turn.twin, ...l.practice.map(x => x.problem)].map(solutionOf)
    const ladder = ladderOf(l.id)
    if (ladder) all.push(...ladderAnswers(ladder))
    for (const a of all.filter(negative)) {
      const html = renderToStaticMarkup(createElement(AnswerInput, { answer: a, value: '', onChange: () => {}, signed: needsSign(all), mixed: needsWhole(all) }))
      if (!html.includes('Make it negative')) stuck.push(`${l.id}: ${JSON.stringify(a)}`)
    }
  }
  expect(stuck.slice(0, 10)).toEqual([])
})
