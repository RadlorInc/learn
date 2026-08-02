'use client'
/**
 * Chapter 5 — comparing quantities (skill `numberComparison`), as BIGGER OR SMALLER.
 *
 * Two bunches of little ones are waiting on the meadow, the reef or the sky. Milo asks which bunch
 * has MORE (or FEWER, or at the top tier which has the MOST of three). Tap that bunch and it really
 * walks off with him, drawn cycles running the whole way; the other bunch stays behind, which makes
 * the point one last time — he took the bigger one.
 *
 * WHY THIS AND NOT MILO'S KITCHEN, WHICH IT REPLACES: there the child compared bowls, trays and jars
 * of fruit — inanimate vessels holding static sprites, with a CSS-gradient bowl drawn beside painted
 * art when the PNG was missing. Nothing was alive before a tap, a tap caused no journey, and the
 * countable things were dead props. Creatures fix all of it at once: already painted in the app's
 * style, already carrying drawn walk cycles, already alive before anything is tapped.
 *
 * ── THE SHORTCUT, AND WHY IT IS NOT "FIXED" AT THE LOWER TIERS ────────────────────────────────
 * A child can answer a quantity comparison by seeing which bunch is WIDER rather than by counting,
 * and it was tempting to defeat that with adversarial spacing — pack the bigger bunch tight and
 * spread the smaller one out, so only counting wins. That is deliberately NOT done here. It is the
 * Piagetian conservation task, it belongs a year or two later, and K.CC.C.6 explicitly allows
 * "matching and counting strategies" — comparing perceptually IS the expected entry strategy at
 * Pre-K/K. Rigging the picture against a three-year-old's honest first strategy would be punishing
 * them for being three.
 *
 * The real progression to "you cannot just look" is the TIER-3 NUMERAL ROUND: two little ones each
 * wearing a painted number, no objects to count at all. That is K.CC.C.7, it is un-shortcuttable by
 * construction rather than by trickery, and it is the same creatures-wear-numbers idiom chapter 2
 * already taught. Concrete first, symbolic when they are ready.
 *
 * Deliberately not covered: the "same" case. Every round has a strictly bigger side, because an
 * equal pair needs a third answer the tap-a-bunch mechanic has nowhere to put. Worth revisiting.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { speak, speakSteps, stopSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import type { Difficulty } from '@/core/adaptive'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import {
  type Habitat, type Spot, HABITATS, CAST, kindAt, homeOf, aspectOf,
  Background, Critter, CRITTER_CSS, huddleRows, leadX, fitBands,
  LEAD_X as MILO_X, LEAD_SCALE as MILO_SCALE, STRIP_PX,
  groundSpeed, TRAVEL_MIN, seeded, maxSizeForRows, spreadBand, BAND_JITTER,
} from './critters'
import { rint } from '@/core/rand'

// Same reasoning as chapters 4 and 9: long enough to swallow a double-tap, and deliberately NOT
// tied to Milo's voice, which stays "speaking" for over 3.2s after a single word.
const TAP_LOCK_MS = 260
const MARCH_MS = 3200
const HOLD_MS = 900
const OFF_RIGHT = 124
const OPENING_MS = 700          // let both bunches be seen before the markers go live

const MILO_LAND = '/assets/characters/milo_side.png'
const MILO_REEF = '/assets/characters/milo_underwater.png'
const JOURNEY = { from: '🐾', to: '⚖️' }

/**
 * NINE on screen, where the addition chapter holds ten — and the one fewer is not arbitrary. This
 * chapter spends real width on the gap that separates the bunches, so at 640×320 the widest creature
 * (a shark, 1.75 : 1) has its per-creature slot squeezed until the 40px legibility floor takes over
 * and the sprites overlap by a pixel. The count that fits is the count that fits; nine is it.
 * Shared across BOTH bunches, because both have to be countable at the same time.
 */
const MAX_ON_SCREEN = 9

export const BANDS: Record<Habitat['move'], { lead: number; play: [number, number] }> = {
  land: { lead: 92, play: [80, 92] },
  swim: { lead: 76, play: [58, 76] },
  air: { lead: 88, play: [56, 72] },
}
const bandsFor = (w: Habitat): Habitat => {
  const b = BANDS[w.move]
  return { ...w, lineY: b.play[0] - 4, waitY0: b.play[0], waitY1: b.play[1] }
}

