'use client'
/**
 * Chapter (6–8) — PLACE VALUE (`placeValue`) → **MAKE IT**. The Clearing.
 *
 * ══ WHAT WAS WRONG WITH THE OLD CHAPTER ══════════════════════════════════════════════
 * ① Two of its three question types printed the numeral beside the blocks (`showNumeral: true`)
 *    while asking "how many stacks of ten?" — so **delete every block and the question is still
 *    answerable off the digit.** The same fault BlockYard shipped, on the same manipulative.
 * ② **The bundling arrived already done.** Three stacks and four loose were drawn for you. Bundling
 *    IS place value, and it was being handed over finished.
 * ③ Band-wide: a world picker, no rotate gate, no journey, and Milo as a 🦊 emoji fallback standing
 *    in a painted scene.
 *
 * ══ WHAT THE CHILD IS ACTUALLY LEARNING ══════════════════════════════════════════════
 * The curriculum's own words for this skill are *"Build a number from tens + ones (34 = 3 tens,
 * 4 ones)"* — **BUILD**. And [skill-graph.md](../../../../docs/skill-graph.md) names `p.placeValue2`
 * one of the five most load-bearing nodes in the whole 3–18 graph. What stands on it decides what
 * this chapter owes:
 *   `p.compare100`  →  43 > 34 *because 4 tens beat 3 tens* — i.e. **a digit's value comes from its
 *                      place**. This is the payload.
 *   `p.addTo100`    →  trading ten ones for a ten. This is the mechanism.
 *   `i.bigNumbers`  →  the same rule one place along.
 *
 * ⚠️ **A CHAPTER THAT ONLY COUNTS RODS AND ONES DOES NOT TEACH THE PAYLOAD.** Reading a built yard
 * into a two-window pad is transcription: the pad itself tells you which digit goes where, and a
 * child who does not know the 3 means thirty passes anyway. The test that exposes it is **34 vs 43**
 * — if both are equally easy, the chapter is not teaching place value. So the main verb is the
 * other direction:
 *
 *   MAKE   the sign shows **34**. A tens patch on the left, a ones patch on the right. The child
 *          calls for rods and cubes and builds it. Put them the wrong way round and you have made
 *          43 — and the chapter says so, by name, at the moment it bites.
 *   PACK   loose ones arrive; **the ones patch can never hold ten**, so they must be traded up; then
 *          the built number is read. This is where the trading is taught outright.
 *
 * ⚠️ **THE TENS PATCH IS ON THE LEFT AND THAT IS LOAD-BEARING, NOT DECORATION.** A number is
 * written tens-then-ones, so the child's eye sweeps left→right and reads it straight off the ground.
 * BlockYard has its ones on the left, which is backwards — and nobody noticed, because nothing there
 * is ever read as a numeral; the answer goes on a pad. Here the reading IS the skill.
 *
 * ══ HOW IT DIFFERS FROM BlockYard, WHICH SHARES THE MANIPULATIVE ═════════════════════
 * The blocks themselves are deliberately IDENTICAL — same cube, same ten-segment rod, drawn from
 * [yard.tsx](./yard.tsx). Two rejected ideas for making them look different: a tray of ten loose
 * cubes (ten separable bodies — the recount that unitising is the absence of) and a sealed box with
 * ten pips (one object, honest, but it throws away `rod === 10 × cube`, which is the whole reason a
 * base-ten set is worth using). **Correctness over novelty.** What differs instead:
 *
 *   | | BlockYard | here |
 *   |---|---|---|
 *   | place | farm · garden · town | **forest · shore · fairground** — no scene shared |
 *   | layout | ones left · rods right | **tens LEFT · ones right**, as a number is written |
 *   | delivery | walks in from off-frame LEFT | arrives from off-frame **RIGHT** |
 *   | verb | regroup, as a step inside a sum | **MAKE a number, then read it** |
 *
 * ⚠️ **AND THE PALETTE IS NOT ONE OF THE DIFFERENCES — see MATERIALS.** Both chapters stand blocks
 * on green ground, which forces both into the same cool band. Colour cannot carry this; the layout
 * and the verb do.
 *
 * Art: **zero.** Every block is code-drawn; every backdrop already shipped.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import { RotateGate, useNeedsRotate } from './RotateGate'
import { useViewport } from '@/shared/hooks/useViewport'
import { SheetCell, inFlowJourney, CRITTER_CSS, aspectOf, seeded, Arrive } from './critters'
import {
  Cube, Rod, Shadow, Travelling, Banner, AnswerPad, unitFor, blockSet, shadesOf,
  ROD_SEGMENTS, PAD_BAND, YARD_CSS, GROUND, groundOf, type Material, type Shades,
} from './yard'
import { rint } from '@/core/rand'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { SceneBg } from '@/shared/ui/SceneBg'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'

const BG = (n: string) => `/assets/backgrounds/${n}`
const MILO = '/assets/characters/milo_side.png'

// ─── Material ─────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ **THE COOL HUES ARE FORCED, NOT CHOSEN.** Measured across the band the blocks stand in, this
 * run's scenes carry strong hues at 25° (trunks and sand) through 95° (leaf and grass). The pairing
 * rule is that a set of blocks must sit at least 45° away from every hue the scene really holds —
 * otherwise it is scenery, which is what made BlockYard's first blocks read as hay bales. That
 * leaves `[140°, 340°]` and nothing else.
 *
 * ⚠️ **AND THIS IS WHERE COLOUR STOPS BEING A DIFFERENTIATOR, WHICH IS STATED RATHER THAN HIDDEN.**
 * BlockYard already occupies 178 · 214 · 250 · 292 inside that same band, so the widest gaps left
 * are about 20° — the two chapters' blocks WILL look related. What separates them is the layout
 * (tens on the left, the way a number is written) and the verb (MAKE, not regroup), not the palette.
 *
 * ⚠️ **AND THE PAIRING GATE HERE IS STRICTER THAN BlockYard's.** That gate takes a saturation-
 * weighted MEAN of the scene's band — which, on a scene carrying two strong hues, returns a hue that
 * is in neither of them. A forest floor is leaf-green AND trunk-brown; its mean is a colour that is
 * nowhere in the picture. The gate here tests every hue bucket carrying more than 6% of the band.
 */
