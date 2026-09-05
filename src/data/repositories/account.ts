/**
 * Account deletion — the client half of `public.delete_my_account`.
 *
 * ⚠️ NO SERVICE-ROLE KEY AND NO API ROUTE. The RPC derives its subject from `auth.uid()` and its
 * re-authentication evidence from `auth.jwt()`, both of which come from the caller's own token, so
 * this is a plain authenticated call. A server route would need the service-role key and would then
 * have to re-implement "is this really you", which is a second copy of the authorisation rule —
 * the shape this repo has been bitten by more than once.
 *
 * ⚠️ ONE TRANSACTION, SO THERE IS NO PARTIAL STATE TO REPORT. Either every table is emptied or the
 * account is untouched. `error` here always means "nothing was deleted".
 */
import { db } from '@/data/repositories/_shared'

export type DeleteOutcome =
  | { ok: true; deleted: Record<string, number> }
  /** The token is older than the RPC's window. The parent must sign in again — not a failure. */
  | { ok: false; reason: 'reauth_required' }
  /** The typed address did not match the one on the account. */
  | { ok: false; reason: 'confirm_mismatch' }
  | { ok: false; reason: 'not_signed_in' }
  /**
   * The RPC is not in the database yet. ⚠️ THIS IS A REAL STATE, NOT A THEORETICAL ONE: `promote`
   * (the code deploy) runs on `needs: ci`, while `migrate-prod` is gated behind an environment and
   * a staging ref that do not exist — so a push ships this page BEFORE the function exists, which
   * is the expand/contract rule pointing the wrong way. Named rather than folded into 'failed' so
   * the page can say something true and offer the other door, and so it heals by itself the moment
   * the migration is applied.
   */
  | { ok: false; reason: 'not_deployed' }
  | { ok: false; reason: 'failed'; detail: string }

export async function deleteMyAccount(confirmEmail: string): Promise<DeleteOutcome> {
  const { data, error } = await db().rpc('delete_my_account', { p_confirm_email: confirmEmail })
  if (!error) return { ok: true, deleted: (data ?? {}) as Record<string, number> }

  // The function raises these three by name; anything else is genuinely unexpected and is reported
  // as such rather than being mapped onto a friendly message that hides it.
  const m = error.message ?? ''
  for (const reason of ['reauth_required', 'confirm_mismatch', 'not_signed_in'] as const) {
    if (m.includes(reason)) return { ok: false, reason }
  }
  // PostgREST answers PGRST202 when it cannot resolve a function by name and argument names.
  if (error.code === 'PGRST202' || /Could not find the function/i.test(m)) {
    return { ok: false, reason: 'not_deployed' }
  }
  return { ok: false, reason: 'failed', detail: m }
}
