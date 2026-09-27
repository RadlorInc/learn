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
import { readFileSync } from 'node:fs'
import { clipKey, clipCheck } from '@/core/voiceClips'

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

/**
 * Lines a child can reach that NO finite declaration covers, each with why. ⚠️ An entry can only excuse a line with no
 * recorded clip in the chapter's index — so it never excuses a line Josh recorded and the chapter forgot to declare;
 * those stay red. It exists to say out loud what the chapter can reach, not to make the walk quieter.
 */
const NO_CLIP: Record<string, { re: RegExp; why: string }> = {
  placeValue: {
    re: /^Not yet — that is (one hundred|\d{3,})\. Count the tens, then the ones\.$/,
    why: 'MAKE names whatever was built and `callRod` has no cap — a tenth rod builds 100, a twelfth 120. Clips exist '
      + 'for 0–99 only, which is what is declared; past that the device voice says it, declared or not. A nine-rod cap '
      + 'on the tens shelf would make this entry deletable (the founder\'s call: it changes what a child can build).',
  },
}
const index = (ch: string): Record<string, [string, string]> =>
  JSON.parse(readFileSync(`src/features/chapters/voice-index/${ch}.json`, 'utf8'))
const hasClip = (ch: string, l: string) => index(ch)[clipKey(l)]?.[1] === clipCheck(l)
/** What the walk said that was not declared, less what NO_CLIP excuses — and an excuse for a recorded line is itself a failure. */
function undeclared(ch: string, said: string[], declared: string[]): string[] {
  const miss = said.filter(l => !declared.includes(l))
  const excused = miss.filter(l => NO_CLIP[ch]?.re.test(l))
  expect(excused.filter(l => hasClip(ch, l)), `${ch}: NO_CLIP excused a line that HAS a clip — declare it`).toEqual([])
  return miss.filter(l => !excused.includes(l))
}

it('NO_CLIP can see a clip: a declared MAKE verdict has one, and the first excused value does not', () => {
  // positive control — a blind `hasClip` would excuse anything the pattern matches, recorded or not
  expect(hasClip('placeValue', 'Not yet — that is forty-seven. Count the tens, then the ones.')).toBe(true)
  expect(hasClip('placeValue', 'Not yet — that is one hundred. Count the tens, then the ones.')).toBe(false)
  expect(NO_CLIP.placeValue.re.test('Not yet — that is one hundred. Count the tens, then the ones.')).toBe(true)
  expect(NO_CLIP.placeValue.re.test('Not yet — that is forty-seven. Count the tens, then the ones.')).toBe(false)
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
