'use client'
/**
 * /diagnostic — the root-gap diagnostic flow.
 *   intro → probe (anti-fear: no score / no red X) → report.
 * Pick the band with ?band=6-8|9-11|12-14|15-16|17-18 (remediation) or ?band=3-5 (readiness).
 * Uses the pure engine (lib/diagnosticEngine) + probe items (lib/diagnosticItems).
 *
 * Phase 3 — the 3–5 band is a READINESS variant: parent-guided/observational items (the parent does
 * a short activity with the child and taps how it went) + a warm readiness report (what they can do →
 * growing edges → play plan → soft guarantee), NOT the remediation "one snag / algebra / you don't pay".
 * Phase 4 — per-child generated items: a DiagContext (name + theme + seed) makes each child's probe
 * stable, reproducible and personalized; re-takes vary by attempt. Built from the active learner.
 *
 * Results persist best-effort (skips cleanly in the unauthenticated standalone preview).
 */
import { useEffect, useRef, useState } from 'react'
import {
  startProbe, nextSkill, record, diagnose, type ProbeState, type Diagnosis,
} from '@/core/diagnosticEngine'
import { NODE_BY_ID, chapterFor, type Band } from '@/core/skillGraph'
import { makeItem, makeReadinessItem, pickThemeFor, type DiagItem, type DiagContext, type ItemTheme } from '@/core/diagnosticItems'
import { CHAPTER_NAMES } from '@/core/chapters'
import { enqueueDiagnostic, flushDiagnosticQueue } from '@/infra/useOfflineSync'
import { stashPendingDiagnostic } from '@/infra/storage/pendingDiagnostic'
import { setActivePlan } from '@/infra/storage/activePlan'
import { markCheckupDone } from '@/infra/storage/checkup'
import { setLeadEmail, getLeadEmail } from '@/infra/storage/leadEmail'
import { captureDiagnosticLead } from '@/data/repositories'

// UUID v4 dedupe key (matches the session-sync clientId pattern) — makes the save idempotent so a
// queue re-flush can never duplicate the diagnosis. Generated ONCE per completed diagnosis.
function newClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}
import { PT, ACCENTS, LabBackdrop, BackChip, ChoiceButton, PtMilo, IntroCard, type Accent, type ChoiceState } from '@/features/chapters/story/preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import { DiagVisualView } from '@/features/diagnostic/DiagVisual'

