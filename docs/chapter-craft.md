# Chapter craft — how a Milo story chapter must look, move and sound

**Read this before building or changing any 3–11 story chapter.** It is the standing answer to
"how do we want the animation / the art / the voice", so a new session starts from what we already
know instead of rediscovering it.

Every rule here was paid for. Most were learned in chapter 1 (the counting parade), forgotten, and
re-learned the hard way in a later chapter after a founder spotted it on a screenshot. Where a rule
has a specific origin it is named, because the story is what makes it stick.

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

Related: where the skill is a small on-screen area, **a near miss on a shown target counts**. The
smallest area on the colouring page renders 32×28 CSS px at 640×320, under the 44px tap floor, and
this band is three-year-olds; a tap just outside the shape they were plainly aiming at snaps to it.
It can never turn a wrong answer right, only a wrong finger.

**AND A TAP THAT DOES NOTHING AT ALL IS THE WORST OUTCOME THERE IS.** Worse than a wrong answer: a
wrong answer at least tells the child the game is listening.

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
| a crowd FOLLOWING a character slid with its feet parked | a hand-rolled `transition: left` beside `Arrive`, with `moving` gated on the wrong phase | **use `Arrive` for anything that travels, including a follow** |

⚠️ **THAT LAST ONE IS THE COMMONEST WAY THE RULE GETS BROKEN NOW, because the position change does not
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
- ⚠️ **A SCENE LAID OUT IN SCREEN PERCENTAGES MUST BE `position: fixed`, NEVER `absolute`.** An
  absolute element resolves its percentages against the nearest POSITIONED ancestor, and in a scored
  round that ancestor is `SkillBeat`'s own `position: relative` wrapper — which is content-sized. So
  `top: 74%` of a strip a few dozen pixels tall put BlockYard's entire yard, Milo, the pen row and
  the answer pad squashed across the top of the frame at 1280×720. **Pass 2 shipped this and it went
  unseen through a whole verification pass**, because the demo and the guided round render OUTSIDE
  `SkillBeat` and look perfectly correct — the fault appears only once the first SCORED round loads.
  `Critter` has been `position: fixed` for exactly this reason. Generalise: **verify a chapter in its
  scored rounds, not only in its demo** — they do not share a containing block.
- **A LANE THAT WILL FILL MUST BE RESERVED FROM EMPTY.** Anything that grows — a run of blocks, a
  gathered group, a strand — is zero-sized before the first item lands, so its neighbours sit in the
  wrong place until then and jump a whole item when it arrives. In the measurement chapter the thing
  that jumped was *the thing being measured*, which is the one element the child is reading. Give
  the container the full width or height it will end at; empty and unstyled, it gives nothing away.
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
- ⚠️ **SIZE THE CAST SO THE CREATURES AGREE WITH EACH OTHER AND WITH MILO.** `Kind.scale` in
  critters.tsx exists for this and says so — *"a ladybug drawn the same height as a rabbit is its own
  kind of doesn't-belong"* — and BlockYard's second pass drew every creature at one height, so an ANT
  came out the size of a LAMB beside a pony. Where a chapter needs its cast COUNTABLE, the cleaner
  answer than a scale table is to cast only creatures that live in ONE size band: a countable ant
  cannot be honestly sized next to Milo, so it is simply not in that chapter.
- **The background must match its objects** — orchard↔apples, pond↔fish, kitchen↔cookies. Where a
  world's backdrops are object-specific, pair the backdrop TO the item so a scene never shows the
  wrong object.
- **No storytelling repeats within an age group.** Two chapters may reuse an object, but then their
  worlds must differ (different backdrops AND a different object list).

### Generating new art

Only generate when the library genuinely lacks something or fits poorly — but when it does,
generate rather than settling for an emoji or a CSS shape.

**Style reference: always reference the ORIGINAL / earliest art** (`apple.png`, `cookie.png`,
`duck.png`, `pond.jpeg`, `forest_*.jpeg`). Later AI batches drift, and referencing them compounds
the drift. References must be **deployed URLs** — `media_import_url` silently fails on a 404 and the
model then generates from text alone.

**Walk-cycle pipeline** (this is how every drawn cycle in the app was made):

```
generate_image  (subject on a FLAT chroma background)
      ↓
generate_video  kling3_0_turbo, 5s, "walks in place, camera locked, background stays flat"
      ↓
python3 scripts/creature-frames.py <clip>.mp4 <name> --frames 12 --start 0.5 [--key magenta]
      ↓
register in canvas/sheets.ts  { url, frames, fps, cellAspect }
```

**When a side-facing still already exists, this is IMAGE-TO-VIDEO and the `generate_image` step is
skipped entirely.** Composite the transparent cutout onto a flat chroma field (Kling needs an opaque
start frame), pass it as `start_image`, and the still itself locks the style — cheaper and far more
reliable than generating a fresh still. `scratchpad/chroma.py` does the compositing.

