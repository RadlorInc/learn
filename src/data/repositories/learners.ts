'use client'

/** Learner CRUD + access-role management. */
import { toast } from '@/shared/ui/Toast'
import { db } from '@/data/repositories/_shared'
import type { Learner } from '@/data/supabase/types'
import type { AgeGroup } from '@/core/chapters'

export type LearnerWithRole = Learner & { accessRole: 'owner' | 'viewer' }

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
    (access as { learner_id: string; access_role: 'owner' | 'viewer' }[])
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

export async function createLearner(
  name: string,
  avatarIndex: number,
  ageGroup: AgeGroup,
  dob?: string,
  gradeId?: string,
): Promise<Learner | null> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { console.error('[createLearner] no user'); return null }

  // grade_id is only sent when a grade was actually chosen, so the no-grade
  // path stays identical to the original insert (forward-compatible with DBs
  // that predate the grades migration).
  const payload: Record<string, unknown> = {
    display_name:  name,
    avatar_index:  avatarIndex,
    date_of_birth: dob ?? null,
    age_group:     ageGroup,
    created_by:    user.id,
  }
  if (gradeId) payload.grade_id = gradeId

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

/** Move an existing learner into a grade (or clear it with null). */
export async function setLearnerGrade(learnerId: string, gradeId: string | null): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('learners')
    .update({ grade_id: gradeId })
    .eq('id', learnerId)
  if (error) { console.error('[setLearnerGrade]', error.message); toast.error('Could not change grade'); return false }
  return true
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

/** Owner only: permanently delete the learner and all their data */
export async function deleteLearnerPermanently(
  learnerId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = db()
  const role = await getMyAccessRole(learnerId)
  if (role !== 'owner') return { ok: false, error: 'Only the owner can delete a learner' }

  const { error } = await supabase
    .from('learners')
    .delete()
    .eq('id', learnerId)

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
