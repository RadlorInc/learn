'use client'
/**
 * Chapter (9–11) — DATA & GRAPHS (skill `dataGraphs`) in the PRE-TEEN "Number Lab" look.
 *
 * A more grown-up shell than the 3–8 storybook worlds: crisp cool console, blueprint grid, mono
 * numerals, HUD chrome, Milo as an explorer (see story/preteen/kit.tsx). Milo "reads" a bar chart:
 *   • MOST      → which category has the tallest bar
 *   • HOW MANY  → read one bar's value off the chart
 *   • DIFFERENCE→ how many MORE one bar has than another (A − B)
 *   • TOTAL     → add every bar together
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3): L1 most + how-many · L2 adds
 * difference · L3 adds total. Code-drawn (no photographic scene → no background reuse).
 * Wrapped by game/DataGraphsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'

const ACCENT = ACCENTS.magenta

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

type QType = 'most' | 'howMany' | 'diff' | 'total'
interface Cat { label: string; value: number }
interface DdRound { qType: QType; cats: Cat[]; highlight: number[]; prompt: string; tag: string; say: string; answer: string; choices: string[] }

// themed pools of 4-category label sets
const LABEL_SETS: string[][] = [
  ['Red', 'Blue', 'Green', 'Gold'],
  ['Cats', 'Dogs', 'Fish', 'Birds'],
  ['Mon', 'Tue', 'Wed', 'Thu'],
  ['Apple', 'Pear', 'Plum', 'Lime'],
  ['Jump', 'Run', 'Swim', 'Climb'],
  ['Star', 'Moon', 'Sun', 'Comet'],
]

// four distinct values in 1..9 (distinct guarantees a unique max)
function fourDistinct(): number[] {
  const pool = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
  return pool.slice(0, 4)
}

function numChoices(correct: number, spread: number, lo: number): { answer: string; choices: string[] } {
  const opts = new Set<string>([String(correct)])
  for (const c of shuffle([correct + 1, correct - 1, correct + 2, correct - 2, correct + 3, correct - 3])) {
    if (opts.size >= 3) break; if (c >= lo && c !== correct) opts.add(String(c))
  }
  let b = spread + 1; while (opts.size < 3) { const c = correct + b; if (c >= lo) opts.add(String(c)); b++ }
  return { answer: String(correct), choices: shuffle([...opts]) }
}

function makeRound(d: 1 | 2 | 3): DdRound {
  const pool: QType[] = d === 1 ? ['most', 'most', 'howMany'] : d === 2 ? ['most', 'howMany', 'diff', 'diff'] : ['howMany', 'diff', 'total', 'total']
  const t = pick(pool)
  const labels = pick(LABEL_SETS)
  const values = fourDistinct()
  const cats: Cat[] = labels.map((label, i) => ({ label, value: values[i] }))

  if (t === 'most') {
    let top = 0; for (let i = 1; i < cats.length; i++) if (cats[i].value > cats[top].value) top = i
    return { qType: 'most', cats, highlight: [top], prompt: 'Which had the most?', tag: 'Read the chart', say: 'Which one had the most?', answer: cats[top].label, choices: shuffle(cats.map(c => c.label)) }
  }
  if (t === 'howMany') {
    const idx = rint(0, 3); const c = cats[idx]
    const { answer, choices } = numChoices(c.value, 1, 1)
    return { qType: 'howMany', cats, highlight: [idx], prompt: `How many ${c.label}?`, tag: 'Read one bar', say: `How many ${c.label}?`, answer, choices }
  }
  if (t === 'diff') {
    // pick two indices where a > b
    const order = shuffle([0, 1, 2, 3])
    let a = order[0], b = order[1]
    if (cats[a].value < cats[b].value) { const tmp = a; a = b; b = tmp }
    const diff = cats[a].value - cats[b].value
    const { answer, choices } = numChoices(diff, 1, 1)
    return { qType: 'diff', cats, highlight: [a, b], prompt: `How many more ${cats[a].label} than ${cats[b].label}?`, tag: 'Compare bars', say: `How many more ${cats[a].label} than ${cats[b].label}?`, answer, choices }
  }
  const total = cats.reduce((s, c) => s + c.value, 0)
  const { answer, choices } = numChoices(total, 2, 4)
  return { qType: 'total', cats, highlight: [0, 1, 2, 3], prompt: 'How many altogether?', tag: 'Add every bar', say: 'How many altogether?', answer, choices }
}

// ─── Bar chart visual ───────────────────────────────────────────────────────────────────
function BarChart({ cats, highlight, revealed }: { cats: Cat[]; highlight: number[]; revealed: boolean }) {
  const max = Math.max(...cats.map(c => c.value), 1)
  const H = 200 // px for the tallest bar
  const barW = 46
  const hl = new Set(highlight)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, padding: '6px 6px 0' }}>
      {cats.map((c, i) => {
        const lit = revealed && hl.has(i)
        const h = Math.round((c.value / max) * H)
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: PT.mono, fontWeight: revealed ? 800 : 600, fontSize: 20, lineHeight: 1,
              color: lit ? '#06121f' : revealed ? PT.ink : PT.inkMute,
              background: lit ? ACCENT.base : 'transparent', borderRadius: 7, padding: lit ? '2px 8px' : '2px 0',
              boxShadow: lit ? `0 0 14px ${ACCENT.base}` : 'none', opacity: revealed ? 1 : 0.5, transition: 'all .25s' }}>{c.value}</div>
            <div style={{ width: barW, height: h, borderRadius: '6px 6px 2px 2px', flexShrink: 0,
              background: lit ? ACCENT.base : ACCENT.soft, border: `2px solid ${lit ? ACCENT.deep : ACCENT.base + '55'}`,
              boxShadow: lit ? `0 0 16px ${ACCENT.base}88` : 'none', transition: 'all .3s cubic-bezier(.34,1.56,.64,1)' }} />
            <div style={{ fontFamily: PT.mono, fontSize: 13, letterSpacing: .5, color: lit ? ACCENT.base : PT.inkSoft, fontWeight: lit ? 700 : 500, textTransform: 'uppercase', transition: 'all .25s' }}>{c.label}</div>
          </div>
        )
      })}
    </div>
  )
}

interface StageState { revealed: boolean; verdict: string | null; verdictOk: boolean }
function initState(): StageState { return { revealed: false, verdict: null, verdictOk: false } }
function verdictFor(d: DdRound): string {
  if (d.qType === 'most') return d.answer
  if (d.qType === 'howMany') return `${d.cats[d.highlight[0]].label} = ${d.answer}`
  if (d.qType === 'diff') { const [a, b] = d.highlight; return `${d.cats[a].value} − ${d.cats[b].value} = ${d.answer}` }
  return `sum = ${d.answer}`
}
function revealState(d: DdRound): StageState { return { revealed: true, verdict: verdictFor(d), verdictOk: true } }

function Chart({ data, s }: { data: DdRound; s: StageState }) {
  const header = data.qType === 'most' ? 'FIND MAX' : data.qType === 'howMany' ? 'READ BAR' : data.qType === 'diff' ? 'COMPARE' : 'SUM ALL'
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 320, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '20px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <BarChart cats={data.cats} highlight={data.highlight} revealed={s.revealed} />
        <div style={{ height: 34 }}>
          {s.verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 17, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: s.verdictOk ? PT.ok : ACCENT.base, color: '#06121f', boxShadow: `0 0 18px ${(s.verdictOk ? PT.ok : ACCENT.base)}` }}>{s.verdict}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: DdRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4}><Chart data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const FlPlay: React.FC<{ data: DdRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
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
    } else { erred.current = true; speak('Not quite. Read the chart and try again.'); window.setTimeout(() => setPicked(null), 1050) }
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
const FlExplain: React.FC<{ data: DdRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => initState())
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const rv = revealState(data)
    let lines: string[] = []
    if (data.qType === 'most') {
      const top = data.highlight[0]; const c = data.cats[top]
      lines = ['Look for the tallest bar.', `${c.label} reaches highest with ${c.value} — so ${c.label} has the most.`]
    } else if (data.qType === 'howMany') {
      const c = data.cats[data.highlight[0]]
      lines = [`Find the ${c.label} bar.`, `Read the number on top — ${c.label} is ${c.value}.`]
    } else if (data.qType === 'diff') {
      const [a, b] = data.highlight; const A = data.cats[a], B = data.cats[b]
      lines = [`Compare ${A.label} and ${B.label}.`, `${A.label} has ${A.value}, ${B.label} has ${B.value} — ${A.value} take away ${B.value} is ${data.answer} more.`]
    } else {
      const parts = data.cats.map(c => c.value).join(' + ')
      lines = ['Add every bar together.', `${parts} = ${data.answer} altogether.`]
    }
    const steps: Array<() => void> = [() => setS(initState()), () => setS(rv)]
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => window.setTimeout(() => doneRef.current(), 1300), fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Read" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: slide four bars and watch the chart, the "most", and the total update live ──
function ChartScope() {
  const LABELS = ['Red', 'Blue', 'Green', 'Gold']
  const [vals, setVals] = useState([4, 7, 3, 5])
  const cats: Cat[] = LABELS.map((label, i) => ({ label, value: vals[i] }))
  let top = 0; for (let i = 1; i < cats.length; i++) if (cats[i].value > cats[top].value) top = i
  const total = vals.reduce((s, v) => s + v, 0)
  const setAt = (i: number) => (v: number) => setVals(prev => { const r = prev.slice(); r[i] = v; return r })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <BarChart cats={cats} highlight={[top]} revealed />
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label="most" value={cats[top].label} accent={ACCENT} />
        <PtReadout label="total" value={String(total)} accent={ACCENT} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
        {LABELS.map((label, i) => (
          <PtSlider key={label} label={label} value={vals[i]} min={0} max={10} accent={ACCENT} onChange={setAt(i)} />
        ))}
      </div>
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<DdRound> {
  return {
    skillId: 'dataGraphs', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => `${d.qType}|${d.cats.map(c => c.value).join(',')}|${d.answer}`,
    prompt: d => d.prompt, say: d => d.say,
    Play: ({ data, onSubmit }) => <FlPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FlExplain data={data} onDone={onDone} />,
  }
}

// deterministic demo/guided rounds (small fixed datasets)
function fixedRound(qType: QType, cats: Cat[]): DdRound {
  if (qType === 'most') {
    let top = 0; for (let i = 1; i < cats.length; i++) if (cats[i].value > cats[top].value) top = i
    return { qType, cats, highlight: [top], prompt: 'Which had the most?', tag: 'Read the chart', say: 'Which one had the most?', answer: cats[top].label, choices: shuffle(cats.map(c => c.label)) }
  }
  // howMany fixed on the second bar
  const idx = 1; const c = cats[idx]
  const { answer, choices } = numChoices(c.value, 1, 1)
  return { qType: 'howMany', cats, highlight: [idx], prompt: `How many ${c.label}?`, tag: 'Read one bar', say: `How many ${c.label}?`, answer, choices }
}

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function DataDeck({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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

  const DEMO: DdRound[] = [
    fixedRound('most', [{ label: 'Red', value: 4 }, { label: 'Blue', value: 7 }, { label: 'Green', value: 3 }, { label: 'Gold', value: 5 }]),
    fixedRound('howMany', [{ label: 'Cats', value: 5 }, { label: 'Dogs', value: 8 }, { label: 'Fish', value: 2 }, { label: 'Birds', value: 4 }]),
  ]
  const GUIDED: DdRound = fixedRound('most', [{ label: 'Mon', value: 6 }, { label: 'Tue', value: 3 }, { label: 'Wed', value: 9 }, { label: 'Thu', value: 5 }])

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
        <IntroCard title="Data Deck" accent={ACCENT} cta="Start reading"
          body="Milo reads bar charts to find the answers hiding in the data — which has the most, how many, the difference, and the total. Watch one, then read the charts yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Build the chart" accent={ACCENT} short={short}
          intro="Slide each bar — which is the most? What's the total?"
          onContinue={() => setPhase('demo')}>
          <ChartScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <FlExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · read the chart')}
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
