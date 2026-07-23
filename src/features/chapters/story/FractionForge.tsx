'use client'
/**
 * Chapter (9–11) — COMPARE FRACTIONS (skill `fractionsCompare`) in the PRE-TEEN "Number Lab" look.
 *
 * A more grown-up shell than the 3–8 storybook worlds: crisp cool console, blueprint grid, mono
 * numerals, HUD chrome, Milo as an explorer (see story/preteen/kit.tsx). Milo "forges" fractions on a
 * horizontal FRACTION BAR — a rounded strip split into `den` equal segments, `num` shaded:
 *   • NAME    → one bar, read what fraction is shaded (num/den)
 *   • COMPARE → two same-denominator bars, pick the greater fraction
 *   • OP      → two bars added or subtracted (same denominator) → the resulting fraction
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3): L1 name + compare (small dens) ·
 * L2 adds +  · L3 adds −, bigger dens. Code-drawn (no photographic scene → no background reuse).
 * Wrapped by game/FractionsCompareChapter.tsx.  Preview: /story?ch=fcompare
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'

const ACCENT = ACCENTS.teal

// ─── Math ───────────────────────────────────────────────────────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }

type QType = 'name' | 'compare' | 'op'
interface FrRound {
  type: QType
  den: number
  num?: number          // name
  a?: number; b?: number // compare / op
  op?: '+' | '−'         // op
  prompt: string
  tag: string
  say: string
  answer: string
  choices: string[]
}

const frac = (n: number, d: number) => `${n}/${d}`

// name — a plausible wrong fraction set with the same (or near) denominator
function nameChoices(num: number, den: number): string[] {
  const correct = frac(num, den)
  const opts = new Set<string>([correct])
  for (const cand of shuffle([frac(num + 1, den), frac(num - 1, den), frac(num, den + 1), frac(num, Math.max(2, den - 1)), frac(Math.max(1, num - 1), Math.max(2, den + 1))])) {
    if (opts.size >= 3) break
    if (cand !== correct) opts.add(cand)
  }
  let k = 2; while (opts.size < 3) { const cand = frac(Math.min(den, num + k), den + 1); if (cand !== correct) opts.add(cand); k++ }
  return shuffle([...opts])
}
// op — correct + 2 near fractions on the same denominator
function opChoices(res: number, den: number): string[] {
  const correct = frac(res, den)
  const opts = new Set<string>([correct])
  for (const c of shuffle([res + 1, res - 1, res + 2, res - 2])) {
    if (opts.size >= 3) break
    if (c >= 0 && c <= den && c !== res) opts.add(frac(c, den))
  }
  let k = 1; while (opts.size < 3) { const c = ((res + k) % (den + 1)); if (c !== res && c >= 0) opts.add(frac(c, den)); k++ }
  return shuffle([...opts])
}

function mkName(den: number): FrRound {
  const num = rint(1, den - 1)
  return { type: 'name', den, num, prompt: 'What fraction is shaded?', tag: 'Read the bar', say: 'What fraction is shaded?', answer: frac(num, den), choices: nameChoices(num, den) }
}
function mkCompare(den: number): FrRound {
  let a = rint(1, den - 1), b = rint(1, den - 1)
  while (a === b) b = rint(1, den - 1)
  const hi = Math.max(a, b), lo = Math.min(a, b)
  return { type: 'compare', den, a, b, prompt: 'Which is greater?', tag: 'Compare bars', say: 'Which fraction is greater?', answer: frac(hi, den), choices: shuffle([frac(a, den), frac(b, den)]) }
}
function mkOp(den: number, op: '+' | '−'): FrRound {
  let a: number, b: number, res: number
  if (op === '+') { a = rint(1, den - 1); b = rint(1, den - a); res = a + b }
  else { a = rint(2, den - 1); b = rint(1, a - 1); res = a - b }
  return { type: 'op', den, a, b, op, prompt: `${frac(a, den)} ${op} ${frac(b, den)} = ?`, tag: op === '+' ? 'Add bars' : 'Subtract bars', say: `${a} ${op === '+' ? 'plus' : 'minus'} ${b} ${den}ths. What is the answer?`, answer: frac(res, den), choices: opChoices(res, den) }
}

function makeRound(d: 1 | 2 | 3): FrRound {
  if (d === 1) {
    if (Math.random() < 0.5) return mkName(pick([2, 3, 4]))
    return mkCompare(pick([2, 3, 4]))
  }
  if (d === 2) {
    const t = pick<QType>(['name', 'compare', 'op'])
    if (t === 'name') return mkName(pick([2, 3, 4, 5, 6]))
    if (t === 'compare') return mkCompare(pick([3, 4, 5, 6]))
    return mkOp(pick([3, 4, 5, 6]), '+')
  }
  const t = pick<QType>(['name', 'compare', 'op', 'op'])
  if (t === 'name') return mkName(pick([4, 5, 6, 8]))
  if (t === 'compare') return mkCompare(pick([5, 6, 8]))
  return mkOp(pick([5, 6, 8]), Math.random() < 0.5 ? '+' : '−')
}

// ─── Fraction-bar instrument ───────────────────────────────────────────────────────────
function Bar({ den, shaded }: { den: number; shaded: number }) {
  const w = den > 6 ? 40 : den > 4 ? 50 : 62
  return (
    <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 12, background: PT.panelSoft, border: `1px solid ${PT.lineStrong}` }}>
      {Array.from({ length: den }).map((_, i) => {
        const on = i < shaded
        return <div key={i} style={{ width: w, height: 46, borderRadius: 7, flexShrink: 0,
          background: on ? ACCENT.base : PT.panelSoft, border: `2px solid ${on ? ACCENT.deep : PT.lineStrong}`,
          boxShadow: on ? `0 0 12px ${ACCENT.base}77` : 'none', transition: 'all .25s cubic-bezier(.34,1.56,.64,1)' }} />
      })}
    </div>
  )
}

interface StageState { shownA: number; shownB: number; revealed: boolean; verdict: string | null; verdictOk: boolean }
function initState(d: FrRound): StageState {
  if (d.type === 'name') return { shownA: 0, shownB: 0, revealed: false, verdict: null, verdictOk: false }
  return { shownA: d.a ?? 0, shownB: d.b ?? 0, revealed: false, verdict: null, verdictOk: false }
}
function revealState(d: FrRound): StageState {
  if (d.type === 'name') return { shownA: d.num ?? 0, shownB: 0, revealed: true, verdict: frac(d.num ?? 0, d.den), verdictOk: true }
  if (d.type === 'compare') {
    const hi = Math.max(d.a ?? 0, d.b ?? 0), lo = Math.min(d.a ?? 0, d.b ?? 0)
    return { shownA: d.a ?? 0, shownB: d.b ?? 0, revealed: true, verdict: `${frac(hi, d.den)} > ${frac(lo, d.den)}`, verdictOk: true }
  }
  const res = d.op === '+' ? (d.a ?? 0) + (d.b ?? 0) : (d.a ?? 0) - (d.b ?? 0)
  return { shownA: d.a ?? 0, shownB: d.b ?? 0, revealed: true, verdict: `${frac(d.a ?? 0, d.den)} ${d.op} ${frac(d.b ?? 0, d.den)} = ${frac(res, d.den)}`, verdictOk: true }
}

function Forge({ data, s }: { data: FrRound; s: StageState }) {
  const header = data.type === 'name' ? `READ /${data.den}` : data.type === 'compare' ? `CMP /${data.den}` : `${data.op === '+' ? 'ADD' : 'SUB'} /${data.den}`
  const big = data.type === 'name' ? `?/${data.den}` : data.type === 'compare' ? '?  ?' : `${frac(data.a ?? 0, data.den)} ${data.op} ${frac(data.b ?? 0, data.den)}`
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '20px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 40, lineHeight: 1, color: PT.ink, letterSpacing: 1, textShadow: `0 0 24px ${ACCENT.base}66` }}>{big}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <Bar den={data.den} shaded={s.shownA} />
          {data.type !== 'name' && (<>
            {data.type === 'op' && <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 30, color: ACCENT.base, lineHeight: .5 }}>{data.op}</div>}
            <Bar den={data.den} shaded={s.shownB} />
          </>)}
        </div>
        <div style={{ height: 34 }}>
          {s.verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 17, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: s.verdictOk ? PT.ok : ACCENT.base, color: '#06121f', boxShadow: `0 0 18px ${(s.verdictOk ? PT.ok : ACCENT.base)}`, whiteSpace: 'nowrap' }}>{s.verdict}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: FrRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4} min={0.3}><Forge data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const FrPlay: React.FC<{ data: FrRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(58, Math.min(short ? 92 : 116, Math.round(Math.min(vw / 6.5, vh / (short ? 4.4 : 5.2)))))
  const [s, setS] = useState<StageState>(() => (data.type === 'name' ? revealState(data) : initState(data)))
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
    } else { erred.current = true; speak('Not quite. Look at the bar and try again.'); window.setTimeout(() => setPicked(null), 1050) }
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
const FrExplain: React.FC<{ data: FrRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => initState(data))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const rv = revealState(data)
    let lines: string[] = []; let steps: Array<() => void> = []
    if (data.type === 'name') {
      lines = [`This bar has ${data.den} equal parts.`, `${data.num} are shaded — so ${data.num}/${data.den} is shaded.`]
      steps = [() => setS(initState(data)), () => setS(rv)]
    } else if (data.type === 'compare') {
      const hi = Math.max(data.a ?? 0, data.b ?? 0), lo = Math.min(data.a ?? 0, data.b ?? 0)
      lines = [`Same size parts on both bars.`, `${hi} parts fill more than ${lo} — so ${hi}/${data.den} is greater.`]
      steps = [() => setS(initState(data)), () => setS(rv)]
    } else {
      const res = data.op === '+' ? (data.a ?? 0) + (data.b ?? 0) : (data.a ?? 0) - (data.b ?? 0)
      lines = [data.op === '+' ? `Put the shaded parts together.` : `Take ${data.b} parts away from ${data.a}.`, `${frac(data.a ?? 0, data.den)} ${data.op} ${frac(data.b ?? 0, data.den)} = ${frac(res, data.den)}.`]
      steps = [() => setS(initState(data)), () => setS(rv)]
    }
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => window.setTimeout(() => doneRef.current(), 1300), fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Forge" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: slide two fractions and watch the bars + comparison sign update live ──
function FractionScope() {
  const [aNum, setANum] = useState(3)
  const [aDen, setADen] = useState(4)
  const [bNum, setBNum] = useState(2)
  const [bDen, setBDen] = useState(3)
  // clamp numerators ≤ their denominator
  const an = Math.min(aNum, aDen)
  const bn = Math.min(bNum, bDen)
  // compare via cross-multiply (an/aDen vs bn/bDen)
  const lhs = an * bDen, rhs = bn * aDen
  const sign = lhs > rhs ? '>' : lhs < rhs ? '<' : '='
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <Bar den={aDen} shaded={an} />
        <Bar den={bDen} shaded={bn} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <PtReadout label="fraction A" value={frac(an, aDen)} accent={ACCENT} />
        <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 40, lineHeight: 1, color: ACCENT.base, textShadow: `0 0 20px ${ACCENT.base}88` }}>{sign}</div>
        <PtReadout label="fraction B" value={frac(bn, bDen)} accent={ACCENT} />
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PtSlider label="A numerator" value={an} min={0} max={aDen} accent={ACCENT} onChange={setANum} />
          <PtSlider label="A denominator" value={aDen} min={1} max={8} accent={ACCENT} onChange={(v) => { setADen(v); if (aNum > v) setANum(v) }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PtSlider label="B numerator" value={bn} min={0} max={bDen} accent={ACCENT} onChange={setBNum} />
          <PtSlider label="B denominator" value={bDen} min={1} max={8} accent={ACCENT} onChange={(v) => { setBDen(v); if (bNum > v) setBNum(v) }} />
        </div>
      </div>
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<FrRound> {
  return {
    skillId: 'fractionsCompare', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: r => `${r.type}|${r.den}|${r.num ?? ''}|${r.a ?? ''}|${r.b ?? ''}|${r.op ?? ''}`,
    prompt: d => d.prompt, say: d => d.say,
    Play: ({ data, onSubmit }) => <FrPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FrExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function FractionForge({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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

  const DEMO: FrRound[] = [
    { type: 'name', den: 4, num: 3, prompt: 'What fraction is shaded?', tag: 'Read the bar', say: 'What fraction is shaded?', answer: '3/4', choices: nameChoices(3, 4) },
    { type: 'compare', den: 5, a: 4, b: 2, prompt: 'Which is greater?', tag: 'Compare bars', say: 'Which fraction is greater?', answer: '4/5', choices: shuffle([frac(4, 5), frac(2, 5)]) },
  ]
  const GUIDED: FrRound = { type: 'name', den: 4, num: 3, prompt: 'What fraction is shaded?', tag: 'Read the bar', say: 'What fraction is shaded?', answer: '3/4', choices: nameChoices(3, 4) }

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
        <IntroCard title="Fraction Forge" accent={ACCENT} cta="Start forging"
          body="Milo forges fractions on a glowing bar — name what's shaded, compare two bars, then add and subtract them. Play with the bars, then watch one, then run the forge yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Compare fractions" accent={ACCENT} short={short}
          intro="Slide each fraction and see the bars — which is bigger?"
          onContinue={() => setPhase('demo')}>
          <FractionScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <FrExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · run the forge')}
        <FrPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
