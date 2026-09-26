@AGENTS.md

# ⛔ NEVER QUERY PRODUCTION DIRECTLY — NOT EVEN A READ-ONLY SELECT.

No Supabase MCP `execute_sql`, no `psql`, no CLI, no script against the production database, for any reason. Production
is read ONLY through SQL that Rafi runs himself in the Supabase SQL editor: **write the query for him instead** — put it
in `docs/legal/sql/<topic>.sql`, say what each column answers and what result would mean what, and wait for his output.
Founder's rule, 2026-09-24, after an investigation ran three read-only SELECTs on production through the MCP tool. A
read is still access to children's data, and "read-only" is a claim about the statement, not about who holds the key.

# ⛔ OPEN EVERY PR AS A DRAFT. RAFI MARKS IT READY ONLY WHEN HE MEANS TO MERGE.

`gh pr create --draft`, always — including a follow-up, a stacked PR and a one-line fix. Never mark a PR Ready for
review yourself, and never undo a Draft someone else set. Founder's rule, 2026-09-24, after #209 (titled "do not merge
before the launch weekend") was merged the same hour it was opened and went to production: a title is not a lock, and
a Ready PR reads as "ready to merge" to anyone looking at the list.

# ⛔ HARD RULE — NEVER POINT THE SUPABASE CLI AT A REMOTE DATABASE FROM A LOCAL CHECKOUT

Founder's rule, 2026-09-23, after an agent's unquoted shell heredoc executed `supabase db push` by accident
in the main checkout. It failed only because that checkout happened to be linked to nothing.

- **Never run `supabase link`**, and never run any `supabase db …` or `supabase migration …` command against a
  remote project — no `--linked`, no `--project-ref`, no `--db-url` that is not a throwaway local stack
  (`127.0.0.1`). Not to read, not to "just check", not with `--dry-run`.
- **Production's schema and migration ledger change ONLY through GitHub workflows behind the `production-db`
  environment** (required reviewer, admin bypass off): `deploy.yml`'s `migrate-prod`, or a reviewed one-off
  workflow (the one-shot `ledger-repair.yml` of 2026-09-23 was one; it ran once and was deleted in Round 1, R10 —
  evidence in `docs/legal/LOOP-STATE.md`). Production is READ only through SQL the founder runs in the Supabase
  SQL editor.
- The local CLI is for throwaway local stacks only (`supabase start` / `db start` in a scratch directory,
  torn down afterwards). Rehearse a production operation there, against a production-SHAPED copy.
- **Generated text goes through a QUOTED heredoc (`<<'EOF'`) or a file write, never an unquoted one** — an
  unquoted heredoc runs every backtick and `$(…)` inside it, and a comment that mentions a command becomes
  that command.
- If a checkout is ever found linked (`supabase/.temp/project-ref` exists), unlink it
  (`supabase unlink`) before doing anything else in it, and say so. Measured 2026-09-23: no checkout under
  /Users/mrk is linked, and no Supabase CLI login token exists on this machine.

# A CHECK IS NOT A CHECK UNTIL YOU HAVE WATCHED IT FAIL FOR THE RIGHT REASON

**Green is not evidence. Present is not enforcing. Found-nothing is not clean.**

The most expensive defect class in this repo is not a bug. It is **something that looks like a check
and isn't** — a gate, grep, guard or test that reports success while examining nothing. It is worse
than having no check at all, because it is what stops the next person looking.

⚠️⚠️ **THE FOUNDER'S RULE, WRITTEN AFTER HIS OWN CHECK CERTIFIED A DEFECT HE HAD PHOTOGRAPHED (2026-08-31):
AN ASSERTION THAT PASSES ON THE KNOWN-BAD STATE IS NOT A CHECK. EVERY NEW CHECK GETS RUN AGAINST THE
DEFECT IT WAS WRITTEN FOR, AND MUST GO RED, BEFORE IT IS TRUSTED.** Not a similar defect, not a
plausible one — **that** one, in the state it was in. It costs one `git stash` and one run, and it is
the only step that tells a real check from a decorative one. ⚠️ And when it passes on the bad state,
the finding is not "the check needs tightening": **you have the MECHANISM wrong**, and the check you
have been writing is measuring something else.

