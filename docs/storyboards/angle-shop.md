# 📐 THE ANGLE SHOP — storyboard

**Chapter:** 9–11 · `anglesSymmetry` · replaces the neon `AngleScope.tsx`
**Status:** **BUILT AND DRIVEN.** `tsc` 0 · **660/660 vitest** · `next build` 0 · 0 console errors · driven at 1280×760 and 640×320 through a scored round. ⚠️ NOT COMMITTED; needs `public/sw.js` v87 → v88 to deploy.
**Pipeline (new for this band):** storyboard → Higgsfield generates the 2D art → wire it interactive.

Read [chapter-craft.md](../chapter-craft.md) before building from this. This document applies its
rules; it does not restate them.

---

## 0 · Why this chapter, out of the six still neon

Still on the pre-teen HUD: `FactorLab` · `FractionForge` · `DecimalGrid` · `UnitConverter` ·
`AngleScope` · `MissionBrief`. AngleScope is the right pilot for a *generate-the-art* pipeline for
one reason the other five do not have:

> **Both of its skills are EXACT TRANSFORMS.** An angle is a rotation. Symmetry is a mirror.
> `rotate(62deg)` on a painted rafter *is* 62°, and `scaleX(-1)` about an axis *is* a fold.
> **The generated art carries the mathematics instead of decorating it.**

Compare: a fraction needs exact division (so the art has to be clipped by SVG geometry — SliceShop's
hard-won compromise); a decimal needs a 100-grid, which is inherently code-drawn, so generated art
can only ever be wallpaper behind it. Angles are the one place where painted art and exact maths are
the same object.

Three more reasons, in order:

| | |
|---|---|
| **It is a live defect, not a style matter** | [story-9-11-rethink.md](story-9-11-rethink.md) measures `angleType` as a **33% guess** and names it one of the band's three coin flips. `symmetry` is 3 numeric chips — another 33%. |
| **It is next in the build order** | The rethink doc's order is FactorLab + AngleScope. FactorLab is blocked (FitOut took the array-on-a-frame gesture and factors needs a different material). AngleScope is unblocked. |
| **Lowest asset count in the band** | One shop, three sites, the adult cast already generated. **~28 credits left of the ~31 budgeted**, of 1074. |

**What is wrong today, in one line:** `prompt: 'Is this angle acute, right, or obtuse?'` over chips
`['Acute','Right','Obtuse']`. Delete the whole SVG scope and all thirty questions still work.
Aliveness **0 of 4** — nothing arrives, no tap sends anyone anywhere, Milo is `<PtMilo left={9} />`
bobbing with no job, one `LabBackdrop` for the entire run.

---

## 1 · The world, the job, the verb

**📐 THE ANGLE SHOP.** A crew makes the metal and timber pieces a town needs, and **Slate** (§1a) has just joined it as an apprentice — the ridge of a
roof, the ramp onto a footbridge, the canopy of a shelter — and every piece is either **bent to an
angle** or **folded to be symmetric**.

**Who wants it, and what happens when the child is right (§0a):** the foreman brings a job with a
reason. *"This roof has to shed rain — make the ridge sharper than a square corner."* Get it right
and the rain sheets off into the gutter. Get it shallow and it **pools in the valley and drips
through onto the floor below.** That is why roof pitch exists, it is visible in two seconds, and no
ten-year-old needs it explained.

