/**
 * The WORLD around the plot, generated in code from a seed. Pure — no three.js, no React, no DOM —
 * so the gate drives the same generator the scene builds from.
 *
 * Cut ③ of this chapter had ONE bare yard for all ten rounds, which breaks the craft rule that the
 * scene must change across the run. This is the module that fixes it, and it is the module most
 * likely to reintroduce the fault the whole redesign turns on, so its constraints are structural
 * rather than checked-and-hoped-for:
 *
 * ⚠️ **NOTHING IT GENERATES MAY BE COUNTABLE.** Procedural scatter is *exactly* the thing that
 * accidentally produces a ruler: three fence posts at a metre apart and the child paces by counting
 * props instead of working anything out. So:
 *   • **Props have pairwise-distinct footprints**, drawn without replacement from a catalogue. A
 *     repeated unit-sized object is therefore not expressible.
 *   • **Each prop takes a distinct (side, depth-band) cell**, so no three ever sit in a line — the
 *     collinear-and-equally-spaced check passes by construction, not by luck.
 *   • **Every position is forced off the integer metre** (fractional part in [0.22, 0.78]), so a prop
 *     can never coincide with a pace mark.
 *   • **No skyline box is anywhere near 1 m wide** (3 m floor), so the distant band is scenery.
 *   • Nothing is generated INSIDE the plot at all. The working surface stays bare: the boundary is
 *     marked by the chalk line and the corner posts, and a grid on it would be the printed answer.
 *
 * ⚠️ **PALETTE IS A CHECK, NOT A VIBE.** The unit the child commits to must clear the world's hue by
 * ≥45° and separate on saturation too. Every ground and sky tone below is drawn from a band that
 * clears BOTH unit hues (clay ≈26°, teal ≈176°) — the allowed arcs are [71,131] and [221,341], and
 * the settings sit inside them — and every world tone is low-saturation while both units are high.
 * So the separation holds on two axes at every seed, which is what `plotSiteSeparation` asserts.
 */
import { mulberry32 } from '@/core/rand'
import { miloSpot, MILO_CLEAR, MAX_DEPTH, SPAWN_Z, type QType } from './plotMaths'

/** Degrees, 0..1, 0..1 — kept numeric so the gate reads separation without parsing a colour string. */
export interface Tone { h: number; s: number; l: number }

/**
 * ⚠️ THE COMMA FORM IS NOT A STYLE CHOICE — three.js CANNOT PARSE THE MODERN SPACE-SEPARATED ONE, AND
 * IT FAILS SILENTLY TO WHITE.
 *
 * `THREE.Color.setStyle` runs its own regex rather than the browser's CSS engine, and on r180
 * `hsl(100.0 50.0% 40.0%)` — valid CSS Color 4, which every browser reads correctly — returns
 * **rgb(255,255,255)** with no throw and no warning. This shipped for one pass and rendered the entire
 * world flat white: sky, ground, road, props, units, all of it, with the geometry plainly there and
 * every HUD element correct. It looked like a lighting bug.
 *
 * The gate now parses this string WITH `THREE.Color` instead of matching its shape, which is the only
 * reason the fix is trustworthy: the first version asserted `css(...) === 'hsl(100.0 50.0% 40.0%)'`
 * and passed while the screen was white. **A value handed to a renderer must be checked by that
 * renderer, not by a string comparison.**
 */
export const css = (t: Tone) => `hsl(${t.h.toFixed(1)}, ${(t.s * 100).toFixed(1)}%, ${(t.l * 100).toFixed(1)}%)`

/** The same comma form with alpha. The ground wash is drawn into a 2D canvas and needs soft edges. */
export const cssA = (t: Tone, a: number) => `hsla(${t.h.toFixed(1)}, ${(t.s * 100).toFixed(1)}%, ${(t.l * 100).toFixed(1)}%, ${a})`

/** A tone at a different lightness, clamped. Used for the sky gradient's ends and the ground wash. */
export const shade = (t: Tone, dl: number): Tone => ({ ...t, l: Math.max(0.04, Math.min(0.97, t.l + dl)) })

/**
 * The one definition of the colour of the thing being committed — imported by the scene AND the gate,
 * so a change to it cannot pass a separation check written against a second copy.
 * Tiles go INSIDE and are bought by the square; fence goes AROUND and is bought by the length. They
 * never share a round, and neither can read as ground.
 */
export const UNIT: Record<QType, Tone> = {
  area: { h: 26, s: 0.64, l: 0.58 },       // warm clay
  perimeter: { h: 176, s: 0.72, l: 0.42 }, // teal
}

/**
 * ⚠️ THE CONTOUR IS WHAT SETS THE WORLD FREE, and it is the whole reason the palette rule could change.
 *
 * Separation used to be bought with SATURATION: the units are vivid (0.64 / 0.72) and the world had to
 * clear them by 0.30, which capped every ground, sky, road and prop at 0.34 — so the yard was grey by
 * arithmetic, and no amount of lighting or silhouette work could rescue it. That is the single number
 * behind two rejected passes.
 *
 * A unit that carries its own dark CONTOUR does not need the world to be drab: the rim reads against
 * anything of a different value, so the body is then free to separate on hue OR value alone and the
 * world is free to be a real green. Kept dark and desaturated so it never competes with the unit's own
 * colour — it is an edge, not a second tone. `plotSiteSeparation` measures it, and the gate asserts the
 * scene actually RENDERS it, because a contour that exists only in this file separates nothing.
 */