**DERIVE the chroma field, don't remember it.** Measure the distance from green and from magenta to
the subject's *nearest actual pixel* and take whichever is further. Run blind on the existing cast
this independently reproduced every case the sessions below learned by burning credits — frog
(green clearance 156 vs magenta 206), alien (173), and Milo, whose green backpack gives green a
clearance of 172 against magenta's 209. It also flags the marginal ones: the dragonfly is 169 green
/ 153 magenta, i.e. neither field is comfortable and it is the one to expect a retry on.

Gotchas that have each cost real credits:
- **Key on MAGENTA whenever the subject contains green** — a green key eats a green backpack or a
  turtle's own flippers. (Now derived automatically; see above.)
- **Kling fades the background in** rather than starting flat; always use the settled tail
  (`--start 0.5`), or generate 10s so the settled part holds real motion.
- ⚠️ **THE SUBJECT SETTLES TOO, AND THAT IS THE BIGGER EFFECT.** On an image-to-video run the
  magenta field was solid from frame 0 — but the model spent the **first 20 of 121 frames
  re-rendering the subject**, shrinking it from 610px to 360px wide and drifting it 89px right,
  before locking in. From frame 20 on it was stable to 6%. So `--start` is not only about the
  background; discard the front regardless. Measure per-frame bbox width and centre to find where it
  locks, rather than guessing.
- **Say "at a CONSTANT size, must not drift, grow or shrink."** The prompts that settle fastest all
  carry that clause; the one that omitted it produced the 20-frame settle above.
- **The reported output geometry is not the delivered geometry.** A job whose params said
  `1280×720` delivered a **960×960 square** file. Check the actual frames before concluding a square
  subject got cropped.
- **The preset matcher intercepts on keywords and it is a pre-submission notice, not a charge.**
  "wings **beating**" matched a music preset; other prompts matched a lighting one. Pass the
  suggested id back as `declined_preset_id` to generate literally — but it suppresses only **that
  one id**, so a retry can match a different preset and need a second decline. Three interceptions
  across a 10-video batch cost nothing: the balance came out at exactly 10 × 7.5.
- **Verify the spend against the balance after a batch**, which is how you catch the
  "server isn't responding but it submitted anyway" duplicate.
- **The safety filter false-positives.** Rephrasing in the same register as a known-good prompt
  clears it; the first Milo prompt returned `status: "nsfw"` for nothing.
- ⚠️ **A CREATURE WITHOUT A REGISTERED SHEET SILENTLY BECOMES A STILL — AND A STILL THAT TRAVELS IS
  A STICKER BEING DRAGGED.** `SheetCell` falls back to a plain `<img>` when `SHEETS` has no entry for
  the src, which is the correct fallback and also completely invisible: the creature is drawn, it is
  the right creature, and it slides. **Assert `hasSheet()` for every creature a chapter casts** —
  it is one line in the gate and it is the only thing standing between you and the cardinal fault.
- ⚠️ **A PROP'S ART STYLE MATTERS AS MUCH AS A BACKDROP'S, AND THE LIBRARY MIXES BOTH.**
  `train_car.png` and `train_engine.png` are flat-VECTOR cartoons — thick uniform outlines, flat
  fills, a face on the engine — and a painted chick sitting in one is the same mismatch the founder
  rejected in the pond backdrops. `cart.png` next to them is genuinely painted. **Open the file
  before designing a chapter around it**; the check that saved BlockYard is the same one the
  `milo_hop` lesson asks for, applied to a prop instead of a sheet.
- ⚠️ **A SHEET'S NAME IS A CLAIM, NOT A FACT — MEASURE IT BEFORE YOU DESIGN ON IT.**
  `milo_hop.png` shipped, was registered with a comment reading *"Milo's HOP, for a chapter where he
  jumps between places"*, and was named as the foundation of A3 in both the handoff and the rethink
  doc. **It is a walk cycle** — a second take of `milo_walk.png`, measured lift `0` in all 12 frames
  and height varying by under 2%. A whole chapter was designed on it before anyone opened it. The
  check is thirty seconds: split the strip and print each cell's alpha bbox — **lift ≠ 0 somewhere
  means it leaves the ground, and a flat 0 down the column means it does not.** Then render a
  contact sheet and look. Do this the moment a sheet becomes load-bearing, not after.
  (Its registry key `milo_hop_side.png` also pointed at a file that did not exist, which nothing
  caught because no caller had ever used it.)
- **Never `--pingpong` a walk** — reversed legs moonwalk. Ping-pong is only for motion that
  oscillates with no clean cycle (a chirping beak, paddling flippers).
- Judge a sheet on its `motion` / `loopgap` numbers and at real display size, not on the strip.

**Line-art pipeline** (the colouring chapter, and anything else that must be filled with colour):

```
generate_image  "children's colouring book … THICK uniform outlines, EVERY shape fully closed,
                 flat white fill, no shading/hatching/dots"   ← on flat MAGENTA for a cutout,
                                                                on WHITE for a full page
      ↓
python3 <chroma key>   min(R,B) − G, soft ramp + despill      ← only when a cutout is needed
      ↓
verify it FLOODS  (threshold → dilate 2px → connected components; see the scratch `regions.py`)
```

