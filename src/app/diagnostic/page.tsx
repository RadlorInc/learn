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
  startProbe, nextSkill, record, diagnose, strandChoices, type ProbeState, type Diagnosis,
} from '@/core/diagnosticEngine'
import { NODE_BY_ID, chapterFor, type Band } from '@/core/skillGraph'
import { demoEligible } from '@/core/arChapters'
import { makeItem, makeReadinessItem, pickThemeFor, gradeItem, type DiagItem, type DiagContext, type ItemTheme } from '@/core/diagnosticItems'
import { CHAPTER_NAMES } from '@/core/chapters'
import { enqueueDiagnostic, flushDiagnosticQueue } from '@/infra/useOfflineSync'
import { stashPendingDiagnostic } from '@/infra/storage/pendingDiagnostic'
import { setActivePlan } from '@/infra/storage/activePlan'
import { markCheckupDone } from '@/infra/storage/checkup'
import { setLeadEmail, getLeadEmail } from '@/infra/storage/leadEmail'
import { kv } from '@/infra/storage/kv'
import { saveResume, readResume, clearResume, resumable, sameTab, type DiagResume } from '@/infra/storage/diagResume'
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
import { DiagPad } from '@/features/diagnostic/DiagPad'

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
  bigNumbers: 'bignum', rounding: 'round',
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
/**
 * ⚠️ THE PLAN IS WALKED ONE CHAPTER AT A TIME, SO THE REPORT SHOWS THE FIRST FEW AND SAYS HOW MANY.
 * The route is derived from the gap up to the child's grade, and for a deep gap that is honestly
 * long — measured, a 17–18 learner rooting in grade school needs ~19 chapters. Printing all of them
 * turns "here is the plan" into a wall a parent cannot read, and reads as a bill rather than a
 * route. Truncating the DATA would be worse (the pointer walks the whole list), so only the display
 * is capped, and the count is stated rather than hidden. */
const PLAN_SHOWN = 5
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
/** Whether a response counts as "passing" the skill. `gradeItem` owns it: parent items use their
 *  passSet, a typed number compares NUMERICALLY (so "07" passes), everything else is exact. */
const isPass = gradeItem