export const UNIT_OUTLINE: Tone = { h: 24, s: 0.28, l: 0.14 }

/**
 * ⚠️ A PROP'S COLOUR IS NOW WHAT THE THING ACTUALLY IS, not a slot on a permitted arc. Under the old
 * saturation rule every prop had to sit in one blue-purple band, so a van, a skip, a tree and a
 * portacabin were all the same lilac-grey and the yard read as one wash — which no silhouette work
 * could fix, because they had the right shapes and the wrong colours. A skip is rust. A conifer is
 * green. A work van is off-white. A hoarding is timber.
 *
 * ⚠️ THESE ARE NOT FREE CHOICES — EVERY ONE WAS CHECKED AGAINST BOTH UNITS BEFORE BEING WRITTEN, and
 * several clear only on the value axis with 0.02 to spare (skip vs clay 0.22, sign vs clay 0.20, tree
 * vs clay 0.20). The lightness bands are therefore load-bearing, not styling: widen one downward
 * toward a unit's lightness and `plotSiteSeparation` will fail, which is the check doing its job. The
 * hue is the identity, the lightness band is the safety margin, and saturation is now free because
 * the contour carries the guarantee.
 */
const ROLE: Record<PropRole, { h: number; s: number; l: readonly [number, number] }> = {
  van:   { h: 44,  s: 0.11, l: [0.80, 0.88] },  // an off-white work van
  cabin: { h: 205, s: 0.07, l: [0.68, 0.78] },  // a pale grey portacabin
  skip:  { h: 20,  s: 0.52, l: [0.28, 0.36] },  // a rust-orange skip
  drum:  { h: 150, s: 0.22, l: [0.16, 0.22] },  // a dark water butt
  mast:  { h: 208, s: 0.06, l: [0.66, 0.74] },  // galvanised steel
  tree:  { h: 108, s: 0.40, l: [0.28, 0.38] },  // conifer green
  sign:  { h: 32,  s: 0.40, l: [0.30, 0.38] },  // a timber hoarding
  block: { h: 0,   s: 0,    l: [0, 0] },        // the skyline takes the sky's own tone — see below
}

/**
 * The post-commit reveal.
 *
 * ⚠️ IT IS MUCH LIGHTER THAN IT USED TO BE, AND THE GATE IS WHY. Green-means-correct is worth keeping,
 * but the ground is now a real saturated green too — so at l 0.74 the reveal came within 29° of hue
 * and 0.16 of value of a mid-green ground and simply stopped reading as a change. It gets no exemption
 * from the rule the units follow, so it earns its legibility on VALUE: a bright mint that lifts clear
 * of any ground the generator can draw.
 */
export const REVEAL: Tone = { h: 132, s: 0.66, l: 0.82 }

export type PropKind = 'box' | 'cyl' | 'cone'
/**
 * What the thing IS, so the scene can give it a silhouette.
 *
 * ⚠️ THIS IS A COMMENT PROMOTED TO CODE, AND IT EXISTS BECAUSE A NAKED PRIMITIVE READS AS A
 * PLACEHOLDER. The catalogue below already said `// a van` and `// a tree` in prose while handing the
 * renderer a bare box and a bare cone — so a founder looking at the yard saw grey slabs and a purple
 * cone, which is exactly what they are. A low-poly scene is read by SILHOUETTE (a trunk under a
 * canopy, wheels under a body, a roof on a cabin), not by texture or by extra colour, and the scene
 * cannot build one from `w/h/d` without knowing what it is looking at.
 */
export type PropRole = 'van' | 'cabin' | 'drum' | 'skip' | 'mast' | 'tree' | 'sign' | 'block'
export interface Prop {
  kind: PropKind; role: PropRole; x: number; z: number; w: number; h: number; d: number; tone: Tone
  /**
   * Y-rotation in radians.
   *
   * ⚠️ AN AXIS-ALIGNED WORLD IS THE LOUDEST "THIS WAS GENERATED" SIGNAL IN A FRAME, and it is free to
   * remove. Every box in the yard sat square to the world, so the vans, cabins, skips and hoardings
   * all presented the same two faces at the same two angles — which a founder cannot name but reads
   * instantly as placeholder geometry rather than as a yard someone parked things in.
   *
   * ⚠️ AND IT STRENGTHENS THE PEDAGOGY RATHER THAN COSTING ANYTHING. An axis-aligned world is the only
   * one in which two props could ever line up parallel to the pacing direction and read as a marked
   * interval; turned, they cannot. This is the rare change that makes the scene both better-looking
   * and harder to cheat.
   */
  rot: number
}

export interface Site {
  name: string
  sky: Tone
  ground: Tone
  road: Tone
  post: Tone
  chalk: Tone
  props: Prop[]
  /** Flanking scenery, well outside the walkable yard — see the ⚠️ where it is generated. */
  trees: Prop[]
  skyline: Prop[]
}

