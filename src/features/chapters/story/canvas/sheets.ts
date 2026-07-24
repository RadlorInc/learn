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
   * One cell's width ÷ height. Pixi reads this off the texture, but the DOM parade (the demo and
   * guided rounds, which are plain elements rather than canvas) has to crop the strip itself and
   * cannot know a cell's width until the image has loaded.
   */
  cellAspect: number
}

/**
 * Keyed by the sprite URL passed to `ParadeStage.spawn`. Covers storytelling 1 (Nature Walk) —
 * forest, underwater and garden. `fps` is that creature's own cadence: an ant scuttles, a shark
 * glides. For a grounded creature it ALSO sets ground speed (ParadeStage derives travel from
 * fps/frames so the feet don't skate), so raising it makes the creature walk faster too.
 */
export const SHEETS: Record<string, Sheet> = {
  // ── forest ──
  '/assets/objects/rabbit_side.png': { url: '/assets/objects/rabbit_walk.png', cellAspect: 0.805, frames: 12, fps: 22 },
  // 9fps = a wing-beat every ~1.3s. An eagle glides; at 18 it looked like it was panicking.
  '/assets/objects/eagle_side.png': { url: '/assets/objects/eagle_walk.png', cellAspect: 1.027, frames: 12, fps: 9 },
  '/assets/objects/butterfly_side.png': { url: '/assets/objects/butterfly_walk.png', cellAspect: 0.844, frames: 12, fps: 24 },
  '/assets/objects/firefly_side.png': { url: '/assets/objects/firefly_walk.png', cellAspect: 1.176, frames: 12, fps: 24 },
  // ── underwater ──
  '/assets/objects/fish_side.png': { url: '/assets/objects/fish_walk.png', cellAspect: 1.371, frames: 12, fps: 14 },
  '/assets/objects/shark_side.png': { url: '/assets/objects/shark_walk.png', cellAspect: 1.746, frames: 12, fps: 12 },
  // 14 cells: the turtle clip had no clean paddle cycle, so its sheet is ping-ponged (forward then
  // back) — seamless by construction, and correct for a limb that just oscillates.
  '/assets/objects/turtle_side.png': { url: '/assets/objects/turtle_walk.png', cellAspect: 1.531, frames: 14, fps: 12 },
  '/assets/objects/crab_side.png': { url: '/assets/objects/crab_walk.png', cellAspect: 1.461, frames: 12, fps: 22 },
  // ── garden ──
  '/assets/objects/squirrel_side.png': { url: '/assets/objects/squirrel_walk.png', cellAspect: 0.996, frames: 12, fps: 20 },
  '/assets/objects/ant_side.png': { url: '/assets/objects/ant_walk.png', cellAspect: 1.117, frames: 12, fps: 26 },
  // A ladybug ambles, it does not sprint. Lower fps also slows its WALK — for a grounded creature
  // ground speed is derived from fps/frames, so legs and travel stay locked and the feet never skate.
  '/assets/objects/ladybug_side.png': { url: '/assets/objects/ladybug_walk.png', cellAspect: 1.469, frames: 12, fps: 12 },
  // ── Nest Tree (number recognition) ──
  // The mother bird, generated for that chapter rather than borrowed from the parade — she is
  // on screen every single round, so she is the one place bespoke art earns its keep. 14fps =
  // a small songbird's beat; the eagle's 9 would read as gliding, not carrying food home.
  '/assets/objects/bird_side.png': { url: '/assets/objects/bird_walk.png', cellAspect: 1.094, frames: 12, fps: 14 },
  // The hungry chick in its nest — the object the child reads and taps, so it is painted and
  // alive rather than a CSS bowl. 22 cells because the clip is PING-PONGED: a chirp oscillates
  // (beak opens, beak shuts) with no clean cycle, so playing it forward-then-back loops
  // seamlessly by construction. 16fps ≈ one bob per 1.4s — eager, not frantic.
  '/assets/objects/nest_side.png': { url: '/assets/objects/nest_walk.png', cellAspect: 1.113, frames: 22, fps: 16 },
  // ── Milo himself (Stepping Stones / number order) ──
  // The first drawn cycle for the CHARACTER rather than a creature, so it is not chapter-specific:
  // any later chapter where Milo has to actually go somewhere can key off this same sprite.
  // 12 cells span one 22-frame source cycle (~0.9s), so 14fps plays it at close to natural pace —
  // and since he only walks while hopping, slightly brisk reads as effort rather than a stroll.
  '/assets/characters/milo_side.png': { url: '/assets/characters/milo_walk.png', cellAspect: 0.586, frames: 12, fps: 14 },
}
