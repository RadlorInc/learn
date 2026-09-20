'use client'
/**
 * Dev-only preview of the signed-in surfaces, so their LAYOUT can be measured without a session.
 *
 * ⚠️⚠️ WHY THIS ROUTE EXISTS, AND IT IS A FINDING RATHER THAN A CONVENIENCE. Every signed-in screen
 * in this app is unverifiable on screen today: the e2e harness's token 401s on
 * `getLearnerBootstrap`, so `/menu` bounces to `/parent` and a spec grades the wrong page. That is
 * a standing tax on everything built after it — and on this session's evidence, layout is exactly
 * where the misses live (an occluded line, a truncated one, a control pushed off a short frame),
 * none of which a unit test can see.
 *
 * So the components render here in isolation, from the SAME source the real screens use — never a
 * second copy of the markup, which is the drift this repo keeps paying for. It 404s in production,
 * like `/sim-preview`.
 *
 * ⚠️ It is NOT a substitute for driving the real screen. It proves the layout of a component at a
 * size; it cannot prove the component is reachable, or that the screen around it agrees. Fixing the
 * 401 is still the thing worth doing — see the PR.
 */
import { notFound } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { RolePicker, EmptyDashboard, AddLearnerModal } from '@/app/parent/page'
import { useState } from 'react'
import { LessonLibrary, type LibraryLearner } from '@/features/lessons/LessonLibrary'
import { ChildLoginsList } from '@/shared/ui/ChildLoginSheet'
import { ParentPinGate } from '@/shared/ui/ParentPinGate'
import { ClassBar, ClassPanel } from '@/features/classes/Classes'
import { ExerciseHome } from '@/features/classes/ExerciseHome'
import { ModuleHome } from '@/features/lessons/ModuleHome'
import type { ClassRow } from '@/data/repositories'

const DEMO_CLASSES: ClassRow[] = [
  { id: 'c1', name: '5-A', grade: 5, lesson_ids: null, exercises: [{ id: 'x1', module: 'g5m2', level: 2, count: 10, seed: 42, open: true }, { id: 'x2', module: 'g5m3', level: 3, count: 5, seed: 7, open: false }] },
  { id: 'c2', name: 'Room 12 (Grade 3)', grade: 3, lesson_ids: null, exercises: [] },
]

