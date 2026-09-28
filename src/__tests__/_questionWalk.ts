/**
 * Shared machinery for the questionLines*.test.ts files. Not a test file: it drives, it asserts nothing.
 *
 * WHAT THOSE TESTS HOLD (founder, 2026-09-27; docs/decisions.md): every line a KG–2 question can say once
 * it has loaded is a line it DECLARED (`questionLines`), because the player fetches exactly those when the question
 * loads and, while it is open, asks for nothing else. A line a chapter forgot is not a request — the lock makes that
 * impossible (questionLock.test.ts) — it is Josh replaced by the device voice. So this measures the CHAPTERS:
 *   · the re-teach is RENDERED over a sweep of draws and everything it says must be in `reteachLines(data)`;
 *   · the play surface is RENDERED and driven by a seeded random walk over every element that has an onClick, and
 *     everything it says must be in `questionLines(beat, data, true)`.
 * Nothing is copied from the chapter: the component speaks its own words. A walk that says nothing is blind, so each
 * test also requires that something was said and that some walk finished the round (a positive control).
 *
 * A test file using this must stub the speaker IN ITS OWN FILE (vi.mock is per file):
 *   vi.mock('@/infra/useMiloSpeaker', async (orig) =>
 *     ({ ...(await orig<object>()), ...(await import('./_voiceCorpusKit')).SPEAKER_STUB }))
 */
import { vi } from 'vitest'
import type { Beat } from '@/features/chapters/story/StoryWorld'
import { spoken } from './_voiceCorpusKit'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** The draws `SkillBeat` would make: every tier, every round, the coverage list growing. */
export function draws<T>(beat: Beat<T>, n: number): T[] {
  const cov = beat.coverage?.all ?? [], out: T[] = []
  for (let i = 0; i < n; i++) {
    try { const d = beat.make(((i % 3) + 1) as 1 | 2 | 3, i % beat.rounds, cov.slice(0, i % (cov.length + 1))); if (d != null) out.push(d) } catch { /* skip */ }
  }
  return out
}

/** Every element React gave an onClick to (React keeps handlers off the DOM, so read its props). */
export function clickables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('*')].filter(el => {
    const k = Object.keys(el).find(x => x.startsWith('__reactProps$'))
    const p = k ? (el as any)[k] : null
    return p && typeof p.onClick === 'function' && !p.disabled && !(el as HTMLButtonElement).disabled
  })
}

async function mount(el: React.ReactElement): Promise<{ host: HTMLElement; unmount: () => Promise<void> }> {
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await React.act(async () => { root.render(el) })
  return { host, unmount: async () => { try { await React.act(async () => { root.unmount() }) } catch { /* ignore */ } host.remove() } }
}

/**
 * ⚠️ ONE WALK AT A TIME, OR AN HONEST ERROR. A test that times out does not stop its walk: it keeps running, and the
 * stubbed speaker is one shared list, so its lines landed in the NEXT test and failed that test naming the wrong chapter
 * (measured 2026-09-27 on a loaded machine: 6 timeouts → 11 assertion failures, all in chapters that pass alone). So a
 * walk that starts while another is still running refuses, saying why — "could not look", never a false "found".
 */
let busy = ''
function claim(what: string): () => void {
  if (busy) throw new Error(`${what}: a previous walk (${busy}) is still running — it outlived its test's timeout, so its lines would be measured here. Look at the earlier timeout, not at this chapter.`)
  busy = what
  return () => { busy = '' }
}

/** Per walk-test file: the walks are real renders under fake time, and a loaded machine (the full suite in parallel)
 *  runs them several times slower than alone — heaviest alone ≈ 13 s. Each file sets this with `vi.setConfig`. */
export const WALK_TIMEOUT = 300_000

/** How many empty-screen settles (2.5 s each) a walk waits through before it stops. */
const MAX_IDLE = 4

/** Let animations, flights and delayed lines run (fake timers are on in the walk). */
async function settle(ms = 2500) {
  const React = await import('react')
  for (let t = 0; t < ms; t += 250) await React.act(async () => { vi.advanceTimersByTime(250) })
}

/**
 * Play one question: mount `Play`, then up to `steps` random taps until it submits. `rand` is seeded by the caller.
 * Returns what was said after the question loaded, and whether the round finished.
 */
export async function walk(Play: React.FC<any>, data: unknown, rand: () => number, steps = 14, extraProps: Record<string, unknown> = {}) {
  const React = await import('react')
  let submitted = false
  const said: string[] = []
  const release = claim('walk')
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'Date'] })
  try {
    const { host, unmount } = await mount(React.createElement(Play, { data, onSubmit: () => { submitted = true }, ...extraProps }))
    await settle(600)
    spoken.length = 0   // the round's opening lines are the prompt's business; measure from the first tap
    for (let i = 0, idle = 0; i < steps && !submitted; i++) {
      const els = clickables(host)
      // A child can also WAIT: several rounds report only after their creatures have walked off, with nothing to tap in
      // between (BigOrSmall's guided round: nothing tappable from 1.0 s after Ready, onDone at 3.9 s). So an empty
      // screen is waited on — up to MAX_IDLE settles — before the walk gives up; it does not end the walk at once.
      if (!els.length) { if (++idle > MAX_IDLE) break; await settle(); continue }
      idle = 0
      const el = els[Math.floor(rand() * els.length)]
      await React.act(async () => { el.click() })
      await settle()
    }
    said.push(...spoken)
    await unmount()
  } finally { vi.useRealTimers(); release() }
  return { said, submitted }
}

/** Render the re-teach for `data` and return everything it said. */
export async function reteachSays(Reteach: React.FC<any>, data: unknown, extraProps: Record<string, unknown> = {}) {
  const React = await import('react')
  const release = claim('re-teach')
  spoken.length = 0
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'Date'] })
  try {
    const { unmount } = await mount(React.createElement(Reteach, { data, onDone: () => {}, ...extraProps }))
    await settle(4000)
    const said = [...spoken]
    await unmount()
    return said
  } finally { vi.useRealTimers(); release() }
}

/** mulberry32, for a walk that is the same on every run. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
