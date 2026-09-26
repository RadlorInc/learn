'use client'

/**
 * The adult dashboard — parents AND teachers (founder, 2026-09-21: "still not simple… he got confused where to go").
 * Organised around WHO rather than WHAT: a parent's home is one card per child, and everything about a child is on that
 * child's page (./features/dashboard/ChildPage); a teacher's home is one card per class, and everything about a class is
 * on its page (ClassPage). Nothing was removed — the old menu items moved:
 *   Learners / Performance / Lesson library / Assign lessons / Choose topics → a child's tabs;
 *   Class Home / Roster / Assign / Class dashboard / the class bar → a class's tabs;
 *   Plan & billing / Settings / Close your account → Account.
 * Every screen is a URL (`?child=`, `?class=`, `&tab=`, `?view=`), so the browser's Back button works.
 * The helpers (Up next, reminders, celebrations, the weekly recap, tours) follow the founder's calm rules — see
 * ../../features/dashboard/Helpers.tsx.
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  getMyLearners, getParentDashboard, getLearnerStats, getLearnerProgress,
  getRecentSessions, signOut, createLearner,
  getReceivedInvites, acceptInvite,
  deleteLearnerPermanently, deleteLearnerRowLegacy, LEGACY_DELETE, correctLearner, removeMyselfFromLearner,
  getMyRole, setMyRole, setLearnerAssignments, enterAsChild, getChildLogins, removeChildLogin,
  getWallet, setGameSettings, type Wallet, getMyClasses, getMyTeacherPaid, type ClassRow,
  getRecentPoints, getLessonRows, getExerciseResults,
} from '@/data/repositories'
import { setActiveLearner, getActiveLearner } from '@/data/supabase/useLearnerSession'
import { DataRights } from '@/shared/ui/DataRights'
import { getCurrentSession } from '@/data/auth'
import type { Learner, LearnerStats, LearnerProgress, Session, InviteWithLearner, UserRole } from '@/data/supabase/types'
import { SupportPanel } from '@/shared/ui/SupportPanel'
import { ChildLoginSheet } from '@/shared/ui/ChildLoginSheet'
import { chosenModules, MODULES, GRADES, findLesson } from '@/features/lessons/modules'
import { ModuleChecklist, NewClass, bandOf } from '@/features/classes/Classes'
import { summarize } from '@/features/classes/exercise'
import { buildReport, localDay, type Report, type PointRow } from '@/features/lessons/progressReport'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { pullLessonProgress } from '@/infra/storage/lessonSync'
import { DashNav } from '@/features/dashboard/DashNav'
import { UpNext, RemindersSheet, Sheet, TourRunner, dbtn, dghost, dcard, dlink, type Tour } from '@/features/dashboard/Helpers'
import { ChildPage, ChildCard, CHILD_TABS, AVATAR_SRCS, type ChildTab } from '@/features/dashboard/ChildPage'
import { ClassPage, ClassCard, CLASS_TABS, type ClassTab } from '@/features/dashboard/ClassPage'
import { childReminders, classReminders, hardestQuestion, byPriority, type Reminder, type Kind } from '@/features/dashboard/reminders'
import { helpGoals } from '@/features/dashboard/helpGoals'
import { loadPrefs, savePrefs, isShown, weekOf, SNOOZE_DAYS, type Prefs } from '@/features/dashboard/prefs'
import { LangContext, loadLang, saveLang, makeT, useT, useLang, type Lang } from '@/features/dashboard/i18n'
import { TextSizeCard } from '@/features/dashboard/TextSizeCard'
import { AddChildFlow, type Attest } from '@/features/consent/AddChildFlow'
import { AccountConsentCard } from '@/features/consent/AccountConsent'
import { longDate } from '@/features/consent/consentState'
import { firstNameOf } from '@/features/consent/firstName'
import { Notice } from '@/features/consent/Notice'
import { ATTEST, PROPOSED } from '@/features/consent/copy'
import { BILLING_LIVE } from '@/app/legal/registry'
import { WithdrawAllCard } from '@/features/consent/WithdrawAll'

const AVATARS     = ['🦊', '🐰', '🐻', '🐱']

/* The adult surface's palette, from globals.css. */
const P = {
  page:   'var(--paper)',
  card:   'var(--paper-soft)',
  edge:   'var(--card-border)',
  ink:    'var(--ink)',
  ink2:   'var(--ink-soft)',
  ink3:   'var(--ink-muted)',
  accent: 'var(--milo-orange)',
  hover:  'var(--milo-orange-hover)',
} as const

interface LearnerData {
  learner:     Learner
  stats:       LearnerStats | null
  progress:    LearnerProgress[]
  sessions:    Session[]
  accessRole:  'owner' | 'viewer' | 'self' | null
}

/** What the helpers read about one child, fetched after the dashboard shows (never blocks it). */
interface ChildExtra { points: PointRow[] | null; report: Report | null }

export default function ParentDashboard() {
  // useSearchParams needs a Suspense boundary on a static page (next docs: use-search-params → Prerendering).
  return <Suspense fallback={null}><Dashboard /></Suspense>
}

