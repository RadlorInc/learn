# Chapter craft — answering with the camera

The AR half of [chapter-craft.md](chapter-craft.md). **Read this before building or changing an AR chapter** (Factor Lab · The Angle Shop · The Fitting Crew · The Fundraiser · The Long Level · The Pizza Counter · The Coin Tray). Not needed for a tap-only chapter, which is why it lives here and is not auto-loaded.

## 5. Answering with the camera

Everything below was paid for building the 9–11 Factor Lab, the band's first chapter answered with a
webcam. Reference: [FactorLab.tsx](../src/features/chapters/story/FactorLab.tsx) +
[factors.ts](../src/features/chapters/story/factors.ts), gated by
[factorLabAr.test.ts](../src/__tests__/factorLabAr.test.ts).

**The camera earns its place only where the gesture IS the skill.** A pinch used as a cursor is a
mouse with extra steps and a permission prompt. Fingers work for factors because *a number of raised
fingers is a divisor* — the child holds up 3, the bench deals 12 into 3 rows, and it fills or it
does not. Before reaching for a camera, finish §0a: if the verb does not need a body, do not use one.

⚠️ **A CONTINUOUS INPUT MAKES A LIVE MANIPULATIVE INTO A YES/NO ORACLE.** This is the repeatable-commit
fault (§0a) at 60fps. A bench that reflowed as the fingers changed would let a child sweep 2, 3, 4, 5
and stop when it went flush, having worked nothing out. **The surface does not deal until the child
commits**, the commit is holding still for ~1.2s, and it happens once per scored round. In an EXPLORE
beat, where nothing is asked, live reflow is right — that is the teaching-vs-measuring line again.
Corollary: the live readout may say **what was read** ("3") and must never say whether it is right.

⚠️ **AN INTENTIONAL ZERO AND AN ABSENT HAND ARE THE SAME PIXELS, AND ONLY ONE OF THEM IS AN ANSWER.**
A fist means *nothing divides this, it is prime* — and a child lowering their hand also extends zero
fingers. Without hand PRESENCE reported alongside the count, putting your hand down commits "prime".
`useFingerCounter` reports both; nothing commits while `hands === 0`.

⚠️ **AND WHETHER ZERO IS AN ANSWER IS A PER-CHAPTER FACT WITH TWO CONSEQUENCES THAT MUST AGREE.**
The two live chapters take opposite guards, deliberately: The Pizza Counter accepts no zero (a fist
means nothing, so `ready: hands > 0 && count > 0`), while The Coin Tray's whole point is that `0.6`
is six dimes and a FIST and "seven hundredths" is a fist and seven pennies (`ready: hands > 0`, count
may be 0). **Pick it from the answer space, then make the TAP PAD mirror it** — a pad starting at 1
makes rounds unanswerable by tap that the camera can answer, and a pad offering 0 where 0 can never
be right is a permanently-wrong button the camera path does not have. Both are one line, and a gate
can assert the pair.

⚠️ **A GESTURE SURFACE DOES NOT RESET BETWEEN ROUNDS THE WAY A TAP SURFACE DOES.** A tap is consumed;
a hand is still up when the next question opens. Caught on the first drive: the guided round appeared
already reading 5, which was its answer, so it was about to score a round the child never played.
**The reading held over from the previous round is not an answer** — require a fresh change (a
different count, or the hand leaving and returning) before the commit can arm.

⚠️ **COMMIT ON A TIMER; ANIMATE ON rAF.** `requestAnimationFrame` is frozen outright in a backgrounded
tab, so a dwell driven by it never fires — untestable headlessly, and on a real device it stalls the
moment the child switches away and back. `setTimeout` fires either way (throttled, which is fine).
Use rAF only for the progress ring, which is allowed to pause.

⚠️⚠️ **AND THE FIRST TEST IS WHETHER THE BODY CARRIES THE IDEA OR ONLY THE NOTATION.** Every AR
chapter here that works passes it: a sweep across the frame IS division as repeated subtraction, a
tilted forearm IS the ramp, N raised fingers ARE the divisor. The Fundraiser's air-written digit does
not — a nine-year-old already knows how to write a 4, and writing it in the air is *harder* and means
nothing more, so the camera is being used as a worse pen. Every misread is then pure friction with no
learning in it, which is why three sessions of recognizer work could not rescue it and the founder's
verdict was *"its not recognition bro"*. **Place value is written notation and nothing about it is
physical** — the honest answer for that chapter is a gesture where the position of the hand IS the
column and the fingers ARE the digit, so the same pose in two places means two amounts. Ask of any
proposed reading: **does it make the IDEA more vivid, or only make the input harder?**

⚠️⚠️ **AND THE SECOND TEST IS WHETHER THIS BAND'S HANDS CAN ACTUALLY PERFORM IT — AN HONEST GESTURE
CAN STILL BE THE WRONG MOTOR SKILL.** The Fundraiser's grab was a thumb-and-index PINCH and the
founder replaced it: *"pinch sahi naii hai"*. It passes every test above — the hand's position is the
place, the drop chooses the column — and it asks a nine-year-old to hold two specific fingertips
within a third of a palm of each other **while moving their whole arm across the screen**, read from
the two noisiest landmarks MediaPipe produces. That is fine-motor work layered on top of a gross-motor
one, and the two fight. **Closing the WHOLE HAND is what a child already does to pick something up**,
it is unmistakable at any camera distance, and it cost nothing to change: the state machine, the
hysteresis, the sustained release and the lost-frame grace were never about *which* fingers were
closing — only the ratio they are computed from moved.
- ⚠️ **AND THE THRESHOLDS DID NOT HAVE TO MOVE WITH IT, WHICH IS ARITHMETIC RATHER THAN LUCK.** The
  physical range is simply different in the same place: a fist puts every fingertip ~0.3–0.4 of a palm
  from the middle knuckle, a relaxed hand ~0.55–0.65, an open hand ~0.8–0.9. Work out the new range
  before assuming a re-tune — a Schmitt pair is about where the poses SIT, not about the pose's name.
- ⚠️ **A GROSS-MOTOR READING IS ALSO QUIETER, AND THAT IS FREE COVER.** Averaging four fingertips
  instead of differencing two roughly quarters the residual after the EMA (~±0.02 against ~±0.09 in
  ratio units here), so the same band went from about two residuals of cover to nine.

⚠️ **THE POINT THE CHAPTER AIMS WITH MUST SIT ON A PART OF THE HAND THAT DOES NOT MOVE WHEN THE
GESTURE FIRES.** This is the shadow-outran-the-feet rule in the detector: a pick-up and a drop are
decided at the two instants the hand CHANGES SHAPE, so a carry point taken from the fingers jumps
exactly when it must not. It was tolerable with a pinch (a few percent of the frame, paid for with a
bigger tile) and is not with a fist, where every fingertip travels most of a palm length on the way
in. Read the knuckle — the same rigid-palm argument `palmTilt` and `pinchRatio`'s divisor already
rest on. The tile can then stop growing to cover for it.

