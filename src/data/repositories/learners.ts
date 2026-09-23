'use client'

/** Learner CRUD + access-role management. */
import { toast } from '@/shared/ui/Toast'
import { db } from '@/data/repositories/_shared'
import type { Learner } from '@/data/supabase/types'
import type { AgeGroup } from '@/core/chapters'

/** 'self' = the child's own account (child logins, 2026-09-17). */
export type LearnerWithRole = Learner & { accessRole: 'owner' | 'viewer' | 'self' }

export async function getMyLearners(): Promise<LearnerWithRole[]> {
  const supabase = db()
  // getSession() reads the JWT from local storage (no network) — RLS is the real boundary
  // on the reads below, so a locally-cached identity is sufficient for the "am I signed in" gate.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  const { data: access, error: accessErr } = await supabase
    .from('learner_access')
    .select('learner_id, access_role')   // pull the role here so the caller never round-trips per learner
    .eq('parent_id', user.id)

  // Distinguish a real failure from genuinely-empty: THROW on error so the caller shows a
  // "couldn't load — retry" state instead of an empty list that reads as "your children vanished".
  if (accessErr) throw new Error(`learner_access: ${accessErr.message}`)
  if (!access || access.length === 0) return []   // no learners — a true empty

  const roleById = new Map(
    (access as { learner_id: string; access_role: 'owner' | 'viewer' | 'self' }[])
      .map(a => [a.learner_id, a.access_role]),
  )
  const ids = [...roleById.keys()]

  const { data, error } = await supabase
    .from('learners')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`learners: ${error.message}`)
  return ((data ?? []) as Learner[]).map(l => ({
    ...l,
    accessRole: roleById.get(l.id) ?? 'viewer',
  }))
}

/**
 * ⚠️ NO DATE OF BIRTH — deliberately, and do not add it back without a use for it.
 * The column existed and was written as `null` by the only caller; nothing ever read it, so it was
 * an exact-birthdate field on a CHILD collected for no purpose, which is the first thing a COPPA /
 * GDPR-K reviewer asks about. `age_group` is what the product actually branches on. Dropped in
 * `20260817_drop_learner_dob.sql`. If an age is ever genuinely needed, store the BAND, not the date.
 */
export async function createLearner(
  name: string,
  avatarIndex: number,
  ageGroup: AgeGroup,
  /** What the child starts with: a class (its lessons), or just the modules chosen when adding them. */
  inClass?: { classId?: string; lessonIds: string[] | null },
  /** The granted parental consent this child is created under. Required by the database once the
   *  consent migration is applied (trg_enforce_learner_consent); absent before it, when there is no
   *  gate — see AddChildFlow for why both shapes are tolerated. */
  consentId?: string,
): Promise<Learner | null> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { console.error('[createLearner] no user'); return null }

  const payload: Record<string, unknown> = {
    display_name:  name,
    avatar_index:  avatarIndex,
    age_group:     ageGroup,
    created_by:    user.id,
  }
  // A child added to a class starts with that class's lessons (what /modules reads).
  if (inClass) {
    if (inClass.classId) payload.grade_id = inClass.classId
    payload.lesson_ids = inClass.lessonIds
  }
  if (consentId) payload.consent_id = consentId

  const { data, error } = await supabase
    .from('learners')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[createLearner]', error.code, error.message)
    toast.error('Failed to create learner — please try again')
    return null
  }
  return data as Learner
}

/**
 * Choose the new-flow topics a child sees (null = every topic). Only the parent who created the child can write it
 * (the "learners: update" policy). 'not_ready' = the database does not have the column yet (migration
 * 20260914015455 not applied) — reported, never a silent failure.
 */
