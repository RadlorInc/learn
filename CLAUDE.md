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

Nineteen of them now, sixteen across 2026-08-24/25 and three on 2026-08-31, and the mechanisms have
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
| ⚠️⚠️ **…and the READER'S half of that one — the founder's own, added by him** | **a claim gains confidence each time it is repeated by someone who did not verify it.** I wrote *"would have"*; he wrote *"would have, and here is what it would have cost"*. **Nothing was measured in between — the certainty was manufactured by relay**, and it had already happened once that week (the environment-name trap). The producer's rule is *do not report what you have not watched fail*; the consumer's is **do not amplify a finding past the evidence it arrived with — if a report says "would have", ask "did you watch it?" before repeating it.** Neither half is enough alone: the second is the only one that catches an inference the first person believed. ⚠️⚠️ **AND ON 2026-08-31 IT RAN A THIRD TIME WITH A NEW NODE: the claim came back as an INSTRUCTION.** I reported a PR as open (reading a stale line in `handoff.md` rather than asking GitHub); the founder reconfirmed *"merge #68 first"* twice, in separate replies, without checking either — and **once a guess is repeated back as the agreed plan it stops looking like a guess**, so neither of us looked for three exchanges. It had merged three days earlier. **A restated instruction is not a confirmation; it is the same unverified claim with more authority on it** |
| ⚠️ **AND THE RULE #14 LEAVES BEHIND, WHICH IS WHY IT IS HERE AS ITS OWN LINE** | **A NEGATIVE TEST WITHOUT ITS POSITIVE TWIN IS HALF A CHECK.** *"Nobody unauthorised can call it"* and *"nobody at all can call it"* are the same green. **Every REVOKE assertion needs a paired GRANT assertion — and the pair must be DRIVEN AS THE REAL CALLER**, not as the superuser a suite happens to run as. ⚠️ And note WHEN this class fires when it is real: not in development and not on a test account, but on the **first real purchase** — a parent pays, a flawless row appears, their child stays locked out, and every dashboard, test and log says fine. That cost is why the paired assertion is worth writing **even where you have measured the permission to be already in place**: what it buys is that the property stops depending on a platform default nobody in the repo controls |
| a text-equality + overflow check written for a line that rendered as "Lay blocks to t…" | **the wrong mechanism, and it was specified by the person who had SEEN the defect.** The whole string was in the DOM and `scrollWidth`/`clientWidth` were clean: the chapter's own question pill was painted OVER the strip, so the fault was OCCLUSION and the check measured OVERFLOW. It passed on the known-bad build — i.e. it would have certified the photographed defect as fixed. Re-written as a paint-order check it goes red naming `BUTTON(z45) 192,12,447,57`, which is the pill. ⚠️ Its own first draft then skipped that button, because it filtered on `position !== 'static'` and the covering pill IS static — it takes its stacking from an ancestor. **Two wrong instruments in a row for one defect, both written by someone looking straight at it**. ⚠️⚠️ **AND THE RULE HAS A SECOND HALF, ADDED 2026-08-31 AFTER THE SAME SHAPE APPEARED AT A PHONE WIDTH: it is not just WHAT to assert, it is AT WHICH STATE OF THE UI.** A video-reviewer spec checked that the *Add note* button landed inside a 390×844 viewport — the right property, measured one click too early. An uncapped 9:16 video is ~622px tall, so the BUTTON still fits; it is the note COMPOSER, which only exists after the click, that falls off the bottom. The spec passed with the phone rule deleted. **Drive the UI to the state the defect lives in before you measure**, and if a defect only exists after an interaction, the assertion goes after the interaction |
| ⚠️⚠️ **`Nightly E2E`: 12 runs, 12 red, from the day it was created** | **a check that has never been green was never a gate — the founder's rule, 2026-08-31.** It shipped red on 2026-08-19 and stayed red, so its output became noise nobody read; a REAL regression (an AR chapter's *"Use taps instead"* — the escape hatch from the camera — hanging half off a 640×320 screen) sat inside it in the open for **seven nights**. A permanently-red job is the mirror of a vacuous green one and costs more, because its existence is what stops anyone looking. **A new CI job must go green on the commit that adds it, or it does not land** — and a red nightly nobody is notified about is the same failure in a third shape, so the job files an issue when it fails |
| ⚠️⚠️ **a gate grepping `menu/page.tsx` for `'Milo picked this to close the gap'` — and, a week later, an e2e spec that `import`ed the seven review questions it was asserting** | **A CHECK MUST STATE THE INTENT INDEPENDENTLY OF THE CODE. If it imports the value it asserts, greps the file the value lives in, or otherwise derives its expectation from the thing under test, it is TAUTOLOGICAL: it passes because the code equals itself, and it will pass through any change you make.** Founder's rule, 2026-08-31, after the second instance — these are one rule in two costumes, which is why they share a row. **(a)** The grep: The words moved into `core/planCopy.ts` (2026-08-31, when a repeat chapter needed its own line) and the check became an empty grep — **still green, testing nothing**, with its own message reading "the plan subtitle is gone — this gate is inert" and nobody to read it. It only surfaced because a refactor happened to run the suite. **Anchor a check to the VALUE a component renders, not to the text of the file the string used to live in** — that gate now drives `planLine()` and cannot go vacuous by relocation. ⚠️ This will keep happening while copy is being moved into pure modules, which is the right direction: the gate has to move with it. **(b)** The import (video-reviewer repo, 2026-08-31): the spec asserting the seven review questions appear *verbatim* did `import { QUESTIONS } from '../src/lib/review'` and looped `toContainText`. Reworded question 7 to *'One thing to cut.'* — the founder's line is *'One thing to cut. Every draft has one.'* — and the spec **stayed green**, because it was asserting that the code equals itself. Re-written with the seven strings **written out in the spec** and a deep-equal against the rendered `<li>`s, it goes red on the reword, and now also catches a dropped question, a re-ordered one and an eighth. ⚠️ The duplication IS the mechanism: changing a question takes two edits, and the failing test in between is the reminder that the wording is a decision, not a detail. A future reader who DRYs it back to an import has silently deleted the check. ⚠️⚠️ **AND (c), A THIRD FACE OF THE SAME DISEASE: A CHECK THAT FILTERS ON THE PROPERTY IT IS TESTING.** video-reviewer, 2026-09-01: a spec asserting that a new issue was flagged `all_chapters` fetched the row with `?all_chapters=eq.true&order=created_at.desc&limit=1`. Break the flag and the query simply returned an OLDER row that already had it — green, on a build where the feature was gone. **A filter that can only return rows already satisfying the assertion is not a query, it is a way of not looking.** Fetch the row by its identity (newest overall, or by id), then assert the property. The tell is a WHERE clause naming the same column as the `expect`. So: (a) grep-coupled to where a literal lives, (b) import-coupled to the value under test, (c) filter-coupled to the property under test — all three pass because the code equals itself. ⚠️⚠️ **AND (c), THE ONE THAT SAYS WHERE TO LOOK NEXT: the class recurs in the TOOLS BUILT TO DETECT IT.** `scripts/break-check.sh` in that repo exists to run the suite against a deliberately broken tree and prove a check goes red — and its first version **exited 0 when the suite PASSED on the broken state**, i.e. it reported its own worst outcome as success to anything reading the status. Same defect one level up, in the instrument. **Check the checker with the question you check everything else with: what result is this incapable of distinguishing?** Its second gap was the mirror — it accepted ANY red as proof, so a break that stopped the code compiling would have certified a check that would also go red if you deleted a semicolon; it now requires the red to come from the named spec's own assertion |
| `Backup (prod database)` — 30 nightly runs, 30 green, `Dump schema + data: skipped` on every one | **row 1 again, this time BY DESIGN.** The workflow is "inert until configured" so it would not train people to ignore a red — and the price is that nobody was told it had never run. Found 2026-09-03 while planning a region move that needs a dump as its first step. **An inert-by-design job still owes somebody a signal that it is inert** — a warning nobody reads is the same as none; file an issue on the skip, or make the skip a red on a schedule that somebody owns |
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
- ⚠️⚠️ **AND PLANT IT WITH `scripts/break-check.sh`, NEVER BY HAND. A RULE THAT IS NOT IN THE FILE
  YOU ARE STANDING IN DOES NOT PROTECT YOU.** Founder's rule, 2026-09-04, after this went wrong for
  the second time in one session: a stray `git checkout` in my own mutation cleanup silently
  reverted a fix from ten minutes earlier — in the same session I had already been warned about it,
  with the discipline written down in THIS FILE and the tool that prevents it (`break-check.sh`)
  already built and working one repo over, in `video_reviewer`. Written-down care is not a
  mechanism; neither is a tool nobody standing here can see. The port is now `scripts/break-check.sh`
  + `scripts/break-verdict.mjs` (`npm run break`), and:
  - **It restores on a trap (`EXIT INT TERM`), not on remembering** — your uncommitted work is
    parked in a stash first, the break is stashed and dropped afterwards, and it prints
    `git status --short` so you SEE the tree came back rather than assuming it. Proven against a
    13-path dirty tree including untracked files: byte-identical, on every exit code and on Ctrl-C.
  - **It refuses to accept any red as proof.** A break that stops the file parsing turns the run red
    without the assertion ever running, and a tool that counted that would certify a check that also
    goes red if you delete a semicolon — green-for-the-wrong-reason wearing the other hat. Exit 0
    means the NAMED file failed on its own `AssertionError`; 1 means it passed on the broken state
    (the check is decorative); 3 the break edited nothing; 4 red for the wrong reason; 5 nothing ran.
  - ⚠️ **And the checker is itself checked, with LIVE breaks rather than crafted fixtures**
    (`npm run break:live`, one real break per exit code, asserting the code AND the restore). A
    hand-written JSON fixture encodes the runner's report shape on the day it was written and keeps
    passing after an upgrade changes it. That is not hypothetical: writing this, the exit-5 case came
    back as 4, and measuring showed vitest reports a broken SETUP file byte-identically to a broken
    SOURCE file — so the reader genuinely cannot tell them apart, and the tool now says so instead of
    pretending. **Re-run it after any vitest upgrade.**
  - ⚠️ **AND IT NOW EXISTS TWICE, WITH DIFFERENT RUNNERS, SO A FIX TO ONE WILL NOT REACH THE OTHER.**
    The original is `video_reviewer/scripts/break-check.sh` and drives **playwright**; this port
    drives **vitest**, and the verdict half — a report shape and an error-message format — is exactly
    where they diverge. A shared version would need one reader that knows both runners and has been
    watched failing in both, which is more than either repo needs, so the duplication is deliberate.
    **What is not deliberate is a lesson landing in one copy only: if you improve the verdict logic,
    the trap or the exit codes here, say so in `video_reviewer`'s CLAUDE.md too, and vice versa.**
    Noted in both, 2026-09-04.
