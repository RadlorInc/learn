// @vitest-environment jsdom
/**
 * A chalk letter must be INVISIBLE until the pen reaches it (reported 2026-09-20: "you see part of the drawing that's
 * supposed to come later… some small dot type"). It is held back by a dash longer than its own glyph outline, so the
 * dash has to scale with the writing: `Chalkboard` shipped a fixed 120, which only covered the default s=30.
 *
 * ⚠️ WHAT THIS ASSERTS, AND WHAT IT DOES NOT. jsdom cannot rasterise a font, so it cannot see ink. The property
 * measured in Chrome (on the real Gaegu face, at the exact t=0 state the animation paints) is: the fixed 120 left a
 * speck at s=56 and most of a "5" at s=110, and a dash of 4 x font-size was clean at 30, 40, 56 and 110. What this
 * test checks is that proxy — every letter's hiding dash is at least 4 x its own font size, whatever the mark's `s`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import type { ChalkMark } from '@/features/lessons/chalk'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Shot = { size: number; dash: number; offset: number }

async function letterFrames(marks: ChalkMark[], says: string[]): Promise<Shot[]> {
  const shots: Shot[] = []
  // jsdom has no Web Animations: stand in for it and record what each letter was told to do.
  Element.prototype.animate = function (this: Element, frames: Keyframe[] | PropertyIndexedKeyframes | null) {
    const text = this.parentElement
    if (this.tagName === 'tspan' && text) {
      const first = (frames as Keyframe[])[0]
      shots.push({
        size: Number(text.getAttribute('font-size')),
        dash: parseFloat(String(first.strokeDasharray ?? '0')),
        offset: parseFloat(String(first.strokeDashoffset ?? '0')),
      })
    }
    return { cancel() {}, finish() {} } as unknown as Animation
  } as Element['animate']
  window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia

  const { Chalkboard } = await import('@/features/lessons/Chalkboard')
  const host = document.createElement('div')
  document.body.appendChild(host)
  await act(async () => { createRoot(host).render(createElement(Chalkboard, { marks, says, shown: 1, label: 'board' })) })
  return shots
}

beforeEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })

describe('a chalk letter is hidden until the pen reaches it', () => {
  it('holds every letter back with a dash of at least 4 x its own font size', async () => {
    const sizes = [30, 40, 56, 110]
    const marks: ChalkMark[] = sizes.map((s, i) => ({ beat: 0, t: '15:08', x: 60 + i * 120, y: 200, s }))
    const shots = await letterFrames(marks, ['Look at the clock'])

    // Positive control: a silent stub and a broken render look identical from here.
    expect(shots.length, 'no letter was animated — this check is looking at nothing').toBe(sizes.length * 5)
    expect(new Set(shots.map(s => s.size))).toEqual(new Set(sizes))

    const short = shots.filter(s => s.dash < s.size * 4)
    expect(short, 'a letter this big shows a piece of itself before it is written').toEqual([])
    // and the dash must actually be shifted clear of the glyph, not just declared
    expect(shots.filter(s => s.offset !== s.dash)).toEqual([])
  })
})
