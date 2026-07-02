'use client'
/**
 * Chapter (6–8) — SKIP COUNTING (skill `skipCounting`) as STORY MODE.
 *
 * The concept is carried by the WORLD'S OWN OBJECTS, not abstract stones: each "hop" lands on a
 * GROUP that holds exactly `step` of that world's item (2, 5, or 10). So counting by 5s in the
 * Space Station = groups of 5 stars, and the running total rides above each group: 5 · 10 · 15…
 * One group's total is blank ("?") — the child taps the number that fills it, reading the skip
 * pattern (and, if they need to, counting the visible groups). Warm wrong-answers (gentle retry,
 * no red X). The child PICKS one of three worlds; the world's items SHUFFLE and the scene rotates
 * across the 10 adaptive rounds (one continuous SkillBeat — harder on a streak, gentler when
 * struggling, re-teach after 3 wrong):
 *   🐸 Lily Pond    — hop the pads, count the critters   (pond · farm_pond · lake)
 *   🐝 Bug Garden   — count the bugs in each patch        (meadow · garden · park)
 *   🐔 Farmyard     — count the animals in each pen        (barnyard · orchard · townpark)
 *
 * The demo + 3-wrong re-teach BUILD the sequence group by group — a group of `step` items pops in
 * as Milo hops, the running total climbs — narrated via ONE speakSteps (voice + visual synced when
 * audio plays, timer-paced when blocked). Difficulty widens the step set + can start past the
 * first multiple via makeSkipRound. Reuses committed sprites only. Wrapped by game/SkipCountingChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords, CSS as KIT_CSS, BigCount } from '../lessons/_kit'
import WorldSelect from './WorldSelect'
import { useViewport } from '@/lib/useViewport'

// ─── Scenes & Worlds ───────────────────────────────────────────────────────────────
type Scene =
  | 'pond' | 'farmpond' | 'lake'          // Lily Pond
  | 'meadow' | 'garden' | 'park'          // Bug Garden
  | 'barnyard' | 'orchard' | 'townpark'   // Farmyard

interface SceneCfg { bg: { grad: string; img: string } }
const SCENE: Record<Scene, SceneCfg> = {
  // Lily Pond
  pond:     { bg: { grad: 'linear-gradient(#cfe9f2 0%, #cfe6e0 60%, #bfdfd6 100%)', img: '/assets/backgrounds/pond.jpeg' } },
  farmpond: { bg: { grad: 'linear-gradient(#d3eaf3 0%, #d1e7e1 60%, #c0ded4 100%)', img: '/assets/backgrounds/farm_pond.png' } },
  lake:     { bg: { grad: 'linear-gradient(#cfe7f4 0%, #cfe4e9 60%, #bcd8dd 100%)', img: '/assets/backgrounds/lake.jpeg' } },
  // Bug Garden
  meadow: { bg: { grad: 'linear-gradient(#cfe6f7 0%, #dcecdb 60%, #c6e0b6 100%)', img: '/assets/backgrounds/garden_meadow.png' } },
  garden: { bg: { grad: 'linear-gradient(#d3e9f6 0%, #dfeedb 60%, #c8e2b8 100%)', img: '/assets/backgrounds/garden.png' } },
  park:   { bg: { grad: 'linear-gradient(#cfe8f5 0%, #dcecda 60%, #c4dfb4 100%)', img: '/assets/backgrounds/garden_park.png' } },
  // Farmyard
  barnyard: { bg: { grad: 'linear-gradient(#dcecd6 0%, #e6eccf 60%, #d0e2b8 100%)', img: '/assets/backgrounds/farm_barnyard.png' } },
  orchard:  { bg: { grad: 'linear-gradient(#dff0c8 0%, #eaf7d6 55%, #cfe9a8 100%)', img: '/assets/backgrounds/farm_orchard.png' } },
  townpark: { bg: { grad: 'linear-gradient(#cfe8f5 0%, #dcecda 60%, #c4dfb4 100%)', img: '/assets/backgrounds/town_park.jpeg' } },
}

// Each item is one of the world's OWN objects; a group holds `step` of them.
interface Item { src: string; emoji: string; one: string; many: string }
const IT = {
  frog:      { src: '/assets/objects/frog.png',      emoji: '🐸', one: 'frog',      many: 'frogs' },
  fish:      { src: '/assets/objects/fish.png',      emoji: '🐟', one: 'fish',      many: 'fish' },
  duckling:  { src: '/assets/objects/duckling.png',  emoji: '🐥', one: 'duckling',  many: 'ducklings' },
  turtle:    { src: '/assets/objects/turtle.png',    emoji: '🐢', one: 'turtle',    many: 'turtles' },
  bee:       { src: '/assets/objects/bee.png',       emoji: '🐝', one: 'bee',       many: 'bees' },
  butterfly: { src: '/assets/objects/butterfly.png', emoji: '🦋', one: 'butterfly', many: 'butterflies' },
  ant:       { src: '/assets/objects/ant.png',       emoji: '🐜', one: 'ant',       many: 'ants' },
  snail:     { src: '/assets/objects/snail.png',     emoji: '🐌', one: 'snail',     many: 'snails' },
  dragonfly: { src: '/assets/objects/dragonfly.png', emoji: '🪰', one: 'dragonfly', many: 'dragonflies' },
  chick:     { src: '/assets/objects/chick.png',     emoji: '🐤', one: 'chick',     many: 'chicks' },
  lamb:      { src: '/assets/objects/lamb.png',      emoji: '🐑', one: 'lamb',      many: 'lambs' },
  bunny:     { src: '/assets/objects/bunny.png',     emoji: '🐰', one: 'bunny',     many: 'bunnies' },
} satisfies Record<string, Item>

interface HopWorld {
  id: string; label: string; emoji: string
  scenes: Scene[]
  items: Item[]                       // the world's objects — shuffled across rounds
  dark?: boolean                      // dark scene → light chips/text
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
const WORLDS: HopWorld[] = [
  { id: 'pond', label: 'Lily Pond', emoji: '🐸', scenes: ['pond', 'farmpond', 'lake'],
    items: [IT.frog, IT.fish, IT.duckling, IT.turtle],
    milo: { src: '/assets/characters/milo_boat.png', emoji: '🦊', accessory: '🪷' },
    intro: 'Milo hops from pad to pad across the pond! Each pad holds a little group of critters. Count the groups to see how many altogether — one number is missing, so tap the one that fits. First, watch Milo count the hops!' },
  { id: 'garden', label: 'Bug Garden', emoji: '🐝', scenes: ['meadow', 'garden', 'park'],
    items: [IT.bee, IT.butterfly, IT.ant, IT.snail, IT.dragonfly],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌼' },
    intro: 'Welcome to the Bug Garden! The bugs gather in equal little groups. Count the groups to find the total — one number is missing, so tap the one that fits. First, watch Milo count the hops!' },
  { id: 'farm', label: 'Farmyard', emoji: '🐔', scenes: ['barnyard', 'orchard', 'townpark'],
    items: [IT.chick, IT.duckling, IT.lamb, IT.bunny],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🌾' },
    intro: 'Welcome to the Farmyard! The animals gather in equal little groups. Count the groups to find the total — one number is missing, so tap the one that fits. First, watch Milo count the hops!' },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: SCENE[w.scenes[0]].bg.img, itemImage: w.items[0].src }))

// Live viewport size — so a short/landscape frame can shrink the group row + answer buttons and
// reposition them so the banner, groups, ground band and buttons never overlap.

interface HopRound {
  scene: Scene; item: Item; step: number; terms: number
  seq: number[]; blankIndex: number; answer: number; choices: number[]; isNext: boolean
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const coin = () => Math.random() < 0.5
function shuffle<T>(a: T[]): T[] {
  const arr = a.slice()
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr
}
// Three choices: the answer plus nearby multiples of `step`.
function skipChoices(answer: number, step: number): number[] {
  const set = new Set<number>([answer])
  let k = 1
  while (set.size < 3) {
    if (answer - k * step > 0) set.add(answer - k * step)
    if (set.size < 3) set.add(answer + k * step)
    k++
  }
  return shuffle([...set])
}

// Round generator. Difficulty widens the step set, the starting point, and where the gap
// sits — so the practice keeps offering fresh questions instead of the same 2·4·6·? every time.
function makeSkipRound(scene: Scene, item: Item, d: 1 | 2 | 3): HopRound {
  const step = [2, 5, 10][rint(0, 2)]
  const terms = d === 1 ? 4 : d === 2 ? 4 : 5
  // Start past the first multiple so the sequence varies (e.g. 6·8·10·? not always 2·4·6·8).
  const startMult = d === 1 ? rint(1, 2) : d === 2 ? rint(1, 4) : rint(1, 6)
  const seq = Array.from({ length: terms }, (_, k) => (startMult + k) * step)
  const isNext = d === 1 ? true : coin()
  const blankIndex = isNext ? terms - 1 : rint(1, terms - 2)
  const answer = seq[blankIndex]
  return { scene, item, step, terms, seq, blankIndex, answer, choices: skipChoices(answer, step), isNext }
}

function makeRound(world: HopWorld, d: 1 | 2 | 3, round: number): HopRound {
  const scene = world.scenes[round % world.scenes.length]
  const item = world.items[round % world.items.length]     // shuffle the world's objects across rounds
  return makeSkipRound(scene, item, d)
}

// ─── Background (crossfades between the world's scenes) ──────────────────────────────
function Background({ scene, scenes }: { scene: Scene; scenes: Scene[] }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#dcecdb' }}>
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

function MiloHost({ left, milo }: { left: number; milo: HopWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'ha_hop 3s ease-in-out infinite' }}>
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
  if (missing) return <span style={{ fontSize: size, lineHeight: 1 }}>{item.emoji}</span>
  return <img src={item.src} alt="" draggable={false} onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
}

// Item size adapts to how crowded the row is (step × groups), so small counts read BIG.
// `compact` (short/landscape) drops the MIN-floors so the whole row shrinks and clears the
// banner, ground band and answer buttons.
function itemPxFor(step: number, terms: number, compact?: boolean): string {
  const density = step * terms
  if (compact) {
    if (density <= 12) return 'clamp(20px,4vmin,40px)'
    if (density <= 24) return 'clamp(16px,3.2vmin,30px)'
    if (density <= 40) return 'clamp(13px,2.5vmin,24px)'
    return 'clamp(11px,2vmin,19px)'
  }
  if (density <= 12) return 'clamp(34px,6.4vmin,56px)'
  if (density <= 24) return 'clamp(26px,4.8vmin,42px)'
  if (density <= 40) return 'clamp(19px,3.6vmin,31px)'
  return 'clamp(15px,2.8vmin,24px)'
}

// A GROUP = a framed cluster of `step` of the world's item, with the running total riding above.
function Group({ item, step, lit, label, blank, dark, itemPx, compact }: {
  item: Item; step: number; lit: boolean; label: string; blank: boolean; dark?: boolean; itemPx: string; compact?: boolean
}) {
  const cols = step <= 2 ? 2 : 5
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 3 : 6, animation: 'ha_pop .35s ease both' }}>
      {/* running-total chip (blank one shows ?) */}
      <span style={{
        minWidth: compact ? 'clamp(28px,5vmin,48px)' : 'clamp(38px,7vmin,60px)', padding: compact ? '1px 7px' : '2px 10px', borderRadius: 14,
        background: blank ? 'var(--sun-yellow)' : dark ? 'rgba(20,22,44,.72)' : 'var(--paper)',
        border: `4px solid ${blank ? 'var(--sun-yellow-deep)' : dark ? '#8fb4ff' : 'var(--outline)'}`,
        boxShadow: '0 3px 0 rgba(20,14,8,.25)',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: compact ? 'clamp(16px,3.2vmin,28px)' : 'clamp(22px,4.4vmin,38px)',
        color: blank ? 'var(--ink)' : dark ? '#fff' : 'var(--ink)', textAlign: 'center', lineHeight: 1.15, minHeight: '1.2em',
      }}>{label}</span>
      {/* the cluster of step items */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: 'clamp(2px,0.7vmin,5px)',
        padding: 'clamp(4px,1vmin,8px)', borderRadius: 14,
        border: `3px solid ${dark ? 'rgba(143,180,255,.55)' : 'var(--sky-blue-deep)'}`,
        background: dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.5)',
        opacity: lit ? 1 : 0.16, transform: lit ? 'scale(1)' : 'scale(.86)',
        transition: 'all .3s cubic-bezier(.34,1.56,.64,1)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.22))',
      }}>
        {Array.from({ length: step }).map((_, i) => <ItemImg key={i} item={item} size={itemPx} />)}
      </div>
    </div>
  )
}

