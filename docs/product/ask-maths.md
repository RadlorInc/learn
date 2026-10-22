# Ask maths

A child in Grades 3–8 types a maths question and watches a whiteboard lesson drawn and spoken for it: the marker
draws, parts move, a voice explains step by step. It is the meeting point of Radlic and askRadlor (the Whiteboard AI
app, RadlorInc/whiteboard-ai): askRadlor makes the lesson, Radlic is where a child asks. askRadlor itself has no maths
subject for the public on purpose, because maths for children lives here.

**Status (21 October 2026): built, OFF.** It stays off until every item in [Before it is turned on](#before-it-is-turned-on)
is done. The live notice (notice-v8, docs/legal/02), the subprocessor list (docs/legal/07) and the privacy policy
(docs/legal/11) say that nothing a child types reaches an AI service, and they stay true while it is off.

## What the child and the parent see

- **Child** (`/ask`): an "✏️ Ask maths" pill on the home (`/modules`) appears only when the child's grown-up has switched
  it on. One text box (300 characters), a few example questions for the child's band, the board, and play/pause,
  back/next and "Watch again". Refusals are in plain words with no price, plan or "locked" anywhere
  (`childWords.test.ts` covers the page). A credit line names the voice (CC BY 4.0).
- **Parent** (a child's page → **Ask maths** tab, `src/features/dashboard/AskMathsCard.tsx`): the add-on (one price
  for the family, `ASK_MATHS_MONTHLY_CENTS`, monthly, with an auto-renewal tick box), then per child the
  disclosure to agree to and the switch, the number of questions a day (1–20, default 5), and every question of the
  last 30 days with its outcome. An answered one can be watched again; "Delete all of …'s questions now" deletes them.
  The questions and settings are also in the child's data download.

## How a question travels

```
child's browser ──POST /api/ask-maths (child's or parent's token)──▶ Radlic server
   1. ask_maths_begin (as the caller): access, band 9-11/12-14, switch on, add-on paid, one at a time, daily limit
      → a 'pending' row in ask_maths_questions
   2. ──POST {WHITEBOARD_URL}/api/partner/maths (Bearer WHITEBOARD_PARTNER_SECRET, {question, band})──▶ askRadlor
         screen (Opus 5.5, low effort): maths / not_maths / personal / unsafe → 422 unless maths
         the lesson, from askRadlor's `maths` subject prompt, streamed as server-sent events
         askRadlor keeps nothing about the child: no user, no row, cost rows with no text
   3. events passed to the browser as they arrive; the lesson is kept; ask_maths_finish (service role) settles the row
child's browser: the board (public/ask-player, sandboxed iframe) + the voice (public/ask-tts, Pocket TTS, on the device)
```

- **The board** is askRadlor's player, copied by `node scripts/sync-ask-player.mjs <whiteboard-ai app checkout>` into
  `public/ask-player` (only the drawing files a maths lesson loads, Radlic's Gaegu font under the player's font names:
  no Google Fonts) and the voice into `public/ask-tts`. Copy again whenever askRadlor's player or maths drawings change.
  Its CSP (`askPlayerCsp` in next.config.ts): our scripts and fonts only, `connect-src 'none'`, framed only by our
  origins. The voice worker's (`ASK_TTS_CSP`): our scripts and WebAssembly, and the model files from Hugging Face.
- **The voice** is made on the child's device: the first time it downloads ~166 MB (the model from Hugging Face, the
  voices from us), kept in the browser. If it cannot (an old browser), the device's own voice reads the lines.
- **Maths drawings** (askRadlor `public/player/lib/wb/schoolmath.js`): `timeclock`, `tape` (bar model), `column` (+ − ×
  with carries and borrows, decimals), `longdiv`, `ratiotable`, `usmoney` (coins and bills), `measure` (jug, kitchen
  scale), `shapenet` (nets and surface area), `picgraph` (picture graph), plus askRadlor's whole `math` and `calculus`
  libraries. Every digit is computed by the recipe, not typed by the model. No realistic drawings (askRadlor refuses
  `sv`/`pin` for maths, since this copy ships none).

## The data (migration 20261021120000)

| table | what | who reads | who writes | kept |
|---|---|---|---|---|
| `ask_maths_settings` | on/off, daily limit, who agreed to which disclosure version, when | the child's family | `set_ask_maths` (owner only) | with the child |
| `ask_maths_questions` | the question (cleared when it had personal details), outcome, the lesson | the child's family | `ask_maths_begin` (family) / `ask_maths_finish` (service role) / `ask_maths_forget` (owner) | **30 days** (`prune-ask-maths-questions`, 03:52 UTC) |
| `addon_subscriptions` | the add-on's Stripe subscription | the account | the webhook (service role) | with the account; closing it or withdrawing for every child queues a cancel and pro-rata refund (`billing_cancellations`) |

Billing: `/api/checkout/ask-maths` makes a second subscription on the family's Stripe customer with
`metadata.product = 'ask_maths'`; the webhook writes it to `addon_subscriptions` only, never to `subscriptions` or the
seats, and sends its own acknowledgement email. `/api/billing/ask-maths-cancel` stops renewal at period end. The plan's
checkout ignores the add-on when it checks for a live subscription.

## Settings

