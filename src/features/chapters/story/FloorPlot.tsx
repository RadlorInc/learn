'use client'
/**
 * Chapter (9–11) — AREA & PERIMETER (skill `areaPerimeter`) as a FIRST-PERSON 3D plot.
 *
 * The 3D pilot for the band. Everything is code-drawn — no models, no textures, no image assets — so
 * it costs nothing against the asset budget and the palette stays under our control. The world itself
 * comes from `plotSite.ts`, seeded off the round index, so the ten rounds are ten places.
 *
 * ⓪ WHY 3D HERE. The old `GridPlotter` printed the whole question in words — *"The area is 24 and
 *    one side is 4"* — over three answer chips, so it failed delete-the-art (delete the grid and every
 *    question still works) AND handed a third of the answers to a guesser. A 3D room does not fix
 *    that by itself. What fixes it is that **the answer is a PLACE**, and a place cannot be offered as
 *    a chip. Any mechanic whose answer is a NUMBER is a number pad with a world painted behind it.
 *
 * ① THE VERB — **PEG IT OUT.** The plot does not exist until the child makes it.
 *    ⚠️ THREE MECHANICS WERE BUILT AND REJECTED BEFORE THIS ONE, and the reason is in `plotMaths.ts`
 *    in full, next to the code: a tile IS the unit of area, so any mechanic where the child handles
 *    tiles hands them a countable pile and something other than their head does the arithmetic.
 *    **Do not reintroduce a pile of units.**
 *
 *    So the foreman gives a number and the road frontage — *"24 tiles, 4 metres along the road"* —
 *    and the plot's near edge is already pegged. Everything else follows:
 *    • The yard behind it is EMPTY. Nothing to count, no pile to assemble, no running product on
 *      screen. The only readout is how far you have paced, which is your own measuring.
 *    • Walk back and DROP THE PEG where the far edge belongs. To stop in the right place you have to
 *      work out `24 ÷ 4` — nothing else on screen can tell you.
 *    • ⚠️ ONE PEG. A repeatable commit is an oracle: peg, read "too near", step back, peg again.
 *      Walking back and forth BEFORE the peg is free, which is where the deciding belongs.
 *    • The units are laid AFTER the peg, as the consequence — covered exactly, tiles left over, or a
 *      bare patch the fence could not reach. The equation appears only then. Never before.
 *
 * ② DIFFICULTY GROWS THE SKILL, not only the magnitude — the DIVISOR is an explicit tier term
 *    (`TIERS` in plotMaths). Area asks `target ÷ frontage`; perimeter asks the same gesture off
 *    different arithmetic (`target ÷ 2 − frontage`), so one control shape serves both readings and
 *    neither can be eliminated into. `coverage` forces both to be asked before the mastery exit.
 *
 * ③ COMFORT. No head-bob, no look acceleration, a modest FOV, and `prefers-reduced-motion` drops the
 *    movement smoothing so the camera steps rather than glides. 9-year-olds on a tablet get motion
 *    sick fast. Every control has a low-precision path: the peg button is a big fixed target, and
 *    walking works from a stick, from WASD, or from the ◀▶ step buttons.
 *
 * ponytail: units are plain meshes, not an InstancedMesh. MEASURED, not estimated — by counting
 * `drawElements` calls per rAF frame in the live scene: **66/frame** with the yard empty and
 * **80/frame** with 15 tiles laid, both INCLUDING the shadow pass (every caster is drawn twice). The
 * cap is 9×9 = 81 tiles, so the worst round lands near 230 draw calls with no postprocessing. That is
 * comfortable; instance them if a plot ever grows past 10 a side.
 * ⚠️ The old note here said "~140 draw calls with no shadows" and was stale twice over — shadows had
 * since been added and nobody had counted anything. If you change the prop silhouettes below, re-run
 * the count rather than re-guessing.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
// Deep import on purpose: drei ships `sideEffects: false` with no `exports` map, so a deep path is
// resolvable AND keeps the barrel (and everything it re-exports) out of an already-882 KB chunk.
import { SoftShadows } from '@react-three/drei/core/softShadows'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { useViewport } from '@/shared/hooks/useViewport'
import {
  makeRound, missFor, slotsFor, slotPos, equationFor, settleAfterPeg,
  explainBeats, miloSpot, MAX_DEPTH, SPAWN_Z, DEMO, GUIDED, type PlotRound,
} from './plotMaths'
import { makeSite, groundMesh, css, cssA, shade, UNIT, UNIT_OUTLINE, REVEAL, type Prop, type Site, type Tone } from './plotSite'

export type { PlotRound, QType } from './plotMaths'

// ─── UI chrome ──────────────────────────────────────────────────────────────────────────
const UI = {
  ink: '#f2ede4',
  inkMute: 'rgba(242,237,228,.62)',
  panel: 'rgba(24,30,26,.82)',
  line: 'rgba(242,237,228,.22)',
  warm: '#e8b06a',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  sans: 'var(--font-body), system-ui, sans-serif',
}
const OK = css(REVEAL)

// ─── Number labels — a canvas texture on a camera-facing sprite ──────────────────────────
// "All code" includes the numerals: they are drawn into a 2D canvas at runtime, so there is no font
// dependency in the scene graph and no image file anywhere.
const texCache = new Map<string, THREE.CanvasTexture>()
function numTex(text: string, color: string): THREE.CanvasTexture {
  const key = `${text}|${color}`
  const hit = texCache.get(key)
  if (hit) return hit
  const wide = text.length > 2   // a word needs a wider sheet than a numeral, or it renders squashed
  const c = document.createElement('canvas')
  c.width = wide ? 512 : 256; c.height = 128
  const g = c.getContext('2d')!
  g.font = `bold ${wide ? 64 : 92}px ui-monospace, Menlo, monospace`
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.lineWidth = 10; g.strokeStyle = 'rgba(20,24,20,.85)'
  g.strokeText(text, c.width / 2, 66)
  g.fillStyle = color
  g.fillText(text, c.width / 2, 66)
  const t = new THREE.CanvasTexture(c)
  // ⚠️ A CANVAS TEXTURE DEFAULTS TO NoColorSpace AND IS THEN TREATED AS LINEAR DATA. Every colour in
  // this file is authored as sRGB in a 2D canvas, so without this the renderer skips the sRGB→linear
  // decode and the texture arrives darker and flatter than the colour that was painted into it. It
  // is two lines and it was a live defect: every palette number in `plotSite.ts` was tuned by eye
  // against a wrongly-decoded ground, so the whole palette was being judged on a false baseline.
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  texCache.set(key, t)
  return t
}

function NumSprite({ text, color, position, scale = 1 }: { text: string; color: string; position: [number, number, number]; scale?: number }) {
  const tex = useMemo(() => numTex(text, color), [text, color])
  // Sprite scale is in WORLD units, so a numeral sized for a 9-metre plot swamps a 3-metre one.
  // Kept near a metre wide: legible from across the yard, never bigger than the side it labels.
  const aspect = text.length > 2 ? 2.1 : 1.05
  return (
    <sprite position={position} scale={[aspect * scale, 0.52 * scale, 1]}>
      {/* depthTest off so a length is never buried behind a unit the delivery just laid */}
      <spriteMaterial map={tex} transparent depthTest={false} depthWrite={false} />
    </sprite>
  )
}

// ─── The ground wash ────────────────────────────────────────────────────────────────────
/**
 * ⚠️ ONE STRETCHED TEXTURE, NEVER A TILED ONE — AND THAT CONSTRAINT IS WHY THIS IS SAFE.
 *
 * A flat 120 m plane in one solid colour is the thing that makes the yard read as a void, but the
 * obvious cure is the fault that got an earlier cut of this chapter rejected: `repeat.set(w, h)`
 * chalked the plot floor into exactly as many countable squares as the answer. So this texture is
 * laid **once** across the whole plane with the default ClampToEdge wrapping and no `repeat` at all —
 * 512 px over 120 m is ~0.23 m per texel, and the smallest wash here is ~35 m across. There is
 * nothing in it a child could count, and there is no scale at which it could become a ruler.
 *
 * The washes are placed by hand rather than generated, because the gate forbids any loop in this file
 * for exactly the reason above: a nested loop is how a grid arrives when a texture cannot.
 *
 * ponytail: cached per ground tone and never disposed, same as `numTex` above. A run visits ten
 * sites, so that is ten 512² textures for the life of the page. Dispose on unmount if a chapter ever
 * generates them per frame.
 */