**The full rules — every corollary, with the incident that earned it, and the growing table of checks that
looked like checks and were not — are in [docs/checks.md](docs/checks.md). Read it before you write or trust
any check, gate, grep, migration, catalog query or audit.** Moved there on 2026-09-26 (Rafi's N20) because this
file is loaded into every session; nothing was dropped. The headline of each rule, so none is out of sight:

- Follow the value, not the signature.
- Anything that must happen as a consequence of a real action needs an end-to-end drive.
- AND ITS COROLLARY: DEAD CODE IS NOT NEUTRAL, IT IS A TRAP WITH A TIMER SOMEBODY ELSE STARTS.
- A CHECK THAT CRIES WOLF IS SPENT EXACTLY LIKE ONE THAT NEVER FIRES.
- A GATE IS NOT WORTH A CAPABILITY MORE DANGEROUS THAN WHAT IT DETECTS.
- "I CANNOT SEE" AND "THERE IS NOTHING TO SEE" MUST NEVER RENDER AS THE SAME RESULT.
- A MEASUREMENT WRITTEN INTO PROSE IS TRUE ONLY ON THE DAY IT WAS TAKEN.
- Make it fail before you believe it.
- AND PLANT IT WITH `scripts/break-check.sh`, NEVER BY HAND. A RULE THAT IS NOT IN THE FILE YOU ARE STANDING IN DOES NOT PROTECT YOU.
- A DEFECT CAN BE MASKED BY ANOTHER DEFECT, AND FIXING THE MASK DOES NOT CREATE THE SECOND FAULT — IT REVEALS ONE THAT WAS ALWAYS THERE AND NEVER HEARD.
- Bind the check to the intent, never to the implementation.
- A defect you notice in a neighbouring file gets WRITTEN DOWN before you go back to what you were doing
- STATE THE PROPERTY THE ASSERTION ACTUALLY CHECKS, NOT THE STRONGER ONE YOU BELIEVE IS TRUE.
- CONFIRM AN ENV VAR IS PRESENT IN THE TARGET ENVIRONMENT BEFORE THE DEPLOY THAT NEEDS IT, never after
- A ROUTE THAT REFUSES TO TELL AN ATTACKER ANYTHING REFUSES TO TELL YOU ANYTHING EITHER.
- Positive-control every absence.
- A FUNCTION DEFINITION IS `pg_get_functiondef` OUTPUT WITH NAMED LINES CHANGED. NEVER RETYPED, NEVER RECONSTRUCTED FROM A PARTIAL READ — AND THE REASON IS PRIVILEGE, NOT TIDINESS.
- THE SCHEMA AND THE CODE THAT USES IT MUST NEVER BE APART IN EITHER DIRECTION — AND ON THIS REPO THE CLIENT HALF DEPLOYS THE INSTANT YOU PUSH.
- (the original half, kept because its example is the sharper one) A MIGRATION THAT CHANGES WHAT RUNNING CODE READS SHIPS IN THE SAME COMMIT AS ITS READERS, OR AFTER THEM — NEVER BEFORE.
- ASSERT WHICH DATABASE YOU ARE ABOUT TO WRITE TO, IN THE REPO, AS A LITERAL.
- Query the thing, not the description of it.
- VERIFY THE TREE YOU ARE MEASURING IS THE TREE YOU THINK IT IS. A measurement taken on the wrong working state is not a weak measurement — it is a confident WRONG ANSWER, and it looks identical to a right one.
- AN INSTRUMENT CAN LIE IN THE CONFIDENT DIRECTION, AND `document.fonts.check()` IS ONE.
- YOU CAN REPRODUCE ANOTHER PLATFORM'S TEXT METRICS ON YOUR OWN MACHINE, AND IT TURNS A CI-ONLY DEFECT CLASS INTO A LOCAL ONE.
- Run it, don't read it.
- An inert clause is worse than no clause
- Prefer a structure that cannot express the bug over a check that catches it.
- CONFIRM THE THING YOU ARE TESTING IS IN THE ARTEFACT YOU ARE TESTING.
- A FAILING CALL IN A HARNESS IS TWO CLAIMS, NOT ONE.
- NEVER SCOPE A CHECK BY A CHARACTER COUNT. MATCH ON STRUCTURE.
- A COLUMN A CLIENT CAN WRITE MUST NEVER BE READ AS AN AUTHORISATION DECISION — AND AN RLS `with check` CONSTRAINS WHICH *ROW*, NEVER WHICH *COLUMN*.
- A FIXTURE IS DERIVED ENTIRELY, OR THE UN-DERIVED PART IS NAMED AND GATED. "MOSTLY DERIVED" IS UNDERIVED AT EXACTLY THE POINT WHERE THE TWO SCHEMAS CAN DISAGREE.
- CI IS NOT A GATE UNLESS SOMETHING STOPS A RED COMMIT. MEASURE WHETHER IT DOES BEFORE TRUSTING IT.
- A TIMEOUT FAILURE IS NOT AN ASSERTION FAILURE — ASK WHAT ELSE WAS RUNNING BEFORE BELIEVING IT.
- A FIXTURE IS A SECOND COPY OF THE SCHEMA. DERIVE IT.
- NEVER CHAIN A TEST RUN TO A COMMIT.
- A COUNT IS ONLY A CHECK WHEN YOU HAVE COUNTED THE RIGHT THING.
- A BRANCH ASSERTION IS SATISFIED BY A CONSTANT.
- PRE-REGISTER WHAT A NUMBER WILL MEAN, IN THE DOC, BEFORE THE QUERY SHIPS.

**Security runbook:** [docs/security.md](docs/security.md) — no longer auto-loaded (N20). Read it before any RLS policy,
grant or `SECURITY DEFINER` change.


# Project Context

## The product is Radlic (since 2026-09-24)
**Radlic**, at **https://radlic.com**, made by **Radlor Inc.** (support@radlor.com, noreply@radlor.com). It was
called Milo, then AdaptiveLearn at adaptivelearn.radlor.com, which becomes a 308 to radlic.com at the domain switch.
**There is no mascot**: no named character, no "Milo says…", no fox as a brand — a child's own avatar (fox, rabbit,
bear, cat) is data, not the mascot. Say "Radlic" in anything a person reads; keep the old name in identifiers
(`useMiloSpeaker`, `--milo-orange`, `milo_active_learner`, the repo, the Vercel/Supabase project names) because
stored data and running devices depend on them. `src/__tests__/renameGate.test.ts` fails on a visible old name, the
old domain or the mascot. Everything that needs the founder is in `docs/RENAME-MANUAL.md`.

