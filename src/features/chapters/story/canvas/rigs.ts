/**
 * Cut-out rigs — turning a flat painted sprite into an articulated one.
 *
 * WHY: the parade art is one static PNG per creature, so every gait in ParadeStage is procedural
 * (bob / squash / lean on a single frame). That reads as alive but the legs never actually move.
 * Redrawing 20 creatures as vectors was tried and looked markedly worse than the painted art, so
 * instead we CUT the painted art and swing the pieces.
 *
 * THE TRICK, and why it leaves no seam: a side-view creature's lower legs hang BELOW the body
 * silhouette, against transparent background. Cutting them out therefore removes nothing from the
 * body — there is no hole to patch. The pieces are then taken from ABOVE the cut (`legTop`) while
 * the body keeps everything down to `cutY`, so the two overlap by ~50px and the joint is buried
 * under the body's own pixels. Small swings never expose it.
 *
 * NO EXTRA ASSETS: the body is assembled from sub-rectangles of the SAME texture — one slab above
 * the cut, plus the gap strips between the legs below it. So the cut coordinates live only here,
 * and adding a creature is a table entry, not an art export.
 *
 * FINDING THE NUMBERS: scan the alpha channel for opaque column runs a little below the body
 * (see `scripts/creature-legs.py`) — do NOT eyeball them off the image, that produced boxes which
 * notched the belly and missed the legs entirely.
 *
 * CEILING: a flat side view has no hidden far leg, so the far pair is the two legs already drawn
 * in the art, swung in opposite phase. It reads as a walk; it is not a true four-leg cycle.
 */

export interface RigLeg {
  /** Horizontal extent of the leg in SOURCE pixels. */
  x0: number
  x1: number
  /** Joint to rotate about, in source pixels. Sits above `cutY`, inside the body. */
  pivotX: number
  pivotY: number
  /**
   * Where this leg sits in the cycle, as a fraction 0..1. A quadruped walks on FOUR beats
   * (0, ¼, ½, ¾ — diagonally opposite legs a quarter apart), not two legs against two; putting
   * them in two rigid antiphase groups is what makes a rig read as a pendulum. Insects use an
   * alternating tripod, so 0 / 0.5 is correct for them.
   */
  phase: number
  /** Near-side legs draw in front of the body, far-side behind it. */
  near: boolean
  /** Swing amplitude, radians. */
  amp: number
}

export interface Rig {
  /** Body keeps every source row above this; legs are cut from here down. */
  cutY: number
  /** Leg pieces start here — deliberately above `cutY` so the joint overlaps the body. */
  legTop: number
  /** Bottom of the leg pieces (just past the paws). */
  bottom: number
  legs: RigLeg[]
}

/**
 * Keyed by the sprite URL passed to `ParadeStage.spawn`. Creatures with no entry render as before.
 * All of these came out of `scripts/creature-legs.py <png> <cutY>`, which labels each leg below the
 * cut and prints the entry; amplitudes are then tuned by eye per creature.
 *
 * NOT RIGGED, deliberately: eagle, fish and shark. Their moving parts are wings and fins, which
 * attach ON TOP of the body rather than hanging below it — cutting one leaves a real hole in the
 * body that has to be painted back in. That is a different (harder) job than this one.
 */
