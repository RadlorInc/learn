'use client'
/**
 * Chapter (6–8) — TIME (skill `time`) as STORY MODE.
 *
 * Telling time is READING A CLOCK — and the clock is the hero object. Reading an analog clock
 * needs exact hands, and AI image models are unreliable at drawing correct clocks, so the clock is
 * code-drawn SVG (polished, with hands that sweep into place) — the same "SVG for the precise math"
 * choice used for the fraction wholes. The child PICKS one of three times of day; the world's
 * activity SHUFFLES and the scene rotates across the 10 adaptive rounds (one continuous SkillBeat —
 * harder on a streak, gentler when struggling, re-teach after 3 wrong):
 *   ☀️ Morning   — breakfast & snacks (cookie / cupcake / apple)
 *   🌳 Afternoon — the park           (balloon / butterfly / sunflower)
 *   🌙 Nighttime — stargazing         (star / planet / comet)
 *
 * Difficulty follows the locked ladder: L1 o'clock → L2 + half past → L3 + quarter past / to.
 * The demo + 3-wrong re-teach SWEEP THE HANDS into place via ONE speakSteps — "the big hand points
 * to twelve, the little hand to three… three o'clock!" (voice + visual synced when audio plays,
 * timer-paced when blocked). Reuses committed sprites only; the clock is code-drawn. Wrapped by
 * game/TimeChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import { timeLabel, makeTimeChoices } from '../lessons/TimeLesson'
import WorldSelect from './WorldSelect'
import FitBox from './FitBox'
import { useViewport } from '@/lib/useViewport'

// Live viewport — so the clock, activity chip and answer pills never overlap on short frames.

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]

function handsExplain(h: number, m: number): string {
  if (m === 0) return `The big hand points to twelve, and the little hand to ${numberToWords(h)}.`
  if (m === 30) return 'The big hand points to six — that means half past.'
  if (m === 15) return 'The big hand points to three — that means quarter past.'
  return 'The big hand points to nine — that means quarter to.'
}
function minsFor(d: 1 | 2 | 3): number[] { return d === 1 ? [0] : d === 2 ? [0, 30] : [0, 30, 15, 45] }

// ─── Activities & Worlds ─────────────────────────────────────────────────────────────
interface Activity { img: string; emoji: string; caption: string }
const AC = (img: string, emoji: string, caption: string): Activity => ({ img: `/assets/objects/${img}.png`, emoji, caption })
interface Bg { grad: string; img: string }
interface TimeWorld {
  id: string; label: string; emoji: string
  rim: string                       // clock rim colour (per world)
  bgs: Bg[]
  activities: Activity[]
  dark?: boolean
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
const WORLDS: TimeWorld[] = [
  { id: 'morning', label: 'Morning', emoji: '☀️', rim: '#e8912a',
    bgs: [
      { grad: 'linear-gradient(#fdf0d4 0%, #f7e6c8 60%, #eed6ac 100%)', img: '/assets/backgrounds/kitchen_fruit.jpeg' },
      { grad: 'linear-gradient(#fdeecd 0%, #f6e4c6 60%, #ecd4aa 100%)', img: '/assets/backgrounds/town_street.jpeg' },
      { grad: 'linear-gradient(#fbeed2 0%, #f4e6cc 60%, #e8d6ae 100%)', img: '/assets/backgrounds/town_garden.jpeg' },
    ],
    activities: [AC('cookie', '🍪', 'Breakfast'), AC('candy_cupcake', '🧁', 'Snack time'), AC('apple', '🍎', 'A healthy bite')],
    milo: { src: '/assets/characters/milo_chef.png', emoji: '🦊', accessory: '☀️' },
    intro: "Good morning! Milo's day is starting. Read the clock to see what time it is, then tap the time. First, watch Milo!" },
  { id: 'afternoon', label: 'Afternoon', emoji: '🌳', rim: '#4aae6b',
    bgs: [
      { grad: 'linear-gradient(#cfe9f6 0%, #dcecda 60%, #c6e0b4 100%)', img: '/assets/backgrounds/town_park.jpeg' },
      { grad: 'linear-gradient(#d2eaf5 0%, #dfeed9 60%, #c8e2b6 100%)', img: '/assets/backgrounds/garden_park.png' },
      { grad: 'linear-gradient(#cfe8f4 0%, #dcecd8 60%, #c4dfb2 100%)', img: '/assets/backgrounds/garden_meadow.png' },
    ],
    activities: [AC('rainbow_balloon', '🎈', 'Balloon fun'), AC('butterfly', '🦋', 'Chasing butterflies'), AC('flower_sunflower', '🌻', 'Picking flowers')],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌳' },
    intro: "It's a sunny afternoon! Milo plays in the park. Read the clock to see what time it is, then tap the time. First, watch Milo!" },
  { id: 'night', label: 'Nighttime', emoji: '🌙', rim: '#5b6bd8', dark: true,
    bgs: [
      { grad: 'linear-gradient(#1a2350 0%, #232c58 60%, #2c2050 100%)', img: '/assets/backgrounds/space_moon.png' },
      { grad: 'linear-gradient(#141d3f 0%, #1c2450 60%, #26204c 100%)', img: '/assets/backgrounds/space_deepspace.png' },
      { grad: 'linear-gradient(#181f46 0%, #202a56 60%, #2a2452 100%)', img: '/assets/backgrounds/space_launchpad.png' },
    ],
    activities: [AC('star', '⭐', 'Stargazing'), AC('planet', '🪐', 'Space dreams'), AC('comet', '☄️', 'Comet watch')],
    milo: { src: '/assets/characters/milo_idle.png', emoji: '🦊', accessory: '🌙' },
    intro: "The stars are out! It's nearly bedtime for Milo. Read the clock to see what time it is, then tap the time. First, watch Milo!" },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.bgs[0].img, itemImage: w.activities[0].img }))

interface TimeRound { bg: number; activity: Activity; h: number; m: number; mins: number[]; answer: string }

function makeTimeRound(world: TimeWorld, d: 1 | 2 | 3, round: number): TimeRound {
  const idx = round % world.activities.length
  const activity = world.activities[idx]
  const bg = round % world.bgs.length
  const mins = minsFor(d)
  const h = rint(1, 12)
  const m = pick(mins)
  return { bg, activity, h, m, mins, answer: timeLabel(h, m) }
}

// ─── Background (crossfades across the world's bg list) ───────────────────────────────
function Background({ bg, world }: { bg: number; world: TimeWorld }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: world.dark ? '#161d3a' : '#f3ead8' }}>
      {world.bgs.map((b, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === bg ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: b.grad }} />
          <img src={b.img} alt="" draggable={false}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: world.dark ? 0.8 : 1 }} />
        </div>
      ))}
    </div>
  )
}

function MiloHost({ left, milo }: { left: number; milo: TimeWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'tt_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 80, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>{milo.emoji}</span>
              <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 34 }}>{milo.accessory}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

function Sprite({ img, emoji, size }: { img: string; emoji: string; size: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>
  return <img src={img} alt="" draggable={false} onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
}

// The little "what Milo is doing now" card (top-left, below the Menu button); shuffles each round.
function ActivityChip({ activity, short, dark }: { activity: Activity; short?: boolean; dark?: boolean }) {
  return (
    <div style={{ position: 'fixed', top: short ? 50 : 64, left: 14, zIndex: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.9)', border: `3px solid ${dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 16, padding: short ? '4px 8px' : '6px 10px', boxShadow: '0 3px 0 rgba(61,37,22,.14)', maxWidth: 104 }}>
      <Sprite img={activity.img} emoji={activity.emoji} size={short ? '32px' : 'clamp(40px,6.5vh,56px)'} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 10 : 12, color: dark ? '#fff' : 'var(--ink)', textAlign: 'center', lineHeight: 1.1 }}>{activity.caption}</span>
    </div>
  )
}

// ─── The clock (code-drawn for precision; hands sweep to (h,m)) ───────────────────────
const R2 = Math.PI / 180
function StoryClock({ h, m, showLabel, glow, rim, short }: { h: number; m: number; showLabel: boolean; glow: boolean; rim: string; short?: boolean }) {
  const minA = m * 6, hourA = (h % 12) * 30 + m * 0.5
  const width = short ? 'clamp(148px,40vh,238px)' : 'clamp(210px,46vmin,340px)'
  const handG = (angle: number): React.CSSProperties => ({ transformBox: 'view-box', transformOrigin: '100px 100px', transform: `rotate(${angle}deg)`, transition: 'transform .7s cubic-bezier(.34,1.4,.5,1)' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px,2vh,16px)' }}>
      <svg viewBox="0 0 200 200" style={{ width, height: width, maxWidth: '82vw', filter: glow ? 'drop-shadow(0 0 18px var(--sun-yellow))' : 'drop-shadow(0 8px 12px rgba(0,0,0,.3))', transition: 'filter .3s ease' }}>
        <circle cx={100} cy={100} r={97} fill={rim} stroke="rgba(0,0,0,.25)" strokeWidth={3} />
        <circle cx={100} cy={100} r={86} fill="var(--paper)" stroke="rgba(0,0,0,.12)" strokeWidth={2} />
        {/* minute ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = i * 30 * R2
          return <line key={`t${i}`} x1={100 + 80 * Math.sin(a)} y1={100 - 80 * Math.cos(a)} x2={100 + 86 * Math.sin(a)} y2={100 - 86 * Math.cos(a)} stroke="rgba(0,0,0,.35)" strokeWidth={2.5} strokeLinecap="round" />
        })}
        {/* numbers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const n = i + 1, a = n * 30 * R2
          return <text key={n} x={100 + 66 * Math.sin(a)} y={100 - 66 * Math.cos(a)} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display)" fontWeight="900" fontSize="19" fill="var(--ink)">{n}</text>
        })}
        {/* hour hand */}
        <g style={handG(hourA)}><line x1={100} y1={110} x2={100} y2={56} stroke="var(--ink)" strokeWidth={8} strokeLinecap="round" /></g>
        {/* minute hand */}
        <g style={handG(minA)}><line x1={100} y1={114} x2={100} y2={30} stroke="var(--milo-orange)" strokeWidth={6} strokeLinecap="round" /></g>
        <circle cx={100} cy={100} r={8} fill="var(--milo-orange-deep)" stroke="#fff" strokeWidth={2} />
      </svg>
      <div style={{
        opacity: showLabel ? 1 : 0, transform: showLabel ? 'scale(1)' : 'scale(.7)', transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
        background: 'var(--milo-orange)', color: '#fff', borderRadius: 999, padding: short ? '5px 18px' : '8px 26px',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(15px,4vh,20px)' : 'clamp(20px,3.4vmin,28px)', boxShadow: '0 4px 0 rgba(242,107,44,.35)', whiteSpace: 'nowrap',
      }}>{timeLabel(h, m)}</div>
    </div>
  )
}

