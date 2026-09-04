'use client'

/** Session sync — the write path for a completed chapter (lesson/practice). */
import { db, classifySyncError, type SyncOutcome } from '@/data/repositories/_shared'
import type { ChapterType } from '@/data/supabase/types'

export interface SessionPayload {
  learnerId:    string
  chapter:      ChapterType
  phase:        'lesson' | 'practice'
  correctCount: number
  wrongCount:   number
  starsEarned:  number
  xpEarned:     number
  coinsEarned:  number
  clientId:     string
  completedAt:  string
  /** When the child OPENED the chapter (client clock, ISO). Optional and NULLABLE end to end:
   *  an offline queue written by an older bundle has no field, and "we do not know" must stay
   *  representable — a fabricated zero would sit in a median pretending to be a measurement.
   *  ⚠️ The server CLAMPS this (never after the end, never >6h before). See the migration. */
  startedAt?:   string
  /** The adaptive tier the child left this chapter on (1–3), so the next device resumes there.
   *  Optional: an offline queue written by an older bundle has no field, and 1 is the old behaviour. */
  difficulty?:  1 | 2 | 3
}

/**
 * ⚠️ EXPAND STEP: THIS TOLERATES BOTH SCHEMA VERSIONS, DELIBERATELY.
 *
 * `main` auto-deploys to Vercel, so a commit that starts calling a NEW RPC signature goes live the
 * moment it is pushed — before anybody applies the migration that creates it. That happened on
 * 2026-09-05: the 12-argument `sync_session` did not exist yet, PostgREST answered
 * **PGRST202 / HTTP 404** ("Could not find the function ... in the schema cache"), and every
 * completion fell to `classifySyncError` → 'retry' and sat in the offline queue. Nothing was lost —
 * the queue is why — but the server saw no sessions until the migration landed.
 *
 * The rule in CLAUDE.md is "a migration that changes what running code READS ships with or after
 * its readers". This is its mirror: a CLIENT that calls a new signature must tolerate the old one,
 * or the deploy order becomes a constraint somebody has to remember. Tolerating both removes the
 * ordering hazard entirely — the migration can be applied whenever.
 *
 * ⚠️ DO NOT DELETE THIS FALLBACK once the migration is applied without also confirming no browser
 * is still running an older bundle; it costs one extra round trip only in the failure case.
 */
export async function syncSession(payload: SessionPayload): Promise<SyncOutcome> {
  const supabase = db()

  // Single RPC call — replaces 3 separate upserts
  // Reduces DB round trips from 3 to 1
  const args = {
    p_learner_id:   payload.learnerId,
    p_chapter:      payload.chapter,
    p_phase:        payload.phase,
    p_correct:      payload.correctCount,
    p_wrong:        payload.wrongCount,
    p_stars:        payload.starsEarned,
    p_xp:           payload.xpEarned,
    p_coins:        payload.coinsEarned,
    p_client_id:    payload.clientId,
    p_completed_at: payload.completedAt,
    p_difficulty:   payload.difficulty ?? 1,
    // ⚠️ `sessions.started_at` was NOT a start time until 2026-09-05: the RPC never supplied it, so
    // it took the column default now() at INSERT while completed_at is stamped on the client — both
    // marked the END, and all 49 production rows had a NEGATIVE duration. null here is honest.
    p_started_at:   payload.startedAt ?? null,
  }
  let { error } = await supabase.rpc('sync_session', args)

  // PGRST202 = no function with these parameter names. The only new parameter is p_started_at, so
  // retry once without it: the pre-2026-09-05 database still records the session, just with an
  // unknown start. A lost session is a child's stars gone; an unknown start is one null column.
  if (error && (error as { code?: string }).code === 'PGRST202') {
    const { p_started_at: _dropped, ...legacy } = args
    const retry = await supabase.rpc('sync_session', legacy)
    if (!retry.error) return 'ok'
    error = retry.error
  }

  if (error) {
    const outcome = classifySyncError(error)
    // No toast here — this runs once PER queued item during a flush, which would
    // spam a toast per item. The OfflineBanner shows pending status instead.
    console.error(
      `[syncSession] rpc failed (${outcome === 'drop' ? 'permanent — discarding' : 'will retry'}):`,
      error.message,
    )
    return outcome
  }

  return 'ok'
}
