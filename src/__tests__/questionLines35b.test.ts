/**
 * KG–2 questions say only what they declared — so the clips fetched when a question LOADS are all it ever plays, and
 * Josh (not the device voice) says every line after the child taps. Founder, 2026-09-27, AUDIO-ROUND2 §1.5; the why and
 * the machinery are in _questionWalk.ts, the privacy half in questionLock.test.ts.
 *
 * Group 35b: shapes, colors, patterns, addition, subtraction, measurement.
 *
 * A GUIDED round (a chapter's unscored first question) is not one of SkillBeat's, so it opens its own with `useQuestion`.
 * There the declared set is read off what the component really handed to `openQuestion` — a guided view that forgot to
 * call it opens nothing and fails here, which a declaration imported from the chapter could not show.
 *
 * COLORS IS DRIVEN THROUGH THE WHOLE CHAPTER. Its scored round's Play renders nothing — the page, the paint box and the
 * tap handlers (`tapPage`, `commitPaint`) are the orchestrator's, because a coloured picture has to outlive a round — so
 * walking `beat.Play` would tap nothing. Instead the real RainbowTown is opened at a phase (`?e2e=`, useChapterPhase) and
 * walked, and every line must be said inside the question open AT THAT MOMENT: SkillBeat's per round, the lesson's per
 * step. The one thing stood in for is the flood fill (see `finger`).
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createElement, type FC } from 'react'

// Everything said and every question opened (and when it closed), kept across the walk's own resets: the walk measures
// from the first tap, a guided round's ask is spoken on mount, and colors crosses several questions in one walk.
const log = vi.hoisted(() => ({ said: [] as string[], opened: [] as { lines: string[]; after: number; closed: number }[] }))
vi.mock('@/infra/useMiloSpeaker', async (orig) => {
  const stub = (await import('./_voiceCorpusKit')).SPEAKER_STUB as Record<string, (x: unknown, ...r: unknown[]) => unknown>
  const tee = Object.fromEntries(Object.entries(stub).map(([k, f]) =>
    [k, (x: unknown, ...r: unknown[]) => { log.said.push(...[x as string | string[]].flat()); return f(x, ...r) }]))
  return { ...(await orig<object>()), ...tee }
})
vi.mock('@/infra/voiceClipPlayer', async (orig) => {
  const m = await orig<typeof import('@/infra/voiceClipPlayer')>()
  return {
    ...m,
    openQuestion: (lines: string[]) => {
      const q = { lines, after: log.said.length, closed: Infinity }
      log.opened.push(q)
      const release = m.openQuestion(lines)
      return () => { q.closed = log.said.length; release() }
    },
  }
})
/**
 * jsdom lays nothing out, so a tap on the colouring page has NaN coordinates and the real flood cannot say what it
 * touched. The finger stands in: a NAMED point (the glow on the asked part, the re-teach's fill) floods to itself, and a
 * tap lands on the glowing part half the time — it is what a child aims at — else on another named part, on unnamed
 * paper, or on a line. What the chapter then SAYS about that tap is all its own code.
 */
const finger = vi.hoisted(() => ({ glowing: null as [number, number] | null, parts: [] as [number, number][], rand: Math.random }))
vi.mock('@/features/chapters/story/floodFill', () => ({
  loadPage: async () => ({ w: 1376, h: 768, ink: new Uint8Array(0) }),
  floodRegion: (_p: unknown, x: number, y: number) => {
    if (Number.isFinite(x)) { finger.glowing = [x, y]; return { at: [x, y] } }
    const r = finger.rand()
    if (r < 0.5) return finger.glowing && { at: finger.glowing }
    if (r < 0.75) return { at: finger.parts[Math.floor(finger.rand() * finger.parts.length)] }
    return r < 0.875 ? { at: null } : null
  },
  floodNearest: () => ({ at: null }),
  inRegion: (r: { at: [number, number] | null }, _w: number, x: number, y: number) => !!r.at && r.at[0] === x && r.at[1] === y,
  paintRegion: () => {},
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {}, replace: () => {} }) }))