function Dashboard() {
  const router = useRouter()
  const sp = useSearchParams()
  const childId = sp.get('child'), classId = sp.get('class'), view = sp.get('view'), tabParam = sp.get('tab')

  const [learners,     setLearners]     = useState<LearnerData[]>([])
  const [loading,      setLoading]      = useState(true)
  const [loadError,    setLoadError]    = useState(false)
  const [parentName,   setParentName]   = useState('')
  const [uid,          setUid]          = useState<string | null>(null)
  // ?add=1 opens the add-a-child flow — where B2 ("permission recorded") sends the parent, so the consent they just
  // gave is used straight away instead of waiting behind a second press of "Add a child".
  const [showAddModal, setShowAddModal] = useState(sp.get('add') === '1')
  const [invites,      setInvites]      = useState<InviteWithLearner[]>([])
  const [acceptingId,  setAcceptingId]  = useState<string | null>(null)
  const [inviteMsg,    setInviteMsg]    = useState<string | null>(null)
  const [actionMsg,    setActionMsg]    = useState<string | null>(null)
  const [confirming,   setConfirming]   = useState<string | null>(null) // learnerId being confirmed
  const [wallets, setWallets] = useState<Record<string, Wallet | 'unavailable' | null>>({})   // learnerId → points + game settings
  const [, redraw] = useState(0)
  const [role, setRole] = useState<UserRole | null | 'loading'>('loading')       // null = show the one-time Teacher/Parent picker
  const [childLogins, setChildLogins] = useState<Record<string, string> | null>(null)   // learnerId → username; null = unknown
  const [loginFor, setLoginFor] = useState<string | null>(null)       // learnerId whose login sheet is open
  const [classes, setClasses] = useState<ClassRow[]>([])              // a teacher's classes (features/classes)
  const [paid, setPaid] = useState(false)                             // a paid teacher's classes get modules, a free one's exercises
  const [makingClass, setMakingClass] = useState(false)
  // The helpers.
  const [extra, setExtra] = useState<Record<string, ChildExtra>>({})
  const [classResults, setClassResults] = useState<Record<string, Awaited<ReturnType<typeof getExerciseResults>>>>({})
  const [prefs, setPrefsState] = useState<Prefs | null>(null)
  const [bell, setBell] = useState(false)
  const [tour, setTour] = useState<(Tour & { id?: string }) | null>(null)
  const [now] = useState(() => Date.now())
  const [autoDone, setAutoDone] = useState(false)   // the one automatic pop-up of this visit has been shown and closed
  // English or Spanish, chosen in Account → Language. PARENTS ONLY (founder, 2026-09-22): a teacher's dashboard stays English.
  // Per device, like the helpers' prefs — a parent on a new device picks it again.
  const [chosenLang, setChosenLang] = useState<Lang>('en')
  // Consent-once (C2): the tick the parent gave at signup, on this device or in the account's metadata.
  // `undefined` until the session is read, so the card never asks before it knows whether a tick exists.

  // `quiet`: refresh the data without the full-screen splash, so an open panel (a class's new passwords) stays on screen.
  async function loadAll(quiet?: boolean) {
    if (quiet !== true) setLoading(true)
    setLoadError(false)
    try {
      // Local session (no auth-server round trip); RLS guards the reads below.
      const session = await getCurrentSession()
      const user = session?.user
      if (!user) { router.replace('/auth'); return }
      setParentName(firstNameOf(user.user_metadata) ?? 'there')
      setUid(user.id)
      setChosenLang(loadLang())
      // This device's helper choices, read once per visit; the visit BEFORE this one is what "since your last visit" means.
      setPrefsState(prev => {
        if (prev) return prev
        const p = loadPrefs(user.id)
        savePrefs(user.id, { ...p, lastVisit: now })
        return p
      })

      // One RPC for the whole dashboard (stats+progress+recent-sessions+role for every learner).
      // `null` means the RPC is unavailable → fall back to the per-learner query path.
      const [dash, pendingInvites, myRole] = await Promise.all([
        getParentDashboard(),
        getReceivedInvites(),
        getMyRole(),
      ])
      // A child's own account never sees this dashboard: straight to their lessons.
      if (myRole === 'learner') { router.replace(await enterAsChild()); return }
      setInvites(pendingInvites)
      setRole(myRole)
      if (myRole === 'teacher') {
        getMyClasses().then(cs => {
          setClasses(cs)
          // Exercise results feed the teacher's reminders (who has taken an open exercise, the question most got wrong).
          for (const c of cs) if (c.exercises.some(e => e.open !== false)) getExerciseResults(c.id).then(r => setClassResults(p => ({ ...p, [c.id]: r })))
        })
        getMyTeacherPaid().then(setPaid)
      }
      getChildLogins().then(setChildLogins)   // not awaited: the dashboard must not wait on the login lookup

      let data: LearnerData[]
      if (dash !== null) {
        data = dash.map(d => ({ ...d, accessRole: d.learner.accessRole }))
      } else {
        // Fallback: role rides along on getMyLearners(); the 3 per-learner reads run in parallel.
        const list = await getMyLearners()
        data = await Promise.all(list.map(async learner => {
          const [stats, progress, sessions] = await Promise.all([
            getLearnerStats(learner.id),
            getLearnerProgress(learner.id),
            getRecentSessions(learner.id, 3),
          ])
          return { learner, stats, progress, sessions, accessRole: learner.accessRole }
        }))
      }

      setLearners(data)
      // Progress follows the account: bring each child's topics onto this device, then their points. Not awaited —
      // the dashboard shows at once and redraws when the account has answered.
      const ids = chosenModules(null).flatMap(m => m.lessons.map(l => l.id))
      for (const d of data) {
        pullLessonProgress(d.learner.id, ids)
          .then(ok => { if (ok) redraw(n => n + 1); return getWallet(d.learner.id) })
          .then(w => setWallets(prev => ({ ...prev, [d.learner.id]: w })))
        // A parent's helpers read each child's last 30 days (a teacher's come from the class results instead).
        if (myRole !== 'teacher') {
          Promise.all([getRecentPoints(d.learner.id, 30), getLessonRows(d.learner.id)]).then(([points, rows]) =>
            setExtra(p => ({ ...p, [d.learner.id]: { points, report: points && rows ? buildReport(points, rows, new Date()) : null } })))
        }
      }
    } catch (e) {
      // A flaky network must never leave the parent stuck on the splash forever.
      console.warn('[parent] loadAll failed:', e)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line

  const setPrefs = useCallback((f: (p: Prefs) => Prefs) => setPrefsState(prev => {
    if (!prev || !uid) return prev
    const next = f(prev)
    // Keep `lastVisit` as it was when this visit began (the saved copy already holds `now`).
    savePrefs(uid, { ...next, lastVisit: now })
    return next
  }), [uid, now])

  async function handleAcceptInvite(inviteId: string) {
    setAcceptingId(inviteId)
    const result = await acceptInvite(inviteId)
    if (result.ok) {
      setInviteMsg(t('Access granted! Learner added to your dashboard.'))
      setInvites(prev => prev.filter(i => i.id !== inviteId))
      await loadAll()
    } else {
      setInviteMsg(result.error ?? t('Something went wrong'))
    }
    setAcceptingId(null)
  }

  function handleDeclineInvite(inviteId: string) {
    setInvites(prev => prev.filter(i => i.id !== inviteId))
  }

  async function handleDelete(learnerId: string) {
    // One call deletes the child, their login and every record about them (delete_learner).
    let result = await deleteLearnerPermanently(learnerId)
    if (result.error === LEGACY_DELETE) {
      // Before 20260923140000: the child's own account first — deleting the learner removes its access
      // row but NOT the auth user, which would outlive the child as a login that signs in to nothing.
      if (childLogins === null || childLogins[learnerId]) {
        const r = await removeChildLogin(learnerId)
        // not_configured = this server cannot have made a login, so there is none to outlive the learner.
        if (!r.ok && r.error !== 'not_configured') { setActionMsg(t('Could not remove this learner’s login, so nothing was deleted. Try again.')); return }
      }
      result = await deleteLearnerRowLegacy(learnerId)
    }
    if (result.ok) {
      setActionMsg(t('Learner deleted.'))
      setConfirming(null)
      router.push('/parent')
      await loadAll()
    } else {
      setActionMsg(result.error ?? t('Failed to delete'))
    }
  }

  async function handleRemoveSelf(learnerId: string) {
    const result = await removeMyselfFromLearner(learnerId)
    if (result.ok) {
      setActionMsg(t('You have been removed from this learner.'))
      setConfirming(null)
      router.push('/parent')
      await loadAll()
    } else {
      setActionMsg(result.error ?? t('Failed to remove'))
    }
  }

  // First-login role choice: persist it; both roles stay here, the menu follows the role.
  async function handlePickRole(r: UserRole) {
    setRole(r)                    // optimistic — the picker disappears immediately
    await setMyRole(r)
  }

  /**
   * ⚠️ THE STARTING-POINT CHECK WAS DELETED 2026-09-20, with its engine, its skill graph and the
   * week-6 re-check. Every child now goes straight to the lesson list; the plan they walk is
   * `gradeStartPlan` — the band from the top, refined by play. The "offered, not forced" branch,
   * `isEstablished`, `checkupSkips` and `recheckGap` all went with it.
   */
  function launchGame(d: LearnerData) {
    setActiveLearner(d.learner)
    router.push('/modules')
  }

  const tea = role === 'teacher'
  const lang: Lang = tea ? 'en' : chosenLang
  const t = makeT(lang)
  useEffect(() => { document.documentElement.lang = lang; return () => { document.documentElement.lang = 'en' } }, [lang])
  const today = localDay(new Date(now))

  // ── Reminders: worked out from what is already loaded; the adult's snoozes / hides / switched-off kinds applied. ──
  const all: Reminder[] = useMemo(() => {
    if (tea) return byPriority(classes.flatMap(c => {
      const studs = learners.filter(d => d.learner.grade_id === c.id)
      const res = classResults[c.id]
      return classReminders({
        id: c.id, name: c.name, paid, exercises: c.exercises.length,
        hasModules: !!c.lesson_ids?.length,
        students: studs.map(d => ({ id: d.learner.id, name: d.learner.display_name, login: childLogins === null ? null : childLogins[d.learner.id] })),
        open: res && res !== null ? c.exercises.filter(e => e.open !== false).map((e, i) => {
          const s = summarize(e.id, studs.map(d => d.learner.id), res)
          const m = MODULES.find(x => x.id === e.module)
          return { id: e.id, title: `Exercise ${i + 1}${m ? ` · ${m.title}` : ''}`, done: s.done, hardQuestion: hardestQuestion(s.perQuestion) }
        }) : [],
      })
    }))
    return byPriority(learners.flatMap(d => {
      const x = extra[d.learner.id]
      const problems = x?.points?.filter(p => p.reason === 'problem') ?? undefined
      const stuck = x?.report?.stuck[0]
      return childReminders({
        id: d.learner.id, name: d.learner.display_name, owner: d.accessRole === 'owner',
        login: childLogins === null ? null : childLogins[d.learner.id],
        gameEnabled: (() => { const w = wallets[d.learner.id]; return w && w !== 'unavailable' ? w.enabled : null })(),
        lessonIds: d.learner.lesson_ids ?? null, due: d.learner.lesson_due ?? {}, isDone: id => lessonDone(d.learner.id, id),
        lastProblemAt: x?.points === undefined || x.points === null ? undefined : (problems?.at(-1)?.created_at ?? null),
        createdAt: d.learner.created_at,
        stuck: stuck ? { lessonId: stuck.lessonId, title: findLesson(stuck.lessonId)?.lesson.title ?? stuck.lessonId } : undefined,
      }, today, new Date(now), id => findLesson(id)?.lesson.title ?? id, lang)
    }))
  }, [tea, classes, learners, classResults, paid, childLogins, extra, wallets, today, now, lang])
  const shown = prefs ? all.filter(r => isShown(prefs, r, now)) : all
  const snoozed = prefs ? all.filter(r => (prefs.snoozed[r.id] ?? 0) > now && !prefs.hidden.includes(r.id)).length : 0

  function act(r: Reminder) {
    setBell(false)
    if (r.to.startsWith('start:')) { const d = learners.find(x => x.learner.id === r.to.slice(6)); if (d) launchGame(d); return }
    router.push(`/parent${r.to}`)
  }
  const snooze = (r: Reminder) => setPrefs(p => ({ ...p, snoozed: { ...p.snoozed, [r.id]: now + SNOOZE_DAYS * 86_400_000 } }))
  const hide = (r: Reminder) => setPrefs(p => ({ ...p, hidden: [...p.hidden, r.id] }))

  // ── One pop-up per visit: a celebration, else the weekly recap, else the first-visit tour. Decided once. ──
  const mastered = useMemo(() => {
    if (!prefs?.lastVisit || tea) return []
    return learners.flatMap(d => (extra[d.learner.id]?.points ?? [])
      .filter(p => p.reason === 'mastered' && p.lesson_id && new Date(p.created_at).getTime() > prefs.lastVisit!)
      .map(p => ({ name: d.learner.display_name, id: d.learner.id, title: findLesson(p.lesson_id)?.lesson.title ?? p.lesson_id! })))
  }, [prefs, tea, learners, extra])
  const extrasReady = tea || (learners.length > 0 && learners.every(d => extra[d.learner.id] !== undefined))
  const home = !childId && !classId && !view
  // ONE automatic pop-up per visit, on the home screen, once everything it reads has arrived:
  // a celebration, else the weekly recap, else the first-visit tour.
  const autoPick: 'celebrate' | 'recap' | 'first' | null = !prefs || loading || role === 'loading' || role === null || !extrasReady ? null
    : mastered.length && !prefs.off.includes('good') ? 'celebrate'
    : !tea && prefs.lastVisit && prefs.recapWeek !== weekOf(new Date(now)) && !prefs.off.includes('recap') && learners.length ? 'recap'
    : !prefs.seen.includes('first') && (tea || learners.length > 0) ? 'first' : null
  const auto = !autoDone && home && !showAddModal ? autoPick : null
  const shownPopup = auto === 'celebrate' || auto === 'recap' ? auto : null
  function closePopup() {
    setAutoDone(true)
    if (auto === 'recap') setPrefs(p => ({ ...p, recapWeek: weekOf(new Date(now)) }))
  }
  // The first time an adult opens a child or a class, a 3-step tour of its tabs. Once.
  const insideKey = childId ? 'inside-child' : classId ? 'inside-class' : null

  function tourFor(id: string): Tour | null {
    const first = learners[0]?.learner.id, cls = classes[0]?.id
    const helpStep = { target: 'nav-help', title: t('Not sure how?'), text: t('Help has step-by-step walkthroughs: pick what you want to do.') }
    if (id === 'first') return tea
      ? { title: 'Quick tour', steps: [
          { url: '/parent', target: 'upnext', title: 'The one thing to do next', text: 'We’ll always put the most useful thing here.' },
          { target: cls ? `class-${cls}` : 'new-class', title: 'One card per class', text: 'Open a class and everything about it is inside: students, lessons, exercises, results.' },
          { target: 'bell', title: 'Reminders', text: 'Results to read, students without a login, and more wait here.' }, helpStep] }
      : { title: t('Quick tour'), steps: [
          { url: '/parent', target: 'upnext', title: t('The one thing to do next'), text: t('We’ll always put the most useful thing here.') },
          { target: first ? `child-${first}` : 'add-child', title: t('One card per child'), text: t('Open a child and everything about them is inside: progress, lessons, game time, login.') },
          { target: 'bell', title: t('Reminders'), text: t('Anything else worth a look waits here.') }, helpStep] }
    if (id === 'inside-child') return { title: t('Inside a child’s profile'), steps: [
      { target: 'tab-progress', title: t('Progress'), text: t('How they’re doing, and what they find hard.') },
      { target: 'tab-lessons', title: t('Lessons'), text: t('Choose what they learn, and give a lesson a due date.') },
      { target: 'tab-game,tab-login', title: t('Game time and Login'), text: t('Their daily game limit, their sign-in, and their data.') }] }
    // The first time a parent opens the add-a-child window with no child yet. Runs inside the window, after consent.
    if (id === 'add-child') return { title: t('Add your first child'), steps: [
      { target: 'add-avatar', title: t('Pick a picture'), text: t('Choose a picture for your child.') },
      { target: 'add-name', title: t('Their name'), text: t('A first name or nickname is plenty.') },
      { target: 'add-modules', title: t('Choose their lessons'), text: t('Pick a grade, then tick the modules they can see. You can change this later in their Lessons tab.') },
      { target: 'add-attest', title: t('Confirm this child'), text: t('Tick to confirm you are their parent or guardian.') },
      { target: 'add-submit', title: t('Add them'), text: t('Tap here when you’re done.') }] }
    if (id === 'inside-class') return { title: 'Inside a class', steps: [
      { target: 'tab-students', title: 'Students', text: 'Add students, and give a new password to anyone who can’t sign in.' },
      { target: 'tab-lessons', title: 'Lessons', text: 'Choose the class’s modules. New students get them too.' },
      { target: 'tab-exercises', title: 'Exercises', text: 'Make a test, unlock it when it’s time, and read the results.' }] }
    return null
  }
  function startTour(id: string) { const t = tourFor(id); if (t) setTour({ ...t, id }) }
  const autoTour = auto === 'first' ? 'first' : !tour && !shownPopup && insideKey && prefs && !prefs.seen.includes(insideKey) ? insideKey : null
  const activeTour = tour ?? (autoTour ? { ...tourFor(autoTour)!, id: autoTour } : null)
  function endTour() {
    const id = activeTour?.id
    if (id) setPrefs(p => ({ ...p, seen: [...new Set([...p.seen, id])] }))
    if (auto === 'first') setAutoDone(true)
    setTour(null)
  }

  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#EFF8FF' }} aria-busy="true" />
  )

  // One-time gate: a fresh account (role still null) picks Teacher or Parent before seeing the dashboard.
  if (role === null) return <RolePicker name={parentName} onPick={handlePickRole} />

  if (loadError) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#EFF8FF', padding:24, textAlign:'center' }}>
      <p style={{ fontSize:18, fontWeight:700, color:'#083D85', margin:0 }}>{t('Hmm, we couldn’t load your dashboard.')}</p>
      <p style={{ fontSize:14, color:'#3d6fb8', margin:0 }}>{t('Check your connection and try again.')}</p>
      <button onClick={() => loadAll()} style={{ padding:'14px 28px', background:'var(--accent-fill)', color:'var(--on-accent-fill)', border:'none', borderRadius:50, fontSize:16, fontWeight:800, cursor:'pointer' }}>{t('Try again')}</button>
    </div>
  )

  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
  const nav = [
    { label: tea ? 'Classes' : t('Home'), href: '/parent', on: home || !!childId || !!classId },
    { label: t('Help'), href: '/parent?view=help', on: view === 'help', tour: 'nav-help' },
    { label: t('Account'), href: '/parent?view=account', on: view === 'account' },
  ]
  const child = childId ? learners.find(d => d.learner.id === childId) : undefined
  const cls = classId ? classes.find(c => c.id === classId) : undefined
  const loose = tea ? learners.filter(d => !d.learner.grade_id || !classes.some(c => c.id === d.learner.grade_id)) : []
  const h1 = { margin: 0, fontSize: 28, fontWeight: 900, color: P.ink, fontFamily: 'var(--font-display)' } as const

  const notices = <>
    {/* The result of what the adult just did comes FIRST — after withdrawing for every child the full notice follows, and
        a banner under it is a banner nobody sees (2026-09-24). */}
    {actionMsg && (
      <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'12px 16px', marginBottom:16, fontSize:14, fontWeight:600, color:'#166534', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        ✅ {actionMsg}
        <button onClick={() => setActionMsg(null)} aria-label={t('Dismiss')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:P.ink3, minWidth:44, minHeight:44 }}>×</button>
      </div>
    )}
    {/* Consent-once (C2): a PARENT with no granted account consent sees the notice, or "waiting", here.
        Never blocking — the dashboard stays usable; only adding a child waits for the consent. */}
    {role === 'parent' && <AccountConsentCard lang={lang} />}
    {invites.length > 0 && (
      <div style={{ marginBottom:20 }}>
        {inviteMsg && <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'12px 16px', marginBottom:12, fontSize:14, fontWeight:600, color:'#166534' }}>✅ {inviteMsg}</div>}
        {invites.map(inv => (
          <div key={inv.id} style={{ background:'#fff', borderRadius:20, padding:'18px 16px', marginBottom:12, boxShadow:'0 4px 20px rgba(76,180,248,0.15)', border:'2px solid #0B4FA8' }}>
            <div style={{ fontSize:15, fontWeight:800, color:P.ink }}>{t('You’ve been invited!')}</div>
            <div style={{ fontSize:13, color:P.ink3, margin:'2px 0 14px' }}>{t('Access to:')} <strong>{inv.learner_name ?? t('a learner')}</strong></div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => handleAcceptInvite(inv.id)} disabled={acceptingId === inv.id} style={{ ...dbtn, flex:1, justifyContent:'center' }}>{acceptingId === inv.id ? t('Accepting…') : `✓ ${t('Accept')}`}</button>
              <button onClick={() => handleDeclineInvite(inv.id)} style={{ ...dghost, flex:1, justifyContent:'center' }}>✕ {t('Decline')}</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </>

  const upNext = <UpNext top={shown[0]} rest={shown.length - 1} onAct={act} onSnooze={snooze} onHide={hide} onOpenAll={() => setBell(true)}
    allClear={tea ? 'We’ll let you know when results come in.' : t('We’ll let you know when something changes.')} />

  let page
  if (childId) {
    page = !child ? <div style={dcard}><p style={{ margin:0 }}>{t('We couldn’t find that child.')} <Link href="/parent">{t('Back to Home')}</Link></p></div> : (() => {
      const d = child, klass = classes.find(c => c.id === d.learner.grade_id)
      const tab = (CHILD_TABS.some(([k]) => k === tabParam) ? tabParam : 'progress') as ChildTab
      return <ChildPage id={d.learner.id} name={d.learner.display_name} avatar={AVATAR_SRCS[d.learner.avatar_index] ?? AVATAR_SRCS[0]} avatarIndex={d.learner.avatar_index ?? 0} tab={tab}
        crumb={klass ? { href: `/parent?class=${klass.id}&tab=students`, label: klass.name } : { href: '/parent', label: tea ? 'Classes' : t('Home') }}
        owner={d.accessRole === 'owner'} lessonIds={d.learner.lesson_ids ?? null} due={d.learner.lesson_due ?? {}} isDone={id => lessonDone(d.learner.id, id)}
        login={childLogins === null ? null : childLogins[d.learner.id]} wallet={wallets[d.learner.id]}
        onLaunch={() => launchGame(d)} onLogin={() => setLoginFor(d.learner.id)}
        onCorrect={async (display_name, band, avatar_index) => {
          const r = await correctLearner(d.learner.id, band === null ? { display_name, avatar_index } : { display_name, avatar_index, age_group: band })
          if (r === 'ok') await loadAll()
          return r
        }}
        onSaveLessons={async (ids, due) => {
          const r = await setLearnerAssignments(d.learner.id, ids, due)
          if (r === 'ok') {
            const lesson_due = ids ? due : null
            setLearners(prev => prev.map(x => x.learner.id === d.learner.id ? { ...x, learner: { ...x.learner, lesson_ids: ids, lesson_due } } : x))
            // The child's screens read a copy saved when "Start learning" was tapped; keep it in step.
            const a = getActiveLearner()
            if (a?.id === d.learner.id) setActiveLearner({ ...a, lesson_ids: ids, lesson_due })
          }
          return r
        }}
        onSaveGame={async (enabled, minutes) => {
          const ok = await setGameSettings(d.learner.id, enabled, minutes)
          if (!ok) setActionMsg(t('Could not save the game time settings. Try again.'))
          const w = await getWallet(d.learner.id)
          setWallets(prev => ({ ...prev, [d.learner.id]: w }))
        }}
        dataRights={
          /* COPPA: a parent may SEE what is stored and have it DELETED — both under one heading so they are findable. */
          <DataRights name={d.learner.display_name} learnerId={d.learner.id}
            bundle={{ learner: d.learner, stats: d.stats, progress: d.progress, sessions: d.sessions }}>
            {confirming === d.learner.id ? (
              <div style={{ background:'#FEF2F2', border:'1.5px solid #FCA5A5', borderRadius:16, padding:'16px', marginBottom:16 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#991B1B', margin:'0 0 12px' }}>
                  {d.accessRole === 'owner'
                    ? `⚠️ ${t('Permanently delete {name}? This cannot be undone. All progress, sessions and data will be lost.', { name: d.learner.display_name })}`
                    : t('Remove yourself from {name}’s profile? You will lose access.', { name: d.learner.display_name })}
                </p>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => d.accessRole === 'owner' ? handleDelete(d.learner.id) : handleRemoveSelf(d.learner.id)}
                    style={{ flex:1, padding:'12px', background:'#DC2626', color:'#fff', border:'none', borderRadius:50, fontSize:14, fontWeight:800, cursor:'pointer' }}>
                    {d.accessRole === 'owner' ? t('Yes, delete') : t('Yes, remove me')}
                  </button>
                  <button onClick={() => setConfirming(null)} style={{ flex:1, padding:'12px', background:'#fff', color:'#3D6FB8', border:'1.5px solid #d3e9f9', borderRadius:50, fontSize:14, fontWeight:700, cursor:'pointer' }}>{t('Cancel')}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirming(d.learner.id)}
                style={{ width:'100%', padding:'12px', minHeight:44, background:'none', border:'1.5px solid #FCA5A5', borderRadius:50, fontSize:13, fontWeight:700, color:'#DC2626', cursor:'pointer', marginBottom:16 }}>
                {d.accessRole === 'owner' ? `🗑 ${t('Delete {name}’s profile', { name: d.learner.display_name })}` : `✕ ${t('Remove myself from {name}’s profile', { name: d.learner.display_name })}`}
              </button>
            )}
          </DataRights>
        } />
    })()
  } else if (classId) {
    page = !cls ? <div style={dcard}><p style={{ margin:0 }}>We couldn’t find that class. <Link href="/parent">Back to Classes</Link></p></div> : (() => {
      const tab = (CLASS_TABS.some(([k]) => k === tabParam) ? tabParam : 'students') as ClassTab
      const students = learners.filter(d => d.learner.grade_id === cls.id && d.accessRole === 'owner')
        .map(d => ({ id: d.learner.id, name: d.learner.display_name, lessonIds: d.learner.lesson_ids ?? null, due: d.learner.lesson_due ?? {} }))
      return <ClassPage cls={cls} tab={tab} paid={paid} students={students} logins={childLogins} onLogin={setLoginFor}
        onChanged={() => { void loadAll(true); getMyClasses().then(setClasses) }} onStudentsAdded={() => { void loadAll(true) }}
        onUpdate={c => setClasses(cs => cs.map(x => x.id === c.id ? c : x))}
        onDeleted={() => { setClasses(cs => cs.filter(x => x.id !== cls.id)); router.push('/parent'); void loadAll(true) }} />
    })()
  } else if (view === 'account') {
    page = <>
      <h1 style={{ ...h1, marginBottom: 18 }}>{t('Account')}</h1>
      <div className="card-grid">
        {!tea && <section style={dcard} data-tour="language-card">
          <h2 style={h2}>{t('Language')} · Idioma</h2>
          <p style={{ margin:'4px 0 12px', fontSize:13, color:P.ink3, fontWeight:700 }}>{t('The language of this dashboard. Lessons stay in English. Saved on this device.')}</p>
          <div role="group" aria-label={t('Language')} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {([['en', 'English'], ['es', 'Español']] as const).map(([l, label]) => (
              <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => { saveLang(l); setChosenLang(l) }}
                style={{ padding:'8px 18px', minHeight:44, borderRadius:999, border:'2px solid', borderColor: lang === l ? P.accent : P.edge, background: lang === l ? 'var(--milo-orange-soft)' : P.card, fontWeight:800, fontSize:15, fontFamily:'inherit', cursor:'pointer', color:P.ink }}>{label}</button>
            ))}
          </div>
        </section>}
        {/* Review 1 Q5: the whole screen bigger on this device, for the parent and the child alike. */}
        <TextSizeCard style={dcard} />
        <section style={dcard} data-tour="reminders-card">
          <h2 style={h2}>{t('Reminders')}</h2>
          <p style={{ margin:'4px 0 6px', fontSize:13, color:P.ink3, fontWeight:700 }}>{t('Choose what we point out. You can also snooze or hide one reminder with ⋯. Saved on this device.')}</p>
          {([['setup', t('Setup steps'), t('Things not set up yet: logins, game time, modules, exercises.')],
             ['help', t('Where help is needed'), tea ? 'A question most of a class got wrong.' : t('A topic a child keeps missing.')],
             ['nudge', t('Gentle nudges'), tea ? 'An exercise not everyone has taken.' : t('A child who hasn’t practiced for a while, or a due date that passed.')],
             ...(tea ? [] : [['good', t('Celebrations'), t('When a child masters a topic.')], ['recap', t('Weekly recap'), t('A short summary on your first visit each week.')]]),
          ] as [Kind | 'good' | 'recap', string, string][]).map(([k, title, d]) => {
            const on = !prefs?.off.includes(k)
            return (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'10px 0', borderTop:`1px solid ${P.edge}` }}>
                <div><b style={{ color:P.ink }}>{title}</b><div style={{ fontSize:13.5, color:P.ink2 }}>{d}</div></div>
                <button type="button" role="switch" aria-checked={on} aria-label={title} onClick={() => setPrefs(p => ({ ...p, off: on ? [...p.off, k] : p.off.filter(x => x !== k) }))}
                  style={{ width:52, height:30, borderRadius:99, border:0, flexShrink:0, cursor:'pointer', position:'relative', background: on ? '#157347' : '#d3e9f9' }}>
                  <span style={{ position:'absolute', top:3, left: on ? 25 : 3, width:24, height:24, borderRadius:'50%', background:'#fff', transition:'left .15s' }} />
                </button>
              </div>
            )
          })}
        </section>
        {tea
          ? <section style={dcard} data-tour="plan-card"><h2 style={h2}>Your plan</h2><p style={{ margin:'6px 0 0', color:P.ink2 }}>{paid ? 'Paid: your students get modules and class exercises.' : 'Free: your students get class exercises. Modules for students come with the classroom plan.'}</p></section>
          // The private beta is free (founder, 2026-09-24): no plans, no prices, no link to the (dark) refund policy until billing is live.
          : BILLING_LIVE && <section style={dcard} data-tour="plan-card"><h2 style={h2}>{t('Plan & billing')}</h2><p style={{ margin:'6px 0 12px', color:P.ink2 }}>{t('Your plan and what it costs.')}</p><Link href="/parent/plan" style={dghost}>{t('See plans')}</Link></section>}
        {!tea && <section style={dcard}><h2 style={h2}>{t('Share access')}</h2><p style={{ margin:'6px 0 12px', color:P.ink2 }}>{t('Let another parent or guardian see a child’s progress.')}</p><Link href="/parent/invites" style={dghost}>{t('Share access')}</Link></section>}
        {/* Withdraw permission for every child, and KEEP the account — its own card, never on the close page (prod check 2.8).
            On success: back to the dashboard with the result as the banner; "Add a child" then asks for permission again. */}
        {!tea && <WithdrawAllCard lang={lang} style={dcard}
          onDone={() => { setActionMsg(PROPOSED.withdrawnAllBody[lang]); router.push('/parent'); void loadAll(true) }} />}
        {/* ⚠️ THE ONLY LINK TO ACCOUNT DELETION, and it lives here, inside the adult's Account, behind the parent PIN —
            the threat is a child on a parent's signed-in device, so nothing on the child's side links anywhere under
            /parent. The page itself carries the real guards. */}
        <section style={dcard} data-tour="close-card"><h2 style={h2}>{t('Close your account')}</h2><p style={{ margin:'6px 0 12px', color:P.ink2 }}>{tea ? 'Deletes your account and every student profile you added.' : t('Deletes your account and every child profile you added.')}</p>
          <a href="/parent/account" style={{ ...dghost, color:'#B42318' }}>{t('Close your account')}</a></section>
      </div>
    </>
  } else if (view === 'help') {
    page = <>
      <h1 style={{ ...h1, marginBottom: 18 }}>{t('Help')}</h1>
      <section style={{ ...dcard, maxWidth: 640, display:'flex', flexDirection:'column', gap:8 }}>
        <h2 style={{ ...h2, marginBottom: 4 }}>{t('Show me how to…')}</h2>
        {helpGoals({ tea, paid, c: learners[0]?.learner.id, k: classes[0]?.id, lang }).map(g => (
          <div key={g.h} style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <h3 style={{ margin:'10px 0 0', fontSize:13, fontWeight:900, color:P.ink3, textTransform:'uppercase', letterSpacing:'.06em' }}>{g.h}</h3>
            {g.items.map(i => (
              <button key={i.t} type="button" onClick={() => setTour(i.tour)}
                style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2, textAlign:'left', border:`1.5px solid ${P.edge}`, background:'#fff', borderRadius:14, padding:'12px 14px', minHeight:56, cursor:'pointer' }}>
                <b style={{ color:P.ink }}>{i.t}</b><span style={{ fontSize:13.5, color:P.ink2 }}>{i.d}</span>
              </button>
            ))}
          </div>
        ))}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:6 }}>
          <button type="button" style={dlink} onClick={() => startTour('first')}>{t('Take the 1-minute tour again')}</button>
          <Link href="/help" style={{ ...dlink, display:'inline-flex', alignItems:'center' }}>{t('Questions and answers')}</Link>
        </div>
      </section>
    </>
  } else if (tea) {
    page = <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12, flexWrap:'wrap', marginBottom:18 }}>
        <div><h1 style={h1}>Your classes</h1><p style={{ margin:'4px 0 0', color:P.ink2 }}>Open a class to manage its students, lessons and exercises.</p></div>
        <button type="button" style={dbtn} data-tour="new-class" onClick={() => setMakingClass(true)}>+ New class</button>
      </div>
      {makingClass && <NewClass onClose={() => setMakingClass(false)} onCreated={c => { setMakingClass(false); setClasses(cs => [...cs, c]); router.push(`/parent?class=${c.id}&tab=students`) }} />}
      {notices}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {upNext}
        <div className="card-grid">
          {classes.map(c => <ClassCard key={c.id} cls={c} paid={paid} students={learners.filter(d => d.learner.grade_id === c.id).length} />)}
        </div>
        {classes.length === 0 && !makingClass && <div style={dcard}><p style={{ margin:0, color:P.ink2 }}>No classes yet. Make one to add students and choose their lessons.</p></div>}
        {loose.length > 0 && (
          <section style={dcard}>
            <h2 style={h2}>Students not in a class</h2>
            <ul style={{ listStyle:'none', margin:'10px 0 0', padding:0, display:'flex', flexWrap:'wrap', gap:8 }}>
              {loose.map(d => <li key={d.learner.id}><Link href={`/parent?child=${d.learner.id}`} style={dghost}>{d.learner.display_name}</Link></li>)}
            </ul>
          </section>
        )}
      </div>
    </>
  } else {
    page = <>
      <div style={{ marginBottom:18 }}>
        <h1 style={h1}>{greeting}, {parentName}</h1>
        <p style={{ margin:'4px 0 0', color:P.ink2 }}>{t('Let’s add your learners…')}</p>
      </div>
      {notices}
      {learners.length === 0 ? <EmptyDashboard onAdd={() => setShowAddModal(true)} /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {upNext}
          <div className="card-grid">
            {learners.map(d => {
              const lessons = chosenModules(d.learner.lesson_ids).flatMap(m => m.lessons)
              const done = lessons.filter(l => lessonDone(d.learner.id, l.id)).length
              const next = lessons.find(l => !lessonDone(d.learner.id, l.id))
              return <ChildCard key={d.learner.id} id={d.learner.id} name={d.learner.display_name} avatar={AVATAR_SRCS[d.learner.avatar_index] ?? AVATAR_SRCS[0]}
                lastPlayed={d.stats?.last_played_at ? new Date(d.stats.last_played_at).toLocaleDateString(lang === 'es' ? 'es-US' : undefined) : '—'}
                next={next?.title ?? null} done={done} total={lessons.length} onStart={() => launchGame(d)} />
            })}
            <button type="button" data-tour="add-child" onClick={() => setShowAddModal(true)}
              style={{ border:`2px dashed ${P.edge}`, background:'transparent', borderRadius:16, minHeight:180, fontWeight:900, fontSize:15, color:P.ink2, cursor:'pointer' }}>{t('+ Add a child')}</button>
          </div>
        </div>
      )}
    </>
  }

  const recapRows = learners.map(d => {
    const r = extra[d.learner.id]?.report, weekAgo = now - 7 * 86_400_000
    const mastered7 = (extra[d.learner.id]?.points ?? []).filter(p => p.reason === 'mastered' && new Date(p.created_at).getTime() > weekAgo).length
    const stuck = r?.stuck[0] ? findLesson(r.stuck[0].lessonId)?.lesson.title : undefined
    return { d, problems: r?.problemsThisWeek ?? 0, mastered7, stuck }
  })

  return (
    <LangContext.Provider value={lang}>
    <div className="home-app" style={{ fontFamily:'var(--font-body)' }}>
      <DashNav items={nav} reminders={shown.length} onBell={() => setBell(true)} onSignOut={signOut} />

      <div style={{ minWidth:0 }}>
        <main className="adult-shell">{page}</main>

        {/* Support footer. Deliberately the LAST thing on the page and visually quiet — a parent only looks for it when
            something is wrong, and it must be findable then. */}
        <div style={{ padding:'8px 16px 28px', textAlign:'center' }}>
          <SupportPanel learnerId={childId ?? undefined} />
          {/* ⚠️ BOTH DOCUMENTS, REACHABLE FROM INSIDE THE APP: a parent who agreed at signup must be able to read what they agreed to. */}
          <p style={{ margin:'18px 0 0', fontSize:12, color:'#3d6fb8' }}>
            <Link href="/legal/terms" style={{ color:'#3d6fb8', fontWeight:700, textDecoration:'none' }}>{t('Terms of Service')}</Link>
            <span style={{ margin:'0 8px', opacity:0.5 }}>·</span>
            <Link href="/legal/privacy" style={{ color:'#3d6fb8', fontWeight:700, textDecoration:'none' }}>{t('Privacy Policy')}</Link>
          </p>
        </div>
      </div>

      <RemindersSheet open={bell} onClose={() => setBell(false)} list={shown} snoozedCount={snoozed} settingsHref="/parent?view=account"
        onAct={act} onSnooze={snooze} onHide={hide} onUnsnooze={() => setPrefs(p => ({ ...p, snoozed: {} }))} />

      <Sheet open={shownPopup === 'celebrate'} onClose={closePopup} label={t('Well done')}>
        {mastered[0] && <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:64, lineHeight:1 }} aria-hidden>⭐</div>
          <h2 style={{ ...h2, fontSize:22, marginTop:10 }}>{t('{name} mastered “{title}”', { name: mastered[0].name, title: mastered[0].title })}</h2>
          <p style={{ color:P.ink2, margin:'6px 0 16px' }}>{mastered.length === 1 ? t('Since your last visit.') : t(mastered.length === 2 ? 'Since your last visit, with 1 more topic.' : 'Since your last visit, with {n} more topics.', { n: mastered.length - 1 })} {t('A “well done” from you goes a long way.')}</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button type="button" style={dbtn} onClick={() => { closePopup(); router.push(`/parent?child=${mastered[0].id}&tab=progress`) }}>{t('See {name}’s progress', { name: mastered[0].name })}</button>
            <button type="button" style={dghost} onClick={closePopup}>{t('Nice!')}</button>
          </div>
        </div>}
      </Sheet>

      <Sheet open={shownPopup === 'recap'} onClose={closePopup} label={t('This week')}>
        <h2 style={{ ...h2, fontSize:22, marginBottom:8 }}>{t('This week')}</h2>
        {recapRows.map(({ d, problems, mastered7, stuck }) => (
          <div key={d.learner.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, padding:'12px 0', borderBottom:`1px solid ${P.edge}` }}>
            <div><b style={{ color:P.ink }}>{d.learner.display_name}</b>
              <div style={{ fontSize:13.5, color:P.ink2 }}>{t(problems === 1 ? '1 problem answered' : '{n} problems answered', { n: problems })}{mastered7 ? ` · ${t(mastered7 === 1 ? '1 topic mastered' : '{n} topics mastered', { n: mastered7 })}` : ''}{stuck ? ` · ${t('finding “{title}” hard', { title: stuck })}` : ''}</div></div>
            <Link href={`/parent?child=${d.learner.id}&tab=progress`} onClick={closePopup} style={dlink}>{t('Open')}</Link>
          </div>
        ))}
        {shown[0] && <div style={{ ...dcard, background:'#fff', marginTop:14 }}>
          <div style={{ fontSize:13, color:P.ink3, fontWeight:700 }}>{t('One thing to try this week')}</div>
          <p style={{ margin:'4px 0 10px', fontWeight:800, color:P.ink }}>{shown[0].title}</p>
          <button type="button" style={dbtn} onClick={() => { closePopup(); act(shown[0]) }}>{shown[0].action}</button></div>}
        <p style={{ margin:'14px 0 0', fontSize:13, color:P.ink3, fontWeight:700 }}>{t('Shown on your first visit each week. Turn it off in Account → Reminders.')}</p>
      </Sheet>

      <TourRunner tour={activeTour} onEnd={endTour} />

      {loginFor && (
        <ChildLoginSheet
          learnerId={loginFor}
          name={learners.find(d => d.learner.id === loginFor)?.learner.display_name ?? ''}
          current={childLogins?.[loginFor] ?? null}
          onClose={() => setLoginFor(null)}
          onChanged={u => setChildLogins(prev => {
            const next = { ...(prev ?? {}) }
            if (u) next[loginFor] = u; else delete next[loginFor]
            return next
          })}
        />
      )}

      {/* Add learner modal */}
      {/* Consent first (document 02), then the sheet — carrying the consent that lets the child exist. */}
      {showAddModal && (
        <AddChildFlow lang={lang} onClose={() => setShowAddModal(false)} renderAdd={attest => (
          <>
            <AddLearnerModal
              attest={attest}
              onClose={() => setShowAddModal(false)}
              onAdded={async () => { setShowAddModal(false); await loadAll() }}
            />
            <TourRunner tour={!tea && learners.length === 0 && prefs && !prefs.seen.includes('add-child') ? tourFor('add-child') : null}
              onEnd={() => setPrefs(p => ({ ...p, seen: [...new Set([...p.seen, 'add-child'])] }))} />
          </>
        )} />
      )}
    </div>
    </LangContext.Provider>
  )
}

