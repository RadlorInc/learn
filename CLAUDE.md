@AGENTS.md

# A CHECK IS NOT A CHECK UNTIL YOU HAVE WATCHED IT FAIL FOR THE RIGHT REASON

**Green is not evidence. Present is not enforcing. Found-nothing is not clean.**

The most expensive defect class in this repo is not a bug. It is **something that looks like a check
and isn't** — a gate, grep, guard or test that reports success while examining nothing. It is worse
than having no check at all, because it is what stops the next person looking.

Eight of them on 2026-08-24 alone, and the mechanisms have nothing in common. **This table is
meant to grow — a frozen list becomes decoration itself.** Add the next one rather than admiring it:

| what it looked like | what it was |
|---|---|
| `ci / rls-tests` green for weeks | a **skip path**. The suite proving one family cannot read another's data had never run once |
| a clean bundle grep for a leaked service key | **wrong shape** — it searched for JWTs, and the keys are `sb_secret_`, so it could not have found one if it were there |
| `all-chapters` passing on all 70 chapters | **wrong moment**. It read its failure text at `domcontentloaded`, before the screen existed, so it could not fail |
| the policy-regression gate finding zero | **wrong order.** Correct gate, correct corpus — but `baseline_schema.sql` was ordered LAST, and being generated from live production it supplied the very predicate a regression had just removed. Ordered first it flags the real one |
| the post-apply smoke write succeeding | **wrong flag state.** With `enforced = false` the write succeeds whether the guard holds or not — it cannot fail in the interesting direction |
| `asked < maxItems` guarding the coverage rule | **a clause that cannot bind.** A cap always leaves the agenda or a frame open; in the one case it was not redundant it was *wrong*, reporting a finished search as partial |
| `git pull` on `main` saying "Already up to date" | **the wrong target.** Local `main` tracked `origin/chore/applied-billing-migrations`, a deleted feature branch — so the pull succeeded, twice, while `main` sat two commits behind, and a `push` from `main` would have gone to the dead branch. The command reported success having done nothing *to the thing that was asked about* |
| a "what share of parents skip the check" query | **a population that excludes the alternative.** It counted `checkup_offer` rows and divided — but only a SKIP emits that event, so the denominator was made entirely of skippers and the query could only ever return **100%**. Not a check at all: a METRIC that can return exactly one value, which would have been reported, believed and acted on |

A skip, a shape, a moment, an order, a flag, a dead clause, a wrong target, a one-valued metric.
**You cannot learn to spot these by pattern** — nothing about any of them looked wrong, and four
were written by someone who had just written down the rule that catches them. The only thing
separating a real check from these is having watched it go red for the reason it exists.

⚠️ **AND THE CLASS REACHES NUMBERS, NOT JUST CHECKS.** The eighth is the sharpest because nothing
about it is code: a metric whose population cannot express the comparison it claims to make is worse
than having no metric, because a founder acts on it. **Before shipping a query, ask what values it
is CAPABLE of returning** — if the answer is "one", it is decoration with a percentage sign.

Everything below is a corollary of that one sentence:

- **Make it fail before you believe it.** Plant the defect it exists for, or point it at a known
  past one. A new check's green first run is the least informative result there is — equally
  consistent with "nothing is wrong" and "this cannot see anything".
- **Positive-control every absence.** Before reporting no secret in the bundle, no caller of a
  function, no offending pattern in the source: run the same search against something you KNOW is
  present and watch it come back. A silent search and a broken search look identical from outside,
  and the broken one reads as good news.
- **Query the thing, not the description of it.** Reading the repo answers *what did we intend*;
  querying production answers *what is true*. Only the second is a check. The reverted V5 payload
  bounds were invisible to the repo grep — it was case-sensitive — and took `pg_get_functiondef`
  one query.
- **Run it, don't read it.** Reading the rollback script caught one defect; only running it proves
  the schema comes back. Same for a mutation: assert the edit actually landed before concluding
  anything about the gate it was meant to test.
- **An inert clause is worse than no clause**, because it reads as protection and nobody looks
  again. If a condition cannot change the answer, delete it — and check first whether the case
  where it *isn't* redundant is a case where it is wrong.
- **Prefer a structure that cannot express the bug over a check that catches it.** A flag someone
  must remember to set is a check waiting to rot; a call with no flag to set cannot rot. Where both
  are available, take the structure and spend the check elsewhere.
- ⚠️ **PRE-REGISTER WHAT A NUMBER WILL MEAN, IN THE DOC, BEFORE THE QUERY SHIPS.** Deciding what a
  result would tell us is only honest while we still do not know what it says; once it says
  something, everyone has a reason to read it their way. Standing rule from 2026-08-24 — the
  skipper-conversion metric was shipped with *"a bad number means the grade-start plan is not good
  enough, NOT that the check should be re-forced"* already written down. **Every metric added from
  here carries its interpretation in the same commit as its query.**

⚠️ **This is not a chapter rule.** It governs every grep, gate, migration, catalog query and audit
in the repo. [docs/chapter-craft.md](docs/chapter-craft.md) §4 carries the chapter-shaped costumes
of the same class — a tautological check, a gate that re-implements the rule it guards, a sweep
that exempts the whole world. Put new ones of that kind there, and the general form here.

# Project Context

## Session Continuity
At the start of every session, read @handoff.md to load the current state, recent decisions, and what was in progress. Treat it as the source of truth for where work left off, then continue from there.

## How chapters must look, move and sound
@docs/chapter-craft.md is the standing spec for the 3–11 story chapters — the animation, the art and the voice. **Read it before building or changing any of them.** It covers the shape of a chapter, how a walk cycle and its travel must agree, what may be an answer object, how to choose a backdrop, how to generate a new drawn cycle, how Milo speaks, and how to verify any of it.

Every rule in it was paid for by a founder catching a fault on a screenshot, and most were learned in chapter 1, forgotten, then re-learned the hard way in a later chapter. It exists so a new session starts from them instead of rediscovering them. When a correction lands, write the GENERAL rule there — not just the fix.

Two job-specific halves are NOT auto-loaded, to keep the standing spec small. Read the one the job calls for, and put new rules of that kind in it rather than back in chapter-craft.md:
- `docs/chapter-craft-ar.md` — **before building or changing any AR (camera) chapter.**
- `docs/chapter-craft-art.md` — **before generating any new art** (sprite, walk cycle, backdrop, line art) **or touching the code-drawn 3D scene.**

## Updating the Handoff
When I type `/handoff`, or when the session is wrapping up, update handoff.md with:
- What was accomplished this session
- Current state of the work (what's done, what's in progress)
- Any decisions made and why
- Next steps / what to pick up next
- Any open questions or blockers

Keep handoff.md concise and current — overwrite stale info rather than appending endlessly.

**handoff.md is auto-loaded into every session's context, so its size is a running cost.** Keep it to the current state plus roughly the last five session blocks (~60 KB). When it grows past that, MOVE the oldest blocks — do not delete them — to the top of [docs/handoff-archive.md](docs/handoff-archive.md), which is not auto-loaded and is there to be `grep`ed. Do not add a duplicated summary footer; the blocks are the record.
