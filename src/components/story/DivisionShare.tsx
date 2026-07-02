'use client'
/**
 * Chapter (9–11) — DIVISION as SHARING equally (skill `division`) in the PRE-TEEN "Mission HUD" look.
 *
 * A grown-up single-lab shell (no storybook worlds, no photographic scenes, no image sprites): the
 * cool console + starfield backdrop, mono numerals, HUD chrome, Milo the explorer (see
 * story/preteen/kit.tsx). Division is carried by DEALING N neon nodes one-by-one into `g` dark-glass
 * "sharing bays" until each bay holds q = ⌊N/g⌋; any REMAINDER nodes rest in a warm "left over" tray.
 * The sentence N ÷ g = q r rem reads big in mono, with a verdict chip on reveal.
 *
 * Difficulty (unchanged from the story version / the kit): L1 → exact shares (2–5 groups) · L2 →
 * +bigger exact & first remainders · L3 → remainders to 6 groups. The demo + 3-wrong re-teach DEAL
 * the nodes out via ONE speakSteps (line 1 deals; line 2 states "q each, rem left over"). Answer
 * format is the kit's: exact = "q", with-remainder = "q r rem". Code-drawn only; the instrument is
 * wrapped in FitBox so it's big on any viewport. Wrapped by game/DivisionChapter.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/lib/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, ChoiceButton, PtMilo, IntroCard, PtSlider, PtReadout, ExploreScaffold, type ChoiceState } from './preteen/kit'
import { useViewport } from '@/lib/useViewport'

const ACCENT = ACCENTS.orchid


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

// ─── Math (identical logic to the story version — sharing/remainder, choices, ramp) ────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
function shuffle<T>(a: T[]): T[] { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
// Minimal, self-contained number-to-words (no external kit dependency).
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
function numWords(n: number): string {
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')
  const h = Math.floor(n / 100), r = n % 100
  return `${ONES[h]} hundred${r ? ` ${numWords(r)}` : ''}`
}

function noRemChoices(q: number): string[] {
  const opts = new Set<string>([String(q)])
  for (const v of shuffle([q - 1, q + 1, q - 2, q + 2])) { if (opts.size >= 3) break; if (v > 0) opts.add(String(v)) }
  let bump = 3; while (opts.size < 3) { opts.add(String(q + bump)); bump++ }
  return shuffle([...opts])
}
function remChoices(q: number, rem: number, groups: number): string[] {
  const correct = `${q} r ${rem}`
  const opts = new Set<string>([correct])
  const otherRem = rem === groups - 1 ? 1 : rem + 1
  for (const c of shuffle([`${q} r ${otherRem}`, `${q + 1} r ${rem}`, `${q} r ${rem > 1 ? rem - 1 : rem + 1}`, `${q - 1 > 0 ? q - 1 : q + 2} r ${rem}`])) {
    if (opts.size >= 3) break
    if (c !== correct) opts.add(c)
  }
  return shuffle([...opts])
}

interface DsRound { total: number; groups: number; q: number; rem: number; prompt: string; say: string; answer: string; choices: string[] }
function mk(groups: number, q: number, rem: number): DsRound {
  const total = groups * q + rem
  const answer = rem > 0 ? `${q} r ${rem}` : `${q}`
  const choices = rem > 0 ? remChoices(q, rem, groups) : noRemChoices(q)
  const say = rem > 0
    ? `Share ${numWords(total)} among ${numWords(groups)}. How many each, and how many left over?`
    : `Share ${numWords(total)} among ${numWords(groups)}. How many each?`
  return { total, groups, q, rem, prompt: `Share ${total} among ${groups}`, say, answer, choices }
}
function makeRound(d: 1 | 2 | 3): DsRound {
  if (d === 1) return mk(rint(2, 5), rint(2, 5), 0)
  if (d === 2) {
    if (Math.random() < 0.5) return mk(rint(2, 6), rint(2, 6), 0)
    const groups = rint(3, 5); return mk(groups, rint(2, 5), rint(1, groups - 1))
  }
  const groups = rint(3, 6); return mk(groups, rint(3, 7), rint(1, groups - 1))
}

// ─── Neon node ─────────────────────────────────────────────────────────────────────────
function Node({ size, on, warn }: { size: number; on: boolean; warn?: boolean }) {
  return <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0,
    background: on ? (warn ? PT.warn : ACCENT.base) : PT.panelSoft, border: `2px solid ${on ? (warn ? PT.warnDeep : ACCENT.deep) : PT.lineStrong}`,
    boxShadow: on ? (warn ? `0 0 10px ${PT.warn}88` : `0 0 10px ${ACCENT.base}66`) : 'none', transition: 'all .25s cubic-bezier(.34,1.56,.64,1)' }} />
}

// One "sharing bay": a dark-glass bin that fills with the nodes it has received.
function Bay({ count, nodePx, done }: { count: number; nodePx: number; done?: boolean }) {
  const cols = Math.min(3, Math.max(1, count || 1))
  const pad = Math.round(nodePx * 0.4)
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      minWidth: nodePx * 2.4, minHeight: nodePx * 2.6, padding: `${pad}px ${pad}px ${Math.round(pad * 0.7)}px`,
      borderRadius: 14, background: PT.panelSoft, border: `2px solid ${done ? ACCENT.base : PT.line}`,
      boxShadow: done ? `0 0 16px ${ACCENT.base}55` : 'none', transition: 'all .3s' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: Math.round(nodePx * 0.22), justifyContent: 'center' }}>
        {Array.from({ length: count }).map((_, i) => <Node key={i} size={nodePx} on />)}
      </div>
      <span style={{ position: 'absolute', bottom: 3, right: 6, fontFamily: PT.mono, fontWeight: 700, fontSize: 11, color: done ? ACCENT.base : PT.inkMute }}>{count}</span>
    </div>
  )
}

// ─── Stage (shared by play + demo) ────────────────────────────────────────────────────
interface StageState { dealt: number; showLeftover: boolean; boxValue: string | null; boxDone: boolean }
function nodePxFor(total: number) { return total <= 12 ? 26 : total <= 24 ? 20 : total <= 40 ? 15 : 12 }

function Analyzer({ data, s }: { data: DsRound; s: StageState }) {
  const { total, groups, rem } = data
  const nodePx = nodePxFor(total)
  const pileItems = total - s.dealt
  const equation = s.boxValue != null ? `${total} ÷ ${groups} = ${s.boxValue}` : `${total} ÷ ${groups} = ?`
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 320, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>SHARE {total} · {groups} BAYS</span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.boxDone ? PT.ok : ACCENT.base, boxShadow: `0 0 8px ${s.boxDone ? PT.ok : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '18px 22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* pile of nodes waiting to be shared + the leftover tray */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: nodePx * 1.6, padding: pileItems > 0 || (s.showLeftover && rem > 0) ? '6px 12px' : 0, borderRadius: 14,
          background: s.showLeftover && rem > 0 ? `${PT.warn}22` : 'transparent',
          border: s.showLeftover && rem > 0 ? `2px dashed ${PT.warn}` : '2px solid transparent', transition: 'all .3s' }}>
          {s.showLeftover && rem > 0 && <span style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 12, letterSpacing: 1, color: PT.warn, textTransform: 'uppercase' }}>left over</span>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(nodePx * 0.24), justifyContent: 'center', maxWidth: 400 }}>
            {Array.from({ length: pileItems }).map((_, i) => <Node key={i} size={nodePx} on warn={s.showLeftover && rem > 0} />)}
          </div>
        </div>
        {/* the sharing bays */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(nodePx * 0.7), justifyContent: 'center', alignItems: 'flex-end', maxWidth: 560 }}>
          {Array.from({ length: groups }).map((_, i) => {
            const c = Math.floor(s.dealt / groups) + (i < (s.dealt % groups) ? 1 : 0)
            return <Bay key={i} count={c} nodePx={nodePx} done={s.boxDone} />
          })}
        </div>
        {/* equation + verdict */}
        <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 34, lineHeight: 1, color: s.boxDone ? ACCENT.base : PT.ink, letterSpacing: 1, textShadow: s.boxDone ? `0 0 20px ${ACCENT.base}88` : 'none', transition: 'all .3s', whiteSpace: 'nowrap' }}>{equation}</div>
        <div style={{ height: 30 }}>
          {s.boxDone && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 15, padding: '4px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both',
            background: PT.ok, color: '#04231a', boxShadow: `0 0 18px ${PT.ok}` }}>{data.q} each{rem > 0 ? ` · ${rem} left over` : ' · none left over'}</div>}
        </div>
      </div>
    </div>
  )
}