⚠️ **A COMMIT IS A ONE-WAY EVENT, SO IT IS STABILIZED AND EDGE-TRIGGERED — UNLIKE A LEVEL THE CHILD
WATCHES.** A grab can be reported raw: the tile is either in their hand or it is not, they can see
which, and a one-frame blip corrects itself on the next. A commit grades the board, so one
mis-detected frame puts a half-built answer up. Two guards, and they are different things:
- **SUSTAIN it in the detector** (a few consecutive frames), so the consumer only ever sees a settled
  answer; and
- **fire on the RISING EDGE in the chapter**, which is the held-over-pose guard this band has now met
  on the count, the tilt, the grab and now a pose. A commit gesture left held across a round boundary
  would otherwise grade the next board the instant its last digit landed.
⚠️ **And gate it on the round STATE as well** (here: only when the board is full), which is what stops
the commit and the grab ever being live at the same moment.

⚠️ **TWO POSES THAT SHARE A HAND SHAPE MUST BE SEPARATED ON AN AXIS NEITHER OF THEM USES.** A fist and
a 👍 are both closed hands, so if the grab reading averaged the THUMB in, striking the commit pose
would move the grab reading and the two would fight. The thumb closes ACROSS the fingers rather than
into the palm, so it barely moves between a fist and an open hand — leaving it out of the grab costs
nothing and buys the whole second gesture. **Ask which part of the hand your reading is not using
before you add a second pose to it**, and gate the check both ways round: a grabbing fist must not
read as a commit, and an open hand must not either.

⚠️ **WHERE THE HAND IS A CURSOR OVER THE WHOLE BOARD, MAP THE MIDDLE OF THE FRAME — NEVER ALL OF
IT.** This is `SWEEP_ARM`'s silence written as a constant. A seated child moves a pinched hand
comfortably through the middle of the picture and has to lean out of shot to touch either end, so a
column mapped to frame x ≈ 0 is a column they can never post a digit into — and on a place-value
board the outer columns are the thousands. Stretch the middle band (`REACH` ≈ 0.72) over the whole
screen and clamp past it, on BOTH axes: the tray sits at the bottom of the screen, so a child who has
to drop their hand out of frame to reach it cannot pick anything up either.
⚠️ **And gate it by sweeping the reachable band only — see §4, the clamp tautology.**

⚠️⚠️ **A DROP TARGET MUST BE BIGGER THAN THE HAND'S OWN JITTER, AND THE JITTER GROWS WITH THE
SCREEN — SO "AIM AT ONE OF THESE" ONLY WORKS WHEN THE TARGETS SPAN THE FULL WIDTH.** This killed a
whole gesture design and it is three lines of arithmetic to check first. MediaPipe's palm wanders
~±0.02 of frame width; `reachSpan` stretches the reachable 0.72 band onto the whole viewport, so it
arrives as **±0.028 · vw — ±18px at 640 and ±36px at 1280.** Measured against The Supply Run's bench,
whose receivers sit 26–224px apart depending on size and how many the round draws, **34 of 36 size ×
reading × count combinations came out unhittable, worst 0.48×** — and it does NOT improve on a big
screen, because the jitter scales too. The Long Level's checkpoints work only because there are six
of them across the FULL width (±45px catch at 1280). **Compute `catch ÷ jitter` before designing an
aim; want ≥ ~1.5×.**
- **The tension is structural, so do not expect to tune out of it.** A bench that has to hold two
  dozen countable units AND up to seven receivers produces narrow receivers by construction, and
  buying target width by widening the gaps costs unit size — which is the worse fault (*a pile a
  child cannot count is a wrong answer the chapter caused*).
- **The way out is to PASS THROUGH a target instead of hitting one.** Jitter perpendicular to the
  travel does not matter and along it you are moving hundreds of pixels, so precision stops being a
  requirement at all. The Supply Run's crossing deals as it passes each receiver: same arm movement,
  but the hand's POSITION now means something, a half crossing visibly leaves some receivers short,
  and no target has to be aimed at.

⚠️ **AND A DEV DRIVE HOOK THAT UNDER-COVERS A CHANGED GESTURE IS THE SAME FAULT AS ONE THAT LIES,
ONE STEP QUIETER.** `__miloSweep` jumps straight to the fire, which WAS the whole of a sweep while a
crossing dealt instantly at the far side; once the crossing itself started dealing, everything
between arming and firing became unreachable and a drive would have verified only the last frame of
the thing that changed. **When you change what a gesture does, check the hook still reaches all of
it** — and if the real reader emits a SEQUENCE the hook collapses into one read (here: arm, then
fire, two frames), say so where the hook is defined, because the drive will otherwise reproduce a
"bug" the product does not have.

⚠️ **THE HIT-TEST AND THE RENDER MUST BE ONE GEOMETRY.** A row of things a finger taps and a pinched
hand aims at is a fact two separate pieces of code need, and a hit-test carrying its own copy of the
row's arithmetic is *the gate that re-implements a rule* with the two halves of one FEATURE instead of
a test and its source. It drifts the first time the row moves, and the symptom is the worst one a
camera chapter has: **a child pinching a thing in plain sight and picking up nothing.** Export one
layout function and drive both from it.

⚠️ **OPENING YOUR FINGERS OVER NOTHING PUTS THE THING BACK — it must never fall into the nearest
target.** Something landing where the child did not aim is a wrong answer the chapter caused, which is
the same asymmetry `stepPinch` confirms its release over three frames for. The catch area around a
target is deliberately LOOSER than it is drawn (a pinch wanders while the fingers open) — but the
tolerance goes on the axis that is not the choice, and in the axis that IS the choice it may never
reach past the halfway line to the next target.

⚠️ **AND THREE THINGS PINNED SEPARATELY WILL COLLIDE SOMEWHERE — PUT THEM IN ONE ROW.** The
cross-every-layer rule above, met again and worth the recurrence: an instruction chip and two action
buttons, each correctly placed on its own, produced *three* different collisions across two frame
sizes (the commit drawn on the self-view at 1280×720, the undo on Milo's leg, and at 640×320 the chip
drawn across both buttons). Every tap still landed, which is exactly why only crossing them finds it.
One flex row cannot overlap itself, and it also answers *which of these gives on a short frame*: the
buttons are tap targets and may not shrink, so the WORDS wrap.

⚠️ **A CAMERA-ONLY CHAPTER OWES AN HONEST DEAD END.** A declined permission or a device with no camera
must get a written explanation with a retry, not a blank screen — and *"Milo needs to see your hands"*
is the whole of it. Note the cost out loud when choosing camera-only: that child cannot play at all.

