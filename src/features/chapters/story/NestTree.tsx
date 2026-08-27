'use client'
/**
 * Chapter — number-RECOGNITION (skill `numberRecognition`), as FEEDING TIME AT THE NEST TREE.
 *
 * The child HEARS a number and taps the nest wearing that numeral — recognition by ear, so the
 * target is spoken and NEVER written in the on-screen prompt (a pre-reader must go sound → glyph,
 * which is the whole skill).
 *
 * THE ANIMATION RULE THIS CHAPTER IS BUILT ON: the background holds perfectly still and the
 * OBJECTS move. Nothing scrolls, nothing parallaxes. What moves is the mother bird — she really
 * flies across the scene, from her perch to the nest the child chose, feeds the chick, and flies
 * back. The tap CAUSES a journey, and that journey is the reward.
 *
 * WHY THIS AND NOT NUMBERED OBJECTS THAT MOVE: earlier passes animated the answer objects
 * themselves (doors, then racers). Moving the thing you must read makes it harder to read AND the
 * scene still never changes. Here the answers stay still and legible, one character does all the
 * travelling, and the scene visibly fills up with fed, sleeping chicks as the child plays — so the
 * picture at question 10 is not the picture at question 1.
 *
 * Three worlds, same skill, different tree:
 *   🌳 Forest Nests — chicks in an old oak
 *   🌼 Meadow Nests — ducklings in the hedgerow
 *   🌙 Evening Nests — a last feed before dark
 *
 * Difficulty grows the listening + discrimination load, never the arithmetic: range 1–5 → 1–10,
 * choices 2 → 3 → 4, and look-alike distractors (6/9, 7/1, 3/8) at the hardest tier.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, speakSteps, useIsSpeaking, stopSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import WorldSelect from './WorldSelect'
import { useViewport } from '@/shared/hooks/useViewport'
import { SHEETS } from './canvas/sheets'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { rint, shuffle } from '@/core/rand'
import { SceneBg } from '@/shared/ui/SceneBg'
import { useOnceGuard } from '@/shared/hooks/useOnceGuard'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'
import ReadyBar from './ReadyBar'

const SPEAK_LOCK_MS = 600
const LOOKALIKE: Record<number, number> = { 6: 9, 9: 6, 7: 1, 1: 7, 3: 8, 8: 3, 5: 6, 2: 7 }

/** Bespoke art for this chapter — both are on screen every round, so both are drawn cycles
 *  rather than CSS shapes. A code-drawn nest sat in a painted scene and looked exactly like
 *  what it was, and the nest is the thing the child actually looks at and taps. */
const MOTHER = '/assets/objects/bird_side.png'
const NESTLING = '/assets/objects/nest_side.png'

// ─── Worlds ──────────────────────────────────────────────────────────────────────────
export interface NestWorld {
  id: string; label: string; emoji: string
  scenes: string[]                     // stable backdrops, rotated per round (never scrolled)
  chick: string                        // the baby sprite in every nest
  noun: string                         // "chick" / "duckling"
  dusk?: boolean                       // darken the scene a touch
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
export const WORLDS: NestWorld[] = [
  {
    id: 'forest', label: 'Forest Nests', emoji: '🌳',
    scenes: ['/assets/backgrounds/forest_2.jpeg', '/assets/backgrounds/forest_3.jpeg', '/assets/backgrounds/forest_4.jpeg'],
    chick: '/assets/objects/chick.png', noun: 'chick',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌳' },
    intro: 'The baby birds are hungry! Listen for the number, then tap that nest. First, watch Milo!',
  },
  {
    id: 'meadow', label: 'Meadow Nests', emoji: '🌼',
    scenes: ['/assets/backgrounds/garden_meadow.png', '/assets/backgrounds/garden_fence.png', '/assets/backgrounds/garden_park.png'],
    chick: '/assets/objects/duckling.png', noun: 'duckling',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌼' },
    intro: 'The ducklings are hungry! Listen for the number, then tap that nest. First, watch Milo!',
  },
  {
    id: 'evening', label: 'Evening Nests', emoji: '🌙',
    scenes: ['/assets/backgrounds/sky.jpeg', '/assets/backgrounds/lake.jpeg', '/assets/backgrounds/forest_3.jpeg'],
    chick: '/assets/objects/chick.png', noun: 'chick', dusk: true,
    milo: { src: '/assets/characters/milo_idle.png', emoji: '🦊', accessory: '🌙' },
    intro: 'One last feed before bedtime! Listen for the number, then tap that nest. First, watch Milo!',
  },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.scenes[0], itemImage: w.chick }))