- ⚠️⚠️ **A DEFECT CAN BE MASKED BY ANOTHER DEFECT, AND FIXING THE MASK DOES NOT CREATE THE SECOND
  FAULT — IT REVEALS ONE THAT WAS ALWAYS THERE AND NEVER HEARD.** Founder's rule, 2026-09-04. Order
  Desk and Level Run each declared their question TWICE — `say: d => d.ask` on the beat AND their own
  `speak(data.ask)` in the component — and for months that was inaudible, because the shell's line
  SUPERSEDED the chapter's: two declarations, one thing heard. The moment the shell was fixed to
  queue instead of cut, the duplicate became a question asked twice in a row. **Nothing about the
  duplicate changed; the thing hiding it did.** The costly reading of that morning is *"the fix made
  it worse, revert it"* — reverting a correct fix to restore a mask, and burying the second defect
  again where it will surface for somebody else. Two halves:
  - **The first run after a fix is where to look hardest**, not where to relax. A fix that removes a
    suppressor is an X-ray: whatever it was covering shows up all at once, and it will look like
    regression because it is new *to you*.
  - **A new symptom appearing right after a fix is not evidence the fix was wrong.** It is evidence
    of a second fault, until measured otherwise — so measure which: was the second thing already
    true in the old tree, just unobservable? For the duplicate that was one command —
    `git show HEAD:<file> | grep` for both declarations — and both were there, months old.
  ⚠️ The general form is that **suppression is not absence, and any mechanism that "wins" over
  another is a mask**: a supersede, a cache, a catch that swallows, a clamp, an early return, a
  `?? fallback`. When you remove one, enumerate what it was standing in front of BEFORE you ship —
  that is a five-minute question at the keyboard and an hour of reverting afterwards.