const groundCache = new Map<string, THREE.CanvasTexture>()
function groundTex(t: Tone): THREE.CanvasTexture {
  const key = css(t)
  const hit = groundCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = 512; c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = css(t)
  g.fillRect(0, 0, 512, 512)
  // The far stop is the BASE tone at zero alpha, not `transparent` — a gradient to transparent-black
  // fringes grey on the way out, which on a large soft wash reads as dirt.
  const wash = (x: number, y: number, r: number, col: string) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, col)
    rg.addColorStop(1, cssA(t, 0))
    g.fillStyle = rg
    g.fillRect(0, 0, 512, 512)
  }
  // ⚠️ ±0.075 WAS TOO TIMID TO SEE. Stretched over 120 m a wash that subtle is arithmetically present
  // and visually absent, so the yard still read as one flat green field. Doubled, plus a warm
  // scuffed-earth pass at a *different hue* — a builders' yard is not a lawn, and one dry patch is
  // what stops the ground being a colour swatch. The hue shift is small and low-alpha, so the ground
  // stays inside the band `plotSiteSeparation` measures.
  const tint = [
    cssA(shade(t, 0.14), 0.92),                                                   // 0 · pale
    cssA(shade(t, -0.13), 0.9),                                                   // 1 · deep
    cssA({ h: t.h - 26, s: Math.min(0.34, t.s + 0.1), l: t.l + 0.1 }, 0.5),       // 2 · scuffed earth
  ]
  /**
   * ⚠️ SIX BIG WASHES LOOKED LIKE NONE, AND THE REASON IS THE CAMERA, NOT THE PAINTING. The texture
   * covers 120 m but the child stands at 1.55 m looking almost along the ground, so everything past
   * ~25 m is inside the fog: the band actually on screen is roughly a QUARTER of the sheet. Washes
   * 200 px across therefore filled that window edge to edge with one tone and the yard read as a flat
   * field however strong they were made. Smaller blobs mixed in mean any quarter of the sheet carries
   * variation — which is what "the ground still looks empty" was asking for.
   *
   * ⚠️ Placed from a fixed list rather than generated, and irregular on purpose. The gate forbids
   * `for (`/`Array.from({length` in this file precisely because a loop is how a grid arrives when a
   * texture cannot, and soft overlapping blobs at 10–50 m across have nothing anyone could count.
   */
  const SPOTS: readonly (readonly [number, number, number, number])[] = [
    [256, 272, 240, 0], [74, 128, 215, 1], [434, 352, 190, 1], [150, 428, 155, 0],
    [396, 92, 165, 0], [300, 470, 130, 1], [190, 210, 128, 2], [360, 400, 104, 2],
    [96, 320, 82, 0], [232, 96, 74, 1], [472, 208, 90, 0], [40, 462, 68, 2],
    [318, 214, 62, 0], [148, 42, 58, 1], [388, 486, 72, 1], [498, 424, 64, 2],
    [16, 46, 70, 0], [214, 350, 56, 1],
  ]
  SPOTS.forEach(([x, y, r, k]) => wash(x, y, r, tint[k]))
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace   // see numTex — the same live decode bug, on the biggest surface in the frame
  tex.anisotropy = 8                      // it is viewed at a grazing angle across 120 m; without this the wash smears
  tex.needsUpdate = true
  groundCache.set(key, tex)
  return tex
}

// ─── World props ────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ A NAKED PRIMITIVE READS AS A PLACEHOLDER, AND NO AMOUNT OF LIGHTING FIXES IT. Every prop used to
 * render as its single bounding solid, so the yard was grey slabs on the horizon, a box for a van and
 * a purple cone for a tree — which is what a founder means by "not a real game". The thing that reads
 * in a low-poly scene is the **SILHOUETTE**: a trunk under a canopy, wheels under a body, a pitched
 * roof, legs under a hoarding. Two or three parts is the whole difference, and it costs no assets.
 *
 * ⚠️ EVERY PART TAKES A SHADE OF THE PROP'S OWN TONE — never a colour of its own. `plotSiteSeparation`
 * is computed on `p.tone`, so a brown trunk or a green canopy invented down here would clear a check
 * that never saw it, which is the craft doc's "a gate that reads the DATA cannot see how the scene
 * draws it". Lightness is free; hue is not. The silhouette does the reading, not the palette.
 *
 * ⚠️ `flatShading` IS THE OTHER HALF AND IT IS FREE. A 10-segment cone smooth-shaded reads as a soft
 * grey blob; faceted, it reads as a deliberate low-poly tree. Boxes are unaffected.
 */
