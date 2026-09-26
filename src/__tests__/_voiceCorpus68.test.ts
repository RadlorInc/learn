/**
 * The spoken corpus of the twelve ex-6–8 story chapters (now Grade 1 and Grade 2) → scripts/.voice-corpus-6-8.json.
 *
 *   VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpus68.test.ts
 *
 * Opt-in: it writes a file (plus a `.holes.txt` sidecar) and is not a check. `_voiceCorpusChapters`
 * runs `build68` with `build35` to make the one Josh corpus; `chapterVoiceCorpus.test.ts` is the check.
 *
 * WHERE THE WORDS COME FROM, in order of preference:
 *   1. `beat.say` over a sweep of draws (scored), and the chapters' exported renderers — CoinShop's
 *      `openerFor`/`missFor`, BuildingBlocks' `askFor`, slice.ts' `askTextFor`/`revealFor`/`missFor`,
 *      clock.ts' `wordsFor` — driven over the same draws, so a line is the chapter's own sentence;
 *   2. RENDERING `beat.Reteach` with the speaker stubbed, over the draws AND over each chapter's
 *      opening-demo rounds (which run the same component on hand-picked data);
 *   3. a hand copy for what lives inside a play component with no export: the guided round's
 *      "Yes!" lines and the wrong-answer lines. Copied from the chapter code as of 2026-09-25. A
 *      reworded one turns `chapterVoiceCorpus.test.ts` red (every spoken template must match a row).
 *
 * ⚠️ IT IS A FLOOR, NOT A TOTAL, in two places a sweep cannot close:
 *   • a wrong answer's OWN value is part of some lines ("That makes twelve. I asked for seven.",
 *     "That one is forty. Listen again — find forty-two!"). These are enumerated over a plausible
 *     band around each drawn answer, not every value a child could build;
 *   • draws are a sample of each generator (VOICE_DRAWS, VOICE_RETEACH_DRAWS).
 *
 * ⚠️ THE RE-TEACH IS RENDERED, NOT COPIED (the 2026-09-05 note, kept): every chapter builds its
 * explanation inside its Explain component and pairs `lines[i]` with `steps[i]`; pulling the words out
 * into a pure function would let the words and the visual reveal drift apart. Rendering records
 * exactly what the chapter says. jsdom has no ResizeObserver — see `polyfillResizeObserver`.
 */
