'use client'
/**
 * BASE-TEN BLOCKS — the shared manipulative, extracted from BlockYard when it got its second
 * consumer.
 *
 * ⚠️ **THIS FILE EXISTS BECAUSE THERE ARE TWO CONSUMERS, NOT BECAUSE IT LOOKED REUSABLE.**
 * The handoff's standing rule is that one consumer is not an abstraction, and BlockYard carried all
 * of this privately for exactly that reason. `BuildingBlocks` (placeValue) is the second, and it
 * needs the identical pieces: a set of blocks only means anything if every part of it is drawn to
 * ONE unit, so two chapters drawing their own cubes would drift apart the first time either was
 * touched.
 *
 * What lives here is what MUST be identical across chapters:
 *   the pieces (cube · rod · contact shadow · grain), the material system, the unit derivation,
 *   the answer pad and the prompt banner.
 *
 * What deliberately does NOT live here is anything about a chapter's own WORLD — its ground line,
 * where things stand, which way they travel, what the question is. BlockYard runs a farm yard with
 * the tens on the RIGHT; BuildingBlocks runs a forest clearing with the tens on the LEFT, the way a
 * number is written. Those are chapters, not shared geometry.
 *
 * ⚠️ Every rule below was paid for in BlockYard's four passes; the comments travel with the code
 * so the next reader does not re-learn them.
 */
import React from 'react'
import { Arrive } from './critters'

// ─── Material ─────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THE PALETTE IS MEASURED, NOT EYEBALLED, AND IT IS A SEPARATE CHECK FROM THE STYLE.
 * `cart.png` was checked for brushwork and ink outlines, passed, and was the most saturated and the
 * darkest thing on a pale pastel farm (sat .676 / val .615) against backdrops at .33–.42 / .71–.85.
 * So every block is drawn in CODE inside that band, on every scene, with nothing that can drift.
 *
 * ⚠️ **THE HUE IS A SEPARATE DECISION FROM THE BAND, AND IT IS THE ONE THAT MAY VARY.**
 * BlockYard's first pass drew the blocks in the scenery's own warm sand and they read as HAY BALES
 * AND FENCE POSTS — dead on the palette band and completely lost in a farmyard. **A manipulative is
 * a TOOL, not scenery: it is meant to stand out.** The band is what must match; the hue is free.
 *
 * Which is what makes a different set of blocks per round POSSIBLE rather than risky: every
 * material shares one saturation and one brightness, so all of them sit in the painted sprites'
 * band by construction, and only the hue moves. Each chapter then owns its own hue list, and its
 * gate asserts every material is far enough in hue from the scene it is paired with.
 */
export const MAT_SAT = 0.46, MAT_VAL = 0.80
export interface Material { name: string; hue: number; grain: boolean }

/** Standard HSV→RGB. The shades are DERIVED rather than typed out, so a long list of hand-written
 *  hex values cannot drift out of the band one at a time. */
function hsv(h: number, s: number, v: number): string {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6]
  return `rgb(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)})`
}
export const shadesOf = (m: Material) => ({
  top: hsv(m.hue, MAT_SAT - 0.1, MAT_VAL + 0.09),        // the lit face — highlights desaturate
  face: hsv(m.hue, MAT_SAT, MAT_VAL),
  deep: hsv(m.hue, MAT_SAT + 0.08, MAT_VAL - 0.13),
  seam: hsv(m.hue, MAT_SAT + 0.3, MAT_VAL - 0.42),
  rim: 'rgba(255,250,244,.5)',
  grain: m.grain,
})
export type Shades = ReturnType<typeof shadesOf>

/** Soft, cool and close. A hard drop-shadow is the loudest "pasted on" tell there is. */
const SHADOW = 'radial-gradient(ellipse at center, rgba(46,38,24,.32) 0%, rgba(46,38,24,.13) 56%, rgba(46,38,24,0) 78%)'

// ─── The unit ─────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ **A ROD IS EXACTLY TEN CUBES TALL, AND THAT IS NOT NEGOTIABLE.**
 *
 * BlockYard's first attempt drew it at 0.55 of unit scale so it would clear the prompt on a short
 * frame — which means it stood five and a half cubes high beside the cubes it is made of. **A child
 * can lay a rod against the ones and read the wrong number off it.** That is a lie inside the
 * manipulative, which is worse than any look problem: the whole reason to use base-ten blocks is
 * that the relationship is there to be MEASURED rather than asserted.
 *
 * So the ROD is fixed at ten units and the UNIT is derived from the room available.
 */
