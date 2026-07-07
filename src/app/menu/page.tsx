'use client'
export const dynamic = 'force-static'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMiloStore, type ChapterType } from '@/state/store'
import { CHAPTER_NAMES, CHAPTER_EMOJIS, chaptersForAge, type AgeGroup } from '@/core/chapters'
import { useMiloSpeaker } from '@/infra/useMiloSpeaker'
import BackButton from '@/shared/ui/BackButton'
import ChapterPicker from '@/shared/ui/ChapterPicker'
import PWAInstallBanner from '@/shared/ui/PWAInstallBanner'
import { getActiveLearner, clearActiveLearner } from '@/data/supabase/useLearnerSession'
import { useAuthGuard } from '@/data/supabase/useAuthGuard'
import { getLearnerBootstrap, saveLearnerState, getGradeChapterIds } from '@/data/repositories'
import type { LearnerState } from '@/data/supabase/types'
import { getLastPlayed, setLastPlayed, reconcileLastPlayed } from '@/infra/storage/lastPlayed'
import { track } from '@/infra/analytics'
import { currentPlanChapter, planProgress } from '@/infra/storage/activePlan'

const AVATAR_SRCS = ['/assets/objects/fox.png','/assets/objects/bunny.png','/assets/objects/bear.png','/assets/objects/cat.png']
const LEVEL_NAMES   = ['Beginner','Counter','Explorer','Number Star','Math Wizard','Champion',"Milo's Champion",'Legend']

