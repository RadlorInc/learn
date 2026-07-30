/**
 * The market Milo walks — the six stalls, and the geometry that pins code-drawn things onto
 * painted ones.
 *
 * ⚠️ **THE STALLHOLDERS DO NOT ANIMATE, AND THAT IS A DECISION, NOT AN OVERSIGHT.** Each `keeper_*`
 * strip that ships alongside these scenes is thirteen frames of the keeper moving — and it was
 * WIRED UP, driven, and then taken out again on the founder's call. The reason is worth keeping,
 * because it is about the ART and not about the code:
 *
 *   **A character generated INSIDE its scene can only ever wiggle in place; a character generated
 *   on flat chroma can walk.** The parade cycles (rabbit, duck, Milo) were generated on a flat
 *   field, so keying gives a TRANSPARENT sprite that crosses the screen, leaves, and turns up on
 *   another backdrop. These keepers were generated as whole pictures — stall, goods and keeper in
 *   one frame — so there is nothing to key: the strip is an OPAQUE crop that only makes sense laid
 *   back over the exact pixels it came from. Measured, that patch is **4.4–10.5% of the frame**, so
 *   **93–96% of the picture never moved** and what you saw was a still with a rectangle twitching
 *   in it. Splitting a video into frames is the same pipeline either way; what the animation can BE
 *   is decided upstream, by whether the character was drawn on its own.
 *
 * So the scenes are stills, the stallholders are part of the painting, and **Milo is the only thing
 * that moves** — he walks in, up to the counter, and out. That is honest but thin, and the fix when
 * it is wanted is a real drawn creature shopping in the market: this band has eighteen registered
 * cycles and the chapter uses none of them.
 *
 * ⚠️ **THE BACKDROP'S OWN GEOMETRY IS STILL LOAD-BEARING.** A percentage of the VIEWPORT is not a
 * percentage of the IMAGE once the scene is cropped, so the backdrop and the ground line are laid
 * out by ONE function — `fitFor` — in image pixels scaled by the transform the picture is given.
 * Everything belonging to the CONTROLS (the purse, the answer pad, the banner) stays in viewport
 * units, because that is what a finger is measured against.
 *
 * ⚠️ **FOUR OF THE TEN GENERATED STALLS ARE NOT HERE, FOR FOUR DIFFERENT REASONS.**
 *   • `sweets` (the raccoon) — **founder's call.** Dropped outright.
 *   • `hats` and `toys` — measured **31%** and **26%** of the frame is flat `#fdfdfd`, a hard-edged
 *     blank half where the sky should be. Milo's post is in exactly that half. A one-off gradient
 *     repair was written, run, and **looked worse than the hole** (horizontal banding, because a
 *     row-median fill of a painted scene is a smear); it was thrown away rather than shipped.
 *   • `honey` — its ground line is **0.80**, and at 720px the controls cap the usable line at 0.772.
 *     Milo would stand on the counter edge, which is the floating fault this band has already paid
 *     for twice.
 * All four stay on disk with their strips (~373 Higgsfield credits remain, so regenerating is a
 * live option — the "credits expired" line an earlier handoff carried was wrong).
 */

/** The scenes are all one size — the video frame they were cut from. */
export const SCENE_W = 1284, SCENE_H = 716

/** Plain `object-fit: cover`, which is the floor this chapter never goes below. */
export function coverFit(vw: number, vh: number) {
  const s = Math.max(vw / SCENE_W, vh / SCENE_H)
  return { s, ox: (vw - SCENE_W * s) / 2, oy: (vh - SCENE_H * s) / 2 }
}

/**
 * ⚠️ **THE PICTURE IS PLACED SO ITS OWN GROUND LINE IS THE GROUND LINE.** Straight `cover` is right
 * on a roomy frame and wrong on a short one, and the difference was visible immediately: at 640×320
 * the controls cap the usable ground at **214px** while the fruit stall's painted grass lands at
 * **256**, so Milo stood forty pixels of air above the lawn — the floating fault, arrived at from a
 * direction this band had not seen before. The world was already yielding to the tap targets, which
 * is the right rule; what was missing is that **the backdrop has to yield with it.**
 *
 * So the scene is scaled up until its ground meets the usable line, and the surplus is cropped off
 * the TOP — which is the correct end to lose, because the top of a market stall is an awning and the
 * bottom is where everything stands. On a 16:9 frame the term is inert and this returns `cover`.
 */
