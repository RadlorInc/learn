@AGENTS.md

# Project Context

## Session Continuity
At the start of every session, read @handoff.md to load the current state, recent decisions, and what was in progress. Treat it as the source of truth for where work left off, then continue from there.

## How chapters must look, move and sound
@docs/chapter-craft.md is the standing spec for the 3–11 story chapters — the animation, the art and the voice. **Read it before building or changing any of them.** It covers the shape of a chapter, how a walk cycle and its travel must agree, what may be an answer object, how to choose a backdrop, how to generate a new drawn cycle, how Milo speaks, and how to verify any of it.

Every rule in it was paid for by a founder catching a fault on a screenshot, and most were learned in chapter 1, forgotten, then re-learned the hard way in a later chapter. It exists so a new session starts from them instead of rediscovering them. When a correction lands, write the GENERAL rule there — not just the fix.

Two job-specific halves are NOT auto-loaded, to keep the standing spec small. Read the one the job calls for, and put new rules of that kind in it rather than back in chapter-craft.md:
- `docs/chapter-craft-ar.md` — **before building or changing any AR (camera) chapter.**
- `docs/chapter-craft-art.md` — **before generating any new art** (sprite, walk cycle, backdrop, line art) **or touching the code-drawn 3D scene.**

## Verifying anything by searching for it

**⚠️ A SCAN THAT FINDS NOTHING PROVES NOTHING UNTIL YOU HAVE SHOWN IT CAN FIND SOMETHING.**
Before reporting an absence — no secret in the bundle, no caller of a function, no offending
pattern in the source — run the same search against something you KNOW is present and confirm it
comes back. A silent search and a broken search are indistinguishable from the outside, and the
broken one reads as good news.

Paid for on 2026-08-24: confirming the Supabase service-role key had not leaked into the client
bundle, the first grep searched for JWTs and found zero. That looked like a clean result. The keys
are the new `sb_publishable_` / `sb_secret_` format and are not JWTs at all, so the scan could not
have found the key even if it had been there. The positive control — the same grep DOES find the
anon key, which is public by design and definitely present — is what made the zero mean anything.

The same rule already appears in [docs/chapter-craft.md](docs/chapter-craft.md) §4 in three other
costumes (a tautological check, an inert gate, a sweep that exempts the whole world). It is here
because it is not a chapter rule; it applies to every grep, every catalog query and every audit.

## A NEW CHECK THAT FINDS NOTHING ON ITS FIRST RUN HAS NOT PASSED — IT HAS NOT BEEN TESTED

The rule above says a scan that finds nothing proves nothing until you have shown it can find
something. This is that rule aimed at the moment it is most often skipped: **the first run of a check
you have just written.** A green first run feels like confirmation and is the least informative
result there is — it is equally consistent with "nothing is wrong" and with "this cannot see
anything". Before believing it, make it fail: plant the defect it exists for, or point it at a known
past one, and watch it go red.

Four in a single day, 2026-08-24, each of which reported success while examining nothing:
- `ci / rls-tests` printed a warning and `exit 0` for weeks — the suite proving one family cannot
  read another's data had never run once;
- the bundle grep for a leaked service key searched for JWTs, and the keys are not JWTs;
- `all-chapters` read its failure text at `domcontentloaded`, before the screen existed, so it could
  not fail at all;
- the policy-regression gate was written with `baseline_schema.sql` ordered LAST — it is generated
  from live production, so it supplied the very predicate a regression had just removed. Ordered
  last: zero findings. Ordered first: it flags the real historical regression.

The last one is the sharpest, because the check was correct, the corpus was correct, and only the
ORDER made it blind. Nothing about it looked wrong.

## Updating the Handoff
When I type `/handoff`, or when the session is wrapping up, update handoff.md with:
- What was accomplished this session
- Current state of the work (what's done, what's in progress)
- Any decisions made and why
- Next steps / what to pick up next
- Any open questions or blockers

Keep handoff.md concise and current — overwrite stale info rather than appending endlessly.

**handoff.md is auto-loaded into every session's context, so its size is a running cost.** Keep it to the current state plus roughly the last five session blocks (~60 KB). When it grows past that, MOVE the oldest blocks — do not delete them — to the top of [docs/handoff-archive.md](docs/handoff-archive.md), which is not auto-loaded and is there to be `grep`ed. Do not add a duplicated summary footer; the blocks are the record.
