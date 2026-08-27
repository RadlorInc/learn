'use client'
/**
 * Chapter 4 — number ↔ QUANTITY (skill `matchingQuantities`), as HOME TIME.
 *
 * Milo is walking the little ones home and he asks for EXACTLY a number of them. Tap one and it
 * really walks across the still scene and stands with him; tap one that is already with him and it
 * walks back to the others. When the group looks right, tap Ready — and the whole point of the
 * chapter is that NOTHING tells the child when to stop. There are always spare little ones left
 * over. Counting out a set and STOPPING is the skill; a shelf that empties at exactly the right
 * moment does the stopping for you.
 *
 * WHY THIS AND NOT THE LITTLE GROCERY IT REPLACES: that chapter had the child tap fruit off a
 * wooden shelf into a CSS-gradient paper bag while an emoji customer bobbed alongside. Three
 * separate faults, all the ones chapters 1–3 were rebuilt to fix — the countable things were dead
 * props that could not be alive before they were tapped, the container was code-drawn next to
 * painted art and looked exactly like what it was, and an emoji dropped into a painted scene is
 * the most pasted-on thing you can put on screen. Creatures fix all three at once: they are
 * already painted in the app's style, they already have drawn walk cycles, and they are alive
 * before anything is tapped.
 *
 * AND THE TAP CAUSES A JOURNEY, IN BOTH DIRECTIONS. Sending one back is a walk too, not a
 * "put one back" button — a miscount is repaired by watching the extra one wander home, which is
 * the same feedback as the mistake itself, only in reverse.
 *
 * Distinct from chapter 2 (Follow the Leader), which shares this cast and this engine: nobody
 * wears a number, the order they go in does not matter, only HOW MANY — and the child, not the
 * chapter, decides when the answer is finished.
 *
 * Difficulty grows the count AND the temptation: 1–3 with two spares → 3–6 → 6–7 with three
 * spares, so the higher tiers have more little ones on screen than the answer needs.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { speak, speakSteps, stopSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { matchTarget } from '@/core/progression'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import {
  type Habitat, type Spot, HABITATS, CAST, kindAt, homeOf, aspectOf,
  Background, Critter, CRITTER_CSS, huddleGeom, huddleRows, waitSpot, clusterSpot, leadX, fitBands,
  GATHER_LEFT, GATHER_COL, HUDDLE_RIGHT, LEAD_X as MILO_X, LEAD_SCALE as MILO_SCALE, STRIP_PX,
  groundSpeed, journeyOf, TRAVEL_MIN, type Journey,
} from './critters'
import { useOnceGuard } from '@/shared/hooks/useOnceGuard'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'

// Just long enough to swallow a double-tap. It is deliberately NOT tied to Milo's voice: measured
// live, `speechSynthesis.speaking` stays true for over 3.2 SECONDS after a single spoken digit
// (Chrome is in no hurry to fire `end`, and its watchdog ceiling is 6s). Gating taps on that locked
// a child out for seconds per tap in a chapter where one round can want seven of them. Overlap is
// prevented where it actually happens instead — `speak()` cancels the utterance in flight, so a
// fast run of taps simply speaks the newest count, which is the right number to hear anyway.
const TAP_LOCK_MS = 260
const COUNT_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']
const MARCH_MS = 2800          // Milo and the chosen group walking off, fully out of frame
const HOLD_MS = 1100           // how long the finished group stays on screen before they leave

/** Milo leads in every habitat, but a walking pony on a seabed is the same "doesn't belong" fault
 *  as an emoji in a painted scene — under water he swims instead. (No sheet for the underwater
 *  pose, so Critter draws him still, which is correct: he is waiting, not walking.) */
const MILO_LAND = '/assets/characters/milo_side.png'
const MILO_REEF = '/assets/characters/milo_underwater.png'
const JOURNEY = { from: '🐾', to: '🏡' }
const INTRO = 'Milo is walking the little ones home — but only the number he asks for! Watch how he counts them out.'

