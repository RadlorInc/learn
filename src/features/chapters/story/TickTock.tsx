'use client'
/**
 * Chapter (6–8) — TIME (skill `time`) as STORY MODE. The verb is **SET IT** (and READ IT), per
 * docs/story-6-8-rethink.md §8.
 *
 * ⚠️ WHAT THIS REPLACED, AND WHY, BECAUSE THE OLD VERSION LOOKED FINE: it showed an exact clock and
 * took the answer as one of four pills. Four labels is **winnable by elimination** — a child who
 * cannot read a clock at all gets a third of them right — and on the craft doc's own "is it alive"
 * check it scored **1 of 4**: nothing arrived on its own legs, a tap sent nobody anywhere, Milo
 * floated in the corner with no job, and only the backdrop rotated. So:
 *
 *   · **SET rounds** — Milo says when he has to be somewhere; the child moves the hands there.
 *     Setting cannot be eliminated into, and putting the long hand on the 6 for "half past" requires
 *     the one fact the pills never touched.
 *   · **READ rounds** — the clock is showing a time; the child says it, building the phrase a part at
 *     a time. Reading and setting are the same skill from both ends.
 *
 * ⚠️ THE PAYLOAD IS THAT ONE SET OF NUMBERS CARRIES TWO SCALES — the 6 is six hours and thirty
 * minutes — and it is taught by an explicit LESSON before anything is scored, because that fact is
 * the actual reason a six-year-old cannot read a clock and no amount of practice discovers it.
 * The minute ring is the scaffold; it fades out at the top tier (see `showRing`).
 *
 * ⚠️ NO DIGITS BEFORE COMMIT. On a set round the dials are bare — `Hour ◀ ▶`, not `7 ◀ ▶` — so the
 * only readout is the clock face itself. A dial that prints the answer while you turn it is the teen
 * band's month-dial fault: it turns the round into hot/cold.
 *
 * The clock is code-drawn SVG because reading it needs exact hands and AI image models draw clocks
 * wrong — the same "the math must be exact" call the fraction wholes make. All arithmetic, the day
 * table and every layout band live in [clock.ts](./clock.ts), which is what the gate drives.
 *
 * There is NO world picker: morning, afternoon and night are now the ARC of one day across the ten
 * rounds rather than a menu shown before the child knows what they are choosing. Wrapped by
 * game/TimeChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, speakAfterCurrent, speakPaced, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { lessonSeen, markLessonSeen } from '@/infra/storage/lessonSeen'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { Arrive, SheetCell, inFlowJourney, hasSheet, CRITTER_CSS } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import {
  RING, DAY, TINT, MILO, MILO_ASPECT,
  wordsFor, minutePhrase, spokenHourFor, minsFor, ringMinuteFor, numeralForMinute,
  hourAngle, minuteAngle, askKindFor, askTextFor, hintFor, skyFor, layoutFor, menuBtn, CHROME_PAD,
  pickMinute, kindOf, READINGS,
  type Ask, type Slot, type Reading,
} from './clock'
import { rint, pick } from '@/core/rand'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { SceneBg } from '@/shared/ui/SceneBg'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'
import { DirectionsInline } from '@/features/chapters/directions'
import type { ChapterType } from '@/core/chapters'

const wrap = (i: number, n: number) => ((i % n) + n) % n

/** The ring is a SCAFFOLD, so it fades once the child is working unaided — the tier-linked
 *  scaffolding rule. At L3 the second scale has to be in their head, not on the picture. */
const showRing = (d: 1 | 2 | 3) => d <= 2

/**
 * How long a narrated line stays on screen. Derived from the sentence's own length so the pacing
 * roughly tracks a real voice without DEPENDING on one — the whole reason the lesson and the re-teach
 * are self-paced (see the long note in `Lesson`). One function, so the two cannot drift apart.
 */
const dwellFor = (s: string) => Math.max(2400, Math.round(s.length * 72))

// ─── the round ────────────────────────────────────────────────────────────────────────
export interface TimeRound {
  slot: number          // which of Milo's ten things this is
  h: number; m: number  // what the clock says / must be made to say
  ask: Ask
  d: 1 | 2 | 3
}

/** The SCENARIO fixes the hour and the TIER picks the minutes, so the story and the difficulty are
 *  independent — the park at three o'clock on L1 and at twenty-five past three on L3, same picture. */
export function makeTimeRound(d: 1 | 2 | 3, round: number, asked: readonly Reading[] = []): TimeRound {
  const slot = Math.min(round, DAY.length - 1)
  // The minutes come from `pickMinute`, not a uniform draw — see the long note there. A strong child
  // is only asked two questions at the top tier, so those two are spent on readings they have not met.
  return { slot, h: DAY[slot].hour, m: pickMinute(d, asked), ask: askKindFor(round), d }
}

const sceneOf = (r: TimeRound): Slot => DAY[r.slot]

// ─── sky ──────────────────────────────────────────────────────────────────────────────
/** The sun and the moon cross the sky across the run, so the ARC is in the picture rather than in a
 *  widget: round one is dawn and round ten is dark, and nothing has to say so. */