export const ROD_SEGMENTS = 10

/**
 * The unit cube's side — and every other size falls out of it, because a base-ten set only means
 * anything if all of it is drawn to ONE unit.
 *
 * Three terms bind it, and the third is the one that matters: the width of the column a cube stands
 * in (a cube wider than its column buries its neighbour, and a run the child cannot count is a
 * wrong answer the chapter caused), a share of the height, and **the room a TEN-cube rod needs to
 * stand up in**. The last is why the unit shrinks on a short frame rather than the rod lying about
 * its length.
 *
 * ⚠️ `budgetPx` is a PARAMETER because the two chapters set their ground line differently.
 * Deriving it here would bake one chapter's world into the shared piece.
 */
/**
 * ⚠️ **THE ONLY PLACE IN THE APP THAT DERIVES A ROD FROM A CUBE.** Every rod anywhere — standing on
 * a shelf, lying in a supply tray, carried by Milo — comes through here, so no caller can write its
 * own multiplier. That is not tidiness: the first supply tray drew a "ten" at 2.4 units beside a
 * one-cube, and a gate that only checked the shelf could not see it. A relationship that may not
 * vary should not be expressible twice.
 */
export const blockSet = (cube: number) => ({
  cube,
  rodW: Math.round(cube * 0.92),
  rodH: cube * ROD_SEGMENTS,                  // exactly ten. See ROD_SEGMENTS.
  // Measured against a standing rod on screen: at 3.4 units Milo was a third of its height and read
  // as a toy beside it. He has to look like someone who could pick one up.
  miloH: Math.round(cube * 4.6),
})

export function unitFor(vw: number, vh: number, budgetPx: number, colPct: number) {
  return blockSet(Math.max(12, Math.min(40, Math.floor(Math.min(
    vh * 0.055,
    vw * (colPct / 100),
    budgetPx / (ROD_SEGMENTS + 0.24),         // + the rod's own lit top face
  )))))
}

// ─── Pieces ───────────────────────────────────────────────────────────────────────────
/**
 * A REAL elliptical contact shadow. ⚠️ BlockYard's pass 2 had not one — only the generic
 * `drop-shadow` filter `SheetCell` carries, which is a lighting cue and not a contact cue, so
 * nothing on screen touched the ground. It renders INSIDE whatever is travelling; outside, it lags,
 * which is a bug this repo has already shipped once.
 */
export function Shadow({ w, h }: { w: number; h: number }) {
  return <span aria-hidden style={{
    position: 'absolute', left: '50%', bottom: -Math.round(h * 0.35), transform: 'translateX(-50%)',
    width: w, height: h, borderRadius: '50%', background: SHADOW, pointerEvents: 'none', zIndex: 0,
  }} />
}

/**
 * The surface mark some materials carry. ⚠️ **IT IS VERTICAL, AND THAT IS NOT A STYLE CHOICE.**
 * A rod's ten units are marked by HORIZONTAL seams, so any decorative horizontal line on a block is
 * an eleventh unit as far as a child counting it is concerned. Grain runs the other way, where it
 * cannot be mistaken for a division.
 */
function Grain({ w, colour }: { w: number; colour: string }) {
  return <>{[0.34, 0.66].map(f => (
    <span key={f} aria-hidden style={{ position: 'absolute', left: `${f * 100}%`, top: '18%', bottom: '14%',
      width: Math.max(1, Math.round(w * 0.045)), background: colour, opacity: 0.35, borderRadius: 99 }} />
  ))}</>
}

/**
 * ONE. A cube with a lit top face, a shaded front and its own contact shadow.
 *
 * ⚠️ **A BLOCK IS THE ONE THING THAT MAY BE A RECTANGLE.** The craft doc's rule — a filled shape
 * over a painted scene reads as UI furniture — is about SURFACES: slabs, panels, bars. A wooden cube
 * is a small object with volume, so it is drawn with a lit top, a shaded front and a real contact
 * shadow. **Volume is what separates an object from a panel.**
 */
