/**
 * The founder's 17 Oct list, items 9 and 10, in the real LessonPlayer driven like a child. (9) Screen 1's closing
 * question stays above the board on the screens after it. (10) ⏸ / ▶ / ↻ on every teaching screen: ⏸ stops her voice
 * AND the chalk, ▶ goes on from the line she was on, and a child who touched the controls is not pulled forward.
 * The speaker is stubbed (a test decides when her voice ends); the board's Web Animations are a fake that records
 * pause / play / cancel, because jsdom has none.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

type Run = { lines: string[]; onStep?: (i: number) => void; onDone?: () => void; stopped: boolean }
const { runs } = vi.hoisted(() => ({ runs: [] as Run[] }))
vi.mock('@/infra/useMiloSpeaker', () => ({
  speak: () => {}, stopSpeech: () => {},
  speakSteps: (lines: string[], opts: Omit<Run, 'lines' | 'stopped'>) => {
    const run: Run = { ...opts, lines, stopped: false }; runs.push(run)
    return () => { run.stopped = true }
  },
}))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {}, prefetchClips: () => {}, setClipRate: () => {} }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, syncModulePractice: () => {} }))
vi.mock('@/features/lessons/ScratchPad', () => ({ ScratchPad: () => null }))

import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { findLesson } from '@/features/lessons/modules'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const lesson = findLesson('g5m1-t1')!.lesson

// A fake Web Animations API: every animation the board starts, and what was done to it.
type Anim = { el: Element; state: 'running' | 'paused' | 'cancelled' }
let anims: Anim[] = []
const live = (root: Element, subtree: boolean) => anims.filter(a => a.state !== 'cancelled' && (a.el === root || (subtree && root.contains(a.el))))
const fake = (a: Anim) => ({ pause: () => { a.state = 'paused' }, play: () => { a.state = 'running' }, cancel: () => { a.state = 'cancelled' } })

let host: HTMLDivElement, root: Root
beforeEach(async () => {
  vi.useFakeTimers(); runs.length = 0; anims = []
  Element.prototype.animate = function (this: Element) { const a: Anim = { el: this, state: 'running' }; anims.push(a); return fake(a) as unknown as Animation }
  Element.prototype.getAnimations = function (this: Element, o?: { subtree?: boolean }) { return live(this, !!o?.subtree).map(fake) as unknown as Animation[] }
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(createElement(LessonPlayer, { lesson, onFinish: () => {}, onExit: () => {} })) })
})
afterEach(() => {
  act(() => root.unmount()); host.remove(); vi.useRealTimers()
  delete (Element.prototype as Partial<Element>).animate; delete (Element.prototype as Partial<Element>).getAnimations
})

const screen = () => Number(host.textContent?.match(/Screen (\d) of 9/)?.[1])
const button = (label: RegExp) => [...host.querySelectorAll('button')].find(x => label.test(x.textContent ?? ''))
const tap = (label: RegExp) => act(async () => {
  const b = button(label)
  if (!b) throw new Error(`no button ${label} — have: ${[...host.querySelectorAll('button')].map(x => x.textContent).join(' | ')}`)
  b.click()
})
const wait = async (ms: number) => { for (let t = 0; t < ms; t += 250) await act(async () => { vi.advanceTimersByTime(250) }) }
const question = () => host.querySelector('[data-question]')?.textContent

it('(9) Screen 1\'s closing question stays above the board on the screens after it', async () => {
  expect(question()).toBeUndefined()                                // on Screen 1 it is the button itself
  await tap(/Let's see/)
  for (let i = 2; i <= 7; i++) {
    expect(screen()).toBe(i)
    expect(question()).toBe('How many pencils are in a carton?')
    await tap(/^Next$/)
  }
})

it('(10) ⏸ stops her voice and the chalk; ▶ goes on from the line she was on; the screen is not pulled forward', async () => {
  await tap(/Let's see/)
  expect(screen()).toBe(2)
  const first = runs.at(-1)!
  expect(first.lines).toHaveLength(3)
  await act(async () => { first.onStep!(1) })                       // she is on her second line
  expect(live(host, true).some(a => a.state === 'running')).toBe(true)   // the board is drawing it

  await tap(/Pause/)
  expect(first.stopped).toBe(true)                                   // her voice stopped…
  expect(live(host, true).filter(a => a.state !== 'paused')).toEqual([])  // …and so did every stroke on the board
  const runsAtPause = runs.length
  await wait(60_000)
  expect(runs.length).toBe(runsAtPause)                              // nothing started talking again on its own
  expect(screen()).toBe(2)

  await tap(/Play/)
  expect(runs.length).toBe(runsAtPause + 1)                          // one new run, not a loop
  expect(runs.at(-1)!.lines).toEqual([
    "That works. But it takes a while, and it's easy to lose count.",
    "Is there a faster way? Yes. It's in this chart of places.",
  ])
  expect(live(host, true).filter(a => a.state === 'paused')).toEqual([])  // the board moves again
  await act(async () => { runs.at(-1)!.onDone!() })
  await wait(60_000)
  expect(screen()).toBe(2)                                           // the child took the controls: they decide when to go on
  await tap(/^Next$/)
  expect(screen()).toBe(3)
})

it('(10) ↻ starts the screen over from her first line', async () => {
  await tap(/Let's see/)
  await act(async () => { runs.at(-1)!.onStep!(2) })
  const before = runs.length
  await tap(/Replay/)
  expect(runs.length).toBe(before + 1)
  expect(runs.at(-1)!.lines).toEqual([
    'You could add 40, ten times.',
    "That works. But it takes a while, and it's easy to lose count.",
    "Is there a faster way? Yes. It's in this chart of places.",
  ])
})

it('(10) the controls are on every teaching screen, each at least 44 px', async () => {
  for (let i = 1; i <= 7; i++) {
    expect(screen()).toBe(i)
    const group = host.querySelector('[role="group"][aria-label="Lesson controls"]')
    const btns = [...(group?.querySelectorAll('button') ?? [])]
    expect(btns.map(b => b.textContent)).toEqual(['⏸ Pause', '↻ Replay'])
    for (const b of btns) { expect(b.style.minHeight).toBe('44px'); expect(b.style.minWidth).toBe('44px') }
    await tap(i === 1 ? /Let's see/ : /^Next$/)
  }
})
