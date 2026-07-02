'use client'
/**
 * Chapter (6–8) — MONEY (skill `money`) as STORY MODE.
 *
 * Money is COUNTING COIN VALUE, carried by real coin sprites (the hero objects). Milo shops:
 * each round he buys the world's item, and the child counts the handful of coins to find what it
 * costs. Coins are generic (no country): 1 = copper, 5 = silver, 10 = gold, 25 = big gold — the
 * value NUMERAL is code-drawn on the coin so it is always exact. The child PICKS one of three
 * worlds; the world's goods SHUFFLE and the scene rotates across the 10 adaptive rounds (one
 * continuous SkillBeat — harder on a streak, gentler when struggling, re-teach after 3 wrong):
 *   🛒 Grocery Market — apple · pear · strawberry
 *   🚂 Train Station   — bun · cookie · lollipop
 *   🏖️ Beach Kiosk     — watermelon · orange · bucket
 *
 * Coin values stay countable (object-driven per the locked 6–8 rules): L1 1s&5s (2–3 coins) →
 * L2 +10s (3–4) → L3 +25s (4–5). The demo + 3-wrong re-teach COUNT UP the coins via ONE
 * speakSteps — each coin appears as the running total climbs "ten… fifteen… sixteen", then "the
 * apple costs sixteen!" (voice + visual synced when audio plays, timer-paced when blocked).
 * Reuses committed sprites only; coins are NEW AI art. Wrapped by game/MoneyChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import WorldSelect from './WorldSelect'
import FitBox from './FitBox'
import { useViewport } from '@/lib/useViewport'

// Live viewport size — so the coins, price box and answer buttons never overlap on short frames.

// ─── Coins ───────────────────────────────────────────────────────────────────────────
// value → sprite + relative size (bigger coin = worth more, like real life).
const COIN: Record<number, { src: string; rel: number }> = {
  1:  { src: '/assets/objects/coin_copper.png', rel: 0.74 },
  5:  { src: '/assets/objects/coin_silver.png', rel: 0.86 },
  10: { src: '/assets/objects/coin_gold.png',   rel: 0.97 },
  25: { src: '/assets/objects/coin_gold.png',   rel: 1.12 },
}
const COIN_FALLBACK: Record<number, string> = { 1: '#c67a44', 5: '#c9cdd4', 10: '#e8b64a', 25: '#e8b64a' }

function Coin({ value, px, glow }: { value: number; px: number; glow?: boolean }) {
  const m = COIN[value] ?? COIN[1]
  const size = Math.round(px * m.rel)
  const [missing, setMissing] = useState(false)
  return (
    <div style={{
      position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: glow ? 'drop-shadow(0 0 12px var(--sun-yellow))' : 'drop-shadow(0 3px 5px rgba(0,0,0,.3))', transition: 'filter .3s ease',
    }}>
      {missing
        ? <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: COIN_FALLBACK[value], border: '3px solid rgba(0,0,0,.35)' }} />
        : <img src={m.src} alt="" draggable={false} decoding="async" loading="lazy" onError={() => setMissing(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
      <span style={{
        position: 'absolute', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(size * 0.42),
        color: '#3d2516', textShadow: '0 1px 0 rgba(255,255,255,.65), 0 -1px 0 rgba(255,255,255,.4)', lineHeight: 1, pointerEvents: 'none',
      }}>{value}</span>
    </div>
  )
}

// base coin pixel size — shrinks as the handful grows / on short frames.
function coinPxFor(n: number, short?: boolean): number {
  if (short) return n <= 3 ? 56 : n <= 4 ? 48 : 40
  return n <= 3 ? 104 : n <= 4 ? 88 : 74
}

// ─── Items & Worlds ──────────────────────────────────────────────────────────────────
interface Item { img: string; emoji: string; one: string; many: string }
const IT = (img: string, emoji: string, one: string, many: string): Item => ({ img: `/assets/objects/${img}.png`, emoji, one, many })
interface Bg { grad: string; img: string }
interface MoneyWorld {
  id: string; label: string; emoji: string
  bgs: Bg[]
  items: Item[]
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
const WORLDS: MoneyWorld[] = [
  { id: 'grocery', label: 'Grocery Market', emoji: '🛒',
    bgs: [
      { grad: 'linear-gradient(#eaf3dc 0%, #f0eccf 60%, #e6d8b4 100%)', img: '/assets/backgrounds/grocery_produce.jpeg' },
      { grad: 'linear-gradient(#eef3df 0%, #f2ecd2 60%, #e8dab6 100%)', img: '/assets/backgrounds/grocery_flowers.jpeg' },
      { grad: 'linear-gradient(#f2ecd6 0%, #f0e6cc 60%, #e6d4ac 100%)', img: '/assets/backgrounds/kitchen_fruit.jpeg' },
    ],
    items: [IT('apple', '🍎', 'apple', 'apples'), IT('pear', '🍐', 'pear', 'pears'), IT('kitchen_strawberry', '🍓', 'strawberry', 'strawberries')],
    milo: { src: '/assets/characters/milo_grocer.png', emoji: '🦊', accessory: '🛒' },
    intro: 'Welcome to the Grocery Market! Milo buys fruit with coins. Count the coins to see what it costs, then tap how much. First, watch Milo count!' },
  { id: 'train', label: 'Train Station', emoji: '🚂',
    bgs: [
      { grad: 'linear-gradient(#dfe7f2 0%, #e6e2ea 60%, #d4d0c4 100%)', img: '/assets/backgrounds/train_station.png' },
      { grad: 'linear-gradient(#e2ecf4 0%, #e8e6dc 60%, #d6ccb4 100%)', img: '/assets/backgrounds/train_bg.jpeg' },
      { grad: 'linear-gradient(#e4e8ee 0%, #eae4d6 60%, #d8ccb0 100%)', img: '/assets/backgrounds/order_depot.png' },
    ],
    items: [IT('grocery_bun', '🥐', 'bun', 'buns'), IT('cookie', '🍪', 'cookie', 'cookies'), IT('candy_lollipop', '🍭', 'lollipop', 'lollipops')],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🚂' },
    intro: 'All aboard the Train Station! Milo buys a snack for the ride. Count the coins to see what it costs, then tap how much. First, watch Milo count!' },
  { id: 'beach', label: 'Beach Kiosk', emoji: '🏖️',
    bgs: [
      { grad: 'linear-gradient(#cfeaf6 0%, #ece6cf 55%, #f0dcae 100%)', img: '/assets/backgrounds/beach_sand.png' },
      { grad: 'linear-gradient(#c8e6f6 0%, #dcecec 55%, #ecdcb0 100%)', img: '/assets/backgrounds/beach_sea.png' },
      { grad: 'linear-gradient(#d2ecf6 0%, #ece8d2 55%, #f0deb2 100%)', img: '/assets/backgrounds/beach_picnic.png' },
    ],
    items: [IT('watermelon', '🍉', 'watermelon', 'watermelons'), IT('kitchen_orange', '🍊', 'orange', 'oranges'), IT('bucket', '🪣', 'bucket', 'buckets')],
    milo: { src: '/assets/characters/milo_boat.png', emoji: '🦊', accessory: '🏖️' },
    intro: 'Down at the Beach Kiosk! Milo buys a seaside treat. Count the coins to see what it costs, then tap how much. First, watch Milo count!' },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.bgs[0].img, itemImage: w.items[0].img }))

interface MoneyRound { bg: number; item: Item; coins: number[]; answer: number }

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
const flip = () => Math.random() < 0.5
function shuffle<T>(a: T[]): T[] {
  const arr = a.slice()
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr
}
function coinChoices(answer: number, coins: number[]): number[] {
  const set = new Set<number>([answer])
  const big = coins[0] || 1, small = coins[coins.length - 1] || 1
  const cands = [answer + small, answer - small, answer + big, answer - big, answer + 1, answer - 1, answer + 5, answer - 5, answer + 2, answer - 2]
  for (const c of shuffle(cands)) { if (set.size >= 3) break; if (c > 0 && c !== answer) set.add(c) }
  while (set.size < 3) { const r = answer + rint(1, 5) * (flip() ? 1 : -1); if (r > 0 && r !== answer) set.add(r) }
  return shuffle([...set])
}
// Coin values stay countable; difficulty widens the pool + the handful size.
function makeMoneyRound(world: MoneyWorld, d: 1 | 2 | 3, round: number): MoneyRound {
  const idx = round % world.items.length
  const item = world.items[idx]
  const bg = round % world.bgs.length
  const pool = d === 1 ? [1, 5] : d === 2 ? [1, 5, 10] : [1, 5, 10, 25]
  const n = d === 1 ? rint(2, 3) : d === 2 ? rint(3, 4) : rint(4, 5)
  const coins = Array.from({ length: n }, () => pick(pool)).sort((a, b) => b - a)   // biggest first (count on)
  const answer = coins.reduce((s, v) => s + v, 0)
  return { bg, item, coins, answer }
}

// ─── Background (crossfades across the world's bg list) ───────────────────────────────
function Background({ bg, world }: { bg: number; world: MoneyWorld }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#f3ead8' }}>
      {world.bgs.map((b, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === bg ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: b.grad }} />
          <img src={b.img} alt="" draggable={false} decoding="async"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

function MiloHost({ left, milo }: { left: number; milo: MoneyWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'cs_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 80, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>{milo.emoji}</span>
              <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 34 }}>{milo.accessory}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

function ItemImg({ item, size }: { item: Item; size: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span style={{ fontSize: size, lineHeight: 1 }}>{item.emoji}</span>
  return <img src={item.img} alt="" draggable={false} decoding="async" loading="lazy" onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
}

// The coins on the counter; `shown` reveals them one-by-one, `glowN` glows as they are counted.
function CoinRow({ coins, coinPx, shown, glowN }: { coins: number[]; coinPx: number; shown: number; glowN: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px,1.8vw,20px)', justifyContent: 'center', alignItems: 'center', maxWidth: '94vw' }}>
      {coins.map((v, i) => (
        <div key={i} style={{
          animation: 'cs_pop .3s ease both',
          opacity: i < shown ? 1 : 0.14, transform: `scale(${i < shown ? 1 : 0.8})`, transition: 'opacity .3s ease, transform .3s cubic-bezier(.34,1.56,.64,1)',
        }}>
          <Coin value={v} px={coinPx} glow={i < glowN} />
        </div>
      ))}
    </div>
  )
}

// The item being bought + its price tag (the box climbs during the count-up, greens when paid).
function PriceBox({ item, value, done, show, short }: { item: Item; value: number | null; done: boolean; show: boolean; short?: boolean }) {
  const boxSize = short ? 'clamp(48px,17vh,84px)' : 'clamp(80px,13vmin,120px)'
  const itemSize = short ? 'clamp(40px,15vh,76px)' : 'clamp(66px,11vmin,104px)'
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '66%' : '77%', transform: 'translateY(-50%)', zIndex: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: short ? 'clamp(8px,2.6vw,18px)' : 'clamp(12px,3vw,26px)',
      opacity: show ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', filter: done ? 'drop-shadow(0 0 16px var(--sun-yellow))' : 'drop-shadow(0 3px 5px rgba(0,0,0,.28))', transform: done ? 'scale(1.08)' : 'scale(1)', transition: 'all .3s cubic-bezier(.34,1.56,.64,1)' }}>
        <ItemImg item={item} size={itemSize} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(20px,6vh,38px)' : 'clamp(26px,5.5vmin,46px)', color: 'var(--ink)', WebkitTextStroke: '1.5px var(--outline)', paintOrder: 'stroke fill' }}>=</span>
      <div style={{ minWidth: boxSize, height: boxSize, padding: '0 clamp(6px,1.6vmin,14px)', borderRadius: 22, border: '5px solid',
        background: done ? 'var(--garden-green)' : 'var(--paper)', borderColor: done ? 'var(--garden-green-deep)' : 'var(--outline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 0 rgba(61,37,22,.2)', transition: 'all .3s ease',
        animation: done ? 'cs_pop .5s ease' : 'none', filter: done ? 'drop-shadow(0 0 16px var(--garden-green))' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(24px,9vh,44px)' : 'clamp(40px,8vmin,62px)', color: done ? '#fff' : 'var(--ink-muted)', lineHeight: 1 }}>{value ?? '?'}</span>
      </div>
    </div>
  )
}

interface StageState { shown: number; glowN: number; boxValue: number | null; boxDone: boolean; showBox: boolean }
const empty: StageState = { shown: 0, glowN: 0, boxValue: null, boxDone: false, showBox: false }
function Stage({ data, s, short }: { data: MoneyRound; s: StageState; short?: boolean }) {
  const coinPx = coinPxFor(data.coins.length, short)
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.28 : vh * 0.42
  return (
    <>
      <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '38%' : '42%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
        <FitBox availW={availW} availH={availH} max={2.6}>
          <CoinRow coins={data.coins} coinPx={coinPx} shown={s.shown} glowN={s.glowN} />
        </FitBox>
      </div>
      <PriceBox item={data.item} value={s.boxValue} done={s.boxDone} show={s.showBox} short={short} />
    </>
  )
}

// ─── Interactive play surface (guided / practice) ─────────────────────────────────────
type Mode = 'guided' | 'practice'
const sayFor = (d: MoneyRound) => `Milo buys ${d.item.one === 'orange' || d.item.one === 'apple' ? 'an' : 'a'} ${d.item.one}. Count the coins — how much does it cost?`
const promptFor = (d: MoneyRound) => `How much does the ${d.item.one} cost?`

const CoinPlay: React.FC<{ world: MoneyWorld; data: MoneyRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { coins, answer } = data
  const choices = useMemo(() => coinChoices(answer, coins), [answer, coins])
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(56, Math.min(116, Math.round(Math.min(vw / 8.8, vh / 5.2))))
  const [s, setS] = useState<StageState>(empty)
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    const T: number[] = []
    let t = 300
    if (mode === 'guided') speak(sayFor(data))
    for (let i = 1; i <= coins.length; i++) { const c = i; T.push(window.setTimeout(() => set({ shown: c }), t)); t += 340 }
    t += 350
    T.push(window.setTimeout(() => { setAsking(true); set({ showBox: true }); speak('How much money?') }, t))
    return () => T.forEach(id => window.clearTimeout(id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === answer) {
      done.current = true
      if (mode === 'guided') speak('Yes! Let’s count the coins.')
      let k = 0, run = 0
      const tick = () => {
        run += coins[k]; k++
        set({ glowN: k, boxValue: run })
        if (k < coins.length) window.setTimeout(tick, 460)
        else { set({ boxDone: true }); if (mode === 'guided') speak(`${numberToWords(answer)}! The ${data.item.one} costs ${numberToWords(answer)}.`) }
      }
      window.setTimeout(tick, 250)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), coins.length * 460 + 1500)
    } else {
      erred.current = true
      speak('Not quite — count the coins, biggest first. Try again!')
      window.setTimeout(() => setPicked(null), 1100)
    }
  }

  return (
    <>
      <Stage data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 58 : 82, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 600px)', background: 'rgba(255,255,255,.92)', border: '3px solid var(--outline)', borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {promptFor(data)}
        </div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3.5vw,30px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {choices.map(n => {
          const isPick = picked === n, isOk = n === answer
          return (
            <button key={n} onClick={() => choose(n)} disabled={picked !== null} style={{
              minWidth: btn, height: btn, padding: '0 8px', borderRadius: Math.round(btn * 0.2),
              background: (isPick && isOk) ? 'var(--garden-green-soft)' : 'var(--paper)',
              border: `4px solid ${(isPick && isOk) ? 'var(--garden-green)' : isPick ? 'var(--ink-muted)' : 'var(--outline)'}`,
              boxShadow: `0 6px 0 ${(isPick && isOk) ? 'var(--garden-green-deep)' : '#c8ac79'}`,
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(btn * 0.4), color: 'var(--ink)',
              cursor: picked !== null ? 'default' : 'pointer', transform: (isPick && isOk) ? 'scale(1.08) translateY(-3px)' : 'scale(1)',
              transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), background 160ms ease',
            }}>{n}</button>
          )
        })}
      </div>
    </>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach): count up the coins via ONE speakSteps ─
const CoinExplain: React.FC<{ world: MoneyWorld; data: MoneyRound; onDone: () => void }> = ({ world, data, onDone }) => {
  const { coins, answer, item } = data
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(empty)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines: string[] = []
    const steps: Array<() => void> = []
    lines.push(`Milo buys ${item.one === 'orange' || item.one === 'apple' ? 'an' : 'a'} ${item.one}. Let’s count the coins!`)
    steps.push(() => set({ shown: 0, glowN: 0, showBox: true, boxValue: 0 }))
    let run = 0
    for (let k = 1; k <= coins.length; k++) { run += coins[k - 1]; const v = run, kk = k; lines.push(numberToWords(v)); steps.push(() => set({ shown: kk, glowN: kk, boxValue: v })) }
    lines.push(`${numberToWords(answer)}! The ${item.one} costs ${numberToWords(answer)}.`)
    steps.push(() => set({ boxDone: true, glowN: coins.length }))
    const cancel = speakSteps(lines, {
      onStep: (i) => { steps[i]?.() },
      onDone: () => { window.setTimeout(() => doneRef.current(), 1100) },
      fallbackStepMs: 1000,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Stage data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 58 : 82, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 600px)', background: 'rgba(255,255,255,.92)', border: '3px solid var(--outline)', borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          Count the coins with Milo
        </div>
      </div>
    </>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeMoneyBeat(world: MoneyWorld): Beat<MoneyRound> {
  return {
    skillId: 'money', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeMoneyRound(world, (d || 1) as 1 | 2 | 3, round),
    sig: d => d.coins.join(','),   // dedupe on the MATH (the coin multiset), not the rotating scene/item
    prompt: d => promptFor(d),
    say: d => sayFor(d),
    Play: ({ data, onSubmit }) => <CoinPlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <CoinExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const CS_CSS = `
@keyframes cs_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes cs_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.12);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function CoinShop({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [world, setWorld] = useState<MoneyWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
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
  const beat = useMemo(() => (world ? makeMoneyBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall we shop today?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setBg(0); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  // Demo shows two counts with different items; guided is a gentle 5+1.
  const DEMO: MoneyRound[] = [
    { bg: 0, item: world.items[0], coins: [5, 1], answer: 6 },
    { bg: 1 % world.bgs.length, item: world.items[1] ?? world.items[0], coins: [10, 5, 1], answer: 16 },
  ]
  const guidedIdx = 2 % world.items.length
  const GUIDED: MoneyRound = { bg: guidedIdx % world.bgs.length, item: world.items[guidedIdx], coins: [5, 1, 1], answer: 7 }
  const bgIdx = phase === 'practice' ? bg : phase === 'guided' ? GUIDED.bg : DEMO[Math.min(demoIdx, DEMO.length - 1)].bg

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{CS_CSS}</style>
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
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s shop! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo count  (${demoIdx + 1}/${DEMO.length})`)}
        <CoinExplain key={`demo${demoIdx}`} world={world} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap how much')}
        <CoinPlay key="guided" world={world} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
