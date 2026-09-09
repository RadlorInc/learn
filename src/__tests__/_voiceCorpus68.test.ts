/**
 * Measure the 6–8 spoken corpus. Same reason as the 3–5 and 9–11 drivers: a storybook chapter
 * builds its line from the round's own numbers, so it is not a literal anywhere.
 *
 *   VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpus68.test.ts
 *
 * Reporting only — writes scripts/.voice-corpus-6-8.json plus a `.holes.txt` sidecar. It DOES
 * render (see `fromReteach`), but changes nothing and asserts only that no chapter went missing.
 *
 * ⚠️⚠️ IT USED TO COUNT ONLY `scored`, WHICH IS WHY THIS BAND READ AS "0 EXPLANATION LEFT" WHEN THE
 * TRUTH WAS "NEVER COUNTED". Measured 2026-09-05: the 3–5 driver hand-drives every chapter's demo
 * and re-teach builders and reports 126 teach + 577 reteach lines; this one drove `beat.say` and
 * nothing else, so 6–8's whole explanation surface was missing from the corpus and the two bands'
 * numbers were not comparable. The fix RENDERS `beat.Reteach` with a stubbed speaker and records
 * what it actually says — see the note on `fromReteach`.
 *
 * ⚠️⚠️ ITS NUMBER IS A FLOOR TWICE OVER, and must be quoted as ">=" both times.
 *   1. The SCORED half still reaches only 9 of the band's 12 chapters. `placeValue`,
 *      `additionTo100`, `subtractionTo100` and `money` return an EMPTY `prompt` on purpose — their
 *      play surface states the question itself (chapter-craft.md: two pills saying the same thing is
 *      a duplicate, not a fallback) — so their scored lines live in their components and nothing at
 *      the beat surface can see them. They are missing, not empty.
 *      ⚠️ The RE-TEACH half reaches all twelve, because it renders rather than reading the beat.
 *   2. 1,500 draws is a sample, not the generator's space; whole-line counts keep climbing with
 *      the sweep while templates and literal runs saturate (see _voiceCorpusTeen.test.ts).
 */