export function fitFor(st: Stall, vw: number, vh: number, padBand: number) {
  const cover = Math.max(vw / SCENE_W, vh / SCENE_H)
  const usable = vh - padBand - 14
  const natural = (vh - SCENE_H * cover) / 2 + st.ground * SCENE_H * cover
  const groundPx = Math.min(natural, usable)
  // enough scale that the bottom still reaches vh once the ground is pinned at groundPx
  const s = Math.max(cover, (vh - groundPx) / ((1 - st.ground) * SCENE_H))
  const oy = Math.min(0, groundPx - st.ground * SCENE_H * s)
  return { s, ox: (vw - SCENE_W * s) / 2, oy, groundPx }
}

export interface Stall {
  key: string
  scene: string
  /**
   * ⚠️ **PER SCENE, PICKED BY EYE AGAINST THE STALL'S OWN FOOT, WITH ROUGHNESS AS THE GATE BEHIND
   * IT.** Both halves of that are paid for. The band is per scene because placeValue's shared
   * 0.66–0.78 cuts through the COUNTER on these paintings and reports 8–13 for pictures whose
   * ground is glassy. And the line inside that band is chosen by LOOKING, because a roughness scan
   * cannot tell you where the horizon is — every row of an open field is smooth, so it certified the
   * sweets stall at 0.60 and Milo stood in mid-air a stall's height above the grass. Milo is a
   * customer at the front of the stall, so his feet sit at or just under the stall's base.
   *
   * ⚠️ The 0.65–0.80 table the art pass recorded is NOT these numbers. It was measured off the
   * pictures rather than off a figure standing in them, and driving it put Milo 50px above the
   * ground — caught on screen, not by any check. 0.77 is also the practical ceiling: at 720px the
   * controls cap the usable line at 0.772.
   */
  ground: number
  /** What this stall sells. The scene already shows it; this is the one Milo carries away. */
  good: string
  /** ...and what to call it, in a sentence a six-year-old hears. ⚠️ Spoken with `an` where it needs
   *  one — "Fox has a apple" was on screen before anyone thought to look at the article. */
  one: string
  /** Who keeps it — spoken, so the child meets a different person every round. */
  who: string
  /**
   * The keeper's MOUTH, in SOURCE PIXELS — the speech bubble's tail points here. Read off the
   * pictures with markers rather than guessed: every stall frames its keeper differently, so a
   * shared fraction of the frame lands on a shoulder in half of them.
   */
  say: { x: number; y: number }
}

/**
 * ⚠️ Order matters twice: consecutive slots must not repeat a scene, and the demo pays the same
 * price two ways so its two stalls should feel like two different shops.
 */
export const STALLS: Stall[] = [
  { key: 'fruit',   scene: 'market_fruit.png',   ground: 0.77, good: 'apple.png',        one: 'apple', who: 'Fox',      say: { x: 334, y: 272 } },
  // ⚠️ bread is the one where the NUMBER moved first and the eye agreed afterwards: at the recorded
  // 0.73 the gate's band reaches 0.71, which measures roughness **7.0** because the stall's
  // right-hand end still runs through it. Clean from 0.74 down, and 0.77 is where its foot is.
  { key: 'bread',   scene: 'market_bread.png',   ground: 0.77, good: 'grocery_bun.png',  one: 'bun',   who: 'Bear',     say: { x: 372, y: 219 } },
  { key: 'fish',    scene: 'market_fish.png',    ground: 0.77, good: 'fish.png',         one: 'fish',  who: 'Otter',    say: { x: 450, y: 246 } },
  { key: 'flowers', scene: 'market_flowers.png', ground: 0.75, good: 'flower_tulip.png', one: 'tulip', who: 'Hedgehog', say: { x: 355, y: 225 } },
  { key: 'pots',    scene: 'market_pots.png',    ground: 0.77, good: 'bucket.png',       one: 'pot',   who: 'Goat',     say: { x: 450, y: 252 } },
  { key: 'cheese',  scene: 'market_cheese.png',  ground: 0.76, good: 'grocery_egg.png',  one: 'egg',   who: 'Badger',   say: { x: 361, y: 215 } },
]

