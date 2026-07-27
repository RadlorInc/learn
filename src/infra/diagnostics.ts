'use client'
/**
 * diagnostics — the device-side snapshot a parent sends with a support request.
 *
 * THE PROBLEM THIS SOLVES. Milo is local-first: progress lives in IndexedDB on the child's
 * device and syncs up through a queue. So the failures parents actually report are, more often
 * than not, entirely invisible from the server:
 *
 *   "her stars vanished"      → the offline queue is full and never flushed
 *   "it won't load"           → a stale service-worker shell after a deploy
 *   "nothing saves"           → IndexedDB blocked/hung, running on the localStorage fallback
 *   "Milo doesn't talk"       → speech never unlocked on that browser
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
import { getQueuedSessions, getQueuedDiagnostics } from '@/infra/useOfflineSync'
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
  queuedDiagnostics: number
  storageUsedMb: string
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
    let timer: ReturnType<typeof setTimeout>
    const cleanup = () => { clearTimeout(timer); sw.removeEventListener('message', onMsg) }
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'VERSION') { cleanup(); resolve(String(e.data.version)) }
    }
    sw.addEventListener('message', onMsg)
    timer = setTimeout(() => { cleanup(); resolve('no reply') }, 1000)
    sw.controller.postMessage({ type: 'VERSION' })
  })
}

async function storageUsedMb(): Promise<string> {
  try {
    const est = await navigator.storage?.estimate?.()
    return est?.usage ? `${(est.usage / 1_048_576).toFixed(1)}MB` : 'unknown'
  } catch { return 'unknown' }
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
    queuedSessions: getQueuedSessions().length,
    queuedDiagnostics: getQueuedDiagnostics().length,
    storageUsedMb: used,
    online: navigator.onLine,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    ua: navigator.userAgent.slice(0, 200),
    errors: getRecentErrors(),
  }
}

/** Render the snapshot as the plain-text block that goes in the support email. */
export function formatDiagnostics(d: Diagnostics): string {
  const lines = [
    `--- Milo diagnostics (please keep this in your email) ---`,
    `time      ${d.at}`,
    `app       ${d.swVersion}${d.swControlling ? '' : ' (no service worker)'}`,
    `account   ${d.accountEmail}  ${d.accountId}`,
    `learner   ${d.learnerId}`,
    `storage   ${d.storeMode}, ${d.storageUsedMb} used`,
    `unsynced  ${d.queuedSessions} session(s), ${d.queuedDiagnostics} check-up(s)`,
    `network   ${d.online ? 'online' : 'OFFLINE'}`,
    `screen    ${d.viewport}`,
    `browser   ${d.ua}`,
  ]
  if (d.errors.length) {
    lines.push(`recent errors:`)
    for (const e of d.errors) lines.push(`  ${e.at}  [${e.src}] ${e.msg}`)
  } else {
    lines.push(`recent errors: none recorded`)
  }
  lines.push(`---`)
  return lines.join('\n')
}

export const SUPPORT_EMAIL = 'support@mi2utor.com'

/** Build the `mailto:` a parent's "Email support" button opens. */
export function supportMailto(block: string, note: string): string {
  const body = [
    note.trim() || '(please describe what happened, and what you expected instead)',
    '',
    '',
    block,
  ].join('\n')
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Milo — problem report')}&body=${encodeURIComponent(body)}`
}
