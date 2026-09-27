/**
 * KG–2 questions say only what they declared — so the clips fetched when a question LOADS are all it ever plays, and
 * Josh (not the device voice) says every line after the child taps. Founder, 2026-09-27, AUDIO-ROUND2 §1.5; the why and
 * the machinery are in _questionWalk.ts, the privacy half in questionLock.test.ts.
 *
 * Group 68a: numbersTo100, placeValue, compareNumbers, skipCounting, additionTo100, subtractionTo100, multiplication.
 *
 * A GUIDED round (a chapter's unscored first question) is not one of SkillBeat's, so it opens its own with `useQuestion`.
 * There the declared set is read off what the component really handed to `openQuestion` — a guided view that forgot to
 * call it opens nothing and fails here, which a declaration imported from the chapter could not show.
 */
import { describe, it, expect, vi } from 'vitest'
import { createElement, type FC } from 'react'

// Everything said and every question opened, kept across the walk's own resets: the walk measures from the first tap,
// and a guided round's ask is spoken on mount — it has to land INSIDE its question, so the order is measured too.
const log = vi.hoisted(() => ({ said: [] as string[], opened: [] as { lines: string[]; after: number }[] }))
vi.mock('@/infra/useMiloSpeaker', async (orig) => {
  const stub = (await import('./_voiceCorpusKit')).SPEAKER_STUB as Record<string, (x: unknown, ...r: unknown[]) => unknown>
  const tee = Object.fromEntries(Object.entries(stub).map(([k, f]) =>
    [k, (x: unknown, ...r: unknown[]) => { log.said.push(...[x as string | string[]].flat()); return f(x, ...r) }]))
  return { ...(await orig<object>()), ...tee }
})
vi.mock('@/infra/voiceClipPlayer', async (orig) => {
  const m = await orig<typeof import('@/infra/voiceClipPlayer')>()
  return { ...m, openQuestion: (lines: string[]) => { log.opened.push({ lines, after: log.said.length }); return m.openQuestion(lines) } }
})

import { questionLines, type Beat } from '@/features/chapters/story/StoryWorld'
import { makeNumBeat, WORLDS as NUM_WORLDS, NumberPlay, guidedRound as numGuided } from '@/features/chapters/story/NumberTown'
import { BEAT as PV_BEAT, PvRoundView, GUIDED as PV_GUIDED, slotAt as pvSlot } from '@/features/chapters/story/BuildingBlocks'
import { makeCompareBeat, ComparePlay, GUIDED as CMP_GUIDED } from '@/features/chapters/story/SeesawPark'
import { makeBeat as makeHopBeat, FetchPlay, makeFetch, RUN as HOP_RUN, DEMO_SLOTS as HOP_GUIDED_SLOT } from '@/features/chapters/story/HopAlong'
import { makeBeat as makeYardBeat, ASRoundView, guidedRound as yardGuided, slotAt as yardSlot, GUIDED_SLOT as YARD_GUIDED_SLOT } from '@/features/chapters/story/BlockYard'
import { makeMultBeat, MultPlay, GUIDED as MULT_GUIDED } from '@/features/chapters/story/MarketDay'
import { polyfillResizeObserver, seedRandom } from './_voiceCorpusKit'
import { draws, walk, reteachSays, rng, WALK_TIMEOUT } from './_questionWalk'

vi.setConfig({ testTimeout: WALK_TIMEOUT })

polyfillResizeObserver()
// The draws — and HopAlong's guided round, which is drawn afresh on every visit — are the same on every run, so a
// positive control below either holds or does not; it never holds by luck.
seedRandom(68)