function Sky({ slot, px }: { slot: number; px: number }) {
  const s = skyFor(slot)
  const sun = s.body === 'sun'
  return (
    <div aria-hidden style={{
      position: 'absolute', left: `${s.leftPct}%`, top: `${s.topPct}%`, width: px, height: px,
      transform: 'translate(-50%,-50%)', borderRadius: '50%', pointerEvents: 'none',
      background: sun
        ? 'radial-gradient(circle at 38% 34%, #fff6d0, #ffd24a 58%, #f6a93b)'
        : 'radial-gradient(circle at 38% 34%, #ffffff, #e8ecff 58%, #c3caf0)',
      boxShadow: sun ? '0 0 40px 14px rgba(255,196,84,.42)' : '0 0 34px 12px rgba(206,216,255,.34)',
      transition: 'left 1.1s ease, top 1.1s ease, background .8s ease',
    }} />
  )
}

// ─── scene ────────────────────────────────────────────────────────────────────────────
/**
 * The backdrop plus a light WASH, because the library holds no night scenes and generating one for
 * a single chapter is not the honest fix. A dusk or night tint over a day scene is a real technique;
 * what makes it read as LIGHT rather than as a grey film is that it stays warm at the ends of the day
 * and cool in the middle of the night, and never goes dark enough to stop the picture being legible.
 */
function Scene({ slot, sunPx }: { slot: number; sunPx: number }) {
  const s = DAY[Math.min(slot, DAY.length - 1)]
  const tint = TINT[s.light]
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#e9dcc0' }}>
      {DAY.map((d, i) => (
        <SceneBg key={d.scene} src={`/assets/backgrounds/${d.scene}`}
          priority={i === Math.min(slot, DAY.length - 1)}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{ opacity: i === Math.min(slot, DAY.length - 1) ? 1 : 0, transition: 'opacity .7s ease' }} />
      ))}
      <Sky slot={slot} px={sunPx} />
      <div style={{ position: 'absolute', inset: 0, background: tint.wash, opacity: tint.alpha, transition: 'opacity .7s ease, background .7s ease', pointerEvents: 'none' }} />
    </div>
  )
}

// ─── the clock ────────────────────────────────────────────────────────────────────────
const R2 = Math.PI / 180
const at = (r: number, deg: number) => ({ x: 100 + r * Math.sin(deg * R2), y: 100 - r * Math.cos(deg * R2) })

interface ClockView {
  h: number; m: number
  ring?: boolean
  /** Which minute values on the ring are lit — the lesson counts round in fives with this. */
  ringLit?: number[]
  /** A numeral to spotlight, for "the six is also thirty". */
  hiNumeral?: number | null
  dim?: 'hour' | 'minute' | null   // the lesson dims one hand while naming the other
  label?: string | null            // the words — ONLY ever after a commit
  glow?: boolean
}

function StoryClock({ px, view }: { px: number; view: ClockView }) {
  const { h, m, ring, ringLit, hiNumeral, dim, label, glow } = view
  const hand = (angle: number): React.CSSProperties => ({
    transformBox: 'view-box', transformOrigin: '100px 100px', transform: `rotate(${angle}deg)`,
    transition: 'transform .55s cubic-bezier(.34,1.35,.5,1)',
  })
  return (
    <div style={{ position: 'relative', width: px, height: px }}>
      <svg viewBox="0 0 200 200" style={{
        width: '100%', height: '100%', display: 'block',
        filter: glow ? 'drop-shadow(0 0 20px var(--sun-yellow))' : 'drop-shadow(0 8px 14px rgba(0,0,0,.32))',
        transition: 'filter .3s ease',
      }}>
        <circle cx={100} cy={100} r={97} fill="#e8912a" stroke="rgba(0,0,0,.25)" strokeWidth={3} />
        <circle cx={100} cy={100} r={87} fill="var(--paper)" stroke="rgba(0,0,0,.12)" strokeWidth={2} />

        {/* the minute ring — a faint band, so it reads as a SECOND scale laid over the same numbers */}
        {ring && <circle cx={100} cy={100} r={73} fill="none" stroke="rgba(74,110,190,.16)" strokeWidth={17} />}

        {/* twelve ticks */}
        {RING.map((_, i) => {
          const a = i * 30, p1 = at(81, a), p2 = at(87, a)
          return <line key={`t${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(0,0,0,.34)" strokeWidth={2.4} strokeLinecap="round" />
        })}

        {/* the second scale: what each numeral ALSO means */}
        {ring && RING.map((_, i) => {
          const numeral = i === 0 ? 12 : i
          const mv = ringMinuteFor(numeral)
          const p = at(73, i * 30)
          const lit = ringLit?.includes(mv)
          return (
            <text key={`r${mv}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--font-display)" fontWeight="800" fontSize={lit ? 13 : 11}
              fill={lit ? 'var(--milo-orange-deep)' : 'rgba(52,74,132,.62)'}
              style={{ transition: 'font-size .25s ease, fill .25s ease' }}>{mv}</text>
          )
        })}

        {/* the hours */}
        {RING.map((_, i) => {
          const n = i === 0 ? 12 : i
          const p = at(55, n * 30)
          const hi = hiNumeral === n
          return (
            <g key={`h${n}`}>
              {hi && <circle cx={p.x} cy={p.y} r={14} fill="rgba(242,107,44,.20)" />}
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                fontFamily="var(--font-display)" fontWeight="900" fontSize={hi ? 20 : 18}
                fill={hi ? 'var(--milo-orange-deep)' : 'var(--ink)'}
                style={{ transition: 'font-size .25s ease' }}>{n}</text>
            </g>
          )
        })}

        {/* HOUR hand — short and thick. Its creep between numbers is the thing a child must learn to
            read, so it is drawn from the true angle (hour + minutes/60), never snapped to the numeral. */}
        <g style={{ ...hand(hourAngle(h, m)), opacity: dim === 'hour' ? 0.22 : 1 }}>
          <line x1={100} y1={110} x2={100} y2={58} stroke="var(--ink)" strokeWidth={9} strokeLinecap="round" />
        </g>
        {/* MINUTE hand — long and thin */}
        <g style={{ ...hand(minuteAngle(m)), opacity: dim === 'minute' ? 0.22 : 1 }}>
          <line x1={100} y1={114} x2={100} y2={34} stroke="var(--milo-orange)" strokeWidth={5.5} strokeLinecap="round" />
        </g>
        <circle cx={100} cy={100} r={7.5} fill="var(--milo-orange-deep)" stroke="#fff" strokeWidth={2} />
      </svg>

      {/* the words. Absolute, so the reveal costs no layout height and the clock never resizes. */}
      <div style={{
        position: 'absolute', left: '50%', bottom: -px * 0.055, transform: `translateX(-50%) scale(${label ? 1 : 0.7})`,
        opacity: label ? 1 : 0, transition: 'opacity .3s ease, transform .35s cubic-bezier(.34,1.56,.64,1)',
        background: 'var(--milo-orange)', color: '#fff', borderRadius: 999, whiteSpace: 'nowrap',
        padding: `${Math.max(4, px * 0.028)}px ${Math.max(12, px * 0.085)}px`,
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.max(13, Math.round(px * 0.098)),
        boxShadow: '0 4px 0 rgba(242,107,44,.35)', pointerEvents: 'none',
      }}>{label || ' '}</div>
    </div>
  )
}

