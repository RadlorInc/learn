# HopAlong — a proper rethink

**Status: DESIGN, not built.** Written 2026-07-28 after the founder asked what the chapter actually
teaches, and the answer turned out to be "not skip counting".

Read [chapter-craft.md](chapter-craft.md) first — this doc assumes its rules and does not repeat them.

---

## ① What it teaches today, with the evidence

Every question the generator can produce, at all three difficulties:

```
d1   4 · 6 · 8 · ?          d2   6 · 8 · ? · 12       d3   15 · 20 · ? · 30 · 35
     5 · 10 · 15 · ?             40 · ? · 60 · 70          20 · 25 · 30 · ? · 40
     20 · 30 · 40 · ?            5 · 10 · ? · 20           8 · 10 · 12 · 14 · ?
```

A bare arithmetic sequence with a hole. Every one is solved by **adding the step to the number next
to it**.

**The test that settles it: delete every animal from the screen and all thirty questions still
work.** The frogs, the ducklings, the groups, the pond — none of it is load-bearing. So whatever the
chapter is teaching, it is not taught by the thing on screen.

⚠️ **And the obvious fix is not a fix.** Hiding each running total until Milo has landed on it (the
first redesign, 2026-07-28) stops the child reading the answer off the neighbouring number — but it
makes cheating harder at a task that was **measuring the wrong thing to begin with**. That is the
§0a fault one layer up: *how should it move* was settled before *what is the child doing*.

## ② What skip counting actually is

The curriculum's own line: *"Count by 2s, 5s, 10s **(bridges to multiplication)**"*. The bridge is
**UNITISING** — the leap where five stops being five things and becomes **one five**, so you can
count *one five, two fives, three fives*. That is the whole content of the skill, and the chapter
does not ask for it once.

| | the child's job | the question |
|---|---|---|
| what we ask now | continue a number pattern | *what number is missing?* |
| what skip counting is | count a quantity **by groups** instead of by ones | ***how many altogether?*** |

Nobody ever needs to know what follows 15, 20, 25. They need to know there are 30 eggs because
there are 5 boxes of 6. **The world hands you things already grouped** — socks in pairs, wheels in
fours, a duck family of four — and skip counting is the tool for exactly that.

## ③ The verb: **COUNT THE FAST WAY**

> Milo needs a certain number of little ones. They are not standing in a countable row — they are
> in FAMILIES, and the families are alive and milling about. He hops to a family and it falls in
> behind him. The count on his sign goes up by the family's size, not by one. The child decides
> when he has enough and taps Ready.

Three things follow, and each is the reason to choose this over the sequence puzzle:

- **Counting by ones is not available.** The little ones move, overlap and re-cluster, so there is
  no stable row to count along. The only stable thing on screen is the FAMILY. The unit is forced by
  the picture, not asked for by the prompt.
- **The answer is "how many altogether"** — the question skip counting exists to answer.
- **Nothing tells the child when to stop.** There are always more families than needed (HomeTime's
  rule, and the reason that chapter works). Deciding *four families of four is sixteen, that's
  enough* IS the skill, and it cannot be guessed off the screen.

**And the test from §① now passes the other way: delete the animals and there is no question left.**

### Why not the alternatives
- **"Set the jump size so he lands on every pad"** teaches multiples and is beautifully hop-native,
  but it teaches *which numbers you land on* rather than *a group is one thing*. It is the second
  face of the skill, not the load-bearing one. Keep as a possible later variant.
- **"Bundle the loose ones into fives"** teaches unitising most directly — and collides head-on with
  the planned B workstream (one bundling engine for placeValue + add/subTo100). Do not build it twice.

⚠️ **The honest tension: the GESTURE resembles HomeTime** (tap until you have enough, then commit).
Deliberate — it is a proven template in this repo — and the content is genuinely different: HomeTime
counts *1, 2, 3*, this counts *4, 8, 12*, and the marker never shows a number between. The two sit in
different bands (3–5 vs 6–8), so a child meets them years apart. Named here rather than hidden.

