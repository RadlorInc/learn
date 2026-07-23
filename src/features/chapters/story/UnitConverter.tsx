'use client'
/**
 * Chapter (9–11) — MEASUREMENT UNITS (skill `measurementUnits`) in the PRE-TEEN "Number Lab" look.
 *
 * Same crisp cool console / HUD chrome / mono-numeral shell as FactorLab (see story/preteen/kit.tsx),
 * Milo the explorer bottom-left. Milo runs a metric CONVERTER:
 *   • CONVERT → single-step metric conversion with clean ×/÷ factors (km↔m, m↔cm, cm↔mm, kg↔g, L↔mL).
 *     A left "input" chip (value + unit), an arrow with a factor-gear chip (× 100 / ÷ 1000), and a
 *     right "output" chip that shows "?" until reveal, then the answer + unit.
 *   • UNIT → pick the sensible unit to measure a thing (pencil → cm, road → km, medicine → mL …).
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3): L1 sensible-unit + simple ×
 * conversions (big→small) · L2 adds ÷ (small→big), still whole · L3 tidy .5 / trickier + mixed.
 * Code-drawn (no photographic scene → no background reuse). Wrapped by game/MeasureUnitsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'

const ACCENT = ACCENTS.amber

// ─── Math ───────────────────────────────────────────────────────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
// tidy number → string (drop trailing .0)
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))))

type QType = 'convert' | 'unit'

// Metric conversion pairs — clean ×/÷ factors only.
interface Pair { big: string; small: string; factor: number }
const PAIRS: Pair[] = [
  { big: 'km', small: 'm', factor: 1000 },
  { big: 'm', small: 'cm', factor: 100 },
  { big: 'cm', small: 'mm', factor: 10 },
  { big: 'kg', small: 'g', factor: 1000 },
  { big: 'L', small: 'mL', factor: 1000 },
]

// Sensible-unit table (item → the unit that best measures it).
interface UnitItem { item: string; answer: string; options: string[] }
const UNIT_ITEMS: UnitItem[] = [
  { item: 'the length of a pencil', answer: 'cm', options: ['cm', 'km', 'm', 'mm'] },
  { item: 'the height of a door', answer: 'm', options: ['m', 'mm', 'km', 'cm'] },
  { item: 'the length of a road', answer: 'km', options: ['km', 'cm', 'mm', 'm'] },
  { item: 'the thickness of a coin', answer: 'mm', options: ['mm', 'm', 'cm', 'km'] },
  { item: 'the mass of an apple', answer: 'g', options: ['g', 'kg', 'mL', 'L'] },
  { item: 'the mass of a person', answer: 'kg', options: ['kg', 'g', 'mL', 'cm'] },
  { item: 'a spoon of medicine', answer: 'mL', options: ['mL', 'L', 'g', 'kg'] },
  { item: 'the water in a bathtub', answer: 'L', options: ['L', 'mL', 'g', 'km'] },
  { item: 'the width of a phone', answer: 'cm', options: ['cm', 'km', 'm', 'L'] },
  { item: 'the distance between two cities', answer: 'km', options: ['km', 'm', 'cm', 'mm'] },
  { item: 'the mass of a feather', answer: 'g', options: ['g', 'kg', 'L', 'km'] },
  { item: 'the juice in a small carton', answer: 'mL', options: ['mL', 'L', 'kg', 'm'] },
]

interface UcRound {
  qType: QType
  // convert fields
  from: string; to: string; value: number; op: '×' | '÷'; factor: number
  // unit field
  item: string
  // shared
  prompt: string; tag: string; say: string; answer: string; choices: string[]; verdict: string
}

// distractors for a convert answer — near/off-by-factor wrong values.
function convertChoices(correct: number, factor: number): string[] {
  const opts = new Set<string>([fmt(correct)])
  const cands = [correct * 10, correct / 10, correct * factor, correct / factor, correct + factor, correct * 100, correct / 100]
  for (const c of shuffle(cands)) {
    if (opts.size >= 3) break
    if (c > 0 && Number.isFinite(c) && fmt(c) !== fmt(correct) && (Number.isInteger(c) || Math.round(c * 2) === c * 2)) opts.add(fmt(c))
  }
  let m = 2; while (opts.size < 3) { const c = correct + factor * m; if (c > 0) opts.add(fmt(c)); m++ }
  return shuffle([...opts])
}

function mkConvert(pair: Pair, dir: 'down' | 'up', value: number): UcRound {
  // 'down' = big→small (multiply); 'up' = small→big (divide).
  const from = dir === 'down' ? pair.big : pair.small
  const to = dir === 'down' ? pair.small : pair.big
  const op: '×' | '÷' = dir === 'down' ? '×' : '÷'
  const correct = dir === 'down' ? value * pair.factor : value / pair.factor
  const verdict = `${fmt(value)} ${from} = ${fmt(correct)} ${to}`
  return {
    qType: 'convert', from, to, value, op, factor: pair.factor, item: '',
    prompt: `${fmt(value)} ${from} = ___ ${to}?`, tag: `${from} → ${to}`,
    say: `How many ${to} is ${fmt(value)} ${from}?`,
    answer: fmt(correct), choices: convertChoices(correct, pair.factor), verdict,
  }
}

function mkUnit(u: UnitItem): UcRound {
  return {
    qType: 'unit', from: '', to: '', value: 0, op: '×', factor: 0, item: u.item,
    prompt: `Which unit best measures ${u.item}?`, tag: 'Best unit',
    say: `Which unit best measures ${u.item}?`,
    answer: u.answer, choices: shuffle(u.options.slice(0, 4)), verdict: u.answer,
  }
}

function makeRound(d: 1 | 2 | 3): UcRound {
  if (d === 1) {
    // sensible unit OR simple big→small whole conversion
    if (Math.random() < 0.5) return mkUnit(pick(UNIT_ITEMS))
    const pair = pick(PAIRS)
    return mkConvert(pair, 'down', rint(2, 9))
  }
  if (d === 2) {
    // both directions, still whole numbers
    if (Math.random() < 0.28) return mkUnit(pick(UNIT_ITEMS))
    const pair = pick(PAIRS)
    if (Math.random() < 0.5) return mkConvert(pair, 'down', rint(2, 12))
    // up (÷): value = multiple of factor so answer is whole
    return mkConvert(pair, 'up', pair.factor * rint(2, 9))
  }
  // d === 3 — trickier: tidy .5 down-conversions + non-whole up-conversions
  const r = Math.random()
  if (r < 0.2) return mkUnit(pick(UNIT_ITEMS))
  const pair = pick(PAIRS)
  if (r < 0.6) {
    // down with a .5 value → still tidy answer (0.5 × factor)
    const value = pick([1.5, 2.5, 3.5, 4.5, 7.5])
    return mkConvert(pair, 'down', value)
  }
  // up (÷) landing on a tidy .5 (e.g. 250 cm = 2.5 m, 500 mL = 0.5 L)
  const halves = pair.factor / 2
  const value = halves * pick([1, 3, 5, 7, 9]) // → x.5 in the big unit
  return mkConvert(pair, 'up', value)
}

// ─── Converter visual (the instrument) ─────────────────────────────────────────────────
function Chip({ big, sub, on, ok }: { big: string; sub: string; on?: boolean; ok?: boolean }) {
  const glow = ok ? PT.ok : ACCENT.base
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 96,
      background: PT.panelSoft, border: `2px solid ${on ? glow : PT.lineStrong}`, borderRadius: 14, padding: '14px 16px',
      boxShadow: on ? `0 0 16px ${glow}66` : 'none', transition: 'all .25s cubic-bezier(.34,1.56,.64,1)' }}>
      <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 40, lineHeight: 1, color: on && ok ? PT.ok : PT.ink, letterSpacing: 1, textShadow: on ? `0 0 20px ${glow}66` : 'none' }}>{big}</span>
      <span style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 15, color: PT.inkMute, letterSpacing: 1 }}>{sub}</span>
    </div>
  )
}
function Gear({ op, factor, on }: { op: '×' | '÷'; factor: number; on: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 19, padding: '6px 13px', borderRadius: 999,
        background: on ? ACCENT.base : ACCENT.soft, color: on ? '#06121f' : ACCENT.base, border: `1px solid ${ACCENT.base}${on ? '' : '44'}`,
        boxShadow: on ? `0 0 16px ${ACCENT.base}` : 'none', letterSpacing: .5, transition: 'all .25s' }}>{op} {factor}</div>
      <span style={{ fontFamily: PT.mono, fontSize: 26, color: on ? ACCENT.base : PT.inkMute, lineHeight: 1, transition: 'color .25s' }}>→</span>
    </div>
  )
}

interface StageState { revealed: boolean; verdict: string | null }
function initState(): StageState { return { revealed: false, verdict: null } }
function revealState(d: UcRound): StageState { return { revealed: true, verdict: d.verdict } }

function Converter({ data, s }: { data: UcRound; s: StageState }) {
  const header = data.qType === 'convert' ? 'CONVERT' : 'UNIT CHECK'
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '24px 26px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        {data.qType === 'convert' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Chip big={fmt(data.value)} sub={data.from} on />
            <Gear op={data.op} factor={data.factor} on={s.revealed} />
            <Chip big={s.revealed ? data.answer : '?'} sub={data.to} on={s.revealed} ok={s.revealed} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: PT.mono, fontSize: 12, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>Measuring</span>
            <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: 24, color: PT.ink, textAlign: 'center', maxWidth: 340, lineHeight: 1.25 }}>{data.item}</div>
            <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 46, color: s.revealed ? PT.ok : ACCENT.base, letterSpacing: 1, textShadow: `0 0 20px ${(s.revealed ? PT.ok : ACCENT.base)}55` }}>{s.revealed ? data.answer : '?'}</div>
          </div>
        )}
        <div style={{ height: 34 }}>
          {s.verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 17, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: PT.ok, color: '#06121f', boxShadow: `0 0 18px ${PT.ok}` }}>{s.verdict}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: UcRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4} min={0.3}><Converter data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const FlPlay: React.FC<{ data: UcRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
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
    } else { erred.current = true; speak('Not quite. Check the converter and try again.'); window.setTimeout(() => setPicked(null), 1050) }
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
const FlExplain: React.FC<{ data: UcRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => initState())
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const rv = revealState(data)
    let lines: string[] = []
    if (data.qType === 'convert') {
      const one = data.op === '×'
        ? `1 ${data.from} is ${data.factor} ${data.to}, so multiply by ${data.factor}.`
        : `${data.factor} ${data.from} make 1 ${data.to}, so divide by ${data.factor}.`
      lines = [`Convert ${fmt(data.value)} ${data.from} to ${data.to}.`, `${one} That gives ${data.answer} ${data.to}. ${data.verdict}.`]
    } else {
      lines = [`Think about how big ${data.item} is.`, `We measure that in ${data.answer}.`]
    }
    const steps: Array<() => void> = [() => setS(initState()), () => setS(rv)]
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => window.setTimeout(() => doneRef.current(), 1300), fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Convert" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: slide the amount + pick a conversion, watch the units convert live ────
function ConverterScope() {
  // 4 of the file's metric pairs: m↔cm, km↔m, kg↔g, L↔mL.
  const opts = useMemo(() => [PAIRS[1], PAIRS[0], PAIRS[3], PAIRS[4]], [])
  const [idx, setIdx] = useState(0)
  const [value, setValue] = useState(3)
  const pair = opts[idx]
  const out = value * pair.factor // big → small (multiply)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      {/* conversion toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {opts.map((p, i) => {
          const on = i === idx
          return (
            <button key={p.big + p.small} onClick={() => setIdx(i)}
              style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 15, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                background: on ? ACCENT.base : ACCENT.soft, color: on ? '#06121f' : ACCENT.base, border: `1px solid ${ACCENT.base}${on ? '' : '44'}`,
                boxShadow: on ? `0 0 14px ${ACCENT.base}` : 'none', transition: 'all .2s' }}>
              {p.big} → {p.small}
            </button>
          )
        })}
      </div>
      {/* live converter panel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip big={fmt(value)} sub={pair.big} on />
        <Gear op="×" factor={pair.factor} on />
        <Chip big={fmt(out)} sub={pair.small} on ok />
      </div>
      {/* readouts */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label={`input (${pair.big})`} value={fmt(value)} accent={ACCENT} />
        <PtReadout label={`output (${pair.small})`} value={fmt(out)} accent={ACCENT} />
      </div>
      <PtSlider label={`${pair.big} in`} value={value} min={1} max={100} accent={ACCENT}
        fmt={(n) => `${fmt(n)} ${pair.big}`} onChange={setValue} />
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<UcRound> {
  return {
    skillId: 'measurementUnits', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => d.qType === 'convert' ? `convert|${d.from}|${d.to}|${fmt(d.value)}` : `unit|${d.item}`,
    prompt: d => d.prompt, say: d => d.say,
    Play: ({ data, onSubmit }) => <FlPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FlExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function UnitConverter({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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

  const DEMO: UcRound[] = [mkConvert(PAIRS[1], 'down', 3), mkUnit(UNIT_ITEMS[0])]
  const GUIDED: UcRound = mkConvert(PAIRS[0], 'down', 2)

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
        <IntroCard title="Unit Lab" accent={ACCENT} cta="Start converting"
          body="Milo runs the metric converter — turn kilometers into meters, liters into milliliters, and pick the right unit for the job. Play with the converter, then watch one and run it yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Convert units" accent={ACCENT} short={short}
          intro="Slide the amount and pick a conversion — watch the units change."
          onContinue={() => setPhase('demo')}>
          <ConverterScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <FlExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · run the converter')}
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
