import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../_rateLimit'

/**
 * Cold-funnel lead capture, moved OFF the browser.
 *
 * It used to insert straight from the client into `diagnostic_leads` with the anon key — and that
 * key is public by design, so there was no place a limit could go: anyone could POST the table
 * endpoint directly, for ever, for free (launch-plan finding #9). Behind this route the public
 * surface is ours, so it can be counted.
 *
 * ⚠️ THE CLIENT PATH IS ONLY REALLY CLOSED WHEN THE MIGRATION IS APPLIED —
 * `20260816170000_leads_server_only.sql` revokes the anon INSERT grant. Until then this route is
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
  if (!url || !key) return NextResponse.json({ ok: true })   // misconfigured ≠ break the checkup

  try {
    await fetch(`${url}/rest/v1/diagnostic_leads`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email, band }),
    })
  } catch {
    /* best-effort — a failed lead capture must never stop the checkup */
  }
  return NextResponse.json({ ok: true })
}
