'use client'
/**
 * CONSENT-ONCE, THE CLIENT HALF (docs/legal/LOOP-STATE.md → Consent-once → C0).
 *
 * One verifiable (email-plus) consent per parent ACCOUNT; each child then carries a parental
 * attestation. This file answers three questions for the screens: where does this account stand,
 * ask for its consent, and did the parent tick the notice at signup.
 *
 * ⚠️ NOTHING HERE DECIDES WHETHER A CHILD MAY EXIST — the database does (trg_enforce_learner_consent).
 * These reads only choose which screen to show; a wrong answer here is a wrong screen, never a child
 * created without consent.
 */
import { createClient } from '@/data/supabase/client'
import { NOTICE_VERSION, type Lang } from './copy'

export type AccountConsent =
  /** Granted and current: the add sheet, with the attestation. */
  | { k: 'granted'; id: string; noticeVersion: string; confirmedAt: string }
  /** A request is out and its link still works. */
  | { k: 'pending'; email: string; until: string }
  /** Granted, but a later notice version requires asking again. */
  | { k: 'reask' }
  /** No granted or pending consent. `fresh`: this account has NO consent history at all — never asked, never
   *  withdrew, never declined. Only then may a signup tick send B1 by itself. */
  | { k: 'none'; fresh: boolean }
  | { k: 'error' }

interface Row { id: string; state: string; notice_version: string; confirmed_at: string | null; expires_at: string; email_address: string }

/** The signed-in adult's account consent. RLS returns only their own rows ("parent_id = auth.uid()"). */
export async function readAccountConsent(): Promise<AccountConsent> {
  const db = createClient()
  const { data, error } = await db.from('parental_consents')
    .select('id, state, notice_version, confirmed_at, expires_at, email_address')
    .eq('scope', 'account').order('requested_at', { ascending: false })
  if (error) return { k: 'error' }
  const rows = (data ?? []) as Row[]
  const granted = rows.find(r => r.state === 'granted')
  if (granted) {
    // The same predicate the gate uses (consent_is_current), not a second copy of the rule here.
    const cur = await db.rpc('consent_is_current' as never, { p_version: granted.notice_version } as never)
    if (cur.error) return { k: 'error' }
    if (cur.data === true) return { k: 'granted', id: granted.id, noticeVersion: granted.notice_version, confirmedAt: granted.confirmed_at ?? '' }
  }
  const pending = rows.find(r => r.state === 'pending' && new Date(r.expires_at) > new Date())
  if (pending) return { k: 'pending', email: pending.email_address, until: pending.expires_at }
  return granted ? { k: 'reask' } : { k: 'none', fresh: rows.length === 0 }
}

export type AskResult = { ok: true; email: string; days: number } | { ok: false; error: 'stale' | 'not_ready' | 'failed' }

/** POST /api/consent/request → B1. (The route still accepts an optional `ackAt` from app versions that had the
 *  signup tick; this one never sends it.) */
export async function requestAccountConsent(lang: Lang): Promise<AskResult> {
  const { data } = await createClient().auth.getSession()
  const r = await fetch('/api/consent/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: JSON.stringify({ noticeVersion: NOTICE_VERSION, lang }),
  }).catch(() => null)
  const j = await r?.json().catch(() => null)
  if (r?.ok && j?.ok) return { ok: true, email: j.email, days: j.days }
  return { ok: false, error: r?.status === 409 ? 'stale' : j?.error === 'not_ready' ? 'not_ready' : 'failed' }
}

/** "{date}" in ATTEST.tick: the day the account consent was confirmed, as a long date in the parent's language. */
export const longDate = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === 'es' ? 'es' : 'en-US', { dateStyle: 'long' })

/** "{days}" in WAITING.body: whole days the link still works (at least 1). */
export const daysLeft = (until: string) => Math.max(1, Math.ceil((new Date(until).getTime() - Date.now()) / 86_400_000))
