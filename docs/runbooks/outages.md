# Runbook: outages (a service we depend on is down)

**Use this when:** the site or part of it fails and the cause may be outside our code: Supabase, Vercel, Resend or
Stripe. If a deploy just went out, read [rollback.md](rollback.md) first — a bad release looks the same from outside.

There is no public status page. Parents learn of an outage from the app or from our reply, so the reply templates
below matter. Never promise a time we do not control.

## First five minutes (founder; the agent can do the `curl` checks)

1. `curl -s https://radlic.com/api/health` — `{"status":"ok"…}` means Vercel is serving the app. It does **not**
   touch the database, so "ok" says nothing about Supabase. No answer or a 5xx → Vercel (below).
2. The status pages: status.supabase.com, vercel-status.com, resend-status.com, status.stripe.com. Note what they say
   and when — the incident log below needs it.
3. GitHub: the latest `daily-smoke.yml` and `red-main.yml` issues ([support.md](support.md) → where messages arrive).
4. Did we deploy or migrate in the last hours? Yes → [rollback.md](rollback.md) before blaming a provider.
5. Start the incident log ([incident.md](incident.md) → the incident log): time, what is seen, what was checked. If
   anyone's data might have been exposed, it is a security incident: follow incident.md instead of this page.

## The notice switch (a one-line notice on every page)

One Vercel variable, `OUTAGE_NOTICE`, puts a calm line at the top of every page for parents and children. Unset, nothing
shows and nothing changes. It does not depend on Supabase, so it works while the database is down; if Vercel itself is
down, nothing on our side shows anything.

**Turn it on (founder).**
1. Vercel → the project → Settings → Environment Variables → add `OUTAGE_NOTICE`, environment **Production** only.
   Value `on` shows the default sentence — "We’re fixing a problem. Your child’s progress is safe." (in Spanish on a
   device whose dashboard is set to Spanish). Any other value is shown as it is, as plain text: one line, at most 160
   characters (longer is cut and ends in "…"); HTML is shown as typed, never run.
2. Vercel → Deployments → the current Production deployment → ⋯ → **Redeploy**. A variable reaches only a new
   deployment ([deploy.md](deploy.md): variables bind at deploy time), so this step is what turns it on. It builds the
   same commit again; the build does not need Supabase (`nightly-e2e` builds production against a placeholder one).
3. When that deployment is READY: `curl -s https://radlic.com/api/notice` → `{"notice":{"preset":true}}` for `on`, or
   `{"notice":{"text":"…"}}`.

**Turn it off.** Delete the variable (or empty it), Redeploy the same way, then the same `curl` → `{"notice":null}`.

**How long, and who sees it.** As long as the redeploy's build takes (not measured for a dashboard redeploy), then
every page load. The page asks `/api/notice` once per full load, and `sw.js` never caches `/api/*`, so an installed app
or a device on a cached shell sees it too, as long as it reaches radlic.com. A page already open shows it on its next
full load, not on an in-app move between pages. A device that is offline asks nothing and shows nothing (the offline
bar shows instead). The × hides it until the next load. It sits in the page's flow at the top, so a full-screen KG–2
chapter or the game draws over it: a child sees it on `/modules` and between chapters, never over a stage or an
answer button.

There is no maintenance mode that stops the app; this only tells people.

## Supabase down or slow (database, sign-in, storage)

**What parents and children see.**
- Signing in, signing up and the parent dashboard fail with "Couldn't connect" or "Something went wrong".
- A child already signed in on a device can keep doing lessons: answers queue on the device and upload when the
  database is back (architecture.md §7, the upload queue). The diagnostic block shows `unsynced` above 0 — the work is
  not lost.
- Lesson voice comes from the Storage bucket; if Storage is down, the device's own voice reads instead.

**Check.** status.supabase.com for the project's region; the Supabase dashboard (project health, API and database
reports, logs). `/api/health` stays "ok" — that is expected.

**Do.**
- Nothing to fix on our side unless the dashboard shows our own fault (connections exhausted, disk full, a paused
  project). Do **not** restore from backup for an outage — an outage loses nothing that a restore would bring back.
- If the project is **paused** (billing, quota), the founder un-pauses it in the dashboard and checks Cost Control.
- Afterwards: query 3 of [../legal/sql/support-lookup.sql](../legal/sql/support-lookup.sql) for a family that wrote in
  shows whether their queued work arrived.

## Vercel down (the site does not load)

