# BUILD BRIEF — `areaPerimeter` (9–11) as a first-person 3D chapter, world generated in code

> **This is a prompt. Paste it whole at the start of the session that builds this chapter.**
>
> Read, in this order, before writing a line: `docs/chapter-craft.md` (the whole thing — it is the
> standing spec and every rule in it was paid for), `docs/ux-invariants.md`, `docs/story-9-11-rethink.md`,
> and §"the 3D pilot" in `handoff.md`. **This brief does not replace them.** It exists because this
> particular chapter has already been built THREE TIMES and rejected THREE TIMES, and the reasons are
> not obvious from the code that survived.

---

## 0. The one job

The 9–11 `areaPerimeter` chapter currently runs the flat neon `GridPlotter`, which prints its own
question in words — *"The area is 24 and one side is 4"* — over three answer chips. It fails
delete-the-art (remove every pixel of the grid and all thirty questions still work) and hands a third
of its answers to a guesser. **Replace it with a first-person 3D chapter in which the child stands in
a real place, and the answer is something they DO there.**

Two things are non-negotiable and everything below serves them:

1. **The child must do the arithmetic.** Nothing on screen may do it for them, and nothing may let
   them arrive at the right answer by feel, by covering, by filling, or by guess-and-check.
2. **The world is generated in code.** No image files, no `.glb`, no textures, no downloaded models,
   no `generate_image` calls. Meshes, materials, canvas-drawn numerals, procedural placement. This is
   a hard constraint, not a preference — see §4.

---

## 1. ⚠️ READ THIS BEFORE PROPOSING A MECHANIC — THREE HAVE ALREADY FAILED, ALL FOR ONE REASON

The founder rejected this chapter three times running, and each rejection was the SAME sentence in
different words: *the child never has to calculate.* **The tuning was never the problem. The material
was.**

| cut | what the child did | who actually did the maths |
|---|---|---|
| ① **lay it** | lay tiles on the plot until no bare square is left | **the PLOT** — it decides when it is full |
| ② **pace · fetch · tip** | pace the sides, load a barrow at a store, tip it out | **the BARROW** — tap "a row" three times and the tally counts 4, 8, 12 |
| ③ **peg it out** | foreman gives the number + the frontage; walk back and peg the far edge | *nobody — this one was honest, and it was cut anyway* |

> **A TILE IS THE UNIT OF AREA, so any mechanic where the child handles tiles hands them a countable
> pile and something other than their head does the arithmetic.** The way out is to stop giving them
> units at all, or to make them commit to a number *before* the countable thing exists.

Two general rules were paid for here and now live in `chapter-craft.md`. They apply to whatever you
build, not just to tiles:

- **A GRID ON THE WORKING SURFACE IS THE PRINTED ANSWER, DRAWN.** One line — `t.repeat.set(d.w, d.h)`
  — chalked the plot floor into exactly `w × h` countable squares, so a child stood in a 6×4 plot,
  counted 24 boxes, and never paced a side. On a fence round it handed over both side lengths at a
  glance. A grid reads as helpful scaffolding rather than as a number, which is exactly why nobody
  looks at it. **Mark the boundary; leave the inside bare.**
- **ANY REPEATABLE COMMIT THAT GRADES IS A YES/NO ORACLE.** Load, tip, read *"not enough"*, load more,
  tip again — a dozen tiles falls out of about four guesses with nothing worked out. Softening the
  wording or clearing the floor between tries does not help. Only **one commit per scored round**
  does, with the repair moved to BEFORE the commit.

**And the direction note the founder left:** if 3D is tried again, *area/perimeter may not be the
natural pilot* — walking IS the measuring, and the measuring was never the hard part; the ARITHMETIC
was. If your mechanic makes the walking the *measuring* rather than the *answer*, you have rebuilt
cut ②. Say so out loud in your plan before you build.

### The recovered cut ③ is available and is your starting point

