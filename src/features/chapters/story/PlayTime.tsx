'use client'
/**
 * Chapters 9 & 10 — SIMPLE ADDITION and SIMPLE SUBTRACTION, as PLAY TIME.
 *
 * ONE component for both, because they are the SAME journey run in opposite directions: little ones
 * walk IN and join the group, or walk OUT and leave it. Building them separately would mean two
 * copies of the arrive/leave code drifting apart — the 6–8 band already shares one component across
 * add and subtract (BlockYard) for exactly this reason.
 *
 *   +  `a` are playing with Milo. `b` MORE walk in from off-frame, one after another, each
 *      travelling the whole way with its drawn cycle running. How many are playing now?
 *   −  `a` are playing. `b` of them walk off and leave the picture completely. How many are left?
 *
 * WHY THIS AND NOT THE ORCHARD / LILY POND IT REPLACES: there, both groups simply POPPED into
 * existence with a CSS scale, and in subtraction the leavers "left" by fading their opacity while
 * standing still. Nothing was alive before the question, nothing travelled, and the arithmetic
 * happened in a jump-cut. The whole idea of adding is that a group ARRIVES and of subtracting that
 * one GOES — those are journeys, and the cast already has drawn walk cycles for them. So the
 * operation itself is now the thing that moves, which is the only way a three-year-old sees what
 * the sum describes rather than being told the total changed.
 *
 * THE ANSWER STAYS STILL. The three number markers are painted, exact and motionless — never
 * animate the thing the child has to read. The tap still causes a journey: get it right and Milo
 * leads the whole group off to play.
 *
 * COUNTABILITY IS THE LAYOUT CONSTRAINT HERE, and it is why this chapter does NOT reuse chapter 4's
 * gather cluster. That cluster packs neighbours 5.4% of the screen apart — a deliberate overlapping
 * huddle, which is right for a group of at most seven that has already been counted out one tap at
 * a time. This chapter asks a child to count a set of up to TEN in one go, so the set is spread
 * across an even, non-overlapping band whose spacing is derived from each sprite's own width. A
 * pile you cannot count is a wrong answer the chapter caused.
 *
 * Counting ALL of them is the intended strategy at this age (count-all precedes count-on), so the
 * groups stay visible and separate rather than collapsing into a total.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { speak, speakSteps, stopSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import type { Difficulty } from '@/core/progression'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import {
  type Habitat, type Spot, HABITATS, CAST, kindAt, homeOf, aspectOf,
  Background, Critter, CRITTER_CSS, huddleRows, leadX, fitBands,
  LEAD_X as MILO_X, LEAD_SCALE as MILO_SCALE, STRIP_PX,
  groundSpeed, journeyOf, TRAVEL_MIN, type Journey, seeded, maxSizeForRows, spreadBand, BAND_JITTER,
} from './critters'
import { rint, shuffle } from '@/core/rand'
import { useOnceGuard } from '@/shared/hooks/useOnceGuard'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'

export type Op = '+' | '-'

// Same reasoning as chapter 4: long enough to swallow a double-tap, and deliberately NOT tied to
// Milo's voice. `speechSynthesis.speaking` measured true for over 3.2s after one spoken digit, and
// gating on it locks a child out of the screen for seconds at a time.
const TAP_LOCK_MS = 260
const COUNT_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
const JOIN_GAP_MS = 480        // stagger between arrivals, so they read as a queue not a swarm
const OPENING_MS = 950         // let the starting group be SEEN before anything changes
const MARCH_MS = 3200          // Milo and the group heading off once the answer is given
const HOLD_MS = 900            // beat on the finished group before they leave
const EXIT_X = -16             // far enough left that the widest sprite is fully out of frame
const OFF_RIGHT = 124          // where the leftmost of them must reach to clear the right edge

const MILO_LAND = '/assets/characters/milo_side.png'
const MILO_REEF = '/assets/characters/milo_underwater.png'
const JOURNEY = { from: '🐾', to: '🎈' }

/**
 * This chapter's bands, per habitat — same reasoning as chapter 4: Milo is a pony, and dropping a
 * pony onto a flier's band leaves him hovering over the hedge at the edge of frame, which is
 * exactly the "he read as clutter" note that got him cut from chapter 2. The leader gets a GROUND
 * line of its own. Chapter 2's HABITATS are deliberately untouched — it is shipped and swept across
 * 330 geometry combinations, and perturbing its numbers to suit a new chapter risks that.
 */
