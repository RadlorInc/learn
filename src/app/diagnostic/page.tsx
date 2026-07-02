'use client'
/**
 * /diagnostic — the root-gap diagnostic flow (Phase 1, proving on the 9–11 band).
 *   intro → probe (kid-facing, anti-fear: no score / no red X) → report (parent-facing).
 * Pick the band with ?band=9-11 (default). Uses the pure engine (lib/diagnosticEngine) + the
 * lightweight probe items (lib/diagnosticItems). Results are NOT persisted yet (that's the
 * migration step); this runs entirely client-side so it's verifiable in preview.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  startProbe, nextSkill, record, diagnose, type ProbeState, type Diagnosis,
} from '@/lib/diagnosticEngine'
import { NODE_BY_ID, chapterFor, type Band } from '@/lib/skillGraph'
import { makeItem, type DiagItem } from '@/lib/diagnosticItems'
import { CHAPTER_NAMES } from '@/lib/chapters'
import { saveDiagnostic } from '@/lib/supabase/queries'
import { PT, ACCENTS, LabBackdrop, BackChip, PromptCard, ChoiceButton, PtMilo, IntroCard, type ChoiceState } from '@/components/story/preteen/kit'

const ACCENT = ACCENTS.cyan
const BANDS: Band[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']

// chapters.ts id → the /story preview key that launches it ('' = default route). Covers the 3–5,
// 6–8 and 9–11 chapters a plan can start from. (Teen chapters launch elsewhere; not hit by 9–11.)
const STORY_KEY: Record<string, string> = {
  counting: '', numberOrdering: 'order', numberComparison: 'kitchen', numberRecognition: 'doors',
  matchingQuantities: 'grocery', shapes: 'shapes', colors: 'rainbow', patterns: 'beads',
  addition: 'add', subtraction: 'sub', measurement: 'measure',
  numbersTo100: 'numbers', placeValue: 'place', skipCounting: 'skip', compareNumbers: 'compare',
  storyProblems: 'story', multiplication: 'multiply', fractions: 'fractions', money: 'money',
  time: 'time', additionTo100: 'add100', subtractionTo100: 'sub100', shapes2d3d: 'solids',
  bigNumbers: 'bignum', rounding: 'round', timesTables: 'times', division: 'divide',
  factorsMultiples: 'factors', fractionsCompare: 'fcompare', decimals: 'decimals',
  measurementUnits: 'units', areaPerimeter: 'area', anglesSymmetry: 'angles',
  dataGraphs: 'data', wordProblems: 'word',
}

function useViewport() {
  const [vp, setVp] = useState({ w: 1000, h: 700 })
  useEffect(() => {
    const calc = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    calc(); window.addEventListener('resize', calc); window.addEventListener('orientationchange', calc)
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('orientationchange', calc) }
  }, [])
  return vp
}

// Active learner (set by the in-app flow). Absent in the standalone /diagnostic preview → skip save.
function activeLearnerId(): string | null {
  try { return JSON.parse(sessionStorage.getItem('milo_active_learner') || 'null')?.id ?? null } catch { return null }
}
async function persistDiagnosis(band: Band, s: ProbeState, dx: Diagnosis) {
  const learnerId = activeLearnerId()
  if (!learnerId) return   // preview run, no learner context — nothing to persist to
  await saveDiagnostic({
    learnerId, band,
    rootGap: dx.rootGap, secondGap: dx.secondGap,
    blocked: dx.blockedSkills, strengths: dx.strengths, workingLevel: dx.workingLevel,
    planSkills: dx.planSkills, planChapters: dx.planChapters,
    items: s.asked.map(sk => ({ skill: sk, correct: s.passed.includes(sk) })),
  })
}

const label = (id: string) => NODE_BY_ID[id]?.label ?? id
const chapterName = (id: string | undefined) => (id && CHAPTER_NAMES[id as keyof typeof CHAPTER_NAMES]) || id || ''

interface Slot { s: ProbeState; skill: string | null; item: DiagItem | null }
/** Advance past skills with no probe item (can't assess → assume ok, bounds descent). */
function resolve(state: ProbeState): Slot {
  let s = state
  for (let guard = 0; guard < 200; guard++) {
    const skill = nextSkill(s)
    if (!skill) return { s, skill: null, item: null }
    const item = makeItem(skill)
    if (!item) { s = record(s, skill, true); continue }
    return { s, skill, item }
  }
  return { s, skill: null, item: null }
}