Cut ③ was never committed and was deleted, but the full source was recovered from the Turbopack dev
source maps and is in `docs/recovered/` — `FloorPlot.tsx`, `plotMaths.ts` (cut ③), and `floorPlot.ts`
(cut ②'s maths, for contrast). **Read `plotMaths.ts`'s header comment first; it is the clearest
statement of the design that exists.** Cut ③ genuinely worked and was driven on screen through both
demos into the guided round. Treat it as prior art to improve on, not as a file to restore verbatim —
and if you keep its mechanic, say why, because the founder cut it.

---

## 2. The pedagogy contract — what any proposed mechanic must satisfy

Before writing code, write a short plan and check it against every line here. If a line fails, the
mechanic is wrong; do not tune it.

**The verb.** Every skill needs its own verb — a thing a child already DOES with the idea, used as
the answering gesture. Not a quiz with area painted on the outside. State the verb in one word.

**A verb is not a story.** Also answer: **who wants this, and why?** And the question a good verb
hides: **who decides when it is finished?** A manipulative that can be filled until it LOOKS finished
has taken the deciding away.

**The order test.** *Could the child ignore the numbers entirely and still finish by feel?* If yes,
the fix is usually the ORDER, not the mechanic: make them commit to a number BEFORE the countable
thing exists, so the building becomes the CHECK rather than the answer.

**One commit per scored round.** The round settles on the FIRST commit, right or wrong. Walking,
looking, re-measuring, changing your mind — all free, all before. The guided round keeps its retry;
it is unscored teaching.

**Delete-the-art.** Delete the 3D scene. If the question still works as a sentence, the 3D is
decoration and you have shipped `GridPlotter` in a helmet. State quantities as things in the world;
the equation appears afterwards, as a summary, in exactly one place.

**Teach where the world backs the answer up; test where it cannot help.** The demo and the guided
round may let the scene confirm. The scored rounds may not.

**Two honest directions on one control shape.** Area asks one reading, perimeter asks another off the
same gesture, so neither can be eliminated into. Use `Beat.coverage` (`{ of, all }`) to force both to
be asked before the mastery early-exit is honoured — mastery fires after ~3 questions at L1, ONE at
L2 and TWO at L3, so without coverage one of the two readings is missed about a third of the time.

**Difficulty grows the skill, not only the magnitude.** Make the taught thing an explicit generator
term so a gate can assert it climbs.

**No numeral before the commit** that the child is being asked to produce. A given (a stated frontage,
a stated quantity) may be shown — it is half the question, not half the answer. A running product,
a tally, a live count of anything the child has assembled: never.

**No red X, no timer, no score, no tier shown to the child.** A miss routes forward: a warm written
line naming what is wrong with the WORK — never the number they were after, and never the arithmetic
one step along — then the re-teach, then the next round. Everything spoken must ALSO be written; a
tap that produces silence is the worst outcome there is.

---

## 3. Where it plugs in — the chapter's architecture is already decided

Do not invent a shell. This band has one.

```
src/features/chapters/story/<Chapter>.tsx     the scene + the chapter component (3D lives here)
src/features/chapters/story/<chapter>Maths.ts the PURE maths — no three.js, no React, no DOM
src/__tests__/<chapter>.test.ts               the gate, driving the pure module
```

- The chapter renders **one** `SkillBeat` from `./StoryWorld` with a `Beat<T>`:
  `skillId: 'areaPerimeter'`, `rounds`, `make(d, round, asked)`, `sig` (a signature of the MATH only),
  `prompt`, `say`, `Play`, `Reteach`, `coverage`, and `ownsFeedback: true` if you draw your own miss
  line (a chapter that retries in place must, or the shared centred pill lands on the thing it is
  asking the child to look at).
- **`SkillBeat` rebuilds its contents every round.** Anything that must persist across the chapter
  lives OUTSIDE it, driven by `onRound`. And `onRound` fires when a round LOADS, so a cumulative arc
  must hold its pending value back one round or it signals the answer before the child commits.
- 3–11 chapters call `useAdaptive(skillId)` with **no start tier** — always difficulty 1.
- Mount `RotateGate` (`useNeedsRotate` + `<RotateGate line=… />`), and **the early return must sit
  below every hook**.
- Register in `src/features/chapters/storyChapters.tsx` — one row, `{ bg, load }`. That single table
  feeds BOTH `registry.tsx` (portal-wrapped, progress sync, celebration) and `/story` (bare preview).
  Do not add a second import list anywhere.
- Add the preview key to the `PREVIEW` map in `src/app/story/page.tsx` (9–11 block). `area` is taken
  by the old chapter; pick the key deliberately and keep the old one resolving if anything links it.
- Delete `GridPlotter.tsx` in the same change, or it rots. Its tests too.

**The pure module is not optional.** The gate cannot import a module that pulls in three.js and a
WebGL canvas, and `useFrame` is not drivable headlessly (see §6). **Anything in a 3D chapter that
depends on walking has to be behind an exported pure function or it cannot be gated at all.** The
generator, the grader, the miss lines, the reveal equation, the bounds, the slot/position maths, and
the settle rule all live in the `.ts` module, and the scene calls exactly those functions.

⚠️ On a case-insensitive filesystem `FloorPlot.tsx` and `floorPlot.ts` are the same file. Name the
pure module distinctly (`plotMaths.ts`, not `floorPlot.ts`).

---

## 4. The world, generated in code

**Everything the child sees is drawn by code at runtime.** No image assets, no model files, no
textures loaded from disk, no asset-budget spend. Numerals are drawn into a 2D canvas and used as a
`CanvasTexture` on a camera-facing sprite (cut ③ does this — reuse the approach and its cache).

Build a **seeded procedural site generator** as its own pure module, e.g. `siteGen.ts`:

- `makeSite(seed: number): Site` — deterministic. Same seed, same world, every time. **Never
  `Math.random()` at render time**; take the seed from the round so a gate and a screenshot agree, and
  so the same round replays identically after a re-teach.
- The site varies **per round** so the ten rounds are not one screen ten times — the craft rule is
  *the scene must change across the ten rounds*, and consecutive rounds must differ. Rotate the
  setting (a builders' yard, a rooftop, a dockside, a field behind a barn), the palette band, the
  skyline, the ground tone, the props at the edges.
- What it may generate: ground plane and its tone; a skyline or horizon band; buildings, walls,
  fences, stacks, crates, vehicles, poles, distant trees, sky gradient; scattered decorative props;
  the lighting rig.
- **What it may NEVER generate — this is the rule the whole redesign turns on:**
  - **Nothing countable anywhere the child can see while deciding.** No repeated unit-sized objects
    in a row or a grid, no paving, no fence palings at 1 m spacing, no bricks, no crates in a line.
    Procedural scatter is *exactly* the thing that accidentally produces countable sets — every
    generated prop must be either singular, or scattered at a spacing that is visibly NOT the unit.
  - **No grid on any working surface.** Mark the boundary — a chalk outline, corner posts, a rail.
    Leave the inside bare.
  - **Nothing aligned to the unit grid.** Props sit at fractional, jittered offsets, never on integer
    metres, or a child paces by counting props.
  - **No numerals in the world** other than the stated given and the child's own live measurement.
- **Palette is a check, not a vibe.** The thing being counted or committed must clear the scene's own
  hue by ≥45°, and separate on saturation or brightness too. The craft doc's bands apply: the world
  sits desaturated and mid-value; the interactive object is warm and clearly outside that band. Vary
  the world hue per round and gate the separation.
- **Scale is honest.** 1 world unit = 1 metre. Eye height ~1.55 m. A door is ~2 m, a person ~1.7 m,
  a van ~2.2 m tall. If the world lies about scale, pacing lies about distance.

**Performance ceiling.** Plain meshes, no shadows, no postprocessing, target under ~150 draw calls at
the largest legal round. Instance anything that would exceed it. The target device is a mid-range
tablet.

---

## 5. Comfort, controls, accessibility — 9-year-olds on a tablet

- **No head-bob. No look acceleration. No FOV punch. Modest FOV (~60–70°).** Motion sickness is the
  fastest way to lose this age group.
- `prefers-reduced-motion` **drops the movement smoothing so the camera steps rather than glides**,
  and any informational animation SNAPS to its end state. Never remove information under reduced
  motion.
- **Every interaction needs a low-precision path.** A drag-look must have a tap/step equivalent; the
  commit must be reachable without fine aim. No gesture may be required.
- Touch: on-screen movement control + look drag, both large, both in reserved bands measured against
  the real control. Tap targets ≥44 px, and **on a short frame the world yields to the tap targets**.
- Landscape-only, via `RotateGate`. A portrait screenshot is not evidence of anything.
- The child cannot get stuck: bound the walkable area one unit past the deepest legal commit, and let
  them walk through everything rather than collide — a camera trapped inside geometry is a dead end.
- **The speaker must be on screen whenever their bubble is.** Place any character by ANGLE from the
  spawn stance against the half-FOV, not by eye; cut ③ found its foreman sat ~59° off-axis against a
  ~46° half-FOV, i.e. entirely off screen while talking.
- Voice: `speakSteps` drives words and visuals together for the demo, but a multi-beat lesson or
  re-teach **must be self-paced** (Chrome/Safari silently drop later utterances). Demo rate `0.8`,
  `gapMs` 1100. Never gate a tap on speech or on animation — a ~260 ms `tapLock` is enough. No spoken
  praise on a correct answer; a warm spoken *and written* line on a miss.

---

## 6. ⚠️ r3f / three.js traps already paid for in this repo

- **r3f will not create its renderer until it has MEASURED a non-zero container, and it measures with
  a `ResizeObserver` — whose callbacks ride the rendering steps, which a browser does not run in a
  hidden tab.** A container that mounts at its final size gets exactly one RO callback, and in a
  backgrounded tab that callback never arrives: canvas stuck at the intrinsic 300×150, `onCreated`
  never fires, and the screen is nothing but the clear colour — which reads exactly like a broken
  scene. Fix: dispatch a synthetic `window.resize` on a short timer after mount; the measure hook also
  listens for that, and a synthetic event is delivered by the EVENT loop rather than the frame loop.
  **Put this in from the first commit or you will spend an hour debugging a scene that is fine.**
- **A walking loop is not reliably drivable headlessly in this pane.** Measured both ways in one
  session: `document.hidden` false with 62 rAF frames/s at one moment, true with 0 frames twenty
  minutes later, with no navigation between. Movement in `useFrame` advances only while the tab is
  fronted; a screenshot fronts it for ~40 ms and `dt` is capped, so ~0.45 m of travel per screenshot.
  Cut ③'s store loop and peg loop were each reached exactly once, opportunistically, and never played
  end to end. **Plan the verification around this from the start** (see §7).
- **Light intensities are physical units in three r155+** — values that used to read as "bright" now
  render a dusk scene. A `hemisphereLight` does the outdoor work in one object.
- **Sprite scale is in WORLD units**, so a numeral sized for a 9-metre plot swamps a 3-metre one.
- `three`, `@react-three/fiber` and `@types/three` were uninstalled when cut ③ was deleted. Reinstall
  them, and check the bundle cost of the chapter's chunk — it is lazily loaded via `storyChapters`,
  so it must not leak into the shared bundle.
- Reload at the target size rather than resizing into it; `rAF` is frozen while backgrounded.

---

## 7. How this gets proved — the gate is part of the deliverable

**Measure, don't eyeball.** `getBoundingClientRect` / `naturalWidth`, never a screenshot impression.
**Assert the resulting STATE, never that the UI advanced.** A disabled commit button is not a liveness
signal. The preview screenshot and `get_page_text` both lag the DOM.

Write `src/__tests__/<chapter>.test.ts` driving the **pure** module, and make it assert at least:

1. The generator never produces a question whose answer is not a whole number of the unit.
2. Difficulty climbs BOTH count and magnitude, and climbs the SKILL — the taught term is an explicit
   generator term and the test asserts it grows.
3. **The commit is not repeatable in a scored round** — drive `settle(mode, …)` and assert a practice
   round is over after the first commit, right or wrong, and that a guided round is not.
4. **Nothing states the answer before the commit** — assert the prompt, the `say`, the given, and
   every pre-commit readout, over the whole generator range, never contain the value being asked for.
5. **`coverage.all` is honoured** — both readings appear before an early exit is possible. Gate the
   declaration AND both call sites, since a check that re-implements the engine cannot see the wiring
   go away.
6. The miss lines never name the target number and never restate the arithmetic.
7. The site generator is deterministic for a seed, and — the important one — **produces no countable
   set**: no ≥3 props at equal spacing, nothing at integer-metre positions, no repeated unit-sized
   object, and hue separation ≥45° between the interactive object and the world, at every seed in a
   swept range.
8. Sweep the size matrix by script, and **the sweep must call the SAME layout function the scene
   renders from**. Enumerate pairs, not the one element you had in mind.

**Mutation-test the gate.** A mutation that "passes" is guilty until you have proven the mutation
landed. **A gate that re-implements a rule cannot see the rule being removed** — drive the exported
function the scene calls.

**Then play it.** Every fault in this chapter's history was found by a human looking at the screen
after the gate was green. Drive it at **1280×720 and 640×320**, through intro → both demos → guided
(wrong answer AND right) → at least two scored rounds → a re-teach → the mastery exit. Given §6, some
of that will need the world driven through the pure module rather than by walking; **say explicitly in
the handoff which loops were actually played and which were not.** Do not claim a loop you did not
reach.

**Gates before any commit:** `npx tsc --noEmit` · `npm test` · `next build` · then bump
`public/sw.js` VERSION.

---

## 8. Definition of done

- [ ] A written plan, checked line-by-line against §2, **posted before any code is written** — verb,
      who wants it, who decides when it is finished, and the order test.
- [ ] `<Chapter>.tsx` + `<chapter>Maths.ts` + `siteGen.ts` + the test file.
- [ ] `GridPlotter.tsx` and its tests deleted; `storyChapters.tsx` row swapped; `/story` PREVIEW key
      added; nothing imports the old chapter.
- [ ] Zero image, model or texture assets added. `git status` shows no new file under
      `public/assets/`.
- [ ] `tsc` 0 · `npm test` all green (current baseline **546**; the new gate adds to it) ·
      `next build` clean · 0 console errors.
- [ ] Driven at both sizes, with an honest list of what was played and what was not.
- [ ] `docs/chapter-craft.md` updated with the GENERAL rule behind any correction that landed —
      not just the fix. If it can become a script or a type instead, do that and link it.
- [ ] `handoff.md` updated.
- [ ] **Nothing committed or pushed until asked.**

---

## 9. Explicitly forbidden

No tiles, blocks, panels or any unit the child handles in a pile before committing. No grid, chalked,
textured or implied, on any surface the child works on. No running total, tally, product, or count of
anything assembled. No repeatable scored commit. No answer chips carrying the whole question in words.
No timer, countdown, red X, score, streak, or visible difficulty tier. No image or model asset. No
`Math.random()` at render time. No head-bob. No required precision gesture. No claim in a comment that
the code does not actually make — **check the code, not the comment; a comment asserting a rule is
followed is the most expensive kind of lie.**

---

## 10. If the answer is "not this skill"

You are allowed to come back and say the mechanic does not exist. The founder's own note after cut ③:
*area/perimeter looked like the natural pilot because walking IS the measuring — and the measuring was
never the hard part; the ARITHMETIC was, and walking does nothing for it. A skill where the walking IS
the answer (units on a weighbridge, angles on a survey line) is a better test of whether the world is
worth it.* If your plan cannot satisfy §2 without becoming cut ① or cut ② again, **say so in the plan
instead of building it** — that is a cheaper session than the three that came before.
