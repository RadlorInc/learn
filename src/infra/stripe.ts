import Stripe from 'stripe'

/**
 * The Stripe client. SERVER ONLY — nothing here may be imported from a component.
 *
 * ⚠️⚠️ THE KEY'S MODE IS PINNED TO THE DEPLOYMENT, IN CODE (live launch, 2026-10-01):
 *
 *   - **Vercel Production** (`VERCEL_ENV=production`) accepts ONLY `sk_live_`. A test key there would
 *     "sell" plans with test cards — real access for no money.
 *   - **Everywhere else** (previews, staging, local, scripts) accepts ONLY `sk_test_`. A live key on a
 *     preview or a laptop charges a real card from code nobody reviewed for production.
 *
 * It is a throw, not a note, because a rule somebody has to remember is not a constraint. The
 * paywall flag gates ACCESS, not PAYMENT — `billing_config.enforced = false` is not a safety net here.
 */

/** Stripe's key format is what makes the mode checkable: `sk_live_` vs `sk_test_`. */
let _stripe: Stripe | null = null

/**
 * Null when no key is configured — a quiet no-op rather than a crash (the routes answer 503).
 * THROWS when the key's mode does not match the deployment (see above).
 */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  const want = process.env.VERCEL_ENV === 'production' ? 'sk_live_' : 'sk_test_'
  if (!key.startsWith(want)) {
    throw new Error(`STRIPE_SECRET_KEY must be an ${want} key in this environment — see src/infra/stripe.ts.`)
  }
  if (_stripe) return _stripe
  // ⚠️ THE FETCH CLIENT, NOT THE DEFAULT NODE ONE. Two reasons and both matter: it is the http
  // client that works on every serverless runtime, and it is what makes the webhook DRIVABLE in a
  // test — a stubbed global fetch can answer Stripe as well as PostgREST, so the handler is
  // exercised end to end instead of read.
  _stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })
  return _stripe
}

/** Test seam — the client is memoised, and a suite changes the key between cases. */
export function __resetStripe(): void { _stripe = null }
