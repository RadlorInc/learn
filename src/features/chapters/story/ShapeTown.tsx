'use client'
/**
 * Chapter 6 — SHAPE recognition (skill `shapes`), as a SHAPE SORTER.
 *
 * WHAT CHANGED AND WHY. This chapter used to be "Milo names a shape, tap it among three" — the same
 * surface as the colours chapter and the patterns chapter with different nouns on it. Three skills,
 * one verb. A shape is not a name, it is an OUTLINE, and the way a three-year-old proves they know
 * one is to FIT it: the shape sorter is the canonical activity for this age and this skill.
 *
 * So the question is now a HOLE in the picture. Milo is building; one socket sits empty and pulsing;
 * the child taps the piece that fits and it FLIES INTO PLACE. Three consequences, all of them the
 * point:
 *   • the question is a picture, so this chapter is answerable WITH THE SOUND OFF — which none of the
 *     three "exact form" chapters were, and Chrome frequently ships no usable TTS at all
 *   • the journey IS the mechanic. The thing that travels is the answer going where it belongs, not
 *     an escort creature commuting to it and back while the child waits
 *   • the arc needs no widget. The build is the scene, so it grows in place instead of ticking over
 *     in a corner card
 * The keeper and the bottom-right house card are both gone; nothing here replaces them.
 *
 * WHAT MAY NOT CHANGE. The pieces and the sockets are the SAME `ShapeSVG` paths, drawn solid and
 * `outline` — so a triangle is matched against a real triangle by construction, and no scaling here
 * is anything but uniform. A squashed roof is not the shape the child tapped.
 *
 * NO WORLD PICKER (founder call, matching chapter 2). One continuous site, and the BUILD changes
 * instead: Milo builds a house in the garden, then walks to the beach and builds a boat. That is
 * what makes round 10 look nothing like round 1.
 *
 * Landscape-first, wrapped by the registry / `?ch=shapes`.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, speakSteps, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { ShapeSVG, SHAPES, SHAPE_ORDER, type ShapeName } from '../lessons/ShapesLesson'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { shuffle } from '@/core/rand'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { SceneBg } from '@/shared/ui/SceneBg'
import { useOnceGuard } from '@/shared/hooks/useOnceGuard'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'
import ReadyBar, { PICKED_RING } from './ReadyBar'

/**
 * The ONLY thing a tap waits for. Deliberately not `useIsSpeaking()`: a wrong tap speaks a line,
 * and `speechSynthesis.speaking` stays true for over three seconds after one — measured live in
 * chapter 4, where gating on it left the screen dead for half a minute in a round wanting several
 * taps. `speak()` already cancels the utterance in flight, so a quick retry simply speaks the
 * newest line, which is the one worth hearing. This lock exists only so one double-tap is not
 * counted twice.
 */
const TAP_LOCK_MS = 260
// A viewport shorter than this is a landscape phone (812×375, 667×375): the prompt banner alone
// owns the top third, so everything below is sized against what is left.
const SHORT_H = 470
/**
 * The top strip the prompt pill owns, measured rather than guessed: the pill sits at `top: 50` and
 * its bottom edge lands at 99px, so 112 is that plus real clearance. Nothing that stands in the
 * scene may reach into it.
 */
const PROMPT_BAND = 112


// The classic look-alike pair — seeded as a distractor at the hardest tier so the child must
// recognize the form rather than eliminate the odd one out.
const TWIN: Partial<Record<ShapeName, ShapeName>> = { square: 'rectangle', rectangle: 'square' }

// ─── The builds ──────────────────────────────────────────────────────────────────────
/**
 * A build is a picture assembled out of the six exact shapes. Coordinates are in units of 1/100 of
 * the build's WIDTH; the box is `aspect` of that tall. Each part's `size` is the ShapeSVG size in
 * the same units, and every number below was derived from where that path's own bbox sits inside
 * its 100×100 viewBox — which is why nothing here needs a non-uniform scale to line up.
 *
 * `parts` is also the BUILD ORDER, and the build order is the question order: wall before roof,
 * hull before sail. It is what a child watching someone build would expect to happen next.
 */