const BANDS: Band[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']
const accentFor = (band: Band): Accent => band === '3-5' ? ACCENTS.lime : ACCENTS.cyan
// Cold-traffic self-select (the front door): age → band (band === age_group).
const BAND_PICK: { band: Band; age: string; grade: string }[] = [
  { band: '3-5', age: 'Ages 3–5', grade: 'Pre-K – K' },
  { band: '6-8', age: 'Ages 6–8', grade: 'Grade 1–2' },
  { band: '9-11', age: 'Ages 9–11', grade: 'Grade 3–5' },
  { band: '12-14', age: 'Ages 12–14', grade: 'Grade 6–8' },
  { band: '15-16', age: 'Ages 15–16', grade: 'Grade 9–10' },
  { band: '17-18', age: 'Ages 17–18', grade: 'Grade 11–12' },
]

// chapters.ts id → the /story preview key that launches it ('' = default route). Covers the 3–5,
// 6–8 and 9–11 chapters a plan can start from. Teen (12–18) chapters aren't here → they launch by
// id via /teen-preview?c=<id> (see startPlan).
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

// Active learner (set by the in-app flow via setActiveLearner). Absent for cold traffic (no account)
// and in the standalone preview → the report offers account-creation and save is skipped.
function activeLearner(): { id?: string; name?: string; display_name?: string; age_group?: string; theme?: ItemTheme } | null {
  try { return JSON.parse(sessionStorage.getItem('milo_active_learner') || 'null') } catch { return null }
}
/** Phase 4: build the per-child context from the active learner (safe to call in a handler). */
function buildContext(attempt: number): DiagContext {
  const l = activeLearner()
  const seed = l?.id || 'anon'
  return { name: l?.name || l?.display_name, theme: l?.theme || pickThemeFor(seed), seed, nonce: attempt }
}
function persistDiagnosis(band: Band, s: ProbeState, dx: Diagnosis): Promise<void> {
  const id = activeLearner()?.id
  if (!id) return Promise.resolve()   // preview run, no learner context — nothing to persist to
  markCheckupDone(id)   // this child has now completed their mandatory checkup → passes the play gate
  // Durable-first: enqueue to the offline store (survives a fast nav / flaky network / tab close),
  // then attempt an immediate flush. A failed flush leaves it queued to retry on the next mount/online.
  enqueueDiagnostic({
    learnerId: id, band,
    rootGap: dx.rootGap, secondGap: dx.secondGap,
    blocked: dx.blockedSkills, strengths: dx.strengths, workingLevel: dx.workingLevel,
    planSkills: dx.planSkills, planChapters: dx.planChapters,
    items: s.asked.map(sk => ({ skill: sk, correct: s.passed.includes(sk) })),
    clientId: newClientId(),
  })
  return flushDiagnosticQueue().then(() => {}).catch(() => {})
}

const label = (id: string) => NODE_BY_ID[id]?.label ?? id
const chapterName = (id: string | undefined) => (id && CHAPTER_NAMES[id as keyof typeof CHAPTER_NAMES]) || id || ''

interface Slot { s: ProbeState; skill: string | null; item: DiagItem | null }
/** Advance past skills with no probe item (can't assess → assume ok, bounds descent). 3–5 uses the
 *  readiness (parent-guided) item set, falling back to the child MCQ if a skill has no readiness item. */
function resolve(state: ProbeState, band: Band, ctx: DiagContext): Slot {
  let s = state
  for (let guard = 0; guard < 200; guard++) {
    const skill = nextSkill(s)
    if (!skill) return { s, skill: null, item: null }
    // A repeat ask (fail-confirmation strike) must serve a FRESH item: the seeded generators key
    // on `seed|skill|nonce`, so an unchanged ctx would reproduce the identical question and the
    // child could simply pick a different choice. Folding the ask count into the nonce keeps it
    // deterministic (same child + same answer history → same items) while varying the retry.
    // First asks keep the exact ctx (and items) they had before this change.
    const priorAsks = s.asked.filter(a => a === skill).length
    const ictx = priorAsks > 0 && ctx.seed != null ? { ...ctx, nonce: (ctx.nonce ?? 0) + priorAsks * 101 } : ctx
    const item = (band === '3-5' ? makeReadinessItem(skill, ictx) : null) ?? makeItem(skill, ictx)
    if (!item) { s = record(s, skill, true); continue }
    return { s, skill, item }
  }
  return { s, skill: null, item: null }
}
/** Whether the chosen response counts as "passing" the skill (parent items use passSet; MCQ uses answer). */
const isPass = (item: DiagItem, choice: string) => item.passSet ? item.passSet.includes(choice) : choice === item.answer

type Phase = 'intro' | 'email' | 'probe' | 'report'

export default function DiagnosticPage() {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const btn = Math.max(64, Math.min(short ? 100 : 128, Math.round(Math.min(vw / 5.2, vh / (short ? 4.4 : 5.0)))))
  // The question card clears the MEASURED answer strip, not one assumed row: long labels
  // ("Quadrant III") wrap to two rows on a narrow frame and a fixed one-row reserve gets covered.
  const tilesRef = useRef<HTMLDivElement>(null)
  const [tilesH, setTilesH] = useState(0)
  useEffect(() => { const h = tilesRef.current?.offsetHeight ?? 0; setTilesH(prev => (prev === h ? prev : h)) })
  const [band, setBand] = useState<Band>('9-11')
  const [bandKnown, setBandKnown] = useState(false)   // false for cold traffic → show the age picker
  const [hasLearner, setHasLearner] = useState(false) // signed-in with an active learner → save + skip capture
  const [phase, setPhase] = useState<Phase>('intro')
  const [slot, setSlot] = useState<Slot | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [result, setResult] = useState<Diagnosis | null>(null)
  const [attempt, setAttempt] = useState(0)
  const ctxRef = useRef<DiagContext>({})
  const finalStateRef = useRef<ProbeState | null>(null)   // probe state at report time (for capture/save)
  const persistRef = useRef<Promise<void> | null>(null)   // the in-flight DB save (awaited before we navigate away)

  const accent = accentFor(band)
  const readiness = band === '3-5'

  useEffect(() => {
    const l = activeLearner()
    setHasLearner(!!l?.id)
    // Band precedence: explicit ?band= → the active learner's age group → else cold traffic self-selects.
    const p = new URLSearchParams(window.location.search).get('band')
    if (p && (BANDS as string[]).includes(p)) { setBand(p as Band); setBandKnown(true) }
    else if (l?.age_group && (BANDS as string[]).includes(l.age_group)) { setBand(l.age_group as Band); setBandKnown(true) }
  }, [])

  const pickBand = (b: Band) => { setBand(b); setBandKnown(true) }

  const startProbeNow = () => {
    ctxRef.current = buildContext(attempt)          // Phase 4: seed the probe for this child + attempt
    setSlot(resolve(startProbe(band), band, ctxRef.current)); setPhase('probe')
  }
  // Cold (logged-out) visitors give an email first — required, for lead capture. Signed-in users
  // already have an account, so they go straight in. Once captured (this or a prior visit), we don't
  // re-ask on a retake.
  const begin = () => {
    if (!hasLearner && !getLeadEmail()) { setPhase('email'); return }
    startProbeNow()
  }
  const submitEmail = (email: string) => {
    setLeadEmail(email)                    // prefill the later "free account" signup
    void captureDiagnosticLead(email, band)  // durable lead (best-effort — never blocks the checkup)
    startProbeNow()
  }

  // Launch the plan (step 6). SIGNED-IN → save the arranged plan for this learner + drop into the REAL
  // app (the menu owns learner-loading + progress-saving launch; the plan card walks them through it).
  // COLD/preview → the free preview door (a taste of the first chapter; no profile to save to yet).
  const startPlan = async () => {
    const chs = result?.planChapters ?? []
    const ch = chs[0]
    const lid = activeLearner()?.id
    // SIGNED-IN → always land in the REAL app. An on-track child (no gap → empty plan) still goes to
    // /menu to "get ahead", NOT the anonymous /story preview (which would drop their real profile).
    if (hasLearner && lid) {
      if (chs.length) setActivePlan(lid, band, chs)
      // Don't lose the diagnosis to a fast click: let the in-flight save finish (cap so we never hang).
      try { await Promise.race([persistRef.current ?? Promise.resolve(), new Promise(r => setTimeout(r, 4000))]) } catch { /* best-effort */ }
      window.location.href = window.location.origin + '/menu' + (chs.length ? '?plan=1' : '')
      return
    }
    // COLD, on-track (no plan) → just the free preview door.
    if (ch == null) { window.location.href = window.location.origin + '/story'; return }
    // COLD: stash the result so a play-first visitor is still captured after the taste, then open the
    // free sample with the sign-up banner (?taste=1).
    stashResult()
    if (Object.prototype.hasOwnProperty.call(STORY_KEY, ch)) {
      const key = STORY_KEY[ch]
      window.location.href = window.location.origin + '/story?taste=1' + (key ? `&ch=${key}` : '')
    } else {
      window.location.href = window.location.origin + `/teen-preview?c=${ch}&taste=1`
    }
  }

  const retake = () => { setAttempt(a => a + 1); setPhase('intro'); setResult(null); setSlot(null); setPicked(null) }

  // Stash the result to the browser so it survives sign-up (the parent page replays it against the
  // learner they create). Called by BOTH the "save this plan" CTA and the "just start playing" taste,
  // so a play-first visitor is captured too.
  const stashResult = () => {
    const r = result, s = finalStateRef.current
    if (!r) return
    stashPendingDiagnostic({
      band, childName: ctxRef.current.name,
      rootGap: r.rootGap, secondGap: r.secondGap, blocked: r.blockedSkills,
      strengths: r.strengths, workingLevel: r.workingLevel,
      planSkills: r.planSkills, planChapters: r.planChapters,
      items: (s?.asked ?? []).map(sk => ({ skill: sk, correct: s!.passed.includes(sk) })),
      clientId: newClientId(),   // reused verbatim on replay → the post-signup save is idempotent
    })
  }
  // Capture-at-peak-intent: a cold (logged-out) parent saves this plan by creating a free account.
  const captureAndSignup = () => { stashResult(); window.location.href = window.location.origin + '/auth' }

  function answer(choice: string) {
    if (!slot?.skill || !slot.item || picked) return
    setPicked(choice)
    const passed = isPass(slot.item, choice)
    // Anti-fear: no right/wrong shown — a brief neutral beat, then advance.
    window.setTimeout(() => {
      const next = resolve(record(slot.s, slot.skill!, passed), band, ctxRef.current)
      setPicked(null)
      if (!next.skill) {
        const dx = diagnose(next.s)
        finalStateRef.current = next.s
        setResult(dx); setPhase('report')
        persistRef.current = persistDiagnosis(band, next.s, dx)   // signed-in → saves; cold/preview → skips cleanly
      } else setSlot(next)
    }, 320)
  }

  // ── INTRO ────────────────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <style>{`@keyframes pt_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes pt_pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}@keyframes pt_twinkle{0%,100%{opacity:.25}50%{opacity:.8}}`}</style>
        <LabBackdrop accent={accent} /><BackChip onExit={() => history.back()} />
        {!bandKnown
          ? <AgePicker accent={accent} onPick={pickBand} />
          : <IntroCard accent={accent} short={short}
            title={readiness ? 'A quick readiness check' : 'Find your starting point'}
            cta={readiness ? "Let's play together" : "Let's explore"}
            body={readiness
              ? "Sit with your child for a few minutes of play. Milo suggests a small activity; you do it together and tap how it went — no scores, no pass/fail, just a friendly picture of what they're ready for."
              : "Milo will ask a few quick questions to find exactly where to help — not a test, no scores, no timers. Just play along; some will be easy, some tricky. Milo figures out the rest."}
            onStart={begin} />}
        <PtMilo left={9} />
      </div>
    )
  }

  // ── EMAIL GATE (cold traffic only) ────────────────────────────────────────────────────
  if (phase === 'email') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <LabBackdrop accent={accent} /><BackChip onExit={() => setPhase('intro')} />
        <EmailGate accent={accent} short={short} onSubmit={submitEmail} />
        <PtMilo left={9} />
      </div>
    )
  }

  // ── PROBE ────────────────────────────────────────────────────────────────────────────
  if (phase === 'probe' && slot?.item) {
    const asked = slot.s.asked.length
    const item = slot.item

    // Parent-guided readiness item: a calm centered "do this together" card + stacked outcome buttons.
    if (item.kind === 'parent') {
      return (
        <div style={{ position: 'relative', width: '100vw', minHeight: '100dvh', overflow: 'auto', background: `radial-gradient(125% 90% at 50% -10%, ${PT.bg1}, ${PT.bg0} 70%)` }}>
          <BackChip onExit={() => history.back()} />
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '64px 20px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(8px)', border: `1px solid ${accent.base}66`, borderRadius: 18, padding: '20px 22px 22px', boxShadow: `0 0 24px ${accent.base}22, 0 14px 34px rgba(0,0,0,0.45)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontFamily: PT.mono, fontSize: 10.5, letterSpacing: 1.5, color: accent.base, background: accent.soft, borderRadius: 6, padding: '4px 9px', textTransform: 'uppercase' }}>Do this together</span>
                <span style={{ fontFamily: PT.mono, fontSize: 11, color: PT.inkMute }}>Step {asked + 1}</span>
              </div>
              <p style={{ margin: 0, fontFamily: PT.sans, fontWeight: 600, fontSize: 'clamp(20px,3.2vh,26px)', lineHeight: 1.42, color: PT.ink }}>{item.prompt}</p>
            </div>
            <div style={{ fontFamily: PT.sans, fontSize: 14, color: PT.inkMute, textAlign: 'center', marginTop: -6 }}>How did it go?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {item.choices.map(c => {
                const sel = picked === c
                const dim = picked && !sel
                return (
                  <button key={c} onClick={() => answer(c)} disabled={!!picked} style={{
                    padding: '18px 20px', borderRadius: 14, cursor: picked ? 'default' : 'pointer', textAlign: 'left',
                    background: sel ? accent.base : PT.panel, border: `1.5px solid ${sel ? accent.base : PT.lineStrong}`,
                    color: sel ? '#06121f' : PT.ink, fontFamily: PT.sans, fontWeight: 600, fontSize: 'clamp(16px,2.4vh,19px)',
                    opacity: dim ? 0.4 : 1, transition: 'all .16s ease',
                    boxShadow: sel ? `0 0 20px ${accent.base}88` : '0 4px 12px rgba(0,0,0,0.3)',
                  }}>{c}</button>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    // Child-facing MCQ item (6–8 … 17–18): the HUD probe.
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <style>{`@keyframes pt_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes pt_twinkle{0%,100%{opacity:.25}50%{opacity:.8}}`}</style>
        <LabBackdrop accent={accent} /><BackChip onExit={() => history.back()} />
        {/* The question — centered, large + responsive. Sits in the band between the top chip and the
            bottom answer tiles (bottom reserve derives from the tile size), so it stays clear at every
            viewport. Replaces the old top pill + progress dots. */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: `${short ? 52 : 76}px 6vw ${(tilesH || btn) + (short ? 28 : 48)}px`, pointerEvents: 'none' }}>
          <div style={{ maxWidth: 'min(94vw,780px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 8 : 16, textAlign: 'center',
            background: PT.panel, backdropFilter: 'blur(8px)', borderRadius: 20, border: `1px solid ${accent.base}66`,
            padding: short ? '14px clamp(20px,5vw,40px)' : 'clamp(20px,4vh,40px) clamp(26px,5vw,60px)',
            boxShadow: `0 0 30px ${accent.base}33, 0 14px 34px rgba(0,0,0,0.45)` }}>
            <span style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: short ? 11 : 12.5, letterSpacing: 1.5, color: accent.base, background: accent.soft, borderRadius: 7, padding: '4px 10px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{`Question ${asked + 1}`}</span>
            <span style={{ fontFamily: PT.sans, fontWeight: 800, fontSize: short ? 'clamp(22px,6vh,36px)' : item.visual ? 'clamp(24px,4.8vh,44px)' : 'clamp(30px,6.6vh,60px)', lineHeight: 1.18, color: PT.ink }}>{item.prompt}</span>
            {item.visual && <DiagVisualView v={item.visual} accent={accent} />}
          </div>
        </div>
        <div ref={tilesRef} style={{ position: 'fixed', left: 0, right: 0, bottom: short ? Math.max(6, Math.round(btn * 0.14)) : '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: short ? Math.round(btn * 0.24) : 'clamp(12px,3vw,28px)', flexWrap: 'wrap', padding: '0 12px' }}>
          {item.choices.map(c => {
            const st: ChoiceState = picked === c ? 'right' : picked ? 'dim' : 'idle'
            // 'right' just gives a neutral selected highlight here — correctness is never revealed.
            return <ChoiceButton key={c} label={c} accent={accent} state={picked === c ? 'idle' : st === 'dim' ? 'dim' : 'idle'} size={btn} onClick={() => answer(c)} disabled={!!picked} />
          })}
        </div>
        <PtMilo left={9} />
      </div>
    )
  }

  // ── REPORT ───────────────────────────────────────────────────────────────────────────
  if (phase === 'report' && result) {
    const onSave = hasLearner ? undefined : captureAndSignup   // cold traffic → offer account-creation
    return readiness
      ? <ReadinessReport r={result} accent={accent} onStart={startPlan} onRetake={retake} onSave={onSave} name={ctxRef.current.name} />
      : <RemediationReport r={result} accent={accent} onStart={startPlan} onRetake={retake} onSave={onSave} />
  }

  return null
}

// ── Remediation report (6–8 … 17–18): strengths → the one snag → cost → plan → guarantee ──
function RemediationReport({ r, accent, onStart, onRetake, onSave }: { r: Diagnosis; accent: Accent; onStart: () => void; onRetake: () => void; onSave?: () => void }) {
  const root = r.rootGap
  const highlightNames = r.downstreamHighlights.map(label)
  const planNames: string[] = []
  for (const ch of r.planChapters) { const n = chapterName(ch); if (n && !planNames.includes(n)) planNames.push(n) }
  return (
    <ReportShell accent={accent} subtitle={r.workingLevel} onStart={onStart} onRetake={onRetake} onSave={onSave} cta={root ? 'Start the plan →' : 'Get ahead →'}>
      {!root ? (
        <Card accent={accent} title="✅ On track — ready to get ahead">
          Milo didn&apos;t find a gap holding things back. Great place to be — we&apos;ll set a plan that
          stretches into the next skills.
        </Card>
      ) : (
        <>
          {r.strengths.length > 0 && (
            <Card accent={{ base: PT.ok } as Accent} title="✅ What's working">
              {r.strengths.map(label).join(' · ')}. This child is <strong>not behind across the board</strong>.
            </Card>
          )}
          <Card accent={accent} title="🎯 The one snag">
            {/* Claim strength matches evidence strength: a 6–8 question screener POINTS TO a root;
                the plan's first chapters (a dozen adaptive questions each) are what confirm it.
                Saying "is" here would claim more than the probe can carry. */}
            Every sign points to <strong style={{ color: accent.base }}>{label(root)}</strong> — everything built on it
            feels harder than it should. <strong>It&apos;s one specific gap, and it&apos;s fixable.</strong> The
            first days of the plan double-check it as your child plays, and adjust if the real snag sits deeper.
          </Card>
          <Card accent={{ base: PT.warn } as Accent} title="⏳ Why it matters now">
            This skill is the foundation for {highlightNames.join(', ') || 'the skills above it'}
            {r.reachesAlgebra ? ', and in time, algebra' : ''}. Left alone the gap compounds — each new
            topic stacks on it. Caught now, it&apos;s weeks of work, not years.
          </Card>
          <Card accent={accent} title="🗺️ The plan">
            {planNames.join('  →  ')}<br />
            <span style={{ color: PT.inkSoft }}>10 minutes a day, starting at the gap and rebuilding up — as play, no timers, no red X&apos;s.</span>
          </Card>
          <Card accent={accent} title="🔒 Our promise">
            We&apos;ll re-check in 6 weeks. If this gap hasn&apos;t measurably closed, <strong>you don&apos;t pay.</strong>
          </Card>
        </>
      )}
    </ReportShell>
  )
}

// ── Readiness report (3–5): warm, milestone-based — can-do → growing edges → play plan → soft promise ──
function ReadinessReport({ r, accent, onStart, onRetake, onSave, name }: { r: Diagnosis; accent: Accent; onStart: () => void; onRetake: () => void; onSave?: () => void; name?: string }) {
  const who = name?.trim() || 'Your child'
  const ready = r.probedPassed
  const notYet = [...r.probedFailed].sort((a, b) => (r.planSkills.indexOf(a)) - (r.planSkills.indexOf(b)))
  const planNames: string[] = []
  for (const ch of r.planChapters) { const n = chapterName(ch); if (n && !planNames.includes(n)) planNames.push(n) }
  const n = notYet.length
  const verdict = n === 0
    ? { emoji: '🌟', head: 'Kindergarten-ready!', line: `${who} is showing every early-number milestone Milo checked. A wonderful place to be — let's keep the momentum with some get-ahead play.` }
    : n <= 2
      ? { emoji: '🌱', head: 'Almost there', line: `${who} has most of the building blocks — just ${n === 1 ? 'one milestone' : 'a couple of milestones'} left to grow. This is completely normal at this age, and easy to nurture through play.` }
      : { emoji: '🌱', head: 'Building the foundations', line: `${who} is early in a few of these milestones — exactly what this age is for. Here's where a little playful practice goes the furthest.` }
  const subtitle = r.workingLevel.startsWith('At or above') ? 'Readiness check' : `${ready.length} of ${ready.length + n} milestones ready`

  return (
    <ReportShell accent={accent} subtitle={subtitle} onStart={onStart} onRetake={onRetake} onSave={onSave} cta="Start playing →" heading={`${who}'s readiness`} saveCta="Save this plan — free account →">
      <Card accent={accent} title={`${verdict.emoji} ${verdict.head}`}>{verdict.line}</Card>
      {ready.length > 0 && (
        <Card accent={{ base: PT.ok } as Accent} title="✅ What they can already do">
          {ready.map(label).join(' · ')}. <strong>Real strengths to celebrate.</strong>
        </Card>
      )}
      {n > 0 && (
        <Card accent={accent} title="🌱 Let's grow together">
          Coming along next: {notYet.map(label).join(', ')}. Nothing is wrong — these are the very next
          steps, and they grow fast with a few playful minutes a day.
        </Card>
      )}
      {planNames.length > 0 && (
        <Card accent={accent} title="🧩 Play these together">
          {planNames.join('  →  ')}<br />
          <span style={{ color: PT.inkSoft }}>A few minutes a day, as play — Milo does the teaching, you cheer them on.</span>
        </Card>
      )}
      <Card accent={accent} title="🤗 Our promise">
        Most children close these readiness milestones in a few weeks of play. We&apos;ll check back in and
        cheer {who} on the whole way — <strong>no pressure, no scores.</strong>
      </Card>
    </ReportShell>
  )
}

// ── Shared report chrome ───────────────────────────────────────────────────────────────
// When `onSave` is set (cold traffic, no account), the capture CTA is the PRIMARY action — the
// report is the peak-intent moment, so "save this plan + free account" leads; "just start playing"
// and "retake" are secondary. Signed-in users skip capture (their result already saved).
function ReportShell({ accent, subtitle, heading = "Here's what we found", cta, onStart, onRetake, onSave, saveCta = 'Save this plan — free account →', children }: {
  accent: Accent; subtitle: string; heading?: string; cta: string; onStart: () => void; onRetake: () => void; onSave?: () => void; saveCta?: string; children: React.ReactNode
}) {
  const ghost: React.CSSProperties = { padding: '12px 22px', borderRadius: 13, cursor: 'pointer', background: 'transparent', border: `1px solid ${PT.line}`, color: PT.inkSoft, fontFamily: PT.sans, fontWeight: 600, fontSize: 15 }
  const primary: React.CSSProperties = { padding: '13px 30px', borderRadius: 13, cursor: 'pointer', background: accent.base, border: `1px solid ${accent.base}`, color: '#06121f', fontFamily: PT.sans, fontWeight: 700, fontSize: 16, boxShadow: `0 0 22px ${accent.base}88` }
  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100dvh', overflow: 'auto', background: `radial-gradient(125% 90% at 50% -10%, ${PT.bg1}, ${PT.bg0} 70%)` }}>
      <BackChip onExit={() => history.back()} />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '64px 20px 40px', fontFamily: PT.sans, color: PT.ink }}>
        <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2, color: accent.base, textTransform: 'uppercase', marginBottom: 6 }}>Milo&apos;s report</div>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, fontFamily: PT.sans, color: PT.ink }}>{heading}</h1>
        <div style={{ fontFamily: PT.mono, fontSize: 13, color: PT.inkMute, marginBottom: 20 }}>{subtitle}</div>
        {children}
        {onSave ? (
          <>
            <button onClick={onSave} style={{ ...primary, width: '100%', marginTop: 12, fontSize: 17, padding: '15px 24px' }}>{saveCta}</button>
            <div style={{ fontFamily: PT.sans, fontSize: 12.5, color: PT.inkMute, textAlign: 'center', margin: '8px 0 0' }}>Free to start · we&apos;ll check back in at week 6</div>
            {/* Mandatory sign-up: creating the free account is the only way forward (no play-first taste).
                A returning parent uses the "Log in" button on the checkup screen instead. */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={onRetake} style={ghost}>Retake</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <button onClick={onRetake} style={ghost}>Retake</button>
            <button onClick={onStart} style={primary}>{cta}</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Required email gate (cold traffic): capture a lead before the checkup, prefill signup later ──
function EmailGate({ accent, short, onSubmit }: { accent: Accent; short?: boolean; onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState(() => getLeadEmail() ?? '')
  const [err, setErr] = useState<string | null>(null)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const submit = () => { if (!valid) { setErr('Please enter a valid email'); return } onSubmit(email.trim()) }
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: PT.panel, backdropFilter: 'blur(8px)', border: `1px solid ${accent.base}66`, borderRadius: 20, padding: short ? '22px 20px' : '30px 28px', boxShadow: `0 0 30px ${accent.base}22, 0 18px 40px rgba(0,0,0,0.5)`, textAlign: 'center' }}>
        <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2.5, color: accent.base, textTransform: 'uppercase', marginBottom: 10 }}>One quick thing</div>
        <h1 style={{ margin: '0 0 8px', fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 22 : 26, color: PT.ink }}>Where should we send the results?</h1>
        <p style={{ margin: '0 0 20px', fontFamily: PT.sans, fontSize: 14.5, lineHeight: 1.5, color: PT.inkMute }}>Enter your email so we can save your child&apos;s starting point and plan. No spam — just the results.</p>
        <input
          type="email" inputMode="email" autoFocus value={email} placeholder="you@example.com"
          onChange={e => { setEmail(e.target.value); if (err) setErr(null) }}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          style={{ width: '100%', boxSizing: 'border-box', padding: '15px 16px', borderRadius: 12, border: `1.5px solid ${err ? '#e0483f' : PT.lineStrong}`, background: 'rgba(255,255,255,0.06)', color: PT.ink, fontFamily: PT.sans, fontSize: 17, outline: 'none', textAlign: 'center' }}
        />
        {err && <div style={{ marginTop: 8, fontFamily: PT.sans, fontSize: 13, color: '#ff8a80' }}>{err}</div>}
        <button onClick={submit} disabled={!valid} style={{ marginTop: 16, width: '100%', padding: 16, borderRadius: 50, border: 'none', cursor: valid ? 'pointer' : 'not-allowed', background: valid ? accent.base : PT.line, color: valid ? '#06121f' : PT.inkMute, fontFamily: PT.sans, fontWeight: 800, fontSize: 17, boxShadow: valid ? `0 0 22px ${accent.base}66` : 'none', transition: 'all .16s ease' }}>Start the check →</button>
        <p style={{ margin: '12px 0 0', fontFamily: PT.sans, fontSize: 11.5, color: PT.inkMute }}>Free · takes about 2 minutes</p>
      </div>
    </div>
  )
}

