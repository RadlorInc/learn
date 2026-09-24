/**
 * THE SCRATCH PAD KEEPS THE PEN (founder, 2026-09-24): on an iPad, an Apple Pencil on the pad started a text selection
 * instead of a stroke — "it got selected, I can't write". A touch or a selection that starts on the canvas must be
 * cancelled, or iPadOS takes it. Driven on the real component; what an iPad then does with a cancelled touch is the
 * browser's, and was not measured on a device here.
 */
import { it, expect } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never
// jsdom has no canvas: a context whose every method does nothing (as in shortSessionScreens.test.ts).
const noop: object = new Proxy(() => noop, { get: (_t, k) => (k === 'canvas' ? document.createElement('canvas') : noop), apply: () => noop })
HTMLCanvasElement.prototype.getContext = (() => noop) as never

it('a touch, a selection or a long-press menu starting on the pad is cancelled', async () => {
  const { ScratchPad } = await import('@/features/lessons/ScratchPad')
  const host = document.createElement('div'); document.body.append(host)
  await act(async () => { createRoot(host).render(createElement(ScratchPad, { clearKey: 0 })) })
  const pad = host.querySelector('canvas')!
  const cancelled = (type: string) => { const e = new Event(type, { bubbles: true, cancelable: true }); pad.dispatchEvent(e); return e.defaultPrevented }
  expect(['touchstart', 'touchmove', 'selectstart', 'contextmenu'].map(cancelled)).toEqual([true, true, true, true])
  // control: the same event on a button beside it is left alone — the pad is not cancelling the whole page
  const e = new Event('touchstart', { bubbles: true, cancelable: true }); host.querySelector('button')!.dispatchEvent(e)
  expect(e.defaultPrevented).toBe(false)
})