/** Fixed SLOTS rather than a row that re-packs — see clusterSpot. The band itself lives in
 *  ./critters so the invariant sweep measures the real numbers rather than a copy of them. */
const gatherSpot = (k: number, w: Habitat, mx: number): Spot =>
  clusterSpot(k, w, mx - 6, GATHER_COL, GATHER_LEFT)
/**
 * Chapter 4's own bands, per habitat. Chapter 2 can put its leader straight onto the line because
 * the leader IS one of them — a mother butterfly belongs at a butterfly's height. Milo is a pony,
 * and dropping a pony onto a flier's band put him hovering over the hedge at the edge of the frame,
 * which is precisely the "he read as clutter" note that got him cut from chapter 2 in the first
 * place. So the leader gets a GROUND line of its own, and in the sky the gathered set comes DOWN
 * of its own, BELOW the group it is gathering.
 *
 * Depth stays consistent across all three: the waiting set is nearest the camera (lowest, biggest),
 * the gathered set is further back (higher, drawn at 0.8), and the leader stands nearest of all. An
 * earlier pass had the sky flock waiting ABOVE its gathering point, which inverted the cue — they
 * arrived lower AND smaller at once, and a child reading depth off size then gets the opposite
 * answer from the one they read off height.
 *
 * Chapter 2's HABITATS are deliberately NOT touched: it is shipped and verified across 330
 * geometry combinations, and perturbing its bands to suit a new chapter would put that at risk.
 */
const BANDS: Record<Habitat['move'], { lead: number; cluster: number; wait: [number, number] }> = {
  land: { lead: 92, cluster: 72, wait: [82, 92] },   // open grass; unchanged from chapter 2
  swim: { lead: 76, cluster: 46, wait: [64, 76] },   // he swims, so the near band is right for him
  air:  { lead: 88, cluster: 54, wait: [64, 76] },   // Milo on the grass, the flock over it
}
/** The habitat as THIS chapter uses it, before fitBands trims it to the room available. */
const bandsFor = (w: Habitat): Habitat => {
  const b = BANDS[w.move]
  return { ...w, lineY: b.cluster, waitY0: b.wait[0], waitY1: b.wait[1] }
}
const miloSpot = (leadY: number, mx: number): Spot => ({ left: mx, top: leadY, scale: MILO_SCALE })
/** How far they have to go to leave the picture COMPLETELY — measured from the LEFTMOST of them,
 *  or the tail of the group is still standing in frame when Milo is already gone. */
const marchDistance = () => 122 - GATHER_LEFT

/** One question: how many Milo asks for, how many little ones are actually there (always more),
 *  and which creature they are — the cast rotates every round. */
interface HomeRound { scene: string; target: number; pool: number; castIdx: number }

/**
 * The number Milo is asking for, on a painted marker above him. Same cream-and-ink idiom as the
 * counting chapter's tally and chapter 2's number tags, so a child moving between chapters reads
 * it the same way — and deliberately NOT a white UI pill, because this one sits inside the picture.
 * It stays up the whole round: a three-year-old should never have to remember the question.
 */
function AskSign({ n, size, lit, wrong }: { n: number; size: number; lit: boolean; wrong: boolean }) {
  const d = Math.max(46, Math.round(size * 0.58))
  return (
    <span aria-hidden style={{ position: 'absolute', left: '50%', top: -d * 0.74, transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: d, height: d, padding: '0 10px',
      borderRadius: 18, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: d * 0.66, lineHeight: 1,
      background: lit ? 'radial-gradient(circle at 38% 30%, #e9f8d2, #bfe3a0)' : 'radial-gradient(circle at 38% 30%, #fdf4e0, #ecdcbc)',
      color: lit ? '#3f6b1e' : '#5b3f22',
      animation: wrong ? 'ht_shake .45s ease' : 'none',
      boxShadow: 'inset 0 -3px 4px rgba(90,64,34,.22), 0 3px 7px rgba(40,30,18,.34)' }}>{n}</span>
  )
}