/* eslint-disable @typescript-eslint/no-explicit-any */
// `steps`: a round the child BUILDS takes more taps than the default walk makes — rods and ones called up and a Done,
// a ten traded up per tap and then a pad, a frog hopping family to family and a Ready — so those walks are longer,
// rather than their assertions weaker. A two-digit pad is the costly one: a random walk types the right pair about once
// in a hundred tries (simulated: 12% of 200-tap walks finish, 23% of 400).
const CHAPTERS: { ch: string; beats: () => Beat<any>[]; steps?: number }[] = [
  { ch: 'numbersTo100', beats: () => NUM_WORLDS.map(makeNumBeat) },
  { ch: 'placeValue', beats: () => [PV_BEAT], steps: 40 },
  { ch: 'compareNumbers', beats: () => [makeCompareBeat()] },
  { ch: 'skipCounting', beats: () => [makeHopBeat()], steps: 60 },
  { ch: 'additionTo100', beats: () => [makeYardBeat('+')], steps: 200 },
  { ch: 'subtractionTo100', beats: () => [makeYardBeat('-')], steps: 200 },
  { ch: 'multiplication', beats: () => [makeMultBeat()] },
]

const DRAWS = 12, WALKS = 4

/** What the walk said that was not declared. */
const undeclared = (_ch: string, said: string[], declared: string[]) => said.filter(l => !declared.includes(l))

/**
 * MAKE builds nothing past 100 (founder, 2026-09-27): at most nine tens called up, and never more than 100 in all, so
 * every line MAKE can say is declared — there is no exception list. Driven on the real round and read off what the
 * CHAPTER SAYS on Done ("Not yet — that is …" names what was built), not off the rods drawn: the newest ten is drawn
 * travelling, and counting buttons read one short. Each burst of twenty taps lands in one React batch, before a button
 * can re-render as disabled — so the tap handlers' own limit is what is measured. Expected values written by hand.
 */
it('placeValue MAKE: a burst of twenty tens builds ninety, twenty ones then make 100, and nothing goes past it', async () => {
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'Date'] })
  try {
    const data = { ...PV_GUIDED, kind: 'make' as const }   // n = 23: every build below is wrong, so Done names it
    await React.act(async () => { root.render(React.createElement(PvRoundView, { data, slot: pvSlot(data.slot), mode: 'practice', onComplete: () => {} })) })
    await React.act(async () => { vi.advanceTimersByTime(1000) })
    const button = (label: string) => [...host.querySelectorAll('button')].find(b => b.textContent?.includes(label))!
    const burst = async (label: string) => {
      const el = button(label)
      await React.act(async () => { for (let i = 0; i < 20; i++) el.click() })
      await React.act(async () => { vi.advanceTimersByTime(1500) })
    }
    const verdict = async () => {
      log.said.length = 0
      await React.act(async () => { button('Done').click(); vi.advanceTimersByTime(1500) })
      return log.said.find(l => l.startsWith('Not yet — that is'))
    }
    await burst('A TEN')
    expect(await verdict(), 'twenty taps on A TEN put down nine tens').toBe('Not yet — that is ninety. Count the tens, then the ones.')
    expect(button('A TEN').disabled).toBe(true)
    await burst('A ONE')
    expect(await verdict(), 'and ten ones make 100 — the most there is').toBe('Not yet — that is one hundred. Count the tens, then the ones.')
    const trade = host.querySelector('button[aria-label="trade ten ones for one ten"]') as HTMLButtonElement | null
    expect(trade, 'ten ones on the ground offer a trade').not.toBeNull()
    await React.act(async () => { trade!.click(); vi.advanceTimersByTime(8000) })
    await burst('A ONE'); await burst('A TEN')
    expect(await verdict(), 'traded up into a tenth ten, it is still 100').toBe('Not yet — that is one hundred. Count the tens, then the ones.')
    expect([button('A TEN').disabled, button('A ONE').disabled], 'at 100 nothing more can be put down').toEqual([true, true])
  } finally { vi.useRealTimers(); await React.act(async () => { root.unmount() }); host.remove() }
})