export const MATERIALS: Material[] = [
  { name: 'jade', hue: 145, grain: false },
  { name: 'teal', hue: 183, grain: true },
  { name: 'sky', hue: 221, grain: false },
  { name: 'indigo', hue: 259, grain: true },
  { name: 'violet', hue: 297, grain: false },
  { name: 'magenta', hue: 335, grain: true },
]
/** The band a material may sit in, given this run's scenes. Exported so the gate checks the RULE
 *  rather than the six numbers above. */
export const HUE_BAND: [number, number] = [140, 340]

// ─── The run ──────────────────────────────────────────────────────────────────────────
/**
 * One flat list covering demo (2) → guided (1) → 10 scored rounds, indexed STRAIGHT and never
 * modulo, so a setting can never wrap back onto the one the chapter opened with.
 *
 * ⚠️ **THESE ARE OPEN-GROUND SCENES, AND GETTING HERE TOOK TWO WRONG ANSWERS.**
 * ① Built indoors first — a "packing bench" — with scenes chosen on hue and quietness, which are
 *    PALETTE checks. Nobody measured where the painted SURFACE actually is. `craft_gems` is a glass
 *    display case topping out at 0.60, so at a flat bench line of 0.70 the blocks and Milo floated
 *    INSIDE the cabinet over the necklaces; the rest were counters and shelves — real surfaces, but
 *    furniture, a pony standing on a bakery worktop.
 * ② Moved outdoors to the FORESTS, which passed the walkable-ground gate — and everything still
 *    floated, in a wall of shrubbery. That gate only asks *is this pixel blue*, and a bush is green.
 *    **The craft doc already records that it cannot tell canopy from grass, and it was pointed at
 *    the one scene family it is documented as unable to judge.**
 *
 * ⚠️ **SO THE CHECK THAT MATTERS IS HORIZONTAL ROUGHNESS, NOT COLOUR.** Open ground is SMOOTH —
 * mean neighbour-to-neighbour difference along a row. Measured in the band where the feet land:
 * `garden_meadow` **1.9**, the four forests **15–21**. Not "the ground is low in the forests"; there
 * is no open ground in them at any height. The gate asserts it now.
 *
 * These four `open_*` scenes were generated for this chapter against exactly that number (0.4–1.9,
 * 100% walkable) because the library's nine open-ground backdrops are **all already BlockYard's** —
 * that is why there were only nine to begin with. `beach_sand` and `fair_sky` were the two free ones
 * that measured open, and they carry the run's variety.
 */
const [JADE, TEAL, SKY, INDIGO, VIOLET, MAGENTA] = [0, 1, 2, 3, 4, 5]
interface Slot { scene: string; mat: number }
const RUN: Slot[] = [
  { scene: 'open_clearing.png', mat: MAGENTA }, { scene: 'open_orchard.png', mat: INDIGO },
  { scene: 'open_river.png', mat: TEAL }, { scene: 'open_hills.png', mat: VIOLET },
  { scene: 'beach_sand.png', mat: SKY }, { scene: 'open_clearing.png', mat: JADE },
  { scene: 'open_river.png', mat: INDIGO }, { scene: 'open_orchard.png', mat: MAGENTA },
  { scene: 'open_hills.png', mat: SKY }, { scene: 'beach_sand.png', mat: VIOLET },
  { scene: 'open_clearing.png', mat: TEAL }, { scene: 'open_river.png', mat: JADE },
  { scene: 'open_orchard.png', mat: MAGENTA },
]
/** The single accessor every scored round goes through. A gate that reads the RUN array cannot see
 *  how the chapter INDEXES it — drive the gate through this, never through the array. */
export const slotAt = (i: number): Slot => RUN[Math.min(i, RUN.length - 1)]
export const DEMO_SLOTS = 2
export const GUIDED_SLOT = DEMO_SLOTS
export const scoredSlot = (round: number) => slotAt(GUIDED_SLOT + 1 + round)
export const matOf = (slot: Slot) => shadesOf(MATERIALS[slot.mat % MATERIALS.length])

// ─── The question ─────────────────────────────────────────────────────────────────────
/**
 * `make` is the main verb and cannot be faked — the answer is where the blocks are put.
 * The other four are read off a yard the child had to BUILD by trading, and **not one of them shows
 * a numeral before the commit**, which is the whole of what was wrong before.
 */
export type QKind = 'make' | 'whole' | 'tens' | 'ones' | 'value'
export interface PvRound { slot: number; n: number; kind: QKind; answer: number; digits: 1 | 2 }


/** Range widens with difficulty, and so does the number of trades a PACK round demands. */
const RANGE: Record<1 | 2 | 3, [number, number]> = { 1: [11, 29], 2: [20, 69], 3: [30, 99] }
/**
 * ⚠️ The pools grow the SKILL, not only the magnitude. `make` stays the majority at every tier
 * because it is the only type that forces the positional decision; `value` — "what are the blocks on
 * the tens shelf worth?" — is the most direct probe of the payload and appears from L2.
 */
export const POOL: Record<1 | 2 | 3, QKind[]> = {
  1: ['make', 'make', 'make', 'whole'],
  2: ['make', 'make', 'make', 'whole', 'tens', 'ones', 'value'],
  3: ['make', 'make', 'make', 'make', 'value', 'value', 'whole', 'tens', 'ones'],
}

