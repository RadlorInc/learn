'use client'
/**
 * A CHILD WHOSE ANSWERS THE DATABASE REFUSES FOR CONSENT (P0C01) — founder, 2026-09-28: the answers wait on the device
 * (lessonSync holds them), the child sees a friendly screen (./ConsentPause), and the adult who added the child gets the
 * consent email (/api/consent/child-blocked). Since notice-v7 the usual case is a Kindergarten / Grades 1–2 child whose
 * parent agreed only to notice-v6.
 *
 * One ask per child per page load: every later refused item for the same child is already marked. A later upload that
 * succeeds clears the mark (the parent agreed) and the screen goes.
 */
import { db } from '@/data/repositories/_shared'

/** 'sent': an email went, or one is still open. 'none': nobody could be emailed — the screen says to ask a grown-up. */
export type Told = 'sent' | 'none'

const state = new Map<string, Told | 'asking'>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(f => f())

export function markConsentBlocked(learnerId: string): void {
  if (state.has(learnerId)) return
  state.set(learnerId, 'asking'); emit()
  void askForConsent(learnerId).then(t => { if (state.get(learnerId) === 'asking') { state.set(learnerId, t); emit() } })
}

export function clearConsentBlocked(learnerId: string): void {
  if (state.delete(learnerId)) emit()
}

/** What the screen shows: the first refused child whose adult has been asked (or could not be). */
export function consentPause(): { learnerId: string; told: Told } | null {
  for (const [learnerId, t] of state) if (t !== 'asking') return { learnerId, told: t }
  return null
}

export function onConsentPause(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Asks the server to email the adult who added this child the consent link. Never throws. */
export async function askForConsent(learnerId: string): Promise<Told> {
  try {
    const { data } = await db().auth.getSession()
    const r = await fetch('/api/consent/child-blocked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      body: JSON.stringify({ learnerId }),
    })
    const j = await r.json().catch(() => null)
    return r.ok && (j?.sent || j?.pending) ? 'sent' : 'none'
  } catch { return 'none' }
}
