@AGENTS.md

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

Seventeen of them now, sixteen across 2026-08-24/25 and one on 2026-08-31, and the mechanisms have
nothing in common. **This table is
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
| a hand-verification step reported as **passing** | **an artefact that does not contain the feature.** The build under test had no "Skip for now" in its bundle, so the child could not have skipped — the "pass" came from the OLD gate letting them through for its own reasons. ⚠️ Committed by the person READING the results rather than the one producing them, which is the version nobody catches |
| a browser drive of the plan card, green | **an environment where the failure cannot occur.** The harness used a rejected JWT, so `getLearnerBootstrap` 401'd and the cross-device reconcile — the exact code that wiped the field — never executed. A correct check, pointed at a world where the bug is impossible |
| an e2e seeding its own fixture, going red | **a check failing about a world that does not exist.** The spec hand-rolled the stored record (`done: string[]`) and the app's shape moved on (`results: DemoResult[]`), so the guard correctly rejected it and the gate reported a defect in working code. The mirror of the inert clause: not a check that cannot fail, but one that fails about nothing — and both spend the same thing, **the reader's trust in a red** |
| a REVOKE test proving an account cannot call the seat materialiser | **a one-sided permission check.** `M6` asserts `authenticated` is refused — and a function that **nobody at all** can execute satisfies that completely. Its one real caller is the Stripe webhook, arriving as `service_role`, and the suite never once asked whether *that* call works. ⚠️ **The system turned out to be fine** (see the row below); the SUITE was half a check, and no run of it could have told you which |
| ⚠️⚠️ **…and the FINDING I reported off that suite — "the first real purchase would have seated nobody"** | **a defect inferred from source and never measured — by the person writing the rule against exactly that.** I read a `REVOKE` with no matching `GRANT` and published the impact. One query settled it: Supabase's default privileges grant `service_role=X/postgres` explicitly and a revoke from `public, anon, authenticated` cannot remove it — four live functions of identical shape all read `{postgres=X,service_role=X}`. **A check-shaped FINDING needs the same positive control as a check**: *"this gate is blind"* is a claim, and it goes in this table only after it has been watched failing. Reading the repo answers what we intended; only querying production answers what is true |
| ⚠️⚠️ **…and the READER'S half of that one — the founder's own, added by him** | **a claim gains confidence each time it is repeated by someone who did not verify it.** I wrote *"would have"*; he wrote *"would have, and here is what it would have cost"*. **Nothing was measured in between — the certainty was manufactured by relay**, and it had already happened once that week (the environment-name trap). The producer's rule is *do not report what you have not watched fail*; the consumer's is **do not amplify a finding past the evidence it arrived with — if a report says "would have", ask "did you watch it?" before repeating it.** Neither half is enough alone: the second is the only one that catches an inference the first person believed |
| ⚠️ **AND THE RULE #14 LEAVES BEHIND, WHICH IS WHY IT IS HERE AS ITS OWN LINE** | **A NEGATIVE TEST WITHOUT ITS POSITIVE TWIN IS HALF A CHECK.** *"Nobody unauthorised can call it"* and *"nobody at all can call it"* are the same green. **Every REVOKE assertion needs a paired GRANT assertion — and the pair must be DRIVEN AS THE REAL CALLER**, not as the superuser a suite happens to run as. ⚠️ And note WHEN this class fires when it is real: not in development and not on a test account, but on the **first real purchase** — a parent pays, a flawless row appears, their child stays locked out, and every dashboard, test and log says fine. That cost is why the paired assertion is worth writing **even where you have measured the permission to be already in place**: what it buys is that the property stops depending on a platform default nobody in the repo controls |
| a text-equality + overflow check written for a line that rendered as "Lay blocks to t…" | **the wrong mechanism, and it was specified by the person who had SEEN the defect.** The whole string was in the DOM and `scrollWidth`/`clientWidth` were clean: the chapter's own question pill was painted OVER the strip, so the fault was OCCLUSION and the check measured OVERFLOW. It passed on the known-bad build — i.e. it would have certified the photographed defect as fixed. Re-written as a paint-order check it goes red naming `BUTTON(z45) 192,12,447,57`, which is the pill. ⚠️ Its own first draft then skipped that button, because it filtered on `position !== 'static'` and the covering pill IS static — it takes its stacking from an ancestor. **Two wrong instruments in a row for one defect, both written by someone looking straight at it** |
| a source gate reading `src.slice(at, at + 700)` | **a proxy for the boundary it meant.** A byte budget stands in for "this statement" / "this element", and ANY edit that adds bytes before the target moves it out of the window — after which the gate reports confidently about text it never saw. **Three times in one session** (a policy window running into the next policy; a 700-char slice losing its call when a prop was added above it; a window stopping at the first `) : (` *inside* the ternary it was checking). Not three mistakes — one technique that does not work |

