/**
 * THE KG COUNTING PARADES FINISH UNDER REACT STRICTMODE — the demo counts to the end, the guided count and the
 * practice round let a child count every creature.
 *
 * Measured 2026-09-28: on the dev server (`reactStrictMode: true`) `/game?c=counting` sat on "Let's count
 * together!" for over 75 s with its creatures disabled; the same page with StrictMode off, and every production
 * build (database and audio failing, answering, 404ing or hanging), reached the answers in ~30 s. Two faults:
 *   · `FlyingCountDemo` guarded its effect with a plain `useRef(false)` while its cleanup cleared the step timers —
 *     StrictMode's mount → cleanup → mount left no timer running (the class `useOnceGuard` was written for, missed
 *     here because the ref was called `didInit`, not `ran`);
 *   · all three parades advanced `spawnedRef` INSIDE `setState(prev => …)`. StrictMode runs an updater twice, so
 *     each spawn was counted twice and only about half the creatures ever walked on — a child could not reach N.
 * StrictMode is dev-only, so production children were not affected; every local drive of a KG–2 chapter was.
 *
 * Each case also runs WITHOUT StrictMode, the control that the harness can finish a parade at all.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'

vi.mock('@/infra/useMiloSpeaker', async orig => ({
  ...(await orig<object>()),
  speak: vi.fn(), speakAfterCurrent: vi.fn(), speakSeq: vi.fn(() => () => {}), useIsSpeaking: () => false,
}))

const { FlyingCountDemo, FlyingCountPlay, makePracticeCountBeat } = await import('@/features/chapters/story/world1')
const { STORYTELLINGS } = await import('@/features/chapters/story/biomes')

/** Mount under (or outside) StrictMode and run the clock, tapping each enabled creature, until `done()` or 3 minutes. */
async function drive(el: React.ReactElement, strict: boolean, done: () => boolean, obj?: string) {
  vi.useFakeTimers()
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await React.act(async () => { root.render(strict ? React.createElement(React.StrictMode, null, el) : el) })
  for (let t = 0; t < 180_000 && !done(); t += 250) {
    const creature = obj && [...host.querySelectorAll<HTMLButtonElement>(`button[aria-label="${obj}"]`)].find(b => !b.disabled)
    if (creature) await React.act(async () => { creature.click() })
    await React.act(async () => { vi.advanceTimersByTime(250) })
  }
  const numbers = [...host.querySelectorAll('button')].filter(b => /^\d+$/.test(b.textContent ?? '')).length
  await React.act(async () => { root.unmount() }); host.remove()
  return { numbers }
}

afterEach(() => { vi.useRealTimers() })

describe.each([false, true])('counting parades, StrictMode %s', strict => {
  it('the demo counts all the way to 5 and hands on', async () => {
    const onDone = vi.fn()
    await drive(React.createElement(FlyingCountDemo, { to: 5, obj: 'chick', onDone }), strict, () => onDone.mock.calls.length > 0)
    expect(onDone, 'the counting demo never finished').toHaveBeenCalledTimes(1)
  })

  it('the guided count lets a child tap all 5', async () => {
    const onSubmit = vi.fn()
    await drive(React.createElement(FlyingCountPlay, { data: { n: 5, obj: 'chick' }, onSubmit }), strict, () => onSubmit.mock.calls.length > 0, 'chick')
    expect(onSubmit.mock.calls, 'the guided count could not be finished').toEqual([[true]])
  })

  it('the practice round lets a child count every creature, then asks how many', async () => {
    const beat = makePracticeCountBeat(STORYTELLINGS[0])
    const data = { ...beat.make(1, 0), n: 5 }
    let numbers = 0
    const r = await drive(React.createElement(beat.Play, { data, onSubmit: () => {} }), strict, () => numbers > 0, data.obj)
    numbers = r.numbers
    expect(numbers, 'the number choices never appeared — not every creature could be counted').toBeGreaterThan(0)
  })
})
