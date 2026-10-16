/**
 * A word in capitals in a lesson line is its stress. On screen it is bold lowercase (capitalised at a sentence's start),
 * never capitals: a tester read "Don't take 25% OF the $15" as a typo (g6m4-t4). Expected markup written by hand.
 */
import { it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { emphasis } from '@/features/lessons/LessonPlayer'

const html = (t: string) => renderToStaticMarkup(createElement('p', null, ...emphasis(t)))

it('a stressed word mid-sentence is bold lowercase', () => {
  expect(html("Don't take 25% OF the $15.")).toBe("<p>Don&#x27;t take 25% <b>of</b> the $15.</p>")
})
it('at the start of a sentence it keeps its capital letter', () => {
  expect(html('STOP. Look again. NOT the 8.')).toBe('<p><b>Stop</b>. Look again. <b>Not</b> the 8.</p>')
})
it('AM and PM stay, and a line with no capitals is unchanged', () => {
  expect(html('At 7 AM, add 2 hours.')).toBe('<p>At 7 AM, add 2 hours.</p>')
})