/** One question: which nests are on the branch, and which number was called. */
interface NestRound { scene: string; nums: number[]; answerIdx: number }

// ─── Stable backdrop ─────────────────────────────────────────────────────────────────
// Deliberately motionless: every bit of movement in this chapter belongs to the bird.
function Background({ scene, scenes, dusk }: { scene: string; scenes: string[]; dusk?: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#cfe3d2' }}>
      {scenes.map(s => (
        <div key={s} style={{ position: 'absolute', inset: 0, opacity: s === scene ? 1 : 0, transition: 'opacity .6s ease' }}>
          <SceneBg src={s} priority={s === scene} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </div>
      ))}
      {dusk && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(30,26,66,.30), rgba(20,16,48,.52))' }} />}
    </div>
  )
}

/** The branch the nests sit on — code-drawn so the nests always land on something solid. */
function Branch({ y }: { y: number }) {
  return (
    <div aria-hidden style={{ position: 'fixed', left: 0, right: 0, top: `${y}%`, height: 'clamp(14px, 2.4vh, 26px)', zIndex: 14, pointerEvents: 'none',
      background: 'linear-gradient(180deg, #8a5a34 0%, #6d4526 55%, #52321a 100%)',
      borderRadius: '0 0 10px 10px', boxShadow: '0 6px 14px rgba(0,0,0,.30)' }} />
  )
}

// ─── A nest: chick + numeral sign, the tappable answer ───────────────────────────────
/** ⚠️ `picked` is CHOSEN, NOT GRADED — it must look the same whether the choice is right or
 *  wrong, so it is a plain white lift and deliberately NOT the green `hint` glow, which in this
 *  app's palette means correct. A marker that only appears on the right nest is the answer. */
type NestState = 'hungry' | 'fed' | 'wrong' | 'hint' | 'picked'

