'use client'
/**
 * The one line of typed directions a chapter shows, and WHO draws it.
 *
 * The words come from the catalogue's own per-chapter `hint`, which is `Record<ChapterType, …>`-
 * complete by construction. A second per-chapter map is the thing that would let a chapter ship
 * with no directions at all, so there is deliberately not one.
 *
 * ⚠️⚠️ THREE STORY CHAPTERS DRAW THEIR OWN BANNER ON THE CHROME ROW, AND THEY CARRY THE LINE
 * THEMSELVES RATHER THAN HAVING A CARD LAID OVER THEM. Measured at 640×320: MeasureIt lifts its
 * question pill to `pillTop(short) = 14` to buy height for the blocks, and ShapeStudio and
 * SeesawPark put their phase banner at `top: 12` — so a floating strip on that row is either
 * covering the question or being covered by it, and being covered is how the feature ended up
 * rendering "Lay blocks to t…" on one of the two chapters it was asked for. Stacking is the fault;
 * the fix is that in these chapters the direction is part of the banner's own line, where an
 * overlap is not expressible and there is no z-index race to lose.
 */
import { getChapter, type ChapterType } from '@/core/chapters'

export const directionsFor = (chapter: ChapterType): string => getChapter(chapter).hint

/**
 * ⚠️ HopAlong is deliberately NOT here even though its round row sits at top 40: it sets
 * `prompt: () => ''` and states its ask in a pill at the BOTTOM, so nothing is ever drawn on that
 * row and the strip has it to itself — measured at 640×320, not assumed.
 *
 * ⚠️ THIS LIST IS DRIFT-PRONE BY NATURE — it is a claim about three chapters' LAYOUT held in a
 * fourth file — so it is gated: `chapterDirections.test.ts` reads every story chapter's source and
 * fails if one draws a container above the chrome row without being named here.
 */
export const OWNS_CHROME_ROW: ChapterType[] = [
  'measurement',                            // MeasureIt      — pillTop(short) = 14
  'shapes2d3d',                             // ShapeStudio    — its phase banner at top 12
  'compareNumbers',                         // SeesawPark     — its phase banner at top 12
  'fractions',                              // SliceShop      — its banner at CHROME_PAD = 12
  'time',                                   // TickTock       — its banner at CHROME_PAD = 12
  'additionTo100', 'subtractionTo100',      // BlockYard      — yard's BANNER_TOP: 25 at vh 720
  'placeValue',                             // BuildingBlocks — same banner
]

export const ownsChromeRow = (chapter: ChapterType): boolean => OWNS_CHROME_ROW.includes(chapter)

/**
 * The direction as part of somebody else's line — smaller and quieter than the question beside it,
 * because the question is what is being answered and this is the standing "how you play".
 */
export function DirectionsInline({ chapter }: { chapter: ChapterType }) {
  const text = directionsFor(chapter)
  if (!text) return null
  return (
    <span style={{ fontSize: '0.58em', fontWeight: 800, opacity: 0.72, whiteSpace: 'normal' }}>
      <span aria-hidden style={{ margin: '0 0.5em', opacity: 0.5 }}>·</span>{text}
    </span>
  )
}
