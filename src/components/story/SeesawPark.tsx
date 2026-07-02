'use client'
/**
 * Chapter (6–8) — COMPARE NUMBERS (skill `compareNumbers`) as STORY MODE.
 *
 * Comparing is MORE vs FEWER, carried by the world's own animals on a balance scale: the beam tips
 * DOWN toward the bigger side (level when equal). The child taps one of THREE big signs — >, <, = —
 * meaning "the LEFT number is greater / less / equal to the right". Two views of the same idea:
 *   OBJECTS — small numbers (≤10) ride the pans as GROUPS you can count (object-driven)
 *   NUMERALS — bigger numbers (to 50/100) ride as numeral cards (too many to show)
 * The pans stay LEVEL (counter-rotated) so the animals/numbers are always upright. The child PICKS
 * one of three worlds; the animals SHUFFLE and the scene rotates across the 10 adaptive rounds (one
 * continuous SkillBeat — wider range on a streak, gentler when struggling, re-teach after 3 wrong):
 *   🛝 Playground — bunny · cat · duck
 *   🌲 Forest     — squirrel · fox · bear
 *   🐸 Pond       — frog · fish · turtle
 *
 * Difficulty widens the range: L1 → to 10 (objects) · L2 → to 50 · L3 → to 100. The demo + 3-wrong
 * re-teach TILT the beam and reveal the sign via ONE speakSteps ("six is greater than three — the
 * greater-than sign!") — voice + visual synced when audio plays, timer-paced when blocked. Reuses
 * committed sprites only (no new assets). Wrapped by game/CompareChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import { SIGNS, compareSign } from '../lessons/CompareLesson'
import WorldSelect from './WorldSelect'
import FitBox from './FitBox'

// Live viewport — so the scale, signs and banner never collide on short/landscape frames.
function useViewport() {
  const [vp, setVp] = useState({ w: 1000, h: 700 })
  useEffect(() => {
    const calc = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    calc()
    window.addEventListener('resize', calc)
    window.addEventListener('orientationchange', calc)
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('orientationchange', calc) }
  }, [])
  return vp
}

// ─── Animals & Worlds ────────────────────────────────────────────────────────────────
interface Item { img: string; emoji: string }
const IT = (img: string, emoji: string): Item => ({ img: `/assets/objects/${img}.png`, emoji })
interface Bg { grad: string; img: string }
interface CmpWorld {
  id: string; label: string; emoji: string
  bgs: Bg[]
  items: Item[]
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
const WORLDS: CmpWorld[] = [
  { id: 'playground', label: 'Playground', emoji: '🛝',
    bgs: [
      { grad: 'linear-gradient(#cfe9f7 0%, #dff0d8 52%, #b6db94 100%)', img: '/assets/backgrounds/town_park.jpeg' },
      { grad: 'linear-gradient(#d6efff 0%, #e6f5d8 52%, #c2e69a 100%)', img: '/assets/backgrounds/garden_park.png' },
      { grad: 'linear-gradient(#d2eefc 0%, #e4f2d6 52%, #c0e498 100%)', img: '/assets/backgrounds/town_garden.jpeg' },
    ],
    items: [IT('bunny', '🐰'), IT('cat', '🐱'), IT('duck', '🦆')],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🛝' },
    intro: 'At the Playground, Milo puts animals on each side of the balance. The bigger number tips DOWN! Pick the sign that opens toward the bigger number. First, watch Milo!' },
  { id: 'forest', label: 'Forest', emoji: '🌲',
    bgs: [
      { grad: 'linear-gradient(#dbeecb 0%, #cfe4b4 55%, #a9cf88 100%)', img: '/assets/backgrounds/forest_1.jpeg' },
      { grad: 'linear-gradient(#d6ecc6 0%, #cae0ae 55%, #a4ca82 100%)', img: '/assets/backgrounds/forest_2.jpeg' },
      { grad: 'linear-gradient(#dcecc8 0%, #cfe2b0 55%, #a8cd86 100%)', img: '/assets/backgrounds/forest_3.jpeg' },
    ],
    items: [IT('squirrel', '🐿️'), IT('fox', '🦊'), IT('bear', '🐻')],
    milo: { src: '/assets/characters/milo_idle.png', emoji: '🦊', accessory: '🌲' },
    intro: 'In the Forest, Milo balances woodland friends. Whichever side has more tips DOWN! Pick the sign that opens toward the bigger number. First, watch Milo!' },
  { id: 'pond', label: 'Pond', emoji: '🐸',
    bgs: [
      { grad: 'linear-gradient(#cfeaf4 0%, #cfe6de 55%, #a9d3bc 100%)', img: '/assets/backgrounds/pond.jpeg' },
      { grad: 'linear-gradient(#d2ecf4 0%, #cfe8e0 55%, #acd6be 100%)', img: '/assets/backgrounds/pond_top.jpeg' },
      { grad: 'linear-gradient(#cfe8f4 0%, #cce4e2 55%, #a6d2c0 100%)', img: '/assets/backgrounds/lake.jpeg' },
    ],
    items: [IT('frog', '🐸'), IT('fish', '🐟'), IT('turtle', '🐢')],
    milo: { src: '/assets/characters/milo_fishing.png', emoji: '🦊', accessory: '🐸' },
    intro: 'Down at the Pond, Milo balances pond friends. The bigger number sinks DOWN! Pick the sign that opens toward the bigger number. First, watch Milo!' },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.bgs[0].img, itemImage: w.items[0].img }))

interface CmpRound { bg: number; item: Item; a: number; b: number; answer: string }

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
function signWord(sign: string): string { return sign === '>' ? 'greater than' : sign === '<' ? 'less than' : 'equal to' }

// Range widens with difficulty: 1 → to 10 (objects), 2 → to 50, 3 → to 100 (numerals).
function makeRound(world: CmpWorld, d: 1 | 2 | 3, round: number): CmpRound {
  const idx = round % world.items.length
  const item = world.items[idx]
  const bg = round % world.bgs.length
  const hi = d === 1 ? 10 : d === 2 ? 50 : 100
  const a = rint(1, hi)
  let b = rint(1, hi)
  if (rint(1, 4) === 1) b = a   // ~1 in 4 rounds force equal so '=' shows up
  return { bg, item, a, b, answer: compareSign(a, b) }
}
const objectsMode = (a: number, b: number) => Math.max(a, b) <= 10

// ─── Background (crossfades across the world's scenes) ────────────────────────────────
function Background({ bg, world }: { bg: number; world: CmpWorld }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#dbe8ef' }}>
      {world.bgs.map((b, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === bg ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: b.grad }} />
          <img src={b.img} alt="" draggable={false}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

function MiloHost({ left, milo }: { left: number; milo: CmpWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'sp_float 3.4s ease-in-out infinite' }}>
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

function ItemImg({ item, size }: { item: Item; size: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span style={{ fontSize: size, lineHeight: 1 }}>{item.emoji}</span>
  return <img src={item.img} alt="" draggable={false} onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
}

// ─── A pan: a group of animals (small n) OR a numeral card (big n) + a numeral chip ────
function Pan({ n, item, mode, glow, short }: { n: number; item: Item; mode: 'objects' | 'numeral'; glow: boolean; short?: boolean }) {
  const border = glow ? 'var(--sun-yellow)' : 'var(--outline)'
  const shadow = glow ? '0 0 18px var(--sun-yellow), 0 5px 0 rgba(61,37,22,.2)' : '0 5px 0 rgba(61,37,22,.2)'
  if (mode === 'numeral') {
    return (
      <div style={{
        minWidth: short ? 'clamp(48px,15vw,86px)' : 'clamp(58px,13vmin,110px)', padding: short ? '6px 10px' : 'clamp(8px,2vmin,18px) clamp(10px,2.4vmin,22px)',
        borderRadius: 20, background: 'var(--paper)', border: `5px solid ${border}`, boxShadow: shadow,
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(26px,8vh,46px)' : 'clamp(30px,7vmin,60px)', color: 'var(--ink)',
        textAlign: 'center', lineHeight: 1, transition: 'border-color .3s ease, box-shadow .3s ease',
      }}>{n}</div>
    )
  }
  const cols = n <= 3 ? n : n <= 6 ? 3 : 5
  const sz = short ? 'clamp(13px,3.2vh,22px)' : 'clamp(17px,3.3vmin,29px)'
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 2 : 4, padding: short ? '5px 7px' : 'clamp(6px,1.5vmin,11px)',
      borderRadius: 18, background: 'var(--paper)', border: `4px solid ${border}`, boxShadow: shadow, transition: 'border-color .3s ease, box-shadow .3s ease',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: short ? 1 : 'clamp(1px,0.5vmin,4px)', justifyItems: 'center' }}>
        {Array.from({ length: n }).map((_, i) => <ItemImg key={i} item={item} size={sz} />)}
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(16px,4vh,24px)' : 'clamp(18px,4vmin,30px)', color: 'var(--ink)', lineHeight: 1 }}>{n}</span>
    </div>
  )
}

// ─── The code-drawn balance scale — the bigger side tips DOWN; pans stay upright ───────
function Scale({ a, b, item, tilt, short }: { a: number; b: number; item: Item; tilt: boolean; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const angle = tilt ? (a > b ? -7 : a < b ? 7 : 0) : 0   // bigger side tips DOWN (−ve rotates left end down)
  const mode = objectsMode(a, b) ? 'objects' : 'numeral'
  const beamGrad = 'linear-gradient(#b98a4e,#8d6736)'
  const cell = (n: number, side: 'left' | 'right', big: boolean) => (
    // positioned at the beam end (so it rides up/down with the tilt) but counter-rotated to stay LEVEL
    <div style={{ position: 'absolute', [side]: '1%', bottom: '100%', transformOrigin: 'bottom center', transform: `rotate(${-angle}deg)`, transition: 'transform .8s cubic-bezier(.34,1.56,.64,1)', padding: '0 4px' }}>
      <Pan n={n} item={item} mode={mode} glow={tilt && big} short={short} />
    </div>
  )
  return (
    <FitBox availW={vw * 0.9} availH={short ? vh * 0.30 : vh * 0.40} max={2.4}>
      <div style={{ position: 'relative', width: 'min(90vw, 560px)', height: short ? 'clamp(150px,34vh,220px)' : 'clamp(230px,40vh,340px)', margin: '0 auto' }}>
        <div style={{ position: 'absolute', left: '50%', bottom: '26%', width: '92%', transform: `translateX(-50%) rotate(${angle}deg)`, transformOrigin: 'center', transition: 'transform .8s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ position: 'relative', height: short ? 10 : 'clamp(12px,2.2vmin,16px)', background: beamGrad, border: '2px solid #6b4f2a', borderRadius: 8, boxShadow: '0 3px 0 rgba(61,37,22,.3)' }}>
            {cell(a, 'left', a >= b)}
            {cell(b, 'right', b >= a)}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: short ? 14 : 20, height: short ? 14 : 20, borderRadius: '50%', background: '#6b4f2a', border: '2px solid #4a340f' }} />
          </div>
        </div>
        {/* fulcrum */}
        <div aria-hidden style={{ position: 'absolute', left: '50%', bottom: '6%', transform: 'translateX(-50%)', width: 0, height: 0,
          borderLeft: short ? '34px solid transparent' : 'clamp(40px,8vmin,72px) solid transparent', borderRight: short ? '34px solid transparent' : 'clamp(40px,8vmin,72px) solid transparent',
          borderBottom: `${short ? '58px' : 'clamp(74px,15vh,140px)'} solid #9c7440` }} />
        {/* ground base */}
        <div aria-hidden style={{ position: 'absolute', bottom: '2%', left: '50%', transform: 'translateX(-50%)', width: '56%', height: short ? 10 : 'clamp(10px,2vmin,16px)', background: 'linear-gradient(#8d6736,#6b4f2a)', borderRadius: 8, boxShadow: '0 4px 7px rgba(0,0,0,.25)' }} />
      </div>
    </FitBox>
  )
}

