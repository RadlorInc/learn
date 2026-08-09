/**
 * Drawn walk-cycle sprite sheets for the parade creatures.
 *
 * WHY THIS AND NOT A RIG: the parade art is one static PNG per creature. Swinging cut-out limbs
 * from it (see the git history for `rigs.ts`) gives movement but the SHAPES never change — no knee
 * bend, no body deformation, no silhouette change — so it reads as a cardboard puppet rather than
 * animation. These sheets are frames of a real drawn walk, so the whole character deforms.
 *
 * HOW THEY ARE MADE: generate a short walk-cycle video from the existing sprite (image-to-video,
 * so the frames are temporally COHERENT — independently generated stills drift in style), then
 * `scripts/creature-frames.py` keys the flat green background, crops every frame to ONE shared
 * bounding box, detects the cycle period and writes an equal-cell horizontal strip.
 *
 *     python3 scripts/creature-frames.py <clip>.mp4 rabbit --frames 12 --start 0.55
 *
 * CADENCE WAS RE-TUNED DOWN ~28% ACROSS THE CAST (2026-07-25). Everything read as hurried: an ant
 * cycled every 0.46s and a butterfly every 0.50s, which is a sprint, not a walk. Because a grounded
 * creature's ground speed is DERIVED from fps/frames, lowering it slows the legs and the travel
 * together, so the two stay locked and the feet still never skate. The founder had already flagged
 * the eagle and the ladybug on the very first parade; this finishes that job for all of them.
 *
 * A creature with no entry here just renders its static sprite with the procedural gait, exactly
 * as before — this is purely additive.
 */

export interface Sheet {
  /** Horizontal strip of equal cells. */
  url: string
  /** Number of cells across. Cell width = texture.width / frames. */
  frames: number
  /** Frames per second to play at. Roughly one cycle per 0.5s reads as a walk at parade size. */
  fps: number
  /**
   * One cell's width ÷ height. The parade crops the strip with `overflow: hidden` on a plain
   * element, so it has to be told a cell's width — it cannot know one until the image has loaded.
   */
  cellAspect: number
  /**
   * BALLISTIC SHEETS ONLY (a hop). The share of the cycle the creature spends ON THE GROUND,
   * gathering itself, before it leaves — so `hop()` knows to hold the horizontal there and only
   * travel over the remainder. Without it a hopper SLIDES along the ground while crouched, which is
   * the exact fault that makes a hop unfit for `Critter`'s linear travel.
   *
   * MEASURE IT, don't guess: split the strip, take each cell's alpha bbox, and count the leading
   * frames whose feet are still down. It differs wildly per creature — Milo is grounded for 8 of 19
   * frames (0.42) and the frog for 9 of 12 (0.75), because a frog is mostly a coiled spring and Milo
   * is mostly a pony. Cutting the clip so the cycle STARTS on a grounded frame is what makes this a
   * single leading share rather than a window straddling the loop boundary.
   */
  groundShare?: number
}

/**
 * Keyed by the creature's side-facing sprite URL (`COUNT_SIDE` / `CAST`). Covers storytelling 1
 * (Nature Walk) — forest, underwater and garden. `fps` is that creature's own cadence: an ant
 * scuttles, a shark glides. For a grounded creature it ALSO sets ground speed wherever travel is
 * derived from fps/frames (`groundSpeed` in critters.tsx), so raising it makes it walk faster too.
 */
