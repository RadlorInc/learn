'use client'
/**
 * Chapter (9–11) — ROUNDING to the nearest 10 / 100, and ESTIMATING sums (skill `rounding`) in the
 * PRE-TEEN "Mission HUD" look (matching FactorLab and the other 9–11 HUD chapters).
 *
 * Rounding is carried by a code-drawn NEON NUMBER LINE — the precise model the concept needs. The
 * axis runs between the two bracketing multiples ("stops"), a faint flag marks the halfway tick, and
 * a glowing accent marker sits above the line at the number's proportional position. On reveal the
 * marker snaps to the nearer stop and a verdict chip appears ("47 → 50"). For the estimate level each
 * addend rounds on its own mini-line, then the rounded sum is shown. The child taps the nearer
 * multiple's value.
 *
 * Difficulty (mirrors the kit): L1 → nearest 10 · L2 → +nearest 100 · L3 → +estimate a sum (round
 * each addend first, then add). One continuous adaptive SkillBeat (10 rounds, re-teach after 3). The
 * demo + 3-wrong re-teach BUILD the line via ONE speakSteps. Single lab — no world picker. Code-drawn
 * only (no photographic scene → no background reuse). Wrapped by game/RoundingChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { numberToWords } from '../lessons/_kit'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'

const ACCENT = ACCENTS.sky

// ─── Math (preserved from the storybook version) ──────────────────────────────────────
export function roundTo(n: number, m: number): number { return Math.floor(n / m + 0.5) * m }
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
const fmt = (n: number) => n.toLocaleString('en-US')

function stepChoices(answer: number, m: number): number[] {
  const opts = new Set<number>([answer])
  for (const v of [answer - m, answer + m, answer + 2 * m, answer - 2 * m]) { if (opts.size >= 3) break; if (v >= 0) opts.add(v) }
  return shuffle([...opts])
}

type QType = 'round10' | 'round100' | 'estimate'
interface RtRound {
  qType: QType
  n?: number; m?: number          // round: the number + the place (10/100)
  a?: number; b?: number          // estimate: the two addends
  prompt: string; tag: string; say: string; answer: number; choices: number[]
}

function makeRound(d: 1 | 2 | 3): RtRound {
  const pool: QType[] = d === 1 ? ['round10'] : d === 2 ? ['round10', 'round100', 'round10'] : ['round100', 'estimate', 'round10']
  const t = pick(pool)
  if (t === 'estimate') {
    const a = rint(11, 89), b = rint(11, 89)
    const answer = roundTo(a, 10) + roundTo(b, 10)
    return { qType: t, a, b, tag: 'Estimate sum', prompt: `About how much is ${a} + ${b}?`, say: `About how much is ${numberToWords(a)} plus ${numberToWords(b)}? Round each one first.`, answer, choices: stepChoices(answer, 10) }
  }
  const m = t === 'round100' ? 100 : 10
  const n = m === 100 ? rint(120, 980) : rint(11, d === 1 ? 99 : 199)
  const answer = roundTo(n, m)
  return { qType: t, n, m, tag: `Nearest ${m}`, prompt: `Round ${fmt(n)} to the nearest ${m}`, say: `Round ${numberToWords(n)} to the nearest ${m === 100 ? 'hundred' : 'ten'}.`, answer, choices: stepChoices(answer, m) }
}

// ─── The neon number line ─────────────────────────────────────────────────────────────
// stage: 1 axis+stops · 2 +value marker · 3 +halfway flag · 4 decided (nearer stop glows)
function NumberLine({ value, m, stage }: { value: number; m: number; stage: number }) {
  const low = Math.floor(value / m) * m
  const high = low + m
  const mid = low + m / 2
  const nearest = roundTo(value, m)
  const frac = Math.max(0, Math.min(1, (value - low) / m))
  const showValue = stage >= 2, showMid = stage >= 3, decided = stage >= 4
  const markerFrac = decided ? (nearest === low ? 0 : 1) : frac

  const Stop = ({ x, label, hi }: { x: number; label: number; hi: boolean }) => (
    <div style={{ position: 'absolute', left: `${x * 100}%`, top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all .3s' }}>
      <div style={{ width: hi ? 22 : 15, height: hi ? 22 : 15, borderRadius: '50%', flexShrink: 0,
        background: hi ? ACCENT.base : PT.panelSoft, border: `3px solid ${hi ? ACCENT.deep : PT.lineStrong}`,
        boxShadow: hi ? `0 0 18px ${ACCENT.base}, 0 0 0 4px ${ACCENT.base}33` : 'none', transition: 'all .3s cubic-bezier(.34,1.56,.64,1)' }} />
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 30, color: hi ? ACCENT.base : PT.ink, textShadow: hi ? `0 0 16px ${ACCENT.base}88` : 'none', transition: 'all .3s' }}>{fmt(label)}</div>
    </div>
  )
  return (
    <div style={{ position: 'relative', width: 560, height: 200, padding: '0 34px' }}>
      {/* axis */}
      <div style={{ position: 'absolute', left: 34, right: 34, top: 100, height: 4, transform: 'translateY(-50%)', borderRadius: 3, background: `linear-gradient(90deg, ${ACCENT.base}88, ${ACCENT.base}cc, ${ACCENT.base}88)`, boxShadow: `0 0 12px ${ACCENT.base}66` }} />
      {/* tick marks */}
      <div style={{ position: 'absolute', left: 34, right: 34, top: 100, height: 0 }}>
        {[0, 0.5, 1].map(x => (
          <div key={x} style={{ position: 'absolute', left: `${x * 100}%`, top: 0, width: 2, height: x === 0.5 ? 20 : 26, transform: 'translate(-50%,-50%)', background: x === 0.5 ? PT.warn : ACCENT.base, opacity: x === 0.5 ? (showMid ? 0.7 : 0) : 0.5, borderRadius: 2, transition: 'opacity .3s' }} />
        ))}
        {/* halfway flag */}
        <div style={{ position: 'absolute', left: '50%', top: 22, transform: 'translateX(-50%)', opacity: showMid ? 1 : 0, transition: 'opacity .3s', display: 'flex', flexDirection: 'column', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: PT.mono, fontSize: 12, fontWeight: 700, letterSpacing: .5, color: PT.warn, background: PT.warn + '22', border: `1px solid ${PT.warn}55`, borderRadius: 8, padding: '2px 9px' }}>halfway {fmt(mid)}</div>
        </div>
        {/* the two stops */}
        <Stop x={0} label={low} hi={decided && nearest === low} />
        <Stop x={1} label={high} hi={decided && nearest === high} />
        {/* value marker */}
        <div style={{ position: 'absolute', left: `${markerFrac * 100}%`, top: -74, transform: 'translateX(-50%)', opacity: showValue ? 1 : 0, transition: 'opacity .3s, left .55s cubic-bezier(.34,1.4,.5,1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 40, lineHeight: 1, color: PT.ink, textShadow: `0 0 22px ${ACCENT.base}`, padding: '4px 12px', borderRadius: 10, background: PT.panel, border: `1px solid ${ACCENT.base}88`, boxShadow: `0 0 20px ${ACCENT.base}55` }}>{fmt(value)}</div>
          <div style={{ width: 0, height: 0, marginTop: 4, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `13px solid ${ACCENT.base}`, filter: `drop-shadow(0 0 6px ${ACCENT.base})` }} />
        </div>
      </div>
    </div>
  )
}

