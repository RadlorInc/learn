/**
 * The top strip every 6–8 story chapter carries — the Menu button and the round banner — and how
 * tall it is.
 *
 * ⚠️ IT LIVES HERE BECAUSE THERE ARE TWO CONSUMERS NOW (TickTock and SliceShop), and the number is
 * one a chapter must not guess at. It was picked once (38 on a short frame) while the button itself
 * measured 41px tall from a 12px offset, so the bubble below it opened 13px INSIDE the button —
 * measured on screen at 640×320. Two independent guesses about one gap is the same fault as
 * StoryTime's answer box landing on its own button row.
 *
 * [clock.ts](./clock.ts) re-exports all three, so TickTock's imports are unchanged — which is what
 * makes its existing gate the proof that moving them changed nothing.
 */

/** How far the Menu button and the round banner sit from the top edge. */
export const CHROME_PAD = 12

/** The Menu button's own metrics, so the band below is DERIVED from them rather than assumed.
 *  On a short frame the button shrinks too: height comes out of the CHROME before it comes out of
 *  the world. */
export const menuBtn = (short: boolean) => ({ font: short ? 11 : 13, padY: short ? 5 : 7, padX: short ? 11 : 14 })

/** The tallest thing in the top strip: the round banner, which is a size up from the button. */
const bannerH = (short: boolean) => Math.ceil((short ? 12 : 17) * 1.25) + (short ? 4 : 8) * 2 + 6

export const chromeTop = (short: boolean) => {
  const b = menuBtn(short)
  const btnH = Math.ceil(b.font * 1.25) + b.padY * 2 + 6   // 3px border, top and bottom
  return CHROME_PAD + Math.max(btnH, bannerH(short)) + 4    // +4 so nothing merely touches
}