A skip, a shape, a moment, an order, a flag, a dead clause, a wrong target, a one-valued metric, an
artefact without the feature, a world without the bug, a proxy boundary, a drifted fixture, a
one-sided permission, a finding published without one, that finding amplified by its reader, and a
check aimed at the wrong mechanism entirely. **You
cannot learn to spot these by pattern** — nothing about any of them looked wrong, and four
were written by someone who had just written down the rule that catches them. The only thing
separating a real check from these is having watched it go red for the reason it exists.

⚠️⚠️ **AND THERE IS AN ELEVENTH THAT IS A DIFFERENT ANIMAL — NOT A CHECK THAT CANNOT FAIL, BUT A
WIRE THAT IS NOT CONNECTED WHILE BOTH ENDS READ AS CONNECTED.**

`ChapterProps.onComplete` has been in every chapter's signature since the beginning. Both registry
factories in `ChapterPortal` took it as `_props` and dropped it. **Its first occurrence is the
three-month P0** — `/game`'s handler was never invoked, so every chapter scored correctly while no
child's diagnostic plan moved. That was fixed by relocating the plan pointer into `finishAndSync`,
which was the right fix, **and left the prop in place: still typed, still passed, still discarded.**
On 2026-08-25 the next caller trusted it — `/demo`, which cannot use `finishAndSync` at all, because
a logged-out visitor has no learner and it returns at `if (!learner) return`.

**What makes this class its own is that it is invisible from BOTH ends.** The caller believes it
passed a handler and has no way to see it was ignored. The chapter shows its end screen either way,
so the screen a person looks at is identical whether the wire is connected or cut. Everything above
is a check that could not fail; this is a connection nobody is checking at all, and neither side is
wrong to think it holds.

- **Follow the value, not the signature.** A prop's presence in a type is not evidence it is read;
  grep the consumer for the parameter NAME (`_props` is a confession) before building on it.
- **Anything that must happen as a consequence of a real action needs an end-to-end drive.** Nothing
  cheaper can see this: a unit test calls the callback itself, and a source check reads the caller.
  `e2e/demo-route.spec.ts` plays a chapter to its end and asserts the DEMO advanced — deliberately
  not the chapter's end screen, which looks the same when the callback is discarded.
- ⚠️⚠️ **AND ITS COROLLARY: DEAD CODE IS NOT NEUTRAL, IT IS A TRAP WITH A TIMER SOMEBODY ELSE
  STARTS.** `/game`'s dormant handler set a `chapterDone` flag, and the mount read
  `{!chapterDone && playingChapter && …}`. Harmless for three months — and the moment the wire was
  connected, i.e. the moment somebody did the obviously correct thing, **every chapter in the app
  would have unmounted the instant a child finished it**, taking its own end screen with it. The
  landmine is armed by the fix, so the person who trips it is never the person who laid it. Delete
  dead code; do not gate it and do not leave it "in case".

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
- ⚠️⚠️ **CONFIRM THE THING YOU ARE TESTING IS IN THE ARTEFACT YOU ARE TESTING.** Before reading any
  hand-verification result, check the feature is actually present — a string from it in the deployed
  bundle, a version marker, anything. A pass on a build without the feature is not a weak pass, it
  is a reading of some *other* mechanism, and it is indistinguishable from success. This one is most
  dangerous when the person checking is not the person who built it: they have no reason to doubt
  the artefact, and the builder never sees the run.
