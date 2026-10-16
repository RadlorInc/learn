/**
 * The tester's walkthroughs (src/app/test/testerTours.ts). TourRunner gives up silently after ~3s when a step's
 * `data-tour` target is missing, so a step aimed at a renamed control would do nothing and nobody would be told. This
 * checks each target is emitted on /test or in LessonPlayer — as `data-tour="x"` or `data-tour={… 'x' …}`. It does not
 * prove the control is on screen at that moment; the walkthrough was driven in the browser for that (PR description).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TESTER_TOURS, tourFor } from '@/app/test/testerTours'

const src = ['app/test/page.tsx', 'features/lessons/LessonPlayer.tsx'].map(f => readFileSync(join(__dirname, '..', f), 'utf8')).join('\n')
const keys = new Set([...src.matchAll(/data-tour="([a-z-]+)"/g), ...src.matchAll(/data-tour=\{[^}]*?'([a-z-]+)'/g)].map(m => m[1]))

describe('tester walkthroughs', () => {
  it('the probe sees a target that exists, and not one that does not (positive control)', () => {
    expect(keys.has('tester-bar')).toBe(true)
    expect(keys.has('tester-next')).toBe(true)   // the ternary form
    expect(keys.has('no-such-target')).toBe(false)
  })
  it('every step points at a control /test or the lesson player renders', () => {
    const missing = Object.values(TESTER_TOURS).flatMap(t => t.steps.map(s => s.target)).filter(k => !keys.has(k))
    expect(missing).toEqual([])
  })
  it('the practice walkthrough points at the real level row, its counter and Finish (written out)', () => {
    expect(TESTER_TOURS.practice.steps.map(s => s.target)).toEqual(['tester-levels', 'tester-count', 'tester-finish'])
  })
  it('a screen opens the walkthrough for its kind', () => {
    expect(['1', '7', '8', '8-twin', 'p1', 'p12', '9'].map(tourFor)).toEqual(['lesson', 'lesson', 'question', 'question', 'practice', 'practice', null])
  })
})