import { questionLines, type Beat } from '@/features/chapters/story/StoryWorld'
import { makeShapeBeat, ShapesPlay, guidedRound as shapeGuided } from '@/features/chapters/story/ShapeTown'
import RainbowTown, { makeColorBeat, TEST_PAGE, TEACH_PAGE } from '@/features/chapters/story/RainbowTown'
import { makeBeadBeat, BeadsPlay, MAKES, EMPTY_STRAND, DEMO_ROUND, guidedRound as beadGuided } from '@/features/chapters/story/BeadShop'
import { makePlayBeat, PlayScene, GUIDED_ROUND as PLAY_GUIDED } from '@/features/chapters/story/PlayTime'
import { makeMeasureBeat, MeasurePlay, WORLDS as MEASURE_WORLDS } from '@/features/chapters/story/MeasureIt'
import { polyfillResizeObserver } from './_voiceCorpusKit'
import { draws, walk, reteachSays, rng, WALK_TIMEOUT } from './_questionWalk'

vi.setConfig({ testTimeout: WALK_TIMEOUT })

polyfillResizeObserver()

/* eslint-disable @typescript-eslint/no-explicit-any */
// `steps`/`walks`: a round the child BUILDS takes more taps than the default walk makes, and measuring's Done is final —
// it answers on the first press, so only a walk that happened to lay exactly the right count first finishes the round.
// Those get longer and more walks, rather than weaker assertions.
const CHAPTERS: { ch: string; beats: () => Beat<any>[]; steps?: number; walks?: number }[] = [
  { ch: 'shapes', beats: () => [makeShapeBeat(() => 1)] },
  { ch: 'patterns', beats: () => MAKES.map(m => makeBeadBeat(m, () => 1, () => EMPTY_STRAND)) },
  { ch: 'addition', beats: () => [makePlayBeat('+')] },
  { ch: 'subtraction', beats: () => [makePlayBeat('-')] },
  { ch: 'measurement', beats: () => MEASURE_WORLDS.map(w => makeMeasureBeat(w, () => {})), steps: 30, walks: 8 },
]

const DRAWS = 12, WALKS = 4

