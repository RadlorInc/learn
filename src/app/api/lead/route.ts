import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../_rateLimit'
import { sinkError } from '@/infra/errorSink'

/**
 * Cold-funnel lead capture, moved OFF the browser.
 *
 * It used to insert straight from the client into `diagnostic_leads` with the anon key — and that
 * key is public by design, so there was no place a limit could go: anyone could POST the table
 * endpoint directly, for ever, for free (launch-plan finding #9). Behind this route the public
 * surface is ours, so it can be counted.
 *
 * ⚠️ THE CLIENT PATH IS ONLY REALLY CLOSED WHEN THE MIGRATION IS APPLIED —
 * `20260823221818_leads_server_only.sql` revokes the anon INSERT grant. Until then this route is
 * an improvement rather than a wall, because the old direct path still exists for anyone who knows
 * it. Written that way on purpose: the route works with or without the migration, so there is no
 * ordering hazard between the deploy and the DDL (which is the founder's to run).
 */
export const dynamic = 'force-dynamic'

/** Six a minute per IP. A real visitor gives their email ONCE; the headroom is for a shared
 *  household/school NAT and a fat-fingered retry, not for a second use case. */
const LIMIT = 6
const WINDOW_MS = 60_000

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'lead'), LIMIT, WINDOW_MS)) {
    // 429 rather than a silent success: the client treats capture as best-effort either way, but a
    // truthful status is what makes this visible in the logs when it starts happening.
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''
  const band = typeof body.band === 'string' ? body.band.slice(0, 24) : null
  // Shape-check here as well as in the table's CHECK constraint: the constraint only bounds LENGTH,
  // so without this any 3-character string is a "lead" and the table fills with noise that still
  // satisfies the database.
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: 'bad_email' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // ⚠️ WAS `return NextResponse.json({ ok: true })` — "misconfigured ≠ break the checkup". The first
  // half is right (the checkup must not stop) and the second half was a LIE: nothing downstream
  // reads this, so the only thing `ok: true` bought was hiding a dead funnel. See the note below.
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
  }

  // ⚠️ `fetch` DOES NOT THROW ON 4xx/5xx, so a bare `await fetch(...)` inside try/catch reports a
  // 403 as success and the lead is gone with no signal anywhere. That is not hypothetical here: the
  // key above falls back to the ANON key when SUPABASE_SERVICE_ROLE_KEY is unset, and the moment
  // `20260823221818_leads_server_only.sql` revokes the anon INSERT grant every capture starts
  // 403ing. Silent is the one thing this must not be — a lead we never knew we lost is worse than
  // an error we can see. Still best-effort for the CALLER: it never throws and never returns non-ok.
  // Whether the row actually landed. The caller does not read this — `captureDiagnosticLead` does
  // `await fetch(...)` and never inspects the response — so reporting the truth costs the funnel
  // nothing and buys a real signal in the logs and in any uptime check pointed here.
  let recorded = false
  try {
    const res = await fetch(`${url}/rest/v1/diagnostic_leads`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email, band }),
    })
    recorded = res.ok
    if (!res.ok) {
      // Body, not just the status: PostgREST puts the actual reason (RLS, grant, constraint) there.
      const detail = await res.text().catch(() => '')
      await sinkError({
        at: new Date().toISOString(),
        source: 'server',
        message: `lead insert failed ${res.status}: ${detail.slice(0, 300)}`,
        routePath: '/api/lead',
      })
    }
  } catch (e) {
    await sinkError({
      at: new Date().toISOString(),
      source: 'server',
      message: `lead insert threw: ${e instanceof Error ? e.message : String(e)}`,
      routePath: '/api/lead',
    }).catch(() => {})
  }
  // ⚠️⚠️ THIS USED TO BE AN UNCONDITIONAL `{ ok: true }`, AND THAT IS THE DEFECT THE WHOLE FILE
  // WARNS ABOUT, ONE LAYER UP. The route carefully checked `res.ok`, carefully logged the failure —
  // and then told the caller it had succeeded anyway. A revoked grant, an absent service-role key
  // and a PostgREST outage all looked identical to a captured lead from outside, which is exactly
  // how a dead funnel stays dead quietly. Same family as V14, which this file's own comment
  // describes.
  //
  // Still best-effort FOR THE CHILD: the client swallows this and the checkup continues either way.
  return recorded
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false, error: 'not_recorded' }, { status: 502 })
}
