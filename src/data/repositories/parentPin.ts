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
export async function requestPinReset(): Promise<{ ok: boolean; reset_at?: string }> {
  const r = await call('request_parent_pin_reset', {}) as unknown as { ok: boolean; reset_at?: string }
  return r
}
