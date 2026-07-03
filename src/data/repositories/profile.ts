'use client'

/** Auth / profile data access. */
import { db } from '@/data/repositories/_shared'
import { clearActiveLearner } from '@/data/supabase/useLearnerSession'

export async function getProfile() {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data as { id: string; role: string; display_name: string; avatar_index: number } | null
}

export async function signOut() {
  const supabase = db()
  await supabase.auth.signOut()
  clearActiveLearner()   // else the next account (same tab) briefly sees the previous child's profile
  window.location.href = '/auth'
}
