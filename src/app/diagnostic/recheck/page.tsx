'use client'
/**
 * /diagnostic/recheck — Step 8, the week-N guarantee check. Re-probes the remediated root gap (+ its
 * 1–2 nearest dependents) and tells the parent whether it CLOSED. This is the loop that makes the
 * "gap closed in 6 weeks or you don't pay" promise real, and produces the efficacy signal.
 *
 * URL: /diagnostic/recheck?skill=<rootGapSkillId>&band=<band>&week=<n>. Same anti-fear rules as the
 * diagnostic (no score, no red X). Saves best-effort for a signed-in learner (skips in preview).
 */
import { useEffect, useRef, useState } from 'react'
import { recheckSkills } from '@/core/diagnosticEngine'
import { NODE_BY_ID, type Band } from '@/core/skillGraph'
import { makeItem, makeReadinessItem, pickThemeFor, type DiagItem, type DiagContext, type ItemTheme } from '@/core/diagnosticItems'
import { saveRecheck } from '@/data/repositories'
import { PT, ACCENTS, LabBackdrop, BackChip, PromptCard, ChoiceButton, PtMilo, IntroCard, type Accent } from '@/features/chapters/story/preteen/kit'

const BANDS = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']
const accentFor = (band: Band): Accent => band === '3-5' ? ACCENTS.lime : ACCENTS.cyan
const label = (id: string) => NODE_BY_ID[id]?.label ?? id

function activeLearner(): { id?: string; name?: string; display_name?: string; theme?: ItemTheme } | null {
  try { return JSON.parse(sessionStorage.getItem('milo_active_learner') || 'null') } catch { return null }
}

interface Probe { skill: string; item: DiagItem }
type Phase = 'intro' | 'probe' | 'done'
// Parent-guided items pass via passSet ("Yes"/"With a little help"); MCQ items via the answer.
const isPass = (item: DiagItem, choice: string) => item.passSet ? item.passSet.includes(choice) : choice === item.answer
// UUID v4 dedupe key so a double-fire / retry of the re-check save is idempotent server-side.
const newClientId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) })

