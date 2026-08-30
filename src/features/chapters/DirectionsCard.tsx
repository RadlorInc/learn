'use client'
/**
 * The typed directions strip — a "what to do" line on the chapter's own chrome row, in every chapter.
 *
 * Asked for by a tester on 2026-08-30, reviewing the 3–5 band: *"there should also be (this goes for
 * all chapters) a little box in the top left or right corner that has word typed directions for
 * people to follow. It could be very simple."* The spoken instruction is the only thing that says
 * what to DO in several chapters, and most Chrome installs have no voice at all — so a child, or the
 * grown-up beside them, can be left looking at a question with no idea what the game wants.
 *
 * ⚠️ ONE SOURCE OF WORDS, AND IT IS THE ONE THAT ALREADY EXISTS. The catalogue's `hint` is written
 * per chapter and is already `Record<ChapterType, …>`-complete, so every chapter has a line by
 * construction — a second per-chapter map would be a copy, and the chapters somebody forgot to add
 * to it would silently show nothing at all.
 *
 * ⚠️ NOT IN EVERY CHAPTER: the three that draw their own banner on this row carry the line inside
 * that banner instead (`ownsChromeRow`), so nothing is ever stacked on anything.
 *
 * ⚠️⚠️ IT LIVES ON THE MENU ROW, AND THAT IS THE ONLY PLACE IN A STORY CHAPTER WITH ROOM — measured,
 * not chosen. A card under the ← Menu button (the obvious spot) sits at the same height as the
 * PROMPT PILL, which is centred and grows with the question: at 640×320 the pill measured
 * x 145–494, and a long prompt can reach x 12, so the whole left column is contested at that height.
 * The row the Menu button is on is not: it holds the button (x 14–96) and, in a scored round,
 * SkillBeat's round counter (top 14, right 16) and nothing else, at any size, in any chapter.
 * So the strip is bounded by those two and can only ever be one line.
 *
 * ⚠️ `pointerEvents: none`. It crosses the play surface of 72 chapters, and a strip that eats a tap
 * is worse than no strip — this repo has paid for that twice (SkillBeat's prompt pill as a dead
 * patch over the colouring page, and the banner stripe before it).
 *
 * ⚠️ It does NOT restate the round's question. The question is the pill / the ticket and changes
 * every round; this is the steady "how this chapter is played", which is what was missing.
 */
import { type ChapterType } from '@/core/chapters'
import { directionsFor, ownsChromeRow } from '@/features/chapters/directions'
import { useNeedsRotate } from '@/features/chapters/story/RotateGate'
import { useViewport } from '@/shared/hooks/useViewport'

/**
 * The lane, both ends measured off the chrome that owns them rather than guessed:
 *  • LEFT — the ← Menu button is `top: 12, left: 14` and at least 44px wide (the tap floor); it
 *    measures x 14–96 at every size, so the strip starts at 104.
 *  • RIGHT — SkillBeat's round counter is `top: 14, right: 16` and about 40px wide, and GameShell's
 *    own corner chips sit in the same place, so the strip stops 96 short of the right edge.
 *  • HEIGHT — one line and no more: most chapters open their prompt pill at y 40–50, so a second
 *    line would run straight into the question.
 */
const LANE_LEFT = 104
const LANE_RIGHT = 96
/**
 * ⚠️ BELOW THE CHAPTER'S OWN CHROME (44–46), ABOVE ITS SCENE (Milo is 26). Three chapters put a
 * banner of their own on this row — ShapeStudio and SeesawPark at `top: 12`, and MeasureIt at
 * `pillTop(short) = 14` on a landscape phone, which it moved up there to buy height for the blocks.
 * Ranked underneath them, the worst that happens in those three is that part of this strip is
 * covered; ranked above, it would cover the QUESTION, which is the one thing on screen that may
 * never be hidden.
 */
const Z = 42
// A viewport shorter than this is a landscape phone; same threshold the chapters use.
const SHORT_H = 470

export default function DirectionsCard({ chapter }: { chapter: ChapterType }) {
  // ⚠️ NOT over the rotate gate. That screen is in flow and this card is `fixed`, so without this it
  // floats "What to do" over "Turn your phone sideways" on every portrait phone.
  const needsRotate = useNeedsRotate()
  const { h: vh } = useViewport()
  const short = vh < SHORT_H
  const text = directionsFor(chapter)
  // ⚠️ NO STACKING. Three chapters draw their own banner on this row and carry the line inside it
  // (see `directions.tsx`) — laid over one of them this strip was clipped to "Lay blocks to t…".
  if (!text || needsRotate || ownsChromeRow(chapter)) return null
  return (
    <div style={{
      position: 'fixed', top: 14, left: LANE_LEFT, right: LANE_RIGHT, zIndex: Z, pointerEvents: 'none',
      display: 'flex', justifyContent: 'flex-start',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0, maxWidth: '100%',
        background: 'rgba(255,255,255,.92)', border: '2px solid rgba(61,37,22,.28)', borderRadius: 999,
        padding: short ? '3px 11px' : '4px 14px', boxShadow: '0 2px 0 rgba(61,37,22,.1)',
      }}>
        {/* The label is what a short frame drops — the sentence beside it is the thing being read. */}
        {!short && <span style={{ flex: '0 0 auto', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 10,
          letterSpacing: .7, textTransform: 'uppercase', color: '#8a94a3' }}>What to do</span>}
        {/* One line, always: the pill below starts at y 48, so a wrap would run into the question. */}
        <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 12 : 13.5, color: '#3d2516' }}>{text}</span>
      </div>
    </div>
  )
}
