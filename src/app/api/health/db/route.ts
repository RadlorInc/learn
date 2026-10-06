import { NextResponse } from 'next/server'

/**
 * "Can the app reach its database?" — for an uptime checker. `/api/health` stays shallow on purpose (it must not go
 * red on a database hiccup); this is the separate route that does.
 *
 * ⚠️ IT ANSWERS ONE BOOLEAN AND NOTHING ELSE: `{ db: true }` 200, or `{ db: false }` 503. No error text, no timing, no
 * version: a stranger learns only what the status code already says.
 * The probe is one `HEAD … limit=0` as the service role: Postgres runs a query, no row comes back, and the key never
 * leaves the server. The answer is held for 30 s per instance (and the CDN may hold it too), so calling this route
 * in a loop cannot turn into database load.
 */
export const dynamic = 'force-dynamic'

const TTL_MS = 30_000
let last: { at: number; ok: boolean } | null = null

async function probe(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false
  try {
    const r = await fetch(`${url}/rest/v1/error_events?select=id&limit=0`, {
      method: 'HEAD', headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store', signal: AbortSignal.timeout(3000),
    })
    return r.ok
  } catch { return false }
}

export async function GET() {
  if (!last || Date.now() - last.at > TTL_MS) last = { at: Date.now(), ok: await probe() }
  return NextResponse.json({ db: last.ok }, { status: last.ok ? 200 : 503, headers: { 'Cache-Control': 'public, s-maxage=30' } })
}