export const answerFor = (kind: QKind, n: number) =>
  kind === 'tens' ? Math.floor(n / 10) : kind === 'ones' ? n % 10
  : kind === 'value' ? Math.floor(n / 10) * 10 : n

export function makeRound(d: 1 | 2 | 3, round = 0): PvRound {
  const [lo, hi] = RANGE[d]
  const kind = POOL[d][rint(0, POOL[d].length - 1)]
  let n = 0
  for (let i = 0; i < 200; i++) {
    const c = rint(lo, hi)
    // Both places must hold something, or "which shelf does it go on" is not a question at all —
    // and at MAKE the two digits must differ, so putting them the wrong way round is visibly wrong.
    if (c % 10 < 1) continue
    if (kind === 'make' && Math.floor(c / 10) === c % 10) continue
    n = c; break
  }
  if (!n) n = d === 1 ? 23 : d === 2 ? 46 : 74      // unreachable; never a crash
  return { slot: GUIDED_SLOT + 1 + round, n, kind, answer: answerFor(kind, n), digits: kind === 'tens' || kind === 'ones' ? 1 : 2 }
}

/**
 * How a delivery of `n` loose ones gets packed. Exported so the gate drives the same machine the
 * scene does. The shelf holds ten, so the number of trades is fixed by `n` alone — which is the
 * point: **you cannot leave ten in the ones place.**
 */
export function bundlePlan(n: number) {
  const trades = Math.floor(n / 10)
  const rest = n % 10
  return { trades, rest, firstWave: Math.min(10, n), waiting: Math.max(0, n - 10) }
}

// ─── The ground ────────────────────────────────────────────────────────────────────────
/** Moved to [yard.tsx](./yard.tsx) once CoinShop needed the same floor, and RE-EXPORTED here so
 *  [placeValueBundle.test.ts](../../../__tests__/placeValueBundle.test.ts) is untouched — which is
 *  what makes its unchanged run the proof that the move changed nothing. */
export { GROUND, groundOf }

/** THE TENS SHELF — on the LEFT, because that is where the tens digit is written. */
export const RACK_X0 = 14, RACK_COL = 3.3
export const rackSpot = (i: number) => ({ x: RACK_X0 + i * RACK_COL })
export const MILO_X = 52
/** THE ONES SHELF — on the RIGHT. It can hold ten, and only for as long as it takes to trade them. */
export const BAY_X0 = 62, BAY_COL = 3.2
export const baySpot = (i: number) => ({
  x: BAY_X0 + i * BAY_COL,
  tilt: (seeded(i, 8.233) - 0.5) * 3.4,          // stacked by hand, not by a machine
  lift: seeded(i, 12.9898) * 0.6,                // and never downward: the ground is a floor
})
/**
 * ⚠️ THE WAITING ONES MUST READ AS SOMEWHERE ELSE, NOT AS MORE OF THE SHELF. Ten placed and four
 * waiting, at one size on one baseline, read as ONE row of fourteen — and the argument the chapter
 * turns on (*ten fit, the eleventh does not*) goes with it. So they wait in the chute ABOVE the
 * shelf: higher, smaller, and heaped rather than stacked.
 */
export const QUEUE_PER_ROW = 4, QUEUE_SCALE = 0.8
/**
 * ⚠️ **HOW MANY WAITING ONES THE CHUTE MAY SHOW AT ONCE — CAUGHT ON SCREEN.** A delivery of 29 put
 * NINETEEN cubes in the chute: they sprawled across the ones shelf and off the right edge, and the
 * "somewhere else" reading that the whole regrouping argument depends on went with them. The child
 * never counts the pile — they read the answer off the SHELVES — so the chute only has to say
 * *there is more coming*. Two rows is enough to say it.
 */
export const CHUTE_MAX = QUEUE_PER_ROW * 2
/** How many the chute actually draws. ⚠️ A FUNCTION, not a `Math.min` at the call site: the first
 *  gate re-implemented the cap instead of driving it, so removing the cap from the scene passed. */
export const chuteShown = (waiting: number) => Math.min(waiting, CHUTE_MAX)
export const queueOf = (j: number) => {
  const col = j % QUEUE_PER_ROW, row = Math.floor(j / QUEUE_PER_ROW)
  return {
    x: 88 - col * 2.8 + row * 1.2,
    tilt: (seeded(j, 5.71) - 0.5) * 7,
    lift: 4.2 + row * 3.6 + seeded(j, 2.13) * 0.8,
    scale: QUEUE_SCALE,
  }
}
/** Deliveries come from off-frame RIGHT; rods called up for a MAKE come from off-frame LEFT, each
 *  from the side of the room its shelf is on. Both are the mirror of BlockYard's single lane. */
export const ENTER_RIGHT = 112, ENTER_LEFT = -12

const CHROME_PX = 46
/** The vertical room a standing rod has. ⚠️ On a short frame the banner moves aside rather than
 *  shrinking — over the ONES shelf, where everything is one cube tall — so the tens shelf keeps the
 *  full drop and the unit does not have to collapse. Buy height from the chrome, never the prose. */
export const rodBudget = (vh: number) => groundOf(vh) * vh - (vh < 470 ? CHROME_PX : 84) - 8
/** A cube is capped narrower than the column it stands in, so a shelf of ten never touches. */
export const roomUnit = (vw: number, vh: number) => unitFor(vw, vh, rodBudget(vh), 2.6)