// ─── the instrument: two dials and a commit ───────────────────────────────────────────
/**
 * ONE dial serves both directions, which is the point rather than a saving: on a set round its label
 * is a CAPTION ("Hour") because the readout is the clock face, and on a read round its label is the
 * VALUE being built because the readout is the phrase. Same gesture, opposite direction.
 */
function Dial({ label, onStep, disabled, short, minW, dark }: {
  label: string; onStep: (dir: -1 | 1) => void; disabled?: boolean; short: boolean; minW: number
  /** ⚠️ A night round washes the scene deep blue and the label sits DIRECTLY on it — measured
   *  `rgb(61,37,22)` on the moon round, i.e. dark ink on a dark picture. The arrows carry their own
   *  paper background so they were fine; only the bare label needed the variant the bubble already had. */
  dark?: boolean
}) {
  const side = short ? 40 : 46
  const arrow: React.CSSProperties = {
    width: side, height: side, flex: '0 0 auto', borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
    background: 'var(--paper)', border: '3px solid var(--outline)', boxShadow: '0 4px 0 #c8ac79',
    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 15 : 18, color: 'var(--ink)',
    opacity: disabled ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: short ? 3 : 5 }}>
      <button onClick={() => onStep(-1)} disabled={disabled} aria-label="back" style={arrow}>◀</button>
      <span style={{
        minWidth: minW, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 900,
        fontSize: short ? 14 : 17, color: dark ? '#fff' : 'var(--ink)', lineHeight: 1.1,
        textShadow: dark ? '0 1px 3px rgba(0,0,0,.55)' : 'none',
      }}>{label}</span>
      <button onClick={() => onStep(1)} disabled={disabled} aria-label="forward" style={arrow}>▶</button>
    </div>
  )
}

function Commit({ text, onClick, disabled, short }: { text: string; onClick: () => void; disabled?: boolean; short: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: short ? '10px 16px' : '13px 22px', borderRadius: 14, border: 'none',
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      background: 'linear-gradient(135deg,var(--garden-green),var(--garden-green-deep))', color: '#fff',
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 14 : 17,
      boxShadow: '0 5px 0 rgba(40,110,60,.35)', whiteSpace: 'nowrap',
    }}>{text}</button>
  )
}

type L = ReturnType<typeof layoutFor>

function Bar({ L: l, children }: { L: L; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', left: l.barLeft, width: l.barW, bottom: l.barBottom, height: l.barH, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: l.short ? 8 : 14, flexWrap: 'nowrap',
    }}>{children}</div>
  )
}

// ─── Milo ─────────────────────────────────────────────────────────────────────────────
/**
 * The question lives in a bubble at Milo's mouth — he is the one who has somewhere to be, so he is
 * the one who should be asking. It is laid out as a BAND rather than floated at his head: anchored
 * freely it ran straight across the clock on a 640-wide frame, which put the two things a child has
 * to read at once on top of each other.
 */
/** ⚠️ `chapter` puts the TYPED DIRECTIONS in the bubble. This chapter sets `prompt: () => ''` — Milo's
 *  bubble is its only question surface — and it draws its own banner on the chrome row, so a floating
 *  directions strip would be laid over that banner. In the bubble nothing can be covered. */
