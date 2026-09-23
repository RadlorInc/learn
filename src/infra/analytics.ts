'use client'
/**
 * analytics — lightweight, local-first product-event logging.
 *
 * `track(event, props)` records a funnel/engagement event for the ACTIVE learner.
 * Events buffer in kv (offline-safe) and flush to Supabase `learner_events`,
 * deduped by client_id. Fully best-effort: never throws, no-ops when there is no
 * active learner or no network. Day-level retention is derived from the existing
 * `sessions` table — these events add the funnel (opens vs completes, skips).
 *
 * Read it all on the founder dashboard at /admin.
 */
import { kv } from '@/infra/storage/kv'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { createClient } from '@/data/supabase/client'
import { isConsentRefusal } from '@/infra/consentError'
import { recordError } from '@/infra/storage/lastError'

const QUEUE_KEY = 'milo_events_queue'
const MAX_QUEUE = 500   // cap so a persistently-failing flush can't grow unbounded

export interface LearnerEvent {
  learner_id: string
  event: string
  props: Record<string, unknown>
  client_id: string
  client_ts: string
}

function readQueue(): LearnerEvent[] {
  try { return JSON.parse(kv.get(QUEUE_KEY) ?? '[]') } catch { return [] }
}
function writeQueue(q: LearnerEvent[]): void {
  try { kv.set(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))) } catch {}
}

let _flushing = false
/** Set when the database refused a write for want of consent. Never cleared by a retry, because a
 *  retry cannot change the answer; it clears when the process does, or when consent is granted and
 *  the app reloads. Read it to tell a parent why nothing is being saved. */
let _consentBlocked = false
export const isConsentBlocked = (): boolean => _consentBlocked
export async function flushEvents(): Promise<number> {
  if (_flushing || typeof navigator === 'undefined' || !navigator.onLine) return 0
  const q = readQueue()
  if (q.length === 0) return 0
  _flushing = true
  try {
    // Untyped client: the generated Database types don't include learner_events
    // yet (same pattern as queries.ts `db(): any`).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    // upsert with ignoreDuplicates so retries can't double-insert (client_id is unique)
    const { error } = await supabase
      .from('learner_events')
      .upsert(q, { onConflict: 'client_id', ignoreDuplicates: true })

    /**
     * ⚠️ A CONSENT REFUSAL IS NOT A NETWORK BLIP, AND TREATING THEM ALIKE IS THE DEFECT THIS BRANCH
     * EXISTS FOR. Everything else here is best-effort by design: a dropped connection keeps the
     * queue so the events arrive later. A refusal can NEVER be accepted — there is no granted
     * consent for this child — so the same "keep and retry" would spin for ever while nothing was
     * stored and nothing surfaced anywhere. Three differences, all deliberate:
     *   · the queue is DROPPED, not kept, so the retry loop stops;
     *   · a breadcrumb is written LOCALLY, which is what the support diagnostic block reads;
     *   · `_consentBlocked` is set, so a screen can say so rather than showing a working app.
     *
     * ⚠️ AND IT IS RECORDED LOCALLY RATHER THAN THROUGH `reportCrash`, on purpose: that path posts
     * to `/api/report-error`, which writes `error_events` WITH a `learner_id` — a table this same
     * gate refuses for this same child. Reporting the refusal through it would be refused by it.
     */
    if (isConsentRefusal(error)) {
      _consentBlocked = true
      kv.remove(QUEUE_KEY)
      recordError(`${q.length} event(s) dropped: no granted parental consent for this child`, 'analytics.consent')
      console.error('[analytics] consent refused — events dropped, not retried.', error)
      return 0
    }
    if (error) return 0          // transient — keep queued; try again later
    kv.remove(QUEUE_KEY)
    return q.length
  } catch {
    return 0                     // transient — keep queued
  } finally {
    _flushing = false
  }
}

/** Record a product event for the active learner. Best-effort; never throws. */
export function track(event: string, props: Record<string, unknown> = {}): void {
  try {
    const learner = getActiveLearner()
    if (!learner) return
    const q = readQueue()
    // crypto.randomUUID — same source `auth.ts` already uses for its own dedupe key, and a
    // Math.random UUID is not one (it collides far sooner than the v4 space suggests, and
    // `client_id` is what stops a retry double-inserting).
    q.push({ learner_id: learner.id, event, props, client_id: crypto.randomUUID(), client_ts: new Date().toISOString() })
    writeQueue(q)
    void flushEvents()
  } catch { /* analytics must never break the app */ }
}

// Self-contained flushing: retry when the tab regains connectivity, and on a
// gentle interval, without needing a provider wired into the tree.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void flushEvents() })
  window.setInterval(() => { void flushEvents() }, 60_000)
}