// ─── The scene ────────────────────────────────────────────────────────────────────────
interface Room {
  rods: number
  bay: number                // loose cubes on the ones shelf
  settled: number            // how many of `bay` were already there — the rest travel in
  waiting: number
  from: 'right' | 'left' | 'none'
  fusing: boolean
  carry: 0 | 1 | 2           // Milo: idle · walking the rod to the shelf · walking back
  carried: boolean
  key: string
}
const EMPTY: Room = { rods: 0, bay: 0, settled: 0, waiting: 0, from: 'none', fusing: false, carry: 0, carried: false, key: 'a' }

/** A rod travelling to the tens shelf under its own steam (a MAKE placement), rather than settling
 *  in. The child asked for it, so it arrives. */
function TravellingRod({ w, h, m, x, ground, dist, ms, resetKey, z }: {
  w: number; h: number; m: Shades; x: number; ground: number
  dist: number; ms: number; resetKey: string; z: number
}) {
  return (
    <div style={{ position: 'fixed', left: `${x}%`, top: `${ground * 100}%`,
      transform: 'translate(-50%,-100%)', zIndex: z, pointerEvents: 'none' }}>
      <Arrive dist={dist} ms={ms} resetKey={resetKey}>
        {() => <Rod w={w} h={h} m={m} />}
      </Arrive>
    </div>
  )
}

function Scene({ r, m, cube, rodW, rodH, miloH, vw, vh, onBay, onRod, hint }: {
  r: Room; m: Shades; cube: number; rodW: number; rodH: number; miloH: number; vw: number; vh: number
  onBay?: () => void; onRod?: (i: number) => void; hint?: boolean
}) {
  const ground = groundOf(vh)
  const miloW = Math.round(miloH * aspectOf(MILO))
  // He carries LEFTWARD, from the ones shelf to the tens shelf — the direction a ten travels when
  // it is made. In BlockYard he walks the other way, which is the same job in a mirrored room.
  const carryDist = ((RACK_X0 - 1 - MILO_X) / 100) * vw
  const carryJ = inFlowJourney(MILO, miloH, carryDist)
  const leg = (fromX: number, toX: number) => {
    const dist = ((fromX - toX) / 100) * vw
    // A block has no gait, so `inFlowJourney` falls back to CARRY_SPEED — travel and cycle are
    // separate concerns, and an object simply has no legs to run while it moves.
    return { dist, ms: inFlowJourney('', cube, dist).ms }
  }
  // While they fuse the shelf closes up into a touching line — you watch ten become one length.
  const cubePct = (cube / Math.max(1, vw)) * 100
  const bayX = (i: number) => (r.fusing ? BAY_X0 + i * cubePct : baySpot(i).x)

  return (
    <>
      {/* THE TENS SHELF — left, and the only thing that persists across the whole round */}
      {Array.from({ length: r.rods }).map((_, i) => {
        const s = rackSpot(i)
        const tappable = !!onRod
        const j = leg(ENTER_LEFT, s.x)
        return r.from === 'left' && i === r.rods - 1 ? (
          <TravellingRod key={`nr${i}-${r.key}`} w={rodW} h={rodH} m={m} x={s.x} ground={ground}
            dist={j.dist} ms={j.ms} resetKey={`${r.key}-r${i}`} z={12} />
        ) : (
          <button key={`rod${i}`} onClick={tappable ? () => onRod!(i) : undefined} disabled={!tappable}
            aria-label="a ten on the tens side" style={{
              position: 'fixed', left: `${s.x}%`, top: `${ground * 100}%`,
              transform: 'translate(-50%,-100%)', zIndex: 12,
              border: 'none', background: 'none', padding: 0, cursor: tappable ? 'pointer' : 'default',
            }}>
            <Rod w={rodW} h={rodH} m={m} delayMs={i * 80} />
          </button>
        )
      })}

      {/* THE ONES SHELF — right */}
      {Array.from({ length: r.bay }).map((_, i) => {
        const s = baySpot(i)
        const fromX = r.from === 'right' ? ENTER_RIGHT : s.x
        const j = leg(fromX, s.x)
        return <Travelling key={`c${i}-${r.key}`} s={cube} m={m} x={bayX(i)} lift={s.lift}
          tilt={r.fusing ? 0 : s.tilt} ground={ground}
          dist={j.dist} ms={i < r.settled ? 0 : j.ms}
          delayMs={Math.max(0, i - r.settled) * 110} resetKey={`${r.key}-${i}`}
          z={20 + i} fusing={r.fusing} />
      })}

      {/* those that could not be placed — visibly waiting, which is the whole argument */}
      {Array.from({ length: chuteShown(r.waiting) }).map((_, i) => {
        const s = queueOf(i)
        const j = leg(ENTER_RIGHT, s.x)
        return <Travelling key={`w${i}-${r.key}`} s={Math.round(cube * s.scale)} m={m} x={s.x}
          lift={s.lift} tilt={s.tilt} ground={ground}
          dist={j.dist} ms={j.ms} delayMs={i * 110} resetKey={`${r.key}-w${i}`} z={16 - i} />
      })}

      {/* MILO — he carries every finished ten across to its shelf. The rod rides INSIDE his
          travelling element, because two things that must move as one have to BE one element. */}
      <div style={{ position: 'fixed', left: `${MILO_X}%`, top: `${ground * 100}%`,
        transform: 'translate(-50%,-100%)', zIndex: 30, pointerEvents: 'none' }}>
        <span style={{ display: 'block', position: 'relative',
          transform: `translateX(${r.carry === 1 ? Math.round(carryDist) : 0}px)`,
          transition: r.carry ? `transform ${carryJ.ms}ms linear` : 'none' }}>
          {r.carried && (
            <span style={{ position: 'absolute', left: Math.round(rodW * 1.2), bottom: 0, zIndex: 2 }}>
              <Rod w={rodW} h={rodH} m={m} />
            </span>
          )}
          <span style={{ display: 'block', position: 'relative', width: miloW, height: miloH }}>
            <Shadow w={Math.round(miloW * 0.66)} h={Math.round(miloH * 0.1)} />
            <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
              <SheetCell src={MILO} h={miloH} moving={r.carry !== 0} facesLeft={r.carry === 1}
                breathe cycleScale={carryJ.cycleScale} />
            </span>
          </span>
        </span>
      </div>

      {/* the full shelf of ten is the tap target */}
      {onBay && (
        <button onClick={onBay} aria-label="trade ten ones for one ten" style={{
          position: 'fixed', left: `${BAY_X0 - 2.4}%`, width: `${9 * BAY_COL + 5}%`,
          top: `${ground * 100 + 2}%`, transform: 'translateY(-100%)',
          height: Math.round(cube * 1.9), zIndex: 34,
          border: 'none', background: 'none', cursor: 'pointer',
          animation: hint ? 'by_nudge 1.5s ease-in-out infinite' : undefined,
        }} />
      )}
    </>
  )
}

