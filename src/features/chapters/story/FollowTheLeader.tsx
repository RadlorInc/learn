'use client'
/**
 * Chapter 2 — number ORDER (skill `numberOrdering`), as FOLLOW THE LEADER.
 *
 * The little ones are scattered and mother is waiting to set off. They line up SMALLEST FIRST:
 * tap the smallest and that one really travels — its drawn walk cycle running the whole way —
 * and falls in behind her. Tap the wrong one and it just wriggles where it is; it is not its turn.
 * When the last one is in place the whole family marches off together.
 *
 * WHY THIS STORY AND NOT THE STEPPING STONES IT REPLACED: numbered stones are dead props. They
 * cannot be animated, they cannot be drawn in the backdrop's own painted style without bespoke art
 * per scene, and a numbered disc on a painted pond reads as a sticker no matter how it is shaded.
 * Numbered CREATURES solve all three at once — they are already painted in the app's style, they
 * already have drawn cycles, and they are alive on screen before anything is tapped.
 *
 * AND THE FINISHED LINE IS THE ANSWER. Every other shape this chapter could take (a slide queue, a
 * boat that fills up) consumes the answers as they are given. Here the round ends with 1·2·3·4·5
 * standing in a row — for a chapter whose entire skill is ORDER, that is the picture the child
 * should be left looking at.
 *
 * The rules chapters 1 and 3 established, all still in force:
 *   • The background holds perfectly still. Nothing scrolls, nothing parallaxes.
 *   • Nothing MOVES a creature the child still has to read. Waiting little ones hold their place
 *     (cycle paused, breathing, with the odd idle hop); only the one that has just been chosen
 *     travels, and by then it has been read.
 *   • The tap causes a journey, and the journey is the reward.
 *   • The scene must not be the same at question 10 as at question 1 — hence the map strip: the
 *     ten rounds are ONE walk home, and each family that sets off advances it a stage.
 *
 * Difficulty grows the SET to order, never the arithmetic: 3 consecutive numbers → up to 5, and at
 * the top tier they stop being consecutive (2·5·9), so the child has to compare rather than recite
 * the count sequence.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { speak, speakSteps, stopSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { seqLength } from '@/core/progression'
import { useViewport } from '@/shared/hooks/useViewport'
import { SHEETS } from './canvas/sheets'
import { useNeedsRotate, RotateGate } from './RotateGate'
import {
  type Habitat, type Spot, HABITATS, CAST, kindAt, homeOf, aspectOf,
  Background, Critter, CRITTER_CSS, huddleGeom, huddleRows, waitSpot, leadX, fitBands,
  groundSpeed, journeyOf, TRAVEL_MIN, type Journey, maxSizeForRows, spreadBand,
} from './critters'
import { rint, shuffle } from '@/core/rand'
import { useOnceGuard } from '@/shared/hooks/useOnceGuard'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'

// Just long enough to swallow a double-tap. It is deliberately NOT tied to Milo's voice: measured
// live in Chrome, `speechSynthesis.speaking` stays true for over 3.2 SECONDS after a single spoken
// digit, and the watchdog that eventually clears it has a 6s ceiling. Gating taps on that made a
// child wait seconds between little ones — the exact sluggishness this chapter was already
// corrected for once. Overlap is prevented where it actually happens instead: `speak()` cancels the
// utterance in flight, so a quick run of taps simply speaks the newest number.
const TAP_LOCK_MS = 260
const MARCH_MS = 2800          // the whole family walking off together, fully out of frame

// ─── The cast and where each of them lives ───────────────────────────────────────────
/**
 * ONE chapter, not three worlds behind a picker. Every question draws a different creature from a
 * different habitat, so no two questions in a run look alike — which is the whole reason the cast
 * exists. Split across three separate worlds a child saw one habitat per sitting and the same three
 * creatures cycling; merged, ten rounds are ten different pictures.
 *
 * The cast, the habitats and the bands they may stand in live in ./critters — shared with the
 * other creature chapters so a fix to the walk lands in all of them at once.
 */
const JOURNEY = { from: '\ud83d\udc3e', to: '\ud83c\udfe0' }
const INTRO = 'The little ones are going home! They line up SMALLEST first. Watch how they do it.'

/** One question: the numbers the little ones wear (in the order they happen to be standing), and
 *  WHICH little ones they are — the cast rotates every round. */