**What parents see.** radlic.com does not load, or every page and API errors. Nothing works, including sign-in, the
consent links in emails and the Stripe webhook (Stripe retries; see below). Whether an installed app opens its cached
shell offline during a Vercel outage was not measured.

**Check.** vercel-status.com; the Vercel dashboard → the project → the production deployment's state and runtime
logs. A failed or blocked **deploy** is not an outage: production keeps serving the last READY deployment.

**Do.** Nothing can move the app elsewhere quickly; there is no second host. Wait, and log it. If only our latest
deployment is broken, it is a release problem → [rollback.md](rollback.md) route A.

## Resend down, or the sending quota used up

**What parents see.** Every email the app sends stops, and so do Supabase Auth's own emails (password reset), which
go through Resend as their SMTP relay (07-subprocessors):
- **Sign-up** shows "Something went wrong. Please try again." (`/api/auth/signup` answers `failed`, 502). The account
  is created but unconfirmed, and no email arrives. A retry within 2 minutes answers "ok" and sends nothing (the
  sign-up cooldown); a retry after that sends a new link once Resend works.
- **Consent stops.** A consent request (B1) is not sent (`/api/consent/request` answers `failed`, 502). And a parent
  who clicks to give permission is refused too: the grant schedules the second email (B3) in Resend *before* it records
  the consent, and a failed schedule fails the grant (`/api/consent/respond`, 502) — email-plus has no grant without its
  second notice. So no new child can be added until Resend is back.
- **Password reset** emails do not arrive.
- **Billing emails** (the acknowledgement, the renewal reminder): the webhook answers 5xx, so Stripe redelivers and
  the email goes out once Resend is back (architecture.md §8).
- The daily ops digest does not arrive — itself a signal.

**Check.** resend-status.com; the Resend dashboard → Emails (failed sends, bounces) and the plan's usage against its
quota; Vercel runtime logs for `[auth/signup] failed` and `resend 4xx/5xx`.

**Do.**
- **Quota:** the founder raises the plan, or waits for the reset; the plan stops at its quota on purpose (no surprise
  bill, handoff "hard spend caps").
- **After it recovers:** families who tried to sign up while it was down have unconfirmed accounts and no email. They
  sign up again with the same address (that re-sends). The nightly prune deletes an unconfirmed account after 3 days,
  so after a long outage they simply start again.
- **Consent:** a parent whose click failed clicks the link in their email again (it stays valid until it expires, 7
  days after the request); query 5 of `support-lookup.sql` shows the state. Do not send consent emails by hand from
  Resend.

## Stripe webhook backlog (or Stripe down)

**What parents see.** Checkout on Stripe's page may fail if Stripe is down. If only webhooks are delayed: the payment
succeeds but the plan page and seats do not update yet, and the acknowledgement email is late. While the paywall is
off (`PAYWALL_ENABLED`, architecture.md §8), no topic is locked by a late webhook.

**Check.** status.stripe.com; Stripe dashboard → Developers → Webhooks → the endpoint → failed deliveries and their
response codes. A 4xx/5xx from our endpoint is ours: `400 bad_signature` = the signing secret does not match
(`STRIPE_WEBHOOK_SECRET` rotated or wrong); `503 billing_not_configured` = a Stripe variable is missing in Vercel;
`500` = read the Vercel runtime logs.

**Do.** Stripe retries failed deliveries on its own for days; the webhook is idempotent and re-reads the subscription,
so a late or out-of-order delivery is safe. After fixing our side, use **Resend** on the failed events in the Stripe
dashboard rather than waiting. Never edit `subscriptions` by hand to "catch up"; for one family, `billing-lookup.sql`
shows what the database holds.

## Telling parents

Reply to each parent who writes in (the founder sends; [support.md](support.md) reply shape). No status page exists,
so do not link one. Templates — fill the brackets, keep it short:

> **Something is down now.** Thanks for letting us know. Radlic is having a problem right now because a service we
> rely on is down [for sign-in / for email]. Nothing your child has done is lost: work done on the device is saved
> there and uploads by itself when we are back. We will write again when it is fixed.

> **It is fixed.** Radlic is working again since [time, time zone]. [If sign-up: Please sign up again with the same
> email address; the confirmation email will arrive this time.] [If a payment: Your payment went through on [date];
> your plan now shows it.] Thank you for your patience.

> **An email did not arrive.** Our email service had a problem between [time] and [time], so the email you were
> waiting for was not sent. [Action: sign up again with the same address / click the link in the email we sent you
> again.] Sorry for the trouble.

Then log each contact in [support.md](support.md) (one line each) and, for an incident, in the incident log
([incident.md](incident.md)).
