'use client'
/**
 * Chapter (6–8) — PLACE VALUE (tens & ones, skill `placeValue`) as STORY MODE.
 *
 * The concept is carried by the WORLD'S OWN OBJECTS, not abstract rods: a "ten" is a STACK of
 * 10 of that world's item, a "one" is a loose single item. So 34 in the Candy Factory = 3 stacks
 * of 10 candies + 4 loose candies. Milo asks an in-world place-value question ("how many stacks of
 * ten?", "how many loose ones?", "how many altogether?"); the child taps the answer from three
 * choices. Warm wrong-answers (gentle retry, no red X). The child PICKS one of three worlds; the
 * scene rotates across the 10 adaptive rounds (one continuous SkillBeat — harder on a streak,
 * gentler when struggling, re-teach after 3 wrong):
 *   🧱 Block City    — stacks of building blocks   (street · park · garden)
 *   🧸 Toy Workshop  — boxes of toy ducks           (blocks · ducks · buttons)
 *   🍭 Candy Factory — rolls of candies             (shop · counter · tray)
 *
 * The demo + 3-wrong re-teach BUILD the number by filling stacks of ten then adding loose ones,
 * narrated via speakSteps (voice + visual synced when audio plays, timer-paced when blocked).
 * Difficulty widens the range via pickN: 11–29 → 20–69 → 30–99. Reuses committed sprites only.
 * Wrapped by game/PlaceValueChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords, CSS as KIT_CSS, BigCount } from '../lessons/_kit'
import WorldSelect from './WorldSelect'
import { TintedSprite } from './TintedSprite'
import FitBox from './FitBox'
import { useViewport } from '@/lib/useViewport'

// ─── Scenes & Worlds ───────────────────────────────────────────────────────────────
type Scene =
  | 'orchard' | 'meadow' | 'produce'      // Fruit Orchard
  | 'toyducks' | 'toyblocks' | 'craftbtn' // Toy Workshop
  | 'shop' | 'counter' | 'tray'           // Candy Factory

interface SceneCfg {
  bg: { grad: string; img: string }
}
const SCENE: Record<Scene, SceneCfg> = {
  orchard: { bg: { grad: 'linear-gradient(#dff0c8 0%, #eaf7d6 55%, #cfe9a8 100%)', img: '/assets/backgrounds/farm_orchard.png' } },
  meadow:  { bg: { grad: 'linear-gradient(#dcecd6 0%, #e6eccf 60%, #d0e2b8 100%)', img: '/assets/backgrounds/town_garden.jpeg' } },
  produce: { bg: { grad: 'linear-gradient(#e6f0d6 0%, #eef2dc 60%, #d8e6bc 100%)', img: '/assets/backgrounds/grocery_produce.jpeg' } },
  toyducks: { bg: { grad: 'linear-gradient(#d8ecf2 0%, #e0eae0 60%, #cfe0d2 100%)', img: '/assets/backgrounds/toy_ducks.png' } },
  toyblocks:{ bg: { grad: 'linear-gradient(#f4e6cf 0%, #f0e4d6 60%, #e6d4b4 100%)', img: '/assets/backgrounds/toy_blocks.png' } },
  craftbtn: { bg: { grad: 'linear-gradient(#f0e4dc 0%, #eee0d6 60%, #e4d2c4 100%)', img: '/assets/backgrounds/craft_buttons.png' } },
  shop:    { bg: { grad: 'linear-gradient(#f6dced 0%, #f4e0e6 60%, #eecdd8 100%)', img: '/assets/backgrounds/candy_shop.png' } },
  counter: { bg: { grad: 'linear-gradient(#f2e0ec 0%, #f4e4e2 60%, #ecd2d4 100%)', img: '/assets/backgrounds/candy_counter.png' } },
  tray:    { bg: { grad: 'linear-gradient(#f6e4dc 0%, #f4e6ea 60%, #eed6e0 100%)', img: '/assets/backgrounds/candy_tray.png' } },
}

// Each item is one of the world's OWN objects; the ten is a stack of 10, the one a loose single.
interface Item { src: string; emoji: string; one: string; many: string; tint?: string }
const IT = {
  apple:   { src: '/assets/objects/apple.png',          emoji: '🍎', one: 'apple',    many: 'apples' },
  pear:    { src: '/assets/objects/pear.png',           emoji: '🍐', one: 'pear',     many: 'pears' },
  cherry:  { src: '/assets/objects/cherry.png',         emoji: '🍒', one: 'cherry',   many: 'cherries' },
  // pat_* toys are GREYSCALE by design → tint them to bright toy colours (see TintedSprite).
  duck:    { src: '/assets/objects/pat_duck.png',       emoji: '🦆', one: 'duck',     many: 'ducks',   tint: '#f2c230' },
  car:     { src: '/assets/objects/pat_car.png',        emoji: '🚗', one: 'car',      many: 'cars',    tint: '#e0483f' },
  block:   { src: '/assets/objects/pat_block.png',      emoji: '🧱', one: 'block',    many: 'blocks',  tint: '#4a86d8' },
  button:  { src: '/assets/objects/pat_button.png',     emoji: '🔘', one: 'button',   many: 'buttons', tint: '#4aae6b' },
  candy:   { src: '/assets/objects/candy_candy.png',    emoji: '🍬', one: 'candy',    many: 'candies' },
  cupcake: { src: '/assets/objects/candy_cupcake.png',  emoji: '🧁', one: 'cupcake',  many: 'cupcakes' },
  lolly:   { src: '/assets/objects/candy_lollipop.png', emoji: '🍭', one: 'lollipop', many: 'lollipops' },
} satisfies Record<string, Item>

interface PvWorld {
  id: string; label: string; emoji: string
  scenes: Scene[]
  items: Item[]                       // the world's objects — shuffled across rounds so it's not one repeated thing
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
const WORLDS: PvWorld[] = [
  { id: 'orchard', label: 'Fruit Orchard', emoji: '🍎', scenes: ['orchard', 'meadow', 'produce'],
    items: [IT.apple, IT.pear, IT.cherry],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🧺' },
    intro: 'Welcome to the orchard! Fruit is packed in STACKS of ten, plus a few loose ones. Count the stacks and the loose fruit, then tap the right answer. First, watch Milo count!' },
  { id: 'toy', label: 'Toy Workshop', emoji: '🧸', scenes: ['toyducks', 'toyblocks', 'craftbtn'],
    items: [IT.duck, IT.car, IT.block, IT.button],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🔧' },
    intro: 'In the Toy Workshop, toys are packed in STACKS of ten, plus a few loose ones. Count the stacks and the loose toys, then tap the right answer. First, watch Milo count!' },
  { id: 'candy', label: 'Candy Factory', emoji: '🍭', scenes: ['shop', 'counter', 'tray'],
    items: [IT.candy, IT.cupcake, IT.lolly],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🍬' },
    intro: 'At the Candy Factory, sweets come in STACKS of ten and loose ones! Count the stacks and the loose sweets, then tap the right answer. First, watch Milo count!' },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: SCENE[w.scenes[0]].bg.img, itemImage: w.items[0].src, itemTint: w.items[0].tint }))

// Live viewport size — so a short/landscape frame can shrink the tens/ones card + answer
// buttons and reposition them so the banner, card and buttons never overlap.

type QType = 'tens' | 'ones' | 'whole'
interface PvRound { scene: Scene; item: Item; n: number; qType: QType; question: string; say: string; answer: number; choices: number[]; showNumeral: boolean }

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
function shuffle<T>(a: T[]): T[] {
  const arr = a.slice()
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr
}
// Range widens with difficulty: 1 → 11–29, 2 → 20–69, 3 → 30–99.
function pickN(d: 1 | 2 | 3): number {
  return d === 1 ? rint(11, 29) : d === 2 ? rint(20, 69) : rint(30, 99)
}
function nearDigits(answer: number): number[] {
  const opts = new Set<number>([answer]); let delta = 1
  while (opts.size < 3) {
    if (answer - delta >= 0) opts.add(answer - delta)
    if (opts.size < 3 && answer + delta <= 9) opts.add(answer + delta)
    delta++
  }
  return shuffle([...opts])
}
function nearNumbers(n: number): number[] {
  const opts = new Set<number>([n]); const t = Math.floor(n / 10), o = n % 10
  const cands = [o * 10 + t, n + 1, n - 1, n + 10, n - 10]
  for (const c of shuffle(cands)) { if (opts.size >= 3) break; if (c >= 1 && c <= 99 && c !== n) opts.add(c) }
  while (opts.size < 3) { const r = rint(10, 99); if (r !== n) opts.add(r) }
  return shuffle([...opts])
}
function makeRound(world: PvWorld, d: 1 | 2 | 3, round: number): PvRound {
  const scene = world.scenes[round % world.scenes.length]
  const item = world.items[round % world.items.length]     // shuffle the world's objects across rounds
  const n = pickN(d)
  const pool: QType[] = d === 1 ? ['tens', 'ones', 'whole']
    : d === 2 ? ['tens', 'ones', 'whole', 'whole']
    : ['tens', 'ones', 'whole', 'whole', 'whole']
  const qType = pool[rint(0, pool.length - 1)]
  if (qType === 'tens')
    return { scene, item, n, qType, question: 'How many stacks of ten?', say: `How many stacks of ten ${item.many}? Count the tall stacks.`, answer: Math.floor(n / 10), choices: nearDigits(Math.floor(n / 10)), showNumeral: true }
  if (qType === 'ones')
    return { scene, item, n, qType, question: `How many loose ${item.many}?`, say: `How many loose ${item.many} are there? Count the single ones.`, answer: n % 10, choices: nearDigits(n % 10), showNumeral: true }
  return { scene, item, n, qType, question: `How many ${item.many} altogether?`, say: `How many ${item.many} altogether? Count the stacks of ten, then the loose ones.`, answer: n, choices: nearNumbers(n), showNumeral: false }
}

// ─── Background (crossfades between the world's scenes) ──────────────────────────────
function Background({ scene, scenes }: { scene: Scene; scenes: Scene[] }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#f3ead8' }}>
      {scenes.map(s => (
        <div key={s} style={{ position: 'absolute', inset: 0, opacity: s === scene ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: SCENE[s].bg.grad }} />
          <img src={SCENE[s].bg.img} alt="" draggable={false}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

function MiloHost({ left, milo }: { left: number; milo: PvWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'bb_float 3.4s ease-in-out infinite' }}>
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

// ─── One of the world's items (sprite, with emoji fallback) ─────────────────────────
function ItemImg({ item, size }: { item: Item; size: string }) {
  const [missing, setMissing] = useState(false)
  if (item.tint) return <TintedSprite src={item.src} size={size} hex={item.tint} emoji={item.emoji} />
  if (missing) return <span style={{ fontSize: size, lineHeight: 1 }}>{item.emoji}</span>
  return <img src={item.src} alt="" draggable={false} onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
}

// A "ten" = a 2×5 TEN-FRAME of the world's items with a "10" tag under it (compact, clearly ten).
// `px` is the per-item size (adaptive: bigger when there are few tens).
function Stack({ item, bright, px }: { item: Item; bright: boolean; px: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      opacity: bright ? 1 : 0.15, transform: bright ? 'scale(1)' : 'scale(.82)', transition: 'all .3s cubic-bezier(.34,1.56,.64,1)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 'clamp(2px,0.5vmin,4px)', padding: 'clamp(4px,1vmin,7px)',
        border: '3px solid var(--sky-blue-deep)', borderRadius: 12, background: 'rgba(255,255,255,.5)' }}>
        {Array.from({ length: 10 }).map((_, i) => <ItemImg key={i} item={item} size={px} />)}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(13px,2.4vmin,18px)', color: 'var(--sky-blue-deep)', lineHeight: 1 }}>10</div>
    </div>
  )
}

// The number drawn as `revealTens` ten-frames + `revealOnes` loose items (of n). Item size
// ADAPTS to how many there are, so small numbers look big and clear while big numbers still fit.
// `compact` (short/landscape) drops the MIN-floors so the whole card shrinks and stops colliding
// with the banner + answer buttons.
function ObjectTens({ item, n, revealTens, revealOnes, compact }: { item: Item; n: number; revealTens: number; revealOnes: number; compact?: boolean }) {
  const t = Math.floor(n / 10), o = n % 10
  const stackPx = compact
    ? (t <= 3 ? 'clamp(14px,3.2vmin,26px)' : t <= 5 ? 'clamp(12px,2.6vmin,22px)' : t <= 7 ? 'clamp(10px,2.1vmin,17px)' : 'clamp(8px,1.8vmin,14px)')
    : (t <= 3 ? 'clamp(30px,6vmin,48px)' : t <= 5 ? 'clamp(24px,4.7vmin,37px)' : t <= 7 ? 'clamp(18px,3.5vmin,28px)' : 'clamp(14px,2.8vmin,22px)')
  const onePx = compact
    ? (o <= 4 ? 'clamp(26px,5.4vmin,44px)' : o <= 6 ? 'clamp(22px,4.4vmin,36px)' : 'clamp(18px,3.6vmin,28px)')
    : (o <= 4 ? 'clamp(50px,10vmin,78px)' : o <= 6 ? 'clamp(42px,8vmin,62px)' : 'clamp(34px,6.2vmin,50px)')
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,2.2vw,24px)', flexWrap: 'wrap' }}>
      {t > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px,1.2vw,11px)' }}>
          {Array.from({ length: t }).map((_, i) => <Stack key={i} item={item} bright={i < revealTens} px={stackPx} />)}
        </div>
      )}
      {t > 0 && o > 0 && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(26px,5vmin,40px)', color: 'var(--milo-orange)' }}>+</div>}
      {o > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(5px,1.2vw,10px)', maxWidth: 'clamp(120px,24vw,210px)', alignContent: 'center', justifyContent: 'center' }}>
          {Array.from({ length: o }).map((_, j) => (
            <div key={j} style={{ opacity: j < revealOnes ? 1 : 0.15, transform: j < revealOnes ? 'scale(1)' : 'scale(.55)', transition: 'all .3s cubic-bezier(.34,1.56,.64,1)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.2))' }}>
              <ItemImg item={item} size={onePx} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// The objects on a slate, with an optional big numeral above.
function BlocksCard({ item, n, showNumeral, compact }: { item: Item; n: number; showNumeral: boolean; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 4 : 8,
      background: 'rgba(255,255,255,.8)', border: '4px solid var(--outline)', borderRadius: 24,
      padding: compact ? '8px 14px 10px' : '14px 20px 16px', boxShadow: '0 6px 0 rgba(61,37,22,.12)' }}>
      {showNumeral && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: compact ? 'clamp(24px,4.6vmin,38px)' : 'clamp(32px,6vmin,50px)', lineHeight: 1, color: 'var(--milo-orange)', textShadow: '0 4px 0 rgba(61,37,22,.12)' }}>{n}</div>
      )}
      <ObjectTens item={item} n={n} revealTens={Math.floor(n / 10)} revealOnes={n % 10} compact={compact} />
    </div>
  )
}

// ─── Interactive play surface (guided / practice) ───────────────────────────────────
type Mode = 'guided' | 'practice'
const BlocksPlay: React.FC<{ world: PvWorld; data: PvRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { item, n, question, say, answer, choices, showNumeral } = data
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  // Responsive answer buttons — shrink on a narrow OR short screen so 3 fit and leave room for
  // the card above. On tall frames keep the original size.
  const btn = short ? Math.max(56, Math.min(96, Math.round(Math.min(vw / 8.8, vh / 5.2)))) : null
  const btnStyle: React.CSSProperties = btn != null
    ? { width: btn, height: btn, borderRadius: Math.round(btn * 0.24), fontSize: Math.round(btn * 0.44) }
    : { width: 'clamp(76px,15vmin,104px)', height: 'clamp(76px,15vmin,104px)', borderRadius: 24, fontSize: 'clamp(30px,6vmin,44px)' }
  // The card lives in its own band (between the banner and the bottom answer buttons) and is scaled
  // by FitBox to fill it — so it's big & clear on any viewport, not capped by the clamp() max.
  const btnH = btn ?? 104
  const topReserve = short ? 84 : 116
  const botReserve = short ? btnH + 24 : btnH + 56
  const availW = vw * 0.92
  const availH = Math.max(120, vh - topReserve - botReserve)
  const choiceGap = short ? 'clamp(8px,2.5vw,18px)' : 'clamp(12px,3vw,28px)'

  useEffect(() => {
    if (mode === 'guided') speak(say)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(c: number) {
    if (done.current || picked !== null) return
    if (c === answer) {
      setPicked(c); done.current = true
      if (mode === 'guided') speak(`Yes! ${numberToWords(answer)}!`)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1200)
    } else {
      erred.current = true; setWrongPick(c)
      speak(`Not quite. Let's look again — ${question.toLowerCase()}`)
      window.setTimeout(() => setWrongPick(null), 1100)
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', left: 0, right: 0, top: topReserve, height: availH, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3vw', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <FitBox availW={availW} availH={availH} max={2.6}>
            <BlocksCard item={item} n={n} showNumeral={showNumeral} compact={short} />
          </FitBox>
        </div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btnH * 0.16)) : '3.5%', zIndex: 33, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: choiceGap, flexWrap: 'wrap', maxWidth: '96vw', margin: '0 auto', padding: '0 12px' }}>
        {choices.map(c => {
          const isSel = picked === c
          const isWrong = wrongPick === c
          const ring = isSel ? 'var(--garden-green)' : isWrong ? 'var(--milo-orange)' : 'var(--outline)'
          const glow = isSel ? '0 6px 0 var(--garden-green-deep)' : '0 6px 0 #c8ac79'
          // bb_pop enter (fill:both) is on the OUTER button; the state scale/lift is on the INNER
          // span so the animation's final keyframe transform can't clobber the selected lift.
          return (
            <button key={c} onClick={() => choose(c)} disabled={picked !== null}
              style={{
                ...btnStyle,
                background: isSel ? 'var(--garden-green-soft)' : 'var(--paper)',
                border: `4px solid ${ring}`, boxShadow: glow,
                fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--ink)',
                padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: picked !== null ? 'default' : 'pointer',
                opacity: picked !== null && !isSel ? 0.5 : 1,
                animation: 'bb_pop .35s ease both',
              }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%',
                transform: isSel ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
                transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1)' }}>{c}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach): build the number with the world's items ─
// speakSteps drives BOTH the voice AND each reveal — a stack of ten fills in as Milo counts
// "ten, twenty…", then loose ones "twenty-one…"; synced to the voice, timer-paced when blocked.
const BlocksExplain: React.FC<{ world: PvWorld; data: PvRound; onDone: () => void }> = ({ data, onDone }) => {
  const { n, item: it } = data
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const availW = vw * 0.92
  const availH = Math.max(120, vh - (short ? 140 : 220))
  const t = Math.floor(n / 10), o = n % 10
  const [rt, setRt] = useState(0)
  const [ro, setRo] = useState(0)
  const [big, setBig] = useState<number | null>(null)
  const [showNum, setShowNum] = useState(false)
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines: string[] = []
    const steps: Array<() => void> = []
    lines.push(`Watch me count the ${it.many}!`); steps.push(() => {})
    for (let k = 1; k <= t; k++) { const v = k; lines.push(numberToWords(v * 10)); steps.push(() => { setRt(v); setBig(v * 10) }) }
    for (let j = 1; j <= o; j++) { const v = j; lines.push(numberToWords(t * 10 + v)); steps.push(() => { setRo(v); setBig(t * 10 + v) }) }
    const tPart = t > 0 ? `${numberToWords(t)} ${t === 1 ? 'stack' : 'stacks'} of ten` : ''
    const oPart = o > 0 ? `${numberToWords(o)} loose` : ''
    lines.push(`${[tPart, oPart].filter(Boolean).join(' and ')} make ${numberToWords(n)} ${it.many}!`)
    steps.push(() => { setShowNum(true); setBig(n) })
    const cancel = speakSteps(lines, {
      onStep: (i) => { steps[i]?.() },
      onDone: () => { window.setTimeout(() => doneRef.current(), 1000) },
      fallbackStepMs: 1050,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2vh 4vw' }}>
      <FitBox availW={availW} availH={availH} max={2.2}>
        <div style={{ background: 'var(--paper)', border: '4px solid var(--outline)', borderRadius: 24, padding: '18px 16px 22px', width: 460, boxShadow: '0 8px 0 rgba(61,37,22,.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <style>{KIT_CSS}</style>
          <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>{big != null && <BigCount key={big} n={big} />}</div>
          <ObjectTens item={it} n={n} revealTens={rt} revealOnes={ro} />
          <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
            {showNum && (
              <div style={{ background: 'var(--milo-orange)', color: '#fff', borderRadius: 50, padding: '7px 20px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 17, animation: 'k_flipIn 0.5s ease' }}>
                {t > 0 ? `${t} ${t === 1 ? 'stack' : 'stacks'}` : ''}{t > 0 && o > 0 ? ' + ' : ''}{o > 0 ? `${o} loose` : ''} = {n}
              </div>
            )}
          </div>
        </div>
      </FitBox>
    </div>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeBeat(world: PvWorld): Beat<PvRound> {
  return {
    skillId: 'placeValue', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeRound(world, (d || 1) as 1 | 2 | 3, round),
    prompt: d => d.question,
    say: d => d.say,
    Play: ({ data, onSubmit }) => <BlocksPlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <BlocksExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const BB_CSS = `
@keyframes bb_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes bb_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function BuildingBlocks({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const { h: vh } = useViewport()
  const short = vh < 470
  const [world, setWorld] = useState<PvWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
  const [phase, setPhase] = useState<Phase>('intro')
  const [scene, setScene] = useState<Scene>('orchard')
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
  const beat = useMemo(() => (world ? makeBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall we count tens and ones?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setScene(w.scenes[0]); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  const DEMO_ROUNDS: PvRound[] = [
    { scene: world.scenes[0], item: world.items[0], n: 23, qType: 'whole', question: '', say: '', answer: 23, choices: [], showNumeral: false },
    { scene: world.scenes[1] ?? world.scenes[0], item: world.items[1] ?? world.items[0], n: 34, qType: 'whole', question: '', say: '', answer: 34, choices: [], showNumeral: false },
  ]
  const guidedItem = world.items[2 % world.items.length]
  const guided: PvRound = { scene: world.scenes[2] ?? world.scenes[0], item: guidedItem, n: 26, qType: 'tens', question: 'How many stacks of ten?', say: `How many stacks of ten ${guidedItem.many}? Count the tall stacks.`, answer: 2, choices: nearDigits(2), showNumeral: true }
  const bgScene: Scene = phase === 'practice' ? scene : phase === 'guided' ? guided.scene : phase === 'demo' ? DEMO_ROUNDS[demoIdx].scene : world.scenes[0]

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: short ? 44 : 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{BB_CSS}</style>
      <Background scene={bgScene} scenes={world.scenes} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '76%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {world.intro}
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let's go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo count the ${DEMO_ROUNDS[demoIdx].item.many}  (${demoIdx + 1}/${DEMO_ROUNDS.length})`)}
        <BlocksExplain key={`demo${demoIdx}`} world={world} data={DEMO_ROUNDS[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO_ROUNDS.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Count the stacks of ten')}
        <BlocksPlay key="guided" world={world} data={guided} mode="guided" onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (data?.scene) setScene(data.scene as Scene) }}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
      )}

      <MiloHost left={10} milo={world.milo} />
    </div>
  )
}