- **Bind the check to the intent, never to the implementation.** If the expectation is imported from, grepped out of, or otherwise derived from the code under test, the check asserts that the code equals itself and will survive every change you make. Write the expected value out, in the test, by hand — and **measure it at the state of the UI where the defect actually exists**, which for anything behind a click is after the click.
- **A defect you notice in a neighbouring file gets WRITTEN DOWN before you go back to what you were doing** — in that file, or in that repo's handoff, where its next reader will stand. Not fixed, not escalated, not carried in your head to the end of the task: written. Two minutes, which is why it survives being busy. Founder's rule, 2026-08-31, after I named a weaker property in a sibling script while fixing its twin and moved on — the same shape as the `/api/waitlist` finding, which only got recorded because I was told to record it. **Noticing is not the deliverable; the note is.**
- ⚠️ **STATE THE PROPERTY THE ASSERTION ACTUALLY CHECKS, NOT THE STRONGER ONE YOU BELIEVE IS TRUE.** A report that overstates a PASSING test is harder to catch than a failing one, because everything downstream reads as verified and nothing ever goes red. Founder's rule, 2026-08-31: a spec compared two 404 pages' `innerText` and passed; by the time it reached the reader it had become *"byte-identical bodies"*. The raw HTML was never identical — Next serialises the route param, so each 404 carries its own token. **Nobody's check was wrong; the sentence about it was.** It surfaced only because a later run compared the raw bodies and disagreed with the passing test — the two-instruments rule catching a defect in the NARRATION rather than in the code. When a claim and a test disagree, the claim is the more likely liar.
- ⚠️ **CONFIRM AN ENV VAR IS PRESENT IN THE TARGET ENVIRONMENT BEFORE THE DEPLOY THAT NEEDS IT, never after** — and on Vercel confirm it from the RUNNING deployment, because setting it only takes effect on the next one. Founder's rule, 2026-09-01, after radlor.com's public waitlist form was taken down for ~4 minutes by a route switched to a key that was not in that project's environment. The risk had been named out loud before the push. **An unseen risk is a gap in knowledge; a seen-and-shipped one is a gap in the moment between knowing and acting — and only the second is fixable by a rule.**
- ⚠️ **A ROUTE THAT REFUSES TO TELL AN ATTACKER ANYTHING REFUSES TO TELL YOU ANYTHING EITHER.** The same waitlist route answers `303` on success and failure alike, which is correct and is exactly why a fully broken endpoint looked healthy. Do not weaken the endpoint; move the signal off the public path — a health route reporting whether the dependency is CONFIGURED, booleans only, named after the variable rather than the role.
- **Positive-control every absence.** Before reporting no secret in the bundle, no caller of a
  function, no offending pattern in the source: run the same search against something you KNOW is
  present and watch it come back. A silent search and a broken search look identical from outside,
  and the broken one reads as good news.
