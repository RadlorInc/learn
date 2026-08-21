'use client'
/**
 * Chapter (6–8) — NUMBERS TO 100 (skill `numbersTo100`) as STORY MODE.
 *
 * Milo hears a number (word + spoken); the child taps the thing wearing that numeral
 * from three choices. The real skill is reading a two-digit number. The child PICKS one
 * of three worlds; in each the same skill is dressed differently and the scene rotates
 * across the 10 adaptive rounds (one continuous SkillBeat — harder on a streak, gentler
 * when struggling, re-teach after 3 wrong):
 *   🏘️ Number Street — deliver to the right house number   (house · shop · mailbox)
 *   🏫 Locker Room    — find the right numbered locker       (blue · green · red lockers)
 *   🚀 Space Station  — dock at the right numbered craft      (rocket · planet · satellite)
 *
 * BLEND: each numbered thing is BIG and rests on the scene's own ground with a soft contact
 * shadow (no floating band); the numeral rides a chip that floats ABOVE the object so it never
 * hides it. The demo + 3-wrong re-teach reuse the lesson's ReadNumber (build the number from
 * tens + ones, spoken by Milo). Difficulty widens the range via pickTarget: 10–20 → 20–60 →
 * 50–100. Reuses committed art (no new assets). Wrapped by game/Numbers100Chapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { numberToWords, CSS as KIT_CSS, BigCount, nounFor } from '../lessons/_kit'
import { TensOnes } from '../lessons/Numbers100Lesson'
import WorldSelect from './WorldSelect'
import { useViewport } from '@/shared/hooks/useViewport'
import { rint, shuffle } from '@/core/rand'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { SceneBg } from '@/shared/ui/SceneBg'

// ─── Scenes & Worlds ───────────────────────────────────────────────────────────────
type Scene =
  | 'house' | 'shop' | 'mailbox'          // Number Street
  | 'lockerA' | 'lockerB' | 'lockerC'     // Locker Room
  | 'rocket' | 'planet' | 'satellite'     // Space Station

interface SceneCfg {
  noun: string; item: string; itemImg: string
  hue?: number                            // recolor a reused sprite (lockers)
  bg: { grad: string; img: string }
}
const LOCKER_BG = { grad: 'linear-gradient(#efe6d6 0%, #f2ead9 55%, #e6d6b8 100%)', img: '/assets/backgrounds/locker_room.png' }
const SCENE: Record<Scene, SceneCfg> = {
  // Number Street — deliver to the right house number
  house:   { noun: 'house',   item: '🏠', itemImg: '/assets/objects/door_house.png',   bg: { grad: 'linear-gradient(#cfe6f7 0%, #dcecdb 60%, #cde3c5 100%)', img: '/assets/backgrounds/door_houses.jpeg' } },
  shop:    { noun: 'shop',    item: '🏪', itemImg: '/assets/objects/door_shop.png',    bg: { grad: 'linear-gradient(#f7e9cf 0%, #f3e6d6 60%, #e8d6b0 100%)', img: '/assets/backgrounds/door_shops.jpeg' } },
  mailbox: { noun: 'mailbox', item: '📫', itemImg: '/assets/objects/door_mailbox.png', bg: { grad: 'linear-gradient(#dfeaf5 0%, #e6ecdb 60%, #d2e2c8 100%)', img: '/assets/backgrounds/door_street.jpeg' } },
  // Locker Room — blue / green / red lockers on the AI locker-room background
  lockerA: { noun: 'locker', item: '🗄️', itemImg: '/assets/objects/locker_blue.png',  bg: LOCKER_BG },
  lockerB: { noun: 'locker', item: '🗄️', itemImg: '/assets/objects/locker_green.png', bg: LOCKER_BG },
  lockerC: { noun: 'locker', item: '🗄️', itemImg: '/assets/objects/locker_red.png',   bg: LOCKER_BG },
  // Space Station — dock at the right craft
  rocket:    { noun: 'rocket',    item: '🚀', itemImg: '/assets/objects/rocket.png',    bg: { grad: 'linear-gradient(#2a3a5e 0%, #20294c 55%, #161d3a 100%)', img: '/assets/backgrounds/space_launchpad.png' } },
  planet:    { noun: 'planet',    item: '🪐', itemImg: '/assets/objects/planet.png',    bg: { grad: 'linear-gradient(#222d52 0%, #192244 55%, #101732 100%)', img: '/assets/backgrounds/space_moon.png' } },
  satellite: { noun: 'satellite', item: '🛰️', itemImg: '/assets/objects/satellite.png', bg: { grad: 'linear-gradient(#243056 0%, #1b2548 55%, #131a36 100%)', img: '/assets/backgrounds/space_deepspace.png' } },
}

export interface NumWorld {
  id: string; label: string; emoji: string
  scenes: Scene[]
  milo: { src: string; emoji: string; accessory: string }
  dark?: boolean
  groundY?: string                        // vertical center of the object row (grounds them per scene)
  objSize?: string                        // per-world object size (some sprites are taller/narrower)
  intro: string
}
export const WORLDS: NumWorld[] = [
  { id: 'street', label: 'Number Street', emoji: '🏘️', scenes: ['house', 'shop', 'mailbox'],
    milo: { src: '/assets/characters/milo_postman.png', emoji: '🦊', accessory: '✉️' },
    intro: 'Milo is the postman today! Every house has a number. Listen for the number, then tap the one that matches so Milo can deliver. First, watch Milo read a number!' },
  { id: 'lockers', label: 'Locker Room', emoji: '🏫', scenes: ['lockerA', 'lockerB', 'lockerC'], groundY: '62%', objSize: 'clamp(120px, 31vw, 260px)',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🎒' },
    intro: 'Time for the locker room! Each locker has a number. Listen for the number Milo needs, then tap the matching locker. First, watch Milo read a number!' },
  { id: 'space', label: 'Space Station', emoji: '🚀', scenes: ['rocket', 'planet', 'satellite'],
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '🛸' }, dark: true,
    intro: 'Blast off to the space station! Each craft has a number. Listen for the number, then tap the one that matches. First, watch Milo read a number!' },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: SCENE[w.scenes[0]].bg.img, itemImage: SCENE[w.scenes[0]].itemImg }))

// Live viewport size — so a short/landscape frame can shrink + reposition the stage so the
// banner (top), the numbered objects, and Milo never collide.

interface NumRound { scene: Scene; target: number; choices: number[] }

// Range widens with difficulty: 1 → 10–20, 2 → 20–60, 3 → 50–100.
function pickTarget(d: 1 | 2 | 3): number {
  if (d === 1) return rint(10, 20)
  if (d === 2) return rint(20, 60)
  return rint(50, 100)
}
// 3 numeral choices: target + plausible distractors (near, ten-swap, digit-swap at higher d).
function buildChoices(target: number, d: 1 | 2 | 3): number[] {
  const opts = new Set<number>([target])
  const t = Math.floor(target / 10), o = target % 10
  const cands = [target + 1, target - 1, target + 10, target - 10]
  if (d >= 2 && target >= 10) { const sw = o * 10 + t; if (sw !== target) cands.unshift(sw) }
  for (const c of shuffle(cands)) { if (opts.size >= 3) break; if (c >= 1 && c <= 100 && c !== target) opts.add(c) }
  while (opts.size < 3) { const r = rint(1, 100); if (r !== target) opts.add(r) }
  return shuffle([...opts])
}

// ─── Background (crossfades between the world's scenes) ──────────────────────────────
function Background({ scene, scenes }: { scene: Scene; scenes: Scene[] }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#f3ead8' }}>
      {scenes.map(s => (
        <div key={s} style={{ position: 'absolute', inset: 0, opacity: s === scene ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: SCENE[s].bg.grad }} />
          <SceneBg src={SCENE[s].bg.img} priority={s === scene} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </div>
      ))}
    </div>
  )
}

function MiloHost({ left, milo }: { left: number; milo: NumWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(26vh, 220px)', height: 'min(26vh, 220px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'nt_float 3.4s ease-in-out infinite' }}>
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

// ─── A numbered thing: BIG themed sprite, numeral chip FLOATING ABOVE, contact shadow ───
// `short` compacts the chip so the whole numeral-over-object stack fits on a landscape phone.
function NumberedThing({ cfg, n, size, state, short, onClick }: {
  cfg: SceneCfg; n: number; size: string; state: 'idle' | 'right' | 'wrong' | 'dim'; short?: boolean; onClick: () => void
}) {
  const [missing, setMissing] = useState(false)
  const ring = state === 'right' ? 'var(--garden-green)' : state === 'wrong' ? 'var(--milo-orange)' : 'var(--outline)'
  const tint = cfg.hue ? `hue-rotate(${cfg.hue}deg) saturate(1.35)` : ''
  const glow = state === 'right' ? 'drop-shadow(0 0 18px var(--garden-green))' : 'drop-shadow(0 4px 6px rgba(0,0,0,.32))'
  const chipMin = short ? 'clamp(38px,7vmin,60px)' : 'clamp(52px,10vmin,86px)'
  const chipFont = short ? 'clamp(22px,4.4vmin,36px)' : 'clamp(30px,6vmin,52px)'
  return (
    // The nt_pop enter animation (fill:both) lives on the OUTER button so its final keyframe
    // transform can't clobber the state-based scale/lift — that transform lives on the INNER div.
    <button onClick={onClick} disabled={state === 'dim' || state === 'right'} style={{
      position: 'relative', background: 'transparent', border: 'none', padding: 0, cursor: state === 'dim' ? 'default' : 'pointer',
      animation: 'nt_pop .35s ease both',
    }}>
      <div style={{
        opacity: state === 'dim' ? 0.38 : 1, transform: state === 'right' ? 'scale(1.1) translateY(-6px)' : 'scale(1)',
        transition: 'transform .2s cubic-bezier(.34,1.56,.64,1), opacity .25s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4vh',
      }}>
        {/* numeral chip floating ABOVE the object (never hides it), with a little pointer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.28))' }}>
          <span style={{ minWidth: chipMin, padding: short ? '1px 9px' : '2px 12px', borderRadius: 16, background: 'var(--paper)',
            border: `4px solid ${ring}`, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: chipFont, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>{n}</span>
          <span aria-hidden style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `10px solid ${ring}`, marginTop: -1 }} />
        </div>
        {/* the object */}
        <div style={{ filter: `${glow} ${tint}`.trim() }}>
          {missing
            ? <span style={{ fontSize: size, lineHeight: 1 }}>{cfg.item}</span>
            : <img src={cfg.itemImg} alt="" draggable={false} decoding="async" loading="lazy" onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />}
        </div>
        {/* contact shadow so it sits on the ground */}
        <div aria-hidden style={{ width: `calc(${size} * 0.64)`, height: `calc(${size} * 0.15)`, marginTop: '-0.4vmin',
          background: 'radial-gradient(ellipse at center, rgba(30,22,14,.28) 0%, rgba(30,22,14,0) 72%)' }} />
      </div>
    </button>
  )
}