| where | name | value |
|---|---|---|
| Radlic, Vercel (server) | `ASK_MATHS` | `on` to serve the routes (otherwise 404) |
| Radlic, Vercel (build) | `NEXT_PUBLIC_ASK_MATHS` | `on` to show the button, the page and the parent tab |
| Radlic, Vercel (server) | `WHITEBOARD_URL` | askRadlor's origin, e.g. `https://<askRadlor domain>` |
| Radlic, Vercel (server) | `WHITEBOARD_PARTNER_SECRET` | 32 random bytes; the same value as askRadlor's `RADLIC_PARTNER_SECRET` |
| Radlic, Vercel (server) | `STRIPE_PRICE_ASK_MATHS` | the add-on's monthly Stripe price (test price on Preview, live on Production) |
| askRadlor, Vercel | `RADLIC_PARTNER_SECRET` | the same 32 bytes |

Turning it off again: set `ASK_MATHS` to anything else (the routes answer 404 at once), then `NEXT_PUBLIC_ASK_MATHS`
on the next deploy. askRadlor's kill switch (/admin → Making videos) and its daily spend cap stop it too.

## Before it is turned on

The founder and the attorney, in this order:

1. **The words.** Approve the disclosure (`src/features/askMaths/disclosure.ts`, quoted below), and the changes it needs
   in the notice (docs/legal/02 and `src/features/consent/copy.ts`: "no artificial-intelligence service that receives
   anything your child types" becomes true only while Ask maths is off for that child), the privacy policy (doc 11:
   the AI and model-training paragraphs), the subprocessors (doc 07: askRadlor / Radlor Inc., Anthropic, Hugging Face
   for the voice files), retention (doc 04: 30 days), terms (doc 12 §8), and the decision line in docs/decisions.md
   (21 Sep: "no free text" for the "Didn't get it?" reasons — Ask maths is a deliberate, parent-switched exception).
   Whether the notice change needs `reconsent_required` (a new notice version) or the per-child disclosure is enough.
2. **Anthropic.** Confirm the terms that cover a child's question (no training on API data; retention; a Zero Data
   Retention agreement if the attorney wants it; Anthropic's requirements for products used by minors).
3. **The price.** `ASK_MATHS_MONTHLY_CENTS` (now $4.99 a month, a placeholder) and a Stripe price at the same amount.
4. **The secret and the URL** (table above) in both projects; askRadlor's `kids-maths` branch merged and deployed first.
5. **Staging**: the migration through `staging`, then a test family: switch on, buy the add-on with a Stripe test
   card, ask 5 questions (one not maths, one with a phone number), watch one again from the dashboard, delete them,
   close the account and see the add-on cancelled. Then a real model run of 20 questions per band, read by a person.
6. Production: the migration (founder-approved `migrate-prod`), then `docs/legal/sql/ask-maths-proof.sql`, then the
   two flags.

### The disclosure, as it stands (ask-maths-v1)

The same text is in the code, in English and a Spanish machine draft. Changing a word means a new version string in
`disclosure.ts` AND in `set_ask_maths` (a migration).

> **Before you turn on Ask maths for {name}**
> - {name} types a maths question, and a whiteboard lesson is drawn and spoken for it.
> - What {name} types is sent from our server to askRadlor, the whiteboard service of Radlor Inc. (the company behind
>   Radlic). askRadlor uses Anthropic's Claude model to write the lesson. askRadlor keeps none of it. Anthropic handles
>   it under its commercial terms, which do not let it train its models on it.
> - Each question is checked first. If it is not about maths, or it has personal details in it (a full name with a
>   school, an address, a phone number, an email), no lesson is made, and a question with personal details is not kept.
> - We keep each question and its lesson for 30 days, so you can see them here, and then delete them. You can delete
>   them yourself at any time.
> - The voice is made on {name}'s device. The first time, the device downloads the voice files (about 166 MB), part of
>   them from Hugging Face, which sees only the device's internet address.
> - {name} can ask up to the number of questions a day you choose. You can turn Ask maths off at any time.
>
> ☐ I am {name}'s parent or guardian, and I agree to this.

## Try it locally (no money, no production)

Docker running, in this repo:

1. `supabase start` (a throwaway local stack; copy `supabase/schema/baseline_schema.sql` to
   `supabase/migrations/00000000000000_baseline.sql` first, as CI does, and delete it again after: the vitest schema
   fixture fails while it is there), then `supabase db reset`.
2. `node scripts/ask-maths-local-seed.mjs`: a test family (the sign-in is in that file), a Grade 6–8 child, the
   add-on marked active.
3. askRadlor's `app` (branch `kids-maths`) with `GENERATION_MOCK=1 RADLIC_PARTNER_SECRET=<any>`: no model call; a
   question containing "coins" gets a hand-made maths lesson, any other the rainbow sample.
4. This app with `ASK_MATHS=on NEXT_PUBLIC_ASK_MATHS=on WHITEBOARD_URL=<askRadlor's local URL>
   WHITEBOARD_PARTNER_SECRET=<the same>` and the local stack's Supabase URL and keys.
5. Open it in **real Chrome**: Claude's in-app browser pane blocks every sandboxed iframe, so the board stays empty
   there (measured 21 Oct 2026; askRadlor's own player too).

## Tests

`askMathsDb.test.ts` (every function as each role, with positive twins), `askMathsRoute.test.ts` (the route, the
stream, every settle), `askMathsCheckout.test.ts`, `billingStripe.test.ts` (the add-on webhook branch; the plan
checkout ignores a live add-on), `exportCompleteness`, `accountDeletion`, `childWords`, `dashboardSpanish`. askRadlor:
`tests/generation/partner.test.ts` and the maths subject in `prompts.test.ts` / `wb-load.test.ts`.
