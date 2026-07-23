'use client'
/**
 * Chapter (9–11) — BIG NUMBERS & PLACE VALUE to 10,000 (skill `bigNumbers`) in the PRE-TEEN
 * "Mission HUD" look (see story/preteen/kit.tsx) — a single dark-glass lab, no world picker.
 *
 * Milo runs a place-value analyzer: a base-ten place-value chart (Thousands · Hundreds · Tens · Ones)
 * where each place is drawn in NEON base-ten block glyphs — a one-square, a ten-rod, a hundred-flat,
 * a thousand-cube — glowing with the accent. Three question types (as the kit):
 *   • "how many <place>?"          → the column's header/blocks glow
 *   • "value of the <digit>?"       → the digit + its place value on reveal
 *   • "what number is this?"        → read the blocks (numeral hidden until reveal)
 * One continuous adaptive SkillBeat (10 rounds, re-teach after 3 wrong):
 *   Range: L1 → 100–999 · L2 → 1,000–4,999 · L3 → 1,000–9,999.
 * The demo + 3-wrong re-teach BUILD the number place-by-place via ONE speakSteps
 * ("3 thousands, 4 hundreds, 7 tens, 2 ones — 3,472!"). Code-drawn (no assets).
 * Wrapped by game/BigNumbersChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'

const ACCENT = ACCENTS.gold

// ─── Number words (0–9999) ────────────────────────────────────────────────────────────
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
function under100(n: number): string { if (n < 20) return ONES[n]; const t = Math.floor(n / 10), o = n % 10; return TENS[t] + (o ? '-' + ONES[o] : '') }
function numWords(n: number): string {
  if (n < 100) return under100(n)
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return ONES[h] + ' hundred' + (r ? ' ' + under100(r) : '') }
  const th = Math.floor(n / 1000), r = n % 1000
  return ONES[th] + ' thousand' + (r ? ' ' + (r < 100 ? under100(r) : numWords(r)) : '')
}
const fmt = (n: number) => n.toLocaleString('en-US')

// ─── Place columns ────────────────────────────────────────────────────────────────────
interface PCol { v: number; label: string; plural: string; digit: number; value: number }
const PLACE_DEF = [
  { v: 1000, label: 'Thousands', plural: 'thousands' },
  { v: 100, label: 'Hundreds', plural: 'hundreds' },
  { v: 10, label: 'Tens', plural: 'tens' },
  { v: 1, label: 'Ones', plural: 'ones' },
]
function placeColumns(n: number): PCol[] {
  const start = n >= 1000 ? 0 : 1
  return PLACE_DEF.slice(start).map(p => { const digit = Math.floor(n / p.v) % 10; return { ...p, digit, value: digit * p.v } })
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[rint(0, a.length - 1)]
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
const pickN = (d: 1 | 2 | 3) => d === 1 ? rint(100, 999) : d === 2 ? rint(1000, 4999) : rint(1000, 9999)

function nearDigits(answer: number): number[] {
  const opts = new Set<number>([answer]); let delta = 1
  while (opts.size < 3) { if (answer - delta >= 0) opts.add(answer - delta); if (opts.size < 3 && answer + delta <= 9) opts.add(answer + delta); delta++ }
  return shuffle([...opts])
}
function valueOptions(digit: number, answer: number): number[] {
  const all = [digit, digit * 10, digit * 100, digit * 1000].filter(v => v !== answer)
  const opts = new Set<number>([answer]); for (const v of shuffle(all)) { if (opts.size >= 3) break; opts.add(v) }
  let bump = 1; while (opts.size < 3) { opts.add(answer + bump * 10); bump++ }
  return shuffle([...opts])
}
function nearNumbers(n: number): number[] {
  const digs = placeColumns(n).map(c => c.digit)
  const swapped: number[] = []
  for (let i = 0; i < digs.length - 1; i++) { const d = digs.slice();[d[i], d[i + 1]] = [d[i + 1], d[i]]; swapped.push(d.reduce((a, x) => a * 10 + x, 0)) }
  const cands = shuffle([...swapped, n + 1, n - 1, n + 10, n - 10, n + 100, n - 100])
  const opts = new Set<number>([n]); for (const c of cands) { if (opts.size >= 3) break; if (c >= 100 && c <= 9999 && c !== n) opts.add(c) }
  while (opts.size < 3) { const r = pickN(3); if (r !== n) opts.add(r) }
  return shuffle([...opts])
}

type QType = 'place' | 'value' | 'whole'
interface NvRound { n: number; qType: QType; prompt: string; tag: string; say: string; answer: number; choices: number[]; showNumeral: boolean; highlight: number }

function tagFor(qType: QType): string { return qType === 'place' ? 'Place count' : qType === 'value' ? 'Digit value' : 'Read the blocks' }

function makeRound(d: 1 | 2 | 3): NvRound {
  const n = pickN(d)
  const cols = placeColumns(n)
  const pool: QType[] = d === 1 ? ['place', 'whole', 'value'] : d === 2 ? ['place', 'value', 'whole', 'whole'] : ['place', 'value', 'value', 'whole', 'whole']
  const qType = pick(pool)
  if (qType === 'place') {
    const c = pick(cols)
    return { n, qType, prompt: `How many ${c.plural}?`, tag: tagFor(qType), say: `How many ${c.plural} in ${numWords(n)}?`, answer: c.digit, choices: nearDigits(c.digit), showNumeral: true, highlight: cols.indexOf(c) }
  }
  if (qType === 'value') {
    const counts: Record<number, number> = {}; cols.forEach(c => { counts[c.digit] = (counts[c.digit] ?? 0) + 1 })
    const good = cols.filter(c => c.digit !== 0 && counts[c.digit] === 1)
    const c = pick(good.length ? good : (cols.filter(x => x.digit !== 0).length ? cols.filter(x => x.digit !== 0) : cols))
    return { n, qType, prompt: `What is the value of the ${c.digit}?`, tag: tagFor(qType), say: `In ${numWords(n)}, what is the value of the ${c.digit}?`, answer: c.value, choices: valueOptions(c.digit, c.value), showNumeral: true, highlight: cols.indexOf(c) }
  }
  return { n, qType, prompt: 'What number is this?', tag: tagFor(qType), say: 'What number is this? Read the places.', answer: n, choices: nearNumbers(n), showNumeral: false, highlight: -1 }
}

// ─── Neon base-ten block for a place ──────────────────────────────────────────────────
function Block({ place, u }: { place: number; u: number }) {
  const long = Math.round(u * 4.4)
  const base: React.CSSProperties = {
    background: ACCENT.soft, border: `1.6px solid ${ACCENT.base}`, borderRadius: 3, flexShrink: 0,
    boxShadow: `0 0 8px ${ACCENT.base}66, inset 0 0 6px ${ACCENT.base}22`,
  }
  if (place === 1) return <div style={{ ...base, width: u, height: u, borderRadius: Math.round(u * 0.24) }} />
  if (place === 10) return <div style={{ ...base, width: u, height: long, backgroundImage: `repeating-linear-gradient(0deg, ${ACCENT.base}88 0 1px, transparent 1px ${Math.round(long / 10)}px)` }} />
  const grid = `repeating-linear-gradient(0deg, ${ACCENT.base}55 0 1px, transparent 1px ${Math.round(long / 10)}px), repeating-linear-gradient(90deg, ${ACCENT.base}55 0 1px, transparent 1px ${Math.round(long / 10)}px)`
  if (place === 100) return <div style={{ ...base, width: long, height: long, backgroundImage: grid }} />
  // thousand — a chunkier stacked neon cube
  return <div style={{ ...base, width: long, height: long, backgroundImage: grid, boxShadow: `3px 3px 0 ${ACCENT.deep}, 6px 6px 0 ${ACCENT.base}55, 0 0 14px ${ACCENT.base}88` }} />
}

// A place column: label · the digit-many neon blocks · (numeral)
function PlaceCol({ col, u, showNumeral, highlighted }: { col: PCol; u: number; showNumeral: boolean; highlighted: boolean }) {
  const per = col.v <= 10 ? 5 : 2   // narrow the hundred/thousand columns so all 4 places fit one row
  const cap = Math.min(col.digit, 9)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '6px 6px 5px', borderRadius: 12, minWidth: Math.round(u * 5),
      background: highlighted ? ACCENT.soft : PT.panelSoft, border: `2px solid ${highlighted ? ACCENT.base : PT.line}`,
      boxShadow: highlighted ? `0 0 18px ${ACCENT.base}77` : 'none', transition: 'all .35s cubic-bezier(.34,1.56,.64,1)' }}>
      <span style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: u < 11 ? 9 : 11, color: highlighted ? ACCENT.base : PT.inkMute, letterSpacing: .5, textTransform: 'uppercase', textShadow: highlighted ? `0 0 8px ${ACCENT.base}88` : 'none' }}>{col.label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(per, Math.max(1, cap))}, auto)`, gap: 3, justifyItems: 'center', alignItems: 'end', minHeight: Math.round(u * 4.6) }}>
        {Array.from({ length: cap }).map((_, i) => <Block key={i} place={col.v} u={u} />)}
      </div>
      {showNumeral && <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: u < 11 ? 20 : 26, color: highlighted ? ACCENT.base : PT.ink, lineHeight: 1, textShadow: `0 0 12px ${ACCENT.base}66` }}>{col.digit}</span>}
    </div>
  )
}

interface StageState { shownCols: number; showNumeral: boolean; revealed: boolean; verdict: string | null }
function initState(data: NvRound): StageState { return { shownCols: placeColumns(data.n).length, showNumeral: data.showNumeral, revealed: false, verdict: null } }
function revealState(data: NvRound): StageState {
  const verdict =
    data.qType === 'place' ? `${placeColumns(data.n)[data.highlight].plural}: ${data.answer}` :
    data.qType === 'value' ? `${data.highlight >= 0 ? placeColumns(data.n)[data.highlight].digit : ''} → ${fmt(data.answer)}` :
    fmt(data.n)
  return { shownCols: placeColumns(data.n).length, showNumeral: true, revealed: true, verdict }
}

// ─── The place-value analyzer panel ────────────────────────────────────────────────────
function Analyzer({ data, s }: { data: NvRound; s: StageState }) {
  const cols = placeColumns(data.n)
  const u = cols.length >= 4 ? 15 : 18
  const header = data.qType === 'whole' ? 'READ BLOCKS' : data.qType === 'value' ? `VALUE · ${data.n >= 1000 ? fmt(data.n) : data.n}` : `PLACE · ${data.n >= 1000 ? fmt(data.n) : data.n}`
  const showBig = s.showNumeral && data.showNumeral || (data.qType === 'whole' && s.revealed)
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{header}</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.revealed ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.revealed ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
          {showBig
            ? <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 44, lineHeight: 1, color: PT.ink, letterSpacing: 1, textShadow: `0 0 22px ${ACCENT.base}66` }}>{fmt(data.n)}</div>
            : <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 44, lineHeight: 1, color: ACCENT.base, letterSpacing: 6 }}>?</div>}
        </div>
        <div style={{ display: 'flex', gap: 11, alignItems: 'stretch', justifyContent: 'center', flexWrap: 'nowrap' }}>
          {cols.map((col, i) => (
            <PlaceCol key={col.v} col={col} u={u} showNumeral={s.showNumeral && data.showNumeral}
              highlighted={i < s.shownCols && data.highlight === i && (data.qType === 'value' || data.qType === 'place')} />
          ))}
        </div>
        <div style={{ height: 30 }}>
          {s.verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 16, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: PT.ok, color: '#04231a', boxShadow: `0 0 18px ${PT.ok}` }}>{s.verdict}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: NvRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.94
  const availH = short ? vh * 0.42 : vh * 0.54
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '45%' : '47%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={availW} availH={availH} max={2.6} min={0.3}><Analyzer data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const fmtChoice = (qType: QType, v: number) => qType === 'whole' || qType === 'value' ? fmt(v) : String(v)

const NvPlay: React.FC<{ data: NvRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(58, Math.min(short ? 92 : 116, Math.round(Math.min(vw / 6.5, vh / (short ? 4.4 : 5.2)))))
  const [s, setS] = useState<StageState>(() => initState(data))
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false)

  useEffect(() => {
    if (mode === 'guided') speak(data.say)
    const t = window.setTimeout(() => setAsking(true), 650)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(n: number) {
    if (done.current || picked !== null || !asking) return
    setPicked(n)
    if (n === data.answer) {
      done.current = true; setS(revealState(data))
      if (mode === 'guided') speak('Correct.')
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1500)
    } else { erred.current = true; speak('Not quite — read the places again. Try once more.'); window.setTimeout(() => setPicked(null), 1050) }
  }

  return (
    <>
      <Stage data={data} s={s} short={short} />
      <PromptCard tag={data.tag} text={data.prompt} accent={ACCENT} short={short} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3vw,28px)', flexWrap: 'wrap', padding: '0 12px',
        opacity: asking ? 1 : 0, transform: asking ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity .4s ease, transform .4s ease', pointerEvents: asking ? 'auto' : 'none' }}>
        {data.choices.map(n => {
          const st: ChoiceState = picked === n ? (n === data.answer ? 'right' : 'wrong') : picked !== null ? 'dim' : 'idle'
          return <ChoiceButton key={n} label={fmtChoice(data.qType, n)} accent={ACCENT} state={st} size={btn} onClick={() => choose(n)} disabled={picked !== null} />
        })}
      </div>
    </>
  )
}

// ─── Demo / re-teach: build the number place-by-place via ONE speakSteps ────────────────
const NvExplain: React.FC<{ data: NvRound; onDone: () => void }> = ({ data, onDone }) => {
  const cols = placeColumns(data.n)
  const { h: vh } = useViewport()
  const short = vh < 470
  const [s, setS] = useState<StageState>({ shownCols: 0, showNumeral: false, revealed: false, verdict: null })
  const doneRef = useRef(onDone); doneRef.current = onDone
  useEffect(() => {
    const lead = cols.map(c => `${c.digit} ${c.plural}`).join(', ')
    const lines: string[] = [
      `Read the blocks: ${lead}.`,
      `That is ${numWords(data.n)} — ${fmt(data.n)}!`,
    ]
    const steps: Array<() => void> = [
      () => setS({ shownCols: cols.length, showNumeral: false, revealed: false, verdict: null }),
      () => setS({ shownCols: cols.length, showNumeral: true, revealed: true, verdict: fmt(data.n) }),
    ]
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => { window.setTimeout(() => doneRef.current(), 1300) }, fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={{ ...data, highlight: -1 }} s={s} short={short} /><PromptCard tag="Analyze" text="Build the number, place by place." accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: slide each place and watch the blocks + number update live ────────────
function PlaceBuilder() {
  const { w: vw } = useViewport()
  const [th, setTh] = useState(3)
  const [hu, setHu] = useState(4)
  const [te, setTe] = useState(7)
  const [on, setOn] = useState(2)
  const n = th * 1000 + hu * 100 + te * 10 + on
  const u = 15
  const cols: PCol[] = PLACE_DEF.map(p => {
    const digit = p.v === 1000 ? th : p.v === 100 ? hu : p.v === 10 ? te : on
    return { ...p, digit, value: digit * p.v }
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 52, lineHeight: 1, color: PT.ink, letterSpacing: 1, textShadow: `0 0 24px ${ACCENT.base}66` }}>{fmt(n)}</div>
      <FitBox availW={Math.min(vw * 0.82, 460)} availH={300} max={1} min={0.3}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'stretch', justifyContent: 'center', flexWrap: 'nowrap' }}>
          {cols.map(col => <PlaceCol key={col.v} col={col} u={u} showNumeral highlighted={col.digit > 0} />)}
        </div>
      </FitBox>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {cols.map(col => <PtReadout key={col.v} label={col.plural} value={`${col.digit} = ${fmt(col.value)}`} accent={ACCENT} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 460 }}>
        <PtSlider label="thousands" value={th} min={0} max={9} accent={ACCENT} onChange={setTh} />
        <PtSlider label="hundreds" value={hu} min={0} max={9} accent={ACCENT} onChange={setHu} />
        <PtSlider label="tens" value={te} min={0} max={9} accent={ACCENT} onChange={setTe} />
        <PtSlider label="ones" value={on} min={0} max={9} accent={ACCENT} onChange={setOn} />
      </div>
    </div>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
function makeBeat(): Beat<NvRound> {
  return {
    skillId: 'bigNumbers', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => `${d.n}|${d.qType}|${d.answer}`,
    prompt: d => d.prompt,
    say: d => d.say,
    Play: ({ data, onSubmit }) => <NvPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <NvExplain data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'

const mk = (n: number, qType: QType): NvRound => {
  const cols = placeColumns(n)
  if (qType === 'place') { const i = cols.length - 2; const c = cols[i]; return { n, qType, prompt: `How many ${c.plural}?`, tag: tagFor(qType), say: `How many ${c.plural} in ${numWords(n)}?`, answer: c.digit, choices: nearDigits(c.digit), showNumeral: true, highlight: i } }
  return { n, qType: 'whole', prompt: 'What number is this?', tag: tagFor('whole'), say: 'What number is this? Read the places.', answer: n, choices: nearNumbers(n), showNumeral: false, highlight: -1 }
}
const DEMO: NvRound[] = [mk(342, 'whole'), mk(3472, 'whole')]
const GUIDED: NvRound = mk(253, 'place')

export default function NumberVault({ onFinish, onExit }: {
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
        <IntroCard title="Place-Value Lab" accent={ACCENT} cta="Start analysis"
          body="Milo reads big numbers off the block chart — thousands, hundreds, tens and ones. Watch one build, then run the analyzer yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Build a big number" accent={ACCENT} short={short}
          intro="Slide each place — thousands, hundreds, tens, ones — and watch the blocks and the number change."
          onContinue={() => setPhase('demo')}>
          <PlaceBuilder />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <NvExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · run the analyzer')}
        <NvPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