export const BANDS: Record<Habitat['move'], { lead: number; play: [number, number] }> = {
  land: { lead: 92, play: [80, 92] },
  swim: { lead: 76, play: [58, 76] },
  air: { lead: 88, play: [56, 72] },
}
const bandsFor = (w: Habitat): Habitat => {
  const b = BANDS[w.move]
  // lineY is where the leader's own floor is measured against; the play band is where the little
  // ones stand. Both are trimmed to the room actually available by fitBands.
  return { ...w, lineY: b.play[0] - 4, waitY0: b.play[0], waitY1: b.play[1] }
}

/**
 * The play area: an EVEN band the whole set stands in, spread so neighbours in the same row never
 * overlap. Deliberately local rather than the shared `huddleGeom`, whose right edge is hard-clamped
 * to 56% because chapters 2 and 4 need their huddle to end left of a destination. Here the set IS
 * the destination, so it may use the width — and changing the shared helper would perturb two
 * shipped chapters that are swept by an invariant test.
 */
export const PLAY_RIGHT = 74    // the roomy-screen limit; pulled back further when Milo needs it
export function playGeom(n: number, edgePct: number, rightPct = PLAY_RIGHT) {
  const left = Math.max(13, edgePct + 1)
  const right = Math.max(left + 1, rightPct)
  return { left, right, span: n <= 1 ? 0 : (right - left) / (n - 1) }
}
export function playSpot(i: number, n: number, w: Habitat, edgePct: number, rows: number, rightPct = PLAY_RIGHT): Spot {
  const { left, span } = playGeom(n, edgePct, rightPct)
  const row = rows <= 1 ? 0 : i % rows
  return {
    left: n <= 1 ? 44 : left + i * span,
    // The organic jitter is SUBTRACTED, never added. Added, it pushes feet below waitY1 — which
    // fitBands has just finished proving is the lowest a foot may go — and that is how chapter 4
    // ended up with feet one pixel behind its own commit button.
    top: w.waitY0 + (rows <= 1 ? 0 : row / (rows - 1)) * (w.waitY1 - w.waitY0) - seeded(i, 12.9898) * BAND_JITTER,
    scale: 1,
  }
}

/** One question. `a` is the group already there; `b` arrives (+) or departs (−). */
interface PlayRound {
  scene: string; op: Op
  a: number; b: number; answer: number; choices: number[]
  castIdx: number
}

/**
 * A painted number marker — the same cream-and-ink idiom as chapter 1's tally, chapter 2's number
 * tags and chapter 4's ask sign, so a child moving between chapters reads it the same way. It is
 * NOT a white UI pill: this one sits inside the picture.
 *
 * Every marker looks identical until it is tapped. Nothing here may hint which is right — the
 * moment a marker can be told apart before you commit, the chapter is a hot/cold game and the
 * counting is optional. (Same fault as chapter 4's Ready button turning green on the count.)
 */
function NumberMarker({ n, h, state, onTap, nudge }: {
  n: number; h: number; state: 'idle' | 'right' | 'wrong'; onTap: () => void; nudge?: boolean
}) {
  return (
    <button onClick={onTap} aria-label={`${n}`}
      style={{
        minWidth: Math.round(h * 1.22), height: h, padding: '0 10px', borderRadius: 18, cursor: 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(h * 0.56), lineHeight: 1,
        background: state === 'right' ? 'radial-gradient(circle at 38% 30%, #e9f8d2, #bfe3a0)'
          : 'radial-gradient(circle at 38% 30%, #fdf4e0, #ecdcbc)',
        color: state === 'right' ? '#3f6b1e' : '#5b3f22',
        border: 'none',
        boxShadow: 'inset 0 -3px 4px rgba(90,64,34,.22), 0 3px 7px rgba(40,30,18,.34)',
        animation: state === 'wrong' ? 'pt_shake .45s ease' : nudge ? 'pt_nudge 1.1s ease-in-out infinite' : 'none',
      }}>{n}</button>
  )
}