function Nest({ num, state, size, left, top, onTap, aria }: {
  num: number; state: NestState; size: number
  left: number; top: number; onTap?: () => void; aria: string
}) {
  const [sheetFailed, setSheetFailed] = useState(false)
  const sheet = sheetFailed ? undefined : SHEETS[NESTLING]
  const fed = state === 'fed'
  const w = size
  const h = Math.round(size / (sheet?.cellAspect ?? 1))
  const chipSize = Math.max(17, Math.round(size * 0.26))
  return (
    <button onClick={onTap} disabled={!onTap} aria-label={aria}
      style={{ position: 'fixed', left: `${left}%`, top: `${top}%`, transform: 'translate(-50%,-100%)', zIndex: 30,
        width: w, height: h, padding: 0, border: 'none', background: 'transparent', cursor: onTap ? 'pointer' : 'default' }}>
      {/* Animation lives on this wrapper only — never on the positioned button, whose inline
          translate an animation would silently override. */}
      <div style={{ position: 'absolute', inset: 0,
        animation: state === 'wrong' ? 'nt_shake .42s ease' : state === 'hint' ? 'nt_pop .5s ease' : state === 'picked' ? 'nt_pop .35s ease' : 'none',
        transform: state === 'picked' ? 'translateY(-6px)' : 'none', transition: 'transform .18s ease',
        filter: state === 'hint' ? 'drop-shadow(0 0 16px var(--garden-green)) drop-shadow(0 0 10px var(--garden-green))'
          : state === 'picked' ? 'drop-shadow(0 0 14px rgba(255,255,255,.95)) drop-shadow(0 4px 8px rgba(61,37,22,.45))'
          : 'drop-shadow(0 5px 8px rgba(0,0,0,.3))' }}>
        {sheet ? (
          <span style={{ display: 'block', width: w, height: h, overflow: 'hidden', position: 'relative' }}>
            {/* A FED chick stops chirping — pausing the cycle is the cheapest honest way to say
                "this one is done", and it keeps the painted art rather than swapping in a shape. */}
            <img src={sheet.url} alt="" aria-hidden draggable={false} decoding="async" onError={() => setSheetFailed(true)}
              style={{ position: 'absolute', left: 0, top: 0, height: h, width: w * sheet.frames, maxWidth: 'none',
                // Longhand: the `animation` shorthand next to `animationPlayState` makes React warn
                // and can reset the play state on re-render.
                animationName: 'ci-walk',
                animationDuration: `${(sheet.frames / sheet.fps).toFixed(3)}s`,
                animationTimingFunction: `steps(${sheet.frames})`,
                animationIterationCount: 'infinite',
                animationPlayState: fed ? 'paused' : 'running',
                filter: fed ? 'saturate(.9) brightness(.96)' : 'none', transition: 'filter .4s' }} />
          </span>
        ) : (
          <img src={NESTLING} alt="" draggable={false} decoding="async" loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.001' }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}
        {/* a fed chick is asleep — the visible reward */}
        {fed && <span style={{ position: 'absolute', left: '70%', top: '-6%', fontSize: Math.round(size * 0.26), animation: 'nt_z 2.4s ease-in-out infinite' }}>💤</span>}
        {/* The numeral sits ON the front of the nest, so number and nest read as one object.
            Hung below the branch it looked like a separate sign belonging to nothing. */}
        <span style={{ position: 'absolute', left: '50%', bottom: '6%', transform: 'translateX(-50%)',
          display: 'inline-block', background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 12,
          minWidth: chipSize, padding: '0 9px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: chipSize,
          color: 'var(--ink)', lineHeight: 1.25, boxShadow: '0 3px 0 rgba(242,107,44,.3)' }}>{num}</span>
      </div>
    </button>
  )
}

// ─── The mother bird — the one thing that travels ────────────────────────────────────
/**
 * She flies from her perch to a nest and back over a STILL scene. Position is animated with a
 * CSS transition on left/top (not a keyframe), because the destination changes per round and a
 * transition interpolates to whatever the new target is without re-authoring an animation.
 * Her wings run off the sprite sheet the whole time, so she is never a sliding sticker.
 */
function Mother({ at, h, facingLeft }: { at: { left: number; top: number }; h: number; facingLeft: boolean }) {
  const [sheetFailed, setSheetFailed] = useState(false)
  const sheet = sheetFailed ? undefined : SHEETS[MOTHER]
  const w = Math.round(h * (sheet?.cellAspect ?? 1))
  return (
    <div aria-hidden style={{ position: 'fixed', left: `${at.left}%`, top: `${at.top}%`, zIndex: 34,
      transform: 'translate(-50%,-50%)', width: w, height: h,
      transition: 'left 1.15s cubic-bezier(.4,0,.35,1), top 1.15s cubic-bezier(.4,0,.35,1)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', transform: facingLeft ? 'scaleX(-1)' : 'none', filter: 'drop-shadow(0 6px 9px rgba(0,0,0,.32))' }}>
        {sheet ? (
          <span style={{ display: 'block', width: w, height: h, overflow: 'hidden', position: 'relative' }}>
            <img src={sheet.url} alt="" draggable={false} decoding="async" onError={() => setSheetFailed(true)}
              style={{ position: 'absolute', left: 0, top: 0, height: h, width: w * sheet.frames, maxWidth: 'none',
                animation: `ci-walk ${(sheet.frames / sheet.fps).toFixed(3)}s steps(${sheet.frames}) infinite` }} />
          </span>
        ) : (
          // No sheet yet → the still sprite still flies the route, just without flapping.
          <img src={MOTHER} alt="" draggable={false} decoding="async"
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.001' }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'nt_flap 0.42s ease-in-out infinite' }} />
        )}
      </div>
    </div>
  )
}

// ─── Layout ──────────────────────────────────────────────────────────────────────────
const PERCH = { left: 12, top: 26 }
const BRANCH_Y = 62
// Derived from `useViewport` (already imported here) rather than a second unthrottled listener —
// same arithmetic, no local state, and it can no longer render one frame at the stale 110 default.
function useNestSize(n: number): number {
  const { w, h: vh } = useViewport()
  const short = vh < 470
  const byWidth = (w * (n <= 2 ? 0.30 : n === 3 ? 0.23 : 0.18)) / 1.25
  const byHeight = vh * (short ? 0.30 : 0.27)
  return Math.round(Math.max(short ? 54 : 74, Math.min(byWidth, byHeight, 168)))
}
/** Nests sit ON the branch, so they all share its y — the branch is what makes them read as one row. */
function placeFor(n: number): { left: number; top: number }[] {
  const xs = n <= 2 ? [38, 70] : n === 3 ? [32, 55, 78] : [26, 45, 64, 83]
  return xs.map(x => ({ left: x, top: BRANCH_Y }))
}

// ─── Round copy ──────────────────────────────────────────────────────────────────────
function promptFor(w: NestWorld): string { return `Tap the nest with the number you heard!` }
/** The guided round's one instruction. Written out once because it is now said in TWO places —
 *  spoken on mount, and spoken again when the child taps the banner to hear it. Two copies of a
 *  sentence is the fault; the second pill is only the symptom. */
export function guidedSay(w: NestWorld, target: number): string {
  return `Now you! Feed the ${w.noun} in nest number ${target}. Tap it!`
}
function sayFor(w: NestWorld, d: NestRound): string {
  const t = d.nums[d.answerIdx]
  return `Feed the ${w.noun} in nest number ${t}! Number ${t}.`
}

/** Shared flight choreography: fly to the nest, feed, fly home. */
function useFlight(slots: { left: number; top: number }[]) {
  const [at, setAt] = useState(PERCH)
  const timers = useRef<number[]>([])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])
  const flyTo = useCallback((i: number, onFed: () => void) => {
    const s = slots[i]
    if (!s) return
    setAt({ left: s.left, top: s.top - 16 })                       // arrive just above the nest
    timers.current.push(window.setTimeout(() => onFed(), 1200))    // she reaches it, chick eats
    timers.current.push(window.setTimeout(() => setAt(PERCH), 2000))
  }, [slots])
  return { at, flyTo, facingLeft: at.left < PERCH.left + 1 ? false : false }
}