function Bubble({ L: l, text, dark, chapter }: { L: L; text: string; dark: boolean; chapter?: ChapterType }) {
  return (
    <div style={{
      position: 'fixed', left: l.bubbleLeft, width: l.bubbleW, top: l.bubbleTop, minHeight: l.bubbleH, zIndex: 42,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dark ? 'rgba(22,26,52,.88)' : 'rgba(255,255,255,.94)',
      border: `3px solid ${dark ? '#9ab6ff' : 'var(--outline)'}`, borderRadius: 18,
      padding: l.short ? '5px 12px' : '8px 18px', boxShadow: '0 4px 0 rgba(61,37,22,.16)',
      fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.15, textAlign: 'center',
      fontSize: l.short ? 13 : 17, color: dark ? '#fff' : 'var(--ink)',
    }}>
      <span>{text}{chapter && <DirectionsInline chapter={chapter} block />}</span>
      {/* the tail — what keeps the words visibly HIS rather than a banner pinned to the frame */}
      <span aria-hidden style={{
        position: 'absolute', bottom: -11, left: `${l.tailPct}%`, width: 0, height: 0,
        borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
        borderTop: `11px solid ${dark ? '#9ab6ff' : 'var(--outline)'}`,
      }} />
    </div>
  )
}

/** Milo, and on a correct answer he WALKS OFF to do the thing — the journey is the reward. */
function Milo({ L: l, leaving, resetKey, vw }: { L: L; leaving: boolean; resetKey: string | number; vw: number }) {
  const distPx = Math.round(vw - l.miloLeft + l.miloW * 0.4)
  const j = useMemo(() => inFlowJourney(MILO, l.miloH, distPx), [l.miloH, distPx])
  return (
    <div style={{ position: 'fixed', left: l.miloLeft, bottom: 0, width: l.miloW, height: l.miloH, zIndex: 26, pointerEvents: 'none' }}>
      {/* ⚠️ `leave` must be conditional, not constant. With a constant `leave` and `ms={0}`, Arrive
          starts at its DONE phase, and done-while-leaving means "already gone" — so Milo was
          translated a whole screen to the right before the chapter had begun, and simply never
          appeared. He is invisible rather than misplaced, which is why no gate could see it. */}
      <Arrive dist={distPx} ms={leaving ? j.ms : 0} leave={leaving} resetKey={`${resetKey}|${leaving}`}>
        {moving => (
          <SheetCell src={MILO} h={l.miloH} moving={moving} cycleScale={j.cycleScale}
            /* `milo_side.png` faces RIGHT, and right is the way he leaves — so never flipped here. */
            facesLeft={false} breathe={!leaving} />
        )}
      </Arrive>
    </div>
  )
}

// ─── play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

