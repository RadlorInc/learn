/**
 * A tape row named for a colour is drawn in that colour (a paid tester, 7 Oct: in g6m1-t1 the "Red" beads were mint
 * and the "Blue" beads white). Reads every tape picture a lesson or a ladder level really makes, renders each colour
 * row through the real renderer, and asks the fill's hue — judged by hand-written rules, not by the renderer's table.
 */
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Pic } from '@/features/lessons/Pictures'
import { MODULES } from '@/features/lessons/modules'
import { LADDERS } from '@/features/lessons/ladders'
import { rng } from '@/features/lessons/adaptive'
import type { Picture } from '@/features/lessons/script'

type Tape = Extract<Picture, { kind: 'tape' }>
const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255] }
// What each colour word must look like. A colour with no rule here makes the test fail, so a new one gets a rule.
const LOOKS: Record<string, (r: number, g: number, b: number) => boolean> = {
  red: (r, g, b) => r > g + 40 && r > b + 40,
  blue: (r, g, b) => b > r + 40 && b > g + 20,
  green: (r, g, b) => g > r + 40 && g > b,
  yellow: (r, g, b) => r > 200 && g > 160 && b < g - 60,
  purple: (r, g, b) => b > g + 20 && r > g + 10,
  gray: (r, g, b) => r === g && g === b && r > 100 && r < 240,
  white: (r, g, b) => r > 245 && g > 245 && b > 245,
  black: (r, g, b) => r === g && g === b && r < 128,
}
const colourOf = (label?: string) => label?.split(' ')[0].toLowerCase()
const COLOURS = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown', 'gray', 'grey', 'white', 'black']

function tapes(x: unknown, out: Tape[] = []): Tape[] {
  if (Array.isArray(x)) x.forEach(v => tapes(v, out))
  else if (x && typeof x === 'object') {
    if ((x as Picture).kind === 'tape') out.push(x as Tape)
    Object.values(x).forEach(v => tapes(v, out))
  }
  return out
}
/** The fill of a one-row tape, as the real renderer draws it. */
const fillOf = (row: Tape['rows'][number]) => {
  const html = renderToStaticMarkup(createElement(Pic, { p: { kind: 'tape', rows: [row] } }))
  return html.match(/<rect[^>]*fill="(#[0-9a-f]{3,6})"/i)?.[1]
}

describe('a tape row named for a colour is drawn in it', () => {
  const rows = [
    ...MODULES.flatMap(m => m.lessons).flatMap(l => tapes(l).map(t => [l.id, t] as const)),
    ...Object.entries(LADDERS).flatMap(([id, levels]) => levels.flatMap((lv, i) =>
      Array.from({ length: 40 }, (_, s) => tapes(lv.make(rng(7919 * (i + 1) + s))).map(t => [`${id} L${i + 1}`, t] as const)).flat())),
  ].flatMap(([where, t]) => t.rows.filter(r => COLOURS.includes(colourOf(r.label) ?? '')).map(r => [where, r] as const))

  it('finds the colour rows it is about (positive control)', () => {
    expect(rows.some(([w, r]) => w === 'g6m1-t1' && r.label === 'Red')).toBe(true)
    expect(rows.some(([w]) => w.startsWith('g6m1-t1 L'))).toBe(true)
  })

  it('every colour row, shaded or not, has its own colour', () => {
    const wrong = rows.flatMap(([where, r]) => {
      const c = colourOf(r.label)!, rule = LOOKS[c === 'grey' ? 'gray' : c], fill = fillOf(r)
      if (!rule) return [`${where} "${r.label}": no rule for ${c} in this test`]
      if (!fill) return [`${where} "${r.label}": no fill found`]
      const hex = fill.length === 4 ? '#' + [...fill.slice(1)].map(h => h + h).join('') : fill
      return rule(...(rgb(hex) as [number, number, number])) ? [] : [`${where} "${r.label}" is drawn ${fill}`]
    })
    expect([...new Set(wrong)]).toEqual([])
  })

  it('a row that is not a colour keeps the plain fill ("Oranges" is fruit)', () => {
    expect(fillOf({ label: 'Oranges', cells: [{ w: 1 }] })).toMatch(/^#fff(fff)?$/i)
    expect(fillOf({ label: 'Apples', cells: [{ w: 1, shade: true }] })).not.toMatch(/^#fff(fff)?$/i)
  })
})