const h2 = { margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--ink)' } as const

/**
 * The dashboard with nobody in it yet. Lifted out of `ParentDashboard`'s JSX so `/ui-preview` can
 * render it: inline, it was reachable only by signing in with an account that has zero learners,
 * i.e. never in any harness — and this repo's own note on that route is that layout is exactly
 * where the misses live.
 */
export function EmptyDashboard({ onAdd }: { onAdd: () => void }) {
  const t = useT()
  return (
    <div style={{
        background:P.card, border:`2px solid ${P.edge}`, borderRadius:24,
        boxShadow:'0 6px 28px rgba(8,61,133,0.08)',
        padding:'44px 24px', margin:'8px auto 0', maxWidth:520,
        textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14,
      }}>
        <h2 style={{ fontSize:23, fontWeight:900, color:P.ink, margin:0, fontFamily:'var(--font-display)' }}>{t('Welcome to Radlic!')}</h2>
        <p style={{ fontSize:15, color:P.ink2, margin:0, maxWidth:340, lineHeight:1.5 }}>
          {t('Add your first learner and we’ll find where to start.')}
        </p>
        <button onClick={onAdd} style={{ marginTop:4, background:'var(--accent-fill)', color:'var(--on-accent-fill)', border:'none', borderRadius:50, padding:'16px 34px', minHeight:44, fontSize:17, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(76,180,248,0.28)' }}>
          {t('+ Add your first learner')}
        </button>
      </div>
  )
}

// One-time Teacher/Parent picker shown on first login (profiles.role still null). The choice is
// persisted on the profile; teachers then land on Grades, parents on the learner dashboard.
//
// ⚠️ A TAP CHOOSES; "CONTINUE" COMMITS. It used to write the role on the first tap, which makes a
// mis-tap an unannounced, irreversible account change on the very first screen — and the copy
// underneath ("you can change this later") was not true of anything on screen. Two steps means the
// choice is visible, re-tappable, and the reader can see what they picked before it is saved.
export function RolePicker({ name, onPick }: { name: string; onPick: (r: UserRole) => void }) {
  const [picked, setPicked] = useState<UserRole | null>(null)
  const [busy,   setBusy]   = useState(false)
  function commit() { if (busy || !picked) return; setBusy(true); onPick(picked) }

  const cards: { role: UserRole; emoji: string; title: string; sub: string }[] = [
    { role: 'parent',  emoji: '👪', title: "I'm a Parent",  sub: 'One or two children at home.' },
    { role: 'teacher', emoji: '🎓', title: "I'm a Teacher", sub: 'A class or several groups.' },
  ]

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:'32px 20px', background:P.page, fontFamily:'var(--font-body)' }}>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:28, fontWeight:900, color:P.ink, margin:'0 0 6px', fontFamily:'var(--font-display)' }}>Welcome{name && name !== 'there' ? `, ${name}` : ''}!</h1>
        <p style={{ fontSize:15, color:P.ink2, margin:0 }}>How will you be using Radlic?</p>
      </div>

      {/* `.role-cards` stacks under 720px and sits the two side by side above it. */}
      <div className="role-cards">
        {cards.map(c => {
          const on = picked === c.role
          return (
            <button
              key={c.role}
              onClick={() => setPicked(c.role)}
              disabled={busy}
              aria-pressed={on}
              style={{
                display:'flex', flexDirection:'column', alignItems:'flex-start', gap:6, textAlign:'left',
                padding:'18px 20px', minHeight:44, background:P.card,
                border:`2px solid ${on ? P.accent : P.edge}`, borderRadius:20,
                cursor: busy ? 'default' : 'pointer', opacity: busy && !on ? 0.55 : 1,
                boxShadow: on ? '0 4px 16px rgba(76,180,248,0.18)' : '0 2px 10px rgba(8,61,133,0.06)',
                transition:'border-color 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
                position:'relative', width:'100%', boxSizing:'border-box',
              }}
            >
              {/* The chosen mark is a RING plus a tick, never a green fill — green is the verdict
                  colour everywhere else in this app and nothing here is being marked correct. */}
              <span aria-hidden="true" style={{
                position:'absolute', top:14, right:14,
                width:22, height:22, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                background: on ? P.accent : 'transparent',
                border: on ? 'none' : `2px solid ${P.edge}`,
                color:'#fff', fontSize:12, fontWeight:900, lineHeight:1,
              }}>{on ? '✓' : ''}</span>
              <span style={{ fontSize:34 }}>{c.emoji}</span>
              <span style={{ display:'block', fontSize:18, fontWeight:900, color:P.ink }}>{c.title}</span>
              <span style={{ display:'block', fontSize:13, color:P.ink2, lineHeight:1.35 }}>{c.sub}</span>
            </button>
          )
        })}
      </div>

      <p style={{ fontSize:12, color:P.ink3, margin:0, textAlign:'center' }}>
        You can change this later — it just tailors your home screen.
      </p>

      <button
        onClick={commit}
        disabled={!picked || busy}
        style={{
          width:'100%', maxWidth:340, padding:'15px', minHeight:44,
          background: !picked || busy ? P.edge : 'var(--accent-fill)',
          color: !picked || busy ? P.ink3 : 'var(--on-accent-fill)',
          border:'none', borderRadius:50, fontSize:16, fontWeight:800,
          cursor: busy ? 'wait' : picked ? 'pointer' : 'default',
          boxShadow: !picked || busy ? 'none' : '0 4px 14px rgba(76,180,248,0.28)',
          transition:'all 200ms ease',
        }}
      >{busy ? 'Setting up…' : 'Continue →'}</button>

      {/* The same quiet footer the rest of the adult surface carries, so a reader stuck on the
          first screen of the product can still reach help and the documents they just agreed to. */}
      <p style={{ margin:'10px 0 0', fontSize:12, color:P.ink3, textAlign:'center' }}>
        <Link href="/help" style={{ color:P.ink2, fontWeight:700, textDecoration:'none' }}>Need help?</Link>
        <span style={{ margin:'0 8px', opacity:0.5 }}>·</span>
        <Link href="/legal/terms" style={{ color:P.ink2, fontWeight:700, textDecoration:'none' }}>Terms of Service</Link>
        <span style={{ margin:'0 8px', opacity:0.5 }}>·</span>
        <Link href="/legal/privacy" style={{ color:P.ink2, fontWeight:700, textDecoration:'none' }}>Privacy Policy</Link>
      </p>
    </div>
  )
}

