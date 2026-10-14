'use client'
/**
 * What the upload queue (lessonSync) last saw: when an upload last went through, and the last refusal or failure.
 * Kept on the device for the diagnostic block a parent sends (infra/diagnostics.ts): with `unsynced` above 0 and
 * `online`, this says WHY the work is not leaving the device. Codes only — never a payload.
 */
import { kv } from '@/infra/storage/kv'

const KEY = 'milo-sync-status'

export interface SyncStatus { okAt?: string; error?: { code: string; at: string } }

export function getSyncStatus(): SyncStatus {
  try {
    const v: unknown = JSON.parse(kv.get(KEY) ?? '{}')
    return v && typeof v === 'object' ? v as SyncStatus : {}
  } catch { return {} }
}

/** `code` absent = the upload went through. Never throws. */
export function noteSync(code?: string): void {
  try {
    const at = new Date().toISOString()
    kv.set(KEY, JSON.stringify(code === undefined
      ? { ...getSyncStatus(), okAt: at }
      : { ...getSyncStatus(), error: { code: code.slice(0, 80), at } }))
  } catch { /* ignore */ }
}
