# One sign-up email — merge, migration and live check (PR #228, 25 September 2026)

What changes for a parent who signs up with an email address and a password: **one email** instead of two at
sign-up — it confirms the address and asks for permission, with one button. **Email-plus is unchanged**: after the
parent ticks the box, B3 is scheduled a day later, and withdrawing cancels it. Consents are recorded as `email_plus`.
Google sign-in parents are unchanged (B1, then B3). Teachers get a confirm-only email.

## Order on the day

1. **CI green** on #228.
2. **Before SQL** — run `docs/legal/sql/signup-email-before.sql` on production. Expect:
   `ledger has 20260926090000` = **false** · `function … exists` = **false** · `consents NOT email_plus` = **0** ·
   `granted consents with no B3 recorded` = **0** · current notice = **notice-v6**. Anything else: stop and ask.
3. **Mark #228 Ready, merge.**
4. **Approve the `production-db` run** (GitHub → Actions → Deploy → `migrate-prod`). Either order is safe: without
   the migration the app sends a confirm-only email and asks for permission from the dashboard (B1), as today.
5. **Proof SQL, Part A** — `docs/legal/sql/signup-email-proof.sql`. Expect: ledger **true** · SECURITY DEFINER
   **true** · `search_path=public, pg_temp` · anon **false** · authenticated **false** · service_role **true** ·
   `consents NOT email_plus` **0**.
6. Wait for `release` to move and Vercel to show the new deployment **Ready**.

## Live check (a real inbox you own; use an address that has never signed up)

| # | Do | Expect |
|---|---|---|
| 1 | radlic.com/auth → **Create account** | "I am a… Parent / Teacher" above First name |
| 2 | Choose **Parent**, fill in, **Create account** | "Check your email: one message confirms your address and asks for your permission." |
| 3 | Inbox | **One** email: "Confirm your email and give permission for your children", from `Radlic <noreply@radlor.com>`. Greets you by first name; the four "we store" lines; "Clicking the button also confirms your email address."; a blue button "I've Read and I Agree to the Privacy Policy." **No** separate Supabase "Confirm your signup" email |
| 4 | Click the button | Opens radlic.com, then the page "Please confirm: permission for your children to use Radlic" with an unticked box |
| 5 | Tick the box | "Thank you — permission recorded … We will send you one more email in a little while…" and **Add a child** |
| 6 | **Resend dashboard → Emails** | B3 "Confirming the permission you gave for your children" to your address shows as **Scheduled**, about **24 hours** after step 5 |
| 7 | **Add a child** | Signed in, lands on your dashboard (set the parent PIN first); **no** Parent/Teacher question |
| 8 | Proof SQL, Part B, with your address | `email_plus` · `granted` · `parent_ack_at` empty · `b0_recorded` true · `b3_resend_id` = the id in Resend · `b3_hours_after_grant` ≈ 24 · role `parent` · `email_confirmed` true |
| 9 | Click the email button a **second** time | Still opens the permission page (it now says the permission is already recorded) — not an error |
| 10 | Try to sign up again with the same address | "This email already has an account…" and **no** email |
| 11 | Withdraw (Account → Withdraw permission for all your children) — on this test account only | Resend shows the B3 from step 6 as **Cancelled** |
| 12 | Sign up with **Teacher** and another address | One email "Confirm your email for Radlic", with a Confirm button; after it you land on the dashboard as a teacher, and no consent is asked at sign-up |
| 13 | A Google parent (existing flow) | B1 from the dashboard, then B3 **Scheduled** — unchanged |

If step 3 shows **two** emails, or step 6 shows **no** scheduled B3: stop the beta link and tell the agent.

## Not verified before merge
- Real delivery through Resend (tested against a local stand-in only).
- Whether production's leaked-password (HaveIBeenPwned) setting also applies to the admin sign-up route.
