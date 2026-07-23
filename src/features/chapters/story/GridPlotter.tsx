'use client'
/**
 * Chapter (9–11) — AREA & PERIMETER (skill `areaPerimeter`) in the PRE-TEEN "Number Lab" look.
 *
 * The same crisp cool console / neon HUD shell as FactorLab (see story/preteen/kit.tsx). Milo
 * "plots" a rectangular plot of land on a code-drawn unit grid:
 *   • AREA      → fill every interior square and count them  (w × h)
 *   • PERIMETER → glow the fence cells around the edge and add the four sides  (2 × (w + h))
 *   • SIDE      → given the area and one side, find the other side  (A ÷ w)
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3): L1 area + perimeter, small plots ·
 * L2 bigger plots · L3 adds the missing-side puzzle. Code-drawn (no photographic scene → no bg reuse).
 * Wrapped by game/AreaPerimeterChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'

const ACCENT = ACCENTS.lime

// ─── Math ───────────────────────────────────────────────────────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }

type QType = 'area' | 'perimeter' | 'side'
interface GpRound { qType: QType; w: number; h: number; givenW?: number; prompt: string; tag: string; say: string; answer: string; choices: string[] }

function threeChoices(correct: number, cands: number[]): string[] {
  const opts = new Set<string>([String(correct)])
  for (const c of shuffle(cands)) { if (opts.size >= 3) break; if (c > 0 && c !== correct) opts.add(String(c)) }
  let b = 1; while (opts.size < 3) { const c = correct + b; if (c > 0) opts.add(String(c)); b++ }
  return shuffle([...opts])
}

function mkArea(w: number, h: number): GpRound {
  const a = w * h
  const choices = threeChoices(a, [w + h, a - w, a + w, a - h, a + h, 2 * (w + h)])
  return { qType: 'area', w, h, prompt: 'How many squares cover the plot?', tag: 'Area scan', say: 'How many squares cover the plot?', answer: String(a), choices }
}
function mkPerimeter(w: number, h: number): GpRound {
  const p = 2 * (w + h)
  const choices = threeChoices(p, [w * h, 2 * w + h, w + 2 * h, w + h, p - 2, p + 2])
  return { qType: 'perimeter', w, h, prompt: 'How long is the fence around the plot?', tag: 'Fence scan', say: 'How long is the fence around the plot?', answer: String(p), choices }
}
function mkSide(w: number, h: number): GpRound {
  const a = w * h
  const choices = threeChoices(h, [w, h + 1, h - 1, h + 2, a - w])
  return { qType: 'side', w, h, givenW: w, prompt: `The area is ${a} and one side is ${w}. How long is the other side?`, tag: 'Missing side', say: `The area is ${a} and one side is ${w}. How long is the other side?`, answer: String(h), choices }
}
function makeRound(d: 1 | 2 | 3): GpRound {
  if (d === 1) { const w = rint(2, 5), h = rint(2, 5); return pick<QType>(['area', 'perimeter']) === 'area' ? mkArea(w, h) : mkPerimeter(w, h) }
  if (d === 2) { const w = rint(3, 8), h = rint(3, 8); return pick<QType>(['area', 'perimeter']) === 'area' ? mkArea(w, h) : mkPerimeter(w, h) }
  const w = rint(2, 9), h = rint(2, 9)
  const t = pick<QType>(['area', 'perimeter', 'side'])
  return t === 'area' ? mkArea(w, h) : t === 'perimeter' ? mkPerimeter(w, h) : mkSide(w, h)
}

// ─── Plot instrument (code-drawn unit grid) ─────────────────────────────────────────────
type PlotMode = 'area' | 'perimeter'
function Plot({ w, h, mode, revealed }: { w: number; h: number; mode: PlotMode; revealed: boolean }) {
  const cell = w > 7 || h > 7 ? 26 : w > 5 || h > 5 ? 32 : 40
  const gap = 3
  const isEdge = (r: number, c: number) => r === 0 || r === h - 1 || c === 0 || c === w - 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* top width label */}
      <div style={{ display: 'flex', alignItems: 'center', gap, paddingLeft: cell + gap }}>
        <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 20, color: ACCENT.base, letterSpacing: 1, textShadow: `0 0 12px ${ACCENT.base}66` }}>{w}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap }}>
        {/* left height label */}
        <div style={{ width: cell, display: 'flex', justifyContent: 'center', fontFamily: PT.mono, fontWeight: 800, fontSize: 20, color: ACCENT.base, letterSpacing: 1, textShadow: `0 0 12px ${ACCENT.base}66` }}>{h}</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${w}, ${cell}px)`, gridTemplateRows: `repeat(${h}, ${cell}px)`, gap }}>
          {Array.from({ length: w * h }).map((_, i) => {
            const r = Math.floor(i / w), c = i % w
            const lit = revealed && (mode === 'area' || isEdge(r, c))
            return <div key={i} style={{
              width: cell, height: cell, borderRadius: Math.round(cell * 0.16),
              background: lit ? ACCENT.base : PT.panelSoft,
              border: `2px solid ${lit ? ACCENT.deep : PT.lineStrong}`,
              boxShadow: lit ? `0 0 10px ${ACCENT.base}88` : 'none',
              transition: 'all .25s cubic-bezier(.34,1.56,.64,1)',
            }} />
          })}
        </div>
      </div>
    </div>
  )
}

interface StageState { revealed: boolean; verdict: string | null }
function initState(): StageState { return { revealed: false, verdict: null } }
function revealState(d: GpRound): StageState {
  if (d.qType === 'area') return { revealed: true, verdict: `${d.w} × ${d.h} = ${d.w * d.h}` }
  if (d.qType === 'perimeter') return { revealed: true, verdict: `2 × (${d.w} + ${d.h}) = ${2 * (d.w + d.h)}` }
  return { revealed: true, verdict: `${d.w * d.h} ÷ ${d.w} = ${d.h}` }
}

function Plotter({ data, s }: { data: GpRound; s: StageState }) {
  const mode: PlotMode = data.qType === 'perimeter' ? 'perimeter' : 'area'
  const header = data.qType === 'area' ? `PLOT ${data.w}×${data.h}` : data.qType === 'perimeter' ? `FENCE ${data.w}×${data.h}` : `SOLVE ${data.w}×?`
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '20px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Plot w={data.w} h={data.h} mode={mode} revealed={s.revealed} />
        <div style={{ height: 34 }}>
          {s.verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 17, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: PT.ok, color: '#06121f', boxShadow: `0 0 18px ${PT.ok}` }}>{s.verdict}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: GpRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4} min={0.3}><Plotter data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const GpPlay: React.FC<{ data: GpRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
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
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1600)
    } else { erred.current = true; speak('Not quite. Look at the plot and try again.'); window.setTimeout(() => setPicked(null), 1050) }
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
const GpExplain: React.FC<{ data: GpRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => initState())
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const rv = revealState(data)
    let lines: string[] = []
    if (data.qType === 'area') {
      lines = [`Draw a ${data.w} by ${data.h} plot.`, `${data.h} rows of ${data.w} squares = ${data.w * data.h} squares.`]
    } else if (data.qType === 'perimeter') {
      lines = [`Trace the fence around a ${data.w} by ${data.h} plot.`, `Add all four sides: ${data.w} + ${data.h} + ${data.w} + ${data.h} = ${2 * (data.w + data.h)}.`]
    } else {
      lines = [`The plot has area ${data.w * data.h} and one side ${data.w}.`, `${data.w * data.h} ÷ ${data.w} = ${data.h}, so the other side is ${data.h}.`]
    }
    const steps: Array<() => void> = [() => setS(initState()), () => setS(rv)]
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => window.setTimeout(() => doneRef.current(), 1300), fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Plot" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: drag width & height, watch the area fill and the perimeter glow live ──
function PlotScope() {
  const [w, setW] = useState(4)
  const [h, setH] = useState(3)
  const area = w * h
  const perim = 2 * (w + h)
  const cell = w > 7 || h > 7 ? 26 : w > 5 || h > 5 ? 32 : 40
  const gap = 3
  const isEdge = (r: number, c: number) => r === 0 || r === h - 1 || c === 0 || c === w - 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      {/* live unit grid — every cell filled (area), edge cells glow brighter (perimeter) */}
      <div style={{ display: 'flex', alignItems: 'center', gap }}>
        <div style={{ width: cell, display: 'flex', justifyContent: 'center', fontFamily: PT.mono, fontWeight: 800, fontSize: 20, color: ACCENT.base, letterSpacing: 1, textShadow: `0 0 12px ${ACCENT.base}66` }}>{h}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap }}>
          <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 20, color: ACCENT.base, letterSpacing: 1, textShadow: `0 0 12px ${ACCENT.base}66` }}>{w}</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${w}, ${cell}px)`, gridTemplateRows: `repeat(${h}, ${cell}px)`, gap }}>
            {Array.from({ length: w * h }).map((_, i) => {
              const r = Math.floor(i / w), c = i % w
              const edge = isEdge(r, c)
              return <div key={i} style={{
                width: cell, height: cell, borderRadius: Math.round(cell * 0.16),
                background: ACCENT.base,
                border: `2px solid ${edge ? ACCENT.base : ACCENT.deep}`,
                boxShadow: edge ? `0 0 12px ${ACCENT.base}, inset 0 0 6px ${ACCENT.base}` : 'none',
                transition: 'all .2s cubic-bezier(.34,1.56,.64,1)',
              }} />
            })}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label={`area · ${w} × ${h}`} value={String(area)} accent={ACCENT} />
        <PtReadout label={`perimeter · 2×(${w}+${h})`} value={String(perim)} accent={ACCENT} />
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <PtSlider label="width" value={w} min={1} max={10} accent={ACCENT} onChange={setW} />
        <PtSlider label="height" value={h} min={1} max={10} accent={ACCENT} onChange={setH} />
      </div>
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<GpRound> {
  return {
    skillId: 'areaPerimeter', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => `${d.qType}|${d.w}x${d.h}`,
    prompt: d => d.prompt, say: d => d.say,
    Play: ({ data, onSubmit }) => <GpPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <GpExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function GridPlotter({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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

  const DEMO: GpRound[] = [mkArea(4, 3), mkPerimeter(5, 2)]
  const GUIDED: GpRound = mkArea(3, 3)

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
        <IntroCard title="Plot Lab" accent={ACCENT} cta="Start plotting"
          body="Milo maps out plots of land on a grid — counting the squares that cover them (area) and pacing the fence around them (perimeter). Play with a plot, then watch one, then plot it yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Size the plot" accent={ACCENT} short={short}
          intro="Slide width and height — watch the area fill and the perimeter glow."
          onContinue={() => setPhase('demo')}>
          <PlotScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <GpExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · plot it out')}
        <GpPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
