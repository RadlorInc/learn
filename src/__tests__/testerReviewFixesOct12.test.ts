/**
 * Pictures and written words paid testers found wrong or unclear (triage, 12 Oct 2026), each held by its value: the
 * expected drawing is written out here by hand, never read from the lesson, and every ladder level is sampled as a
 * child gets it, the numbers read back from the question the child sees. (Its own file so it does not collide with
 * another triage's additions to testerReviewFixes.test.ts.)
 */
import { describe, it, expect } from 'vitest'
import { findLesson, MODULES } from '@/features/lessons/modules'
import { LADDERS } from '@/features/lessons/ladders'
import { rng } from '@/features/lessons/adaptive'
import type { Picture } from '@/features/lessons/script'

const lesson = (id: string) => findLesson(id)!.lesson
const samples = (id: string, level: number, n = 60) => Array.from({ length: n }, (_, k) => LADDERS[id][level].make(rng(9000 + k)))
const sup = (s: string) => [...s].map(ch => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(ch)).join('')

describe('g6m7 · data', () => {
  type Table = Extract<Picture, { kind: 'table' }>
  const tables = (p: unknown): Table[] => !p || typeof p !== 'object' ? []
    : Array.isArray(p) ? p.flatMap(tables)
    : [...((p as Picture).kind === 'table' ? [p as Table] : []), ...Object.values(p).flatMap(tables)]

  it('t1 Screen 8, t2 Screen 1: a table with a header row names its value row (what the numbers count)', () => {
    const t1 = lesson('g6m7-t1'), t2 = lesson('g6m7-t2')
    expect(t1.turn.picture).toEqual({ kind: 'table', head: ['Tower', 'A', 'B', 'C', 'D'], rows: [['Cubes', '3', '7', '4', '6']], rowHead: true })
    expect(t2.screens[0].pictures[0]).toEqual({ kind: 'table', head: ['Seedling', 'A', 'B', 'C', 'D', 'E'], rows: [['Inches', '7', '3', '9', '4', '6']], rowHead: true })
  })

  it('t1 level 4: the missing-score table names its row "Score"', () => {
    for (const p of samples('g6m7-t1', 3)) expect((p.picture as Table).rows[0][0], p.text).toBe('Score')
  })

  it('no row of any rowHead table, in any lesson or sampled ladder level, is left without a name', () => {
    const found: Table[] = [], blank: string[] = []
    for (const m of MODULES) for (const l of m.lessons) {
      const all = [...tables(l.screens.map(s => s.pictures)), ...tables(l.turn), ...tables(l.practice)]
      for (const [id, levels] of Object.entries(LADDERS)) if (id === l.id) levels.forEach((_, i) => all.push(...tables(samples(id, i, 20))))
      for (const t of all.filter(t => t.rowHead)) { found.push(t); if (t.rows.some(r => !r[0]?.trim())) blank.push(`${l.id}: ${JSON.stringify(t.head)}`) }
    }
    expect(found.length, 'control: rowHead tables were read').toBeGreaterThan(100)
    expect(blank).toEqual([])
  })

  it('t5 Screen 4: the mean jumps to 16 as she says "jumps" — nothing listed before it waits for a later word', () => {
    const s = lesson('g6m7-t5').screens[3]
    const said = s.beats![2].say.split(/\s+/).map(w => w.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    const ats = s.chalk!.filter(m => m.beat === 2).map(m => m.at!)
    expect(ats).toEqual(['grown-up', 'grown-up', 'jumps', '16'])
    expect(ats.map(w => said.indexOf(w))).toEqual([3, 3, 8, 10])
  })
})

describe('g8m1 · a power of a power', () => {
  it('t3 level 3: the second worked step is "So multiply the exponents: a × n = …"', () => {
    for (const p of samples('g8m1-t3', 2)) {
      const [, , a, n] = p.text.match(/\((\d+)([⁰-⁹¹²³]+)\)([⁰-⁹¹²³]+)/)!
      const [x, y] = [sup(a), sup(n)].map(Number)
      expect(p.steps![1], p.text).toBe(`So multiply the exponents: ${x} × ${y} = ${x * y}.`)
    }
  })

  it('t3 level 5: every box story has a side that is itself a power, so it needs the power-of-a-power step', () => {
    const boxes = samples('g8m1-t3', 4, 80).filter(p => p.text.includes('A box shaped like a cube'))
    expect(boxes.length, 'control: box stories are sampled').toBeGreaterThan(10)
    for (const p of boxes) {
      const [, e] = p.text.match(/is 10([⁰-⁹¹²³]*) centimeters on each side/)!
      expect(['2', '3'], p.text).toContain(sup(e))
    }
  })
})