// ─── Interactive play surface (guided / practice) ───────────────────────────────────
type Mode = 'guided' | 'practice'
const NumberPlay: React.FC<{ world: NumWorld; data: NumRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { scene, target, choices } = data
  const cfg = SCENE[scene]
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  // On a short/landscape frame drive the object size off the (small) HEIGHT so chip + object +
  // shadow all fit below the banner and above Milo; also cap by width so 3 never overflow.
  // On tall frames keep the original design size untouched.
  const size = short
    ? `${Math.round(Math.max(64, Math.min(vh * 0.34, vw / 4.4)))}px`
    : (world.objSize ?? 'clamp(96px, 25vw, 210px)')
  // Pull the row up a touch on short frames so it sits clearly under the banner (which ends ≈92px)
  // and above Milo at the bottom.
  const rowTop = short ? '50%' : (world.groundY ?? '57%')
  const gap = short ? 'clamp(6px,2vw,20px)' : 'clamp(8px,3vw,44px)'

  useEffect(() => {
    if (mode === 'guided') speak(`Find number ${numberToWords(target)}. Tap the one that says ${target}.`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null) return
    if (n === target) {
      setPicked(n); done.current = true
      if (mode === 'guided') speak(`Yes! That is ${numberToWords(target)}!`)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1200)
    } else {
      erred.current = true; setWrongPick(n)
      speak(`That one is ${numberToWords(n)}. Listen again — find ${numberToWords(target)}!`)
      window.setTimeout(() => setWrongPick(null), 1100)
    }
  }

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: rowTop, transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 2vw' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap, maxWidth: '96vw' }}>
        {choices.map(n => (
          <NumberedThing key={n} cfg={cfg} n={n} size={size} short={short}
            state={picked === n ? 'right' : picked !== null ? 'dim' : wrongPick === n ? 'wrong' : 'idle'}
            onClick={() => choose(n)} />
        ))}
      </div>
    </div>
  )
}

