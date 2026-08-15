# Chapter craft — how a Milo story chapter must look, move and sound

**Read this before building or changing any 3–11 story chapter.** It is the standing answer to
"how do we want the animation / the art / the voice", so a new session starts from what we already
know instead of rediscovering it.

Every rule here was paid for. Most were learned in chapter 1 (the counting parade), forgotten, and
re-learned the hard way in a later chapter after a founder spotted it on a screenshot. Where a rule
has a specific origin it is named, because the story is what makes it stick.

**Two halves of this file live next door, because they are job-specific and this one is auto-loaded
into every session.** Read the matching file when the job calls for it — the rules in them were paid
for exactly like the ones here:
- [chapter-craft-ar.md](chapter-craft-ar.md) — **answering with the camera.** Before building or
  changing any AR chapter.
- [chapter-craft-art.md](chapter-craft-art.md) — **art production and 3D scenes.** Before generating
  any new sprite, walk cycle, backdrop or line art, or touching the code-drawn 3D scene.

Related, not duplicated here:
- [lessons.md](lessons.md) — defect classes that reached `main`, and the gate that catches each
- [teen-game-pattern.md](teen-game-pattern.md) — the 12–18 band, which is a different design language
- [story-mode-3-5.md](story-mode-3-5.md) — the original 3–5 story-mode pivot

Reference implementations, in order of how closely to copy them:
| chapter | file | what to take from it |
|---|---|---|
| 1 · Counting | [world1.tsx](../src/features/chapters/story/world1.tsx), [ForestWalk.tsx](../src/features/chapters/story/ForestWalk.tsx) | the parade, drawn cycles, ground speed, the rotate gate |
| 2 · Number order | [FollowTheLeader.tsx](../src/features/chapters/story/FollowTheLeader.tsx) | layout as invariants, per-journey timing, cumulative strip |
| 3 · Number recognition | [NestTree.tsx](../src/features/chapters/story/NestTree.tsx) | still scene + one travelling character |
| 4 · Matching quantities | [HomeTime.tsx](../src/features/chapters/story/HomeTime.tsx) | journeys in BOTH directions, a commit gesture, leader bands |
| 5 · Comparing quantities | [BigOrSmall.tsx](../src/features/chapters/story/BigOrSmall.tsx) | two countable groups, group separation, concrete → symbolic tiers |
| 9 & 10 · Addition / subtraction | [PlayTime.tsx](../src/features/chapters/story/PlayTime.tsx) | one component for two mirrored operations, a countable set, an exported layout chain |
| 11 · Measurement | [MeasureIt.tsx](../src/features/chapters/story/MeasureIt.tsx) | an answer the child BUILDS, drawing a sprite by its own ink box, reserving a lane before it fills |
| 6–8 · Add/subtract to 100 | [BlockYard.tsx](../src/features/chapters/story/BlockYard.tsx) | a question stated ONLY as quantities, the skill as the single gesture, difficulty that grows the skill, and a bundle the child can WATCH become one thing |
| 6–8 · Time | [TickTock.tsx](../src/features/chapters/story/TickTock.tsx) + [clock.ts](../src/features/chapters/story/clock.ts) | an explicit LESSON before anything is scored, one skill answered from BOTH ends with one control shape, a scaffold that fades by tier, and a day whose arc IS the changing scene |
| 9–11 · Division | [SupplyRun.tsx](../src/features/chapters/story/SupplyRun.tsx) + [supplyRunDivision.test.ts](../src/__tests__/supplyRunDivision.test.ts) | one gesture serving two readings of one operation because they cost the same step, an answer that is the number of steps you got, a wrong action that is ALLOWED and visible rather than blocked, a remainder with somewhere physical to be, and a layout whose column shape is searched rather than picked |
| 9–11 · Rounding | [RailLine.tsx](../src/features/chapters/story/RailLine.tsx) + [railLineRounding.test.ts](../src/__tests__/railLineRounding.test.ts) | a world where the rounded number is the only one you can ACT on, an answer surface wide enough that it is not a coin flip, three question types sharing one control and one grader, and a layout whose numbers are derived from each other rather than guessed |
| 9–11 · Decimals | [CoinTray.tsx](../src/features/chapters/story/CoinTray.tsx) + [cents.ts](../src/features/chapters/story/cents.ts) + [coinTrayDecimals.test.ts](../src/__tests__/coinTrayDecimals.test.ts) | an answer entered as TWO places on one instrument, a piece that shows its own ten so the comparison is looked at rather than asked, an anchor whose own notation had to be kept out of the question, and a short-frame board that needed REFLOW rather than a smaller scale |
| 9–11 · Units & conversion | [HeightBar.tsx](../src/features/chapters/story/HeightBar.tsx) + [inches.ts](../src/features/chapters/story/inches.ts) + [heightBarUnits.test.ts](../src/__tests__/heightBarUnits.test.ts) | a conversion that exists because two measurements have to be COMPARED, a consequence (the gate opens) that is deliberately not the scored question, a gesture that ships only where its own noise floor allows, and a short frame that drops the rule because the demo says it twice |
| 9–11 · Area & perimeter | [FloorPlot.tsx](../src/features/chapters/story/FloorPlot.tsx) + [plotMaths.ts](../src/features/chapters/story/plotMaths.ts) + [plotSite.ts](../src/features/chapters/story/plotSite.ts) | **the band's only 3D chapter** — an answer that is a PLACE rather than a number (so it cannot be offered as a chip), ONE commit per scored round, a seeded procedural world that is provably free of anything countable, and everything the gate needs pulled out of the scene because `useFrame` cannot be driven headlessly |

The shared engine all of these run on is [critters.tsx](../src/features/chapters/story/critters.tsx) —
cast, habitats, `Critter`, the travel timing and the huddle invariants. **Put a fix there, not in a
chapter**, or the next chapter copies the bug back in. Chapter 4's invariants are swept by
[homeTimeGeometry.test.ts](../src/__tests__/homeTimeGeometry.test.ts).

---

## 0. The shape of a chapter

Always these four phases, in this order:

```
intro (one card, one button)  →  demo (Milo/an adult does it)  →  guided (child does one, unscored)  →  practice (SkillBeat, 10 scored rounds)
```

- The scored loop is the shared [`SkillBeat`](../src/features/chapters/story/StoryWorld.tsx):
  10 rounds, re-teach after 3 wrong, mastery early-exit, `sig` to dedupe questions.
- `SkillBeat` **rebuilds its contents every round.** Anything that must persist across the chapter
  (a collect tray, a journey strip, a filling tree) has to live OUTSIDE it, driven by `onRound`.
- 3–11 story chapters call `useAdaptive(skillId)` with **no start tier** — they always open at
  difficulty 1. Resume-at-difficulty is teen-only (`GameShell`/`ShopRush`). If a chapter looks too
  hard on question 1, the tier is not the suspect; the generator is.
- **Difficulty must grow BOTH count and magnitude.** Tier 1 controlling only "how many numbers"
  let chapter 2 open a three-year-old on 7·8·9. Cap the ceiling per tier as well as the count.
- Landscape-first. Every chapter mounts [`RotateGate`](../src/features/chapters/story/RotateGate.tsx);
  the early return must sit **below every hook** or turning the phone changes the hook count and
  React tears the chapter into the error boundary.
- **MASTERY EARLY-EXIT MEANS THE LAST ROUNDS MAY NEVER BE ASKED.** Six right in a row at the top
  tier ends the chapter, so anything sitting late in a fixed question order is asked only of a child
  who is struggling. If a chapter teaches a closed set — six colours, four shapes — **every member of
  that set must appear before mastery can fire**, or the strong child finishes never having been
  asked the one they were shakiest on, skipped as a reward for doing well. The colouring chapter had
  purple living on a single late target and hit exactly this.
  ⚠️ **THE ROUND BUDGET IS MUCH TIGHTER THAN IT LOOKS, AND IT IS WORTH KNOWING THE ARITHMETIC.**
  `core/adaptive.ts` promotes on **3 correct in a row at ≥80%** and masters at the top tier on a
  **streak of 6**, one tier at a time. So a child who answers well is asked roughly **three questions
  at L1, exactly ONE at L2 and TWO at L3**, and then the chapter ends. Anything that only unlocks at
  the top tier therefore gets **two rounds** — and if the generator draws uniformly from a wide pool,
  the hardest idea is simply missed a lot of the time. Measured on TickTock: the whole "to" side was
  missed by about **a third** of strong runs, and two full ten-round drives produced none at all.
  **So a tier is not a difficulty knob, it is a round budget. Count it before deciding what lives at
  the top.**
  ⚠️ **THE MACHINERY FOR THIS IS NOW SHARED, AND IT IS OPT-IN:** a `Beat` may declare
  `coverage: { of, all }`, and `SkillBeat` withholds the mastery exit until every member has been
  asked. It also feeds the asked-list back into `make(d, round, asked)` so the generator can **spend a
  scarce round on something unmet instead of rolling dice**. Those two halves belong together — the
  bookkeeping the gate needs is exactly the input the generator needs, and with both, TickTock covers
  all four readings in the *same* six rounds it used to take to cover three. A beat that declares no
  coverage behaves exactly as before.
  ⚠️ **Two traps if you use it.** Be deliberate only while a gap exists and **random once it closes** —
  hardest-first for ever locks the generator onto one kind and destroys the variety the chapter needs.
  And a check that re-implements the engine to simulate a run **cannot see the real wiring go away**:
  gate the declaration (drive the beat) and the two call sites (a source pattern anchored on real
  code), or dropping the third argument to `make` silently relocates the bug and makes it permanent.
- **The memoized `Beat` must not depend on anything that changes DURING a round.** `SkillBeat`
  memoizes the round on `[roundIdx, beat]`, so a beat rebuilt when the child picks up a paint pot
  regenerates the question under them and reshuffles the answers mid-answer. Keep per-round UI state
  out of the beat's deps and let the play surface measure or subscribe to it itself.

---

## 0a. Every skill needs its OWN verb

The three "exact form" chapters — shapes, colours, patterns — spent a year as one surface with
different nouns on it: *Milo names a thing, tap it among three.* That is a quiz with the skill
painted on the outside, and it is the fault a founder will name as "it doesn't feel like anything".

**Ask what a three-year-old already DOES with this idea, and make that the answering gesture:**

| skill | what it really is | the verb | so the question comes from… |
|---|---|---|---|
| shapes | a form defined by its **outline** | **FIT** — a shape sorter | a hole in the picture (visual) |
| colours | a **property** you apply | **COLOUR IT IN** | a spoken name (auditory) |
| patterns | a **rhythm** over a sequence | **CONTINUE** | the sequence itself (temporal) |
| measurement | a **magnitude**, which has no number until you choose a unit | **MEASURE IT** — lay one unit end to end and count | the thing itself, beside an empty lane (visual) |
| time | a **reading**, off a face carrying two scales on one set of numbers | **SET IT** (and READ IT) — move the hands / say what they say | Milo needing to be somewhere (auditory + visual) |

⚠️ **WHERE A SKILL HAS TWO HONEST DIRECTIONS, BUILD BOTH ON ONE CONTROL SHAPE.** Reading a clock and
setting one are the same knowledge from opposite ends, and TickTock answers both with the same pair of
steppers — on a SET round their labels are captions ("Hour", "Minutes") because the readout is the
clock face, and on a READ round the labels are the values being built because the readout is the
phrase. One thing to learn, used two ways, and the child cannot eliminate their way through either.
Compare CoinShop, which deleted its read rung because the material had nowhere to be drawn: keep the
second direction when the thing being read is already on screen, drop it when it is not.

⚠️ **AND A SCAFFOLD FOR THE PAYLOAD FADES BY TIER.** The minute ring — the second scale, printed —
is what makes the idea learnable, and leaving it up for ever means it is never in the child's head.
It shows at L1–L2 and is gone at L3. Same shape as the teen band's per-question hint retiring at the
top tier.

⚠️ **AND WHEN THE DELETE-THE-ART TEST FAILS, CHECK WHICH HALF IS AT FAULT BEFORE THROWING THE ART
AWAY.** BlockYard's base-ten blocks failed it and were replaced — twice, at the cost of two rebuilds
— and the blocks were never the problem: **the question was.** `27 + 15 = ?` printed on a banner
beside a perfectly good manipulative makes the manipulative scenery. Base-ten blocks are the right
tool for regrouping; they came back once the question stopped being answerable from digits. **Ask
whether the art is wrong or the QUESTION is wrong. They fail the same test and they are not the same
fault.**

⚠️ **A PRINTED QUESTION MAKES THE PICTURE BESIDE IT DECORATION.** The delete-the-art test has a
second, commoner failure mode than HopAlong's: the chapter draws a perfectly good manipulative AND
prints the question as a bare sum next to it. BlockYard drew base-ten blocks, printed the numeral
on each row, put `27 + 15 = ?` on the banner, and took the answer as one of three chips — so every
question was answerable with every block deleted, and the blocks were scenery. **If the question
can be read as symbols, the symbols are the question.** The fix is not a better picture: it is to
state the quantities ONLY as objects and let the equation appear afterwards, as the summary of work
already done. Concrete → abstract, in that order.

⚠️⚠️ **A BOARD SHARED BY SEVERAL ROUND TYPES WILL PRINT THE ANSWER ON THE TYPES WHERE THE AMOUNT IS
NOT THE QUESTION — and it looks completely reasonable in the source.** The Coin Tray's board rendered
the round's amount as its headline, which is exactly right on the type whose question IS *read this
amount* and fatal on the other two: an `op` round asks *"it read 0.55, it went UP by 0.05"* and
printed **0.6** above it, so the arithmetic never had to happen; a `place` round asks *"seven
hundredths"* in WORDS and printed **0.07**, doing the words-to-digits step that is half of what the
round tests. One expression, correct for one of three types. **Ask of every round type separately
whether the board's own figures are the question or the answer** — an `op` shows its SUM, a
words-asked round shows nothing until the commit — and put the choice in the pure module
(`headline(round, revealed)`) so a gate can sweep it. ⚠️ Sweep it on TOKENS, not substrings: `0.1 +
0.6` contains `0.6` while meaning nothing of the kind.

⚠️ **THE TAUGHT METHOD MUST COVER EVERY CASE THE GENERATOR CAN PRODUCE — AND THE WORKED EXAMPLES
MUST INCLUDE THE HARDEST ONE, NOT AVOID IT.** BlockYard's demo narrated *"add the tens, then the
ones"*, which has no step for a carry; measured over 20k draws per tier, **39–50% of its rounds
needed one**, and in subtraction the same line told the child to work out `2 − 7`. All four
hand-picked demo examples (23+14, 34+25, 38−14, 46−23) quietly avoided regrouping, so the case the
chapter existed for was never once shown. Hand-picked examples drift toward the easy case because
they are chosen to *read* well. **Pick them from the hard end and check the generator's actual
distribution against the method you are narrating.**

⚠️ **AND DIFFICULTY MUST GROW THE SKILL, NOT ONLY THE MAGNITUDE.** The same chapter's tiers grew
only how big the numbers were; whether a round exercised the skill was left to chance and never
named. Make the thing being taught an explicit term in the generator (`REGROUP_ODDS` per tier,
L3 always) so a gate can assert it climbs.

⚠️⚠️ **WHEN YOU RE-THEME A CHAPTER, CHECK THE NEW WORLD'S OWN RULES AGAINST THE MATHS ON EVERY
ROUND — a world that contradicts the skill is worse than a world that is merely dull.** The rounding
chapter moved from a rail line to a game level on the founder's call, and the obvious framing was the
one he picked out loud: *you die and go back to the nearest checkpoint*. **That sentence is false, and
every nine-year-old knows it** — you go back to the LAST checkpoint, which is rounding DOWN, so the
world would have been teaching the opposite of the skill on all ten rounds while the code stayed
correct. The fix was to find the framing in that world where NEAREST is honestly the answer (you can
only WARP to a checkpoint, so you take the closest one to where you need to be and run the rest),
which is the rail line's own sentence transplanted intact. This is §0b's *an attribute question must
be true of its object* applied one level up — to the WORLD rather than to a question. **Say the
world's rule out loud as a sentence, then ask whether a child who plays that thing would agree.**

⚠️⚠️ **A WORLD CAN ONLY HONESTLY ASK FOR THE VALUES ITS OBJECTS ACTUALLY TAKE — CHECK THE RANGE, NOT
JUST THE SUBJECT.** The angles chapter's anchor is *how steep the ramp at the park is*, which is the
right anchor and is the founder's own; it also cannot express a third of the chapter, and the
arithmetic says so before any code. **Obtuse means the arm swung PAST vertical, and real ramps live
between about 5° and 40° — every slope in the world is acute.** So "make the ramp obtuse" asks a child
to build a thing that does not exist, and the shipped week did exactly that: an obtuse *approach ramp*
"because a barrow has to get up it loaded", which drew a plank leaning backwards over the bank while
the words said *"shallower"*. The way out is not a different anchor but a wider world: the slopes
(ramp, slide) take the acute jobs, the things that genuinely OPEN past square (a gate swinging back, a
barrier arm lifting) take the obtuse ones, and one upright takes the right angle — each job naming its
own object, which is the structure the chapter already had. **Write down the range your skill sweeps,
then ask which of your world's objects can honestly sit at each end of it.**

⚠️ **AND THE REASON A JOB GIVES MUST ARGUE FOR THE *KIND*, NEVER FOR A MAGNITUDE THE TIER IS FREE TO
CHANGE.** This is the same fault one level down and it is easy to ship, because the sentence reads
perfectly until you put it beside the generator. Driven on screen: *"Make the slide SHARPER than a
square corner — any steeper and it is a drop, not a slide"*, i.e. the requirement and the reason
contradicting each other in one sentence. Its sibling, *"push your bike up it, loaded"*, is true of the
30° that L1 draws and plainly false of the 85° that L3 draws — **and both are acute, so the round is
correct and the world is lying.** A reason about how STEEP begs the question the round is asking; a
reason about which SIDE of square holds at every angle the tier can reach. Cheap gate: sweep the
reason's own words against the kind it belongs to.