function Stage({ data, s, short }: { data: DsRound; s: StageState; short?: boolean }) {
  const { w: vw, h: vh } = useViewport()
  const availW = vw * 0.94
  const availH = short ? vh * 0.38 : vh * 0.5
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: short ? '43%' : '45%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 2vw' }}>
      <FitBox availW={availW} availH={availH} max={2.4}><Analyzer data={data} s={s} /></FitBox>
    </div>
  )
}

// ─── Play ─────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const DsPlay: React.FC<{ data: DsRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(58, Math.min(short ? 92 : 116, Math.round(Math.min(vw / 6.5, vh / (short ? 4.4 : 5.2)))))
  const dealTarget = data.groups * data.q
  const [s, setS] = useState<StageState>({ dealt: 0, showLeftover: false, boxValue: null, boxDone: false })
  const [asking, setAsking] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const erred = useRef(false), done = useRef(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  useEffect(() => {
    if (mode === 'guided') speak(data.say)
    const t = window.setTimeout(() => setAsking(true), 700)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function deal(after: () => void) {
    const stepMs = Math.max(50, Math.min(150, Math.round(1400 / Math.max(1, dealTarget))))
    let n = 0
    const tick = () => {
      n++; setS(v => ({ ...v, dealt: n }))
      if (n < dealTarget) timers.current.push(window.setTimeout(tick, stepMs))
      else timers.current.push(window.setTimeout(after, 400))
    }
    if (dealTarget === 0) after(); else tick()
  }

  function choose(c: string) {
    if (done.current || picked !== null || !asking) return
    setPicked(c)
    if (c === data.answer) {
      done.current = true
      deal(() => setS(v => ({ ...v, dealt: dealTarget, showLeftover: true, boxValue: data.answer, boxDone: true })))
      if (mode === 'guided') speak('Correct.')
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 2100)
    } else { erred.current = true; speak(data.rem > 0 ? 'Not quite — deal them out evenly, then count the leftovers. Try again.' : 'Not quite — share them out evenly and count one bay. Try again.'); window.setTimeout(() => setPicked(null), 1100) }
  }

  return (
    <>
      <Stage data={data} s={s} short={short} />
      <PromptCard tag="Share" text={data.prompt} accent={ACCENT} short={short} />
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

// ─── Demo / re-teach: deal the nodes out via ONE speakSteps ────────────────────────────
const DsExplain: React.FC<{ data: DsRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const { total, groups, q, rem } = data
  const dealTarget = groups * q
  const [s, setS] = useState<StageState>({ dealt: 0, showLeftover: false, boxValue: null, boxDone: false })
  const doneRef = useRef(onDone); doneRef.current = onDone
  const timers = useRef<number[]>([])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])
  useEffect(() => {
    const lines = [
      `Share ${numWords(total)} among ${numWords(groups)} bays — deal one to each.`,
      rem > 0
        ? `Each bay gets ${numWords(q)}, with ${numWords(rem)} left over. So ${total} divided by ${groups} is ${q} remainder ${rem}.`
        : `Each bay gets ${numWords(q)}, none left over. So ${total} divided by ${groups} is ${q}.`,
    ]
    const startDeal = () => {
      const stepMs = Math.max(55, Math.min(150, Math.round(1500 / Math.max(1, dealTarget))))
      let n = 0
      const tick = () => { n++; setS(v => ({ ...v, dealt: n })); if (n < dealTarget) timers.current.push(window.setTimeout(tick, stepMs)) }
      if (dealTarget > 0) tick()
    }
    const steps: Array<() => void> = [
      () => startDeal(),
      () => setS(v => ({ ...v, dealt: dealTarget, showLeftover: true, boxValue: data.answer, boxDone: true })),
    ]
    const cancel = speakSteps(lines, { onStep: (i) => { steps[i]?.() }, onDone: () => { window.setTimeout(() => doneRef.current(), 1300) }, fallbackStepMs: 2000 })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (<><Stage data={data} s={s} short={short} /><PromptCard tag="Share" text={data.prompt} accent={ACCENT} short={short} /></>)
}

// ─── Explore sim: slide total & groups and watch the pile share out live ────────────────
function ShareScope() {
  const [total, setTotal] = useState(12)
  const [groups, setGroups] = useState(3)
  const q = Math.floor(total / groups)
  const rem = total % groups
  const nodePx = nodePxFor(total)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 'clamp(20px,6.4vw,38px)', lineHeight: 1, color: PT.ink, letterSpacing: 1, textShadow: `0 0 22px ${ACCENT.base}66`, whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {total} ÷ {groups} = {q}{rem > 0 ? ` r ${rem}` : ''}
      </div>
      {/* the sharing bays */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(nodePx * 0.7), justifyContent: 'center', alignItems: 'flex-end', maxWidth: 560 }}>
        {Array.from({ length: groups }).map((_, i) => <Bay key={i} count={q} nodePx={nodePx} done />)}
      </div>
      {/* leftover tray */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: nodePx * 1.6, padding: rem > 0 ? '6px 12px' : 0, borderRadius: 14,
        background: rem > 0 ? `${PT.warn}22` : 'transparent', border: rem > 0 ? `2px dashed ${PT.warn}` : '2px solid transparent', transition: 'all .3s' }}>
        {rem > 0 && <span style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 12, letterSpacing: 1, color: PT.warn, textTransform: 'uppercase' }}>left over</span>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(nodePx * 0.24), justifyContent: 'center', maxWidth: 400 }}>
          {Array.from({ length: rem }).map((_, i) => <Node key={i} size={nodePx} on warn />)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PtReadout label="each" value={String(q)} accent={ACCENT} />
        <PtReadout label="left over" value={String(rem)} accent={ACCENT} warn={rem > 0} />
      </div>
      <PtSlider label="total nodes" value={total} min={1} max={40} accent={ACCENT} onChange={setTotal} />
      <PtSlider label="number of groups" value={groups} min={1} max={8} accent={ACCENT} onChange={setGroups} />
    </div>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
function makeBeat(): Beat<DsRound> {
  return {
    skillId: 'division', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d) => makeRound((d || 1) as 1 | 2 | 3),
    sig: d => `${d.total}/${d.groups}`,
    prompt: d => d.prompt,
    say: d => d.say,
    Play: ({ data, onSubmit }) => <DsPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <DsExplain data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'
export default function DivisionShare({ onFinish, onExit }: {
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
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeBeat(), [])

  const DEMO: DsRound[] = [mk(3, 4, 0), mk(3, 4, 2)]
  const GUIDED: DsRound = mk(4, 3, 0)

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
        <IntroCard title="Sharing Bays" accent={ACCENT} cta="Start sharing"
          body="Milo deals a pile of energy nodes one-by-one into equal bays until each holds the same. Whatever won't split evenly is the remainder. Watch one, then run the divider yourself."
          onStart={() => { unlockSpeech(); setPhase('explore') }} short={short} />
      )}

      {phase === 'explore' && (
        <ExploreScaffold title="Share it out" accent={ACCENT} short={short}
          intro="Slide the total and the number of groups — watch it share out, with any leftovers."
          onContinue={() => setPhase('demo')}>
          <ShareScope />
        </ExploreScaffold>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo  ·  ${demoIdx + 1}/${DEMO.length}`)}
        <DsExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner('Your turn · deal them out')}
        <DsPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} /></>)}

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