## ④ How it is animated — the point of the rethink

The founder's bar is *"proper animation like an animated video"*. Camera moves are out (chapter 3's
standing rule: the background holds still, the objects move). So the levers are the ones a film uses
that this app does not:

**1 · A character with intent, and a chain of visible consequence.**
Right now everything on screen is independent — groups pop, a number changes. In a film one thing
CAUSES the next. Here, one tap starts a chain that runs without further input:

> tap a family → Milo **coils** → hops (2–3 real ballistic jumps) → **lands** → the family startles
> outward from the impact → they turn, fall in behind him → the sign flips up by the family size →
> the line behind him is now visibly longer

That is six beats from one tap, each one caused by the last. **Nothing in the app currently chains.**

**2 · Secondary motion — the world reacts to being landed on.**
The startle wave is the whole trick: on landing, each little one in that family reacts, **staggered
by its distance from the impact point**. A wave reads as alive; simultaneous motion reads as a
switch being flipped. Same for the sign — it does not pop, it swings up, overshoots and settles.

**3 · Anticipation and settle, which we now have drawn.**
The new `milo_hop` sheet holds 7 frames of crouch (body compressing 215px → 177px) and hangs 3
frames at the top. Nothing else in the app anticipates before it moves. Keeping the source's own
frame count is what preserves that — see chapter-craft.md.

**4 · Overlapping action — no waiting your turn.**
The family starts turning while Milo is still descending; the sign begins its swing before they have
finished falling in. Everything currently happens in strict sequence with `setTimeout` gaps.

**5 · The demo is a joke, and the joke is the lesson.**
Milo tries to count the little ones one at a time — pointing, *"one… two… three…"* — and they
wander, cross behind each other, and he loses his place and sighs. Then they settle into families
and he hops family to family and gets there in four jumps. **The contrast IS the teaching**, and it
is the one beat in the chapter a child would rewatch. This replaces the modal white card entirely.

**6 · A payoff shot.**
On a correct commit the whole line walks off together, in step, and the families left behind stay
put — making the point one last time: *only the ones he counted went.*

## ⑤ The rounds

| | | |
|---|---|---|
| demo | Milo fails at counting by ones, then succeeds by families | not scored |
| guided | one easy target, a nudge if they linger | not scored |
| scored ×10 | target given, families of 2 / 5 / 10, spares always present | `SkillBeat` |

Difficulty grows **group size and count**, never the numbers alone:
- **d1** — families of 2 or 5, target = 2–4 families, spares 2
- **d2** — families of 5 or 10, target = 3–5 families
- **d3** — mixed group sizes **within one round** (a 5-family and a 10-family available), so the
  child must read each family's size rather than apply one rhythm

⚠️ **Wrong-answer distractors are real methods, not near-misses**, so a wrong commit names a wrong
idea: counted the FAMILIES not the little ones (4 instead of 16); one family short; added the two
numbers instead of counting groups.

## ⑥ Art

**Zero new generation.** The cast is drawn cycles that already exist and are idle or shareable, all
of which belong on the ground in a painted meadow: rabbit · chick · lamb · duckling · duck ·
squirrel · bird, plus the fliers bee · butterfly · ladybug · ant · firefly · dragonfly (no contact
shadow — a flier touches nothing). 13 needed for the no-repeat rule, 13 available.

Milo uses the new `milo_hop` sheet (19 cells @ 24fps, arc drawn in).

## ▶ Open decisions
1. **The three settings.** The library's painted low-horizon scenes are nearly spent;
   `garden_meadow` · `garden` · `garden_park` all work but make a third overlap with MarketDay's
   Garden and StoryTime's Flower Beds. Needs a founder call, exactly as the pond swap did.
2. **Does the sign show the running total, or only the target?** Showing it makes the skip count
   visible (good for teaching); hiding it makes the child hold the count (harder, truer). Suggest
   showing it in demo + guided and hiding it at d3.
3. Nobody has watched a child do any of this.