⚠️⚠️ **AN ANCHOR CAN CARRY A NOTATION THAT ERASES THE VERY THING THE CHAPTER TEACHES — CHECK ITS
CONVENTIONS, NOT JUST ITS OBJECTS.** Money is the right anchor for decimals for the strongest possible
reason (100 cents ARE the hundredths grid, so the anchor and the manipulative are one object) and it
brings one convention that is fatal if you let it into the question: **money always pads to two
decimal places.** `$0.60` beside `$0.55` is obviously bigger, so written that way the misconception
the chapter exists for **cannot occur at all**; `0.6` beside `0.55` is the trap. So every ASK states
the maths form and the anchor's own form appears only in the REVEAL, as the bridge — *"$0.60, and
that is 0.6 of a dollar"*. ⚠️ The same applies to what is SPOKEN: "sixty cents" hands over six dimes
without a decimal being read at all, so the spoken line says the digits ("zero point six of a
dollar"). **Write down the anchor's notation and ask which distinction it hides.**

⚠️ **AND WHEN THE WORLD *BECOMES* THE DAILY THING, THE ANCHOR PARAGRAPH GETS SHORTER, NOT LONGER.**
The anchor exists to BRIDGE from something the child has done to a world they have not (a scoreboard
→ a branch-line train), and it carries a warning that the two are not equivalent. Make the world
itself the daily thing and the bridge is simply deleted: one paragraph instead of two, with nothing
claimed that the screen does not show. If a re-theme makes the briefing longer, the world is probably
still not the daily thing.

⚠️ **A VERB IS NOT A STORY, AND GETTING THE VERB RIGHT IS ONLY HALF OF §0a.** The fractions chapter
was rebuilt with the correct verb — FIT IT, an honest gesture that could not be eliminated into,
with a lesson, a coverage gate and a mutation-tested grader — and the founder's verdict was *"kuch
sense hi naii bann raha hai… ek story lagna chahiye"*. He was right and the diagnosis is worth the
space: **what was on screen was an instrument with wallpaper.** A geometric shape floated on a
photograph of a shop; nobody was in it, nobody wanted anything, and nothing happened as a
consequence of getting it right. The verb answered *what does the child DO*; nothing had answered
**WHO WANTS THIS, AND WHY.**
- Every chapter in this band that works has an answer to that. CoinShop: a keeper who names his own
  price from his own mouth and hands over the goods. HomeTime: Milo needs exactly N little ones and
  leads them home. TickTock: Milo has to be somewhere.
- For fractions the answer was sitting in the mathematics and went unclaimed for a whole rebuild:
  **a fraction exists because something has to be SHARED.** So friends walk in, wait, and leave
  carrying a piece each — and the denominator stops being a number and becomes *how many people are
  waiting*. The payload comes free and stops being a rule: **more friends sharing one thing means a
  smaller piece each**, which is a six-year-old's own experience rather than "the bigger the number
  underneath, the smaller the piece".
- **Ask it as a separate question, after the verb and before any code:** who arrives, what do they
  want, what happens to them when the child gets it right? If the answer is "nothing, the shape
  turns green", it is an instrument.

⚠️⚠️ **A CARRY-AND-DROP MUST NOT CATCH BY NEAREST-TARGET WHEN THE CHOICE *IS* THE ANSWER.** The
Fundraiser's drop partitions at the halfway line between tiles, so there is nowhere to miss — correct
there, because which column a digit belongs in is the question and the tile is just cargo. Copy that
into a ROUNDING chapter and the app does the rounding: the child carries the character to where 47
falls, lets go, and it snaps to 50. **The gesture then performs the skill on the child's behalf**,
which is the defect the whole chapter exists to remove. Where the drop position IS the answer the
catch is BOUNDED (a fraction of the gap, ~0.35), so a release at the midpoint lands on nothing — and
that refusal is the physical statement of the rule: there is no checkpoint at 47, so you cannot leave
her at 47.

⚠️ **AND TWO PLACES A CARRY QUIETLY ANSWERS FOR THE CHILD, BOTH FOUND BY DRIVING IT AND BOTH SCORING
A ROUND NOBODY PLAYED:** the carried thing PARKED INSIDE A CATCH ZONE (she waited at x 54 with the
first target at 77 ± 64, so picking her up and putting her straight down scored it), and the carry
CLAMPED TO THE FIRST TARGET (`clamp(lo = firstTarget)` teleported her onto it the instant she was
grabbed, which does the same thing by a different route). Fixing one leaves the other doing the
damage alone. **Clamp a carry to where the thing may STAND, and check that its resting place is
outside every catch zone** — that second one is a one-line gate assertion and it is worth having,
because the failure looks like the child answering rather than like a bug.

⚠️ **AND THE THIRD QUESTION, WHICH IS THE ONE A GOOD VERB HIDES: WHO DECIDES WHEN IT IS FINISHED?**
The area chapter's first 3D cut had an honest verb (lay the floor), a real world and a consequence,
and it taught nothing — because **the PLOT decided.** You lay tiles until no bare square is left, hand
it over, and you are right, having covered a rectangle without once working out `6 × 4`. The fence is
worse: it visibly closes. The number was a **by-product of a covering task**, and the founder's words
for it were *"kuch samajh nahi aa raha ki baccha kya seekh raha hai."*
- **A manipulative that can be filled until it LOOKS finished has taken the deciding away** — silently,
  with no line of code doing anything wrong. This is the *"nothing says that's enough"* rule failing
  from a direction it does not cover: nothing SAYS it, the picture just shows it.
- **The fix is usually the ORDER, not the mechanic.** Make the child commit to a number BEFORE the
  thing exists to be counted: pace the sides, then fetch that many from a store while the plot is
  still bare, then tip them out. Now the two lengths are the only thing left to reason from, and the
  building becomes the CHECK rather than the answer — covered exactly, a bare patch, or units still in
  your hands. Same shape as HomeTime (fetch exactly N) and LoadingBay (the right answer sends the
  cart), which is why those work.
- **The test: could the child ignore the numbers entirely and still finish by feel?** If yes, you have
  built a covering task with arithmetic painted on it.

⚠️ **AND THE WORKING SURFACE MUST NOT BE RULED INTO THE UNITS THAT WILL GO ON IT — A GRID IS THE
PRINTED ANSWER, DRAWN INSTEAD OF WRITTEN.** An area chapter (since deleted) drew its plot floor with
a faint metre grid tiled `w × h`. One line — `repeat.set(w, h)` — chalked exactly as many countable
squares onto the ground as the answer, so a child stood in the plot, counted the boxes, and never
measured a side or worked anything out; on a fence round it handed over both side lengths at a
glance. The file's own comment said *"the floor is still empty, so it cannot be counted"* while the
floor was ruled. **This is the printed-answer rule in the last place anyone looks, because a grid
reads as helpful scaffolding rather than as a number.** Mark the boundary — an outline, corner posts
— and leave the inside bare. Same family as the vertical-grain rule: before drawing a repeating mark
on anything, ask whether a child could count it.

⚠️ **AND ANY COMMIT THE CHILD CAN REPEAT IS A YES/NO ORACLE.** The same chapter, with the grid gone,
was still beatable: commit, read *"not enough"*, adjust, commit again — the answer falls out of about
four tries with nothing worked out. **Softening the wording or clearing the surface between tries
does not help; the feedback itself is the leak.** Where a chapter grades a quantity the child chose,
a scored round settles on the FIRST commit, and the repair lives BEFORE it (adjusting freely at the
store, walking back and forth before pegging) — which is where deciding belongs anyway. An unscored
guided round may still retry; that is teaching, not measuring.

⚠️ **AND WHERE THE UNIT IS THE ANSWER, DO NOT LET THE CHILD HANDLE THE UNITS AT ALL.** A tile IS the
unit of area, so every mechanic built around moving tiles — lay them until it looks full, fetch a
barrow of them, deal them out — hands the child a pile whose size is the answer and lets the tally do
the adding: tap "a row" three times and the screen counts 4, 8, 12 without them ever stating a
number. **Three mechanics were built and rejected on exactly this before anyone named it.** Ask what
the unit of the skill IS; if the child ends up holding a countable set of them, the machine is doing
the arithmetic. (The way out is to make the child commit to a number *before* anything countable
exists — see "who decides when it is finished" above.)

⚠️ **AND WHERE THE ANSWER IS A PLACE, THE CAMERA MUST GO BACK AND LOOK AT WHAT WAS BUILT.** This is
the first-person version of *the consequence must be visible*, and it fails in a way a flat chapter
cannot. In The Empty Plot the child stands at the far edge FACING AWAY from the road, so everything
the delivery then lays is **behind them**: driven on screen, a wrong peg read *"Too far back — there
are not enough tiles to reach the peg. Part of it would be bare"* over an empty green field. The
tiles, the bare strip and the leftovers were all off-camera, on every round, right and wrong — so the
one thing that makes a miss a consequence rather than a verdict was invisible, and nothing in a gate
or a type-check could see it because every piece was individually correct. **On the commit, drive the
camera to the thing that was made**, and hold it long enough to be read: a miss needs LONGER on that
shot than a hit, not less. 2.6 s was not enough.
⚠️ **The corollary for the beat BEFORE the commit: a first-person view can leave the child with no
reference at all.** Walking into a deliberately bare working area means the frontage, the posts and
the character are all behind them, and the forward view is empty ground — which reads as a broken
scene rather than as an empty yard. Mark the boundary **for the full walkable depth** (one unbroken
line, stopping at the walkable bound on every round so it says how WIDE and never how deep) and leave
the inside bare. It must never gain posts, ticks or segments at intervals: that is a ruler, i.e. the
printed answer drawn on the ground.

⚠️⚠️ **AND BEFORE BUILDING A CAMERA TO SOLVE THAT, ASK WHETHER THE DIMENSION IS EARNING ITS KEEP —
REMOVING ONE CAN DELETE THE WHOLE CLASS OF FAULT.** The Empty Plot was first person because *the
answer is a PLACE, and a place cannot be offered as a chip* — which is true, and does not require 3D.
Drawn from ABOVE the place is still a place, the peg is still somewhere on the ground, and everything
the delivery lays is on screen at every instant, right and wrong, with nothing to swing round to.
The camera swing, its hold time, the framing of a miss, the raised side view, `fov` being vertical
while the check that matters is horizontal, a walking loop that `useFrame` will not run in a
backgrounded tab: **all of it was scaffolding around a viewpoint the chapter never needed.** The
founder's words (2026-08-15) were *"totally remove that 3d concept"* and the port cost the chapter nothing —
1,380 lines of scene plus a 628-line procedural site generator became ~330 lines of instrument over
the shared shell, with the same verb, the same generator and the same grader.

⚠️⚠️ **AND A SHELL THAT REVEALS ONLY A *WRONG* ANSWER LEAVES THE CHAPTER OWING ITS OWN PAYOFF —
CHECK WHICH STATES YOUR SHELL ACTUALLY RENDERS.** `GameShell` hands the instrument `reveal` on a
wrong answer and on the re-teach, and a correct one goes straight to "You solved it ✓". Perfectly
reasonable — the reveal exists to show you what you missed — and it meant this chapter showed the
delivery **only to the children who got it wrong**: the tiles coming out exactly, *"and it comes out
to the metre"*, the one beat the whole thing is built for, was never once on screen for a child who
got it right. Nothing failed, every piece was individually correct, and the gate was green. **Ask of
your own consequence: does it fire on the RIGHT answer?** The instrument knows — it holds the
committed value and can grade it — so lay it on `reveal || (committed && correct)` and gate that.
Found by driving the camera path, not by reading it.

⚠️ **AND IF THE UNITS COME FROM A STORE, THE STORE MUST BE DUMB.** A bundle labelled *"a row of 6"*
hands over the side length the child was supposed to walk for — the printed-answer leak wearing a
shopkeeper's apron. Label them "a row", "a long side", "a short side"; the count appears only on what
they are carrying, as their own work, as they load it. Cheap gate: **no bundle label may contain a
digit.**

⚠️ **WHEN A LATER BAND REUSES AN EARLIER BAND'S WORLD, THE VERB HAS TO CARRY THE WHOLE DIFFERENCE —
AND THE CLEANEST SEPARATION IS STRUCTURAL RATHER THAN VERBAL.** 6–8's SliceShop is pizza and owns
FIT IT: **one** whole, one piece size, lay copies until it is full. 9–11 was handed the same world by
the founder, so "MATCH IT" had to be more than a different sentence about the same picture — and the
thing that makes it one is that equivalence needs **two wholes, cut differently**, which SliceShop
structurally cannot show. One whole vs two is a difference a gate can assert and a reader can see;
"a different verb" on its own is a claim. **State the separation as a property of the SCREEN.**

⚠️ **AND A COMPARISON IS OFTEN BEST TAUGHT AS A CONSEQUENCE RATHER THAN AS A QUESTION.** "Which is
greater?" over two options is a coin flip (§0b) and a finger count cannot express it at all — so the
chapter asks *how many of mine make the same amount*, and the fact that it takes TWO of my eighths to
make one of your quarters is what the child watches happen. The comparison is the reveal, not the
prompt. Where the comparison must still be scored, ask it as a NUMBER on a pair where no exact answer
exists ("the fewest of mine that beats yours") — ⚠️ and check that the pair really has none, because
a plausible-looking non-multiple can still land exactly (2/4 IS 3/6) and the round's own prompt would
then be telling the child something false.

**Beware the skill that is a near neighbour of one already built.** Measurement spent a year as
*tap the taller one*, which is chapter 5 (*tap the bigger bunch*) with a different adjective — and
its height view faked the attribute anyway, uniformly scaling one sprite so "taller" was really
"bigger" and could be won on area. Two neighbouring skills need two different VERBS, not two
different adjectives over one gesture. What separates measurement from comparison is the unit: a
ruler is nothing but a repeated unit, counted, so laying the unit is the thing to build.

Two consequences worth having in advance:

- **A different verb means a different question channel**, and that decides whether the chapter works
  with the sound off. Shape House states its question as a picture, so it does. The colours chapter
  cannot — naming colours IS the skill, and every silent fallback hands over the answer. Know which
  kind you are building before you rely on speech that Chrome often does not have.
- **Implement the real activity, not a gesture that mimes it.** A colouring game is not "recolour
  one of five objects per round" — it is one picture, cut into far more areas than there are
  questions, filled by tapping. Getting this wrong twice cost a rebuild each time. The test: could a
  child do this for ten minutes with nobody asking them anything? If not, it is a quiz wearing the
  activity's clothes.
- **The lesson rides ON TOP of the activity and never replaces it.** In the colouring chapter every
  area Milo has NOT asked for is still fillable, in any colour, ungraded. Locking those to protect
  the scoring would turn it straight back into a quiz.

## 0b. Ask only the skill, and only ask what is true

Two founder corrections on the colouring chapter, both of which generalise past it.

**SHOW WHICH, TEST ONLY THE SKILL.** A question of the form "colour the roof red" is really two
questions — *which shape is the roof* and *which paint is red* — and only the second one is what the
chapter measures. A child who knows red perfectly well but cannot pick the roof out of a line drawing
is scored as not knowing red. So the asked-for thing is **shown** — it glows — and the only decision
left is the skill itself. Two consequences follow, and both are part of the rule:
- **The pointer must not name the answer.** The glow is a neutral grey, the one mark on the page that
  is not one of the six paints. A highlight tinted the target colour would be the answer, handed over.
- **Failing the shown half is not a wrong answer.** Tapping the wrong shape is a redirect back to the
  glow; only the wrong *paint* is scored. Anything else scores motor precision and object vocabulary
  under a colour-recognition heading.

⚠️ **A TWO-OPTION ANSWER SURFACE IS A COIN FLIP, AND WIDENING IT USUALLY ASSESSES A SECOND HALF OF
THE SKILL YOU WERE GIVING AWAY.** [story-9-11-rethink.md](story-9-11-rethink.md) measures a third of
that band's questions as guessable — even/odd and prime at 50%, angle type at 33% — and the fix is
never more distractors bolted on. Rounding is the clean example: drawing the two bracketing stops and
asking which is nearer hands over *which ten the number is in*, which IS place value, and leaves a
toss-up. Show six stops and the child has to find the bracket first and then choose, so the guess
rate goes 50% → 17% **and the half of the skill that was being given away is now the work**. Ask what
your answer surface is telling the child for free before you ask how many options it has.

Related: where the skill is a small on-screen area, **a near miss on a shown target counts**. The
smallest area on the colouring page renders 32×28 CSS px at 640×320, under the 44px tap floor, and
this band is three-year-olds; a tap just outside the shape they were plainly aiming at snaps to it.
It can never turn a wrong answer right, only a wrong finger.

⚠️ **A QUESTION TYPE MUST HAVE SOMEWHERE TO SHOW ITS OWN MATERIAL — AND MOVING THAT MATERIAL CAN
TAKE THE PLACE AWAY WITHOUT TOUCHING THE QUESTION.** CoinShop's `read` rung asked *"how much money
is that?"* about a pile the child was supposed to count. When the coins moved from the world into
the answering card, that pile lost its only home: the card renders on a PAYING round, and a read
round shows a number pad instead. So the question shipped, live, over an empty screen — the state
was set correctly and drawn nowhere. Neither the type-checker nor the gate could see it, because
both halves were individually fine. **When you relocate the thing a question is ABOUT, walk every
question type that refers to it.**

⚠️⚠️ **EVERY REFUSAL THE GENERATOR MAKES NEEDS A MATCHING REFUSAL AT THE ANSWER, OR THE CHILD IS
MARKED WRONG OVER A PICTURE THAT SAYS THEY ARE RIGHT.** This is the sharpest form of *the picture
must agree with the answer*, and it hides because the two halves are written months apart and each
is individually correct. Factor Lab's generator excluded `f === n` from the answers it will accept
(n rows of one is every part on its own, not a split) and its NUDGE list excluded only `f === 1`.
So a child holding up 6 on a round about 6 got a red verdict reading **"0 left over"** over six
clean rows with no gap in them, and a miss line saying *"that leaves a gap"* — three statements, two
of them false, all shipped. Measured, four of the five tier-1 values were within reach of two hands,
so it was met in the first minutes. **Enumerate the whole answer space against the generator's own
filters**; anything the generator refuses for a REASON needs that reason said out loud at the moment
a child does it, as a redirect rather than a score.

⚠️ **AND THE VERDICT STRING BELONGS IN THE PURE MODULE, NOT THE COMPONENT.** That whole fault was
invisible because the sentence was built inside the scene, where no gate can reach it — the chapter
had 40 green tests and not one of them could see a word the child reads. Export it, drive it from the
gate, and source-check that the scene prints it rather than assembling its own.

⚠️⚠️ **AND THE CHILD'S OWN INTERMEDIATE WORKING CAN LAND ON A NUMBER ALREADY PRINTED ON SCREEN AS
SOMETHING ELSE — WHICH IS WORSE THAN PRINTING THE ANSWER, BECAUSE IT MANUFACTURES A WRONG ONE.** The
Height Bar asks *"the sign says 48 in, your door frame says 4 ft 3"*; the first step of the conversion
is `4 × 12`, which is **48** — the number printed on the sign an inch away. Nothing prints the answer
(51), nothing is wrong, and a child who stops at the figure they can see is marked wrong for a
confusion the CHAPTER created rather than one they hold. The demo said it out loud — *"4 feet is 4
lots of twelve, which is 48 inches"* — directly under `sign: 48 in`. Two of the six posted limits were
multiples of twelve, so it hit about a third of the middle tier. **Work the round through as a child
would and check every intermediate value against everything else on screen**, not just the final
answer; then draw the generator so the collision cannot occur (here: no limit that is a multiple of
the conversion factor). ⚠️ The tier where the intermediate IS the answer is the exception and must
stay one — at L1 the answer is `ft × 12`, so there it is the LIMIT that has to differ from it.

⚠️ **A NUMBER IN A VERDICT CAN BE THE ANSWER BY COINCIDENCE.** *"No miss line ever names an accepted
answer"* is already the rule; arithmetic reaches it by a side door. Eight rows out of a pair test of
15 strand SEVEN, and seven pairs is what was asked — so a count of what did NOT fit prints the
answer. Check the numbers a template can produce, not just the words in it.

⚠️ **A READOUT THAT ECHOES THE CHILD'S INPUT MUST NOT NAME AN ARRANGEMENT THE PICTURE IS NOT
SHOWING.** The same bench header said *"4 pairs"* over four rows of THREE, because the word came
from the question type and the rows came from the deal. Derive the noun from what was actually
drawn.

⚠️ **AND A REDIRECT BELONGS TO THE ATTEMPT THAT EARNED IT.** A nudge left on screen sits under the
NEXT answer's green verdict, telling a child who has just got it right that they have not — the
words contradicting the picture on the beat they are reading. Clear it when a real answer commits.

**AND A TAP THAT DOES NOTHING AT ALL IS THE WORST OUTCOME THERE IS.** Worse than a wrong answer: a
wrong answer at least tells the child the game is listening.

⚠️ **THE COMMONEST WAY TO BUILD ONE IS A COMMIT GATED ON A FIXED LENGTH.** FitOut's number pad is
`windows={2}` with `if (digits.length < 2) return` and `disabled={digits.length < windows}` — three
independent gates all assuming a two-digit answer. But `answer = rows × per` with both from
`rint(2, 5)`, so **6 of the 16 L1 combinations are single-digit** — about 37% of L1 `order` rounds,
and roughly one run in five meets one on scored round 1. A child who works out **8**, taps `8`, and
taps Done gets *nothing*: the button is `opacity: .4`, `cursor: default`, disabled. The only way
through is `08`, which nothing on screen teaches and which is a strange thing to ask of the band that
has just learned place value. **Measured live on production.** The rule: **derive the expected input
length from the answer, never from the widest case** — and if a control can ever be disabled while
the child believes they have answered, that is a dead button whatever the reason.

⚠️ **THE ONE CASE A CHILD CANNOT READ OFF THE PICTURE IS THE ONE THAT MUST BE STATED OUT LOUD.**
Every honest manipulative has a boundary case where looking is not enough, and it is exactly the
case a chapter forgets to teach because the picture usually does the teaching. In RailLine it is a
number sitting **exactly on the halfway post** — the marker lands dead on the mark, so "which is
nearer" has no visual answer at all and the round is decided by a convention (round half UP). It is
not rare either: 10% of draws. Two consequences, and both were missing until a run turned one up:
the demo and re-teach must SAY the rule when that case appears, and the miss line needs its own
wording, because the generic one is simply false ("15 is PAST 15"). Find your boundary case, check
what the words do there, and make sure it is taught somewhere rather than only graded.

⚠️ **THE COMMONEST WAY TO SHIP THIS IS TO ANSWER ONLY IN SPEECH.** A handler that calls `speak()`
and changes nothing on screen looks complete in the source and is a dead button on every device
without a voice — which is *most Chrome installs*, as this repo has documented for months. HopAlong
shipped a Ready button that spoke *"that's too many"* and drew nothing; the founder pressed it and
watched nothing happen. **Everything spoken in response to a tap must ALSO be written.** The test is
to read the handler and ask what it does with the sound off.

**AND IF A CHILD CAN OVERSHOOT, THEY MUST BE ABLE TO COME BACK — BY THE SAME JOURNEY.** Any chapter
where the child builds a set can be built PAST the answer, and without a way back that state is a
dead end; take every spare and the round becomes unwinnable, with nothing left to tap. The repair is
never a Back button: **tap what is already gathered and it travels home**, facing the way it goes
(HomeTime settled this, and HopAlong had to learn it again). Two rules fall out:
- the undo affordance must look **the same at every count** — one that appears only once the set is
  wrong is a verdict handed over before the commit; and
- reaching for it must be **predictable**, so make it a stack: only the most recent addition can
  leave, never an arbitrary one from the middle. The colouring chapter shipped a version
where tapping the tulip did nothing — the ink is a wall to the flood fill, thickened another 2px to
close the artwork's gaps, and the outline of a small shape is most of it. Measured over a realistic
aim spread, **40% of taps aimed at a tulip landed on ink and were silently discarded**, and there is
ink 7px from its centre. Two rules out of that, and the second is the one that actually bit:
- **Silence is never an acceptable response to a tap.** Fill something, say something, or nudge.
- **A bail-out must not sit in front of the rescue written to handle it.** The near-miss rescue was
  already there and correct; it ran *after* `if (!region) return`, so the exact case it existed for
  never reached it. Check the order of the guards, not just their contents.

**A cue is only as strong as its WORST case, not its best.** The same grey highlight at 10–44%
opacity read clearly on the sky — a quarter of the screen — and was invisible on a 76px tulip sitting
next to an identical tulip that was not the answer. Tune a highlight on the smallest, most ambiguous
thing it has to mark, and check the FLOOR of the pulse as well as the peak; a cue that vanishes for
half of every second is a cue a child will miss at the moment they look.

**Two things with the same name need the words to admit it.** With two tulips on the page, tapping
the wrong one answered *"That's the tulip!"* — while the prompt said *"colour the tulip"*. Where a
redirect can name the thing the child thinks they just tapped, say **"the other one"**.

**A free-play surface still owes the child a way back to the question.** Everything unasked stays
colourable, which is the point — but with no named area under the finger there is no feedback either,
so a child can paint the whole page and never once meet the question, and it looks from outside like
the game only refuses the one thing it asked for. Count the off-question actions and have the
character ask again after a few. Repeat the QUESTION, never the answer.

**And this is a TESTING lesson first.** Every check that passed had tapped the target's stored probe
point — its dead centre, the single easiest tap on the page — so the mechanic was only ever verified
where it could not fail. **Exercise an interaction at the EDGES of its target, and on the boundary
itself.** Same family as reading a band instead of the spots the layout really returns. The founder
found this in one try by using their finger.

⚠️ **THE TEACHING CAN CONTAIN THE EXACT FAULT THE CHAPTER EXISTS TO FIX, AND THE WORDS WILL BE
RIGHT WHILE ONLY THE NUMBERS DISAGREE.** The Supply Run is built so that what will not divide stays
physically in the crate — that is the whole reason it exists. Its demo's last beat dealt
`answer × cost + rem`, i.e. the WHOLE crate, so the trace read
`[crate 0, 3, 3, 3, 3, 2, 0] «Only 2 left — that will not fill a van, so it stays behind»`: the
remainder had gone INTO a van while Milo said it stayed behind. A child watching that is taught the
opposite of the rule, by the one beat written to teach it. Nothing could see it — the sentence was
correct, the grader was correct, the beats were component-local, and the only disagreement was
between the words and the counts. **Read the demo's numbers against its own sentences, and put the
beat list behind an exported function so a gate can drive the same list the demo plays.**

⚠️⚠️ **AND THE BEAT THAT DOES THE ARITHMETIC IS THE ONE MOST LIKELY TO HAVE A STATIC SCREEN — WHICH
IS THE WHOLE TEACHING HAPPENING IN AUDIO, ON A BAND WHOSE DEVICES MOSTLY HAVE NO VOICE.** Every other
beat has something obvious to show: the load arriving, the walk, the peg, the delivery. The *working*
does not, because the sum happens in Milo's head — so it is the beat that quietly ships as a sentence
over an unchanged picture, and it is the one beat that cannot afford to. Founder, on a screenshot of
exactly that: *animate the explanation, and run the frames off the narration.* Two things follow:
- **Find the still beats mechanically: any beat whose value equals its predecessor's is a still.**
  Three of this chapter's six had the same value, and the one in the middle was the division.
- **Give the working a manipulative of its own and let the frames perform the sum.** The Empty Plot's
  load becomes a BAR: an area round cuts it into rows of the frontage, one row per frame, until the
  rows run out — the row count IS the answer, being counted; a perimeter round takes two lots of the
  frontage off the top and splits what is left in two. One widget, because both readings are
  partitions of the same given number, and the two cuts are visibly different sums.
⚠️ **The working's pieces are usually COUNTABLE, and that is only safe if they cannot reach a scored
round.** Put the animation behind a field the walkthrough beats set and nothing in play does — not the
initial value, not the hand, not the miss glide — and assert that as a single test, driven rather than
grepped.
⚠️ **And assert the SIZES of the pieces, not the caption under them.** Mutation-tested: shrinking a
perimeter round's two final pieces to one unit each left the note still reading *"2 each"* and the
gate perfectly green — the picture drawing one thing while its own words said another, which is the
Supply Run fault arriving through the animation instead of through the beat list.

⚠️ **AND ANIMATE AT THE NARRATION'S OWN RATE, WHICH YOU CANNOT DO BY MEASURING THE BEAT.** A beat ends
when its utterance ends, and on a silent device when `speakSteps`' fallback timer fires — so its real
duration is not knowable when the frames start. What IS shared is the child's speech-rate pick: the
narration uses `2600 / m` per fallback step, so a frame at `620 / m` slows and quickens with the
words. **Drive it on `setInterval` and hold the last frame** — rAF is frozen outright in a
backgrounded tab, so an rAF-driven explanation cannot be verified headlessly at all and stalls the
moment a child switches away.
⚠️ **And reset the frame index DURING RENDER, never in an effect** — effects run after paint, so the
first frame of a new beat is painted carrying the previous beat's index and the walk beat opens with
the walker already at the end. Same rule this file already gives for a journey's phase, and the React
lint names it too.

⚠️ **AND A CONTAINER'S OWN HEIGHT CAN BE THE ANSWER, PRINTED AS A LENGTH.** A receiving slot's box
is sized by its capacity, and on a sharing round the capacity is derived from the answer — so
anything drawn to the box's full height *is* the answer, before the child has done anything. The
Supply Run's ground tint was written `top: −pitch*0.15 … bottom: −pitch*0.34`, which spans the whole
box, so an empty slot glowed visibly taller on a round with a bigger answer. **Every drawn part of a
container is anchored to its BASE and sized from the pitch alone**; the box is a layout device and
must never be visible. Same family as the printed-answer rule, arrived at through CSS rather than
through a string.

**TEACH WHERE THE WORLD BACKS THE ANSWER UP; TEST WHERE IT CANNOT HELP.** The colouring chapter runs
the garden first and the toy room second, and the split is what makes the score mean anything. A
garden is made of things with ONE colour in the world — sun yellow, sky blue, grass green — so
*"colour the sun yellow"* is answerable by a child who knows suns and has never learned the word
*yellow*. That is exactly what you want while TEACHING: the object anchors the word, which is how a
three-year-old acquires one. It is exactly what you must not have while testing, because the picture
is quietly answering for them. A toy has no default colour, so in the toy room nothing on screen can
help and the spoken word is the only thing that can — a child who gets it right knows the word.
Generalise: **if the scene can answer the question, you are teaching, not measuring.** Ask of any
scored round: could a child who does not have this skill still get it right from world knowledge?

⚠️ **A LESSON MUST NOT CARRY A "NEXT" BUTTON ON A FIRST RUN — that is a skip button wearing a
different label.** The beats have to roll on by themselves, because the whole reason `lessonSeen`
exists is that a six-year-old presses whatever big button is offered and then meets a test nothing
prepared them for. TickTock shipped a Next on every beat for exactly the time it took to notice.
The forward path is the teaching finishing, plus the one hands-on go at the end.
⚠️ **But then it OWES a hard cap per beat**, because the only way forward is now a timer: a beat whose
narration never reports done is a chapter that hangs on its own teaching, which this repo has shipped
once already (the 3–5 counting intro froze on slide one when a voice fetch wedged, precisely because
its say beats had no timer of their own). `speakSteps` has a fallback; put a backstop behind it.

⚠️ **THE 12–18 BAND'S CHALKBOARD IS THE TEACHING SURFACE IN 9–11 TOO** — founder's call, and the
argument for it is that one board is one thing to learn to read: THE PLAN, the worked steps and the
re-teach all arrive on the same object instead of a card in one phase and a sheet in the next. Three
things it needs, each of which is why it was kept out of the band before:
- **A WOODEN FRAME AND A CAST SHADOW, not a bare slate**, or it is the slab fault (a filled rect over
  a painting reads as UI furniture, because paintings contain no filled rectangles). Framed and
  shadowed it is a board hanging on a wall, which is a thing a school hall has.
- **`--font-chalk` MUST BE DECLARED ON `:root`.** It was scoped to `[data-band]`, so a 3–11 chapter
  reaching for it silently got the body font with nothing erroring — a chalkboard written in the
  chapter's own display face, which reads as an ordinary panel painted dark.
- **The board is WINDOWED and its window shrinks on a short frame** — 2 lines rather than 4. A
  10-step walkthrough accumulates more working than a nine-year-old holds, and the surplus has to go
  somewhere.

⚠️ **AND THE WORKING GOES IN THE BAND THE CONTROLS OWN DURING PLAY, WHICH IS EMPTY IN A WALKTHROUGH.**
This is a placement rule with a measured price: pinned top-left, The Fundraiser's working board was
drawn straight ACROSS the answer boxes at **17 of 18** reachable size × column-count combinations —
the boxes are centred under the docket and the sheet started at x = 12 — and it had been shipping,
because translucent paper hid what an opaque board showed in one screenshot. A demo has no digit pad,
no camera pane and no control row; the characters stand at the SIDES of that band. Anchor the board
to the BOTTOM and centre it, so the only way it can overflow is back onto the boxes — which is then
one assertion.
⚠️ **Export the rect and drive the gate through it, AND source-check that the component uses it.**
Proven by mutation: a check that recomputes "bottom 10, this tall" stays green the moment somebody
pins the board somewhere else, because a placement lives in CSS rather than in the function.

⚠️ **A QUIET SKIP IS NOT THE SAME THING AS A "NEXT" BUTTON.** The standing rule — a button on a first
run is a skip button wearing a different label — is about the FORWARD PATH: the teaching must roll on
by itself, so a child who presses whatever big control is offered cannot land in a test nothing
prepared them for. The teen band's *"I've got it →"* survives that rule by being the smallest thing on
the screen and never the way forward. ⚠️ **And the re-teach gets none**, because a child who has just
missed three in a row is exactly the one who must not be handed a way past the explanation.

⚠️ **AND A CONTROL APPEARS WHEN THE CHILD IS ASKED FOR IT, NOT WHEN ITS PHASE BEGINS.** Gated on the
beat index, TickTock's dial showed up while Milo was still three sentences earlier explaining the
minute ring — because the narration line lags a new beat until its first step fires and the render
does not. Set a flag IN the step that does the asking.

The two halves must also be visibly different, or the child cannot tell that the help has stopped.
In the lesson the correct paint pot bounces and the tray keeps a fixed order; in the test the cue is
gone and the pots shuffle. A handover screen says so out loud, because the picture, the tray and the
hint all change at once and a child who is not told has simply had the game taken away.

**PICK THE SUBJECT THAT CAN CARRY THE WHOLE SKILL.** The garden page can only spend six paints by
hunting for the two objects on it that are not one fixed colour; the toy room spends them without
strain, because a toy is whatever colour it was made — a green car, a purple teddy and an orange rug
are all simply true. When a chapter teaches a PROPERTY, choose a world whose objects vary in that
property. Half the difficulty of writing honest questions is chosen at the moment you pick the scene.

**NEVER ASK FOR A PROPERTY THE THING CANNOT HONESTLY HAVE.** "Colour the cloud purple" teaches a
three-year-old that the colour words do not mean anything — the whole point of the chapter is that
red *means* red, and a question that contradicts the world undoes it. The paint box holds six colours
and none of them is white, grey or brown, so the clouds and the tree trunk are simply **not
questions**; they stay free to colour, they are just never asked for. When a page runs short of
honest targets, the fix is to find the objects that genuinely can be any colour — flowers, painted
surfaces — not to relax the standard. Generalised: **an attribute question must be true of its
object.** The same test kills "which is taller, the pond or the song".

## 1. Animation

### Is it alive? — four things to check before showing anyone

Every chapter in this band that works has all four. **Count them; it is not a matter of taste.**

1. **Something arrives on its own legs** — a journey, not an appearance.
2. **The child's tap SENDS someone somewhere**, and that journey is the reward.
3. **Milo has a job on screen** — a character with something to do.
4. **The scene changes across the ten rounds.**

BlockYard's first rebuild scored **zero of four** and was still, technically, a correct manipulative:
a brown slab with objects popping into slots. The founder said it "doesn't look right", and that is
what he was seeing. Run this check on your own build before asking anyone to look at it.

⚠️ **BUT PASSING IT IS NOT ENOUGH — ALIVENESS AND BLEND ARE TWO DIFFERENT AXES.** BlockYard's SECOND
rebuild scores 4/4 here, holds every timing rule below, and was rejected too: *"sahi se blend naii…
satisfaction naii mil rha hai"*. A thing can travel on its own legs, at its own gait, with its cycle
in step, and still sit ON the picture rather than IN it. Everything under **Images and art** is the
other axis, and it is the one this doc had far less to say about until now: sizes that agree with
each other, contact with the ground, a group that is a huddle rather than a row of stickers, and a
palette that belongs to the scene. **Check both before showing anyone.**

⚠️ **AND CHECK THE CODE, NOT THE COMMENT.** That same file's header said *"a crate of more arrives
and travels in"* while the implementation just called `setState`; the travel component written for
it was never wired to anything. **A comment asserting a rule is followed is the most expensive kind
of lie**, because it is exactly what stops the next reader from checking. When a header claims a
journey, grep for the component that would perform it.

### The three rules everything else follows from

1. **The background holds still. The objects move.** Nothing scrolls, nothing parallaxes.
   *(Chapter 3: a scrolling-background race was stopped mid-build by the founder for exactly this.)*
2. **Never animate the thing the child has to read.** Moving the answer objects makes them harder to
   read AND leaves the scene unchanged. Keep the answers still and legible; give ONE character all
   the movement. A creature that has already been chosen may travel — by then it has been read.
3. **The tap causes a journey, and the journey is the reward.** A correct tap should send something
   somewhere. A number lighting up green is not a reward.
4. **Nothing may signal that the answer is right BEFORE the child commits it.** Where a chapter has
   a commit gesture, the commit control and every marker around it must look *identical* at every
   state. Chapter 4 briefly turned its Ready button green the moment the count matched, which
   quietly replaced the chapter with a hot/cold game — tap, check the colour, tap, check — and a
   child can win it without counting once. Same reason the teen band rejected a balance beam that
   tilts live while you dial x: *a verdict is not required for something to be hot/cold.*
   Celebration goes **after** the commit, where it confirms an answer already given.
   ⚠️ **AND THE CUMULATIVE ARC IS THE SNEAKIEST WAY TO BREAK THIS, BECAUSE IT LOOKS LIKE HISTORY.**
   `SkillBeat` fires `onRound` when a round **LOADS**, not when it is answered — so a strip, tray or
   manifest that appends "this round's answer" on that callback is printing the answer to the
   question still on screen. RailLine shipped it for exactly as long as it took to measure: on round
   2 the run strip already read `20 30`, and 30 was the answer the child had not given yet. **Hold
   the pending value back one round**; the arc is the run SO FAR, which is what it claims to be, and
   the final round's value simply never joins it. Nothing in a type-check or a green gate can see
   this — the strip and the callback are each individually correct.

### Cycles and travel — the rule broken most often

**A walk cycle and the travel it belongs to must be given the SAME number.** Every skating,
sliding and moonwalking bug this project has shipped is one of these:

| what went wrong | why | the fix |
|---|---|---|
| feet ran while the body slid at a different speed | travel duration was a constant, unrelated to the cycle | derive duration from distance ÷ ground speed |
| creature walked, then slid frozen for 1.9s | duration inferred from a `moving` flag that cleared earlier | state duration **per phase** as an explicit prop |
| shadow arrived before the feet | shadow was a SIBLING with its own `transition` | make it a **child** — two things that must move as one should be one element |
| legs ran forwards while the body went backwards | layout let a creature sit right of its destination | layout must **guarantee** travel direction |
| a group appeared instead of arriving | only the *movers* were given a journey; the standing group scale-popped and the container was what moved | **everything on the stage travels** — see below |
| the character never appeared at all | `leave` passed as a CONSTANT with `ms={0}` — `Arrive` starts at its DONE phase, and done-while-leaving means *already gone* | `leave={leaving}`, so the flag and the duration agree |
| a crowd FOLLOWING a character slid with its feet parked | a hand-rolled `transition: left` beside `Arrive`, with `moving` gated on the wrong phase | **use `Arrive` for anything that travels, including a follow** |

⚠️ **THAT SECOND-TO-LAST ONE IS THE NASTIEST TO FIND, because the character is INVISIBLE rather than
misplaced.** `leave` and `ms` are two halves of one statement — "go, and take this long" — and setting
`leave` unconditionally while gating only the duration makes the resting state mean *gone*. Nothing
errors, nothing is off by a few pixels; the chapter simply renders without its character, and no gate
can see an element that is correctly positioned a screen-width away. If a sprite is missing, check
its travel flags before anything else.

⚠️ **THE LAST ONE IS THE COMMONEST WAY THE RULE GETS BROKEN NOW, because the position change does not
look like a journey.** A set that follows someone, closes up a gap, or shuffles along is travelling,
and if you move it with a raw CSS transition there is nothing connecting the legs to it — the flag
ends up gated on whatever phase you happened to be thinking about. `Arrive` takes its child as a
FUNCTION of whether the thing is currently moving precisely so the two cannot be set independently.
Reaching past it to write a `transition: left` is how HopAlong ended up sliding a dozen creatures at
once behind a correctly-animated Milo.

**NOTHING MATERIALISES, INCLUDING THE THINGS THAT ARE ALREADY THERE.** It is not enough to give the
*event* a journey. StoryTime's joiners travelled in from off-frame while the group they were joining
still scale-popped into existence one at a time, and MarketDay's creatures never moved at all — the
*tray* was lowered onto the counter with them riding inside it. Both read as things appearing,
because they are, and a creature that arrives as cargo has not arrived. Two rules out of that:
- **A container is scenery.** A pen, a tray, a frame may fade up; it must not be the thing that
  carries the creatures in. Give the container the fade and the creatures the walk.
- **A standing group STEPS in — it does not come from off-frame.** Handing it the movers' distance
  is wrong the other way: at ~0.9 × the width every one of them clamps to `TRAVEL_MAX` and the legs
  whirl at ~4× to cover it, for a group that is not the event. The same journey machinery over
  1.6–1.8 body-heights gives a real step at the creature's own gait, with no clamp — and it is short
  enough that the opening does not outlast the sum it is setting up.

⚠️ **AND A JOURNEY'S PHASE MUST BE RESET DURING RENDER, NOT IN AN EFFECT.** Effects run after paint,
so when a landed creature is told to leave, its phase still belongs to the previous journey for one
render — "done" plus a fresh `leave` reads as *already gone*, and the element is painted one frame
lurching toward the exit before the effect pulls it back. Measured on the take-away: a `922px`
target with the legs running, then a snap back to the slot, then the real walk. Derive the phase
from the journey's identity during render instead (React's own escape hatch). Same shape as the
"waiting at the start position needs no transition" rule: **a placement is not a journey**, and
anything that lets the two be confused produces a slide in the wrong direction.

