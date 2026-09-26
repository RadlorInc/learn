/**
 * The URL a crash report is allowed to keep: origin + path + a short ALLOWLIST of query params.
 * The fragment is always dropped, and so is every param not named below.
 *
 * ⚠️ WHY AN ALLOWLIST (SEC-06, docs/review/SECURITY-AUDIT.md). Several pages carry a credential
 * in the URL: the consent token in `/consent/respond#t=…` (it can withdraw consent and delete
 * every child), `/email/unsubscribe#t=…`, `/auth/confirm?th=…`, `/auth/set-password?token_hash=…`,
 * and supabase-js's implicit-flow `#access_token=…&refresh_token=…`. A crash on any of them used
 * to store that URL in `error_events` for 90 days and in the logs. A denylist has to know every
 * future token name; an allowlist only has to know the harmless ones.
 *
 * Used on the client (`reportCrash`) AND again on the server (`sinkError`), because
 * `/api/report-error` is public and must not trust what a client sends.
 */
const KEEP = new Set(['id', 'module', 'c', 'summary', 'practice'])

export function safeUrl(raw: string | undefined): string | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined
  try {
    const relative = raw.startsWith('/') && !raw.startsWith('//')
    const u = new URL(raw, 'http://relative.invalid')
    const q = new URLSearchParams()
    for (const [k, v] of u.searchParams) if (KEEP.has(k)) q.append(k, v)
    const qs = q.toString()
    return (relative ? '' : u.origin) + u.pathname + (qs ? `?${qs}` : '')
  } catch {
    // Unparseable: keeping it could keep a token. Drop it — a crash report without a URL is fine.
    return undefined
  }
}