import { it, vi, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { clipKey } from '@/core/voiceClips'
import { PRAISE } from '@/core/praise'
import { ENCOURAGEMENT } from '@/shared/hooks/useAdaptive'
import type { Beat } from '@/features/chapters/story/StoryWorld'
import { makeNumBeat, WORLDS as NUM_WORLDS } from '@/features/chapters/story/NumberTown'
import { BEAT as PLACE_VALUE_BEAT } from '@/features/chapters/story/BuildingBlocks'
import { makeCompareBeat } from '@/features/chapters/story/SeesawPark'
import { makeBeat as makeHopBeat } from '@/features/chapters/story/HopAlong'
import { makeBeat as makeYardBeat } from '@/features/chapters/story/BlockYard'
import { makeMultBeat } from '@/features/chapters/story/MarketDay'
import { makeFrBeat } from '@/features/chapters/story/SliceShop'
import { makeStoryBeat } from '@/features/chapters/story/StoryTime'
import { BEAT as MONEY_BEAT } from '@/features/chapters/story/CoinShop'
import { makeTimeBeat } from '@/features/chapters/story/TickTock'
import { makeShapeBeat, WORLDS as SHAPE_WORLDS } from '@/features/chapters/story/ShapeStudio'

/**
 * ⚠️ THE RE-TEACH IS CAPTURED BY RENDERING IT, NOT BY COPYING ITS TEMPLATES INTO THIS FILE.
 *
 * Every 6–8 chapter builds its explanation INSIDE its Explain component — `const lines = [...]`
 * in a `useEffect`, handed straight to `speakSteps`. Nothing is exported, so the obvious fix is to
 * pull each one out into a pure function and drive that. It was tried and thrown away: the
 * component pairs `lines[i]` with `steps[i]`, so splitting them lets the words and the visual
 * reveal drift apart silently, in twelve chapters, to make a REPORTING script easier.
 *
 * Rendering the component with the speaker stubbed has neither cost. It records exactly what the
 * chapter says — no second copy of a template to drift, no app change at all — and it keeps working
 * when somebody rewords a line. `beat.Reteach` is already part of the Beat contract, so this needs
 * nothing new from a chapter.
 *
 * ⚠️ It captures the RE-TEACH, which is the same component the opening demo uses in most of this
 * band — but where a chapter's demo passes different props (ShapeTown's `place`, BeadShop's
 * `place`), those extra lines are still missing. Another floor, not a total.
 */
/**
 * ⚠️ jsdom HAS NO ResizeObserver, AND THREE CHAPTERS WOULD NOT MOUNT WITHOUT ONE. `FitBox`/`FitSlot`
 * size themselves from it, so ShapeStudio, SeesawPark and MarketDay threw on render — and with the
 * throw swallowed they read as "this chapter's re-teach says nothing", which is how a quarter of the
 * band went missing from a run that reported success. It reports a plausible box once so the mount
 * completes; nothing here measures layout, only what is SAID.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe(t: Element) {
      const r = { width: 800, height: 450, top: 0, left: 0, bottom: 450, right: 800, x: 0, y: 0 }
      this.cb([{ target: t, contentRect: r as DOMRectReadOnly } as ResizeObserverEntry], this)
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

const spoken: string[] = []
const silent = new Set<string>()
const fails = new Map<string, string>()
vi.mock('@/infra/useMiloSpeaker', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  speakSteps: (l: string[]) => { spoken.push(...l); return () => {} },
  speakPaced: (l: string[]) => { spoken.push(...l); return () => {} },
  speakSeq: (l: string[]) => { spoken.push(...l); return () => {} },
  speak: (l: string) => { spoken.push(l) },
  speakAfterCurrent: (l: string) => { spoken.push(l) },
  speakAt: (l: string) => { spoken.push(l) },
}))

/* eslint-disable @typescript-eslint/no-explicit-any */
const lines = new Map<string, { text: string; kind: string; chapter: string }>()
const add = (chapter: string, kind: string, ...texts: (string | undefined)[]) => {
  for (const raw of texts) {
    if (typeof raw !== 'string') continue
    const text = raw.replace(/\s+/g, ' ').trim()
    if (!text || !/[a-zA-Z]/.test(text) || text.length > 300) continue
    if (!lines.has(clipKey(text))) lines.set(clipKey(text), { text, kind, chapter })
  }
}

/** Render this chapter's re-teach over a sweep of rounds and keep every line it speaks. */
async function fromReteach(chapter: string, beat: Beat<any>) {
  if (!beat.Reteach) { silent.add(chapter + ' (declares no Reteach)'); return }
  let got = 0
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { act } = await import('react')
  const cov = beat.coverage?.all ?? []
  for (let i = 0; i < RETEACH_DRAWS; i++) {
    const d = ((i % 3) + 1) as 1 | 2 | 3
    let data: any
    try { data = beat.make(d, i % beat.rounds, cov.slice(0, i % (cov.length + 1))) } catch { continue }
    if (data == null) continue
    spoken.length = 0
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    try {
      await act(async () => { root.render(React.createElement(beat.Reteach!, { data, onDone: () => {} })) })
      add(chapter, 'reteach', ...spoken)
      if (spoken.length) got++
    } catch (e) { fails.set(chapter, String(e).split('\n')[0].slice(0, 160)) }
    try { await act(async () => { root.unmount() }) } catch {}
    host.remove()
  }
  // ⚠️ A CHAPTER THAT YIELDS NOTHING IS THE FINDING, NOT A BLANK. Swallowed, a component that
  // cannot mount headlessly is indistinguishable from one that simply says nothing — and the first
  // run of this sweep had three of those (ShapeStudio, SeesawPark, MarketDay) reading as clean.
  if (!got) silent.add(chapter + (fails.has(chapter) ? ' — ' + fails.get(chapter) : ' — mounted, said nothing'))
}

function fromBeat(chapter: string, beat: Beat<any>) {
  const cov = beat.coverage?.all ?? []
  for (let i = 0; i < Number(process.env.VOICE_DRAWS ?? 1500); i++) {
    const d = ((i % 3) + 1) as 1 | 2 | 3
    let data: any
    try { data = beat.make(d, i % beat.rounds, cov.slice(0, i % (cov.length + 1))) } catch { continue }
    if (data == null) continue
    try { add(chapter, 'scored', (beat.say ?? beat.prompt)(data)) } catch { /* prompt may need render state */ }
  }
}

/** Rendering is far dearer than calling a generator, so the re-teach gets its own, smaller sweep. */
const RETEACH_DRAWS = Number(process.env.VOICE_RETEACH_DRAWS ?? 120)

it('measures the 6–8 corpus', async () => {
  if (!process.env.VOICE_CORPUS) return
  add('shared', 'scored', ...PRAISE, ...ENCOURAGEMENT.flat())   // 6–8 hears praise (praisesOnCorrect)
  const CH: [string, () => Beat<any>][] = [

    ['placeValue', () => PLACE_VALUE_BEAT],
    ['compareNumbers', () => makeCompareBeat()],
    ['skipCounting', () => makeHopBeat()],
    ['additionTo100', () => makeYardBeat('+' as any)],
    ['subtractionTo100', () => makeYardBeat('-' as any)],
    ['multiplication', () => makeMultBeat()],
    ['fractions', () => makeFrBeat()],
    ['storyProblems', () => makeStoryBeat()],
    ['money', () => MONEY_BEAT],
    ['time', () => makeTimeBeat()],

  ]
  // ⚠️ These two are per-WORLD: a different world is a different set of spoken lines, so every
  // world has to be driven or the chapter is counted at a fraction of its real size.
  for (const w of NUM_WORLDS) fromBeat('numbersTo100', makeNumBeat(w))
  for (const w of SHAPE_WORLDS) fromBeat('shapes2d3d', makeShapeBeat(w))

  for (const [name, mk] of CH) {
    try { fromBeat(name, mk()) } catch (e) { console.warn(`skip ${name}: ${e}`) }
  }
  // ⚠️ THE RE-TEACH, WHICH IS WHAT THIS DRIVER USED TO MISS ENTIRELY. Driven for every chapter,
  // including the four whose `prompt` is empty — a chapter that says nothing at the beat surface
  // still explains itself when a child gets three wrong.
  for (const w of NUM_WORLDS) await fromReteach('numbersTo100', makeNumBeat(w))
  for (const w of SHAPE_WORLDS) await fromReteach('shapes2d3d', makeShapeBeat(w))
  for (const [name, mk] of CH) {
    try { await fromReteach(name, mk()) } catch (e) { console.warn(`skip reteach ${name}: ${e}`) }
  }
  // ⚠️ TO A FILE, NOT `console.warn` — vitest swallows a reporter's own output, so a warning
  // printed here is a warning nobody reads, which is the same as none (chapter-craft.md §4).
  const out = process.env.VOICE_OUT ?? 'scripts/.voice-corpus-6-8.json'
  writeFileSync(out.replace(/\.json$/, '') + '.holes.txt',
    silent.size
      ? 'chapters whose re-teach yielded NOTHING — each is a hole in this corpus:\n  ' + [...silent].join('\n  ') + '\n'
      : 'no holes: every chapter\u2019s re-teach mounted and spoke.\n')
  /**
   * ⚠️ A HOLE IS A FAILURE, NOT A FOOTNOTE. Written only to the sidecar it is a warning nobody
   * reads — and this driver's whole history is a number that looked complete while a quarter of the
   * band was missing from it. A corpus run that could not reach a chapter must go RED, so nobody
   * renders against a total that silently excludes three chapters.
   */
  expect([...silent], 'a chapter\u2019s re-teach yielded nothing — this corpus is short by that chapter').toEqual([])
  writeFileSync(out,
    JSON.stringify([...lines.entries()].map(([key, v]) => ({ key, chars: v.text.length, ...v })), null, 2))
})