- **One cycle carries one stride.** A sheet playing `fps/frames` cycles per second, each carrying
  `STRIDE` body-heights, gives a real ground speed; the duration falls out of it. A creature
  crossing twice the distance takes twice as long.
- **A CLAMP ON THAT DURATION IS A SECOND HALF OF THE RULE, NOT A DETAIL.** The moment you write
  `min(MAX, …)` the body stops moving at the speed the legs are running, and the whole invariant is
  gone. This is not hypothetical and it was not rare: measured across the cast, a journey of 60% of
  the screen wants **5–10 seconds** at a walking pace, so *every* long journey in the 3–5 band sat
  pinned at `TRAVEL_MAX` with the body covering ground **2–4× faster than its legs claimed**, for
  months. Each chapter dutifully computed a `cycleScale` for the showy march and passed a bare `1`
  for ordinary journeys — so the ordinary ones were the ones that skated. Use `journeyOf`, which
  returns `{ms, cycleScale}` together, and pass BOTH to `Critter`. There is deliberately no
  duration-only helper any more: the old `travelMs` was deleted rather than documented, because
  returning the pair is what makes the correct thing the only thing.
- **Speed looks natural when the legs match, not when it is slow.** A creature hurrying on legs
  that agree with the ground reads as hurrying; the same speed with legs at the wrong rate reads as
  broken, and "it moves too fast" is what a person says when they see it.