⚠️ **BETTER STILL: ONE INSTRUMENT, TWO INPUTS, ONE GRADER — and the fallback costs less than it looks.**
FactorLab shipped camera-only and the founder later reversed it, which sounded like doubling the work
and was the opposite: the AR layer does not *answer* the question, it **sets the same value a tap
sets**, and both land in one `commit(value)`. So there is one grader, the existing sweep covers both
paths at once, and four things fall out for free — the camera stops being a wall (no device, no
permission, a parent who says no), the MediaPipe download happens only on opt-in so the app stays
local-first, and the legal surface shrinks from *mandatory* to *offered*. Remember the pick per
DEVICE (`infra/storage/handInput`, the `voicePref` pattern): "no camera" is a household answer, not a
per-learner one, and both doors are offered every time — the remembered pick decides which is the big
button, never which is the only one.
⚠️ **The two paths must commit DIFFERENTLY, though.** A tap is CONSUMED; a hand is still up when the
next question opens. So the camera's two guards — hold still, and ignore the reading held over from
the last round — have nothing to protect against on a tap, and pushing a tap through them **silently
swallows it** whenever its value matches the held-over reading. A tap calls `commit` directly. Keep
the dwell hook called unconditionally and merely not live: branching above a hook changes the hook
count and tears the chapter into the error boundary.

⚠️ **AND "BOTH DOORS, EVERY TIME" MEANS THE INTRO CARD, BECAUSE `CamGate` RENDERS ONLY ON THE CAMERA
PATH.** It fires on `onCam && !camReady`, i.e. it is the *camera's* failure screen — so on the tap
path there is no gate, and if the intro offers a single button then a device that once tapped
*"Tap instead"* has that remembered and **nothing anywhere in the chapter ever offers the camera
back**. Shipped in The Fundraiser; the founder simply never saw the camera again. Every AR chapter's
intro carries a primary button and a quiet second one, and the remembered pick decides which is the
BIG button, never which is the only one. ⚠️ **The primary button also has to `start()` the camera** —
nothing else in the chapter does, so without it the camera path opens on *"the camera did not start"*.

⚠️ **ADDING AN INPUT MEANS RE-WORDING EVERY LINE THAT NAMES A GESTURE — AND A SINGLE-MODE GATE CANNOT
SEE THE MISS.** Every chip, spoken line and nudge in FactorLab said *"hold up that many fingers"*.
With a tap path added they still read perfectly — **for somebody else's surface**, which is the 12–14
audit's headline defect (nine chapters saying "crank the gear" with no crank on screen) arriving
through a new door. The wording is not wrong, so nothing fails; it just addresses the wrong child.
Render zone 3 from ONE input-aware function rather than baking a gesture into the round, sweep the
rule over **both** modes (`for (const i of INPUTS)`), and assert positively in each direction — the
tap chip must NOT match `/hold up|fingers/` and the hand chip must NOT match `/tap/`. Without that
last pair a renderer that ignores its input passes every other check. **Zones 1 and 2 never change**:
the story and the maths do not know how the child answers.

⚠️ **AND THE CHARACTER IN THE CORNER IS A LAYER — CROSS IT WITH THE ANSWER SURFACE.** Moving the answer
into the bottom band put Milo (`PtMilo left={9}`) squarely over the **✊**, which is the prime answer,
i.e. the one button a child must be able to find. The tap still landed, because he is
`pointerEvents: none` — so no click-through probe, no console error and no gate could see it; only
measuring his box against the pad's did. Give him a lane and centre the surface in what is left.
⚠️ **The same measurement caught a wrap that was clearing the bench by luck**: eleven buttons sharing
a flex row with a "continue" control ran onto two rows at 640×320 and stopped 8px off the bottom edge,
inside a reserved constant that happened to be big enough. **A control that shares a row with the
answer surface steals width from it** — give the surface its own row, keep the tap floor at 44px and
let the GAP give, so its height stays predictable rather than merely lucky.

⚠️ **FULL SCREEN IS NOT AUTOMATICALLY BETTER — ASK WHAT IT BUYS, AND BE HONEST IF THE ANSWER IS
DIAGNOSTIC RATHER THAN PEDAGOGICAL.** The Fundraiser goes full screen because its hand is a CURSOR
and a corner panel makes the child glance between their hand over there and the board over here.
Factor Lab's answer is a SCALAR — the hand's position means nothing at all — so that argument does
not apply and the chapter's own source argued the opposite (*"the ring carries the reading; the
self-view only has to answer can-the-camera-see-me, which a thumbnail does"*). It is still worth
doing, for a different reason: **full screen is where a MISREAD becomes readable.** A hand half out
of frame or backlit is why a held-up 5 counts as 4, and no thumbnail shows that.
⚠️ **AND THE THUMBNAIL WAS ALREADY TOO SMALL TO DO ITS ONE JOB, WHICH IS THE MEASUREMENT THAT
SETTLES IT.** The overlay draws numbered chips at R = 18 with a 46px offset; the short-frame panel is
**76px wide**, so the chips were geometrically larger than the panel that had to contain them and
were clipped away entirely. A panel smaller than the thing it exists to show is not a small panel, it
is an absent one. **Measure the overlay against the panel before defending the panel.**

⚠️⚠️ **AND THE OVERLAY'S COORDINATES BREAK UNDER `objectFit: cover` EXACTLY AS A PAINTED GROUND LINE
DOES.** A landmark is a fraction of the CAMERA FRAME; the overlay is drawn in pixels of the BOX. In a
4:3 panel showing a 4:3 stream those coincide, which is why `y * clientHeight` survived as long as
there were only corner panels — and a full-screen 16:9 box scales the same stream to the WIDTH and
crops top and bottom, so every marker drifts vertically by up to ~120px at 1280×720. The repo's own
rule, one layer along: **map through the transform the picture is actually drawn with.**
```
scale = max(W/vw, H/vh) · dw = vw·scale · dh = vh·scale · ox = (W−dw)/2 · oy = (H−dh)/2
sx = ox + x·dw          sy = oy + y·dh
```
It is the identity in a matched panel, so nothing that already ships moves. **Do this rather than
hiding the overlay** — hiding is right only for a chapter that already draws its own cursor, where
two dots in two places is worse than one.

⚠️ **AND A RESERVE FOR THE CORNER PANEL MUST GO WHEN THE PANEL GOES.** `max(base, CAM_W·0.75 + …)`
reserved 184.5px on a roomy frame for a thing that is now `inset: 0` — 32px of the bench's height
spent on nothing. Grep every band, floor and clamp that mentions the self-view.

⚠️ **THE PERMISSION IS A PRODUCT DECISION BEFORE IT IS A TECHNICAL ONE.** `Permissions-Policy` ships
`camera=()` by default here and the grant was deliberately revoked once already when the `/play` AR
track was deleted. Turning it back on for a children's product is the founder's call, needs the
open COPPA/privacy conversation, and the comment above the header must name the ONE feature that
justifies it so the next audit can revoke it again when that feature goes.

