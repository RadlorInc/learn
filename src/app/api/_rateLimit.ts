/**
 * A fixed-window rate limit for the app's PUBLIC, unauthenticated POST endpoints.
 *
 * Why it exists: `/api/lead` writes a row to the database and `/api/report-error` writes to the log
 * and (once MONITORING_INGEST_URL is set) forwards to a paid sink. Both are reachable by anyone with
 * the URL, and neither had any limit at all.
 *
 * ponytail: in-memory and PER SERVERLESS INSTANCE, so a distributed flood still gets through in
 * proportion to how many instances Vercel spins up, and a cold start forgets everything. That is a
 * deliberate ceiling, not an oversight — it raises the cost of casual abuse from free to annoying
 * with no account, no new dependency and no shared store. The real answer is the Vercel WAF (plan
 * item B8, founder-only) and, if it is ever worth a dependency, a shared counter in Upstash/Redis.
 * Keep this even then: it is the layer that survives the WAF being misconfigured.
 */

/** Bucket → window start + count. Bounded by MAX_KEYS so a flood of unique IPs cannot grow it. */
const hits = new Map<string, { start: number; n: number }>()
const MAX_KEYS = 5_000

/** The caller's IP as the CDN sees it. `x-forwarded-for` is a list; the FIRST entry is the client.
 *  ⚠️ Do not fall back to a constant — that buckets every anonymous caller together and one abuser
 *  then locks out every real visitor. An unidentifiable caller gets its own pass-through key. */
export function callerKey(req: Request, salt = ''): string {
  const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = fwd || req.headers.get('x-real-ip') || ''
  return ip ? `${salt}:${ip}` : `${salt}:unknown:${Math.random()}`
}

/** True if this call is over the limit. `limit` calls per `windowMs`, counted per key. */
export function overLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const cur = hits.get(key)
  if (!cur || now - cur.start >= windowMs) {
    // Evict opportunistically rather than on a timer: no interval to leak in a serverless runtime.
    if (hits.size >= MAX_KEYS) {
      for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k)
      if (hits.size >= MAX_KEYS) hits.clear()   // all live: drop the whole window rather than grow
    }
    hits.set(key, { start: now, n: 1 })
    return false
  }
  cur.n += 1
  return cur.n > limit
}

/** Test seam — the windows are minutes long, so a suite cannot wait them out. */
export function __resetRateLimit(): void { hits.clear() }
