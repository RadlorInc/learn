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
/**
 * ⚠️ `minH` IS 44 ON A ROOMY FRAME AND UNSET ON A SHORT ONE, and both halves were measured.
 *
 * On a roomy frame the strip is already 44px tall because the round BANNER is the tallest thing in
 * it (`bannerH` below), so giving the button a 44px tap target costs the world nothing — it fills
 * a band that exists. On a SHORT frame the button is the tallest thing and the band is 30px, so
 * forcing 44 would take 14px straight out of the play area — and chapter-craft.md's rule is that on
 * a short frame height comes out of the CHROME before it comes out of the world, not the other way
 * round. 30px still clears WCAG 2.5.8 AA's 24px floor; it misses the 44 aim, knowingly.
 */
export const menuBtn = (short: boolean) => ({ font: short ? 11 : 13, padY: short ? 5 : 7, padX: short ? 11 : 14, minH: short ? undefined : 44 })

/** The tallest thing in the top strip: the round banner, which is a size up from the button. */
const bannerH = (short: boolean) => Math.ceil((short ? 12 : 17) * 1.25) + (short ? 4 : 8) * 2 + 6

export const chromeTop = (short: boolean) => {
  const b = menuBtn(short)
  const btnH = Math.max(b.minH ?? 0, Math.ceil(b.font * 1.25) + b.padY * 2 + 6)   // 3px border, top and bottom
  return CHROME_PAD + Math.max(btnH, bannerH(short)) + 4    // +4 so nothing merely touches
}
