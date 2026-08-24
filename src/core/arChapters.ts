/**
 * WHICH CHAPTERS ANSWER WITH THE CAMERA — and therefore may not be rendered to a visitor who has no
 * account.
 *
 * ⚠️⚠️ THIS IS A COPPA GUARD, NOT A FEATURE FLAG. We are a child-directed service in the US.
 * Turning on a camera for a child with no account, no identified parent and no consent captured is
 * exactly the situation COPPA exists for. Camera access begins after signup, where `ConsentLine`
 * puts the policy in front of the adult.
 *
 * ⚠️ IT WAS NOT HYPOTHETICAL. `/diagnostic`'s report links a logged-out visitor straight at their
 * plan's first chapter — `/teen-preview?c=<id>&taste=1` — and `GameShell` renders that chapter's
 * start card with **"Turn on the camera"** as the primary button, because `useHandInput` defaults
 * to the hand door on a device with no remembered pick. Measured over the planted-gap simulation,
 * `plan[0]` is one of these eight for **30% of 9–11 visitors, 22% of 12–14, 13% of 15–16 and 12% of
 * 17–18** (0% of 6–8). It was shipping.
 *
 * ⚠️ AND THE ENFORCEMENT IS AT THE ROUTE, NOT AT A PICKER. The founder's instruction named the demo
 * picker; the live leak has no picker — it is a deep link, and the URL IS the picker. A guard on a
 * list would have left the exact shipping path open. Whatever route renders a chapter asks this
 * question, however the id arrived.
 *
 * ⚠️ THE LIST IS TYPED HERE AND DERIVED IN THE GATE. A runtime derivation would have to import the
 * game module to read its `hand:` block, which is the very module we are refusing to load.
 * `src/__tests__/arConsent.test.ts` parses the registry and the game sources, rebuilds this set from
 * the `hand: { reads: … }` wiring, and fails if the two disagree in EITHER direction — so a ninth AR
 * chapter cannot be added without this list learning about it, and an id cannot be quietly dropped
 * from it either.
 */
import type { ChapterType } from '@/core/chapters'

/** Every chapter whose `GameConfig` carries a `hand:` block. All eight live in the 9–11 band. */
export const AR_CHAPTERS: readonly ChapterType[] = [
  'anglesSymmetry',    // AngleShopGame     — tilt
  'areaPerimeter',     // EmptyPlotGame     — two-hand span
  'dataGraphs',        // LoadingBayGame    — finger count
  'decimals',          // CoinTrayGame      — finger count
  'division',          // BusRunGame        — finger count
  'factorsMultiples',  // FactorLabGame     — finger count
  'fractionsCompare',  // PizzaCounterGame  — finger count
  'measurementUnits',  // HeightBarGame     — finger count
]

const AR = new Set<string>(AR_CHAPTERS)

/** Does this chapter ever ask for the camera? */
export function isArChapter(id: string): boolean {
  return AR.has(id)
}

/**
 * May this chapter be shown to a visitor with no account?
 *
 * Deliberately the inverse of `isArChapter` rather than an allow-list of its own: an allow-list is a
 * second thing to keep in step, and the day the two disagree is the day an AR chapter is demo-
 * eligible. One fact, two readings.
 */
export function demoEligible(id: string): boolean {
  return !isArChapter(id)
}