- ⚠️⚠️ **A FUNCTION DEFINITION IS `pg_get_functiondef` OUTPUT WITH NAMED LINES CHANGED. NEVER
  RETYPED, NEVER RECONSTRUCTED FROM A PARTIAL READ — AND THE REASON IS PRIVILEGE, NOT TIDINESS.**
  Founder's rule, 2026-09-05, after I rebuilt `get_insights_rollup` from a truncated read while
  changing one WHERE clause: the retype silently dropped `active_days`, `accuracy`, `event_counts`
  and `daily_days` from the return shape **and added a `SECURITY DEFINER` the original does not
  have.** The shape was the visible half. The dangerous half is the one word.
  **`SECURITY DEFINER` makes a function run as its OWNER, and the owner owns the tables, so RLS is
  not applied.** In an app whose entire protection of children's data is RLS — one family cannot
  read another's — that is the most expensive single word that can be introduced by accident, and
  it arrives looking like boilerplate you copied because every neighbouring function has it.
  So the rule has two halves, and the second is the point:
  - **the mechanism** — copy the definition from the live database and change only lines you can
    name. If you cannot say which lines you changed, you have not made an edit, you have made a
    replacement;
  - **the privilege rule it protects** — any diff that ADDS OR REMOVES `SECURITY DEFINER`, changes
    `SET search_path`, or changes an owner **is a security change and must be called out as one in
    the commit message and the review**, never a side effect of retyping. A migration that alters
    one of those without saying so is indistinguishable from an attack, and it will pass every test
    in this repo, because the tests run as a role that was never going to be stopped anyway.
  ⚠️ And the ambient pressure runs the wrong way: most RPCs here genuinely need DEFINER, so the
  word looks right everywhere. Check what the ORIGINAL had, not what its neighbours have.
