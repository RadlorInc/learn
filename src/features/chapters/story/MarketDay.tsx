'use client'
/**
 * Chapter (6–8) — MULTIPLICATION (skill `multiplication`) as STORY MODE.
 *
 * Multiplication is EQUAL GROUPS, carried by the world's OWN objects: `g` groups that each hold
 * `per` of the item — "3 trays of 4 cupcakes". The child skip-counts the groups and taps the
 * total. Two views of the same idea (both object-driven):
 *   GROUPS — `g` framed clusters, each holding `per` items
 *   ARRAY  — one neat grid of `g` rows × `per` columns
 * The child PICKS one of three worlds; the world's items SHUFFLE and the scene rotates across the
 * 10 adaptive rounds (one continuous SkillBeat — harder on a streak, gentler when struggling,
 * re-teach after 3 wrong):
 *   🧁 Bakery       — trays of treats     (cupcake/cookie/candy/lollipop)
 *   🌻 Flower Garden — beds of flowers      (tulip/daisy/sunflower)
 *   🎨 Craft Table   — boxes of crafts      (bead/button/gem)
 *
 * Numbers stay small enough to SHOW every object (object-driven per the locked 6–8 rules): up to
 * 6×6. The demo + 3-wrong re-teach SKIP-COUNT the groups via ONE speakSteps — a group lights up
 * as the running total climbs "four, eight, twelve", then "3 × 4 = 12" (voice + visual synced when
 * audio plays, timer-paced when blocked). Reuses committed sprites only. Wrapped by
 * game/MultiplicationChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import WorldSelect from './WorldSelect'
import { TintedSprite } from './TintedSprite'
import FitBox from './FitBox'
import { useViewport } from '@/shared/hooks/useViewport'

// Live viewport size — for layouts that must RESERVE room (objects vs. the answer buttons)
// so they never overlap on a short/landscape screen.

// ─── Items & Worlds ──────────────────────────────────────────────────────────────────
interface Item { img: string; emoji: string; one: string; many: string; tint?: string }
const IT = {
  cupcake:  { img: '/assets/objects/candy_cupcake.png',  emoji: '🧁', one: 'cupcake',  many: 'cupcakes' },
  cookie:   { img: '/assets/objects/cookie.png',         emoji: '🍪', one: 'cookie',   many: 'cookies' },
  candy:    { img: '/assets/objects/candy_candy.png',    emoji: '🍬', one: 'candy',    many: 'candies' },
  lolly:    { img: '/assets/objects/candy_lollipop.png', emoji: '🍭', one: 'lollipop', many: 'lollipops' },
  tulip:    { img: '/assets/objects/flower_tulip.png',   emoji: '🌷', one: 'tulip',    many: 'tulips' },
  daisy:    { img: '/assets/objects/flower_daisy.png',   emoji: '🌼', one: 'daisy',    many: 'daisies' },
  sunflower:{ img: '/assets/objects/flower_sunflower.png',emoji: '🌻', one: 'sunflower',many: 'sunflowers' },
  // pat_* sprites are GRAYSCALE by design → tint them to a color (see TintedSprite).
  bead:     { img: '/assets/objects/pat_bead.png',       emoji: '🔵', one: 'bead',     many: 'beads',   tint: '#1a9ea0' },
  button:   { img: '/assets/objects/pat_button.png',     emoji: '🔘', one: 'button',   many: 'buttons', tint: '#d8524f' },
  gem:      { img: '/assets/objects/pat_gem.png',        emoji: '💎', one: 'gem',      many: 'gems',    tint: '#9b59b6' },
} satisfies Record<string, Item>

interface Bg { grad: string; img: string }
interface MultWorld {
  id: string; label: string; emoji: string
  bgs: Bg[]
  items: Item[]
  group: string            // what one group is called: "tray", "bed", "pod"
  groupPlural: string
  dark?: boolean
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
const WORLDS: MultWorld[] = [
  { id: 'bakery', label: 'Bakery', emoji: '🧁', group: 'tray', groupPlural: 'trays',
    bgs: [
      { grad: 'linear-gradient(#f6dced 0%, #f4e0e6 60%, #eecdd8 100%)', img: '/assets/backgrounds/candy_shop.png' },
      { grad: 'linear-gradient(#f2e0ec 0%, #f4e4e2 60%, #ecd2d4 100%)', img: '/assets/backgrounds/candy_counter.png' },
      { grad: 'linear-gradient(#f6e4dc 0%, #f4e6ea 60%, #eed6e0 100%)', img: '/assets/backgrounds/candy_tray.png' },
    ],
    items: [IT.cupcake, IT.cookie, IT.candy, IT.lolly],
    milo: { src: '/assets/characters/milo_chef.png', emoji: '🦊', accessory: '🧁' },
    intro: 'Welcome to the Bakery! Milo bakes treats in equal TRAYS. Count the trays and how many are on each, then tap how many there are in all. First, watch Milo count!' },
  { id: 'garden', label: 'Flower Garden', emoji: '🌻', group: 'bed', groupPlural: 'beds',
    bgs: [
      { grad: 'linear-gradient(#cfe6f7 0%, #dcecdb 60%, #c6e0b6 100%)', img: '/assets/backgrounds/garden_meadow.png' },
      { grad: 'linear-gradient(#d3e9f6 0%, #dfeedb 60%, #c8e2b8 100%)', img: '/assets/backgrounds/garden.png' },
      { grad: 'linear-gradient(#cfe8f5 0%, #dcecda 60%, #c4dfb4 100%)', img: '/assets/backgrounds/garden_park.png' },
    ],
    items: [IT.tulip, IT.daisy, IT.sunflower],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌼' },
    intro: 'Welcome to the Flower Garden! Flowers grow in equal BEDS. Count the beds and how many are in each, then tap how many there are in all. First, watch Milo count!' },
  { id: 'craft', label: 'Craft Table', emoji: '🎨', group: 'box', groupPlural: 'boxes',
    bgs: [
      { grad: 'linear-gradient(#f0e4dc 0%, #eee0d6 60%, #e4d2c4 100%)', img: '/assets/backgrounds/craft_buttons.png' },
      { grad: 'linear-gradient(#e8e0ee 0%, #e6e2ee 60%, #d8d2e6 100%)', img: '/assets/backgrounds/craft_gems.png' },
      { grad: 'linear-gradient(#f4e6d8 0%, #f0e4dc 60%, #e6d4c0 100%)', img: '/assets/backgrounds/bead_shop.png' },
    ],
    // NOTE: order MUST line up with `bgs` above — the background follows the item so a scene
    // always shows its own object (buttons bg → buttons, gems bg → gems, bead-shop bg → beads).
    items: [IT.button, IT.gem, IT.bead],
    milo: { src: '/assets/characters/milo_painter.png', emoji: '🦊', accessory: '🎨' },
    intro: 'Welcome to the Craft Table! Beads and buttons are sorted into equal BOXES. Count the boxes and how many are in each, then tap how many there are in all. First, watch Milo count!' },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.bgs[0].img, itemImage: w.items[0].img, itemTint: w.items[0].tint }))

type View = 'groups' | 'array'
interface MultRound { bg: number; item: Item; view: View; g: number; per: number; answer: number }

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const coin = () => Math.random() < 0.5
function shuffle<T>(a: T[]): T[] {
  const arr = a.slice()
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr
}
function multChoices(answer: number, g: number, per: number): number[] {
  const set = new Set<number>([answer])
  const cands = [g * (per + 1), g * (per - 1), (g + 1) * per, (g - 1) * per, answer + g, answer - g, answer + per, answer - per, answer + 1, answer - 1]
  for (const c of shuffle(cands)) { if (set.size >= 3) break; if (c > 0 && c !== answer) set.add(c) }
  while (set.size < 3) { const r = answer + rint(1, 4) * (coin() ? 1 : -1); if (r > 0 && r !== answer) set.add(r) }
  return shuffle([...set])
}
// Numbers stay small enough to SHOW every object; difficulty widens the factors + adds the array view.
function makeMultRound(world: MultWorld, d: 1 | 2 | 3, round: number): MultRound {
  // The background FOLLOWS the item (paired by index) so item-specific scenes (e.g. the Craft
  // Table's gems/buttons/bead-shop) never show the wrong object. Generic worlds are unaffected.
  const idx = round % world.items.length
  const item = world.items[idx]
  const bg = idx % world.bgs.length
  let g: number, per: number, view: View
  if (d === 1) { g = rint(2, 3); per = rint(2, 4); view = 'groups' }
  else if (d === 2) { g = rint(2, 5); per = rint(2, 5); view = coin() ? 'groups' : 'array' }
  else { g = rint(2, 6); per = rint(2, 6); view = coin() ? 'array' : 'groups' }
  return { bg, item, view, g, per, answer: g * per }
}

// ─── Background (crossfades across the world's bg list) ───────────────────────────────
function Background({ bg, world }: { bg: number; world: MultWorld }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: world.dark ? '#161d3a' : '#f3ead8' }}>
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

function MiloHost({ left, milo }: { left: number; milo: MultWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'md_float 3.4s ease-in-out infinite' }}>
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
  if (item.tint) return <TintedSprite src={item.img} size={size} hex={item.tint} emoji={item.emoji} />
  if (missing) return <span style={{ fontSize: size, lineHeight: 1 }}>{item.emoji}</span>
  return <img src={item.img} alt="" draggable={false} decoding="async" loading="lazy" onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
}

function itemPxFor(g: number, per: number, short?: boolean): string {
  const density = g * per
  // On SHORT (landscape phone) frames drop the clamp MIN-floors so a full array + the equation box
  // + the buttons still fit inside the height.
  if (short) {
    if (density <= 9) return 'clamp(22px,7vmin,50px)'
    if (density <= 16) return 'clamp(18px,5.5vmin,40px)'
    if (density <= 25) return 'clamp(14px,4.2vmin,30px)'
    return 'clamp(11px,3.3vmin,24px)'
  }
  if (density <= 9) return 'clamp(34px,6.4vmin,58px)'
  if (density <= 16) return 'clamp(26px,4.9vmin,44px)'
  if (density <= 25) return 'clamp(20px,3.7vmin,33px)'
  return 'clamp(16px,2.9vmin,26px)'
}

// One GROUP = a framed cluster of `per` items. `lit` shows it (else dim); `glow` = counting glow.
function Cluster({ item, per, itemPx, lit, glow, dark }: { item: Item; per: number; itemPx: string; lit: boolean; glow: boolean; dark?: boolean }) {
  const cols = per === 4 ? 2 : per <= 3 ? per : 3
  // OUTER wrapper runs md_pop (fill:both, whose 100% keyframe sets transform:scale(1)); the INNER
  // grid holds the lit/glow scale. If both lived on one element the finished pop would clobber the
  // inline scale (dimming the lit/glow state). Split them.
  return (
    <div style={{ animation: 'md_pop .3s ease both' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: 'clamp(2px,0.7vmin,5px)', padding: 'clamp(5px,1.2vmin,9px)', borderRadius: 16,
        border: `3px solid ${dark ? 'rgba(143,180,255,.6)' : 'var(--sky-blue-deep)'}`,
        background: glow ? (dark ? 'rgba(255,214,102,.28)' : 'rgba(255,214,102,.5)') : dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.55)',
        opacity: lit ? 1 : 0.16, transform: `scale(${lit ? (glow ? 1.06 : 1) : 0.86})`,
        transition: 'all .3s cubic-bezier(.34,1.56,.64,1)', filter: glow ? 'drop-shadow(0 0 12px var(--sun-yellow))' : 'drop-shadow(0 2px 4px rgba(0,0,0,.22))',
      }}>
        {Array.from({ length: per }).map((_, i) => <ItemImg key={i} item={item} size={itemPx} />)}
      </div>
    </div>
  )
}

// GROUPS view — `g` clusters in a row; `shown`/`glowN` count them one-by-one.
function GroupsView({ item, g, per, itemPx, shown, glowN, dark }: { item: Item; g: number; per: number; itemPx: string; shown: number; glowN: number; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(8px,2.2vw,26px)', justifyContent: 'center', alignItems: 'center', maxWidth: '94vw' }}>
      {Array.from({ length: g }).map((_, i) => <Cluster key={i} item={item} per={per} itemPx={itemPx} lit={i < shown} glow={i < glowN} dark={dark} />)}
    </div>
  )
}

// ARRAY view — one grid of `g` rows × `per` cols; `shown`/`glowN` reveal/glow row-by-row.
function ArrayView({ item, g, per, itemPx, shown, glowN, dark }: { item: Item; g: number; per: number; itemPx: string; shown: number; glowN: number; dark?: boolean }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 'clamp(4px,1vmin,8px)', padding: 'clamp(8px,1.6vmin,14px)', borderRadius: 18,
      border: `3px solid ${dark ? 'rgba(143,180,255,.6)' : 'var(--sky-blue-deep)'}`, background: dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.5)', maxWidth: '94vw' }}>
      {Array.from({ length: g }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 'clamp(3px,0.9vmin,7px)', justifyContent: 'center',
          opacity: r < shown ? 1 : 0.16, transform: `scale(${r < shown ? 1 : 0.9})`, transition: 'all .3s cubic-bezier(.34,1.56,.64,1)',
          filter: r < glowN ? 'drop-shadow(0 0 10px var(--sun-yellow))' : 'none', background: r < glowN ? 'rgba(255,214,102,.4)' : 'transparent', borderRadius: 10 }}>
          {Array.from({ length: per }).map((_, c) => <ItemImg key={c} item={item} size={itemPx} />)}
        </div>
      ))}
    </div>
  )
}

// The × equation + answer box (the answer box climbs during the count-up).
function EquationBox({ g, per, value, done, show, dark, short }: { g: number; per: number; value: number | null; done: boolean; show: boolean; dark?: boolean; short?: boolean }) {
  const txt = dark ? '#fff' : 'var(--ink)'
  const boxSize = short ? 'clamp(48px,17vh,84px)' : 'clamp(84px,14vmin,124px)'
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '65%' : '76%', transform: 'translateY(-50%)', zIndex: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: short ? 'clamp(6px,2vw,16px)' : 'clamp(8px,2.4vw,22px)',
      opacity: show ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: 'none' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(22px,7vh,44px)' : 'clamp(30px,6.5vmin,54px)', color: txt, WebkitTextStroke: dark ? '0' : '1.5px var(--outline)', paintOrder: 'stroke fill' }}>{g} × {per} =</span>
      <div style={{ width: boxSize, height: boxSize, borderRadius: 24, border: '5px solid',
        background: done ? 'var(--garden-green)' : 'var(--paper)', borderColor: done ? 'var(--garden-green-deep)' : 'var(--outline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 0 rgba(61,37,22,.2)', transition: 'all .3s ease',
        animation: done ? 'md_pop .5s ease' : 'none', filter: done ? 'drop-shadow(0 0 16px var(--garden-green))' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 'clamp(26px,10vh,48px)' : 'clamp(44px,8.5vmin,68px)', color: done ? '#fff' : 'var(--ink-muted)', lineHeight: 1 }}>{value ?? '?'}</span>
      </div>
    </div>
  )
}

interface StageState { shown: number; glowN: number; boxValue: number | null; boxDone: boolean; showBox: boolean }
function Stage({ world, data, s, short }: { world: MultWorld; data: MultRound; s: StageState; short?: boolean }) {
  const { item, view, g, per } = data
  const itemPx = itemPxFor(g, per, short)
  // Scale the groups/array up to fill the band between the banner and the equation box, so the
  // manipulative is big & clear on any viewport (not capped by itemPxFor's clamp max).
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.30 : vh * 0.44
  return (
    <>
      <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '37%' : '40%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
        <FitBox availW={availW} availH={availH} max={2.6}>
          {view === 'groups'
            ? <GroupsView item={item} g={g} per={per} itemPx={itemPx} shown={s.shown} glowN={s.glowN} dark={world.dark} />
            : <ArrayView item={item} g={g} per={per} itemPx={itemPx} shown={s.shown} glowN={s.glowN} dark={world.dark} />}
        </FitBox>
      </div>
      <EquationBox g={g} per={per} value={s.boxValue} done={s.boxDone} show={s.showBox} dark={world.dark} short={short} />
    </>
  )
}

// ─── Interactive play surface (guided / practice) ─────────────────────────────────────
type Mode = 'guided' | 'practice'
const empty: StageState = { shown: 0, glowN: 0, boxValue: null, boxDone: false, showBox: false }
const groupWord = (world: MultWorld, view: View) => view === 'array' ? 'rows' : world.groupPlural
const sayFor = (world: MultWorld, d: MultRound) =>
  `${numberToWords(d.g)} ${groupWord(world, d.view)} of ${numberToWords(d.per)} ${d.item.many}. How many in all?`

const MultPlay: React.FC<{ world: MultWorld; data: MultRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { g, per, answer } = data
  const choices = useMemo(() => multChoices(answer, g, per), [g, per, answer])
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
    if (mode === 'guided') speak(sayFor(world, data))
    for (let i = 1; i <= g; i++) { const c = i; T.push(window.setTimeout(() => set({ shown: c }), t)); t += 380 }
    t += 350
    T.push(window.setTimeout(() => { setAsking(true); set({ showBox: true }); speak('How many in all?') }, t))
    return () => T.forEach(id => window.clearTimeout(id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === answer) {
      done.current = true
      if (mode === 'guided') speak('Yes! Let’s skip-count.')
      let k = 0
      const tick = () => {
        k++; set({ glowN: k, boxValue: k * per })
        if (k < g) window.setTimeout(tick, 460)
        else { set({ boxDone: true }); if (mode === 'guided') speak(`${numberToWords(g)} times ${numberToWords(per)} is ${numberToWords(answer)}!`) }
      }
      window.setTimeout(tick, 250)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), g * 460 + 1500)
    } else {
      erred.current = true
      speak(`Not quite — count the ${groupWord(world, data.view)} of ${numberToWords(per)}. Try again!`)
      window.setTimeout(() => setPicked(null), 1100)
    }
  }

  return (
    <>
      <Stage world={world} data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 58 : 82, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 600px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {g} {groupWord(world, data.view)} of {per} — how many in all?
        </div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3.5vw,30px)', flexWrap: 'wrap', padding: '0 12px',
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

// ─── Teaching demo (opening preview + 3-wrong re-teach): skip-count the groups via ONE speakSteps ─
const MultExplain: React.FC<{ world: MultWorld; data: MultRound; onDone: () => void }> = ({ world, data, onDone }) => {
  const { g, per, answer, item } = data
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(empty)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines: string[] = []
    const steps: Array<() => void> = []
    lines.push(`${numberToWords(g)} ${groupWord(world, data.view)} of ${numberToWords(per)} ${item.many}. Let’s skip-count!`)
    steps.push(() => set({ shown: 0, glowN: 0, showBox: true, boxValue: 0 }))
    for (let k = 1; k <= g; k++) { const v = k; lines.push(numberToWords(v * per)); steps.push(() => set({ shown: v, glowN: v, boxValue: v * per })) }
    lines.push(`${numberToWords(g)} times ${numberToWords(per)} is ${numberToWords(answer)}! ${numberToWords(answer)} ${item.many} in all.`)
    steps.push(() => set({ boxDone: true, glowN: g }))
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
      <Stage world={world} data={data} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 58 : 82, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 600px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {g} {groupWord(world, data.view)} of {per} {item.many}
        </div>
      </div>
    </>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeMultBeat(world: MultWorld): Beat<MultRound> {
  return {
    skillId: 'multiplication', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeMultRound(world, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.g}x${d.per}|${d.view}`,   // dedupe on the MATH (factors + view), not the rotating scene/item
    prompt: d => `${d.g} ${groupWord(world, d.view)} of ${d.per} — how many in all?`,
    say: d => sayFor(world, d),
    Play: ({ data, onSubmit }) => <MultPlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <MultExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const MD_CSS = `
@keyframes md_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes md_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.12);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function MarketDay({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [world, setWorld] = useState<MultWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
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
  const beat = useMemo(() => (world ? makeMultBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall we make equal groups?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setBg(0); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  const DEMO: MultRound[] = [
    { bg: 0, item: world.items[0], view: 'groups', g: 3, per: 2, answer: 6 },
    { bg: 1 % world.bgs.length, item: world.items[1] ?? world.items[0], view: 'array', g: 3, per: 4, answer: 12 },
  ]
  const guidedIdx = 2 % world.items.length
  const guidedItem = world.items[guidedIdx]
  const GUIDED: MultRound = { bg: guidedIdx % world.bgs.length, item: guidedItem, view: 'groups', g: 2, per: 3, answer: 6 }
  const bgIdx = phase === 'practice' ? bg : phase === 'guided' ? GUIDED.bg : DEMO[Math.min(demoIdx, DEMO.length - 1)].bg

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{MD_CSS}</style>
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
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s count! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo skip-count  (${demoIdx + 1}/${DEMO.length})`)}
        <MultExplain key={`demo${demoIdx}`} world={world} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap how many in all')}
        <MultPlay key="guided" world={world} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