const WHEELS = [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const

const Mat = ({ t, dl = 0 }: { t: Tone; dl?: number }) => <meshLambertMaterial color={css(shade(t, dl))} flatShading />

function WorldProp({ p }: { p: Prop }) {
  const { w, h, d, x, z, tone: t } = p

  if (p.role === 'tree') {
    // trunk + two stacked canopies — the one shape that stops a cone being a cone
    /**
     * ⚠️ THE TRUNK WAS RENDERING AS A BLACK STICK. `dl −0.17` against a conifer green whose band starts
     * at l 0.28 lands on 0.11, and the near face of anything on the flanks takes only fill (~0.5×), so
     * it arrived at near-black — very visible now that there is a whole treeline of them rather than
     * one distant cone. It still takes a shade of the prop's own tone, per the sub-part rule; it just
     * takes one that is a colour. Shorter, too: a conifer's canopy sits low and the trunk is mostly
     * hidden by it, which is what the target frame shows and what stops it reading as a lollipop.
     */
    const trunk = h * 0.17
    return (
      <group position={[x, 0, z]} rotation={[0, p.rot, 0]}>
        <mesh castShadow receiveShadow position={[0, trunk / 2, 0]}>
          <cylinderGeometry args={[w * 0.062, w * 0.085, trunk, 6]} /><Mat t={t} dl={-0.05} />
        </mesh>
        <mesh castShadow position={[0, trunk + h * 0.30, 0]}>
          <coneGeometry args={[w / 2, h * 0.62, 8]} /><Mat t={t} dl={-0.06} />
        </mesh>
        <mesh castShadow position={[0, trunk + h * 0.58, 0]}>
          <coneGeometry args={[w * 0.34, h * 0.42, 8]} /><Mat t={t} dl={0.06} />
        </mesh>
      </group>
    )
  }

  if (p.role === 'van') {
    const r = w * 0.15
    return (
      <group position={[x, 0, z]} rotation={[0, p.rot, 0]}>
        <mesh castShadow receiveShadow position={[0, h * 0.60, -d * 0.11]}>
          <boxGeometry args={[w, h * 0.60, d * 0.76]} /><Mat t={t} />
        </mesh>
        {/* a lower cab in front is what tells a van from a crate at fifteen metres */}
        <mesh castShadow position={[0, h * 0.44, d * 0.36]}>
          <boxGeometry args={[w * 0.93, h * 0.40, d * 0.26]} /><Mat t={t} dl={0.09} />
        </mesh>
        {WHEELS.map(([ox, oz], i) => (
          <mesh castShadow key={i} position={[ox * w * 0.5, r, oz * d * 0.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[r, r, w * 0.1, 8]} /><Mat t={t} dl={-0.3} />
          </mesh>
        ))}
      </group>
    )
  }

  if (p.role === 'cabin') {
    return (
      <group position={[x, 0, z]} rotation={[0, p.rot, 0]}>
        <mesh castShadow receiveShadow position={[0, h * 0.42, 0]}>
          <boxGeometry args={[w, h * 0.84, d] } /><Mat t={t} />
        </mesh>
        {/* a pitched roof overhanging its walls — four segments, so it is a roof and not a spike */}
        <mesh castShadow position={[0, h * 0.98, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[w * 0.78, h * 0.30, 4]} /><Mat t={t} dl={-0.14} />
        </mesh>
        <mesh position={[0, h * 0.30, d / 2 + 0.01]}>
          <boxGeometry args={[w * 0.26, h * 0.5, 0.02]} /><Mat t={t} dl={-0.2} />
        </mesh>
      </group>
    )
  }

  if (p.role === 'mast') {
    return (
      <group position={[x, 0, z]} rotation={[0, p.rot, 0]}>
        <mesh castShadow position={[0, h / 2, 0]}>
          <cylinderGeometry args={[w / 2, w * 0.7, h, 6]} /><Mat t={t} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
          <boxGeometry args={[w * 3.2, 0.36, w * 3.2]} /><Mat t={t} dl={-0.14} />
        </mesh>
        <mesh castShadow position={[0, h * 0.86, 0]}>
          <boxGeometry args={[w * 6, w * 0.9, w * 0.9]} /><Mat t={t} dl={0.08} />
        </mesh>
      </group>
    )
  }

  if (p.role === 'sign') {
    // a hoarding standing on legs, not a slab lying in the grass
    const legY = h * 0.34
    return (
      <group position={[x, 0, z]} rotation={[0, p.rot, 0]}>
        <mesh castShadow receiveShadow position={[0, legY + h / 2, 0]}>
          <boxGeometry args={[w, h, d]} /><Mat t={t} dl={0.07} />
        </mesh>
        {[-1, 1].map(s => (
          <mesh castShadow key={s} position={[s * w * 0.36, legY / 2, 0]}>
            <boxGeometry args={[0.14, legY, 0.14]} /><Mat t={t} dl={-0.2} />
          </mesh>
        ))}
      </group>
    )
  }

  if (p.role === 'block') {
    /**
     * The distant band. A flat-topped grey box reads as an untextured cube; a darker parapet gives it
     * a roofline, which is all a building needs at fifty metres in fog.
     *
     * ⚠️ AND IT CARRIES A SMALL EMISSIVE FLOOR, WHICH IS THE DIFFERENCE BETWEEN "DISTANT" AND
     * "CARDBOARD". These sit at z 46–62 with the sun almost side-on, so the faces the child sees take
     * very little key and arrive as one flat mid-grey that the fog then lifts uniformly — the exact
     * look of a cut-out standing on the horizon. A faint self-lit term keeps some internal value
     * variation alive through the haze. It costs nothing: a uniform on a material that already exists.
     * ⚠️ `castShadow` comes OFF here — at z ≥ 46 they are far outside the ±22 shadow frustum, so the
     * scene was paying a shadow-pass draw for geometry that could never appear in it.
     */
    return (
      <group position={[x, 0, z]} rotation={[0, p.rot, 0]}>
        <mesh receiveShadow position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshLambertMaterial color={css(t)} emissive={css(shade(t, -0.3))} emissiveIntensity={0.36} flatShading />
        </mesh>
        <mesh position={[0, h + 0.22, 0]}>
          <boxGeometry args={[w * 1.06, 0.44, d * 1.06]} /><Mat t={t} dl={-0.13} />
        </mesh>
      </group>
    )
  }

  // a skip and a water butt genuinely ARE their primitive; they get a rim so the top edge catches
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        {p.kind === 'cyl'
          ? <cylinderGeometry args={[w / 2, w * 0.46, h, 10]} />
          : <boxGeometry args={[w, h, d]} />}
        <Mat t={t} />
      </mesh>
      <mesh castShadow position={[0, h + 0.04, 0]}>
        {p.kind === 'cyl'
          ? <cylinderGeometry args={[w * 0.54, w * 0.54, 0.1, 10]} />
          : <boxGeometry args={[w * 1.05, 0.1, d * 1.05]} />}
        <Mat t={t} dl={0.1} />
      </mesh>
    </group>
  )
}

// ─── Scene ──────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THE PLOT FLOOR IS BARE AND THE YARD BEHIND THE ROAD IS BARE, AND BOTH ARE LOAD-BEARING.
 * An earlier cut drew the plot floor with a metre grid repeated `w × h` — the answer chalked onto the
 * ground as countable squares, so a child stood in the plot, counted the boxes, and never paced a
 * side; on a fence round it handed over both side lengths at a glance. **Nothing in front of the peg
 * may be countable**: no grid, no markers, no laid units, no running product. What says "the plot is
 * THIS big" is the chalk line and the corner posts, which mark the boundary without subdividing it.
 * `plotSite.ts` keeps its own end of this — read its header before adding anything to the world.
 */
function PlotScene({ d, site, laid, depth, pegged, revealed }: {
  d: PlotRound
  site: Site
  laid: Set<string>
  depth: number                 // how far back the child has paced, live — their own measuring
  pegged: number | null         // where the peg went; null until they commit
  revealed: boolean
}) {
  // The walkable box the rig clamps to, handed straight to the generator so the flat region and the
  // bound cannot drift apart — the ground must be level everywhere the child can actually stand.
  const gm = useMemo(
    () => groundMesh(d.frontage, d.seed, d.frontage / 2 + 5, SPAWN_Z - 4, MAX_DEPTH + 1 - 4),
    [d.frontage, d.seed],
  )
  const unitColor = css(UNIT[d.qType])
  const railZ = pegged ?? depth               // the tape reaches wherever they are, or the peg
  const closed = pegged !== null
  const ground = css(site.ground)
  const post = css(site.post)
  const chalk = css(site.chalk)

  return (
    <>
      {/* ⚠️ Light intensities are physical units in three r155+, so the values that used to read as
          "bright" now render a dusk scene. A hemisphere light does the outdoor work in one object:
          sky from above, bounced ground from below.

          ⚠️ AND ITS SKY TERM IS NEARLY WHITE ON PURPOSE — A TINTED LIGHT OVERRIDES THE PALETTE THE
          GENERATOR WORKED OUT. Passing the full sky colour lit every surface in the scene with it, so
          a blue-grey rooftop rendered as a flat purple void and the low saturation `plotSite` is
          careful to generate was undone at the point of drawing. The separation is computed on
          MATERIAL colours; the screen shows material × light, so the light has to stay neutral or the
          check upstream means nothing. */}
      {/* ⚠️ AND THE FILL WAS DROWNING THE SUN. At hemi 1.5 + ambient 0.4 against a directional 1.5,
          every face of every box arrived at nearly the same brightness — so a cube read as a flat
          rectangle and the whole yard looked like untextured primitives. The lit face and the away
          face have to differ, which means the directional has to WIN: the fill is a floor that keeps
          shadowed sides readable, not a second sun. */}
      {/**
        * ⚠️ THE SUN WAS AT 57° — MIDDAY — AND POINTING AWAY FROM THE PLAYER, AND THAT IS THE
        * ARITHMETIC REASON THIS SCENE READ AS "SHAPES". Work it through on the old rig: the key sat at
        * [16,30,11], i.e. L = [0.448, 0.840, 0.308], 57.1° elevation. The child spawns at yaw π
        * looking down +Z, so every prop face they can see is the −Z face, where N·L = −0.308 — no key
        * at all. Add up what was left and the face TOWARD the player and the LEFT face both landed on
        * exactly 0.580 (hemi 0.42 + ambient 0.16 and nothing else), while the roof landed on 1.546.
        * **Two of the three faces a child sees on every box in the yard rendered at literally the same
        * value, and the brightest thing in the frame was a roof they were looking down on.** No
        * palette, silhouette or texture change can survive that; a cube lit like that IS a rectangle.
        *
        * So the fix is direction, not brightness. A low key at ~25° and 62° off the forward axis, and
        * the flat fill replaced by two SHADOWLESS directionals that fill with direction instead of
        * with a wash. Resulting face multipliers: sun-side wall 1.399 · far wall 0.931 · roof 0.925 ·
        * face-toward-player 0.505 · shaded wall 0.304 — five distinct values at 4.6:1, where before
        * there were two identical ones. Non-directional fill drops from 37.5% of peak to 10.0%, and
        * shadowed ground sits at 0.268 against 0.925 lit, so a shadow reads without going black.
        *
        * ⚠️ DO NOT RAISE THE KEY PAST ~1.70. Under `flat` (NoToneMapping, below) the intensities are a
        * hard ceiling, and Milo's lime vest #b9d94a has a green channel of 0.694 — at 1.399 that is
        * 0.971, just under clipping. The tone-mapping line below is what buys back the headroom.
        */}
      {/* ⚠️ AND THE KEY GOES UP, NOT DOWN, ONCE TONE MAPPING IS BACK. Dropping the sun to 25° also drops
          what the GROUND receives — a horizontal plane takes `sin(25.5°)` = 0.43 of the key against
          0.84 at the old midday angle — so the first drive of this rig came out at dusk. The 1.70
          ceiling belonged to `flat`/NoToneMapping, where intensities clip hard; Neutral rolls the top
          end off instead, so 2.15 is affordable and the lime vest still resolves. This is the number
          to move if the yard ever reads too dark or too bright — not the fills, which are carrying
          the FORM and would flatten it again. */}
      <hemisphereLight args={[css({ ...site.sky, s: site.sky.s * 0.3, l: 0.92 }), ground, 0.20]} />
      <directionalLight position={[-9, 7, -20]} intensity={0.42} color="#b9cdf0" />
      <directionalLight position={[6, -5, 14]} intensity={0.18} color="#f4dcb4" />
      {/* ⚠️ THE SHADOW IS THE CONTACT CUE, AND WITHOUT IT NOTHING IN A 3D SCENE TOUCHES THE GROUND —
          the craft doc's oldest blend rule, which this chapter never applied because in 3D the
          geometry IS grounded and it is easy to believe that settles it. It does not: with no shadow
          a van, a mast and the foreman all read as cut-outs standing on a plane. The camera never
          leaves the yard, so ±30 about the origin covers every plot the generator can draw at any
          frontage; the bias is what stops acne on the big ground plane at this texel size. */}
      {/* ⚠️ THE SUN IS WARM AND IT IS HIGH, and both were wrong before. A pure-white key over a
          low-saturation world renders every surface as its own grey; a warm one (#fff1d6) puts the
          scene at a time of day, and the cool ambient above then does the rest for free. And at
          y = 20 over a 14 m offset the shadows raked out as long black smears across the whole yard —
          the first thing that reads as "engine test scene". Raised to 30, they are short and sit
          under the thing that casts them, which is what a contact shadow is for.
          ⚠️ The frustum is tightened 30 → 24 with the mapSize unchanged, so the same 1024 map covers
          less ground: 4.7 cm per texel instead of 5.9, i.e. a sharper contact edge for nothing. It
          still covers the whole walkable yard and every near prop; the skyline sits well outside it
          and casts nothing, which at forty metres in fog is invisible and is a saving, not a loss. */}
      {/**
        * ⚠️ THE SOFT SHADOW SHIPS IN THE SAME CHANGE AS THE SUN ANGLE, NEVER AFTER IT. Dropping the key
        * from 57° to 25.5° takes the shadow-length multiplier from 0.65 to 2.10 — a 2.6 m site cabin
        * casts 5.5 m instead of 1.7 m, a 4.6 m tree casts 9.6 m instead of 3.0 m. A 5.5 m HARD-edged
        * shadow is exactly the "long black smears" this file already records, which is why an earlier
        * pass raised the sun to get rid of them — i.e. removed the light to hide the shadow, and paid
        * for it with all the form. PCSS is the actual fix: contact-hardened at the base, penumbra
        * widening with blocker distance, which is what sunlight does.
        *
        * The rest is refitting for the lower angle: 2048² over a ±22 frustum is 2.15 cm/texel instead
        * of 4.69, and near 6 / far 58 cuts the depth range 79 → 52 for a third more bias headroom.
        * ⚠️ `normalBias` is DERIVED, not picked: at 25.5° the depth error across one texel is
        * texel / tan(25.5°) = 2.15 cm × 2.10 = 4.5 cm, so the offset has to exceed it. 0.04 does.
        */}
      {/* ⚠️ `size 16 / samples 8` DITHERED VISIBLY ALONG EVERY PENUMBRA. PCSS widens the blur with blocker
          distance, and the road is a big flat surface at a 64° grazing angle to a 25.5° sun — so the
          fence rail's penumbra there is very wide, and eight taps across it read as speckled black
          noise rather than as a soft edge. It looks like a rendering fault, not like sunlight. A
          narrower light with more taps across it is the same softness sampled properly; the cost is
          fragment work on shadow receivers only, which this scene has few of. */}
      <SoftShadows size={9} samples={17} focus={0} />
      <directionalLight
        position={[24, 13, 13]}
        intensity={2.15}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        /**
         * ⚠️ THE DERIVED 0.04 WAS NOT ENOUGH ONCE IT WAS ON SCREEN, and the reason is the receiver, not
         * the light. The derivation `texel / tan(25.5°)` = 4.5 cm assumes a surface roughly facing the
         * sun. The two biggest receivers here are the 120 m ground plane and the road lying 1 cm above
         * it — both horizontal, so at a 25.5° sun they sit at a 64° grazing angle to it, where the
         * depth error across one texel is `texel / tan(25.5°)` measured along a much longer run. Driven,
         * that speckled the whole near band with acne. 0.09 clears it; the ground is a big flat plane
         * with nothing thin standing on it, so the peter-panning that normally bounds normalBias has
         * nothing to detach here.
         */
        shadow-bias={-0.0004}
        shadow-normalBias={0.09}
        shadow-camera-left={-22} shadow-camera-right={22}
        shadow-camera-top={22} shadow-camera-bottom={-22}
        shadow-camera-near={6} shadow-camera-far={58}
      />

      {/**
        * The yard. Still no markings of any kind in front of the peg — but no longer a flat quad.
        *
        * ⚠️ A FLAT PLANE TAKES ONE LIGHTING VALUE ACROSS THE WHOLE LOWER HALF OF THE FRAME, so however
        * good the key is, the ground reads as a coloured backdrop that the props stand in front of
        * rather than as ground. Gentle relief plus `flatShading` gives every facet its own value and
        * the surface acquires form — which is the difference the target frame shows most plainly.
        * The geometry comes from `groundMesh` in the pure module: dead flat across the whole walkable
        * region (so the plot the child pegs is level and the fixed eye height never clips a slope),
        * easing into relief only well beyond it, on a ~3.75 m irregular jittered lattice that has no
        * metre-scale period anywhere in it. Bound as raw arrays so this file still needs no loop.
        */}
      <mesh receiveShadow position={[d.frontage / 2, -0.01, 4]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gm.pos, 3]} />
          <bufferAttribute attach="attributes-uv" args={[gm.uv, 2]} />
          <bufferAttribute attach="index" args={[gm.idx, 1]} />
        </bufferGeometry>
        {/* the wash carries the ground colour, so no `color` here or it multiplies in twice */}
        <meshLambertMaterial map={groundTex(site.ground)} flatShading />
      </mesh>

      {site.skyline.map((p, i) => <WorldProp key={`sk${i}`} p={p} />)}
      {/* the flanking treeline — scenery, well outside the walkable yard; see plotSite's ⚠️ on `trees` */}
      {site.trees.map((p, i) => <WorldProp key={`tr${i}`} p={p} />)}
      {site.props.map((p, i) => <WorldProp key={`pr${i}`} p={p} />)}

      {/* THE ROAD, and the frontage the foreman already pegged. This is the GIVEN, so its numeral may
          be shown — it is half the question, not half the answer. */}
      {/* ⚠️ THE ROAD ENDS EXACTLY ON THE CHALK LINE (z = 0), NOT 0.2 m SHORT OF IT. At −2.2 it left a
          sliver of yard between the kerb and the frontage line, so the bottom of the frame read as two
          parallel edges 15 px apart — a messy double line rather than a kerb. Sharing the line makes
          the chalk the kerb, which is also what it is. */}
      {/**
        * ⚠️ THIS ONE SURFACE IS A QUARTER OF EVERY FRAME, AND IT WAS THE DARKEST THING IN THE SCENE.
        * The child spawns at `SPAWN_Z` = −3.4, i.e. standing ON the road 3.4 m back from the frontage,
        * so the road necessarily fills the bottom of the shot — measured, 24% of the pixels. At
        * `l 0.40` under a 25.5° sun that renders near-black, and a black band across the bottom quarter
        * is most of what "sirf alag alag shapes, koi smoothness nahi" is describing: the eye reads it
        * as a hole in the world rather than as tarmac, and every prop above it reads as floating on a
        * void. The target frame's road is a mid grey the fence posts cast a clear shadow onto.
        *
        * ⚠️ AND 80 m WIDE PUT IT FAR OUTSIDE THE ±22 SHADOW FRUSTUM. `SoftShadows` swaps three's own
        * `getShadow` for a PCSS shader, and the out-of-frustum guard does not survive the swap — so the
        * far reaches of the road sampled the clamped edge texel and came back shadowed, drawing a hard
        * dark wedge with no caster anywhere near it. Verified by removing `receiveShadow`: the wedge
        * vanished and the band went uniform. 44 m still runs well off both frame edges (the visible
        * road spans a few metres at the frontage) and sits inside the map, so the real post shadows —
        * which are a genuine contact cue and are in the target frame — come back without the artefact.
        */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[d.frontage / 2, 0, -2]}>
        <planeGeometry args={[44, 4]} />
        <meshLambertMaterial color={css(site.road)} />
      </mesh>
      {/* the frontage line is the one measurement the foreman GAVE, so it is the boldest paint here */}
      <mesh position={[d.frontage / 2, 0.03, 0]}>
        <boxGeometry args={[d.frontage, 0.06, 0.2]} />
        <meshLambertMaterial color={chalk} />
      </mesh>
      {/**
        * ⚠️ THE CORNER POSTS ARE THE ONLY NEAR-FIELD OBJECTS IN THE WHOLE SCENE, AND THEY WERE 18 cm
        * STICKS. Every frame was sky, a distant prop band, a big empty midground and a road — no
        * foreground layer at all, which is why it read as a backdrop rather than as somewhere you are
        * standing. Depth in a first-person shot comes from having something CLOSE that the far stuff
        * moves against; the target frame gets it entirely from chunky timber posts and a rail at the
        * near corners. Doubled in section, given a chamfered cap, and each grows a rail running OUT
        * of frame to the side — away from the plot, so it frames the shot without ever bounding the
        * thing being measured, and it stops at the frontage so it can never suggest a depth.
        */}
      {/**
        * ⚠️ AND IT ALL HAS TO STAY LOW, WHICH THE FIRST CUT DID NOT. At a 1.2 m post with its rail at
        * 0.82 m, against a 1.55 m eye height only 3.4 m away, the rail crossed the frame at eye level
        * and ran straight in front of the foreman — and the craft doc's rule is that the speaker is on
        * screen whenever their bubble is. Foreground framing belongs in the BOTTOM of the frame: a
        * 0.9 m post with its rail at 0.52 m reads as something you are standing behind, and leaves the
        * yard, the foreman and the whole question region clear above it.
        */}
      {[0, d.frontage].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[0.3, 0.9, 0.3]} />
            <meshLambertMaterial color={post} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.95, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.25, 0.14, 4]} />
            <meshLambertMaterial color={css(shade(site.post, 0.1))} flatShading />
          </mesh>
          {/* the rail runs AWAY from the plot and out of frame — a foreground edge, never a boundary */}
          <mesh castShadow position={[(i === 0 ? -1 : 1) * 2.1, 0.52, 0]}>
            <boxGeometry args={[4.2, 0.17, 0.12]} />
            <meshLambertMaterial color={css(shade(site.post, -0.07))} flatShading />
          </mesh>
          <mesh castShadow receiveShadow position={[(i === 0 ? -1 : 1) * 4.1, 0.38, 0]}>
            <boxGeometry args={[0.26, 0.76, 0.26]} />
            <meshLambertMaterial color={post} flatShading />
          </mesh>
        </group>
      ))}
      <NumSprite text={String(d.frontage)} color={UI.inkMute} position={[d.frontage / 2, 0.9, 0]} scale={0.85} />

      {/* THE TAPE — two rails unrolling behind the child as they walk. This is the ONLY readout in the
          yard, it is their own pacing, and it never shows a product. */}
      {/* ⚠️ THE SIDE LINES RUN THE WHOLE WALKABLE DEPTH, AND THAT REVEALS NOTHING.
          They stop at `MAX_DEPTH` on every round regardless of the answer, so they say only how WIDE the
          plot is — which the foreman already stated — and never how deep. Without them the forward view
          is a bare field with no reference at all (the frontage, the posts and the foreman are all
          behind a child who has walked in), which reads as a broken scene rather than as an empty yard.
          ⚠️ It must stay ONE UNBROKEN LINE. Posts, ticks or segments at intervals would be a ruler, i.e.
          the printed answer drawn on the ground — the fault that got an earlier cut rejected. */}
      {/* ⚠️ THE SIDE LINES ARE PAINTED CHALK, NOT TIMBER. They took the post tone, so once the posts
          became warm timber the plot's own edges became two brown rails converging into the yard —
          which reads as fencing rather than as a marked-out plot, and fencing is the answer on a
          perimeter round. They are the same paint as the frontage line, which is what they are. */}
      {[0, d.frontage].map(x => (
        <mesh key={`edge${x}`} position={[x, 0.04, MAX_DEPTH / 2]}>
          <boxGeometry args={[0.09, 0.06, MAX_DEPTH]} />
          <meshLambertMaterial color={chalk} />
        </mesh>
      ))}

      {/* ⚠️ Tall enough to SEE from eye level, and CONTINUOUS. At 4 cm they were flat on the ground and
          invisible from inside the plot. This is the part the child has actually PACED, drawn over the
          faint edge above in a stronger tone — their own measuring, and it stops where they stand. */}
      {railZ > 0 && [0, d.frontage].map(x => (
        <mesh castShadow key={`rail${x}`} position={[x, 0.11, railZ / 2]}>
          <boxGeometry args={[0.1, 0.22, railZ]} />
          <meshLambertMaterial color={closed ? chalk : post} />
        </mesh>
      ))}
      {railZ > 0 && (
        <NumSprite text={String(railZ)} color={closed ? UI.warm : UI.ink}
          position={[d.frontage + 0.7, 0.85, railZ / 2]} scale={closed ? 1.15 : 1} />
      )}

      {/* THE PEG — the far edge, once committed. Nothing draws it before that. */}
      {closed && (
        <>
          <mesh position={[d.frontage / 2, 0.02, railZ]}>
            <boxGeometry args={[d.frontage, 0.05, 0.12]} />
            <meshLambertMaterial color={chalk} />
          </mesh>
          {[0, d.frontage].map(x => (
            <mesh castShadow key={`pg${x}`} position={[x, 0.45, railZ]}>
              <boxGeometry args={[0.16, 0.9, 0.16]} />
              <meshLambertMaterial color={revealed ? OK : post} />
            </mesh>
          ))}
        </>
      )}

      {/**
        * What the delivery actually laid, once the plot is pegged.
        *
        * ⚠️ EACH UNIT CARRIES ITS OWN DARK CONTOUR, AND THAT IS WHAT LETS THE WORLD BE COLOURFUL. The
        * palette rule used to buy separation with saturation — the unit is vivid, so the world had to
        * be drab — and that one number is why two passes came back grey. A rim of `UNIT_OUTLINE` reads
        * against anything of a different value, so the body only has to clear on hue OR value and the
        * ground is free to be a real green. `plotSiteSeparation` measures exactly this pair, and the
        * gate asserts the rim is rendered here rather than merely declared in `plotSite.ts` — a
        * contour that exists only in a constant separates nothing.
        *
        * Drawn as a slightly larger back-faced shell rather than as an edge overlay: one extra mesh,
        * no line materials (which ignore width on WebGL anyway), and it silhouettes correctly from
        * every angle including the raised review shot.
        */}
      {[...laid].map(k => {
        const [x, y, z] = slotPos(d, k)
        const isArea = d.qType === 'area'
        const side = k.split(':')[1]
        const dims: [number, number, number] = isArea
          ? [0.94, 0.1, 0.94]
          : side === 't' || side === 'b' ? [0.96, 0.55, 0.12] : [0.12, 0.55, 0.96]
        const R = 0.035   // contour thickness in metres — a rim, never a second panel
        return (
          <group key={k} position={[x, y, z]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={dims} />
              <meshLambertMaterial color={revealed ? OK : unitColor} />
            </mesh>
            <mesh>
              <boxGeometry args={[dims[0] + R, dims[1] + R * 0.6, dims[2] + R]} />
              <meshBasicMaterial color={css(UNIT_OUTLINE)} side={THREE.BackSide} />
            </mesh>
          </group>
        )
      })}

      {/* Milo the foreman, standing off the far corner of the plot. Placed by ANGLE from the spawn
          stance, not by eye — and the angle has to be checked against the HORIZONTAL half-FOV, which
          is not the number in the camera prop: `fov` is VERTICAL, so at 16:9 the horizontal half-FOV
          is ~47°, not ~31°.
            • at [frontage + 1.8, −1.1] he sat ~59° off-axis — entirely off screen while his own bubble
              was up (craft doc: the speaker must be on screen whenever their bubble is).
            • at [frontage + 1.3, 0.4] he was visible at ~41° but 5 m away and hard against the frame
              edge, reading as a big orange blob rather than a person.
          At [frontage + 1.3, 2.2] he is ~30° off-axis and ~6.6 m out: comfortably inside the frame,
          beside the plot he is talking about, and small enough to read as a foreman. */}
      <group position={[miloSpot(d.frontage)[0], 0, miloSpot(d.frontage)[1]]}>
        {/* ⚠️ HE STILL HAD NO LEGS, AND THAT IS WHY HE READ AS A SNOWMAN DESPITE THE VEST AND THE HAT.
            One tapered cylinder running from the ground to the shoulders is a skittle whatever you
            paint on it — the craft doc's own rule is that the SILHOUETTE does the reading, and the
            outline here was a single unbroken cone. Two legs and a separate torso break it into a
            figure, and it is the last obviously-crude object in a frame he stands dead centre of.
            ⚠️ They take a darker SHADE of his own body colour, never a new one: his orange already sits
            beside the clay unit's hue and the vest is what buys the separation back, so introducing a
            third tone here would be re-opening a palette argument that is already settled. */}
        {[-1, 1].map(s => (
          <mesh castShadow key={`leg${s}`} position={[s * 0.14, 0.25, 0]}>
            <cylinderGeometry args={[0.105, 0.12, 0.5, 8]} /><meshLambertMaterial color="#a85a33" />
          </mesh>
        ))}
        <mesh castShadow position={[0, 0.81, 0]}><cylinderGeometry args={[0.3, 0.36, 0.62, 10]} /><meshLambertMaterial color="#c96f3f" /></mesh>
        {/* ⚠️ A HI-VIS VEST AND TWO ARMS ARE WHAT STOP HIM BEING A BOWLING PIN. Body + head + ears is
            four primitives that read as a skittle, and he is the only character on screen in every
            beat. The vest also does palette work: Milo is #c96f3f (hue ≈22°), which sits right on the
            area unit's clay (26°) — so on a floor round the foreman and the tiles were the same
            colour family. Lime (≈75°) is inside the allowed arc and separates him from both units. */}
        <mesh castShadow position={[0, 0.84, 0]}><cylinderGeometry args={[0.33, 0.38, 0.46, 10]} /><meshLambertMaterial color="#b9d94a" /></mesh>
        {[-1, 1].map(s => (
          <mesh castShadow key={s} position={[s * 0.35, 0.88, 0]} rotation={[0, 0, s * -0.34]}>
            <cylinderGeometry args={[0.085, 0.085, 0.6, 8]} /><meshLambertMaterial color="#c96f3f" />
          </mesh>
        ))}
        <mesh castShadow position={[0, 1.35, 0]}><sphereGeometry args={[0.32, 12, 10]} /><meshLambertMaterial color="#e08a52" /></mesh>
        <mesh castShadow position={[-0.18, 1.62, 0]}><coneGeometry args={[0.11, 0.26, 8]} /><meshLambertMaterial color="#e08a52" /></mesh>
        <mesh castShadow position={[0.18, 1.62, 0]}><coneGeometry args={[0.11, 0.26, 8]} /><meshLambertMaterial color="#e08a52" /></mesh>
        {/* A HARD HAT. He is a foreman on a building site and he was not wearing one — the vest said
            so and nothing else did. It is also the strongest silhouette cue on the only character on
            screen: a brim breaks the round-head-round-body outline that reads as a skittle. Same lime
            as the vest, which already clears both unit hues. */}
        <mesh castShadow position={[0, 1.6, 0]}><sphereGeometry args={[0.29, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshLambertMaterial color="#b9d94a" /></mesh>
        <mesh castShadow position={[0, 1.585, 0.03]}><cylinderGeometry args={[0.34, 0.34, 0.045, 12]} /><meshLambertMaterial color="#b9d94a" /></mesh>
      </group>
    </>
  )
}

// ─── Player rig — free-look, no head-bob, no acceleration ────────────────────────────────
export interface InputState {
  move: { x: number; y: number }
  look: { dx: number; dy: number }
  /** A whole-metre nudge from the ◀▶ buttons — the low-precision path to the same walk. */
  step: number
}
const EYE = 1.55
const SPEED = 3.6            // m/s — a brisk walk; the yard is metres, so this is honest
const LOOK = 0.0032

function Rig({ d, input, onDepth, demoCam, reduced, forceDepth }: {
  d: PlotRound
  input: React.RefObject<InputState>
  onDepth: (m: number) => void
  demoCam: [number, number, number, number, number] | null   // x,y,z,yaw,pitch — demo drives the camera
  reduced: boolean
  forceDepth: React.RefObject<number | null>
}) {
  const { camera } = useThree()
  const pos = useRef(new THREE.Vector3(d.frontage / 2, EYE, SPAWN_Z))
  // yaw 0 looks down −Z, so yaw π looks down +Z — away from the road, into the empty yard.
  // (Forward is (−sin yaw, 0, −cos yaw) — the movement maths below reads the same convention.)
  const rot = useRef({ yaw: Math.PI, pitch: -0.13 })
  const depth = useRef(0)

  /**
   * A fresh round resets the stance, or the child starts round 2 facing the wrong way.
   *
   * ⚠️ AND SO DOES RELEASING THE REVIEW CAMERA. On a guided retry the peg is pulled back out and control
   * returns to the child — but the review shot has meanwhile lerped the camera to x = −4.4, off the side
   * of the plot. Without this they would resume standing outside the yard looking sideways at it. Back
   * to the road, which is also the honest place to retry from: they pace it again.
   */
  useEffect(() => {
    pos.current.set(d.frontage / 2, EYE, SPAWN_Z)
    rot.current = { yaw: Math.PI, pitch: -0.13 }
    depth.current = 0
    onDepth(0)
  }, [d.frontage, d.depth, d.qType, demoCam === null, onDepth])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const cam = camera as THREE.PerspectiveCamera
    cam.rotation.order = 'YXZ'

    if (demoCam) {
      // The demo drives the camera. Reduced motion snaps; otherwise it eases.
      const [tx, ty, tz, tyaw, tpitch] = demoCam
      const k = reduced ? 1 : Math.min(1, dt * 2.4)
      pos.current.lerp(new THREE.Vector3(tx, ty, tz), k)
      rot.current.yaw += (tyaw - rot.current.yaw) * k
      rot.current.pitch += (tpitch - rot.current.pitch) * k
    } else {
      const inp = input.current
      // Look first, so movement is relative to where you are already facing.
      rot.current.yaw -= inp.look.dx * LOOK
      rot.current.pitch = Math.max(-1.15, Math.min(0.55, rot.current.pitch - inp.look.dy * LOOK))
      inp.look.dx = 0; inp.look.dy = 0

      const { yaw } = rot.current
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw)
      const rx = Math.cos(yaw), rz = -Math.sin(yaw)
      const stepLen = SPEED * dt
      pos.current.x += (fx * inp.move.y + rx * inp.move.x) * stepLen
      pos.current.z += (fz * inp.move.y + rz * inp.move.x) * stepLen

      // The ◀▶ buttons walk a whole metre at a time, straight down the yard — the low-precision path
      // for a child who cannot hold a stick, and the only way to pace without any aim at all.
      if (inp.step) { pos.current.z = Math.round(pos.current.z) + inp.step; inp.step = 0 }

      // Stay in the yard. No collision beyond this — nothing is walled, so every part is walkable and
      // the camera can never be trapped inside geometry. The far bound is one metre past the deepest
      // legal peg, so a child can always reach the answer and never wander off measuring.
      pos.current.x = Math.max(-5, Math.min(d.frontage + 5, pos.current.x))
      pos.current.z = Math.max(SPAWN_Z, Math.min(MAX_DEPTH + 1, pos.current.z))
    }

    /**
     * ⚠️ THIS PINNED THE *REVIEW* CAMERA TO EYE HEIGHT TOO, AND THAT WAS A REAL BUG HIDING IN PLAIN
     * SIGHT FOR THE WHOLE LIFE OF THE CHAPTER. It ran after the `demoCam` branch, so the raised side
     * shot — the one beat that shows the child the floor they pegged out, and the one the handoff
     * records as never having been watched settled — was silently rendered from **1.55 m instead of
     * 3.4 m**. Its own comment says why that is wrong: at eye height the shot looks across a flat
     * floor at a grazing angle and the laid tiles merge into stripes. Measured on screen: the plot sat
     * in the top quarter of the frame with the lower 60% bare foreground, which is what "the visuals
     * aren't good" looked like on the most important beat in the chapter.
     *
     * The child's own stance still gets a fixed eye height — that is what stops the walk bobbing —
     * but a camera the DEMO is driving owns its own Y.
     */
    if (!demoCam) pos.current.y = EYE
    cam.position.copy(pos.current)
    cam.rotation.set(rot.current.pitch, rot.current.yaw, 0)

    if (demoCam) return

    // ── pacing: how far back from the road you have walked, to the nearest whole metre ──
    // A peg goes where you stand, so this is both the readout and the value that gets committed.
    // `forceDepth` is the dev-only test hook (see `useDevDepth`) — `useFrame` is the only place that
    // owns this value, so a headless drive has to reach it here.
    const forced = forceDepth.current
    if (forced !== null) { pos.current.z = forced; forceDepth.current = null }
    const m = Math.max(0, Math.min(MAX_DEPTH, Math.round(pos.current.z)))
    if (m !== depth.current) { depth.current = m; onDepth(m) }
  })

  return null
}

