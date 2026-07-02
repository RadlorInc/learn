'use client'
/**
 * Chapter (6–8) — STORY PROBLEMS (skill `storyProblems`) as STORY MODE.
 *
 * The child HEARS a little story and watches the world's OWN objects act it out, then taps the
 * answer. Three problem types, all carried by the same shuffling world objects:
 *   ADD      — Milo has `a`, then `b` MORE join   → count them all      (answer a+b)
 *   TAKE-AWAY— Milo has `a`, then `b` LEAVE       → count what's left    (answer a-b)
 *   COMPARE  — Milo has `a`, a friend has `b`      → how many MORE?       (answer a-b, a>b)
 * The child PICKS one of three worlds; the world's items SHUFFLE and the scene rotates across the
 * 10 adaptive rounds (one continuous SkillBeat — harder on a streak, gentler when struggling,
 * re-teach after 3 wrong):
 *   🧺 Picnic Meadow — apples/cookies/cherries/pears  (Milo packs · eats · shares)
 *   🐠 Coral Reef    — fish/crabs/turtles/octopuses    (swim over · swim away · who has more)
 *   🎪 Fun Fair      — balloons/flags/prizes/lanterns   (appear · float away · who has more)
 *
 * Numbers stay small enough to SHOW the objects (object-driven, per the locked 6–8 rules) — the
 * difficulty grows by mixing in take-away then compare and nudging the totals up, not by going
 * two-digit. The demo + 3-wrong re-teach narrate the story via ONE speakSteps (voice + visual
 * synced when audio plays, timer-paced when blocked). Reuses committed sprites only.
 * Wrapped by game/StoryProblemsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import WorldSelect from './WorldSelect'
import { TintedSprite } from './TintedSprite'

// Live viewport size — for layouts that must RESERVE room (objects vs. the answer buttons)
// so they never overlap on a short/landscape screen.
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

// ─── Items & Worlds ──────────────────────────────────────────────────────────────────
interface Item { img: string; emoji: string; one: string; many: string; tint?: string }
const IT = {
  apple:   { img: '/assets/objects/apple.png',     emoji: '🍎', one: 'apple',   many: 'apples' },
  cookie:  { img: '/assets/objects/cookie.png',    emoji: '🍪', one: 'cookie',  many: 'cookies' },
  cherry:  { img: '/assets/objects/cherry.png',    emoji: '🍒', one: 'cherry',  many: 'cherries' },
  pear:    { img: '/assets/objects/pear.png',      emoji: '🍐', one: 'pear',    many: 'pears' },
  fish:    { img: '/assets/objects/reef_fish.png', emoji: '🐠', one: 'fish',    many: 'fish' },
  crab:    { img: '/assets/objects/crab.png',      emoji: '🦀', one: 'crab',    many: 'crabs' },
  turtle:  { img: '/assets/objects/turtle.png',    emoji: '🐢', one: 'turtle',  many: 'turtles' },
  octopus: { img: '/assets/objects/octopus.png',   emoji: '🐙', one: 'octopus', many: 'octopuses' },
  balloon: { img: '/assets/objects/balloon.png',     emoji: '🎈', one: 'balloon', many: 'balloons' },   // already colour
  // pat_* are GREYSCALE → tint them (star.png dropped: it has an opaque grey background, not a cutout).
  flag:    { img: '/assets/objects/pat_flag.png',    emoji: '🚩', one: 'flag',    many: 'flags',    tint: '#e0483f' },
  lantern: { img: '/assets/objects/pat_lantern.png', emoji: '🏮', one: 'lantern', many: 'lanterns', tint: '#e8912a' },
} satisfies Record<string, Item>

interface Bg { grad: string; img: string }
interface SpWorld {
  id: string; label: string; emoji: string
  bgs: Bg[]
  items: Item[]
  friend: string           // the compare-friend's name
  join: string             // add verb: "picks", "meets", "spots"
  leave: string            // take-away phrase: "{b} get eaten", "{b} swim away", "{b} zoom away"
  dark?: boolean
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
const WORLDS: SpWorld[] = [
  { id: 'picnic', label: 'Picnic Meadow', emoji: '🧺',
    bgs: [
      { grad: 'linear-gradient(#dff0c8 0%, #eaf7d6 52%, #cfe9a8 100%)', img: '/assets/backgrounds/farm_orchard.png' },
      { grad: 'linear-gradient(#e8f3cf 0%, #eef7da 52%, #d6ecb0 100%)', img: '/assets/backgrounds/town_garden.jpeg' },
      { grad: 'linear-gradient(#eaf4d4 0%, #f2f6dc 52%, #d8ead8 100%)', img: '/assets/backgrounds/beach_picnic.png' },
    ],
    items: [IT.apple, IT.cookie, IT.cherry, IT.pear], friend: 'Pat', join: 'packs', leave: 'get eaten',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🧺' },
    intro: "It's picnic time! Listen to Milo's story, watch it happen, then tap the number that answers it. Ready? First, let's hear one together!" },
  { id: 'reef', label: 'Coral Reef', emoji: '🐠',
    bgs: [
      { grad: 'linear-gradient(#aee3f2 0%, #7fcbe8 55%, #4ea7cf 100%)', img: '/assets/backgrounds/reef_open.png' },
      { grad: 'linear-gradient(#bfe9f4 0%, #8fd2ea 55%, #5bb0d4 100%)', img: '/assets/backgrounds/reef_sand.png' },
      { grad: 'linear-gradient(#a9dff0 0%, #79c6e4 55%, #469fc8 100%)', img: '/assets/backgrounds/underwater.jpeg' },
    ],
    items: [IT.fish, IT.crab, IT.turtle, IT.octopus], friend: 'Finn', join: 'meets', leave: 'swim away',
    milo: { src: '/assets/characters/milo_underwater.png', emoji: '🐢', accessory: '🫧' },
    intro: "Dive into the reef! Listen to Milo's story, watch it happen, then tap the number that answers it. Ready? First, let's hear one together!" },
  { id: 'fair', label: 'Fun Fair', emoji: '🎪',
    bgs: [
      { grad: 'linear-gradient(#e6f0ff 0%, #f2e6f7 55%, #ffe6ef 100%)', img: '/assets/backgrounds/balloon_fair.png' },
      { grad: 'linear-gradient(#dfeefe 0%, #eae6fb 55%, #f6e6f2 100%)', img: '/assets/backgrounds/fair_sky.png' },
      { grad: 'linear-gradient(#fdeede 0%, #f8e6ee 55%, #efe0f4 100%)', img: '/assets/backgrounds/fair_prizes.png' },
    ],
    items: [IT.balloon, IT.flag, IT.lantern], friend: 'Bo', join: 'wins', leave: 'float away',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🎈' },
    intro: "Step right up to the Fun Fair! Listen to Milo's story, watch it happen, then tap the number that answers it. Ready? First, let's hear one together!" },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.bgs[0].img, itemImage: w.items[0].img }))

type Op = 'add' | 'sub' | 'compare'
interface SpRound { bg: number; item: Item; op: Op; a: number; b: number; answer: number }

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
const qty = (n: number, it: Item) => `${n} ${n === 1 ? it.one : it.many}`

function buildChoices(answer: number): number[] {
  const opts = new Set<number>([answer])
  while (opts.size < 3) {
    const d = rint(1, 3)
    const v = Math.random() < 0.5 ? answer + d : Math.max(0, answer - d)
    if (v !== answer) opts.add(v)
  }
  const arr = [...opts]
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr
}

// Numbers stay small enough to SHOW the objects; difficulty mixes in more operations + bigger totals.
function makeStoryRound(world: SpWorld, d: 1 | 2 | 3, round: number): SpRound {
  const bg = round % world.bgs.length
  const item = world.items[round % world.items.length]
  const ops: Op[] = d === 1 ? ['add', 'sub'] : d === 2 ? ['add', 'sub', 'sub'] : ['add', 'sub', 'compare', 'compare']
  const op = pick(ops)
  let a: number, b: number, answer: number
  if (op === 'add') {
    const cap = d === 1 ? 9 : d === 2 ? 13 : 16
    a = rint(1, cap - 2); b = rint(1, Math.max(1, cap - a)); answer = a + b
  } else if (op === 'sub') {
    a = d === 1 ? rint(3, 9) : d === 2 ? rint(5, 13) : rint(6, 16)
    b = rint(1, a - 1); answer = a - b
  } else { // compare — Milo has the bigger pile
    a = d === 3 ? rint(4, 12) : rint(3, 8)
    b = rint(1, a - 1); answer = a - b
  }
  return { bg, item, op, a, b, answer }
}

function storyText(world: SpWorld, op: Op, a: number, b: number, it: Item) {
  if (op === 'add')
    return { story: `Milo has ${qty(a, it)}. Then Milo ${world.join} ${b} more!`, question: `How many ${it.many} altogether?` }
  if (op === 'sub')
    return { story: `Milo has ${qty(a, it)}. Then ${b} ${world.leave}!`, question: `How many ${it.many} are left?` }
  return { story: `Milo has ${qty(a, it)}. ${world.friend} has ${qty(b, it)}. How many MORE does Milo have?`, question: `How many more ${it.many} does Milo have?` }
}
const boxLabel = (op: Op) => op === 'add' ? 'ALTOGETHER' : op === 'sub' ? 'LEFT' : 'MORE'

// ─── Background (crossfades across the world's bg list) ───────────────────────────────
function Background({ bg, world }: { bg: number; world: SpWorld }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: world.dark ? '#161d3a' : '#f3ead8' }}>
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

function MiloHost({ left, milo }: { left: number; milo: SpWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(28vh, 240px)', height: 'min(28vh, 240px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'st_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 88, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>{milo.emoji}</span>
              <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 38 }}>{milo.accessory}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

// ─── One item sprite (emoji fallback) ────────────────────────────────────────────────
function ItemImg({ item, size }: { item: Item; size: string }) {
  const [missing, setMissing] = useState(false)
  if (item.tint) return <div style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.25))' }}><TintedSprite src={item.img} size={size} hex={item.tint} emoji={item.emoji} /></div>
  if (missing) return <span style={{ fontSize: size, lineHeight: 1, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.2))' }}>{item.emoji}</span>
  return <img src={item.img} alt="" draggable={false} onError={() => setMissing(true)}
    style={{ width: size, height: size, objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.25))' }} />
}

// A grounded item with a contact shadow + jitter. `lit` = counting glow, `leaving` = drifting out.
function GroundedItem({ item, size, i, lit, leaving }: { item: Item; size: string; i: number; lit?: boolean; leaving?: boolean }) {
  const back = i % 2 === 1
  const depth = back ? 0.4 : 0.1
  const jx = [-1.4, 1.1, -0.6, 1.6, -1.1, 0.7][i % 6]
  const shOp = (0.24 - depth * 0.12).toFixed(2)
  const shW = `calc(${size} * 0.62)`
  // OUTER wrapper holds the depth/jitter/lit/leaving transform; INNER child runs st_pop. st_pop
  // has fill:both and its 100% keyframe sets transform:scale(1) — on the SAME element that would
  // clobber the inline transform (and the leaving drift) once the pop finished. Split them.
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: leaving
        ? `translate(${jx}px, -46px) scale(${(1 - depth * 0.13) * 0.6})`
        : `translate(${jx}px, ${back ? -0.5 : 0}vmin) scale(${(1 - depth * 0.13) * (lit ? 1.18 : 1)})`,
      opacity: leaving ? 0.16 : 1, zIndex: back ? 1 : 2, transformOrigin: 'bottom center',
      filter: lit ? 'drop-shadow(0 0 12px var(--sun-yellow))' : 'none',
      transition: 'transform .45s cubic-bezier(.34,1.56,.64,1), filter .2s ease, opacity .45s ease' }}>
      <div style={{ animation: leaving ? 'none' : 'st_pop .3s ease both' }}>
        <ItemImg item={item} size={size} />
      </div>
      <div aria-hidden style={{ width: shW, height: `calc(${shW} * 0.3)`, marginTop: '0.3vmin',
        background: `radial-gradient(ellipse at center, rgba(38,28,18,${shOp}) 0%, rgba(38,28,18,0) 72%)`, pointerEvents: 'none', opacity: leaving ? 0 : 1, transition: 'opacity .3s ease' }} />
    </div>
  )
}

// A row of the same item. `shown` are present; trailing items from `leaveFrom` drift out;
// items from `highlightFrom` (compare surplus) keep a soft ring; `litN` counts with a glow.
function Row({ item, size, shown, litFrom = 0, litN = 0, leaveFrom = Infinity, highlightFrom = Infinity, tag }: {
  item: Item; size: string; shown: number; litFrom?: number; litN?: number; leaveFrom?: number; highlightFrom?: number; tag?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px,1.4vw,16px)' }}>
      {tag}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2vmin', alignItems: 'flex-end', justifyContent: 'flex-start', maxWidth: 'min(72vw, 660px)', minHeight: size }}>
        {Array.from({ length: shown }).map((_, i) => (
          <div key={i} style={{ borderRadius: 16, padding: 2,
            outline: i >= highlightFrom ? '4px dashed var(--sun-yellow-deep)' : 'none', outlineOffset: 2,
            background: i >= highlightFrom ? 'rgba(255,214,102,.22)' : 'transparent', transition: 'background .3s ease' }}>
            <GroundedItem item={item} size={size} i={i} lit={i >= litFrom && i < litN} leaving={i >= leaveFrom} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Operator({ sym, show, dark }: { sym: string; show: boolean; dark?: boolean }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(38px,7.5vmin,70px)', color: dark ? '#fff' : 'var(--milo-orange)',
      WebkitTextStroke: '2px var(--outline)', paintOrder: 'stroke fill', lineHeight: 1, marginBottom: '2.6vh',
      opacity: show ? 1 : 0, transform: show ? 'scale(1)' : 'scale(0.4)', transition: 'opacity .3s ease, transform .3s cubic-bezier(.34,1.56,.64,1)' }}>{sym}</span>
  )
}

function AnswerBox({ label, value, done, show, dark, short, topPct }: { label: string; value: number | null; done: boolean; show: boolean; dark?: boolean; short?: boolean; topPct?: string }) {
  const boxSize = short ? 'clamp(52px,19vh,86px)' : 'clamp(96px,16vmin,140px)'
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: topPct ?? (short ? '64%' : '73%'), transform: 'translateY(-50%)', zIndex: 31, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? '0.2vh' : '0.6vh',
      opacity: show ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: 'none' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(12px,1.9vh,16px)', letterSpacing: '.08em', color: dark ? '#dfe6ff' : 'var(--ink-soft)' }}>{label}</span>
      <div style={{ width: boxSize, height: boxSize, borderRadius: 28, border: '5px solid',
        background: done ? 'var(--garden-green)' : 'var(--paper)', borderColor: done ? 'var(--garden-green-deep)' : 'var(--outline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 0 rgba(61,37,22,.2)', transition: 'all .3s ease',
        animation: done ? 'st_pop .5s ease' : 'none', filter: done ? 'drop-shadow(0 0 16px var(--garden-green))' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(28px,11vh,50px)' : 'clamp(48px,9.5vmin,76px)', color: done ? '#fff' : 'var(--ink-muted)', lineHeight: 1 }}>{value ?? '?'}</span>
      </div>
    </div>
  )
}

// The shared stage — renders the right layout for the op from plain state.
interface StageState { aShown: number; bShown: number; showOp: boolean; leaving: boolean; litA: number; litExtra: number; boxValue: number | null; boxDone: boolean; showBox: boolean }
function Stage({ world, item, op, a, b, s, short }: { world: SpWorld; item: Item; op: Op; a: number; b: number; s: StageState; short?: boolean }) {
  const maxN = op === 'add' ? Math.max(a, b) : a
  const two = op === 'compare'
  const itemSize = short
    ? (maxN <= 3 ? (two ? 'clamp(38px,9vmin,72px)' : 'clamp(46px,13vmin,92px)')
      : maxN <= 6 ? (two ? 'clamp(30px,7vmin,56px)' : 'clamp(38px,10vmin,74px)')
      : (two ? 'clamp(24px,5vmin,44px)' : 'clamp(30px,7.5vmin,58px)'))
    : (maxN <= 3 ? (two ? 'clamp(60px,11vmin,120px)' : 'clamp(92px,17vmin,200px)')
      : maxN <= 6 ? (two ? 'clamp(48px,8.5vmin,92px)' : 'clamp(74px,13vmin,160px)')
      : (two ? 'clamp(38px,6.4vmin,68px)' : 'clamp(58px,10vmin,120px)'))
  const dark = world.dark

  const friendTag = (name: string, emoji: string) => (
    <span style={{ minWidth: 'clamp(48px,9vmin,74px)', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(13px,2.3vmin,18px)',
      color: dark ? '#fff' : 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
      <span style={{ fontSize: 'clamp(22px,4.4vmin,36px)' }}>{emoji}</span>{name}</span>
  )

  const stageTop = short ? (two ? '48%' : '36%') : (two ? '38%' : '40%')
  return (
    <>
      <div style={{ position: 'fixed', left: 0, right: 0, top: stageTop, transform: 'translateY(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? '0.3vh' : '1vh' }}>
        {op === 'add' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(8px,2.2vw,34px)', maxWidth: '94vw' }}>
            <Row item={item} size={itemSize} shown={s.aShown} litN={Math.min(s.litA, a)} />
            <Operator sym="+" show={s.showOp} dark={dark} />
            <Row item={item} size={itemSize} shown={s.bShown} litN={Math.max(0, s.litA - a)} />
          </div>
        )}
        {op === 'sub' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', maxWidth: '94vw' }}>
            <Row item={item} size={itemSize} shown={s.aShown} litN={s.litA} leaveFrom={s.leaving ? a - b : Infinity} />
          </div>
        )}
        {op === 'compare' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: short ? '0.5vh' : '1.4vh' }}>
            <Row item={item} size={itemSize} shown={s.aShown} litFrom={b} litN={b + s.litExtra} highlightFrom={s.showBox ? b : Infinity} tag={friendTag('Milo', world.milo.emoji)} />
            <Row item={item} size={itemSize} shown={s.bShown} tag={friendTag(world.friend, '🧒')} />
          </div>
        )}
        <div style={{ width: 'min(74vw, 700px)', height: short ? '1.2vh' : '2vh', minHeight: short ? 8 : 12, background: dark ? 'linear-gradient(#5a4d7a,#3b3158)' : 'linear-gradient(#caa46a,#a07a44)', borderRadius: 6, boxShadow: '0 5px 9px rgba(0,0,0,.28)' }} />
      </div>
      <AnswerBox label={boxLabel(op)} value={s.boxValue} done={s.boxDone} show={s.showBox} dark={dark} short={short} topPct={two && short ? '70%' : undefined} />
    </>
  )
}

// ─── Interactive play surface (guided / practice) ─────────────────────────────────────
type Mode = 'guided' | 'practice'
const emptyStage: StageState = { aShown: 0, bShown: 0, showOp: false, leaving: false, litA: 0, litExtra: 0, boxValue: null, boxDone: false, showBox: false }

const StoryPlay: React.FC<{ world: SpWorld; data: SpRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { item, op, a, b, answer } = data
  const txt = useMemo(() => storyText(world, op, a, b, item), [world, op, a, b, item])
  const choices = useMemo(() => buildChoices(answer), [op, a, b, answer])
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(56, Math.min(120, Math.round(Math.min(vw / 8.8, vh / 5.2))))
  const [s, setS] = useState<StageState>(emptyStage)
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    const T: number[] = []
    const STEP = 430
    let t = 350
    if (mode === 'guided') speak(txt.story)
    // reveal group A one-by-one
    for (let i = 1; i <= a; i++) { const c = i; T.push(window.setTimeout(() => set({ aShown: c }), t)); t += STEP }
    if (op === 'add') {
      t += 300; T.push(window.setTimeout(() => set({ showOp: true }), t)); t += 380
      for (let i = 1; i <= b; i++) { const c = i; T.push(window.setTimeout(() => set({ bShown: c }), t)); t += STEP }
    } else if (op === 'sub') {
      t += 500; T.push(window.setTimeout(() => set({ leaving: true }), t)); t += 700
    } else { // compare: reveal friend row
      t += 300
      for (let i = 1; i <= b; i++) { const c = i; T.push(window.setTimeout(() => set({ bShown: c }), t)); t += STEP }
    }
    t += 400
    T.push(window.setTimeout(() => { setAsking(true); set({ showBox: true }); speak(txt.question) }, t))
    return () => T.forEach(id => window.clearTimeout(id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === answer) {
      done.current = true
      if (mode === 'guided') speak('Yes! Let’s count.')
      // count the answer objects one-by-one, box climbing 1..answer
      let k = 0
      const tick = () => {
        k++
        if (op === 'compare') set({ litExtra: k, boxValue: k })
        else set({ litA: k, boxValue: k })
        if (k < answer) window.setTimeout(tick, 300)
        else { set({ boxDone: true }); if (mode === 'guided') speak(`${numberToWords(answer)}!`) }
      }
      window.setTimeout(tick, 250)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), answer * 300 + 1500)
    } else {
      erred.current = true
      speak('Not quite — listen to the story again, then try!')
      window.setTimeout(() => setPicked(null), 1100)
    }
  }

  return (
    <>
      <Stage world={world} item={item} op={op} a={a} b={b} s={s} short={short} />
      {/* the story pill up top */}
      <div style={{ position: 'fixed', top: short ? 60 : 84, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 620px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {picked === null ? txt.story : txt.question}
        </div>
      </div>
      {/* choices */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.26) : 'clamp(14px,4vw,32px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {choices.map(n => {
          const isPick = picked === n, isOk = n === answer
          return (
            <button key={n} onClick={() => choose(n)} disabled={picked !== null} style={{
              width: btn, height: btn, borderRadius: Math.round(btn * 0.2),
              background: (isPick && isOk) ? 'var(--garden-green-soft)' : 'var(--paper)',
              border: `4px solid ${(isPick && isOk) ? 'var(--garden-green)' : isPick ? 'var(--ink-muted)' : 'var(--outline)'}`,
              boxShadow: `0 6px 0 ${(isPick && isOk) ? 'var(--garden-green-deep)' : '#c8ac79'}`,
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(btn * 0.42), color: 'var(--ink)',
              cursor: picked !== null ? 'default' : 'pointer', transform: (isPick && isOk) ? 'scale(1.08) translateY(-3px)' : 'scale(1)',
              transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), background 160ms ease',
            }}>{n}</button>
          )
        })}
      </div>
    </>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach): narrate the story via ONE speakSteps ─
