@AGENTS.md

# Radlic — how to work in this repo

At the start of every session read @handoff.md (current state and open items). The map of every doc is
[docs/START-HERE.md](docs/START-HERE.md). Before any lesson work read
[docs/product/building-lessons.md](docs/product/building-lessons.md). Before any RLS policy, grant or
`SECURITY DEFINER` change read §4 (Supabase: the RLS model and the DEFINER functions) of
[docs/architecture.md](docs/architecture.md).

## ⛔ Hard rules

- **Never query production — not even a read-only SELECT.** No Supabase MCP, no `psql`, no CLI, no script against
  the production database. Write the SQL instead, in `docs/legal/sql/<topic>.sql`, say what each column answers and
  what each result would mean, and wait for the founder to run it in the Supabase SQL editor. A read is still access
  to children's data.
- **Every PR opens as a Draft** (`gh pr create --draft`), follow-ups and one-line fixes included. Only the founder
  marks one Ready; never undo a Draft someone else set.
- **Never point the Supabase CLI at a remote database from a local checkout**: no `supabase link`, no `--linked`, no
  `--project-ref`, no `--db-url` that is not a throwaway local stack — not to read, not with `--dry-run`. Production's
  schema and migration ledger change only through GitHub workflows behind the `production-db` environment (the
  founder approves each run). The local CLI is for throwaway local stacks; rehearse there on a production-shaped
  copy. If a checkout is linked (`supabase/.temp/project-ref` exists), `supabase unlink` first and say so.
- **Generated text goes through a quoted heredoc (`<<'EOF'`) or a file write**, never an unquoted heredoc — that
  runs every backtick and `$(…)` inside it.

## The product

**Radlic** (radlic.com), by Radlor Inc.: adaptive maths from KG to grade 8. Say "Radlic" in anything a person reads.
**There is no mascot**: no named character, no "Milo says…", no fox as a brand — a child's own avatar is data.
Old names stay in identifiers (`useMiloSpeaker`, `--milo-orange`, `milo_active_learner`, the repo and project
names) because stored data and running devices depend on them. `src/__tests__/renameGate.test.ts` fails on a visible
old name.

## Docs

- New docs go only into this structure: `README.md`, `handoff.md`, `docs/START-HERE.md`, `docs/architecture.md`,
  `docs/decisions.md`, `docs/runbooks/`, `docs/product/`, `docs/legal/`. A new file is added to START-HERE.md.
- **No per-loop state files in the repo.** Loop notes go in the PR description.
- **A PR that changes behaviour updates the runbook and `docs/architecture.md` it affects, in the same PR.**
- A big decision gets one line in `docs/decisions.md`: date · what · why · PR.
- **`handoff.md` stays under 15 KB**: current state and open items only. When an item is done, delete it — the PR
  and `decisions.md` are the record. Update it on `/handoff` or when a session wraps up.
- The repo is public: no personal names or emails (say "the founder"), no child or account counts, no project refs,
  no keys, no details of a security issue that is not fixed yet.
- `src/__tests__/docLinks.test.ts` fails on a broken link or on any file naming a doc that is not there.

## A check is not a check until you have watched it fail for the right reason

Green is not evidence. Present is not enforcing. Found-nothing is not clean.

- **Run every new check against the defect it was written for — that one, in that state — and watch it go red
  before trusting it.** If it passes on the bad state, you have the mechanism wrong. Plant the break with
  `scripts/break-check.sh` (`npm run break`), never by hand: it parks your work, restores on a trap, and counts only
  a red from the named test's own assertion. Commit first; for e2e, break the served tree with a copy and a `trap`.
- A check is finished when it has also stayed green on a run where nothing is wrong, and its failure names
  something a reader can act on. A check that cries wolf is spent exactly like one that never fires.
- "I cannot see" and "there is nothing to see" never look the same: positive-control every absence (run the search
  on something you know is there); exit 2 = could not look, 1 = found a defect, 0 = looked and clean; a void result
  says what it failed to resolve.