/**
 * ⚠️ THE DEV-ONLY DRIVE HOOK, AND WHY IT EXISTS.
 *
 * `useFrame` advances only while the tab is FRONTED, and a screenshot fronts it for ~40 ms with `dt`
 * capped at 0.05 — about 0.45 m of travel per screenshot. Measured in this repo: `document.hidden`
 * false with 62 rAF frames/s at one moment and true with 0 frames twenty minutes later, with no
 * navigation between. So a walking loop is not reliably drivable headlessly, and cut ③'s peg loop was
 * reached exactly once, opportunistically, and never played end to end.
 *
 * Three lines make the whole scored loop drivable: `window.__miloPace(n)` sets the paced depth. Gated
 * on `NODE_ENV !== 'production'` exactly like the teen band's `data-test-answer`, which is proven to
 * dead-code-eliminate (0 hits in `.next/server` and `.next/static`), so it never reaches a learner.
 */
function useDevDepth(forceDepth: React.RefObject<number | null>) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const w = window as unknown as { __miloPace?: (n: number) => void }
    w.__miloPace = (n: number) => { forceDepth.current = Math.max(0, Math.min(MAX_DEPTH, Math.round(n))) }
    return () => { delete w.__miloPace }
  }, [forceDepth])
}

// ─── The canvas ─────────────────────────────────────────────────────────────────────────
function Yard(props: React.ComponentProps<typeof PlotScene> & Omit<React.ComponentProps<typeof Rig>, 'd'>) {
  const { d, site, laid, depth, pegged, revealed, ...rig } = props

  // ⚠️ r3f will not create its renderer until it has MEASURED a non-zero container, and it measures
  // with a ResizeObserver. A container that mounts at its final size and never changes gets exactly
  // one RO callback — and RO callbacks are delivered with the rendering steps, which a browser does
  // not run in a hidden tab. So on a backgrounded tab the scene never boots at all: canvas stuck at
  // the intrinsic 300×150, no `onCreated`, no camera, a screen of nothing but the clear colour.
  // (Measured: `document.hidden` true, 0 rAF frames in 1.5s, in BOTH the preview pane and a
  // background Chrome tab — which is every automated drive this repo does.)
  // The measure hook also listens for `window.resize`, and a synthetic one is delivered by the event
  // loop rather than the frame loop, so it lands in a hidden tab. Two nudges on a timer: one after
  // mount, one after paint would normally have happened.
  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event('resize'))
    const a = window.setTimeout(nudge, 0)
    const b = window.setTimeout(nudge, 120)
    return () => { window.clearTimeout(a); window.clearTimeout(b) }
  }, [])

  /**
   * ⚠️ THE SKY IS A CSS GRADIENT BEHIND A TRANSPARENT CANVAS, NOT A `scene.background` COLOUR.
   *
   * A solid background paints the whole upper half of the frame in one flat tone, which is the same
   * "large flat area doing nothing" fault as the untextured ground. The cheap fix is not a sky sphere
   * or a shader — it is three lines: make the canvas alpha, drop the background colour, and let the
   * wrapper's gradient show through. This chapter's own intro card already does exactly that.
   *
   * The fog then has to fade to the HAZE tone rather than to the sky's midpoint, or the ground's far
   * edge dissolves into a colour the gradient does not have there and the horizon shows a seam.
   */
  const top = shade(site.sky, -0.15)
  // ⚠️ A NEARLY-WHITE HAZE MAKES EVERY DISTANT THING WHITE, AND NO AMOUNT OF DARKENING THE OBJECT
  // FIXES IT. At `s × 0.45, l + 0.11` the haze sat around 0.93 lightness, so the skyline band — 55%
  // fog-blended at z 34–46 — arrived on screen as a row of white cardboard cut-outs whatever tone the
  // generator gave it. Twice I darkened the buildings; the haze was the thing. Keeping most of the
  // sky's saturation and only a small lift leaves distance reading as distance rather than as fade-out.
  const haze: Tone = { ...site.sky, s: site.sky.s * 0.75, l: Math.min(0.88, site.sky.l + 0.045) }

  /**
   * ⚠️ AN EMPTY GRADIENT IS STILL A LARGE FLAT AREA DOING NOTHING — it just fails more politely than a
   * solid colour did. The upper 40% of every frame was one smooth ramp with nothing in it, which is
   * the same fault as the untextured ground one layer up.
   *
   * The fix is not a sky sphere, a shader or a cloud texture: it is four more CSS gradients stacked on
   * the same element, which cost one style string and zero draw calls. A low warm sun glow on the
   * light side (the directional comes from +x, so the glow agrees with where the shadows say it is)
   * and three soft cloud banks, all in the sky's own hue so the palette argument is untouched.
   */
  // near-white, not "the sky a bit lighter" — a cloud at `sky + 0.16` over a 0.85 haze is invisible
  const cloud = (a: number) => cssA({ h: site.sky.h, s: 0.10, l: 0.99 }, a)
  /**
   * ⚠️ THE SUN GLOW WAS PAINTED ON THE WRONG SIDE OF THE SKY, and the shadows in the same frame said
   * so. The key light sits at world +X. The child spawns at yaw π, and at that yaw camera-right is
   * `(cos π, 0, −sin π)` = (−1, 0, 0) — world −X. So the sun is on the player's **LEFT**, while the
   * glow was drawn at 78% of the viewport width, i.e. screen right. Every shadow in the yard pointed
   * one way and the light source in the sky sat opposite them. Moved to 20%, and warmed and lowered
   * to sit near the horizon, which is where a 25° sun is.
   */
  /**
   * ⚠️ THE SUN AND THE CLOUDS WERE ALREADY HERE AND NEITHER WAS VISIBLE ON SCREEN — which is this
   * chapter's recurring failure mode rather than a new fault: every soft element got tuned just under
   * the threshold of being seen, while the one thing that was not subtle (the road) was a black band.
   * Worked through on the actual numbers: the glow was `hsla(40,62%,88%,.62)` over a haze of roughly
   * `rgb(213,218,224)`, which composites to `rgb(230,225,213)` — a +17/+7/−11 warm nudge. Present,
   * arithmetically correct, and not a sun. The clouds were `sky + 0.16` at alpha 0.34–0.55 over a haze
   * at 0.85, i.e. near-white on near-white.
   *
   * So: a small bright CORE inside the wider glow (a sun is a disc with a bloom, not a smear), and
   * clouds that are actually white with a late colour stop so they hold an edge instead of dissolving.
   * ⚠️ The glow stays on the LEFT. The key sits at world +X and the child spawns at yaw π, where camera
   * right is −X — so the sun is on the player's left, and the post shadows on the road run right, which
   * is the check: put the glow where the shadows say the light already is.
   */
  const sky = [
    `radial-gradient(13% 10% at 20% 31%, ${cssA({ h: 46, s: 0.92, l: 0.97 }, 0.92)} 0%, transparent 72%)`,
    `radial-gradient(56% 44% at 20% 31%, ${cssA({ h: 38, s: 0.78, l: 0.88 }, 0.78)} 0%, transparent 66%)`,
    `radial-gradient(30% 12% at 22% 18%, ${cloud(0.92)} 0%, ${cloud(0.72)} 48%, transparent 74%)`,
    `radial-gradient(38% 10% at 62% 27%, ${cloud(0.80)} 0%, ${cloud(0.60)} 46%, transparent 76%)`,
    `radial-gradient(24% 8% at 40% 9%, ${cloud(0.70)} 0%, ${cloud(0.50)} 44%, transparent 76%)`,
    // ⚠️ THE HAZE STOP MUST LAND *ABOVE* THE HORIZON, NOT ON THE BOTTOM OF THE SCREEN — this was a
    // seam. The fog fades the ground plane's far edge to `haze`, but the gradient only reached `haze`
    // at 100% of the VIEWPORT while the horizon sits near 42% of it (eye 1.55 m, pitch −0.13). So the
    // fogged ground met a sky still two stops darker and the join drew a hard line across the frame.
    // ⚠️ AND IT HAS TO BE *EARLY* — 34%, not 42% — BECAUSE THE HORIZON MOVES. The review camera pitches
    // down 0.52 rad and the demo's road shot sits lower again, so a stop tuned to one pitch reopens the
    // seam at another. Reaching haze well above the highest horizon any camera produces, and holding it
    // all the way down, costs nothing: everything below the horizon is covered by ground.
    `linear-gradient(180deg, ${css(top)} 0%, ${css(site.sky)} 18%, ${css(haze)} 34%, ${css(haze)} 100%)`,
  ].join(',')

  return (
    <div style={{ position: 'fixed', inset: 0, touchAction: 'none', background: sky }}>
      {/* ⚠️ `antialias: false` on ~140 hard-edged boxes is exactly the wrong economy — every silhouette
          in the yard is a straight diagonal, which is the one case aliasing is most visible, and there
          is no texture detail anywhere to hide it. It costs nothing at this draw count.
          ⚠️ AND THE FOG WAS TOO WIDE TO DO ITS JOB: at (26, 74) the ground plane's far edge was only
          ~half faded, so ground met sky on a hard line and the scene had no distance. Tightened, the
          horizon dissolves and the skyline band (z 34–46) sits in real haze. */}
      {/* ⚠️ `flat` IS ONE WORD AND IT IS THE BIGGEST COLOUR CHANGE IN THE FILE. r3f defaults the
          renderer to **ACESFilmicToneMapping** — a film-response curve that rolls off highlights and
          desaturates as it goes. On a photoreal scene that is what you want; on a deliberately
          low-saturation stylised one it eats the little colour there is and everything arrives milky
          grey, which is most of what "these visuals aren't good" was. `flat` selects NoToneMapping,
          so the palette `plotSite` computes is the palette that reaches the screen.
          ⚠️ IT IS NOT FREE: with no roll-off the light intensities become a HARD ceiling instead of a
          soft one, so the key had to come down 2.5 → 1.15 and the fills with it. Raise any of them
          and lit faces clip to white — which is what tone mapping was hiding. */}
      <Canvas
        flat
        shadows
        dpr={[1, 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 62, near: 0.1, far: 120 }}
        /**
         * ⚠️ LINEAR FOG STARTING AT 18 m GAVE THE WORKING AREA NO ATMOSPHERE AT ALL. The deepest legal
         * peg is MAX_DEPTH = 12 m, so the plot, every near prop and the whole mid-yard rendered with
         * zero distance cue — the child was judging metres across a plane with no depth grading on it.
         * Density 0.0224 is chosen so fog(40 m) = 0.548, i.e. it MATCHES the old linear fog at the
         * skyline's midpoint, so the skyline tone (tuned against exactly that 55% blend) is untouched.
         * What changes is everything nearer and everything further: 12 m 0% → 7.0%, 20 m 5% → 18.2%,
         * and the far tail stops saturating (60 m 100% → 83.6%) so the horizon dissolves rather than
         * hitting a wall of flat haze. It is one constructor swap and it costs nothing — `fog_fragment`
         * trades a smoothstep for an exp().
         *
         * ⚠️ AND TONE MAPPING COMES BACK, BUT NOT ACES. `flat` (NoToneMapping) was right to reject the
         * film curve — ACES desaturates exactly the colour this palette has little of — but it left the
         * intensities as a HARD ceiling, which is why the key had to sit at 1.15. Neutral is the Khronos
         * PBR neutral curve: it rolls off the top end without touching saturation, so the key can run at
         * 1.65 and the lime vest still lands under 1.0. One assignment, no EffectComposer, no bundle.
         */
        onCreated={({ scene, gl }) => {
          scene.fog = new THREE.FogExp2(css(haze), 0.0224)
          gl.toneMapping = THREE.NeutralToneMapping
        }}
      >
        <PlotScene d={d} site={site} laid={laid} depth={depth} pegged={pegged} revealed={revealed} />
        <Rig d={d} {...rig} />
      </Canvas>
    </div>
  )
}

