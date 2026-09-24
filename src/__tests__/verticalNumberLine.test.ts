/**
 * REVIEW 1, Q7 (founder, 2026-09-24): a vertical number line, −10 to 10, beside the scratch pad on the eight topics of
 * Grade 7 Module 2 (signed numbers) — and nowhere else. Hidden until asked for; every number a named button; a mark is
 * a dot + aria-pressed + a changed name, never colour alone; a new problem clears the marks.
 * ⚠️ The topic list and every label are written out here, never imported.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never
const noop: object = new Proxy(() => noop, { get: (_t, k) => (k === 'canvas' ? document.createElement('canvas') : noop), apply: () => noop })
HTMLCanvasElement.prototype.getContext = (() => noop) as never

const { PracticeLayout } = await import('@/features/lessons/PracticeLayout')
const { VERTICAL_LINE_TOPICS } = await import('@/features/lessons/VerticalNumberLine')
const { MODULES } = await import('@/features/lessons/modules')

const TOPICS = ['g7m2-t1', 'g7m2-t2', 'g7m2-t3', 'g7m2-t4', 'g7m2-t5', 'g7m2-t6', 'g7m2-t7', 'g7m2-t8']
const LABELS = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', '−1', '−2', '−3', '−4', '−5', '−6', '−7', '−8', '−9', '−10']

let host: HTMLDivElement, root: Root
async function mount(topic: string, padKey = 0) {
  if (!host) { host = document.createElement('div'); document.body.append(host); root = createRoot(host) }
  await act(async () => { root.render(createElement(PracticeLayout, { corner: 'c', crumb: 'x', title: 'Problem 1', onExit: () => {}, pad: true, padKey, topic }, createElement('p', null, 'q'))) })
}
const toggle = () => [...host.querySelectorAll('button')].find(b => b.getAttribute('aria-controls') === 'pr-vline')
const numbers = () => [...host.querySelectorAll('[role="group"][aria-label="Number line"] li button')] as HTMLButtonElement[]
const click = async (b: HTMLElement | undefined) => { expect(b).toBeTruthy(); await act(async () => { b!.click() }) }

beforeEach(() => { document.body.innerHTML = ''; host = undefined as never })

describe('the vertical number line', () => {
  it('is offered on exactly the eight signed-number topics, and they are real topics', () => {
    expect([...VERTICAL_LINE_TOPICS].sort()).toEqual(TOPICS)
    const all = new Set(MODULES.flatMap(m => m.lessons.map(l => l.id)))
    expect(TOPICS.filter(t => !all.has(t)), 'control: every one exists').toEqual([])
  })

  it('a signed-number topic: hidden until asked for; then 10 at the top down to −10, every number a named button', async () => {
    await mount('g7m2-t3')
    expect(toggle()?.getAttribute('aria-expanded')).toBe('false')
    expect(numbers()).toHaveLength(0)
    await click(toggle())
    expect(toggle()?.getAttribute('aria-expanded')).toBe('true')
    expect(numbers().map(b => b.textContent)).toEqual(LABELS)
    expect(numbers().map(b => b.getAttribute('aria-label'))).toEqual(LABELS.map(n => `Mark ${n}`))
  })

  it('a tap marks a number (dot, pressed, a new name); a second tap and Clear marks take it off; a new problem clears', async () => {
    await mount('g7m2-t1'); await click(toggle())
    const at = (n: string) => numbers()[LABELS.indexOf(n)]
    await click(at('−3'))
    expect(at('−3').getAttribute('aria-pressed')).toBe('true')
    expect(at('−3').getAttribute('aria-label')).toBe('Take the mark off −3')
    await click(at('−3'))
    expect(at('−3').getAttribute('aria-pressed')).toBe('false')
    await click(at('4')); await click(at('−4'))
    await click([...host.querySelectorAll('button')].find(b => b.textContent === 'Clear marks'))
    expect(numbers().filter(b => b.getAttribute('aria-pressed') === 'true')).toHaveLength(0)
    await click(at('2'))
    await mount('g7m2-t1', 1)
    expect(numbers().filter(b => b.getAttribute('aria-pressed') === 'true')).toHaveLength(0)
  })

  it('any other topic: no number line at all', async () => {
    for (const t of ['g5m1-t1', 'g6m5-t9', 'g8m1-t4', 'g7m3-t1']) {
      await mount(t)
      expect(toggle(), t).toBeUndefined()
    }
  })
})
