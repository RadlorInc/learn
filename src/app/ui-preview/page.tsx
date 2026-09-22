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
import { LangContext, useLang, makeT } from '@/features/dashboard/i18n'
import { childReminders } from '@/features/dashboard/reminders'
import { localDay } from '@/features/lessons/progressReport'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { RolePicker, EmptyDashboard, AddLearnerModal } from '@/app/parent/page'
import { useState } from 'react'
import { ChildLoginsList } from '@/shared/ui/ChildLoginSheet'
import { ParentPinGate } from '@/shared/ui/ParentPinGate'
import { DashNav } from '@/features/dashboard/DashNav'
import { UpNext, RemindersSheet, TourRunner } from '@/features/dashboard/Helpers'
import { ChildCard, ChildPage, type ChildTab } from '@/features/dashboard/ChildPage'
import { ClassCard, ClassPage, type ClassTab } from '@/features/dashboard/ClassPage'
import { LessonsTab } from '@/features/dashboard/LessonsTab'
import type { Reminder } from '@/features/dashboard/reminders'
import { ExerciseHome } from '@/features/classes/ExerciseHome'
import { ModuleHome } from '@/features/lessons/ModuleHome'
import type { ClassRow } from '@/data/repositories'

const DEMO_CLASSES: ClassRow[] = [
  { id: 'c1', name: '5-A', grade: 5, lesson_ids: null, exercises: [{ id: 'x1', module: 'g5m2', level: 2, count: 10, seed: 42, open: true }, { id: 'x2', module: 'g5m3', level: 3, count: 5, seed: 7, open: false }] },
  { id: 'c2', name: 'Room 12 (Grade 3)', grade: 3, lesson_ids: null, exercises: [] },
]

/** `&lang=es`: the parent dashboard's parts in Spanish (features/dashboard/i18n). */
function WithLang() {
  return <LangContext.Provider value={useSearchParams().get('lang') === 'es' ? 'es' : 'en'}><Surfaces /></LangContext.Provider>
}

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
      {p === 'mhex' && <div style={{ width: '100%' }}><ModuleHome learnerId={null} grade={5} exercises={{ count: 1, onOpen: () => {} }} /></div>}
      {p === 'exhome' && <ExerciseHome learnerId={null} classId={null} className="5-A" exercises={DEMO_CLASSES[0].exercises} />}
      {/* The dashboard (features/dashboard) with placeholder data: ?p=home | teacher | child&tab=… | class&tab=… | lessons.
          The real page needs a session; these are the SAME components it renders, fed in-memory data. */}
      {(p === 'home' || p === 'teacher' || p === 'child' || p === 'class' || p === 'lessons') && <DashPreview p={p} />}

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
  return <Suspense><WithLang /></Suspense>
}

const DEMO_REMINDERS: Reminder[] = [
  { id: 'login:b', kind: 'setup', who: 'b', whoName: 'Maya', title: 'Maya has no login yet', detail: 'With a username and password Maya can sign in on any device and go straight to their lessons.', action: 'Set a login', to: '?child=b&tab=login' },
  { id: 'stuck:a', kind: 'help', who: 'a', whoName: 'Aarav', title: 'Aarav is finding “Divide by 10, 100, 1,000” hard', detail: 'Fewer than half of the practice problems on it were right on the first try.', action: 'See progress', to: '?child=a&tab=progress' },
  { id: 'quiet:b', kind: 'nudge', who: 'b', whoName: 'Maya', title: 'Maya hasn’t practised for 6 days', detail: 'A few minutes a day works better than a long session once a week.', action: 'Start a lesson with Maya', to: 'start:b' },
]

