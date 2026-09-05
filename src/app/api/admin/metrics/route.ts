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

  /**
   * ⚠️ THE 404 IS DELIBERATELY AMBIGUOUS TO A STRANGER AND WAS ACCIDENTALLY AMBIGUOUS TO US.
   *
   * "This route does not exist" and "you are not an admin" are the same observation from outside —
   * which is correct, because /admin must not confirm it exists to someone who may not see it. On
   * 2026-09-05 that cost a debugging session: a real 404 in the console could have been a missing
   * deployment, a service worker, or a refusal, and nothing on the server said which.
   *
   * Resolved WITHOUT weakening the gate: the client still gets an indistinguishable 404, and the
   * server logs which of the three it was, tagged with a request id the UI also shows. The reader
   * with log access can tell them apart; the stranger still cannot.
   */
  const rid = crypto.randomUUID().slice(0, 8)

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    console.warn(`[admin/metrics ${rid}] REFUSED: no bearer token (page=${page})`)
    return NextResponse.json({ error: 'unauthenticated', rid }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error(`[admin/metrics ${rid}] MISCONFIGURED: NEXT_PUBLIC_SUPABASE_URL or key missing`)
    return NextResponse.json({ error: 'not configured', rid }, { status: 500 })
  }

  // Default 5, per the brief. Set to 1 while the population is tiny; the UI shows a banner
  // whenever it is below 5 so nobody forgets that a small bucket can name a person.
  /**
   * ⚠️ IT HAS A FALLBACK (5), SO AN UNSET VAR IS NOT A CRASH — BUT IT IS STILL A SILENT FAILURE IN
   * THE ONLY WAY THAT MATTERS: at 5, with 9 accounts in scope, nearly every bucket suppresses to an
   * em dash AND the red banner only showed below 5 — so the page read as broken with nothing
   * explaining why. The threshold is now always reported and always displayed.
   */
  const raw = process.env.ADMIN_MIN_COHORT
  const parsed = Number(raw ?? '5')
  const minCohort = Number.isFinite(parsed) && parsed > 0 ? parsed : 5
  if (raw === undefined) console.warn(`[admin/metrics ${rid}] ADMIN_MIN_COHORT unset — defaulting to 5; most buckets will suppress`)

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
    if (body.includes('42501') || r.status === 403) {
      // NOT an admin. The single most confusing case, because the client sees the same 404 it would
      // see if the route were absent.
      console.warn(`[admin/metrics ${rid}] REFUSED: caller is authenticated but NOT in admin_users (page=${page}) -> 404`)
      return NextResponse.json({ error: 'not found', rid }, { status: 404 })
    }
    // ⚠️ A REJECTED TOKEN IS NOT AN UPSTREAM FAILURE. This used to fall through to 502 "query
    // failed", which says the database broke when in fact the caller was not authenticated — a
    // misleading status is its own small lie, and it is the one a debugger would chase first.
    if (r.status === 401) {
      console.warn(`[admin/metrics ${rid}] REFUSED: token rejected by PostgREST (page=${page})`)
      return NextResponse.json({ error: 'unauthenticated', rid }, { status: 401 })
    }
    console.error(`[admin/metrics ${rid}] QUERY FAILED (page=${page}) HTTP ${r.status}: ${body.slice(0, 300)}`)
    return NextResponse.json({ error: 'query failed', rid }, { status: 502 })
  }
  console.log(`[admin/metrics ${rid}] OK (page=${page}, minCohort=${minCohort})`)
  return NextResponse.json({ data: await r.json(), minCohort, rid },
    { headers: { 'Cache-Control': 'no-store' } })
}
