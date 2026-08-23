# Runbook — a data request from someone who is not a parent yet

**When this fires:** an email to `support@radlor.com` saying some version of *"delete my email
address"* or *"what do you have on me?"* from somebody who used the free placement check and never
made an account.

Parents with accounts do **not** need this runbook — they have both rights as buttons on `/parent`
("Download a copy", "Delete profile"). This is only for **leads**, whose row has no `learner_id`,
no `user_id`, nothing that cascades, and no parent-facing control that can see it.

## Why it needs a runbook at all

`diagnostic_leads` has **no SELECT policy**. That is deliberate — lead emails must not be readable
through the API — and it means the ordinary paths cannot answer the request. Before
`delete_lead_by_email` existed, honouring it meant writing DELETE SQL by hand, under time pressure,
against a table holding real prospect addresses. That is how the wrong row gets deleted.

## Deleting a lead

Run in the Supabase SQL editor (which runs as `postgres`) or with the service-role key. The
function is **service-role only** by explicit REVOKE — it is not callable from the app or by an
anonymous caller, or it would be an address-enumeration oracle.

```sql
select public.delete_lead_by_email('them@example.com');
```

It returns the number of rows removed:

- **`1`** (or more) — deleted. Reply confirming it is done.
- **`0`** — we had nothing for that address. Reply saying exactly that; do not imply we deleted
  something. It is also worth checking they did not use a different address.

Matching is case-insensitive and trims whitespace, because the address in a support email will
not match the stored casing.

## Telling someone what we hold

The row is `{ email, band, created_at }` and nothing else — no name, no child's name, no IP, no
user agent. Say so plainly; it is a short and reassuring answer.

```sql
select email, band, created_at from public.diagnostic_leads
where lower(email) = lower('them@example.com');
```

## What happens without any request

Leads prune automatically at **24 months** (`prune-diagnostic-leads`, 03:17 UTC daily). Nothing
needs doing for the ordinary case.

## ⚠️ Related, and not fixed by this runbook

The `anon` INSERT grant on `diagnostic_leads` is still open, so anyone holding the public key can
write leads directly and skip `/api/lead`'s rate limit. The fix is
`20260816170000_leads_server_only.sql`, which **cannot be applied until
`SUPABASE_SERVICE_ROLE_KEY` is live on a production deployment** — the route falls back to the
anon key, so revoking the grant first stops lead capture dead and silently. Retention bounds how
long junk lives; it does not stop junk arriving.
