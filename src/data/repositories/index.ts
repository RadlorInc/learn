/**
 * Data-access layer — the ONLY place the app talks to Supabase.
 *
 * Split by domain from the former monolithic `queries.ts`. Import from this
 * barrel (`@/data/repositories`) to keep call sites stable; the internal
 * `_shared` helpers (db, classifySyncError) are intentionally NOT re-exported.
 */
export type { SyncOutcome } from '@/data/repositories/_shared'
export * from '@/data/repositories/profile'
export * from '@/data/repositories/learners'
export * from '@/data/repositories/grades'
export * from '@/data/repositories/progress'
export * from '@/data/repositories/sessions'
export * from '@/data/repositories/diagnostics'
export * from '@/data/repositories/invites'
