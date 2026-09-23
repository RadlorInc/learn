'use client'
/**
 * Billing reads. The data layer is the only place that talks to Supabase.
 *
 * ⚠️⚠️ THERE IS EXACTLY ONE DEFINITION OF "MAY THIS BE RECORDED", AND IT IS IN THE DATABASE.
 * `is_chapter_entitled` is already called from three places — the `sessions` INSERT policy, the
 * `learner_progress` WITH CHECK and inside `sync_session` — precisely so that two guards cannot
 * diverge. A TypeScript copy of the same rules would be a FOURTH guard, and it would disagree
 * silently in the worst direction: letting a child into a chapter the database will then refuse to
 * save, which is a run of work thrown away with nothing on screen saying why.
 *
 * So this asks. It does not decide.
 */
import { db } from '@/data/repositories/_shared'

/**
 * `true` / `false` from the database, or **`null` when we could not find out** — a lost network, a
 * signed-out session, an RPC that errored.
 *
 * ⚠️ NULL IS NOT FALSE, AND THE CALLER MUST NOT TREAT IT AS FALSE. The verdict is a UX gate over a
 * database that already refuses the write; locking a child out of a chapter because their wifi
 * dropped is a real harm, and letting one in costs a session row that `sync_session` will reject
 * anyway. `billing_config` fails open for the same reason and the camera guard fails closed for the
 * opposite one — different failure costs, different defaults.
 */
export async function isChapterEntitled(learnerId: string, chapter: string): Promise<boolean | null> {
  try {
    const { data, error } = await db().rpc('is_chapter_entitled', {
      p_learner_id: learnerId,
      p_chapter: chapter,
    })
    if (error) return null
    return typeof data === 'boolean' ? data : null
  } catch {
    return null
  }
}

/** The same question for a handful of chapters at once — the parent dashboard's scoped list, which
 *  is about a dozen. Still one definition, asked N times; deriving the set locally is the thing
 *  §1 of docs/billing-stage-3.md forbids. */
export async function entitledChapters(
  learnerId: string, chapters: string[],
): Promise<Record<string, boolean | null>> {
  const verdicts = await Promise.all(chapters.map(c => isChapterEntitled(learnerId, c)))
  return Object.fromEntries(chapters.map((c, i) => [c, verdicts[i]]))
}

export interface MySubscription {
  status: string
  seats_paid: number
  current_period_end: string | null
  cancel_at_period_end: boolean
}

/** This account's subscription row (RLS: owner can read), `null` when there is none, `undefined`
 *  when we could not find out — the screen must not say "no subscription" because the wifi dropped. */
export async function getMySubscription(): Promise<MySubscription | null | undefined> {
  try {
    const { data, error } = await db().from('subscriptions')
      .select('status,seats_paid,current_period_end,cancel_at_period_end').maybeSingle()
    return error ? undefined : (data ?? null)
  } catch { return undefined }
}

export type CancelResult =
  | { ok: true; current_period_end: string | null; emailed: boolean }
  | { ok: false; error: 'no_subscription' | 'billing_not_configured' | 'unauthenticated' | 'failed' }

/** Asks /api/billing/cancel. Sends no subscription id: the server finds it from the token. */
export async function cancelMySubscription(): Promise<CancelResult> {
  const { data: { session } } = await db().auth.getSession()
  if (!session) return { ok: false, error: 'unauthenticated' }
  try {
    const r = await fetch('/api/billing/cancel', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } })
    const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string; current_period_end?: string | null; emailed?: boolean } | null
    if (r.ok && j?.ok) return { ok: true, current_period_end: j.current_period_end ?? null, emailed: !!j.emailed }
    const e = j?.error
    return { ok: false, error: e === 'no_subscription' || e === 'billing_not_configured' || e === 'unauthenticated' ? e : 'failed' }
  } catch { return { ok: false, error: 'failed' } }
}
