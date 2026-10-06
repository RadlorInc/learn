# Runbook: security incident and data breach

> **DRAFT — NOT LEGAL ADVICE.** The steps are ours; every legal duty and deadline is marked **TO CONFIRM WITH
> ATTORNEY** and is not decided here. The programme this implements is
> [../legal/05-information-security-program.md](../legal/05-information-security-program.md) §6.

**Use this when:** anyone's data may have been seen, changed or deleted by someone who should not have — a leaked
key or password, a cross-family read, a spike of `42501` denials, a lost laptop with production access, a provider
telling us of a breach on their side, or a report from outside. For a plain outage use [outages.md](outages.md).

Report a suspected incident to the support address (`SUPPORT_EMAIL` in `src/app/site.ts`).

## Roles

- **The founder** is the incident lead and the only person who acts on production: rotates secrets, reads provider
  logs, decides notifications, signs every notice. There is no one else; if the founder cannot act, nothing on
  production moves.
- **The agent** works in the repo and in chat only: writes catalog queries and fixes, drafts the log entries and the
  notices, re-runs CI checks. It never queries production ([../../CLAUDE.md](../../CLAUDE.md)).
- **The attorney** decides who must be told, by when and how. Engage them in the first hours, not after the fix.

## The first hour (founder)

1. **Start the incident log** (below) with the time you learned of it, from whom, and what was reported — in their
   words. Write as you go; times matter more than prose.
2. **Contain.** Cut the route, in this order of speed:
   - a leaked secret → rotate it at its source now ([rollback.md](rollback.md) → *Security incident*, step 5: source,
     then the GitHub secret or Vercel env var, then redeploy — env vars bind at deploy time);
   - a bad release or policy → code rollback ([rollback.md](rollback.md) route A), then a forward-fix migration;
   - a compromised account (ours or an admin's) → revoke its sessions and remove it from `admin_users`;
   - a compromised parent account → in the Supabase dashboard, sign the user out of all sessions; tell the parent.
   Containment comes before diagnosis, but do **not** delete anything that is evidence (next step).
3. **Preserve evidence — early, because the logs expire.** Provider log retention is short and plan-dependent (Vercel
   runtime logs and Supabase logs are kept for days, not months; check each dashboard's retention on the day). Export,
   into a private folder outside the repo, readable only by the founder:
   - Vercel: runtime logs for the window (dashboard → Logs → export/download), and the list of deployments with times;
   - Supabase: API (PostgREST), Auth and Postgres logs for the window (dashboard → Logs Explorer → download);
   - GitHub: the audit log of the org and the repo's Actions runs for the window;
   - Stripe and Resend: the dashboard event lists for the window, if they are involved;
   - the newest encrypted backup artifact's run id (it holds the state before the fix; artifacts are kept 30 days).
   Note in the log what was exported, when, and its file names. Logs are personal data: they stay out of git, PRs,
   issues and chat with the agent.
4. **Assess, separately: what is known and what is not.** Which data (children's? parents' emails? tokens?), whose
   (how many accounts and children — counted by the founder, never written in the repo), over what period, and
   whether it was only reachable or actually read. The agent writes the read-only queries
   (`supabase/tests/security_posture.sql`, the deletion and access tables) for the founder to run.
5. **Call the attorney** with the log so far. From here the notification clock may be running — see below.

## Afterwards (founder and agent)

- **Fix the cause** with a test that fails on it ([../../CLAUDE.md](../../CLAUDE.md): watch it go red first), as a
  Draft PR. A security fix that is not yet live stays out of the public repo's text — the PR describes it in general
  terms until it ships.
- **Rotate everything the incident could have reached**, not only what was confirmed leaked: the service-role key,
  `CRON_SECRET`, `STRIPE_*`, `RESEND_API_KEY`, database password, `BACKUP_PASSPHRASE` (keep the old one: older dumps
  open only with it). After each rotation, check the next deploy reaches READY and `npm run smoke:live` passes.
- **Re-measure**: `ci / rls-tests` on `main`; the four catalog queries of `security_posture.sql` diffed against
  `supabase/schema/security_baseline.sql`.
- **Record** in 05 §8 (the evaluation table) what happened and what changed, in general terms; one line in
  [../decisions.md](../decisions.md) if a decision came out of it.

## Notification decision points — TO CONFIRM WITH ATTORNEY

None of these deadlines or duties is decided here. Each line is a question for the attorney, with the facts they will
need from the log.

| Decision | Facts the attorney needs | Deadline |
|---|---|---|
| Is it a "breach" under the laws that apply (children's data, state breach statutes, the FTC)? | what data, whose, reached or read, encrypted or not | **TO CONFIRM WITH ATTORNEY** |
| Must parents be told, and which ones? | the accounts and children affected (counted by the founder) | **TO CONFIRM WITH ATTORNEY** |
| Must a regulator or a state attorney general be told? | the states the affected families live in, if known; the number affected | **TO CONFIRM WITH ATTORNEY** |
| Must a provider be told, or did a provider tell us (their own duties)? | which provider, their notice, their timeline | **TO CONFIRM WITH ATTORNEY** |
| Is law enforcement involved, and may notice be delayed for it? | any contact with police | **TO CONFIRM WITH ATTORNEY** |
| Must payment card brands or Stripe be told? | whether any card data was involved (we hold none; Stripe does) | **TO CONFIRM WITH ATTORNEY** |

Until the attorney answers: do not tell parents anything inaccurate or speculative, and do not promise what has not
been checked. The attorney may also want to be the one who sends, or approves, the first words.

## Incident log

Kept **outside the repo** (it names people and counts), in the founder's private ops log, one entry per incident. Each
line: time (UTC), who, what was seen or done, evidence file if any. The headings, in order:

1. Detected — when, by whom, how.
2. Contained — what was cut off, when.
3. Evidence — what was exported, when, where.
4. Assessment — known / not known, with times.
5. Attorney — when engaged, their answers to each decision above, with dates.
6. Notified — who, when, how, with a copy of what was sent.
7. Fixed — PRs, rotations, re-measurements.
8. Closed — date, and the 05 §8 line.

The public trace is only: the fix's PR (once live), a line in 05 §8, and the contact lines in [support.md](support.md).

## Draft notice to parents — DRAFT, NOT FOR SENDING WITHOUT ATTORNEY REVIEW

> **Subject: About your Radlic account — a security problem we found on [date]**
>
> We are writing to tell you about a problem that affected your Radlic account [and your child's profile].
>
> **What happened.** On [date], we found that [plain description: e.g. "a setting allowed some account information
> to be read by people who should not have seen it"]. It lasted from [date] to [date]. We fixed it on [date].
>
> **What information was involved.** [Exactly what: e.g. "your email address and your child's first name and lesson
> progress". Say what was NOT involved, if known: "No payment card details — we never hold them."]
>
> **What we have done.** [Fixed the cause; changed keys and passwords; told [authority], if required.]
>
> **What you can do.** [Only real, specific steps: e.g. "change your Radlic password", "watch for emails pretending to
> be from us — we will never ask for your password".] You can also delete your child's information at any time:
> [steps from the parent-rights page].
>
> **Questions.** Reply to this email or write to [support address]. [Postal address.]
>
> We are sorry. [Founder's role, Radlor Inc.]