- ⚠️⚠️ **A MIGRATION THAT CHANGES WHAT RUNNING CODE READS SHIPS IN THE SAME COMMIT AS ITS READERS,
  OR AFTER THEM — NEVER BEFORE.** Founder's rule, 2026-09-05. Making `sessions.started_at` nullable
  and fixing the six readers that assumed it was always set went in as two commits, so for a while
  `main` held a migration that would have taken DAU/WAU silently downward the moment anyone applied
  it. Nothing auto-applies here, so nothing broke — but the window existed, and "nothing applies
  automatically" is a fact about today's CI, not a property of the repo. **Expand, migrate,
  contract**: the readers tolerate both shapes first, the data moves second, the old shape is
  removed third. A deploy-order constraint discovered while writing a migration belongs **at the
  top of that migration file and in the deploy runbook** — never only in a report or a chat
  message, because the person applying it in six weeks is reading the file, not the conversation.
- ⚠️ **ASSERT WHICH DATABASE YOU ARE ABOUT TO WRITE TO, IN THE REPO, AS A LITERAL.** A wrong
  connection target is worse than a missing one: a missing one fails, and a wrong one **succeeds
  against the wrong database and reports green**. `PROD_PROJECT_REF` pointed at the decommissioned
  Sydney project for two days after the region move, and `migrate-prod` was inert only because
  three unrelated things happened to be absent — one of which was on the roadmap to be created
  deliberately. **An inert landmine with a scheduled step-on date is not a noted risk, it is a
  countdown.** `scripts/assert-prod-ref.sh` refuses unless the configured ref equals a literal in
  the repo, so changing which database is production takes a reviewed commit rather than a
  dashboard edit that leaves no diff.
- **Query the thing, not the description of it.** Reading the repo answers *what did we intend*;
  querying production answers *what is true*. Only the second is a check. The reverted V5 payload
  bounds were invisible to the repo grep — it was case-sensitive — and took `pg_get_functiondef`
  one query.
- ⚠️⚠️ **VERIFY THE TREE YOU ARE MEASURING IS THE TREE YOU THINK IT IS. A measurement taken on the
  wrong working state is not a weak measurement — it is a confident WRONG ANSWER, and it looks
  identical to a right one.** Founder's line, 2026-08-31, after this one: a fix was stashed to run a
  known-bad control, restored, and then swallowed by a `git commit -a` on a scratch branch two
  commands later — so the next probe measured unfixed code and reported it FIXED, with plausible
  numbers. What caught it was two instruments disagreeing (a probe said the card held, the spec said
  it did not) and looking instead of picking the flattering one. **`git status` before you believe a
  number**, and treat any disagreement between two of your own measurements as a fact about the
  tree, not a rounding error.
- ⚠️⚠️ **AN INSTRUMENT CAN LIE IN THE CONFIDENT DIRECTION, AND `document.fonts.check()` IS ONE.**
  It answered **false** for `15px "IBM Plex Sans"` on two platforms while Chrome was demonstrably
  PAINTING that exact face (`CSS.getPlatformFontsForNode` → `familyName: 'IBM Plex Sans',
  isCustomFont: true`) — so "the webfont did not load" was a confident wrong answer that survived
  into a PR body. It returns false for a face that is loaded but split across unicode-range subsets,
  among other things, and there is no error to notice. **Ask the consumer what it did, not the API
  what it thinks**: for fonts that is `CSS.getPlatformFontsForNode` over CDP, which reports what was
  actually rasterised. Second time in one stretch that a check's own reliability was the finding.
- ⚠️ **YOU CAN REPRODUCE ANOTHER PLATFORM'S TEXT METRICS ON YOUR OWN MACHINE, AND IT TURNS A
  CI-ONLY DEFECT CLASS INTO A LOCAL ONE.** `E2E_WIDE_TEXT=1` (`e2e/all-chapters.spec.ts`,
  `e2e/start-card.spec.ts`) widens every glyph's advance by 8% via `letter-spacing`. On the
  known-bad start card it reproduces the CI failure **verbatim on a Mac** — `top 288, −13px past the
  bottom`, the runner's exact number — for a defect that had been invisible locally for a week.
  ⚠️ **Two caveats, both load-bearing.** The 8% was chosen to clear the **5.1%** measured between two
  real platforms; it is **not a proven worst case** for every device, only wider than the gap we have
  evidence for. And a stress is only as good as the screen it is pointed at: with the flag on and the
  defect restored, `all-chapters` at shortPhone reported **3 PASSED**, because it enters a chapter by
  clicking its biggest control and never reaches the start card. **The "3 passed" is the more
  instructive half** — a stress aimed at the wrong screen is decoration wearing a scarier name.
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