export function Cube({ s, m }: { s: number; m: Shades }) {
  const top = Math.round(s * 0.24)
  return (
    <span style={{ display: 'block', position: 'relative', width: s, height: s + top }}>
      <Shadow w={Math.round(s * 1.1)} h={Math.round(s * 0.34)} />
      <span style={{ position: 'relative', zIndex: 1, display: 'block', width: s, height: s + top }}>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top + 1,
          background: m.top, borderRadius: `${s * 0.2}px ${s * 0.2}px 0 0`,
          boxShadow: `inset 0 1px 0 ${m.rim}` }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top, bottom: 0, overflow: 'hidden',
          background: `linear-gradient(180deg, ${m.face} 0%, ${m.deep} 100%)`,
          borderRadius: `0 0 ${s * 0.18}px ${s * 0.18}px`,
          boxShadow: `inset -${Math.max(1, s * 0.07)}px 0 0 rgba(60,44,28,.16)` }}>
          {m.grain && <Grain w={s} colour={m.seam} />}
        </span>
      </span>
    </span>
  )
}

/**
 * TEN. One rod, standing — and it still shows its ten segments, so nothing is asserted.
 *
 * ⚠️ BlockYard's pass 2 drew five creature heads above each bundle's rim so it "still read as a
 * load". That is the opposite of the lesson: a bundled ten is ONE thing, and separable bodies
 * inside it invite exactly the recount that unitising is the absence of. **Segments are not
 * bodies** — they are the marks on one object, which is the whole difference between a rod and ten
 * cubes.
 */
export function Rod({ w, h, m, delayMs = 0, nudge, axis = 'v' }: {
  /** `w` is always the rod's THICKNESS and `h` its LENGTH — ten units, whichever way it is turned. */
  w: number; h: number; m: Shades; delayMs?: number; nudge?: boolean
  /**
   * ⚠️ **'h' EXISTS SO A SUPPLY TRAY CAN SHOW A HONEST TEN.** A standing rod is ten cubes tall, and
   * ten cubes will not fit inside a control band — so the first version of the MAKE tray drew one at
   * **2.4 units**, sitting right beside a one-cube. That is the 0.55 fault this repo has already
   * paid for, in a new component: a child comparing the two reads the wrong number off them. Laid
   * FLAT the same rod is ten units LONG, which fits a band easily and stays measurable. It is also
   * how blocks actually sit in a tray.
   */
  axis?: 'v' | 'h'
}) {
  if (axis === 'h') return <RodFlat w={w} h={h} m={m} />
  const top = Math.round(w * 0.24)
  return (
    // One transform per wrapper: the nudge and the settle are separate elements. Stack two on one
    // and the later silently wins — the bug that cost this codebase a day across three chapters.
    <span style={{ display: 'block', animation: nudge ? 'by_nudge 1.5s ease-in-out infinite' : undefined }}>
      <span style={{ display: 'block', position: 'relative', width: w, height: h + top,
        animation: `by_settle .45s ease ${delayMs}ms both` }}>
        <Shadow w={Math.round(w * 1.9)} h={Math.round(w * 0.6)} />
        <span style={{ position: 'relative', zIndex: 1, display: 'block', width: w, height: h + top }}>
          <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top + 1,
            background: m.top, borderRadius: `${w * 0.2}px ${w * 0.2}px 0 0`,
            boxShadow: `inset 0 1px 0 ${m.rim}` }} />
          <span style={{ position: 'absolute', left: 0, right: 0, top, bottom: 0, overflow: 'hidden',
            background: `linear-gradient(90deg, ${m.face} 0%, ${m.deep} 100%)`,
            borderRadius: `0 0 ${w * 0.18}px ${w * 0.18}px` }}>
            {Array.from({ length: ROD_SEGMENTS }).map((_, i) => (
              <span key={i} data-seg style={{ position: 'absolute', left: 0, right: 0,
                top: `${(i / ROD_SEGMENTS) * 100}%`, height: `${100 / ROD_SEGMENTS}%`,
                borderTop: i ? `1px solid ${m.seam}` : 'none' }} />
            ))}
          </span>
        </span>
      </span>
    </span>
  )
}

