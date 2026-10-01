'use client'
/**
 * Billing reads. The data layer is the only place that talks to Supabase.
 *
 * ⚠️⚠️ THERE IS EXACTLY ONE DEFINITION OF "MAY THIS CHILD OPEN THIS", AND IT IS IN THE DATABASE
 * (`claim_topic`, which also counts the family's two free topics). A TypeScript copy of the rules would disagree
 * silently — and the count of two must be taken in one place, under one lock, or two siblings both get "the last" slot.
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

/**
 * The free trial's entry question (20261001120000 `claim_topic`): may this child open this topic — a lesson id, a
 * `c:<chapter>` or a module id (its mixed practice)? The database records it as one of the family's two free topics
 * when a slot is left. Same answer shape as above: `null` = could not find out (→ the gate lets them in).
 */
export async function claimTopic(learnerId: string, topic: string): Promise<boolean | null> {
  try {
    const { data, error } = await db().rpc('claim_topic' as never, { p_learner_id: learnerId, p_topic: topic } as never)
    if (error) return null
    return typeof data === 'boolean' ? data : null
  } catch {
    return null
  }
}

/** The family's free topics so far (owner reads own rows), or `null` when we could not find out. */
export async function myFreeTopics(): Promise<string[] | null> {
  try {
    const { data, error } = await db().from('free_topics' as never).select('topic')
    if (error || !Array.isArray(data)) return null
    return (data as { topic: string }[]).map(r => r.topic)
  } catch {
    return null
  }
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