/** "a apple" / "a egg" are the two this cast produces. One line, rather than six hand-written
 *  sentences that can each rot on their own. */
export const aOrAn = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')

/**
 * ⚠️ **ONE ORDERED RUN, INDEXED STRAIGHT AND NEVER MODULO** — demo (2) → guided (1) → ten scored.
 * Six stalls against thirteen slots means a stall MUST come round again, and that is the craft
 * rule as written: *consecutive rounds differ*, not *every round is unique*. The all-distinct
 * version of this gate is what once put a fence on a pond.
 */
const ORDER = [0, 1, 2, 3, 4, 5, 0, 2, 1, 4, 3, 5, 2]
export const RUN_LENGTH = ORDER.length
/** The single accessor every round goes through — a gate that reads the ORDER array cannot see how
 *  the chapter indexes it. */
export const stallAt = (i: number): Stall => STALLS[ORDER[Math.min(Math.max(i, 0), ORDER.length - 1)]]
export const DEMO_SLOTS = 2
export const GUIDED_SLOT = DEMO_SLOTS
export const scoredSlot = (round: number) => GUIDED_SLOT + 1 + round

// ─── Where things stand ───────────────────────────────────────────────────────────────
/**
 * The stall owns the left of every one of these paintings and the grass is open on the right, so
 * Milo comes from off-frame RIGHT and everything he does runs right-to-left. That is not a
 * coincidence to be relied on quietly: it is why his facing is stated per leg below and why the
 * gate asserts the cloth ends clear of him.
 */
export const OFF_X = 114        // off-frame right

/**
 * THE SHOPPERS. ⚠️ **THE ONE THING IN THIS CHAPTER THAT IS PROPERLY ANIMATED, AND IT COST NOTHING.**
 * The band has eighteen registered drawn cycles and the chapter was using none of them — which is
 * exactly the weakness BlockYard's own header admits to (*"a block has no legs, nothing walks but
 * Milo"*), rebuilt here by accident. These are real cutouts on transparency, so unlike the painted
 * stallholders they can walk in, stand, and leave.
 *
 * ⚠️ **WHICH WAY EACH PNG NATIVELY FACES IS PER SPRITE, AND BOTH OF MY INSTRUMENTS GOT IT WRONG.**
 * I rendered the six at thumbnail size, called them all left-facing, and shipped a duck and a
 * squirrel walking BACKWARDS — caught by the founder on a screenshot. Then a script that scored ink
 * mass in the top third also said the squirrel faced left, because **its bushy tail fills the
 * top-left and outweighs its head.** What settled it was rendering them LARGE and looking. Only
 * `rabbit` faces left; the other five face right — and `CAST` in critters.tsx already recorded that
 * for the two that appear there, which the gate now cross-checks. A sprite facing the wrong way
 * moonwalks, and the flip is `wantLeft !== facesLeft`.
 *
 * ⚠️ **AND THEY ARE SIZED AGAINST EACH OTHER.** A chick drawn the height of a lamb is the craft
 * doc's own "an ant the size of a lamb" fault; `Kind.scale` exists in critters.tsx for precisely
 * this and its comment says so. These are background life rather than a countable set, so a scale
 * table is the honest tool here — the one-size-band rule is for things a child has to count.
 */
export const SHOPPERS: { src: string; scale: number; facesLeft: boolean }[] = [
  { src: '/assets/objects/rabbit_side.png', scale: 1.0, facesLeft: true },
  { src: '/assets/objects/duck_side.png', scale: 0.95, facesLeft: false },
  { src: '/assets/objects/squirrel_side.png', scale: 0.9, facesLeft: false },
  { src: '/assets/objects/lamb_side.png', scale: 1.15, facesLeft: false },
  { src: '/assets/objects/duckling_side.png', scale: 0.7, facesLeft: false },
  { src: '/assets/objects/chick_side.png', scale: 0.65, facesLeft: false },
]
export const shopperAt = (slot: number) => SHOPPERS[slot % SHOPPERS.length]
/** Where a shopper stops to browse — clear of the widest stall, which reaches ~65%. */
export const SHOPPER_X = 67
/** How far BEHIND Milo they stand, as a share of the height. Further back is higher AND smaller;
 *  the two cues have to agree or a child reading depth off size gets the opposite answer. */