type Phase = 'intro' | 'email' | 'door' | 'probe' | 'report'

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
  const [pending, setPending] = useState<DiagResume | null>(null)   // a saved run from an earlier sitting, offered rather than applied
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

    // ⚠️ kv IS HYDRATED ASYNCHRONOUSLY, so a synchronous read here returns null on a cold load and
    // the resume silently never fires — the exact shape of a check that reports "nothing to resume"
    // having looked at an empty map. Wait for ready() before reading.
    let dead = false
    void kv.ready().then(() => {
      if (dead) return
      const r = readResume(l?.id ?? null)
      if (!resumable(r, p)) { if (r) clearResume(l?.id ?? null); return }   // another band: drop it
      // SAME TAB → the child is mid-probe and never left; resume silently, as it always has.
      // ANOTHER SITTING → they came back. Dropping them into question 26 of a run they may not
      // remember starting, with no way back to a fresh check, is a dead end — so it is OFFERED.
      if (sameTab()) { applyResume(r!) } else { setPending(r!); setBandKnown(true); setBand(r!.band) }
    })
    return () => { dead = true }
  }, [])

  const applyResume = (r: DiagResume) => {
    ctxRef.current = buildContext(r.attempt)
    setBand(r.band); setBandKnown(true); setAttempt(r.attempt); setPending(null)
    setSlot(resolve(r.s, r.band, ctxRef.current)); setPhase('probe')
  }
  /** "Start fresh" on the resume offer: bin the saved run and fall back to the ordinary intro. */
  const discardResume = () => { clearResume(activeLearner()?.id ?? null); setPending(null) }

  const pickBand = (b: Band) => { setBand(b); setBandKnown(true) }

  /** `seed` narrows the agenda to one named strand (17–18's door 2). Omitted = the whole band. */
  const startProbeNow = (seed?: string[]) => {
    ctxRef.current = buildContext(attempt)          // Phase 4: seed the probe for this child + attempt
    const s = startProbe(band, undefined, seed)     // undefined config → the band's default
    saveResume(activeLearner()?.id ?? null, band, s, attempt)
    setSlot(resolve(s, band, ctxRef.current)); setPhase('probe')
  }
  // Where the intro and the email gate both hand off to. 17–18 is asked which strand first; every
  // other band goes straight in, because a self-report at that age is noise (see strandChoices).
  const afterIntro = () => {
    if (strandChoices(band).length) setPhase('door')
    else startProbeNow()
  }
  // Cold (logged-out) visitors give an email first — required, for lead capture. Signed-in users
  // already have an account, so they go straight in. Once captured (this or a prior visit), we don't
  // re-ask on a retake.
  const begin = () => {
    if (!hasLearner && !getLeadEmail()) { setPhase('email'); return }
    afterIntro()
  }
  const submitEmail = (email: string) => {
    setLeadEmail(email)                    // prefill the later "free account" signup
    void captureDiagnosticLead(email, band)  // durable lead (best-effort — never blocks the checkup)
    afterIntro()
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
    /**
     * ⚠️ THE TASTE IS THE PLAN'S FIRST **DEMO-ELIGIBLE** CHAPTER, NOT ITS FIRST CHAPTER. This line
     * was the live COPPA leak: measured over the planted-gap simulation, `plan[0]` is one of the
     * eight camera chapters for 30% of 9–11 visitors and 12–22% of the bands above, and it sent a
     * logged-out child straight at that chapter's "Turn on the camera" start card.
     * `useChapterAccess` now refuses that render whatever the URL says — this is the other half, so
     * we do not walk a parent into a wall we put there. A plan of NOTHING but camera chapters is
     * possible in principle, and then the honest move is the account, not a worse chapter.
     */
    const tasteCh = chs.find(demoEligible)
    if (tasteCh == null) { window.location.href = window.location.origin + '/auth'; return }
    if (Object.prototype.hasOwnProperty.call(STORY_KEY, tasteCh)) {
      const key = STORY_KEY[tasteCh]
      window.location.href = window.location.origin + '/story?taste=1' + (key ? `&ch=${key}` : '')
    } else {
      window.location.href = window.location.origin + `/teen-preview?c=${tasteCh}&taste=1`
    }
  }

  const retake = () => { clearResume(activeLearner()?.id ?? null); setAttempt(a => a + 1); setPhase('intro'); setResult(null); setSlot(null); setPicked(null) }
  /**
   * ⚠️ THE PARTIAL REPORT'S "TAKE THE FULL CHECK" STARTS THE FULL PROBE **DIRECTLY** — it must never
   * be routed through `retake` / the intro. A student who named the wrong strand reaches that card
   * after TWO questions; sending them back to the intro puts the strand door in front of them again,
   * where the obvious move is to name another strand and collect another two-question nothing.
   * Calling `startProbeNow()` with no seed makes that loop UNWRITABLE rather than merely unlikely:
   * there is no flag to forget and no branch left that could show the door.
   */
  const fullCheck = () => {
    clearResume(activeLearner()?.id ?? null); setAttempt(a => a + 1); setResult(null); setPicked(null)
    startProbeNow()
  }

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
        clearResume(activeLearner()?.id ?? null)   // finished: the report owns the run now, and a resume would re-open the probe
        setResult(dx); setPhase('report')
        persistRef.current = persistDiagnosis(band, next.s, dx)   // signed-in → saves; cold/preview → skips cleanly
      } else { saveResume(activeLearner()?.id ?? null, band, next.s, attempt); setSlot(next) }
    }, 320)
  }

  // ── INTRO ────────────────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <style>{`@keyframes pt_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes pt_pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}@keyframes pt_twinkle{0%,100%{opacity:.25}50%{opacity:.8}}`}</style>
        <LabBackdrop accent={accent} /><BackChip onExit={() => history.back()} />
        {pending
          /**
           * ⚠️ A DURABLE RESUME IS OFFERED ACROSS SITTINGS, NEVER APPLIED. Silently reopening
           * question 26 of a run started days ago leaves a returning parent with no route to a
           * fresh check at all — the retake control only exists on the REPORT, which they cannot
           * reach without finishing the old run first. `IntroCard`'s `alt` is the escape, and it
           * says what continuing costs (the questions already answered) rather than just "resume".
           */
          ? <IntroCard accent={accent} short={short}
            title="Pick up where you left off?"
            cta="Keep going"
            body={`Milo still has your check from last time — ${pending.s.asked.length} question${pending.s.asked.length === 1 ? '' : 's'} answered. Carry on from there, or start a fresh one.`}
            onStart={() => applyResume(pending)}
            alt={{ label: 'Start fresh', onPick: discardResume }} />
          : !bandKnown
          ? <AgePicker accent={accent} onPick={pickBand} />
          : <IntroCard accent={accent} short={short}
            title={readiness ? 'A quick readiness check' : 'Find your starting point'}
            cta={readiness ? "Let's play together" : "Let's explore"}
            body={readiness
              ? "Sit with your child for a few minutes of play. Milo suggests a small activity; you do it together and tap how it went — no scores, no pass/fail, just a friendly picture of what they're ready for."
              /* ⚠️ "A FEW QUICK QUESTIONS" AND "2 MINUTES" WERE TRUE OF THE FIRST BUILD AND BECAME
                    A LIE ON 2026-08-22, when the probe started confirming every answer to reach
                    96–97% accuracy: a child now answers 20–50 of them. Copy that undersells the
                    length is worse than copy that oversells it — a parent who was promised two
                    minutes abandons at question fifteen, and the diagnosis is thrown away. */
              : "Milo will ask a set of questions to find exactly where to help — not a test, no scores, no timers, and nothing to lose by getting one wrong. Some will be easy and some tricky; he asks a few extra whenever he is not sure yet. About ten minutes."}
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

  // ── STRAND DOOR (17–18 only) ─────────────────────────────────────────────────────────
  if (phase === 'door') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <LabBackdrop accent={accent} /><BackChip onExit={() => setPhase('intro')} />
        <StrandDoor accent={accent} short={short} strands={strandChoices(band)}
          onPick={id => startProbeNow([id])} onFull={() => startProbeNow()} />
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
          {item.input === 'num' || item.input === 'frac' ? (
            // Keyed on the skill + how many have been asked, so the pad EMPTIES between questions —
            // a remount is right here (there is nothing imperative inside it to lose) and without it
            // the next child's answer starts with the previous one still in the window.
            <DiagPad key={`${slot.skill}:${asked}`} kind={item.input} keys={item.keys} accent={accent}
              size={Math.max(44, Math.min(short ? 48 : 58, Math.round(Math.min(vw / 11, vh / (short ? 7.5 : 9)))))}
              disabled={!!picked} onSubmit={answer} />
          ) : item.choices.map(c => {
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
      : <RemediationReport r={result} accent={accent} onStart={startPlan} onRetake={retake} onFullCheck={fullCheck} onSave={onSave} />
  }

  return null
}

// ── Remediation report (6–8 … 17–18): strengths → the one snag → cost → plan → guarantee ──
function RemediationReport({ r, accent, onStart, onRetake, onFullCheck, onSave }: { r: Diagnosis; accent: Accent; onStart: () => void; onRetake: () => void; onFullCheck: () => void; onSave?: () => void }) {
  const root = r.rootGap
  const highlightNames = r.downstreamHighlights.map(label)
  const planNames: string[] = []
  for (const ch of r.planChapters) { const n = chapterName(ch); if (n && !planNames.includes(n)) planNames.push(n) }
  const shown = planNames.slice(0, PLAN_SHOWN)
  const more = planNames.length - shown.length
  return (
    <ReportShell accent={accent} subtitle={r.workingLevel} onStart={onStart} onRetake={onRetake} onSave={onSave} cta={root ? 'Start the plan →' : 'Get ahead →'}>
      {!root ? (
        /**
         * ⚠️⚠️ ONLY A `full` PASS MAY SAY "ON TRACK". A narrowed probe — the short pass, or 17–18's
         * "I know what I'm stuck on" door — did not look everywhere, and measured, the spine alone
         * misses a third to a half of gaps in 6–8 and 9–11 while a wrongly-named strand misses all
         * of them. Framed as "here is where we're starting" that is a less-targeted plan; framed as
         * "no gaps found" it is a lie told to the parent of a child who has one, which is the worst
         * thing this product can produce. Founder's rule: only the deep pass gets to make a claim
         * about grade level.
         *
         * ⚠️ AND THE OFFER OF THE FULL CHECK IS PART OF THE FIX, NOT A CONSOLATION. A student who
         * named the wrong strand reaches this screen after TWO questions; the full check has to be
         * one tap away and worded as the better option.
         */
        r.coverage === 'full' ? (
          <Card accent={accent} title="✅ On track — ready to get ahead">
            Milo didn&apos;t find a gap holding things back. Great place to be — we&apos;ll set a plan that
            stretches into the next skills.
          </Card>
        ) : (
          <Card accent={accent} title="🔍 Nothing broken in what we checked">
            Milo looked at the part you pointed him at and everything there held up — so this is a good
            place to start. He hasn&apos;t looked at everything yet, though.{' '}
            <button onClick={onFullCheck} style={{
              background: 'none', border: 'none', padding: 0, font: 'inherit', color: accent.base,
              fontWeight: 800, textDecoration: 'underline', cursor: 'pointer',
            }}>Take the full check</button>{' '}— it&apos;s longer, and it finds gaps you might not know about.
          </Card>
        )
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
            topic stacks on it.{' '}
            {/* ⚠️ "Weeks of work, not years" is TRUE of a short route and a lie about a long one, and
                the report prints the length two inches below — so on a deep gap the two lines
                contradicted each other on the same screen. Measured: a learner rooting four bands
                down draws a 40-step route beside the promise that it is not years. Say what is true
                of THIS child: the distance is real, and the next step is small either way. */}
            {planNames.length > 8
              ? <>It is a real distance to make up — and it is walked one short chapter at a time, starting today.</>
              : <>Caught now, it&apos;s weeks of work, not years.</>}
          </Card>
          <Card accent={accent} title={`🗺️ The plan${planNames.length > 1 ? ` — ${planNames.length} steps` : ''}`}>
            {shown.join('  →  ')}{more > 0 && <span style={{ color: PT.inkSoft }}>  →  <strong>+{more} more</strong>, one step at a time</span>}<br />
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
        <p style={{ margin: '12px 0 0', fontFamily: PT.sans, fontSize: 11.5, color: PT.inkMute }}>Free · takes about ten minutes</p>
      </div>
    </div>
  )
}

// ── Cold-traffic age picker (the front door self-select) ───────────────────────────────
function AgePicker({ accent, onPick }: { accent: Accent; onPick: (b: Band) => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 6vw' }}>
      {/* Returning user? Log in and their checkup comes from their account (even on a new device). */}
      <a href="/auth" style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', right: 18, zIndex: 46, fontFamily: PT.mono, fontSize: 13, fontWeight: 700, color: accent.base, textDecoration: 'none', background: PT.panel, border: `1px solid ${accent.base}66`, borderRadius: 10, padding: '8px 14px',
        // 44px tap floor — it measured 35px. `inline-flex` because an <a> needs a box before
        // `minHeight` means anything, and centring keeps the label where it was.
        display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>Log in →</a>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2, color: accent.base, textTransform: 'uppercase', marginBottom: 8 }}>Free · about 10 minutes · no account needed</div>
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

/**
 * 17–18's DOOR 2 — the student names where it starts getting hard, and the probe is seeded there.
 *
 * ⚠️ THE ESCAPE IS NOT A COURTESY, IT IS THE DEFAULT PATH FOR ANYONE UNSURE. A student who guesses
 * a strand to get past this screen buys a two-question nothing; "not sure" has to be an obvious,
 * unembarrassing tile rather than fine print, or the door manufactures exactly the wrong answers it
 * exists to avoid. It is listed LAST because naming a strand is the better outcome when they can.
 *
 * ⚠️ AND THE COPY MAY NOT PROMISE A SHORTER CHECK. It is a NARROWER one — same questions, aimed at
 * one strand — and 28 against 50 is a consequence, not the offer. Sold as "the quick version" it
 * recruits the students least able to name a strand, which is the population it is worst for.
 */
function StrandDoor({ accent, short, strands, onPick, onFull }: {
  accent: Accent; short: boolean; strands: { id: string; label: string }[]
  onPick: (id: string) => void; onFull: () => void
}) {
  const tile: React.CSSProperties = {
    padding: short ? '12px 12px' : '16px 14px', borderRadius: 15, cursor: 'pointer', textAlign: 'center',
    minHeight: 44,   // tap floor
    background: PT.panel, backdropFilter: 'blur(6px)', border: `1.5px solid ${accent.base}55`,
    boxShadow: `0 0 14px ${accent.base}18, 0 6px 16px rgba(0,0,0,0.3)`, transition: 'transform .14s ease',
    fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 15 : 17, color: PT.ink,
  }
  const lift = {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'translateY(-3px)' },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = '' },
  }
  return (
    // `safe center` + scroll: nine tiles do not fit a short landscape frame, and plain `center` on a
    // column that cannot shrink overflows BOTH ways — pushing the heading up under the chrome where
    // no scroll can reach it. (Paid for by the GameShell start card, 2026-08-23.)
    <div style={{
      position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'safe center', gap: short ? 10 : 20,
      padding: short ? '14px 6vw' : '0 6vw', overflowY: 'auto',
    }}>
      {/**
        * ⚠️ MEASURED AT 640×320: THE ESCAPE TILE HUNG 24px BELOW THE FOLD. Nine tiles plus a
        * two-line paragraph is 358px of content in a 320px frame, and the tile that fell off the
        * bottom was "Not sure — check everything" — the one a student who cannot name a strand
        * needs, i.e. the default path, hidden from exactly the people it is for. It scrolled, which
        * is not the same as being on screen.
        *
        * Height comes out of the PROSE before it comes out of the tiles: the eyebrow goes (it says
        * nothing the screen does not) and the body drops to its one load-bearing clause — the
        * reassurance that a wrong guess is fine, which is the whole reason the door is safe. The
        * rest is restated by the escape tile two inches below. */}
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        {!short && <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2, color: accent.base, textTransform: 'uppercase', marginBottom: 8 }}>Step 1 of 2</div>}
        <h2 style={{ margin: '0 0 6px', fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 19 : 24, color: PT.ink }}>Where does it start getting hard?</h2>
        <p style={{ margin: 0, fontFamily: PT.sans, fontSize: short ? 13 : 15, lineHeight: 1.45, color: PT.inkSoft }}>
          {short
            ? <>Pick the nearest one — you don&apos;t have to be right.</>
            : <>Milo will start there and work backwards to whatever is actually underneath it. Pick
              the nearest one — you don&apos;t have to be right.</>}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: short ? 8 : 12, width: '100%', maxWidth: 480 }}>
        {strands.map(t => (
          <button key={t.id} onClick={() => onPick(t.id)} style={tile} {...lift}>{t.label}</button>
        ))}
        <button onClick={onFull} style={{ ...tile, border: `1.5px dashed ${accent.base}55`, color: PT.inkSoft }} {...lift}>
          Not sure — check everything
          <div style={{ fontFamily: PT.mono, fontSize: 11, color: PT.inkMute, marginTop: 3, fontWeight: 400 }}>longer, finds more</div>
        </button>
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