// ─── Where each bunch stands ─────────────────────────────────────────────────────────
/**
 * Bunches are laid out with a CONSTANT step between neighbours and a wider gap between bunches, so
 * two things hold at once: every bunch reads as one group, and every creature is equally countable
 * whichever bunch it is in — a member of the small bunch must be exactly as easy to count as a
 * member of the big one, or the comparison is measuring legibility instead of number.
 *
 * How much wider the gap BETWEEN bunches is than the spacing WITHIN one, measured against the
 * same-row spacing rather than the raw step.
 *
 * This is the number that decides whether the picture shows two bunches or one long line, and the
 * obvious version of it is wrong. Members alternate rows, so two neighbours in the SAME row sit
 * `step × rows` apart — at rows = 2 that is 2·step. A gap of 2.2·step therefore separates the
 * bunches by barely a tenth more than the creatures inside a bunch are already separated from each
 * other, and the grouping the whole chapter rests on simply dissolves. The gap has to beat the
 * same-row spacing, not the step.
 */
/**
 * TWO ROWS, NEVER THREE — and this is a countability rule, not a style choice.
 *
 * The shared `huddleRows` will happily return 3, and for chapters 2 and 4 that is right: a third row
 * buys horizontal room, and the cross-row overlap reads as a huddle because those sets are counted
 * out one deliberate tap at a time. Here the set is counted in ONE LOOK, and rows only buy anything
 * if they are visually separable. Measured on the reef at 640×320: the play band is ~58px tall, so
 * three rows sit ~29px apart against an 83px sprite — they are not rows, they are a pile, and the
 * fish buried each other. Two rows put the full band between them (~0.7 of a sprite height), which
 * reads as two rows and stays countable.
 */
export const MAX_ROWS = 2
export const GROUP_GAP_K = 1.7
export const PLAY_RIGHT = 74

/** `gapK` is in units of the STEP, so callers pass GROUP_GAP_K × rows. */
export function groupGeom(counts: number[], edgePct: number, rightPct = PLAY_RIGHT, gapK = GROUP_GAP_K * 2) {
  const left = Math.max(13, edgePct + 1)
  const right = Math.max(left + 1, rightPct)
  const N = counts.reduce((s, n) => s + n, 0), k = counts.length
  // width = step·Σ(nᵢ−1) + gap·(k−1), with gap = gapK·step → solve for step.
  const units = Math.max(0.001, N - k + gapK * (k - 1))
  const step = (right - left) / units
  const bounds: Array<{ left: number; right: number; n: number }> = []
  let cursor = left
  counts.forEach((n, i) => {
    const w = (n - 1) * step
    bounds.push({ left: cursor, right: cursor + w, n })
    cursor += w + (i < k - 1 ? gapK * step : 0)
  })
  return { left, right, step, gap: gapK * step, bounds }
}

/**
 * Resolve step, rows and gap together. `rows` depends on the step and the gap depends on the rows,
 * so it is solved in two passes and the row count is taken as the LARGER of the two — monotone, so
 * it settles rather than oscillating.
 */
export function resolveGeom(counts: number[], edgePct: number, rightPct: number, spriteWPct: number) {
  const first = groupGeom(counts, edgePct, rightPct, GROUP_GAP_K * 2)
  const rows0 = Math.min(MAX_ROWS, huddleRows(first.step, spriteWPct))
  const second = groupGeom(counts, edgePct, rightPct, GROUP_GAP_K * rows0)
  const rows = Math.min(MAX_ROWS, Math.max(rows0, huddleRows(second.step, spriteWPct)))
  const gapK = GROUP_GAP_K * rows
  return { geom: groupGeom(counts, edgePct, rightPct, gapK), rows, gapK }
}