export const SHEETS: Record<string, Sheet> = {
  // ── forest ──
  '/assets/objects/rabbit_side.png': { url: '/assets/objects/rabbit_walk.png', cellAspect: 0.805, frames: 12, fps: 16 },
  // 9fps = a wing-beat every ~1.3s. An eagle glides; at 18 it looked like it was panicking.
  '/assets/objects/eagle_side.png': { url: '/assets/objects/eagle_walk.png', cellAspect: 1.027, frames: 12, fps: 7 },
  '/assets/objects/butterfly_side.png': { url: '/assets/objects/butterfly_walk.png', cellAspect: 0.844, frames: 12, fps: 17 },
  '/assets/objects/firefly_side.png': { url: '/assets/objects/firefly_walk.png', cellAspect: 1.176, frames: 12, fps: 17 },
  // ── underwater ──
  '/assets/objects/fish_side.png': { url: '/assets/objects/fish_walk.png', cellAspect: 1.371, frames: 12, fps: 10 },
  '/assets/objects/shark_side.png': { url: '/assets/objects/shark_walk.png', cellAspect: 1.746, frames: 12, fps: 9 },
  // 14 cells: the turtle clip had no clean paddle cycle, so its sheet is ping-ponged (forward then
  // back) — seamless by construction, and correct for a limb that just oscillates.
  '/assets/objects/turtle_side.png': { url: '/assets/objects/turtle_walk.png', cellAspect: 1.531, frames: 14, fps: 9 },
  '/assets/objects/crab_side.png': { url: '/assets/objects/crab_walk.png', cellAspect: 1.461, frames: 12, fps: 16 },
  // ── garden ──
  '/assets/objects/squirrel_side.png': { url: '/assets/objects/squirrel_walk.png', cellAspect: 0.996, frames: 12, fps: 14 },
  '/assets/objects/ant_side.png': { url: '/assets/objects/ant_walk.png', cellAspect: 1.117, frames: 12, fps: 19 },
  // A ladybug ambles, it does not sprint. Lower fps also slows its WALK — for a grounded creature
  // ground speed is derived from fps/frames, so legs and travel stay locked and the feet never skate.
  '/assets/objects/ladybug_side.png': { url: '/assets/objects/ladybug_walk.png', cellAspect: 1.469, frames: 12, fps: 9 },
  // ── Nest Tree (number recognition) ──
  // The mother bird, generated for that chapter rather than borrowed from the parade — she is
  // on screen every single round, so she is the one place bespoke art earns its keep. 14fps =
  // a small songbird's beat; the eagle's 9 would read as gliding, not carrying food home.
  '/assets/objects/bird_side.png': { url: '/assets/objects/bird_walk.png', cellAspect: 1.094, frames: 12, fps: 10 },
  // The hungry chick in its nest — the object the child reads and taps, so it is painted and
  // alive rather than a CSS bowl. 22 cells because the clip is PING-PONGED: a chirp oscillates
  // (beak opens, beak shuts) with no clean cycle, so playing it forward-then-back loops
  // seamlessly by construction. 16fps ≈ one bob per 1.4s — eager, not frantic.
  '/assets/objects/nest_side.png': { url: '/assets/objects/nest_walk.png', cellAspect: 1.113, frames: 22, fps: 12 },
  // ── Milo himself (Stepping Stones / number order) ──
  // The first drawn cycle for the CHARACTER rather than a creature, so it is not chapter-specific:
  // any later chapter where Milo has to actually go somewhere can key off this same sprite.
  // 12 cells span one 22-frame source cycle (~0.9s), so 14fps plays it at close to natural pace —
  // and since he only walks while hopping, slightly brisk reads as effort rather than a stroll.
  '/assets/characters/milo_side.png': { url: '/assets/characters/milo_walk.png', cellAspect: 0.586, frames: 12, fps: 10 },

  // ── Farm · Pond · Space (generated 2026-07-27; closes the parade's long-parked "9 creatures") ──
  // Image-to-video off each creature's existing `_side` still, so the still IS the style lock. Every
  // cellAspect below is measured off the delivered strip, not guessed. ⚠️ THE fps VALUES ARE
  // PROPOSALS TUNED BY EAR, NOT MEASUREMENTS — cadence is the one number the founder has twice
  // called too fast, and for a grounded creature it also sets ground speed. Check on screen.
  '/assets/objects/duck_side.png': { url: '/assets/objects/duck_walk.png', cellAspect: 0.758, frames: 12, fps: 12 },
  '/assets/objects/duckling_side.png': { url: '/assets/objects/duckling_walk.png', cellAspect: 0.766, frames: 12, fps: 15 },
  // A chick scurries — the briskest of the farm cast, in the same family as the ant's 19.
  '/assets/objects/chick_side.png': { url: '/assets/objects/chick_walk.png', cellAspect: 0.770, frames: 12, fps: 18 },
  '/assets/objects/lamb_side.png': { url: '/assets/objects/lamb_walk.png', cellAspect: 0.965, frames: 12, fps: 12 },
  // A hop, not a walk: coiled for 9 of 12 frames and airborne for 3. That shape does NOT fit
  // Critter's linear travel — see chapter-craft.md. Play it for a discrete jump, not a journey.
  // Measured feet-lift per frame: 0 0 0 0 0 0 8 44 27 0 0 0 — so the arc is drawn in (peak 44px of
  // a 256px cell, 17% of body height) and `hop()` must supply ONLY the horizontal.
  // ⚠️ groundShare is 0.75 but its cycle is NOT phase-aligned (it is grounded at BOTH ends, f0-5 and
  // f9-11), so re-cut it to start on a grounded frame before using it — see Milo's entry below.
  '/assets/objects/frog_side.png': { url: '/assets/objects/frog_walk.png', cellAspect: 0.637, frames: 12, fps: 14, groundShare: 9 / 12 },
  '/assets/objects/bee_side.png': { url: '/assets/objects/bee_walk.png', cellAspect: 1.066, frames: 12, fps: 17 },
  '/assets/objects/dragonfly_side.png': { url: '/assets/objects/dragonfly_walk.png', cellAspect: 1.074, frames: 12, fps: 18 },
  '/assets/objects/alien_side.png': { url: '/assets/objects/alien_walk.png', cellAspect: 0.457, frames: 12, fps: 14 },
  // Low gravity: a slow, buoyant stride. 8fps for the same reason the eagle sits at 7 — anything
  // brisker stops reading as weightless.
  '/assets/objects/astronaut_side.png': { url: '/assets/objects/astronaut_walk.png', cellAspect: 0.523, frames: 12, fps: 8 },
  /**
   * Milo's HOP — a real ballistic jump, for a chapter where he goes between places rather than
   * walking to one. ⚠️ THE FILE THAT SAT HERE UNTIL 2026-07-28 WAS A WALK: a second take of
   * `milo_walk.png`, measured lift 0 in all 12 frames, registered under this comment and named in
   * two docs as the foundation of HopAlong. Nobody had opened it. A sheet's name is a claim — split
   * the strip and print each cell's alpha bbox before designing on it (chapter-craft.md).
   *
   * 19 CELLS, not the usual 12, and that is the point: a walk is uniform so twelve samples carry it,
   * but a hop's whole character is in its UNEVEN timing, and down-sampling averages the hold frames
   * away. These are the source's own frames at its own rate, so playing 19 @ 24fps reproduces the
   * generated animation exactly — the anticipation and the hang time come free, with no hand-authored
   * timing chart. Measured: 7 grounded frames crouching (body 215px → 177px, real squash), 3 frames
   * rising, a 3-frame hang at the top, 4 descending.
   *
   * ⚠️ THE ARC IS DRAWN INTO THE FRAMES — feet lift 0 → 47 → 0 px in a 256px cell, 22% of body
   * height. `hop()` therefore animates ONLY the horizontal; adding a CSS arc makes him rise twice.
   */
  '/assets/characters/milo_hop_side.png': { url: '/assets/characters/milo_hop.png', cellAspect: 0.621, frames: 19, fps: 24, groundShare: 8 / 19 },

  // ── The 9–11 WORKING CAST (generated 2026-07-31) ──────────────────────────────────────────────
  // The band's whole problem was never the engine, it was the CAST: all 24 cycles above are cozy
  // animals, and a ten-year-old's goods yard with a duckling in it is the "reads too young" fault
  // arriving by another door (docs/story-9-11-rethink.md, "The art, honestly"). These three are the
  // same painted style — the register comes from the JOB and the work clothes, not from a palette.
  // They are band-wide, not one chapter's: any 9–11 world that needs someone to arrive, want
  // something and leave with it can cast them.
  //
  // ⚠️ CUT FROM THE ACTIVE WINDOW, NOT THE FRONT OF THE CLIP. Kling holds the start frame for a
  // beat before it begins moving — measured on the bear, frames 0–17 of 121 have an IDENTICAL
  // feet-span, so a cut at `--start 0` yields a strip that is 9/12 STATIC and reads as a shuffle.
  // Cut from the settled middle instead (bear: --start 0.5124 --end 0.7521, one 29-frame period).
  // A second take with a much stronger "big strides" prompt bought only 1% more stride — the window
  // was the fault, not the wording, so do not pay for a retry before re-cutting.
  //
  // ⚠️ Keyed on MAGENTA: the hi-vis hat is yellow and a green key nibbles yellow edges.
  // fps is tuned by ear and also sets ground speed. The bear is the heaviest thing in the band, so
  // he sits just under Milo's 10 — a foreman plods.
  '/assets/objects/foreman_bear_side.png': { url: '/assets/objects/foreman_bear_walk.png', cellAspect: 0.578, frames: 12, fps: 9 },
  '/assets/objects/driver_badger_side.png': { url: '/assets/objects/driver_badger_walk.png', cellAspect: 0.727, frames: 12, fps: 11 },
  // SLATE — the 9–11 band's apprentice, and the first PROTAGONIST cycle it has ever had. Cut from a
  // 5s image-to-video clip off her approved character sheet.
  // ⚠️ Keyed on MAGENTA, DERIVED not recalled: clearance 200 against green's 185, because her teal
  // kit is exactly what pulls green closer. A green key would eat her hat and tool roll.
  // ⚠️ The walk's first 11 source frames are a HELD START FRAME — cut from the active window (0.30),
  // never from frame 0, or the strip shuffles instead of walking.
  // fps is tuned by ear and UNVERIFIED on screen; for a grounded creature it also sets ground speed,
  // so it is the first number to check if her walk reads wrong. She is younger and lighter than the
  // foreman (9), so she steps a little quicker.
  '/assets/characters/slate_side.png': { url: '/assets/characters/slate_walk.png', cellAspect: 0.359, frames: 12, fps: 11 },
  // Her working cycle — winding the handle, the pose the child's ◀ ▶ is driving. Self-keyed: the
  // sheet is its own still, since there is no separate standing frame for this pose.
  '/assets/characters/slate_work.png': { url: '/assets/characters/slate_work.png', cellAspect: 0.547, frames: 12, fps: 10 },
  // ⚠️ A THIRD cycle — `merchant_fox` — was generated alongside these two and CUT by the founder.
  // Its PNGs are still in public/assets/objects/ and it is deliberately NOT registered here: an
  // unregistered sheet is invisible to the idle-art gate, which is the honest state for art with no
  // home. Re-add this one line to cast it again (cellAspect 0.809, 12 frames, fps 12 measured).
}
