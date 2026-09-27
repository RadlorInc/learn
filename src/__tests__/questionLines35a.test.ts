/**
 * KG–2 questions say only what they declared — so the clips fetched when a question LOADS are all it ever plays, and
 * Josh (not the device voice) says every line after the child taps. Founder, 2026-09-27, AUDIO-ROUND2 §1.5; the why and
 * the machinery are in _questionWalk.ts, the privacy half in questionLock.test.ts.
 *
 * Group 35a: counting, numberOrdering, numberRecognition, matchingQuantities, numberComparison.
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
import { makeNestBeat, WORLDS as NEST_WORLDS, NestPlay, guidedRound as nestGuided } from '@/features/chapters/story/NestTree'
import { makePracticeCountBeat, FlyingCountPlay } from '@/features/chapters/story/world1'
import { makeCountingChapter } from '@/features/chapters/story/chapters'
import { STORYTELLINGS } from '@/features/chapters/story/biomes'
import { makeLineBeat, LineScene, GUIDED_ROUND as LINE_GUIDED } from '@/features/chapters/story/FollowTheLeader'
import { makeHomeBeat, HomeScene, GUIDED_ROUND as HOME_GUIDED } from '@/features/chapters/story/HomeTime'
import { makeCmpBeat, CompareScene, GUIDED_ROUND as CMP_GUIDED } from '@/features/chapters/story/BigOrSmall'
import { polyfillResizeObserver } from './_voiceCorpusKit'
import { draws, walk, reteachSays, rng, WALK_TIMEOUT } from './_questionWalk'

vi.setConfig({ testTimeout: WALK_TIMEOUT })

polyfillResizeObserver()

/* eslint-disable @typescript-eslint/no-explicit-any */
// `steps`: a round the child BUILDS takes more taps than the default walk makes — count up to ten, choose, Ready; send a
// line of five one Ready at a time — so those walks are longer, rather than their assertions weaker.
const CHAPTERS: { ch: string; beats: () => Beat<any>[]; steps?: number }[] = [
  { ch: 'counting', beats: () => STORYTELLINGS.map(makePracticeCountBeat), steps: 30 },
  { ch: 'numberOrdering', beats: () => [makeLineBeat()], steps: 50 },
  { ch: 'numberRecognition', beats: () => NEST_WORLDS.map(makeNestBeat) },
  { ch: 'matchingQuantities', beats: () => [makeHomeBeat()], steps: 30 },
  { ch: 'numberComparison', beats: () => [makeCmpBeat()] },
]

const DRAWS = 12, WALKS = 4

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
        expect(r.said.filter(l => !declared.includes(l)), `${ch} play`).toEqual([])
        // SkillBeat opens a scored round's question; a Play that opened its own would be a second one, on top.
        expect(log.opened, `${ch}: a scored round's Play opens no question of its own`).toEqual([])
      }
    }
    expect(said, 'positive control: some tap made the question speak').toBeGreaterThan(0)
    expect(finished, 'positive control: some walk finished the round').toBeGreaterThan(0)
  })
})

/** A guided round, rendered the way its orchestrator renders it, on the chapter's own fixed data. */
const guided = (Scene: FC<any>): FC<any> => function Guided({ data, onSubmit }) {
  return createElement(Scene, { data, mode: 'guided', onDone: onSubmit })
}
const GUIDED: { ch: string; Play: FC<any>; data: unknown; steps?: number }[] = [
  // Chapter 1's guided count is a ForestWalk beat; its data is read off the chapter each storytelling builds.
  ...STORYTELLINGS.map(story => {
    const g = makeCountingChapter(story).beats.find(b => b.kind === 'guide')
    return { ch: `counting (${story.id})`, Play: FlyingCountPlay, data: g && 'n' in g ? { n: g.n, obj: g.obj } : null, steps: 20 }
  }),
  ...NEST_WORLDS.map(world => ({ ch: `numberRecognition (${world.id})`, data: nestGuided(world),
    Play: (({ data, onSubmit }) => createElement(NestPlay, { world, data, mode: 'guided', onComplete: onSubmit })) as FC<any> })),
  { ch: 'numberOrdering', Play: guided(LineScene), data: LINE_GUIDED, steps: 40 },
  { ch: 'matchingQuantities', Play: guided(HomeScene), data: HOME_GUIDED, steps: 40 },
  { ch: 'numberComparison', Play: guided(CompareScene), data: CMP_GUIDED },
]

describe.each(GUIDED)('$ch guided round', ({ ch, Play, data, steps }) => {
  it('opens one question before it says anything, and says only what it opened', async () => {
    let said = 0, finished = 0
    for (let w = 0; w < WALKS; w++) {
      log.said.length = 0; log.opened.length = 0
      const r = await walk(Play, data, rng(100 + w), steps)
      expect(log.opened.map(o => o.after), `${ch}: one question, opened before the first line`).toEqual([0])
      said += log.said.length
      if (r.submitted) finished++
      expect(log.said.filter(l => !log.opened[0].lines.includes(l)), `${ch} guided`).toEqual([])
    }
    expect(said, 'positive control: the guided round said something').toBeGreaterThan(0)
    expect(finished, 'positive control: some walk finished the round').toBeGreaterThan(0)
  })
})