// ─── Sizing ──────────────────────────────────────────────────────────────────────────
/**
 * The WHOLE layout chain for a screen × set size × creature, as one pure function — deliberately
 * exported, and deliberately the exact code the scene renders from. Chapter 4's invariant sweep
 * re-implements its chain inside the test, which means the check can agree with itself while the
 * screen it exists to protect falls apart. Here the test calls this, so it measures what actually
 * renders.
 *
 * Order matters and is the same as chapters 2 and 4: Milo's place comes from the UNCAPPED size (an
 * over-estimate, so he always fits), that fixes how much room the set has, and only then is the
 * sprite capped to its slot. Sizing on HEIGHT alone draws wide creatures (a ladybug is 1.47× wider
 * than tall, a shark 1.75×) far wider than their slot and they bury each other — which in a chapter
 * about counting them is fatal, not cosmetic.
 */
export function playLayout(vw: number, vh: number, n: number, castIdx: number) {
  const kind = kindAt(castIdx)
  const world = homeOf(kind)
  const short = vh < 470
  // The 230 ceiling (was 140) is a PACING number as much as a sizing one. Ground speed scales with
  // sprite height, so a creature pinned small on a wide screen has to cover far more of its own
  // body-lengths to cross it — at 1920 the legs were driven to a 0.32s cycle purely because the art
  // was capped at 140px. A bigger creature crosses the same picture at a calmer gait, and looks
  // right on a large display instead of marooned in it. On a clamped journey the leg cycle works
  // out to ms·STRIDE·h/dist — the cadence cancels entirely — so sprite HEIGHT is the only lever
  // that reaches it, which is why this number and not a cadence tweak settles the pacing.
  const baseSize = Math.round(Math.max(short ? 48 : 58, Math.min((vw * 0.9) / n, vh * (short ? 0.26 : 0.22), 230)))
  const aspect = aspectOf(kind.src)
  const rawSize = baseSize * (kind.scale ?? 1)
  const miloSrc = world.move === 'swim' ? MILO_REEF : MILO_LAND
  const mx = leadX(MILO_X, rawSize, aspectOf(miloSrc), MILO_SCALE, vw)
  const edgePct = (rawSize * aspect / 2) / Math.max(1, vw) * 100
  // The set's right limit is MEASURED off Milo, not guessed. At a flat 74% the three widest reef
  // creatures (fish 1.37, turtle 1.53, shark 1.75 : 1) ran their last member into him on a 640-wide
  // screen — the same class of fault as chapter 2's cut-off leader, and the same fix: derive the
  // limit from the sprite's own width and give back only what it actually needs. Estimated from
  // the UNCAPPED size so the limit can only ever be too generous to the gap, never too tight.
  const miloHalfPct = (rawSize * MILO_SCALE * aspectOf(miloSrc) / 2) / Math.max(1, vw) * 100
  const rightPct = Math.min(PLAY_RIGHT, mx - miloHalfPct - edgePct - 1)
  const spanPct = playGeom(n, edgePct, rightPct).span
  // Two rows, never three — see MAX_ROWS in BigOrSmall: a third row is only room if the rows
  // are far enough apart to read as rows, and in these shallow bands they are not.
  const rows = Math.min(2, huddleRows(spanPct, (rawSize * aspect) / Math.max(1, vw) * 100))
  const slotPx = spanPct * rows / 100 * vw
  // Capped horizontally by its slot AND vertically by the room two separated rows need.
  const size = Math.round(Math.max(40, Math.min(rawSize, maxSizeForRows(vh, rows),
    n > 1 ? (slotPx / aspect) * 0.98 : rawSize)))
  const band: Habitat = spreadBand(fitBands(bandsFor(world), vh, size, MILO_SCALE), vh, size, rows)
  const leadY = Math.max(band.lineY + 4, Math.min(BANDS[world.move].lead, (vh - STRIP_PX) / vh * 100))
  return { kind, world, aspect, miloSrc, mx, edgePct, rows, size, band, leadY, rightPct }
}

/** The height of a number marker, and therefore the top of the strip the feet must stay out of. */
export const markerHeight = (vh: number) => Math.max(44, Math.min(54, Math.round(vh * 0.13)))

// ─── The scene ───────────────────────────────────────────────────────────────────────
/** One surface for the demo, the guided round and the scored round — they differ only in who is
 *  doing the tapping, so they must not be three different pictures. */
type Mode = 'demo' | 'guided' | 'practice'