export default function RecheckPage() {
  const [band, setBand] = useState<Band>('9-11')
  const [skill, setSkill] = useState<string | null>(null)
  const [week, setWeek] = useState(6)
  const [phase, setPhase] = useState<Phase>('intro')
  const [probes, setProbes] = useState<Probe[]>([])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const savedRef = useRef(false)
  const resultsRef = useRef<Record<string, boolean>>({})   // skill → passed (synchronous, no state-timing races)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const s = q.get('skill')
    const b = q.get('band')
    const w = Number(q.get('week'))
    if (s && NODE_BY_ID[s]) setSkill(s)
    if (b && BANDS.includes(b)) setBand(b as Band)
    if (Number.isFinite(w) && w > 0) setWeek(w)
  }, [])

  const accent = accentFor(band)

  const begin = () => {
    if (!skill) return
    const l = activeLearner()
    const seed = l?.id || 'anon'
    const ctx: DiagContext = { name: l?.name || l?.display_name, theme: l?.theme || pickThemeFor(seed), seed, nonce: week }
    // Readiness-first: a 3–5 diagnosis can root at a parent-observed milestone (patterns/colors/
    // measureCompare) that has NO child MCQ. Using makeItem alone yielded 0 probes → the re-check
    // fell straight to "not closed" and saved gapClosed=false regardless of the child. Fall back to
    // the child MCQ for every other skill.
    const built = recheckSkills(skill)
      .map(s => { const item = makeReadinessItem(s, ctx) ?? makeItem(s, ctx); return item ? { skill: s, item } : null })
      .filter((p): p is Probe => p != null)
    if (built.length === 0) { setPhase('done'); return }   // nothing probeable → treat as inconclusive
    setProbes(built); setIdx(0); setPhase('probe')
  }

  function answer(choice: string) {
    if (picked || !probes[idx]) return
    setPicked(choice)
    const p = probes[idx]
    resultsRef.current[p.skill] = isPass(p.item, choice)   // record synchronously (MCQ or parent item)
    window.setTimeout(() => {
      setPicked(null)
      if (idx + 1 < probes.length) setIdx(idx + 1)
      else finish()
    }, 320)
  }

  // "Gap closed" = the root skill (always probed first) now passes.
  const finish = () => {
    const gapClosed = skill ? !!resultsRef.current[skill] : false
    setClosed(gapClosed)
    setPhase('done')
    const l = activeLearner()
    if (l?.id && skill && !savedRef.current) {
      savedRef.current = true
      void saveRecheck({ learnerId: l.id, week, skill, gapClosed, clientId: newClientId() })
    }
  }

  if (!skill) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <LabBackdrop accent={accent} /><BackChip onExit={() => history.back()} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8vw', textAlign: 'center', fontFamily: PT.sans, color: PT.inkSoft }}>
          Nothing to re-check yet — run the check-up first.
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <style>{`@keyframes pt_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes pt_twinkle{0%,100%{opacity:.25}50%{opacity:.8}}`}</style>
        <LabBackdrop accent={accent} /><BackChip onExit={() => history.back()} />
        <IntroCard accent={accent}
          title={`Week ${week} check-in`}
          cta="See how it's going"
          body={`A quick re-check on ${label(skill)} — the one thing we set out to fix. Just a couple of questions, same as before: no scores, no pressure.`}
          onStart={begin} />
        <PtMilo left={9} />
      </div>
    )
  }

  // Parent-guided readiness re-check item: a calm "do this together" card + stacked outcome buttons.
  if (phase === 'probe' && probes[idx]?.item.kind === 'parent') {
    const item = probes[idx].item
    return (
      <div style={{ position: 'relative', width: '100vw', minHeight: '100dvh', overflow: 'auto', background: `radial-gradient(125% 90% at 50% -10%, ${PT.bg1}, ${PT.bg0} 70%)` }}>
        <BackChip onExit={() => history.back()} />
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '64px 20px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(8px)', border: `1px solid ${accent.base}66`, borderRadius: 18, padding: '20px 22px 22px', boxShadow: `0 0 24px ${accent.base}22, 0 14px 34px rgba(0,0,0,0.45)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: PT.mono, fontSize: 10.5, letterSpacing: 1.5, color: accent.base, background: accent.soft, borderRadius: 6, padding: '4px 9px', textTransform: 'uppercase' }}>Do this together</span>
              <span style={{ fontFamily: PT.mono, fontSize: 11, color: PT.inkMute }}>Check {idx + 1} of {probes.length}</span>
            </div>
            <p style={{ margin: 0, fontFamily: PT.sans, fontSize: 19, lineHeight: 1.5, color: PT.ink }}>{item.prompt}</p>
          </div>
          <div style={{ fontFamily: PT.sans, fontSize: 13, color: PT.inkMute, textAlign: 'center', marginTop: -6 }}>How did it go?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {item.choices.map(c => {
              const sel = picked === c
              const dim = picked && !sel
              return (
                <button key={c} onClick={() => answer(c)} disabled={!!picked} style={{
                  padding: '15px 18px', borderRadius: 14, cursor: picked ? 'default' : 'pointer', textAlign: 'left',
                  background: sel ? accent.base : PT.panel, border: `1.5px solid ${sel ? accent.base : PT.lineStrong}`,
                  color: sel ? '#06121f' : PT.ink, fontFamily: PT.sans, fontWeight: 600, fontSize: 16.5,
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

  if (phase === 'probe' && probes[idx]) {
    const item = probes[idx].item
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <style>{`@keyframes pt_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes pt_twinkle{0%,100%{opacity:.25}50%{opacity:.8}}`}</style>
        <LabBackdrop accent={accent} /><BackChip onExit={() => history.back()} />
        <PromptCard tag={`Check ${idx + 1} of ${probes.length}`} text={item.prompt} accent={accent} />
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: '3.5%', zIndex: 33, display: 'flex', justifyContent: 'center', gap: 'clamp(12px,3vw,28px)', flexWrap: 'wrap', padding: '0 12px' }}>
          {item.choices.map(c => (
            <ChoiceButton key={c} label={c} accent={accent} state={picked === c ? 'idle' : picked ? 'dim' : 'idle'} size={100} onClick={() => answer(c)} disabled={!!picked} />
          ))}
        </div>
        <PtMilo left={9} />
      </div>
    )
  }

  // ── Result ──
  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100dvh', overflow: 'auto', background: `radial-gradient(125% 90% at 50% -10%, ${PT.bg1}, ${PT.bg0} 70%)` }}>
      <BackChip onExit={() => history.back()} />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '72px 22px 48px', fontFamily: PT.sans, color: PT.ink, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 10 }}>{closed ? '🎉' : '🌱'}</div>
        <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2, color: accent.base, textTransform: 'uppercase', marginBottom: 6 }}>Week {week} re-check</div>
        <h1 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 700 }}>{closed ? "It's clicking now" : 'Getting there'}</h1>
        <div style={{ background: PT.panel, border: `1px solid ${(closed ? PT.ok : accent.base)}55`, borderRadius: 16, padding: '18px 20px', fontSize: 16, lineHeight: 1.6, color: PT.ink }}>
          {closed ? (
            <><strong style={{ color: PT.ok }}>{label(skill)}</strong> looks solid now. That&apos;s the gap closing — exactly what we set out to do. 🎯 <strong>Promise kept.</strong></>
          ) : (
            <><strong style={{ color: accent.base }}>{label(skill)}</strong> needs a little more play — and that&apos;s completely normal. Keep going with the plan; we&apos;ll check again soon.</>
          )}
        </div>
        <button onClick={() => { window.location.href = window.location.origin + '/menu' }}
          style={{ marginTop: 22, padding: '13px 30px', borderRadius: 13, cursor: 'pointer', background: accent.base, border: `1px solid ${accent.base}`, color: '#06121f', fontFamily: PT.sans, fontWeight: 700, fontSize: 16, boxShadow: `0 0 22px ${accent.base}88` }}>
          {closed ? 'Keep going →' : 'Back to the plan →'}
        </button>
      </div>
      <PtMilo left={9} />
    </div>
  )
}