- ⚠️⚠️ **A FAILING CALL IN A HARNESS IS TWO CLAIMS, NOT ONE.** "This error is noise" is usually
  right. "And nothing downstream of it mattered" is never free, and it is the one that costs. Four
  401s in a drive were correctly diagnosed as a fake JWT AND silently meant an entire code path —
  the one holding the bug — never ran. When you dismiss an error in a test run, say out loud what
  stopped executing because of it.
- ⚠️⚠️ **NEVER SCOPE A CHECK BY A CHARACTER COUNT. MATCH ON STRUCTURE.** Balanced delimiters, a
  statement boundary, a negated class that cannot cross the thing (`[^;]*` for a SQL statement,
  `[^>]*` inside one JSX tag), or the literal itself. A `slice(at, at + N)` and a `[\s\S]{0,N}?` are
  the same fault: **a byte budget is a proxy for a boundary**, and any edit that adds bytes before
  the target silently moves it outside — the gate then passes, or fails on correct code, having
  examined text that is not the text it names. ⚠️ Where a lazy quantifier already ends on a real
  terminator (`[\s\S]*?\/>`), the numeric cap adds nothing and can only cut the match short:
  delete it, and bound the middle with a class that cannot leave the construct.
  ⚠️⚠️ **AND A NEGATED CLASS IS ALSO A PROXY — IT ONLY LOOKS STRUCTURAL.** `[^>]*` is a real bound
  inside a SQL statement and a lie inside JSX, because an arrow function's `=>` contains a `>`, so
  the class stops before the element even begins. **A negated class is structural only if the
  construct genuinely cannot contain that character, and that is something to CHECK, not assume.**
  Found by the suite going red on correct code during the sweep that removed the character windows —
  the sweep paying for itself inside itself. Where you cannot name such a character, walk the
  delimiters (`src/__tests__/_window.ts`).
- ⚠️ **A FIXTURE IS A SECOND COPY OF THE SCHEMA. DERIVE IT.** A hand-written seed drifts from the
  shape the app actually stores, and then the gate reports on a state the app can never be in —
  failing about a world that does not exist. Where a fixture must exist, build it with the same
  factory or type the app uses, so it cannot drift independently; where it must be literal, make the
  shape guard the thing that fails, and read the failure as "my fixture is stale" before "the code
  is broken".
- ⚠️⚠️ **NEVER CHAIN A TEST RUN TO A COMMIT.** `npm test && git commit` does not wait for anyone to
  READ the result: the message is written before the outcome exists and is then true by assertion.
  Same family as asserting a result you have not read, except the vector is a shell operator, which
  makes it invisible — this is how a red suite got committed under a message claiming green
  (2026-08-25). **Separate invocations, always**, with the output actually read in between. There is
  no exception for "it was green a minute ago".
- ⚠️ **A COUNT IS ONLY A CHECK WHEN YOU HAVE COUNTED THE RIGHT THING.** A gate asserting
  `props.onExit` appears twice — it appears four times, once per condition and once per call — went
  red on correct code, **and reverting a factory made the count right, so the mutation made the
  broken gate pass**. Count the things the rule is about (the two factories), not the occurrences of
  a token.
- ⚠️ **A BRANCH ASSERTION IS SATISFIED BY A CONSTANT.** Checking that the code *branches* on a value
  says nothing about whether that value is ever computed: hard-coding the input passed every
  branch-shaped check written for it. Assert the DERIVATION — that the real function is called, at
  every call site, counted — and forbid the literal.
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