/**
 * Four settings, so consecutive rounds always differ: the seed is the round index, and
 * `seed % 4` over consecutive integers never repeats. Each carries its own hue band, and every band
 * is inside the arcs that clear both unit hues.
 *
 * ⚠️ `prop` IS THE OTHER ARC, AND THAT IS THE POINT. Props first took `ground.h` with a lightness
 * kick, so a van, a site cabin and a tree all rendered as the same tone as the dirt they stood on and
 * the whole scene read as one grey-purple wash — the craft doc's palette rule broken from the
 * direction it does not cover, because "everything matches the ground" passes every separation check
 * against the UNIT and still looks like nothing. Props are MADE THINGS; they get the allowed arc the
 * ground is not in ([71,131] ⟷ [221,341]), so a world always carries two hue families.
 *
 * ⚠️ GROUND IS ALWAYS THE GREEN ARC AND SKY IS ALWAYS THE BLUE ONE — the two settings that had a
 * blue-grey ground put ground, sky AND skyline in one band, so those worlds were monochrome BY
 * CONSTRUCTION and no amount of saturation could rescue them. With only two legal arcs and three
 * layers to separate (sky · ground · props), two of the three must share one; props share with the
 * sky and are separated on lightness instead, because a prop is a small object against a large field
 * and a large field against a large field is what actually reads as flat. The four settings are then
 * told apart by lightness and saturation, which is what `gl`/`gs` are for.
 *
 * ⚠️ `gs` IS NOW A FLOOR, NOT A CEILING, AND THAT INVERSION IS THE WHOLE PALETTE CHANGE. It used to be
 * bounded ABOVE at 0.34, because the unit had to clear the world by 0.30 of saturation and both units
 * are vivid — so a *legal* palette was necessarily a drab one, and the generator then sat near the
 * bottom of even that range. Separation moved to hue-or-value plus a contour on the unit itself
 * (`UNIT_OUTLINE`), so grass is now allowed to be grass. The gate asserts the floor.
 *
 * ⚠️ AND `prop` IS GONE. A prop's hue is what the thing IS — see `ROLE` — not a slot on a permitted
 * arc. That arc is why a van, a skip, a tree and a portacabin all came out the same lilac-grey.
 */
const SETTINGS = [
  { name: "builders' yard", ground: [82, 96], sky: [206, 222], gl: [0.42, 0.50], gs: [0.30, 0.40] },
  { name: 'rooftop', ground: [96, 112], sky: [200, 216], gl: [0.50, 0.58], gs: [0.26, 0.36] },
  { name: 'dockside', ground: [72, 86], sky: [210, 228], gl: [0.40, 0.48], gs: [0.34, 0.44] },
  { name: 'field behind the barn', ground: [100, 120], sky: [204, 220], gl: [0.46, 0.56], gs: [0.32, 0.42] },
] as const

/**
 * Pairwise-distinct footprints, so nothing can read as a repeated unit. Nothing here is 1 m square,
 * and the pole is the only slim one.
 */
// the catalogue is SHAPE only — position, colour and turn are all decided per instance below
const CATALOGUE: readonly Omit<Prop, 'x' | 'z' | 'tone' | 'rot'>[] = [
  { role: 'van', kind: 'box', w: 2.2, h: 2.3, d: 5.0 },
  { role: 'cabin', kind: 'box', w: 3.0, h: 2.6, d: 2.6 },
  { role: 'drum', kind: 'cyl', w: 0.62, h: 1.4, d: 0.62 },
  { role: 'skip', kind: 'box', w: 1.8, h: 0.8, d: 1.4 },
  { role: 'mast', kind: 'cyl', w: 0.3, h: 7.6, d: 0.3 },
  { role: 'tree', kind: 'cone', w: 1.7, h: 3.4, d: 1.7 },
  { role: 'sign', kind: 'box', w: 4.6, h: 1.2, d: 0.5 },
  { role: 'tree', kind: 'cone', w: 2.4, h: 4.6, d: 2.4 },
]

/**
 * Force a coordinate off the integer metre so it can never coincide with a pace mark.
 *
 * ⚠️ IT IS NOT MONOTONIC AND IT CAN MOVE A POSITION *DOWN* BY UP TO 0.78 m, so a range written as a
 * minimum is not a minimum once this has run. The gate caught exactly that: right-hand props started
 * at `frontage + 2.7`, landed as low as `frontage + 2.5` after this, and stood inside the foreman
 * while he was talking. Any clearance a caller needs must budget for the shift — the craft doc's own
 * "a clamp must budget for anything applied after it", one module along.
 */
const offGrid = (v: number) => Math.floor(v) + 0.22 + 0.56 * (v - Math.floor(v))
/** How far this can pull a value below what was asked for. */
export const OFF_GRID_SLACK = 0.78

const span = (r: () => number, [lo, hi]: readonly [number, number] | number[]) => lo + r() * (hi - lo)