- Checks here have looked real and were not: a skip path; the wrong shape; the wrong moment; the wrong order; the
  wrong flag state; a clause that cannot bind; the wrong target; a metric that can return only one value; an
  artefact without the feature; a world where the bug cannot happen; a drifted fixture; a one-sided permission
  test; a finding never measured, then amplified by whoever repeated it; the wrong mechanism; a measurement one
  click too early; a job that was never green; a check derived from the code it tests; an inert job nobody was told
  about; a byte window standing in for a boundary; both sides of a comparison sharing one omission; an order the
  real app hides; a file standing in for a screen; a dev server's StrictMode freeze read as a production fault. When a check fools you in a new way, add it here in a few words.
- **Bind the check to the intent.** Write the expected value out by hand. Never import it from the code under test,
  grep it from the file it lives in, or filter a query on the property you assert. Measure at the state where the
  defect lives — for anything behind a click, after the click.
- A negative test needs its positive twin, driven as the real caller: every REVOKE assertion gets a GRANT one.
- Never scope a check by a character count; match on structure (a statement terminator, balanced delimiters). A
  negated character class is structural only if the construct cannot contain that character — check it.
- A count is a check only when it counts the thing the rule is about. A branch assertion is satisfied by a
  constant: assert the derivation.
- An inert clause is worse than none — delete it. Prefer a structure that cannot express the bug over a check.
- A CI job goes green on the commit that adds it. A failing scheduled job tells somebody (it files an issue). CI is
  not a gate unless something stops a red commit — measure whether it does.
- A timeout is not an assertion failure: ask what else was running, and read the test's own timeout.
- A failing call in a harness is two claims: say what stopped running because of it.
- An instrument can lie confidently (`document.fonts.check()`): ask the consumer (`CSS.getPlatformFontsForNode`).
  `E2E_WIDE_TEXT=1` reproduces wider text metrics locally — only on the screen it is pointed at.
- Pre-register what a number will mean, in the same commit as its query.
- **Never chain a test run to a commit** (`npm test && git commit`). Read the result, then commit.

## Working honestly

- Query the thing, not the description of it. A measurement in prose is true only on the day it was taken: gate
  it, point at the check that re-measures it, or date it in the past tense.
- State the property the assertion actually checks, not the stronger one you believe. Do not repeat a claim past
  the evidence it came with; a restated instruction is not a confirmation.
- Verify the tree you are measuring (`git status` before you believe a number). When two of your measurements
  disagree, that is a fact about the tree.
- Confirm the thing you are testing is in the artefact you are testing.
- Follow the value, not the signature (`_props` is a confession). Anything that must follow a real action needs an
  end-to-end drive. Dead code is a trap somebody else springs: delete it.
- Removing a mask reveals faults that were always there: look hardest at the first run after a fix, and check the
  old tree before reverting a correct fix.
- A defect noticed in a neighbouring file is written down (in that file or the handoff) before you go back.
- A route that tells an attacker nothing tells you nothing: put the signal on a separate health route (booleans).
- A gate is not worth a capability more dangerous than what it detects. When a check needs a new key, role or
  endpoint, find what it can observe from outside instead.

## Database and deploys

- Production gets code when `deploy.yml` promotes `main` to `release` after CI; a migration waits for the founder's
  approval. So code usually lands first: the client tolerates both schema shapes (expand → migrate → contract). A
  deploy-order constraint you cannot design away goes at the top of the migration and in
  [docs/runbooks/migrations.md](docs/runbooks/migrations.md).
- A function definition is `pg_get_functiondef` output with named lines changed — never retyped. Adding or
  removing `SECURITY DEFINER`, changing `SET search_path` or an owner is a security change: say so in the commit and
  the PR. A new DEFINER function gets `revoke all … from public, anon, authenticated`; check `proacl` after.
- A column a client can write is never an authorisation decision; an RLS `with check` constrains the row, not the
  column. A privileged fact lives in its own table, RLS on, no policies. Assert both halves.
- A fixture is derived entirely, or its hand-written part is named and gated against the source CI uses.
- Assert which database you are about to write to, as a literal in the repo (`scripts/assert-prod-ref.sh`).
- Confirm an env var exists in the running target deployment before the deploy that needs it.