const PlayScene: React.FC<{ data: PlayRound; mode: Mode; onDone: (correct: boolean) => void }> =
({ data, mode, onDone }) => {
  const { op, a, b, answer, choices } = data
  const add = op === '+'
  /**
   * SLOT ORDER IS THE WHOLE TRICK, and it is what keeps journeys from crossing the group.
   * Slots run left→right. The `b` that MOVE always own the LEFTMOST slots, and the ones that stay
   * put own the right. So an arrival walks in from off-frame left and stops at the near edge of the
   * group without passing through it, and a leaver walks straight out the same way. Index === slot,
   * which means no slot bookkeeping at all — the old draft allocated slots at runtime and that is
   * where its crossing-paths bug lived.
   */
  const pool = add ? a + b : a               // how many are on screen at the moment of counting
  const { w: vw, h: vh } = useViewport()
  // The one layout chain, shared with the invariant sweep — see playLayout.
  const { kind, world, edgePct, rows, size: babySize, band, leadY, mx, miloSrc, rightPct } =
    playLayout(vw, vh, pool, data.castIdx)

  /** Is this one currently standing in the play area? Addition opens with the movers still off
   *  frame; subtraction opens with everybody present. */
  const [here, setHere] = useState<boolean[]>(() =>
    Array.from({ length: pool }, (_, i) => (add ? i >= b : true)))
  const [moving, setMoving] = useState<Record<number, Journey>>({})   // index → its own journey
  const [goingLeft, setGoingLeft] = useState<Record<number, boolean>>({})
  const [idleHop, setIdleHop] = useState<number | null>(null)
  const [countHop, setCountHop] = useState<number | null>(null)      // the one being counted, in the demo
  const [asking, setAsking] = useState(false)                        // markers are live
  const [marching, setMarching] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false), tapLock = useRef(false), spoke = useRef(false)
  const timers = useRef<number[]>([])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  const offFrame = useCallback((): Spot => ({ left: EXIT_X, top: band.waitY0, scale: 1 }), [band])
  const spotOf = useCallback((i: number, present: boolean): Spot =>
    present ? playSpot(i, pool, band, edgePct, rows, rightPct) : offFrame(),
  [pool, band, edgePct, rows, rightPct, offFrame])

  /** Walk one in, or walk one out. Both are the same call — only the destination differs, and each
   *  is timed from ITS OWN journey so the leg cycle and the ground covered are given the same
   *  number. That shared number is the one thing that must not be inferred, or the feet skate. */
  const travel = useCallback((i: number, arriving: boolean) => {
    const from = spotOf(i, !arriving)
    const to = spotOf(i, arriving)
    const j = journeyOf(from, to, vw, vh, babySize, kind.src)
    setHere(h => { const n = h.slice(); n[i] = arriving; return n })
    setMoving(m => ({ ...m, [i]: j }))
    // A departure walks leftward, so the sprite must face that way or it moonwalks out of frame.
    if (!arriving) setGoingLeft(g => ({ ...g, [i]: true }))
    after(j.ms, () => setMoving(m => { const n = { ...m }; delete n[i]; return n }))
  }, [after, spotOf, vw, vh, babySize, kind.src])

  // A little one takes the odd hop where it stands. This is what keeps the scene alive without
  // moving anything the child is counting — the hop is in place and over in half a second.
  useEffect(() => {
    if (marching) return
    const id = window.setInterval(() => {
      const present = here.map((p, i) => (p ? i : -1)).filter(i => i >= 0)
      if (!present.length) return
      const pick = present[Math.floor(Math.random() * present.length)]
      setIdleHop(pick)
      window.setTimeout(() => setIdleHop(h => (h === pick ? null : h)), 600)
    }, 2800)
    return () => window.clearInterval(id)
  }, [here, marching])

  /** Right answer — Milo leads them off to play, and THAT is the round's reward. */
  const setOff = useCallback(() => {
    if (done.current) return; done.current = true
    setAsking(false)
    setMarching(true)
    after(MARCH_MS - 200, () => onDone(mode === 'practice' ? !erred.current : true))
  }, [mode, onDone, after])

  // ── The question plays itself: the arrival or the departure IS the sum ──────────────
  // In the demo, words and movement come from ONE narration so they can never drift apart (and
  // speakSteps still paces the steps when audio is blocked). In the scored round the same timeline
  // runs with NO voice, because Milo counting aloud would be Milo handing over the answer.
  const ran = useOnceGuard()
  useEffect(() => {
    if (ran.current) return; ran.current = true
    const movers = Array.from({ length: b }, (_, k) => k)      // always the leftmost slots

    if (mode !== 'demo') {
      movers.forEach((i, k) => after(OPENING_MS + k * JOIN_GAP_MS, () => travel(i, add)))
      // Wait for the last mover to actually LAND, not for some nominal minimum — travel is now
      // derived per journey and can run to TRAVEL_MAX, so a fixed floor opened the answer early.
      const longest = movers.length
        ? Math.max(...movers.map(i => journeyOf(spotOf(i, !add), spotOf(i, add), vw, vh, babySize, kind.src).ms))
        : 0
      after(OPENING_MS + (movers.length - 1) * JOIN_GAP_MS + longest + 200, () => setAsking(true))
      if (mode === 'guided') {
        speak(add ? 'Some more come to play! Count them all, then tap how many.'
                  : 'Some go home! Count who is left, then tap how many.')
      }
      return
    }

    // Left→right is both the reading order and the order they stand in, so counting follows the
    // slots: everyone for addition, and everyone who stayed for subtraction.
    const counted = add
      ? Array.from({ length: pool }, (_, i) => i)
      : Array.from({ length: pool }, (_, i) => i).filter(i => i >= b)
    const lines = [
      `${COUNT_WORDS[a]} ${kind.plural} are playing with Milo.`,
      ...movers.map(() => (add ? 'Another one comes to play!' : 'One goes home.')),
      add ? 'Now count them ALL.' : 'Now count who is LEFT.',
      ...Array.from({ length: answer }, (_, k) => `${COUNT_WORDS[k + 1] ?? k + 1}.`),
      `That makes ${answer}. Tap the ${answer}!`,
    ]
    const cancel = speakSteps(lines, {
      onStep: (i) => {
        if (i === 0) return
        const k = i - 1
        if (k < movers.length) { travel(movers[k], add); return }
        if (k === movers.length) return                        // "now count them"
        const c = k - movers.length - 1
        if (c < answer) {
          // Hop each one as it is counted — the same "this one" idiom as the counting parade.
          const who = counted[c]
          if (who !== undefined) { setCountHop(who); window.setTimeout(() => setCountHop(h => (h === who ? null : h)), 620) }
          return
        }
        setAsking(true)
        after(1000, () => { setPicked(answer); after(420, setOff) })   // the demo answers itself
      },
    })
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tapMarker(v: number) {
    if (mode === 'demo' || done.current || !asking || tapLock.current) return
    tapLock.current = true
    after(TAP_LOCK_MS, () => { tapLock.current = false })
    if (v === answer) { setPicked(v); after(HOLD_MS, setOff); return }
    // Warm, and never a dead end: the marker shakes, Milo says what to do, and the child tries
    // again. The slip is recorded once so the round still grades honestly.
    erred.current = true
    setWrongPick(v)
    after(520, () => setWrongPick(null))
    if (!spoke.current) {
      spoke.current = true
      speak(add ? 'Not quite — count them all again, one by one.' : 'Not quite — count who is still here.')
      after(2000, () => { spoke.current = false })
    }
  }

  // Everyone leaves on ONE shared offset, so the group keeps its shape and reads as a procession
  // rather than a scatter. Distance is measured from the LEFTMOST of them, or the tail is still in
  // frame when Milo has gone. The exit covers far more ground per second than a stroll, so each
  // cycle is sped up by exactly that ratio — the only way the feet stay locked to the ground.
  const marchDist = OFF_RIGHT - playGeom(pool, edgePct, rightPct).left
  const marchDx = marching ? marchDist : 0
  const cycleFor = (src: string, h: number) =>
    Math.max(1, (marchDist / 100 * vw) / (MARCH_MS / 1000) / groundSpeed(src, h))
  const milo: Spot = { left: mx, top: leadY, scale: MILO_SCALE }
  const markerH = markerHeight(vh)

  return (
    <>
      {/* Milo's feet are at or below the lowest creature in every habitat, so he is nearest the
          camera and draws IN FRONT of the set. Depth is stated outright, never derived. */}
      <Critter src={miloSrc} at={{ ...milo, left: milo.left + marchDx }} size={babySize} move={world.move} z={34}
        durMs={MARCH_MS} cycleScale={cycleFor(miloSrc, babySize * MILO_SCALE)} moving={marching}
        // He faces the little ones while they come and go — they arrive from and leave to his left
        // — and only turns to lead once the answer is in. A leader with his back to the thing the
        // child is doing reads as scenery rather than as the person who asked.
        facingLeft={!marching} breathe={!marching} />

      {here.map((present, i) => {
        const base = spotOf(i, present)
        const at = { ...base, left: base.left + (present ? marchDx : 0) }
        const isMoving = moving[i] !== undefined
        return (
          <Critter key={i} src={kind.src} facesLeft={kind.facesLeft} at={at} size={babySize} move={world.move}
            // Draw order is depth, stated outright rather than derived from a coordinate, so the
            // front row is never buried by the row behind it.
            z={30 + (i % 2) * 2}
            durMs={marching ? MARCH_MS : (moving[i]?.ms ?? TRAVEL_MIN)}
            // The travelling creature's cycle is scaled to whatever speed the clamp actually gave
            // it — passing 1 here is what made every long journey skate.
            cycleScale={marching ? cycleFor(kind.src, babySize) : (moving[i]?.cycleScale ?? 1)}
            moving={isMoving || (marching && present)}
            facingLeft={!!goingLeft[i] && isMoving}
            breathe={!isMoving && !marching}
            hop={idleHop === i || countHop === i} />
        )
      })}

      {/* The answer. Three painted markers, identical at every moment until one is tapped — see
          NumberMarker. They live inside the bottom strip that fitBands already keeps every foot out
          of, so a creature can never come to rest on top of the answer. They stay dimmed and inert
          until the arriving or leaving has finished: offering the answer while the sum is still
          happening invites a tap before there is anything to count. */}
      {!marching && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 8, zIndex: 46,
          display: 'flex', justifyContent: 'center', gap: 12,
          opacity: asking ? 1 : 0.3, pointerEvents: asking ? 'auto' : 'none', transition: 'opacity .35s ease' }}>
          {choices.map(v => (
            <NumberMarker key={v} n={v} h={markerH}
              state={picked === v ? 'right' : wrongPick === v ? 'wrong' : 'idle'}
              // The guided round gets ONE nudge to teach the gesture. It is not scored, which is the
              // only reason a cue pointing at the answer is allowed to exist anywhere in a chapter.
              nudge={mode === 'guided' && asking && v === answer && picked === null}
              onTap={() => tapMarker(v)} />
          ))}
        </div>
      )}
    </>
  )
}

