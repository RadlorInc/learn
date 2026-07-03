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
}

export async function syncSession(payload: SessionPayload): Promise<SyncOutcome> {
  const supabase = db()

  // Single RPC call — replaces 3 separate upserts
  // Reduces DB round trips from 3 to 1
  const { error } = await supabase.rpc('sync_session', {
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
  })

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