// ─── Estimate view (round each addend on its own mini-line, then add) ──────────────────
function MiniLine({ n, r, on }: { n: number; r: number; on: boolean }) {
  const m = 10
  const low = Math.floor(n / m) * m, high = low + m
  const frac = Math.max(0, Math.min(1, (n - low) / m))
  const snapFrac = r === low ? 0 : 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: on ? 1 : 0.2, transform: on ? 'translateX(0)' : 'translateX(-8px)', transition: 'all .35s ease' }}>
      <div style={{ position: 'relative', width: 150, height: 44 }}>
        <div style={{ position: 'absolute', left: 6, right: 6, top: '50%', height: 3, transform: 'translateY(-50%)', borderRadius: 2, background: `${ACCENT.base}bb`, boxShadow: `0 0 8px ${ACCENT.base}55` }} />
        {[0, 1].map(x => (
          <div key={x} style={{ position: 'absolute', left: `calc(${x * 100}% + ${6 - x * 12}px)`, top: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translate(-50%,-50%)', gap: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: PT.panelSoft, border: `2px solid ${PT.lineStrong}` }} />
          </div>
        ))}
        {/* snapped marker */}
        <div style={{ position: 'absolute', left: `calc(${(on ? snapFrac : frac) * 100}% + ${6 - (on ? snapFrac : frac) * 12}px)`, top: '50%', transform: 'translate(-50%,-50%)', transition: 'left .5s cubic-bezier(.34,1.4,.5,1)' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: ACCENT.base, boxShadow: `0 0 12px ${ACCENT.base}` }} />
        </div>
      </div>
      <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 34, color: PT.ink, minWidth: 52, textAlign: 'right' }}>{n}</span>
      <span style={{ fontFamily: PT.mono, fontSize: 24, color: PT.inkMute }}>≈</span>
      <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 34, color: ACCENT.base, textShadow: `0 0 14px ${ACCENT.base}66` }}>{r}</span>
    </div>
  )
}
function EstimateView({ a, b, shown }: { a: number; b: number; shown: number }) {
  const ra = roundTo(a, 10), rb = roundTo(b, 10), est = ra + rb
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 14, padding: '10px 8px' }}>
      <MiniLine n={a} r={ra} on={shown >= 1} />
      <MiniLine n={b} r={rb} on={shown >= 2} />
      <div style={{ height: 2, background: `${ACCENT.base}55`, opacity: shown >= 3 ? 1 : 0.2, transition: 'opacity .3s' }} />
      <div style={{ textAlign: 'center', fontFamily: PT.mono, fontWeight: 800, fontSize: 28, color: ACCENT.base, textShadow: `0 0 16px ${ACCENT.base}66`, opacity: shown >= 3 ? 1 : 0.18, transition: 'opacity .3s' }}>≈ {est}</div>
    </div>
  )
}