// ─── HUD ────────────────────────────────────────────────────────────────────────────────
function Bubble({ text, short }: { text: string; short: boolean }) {
  if (!text) return null
  return (
    <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: short ? 8 : 14, zIndex: 26, maxWidth: 'min(34vw + 260px, 620px)', pointerEvents: 'none' }}>
      <div data-test-line style={{ background: UI.panel, border: `1px solid ${UI.line}`, borderRadius: 14, padding: short ? '7px 14px' : '10px 18px', color: UI.ink, fontFamily: UI.sans, fontWeight: 700, fontSize: short ? 14 : 17, textAlign: 'center', backdropFilter: 'blur(6px)' }}>
        {text}
      </div>
    </div>
  )
}

/** The child's own measuring. Never the target — craft doc: a running readout may only ever be their own work. */
function Tape({ n, short, equation }: { n: number; short: boolean; equation: string | null }) {
  return (
    <div style={{ position: 'fixed', right: short ? 8 : 14, top: short ? 8 : 14, zIndex: 26, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, pointerEvents: 'none' }}>
      <div data-test-paced={n} style={{ background: UI.panel, border: `1px solid ${UI.line}`, borderRadius: 12, padding: short ? '5px 12px' : '7px 16px', color: UI.ink, fontFamily: UI.mono, fontWeight: 800, fontSize: short ? 16 : 20 }}>
        {n} <span style={{ fontSize: short ? 11 : 13, opacity: 0.6, fontWeight: 600 }}>{n === 1 ? 'metre back' : 'metres back'}</span>
      </div>
      {equation && (
        <div data-test-equation style={{ background: OK, borderRadius: 12, padding: short ? '5px 12px' : '7px 16px', color: '#0d1a12', fontFamily: UI.mono, fontWeight: 800, fontSize: short ? 15 : 19 }}>
          {equation}
        </div>
      )}
    </div>
  )
}

