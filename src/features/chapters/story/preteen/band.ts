/**
 * The pre-teen board band — the one piece of layout arithmetic every 9–11 neon chapter needs.
 *
 * ⚠️ THIS IS THE FOURTH CHAPTER TO WANT IT, WHICH IS WHERE THE COPYING STOPS. `factors.ts`
 * (`benchBand`), `pizza.ts` and `cents.ts` (`boardBand`) each carry a byte-identical version, and
 * cents.ts records the debt in a `ponytail:` comment saying to extract it once those two are
 * committed. They are (main@0c9418b), so this is that extraction.
 *
 * ⚠️ ONLY THE ARITHMETIC IS SHARED — THE CONSTANTS ARE NOT, AND THAT IS DELIBERATE. The three
 * chapters do NOT agree on their bottom band (112/152 for a dwell ring, 118/158 for a ring plus a
 * wider pad), so hoisting the numbers would silently re-tune two shipped chapters. Each keeps its
 * own `TOP_BAND`/`BOT_BAND` and passes them in.
 *
 * ⚠️ AND THE THING WORTH SHARING IS THE CLAMP, WHICH IS THE PART THAT WAS LEARNED THE HARD WAY:
 * it goes on `top`, NOT as a floor on the band. `Math.max(90, …)` hands back 90 once the question
 * card has wrapped far enough down and the board is then drawn straight into the controls — over the
 * note pill and the answer row, which is what Factor Lab shipped at 640×320. Clamping `top` slides
 * the board UP under the question card (text the child has already read) rather than DOWN onto
 * targets they have to hit.
 */

/** The smallest band a board may have before the clamp starts giving ground instead. */
export const MIN_BAND = 90

export interface Band { top: number; bot: number; band: number }

/**
 * @param vh       viewport height
 * @param topWant  where the board would like to start — usually `max(TOP_BAND, promptBottom + pad)`
 * @param bot      the bottom band the controls own
 */
export function fitBand(vh: number, topWant: number, bot: number, min = MIN_BAND): Band {
  const top = Math.min(topWant, Math.max(0, vh - bot - min))
  return { top, bot, band: Math.max(min, vh - top - bot) }
}

/**
 * Milo's right edge in pixels — his OWN geometry rather than a guess about it. `PtMilo` is
 * `left: 9%` with `translateX(-50%)` and `width: min(20vh, 160px)`.
 */
export const miloRight = (vw: number, vh: number) => vw * 0.09 + Math.min(vh * 0.20, 160) / 2

/**
 * The lane Milo gets on the left, so an answer pad centres in what is left.
 *
 * ⚠️⚠️ IT KEYS ON WIDTH, AND KEYING IT ON `short` IS THE FACTORLAB FAULT VERBATIM. `short` is
 * `vh < 470`, so a NARROW BUT TALL frame took the 12px lane: measured live at 466×676, Milo's box
 * covered the pad's `0` and `1` keys. He is `pointerEvents: none`, so the tap still lands and no
 * probe, console or gate can see it — only crossing his box with the pad's. What decides whether the
 * pad reaches him is WIDTH, which `short` does not measure. Above 900px the pad centres clear of him
 * on its own, so the lane there is only a margin — which a gate should assert rather than assume.
 */
export const MILO_LANE = (vw: number, vh: number) =>
  vw >= 900 ? 12 : Math.ceil(miloRight(vw, vh)) + 8