/** The two ground patches. ⚠️ Posts and a tint that fades at its own edges — NOT a filled rectangle
 *  with a stroke, which is the slab that got rejected three times: a painted scene contains no
 *  filled rectangles, so one reads as UI furniture however well its palette is matched. */
function GroundPatch({ x0, w, label, ground, cube, vh }: {
  x0: number; w: number; label: string; ground: number; cube: number; vh: number
}) {
  return (
    <div aria-hidden style={{ position: 'fixed', left: `${x0}%`, width: `${w}%`,
      top: `${ground * 100}%`, transform: 'translateY(-100%)', zIndex: 4, pointerEvents: 'none' }}>
      <div style={{ height: Math.round(cube * 0.5),
        background: 'linear-gradient(90deg, rgba(78,58,38,0) 0%, rgba(78,58,38,.17) 12%, rgba(78,58,38,.17) 88%, rgba(78,58,38,0) 100%)',
        borderRadius: 99 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', paddingTop: 4,
        textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 900,
        fontSize: `clamp(10px, ${Math.round(vh * 0.024)}px, 15px)`, letterSpacing: 1.2,
        color: 'rgba(72,52,34,.62)' }}>{label}</div>
    </div>
  )
}

// ─── The round ────────────────────────────────────────────────────────────────────────
type Mode = 'demo' | 'guided' | 'practice'