export function groupSpot(gi: number, j: number, counts: number[], w: Habitat,
                          edgePct: number, rows: number, rightPct = PLAY_RIGHT,
                          gapK = GROUP_GAP_K * rows): Spot {
  const g = groupGeom(counts, edgePct, rightPct, gapK)
  const b = g.bounds[gi]
  const row = rows <= 1 ? 0 : j % rows
  return {
    left: b.n <= 1 ? b.left : b.left + j * g.step,
    // Jitter SUBTRACTED only — waitY1 must stay a true floor, or feet drift into the answer strip
    // (chapter 4's one-pixel button overlap).
    top: w.waitY0 + (rows <= 1 ? 0 : row / (rows - 1)) * (w.waitY1 - w.waitY0) - seeded(gi * 7 + j, 12.9898) * BAND_JITTER,
    scale: 1,
  }
}

/**
 * The WHOLE layout chain, exported and shared with the invariant sweep so the check measures what
 * actually renders rather than its own copy of the constants.
 */
export function compareLayout(vw: number, vh: number, counts: number[], castIdx: number) {
  const kind = kindAt(castIdx)
  const world = homeOf(kind)
  const N = counts.reduce((s, n) => s + n, 0)
  const short = vh < 470
  // The 230 ceiling (was 140) is a PACING number as much as a sizing one. Ground speed scales with
  // sprite height, so a creature pinned small on a wide screen has to cover far more of its own
  // body-lengths to cross it — at 1920 the legs were driven to a 0.32s cycle purely because the art
  // was capped at 140px. A bigger creature crosses the same picture at a calmer gait, and looks
  // right on a large display instead of marooned in it. On a clamped journey the leg cycle works
  // out to ms·STRIDE·h/dist — the cadence cancels entirely — so sprite HEIGHT is the only lever
  // that reaches it, which is why this number and not a cadence tweak settles the pacing.
  const baseSize = Math.round(Math.max(short ? 48 : 58, Math.min((vw * 0.9) / N, vh * (short ? 0.26 : 0.22), 230)))
  const aspect = aspectOf(kind.src)
  const rawSize = baseSize * (kind.scale ?? 1)
  const miloSrc = world.move === 'swim' ? MILO_REEF : MILO_LAND
  const mx = leadX(MILO_X, rawSize, aspectOf(miloSrc), MILO_SCALE, vw)
  const edgePct = (rawSize * aspect / 2) / Math.max(1, vw) * 100
  // The bunches' right limit is measured off Milo, never guessed — a flat limit ran the widest reef
  // creatures straight into him on a narrow screen.
  const miloHalfPct = (rawSize * MILO_SCALE * aspectOf(miloSrc) / 2) / Math.max(1, vw) * 100
  const rightPct = Math.min(PLAY_RIGHT, mx - miloHalfPct - edgePct - 1)
  const { geom, rows, gapK } = resolveGeom(counts, edgePct, rightPct, (rawSize * aspect) / Math.max(1, vw) * 100)
  // Cap the sprite against the SAME-ROW slot it has to fit inside, not the raw step.
  const slotPx = geom.step * rows / 100 * vw
  // Capped horizontally by its slot AND vertically by the room two separated rows need — a sprite
  // that fits across but not down leaves the two rows on the same line, burying each other.
  const size = Math.round(Math.max(40, Math.min(rawSize, maxSizeForRows(vh, rows),
    N > counts.length ? (slotPx / aspect) * 0.98 : rawSize)))
  const band: Habitat = spreadBand(fitBands(bandsFor(world), vh, size, MILO_SCALE), vh, size, rows)
  const leadY = Math.max(band.lineY + 4, Math.min(BANDS[world.move].lead, (vh - STRIP_PX) / vh * 100))
  return { kind, world, aspect, miloSrc, mx, edgePct, rows, gapK, size, band, leadY, rightPct }
}

/** One question. `counts` is what each bunch holds; `numerals` (tier 3) replaces counting with a
 *  painted number worn by a single little one per bunch. `want` is which bunch is correct. */
interface CmpRound {
  scene: string
  counts: number[]
  numerals?: number[]
  mode: 'more' | 'fewer'
  want: number
  castIdx: number
}

/**
 * A painted number worn by a little one — the same cream-and-ink marker as chapter 1's tally,
 * chapter 2's number tags and chapter 4's ask sign, so a child moving between chapters reads it the
 * same way. It is a CHILD of the creature, so it travels with it rather than drifting behind: two
 * things that must move as one should be one element.
 */