describe.each(CHAPTERS)('$ch', ({ ch, beats, steps }) => {
  it('its re-teach says only lines in reteachLines(data)', async () => {
    let said = 0
    for (const beat of beats()) for (const data of draws(beat, DRAWS)) {
      const lines = await reteachSays(beat.Reteach, data)
      said += lines.length
      expect(lines.filter(l => !(beat.reteachLines?.(data) ?? []).includes(l)), `${ch} re-teach`).toEqual([])
    }
    expect(said, 'positive control: the re-teach said something').toBeGreaterThan(0)
  })

  it('playing a question says only lines in questionLines(data) — and the walk really answers', async () => {
    let said = 0, finished = 0, seed = 1
    for (const beat of beats()) for (const data of draws(beat, DRAWS)) {
      const declared = questionLines(beat, data, true)
      for (let w = 0; w < WALKS; w++) {
        log.opened.length = 0
        const r = await walk(beat.Play, data, rng(seed++), steps)
        said += r.said.length
        if (r.submitted) finished++
        expect(undeclared(ch, r.said, declared), `${ch} play`).toEqual([])
        // SkillBeat opens a scored round's question; a Play that opened its own would be a second one, on top.
        expect(log.opened, `${ch}: a scored round's Play opens no question of its own`).toEqual([])
      }
    }
    expect(said, 'positive control: some tap made the question speak').toBeGreaterThan(0)
    expect(finished, 'positive control: some walk finished the round').toBeGreaterThan(0)
  })
})

/** A guided round, rendered the way its orchestrator renders it, on the chapter's own fixed data. */
const guided = (View: FC<any>, props: Record<string, unknown> = {}): FC<any> => function Guided({ data, onSubmit }) {
  return createElement(View, { ...props, data, mode: 'guided', onComplete: onSubmit })
}
// `walks`: one fixed round gives a random walk fewer chances than a sweep of draws does, so the rounds a walk rarely
// finishes get more of them — a MAKE of 23 drifts up and away (measured: 27 walks in 200 land on 23 and press
// Done within 40 taps; simulated, more taps barely help — the build drifts further), and the pad is the lottery above.
const GUIDED: { ch: string; Play: FC<any>; data: () => unknown; steps?: number; walks?: number }[] = [
  ...NUM_WORLDS.map(world => ({ ch: `numbersTo100 (${world.id})`, Play: guided(NumberPlay, { world }), data: () => numGuided(world) })),
  { ch: 'placeValue', Play: guided(PvRoundView, { slot: pvSlot(PV_GUIDED.slot) }), data: () => PV_GUIDED, steps: 40, walks: 48 },
  { ch: 'compareNumbers', Play: guided(ComparePlay), data: () => CMP_GUIDED },
  // HopAlong draws its guided round afresh on every visit (`makeFetch` at tier 1), so each walk draws one too.
  { ch: 'skipCounting', Play: guided(FetchPlay), data: () => makeFetch(HOP_RUN[HOP_GUIDED_SLOT], 1), steps: 60 },
  ...(['+', '-'] as const).map(op => ({ ch: op === '+' ? 'additionTo100' : 'subtractionTo100',
    Play: guided(ASRoundView, { op, slot: yardSlot(op, YARD_GUIDED_SLOT) }), data: () => yardGuided(op), steps: 400, walks: 12 })),
  { ch: 'multiplication', Play: guided(MultPlay), data: () => MULT_GUIDED },
]

describe.each(GUIDED)('$ch guided round', ({ ch, Play, data, steps, walks = WALKS }) => {
  it('opens one question before it says anything, and says only what it opened', async () => {
    let said = 0, finished = 0
    for (let w = 0; w < walks; w++) {
      log.said.length = 0; log.opened.length = 0
      const r = await walk(Play, data(), rng(100 + w), steps)
      expect(log.opened.map(o => o.after), `${ch}: one question, opened before the first line`).toEqual([0])
      said += log.said.length
      if (r.submitted) finished++
      expect(undeclared(ch, log.said, log.opened[0].lines), `${ch} guided`).toEqual([])
    }
    expect(said, 'positive control: the guided round said something').toBeGreaterThan(0)
    expect(finished, 'positive control: some walk finished the round').toBeGreaterThan(0)
  })
})