// ── Cold-traffic age picker (the front door self-select) ───────────────────────────────
function AgePicker({ accent, onPick }: { accent: Accent; onPick: (b: Band) => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 6vw' }}>
      {/* Returning user? Log in and their checkup comes from their account (even on a new device). */}
      <a href="/auth" style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', right: 18, zIndex: 46, fontFamily: PT.mono, fontSize: 13, fontWeight: 700, color: accent.base, textDecoration: 'none', background: PT.panel, border: `1px solid ${accent.base}66`, borderRadius: 10, padding: '8px 14px' }}>Log in →</a>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2, color: accent.base, textTransform: 'uppercase', marginBottom: 8 }}>Free · 2 minutes · no account needed</div>
        <h2 style={{ margin: '0 0 6px', fontFamily: PT.sans, fontWeight: 700, fontSize: 24, color: PT.ink }}>How old is your child?</h2>
        <p style={{ margin: 0, fontFamily: PT.sans, fontSize: 15, lineHeight: 1.5, color: PT.inkSoft }}>Milo will find exactly where to help — the deepest thing worth fixing first.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, width: '100%', maxWidth: 480 }}>
        {BAND_PICK.map(b => (
          <button key={b.band} onClick={() => onPick(b.band)} style={{
            padding: '16px 14px', borderRadius: 15, cursor: 'pointer', textAlign: 'center',
            background: PT.panel, backdropFilter: 'blur(6px)', border: `1.5px solid ${accentFor(b.band).base}55`,
            boxShadow: `0 0 14px ${accentFor(b.band).base}18, 0 6px 16px rgba(0,0,0,0.3)`, transition: 'transform .14s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
            <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: 17, color: PT.ink }}>{b.age}</div>
            <div style={{ fontFamily: PT.mono, fontSize: 11, color: PT.inkMute, marginTop: 3 }}>{b.grade}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Card({ title, accent, children }: { title: string; accent: { base: string }; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', background: PT.panel, border: `1px solid ${accent.base}44`, borderRadius: 14, padding: '14px 18px', marginBottom: 12, boxShadow: `0 8px 22px rgba(0,0,0,.35)` }}>
      <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: 15, color: accent.base, marginBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: PT.sans, fontSize: 15, lineHeight: 1.55, color: PT.ink }}>{children}</div>
    </div>
  )
}