function NumberSign({ n, size }: { n: number; size: number }) {
  const d = Math.max(40, Math.round(size * 0.54))
  return (
    <span aria-hidden style={{ position: 'absolute', left: '50%', top: -d * 0.72, transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: d, height: d, padding: '0 9px',
      borderRadius: 16, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: d * 0.64, lineHeight: 1,
      background: 'radial-gradient(circle at 38% 30%, #fdf4e0, #ecdcbc)', color: '#5b3f22',
      boxShadow: 'inset 0 -3px 4px rgba(90,64,34,.22), 0 3px 7px rgba(40,30,18,.34)' }}>{n}</span>
  )
}

// ─── The scene ───────────────────────────────────────────────────────────────────────
type Mode = 'demo' | 'guided' | 'practice'

const CompareScene: React.FC<{ data: CmpRound; mode: Mode; onDone: (correct: boolean) => void }> =
({ data, mode, onDone }) => {
  const { counts, numerals, want } = data
  const kind = kindAt(data.castIdx)
  const { w: vw, h: vh } = useViewport()
  const { world, edgePct, rows, gapK, size: babySize, band, leadY, mx, miloSrc, rightPct } =
    compareLayout(vw, vh, counts, data.castIdx)

  const [live, setLive] = useState(false)          // bunches are tappable
  const [marching, setMarching] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const [idleHop, setIdleHop] = useState<string | null>(null)
  const erred = useRef(false), done = useRef(false), tapLock = useRef(false), spoke = useRef(false)
  const timers = useRef<number[]>([])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  // A little one takes the odd hop where it stands. Keeps the scene alive without moving anything
  // the child is counting — the hop is in place and over in half a second.
  useEffect(() => {
    if (marching) return
    const id = window.setInterval(() => {
      const gi = Math.floor(Math.random() * counts.length)
      const j = Math.floor(Math.random() * counts[gi])
      const key = `${gi}:${j}`
      setIdleHop(key)
      window.setTimeout(() => setIdleHop(h => (h === key ? null : h)), 600)
    }, 2700)
    return () => window.clearInterval(id)
  }, [counts, marching])

  const setOff = useCallback(() => {
    if (done.current) return; done.current = true
    setLive(false); setMarching(true)
    after(MARCH_MS - 200, () => onDone(mode === 'practice' ? !erred.current : true))
  }, [mode, onDone, after])

  const askWord = data.mode === 'more'
    ? (counts.length > 2 ? 'the MOST' : 'MORE')
    : (counts.length > 2 ? 'the FEWEST' : 'FEWER')

  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return; ran.current = true
    if (mode !== 'demo') {
      after(OPENING_MS, () => setLive(true))
      if (mode === 'guided') speak(`Now you! Tap the bunch with ${askWord}.`)
      return
    }
    // The demo drives words and movement from ONE narration, so they cannot drift apart — and when
    // audio is blocked speakSteps still paces the steps on a timer.
    const lines = numerals
      ? [`This one has ${numerals[0]}. This one has ${numerals[1]}.`,
         `${numerals[want]} is ${data.mode === 'more' ? 'bigger' : 'smaller'}. Tap that one!`]
      : [`Let's count this bunch. ${counts[0]}.`,
         `And this bunch. ${counts[1]}.`,
         `${counts[want]} is ${data.mode === 'more' ? 'more' : 'fewer'} — that is the one Milo takes.`]
    const cancel = speakSteps(lines, {
      onStep: (i) => {
        if (i < lines.length - 1) return
        setLive(true)
        after(900, () => { setPicked(want); after(420, setOff) })   // the demo answers itself
      },
    })
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tapBunch(gi: number) {
    if (mode === 'demo' || done.current || !live || tapLock.current) return
    tapLock.current = true
    after(TAP_LOCK_MS, () => { tapLock.current = false })
    if (gi === want) { setPicked(gi); after(HOLD_MS, setOff); return }
    // Warm, and never a dead end: the bunch wobbles, Milo says what to do, and the child tries
    // again. The slip is recorded once so the round still grades honestly.
    erred.current = true
    setWrongPick(gi)
    after(560, () => setWrongPick(null))
    if (!spoke.current) {
      spoke.current = true
      speak(numerals ? `Not that one — look at the numbers again.` : `Not quite — count each bunch again.`)
      after(2000, () => { spoke.current = false })
    }
  }

  // The winning bunch leaves on ONE shared offset so it keeps its shape and reads as a procession.
  // Distance is measured from the LEFTMOST of them, or the tail is still in frame when Milo is gone.
  const geom = groupGeom(counts, edgePct, rightPct, gapK)
  const marchDist = OFF_RIGHT - geom.bounds[picked ?? 0].left
  const marchDx = marching ? marchDist : 0
  const cycleFor = (src: string, h: number) =>
    Math.max(1, (marchDist / 100 * vw) / (MARCH_MS / 1000) / groundSpeed(src, h))
  const milo: Spot = { left: mx, top: leadY, scale: MILO_SCALE }

  return (
    <>
      {/* Milo's feet are at or below the lowest creature in every habitat, so he is nearest the
          camera and draws IN FRONT of the bunches. Depth is stated outright, never derived. */}
      <Critter src={miloSrc} at={{ ...milo, left: milo.left + marchDx }} size={babySize} move={world.move} z={34}
        durMs={MARCH_MS} cycleScale={cycleFor(miloSrc, babySize * MILO_SCALE)} moving={marching}
        facingLeft={!marching} breathe={!marching} />

      {counts.map((n, gi) => {
        const won = picked === gi
        return Array.from({ length: n }, (_, j) => {
          const base = groupSpot(gi, j, counts, band, edgePct, rows, rightPct, gapK)
          const at = { ...base, left: base.left + (won ? marchDx : 0) }
          const key = `${gi}:${j}`
          return (
            <React.Fragment key={key}>
              <Critter src={kind.src} facesLeft={kind.facesLeft} at={at} size={babySize} move={world.move}
                z={30 + (j % 2) * 2}
                durMs={marching ? MARCH_MS : TRAVEL_MIN}
                cycleScale={marching ? cycleFor(kind.src, babySize) : 1}
                moving={marching && won}
                breathe={!marching}
                hop={idleHop === key}
                wiggle={wrongPick === gi}>
                {numerals && <NumberSign n={numerals[gi]} size={babySize} />}
              </Critter>
              {/* The hit area is a plain button over the creature — the sprite itself stays
                  pointer-transparent, so a tap can never be swallowed by a flipped inner wrapper.
                  Tapping ANY member picks its whole bunch, which is what the child means. */}
              {mode !== 'demo' && !marching && (
                <button onClick={() => tapBunch(gi)}
                  aria-label={numerals ? `bunch showing ${numerals[gi]}` : `bunch of ${n}`}
                  style={{ position: 'fixed', left: `${at.left}%`, top: `${at.top}%`, transform: 'translate(-50%,-100%)',
                    zIndex: 40, width: Math.max(46, Math.round(babySize * 1.05)), height: Math.max(46, Math.round(babySize * 1.2)),
                    padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                    // The guided round gets ONE nudge to teach the gesture. It is not scored, which
                    // is the only reason a cue pointing at the answer may exist in this chapter at
                    // all: any signal BEFORE the commit hands the answer over.
                    outline: mode === 'guided' && live && gi === want && picked === null && j === 0
                      ? '4px dashed rgba(242,107,44,.75)' : 'none',
                    outlineOffset: 4, borderRadius: 18 }} />
              )}
            </React.Fragment>
          )
        })
      })}
    </>
  )
}

