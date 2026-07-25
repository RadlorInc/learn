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

---

## 1. Animation

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

---

## 2. Images and art

### Blend, or it reads as a sticker

An object belongs in the picture only if it is **painted in the backdrop's style** and **touches
the world**:

- **Contact cues are not optional.** On land: a soft contact shadow. In water: a waterline, ripple
  rings, and a faded flipped reflection. In the air: nothing, because nothing touches.
- **Soft, cool, close shadows** (`rgba(30,42,60,.26)`), never hard black. A harsh drop-shadow is the
  loudest "pasted on" tell there is.
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

- **A grounded scene needs a backdrop whose painted ground is most of the frame.** Check the horizon
  line first. The forest scenes paint ground only in the bottom ~25%, so anything standing at 62%
  is in the treetops — that is literally the "rabbits look like they are flying" bug.
  `farm_barnyard.png` (grass from 52%), `garden.png` (55%) and `garden_meadow.png` are the safe ones.
- **Fliers are exempt** — being off the ground is correct for a butterfly, which is why a sky band
  that would be wrong for a rabbit is right for them. Check a creature's locomotion in
  [world1.tsx](../src/features/chapters/story/world1.tsx) (`LOCO` / `CRAWLERS`) before assigning it
  a band. A ladybug is a CRAWLER, not a flier.
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

Gotchas that have each cost real credits:
- **Key on MAGENTA whenever the subject contains green** — a green key eats a green backpack or a
  turtle's own flippers.
- **Kling fades the background in** rather than starting flat; always use the settled tail
  (`--start 0.5`), or generate 10s so the settled part holds real motion.
- **The safety filter false-positives.** Rephrasing in the same register as a known-good prompt
  clears it; the first Milo prompt returned `status: "nsfw"` for nothing.
- **Never `--pingpong` a walk** — reversed legs moonwalk. Ping-pong is only for motion that
  oscillates with no clean cycle (a chirping beak, paddling flippers).
- Judge a sheet on its `motion` / `loopgap` numbers and at real display size, not on the strip.
- Greyscale `pat_*` sprites are greyscale **by design** — code-tint them, never bake colour in.

---

## 3. Voice

### Pacing and synchrony

- **One `speakSteps` drives BOTH the words and the visuals in a demo or re-teach.** Never a fixed
  timer for the visuals plus separate `speak()` calls — they drift on Safari and cut each other off
  on Chrome. When audio is blocked, `speakSteps` still paces the steps on a timer, so the demo works
  silently.
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
- **The preview screenshot lags the DOM.** A frame showing the wrong backdrop with creatures missing
  entirely was pure staleness; a DOM query at the same moment was correct. Re-shoot before believing
  anything alarming.
- **The console buffer survives navigation.** After a rename you will see a wall of
  `Module not found` from the stale buffer. Open a fresh tab before believing it. This repo has lost
  three sessions to that.
- **`elementFromPoint` cannot see `pointerEvents:none` elements** — it looks straight through
  sprites. Overlap and draw-order checks have to be visual or geometric.
- Sweep the size matrix with a script, not by hand: widths × heights × question counts × every
  creature. Chapter 2's layout is 330 combinations and the script is what made the last pass clean.
- **The sweep must call the SAME layout function the scene renders from.** Chapter 4's sweep
  re-implements its sizing chain inside the test, so the check can agree with its own copy of the
  constants while the screen it protects falls apart. Chapters 9–10 export `playLayout` and the test
  imports it; do that instead.
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
