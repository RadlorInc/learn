import { callerKey, overLimit } from '../_rateLimit'

/**
 * POST /api/tester — the paid tester's page (/test) talks to Radlor Ops through here (docs/runbooks/testers.md).
 * The links and reviews live in the ops app's database, not this one; this route only forwards the body to its
 * `/api/radlic-tester` and hands the answer back, so the browser stays same-origin and the CSP names no new origin.
 * It reads and writes nothing of its own: no Supabase, no session, no child data.
 */
export const dynamic = 'force-dynamic'

const OPS = process.env.TESTER_API ?? 'https://ops.radlor.com'

export async function POST(req: Request) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  if (overLimit(callerKey(req, 'tester'), 60, 60_000)) return new Response('{"error":"slow_down"}', { status: 429, headers })
  const body = await req.text()
  if (body.length > 8_000) return new Response('{"error":"too_large"}', { status: 413, headers })
  const r = await fetch(`${OPS}/api/radlic-tester`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, cache: 'no-store' })
    .catch(() => null)
  if (!r) return new Response('{"error":"unreachable"}', { status: 502, headers })
  return new Response(r.status === 204 ? null : await r.text(), { status: r.status, headers })
}