const PvRoundView: React.FC<{ slot: Slot; data: PvRound; mode: Mode; onComplete: (c: boolean) => void }> =
({ slot, data, mode, onComplete }) => {
  const { n, kind, answer, digits: windows } = data
  const { w: vw, h: vh } = useViewport()
  const { cube, rodW, rodH, miloH } = roomUnit(vw, vh)
  const m = useMemo(() => matOf(slot), [slot])
  const plan = useMemo(() => bundlePlan(n), [n])
  const isMake = kind === 'make'

  const [r, setR] = useState<Room>(EMPTY)
  const [digits, setDigits] = useState<number[]>([])
  const [live, setLive] = useState(false)
  const [note, setNote] = useState('')
  const [ok, setOk] = useState(false)
  const erred = useRef(false), done = useRef(false)
  const timers = useRef<number[]>([])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])
  const say = useCallback((s: string) => { setNote(s); speak(s) }, [])

  // ⚠️ Derived from the count rather than announced by the tap that caused it — the tap handler
  // cannot see the new value, and a batched pair of taps would announce the wrong one.
  useEffect(() => {
    if (isMake && r.bay === 10 && !ok) say('Ten ones on the ground — you cannot leave ten there. Trade them up.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.bay])

  const carryMs = useMemo(() => inFlowJourney(MILO, miloH, ((RACK_X0 - 1 - MILO_X) / 100) * vw).ms, [miloH, vw])
  const inMs = useMemo(() => inFlowJourney('', cube, ((ENTER_RIGHT - BAY_X0) / 100) * vw).ms + 9 * 110, [cube, vw])

  useEffect(() => {
    setR(EMPTY); setDigits([]); setNote(''); setOk(false); setLive(false)
    if (isMake) {
      after(400, () => { setLive(true); say(askFor(data)) })
      return
    }
    after(400, () => {
      setR(s => ({ ...s, bay: plan.firstWave, settled: 0, waiting: plan.waiting, from: 'right', key: 'b' }))
      after(inMs, () => {
        if (plan.firstWave === 10) { say('Ten ones on the ground — that is one ten. Tap them.') }
        else { setLive(true); say(askFor(data)) }
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, kind])

  /** TRADE UP — the ten slide together, become one rod, and Milo walks it across to the tens shelf. */
  function trade() {
    if (r.bay < 10 || r.fusing) return
    setR(s => ({ ...s, fusing: true }))
    after(520, () => setR(s => ({ ...s, fusing: false, bay: 0, settled: 0, carried: true, carry: 1 })))
    after(520 + carryMs, () => setR(s => {
      const wave = Math.min(10, s.waiting)
      return { ...s, carried: false, rods: s.rods + 1, carry: 2,
        bay: wave, settled: 0, waiting: s.waiting - wave, from: wave ? 'right' : 'none', key: `t${s.rods}` }
    }))
    after(520 + carryMs * 2, () => setR(s => {
      const more = s.bay === 10
      if (!more && !isMake) { setLive(true); say(ASK[kind]) }
      else if (more) say('Ten again — trade them up.')
      else say('Ten ones make ONE ten. It goes on the left shelf.')
      return { ...s, carry: 0 }
    }))
  }

  // ── MAKE: call for a block, or send one back ──
  /**
   * ⚠️ **EVERY ONE OF THESE READS THE ROOM INSIDE THE UPDATER, NEVER FROM THE RENDER'S CLOSURE.**
   * The first version kept a separate stack of what had been placed and popped it on undo — and
   * three "back" taps inside one React batch all read the SAME stale stack, so all three removed a
   * one and the tens were left behind: the stack and the room silently desynced. A child who
   * double-taps hits exactly that. So there is no second copy of the state to fall out of step —
   * the undo is DERIVED from what is on the shelves, which is also the only thing the child can see.
   * Ones come off first, then tens, so it is predictable without remembering an order.
   */
  function callRod() {
    if (!live || ok) return
    setR(s => ({ ...s, rods: s.rods + 1, from: 'left', key: `r${s.rods}` }))
  }
  function callOne() {
    if (!live || ok) return
    setR(s => (s.bay >= 10 ? s : { ...s, bay: s.bay + 1, settled: s.bay, from: 'right', key: s.key }))
  }
  /** Available at EVERY count — one that appears only when the set is wrong is a verdict handed
   *  over before the commit. */
  function sendBack() {
    if (!live || ok) return
    setR(s => s.bay > 0 ? { ...s, bay: s.bay - 1, settled: s.bay - 1, from: 'none' }
      : s.rods > 0 ? { ...s, rods: s.rods - 1, from: 'none' } : s)
  }

  function finish(correct: boolean) {
    done.current = true; setOk(true); setLive(false)
    after(1800, () => onComplete(mode === 'practice' ? !erred.current && correct : true))
  }

  function commitMake() {
    if (done.current || !live) return
    const built = r.rods * 10 + r.bay
    if (built === n) {
      setNote(`${Math.floor(n / 10)} tens and ${n % 10} ones make ${n}`)
      speak(`Yes! ${numberToWords(Math.floor(n / 10))} tens and ${numberToWords(n % 10)} ones make ${numberToWords(n)}.`)
      finish(true)
      return
    }
    erred.current = true
    // ⚠️ THE LESSON, DELIVERED WHERE IT BITES. Same two digits, wrong shelves — so name the number
    // they actually made. This is the one moment the chapter can say what place value IS.
    if (r.rods === n % 10 && r.bay === Math.floor(n / 10)) {
      say(`That is ${numberToWords(built)}, not ${numberToWords(n)}. The tens side is on the left — look which one holds ${numberToWords(Math.floor(n / 10))}.`)
    } else {
      say(`Not yet — that is ${numberToWords(built)}. Count the tens, then the ones.`)
    }
  }

  function commitPad() {
    if (done.current || digits.length < windows) return
    const v = digits.reduce((p, c) => p * 10 + c, 0)
    if (v === answer) {
      setNote(SOLVED[kind](n))
      speak(`Yes! ${SOLVED[kind](n)}`)
      finish(true)
    } else {
      erred.current = true
      say(RETRY[kind])
      after(1200, () => setDigits([]))
    }
  }

  const band = PAD_BAND(vh)
  const ground = groundOf(vh)
  return (
    <>
      {/* the target rides INSIDE the question pill — see `lead` in yard.tsx */}
      <Banner text={note || askFor(data)} vh={vh} ok={ok}
        side="right" lead={isMake && !ok ? n : undefined} />
      <GroundPatch x0={RACK_X0 - 2.4} w={9 * RACK_COL + 5} label="TENS" ground={ground} cube={cube} vh={vh} />
      <GroundPatch x0={BAY_X0 - 2.4} w={9 * BAY_COL + 5} label="ONES" ground={ground} cube={cube} vh={vh} />
      <Scene r={r} m={m} cube={cube} rodW={rodW} rodH={rodH} miloH={miloH} vw={vw} vh={vh}
        hint={r.bay === 10} onBay={r.bay === 10 && !ok ? trade : undefined} />

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: Math.round(vh * 0.02), zIndex: 36,
        display: 'flex', justifyContent: 'center' }}>
        {isMake
          ? <MakeControls m={m} cube={cube} band={band} vw={vw} live={live && !ok} canUndo={r.rods + r.bay > 0}
              onRod={callRod} onOne={callOne} onBack={sendBack} onDone={commitMake} />
          : <AnswerPad digits={digits} band={band} live={live && !ok} windows={windows}
              onDigit={d => setDigits(x => (x.length >= windows ? x : [...x, d]))}
              onClear={() => setDigits(x => x.slice(0, -1))} onDone={commitPad} />}
      </div>
    </>
  )
}

/**
 * The unit the supply trays are drawn to. ⚠️ **BOTH TRAYS SHARE IT, AND THAT IS THE WHOLE POINT.**
 * A ten and a one sitting side by side is the most direct comparison the chapter ever offers, so if
 * they are not drawn to one unit the tray is lying — which is exactly what the first version did,
 * showing a "ten" 2.4 cubes long beside a one-cube. Laid flat, ten units fit a control band.
 */
export const trayUnit = (band: number, cube: number, vw: number) =>
  blockSet(Math.max(8, Math.round(Math.min(cube, band / 4.6, vw * 0.017))))

/** MAKE's answering surface: call for a ten, call for a one, send the last one back, commit. */
function MakeControls({ m, cube, band, vw, live, canUndo, onRod, onOne, onBack, onDone }: {
  m: Shades; cube: number; band: number; vw: number; live: boolean; canUndo: boolean
  onRod: () => void; onOne: () => void; onBack: () => void; onDone: () => void
}) {
  const w = Math.max(30, Math.min(58, Math.floor((band - 10) / 1.9)))
  // ⚠️ Both trays are drawn from ONE derived set — there is no multiplier here to get wrong.
  const t = trayUnit(band, cube, vw)
  const tray = (label: string, onClick: () => void, child: React.ReactNode): React.ReactNode => (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      gap: 3, height: w * 1.5, padding: '4px 12px 6px',
      borderRadius: w * 0.24, border: '3px solid var(--outline)', background: 'var(--paper)',
      cursor: 'pointer',
    }}>
      <span style={{ display: 'flex', alignItems: 'flex-end', height: w * 0.85 }}>{child}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: w * 0.26,
        letterSpacing: 0.8, color: 'var(--ink-muted)' }}>{label}</span>
    </button>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: w * 0.3,
      pointerEvents: live ? 'auto' : 'none', opacity: live ? 1 : .3, transition: 'opacity .3s ease' }}>
      {tray('A TEN', onRod, <Rod axis="h" w={t.rodW} h={t.rodH} m={m} />)}
      {tray('A ONE', onOne, <Cube s={t.cube} m={m} />)}
      <button onClick={onBack} disabled={!canUndo} style={{
        height: w * 0.95, padding: `0 ${w * 0.42}px`, borderRadius: w * 0.48,
        border: '3px solid var(--outline)', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: w * 0.3,
        opacity: canUndo ? 1 : .45, cursor: canUndo ? 'pointer' : 'default',
      }}>↩ back</button>
      {/* Identical at every count — nothing may say the set is right before the commit. */}
      <button onClick={onDone} style={{
        height: w * 1.15, padding: `0 ${w * 0.66}px`, borderRadius: w * 0.58, border: 'none',
        background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: w * 0.36,
        boxShadow: '0 4px 0 rgba(180,70,20,.45)', cursor: 'pointer',
      }}>Done ✓</button>
    </div>
  )
}