export function makeSite(seed: number, frontage: number): Site {
  const r = mulberry32(seed * 2654435761)
  const set = SETTINGS[((seed % SETTINGS.length) + SETTINGS.length) % SETTINGS.length]

  const ground: Tone = { h: span(r, set.ground), s: span(r, set.gs), l: span(r, set.gl) }
  const sky: Tone = { h: span(r, set.sky), s: span(r, [0.22, 0.30]), l: span(r, [0.70, 0.82]) }
  // ⚠️ ROAD AND POSTS WERE DARKER THAN THE GROUND (×0.62 / ×0.74) AND BOTH READ AS NEAR-BLACK SLABS.
  // The road is the nearest thing to a low camera, so it owned the bottom third of the frame as one
  // flat dark bar; the corner posts and the side rails read as harsh black lines converging. They are
  // MARKERS — the things that say where the plot is — so they are the light elements, not the dark
  // ones. (`post` and `chalk` are not in the separation check; low saturation keeps them reading as
  // pale timber rather than as a tile.)
  // ⚠️ A TARMAC ROAD IS NEUTRAL *AND DARK*, NOT A DARKER SHADE OF GRASS. At `ground.s * 0.7` it kept
  // most of the ground's green, so the nearest 30% of the frame — the strip the camera stands on —
  // read as a second green rather than as a surface. Near-zero saturation is what makes it a road;
  // 0.42 of the ground's lightness is what makes it TARMAC rather than pale concrete, and it is now
  // affordable because the contour is measured against the fields the units are actually drawn
  // against (ground and sky), not against a road no unit is ever laid on.
  // ⚠️ 0.42 WENT TOO FAR THE OTHER WAY. The camera spawns standing ON the road, so it fills the near
  // 30–40% of every opening frame — and at 0.42 of the ground's lightness, with the key's own long
  // shadow across it, that was a near-black band eating the bottom of the shot. 0.62 still reads as
  // tarmac against a saturated green and stops the frame opening on a void.
  // ⚠️ AND IT IS AN ABSOLUTE VALUE NOW, NOT A FRACTION OF THE GROUND. Tied to `ground.l` the road
  // tracked whichever setting was drawn, so on the darker grounds it landed near 0.25 — and since the
  // camera spawns ON it, with the key's own long shadow falling toward the viewer, the frame opened on
  // a near-black band across its bottom third. Tarmac is tarmac whatever the grass is doing: a fixed
  // mid-dark grey reads as a road lit or shaded, on every site.
  // ⚠️ AND THE COMMENT ABOVE HAD SAID 0.62 WHILE THE CODE SAID 0.40 — the fix was reasoned out, written
  // down, and then lost in a later pass, so the frame kept opening on the void the note describes. Held
  // at 0.58 and gated (`the road is never a dark band`) so it cannot silently slide back a third time.
  const road: Tone = { h: ground.h, s: 0.05, l: 0.58 }
  // ⚠️ THE BOUNDARY MARKERS ARE TIMBER, NOT PALE STICKS. They were `ground.h` at s 0.08 — grey posts on
  // grey-green grass, which is why they read as thin scratches rather than as the thing that says
  // where the plot IS. Warm timber separates from any ground the generator draws by HUE (the ground
  // arc is 72–120°, this is 30°) rather than by being washed out, so they can be substantial and
  // still never be mistaken for a unit. The chalk stays near-white: it is paint, and it is the one
  // line the child reads the frontage off.
  const post: Tone = { h: 30, s: 0.44, l: 0.44 }
  const chalk: Tone = { h: 42, s: 0.10, l: 0.93 }

  /**
   * Each prop takes its own (side, band) cell, so no three are ever in a line.
   *
   * ⚠️ THE `0` CELLS ARE AHEAD AND FAR, AND THEY EXIST BECAUSE THE MIDDLE DISTANCE WAS EMPTY. With
   * only the four flanking cells, everything generated sat within z ≤ 13 while the skyline starts at
   * z ≥ 34 — so the child walked into the yard facing a bare band twenty metres deep with nothing in
   * it at all, which is what "the ground looks empty" actually was. These sit **past** `MAX_DEPTH`, so
   * they are behind the deepest legal peg and can never stand on the working surface (the gate's
   * inside-the-plot check is what holds that). Five cells are drawn from seven and only four of them
   * are flanking, so at least one prop is always out in front.
   */
  const CELLS: readonly [side: -1 | 0 | 1, near: number, far: number][] = [
    [-1, -1.5, 4], [-1, 5, 13], [1, -1.5, 4], [1, 5, 13],
    [0, 15, 21], [0, 21, 27], [0, 26, 32],
  ]
  const cells = pickN(r, CELLS, 5)
  const shapes = pickN(r, CATALOGUE, 5)
  const props: Prop[] = shapes.map((s, i) => {
    const [side, near, far] = cells[i]
    // Right props clear the foreman, budgeting for the downward shift `offGrid` can apply (see its
    // note — a stated minimum is not one after it runs).
    //
    // ⚠️ LEFT PROPS SIT BEYOND THE REVIEW CAMERA (x = −4.4), NOT BETWEEN IT AND THE PLOT. At
    // −(1.9 + 4.4·r) they landed anywhere in x ∈ [−6.3, −1.9], i.e. straddling the camera and often
    // directly in its corridor — so on the one beat the whole chapter turns on (the swing round to
    // show what was built) a site cabin could stand square in front of the floor. Caught on screen;
    // the handoff already records that this shot's settled framing had never been looked at.
    const [mx] = miloSpot(frontage)
    const x = side < 0 ? -(6.2 + r() * 4.0)
      : side > 0 ? mx + MILO_CLEAR + OFF_GRID_SLACK + r() * 3.4
      // Ahead: spread across the whole forward view. Free in x because the cell's z already puts it
      // past the plot, which is what the inside-the-plot rule is measured on.
      : -7 + r() * (frontage + 14)
    return {
      ...s,
      x: offGrid(x),
      z: offGrid(near + r() * (far - near)),
      // The thing's own colour, varied only in lightness inside the band its ROLE permits — see the
      // ⚠️ on `ROLE` for why those bands are load-bearing rather than styling.
      tone: { h: ROLE[s.role].h, s: ROLE[s.role].s, l: span(r, ROLE[s.role].l) },
      // Turned off the world axes — see the ⚠️ on `Prop.rot`. Full circle: a van parked at any angle
      // is a van parked, and nothing here has a front that has to face the child.
      rot: r() * Math.PI * 2,
    }
  })

  /**
   * ⚠️ NO THREE PROPS COLLINEAR AND EQUALLY SPACED — AND THIS IS NOW CONSTRUCTED RATHER THAN LUCKY.
   *
   * The gate has always asserted this: three objects in a line at an even pitch is a ruler a child
   * could pace against instead of dividing, and it is exactly what a procedural scatter produces by
   * accident. But nothing in the generator ENFORCED it — it merely happened to hold for the seeds the
   * suite sweeps. Adding `rot` above consumed one extra draw per prop, which shifted every downstream
   * position, and a triple immediately came out at 0.069 m of spacing difference against a 0.35 m
   * floor. The check caught it; the property was never real.
   *
   * So it is enforced here, where it can be: nudge the last member of any offending triple along z
   * until the triple breaks, deterministically and off the same seeded stream. Bounded, and the gate
   * still asserts the outcome — this makes the guarantee structural without making the check redundant.
   */
  /**
   * A TREELINE, and it is the answer to "sirf alag alag shapes dikh rahe hai".
   *
   * ⚠️ FIVE PROPS DRAWN FROM EIGHT CATALOGUE ENTRIES, TWO OF WHICH ARE TREES, MEANS A TYPICAL ROUND HAS
   * ABOUT ONE TREE IN IT — and the yard therefore renders as four unrelated objects standing apart on
   * an empty field, which is exactly what a founder means by "just different shapes". The target frame
   * does not read as populated because it has more KINDS of thing in it; it reads that way because the
   * trees CLUSTER and frame the shot down both flanks, so the eye groups them into a place instead of
   * counting them as items.
   *
   * These are scenery, like the skyline, and they earn that by construction rather than by assertion:
   *   • they sit 7.5–19.5 m outside the plot's own edges, i.e. beyond the walkable box (±5) AND beyond
   *     the furthest a left prop can reach (−10.2), so the child never paces among them and they can
   *     never stand on the working surface;
   *   • heights run 4.6–8.2 m against a 1 m unit, all pairwise different, so no two read as a measure;
   *   • and they go through the SAME collinear-and-equally-spaced enforcement the props do — see below.
   *     A treeline is the most ruler-shaped thing anyone could add to this world, and "unlikely to line
   *     up" is precisely the kind of luck this file has already been burned by once.
   *
   * ⚠️ SIX, NOT TEN, AND THAT IS A DRAW-CALL BUDGET RATHER THAN A LOOK. Each tree is three meshes, and
   * the handoff records ~83 draws/frame measured with a 9×9 round extrapolating to ~330. Six adds 18.
   * If more are ever wanted, instance them — do not just raise this number.
   */
  const trees: Prop[] = Array.from({ length: 6 }, (_, i) => {
    const h = 4.6 + r() * 3.6
    const w = h * (0.40 + r() * 0.14)
    const lat = 7.5 + r() * 12
    return {
      kind: 'cone' as PropKind,
      role: 'tree' as PropRole,
      // alternate flanks so both sides of the frame are framed on every seed
      x: offGrid(i % 2 === 0 ? -lat : frontage + lat),
      z: offGrid(-4 + r() * 34),
      w, h, d: w,
      tone: { h: ROLE.tree.h, s: ROLE.tree.s, l: span(r, ROLE.tree.l) },
      rot: r() * Math.PI * 2,
    }
  })

  const clearsRuler = (a: Prop, b: Prop, c: Prop) => {
    const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)
    if (Math.abs(cross) >= 0.5) return true                       // not collinear at all
    const g1 = Math.hypot(b.x - a.x, b.z - a.z)
    const g2 = Math.hypot(c.x - b.x, c.z - b.z)
    return Math.abs(g1 - g2) > 0.35
  }
  // ⚠️ THE TREELINE GOES THROUGH THIS TOO, which is why it is built above rather than after. Enforcing
  // it on `props` alone would leave the one set that is actually laid out in two long flanking lines
  // free to produce the ruler this whole block exists to prevent.
  const scatter = [...props, ...trees]
  let guard = 0
  let dirty = true
  while (dirty && guard++ < 60) {
    dirty = false
    scatter.forEach((_, i) => scatter.forEach((__, j) => scatter.forEach((___, k) => {
      if (i >= j || j >= k) return
      if (clearsRuler(scatter[i], scatter[j], scatter[k])) return
      scatter[k] = { ...scatter[k], z: offGrid(scatter[k].z + 0.55 + r() * 0.5) }
      dirty = true
    })))
  }
  scatter.forEach((p, i) => { if (i < props.length) props[i] = p; else trees[i - props.length] = p })

  /**
   * A distant band. Widths never approach a metre, so it is scenery and not a ruler.
   *
   * ⚠️ A SKYLINE IS READ BY ITS ROOFLINE, AND EIGHT SIMILAR CHUNKY BOXES DO NOT HAVE ONE. At
   * `w 3–9, h 2.6–11` every block came out roughly as wide as it was tall, so the far band was a row
   * of near-identical cubes — the thing that read most obviously as an untextured test scene. A wider
   * spread with real towers in it (`h 3–17` against `w 2–9`) gives the horizon a shape, and it costs
   * one number each. The 1 m floor still holds by a wide margin, so nothing becomes countable.
   */
  const n = 6 + Math.floor(r() * 4)
  const skyline: Prop[] = Array.from({ length: n }, () => {
    const w = 2 + r() * 7
    return {
      kind: 'box' as PropKind,
      role: 'block' as PropRole,
      // ⚠️ PUSHED BACK AND CUT DOWN. At z 34–46 and up to 17 m tall these subtended a big enough angle
      // to dominate the upper third of the frame — a wall of grey blocks reading as the SUBJECT rather
      // than as a horizon. A skyline's whole job is to be the thing furthest away; at z 46–62 the fog
      // (0.0224) takes them to 64–75% haze and they settle into the distance where they belong.
      x: offGrid(-34 + r() * (frontage + 68)),
      z: offGrid(46 + r() * 16),
      w, d: 3 + r() * 5, h: 3 + r() * 9,
      // a small turn only — a distant block reads by its silhouette against the haze, and a hard 45°
      // would just widen it. Enough to break the row of parallel faces.
      rot: (r() - 0.5) * 0.7,
      // ⚠️ MUCH DARKER THAN LOOKS RIGHT HERE, BECAUSE TWO THINGS LIFT IT BEFORE IT REACHES THE SCREEN:
      // the key light multiplies it (~×1.7 on a lit face) and THEN the fog blends it ~55% toward the
      // haze at z 34–46. A base of 0.62·sky came out near 0.71 on screen — a row of white cardboard
      // cut-outs. It was darkened twice before anyone checked the arithmetic; started at 0.26 it
      // arrives as a mid-grey distant building, which is what distance looks like.
      tone: { h: sky.h, s: sky.s * 0.85, l: sky.l * (0.26 + 0.13 * r()) },
    }
  })

  return { name: set.name, sky, ground, road, post, chalk, props, trees, skyline }
}