// ─── Instrument panel (dark-glass, brackets, header) ──────────────────────────────────
interface StageState { stage: number; shown: number }
function Instrument({ data, s }: { data: RtRound; s: StageState }) {
  const header = data.qType === 'estimate' ? `ESTIMATE ${data.a} + ${data.b}`
    : `ROUND ${fmt(data.n!)} · ${data.m}s`
  const done = data.qType === 'estimate' ? s.shown >= 3 : s.stage >= 4
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 320, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: done ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${done ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '18px 26px 22px', display: 'flex', justifyContent: 'center' }}>
        {data.qType === 'estimate'
          ? <EstimateView a={data.a!} b={data.b!} shown={s.shown} />
          : <NumberLine value={data.n!} m={data.m!} stage={s.stage} />}
      </div>
    </div>
  )
}

// ─── Stage (shared by play + demo) ────────────────────────────────────────────────────
function Stage({ data, s, short }: { data: RtRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4} min={0.3}><Instrument data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const RtPlay: React.FC<{ data: RtRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(58, Math.min(short ? 92 : 116, Math.round(Math.min(vw / 6.5, vh / (short ? 4.4 : 5.2)))))
  const [s, setS] = useState<StageState>(() => ({ stage: data.qType === 'estimate' ? 0 : 3, shown: data.qType === 'estimate' ? 3 : 0 }))
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)
  useEffect(() => {
    if (mode === 'guided') speak(data.say)
    const t = window.setTimeout(() => setAsking(true), 700)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === data.answer) {
      done.current = true
      if (data.qType !== 'estimate') setS(v => ({ ...v, stage: 4 }))   // snap: the nearer stop glows
      if (mode === 'guided') speak('Correct.')
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1500)
    } else { erred.current = true; speak(data.qType === 'estimate' ? 'Not quite — round each number first, then add. Try again.' : 'Not quite — which stop is nearer? Try once more.'); window.setTimeout(() => setPicked(null), 1050) }
  }
  const label = (n: number) => data.qType === 'estimate' ? `≈${fmt(n)}` : fmt(n)
  return (
    <>
      <Stage data={data} s={s} short={short} />
      <PromptCard tag={data.tag} text={data.prompt} accent={ACCENT} short={short} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3vw,28px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {data.choices.map(n => {
          const st: ChoiceState = picked === n ? (n === data.answer ? 'right' : 'wrong') : picked !== null ? 'dim' : 'idle'
          return <ChoiceButton key={n} label={label(n)} accent={ACCENT} state={st} size={btn} onClick={() => choose(n)} disabled={picked !== null} />
        })}
      </div>
    </>
  )
}

