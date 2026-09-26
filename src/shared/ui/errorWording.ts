import type { ErrorKind } from '@/data/repositories'

/**
 * BUG-10: never tell someone to check their connection when the failure is KNOWN not to be the connection.
 * The words for 'expired' and 'consent' are Rafi's (N9, 2026-09-26). 'denied' (an RLS refusal) has no words of its own
 * and keeps the generic line. 'network' and 'other' keep the caller's own connection wording — 'other' because
 * nothing is known about it.
 */
export function errorWording(kind: ErrorKind, connection: string): string {
  if (kind === 'expired') return 'Please sign in again'
  if (kind === 'consent') return 'This child needs a parent’s permission first'
  if (kind === 'denied') return 'Something went wrong. Please try again.'
  return connection
}