// ─── The journey strip — what makes ten rounds ONE afternoon ─────────────────────────
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
 * Distractors are honest MISCOUNTS, not random numbers: one off in each direction is what a child
 * who loses their place actually produces, so a wrong tap says something about the counting rather
 * than being noise. Kept ≥ 0, and ≥ 1 for addition where nobody can be playing.
 */
export function choicesFor(answer: number, op: Op): number[] {
  const floor = op === '+' ? 1 : 0
  const opts = new Set<number>([answer])
  if (answer - 1 >= floor) opts.add(answer - 1)
  opts.add(answer + 1)
  let d = 2
  while (opts.size < 3) { if (answer - d >= floor) opts.add(answer - d); else opts.add(answer + d); d++ }
  return shuffle([...opts]).slice(0, 3)
}

/**
 * TEN ON SCREEN IS THE CEILING, and it is what caps the arithmetic. Everything here is
 * object-driven — the child counts real creatures — so the total cannot exceed what a short
 * landscape phone can hold at a legible, countable size. The old chapter ran addition to 14 by
 * drawing tiny static sprites; sums within 10 is also exactly where this band belongs (K.OA), so
 * the cap is a correction rather than a loss.
 */
export function makeRound(op: Op, d: Difficulty, round: number): PlayRound {
  // The cast index picks the creature AND, through its habitat, which backdrops are eligible — a
  // fish cannot play on a lawn. The scene advances on its own cycle so the same creature is not
  // always seen against the same picture.
  const castIdx = round % CAST.length
  const home = homeOf(kindAt(castIdx))
  const scene = home.scenes[round % home.scenes.length]

  if (op === '+') {
    const cap = d === 1 ? 5 : d === 2 ? 8 : 10
    const a = d === 1 ? rint(1, 3) : d === 2 ? rint(2, 4) : rint(3, 6)
    const b = Math.max(1, Math.min(d === 1 ? rint(1, 2) : d === 2 ? rint(2, 4) : rint(3, 4), cap - a))
    return { scene, op, a, b, answer: a + b, choices: choicesFor(a + b, op), castIdx }
  }
  const a = d === 1 ? rint(3, 5) : d === 2 ? rint(5, 8) : rint(8, 10)
  // At least one always stays, so the answer is a number the child can still see standing there.
  const b = Math.min(d === 1 ? rint(1, 2) : d === 2 ? rint(2, 4) : rint(3, 6), a - 1)
  return { scene, op, a, b, answer: a - b, choices: choicesFor(a - b, op), castIdx }
}

