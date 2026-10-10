/**
 * Pictures and written words paid testers found wrong or unclear (triage, 9 Oct 2026), each held by its value: the
 * expected drawing is written out here by hand, never read from the lesson, and every ladder level is sampled as a
 * child gets it, the numbers read back from the question the child sees.
 */
import { describe, it, expect } from 'vitest'
import { findLesson } from '@/features/lessons/modules'
import { LADDERS } from '@/features/lessons/ladders'
import { rng } from '@/features/lessons/adaptive'
import type { Picture } from '@/features/lessons/script'

const lesson = (id: string) => findLesson(id)!.lesson
const samples = (id: string, level: number, n = 60) => Array.from({ length: n }, (_, k) => LADDERS[id][level].make(rng(9000 + k)))
const sup = (s: string) => [...s].map(ch => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(ch)).join('')

describe('g8m1 · exponents', () => {
  it('t1 Screen 1: every block of the doubling tape says ×2 (three for 2³, two for 2²)', () => {
    const p = lesson('g8m1-t1').screens[0].pictures[0] as Extract<Picture, { kind: 'tape' }>
    expect(p.rows.map(r => [r.label, r.cells.map(c => c.text)])).toEqual([['2³', ['×2', '×2', '×2']], ['2²', ['×2', '×2']]])
  })

  it('t1 level 5: the worked steps say "a single 10", not "a lone 10"', () => {
    const steps = samples('g8m1-t1', 4).flatMap(p => p.steps ?? [])
    expect(steps.some(s => s.includes('10¹'))).toBe(true)          // the paper-clip story, where the word was, is sampled
    expect(steps.filter(s => /\blone\b/.test(s))).toEqual([])
  })

  it('t2 level 3: the wrong card says it divided the exponents; the right one still leaves the answer to find', () => {
    for (const p of samples('g8m1-t2', 2)) {
      const m = p.text.match(/(\d+)([⁰-⁹¹²³]+) ÷ \d+([⁰-⁹¹²³]+) = \d+([⁰-⁹¹²³]+)/)!
      const [a, c, q] = [m[2], m[3], m[4]].map(sup)
      const cards = p.picture as Extract<Picture, { kind: 'cards' }>
      expect(cards.wrong.endsWith(`, because ${a} ÷ ${c} = ${q}`), cards.wrong).toBe(true)
      expect(cards.right).toBe(`${m[1]}${m[2]} ÷ ${m[1]}${m[3]} = ${m[1]}^?`)
    }
  })
})

describe('g6m2 · fractions', () => {
  /** x of each cut on a board (a vertical chalk line), sorted. */
  const cutsOver = (screen: number, y: number) =>
    lesson('g6m2-t1').screens[screen].chalk!.flatMap(m => {
      const v = m.d?.match(/^M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+)$/)
      return v && v[1] === v[3] && +v[2] <= y && +v[4] >= y ? [+v[1]] : []
    }).sort((p, q) => p - q)

  it('t1 Screens 3 and 4: every fourth of the 3/4 bar is cut in half, so it is 8 eighths, not 7 boxes', () => {
    // The bar runs 120 → 480 in fourths of 90; the middle of each fourth is a cut.
    expect(cutsOver(2, 100)).toEqual([165, 255, 345, 435])
    expect(cutsOver(3, 67)).toEqual([165, 255, 345, 435])
  })

  it('t3 level 4: the story shows both numbers in one area model', () => {
    for (const p of samples('g6m2-t3', 3)) {
      const [x, y] = [...p.text.matchAll(/(\d+) (\d+)\/(\d+)/g)].map(m => [m[1], `${m[2]}/${m[3]}`])
      expect(p.picture.kind, p.text).toBe('area')
      const a = p.picture as Extract<Picture, { kind: 'area' }>
      expect([a.cols, a.rows], p.text).toEqual([x, y])
    }
  })

  it('t4 Screen 5: the note under 36/12 = 3 says why, not just that 12 twelfths make 1', () => {
    const notes = lesson('g6m2-t4').screens[4].chalk!.flatMap(m => (m.t ? [m.t] : []))
    expect(notes).toContain('12 twelfths = 1, so 36 twelfths = 3')
  })
})

describe('g6m4 · percent', () => {
  it('t5 level 3: the price and the discount are on their own named rows', () => {
    for (const p of samples('g6m4-t5', 2)) {
      const [, W, pc] = p.text.match(/costs \$(\d+)\. It is (\d+)% off/)!
      expect(p.picture).toEqual({ kind: 'eq', text: `Price: $${W}`, lines: [`Discount: ${pc}% off`] })
    }
  })
})

describe('g6m6 · area (triage 10 Oct)', () => {
  it('t1 Screen 6: "6 cm" stands above the rectangle, on its one unbroken side, not under the moved triangle', () => {
    const marks = lesson('g6m6-t1').screens[5].chalk!
    const pts = marks.filter(m => m.d && !m.wash).flatMap(m => [...m.d!.matchAll(/([\d.]+)[ ,]([\d.]+)/g)].map(v => [+v[1], +v[2]]))
    const label = marks.find(m => m.t === '6 cm')!
    expect(pts.length).toBeGreaterThan(4)
    expect(label.y!).toBeLessThan(Math.min(...pts.map(q => q[1])))   // above the top edge
    expect(label.x!).toBeGreaterThan(Math.min(...pts.map(q => q[0])))
    expect(label.x!).toBeLessThan(Math.max(...pts.map(q => q[0])))
  })
})