- On a *clamped* journey the resulting leg cycle works out to `ms · STRIDE · h / dist` — **the
  cadence cancels out entirely.** So when long journeys look frantic, `fps` is not the lever;
  sprite height, the ceiling, or the distance are. (This is why the sprite cap is a pacing number:
  a creature pinned small on a wide screen must cover more of its own body-lengths to cross it.)
- **Easing is `linear`** for travel. A walking creature moves at constant speed; ease-out puts most
  of the distance in the first third and reads as a slide.
- **A stationary creature PAUSES its cycle** and breathes instead. A cycle looping in place is
  skating on the spot.
- If something must cover a lot of ground fast (an exit, a march), **speed the cycle up by the ratio
  of that speed to walking speed** rather than slowing the travel down.
- Sprites are **drawn cycles from video**, never cut-out puppet rigs. One rigid piece per limb
  cannot change SHAPE, and shape change is most of what reads as animation.
- ⚠️ **A HOP IS NOT A WALK, AND `Critter` CANNOT CARRY ONE.** Everything above assumes a *walk*: the
  feet cycle continuously and the body moves at constant speed, so linear travel across the cycle is
  correct. A hop is **ballistic** — measured on the generated frog sheet, the creature is coiled for
  9 of 12 frames and airborne for 3. Give that to `Critter` and it slides along the ground while
  crouched, which is the skating fault wearing a new costume. A hopping creature needs a **discrete
  `hop(from, to)`**: one cycle played against a matched arc, landing, stopping. Do not reach for
  `journeyOf` for it. (This is why the 6–8 HopAlong rebuild is not "`critters.tsx` unchanged" —
  see [story-6-8-rethink.md](story-6-8-rethink.md).)
- ⚠️ **IF THE SHEET CARRIES ITS OWN ARC, THE CODE SUPPLIES ONLY THE HORIZONTAL.** A generated hop has
  the vertical drawn INTO the frames — measured on the frog, its feet lift `0 → 8 → 44 → 27 → 0` px
  in a 256px cell, i.e. 17% of body height. Add a CSS arc on top of that and the creature rises
  twice, which is the shadow-outran-the-feet fault in a new place: **two sources animating one axis
  and nothing keeping them in step.** Measure the per-frame lift before writing any vertical motion;
  if it is non-zero, the sheet owns the Y axis and you own the X.
- **A WALK'S FRAMES ARE EVENLY SPACED; A HOP'S ARE NOT — SO KEEP THE SOURCE'S OWN FRAMES.** A walk is
  uniform, which is why twelve samples carry it and `steps(12)` looks right. A hop's whole character
  is its UNEVEN timing — the animator holds the anticipation, races the rise, hangs at the top — and
  cutting it to 12 averages those holds away. **Do not hand-author a timing chart to put them back:
  the generated clip already has them.** Find the true period by autocorrelation, cut that many
  frames at the source's own rate, and `steps(n)` reproduces the original exactly. Milo's hop is
  19 cells at 24fps for this reason; the nest's 22 and the turtle's 14 are the same principle.
  *(The chart-authoring version of this rule was written first and thrown away — measuring the clip
  showed the work had already been done upstream.)*

### Layout is a set of invariants, not a set of nice numbers

Every founder-visible layout fault has been a hand-tuned constant that happened to hold at
1024×600 with three creatures and broke on a wider sprite or a fifth one. State the constraints and
check them with a script:

- travel direction is guaranteed by the layout (all waiting objects on the side they travel FROM)
- nothing crosses a screen edge — derive from the sprite's **own `cellAspect`**, not its height
  (a shark is 1.75× wider than tall; a ladybug 1.47×)
- no two objects in the same row overlap; add a row rather than shrink everyone
- a sprite never drops below ~40px, its number tag never below 24px, its tap target never below 44px
- draw order is **stated explicitly** (an explicit `z` prop), never derived from a coordinate
- a reserved band is measured against **the real control it protects**, and nothing may cross it.
  Chapter 4's bottom reserve was 56px against a 57px button, so feet landed 1px behind it and only
  escaped notice because the creature that low happened not to be over the button. In the same
  place, the huddle's organic jitter was ADDED to its band — pushing feet below the floor `fitBands`
  had just finished proving. **Jitter away from a limit, never toward it**, or the fit means nothing.
- **check the real spots, not the band they came from.** A sweep that reads `waitY1` instead of the
  positions `waitSpot` actually returns cannot see any of the jitter, and passes clean.
- ⚠️⚠️ **A GROUND LINE BELOW WHERE THE CONTROLS ALLOW ONE DOES NOT FLOAT THE CAST — IT BLOWS THE WHOLE
PICTURE UP, AND THE ARITHMETIC IS VIOLENT.** The cover-fit that pins a painted ground to a viewport
line scales the scene up to close any gap beneath it, and that term is
`(vh - groundPx) / ((1 - share) * SCENE_H)` — so as `share` approaches 1 the denominator goes to zero.
Measured on a kitchen table whose floor sits at 0.95 of the image against a usable ground of 0.807:
the backdrop rendered **4981px wide at x = −1850 with the working surface 1142px ABOVE the frame.**
Not a float, not a crop — the scene simply left. **The ceiling is `groundY / vh`, it is TIGHTEST on
the shortest frame** (0.807 at 1280×720 but 0.756 at 640×270), and it is one assertion swept across
the size matrix. Nothing in a type-check or a band check can see it, because every band is correct.

⚠️ **AND A SCENE WHOSE WORKING SURFACE IS NOT ITS GROUND NEEDS TWO LINES, BOTH THROUGH THE SAME
TRANSFORM.** A table is the case: the paper lies on the tabletop and the character stands on the
floor, and given one line either the sheet floats a foot in the air or the character stands on the
table. Add the second as a share of the IMAGE and map it with the same `coverFit` the backdrop is
drawn with — a share of the VIEWPORT is the RailLine fault wearing a different hat, and it only
disagrees on the aspects you did not test.

⚠️ **AND ANCHOR A THING ON A SURFACE BY ITS OWN BOTTOM EDGE, NOT BY A SHARED CONSTANT.** A contact
shadow drawn at a flat `1.16r` under shapes whose real bottoms are at `0.78r` (a square), `0.6r` (a
rectangle) and `r` (a polygon) leaves the object hovering a third of a radius above its own shadow —
measured as a 52px gap with the sheet up in the window. Read the bottom off the geometry you are about
to draw. The "draw from the ink box, not the file box" rule, applied to a code-drawn shape.

⚠️ **A SCENE LAID OUT IN SCREEN PERCENTAGES MUST BE `position: fixed`, NEVER `absolute`.** An
  absolute element resolves its percentages against the nearest POSITIONED ancestor, and in a scored
  round that ancestor is `SkillBeat`'s own `position: relative` wrapper — which is content-sized. So
  `top: 74%` of a strip a few dozen pixels tall put BlockYard's entire yard, Milo, the pen row and
  the answer pad squashed across the top of the frame at 1280×720. **Pass 2 shipped this and it went
  unseen through a whole verification pass**, because the demo and the guided round render OUTSIDE
  `SkillBeat` and look perfectly correct — the fault appears only once the first SCORED round loads.
  `Critter` has been `position: fixed` for exactly this reason. Generalise: **verify a chapter in its
  scored rounds, not only in its demo** — they do not share a containing block.
- ⚠️ **A PROP THAT IS ABOUT TO MOVE HAS TO BE ON SCREEN WHILE THE CHILD IS DECIDING.** A thing
  parked just off-frame "ready to go" does not exist yet — the round opens on an empty stage, and
  the object the whole gesture is about only appears as a consequence of the answer, which is the
  materialising fault with the order reversed. RailLine parked its train one gap left of the first
  station, which computed to **x = −50 on a 1280 frame**, so the train AND the passenger riding it
  were both invisible for the entire time the question was open. Park it against the frame edge
  instead, and accept that it stands in front of some scenery — check whether the overlap is even
  real before designing around it, because things at different heights never collide: the train sat
  at y 453–565 and the name boards at 362–421, so a locomotive in front of a post is just what a
  station looks like.
- ⚠️⚠️ **A CLAMP THAT PROTECTS A CODE-DRAWN CUE BY MOVING A PAINTED ELEMENT IS ALWAYS THE WRONG
  LEVER, AND THE ARITHMETIC IS BRUTAL.** The rounding chapter's distance marker hung BELOW the painted
  walkway and was landing on the commit button (8px at 1280×720, ~70px at 1920×800 — measured, and
  shipping). The instinct is to pull the path up to make room. Measured across the sweep, that clamp
  **floated the whole cast up to 64px off the painted walkway on 6 of 10 sizes** — i.e. it traded an
  8px overlap for the exact fault the chapter is named for, the one the founder reported as *"the
  train is not on the rail"*. **The painting is the fixed thing; the cue is the free thing.** Move the
  cue.
- ⚠️ **AND ON A WIDE FRAME THERE IS NO ROOM BELOW A LOW PAINTED GROUND LINE AT ALL.** Cover-fit on a
  2.4 aspect drops a 0.76 ground line to y 695 of 800, leaving **4px** before the control row — so no
  height of cue fits underneath, and shortening it is not a fix either. Hang it ABOVE the line, where
  the whole band up to the answer boards is empty apart from thin posts. Check it cannot collide with
  whatever else lives in that band (here the halfway mark, whose stalk is ~190px, so the two share an
  x on a dead heat and still never meet).
- **A LANE THAT WILL FILL MUST BE RESERVED FROM EMPTY.** Anything that grows — a run of blocks, a
  gathered group, a strand — is zero-sized before the first item lands, so its neighbours sit in the
  wrong place until then and jump a whole item when it arrives. In the measurement chapter the thing
  that jumped was *the thing being measured*, which is the one element the child is reading. Give
  the container the full width or height it will end at; empty and unstyled, it gives nothing away.
- ⚠️ **THE ROW-AND-COLUMN SHAPE OF A LAYOUT IS SEARCHED, NOT PICKED — the doormat fault has TWO
  axes and a fixed shape loses on one of them.** FitOut's frame was sized to the short dimension by
  a `topY` cap and came out at 2.8% of the screen; The Supply Run hit the mirror image with a
  hardcoded two-column receiver — at the parts bench (a low bench, six receivers) that gave
  `byWidth` 36 against `byHeight` 107, so it drew 30px units with half the wall above it standing
  empty. Neither a unit-size floor nor an eye that has not seen the alternative catches this: 30px
  *passes*. **Enumerate the few candidate shapes, compute the pitch each would give, and take the
  biggest** — eight arrangements is a handful of arithmetic and it holds on every site at once.
  Break the circularity (the band decides the pitch, the pitch decides the shape) by granting the
  band the tallest arrangement any candidate could ask for. And **gate it by asking whether the
  layout USES the room it was given**, not merely whether the unit clears a floor.
- ⚠️⚠️ **A "SHORT FRAME" FLAG IS NOT A "NARROW FRAME" FLAG, AND RESERVING A CHARACTER'S LANE BY IT
  PUTS HIM BACK ON THE ANSWER BUTTONS.** `short` is `vh < 470`, so a NARROW BUT TALL frame takes the
  roomy branch: measured live at **466×676**, Milo's lane collapsed to 12px and he covered the pad's
  **`0` and `1` keys** — and in that chapter `0` is the answer on most rounds. He is
  `pointerEvents: none`, so every tap still lands and no probe, console or gate can see it; only
  crossing his box with the pad's does. **What decides whether the pad reaches him is WIDTH.**
  ⚠️ And a fixed lane is still a guess: 104 left 4px of him over the `0`, because his right edge there
  is 109.5. Derive it — `PtMilo` is `left: 9%` with `translateX(-50%)` and `width: min(20vh, 160px)`,
  so `miloRight = vw*0.09 + min(vh*0.20, 160)/2` — which is this doc's own *measure a boundary off
  THAT character* rule, applied to the one character every 9–11 chapter draws.
  ⚠️ **Where the lane is only a margin because CENTRING clears him, assert that** — otherwise it is
  true by luck, which is the thing the sweep exists to stop.
- ⚠️⚠️ **A TALL BOARD IN A SHORT WIDE BAND NEEDS REFLOW, NOT A SMALLER SCALE — the teen band's rule,
  and it recurs in 9–11 the moment a board is a vertical stack.** Measured on The Coin Tray at
  640×320: the board rendered **201×90 inside a 550×98 band**, i.e. height binding hard with **~330px
  of width going spare**, and `FitBox` obediently shrank the coins to a **2.2px pip** — the one thing
  the child has to count, made uncountable. Putting the price tag BESIDE the wells instead of above
  them took the same board to 485×90 and the pip to 6.6px, in the same band. **Before blaming the
  band, check whether the board is using the width it already has.**
- ⚠️ **AND THE SHAPE OF A COUNTABLE PIECE IS A LAYOUT DECISION, BECAUSE ASPECT IS WHAT `FitBox`
  PRICES.** A "ten" drawn as a 1×10 strip is ten pips TALL, which in a short band is exactly the wrong
  axis; the same ten as a 2×5 **ten-frame** is half the height, still obviously ten, and is the
  arrangement the band below already met. Draw a piece in the aspect the band has room for.
