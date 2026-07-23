'use client'
/**
 * Chapter (9–11) — TIMES TABLES: multiplication fluency + 2-digit × 1-digit (skill `timesTables`)
 * in the PRE-TEEN "Mission HUD" look (see story/preteen/kit.tsx). A single neon lab — no
 * WorldSelect, no photographic scenes, no sprites: the array/area model is drawn as glowing neon
 * nodes on a dark-glass panel.
 *
 * Multiplication is carried by ROWS × COLUMNS of neon nodes:
 *   • FACT (a × b, both ≤9)  → an ARRAY of a rows × b cols; skip-count the rows (b, 2b, 3b …) to the
 *                              product, shown big in mono.
 *   • TWO-DIGIT (n × k)      → an AREA MODEL: a tens block (a 10 × k neon grid) beside an ones block
 *                              (ones × k neon grid); the two partial products (10×k, ones×k) add to
 *                              the total.
 * This is the "times tables" model (array + place-value split), distinct from the 6–8 equal-groups
 * intro. One continuous adaptive SkillBeat (10 rounds, re-teach after 3 wrong): L1 → facts to 5× ·
 * L2 → facts to 9× + teen × single · L3 → full 2-digit × 1-digit. The demo + 3-wrong re-teach BUILD
 * it via ONE speakSteps (skip-count the array, or split into tens + ones). The instrument is wrapped
 * in FitBox so it's big on any viewport. Code-drawn only. Wrapped by game/TimesTablesChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'

const ACCENT = ACCENTS.coral

// ─── Math ───────────────────────────────────────────────────────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }

function multChoices(answer: number, a: number, b: number): number[] {
  const cands = shuffle([answer + a, answer - a, answer + b, answer - b, answer + 10, answer - 10])
  const opts = new Set<number>([answer])
  for (const c of cands) { if (opts.size >= 3) break; if (c > 0 && c !== answer) opts.add(c) }
  let bump = 1
  while (opts.size < 3) { opts.add(answer + bump); bump++ }
  return shuffle([...opts])
}

type QType = 'fact' | 'twoDigit'
interface TtRound { qType: QType; a: number; b: number; prompt: string; tag: string; say: string; answer: number; choices: number[] }

function mkFact(a: number, b: number): TtRound {
  return { qType: 'fact', a, b, prompt: `${a} × ${b} = ?`, tag: `${a} rows of ${b}`, say: `What is ${a} times ${b}?`, answer: a * b, choices: multChoices(a * b, a, b) }
}
function mkTwo(n: number, k: number): TtRound {
  return { qType: 'twoDigit', a: n, b: k, prompt: `${n} × ${k} = ?`, tag: 'Area model', say: `What is ${n} times ${k}?`, answer: n * k, choices: multChoices(n * k, n, k) }
}
function makeRound(d: 1 | 2 | 3): TtRound {
  const pool: QType[] = d === 1 ? ['fact'] : d === 2 ? ['fact', 'fact', 'twoDigit'] : ['twoDigit', 'twoDigit', 'fact']
  const t = pick(pool)
  if (t === 'fact') { const hi = d === 1 ? 5 : 9; return mkFact(rint(2, hi), rint(2, hi)) }
  const n = d === 2 ? rint(11, 19) : rint(11, 99)
  const k = d === 2 ? rint(2, 4) : rint(2, 9)
  return mkTwo(n, k)
}

// ─── Neon node vocabulary (mirrors FactorLab) ─────────────────────────────────────────
function Node({ size, on, glow }: { size: number; on: boolean; glow?: boolean }) {
  return <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0,
    background: on ? ACCENT.base : PT.panelSoft, border: `2px solid ${on ? ACCENT.deep : PT.lineStrong}`,
    boxShadow: on ? `0 0 ${glow ? 16 : 10}px ${ACCENT.base}${glow ? 'cc' : '66'}` : 'none',
    transform: glow ? 'scale(1.1)' : 'scale(1)', transition: 'all .25s cubic-bezier(.34,1.56,.64,1)' }} />
}

// FACT: an a rows × b cols array; `litRows` reveal top-down, `glowRow` (1-based) pulses.
function NodeArray({ rows, cols, litRows, glowRow }: { rows: number; cols: number; litRows: number; glowRow: number }) {
  const span = Math.max(rows, cols)
  const size = span > 8 ? 20 : span > 6 ? 26 : span > 4 ? 32 : 38
  const gap = Math.max(4, Math.round(size * 0.22))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, alignItems: 'center' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap }}>
          {Array.from({ length: cols }).map((_, c) => <Node key={c} size={size} on={r < litRows} glow={r === glowRow - 1} />)}
        </div>
      ))}
    </div>
  )
}

// Skip-count chips (b, 2b, 3b …) with the reached value highlighted.
function MultChips({ base, count, hit }: { base: number; count: number; hit: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', maxWidth: 440 }}>
      {Array.from({ length: count }).map((_, i) => {
        const v = base * (i + 1), isHit = v <= hit && hit > 0
        return <div key={i} style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 18, padding: '4px 10px', borderRadius: 9,
          background: isHit ? ACCENT.base : ACCENT.soft, color: isHit ? '#06121f' : ACCENT.base, border: `1px solid ${isHit ? ACCENT.base : ACCENT.base + '44'}`,
          boxShadow: v === hit ? `0 0 16px ${ACCENT.base}` : 'none', transition: 'all .25s' }}>{v}</div>
      })}
    </div>
  )
}

// TWO-DIGIT area model: a units × k grid of nodes, dimmed until lit.
function NodeBlock({ units, k, on }: { units: number; k: number; on: boolean }) {
  if (units <= 0) return null
  const size = units > 10 ? 12 : units > 6 ? 16 : 20
  const gap = Math.max(2, Math.round(size * 0.2))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, opacity: on ? 1 : 0.18, transform: `scale(${on ? 1 : 0.94})`, transition: 'all .3s cubic-bezier(.34,1.56,.64,1)' }}>
      {Array.from({ length: k }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap }}>
          {Array.from({ length: units }).map((_, c) => <Node key={c} size={size} on={on} />)}
        </div>
      ))}
    </div>
  )
}
function AreaModel({ n, k, litTens, litOnes, showVals }: { n: number; k: number; litTens: boolean; litOnes: boolean; showVals: boolean }) {
  const tens = Math.floor(n / 10) * 10, ones = n % 10
  const p1 = tens * k, p2 = ones * k
  const Chip = ({ x, val, on }: { x: number; val: number; on: boolean }) => (
    <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 15, color: on ? '#06121f' : ACCENT.base, background: on ? ACCENT.base : ACCENT.soft, border: `1px solid ${ACCENT.base}${on ? '' : '55'}`, borderRadius: 999, padding: '3px 12px', whiteSpace: 'nowrap', boxShadow: on ? `0 0 14px ${ACCENT.base}88` : 'none', opacity: on && showVals ? 1 : 0.25, transition: 'all .3s' }}>{x} × {k} = {val}</div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <NodeBlock units={tens} k={k} on={litTens} />
        <Chip x={tens} val={p1} on={litTens} />
      </div>
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 28, color: ACCENT.base, paddingBottom: 30, opacity: litOnes ? 1 : 0.25, textShadow: `0 0 14px ${ACCENT.base}88` }}>+</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <NodeBlock units={ones} k={k} on={litOnes} />
        <Chip x={ones} val={p2} on={litOnes} />
      </div>
    </div>
  )
}

// ─── Instrument panel ─────────────────────────────────────────────────────────────────
interface StageState { litRows: number; glowRow: number; hit: number; litTens: boolean; litOnes: boolean; showVals: boolean; boxValue: number | null; boxDone: boolean }

function Instrument({ data, s }: { data: TtRound; s: StageState }) {
  const header = data.qType === 'fact' ? `ARRAY ${data.a}×${data.b}` : `AREA ${data.a}×${data.b}`
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.boxDone ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.boxDone ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '20px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {data.qType === 'fact'
          ? (<>
              <NodeArray rows={data.a} cols={data.b} litRows={s.litRows} glowRow={s.glowRow} />
              <MultChips base={data.b} count={data.a} hit={s.hit} />
            </>)
          : <AreaModel n={data.a} k={data.b} litTens={s.litTens} litOnes={s.litOnes} showVals={s.showVals} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 34, color: PT.ink, letterSpacing: 1, textShadow: `0 0 20px ${ACCENT.base}55` }}>{data.a} × {data.b} =</span>
          <div style={{ minWidth: 68, height: 56, padding: '0 12px', borderRadius: 14, border: `2px solid ${s.boxDone ? PT.ok : PT.lineStrong}`,
            background: s.boxDone ? PT.ok : PT.panelSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: s.boxDone ? `0 0 20px ${PT.ok}` : 'none', transition: 'all .3s ease' }}>
            <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 32, color: s.boxDone ? '#04231a' : PT.ink, lineHeight: 1 }}>{s.boxValue ?? '?'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: TtRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4} min={0.3}><Instrument data={data} s={s} /></FitBox>
    </div>
  )
}

const emptyFor = (data: TtRound): StageState => data.qType === 'fact'
  ? { litRows: data.a, glowRow: 0, hit: 0, litTens: true, litOnes: true, showVals: false, boxValue: null, boxDone: false }
  : { litRows: 0, glowRow: 0, hit: 0, litTens: true, litOnes: true, showVals: false, boxValue: null, boxDone: false }

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const TtPlay: React.FC<{ data: TtRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(58, Math.min(short ? 92 : 116, Math.round(Math.min(vw / 6.5, vh / (short ? 4.4 : 5.2)))))
  const [s, setS] = useState<StageState>(() => emptyFor(data))
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)

  useEffect(() => {
    if (mode === 'guided') speak(data.say)
    const t = window.setTimeout(() => setAsking(true), 650)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function reward() {
    if (data.qType === 'fact') {
      let r = 0
      const tick = () => { r++; setS(v => ({ ...v, litRows: data.a, glowRow: r, hit: r * data.b, boxValue: r * data.b })); if (r < data.a) window.setTimeout(tick, 260); else window.setTimeout(() => setS(v => ({ ...v, glowRow: 0, hit: data.answer, boxValue: data.answer, boxDone: true })), 300) }
      tick()
    } else {
      setS(v => ({ ...v, showVals: true, boxValue: data.answer, boxDone: true }))
    }
  }

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === data.answer) {
      done.current = true
      reward()
      if (mode === 'guided') speak('Correct.')
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1700)
    } else { erred.current = true; speak(data.qType === 'twoDigit' ? 'Not quite — split it into tens and ones. Try again.' : 'Not quite — count the rows again. Try once more.'); window.setTimeout(() => setPicked(null), 1050) }
  }

  return (
    <>
      <Stage data={data} s={s} short={short} />
      <PromptCard tag={data.tag} text={data.prompt} accent={ACCENT} short={short} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3vw,28px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {data.choices.map(n => {
          const st: ChoiceState = picked === n ? (n === data.answer ? 'right' : 'wrong') : picked !== null ? 'dim' : 'idle'
          return <ChoiceButton key={n} label={String(n)} accent={ACCENT} state={st} size={btn} onClick={() => choose(n)} disabled={picked !== null} />
        })}
      </div>
    </>
  )
}

// ─── Demo / re-teach: build it via ONE speakSteps ─────────────────────────────────────
const TtExplain: React.FC<{ data: TtRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => data.qType === 'fact'
    ? { litRows: 0, glowRow: 0, hit: 0, litTens: true, litOnes: true, showVals: false, boxValue: null, boxDone: false }
    : { litRows: 0, glowRow: 0, hit: 0, litTens: false, litOnes: false, showVals: false, boxValue: null, boxDone: false })
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    let lines: string[] = []
    let steps: Array<() => void> = []
    if (data.qType === 'fact') {
      const a = data.a, b = data.b
      lines = [
        `${a} rows of ${b}. Count up in ${b}s with me.`,
        `${a} times ${b} is ${data.answer}.`,
      ]
      steps = [
        () => setS(v => ({ ...v, litRows: a, glowRow: 0, hit: data.answer, boxValue: data.answer })),
        () => setS(v => ({ ...v, glowRow: 0, hit: data.answer, boxValue: data.answer, boxDone: true })),
      ]
    } else {
      const n = data.a, k = data.b, tens = Math.floor(n / 10) * 10, ones = n % 10, p1 = tens * k, p2 = ones * k
      lines = [
        `Split ${n} into ${tens} and ${ones}. ${tens} times ${k} is ${p1}, and ${ones} times ${k} is ${p2}.`,
        `${p1} plus ${p2} is ${data.answer}, so ${n} times ${k} is ${data.answer}.`,
      ]
      steps = [
        () => setS(v => ({ ...v, litTens: true, litOnes: true, showVals: true })),
        () => setS(v => ({ ...v, boxValue: data.answer, boxDone: true })),
      ]
    }
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => { window.setTimeout(() => doneRef.current(), 1300) }, fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Analyze" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: slide rows & cols and watch the array + product update live ──────────
function ArrayScope() {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(4)
  const product = rows * cols
  const span = Math.max(rows, cols)
  const size = span > 8 ? 20 : span > 6 ? 26 : span > 4 ? 32 : 38
  const gap = Math.max(4, Math.round(size * 0.22))
  const skip = Array.from({ length: rows }).map((_, i) => cols * (i + 1)).join(', ')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap, alignItems: 'center' }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap }}>
            {Array.from({ length: cols }).map((_, c) => <Node key={c} size={size} on />)}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 32, color: PT.ink, letterSpacing: 1, textShadow: `0 0 20px ${ACCENT.base}55` }}>{rows} × {cols} = {product}</div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label="product" value={String(product)} accent={ACCENT} />
        <PtReadout label={`count up in ${cols}s`} value={skip} accent={ACCENT} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 420 }}>
        <PtSlider label="rows" value={rows} min={1} max={10} accent={ACCENT} onChange={setRows} />
        <PtSlider label="columns" value={cols} min={1} max={10} accent={ACCENT} onChange={setCols} />
      </div>
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<TtRound> {
  return {
    skillId: 'timesTables', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => `${d.qType}|${d.a}x${d.b}`,
    prompt: d => d.prompt,
    say: d => d.say,
    Play: ({ data, onSubmit }) => <TtPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <TtExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function TimesGrid({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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

  const DEMO: TtRound[] = [mkFact(3, 4), mkTwo(12, 4)]
  const GUIDED: TtRound = mkFact(4, 5)

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
        <IntroCard title="Times Grid" accent={ACCENT} cta="Start analysis"
          body="Multiplication laid out as glowing arrays. Count the rows to find a fact, or split a two-digit number into tens and ones. Watch one, then run the grid yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Build an array" accent={ACCENT} short={short}
          intro="Slide the rows and columns — the array grows and the product updates."
          onContinue={() => setPhase('demo')}>
          <ArrayScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <TtExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · run the grid')}
        <TtPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
