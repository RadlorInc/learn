import type { ErrorKind } from '@/data/repositories'

/**
 * BUG-10: never tell someone to check their connection when the failure is KNOWN not to be the connection.
 * Only existing app wording is used (both strings are already in the dashboard's i18n table). 'network' and 'other'
 * keep the caller's own connection wording — 'other' because nothing is known about it.
 * ⚠️ 'consent' and 'denied' get the generic line for now; each deserves its own words (N9, Rafi).
 */
export function errorWording(kind: ErrorKind, connection: string): string {
  if (kind === 'expired') return 'Your sign-in has expired. Sign in again, then try this.'
  if (kind === 'consent' || kind === 'denied') return 'Something went wrong. Please try again.'
  return connection
}
