'use client'
/**
 * Ask maths (docs/product/ask-maths.md), the browser side: the child's question (POST /api/ask-maths, streamed), the
 * parent's switch (set_ask_maths), the questions of the last 30 days (RLS read), forgetting them (ask_maths_forget),
 * and the add-on (addon_subscriptions read; /api/checkout/ask-maths, /api/billing/ask-maths-cancel).
 */
import { db } from '@/data/repositories/_shared'
import { parseSse, type SseEvent } from '@/features/askMaths/stream'

export type AskSettings = { enabled: boolean; daily_limit: number; consent_version: string | null; consented_at: string | null }
export type AskQuestion = { id: string; asked_at: string; question: string | null; outcome: string; script: unknown }
export type Addon = { status: string; current_period_end: string | null; cancel_at_period_end: boolean }
/** What a refusal says (the route's `error`); 'unavailable' covers everything we cannot tell apart. */
export type AskRefusal = 'off' | 'band' | 'not_entitled' | 'busy' | 'limit' | 'not_maths' | 'personal' | 'unsafe' | 'unavailable' | 'unauthenticated' | 'forbidden'
const REFUSALS: AskRefusal[] = ['off', 'band', 'not_entitled', 'busy', 'limit', 'not_maths', 'personal', 'unsafe', 'unauthenticated', 'forbidden']

async function token(): Promise<string | null> {
  const { data: { session } } = await db().auth.getSession()
  return session?.access_token ?? null
}

/** Ask. A refusal comes back at once; otherwise each server-sent event is handed to `onEvent` as it arrives. */
export async function askMaths(learnerId: string, question: string, onEvent: (e: SseEvent) => void, signal?: AbortSignal):
  Promise<{ ok: true; left: number | null } | { ok: false; error: AskRefusal }> {
  const t = await token()
  if (!t) return { ok: false, error: 'unauthenticated' }
  let r: Response
  try {
    r = await fetch('/api/ask-maths', { method: 'POST', signal, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner: learnerId, question }) })
  } catch { return { ok: false, error: 'unavailable' } }
  if (!r.ok || !r.body || !r.headers.get('content-type')?.startsWith('text/event-stream')) {
    const j = (await r.json().catch(() => null)) as { error?: string } | null
    return { ok: false, error: REFUSALS.find(k => k === j?.error) ?? 'unavailable' }
  }
  const left = Number(r.headers.get('x-ask-left'))
  const reader = r.body.getReader(), dec = new TextDecoder()
  let buf = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const cut = buf.lastIndexOf('\n\n')
      if (cut < 0) continue
      for (const e of parseSse(buf.slice(0, cut + 2))) onEvent(e)
      buf = buf.slice(cut + 2)
    }
  } catch { onEvent({ event: 'failed', data: { code: 'network' } }) }
  return { ok: true, left: Number.isFinite(left) ? left : null }
}

/** The parent's switch for this child, or null when there is none yet (or it could not be read: `undefined`). */
export async function getAskSettings(learnerId: string): Promise<AskSettings | null | undefined> {
  try {
    const { data, error } = await db().from('ask_maths_settings').select('enabled, daily_limit, consent_version, consented_at').eq('learner_id', learnerId).maybeSingle()
    return error ? undefined : (data as AskSettings | null)
  } catch { return undefined }
}

export async function setAskMaths(learnerId: string, enabled: boolean, dailyLimit: number, consentVersion: string | null):
  Promise<{ ok: true } | { ok: false; error: 'consent_required' | 'bad_limit' | 'forbidden' | 'failed' }> {
  try {
    const { data, error } = await db().rpc('set_ask_maths', { p_learner: learnerId, p_enabled: enabled, p_daily_limit: dailyLimit, p_consent_version: consentVersion })
    if (error) return { ok: false, error: error.code === '42501' ? 'forbidden' : 'failed' }
    const r = data as { ok: boolean; error?: 'consent_required' | 'bad_limit' }
    return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'failed' }
  } catch { return { ok: false, error: 'failed' } }
}

/** The last 30 days of questions, newest first (the table keeps no more). null = could not read. */
export async function getAskQuestions(learnerId: string): Promise<AskQuestion[] | null> {
  try {
    const { data, error } = await db().from('ask_maths_questions').select('id, asked_at, question, outcome, script')
      .eq('learner_id', learnerId).order('asked_at', { ascending: false }).limit(200)
    return error ? null : (data as AskQuestion[])
  } catch { return null }
}

/** Deletes every question of this child now (owner only). The number deleted, or null. */
export async function forgetAskQuestions(learnerId: string): Promise<number | null> {
  try {
    const { data, error } = await db().rpc('ask_maths_forget', { p_learner: learnerId })
    return error ? null : (data as number)
  } catch { return null }
}

/** The account's Ask maths add-on, null when it has none (undefined: could not read). */
export async function getAddon(): Promise<Addon | null | undefined> {
  try {
    const { data, error } = await db().from('addon_subscriptions').select('status, current_period_end, cancel_at_period_end').eq('product', 'ask_maths').maybeSingle()
    return error ? undefined : (data as Addon | null)
  } catch { return undefined }
}
export const addonActive = (a: Addon | null | undefined) => !!a && (a.status === 'active' || a.status === 'trialing')

async function billing(path: string, body?: unknown): Promise<{ ok: true; url?: string } | { ok: false; error: string }> {
  const t = await token()
  if (!t) return { ok: false, error: 'unauthenticated' }
  try {
    const r = await fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })
    const j = (await r.json().catch(() => null)) as { ok?: boolean; url?: string; error?: string } | null
    return r.ok && j?.ok ? { ok: true, url: j.url } : { ok: false, error: j?.error ?? 'failed' }
  } catch { return { ok: false, error: 'failed' } }
}
/** Stripe Checkout for the add-on: the URL to go to. `renewalConsent`: the parent ticked the auto-renew box. */
export const startAddonCheckout = (renewalConsent: boolean) => billing('/api/checkout/ask-maths', { renewalConsent })
/** Stops the add-on at the end of the period already paid for. */
export const cancelAddon = () => billing('/api/billing/ask-maths-cancel')
