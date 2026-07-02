'use client'
/**
 * Chapter (9–11) — FACTORS & MULTIPLES (skill `factorsMultiples`) in the PRE-TEEN "Number Lab" look.
 *
 * A more grown-up shell than the 3–8 storybook worlds: crisp cool console, blueprint grid, mono
 * numerals, HUD chrome, Milo as an explorer (see story/preteen/kit.tsx). Milo "analyses" a number:
 *   • EVEN / ODD  → pair the units; one left over ⇒ odd
 *   • MULTIPLE of b → the skip-count pattern (b, 2b, 3b …); pick the number on the list
 *   • FACTOR of n → split n into equal rows; the divisor that leaves no gap is a factor
 *   • PRIME? → only 1 × n fits ⇒ prime
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3): L1 even/odd + multiples · L2 adds
 * factors + primes · L3 bigger numbers. Code-drawn (no photographic scene → no background reuse).
 * Wrapped by game/FactorsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { isPrime, factorsOf } from '../lessons/FactorsLesson'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'

const ACCENT = ACCENTS.indigo

function useViewport() {
  const [vp, setVp] = useState({ w: 1000, h: 700 })
  useEffect(() => {
    const calc = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    calc(); window.addEventListener('resize', calc); window.addEventListener('orientationchange', calc)
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('orientationchange', calc) }
  }, [])
  return vp
}

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
const smallestFactor = (n: number) => { for (let i = 2; i <= n; i++) if (n % i === 0) return i; return n }

type QType = 'evenOdd' | 'multiple' | 'factor' | 'prime'
interface FlRound { qType: QType; n: number; base: number; prompt: string; tag: string; say: string; answer: string; choices: string[] }

function multipleChoices(base: number): { answer: string; choices: string[] } {
  const correct = base * rint(2, 9)
  const opts = new Set<string>([String(correct)])
  for (const c of shuffle([correct + 1, correct - 1, correct + 2, correct - 2, correct + 3])) { if (opts.size >= 3) break; if (c > 0 && c % base !== 0) opts.add(String(c)) }
  let b = 4; while (opts.size < 3) { const c = correct + b; if (c % base !== 0) opts.add(String(c)); b++ }
  return { answer: String(correct), choices: shuffle([...opts]) }
}
function factorRound(d: 1 | 2 | 3): { n: number; answer: string; choices: string[] } {
  const n = pick(d <= 2 ? [6, 8, 9, 10, 12, 14, 15, 16] : [12, 16, 18, 20, 24, 28, 30, 36])
  const proper = factorsOf(n).filter(f => f !== 1 && f !== n)
  const correct = pick(proper.length ? proper : factorsOf(n))
  const opts = new Set<string>([String(correct)])
  for (const c of shuffle([correct + 1, correct - 1, correct + 2, correct + 3, n - 1])) { if (opts.size >= 3) break; if (c > 1 && n % c !== 0) opts.add(String(c)) }
  let b = 2; while (opts.size < 3) { const c = correct + b; if (c > 1 && n % c !== 0) opts.add(String(c)); b++ }
  return { n, answer: String(correct), choices: shuffle([...opts]) }
}
function mkEvenOdd(n: number): FlRound { return { qType: 'evenOdd', n, base: 2, prompt: `Is ${n} even or odd?`, tag: 'Pair test', say: `Is ${n} even or odd?`, answer: n % 2 === 0 ? 'Even' : 'Odd', choices: ['Even', 'Odd'] } }
function mkMultiple(base: number): FlRound { const { answer, choices } = multipleChoices(base); return { qType: 'multiple', n: Number(answer), base, prompt: `Which is a multiple of ${base}?`, tag: `Multiples of ${base}`, say: `Which number is a multiple of ${base}?`, answer, choices } }
function mkFactor(d: 1 | 2 | 3): FlRound { const { n, answer, choices } = factorRound(d); return { qType: 'factor', n, base: Number(answer), prompt: `Which is a factor of ${n}?`, tag: `Factors of ${n}`, say: `Which number is a factor of ${n}?`, answer, choices } }
function mkPrime(n: number): FlRound { return { qType: 'prime', n, base: 2, prompt: `Is ${n} prime?`, tag: 'Prime scan', say: `Is ${n} prime?`, answer: isPrime(n) ? 'Yes' : 'No', choices: ['Yes', 'No'] } }
function makeRound(d: 1 | 2 | 3): FlRound {
  const pool: QType[] = d === 1 ? ['evenOdd', 'evenOdd', 'multiple'] : d === 2 ? ['evenOdd', 'multiple', 'factor', 'prime'] : ['multiple', 'factor', 'prime', 'prime']
  const t = pick(pool)
  if (t === 'evenOdd') return mkEvenOdd(rint(2, d === 1 ? 20 : 40))
  if (t === 'multiple') return mkMultiple(pick(d === 1 ? [2, 5] : [2, 3, 4, 5, 10]))
  if (t === 'factor') return mkFactor(d)
  return mkPrime(rint(2, d === 2 ? 20 : 40))
}

// ─── Analyzer visual ───────────────────────────────────────────────────────────────────
function Node({ size, on, warn }: { size: number; on: boolean; warn?: boolean }) {
  return <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0,
    background: on ? (warn ? PT.warn : ACCENT.base) : PT.panelSoft, border: `2px solid ${on ? (warn ? PT.warnDeep : ACCENT.deep) : PT.lineStrong}`,
    boxShadow: on ? (warn ? `0 0 10px ${PT.warn}88` : `0 0 10px ${ACCENT.base}66`) : 'none', transition: 'all .25s cubic-bezier(.34,1.56,.64,1)' }} />
}
function NodeGrid({ n, cols, on, leftover }: { n: number; cols: number; on: number; leftover: number }) {
  const size = n > 24 ? 22 : n > 14 ? 28 : 34
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: Math.round(size * 0.24), justifyContent: 'center' }}>
      {Array.from({ length: n }).map((_, i) => <Node key={i} size={size} on={i < on} warn={i === leftover} />)}
    </div>
  )
}
function MultChips({ base, count, hit }: { base: number; count: number; hit: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 460 }}>
      {Array.from({ length: count }).map((_, i) => {
        const v = base * (i + 1), isHit = v === hit
        return <div key={i} style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 22, padding: '6px 12px', borderRadius: 10,
          background: isHit ? ACCENT.base : ACCENT.soft, color: isHit ? '#06121f' : ACCENT.base, border: `1px solid ${isHit ? ACCENT.base : ACCENT.base + '44'}`,
          boxShadow: isHit ? `0 0 16px ${ACCENT.base}` : 'none', transition: 'all .25s' }}>{v}</div>
      })}
    </div>
  )
}

interface StageState { on: number; revealed: boolean; verdict: string | null; verdictOk: boolean; cols: number; leftover: number; hit: number }
function initState(d: FlRound): StageState {
  if (d.qType === 'evenOdd') return { on: d.n, revealed: false, verdict: null, verdictOk: false, cols: 2, leftover: -1, hit: 0 }
  if (d.qType === 'multiple') return { on: 0, revealed: false, verdict: null, verdictOk: false, cols: 0, leftover: -1, hit: 0 }
  const gc = Math.min(8, Math.max(2, Math.ceil(Math.sqrt(d.n))))
  return { on: d.n, revealed: false, verdict: null, verdictOk: false, cols: gc, leftover: -1, hit: 0 }
}

function Analyzer({ data, s }: { data: FlRound; s: StageState }) {
  const header = data.qType === 'evenOdd' ? `PAIR ${data.n}` : data.qType === 'multiple' ? `SKIP × ${data.base}` : data.qType === 'prime' ? `SCAN ${data.n}` : `SPLIT ${data.n}`
  const big = data.qType === 'multiple' ? data.base : data.n
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '20px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 68, lineHeight: 1, color: PT.ink, letterSpacing: 1, textShadow: `0 0 24px ${ACCENT.base}66` }}>{big}</div>
        {data.qType === 'multiple'
          ? (s.revealed
            ? <MultChips base={data.base} count={Math.min(12, Math.round(Number(data.answer) / data.base))} hit={s.hit} />
            : <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 22, color: ACCENT.base, letterSpacing: 1 }}>{data.base}, {2 * data.base}, {3 * data.base}, …</div>)
          : <NodeGrid n={data.n} cols={s.cols} on={s.on} leftover={s.leftover} />}
        <div style={{ height: 34 }}>
          {s.verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 17, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: s.verdictOk ? PT.ok : ACCENT.base, color: '#06121f', boxShadow: `0 0 18px ${(s.verdictOk ? PT.ok : ACCENT.base)}` }}>{s.verdict}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: FlRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4}><Analyzer data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── reveal builders ────────────────────────────────────────────────────────────────────
function revealState(d: FlRound): StageState {
  const base = initState(d)
  if (d.qType === 'evenOdd') { const odd = d.n % 2 === 1; return { ...base, on: d.n, revealed: true, leftover: odd ? d.n - 1 : -1, verdict: odd ? 'ODD' : 'EVEN', verdictOk: true } }
  if (d.qType === 'multiple') { const v = Number(d.answer); return { ...base, revealed: true, hit: v, verdict: `${v} = ${d.base} × ${v / d.base}`, verdictOk: true } }
  if (d.qType === 'factor') { const f = Number(d.answer); return { ...base, revealed: true, cols: f, on: d.n, verdict: `${d.n} = ${f} × ${d.n / f}`, verdictOk: true } }
  const prime = isPrime(d.n); const sf = smallestFactor(d.n)
  return { ...base, revealed: true, cols: prime ? Math.min(8, d.n) : sf, on: d.n, verdict: prime ? 'PRIME' : `${d.n} = ${sf} × ${d.n / sf}`, verdictOk: prime }
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const FlPlay: React.FC<{ data: FlRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(58, Math.min(short ? 92 : 116, Math.round(Math.min(vw / 6.5, vh / (short ? 4.4 : 5.2)))))
  const [s, setS] = useState<StageState>(() => initState(data))
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
    } else { erred.current = true; speak('Not quite. Look at the analyzer and try again.'); window.setTimeout(() => setPicked(null), 1050) }
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
const FlExplain: React.FC<{ data: FlRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => initState(data))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const rv = revealState(data)
    let lines: string[] = []; let steps: Array<() => void> = []
    if (data.qType === 'evenOdd') {
      const odd = data.n % 2 === 1
      lines = [`Pair up ${data.n} units.`, odd ? `One is left over — so ${data.n} is odd.` : `They pair up perfectly — so ${data.n} is even.`]
      steps = [() => setS(initState(data)), () => setS(rv)]
    } else if (data.qType === 'multiple') {
      const v = Number(data.answer)
      lines = [`Count up in ${data.base}s.`, `${v} is on the list, so ${v} is a multiple of ${data.base}.`]
      steps = [() => setS({ ...initState(data), hit: 0 }), () => setS(rv)]
    } else if (data.qType === 'factor') {
      const f = Number(data.answer)
      lines = [`Split ${data.n} into equal rows.`, `${f} rows fit with no gaps — so ${f} is a factor of ${data.n}. ${data.n} = ${f} × ${data.n / f}.`]
      steps = [() => setS(initState(data)), () => setS(rv)]
    } else {
      const prime = isPrime(data.n)
      lines = [`Try to make a rectangle from ${data.n}.`, prime ? `Only 1 × ${data.n} fits — ${data.n} is prime.` : `${data.n} = ${smallestFactor(data.n)} × ${data.n / smallestFactor(data.n)} — not prime.`]
      steps = [() => setS(initState(data)), () => setS(rv)]
    }
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => window.setTimeout(() => doneRef.current(), 1300), fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Analyze" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: drag n and watch its factors / even-odd / prime status update live ────
function FactorScope() {
  const [n, setN] = useState(12)
  const facs = factorsOf(n)
  const prime = isPrime(n)
  const even = n % 2 === 0
  const cols = Math.min(10, Math.max(2, Math.round(Math.sqrt(n))))
  const size = n > 24 ? 20 : n > 14 ? 26 : 32
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 52, lineHeight: 1, color: PT.ink, textShadow: `0 0 22px ${ACCENT.base}66` }}>{n}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: Math.round(size * 0.24), justifyContent: 'center' }}>
        {Array.from({ length: n }).map((_, i) => <Node key={i} size={size} on warn={!even && i === n - 1} />)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', maxWidth: 420 }}>
        {facs.map(f => <span key={f} style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 15, padding: '3px 9px', borderRadius: 8, background: ACCENT.soft, color: ACCENT.base, border: `1px solid ${ACCENT.base}44` }}>{f}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label="even / odd" value={even ? 'even' : 'odd'} accent={ACCENT} />
        <PtReadout label="factors" value={String(facs.length)} accent={ACCENT} />
        <PtReadout label="prime?" value={prime ? 'yes' : 'no'} accent={ACCENT} warn={prime} />
      </div>
      <PtSlider label="number n" value={n} min={2} max={40} accent={ACCENT} onChange={setN} />
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<FlRound> {
  return {
    skillId: 'factorsMultiples', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => `${d.qType}|${d.n}|${d.base}`,
    prompt: d => d.prompt, say: d => d.say,
    Play: ({ data, onSubmit }) => <FlPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FlExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function FactorLab({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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

  const DEMO: FlRound[] = [mkEvenOdd(7), mkMultiple(5)]
  const GUIDED: FlRound = mkEvenOdd(12)

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
        <IntroCard title="Number Lab" accent={ACCENT} cta="Start analysis"
          body="Milo scans numbers to find what's hiding inside — even or odd, multiples, factors, and primes. Play with the analyzer, then watch a scan and run it yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Run the analyzer" accent={ACCENT} short={short}
          intro="Drag the number and watch what's inside it — is it even or odd? How many factors? Is it prime?"
          onContinue={() => setPhase('demo')}>
          <FactorScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <FlExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · run the analyzer')}
        <FlPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
