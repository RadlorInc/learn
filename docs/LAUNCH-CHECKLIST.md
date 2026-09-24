# Private beta — launch checklist (Friday 25 September 2026, US time)

Your steps, in order. Nothing here was done on production by the agent. **Never paste a key or password anywhere; every
check below reads names, settings and rows, never secrets.**

---

## 0. GO / NO-GO — answer these first

| # | Question | How to check | If NO |
|---|---|---|---|
| G1 | **Are the Terms of Service public?** Signup says "By continuing you agree to our Terms", so a dark Terms page is a no-go. | Open `https://radlic.com/legal/terms` after deploy: no red "DRAFT — NOT IN FORCE" box. | Decide the two open points (§1 below); a small PR fills them and flips the switch. |
| G2 | **Is the Privacy Policy public, with the beta label?** | `https://radlic.com/legal/privacy`: the "Beta version. In effect from 25 September 2026…" box, then the policy. | Do not invite anyone. |
| G3 | **Is `notice-v6` in the production database?** (The rename's migration, needed before any parent can give consent.) | Supabase → SQL editor: `select version, seq, reconsent_required from public.consent_notice_versions order by seq;` → a `notice-v6 \| 6 \| false` row. | Approve the `production-db` run for `20260924120000_notice_v6_radlic.sql` (docs/RENAME-MANUAL.md §B), then re-check. **No consent works without it.** |
| G4 | **Does consent work end to end on production?** | With a test parent email you control: sign up → tick the notice → the "please confirm" email arrives from **Radlic** → press "I give permission" → add a child → the child can open a lesson. | Stop; send the console / error query (§4) to engineering. |
| G5 | **Can a parent delete a child and withdraw for all children?** (The Parent rights page promises both.) | Test parent: child card → Login & data → *Delete name's profile*; then Account → *Withdraw permission for all your children*. The child is gone; the dashboard shows the banner. | Stop — the published page promises this. |
| G6 | **Are there any prices anywhere?** The beta is free. | Account view: no "Plan & billing" card. `https://radlic.com/parent/plan` says "Radlic is free during the beta". | Stop; something deployed without this PR. |

All six YES → invite the families.

## 1. The two decisions still open (they keep the Terms dark)

1. **§11 — the liability floor.** "The greater of (A) what you paid us in 12 months, or (B) **$___**." In the beta (A) is
   zero, so (B) is the cap. Options given: US$100 (recommended) or US$50.
2. **§14 — copyright complaints.** Either a phone number for Radlor Inc., or §14 becomes a plain contact (address +
   support@radlor.com, no "designated agent", no phone) — recommended, since you chose not to register an agent now.

Say the two answers; the change is two lines plus `published: true` for `terms` in `src/app/legal/registry.ts`, and the
guard refuses it if anything is left.

## 2. Merge order (Thursday)

1. **This PR** (beta legal pages + free beta). Merging it offers no migration.
2. Confirm **G3** (`notice-v6`). If the rename's migration was never approved, approve it now — before step 3.
3. Promote `main` to **`release`** (that is what deploys production).
4. Wait for the Vercel production deployment to be **Ready**, then do §3.

## 3. What to check live (Thursday night / Friday morning)

- `https://radlic.com/legal/privacy`, `/legal/parent-rights`, `/legal/subprocessors`, `/legal/cookies`, `/legal/retention`:
  each shows the beta box and the full text; no `*` or backtick marks in the text; no red box.
- `https://radlic.com/legal/terms` and `/legal/refunds`: red "DRAFT" box (until §1 is decided, Terms stays like this —
  that is G1).
- The landing page footer and the signup screen link to Privacy and Terms.
- The consent notice (when adding a child) shows **"Withdraw permission for all your children"** and radlic.com links.
- A Spanish-speaking parent: the dashboard is in Spanish; the legal pages are in **English** (the Spanish drafts are
  not reviewed and not published — by your decision).
- Old address: `https://adaptivelearn.radlor.com/legal/privacy` still works (it redirects once
  `NEXT_PUBLIC_SITE_URL` is `https://radlic.com`; see RENAME-MANUAL §A.5).
- Supabase **Auth email templates** say Radlic, not Milo/AdaptiveLearn (RENAME-MANUAL §C.7) — the sign-up
  confirmation email is the first email a new family sees.

## 4. Seeing production errors this weekend (nothing to build)

Crashes are **already recorded**: every browser and server error goes to Vercel's logs (kept about 1 hour on Hobby) and
to the `error_events` table in Supabase (kept 90 days) when the service-role key is set in production — inferred, not
checked: `/api/child-login` answered 502 rather than 503 ("not configured") on 24 Sep, and it needs the same key. Only the
third, optional sink (`MONITORING_INGEST_URL`) is unset.

**What an error record holds:** the error message, the stack trace, the page's address, the browser (user agent), and
the child's internal id (a random code, not a name). No child's name and no answers are in the payload — the one
residual chance is an error *message* that itself contains a name. The query below shows only the first 160
characters of a message; it does not remove names.

Supabase → SQL editor, read-only — run it Friday evening, Saturday and Sunday:

```sql
select at, source, left(message, 160) as message, route_path, split_part(url, '?', 1) as page
from public.error_events
where at > now() - interval '24 hours'
order by at desc
limit 50;
```

**An empty result has two meanings** — nothing crashed, or nothing is being recorded — and they look the same. Run it
once with `interval '30 days'`: older rows mean the sink records. If 30 days is empty too, tell engineering before
trusting any quiet weekend.

## 5. Things that are true for the beta and worth knowing

- **Signup is open** (your decision): anyone who finds radlic.com can create an account and add a child. The consent
  gate still applies to everyone.
- **Billing is off**; no Stripe key is in production (you checked). Nothing can be charged.
- **Moving domains signs everyone out** (RENAME-MANUAL §F.2) — switch `NEXT_PUBLIC_SITE_URL` before the families start,
  not during the weekend.
- The attorney review is still owed: `docs/legal/ATTORNEY-PACKET.md` → *Decided by the founder for the beta*.
