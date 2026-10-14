/**
 * The `trail` picture (g6m3-t1 Screen 1): the bike stands `done` of the way along, and the "ridden" bracket ends under
 * it, so the two brackets are in the same ratio as the two distances. A bracket that does not follow the bike would
 * draw 3.875 km of 12.5 km as any length at all.
 */
import { it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Diagram } from '@/features/lessons/Diagrams'

/** The two brackets' [left, right] x, from their `M a y V y H b V y` paths: ridden first, then the whole trail. */
const brackets = (done: number) => {
  const div = document.createElement('div')
  div.innerHTML = renderToStaticMarkup(createElement(Diagram, { p: { kind: 'trail', total: '12.5 km', done, doneLabel: '3.875 km', left: '?' } }))
  return [...div.querySelectorAll('path')]
    .map(p => /^M ([\d.]+) [\d.]+ V [\d.]+ H ([\d.]+) V/.exec(p.getAttribute('d') ?? ''))
    .filter((m): m is RegExpExecArray => !!m)
    .map(m => [Number(m[1]), Number(m[2])])
}

it('the ridden bracket is done × the whole bracket, for 3.875 km of 12.5 km', () => {
  const [ridden, whole] = brackets(0.31)
  expect(ridden[0]).toBe(whole[0])
  expect((ridden[1] - ridden[0]) / (whole[1] - whole[0])).toBeCloseTo(0.31, 5)
})

it('a different share moves the bracket with it', () => {
  const [ridden, whole] = brackets(0.75)
  expect((ridden[1] - ridden[0]) / (whole[1] - whole[0])).toBeCloseTo(0.75, 5)
})
