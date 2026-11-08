'use client'
/**
 * The adult's own choices about the dashboard's helpers: which reminders are snoozed or hidden, which kinds are off,
 * when they last visited, which tours they have seen. Per ACCOUNT, per DEVICE.
 * ponytail: localStorage, so a second device starts fresh (tours show again, snoozes are forgotten). Move to a table
 * keyed on auth.uid() if adults complain — nothing here is child data or gates anything.
 */
import type { Kind } from './reminders'

export interface Prefs {
  snoozed: Record<string, number>   // reminder id → until (ms)
  hidden: string[]                  // reminder ids
  off: (Kind | 'good')[]            // kinds switched off in Account → Reminders
  lastVisit: number | null          // ms, the visit BEFORE this one
  seen: string[]                    // tours: 'first', 'inside-child', 'inside-class'
}
const EMPTY: Prefs = { snoozed: {}, hidden: [], off: [], lastVisit: null, seen: [] }
const key = (uid: string) => `al-dash-prefs:${uid}`

export function loadPrefs(uid: string): Prefs {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(key(uid)) ?? '{}') } } catch { return { ...EMPTY } }
}
export function savePrefs(uid: string, p: Prefs): void {
  try { localStorage.setItem(key(uid), JSON.stringify(p)) } catch { /* private mode: the helpers still work this visit */ }
}

export const SNOOZE_DAYS = 3
export const isShown = (p: Prefs, r: { id: string; kind: Kind }, now: number) =>
  !p.hidden.includes(r.id) && !p.off.includes(r.kind) && !((p.snoozed[r.id] ?? 0) > now)

