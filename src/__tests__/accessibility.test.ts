/**
 * TWO ADA BASICS THAT CAN BE HELD WITHOUT A BROWSER (2026-09-28, the "$100,000 vibe-coded app" reel:
 * "can't be used with a keyboard, and no alt text" — ADA web suits, most against small companies).
 *
 *  1. Pinch-zoom is allowed. `maximumScale: 1` + `userScalable: false` shipped with the first commit
 *     and fail WCAG 1.4.4; axe flagged it on every page.
 *  2. A lesson's scratch picture ("Tap the picture to add one") is a role="button" that a keyboard can
 *     focus and press. It was announced as a button and was not in the Tab order at all.
 *
 * The rest of the sweep needs a real browser — axe on the public pages, text fields ≥ 16px, a visible
 * focus ring, painting Rainbow Town from the keyboard — and is `e2e/a11y.spec.ts`.
 */
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { viewport } from '@/app/layout'
import { Pic } from '@/features/lessons/Pictures'

describe('accessibility', () => {
  it('the page can be pinch-zoomed (WCAG 1.4.4)', () => {
    expect(viewport.userScalable, 'userScalable: false blocks zoom').not.toBe(false)
    expect(viewport.maximumScale ?? 10, 'a maximumScale under 2 blocks zoom').toBeGreaterThanOrEqual(2)
  })

  it('the scratch picture is in the Tab order and Enter / Space press it', async () => {
    const onTap = vi.fn()
    const host = document.createElement('div'); document.body.appendChild(host)
    const root = createRoot(host)
    await React.act(async () => { root.render(React.createElement(Pic, { p: { kind: 'groups', groups: 3, each: 5, obj: 'cookie' }, scratch: { taps: 0, onTap } })) })
    const pic = host.querySelector<HTMLElement>('[role="button"]')
    expect(pic, 'no role="button" rendered — this test is looking at the wrong thing').not.toBeNull()
    expect(pic!.tabIndex, 'a role="button" that Tab cannot reach').toBe(0)
    for (const key of ['Enter', ' ']) await React.act(async () => { pic!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) })
    expect(onTap).toHaveBeenCalledTimes(2)
    await React.act(async () => { root.unmount() }); host.remove()
  })
})