/**
 * `attest`: the parent's granted, current ACCOUNT consent. Without it there is nothing to attest
 * against and the sheet cannot add (the database would refuse anyway); with it, "Add" stays disabled
 * until the ATTEST box is ticked, and the child is created carrying that consent's notice version.
 */
export function AddLearnerModal({ onClose, onAdded, attest }: { onClose: () => void; onAdded: () => void; attest?: Attest }) {
  const t = useT(), lang = useLang()
  const [attested,    setAttested]    = useState(false)
  const [showNotice,  setShowNotice]  = useState(false)
  const [name,        setName]        = useState('')
  const [avatarIndex, setAvatarIndex] = useState(0)
  // Which modules the child gets — asked, never assumed (founder, 2026-09-19: a new child was silently given every module).
  const [grade,       setGrade]       = useState(GRADES[0])
  const [pick,        setPick]        = useState<Set<string>>(() => new Set())
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) { setError(t('Please enter a name (at least 2 characters)')); return }
    if (pick.size === 0) { setError(t('Choose at least one module for this learner.')); return }
    if (!attest || !attested) return
    const chosen = MODULES.filter(m => pick.has(m.id))
    // `age_group` is a legacy band the database still requires; it is no longer asked (founder, 2026-09-19).
    // The captured-diagnostic band that used to win here went with the check itself (2026-09-20).
    const ageGroup = bandOf(chosen[0].grade)
    setLoading(true)
    const learner = await createLearner(trimmed, avatarIndex, ageGroup, { lessonIds: chosen.flatMap(m => m.lessons.map(l => l.id)) }, { id: attest.id, noticeVersion: attest.noticeVersion })
    if (!learner) { setError(t('Something went wrong. Please try again.')); setLoading(false); return }
    onAdded()
  }

  /* ⚠️ ONE COMPONENT, TWO SHAPES, DECIDED IN CSS — a bottom sheet under 768px (thumb reach on a
     phone) and a centred dialog above it. Rendering the sheet shape on a 1280px frame put a
     480px-wide form flush against the bottom edge of a mostly-empty screen. `.sheet-wrap` /
     `.sheet-card` carry the switch, including the two entrance animations and the
     `prefers-reduced-motion` opt-out. */
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={t('Add a learner')} style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(8,61,133,0.45)' }} onClick={onClose}>
      <div className="sheet-card" style={{ background:P.card, padding:'28px 24px 40px', overflowY:'auto', WebkitOverflowScrolling:'touch', boxSizing:'border-box' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize:20, fontWeight:800, margin:'0 0 4px', color:P.ink, fontFamily:'var(--font-display)' }}>{t('Add a learner')}</h3>
        <p style={{ fontSize:13, color:P.ink2, margin:'0 0 18px', lineHeight:1.45 }}>{t('Quiet, private progress tracking for home or class.')}</p>
        <div data-tour="add-avatar" style={{ display:'flex', gap:12, marginBottom:20, justifyContent:'center' }}>
          {AVATARS.map((emoji, i) => (
            <button key={i} onClick={() => setAvatarIndex(i)} aria-pressed={avatarIndex===i} aria-label={t('Avatar {n}', { n: i + 1 })} style={{ position:'relative', width:64, height:64, fontSize:32, borderRadius:16, cursor:'pointer', background:avatarIndex===i?'var(--milo-orange-soft)':P.page, border:avatarIndex===i?`3px solid ${P.accent}`:`2px solid ${P.edge}`, transition:'border-color 0.15s, background 0.15s' }}>
              {emoji}
              {avatarIndex===i && (
                <span aria-hidden="true" style={{ position:'absolute', top:-4, right:-4, width:20, height:20, borderRadius:'50%', background:'var(--accent-fill)', color:'var(--on-accent-fill)', fontSize:11, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>✓</span>
              )}
            </button>
          ))}
        </div>
        <div data-tour="add-name">
        <label htmlFor="learner-name" style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink2, margin:'0 0 6px' }}>{t('Child’s name')}</label>
        <input id="learner-name" type="text" placeholder={t('First name is plenty')} value={name} onChange={e => { setName(e.target.value); setError(null) }} onKeyDown={e => e.key === 'Enter' && handleAdd()} maxLength={30} autoFocus style={{ width:'100%', padding:'14px 16px', minHeight:44, fontSize:16, fontWeight:600, color:P.ink, background:P.page, border:`2px solid ${error?'#F0B4AE':P.edge}`, borderRadius:14, outline:'none', boxSizing:'border-box', marginBottom:6 }} />
        </div>
        {error && <p role="alert" style={{ fontSize:13, color:'#93000A', fontWeight:600, margin:'0 0 12px' }}>{error}</p>}

        <div data-tour="add-modules">
        <p style={{ fontSize:13, fontWeight:700, color:P.ink2, margin:'10px 0 8px' }}>{t('Which modules can they see?')}</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <ModuleChecklist grade={grade} setGrade={setGrade} pick={pick} setPick={setPick} />
        </div>
        </div>

        {/**
          * ⚠️ WHAT WE COLLECT, ON THE SCREEN THAT COLLECTS IT. Until 2026-09-22 this sheet took a
          * child's name, avatar and grade behind one reassurance line and NO LINK AT ALL — a
          * render of it returned `allLinks: []`. That is the COPPA gap: a parent could create a
          * child profile without ever being told what is kept or being shown the policy.
          *
          * ⚠️ THE WORDING IS NOT MINE AND MUST NOT BE REWRITTEN CASUALLY. It is shortened from
          * `docs/legal/02-coppa-direct-notice-to-parents.md` (its table rows 1–3, its "What we do
          * with it", and its "We do not ask your child for" list) plus the guardian sentence from
          * §2 of the Terms, and the founder approved this exact shortening. **It has to keep saying
          * the same thing as the Privacy Policy it links to** — two different statements about what
          * we collect from a child is the failure, not a style inconsistency. The avatar is named
          * here because the live policy names it; draft 02's table omits it, which is a gap in the
          * DRAFT and is flagged for the attorney rather than papered over here.
          *
          * ⚠️ THIS IS NOT CONSENT, AND NOTHING HERE MAY IMPLY IT IS. Verifiable parental consent —
          * card or email-plus, with a consent record that gates collection — is
          * `docs/legal/03-consent-and-checkout-screen-copy.md` and is not built. The guardian line
          * is a confirmation the adult makes, which is what the Terms already say; it is not a
          * claim that consent was properly obtained.
          */}
        <div style={{ color:P.ink3, margin:'14px 0 0' }}>
          <p style={{ fontSize:11.5, lineHeight:1.45, margin:0 }}>
            {t('What we collect about your child: the first name or nickname you choose, their avatar, the lessons you choose and a grade band worked out from them, and their work in the app — answers, scores and progress. We use it to teach your child and to show you how they are doing. We never ask a child for an email address, phone number, home address or photograph.')}
          </p>
          <p style={{ fontSize:11.5, lineHeight:1.45, margin:'6px 0 0' }}>
            <Link href="/legal/privacy" style={{ color:P.accent, fontWeight:700 }}>{t('Read the Privacy Policy')}</Link>
          </p>
          {!attest && <p style={{ fontSize:11.5, lineHeight:1.45, margin:'6px 0 0' }}>
            {t('By adding a child you confirm you are their parent or legal guardian, or have that person’s permission.')}
          </p>}
          <p style={{ fontSize:11.5, lineHeight:1.45, margin:'6px 0 0' }}>
            {t('Progress is private to this account. No public profiles and no comparisons with other children.')}
          </p>
        </div>
        {/* Consent-once: the parental attestation, one per child, UNTICKED. The account consent is the
            verifiable consent; this is the parent saying THIS child is theirs to consent for. */}
        {attest && (
          <div data-consent="attest" data-tour="add-attest" style={{ margin:'14px 0 0', padding:'12px 14px', border:`1.5px solid ${P.edge}`, borderRadius:14, background:P.page }}>
            <label style={{ display:'flex', gap:10, alignItems:'flex-start', fontSize:14, lineHeight:1.45, color:P.ink, fontWeight:600, cursor:'pointer' }}>
              <input type="checkbox" checked={attested} onChange={e => setAttested(e.target.checked)} style={{ width:22, height:22, flex:'0 0 auto', marginTop:1, accentColor:'#0B4FA8' }} />
              <span>{ATTEST.tick[lang].replace('{date}', longDate(attest.confirmedAt, lang))}</span>
            </label>
            <button type="button" onClick={() => setShowNotice(v => !v)} aria-expanded={showNotice}
              style={{ background:'none', border:'none', padding:'12px 0 4px', minHeight:44, color:P.accent, fontWeight:700, fontSize:13.5, cursor:'pointer', textDecoration:'underline' }}>{ATTEST.link[lang]}</button>
            {showNotice && <div style={{ marginTop:8 }}><Notice lang={lang} /></div>}
          </div>
        )}
        <button data-tour="add-submit" onClick={handleAdd} disabled={loading || !attest || !attested} style={{ width:'100%', padding:'16px', minHeight:44, marginTop:12, background:loading||!attest||!attested?P.edge:'var(--accent-fill)', color:loading||!attest||!attested?P.ink3:'var(--on-accent-fill)', border:'none', borderRadius:50, fontSize:17, fontWeight:800, cursor:loading?'wait':!attest||!attested?'not-allowed':'pointer', boxShadow:loading||!attest||!attested?'none':'0 4px 14px rgba(76,180,248,0.28)' }}>
          {loading ? t('Adding…') : pick.size ? t(pick.size === 1 ? 'Add learner with 1 module' : 'Add learner with {n} modules', { n: pick.size }) : t('Add learner')}
        </button>
      </div>
    </div>
  )
}