// ─── Teaching demo (opening preview + 3-wrong re-teach): build the number from tens+ones ─
// SELF-PACED / timer-driven: the ten-rods then the ones pop in one-by-one on a fixed timer
// (NOT tied to speech word events), so the build-up always animates even when audio is
// blocked or the device has no TTS. Milo speaks alongside as a best-effort layer.
const NumberExplain: React.FC<{ world: NumWorld; data: NumRound; onDone: () => void }> = ({ world, data, onDone }) => {
  const { target } = data
  const t = Math.floor(target / 10), o = target % 10
  const [rt, setRt] = useState(0)          // ten-rods revealed
  const [ro, setRo] = useState(0)          // ones revealed
  const [big, setBig] = useState<number | null>(null)   // running count
  const [showNum, setShowNum] = useState(false)
  const doneRef = useLatestRef(onDone)
  const tensPart = t > 0 ? `${t} ${nounFor(t, 'tens')}` : ''
  const onesPart = o > 0 ? `${o} ${nounFor(o, 'ones')}` : ''
  useEffect(() => {
    // speakSteps drives BOTH the voice AND the matching visual reveal for each line:
    //  • audio working  → each reveal fires on that line's real speech `onstart`, so the
    //    ten-rods / ones pop in exactly as Milo says the number (no drift).
    //  • audio blocked   → a timer fallback paces the same reveals silently (no blank-then-jump).
    // Lines chain one-at-a-time (never cut), which is what the original ReadNumber relied on.
    const lines: string[] = []
    const steps: Array<() => void> = []
    // short opener so the first rod appears almost immediately
    lines.push('Watch me build it!'); steps.push(() => {})
    for (let k = 1; k <= t; k++) { const v = k; lines.push(numberToWords(v * 10)); steps.push(() => { setRt(v); setBig(v * 10) }) }
    for (let j = 1; j <= o; j++) { const v = j; lines.push(numberToWords(t * 10 + v)); steps.push(() => { setRo(v); setBig(t * 10 + v) }) }
    lines.push(`${[tensPart, onesPart].filter(Boolean).join(' and ')} make ${numberToWords(target)}. That is ${numberToWords(target)}!`)
    steps.push(() => { setShowNum(true); setBig(target) })
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
      <div style={{ background: 'var(--paper)', border: '4px solid var(--outline)', borderRadius: 24, padding: '20px 16px 26px', maxWidth: 460, width: '100%', boxShadow: '0 8px 0 rgba(61,37,22,.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <style>{KIT_CSS}</style>
        <div style={{ height: 64, display: 'flex', alignItems: 'center' }}>{big != null && <BigCount key={big} n={big} />}</div>
        <TensOnes n={target} revealTens={rt} revealOnes={ro} />
        <div style={{ height: 44, display: 'flex', alignItems: 'center' }}>
          {showNum && (
            <div style={{ background: 'var(--milo-orange)', color: '#fff', borderRadius: 50, padding: '8px 22px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, animation: 'k_flipIn 0.5s ease' }}>
              {tensPart}{tensPart && onesPart ? ' + ' : ''}{onesPart} = {target}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Value generation ──────────────────────────────────────────────────────────────
function makeRound(world: NumWorld, d: 1 | 2 | 3, round: number): NumRound {
  const scene = world.scenes[round % world.scenes.length]
  const target = pickTarget(d)
  return { scene, target, choices: buildChoices(target, d) }
}

export function makeNumBeat(world: NumWorld): Beat<NumRound> {
  return {
    skillId: 'numbersTo100', rounds: 10, walkEvery: 3,
    make: (d, round = 0) => makeRound(world, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.target}`,   // dedupe on the target number (not the rotating scene)
    prompt: d => `Find ${numberToWords(d.target)}!`,
    say: d => `Find number ${numberToWords(d.target)}. Tap the one that says ${d.target}.`,
    Play: ({ data, onSubmit }) => <NumberPlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <NumberExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const NT_CSS = `
@keyframes nt_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes nt_pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.12);opacity:1} 100%{transform:scale(1);opacity:1} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function NumberTown({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [world, setWorld] = useState<NumWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
  const [phase, setPhase] = useState<Phase>('intro')
  const [scene, setScene] = useState<Scene>('house')
  const [demoIdx, setDemoIdx] = useState(0)
  const { exit, tally } = useChapterShell(onFinish, onExit)

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => (world ? makeNumBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall we find numbers today?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setScene(w.scenes[0]); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  const DEMO_ROUNDS: NumRound[] = [
    { scene: world.scenes[0], target: 13, choices: buildChoices(13, 1) },
    { scene: world.scenes[1] ?? world.scenes[0], target: 24, choices: buildChoices(24, 2) },
  ]
  const GUIDED_ROUND: NumRound = { scene: world.scenes[2] ?? world.scenes[0], target: 16, choices: [12, 16, 20] }
  const bgScene: Scene = phase === 'practice' ? scene : phase === 'guided' ? GUIDED_ROUND.scene : phase === 'demo' ? DEMO_ROUNDS[demoIdx].scene : world.scenes[0]

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: short ? 44 : 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{NT_CSS}</style>
      <Background scene={bgScene} scenes={world.scenes} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '76%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {world.intro}
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo read the number  (${demoIdx + 1}/${DEMO_ROUNDS.length})`)}
        <NumberExplain key={`demo${demoIdx}`} world={world} data={DEMO_ROUNDS[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO_ROUNDS.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the matching number')}
        <NumberPlay key="guided" world={world} data={GUIDED_ROUND} mode="guided" onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (data?.scene) setScene(data.scene as Scene) }}
            onComplete={tally} />
        </div>
      )}

      <MiloHost left={10} milo={world.milo} />
    </div>
  )
}