⚠️ **A WEBCAM CANNOT BE DRIVEN BY A GATE, SO THE PURE MODULE CARRIES MORE THAN USUAL — AND A DEV DRIVE
HOOK IS NOT OPTIONAL.** Put the ladder, the grader, the demo beats and the layout maths outside React
and sweep them; then add a dev-only `window.__miloFingers(n, hands)` (FloorPlot's `__miloPace` pattern,
gated on `NODE_ENV !== 'production'` and verified absent from the emitted JS) that stands in for the
camera AS WELL AS the hand — otherwise the permission gate blocks every headless drive and nothing
past the intro is ever verified.

⚠️ **COUNT THE FINGERS BEFORE DESIGNING A READING AROUND THEM — A HAND HAS FIVE.** The 9–11 plan
specified "leftmost hand = tens, rightmost = ones → **0–99**", which reads as obviously right and
tops out at **55**. Measured against every answer The Fitting Crew's generator draws it reaches
**26 of 55**, only 39% of the chapter's hardest type — and it cannot state a plain **6**, because a
place would cap at one hand. **A round whose answer the surface cannot express is unanswerable**,
which is worse than a wrong one. The encoding that works is the two places as two WINDOWS: BOTH
hands make one digit (0..9) and the child enters the tens and then the ones. 100% reachable, no
generator change, and it is the better teaching anyway — *show me the tens, now show me the ones* is
place value performed. **Sweep every answer the generator can draw against the surface before
building it**, exactly as the ten-finger ceiling was swept.

⚠️⚠️ **AND THE HELD-OVER GUARD IS DEFEATED BY DERIVING ITS KEY IN AN EFFECT — A HAND THAT NEVER MOVED
THEN READS AS A FRESH GESTURE.** `useDwell` refuses the reading a child was already holding when the
question opened, and it does that by capturing the key on the round's FIRST render. So anything the
key is computed from must already be right on that render. The Rail Line derived "which halt is under
the hand" into `useState` from an effect: each round it began at `null` and was filled a paint later,
so the dwell saw `none → 3` — a change — from a hand parked motionless on the desk. Driven live, the
guided round was answered and then **rounds 2 and 3 answered themselves**, one of them wrongly, on a
chapter whose own gate was green. The guard was working perfectly; it was being handed a lie.
**Derive it during render** (`const aim = f(read, ref.current); ref.current = aim`), which is the same
rule this doc already records for a journey's phase and for the same reason: effects run after paint.
⚠️ And this is invisible to every pure gate — the guard lives in shared component state, so the only
thing that finds it is parking a hand and watching two rounds go by.

⚠️ **A GESTURE'S INSTRUCTION MAY HAVE NOWHERE TO LIVE, AND THE ANSWER IS THE QUESTION REGION RATHER
THAN A THIRD PIN.** Every state a gesture can be in needs words (the Supply Run), and the obvious
shape is a chip near the controls — which on a short frame is a new object competing for a band that
is already full. Measured at 640×320 on The Rail Line: stacked above the commit button it covered the
**km marker**, the scaffold the entire concrete tier rests on; moved to the top strip it covered **four
of the six name boards**, which are the answer surface. That frame had no free band at all (chrome
0–46, boards 59–92, rail 210, marker to 275, controls 265–309). The character's speech bubble is
already the one place the chapter puts words, so the hand's state goes there, ordered by priority —
verdict, then miss, then anything BLOCKING the gesture, then the question.
⚠️ **And it only speaks for the states where nothing can happen.** "No hand in frame", "hand too low",
"one leg still to go" are each a child doing something reasonable and seeing nothing move. When the
hand IS over a target something is already happening — the target rings, the cursor's arc fills — so
replacing the question with a sentence about the gesture spends the question to say what they can see.

⚠️ **A DWELL THAT RE-ARMS ON THE SAME POSE ENTERS IT TWICE.** Filling a second slot makes it tempting
to put the slot in the dwell's key so a repeated digit is enterable — and then advancing the slot
re-arms the hand that has not moved: driven on screen, answering **12** gave **11**, the ones landing
1.2 s after the tens off one held-up finger. Key on the READING alone, so entering a digit does not
restart the timer and one gesture is one digit. **A repeat then needs the hand to leave and come
back — which the guard already allows and nothing on screen says, so SAY IT** at the moment it
applies (`handHint`), or a child answering 33 holds three fingers at a dead surface.

⚠️ **A CONTINUOUS READING BEHIND A HOLD-STILL COMMIT NEEDS HYSTERESIS, AND ITS SIZE IS DERIVED FROM
THE NOISE RATHER THAN CHOSEN.** Quantizing a hand's tilt to the Angle Shop's 5° step puts a boundary
every 2.5°, which is the same order as MediaPipe's landmark noise on the palm — so a hand held ON a
boundary dithers between two answers for ever, the dwell resets on every flip, and the camera is a
dead button. A hand settled on step C sees raw values up to `STEP/2 + noise` away from C, so
suppressing ±2.5° needs a hold band of a **full step**: the reading changes exactly when the hand
reaches the next step's own centre. **0.62 of a step was the first guess and it flips.**
⚠️ **AND A TEST FOR IT MUST JITTER AROUND A BOUNDARY, NOT AROUND A CENTRE.** Jitter about a bucket
centre never crosses anything and passes with the hysteresis deleted — that version was written
first, proved nothing, and was caught only by mutation-testing the gate. Sweep the raw start across
the whole range at half-degree steps and assert the reported step never changes.

⚠️ **SMOOTH A CIRCULAR READING ON ITS DOUBLED ANGLE'S UNIT VECTOR, NEVER ON THE DEGREES.** A hand
held flat wobbles either side of horizontal, i.e. across the 0/180 seam, and a plain average of 179°
and 1° is **90°** — the wrong answer at exactly the pose a child is most likely to hold. EMA
`(cos 2θ, sin 2θ)` and halve the result back.

⚠️ **FOLD AN ANGLE READING TO [0,180): AN AXIS HAS NO HEAD OR TAIL.** It costs nothing and it is what
lets ONE reading serve two instruments — a beam at 200° IS a beam at 20°, and a fold line at 200° IS
the fold line at 20°. It also means "nearest" must be measured as an axis: 175° is 10° from 0°, not
170°.

⚠️ **THE HAND OWNS THE CONTINUOUS VALUE; TAPS OWN THE DISCRETE ACTIONS. THEY CANNOT SHARE ONE.** A
live hand writes the value every frame, so a stepper pressed beside it is overwritten before the
child's finger leaves the button. With the camera on, hide whichever control writes the value the
hand is writing — and keep the ones that are ACTIONS (mark, commit, undo), because those are not the
value. In the Angle Shop the tilt drives the beam and the fold bar; Mark ✓ and Fold ✓ stay taps.
⚠️ **AND WHICH CONTROL IS DRAWN MUST DEPEND ON WHO OWNS THE VALUE, NOT ON WHETHER THE INPUT IS
LIVE.** Liveness includes "not yet answered", so a row keyed on it flips the dwell ring back into
three buttons at the exact moment of the verdict — a reshuffle under the child's eyes, on the beat
they are reading. The row is already dimmed and dead by then; leave its shape alone.

