'use client'
/**
 * Chapter (6–8) — FRACTIONS (halves · thirds · quarters, skill `fractions`) as STORY MODE.
 *
 * A "whole" is cut into EQUAL PARTS, carried by the world's own treats. Two question types:
 *   NAME  — a whole cut into `den` equal parts, ONE shaded → tap the fraction (1/2 · 1/3 · 1/4)
 *   GROUP — a fraction OF a group → a number ("one half of 6 cupcakes = 3"): the group splits
 *           into `den` equal little groups, one is lit, the child taps how many are in it.
 * Each world has a LIST of 3+ treats that SHUFFLE across rounds + THREE rotating backgrounds, so a
 * narrative never feels like one repeated object (and the Fractions "Pizzeria" is kept visually
 * SEPARATE from the 3–5 Grocery "Pizza Parlor": different backgrounds + a bakery treat list).
 *   🍕 Pizzeria       — pizza · cookie · pie          (round wedges;  kitchen/bakery scenes)
 *   🎂 Party          — cake · watermelon · orange      (round wedges;  party scenes)
 *   🍫 Chocolate Shop — chocolate bar · wafer · biscuit  (rectangular bars; sweet-shop scenes)
 *
 * Wholes are code-drawn (SVG wedges / bar segments) so any denominator divides cleanly, tinted to
 * the CHOSEN treat's colours; group items are real sprites. Demo + 3-wrong re-teach narrate via ONE
 * speakSteps. Responsive (short/landscape aware). Wrapped by game/FractionsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import WorldSelect from './WorldSelect'
import FitBox from './FitBox'
import { useViewport } from '@/lib/useViewport'

// ─── Treats & Worlds ─────────────────────────────────────────────────────────────────
interface Item { img: string; emoji: string; one: string; many: string }
interface Colors { base: string; shaded: string; edge: string; dot: string }
interface Treat { name: string; colors: Colors; group: Item; topping?: string }   // a divisible food + its group sprite; topping = real decoration laid on a shaded part
interface FrWorld {
  id: string; label: string; emoji: string
  shape: 'round' | 'bar'
  treats: Treat[]                     // shuffle across rounds → 3+ objects per narrative
  bgs: { grad: string; img: string }[]
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
const IT = (img: string, emoji: string, one: string, many: string): Item => ({ img: `/assets/objects/${img}.png`, emoji, one, many })
const WORLDS: FrWorld[] = [
  { id: 'pizza', label: 'Pizzeria', emoji: '🍕', shape: 'round',
    treats: [
      { name: 'pizza', colors: { base: '#f4c84e', shaded: '#f0b93e', edge: '#c98a3a', dot: '#a52f26' }, topping: '/assets/objects/topping_pizza.png', group: IT('pizza_base', '🍕', 'pizza', 'pizzas') },
      { name: 'cookie', colors: { base: '#d99a52', shaded: '#cf8c44', edge: '#a06a30', dot: '#3a2410' }, topping: '/assets/objects/topping_cookie.png', group: IT('cookie', '🍪', 'cookie', 'cookies') },
      { name: 'pie', colors: { base: '#f0c268', shaded: '#ecb955', edge: '#c07a3a', dot: '#a8321f' }, topping: '/assets/objects/topping_pie.png', group: IT('cherry', '🍒', 'cherry pie', 'cherry pies') },
    ],
    bgs: [
      { grad: 'linear-gradient(#f6e7cf 0%, #f2e0cf 60%, #e8d0b0 100%)', img: '/assets/backgrounds/kitchen_oven.jpeg' },
      { grad: 'linear-gradient(#f4e6d2 0%, #efe0cc 60%, #e4d0ac 100%)', img: '/assets/backgrounds/kitchen_bakery.jpeg' },
      { grad: 'linear-gradient(#f6e8d0 0%, #f0e2cc 60%, #e6d2ac 100%)', img: '/assets/backgrounds/grocery_bakery.jpeg' },
    ],
    milo: { src: '/assets/characters/milo_chef.png', emoji: '🦊', accessory: '🍕' },
    intro: 'Welcome to the Pizzeria! Milo cuts pizzas, cookies and pies into EQUAL parts. Count the equal parts, and how many are covered — then tap the answer. First, watch Milo!' },
  { id: 'party', label: 'Party', emoji: '🎂', shape: 'round',
    treats: [
      { name: 'cake', colors: { base: '#f7e2b0', shaded: '#f6d3c2', edge: '#d8a86a', dot: '#c85f88' }, topping: '/assets/objects/topping_cake.png', group: IT('candy_cupcake', '🧁', 'cupcake', 'cupcakes') },
      { name: 'watermelon', colors: { base: '#3aa843', shaded: '#f4776e', edge: '#2c7a34', dot: '#2a1f1a' }, topping: '/assets/objects/topping_watermelon.png', group: IT('watermelon', '🍉', 'watermelon', 'watermelons') },
      { name: 'orange', colors: { base: '#f0932b', shaded: '#ffc46a', edge: '#c9701a', dot: '#c9701a' }, topping: '/assets/objects/topping_orange.png', group: IT('kitchen_orange', '🍊', 'orange', 'oranges') },
    ],
    bgs: [
      { grad: 'linear-gradient(#f6e0ef 0%, #f2e4f4 60%, #e8d0ea 100%)', img: '/assets/backgrounds/party_banner.png' },
      { grad: 'linear-gradient(#e6eeff 0%, #eee4f6 60%, #f6e0ee 100%)', img: '/assets/backgrounds/party_balloons.png' },
      { grad: 'linear-gradient(#fdeede 0%, #f6e6f2 60%, #eee0f6 100%)', img: '/assets/backgrounds/party_lanterns.png' },
    ],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🎈' },
    intro: "It's a party! Milo shares cake, watermelon and oranges in EQUAL parts. See how many equal parts, and how many are coloured — then tap the answer. First, watch Milo!" },
  { id: 'choc', label: 'Chocolate Shop', emoji: '🍫', shape: 'bar',
    treats: [
      { name: 'chocolate bar', colors: { base: '#a9713c', shaded: '#8a5a2c', edge: '#4a2b14', dot: '#3a2010' }, topping: '/assets/objects/topping_choc.png', group: IT('cookie', '🍪', 'chocolate', 'chocolates') },
      { name: 'wafer', colors: { base: '#e6c99a', shaded: '#d8b478', edge: '#a06a30', dot: '#7a4a20' }, topping: '/assets/objects/topping_wafer.png', group: IT('candy_candy', '🍬', 'wafer', 'wafers') },
      { name: 'biscuit', colors: { base: '#d9a860', shaded: '#c2934a', edge: '#7a4a20', dot: '#5a3418' }, topping: '/assets/objects/topping_biscuit.png', group: IT('grocery_candy', '🍬', 'biscuit', 'biscuits') },
    ],
    bgs: [
      { grad: 'linear-gradient(#efe0cf 0%, #ecd8c2 60%, #e0c8a8 100%)', img: '/assets/backgrounds/grocery_sweets.jpeg' },
      { grad: 'linear-gradient(#eee2d2 0%, #e8dac6 60%, #dcc8aa 100%)', img: '/assets/backgrounds/kitchen_pantry.jpeg' },
      { grad: 'linear-gradient(#eee0d0 0%, #e8d8c2 60%, #dcc6a8 100%)', img: '/assets/backgrounds/grocery_deli.jpeg' },
    ],
    milo: { src: '/assets/characters/milo_chef.png', emoji: '🦊', accessory: '🍫' },
    intro: 'Welcome to the Chocolate Shop! Milo snaps chocolate bars, wafers and biscuits into EQUAL pieces. Count the equal pieces, and how many are wrapped — then tap the answer. First, watch Milo!' },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.bgs[0].img, itemImage: w.treats[0].group.img }))

const DENS = [2, 3, 4]
const fracWord = (d: number) => d === 2 ? 'half' : d === 3 ? 'third' : d === 4 ? 'quarter' : `one-${d}th`

type FType = 'name' | 'group'
interface FrRound { bg: number; treat: Treat; type: FType; den: number; total: number; answer: number; choices: number[] }

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] {
  const arr = a.slice()
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr
}
function numChoices(answer: number): number[] {
  const set = new Set<number>([answer])
  let d = 1
  while (set.size < 3) { if (answer - d >= 1) set.add(answer - d); if (set.size < 3) set.add(answer + d); d++ }
  return shuffle([...set])
}
function makeFractionRound(world: FrWorld, d: 1 | 2 | 3, round: number): FrRound {
  const bg = round % world.bgs.length
  const treat = world.treats[round % world.treats.length]   // shuffle the world's treats
  const type: FType = d === 1 ? 'name' : pick<FType>(d === 2 ? ['name', 'group'] : ['name', 'group', 'group'])
  if (type === 'name') {
    const den = d === 1 ? pick([2, 4]) : pick(DENS)
    return { bg, treat, type, den, total: 0, answer: den, choices: DENS.slice() }
  }
  const den = d === 2 ? 2 : pick(DENS)
  const per = d === 2 ? rint(2, 4) : rint(2, 5)
  const total = per * den
  return { bg, treat, type, den, total, answer: per, choices: numChoices(per) }
}

// ─── Live viewport (short/landscape aware) ────────────────────────────────────────────

// ─── Background (crossfades across the world's bg list) ───────────────────────────────
function Background({ bg, world }: { bg: number; world: FrWorld }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#f3ead8' }}>
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

function MiloHost({ left, milo }: { left: number; milo: FrWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'sl_float 3.4s ease-in-out infinite' }}>
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

// ─── The WHOLE, cut into `den` equal parts with `shaded` parts filled ─────────────────
function wedgePath(i: number, den: number, r = 46, cx = 50, cy = 50): string {
  const a0 = (i / den) * 2 * Math.PI - Math.PI / 2
  const a1 = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
  const large = (a1 - a0) > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
}
function wedgeMid(i: number, den: number, rr: number, cx = 50, cy = 50) {
  const a = ((i + 0.5) / den) * 2 * Math.PI - Math.PI / 2
  return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) }
}
function Whole({ shape, colors: c, den, shaded, px, glow, topping }: { shape: 'round' | 'bar'; colors: Colors; den: number; shaded: number; px: string; glow?: boolean; topping?: string }) {
  const filter = glow ? 'drop-shadow(0 0 14px var(--sun-yellow))' : 'drop-shadow(0 6px 10px rgba(0,0,0,.3))'
  if (shape === 'bar') {
    const W = den * 26, H = 60
    const tp = 20   // topping size within a segment
    return (
      <svg viewBox={`-3 -3 ${W + 6} ${H + 6}`} style={{ width: `calc(${px} * ${Math.min(1.9, den * 0.55)})`, height: px, filter, display: 'block' }}>
        <rect x={-2} y={-2} width={W + 4} height={H + 4} rx={9} fill={c.edge} />
        {Array.from({ length: den }).map((_, i) => (
          <g key={i}>
            <rect x={i * 26 + 1.5} y={1.5} width={23} height={H - 3} rx={4} fill={i < shaded ? c.shaded : c.base} stroke={c.edge} strokeWidth={2} />
            {i < shaded && (topping
              ? <image href={topping} x={i * 26 + 13 - tp / 2} y={30 - tp / 2} width={tp} height={tp} preserveAspectRatio="xMidYMid meet" />
              : <>
                  <circle cx={i * 26 + 8} cy={18} r={2.2} fill={c.dot} /><circle cx={i * 26 + 17} cy={30} r={2.2} fill={c.dot} /><circle cx={i * 26 + 9} cy={44} r={2.2} fill={c.dot} />
                </>)}
          </g>
        ))}
      </svg>
    )
  }
  const tp = den <= 2 ? 40 : den === 3 ? 34 : 28   // topping size scales down as slices get thinner
  return (
    <svg viewBox="-4 -4 108 108" style={{ width: px, height: px, filter, display: 'block' }}>
      <circle cx={50} cy={50} r={49} fill={c.edge} />
      {Array.from({ length: den }).map((_, i) => {
        const on = i < shaded
        const m = wedgeMid(i, den, 25)
        return (
          <g key={i}>
            <path d={wedgePath(i, den)} fill={on ? c.shaded : c.base} stroke={c.edge} strokeWidth={2.2} strokeLinejoin="round" />
            {on && (topping
              ? <image href={topping} x={m.x - tp / 2} y={m.y - tp / 2} width={tp} height={tp} preserveAspectRatio="xMidYMid meet" />
              : <>
                  <circle cx={m.x - 6} cy={m.y - 4} r={2.6} fill={c.dot} /><circle cx={m.x + 6} cy={m.y + 3} r={2.6} fill={c.dot} /><circle cx={m.x + 1} cy={m.y - 7} r={2.6} fill={c.dot} />
                </>)}
          </g>
        )
      })}
    </svg>
  )
}

// ─── A fraction pill (n over d) ───────────────────────────────────────────────────────
function Frac({ n, d, size, color }: { n: number; d: number; size: number; color: string }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, fontFamily: 'var(--font-display)', fontWeight: 900, color, fontSize: size }}>
      <span>{n}</span>
      <span style={{ width: '1.05em', height: Math.max(2, Math.round(size / 14)), background: color, margin: '3px 0', borderRadius: 2 }} />
      <span>{d}</span>
    </span>
  )
}

function ItemImg({ item, size }: { item: Item; size: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span style={{ fontSize: size, lineHeight: 1 }}>{item.emoji}</span>
  return <img src={item.img} alt="" draggable={false} onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
}

// ─── The GROUP view — `total` items split into `den` framed groups; `lit` groups glow ─
function GroupView({ item, total, den, lit, itemPx }: { item: Item; total: number; den: number; lit: number; itemPx: string }) {
  const per = total / den
  const cols = per <= 2 ? per : per <= 4 ? 2 : 3
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(8px,2.2vw,24px)', justifyContent: 'center', alignItems: 'center', maxWidth: '94vw' }}>
      {Array.from({ length: den }).map((_, g) => {
        const on = g < lit
        // Outer wrapper holds the entrance animation; inner holds the lit-state transform. If both
        // sat on one element, sl_pop's `both` fill (ending at scale(1)) would clobber the lit scale.
        return (
          <div key={g} style={{ animation: 'sl_pop .3s ease both' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: 'clamp(2px,0.7vmin,5px)', padding: 'clamp(5px,1.2vmin,9px)', borderRadius: 14,
              border: `3px solid ${on ? 'var(--sun-yellow-deep)' : 'var(--sky-blue-deep)'}`,
              background: on ? 'rgba(255,214,102,.5)' : 'rgba(255,255,255,.55)',
              transform: `scale(${on ? 1.05 : 1})`, filter: on ? 'drop-shadow(0 0 12px var(--sun-yellow))' : 'drop-shadow(0 2px 4px rgba(0,0,0,.2))',
              transition: 'all .3s cubic-bezier(.34,1.56,.64,1)',
            }}>
              {Array.from({ length: per }).map((_, i) => <ItemImg key={i} item={item} size={itemPx} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stage (shared by play + demo) ────────────────────────────────────────────────────
interface StageState { shaded: number; lit: number; glow: boolean }
function Stage({ world, data, s, short }: { world: FrWorld; data: FrRound; s: StageState; short?: boolean }) {
  const { type, den, total, treat } = data
  const wholePx = short
    ? (den <= 2 ? 'clamp(84px,26vh,150px)' : 'clamp(74px,22vh,130px)')
    : (den <= 2 ? 'clamp(150px,30vmin,260px)' : 'clamp(130px,26vmin,220px)')
  const itemPx = short
    ? (total <= 8 ? 'clamp(26px,7vh,44px)' : 'clamp(20px,5vh,34px)')
    : (total <= 8 ? 'clamp(38px,7vmin,60px)' : 'clamp(28px,5vmin,46px)')
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.32 : vh * 0.48
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '46%' : '42%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.6}>
        {type === 'name'
          ? <Whole shape={world.shape} colors={treat.colors} den={den} shaded={s.shaded} px={wholePx} glow={s.glow} topping={treat.topping} />
          : <GroupView item={treat.group} total={total} den={den} lit={s.lit} itemPx={itemPx} />}
      </FitBox>
    </div>
  )
}

// ─── Interactive play surface (guided / practice) ─────────────────────────────────────
type Mode = 'guided' | 'practice'
const sayFor = (world: FrWorld, d: FrRound) => d.type === 'name'
  ? `This ${d.treat.name} is cut into ${numberToWords(d.den)} equal parts. One part is ${world.shape === 'bar' ? 'wrapped' : 'covered'}. What fraction is that?`
  : `Share ${numberToWords(d.total)} ${d.treat.group.many} into ${numberToWords(d.den)} equal groups. How many are in one ${fracWord(d.den)}?`
const promptFor = (d: FrRound) => d.type === 'name'
  ? 'What fraction is shaded?'
  : `One ${fracWord(d.den)} of ${d.total} ${d.treat.group.many}?`

const FrPlay: React.FC<{ world: FrWorld; data: FrRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { type, den, answer, choices } = data
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>({ shaded: type === 'name' ? 1 : 0, lit: 0, glow: false })
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))
  const btn = Math.max(56, Math.min(short ? 92 : 108, Math.round(Math.min(vw / 8.8, vh / (short ? 4.6 : 6)))))

  useEffect(() => {
    const T: number[] = []
    if (mode === 'guided') speak(sayFor(world, data))
    if (type === 'group') T.push(window.setTimeout(() => set({ lit: 1 }), 500))
    T.push(window.setTimeout(() => setAsking(true), 650))
    return () => T.forEach(id => window.clearTimeout(id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === answer) {
      done.current = true
      set({ glow: true })
      if (mode === 'guided') speak(type === 'name' ? `Yes! One ${fracWord(den)}!` : `Yes! ${numberToWords(answer)}!`)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1400)
    } else {
      erred.current = true
      speak(type === 'name' ? `Not quite — count the equal parts.` : `Not quite — count one group.`)
      window.setTimeout(() => setPicked(null), 1100)
    }
  }

  const isFrac = type === 'name'
  return (
    <>
      <Stage world={world} data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 78 : 82, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(90vw, 560px)', background: 'rgba(255,255,255,.92)', border: '3px solid var(--outline)', borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {promptFor(data)}
        </div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '4%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.22) : 'clamp(14px,4vw,30px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {choices.map(n => {
          const isPick = picked === n, isOk = n === answer
          return (
            <button key={n} onClick={() => choose(n)} disabled={picked !== null} style={{
              width: btn, height: btn, borderRadius: Math.round(btn * 0.23),
              background: (isPick && isOk) ? 'var(--garden-green-soft)' : 'var(--paper)',
              border: `4px solid ${(isPick && isOk) ? 'var(--garden-green)' : isPick ? 'var(--ink-muted)' : 'var(--outline)'}`,
              boxShadow: `0 6px 0 ${(isPick && isOk) ? 'var(--garden-green-deep)' : '#c8ac79'}`,
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(btn * 0.44), color: 'var(--ink)',
              cursor: picked !== null ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: (isPick && isOk) ? 'scale(1.08) translateY(-3px)' : 'scale(1)',
              transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), background 160ms ease',
            }}>{isFrac ? <Frac n={1} d={n} size={Math.round(btn * 0.34)} color="var(--milo-orange)" /> : n}</button>
          )
        })}
      </div>
    </>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach) via ONE speakSteps ────────────
const FrExplain: React.FC<{ world: FrWorld; data: FrRound; onDone: () => void }> = ({ world, data, onDone }) => {
  const { type, den, total, answer, treat } = data
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>({ shaded: 0, lit: 0, glow: false })
  const [tag, setTag] = useState<React.ReactNode>(null)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines: string[] = []
    const steps: Array<() => void> = []
    if (type === 'name') {
      lines.push(`Here's a whole ${treat.name}.`); steps.push(() => set({ shaded: 0 }))
      lines.push(`Cut it into ${numberToWords(den)} equal parts.`); steps.push(() => set({ shaded: 0 }))
      lines.push(`Colour in one part.`); steps.push(() => set({ shaded: 1, glow: true }))
      lines.push(`One part out of ${numberToWords(den)} — that's one ${fracWord(den)}!`)
      steps.push(() => setTag(<Frac n={1} d={den} size={30} color="#fff" />))
    } else {
      lines.push(`Here are ${numberToWords(total)} ${treat.group.many}.`); steps.push(() => set({ lit: 0 }))
      lines.push(`Share them into ${numberToWords(den)} equal groups.`); steps.push(() => set({ lit: 0 }))
      lines.push(`Take one ${fracWord(den)} — one group.`); steps.push(() => set({ lit: 1 }))
      lines.push(`One group has ${numberToWords(answer)}. One ${fracWord(den)} of ${numberToWords(total)} is ${numberToWords(answer)}!`)
      steps.push(() => setTag(<span>{`1/${den} of ${total} = ${answer}`}</span>))
    }
    const cancel = speakSteps(lines, {
      onStep: (i) => { steps[i]?.() },
      onDone: () => { window.setTimeout(() => doneRef.current(), 1100) },
      fallbackStepMs: 1050,
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Stage world={world} data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? '74%' : '72%', left: 0, right: 0, zIndex: 33, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none', minHeight: 44 }}>
        {tag && <div style={{ background: 'var(--milo-orange)', color: '#fff', borderRadius: 50, padding: '8px 22px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 15 : 18, display: 'flex', alignItems: 'center', gap: 8, animation: 'sl_pop .4s ease both' }}>{tag}</div>}
      </div>
    </>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeFrBeat(world: FrWorld): Beat<FrRound> {
  return {
    skillId: 'fractions', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeFractionRound(world, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.type}|${d.den}|${d.total}`,   // dedupe on the MATH (not the rotating treat/scene)
    prompt: d => promptFor(d),
    say: d => sayFor(world, d),
    Play: ({ data, onSubmit }) => <FrPlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FrExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const SL_CSS = `
@keyframes sl_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes sl_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function SliceShop({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [world, setWorld] = useState<FrWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
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
  const beat = useMemo(() => (world ? makeFrBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall we share equal parts?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setBg(0); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  // Demo shows one NAME then one GROUP (different treats); guided is a gentle name (half).
  const DEMO: FrRound[] = [
    { bg: 0, treat: world.treats[0], type: 'name', den: 4, total: 0, answer: 4, choices: DENS.slice() },
    { bg: (1 % world.bgs.length), treat: world.treats[1] ?? world.treats[0], type: 'group', den: 2, total: 6, answer: 3, choices: numChoices(3) },
  ]
  const GUIDED: FrRound = { bg: 0, treat: world.treats[2 % world.treats.length], type: 'name', den: 2, total: 0, answer: 2, choices: DENS.slice() }
  const bgIdx = phase === 'practice' ? bg : phase === 'guided' ? GUIDED.bg : DEMO[Math.min(demoIdx, DEMO.length - 1)].bg

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: short ? 44 : 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{SL_CSS}</style>
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
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s slice! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  (${demoIdx + 1}/${DEMO.length})`)}
        <FrExplain key={`demo${demoIdx}`} world={world} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the fraction')}
        <FrPlay key="guided" world={world} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
