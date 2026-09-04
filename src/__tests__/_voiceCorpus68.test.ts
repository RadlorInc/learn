/**
 * Measure the 6–8 spoken corpus. Same reason as the 3–5 and 9–11 drivers: a storybook chapter
 * builds its line from the round's own numbers, so it is not a literal anywhere.
 *
 *   VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpus68.test.ts
 *
 * Reporting only — writes scripts/.voice-corpus-6-8.json, renders nothing.
 *
 * ⚠️⚠️ ITS NUMBER IS A FLOOR TWICE OVER, and must be quoted as ">=" both times.
 *   1. Only 9 of the band's 12 chapters are reachable here. `placeValue`, `additionTo100`,
 *      `subtractionTo100` and `money` return an EMPTY `prompt` on purpose — their play surface
 *      states the question itself (chapter-craft.md: two pills saying the same thing is a
 *      duplicate, not a fallback) — so what those chapters speak lives in their components and
 *      nothing at the beat surface can see it. They are missing, not empty.
 *   2. 1,500 draws is a sample, not the generator's space; whole-line counts keep climbing with
 *      the sweep while templates and literal runs saturate (see _voiceCorpusTeen.test.ts).
 */
import { it } from 'vitest'
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

function fromBeat(chapter: string, beat: Beat<any>) {
  const cov = beat.coverage?.all ?? []
  for (let i = 0; i < 1500; i++) {
    const d = ((i % 3) + 1) as 1 | 2 | 3
    let data: any
    try { data = beat.make(d, i % beat.rounds, cov.slice(0, i % (cov.length + 1))) } catch { continue }
    if (data == null) continue
    try { add(chapter, 'scored', (beat.say ?? beat.prompt)(data)) } catch { /* prompt may need render state */ }
  }
}

it('measures the 6–8 corpus', () => {
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
  writeFileSync('scripts/.voice-corpus-6-8.json',
    JSON.stringify([...lines.entries()].map(([key, v]) => ({ key, chars: v.text.length, ...v })), null, 2))
})