interface LineRound { scene: string; nums: number[]; castIdx: number }

// ─── Layout ──────────────────────────────────────────────────────────────────────────
/**
 * Two places a little one can be: WAITING (spread across the foreground, nearer the camera so it
 * is big and easy to read) or IN LINE (up on the path behind mother, further away and smaller).
 * The size difference is doing real work — the line reads as somewhere else in the scene, not as
 * a second row of the same thing.
 */
// Mother stands further right and the line packs tighter than it used to. Both exist to buy the
// waiting huddle room: the huddle must end left of the LAST place in the line (or a creature would
// travel backwards into it), so every % the line gives back is a % the huddle can spread over.
// A tighter line is also truer — animals queueing nose-to-tail overlap slightly.
const MOTHER_X = 94          // where mother stands if she fits; pulled left when she does not
const LINE_GAP = 9
const MOTHER_SCALE = 1.25

/**
 * WAITING is a huddle on the LEFT; the line forms to the RIGHT of it. That ordering is not
 * decoration — it is what makes the animation read.
 *
 * The first build spread the waiting ones across the whole width, so a creature standing to the
 * RIGHT of its line place travelled BACKWARDS into it while its legs ran forwards. Moonwalking,
 * and it looked wrong even to someone who could not say why. Every waiting spot now sits left of
 * the leftmost place in the line, so every journey is left→right — the way they face, the way
 * their feet go.
 */
/**
 * The huddle waits on the LEFT and the line forms to its RIGHT — the geometry lives in ./critters,
 * and what this chapter states is only where the LINE ends up, i.e. how much room the huddle has
 * left over. `- LINE_GAP * n - 4` is exactly that: whatever the line will not need.
 */
const lineRight = (n: number, mx: number) => mx - LINE_GAP * n - 4

function lineSpot(k: number, w: Habitat, mx = MOTHER_X): Spot {
  return { left: mx - LINE_GAP * (k + 1), top: w.lineY, scale: 0.78 }
}
const motherSpot = (w: Habitat, mx = MOTHER_X): Spot => ({ left: mx, top: w.lineY, scale: MOTHER_SCALE })

/** How far the family has to travel to leave the picture COMPLETELY. Sized off the tail of the
 *  line, not off mother — a fixed offset walked her off screen while the last two were still
 *  standing there, so the round ended with half the family stranded mid-exit. */
const marchDistance = (n: number, mx = MOTHER_X) => 122 - (mx - LINE_GAP * n)

/** The number a little one is wearing. Floats just above it, exactly as the counting chapter puts
 *  its count above each parading creature — same idiom, so a child moving between chapters reads
 *  it the same way. Painted cream, not a white UI pill: this sits inside the picture. */
function NumberTag({ n, size, lit }: { n: number; size: number; lit: boolean }) {
  const d = Math.max(24, Math.round(size * 0.42))
  return (
    <span aria-hidden style={{ position: 'absolute', left: '50%', top: -d * 0.72, transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: d, height: d, padding: '0 6px',
      borderRadius: 999, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: d * 0.64, lineHeight: 1,
      background: lit ? 'radial-gradient(circle at 38% 30%, #e9f8d2, #bfe3a0)' : 'radial-gradient(circle at 38% 30%, #fdf4e0, #ecdcbc)',
      color: lit ? '#3f6b1e' : '#5b3f22',
      boxShadow: 'inset 0 -2px 3px rgba(90,64,34,.2), 0 2px 5px rgba(40,30,18,.32)' }}>{n}</span>
  )
}

// ─── Sizing ──────────────────────────────────────────────────────────────────────────
/**
 * The whole layout chain for one round, as ONE pure function — the sweep in src/__tests__ drives
 * THIS, not a second copy of the constants, so a check cannot agree with itself while the screen
 * it protects falls apart.
 *
 * Order matters and there is no circularity: mother's place is fixed from the UNCAPPED size (an
 * over-estimate, so she always fits), that fixes how much room the huddle has, and only then is
 * the sprite capped — to its slot horizontally and to the room two SEPARATED rows need vertically.
 */
