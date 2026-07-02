'use client'
/**
 * Chapter (9–11) — ANGLES & SYMMETRY (skill `anglesSymmetry`) in the PRE-TEEN "Number Lab" look.
 *
 * A crisp cool console, blueprint grid, mono numerals, HUD chrome, Milo as an explorer (see
 * story/preteen/kit.tsx). Milo "scopes" a figure:
 *   • ANGLE TYPE → an angle opens between two rays; is it acute (<90°), right (=90°), or obtuse (>90°)?
 *   • SYMMETRY  → a regular shape; how many lines of symmetry fold it onto itself?
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3): L1 clear angles + square/rectangle ·
 * L2 adds triangles + angles nearer 90° · L3 adds pentagon/hexagon + trickier angles. Code-drawn SVG
 * (no photographic scene → no background reuse). Wrapped by game/AnglesSymmetryChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/lib/useViewport'

const ACCENT = ACCENTS.violet


// ─── FitBox (measure natural size → scale to fill the band) ────────────────────────────
function FitBox({ availW, availH, max = 2.4, children }: { availW: number; availH: number; max?: number; children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = inner.current; if (!el) return
    const measure = () => { const nw = el.offsetWidth, nh = el.offsetHeight; if (!nw || !nh || availW <= 0 || availH <= 0) return; const s = Math.max(0.3, Math.min(availW / nw, availH / nh, max)); setScale(s); setDims({ w: nw * s, h: nh * s }) }
    measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect()
  }, [availW, availH, max])
  return (
    <div style={{ width: dims.w || undefined, height: dims.h || undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div ref={inner} style={{ flex: 'none', transform: `scale(${scale})`, transformOrigin: 'center center' }}>{children}</div>
    </div>
  )
}

// ─── Math ───────────────────────────────────────────────────────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }

type QType = 'angleType' | 'symmetry'
type ShapeKind = 'square' | 'rectangle' | 'equilateral' | 'isosceles' | 'pentagon' | 'hexagon'
const SHAPE_LINES: Record<ShapeKind, number> = { square: 4, rectangle: 2, equilateral: 3, isosceles: 1, pentagon: 5, hexagon: 6 }
const SHAPE_LABEL: Record<ShapeKind, string> = { square: 'Square', rectangle: 'Rectangle', equilateral: 'Equilateral triangle', isosceles: 'Isosceles triangle', pentagon: 'Regular pentagon', hexagon: 'Regular hexagon' }

interface AsRound { qType: QType; deg: number; shape: ShapeKind; prompt: string; tag: string; say: string; answer: string; choices: string[]; verdict: string }

function angleKind(deg: number): 'Acute' | 'Right' | 'Obtuse' { return deg === 90 ? 'Right' : deg < 90 ? 'Acute' : 'Obtuse' }
function angleVerdict(deg: number): string { const k = angleKind(deg); return k === 'Right' ? 'Right — exactly 90°' : k === 'Acute' ? 'Acute — less than 90°' : 'Obtuse — more than 90°' }

function mkAngle(deg: number): AsRound {
  return { qType: 'angleType', deg, shape: 'square', prompt: 'Is this angle acute, right, or obtuse?', tag: 'Angle scope', say: 'Is this angle acute, right, or obtuse?', answer: angleKind(deg), choices: ['Acute', 'Right', 'Obtuse'], verdict: angleVerdict(deg) }
}
function symmetryChoices(correct: number): string[] {
  const opts = new Set<string>([String(correct)])
  for (const c of shuffle([correct + 1, correct - 1, correct + 2, correct - 2, correct + 3])) { if (opts.size >= 3) break; if (c >= 1 && c !== correct) opts.add(String(c)) }
  let b = 2; while (opts.size < 3) { const c = correct + b; if (c >= 1) opts.add(String(c)); b++ }
  return shuffle([...opts])
}
function mkSym(shape: ShapeKind): AsRound {
  const n = SHAPE_LINES[shape]
  return { qType: 'symmetry', deg: 90, shape, prompt: 'How many lines of symmetry?', tag: 'Symmetry scan', say: `How many lines of symmetry does the ${SHAPE_LABEL[shape].toLowerCase()} have?`, answer: String(n), choices: symmetryChoices(n), verdict: `${SHAPE_LABEL[shape]} — ${n} line${n === 1 ? '' : 's'}` }
}
function makeRound(d: 1 | 2 | 3): AsRound {
  const wantAngle = Math.random() < 0.5
  if (wantAngle) {
    const deg = d === 1 ? pick([30, 40, 50, 60, 90, 120, 135, 150]) : d === 2 ? pick([70, 90, 110, 45, 130, 55]) : pick([75, 85, 90, 95, 105, 80, 100])
    return mkAngle(deg)
  }
  const shapes: ShapeKind[] = d === 1 ? ['square', 'rectangle'] : d === 2 ? ['square', 'rectangle', 'equilateral', 'isosceles'] : ['equilateral', 'isosceles', 'pentagon', 'hexagon', 'square']
  return mkSym(pick(shapes))
}

// ─── Angle instrument (SVG) ─────────────────────────────────────────────────────────────
function AngleView({ deg, revealed }: { deg: number; revealed: boolean }) {
  const cx = 40, cy = 150, len = 150               // vertex bottom-left, rays reach right/up
  const ex = cx + len, ey = cy                     // horizontal ray endpoint
  const rad = (deg * Math.PI) / 180
  const rx = cx + len * Math.cos(rad), ry = cy - len * Math.sin(rad)  // rotated ray (CCW)
  const arcR = 44
  const a1x = cx + arcR, a1y = cy
  const a2x = cx + arcR * Math.cos(rad), a2y = cy - arcR * Math.sin(rad)
  const large = deg > 180 ? 1 : 0
  const midR = (deg * Math.PI) / 360
  const lx = cx + (arcR + 20) * Math.cos(midR), ly = cy - (arcR + 20) * Math.sin(midR)
  return (
    <svg width={210} height={190} viewBox="0 0 210 190" style={{ display: 'block' }}>
      {deg === 90 && <rect x={cx} y={cy - 20} width={20} height={20} fill="none" stroke={ACCENT.base} strokeWidth={2.5} />}
      <path d={`M ${a1x} ${a1y} A ${arcR} ${arcR} 0 ${large} 0 ${a2x} ${a2y}`} fill="none" stroke={revealed ? ACCENT.base : ACCENT.deep} strokeWidth={revealed ? 4 : 2.5} opacity={revealed ? 1 : 0.7} />
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={ACCENT.base} strokeWidth={5} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={rx} y2={ry} stroke={ACCENT.base} strokeWidth={5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill={ACCENT.base} />
      {revealed && <text x={lx} y={ly} fill={PT.ink} fontFamily={PT.mono} fontWeight={700} fontSize={20} textAnchor="middle" dominantBaseline="middle">{deg}°</text>}
    </svg>
  )
}

// ─── Symmetry instrument (SVG) ──────────────────────────────────────────────────────────
function regularPoly(cx: number, cy: number, r: number, sides: number, rot: number): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < sides; i++) { const a = rot + (i * 2 * Math.PI) / sides; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) }
  return pts
}
function ShapeSym({ shape, revealed }: { shape: ShapeKind; revealed: boolean }) {
  const cx = 100, cy = 100, r = 78
  let pts: Array<[number, number]> = []
  const lines: Array<[number, number, number, number]> = []
  const L = 88
  if (shape === 'square') {
    const s = 66; pts = [[cx - s, cy - s], [cx + s, cy - s], [cx + s, cy + s], [cx - s, cy + s]]
    lines.push([cx, cy - L, cx, cy + L], [cx - L, cy, cx + L, cy], [cx - L, cy - L, cx + L, cy + L], [cx - L, cy + L, cx + L, cy - L])
  } else if (shape === 'rectangle') {
    const w = 84, h = 52; pts = [[cx - w, cy - h], [cx + w, cy - h], [cx + w, cy + h], [cx - w, cy + h]]
    lines.push([cx, cy - h - 14, cx, cy + h + 14], [cx - w - 14, cy, cx + w + 14, cy])
  } else if (shape === 'equilateral') {
    pts = regularPoly(cx, cy, r, 3, -Math.PI / 2)
    for (const [vx, vy] of pts) { const dx = cx - vx, dy = cy - vy; lines.push([vx, vy, cx + dx * 0.9, cy + dy * 0.9]) }
  } else if (shape === 'isosceles') {
    pts = [[cx, cy - r], [cx + r * 0.72, cy + r * 0.66], [cx - r * 0.72, cy + r * 0.66]]
    lines.push([cx, cy - r - 12, cx, cy + r * 0.66 + 12])
  } else {
    const sides = shape === 'pentagon' ? 5 : 6
    pts = regularPoly(cx, cy, r, sides, -Math.PI / 2)
    for (let i = 0; i < sides; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / sides   // axis every 180/sides degrees
      lines.push([cx - L * Math.cos(a), cy - L * Math.sin(a), cx + L * Math.cos(a), cy + L * Math.sin(a)])
    }
  }
  const poly = pts.map(p => p.join(',')).join(' ')
  return (
    <svg width={200} height={200} viewBox="0 0 200 200" style={{ display: 'block' }}>
      <polygon points={poly} fill={ACCENT.soft} stroke={ACCENT.base} strokeWidth={4} strokeLinejoin="round" />
      {revealed && lines.map((ln, i) => <line key={i} x1={ln[0]} y1={ln[1]} x2={ln[2]} y2={ln[3]} stroke={ACCENT.base} strokeWidth={2.5} strokeDasharray="7 6" opacity={0.95} />)}
    </svg>
  )
}

// ─── Scope panel ────────────────────────────────────────────────────────────────────────
interface StageState { revealed: boolean; verdict: string | null }
function initState(): StageState { return { revealed: false, verdict: null } }
function revealState(d: AsRound): StageState { return { revealed: true, verdict: d.verdict } }

function Scope({ data, s }: { data: AsRound; s: StageState }) {
  const header = data.qType === 'angleType' ? 'ANGLE SCOPE' : `SYMMETRY · ${SHAPE_LABEL[data.shape].toUpperCase()}`
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '20px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {data.qType === 'angleType'
          ? <AngleView deg={data.deg} revealed={s.revealed} />
          : <ShapeSym shape={data.shape} revealed={s.revealed} />}
        <div style={{ height: 34 }}>
          {s.verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 16, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: PT.ok, color: '#06121f', boxShadow: `0 0 18px ${PT.ok}` }}>{s.verdict}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: AsRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4}><Scope data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const AsPlay: React.FC<{ data: AsRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(58, Math.min(short ? 92 : 116, Math.round(Math.min(vw / 6.5, vh / (short ? 4.4 : 5.2)))))
  const [s, setS] = useState<StageState>(() => initState())
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const erred = useRef(false), done = useRef(false)
  useEffect(() => {
    if (mode === 'guided') speak(data.say)
    const t = window.setTimeout(() => setAsking(true), 650)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function choose(c: string) {
    if (done.current || picked !== null || !asking) return
    setPicked(c)
    if (c === data.answer) {
      done.current = true; setS(revealState(data))
      if (mode === 'guided') speak('Correct.')
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1600)
    } else { erred.current = true; speak('Not quite. Look at the scope and try again.'); window.setTimeout(() => setPicked(null), 1050) }
  }
  return (
    <>
      <Stage data={data} s={s} short={short} />
      <PromptCard tag={data.tag} text={data.prompt} accent={ACCENT} short={short} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3vw,28px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {data.choices.map(c => {
          const st: ChoiceState = picked === c ? (c === data.answer ? 'right' : 'wrong') : picked !== null ? 'dim' : 'idle'
          return <ChoiceButton key={c} label={c} accent={ACCENT} state={st} size={btn} onClick={() => choose(c)} disabled={picked !== null} />
        })}
      </div>
    </>
  )
}

// ─── Demo / re-teach ───────────────────────────────────────────────────────────────────
const AsExplain: React.FC<{ data: AsRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => initState())
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const rv = revealState(data)
    let lines: string[] = []
    if (data.qType === 'angleType') {
      const k = angleKind(data.deg)
      const l2 = k === 'Right' ? `It's exactly a right angle — 90°.` : k === 'Acute' ? `It's smaller than a right angle (90°), so it's acute.` : `It's wider than a right angle (90°), so it's obtuse.`
      lines = [`Open the angle between the two rays.`, l2]
    } else {
      const n = SHAPE_LINES[data.shape]
      lines = [`Look at the ${SHAPE_LABEL[data.shape].toLowerCase()}.`, data.shape === 'square' ? `A square folds onto itself 4 ways — 4 lines of symmetry.` : `It folds onto itself ${n} way${n === 1 ? '' : 's'} — ${n} line${n === 1 ? '' : 's'} of symmetry.`]
    }
    const steps: Array<() => void> = [() => setS(initState()), () => setS(rv)]
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => window.setTimeout(() => doneRef.current(), 1300), fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Scope" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: slide the angle open and watch its type update live ──────────────────
function AngleScopeSim() {
  const [deg, setDeg] = useState(45)
  const kind = angleKind(deg)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <AngleView deg={deg} revealed />
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label="degrees" value={`${deg}°`} accent={ACCENT} />
        <PtReadout label="type" value={kind.toLowerCase()} accent={ACCENT} warn={kind === 'Right'} />
      </div>
      <PtSlider label="angle" value={deg} min={0} max={180} accent={ACCENT} fmt={(v) => `${v}°`} onChange={setDeg} />
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<AsRound> {
  return {
    skillId: 'anglesSymmetry', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => `${d.qType}|${d.qType === 'angleType' ? d.deg : d.shape}`,
    prompt: d => d.prompt, say: d => d.say,
    Play: ({ data, onSubmit }) => <AsPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <AsExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function AngleScope({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const { h: vh } = useViewport()
  const short = vh < 470
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true; stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 700)), [])
  const beat = useMemo(() => makeBeat(), [])

  const DEMO: AsRound[] = [mkAngle(45), mkSym('square')]
  const GUIDED: AsRound = mkAngle(120)

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ background: PT.panel, backdropFilter: 'blur(6px)', border: `1px solid ${ACCENT.base}66`, borderRadius: 999, padding: short ? '5px 16px' : '8px 20px', fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 13 : 16, color: ACCENT.base, boxShadow: `0 0 16px ${ACCENT.base}33` }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{PT_CSS}</style>
      <LabBackdrop accent={ACCENT} />
      <BackChip onExit={exit} />

      {phase === 'intro' && (
        <IntroCard title="Angle Scope" accent={ACCENT} cta="Start scan"
          body="Milo scopes shapes and angles — acute, right, or obtuse, and how many lines of symmetry fold a shape onto itself. Watch one, then run the scope yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Open the angle" accent={ACCENT} short={short}
          intro="Slide to open the angle — is it acute, right, or obtuse?"
          onContinue={() => setPhase('demo')}>
          <AngleScopeSim />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <AsExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · run the scope')}
        <AsPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
      )}

      <PtMilo left={9} />
    </div>
  )
}