/**
 * Move stick (left) + look drag (right). One overlay owns every pointer so the two never fight.
 * ⚠️ Neither is REQUIRED: the ◀▶ step buttons walk a metre at a time and the peg button is a big
 * fixed target, so the whole chapter is playable without a single precision gesture.
 */
function Controls({ input, size }: { input: React.RefObject<InputState>; size: number }) {
  const stick = useRef<{ id: number; ox: number; oy: number } | null>(null)
  const look = useRef<{ id: number; x: number; y: number } | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const R = size / 2

  const down = (e: React.PointerEvent) => {
    const half = window.innerWidth * 0.42
    if (e.clientX < half && !stick.current) {
      stick.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY }
    } else if (!look.current) {
      look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    if (stick.current?.id === e.pointerId) {
      const dx = e.clientX - stick.current.ox
      const dy = e.clientY - stick.current.oy
      const len = Math.hypot(dx, dy) || 1
      const cl = Math.min(1, len / R)
      const nx = (dx / len) * cl, ny = (dy / len) * cl
      setKnob({ x: nx * R, y: ny * R })
      input.current.move = { x: nx, y: -ny }   // screen-up is forward
    } else if (look.current?.id === e.pointerId) {
      input.current.look.dx += e.clientX - look.current.x
      input.current.look.dy += e.clientY - look.current.y
      look.current.x = e.clientX; look.current.y = e.clientY
    }
  }
  const up = (e: React.PointerEvent) => {
    if (stick.current?.id === e.pointerId) { stick.current = null; setKnob({ x: 0, y: 0 }); input.current.move = { x: 0, y: 0 } }
    if (look.current?.id === e.pointerId) look.current = null
  }

  // Desktop: WASD/arrows, so this is playable without a touchscreen.
  useEffect(() => {
    const keys = new Set<string>()
    const apply = () => {
      const y = (keys.has('w') || keys.has('arrowup') ? 1 : 0) + (keys.has('s') || keys.has('arrowdown') ? -1 : 0)
      const x = (keys.has('d') || keys.has('arrowright') ? 1 : 0) + (keys.has('a') || keys.has('arrowleft') ? -1 : 0)
      input.current.move = { x, y }
    }
    const kd = (e: KeyboardEvent) => { keys.add(e.key.toLowerCase()); apply() }
    const ku = (e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); apply() }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
  }, [input])

  return (
    <>
      <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ position: 'fixed', inset: 0, zIndex: 15, touchAction: 'none' }} />
      <div style={{ position: 'fixed', left: 16, bottom: 16, width: size, height: size, borderRadius: '50%', border: `2px solid ${UI.line}`, background: 'rgba(24,30,26,.3)', zIndex: 22, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: size * 0.42, height: size * 0.42, marginLeft: -size * 0.21, marginTop: -size * 0.21,
          transform: `translate(${knob.x}px, ${knob.y}px)`, borderRadius: '50%', background: 'rgba(242,237,228,.5)' }} />
      </div>
    </>
  )
}

