import Stripe from 'stripe'

/**
 * The Stripe client. SERVER ONLY — nothing here may be imported from a component.
 *
 * ⚠️⚠️ TEST MODE IS ENFORCED HERE, IN CODE, FOR THE WHOLE OF STAGE 2 — founder's hard constraint,
 * 2026-08-25, and the reason it is a throw rather than a note is that a rule somebody has to
 * remember is not a constraint. Two things outrank the convenience of a live key today:
 *
 *   1. **B12 is open.** There is no backup of the children's data, and the first real payment is
 *      the moment losing that database stops being recoverable by apology.
 *   2. **Checkout is the one piece that can charge someone before `enforced` has any say.** The
 *      paywall flag gates ACCESS, not PAYMENT — `billing_config.enforced = false` is NOT a safety
 *      net for this stage and must not be sold as one.
 *
 * Going live is steps 4 and 5 of the ordered sequence in docs/billing-stage-2.md, and removing this
 * guard is part of step 4 — deliberately, so that it cannot happen as a side effect of a deploy.
 */

/** ⚠️ THE WHOLE OF THE TEST-MODE CONSTRAINT IS THIS PREFIX. Stripe's own key format is what makes
 *  it checkable at all: a live secret key is `sk_live_`, a test one `sk_test_`. */
const TEST_KEY = /^sk_test_/

let _stripe: Stripe | null = null

/**
 * Null when no key is configured — which is the state of every environment today, and must stay a
 * quiet no-op rather than a crash (the routes answer 503, nothing else in the app notices).
 * THROWS on a live key: an unconfigured checkout is an inconvenience, a live checkout right now is
 * a parent's card charged against a placeholder ToS with no database backup.
 */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!TEST_KEY.test(key)) {
    throw new Error(
      'STRIPE_SECRET_KEY is not a test key. Stage 2 is test mode only — see docs/billing-stage-2.md §0.',
    )
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
