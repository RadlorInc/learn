/**
 * Create (or verify) the Stripe product and its two graduated prices. **TEST MODE ONLY.**
 *
 *   npx tsx scripts/stripe-products.mts [--dry]
 *
 * Reads STRIPE_SECRET_KEY from the environment or .env.local (gitignored), so the key never goes on
 * a command line or into shell history. `stripeClient()` REFUSES a live key — that refusal is the
 * whole of Stage 2's hard constraint and it is deliberately the same one the routes use, so there
 * is a single definition of "test mode" rather than a copy here that can drift.
 *
 * IDEMPOTENT: a fixed product id and a `lookup_key` per price mean re-running finds what exists
 * instead of creating a second one. ⚠️ And it VERIFIES what it finds rather than assuming it — a
 * price is IMMUTABLE in Stripe, so an existing one that disagrees with the ladder cannot be
 * corrected in place; the script says so and stops rather than quietly leaving the wrong price in
 * service.
 *
 * ⚠️⚠️ THE VERIFICATION IS AGAINST THE LIVE PRICE OBJECT, NEVER AGAINST OUR CONFIG. `tiers_mode`
 * is the reason: VOLUME and GRADUATED price the same ladder differently, and with a decreasing
 * ladder volume is CHEAPER — so a price created the wrong way does not error, it under-charges
 * silently for ever. Reading it back off `src/core/billing.ts` would be a check that compares a
 * value with itself. It is Stripe that bills, so it is Stripe that is asked.
 */
import { readFileSync } from 'node:fs'
import { stripeClient } from '../src/infra/stripe.ts'
import { CURRENCY, LADDER, graduatedTiers, type Cadence } from '../src/core/billing.ts'

const DRY = process.argv.includes('--dry')