function Surfaces() {
  const p = useSearchParams().get('p') ?? 'door'
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 14, padding: 16, background: 'var(--bg-page, #FDF6E3)', boxSizing: 'border-box' }}>
      {/* ⚠️ THE THREE PARENT SURFACES A HARNESS CANNOT OTHERWISE REACH, and each for its own
          reason: the role picker needs an account whose `profiles.role` is still null, the empty
          dashboard needs one with zero learners, and the add-learner sheet needs a tap inside a
          signed-in dashboard. A planted JWT does not get you there — the RLS reads 401 and the
          page renders its loadError branch instead, which is this repo's own
          "a check pointed at a world where the bug cannot occur".

          ⚠️ These render the REAL components, imported. What they prove is LAYOUT at a size —
          nothing here says the screens are reachable, that `setMyRole` fires, or that the
          dashboard around them agrees. `onPick`/`onAdd` are deliberately inert. */}
      {p === 'role'  && <div data-t="role" style={{ width: '100%' }}><RolePicker name="Sarah" onPick={() => {}} /></div>}
      {p === 'empty' && <div data-t="empty" className="adult-shell"><EmptyDashboard onAdd={() => {}} /></div>}
      {p === 'sheet' && <div data-t="sheet"><AddLearnerModal onClose={() => {}} onAdded={() => {}} /></div>}
      {p === 'childlogin' && <div className="adult-shell" style={{ width: '100%' }}><ChildLoginsList title="Child logins" blurb="Set a username and password for each child." learners={[{ id: 'a', name: 'Aarav' }, { id: 'b', name: 'Maya' }, { id: 'c', name: 'Zoya' }]} logins={{ b: 'maya.k' }} onLogins={() => {}} /></div>}
      {(p === 'pin' || p === 'pinset') && <div style={{ width: '100%' }}><ParentPinGate preview={p === 'pin' ? 'enter' : 'create'}>dashboard</ParentPinGate></div>}
      {p === 'classespaid' && (
        <div className="adult-shell" style={{ width: '100%' }}>
          <ClassPanel cls={DEMO_CLASSES[0]} paid students={[{ id: 'a', name: 'Aarav' }]} onChanged={() => {}} onStudentsAdded={() => {}} onUpdate={() => {}} onDeleted={() => {}} />
        </div>
      )}
      {p === 'mhex' && <div style={{ width: '100%' }}><ModuleHome learnerId={null} grade={5} exercises={{ count: 1, onOpen: () => {} }} /></div>}
      {p === 'exhome' && <ExerciseHome learnerId={null} classId={null} className="5-A" exercises={DEMO_CLASSES[0].exercises} />}
      {p === 'library' && <div data-t="library" className="adult-shell" style={{ width: '100%' }}><LibraryPreview /></div>}
      {p === 'classes' && (
        <div data-t="classes" className="adult-shell" style={{ width: '100%' }}>
          <ClassBar classes={DEMO_CLASSES} current="c1" onPick={() => {}} onCreated={() => {}} />
          <ClassPanel cls={DEMO_CLASSES[0]} paid={false} students={[{ id: 'a', name: 'Aarav' }, { id: 'b', name: 'Maya' }]} onChanged={() => {}} onStudentsAdded={() => {}} onUpdate={() => {}} onDeleted={() => {}} />
        </div>
      )}

      {/* The `.card-grid` used by the grade list, the invite lists and class triage. ⚠️ SAME NARROW
          CLAIM AS `?p=cols`: this is the CLASS with placeholder children, not those pages — it
          catches the breakpoints regressing and cannot catch a page stopping using the class.
          Those three pages are not reachable from a harness at all (a planted JWT is refused by
          `getCurrentSession`, so each one bounces to /auth or sits on its loading splash), which
          is exactly why their own appearance is source-verified rather than driven. */}
      {p === 'cards' && (
        <div data-t="cards" className="adult-shell">
          <div className="card-grid">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} style={{ background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 18, padding: 16 }}>card {n}</div>
            ))}
          </div>
        </div>
      )}

      {/* The dashboard's two-column grid. ⚠️ STATED NARROWLY ON PURPOSE: this is the `.dash-cols`
          CLASS at a size, with placeholder children — NOT the dashboard, which needs a learner's
          data to render at all. It catches the breakpoint regressing; it cannot catch the
          dashboard stopping using the class. Read it as "the grid still switches", nothing more. */}
      {p === 'cols' && (
        <div data-t="cols" className="adult-shell">
          <div className="dash-cols">
            <div className="dash-rail" data-t="cols-rail" style={{ background: 'var(--paper-soft)', border: '2px solid var(--card-border)', borderRadius: 20, padding: 20 }}>rail</div>
            <div data-t="cols-body" style={{ background: 'var(--paper-soft)', border: '2px solid var(--card-border)', borderRadius: 20, padding: 20 }}>body</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UiPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()   // dev scaffolding — 404 in the shipped app
  return <Suspense><Surfaces /></Suspense>
}

/** The library with two placeholder children and an in-memory save — layout and the add/remove state, never the database. */
function LibraryPreview() {
  const [kids, setKids] = useState<LibraryLearner[]>([
    { id: 'a', name: 'Sarah', lessonIds: null, canEdit: true },
    { id: 'b', name: 'Omar', lessonIds: null, canEdit: false },
  ])
  return <LessonLibrary learners={kids} onSave={async (id, ids) => {
    if (!kids.find(k => k.id === id)?.canEdit) return 'error'
    setKids(ks => ks.map(k => k.id === id ? { ...k, lessonIds: ids } : k)); return 'ok'
  }} />
}