export function lineLayout(vw: number, vh: number, n: number, castIdx: number) {
  const kind = kindAt(castIdx)
  const world = homeOf(kind)
  const short = vh < 470
  const baseSize = Math.round(Math.max(short ? 62 : 78, Math.min((vw * 0.8) / n, vh * (short ? 0.30 : 0.26), 168)))
  // Cap the sprite to the width it actually has in the huddle. A ladybug is 1.47× wider than it is
  // tall and a turtle 1.53×, so sizing on HEIGHT alone drew them far wider than their slot and they
  // buried each other — which is exactly when a child cannot tell which number belongs to which.
  const aspect = aspectOf(kind.src)
  const rawSize = baseSize * (kind.scale ?? 1)
  const mx = leadX(MOTHER_X, rawSize, aspect, MOTHER_SCALE, vw)
  const edgePct = (rawSize * aspect / 2) / Math.max(1, vw) * 100
  const spanPct = huddleGeom(n, lineRight(n, mx), edgePct).span
  // NO floor on the slot. A `Math.max(span*2, 15)` floor here was the actual reason the huddle
  // crowded: it sized sprites for 15% of the width while spacing them by less than that, so they
  // were guaranteed to overlap exactly when the huddle was tightest.
  //
  // TWO ROWS, NEVER THREE — the same call PlayTime and BigOrSmall already make. A third row is only
  // room if the rows are far enough apart to READ as rows, and in these shallow bands they are not:
  // measured on turtles (1.53:1) at 640×320 with four little ones, three rows sat SEVEN pixels apart
  // under a 91px sprite, so they simply buried each other's number. A tester reported exactly that —
  // "the turtles are lined up very close to each other, I was unable to see all the numbers". This
  // chapter has to be read all at once to find the smallest, so a number that cannot be read is a
  // wrong answer the chapter caused.
  const rows = Math.min(2, huddleRows(spanPct, (rawSize * aspect) / Math.max(1, vw) * 100))
  const slotPx = spanPct * rows / 100 * vw
  // 40px floor. It only ever binds in one corner — five SHARKS (1.75:1, the widest sprite in the
  // cast) at tier 3 on a small short-landscape phone — and even there the hit area stays at 46px,
  // above the 44px tap-target minimum, and the number tag at its own 24px floor. A slightly bigger
  // creature sitting on top of its neighbour's NUMBER is the worse trade: the number is the question.
  //
  // `maxSizeForRows` is the vertical half of that same trade, and leaving it out is what let the
  // rows collapse: fitBands only proves heads clear the prompt and feet clear the strip, and is
  // perfectly happy to return a band a few pixels tall with both rows on the same line.
  const babySize = Math.round(Math.max(40, Math.min(rawSize, maxSizeForRows(vh, rows), (slotPx / aspect) * 0.98)))
  const band: Habitat = spreadBand(fitBands(world, vh, babySize), vh, babySize, rows)
  return { kind, world, aspect, mx, edgePct, rows, babySize, band, short, vw, vh }
}

// ─── The scene ───────────────────────────────────────────────────────────────────────
/**
 * One surface for the demo, the guided round and the scored round — they differ only in who is
 * doing the tapping, so they must not be three different pictures.
 */