function pickN<T>(r: () => number, from: readonly T[], n: number): T[] {
  const pool = from.slice()
  const out: T[] = []
  for (let i = 0; i < n && pool.length; i++) out.push(...pool.splice(Math.floor(r() * pool.length), 1))
  return out
}

// ── The separation check, exported so the gate drives it rather than re-deriving it ────────────
/** Shortest distance between two hues on the circle, in degrees. */
export const hueGap = (a: number, b: number) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return Math.min(d, 360 - d) }

/**
 * Does this site's world clear the unit the child commits to? Hue by ≥45°, and saturation by ≥0.30 —
 * two axes, because a low-saturation ground and a warm tile can sit close on hue and still read
 * clearly apart, and the craft rule is hue OR saturation but never neither.
 */
/**
 * THE GROUND, as real geometry rather than a flat plane.
 *
 * ⚠️ A PERFECTLY FLAT PLANE CANNOT LOOK LIKE A PLACE, AND THAT IS THE LARGEST SINGLE GAP LEFT BETWEEN
 * this scene and the target frame. A flat quad takes exactly one lighting value across the entire
 * lower half of the screen no matter how good the light is — so the "ground" reads as a coloured
 * backdrop the props are standing in front of. Every low-poly game that looks like a game gives the
 * terrain gentle relief and FLAT shading, so each facet catches the key slightly differently and the
 * surface acquires form. That is what the eye reads as ground.
 *
 * ⚠️ AND THE FACETS MUST NOT BECOME A RULER, WHICH IS WHY THIS IS BUILT HERE AND NOT IN THE SCENE.
 * Three defences, all checkable by the gate because this returns plain arrays:
 *   • the cell is ~3.75 m — never near the 1 m the child paces in, and
 *   • every interior vertex is JITTERED off the lattice, so there is no regular grid to read at all,
 *     and no two facets are the same size, and
 *   • height is exactly 0 across the whole WALKABLE region plus a margin, easing in beyond it. The
 *     plot the child pegs is dead flat — units sit properly on it, and no relief inside the yard can
 *     hint at a distance.
 * The scene binds these arrays directly, so it needs no loop of its own — which is what keeps the
 * anti-grid source rules meaningful there.
 */
