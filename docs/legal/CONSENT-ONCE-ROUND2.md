# Consent-once — Round 2: everything that needs Rafi, in order

Prepared 24 September 2026. The proofs are in [`LOOP-STATE.md`](LOOP-STATE.md) → "Consent-once". This loop touched
nothing on production and merged nothing. The rules carried over: production is read only through SQL you run
in the Supabase SQL editor, and changed only by `deploy.yml`'s `migrate-prod` behind the `production-db`
approval, **after a Backup run has finished**. Never `supabase link` or `supabase db …` from a laptop.

---

## 1. Merge — one PR, and it carries the migration, so it gets the full pattern

**PR [#202](https://github.com/RadlorInc/learn/pull/202) — consent once per account.** The migration
(`20260924100000_consent_once.sql`), the signup notice and tick, one account-wide email-plus consent, the add-a-child
attestation, whole-account withdrawal, the re-consent switch, the new notice (`notice-v5`), and docs 02, 03, 06, 11
and 12 (EN + unreviewed ES drafts). It is one PR because the client and the schema cannot land apart without
breaking the other, and the consent wording is bound to the documents by test.

⚠️ **The gap.** Merging deploys the client at once, and the migration waits for your approval. **Until you
approve, no parent can add a child**: the new client asks for an account consent the old schema cannot record.
Every account is a test account, so keep the gap short: have the backup running before you merge.

1. **Before.** Run [`docs/legal/sql/co-before.sql`](sql/co-before.sql) and write the numbers down. Expected
   (rehearsed on a production-shaped local copy): `ledger has 20260924100000` **false**; children whose consent is
   not granted **0**; not bound to them **0**; notice versions outside v1–v5 **(none)**. **Stop** if any of these
   differs, and send me the output.
2. **Backup:** Actions → **Backup (prod database)** → Run workflow. Wait until it is green, **finished**, and its
   artifact is listed.
3. **Merge** the PR (merge commit). The Deploy run goes `ci` → `promote` → `migrations-changed = true` →
   `migrate-prod` waits for `production-db`.
4. **Approve `production-db`.** The log must show `Applying migration 20260924100000_consent_once.sql` and **no
   other file**. If the migration's own assertions fail, the whole file rolls back and nothing changes. The log then
   says `consent-once: … — rolled back`; send it to me.
5. **Proof.** Run [`docs/legal/sql/co-proof.sql`](sql/co-proof.sql). Expected: every row **PASS**; `INFO children`
   = the before-count; `INFO consents by scope/state` shows only `child/…` rows until a parent consents under the new
   flow.

## 2. In-app checks (a test account whose inbox you can read)

| # | do | expect |
|---|---|---|
| 2.1 | Sign out → **Sign up**. | The notice summary and an **unticked** box *"I'm a parent or legal guardian, I've read what we collect, and I agree."* **Create account** and **Continue with Google** are both disabled. |
| 2.2 | Tick → sign up with a new email → confirm it → pick **Parent**. | The dashboard says **Waiting for your permission** and names your address. One email (B1) arrives from `noreply@radlor.com`: *"Please confirm: permission for your children to use Milo"*, with the new line *"This one permission covers every child you add…"*. |
| 2.3 | Press **Send the email again**. | A second B1 arrives. The first email's link now says it has expired. Only the newest link works. |
| 2.4 | In the newest B1, press **I give permission**. | *"Thank you — permission recorded. You can add your children now."* |
| 2.5 | **Add a child** → name, modules → the **unticked** box *"I'm this child's parent or legal guardian. The permission I gave on {date} applies to this child too."* | **Add** stays disabled until you tick. No email is sent. |
| 2.6 | Add a **second** child the same way. | Created with a tick only. |
| 2.7 | Delete one child (card → Login & data → *Delete name's profile*). | The other child stays; the dashboard still allows adding. |
| 2.8 | **Account** (the dashboard's Account view) → the **Withdraw permission for all your children** card, beside *Close your account* → confirm. | You land back on the **dashboard** with *"We have stopped collecting information about every child on your account…"* as a banner — never on the Close-your-account page, which no longer offers withdrawal (fixed 2026-09-24 after this check: a parent who withdrew there went on to close the account by mistake). The dashboard shows no children and **no email arrives by itself**. **Add a child** asks for permission again (the notice, then a new B1 only when you press continue). In Resend, that consent's B3 shows **Canceled**. |
| 2.9 | Google sign-up: repeat 2.1–2.4 with **Continue with Google** (after ticking). | The same single B1 (Google proves the address; it is not the consent). |

Then read-only:
```sql
-- the test parent's consents and children (replace the email)
select c.scope, c.state, c.notice_version, c.parent_ack_at, c.confirmed_at, c.withdrawn_at, c.learner_id
from public.parental_consents c join auth.users u on u.id = c.parent_id
where u.email = '<test parent email>' order by c.requested_at;
-- expected after 2.8: one account row 'withdrawn' (parent_ack_at set = when you ticked on the signup page),
-- earlier account rows 'expired' (2.3), learner_id null everywhere.
select count(*) from public.learners l join auth.users u on u.id = l.created_by where u.email = '<test parent email>';
-- expected 0 after 2.8
select provider_id, queued_because, cancel_result from public.consent_b3_cancellations order by queued_at desc limit 3;
-- expected: that consent's B3, queued_because 'withdrawn', cancel_result 'cancelled'
```
Before 2.8, the children's attestation:
```sql
select display_name, attested_by, attested_at, attested_notice_version, attestation_method
from public.learners l join auth.users u on u.id = l.created_by where u.email = '<test parent email>';
-- expected: attestation_method 'checkbox', attested_notice_version 'notice-v5', attested_by = the parent
```

## 3. Decisions only you can make

| # | question | recommendation |
|---|---|---|
| 3.1 | **The legacy child.** The one existing child keeps its per-child consent, which is email-plus for that child, stronger than an account consent plus a tick. It stays valid for that child only; it can create nothing else. The alternative is to clear that test child in the migration, as D6 did. | Keep it, as built. |
| 3.2 | **Teachers at signup.** The box says "I'm a parent or legal guardian", which a teacher cannot tick honestly. Built: *"Signing up as a teacher, not a parent?" → Continue as a teacher* enables the buttons without the tick. A teacher's account still cannot add a child without the full consent, and the roster stays paused. | Keep it. |
| 3.3 | **Mark a notice version as needing re-consent** (the switch): a one-row SQL update, which should go through a reviewed migration. None is marked today. | Mark a version only when what we collect changes; ask the attestation wording question (attorney A8c) first. |
| 3.4 | **Proposal, not built: the signup confirmation email as the consent email.** | Don't. Google parents get no confirmation email, so there would be two flows, and the auth templates are not versioned (ATTORNEY-PACKET A10). |
| 3.5 | The one new string that is in no document (the PROPOSED block): the result screen after withdrawing every child, *"We have stopped collecting information about every child on your account and deleted what we held about them. Your account stays open."* | Approve or reword. |
| 3.6 | Spanish: the consent flow now has more machine-translated strings, all still unreviewed (Round-1 decision 3.2 still open). | Unchanged. English until reviewed. |

## 4. The attorney

Send the updated [`ATTORNEY-PACKET.md`](ATTORNEY-PACKET.md):
- **A8** — *"Is one verifiable consent per parent account, plus an in-app parental attestation for each later child, sufficient under COPPA's email-plus method?"* and *"When must we re-obtain consent after a notice change?"*
- **A9** — "Option B" (checkbox + Google-verified address + automatic B3, no click in B1): fewer steps, legally less certain.
- **A10** — the signup email as the consent email: recommended against.
- **A1** — updated: withdrawal for one child *or* every child is now built.

## 5. Blocked / not done

Nothing is blocked. What is **not** covered, so you know what your in-app checks (§2) are the first to see:
- **Signed-in screens were not driven in a signed-in browser.** I don't type passwords into sign-in fields. The dashboard card, waiting state, add-a-child tick and Account withdrawal were proven in jsdom tests and screenshotted from the preview route (`/ui-preview?p=co-*`, fake data). The same flows ran end to end over HTTP against a local Supabase stack. The signup page and the B3-link withdrawal page were seen in a real browser.
- **The re-ask screen and "Read the notice you agreed to" show the current notice's text**, not the older version a parent agreed to: the app only holds the current text. The version and date are stated, and the consent record keeps the version.
- **No Stripe, no production, no real email**: Resend was a local stand-in that records calls.