- **Do not use `remove_background` on line art.** It is an AI matte, and these subjects are pure
  white inside a black outline — a matte that decides "white is background" eats the interior, which
  is exactly the region the paint has to fill. A flat magenta backdrop keyed by hand is more
  reliable AND free.
- **A full PAGE needs no cutout at all**: `mix-blend-mode: multiply` drops its white straight out
  onto the paper.
- **Colouring is a two-layer composite, and it is exact**: a solid fill shaped by the drawing's
  silhouette, with the drawing multiplied on top. White fill × colour is the colour; black ink ×
  colour is still black ink, so the lines never muddy at any hue. This is also why painted sprites
  fought it — greyscaling and brightening them to fake line art was three filters of guesswork that
  line art makes unnecessary.
- **PROVE the artwork floods before wiring it.** One hairline gap where two strokes nearly meet lets
  the fill escape and swallow the page. Dilate the ink ~2px to close near-misses, then count the
  regions: a good page returns ~100 with the largest around 20% (the sky). One giant region means
  the line work is open and the art is unusable — regenerate rather than patch.
- **An area's colour must differ from whatever it sits inside.** A blue cloud on a blue sky gave a
  correct tap no feedback at all.
- Greyscale `pat_*` sprites are greyscale **by design** — code-tint them, never bake colour in.
- ⚠️ **AND A SPRITE'S COLOUR IS A CLAIM LIKE ITS NAME — MEASURE IT BEFORE CASTING IT.** The
  greyscale set is not confined to the `pat_*` prefix: `candy_cupcake`, `candy_lollipop` and
  `candy_candy` all measure **saturation 0.0** and render as grey ghosts if drawn raw. Mean
  `max(RGB) − min(RGB)` over the opaque pixels separates them instantly — under ~18 is greyscale,
  a real sprite runs 90–190. Thirty seconds with PIL, and it is worth putting in the chapter's gate
  rather than an allow-list, so a future swap is covered too.

---

## 3. Voice

### Pacing and synchrony

- **One `speakSteps` drives BOTH the words and the visuals in a demo or re-teach.** Never a fixed
  timer for the visuals plus separate `speak()` calls — they drift on Safari and cut each other off
  on Chrome. When audio is blocked, `speakSteps` still paces the steps on a timer, so the demo works
  silently.
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
  three sessions to that.
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
- **Two taps in the same tick are a TEST artefact, not a user.** React commits state between events,
  so a `ref` mirrored during render is still stale if the script picks a colour and taps the page in
  one synchronous statement. Cost half an hour of chasing a fill that was never broken.
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
- ⚠️ **A HUE CHECK ON A BIMODAL SCENE MUST TEST EVERY STRONG HUE, NOT THE MEAN.** BlockYard's
  camouflage gate takes a saturation-weighted mean of the band — which on a cream-and-mint counter
  returns ~45°, **a hue that is nowhere in the picture**, and would happily allow a 160° set to sit
  invisibly on 16% of it. Histogram the band and require clearance from every bucket carrying more
  than a few percent. (Re-measured under that rule, `town_park + teal` in BlockYard comes out at
  43° against a 45° threshold — marginal, not fixed, and recorded here rather than silently patched.)
- Sweep the size matrix with a script, not by hand: widths × heights × question counts × every
  creature. Chapter 2's layout is 330 combinations and the script is what made the last pass clean.
- **The sweep must call the SAME layout function the scene renders from.** Chapter 4's sweep
  re-implements its sizing chain inside the test, so the check can agree with its own copy of the
  constants while the screen it protects falls apart. Chapters 9–10 export `playLayout` and the test
  imports it; do that instead.
- ⚠️ **A MUTATION THAT "PASSES" IS GUILTY UNTIL YOU HAVE PROVEN THE MUTATION LANDED.** A planted
  regression reported the gate as blind; the `sed` that planted it had silently matched nothing, so
  the gate was never actually tested. Re-planted with a tool that reports its own substitution count,
  it failed the gate immediately. **Assert on the edit before you conclude anything about the check**
  — same family as "a sweep that flags everything is a broken sweep, not a discovery".
- **Mutation-test the gate, and tell an inert mutation from a missed regression.** Of seven planted
  against the chapters 9–10 sweep, five were caught and two passed — and both survivors turned out
  to change no behaviour at all (one constant was shadowed by a tighter one, one cap was covered by
  a second mechanism). "It passed" is only good news once you have checked which of the two it is.
- **`requestAnimationFrame` is frozen while the preview is backgrounded**, so rAF-throttled hooks —
  `useViewport` among them — never see a live `resize`. Resizing the preview and re-measuring
  reports a layout still computed for the OLD size, which looks exactly like a responsive bug.
  Reload at the target size instead of resizing into it. (This burned three separate measurements in
  one session; each time the instrument was wrong and the code was fine.)
- Gates before any commit: `tsc` · `npm test` · `next build`, then bump `public/sw.js` VERSION.

---

## Feeding this file

When a founder correction lands, ask what the GENERAL rule is and put it here — not just the fix.
Six corrections in one session on chapter 2 all reduced to two rules already written above. If a
rule can instead become a script or a type, do that and link it from here; see the ordering
principle at the top of [lessons.md](lessons.md).