// Everything spoken is also written — Chrome often has no voice, and a response that exists only as
// speech is silence.
export const ASK: Record<Exclude<QKind, 'make'>, string> = {
  whole: 'How many altogether?',
  tens: 'How many on the TENS side?',
  ones: 'How many on the ONES side?',
  value: 'The TENS side — how much is it worth?',
}

/**
 * The question this chapter draws on its own banner AND speaks. SkillBeat's pill stays empty here on
 * purpose (two pills saying the same thing is a duplicate), so this is the ONLY place the sentence
 * exists — and exporting it is what lets a gate read it at all.
 *
 * ⚠️ THE `make` LINE IS BUILT HERE, NOT IN THE ROUND'S EFFECT, AND THAT IS THE POINT. It used to be
 * written inline as `say(\`Make ${numberToWords(n)}. Tens on the left, ones on the right.\`)` while
 * `ASK.make` said "Make the number on the order" — so the string a gate could reach was NOT the
 * string a child reads, and `ASK.make` was dead text nothing ever showed (the note overrides the
 * banner 400 ms in). Caught by driving the chapter on screen after the gate was already green.
 *
 * This is CoinShop's `openerFor` rule, which says it best: ONE renderer, because it is both spoken
 * and written, "and those two drifting apart is how a chapter narrates one thing while the screen
 * says another".
 */
export const askFor = (d: PvRound): string =>
  d.kind === 'make'
    ? `Make ${numberToWords(d.n)}. Tens on the left, ones on the right.`
    : ASK[d.kind]
const SOLVED: Record<QKind, (n: number) => string> = {
  make: n => `${n}`,
  whole: n => `${Math.floor(n / 10)} tens and ${n % 10} ones make ${n}`,
  tens: n => `${Math.floor(n / 10)} tens — worth ${Math.floor(n / 10) * 10}`,
  ones: n => `${n % 10} ones`,
  value: n => `${Math.floor(n / 10)} tens are worth ${Math.floor(n / 10) * 10}`,
}
const RETRY: Record<QKind, string> = {
  make: 'Not yet. Count the tens, then the ones.',
  whole: 'Not that one. Count the tens side, then the ones side.',
  tens: 'Not that one. Count the tens on the left.',
  ones: 'Not that one. Count the loose ones on the right.',
  value: 'Not that one. Each one of those is worth ten — count them in tens.',
}

// ─── Demo / re-teach ──────────────────────────────────────────────────────────────────
/**
 * ⚠️ **THE SWAP IS THE WHOLE LESSON AND IT LIVES HERE, WHERE IT COSTS NOTHING.** Milo makes 34, then
 * makes 43 — the SAME two digits — and the tens shelf is visibly fuller the second time. That is the
 * one picture that says a digit's value comes from its place, and no amount of counting rods says it.
 */