⚠️ **A GESTURE DOES NOT SHIP ON A ROUND THAT GIVES IT NOTHING TO AIM AT.** The Angle Shop's tier-3
`degrees` rounds ask for exactly 85° with the set-square guide already retired and no readout
permitted while turning — a tilt held inside ±2.5° of an unmarked target for over a second is luck,
not knowledge. Those rounds keep the steppers, which ARE the exact instrument (each tap is a
countable 5°), and the hand answers the KIND question instead, which is what the chapter's anchor is
about. **Say so on screen when it happens**, or the hand looks broken on that round.

⚠️ **AND WHERE THE HAND WRITES A DERIVED VALUE, THE HELD-OVER-POSE GUARD NEEDS ONE MORE TURN THAN IT
DOES ON A RAW ONE.** Factor Lab's dwell watches the raw finger count, which is already current the
instant a round opens. The Angle Shop's watches `deg`, which is an ECHO of the hand and lags it by a
render — so the guard captured the round's `start` angle, the hand's own angle landed a render later
and read as a CHANGE, and the round committed a pose the child struck for the last question. Do not
arm until the hand has written once; then the guard sits on the hand's own value.

⚠️ **THE ANSWER SPACE IS 0..10 AND THAT IS AN INVARIANT, NOT A HOPE.** A round with no accepted answer
within reach is unanswerable, which is worse than a wrong one. Sweep every tier for it. Here it costs
nothing — every composite ≤ 100 has a factor ≤ 10, since the smallest factor is ≤ √n — so it RAISED
the chapter's number range rather than narrowing it. Check the arithmetic before assuming a ceiling
is a compromise.

⚠️⚠️ **A CONTINUOUS READING'S NOISE FLOOR DECIDES WHAT IT MAY BE ASKED FOR — COMPUTE IT BEFORE YOU
DESIGN THE ROUND, NOT AFTER.** This is `catch ÷ jitter` for a SCALAR rather than for an aim, and it
killed the plan's own verb for the measurement chapter. §8 asks for "hold your hands apart to SHOW a
length", which is a lovely gesture and cannot carry an exact number here:
- MediaPipe's palm wanders ~±0.02 of frame width, so a distance between TWO palms carries ~±0.028 —
  and stretched onto an answer scale through `reachSpan`'s 0.72 band that is ±3.9% of the range, i.e.
  **±2.3 inches on a 0–60 in scale.** Answers one inch apart are inside the noise, so a child who
  knows the answer cannot enter it: a dead button, which this doc calls the worst outcome there is.
- **And both hands have to be IN FRAME.** At a normal seating distance a webcam sees roughly nine hand
  widths across, so anything past about 22 inches cannot be shown at all — a whole region of the
  answer space that simply does not exist.
