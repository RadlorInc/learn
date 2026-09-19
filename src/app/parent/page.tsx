'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getMyLearners, getParentDashboard, getLearnerStats, getLearnerProgress,
  getRecentSessions, signOut, createLearner,
  getReceivedInvites, acceptInvite,
  deleteLearnerPermanently, removeMyselfFromLearner,
  getLatestGap, getCheckupStatus,
  getMyRole, setMyRole, setLearnerLessons, setLearnerAssignments, enterAsChild, getChildLogins, removeChildLogin,
  getWallet, setGameSettings, type Wallet, getMyClasses, getMyTeacherPaid, type ClassRow,
} from '@/data/repositories'
import { enqueueDiagnostic, flushDiagnosticQueue, enqueueSession, flushQueue } from '@/infra/useOfflineSync'
import { peekPendingDiagnostic, takePendingDiagnostic } from '@/infra/storage/pendingDiagnostic'
import { setActivePlan, advancePlan } from '@/infra/storage/activePlan'
import { adoptDemoRun } from '@/infra/storage/demoRun'
import { scoreChapter } from '@/core/scoring'
import { track } from '@/infra/analytics'
import { hasCheckup, markCheckupDone, checkupSkips } from '@/infra/storage/checkup'
import { setActiveLearner, getActiveLearner } from '@/data/supabase/useLearnerSession'
import { DataRights } from '@/shared/ui/DataRights'
import { getCurrentSession } from '@/data/auth'
import type { Learner, LearnerStats, LearnerProgress, Session, InviteWithLearner, UserRole } from '@/data/supabase/types'
import { LEGACY_CHAPTERS_HIDDEN, type AgeGroup, type ChapterType } from '@/core/chapters'
import { AGE_GROUP_OPTIONS } from '@/core/ageGroups'
import { SupportPanel } from '@/shared/ui/SupportPanel'
import { ChildLoginSheet, ChildLoginsList } from '@/shared/ui/ChildLoginSheet'
import { chosenModules, MODULES, GRADES } from '@/features/lessons/modules'
import { LessonLibrary } from '@/features/lessons/LessonLibrary'
import { AssignLessons } from '@/features/lessons/AssignLessons'
import { Performance } from '@/features/lessons/Performance'
import { ClassBar, ClassPanel, ModuleChecklist, bandOf } from '@/features/classes/Classes'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { loadStanding } from '@/infra/storage/lessonStanding'
import { pullLessonProgress } from '@/infra/storage/lessonSync'

const AVATARS     = ['🦊', '🐰', '🐻', '🐱']
const AVATAR_SRCS = ['/assets/objects/fox.png','/assets/objects/bunny.png','/assets/objects/bear.png','/assets/objects/cat.png']

/* The adult surface's palette, from globals.css. Same values the Stitch parent-suite designs use;
   this page previously mixed them with ad-hoc greys (#888 / #e5e7eb / #1a1a1a) that belong to no
   token, which is why the dashboard read as a different product from the rest of the app. */
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

/* The sidebar, item for item from the MathPath home mockup. `href` = a real page; `view` = shown in
   place on this page; `soon` = not built yet, so it renders a placeholder (with the nearest real page
   linked where one exists). Swap `soon` for `href` as each screen ships. */
type NavItem = { label: string; href?: string; view?: string; soon?: { text: string; link?: { href: string; label: string } } }
const FAMILY_NAV: NavItem[] = [
  { label: 'Home', view: 'home' },
  { label: 'Learners', view: 'learners' },
  { label: 'Lesson library', view: 'library' },
  { label: 'Assign lessons', view: 'assign' },
  { label: 'Performance', view: 'dash' },
  { label: 'Plan & billing', href: '/parent/plan' },
  { label: 'Settings', view: 'settings', soon: { text: 'Your account name and preferences.', link: { href: '/parent/account', label: 'Close your account' } } },
  { label: 'Help', href: '/help' },
]
const TEACHER_NAV: NavItem[] = [
  { label: 'Class Home', view: 'home' },
  { label: 'Roster', view: 'learners' },
  { label: 'Groups', view: 'groups', soon: { text: 'Small groups built from the stuck list, so you can assign one rescue lesson to a few students at once.' } },
  { label: 'Lesson library', view: 'library' },
  { label: 'Assign', view: 'assign' },
  { label: 'Class dashboard', view: 'dash' },
  { label: 'Classroom plan', view: 'tplan', soon: { text: 'What the teacher classroom includes, and school or district options.' } },
  { label: 'Help', href: '/help' },
]

interface LearnerData {
  learner:     Learner
  stats:       LearnerStats | null
  progress:    LearnerProgress[]
  sessions:    Session[]
  accessRole:  'owner' | 'viewer' | 'self' | null
}