import { it, vi, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { PRAISE } from '@/core/praise'
import { ENCOURAGEMENT } from '@/shared/hooks/useAdaptive'
import type { Beat } from '@/features/chapters/story/StoryWorld'
import { numberToWords as w } from '@/features/chapters/lessons/_kit'
import { makeNumBeat, WORLDS as NUM_WORLDS } from '@/features/chapters/story/NumberTown'
import { BEAT as PLACE_VALUE_BEAT, askFor as pvAskFor, ASK as PV_ASK, type PvRound } from '@/features/chapters/story/BuildingBlocks'
import { makeCompareBeat, RUN as SEESAW_RUN, DEMO_N as SEESAW_DEMO_N, compareSign } from '@/features/chapters/story/SeesawPark'
import { makeBeat as makeHopBeat, RUN as HOP_RUN, DEMO_SLOTS as HOP_DEMO_SLOTS, PAIRS_FOR_TEST, type FetchRound } from '@/features/chapters/story/HopAlong'
import { makeBeat as makeYardBeat } from '@/features/chapters/story/BlockYard'
import { makeMultBeat, RUN as MARKET_RUN, DEMO_N as MARKET_DEMO_N } from '@/features/chapters/story/MarketDay'
import { makeFrBeat } from '@/features/chapters/story/SliceShop'
import { askTextFor as frAsk, revealFor as frReveal, missFor as frMiss, DENS, type FrRound } from '@/features/chapters/story/slice'
import { makeStoryBeat, RUN as STORY_RUN, DEMO_N as STORY_DEMO_N } from '@/features/chapters/story/StoryTime'
import { BEAT as MONEY_BEAT, openerFor, missFor as moneyMiss, stallAt, poolFor, fewestFor, PURSE_MAX, GUIDED_SLOT as MONEY_GUIDED, type MoneyRound } from '@/features/chapters/story/CoinShop'
import { makeTimeBeat } from '@/features/chapters/story/TickTock'
import { wordsFor, DAY, askTextFor as timeAsk } from '@/features/chapters/story/clock'
import { makeShapeBeat, WORLDS as SHAPE_WORLDS } from '@/features/chapters/story/ShapeStudio'
import { Corpus, range, polyfillResizeObserver, seedRandom } from './_voiceCorpusKit'

vi.mock('@/infra/useMiloSpeaker', async (orig) =>
  ({ ...(await orig<object>()), ...(await import('./_voiceCorpusKit')).SPEAKER_STUB }))

/* eslint-disable @typescript-eslint/no-explicit-any */
/** The same draws `fromBeat` makes, for the renderers a chapter calls from its play component. */
function draws<T>(beat: Beat<T>, n = Number(process.env.VOICE_DRAWS ?? 1500)): T[] {
  const cov = beat.coverage?.all ?? [], out: T[] = []
  for (let i = 0; i < n; i++) {
    try { const d = beat.make(((i % 3) + 1) as 1 | 2 | 3, i % beat.rounds, cov.slice(0, i % (cov.length + 1))); if (d != null) out.push(d) } catch { /* skip */ }
  }
  return out
}
const teach = (...data: unknown[]) => data.map(d => ({ kind: 'teach' as const, data: d }))

export async function build68(c: Corpus) {
  polyfillResizeObserver()
  seedRandom(68)            // the same draws every rebuild — see seedRandom
  const add = c.add.bind(c)
  add('numbersTo100', 'scored', ...PRAISE, ...ENCOURAGEMENT.flat())   // SkillBeat, where a chapter does not own its feedback

  // ── numbersTo100 · Number Town ──────────────────────────────────────────────
  for (const world of NUM_WORLDS) {
    const beat = makeNumBeat(world)
    c.fromBeat('numbersTo100', beat)
    await c.fromReteach('numbersTo100', beat, teach(        // DEMO_ROUNDS, NumberTown.tsx
      { scene: world.scenes[0], target: 13, choices: [] }, { scene: world.scenes[1] ?? world.scenes[0], target: 24, choices: [] }))
    add('numbersTo100', 'teach', world.label, beat.say!({ scene: world.scenes[2], target: 16, choices: [12, 16, 20] }), `Yes! That is ${w(16)}!`)
    for (const d of draws(beat)) for (const n of d.choices) if (n !== d.target)
      add('numbersTo100', 'redirect', `That one is ${w(n)}. Listen again — find ${w(d.target)}!`)
  }
  add('numbersTo100', 'redirect', ...[12, 20].map(n => `That one is ${w(n)}. Listen again — find ${w(16)}!`))

  // ── placeValue · Building Blocks ────────────────────────────────────────────
  // prompt is '' — the round's question is `askFor`, said by the chapter itself (sayNext).
  const pvRounds = draws(PLACE_VALUE_BEAT)
  const pvGuided: PvRound = { slot: 2, n: 23, kind: 'make', answer: 23, digits: 2 }
  add('placeValue', 'scored', ...pvRounds.map(pvAskFor), ...Object.values(PV_ASK))
  add('placeValue', 'teach', pvAskFor(pvGuided))
  await c.fromReteach('placeValue', PLACE_VALUE_BEAT, teach(
    { slot: 0, n: 34, kind: 'make', answer: 34, digits: 2 }, { slot: 1, n: 52, kind: 'make', answer: 52, digits: 2 }))
  // SOLVED / the make-branch verdicts (BuildingBlocks.tsx, not exported)
  const SOLVED: Record<PvRound['kind'], (n: number) => string> = {
    make: n => `${n}`,
    whole: n => `${Math.floor(n / 10)} tens and ${n % 10} ones make ${n}`,
    tens: n => `${Math.floor(n / 10)} tens — worth ${Math.floor(n / 10) * 10}`,
    ones: n => `${n % 10} ones`,
    value: n => `${Math.floor(n / 10)} tens are worth ${Math.floor(n / 10) * 10}`,
  }
  for (const d of [...pvRounds, pvGuided]) {
    const n = d.n, t = Math.floor(n / 10), o = n % 10
    if (d.kind === 'make') {
      add('placeValue', 'scored', `Yes! ${w(t)} tens and ${w(o)} ones make ${w(n)}.`)
      add('placeValue', 'redirect', `That is ${w(o * 10 + t)}, not ${w(n)}. The tens side is on the left — look which one holds ${w(t)}.`)
    } else add('placeValue', 'scored', `Yes! ${SOLVED[d.kind](n)}`)
  }
  // "Not yet — that is X." names whatever the child built: up to nine rods and nine loose ones.
  for (const b of range(0, 99)) add('placeValue', 'redirect', `Not yet — that is ${w(b)}. Count the tens, then the ones.`)

  // ── compareNumbers · Seesaw Park ────────────────────────────────────────────
  const seesaw = makeCompareBeat()
  c.fromBeat('compareNumbers', seesaw)
  const cmp = (base: object, a: number, b: number) => ({ ...base, a, b, answer: compareSign(a, b) })
  await c.fromReteach('compareNumbers', seesaw, teach(cmp(SEESAW_RUN[0], 6, 3), cmp(SEESAW_RUN[1], 2, 8), cmp(SEESAW_RUN[2], 4, 4)))
  const seesawGuided = cmp(SEESAW_RUN[SEESAW_DEMO_N], 3, 7) as any
  add('compareNumbers', 'teach', seesaw.say!(seesawGuided), `Yes! ${w(3)} is less than ${w(7)}!`)
  add('compareNumbers', 'redirect', 'Look again — which side is bigger? Try once more!')

  // ── skipCounting · Hop Along ────────────────────────────────────────────────
  const hop = makeHopBeat()
  c.fromBeat('skipCounting', hop)
  await c.fromReteach('skipCounting', hop, teach(
    { w: HOP_RUN[0].w, item: HOP_RUN[0].item, group: 2, need: 3 }, { w: HOP_RUN[1].w, item: HOP_RUN[1].item, group: 5, need: 3 }))
  const hopGuided: FetchRound[] = (PAIRS_FOR_TEST[1] as [number, number][]).map(([group, need]) => ({
    w: HOP_RUN[HOP_DEMO_SLOTS].w, item: HOP_RUN[HOP_DEMO_SLOTS].item, group, need, target: group * need, families: need + (group >= 10 ? 1 : 2) }))
  for (const d of hopGuided) add('skipCounting', 'teach',
    `We need ${d.target} ${d.item.many}. They come in ${d.w.family}s of ${d.group}. Tap a ${d.w.family} to fetch it!`)
  for (const d of [...draws(hop), ...hopGuided]) {
    add('skipCounting', 'scored', `${d.target}! Off we go!`, ...range(0, d.families).map(k => String(k * d.group)))
    add('skipCounting', 'redirect', `Not enough yet — we need ${d.target}. Fetch another ${d.w.family}!`,
      `That's too many — we only need ${d.target}. Tap the ones behind the frog to send a ${d.w.family} back.`)
  }

  // ── additionTo100 / subtractionTo100 · Block Yard ───────────────────────────
  for (const op of ['+', '-'] as const) {
    const ch = op === '+' ? 'additionTo100' : 'subtractionTo100'
    const beat = makeYardBeat(op)
    const demo = op === '+'
      ? [{ slot: 0, a: 27, b: 15, answer: 42, regroup: true }, { slot: 1, a: 38, b: 24, answer: 62, regroup: true }]
      : [{ slot: 0, a: 52, b: 17, answer: 35, regroup: true }, { slot: 1, a: 64, b: 28, answer: 36, regroup: true }]
    const guided = op === '+' ? { slot: 2, a: 26, b: 18, answer: 44, regroup: true } : { slot: 2, a: 43, b: 15, answer: 28, regroup: true }
    await c.fromReteach(ch, beat, teach(...demo))
    for (const d of [...draws(beat), guided] as { a: number; b: number; answer: number }[])
      add(ch, 'scored', `Yes! ${w(d.a)} ${op === '+' ? 'plus' : 'minus'} ${w(d.b)} is ${w(d.answer)}.`)
  }

  // ── multiplication · Market Day ─────────────────────────────────────────────
  const mult = makeMultBeat()
  c.fromBeat('multiplication', mult)
  await c.fromReteach('multiplication', mult, teach(
    { ...MARKET_RUN[0], view: 'groups', g: 3, per: 2, answer: 6 }, { ...MARKET_RUN[1], view: 'array', g: 3, per: 4, answer: 12 }))
  const multGuided = { ...MARKET_RUN[MARKET_DEMO_N], view: 'groups', g: 2, per: 3, answer: 6 } as any
  add('multiplication', 'teach', mult.say!(multGuided), `${w(2)} times ${w(3)} is ${w(6)}!`)
  for (const d of [...draws(mult), multGuided] as any[])
    add('multiplication', 'redirect', `Not quite — count the ${d.view === 'array' ? 'rows' : d.w.groupPlural} of ${w(d.per)}. Try again!`)

  // ── fractions · Slice Shop ──────────────────────────────────────────────────
  const fr = makeFrBeat()
  c.fromBeat('fractions', fr)
  await c.fromReteach('fractions', fr)
  for (const d of draws(fr) as FrRound[]) {
    add('fractions', 'scored', frAsk(d), frReveal(d))
    for (const den of DENS) for (const laid of range(1, 6)) {
      try { add('fractions', 'redirect', frMiss(d, { den, laid })) } catch { /* not a reachable pair */ }
    }
  }

  // ── storyProblems · Story Time ──────────────────────────────────────────────
  const story = makeStoryBeat()
  c.fromBeat('storyProblems', story)
  await c.fromReteach('storyProblems', story, teach(
    { ...STORY_RUN[0], op: 'add', a: 3, b: 2, answer: 5 }, { ...STORY_RUN[1], op: 'sub', a: 5, b: 2, answer: 3 },
    { ...STORY_RUN[2], op: 'compare', a: 4, b: 2, answer: 2 }))
  const storyGuided = { ...STORY_RUN[STORY_DEMO_N], op: 'add', a: 2, b: 2, answer: 4 } as any
  add('storyProblems', 'teach', story.say!(storyGuided), `${w(4)}!`)
  // the question half of `storyText` (StoryTime.tsx, not exported) — spoken once the story has played
  for (const d of [...draws(story), storyGuided] as any[])
    add('storyProblems', 'scored', d.op === 'add' ? `How many ${d.item.many} altogether?`
      : d.op === 'sub' ? `How many ${d.item.many} are left?` : `How many more ${d.item.many} do you have?`)

  // ── money · Coin Shop ───────────────────────────────────────────────────────
  // prompt is '' — the keeper's opener is the question.
  const moneyGuided: MoneyRound = { slot: MONEY_GUIDED, kind: 'pay', price: 7, shown: [5, 1, 1], asPile: false }
  const moneyDemo: MoneyRound[] = [
    { slot: 0, kind: 'pay', price: 30, shown: [5, 5, 5, 5, 5, 5], asPile: false },
    { slot: 1, kind: 'fewest', price: 30, shown: [5, 5, 5, 5, 5, 5], asPile: true }]
  await c.fromReteach('money', MONEY_BEAT, teach(...moneyDemo))
  add('money', 'teach', openerFor(stallAt(moneyGuided.slot), moneyGuided))
  for (const d of [...draws(MONEY_BEAT), moneyGuided]) {
    const st = stallAt(d.slot), best = fewestFor(d.price, poolFor(d.price)).length
    add('money', 'scored', openerFor(st, d), d.kind === 'fewest'
      ? `Yes! ${w(d.price)} in just ${w(best)} coins!` : `Yes! That is ${w(d.price)}. The ${st.one} is yours!`)
    // the miss names the child's own total: a band around the price, not every reachable sum
    for (const t of range(Math.max(1, d.price - 15), d.price + 15)) if (t !== d.price)
      add('money', 'redirect', moneyMiss(d, [t as 1], best))
    if (d.kind === 'fewest') for (const k of range(best + 1, PURSE_MAX))
      add('money', 'redirect', moneyMiss(d, Array(k).fill(1).map((_, i) => (i === 0 ? d.price - (k - 1) : 1)) as 1[], best))
  }

  // ── time · Tick Tock ────────────────────────────────────────────────────────
  const time = makeTimeBeat()
  c.fromBeat('time', time)
  await c.fromReteach('time', time)
  const timeGuided = [{ slot: 1, h: DAY[1].hour, m: 0, ask: 'read' as const, d: 1 }, { slot: 2, h: DAY[2].hour, m: 0, ask: 'set' as const, d: 1 }]
  add('time', 'teach', ...timeGuided.map(timeAsk))
  for (const d of [...draws(time), ...timeGuided])
    add('time', 'scored', `Yes — ${wordsFor(d.h, d.m)}. Time to ${DAY[d.slot].what}!`)

  // ── shapes2d3d · Shape Studio ───────────────────────────────────────────────
  for (const world of SHAPE_WORLDS) {
    const beat = makeShapeBeat(world)
    c.fromBeat('shapes2d3d', beat)
    await c.fromReteach('shapes2d3d', beat, teach(
      { bg: 0, mode: 'name', target: 'triangle', options: [] }, { bg: 1, mode: 'name', target: 'cube', options: [] }))
    add('shapes2d3d', 'teach', world.label)
  }
  add('shapes2d3d', 'teach', 'Find the square. Tap it!', 'Yes! A square!')   // the guided round
  add('shapes2d3d', 'redirect', 'Not quite — try again!')
}

it('builds the 6–8 corpus', async () => {
  // Also imported by _voiceCorpusChapters.test.ts, where this must not run a second time.
  if (!process.env.VOICE_CORPUS || !expect.getState().testPath?.endsWith('_voiceCorpus68.test.ts')) return
  const c = new Corpus()
  await build68(c)
  const out = process.env.VOICE_OUT ?? 'scripts/.voice-corpus-6-8.json'
  // ⚠️ TO A FILE, NOT `console.warn` — vitest swallows a reporter's own output.
  writeFileSync(out.replace(/\.json$/, '') + '.holes.txt',
    c.holes.size
      ? 'chapters whose re-teach yielded NOTHING — each is a hole in this corpus:\n  ' + [...c.holes].join('\n  ') + '\n'
      : 'no holes: every chapter’s re-teach mounted and spoke.\n')
  writeFileSync(out, JSON.stringify([...c.lines.entries()].map(([key, v]) =>
    ({ key, chars: v.text.length, text: v.text, kind: v.kind, chapter: v.chapters[0] })), null, 2))
  // ⚠️ A HOLE IS A FAILURE, NOT A FOOTNOTE: a corpus run that could not reach a chapter goes RED.
  expect([...c.holes], 'a chapter’s re-teach yielded nothing — this corpus is short by that chapter').toEqual([])
}, 600_000)