// The row of groups. `reveal` groups are lit (practice = all lit); the blank total shows '?'.
function GroupRow({ item, step, terms, seq, blankIndex, reveal, showBlankValue, dark, compact }: {
  item: Item; step: number; terms: number; seq: number[]
  blankIndex: number; reveal: number; showBlankValue: boolean; dark?: boolean; compact?: boolean
}) {
  const itemPx = itemPxFor(step, terms, compact)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: compact ? 'clamp(4px,1.2vw,16px)' : 'clamp(6px,1.8vw,24px)', flexWrap: 'wrap', maxWidth: '96vw' }}>
      {seq.map((v, i) => {
        const isBlank = i === blankIndex
        const lit = i < reveal
        const label = isBlank
          ? (showBlankValue ? String(v) : '?')
          : (lit ? String(v) : '')
        return <Group key={i} item={item} step={step} lit={lit} label={label} blank={isBlank && !showBlankValue} dark={dark} itemPx={itemPx} compact={compact} />
      })}
    </div>
  )
}

// ─── Interactive play surface (guided / practice) ───────────────────────────────────
type Mode = 'guided' | 'practice'
const HopPlay: React.FC<{ world: HopWorld; data: HopRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { item, step, terms, seq, blankIndex, answer, choices, isNext } = data
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const question = isNext ? 'What comes next?' : 'What number is missing?'
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  // Responsive answer buttons — shrink on a narrow OR short screen so they fit and leave room
  // for the group row + ground band above. On tall frames keep the original size.
  const btn = short ? Math.max(56, Math.min(104, Math.round(Math.min(vw / 8.8, vh / 5.2)))) : null
  const btnStyle: React.CSSProperties = btn != null
    ? { width: btn, height: btn, borderRadius: Math.round(btn * 0.24), fontSize: Math.round(btn * 0.44) }
    : { width: 'clamp(74px,14vmin,104px)', height: 'clamp(74px,14vmin,104px)', borderRadius: 24, fontSize: 'clamp(30px,6vmin,44px)' }
  // Milo sits far-left, so the centred group-row + ground band + buttons are horizontally clear of
  // him and can drop LOWER — centring in the band below the banner keeps the group row off it.
  const stackTop = short ? '55%' : '44%'
  const stackGap = short ? '1vh' : '2vh'
  const choiceGap = short ? 'clamp(8px,2.5vw,18px)' : 'clamp(10px,3vw,26px)'

  useEffect(() => {
    if (mode === 'guided') speak(`Count by ${step}s. ${question} Tap the number that fills the gap.`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null) return
    if (n === answer) {
      setPicked(n); done.current = true
      if (mode === 'guided') speak(`Yes! ${numberToWords(answer)}!`)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1200)
    } else {
      erred.current = true; setWrongPick(n)
      speak(`Not quite. Count by ${step}s — try again!`)
      window.setTimeout(() => setWrongPick(null), 1100)
    }
  }

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: stackTop, transform: 'translateY(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: stackGap, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        <GroupRow item={item} step={step} terms={terms} seq={seq} blankIndex={blankIndex}
          reveal={terms} showBlankValue={picked != null} dark={world.dark} compact={short} />
      </div>
      {/* ground band */}
      <div style={{ width: 'min(86vw, 760px)', height: short ? '1.2vh' : '2vh', minHeight: short ? 7 : 12, background: world.dark ? 'linear-gradient(#3a3766,#26243f)' : 'linear-gradient(#caa46a,#a07a44)', borderRadius: 6, boxShadow: '0 5px 9px rgba(0,0,0,.28)' }} />
      {/* choices on the ground */}
      <div style={{ display: 'flex', gap: choiceGap, justifyContent: 'center', flexWrap: 'wrap', pointerEvents: 'auto' }}>
        {choices.map(n => {
          const isRight = picked === n, isWrong = wrongPick === n
          // ha_pop enter (fill:both) on the OUTER button; the state scale/lift on the INNER span so
          // the animation's final keyframe transform can't clobber the selected lift.
          return (
            <button key={n} onClick={() => choose(n)} disabled={picked !== null} style={{
              ...btnStyle,
              background: isRight ? 'var(--garden-green-soft)' : isWrong ? 'var(--milo-orange-soft)' : 'var(--paper)',
              border: `4px solid ${isRight ? 'var(--garden-green)' : isWrong ? 'var(--milo-orange)' : 'var(--outline)'}`,
              boxShadow: isRight ? '0 6px 0 var(--garden-green-deep)' : isWrong ? '0 6px 0 var(--milo-orange-deep)' : '0 6px 0 #c8ac79',
              fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--ink)',
              padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: picked !== null ? 'default' : 'pointer',
              opacity: picked !== null && !isRight ? 0.5 : 1,
              animation: 'ha_pop .35s ease both',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%',
                transform: isRight ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
                transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1)' }}>{n}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach): build the sequence group by group ─
// ONE speakSteps drives BOTH the voice AND each reveal — a group of `step` items pops in as Milo
// hops, the running total climbs "five, ten, fifteen…"; synced to the voice, timer-paced when blocked.
const HopExplain: React.FC<{ world: HopWorld; item: Item; step: number; terms: number; onDone: () => void }> = ({ world, item, step, terms, onDone }) => {
  const seq = Array.from({ length: terms }, (_, k) => (k + 1) * step)
  const [reveal, setReveal] = useState(0)
  const [big, setBig] = useState<number | null>(null)
  const [showChip, setShowChip] = useState(false)
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines: string[] = []
    const steps: Array<() => void> = []
    lines.push(`Watch me count by ${step}s! Each hop lands on a group of ${step}.`); steps.push(() => { setReveal(0); setBig(null); setShowChip(false) })
    for (let k = 1; k <= terms; k++) { const v = k; lines.push(numberToWords(v * step)); steps.push(() => { setReveal(v); setBig(v * step) }) }
    lines.push(`${numberToWords(terms)} groups of ${numberToWords(step)} — we counted to ${numberToWords(terms * step)}!`)
    steps.push(() => { setShowChip(true); setBig(terms * step) })
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
      <div style={{ background: 'var(--paper)', border: '4px solid var(--outline)', borderRadius: 24, padding: '18px 16px 22px', maxWidth: 540, width: '100%', boxShadow: '0 8px 0 rgba(61,37,22,.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <style>{KIT_CSS}</style>
        <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>{big != null && <BigCount key={big} n={big} />}</div>
        <GroupRow item={item} step={step} terms={terms} seq={seq} blankIndex={-1} reveal={reveal} showBlankValue={false} />
        <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
          {showChip && (
            <div style={{ background: 'var(--milo-orange)', color: '#fff', borderRadius: 50, padding: '7px 20px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 17, animation: 'k_flipIn 0.5s ease' }}>
              {terms} groups of {step} = {terms * step}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeHopBeat(world: HopWorld): Beat<HopRound> {
  return {
    skillId: 'skipCounting', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeRound(world, (d || 1) as 1 | 2 | 3, round),
    // Dedupe on the MATH only (step + sequence + gap position) — not the rotating scene,
    // shuffled item, or choice order — so a question isn't re-asked with new dressing.
    sig: d => `${d.step}|${d.seq.join(',')}|${d.blankIndex}`,
    prompt: d => (d.isNext ? `Count by ${d.step}s — what comes next?` : `Count by ${d.step}s — what is missing?`),
    say: d => `Count by ${d.step}s. ${d.isNext ? 'What comes next?' : 'What number is missing?'} Tap the number that fills the gap.`,
    Play: ({ data, onSubmit }) => <HopPlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <HopExplain world={world} item={data.item} step={data.step} terms={data.terms} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const HA_CSS = `
@keyframes ha_hop { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-14px)} 55%{transform:translateY(-14px)} }
@keyframes ha_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.12);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function HopAlong({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const { h: vh } = useViewport()
  const short = vh < 470
  const [world, setWorld] = useState<HopWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
  const [phase, setPhase] = useState<Phase>('intro')
  const [scene, setScene] = useState<Scene>('pond')
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
  const beat = useMemo(() => (world ? makeHopBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall Milo hop today?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setScene(w.scenes[0]); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  // Demo counts by two step sizes; guided uses a fixed easy round.
  const DEMO: Array<{ step: number; terms: number }> = [{ step: 2, terms: 4 }, { step: 10, terms: 4 }]
  const demoItem = world.items[demoIdx % world.items.length]
  const guidedItem = world.items[2 % world.items.length]
  const GUIDED: HopRound = {
    scene: world.scenes[2] ?? world.scenes[0], item: guidedItem, step: 5, terms: 4,
    seq: [5, 10, 15, 20], blankIndex: 3, answer: 20, choices: [10, 15, 20], isNext: true,
  }
  const bgScene: Scene = phase === 'practice' ? scene : phase === 'guided' ? GUIDED.scene : world.scenes[Math.min(demoIdx, world.scenes.length - 1)]

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: short ? 44 : 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{HA_CSS}</style>
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
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s hop! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo count by ${DEMO[demoIdx].step}s  (${demoIdx + 1}/${DEMO.length})`)}
        <HopExplain key={`demo${demoIdx}`} world={world} item={demoItem} step={DEMO[demoIdx].step} terms={DEMO[demoIdx].terms}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the missing number')}
        <HopPlay key="guided" world={world} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