function Btn({ label, onClick, w, h, tone, disabled, testId }: {
  label: string; onClick?: () => void; w: number; h: number; tone: 'plain' | 'go'; disabled?: boolean; testId?: string
}) {
  return (
    <button
      data-test-id={testId}
      onPointerDown={e => e.stopPropagation()}
      onPointerUp={e => { e.stopPropagation(); if (!disabled) onClick?.() }}
      onClick={e => { e.stopPropagation() }}
      disabled={disabled}
      style={{
        minWidth: w, height: h, padding: '0 14px', borderRadius: 14,
        border: `1px solid ${UI.line}`, background: tone === 'go' ? OK : UI.panel, color: tone === 'go' ? '#17200f' : UI.ink,
        fontFamily: UI.sans, fontWeight: 800, fontSize: Math.max(13, Math.round(h * 0.32)),
        opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer', touchAction: 'none',
      }}
    >{label}</button>
  )
}

// ─── Play ───────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

/**
 * WALK BACK → DROP THE PEG.
 *
 * The foreman has given the number and pegged the road frontage. The yard behind it is empty, so
 * there is nothing to count and no pile to assemble — the only thing on screen is how far the child
 * has paced. Stopping in the right place IS the arithmetic, and nothing but their own head can tell
 * them where that is.
 *
 * ⚠️ ONE PEG in a scored round (`settleAfterPeg`, whose note says why): a repeatable commit is a
 * yes/no oracle and the child guesses instead of working it out. Walking back and forth beforehand is
 * free, which is where the deciding belongs. The guided round keeps its retry.
 */