export async function setLearnerLessons(learnerId: string, lessonIds: string[] | null): Promise<'ok' | 'not_ready' | 'error'> {
  const { data, error } = await db()
    .from('learners')
    .update({ lesson_ids: lessonIds } as never)
    .eq('id', learnerId)
    .select('id')
  if (error) {
    console.error('[setLearnerLessons]', error.code, error.message)
    return error.code === 'PGRST204' || /lesson_ids/.test(error.message) ? 'not_ready' : 'error'
  }
  // RLS refuses an update by returning no rows, not an error: a viewer parent lands here.
  return data && data.length > 0 ? 'ok' : 'error'
}

/**
 * Assign lessons: the child sees exactly `lessonIds` (null = every topic), each with its due date from `due`.
 * Saved together so the list and its dates cannot disagree. Same owner-only rule and "not ready" answer as
 * setLearnerLessons; `not_ready` here means the lesson_due column is not in the database yet.
 */
export async function setLearnerAssignments(learnerId: string, lessonIds: string[] | null, due: Record<string, string>): Promise<'ok' | 'not_ready' | 'error'> {
  const { data, error } = await db()
    .from('learners')
    .update({ lesson_ids: lessonIds, lesson_due: lessonIds ? due : null } as never)
    .eq('id', learnerId)
    .select('id')
  if (error) {
    console.error('[setLearnerAssignments]', error.code, error.message)
    return error.code === 'PGRST204' || /lesson_ids|lesson_due/.test(error.message) ? 'not_ready' : 'error'
  }
  return data && data.length > 0 ? 'ok' : 'error'
}

export async function deleteLearner(learnerId: string) {
  const supabase = db()
  const { error } = await supabase
    .from('learners')
    .delete()
    .eq('id', learnerId)
  if (error) console.error('[deleteLearner]', error.message)
}

/** Get the current user's access role for a learner */
export async function getMyAccessRole(
  learnerId: string
): Promise<'owner' | 'viewer' | null> {
  const supabase = db()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return null

  const { data } = await supabase
    .from('learner_access')
    .select('access_role')
    .eq('learner_id', learnerId)
    .eq('parent_id', user.id)
    .single()

  return (data as { access_role: 'owner' | 'viewer' } | null)?.access_role ?? null
}

/** Returned by `deleteLearnerPermanently` when the database predates `delete_learner`. */
export const LEGACY_DELETE = 'legacy_delete'

/**
 * Owner only: permanently delete the learner and everything about them — the set docs/legal/06
 * lists, their own login and crash records included — in ONE database call (`delete_learner`, the same
 * deletion a withdrawal runs).
 *
 * ⚠️ EXPAND/CONTRACT. `main` deploys the client the moment it is pushed and migrations are applied by
 * hand, so this ships BEFORE 20260923140000 exists. PostgREST answers an unknown RPC with PGRST202;
 * on that one code the caller falls back to the old two-step path (login, then the row). Delete the
 * fallback once the migration is applied everywhere.
 */
export async function deleteLearnerPermanently(
  learnerId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = db()
  const { error } = await supabase.rpc('delete_learner', { p_learner_id: learnerId })
  if (!error) return { ok: true }
  if (error.code === 'PGRST202') return { ok: false, error: LEGACY_DELETE }
  return { ok: false, error: /not_owner/.test(error.message) ? 'Only the owner can delete a learner' : error.message }
}

/** The pre-20260923140000 path: the row only (its cascades), after the caller removed the login. */
export async function deleteLearnerRowLegacy(
  learnerId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = db()
  const role = await getMyAccessRole(learnerId)
  if (role !== 'owner') return { ok: false, error: 'Only the owner can delete a learner' }
  const { error } = await supabase.from('learners').delete().eq('id', learnerId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Viewer only: remove yourself from this learner (revoke own access) */
export async function removeMyselfFromLearner(
  learnerId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const role = await getMyAccessRole(learnerId)
  if (role === 'owner') return { ok: false, error: 'Owners cannot remove themselves — delete the learner instead' }

  const { error } = await supabase
    .from('learner_access')
    .delete()
    .eq('learner_id', learnerId)
    .eq('parent_id', user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
