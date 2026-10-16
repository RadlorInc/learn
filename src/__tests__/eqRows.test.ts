/**
 * An equation picture never splits its answer side across rows. A paid tester (g6m1 practice): "green to white = 12 :"
 * on one row and "?" alone under it "feels broken up" — "move everything after the equals sign down".
 * Reads the rows the picture actually draws (the SVG's <text>), not the wrapping helper.
 */
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Pic } from '@/features/lessons/Pictures'
import { MODULES } from '@/features/lessons/modules'
import { LADDERS } from '@/features/lessons/ladders'
import { rng } from '@/features/lessons/adaptive'
import type { Picture } from '@/features/lessons/script'

const rows = (p: Picture) =>
  [...renderToStaticMarkup(createElement(Pic, { p })).matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'))
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })

describe('eq picture rows', () => {
  it('breaks before the "=" and keeps the answer side whole (written out by hand)', () => {
    expect(rows(eq('green to white = 12 : ?'))).toEqual(['green to white', '= 12 : ?'])
    expect(rows(eq('purple to yellow = 7 : ?'))).toEqual(['purple to yellow', '= 7 : ?'])
    expect(rows(eq('red crayons : blue crayons : green crayons = 3 : 4 : 5'))).toEqual(['red crayons :', 'blue crayons :', 'green crayons', '= 3 : 4 : 5'])
    expect(rows(eq('apples : oranges = 3 : 5', ['84 students in all']))).toEqual(['apples : oranges', '= 3 : 5', '84 students in all'])
    expect(rows(eq('16 × 3 = 10 × 3 + 6 × 3'))).toEqual(['16 × 3', '= 10 × 3 + 6 × 3'])
    expect(rows(eq('12 + 12 + 8 + 8 + 6 + 6 = 52'))).toEqual(['12 + 12 + 8', '+ 8 + 6 + 6', '= 52'])
    expect(rows(eq('red out of all = 3 out of 5'))).toEqual(['red out of all', '= 3 out of 5'])
    expect(rows(eq('25 × (38 + 12) ? 25 × 38 + 12'))).toEqual(['25 × (38 + 12)', '? 25 × 38 + 12'])
    expect(rows(eq('(0 − (−5)) ÷ (1 − (−3))'))).toEqual(['(0 − (−5))', '÷ (1 − (−3))'])
    expect(rows(eq('(x, y) → (x + 4, y + 2)'))).toEqual(['(x, y)', '→ (x + 4, y + 2)'])
    expect(rows(eq('x = weeks, y = height (inches)'))).toEqual(['x = weeks,', 'y = height (inches)'])
    expect(rows(eq('Clue 1: long = 3 × short'))).toEqual(['Clue 1:', 'long = 3 × short'])
    expect(rows(eq('y = 3x + 4: slope 3, crosses at 4'))).toEqual(['y = 3x + 4:', 'slope 3, crosses at 4'])
  })

  it('leaves a short equation as it was', () => {
    expect(rows(eq('blue to red = ? : 12'))).toEqual(['blue to red = ? : 12'])
    expect(rows(eq('boys : girls = 3 : 4'))).toEqual(['boys : girls = 3 : 4'])
  })

  it('no row of any lesson or practice equation ends on an operator or is a lone "?"', () => {
    const pics: [string, Picture][] = []
    const walk = (v: unknown, where: string) => {
      if (Array.isArray(v)) v.forEach(x => walk(x, where))
      else if (v && typeof v === 'object') {
        if ((v as Picture).kind === 'eq') pics.push([where, v as Picture])
        Object.values(v).forEach(x => walk(x, where))
      }
    }
    for (const m of MODULES) for (const l of m.lessons) walk(l, l.id)
    for (const [id, ladder] of Object.entries(LADDERS)) ladder.forEach((lv, i) => {
      for (let s = 0; s < 40; s++) walk(lv.make(rng(7919 * (i + 1) + s)).picture, `${id} L${i + 1}`)
    })
    expect(pics.length).toBeGreaterThan(500)
    const bad = pics.flatMap(([where, p]) => {
      const r = rows(p)
      return r.length > 1 && r.some(t => /[=+−×÷]$/.test(t.trim()) || (/ :$/.test(t.trim()) && /[\d?]/.test(t)) || t.trim() === '?') ? [`${where}: ${r.join(' / ')}`] : []
    })
    expect([...new Set(bad)]).toEqual([])
  })
})