const PvExplain: React.FC<{ slot: Slot; data: PvRound; onDone: () => void }> = ({ slot, data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const { cube, rodW, rodH, miloH } = roomUnit(vw, vh)
  const m = useMemo(() => matOf(slot), [slot])
  const [r, setR] = useState<Room>(EMPTY)
  const [line, setLine] = useState('')
  const [order, setOrder] = useState<number | null>(null)
  const doneRef = useLatestRef(onDone)
  const a = data.n, b = (a % 10) * 10 + Math.floor(a / 10)      // the same digits, the other way round

  useEffect(() => {
    const set = (p: Partial<Room>) => setR(s => ({ ...s, ...p }))
    const late: number[] = []
    const soon = (ms: number, fn: () => void) => late.push(window.setTimeout(fn, ms))
    const [aT, aO, bT, bO] = [Math.floor(a / 10), a % 10, Math.floor(b / 10), b % 10]
    const lines = [
      `The order says ${numberToWords(a)}. Milo builds it.`,
      `${numberToWords(aT)} tens go on the LEFT.`,
      `${numberToWords(aO)} ones go on the RIGHT. That is ${numberToWords(a)}.`,
      `Now the order says ${numberToWords(b)} — the same two digits, the other way round.`,
      `${numberToWords(bT)} tens, and ${numberToWords(bO)} ones. Look how much bigger the tens side is.`,
      `Same digits, different sides, a different number. That is what the places mean.`,
    ]
    const steps: Array<() => void> = [
      () => { setOrder(a); set({ ...EMPTY }) },
      () => set({ rods: aT, from: 'left', key: 'a1' }),
      () => set({ bay: aO, settled: 0, from: 'right', key: 'a2' }),
      () => { setOrder(b); set({ ...EMPTY, key: 'b0' }) },
      () => { set({ rods: bT, from: 'left', key: 'b1' }); soon(700, () => set({ bay: bO, settled: 0, from: 'right', key: 'b2' })) },
      () => {},
    ]
    const cancel = speakSteps(lines, {
      onStep: i => { steps[i]?.(); setLine(lines[i] ?? '') },
      onDone: () => soon(1500, () => doneRef.current()),
      rate: 0.85, gapMs: 700, fallbackStepMs: 2800,
    })
    return () => { cancel?.(); late.forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a])

  const ground = groundOf(vh)
  return (
    <>
      <Banner text={line || 'Watch Milo fill the order…'} vh={vh} side="right" lead={order ?? undefined} />
      <GroundPatch x0={RACK_X0 - 2.4} w={9 * RACK_COL + 5} label="TENS" ground={ground} cube={cube} vh={vh} />
      <GroundPatch x0={BAY_X0 - 2.4} w={9 * BAY_COL + 5} label="ONES" ground={ground} cube={cube} vh={vh} />
      <Scene r={r} m={m} cube={cube} rodW={rodW} rodH={rodH} miloH={miloH} vw={vw} vh={vh} />
    </>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
export const BEAT: Beat<PvRound> = {
  skillId: 'placeValue', rounds: 10, walkEvery: 3,
  make: (d, round = 0) => makeRound((d || 1) as 1 | 2 | 3, round),
  sig: d => `${d.n}${d.kind}`,
  // SkillBeat renders nothing for an empty prompt — this chapter's own banner owns the pill, and it
  // must never restate the question as a number.
  prompt: () => '',
  Play: ({ data, onSubmit }) => <PvRoundView slot={slotAt(data.slot)} data={data} mode="practice" onComplete={onSubmit} />,
  Reteach: ({ data, onDone }) => <PvExplain slot={slotAt(data.slot)} data={data} onDone={onDone} />,
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function BuildingBlocks({ onFinish, onExit }: {
  /** kept so old `?world=` links do not 404 — there is no picker any more */
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useChapterPhase<Phase>('intro', { chapter: 'placeValue', phase: 'practice' })
  const [demoIdx, setDemoIdx] = useState(0)
  const [slotIdx, setSlotIdx] = useState(0)
  const [shipped, setShipped] = useState(0)
  const { h: vh } = useViewport()
  const { exit, tally } = useChapterShell(onFinish, onExit)
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])

  // Both teaching examples are a digit-swap pair — see PvExplain.
  const DEMO: PvRound[] = useMemo(() => [
    { slot: 0, n: 34, kind: 'make', answer: 34, digits: 2 },
    { slot: 1, n: 52, kind: 'make', answer: 52, digits: 2 },
  ], [])
  const GUIDED: PvRound = useMemo(() => ({ slot: GUIDED_SLOT, n: 23, kind: 'make', answer: 23, digits: 2 }), [])

  // Every hook is above this line — an early return that changes the hook count tears the chapter
  // into the error boundary the moment the phone is turned.
  if (needsRotate) return <RotateGate line="Turn your phone sideways to help Milo fill the orders!" />

  const active = phase === 'practice' ? slotIdx : phase === 'guided' ? GUIDED_SLOT : DEMO[Math.min(demoIdx, DEMO.length - 1)].slot

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#dfe7d4' }}>
      <style>{CRITTER_CSS}{YARD_CSS}</style>

      {RUN.map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === active ? 1 : 0, transition: 'opacity .6s ease' }}>
          <SceneBg src={BG(s.scene)} priority={i === active} />
        </div>
      ))}

      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
        {/* The cumulative arc, OUTSIDE SkillBeat — anything drawn inside a round resets every round. */}
        {shipped > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,252,244,.86)', border: '2px solid var(--outline)', borderRadius: 999, padding: '4px 12px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--ink-muted)' }}>numbers made</span>
            {Array.from({ length: Math.min(shipped, 10) }).map((_, i) => (
              // each tally mark keeps the colour of the round it came from, so the strip reads back
              // as the run the child actually walked rather than a row of identical ticks
              <span key={i} style={{ width: 7, height: 16, borderRadius: 2,
                background: matOf(scoredSlot(i)).face,
                boxShadow: `inset 0 2px 0 ${matOf(scoredSlot(i)).top}, inset 0 -2px 0 rgba(60,44,28,.25)` }} />
            ))}
          </div>
        )}
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ maxWidth: '74%', background: 'rgba(255,252,244,.94)', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: `clamp(14px, ${Math.round(vh * 0.034)}px, 20px)`, color: 'var(--ink)', textAlign: 'center' }}>
            Milo stacks what he gathers. TENS go on the LEFT, ONES on the RIGHT — just the way a
            number is written. Watch him fill two orders first!
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>
            Let&apos;s go! ▶
          </button>
        </div>
      )}

      {phase === 'demo' && (
        <PvExplain key={`demo${demoIdx}`} slot={slotAt(active)} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <PvRoundView key="guided" slot={slotAt(active)} data={GUIDED} mode="guided"
          onComplete={() => { setSlotIdx(GUIDED_SLOT + 1); setPhase('practice') }} />
      )}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={BEAT} onInterlude={interlude}
            onRound={(data) => { if (typeof data?.slot === 'number') { setSlotIdx(data.slot); setShipped(s => s + 1) } }}
            onComplete={tally} />
        </div>
      )}
    </div>
  )
}
