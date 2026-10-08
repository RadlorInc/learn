'use client'

/**
 * The parent PIN that guards the dashboard on a shared device. All checking is server-side (migration
 * 20260917083255): the table is unreadable to the browser, and wrong tries lock it.
 */
import { db, classifyUserError, type ErrorKind } from '@/data/repositories/_shared'

export type PinStatus =
  | { state: 'none' }
  | { state: 'set'; locked_until?: string | null; reset_at?: string | null }
  /** The functions are not in the database yet (code deployed before the migration) — the gate stays open. */
  | { state: 'unavailable' }
  | { state: 'error'; kind: ErrorKind }

export type PinResult = { ok: true; reset_cancelled?: boolean } | { ok: false; error: string; locked_until?: string | null; tries_left?: number; kind?: ErrorKind }

const missing = (e: { code?: string; message?: string }) => e.code === 'PGRST202' || /Could not find the function/i.test(e.message ?? '')

export async function getPinStatus(): Promise<PinStatus> {
  try {
    const { data, error } = await db().rpc('parent_pin_status')
    if (error) return missing(error) ? { state: 'unavailable' } : { state: 'error', kind: classifyUserError(error) }
    return data as PinStatus
  } catch (e) { return { state: 'error', kind: classifyUserError(e) } }
}

async function call(fn: string, args: Record<string, unknown>): Promise<PinResult> {
  try {
    const { data, error } = await db().rpc(fn, args)
    return error ? { ok: false, error: 'failed', kind: classifyUserError(error) } : (data as PinResult)
  } catch (e) { return { ok: false, error: 'failed', kind: classifyUserError(e) } }
}

export const verifyPin = (pin: string) => call('verify_parent_pin', { p_pin: pin })
export const setPin = (pin: string, current?: string) => call('set_parent_pin', { p_pin: pin, p_current: current ?? null })
/** "Forgot PIN?" goes through the server, which runs the same RPC as the caller and emails the account that a reset
 *  was asked for (app/api/parent/pin-reset). */
export async function requestPinReset(): Promise<{ ok: boolean; reset_at?: string }> {
  try {
    const { data: { session } } = await db().auth.getSession()
    if (!session) return { ok: false }
    const r = await fetch('/api/parent/pin-reset', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } })
    const j = (await r.json().catch(() => null)) as { ok?: boolean; reset_at?: string } | null
    return j?.ok === true && typeof j.reset_at === 'string' ? { ok: true, reset_at: j.reset_at } : { ok: false }
  } catch { return { ok: false } }
}
