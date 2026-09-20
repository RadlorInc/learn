'use client'
export const dynamic = 'force-static'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type ChapterType } from '@/core/chapters'
import { CHAPTER_NAMES, CHAPTER_EMOJIS, LEGACY_CHAPTERS_HIDDEN, chaptersForAge, type AgeGroup } from '@/core/chapters'
import { ModuleHome } from '@/features/lessons/ModuleHome'
import { useMiloSpeaker } from '@/infra/useMiloSpeaker'
import BackButton from '@/shared/ui/BackButton'
import PWAInstallBanner from '@/shared/ui/PWAInstallBanner'
import { getActiveLearner, clearActiveLearner } from '@/data/supabase/useLearnerSession'
import { useAuthGuard } from '@/data/supabase/useAuthGuard'
import { getLearnerBootstrap, getGradeChapterIds } from '@/data/repositories'
import { getLastPlayed, setLastPlayed, reconcileLastPlayed } from '@/infra/storage/lastPlayed'
import { chapterKey } from '@/core/chapters'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { pullLessonProgress } from '@/infra/storage/lessonSync'
import { track } from '@/infra/analytics'
import { currentPlanChapter, planProgress, reconcilePlan } from '@/infra/storage/activePlan'

const AVATAR_SRCS = ['/assets/objects/fox.png','/assets/objects/bunny.png','/assets/objects/bear.png','/assets/objects/cat.png']

// True when this device's shop state equals what's on the server, so we can skip
// the write-back on a plain menu visit. (After applyServerProgress merges the
// server in, local is always a superset, so equality means "nothing new here".)

// Short TTL so a menu→game→menu bounce doesn't re-run the full cross-device bootstrap (RPC +
// merge + possible write) every time. Module-scoped so it survives component remounts within a
// session; 30s is long enough to skip navigation churn, short enough to stay fresh.
const _bootAt = new Map<string, number>()
const BOOT_TTL_MS = 30_000

// Speak the welcome greeting only ONCE per app load — not on every menu→game→menu
// bounce (the component remounts each return, which re-ran the greeting). Module-scoped
// so it survives remounts within a session; a full page reload (real "app load") resets it.
// Keyed by learner id so switching to a different child still greets the new child once.
const _greeted = new Set<string>()

