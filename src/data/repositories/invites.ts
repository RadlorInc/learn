'use client'

/** Learner-access invites (send / receive / accept / revoke). */
import { db } from '@/data/repositories/_shared'

export interface InviteWithLearner {
  id:             string
  learner_id:     string
  invited_by:     string
  invited_email:  string
  status:         'pending' | 'accepted' | 'expired'
  expires_at:     string
  created_at:     string
  learner_name?:  string
}

/** Send an invite — anyone can invite anyone to access a learner */
export async function sendInvite(
  learnerId: string,
  invitedEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  // Check sender has access to this learner
  const { data: access } = await supabase
    .from('learner_access')
    .select('access_role')
    .eq('learner_id', learnerId)
    .eq('parent_id', user.id)
    .single()

  if (!access) return { ok: false, error: 'You do not have access to this learner' }

  // Check not already invited or has access
  const { data: existing } = await supabase
    .from('learner_invites')
    .select('id, status')
    .eq('learner_id', learnerId)
    .eq('invited_email', invitedEmail.toLowerCase().trim())
    .eq('status', 'pending')
    .single()

  if (existing) return { ok: false, error: 'An invite has already been sent to this email' }

  const { error } = await supabase
    .from('learner_invites')
    .insert({
      learner_id:     learnerId,
      invited_by:     user.id,
      invited_email:  invitedEmail.toLowerCase().trim(),
      status:         'pending',
      expires_at:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Get all pending invites sent by the current user */
export async function getSentInvites(learnerId: string): Promise<InviteWithLearner[]> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('learner_invites')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('invited_by', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as InviteWithLearner[]
}

/** Get all pending invites received by the current user's email */
export async function getReceivedInvites(): Promise<InviteWithLearner[]> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const email = user.email?.toLowerCase().trim()
  if (!email) return []

  const { data } = await supabase
    .from('learner_invites')
    .select('*, learners(display_name)')
    .eq('invited_email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return ((data ?? []) as unknown as (InviteWithLearner & { learners: { display_name: string } })[])
    .map(i => ({ ...i, learner_name: i.learners?.display_name }))
}

/** Accept a received invite — grants viewer access to the learner */
export async function acceptInvite(
  inviteId: string
): Promise<{ ok: boolean; error?: string; accessGranted?: boolean }> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  // Get the invite. Enforce the 7-day TTL here too (V8) — without the expires_at filter an
  // expired-but-still-'pending' invite could be accepted, silently defeating the TTL.
  const { data: invite } = await supabase
    .from('learner_invites')
    .select('*')
    .eq('id', inviteId)
    .eq('invited_email', user.email?.toLowerCase().trim())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return { ok: false, error: 'Invite not found or already used' }

  const inv = invite as { learner_id: string }

  // Grant access FIRST — can_self_grant_access() requires the invite to still be
  // status='pending', so the status flip below must stay second. Do not reorder.
  const { error: accessError } = await supabase
    .from('learner_access')
    .upsert(
      { learner_id: inv.learner_id, parent_id: user.id, access_role: 'viewer' },
      { onConflict: 'learner_id,parent_id', ignoreDuplicates: true }
    )

  if (accessError) return { ok: false, error: accessError.message }

  // Mark invite as accepted. If this fails the access grant above already landed, so
  // report failure (not success-with-warning): the invite is still 'pending' and the
  // whole function is idempotent — a retry re-selects the pending invite, no-ops the
  // upsert (ignoreDuplicates) and re-attempts the flip. Reporting ok:true would leave a
  // permanently-pending invite that nothing ever retries.
  const { error: statusError } = await supabase
    .from('learner_invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId)

  if (statusError) return {
    ok: false,
    accessGranted: true,
    error: `Access was granted, but the invite could not be marked as accepted (${statusError.message}). Refresh and try again.`,
  }

  return { ok: true }
}

/** Revoke a sent invite */
export async function revokeInvite(inviteId: string): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('learner_invites')
    .delete()
    .eq('id', inviteId)
  return !error
}