interface Part { name: ShapeName; left: number; top: number; size: number; rotate?: number; label: string }
/**
 * `ground` and `depth` are what stand a build IN its scene rather than on top of it, and they have to
 * be PER BUILD because each backdrop's ground is in a different place — the same lesson chapter 4
 * learned when Milo, dropped on the flier band, ended up hovering in the treetops.
 *
 * `ground` is how far up from the bottom the build's feet rest, as a percent. The garden paints a
 * picket fence across its foreground whose top edge lands 16–20% up (it moves with the `cover` crop),
 * so a house standing at 8% was planted in FRONT of the fence, in the same plane as the near flowers
 * — the fence is in the backdrop image, so no amount of z-index puts it behind; the only way back is
 * further UP the frame. The beach is open water with nothing in front, so its boat stays low.
 *
 * `depth` then does what distance does: further back is SMALLER. Moving the house up without
 * shrinking it would just make a giant house halfway down the lawn.
 */
interface BuildDef { id: string; aspect: number; ground: number; depth: number; bg: string; grad: string; opening: string; parts: Part[] }

export const BUILDS: BuildDef[] = [
  {
    id: 'house', aspect: 1.35, ground: 26, depth: 0.78,
    bg: '/assets/backgrounds/town_garden.jpeg',
    grad: 'linear-gradient(#cdeeff 0%, #e7f6d8 52%, #aedd86 100%)',
    opening: 'Milo is building a house!',
    parts: [
      { name: 'square',    left: 15,   top: 63,   size: 70,   label: 'wall' },
      { name: 'triangle',  left: 14.4, top: 2.4,  size: 71.1, label: 'roof' },
      // The same rectangle bar, stood upright. The rotation lives on the positioned box, never on
      // an element that also carries a keyframe — stack the two and the animation silently wins and
      // lays the door flat (the transform-override trap this codebase has paid for three times).
      { name: 'rectangle', left: 34,   top: 95.5, size: 32, rotate: 90, label: 'door' },
      { name: 'circle',    left: 24.8, top: 78.8, size: 22.5, label: 'window' },
      { name: 'star',      left: 40.3, top: 33.3, size: 19.4, label: 'star on the roof' },
      { name: 'heart',     left: 59.1, top: 83.1, size: 17.8, label: 'heart on the wall' },
    ],
  },
  {
    id: 'boat', aspect: 0.9, ground: 10, depth: 1,
    bg: '/assets/backgrounds/beach_sea.png',
    grad: 'linear-gradient(#bfe9ff 0%, #a9defa 52%, #5fb6e6 100%)',
    opening: 'Now Milo is building a boat!',
    parts: [
      { name: 'rectangle', left: 3,  top: 18, size: 94, label: 'hull' },
      { name: 'triangle',  left: 20, top: -2, size: 56, label: 'sail' },
      { name: 'circle',    left: 26, top: 55, size: 22, label: 'porthole' },
      { name: 'star',      left: 38, top: 12, size: 20, label: 'flag' },
    ],
  },
]

/**
 * Every part of every build, flattened — the chapter's whole question sequence in one list, and the
 * reason the build can never drift out of step with the round number. Step 0 is Milo's worked
 * example, step 1 is the guided one, and the eight scored rounds are steps 2–9, so the two builds
 * finish exactly as the practice does.
 */
interface Step { bi: number; pi: number }
export const SEQUENCE: Step[] = BUILDS.flatMap((b, bi) => b.parts.map((_, pi) => ({ bi, pi })))
const DEMO_STEP = 0, GUIDED_STEP = 1, FIRST_SCORED = 2
const SCORED_ROUNDS = SEQUENCE.length - FIRST_SCORED
// The round the second build starts on, so the walk interlude lands there rather than on a count.
const BUILD_CHANGE_ROUND = SEQUENCE.findIndex(s => s.bi === 1) - FIRST_SCORED

const keyOf = (s: Step) => `${s.bi}:${s.pi}`
const partOf = (s: Step) => BUILDS[s.bi].parts[s.pi]

// ─── Round shape ─────────────────────────────────────────────────────────────────────
interface ShapeRound { seq: number; options: ShapeName[]; answerIdx: number }