**Two verbs, one control shape** (TickTock's call: one thing to learn, used two ways):

| | verb | the answer is | why it cannot be guessed |
|---|---|---|---|
| angles | **TURN IT** | a position of a real thing | you cannot guess a rotation |
| symmetry | **MARK THE FOLDS** | a set of axes you placed | you must find each one |

---

## 1a · SLATE — the 9–11 band's character

**The band has no protagonist of its own, and that is the "reads too young" problem in one sentence.**
Milo is drawn in the 3–8 register — chibi proportions, big head, flat-vector fills — and a
ten-year-old's building site with him in it looks like a toddler's toy. The 9–11 cast that *does*
work (the foreman bear, the badger driver) is painted, thin warm outline, grown-up proportions —
but they are adults, and a child needs somebody to BE.

> **SLATE** — a young mountain goat, first week as an apprentice on the crew.
> Reference sheet: [`docs/art/slate-turnaround.jpg`](../art/slate-turnaround.jpg) ·
> production side view: [`docs/art/slate-side-ref.jpg`](../art/slate-side-ref.jpg)

**The trait is the mathematics, which is why she is a goat.** Slate can stand on *any* slope, so she
trusts her feet over her eyes and thinks she does not need to measure. That is the running joke, the
thing the foreman keeps correcting, and **the exact misconception the chapter exists to break** —
"feels about right" is not good enough when rain has to run off. A character whose flaw is the
chapter's payload gives every miss line somewhere to come from.

| | |
|---|---|
| **Reads as** | about twelve — slight, long-legged, a bit coltish. A peer, not a mascot and not an adult. |
| **Silhouette at 40px** | short backward-curving horns · long muzzle · tall ears · tool roll across the chest · cloven hooves. Readable at any size the layout can produce. |
| **Kit** | teal hard hat pushed back between the horns, teal canvas tool roll, charcoal dungarees, cream rolled-sleeve shirt, brass folding rule at the hip, scuffed tan boots. |
| **Voice** | short, practical, a little cocky, never babyish. *"I can stand on that."* → *"…yeah, but the rain can't."* |
| **Against Milo** | Milo is the 3–8 register and does **not** appear in this chapter. Slate replaces `PtMilo` entirely. |

### Palette — measured, not eyeballed

Two variants were generated. **B was picked on the numbers**, not by eye:

| | value | saturation | hue mix (saturation-weighted) |
|---|---|---|---|
| slate **A** — cream · [rejected](../art/slate-rejected-warm.jpg) | 0.604 | 0.282 | **30° 51% · 15° 41%** · 165° 5% |
| slate **B** — blue-grey ✅ | 0.539 | 0.219 | 15° 39% · 30° 38% · **165° 15%** |
| foreman bear | 0.597 | 0.362 | 15° 66% · 195° 19% · 30° 11% |
| Milo | 0.699 | 0.580 | 15° 58% · 180° 13% · 45° 12% |

- **A is 92% warm** — the same band as the bear (77%) and Milo (70%). Three warm characters on a warm
  timber site is the camouflage fault, and it would have shipped looking fine in a thumbnail.
- **B carries 3× the cool content and sits lowest in value (0.539)**, so she reads as a distinct,
  cooler, darker figure beside both.
- ⚠️ **Stated honestly: B is still 77% warm overall.** The *fur* is not doing the separating — the
  **teal kit is**, exactly as the foreman's hi-vis vest does. That is the repo's existing solution,
  not a new risk, but it means the kit is load-bearing and may not be recoloured casually.
- ⚠️ **One collision to watch.** `fit_station.jpeg` measures **98% cyan (195° + 180°)**, so a teal hat
  against a big cyan sky would camouflage. The three new backdrops are spec'd **ground-dominant with
  a low horizon (ground line ≈0.80)**, which keeps her band timber rather than sky. **If a roof shot
  ever puts her against open sky, move the kit to ~330° rose** — measured, that hue is completely
  absent from every asset in the app.

### Assets she needs

| file | what | status |
|---|---|---|
| `characters/slate_side.png` | side-on cutout, cropped to her **ink box**, 156×512 | ✅ **cut** · 19 KB |
| `characters/slate_walk.png` | **12-cell walk cycle**, 92×256 per cell, `cellAspect 0.359` | ✅ **cut** · 179 KB · period 26f, wrap mismatch 1.30 |
| `characters/slate_work.png` | **12-cell winding cycle** (the S3 pose), 140×256 per cell, `cellAspect 0.547` | ✅ **cut** · 202 KB · period 35f, wrap mismatch **1.06** |

**These are the 9–11 band's FIRST drawn cycles.** Until this, the whole band measured `0` on
`grep -c "Arrive|journeyOf|SheetCell"` — that was the headline gap in the audit.

⚠️ **Deliberately NOT registered in `canvas/sheets.ts` yet.** The repo's own convention is that art
with no home stays unregistered — an unregistered sheet is invisible to the idle-art gate, which is
the honest state until the chapter consumes it (the cut fox is recorded the same way). Register with:

```ts
'/assets/characters/slate_side.png': { url: '/assets/characters/slate_walk.png', cellAspect: 0.359, frames: 12, fps: 11 },
```

⚠️ **`fps: 11` is tuned by ear and UNVERIFIED on screen**, exactly as the 10 cycles generated for the
6–8 band were. It is not only cadence — for a grounded creature it sets **ground speed**, so it is
the number to check first if her walk reads wrong. The foreman is 9; Slate is younger and lighter,
so she should step a little quicker than he does.

⚠️ **The walk's wrap mismatch is 1.30**, at the bottom edge of the band the craft doc records as
"hitches once a cycle" (1.3–2.7). Swept across five start offsets it improves 1.66 → 1.30 and then
plateaus, with the period holding at 26 throughout — so the cycle is real and 1.30 is the best this
clip offers. **Do NOT `--pingpong` it** — reversed legs moonwalk. The work cycle at 1.06 is
effectively seamless.

### What the cutting actually measured

| | frames | subject settles | motion starts | width drift | centre drift | period |
|---|---|---|---|---|---|---|
| walk | 121 | f0 | **f11** | 46px | 28px | 26f, corr +0.661 |
| work | 121 | f0 | f0 | 262px → **18px from f45** | 114px → **9px** | 35f, corr **+0.878** |

⚠️ **The walk's first 11 frames are a HELD START FRAME** — the craft doc's rule, reproduced exactly:
cut from the active window, not the front of the clip. ⚠️ **And the work clip spends its first ~45
frames materialising a crank bar out of nothing**, which is why its raw drift reads 262px; from f45
the bar is stable and the cycle is the strongest of the two. `--start` was taken from that
measurement, never guessed.

⚠️ **The chroma key was dry-run against her sprite BEFORE the clips came back**: 99.5% of background
clears, 98.6% of subject stays opaque, and the 0.24% partial is the anti-aliased edge. Zero magenta
fringe survived on either sheet. **Magenta was derived, not recalled** — clearance 200 vs green's
185, because her teal kit is what pulls green closer.

---

**Three sites**, rotating so consecutive rounds differ (never all-distinct — that is the rule that
once put a yard on a pond):

| site | the piece | the angle job | the fold job |
|---|---|---|---|
| 🏠 **The roof** | a rafter pair at the ridge | how sharp is the ridge | the gable vent |
| 🌉 **The footbridge** | the approach ramp | how steep the ramp | the deck panel |
| 🚲 **The shelter** | the canopy arm | the canopy pitch | the side panel |

None of these three backdrops is used anywhere in the 9–11 band. **Cross-check before generating** —
the running registry is the `project-milo-9-11-backgrounds` memory; the band currently holds
`depot_*` (Loading Bay), `store_*` (Order Desk), `rail_*` (Rail Line), `fit_*` + `open_hills`
(Fitting Crew) and `run_*` (Supply Run).

---

## 2 · SHOT LIST — an ANGLE round

Six shots. Timings are the animation's, not the child's — S3 is open-ended.

---

### **S1 · THE JOB ARRIVES** · 2.6s
```
┌──────────────────────────────────────────────────────┐
│  sky                                                 │
│                                       ╱╲             │
│                                     ╱    ╲   ← the   │
│                            ▓▓▓▓▓▓▓▓        half-built │
│                            ▓▓▓▓▓▓▓▓         roof     │
│   🧑‍🔧 Milo          🐻 →                              │
│   (still)         foreman walks IN from off-frame R  │
│  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ ground     │
└──────────────────────────────────────────────────────┘
        💬 at the foreman's MOUTH:
        "This roof has to shed rain. Make the ridge
         SHARPER than a square corner."
```
- **Moves:** only the foreman, on his own drawn legs, the full off-frame distance. Everything else
  is still. He stops beside Milo and the bubble opens at his mouth.
- **Built from:** generated backdrop · `foreman_bear_walk.png` (**already registered**, 12 cells,
  fps 9 — zero art cost) through `Arrive`, so the cycle runs exactly while he covers ground.
- ⚠️ The bubble carries a persistent `lead` (the requirement) so a wrong answer never takes the
  question away with it.

---

### **S2 · THE PIECE GOES UP** · 1.2s
```
                    ╲
                     ╲  ← the rafter, hinged at the
                      ╲    vertex, rises to a start angle
        ┌──────┐       ●═══════════  (the fixed arm)
        │ ⌐    │      vertex
        └──────┘
        the SET SQUARE guide fades in at the vertex
        — translucent, L1–L2 ONLY
```
- **Moves:** the rafter swings up from flat to its opening position over 1.2s, ease-out. The set
  square ghosts in behind it.
- ⚠️ **The guide is a scaffold and it RETIRES AT L3** — exactly as TickTock's minute ring does. Left
  up for ever, the square corner is never in the child's head.
- **Built from:** one generated beam sprite, CSS `rotate` about the vertex. The rotation is the
  maths; the sprite is only the material.

---

### **S3 · THE CHILD TURNS IT** · open
```
                    ╲                    ╱
                     ╲                  ╱   ← moves 5° a tap,
                      ╲                ╱       in real time
                       ●══════════════
        ┌───────────────────────────────────────┐
        │   ◀ turn      Fix it ✓      turn ▶    │
        └───────────────────────────────────────┘
```
- **The whole question is on screen and nothing tells them the answer.**
- ⚠️ **NO DEGREE READOUT WHILE TURNING.** That is the teen month-dial fault: print the number and
  the child slides until the screen agrees, and the chapter becomes hot/cold. The arm just moves.
- ⚠️ **`Fix it ✓` looks identical at every angle.** A commit that lights up when the answer is right
  is chapter 4's green Ready button — a child wins it without ever comparing to the square corner.
- **5° a tap** so 90 is reachable and a right angle is expressible. Tap-only; no drag anywhere in 3–11.

---

### **S4 · THE FIX** · 0.6s
```
                       ╲
                        ●●  ← a bolt drives in, the arm
                       ●══════  locks, the guide retires
```
Short, mechanical, and it is the moment the answer becomes irreversible. **One commit per scored
round** — the repair lives before it, in S3.

---

### **S5 · THE CONSEQUENCE** — the payload shot · hit 3.0s / **miss 4.6s**
```
   RIGHT (ridge acute)              WRONG (ridge too shallow)
   ┊ ┊ ┊ ┊  rain                    ┊ ┊ ┊ ┊  rain
      ╱╲                                ╱‾‾╲
    ╱    ╲   water sheets            ╱      ╲   water POOLS in
  ╱        ╲  off both sides       ╱          ╲  the valley…
 ▓▓▓▓▓▓▓▓▓▓▓▓  into the gutter    ▓▓▓▓▓▓▓▓▓▓▓▓▓
  crew looks up 🐻🧑‍🔧               …and drips through 💧💧
```
- **This is the shot the chapter exists for.** The classification stops being a label and becomes a
  thing that happens to somebody.
- ⚠️ **A miss holds LONGER than a hit** (4.6s vs 3.0s) — the Empty Plot measured 2.6s as not enough
  to read a consequence.
- **Built from:** code-drawn rain (CSS, controllable, free) over the generated backdrop. A generated
  rain video was considered and **skipped** — it cannot be steered by the answer.

---

### **S6 · THE NUMBER** · 1.4s
```
                       ╲
                        ╲  ⌒62°⌒
                       ●══════════
        ┌────────────────────────────────────────┐
        │  62° — acute. Sharper than the square   │
        │        corner, so the rain runs off. ✓  │
        └────────────────────────────────────────┘
   run strip ▸  [🏠62°] [🌉·4] [🚲98°] …   ← the arc, OUTSIDE SkillBeat
```
- **The numeral appears only now**, as the summary of work already done — BlockYard's rule.
- ⚠️ The run strip must hold the pending value back **one round**. `SkillBeat` fires `onRound` when a
  round *loads*, so appending on that callback prints the answer to the question still on screen.
  RailLine shipped exactly that bug.

---

## 3 · SHOT LIST — a FOLD round

Same six beats, different act.

### **S1 · THE JOB** · 2.6s
Foreman walks in. 💬 *"The gable vent has to be symmetric or it won't sit square. Mark every fold
that matches."*

### **S2 · THE PANEL LANDS** · 0.9s
```
        ⬡  ← drops onto the bench with a contact shadow,
            settles with a small bounce
```
- **Exact polygon, painted material.** The shape is an SVG path (a regular hexagon must be regular);
  the generated sheet-metal texture is **clipped by that path**. SliceShop's rule: flat SVG fills
  read as a diagram laid over a photograph.

### **S3 · MARK THE FOLDS** · open
```
        ⬡ with a fold BAR sweeping through its centre,
          snapping to the shape's OWN candidate axes
          (every vertex + every edge midpoint)

        ┌────────────────────────────────────────────┐
        │  ◀ turn    Mark ✓    Fold it ✓    turn ▶   │
        └────────────────────────────────────────────┘
        marked bars stay on the panel · tap one to take it back
```
- ⚠️ **The bar snaps to CANDIDATE AXES, not to pixels.** For a pentagon that is 5 vertex-axes + 5
  midpoint-axes = 10 candidates of which 5 work; for an isosceles triangle, 6 candidates of which 1
  works. Real distractors, and a ten-year-old is not fighting a slider.
- ⚠️ **A marked bar gives no feedback.** Nothing is right or wrong until `Fold it ✓`.
- ⚠️ **Undo is a take-back, not a Back button**, and it is available at every count — one that
  appears only when the set is wrong is a verdict handed over before the commit.
- **Nothing says "that's enough."** Deciding when they have found them all IS the skill.

### **S4 · COMMIT** · `Fold it ✓`

### **S5 · THE FOLD** — the payload shot · ~1.1s per marked line
```
   for EACH marked bar, one at a time:

     ⬡ ──▶  half swings over the bar  ──▶  ✓ halves click, line locks GOLD
     ⬡ ──▶  half swings over the bar  ──▶  ✗ overhangs, springs back, line greys

   then the ones they MISSED fold themselves in, dimmer:
     ⬡ ──▶  ◌ ◌   "…and these two also fold."
```
- The fold is `scaleX(-1)` about the bar — exact, so the animation cannot lie.
- **Showing the missed lines is the teaching**, and it is post-commit so it costs nothing.

### **S6 · THE VERDICT** · 1.4s
`Regular hexagon — 6 lines of symmetry. You found 5.` Panel joins the run strip.

---

## 4 · THE WEEK — the practice rounds *are* the story

**This is the structural change.** Today the story is an intro and a demo, and then ten
interchangeable practice rounds are bolted on after it. Instead: **the ten scored rounds are Slate's
first week on the crew**, one job each, in order.

The pattern is TickTock's, which the craft doc already records as the fix for exactly this:
*the scenario fixes the context and the tier picks the difficulty*, so story and difficulty stay
independent and neither constrains the other.

| # | day | job | who wants it | type |
|---|---|---|---|---|
| 1 | Mon am | the shed roof | Mrs Pell's tools are getting wet | angle |
| 2 | Mon pm | the shed's gable vent | it has to sit square in the hole | fold |
| 3 | Tue am | the footbridge ramp | a barrow has to get up it loaded | angle |
| 4 | Tue pm | the bridge deck panel | it goes in either way round | fold |
| 5 | Wed am | the bus shelter canopy | the queue stands under it in the rain | angle |
| 6 | Wed pm | the shelter side panel | it mirrors the one opposite | fold |
| 7 | Thu am | the school bike rack roof | bikes underneath, low clearance | angle |
| 8 | Thu pm | the school sign | it reads the same from both approaches | fold |
| 9 | Fri am | the market awning — the big one | the whole street is watching | angle |
| 10 | Fri pm | the market banner | it hangs centred or not at all | fold |

### ⚠️ The difficulty ladder and the story arc are the SAME LINE

This is the part worth getting right, and it costs nothing to build because both already exist:

| tier | what changes mechanically | what the child sees |
|---|---|---|
| **L1** | set-square guide **on**, obvious angles | the foreman stands over her, square in hand |
| **L2** | guide **on**, angles near 90° | he watches from the ladder |
| **L3** | guide **off**, exact figures | **he has gone to another job. She is on her own.** |

A ten-year-old does not want to be praised, they want to be **trusted** — and the scaffold retiring
*is* being trusted. The mastery early-exit stops being an abstraction and becomes **"signed off
early — you're on the crew"**, which is the best ending the engine can already produce.

⚠️ **Three wrong in a row is a story beat, not a punishment screen.** `reteachAfter: 3` fires as
**Slate asking the foreman to show her again** — he walks back into frame and works one. No red X,
nothing said about her, and the shared centred *"Let's look together!"* pill is suppressed with
`ownsFeedback` because it would land on the thing being read.

⚠️ **The arc must live OUTSIDE `SkillBeat`.** The week strip along the top — the finished pieces,
day by day — is driven by `onRound`, because `SkillBeat` rebuilds its contents every round and
anything inside it resets. **And it holds each value back one round**, or it prints the answer to
the question still on screen.

### The phases around it

| phase | shots |
|---|---|
| **INTRO** | one painted wide of the yard, the foreman handing Slate her hat. `Start the week`. One tap, which is also the `unlockSpeech()` gesture — every chapter does its own. |
| **DEMO** ×2 | the foreman works one **angle** job and one **fold** job end to end, including the rain and the folds, while Slate watches. **Self-paced dwell, `speak()` alongside — NOT `speakSteps`.** TickTock hung on every device that HAS a voice because `speakSteps` reveals from `onstart` and browsers silently drop later events. |
| **GUIDED** ×1 | Monday's first job, unscored, guide on, a hand cue on the `◀ ▶`. Slate's line: *"I can stand on that."* — foreman: *"Yeah. The rain can't."* |
| **PRACTICE** | the ten jobs above. `SkillBeat`, `reteachAfter: 3`, mastery early-exit. |

⚠️ **A perfect run ends around round 6**, so Friday's market awning is only ever seen by a child who
needed the practice. That is the accepted cost the craft doc already records for Shape House's
part-built boat — but it means **the week must read as finished at any exit point**, so the closing
card counts what was actually done rather than promising a Friday nobody reached.

---

## 5 · The question generator

```ts
type QType = 'angle' | 'fold'
type AngleJob = 'kind' | 'degrees'          // "make it acute"  |  "set it to 65°"
```

| tier | angles | folds | guide |
|---|---|---|---|
| **L1** | `kind`, obvious: 30·40·135·150 | square · rectangle | **on** |
| **L2** | `kind`, near 90: 75·85·95·105 | + equilateral · isosceles | **on** |
| **L3** | `degrees`, exact target | + pentagon · hexagon | **OFF** |

- **Grading, angles:** `kind` → a band (`acute` 20–85, `right` exactly 90, `obtuse` 95–160);
  `degrees` → exact. 5° steps make 90 reachable.
- **Grading, folds:** the marked SET against the true axis set. Partial credit is *shown* in the
  verdict and graded as wrong — the answer is "all of them."
- **`sig`** (math-only dedupe, so a rotating site never reads as variety):
  `` `${qType}|${qType === 'angle' ? job + kind : shape}` ``
- **`coverage: { of: r => r.qType, all: ['angle','fold'] }`** — mastery must not exit before both are
  asked. A strong child gets ~3 rounds at L1, ONE at L2, TWO at L3, and then the chapter ends; without
  coverage the fold half is missed outright by a third of good runs (TickTock measured exactly this).
- **`ownsFeedback: true`** — the chapter writes its own miss lines and the shared centred
  *"Let's look together!"* pill is suppressed, because it would land on the thing being read.

**Miss lines — written AND spoken, and they never name the answer:**

| case | line |
|---|---|
| wanted obtuse, got acute | *"That's still inside the square corner. Open it wider."* |
| wanted acute, got obtuse | *"That's past the square corner — bring it in."* |
| wanted right, near miss | *"Nearly. The square corner has to sit flush — no gap, no overlap."* |
| folds, too few | *"Two of your folds held. Look again — there are more places the halves match."* |
| folds, a wrong one | *"One of those didn't match. Fold it in your head before you mark it."* |

⚠️ **A miss reveals the RULE, never the answer** — the set square comes back on, it does not print
the degrees.

---

## 6 · What is generated and what stays code-drawn

**The rule that decides it: anything the maths depends on is exact; everything else is painted.**

| exact (code) | painted (generated) |
|---|---|
| the rotation angle | the rafter / beam material |
| the polygon paths | the sheet-metal texture clipped by them |
| the fold axis + mirror | the site, the sky, the crew |
| the set square's 90° | the set square's *look* |
| the rain's behaviour (steered by the answer) | the gutter, the tiles |

### Asset manifest

**Free — already in the repo, registered, zero credits:**
- `foreman_bear_side.png` + `foreman_bear_walk.png` (12 cells, fps 9) — the foreman
- `driver_badger_side.png` + `driver_badger_walk.png` — the delivery, if a round wants one
- `milo_side.png` + `milo_walk.png`

**Generated so far: Slate's sheet + 3 sites ≈ 16 credits. Remaining ≈ 22.**

| # | file | what | status |
|---|---|---|---|
| 1 | `backgrounds/ang_roof.jpeg` | a stone cottage with its **roof off** — the gable open to the sky, so the scene is visibly waiting for the child's rafter. Slates + mortar tub left, ladder + sawhorse right. | ✅ **generated** · 135 KB · value 0.754 → **graded to 0.533** |
| 2 | `backgrounds/ang_bridge.jpeg` | a timber footbridge over a stream, deck bare, handrail posts unfinished. Rope + barrow left, planks right. | ✅ **generated** · 159 KB · value 0.573 → **0.531** |
| 3 | `backgrounds/ang_shelter.jpeg` | four bare posts with **nothing on top**, dry-stone wall behind. Bench left, boards right. | ✅ **generated** · 191 KB · value 0.642 → **0.537** |

All three are **1376×768**, matching every existing backdrop exactly, and all three measure
**100% walkable at every candidate ground line (0.78–0.90)** — no water and no sky where feet land.

⚠️ **All three needed grading.** Measured raw they were **0.754 / 0.573 / 0.642** against a cast at
**Slate 0.539 · foreman 0.597** — the `grocery_sweets` fault, which turns the cast into cut-outs on a
blank page. A highlight-weighted gamma brought all three under 0.539 while barely touching the
midtone ground the cast stands on. See chapter-craft.md for the general rule.

⚠️ **Two of the three failed on the first pass and the cause was mine** — I attached the foreman's
sprite as a second reference alongside the backdrop, and the model **composited the bear into the
scene** and copied the reference wholesale. Both rules are now in chapter-craft.md. The retry used
one reference, named the reference's own motifs as negatives, and gave each scene **a hole where the
child's answer goes**.

### Still to generate

| # | file | what | cr |
|---|---|---|---|
| 4 | `objects/ang_beam.png` | a single straight timber beam, **flat side-on, no perspective**, square ends | 1.5 |
| 5 | `objects/ang_square.png` | a carpenter's set square, side-on | 1.5 |
| 6 | `objects/ang_sheet.png` | a flat sheet-metal **texture tile** (for clipping panels) | 1.5 |
| 7 | `objects/ang_bolt.png` | a bolt / fixing plate | 1.5 |
| 8 | `objects/ang_gutter.png` | a gutter section | 1.5 |
| 9 | `objects/milo_crank_walk.png` | **image-to-video** off `milo_side.png`: Milo winding a handle, 12 cells — the band's first drawn work cycle | 7.5 |

**Generation rules that have each cost real credits:**
- ⚠️ **Reference this chapter's own accepted scenes, not the oldest art.** The craft doc used to name
  `pond.jpeg` / `forest_*.jpeg` as backdrop references and **those two files are flat vector** — the
  exact style the style rule forbids. Reference `fit_station.jpeg` + `depot_yard.png` (painted,
  accepted, deployed). Verify each returns 200 before attaching: `media_import_url` fails silently on
  a 404 and the model then generates from text alone.
- ⚠️ **A near-empty backdrop is correct here**, not a failure. The frame fills the middle. What
  separates an accepted scene from a rejected gradient is brush texture, one hard wall/ground line,
  and two to four painted objects **at the edges**.
- ⚠️ **The beam must be flat side-on.** A beam drawn in perspective, rotated, stops being a beam.
- ⚠️ **Measure before shipping:** value ≤ Milo's 0.705, hue or saturation clear of the beam's tone,
  ground line read by EYE against the crew's feet (a roughness scan can reject a line, never find one).
- ⚠️ **Cut sprites by corner-seeded flood fill**, not a global colour key, and crop to the **ink box**.

---

## 7 · Interactivity — the control

**One control shape, both jobs** (TickTock's rule):

```
   ANGLE round:   ◀ turn        Fix it ✓         turn ▶
   FOLD  round:   ◀ turn   Mark ✓   Fold it ✓    turn ▶
```

- Tap-only. `◀ ▶` step 5° / to the next candidate axis.
- **≥ 44px targets at 640×320.** The world yields to the tap targets, never the other way round —
  derive the ground line from the band left over (`groundOf(vh)`), do not pick a percentage.
- ⚠️ **Read the count in an effect, not in the handler that set it.** A batched pair of taps
  announces the wrong count otherwise — this repo has met that shape five times.
- ⚠️ **`RotateGate` mounted, early return BELOW every hook**, or turning the phone changes the hook
  count and React tears the chapter into the error boundary. Delete the `short = vh < 470` path it
  replaces.

**The cumulative arc lives OUTSIDE `SkillBeat`**, driven by `onRound` — a run strip of finished
pieces across the top. `SkillBeat` rebuilds its contents every round, so anything inside it resets.

---

## 8 · The gate

New `src/__tests__/angleShopGeometry.test.ts`, driving the **same exported functions the scene
renders from** (not a second copy of the constants):

- every tier's angle pool grades to the kind it claims; `right` is reachable on a 5° step
- **no `kind` round is winnable by leaving the arm where it started** — the start angle is always the
  wrong kind
- the true axis set for each shape matches the geometry (square 4, rectangle 2, equilateral 3,
  isosceles 1, pentagon 5, hexagon 6)
- **every candidate axis is reachable** by stepping, and the distractor count ≥ 1 for every shape
- the miss line never contains the answer (a number or a kind word)
- **the guide is absent at L3 and present at L1–L2**
- layout sweep: 10 sizes × 3 sites — the arm never crosses the prompt band or the controls; the
  foreman's bubble never covers the arm or a tap target; nothing under 44px
- `coverage` withholds the mastery exit until both types are asked

**Then mutation-test it**, and tell an inert mutation from a missed regression. Plant at least: the
degree readout back during S3 · the guide left on at L3 · the run strip appending on load ·
`ownsFeedback` removed · a fold axis dropped from a shape.

---

## 9 · Build order

| # | step | note |
|---|---|---|
| 1 | **Founder signs off on this storyboard + the 3 sites** | art direction is the founder's call |
| 2 | Generate the 8 images + 1 cycle (~20 cr) | measure value/hue/ground line before wiring |
| 3 | ✅ **DONE** — `angleShop.ts` | jobs, grading, axis sets, words, layout. Everything the gate needs, outside React |
| 4 | ✅ **DONE** — `angleShopGeometry.test.ts` | **32 tests, 10/10 planted regressions caught.** Written before the scene |
| 5 | `AngleShop.tsx` — the six shots | delete `AngleScope.tsx`; `?ch=angles` unchanged |
| 6 | Drive it at 1280×720 **and** 640×320, through a **scored** round | the demo renders outside `SkillBeat` and cannot show the `position:fixed` class of bug |
| 7 | `public/sw.js` version bump, then deploy | |

**Cost:** medium — the closest existing instrument in the repo is TickTock's two-stepper
(`clock.ts`), and the cast and travel engine are free.

---

## 10 · Stated rather than hidden

- **The fold job's candidate-axis snapping means a determined child could try every candidate.**
  That is not a leak: trying each candidate and judging it *is* what "find the lines of symmetry"
  means at this level. What stops it being free is that **marking gives no feedback** — they still
  have to decide which ones held, and they commit the whole set at once.
- **`degrees` at L3 asks for an exact figure with no readout.** The set square is gone by then, so
  the child is estimating against a remembered right angle. That is the intended difficulty; if it
  measures as too hard on a real run, the lever is a **coarser tolerance**, not a readout.
- **Three sites is the minimum that satisfies consecutive-rounds-differ.** If ten rounds read as
  repetitive, add a fourth — do not make the sites all-distinct, which is what once put a fence on a
  pond.
- **Nobody has watched a child play any of this.** Every fault in this band so far has been found by
  the founder looking at a screenshot, or by driving it — not one by a type-check.


---

## 11 · What the gate covers, and what it structurally cannot

`src/features/chapters/story/angleShop.ts` + `src/__tests__/angleShopGeometry.test.ts` —
**32 tests, and every one drives the same exported function the scene will render from.** A gate
that carries its own copy of a rule cannot see that rule being removed.

**Mutation-tested, 10/10 caught:** guide left on at L3 · a fold axis dropped from the hexagon · the
arm allowed to start ON the answer · candidates reduced to the shape's own axes · fold graded on the
COUNT instead of the SET · a miss line naming the wanted kind · the tap-floor clamp removed · exact
figures allowed at every tier · the start angle allowed to be a nudge away · the L1 ask stating the
figure.

⚠️ **One survivor, and it was a gap in the SWEEP rather than an inert clamp.** Removing
`Math.max(TAP_MIN, …)` passed, because the clamp only BINDS below ~282px of height and the shortest
size in the list was 320 — so the backstop was being trusted, never exercised. A 667×375 landscape
phone minus iOS Safari's chrome (~95px) genuinely lands there, so `667×290` and `640×270` are in the
sweep now and the mutation fails. **Same shape as MeasureIt's missing narrow-but-tall sizes.**

### ⚠️ What no pure module can reach, stated rather than discovered later

These are real risks and they are **component state**, so they will be green in this suite whatever
the scene does. FitOut shipped a chapter that died on one wrong answer with 30 green tests for
exactly this reason.

| not covered | why it matters |
|---|---|
| the degree readout appearing during S3 | the hot/cold fault — the whole reason the chapter works |
| the week strip appending on round LOAD | prints the answer to the question still on screen |
| `ownsFeedback` removed | the shared centred pill lands on the thing being read |
| the commit button changing at the right angle | chapter 4's green Ready button |
| a wrong answer leaving the board dead | FitOut's `settled` never reset |

**Each of these needs a source check anchored on real code (comments stripped), or a live drive of a
SCORED round** — the demo renders outside `SkillBeat` and cannot show the class of bug at all.


---

## 12 · What driving it found that the gate could not

Four faults, all in the half a pure module cannot reach, all found by looking. **The 36 gate tests
were green for every one of them.**

| # | fault | why no gate saw it |
|---|---|---|
| 1 | **`AngleShop.tsx` and `angleShop.ts` are THE SAME FILE on macOS**, so the registry's import resolved to the pure module and `next build` failed on a missing default export | a case-insensitive filesystem; the craft doc records this exact trap and I walked into it. The module is `angles.ts` now, matching `clock.ts` / `market.ts` / `slice.ts` |
| 2 | **the story and the requirement contradicted each other** — *"Make the approach ramp SHARPER than a square corner — a barrow has to get up it loaded"*, which is backwards | `because` was fixed by the job and `want` drawn from the tier pool, so they disagreed on some seeds. Leaderboard shipped the same class. **The story fixes the KIND now and the tier picks only how near 90 it sits** — TickTock's structure — and it is gated |
| 3 | **the arm ran off the top of the screen** (`beamRect.y = −9` at 100° on the roof) | the bands were all correct; the arm's REACH depends on the ANGLE, which `shopLayout` cannot see. Now bounded in the module against every reachable angle × site × size, and swept |
| 4 | **the bubble overran its reserve and sat on the arm at 640×320**, and the arm collapsed to a 21px band | the bubble is `position: fixed` with no height bound, so longer text crossed `frameTop`; and the arm was derived FROM a vertex the site preferred, so on a short frame the site's high vertex and the missing headroom fought and the arm lost. **The arm is sized first and the vertex pushed down to fit**, and a short frame gives the WORDS more reserve, not less |

⚠️ **Fault 4 is why the gate now asserts the arm as a SHARE of its band (≥0.35), not just ≥48px** —
46px passed the absolute floor and was unreadable on a 320-tall frame. A floor in absolute pixels is
not a floor.

### Verified live, in a SCORED round

- turned 105° → 60° and **`hasDegText: false` the whole way** — rule 1 holds
- committed, graded correct, advanced to round 2 (a fold round, four-button control)
- **week strip empty with round 1 already finished** — rule 3 holds, it cannot print the open answer
- the rain plays on the consequence beat
- buttons 100×131–172 at 1280, no h-overflow at either size, 0 console errors

### Still not covered

**No full ten-round run, no re-teach seen fire, no mastery exit, and no scored FOLD round played
through to its verdict.** The fold animation is verified in the demo and the grader is gated, but
not together in a scored round — which is precisely the gap that hid FitOut's dead board.
**And the roof's beam still reads as crossing the cottage face rather than sitting at the ridge**;
the bridge composes correctly, so this is one site's `vx`/`vyUp` wanting an eye, not a structural
fault.
