import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { stripeClient } from '@/infra/stripe'

/**
 * POST /api/billing/ask-maths-cancel with the parent's token: Ask maths, the add-on, stops renewing — it runs to the
 * end of the month already paid for (docs/legal/01 §4, as the plan's cancel). Sends no id: the subscription is the
 * one on this account's own `addon_subscriptions` row, read with the caller's token (RLS), so nobody can cancel
 * another family's. The webhook then writes Stripe's new state to the row.
 */
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'ask-maths-cancel'), 10, 60_000)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!supabaseUrl || !anon || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const stripe = stripeClient()
  if (!stripe) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
  const rows = await fetch(`${supabaseUrl}/rest/v1/addon_subscriptions?product=eq.ask_maths&select=stripe_subscription_id`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  }).then(r => (r.ok ? r.json() : null)).catch(() => null)
  if (!Array.isArray(rows)) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const id = (rows as { stripe_subscription_id?: string | null }[])[0]?.stripe_subscription_id
  if (!id) return NextResponse.json({ error: 'no_subscription' }, { status: 404 })
  try {
    const sub = await stripe.subscriptions.update(id, { cancel_at_period_end: true })
    return NextResponse.json({ ok: true, cancel_at_period_end: sub.cancel_at_period_end })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