function makeShapeRound(d: 1 | 2 | 3, round: number): ShapeRound {
  const seq = Math.min(FIRST_SCORED + round, SEQUENCE.length - 1)
  const target = partOf(SEQUENCE[seq]).name
  const n = d === 1 ? 3 : 4
  let pool = SHAPE_ORDER.filter(s => s !== target)
  if (d === 1 && TWIN[target]) pool = pool.filter(s => s !== TWIN[target])
  const twin = TWIN[target]
  const distractors = (d >= 3 && twin && pool.includes(twin))
    ? shuffle([twin, ...shuffle(pool.filter(s => s !== twin)).slice(0, n - 2)])
    : shuffle(pool).slice(0, n - 1)
  const options = shuffle([target, ...distractors])
  return { seq, options, answerIdx: options.indexOf(target) }
}
const roundForStep = (seq: number, options: ShapeName[]): ShapeRound =>
  ({ seq, options, answerIdx: options.indexOf(partOf(SEQUENCE[seq]).name) })

// ─── Backdrop (cross-fades when the build changes) ───────────────────────────────────
function Background({ buildIdx }: { buildIdx: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#dff0e4' }}>
      {BUILDS.map((b, i) => (
        <div key={b.id} style={{ position: 'absolute', inset: 0, opacity: i === buildIdx ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: b.grad }} />
          <SceneBg src={b.bg} priority={i === buildIdx} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </div>
      ))}
    </div>
  )
}