// ─── Demo / re-teach: build the line (or the estimate) via ONE speakSteps ──────────────
const RtExplain: React.FC<{ data: RtRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => ({ stage: data.qType === 'estimate' ? 0 : 1, shown: 0 }))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    let lines: string[] = []
    let steps: Array<() => void> = []
    if (data.qType === 'estimate') {
      const a = data.a!, b = data.b!, ra = roundTo(a, 10), rb = roundTo(b, 10)
      lines = [`To estimate ${numberToWords(a)} plus ${numberToWords(b)}, round each first.`, `${numberToWords(a)} rounds to ${ra}, and ${numberToWords(b)} rounds to ${rb}. So it is about ${data.answer}.`]
      steps = [() => setS({ stage: 0, shown: 0 }), () => setS({ stage: 0, shown: 3 })]
    } else {
      const n = data.n!, m = data.m!, low = Math.floor(n / m) * m, high = low + m, mid = low + m / 2, nearest = data.answer
      const place = m === 100 ? 'hundred' : 'ten'
      lines = [
        `Round ${numberToWords(n)} to the nearest ${place}. It sits between ${low} and ${high} on the line.`,
        n >= mid ? `${numberToWords(n)} is ${n === mid ? 'right at the halfway ' + mid + ', so it rounds up' : 'past the halfway ' + mid} — it rounds to ${nearest}.` : `${numberToWords(n)} is before the halfway ${mid} — it rounds to ${nearest}.`,
      ]
      steps = [() => setS({ stage: 3, shown: 0 }), () => setS({ stage: 4, shown: 0 })]
    }
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => { window.setTimeout(() => doneRef.current(), 1300) }, fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Stage data={data} s={s} short={short} />
      <PromptCard tag={data.qType === 'estimate' ? 'Estimate' : 'Round'} text={data.prompt} accent={ACCENT} short={short} />
    </>
  )
}

// ─── Explore sim: slide n, toggle 10/100, watch it snap to the nearer stop live ─────────
function RoundScope() {
  const [n, setN] = useState(47)
  const [m, setM] = useState<10 | 100>(10)
  const low = Math.floor(n / m) * m
  const high = low + m
  const nearest = roundTo(n, m)
  const Toggle = ({ v }: { v: 10 | 100 }) => {
    const on = m === v
    return (
      <button onClick={() => setM(v)} style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 18, padding: '7px 20px', borderRadius: 10, cursor: 'pointer',
        background: on ? ACCENT.base : PT.panelSoft, color: on ? '#06121f' : PT.ink, border: `2px solid ${on ? ACCENT.deep : PT.lineStrong}`,
        boxShadow: on ? `0 0 16px ${ACCENT.base}88` : 'none', transition: 'all .2s' }}>{v}s</button>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontFamily: PT.mono, fontSize: 12, letterSpacing: 1, color: PT.inkMute, textTransform: 'uppercase' }}>round to</span>
        <Toggle v={10} /><Toggle v={100} />
      </div>
      <NumberLine value={n} m={m} stage={4} />
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label="lower stop" value={fmt(low)} accent={ACCENT} />
        <PtReadout label="rounds to" value={fmt(nearest)} accent={ACCENT} />
        <PtReadout label="upper stop" value={fmt(high)} accent={ACCENT} />
      </div>
      <PtSlider label="number" value={n} min={0} max={100} accent={ACCENT} onChange={setN} />
    </div>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
function makeBeat(): Beat<RtRound> {
  return {
    skillId: 'rounding', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => d.qType === 'estimate' ? `est|${d.a}|${d.b}` : `${d.qType}|${d.n}`,
    prompt: d => d.prompt,
    say: d => d.say,
    Play: ({ data, onSubmit }) => <RtPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <RtExplain data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function RoundingTrail({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
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

  const mkRound = (n: number, m: number): RtRound => {
    const answer = roundTo(n, m)
    return { qType: m === 100 ? 'round100' : 'round10', n, m, tag: `Nearest ${m}`, prompt: `Round ${fmt(n)} to the nearest ${m}`, say: `Round ${numberToWords(n)} to the nearest ${m === 100 ? 'hundred' : 'ten'}.`, answer, choices: stepChoices(answer, m) }
  }
  const DEMO: RtRound[] = [mkRound(34, 10), mkRound(47, 10)]
  const GUIDED: RtRound = mkRound(68, 10)

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
        <IntroCard title="Rounding Range" accent={ACCENT} cta="Start rounding"
          body="Every number sits between two stops on the line. Milo finds the halfway mark, then snaps the number to the nearer stop. Watch one, then round them yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Round it" accent={ACCENT} short={short}
          intro="Slide the number and watch it snap to the nearer stop — that's rounding."
          onContinue={() => setPhase('demo')}>
          <RoundScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <RtExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · tap the nearer stop')}
        <RtPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