type Mode = 'demo' | 'guided' | 'practice'
const LineScene: React.FC<{ data: LineRound; mode: Mode; onDone: (correct: boolean) => void }> =
({ data, mode, onDone }) => {
  const { nums } = data
  const n = nums.length
  const sorted = useMemo(() => [...nums].sort((a, b) => a - b), [nums])
  const { w: vw, h: vh } = useViewport()
  const { kind, world, mx, edgePct, rows, babySize, band } = lineLayout(vw, vh, n, data.castIdx)

  const [joined, setJoined] = useState<number[]>([])     // values already in line, in join order
  const joinedRef = useRef<number[]>([])                 // same list, readable synchronously mid-tap
  // value → how long ITS journey takes. Several can be under way at once, so this is a map and
  // not a single slot: the child may tap 2 while 1 is still walking.
  const [flying, setFlying] = useState<Record<number, Journey>>({})
  const [wiggling, setWiggling] = useState<number | null>(null)
  const [idleHop, setIdleHop] = useState<number | null>(null)
  const [marching, setMarching] = useState(false)
  const [hint, setHint] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false), wrongLock = useRef(false), tapLock = useRef(false)
  const arrived = useRef(0)
  const timers = useRef<number[]>([])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  // A waiting creature takes the odd little hop. This is what keeps the scene alive without
  // moving anything the child is still reading — the hop is in place and over in half a second.
  useEffect(() => {
    if (marching) return
    const id = window.setInterval(() => {
      const waiting = nums.filter(v => !joined.includes(v))
      if (!waiting.length) return
      const pick = waiting[Math.floor(Math.random() * waiting.length)]
      setIdleHop(pick)
      window.setTimeout(() => setIdleHop(h => (h === pick ? null : h)), 600)
    }, 2600)
    return () => window.clearInterval(id)
  }, [nums, joined, marching])

  /** Send one little one into the line, then hand back when it has arrived. */
  const sendToLine = useCallback((v: number, onArrive?: () => void) => {
    // Timed from THIS creature's own journey, so the leg cycle and the ground always agree — which
    // needs the cycleScale journeyOf returns as well as its duration. The duration alone was a half
    // fix: the clamp routinely overrode it and the legs then ran at a speed the body was not moving.
    // The place in the line is claimed from the REF, which updates synchronously — two quick taps
    // would otherwise read the same stale state and both walk to the same spot.
    const from = waitSpot(nums.indexOf(v), n, band, lineRight(n, mx), edgePct, rows)
    const to = lineSpot(joinedRef.current.length, band, mx)
    const j = journeyOf(from, to, vw, vh, babySize, kind.src)
    joinedRef.current = [...joinedRef.current, v]
    setJoined(joinedRef.current)
    setFlying(f => ({ ...f, [v]: j }))
    after(j.ms, () => {
      setFlying(f => { const next = { ...f }; delete next[v]; return next })
      onArrive?.()
    })
  }, [after, nums, n, band, mx, edgePct, rows, vw, vh, babySize, kind.src])

  /** Everyone is in order — mother leads them off, and THAT is the reward for the round. */
  const marchOff = useCallback(() => {
    if (done.current) return; done.current = true
    setMarching(true)
    if (mode !== 'practice') speak('Off we go! Smallest first.')
    // Ends only once they are actually gone, so the exit plays out instead of being cut off.
    after(MARCH_MS - 200, () => onDone(mode === 'practice' ? !erred.current : true))
  }, [mode, onDone, after])

  // The demo drives words and movement from ONE narration, so they can never drift apart — and
  // when audio is blocked speakSteps still paces the steps on a timer.
  const ran = useOnceGuard()
  useEffect(() => {
    if (mode !== 'demo') { if (mode === 'guided') speak(`Now you! Tap the smallest ${kind.little} first.`); return }
    if (ran.current) return; ran.current = true
    const lines = [
      `${kind.mother} is waiting. The smallest one goes first.`,
      ...sorted.map((v, i) => (i === 0 ? `The smallest is ${v}. Come along, ${v}!` : `Then ${v}.`)),
      'Everybody in line!',
    ]
    const cancel = speakSteps(lines, {
      onStep: (i) => {
        if (i === 0) { setHint(sorted[0]); return }
        const k = i - 1
        if (k < sorted.length) { setHint(sorted[k + 1] ?? null); sendToLine(sorted[k]) }
        else { setHint(null); marchOff() }
      },
    })
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tap(v: number) {
    // A tap waits for nothing but a double-tap guard. It does NOT wait for the previous little one
    // to reach the line — a child who has already found 2 should not be made to watch 1 walk first —
    // and it does not wait for Milo's voice either; see TAP_LOCK_MS.
    if (mode === 'demo' || done.current || tapLock.current) return
    if (joinedRef.current.includes(v)) return
    if (v === sorted[joinedRef.current.length]) {
      tapLock.current = true
      speak(String(v))
      after(TAP_LOCK_MS, () => { tapLock.current = false })
      // Hold on the finished line before they leave. That row IS the answer the child just built,
      // and marching straight off would snatch it away in a third of a second.
      // Counted on ARRIVAL, not on the tap, so the march never starts over a still-walking straggler.
      sendToLine(v, () => { arrived.current += 1; if (arrived.current === n) after(1200, marchOff) })
    } else {
      if (mode === 'practice') erred.current = true
      setWiggling(v)
      if (!wrongLock.current) {
        wrongLock.current = true
        speak(`Not yet! Find the smallest ${kind.little}.`)
        after(1300, () => { wrongLock.current = false })
      }
      after(620, () => setWiggling(w => (w === v ? null : w)))
    }
  }

  // The whole family slides off together on the march — one shared offset, so the line keeps its
  // spacing and reads as a procession rather than a scatter.
  const marchDx = marching ? marchDistance(n, mx) : 0
  // The exit covers far more ground per second than a stroll, so the cycle is sped up by exactly
  // that ratio — chapter 1's lesson, and the only way feet and ground stay locked on the way out.
  const marchCycle = Math.max(1, (marchDistance(n, mx) / 100 * vw) / (MARCH_MS / 1000) / groundSpeed(kind.src, babySize))
  const mother = motherSpot(band, mx)
  const motherAt = { ...mother, left: mother.left + marchDx }

  return (
    <>
      <Critter src={kind.src} facesLeft={kind.facesLeft} at={motherAt} size={babySize} move={world.move} z={26}
        durMs={MARCH_MS} cycleScale={marchCycle} moving={marching} facingLeft={false} breathe={!marching} />

      {nums.map((v, i) => {
        const k = joined.indexOf(v)
        const inLine = k >= 0
        const base = inLine ? lineSpot(k, band, mx) : waitSpot(i, n, band, lineRight(n, mx), edgePct, rows)
        const at = { ...base, left: base.left + (inLine ? marchDx : 0) }
        const isTravelling = flying[v] !== undefined
        return (
          <React.Fragment key={v}>
            {/* Draw order is depth, stated outright: the line sits furthest back (24), mother just
                in front of it (26), and the waiting huddle nearest — with its FRONT row (odd
                indices, lower on screen) above its back row, so no creature can bury the number of
                the one behind it. The number is the whole question. */}
            <Critter src={kind.src} facesLeft={kind.facesLeft} at={at} size={babySize} move={world.move}
              z={inLine ? 24 : 30 + (i % 2) * 2}
              durMs={marching ? MARCH_MS : (flying[v]?.ms ?? TRAVEL_MIN)}
              cycleScale={marching ? marchCycle : (flying[v]?.cycleScale ?? 1)}
              moving={isTravelling || (marching && inLine)} facingLeft={false}
              breathe={!inLine && !isTravelling} hop={idleHop === v} wiggle={wiggling === v}
              dim={inLine && !marching}>
              <NumberTag n={v} size={babySize * at.scale} lit={inLine} />
            </Critter>
            {/* The hit area is a plain button over the creature — the sprite itself stays
                pointer-transparent so a tap can never be swallowed by a flipped inner wrapper. */}
            {!inLine && mode !== 'demo' && (
              <button onClick={() => tap(v)} aria-label={`${kind.little} ${v}`}
                style={{ position: 'fixed', left: `${at.left}%`, top: `${at.top}%`, transform: 'translate(-50%,-100%)',
                  // 44px is a FLOOR, not a ratio: at the 40px sprite floor (five sharks, top tier,
                  // small short-landscape phone) 1.05x came out 42px wide — under the tap minimum on
                  // the narrow axis while the file's comment only ever checked the tall one. The box
                  // stays narrower than the sprite even so, so it cannot reach a neighbour.
                  zIndex: 40, width: Math.max(44, Math.round(babySize * at.scale * 1.05)), height: Math.max(44, Math.round(babySize * at.scale * 1.15)),
                  padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                  outline: hint === v ? '4px dashed rgba(242,107,44,.75)' : 'none', outlineOffset: 4, borderRadius: 18 }} />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}

// ─── The journey strip — what makes ten rounds ONE trip ──────────────────────────────
/** Lives OUTSIDE the round: SkillBeat rebuilds the scene every round, so anything drawn inside it
 *  resets. Each family that sets off moves the walk home one stage further along. */
function MapStrip({ done, total, journey }: { done: number; total: number; journey: typeof JOURNEY }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 46,
      display: 'flex', alignItems: 'center', gap: 7, maxWidth: '92vw',
      background: 'rgba(255,255,255,.72)', border: '3px solid var(--milo-orange)', borderRadius: 999,
      padding: '5px 12px', boxShadow: '0 3px 0 rgba(242,107,44,.22)' }}>
      <span style={{ fontSize: 17 }}>{journey.from}</span>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%',
          background: i < done ? 'var(--milo-orange)' : 'rgba(61,37,22,.2)', transition: 'background .4s' }}>
          {i === done - 1 && <span style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', fontSize: 15 }}>🐴</span>}
        </span>
      ))}
      <span style={{ fontSize: 17, filter: done >= total ? 'none' : 'grayscale(.55) opacity(.75)' }}>{journey.to}</span>
    </div>
  )
}

// ─── Value generation ────────────────────────────────────────────────────────────────
function makeRound(d: 1 | 2 | 3, round: number): LineRound {
  // The cast index picks the creature AND, through its habitat, which backdrops are even eligible —
  // a fish cannot line up on a lawn. Scene advances on its own cycle so the same creature does not
  // always appear against the same picture.
  const castIdx = round % CAST.length
  const home = homeOf(kindAt(castIdx))
  const scene = home.scenes[round % home.scenes.length]
  const len = Math.min(5, seqLength(d))
  // The CEILING is part of the difficulty, not just how many there are. Without this, tier 1 drew
  // its run start from 1–8, so a three-year-old's very first question could be 7·8·9 — bigger,
  // less familiar numbers than 1·2·3, at the tier that is supposed to be the gentlest. Tier 1 now
  // never goes past 5.
  const top = d === 1 ? 5 : 10
  // A consecutive run can be recited straight off the count sequence; a scattered set (2·5·9)
  // forces a real comparison. So the top tier mostly scatters, and tier 1 never does.
  const consecutive = d === 1 ? true : d === 2 ? Math.random() < 0.5 : Math.random() < 0.25
  const nums = consecutive
    ? (() => { const s = rint(1, Math.max(1, top - len + 1)); return Array.from({ length: len }, (_, i) => s + i) })()
    : shuffle(Array.from({ length: top }, (_, i) => i + 1)).slice(0, len)
  return { scene, nums: shuffle(nums), castIdx }
}

export function makeLineBeat(): Beat<LineRound> {
  return {
    skillId: 'numberOrdering', rounds: 10, walkEvery: 3,
    make: (d, round = 0) => makeRound((d || 1) as 1 | 2 | 3, round),
    sig: d => [...d.nums].sort((a, b) => a - b).join(','),   // dedupe on the SET, not its shuffle or the rotating scene
    prompt: () => `Line them up — smallest first!`,
    say: d => `${kindAt(d.castIdx).mother} is ready! Tap the smallest ${kindAt(d.castIdx).little} first.`,
    Play: ({ data, onSubmit }) => <LineScene data={data} mode="practice" onDone={onSubmit} />,
    Reteach: ({ data, onDone }) => <LineScene data={data} mode="demo" onDone={() => onDone()} />,
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
const TOTAL_ROUNDS = 10

export default function FollowTheLeader({ onFinish, onExit }: {
  world?: string     // accepted for the /story route's shared signature; the chapter is one world now
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useChapterPhase<Phase>('intro')
  const [scene, setScene] = useState<string>(HABITATS.meadow.scenes[0])
  const [homeStage, setHomeStage] = useState(0)
  const { exit, tally } = useChapterShell(onFinish, onExit)

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeLineBeat(), [])

  // The demo and the guided round deliberately use DIFFERENT habitats, so the first thing a child
  // learns is that the place changes but the rule does not.
  const DEMO_ROUND: LineRound = { scene: HABITATS.meadow.scenes[0], nums: [3, 1, 2], castIdx: 0 }
  const GUIDED_ROUND: LineRound = { scene: HABITATS.reef.scenes[0], nums: [2, 3, 1], castIdx: 1 }
  const bgScene = phase === 'practice' ? scene : phase === 'guided' ? GUIDED_ROUND.scene : DEMO_ROUND.scene
  const allScenes = useMemo(() => Object.values(HABITATS).flatMap(h => h.scenes), [])

  // Landscape-first: the family walks ACROSS the picture, which a portrait phone has no room for.
  // This early return has to sit BELOW every hook — placed above `allScenes` it changed the hook
  // count the moment the phone was turned, and React tore the chapter down into the error boundary.
  if (needsRotate) return <RotateGate line="Milo&apos;s little ones line up in landscape! 🐴" />

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{CRITTER_CSS}</style>
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

      {phase === 'demo' && (<>{Banner('Watch them line up')}
        <LineScene key="demo" data={DEMO_ROUND} mode="demo" onDone={() => setPhase('guided')} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Smallest first')}
        <LineScene key="guided" data={GUIDED_ROUND} mode="guided" onDone={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (<>
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data, round) => { if (data?.scene) setScene(data.scene as string); setHomeStage(round) }}
            onComplete={tally} />
        </div>
        <MapStrip done={homeStage} total={TOTAL_ROUNDS} journey={JOURNEY} />
      </>)}
    </div>
  )
}