// ─── Milo, the builder ───────────────────────────────────────────────────────────────
// Far bottom-left and deliberately small: the pieces and the build own the frame, and a big Milo
// beside a pile of parts is the "he read as clutter" note that got him cut from chapter 2.
function MiloBuilder() {
  const [step, setStep] = useState(0)
  const { h: vh } = useViewport()
  const srcs = ['/assets/characters/milo_explorer.png', '/assets/characters/milo_idle.png']
  const dim = vh < SHORT_H ? 'min(24vh, 118px)' : 'min(26vh, 210px)'
  return (
    <div style={{ position: 'fixed', left: '8%', bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: dim, height: dim }}>
      <div style={{ width: '100%', height: '100%', animation: 'bh_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 84, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>🐴</span>
            </div>
          : <img src={srcs[step]} alt="Milo the builder" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

// ─── Sizing ──────────────────────────────────────────────────────────────────────────
// Both numbers are derived, never tuned per screen: the build takes a slice of the HEIGHT (which is
// what is scarce on a landscape phone) and the pieces take a slice of the left column. On a 640×320
// frame the prompt banner already owns the top third, and these two are what has to live in the
// rest without touching each other or Milo.
function useLayout(aspect: number, depth = 1, ground = 8) {
  const { w: vw, h: vh } = useViewport()
  const short = vh < SHORT_H
  // The 0.36 is a CLEARANCE number, not a taste one: the boat is much wider than the house at the
  // same height, and at 0.40 its hull ran to within 11px of the pieces on one side and the screen
  // edge on the other. Cap the width too, so a wide build cannot eat the column beside it.
  // `depth` shrinks a build that stands further back — applied AFTER the clearance caps, so standing
  // something deeper in can only ever give the column beside it more room, never less.
  const raw = Math.min(vh * (short ? 0.54 : 0.56), vw * 0.36 * aspect, 460) * depth
  // AND THEN THE HEADROOM, because raising the build's feet raised its ROOF by the same amount.
  // Standing the house back off the fence pushed its apex to 5px under the prompt pill at 640×320,
  // horizontally overlapping it — one size away from the collision. The build's own height is the
  // only lever left once its feet are fixed by the ground line, so it is capped against the band the
  // prompt actually occupies rather than trusted to fit.
  const buildH = Math.min(raw, Math.max(120, vh * (1 - ground / 100) - PROMPT_BAND))
  const buildW = buildH / aspect
  const pieceBox = Math.round(Math.max(38, Math.min(vw * 0.13, vh * 0.23, 96)))
  return { vw, vh, short, buildW, buildH, pieceBox }
}

// ─── The build ───────────────────────────────────────────────────────────────────────
/**
 * Standing in the scene on its own ground shadow, at real size — not a card in the corner. Three
 * states per part, and the difference between the last two is the whole design:
 *   • BUILT       — solid, and it popped as it landed
 *   • THE SOCKET  — the current question, an outline that pulses. This is a question being STATED,
 *                   not a hint: it says nothing about whether the piece the child is about to tap
 *                   is right, so it cannot go hot/cold the way chapter 4's green Ready button did.
 *   • still to do — a faint ghost, so the goal is legible without competing with the socket
 */
function Build({ buildIdx, built, target, elsRef }: {
  buildIdx: number; built: Set<string>; target: Step | null
  elsRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}) {
  const b = BUILDS[buildIdx]
  const { short, buildW, buildH } = useLayout(b.aspect, b.depth, b.ground)
  const done = b.parts.every((_, pi) => built.has(keyOf({ bi: buildIdx, pi })))
  return (
    <div style={{ position: 'fixed', left: '74%', bottom: `${b.ground}%`, transform: 'translateX(-50%)', zIndex: 28, pointerEvents: 'none' }}>
      <div style={{ position: 'relative', width: buildW, height: buildH,
        filter: done ? 'drop-shadow(0 0 14px var(--garden-green))' : 'drop-shadow(0 5px 7px rgba(0,0,0,.2))', transition: 'filter .5s' }}>
        {b.parts.map((p, pi) => {
          const k = keyOf({ bi: buildIdx, pi })
          const has = built.has(k)
          const isTarget = !has && target?.bi === buildIdx && target?.pi === pi
          const px = (p.size / 100) * buildW
          return (
            // Position + rotation on the OUTER box; every keyframe on an INNER one, so a pulse or a
            // landing pop can never overwrite the door's rotate(90deg).
            <div key={k} ref={el => { elsRef.current[k] = el }}
              style={{ position: 'absolute', left: (p.left / 100) * buildW, top: (p.top / 100) * buildW,
                width: px, height: px, lineHeight: 0, transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined }}>
              <div style={{ width: '100%', height: '100%',
                animation: has ? 'bh_land .5s cubic-bezier(.34,1.56,.64,1) both' : isTarget ? 'bh_socket 1.5s ease-in-out infinite' : undefined,
                // A hole can be seen. The still-to-do parts were at 0.2, which on a painted garden is
                // a hairline that neither reads as part of the house nor disappears — the worst of
                // both. As shadowed sockets they can sit at half strength and still look like the
                // building they belong to; the current one keeps the pulse and the orange rim, so it
                // is still unmistakably the one being asked for.
                opacity: has ? 1 : isTarget ? 1 : 0.5,
                filter: isTarget ? 'drop-shadow(0 0 7px var(--milo-orange)) drop-shadow(0 0 4px var(--milo-orange))' : undefined }}>
                <ShapeSVG name={p.name} size={px} socket={!has} />
              </div>
            </div>
          )
        })}
      </div>
      {/* Contact shadow — the "it is standing here" cue, same as every other grounded thing in the band. */}
      <div aria-hidden style={{ position: 'absolute', left: '50%', bottom: short ? -8 : -12, transform: 'translateX(-50%)',
        width: buildW * 0.8, height: buildW * 0.2,
        background: 'radial-gradient(ellipse at center, rgba(38,28,18,.26) 0%, rgba(38,28,18,0) 72%)' }} />
    </div>
  )
}

// ─── The pieces ──────────────────────────────────────────────────────────────────────
// A pile of parts on the ground between Milo and the build, wrapping two to a row so three reads as
// a heap rather than a quiz row. Each rests on its own contact shadow.
type PieceState = 'idle' | 'wrong' | 'taken' | 'picked'
function PiecePile({ options, stateFor, onTap, boxRef, aspect }: {
  options: ShapeName[]; stateFor: (i: number) => PieceState
  onTap?: (i: number, el: HTMLElement) => void
  boxRef?: React.RefObject<HTMLDivElement | null>; aspect: number
}) {
  const { pieceBox } = useLayout(aspect)
  const gap = Math.round(pieceBox * 0.22)
  return (
    <div ref={boxRef} style={{ position: 'fixed', left: '14%', width: '34%', top: '65%', transform: 'translateY(-50%)',
      zIndex: 32, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap,
        maxWidth: pieceBox * 2 + gap }}>
        {options.map((name, i) => {
          const st = stateFor(i)
          return (
            <button key={i} onClick={onTap ? e => onTap(i, e.currentTarget) : undefined} disabled={!onTap}
              aria-label={SHAPES[name].label}
              style={{ position: 'relative', width: pieceBox, height: pieceBox * 1.16, padding: 0, border: 'none',
                background: 'transparent', cursor: onTap ? 'pointer' : 'default', lineHeight: 0,
                borderRadius: 14, boxShadow: st === 'picked' ? PICKED_RING : undefined,
                opacity: st === 'taken' ? 0 : 1, transition: 'opacity .15s' }}>
              <div aria-hidden style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
                width: pieceBox * 0.66, height: pieceBox * 0.17,
                background: 'radial-gradient(ellipse at center, rgba(38,28,18,.24) 0%, rgba(38,28,18,0) 72%)' }} />
              <div style={{ width: pieceBox, height: pieceBox,
                animation: st === 'wrong' ? 'bh_shake .42s ease' : 'bh_idle 4s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 5px rgba(0,0,0,.22))' }}>
                <ShapeSVG name={name} size={pieceBox} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Fitting a piece: the tap causes the journey, and the journey is the answer ──────
// Hands a play surface the tapped element and gets back how long the flight takes, so the round can
// end when the piece LANDS rather than after a fixed delay that drifts out of step with it.
type Fit = (from: HTMLElement) => number

// ─── Round copy ──────────────────────────────────────────────────────────────────────
const partFor = (d: ShapeRound) => partOf(SEQUENCE[d.seq])
const promptFor = (d: ShapeRound) => `Find the ${SHAPES[partFor(d).name].label} for the ${partFor(d).label}!`
const sayFor = (d: ShapeRound) => {
  const p = partFor(d)
  return `The ${p.label} needs a ${SHAPES[p.name].label}. Find the ${SHAPES[p.name].label}!`
}

// ─── Play (guided + scored) ──────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const ShapesPlay: React.FC<{ data: ShapeRound; mode: Mode; fit: Fit; onComplete: (correct: boolean) => void }> = ({ data, mode, fit, onComplete }) => {
  const { options, answerIdx } = data
  const part = partFor(data)
  const label = SHAPES[part.name].label
  const [taken, setTaken] = useState<number | null>(null)
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false), tapLock = useRef(false)
  const [pending, setPending] = useState<number | null>(null)
  const pendingEl = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (mode === 'guided') speak(`Now you! The ${part.label} needs a ${label}. Tap it!`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** A tap only CHOOSES; the piece does not move and nothing is graded until Ready. The flight
   *  needs the element it starts from, so the chosen button is held alongside the index. */
  function pick(i: number, el: HTMLElement) {
    if (done.current) return
    pendingEl.current = el
    setPending(p => (p === i ? null : i))
  }
  function commit() {
    const i = pending, el = pendingEl.current
    if (i == null || !el) return
    setPending(null)
    tap(i, el)
  }

  function tap(i: number, el: HTMLElement) {
    if (done.current || tapLock.current) return
    tapLock.current = true
    window.setTimeout(() => { tapLock.current = false }, TAP_LOCK_MS)
    if (i !== answerIdx) {
      erred.current = true
      setWrongIdx(i)
      speak(`That's a ${SHAPES[options[i]].label}. It doesn't fit. Look at the hole!`)
      window.setTimeout(() => setWrongIdx(w => (w === i ? null : w)), 600)
      return
    }
    done.current = true
    setTaken(i)
    // The piece leaves the pile and travels into its socket; the round ends when it lands. A fixed
    // delay would drift out of step with the flight, and the flight is what completes the build.
    const ms = fit(el)
    if (mode === 'guided') speak(`Great job! The ${label} fits!`)
    window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), ms + 260)
  }

  return <>
    <PiecePile options={options} aspect={BUILDS[SEQUENCE[data.seq].bi].aspect}
      stateFor={i => (taken === i ? 'taken' : wrongIdx === i ? 'wrong' : pending === i ? 'picked' : 'idle')} onTap={pick} />
    <ReadyBar show={pending !== null} onCommit={commit} />
  </>
}

// ─── Milo shows how (opening demo + the 3-wrong re-teach) ────────────────────────────
/**
 * Milo picks the piece up and fits it himself — so the demo is a real build step, not a mime of one.
 * It DOES complete its part, and it has to: after a re-teach `SkillBeat` moves to the next round
 * rather than re-asking, so a demonstration that placed nothing would leave a permanent hole in the
 * build exactly where the child struggled.
 */
const ShapesExplain: React.FC<{ data: ShapeRound; fit: Fit; onDone: () => void }> = ({ data, fit, onDone }) => {
  const { options, answerIdx } = data
  const part = partFor(data)
  const label = SHAPES[part.name].label
  const [taken, setTaken] = useState<number | null>(null)
  const pile = useRef<HTMLDivElement | null>(null)
  const ran = useOnceGuard()
  useEffect(() => {
    if (ran.current) return; ran.current = true
    const cancel = speakSteps([
      `Look — the ${part.label} is missing. It needs a ${label}.`,
      `This one is a ${label}. Watch it fit!`,
    ], {
      onStep: i => {
        if (i !== 1) return
        const el = pile.current?.querySelectorAll('button')[answerIdx]
        if (!el) return
        setTaken(answerIdx)
        fit(el as HTMLElement)
      },
      onDone: () => window.setTimeout(onDone, 1400),
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <PiecePile options={options} boxRef={pile} aspect={BUILDS[SEQUENCE[data.seq].bi].aspect}
    stateFor={i => (taken === i ? 'taken' : 'idle')} />
}

// ─── "Meet the shapes" ───────────────────────────────────────────────────────────────
// Self-paced on a deterministic timer, NOT on speech events — tying short single words to
// onstart/onend made them race on real devices. Tap anywhere to skip: a child on their fifth run
// does not need the vocabulary lap, and this is the longest stretch in the chapter before they get
// to touch anything.
const SHOWCASE_DWELL = 1200
const ShapeShowcase: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [lit, setLit] = useState(-1)
  const { w: vw, h: vh } = useViewport()
  const short = vh < SHORT_H
  const px = Math.max(48, Math.min(vw * 0.14, vh * 0.18, 120))
  const ran = useOnceGuard()
  const fired = useRef(false)
  const finish = useCallback(() => { if (fired.current) return; fired.current = true; stopSpeech(); onDone() }, [onDone])
  useEffect(() => {
    if (ran.current) return; ran.current = true
    const timers: Array<ReturnType<typeof setTimeout>> = []
    speak('These are the shapes!')
    let t = 1800
    SHAPE_ORDER.forEach((s, i) => {
      timers.push(setTimeout(() => { setLit(i); speak(SHAPES[s].label) }, t))
      t += SHOWCASE_DWELL
    })
    timers.push(setTimeout(finish, t + 500))
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div onClick={finish} style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: short ? '13% 4% 12%' : '11% 4% 20%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', columnGap: 'clamp(16px,4vw,56px)', rowGap: short ? '4px' : 'clamp(8px,2vw,24px)', justifyItems: 'center', alignItems: 'end' }}>
        {SHAPE_ORDER.map((s, i) => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transform: lit === i ? 'scale(1.14)' : 'scale(1)', transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ filter: lit === i ? 'drop-shadow(0 0 14px var(--garden-green)) drop-shadow(0 0 9px var(--garden-green))' : 'drop-shadow(0 5px 7px rgba(0,0,0,.22))' }}>
              <ShapeSVG name={s} size={px} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(13px,2.2vw,20px)', color: 'var(--ink)', textTransform: 'capitalize', opacity: lit === i ? 1 : 0.8 }}>{SHAPES[s].label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── The scored practice ─────────────────────────────────────────────────────────────
export function makeShapeBeat(fit: Fit): Beat<ShapeRound> {
  return {
    skillId: 'shapes', rounds: SCORED_ROUNDS,
    // One walk, on the round the second build starts — so the change of place reads as Milo
    // travelling there rather than the backdrop simply swapping under him.
    walkBeforeRound: r => r === BUILD_CHANGE_ROUND,
    make: (d, round = 0) => makeShapeRound((d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.seq}`,   // one question per part; the shuffled option order is not variety
    prompt: promptFor,
    say: sayFor,
    Play: ({ data, onSubmit }) => <ShapesPlay data={data} mode="practice" fit={fit} onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <ShapesExplain data={data} fit={fit} onDone={onDone} />,
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const BH_CSS = `
@keyframes bh_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes bh_idle { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
@keyframes bh_shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px) rotate(-3deg)} 75%{transform:translateX(6px) rotate(3deg)} }
@keyframes bh_socket { 0%,100%{opacity:.5;transform:scale(.97)} 50%{opacity:1;transform:scale(1.03)} }
@keyframes bh_land { 0%{transform:scale(1.25);opacity:.6} 60%{transform:scale(.94)} 100%{transform:scale(1);opacity:1} }
`

/**
 * The piece in flight. It is positioned by its CENTRE and scaled, rather than by its box — a box
 * whose width/height animate would also have to re-render the SVG at a new size on every frame, and
 * the size attribute jumps instead of tweening. One fixed-size SVG, moved and scaled, cannot.
 */
interface Flight { name: ShapeName; size: number; ms: number; from: { x: number; y: number }; to: { x: number; y: number; scale: number; rotate: number }; go: boolean }

type Phase = 'intro' | 'showcase' | 'demo' | 'guided' | 'practice'
export default function ShapeTown({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useChapterPhase<Phase>('intro', { chapter: 'shapes', phase: 'practice' })
  // The build lives HERE, not inside SkillBeat, which rebuilds its contents every round — anything
  // mounted in there resets with them, so a cumulative arc drawn inside a round can never accumulate.
  const [built, setBuilt] = useState<Set<string>>(() => new Set())
  const [stepIdx, setStepIdx] = useState(DEMO_STEP)
  const [flight, setFlight] = useState<Flight | null>(null)
  const partEls = useRef<Record<string, HTMLDivElement | null>>({})
  const stepRef = useLatestRef(stepIdx)
  const timers = useRef<number[]>([])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const { exit, tally } = useChapterShell(onFinish, onExit)

  /**
   * The flight. Both ends are MEASURED — the socket because only the build knows where it drew that
   * part, the piece because flexbox, not this component, decided where it sits in the pile. The
   * duration comes from the distance, so a piece crossing twice as far takes twice as long instead
   * of teleporting the same way every time.
   */
  const fit = useCallback<Fit>((fromEl) => {
    const step = SEQUENCE[stepRef.current]
    const to = partEls.current[keyOf(step)]?.getBoundingClientRect()
    const from = fromEl.getBoundingClientRect()
    const land = () => setBuilt(b => (b.has(keyOf(step)) ? b : new Set(b).add(keyOf(step))))
    if (!to) { land(); return 0 }   // never leave a hole in the build if the socket is not mounted
    const part = partOf(step)
    const a = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
    const b = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
    const dist = Math.hypot(b.x - a.x, b.y - a.y)
    const ms = Math.round(Math.max(620, Math.min(dist * 1.35, 1150)))
    setFlight({ name: part.name, size: from.width, ms, from: a, go: false,
      to: { ...b, scale: to.width / Math.max(1, from.width), rotate: part.rotate ?? 0 } })
    // Two frames, so the start position is committed before the transition target replaces it.
    requestAnimationFrame(() => requestAnimationFrame(() => setFlight(f => (f ? { ...f, go: true } : f))))
    timers.current.push(window.setTimeout(() => { land(); setFlight(null) }, ms + 40))
    return ms
  }, [])

  /**
   * The one interlude this chapter has: the move from the house to the boat. It used to be a silent
   * 850ms pause — and `opening` was declared PER BUILD and rendered nowhere, so the new build simply
   * appeared with no word said or written about it. That is the beat a tester reported as Milo not
   * speaking, and the hull is the first thing asked for once it is over. Said AND written, because
   * most Chrome installs have no voice.
   * ⚠️ 2100ms, not 850: the next round's question is spoken the moment this resolves and `speak()`
   * cancels whatever is still talking, so a shorter hold cuts this line off mid-word.
   */
  const [moving, setMoving] = useState(false)
  const interlude = useCallback(() => new Promise<void>(res => {
    setMoving(true)
    speak(BUILDS[1].opening)
    window.setTimeout(() => { setMoving(false); res() }, 2100)
  }), [])
  const beat = useMemo(() => makeShapeBeat(fit), [fit])
  // Memoized because they SHUFFLE: rebuilt on every render, the option order — and so `answerIdx` —
  // would change under the surface that is already showing them.
  const demoData = useMemo(() => roundForStep(DEMO_STEP, shuffle([partOf(SEQUENCE[DEMO_STEP]).name, 'circle', 'star'])), [])
  const guidedData = useMemo(() => roundForStep(GUIDED_STEP, shuffle([partOf(SEQUENCE[GUIDED_STEP]).name, 'circle', 'heart'])), [])

  // Landscape-first, like the rest of the 3–5 set. Sits BELOW every hook — an early return above one
  // makes turning the phone change the hook count, which tore chapter 2 into the error boundary.
  if (needsRotate) return <RotateGate line="Shape House plays in landscape! 🏠" />

  const step = SEQUENCE[stepIdx]

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{BH_CSS}</style>
      <Background buildIdx={step.bi} />

      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '74%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            Milo is building a house out of shapes! Every part needs the shape that fits. First, let&apos;s meet the shapes!
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('showcase') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s build! ▶</button>
        </div>
      )}

      {phase === 'showcase' && (<>{Banner('Meet the shapes!')}
        <ShapeShowcase onDone={() => { setStepIdx(DEMO_STEP); setPhase('demo') }} /></>)}

      {phase === 'demo' && (<>{Banner('Watch Milo fit the first piece')}
        <ShapesExplain data={demoData} fit={fit} onDone={() => { setStepIdx(GUIDED_STEP); setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the piece that fits')}
        <ShapesPlay key="guided" data={guidedData} mode="guided" fit={fit}
          onComplete={() => { setStepIdx(FIRST_SCORED); setPhase('practice') }} /></>)}

      {moving && Banner(BUILDS[1].opening)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (typeof data?.seq === 'number') setStepIdx(data.seq) }}
            onComplete={tally} />
        </div>
      )}

      {/* NOT during the showcase. "Meet the shapes" is six shapes being named one at a time, and an
          entire empty house standing behind them is a second thing to look at during the one beat
          that wants undivided attention — it read as a diagram pasted over the garden. The build
          arrives with the demo, which is the moment it starts to mean anything. */}
      {phase !== 'intro' && phase !== 'showcase' && (
        <>
          <Build buildIdx={step.bi} built={built} target={step} elsRef={partEls} />
          <MiloBuilder />
        </>
      )}
      {phase === 'showcase' && <MiloBuilder />}

      {/* The piece in flight: one element that travels from the pile into its socket, growing or
          shrinking to the socket's size and taking on the part's rotation on the way. */}
      {flight && (
        <div aria-hidden style={{ position: 'fixed', zIndex: 55, pointerEvents: 'none', lineHeight: 0,
          width: flight.size, height: flight.size,
          left: flight.go ? flight.to.x : flight.from.x,
          top: flight.go ? flight.to.y : flight.from.y,
          transform: `translate(-50%,-50%) scale(${flight.go ? flight.to.scale : 1}) rotate(${flight.go ? flight.to.rotate : 0}deg)`,
          transition: `left ${flight.ms}ms cubic-bezier(.34,.85,.35,1), top ${flight.ms}ms cubic-bezier(.34,.85,.35,1), transform ${flight.ms}ms cubic-bezier(.34,.85,.35,1)`,
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.3))' }}>
          <ShapeSVG name={flight.name} size={flight.size} />
        </div>
      )}
    </div>
  )
}