type Phase = 'intro' | 'probe' | 'report'

export default function DiagnosticPage() {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(56, Math.min(short ? 88 : 108, Math.round(Math.min(vw / 6.5, vh / (short ? 4.6 : 5.4)))))
  const [band, setBand] = useState<Band>('9-11')
  const [phase, setPhase] = useState<Phase>('intro')
  const [slot, setSlot] = useState<Slot | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [result, setResult] = useState<Diagnosis | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('band')
    if (p && (BANDS as string[]).includes(p)) setBand(p as Band)
  }, [])

  const begin = () => { setSlot(resolve(startProbe(band))); setPhase('probe') }

  // Launch the first chapter of the plan (the root gap's remediation) — closes the loop.
  const startPlan = () => {
    const ch = result?.planChapters[0]
    if (ch == null) { setPhase('intro'); return }
    const key = STORY_KEY[ch]
    window.location.href = window.location.origin + '/story' + (key ? `?ch=${key}` : '')
  }

  function answer(choice: string) {
    if (!slot?.skill || !slot.item || picked) return
    setPicked(choice)
    const correct = choice === slot.item.answer
    // Anti-fear: no right/wrong shown — a brief neutral beat, then advance.
    window.setTimeout(() => {
      const next = resolve(record(slot.s, slot.skill!, correct))
      setPicked(null)
      if (!next.skill) {
        const dx = diagnose(next.s)
        setResult(dx); setPhase('report')
        void persistDiagnosis(band, next.s, dx)   // best-effort; skips cleanly in preview
      } else setSlot(next)
    }, 320)
  }

  if (phase === 'intro') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <style>{`@keyframes pt_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes pt_pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}@keyframes pt_twinkle{0%,100%{opacity:.25}50%{opacity:.8}}`}</style>
        <LabBackdrop accent={ACCENT} /><BackChip onExit={() => history.back()} />
        <IntroCard title="Find your starting point" accent={ACCENT} cta="Let's explore"
          body="Milo will ask a few quick questions to find exactly where to help — not a test, no scores, no timers. Just play along; some will be easy, some tricky. Milo figures out the rest."
          onStart={begin} short={short} />
        <PtMilo left={9} />
      </div>
    )
  }

  if (phase === 'probe' && slot?.item) {
    const asked = slot.s.asked.length
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <style>{`@keyframes pt_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes pt_twinkle{0%,100%{opacity:.25}50%{opacity:.8}}`}</style>
        <LabBackdrop accent={ACCENT} /><BackChip onExit={() => history.back()} />
        <PromptCard tag={`Question ${asked + 1}`} text={slot.item.prompt} accent={ACCENT} short={short} />
        <div style={{ position: 'fixed', left: 0, right: 0, top: '46%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', gap: 8 }}>
          {Array.from({ length: Math.min(asked + 1, 10) }).map((_, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= asked ? ACCENT.base : PT.line, boxShadow: i <= asked ? `0 0 8px ${ACCENT.base}` : 'none' }} />
          ))}
        </div>
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3vw,28px)', flexWrap: 'wrap', padding: '0 12px' }}>
          {slot.item.choices.map(c => {
            const st: ChoiceState = picked === c ? 'right' : picked ? 'dim' : 'idle'
            // 'right' just gives a neutral selected highlight here — correctness is never revealed.
            return <ChoiceButton key={c} label={c} accent={ACCENT} state={picked === c ? 'idle' : st === 'dim' ? 'dim' : 'idle'} size={btn} onClick={() => answer(c)} disabled={!!picked} />
          })}
        </div>
        <PtMilo left={9} />
      </div>
    )
  }

  if (phase === 'report' && result) {
    const r = result
    const root = r.rootGap
    const highlightNames = r.downstreamHighlights.map(label)
    const planNames: string[] = []
    for (const ch of r.planChapters) { const n = chapterName(ch); if (n && !planNames.includes(n)) planNames.push(n) }
    return (
      <div style={{ position: 'relative', width: '100vw', minHeight: '100dvh', overflow: 'auto', background: `radial-gradient(125% 90% at 50% -10%, ${PT.bg1}, ${PT.bg0} 70%)` }}>
        <BackChip onExit={() => history.back()} />
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '64px 20px 40px', fontFamily: PT.sans, color: PT.ink }}>
          <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2, color: ACCENT.base, textTransform: 'uppercase', marginBottom: 6 }}>Milo's report</div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, fontFamily: PT.sans, color: PT.ink }}>Here's what we found</h1>
          <div style={{ fontFamily: PT.mono, fontSize: 13, color: PT.inkMute, marginBottom: 20 }}>{r.workingLevel}</div>

          {!root ? (
            <Card accent={ACCENT} title="✅ On track — ready to get ahead">
              Milo didn't find a gap holding things back. Great place to be — we'll set a plan that
              stretches into the next skills.
            </Card>
          ) : (
            <>
              {r.strengths.length > 0 && (
                <Card accent={{ base: PT.ok }} title="✅ What's working">
                  {r.strengths.map(label).join(' · ')}. This child is <strong>not behind across the board</strong>.
                </Card>
              )}
              <Card accent={ACCENT} title="🎯 The one snag">
                The real block is <strong style={{ color: ACCENT.base }}>{label(root)}</strong> — everything built on it
                feels harder than it should. <strong>It's one specific gap, and it's fixable.</strong>
              </Card>
              <Card accent={{ base: PT.warn }} title="⏳ Why it matters now">
                This skill is the foundation for {highlightNames.join(', ') || 'the skills above it'}
                {r.reachesAlgebra ? ', and in time, algebra' : ''}. Left alone the gap compounds — each new
                topic stacks on it. Caught now, it's weeks of work, not years.
              </Card>
              <Card accent={ACCENT} title="🗺️ The plan">
                {planNames.join('  →  ')}<br />
                <span style={{ color: PT.inkSoft }}>10 minutes a day, starting at the gap and rebuilding up — as play, no timers, no red X's.</span>
              </Card>
              <Card accent={ACCENT} title="🔒 Our promise">
                We'll re-check in 6 weeks. If this gap hasn't measurably closed, <strong>you don't pay.</strong>
              </Card>
            </>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <button onClick={() => { setPhase('intro'); setResult(null); setSlot(null) }}
              style={{ padding: '12px 22px', borderRadius: 13, cursor: 'pointer', background: 'transparent', border: `1px solid ${PT.line}`, color: PT.inkSoft, fontFamily: PT.sans, fontWeight: 600, fontSize: 15 }}>Retake</button>
            <button onClick={startPlan}
              style={{ padding: '12px 30px', borderRadius: 13, cursor: 'pointer', background: ACCENT.base, border: `1px solid ${ACCENT.base}`, color: '#06121f', fontFamily: PT.sans, fontWeight: 700, fontSize: 16, boxShadow: `0 0 22px ${ACCENT.base}88` }}>
              {result?.rootGap ? 'Start the plan →' : 'Get ahead →'}</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function Card({ title, accent, children }: { title: string; accent: { base: string }; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', background: PT.panel, border: `1px solid ${accent.base}44`, borderRadius: 14, padding: '14px 18px', marginBottom: 12, boxShadow: `0 8px 22px rgba(0,0,0,.35)` }}>
      <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: 15, color: accent.base, marginBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: PT.sans, fontSize: 15, lineHeight: 1.55, color: PT.ink }}>{children}</div>
    </div>
  )
}