// ─── The journey strip — what makes ten rounds ONE outing ────────────────────────────
/** Lives OUTSIDE the round: SkillBeat rebuilds the scene every round, so anything drawn inside it
 *  resets and the chapter never visibly progresses across a run. */
function MapStrip({ done, total }: { done: number; total: number }) {
  return (
    <div style={{ position: 'fixed', right: 14, top: 12, zIndex: 46,
      display: 'flex', alignItems: 'center', gap: 6, maxWidth: '52vw',
      background: 'rgba(255,255,255,.72)', border: '3px solid var(--milo-orange)', borderRadius: 999,
      padding: '4px 11px', boxShadow: '0 3px 0 rgba(242,107,44,.22)' }}>
      <span style={{ fontSize: 15 }}>{JOURNEY.from}</span>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ width: 9, height: 9, borderRadius: '50%',
          background: i < done ? 'var(--milo-orange)' : 'rgba(61,37,22,.2)', transition: 'background .4s' }} />
      ))}
      <span style={{ fontSize: 15, filter: done >= total ? 'none' : 'grayscale(.55) opacity(.75)' }}>{JOURNEY.to}</span>
    </div>
  )
}

// ─── Value generation ────────────────────────────────────────────────────────────────

/**
 * Difficulty grows the SIZE of the numbers, the CLOSENESS of the two bunches, and finally drops the
 * objects altogether. Growing only one of those is the chapter-2 bug — there, difficulty controlled
 * how MANY numbers there were but never how big, so the gentlest tier could legitimately open a
 * three-year-old on 7·8·9.
 *
 *   1  two bunches, 1–5, a gap of at least 2 — the difference is plain to see
 *   2  two bunches, 1–6, a gap of 1 — now it has to be counted, and "fewer" appears
 *   3  three bunches (the most / the fewest), or a NUMERAL round with no objects at all
 *
 * Both bunches must be countable AT ONCE, so their total is what the ten-on-screen ceiling applies
 * to — which is why a single bunch here is smaller than a single set in the addition chapter.
 */