// True when this device's shop state equals what's on the server, so we can skip
// the write-back on a plain menu visit. (After applyServerProgress merges the
// server in, local is always a superset, so equality means "nothing new here".)
function shopStateMatchesServer(
  p: { coinsSpent: number; ownedItems: string[]; equippedItems: Record<string, string> },
  state: LearnerState | null,
): boolean {
  if (!state) {
    return p.coinsSpent === 0 && p.ownedItems.length === 0 && Object.keys(p.equippedItems).length === 0
  }
  if ((state.coins_spent ?? 0) !== (p.coinsSpent ?? 0)) return false
  const owned = [...p.ownedItems].sort()
  const sOwned = [...(state.owned_items ?? [])].sort()
  if (owned.length !== sOwned.length || owned.some((x, i) => x !== sOwned[i])) return false
  const pe = p.equippedItems ?? {}
  const se = state.equipped_items ?? {}
  const keys = new Set([...Object.keys(pe), ...Object.keys(se)])
  for (const k of keys) if (pe[k] !== se[k]) return false
  return true
}

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
  const { profile, startChapter, loadLearner, applyServerProgress } = useMiloStore()
  const { speak } = useMiloSpeaker()
  const [showPicker,   setShowPicker]   = useState(false)
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
    setPlanNext(ch && prog && CHAPTER_NAMES[ch as ChapterType] ? { ch: ch as ChapterType, step: Math.min(prog.done + 1, prog.total), total: prog.total } : null)
  }, [learnerId])

  useEffect(() => {
    const learner = getActiveLearner()

    if (learner) {
      loadLearner(learner.id, learner.display_name, learner.avatar_index)
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

          const { stats, progress, state } = boot.data
          applyServerProgress(stats, progress, state)

          // Continue-where-you-left-off, cross-device: progress is ordered by
          // last_played_at desc, so progress[0] is the most recently played
          // chapter on ANY device. Adopt it if it's newer than this device's
          // local open, so "Continue" follows the learner between devices.
          const top = progress[0]
          const resolved = reconcileLastPlayed(learner.id, top?.chapter as ChapterType | undefined, top?.last_played_at)
          if (resolved) setLastPlayedState(resolved)

          // Push shop state back ONLY when this device has something the server
          // doesn't (offline purchases, etc.). applyServerProgress merges the
          // server in monotonically, so equal state means a plain menu visit —
          // no write needed, no needless mobile request.
          const p = useMiloStore.getState().profile
          if (!shopStateMatchesServer(p, state)) {
            await saveLearnerState(learner.id, {
              coinsSpent:    p.coinsSpent,
              ownedItems:    p.ownedItems,
              equippedItems: p.equippedItems,
            })
          }
        } catch { /* offline / transient — local profile stands until next online load */ }
      })()

      // Personalised greeting — but only ONCE per app load. Returning to the menu
      // from a chapter remounts this component; without the guard it re-greeted every
      // time. Speak only the first time we see this learner this session.
      if (!_greeted.has(learner.id)) {
        _greeted.add(learner.id)
        const ids = chaptersForAge(learner.age_group ?? '3-5').map(c => c.id)
        const doneCount = ids.filter(ch => (profile.chapterStars[ch] ?? 0) > 0).length
        if (lp && doneCount > 0) {
          speak(`Welcome back, ${learner.display_name}! Ready to continue ${CHAPTER_NAMES[lp]}?`)
        } else {
          speak(`Welcome, ${learner.display_name}! Which chapter do you want to play?`)
        }
      }
      return
    }

    if (profile.hasCompletedSetup) {
      setReady(true)
      return
    }

    router.replace('/parent')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const levelName   = LEVEL_NAMES[Math.min(profile.currentLevel - 1, LEVEL_NAMES.length - 1)]
  const avatarSrc = AVATAR_SRCS[profile.avatarIndex] ?? AVATAR_SRCS[0]
  const childName   = profile.childName

  // Next unplayed chapter
  const nextChapter = chapterIds.find(ch => (profile.chapterStars[ch] ?? 0) === 0)
    ?? chapterIds[chapterIds.length - 1]

  const doneCount = chapterIds.filter(ch => (profile.chapterStars[ch] ?? 0) > 0).length
  const allDone   = doneCount === chapterIds.length

  // Resume chapter = last played if different from next, else null
  const resumeChapter: ChapterType | null = (
    lastPlayed && lastPlayed !== nextChapter && !allDone
  ) ? lastPlayed : null

  function playChapter(chapter: ChapterType) {
    if (learnerId) setLastPlayed(learnerId, chapter)
    speak(`Let's play ${CHAPTER_NAMES[chapter]}!`)
    startChapter(chapter)
    router.push('/game')
  }

  function handleResume() { if (resumeChapter) playChapter(resumeChapter) }

  if (authed === 'checking' || !ready) return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#FCEAB6', fontSize: 48,
    }}>🦊</div>
  )

  const resumeStars = resumeChapter ? (profile.chapterStars[resumeChapter] ?? 0) : 0

  return (
    <div className="kit-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="kit-cloud" style={{ width: 140, height: 56, top: 40,  left: 60 }} />
      <div className="kit-cloud" style={{ width: 100, height: 38, top: 110, left: 240 }} />
      <div className="kit-cloud" style={{ width: 110, height: 42, top: 50,  right: 200 }} />

      {/* Topbar: Chapters · Level (top-left) + Wallet · Profile / Shop / Switch (top-right) */}
      <div className="kit-topbar" style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="milo-btn tone-purple size-sm" onClick={() => setShowPicker(true)}>📚 Chapters</button>
          <span className="milo-chip tone-blue">
            Level {profile.currentLevel} · {levelName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="milo-chip tone-yellow" title="Wallet">
            👛 <span className="numeric">{profile.totalCoins}</span>&nbsp;Wallet
          </span>
          <button className="milo-btn tone-blue size-sm" onClick={() => router.push('/profile')} aria-label="Profile">👤</button>
          <button className="milo-btn tone-yellow size-sm" onClick={() => router.push('/shop')} aria-label="Shop">🛍</button>
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
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>Milo picked this to close the gap — a few minutes today.</div>
              </div>
              <span style={{ flexShrink: 0, whiteSpace: 'nowrap', background: '#2BB673', border: '3px solid #1e9e5f', borderRadius: 50, padding: '8px 18px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: '#fff' }}>Continue ▶</span>
            </div>
          </button>
        )}

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
                  {resumeStars > 0
                    ? `${[1,2,3].map(i => i <= resumeStars ? '⭐' : '☆').join('')} — play again to improve!`
                    : 'Not completed yet'}
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

        {/* Pick what to play from the Chapters button (top-left). Empty-state hint when nothing
            else is on screen (no plan / no resume / not the 3–5 story age). */}
        {!planNext && !resumeChapter && ageGroup !== '3-5' && (
          <button className="milo-btn tone-green size-lg" onClick={() => setShowPicker(true)}>
            📚 Choose a chapter to play
          </button>
        )}
      </div>

      {showPicker && <ChapterPicker onClose={() => setShowPicker(false)} />}
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }`}</style>
      <PWAInstallBanner />
    </div>
  )
}