// ─── The three big sign buttons ───────────────────────────────────────────────────────
function SignRow({ picked, answer, onPick, revealed, short }: { picked: string | null; answer: string; onPick?: (s: string) => void; revealed?: boolean; short?: boolean }) {
  const size = short ? 'clamp(56px,15vh,80px)' : 'clamp(76px,15vmin,104px)'
  const locked = picked !== null || revealed
  return (
    <div style={{ display: 'flex', gap: short ? 'clamp(8px,2.5vw,18px)' : 'clamp(12px,3vw,24px)', justifyContent: 'center', flexWrap: 'wrap' }}>
      {SIGNS.map(ch => {
        const isSel = picked === ch, isOk = ch === answer
        const showOk = (picked !== null && isOk) || (revealed && isOk)
        return (
          <button key={ch} disabled={locked} onClick={() => onPick?.(ch)} aria-label={signWord(ch)} style={{
            width: size, height: size,
            background: showOk ? 'var(--garden-green-soft)' : 'var(--paper)',
            border: `5px solid ${showOk ? 'var(--garden-green)' : isSel ? 'var(--ink-muted)' : 'var(--outline)'}`,
            borderRadius: 24, boxShadow: `0 7px 0 ${showOk ? 'var(--garden-green-deep)' : '#c8ac79'}`,
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(30px,8vh,44px)' : 'clamp(40px,9vmin,54px)', color: 'var(--ink)',
            cursor: locked ? 'default' : 'pointer', transform: showOk ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
            transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), background 160ms ease',
          }}>{ch}</button>
        )
      })}
    </div>
  )
}