⇒ The gesture ships where it IS honest — an ESTIMATE, where no precision is wanted ("show me about how
long a foot is"), in the beat where nothing is scored — and the scored rounds keep the two-place
finger count. That is The Angle Shop's `job: 'degrees'` precedent, verbatim: *a gesture does not ship
on a round that gives it nothing to aim at*, and the hand answers the question it CAN answer.
⚠️ **Say the split out loud in the pure module and gate it**, or the next edit quietly wires the
continuous reading into play — `expect(playBlock).not.toMatch(/\.span/)` is one line.

⚠️⚠️ **BUT THAT VERDICT BELONGS TO THAT ANSWER SCALE, NOT TO THE GESTURE — RE-COMPUTE THE RATIO
BEFORE INHERITING IT.** The span above was refused for The Height Bar and is **scored** in The Empty
Plot, and the difference is arithmetic rather than nerve. The noise is the same either way: ~±0.028 of
frame width between two palms, over a hand width of ~0.111 of the frame (a webcam sees about nine
across), i.e. **±0.25 hand widths**. What changes is what a hand width is asked to BUY:

| chapter | scale | one step | noise | step ÷ noise |
|---|---|---|---|---|
| The Height Bar | 0–60 **inches** | 1 in | ±2.3 in | **0.4 — a dead button** |
| The Empty Plot | 1–10 **metres** of yard, at 1.5 m per hand width | 1 m | ±0.37 m | **2.7 — live, and better than the Angle Shop's tilt** |

So the question is never *"is a span precise enough?"* but *"how many of my answers fit inside the
noise?"* — and a coarse answer space can carry a gesture a fine one cannot. Three things come with it,
each already paid for elsewhere in this file: hysteresis of a **full step** (`snapMetres`), a sweep of
the whole answer space against the reachable band (`SPAN_MIN_HANDS`..`SPAN_MAX_HANDS`, or a round is
unanswerable), and the reading normalised by the child's own hand so no calibration step exists.

⚠️ **AND A SPAN NEEDS SOMETHING ON SCREEN THAT MOVES WITH THE HANDS, OR IT IS A NUMBER TYPED WITH THE
ARMS.** The dwell ring reports the reading, which is enough for a finger COUNT — five fingers already
look like five. A length does not: hands 40 cm apart mean nothing until the thing being measured sits
between them. The Empty Plot draws a dashed GHOST of the far edge at the live reading, so the plot
grows as the child opens their arms and the gesture is a length shown as a length. ⚠️ It says only
what was READ — never whether it is right — and it is gone the instant the peg is in, so it never sits
beside a verdict. Without it the body carries the notation and not the idea, which is the first test
in this file.

⚠️ **AND A SPAN IN FRAME FRACTIONS IS NOT A LENGTH — NORMALISE IT BY SOMETHING IN THE SAME FRAME.**
Lean back and every measurement shrinks together, so "show me a foot" would mean a different gesture
at every seating distance and would need a calibration step a child can get wrong. The child's own
HAND WIDTH is in the same frame and scales identically, so `span ÷ handWidth` is invariant to distance
and one nominal hand size turns it into inches. Measure the ruler **across the knuckles** (index MCP to
pinky MCP), for `palmTilt`'s reason: both landmarks are on the rigid palm, so the ruler does not change
length when the child opens or closes their fingers — and they will, because a hand held up to show a
width is not held in any particular pose.
⚠️ **Put the division behind an exported function the detector calls** (`spanRatio`), not inline in the
detect loop. Mutation-tested: with it inline, the only way to check it was for the gate to do the
division itself — a gate re-implementing the rule, which cannot see the rule being REMOVED. Dropping
`/ hw` left the invariance test perfectly green.

⚠️ **AND CHANGING THE VERB DOES NOT AUTOMATICALLY FIX A COIN FLIP — CHECK THE NEW ANSWER SPACE.** The
first cut of the pair test asked *"how many are left over?"*, which is 0 or 1: a gesture instead of a
chip, and still 50%, i.e. the exact defect the rebuild existed to remove. Asking for the pair COUNT
makes the child halve the number and lets even-or-odd fall out of the stranded unit on the reveal —
a consequence they watch rather than a label they recall. **Count the options your new surface really
offers.**

⚠️ **AND A GENERATOR'S SOURCE POOLS NEED THEIR OWN ASSERTION.** Mutation testing found that slipping a
composite into the PRIMES pool produces a perfectly valid factor round — so every round-level check
passes, while that tier's prime slot never fires and `coverage` can never see a prime. Export the
pools and assert they are what they claim; a round-level sweep structurally cannot see this.

### Writing a shape in the air — recognition, and the rule it hangs on

The Fundraiser's fourth reading is a digit written with the fingertip
([airDigit.ts](../src/infra/ar/airDigit.ts)). It passes §5's test for the same reason the pinch did:
the child is not pointing at an answer somebody else wrote, they are **producing** it.

⚠️ **A SHAPE THAT CANNOT BE READ IS "WRITE IT AGAIN", NEVER A WRONG ANSWER.** A recognizer that
misreads a correct 4 as a 9 marks a child wrong for knowing the answer, which is the worst outcome
an arithmetic app has — far worse than asking them to write it again. So the recognizer returns
`null` when it is not confident, nothing is graded, redrawing is unlimited and unpenalised, and the
chip says *"I could not read that"* rather than anything that reads as "no". Two consequences:
- **Show the read digit in the box BEFORE the commit.** That is not hot/cold — it says what was
  written, never whether it is right — and without it a recognizer error is graded silently.
- **Refusing is the correct direction to fail in**, so tune for it: measured against digits written
  with a realistic wobble, this refuses roughly 8 and 7 first under a strong slant and almost never
  misreads.

⚠️ **ONE DIGIT AT A TIME, NEVER A WHOLE NUMBER.** Segmenting four scrawled digits is a research
problem; one digit into one labelled column is a 10-way choice with the strokes already separated —
and the column is the point, because writing 3|4|8|2 is place value performed where one scrawl hides
it.

⚠️ **DO NOT ROTATION-NORMALIZE.** Every $1/$P-family recognizer rotates a candidate to a canonical
angle, which is right for gestures and fatal for digits: **6 and 9 differ by a rotation and nothing
else.** The cost is that a strong slant reads worse; the alternative is a chapter that cannot tell
6 from 9, which it is entirely about.

⚠️ **AND THE AMBIGUITY GUARD IS A RATIO BETWEEN THE TOP TWO, NOT AN ABSOLUTE DISTANCE — measured,
not reasoned.** The first cut argued a distance ceiling from the glyph's own size and set it ~10×
too loose; worse, junk and sloppily-written digits **overlap** on absolute distance (junk 0.035–0.093,
wobbly digits 0.02–0.058), so no threshold separates the two populations and one pretending to is a
comment claiming a rule it does not enforce. What rejects a scribble is that its best two matches are
the same distance away. **Sample the real distances before setting a threshold on them.**

⚠️ **PINCH IS THE PEN, AND THAT IS WHAT MAKES PEN-UP EXPRESSIBLE.** A pointing finger has no "off":
the child would have to leave frame to end a stroke, so a numeral with a lift in it (a two-stroke 4,
a crossed 7) could not be written at all. Pinching also reuses `pinch.ts` whole — its ratio
normalization, hysteresis and release confirmation — rather than inventing a second untuned detector.
**Re-read the whole accumulated shape on every pen-up** rather than after a settle timer: a lone
diagonal upgrades into a 4 for free, with no constant to tune and nothing firing mid-numeral.

⚠️ **A LIFTED PEN DOES NOT MERELY STOP THE INK — IT ENDS THE STROKE, SO A DROPPED-FRAME BURST DRAWS A
DOTTED LINE.** The ink joins consecutive points, so a line can only ever break at a stroke boundary;
what produced the founder's *"dotted stroke"* was the pinch releasing after `LOST_GRACE` frames with
no hand. Five frames is ~170–500 ms at the 10–30 fps this loop really runs, and **writing is exactly
when the hand is motion-blurred** — chapter-craft's own *detection loss is correlated with the
gesture*. Past the grace the numeral came out as disconnected pieces AND each spurious break fired
`onStroke`, handing the recognizer a fragment mid-write. **A pen wants a far longer loss grace than a
carry does**, and it costs nothing: a child who genuinely opens their fingers is caught by
`RELEASE_FRAMES` on a hand that is still THERE, so the grace never delays a real pen-up.

⚠️⚠️ **AND THE POINTS MUST BE WIPED WHENEVER THE BOARD MOVES ON — THIS IS WHAT "IT CANNOT RECOGNISE
WHAT I WRITE" ACTUALLY WAS.** The ink lives in a ref (it must — see below), so a committed digit left
the points in place and the next `onStroke` handed the recognizer the previous numeral AND the new one
**as one cloud**, which no template matches. Every digit after the first read as *"I could not read
that"*, for the rest of the run, since the pane is not remounted between rounds. ⚠️ **The wipe was an
upward `clearInk` ref that NOTHING EVER ASSIGNED** — a declaration, two callers, no setter, silently a
no-op. **Use a `resetKey` PROP the parent already owns, not a callback handed upward: a prop the
parent must pass cannot be left unwired.** And no gate reaches this — it is component state, and the
one drive that ever got to the camera path COMMITTED as its last action, so the state *after* a commit
was never exercised. **Drive one step past the last thing you think matters.**

⚠️ **THE CHILD WRITES ON THEIR OWN CAMERA PICTURE — NOT ON A BOX BESIDE IT.** The Fundraiser shipped
the ink on a white pane next to the self-view and the founder's verdict was *"screen pe sahi se
likhne naii jaa raha"*: with the hand in one place and the mark in another there is nothing to aim
at, so a numeral comes out wherever and a child correcting a stroke has no reference to correct it
against. Painting the ink over the mirrored self-view puts the mark on their own fingertips. Three
things follow and none of them is cosmetic:
- **The writing slot is 4:3**, because the nib is normalized to the video frame; a box of any other
  aspect paints the ink where the hand is not, and a square box cropping a 4:3 stream loses 12.5%
  off each side — the two edges a wide numeral reaches.
- **The `<video>` cannot move there itself.** It is mounted once for the whole chapter (a remount
  drops the stream, and the detect loop then measures a 0×0 element) while the writing rect is known
  only to the round on screen. The round posts its rect; the shell places the camera in it.
- **Ink drawn over a camera picture is BRIGHT with a shadow**, not the chapter's ink brown. Dark ink
  on a dark room is ink nobody can see, and you do not know what room the child is in.

⚠️⚠️ **AND A GESTURE NORMALIZED TO THE VIDEO FRAME IS IN 4:3 UNITS — ANY MATCHER COMPARING IT
AGAINST SQUARE TEMPLATES MUST BE HANDED SQUARE COORDINATES FIRST.** This is the one that was broken
in front of a child, and it is arithmetic rather than tuning: landmarks come back as fractions of the
frame, so equal PHYSICAL distances give an x-span only 0.75 of the y-span and every shape reaches the
recognizer a quarter too narrow. Measured over ten independently-written digit forms:

| coordinates | read correctly |
|---|---|
| square | **80 / 80** |
| the camera frame's own 0..1 (4:3) | **55 / 80** |
| the same, plus a real hand's shake | **42 / 80** |

⚠️ **It never once MISREAD — it refused**, which is why it looked like "the camera cannot see me"
rather than like a bug, and why no test caught it: every test in the recognizer's own gate writes its
forms square. **Convert at the boundary** (store the points in pixels of the 4:3 pane — pixels are
physically square) and assert the cost in the gate, or somebody simplifies the multiply away again.
The general form: **whenever a normalized reading crosses into something that assumes an aspect,
state which aspect it is in.**

⚠️ **AND USE `outline`, NEVER `border`, ON THE ELEMENT THE DETECT LOOP MEASURES.** A border shrinks
the content box, so the video and the overlay canvas sit 2px inside the element whose `clientWidth`
the loop maps landmarks with — every marker it draws then lands slightly off the hand, and an ink
overlay pinned to the outer rect diverges from the nib drawn on the inner one. An outline takes no
layout space, so what is measured and what is drawn are the same rectangle.

⚠️ **INK IS THE ONE READING WHOSE RESOLUTION IS THE ANSWER, so it is keyed RAW and the consumer owes
a ref.** Quantizing the nib the way every other continuous reading here is quantized draws a numeral
as a staircase. The deal is that `onRead` then fires at frame rate while a stroke is being drawn —
so the chapter pushes points into a ref and paints to a canvas imperatively, and calls `setState`
only when the pen LIFTS. Ink in React state re-renders the chapter ~30×/s.

### An EVENT gesture is a different animal from a held pose

Everything above assumes a reading you HOLD — a finger count, a tilt — which is why `useDwell` and
its held-over guard exist. The Supply Run's sweep (a hand crossing the frame, one crossing = one
deal) is an EVENT, and the differences are worth having in advance.