export function makeRound(d: Difficulty, round: number): CmpRound {
  const castIdx = round % CAST.length
  const home = homeOf(kindAt(castIdx))
  const scene = home.scenes[round % home.scenes.length]
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

  if (d === 3 && round % 2 === 1) {
    // NUMERAL round: no objects, so the numbers are free of the on-screen ceiling.
    const a = rint(1, 10)
    let b = rint(1, 10); while (b === a) b = rint(1, 10)
    const mode = pick(['more', 'fewer'] as const)
    const want = mode === 'more' ? (a > b ? 0 : 1) : (a < b ? 0 : 1)
    return { scene, counts: [1, 1], numerals: [a, b], mode, want, castIdx }
  }

  if (d === 3) {
    // Three bunches. The WINNER is built first and the others are drawn strictly worse, so the
    // extreme is unique by construction and the total is inside the ceiling by construction.
    //
    // The first version drew three counts and patched afterwards, which was wrong twice over: it
    // broke ties by nudging the winner, which pushed the total back OVER the ten-on-screen ceiling
    // it had just enforced; and at the floor `max(1, best − 1)` is a no-op, so a "fewest" round of
    // 2·1·1 kept its tie and two different taps were both defensible. A question with two right
    // answers is worse than a hard one — the child is marked wrong for being right.
    //
    // Three bunches also carry a TIGHTER ceiling than two — eight rather than ten. Ten split three
    // ways plus two separating gaps drives the per-creature slot below the 40px legibility floor on
    // a 640×320 phone, and the floor then wins and the widest creatures overlap. Three bunches
    // genuinely cannot hold ten and stay countable, so the generator does not ask them to.
    //
    // Three bunches are "the MOST" only. Two separating gaps eat enough width that seven is all
    // three bunches of the widest creature can hold at 640×320, and a unique FEWEST inside seven
    // forces the winner to 1 nearly every time — which is a predictable question, not a hard one.
    // Both directions are still covered at this tier by the numeral round, which has no such limit.
    const mode = 'more' as const
    const win = rint(2, 3)
    const others = [0, 1].map(() => rint(1, Math.max(1, win - 1)))
    // FIVE, measured rather than guessed: three bunches burn two separating gaps, and the widest
    // creature (a shark) at 640×320 then needs 70px of slot while six of them leave 69.6px — an
    // overlap of less than a pixel, which is exactly the size of the bug that once put feet behind
    // chapter 4's commit button. The gate stays strict and the count comes down instead. Trimming
    // an "other" never threatens the unique winner, since they start strictly below it.
    while (win + others[0] + others[1] > 5) {
      const i = others[0] >= others[1] ? 0 : 1
      if (others[i] > 1) others[i]--; else break
    }
    const counts = [win, ...others]
    const at = Math.floor(Math.random() * counts.length)      // the winner can stand anywhere
    ;[counts[0], counts[at]] = [counts[at], counts[0]]
    return { scene, counts, mode, want: at, castIdx }
  }

  const minGap = d === 1 ? 2 : 1
  const hi = d === 1 ? 5 : 6
  let a = rint(1, hi), b = rint(1, hi)
  let guard = 0
  while ((Math.abs(a - b) < minGap || a + b > MAX_ON_SCREEN) && guard++ < 40) { a = rint(1, hi); b = rint(1, hi) }
  if (Math.abs(a - b) < minGap) { a = Math.min(hi, minGap + 1); b = 1 }      // deterministic fallback
  const mode = d === 1 ? 'more' as const : pick(['more', 'fewer'] as const)
  const want = mode === 'more' ? (a > b ? 0 : 1) : (a < b ? 0 : 1)
  return { scene, counts: [a, b], mode, want, castIdx }
}

