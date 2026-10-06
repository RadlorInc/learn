# Runbook: data requests

**Use this when:** anyone asks to see, correct or delete what we hold about them or their child, or to withdraw consent.

The rules and deadlines are in [../legal/06-parent-rights-procedure.md](../legal/06-parent-rights-procedure.md) (intake, verification, steps, target per request) and [../legal/04-data-retention-policy.md](../legal/04-data-retention-policy.md) (what is kept, how long, backups). This file is **how**. If they disagree, the legal document wins and this file gets fixed.

## Every request, first

1. **Founder.** Log it the day it arrives in the separate request log (06 §B1), with the deadline date from 06 §B3's *Target* column. Add a general line to the contact log in [support.md](support.md).
2. **Founder.** Verify the requester as 06 §B2 says: the request comes from the account's own address and is confirmed from it. Record what was checked. Never ask for an ID document. If the request comes from another address, reply only to the account's address.

## A parent or teacher with an account

The first choice is always the in-app control. It is immediate, it checks ownership in the database, and every deletion writes an audit row (`public.deletion_log`: path, time, counts, no names).

| Request | In the app (the parent does it, or the founder walks them through it) | If they cannot use the app (founder, SQL editor; not yet rehearsed on production) |
|---|---|---|
| **See** | Dashboard → child's card → **Login & data** → *Download a copy*. The file includes crash records and who has access. Its `completeness` section says if any part could not be read | Agent writes a read-only export query with a `'<learner id>'` placeholder over the tables 06 §B3 lists. Founder runs it and sends the result only to the account's address |
| **Correct** | **Login & data** → *Update \<name\>'s details*: name, avatar, grade band | Agent writes a one-row `update` with placeholders, naming only the column to change. Founder runs it |
| **Delete one child** or **withdraw for one child** | **Login & data** → *Delete \<name\>'s profile*, which runs `delete_learner` → `delete_child_data` | `select public.delete_child_data('<learner id>'::uuid, 'delete_child');` It is logged as actor `service`. Then trigger the second-email cancel (below) |
| **Withdraw for every child** | **Account → Withdraw permission for all your children**, or the link in the second consent email. The account stays open | `select public.consent_withdraw_account('<account id>'::uuid);` This is the same function the in-app control calls. It deletes each child (logged), withdraws granted consents and expires pending ones. Then trigger the second-email cancel (below) |
| **Close the account** | **Account → Close your account**: type the email, signed in within the last 10 minutes | [Close an account from SQL](#close-an-account-from-sql) below (rehearsed on a local stack 2026-10-05; never yet run on production) |

**After a deletion from SQL,** the database has already queued the cancel of any pending second consent email (a trigger). The daily cron sends it at 06:23 UTC. To send it now (agent or founder; public, harmless, rate-limited): `curl -s -X POST https://radlic.com/api/consent/cancel-second-notice`.

**Kept on purpose, not deleted by these steps:**
- the consent record after an account closes (04 §2, attorney question);
- `deletion_log`;
- the backup copies until they expire (04 §5).

Never restore a deleted child's record from a backup.

## Close an account from SQL

For a verified parent (above) who asked to close the account and cannot do it in the app. It does what **Close your
account** does, through the same deletion function, and records an operator did it. The SQL is
[../legal/sql/close-account-operator.sql](../legal/sql/close-account-operator.sql); its header says exactly what it
deletes, what it keeps, and what the local rehearsal showed.

Do **not** use the Supabase dashboard's *Delete user* for a parent. With children on the account it fails and deletes
nothing (`learners.created_by` is `ON DELETE RESTRICT`), and without children it would skip the audit row.

1. **Founder.** Run queries 1, 2 and 7 of [../legal/sql/support-lookup.sql](../legal/sql/support-lookup.sql) with the
   verified address. Note the account id and how many children it owns. `child_login = true` or no row: stop.
2. **Founder, Stripe first.** If `docs/legal/sql/billing-lookup.sql` (written in its own PR) shows a subscription that is not `canceled`, cancel it
   in the Stripe dashboard before anything else. Whether to cancel now or at period end, and any refund, is **the
   founder's open decision** — this runbook does not make it. Once Stripe has it, set `v_stripe_cancelled` to `true` in
   the SQL. (Closing first would leave Stripe billing a family whose account no longer exists.)
3. **Founder.** If they also gave an email before signing up, the lead row is not reachable by account deletion
   (`NOT_REACHABLE_BY_DELETION` in `src/core/accountDeletion.ts`): offer `select public.delete_lead_by_email('<address>');`.
4. **Founder.** Run the **before** check for each child ([Confirm a deletion](#confirm-a-deletion-founder-sql-editor-read-only))
   and see rows.
5. **Founder.** Fill `<account id>` and `<account email>` in `close-account-operator.sql`, run it once. A `STOP:` error
   means nothing was deleted; read it. Success prints `CLOSED: <n> children, census {…}`.
6. **Founder.** Send the second-email cancel now: `curl -s -X POST https://radlic.com/api/consent/cancel-second-notice`
   (or let the 06:23 UTC cron do it).
7. **Founder.** Check, read-only:
   ```sql
   select count(*) as account_left from auth.users where id = '<account id>'::uuid;               -- 0
   select path, actor_kind, cardinality(learner_ids) as children, row_counts
     from public.deletion_log where account_id = '<account id>'::uuid order by at;                -- one row per child + one for the account, all 'service'
   select state, withdrawn_at, parent_id is null as unlinked
     from public.parental_consents where lower(email_address) = lower('<account email>');         -- withdrawn/declined, unlinked; no pending
   ```
   and the **after** check for each child id from step 1: every count 0.
8. **Founder.** Reply and close the request as below. Tell them what was kept (next list).

**What survives a closed account** (the in-app close keeps the same):
- `parental_consents` — the consent record, marked withdrawn, with no link to the account (`SURVIVORS` in
  `src/core/accountDeletion.ts`);
- `billing_events` — a payment record with no link to the account (`SURVIVORS`), and Stripe's own records
  (`HELD_ELSEWHERE`);
- `deletion_log` — the audit rows (ids and counts);
- `email_suppressions` — the address, if it ever unsubscribed, so that no marketing email reaches it again;
- `email_undeliverable` — only if an email to the address bounced permanently or was marked as spam: its sha256 hash,
  the reason and when, deleted 12 months after the last event (`SURVIVORS`; lifting one: support.md → Email bounces);
- `diagnostic_leads` — only if not deleted in step 3;
- the backup copies, until they expire (04 §5).

`deletion_log` and `email_suppressions` are not declared in `SURVIVORS` yet (an open item in [../../handoff.md](../../handoff.md)).

## Confirm a deletion (founder, SQL editor, read-only)

Run this **before** and **after**. The before-run must show rows. A zero you have not first seen non-zero proves nothing (06 §B3).

```sql
with target as (select '<learner id>'::uuid as id)
select 'learners' as table_name, count(*)::int as rows from public.learners, target where learners.id = target.id
union all
select c.relname::text,
       (xpath('/row/n/text()', query_to_xml(
          format('select count(*) as n from public.%I where %I = %L', c.relname, a.attname, (select id from target)),
          false, true, '')))[1]::text::int
from pg_constraint k
join pg_class c on c.oid = k.conrelid and c.relnamespace = 'public'::regnamespace
join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
where k.contype = 'f' and k.confrelid = 'public.learners'::regclass and array_length(k.conkey, 1) = 1
order by 1;
-- and the audit row:
select at, path, actor_kind, row_counts from public.deletion_log where '<learner id>'::uuid = any(learner_ids);
```

It reads every table with a foreign key to `learners`, so a later table is counted too (rehearsed on a small local schema only, as of 2026-09-28). Afterwards every row reads 0; the audit row's `row_counts.child_logins` says how many child sign-ins went too.

## Someone who is not an account holder

- **An adult whose email was captured before sign-up** (`public.diagnostic_leads`: email, grade band, date, nothing else; pruned at 24 months).
  - **Founder**, SQL editor:
    - to see: `select email, band, created_at from public.diagnostic_leads where lower(email) = lower(btrim('<address>'));`
    - to delete: `select public.delete_lead_by_email('<address>');`
  - It returns the number removed. `0` means we hold nothing: say exactly that, and ask whether they used another address. It is service-role only, never callable from the app.
- **An address on the unsubscribe list** (`public.email_suppressions`). Removing it would let commercial email reach it again. Read [../legal/09-email-compliance.md](../legal/09-email-compliance.md) first.
- **A radlor.com waitlist signup.** Those addresses live in the website's own database, not this app's. Handle it there. Nothing in this repo can see it.
- **A child** asking directly. Route it to the adult on the account, and do nothing on a child's say-so alone.

## Close

1. **Founder.** Reply to the verified address: what we did and when. Do not quote internal ids.
2. **Founder.** Record the completion date and the verification in the request log (06 §B4).
3. **If we refuse**, say why in writing and offer the appeal in 06. A different person reviews it.
