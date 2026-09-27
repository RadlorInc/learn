/**
 * KG–2 questions say only what they declared — so the clips fetched when a question LOADS are all it ever plays, and
 * Josh (not the device voice) says every line after the child taps. Founder, 2026-09-27, AUDIO-ROUND2 §1.5; the why and
 * the machinery are in _questionWalk.ts, the privacy half in questionLock.test.ts.
 *
 * Group 68b: fractions, storyProblems, money, time, shapes2d3d.
 *
 * Each chapter's GUIDED round (unscored, outside SkillBeat) opens its own question with `useQuestion`. It is walked too,
 * and measured against what it really handed to `openQuestion` — recorded by the stub below — rather than against a
 * list this file rebuilt, so a guided round that forgets a line goes red here.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/infra/useMiloSpeaker', async (orig) =>
  ({ ...(await orig<object>()), ...(await import('./_voiceCorpusKit')).SPEAKER_STUB }))
const opened = vi.hoisted(() => [] as string[])
vi.mock('@/infra/voiceClipPlayer', async (orig) =>
  ({ ...(await orig<object>()), openQuestion: (texts: string[], answers?: { lines: string[] }) => { opened.push(...texts, ...(answers?.lines ?? [])); return () => {} } }))

import { questionLines, type Beat } from '@/features/chapters/story/StoryWorld'
import { makeFrBeat, FrPlay, GUIDED as FR_GUIDED } from '@/features/chapters/story/SliceShop'
import { makeStoryBeat, StoryPlay, GUIDED as STORY_GUIDED } from '@/features/chapters/story/StoryTime'
import { BEAT as MONEY_BEAT, CoinRound, GUIDED as MONEY_GUIDED, stallAt } from '@/features/chapters/story/CoinShop'
import { makeTimeBeat, TimePlay, GUIDED as TIME_GUIDED } from '@/features/chapters/story/TickTock'
import { makeShapeBeat, ShapePlay, guidedFor, WORLDS as SHAPE_WORLDS } from '@/features/chapters/story/ShapeStudio'
import { polyfillResizeObserver, seedRandom } from './_voiceCorpusKit'
import { draws, walk, reteachSays, rng, WALK_TIMEOUT } from './_questionWalk'

vi.setConfig({ testTimeout: WALK_TIMEOUT })

polyfillResizeObserver()
// StoryTime shuffles its choices and CoinShop / ShapeStudio draw their rounds with Math.random: seeded, so a red here
// is the same red on the next run.
seedRandom(68)

/* eslint-disable @typescript-eslint/no-explicit-any */
/** A guided round as the walk drives it: the chapter's own play component in guided mode, on its fixed data. */
const guided = (C: React.FC<any>, data: unknown, props: Record<string, unknown> = {}) =>
  ({ data, Play: ({ onSubmit }: { onSubmit: () => void }) => React.createElement(C, { ...props, data, mode: 'guided', onComplete: onSubmit }) })

/**
 * `steps`: a random walk rarely finishes these in the harness's default 14 taps. CoinShop answers by building a till —
 * the exact price out of loose coins, then Pay. A guided round is a few fixed rounds, so each one has to be finished by
 * chance: TickTock's guided read is eight o'clock, four hour taps back from the twelve its dial starts on, with Say it
 * one button in six (its guided SET, nine o'clock on a twelve-stop minute ring, is out of a random walk's reach).
 */
const CHAPTERS: { ch: string; beats: () => Beat<any>[]; guided: () => ReturnType<typeof guided>[]; steps?: number }[] = [
  { ch: 'fractions', beats: () => [makeFrBeat()], guided: () => FR_GUIDED.map(d => guided(FrPlay, d)), steps: 40 },
  { ch: 'storyProblems', beats: () => [makeStoryBeat()], guided: () => [guided(StoryPlay, STORY_GUIDED)], steps: 40 },
  { ch: 'money', beats: () => [MONEY_BEAT], guided: () => [guided(CoinRound, MONEY_GUIDED, { st: stallAt(MONEY_GUIDED.slot) })], steps: 100 },
  { ch: 'time', beats: () => [makeTimeBeat()], guided: () => TIME_GUIDED.map(d => guided(TimePlay, d)), steps: 120 },
  { ch: 'shapes2d3d', beats: () => SHAPE_WORLDS.map(makeShapeBeat), guided: () => SHAPE_WORLDS.map(w => guided(ShapePlay, guidedFor(w), { world: w })) },
]

// A guided round is ONE fixed question per chapter (two at most), so it is walked more often than a drawn one.
const DRAWS = 12, WALKS = 4, GUIDED_WALKS = 8

describe.each(CHAPTERS)('$ch', ({ ch, beats, guided, steps }) => {
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
      // Money's answer lines are declared apart (fetched ahead only under its byte budget) — declared all the same.
      const declared = [...questionLines(beat, data, true), ...(beat.answerLines?.(data) ?? [])]
      for (let w = 0; w < WALKS; w++) {
        const r = await walk(beat.Play, data, rng(seed++), steps)
        said += r.said.length
        if (r.submitted) finished++
        expect(r.said.filter(l => !declared.includes(l)), `${ch} play`).toEqual([])
      }
    }
    expect(said, 'positive control: some tap made the question speak').toBeGreaterThan(0)
    expect(finished, 'positive control: some walk finished the round').toBeGreaterThan(0)
  })

  it('its guided round says only what it opened — and the walk really answers', async () => {
    let said = 0, finished = 0, seed = 1
    for (const g of guided()) for (let w = 0; w < GUIDED_WALKS; w++) {
      opened.length = 0
      const r = await walk(g.Play, g.data, rng(seed++), steps)
      expect(opened.length, 'positive control: the guided round opened a question').toBeGreaterThan(0)
      said += r.said.length
      if (r.submitted) finished++
      expect(r.said.filter(l => !opened.includes(l)), `${ch} guided`).toEqual([])
    }
    expect(said, 'positive control: some tap made the guided round speak').toBeGreaterThan(0)
    expect(finished, 'positive control: some guided walk finished the round').toBeGreaterThan(0)
  })
})