function makeCmpBeat(): Beat<CmpRound> {
  return {
    skillId: 'numberComparison', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeRound((d || 1) as Difficulty, round),
    // Dedupe on the COMPARISON itself, not the rotating cast or scene.
    sig: d => `${d.numerals ? 'n' : 'c'}${(d.numerals ?? d.counts).join('/')}${d.mode}`,
    prompt: d => d.numerals
      ? `Which number is ${d.mode === 'more' ? 'BIGGER' : 'SMALLER'}?`
      : `Which bunch has ${d.mode === 'more' ? (d.counts.length > 2 ? 'the MOST' : 'MORE') : (d.counts.length > 2 ? 'the FEWEST' : 'FEWER')}?`,
    say: d => d.numerals
      ? `Look at the two numbers. Tap the ${d.mode === 'more' ? 'bigger' : 'smaller'} one.`
      : `Count each bunch. Tap the one with ${d.mode === 'more' ? (d.counts.length > 2 ? 'the most' : 'more') : (d.counts.length > 2 ? 'the fewest' : 'fewer')}.`,
    Play: ({ data, onSubmit }) => <CompareScene data={data} mode="practice" onDone={onSubmit} />,
    Reteach: ({ data, onDone }) => <CompareScene data={data} mode="demo" onDone={() => onDone()} />,
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const BS_CSS = `
@keyframes bs_nudge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
const TOTAL_ROUNDS = 10

export default function BigOrSmall({ onFinish, onExit }: {
  world?: string     // accepted for the /story route's shared signature; the chapter is one world
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [scene, setScene] = useState<string>(HABITATS.meadow.scenes[0])
  const [stage, setStage] = useState(0)
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])

  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true
    stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeCmpBeat(), [])

  // The demo and the guided round deliberately use DIFFERENT habitats, so the first thing a child
  // learns is that the place changes but the rule does not.
  const DEMO_ROUND: CmpRound = { scene: HABITATS.meadow.scenes[0], counts: [4, 2], mode: 'more', want: 0, castIdx: 0 }
  const GUIDED_ROUND: CmpRound = { scene: HABITATS.reef.scenes[0], counts: [2, 4], mode: 'more', want: 1, castIdx: 1 }
  const bgScene = phase === 'practice' ? scene : phase === 'guided' ? GUIDED_ROUND.scene : DEMO_ROUND.scene
  const allScenes = useMemo(() => Object.values(HABITATS).flatMap(h => h.scenes), [])

  // Landscape-first: the bunches stand side by side across the picture, which a portrait phone has
  // no room for. This early return has to sit BELOW every hook — above one, turning the phone
  // changes the hook count and React tears the chapter down into the error boundary.
  if (needsRotate) return <RotateGate line="Milo weighs up the bunches in landscape! 🐴" />

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{CRITTER_CSS}{BS_CSS}</style>
      <Background scene={bgScene} scenes={allScenes} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '74%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            Two bunches of little ones are waiting — and Milo can only take one! Watch how he works out which bunch has more.
          </div>
          <button onClick={() => setPhase('demo')}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner('Watch Milo count each bunch')}
        <CompareScene key="demo" data={DEMO_ROUND} mode="demo" onDone={() => setPhase('guided')} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the bunch with MORE')}
        <CompareScene key="guided" data={GUIDED_ROUND} mode="guided" onDone={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (<>
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data, round) => { if (data?.scene) setScene(data.scene as string); setStage(round) }}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
        <MapStrip done={stage} total={TOTAL_ROUNDS} />
      </>)}
    </div>
  )
}