const StoryExplain: React.FC<{ world: SpWorld; data: SpRound; onDone: () => void }> = ({ world, data, onDone }) => {
  const { item, op, a, b, answer } = data
  const txt = useMemo(() => storyText(world, op, a, b, item), [world, op, a, b, item])
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(emptyStage)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines: string[] = []
    const steps: Array<() => void> = []
    if (op === 'add') {
      lines.push(`Milo has ${qty(a, item)}.`); steps.push(() => set({ aShown: a }))
      lines.push(`Then Milo ${world.join} ${qty(b, item)} more.`); steps.push(() => set({ bShown: b, showOp: true }))
      lines.push('Let’s count them all!'); steps.push(() => set({ showBox: true, boxValue: 0 }))
      for (let k = 1; k <= answer; k++) { const v = k; lines.push(numberToWords(v)); steps.push(() => set({ litA: v, boxValue: v })) }
      lines.push(`${numberToWords(answer)} ${item.many} altogether!`); steps.push(() => set({ boxDone: true }))
    } else if (op === 'sub') {
      lines.push(`Milo has ${qty(a, item)}.`); steps.push(() => set({ aShown: a }))
      lines.push(`Then ${qty(b, item)} ${world.leave}.`); steps.push(() => set({ leaving: true }))
      lines.push('Let’s count what’s left!'); steps.push(() => set({ showBox: true, boxValue: 0 }))
      for (let k = 1; k <= answer; k++) { const v = k; lines.push(numberToWords(v)); steps.push(() => set({ litA: v, boxValue: v })) }
      lines.push(`${numberToWords(answer)} ${item.many} left!`); steps.push(() => set({ boxDone: true }))
    } else {
      lines.push(`Milo has ${qty(a, item)}.`); steps.push(() => set({ aShown: a }))
      lines.push(`${world.friend} has ${qty(b, item)}.`); steps.push(() => set({ bShown: b }))
      lines.push('Milo has more! How many more?'); steps.push(() => set({ showBox: true, boxValue: 0 }))
      for (let k = 1; k <= answer; k++) { const v = k; lines.push(numberToWords(v)); steps.push(() => set({ litExtra: v, boxValue: v })) }
      lines.push(`Milo has ${numberToWords(answer)} more!`); steps.push(() => set({ boxDone: true }))
    }
    const cancel = speakSteps(lines, {
      onStep: (i) => { steps[i]?.() },
      onDone: () => { window.setTimeout(() => doneRef.current(), 1100) },
      fallbackStepMs: 950,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Stage world={world} item={item} op={op} a={a} b={b} s={s} short={short} />
      {/* On a short/landscape demo the orchestrator already shows a "Watch Milo's story" banner up
          top; the extra story pill would double up and collide with the objects — so hide it there. */}
      {!short && (
        <div style={{ position: 'fixed', top: 84, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
          <div style={{ maxWidth: 'min(88vw, 620px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: '10px 18px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
            {txt.story}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeStoryBeat(world: SpWorld): Beat<SpRound> {
  return {
    skillId: 'storyProblems', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeStoryRound(world, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.op}|${d.a}|${d.b}`,   // dedupe on the MATH (op + operands), not the rotating scene/item
    prompt: d => storyText(world, d.op, d.a, d.b, d.item).question,
    say: d => storyText(world, d.op, d.a, d.b, d.item).story,
    Play: ({ data, onSubmit }) => <StoryPlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <StoryExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const ST_CSS = `
@keyframes st_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes st_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.15);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function StoryTime({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [world, setWorld] = useState<SpWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
  const [phase, setPhase] = useState<Phase>('intro')
  const [bg, setBg] = useState(0)
  const [demoIdx, setDemoIdx] = useState(0)
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])

  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true
    stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => (world ? makeStoryBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall Milo's story happen?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setBg(0); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  // Demo shows one of each kind; guided is a gentle add.
  const DEMO: SpRound[] = [
    { bg: 0, item: world.items[0], op: 'add', a: 3, b: 2, answer: 5 },
    { bg: 1 % world.bgs.length, item: world.items[1] ?? world.items[0], op: 'sub', a: 5, b: 2, answer: 3 },
    { bg: 2 % world.bgs.length, item: world.items[2] ?? world.items[0], op: 'compare', a: 4, b: 2, answer: 2 },
  ]
  const guidedItem = world.items[3 % world.items.length]
  const GUIDED: SpRound = { bg: 0, item: guidedItem, op: 'add', a: 2, b: 2, answer: 4 }
  const bgIdx = phase === 'practice' ? bg : phase === 'guided' ? GUIDED.bg : DEMO[Math.min(demoIdx, DEMO.length - 1)].bg

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{ST_CSS}</style>
      <Background bg={bgIdx} world={world} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '76%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {world.intro}
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Tell me a story! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo's story  (${demoIdx + 1}/${DEMO.length})`)}
        <StoryExplain key={`demo${demoIdx}`} world={world} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the answer')}
        <StoryPlay key="guided" world={world} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