export const RIGS: Record<string, Rig> = {
  // Hand-tuned and verified in the browser; the script agrees with it to within a few px.
  '/assets/objects/rabbit_side.png': {
    cutY: 796,
    legTop: 742,
    bottom: 884,
    legs: [
      { x0: 310, x1: 405, pivotX: 357, pivotY: 760, phase: 0, near: true, amp: 0.23 },
      { x0: 428, x1: 545, pivotX: 490, pivotY: 760, phase: 0.5, near: false, amp: 0.23 },
      { x0: 538, x1: 672, pivotX: 616, pivotY: 766, phase: 0.75, near: true, amp: 0.19 },
      { x0: 680, x1: 808, pivotX: 752, pivotY: 766, phase: 0.25, near: false, amp: 0.19 },
    ],
  },
  // Two hind legs. The bushy tail ends left of x=340, so it stays out of the leg pieces.
  '/assets/objects/squirrel_side.png': {
    cutY: 800,
    legTop: 755,
    bottom: 858,
    legs: [
      { x0: 359, x1: 454, pivotX: 388, pivotY: 778, phase: 0, near: true, amp: 0.20 },
      { x0: 626, x1: 732, pivotX: 678, pivotY: 778, phase: 0.5, near: true, amp: 0.20 },
    ],
  },
  // Six legs, alternating tripods. Thin legs → a small overlap, or the abdomen gets dragged in.
  '/assets/objects/ant_side.png': {
    cutY: 722,
    legTop: 708,
    bottom: 898,
    legs: [
      { x0: 121, x1: 271, pivotX: 244, pivotY: 715, phase: 0, near: true, amp: 0.13 },
      { x0: 269, x1: 374, pivotX: 353, pivotY: 715, phase: 0.5, near: true, amp: 0.13 },
      { x0: 329, x1: 434, pivotX: 411, pivotY: 715, phase: 0, near: true, amp: 0.13 },
      { x0: 509, x1: 589, pivotX: 528, pivotY: 715, phase: 0.5, near: true, amp: 0.13 },
      { x0: 614, x1: 720, pivotX: 636, pivotY: 715, phase: 0, near: true, amp: 0.13 },
      { x0: 711, x1: 830, pivotX: 734, pivotY: 715, phase: 0.5, near: true, amp: 0.13 },
    ],
  },
  // Cut below where the legs stop touching each other — higher up they merge into one blob.
  '/assets/objects/ladybug_side.png': {
    cutY: 668,
    legTop: 656,
    bottom: 779,
    legs: [
      { x0: 178, x1: 314, pivotX: 277, pivotY: 662, phase: 0, near: true, amp: 0.12 },
      { x0: 319, x1: 379, pivotX: 357, pivotY: 662, phase: 0.5, near: true, amp: 0.12 },
      { x0: 434, x1: 532, pivotX: 509, pivotY: 662, phase: 0, near: true, amp: 0.12 },
      { x0: 525, x1: 582, pivotX: 554, pivotY: 662, phase: 0.5, near: true, amp: 0.12 },
      { x0: 691, x1: 791, pivotX: 710, pivotY: 662, phase: 0, near: true, amp: 0.12 },
    ],
  },
  // The raised claw is NOT rigged — it sits above the shell, so cutting it would hole the body.
  '/assets/objects/crab_side.png': {
    cutY: 742,
    legTop: 722,
    bottom: 791,
    legs: [
      { x0: 242, x1: 282, pivotX: 262, pivotY: 732, phase: 0, near: true, amp: 0.14 },
      { x0: 308, x1: 361, pivotX: 333, pivotY: 732, phase: 0.5, near: true, amp: 0.14 },
      { x0: 480, x1: 520, pivotX: 499, pivotY: 732, phase: 0, near: true, amp: 0.14 },
      { x0: 551, x1: 591, pivotX: 571, pivotY: 732, phase: 0.5, near: true, amp: 0.14 },
      { x0: 600, x1: 742, pivotX: 670, pivotY: 732, phase: 0, near: true, amp: 0.14 },
    ],
  },
  // Flippers, paddling on the swim cadence. The far back-left flipper ends above the cut, so it
  // stays part of the body — three of the four paddle, which reads fine in water.
  '/assets/objects/turtle_side.png': {
    cutY: 685,
    legTop: 643,
    bottom: 800,
    legs: [
      { x0: 238, x1: 294, pivotX: 264, pivotY: 664, phase: 0, near: true, amp: 0.16 },
      { x0: 449, x1: 675, pivotX: 595, pivotY: 664, phase: 0.5, near: true, amp: 0.16 },
      { x0: 701, x1: 788, pivotX: 746, pivotY: 664, phase: 0, near: true, amp: 0.16 },
    ],
  },
}