export const SHOPPER_LIFT = 0.035
export const SHOPPER_SCALE = 0.62      // of Milo's height, before the per-creature scale
export const MILO_X = 80        // his post, out on the grass where a customer would wait
export const PAY_X = 62         // where he hands the coins over
/**
 * The price board, standing at the stall's foot. ⚠️ 20, not 34: coins are called up from off-frame
 * left and travel along the ground to the cloth, so at 34 the board stood **in the flight path** and
 * a coin crossed the price on its way past. The lane a thing travels down is part of the layout.
 */

/** How many coins the card's tray holds. A price whose fewest form will not fit is rejected at
 *  generation, so the tray can never be the reason a round is unwinnable. */
export const PURSE_MAX = 8

/**
 * ⚠️ **THE BAND THE CONTROLS NEED IS PER ROUND TYPE, AND SAYING SO IS WHAT KEEPS THE KEEPER ON
 * SCREEN.** The coin card is ONE row — tray, purse, back, Pay — so it wants far less height than the
 * two-row `AnswerPad` a `read` round uses. Handing `fitFor` the pad's band on every round pushed the
 * ground up, which pushed the scale up, which **cropped the stallholder's head off a 640×320 frame**
 * — and he is now the one asking the question. State the real band and the problem disappears on
 * every `pay` round; the `read` rounds keep the pad's.
 */
export const CARD_BAND = (vh: number) => Math.round(Math.max(66, Math.min(vh * 0.15, 108)))

/**
 * The card's one measurement, exported so the scene and the gate cannot disagree about it — a gate
 * that re-implements a rule cannot see the rule being removed.
 *
 * ⚠️ **THE WIDTH TERM IS NOT DECORATION.** Sized off the band alone the card came out **930px wide
 * on a 900px frame** — the Pay button off the right-hand edge, i.e. a round that cannot be
 * committed. Caught by the gate, not by eye, because 900×500 is neither the laptop nor the phone
 * anybody drives by hand.
 */
export function cardMetrics(vw: number, band: number) {
  const w = Math.max(28, Math.min(52, band - 24, vw / 22))
  const px = Math.max(26, Math.round(w * 0.9))          // a purse coin, which has to be READ
  const tray = Math.max(26, Math.round(px * 0.72))      // a coin already put down, drawn FLAT
  /** Everything laid end to end: the reserved tray, four purse buttons, back, Pay, gaps, padding. */
  const width = PURSE_MAX * (tray * 1.1)
    + 4 * (px * 1.14 + w * 0.4)
    + w * 0.92 + w * 0.72 + w * 1.1 + w * 1.12
    + 8 * (w * 0.3) + w * 0.68 + 16
  return { w, px, tray, width }
}

export const MILO_ASPECT = 0.586          // milo_side's measured cellAspect
export const MILO_SHARE = 0.40            // his height, as a share of a roomy viewport

/**
 * The ground line in VIEWPORT pixels — the scene's own line, never reaching into the controls,
 * because their buttons are tap targets and may not shrink. See `fitFor`: the backdrop is moved to
 * meet this, rather than this being clamped away from the backdrop.
 */
export const groundPxFor = (st: Stall, vw: number, vh: number, padBand: number) =>
  fitFor(st, vw, vh, padBand).groundPx

/** ⚠️ Derived from the room between the banner and the ground, not from a share of the height: on a
 *  640×320 frame a flat 0.40 puts his head inside the banner. Buy height from the chrome. */
export const miloHFor = (vh: number, groundPx: number, bannerPx: number) =>
  Math.max(74, Math.round(Math.min(MILO_SHARE * vh, groundPx - bannerPx - 8)))
export const miloHalfPct = (miloH: number, vw: number) => ((miloH * MILO_ASPECT) / 2 / vw) * 100

/** ⚠️ The floor is 22, not 18: a coin carries its value as a numeral at 42% of its size, so a 19px
 *  coin prints an 8px digit — unreadable, and the digit is the whole affordance. */
export const coinPxFor = (vw: number, vh: number) =>
  Math.max(22, Math.min(44, Math.floor(Math.min(vw * 0.034, vh * 0.062))))
