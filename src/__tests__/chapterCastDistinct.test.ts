/**
 * NO CREATURE IS SHOWN TWICE IN A CHAPTER RUN.
 *
 * A founder asked for this directly — "once it is used in one question don't use that object in the
 * other question in that chapter" — and all three rebuilt 6–8 chapters were breaking it in the same
 * two ways at once:
 *   • the plan was SHORTER than the run and read as `PLAN[round % PLAN.length]`, so the last scored
 *     rounds wrapped back onto the creature the chapter had opened with; and
 *   • the demo beats and the guided round picked out of `items[]` by hand, landing on entries the
 *     scored rounds then served again.
 * Both are invisible to a single play-through — you have to reach round 9 or 10, or notice that the
 * fish in the demo is the fish in question 1 — which is exactly the class of fault this repo keeps
 * shipping. So it is asserted rather than remembered.
 *
 * The check runs against the SAME `ROUND_PLAN` each chapter renders from, not a copy of the cast
 * lists: a gate that re-derives the thing it is checking can agree with itself while the screen is
 * wrong.
 */
import { describe, it, expect } from 'vitest'
import { SHEETS } from '@/features/chapters/story/canvas/sheets'
import * as StoryTime from '@/features/chapters/story/StoryTime'
import * as MarketDay from '@/features/chapters/story/MarketDay'
import * as SeesawPark from '@/features/chapters/story/SeesawPark'

const CHAPTERS = [
  { name: 'StoryTime (story problems)', m: StoryTime },
  { name: 'MarketDay (multiplication)', m: MarketDay },
  { name: 'SeesawPark (comparison)', m: SeesawPark },
] as const

describe.each(CHAPTERS)('$name', ({ m }) => {
  const run = m.DEMO_N + 1 + m.SCORED_N     // demo beats + the guided round + every scored round
  /**
   * What the chapter ACTUALLY shows, in order — the demo beats and guided round off the front of
   * `RUN`, exactly as the component reads them, then each scored round through `scoredSlot`, which
   * is the single call site the component uses. Reading the plan array instead would let a mutation
   * in the scored INDEX walk straight through this gate: the plan would still be distinct while the
   * screen served the same creature twice.
   */
  const shown = [
    ...m.RUN.slice(0, m.DEMO_N + 1),
    ...Array.from({ length: m.SCORED_N }, (_, i) => m.scoredSlot(i)),
  ]

  it('has a cast long enough for the whole run, so no index ever wraps', () => {
    // RUN is `PLAN.slice(0, run)` — if the cast were short it would come back short, and the scored
    // rounds would fall through to the modulo backstop and start repeating.
    expect(m.RUN).toHaveLength(run)
  })

  it('shows a DIFFERENT creature in every question of the run', () => {
    const imgs = shown.map(p => p.item.img)
    const dupes = imgs.filter((v, i) => imgs.indexOf(v) !== i)
    expect(dupes).toEqual([])
    expect(shown).toHaveLength(run)
  })

  it('gives every creature in the run a drawn walk cycle', () => {
    // A still creature standing beside a living one reads as broken art, not as a choice — the cast
    // is all-or-nothing (see chapter-craft.md).
    const noSheet = shown.map(p => p.item.img).filter(src => !SHEETS[src])
    expect(noSheet).toEqual([])
  })

  it('changes the SETTING between consecutive questions wherever the plan still can', () => {
    // The interleave only runs out once the shorter settings are exhausted; up to that point a child
    // should never see the same place twice running.
    const firstStretch = shown.slice(0, new Set(shown.map(p => p.w.id)).size * 2)
    for (let i = 1; i < firstStretch.length; i++)
      expect(firstStretch[i].w.id).not.toBe(firstStretch[i - 1].w.id)
  })
})

it('every drawn walk cycle in sheets.ts is actually used by a chapter', () => {
  // "We have enough moving objects — use them all." Anything registered here and consumed by nobody
  // is art that was paid for and never reached a child. The exceptions are named, with the reason.
  const UNUSED_ON_PURPOSE = new Set([
    '/assets/objects/frog_side.png',        // a HOP, not a walk — needs a discrete hop(from,to)
    '/assets/objects/alien_side.png',       // orphaned when the moon base was dropped
    '/assets/objects/astronaut_side.png',   // ditto
    '/assets/objects/nest_side.png',        // NestTree's chick-in-a-nest, a prop rather than a mover
    '/assets/characters/milo_side.png',
    '/assets/characters/milo_hop_side.png',
  ])
  const used = new Set(CHAPTERS.flatMap(c => c.m.RUN.map(p => p.item.img)))
  const idle = Object.keys(SHEETS).filter(k => !used.has(k) && !UNUSED_ON_PURPOSE.has(k))
  expect(idle).toEqual([])
})
