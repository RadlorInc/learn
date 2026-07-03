'use client'
/**
 * Chapter (6–8) — SHAPES 2D & 3D (skill `shapes2d3d`) as STORY MODE.
 *
 * The shapes ARE the objects. 2D shapes must be geometrically exact, so they stay code-drawn SVG
 * (reusing the lesson's ShapeView); 3D solids are real generated sprites (cube/sphere/cone/cylinder).
 * Two question types: NAME ("tap the triangle" among shapes) and SIDES ("how many sides?"). The
 * child PICKS one of three worlds and the scene rotates across the 10 adaptive rounds (one continuous
 * SkillBeat — harder on a streak, gentler when struggling, re-teach after 3 wrong):
 *   🎨 Art Studio · 🏗️ Build Site · 🧸 Playroom
 *
 * Difficulty: L1 basic 2D names → L2 + more 2D + first solids → L3 all shapes + side-counting. The
 * demo + 3-wrong re-teach name a shape and reveal its sides / "solid shape" via ONE speakSteps.
 * Reuses ShapeView + SHAPES/sidesOf helpers; the 4 solid sprites are new AI art. Wrapped by
 * game/Shapes2D3DChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { ShapeView, SHAPES_2D, SHAPES_3D, sidesOf, is3D, buildNameChoices } from '../lessons/Shapes2D3DLesson'
import WorldSelect from './WorldSelect'
import FitBox from './FitBox'
import { useViewport } from '@/shared/hooks/useViewport'


// ─── Worlds ──────────────────────────────────────────────────────────────────────────
interface Bg { grad: string; img: string }
interface ShWorld { id: string; label: string; emoji: string; bgs: Bg[]; milo: { src: string; emoji: string; accessory: string }; intro: string }
const G = (grad: string, img: string): Bg => ({ grad, img: `/assets/backgrounds/${img}` })
const WORLDS: ShWorld[] = [
  { id: 'studio', label: 'Art Studio', emoji: '🎨',
    bgs: [G('linear-gradient(#f3dff7,#e0d4ee)', 'rainbow_market.jpeg'), G('linear-gradient(#e8e0ee,#d8d2e6)', 'craft_gems.png'), G('linear-gradient(#f0e4dc,#e4d2c4)', 'craft_buttons.png')],
    milo: { src: '/assets/characters/milo_painter.png', emoji: '🦊', accessory: '🎨' },
    intro: 'Welcome to the Art Studio! Milo draws shapes. Listen for the shape, then tap it. First, watch Milo!' },
  { id: 'build', label: 'Build Site', emoji: '🏗️',
    bgs: [G('linear-gradient(#dfe7f2,#d4d0c4)', 'town_street.jpeg'), G('linear-gradient(#e4e8ee,#d8ccb0)', 'door_shops.jpeg'), G('linear-gradient(#eae4d6,#d8ccb0)', 'order_yard.png')],
    milo: { src: '/assets/characters/milo_idle.png', emoji: '🦊', accessory: '🏗️' },
    intro: 'On the Build Site, Milo builds with shapes. Listen for the shape, then tap it. First, watch Milo!' },
  { id: 'playroom', label: 'Playroom', emoji: '🧸',
    bgs: [G('linear-gradient(#e6eefc,#c8d6f0)', 'toy_blocks.png'), G('linear-gradient(#fdeede,#f6e0c8)', 'toy_ducks.png'), G('linear-gradient(#f2e0ec,#ecd2d4)', 'candy_counter.png')],
    milo: { src: '/assets/characters/milo_idle.png', emoji: '🦊', accessory: '🧸' },
    intro: 'In the Playroom, Milo plays with shape blocks. Listen for the shape, then tap it. First, watch Milo!' },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.bgs[0].img }))

const EMOJI_3D: Record<string, string> = { cube: '🧊', sphere: '⚽', cone: '🍦', cylinder: '🥫' }
type Mode2 = 'name' | 'sides'
interface ShRound { bg: number; mode: Mode2; target: string; options?: string[]; answer?: number; choices?: number[] }

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
const POOL1 = ['circle', 'triangle', 'square', 'rectangle']
const POOL2 = [...POOL1, 'pentagon', 'hexagon', 'cube', 'sphere']
const POOL3 = [...SHAPES_2D, ...SHAPES_3D]
const SIDED = ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon']

function sideChoices(ans: number): number[] {
  const set = new Set<number>([ans])
  for (const c of [ans - 1, ans + 1, ans + 2, ans - 2]) { if (set.size >= 3) break; if (c >= 3) set.add(c) }
  while (set.size < 3) set.add(ans + set.size)
  return [...set].sort(() => Math.random() - 0.5)
}
function makeShapeRound(d: 1 | 2 | 3, round: number, bgCount: number): ShRound {
  const bg = round % bgCount
  if (d === 3 && Math.random() < 0.45) {
    const target = pick(SIDED); const answer = sidesOf(target) ?? 3
    return { bg, mode: 'sides', target, answer, choices: sideChoices(answer) }
  }
  const pool = d === 1 ? POOL1 : d === 2 ? POOL2 : POOL3
  const target = pick(pool)
  return { bg, mode: 'name', target, options: buildNameChoices(target, pool) }
}

// ─── Background ───────────────────────────────────────────────────────────────────────
function Background({ bg, world }: { bg: number; world: ShWorld }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#efe6d8' }}>
      {world.bgs.map((b, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === bg ? 1 : 0, transition: 'opacity .6s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: b.grad }} />
          <img src={b.img} alt="" draggable={false} decoding="async" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

function MiloHost({ left, milo }: { left: number; milo: ShWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: `${left}%`, bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: 'min(24vh, 200px)', height: 'min(24vh, 200px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'ss_float 3.4s ease-in-out infinite' }}>
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

// A shape: 2D via the exact SVG ShapeView, 3D via a real solid sprite (emoji fallback).
function Shape({ name, size }: { name: string; size: number }) {
  const [missing, setMissing] = useState(false)
  if (is3D(name)) {
    if (missing) return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{EMOJI_3D[name]}</span>
    return <img src={`/assets/objects/solid_${name}.png`} alt="" draggable={false} decoding="async" loading="lazy" onError={() => setMissing(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.25))' }} />
  }
  return <ShapeView name={name} size={size} />
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const sayFor = (d: ShRound) => d.mode === 'sides' ? `How many sides does this ${d.target} have?` : `Find the ${d.target}. Tap it!`

const ShapePlay: React.FC<{ world: ShWorld; data: ShRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ world, data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const [pickedName, setPickedName] = useState<string | null>(null)
  const [pickedNum, setPickedNum] = useState<number | null>(null)
  const [glow, setGlow] = useState(false)
  const erred = useRef(false), done = useRef(false)

  useEffect(() => { if (mode === 'guided') speak(sayFor(data)); }, []) // eslint-disable-line

  function finishOk() {
    done.current = true; setGlow(true)
    if (mode === 'guided') speak(data.mode === 'sides' ? `Yes! ${data.answer} sides!` : `Yes! A ${data.target}!`)
    window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1300)
  }
  function wrong(reset: () => void) { erred.current = true; speak('Not quite — try again!'); window.setTimeout(reset, 900) }

  if (data.mode === 'sides') {
    const btn = Math.max(56, Math.min(short ? 90 : 104, Math.round(Math.min(vw / 7, vh / (short ? 4.6 : 5.4)))))
    return (
      <>
        {Prompt('How many sides?', world, short)}
        <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '42%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw', filter: glow ? 'drop-shadow(0 0 16px var(--sun-yellow))' : 'none', transition: 'filter .3s' }}>
          <FitBox availW={vw * 0.9} availH={short ? vh * 0.34 : vh * 0.46} max={2.6}>
            <Shape name={data.target} size={200} />
          </FitBox>
        </div>
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '4%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(14px,4vw,28px)', flexWrap: 'wrap', padding: '0 12px' }}>
          {data.choices!.map(n => {
            const isPick = pickedNum === n, isOk = n === data.answer
            return (
              <button key={n} disabled={done.current} onClick={() => { if (done.current || pickedNum !== null) return; setPickedNum(n); if (n === data.answer) finishOk(); else wrong(() => setPickedNum(null)) }}
                style={{ width: btn, height: btn, borderRadius: Math.round(btn * 0.22), background: (isPick && isOk) ? 'var(--garden-green-soft)' : 'var(--paper)', border: `4px solid ${(isPick && isOk) ? 'var(--garden-green)' : isPick ? 'var(--ink-muted)' : 'var(--outline)'}`, boxShadow: `0 6px 0 ${(isPick && isOk) ? 'var(--garden-green-deep)' : '#c8ac79'}`, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(btn * 0.44), color: 'var(--ink)', cursor: done.current ? 'default' : 'pointer', transform: (isPick && isOk) ? 'scale(1.08) translateY(-3px)' : 'scale(1)', transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), background 160ms ease' }}>{n}</button>
            )
          })}
        </div>
      </>
    )
  }

  // name mode — tap the matching shape among the options. Tiles render at a natural size in a single
  // row, then FitBox scales the whole row to fit the band (shrinks at 360px, grows on big screens).
  const opts = data.options!
  return (
    <>
      {Prompt(`Tap the ${data.target}!`, world, short)}
      <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '48%' : '50%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
        <FitBox availW={vw * 0.92} availH={short ? vh * 0.42 : vh * 0.52} max={1.8}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
            {opts.map(name => {
              const isPick = pickedName === name, isOk = name === data.target, showOk = (isPick && isOk) || (glow && isOk)
              return (
                <button key={name} disabled={done.current} onClick={() => { if (done.current || pickedName !== null) return; setPickedName(name); if (name === data.target) finishOk(); else wrong(() => setPickedName(null)) }}
                  aria-label={name} style={{ background: showOk ? 'var(--garden-green-soft)' : 'rgba(255,255,255,.72)', border: `4px solid ${showOk ? 'var(--garden-green)' : isPick ? 'var(--ink-muted)' : 'var(--outline)'}`, borderRadius: 22, padding: 16, boxShadow: `0 6px 0 ${showOk ? 'var(--garden-green-deep)' : '#c8ac79'}`, cursor: done.current ? 'default' : 'pointer', transform: showOk ? 'scale(1.06) translateY(-3px)' : 'scale(1)', transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), background 160ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shape name={name} size={150} />
                </button>
              )
            })}
          </div>
        </FitBox>
      </div>
    </>
  )
}

function Prompt(text: string, world: ShWorld, short?: boolean) {
  return (
    <div style={{ position: 'fixed', top: short ? 52 : 76, left: 0, right: 0, zIndex: 32, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ maxWidth: 'min(88vw, 560px)', background: 'rgba(255,255,255,.92)', border: '3px solid var(--outline)', borderRadius: 18, padding: short ? '5px 14px' : '10px 18px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: short ? 'clamp(12px,3.4vh,15px)' : 'clamp(15px,2.2vh,19px)', color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.14)', textTransform: 'capitalize' }}>{text}</div>
    </div>
  )
}

// ─── Demo / re-teach: name a shape + reveal its sides / "solid shape" via ONE speakSteps ─
const ShapeExplain: React.FC<{ world: ShWorld; data: ShRound; onDone: () => void }> = ({ world, data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const [label, setLabel] = useState(false)
  const doneRef = useRef(onDone); doneRef.current = onDone
  const solid = is3D(data.target)
  const s = solid ? null : sidesOf(data.target)
  useEffect(() => {
    const lines = [
      `This is a ${data.target}.`,
      solid ? `A ${data.target} is a solid shape you can hold.` : `A ${data.target} has ${s} sides.`,
    ]
    const cancel = speakSteps(lines, { onStep: (i) => { if (i === 1) setLabel(true) }, onDone: () => { window.setTimeout(() => doneRef.current(), 1200) }, fallbackStepMs: 1500 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      {Prompt('Watch Milo', world, short)}
      <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '46%' : '44%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
        <FitBox availW={vw * 0.9} availH={short ? vh * 0.4 : vh * 0.5} max={2.4}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Shape name={data.target} size={200} />
            <div style={{ opacity: label ? 1 : 0, transform: label ? 'scale(1)' : 'scale(.7)', transition: 'all .35s cubic-bezier(.34,1.56,.64,1)', background: 'var(--milo-orange)', color: '#fff', borderRadius: 999, padding: '8px 26px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {data.target}{!solid && s ? ` · ${s} sides` : ' · solid'}
            </div>
          </div>
        </FitBox>
      </div>
    </>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
function makeShapeBeat(world: ShWorld): Beat<ShRound> {
  return {
    skillId: 'shapes2d3d', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeShapeRound((d || 1) as 1 | 2 | 3, round, world.bgs.length),
    sig: d => `${d.mode}:${d.target}`,
    prompt: d => d.mode === 'sides' ? 'How many sides?' : `Tap the ${d.target}`,
    say: d => sayFor(d),
    Play: ({ data, onSubmit }) => <ShapePlay world={world} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <ShapeExplain world={world} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
const SS_CSS = `@keyframes ss_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function ShapeStudio({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [world, setWorld] = useState<ShWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
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
  const beat = useMemo(() => (world ? makeShapeBeat(world) : null), [world])

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="Where shall we explore shapes?" worlds={PICK_WORLDS}
          onPick={(id) => { const w = worldById(id); if (w) { setBg(0); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  const DEMO: ShRound[] = [
    { bg: 0, mode: 'name', target: 'triangle', options: [] },
    { bg: 1 % world.bgs.length, mode: 'name', target: 'cube', options: [] },
  ]
  const GUIDED: ShRound = { bg: 2 % world.bgs.length, mode: 'name', target: 'square', options: buildNameChoices('square', POOL1) }
  const bgIdx = phase === 'practice' ? bg : phase === 'guided' ? GUIDED.bg : DEMO[Math.min(demoIdx, DEMO.length - 1)].bg

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: short ? '5px 16px' : '9px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: short ? 14 : 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{SS_CSS}</style>
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
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s explore! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  (${demoIdx + 1}/${DEMO.length})`)}
        <ShapeExplain key={`demo${demoIdx}`} world={world} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Tap the shape')}
        <ShapePlay key="guided" world={world} data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