/** The dashboard's parts with in-memory data and saves — layout and state, never the database. */
function DashPreview({ p }: { p: string }) {
  const tab = useSearchParams().get('tab')
  const [ids, setIds] = useState<string[] | null>(['g5m1-t1', 'g5m1-t2', 'g5m1-t3', 'g4m2-t1'])
  const [due, setDue] = useState<Record<string, string>>({ 'g5m1-t2': '2026-09-19' })
  const [bell, setBell] = useState(false)
  const [tour, setTour] = useState<null | { title: string; steps: { target: string; title: string; text: string }[] }>(null)
  const save = async (i: string[] | null, d: Record<string, string>) => { setIds(i); setDue(i ? d : {}); return 'ok' as const }
  const lang = useLang(), t = makeT(lang)
  // In Spanish the demo reminders come from the real rules, so what is previewed is what a parent would read.
  const reminders = lang === 'en' ? DEMO_REMINDERS : [
    ...childReminders({ id: 'b', name: 'Maya', owner: true, login: undefined, gameEnabled: true, lessonIds: null, due: {}, isDone: () => false, lastProblemAt: '2026-09-15T12:00:00Z', createdAt: '2026-09-01T00:00:00Z' }, localDay(new Date()), new Date(), id => id, lang),
    ...childReminders({ id: 'a', name: 'Aarav', owner: true, login: 'aarav7', gameEnabled: true, lessonIds: ids, due, isDone: () => false, lastProblemAt: null, createdAt: '2026-09-01T00:00:00Z', stuck: { lessonId: 'g5m1-t3', title: 'Divide by 10, 100, 1,000' } }, localDay(new Date()), new Date(), id => id, lang),
  ]
  const nav = [{ label: p === 'teacher' || p === 'class' ? 'Classes' : t('Home'), href: '/ui-preview?p=home', on: true }, { label: t('Help'), href: '/ui-preview?p=home', on: false, tour: 'nav-help' }, { label: t('Account'), href: '/ui-preview?p=home', on: false }]
  return (
    <div className="home-app" style={{ alignSelf: 'stretch', margin: -16 }}>
      <DashNav items={nav} reminders={reminders.length} onBell={() => setBell(true)} onSignOut={() => {}} />
      <div style={{ minWidth: 0 }}><main className="adult-shell" data-t="dash">
        {p === 'home' && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <UpNext top={reminders[0]} rest={2} allClear="" onAct={() => {}} onSnooze={() => {}} onHide={() => {}} onOpenAll={() => setBell(true)} />
          <div className="card-grid">
            <ChildCard id="a" name="Aarav" avatar="/assets/objects/fox.png" lastPlayed="yesterday" next="Estimate products and quotients" done={3} total={20} onStart={() => {}} />
            <ChildCard id="b" name="Maya" avatar="/assets/objects/bunny.png" lastPlayed="—" next="Hundreds, tens and ones" done={0} total={8} onStart={() => {}} />
          </div>
          <button type="button" onClick={() => setTour({ title: 'Quick tour', steps: [{ target: 'upnext', title: 'The one thing to do next', text: 'Always the most useful thing.' }, { target: 'child-a', title: 'One card per child', text: 'Everything about them is inside.' }, { target: 'bell', title: 'Reminders', text: 'Everything else waits here.' }, { target: 'nav-help', title: 'Not sure how?', text: 'Help has walkthroughs.' }] })}>Preview the tour</button>
        </div>}
        {p === 'teacher' && <div className="card-grid">{DEMO_CLASSES.map(c => <ClassCard key={c.id} cls={c} paid students={3} />)}</div>}
        {p === 'child' && <ChildPage id="a" name="Aarav" avatar="/assets/objects/fox.png" tab={(tab ?? 'lessons') as ChildTab} crumb={{ href: '/ui-preview?p=home', label: 'Home' }} owner
          lessonIds={ids} due={due} isDone={() => false} login={undefined} wallet={{ balance: 140, minutes_used_today: 5, minutes_per_day: 20, points_per_minute: 10, enabled: true } as never}
          onLaunch={() => {}} onSaveLessons={save} onSaveGame={async () => {}} onLogin={() => {}} dataRights={<p>Download / delete (the real DataRights needs a session)</p>} />}
        {p === 'class' && <ClassPage cls={DEMO_CLASSES[0]} tab={(tab ?? 'students') as ClassTab} paid students={[{ id: 'a', name: 'Aarav', lessonIds: null, due: {} }, { id: 'b', name: 'Maya', lessonIds: null, due: {} }]}
          logins={{ a: 'aarav7' }} onLogin={() => {}} onChanged={() => {}} onStudentsAdded={() => {}} onUpdate={() => {}} onDeleted={() => {}} />}
        {p === 'lessons' && <LessonsTab name="Aarav" ids={ids} due={due} canEdit isDone={() => false} onSave={save} />}
      </main></div>
      <RemindersSheet open={bell} onClose={() => setBell(false)} list={reminders} snoozedCount={1} settingsHref="#" onAct={() => {}} onSnooze={() => {}} onHide={() => {}} onUnsnooze={() => {}} />
      <TourRunner tour={tour} onEnd={() => setTour(null)} />
    </div>
  )
}
