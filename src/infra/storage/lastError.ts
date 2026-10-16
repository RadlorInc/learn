'use client'
/**
 * lastError — a 3-deep ring of the most recent client-side errors, kept on the device.
 *
 * WHY THIS EXISTS. The app is local-first, so the failures a parent actually writes in about
 * ("her stars vanished", "it won't load on the iPad") usually leave NO server-side trace: a
 * wedged offline sync queue, a stale service-worker shell after a deploy, IndexedDB blocked in
 * private browsing, speech never unlocking. `instrumentation.ts` is server-only and cannot see
 * any of it, and `/api/report-error` hears only of crashes, page errors and refused uploads —
 * which most of these are not. This file is the only record that the failure happened at all, and it travels to
 * support inside the diagnostic block the parent pastes into an email.
 *
 * Deliberately tiny and lossy: 3 entries, truncated messages, no stack. It is a breadcrumb for
 * a human reading a support email, not a log to analyse. This ring is never sent automatically
 * — the parent chooses to send it (see infra/diagnostics.ts). Crashes, page errors and refused
 * uploads ALSO go to /api/report-error, separately, through infra/reportCrash.ts.
 */
import { kv } from '@/infra/storage/kv'

const KEY = 'milo_recent_errors'
const KEEP = 3

export interface ErrorNote {
  at: string
  msg: string
  src: string
}

/** Record an error. Never throws — recording a failure must not cause one. */
export function recordError(msg: unknown, src: string): void {
  try {
    const text = msg instanceof Error ? msg.message : String(msg)
    const note: ErrorNote = { at: new Date().toISOString(), msg: text.slice(0, 200), src }
    kv.set(KEY, JSON.stringify([note, ...getRecentErrors()].slice(0, KEEP)))
  } catch { /* ignore */ }
}

export function getRecentErrors(): ErrorNote[] {
  try {
    const raw = kv.get(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as ErrorNote[]) : []
  } catch { return [] }
}