/** The same ten, lying down: `h` long, `w` thick, still cut into ten visible units. */
function RodFlat({ w, h, m }: { w: number; h: number; m: Shades }) {
  const top = Math.round(w * 0.22)
  return (
    <span style={{ display: 'block', position: 'relative', width: h, height: w + top }}>
      <Shadow w={Math.round(h * 1.04)} h={Math.round(w * 0.5)} />
      <span style={{ position: 'relative', zIndex: 1, display: 'block', width: h, height: w + top }}>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top + 1,
          background: m.top, borderRadius: `${w * 0.2}px ${w * 0.2}px 0 0`,
          boxShadow: `inset 0 1px 0 ${m.rim}` }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top, bottom: 0, overflow: 'hidden',
          background: `linear-gradient(180deg, ${m.face} 0%, ${m.deep} 100%)`,
          borderRadius: `0 0 ${w * 0.18}px ${w * 0.18}px` }}>
          {Array.from({ length: ROD_SEGMENTS }).map((_, i) => (
            <span key={i} data-seg style={{ position: 'absolute', top: 0, bottom: 0,
              left: `${(i / ROD_SEGMENTS) * 100}%`, width: `${100 / ROD_SEGMENTS}%`,
              borderLeft: i ? `1px solid ${m.seam}` : 'none' }} />
          ))}
        </span>
      </span>
    </span>
  )
}

/** A cube standing at (or travelling to) a place on the ground, anchored by its base. */
export function Travelling({ s, m, x, ground, lift, tilt, dist, ms, delayMs, resetKey, z, leave, fusing }: {
  s: number; m: Shades; x: number; ground: number; lift: number; tilt: number
  dist: number; ms: number; delayMs: number; resetKey: string; z: number
  leave?: boolean; fusing?: boolean
}) {
  return (
    <div style={{ position: 'fixed', left: `${x}%`, top: `${ground * 100 - lift}%`,
      transform: 'translate(-50%, -100%)', zIndex: z, pointerEvents: 'none' }}>
      <Arrive dist={dist} ms={ms} delayMs={delayMs} leave={leave} resetKey={resetKey}>
        {() => (
          // the hand-stacked wobble is its own element, so it can never fight the travel transform
          <span style={{ display: 'block', transform: `rotate(${tilt}deg)`, transformOrigin: '50% 100%',
            animation: fusing ? 'by_shut .4s ease forwards' : undefined }}>
            <Cube s={s} m={m} />
          </span>
        )}
      </Arrive>
    </div>
  )
}

export const YARD_CSS = `
@keyframes by_nudge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes by_settle { 0%{opacity:0;transform:translateY(-7px) scale(.9)} 60%{opacity:1} 100%{opacity:1;transform:none} }
@keyframes by_shut { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(.8)} }
@keyframes by_pop { 0%{transform:scale(.3);opacity:0} 70%{transform:scale(1.06);opacity:1} 100%{transform:scale(1);opacity:1} }
`

// ─── Chrome ───────────────────────────────────────────────────────────────────────────
/** ⚠️ On a short frame a share of the height puts the banner ON the chapter chrome: measured at
 *  640×320 it ran under the "← Menu" button and through the tally pill. The chrome sits at a FIXED
 *  12px and is ~28 tall, so below a short height the banner clears it by a fixed amount rather than
 *  by a percentage — the same reason a ground line stops being a percentage there. */
export const BANNER_TOP = (vh: number) => (vh < 470 ? 46 : Math.round(vh * 0.035))
/**
 * ⚠️ On a short frame the banner MOVES ASIDE rather than shrinking. Two things were in its way and
 * one of them may not give: a centred banner ran under the "← Menu" button AND capped the standing
 * rods at ten 10px units. The craft doc's rule is to buy height from the CHROME, never from the
 * prose — so the prose keeps its size and sits over the side of the frame where the loose ones are,
 * and they are one cube tall. That leaves the rod column the full drop.
 */
export const BANNER_SHORT_W = 'min(46vw, 660px)'
/** The banner's bottom edge in px — exported so a gate can assert nothing standing reaches into it. */
export const bannerBottom = (vh: number) => BANNER_TOP(vh) + (vh < 470 ? 78 : 62)

/**
 * ⚠️ **`lead` EXISTS BECAUSE A SHORT FRAME HAS NO SECOND PLACE TO PUT A QUESTION.**
 * The chapter's target first lived in its own card above the bench — which, on a 640×320 frame,
 * measured y 234–274 against controls starting at 250: sitting ON the tap targets. Every other
 * candidate slot is occupied (the chrome, the shelf itself, Milo), so the honest answer is that
 * there is only ONE question region on screen and the target belongs inside it. It reads better
 * too: "**28** · Make the number on the order" is one thing to look at, not two.
 */