export default function MainMenu() {
  const router = useRouter()
  const authed = useAuthGuard()
  /**
   * ⚠️ NO PROFILE STORE ANY MORE. The zustand store held the XP / coins / stars economy and went on
   * 2026-09-20 with it; a chapter's "have they finished this" is now `lessonDone` on the SAME
   * per-topic record a new-flow lesson writes, and the child's name and avatar come from the
   * learner row, which is where they always were.
   */
  const [childName, setChildName] = useState('')
  const [avatarIndex, setAvatarIndex] = useState(0)
  const chapterDone = (id: string | null, ch: string) => lessonDone(id, chapterKey(ch))
  const { speak } = useMiloSpeaker()
  const [ready,        setReady]        = useState(false)
  const [learnerId,    setLearnerId]    = useState<string | null>(null)
  const [ageGroup,     setAgeGroup]     = useState<AgeGroup>('3-5')
  const [chapterIds,   setChapterIds]   = useState<ChapterType[]>([])
  const [lastPlayed,   setLastPlayedState] = useState<ChapterType | null>(null)
  const [planNext,     setPlanNext]     = useState<{ ch: ChapterType; step: number; total: number } | null>(null)

  // The checkup is OPTIONAL — no play gate. A child can enter the menu directly; the checkup is
  // reachable by choice from the parent dashboard ("Find starting point"), never forced.

  // Step 7: the diagnostic plan, walkable. Read the current plan chapter for this learner; the card
  // launches it via the normal play path and advances (in /game) as chapters are completed.
  useEffect(() => {
    if (!learnerId) { setPlanNext(null); return }
    const ch = currentPlanChapter(learnerId), prog = planProgress(learnerId)
    setPlanNext(ch && prog && CHAPTER_NAMES[ch as ChapterType]
      ? { ch: ch as ChapterType, step: Math.min(prog.done + 1, prog.total), total: prog.total }
      : null)
  }, [learnerId])


  useEffect(() => {
    const learner = getActiveLearner()

    if (learner) {
      setChildName(learner.display_name)
      setAvatarIndex(learner.avatar_index ?? 0)
      setLearnerId(learner.id)
      // Fall back to 3–5 for learner records cached before age_group existed.
      const band = learner.age_group ?? '3-5'
      setAgeGroup(band)
      // Show the band's chapters immediately; if the learner is in a grade,
      // refine to that grade's hand-picked subset once it loads.
      setChapterIds(chaptersForAge(band).map(c => c.id))
      if (learner.grade_id) {
        getGradeChapterIds(learner.grade_id).then(ids => {
          const fallback = chaptersForAge(band).map(c => c.id)
          const valid = ids.filter(id => fallback.includes(id))
          if (valid.length) setChapterIds(valid)
        }).catch(() => { /* keep the band fallback */ })
      }
      const lp = getLastPlayed(learner.id)?.chapter ?? null
      setLastPlayedState(lp)
      setReady(true)
      track('session_start', { ageGroup: learner.age_group ?? '3-5' })

      // Cross-device sync: pull this learner's full state from Supabase (progress,
      // coins, shop items) and merge it in, so everything shows on whatever device
      // they log in on. Then push the merged state back to reconcile the server
      // (propagates anything bought/earned offline). All merges are monotonic.
      ;(async () => {
        try {
          // Offline: local profile stands; nothing to pull/push.
          if (!navigator.onLine) return

          // Skip the bootstrap round trip if we synced this learner very recently (navigation churn).
          const lastBoot = _bootAt.get(learner.id) ?? 0
          if (Date.now() - lastBoot < BOOT_TTL_MS) return

          // One round trip pulls access role + stats + progress + shop state.
          const boot = await getLearnerBootstrap(learner.id)
          // Not signed in yet / transient — leave the active learner untouched.
          if (boot.status === 'no-auth') return
          // Signed in but no access → stale or foreign active learner. Clear it
          // and bounce to the picker (stops the FK/RLS sync errors at the source).
          if (boot.status === 'no-access') { clearActiveLearner(); router.replace('/parent'); return }

          // Successful sync — mark fresh so quick re-mounts within the TTL skip the round trip.
          _bootAt.set(learner.id, Date.now())

          const { progress } = boot.data
          // ⚠️ NOTHING IS MERGED FROM `learner_stats` / `learner_state` ANY MORE. They held the XP,
          // coins and shop state, deleted 2026-09-20; a chapter's standing and done-flag follow the
          // account through `lesson_progress`, pulled by `pullLessonProgress` like a topic's.
          void pullLessonProgress(learner.id, chaptersForAge(band).map(c => chapterKey(c.id)))

          /**
           * ⚠️ THE PLAN POINTER, RECONCILED ACROSS DEVICES. It lives in localStorage, so before
           * this a parent who ran the check on their phone and handed the child a tablet got NO
           * plan card at all — the diagnostic's entire output existed only on the device that
           * produced it.
           *
           * Derived rather than synced: the chapter sequence is already on the server and
           * `progress` (right here, already fetched) says which chapters have been played, so the
           * position is a function of data we hold. No second write path to disagree with the
           * first. Monotonic — it can only move forward. Best-effort: a failure leaves the local
           * pointer exactly as it was.
           */
          /**
           * ⚠️⚠️ THE POINTER IS DERIVED ON EVERY LOAD, ONLINE OR NOT — AND THE OFFLINE HALF IS A FIX,
           * NOT TIDYING. `setActivePlan` writes `index: 0`, so a child who re-runs the check (their
           * own door is on this screen now) walks out of the diagnostic pointing at chapter 1 of the
           * new plan, and it is THIS reconcile that pulls the pointer past what they have already
           * finished. If it is skipped because the bootstrap threw — offline, an expired token — the
           * menu shows "Next up" as a chapter the child completed weeks ago. Their stars and progress
           * are untouched and the next successful load corrects it, but the one screen they are
           * looking at is wrong, which is the screen that matters.
           *
           * So the evidence degrades instead of the feature: server progress when we have it, and
           * the local profile's own stars when we do not. `chapterStars > 0` is the local equivalent
           * of the server's `total_sessions > 0` — `calcStars` never returns less than 1, so any
           * chapter that has been finished once carries at least one star on this device.
           *
           * ⚠️ A genuinely fresh device has neither, and then the plan opens at its first chapter —
           * correct, because nothing known says otherwise.
           */
          const applyPlan = (played: string[], remote: string[]) => {
            const plan = reconcilePlan(learner.id, remote, played)
            if (!plan) return
            const ch = currentPlanChapter(learner.id), prog = planProgress(learner.id)
            setPlanNext(ch && prog && CHAPTER_NAMES[ch as ChapterType]
              ? { ch: ch as ChapterType, step: Math.min(prog.done + 1, prog.total), total: prog.total }
              : null)
          }
          // ⚠️ `remote: []` since the check was deleted (2026-09-20): `diagnostic_plans` was the
          // only remote plan source, so `reconcilePlan` now derives the POSITION from played
          // chapters and keeps the local grade-start chapter list.
          applyPlan(progress.filter(p => (p.total_sessions ?? 0) > 0).map(p => p.chapter as string), [])

          // Continue-where-you-left-off, cross-device: progress is ordered by
          // last_played_at desc, so progress[0] is the most recently played
          // chapter on ANY device. Adopt it if it's newer than this device's
          // local open, so "Continue" follows the learner between devices.
          const top = progress[0]
          const resolved = reconcileLastPlayed(learner.id, top?.chapter as ChapterType | undefined, top?.last_played_at)
          if (resolved) setLastPlayedState(resolved)

        } catch { /* offline / transient — local profile stands until next online load */ }
      })()

      // Personalised greeting — but only ONCE per app load. Returning to the menu
      // from a chapter remounts this component; without the guard it re-greeted every
      // time. Speak only the first time we see this learner this session.
      if (!_greeted.has(learner.id)) {
        _greeted.add(learner.id)
        const ids = chaptersForAge(learner.age_group ?? '3-5').map(c => c.id)
        const doneCount = ids.filter(ch => chapterDone(learner.id, ch)).length
        if (lp && doneCount > 0) {
          speak(`Welcome back, ${learner.display_name}! Ready to continue ${CHAPTER_NAMES[lp]}?`)
        } else {
          speak(`Welcome, ${learner.display_name}! Which chapter do you want to play?`)
        }
      }
      return
    }

    router.replace('/parent')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const avatarSrc = AVATAR_SRCS[avatarIndex] ?? AVATAR_SRCS[0]

  // Next unplayed chapter
  const nextChapter = chapterIds.find(ch => !chapterDone(learnerId, ch))
    ?? chapterIds[chapterIds.length - 1]

  const doneCount = chapterIds.filter(ch => chapterDone(learnerId, ch)).length
  const allDone   = doneCount === chapterIds.length

  // Resume chapter = last played if different from next, else null
  const resumeChapter: ChapterType | null = (
    lastPlayed && lastPlayed !== nextChapter && !allDone
  ) ? lastPlayed : null

  function playChapter(chapter: ChapterType) {
    if (learnerId) setLastPlayed(learnerId, chapter)
    speak(`Let's play ${CHAPTER_NAMES[chapter]}!`)
    router.push(`/game?c=${chapter}`)
  }

  function handleResume() { if (resumeChapter) playChapter(resumeChapter) }

  if (authed === 'checking' || !ready) return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#FCEAB6', fontSize: 48,
    }}>🦊</div>
  )

  // Every card below (plan, resume, story, check door, picker) opens a legacy chapter, so while they
  // are hidden the child's home is the new-flow topic list instead.
  if (LEGACY_CHAPTERS_HIDDEN) return <ModuleHome learnerId={learnerId} lessonIds={getActiveLearner()?.lesson_ids} back={{ href: '/parent', label: '← Switch' }} />



  return (
    <div className="kit-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="kit-cloud" style={{ width: 140, height: 56, top: 40,  left: 60 }} />
      <div className="kit-cloud" style={{ width: 100, height: 38, top: 110, left: 240 }} />
      <div className="kit-cloud" style={{ width: 110, height: 42, top: 50,  right: 200 }} />

      {/* Topbar: Chapters · Level (top-left) + Wallet · Profile / Shop / Switch (top-right) */}
      <div className="kit-topbar" style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <BackButton href='/parent' label='← Switch' size='sm' />
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '70px 32px 0', position: 'relative', zIndex: 2,
        gap: 18,
      }}>
        {/* Avatar + greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 4 }}>
          <div style={{
            width: 90, height: 90, borderRadius: 22,
            background: 'var(--milo-orange-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid var(--milo-orange)',
            overflow: 'hidden',
          }}>
            <img
              src={avatarSrc}
              alt="avatar"
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display='none' }}
            />
          </div>
          <div>
            <div className="kit-wordmark" style={{ fontSize: 48, whiteSpace: 'nowrap' }}>
              Hi, {childName}!
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 20, color: 'var(--ink-soft)', marginTop: 2,
            }}>
              {doneCount > 0 ? `${doneCount} / ${chapterIds.length} chapters done` : 'Ready to play?'}
            </div>
          </div>
        </div>

        {/* ── Your plan — walk the diagnostic's arranged chapters, foundational-first ── */}
        {planNext && (
          <button onClick={() => playChapter(planNext.ch)} className="milo-card" style={{
            width: '100%', maxWidth: 700, padding: '14px 20px', textAlign: 'left', cursor: 'pointer',
            background: 'linear-gradient(135deg, #E7F7EF 0%, #fff 100%)', border: '3px solid #2BB673',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', rowGap: 10 }}>
              <div style={{ fontSize: 36 }}>🎯</div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e9e5f', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Your plan · step {planNext.step} of {planNext.total}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>Next: {CHAPTER_NAMES[planNext.ch]}</div>
                {/* ⚠️ EVERY PLAN IS A GRADE-START PLAN NOW — the check that produced a diagnosed
                    one was deleted 2026-09-20 — so this may not claim a gap. "Milo picked this to
                    close the gap" would be a straight falsehood. Same rule as the report's
                    never-say-"on track". */}
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {chapterDone(learnerId, planNext.ch)
                    ? "You've played this one — a quick second go, then something new."
                    : 'Starting from the beginning — Milo adjusts as they play.'}
                </div>
              </div>
              <span style={{ flexShrink: 0, whiteSpace: 'nowrap', background: '#2BB673', border: '3px solid #1e9e5f', borderRadius: 50, padding: '8px 18px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: '#fff' }}>Continue ▶</span>
            </div>
          </button>
        )}

        {/**
          * ── The check, offered a second and FINAL time ──────────────────────────────────────
          *
          * ⚠️ ONCE. A parent who skipped at signup has now watched their child finish a chapter and
          * enjoy it, so the ask finally has evidence behind it — but an offer that keeps returning
          * is not an offer, it is nagging with a dismiss button, and it teaches people to ignore
          * the surface it lives on. The second "Not now" retires it to the parent dashboard's
          * "Find starting point", which is always there and never interrupts.
          *
          * ⚠️ IT IS A CARD, NOT A MODAL. It sits BELOW the plan, so the child's next chapter is
          * still the first thing on screen. Anything that covers the play button to ask a parent a
          * question has made the product worse for the child in order to sell to the adult.
          */}
        {/* ── Story Mode — the 3–5 storyline adventure ── */}
        {ageGroup === '3-5' && (
          <button onClick={() => router.push('/story')} className="milo-card" style={{
            width: '100%', maxWidth: 700, padding: '14px 20px', textAlign: 'left', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--milo-orange-soft) 0%, #fff 100%)',
            border: '3px solid var(--milo-orange)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', rowGap: 10 }}>
              <div style={{ fontSize: 36 }}>🦊</div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--milo-orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Story Mode</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>Go on an adventure with Milo!</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>Milo&apos;s Picnic Party — count, knock, share &amp; more</div>
              </div>
              <span style={{ flexShrink: 0, whiteSpace: 'nowrap', background: 'var(--milo-orange)', border: '3px solid var(--milo-orange-deep)', borderRadius: 50, padding: '8px 18px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: '#fff' }}>Play ▶</span>
            </div>
          </button>
        )}

        {/* ── Resume card — shown when child has a chapter in progress ── */}
        {resumeChapter && (
          <div className="milo-card" style={{
            width: '100%', maxWidth: 700,
            padding: '14px 20px',
            background: 'linear-gradient(135deg, var(--milo-orange-soft) 0%, #fff 100%)',
            border: '3px solid var(--milo-orange)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', rowGap: 10 }}>
              <div style={{ fontSize: 36 }}>{CHAPTER_EMOJIS[resumeChapter]}</div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--milo-orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                  Continue where you left off
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>
                  {CHAPTER_NAMES[resumeChapter]}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {chapterDone(learnerId, resumeChapter) ? 'Played — go again any time' : 'Not finished yet'}
                </div>
              </div>
              <button
                className="milo-btn tone-green"
                onClick={handleResume}
                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                ▶ Continue
              </button>
            </div>
          </div>
        )}

        {/* ⚠️ The chapter PICKER went with the star economy (2026-09-20) — it drew a star count per
            chapter and read it out of the deleted store. With no plan and no resume there is now
            nothing to pick from here, so the empty state points at the one screen that does. */}
        {!planNext && !resumeChapter && ageGroup !== '3-5' && (
          <button className="milo-btn tone-green size-lg" onClick={() => router.push('/modules')}>
            📚 Choose something to learn
          </button>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }`}</style>
      <PWAInstallBanner />
    </div>
  )
}