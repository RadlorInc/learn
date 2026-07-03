'use client'
/**
 * Chapter (6–8) — ADD / SUBTRACT to 100 (skills `additionTo100` / `subtractionTo100`) as STORY MODE.
 *
 * Two-digit arithmetic can't be shown as loose objects (you can't lay out 87 apples), so the
 * manipulative is BASE-TEN BLOCKS — tens rods + ones — the standard, always-correct model (same
 * "precise model where the math needs it" call as the clock and the fraction wholes). One shared
 * component drives both operations via `op`; AdditionTo100Chapter / SubtractionTo100Chapter are thin
 * wrappers. The child PICKS one of three worlds (a different trio per operation so no setting repeats)
 * and the scene rotates across the 10 adaptive rounds (one continuous SkillBeat — wider range on a
 * streak, gentler when struggling, re-teach after 3 wrong).
 *   +  🌲 Tree Fort · 🏙️ City Blocks · ⚓ Harbor
 *   −  ⭐ Star Lab  · 🌼 Meadow      · 🎣 Riverside
 *
 * The demo + 3-wrong re-teach work "the tens, then the ones" via ONE speakSteps — the answer box
 * hops to the tens total, then to the final answer (voice + visual synced when audio plays,
 * timer-paced when blocked). Range: L1 → to ~20 · L2 → to ~60 · L3 → to 100. Reuses the base-ten
 * TensOnes renderer + arithmetic choice/util helpers; no new assets.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import { buildArithChoices, applyOp, type Op } from '../lessons/ArithmeticLesson'
import WorldSelect from './WorldSelect'
import FitBox from './FitBox'
import { useViewport } from '@/shared/hooks/useViewport'


// ─── Worlds ──────────────────────────────────────────────────────────────────────────
// Each world carries its OWN object: a "ten" is a box of ten of it, a "one" is a single one — so
// the base-ten matches the scene (apples in the orchard, eggs at the ranch, fish at the dock…).
interface Bg { grad: string; img: string }
interface Item { img: string; emoji: string }
interface ASWorld { id: string; label: string; emoji: string; item: Item; bgs: Bg[]; milo: { src: string; emoji: string; accessory: string }; intro: string; dark?: boolean }
const G = (grad: string, img: string): Bg => ({ grad, img: `/assets/backgrounds/${img}` })
const IT = (img: string, emoji: string): Item => ({ img: `/assets/objects/${img}.png`, emoji })
const ADD_WORLDS: ASWorld[] = [
  { id: 'orchard', label: 'Apple Barn', emoji: '🍎', item: IT('apple', '🍎'),
    bgs: [G('linear-gradient(#fdf0d4,#eed6ac)', 'kitchen_fruit.jpeg'), G('linear-gradient(#eaf3dc,#e6d8b4)', 'grocery_produce.jpeg'), G('linear-gradient(#fbeed2,#e8d6ae)', 'town_garden.jpeg')],
    milo: { src: '/assets/characters/milo_chef.png', emoji: '🦊', accessory: '🍎' },
    intro: 'At the Apple Barn, Milo packs apples in boxes of ten. Add the TENS, then the ONES, then tap the total. First, watch Milo!' },
  { id: 'eggranch', label: 'Egg Ranch', emoji: '🥚', item: IT('grocery_egg', '🥚'),
    bgs: [G('linear-gradient(#eef3df,#e8dab6)', 'farm_barnyard.png'), G('linear-gradient(#eaf3dc,#e6d8b4)', 'farm_orchard.png'), G('linear-gradient(#eef3df,#e8dab6)', 'grocery_produce.jpeg')],
    milo: { src: '/assets/characters/milo_grocer.png', emoji: '🦊', accessory: '🥚' },
    intro: 'At the Egg Ranch, Milo fills egg boxes of ten. Add the TENS, then the ONES, then tap the total. First, watch Milo!' },
  { id: 'cookiejar', label: 'Cookie Jar', emoji: '🍪', item: IT('cookie', '🍪'),
    bgs: [G('linear-gradient(#f4e6d2,#e4d0ac)', 'kitchen_bakery.jpeg'), G('linear-gradient(#f2e0ec,#ecd2d4)', 'candy_counter.png'), G('linear-gradient(#eee2d2,#dcc8aa)', 'kitchen_pantry.jpeg')],
    milo: { src: '/assets/characters/milo_chef.png', emoji: '🦊', accessory: '🍪' },
    intro: 'At the Cookie Jar, Milo boxes cookies in tens. Add the TENS, then the ONES, then tap the total. First, watch Milo!' },
]
const SUB_WORLDS: ASWorld[] = [
  { id: 'starlab', label: 'Star Lab', emoji: '⭐', dark: true, item: IT('star', '⭐'),
    bgs: [G('linear-gradient(#1a2350,#2c2050)', 'space_moon.png'), G('linear-gradient(#141d3f,#26204c)', 'space_deepspace.png'), G('linear-gradient(#181f46,#2a2452)', 'space_launchpad.png')],
    milo: { src: '/assets/characters/milo_idle.png', emoji: '🦊', accessory: '⭐' },
    intro: 'In the Star Lab, Milo counts down the stars. Subtract the TENS, then the ONES, then tap what is left. First, watch Milo!' },
  { id: 'meadow', label: 'Flower Patch', emoji: '🌻', item: IT('flower_sunflower', '🌻'),
    bgs: [G('linear-gradient(#cfe9f7,#b6db94)', 'garden_meadow.png'), G('linear-gradient(#d6efff,#c2e69a)', 'garden.png'), G('linear-gradient(#d2eefc,#c0e498)', 'garden_park.png')],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌻' },
    intro: 'In the Flower Patch, Milo picks flowers by tens. Subtract the TENS, then the ONES, then tap what is left. First, watch Milo!' },
  { id: 'fishdock', label: 'Fish Dock', emoji: '🐟', item: IT('fish', '🐟'),
    bgs: [G('linear-gradient(#cfeaf4,#a9d3bc)', 'fishing_bg.jpeg'), G('linear-gradient(#d2ecf4,#acd6be)', 'lake.jpeg'), G('linear-gradient(#cfe8f4,#a6d2c0)', 'pond_top.jpeg')],
    milo: { src: '/assets/characters/milo_fishing.png', emoji: '🦊', accessory: '🐟' },
    intro: 'At the Fish Dock, Milo sends fish back in tens. Subtract the TENS, then the ONES, then tap what is left. First, watch Milo!' },
]
const worldsFor = (op: Op) => (op === '+' ? ADD_WORLDS : SUB_WORLDS)
const pickWorlds = (op: Op) => worldsFor(op).map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.bgs[0].img }))

interface ASRound { bg: number; a: number; b: number; answer: number }
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

function makeRound(op: Op, d: 1 | 2 | 3, round: number, bgCount: number): ASRound {
  let a: number, b: number
  if (op === '+') {
    if (d === 1) { a = rint(10, 19); b = rint(1, 9) }
    else if (d === 2) { a = rint(20, 49); b = rint(10, 40) }
    else { a = rint(40, 70); b = rint(10, 99 - a) }
  } else {
    if (d === 1) { a = rint(11, 20); b = rint(1, 9) }
    else if (d === 2) { a = rint(25, 60); b = rint(10, a - 5) }
    else { a = rint(55, 99); b = rint(15, a - 10) }
  }
  return { bg: round % bgCount, a, b, answer: applyOp(op, a, b) }
}

// count-up "the tens, then the ones": box hops from a → after-tens → answer
function afterTens(op: Op, a: number, b: number) { return op === '+' ? a + Math.floor(b / 10) * 10 : a - Math.floor(b / 10) * 10 }

// ─── Background ───────────────────────────────────────────────────────────────────────
function Background({ bg, world }: { bg: number; world: ASWorld }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: world.dark ? '#161d3a' : '#dbe8ef' }}>
      {world.bgs.map((b, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === bg ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: b.grad }} />
          <img src={b.img} alt="" draggable={false} decoding="async" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: world.dark ? 0.8 : 1 }} />
        </div>
      ))}
    </div>
  )
}

function MiloHost({ left, milo }: { left: number; milo: ASWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(24vh, 200px)', height: 'min(24vh, 200px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'by_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 72, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>{milo.emoji}</span>
              <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 30 }}>{milo.accessory}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

function ItemSprite({ item, size }: { item: Item; size: number }) {
  const [m, setM] = useState(false)
  if (m) return <span style={{ fontSize: size * 0.92, lineHeight: 1 }}>{item.emoji}</span>
  return <img src={item.img} alt="" draggable={false} decoding="async" loading="lazy" onError={() => setM(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
}

// A "ten" = a framed box of ten of the world's object (a mini one inside, with a 10 badge).
function TenBox({ item, size, dark }: { item: Item; size: number; dark?: boolean }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: 8, border: `2.5px solid ${dark ? '#8fb4ff' : 'var(--sky-blue-deep)'}`, background: dark ? 'rgba(143,180,255,.18)' : 'rgba(120,180,230,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 3px rgba(0,0,0,.2)' }}>
      <ItemSprite item={item} size={Math.round(size * 0.72)} />
      <span style={{ position: 'absolute', right: -4, bottom: -6, background: 'var(--milo-orange)', color: '#fff', borderRadius: 7, padding: '0 4px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(size * 0.3), lineHeight: 1.4, border: '2px solid #fff' }}>10</span>
    </div>
  )
}

// Base-ten built from the world's object: `t` boxes-of-ten + `o` loose ones.
function ObjTensOnes({ n, item, short, dark }: { n: number; item: Item; short?: boolean; dark?: boolean }) {
  const t = Math.floor(n / 10), o = n % 10
  const box = short ? 58 : 90, one = short ? 46 : 66
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: short ? 6 : 11 }}>
      {t > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: short ? 6 : 9, maxWidth: short ? 'min(46vw,190px)' : 'min(48vw,300px)' }}>
        {Array.from({ length: t }).map((_, i) => <TenBox key={i} item={item} size={box} dark={dark} />)}
      </div>}
      {t > 0 && o > 0 && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 18 : 26, color: 'var(--milo-orange)' }}>+</span>}
      {o > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: short ? 4 : 6, maxWidth: short ? 'min(28vw,120px)' : 'min(26vw,172px)', alignContent: 'center' }}>
        {Array.from({ length: o }).map((_, i) => <ItemSprite key={i} item={item} size={one} />)}
      </div>}
    </div>
  )
}

// A base-ten row: numeral + object boxes-of-ten + loose ones (fully shown)
function BlockRow({ n, item, sign, dark, short }: { n: number; item: Item; sign?: string; dark?: boolean; short?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: short ? 20 : 28, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 22 : 28, color: 'var(--milo-orange)' }}>{sign ?? ''}</span>
      <span style={{ width: short ? 38 : 50, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 22 : 28, color: dark ? '#fff' : 'var(--ink)' }}>{n}</span>
      <ObjTensOnes n={n} item={item} short={short} dark={dark} />
    </div>
  )
}

interface StageState { boxValue: number | null; boxDone: boolean; showBox: boolean }
function Stage({ world, data, op, s, short }: { world: ASWorld; data: ASRound; op: Op; s: StageState; short?: boolean }) {
  const { a, b, answer } = data
  const { w: vw, h: vh } = useViewport()
  const boxSize = short ? 84 : 116
  // The base-ten canvas (both rows + the answer box) lives in a band between the top prompt banner
  // and the bottom answer buttons, and is scaled by FitBox to fill it — big & clear on any viewport.
  const topReserve = short ? 90 : 128
  const botReserve = short ? 120 : 180
  const availW = vw * 0.92
  const availH = Math.max(120, vh - topReserve - botReserve)
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: topReserve, height: availH, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3vw', pointerEvents: 'none' }}>
      <FitBox availW={availW} availH={availH} max={2.4}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 6 : 12 }}>
          <div style={{ background: world.dark ? 'rgba(20,22,44,.72)' : 'rgba(255,255,255,.82)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '6px 10px' : '10px 14px', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
            <BlockRow n={a} item={world.item} dark={world.dark} short={short} />
            <div style={{ height: short ? 6 : 10 }} />
            <BlockRow n={b} item={world.item} sign={op === '+' ? '+' : '−'} dark={world.dark} short={short} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: short ? 10 : 16, opacity: s.showBox ? 1 : 0, transition: 'opacity .3s ease' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 34 : 46, color: world.dark ? '#fff' : 'var(--ink)', WebkitTextStroke: world.dark ? '0' : '1.2px var(--outline)', paintOrder: 'stroke fill' }}>=</span>
            <div style={{ minWidth: boxSize, height: boxSize, padding: '0 12px', borderRadius: 22, border: '5px solid', background: s.boxDone ? 'var(--garden-green)' : 'var(--paper)', borderColor: s.boxDone ? 'var(--garden-green-deep)' : 'var(--outline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 0 rgba(61,37,22,.2)', transition: 'all .3s ease', animation: s.boxDone ? 'by_pop .5s ease' : 'none', filter: s.boxDone ? 'drop-shadow(0 0 16px var(--garden-green))' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 40 : 58, color: s.boxDone ? '#fff' : 'var(--ink-muted)', lineHeight: 1 }}>{s.boxValue ?? '?'}</span>
            </div>
          </div>
        </div>
      </FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const opWord = (op: Op) => (op === '+' ? 'plus' : 'minus')
const sayFor = (op: Op, d: ASRound) => `${numberToWords(d.a)} ${opWord(op)} ${numberToWords(d.b)}. What is the answer?`

const empty: StageState = { boxValue: null, boxDone: false, showBox: false }
const ASPlay: React.FC<{ world: ASWorld; op: Op; data: ASRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, op, data, mode, onComplete }) => {
  const { a, b, answer } = data
  const choices = useMemo(() => buildArithChoices(answer, op, a, b), [answer, op, a, b])
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(56, Math.min(short ? 92 : 108, Math.round(Math.min(vw / 8.8, vh / (short ? 4.6 : 5.4)))))
  const [s, setS] = useState<StageState>(empty)
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    if (mode === 'guided') speak(sayFor(op, data))
    const t = window.setTimeout(() => { setAsking(true); set({ showBox: true }) }, 700)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === answer) {
      done.current = true
      const mid = afterTens(op, a, b)
      set({ boxValue: mid })
      window.setTimeout(() => { set({ boxValue: answer, boxDone: true }) }, 550)
      if (mode === 'guided') speak(`Yes! ${numberToWords(a)} ${opWord(op)} ${numberToWords(b)} is ${numberToWords(answer)}!`)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1600)
    } else {
      erred.current = true
      speak(`Not quite — ${op === '+' ? 'add' : 'take away'} the tens, then the ones. Try again!`)
      window.setTimeout(() => setPicked(null), 1100)
    }
  }

  return (
    <>
      <Stage world={world} data={data} op={op} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 52 : 74, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 560px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {a} {op === '+' ? '+' : '−'} {b} = ?
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

// ─── Demo (opening + 3-wrong re-teach): the tens, then the ones via ONE speakSteps ──────
const ASExplain: React.FC<{ world: ASWorld; op: Op; data: ASRound; onDone: () => void }> = ({ world, op, data, onDone }) => {
  const { a, b, answer } = data
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(empty)
  const set = (patch: Partial<StageState>) => setS(prev => ({ ...prev, ...patch }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const mid = afterTens(op, a, b)
    const lines = [
      `${numberToWords(a)} ${opWord(op)} ${numberToWords(b)}.`,
      `${op === '+' ? 'Add' : 'Take away'} the tens — that makes ${numberToWords(mid)}.`,
      `Then the ones — ${numberToWords(answer)}!`,
    ]
    const steps: Array<() => void> = [
      () => set({ showBox: true, boxValue: a }),
      () => set({ boxValue: mid }),
      () => set({ boxValue: answer, boxDone: true }),
    ]
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => { window.setTimeout(() => doneRef.current(), 1200) }, fallbackStepMs: 1250 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Stage world={world} data={data} op={op} s={s} short={short} />
      <div style={{ position: 'fixed', top: short ? 52 : 74, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 'min(88vw, 560px)', background: world.dark ? 'rgba(20,22,44,.82)' : 'rgba(255,255,255,.92)', border: `3px solid ${world.dark ? '#8fb4ff' : 'var(--outline)'}`, borderRadius: 18, padding: short ? '5px 14px' : '10px 18px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: world.dark ? '#fff' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)' }}>
          {op === '+' ? 'Add' : 'Subtract'} with Milo
        </div>
      </div>
    </>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
function makeBeat(op: Op, world: ASWorld): Beat<ASRound> {
  const skillId = op === '+' ? 'additionTo100' : 'subtractionTo100'
  return {
    skillId, rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeRound(op, (d || 1) as 1 | 2 | 3, round, world.bgs.length),
    sig: d => `${d.a}${op}${d.b}`,
    prompt: d => `${d.a} ${op === '+' ? '+' : '−'} ${d.b} = ?`,
    say: d => sayFor(op, d),
    Play: ({ data, onSubmit }) => <ASPlay world={world} op={op} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <ASExplain world={world} op={op} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const BY_CSS = `
@keyframes by_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes by_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function BlockYard({ op, world: forcedWorldId, onFinish, onExit }: {
  op: Op
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const WORLDS = worldsFor(op)
  const [world, setWorld] = useState<ASWorld | null>(() => (forcedWorldId ? WORLDS.find(w => w.id === forcedWorldId) ?? null : null))
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
  const beat = useMemo(() => (world ? makeBeat(op, world) : null), [op, world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title={op === '+' ? 'Where shall we add today?' : 'Where shall we subtract today?'} worlds={pickWorlds(op)}
          onPick={(id) => { const w = WORLDS.find(x => x.id === id); if (w) { setBg(0); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  const DEMO: ASRound[] = op === '+'
    ? [{ bg: 0, a: 23, b: 14, answer: 37 }, { bg: 1 % world.bgs.length, a: 34, b: 25, answer: 59 }]
    : [{ bg: 0, a: 38, b: 14, answer: 24 }, { bg: 1 % world.bgs.length, a: 46, b: 23, answer: 23 }]
  const GUIDED: ASRound = op === '+' ? { bg: 2 % world.bgs.length, a: 21, b: 5, answer: 26 } : { bg: 2 % world.bgs.length, a: 27, b: 6, answer: 21 }
  const bgIdx = phase === 'practice' ? bg : phase === 'guided' ? GUIDED.bg : DEMO[Math.min(demoIdx, DEMO.length - 1)].bg

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{BY_CSS}</style>
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
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s {op === '+' ? 'add' : 'subtract'}! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  (${demoIdx + 1}/${DEMO.length})`)}
        <ASExplain key={`demo${demoIdx}`} world={world} op={op} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the answer')}
        <ASPlay key="guided" world={world} op={op} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