interface DispState { h: number; m: number; showLabel: boolean; glow: boolean }
function Stage({ world, data, s, short }: { world: TimeWorld; data: TimeRound; s: DispState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.9
  const availH = short ? vh * 0.36 : vh * 0.52
  return (
    <>
      <ActivityChip activity={data.activity} short={short} dark={world.dark} />
      <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
        <FitBox availW={availW} availH={availH} max={2.4}>
          <StoryClock h={s.h} m={s.m} showLabel={s.showLabel} glow={s.glow} rim={world.rim} short={short} />
        </FitBox>
      </div>
    </>
  )
}

// ─── Interactive play surface (guided / practice) ─────────────────────────────────────
type Mode = 'guided' | 'practice'
const sayFor = (d: TimeRound) => `It's time for ${d.activity.caption.toLowerCase()}. What time is it?`

const TimePlay: React.FC<{ world: TimeWorld; data: TimeRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { h, m, mins, answer } = data
  const choices = useMemo(() => makeTimeChoices(h, m, mins), [h, m, mins])
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<DispState>({ h, m, showLabel: false, glow: false })
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const erred = useRef(false), done = useRef(false)
  const set = (patch: Partial<DispState>) => setS(prev => ({ ...prev, ...patch }))
  const pill = Math.max(112, Math.min(short ? 170 : 210, Math.round(vw / 3.4)))

  useEffect(() => {
    const T: number[] = []
    if (mode === 'guided') speak(sayFor(data))
    T.push(window.setTimeout(() => { setAsking(true); speak('What time is it?') }, 900))
    return () => T.forEach(id => window.clearTimeout(id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(c: string) {
    if (done.current || picked !== null || !asking) return
    setPicked(c)
    if (c === answer) {
      done.current = true
      set({ showLabel: true, glow: true })
      if (mode === 'guided') speak(`Yes! It is ${answer}.`)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1500)
    } else {
      erred.current = true
      speak('Not quite — look at the little hand for the hour. Try again!')
      window.setTimeout(() => setPicked(null), 1100)
    }
  }

  return (
    <>
      <Stage world={world} data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 56 : 80, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 560px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          What time is it?
        </div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? 8 : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? 8 : 'clamp(10px,2.5vw,20px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {choices.map(c => {
          const isPick = picked === c, isOk = c === answer
          return (
            <button key={c} onClick={() => choose(c)} disabled={picked !== null} style={{
              minWidth: pill, padding: short ? '8px 12px' : '13px 18px', borderRadius: 16,
              background: (isPick && isOk) ? 'var(--garden-green-soft)' : 'var(--paper)',
              border: `4px solid ${(isPick && isOk) ? 'var(--garden-green)' : isPick ? 'var(--ink-muted)' : 'var(--outline)'}`,
              boxShadow: `0 6px 0 ${(isPick && isOk) ? 'var(--garden-green-deep)' : '#c8ac79'}`,
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(13px,3.6vh,17px)' : 'clamp(16px,2.4vh,21px)', color: 'var(--ink)',
              cursor: picked !== null ? 'default' : 'pointer', transform: (isPick && isOk) ? 'scale(1.06) translateY(-3px)' : 'scale(1)',
              transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), background 160ms ease',
            }}>{c}</button>
          )
        })}
      </div>
    </>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach): sweep the hands via ONE speakSteps ────
const TimeExplain: React.FC<{ world: TimeWorld; data: TimeRound; onDone: () => void }> = ({ world, data, onDone }) => {
  const { h, m, answer } = data
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<DispState>({ h: 12, m: 0, showLabel: false, glow: false })
  const set = (patch: Partial<DispState>) => setS(prev => ({ ...prev, ...patch }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines = [
      `It's time for ${data.activity.caption.toLowerCase()}. Look at the clock!`,
      handsExplain(h, m),
      `It is ${answer}!`,
    ]
    const steps: Array<() => void> = [
      () => set({ h: 12, m: 0, showLabel: false, glow: false }),
      () => set({ h, m }),   // hands sweep from 12:00 to the target
      () => set({ showLabel: true, glow: true }),
    ]
    const cancel = speakSteps(lines, {
      onStep: (i) => { steps[i]?.() },
      onDone: () => { window.setTimeout(() => doneRef.current(), 1200) },
      fallbackStepMs: 1300,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Stage world={world} data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 56 : 80, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 560px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          Read the clock with Milo
        </div>
      </div>
    </>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeTimeBeat(world: TimeWorld): Beat<TimeRound> {
  return {
    skillId: 'time', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeTimeRound(world, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.h}:${d.m}`,   // dedupe on the MATH (the time), not the rotating scene/activity
    prompt: () => 'What time is it?',
    say: d => sayFor(d),
    Play: ({ data, onSubmit }) => <TimePlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <TimeExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const TT_CSS = `
@keyframes tt_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function TickTock({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [world, setWorld] = useState<TimeWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
  const [phase, setPhase] = useState<Phase>('intro')
  const [bg, setBg] = useState(0)
  const [demoIdx, setDemoIdx] = useState(0)
  const { h: vh } = useViewport()
  const short = vh < 470
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])

  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true
    stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => (world ? makeTimeBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="When shall we tell the time?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setBg(0); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  // Demo shows an o'clock then a half-past (different activities); guided is a gentle o'clock.
  const DEMO: TimeRound[] = [
    { bg: 0, activity: world.activities[0], h: 3, m: 0, mins: [0, 30], answer: timeLabel(3, 0) },
    { bg: 1 % world.bgs.length, activity: world.activities[1] ?? world.activities[0], h: 6, m: 30, mins: [0, 30], answer: timeLabel(6, 30) },
  ]
  const guidedIdx = 2 % world.activities.length
  const GUIDED: TimeRound = { bg: guidedIdx % world.bgs.length, activity: world.activities[guidedIdx], h: 8, m: 0, mins: [0], answer: timeLabel(8, 0) }
  const bgIdx = phase === 'practice' ? bg : phase === 'guided' ? GUIDED.bg : DEMO[Math.min(demoIdx, DEMO.length - 1)].bg

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{TT_CSS}</style>
      <Background bg={bgIdx} world={world} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '76%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 15 : 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {world.intro}
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s tell time! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo read the clock  (${demoIdx + 1}/${DEMO.length})`)}
        <TimeExplain key={`demo${demoIdx}`} world={world} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the time')}
        <TimePlay key="guided" world={world} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (typeof data?.bg === 'number') setBg(data.bg) }}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
      )}

      <MiloHost left={10} milo={world.milo} />
    </div>
  )
}