const PlotPlay: React.FC<{ data: PlotRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const reduced = useReducedMotion()
  const input = useRef<InputState>({ move: { x: 0, y: 0 }, look: { dx: 0, dy: 0 }, step: 0 })
  const forceDepth = useRef<number | null>(null)
  const [depth, setDepth] = useState(0)                     // how far back they have paced, live
  const [pegged, setPegged] = useState<number | null>(null) // where the peg went; null until committed
  const [line, setLine] = useState(data.prompt)
  const [revealed, setRevealed] = useState(false)           // pegged exactly right — the reveal
  const [over, setOver] = useState(false)                   // the round has settled; no more pegging
  const done = useRef(false)
  useDevDepth(forceDepth)

  const site = useMemo(() => makeSite(data.seed, data.frontage), [data.seed, data.frontage])

  /**
   * ⚠️ ON THE COMMIT THE CAMERA SWINGS ROUND TO SHOW WHAT WAS BUILT, AND WITHOUT IT THE WHOLE DESIGN
   * FAILS SILENTLY.
   *
   * The child pegs at the far edge FACING AWAY from the road, so everything the delivery then lays is
   * BEHIND them. Driven on screen, a wrong peg read *"Too far back — there are not enough tiles to
   * reach the peg. Part of it would be bare"* over an empty green field: the tiles, the bare strip and
   * the leftovers were all off-screen behind the camera. **The consequence — the one thing that makes a
   * miss a consequence rather than a verdict — was invisible, on every round, right and wrong.**
   *
   * Same elevated side shot the demo's last beat uses, through the same `demoCam` path, so there is one
   * way of framing the result. Only ever AFTER the peg: before it, the camera is the child's.
   */
  const reviewCam = useMemo<[number, number, number, number, number] | null>(
    () => (pegged === null ? null : [-4.4, 3.4, pegged / 2 - 0.4, -Math.PI / 2, -0.52]),
    [pegged],
  )

  /**
   * What the delivery lays into the plot the CHILD pegged out — not the one they should have. That is
   * what makes a miss a consequence rather than a verdict: peg too near the road and the floor fills
   * with tiles to spare; peg too far back and the units run out short of the peg.
   */
  const laid = useMemo(() => {
    if (pegged === null) return new Set<string>()
    return new Set(slotsFor({ ...data, depth: pegged }).slice(0, data.target))
  }, [data, pegged])

  useEffect(() => { speak(data.say); setLine(data.prompt) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  /** The commit. The peg goes where you are standing. */
  const peg = useCallback(() => {
    if (done.current || depth < 1) return
    const { right, over: settled } = settleAfterPeg(mode, depth, data)
    setPegged(depth)
    if (right) {
      setRevealed(true)
      setLine(data.qType === 'area' ? 'That uses every tile — a floor to the metre.' : 'The fence goes right round with none to spare.')
      speak(equationFor(data).replace('×', 'times').replace('+', 'plus'))
    } else {
      const miss = missFor(data, depth)
      setLine(miss)
      speak(miss)
    }
    /**
     * ⚠️ THE HOLD IS THE TEACHING BEAT, AND IT WAS TOO SHORT. The camera swings round on the commit to
     * show the floor the child pegged out — covered exactly, or short of the peg with a bare strip. That
     * shot IS the lesson, and a miss needs LONGER on it than a hit, not less: the child has to see what
     * went wrong before it is taken away. Driven at 2.6 s the plot was gone before it could be read.
     */
    if (settled) {
      done.current = true
      setOver(true)
      window.setTimeout(() => onComplete(right), right ? 3000 : 4600)
    } else {
      // Guided only: pull the peg back out so they can walk it again from the road.
      window.setTimeout(() => { if (!done.current) setPegged(null) }, 4600)
    }
  }, [depth, data, mode, onComplete])

  const stickSize = short ? 84 : 108
  const btnH = short ? 46 : 56
  // Gated on `over`, not `revealed`: once a scored round has settled the button goes, so a wrong peg
  // never leaves a live-looking control that does nothing (FitOut's dead board, craft doc).
  const live = !over && pegged === null

  return (
    <>
      <Yard d={data} site={site} laid={laid} depth={depth} pegged={pegged} revealed={revealed}
        input={input} onDepth={setDepth} demoCam={reviewCam} reduced={reduced} forceDepth={forceDepth} />
      <Bubble text={line} short={short} />
      {/* The readout is how far they have WALKED — their own measuring, never a target and never a
          running product. "metres back" states what it is so it cannot be read as a count of units. */}
      <Tape n={depth} short={short} equation={revealed ? equationFor(data) : null} />
      <Controls input={input} size={stickSize} />

      {live && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: short ? 10 : 16, zIndex: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* The low-precision path: a whole metre per tap, no aim, no held gesture. */}
          <Btn label="◀" testId="back" w={btnH} h={btnH} tone="plain" onClick={() => { input.current.step = -1 }} disabled={depth <= 0} />
          <Btn label={depth < 1 ? 'Walk back into the yard' : 'Peg it here ✓'} testId="peg"
            w={short ? 190 : 240} h={btnH} tone={depth < 1 ? 'plain' : 'go'} onClick={peg} disabled={depth < 1} />
          <Btn label="▶" testId="fwd" w={btnH} h={btnH} tone="plain" onClick={() => { input.current.step = 1 }} disabled={depth >= MAX_DEPTH} />
        </div>
      )}
    </>
  )
}

// ─── Demo / re-teach ────────────────────────────────────────────────────────────────────
// Self-paced, with `speak()` alongside — never driven off utterance events, because a device with no
// voice would then freeze the teaching mid-beat (craft doc, TickTock's lesson hang).
const PlotExplain: React.FC<{ data: PlotRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const reduced = useReducedMotion()
  const input = useRef<InputState>({ move: { x: 0, y: 0 }, look: { dx: 0, dy: 0 }, step: 0 })
  const forceDepth = useRef<number | null>(null)
  const [step, setStep] = useState(0)
  const doneRef = useRef(onDone); doneRef.current = onDone

  const { frontage: f, depth: dep, target } = data
  const site = useMemo(() => makeSite(data.seed, f), [data.seed, f])

  // The beats live in `plotMaths` so the gate drives the same list the demo plays — see the ⚠️ on
  // `explainBeats` for why (the Supply Run shipped a beat whose picture contradicted its own words).
  const script = useMemo(() => explainBeats(data), [data])

  useEffect(() => {
    const cancel = speakSteps(script.map(s => s.say), {
      onStep: i => setStep(i),
      onDone: () => window.setTimeout(() => doneRef.current(), 1500),
      fallbackStepMs: 2600,
      rate: 0.9,
      gapMs: 500,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cur = script[Math.min(step, script.length - 1)]
  const laid = useMemo(() => (cur.laid ? new Set(slotsFor(data)) : new Set<string>()), [cur.laid, data])
  const cam = useMemo<[number, number, number, number, number]>(() =>
    // ⚠️ The side view is RAISED and pitched down. At eye height (1.55 m) it looks across a flat floor
    // at a grazing angle, and the laid tiles merged into stripes — so the one beat that shows the floor
    // coming out exactly right could not be counted. Post-commit the units are MEANT to be countable;
    // it is only before the peg that nothing may be.
    cur.view === 'side' ? [-4.4, 3.4, dep / 2 - 0.4, -Math.PI / 2, -0.52] : [f / 2, EYE, cur.camZ, Math.PI, -0.13],
    [cur, f, dep])

  return (
    <>
      <Yard d={data} site={site} laid={laid} depth={cur.depth} pegged={cur.pegged} revealed={cur.laid}
        input={input} onDepth={() => {}} demoCam={cam} reduced={reduced} forceDepth={forceDepth} />
      <Bubble text={cur.say} short={short} />
      {/* The same readout the child gets — metres walked, never a product. */}
      {cur.depth > 0 && <Tape n={cur.depth} short={short} equation={cur.laid ? equationFor(data) : null} />}
    </>
  )
}

function useReducedMotion(): boolean {
  const [r, setR] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setR(m.matches)
    const on = () => setR(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return r
}

// ─── Beat + orchestrator ────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<PlotRound> {
  return {
    skillId: 'areaPerimeter',
    rounds: 10,
    reteachAfter: 3,
    walkEvery: 99,
    ownsFeedback: true,          // the chapter retries IN PLACE and writes its own miss line
    make: (d, round, asked) => makeRound((d || 1) as 1 | 2 | 3, round, asked),
    sig: d => `${d.qType}|${d.frontage}x${d.depth}`,
    prompt: () => '',            // the chapter's own bubble carries the question
    say: d => d.say,
    coverage: { of: d => d.qType, all: ['area', 'perimeter'] },
    Play: ({ data, onSubmit }) => <PlotPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <PlotExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function FloorPlot({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const { h: vh } = useViewport()
  const short = vh < 470
  const needsRotate = useNeedsRotate()
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)

  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return
    finished.current = true
    stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 600)), [])
  const beat = useMemo(() => makeBeat(), [])

  // The early return sits BELOW every hook, or turning the tablet changes the hook count.
  if (needsRotate) return <RotateGate line="You walk this plot — turn your tablet sideways." />

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: css(makeSite(1, 4).sky) }}>
      <button onClick={exit} style={{ position: 'fixed', left: 12, top: 12, zIndex: 40, background: UI.panel, border: `1px solid ${UI.line}`, color: UI.ink, borderRadius: 10, padding: '6px 12px', fontFamily: UI.sans, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>← Menu</button>

      {phase === 'intro' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: `linear-gradient(180deg,${css(makeSite(1, 4).sky)},${css(makeSite(1, 4).ground)})` }}>
          <div style={{ maxWidth: 560, background: UI.panel, border: `1px solid ${UI.line}`, borderRadius: 20, padding: short ? '18px 20px' : '26px 30px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: short ? 34 : 44 }}>🏗️</div>
            <h1 style={{ fontFamily: UI.sans, fontWeight: 900, fontSize: short ? 20 : 26, color: UI.ink, margin: '8px 0 6px' }}>The Empty Plot</h1>
            <p style={{ fontFamily: UI.sans, fontSize: short ? 13 : 15, lineHeight: 1.5, color: UI.inkMute, margin: '0 0 16px' }}>
              The foreman tells you what is on the lorry and how wide the plot runs along the road. The rest of the
              yard is empty — there is nothing out there to count. Work out how far back it goes, walk it, and peg it.
            </p>
            <button data-test-id="start" onClick={() => { unlockSpeech(); setPhase('demo') }}
              style={{ background: UI.warm, border: 'none', borderRadius: 14, padding: short ? '10px 22px' : '13px 30px', fontFamily: UI.sans, fontWeight: 800, fontSize: short ? 15 : 17, color: '#17200f', cursor: 'pointer' }}>
              Walk in →
            </button>
          </div>
        </div>
      )}

      {phase === 'demo' && (
        <PlotExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <PlotPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      )}

      {phase === 'practice' && (
        <SkillBeat beat={beat} onInterlude={interlude}
          onComplete={(c, w, mastered) => {
            result.current.correct += c; result.current.wrong += w
            finishChapter(result.current.correct, result.current.wrong, mastered)
          }} />
      )}
    </div>
  )
}
