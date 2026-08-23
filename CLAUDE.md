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

## Updating the Handoff
When I type `/handoff`, or when the session is wrapping up, update handoff.md with:
- What was accomplished this session
- Current state of the work (what's done, what's in progress)
- Any decisions made and why
- Next steps / what to pick up next
- Any open questions or blockers

Keep handoff.md concise and current — overwrite stale info rather than appending endlessly.

**handoff.md is auto-loaded into every session's context, so its size is a running cost.** Keep it to the current state plus roughly the last five session blocks (~60 KB). When it grows past that, MOVE the oldest blocks — do not delete them — to the top of [docs/handoff-archive.md](docs/handoff-archive.md), which is not auto-loaded and is there to be `grep`ed. Do not add a duplicated summary footer; the blocks are the record.