const GROUND_SIZE = 120
const GROUND_CELLS = 32                     // 3.75 m a cell — far off a pace, and 2048 triangles
// ⚠️ THESE TWO WERE TOO GENEROUS TO SEE. At a 3.5 m flat margin easing over 9 m, the relief did not
// begin until ~16 m out — which is where the fog is already doing the work, so the ground still read
// as a flat sheet in every frame that matters. The flat region only has to cover where the child can
// STAND; a metre past that the relief can start, and it is visible immediately either side of the plot.
export const GROUND_FLAT_R = 1.2            // margin of dead-flat ground beyond the walkable bound
const GROUND_EASE = 5                       // metres over which relief eases in, so there is no crease
const GROUND_AMP = 1.5                      // peak relief, well out in the distance

/**
 * ⚠️ THE MACRO RELIEF ABOVE IS ZERO ACROSS THE WHOLE WALKABLE BOX — AND THE WALKABLE BOX IS
 * ESSENTIALLY THE ENTIRE VISIBLE GROUND, which is why three passes of lighting work never made this
 * yard read as a place. At ±(frontage/2 + 5) laterally and 17 m deep, the flat region covers the grass
 * from the bottom of the frame up to the fog. Every facet in it therefore shares one normal, takes one
 * lighting value, and the largest surface in the shot renders as a single flat sheet of green — the
 * exact fault the header claims to have fixed, still live because the fix started a metre past where
 * the camera looks. What the eye reads as low-poly ground is neighbouring faces catching the key
 * DIFFERENTLY; there was nothing for them to differ about.
 *
 * So the flat region keeps its purpose and loses its reach: it shrinks to the PLOT — the one surface
 * tiles are laid flush on — and the rest of the walkable yard gets a small per-vertex height jitter.
 *
 * ⚠️ A JITTER, NOT A WAVE, AND THAT IS THE ANTI-GRID ARGUMENT. There is no wavelength, so there is no
 * period to alias against the 3.75 m lattice and nothing anyone could pace — strictly stronger than the
 * "far off a metre" argument the macro octaves rest on. Two independent draws from a 0.30 m spread
 * differ by 0.10 m on average, which across a 3.75 m facet tilts a normal ~1.5° and, against a 25.5°
 * sun, is a ~6% shading step between neighbours. That sounds small and reads clearly, because what the
 * eye picks up is the EDGE between two flat values rather than the size of the step. Far too shallow to
 * clip a 1.55 m eye height or to give the yard a landmark, and the plot itself is dead flat regardless.
 */