describe.each(CHAPTERS)('$ch', ({ ch, beats, steps, walks = WALKS }) => {
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
      for (let w = 0; w < walks; w++) {
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
const GUIDED: { ch: string; Play: FC<any>; data: unknown; steps?: number; walks?: number }[] = [
  { ch: 'shapes', data: shapeGuided(),
    Play: ({ data, onSubmit }) => createElement(ShapesPlay, { data, mode: 'guided', fit: () => 1, onComplete: onSubmit }) },
  // The guided round continues the demo's pattern: the demo strings its seed and threads its answer.
  ...MAKES.map(make => ({ ch: `patterns (${make.id})`,
    data: beadGuided({ strand: [...DEMO_ROUND.seed, DEMO_ROUND.answer], runStart: 0, unit: DEMO_ROUND.unit }),
    Play: (({ data, onSubmit }) => createElement(BeadsPlay, { data, make, mode: 'guided', thread: () => 1, onComplete: onSubmit })) as FC<any> })),
  ...(['+', '-'] as const).map(op => ({ ch: op === '+' ? 'addition' : 'subtraction', data: PLAY_GUIDED[op],
    Play: (({ data, onSubmit }) => createElement(PlayScene, { data, mode: 'guided', onDone: onSubmit })) as FC<any> })),
  // MeasureIt's orchestrator measures `world.things[1]` in its guided round. Done answers on the first press (see
  // CHAPTERS), so few random walks lay exactly three first: 60 walks finish it twice per world.
  ...MEASURE_WORLDS.map(world => ({ ch: `measurement (${world.id})`, data: world.things[1], steps: 30, walks: 60,
    Play: (({ data, onSubmit }) => createElement(MeasurePlay, { world, thing: data, mode: 'guided', onComplete: onSubmit })) as FC<any> })),
]

describe.each(GUIDED)('$ch guided round', ({ ch, Play, data, steps, walks = WALKS }) => {
  it('opens one question before it says anything, and says only what it opened', async () => {
    let said = 0, finished = 0
    for (let w = 0; w < walks; w++) {
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

describe('colors', () => {
  const beat = makeColorBeat(TEST_PAGE, () => {}, () => {}, () => {})

  it('its re-teach says only lines in reteachLines(data)', async () => {
    let said = 0
    for (const data of draws(beat, DRAWS)) {
      const lines = await reteachSays(beat.Reteach, data)
      said += lines.length
      expect(lines.filter(l => !(beat.reteachLines?.(data) ?? []).includes(l)), 'colors re-teach').toEqual([])
    }
    expect(said, 'positive control: the re-teach said something').toBeGreaterThan(0)
  })

  /** Each line said with the question open at that moment, and not in it (or said with none open). */
  const undeclared = () => log.said.flatMap((l, i) => {
    const q = log.opened.findLast(o => o.after <= i && i < o.closed)
    return q?.lines.includes(l) ? [] : [q ? l : `${l}  (no question open)`]
  })
  /** Lines said beyond each question's own opening line (its prompt / the lesson beat's ask) — i.e. said after a tap. */
  const answered = () => log.said.filter((l, i) => l !== log.opened.findLast(o => o.after <= i && i < o.closed)?.lines[0]).length

  // The canvas and the wrong-tap nudge need what jsdom does not have; neither speaks. The glow needs a context to draw
  // on — without one the chapter never floods the asked part, and the finger would never know where the glow is.
  let restore: () => void
  beforeAll(() => {
    const ctx = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect() {} } as unknown as CanvasRenderingContext2D)
    const had = Element.prototype.animate
    Element.prototype.animate = (() => ({ cancel() {} })) as unknown as typeof Element.prototype.animate
    restore = () => { ctx.mockRestore(); Element.prototype.animate = had; window.history.replaceState(null, '', '/') }
  })
  afterAll(() => restore())

  const Chapter: FC = () => createElement(RainbowTown)
  async function drive(phase: 'test' | 'teach', seed: number, steps: number) {
    window.history.replaceState(null, '', `/?e2e=${phase}`)
    finger.parts = (phase === 'test' ? TEST_PAGE : TEACH_PAGE).targets.map(t => t.at)
    finger.rand = rng(1000 + seed)
    log.said.length = 0; log.opened.length = 0
    await walk(Chapter, null, rng(seed), steps)
  }

  it('the toy room: every line is said inside the round open at the time, from its questionLines', async () => {
    let rounds = 0, spoke = 0
    for (let w = 0; w < 3; w++) {
      await drive('test', w + 1, 90)
      expect(undeclared(), 'colors play').toEqual([])
      rounds = Math.max(rounds, log.opened.length)
      spoke += answered()
    }
    expect(spoke, 'positive control: taps made the rounds speak').toBeGreaterThan(0)
    expect(rounds, 'positive control: a round finished and the next opened').toBeGreaterThan(1)
  })

  it('the lesson (its guided rounds): each step opens its question before its ask, and says only what it opened', async () => {
    let steps = 0, spoke = 0
    for (let w = 0; w < 3; w++) {
      await drive('teach', w + 11, 60)
      expect(log.opened[0]?.after, 'the first step’s question opened before anything was said').toBe(0)
      expect(undeclared(), 'colors lesson').toEqual([])
      steps = Math.max(steps, log.opened.length)
      spoke += answered()
    }
    expect(spoke, 'positive control: taps made the lesson speak').toBeGreaterThan(0)
    expect(steps, 'positive control: a lesson step finished and the next opened').toBeGreaterThan(1)
  })
})
