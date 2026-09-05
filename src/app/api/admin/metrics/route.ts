/**
 * /api/admin/metrics — the ONLY read path for /admin.
 *
 * ⚠️ IT DOES NOT USE THE SERVICE ROLE. It forwards the CALLER'S OWN access token, so the request
 * arrives at Postgres as that user and `admin_assert()` inside each RPC decides. A non-admin gets
 * 42501 from the database itself, not from a check in this file that someone could later move.
 * `SUPABASE_SERVICE_ROLE_KEY` is never read here and must never be.
 *
 * ⚠️ THE SUPPRESSION THRESHOLD IS READ HERE, SERVER-SIDE, AND PASSED INTO THE QUERY. That is the
 * point: a bucket below it comes back NULL from SQL, so the number never reaches the browser at
 * all. Suppressing in the UI would leave the value sitting in a network response.
 */
import { NextRequest, NextResponse } from 'next/server'

const PAGES = { overview: 'admin_overview', learning: 'admin_learning', funnel: 'admin_funnel' } as const

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') ?? 'overview'
  const fn = PAGES[page as keyof typeof PAGES]
  if (!fn) return NextResponse.json({ error: 'unknown page' }, { status: 400 })

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'not configured' }, { status: 500 })

  // Default 5, per the brief. Set to 1 while the population is tiny; the UI shows a banner
  // whenever it is below 5 so nobody forgets that a small bucket can name a person.
  const minCohort = Number(process.env.ADMIN_MIN_COHORT ?? '5')

  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_min_cohort: Number.isFinite(minCohort) ? minCohort : 5 }),
    cache: 'no-store',
  })

  if (!r.ok) {
    const body = await r.text()
    // 42501 is admin_assert refusing. Answer 404 — /admin must not confirm it exists to someone
    // who may not see it, and the page itself renders notFound() on this.
    // 42501 is admin_assert refusing a SIGNED-IN non-admin -> 404, so /admin does not confirm it
    // exists to someone who may not see it.
    if (body.includes('42501') || r.status === 403) return NextResponse.json({ error: 'not found' }, { status: 404 })
    // ⚠️ A REJECTED TOKEN IS NOT AN UPSTREAM FAILURE. This used to fall through to 502 "query
    // failed", which says the database broke when in fact the caller was not authenticated — a
    // misleading status is its own small lie, and it is the one a debugger would chase first.
    if (r.status === 401) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    return NextResponse.json({ error: 'query failed' }, { status: 502 })
  }
  return NextResponse.json({ data: await r.json(), minCohort }, { headers: { 'Cache-Control': 'no-store' } })
}