/** Env first, then .env.local — the same shape scripts/voice-generate.mts uses. */
if (!process.env.STRIPE_SECRET_KEY) {
  try {
    const m = readFileSync('.env.local', 'utf8').match(/^STRIPE_SECRET_KEY\s*=\s*(.+)$/m)
    if (m) process.env.STRIPE_SECRET_KEY = m[1].trim().replace(/^["']|["']$/g, '')
  } catch { /* no .env.local — the check below reports it */ }
}

const stripe = stripeClient()          // throws on a live key; null when none is set
if (!stripe) {
  console.error('STRIPE_SECRET_KEY is not set (env or .env.local). It must be an sk_test_ key.')
  process.exit(1)
}

const PRODUCT_ID = 'milo_family'
const LOOKUP: Record<Cadence, string> = { monthly: 'milo_family_monthly_v1', annual: 'milo_family_annual_v1' }

const usd = (c: number) => `$${(c / 100).toFixed(2)}`

async function ensureProduct() {
  try {
    const p = await stripe!.products.retrieve(PRODUCT_ID)
    console.log(`product   ${p.id} (exists)`)
    return p
  } catch {
    if (DRY) { console.log(`product   ${PRODUCT_ID} WOULD BE CREATED`); return null }
    const p = await stripe!.products.create({
      id: PRODUCT_ID,
      name: 'Milo — family plan',
      description: 'Adaptive maths for up to 4 children.',
    })
    console.log(`product   ${p.id} CREATED`)
    return p
  }
}

/** Everything the ladder claims, asked of the object Stripe will actually bill from. */
function verify(price: { tiers_mode?: string | null; currency?: string; recurring?: { interval?: string } | null; tiers?: ({ up_to: number | null; unit_amount: number | null } | undefined)[] | null }, c: Cadence): string[] {
  const want = graduatedTiers(c)
  const bad: string[] = []
  if (price.tiers_mode !== 'graduated') bad.push(`tiers_mode is "${price.tiers_mode}" — VOLUME UNDER-CHARGES SILENTLY`)
  if (price.currency !== CURRENCY) bad.push(`currency is ${price.currency}, want ${CURRENCY}`)
  if (price.recurring?.interval !== LADDER[c].interval) bad.push(`interval is ${price.recurring?.interval}, want ${LADDER[c].interval}`)
  const got = price.tiers ?? []
  if (got.length !== want.length) bad.push(`${got.length} tiers, want ${want.length}`)
  want.forEach((w, i) => {
    const g = got[i]
    if (!g) return
    // Stripe returns the unbounded tier as up_to: null.
    const gUp = g.up_to === null ? 'inf' : g.up_to
    if (gUp !== w.up_to) bad.push(`tier ${i + 1} up_to is ${gUp}, want ${w.up_to}`)
    if (g.unit_amount !== w.unit_amount) bad.push(`tier ${i + 1} is ${usd(g.unit_amount ?? 0)}, want ${usd(w.unit_amount)}`)
  })
  return bad
}

async function ensurePrice(c: Cadence) {
  const existing = await stripe!.prices.list({ lookup_keys: [LOOKUP[c]], expand: ['data.tiers'], limit: 1 })
  const found = existing.data[0]
  if (found) {
    const bad = verify(found, c)
    console.log(`price     ${c.padEnd(7)} ${found.id} (exists)`)
    if (bad.length) {
      console.error(`\n  ⚠️  ${found.id} DOES NOT MATCH THE LADDER:`)
      for (const b of bad) console.error(`      - ${b}`)
      console.error(
        '\n  A Stripe price is immutable. Bump the lookup key (…_v2) in this script, run it again,\n' +
        '  then point STRIPE_PRICE_* at the new id. Do NOT edit the old one.\n',
      )
      process.exitCode = 1
    }
    return found.id
  }
  if (DRY) { console.log(`price     ${c.padEnd(7)} WOULD BE CREATED (${LOOKUP[c]})`); return null }
  const created = await stripe!.prices.create({
    product: PRODUCT_ID,
    currency: CURRENCY,
    lookup_key: LOOKUP[c],
    recurring: { interval: LADDER[c].interval },
    billing_scheme: 'tiered',
    // ⚠️ GRADUATED. See the header — the wrong value here is a silent discount, not an error.
    tiers_mode: 'graduated',
    tiers: graduatedTiers(c).map(t => ({ up_to: t.up_to, unit_amount: t.unit_amount })),
    expand: ['tiers'],
  })
  const bad = verify(created, c)
  if (bad.length) {
    // Read back what was actually created, not what was sent — that is the difference between a
    // check and a restatement.
    console.error(`  ⚠️  the price Stripe created does not match what was asked for: ${bad.join('; ')}`)
    process.exitCode = 1
  }
  console.log(`price     ${c.padEnd(7)} ${created.id} CREATED`)
  return created.id
}

let monthly: string | null = null
let annual: string | null = null
try {
  await ensureProduct()
  monthly = await ensurePrice('monthly')
  annual = await ensurePrice('annual')
} catch (e) {
  // A bad key, no network, a permissions problem — say which, once, rather than a stack trace over
  // a half-created product.
  console.error(`\nStripe refused the call: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
}

console.log('\nthe ladder, as this run understands it:')
for (const c of ['monthly', 'annual'] as Cadence[]) {
  const t = graduatedTiers(c)
  console.log(`  ${c.padEnd(7)} seat 1 ${usd(t[0].unit_amount)} · each further seat ${usd(t[1].unit_amount)}`)
}
if (monthly && annual) {
  console.log('\nput these in the environment (Vercel + .env.local):')
  console.log(`  STRIPE_PRICE_MONTHLY=${monthly}`)
  console.log(`  STRIPE_PRICE_ANNUAL=${annual}`)
}
console.log(
  '\n⚠️  Statement descriptor (RADLOR MILO) is an ACCOUNT setting, not a price one — set it in the\n' +
  '    Stripe dashboard (Settings → Public details). It is step 4 of the go-live sequence.\n',
)