// ─── Play surface (guided / practice) ────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const NestPlay: React.FC<{ world: NestWorld; data: NestRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { nums, answerIdx } = data
  const target = nums[answerIdx]
  const n = nums.length
  const slots = useMemo(() => placeFor(n), [n])
  const size = useNestSize(n)
  const { h: vh } = useViewport()
  const [fedIdx, setFedIdx] = useState<number | null>(null)
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [pickedIdx, setPickedIdx] = useState<number | null>(null)
  const { at, flyTo } = useFlight(slots)
  const erred = useRef(false), done = useRef(false), wrongLock = useRef(false), tapLock = useRef(false)
  const speaking = useIsSpeaking()

  const finish = useCallback(() => {
    if (done.current) return; done.current = true
    if (mode === 'guided') speak(`Yes! Nest number ${target}! Great job!`)
    window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1000)
  }, [mode, target, onComplete])

  useEffect(() => {
    if (mode === 'guided') speak(guidedSay(world, target))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** A tap only CHOOSES. Nothing is graded, nothing is spoken about it, and the child may change
   *  their mind as often as they like — which is the whole of what "submit when you are ready"
   *  buys. Re-tapping the chosen nest unchooses it, so the bar is never a trap. */
  function tap(i: number) {
    if (done.current || speaking || tapLock.current) return
    setPickedIdx(p => (p === i ? null : i))
  }

  /** Ready. NOW it is graded — and a wrong one is still marked wrong and still retried in place,
   *  exactly as a wrong tap used to be. The bar itself says nothing about which nest was chosen. */
  function commit() {
    const i = pickedIdx
    if (i == null || done.current || tapLock.current) return
    setPickedIdx(null)
    if (i === answerIdx) {
      tapLock.current = true
      // The commit CAUSES the journey — she flies there, feeds, and only then does the round end.
      flyTo(i, () => { setFedIdx(i); window.setTimeout(finish, 700) })
    } else {
      erred.current = true; setWrongIdx(i)
      if (!wrongLock.current) { wrongLock.current = true; speak(`That's ${nums[i]}. Find nest number ${target}!`); window.setTimeout(() => { wrongLock.current = false }, 1300) }
      window.setTimeout(() => setWrongIdx(w => (w === i ? null : w)), 600)
    }
  }

  return (
    <>
      <Branch y={BRANCH_Y} />
      {nums.map((num, i) => (
        <Nest key={i} num={num} size={size}
          state={fedIdx === i ? 'fed' : wrongIdx === i ? 'wrong' : pickedIdx === i ? 'picked' : 'hungry'}
          left={slots[i].left} top={slots[i].top} onTap={() => tap(i)} aria={`nest ${num}`} />
      ))}
      <Mother at={at} h={Math.round(size * 0.62)} facingLeft={false} />
      <ReadyBar show={pickedIdx != null} onCommit={commit} />
      <span aria-hidden style={{ position: 'fixed', left: `${PERCH.left}%`, top: `${PERCH.top + 7}%`, transform: 'translateX(-50%)', fontSize: Math.max(10, vh * 0.018), color: '#fff', opacity: 0, pointerEvents: 'none' }}>perch</span>
    </>
  )
}

// ─── Teaching demo (intro preview + 3-wrong re-teach) ────────────────────────────────
const NestExplain: React.FC<{ world: NestWorld; data: NestRound; onDone: () => void }> = ({ world, data, onDone }) => {
  const { nums, answerIdx } = data
  const target = nums[answerIdx]
  const n = nums.length
  const slots = useMemo(() => placeFor(n), [n])
  const size = useNestSize(n)
  const [hint, setHint] = useState(false)
  const [fed, setFed] = useState(false)
  // ⚠️ THE DEMO'S THREE LINES WERE SPOKEN AND NEVER DRAWN. Most Chrome installs ship no voice at
  // all and this band has no recorded clips, so on those devices the teaching was a silent bird
  // flying to a nest and nothing else — the chapter's entire explanation, delivered in a channel
  // that is not there. Everything spoken in a demo is written too.
  // ⚠️ AND WRITING IT HERE IS SAFE PRECISELY BECAUSE IT IS THE DEMO. The line names the target
  // number, which in a SCORED round would hand over the answer and delete the skill (the child
  // must go sound → glyph). A demo is teaching, not measuring, and it already glows the answer.
  const [line, setLine] = useState('')
  const { at, flyTo } = useFlight(slots)
  const ran = useOnceGuard()
  useEffect(() => {
    if (ran.current) return; ran.current = true
    const lines = [
      `This ${world.noun} is hungry. Milo says nest number ${target}.`,
      `${target}! Find the nest that says ${target}.`,
      `There it is! Mummy bird feeds nest number ${target}.`,
    ]
    const cancel = speakSteps(lines, {
      onStep: (i) => {
        setLine(lines[i] ?? '')
        if (i === 1) setHint(true)
        if (i === 2) flyTo(answerIdx, () => setFed(true))
      },
      onDone: () => window.setTimeout(onDone, 1400),
    })
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Branch y={BRANCH_Y} />
      {nums.map((num, i) => (
        <Nest key={i} num={num} size={size}
          state={i === answerIdx ? (fed ? 'fed' : hint ? 'hint' : 'hungry') : 'hungry'}
          left={slots[i].left} top={slots[i].top} aria={`example ${num}`} />
      ))}
      <Mother at={at} h={Math.round(size * 0.62)} facingLeft={false} />
      {/* Sits in the demo banner's own band, below it — the nests are on the branch further down
          and Milo is bottom-left, so this is the one strip of the frame nothing else occupies. */}
      {line && (
        <div style={{ position: 'absolute', top: 96, left: 0, right: 0, zIndex: 44, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
          <div style={{ maxWidth: '76%', background: 'rgba(255,255,255,.94)', border: '3px solid var(--outline)', borderRadius: 16, padding: '8px 18px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(13px, 1.6vh, 17px)', color: 'var(--ink)', textAlign: 'center', boxShadow: '0 3px 0 rgba(61,37,22,.12)' }}>{line}</div>
        </div>
      )}
    </>
  )
}

// ─── Value generation ────────────────────────────────────────────────────────────────
function makeRound(world: NestWorld, d: 1 | 2 | 3, round: number): NestRound {
  const scene = world.scenes[round % world.scenes.length]
  const n = d === 1 ? 2 : d === 2 ? 3 : 4
  const max = d === 1 ? 5 : 10
  const target = rint(1, max)
  const opts = new Set<number>([target])
  // At the top tier, pit the target against a glyph it is genuinely confusable with (6/9, 7/1),
  // so the child must READ the numeral rather than eliminate an obviously different one.
  if (d >= 3 && opts.size < n) { const la = LOOKALIKE[target]; if (la && la !== target && la <= max) opts.add(la) }
  while (opts.size < n) opts.add(rint(1, max))
  const nums = shuffle([...opts])
  return { scene, nums, answerIdx: nums.indexOf(target) }
}

export function makeNestBeat(world: NestWorld): Beat<NestRound> {
  return {
    skillId: 'numberRecognition', rounds: 10, walkEvery: 3,
    make: (d, round = 0) => makeRound(world, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.nums[d.answerIdx]}`,   // dedupe on the TARGET number, not the rotating scene
    prompt: () => promptFor(world),
    say: d => sayFor(world, d),
    Play: ({ data, onSubmit }) => <NestPlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <NestExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const NT_CSS = `
@keyframes nt_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes nt_peep { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes nt_pop { 0%{transform:scale(1)} 45%{transform:scale(1.09)} 100%{transform:scale(1)} }
@keyframes nt_shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px) rotate(-2deg)} 75%{transform:translateX(6px) rotate(2deg)} }
@keyframes nt_z { 0%,100%{transform:translateY(0);opacity:.55} 50%{transform:translateY(-7px);opacity:1} }
@keyframes nt_flap { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.92)} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function NestTree({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [world, setWorld] = useState<NestWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
  const [phase, setPhase] = useChapterPhase<Phase>('intro', { chapter: 'numberRecognition', phase: 'practice' })
  const [scene, setScene] = useState<string>(WORLDS[0].scenes[0])
  const [demoIdx, setDemoIdx] = useState(0)
  const { exit, tally } = useChapterShell(onFinish, onExit)

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => (world ? makeNestBeat(world) : null), [world])

  // Same landscape-first design as the rest of the 3–5 set — the branch of nests runs wide.
  if (needsRotate) return <RotateGate line="Feeding time plays in landscape! 🐦" />

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Whose babies shall we feed?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setScene(w.scenes[0]); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  const DEMO_ROUNDS: NestRound[] = [
    { scene: world.scenes[0], nums: [2, 3], answerIdx: 1 },
    { scene: world.scenes[1] ?? world.scenes[0], nums: [5, 1, 8], answerIdx: 0 },
  ]
  const GUIDED_ROUND: NestRound = { scene: world.scenes[2] ?? world.scenes[0], nums: [4, 2], answerIdx: 1 }
  const bgScene = phase === 'practice' ? scene : phase === 'guided' ? GUIDED_ROUND.scene : phase === 'demo' ? DEMO_ROUNDS[demoIdx].scene : world.scenes[0]

  // ⚠️ THE GUIDED ROUND HAD NO WAY TO HEAR THE QUESTION TWICE. The number is spoken once, on
  // mount, and never written — which is the whole skill — so a child who missed it had nothing to
  // do but guess. The scored rounds have had a replay all along (SkillBeat's prompt pill); this is
  // the one screen that did not, and it is the screen where the child answers for the first time.
  const Banner = (text: string, onReplay?: () => void) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      {React.createElement(onReplay ? 'button' : 'div',
        { onClick: onReplay, 'aria-label': onReplay ? 'Hear it again' : undefined,
          style: { display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, cursor: onReplay ? 'pointer' : 'default', background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' } },
        onReplay ? <span key="i" aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>🔊</span> : null,
        <span key="t">{text}</span>)}
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{NT_CSS}</style>
      <Background scene={bgScene} scenes={world.scenes} dusk={world.dusk} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '74%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {world.intro}
          </div>
          <button onClick={() => setPhase('demo')}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Listen for the number  (${demoIdx + 1}/${DEMO_ROUNDS.length})`)}
        <NestExplain key={`demo${demoIdx}`} world={world} data={DEMO_ROUNDS[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO_ROUNDS.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner(`Now you! Tap the nest Milo says`, () => speak(guidedSay(world, GUIDED_ROUND.nums[GUIDED_ROUND.answerIdx])))}
        <NestPlay key="guided" world={world} data={GUIDED_ROUND} mode="guided" onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (data?.scene) setScene(data.scene as string) }}
            onComplete={tally} />
        </div>
      )}

      {<MiloHost left={11} milo={world.milo} />}
    </div>
  )
}

// ─── Milo ────────────────────────────────────────────────────────────────────────────
function MiloHost({ left, milo }: { left: number; milo: NestWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(30vh, 260px)', height: 'min(30vh, 260px)' }}>
      <div style={{ width: '100%', height: '100%', animation: 'nt_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 100, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>{milo.emoji}</span>
              <span style={{ position: 'absolute', bottom: 12, right: 20, fontSize: 46 }}>{milo.accessory}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}