// ─── Interactive play surface (guided / practice) ───────────────────────────────────
type Mode = 'guided' | 'practice'
const sayFor = (d: CmpRound) => `${numberToWords(d.a)} and ${numberToWords(d.b)}. Which sign is right?`

const ComparePlay: React.FC<{ world: CmpWorld; data: CmpRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { a, b, item, answer } = data
  const { h: vh } = useViewport()
  const short = vh < 470
  const [tilt, setTilt] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const erred = useRef(false), done = useRef(false)

  useEffect(() => {
    const t = window.setTimeout(() => setTilt(true), 400)
    if (mode === 'guided') speak(sayFor(data))
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(ch: string) {
    if (done.current || picked !== null) return
    if (ch === answer) {
      setPicked(ch); done.current = true
      if (mode === 'guided') speak(answer === '=' ? `Yes! ${numberToWords(a)} equals ${numberToWords(b)}!` : `Yes! ${numberToWords(a)} is ${signWord(answer)} ${numberToWords(b)}!`)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1300)
    } else {
      erred.current = true
      speak('Look again — which side is bigger? Try once more!')
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', top: short ? 52 : 80, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 560px)', background: 'rgba(255,255,255,.92)', border: '3px solid var(--outline)', borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          Which sign is right?
        </div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '52%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 'clamp(8px,2vh,16px)' : 'clamp(12px,3vh,28px)' }}>
        <Scale a={a} b={b} item={item} tilt={tilt} short={short} />
        <SignRow picked={picked} answer={answer} onPick={choose} short={short} />
      </div>
    </>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach): tilt + reveal via ONE speakSteps ─
const CompareExplain: React.FC<{ world: CmpWorld; data: CmpRound; onDone: () => void }> = ({ data, onDone }) => {
  const { a, b, item, answer } = data
  const { h: vh } = useViewport()
  const short = vh < 470
  const [tilt, setTilt] = useState(false)
  const [reveal, setReveal] = useState(false)
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines = [
      `${numberToWords(a)} on this side, and ${numberToWords(b)} on that side.`,
      answer === '=' ? `They are the same — ${numberToWords(a)} equals ${numberToWords(b)}.` : `${numberToWords(a)} is ${signWord(answer)} ${numberToWords(b)}.`,
      `So the sign is ${signWord(answer)}!`,
    ]
    const steps: Array<() => void> = [
      () => { setTilt(false); setReveal(false) },
      () => setTilt(true),
      () => setReveal(true),
    ]
    const cancel = speakSteps(lines, {
      onStep: (i) => { steps[i]?.() },
      onDone: () => { window.setTimeout(() => doneRef.current(), 1200) },
      fallbackStepMs: 1350,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <div style={{ position: 'fixed', top: short ? 52 : 80, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 560px)', background: 'rgba(255,255,255,.92)', border: '3px solid var(--outline)', borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          Watch the balance tip
        </div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '52%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 'clamp(8px,2vh,16px)' : 'clamp(12px,3vh,28px)' }}>
        <Scale a={a} b={b} item={item} tilt={tilt} short={short} />
        <SignRow picked={null} answer={answer} revealed={reveal} short={short} />
      </div>
    </>
  )
}

// ─── Beat ───────────────────────────────────────────────────────────────────────────
function makeCompareBeat(world: CmpWorld): Beat<CmpRound> {
  return {
    skillId: 'compareNumbers', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeRound(world, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.a}:${d.b}`,   // dedupe on the MATH (the pair), not the rotating scene/animal
    prompt: () => 'Which sign is right?',
    say: d => sayFor(d),
    Play: ({ data, onSubmit }) => <ComparePlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <CompareExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const SP_CSS = `
@keyframes sp_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function SeesawPark({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [world, setWorld] = useState<CmpWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
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
  const beat = useMemo(() => (world ? makeCompareBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall we compare numbers today?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setBg(0); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  // Demo teaches all three signs: greater (>), less (<), then equal (=) — all object-driven.
  const DEMO: CmpRound[] = [
    { bg: 0, item: world.items[0], a: 6, b: 3, answer: compareSign(6, 3) },
    { bg: 1 % world.bgs.length, item: world.items[1] ?? world.items[0], a: 2, b: 8, answer: compareSign(2, 8) },
    { bg: 2 % world.bgs.length, item: world.items[2] ?? world.items[0], a: 4, b: 4, answer: compareSign(4, 4) },
  ]
  const guidedIdx = 2 % world.items.length
  const GUIDED: CmpRound = { bg: guidedIdx % world.bgs.length, item: world.items[guidedIdx], a: 3, b: 7, answer: compareSign(3, 7) }
  const bgIdx = phase === 'practice' ? bg : phase === 'guided' ? GUIDED.bg : DEMO[Math.min(demoIdx, DEMO.length - 1)].bg

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{SP_CSS}</style>
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
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s compare! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo compare  (${demoIdx + 1}/${DEMO.length})`)}
        <CompareExplain key={`demo${demoIdx}`} world={world} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Pick the right sign')}
        <ComparePlay key="guided" world={world} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
