'use client'
/**
 * Chapter (9–11) — DECIMALS (skill `decimals`) in the PRE-TEEN "Number Lab" look.
 *
 * A more grown-up shell than the 3–8 storybook worlds: crisp cool console, blueprint grid, mono
 * numerals, HUD chrome, Milo as an explorer (see story/preteen/kit.tsx). Milo "reads" a hundredths
 * grid — 100 small cells, `shaded` of them lit — to picture a decimal 0.00–1.00 (shaded / 100):
 *   • READ    → shade cells for a value; name the decimal (tenths at L1, hundredths at L2/L3)
 *   • COMPARE → two decimals side by side (incl. 0.3 vs 0.25 misconception pairs); pick the greater
 *   • DIGIT   → given e.g. 0.47, name the digit in the tenths / hundredths place (L3)
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3): L1 read(tenths) + compare(tenths) ·
 * L2 read(hundredths) + compare(mixed length) · L3 adds digit place-value + trickier compares.
 * Code-drawn (no photographic scene → no background reuse). Wrapped by game/DecimalsChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'

const ACCENT = ACCENTS.cyan


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

// hundredths → decimal string, trimming a trailing hundredths zero (40 → "0.4", 37 → "0.37")
function dec(h: number): string {
  if (h === 100) return '1'
  if (h === 0) return '0'
  return (h % 10 === 0) ? (h / 100).toFixed(1) : (h / 100).toFixed(2)
}
// number of hundredths that a decimal string represents ("0.4" → 40, "0.37" → 37)
const hOf = (s: string) => Math.round(parseFloat(s) * 100)

type QType = 'read' | 'compare' | 'digit'
interface DgRound { qType: QType; prompt: string; tag: string; say: string; answer: string; choices: string[]
  // read
  shaded: number
  // compare
  a: number; b: number
  // digit
  value: number; place: 'tenths' | 'hundredths'
  // reveal verdict
  verdict: string }

// ─── question builders ─────────────────────────────────────────────────────────────────
function mkRead(d: 1 | 2 | 3): DgRound {
  const shaded = d === 1 ? rint(1, 9) * 10 : rint(11, 96)   // L1 tenths (multiple of 10), L2/L3 any hundredths
  const correct = dec(shaded)
  const opts = new Set<string>([correct])
  // a tenths/hundredths confusion (0.4 ↔ 0.04, or 0.37 ↔ 0.73) + ±0.1 neighbours
  if (shaded % 10 === 0) opts.add(dec(shaded / 10))            // 0.4 vs 0.04
  else opts.add(dec(((shaded % 10) * 10) + Math.floor(shaded / 10)))  // swap digits: 0.37 → 0.73
  for (const cand of shuffle([shaded + 10, shaded - 10, shaded + 1, shaded - 1, shaded + 11])) {
    if (opts.size >= 3) break
    if (cand > 0 && cand < 100) opts.add(dec(cand))
  }
  let b = 2; while (opts.size < 3) { const c = ((shaded + b) % 99) + 1; opts.add(dec(c)); b++ }
  return { qType: 'read', shaded, a: 0, b: 0, value: 0, place: 'tenths',
    prompt: 'What decimal is shaded?', tag: 'Read grid', say: 'What decimal is shaded?',
    answer: correct, choices: shuffle([...opts]), verdict: correct }
}
function mkCompare(d: 1 | 2 | 3): DgRound {
  let ha: number, hb: number
  if (d === 1) {                             // tenths vs tenths
    ha = rint(1, 9) * 10; hb = rint(1, 9) * 10
    while (hb === ha) hb = rint(1, 9) * 10
  } else if (d === 2) {                       // classic mixed-length misconception (0.3 vs 0.25)
    const pairs = [[30, 25], [50, 45], [40, 38], [20, 19], [60, 55], [70, 68], [80, 79], [90, 88]]
    const [p, q] = pick(pairs); if (rint(0, 1)) { ha = p; hb = q } else { ha = q; hb = p }
  } else {                                    // trickier: close hundredths
    const pairs = [[35, 3], [7, 70], [45, 5], [8, 80], [27, 3], [4, 40], [62, 6], [90, 9]]
    const [p, q] = pick(pairs); if (rint(0, 1)) { ha = p; hb = q } else { ha = q; hb = p }
  }
  const aS = dec(ha), bS = dec(hb)
  const big = ha > hb ? aS : bS
  return { qType: 'compare', shaded: 0, a: ha, b: hb, value: 0, place: 'tenths',
    prompt: 'Which is greater?', tag: 'Compare', say: 'Which decimal is greater?',
    answer: big, choices: shuffle([aS, bS]), verdict: `${ha > hb ? aS : bS} > ${ha > hb ? bS : aS}` }
}
function mkDigit(): DgRound {
  let v = rint(11, 98); if (v % 10 === 0) v += 1               // ensure a nonzero hundredths digit
  const place: 'tenths' | 'hundredths' = pick(['tenths', 'hundredths'])
  const tenD = Math.floor(v / 10), hunD = v % 10
  const correct = String(place === 'tenths' ? tenD : hunD)
  const opts = new Set<string>([correct, String(tenD), String(hunD)])
  while (opts.size < 3) opts.add(String(rint(1, 9)))
  return { qType: 'digit', shaded: v, a: 0, b: 0, value: v, place,
    prompt: `What is the digit in the ${place} place of ${dec(v)}?`, tag: 'Place value',
    say: `In ${dec(v)}, what is the digit in the ${place} place?`,
    answer: correct, choices: shuffle([...opts]), verdict: `${place} = ${correct}` }
}
function makeRound(d: 1 | 2 | 3): DgRound {
  const pool: QType[] = d === 1 ? ['read', 'read', 'compare'] : d === 2 ? ['read', 'read', 'compare', 'compare'] : ['read', 'compare', 'digit', 'digit']
  const t = pick(pool)
  if (t === 'read') return mkRead(d)
  if (t === 'compare') return mkCompare(d)
  return mkDigit()
}

// ─── Instrument: 10×10 hundredths grid ──────────────────────────────────────────────────
function Grid100({ shaded }: { shaded: number }) {
  const s = Math.max(0, Math.min(100, shaded))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 15px)', gridTemplateRows: 'repeat(10, 15px)', gap: 2, padding: 6, borderRadius: 8, background: PT.panelSoft, border: `1px solid ${PT.lineStrong}` }}>
      {Array.from({ length: 100 }).map((_, i) => {
        const on = i < s
        return <div key={i} style={{ width: 15, height: 15, borderRadius: 2, flexShrink: 0,
          background: on ? ACCENT.base : PT.panelSolid, border: `1px solid ${on ? ACCENT.deep : PT.line}`,
          boxShadow: on ? `0 0 5px ${ACCENT.base}77` : 'none', transition: 'all .18s ease' }} />
      })}
    </div>
  )
}

interface StageState { revealed: boolean; shaded: number; verdict: string | null; verdictOk: boolean }
function initState(d: DgRound): StageState {
  if (d.qType === 'read') return { revealed: false, shaded: d.shaded, verdict: null, verdictOk: false }
  return { revealed: false, shaded: 0, verdict: null, verdictOk: false }
}
function revealState(d: DgRound): StageState {
  if (d.qType === 'read') return { revealed: true, shaded: d.shaded, verdict: d.verdict, verdictOk: true }
  return { revealed: true, shaded: 0, verdict: d.verdict, verdictOk: true }
}

// mini grid + numeral for one decimal (used in compare)
function DecTile({ h, label, dim }: { h: number; label: string; dim?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: dim ? 0.5 : 1 }}>
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 40, lineHeight: 1, color: PT.ink, letterSpacing: 1, textShadow: `0 0 20px ${ACCENT.base}55` }}>{label}</div>
      <div style={{ transform: 'scale(0.62)', transformOrigin: 'top center' }}><Grid100 shaded={h} /></div>
    </div>
  )
}

function Panel({ data, s }: { data: DgRound; s: StageState }) {
  const header = data.qType === 'read' ? 'READ 0.00–1.00' : data.qType === 'compare' ? 'COMPARE' : `PLACE ${dec(data.value)}`
  const bigVal = data.qType === 'read' ? (s.revealed ? dec(s.shaded) : '?.??') : data.qType === 'digit' ? dec(data.value) : null
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '20px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {bigVal !== null && (
          <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 60, lineHeight: 1, color: PT.ink, letterSpacing: 1, textShadow: `0 0 24px ${ACCENT.base}66` }}>{bigVal}</div>
        )}
        {data.qType === 'compare'
          ? <div style={{ display: 'flex', alignItems: 'flex-start', gap: 26 }}>
              <DecTile h={data.a} label={dec(data.a)} dim={s.revealed && data.a < data.b} />
              <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 34, color: ACCENT.base, alignSelf: 'center' }}>{s.revealed ? (data.a > data.b ? '>' : '<') : 'vs'}</div>
              <DecTile h={data.b} label={dec(data.b)} dim={s.revealed && data.b < data.a} />
            </div>
          : <Grid100 shaded={s.shaded} />}
        <div style={{ height: 34 }}>
          {s.verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 17, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: s.verdictOk ? PT.ok : ACCENT.base, color: '#06121f', boxShadow: `0 0 18px ${(s.verdictOk ? PT.ok : ACCENT.base)}` }}>{s.verdict}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: DgRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.92
  const availH = short ? vh * 0.4 : vh * 0.52
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '44%' : '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4}><Panel data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const DgPlay: React.FC<{ data: DgRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
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
    } else { erred.current = true; speak('Not quite. Look at the grid and try again.'); window.setTimeout(() => setPicked(null), 1050) }
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
const DgExplain: React.FC<{ data: DgRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>(() => initState(data))
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const rv = revealState(data)
    let lines: string[] = []; let steps: Array<() => void> = []
    if (data.qType === 'read') {
      lines = [`Each little square is one hundredth.`, `${data.shaded} squares are shaded — that is ${dec(data.shaded)}.`]
      steps = [() => setS({ ...initState(data), shaded: 0 }), () => setS(rv)]
    } else if (data.qType === 'compare') {
      const aB = data.a > data.b
      lines = [`Line up the tenths first.`, `${Math.floor(Math.max(data.a, data.b) / 10)} tenths is more than ${Math.floor(Math.min(data.a, data.b) / 10)} tenths, so ${dec(aB ? data.a : data.b)} is greater than ${dec(aB ? data.b : data.a)}.`]
      steps = [() => setS(initState(data)), () => setS(rv)]
    } else {
      lines = [`Read ${dec(data.value)} place by place.`, `The ${data.place} digit is ${data.answer}.`]
      steps = [() => setS(initState(data)), () => setS(rv)]
    }
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => window.setTimeout(() => doneRef.current(), 1300), fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Read" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: slide hundredths and watch the grid fill + the decimal / fraction update live ────
function DecimalScope() {
  const [h, setH] = useState(37)
  const tenths = Math.floor(h / 10)
  const hundredths = h % 10
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 52, lineHeight: 1, color: PT.ink, textShadow: `0 0 22px ${ACCENT.base}66` }}>{dec(h)}</div>
      <Grid100 shaded={h} />
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label="decimal" value={dec(h)} accent={ACCENT} />
        <PtReadout label="tenths" value={String(tenths)} accent={ACCENT} />
        <PtReadout label="hundredths" value={String(hundredths)} accent={ACCENT} />
        <PtReadout label="fraction" value={`${h}/100`} accent={ACCENT} />
      </div>
      <PtSlider label="hundredths shaded" value={h} min={0} max={100} accent={ACCENT} onChange={setH} />
    </div>
  )
}

// ─── Beat + orchestrator ───────────────────────────────────────────────────────────────
function makeBeat(): Beat<DgRound> {
  return {
    skillId: 'decimals', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => d.qType === 'read' ? `read|${d.shaded}` : d.qType === 'compare' ? `compare|${d.a}|${d.b}` : `digit|${d.value}|${d.place}`,
    prompt: d => d.prompt, say: d => d.say,
    Play: ({ data, onSubmit }) => <DgPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <DgExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function DecimalGrid({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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

  const DEMO: DgRound[] = [mkRead(1 as 1), mkCompare(2 as 2)]
  const GUIDED: DgRound = mkRead(1 as 1)

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
        <IntroCard title="Decimal Lab" accent={ACCENT} cta="Start analysis"
          body="A hundred tiny squares make one whole. Milo shades some in to picture a decimal — read it, compare two, and find each digit's place. Watch one, then run the grid yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Fill the grid" accent={ACCENT} short={short}
          intro="Slide to shade the grid — see the decimal and the fraction it makes."
          onContinue={() => setPhase('demo')}>
          <DecimalScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <DgExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · read the grid')}
        <DgPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
