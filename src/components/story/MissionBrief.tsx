'use client'
/**
 * Chapter (9–11) — WORD PROBLEMS (skill `wordProblems`) in the PRE-TEEN "Number Lab" look.
 *
 * A more grown-up shell than the 3–8 storybook worlds: crisp cool console, neon accents, mono
 * numerals, HUD chrome, Milo as an explorer (see story/preteen/kit.tsx). This chapter is TEXT-forward.
 * The instrument is a "MISSION BRIEF" — a dark-glass panel holding the full problem STORY, with a
 * numeric READOUT that stays "?" until reveal, then shows the worked equation + answer:
 *   • L1 → one-step add / subtract within 100
 *   • L2 → one-step multiply / divide with clean numbers
 *   • L3 → TWO-STEP mixed (e.g. 3 boxes of 6, give away 4)
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3). Code-drawn (no photographic scene
 * → no background reuse). Wrapped by game/WordProblemsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'

const ACCENT = ACCENTS.rose

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

type Op = 'add' | 'sub' | 'mul' | 'div' | 'mul_sub' | 'mul_add'
interface WpRound {
  op: Op; a: number; b: number; c: number    // c unused for one-step (kept for sig/reveal)
  story: string; equation: string; answer: number
  prompt: string; tag: string; say: string
  choices: string[]
}

// theme vocab — countable "space cargo" nouns; keep answers positive integers
const ITEMS = ['crystals', 'rovers', 'bolts', 'cells', 'samples', 'crates']

// build 3 numeric choices: correct + two plausible near/wrong-op distractors
function choicesFor(answer: number, distractors: number[]): string[] {
  const opts = new Set<number>([answer])
  for (const d of distractors) { if (opts.size >= 3) break; if (d > 0 && d !== answer) opts.add(d) }
  let k = 1
  while (opts.size < 3) { for (const cand of [answer + k, answer - k]) { if (cand > 0 && !opts.has(cand)) { opts.add(cand); break } } k++ }
  return shuffle([...opts].slice(0, 3).map(String))
}

function mkAdd(): WpRound {
  const it = pick(ITEMS), a = rint(21, 48), b = rint(14, 41)
  const ans = a + b
  return { op: 'add', a, b, c: 0, story: `Milo collects ${a} ${it} on Monday and ${b} more on Tuesday. How many ${it} in all?`,
    equation: `${a} + ${b} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo collects ${a} ${it} on Monday and ${b} more on Tuesday. How many ${it} in all?`,
    choices: choicesFor(ans, [Math.abs(a - b), ans + 10, ans - 10]) }
}
function mkSub(): WpRound {
  const it = pick(ITEMS), a = rint(45, 90), b = rint(12, a - 5)
  const ans = a - b
  return { op: 'sub', a, b, c: 0, story: `Milo starts with ${a} ${it} and uses ${b} of them. How many ${it} are left?`,
    equation: `${a} − ${b} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo starts with ${a} ${it} and uses ${b} of them. How many ${it} are left?`,
    choices: choicesFor(ans, [a + b, ans + 1, ans - 1]) }
}
function mkMul(): WpRound {
  const it = pick(ITEMS), a = rint(3, 9), b = rint(4, 9)
  const ans = a * b
  return { op: 'mul', a, b, c: 0, story: `Milo packs ${b} ${it} into each of ${a} crates. How many ${it} altogether?`,
    equation: `${a} × ${b} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo packs ${b} ${it} into each of ${a} crates. How many ${it} altogether?`,
    choices: choicesFor(ans, [a + b, ans + b, ans - a]) }
}
function mkDiv(): WpRound {
  const it = pick(ITEMS), b = rint(3, 8), q = rint(3, 8)
  const a = b * q, ans = q
  return { op: 'div', a, b, c: 0, story: `A bay holds ${a} ${it} shared equally into ${b} racks. How many ${it} per rack?`,
    equation: `${a} ÷ ${b} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `A bay holds ${a} ${it} shared equally into ${b} racks. How many ${it} per rack?`,
    choices: choicesFor(ans, [a - b, ans + 1, ans + 2]) }
}
function mkMulSub(): WpRound {
  const it = pick(ITEMS), a = rint(3, 6), b = rint(4, 7), c = rint(2, a * b - 2)
  const ans = a * b - c
  return { op: 'mul_sub', a, b, c, story: `Milo has ${a} boxes of ${b} ${it}, then gives away ${c}. How many ${it} are left?`,
    equation: `${a} × ${b} − ${c} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo has ${a} boxes of ${b} ${it}, then gives away ${c}. How many ${it} are left?`,
    choices: choicesFor(ans, [a * b, a * b + c, ans - 1]) }
}
function mkMulAdd(): WpRound {
  const it = pick(ITEMS), a = rint(3, 6), b = rint(4, 7), c = rint(2, 9)
  const ans = a * b + c
  return { op: 'mul_add', a, b, c, story: `Milo buys ${a} packs of ${b} ${it}, then finds ${c} more. How many ${it} in total?`,
    equation: `${a} × ${b} + ${c} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo buys ${a} packs of ${b} ${it}, then finds ${c} more. How many ${it} in total?`,
    choices: choicesFor(ans, [a * b, a + b + c, ans + 1]) }
}

function makeRound(d: 1 | 2 | 3): WpRound {
  if (d === 1) return pick([mkAdd, mkSub])()
  if (d === 2) return pick([mkMul, mkDiv])()
  return pick([mkMulSub, mkMulAdd])()
}

// ─── Mission Brief instrument ───────────────────────────────────────────────────────────
interface StageState { revealed: boolean }

function BriefPanel({ data, s }: { data: WpRound; s: StageState }) {
  return (
    <div style={{ position: 'relative', width: 'min(78vw,460px)', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>Mission Brief</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '18px 22px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontFamily: PT.sans, fontWeight: 500, fontSize: 'clamp(15px,2.4vh,20px)', lineHeight: 1.5, color: PT.ink }}>{data.story}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: PT.panelSoft, border: `1px solid ${PT.line}`, borderRadius: 12, padding: '10px 16px' }}>
          <span style={{ fontFamily: PT.mono, fontSize: 10.5, letterSpacing: 1.2, color: PT.inkMute, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Readout</span>
          {s.revealed
            ? <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 'clamp(18px,3vh,26px)', color: PT.ink, letterSpacing: .5, textShadow: `0 0 18px ${ACCENT.base}66`, animation: 'pt_pop .4s ease both' }}>{data.equation}</span>
            : <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 'clamp(20px,3.2vh,30px)', color: ACCENT.base, letterSpacing: 2, textShadow: `0 0 18px ${ACCENT.base}66`, animation: 'pt_blink 1.4s ease-in-out infinite' }}>?</span>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: WpRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={1.6}><BriefPanel data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const FlPlay: React.FC<{ data: WpRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(58, Math.min(short ? 92 : 116, Math.round(Math.min(vw / 6.5, vh / (short ? 4.4 : 5.2)))))
  const [s, setS] = useState<StageState>({ revealed: false })
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
    if (Number(c) === data.answer) {
      done.current = true; setS({ revealed: true })
      if (mode === 'guided') speak('Correct.')
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1600)
    } else { erred.current = true; speak('Not quite. Read the brief again and try once more.'); window.setTimeout(() => setPicked(null), 1050) }
  }
  return (
    <>
      <Stage data={data} s={s} short={short} />
      <PromptCard tag={data.tag} text={data.prompt} accent={ACCENT} short={short} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3vw,28px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {data.choices.map(c => {
          const st: ChoiceState = picked === c ? (Number(c) === data.answer ? 'right' : 'wrong') : picked !== null ? 'dim' : 'idle'
          return <ChoiceButton key={c} label={c} accent={ACCENT} state={st} size={btn} onClick={() => choose(c)} disabled={picked !== null} />
        })}
      </div>
    </>
  )
}

// ─── Demo / re-teach ───────────────────────────────────────────────────────────────────
function stepLine(data: WpRound): string {
  switch (data.op) {
    case 'add': return `Both days join together, so add them: ${data.equation}.`
    case 'sub': return `Some are used up, so subtract: ${data.equation}.`
    case 'mul': return `Equal groups, so multiply: ${data.equation}.`
    case 'div': return `Shared equally, so divide: ${data.equation}.`
    case 'mul_sub': return `First multiply ${data.a} × ${data.b}, then subtract ${data.c}: ${data.equation}.`
    case 'mul_add': return `First multiply ${data.a} × ${data.b}, then add ${data.c}: ${data.equation}.`
  }
}
const FlExplain: React.FC<{ data: WpRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>({ revealed: false })
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lines = [`Here's the brief. ${data.story}`, stepLine(data)]
    const steps: Array<() => void> = [() => setS({ revealed: false }), () => setS({ revealed: true })]
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => window.setTimeout(() => doneRef.current(), 1300), fallbackStepMs: 2600 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Brief" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: change a, b and the operation → watch the story turn into an equation ──
type SimOp = 'add' | 'sub' | 'mul'
const SIM_SYM: Record<SimOp, string> = { add: '+', sub: '−', mul: '×' }
function simResult(op: SimOp, a: number, b: number): number {
  return op === 'add' ? a + b : op === 'sub' ? a - b : a * b
}
function simStory(op: SimOp, a: number, b: number): string {
  return op === 'add' ? `Milo has ${a} crates and gets ${b} more.`
    : op === 'sub' ? `Milo has ${a} crates and gives away ${b}.`
    : `Milo has ${a} crates with ${b} bolts in each.`
}
function BriefScope() {
  const [op, setOp] = useState<SimOp>('add')
  const [a, setA] = useState(8)
  const [b, setB] = useState(5)
  const result = simResult(op, a, b)
  const warn = result < 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      {/* live one-line word scenario, in the brief-panel style */}
      <div style={{ position: 'relative', width: 'min(82vw,440px)', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 14, boxShadow: `0 0 26px ${ACCENT.base}22`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
          <span style={{ fontFamily: PT.mono, fontSize: 10.5, letterSpacing: 1.4, color: PT.inkMute, textTransform: 'uppercase' }}>Story</span>
        </div>
        <p style={{ margin: 0, padding: '14px 18px', fontFamily: PT.sans, fontWeight: 500, fontSize: 'clamp(15px,2.2vh,19px)', lineHeight: 1.5, color: PT.ink }}>{simStory(op, a, b)}</p>
      </div>
      {/* equation readout in mono */}
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 'clamp(24px,4.4vh,40px)', color: warn ? PT.warn : PT.ink, letterSpacing: 1, textShadow: `0 0 22px ${(warn ? PT.warn : ACCENT.base)}66` }}>
        {a} {SIM_SYM[op]} {b} = {result}
      </div>
      {/* readout tiles: the two operands + the result */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label="first number" value={String(a)} accent={ACCENT} />
        <PtReadout label="second number" value={String(b)} accent={ACCENT} />
        <PtReadout label="answer" value={String(result)} accent={ACCENT} warn={warn} />
      </div>
      {/* operation toggle */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {(['add', 'sub', 'mul'] as SimOp[]).map(o => {
          const on = op === o
          return <button key={o} onClick={() => setOp(o)} style={{ cursor: 'pointer', fontFamily: PT.mono, fontWeight: 800, fontSize: 22, width: 48, height: 44, borderRadius: 11,
            background: on ? ACCENT.base : ACCENT.soft, color: on ? '#06121f' : ACCENT.base, border: `1px solid ${on ? ACCENT.base : ACCENT.base + '44'}`,
            boxShadow: on ? `0 0 16px ${ACCENT.base}` : 'none', transition: 'all .2s' }}>{SIM_SYM[o]}</button>
        })}
      </div>
      {/* number sliders */}
      <PtSlider label="first number" value={a} min={0} max={20} accent={ACCENT} onChange={setA} />
      <PtSlider label="second number" value={b} min={0} max={20} accent={ACCENT} onChange={setB} />
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<WpRound> {
  return {
    skillId: 'wordProblems', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => `${d.op}|${d.a}|${d.b}|${d.c || ''}`,
    // Return '' so SkillBeat renders no prompt pill (the brief text lives in the Stage
    // panel + FlPlay's PromptCard). `say` still speaks the full story on each round.
    prompt: () => '', say: d => d.say,
    Play: ({ data, onSubmit }) => <FlPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FlExplain data={data} onDone={onDone} />,
  }
}

// hand-built demo/guided rounds (deterministic, clean numbers)
const DEMO_ADD: WpRound = { op: 'add', a: 34, b: 28, c: 0, story: 'Milo collects 34 crystals on Monday and 28 more on Tuesday. How many crystals in all?', equation: '34 + 28 = 62', answer: 62, prompt: 'Solve the brief.', tag: 'Mission', say: 'Milo collects 34 crystals on Monday and 28 more on Tuesday. How many crystals in all?', choices: ['62', '52', '6'] }
const DEMO_MUL: WpRound = { op: 'mul', a: 6, b: 7, c: 0, story: 'Milo packs 7 rovers into each of 6 crates. How many rovers altogether?', equation: '6 × 7 = 42', answer: 42, prompt: 'Solve the brief.', tag: 'Mission', say: 'Milo packs 7 rovers into each of 6 crates. How many rovers altogether?', choices: ['42', '13', '48'] }
const GUIDED: WpRound = { op: 'add', a: 23, b: 15, c: 0, story: 'Milo finds 23 bolts, then finds 15 more. How many bolts does he have?', equation: '23 + 15 = 38', answer: 38, prompt: 'Solve the brief.', tag: 'Mission', say: 'Milo finds 23 bolts, then finds 15 more. How many bolts does he have?', choices: ['38', '28', '8'] }

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function MissionBrief({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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

  const DEMO: WpRound[] = [DEMO_ADD, DEMO_MUL]

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
        <IntroCard title="Mission Brief" accent={ACCENT} cta="Open first brief"
          body="Milo gets a mission brief — a short story with the numbers he needs. Read it, figure out the step, and solve. Watch one, then run the readout yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Read the brief" accent={ACCENT} short={short}
          intro="Change the numbers and the operation — see how the story turns into an equation."
          onContinue={() => setPhase('demo')}>
          <BriefScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <FlExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · solve the brief')}
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