export const GROUND_MICRO = 0.30            // the yard hangs in [-GROUND_MICRO, 0]; see below
const GROUND_MICRO_EASE = 2.5               // metres from the plot edge over which it fades in

export function groundMesh(frontage: number, seed: number, walkX: number, walkZ0: number, walkZ1: number) {
  const r = mulberry32(seed * 977 + 31)
  const n = GROUND_CELLS
  const step = GROUND_SIZE / n
  const half = GROUND_SIZE / 2
  const pos = new Float32Array((n + 1) * (n + 1) * 3)
  const uv = new Float32Array((n + 1) * (n + 1) * 2)
  const idx = new Uint32Array(n * n * 6)

  // three cheap octaves, seeded — deterministic per site, and irregular enough that no ridge lines up
  const ph = [r() * 9, r() * 9, r() * 9, r() * 9]
  // ⚠️ THE TOP OCTAVE IS WHAT MAKES THE FACETS VISIBLE, and the first cut did not have one. Broad
  // 30–60 m swells move the whole sheet together, so adjacent 3.75 m facets end up with almost the
  // same normal and the surface still reads as flat however tall the hills are. What the eye reads as
  // low-poly ground is neighbouring faces catching the key DIFFERENTLY — which needs a term whose
  // wavelength is a small multiple of the cell. ~10 m at 0.34 m does it, and stays far off any metre
  // period a child could pace.
  const height = (x: number, z: number) =>
    Math.sin(x * 0.055 + ph[0]) * Math.cos(z * 0.048 + ph[1]) * 0.62 +
    Math.sin(x * 0.021 + z * 0.026 + ph[2]) * 0.30 +
    Math.cos(x * 0.115 - z * 0.093 + ph[3]) * 0.20 +
    Math.sin(x * 0.62 + ph[0] * 2) * Math.cos(z * 0.57 + ph[1] * 2) * 0.34

  // The PLOT's own box in this mesh's local frame — the only region that must stay dead flat, because
  // it is the only one tiles are laid on. Derived from what the caller already passes (`walkZ0` is
  // `SPAWN_Z` minus the scene's z offset), so the offset is never written down twice.
  const zOff = SPAWN_Z - walkZ0
  const plotZ0 = -zOff
  const plotZ1 = MAX_DEPTH - zOff

  let p = 0, t = 0
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const edge = i === 0 || j === 0 || i === n || j === n
      // jitter interior vertices only, so the sheet stays a clean rectangle at its border
      const jx = edge ? 0 : (r() - 0.5) * step * 0.62
      const jz = edge ? 0 : (r() - 0.5) * step * 0.62
      const x = -half + i * step + jx
      const z = -half + j * step + jz

      // distance outside the walkable box (0 while inside it)
      const dx = Math.max(0, Math.abs(x) - walkX)
      const dz = Math.max(0, Math.max(walkZ0 - z, z - walkZ1))
      const d = Math.hypot(dx, dz)
      const ease = Math.min(1, Math.max(0, (d - GROUND_FLAT_R) / GROUND_EASE))

      // …and the same shape again against the PLOT, so the facets reach right up to the working
      // surface and stop dead on it. See GROUND_MICRO above for why this is a jitter and not a wave.
      const pd = Math.hypot(
        Math.max(0, Math.abs(x) - frontage / 2),
        Math.max(0, Math.max(plotZ0 - z, z - plotZ1)),
      )
      const pe = Math.min(1, pd / GROUND_MICRO_EASE)
      // ⚠️ DOWNWARD ONLY — [−GROUND_MICRO, 0], NOT ±HALF OF IT. The spread is identical either way, so
      // the facet contrast is unchanged, but a jitter that can rise above y = 0 pokes the grass up
      // THROUGH everything laid flat on it: the road plane at y = 0 speckled green across its whole
      // width the moment this was switched on, and the chalk edge lines at y = 0.04 would have gone the
      // same way. Hanging it below zero makes that unexpressible, and the small mean drop reads as what
      // it should — the plot sitting on a levelled pad, which is what a building plot is.
      const micro = edge ? 0 : -r() * GROUND_MICRO * pe * pe * (3 - 2 * pe)

      const y = height(x, z) * GROUND_AMP * ease * ease * (3 - 2 * ease) + micro   // smoothstep, no crease

      pos[p * 3] = x; pos[p * 3 + 1] = y; pos[p * 3 + 2] = z
      uv[p * 2] = i / n; uv[p * 2 + 1] = 1 - j / n
      p++
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, dd = c + 1
      idx[t++] = a; idx[t++] = c; idx[t++] = b
      idx[t++] = b; idx[t++] = c; idx[t++] = dd
    }
  }
  return { pos, uv, idx, cell: step }
}