const TimePlay: React.FC<{ data: TimeRound; mode: Mode; onComplete: (correct: boolean) => void }> =
({ data, mode, onComplete }) => {
  /**
   * ⚠️ ONLY THE GUIDED ROUNDS SPEAK FOR THEMSELVES. In practice `SkillBeat` already speaks `beat.say`
   * on every round load, and both firing means two utterances where the second cancels the first —
   * whichever order they happen to run in.
   */
  const speakOnMount = mode === 'guided'
  const { h, m, ask, d } = data
  const scene = sceneOf(data)
  const dark = scene.light === 'night'
  const { w: vw, h: vh } = useViewport()
  const l = layoutFor(vw, vh)
  const mins = useMemo(() => minsFor(d), [d])

  // SET: the hands the child is placing. Starts at twelve o'clock — a neutral face that gives
  // nothing away, and the one position every child can already recognise.
  const [sh, setSh] = useState(12)
  const [smIdx, setSmIdx] = useState(0)
  // READ: the phrase the child is building.
  const [rmIdx, setRmIdx] = useState(0)
  const [rh, setRh] = useState(12)

  const [done, setDone] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const erred = useRef(false)
  const settled = useRef(false)

  const gotM = ask === 'set' ? RING[smIdx] : mins[rmIdx]
  const gotH = ask === 'set' ? sh : rh
  const wantH = ask === 'set' ? h : spokenHourFor(h, m)

  const askText = askTextFor(data)

  useEffect(() => {
    // `speakAfterCurrent`: this mounts straight out of the lesson's last line, which is still
    // being said. Where nothing is talking it behaves exactly like `speak`.
    if (speakOnMount) speakAfterCurrent(askText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commit() {
    if (settled.current) return
    if (gotM === m && gotH === wantH) {
      settled.current = true
      setDone(true); setHint(null)
      speak(`Yes — ${wordsFor(h, m)}. Time to ${scene.what}!`)
      // He leaves on his own legs, and the round ends when he is actually gone.
      const j = inFlowJourney(MILO, l.miloH, Math.round(vw - l.miloLeft + l.miloW * 0.4))
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), j.ms + 500)
    } else {
      erred.current = true
      const t = hintFor(data, { h: gotH, m: gotM })
      // Everything spoken is also WRITTEN — a response that exists only as speech is silence on the
      // many devices with no usable voice, which is a tap that appears to do nothing.
      setHint(t); speak(t)
    }
  }

  const stepHour = (dir: -1 | 1) => {
    if (settled.current) return
    setHint(null)
    if (ask === 'set') setSh(v => wrap(v - 1 + dir, 12) + 1)
    else setRh(v => wrap(v - 1 + dir, 12) + 1)
  }
  const stepMin = (dir: -1 | 1) => {
    if (settled.current) return
    setHint(null)
    if (ask === 'set') setSmIdx(v => wrap(v + dir, RING.length))
    else setRmIdx(v => wrap(v + dir, mins.length))
  }

  const view: ClockView = ask === 'set'
    ? { h: sh, m: RING[smIdx], ring: showRing(d), label: done ? wordsFor(h, m) : null, glow: done }
    : { h, m, ring: showRing(d), label: done ? wordsFor(h, m) : null, glow: done }

  // On a read round the phrase IS the readout, so its parts carry their values; on a set round the
  // clock is the readout and the dials stay bare.
  const phrasePart = ask === 'read' ? minutePhrase(mins[rmIdx]) : 'Minutes'

  return (
    <>
      <Bubble L={l} dark={dark} chapter="time" text={hint ?? (done ? `That's right — ${wordsFor(h, m)}!` : askText)} />
      <div style={{
        position: 'fixed', left: 0, right: 0, top: l.clockTop, height: l.clockBand, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <StoryClock px={l.clockPx} view={view} />
      </div>
      <Bar L={l}>
        {ask === 'set' ? (
          <>
            <Dial short={l.short} dark={dark} label="Hour" minW={l.short ? 46 : 58} onStep={stepHour} disabled={done} />
            <Dial short={l.short} dark={dark} label="Minutes" minW={l.short ? 62 : 76} onStep={stepMin} disabled={done} />
            <Commit short={l.short} text="Set it ✓" onClick={commit} disabled={done} />
          </>
        ) : (
          <>
            <Dial short={l.short} dark={dark} label={phrasePart} minW={l.short ? 96 : 124} onStep={stepMin} disabled={done} />
            <Dial short={l.short} dark={dark} label={String(rh)} minW={l.short ? 28 : 34} onStep={stepHour} disabled={done} />
            <Commit short={l.short} text="Say it ✓" onClick={commit} disabled={done} />
          </>
        )}
      </Bar>
      <Milo L={l} vw={vw} leaving={done} resetKey={`${data.slot}-${data.ask}`} />
    </>
  )
}

// ─── the re-teach, after three wrong ──────────────────────────────────────────────────
const Reteach: React.FC<{ data: TimeRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h, m } = data
  const scene = sceneOf(data)
  const { w: vw, h: vh } = useViewport()
  const l = layoutFor(vw, vh)
  const [view, setView] = useState<ClockView>({ h: 12, m: 0, ring: true })
  const [line, setLine] = useState('')
  const doneRef = useLatestRef(onDone)

  useEffect(() => {
    const numeral = numeralForMinute(m)
    const lines = m === 0
      ? [`Look — the long hand points straight up at the twelve. That means o'clock.`,
         `And the short hand is on the ${h}.`,
         `So it is ${wordsFor(h, m)}.`]
      : [`The long hand is on the ${numeral}. On the outside ring, the ${numeral} means ${m} minutes.`,
         `The short hand is just past the ${h}.`,
         `So it is ${wordsFor(h, m)} — time to ${scene.what}.`]
    const steps: Array<() => void> = m === 0
      ? [() => setView({ h: 12, m: 0, ring: true, dim: 'hour', ringLit: [0] }),
         () => setView({ h, m: 0, ring: true, dim: 'minute', hiNumeral: h }),
         () => setView({ h, m, ring: true, label: wordsFor(h, m), glow: true })]
      : [() => setView({ h: 12, m, ring: true, dim: 'hour', ringLit: [m], hiNumeral: numeral }),
         () => setView({ h, m, ring: true, dim: 'minute', hiNumeral: h }),
         () => setView({ h, m, ring: true, label: wordsFor(h, m), glow: true })]
    // Self-paced for the same reason the lesson is — see the long note in `Lesson`. A re-teach whose
    // visuals hang off speech events freezes on any device that stops delivering them, and a frozen
    // re-teach is a dead end reached by a child who has already got three wrong.
    const cancel = speakPaced(lines, {
      onStep: i => { steps[i]?.(); setLine(lines[i]) },
      onDone: () => doneRef.current(),
      minMs: dwellFor,
      tailMs: 1200,
    })
    return () => { cancel(); stopSpeech() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Bubble L={l} dark={scene.light === 'night'} text={line || 'Let me show you again…'} />
      <div style={{ position: 'fixed', left: 0, right: 0, top: l.clockTop, height: l.clockBand, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <StoryClock px={l.clockPx} view={view} />
      </div>
      <Milo L={l} vw={vw} leaving={false} resetKey={`re${data.slot}`} />
    </>
  )
}

// ─── the lesson: four beats, unscored, before anything is graded ───────────────────────
/**
 * ⚠️ THIS IS THE PART THE OLD CHAPTER DID NOT HAVE, and it is the reason the chapter exists in this
 * shape. Two narrated screens is not "how to read a clock". One idea per beat, in a fixed order,
 * nothing scored — the pattern the colouring chapter settled — and the third beat is the payload:
 * the same twelve numbers mean minutes as well as hours, which is the fact everything else needs.
 *
 * The skip appears only from the SECOND run (`lessonSeen`). Offered on the first it is just a big
 * button a six-year-old presses to leave the teaching, and then meets a test nothing prepared them for.
 */
const BEATS = 4

const Lesson: React.FC<{ canSkip: boolean; onDone: () => void }> = ({ canSkip, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const l = layoutFor(vw, vh)
  const [beat, setBeat] = useState(0)
  const [view, setView] = useState<ClockView>({ h: 3, m: 0 })
  const [line, setLine] = useState('')
  /**
   * Beat 4 ends with the child doing one themselves, so the SET gesture is rehearsed before it counts.
   *
   * ⚠️ A REF, NOT STATE, AND THAT IS THE FIX FOR A REAL FAULT — the clock is drawn from `view`, so
   * this value is never rendered and was only ever read back inside the step handler. As `useState`
   * that read came from the render's CLOSURE, so every tap in one React batch saw the same stale
   * minute and **six taps advanced the hand by one** (measured on prod: 0 → 5, not 0 → 30). Distinct
   * human taps are usually separate ticks, but this repo has already shipped the same shape for real —
   * placeValue's undo, where three batched "back" taps all removed the same cube on a janky device,
   * which is why CoinShop's `lay` reads inside the updater. Here there is no second copy to keep in
   * step at all: a ref updates synchronously, so a burst of taps walks the ring one stop each.
   */
  const tryM = useRef(0)
  const [tryOk, setTryOk] = useState(false)
  /**
   * ⚠️ The dial appears when the child is ASKED for it, not when the last beat starts. Gated on the
   * beat index it showed up while Milo was still three sentences earlier explaining the ring — a
   * control offered before the instruction to use it, because `line` lags a new beat until its first
   * narration step fires and the render does not.
   */
  const [askTry, setAskTry] = useState(false)

  useEffect(() => {
    const advance = () => setBeat(b => b + 1)
    const script: Array<{ lines: string[]; steps: Array<() => void> }> = [
      { // ① two hands, and they are not the same
        lines: [
          'Every clock has two hands, and they are not the same.',
          'This short fat one is the HOUR hand. It tells you the hour.',
          'This long thin one is the MINUTE hand. It counts the minutes.',
        ],
        steps: [
          () => setView({ h: 3, m: 0 }),
          () => setView({ h: 3, m: 0, dim: 'minute', hiNumeral: 3 }),
          () => setView({ h: 3, m: 0, dim: 'hour' }),
        ],
      },
      { // ② the hour hand names the hour, with the long hand straight up
        lines: [
          'When the long hand points straight up at the twelve, we say o\'clock.',
          'The short hand tells us which one. Look — one o\'clock, two o\'clock, three o\'clock.',
          'Four, five, six… all the way round to twelve.',
        ],
        steps: [
          () => setView({ h: 12, m: 0, hiNumeral: 12, label: "12 o'clock" }),
          () => setView({ h: 3, m: 0, hiNumeral: 3, label: "3 o'clock" }),
          () => setView({ h: 9, m: 0, hiNumeral: 9, label: "9 o'clock" }),
        ],
      },
      { // ③ THE PAYLOAD — one set of numbers, two scales
        lines: [
          'Now the secret. This clock has another set of numbers hiding on it.',
          'The same six that means six hours ALSO means thirty minutes.',
          'They go up in fives all the way round — five, ten, fifteen, twenty, twenty-five, thirty.',
          'So the long hand does not say six. It says thirty.',
        ],
        steps: [
          () => setView({ h: 3, m: 0, ring: true }),
          () => setView({ h: 3, m: 0, ring: true, hiNumeral: 6, ringLit: [30] }),
          () => setView({ h: 3, m: 0, ring: true, ringLit: [5, 10, 15, 20, 25, 30] }),
          () => setView({ h: 3, m: 30, ring: true, ringLit: [30], hiNumeral: 6 }),
        ],
      },
      { // ④ name them — including the one that trips everybody
        lines: [
          'Long hand on the six is half past.',
          'On the three it is quarter past.',
          'On the nine we count the other way — quarter TO, and we say the NEXT hour.',
          'Your turn. Put the long hand on the six to make half past three.',
        ],
        steps: [
          () => setView({ h: 3, m: 30, ring: true, ringLit: [30], label: 'half past 3' }),
          () => setView({ h: 3, m: 15, ring: true, ringLit: [15], label: 'quarter past 3' }),
          () => setView({ h: 3, m: 45, ring: true, ringLit: [45], label: 'quarter to 4' }),
          () => { setView({ h: 3, m: 0, ring: true }); tryM.current = 0; setAskTry(true) },
        ],
      },
    ]
    const b = script[beat]
    if (!b) return
    const last = beat >= BEATS - 1

    /**
     * ⚠️ THE LESSON IS SELF-PACED ON A TIMER, WITH `speak()` ALONGSIDE — NOT DRIVEN BY `speakSteps`.
     *
     * It was `speakSteps`, and the founder found it **permanently stuck** on the third beat's last
     * line with no control on screen. The cause is that `speakSteps` reveals each visual from the
     * utterance's `onstart`, so THE TEACHING ONLY HAPPENS IF SPEECH KEEPS DELIVERING EVENTS. When a
     * device starts the first line and then silently drops the rest — which Chrome and Safari both
     * do — the sequence marches to the end on its per-line watchdogs while `onStep` never fires again:
     * the line, the clock and the "your turn" flag are all frozen at the last line that happened to
     * speak, and the flag that offers the child the dial is one of the things that never runs. There
     * is then no way forward at all.
     *
     * ⚠️ A first fix put a fixed cap behind it (`lines × 2900 + 4000` ≈ 15.6s). That was WORSE: four
     * lines at a real voice take about twenty seconds, so the cap fired mid-sentence and cancelled a
     * live utterance. **A backstop timed against the silent fallback is not timed against the thing it
     * is backing up** — and the preview pane has no voice, so every run I drove took the fallback path
     * and finished inside the cap. That is why I never saw any of this.
     *
     * So the visuals no longer depend on speech at all: each line dwells for a time derived from its
     * own length, and `speak()` rides along. This is the call MeasureIt already made for the same
     * reason, and it is why the colour and shape showcases are self-paced too.
     *
     * ⚠️ IT USED TO SAY THAT A SLOW VOICE HAVING ITS TAIL CUT WAS AN ACCEPTABLE PRICE. It was not —
     * the founder heard it, across every band, on 2026-09-04. `speakPaced` keeps the property that
     * matters (the visuals are on their OWN timer and can never hang on a missing speech event) and
     * removes the cut: a beat ends at the LATER of its dwell and Milo actually finishing, with a
     * ceiling so a device that never reports the end still rolls on.
     */
    const cancel = speakPaced(b.lines, {
      onStep: i => { b.steps[i]?.(); setLine(b.lines[i]) },
      // The last beat waits for the child (its final step has already offered the dial); the others roll on.
      onDone: last ? undefined : advance,
      minMs: dwellFor,
      tailMs: 600,
    })
    return () => { cancel(); stopSpeech() }
     
  }, [beat])

  // the child's one go, on the last beat
  const stepTry = (dir: -1 | 1) => {
    if (tryOk) return
    const nx = RING[wrap(RING.indexOf(tryM.current) + dir, RING.length)]
    tryM.current = nx
    setView({ h: 3, m: nx, ring: true, ringLit: [nx], label: nx === 30 ? 'half past 3' : null, glow: nx === 30 })
    if (nx === 30) {
      setTryOk(true)
      speak('That is it — half past three. Now you can read a clock.')
      window.setTimeout(onDone, 2200)
    }
  }

  const last = beat >= BEATS - 1
  return (
    <>
      <Bubble L={l} dark={false} text={line || 'Let us look at a clock together.'} />
      <div style={{ position: 'fixed', left: 0, right: 0, top: l.clockTop, height: l.clockBand, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <StoryClock px={l.clockPx} view={view} />
      </div>
      <Bar L={l}>
        {/*
          ⚠️ THERE IS DELIBERATELY NO "NEXT" HERE. The beats roll on by themselves, and a Next button
          on every beat is a skip button on the very first run — which is the exact thing `lessonSeen`
          exists to prevent: a six-year-old taps past the teaching and then meets a test nothing
          prepared them for. The only way forward is the one hands-on go on the last beat.
        */}
        {askTry && (
          <Dial short={l.short} label="Minutes" minW={l.short ? 62 : 76} onStep={stepTry} disabled={tryOk} />
        )}
        {canSkip && (
          <button onClick={onDone} style={{
            padding: l.short ? '7px 12px' : '9px 16px', borderRadius: 12, cursor: 'pointer',
            background: 'transparent', border: '2px solid rgba(61,37,22,.28)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: l.short ? 11 : 13, color: 'var(--ink-muted)',
          }}>Skip the lesson</button>
        )}
      </Bar>
      {/* dots, so a grown-up can see how much teaching is left */}
      <div style={{ position: 'fixed', left: 0, right: 0, top: l.top - 22, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 44 }}>
        {Array.from({ length: BEATS }).map((_, i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: 99, background: i <= beat ? 'var(--milo-orange)' : 'rgba(61,37,22,.22)' }} />
        ))}
      </div>
    </>
  )
}

// ─── beat ─────────────────────────────────────────────────────────────────────────────
export function makeTimeBeat(): Beat<TimeRound> {
  return {
    skillId: 'time', rounds: 10, walkEvery: 3,
    make: (d, round = 0, asked) => makeTimeRound((d || 1) as 1 | 2 | 3, round, asked as readonly Reading[] | undefined),
    // ⚠️ THE CLOSED SET. Mastery must not end the run before the child has been asked all four
    // readings — measured, a third of strong runs were finishing having never met a "to" time.
    coverage: { of: r => kindOf(r.m), all: READINGS },
    // ⚠️ THIS CHAPTER SAYS ITS OWN MISS LINES. `hintFor` names which hand is wrong, written in Milo's
    // bubble AND spoken, and the round retries in place — so SkillBeat's centred pill would land on
    // the clock face while saying "Let's look together", covering the one thing being read. And
    // because a round is only reported once it has been SOLVED, that pill plus the generic
    // encouragement arrived over "That's right — half past six!" and contradicted it.
    ownsFeedback: true,
    // Dedupe on the MATH and the DIRECTION — the same clock read and then set is two questions.
    sig: r => `${r.ask}:${r.h}:${r.m}`,
    // Empty on purpose: SkillBeat then renders no pill of its own, and Milo's bubble is the single
    // question region. Two pills saying the same thing land on top of each other at 640×320.
    prompt: () => '',
    // The VOICE still comes from here, off the same renderer the bubble writes, so what Milo says and
    // what the bubble shows cannot drift.
    say: r => askTextFor(r),
    Play: ({ data, onSubmit }) => <TimePlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <Reteach data={data} onDone={onDone} />,
  }
}

// ─── orchestrator ─────────────────────────────────────────────────────────────────────
const TT_CSS = `
@keyframes tt_fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
`

type Phase = 'intro' | 'lesson' | 'bridge' | 'guided' | 'practice'

/** The two rehearsals: one of each direction, because BOTH are graded and a graded gesture that was
 *  never walked through is a child marked wrong for a mechanic nobody showed them. */
const GUIDED: TimeRound[] = [
  { slot: 1, h: DAY[1].hour, m: 0, ask: 'read', d: 1 },
  { slot: 2, h: DAY[2].hour, m: 0, ask: 'set', d: 1 },
]

export default function TickTock({ onFinish, onExit }: {
  world?: string    // accepted and ignored — this chapter is one day, not three worlds
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const [phase, setPhase] = useChapterPhase<Phase>('intro', { chapter: 'time', phase: 'practice' })
  const [gIdx, setGIdx] = useState(0)
  const [slot, setSlot] = useState(0)
  const { w: vw, h: vh } = useViewport()
  const l = layoutFor(vw, vh)
  const learnerId = useMemo(() => getActiveLearner()?.id, [])
  const [canSkip] = useState(() => lessonSeen(getActiveLearner()?.id, 'time'))
  const { exit, tally } = useChapterShell(onFinish, onExit)
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeTimeBeat(), [])

  const shownSlot = phase === 'practice' ? slot : phase === 'guided' ? GUIDED[gIdx].slot : 0
  const sunPx = Math.round(Math.min(vh * 0.09, 62))

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: CHROME_PAD, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{
        background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999,
        padding: l.short ? '4px 14px' : '8px 20px', fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: l.short ? 12 : 17, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center',
      }}>{text}<DirectionsInline chapter="time" /></div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{TT_CSS}{CRITTER_CSS}</style>
      <Scene slot={shownSlot} sunPx={sunPx} />
      <div style={{ position: 'absolute', top: CHROME_PAD, left: 14, zIndex: 50 }}>
        {/* Sized from the same metrics `chromeTop` budgets for, so the band below cannot be wrong. */}
        <button onClick={exit} style={{
          padding: `${menuBtn(l.short).padY}px ${menuBtn(l.short).padX}px`, borderRadius: 50, minHeight: menuBtn(l.short).minH,
          background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: menuBtn(l.short).font, cursor: 'pointer',
        }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 6vw' }}>
          <div style={{
            maxWidth: 560, background: '#fff', border: '3px solid var(--outline)', borderRadius: 18,
            padding: l.short ? '10px 16px' : '16px 22px', fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: l.short ? 14 : 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)',
          }}>
            Milo has a whole day ahead — breakfast, the bus, the park, dinner, bed. He needs you to tell him
            the time. First, let us learn how a clock works.
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('lesson') }} style={{
            padding: l.short ? '11px 28px' : '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: l.short ? 17 : 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)',
          }}>Show me the clock ▶</button>
        </div>
      )}

      {phase === 'lesson' && (<>{Banner('How a clock works')}
        <Lesson canSkip={canSkip} onDone={() => { markLessonSeen(learnerId, 'time'); setPhase('bridge') }} /></>)}

      {/* The teaching, the pointing and the ring all stop at once. A child not told that has simply
          had the game taken away — so it is said out loud, once, on its own screen. */}
      {phase === 'bridge' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 6vw', animation: 'tt_fade .4s ease both' }}>
          <div style={{
            maxWidth: 540, background: '#fff', border: '3px solid var(--outline)', borderRadius: 18,
            padding: l.short ? '10px 16px' : '16px 22px', fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: l.short ? 14 : 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)',
          }}>
            Now Milo&apos;s day begins. Sometimes he will ask you what the clock says — and sometimes he will
            tell you a time and you move the hands. I will not point any more. You can do this!
          </div>
          <button onClick={() => setPhase('guided')} style={{
            padding: l.short ? '11px 28px' : '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: l.short ? 17 : 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)',
          }}>Start the day ▶</button>
        </div>
      )}

      {phase === 'guided' && (<>{Banner(gIdx === 0 ? 'Read the clock with Milo' : 'Now move the hands')}
        <TimePlay key={`g${gIdx}`} data={GUIDED[gIdx]} mode="guided"
          onComplete={() => { if (gIdx + 1 < GUIDED.length) setGIdx(gIdx + 1); else setPhase('practice') }} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: l.top - 8, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (typeof data?.slot === 'number') setSlot(data.slot) }}
            onComplete={tally} />
        </div>
      )}

      {/*
        Milo stands here for every phase that does not own him itself (TimePlay and Reteach do,
        because they need him to walk off). He must be on screen whenever the bubble is: the bubble
        has a TAIL, and a tail pointing at an empty corner is worse than no tail — it says the words
        belong to somebody who is not there. He was missing through the whole lesson.
        The gate asserts he has a registered drawn cycle, since he is the only thing here that moves.
      */}
      {(phase === 'intro' || phase === 'lesson' || phase === 'bridge') && hasSheet(MILO) && (
        <Milo L={l} vw={vw} leaving={false} resetKey={phase} />
      )}
    </div>
  )
}