- ⚠️ **A FIXED RESERVE FOR SOMETHING THAT WRAPS IS WORSE THAN NO RESERVE.** A verdict pill given a
  24px box wrapped to two lines at that width and spilled straight over the price tag above it — a
  collision *created* by the reserve meant to prevent one. Either size the row to its content and
  accept the rescale, or guarantee the pill is one line. (Collapsing an EMPTY reserve is still right:
  22px of blank band on a 98px board is a fifth of the coins' size, spent on a pill that is not there.)
- ⚠️⚠️ **"TEXT ALREADY READ" DOES NOT INCLUDE ZONE 3'S INSTRUCTION CHIP — AND THAT IS THE HALF OF THE
  TOP-CLAMP RULE NOBODY HAD WRITTEN DOWN.** The clamp is justified by sliding a board UP under prose
  the child has finished with. The chip is the LAST thing in the card, so it is the FIRST thing the
  board reaches — and it is the one action, not something read and done with. Measured on The Height
  Bar at 640×320: the full prompt wraps the card to 97px, the wanted top (151) is past the 112 the
  clamp allows, and the chip landed **29 × 16 px across the headline** — the door-frame mark, which
  IS the question. **Check what the clamp actually covers, in pixels, on the longest card the chapter
  can produce.**
  ⚠️ **And the lever is the PROSE, in this order:** drop what is said somewhere else (the rule
  sentence is stated in the demo AND the re-teach, so a short frame gets the two facts alone), then
  shorten what is left. Do not buy the pixels from the band, and do not buy them from the chip.
  ⚠️ **Pin the result as a CHARACTER BUDGET on the words, because nothing can see a wrap** — the
  chalkboard's `PLAN_BUDGET` shape. Measured here: 118 characters wraps to two lines and collides,
  70 is one line and clears by 12px. A gate can hold a budget; it cannot hold a rendered height.
- ⚠️⚠️ **AN ACTION ROW ADDED TO THE BOTTOM BAND CAN PUSH THE BOARD'S TOP CLAMP ABOVE THE QUESTION
  CARD.** The clamp exists to slide a board UP under *text the child has already read* — but its input
  is the BOTTOM band, so a 47px "I've got it" row on its own line moved the top from 105 to **65 on a
  320px frame and drew the board 32px into the card, over the price tag**, which is the question
  rather than text already read. The way out on a short frame is the band's quiet **top-right chip**
  (13px, the smallest thing on screen, never the forward path) — free there, because SkillBeat's round
  counter owns that corner only in a played round and an explore beat renders outside it.
- ⚠️ **ON A SHORT FRAME A PANEL DROPS EVERYTHING THAT IS SAID SOMEWHERE ELSE, AND THE THING IT BUYS
  IS THE MANIPULATIVE'S SIZE.** Measured on The Pizza Counter at 640×320: the question card wrapped
  to 96px of a 320px frame and the answer row reserves 112, so the board got its 90px floor and
  `FitBox` scaled two pizzas down to **35px each** — the one thing the child has to COMPARE, made
  unreadable, while the panel around them spent ~70px on a header strip repeating the card's own tag
  and a big readout repeating the denominator the card already states. Neither carried anything the
  child could not read two inches higher. **Audit a panel's chrome for duplication before blaming the
  band**, and shorten the question's own prose (the honest lever) before either. 35 → 51px for free.
- ⚠️ **A CAP THAT ONLY BINDS ON LARGE SCREENS HANDS THE SMALLEST SCREEN THE BIGGEST PROPORTIONAL
  RESERVE.** `min(vw * 0.4, 380)` for a speech bubble reads as a sensible clamp and is the opposite
  of one: at 1280 wide the 380 binds and the bubble takes 30% of the frame, while at 640 nothing
  binds and it takes the full 40% — so the frame with the least room to spare gave the most of it to
  the words and the least to the thing being counted. Measured, that was 11px units on a short
  landscape frame. Pick the SHARE so the cap still binds where you want it to (0.34 here), and read
  the number from ONE exported function — this one was written twice, in the layout and in the
  bubble, which is *two places deciding one thing* waiting to drift.
- ⚠️ **AND THE CHROME'S OWN HEIGHT IS ONE OF THOSE GAPS.** "The top strip is 38px" is a guess about a
  button, and TickTock's Menu button measured **12 + 41 = 53px** from a 38px budget, so the bubble
  below it opened **13px inside the button**. Derive the strip from the control's own metrics — font,
  padding, border — and export those metrics so the button and the band cannot drift apart. On a
  short frame shrink the BUTTON, since height comes out of the chrome before it comes out of the world.
- **WHEN TWO THINGS MUST NOT OVERLAP, MEASURE ONE OFF THE OTHER — never pick a percentage of the
  height.** `top: 73%` for an answer readout and `bottom: 3.5%` for the answer buttons are two
  independent guesses about the same gap, and at 1024×620 they put the readout **29px inside the
  button row, sitting on the middle answer** (StoryTime; MarketDay's equation box was 33px in). Both
  had shipped. The fix is to derive the readout's offset from the same numbers the buttons are laid
  out with. Same family as the ScribblePad rule *(when two elements must not overlap, make one take
  the other's space in layout — do not compute a matching reserve)*.
- **ON A SHORT FRAME THE WORLD YIELDS TO THE TAP TARGETS, NOT THE OTHER WAY ROUND.** BlockYard's
  ground line was a flat 74% of the height, which at 640×320 put the creatures' feet at 237px and
  the answer pad's top at 230 — the cast standing in the digit strip. The pad's buttons are the
  thing a finger has to hit and may not shrink, so the GROUND is derived from the band left over
  (`groundOf(vh)`), and a roomy frame still gets the designed line. Measure the band you must clear
  rather than picking a percentage and hoping.
- **AN ANSWERING CONTROL SIZES OFF ITS OWN BAND, NOT OFF THE CONTENT'S UNIT.** BlockYard derived
  its digit pad from the same unit that sizes the bench, so on a 640×320 frame — where the bench is
  squeezed — the digit buttons came out **28×28**, well under the 44px tap floor, while the pad's
  own band had room to spare. Give a control the band it occupies and let it fill it (37×37 after,
  which is this repo's stated ceiling at that size). **The thing that is TAPPED wins the pixels
  over the thing that is merely read.**
- ⚠️⚠️ **A RESERVE BIG ENOUGH FOR THE WHOLE RANGE MAKES THE THING BEING READ TINY — DERIVE THE UNIT
  FROM A FIXED BOX, AND CLOSE UP ONCE THE ANSWER IS IN.** *A lane that will fill must be reserved from
  empty* (above) is right and has a price nobody had costed: The Empty Plot reserved all twelve metres
  of walkable depth so the plan could not jump under a child pacing it, and at a typed 22px a metre a
  5 × 2 plot then occupied **14% of the box**, which `FitSlot` shrank again to fit the slot. Founder:
  *"the size is too small bro."* Three moves, in order:
  - **Fix the BOX and derive the unit** — `u = min(W / across, H / visible)`. A narrow plot gets a big
    unit, a wide one a smaller unit, the instrument is always the same size in the layout, and nothing
    jumps. A typed unit is a guess about the widest case that every other case pays for.
  - ⚠️ **The visible range may close up ONLY after the commit.** Closing it on the round's own answer
    while the question is live makes the box's height *be* the answer, drawn instead of written — the
    printed-answer rule arriving through the layout. Before the peg it is the same on every round; after
    it, the plan zooms to what was built, which is *go back and look at what was made* done with scale
    instead of a camera. Measured: the plot went from 44 × 110 to **110 × 278**.
  - ⚠️ **And check what the bound is really buying.** This one allowed pegs at 11 and 12 that no
    answer ever needs — and that the two-hand span could not express either, so the tap path could
    reach depths the camera path could not. Cutting it to 10 bought ~20% more unit AND closed a
    one-instrument-two-inputs hole. **A range constant is a scale decision as much as a rule.**
  ⚠️⚠️ **AND THE PLAN'S ORIENTATION IS PART OF THE SCALE — TURN IT WITH THE FRAME.** A shape that is
  right for a phone is wrong for a laptop: The Empty Plot's long axis is the WALK, so drawn with the
  depth running down the page it is a tall sliver in a wide slot, and every metre pays for it.
  Founder: *"laptop screen pe yeh ek proper horizontal rectangle mein dikhe … abhi woh vertical mein
  hai, joh phone ke liye sahi."* Measured at 1280×720, turning it took the plan from **110 × 340 to
  658 × 168** and the character from 34px to 59px — nothing was resized, the same metre simply had
  room. This is *reflow, not a smaller scale* one level up: before shrinking anything, ask whether the
  long axis is pointing the wrong way.
  - **Do it with ONE mapper, never two renderers.** Place everything in the world's own units
    (`across` along the road, `deep` into the yard) and turn that into pixels in one exported
    function. Two copies of the drawing code drift the first time a marker moves.
  - ⚠️ **And the mapper must be DRIVEN by the gate, not grepped.** Mutation-tested: a tile grid that
    had stopped turning with the plan passed every box-size and metre check in the file, because those
    were all still correct. `planXY(land, …)` and its transpose property is one assertion and it
    catches the thing that actually breaks.
  ⚠️ **AND EVERY MARKER ON IT MUST BE DERIVED TOO, OR THE CHARACTER SHRINKS TO A DOT.** The moment the
  unit stops being a constant, every typed pixel size around it is wrong: the walker, the peg and the
  corner posts stayed at 15–16px while the metre grew to 56, so the child's own character rendered a
  third of a metre tall and vanished — founder, on a screenshot: *"kitna chota dekh raha hai .. yeh
  character."* Derive them all from the unit with a FLOOR (the floor binds on the widest plot, where
  the unit is smallest), and export the sizing so the gate drives the shipped numbers.
  ⚠️ **A gate that only asks "do these boxes overlap" cannot see a marker frozen SMALL** — a tiny thing
  collides with nothing. Assert the RELATIONSHIP (a bigger unit gives a bigger marker) as well as the
  clearance. Mutation-tested: freezing the walker at 30px passed every collision check in the file.
  ⚠️ **And an emoji's box is not its ink, so a clearance of `>= 0` is not a clearance.** Modelled at a
  3px gap the arithmetic said the walker cleared the label and the DOM said he overlapped it by 2px:
  a glyph's line box carries leading the font size does not describe, and a shell that scales the
  instrument shrinks the gap again. Require a real margin (6px+ authored here) and check it on the DOM.
  ⚠️ **Then re-cross the layers, because a bigger instrument reaches further.** Widening this one ran
  the plot's top-left corner **65 × 62 px under the shell's pinned chalkboard** — and the culprit was a
  readout column *beside* the plan pushing it that far left of centre. Stacked under it instead, the
  plan sits on the column's centre line and the collision is not expressible.
- ⚠️⚠️ **A FIXED CORNER AFFORDANCE THE *SHELL* OWNS IS A LAYER TOO — AND ONE OF THEM IS COVERING
  THE ANSWER IN CHAPTERS THAT ALREADY SHIPPED.** The rule was written for the character in the corner
  (*"give him a lane and centre the surface in what is left"*); the same argument applies to any
  `position: fixed` control the chapter does not draw. `ScribblePad`'s closed button is
  `fixed; right: 12; bottom: 12`, roughly 121 × 44 px and unscaled — while a 9–11 instrument is
  *scaled down* inside `FitSlot` and centred in the right-hand column, i.e. centred near x 446 on a
  640-wide frame, not at 320. Measured at **640×320**: The Empty Plot's `back ▶` (526–583) sits under
  it, and **The Coin Tray — shipped, and driven twice — has it over keys 5, 6 and 7.** Every tap
  still lands somewhere, which is why nothing but crossing the boxes finds it. **Cross the shell's
  own fixed layers with your answer surface, not just your own**, and note the fix is one line in the
  shared component rather than a workaround per chapter.
- **A TRAVEL DISTANCE INSIDE A SCALED CONTAINER MUST BE RELATIVE, NOT PX.** `FitBox` scales its
  child by up to 2.6×, so a 54px "lift the tray and set it down" became a ~140px launch that started
  a tray **off the top of the screen** at 640×320. `translateY(-38%)` is a share of the thing's own
  height and travels with whatever size it is currently drawn at.
- **A decoration must not add layout height to the thing it decorates.** A contact shadow left in
  flow made the measuring run bottom-align against the shadow rather than the ground, so the two
  ends of the measure stood 28px apart — a measure whose ends do not share a ground line measures
  nothing. Position shadows, labels and glows out of flow (or inside the subject, per the
  shadow-as-child rule above).
  ⚠️ **This recurs the moment a group is bottom-anchored on a ground line**, and it is the exact
  shape of "the creatures are still floating". StoryTime shipped it: the shadow sat in flow under
  the sprite, so the anchored bottom was where the SHADOW ended and every creature stood a whole
  shadow above the painted ground. Measured at 1024×620 — ground 384.4px, duck feet 363.5px, i.e.
  21px of clear air under a 93px duck. Out of flow and centred on the feet: 2px. **The number to
  check is the sprite's own `getBoundingClientRect().bottom` against the ground line — not the
  container's**, because the container is exactly the thing that is lying to you.
- **a boundary next to another character is measured off THAT character, never guessed.** Chapter 2
  learned this as the cut-off leader; it applies to any adjacency. Chapters 9–10 gave their set a
  flat right limit of 74% and the three widest reef creatures (fish 1.37, turtle 1.53, shark 1.75 : 1)
  ran their last member into Milo at 640 wide. Derive the limit from the neighbour's own half-width
  and give back only what it needs — every percent kept is a percent the set loses.

### Countability is a layout constraint, not a nicety

**How far apart a set stands depends on how the child is asked to count it.** Chapter 4 packs its
gathered group 5.4% of the screen apart — a deliberate overlapping huddle, and correct there,
because that set is counted out one deliberate tap at a time and never exceeds seven. Chapters 9–10
ask for a set of up to **ten counted in one glance**, so the same huddle would be a pile, and a pile
the child cannot count is a wrong answer *the chapter caused*. Spread those evenly, with spacing
derived from each sprite's own width, and cap the sprite against its slot.

Ten on screen is also the ceiling on the arithmetic itself: everything in these chapters is
object-driven, so the sum cannot outgrow what a short landscape phone holds at a countable size.
That is a feature — it dragged addition back from sums of 14 to sums within 10, which is where this
band actually belongs. **The ceiling is per-picture, not a constant**: the comparison chapter spends
width on the gap that separates its bunches, so it holds nine across two bunches and only five
across three. Derive it, measure it in the sweep, and let the number fall where it falls.

**Rows are only room if the rows are visually SEPARATE.** `huddleRows` returns up to 3, and for
chapters 2 and 4 that is right — their cross-row overlap reads as a huddle because those sets are
counted out one deliberate tap at a time. In a chapter counted in ONE LOOK it is a trap: measured on
the reef at 640×320, three rows sat 29px apart against an 83px sprite and the creatures simply
buried each other. Two rules follow, both now in `critters.tsx`:
- cap counting chapters at **two** rows, and
- cap the sprite by `maxSizeForRows` and widen the band with `spreadBand`, so the two rows are at
  least `ROW_SEP` (0.55) of a sprite height apart. `fitBands` alone will not do this — it proves
  heads clear the prompt and feet clear the strip, and is perfectly happy to return a band a few
  pixels tall with both rows on the same line.

**A clamp must budget for anything applied after it.** `spreadBand` raised the far row to exactly
the head-clearance limit, and the organic jitter then lifted it 2% further — straight behind the
prompt. The jitter is now the shared `BAND_JITTER` so the clamp and the spot function cannot
disagree about its size.

**Separation between groups is measured against the SAME-ROW spacing, not the raw step.** Members
alternate rows, so neighbours in one row sit `step × rows` apart. A gap defined as 2.2 × step looks
generous and is, at rows = 2, a 10% difference — the two bunches merge into one line and there is
nothing left to compare.

### The leader is not always one of the flock

Chapter 2 can stand its mother straight on the line because she IS one of them — a mother butterfly
belongs at a butterfly's height. **The moment the leader is a different creature from the group, it
needs its own GROUND line.** Milo dropped onto the sky habitat's flier band left a pony hovering
over the hedge at the edge of frame, which is exactly the "he read as clutter" note that got him cut
from chapter 2. A habitat's bands are tuned for the things that live in it.

And **a group that collects around a character must anchor ON that character and grow away from
them** — filled from a fixed far edge instead, the first two arrivals stood a quarter of a screen
from the person they had just walked to.

**Depth cues have to agree with each other.** Nearer means lower on screen AND bigger. An early pass
had the sky flock waiting above its gathering point, so arrivals came out lower *and* smaller at
once — a child reading depth off size gets the opposite answer from the one they read off height.

### The scene must change across the ten rounds

Question 10 must not look like question 1. Rotate the cast AND the backdrop per round, and give the
chapter a visible cumulative arc outside `SkillBeat` — a collect tray, a journey strip, a filling
tree. *(Nest Tree shipped without one and feels static across a run; that is the open bug to copy
the pattern into.)*

**NO CREATURE MAY BE SHOWN TWICE IN ONE RUN — founder's rule, and it is a COUNTING problem, not a
shuffling one.** A run is `demo beats + the guided round + every scored round`; all three of the
rebuilt 6–8 chapters were short of that and broke it the same two ways at once: the plan held fewer
pairs than the run and was read as `PLAN[round % PLAN.length]`, so the last rounds wrapped back onto
the creature the chapter opened with; and the demo and guided round picked out of `items[]` by hand,
landing on the very entries the scored rounds then served again. Meanwhile a third of the drawn
cycles in `sheets.ts` had no chapter using them at all.

- **Build ONE ordered run for the whole chapter and index it straight, never modulo.** Export it
  (`RUN`) plus the single accessor the scored rounds use (`scoredSlot`), and have the demo and
  guided round take the first slots off the same array. Then "no repeat" is structural rather than
  remembered.
- ⚠️ **A gate that reads the plan ARRAY cannot see how the chapter INDEXES it** — restore the old
  `PLAN[round % …]` and a plan-only check still passes while the screen repeats. The gate has to go
  through the same exported accessor the component calls. (Caught by mutation-testing;
  [chapterCastDistinct.test.ts](../src/__tests__/chapterCastDistinct.test.ts) fails on all five.)
- **Growing the cast is the fix, not shrinking the run** — there are 18 drawn cycles and each
  setting can usually take one or two more that genuinely belong in it. Check what is idle before
  reaching for new art.

⚠️ **A LABEL PRINTED BY BOTH THE BOARD AND THE QUESTION CARD IS THE SAME DUPLICATE ONE LAYER IN.**
Copied from The Coin Tray, The Height Bar's board drew `data.tag` in its chrome strip while the prompt
card's own chip drew the same words — so "TALL ENOUGH?" appeared twice on one screen, an inch apart.
The tag belongs to the QUESTION (zone 3's chip); a board's strip is the instrument's status light and
should say nothing the card already says. It only shows on a roomy frame, because a short frame drops
the strip — which is exactly why it survives a short-frame pass.

⚠️ **AND ENGLISH ASSEMBLED BY CONCATENATION BREAKS THE SAME WAY A PLURAL DOES.** `${verb} it.` over
`{ hand: 'hold up', tap: 'tap' }` gives *"tap it"* and **"hold up it"** — shipped to the guided round's
own instruction chip, caught by reading the screen. One verb cannot serve two sentences: the spoken
line wants a bare verb ("…hold up the tens digit"), the chip has no object after it and wants the whole
phrase ("hold up that many fingers"). Same family as *"0 pennyies"*, and the same fix: write the
variants out rather than gluing parts together.

**TWO PILLS SAYING THE SAME THING IS A DUPLICATE, NOT A FALLBACK.** `SkillBeat` draws a prompt pill
from `beat.prompt`, so a chapter whose own play surface also states the question ends up with two —
and at 640×320 they land on top of each other and neither can be read. Give `beat.prompt` an empty
string (it then renders nothing) and let the richer one own the pill, carrying SkillBeat's
tap-to-replay across so nothing is lost. StoryTime and MarketDay both shipped with the pair;
MissionBrief had already made this call and the reason was never written down here.

---

## 2. Images and art

### Blend, or it reads as a sticker

An object belongs in the picture only if it is **painted in the backdrop's style** and **touches
the world**:

- **Contact cues are not optional.** On land: a soft contact shadow. In water: a waterline, ripple
  rings, and a faded flipped reflection. In the air: nothing, because nothing touches.
- **Soft, cool, close shadows** (`rgba(30,42,60,.26)`), never hard black. A harsh drop-shadow is the
  loudest "pasted on" tell there is.
- **NEVER DRAW AN EMPTY OUTLINE.** A hairline stroke with no fill is a wireframe, and a wireframe is
  the one thing a painted scene contains none of, so it reads as a diagram laid over the picture no
  matter how faint you make it. Fading it down does not help — it just becomes a wireframe nobody can
  see. **A hole in the world is a soft SHADOW with light catching its rim**: a translucent warm dark
  fill and a near-white 4px stroke, which painted art is full of. The shapes chapter drew its empty
  sockets as 20%-opacity outlines and the whole unbuilt house read as a blueprint pasted on the lawn.

Related: **something with no job in the current beat should not be on screen.** That same ghost house
stood behind the six shapes during "meet the shapes", where it meant nothing yet and was simply a
second thing to look at. It appears with the demo, when it starts to matter.
- `blend` in [art.tsx](../src/features/chapters/story/art.tsx) means soft natural shadow and **no
  white halo** — use it for anything sitting in a painted scene.

### What can and cannot be an answer object

- **A numbered PROP cannot blend.** It has no cycle, so the scene is frozen until you tap it; it is
  drawn in the generic library style, so it sits ON the backdrop; and matching it needs bespoke art
  PER SCENE. Chapter 2 tried numbered stepping stones and had to throw them away.
- **Make the numbered things CREATURES.** They are already painted in the app's style, they already
  have drawn cycles, and they are alive before anything is tapped.
- **NO EMOJI IN THE PAINTED WORLD.** An emoji dropped into a painted scene is the single most
  pasted-on thing you can put on screen. Emoji belong in the UI layer (prompt pills, map strips,
  world pickers) — never in the scene.
- A number worn by a creature goes on a **painted marker** (warm cream, ink-brown numeral, soft
  shadow), not a white-and-orange UI pill, and it floats just above the creature — the same idiom
  the counting chapter uses.

### Choosing a backdrop

- **THE BACKDROP MUST BE IN THE APP'S PAINTED STYLE, AND THIS IS THE FIRST THING TO CHECK.** The
  library holds two different kinds of picture, and they are not interchangeable: soft *painted*
  scenes with brushwork and no outlines (`garden_meadow`, `garden_park`, `garden`, `reef_*`,
  `beach_*`, `farm_*`) and flat *vector cartoon* ones with thick uniform outlines and flat fills
  (`pond`, `lake`, `pond_top`, `sky`, `River`). Every sprite in the app is painted, so a painted
  creature over a flat-vector scene is a STYLE mismatch — and no ground line, shadow or placement
  fixes it, because nothing about the placement is what is wrong. A founder sees it immediately and
  says the background "isn't blending with the animation". Open the candidate and look at whether
  it has ink outlines before you check anything else about it.
- **YOU CANNOT PUT SOMETHING BEHIND SCENERY THAT IS PAINTED INTO THE BACKDROP.** The garden's picket
  fence is part of the image, so no z-index will ever place a house behind it — in a painted scene
  depth is VERTICAL POSITION, and the only way back is further up the frame. Standing at 8% from the
  bottom put the shapes chapter's house in front of the fence, in the same plane as the near flowers.
- **Moving something back means shrinking it too**, or you get a giant house halfway down the lawn.
  Depth cues have to agree: further back is higher AND smaller.
- **The ground line is PER BACKDROP, never a shared constant.** The garden's fence top lands 16–20%
  up depending on how `cover` crops it; the beach behind the same chapter's boat is open water with
  nothing in front at all. Same lesson as chapter 4's leader needing its own ground line per habitat.
- **Raising a thing's feet raises its head by the same amount.** Standing the house back off the
  fence pushed its roof to 5px under the prompt pill at 640×320, horizontally overlapping it — one
  size from the collision, and invisible at the size it was designed on. Once the feet are pinned by
  a ground line, HEIGHT is the only lever left, so cap it against the band the prompt really occupies.
  (Swept afterwards across 8 sizes × both builds: fence clearance 32–111px, prompt clearance 13–208px.)
- **ANCHOR A GROUP BY ITS FEET, NEVER BY ITS CENTRE.** `top: 40%; translateY(-50%)` reads as a
  perfectly reasonable way to place a scene and it is how both A2 chapters shipped — with the result
  that pens of chicks hung in the sky above the barn and a row of ducks stood over open sea. Anchor
  the BOTTOM to a ground line (`top: <ground>%; translateY(-100%)`) and let the group grow upward
  into whatever room is actually free. A group centred at a share of the height is floating; it just
  happens to look deliberate on the one screen it was tuned on.
- **A prop invented to stand something on is the tell.** StoryTime drew a wooden plank across the
  middle of the frame purely so its creatures had a surface — over a reef, over the sea, over the
  moon. When you find yourself drawing a floor, the group is in the wrong place: the painted scene
  already has one.
- ⚠️ **BUT A ROUGHNESS SCAN CANNOT FIND A GROUND LINE — IT CAN ONLY REJECT ONE.** Every row of an
  open field is smooth, so the scan is happy at 0.60 and at 0.85 alike; pointed at CoinShop's sweets
  stall it certified 0.60 and Milo stood a stall's height above the grass. **The line is picked by
  EYE against the thing standing in the scene** — a customer's feet sit at or just under the stall's
  own base — and the roughness number is the gate BEHIND that choice, not the chooser. Same shape as
  "σ cannot tell a display case from a table top": these instruments veto, they do not select.
- ⚠️ **AND MEASURE IT ONLY WHERE THE CHARACTER STANDS.** The shared 0.66–0.78 sweep across x 4–97%
  is right for a scene that is all field and wrong for one that is half building by design: on the
  market stalls it walks through the COUNTER and reports 3.7–7.5 for pictures whose ground is
  glassy. Restricted to the open half Milo actually uses (x 56–95%) the same scenes measure
  **0.7–1.9**. A check that includes the thing that is supposed to be there is not measuring the
  ground.
- ⚠️ **A GROUND LINE READ OFF THE PAINTING IS A SHARE OF THE *IMAGE*, AND USING IT AS A SHARE OF THE
  *VIEWPORT* FLOATS EVERYTHING — ON EVERY ASPECT BUT THE ONE YOU TESTED.** `object-fit: cover` scales
  the backdrop to fill and CROPS the surplus, so the painted ground moves the moment the frame's
  aspect stops matching the art's. RailLine measured its rail at 0.785 of the image and drew the
  train at `0.785 × vh`: identical at 1280×720 (aspect 1.78 against the art's 1.79) and **44px of
  clear air on a 2000×970 window** (aspect 2.06), where cover renders the scene 1116px tall and crops
  73px off each end. The founder saw it instantly — *"train properly naii dikh rahi ki rail pe chal
  rahi hai"* — and every measurement I had taken said it was fine, because I had only ever taken them
  at the one aspect that agrees. **Map the line through the transform the backdrop is actually drawn
  with**, and put the wide aspects in the sweep:
  `fit = max(vw/IMG_W, vh/IMG_H)` · `drawnH = IMG_H * fit` · `y = (vh − drawnH)/2 + share * drawnH`.
  ⚠️ And when you gate it, assert the value **exactly**: a `<=` "or clamped upward" assertion reads as
  reasonable and lets the original bug straight through — mutation testing this one caught my own
  check being useless before it was ever trusted.
- ⚠️ **PLACE THE PICTURE SO ITS OWN GROUND LINE IS THE GROUND LINE.** `object-fit: cover` is right on
  a roomy frame and wrong on a short one: at 640×320 the controls cap the usable ground at 214px
  while the painted grass lands at 256, so the world yields (correctly) and **the backdrop does
  not** — and a character standing on the yielded line floats forty pixels above the lawn. Scale the
  scene up until its ground meets the usable line and crop the surplus off the TOP, which is the
  correct end to lose: the top of a scene is sky and awning, the bottom is where everything stands.
  On a 16:9 frame the term is inert. (`fitFor` in [market.ts](../src/features/chapters/story/market.ts).)
- **MEASURE THE HORIZON, DO NOT EYE IT.** Mean row colour down the image, largest jump in the middle
  band, is enough and takes a minute:
  farm 50–62% · garden 45–60% · forest **88%** · reef 36–62% · beach 44–76% · space 54–84%.
  Note `object-fit: cover` — at 1024×620 these 16:9 backdrops crop at the SIDES, so image-% is
  screen-%; a 3:2 one crops top and bottom and needs converting first.
- ⚠️ **AND SAMPLE IT ACROSS THE WHOLE WIDTH, AT EVERY GROUND LINE THE LAYOUT CAN PRODUCE.** One
  sample under one creature is not enough once a chapter fills the frame. BlockYard's yard spans
  x 4–97% — a fence, ten creatures, Milo and a row of pens — and it opened its subtraction run on
  `farm_pond.png`, so **the whole thing stood on open water**. Measured across the band the yard
  occupies: 27–35% walkable there, against 100% on a barnyard. The check is ten lines and belongs in
  the gate: step across x at each ground line the layout can return and count the pixels that are
  not blue-dominant (water and sky are; grass, dirt and paths never are).
  ⚠️ **It will not tell canopy from grass** — both are green — so the horizon numbers above still
  govern the forest scenes. Know what your instrument cannot see.
- ⚠️ **AND THIS CAN COST YOU THE WHOLE SCENE POOL, WHICH IS THE RIGHT PRICE.** Only nine backdrops in
  the library hold walkable ground right across that band, against thirteen slots in a run — so a
  scene has to recur late in the run. **A fence on a pond is a far worse fault than a backdrop seen
  twice**, and the craft rule is that CONSECUTIVE rounds differ, not that every one is unique. A gate
  demanding all-distinct scenes is what forced the pond in; it was relaxed to consecutive-differ.
- ⚠️ **THE TEST IS THE PIXEL UNDER THE FEET, NOT "does the picture have grass in it".** A scene whose
  ground starts BELOW the ground line is not ground — the creatures stand on the pale haze just under
  its horizon and read as hovering exactly as if there were nothing there. `town_park` failed this
  and looked fine in a thumbnail: sampled at the ground line it is `(207,242,217)`, washed-out mist,
  against `(196,223,135)` for a scene that really is grass there. Sample the colour at the ground
  line before choosing a backdrop.
- ⚠️ **THE WALKABLE-GROUND RULE IS NOT AN OUTDOOR RULE. IT IS THE RULE — AND RENAMING THE SURFACE
  DOES NOT EXEMPT IT.** A chapter was built indoors on a "packing bench", with its scenes chosen for
  hue and quietness — both PALETTE checks — and a flat bench line at 0.70 that nobody measured
  against the picture. `craft_gems` is a glass display case topping out at 0.60, so the blocks and
  Milo **floated inside the cabinet, over the necklaces.** The other indoor scenes were counters and
  shelves: real surfaces, but furniture — a pony standing on a bakery worktop, which is the same
  doesn't-belong fault one step along. If a chapter stands things on something, that something has
  to be IN the painting, measured across the whole width, at every line the layout can return.
- ⚠️ **AND σ CANNOT MAKE THIS CHECK FOR YOU.** Measured in the band where the feet land, a glass
  display case and a wooden table top both came out at **17.9** — the jewellery inside the case is
  blurred, so the number cannot see it. **The surface check is by EYE, like the style check**, with
  the walkable-ground measurement as the gate behind it. Open the file and look at what the thing
  is standing on.
- **A WALKING cast cannot be rescued by a ground line — it needs a scene with ground.** StoryTime's
  ducks stood on a flat plane of open sea; no placement fixes that, because there is nothing painted
  to stand on. The fix was the backdrop, not the number. Conversely a FLYING cast wants water or
  sky under it and no contact shadow at all — a shadow is a contact cue, and a dragonfly touches
  nothing. Pick the scene from what the cast DOES.
- **When the answer furniture will not let the creatures reach the ground, shrink the FURNITURE.**
  On a 320px-tall frame a 19vh answer box plus 116px buttons owned half the screen, so the ground
  line had to be clamped up into the sky to clear them. The picture is the chapter; a 116px answer
  square is not (the 3–5 band's markers top out at 54).
- **A grounded scene needs a backdrop whose painted ground is most of the frame.** Check the horizon
  line first. The forest scenes paint ground only in the bottom ~25%, so anything standing at 62%
  is in the treetops — that is literally the "rabbits look like they are flying" bug. The exception
  is a cast that BELONGS up there: birds, squirrels and eagles in a canopy are correctly placed, and
  what reads as wrong is then the container, not the height.
- **A GROUP IS A HUDDLE, NOT A QUEUE.** Evenly spaced, one baseline, one size, and a set of animals
  reads as a row of identical stickers. Alternate members stand further back — higher and smaller,
  which is what depth is in a painted scene — with an organic sideways nudge, both as a share of the
  sprite's own height so the cluster holds its shape at every size. Keep it small where the group is
  the thing being counted: a scatter a child cannot count is a wrong answer the chapter caused.
- ⚠️ **MARKING OUT PLACES ON THE GROUND IS NOT A FILLED SHAPE, AND THIS ONE HAS COST THREE PASSES.**
  BlockYard needed to mark out ten standing places. Pass 1 drew a brown slab and was stopped; pass 2
  drew ten discs, which is the grid the founder then named; pass 3's first attempt drew a
  palette-matched beige rounded rectangle 37% of the screen wide — measured at 1280×720, and it is
  the SAME fault as pass 1. **A solid block laid over a painted scene reads as UI furniture no matter
  how carefully its colour is matched**, because painted scenes contain no filled rectangles.
  What works is the thing the world would actually have: **posts, rails, and a soft tint on the
  ground that fades out at its own edges** — trodden ground has no border. The posts then fall
  between the standing places and mark out the ten without a single disc. Same family as the
  empty-outline rule above, arrived at from the opposite direction: an outline with no fill is a
  wireframe, and a fill with no structure is a slab.
- ⚠️ **A MANIPULATIVE IS A TOOL, NOT SCENERY — IT IS MEANT TO STAND OUT, AND THE PALETTE RULE ONLY
  BINDS TWO OF ITS THREE AXES.** BlockYard's base-ten blocks were first drawn in the same warm sand
  as the yard: measured dead centre of the backdrop's band, and on a farm they read as **hay bales
  and fence posts**. The rule `cart.png` broke is the SATURATION and BRIGHTNESS band; the HUE is
  free. These scenes are green, sky and cream, so the blocks are clay (sat .45 / val .80 — inside
  the painted sprites' own .42–.66) and read instantly as a thing to count. **Match the band, pick a
  hue the backdrop does not already own.**
- ⚠️ **WHEN THE MANIPULATIVE'S HUE IS FIXED BY WHAT IT IS, THE GROUND IS WHAT HAS TO MOVE — AND
  MILO COUNTS AS A MANIPULATIVE FOR THIS CHECK.** BlockYard could pick any hue for a block. A COIN
  cannot: measured, `coin_copper` is **18°**, `coin_gold` **40°**, `coin_silver` a hueless
  **sat 0.09** — so a coin set owns the whole warm-earth band *plus* neutral grey. That is exactly
  what open ground is made of, so **an open-ground market scene and a coin set are natural
  camouflage for each other.** Six candidate backdrops were generated for CoinShop and **five sat
  inside the coins' band**: a golden common measured **2° from gold**, a terracotta square **1° from
  copper**, and the two pale ones were sat .07–.08 against silver's .09.
  ⚠️ **The first correction made it worse.** Told "the ground is too washed out", I regenerated with
  richly-tinted warm ground — which moved the collision from silver to gold and copper. **Saturating
  a ground does not separate it; only moving it out of the object's hue family does.**
  ⚠️ **And the check that settled it was MILO, not the coins.** He measures **hue 30° / sat 0.53** —
  inside the same band — so those warm grounds camouflaged the CHARACTER too, which is worse than
  losing a coin. Green ground (72–90°) clears him and every coin at once, which is why the shipped
  scenes are green. **The one warm exception, `beach_sand`, works by a SATURATION gap** (0.27 against
  Milo's 0.53), not a hue one. So the rule is: **separation in hue OR in saturation — never neither
  — measured against every sprite that stands on it, the character included.**
- ⚠️ **WHEN NEITHER SIDE CAN MOVE, SEPARATE ON BRIGHTNESS.** The palette rule says hue OR saturation,
  and there is a case it does not cover: a chapter where every scene is a food shop (warm) and every
  object is a food (warm). Measured over the band the whole occupies, **five of SliceShop's ten
  treats sat inside their own scene's hue with no saturation gap either** — loaf Δhue 10° Δsat 0.01,
  orange Δhue 3°, cheese Δhue 10°, wafer Δsat 0.07, cake Δsat 0.08. A bakery is warm and a loaf is
  tan; recolouring either is a lie. So the separation went on the third axis — a **soft dark pool
  under the whole**, value 0.15 against treats at 0.66–0.97, which clears all ten at once.
  ⚠️ **And it fades to NOTHING at its own edges**, per BlockYard, or it is the fifth slab this repo
  has painted over a scene. ⚠️ **Size it by a negative `inset` on a shrink-to-fit wrapper, not by
  numbers** — given the board's maximum it drew a large dark stain under a tray that starts empty.
- ⚠️ **AND BECAUSE THE HUE IS THE FREE AXIS, IT IS THE ONE THAT SHOULD VARY PER ROUND.** "The scene
  changes across the run" had only ever meant the BACKDROP; the manipulative itself was identical in
  round 10 and round 1. BlockYard now carries a material per slot — clay · slate · teal · plum · rose
  · indigo — all sharing ONE saturation and ONE brightness and differing only in hue, so every set
  sits in the band by construction and no single colour can drift out of it. Derive the light and
  dark faces from the base rather than typing eighteen hex values that rot one at a time.
  **Gate it against the SCENE**: measure each backdrop's dominant hue across the band the objects
  occupy (saturation-weighted, so grey paths do not drag the mean) and assert a minimum separation —
  45° here. That makes the camouflage fault above impossible to reintroduce, and it caught a planted
  clay-on-`town_street` pairing at 17.9°.
- ⚠️ **A DECORATIVE LINE MUST NOT RUN THE SAME WAY AS A COUNTING MARK.** A base-ten rod's ten units
  are HORIZONTAL seams, so a horizontal grain line on a block is an eleventh unit as far as a child
  counting it is concerned. The grain runs vertically. Generalise: before adding surface texture to
  anything countable, ask which axis already carries meaning.
- ⚠️ **A SET THAT IS "NOT PLACED YET" NEEDS A DEPTH CUE, OR IT IS JUST MORE OF THE ROW.** Ten blocks
  placed and four waiting, at one size on one baseline, measured on screen as ONE row of fourteen —
  and the argument the whole chapter turns on (*ten fit, the eleventh does not*) went with it. The
  waiting pile stands further back: higher, smaller, and less tidily stacked. Same cue a painted
  scene uses for anything that is somewhere else.
- ⚠️ **AND A MANIPULATIVE MAY NOT LIE ABOUT ITS OWN PROPORTIONS.** A base-ten rod that clears the
  prompt by being drawn at 0.55 of unit scale stands five and a half cubes high beside the cubes it
  is made of — so a child laying one against the ones reads the wrong number off it. That is worse
  than any look problem: the whole reason to use blocks is that the relationship is there to be
  MEASURED rather than asserted. **Fix it by deriving the UNIT from the room available, never by
  scaling one part of the set against another.** The gate asserts `rod === 10 × cube` at every frame.
- ⚠️ **WHEN A LAYOUT AND SOME PROSE FIGHT OVER THE SAME HEIGHT, MOVE THE PROSE SIDEWAYS.** The doc's
  standing rule is to buy height from the chrome and the visual, never from the prose — but there is
  a third option it did not name: on a short frame BlockYard's banner sits over the LEFT of the yard,
  where the things are one unit tall, instead of over the column that needs the full drop. Measured
  at 640×320 that is the difference between a 10px unit and a 15px one, at no cost to the words.
- ⚠️ **THE SPEAKER SHOULD BE THE ONE SPEAKING: PUT THE QUESTION IN A BUBBLE AT ITS MOUTH.** CoinShop
  spread one question across three places and none of them was the character — a banner pinned to the
  top of the frame, an A-board standing on the grass with the goods and the price, and a cloth for the
  coins — so the stallholder, the only one with anything to say, said nothing, and the empty ground
  filled up with loose furniture. A bubble anchored to the mouth is one question region, it is
  self-labelling (you can see WHO is asking), and it uses the empty half of the frame for something
  that belongs there. Carry a `lead` inside it so the price stays put while the text changes: a wrong
  answer must not take the question away with it.
  ⚠️ **AND THE SPEAKER MUST BE ON SCREEN WHENEVER THE BUBBLE IS.** A bubble has a TAIL, and a tail
  pointing at an empty corner is worse than no tail at all: it says the words belong to somebody who
  is not there, which is a stranger effect than a plain banner. TickTock rendered Milo for the intro
  and the play beats and not for the four lesson beats — the one stretch that is nothing but him
  talking. If a phase shows the bubble, it shows the character.
  ⚠️ **A BAND, NOT A FLOATING PANEL.** Anchored freely at the mouth, TickTock's bubble ran straight
  across the clock at 640 wide — the two things a child has to read at once, stacked on each other.
  Laid out as a band (chrome · bubble · world · controls) an overlap is not expressible, and the tail
  still does the anchoring. **And cap its width on a roomy frame**: full-bleed it reads as a banner
  pinned to the top rather than as something anybody said.
  ⚠️ Two consequences. **The words become that character's** — an instruction written for a narrator
  reads wrong the moment a shopkeeper says it, and one naming furniture you have since deleted
  ("count it onto the cloth") is the header-comment fault in miniature. And **CLAMP the bubble below
  the chrome**: on a short frame the scene is scaled up to bring its ground down, so the speaker
  rides high — measured, three of six mouths land at or above y = 0 at 640×320, and a bubble pinned
  to a cropped-away mouth is worse than one sitting a little low with its tail pointing the right way.
- ⚠️ **AND THE BAND THE CONTROLS RESERVE IS PER ROUND TYPE, NOT PER CHAPTER.** A one-row card wants
  far less height than a two-row number pad. Handing the scene the larger band on every round pushed
  the ground line up, which pushed the scale up, which **cropped the stallholder's head off a 640×320
  frame** — the frame is only ever short of the height it is actually asked for, so ask for the real
  number.
- ⚠️ **A RECEIVER MUST READ AT ITS CLEAREST WHEN IT IS EMPTY, BECAUSE THAT IS WHEN IT CARRIES THE
  WHOLE QUESTION.** The instinct is to fade the thing with nothing in it — The Supply Run passed a
  `dim` flag on an empty slot — and it is backwards: an empty receiver is *where the units are going*,
  and on screen two empty kits at `pitch × 0.42` were faint scratches on a wooden bench, so there was
  no telling what the dealing was FOR. Posts tall enough to read as an open-topped bin, a base with a
  light rim, and no fade at all. (The full-to-empty contrast then comes free from the units.)
- **A GROUPING DEVICE MUST BE PART OF THE WORLD.** A rounded rectangle with a stroke and a pale fill
  is a UI card, and laid over a painted forest that is exactly what it looks like — a pane of glass
  with birds behind it. The same job is done by a translucent warm-dark patch with light on its rim
  and a contact shadow under it: still unmistakably one group, but a pen rather than a panel. ⚠️ And
  the fill has to be SEEN — dropped too low it leaves only the rim, which is the empty-outline
  wireframe fault in a new costume. ⚠️ **This recurred in BlockYard at .34 alpha**: the packing
  bench was present in the DOM and absent on the screen, and the pieces on it had nothing to read
  against over a busy backdrop. **A WORKING SURFACE — one the child manipulates things on — wants
  an opaque-ish gradient (.9+), not a wash.** The scene is already established by the backdrop; the
  patch's job is to hold the objects, not to hint at itself.
  `farm_barnyard.png` (grass from 52%), `garden.png` (55%) and `garden_meadow.png` are the safe ones.
- **Fliers are exempt** — being off the ground is correct for a butterfly, which is why a sky band
  that would be wrong for a rabbit is right for them. Check a creature's locomotion in
  [world1.tsx](../src/features/chapters/story/world1.tsx) (`LOCO` / `CRAWLERS`) before assigning it
  a band. A ladybug is a CRAWLER, not a flier.
- ⚠️ **AND A FLIER NEEDS A PLAIN BAND AT HOVERING HEIGHT, WHICH IS A SECOND, DIFFERENT CHECK.**
  Getting a butterfly off the ground is only half of it: it then has to be VISIBLE where it now is,
  and a group the child cannot pick out is a wrong answer the chapter caused. HopAlong put its
  butterflies at Milo's head over `garden.png` — whose flower bed and fence sit exactly there — and
  they vanished into it. Measure the pixel variation across the hovering band (mean per-channel σ)
  the same way you measure the horizon: `garden_meadow` **22** (open sky, reads cleanly) ·
  `garden_park` **46** · `garden` **71** (a butterfly disappears). **Cast fliers where the sky is**;
  the lift is not the thing to tune. Ground creatures are unaffected — they stand on the grass below
  the busy band.
- ⚠️ **STYLE AND PALETTE ARE TWO SEPARATE CHECKS, AND PASSING ONE PROVES NOTHING ABOUT THE OTHER.**
  `cart.png` has brushwork and no ink outlines, so it passes the style check above — and it is the
  most saturated and the darkest thing on a pale pastel farm, which reads as pasted on just as
  loudly. Measure mean saturation and brightness over the OPAQUE pixels and compare to the
  backdrop's band, not to your impression of the brushwork:

  | | saturation | brightness | dark outline |
  |---|---|---|---|
  | painted backdrops | 0.33–0.42 | 0.71–0.85 | ~0% |
  | sprites that blend | 0.42–0.66 | 0.70–0.90 | 1.6–4% |
  | `cart.png` (rejected) | **0.676** | **0.615** | 4.6% |
  | `train_car.png` (flat vector) | 0.702 | 0.623 | 19.4% |

  A prop that lands outside the sprite band is either re-coloured, drawn in code where you own the
  palette, or replaced.
- ⚠️ **THE ONE-SIZE-BAND RULE IS FOR A SET A CHILD HAS TO COUNT; BACKGROUND LIFE WANTS THE SCALE
  TABLE INSTEAD.** BlockYard cast only creatures in one band because its cast was the thing being
  counted, and a countable ant cannot be honestly sized beside a pony. CoinShop's shoppers are not
  counted — they are the market being a market — so rabbit · duck · squirrel · lamb · duckling ·
  chick are drawn at 0.65–1.15 of a shared base, which is what `Kind.scale` is for. Ask which of the
  two a set is before picking the tool.
- ⚠️ **AND THE SAME RANKING APPLIES BETWEEN A CHARACTER AND A VEHICLE OR MACHINE — GET IT BACKWARDS
  AND THE BIG THING READS AS A TOY.** RailLine drew Milo at 0.30 of the height and the locomotive at
  0.155, so a tank engine stood half the height of a pony; the founder's first word about it was that
  the train needed to be bigger. They are at much the same depth (he stands beside the track, not in
  the far foreground), so there is no perspective to justify the inversion — the ranks were simply
  swapped. **Whatever is physically bigger is drawn bigger, and a sweep can assert it** (`trainH >
  miloH`) rather than leaving it to whoever picks the next constant. Then check what the new size
  now covers: a taller engine reached up into both the name boards and the halfway post, which is
  the one hint a wrong answer gives, so the posts had to out-reach it.
- ⚠️ **SIZE THE CAST SO THE CREATURES AGREE WITH EACH OTHER AND WITH MILO.** `Kind.scale` in
  critters.tsx exists for this and says so — *"a ladybug drawn the same height as a rabbit is its own
  kind of doesn't-belong"* — and BlockYard's second pass drew every creature at one height, so an ANT
  came out the size of a LAMB beside a pony. Where a chapter needs its cast COUNTABLE, the cleaner
  answer than a scale table is to cast only creatures that live in ONE size band: a countable ant
  cannot be honestly sized next to Milo, so it is simply not in that chapter.
- ⚠️ **A "GONE" REGION MUST READ AS AN ABSENCE, NEVER AS A FILL — this is the pie-chart fault arriving
  through the *state* rather than through the geometry.** The Pizza Counter clips a real pizza sprite
  by the exact wedge, which is the rule above obeyed; it then painted the TAKEN slices with a
  translucent accent, and on screen that reads as a shaded sector — i.e. exactly the pie chart the
  clipping exists to escape, and worse it is **ambiguous**: a child cannot tell whether the coloured
  part or the food part is "the amount". Draw NOTHING over what is gone and let the surface underneath
  (a plate, a board, the ground) show through, because that is what a missing piece actually looks
  like; if the amount needs marking, mark its EDGE with a line and never its area. And make that
  surface visible against the panel behind it — an absence you cannot see is one you cannot compare.
- **The background must match its objects** — orchard↔apples, pond↔fish, kitchen↔cookies. Where a
  world's backdrops are object-specific, pair the backdrop TO the item so a scene never shows the
  wrong object.
- **No storytelling repeats within an age group.** Two chapters may reuse an object, but then their
  worlds must differ (different backdrops AND a different object list).

### A code-drawn 3D scene

**Moved → [chapter-craft-art.md](chapter-craft-art.md).** Lighting, shadows, ground geometry, palette and tone-mapping for the one 3D chapter. Read it before touching that scene.

### ⚠️ A separation rule judged on two axes must be judged PER TONE

If a check says *"clears on hue OR on value"*, it must ask that of **each** tone. Minimising the two
axes independently across the whole world — `min(hue) >= 45 || min(value) >= 0.18` — is a different
and much stronger claim: *every* tone clears on hue, or *every* tone clears on value. The winning hue
then comes from one prop and the winning value from another, and the check reports a failure
(`hue 6° value 0.06`) describing two unrelated objects on a palette where a per-tone sweep finds
nothing wrong at all. It is *sound* — strictly stricter, so it can never pass something unreadable —
and it is useless, because it silently re-imposes exactly the narrow palette the rule was rewritten to
escape. Find the tone closest to failing and report ITS pair, so the numbers in the message describe
one real object.

### ⚠️ A guarantee that only holds for the seeds you swept is luck, not construction

The gate had always asserted *no three props collinear and equally spaced* — a real rule, because
three objects in a line at an even pitch is a ruler. Nothing in the generator **enforced** it; it
merely happened to hold for the 400 seeds the suite drives. Adding one extra `r()` call per prop (for
a rotation) shifted every downstream position, and a triple came out at 0.069 m of spacing difference
against a 0.35 m floor immediately. **The check caught it, and the property had never been real.**
Any invariant a random generator satisfies by luck will break the first time anyone changes how many
numbers get drawn — which is a change nobody thinks of as risky. Enforce it in the generator (reject
and nudge, deterministically off the same seeded stream) and keep the gate asserting the outcome.

### Generating new art

**Moved → [chapter-craft-art.md](chapter-craft-art.md).** The walk-cycle pipeline (generate → video → chroma key → sheet), the line-art pipeline, reference-image rules, and every gotcha each has cost. Read it before generating anything.

---

## 3. Voice

### Pacing and synchrony

- **One `speakSteps` drives BOTH the words and the visuals in a demo or re-teach.** Never a fixed
  timer for the visuals plus separate `speak()` calls — they drift on Safari and cut each other off
  on Chrome. When audio is blocked, `speakSteps` still paces the steps on a timer, so the demo works
  silently.
- ⚠️ **AND `speakSteps` REVEALS EACH VISUAL FROM THE UTTERANCE'S `onstart`, WHICH MEANS THE TEACHING
  ONLY HAPPENS IF SPEECH KEEPS DELIVERING EVENTS.** Chrome and Safari both start the first line and
  then silently drop the rest — no `onstart`, no `onend`, no `onerror` — and when they do, the sequence
  marches to its end on its per-line watchdogs while `onStep` never fires again. Every visual, every
  line of text and any "your turn" flag set inside a step is then **frozen at the last line that
  happened to speak, for ever.** TickTock shipped exactly this: the founder sat on the third lesson
  beat's last sentence with no control on screen and no way forward, on a machine that has a voice.
  **A multi-beat lesson or re-teach must be self-paced** — dwell per line derived from its own length,
  `speak()` fired alongside — so the words can fail, half-fail or succeed without the teaching stopping.
  MeasureIt made this call first for the mirror-image failure (racing past in 4s); it is the same fix.
- ⚠️ **AND DO NOT PUT A FIXED TOTAL CAP BEHIND `speakSteps` AS A "BACKSTOP" — that is worse than the
  bug.** TickTock's first fix was `lines × 2900 + 4000` ≈ 15.6s for four lines; with a real voice those
  lines take about twenty seconds, so the cap fired MID-SENTENCE and cancelled a live utterance.
  **A backstop timed against the silent fallback is not timed against the thing it is backing up** —
  and the preview pane has no voice, so every run I drove took the fallback path and finished inside
  the cap, which is why I could not see any of it. If you must have a watchdog, make it reset on
  progress (an idle timer), never a total budget.
- **EXCEPT when the steps are single WORDS — those are self-paced on a deterministic timer.**
  `speakSteps` advances on each utterance's `end`, and a device with no usable voice ends a
  one-word utterance in milliseconds, so a counting demo ("one… two… three") races past instead of
  falling through to the timer fallback. Measured in the measurement chapter: both demos AND the
  guided round arrived inside four seconds. Lay the steps on your own timer and `speak()` alongside
  — the colour and shape showcases already do, and it is the same reason. Sentences are fine on
  `speakSteps`; single words are not.
- Never fire rapid consecutive `speak()` calls; each cancels the last.
- Demos are deliberately slow: `rate: 0.8`, `gapMs: 1100`, and a slow fallback step when silent.

### Never let two voices overlap

- Never gate a tap on the animation — a child who has already found the next answer should not be
  made to watch the previous journey finish.
- **And do not gate it on `useIsSpeaking()` either.** Measured live in Chrome:
  `speechSynthesis.speaking` stays true for **over 3.2 seconds** after a single spoken digit, and
  the watchdog ceiling that eventually clears it is 6s. In a chapter where one round wants seven
  taps that is half a minute of dead screen. Overlap is already prevented where it actually
  happens: `speak()` cancels the utterance in flight, so a fast run of taps simply speaks the newest
  number — which is the right one to hear anyway.
- A short `tapLock` (~260ms) is enough. Verify it by hammering every answer inside one tick and
  asserting exactly **one** is accepted, then again at ~300ms apart asserting **all** are.

### What Milo says

- **Heard, not read**, when the skill is recognition: the target number is spoken and NEVER written
  in the on-screen prompt, because the child must go sound → glyph.
- `say` and `prompt` are separate channels. `prompt` is what is drawn; `say` is what is spoken, and
  may name things the prompt deliberately omits.
- **No spoken praise on a correct answer** (founder call) — the visual tick already says it landed.
  Wrong answers DO get a warm spoken line; those help.
- Every question names its subject. A label must fit the sentence ("How many Climb?" is the
  canonical failure).

### Recorded clips

- The 12–18 bands play pre-rendered ElevenLabs clips with browser speech as fallback;
  **3–11 has no clips yet** and is on browser TTS, which Chrome often does not provide at all. On a
  silent device a chapter whose target is only spoken is unanswerable — worth remembering when
  designing a heard-not-read chapter.
- All clip playback goes through **ONE reused module-level `<audio>`** unlocked inside a user
  gesture. **Any new `new Audio()` reintroduces the mobile-autoplay bug** where every line silently
  fell back to browser TTS.
- `clipKey()` is shared by the build script and the runtime. If they drift, every lookup misses
  silently.

---

## 4. Verifying it

The founder has caught nearly every real fault by eye, on a screenshot, after the checks passed. So:

- **Measure, don't eyeball.** Assert on `getBoundingClientRect()` / `naturalWidth` — real travel
  distance, real size change, real gaps. "The screen moved" is not evidence.
- **Assert the resulting STATE, never that the UI advanced.** A wrong answer advances too.
- **The preview screenshot lags the DOM — and so does TEXT EXTRACTION.** A frame showing the wrong
  backdrop with creatures missing entirely was pure staleness; a DOM query at the same moment was
  correct. ⚠️ **The same is true of `get_page_text`**, which is easy to trust because it looks like a
  DOM read and is not: on placeValue it returned the previous beat's prompt for seconds after the
  state had moved on, so a mid-trade sample read as *a round wedged on a stale instruction*. **I
  nearly banked "the PACK round dead-ends" twice from it.** Query the live DOM
  (`document.body.innerText`, the button list, `getBoundingClientRect`) inside the page, and re-shoot
  before believing anything alarming.
- ⚠️ **A DISABLED COMMIT BUTTON IS NOT A LIVENESS SIGNAL.** Every chapter here disables its commit
  until the child has actually given an answer, so "Done is disabled" means *nothing has been typed
  yet* far more often than it means *the round never opened*. Polling it as a proxy for "is the
  question live" reports a perfectly healthy round as dead — which is exactly what happened on
  placeValue, where the question had been on screen for some time. **Read the thing you actually
  care about**: the prompt text, or whatever flag the scene gates input on.
- **AN ELEMENT WITH AN ENTRANCE ANIMATION IS A LIE FOR ITS FIRST FEW HUNDRED MS — and a backgrounded
  tab freezes it there indefinitely.** `getBoundingClientRect` includes transforms, so a block
  scaling in from 0.5 measures half its real size, and a screenshot catches it translated and
  half-faded. Both happened in one session on the measurement chapter and both read as real bugs
  (blocks the wrong size; blocks hidden behind the controls). CSS animations are throttled in a
  background tab exactly like `rAF` and `setTimeout`, so "wait longer" is not enough — front the tab,
  then wait, then measure.
- **The console buffer survives navigation.** After a rename you will see a wall of
  `Module not found` from the stale buffer. Open a fresh tab before believing it. This repo has lost
  three sessions to that. ⚠️ **It recurs verbatim for a constant used one edit before it is imported**
  — TickTock produced a `CHROME_PAD is not defined` crash inside the error boundary while `tsc` was
  clean, and a fresh tab read **zero**. `tsc` clean + console angry = suspect the buffer first.
- ⚠️ **TO SETTLE WHETHER AN ARTEFACT IS THE SPRITE OR THE SCENE, HIDE THE SCENE.** A brown streak
  beside Milo read unmistakably as sprite bleed from the next cell of his strip. Three theories were
  wrong in a row — the cell maths, the `overflow` clip, the drop-shadow — and each was disproved by a
  measurement that then suggested the next one. `visibility:hidden` on the backdrops settled it in one
  shot: he was clean, and the streak was a tree root painted into `door_houses.jpeg` that he happened
  to stand in front of. **Your EYE grouped them; the DOM never did.** Isolate one layer at a time
  before theorising about either.
  *(For the record, the honest way to check a strip is still the craft rule above — draw it into a
  canvas and print each cell's alpha bbox. That took thirty seconds and said the sprite was fine.)*
- **`elementFromPoint` cannot see `pointerEvents:none` elements** — it looks straight through
  sprites. Overlap and draw-order checks have to be visual or geometric. Where a tap is the mechanic,
  it is also the only honest way to prove a control is reachable: use it to check that the thing
  under the finger is the thing you expect.
- **A full-width overlay lying across the play surface must be `pointerEvents:none`.** The prompt
  banner spans the screen and is mostly transparent, and left tappable it carves a dead stripe
  through the picture — the colouring chapter's sky could not be tapped where the banner crossed it.
  Give the class the passthrough and its real buttons their events back
  (`.x{pointer-events:none} .x button{pointer-events:auto}`).
- **Never bump a React `key` to restart an animation.** It remounts the subtree, and anything
  imperative in there — a canvas, a scroll position, a media element — is destroyed with it. In the
  colouring chapter one wrong answer wiped every colour the child had put down. Use
  `el.animate(...)`, which retriggers without touching the DOM.
- ⚠️ **`getBoundingClientRect` ON A SPRITE-SHEET `<img>` RETURNS THE WHOLE STRIP, NOT THE CREATURE.**
  A 12-cell sheet measures 12 cells wide and is translated inside an overflow-hidden cell, so its
  `bottom` is not where the feet are and its `left` is off-frame by design. Measure the **clipping
  cell** (the sprite's parent), which is one cell wide and lands exactly on the ground line — that is
  what proved Astro's feet at 549 against a painted walkway at 549. Reading the strip instead reports
  a float that is not there.
- ⚠️ **A SCRIPTED RENAME EDITS PROSE AS WELL AS CODE, AND THE PROSE IS WHERE IT SHOWS.** Renaming a
  world with word-boundary regexes (`LINE`→`RUN`, `stop`→`site`) is safe for identifiers and produces
  garbage in comments — *"the number RUN"*, *"a train cannot site between checks"*, *"a branch-line
  runner"*. Assert each rule's substitution count so a silent no-op cannot pass as a rename, then
  **read the file afterwards**: the counts prove the edit landed, not that it says anything.
- ⚠️ **AND THE MIRROR IMAGE OF THAT: A PER-ROUND ANIMATION IN A REUSED COMPONENT NEEDS AN EXPLICIT
  RESET, OR IT PLAYS ONCE AND NEVER AGAIN.** React reconciles a sprite across rounds — same
  component, same position, same key — so the element is REUSED and any "have I arrived yet" state
  survives into the next round. SeesawPark's walk-on therefore played on round 1 and was dead for
  rounds 2–10. **This is invisible to a single check**: you look once, the animation works, you move
  on. Take a `resetKey` that changes per round and drive the state off it in an effect. Caught only
  by arming a `MutationObserver` and finding it logged **zero** mounts on a new round — if you are
  verifying an animation, verify it on the SECOND round, never the first.
- **A re-teach runs AFTER the round was submitted**, and a round is submitted when the child finally
  gets it right — so anything the re-teach applies has ALREADY been applied. Bead Shop threaded a
  second copy of the same bead and broke its own repeating pattern; caught by reading the strand back
  as `RBRBBB|RBBBRBR`. A demo must place; a re-teach must only demonstrate.
- ⚠️ **STATE KEPT IN TWO PLACES DESYNCS THE MOMENT TAPS ARE BATCHED — AND CHILDREN DO BATCH THEM.**
  A MAKE round kept a stack of what had been placed alongside the room itself; three "back" taps
  inside one React batch all read the SAME stale stack, so all three removed a one and the tens were
  left standing. The fix is not a lock: **derive the undo from what is on screen**, which is also
  the only thing the child can reason about. Ones come off before tens — predictable without
  remembering an order. Generalise: if two pieces of state must always agree, keep one.
  (And read the new value in an effect, not in the handler that caused it — a tap handler cannot see
  what its own tap produced, so a batched pair announces the wrong count.)
- ⚠️ **A SHORT FRAME MAY HAVE ONLY ONE QUESTION REGION.** The target for a build-it round first sat
  in its own card above the bench; measured at 640×320 it landed at y 234–274 against controls
  starting at 250 — **on the tap targets.** Every other slot was already taken (chrome, the shelf,
  Milo). There was no second place to put it, so it moved INSIDE the prompt pill. When a short frame
  has nowhere to put a second element, that is the answer: there is only one, and both things belong
  in it. It reads better too — one thing to look at instead of two.
- ⚠️ **AND THE MIRROR REF HAS TO COVER *EVERY* PIECE OF STATE THE HANDLER READS, NOT JUST THE
  OBVIOUS ONE.** The Fundraiser mirrored the entered digits and left the ACTIVE BOX in plain state,
  so a child typing 8-0-5-4 fast enough to land inside one React batch wrote all four digits into
  box 0 — `setActive(a => a + 1)` being functional does not save it, because the STATE advances
  correctly and the closure the next tap runs is still the old one. Sixth time this repo has met the
  shape. Ask what else that handler reads.
- ⚠️ **AND REACT DOES NOT FLUSH INSIDE YOUR DRIVING STATEMENT, which makes a working app look
  broken twice over.** Clicking and then reading the DOM in the same `javascript_exec` call reports
  the PREVIOUS render — so a correct answer reads as "nothing happened" — and worse, a control whose
  `disabled` is state-driven is still disabled at the moment your next click lands, so a commit
  driven in the same statement is silently swallowed. Both read exactly like a dead button. **One
  gesture per call, and read in the call after.**
- **Two taps in the same tick are a TEST artefact, not a user.** React commits state between events,
  so a `ref` mirrored during render is still stale if the script picks a colour and taps the page in
  one synchronous statement. Cost half an hour of chasing a fill that was never broken.
  ⚠️ **And the same tick cannot READ what it just did either.** A commit button whose `disabled`
  comes from state is still disabled in the DOM at the moment of a same-tick click, so the click is
  swallowed and the driver reports "the commit does nothing". Reading `btn.disabled` immediately
  after a tap reports the PREVIOUS render for the same reason. Both are the instrument; drive one
  gesture per call and read in the next.
- ⚠️ **`getComputedStyle` DURING A TRANSITION RETURNS THE INTERPOLATED VALUE, NOT THE TARGET.** A
  `MutationObserver` on `style` is the right way to catch a journey in a throttled pane — but if the
  handler reads the computed value it fires at the instant the transition STARTS and reports the
  start position, so a working journey looks like a no-op. Read `el.style.left` (the inline value)
  for what the code asked for, and the computed value only to prove it has not already jumped there.
  RailLine's train logged `inline 788.28px / computed 185px` in one sample, which is exactly the pair
  that proves it travels rather than teleports.
- ⚠️ **A SEPARATION GATE PROVES TWO THINGS ARE DISTINGUISHABLE — NOT THAT A SCENE HAS ANY COLOUR IN
  IT.** The Empty Plot's 70 tests were green before a look-and-feel pass and green after it, and that
  is correct: every fault was either inside the scene component (lighting, shadows, materials, camera)
  or was a palette the check *legitimately* passed. `plotSiteSeparation` asserts the unit clears the
  world, which is a real and necessary claim and is a different claim from "this world is not grey".
  **Know which one your gate makes**, and do not read a green palette check as evidence about how a
  scene looks. That part still needs an eye.
- ⚠️ **A GATE THAT RE-IMPLEMENTS A RULE CANNOT SEE THE RULE BEING REMOVED.** This is the same fault
  as "a gate that reads a chapter's DATA cannot see how it INDEXES it", one level down, and it bit
  twice in one session. A check written as `expect(Math.min(waiting, CAP)).toBeLessThanOrEqual(CAP)`
  is a tautology — it tests the test. Delete the cap from the *scene* and it still passes. Put the
  rule behind an exported function the scene actually calls (`chuteShown(n)`) and drive that.
  Anything the gate computes for itself is a second copy that can agree with nothing.
- ⚠️ **A RELATIONSHIP THAT MAY NOT VARY SHOULD NOT BE EXPRESSIBLE TWICE.** A supply tray drew a
  "ten" at 2.4 units beside a one-cube — the 0.55 lie again, in a component the gate was not looking
  at — because the multiplier was free to write at the call site. `blockSet(cube)` is now the only
  place in the app that derives a rod from a cube, so no caller *can* get it wrong. Prefer making a
  fault unwritable over adding a check for it.
- ⚠️ **ASSERT ON A RATIO, NOT ON A SAMPLE OF IT.** A gate drew 600 rounds and checked the observed
  share of a question type against 0.4, when the true ratio was 3/7 = 0.4286 — 1.4 SD out, so it
  **failed about one run in thirteen.** A flaky gate is worse than no gate, because people learn to
  re-run it instead of reading it. If the claim is about a fixed pool, export the pool and assert on
  it; sample only what is genuinely a property of the draw, and leave a margin noise cannot reach.
- ⚠️ **AND THE SPRITE SIDE OF THAT IS THE SAME FAULT: A MULTI-COLOUR CHARACTER IS NOT ONE HUE.**
  The camouflage gate modelled Milo as the saturation-weighted mean of his opaque pixels, 30°.
  Histogrammed, he is trimodal — **52% orange 15–30°, 17% olive 45–60°, 16% teal 180–195°** — so the
  mean lands on a colour barely present and, worse, is dragged toward the olive, which is itself the
  part that camouflages. Check against the DOMINANT cluster. ⚠️ **And when you fix an instrument,
  re-derive the threshold rather than carrying the old number across**: the old 40° was calibrated
  against a different reference AND a different sample region, so keeping it would have been the
  arbitrary choice. State both populations under the new instrument and put the line between them.
- ⚠️ **A CHECK THAT COMPARES A VALUE WITH ITSELF IS THE TAUTOLOGY'S QUIETEST FORM, AND IT LOOKS LIKE
  DILIGENCE.** *"A miss line does not narrow with the guess"* was written as `for (const n of
  padChoices()) expect(missFor(r)).toBe(first)` — and `missFor` does not TAKE the guess, so it swept
  ten values and compared one string with itself ten times. The lint's unused-variable warning is what
  found it. **If a loop variable is unused inside the assertion, the loop is decoration.** The real
  property was one level up: two different rounds of the same TYPE must say the same words, which is
  what stops the wording drifting toward this round's own figures.
- ⚠️ **A BOUND NAMED IN A REDIRECT BECOMES THE ANSWER ON THE ROUNDS WHERE THE BOUND *IS* THE ANSWER.**
  *"That pizza only has 6 slices, try a smaller number"* is a helpful nudge until an `op` round ends
  with the whole pizza gone — then it hands the answer to the child who has just overshot, i.e. the
  one least able to ignore it. Sweep a redirect's text against the accepted answer exactly as you
  sweep the miss line; state the direction, not the figure.
- ⚠️⚠️ **THE MARK THAT STATES THE ANSWER CAN BE DRAWN OFF THE THING IT STATES, AND AN SVG ANCHORED BY
`bottom` ON A ZERO-HEIGHT CONTAINER IS HOW.** An angle's arc and its square-corner guide both hung off
the turning vertex; the container has no height, so `bottom: -20` resolves 20px below its TOP, and the
arc's centre — written at svg-local `(20 + arcR, 20 + arcR)` — landed at `(vx + arcR, vy − arcR)`, a
full radius up and right of the angle it measures. The guide had the matching fault: its upright was
right and its horizontal arm ran along the svg's top edge, a whole `size` above the beam it is meant
to lie on. **Both had shipped, and both are invisible to every band, layer and type check** — the
elements are present, sized correctly, and in the right region of the screen. Work the anchor
arithmetic through to an absolute coordinate and check it equals the vertex; or draw from the corner
the anchor actually pins.

⚠️ **A `toContain('{ANCHOR}')` ALSO MATCHES `${ANCHOR}`, SO A SOURCE CHECK FOR A JSX EXPRESSION PASSES
ON A TEMPLATE STRING SOMEWHERE ELSE ENTIRELY.** Deleting the anchor from a briefing card walked
straight through a green gate because the demo's narration still interpolated it. Same family as
`alt={` matching `x_alt={`: **anchor a source pattern on something only the real thing has**, and
count the matches.

⚠️ **A `toMatch` OVER SOMETHING THAT APPEARS TWICE PROVES ONLY THAT IT APPEARS ONCE — COUNT IT.**
  An intro card has two bodies, one per input, and a check that the anchor is on the card matched the
  tap body while the camera body had lost it. Caught by mutation, not by reading. Wherever a rule has
  to hold in N places, assert N.
- ⚠️ **AND THE COST OF THE ANCHOR IS PAID IN LAYOUT.** A simile spent as a whole sentence took the
  explore card from two lines to three at 640×320 and pushed the bench 15px into the button below it
  — the anchor breaking the very rule (*a good question is TALLER than a bad one*) that the reserved
  bands exist for. The briefing card states it in full; everywhere else it is a clause, and you
  re-measure the card afterwards.
- ⚠️ **A GATE'S OWN PROSE CAN TRIP ITS OWN REGEX.** A source check forbidding `transition: left`
  matched the comment explaining why it forbids it, and reported the file it was written for.
  Anchor a source pattern on something only real code has — here, the quote that must follow the
  colon in a style object.
- ⚠️ **A HUE CHECK ON A BIMODAL SCENE MUST TEST EVERY STRONG HUE, NOT THE MEAN.** BlockYard's
  camouflage gate takes a saturation-weighted mean of the band — which on a cream-and-mint counter
  returns ~45°, **a hue that is nowhere in the picture**, and would happily allow a 160° set to sit
  invisibly on 16% of it. Histogram the band and require clearance from every bucket carrying more
  than a few percent. (Re-measured under that rule, `town_park + teal` in BlockYard comes out at
  43° against a 45° threshold — marginal, not fixed, and recorded here rather than silently patched.)
- Sweep the size matrix with a script, not by hand: widths × heights × question counts × every
  creature. Chapter 2's layout is 330 combinations and the script is what made the last pass clean.
- ⚠️ **A COLLISION SWEEP MUST ENUMERATE PAIRS, NOT CHECK THE ONE ELEMENT YOU HAD IN MIND AGAINST THE
  NEIGHBOURS YOU HAPPENED TO REMEMBER.** FitOut's short-landscape sweep checked frame↔bubble,
  frame↔pad, frame↔chrome and frame↔edges — every pair containing the frame, because the frame was
  what I was thinking about. It never checked **bubble↔pad**, and at 640×320 the answer pad's two
  digit windows are drawn **108 × 33 px on top of Milo's speech bubble**, both windows fully inside
  the bubble's span, obscuring the words behind the number the child is entering. Measured live; it
  had shipped. Take the list of fixed layers a chapter draws (here: chrome · banner · tally · frame ·
  bubble · pad) and cross it with itself — it is a dozen comparisons and it does not depend on
  remembering which collision to look for.
- ⚠️ **MEASURE WITH THE GATE'S OWN HARNESS, NOT A FRESH ONE WRITTEN BESIDE IT.** Tuning `ASPECT_PULL`,
  a standalone script said 0.25 was the peak and that the 1 collapsed at 0.5; run inside vitest
  against the gate's own forms and generator, **neither number held** — the real peak was 0.6 and the
  1 was never in danger. Two harnesses disagreeing means one is lying and nothing tells you which, so
  a constant tuned against the throwaway is tuned against nothing. Add a temporary `it()` that writes
  the numbers out (`console.log` is swallowed — append to a file) and delete it after.
- ⚠️ **A SWEEP OVER A CLAMPED MAPPING'S FULL DOMAIN IS A TAUTOLOGY, AND IT LOOKS LIKE A REAL CHECK.**
  `handPoint` clamps, so frame x = 0 lands on screen x = 0 whatever the reach is — a test that swept
  0..1 and asserted "every column is hit by some hand position" passed for **any** value of the
  constant it existed to guard, including one that makes the outer columns unreachable in practice.
  It was written first and caught only by mutating `REACH` and watching nothing happen. **Sweep the
  band the child can actually get to, so a target reachable ONLY via the clamp fails.** Generalise:
  whenever a function saturates, ask what your sweep proves about the region past the saturation —
  usually nothing.
- **The sweep must call the SAME layout function the scene renders from.** Chapter 4's sweep
  re-implements its sizing chain inside the test, so the check can agree with its own copy of the
  constants while the screen it protects falls apart. Chapters 9–10 export `playLayout` and the test
  imports it; do that instead.
- ⚠️ **AND THE SAME IS TRUE OF THE EDIT ITSELF — `tsc` CLEAN ON A FILE THAT WAS NEVER WRITTEN PROVES
  NOTHING.** A heredoc writing a smoke-test file was silently refused twice; `npx tsc --noEmit` then
  returned exit 0 and I read it as "the new library's API compiles". It compiled *nothing*. One `ls`
  on the file settled it. Whenever a green result would be the same green if your change had not
  landed, check the change landed first — this is the mutation rule applied to ordinary work.
- ⚠️ **A MUTATION THAT "PASSES" IS GUILTY UNTIL YOU HAVE PROVEN THE MUTATION LANDED.** A planted
  regression reported the gate as blind; the `sed` that planted it had silently matched nothing, so
  the gate was never actually tested. Re-planted with a tool that reports its own substitution count,
  it failed the gate immediately. **Assert on the edit before you conclude anything about the check**
  — same family as "a sweep that flags everything is a broken sweep, not a discovery".
- ⚠️ **MUTATE THE SOURCE, NEVER THE ASSERTION.** Changing a constant inside the TEST to watch it fail
  proves only that the test can fail — it says nothing about whether the check is wired to the thing
  it guards. I did exactly that to "prove" a control-row-fit check, and the real defect walked through
  it: the check carried its own copy of `vw * 0.34`, so widening the real control back to the value
  that overflowed left the gate perfectly green. Same family as *a gate that re-implements a rule
  cannot see the rule being removed*, and mutating the source is how you catch it.
- ⚠️ **RE-RUN THE MUTATIONS AGAINST THE FINAL CODE, NOT ONLY AS YOU GO.** A suite run mid-build tests
  a shape that no longer exists by the end. The final pass on the sweep detector found two holes the
  intermediate runs could not have — one of them a genuine dead button — because each was created by
  a LATER change (a field joining a key; a constant being inlined). A mutation score only means
  anything about the code you actually ship.
- **Mutation-test the gate, and tell an inert mutation from a missed regression.** Of seven planted
  against the chapters 9–10 sweep, five were caught and two passed — and both survivors turned out
  to change no behaviour at all (one constant was shadowed by a tighter one, one cap was covered by
  a second mechanism). "It passed" is only good news once you have checked which of the two it is.
- ⚠️ **A WEBGL / react-three-fiber SCENE CANNOT BOOT AT ALL IN A HIDDEN TAB, AND IT LOOKS EXACTLY
  LIKE A BROKEN SCENE.** r3f refuses to create its renderer until it has MEASURED a non-zero
  container, and it measures with a **ResizeObserver** — whose callbacks are delivered with the
  browser's *rendering steps*, which a backgrounded tab does not run. A container that mounts at its
  final size and never changes gets exactly one RO callback, and in a hidden tab that callback never
  arrives: the canvas sits at its intrinsic **300×150**, `onCreated` never fires, and the screen shows
  nothing but the clear colour. Measured: `document.hidden` true and **0 rAF frames in 1.5s**, in the
  preview pane AND in a background Chrome tab — i.e. every automated drive. The fix is three lines and
  belongs in any 3D chapter: dispatch a synthetic `window.resize` on a `setTimeout` after mount, since
  the measure hook listens for that too and a synthetic event rides the EVENT loop rather than the
  frame loop. Without it, no 3D chapter is verifiable headlessly at all.
  ⚠️ **And even once it boots, movement still needs rAF** — anything driven from `useFrame` advances
  only during the ~40ms a screenshot fronts the tab. So a scene can be verified by eye, and a walking
  loop cannot; put that logic behind exported pure functions and gate it there.
- ⚠️ **Two three.js version traps worth knowing before blaming your scene:** light intensities are
  **physical units since r155**, so the values that used to read as "bright" render a dusk scene
  (`ambientLight 0.85` → near-black; a `hemisphereLight` at ~2 is the outdoor default); and **sprite
  scale is in WORLD units**, so a label sized against a 9-metre object swamps a 3-metre one.
- **`requestAnimationFrame` is frozen while the preview is backgrounded**, so rAF-throttled hooks —
  `useViewport` among them — never see a live `resize`. Resizing the preview and re-measuring
  reports a layout still computed for the OLD size, which looks exactly like a responsive bug.
  Reload at the target size instead of resizing into it. (This burned three separate measurements in
  one session; each time the instrument was wrong and the code was fine.)
- ⚠️ **A VALUE HANDED TO A RENDERER MUST BE CHECKED BY THAT RENDERER, NOT BY A STRING COMPARISON.**
  The single most expensive half-hour of the 3D chapter: a colour helper emitted
  `hsl(100.0 50.0% 40.0%)` — valid CSS Color 4, which every browser reads correctly — and
  **`THREE.Color.setStyle` runs its own regex rather than the CSS engine, returning rgb(255,255,255)
  with no throw and no warning.** The entire world rendered flat white (sky, ground, road, props,
  units) with the geometry plainly there and every HUD element correct, so it read as a lighting bug.
  The gate PASSED, because it asserted `css(...) === 'hsl(100.0 50.0% 40.0%)'` — the string's shape
  instead of the consumer's reading of it. `THREE.Color` is pure maths with no WebGL, so a test can
  import it and parse the real string. Generalise past three.js: **any value crossing into a library
  that parses it — a colour, a duration, a path, a transform — is checked by handing it to that
  library**, and "it is valid according to the spec" is not evidence that your consumer implements the
  spec.
- ⚠️ **A TINTED LIGHT OVERRIDES THE PALETTE YOU GENERATED.** All the hue/saturation separation work in
  the world is computed on MATERIAL colours, and the screen shows material × light — so passing a
  scene's full sky colour to a `hemisphereLight` lit every surface with it and turned a carefully
  low-saturation blue-grey ground into a flat purple void. Keep the light near-neutral, or the check
  upstream means nothing. Same family as the greyscale-sprite rule: the thing you measured is not
  always the thing that gets drawn.
- ⚠️ **A DEV-ONLY DRIVE HOOK IS THE CHEAPEST WAY TO GATE WHAT rAF WILL NOT LET YOU PLAY.** `useFrame`
  advances only while the tab is FRONTED, and a screenshot fronts it for ~40 ms with `dt` capped —
  about 0.45 m of travel per screenshot, which is why cut ③'s peg loop was reached once and never
  played. Three lines exposing the one value the loop owns (`window.__miloPace(n)`), gated on
  `NODE_ENV !== 'production'` exactly like the teen band's `data-test-answer` (proven to
  dead-code-eliminate — 0 hits in `.next/server` and `.next/static`), made the guided round, a wrong
  peg, a right peg, the re-teach and the round advance all drivable. Prefer that to fighting the frame
  loop for an hour. ⚠️ **It still needs a frame to APPLY**, so the order is: set → front the tab
  (screenshot) → then act. Clicking in the same tick reads the pre-frame value and does nothing.
- ⚠️ **A CAMERA THAT LERPS CANNOT BE VERIFIED BY SCREENSHOT — BUT `prefers-reduced-motion` CAN MAKE IT
  SNAP, AND THAT IS THE WAY IN.** At `k = dt × 2.4` with `dt` capped at 0.05 a swing needs ~20 frames,
  i.e. ~20 screenshots, and every shot you get is mid-flight. Any chapter that honours reduced motion
  already has a `k = 1` path: stub `window.matchMedia` so the next mount reads `matches: true`, and the
  shot settles in one frame. **That is a test instrument, not a code change**, and it is how a framing
  this repo had recorded twice as "never seen settled" finally got looked at.
- ⚠️ **AND WHEN YOU DO LOOK AT IT, EXPECT A BUG RATHER THAN A TASTE PROBLEM.** The shot that had never
  been watched was rendering from **eye height instead of the 3.4 m its own comment specified**, because
  a `pos.y = EYE` line sat AFTER the branch that positions the scripted camera and quietly overwrote it.
  Nothing failed: the raised side view had simply never been raised, the tiles it exists to make
  countable were grazing stripes, and the plot sat in the top quarter of the frame with 60% bare
  foreground. **A value forced every frame after a branch overrides whatever that branch just set** —
  and a camera nobody has watched settle is exactly where that hides. Arithmetic said the plot should be
  centred and the pixels said it was not; the pixels were right, as this file keeps recording.
- ⚠️ **`fov` IS VERTICAL. The number to check a character's placement against is the HORIZONTAL
  half-FOV** — at 16:9 that is ~47° for `fov: 62`, not ~31°. And a character standing beside the thing
  being measured has a LATERAL offset that grows with it while a fixed forward distance does not, so
  the angle gets worse exactly where the plot is widest: a placement fine at 2 m sat at 46° (hard
  against the frame edge) at 9 m. Sweep every value the generator can draw rather than the one you had
  in mind — that is how the third wrong placement was caught after two had already been "fixed".
- ⚠️ **A LAYOUT NUMBER NAMES ONE PART; THE COMPONENT USUALLY RENDERS SEVERAL.** `postH` is a
  checkpoint's STALK, and `CheckPost` draws a column of LABEL-then-stalk anchored at the path — so the
  answer surface begins another `boardH` (28px at 640×320) above `pathPx - postH`. A gate asserting
  clearance against that expression is clearing **a line nothing draws**, and The Long Level's working
  board shipped to production drawn across three name boards with the check green. `levelLayout`'s own
  clamp (`pathPx - CHROME_PX - boardH - 6`) already said so. **Before writing "above X", read what X's
  component actually renders, and give the real edge ONE exported name** (`boardsTop`) that the scene
  and the gate both call.
- ⚠️⚠️ **A CHECK WRITTEN IN TERMS OF A SHARED DEFINITION MOVES WITH IT, SO PIN THE DEFINITION TO A
  MEASUREMENT.** This is the "a check written in terms of the constant it guards" fault arriving
  through a helper, and it is worse there because the helper looks like the fix. Correcting
  `boardsTop` made the clearance assertion catch the real regression — and **loosening `boardsTop`
  back was NOT caught**, because a lower value makes `bottom <= boardsTop` *easier* to satisfy. Every
  consumer moved with it. The only thing a re-derivation cannot move is a number read off the screen:
  assert the definition itself against a measured value (`boardsTop` at 640×320 is 102, from a
  `getBoundingClientRect` on production), and the mutation fails.
- ⚠️ **CROSS EVERY LAYER AT EVERY SIZE IN EVERY PHASE — a phase is a screen like any other.** The
  layer sweep above is usually run per SIZE and quietly once per phase. That chapter's 640×320 pass
  checked THE PLAN and a played round and did the crossing at 1280×720 only, where the same band is
  196px instead of 51 and everything fits; the walkthrough at 640×320 was never crossed, which is
  exactly where the collision was. And the collision was **2D** — the board passes horizontally
  BETWEEN two chrome chips it overlaps vertically — so a vertical-only check cannot see it either.
- Gates before any commit: `tsc` · `npm test` · `next build`, then bump `public/sw.js` VERSION.

---

## 5. Answering with the camera

**Moved → [chapter-craft-ar.md](chapter-craft-ar.md).** Whether the camera earns its place, the readings (count · tilt · pinch · sweep · trace), held-over-pose guards, reach and jitter arithmetic, and the one-instrument-two-inputs rule. Read it before building or changing an AR chapter.

---

## Feeding this file

When a founder correction lands, ask what the GENERAL rule is and put it here — not just the fix.
Six corrections in one session on chapter 2 all reduced to two rules already written above. If a
rule can instead become a script or a type, do that and link it from here; see the ordering
principle at the top of [lessons.md](lessons.md).