export function makePlayBeat(op: Op): Beat<PlayRound> {
  const add = op === '+'
  return {
    skillId: add ? 'addition' : 'subtraction', rounds: 10, walkEvery: 3,
    make: (d, round = 0) => makeRound(op, (d || 1) as Difficulty, round),
    // Dedupe on the SUM ITSELF, not the rotating cast or scene — otherwise the same arithmetic
    // reads as new variety just because the backdrop changed.
    sig: d => `${d.a}${op}${d.b}`,
    prompt: d => add
      ? `${d.a} playing, ${d.b} more come. How many now?`
      : `${d.a} playing, ${d.b} go home. How many are left?`,
    say: d => add
      ? `${d.a} are playing. ${d.b} more come to play. Count them all, then tap how many.`
      : `${d.a} are playing. ${d.b} go home. Count who is left, then tap how many.`,
    Play: ({ data, onSubmit }) => <PlayScene data={data} mode="practice" onDone={onSubmit} />,
    Reteach: ({ data, onDone }) => <PlayScene data={data} mode="demo" onDone={() => onDone()} />,
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const PT_CSS = `
@keyframes pt_shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px) rotate(-5deg)} 75%{transform:translateX(5px) rotate(5deg)} }
@keyframes pt_nudge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
const TOTAL_ROUNDS = 10

export default function PlayTime({ op = '+', onFinish, onExit }: {
  op?: Op
  world?: string     // accepted for the /story route's shared signature; the chapter is one world
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const add = op === '+'
  const [phase, setPhase] = useChapterPhase<Phase>('intro')
  const [scene, setScene] = useState<string>(HABITATS.meadow.scenes[0])
  const [stage, setStage] = useState(0)
  const { exit, tally } = useChapterShell(onFinish, onExit)

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makePlayBeat(op), [op])

  // The demo and the guided round deliberately use DIFFERENT habitats, so the first thing a child
  // learns is that the place changes but the rule does not.
  const DEMO_ROUND: PlayRound = add
    ? { scene: HABITATS.meadow.scenes[0], op, a: 2, b: 2, answer: 4, choices: [3, 4, 5], castIdx: 0 }
    : { scene: HABITATS.meadow.scenes[0], op, a: 5, b: 2, answer: 3, choices: [2, 3, 4], castIdx: 0 }
  const GUIDED_ROUND: PlayRound = add
    ? { scene: HABITATS.reef.scenes[0], op, a: 2, b: 1, answer: 3, choices: [2, 3, 4], castIdx: 1 }
    : { scene: HABITATS.reef.scenes[0], op, a: 4, b: 1, answer: 3, choices: [2, 3, 4], castIdx: 1 }
  const bgScene = phase === 'practice' ? scene : phase === 'guided' ? GUIDED_ROUND.scene : DEMO_ROUND.scene
  const allScenes = useMemo(() => Object.values(HABITATS).flatMap(h => h.scenes), [])

  // Landscape-first: they walk ACROSS the picture, which a portrait phone has no room for. This
  // early return has to sit BELOW every hook — above one, turning the phone changes the hook count
  // and React tears the chapter down into the error boundary.
  if (needsRotate) return <RotateGate line={add ? 'Milo plays with his friends in landscape! 🐴' : 'Milo waves his friends off in landscape! 🐴'} />

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{CRITTER_CSS}{PT_CSS}</style>
      <Background scene={bgScene} scenes={allScenes} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '74%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {add
              ? 'Milo is playing with his little friends — and MORE keep coming over! Watch how he counts them all.'
              : 'Milo is playing with his little friends — and some have to go home. Watch how he counts who is left.'}
          </div>
          <button onClick={() => setPhase('demo')}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(add ? 'Watch Milo count them all' : 'Watch Milo count who is left')}
        <PlayScene key="demo" data={DEMO_ROUND} mode="demo" onDone={() => setPhase('guided')} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap how many')}
        <PlayScene key="guided" data={GUIDED_ROUND} mode="guided" onDone={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (<>
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data, round) => { if (data?.scene) setScene(data.scene as string); setStage(round) }}
            onComplete={tally} />
        </div>
        <MapStrip done={stage} total={TOTAL_ROUNDS} />
      </>)}
    </div>
  )
}