⚠️ **IT NEEDS NO DWELL, NO SMOOTHING AND NO HYSTERESIS BAND TUNED AGAINST ASSUMED NOISE.** A
traversal cannot be "still held": it happened or it did not. That deletes the whole class of
calibration the Angle Shop's tilt had to derive before its camera stopped being a dead button.

⚠️ **BUT IT STILL NEEDS A HELD-OVER GUARD, AND ITS SHAPE IS A COUNTER DIFFED AGAINST A MOUNT
BASELINE** — `useRef(read.sweeps)`, so a gesture completed while the previous verdict was on screen
is recorded as already-seen. Three further properties, each a bug if missing and none reachable by
playing:
- **Loop the GAP, do not act once per observed change.** `setRead` fires from a rAF callback and
  React may coalesce two into one render, so a counter that advances by two deals once and silently
  loses a gesture the child performed.
- **Advance the baseline OUTSIDE the loop and unconditionally**, which is what DISCARDS a swallowed
  event rather than queueing it. The commit no-ops while a verdict is up, and a wrong answer holds
  that for 2.4 s — so a baseline that only moved when the action landed replays three abandoned
  gestures onto a freshly reset board the instant it re-opens, as an answer nobody built.
- **Clamp BACKWARDS.** A counter is monotone within a DETECTOR session, never across a chapter:
  `useTaps` resets the whole reading and `start()` resets the detector, so one "Use taps instead" or
  one "Try the camera again" drops it to zero and a stranded baseline kills the gesture for the rest
  of the run.

⚠️ **A PER-FRAME DISTANCE CEILING CANNOT TELL A TELEPORT FROM A FAST HAND, AND BUILDING ONE FIRST IS
HOW YOU FIND OUT.** MediaPipe drops a detection and re-acquires the same hand elsewhere with no null
frame between, which reads as a traversal. The obvious guard is a step limit — and a teleport from
0.2 to 0.9 is 0.70 while a brisk one-frame crossing from 0.15 to 0.85 is 0.70 as well. Any ceiling
low enough to reject the artefact rejects a fast child on a throttled loop, i.e. a dead button on the
only gesture they have; the first cut here shipped a ceiling sitting UNDER the band it guarded, so a
hand crossing between the two thresholds in one frame was refused outright. **What separates them is
whether the hand was SEEN INSIDE the band** — a real crossing lands a sample there at any usable
frame rate, a teleport lands none — and that needs no constant at all.

⚠️ **BAND WIDTH REJECTS NOISE AND NOTHING ELSE, so a second guard has to cover intent.** Ten times
the landmark jitter means a still hand can never fake a crossing. It does nothing whatever against a
real arm movement that is not an answer: a hand crossing the desk to the mouse, or out to a drink and
back, is a perfectly good traversal. A **posture gate** — the palm must be above the bottom fifth of
frame — is one comparison and it is what actually stops a spurious commit. ⚠️ And the first draft's
comment claimed the width did that job, which is the "comment asserting a rule is followed" fault.

⚠️ **DETECTION LOSS IS CORRELATED WITH THE GESTURE, so disarming on one lost frame punishes the child
who does it best.** A hand moving fast under indoor light is motion-blurred, the landmarker's
confidence collapses and it falls back to full re-detection — so a dropped frame is most likely
precisely DURING the motion being detected. Grace it a few frames.

⚠️ **AND ONE HAND, WITH THE CONFIDENCES LEFT ALONE.** Two hands in frame let `all[0]` swap between
them and an event detector reads the swap as a gesture. But *loosening* the detection thresholds is
backwards for a single-hand reading: every marginal claim — a sibling, a face, a cushion — EVICTS the
tracked hand from the only slot, and each eviction is exactly the discontinuity the detector is least
able to tell from the real thing.

⚠️ **COUNT THE REPETITIONS ACROSS A WHOLE RUN BEFORE SIZING THE MOVEMENT.** An answer of 2..7 over
ten rounds is 20–70 gestures plus a return stroke each — up to ~140 arm traversals in one sitting,
against two dwells a round elsewhere in the band. That is an ergonomic ceiling on the distance, and
it is a stronger constraint than the noise floor: a tired sweep is a short sweep, which is a missed
sweep, which costs another sweep.

### Do not replace a control with a readout — a round can become unsubmittable

⚠️ **THE STRONGEST FINDING OF THE SUPPLY RUN'S AR PASS, AND IT IS ABOUT EVERY AR CHAPTER.** The
pattern so far has been to swap the pointer control for the hand readout (FitOut's digit pad becomes
a dwell ring). Do that to a chapter's ONLY commit-feeding control and a working camera that cannot
read a particular child's gesture leaves them with: nothing to press, an undo disabled at zero, a
commit disabled at zero, no wrong answer, no re-teach, **no round timeout in `SkillBeat`**, and **no
`CamGate`, because that renders only when the camera failed to START**. The single remaining control
is ‹ Menu. **Keep the control a real button and let the gesture fire the same handler** — one
element, two ways to trigger it, no dead end, and the source-grep gates keep working.