export default function ParentDashboard() {
  const router = useRouter()
  const [allLearners,  setLearners]     = useState<LearnerData[]>([])
  const [selected,     setSelected]     = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [loadError,    setLoadError]    = useState(false)
  const [parentName,   setParentName]   = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [invites,      setInvites]      = useState<InviteWithLearner[]>([])
  const [acceptingId,  setAcceptingId]  = useState<string | null>(null)
  const [inviteMsg,    setInviteMsg]    = useState<string | null>(null)
  const [actionMsg,    setActionMsg]    = useState<string | null>(null)
  const [confirming,   setConfirming]   = useState<string | null>(null) // learnerId being confirmed
  const [wallets, setWallets] = useState<Record<string, Wallet | 'unavailable' | null>>({})   // learnerId → points + game settings
  const [, redraw] = useState(0)
  const [recheckDue, setRecheckDue] = useState<{ weeks: number } | null>(null)   // week-6 nudge for the active learner
  const [role, setRole] = useState<UserRole | null | 'loading'>('loading')       // null = show the one-time Teacher/Parent picker
  const [picked, setView] = useState<string | null>(null)             // null = that role's home
  const [childLogins, setChildLogins] = useState<Record<string, string> | null>(null)   // learnerId → username; null = unknown
  const [loginFor, setLoginFor] = useState<string | null>(null)       // learnerId whose login sheet is open
  const [classes, setClasses] = useState<ClassRow[]>([])              // a teacher's classes (features/classes)
  const [classId, setClassId] = useState<string | null>(null)         // null = all students
  const [paid, setPaid] = useState(false)                             // a paid teacher's classes get modules, a free one's exercises
  // A teacher looking at one class sees only its students — on every view, since they all read `learners`.
  const learners = role === 'teacher' && classId ? allLearners.filter(d => d.learner.grade_id === classId) : allLearners
  const currentClass = classes.find(c => c.id === classId)

  // `quiet`: refresh the data without the full-screen splash, so an open panel (a class's new passwords) stays on screen.
  async function loadAll(quiet?: boolean) {
    if (quiet !== true) setLoading(true)
    setLoadError(false)
    try {
      // Local session (no auth-server round trip); RLS guards the reads below.
      const session = await getCurrentSession()
      const user = session?.user
      if (!user) { router.replace('/auth'); return }
      setParentName(user.user_metadata?.full_name?.split(' ')[0] ?? 'there')

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
      if (myRole === 'teacher') { getMyClasses().then(setClasses); getMyTeacherPaid().then(setPaid) }
      getChildLogins().then(setChildLogins)   // not awaited: the dashboard must not wait on the login lookup   // null → the render shows the one-time Teacher/Parent picker

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

      if (data.length === 0) {
        setLearners([]); setSelected(null); return
      }

      setLearners(data)
      // Progress follows the account: bring each child's topics onto this device, then their points. Not awaited —
      // the dashboard shows at once and redraws when the account has answered.
      const ids = chosenModules(null).flatMap(m => m.lessons.map(l => l.id))
      for (const d of data) {
        pullLessonProgress(d.learner.id, ids)
          .then(ok => { if (ok) redraw(n => n + 1); return getWallet(d.learner.id) })
          .then(w => setWallets(prev => ({ ...prev, [d.learner.id]: w })))
      }
      setSelected(prev => {
        if (prev && data.find(d => d.learner.id === prev)) return prev
        return data[0].learner.id
      })
    } catch (e) {
      // A flaky network must never leave the parent stuck on the splash forever.
      console.warn('[parent] loadAll failed:', e)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line

  async function handleAcceptInvite(inviteId: string) {
    setAcceptingId(inviteId)
    const result = await acceptInvite(inviteId)
    if (result.ok) {
      setInviteMsg('Access granted! Learner added to your dashboard.')
      setInvites(prev => prev.filter(i => i.id !== inviteId))
      await loadAll()
    } else {
      setInviteMsg(result.error ?? 'Something went wrong')
    }
    setAcceptingId(null)
  }

  function handleDeclineInvite(inviteId: string) {
    setInvites(prev => prev.filter(i => i.id !== inviteId))
  }

  async function handleDelete(learnerId: string) {
    // The child's own account first: deleting the learner removes its access row but NOT the auth user,
    // which would outlive the child as a login that signs in to nothing.
    if (childLogins === null || childLogins[learnerId]) {
      const r = await removeChildLogin(learnerId)
      // not_configured = this server cannot have made a login, so there is none to outlive the learner.
      if (!r.ok && r.error !== 'not_configured') { setActionMsg("Could not remove this learner's login, so nothing was deleted. Try again."); return }
    }
    const result = await deleteLearnerPermanently(learnerId)
    if (result.ok) {
      setActionMsg('Learner deleted.')
      setConfirming(null)
      await loadAll()
    } else {
      setActionMsg(result.error ?? 'Failed to delete')
    }
  }

  async function handleRemoveSelf(learnerId: string) {
    const result = await removeMyselfFromLearner(learnerId)
    if (result.ok) {
      setActionMsg('You have been removed from this learner.')
      setConfirming(null)
      await loadAll()
    } else {
      setActionMsg(result.error ?? 'Failed to remove')
    }
  }

  // First-login role choice: persist it; both roles stay here, the menu follows the role.
  async function handlePickRole(r: UserRole) {
    setRole(r)                    // optimistic — the picker disappears immediately
    await setMyRole(r)
  }

  // A BRAND-NEW learner is OFFERED the checkup on their first "Start learning". Established kids —
  // any who already have play history (progress / sessions / XP) OR have already done a checkup —
  // go straight into the app and are never asked. So existing profiles are grandfathered, while a
  // new child sees the offer exactly once.
  //
  // ⚠️ OFFERED, NOT FORCED, SINCE 2026-08-24 — the destination is the same screen, but that screen
  // now carries a one-tap "Skip for now" that issues a grade-start plan. `checkupSkips` is what
  // stops the offer reappearing on every launch: without it, "optional" would mean "asked forever",
  // which is worse than mandatory because it never even resolves.
  function isEstablished(d: LearnerData): boolean {
    return !!d.stats?.last_played_at || (d.stats?.total_xp ?? 0) > 0 || d.progress.length > 0 || d.sessions.length > 0
  }
  async function launchGame(d: LearnerData) {
    const learner = d.learner
    setActiveLearner(learner)
    // While legacy chapters are hidden the check is off, so every child goes straight to the lesson list.
    if (LEGACY_CHAPTERS_HIDDEN || isEstablished(d) || checkupSkips(learner.id) > 0 || await hasCheckup(learner.id)) router.push('/menu')
    else router.push(`/diagnostic?band=${learner.age_group ?? '3-5'}`)
  }

  // The diagnostic front door for a signed-in learner: set them active (so the result saves + items
  // personalize to their name) and open the probe pre-tuned to their age band.
  function findStartingPoint(learner: Learner) {
    setActiveLearner(learner)
    router.push(`/diagnostic?band=${learner.age_group ?? '3-5'}`)
  }

  // Step 8: the week-N re-check — pull the learner's last root gap and open the guarantee check.
  async function recheckGap(learner: Learner) {
    setActiveLearner(learner)
    const g = await getLatestGap(learner.id)
    if (!g?.rootGap) { setActionMsg('Run the check-up first — then we can re-check the gap.'); return }
    router.push(`/diagnostic/recheck?skill=${encodeURIComponent(g.rootGap)}&band=${g.band}&week=6`)
  }

  const active = learners.find(d => d.learner.id === selected)

  // Week-6 re-check nudge: surface the guarantee loop in-app when a re-check is due for this learner.
  useEffect(() => {
    setRecheckDue(null)
    if (!active) return
    let cancelled = false
    getCheckupStatus(active.learner.id)
      .then(st => { if (!cancelled && st?.recheckDue) setRecheckDue({ weeks: st.weeksSince }) })
      .catch(() => { /* best-effort nudge */ })
    return () => { cancelled = true }
  }, [active?.learner.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FCEAB6', fontSize:48 }}>🦊</div>
  )

  // One-time gate: a fresh account (role still null) picks Teacher or Parent before seeing the dashboard.
  if (role === null) return <RolePicker name={parentName} onPick={handlePickRole} />

  if (loadError) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#FCEAB6', padding:24, textAlign:'center' }}>
      <div style={{ fontSize:56 }}>🦊</div>
      <p style={{ fontSize:18, fontWeight:700, color:'#3D2516', margin:0 }}>Hmm, we couldn&apos;t load your dashboard.</p>
      <p style={{ fontSize:14, color:'#7a6a55', margin:0 }}>Check your connection and try again.</p>
      <button onClick={() => loadAll()} style={{ padding:'14px 28px', background:'linear-gradient(135deg,#F26B2C 0%,#e05a1f 100%)', color:'#fff', border:'none', borderRadius:50, fontSize:16, fontWeight:800, cursor:'pointer' }}>Try again</button>
    </div>
  )

  // Home summary, from the lesson progress pulled from the account in loadAll (lessonSync.ts).
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const rows = learners.map(d => {
    // The topics this child sees: the parent's pick, or every topic (modules.ts `chosenModules`).
    const lessons = chosenModules(d.learner.lesson_ids).flatMap(m => m.lessons)
    const done = lessons.filter(l => lessonDone(d.learner.id, l.id)).length
    const next = lessons.find(l => !lessonDone(d.learner.id, l.id))
    const mastered = lessons.filter(l => loadStanding(d.learner.id, l.id)?.mastered).length
    return { d, done, total: lessons.length, next, mastered }
  })
  const activeRow = rows.find(r => r.d === active)
  const card = { background:P.card, border:`1.5px solid ${P.edge}`, borderRadius:16, padding:16 } as const
  const btn = { background:P.accent, color:'#fff', border:'none', borderRadius:10, padding:'10px 14px', minHeight:44, fontSize:14, fontWeight:800, cursor:'pointer', textDecoration:'none', display:'inline-flex', alignItems:'center' } as const
  const ghost = { ...btn, background:P.card, color:P.ink, border:`1.5px solid ${P.edge}` } as const
  function openLearner(id: string) {
    setSelected(id)
    setView('learners')
    window.scrollTo({ top: 0 })
  }

  // The menu is decided by the account's role alone — a teacher never sees the family menu, and back.
  const tea = role === 'teacher'
  const nav = tea ? TEACHER_NAV : FAMILY_NAV
  const view = picked ?? 'home'
  const current = nav.find(i => i.view === view)

  return (
    <div className="home-app" style={{ fontFamily:'var(--font-body)' }}>

      {/* Sidebar on a laptop, a sideways-scrolling bar on a phone (`.home-nav` in globals.css). */}
      <nav className="home-nav" aria-label="Dashboard">
        <span className="home-logo">🦊 AdaptiveLearn</span>
        {nav.map(i => i.href
          ? <Link key={i.label} href={i.href}>{i.label}</Link>
          : <button key={i.label} className={view === i.view ? 'on' : ''} onClick={() => setView(i.view!)}>{i.label}</button>)}
        <button onClick={signOut} className="home-nav-end">Sign out</button>
      </nav>

      <div style={{ minWidth:0 }}>
      <div className="adult-shell">
        {tea && !current?.soon && (
          <ClassBar classes={classes} current={classId} onPick={setClassId}
            onCreated={c => { setClasses(cs => [...cs, c]); setClassId(c.id); setView('home') }} />
        )}
        {view === 'library' ? (
          <LessonLibrary
            learners={learners.map(d => ({ id: d.learner.id, name: d.learner.display_name, lessonIds: d.learner.lesson_ids ?? null, canEdit: d.accessRole === 'owner' }))}
            onSave={async (id, ids) => {
              const r = await setLearnerLessons(id, ids)
              if (r === 'ok') {
                setLearners(prev => prev.map(d => d.learner.id === id ? { ...d, learner: { ...d.learner, lesson_ids: ids } } : d))
                // The child's screens read a copy saved when "Start learning" was tapped; keep it in step (as /parent/topics does).
                const a = getActiveLearner()
                if (a?.id === id) setActiveLearner({ ...a, lesson_ids: ids })
              }
              return r
            }}
          />
        ) : view === 'assign' ? (
          <AssignLessons
            learners={learners.map(d => ({ id: d.learner.id, name: d.learner.display_name, lessonIds: d.learner.lesson_ids ?? null, due: d.learner.lesson_due ?? {}, canEdit: d.accessRole === 'owner' }))}
            onSave={async (id, ids, due) => {
              const r = await setLearnerAssignments(id, ids, due)
              if (r === 'ok') {
                const lesson_due = ids ? due : null
                setLearners(prev => prev.map(d => d.learner.id === id ? { ...d, learner: { ...d.learner, lesson_ids: ids, lesson_due } } : d))
                // The child's screens read a copy saved when "Start learning" was tapped; keep it in step.
                const a = getActiveLearner()
                if (a?.id === id) setActiveLearner({ ...a, lesson_ids: ids, lesson_due })
              }
              return r
            }}
          />
        ) : view === 'dash' ? (
          <Performance
            learners={learners.map(d => ({ id: d.learner.id, name: d.learner.display_name, lessonIds: d.learner.lesson_ids ?? null, due: d.learner.lesson_due ?? {} }))}
            onAssign={() => setView('assign')}
          />
        ) : current?.soon ? (
          <>
            <h1 style={{ margin:'0 0 18px', fontSize:28, fontWeight:900, color:P.ink, fontFamily:'var(--font-display)' }}>{current.label}</h1>
            <div style={{ ...card, maxWidth:560 }}>
              <span className="home-pill" style={{ background:'var(--milo-orange-soft)', color:P.ink }}>Coming soon</span>
              <p style={{ margin:'12px 0 0', fontSize:15, color:P.ink2, lineHeight:1.5 }}>{current.soon.text}</p>
              {current.soon.link && <p style={{ margin:'14px 0 0' }}><Link href={current.soon.link.href} style={btn}>{current.soon.link.label}</Link></p>}
            </div>
          </>
        ) : (<>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:18 }}>
          <div>
            <h1 style={{ margin:0, fontSize:28, fontWeight:900, color:P.ink, fontFamily:'var(--font-display)' }}>{view === 'learners' ? (tea ? 'Roster' : 'Learners') : `${greeting}, ${parentName}`}</h1>
            <div style={{ color:P.ink2, fontSize:14, marginTop:2 }}>{learners.length} learner{learners.length === 1 ? '' : 's'}{invites.length > 0 ? ` · ${invites.length} invite${invites.length === 1 ? '' : 's'} waiting` : ''}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {!currentClass && <button onClick={() => setShowAddModal(true)} style={ghost}>+ Add learner</button>}
          </div>
        </div>

        {tea && view === 'home' && currentClass && (
          <ClassPanel cls={currentClass} paid={paid}
            students={learners.filter(d => d.accessRole === 'owner').map(d => ({ id: d.learner.id, name: d.learner.display_name }))}
            onChanged={loadAll} onStudentsAdded={() => { void loadAll(true) }} onUpdate={c => setClasses(cs => cs.map(x => x.id === c.id ? c : x))}
            onDeleted={() => { setClassId(null); loadAll() }} />
        )}

        {view === 'home' && learners.length > 0 && (
          <>
            {/* Lessons and topics are per child, never summed across children: pick whose. */}
            {learners.length > 1 && (
              <div className="chip-scroll" style={{ marginBottom:12 }} aria-label="Show counts for">
                {learners.map(({ learner }) => (
                  <button key={learner.id} onClick={() => setSelected(learner.id)} aria-pressed={selected === learner.id}
                    style={{ padding:'8px 14px', minHeight:40, borderRadius:50, border:'2px solid', borderColor: selected === learner.id ? P.accent : P.edge, background: selected === learner.id ? 'var(--milo-orange-soft)' : P.card, cursor:'pointer', fontSize:14, fontWeight:700 }}>
                    {learner.display_name}
                  </button>
                ))}
              </div>
            )}
            <div className="home-stats">
              {[
                { num: learners.length, label: 'Learners' },
                { num: activeRow?.done ?? 0,     label: `Lessons finished${active ? ` · ${active.learner.display_name}` : ''}` },
                { num: activeRow?.mastered ?? 0, label: `Topics mastered${active ? ` · ${active.learner.display_name}` : ''}` },
              ].map(s => (
                <div key={s.label} style={card}>
                  <div style={{ fontSize:32, fontWeight:900, color:P.ink }}>{s.num}</div>
                  <div style={{ fontSize:13, color:P.ink3, fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="home-two" style={{ margin:'14px 0 24px' }}>
              <div style={card}>
                <h3 style={{ margin:'0 0 10px', fontSize:16, fontWeight:800, color:P.ink }}>Lessons</h3>
                <div style={{ overflowX:'auto' }}>
                  <table className="home-table">
                    <thead><tr><th>Learner</th><th>Next lesson</th><th>Done</th><th>Last played</th></tr></thead>
                    <tbody>
                      {rows.map(({ d, done, total, next }) => (
                        <tr key={d.learner.id} onClick={() => openLearner(d.learner.id)} style={{ cursor:'pointer' }}>
                          <td style={{ fontWeight:700 }}>{d.learner.display_name}</td>
                          <td>{next?.title ?? 'All topics finished 🎉'}</td>
                          <td>
                            <span className="home-pill" style={{ background: done === total ? '#d9f7e6' : 'var(--milo-orange-soft)', color: done === total ? '#157347' : P.ink }}>
                              {done} of {total}
                            </span>
                          </td>
                          <td style={{ color:P.ink3 }}>{d.stats?.last_played_at ? new Date(d.stats.last_played_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ ...card, display:'flex', flexDirection:'column', gap:10, alignItems:'flex-start' }}>
                <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:P.ink }}>Quick actions</h3>
                <Link href="/parent/invites" style={ghost}>✉️ Share access</Link>
              </div>
            </div>

            <ChildLoginsList title={tea ? 'Student logins' : 'Child logins'} blurb={`Set a username and password for each ${tea ? 'student' : 'child'}, so they can sign in on any device and go straight to their lessons.`}
              learners={learners.filter(d => d.accessRole === 'owner').map(d => ({ id: d.learner.id, name: d.learner.display_name }))}
              logins={childLogins} onLogins={setChildLogins} />
          </>
        )}

        {/* Action message */}
        {actionMsg && (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'12px 16px', marginBottom:16, fontSize:14, fontWeight:600, color:'#166534', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            ✅ {actionMsg}
            <button onClick={() => setActionMsg(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:P.ink3 }}>×</button>
          </div>
        )}

        {/* Invite popups */}
        {invites.length > 0 && (
          <div style={{ marginBottom:20 }}>
            {inviteMsg && (
              <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'12px 16px', marginBottom:12, fontSize:14, fontWeight:600, color:'#166534' }}>
                ✅ {inviteMsg}
              </div>
            )}
            {invites.map(inv => (
              <div key={inv.id} style={{ background:'#fff', borderRadius:20, padding:'18px 16px', marginBottom:12, boxShadow:'0 4px 20px rgba(242,107,44,0.15)', border:'2px solid #F26B2C' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'#FFF4D6', fontSize:24, display:'flex', alignItems:'center', justifyContent:'center' }}>📬</div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:P.ink }}>You&apos;ve been invited!</div>
                    <div style={{ fontSize:13, color:P.ink3, marginTop:2 }}>
                      Access to: <strong>{inv.learner_name ?? 'a learner'}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => handleAcceptInvite(inv.id)} disabled={acceptingId === inv.id} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#F26B2C 0%,#e05a1f 100%)', color:'#fff', border:'none', borderRadius:50, fontSize:14, fontWeight:800, cursor:'pointer' }}>
                    {acceptingId === inv.id ? 'Accepting...' : '✓ Accept'}
                  </button>
                  <button onClick={() => handleDeclineInvite(inv.id)} style={{ flex:1, padding:'12px', background:'#fff', color:'#888', border:'1.5px solid #e5e7eb', borderRadius:50, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                    ✕ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {learners.length === 0 && !currentClass && <EmptyDashboard onAdd={() => setShowAddModal(true)} />}

        {/* ⚠️ TWO COLUMNS ABOVE 1024px, ONE BELOW — and the whole page was capped at 480px before,
            so a laptop rendered a phone column with ~800px of empty paper either side. The rail
            holds WHO is being looked at (the picker, their stats, their data controls); the wide
            column holds WHAT they have done. `.dash-cols` is a plain CSS grid, so the single-column
            phone layout is the default and needs no JS to be correct. */}
        {view === 'learners' && <div className="dash-cols">
          <div className="dash-rail">

          {/* Learner selector */}
          {learners.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <h2 style={{ fontSize:16, fontWeight:800, margin:0, color:P.ink }}>Pick a learner</h2>
              </div>
              <div className="chip-scroll">
                {learners.map(({ learner }) => (
                  <button key={learner.id} onClick={() => setSelected(learner.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:50, border:'2px solid', borderColor:selected === learner.id ? P.accent : P.edge, background:selected === learner.id ? 'var(--milo-orange-soft)' : P.card, cursor:'pointer', fontSize:14, fontWeight:700, transition:'all 0.15s' }}>
                    <img src={AVATAR_SRCS[learner.avatar_index]} alt="avatar" loading="lazy" decoding="async" style={{width:28,height:28,objectFit:'cover',borderRadius:'50%',border:'2px solid var(--outline)'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                    {learner.display_name}
                  </button>
                ))}
              </div>
            </div>
          )}

            {active && (
              <>
              {/* Stats card */}
              <div style={{ background:'linear-gradient(135deg,#F26B2C 0%,#e05a1f 100%)', borderRadius:20, padding:'20px 20px 24px', color:'#fff', marginBottom:16, boxShadow:'0 4px 20px rgba(242,107,44,0.3)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                    <img src={['/assets/objects/fox.png','/assets/objects/bunny.png','/assets/objects/bear.png','/assets/objects/cat.png'][active.learner.avatar_index]} alt="avatar" loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:12}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:20, fontWeight:800 }}>{active.learner.display_name}</div>
                    <div style={{ fontSize:13, opacity:0.85 }}>
                      <span style={{ opacity:0.7, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>
                        {active.accessRole === 'owner' ? '👑 Owner' : '👁 Viewer'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {[
                    { label:'Topics mastered', value: activeRow?.mastered ?? 0 },
                    { label:'Lessons finished', value: activeRow?.done ?? 0 },
                  ].map(s => (
                    <div key={s.label} style={{ flex:1, background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:800 }}>{s.value}</div>
                      <div style={{ fontSize:11, opacity:0.8, marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {recheckDue && !LEGACY_CHAPTERS_HIDDEN && (
                  <button onClick={() => recheckGap(active.learner)} style={{ width:'100%', padding:'13px 14px', marginBottom:10, background:'rgba(255,255,255,0.95)', color:'#B45309', border:'2px solid #F6C453', borderRadius:16, fontSize:14, fontWeight:800, cursor:'pointer', textAlign:'left', lineHeight:1.35 }}>
                    🔔 It&apos;s been {recheckDue.weeks} weeks — time to re-check {active.learner.display_name}&apos;s gap →
                  </button>
                )}
                <button onClick={() => launchGame(active)} style={{ width:'100%', padding:'14px', background:'#fff', color:'#F26B2C', border:'none', borderRadius:50, fontSize:16, fontWeight:800, cursor:'pointer' }}>
                  ▶ Start learning
                </button>
                {LEGACY_CHAPTERS_HIDDEN && active.accessRole === 'owner' && (
                  <button onClick={() => router.push(`/parent/topics?learner=${active.learner.id}`)} style={{ width:'100%', marginTop:10, padding:'12px', background:'rgba(255,255,255,0.16)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:50, fontSize:14, fontWeight:800, cursor:'pointer' }}>
                    📚 Choose topics{active.learner.lesson_ids?.length ? ` · ${active.learner.lesson_ids.length} chosen` : ' · every topic'}
                  </button>
                )}
                {active.accessRole === 'owner' && (
                  <button onClick={() => setLoginFor(active.learner.id)} style={{ width:'100%', marginTop:10, padding:'12px', background:'rgba(255,255,255,0.16)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:50, fontSize:14, fontWeight:800, cursor:'pointer' }}>
                    {/* null = the lookup failed; the sheet still works (the server updates an existing login in place). */}
                    🔑 {childLogins === null ? 'Login' : childLogins[active.learner.id] ? `Login · ${childLogins[active.learner.id]}` : 'Set a login'}
                  </button>
                )}
                {!LEGACY_CHAPTERS_HIDDEN && <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  <button onClick={() => findStartingPoint(active.learner)} style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.16)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:50, fontSize:13.5, fontWeight:800, cursor:'pointer' }}>
                    🔍 Find starting point
                  </button>
                  <button onClick={() => recheckGap(active.learner)} style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.16)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:50, fontSize:13.5, fontWeight:800, cursor:'pointer' }}>
                    🔁 Re-check the gap
                  </button>
                </div>}
              </div>

              {/* COPPA: a parent may SEE what is stored and have it DELETED. Both live under one
                  heading so they are findable — the export is new, the delete control below is the
                  existing one, reused rather than re-implemented. */}
              <DataRights
                name={active.learner.display_name}
                learnerId={active.learner.id}
                bundle={{ learner: active.learner, stats: active.stats, progress: active.progress, sessions: active.sessions }}
              >
              {confirming === active.learner.id ? (
                <div style={{ background:'#FEF2F2', border:'1.5px solid #FCA5A5', borderRadius:16, padding:'16px', marginBottom:16 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#991B1B', margin:'0 0 12px' }}>
                    {active.accessRole === 'owner'
                      ? `⚠️ Permanently delete ${active.learner.display_name}? This cannot be undone. All progress, sessions and data will be lost.`
                      : `Remove yourself from ${active.learner.display_name}'s profile? You will lose access.`}
                  </p>
                  <div style={{ display:'flex', gap:10 }}>
                    <button
                      onClick={() => active.accessRole === 'owner' ? handleDelete(active.learner.id) : handleRemoveSelf(active.learner.id)}
                      style={{ flex:1, padding:'12px', background:'#DC2626', color:'#fff', border:'none', borderRadius:50, fontSize:14, fontWeight:800, cursor:'pointer' }}
                    >
                      {active.accessRole === 'owner' ? 'Yes, delete' : 'Yes, remove me'}
                    </button>
                    <button onClick={() => setConfirming(null)} style={{ flex:1, padding:'12px', background:'#fff', color:'#888', border:'1.5px solid #e5e7eb', borderRadius:50, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(active.learner.id)}
                  style={{ width:'100%', padding:'12px', background:'none', border:'1.5px solid #FCA5A5', borderRadius:50, fontSize:13, fontWeight:700, color:'#DC2626', cursor:'pointer', marginBottom:16 }}
                >
                  {active.accessRole === 'owner'
                    ? `🗑 Delete ${active.learner.display_name}'s profile`
                    : `✕ Remove myself from ${active.learner.display_name}'s profile`}
                </button>
              )}
              </DataRights>

              </>
            )}
          </div>

          {active && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <GameTimeCard
              name={active.learner.display_name}
              wallet={wallets[active.learner.id]}
              canEdit={active.accessRole === 'owner'}
              onSave={async (enabled, minutes) => {
                const ok = await setGameSettings(active.learner.id, enabled, minutes)
                if (!ok) setActionMsg('Could not save the game time settings. Try again.')
                const w = await getWallet(active.learner.id)
                setWallets(prev => ({ ...prev, [active.learner.id]: w }))
              }}
            />

            {/* Topics, per module, from the lesson progress synced to the account. */}
            <div style={{ background:P.card, border:`1.5px solid ${P.edge}`, borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(61,37,22,0.05)' }}>
              <h3 style={{ fontSize:15, fontWeight:800, margin:'0 0 14px', color:P.ink }}>Topics</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {chosenModules(active.learner.lesson_ids).filter(m => m.lessons.length > 0).map(m => {
                  const done = m.lessons.filter(l => lessonDone(active.learner.id, l.id)).length
                  const mastered = m.lessons.filter(l => loadStanding(active.learner.id, l.id)?.mastered).length
                  return (
                    <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, opacity: done || mastered ? 1 : 0.55 }}>
                      <div style={{ fontSize:13, fontWeight:600, flex:1, color:P.ink }}>Grade {m.grade} · {m.title}</div>
                      <div style={{ fontSize:12, color:P.ink3, fontWeight:700, whiteSpace:'nowrap' }}>{done} of {m.lessons.length} done · {mastered} mastered</div>
                    </div>
                  )
                })}
              </div>
            </div>
            </div>
          )}
        </div>}
        </>)}
      </div>

      {/* Support footer. Deliberately the LAST thing on the page and visually quiet — a parent
          only looks for it when something is wrong, and it must be findable then. If they cannot
          reach us, our support system is that they leave. */}
      <div style={{ padding:'8px 16px 28px', textAlign:'center' }}>
        <SupportPanel learnerId={selected ?? undefined} />

        {/* ⚠️ BOTH DOCUMENTS, REACHABLE FROM INSIDE THE APP. A parent who agreed at signup has to be
            able to go back and read what they agreed to without hunting for the marketing site —
            and while these are drafts, this is also the only way anyone signed in can see the
            draft banner. Same pair, same order, as the signup consent line. */}
        {/* ⚠️ THE ONLY LINK TO ACCOUNT DELETION, AND IT IS DELIBERATELY DOWN HERE, small and last —
            past the learners, the progress and the support panel. The threat is a child on a
            parent's signed-in device, so the destructive path must not be somewhere a child
            wandering the app arrives at. Nothing on the child's side (/game, /menu, /shop) links
            anywhere under /parent. The page itself carries the real guards. */}
        <p style={{ margin:'18px 0 0', fontSize:12, color:'#9a8b78' }}>
          <Link href="/parent/account" style={{ color:'#8a7a63', fontWeight:700, textDecoration:'none' }}>Close your account</Link>
          <span style={{ margin:'0 8px', opacity:0.5 }}>·</span>
          <Link href="/legal/terms" style={{ color:'#8a7a63', fontWeight:700, textDecoration:'none' }}>Terms of Service</Link>
          <span style={{ margin:'0 8px', opacity:0.5 }}>·</span>
          <Link href="/legal/privacy" style={{ color:'#8a7a63', fontWeight:700, textDecoration:'none' }}>Privacy Policy</Link>
        </p>
      </div>
      </div>

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
      {showAddModal && (
        <AddLearnerModal
          onClose={() => setShowAddModal(false)}
          onAdded={async () => { setShowAddModal(false); await loadAll() }}
        />
      )}
    </div>
  )
}

/**
 * The dashboard with nobody in it yet. Lifted out of `ParentDashboard`'s JSX so `/ui-preview` can
 * render it: inline, it was reachable only by signing in with an account that has zero learners,
 * i.e. never in any harness — and this repo's own note on that route is that layout is exactly
 * where the misses live.
 */
/** Points and the parent's game-time rules for one child. Only the owning adult can change the rules (the database checks). */
function GameTimeCard({ name, wallet, canEdit, onSave }: {
  name: string; wallet: Wallet | 'unavailable' | null | undefined; canEdit: boolean; onSave: (enabled: boolean, minutes: number) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const save = async (enabled: boolean, minutes: number) => { setSaving(true); await onSave(enabled, minutes); setSaving(false) }
  const box = { background:P.card, border:`1.5px solid ${P.edge}`, borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(61,37,22,0.05)' } as const
  return (
    <div style={box}>
      <h3 style={{ fontSize:15, fontWeight:800, margin:'0 0 10px', color:P.ink }}>🎮 Game time</h3>
      {wallet === undefined ? <p style={{ margin:0, fontSize:13, color:P.ink3 }}>Loading…</p>
        : wallet === 'unavailable' ? <p style={{ margin:0, fontSize:13, color:P.ink3 }}>Points and game time are coming soon.</p>
        : wallet === null ? <p style={{ margin:0, fontSize:13, color:P.ink3 }}>Could not load {name}&apos;s points. Refresh to try again.</p>
        : <>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:12 }}>
            <div><div style={{ fontSize:26, fontWeight:900, color:P.ink }}>{wallet.balance}</div><div style={{ fontSize:12, color:P.ink3, fontWeight:600 }}>points</div></div>
            <div><div style={{ fontSize:26, fontWeight:900, color:P.ink }}>{wallet.minutes_used_today} / {wallet.minutes_per_day}</div><div style={{ fontSize:12, color:P.ink3, fontWeight:600 }}>minutes played today</div></div>
          </div>
          <p style={{ margin:'0 0 12px', fontSize:13, color:P.ink2, lineHeight:1.45 }}>
            {name} earns points by practising and spends {wallet.points_per_minute} points for each minute of game.
          </p>
          {canEdit ? (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <button disabled={saving} onClick={() => save(!wallet.enabled, wallet.minutes_per_day)}
                style={{ padding:'10px 14px', minHeight:44, borderRadius:10, border:`1.5px solid ${P.edge}`, background: wallet.enabled ? '#d9f7e6' : P.page, color:P.ink, fontSize:14, fontWeight:800, cursor:'pointer' }}>
                Game time: {wallet.enabled ? 'On' : 'Off'}
              </button>
              <label style={{ fontSize:14, fontWeight:700, color:P.ink, display:'flex', alignItems:'center', gap:8 }}>
                Most per day
                <select disabled={saving} value={wallet.minutes_per_day} onChange={e => save(wallet.enabled, Number(e.target.value))}
                  style={{ minHeight:44, borderRadius:10, border:`1.5px solid ${P.edge}`, padding:'0 10px', fontSize:14, fontWeight:700 }}>
                  {[...new Set([10, 15, 20, 30, 45, 60, wallet.minutes_per_day])].sort((a, b) => a - b).map(m => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </label>
            </div>
          ) : (
            <p style={{ margin:0, fontSize:13, color:P.ink3 }}>Game time is {wallet.enabled ? 'on' : 'off'}. The parent who added {name} can change it.</p>
          )}
        </>}
    </div>
  )
}

export function EmptyDashboard({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
        background:P.card, border:`2px solid ${P.edge}`, borderRadius:24,
        boxShadow:'0 6px 28px rgba(61,37,22,0.08)',
        padding:'44px 24px', margin:'8px auto 0', maxWidth:520,
        textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14,
      }}>
        <div style={{ fontSize:60 }}>🦊</div>
        <h2 style={{ fontSize:23, fontWeight:900, color:P.ink, margin:0, fontFamily:'var(--font-display)' }}>Welcome to AdaptiveLearn!</h2>
        <p style={{ fontSize:15, color:P.ink2, margin:0, maxWidth:340, lineHeight:1.5 }}>
          Add your first learner and we&apos;ll find where to start.
        </p>
        <button onClick={onAdd} style={{ marginTop:4, background:P.accent, color:'#fff', border:'none', borderRadius:50, padding:'16px 34px', minHeight:44, fontSize:17, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(242,107,44,0.28)' }}>
          + Add your first learner
        </button>
        {/* ⚠️ BOTH OF THESE ARE TRUE AS OF 2026-08-25 AND ONLY BECAUSE OF THAT DATE. The check
            became OPTIONAL then (a one-tap "Skip for now" issues a grade-start plan), so
            "no diagnostic tests required" is a fact about the product, not reassuring copy —
            and the ~2 minutes is the ADD-LEARNER form, never the check itself, which the intro
            copy correctly calls "about ten minutes". If the check is ever re-forced, the first
            of these two chips becomes a lie and has to come out with it. */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:2 }}>
          {['Takes about 2 minutes', 'No diagnostic tests required'].map(t => (
            <span key={t} style={{ background:P.page, border:`1.5px solid ${P.edge}`, borderRadius:999, padding:'7px 13px', fontSize:12, fontWeight:700, color:P.ink2 }}>{t}</span>
          ))}
        </div>
        <p style={{ fontSize:12.5, color:P.ink3, margin:'6px 0 0', lineHeight:1.5 }}>
          …or wait for someone to share access with you.
        </p>
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
      <div style={{ fontSize:52 }}>🦊</div>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:28, fontWeight:900, color:P.ink, margin:'0 0 6px', fontFamily:'var(--font-display)' }}>Welcome{name && name !== 'there' ? `, ${name}` : ''}!</h1>
        <p style={{ fontSize:15, color:P.ink2, margin:0 }}>How will you be using AdaptiveLearn?</p>
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
                boxShadow: on ? '0 4px 16px rgba(242,107,44,0.18)' : '0 2px 10px rgba(61,37,22,0.06)',
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
          background: !picked || busy ? P.edge : P.accent,
          color: !picked || busy ? P.ink3 : '#fff',
          border:'none', borderRadius:50, fontSize:16, fontWeight:800,
          cursor: busy ? 'wait' : picked ? 'pointer' : 'default',
          boxShadow: !picked || busy ? 'none' : '0 4px 14px rgba(242,107,44,0.28)',
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

export function AddLearnerModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const router = useRouter()
  const [name,        setName]        = useState('')
  const [avatarIndex, setAvatarIndex] = useState(0)
  // Which modules the child gets — asked, never assumed (founder, 2026-09-19: a new child was silently given every module).
  const [grade,       setGrade]       = useState(GRADES[0])
  const [pick,        setPick]        = useState<Set<string>>(() => new Set())
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) { setError('Please enter a name (at least 2 characters)'); return }
    if (pick.size === 0) { setError('Choose at least one module for this learner.'); return }
    const chosen = MODULES.filter(m => pick.has(m.id))
    // `age_group` is a legacy band the database still requires; it is no longer asked (founder, 2026-09-19). A captured
    // logged-out diagnostic keeps its band so its replay below still matches; otherwise the band of the first grade chosen.
    const b = peekPendingDiagnostic()?.band
    const ageGroup = AGE_GROUP_OPTIONS.some(o => o.value === b) ? (b as AgeGroup) : bandOf(chosen[0].grade)
    setLoading(true)
    const learner = await createLearner(trimmed, avatarIndex, ageGroup, { lessonIds: chosen.flatMap(m => m.lessons.map(l => l.id)) })
    if (!learner) { setError('Something went wrong. Please try again.'); setLoading(false); return }
    // Capture-at-report loop: if this parent just took the logged-out diagnostic, save that result
    // against the child they're creating now — but ONLY when the bands match (a 9–11 plan is
    // meaningless on a 3–5 learner). PEEK first, then CONSUME only on a match: a mismatch must leave
    // the capture stashed so it can still attach to the diagnosed child if they add a sibling first.
    const pending = peekPendingDiagnostic()
    if (pending && pending.band === learner.age_group) {
      takePendingDiagnostic()   // confirmed match → consume it (one-shot; never replays twice)
      // Durable-first: enqueue (survives a failed post-signup write) then flush. Reuses the stashed
      // clientId so the idempotent RPC won't double-write if a signed-in save ever also lands.
      enqueueDiagnostic({
        learnerId: learner.id, band: pending.band, rootGap: pending.rootGap, secondGap: pending.secondGap,
        blocked: pending.blocked, strengths: pending.strengths, workingLevel: pending.workingLevel,
        planSkills: pending.planSkills, planChapters: pending.planChapters, items: pending.items,
        clientId: pending.clientId,
      })
      void flushDiagnosticQueue()
      markCheckupDone(learner.id)   // replayed checkup → this new child passes the play gate
      setActivePlan(learner.id, pending.band, pending.planChapters)   // step 7: walkable plan for the new child
    }

    /**
     * ⚠️ AND THE SAME LOOP FOR THE DEMO. A parent who played two chapters before signing up must not
     * find nothing here — no stars, and a plan whose first step is the chapter their child just
     * finished. That is worse than never having played: we showed them the product and took it away
     * at the moment they committed.
     *
     * ⚠️ THE DIAGNOSTIC OUTRANKS THE DEMO FOR THE PLAN. A diagnosed plan is one somebody looked for;
     * a grade-start plan is the band from the top. So the demo claims the plan only when the pending
     * diagnostic did not — but its SESSIONS are adopted either way, because the child played them.
     */
    const claimedByDiagnostic = !!(pending && pending.band === learner.age_group)
    const adopted = adoptDemoRun(
      learner.id, learner.age_group as AgeGroup, !claimedByDiagnostic,
      {
        enqueueSession: p => enqueueSession({ ...p, chapter: p.chapter as ChapterType }),
        score: (c, w, m) => scoreChapter(c, w, m),
        plan: chapters => { setActivePlan(learner.id, learner.age_group ?? '3-5', chapters, 'gradeStart') },
        advance: chapter => { advancePlan(learner.id, chapter) },
        newId: () => crypto.randomUUID(),
      },
    )
    if (adopted) {
      void flushQueue()
      track('demo_adopted', { chapters: adopted.adopted, planSet: adopted.planSet, band: learner.age_group })
    }
    onAdded()
  }

  /* ⚠️ ONE COMPONENT, TWO SHAPES, DECIDED IN CSS — a bottom sheet under 768px (thumb reach on a
     phone) and a centred dialog above it. Rendering the sheet shape on a 1280px frame put a
     480px-wide form flush against the bottom edge of a mostly-empty screen. `.sheet-wrap` /
     `.sheet-card` carry the switch, including the two entrance animations and the
     `prefers-reduced-motion` opt-out. */
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label="Add a learner" style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(61,37,22,0.45)' }} onClick={onClose}>
      <div className="sheet-card" style={{ background:P.card, padding:'28px 24px 40px', overflowY:'auto', WebkitOverflowScrolling:'touch', boxSizing:'border-box' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize:20, fontWeight:800, margin:'0 0 4px', color:P.ink, fontFamily:'var(--font-display)' }}>Add a learner</h3>
        <p style={{ fontSize:13, color:P.ink2, margin:'0 0 18px', lineHeight:1.45 }}>Quiet, private progress tracking for home or class.</p>
        <div style={{ display:'flex', gap:12, marginBottom:20, justifyContent:'center' }}>
          {AVATARS.map((emoji, i) => (
            <button key={i} onClick={() => setAvatarIndex(i)} aria-pressed={avatarIndex===i} aria-label={`Avatar ${i + 1}`} style={{ position:'relative', width:64, height:64, fontSize:32, borderRadius:16, cursor:'pointer', background:avatarIndex===i?'var(--milo-orange-soft)':P.page, border:avatarIndex===i?`3px solid ${P.accent}`:`2px solid ${P.edge}`, transition:'border-color 0.15s, background 0.15s' }}>
              {emoji}
              {avatarIndex===i && (
                <span aria-hidden="true" style={{ position:'absolute', top:-4, right:-4, width:20, height:20, borderRadius:'50%', background:P.accent, color:'#fff', fontSize:11, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>✓</span>
              )}
            </button>
          ))}
        </div>
        <label htmlFor="learner-name" style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink2, margin:'0 0 6px' }}>Child&apos;s name</label>
        <input id="learner-name" type="text" placeholder="First name is plenty" value={name} onChange={e => { setName(e.target.value); setError(null) }} onKeyDown={e => e.key === 'Enter' && handleAdd()} maxLength={30} autoFocus style={{ width:'100%', padding:'14px 16px', minHeight:44, fontSize:16, fontWeight:600, color:P.ink, background:P.page, border:`2px solid ${error?'#F0B4AE':P.edge}`, borderRadius:14, outline:'none', boxSizing:'border-box', marginBottom:6 }} />
        {error && <p role="alert" style={{ fontSize:13, color:'#93000A', fontWeight:600, margin:'0 0 12px' }}>{error}</p>}

        <p style={{ fontSize:13, fontWeight:700, color:P.ink2, margin:'10px 0 8px' }}>Which modules can they see?</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <ModuleChecklist grade={grade} setGrade={setGrade} pick={pick} setPick={setPick} />
        </div>

        <p style={{ fontSize:11.5, color:P.ink3, margin:'14px 0 0', lineHeight:1.45 }}>
          Progress is private to this account. No public profiles and no comparisons with other children.
        </p>
        <button onClick={handleAdd} disabled={loading} style={{ width:'100%', padding:'16px', minHeight:44, marginTop:12, background:loading?P.edge:P.accent, color:loading?P.ink3:'#fff', border:'none', borderRadius:50, fontSize:17, fontWeight:800, cursor:loading?'wait':'pointer', boxShadow:loading?'none':'0 4px 14px rgba(242,107,44,0.28)' }}>
          {loading ? 'Adding...' : pick.size ? `Add learner with ${pick.size} module${pick.size === 1 ? '' : 's'}` : 'Add learner'}
        </button>
      </div>
    </div>
  )
}