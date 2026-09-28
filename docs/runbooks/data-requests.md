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
| **Close the account** | **Account → Close your account**: type the email, signed in within the last 10 minutes | **No operator path exists or has been rehearsed.** Write one, rehearse it on a local stack, and have it reviewed before the deadline. Do not improvise on production |

**After a deletion from SQL,** the database has already queued the cancel of any pending second consent email (a trigger). The daily cron sends it at 06:23 UTC. To send it now (agent or founder; public, harmless, rate-limited): `curl -s -X POST https://radlic.com/api/consent/cancel-second-notice`.

**Kept on purpose, not deleted by these steps:**
- the consent record after an account closes (04 §2, attorney question);
- `deletion_log`;
- the backup copies until they expire (04 §5).

Never restore a deleted child's record from a backup.

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