⚠️ **AND THE CONTROL THAT NAMES *WHICH* QUESTION IS BEING ASKED MUST NOT GO INPUT-BLIND.** This
chapter's button was the only thing on screen distinguishing its two readings of division — *Deal one
round* against *Fill a van* — so a single "sweep to deal" label would have said *deal* over a bench
where a step FILLS one. That is the re-word-every-gesture-line rule arriving from the other side: the
wording is not wrong, it addresses the wrong reading, and no single-mode check can see it. Put the
label behind one exported function of `(round, input, state)` and gate that the two types differ **in
both input modes**.

⚠️⚠️ **A REDIRECT KEYED ON A READING MUST NOT FIRE ON THAT READING'S *ABSENT* STATE — AN EMPTY FRAME
IS A COUNT OF ZERO.** The Loading Bay's `most` rounds accept 1–4 fingers (a stack number), so the
out-of-range nudge was written `n < 1 || n > STACKS` — which is arithmetically right and reads at a
child with **no hand in frame at all**, because that is also 0. Opening the camera door printed
*"There are only 4 stacks — hold up 1, 2, 3 or 4"* over a chapter nobody had held anything up to, and
worse it **displaced the instruction chip**, which is the one thing that would have told them what to
do. A redirect describing something the child did not do is worse than silence. **Bound it only where
the child has actually overshot**; an empty frame and a fist belong to `hand.ready` and to the ring's
own *"Show Milo your hand"*. Found by opening the camera door, not by reading — the gate swept 5, 6, 7
and 10 and never once swept 0.

⚠️ **THE STATES A GESTURE CAN BE IN ALL NEED WORDS.** *Ready* is not the only one: after firing, the
hand is on the far side and pushing further does nothing, so "bring your hand back" has to be said at
the moment it applies (FitOut's `handHint`); and where the tap path shows a dimmed button for "there
is nothing left to do", the gesture path shows nothing at all unless the label carries it — including
naming the tap that still commits.

⚠️ **ADDING A SECOND DOOR TO AN INTRO CARD COSTS ABOUT 33px.** Offering both inputs every time is
right, and on a card already at its measured ceiling it clips: this chapter's shipped 200-character
body went from 307px to **340px inside a 320px frame**. Both bodies had to shrink and the short-frame
padding had to tighten. **Re-measure the intro card when you add the second door**, on both paths.

⚠️ **THE SELF-VIEW IS A LAYER — CROSS IT WITH THE BENCH *AND* WITH THE CONTROL ROW.** It is opaque
and drawn above the world, and this chapter's bench is the widest answer surface in the band: it
covered the receivers in **584 of 1440 sampled draws**, worst case a 173×70px block over the rightmost
ones. The fix is a bottom band that RESERVES the panel's height (Factor Lab's `BOT_BAND`), not a
smaller panel — measured, shrinking the panel bought nothing at all and a mutation putting the
original size back stayed green, which is how that was discovered. The control row needs the same
treatment as padding, or the commit button sits under the panel.

### The question must never be drawn over the answer

⚠️ **CENTRE THE ANSWER SURFACE AND THE SPEAKER'S BUBBLE WILL EVENTUALLY COVER IT.** Measured on The
Fundraiser: a four-box answer row centred at 1280×720 ran to x 887 while the customer's bubble began
at 808 — the question sitting on the last two boxes of the answer, which is the open item its
previous cut left behind and which centring reproduced on the first drive. The bubble belongs to the
speaker and cannot move, so **the board takes the band that is left**: chapter-craft's *a boundary
next to another character is measured off THAT character, never guessed*. Export the bubble's own
width so the board and the bubble read one number rather than two.

⚠️ **AND WHERE THAT BAND CANNOT HOLD THE ANSWER SURFACE, THE ASK MOVES TO A TOP BANNER.** On a short
landscape frame a bubble, four boxes and a writing pane genuinely do not fit side by side at the tap
floor — measured, they want 342 of the 263px available at 640×320. Something has to give, and **a
question covering the answer is worse than a question that is not in a bubble**: the speaker is still
on screen and still says it aloud, so what is lost is the tail, not the speaker. Derive the branch
(`askAtTop`) from the same arithmetic the layout uses, so a gate can assert *no overlap OR the banner*
rather than pretending the geometry fits.

⚠️ **THE SIDE RESERVE STILL BINDS WHEN THE ASK MOVES UP.** Centring in the whole viewport once the
bubble stopped being the constraint put the board's left edge at 136 against a 167px cast reserve —
drawn straight through Milo. One constraint going away does not remove the others.

### The question is three zones, in every band

The 12–14 band paid for this and it generalises: **a single prose line that fuses story + math +
"what to do with your hands" is what a struggling child cannot parse.** Measured, it was systemic
across 11 of 12 chapters ([teen-12-14-math-audit.md](teen-12-14-math-audit.md) §1) and it was the
founder's word for it: *confusing*. Three zones instead:

| zone | what it is | rules |
|---|---|---|
| **context** | what the numbers ARE, plus the rule that applies | plain language · **no UI verbs** · omit entirely on bare math |
| **the math** | the hero — usually the instrument itself, not text | |
| **instruction** | the ONE action | starts with a verb · its own chip, so it never blends into the story |

The house phrasing, from the shipped chapters: context = *"You have 15 parts. They go out in equal
rows — every row the same length, nothing left over."* · instruction = *"**Work out** how many rows
fit, **then** hold up that many fingers."* Compare the run-on it replaced — *"Split 15 into equal
rows. How many rows? Make a fist if nothing fits."*
⚠️ **The chip is where a question type leaks**, because it is where the affordance gets named — gate
that two round types sharing a prompt also share a byte-identical chip. ⚠️ And **what the character
SAYS must carry both zones**: on a device with no voice the written zones are all there is, and on a
device with one the spoken line is.

⚠️ **AND WRITING THEM CLEARLY WILL BREAK YOUR LAYOUT, BECAUSE A GOOD QUESTION IS TALLER THAN A BAD
ONE.** A card holding three lines of context plus a two-line chip measured **265px** against the
36px of the one-liner it replaced, and landed on top of the instrument. This is the reserved-lane
rule with teeth: **a constant reserved for a text block is a guess at a variable gap and will be sat
on.** Measure the card's real bottom edge (`useLayoutEffect` on a ref — NOT a `ResizeObserver`,
whose callbacks ride the rendering steps and are frozen in a backgrounded tab) and derive the band
from it, keeping the constant only as a first-paint floor. ⚠️ **And a bottom band is often TWO
stacks** — the readout in the centre and a self-view in the corner — so reserve the taller.