export function Banner({ text, vh, ok, side, lead }: {
  text: string; vh: number; ok?: boolean
  /** which side the banner retreats to on a short frame — the one holding only single cubes */
  side?: 'left' | 'right'
  lead?: React.ReactNode
}) {
  const short = vh < 470
  const align = !short ? 'center' : side === 'right' ? 'flex-end' : 'flex-start'
  return (
    <div style={{ position: 'fixed', top: BANNER_TOP(vh), left: 0, right: 0, zIndex: 40, display: 'flex',
      justifyContent: align,
      paddingLeft: short && side !== 'right' ? 96 : 12,
      paddingRight: short && side === 'right' ? 24 : 12, pointerEvents: 'none' }}>
      <div style={{
        maxWidth: short ? BANNER_SHORT_W : 'min(88vw, 660px)', background: 'rgba(255,252,244,.94)',
        border: `3px solid ${ok ? 'var(--garden-green)' : 'var(--milo-orange)'}`, borderRadius: 16, padding: '7px 18px',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: `clamp(13px, ${Math.round(vh * 0.032)}px, 20px)`,
        color: ok ? 'var(--garden-green-deep)' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(242,107,44,.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        {lead != null && (
          <span style={{ flexShrink: 0, fontWeight: 900, lineHeight: 1,
            fontSize: `clamp(24px, ${Math.round(vh * 0.075)}px, 44px)`, color: 'var(--ink)' }}>{lead}</span>
        )}
        <span>{text}</span>
      </div>
    </div>
  )
}

// ─── Answer pad ───────────────────────────────────────────────────────────────────────
export const PAD_BAND = (vh: number) => Math.round(Math.max(92, Math.min(vh * 0.21, 150)))

export function AnswerPad({ digits, onDigit, onClear, onDone, band, live, windows = 2 }: {
  digits: number[]; onDigit: (n: number) => void; onClear: () => void; onDone: () => void
  band: number; live: boolean
  /** how many digits the answer has. A "how many rods?" question is one; a whole number is two. */
  windows?: 1 | 2
}) {
  /** Sized off ITS OWN band, never off the block unit: deriving it from the scene gave 28×28
   *  buttons on a short frame while the pad's own band had room. The thing that is TAPPED wins. */
  const w = Math.max(26, Math.min(54, Math.floor((band - 6) / 2.27)))
  const win = (i: number) => (
    <span key={i} style={{
      width: w * 1.05, height: w * 1.15, borderRadius: w * 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--paper)', border: `3px solid ${digits.length > i ? 'var(--milo-orange)' : 'var(--outline)'}`,
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: w * 0.78, color: 'var(--ink)',
    }}>{digits[i] ?? ''}</span>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: w * 0.12,
      pointerEvents: live ? 'auto' : 'none', opacity: live ? 1 : .3, transition: 'opacity .3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: w * 0.24 }}>
        {Array.from({ length: windows }).map((_, i) => win(i))}
        <button onClick={onClear} style={{ marginLeft: w * 0.1, height: w * 0.9, padding: `0 ${w * 0.4}px`, borderRadius: w * 0.45, border: '3px solid var(--outline)', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: w * 0.4, cursor: 'pointer' }}>⌫</button>
        {/* Identical at every state — nothing may say the answer is right before the commit. */}
        <button onClick={onDone} disabled={digits.length < windows} style={{
          height: w * 1.1, padding: `0 ${w * 0.62}px`, borderRadius: w * 0.55, border: 'none',
          background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: w * 0.46,
          opacity: digits.length < windows ? .4 : 1, cursor: digits.length < windows ? 'default' : 'pointer',
          boxShadow: '0 4px 0 rgba(180,70,20,.45)',
        }}>Done ✓</button>
      </div>
      <div style={{ display: 'flex', gap: w * 0.14 }}>
        {Array.from({ length: 10 }).map((_, n) => (
          <button key={n} onClick={() => onDigit(n)} style={{
            width: w, height: w, borderRadius: w * 0.22, border: '3px solid var(--outline)',
            background: 'var(--paper)', fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: w * 0.5, color: 'var(--ink)', cursor: 'pointer',
          }}>{n}</button>
        ))}
      </div>
    </div>
  )
}