// ─── Sizing ──────────────────────────────────────────────────────────────────────────
function useSizes(n: number) {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const baby = Math.round(Math.max(short ? 54 : 66, Math.min((vw * 0.86) / n, vh * (short ? 0.28 : 0.24), 152)))
  return { baby, short, vw, vh }
}

// ─── The scene ───────────────────────────────────────────────────────────────────────
/** One surface for the demo, the guided round and the scored round — they differ only in who is
 *  doing the tapping, so they must not be three different pictures. */
type Mode = 'demo' | 'guided' | 'practice'
const HomeScene: React.FC<{ data: HomeRound; mode: Mode; onDone: (correct: boolean) => void }> =
({ data, mode, onDone }) => {
  const { target, pool } = data
  const kind = kindAt(data.castIdx)
  const world = homeOf(kind)
  const { baby: baseSize, vw, vh } = useSizes(pool)

  // Same order of operations as chapter 2, and it matters: Milo's place comes from the UNCAPPED
  // size (an over-estimate, so he always fits), that fixes how much room the huddle has, and only
  // then is the sprite capped to its slot. Sizing on HEIGHT alone drew wide creatures (a ladybug
  // is 1.47× wider than tall, a shark 1.75×) far wider than their slot and they buried each other.
  const aspect = aspectOf(kind.src)
  const rawSize = baseSize * (kind.scale ?? 1)
  const miloSrc = world.move === 'swim' ? MILO_REEF : MILO_LAND
  const mx = leadX(MILO_X, rawSize, aspectOf(miloSrc), MILO_SCALE, vw)
  const edgePct = (rawSize * aspect / 2) / Math.max(1, vw) * 100
  const spanPct = huddleGeom(pool, HUDDLE_RIGHT, edgePct).span
  const rows = huddleRows(spanPct, (rawSize * aspect) / Math.max(1, vw) * 100)
  const slotPx = spanPct * rows / 100 * vw
  const babySize = Math.round(Math.max(40, Math.min(rawSize, (slotPx / aspect) * 0.98)))
  const band: Habitat = fitBands(bandsFor(world), vh, babySize, MILO_SCALE)
  // The leader stands lower than the gathered set, so his own line needs the same floor: feet above
  // the Ready button, and never above the band the group is standing on.
  const leadY = Math.max(band.lineY + 4, Math.min(BANDS[world.move].lead, (vh - STRIP_PX) / vh * 100))

  // Which pool members are with Milo, and which gather slot each of them holds. Slot is claimed at
  // JOIN time and freed when one walks back, so the next joiner fills the hole and the group stays
  // compact without anyone ever teleporting.
  const [slots, setSlots] = useState<Record<number, number>>({})
  const slotsRef = useRef<Record<number, number>>({})
  const [travelling, setTravelling] = useState<Record<number, Journey>>({})   // index → its own journey
  const [returning, setReturning] = useState<Record<number, boolean>>({})
  const [idleHop, setIdleHop] = useState<number | null>(null)
  const [marching, setMarching] = useState(false)
  const [wrongSign, setWrongSign] = useState(false)
  const [hint, setHint] = useState<'take' | 'ready' | null>(null)
  const erred = useRef(false), done = useRef(false), wrongLock = useRef(false), tapLock = useRef(false)
  // Set the moment Ready is accepted. `done` cannot do this job — it is what setOff guards on, so
  // it must stay false until the group actually leaves — and tapLock is cleared by whichever tap
  // timer happens to be pending, which during the hold is the wrong answer to "can they still tap".
  const committed = useRef(false)
  const timers = useRef<number[]>([])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  // The dashed nudge in the guided round follows the first little one still WAITING — pinned to
  // index 0 it vanished the moment that one had been sent.
  const hintIdx = Array.from({ length: pool }, (_, i) => i).find(i => slots[i] === undefined) ?? -1

  // A waiting little one takes the odd hop. This is what keeps the scene alive without moving
  // anything the child is still counting — the hop is in place and over in half a second.
  useEffect(() => {
    if (marching) return
    const id = window.setInterval(() => {
      const idle = Array.from({ length: pool }, (_, i) => i).filter(i => slotsRef.current[i] === undefined)
      if (!idle.length) return
      const pick = idle[Math.floor(Math.random() * idle.length)]
      setIdleHop(pick)
      window.setTimeout(() => setIdleHop(h => (h === pick ? null : h)), 600)
    }, 2600)
    return () => window.clearInterval(id)
  }, [pool, marching])

  const spotOf = useCallback((i: number, slot: number | undefined): Spot =>
    slot === undefined ? waitSpot(i, pool, band, HUDDLE_RIGHT, edgePct, rows) : gatherSpot(slot, band, mx),
  [pool, band, edgePct, rows, mx])

  /** Send one little one over to Milo. Timed from ITS OWN journey, so its leg cycle and the ground
   *  it covers always agree — the one number that has to be shared or the feet skate. */
  const send = useCallback((i: number) => {
    // The slot is claimed from the REF, which updates synchronously: off state, two quick taps read
    // the same stale length and both walk to the same place.
    const used = new Set(Object.values(slotsRef.current))
    let slot = 0; while (used.has(slot)) slot++
    const j = journeyOf(spotOf(i, undefined), gatherSpot(slot, band, mx), vw, vh, babySize, kind.src)
    slotsRef.current = { ...slotsRef.current, [i]: slot }
    setSlots(slotsRef.current)
    setTravelling(t => ({ ...t, [i]: j }))
    after(j.ms, () => setTravelling(t => { const next = { ...t }; delete next[i]; return next }))
  }, [after, spotOf, band, mx, vw, vh, babySize, kind.src])

  /** Send one back to the others. The return is a journey too — and it faces the other way, which
   *  is the whole reason `facingLeft` exists on Critter. */
  const sendBack = useCallback((i: number) => {
    const slot = slotsRef.current[i]
    if (slot === undefined) return
    const j = journeyOf(gatherSpot(slot, band, mx), spotOf(i, undefined), vw, vh, babySize, kind.src)
    const next = { ...slotsRef.current }; delete next[i]
    slotsRef.current = next
    setSlots(next)
    setTravelling(t => ({ ...t, [i]: j }))
    setReturning(r => ({ ...r, [i]: true }))
    after(j.ms, () => {
      setTravelling(t => { const n2 = { ...t }; delete n2[i]; return n2 })
      setReturning(r => { const n2 = { ...r }; delete n2[i]; return n2 })
    })
  }, [after, spotOf, band, mx, vw, vh, babySize, kind.src])

  /** Exactly right — Milo walks them home, and THAT is the reward for the round. The spares stay
   *  behind, which is the point made one last time: only the number he asked for went. */
  const setOff = useCallback(() => {
    if (done.current) return; done.current = true
    setMarching(true)
    if (mode !== 'practice') speak(`${target}! Just right. Off we go!`)
    after(MARCH_MS - 200, () => onDone(mode === 'practice' ? !erred.current : true))
  }, [mode, target, onDone, after])

  // The demo drives words and movement from ONE narration, so they can never drift apart — and
  // when audio is blocked speakSteps still paces the steps on a timer.
  const ran = useOnceGuard()
  useEffect(() => {
    if (mode !== 'demo') {
      if (mode === 'guided') { setHint('take'); speak(`Now you! Milo needs exactly ${target} ${target === 1 ? kind.little : kind.plural}.`) }
      return
    }
    if (ran.current) return; ran.current = true
    const lines = [
      `Milo needs exactly ${target} ${kind.plural} to walk home.`,
      ...Array.from({ length: target }, (_, k) => `${COUNT_WORDS[k + 1] ?? k + 1}.`),
      `That is ${target}. Milo has enough — so he STOPS, even though there are more.`,
      'Ready! Off we go.',
    ]
    const cancel = speakSteps(lines, {
      onStep: (i) => {
        if (i === 0) return
        const k = i - 1
        if (k < target) send(k)
        else if (k === target) setHint('ready')
        else { setHint(null); setOff() }
      },
    })
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tap(i: number) {
    // A tap waits for nothing except a double-tap guard. It does NOT wait for the previous little
    // one to arrive — a child who has already picked the next should not have to watch the first
    // walk — and it does not wait for Milo's voice either; see TAP_LOCK_MS.
    if (mode === 'demo' || done.current || committed.current || tapLock.current) return
    tapLock.current = true
    after(TAP_LOCK_MS, () => { tapLock.current = false })
    if (slotsRef.current[i] === undefined) {
      // Counting out loud is the skill being practised, so the number spoken is the one this little
      // one WILL be — claimed from the ref, so it stays right even mid-journey.
      speak(String(Object.keys(slotsRef.current).length + 1))
      send(i)
      if (hint === 'take' && Object.keys(slotsRef.current).length >= target) setHint('ready')
    } else {
      speak('Back you go.')
      sendBack(i)
    }
  }

  function ready() {
    if (mode === 'demo' || done.current || committed.current) return
    const have = Object.keys(slotsRef.current).length
    // Hold on the finished group before they leave. That row IS the answer the child just counted
    // out, and setting off immediately would snatch it away before a three-year-old can look at it.
    if (have === target) { committed.current = true; setHint(null); after(HOLD_MS, setOff); return }
    // A Ready tapped with nobody chosen is a mis-tap, not a wrong answer — it is never counted
    // against the child, it just says what to do.
    if (have > 0 && mode === 'practice') erred.current = true
    setWrongSign(true); after(500, () => setWrongSign(false))
    if (!wrongLock.current) {
      wrongLock.current = true
      speak(have === 0
        ? `Tap the ${kind.plural} to send them to Milo.`
        : have < target
          ? `That is only ${have}. Milo needs ${target} — send some more!`
          : `That is ${have} — too many! Milo needs ${target}. Tap one to send it back.`)
      after(1800, () => { wrongLock.current = false })
    }
  }

  // Everyone who is going slides off on ONE shared offset, so the group keeps its shape and reads
  // as a procession rather than a scatter. The exit covers far more ground per second than a
  // stroll, so each cycle is sped up by exactly that ratio — the only way the feet stay locked to
  // the ground on the way out.
  const marchDx = marching ? marchDistance() : 0
  const cycleFor = (src: string, h: number) =>
    Math.max(1, (marchDistance() / 100 * vw) / (MARCH_MS / 1000) / groundSpeed(src, h))
  const milo = miloSpot(leadY, mx)

  return (
    <>
      <Critter src={miloSrc} at={{ ...milo, left: milo.left + marchDx }} size={babySize} move={world.move} z={26}
        durMs={MARCH_MS} cycleScale={cycleFor(miloSrc, babySize * MILO_SCALE)} moving={marching}
        // He watches them come in — they arrive from his left — and only turns to lead the way
        // once everyone is gathered. A leader with his back to the thing the child is doing reads
        // as scenery rather than as the person who asked.
        facingLeft={!marching} breathe={!marching}>
        {/* `lit` is tied to the SET-OFF, not to the running count. Lighting up the moment the
            count happens to match hands the answer over: a child learns to add one, glance at the
            sign, add one, glance — and never counts anything. It turns green as they leave, which
            is confirmation of an answer already given. */}
        <AskSign n={target} size={babySize * MILO_SCALE} lit={marching} wrong={wrongSign} />
      </Critter>

      {Array.from({ length: pool }, (_, i) => i).map(i => {
        const slot = slots[i]
        const withMilo = slot !== undefined
        const base = spotOf(i, slot)
        const at = { ...base, left: base.left + (withMilo ? marchDx : 0) }
        const isTravelling = travelling[i] !== undefined
        return (
          <React.Fragment key={i}>
            {/* Draw order is depth, stated outright rather than derived from a coordinate: the
                gathered group sits furthest back (24), Milo just in front of it (26), and the
                waiting huddle nearest — with its FRONT row above its back row. */}
            <Critter src={kind.src} facesLeft={kind.facesLeft} at={at} size={babySize} move={world.move}
              z={withMilo ? 24 : 30 + (i % 2) * 2}
              durMs={marching ? MARCH_MS : (travelling[i]?.ms ?? TRAVEL_MIN)}
              cycleScale={marching ? cycleFor(kind.src, babySize * 0.8) : (travelling[i]?.cycleScale ?? 1)}
              moving={isTravelling || (marching && withMilo)}
              facingLeft={!!returning[i]}
              breathe={!withMilo && !isTravelling} hop={idleHop === i}
              dim={withMilo && !marching} />
            {/* The hit area is a plain button over the creature — the sprite itself stays
                pointer-transparent so a tap can never be swallowed by a flipped inner wrapper. */}
            {mode !== 'demo' && !marching && (
              <button onClick={() => tap(i)}
                aria-label={withMilo ? `send ${kind.little} back` : `send ${kind.little} to Milo`}
                style={{ position: 'fixed', left: `${at.left}%`, top: `${at.top}%`, transform: 'translate(-50%,-100%)',
                  zIndex: 40, width: Math.max(46, Math.round(babySize * at.scale * 1.05)), height: Math.max(46, Math.round(babySize * at.scale * 1.15)),
                  padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                  outline: hint === 'take' && i === hintIdx ? '4px dashed rgba(242,107,44,.75)' : 'none',
                  outlineOffset: 4, borderRadius: 18 }} />
            )}
          </React.Fragment>
        )
      })}

      {/* The commit. Nothing else in the scene knows when the answer is finished — deciding that
          IS the skill, so it has to be a deliberate act and not a side effect of the last tap.
          
          AND IT LOOKS THE SAME AT EVERY COUNT. An earlier pass turned it green once `chosen` hit
          the target, which quietly replaced the whole chapter with a hot/cold game: tap, check the
          button, tap, check — the child waits for the colour and never counts. Any signal that the
          set is right BEFORE they commit is the answer, handed over. (Same reason the teen band
          rejected a balance beam that tilts live while you dial x.) The only cue left is the guided
          round's one-time nudge, which teaches the gesture on a round that is not scored. */}
      {!marching && (
        <button onClick={ready} disabled={mode === 'demo'}
          style={{ position: 'fixed', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 46,
            padding: '9px 30px', borderRadius: 999, cursor: mode === 'demo' ? 'default' : 'pointer',
            background: 'var(--paper)', color: 'var(--milo-orange)', border: '3px solid var(--milo-orange)',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18,
            boxShadow: '0 4px 0 rgba(242,107,44,.28)',
            animation: mode === 'guided' && hint === 'ready' && !done.current ? 'ht_nudge 1.1s ease-in-out infinite' : 'none' }}>
          Ready! 🔔
        </button>
      )}
    </>
  )
}

// ─── The journey strip — what makes ten rounds ONE trip ──────────────────────────────
/** Lives OUTSIDE the round: SkillBeat rebuilds the scene every round, so anything drawn inside it
 *  resets. Sits top-right rather than along the bottom, because down there it would fight the
 *  Ready button for the same 56px of screen. */
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
function makeRound(d: 1 | 2 | 3, round: number): HomeRound {
  // The cast index picks the creature AND, through its habitat, which backdrops are even eligible —
  // a fish cannot walk home across a lawn. The scene advances on its own cycle so the same creature
  // is not always seen against the same picture.
  const castIdx = round % CAST.length
  const home = homeOf(kindAt(castIdx))
  const scene = home.scenes[round % home.scenes.length]
  // There must ALWAYS be spares. A pool that empties at exactly the target does the stopping for
  // the child, which is the one thing this chapter is asking them to do — and the top tier gets the
  // most spares, so the temptation grows with the count.
  const spares = d === 1 ? 2 : d === 2 ? 2 : 3
  // 7 is the ceiling, not 10: the pool is target + spares and ten creatures is already as many as
  // a short landscape phone can hold at a legible size.
  const target = Math.min(matchTarget(d), d === 3 ? 7 : 6)
  return { scene, target, pool: Math.min(10, target + spares), castIdx }
}

export function makeHomeBeat(): Beat<HomeRound> {
  return {
    skillId: 'matchingQuantities', rounds: 10, walkEvery: 3,
    make: (d, round = 0) => makeRound((d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.target}`,   // dedupe on the quantity asked for, not the rotating cast or scene
    prompt: d => `Send Milo exactly ${d.target} ${d.target === 1 ? kindAt(d.castIdx).little : kindAt(d.castIdx).plural}.`,
    say: d => `Milo needs exactly ${d.target} ${d.target === 1 ? kindAt(d.castIdx).little : kindAt(d.castIdx).plural}. Tap them one by one, then tap Ready.`,
    Play: ({ data, onSubmit }) => <HomeScene data={data} mode="practice" onDone={onSubmit} />,
    Reteach: ({ data, onDone }) => <HomeScene data={data} mode="demo" onDone={() => onDone()} />,
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const HT_CSS = `
@keyframes ht_shake { 0%,100%{transform:translateX(-50%)} 25%{transform:translateX(-50%) rotate(-6deg)} 75%{transform:translateX(-50%) rotate(6deg)} }
@keyframes ht_nudge { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.07)} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
const TOTAL_ROUNDS = 10

export default function HomeTime({ onFinish, onExit }: {
  world?: string     // accepted for the /story route's shared signature; the chapter is one world
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useChapterPhase<Phase>('intro', { chapter: 'matchingQuantities', phase: 'practice' })
  const [scene, setScene] = useState<string>(HABITATS.meadow.scenes[0])
  const [homeStage, setHomeStage] = useState(0)
  const { exit, tally } = useChapterShell(onFinish, onExit)

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeHomeBeat(), [])

  // The demo and the guided round deliberately use DIFFERENT habitats, so the first thing a child
  // learns is that the place changes but the rule does not. Both carry spares, because a demo
  // where the last one is taken is a demo of picking them ALL up, not of stopping.
  const DEMO_ROUND: HomeRound = { scene: HABITATS.meadow.scenes[0], target: 3, pool: 6, castIdx: 0 }
  const GUIDED_ROUND: HomeRound = { scene: HABITATS.reef.scenes[0], target: 2, pool: 5, castIdx: 1 }
  const bgScene = phase === 'practice' ? scene : phase === 'guided' ? GUIDED_ROUND.scene : DEMO_ROUND.scene
  const allScenes = useMemo(() => Object.values(HABITATS).flatMap(h => h.scenes), [])

  // Landscape-first: they walk ACROSS the picture, which a portrait phone has no room for. This
  // early return has to sit BELOW every hook — above one, turning the phone changes the hook count
  // and React tears the chapter down into the error boundary.
  if (needsRotate) return <RotateGate line="Milo walks the little ones home in landscape! 🐴" />

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{CRITTER_CSS}{HT_CSS}</style>
      <Background scene={bgScene} scenes={allScenes} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '74%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {INTRO}
          </div>
          <button onClick={() => setPhase('demo')}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner('Watch Milo count them out')}
        <HomeScene key="demo" data={DEMO_ROUND} mode="demo" onDone={() => setPhase('guided')} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Send exactly 2')}
        <HomeScene key="guided" data={GUIDED_ROUND} mode="guided" onDone={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (<>
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data, round) => { if (data?.scene) setScene(data.scene as string); setHomeStage(round) }}
            onComplete={tally} />
        </div>
        <MapStrip done={homeStage} total={TOTAL_ROUNDS} />
      </>)}
    </div>
  )
}