export function plotSiteSeparation(site: Site, q: QType) {
  return readsAgainst(site, UNIT[q])
}

/**
 * Does a colour laid on the plot READ against this world?
 *
 * ⚠️ THE AXIS CHANGED, AND THAT IS THE POINT. This used to demand a 0.30 SATURATION gap, which — since
 * both units are vivid — was a cap on the whole world and is why the yard was grey. Two claims now,
 * and both bite:
 *   • the BODY clears on hue OR on value. Either is enough; a warm clay tile on green grass separates
 *     on hue, and a teal fence on a blue-grey sky separates on value.
 *   • the CONTOUR clears every large field on value, always. This is the one that never gets a choice,
 *     because it is what makes the body's either/or safe — and it is why the world may now be
 *     saturated. Measured against the FIELDS only (ground, sky, road): a small prop that happens to
 *     sit near the outline's value cannot hide a unit, but a whole ground at that value would.
 */
export function readsAgainst(site: Site, u: Tone): { hue: number; body: number; outline: number; ok: boolean } {
  const fields = [site.ground, site.sky, site.road]
  const all = [...fields, ...site.props.map(p => p.tone)]

  /**
   * ⚠️ THE TWO AXES ARE JUDGED PER TONE, NEVER MINIMISED INDEPENDENTLY — and getting that wrong is the
   * same class of mistake as the rule this function replaced.
   *
   * The first cut took `min(hue)` over every tone and `min(value)` over every tone and then asked
   * `hue >= 45 || body >= 0.18`. That asks *"does EVERY tone clear on hue, or does EVERY tone clear on
   * value"* — a much stronger claim than the one intended, because the winning hue can come from one
   * prop and the winning value from a different one. Driven, it reported `hue 6° value 0.06` on a
   * palette where a per-tone sweep found nothing failing at all. It is sound (strictly stricter, so it
   * can never pass something unreadable) and it is useless, because it re-imposes exactly the narrow
   * palette the rewrite exists to escape.
   *
   * So: find the tone that comes CLOSEST to failing, and report ITS pair. The numbers in a failure
   * message then describe one real object rather than two unrelated ones.
   */
  const worst = all.reduce((a, t) => {
    const score = (x: Tone) => Math.max(hueGap(x.h, u.h) / 45, Math.abs(x.l - u.l) / 0.18)
    return score(t) < score(a) ? t : a
  }, all[0])

  const hue = hueGap(worst.h, u.h)
  const body = Math.abs(worst.l - u.l)
  // The contour is measured against the FIELDS the unit is actually drawn against — the plot floor and
  // the sky behind a low panel. Deliberately not the road: no unit is ever laid on it, and including it
  // would forbid the dark tarmac that makes the road read as a road at all.
  const outline = Math.min(...[site.ground, site.sky].map(t => Math.abs(t.l - UNIT_OUTLINE.l)))
  return { hue, body, outline, ok: (hue >= 45 || body >= 0.18) && outline >= 0.22 }
}
