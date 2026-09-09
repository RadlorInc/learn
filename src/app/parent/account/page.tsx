'use client'
/**
 * /parent/account — closing the account, and the only path to it.
 *
 * ⚠️⚠️ THE THREAT MODEL HERE IS A SEVEN-YEAR-OLD ON A PARENT'S SIGNED-IN DEVICE, not a careless
 * adult. That is what decides the shape of this page, and it is why the destructive control is not
 * a button behind one confirm:
 *
 *   1. IT IS NOT WHERE A CHILD IS. Everything a child touches lives under /game, /menu and /shop.
 *      This is on the parent side, under a small text link at the bottom of the dashboard — past
 *      the learners, past the progress, past the support panel. A child exploring the app does not
 *      arrive here, because nothing on their side links to anything under /parent.
 *   2. IT NEEDS THE PARENT'S EMAIL TYPED EXACTLY, checked server-side against the address on the
 *      TOKEN — never against a value this page posts.
 *   3. IT NEEDS A TOKEN LESS THAN TEN MINUTES OLD. This is the one that actually stops a child: a
 *      family device carries a session that is hours or days old, so the delete is refused however
 *      correctly the box is filled in. Getting a fresher token means signing in again, which needs
 *      the parent's password or their Google account. See the migration for why token age rather
 *      than a password prompt (half these accounts have no password) or an emailed code (no
 *      verified sender).
 *
 * ⚠️ THE EXPORT IS OFFERED FIRST AND IT IS PER CHILD, because that is where the data is. A parent
 * who deletes without taking a copy has lost it — there is no soft delete and no grace window, by
 * design — so the download sits above the confirm rather than beside it.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMyLearners, getLearnerStats, getLearnerProgress, getRecentSessions, deleteMyAccount, signOut } from '@/data/repositories'
import { getCurrentSession } from '@/data/auth'
import { DataRights } from '@/shared/ui/DataRights'
import { SURVIVORS, HELD_ELSEWHERE } from '@/core/accountDeletion'
import type { Learner, LearnerStats, LearnerProgress, Session } from '@/data/supabase/types'

interface Owned { learner: Learner; stats: LearnerStats | null; progress: LearnerProgress[]; sessions: Session[] }

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [owned, setOwned] = useState<Owned[]>([])
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [stale, setStale] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession()
      if (!session) { router.replace('/auth'); return }
      setEmail(session.user.email ?? null)
      const learners = await getMyLearners()
      // Only children this account OWNS are deleted. One it was invited to view belongs to
      // somebody else and survives; the invitation is what goes.
      const mine = learners.filter(l => l.created_by === session.user.id)
      setOwned(await Promise.all(mine.map(async learner => ({
        learner,
        stats:    await getLearnerStats(learner.id),
        progress: await getLearnerProgress(learner.id),
        sessions: await getRecentSessions(learner.id),
      }))))
    })()
  }, [router])

  async function confirmDelete() {
    setBusy(true); setError(null)
    const out = await deleteMyAccount(typed)
    setBusy(false)
    if (out.ok) { setDone(out.deleted); return }
    if (out.reason === 'reauth_required') { setStale(true); return }
    setError(
      out.reason === 'confirm_mismatch' ? 'That is not the email address on this account. Nothing has been deleted.'
      : out.reason === 'not_signed_in'  ? 'You are signed out. Nothing has been deleted.'
      // ⚠️ A HONEST MESSAGE AND A SECOND DOOR, not a shrug. If the function is not in the database
      // yet the promise still stands — it is just being kept by a person instead of a button.
      : out.reason === 'not_deployed'   ? 'Account deletion is not switched on yet. Nothing has been deleted — '
                                        + 'email support@radlor.com and we will delete it for you.'
      : `Something went wrong and nothing has been deleted. ${out.detail}`,
    )
  }

  if (done) {
    return (
      <Shell title="Your account is deleted">
        <p style={p}>
          Everything is gone — {done.learners ?? 0} child {(done.learners ?? 0) === 1 ? 'profile' : 'profiles'} and
          all of their work. There is nothing to restore and nothing left for us to look up.
        </p>
        <p style={p}>Thank you for trying Milo.</p>
        <button style={{ ...btn, background: '#F26B2C', color: '#fff', border: 'none' }}
          onClick={async () => { await signOut(); router.replace('/') }}>Close</button>
      </Shell>
    )
  }

  const match = !!email && typed.trim().toLowerCase() === email.toLowerCase()

  return (
    <Shell title="Close your account">
      <Link href="/parent" style={{ fontSize: 13, fontWeight: 700, color: '#8a7a63', textDecoration: 'none' }}>← Back to the dashboard</Link>

      <p style={{ ...p, marginTop: 14 }}>
        Deleting your account removes it and <strong>every child profile you created</strong>, with all of
        their progress, sessions, placement checks and activity — permanently, straight away.
        There is no grace period and nothing kept in case you change your mind.
      </p>

      {/* ⚠️ THE EXPORT, ABOVE THE CONFIRM. Once this is done there is nothing to come back for. */}
      <h2 style={h2}>First — take a copy, if you want one</h2>
      {owned.length === 0
        ? <p style={p}>There are no child profiles on this account.</p>
        : owned.map(o => (
            <DataRights key={o.learner.id} name={o.learner.display_name} learnerId={o.learner.id}
              bundle={{ learner: o.learner, stats: o.stats, progress: o.progress, sessions: o.sessions }} />
          ))}

      {/* ⚠️ RENDERED FROM THE DECLARATION, NOT RETYPED. `SURVIVORS` is the same list the gate
          asserts the delete actually leaves behind, so this paragraph cannot claim one thing while
          the database does another — which is the exact defect that made §11 false to begin with. */}
      <h2 style={h2}>What is kept, and why</h2>
      {SURVIVORS.map(s => (
        <p key={s.table} style={p}>
          We keep <strong>{s.what}</strong> — {s.why}
        </p>
      ))}
      {HELD_ELSEWHERE.map(h => (
        <p key={h.who} style={p}>
          <strong>{h.who}</strong> keeps {h.what}. {h.why}
        </p>
      ))}

      <h2 style={h2}>Then — confirm</h2>
      {stale ? (
        <div style={warn}>
          <p style={{ ...p, color: '#991B1B', margin: 0 }}>
            <strong>Please sign in again first.</strong> Deleting an account needs a fresh sign-in, so
            that it cannot be done by someone who simply picked up an unlocked device. Nothing has been
            deleted.
          </p>
          <button style={{ ...btn, marginTop: 12 }} onClick={async () => { await signOut(); router.replace('/auth') }}>
            Sign in again
          </button>
        </div>
      ) : (
        <>
          <p style={p}>
            Type <strong>{email ?? 'your email address'}</strong> to confirm. You may be asked to sign in
            again — that is deliberate.
          </p>
          <input
            value={typed} onChange={e => { setTyped(e.target.value); setError(null) }}
            placeholder="your email address" autoComplete="off" spellCheck={false}
            aria-label="Type your email address to confirm deletion"
            style={{ width: '100%', maxWidth: 380, minHeight: 44, padding: '0 14px', fontSize: 16,
                     border: '2px solid #e5e7eb', borderRadius: 12, boxSizing: 'border-box' }}
          />
          {error && <p style={{ ...p, color: '#DC2626', fontWeight: 700 }}>{error}</p>}
          <div>
            <button onClick={confirmDelete} disabled={!match || busy}
              style={{ ...btn, marginTop: 14, background: match ? '#DC2626' : '#f3f4f6',
                       color: match ? '#fff' : '#9ca3af', border: 'none',
                       cursor: match && !busy ? 'pointer' : 'default' }}>
              {busy ? 'Deleting…' : 'Delete my account and all its data'}
            </button>
          </div>
        </>
      )}
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100dvh', background: '#FCEAB6', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, margin: '0 0 10px', color: '#3c2a14' }}>{title}</h1>
        {children}
      </div>
    </main>
  )
}

const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.6, color: '#5a4a34', margin: '0 0 14px' }
const h2: React.CSSProperties = { fontSize: 15, fontWeight: 800, color: '#3c2a14', margin: '26px 0 10px' }
const btn: React.CSSProperties = {
  minHeight: 44, padding: '0 18px', borderRadius: 999, cursor: 'pointer',
  fontWeight: 800, fontSize: 14, background: '#fff', color: '#3c2a14', border: '2px solid rgba(61,37,22,.2)',
}
const warn: React.CSSProperties = {
  background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: 14, padding: '14px 16px',
}
