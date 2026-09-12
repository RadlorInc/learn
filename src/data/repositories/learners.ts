'use client'

/** Learner CRUD + access-role management. */
import { toast } from '@/shared/ui/Toast'
import { db } from '@/data/repositories/_shared'
import type { AccessRole, Learner } from '@/data/supabase/types'
import type { ChapterType } from '@/core/chapters'
import type { AgeGroup } from '@/core/chapters'

export type LearnerWithRole = Learner & { accessRole: AccessRole }

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

/**
 * The chapters this child may play — the PARENT's choice.
 *
 * ⚠️ Not `grade_chapters`, which is the teacher's syllabus and must never decide what a child sees.
 * `null` clears the choice and falls the child back to the age band's standard set, which is the
 * whole implementation of "I don't know which chapters to pick".
 */
export async function setLearnerChapters(
  learnerId: string,
  chapterIds: ChapterType[] | null,
): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('learners')
    .update({ chapter_ids: chapterIds && chapterIds.length ? chapterIds : null })
    .eq('id', learnerId)
  if (error) { console.error('[setLearnerChapters]', error.message); toast.error('Could not save those chapters'); return false }
  return true
}

/**
 * Add a whole roster at once.
 *
 * ⚠️ THE INPUT IS PASTED TEXT, ON PURPOSE, AND THAT IS THE WHOLE FEATURE. A column copied out of a
 * spreadsheet arrives as newline-separated names, so paste covers "upload the class list" and "type
 * them in" with one control, no file picker and no spreadsheet parser. Commas are split too, so a
 * single-line "Ana, Ben, Cara" works as well.
 *
 * Blank lines and duplicate names within the paste are dropped — a trailing newline should not
 * create a child called "". Names already on the roster are skipped rather than duplicated, so
 * pasting a corrected list twice does not double the class.
 */
export function parseRoster(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of text.split(/[\n,]/)) {
    const name = raw.trim().replace(/\s+/g, ' ')
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name.slice(0, 60))
  }
  return out
}

/** Create one learner per name and put them all on the class roster. Returns how many landed. */
export async function addRoster(
  gradeId: string,
  ageGroup: AgeGroup,
  names: string[],
): Promise<{ added: number; skipped: number }> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { added: 0, skipped: names.length }

  const { data: existing } = await supabase
    .from('learners').select('display_name').eq('grade_id', gradeId)
  const already = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((existing ?? []) as any[]).map(l => String(l.display_name).trim().toLowerCase()),
  )
  const fresh = names.filter(n => !already.has(n.toLowerCase()))
  if (!fresh.length) return { added: 0, skipped: names.length }

  const { data, error } = await supabase
    .from('learners')
    .insert(fresh.map((display_name, i) => ({
      display_name, created_by: user.id, age_group: ageGroup,
      grade_id: gradeId, avatar_index: i % 4,
    })))
    .select('id')
  if (error) { console.error('[addRoster]', error.message); toast.error('Could not add those students'); return { added: 0, skipped: names.length } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const added = ((data ?? []) as any[]).length
  return { added, skipped: names.length - added }
}

/**
 * The learner this signed-in account IS, if it is a child's own account.
 *
 * ⚠️ A child arriving at `/menu` has no active learner in session storage — nobody picked them from
 * a dashboard, they signed in as themselves. This is how the app finds out who they are: the single
 * `learner_access` row with role `self`. Returns null for every adult account, so the ordinary
 * "pick a child" path is untouched.
 */
export async function getSelfLearner(): Promise<Learner | null> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('learner_access')
    .select('learners(*)')
    .eq('parent_id', user.id)
    .eq('access_role', 'self')
    .maybeSingle()
  if (error) { console.warn('[getSelfLearner]', error.message); return null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = (data as any)?.learners
  return (Array.isArray(l) ? l[0] : l) ?? null
}
