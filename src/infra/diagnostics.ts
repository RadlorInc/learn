'use client'
/**
 * diagnostics — the device-side snapshot a parent sends with a support request.
 *
 * THE PROBLEM THIS SOLVES. The app is local-first: progress lives in IndexedDB on the child's
 * device and syncs up through a queue. So the failures parents actually report are, more often
 * than not, entirely invisible from the server:
 *
 *   "her stars vanished"      → the offline queue is full and never flushed
 *   "it won't load"           → a stale service-worker shell after a deploy
 *   "nothing saves"           → IndexedDB blocked/hung, running on the localStorage fallback
 *   "the voice doesn't talk" → speech never unlocked on that browser
 *
 * None of those produce a Supabase row or a Vercel log line. Historically the only way this
 * repo ever diagnosed one (the Safari `upgrade-insecure-requests` boot failure) was by
 * hand-adding beacons to the service worker — which is not repeatable on a stranger's iPad.
 * So instead the user carries the evidence to us, on purpose, in a support email.
 *
 * PRIVACY. Deliberately shape-only: ids, counts, versions, error messages. NO auth token, NO
 * child name or date of birth, NO progress contents. Nothing here is ever transmitted
 * automatically — the parent reads the block and chooses to send it.
 */
import { kv } from '@/infra/storage/kv'
import { getRecentErrors } from '@/infra/storage/lastError'
import { pendingLessonUploads } from '@/infra/storage/lessonSync'
import { getSyncStatus, type SyncStatus } from '@/infra/storage/syncStatus'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { getCurrentSession } from '@/data/auth'

export interface Diagnostics {
  at: string
  swVersion: string
  swControlling: boolean
  accountId: string
  accountEmail: string
  learnerId: string
  storeMode: 'idb' | 'local'
  queuedSessions: number
  storageUsedMb: string
  /** Quota and whether the browser agreed not to evict (`navigator.storage.persist`). */
  storageQuota: string
  /** The last store write that failed (kv), or null. */
  writeError: string | null
  sync: SyncStatus
  online: boolean
  viewport: string
  ua: string
  errors: { at: string; msg: string; src: string }[]
}

/**
 * Ask the controlling service worker which shell version it is. A device pinned on an old
 * VERSION while prod serves a newer one is the stale-shell bug, and this is the only way to
 * see it. Resolves to 'none' (no SW) or 'no reply' (SW predates the VERSION handler — itself
 * a strong hint the shell is stale) rather than hanging.
 */
function swVersion(): Promise<string> {
  return new Promise((resolve) => {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined
    if (!sw?.controller) { resolve('none'); return }
    // Declared in dependency order so the timer needs no deferred `let`: each of these is only
    // CALLED later, so referring forward is safe, and every binding can be const.
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'VERSION') { cleanup(); resolve(String(e.data.version)) }
    }
    const timer = setTimeout(() => { cleanup(); resolve('no reply') }, 1000)
    const cleanup = () => { clearTimeout(timer); sw.removeEventListener('message', onMsg) }
    sw.addEventListener('message', onMsg)
    sw.controller.postMessage({ type: 'VERSION' })
  })
}

async function storageUsedMb(): Promise<{ used: string; quota: string }> {
  const mb = (n?: number) => (n ? `${(n / 1_048_576).toFixed(1)}MB` : 'unknown')
  try {
    const [est, kept] = await Promise.all([navigator.storage?.estimate?.(), navigator.storage?.persisted?.().catch(() => undefined)])
    return { used: mb(est?.usage), quota: `${mb(est?.quota)} quota, ${kept === undefined ? 'persist unknown' : kept ? 'persistent' : 'not persistent'}` }
  } catch { return { used: 'unknown', quota: 'unknown' } }
}

/** Collect the snapshot. Never throws — a broken diagnostic must still produce a sendable block. */
export async function collectDiagnostics(learnerIdOverride?: string): Promise<Diagnostics> {
  const [version, used, session] = await Promise.all([
    swVersion().catch(() => 'error'),
    storageUsedMb(),
    getCurrentSession().catch(() => null),
  ])

  return {
    at: new Date().toISOString(),
    swVersion: version,
    swControlling: !!navigator.serviceWorker?.controller,
    accountId: session?.user?.id ?? 'signed out',
    accountEmail: session?.user?.email ?? 'signed out',
    learnerId: learnerIdOverride ?? getActiveLearner()?.id ?? 'none selected',
    storeMode: kv.mode(),
    queuedSessions: pendingLessonUploads(),
    storageUsedMb: used.used,
    storageQuota: used.quota,
    writeError: kv.writeError(),
    sync: getSyncStatus(),
    online: navigator.onLine,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    ua: navigator.userAgent.slice(0, 200),
    errors: getRecentErrors(),
  }
}

/** Render the snapshot as the plain-text block that goes in the support email. */
export function formatDiagnostics(d: Diagnostics): string {
  const lines = [
    `--- Radlic diagnostics (please keep this in your email) ---`,
    `time      ${d.at}`,
    `app       ${d.swVersion}${d.swControlling ? '' : ' (no service worker)'}`,
    `account   ${d.accountEmail}  ${d.accountId}`,
    `learner   ${d.learnerId}`,
    `storage   ${d.storeMode}, ${d.storageUsedMb} used, ${d.storageQuota}`,
    `unsynced  ${d.queuedSessions} session(s)`,
    `last sent ${d.sync.okAt ?? 'never on this device'}`,
    `sync err  ${d.sync.error ? `${d.sync.error.code} at ${d.sync.error.at}` : 'none recorded'}`,
    `network   ${d.online ? 'online' : 'OFFLINE'}`,
    `screen    ${d.viewport}`,
    `browser   ${d.ua}`,
  ]
  if (d.writeError) lines.push(`save err  ${d.writeError}`)
  if (d.errors.length) {
    lines.push(`recent errors:`)
    for (const e of d.errors) lines.push(`  ${e.at}  [${e.src}] ${e.msg}`)
  } else {
    lines.push(`recent errors: none recorded`)
  }
  lines.push(`---`)
  return lines.join('\n')
}

// Re-exported so existing importers (SupportPanel) keep their import path, while the VALUE has
// exactly one definition — see app/site.ts.
export { SUPPORT_EMAIL } from '@/app/site'
import { SUPPORT_EMAIL } from '@/app/site'

/** Build the `mailto:` a parent's "Email support" button opens. */
export function supportMailto(block: string, note: string): string {
  const body = [
    note.trim() || '(please describe what happened, and what you expected instead)',
    '',
    '',
    block,
  ].join('\n')
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Radlic — problem report')}&body=${encodeURIComponent(body)}`
}
