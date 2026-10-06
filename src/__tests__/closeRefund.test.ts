// @vitest-environment node
/**
 * CLOSE THE ACCOUNT, OR WITHDRAW FOR EVERY CHILD → THE PLAN IS CANCELLED NOW AND THE UNUSED PART REFUNDED
 * (founder, 6 Oct 2026; docs/legal/01 §4, §5; migration 20261008000000).
 *
 * Driven the whole way: the parent's own RPC runs on the repo's schema (PGlite), then the SERVER's drain runs with
 * `fetch` pointed at that same database for Supabase and at a stand-in Stripe (the SDK's own fetch client hitting
 * api.stripe.com) that keeps state and honours idempotency keys the way Stripe does. So "refunded once" is a count of
 * refunds Stripe holds, and "after the deletion" is proven by first showing the subscriptions row is gone.
 *
 * ⚠️ Every amount is worked out by hand in the comment beside it, never computed from `unusedCents`.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'
import { unusedCents } from '@/features/billing/closeRefund'
import { __resetStripe } from '@/infra/stripe'

const DAY = 86_400
const T = (iso: string) => Date.parse(iso) / 1000

// ── 1. The calculation, against hand-worked amounts ─────────────────────────────────────────────
describe('the refund for one payment', () => {
  it('monthly, mid-period: $12.98 for 1–31 Oct, actioned 16 Oct 12:00 → 14 full days of 30 left → $6.05', () => {
    // 15.5 days after the payment (past the 14-day window). 1298 × 14 / 30 = 605.73 → 605.
    expect(unusedCents({ paid: 1298, start: T('2026-10-01T00:00:00Z'), end: T('2026-10-31T00:00:00Z'),
      paidAt: T('2026-10-01T00:00:00Z'), actioned: T('2026-10-16T12:00:00Z') })).toBe(605)
  })
  it('annual, about three months in: $75.99 for 2026, actioned 1 Apr 09:00 → 274 of 365 days → $57.04', () => {
    // Jan 31 + Feb 28 + Mar 31 = 90 days + 9 h used; 365 − 90.375 = 274.625 → 274 full days.
    // 7599 × 274 = 2,082,126; ÷ 365 = 5704.45 → 5704.
    expect(unusedCents({ paid: 7599, start: T('2026-01-01T00:00:00Z'), end: T('2027-01-01T00:00:00Z'),
      paidAt: T('2026-01-01T00:00:00Z'), actioned: T('2026-04-01T09:00:00Z') })).toBe(5704)
  })
  it('within 14 days of the payment: the whole payment ($7.99, 10 days in)', () => {
    expect(unusedCents({ paid: 799, start: T('2026-10-01T00:00:00Z'), end: T('2026-10-31T00:00:00Z'),
      paidAt: T('2026-10-01T00:00:00Z'), actioned: T('2026-10-11T00:00:00Z') })).toBe(799)
  })
  it('the last day: 6 hours left is no full day → nothing', () => {
    expect(unusedCents({ paid: 799, start: T('2026-10-01T00:00:00Z'), end: T('2026-10-31T00:00:00Z'),
      paidAt: T('2026-10-01T00:00:00Z'), actioned: T('2026-10-30T18:00:00Z') })).toBe(0)
  })
  it('a $0 payment refunds nothing, even inside the window', () => {
    expect(unusedCents({ paid: 0, start: T('2026-10-01T00:00:00Z'), end: T('2026-10-31T00:00:00Z'),
      paidAt: T('2026-10-01T00:00:00Z'), actioned: T('2026-10-02T00:00:00Z') })).toBe(0)
  })
  it('a charge made AFTER the request (a renewal while Stripe could not be reached) is refunded in full', () => {
    expect(unusedCents({ paid: 799, start: T('2026-11-01T00:00:00Z'), end: T('2026-12-01T00:00:00Z'),
      paidAt: T('2026-11-01T00:00:00Z'), actioned: T('2026-10-29T00:00:00Z') })).toBe(799)
  })
})

// ── 2. The stand-ins ────────────────────────────────────────────────────────────────────────────
let db: PGlite
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows

type Sub = { id: string; object: 'subscription'; status: string; customer: string; canceled_at: number | null; metadata: Record<string, string>; items: unknown }
type Inv = Record<string, unknown>
type Refund = { id: string; object: 'refund'; amount: number; payment_intent: string; status: string }
const stripe = { subs: {} as Record<string, Sub>, invoices: {} as Record<string, Inv[]>, refunds: [] as Refund[], emails: {} as Record<string, string> }
const keys = new Map<string, Response>()          // Stripe's idempotency: the same key gets the first answer back
let stripeDown = false
const calls: { method: string; url: string; key: string | null; body: string }[] = []
const mails: { to: string[]; subject: string; text: string }[] = []

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

async function fakeFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const url = String(input instanceof Request ? input.url : input)
  const method = (init.method ?? 'GET').toUpperCase()
  const rpc = url.match(/^http:\/\/sb\.test\/rest\/v1\/rpc\/(\w+)$/)
  if (rpc) {
    const args = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>
    const names = Object.keys(args)
    await db.exec('set role service_role')
    try {
      const res = await db.query(`select * from public.${rpc[1]}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')})`, names.map(n => args[n]))
      return rpc[1] === 'billing_cancellation_record' ? new Response(null, { status: 204 }) : json(res.rows)
    } finally { await db.exec('reset role') }
  }
  if (url.startsWith('http://sb.test/rest/v1/email_undeliverable')) return json([])
  if (url.startsWith('http://sb.test/rest/v1/error_events')) return new Response(null, { status: 201 })
  if (url === 'http://resend.test/emails') { mails.push(JSON.parse(String(init.body))); return json({ id: `em_${mails.length}` }) }

  if (!url.startsWith('https://api.stripe.com/v1/')) throw new Error(`unexpected fetch ${url}`)
  const key = new Headers(init.headers).get('idempotency-key')
  calls.push({ method, url, key, body: String(init.body ?? '') })
  if (stripeDown) return new Response(JSON.stringify({ error: { type: 'api_error', message: 'Stripe is down' } }),
    { status: 500, headers: { 'Content-Type': 'application/json', 'Stripe-Should-Retry': 'false' } })
  if (key && keys.has(`${method} ${key}`)) return keys.get(`${method} ${key}`)!.clone()
  const u = new URL(url)
  const path = u.pathname.replace('/v1/', '')
  let res: Response
  let m: RegExpMatchArray | null
  if ((m = path.match(/^subscriptions\/([^/]+)$/))) {
    const s = stripe.subs[m[1]]
    if (!s) return json({ error: { type: 'invalid_request_error', code: 'resource_missing' } }, 404)
    if (method === 'DELETE') { s.status = 'canceled'; s.canceled_at = Math.floor(Date.now() / 1000) }
    res = json(s)
  } else if (path === 'invoices') {
    res = json({ object: 'list', has_more: false, data: stripe.invoices[u.searchParams.get('subscription') ?? ''] ?? [] })
  } else if (path === 'refunds' && method === 'GET') {
    res = json({ object: 'list', has_more: false, data: stripe.refunds.filter(r => r.payment_intent === u.searchParams.get('payment_intent')) })
  } else if (path === 'refunds' && method === 'POST') {
    const f = new URLSearchParams(String(init.body))
    const r: Refund = { id: `re_${stripe.refunds.length + 1}`, object: 'refund', amount: Number(f.get('amount')), payment_intent: f.get('payment_intent')!, status: 'succeeded' }
    stripe.refunds.push(r)
    res = json(r)
  } else if ((m = path.match(/^customers\/([^/]+)$/))) {
    res = json({ id: m[1], object: 'customer', email: stripe.emails[m[1]] ?? null })
  } else return json({ error: { message: `unexpected ${method} ${path}` } }, 400)
  if (key) keys.set(`${method} ${key}`, res.clone())
  return res
}

// ── 3. People, plans, payments ──────────────────────────────────────────────────────────────────
let n = 0
async function family(opts: { invoices?: (now: number) => Inv[]; status?: string } = {}) {
  const i = ++n
  const id = `eeeeeeee-eeee-4eee-8eee-${String(i).padStart(12, '0')}`
  const email = `fam${i}@x.test`, sub = `sub_${i}`, cus = `cus_${i}`
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${id}', '${email}', now());
    insert into public.profiles (id, role) values ('${id}', 'parent') on conflict (id) do update set role = excluded.role;
    insert into public.subscriptions (account_id, stripe_customer_id, stripe_subscription_id, status, seats_paid)
      values ('${id}', '${cus}', '${sub}', 'active', 2);`)
  stripe.subs[sub] = { id: sub, object: 'subscription', status: opts.status ?? 'active', customer: cus, canceled_at: null, metadata: { account_id: id }, items: { object: 'list', data: [] } }
  stripe.emails[cus] = `paid-with-${i}@x.test`
  stripe.invoices[sub] = opts.invoices?.(Math.floor(Date.now() / 1000)) ?? []
  return { id, email, sub, cus, paidWith: `paid-with-${i}@x.test` }
}
const invoice = (id: string, paid: number, start: number, end: number, paidAt = start, pi = `pi_${id}`): Inv => ({
  id, object: 'invoice', status: 'paid', amount_paid: paid, status_transitions: { paid_at: paidAt },
  lines: { object: 'list', data: [{ id: `il_${id}`, object: 'line_item', period: { start, end } }] },
  payments: { object: 'list', data: [{ id: `inpay_${id}`, object: 'invoice_payment', status: 'paid', payment: { type: 'payment_intent', payment_intent: pi } }] },
})

async function asUser(uid: string, sql: string, jwt: Record<string, unknown> = {}) {
  await db.exec(`select set_config('test.uid', '${uid}', false), set_config('test.jwt', '${JSON.stringify(jwt)}', false)`)
  await db.exec('set role authenticated')
  try { await db.query(sql) } finally { await db.exec('reset role') }
}
const close = async (f: { id: string; email: string }) => {
  const now = Math.floor(Date.now() / 1000)
  await asUser(f.id, `select public.delete_my_account('${f.email}')`, { email: f.email, iat: now, amr: [{ method: 'password', timestamp: now - 30 }] })
}
const queued = async (sub: string) => (await q<{ queued_because: string; result: string | null }>(
  `select queued_because, result from public.billing_cancellations where stripe_subscription_id = $1`, [sub]))[0]
const drain = async () => (await import('@/features/billing/closeRefund')).drainBillingCancellations()
const writes = (sub: string) => calls.filter(c => c.method !== 'GET' && (c.url.includes(sub) || c.body.includes(sub)))
const refundsOn = (pi: string) => stripe.refunds.filter(r => r.payment_intent === pi)

beforeAll(async () => {
  ({ db } = await loadSchema())
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://sb.test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service')
  vi.stubEnv('RESEND_API_KEY', 'resend')
  vi.stubEnv('RESEND_API_URL', 'http://resend.test')
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_close')
  vi.stubGlobal('fetch', fakeFetch)
}, 120_000)
afterAll(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); __resetStripe() })
beforeEach(() => { __resetStripe(); stripeDown = false; calls.length = 0; mails.length = 0; vi.spyOn(console, 'error').mockImplementation(() => {}) })

// ── 4. The rules, driven ─────────────────────────────────────────────────────────────────────────
describe('closing the account cancels the plan now and refunds the unused part', () => {
  it('cancels and refunds AFTER the subscriptions row is gone — from the id the database captured — and emails the amount', async () => {
    // $12.98 paid 15.5 days ago for a 30-day month: 14 full days left → 1298 × 14 / 30 = 605.73 → $6.05.
    const f = await family({ invoices: now => [invoice('in_m', 1298, now - 15.5 * DAY, now + 14.5 * DAY)] })
    const other = await family({ invoices: now => [invoice('in_other', 799, now - 20 * DAY, now + 10 * DAY)] })
    await close(f)
    expect(await q(`select 1 from public.subscriptions where account_id = '${f.id}'`), 'control: the row is deleted').toEqual([])
    expect(await q(`select 1 from auth.users where id = '${f.id}'`), 'control: the account is gone').toEqual([])
    expect(await queued(f.sub)).toEqual({ queued_because: 'account_closed', result: null })

    expect(await drain()).toBe(1)
    const [cancel, refund, ...more] = writes(f.sub)
    expect(more).toEqual([])
    expect(cancel).toMatchObject({ method: 'DELETE', url: `https://api.stripe.com/v1/subscriptions/${f.sub}`, key: `close-cancel-${f.sub}` })
    expect(refund).toMatchObject({ method: 'POST', url: 'https://api.stripe.com/v1/refunds', key: `close-refund-${f.sub}-in_m` })
    expect(stripe.subs[f.sub].status).toBe('canceled')
    expect(refundsOn('pi_in_m').map(r => r.amount)).toEqual([605])
    expect((await queued(f.sub)).result).toMatch(/^done: cancelled now; refunded 605/)

    const [mail, ...extra] = mails
    expect(extra).toEqual([])
    expect(mail.to).toEqual([f.paidWith])
    expect(mail.subject).toBe('Your Radlic subscription is cancelled')
    expect(mail.text).toContain('Your Radlic subscription is cancelled from today. You will not be charged again.')
    expect(mail.text).toContain('We have refunded $6.05, the part of your plan you had not used.')

    // Positive twin: another family's plan is not touched.
    expect(writes(other.sub)).toEqual([])
    expect(stripe.subs[other.sub].status).toBe('active')
  })

  it('is once per account: a second drain, a retry after the keys expire, and two racing drains each refund nothing more', async () => {
    const f = await family({ invoices: now => [invoice('in_once', 1298, now - 15.5 * DAY, now + 14.5 * DAY)] })
    await close(f)
    await drain()
    expect(refundsOn('pi_in_once').length).toBe(1)

    calls.length = 0
    expect(await drain(), 'the settled row is not due again').toBe(0)
    expect(calls).toEqual([])

    // The row reopened and Stripe's idempotency keys long expired: Stripe's own state still stops a second payment.
    keys.clear()
    await q(`update public.billing_cancellations set result = null where stripe_subscription_id = $1`, [f.sub])
    await drain()
    expect(writes(f.sub), 'no second cancel, no second refund').toEqual([])
    expect(refundsOn('pi_in_once').map(r => r.amount)).toEqual([605])
    expect((await queued(f.sub)).result).toMatch(/^done: already canceled; refunded 0; in_once already refunded/)

    // Two drains at once (the dashboard's call and the cron): Stripe answers the second with the first's refund.
    const g = await family({ invoices: now => [invoice('in_race', 799, now - 3 * DAY, now + 27 * DAY)] })
    await close(g)
    await Promise.all([drain(), drain()])
    expect(refundsOn('pi_in_race').map(r => r.amount), 'within 14 days → the whole $7.99, once').toEqual([799])
  })

  it('the last day, a $0 invoice and an already-refunded payment refund nothing — the plan is still cancelled', async () => {
    const last = await family({ invoices: now => [invoice('in_last', 799, now - 29.75 * DAY, now + 0.25 * DAY)] })
    const zero = await family({ invoices: now => [invoice('in_zero', 0, now - 20 * DAY, now + 10 * DAY)] })
    const done = await family({ invoices: now => [invoice('in_done', 799, now - 20 * DAY, now + 10 * DAY)] })
    stripe.refunds.push({ id: 're_by_hand', object: 'refund', amount: 799, payment_intent: 'pi_in_done', status: 'succeeded' })
    for (const f of [last, zero, done]) await close(f)
    await drain()
    for (const f of [last, zero, done]) {
      expect(stripe.subs[f.sub].status).toBe('canceled')
      expect(writes(f.sub).map(c => c.method), `${f.sub}: only the cancel`).toEqual(['DELETE'])
    }
    expect(refundsOn('pi_in_done').map(r => r.id)).toEqual(['re_by_hand'])
    expect(mails.filter(m => m.to[0] === last.paidWith)[0].text).toContain('There is no unused part of your plan left to refund.')
  })

  it('a plan with a seat added mid-period refunds both payments, each by its own period', async () => {
    // Month: $7.99 paid 19.5 days ago, 10 full days left of 30 → 799 × 10 / 30 = 266.33 → 266.
    // Seat: $1.66 paid 15.5 days ago for the 26 days to period end, 10 left → 166 × 10 / 26 = 63.85 → 63.
    const f = await family({ invoices: now => [
      invoice('in_seat', 166, now - 15.5 * DAY, now + 10.5 * DAY),
      invoice('in_month', 799, now - 19.5 * DAY, now + 10.5 * DAY),
    ] })
    await close(f)
    await drain()
    expect(refundsOn('pi_in_month').map(r => r.amount)).toEqual([266])
    expect(refundsOn('pi_in_seat').map(r => r.amount)).toEqual([63])
    expect(mails[0].text).toContain('We have refunded $3.29')
  })
})

describe('withdrawing permission for every child does the same; one child does not', () => {
  it('withdraw_my_consent queues the plan, the account stays, and the annual plan is refunded pro rata', async () => {
    // $75.99 for 365 days, 90.375 days used: 274 full days left → 7599 × 274 / 365 = 5704.45 → $57.04.
    const f = await family({ invoices: now => [invoice('in_year', 7599, now - 90.375 * DAY, now + 274.625 * DAY)] })
    await asUser(f.id, `select public.withdraw_my_consent()`)
    expect(await q(`select 1 from auth.users where id = '${f.id}'`), 'the account stays open').toHaveLength(1)
    expect(await queued(f.sub)).toEqual({ queued_because: 'consent_withdrawn', result: null })
    await drain()
    expect(stripe.subs[f.sub].status).toBe('canceled')
    expect(refundsOn('pi_in_year').map(r => r.amount)).toEqual([5704])

    // …and closing the account later keeps the withdrawal's earlier time: the trigger's insert is a no-op.
    await close(f)
    expect(await queued(f.sub)).toMatchObject({ queued_because: 'consent_withdrawn' })
  })

  it('deleting ONE child (the per-child path) queues nothing — not decided, out of scope', async () => {
    const f = await family()
    const consent = await grantedConsent(db, f.id)
    const [{ id: kid }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
      values ('Kid', 0, '6-8', '${f.id}', '${consent}', '${FIXTURE_NOTICE}') returning id`)
    await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${f.id}', 'owner') on conflict do nothing`)
    await asUser(f.id, `select public.delete_learner('${kid}')`)
    expect(await q(`select 1 from public.learners where id = '${kid}'`), 'control: the child is deleted').toEqual([])
    expect(await queued(f.sub)).toBeUndefined()
  })
})

describe('Stripe down: the close goes through, the money is owed, retried and flagged', () => {
  it('never blocks the close; leaves the row due with an error; the next drain settles it with the same refund', async () => {
    // $12.98 paid 18.5 days ago for 30 days. The close is then dated 3 days back (Stripe down for 3 days): counted from
    // the close, 15.5 days after the payment, 14 full days left → 1298 × 14 / 30 = 605. Counted from the retry it would
    // be 11 days → 475.
    const f = await family({ invoices: now => [invoice('in_down', 1298, now - 18.5 * DAY, now + 11.5 * DAY)] })
    stripeDown = true
    await close(f)
    expect(await q(`select 1 from auth.users where id = '${f.id}'`), 'the close was not blocked').toEqual([])
    await drain()
    expect((await queued(f.sub)).result).toMatch(/^error: /)
    expect(refundsOn('pi_in_down')).toEqual([])
    // What the ops digest counts (billing_cancellations_owed): the row is still due.
    await db.exec('set role service_role')
    try {
      expect((await q<{ stripe_subscription_id: string }>(`select stripe_subscription_id from public.billing_cancellations_due()`))
        .map(r => r.stripe_subscription_id)).toContain(f.sub)
    } finally { await db.exec('reset role') }

    await q(`update public.billing_cancellations set queued_at = queued_at - interval '3 days' where stripe_subscription_id = $1`, [f.sub])
    stripeDown = false
    await drain()
    expect((await queued(f.sub)).result).toMatch(/^done: cancelled now; refunded 605/)
    expect(refundsOn('pi_in_down').map(r => r.amount), 'counted from when the close happened, not from the retry').toEqual([605])
  })
})

describe('the queue is the server\'s alone', () => {
  it('no client role can read or write it or call the drain functions; service_role can (positive twin)', async () => {
    const yes = async (sql: string) => (await q<{ ok: boolean }>(`select ${sql} as ok`))[0].ok
    for (const role of ['anon', 'authenticated']) {
      for (const priv of ['select', 'insert', 'update', 'delete']) {
        expect(await yes(`has_table_privilege('${role}', 'public.billing_cancellations', '${priv}')`), `${role} ${priv}`).toBe(false)
      }
      expect(await yes(`has_function_privilege('${role}', 'public.billing_cancellations_due()', 'execute')`)).toBe(false)
      expect(await yes(`has_function_privilege('${role}', 'public.billing_cancellation_record(text, text)', 'execute')`)).toBe(false)
    }
    expect(await yes(`has_table_privilege('service_role', 'public.billing_cancellations', 'select')`)).toBe(true)
    expect(await yes(`has_table_privilege('service_role', 'public.billing_cancellations', 'update')`)).toBe(true)
    expect(await yes(`has_table_privilege('service_role', 'public.billing_cancellations', 'insert')`)).toBe(false)
    expect(await yes(`has_function_privilege('service_role', 'public.billing_cancellations_due()', 'execute')`)).toBe(true)
  })
})