## Session Continuity
At the start of every session, read @handoff.md to load the current state, recent decisions, and what was in progress. Treat it as the source of truth for where work left off, then continue from there.

## How lessons are made
**Read [docs/new-flow/README.md](docs/new-flow/README.md) before writing or building any lesson.** Since 2026-09-13 every lesson follows the founder's 9-screen "Step By Step Script" format, one module at a time: topic split → script doc → founder approval → build → verify. The old chapters are hidden (`LEGACY_CHAPTERS_HIDDEN`) and their design docs were deleted; `git log --diff-filter=D -- docs/` recovers them if ever needed.

## Updating the Handoff
When I type `/handoff`, or when the session is wrapping up, update handoff.md with:
- What was accomplished this session
- Current state of the work (what's done, what's in progress)
- Any decisions made and why
- Next steps / what to pick up next
- Any open questions or blockers

Keep handoff.md concise and current — overwrite stale info rather than appending endlessly.

**handoff.md is auto-loaded into every session's context, so its size is a running cost.** Keep it to the current state plus roughly the last five session blocks (~60 KB). When it grows past that, MOVE the oldest blocks — do not delete them — to the top of [docs/handoff-archive.md](docs/handoff-archive.md), which is not auto-loaded and is there to be `grep`ed. Do not add a duplicated summary footer; the blocks are the record.
