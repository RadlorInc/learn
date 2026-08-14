# Session Handoff — Milo Story Mode

> 📐 **READ [docs/chapter-craft.md](docs/chapter-craft.md) FIRST, EVERY SESSION, BEFORE TOUCHING ANY 3–11 STORY CHAPTER.**
> It is the standing answer to *how we want the animation, the art and the voice* — the shape of a
> chapter, how cycles and travel must agree, what may be an answer object, how to choose a backdrop,
> how to generate a new drawn cycle, how Milo speaks, and how to verify any of it.
> Everything in it was paid for by a founder catching it on a screenshot. **Most of those rules were
> already learned in chapter 1, forgotten, and re-learned the hard way in a later chapter** — that
> file exists so the next session starts from them instead of rediscovering them.
> When a new correction lands, put the GENERAL rule there, not just the fix.
>
> _(Everything below is the running session history — newest first, most recent ~5 sessions only.
> Older blocks are in [docs/handoff-archive.md](docs/handoff-archive.md), which is NOT auto-loaded —
> `grep` it. This file is inlined into every session's context, so move blocks out rather than
> letting it grow. The craft rules live in chapter-craft.md, not here.)_

> 📏 **2026-08-14 — UNITCONVERTER → THE HEIGHT BAR, ON THE FOUNDER'S CALL TO CONNECT THE 9–11 MEASUREMENT CHAPTER TO A DAILY REAL-WORLD EXAMPLE — AND READING THE SHIPPED CHAPTER FIRST FOUND THAT ITS CONVERTER PRINTED THE METHOD ON EVERY ROUND AND THAT ELEVEN OF ITS TWELVE UNIT QUESTIONS WERE COIN FLIPS. ⚠️ NOT COMMITTED — the founder has not been asked.** `tsc` 0 · **972/972 vitest** (was 902, **+70**) · `next build` 0 · **eslint: byte-for-byte CoinTray's rule profile, i.e. zero new classes** · 0 console errors in a fresh tab · driven at 1280×720, 640×320 and **334×676** on BOTH inputs · **47/47 planted regressions caught, re-run against the final code.**
>
> **The ask:** *"in band 9-11 … joh measurement chapter hai usko bhi daily real world example se connect karna hai"* → on the four questions put to him: **the height bar at a ride** · **US customary** · **build the converted number** · **hands apart to show a length**.
>
> ## ⓪ ⚠️ THREE DEFECTS WERE ALREADY SHIPPING, AND THE FIRST ONE IS THE CHAPTER
> ① ⚠️⚠️ **THE CONVERTER PANEL PRINTED THE METHOD.** `UnitConverter.tsx:173` rendered
> `<Gear op={data.op} factor={data.factor} />`, whose `on` prop changed only the GLOW — the text
> `× 1000` / `÷ 100` was on screen for the whole duration of every question. Which unit is bigger, by
> how much, and whether to multiply or divide **is the skill**, so every `convert` round reduced to
> *"multiply 3 by 1000"*. ② **ELEVEN OF THE TWELVE sensible-unit items were 50/50 coin flips wearing
> four chips** — `door → m` offers `m/mm/km/cm`, `bathtub → L` offers `L/mL/g/km`, i.e. two of the four
> are always from the wrong ATTRIBUTE and eliminated for free. ③ the demo's second beat is a UNIT
> question under a card hardcoded `tag="Convert"` — the `tag="Read"` fault, verbatim. Plus **no anchor
> of any kind**: the intro card said *"Milo runs the metric converter"*.
>
> ## ① THE VERB WAS ALREADY DECIDED AND IT NEEDED ONE CORRECTION
> [story-9-11-rethink.md §8](docs/story-9-11-rethink.md) fixed **DOES IT FIT?** — conversion exists
> because two measurements in different units have to be COMPARED, and the comparison has a
> consequence. Right, and its *"fitting is the answer"* had to be inverted before any code:
> ⚠️ **yes/no is the 50% coin flip this band is being rebuilt to remove.** The converted NUMBER is
> scored; the gate opening is what the child then watches. Same call pizza.ts and cents.ts already made.
>
> ## ② ⚠️ THE UNITS DECISION HAD BEEN PARKED SINCE 2026-08-12 AND IT BLOCKS EVERY LINE OF COPY
> [story-9-11-ar-plan.md §7.1](docs/story-9-11-ar-plan.md) records it; the founder took **(a) US
> customary**. The anchor is the one measurement a child checks on themselves and a US nine-year-old
> knows it as *"four foot three"*, never as 130 cm — metric would have meant an anchor nobody has
> lived. ⚠️ **THE COST, RAISED BEFORE BUILDING: the factors stop being ×10/×100/×1000 and become 12,
> 16 and 4 — multiplication facts, whose chapter was DELETED on 2026-08-13 and which `i.measureUnits`
> lists as a prereq.** Survivable for two reasons that are construction rather than luck: the `fit`
> rounds only ever need **12 × 1..6**, which is the table a RULER is printed with, and **L1 is whole
> feet only**, so the first rounds are that table before any inches are added.
>
> ## ③ ⚠️⚠️ THE FOUNDER'S AR PICK CANNOT CARRY A SCORED ANSWER, AND THE ARITHMETIC SAYS SO BEFORE ANY CODE
> §8 asks for *"hold your hands apart to SHOW a length"*. Measured first, as the AR doc demands:
> **two palms carry ~±0.028 of frame width between them, which stretched onto the answer scale is
> ±2.3 INCHES** — so answers one inch apart (51 against 50) sit inside the noise and **a child who KNEW
> the answer could not enter it**, which is a dead button. And both hands must be in frame: a webcam
> sees ~nine hand widths across, so anything past ~22 in cannot be shown at all.
> ⇒ Built as **The Angle Shop's `job: 'degrees'` precedent, verbatim**: the gesture ships where it IS
> honest — the EXPLORE beat, *"show me about how long a foot is"*, nothing scored, where no precision
> is wanted — and the scored rounds keep the two-place finger count. **I flagged this when he picked
> it and he picked it anyway; it is in the chapter and it works.**
> ⚠️ **AND IT IS CALIBRATION-FREE, WHICH IS THE PART WORTH KEEPING.** A span in frame fractions is not
> a length (lean back and everything shrinks together). The child's own HAND WIDTH is in the same frame
> and scales identically, so `span ÷ handWidth` is distance-invariant — measured **across the knuckles**
> so curling the fingers cannot move the ruler. New: `spanRatio`/`palmSpan`/`meanHandWidth` in
> `fingerCount.ts`, `reads: 'span'`, `__miloSpan`. ⚠️ **ONE detector mode carries BOTH readings** (the
> count for scored rounds, the span for explore), because `reads` is fixed when the camera opens and
> two modes would mean re-initialising MediaPipe mid-chapter.
>
> ## ④ ⚠️ FOUR FAULTS THE DRIVE FOUND, AND THREE WERE ONLY VISIBLE AT 640×320
> ① ⚠️⚠️ **THE INSTRUCTION CHIP WAS DRAWN 29 × 16 px ACROSS THE HEADLINE** — the door-frame mark, which
> IS the question. `boardBand`'s top clamp is justified by sliding a board under *text already read*,
> and **zone 3's chip is the LAST thing in the card, so it is the FIRST thing the board reaches — and
> it is the one action, not something read and finished with.** That half of the rule had never been
> written down. Fixed by the prose, in the documented order: a short frame now gets the two FACTS
> without the rule sentence (`context`), because the rule is stated in the demo AND again in the
> re-teach. Card 97 → 79px, chip clears the headline by 2px. ② The same collision on the EXPLORE beat
> (5px over the chip) — its body is now shorter on short, pinned as **`EXPLORE_BUDGET` 84 chars**,
> because *nothing can see a wrap* (the chalkboard's `PLAN_BUDGET` shape: 118 chars wraps to two lines
> and collides, 70 is one line and clears by 12). ③ **"hold up it"** on the guided round's own chip —
> `${verb} it.` over `{hand:'hold up'}`. The *"0 pennyies"* family: one verb cannot serve two
> sentences, so the chip gets its own phrasing. ④ **The tag printed TWICE**, an inch apart — the board's
> chrome strip and the prompt card both drew `data.tag`. Copied from CoinTray, and it only shows on a
> roomy frame because a short frame drops the strip.
>
> ## ⑤ ⚠️ AND THE GATE FOUND ONE THE DRIVE COULD NOT: THE CHILD'S OWN WORKING LANDS ON A NUMBER PRINTED AS SOMETHING ELSE
> A `fit` round asking `4 ft 3 in` against a **48 in** sign makes the first step of the conversion —
> four lots of twelve — **equal to the number on the sign**. Nothing prints the answer (51) and nothing
> is wrong; a child who stops at the figure they can see is marked wrong **for a confusion the CHAPTER
> created**. The demo said it out loud, *"4 feet is 4 lots of twelve, which is 48 inches"*, directly
> under `sign: 48 in`. Two of six limits are multiples of twelve → ~⅓ of L2. Fixed by construction
> (`OFFSET_LIMITS`), ⚠️ with L1 the deliberate exception, because there `ft × 12` IS the answer.
> ⚠️ Two more of the same family the gate caught before any drive: a `need` shortfall that equals the
> height's own **inches** part (`48 − 42 = 6`, written `3 ft 6 in`) and then, only after fixing that
> one, the same thing against the **feet** part (`44 − 41 = 3`, written `3 ft 5 in`) — **a rule stated
> for one component of a written form has to be checked against every component of it.**
>
> ## ⑥ WHAT WAS ACTUALLY DRIVEN
> **1280×720, both inputs:** both doors, and the remembered pick proven live (after one "Use taps" the
> tap door becomes the BIG button and the camera the quiet one) · the explore beat stacking to
> **12 in / = 1 ft** · all three demos beat by beat, including the boundary one printing *"48 inches
> against a sign that says 48 — they are the same, and the same is tall enough"* · a guided round
> answered WRONG (44, the plausible read-the-sign-back error) giving the miss line with the entry
> cleared and **no mark on the bar** · then RIGHT, printing **"4 ft is 48 inches — the sign says 44,
> so you are on"** · 6 layers crossed, 0 real overlaps, **0 pad keys covered** (pad at 349 against
> Milo's right edge 187).
> **CAMERA PATH:** the denied gate on the chapter's own navy with *"Tap instead"* offered first · the
> span live (**4.1 hand-widths → 12 in**, 2.0 → *"About 6 inches — that is around a sheet of paper"*) ·
> a guided round entered as **4 then 8 → 48** through the dwell. ⚠️ **The held-over guard proven the
> decisive way: four fingers parked for 9.2 s ACROSS the slot boundary committed nothing**, and the one
> line that makes that visible was on screen — *"Lower your hand, then show the ones digit."*
> **640×320:** the intro card with the second door **16px clear of the bottom edge** · a played round
> with the miss note up, **21 leaf TEXT boxes crossed with each other → 0 overlaps**, 0 offscreen, no
> scroll.
> **334×676 — the narrow-but-TALL frame that produced the FactorLab/CoinTray fault** (`short` is
> `vh < 470`, so it takes the roomy branch): Milo's right edge measured **98** against the derived
> 97.7, the pad wraps to FOUR rows with its last row beside him, and **0 keys covered**.
> ⚠️ Instrument notes, both documented and both met again: the preview pane renders the app into a
> corner after a resize while `innerWidth` reads correctly (trust `getBoundingClientRect`), and **the
> console buffer survives navigation — twice it showed parse errors from intermediate HMR states while
> `tsc` was clean and a fresh tab read ZERO.**
>
> ## ⑦ THE GATE — +70 tests, **47/47 planted regressions caught, RE-RUN AGAINST THE FINAL CODE**
> [heightBarUnits.test.ts](src/__tests__/heightBarUnits.test.ts) drives the pure module and
> source-checks the scene and the detector. ⚠️ **It passed 62/62 on its FIRST run, which by this file
> is not evidence** — every mutation was planted in the SOURCE by a script that asserts its own
> substitution count, and **three survivors were my own gate being weaker than the rule it guards**:
> ① `expect(height).toBeGreaterThanOrEqual(MIN_HEIGHT)` **moves with the mutation** — dropping the
> constant to 12 stayed green while the chapter told a nine-year-old they were 2 ft 1. Pinned to the
> literal 36, which is the `boardsTop` fix one more time. ② `toMatch(/alt=\{/)` **also matches
> `x_alt={`**, so deleting the second door walked straight through. ③ **the invariance test did its own
> division**, so dropping `/ hw` from the detect loop left it green — *a gate that re-implements a rule
> cannot see the rule being removed*, fixed by extracting `spanRatio` and driving THAT.
>
> ## ⑧ ✅ THE `ponytail:` DEBT IS PAID — `boardBand` WAS ABOUT TO BE A FOURTH COPY
> `cents.ts` carried a comment saying to extract it once pizza/factors were committed. They are
> (`0c9418b`), so the clamp now lives once in **`story/preteen/band.ts`** (`fitBand`, `miloRight`,
> `MILO_LANE`). ⚠️ **Only the ARITHMETIC is shared — the constants are NOT**, because the three
> chapters do not agree on their bottom band (112/152 against 118/158) and hoisting the numbers would
> silently re-tune two shipped chapters. **Proven inert by their own gates: 162/162 across CoinTray,
> FactorLab and PizzaCounter, `tsc` 0.**
>
> ## ⑨ ✅ A FULL TEN-ROUND RUN WAS PLAYED — AND IT CLOSES TWO OF THIS BLOCK'S OWN OPEN ITEMS
> Founder's ask: *"ek full 10 round run karke dekho"*. Planned off `calcDifficulty` rather than by
> feel — promotion is 3-in-a-row at ≥80%, mastery is a streak of 6 at the top tier, **so a perfect run
> exits at round 6 and cannot show all ten.** One deliberate miss at round 6 keeps the tier (a demote
> needs TWO wrong in a row) and walks the whole set.
> **✅ ALL TEN ROUNDS PLAYED, confirmed by SkillBeat's OWN counter reading `[1,2,3,4,5,6,7,8,9,10]`**
> — not by the driver's count, which over-counts a re-opened round. The chapter then **ended itself**
> and exited. 0 console errors.
>
> | # | type | question | answer | what the screen said |
> |---|---|---|---|---|
> | 1 | fit | 3 ft vs sign 52 | 36 | *"…the sign says 52, so **not this time**"* |
> | 2 | fit | 4 ft vs sign 54 | 48 | *"…so **not this time**"* |
> | 3 | fit | 5 ft vs sign 54 | 60 | *"…so you are on"* |
> | 4 | swap | 32 yd × 3 | 96 | *"32 yards is 96 feet — the same amount"* |
> | 5 | need | 3 ft 11 in vs 52 | 5 | *"…is 5 inches under the sign"* |
> | 6 | swap | 6 lb × 16 | 96 | **MISS 97 → *"That reads 97 ounces"***, then retried right |
> | 7 | swap | 24 qt × 4 | 96 | *"24 quarts is 96 cups — the same amount"* |
> | 8 | fit | 5 ft vs sign 52 | 60 | *"…so you are on"* |
> | 9 | need | 3 ft 6 in vs 42 | **0** | *"3 ft 6 in is **exactly** 42 inches — you are on"* |
> | 10 | fit | 4 ft 7 in vs 42 | 55 | *"…is 55 inches — the sign says 42, so you are on"* |
>
> ✅ **COVERAGE FIRED LIVE** — `fit` (1,2,3,8,10) · `swap` (4,6,7) · `need` (5,9), all three readings
> asked. ✅ **L3 WAS REACHED**: the ×16 factor (round 6) and the exact boundary (round 9) exist at L3
> and nowhere else, so both are now proven on screen rather than only in the gate. ✅ **The boundary was
> SCORED** — answered `00` and **graded rather than nudged**, which is the `hands > 0` / pad-starts-at-0
> pair working end to end. ✅ **The miss named what was BUILT** (97) and never the answer (96).
> ✅ **Both consequences appeared at L1** — rounds 1 and 2 came out *"not this time"*, so the world's
> answer genuinely varies rather than always being yes.
> ⚠️ **THE DRIVER SOLVED EACH ROUND FROM THE SCREEN ALONE** (headline, sign, and the factor sentence) —
> so this is also evidence that the card carries everything the question needs. Its first version
> counted a DEMO beat as a round and threw on the missing pad; fixed by requiring the ten-key pad.
>
> ## ⑩ ⚠️ AND THE RUN TURNED UP ONE THING WORTH A FOUNDER'S CALL: THREE OF THE TEN ANSWERS WERE 96
> Rounds 4, 6 and 7 were `32 yd × 3`, `6 lb × 16` and `24 qt × 4` — three genuinely different
> questions, three different factors, **one answer typed three times**. Measured over 4,000 simulated
> runs: **21.2% of runs repeat some answer three or more times**, and the swap answers pile onto
> highly-composite numbers (96 · 48 · 32 · 64 · 80 are the commonest, because ×3, ×4 and ×16 all land
> there). ⚠️ **`sig` dedupe structurally cannot see this** — it dedupes the QUESTION, and these three
> questions are distinct. Not a correctness fault (the child did three different conversions) and it
> reads repetitive. **Left as the founder's call rather than fixed unasked.**
>
> ## ▶ OPEN
> 1. ⚠️ **NOT COMMITTED, NOT DEPLOYED** — the founder has not been asked, and this repo does not push
>    unasked. **DELETED: `story/UnitConverter.tsx`.** `public/sw.js` is still **v92** and must be
>    bumped in the same commit as any deploy.
> 2. ✅ **CLOSED by §⑨ — all ten rounds played, the tier climbed, `coverage` fired and the chapter
>    ended itself.** ⚠️ What the run does NOT cover: **the RE-TEACH never fired** (it needs two wrong
>    in a row and the plan called for exactly one miss) and **the MASTERY early-exit never fired** (it
>    was deliberately broken to reach all ten). Those two need a second run each, and they are
>    mutually exclusive with this one — an erring run and a perfect run are different evidence.
> 3. ✅ **CLOSED by §⑨ — L3 was reached and both trap cases were on screen**: the ×16 factor (round 6)
>    and the exact boundary answered 0 (round 9). A height below the sign also appeared, at L1
>    (rounds 1 and 2).
> 4. ⚠️ **STILL NOBODY HAS HELD A REAL HAND UP TO ANY OF THE AR — seventeen readings deep**, and this
>    chapter adds the FIRST genuinely new detector since the sweep. `HAND_IN = 2.9` is the one assumed
>    number in the span and the knob a real child tunes first; `SPAN_EMA = 0.22` is the second. Neither
>    has met a hand. The distance-invariance is proven by arithmetic and a unit test, not by leaning back.
> 4b. ⚠️ **THE ANSWER SPREAD, from §⑩: 21.2% of runs repeat an answer three or more times**, because
>    the swap factors (3, 4, 16) all land on the same highly-composite numbers. Founder's call.
> 5. **The `swap` rounds are the only place mass and capacity appear**, and they are one-step
>    conversions with the factor GIVEN on the card. That is deliberate (the factor is not a fact a
>    nine-year-old holds) and worth one look with a founder's eye.
> 6. **Everything in the 🪙, 🍕, ✋ and 🗑️ blocks below still stands**, including that the rebuild shape
>    for the two deleted chapters is an unanswered founder call.
> 7. Of this session's faults, **three came from reading the shipped code before touching it, one from
>    reading the plan's AR line against arithmetic, three from the gate before it ever ran green, four
>    from driving it (three only at 640×320), one from a fresh tab happening to open at 334×676, and
>    three from mutation-testing my own gate. None from the type-checker.**

> 🪙 **2026-08-13 — DECIMALGRID → THE COIN TRAY, ON THE FOUNDER'S CALL TO CONVERT THE 9–11 DECIMAL CHAPTER TO A DAILY REAL-WORLD EXAMPLE — AND READING THE SHIPPED CHAPTER FIRST FOUND THAT TWO OF ITS THREE QUESTION TYPES WERE COIN FLIPS AND THE THIRD DREW AN EMPTY INSTRUMENT. 🚀 SHIPPED — `main`@`0c9418b`, prod serving **sw v92**, smoke 11/11 and both new chapters rendered on the live origin.** `tsc` 0 · **902/902 vitest** (was 871, **+31**) · `next build` 0 · **eslint: the same four rule classes as PizzaCounter, i.e. zero new classes** · 0 console errors · driven at 1280×720, 640×320 and 466×676 · **TWO FULL RUNS PLAYED** — one perfect to the mastery exit, one erring through all ten rounds · **23/23 planted regressions caught.**
>
> **The asks, in order:** *"9-11 band… decimal chapter ko lete hai, aur uska daily real world example mein convert karte hai"* → on the three questions put to him: **money (structurally separated from The Fundraiser)** · **MAKE THE AMOUNT — build it in coins** · **AR in the same pass**.
>
> ## ⓪ ⚠️ THREE DEFECTS WERE ALREADY SHIPPING, AND TWO OF THEM ARE THE BAND'S HEADLINE FAULT
> ① **`compare` OFFERED EXACTLY TWO CHIPS** — `choices: shuffle([aS, bS])`, in every tier's pool. So
> the 0.3-vs-0.25 misconception, **the one thing the chapter exists for**, was asked at 50%. ② `digit`
> was nominally three chips and **two of the three were the two digits already printed on screen**, so
> it was a coin flip as well. ③ ⚠️ **A `digit` ROUND DREW THE 100-CELL GRID WITH `shaded: 0` FOR ITS
> WHOLE DURATION** — the manipulative present, and meaning nothing, for a third of the rounds. Plus the
> demo's card was hardcoded `tag="Read"`, so the COMPARE demo was labelled Read.
>
> ## ① ⚠️ THE ANCHOR IS THE PLAN'S OWN AND IT IS THE GOOD KIND — BUT IT IS THE BAND'S SECOND MONEY WORLD, AND I FLAGGED THAT BEFORE ANY CODE
> §7's argument is structural rather than flavour: **100 cents ARE the hundredths grid**, so tenths are
> dimes and hundredths are pennies and the anchor and the manipulative are the same object — the
> recorded exception, exactly as dollar denominations ARE base ten in The Fundraiser. Every alternative
> fails on the band's own filters (a race time inverts *more is better*; a doorframe height IS the
> `measurementUnits` chapter; a fuel price is a parent's world). ⚠️ **The cost: The Fundraiser (9–11)
> is money and CoinShop (6–8) is money**, so this is the third. Raised, and the founder took it — so
> the separation is STRUCTURAL rather than verbal, and it is **the decimal point itself**: The
> Fundraiser is whole dollars LEFT of it, CoinShop is *count the cloth and pay*, and this is dimes and
> pennies RIGHT of it, where **nothing is ever added up** — the wells are places, and putting a coin in
> the wrong well is the entire misconception.
>
> ## ② ⚠️⚠️ THE PLAN'S OWN AR LINE IS ARITHMETICALLY IMPOSSIBLE, AND ITS OWN EXAMPLE DISPROVES IT
> §7 says *left hand tenths, right hand hundredths — so `0.55` is five and five while `0.6` is six and
> a closed fist.* **A hand has five fingers, so `0.6` — six dimes — cannot be shown.** One hand per
> place reaches only the amounts whose digits are both ≤ 5, i.e. **36 of 99**. This is the SAME fault
> §2's A2 row had to be corrected for last week, in a different chapter, in the same document. Built as
> FitOut's proven encoding instead: **both hands make ONE place at a time, left to right** — *show me
> the dimes… now show me the pennies* — which reaches 0–9 in each place, is place value performed, and
> keeps "six, then a fist" true. Zero new detector; `reads: 'count'`.
> ⚠️ **AND ZERO IS A REAL ANSWER HERE, WHICH INVERTS THE PIZZA COUNTER'S GUARD.** `0.6` is six dimes
> and a FIST; "seven hundredths" is a fist and seven pennies. So it is FactorLab's `hands > 0` (count
> may be 0) and NOT `count > 0` — and **the tap pad starts at 0**, the mirror of the pizza pad which
> starts at 1. Both are gated.
>
> ## ③ ⚠️ THE VERB IS "MAKE THE AMOUNT", AND THE COMPARISON IS DELIBERATELY NOT A ROUND TYPE
> The tag reads `0.55`; the child fills the dimes well, then the pennies well. Three readings of that
> one act — **`make`** (from a decimal) · **`place`** ("show me seven hundredths") · **`op`** ("it went
> up by 0.05") — one grader, `coverage` over all three. "Which is greater?" is the coin flip being
> removed, and **a build of the greater one is still a 50/50 DECISION however it is entered**, so it is
> what the tray REVEALS instead: **a dime is drawn as a TEN-FRAME of ten pips and a penny as one pip
> the same size**, so six dimes beside five dimes and five pennies is a comparison the child looks at.
> A disc marked "10¢" would be a piece ASSERTING its value — the 0.55-of-a-rod fault.
> ⚠️ **The tiers grow the MISCONCEPTION, not the numbers**: L1 tenths only (pennies always a fist), L2
> both wells, L3 the trap amounts (0.6 against 0.06) and the `op` rounds that cross a ten. And the
> `op` operands are **drawn to guarantee the case rather than clamped into it** — an empty `rint` range
> behind a `Math.max(1, …)` silently produces the case the tier was meant to exclude, which is how a
> tier stops meaning anything while every round still looks fine.
>
> ## ④ ⚠️ AND THE ANCHOR'S OWN NOTATION WOULD HAVE ERASED THE CHAPTER
> **Money always pads to two decimal places.** `$0.60` beside `$0.55` is obviously bigger, so written
> that way **the misconception cannot occur at all**. So every ASK states the decimal (`0.6`) and
> `money()` appears only in the REVEAL, as the bridge — *"$0.60 — that is 0.6 of a dollar"*, verified
> on screen. Same for what is SPOKEN: "sixty cents" hands over six dimes without a decimal being read,
> so Milo says the digits. Both gated.
>
> ## ⑤ ⚠️ FIVE FAULTS THE DRIVE FOUND, AND FOUR WERE ONLY VISIBLE AT 640×320
> ① **The explore beat showed a price tag reading `0.01` over an empty tray** — a question card on the
> one beat that asks nothing, and a number that was simply untrue. ② ⚠️ **"0 pennyies"**, on the FIRST
> demo beat, from a plural built by appending a suffix — the *"Fox has a apple"* family. ③ ⚠️⚠️ **THE
> COINS RENDERED AT A 2.2px PIP**: the board measured **201×90 inside a 550×98 band**, i.e. height
> binding hard with **~330px of width going spare**, and FitBox obediently shrank the one thing the
> child has to count. **That is scale-where-reflow-was-needed** — the teen band's rule, recurring here
> — plus a piece drawn in the wrong aspect (a 1×10 strip is ten pips TALL; a 2×5 ten-frame is half the
> height for the same ten). Tag beside the wells, ten-frame coins: **485×90 and a 6.6px pip**, same
> band. ④ ⚠️ **THE BOARD WAS DRAWN 32px INTO THE QUESTION CARD, OVER THE PRICE TAG** — `boardBand`'s
> top clamp takes the BOTTOM band as its input, so the explore beat's 47px action row pushed the top
> from 105 to 65. The clamp is meant to slide a board under *text already read*, and the tag is the
> question. Fixed with the band's quiet **top-right chip** on short. ⑤ ⚠️ **A FIXED 24px RESERVE MADE
> A COLLISION IT EXISTED TO PREVENT** — the verdict pill wraps to two lines at that width and spilled
> over the tag. Sized to content now.
>
> ## ⑥ WHAT WAS ACTUALLY DRIVEN
> **1280×720:** both doors · the explore beat with **7 + 5 pennies fusing into 1 dime + 2 pennies**
> (the bridge, live, where nothing is scored) · the guided round answered **3 dimes then 0 pennies** —
> the fist case — grading and advancing · scored round 1 (`0.5`) answered **with the misconception**
> (0 dimes, 5 pennies) → miss line, tray emptied, slot back to dimes, round still open · a second wrong
> tray printing **"That tray is 0.12 of a dollar"** (true of what they laid, never the answer) · then
> the correct build printing **"$0.50 — that is 0.5 of a dollar"** · 23 layers crossed, **0 overlaps,
> 0 offscreen, no scroll**.
> **640×320:** the briefing with the second door **17px clear of the bottom edge** · explore · all
> three demos including **`0.6` as six countable ten-frames with the pennies well empty** and `0.07`
> as seven pennies with the dimes well empty — the trap taught both ways round · the guided round
> graded, **0 text overlaps with the verdict pill up**, no scroll. **0 console errors.**
> ⚠️ Two instrument notes, both documented and both met again: the pane renders the app into a corner
> after a resize while `innerWidth` reads correctly (trust `getBoundingClientRect`), and the two
> "overlaps" a layer sweep reports here are the full-width HUD **containers**, not their pills.
>
> ## ⑦ ⚠️ THEN THE FOUNDER ASKED FOR A FULL TEN-ROUND RUN, AND GETTING READY FOR IT FOUND THE WORST DEFECT OF THE SESSION — ONE I HAD WRITTEN AN HOUR EARLIER
> ⚠️⚠️ **THE BOARD PRINTED ITS OWN ANSWER ON TWO OF THE THREE ROUND TYPES.** `Board` rendered
> `dec(data.target)` as its headline — exactly right on `make`, whose question IS *read this amount*,
> and fatal on the other two: an `op` round asks *"the tag read 0.55, it went UP by 0.05"* and printed
> **0.6** above it, so **the arithmetic never had to happen at all**; a `place` round asks *"seven
> hundredths"* in WORDS and printed **0.07**, doing the words-to-digits step that is half of what the
> round tests. One expression, correct for one of three types, and it reads as obviously fine.
> Now `headline(round, revealed)` in the pure module: `make` shows the tag, `op` shows its **SUM**
> (the question, as The Pizza Counter's board does), `place` shows **`?`** until the commit. ⚠️ The
> sweep is on TOKENS rather than substrings — `0.1 + 0.6` contains `0.6` while meaning nothing of the
> kind. **5/5 mutations caught**, including the scene bypassing the module.
>
> ## ⑧ ✅ TWO FULL RUNS PLAYED — AND THEY CLOSE THREE OF THIS BLOCK'S OWN OPEN ITEMS
> They had to be two, because they are different evidence (FitOut's precedent): a perfect run exits
> early, and only an erring run walks all ten.
> • **RUN A — every answer correct.** The tier climbed and **both types that had never been on screen
> came up scored**: round 4 an **`op`** (`0.16`) at L2, round 5 a **`place`** (`0.5`). L1 was
> tenths-only throughout (0.7 · 0.9 · 0.1 — every pennies well a fist), L2 opened both wells (0.76).
> ✅ **Coverage worked live** — all three readings were asked, and only then did the **mastery
> early-exit** fire at round 6 and the chapter end itself. 0 console errors.
> • **RUN B — one wrong answer per round.** ✅ **All ten rounds walked** and the chapter finished
> itself. Every miss showed the written line, emptied the tray and re-opened the round at the dimes
> well; every verdict pill named **what was laid** (`That tray is 0.81 of a dollar`) and never the
> answer. ✅ **The re-teach fired three times — at rounds 3, 6 and 9, i.e. every third erred round,
> exactly `reteachAfter: 3` — and it TEACHES**, replaying the working beat by beat with the tray
> filling ("$0.50 on the tray, and 0.5 on the tag — the same amount, written two ways"). 0 console
> errors.
> ⚠️ **Stated rather than hidden: an erring run holds the tier at L1, so every one of Run B's ten
> rounds was `make` at tenths.** The two runs together cover the three types; neither does alone.
>
> ## ⑨ ⚠️ AND THE RUN CAUGHT A LAYOUT FAULT THAT ONLY EXISTS ON A FRAME NOBODY HAD TESTED
> The preview pane resized itself to **466×676** mid-run — narrow but TALL — and Milo was sitting on
> the answer pad's **`0` and `1` keys**. `MILO_LANE` was `short ? 104 : 12` and `short` is `vh < 470`,
> so a tall narrow frame took the 12px lane. **`0` is the answer on most rounds in this chapter**
> (`0.6` is six dimes and then zero pennies), and he is `pointerEvents: none`, so every tap still
> landed and nothing but crossing the two boxes could see it — **FactorLab's fault verbatim, in the
> chapter where zero matters most.**
> ⚠️ **And the obvious fix was still a guess**: 104 left 4px of him over the `0`, because his right
> edge there is 109.5. It is derived now — `PtMilo` is `left: 9%` with `translateX(-50%)` and
> `width: min(20vh,160px)`, so `miloRight = vw*0.09 + min(vh*0.20,160)/2` — which is this repo's own
> *measure a boundary off THAT character* rule. Verified on screen: 0 keys covered, pad at 142 against
> his 109.5. **4/4 mutations**, and ⚠️ **the fourth only after a survivor showed the gate could not see
> the SCENE dropping the lane** — every assertion drove `MILO_LANE` directly, so a hardcoded padding
> walked through. Closed with a source check.
>
> ## ⑩ THE GATE — +31 tests, **23/23 planted regressions caught**
> [coinTrayDecimals.test.ts](src/__tests__/coinTrayDecimals.test.ts) drives the pure module and
> source-checks the scene. Caught: L1 drawing hundredths · L3 `op` no longer forcing a crossing · a
> `place` round filling both wells · the miss line naming the amount · the money form leaking into an
> ask · the spoken line saying cents · the pad dropping zero · the band given a floor instead of a top
> clamp · the verdict printing money on a miss · the first demo made the tidy case · **the dwell key
> carrying the slot** (FitOut's `12`-as-`11` bug) · **a fist no longer counting as an answer** · the
> slot no longer mirrored in a ref · the demo card labelled with a literal round type.
> ⚠️ It passed 28/28 on its FIRST run, which by this file's own rule is not evidence — every mutation
> above was planted in the SOURCE, never in an assertion, by a script that asserts its own
> substitution count.
>
> ## ▶ OPEN
> 1. ✅ **SHIPPED 2026-08-13 — `main`@`0c9418b`, prod serving sw v92.** Three commits, clean
>    fast-forward, 0 ahead / 0 behind: `bb3850d` (the docs split), `dee2f2e` (both chapters — ONE
>    commit, because they rewire `storyChapters.tsx` and `core/chapters.ts` on adjacent lines and any
>    split leaves a registry importing a component that does not exist yet), `0c9418b` (sw v91 → v92).
>    Gates re-run before staging rather than trusted from this file: `tsc` 0 · **902/902** ·
>    `next build` 0. **DELETED: `story/DecimalGrid.tsx` + `story/FractionForge.tsx`.**
>    Post-deploy: prod `sw.js` **v92 on the fifth poll**, 9 routes + `pizza_base.png` all 200,
>    **0 hits for `FractionForge`/`DecimalGrid` in the `/story` shell**, and both chapters driven on
>    the live origin — briefing, both doors, 0 console errors.
>    ⚠️ **What the prod drive does NOT cover: only the BRIEFING screen was reached.** No demo, no
>    guided round and no scored round has been played on production; everything below still stands,
>    and the fresh pane cached `milo-shell-v92` so the stale-worker trap was avoided by construction
>    rather than by clearing it.
> 2. ✅ **CLOSED by §⑧ — scored `op` and `place` both played, all ten rounds walked, the re-teach
>    fired three times and the mastery exit fired.** ⚠️ What the two runs do NOT cover: **no scored
>    round has ever been on screen at L3**, so the trap amounts (`0.6` against `0.06`) and the
>    carry/borrow `op` rounds are gate-only — a perfect run masters out at round 6, before L3, and an
>    erring run never leaves L1. Reaching L3 needs a run that is right just often enough, and it is
>    the one drive still owed.
> 2b. ⚠️ **L1'S QUESTION SPACE IS NINE AMOUNTS AND A RUN IS TEN ROUNDS**, so a child who errs every
>    round must meet a repeat — seen in Run B (0.7, 0.2, 0.4 and 0.5 each twice). `sig` dedupe cannot
>    help, and widening L1 past tenths would destroy the tier's whole purpose. Noted, not fixed.
> 3. ⚠️ **STILL NOBODY HAS HELD A REAL HAND UP TO ANY OF THE AR — sixteen readings deep.** Everything
>    above came through the tap path or `__miloFingers`, which bypasses the detector. This chapter is
>    the FIRST where **a fist is a valid answer on most rounds**, so `hands > 0` on a real camera —
>    telling a closed hand from a hand that has left the frame — is the thing to check, and nothing
>    headless can.
> 4. **The 2×5 ten-frame was chosen for its ASPECT, not by eye.** It is countable at 640×320 by
>    measurement (6.6px pips) and worth one look with a founder's eye at the coins' actual size.
> 5. **`boardBand` is now the THIRD copy of that arithmetic** (`factors.ts`, `pizza.ts`). Marked with a
>    `ponytail:` comment rather than extracted, because doing it now means re-running two gates on two
>    uncommitted chapters for eight lines.
> 6. **Everything in the 🍕, ✋ and 🗑️ blocks below still stands**, including that the rebuild shape for
>    the two deleted chapters is an unanswered founder call. `public/sw.js` is still v91.
> 7. Of this session's faults, **three came from reading the shipped code before touching it, one from
>    reading the plan against arithmetic, five from driving it (four of those only at 640×320), and one
>    from a demo beat's own words. None from the type-checker, and none from the gate — which went
>    green first time and had to be mutation-tested to be worth anything.**
>
> 🍕 **2026-08-13 — FRACTIONFORGE → THE PIZZA COUNTER, ON THE FOUNDER'S CALL TO RE-THINK THE 9–11 FRACTION CHAPTER AROUND A DAILY EXAMPLE — AND READING THE SHIPPED CHAPTER FIRST FOUND THAT IT PRINTED ITS OWN ANSWER AND THAT ITS COMPARISON ROUNDS NEVER COMPARED TWO FRACTIONS. 🚀 SHIPPED with The Coin Tray — `main`@`0c9418b` / sw v92; this block's "NOT COMMITTED" is stale.** `tsc` 0 · **871/871 vitest** (was 808, **+63**) · `next build` 0 · **eslint: byte-for-byte the same rule profile as FactorLab minus one, i.e. zero new classes** · 0 console errors in a fresh tab · driven at 1280×720 and 640×320 on BOTH inputs · **17/18 planted regressions caught, the 18th proven INERT with its guard separately gated.**
>
> **The asks:** *"band 9-11 mein fraction chapter ko daily real world example se rethink karte hai"* → on the world, **"pizza shared with friends"** → *"toh isme AR kaise daale?"* → on the verb, **"fingers = slices"**.
>
> ## ⓪ ⚠️ TWO DEFECTS WERE ALREADY SHIPPING, AND THE SECOND IS THE ONE THE CHAPTER IS NAMED FOR
> ① **A `name` ROUND PRINTED ITS OWN ANSWER.** `FrPlay` initialised its stage with `revealState(data)`
> so the bar would open pre-shaded — correct — and `revealState` also carries `verdict`, which `Forge`
> renders as a full-size green pill. So *"What fraction is shaded?"* was asked with **3/4 on screen**.
> ② ⚠️ **EVERY COMPARE ROUND WAS SAME-DENOMINATOR.** `mkCompare(den)` drew ONE `den` and two
> numerators, so *"which is greater, 4/5 or 2/5"* is comparing **4 with 2** — integer comparison
> wearing a slash. **The chapter named for comparing fractions never once asked a child to compare two
> different-sized parts**; only the explore sim did. Delete every bar and all thirty questions still
> answer.
>
> ## ① ⚠️ THE FOUNDER PICKED PIZZA AND I FLAGGED THE COST FIRST — 6–8 ALREADY OWNS IT
> [story-9-11-ar-plan.md §6](docs/story-9-11-ar-plan.md) names *"a pizza shared with friends"*, and
> **SliceShop (6–8) IS pizza** — a world this child has likely already played, on the same skill.
> Raised, and the founder chose pizza anyway; taken as his decision. **So the WORLD repeats and the
> VERB may not**, and the separation is structural rather than verbal: SliceShop owns **FIT IT** —
> ONE whole, one piece size, lay copies until full — and equivalence needs the thing it cannot show,
> **TWO wholes cut differently**. One whole vs two is a property a gate asserts and a reader sees.
> ⚠️ **AND COMPARISON STOPPED BEING ITS OWN ROUND TYPE**, because two chips is the 50% coin flip this
> band is full of and a finger count cannot express it anyway. It is what every `match` round REVEALS
> (two of my eighths make one of your quarters, so an eighth is smaller); `more` then asks it as a
> NUMBER on pairs where **no exact answer exists**. ⚠️ Which has to be CHECKED, not assumed — 2/4 IS
> exactly 3/6, so a plausible non-multiple pair would have had the prompt tell the child a lie.
>
> ## ② THE AR — `reads: 'count'`, AND THE PLAN'S OWN VERB WAS WRONG
> §6 says *CHOP the pizza — place cuts, which have to come out EQUAL*. It fails two of chapter-craft
> §5's tests and I said so before building: **a wobbly hand becomes a wrong answer** (the air-writing
> fault — a shape that cannot be read is "try again", never a mark), and **equal parts is 6–8's
> payload**, so chopping teaches the band below with a fancier input. Founder picked **fingers =
> slices**: zero new detector, zero new art, and the whole AR cost is wiring in the shared
> `useHandInput`/`useDwell`/`CamView` layer exactly as FactorLab does.
> ⚠️ **NO ANSWER IS EVER 0**, so a fist means nothing, `hands === 0 && count > 0` is the only guard the
> commit needs, and the pad starts at 1 — one trap fewer than FactorLab, which has to tell a fist from
> a lowered hand.
> ⚠️ **AND THE ANTI-ORACLE RULE IS SHARPER HERE THAN ANYWHERE ELSE IN THE BAND: two gaps side by side
> can be compared BY EYE.** A board that took slices live would let a child sweep 1,2,3… and stop when
> the gaps matched, having judged nothing — the oracle that got an area chapter and then a division
> chapter deleted. My pizza stays WHOLE, cuts visible, until the commit. `openingTake` lives in the
> pure module so the gate DRIVES that rule instead of grepping for it.
>
> ## ③ ⚠️ THE GATE FOUND TWO PRODUCT FAULTS BEFORE IT EVER WENT GREEN
> ① **A `more` round could answer "ALL OF IT"** — beating 3/4 with halves takes 2 of 2, which on
> screen is an empty plate rather than a comparison, and offers only two counts besides. The roof is
> one slice lower for `more` alone (`match` cannot reach it; an `op` genuinely may end with the whole
> pizza gone). ② **A NUDGE NAMED THE ANSWER** — *"that pizza only has 6 slices"* hands 6 to a child who
> overshot on the `op` rounds where 6 IS the answer. It states the direction now, not the figure.
>
> ## ④ ⚠️ AND DRIVING IT AT 640×320 FOUND THE FAULT THAT MATTERED MOST
> The question card wrapped to **96px of a 320px frame**, the answer row reserves 112, so `boardBand`
> handed the board its 90px floor and FitBox scaled **two pizzas to 35px each** — the one thing the
> child has to COMPARE, unreadable. The panel was spending ~70px on a header repeating the card's own
> tag and a big readout repeating the denominator the card already states. Dropped both on short,
> dropped the per-pizza caption, shortened the context to one line: **35 → 51px**, and the card 96 →
> 78. ⚠️ **Also caught by eye and fixed before that: the TAKEN slices were painted with a translucent
> accent, which reads as a SHADED sector — the pie chart the wedge-clipping exists to escape, and
> ambiguous besides (is the coloured half the amount, or the pizza half?).** Nothing is drawn over a
> gone slice now; the plate shows through.
>
> ## ⑤ WHAT WAS ACTUALLY DRIVEN
> **1280×720, both inputs:** the briefing with both doors · explore reflowing live to **1/2 vs 3/6
> lining up with "the same"** · all three demos beat by beat · the guided round WRONG (board showed
> **3/4 gone**, verdict *"3/4 is MORE than 1/2"*, never naming 2) then RIGHT (**"2/4 = 1/2"**) ·
> a scored round. ⚠️ **The held-over guard proven the decisive way: a hand parked on the CORRECT
> answer for 17.7 s across a round boundary committed NOTHING, and lowering + raising it committed at
> once** — and the dwell fired at **1312ms** against `DWELL_MS` 1200. **Both doors proven live**: the
> remembered pick made taps the BIG button and left the camera as the quiet one.
> **640×320:** every fixed layer crossed with every other on a scored round, with the miss note up —
> **0 real overlaps, 0 offscreen, no h- or v-scroll**, Milo clearing the note pill (90 vs 104,
> `MILO_LANE` working). ⚠️ **Two reported overlaps were checked rather than believed**: one is the
> full-width HUD container (the documented phantom), the other is the board's top **6px** under the
> question card — the clamp's designed behaviour, and on a short frame the header it hides is dropped.
> ⚠️ **And a first crossing reported "0 overlaps" over only FOUR layers because two selectors matched
> nothing** — the instrument lying exactly as this file warns; enumerating `position: fixed` instead
> found the real six.
>
> ## ▶ OPEN
> 1. ✅ **SHIPPED 2026-08-13 inside `dee2f2e` with The Coin Tray — `main`@`0c9418b`, prod sw v92.**
>    The two went in as ONE commit on purpose (see the 🪙 block's item 1). **DELETED:
>    `story/FractionForge.tsx`.** Driven on the live origin: the briefing renders with both doors and
>    0 console errors, and `pizza_base.png` — the new menu tile's asset — returns 200.
>    ⚠️ Only the BRIEFING was reached on prod; item 2 below is unchanged by the deploy.
> 2. ⚠️ **NO SCORED `more` OR `op` ROUND HAS BEEN ON SCREEN** — both exist only at L2+, which needs
>    three correct in a row, and both were driven only in the DEMO (same `Board` component, so the
>    rendering is covered; the SkillBeat wrapper is not). **No ten-round run, no re-teach, no mastery
>    exit.** This is the single most useful next drive.
> 3. ⚠️ **STILL NOBODY HAS HELD A REAL HAND UP TO ANY OF THE AR — fifteen readings deep.** Everything
>    above came through `__miloFingers`, which sets the reading directly and **bypasses the detector
>    entirely**, so `STABLE_FRAMES` and whether a nine-year-old's 6–10 fingers read reliably across two
>    hands are unproven. This chapter needs two hands more often than FactorLab does (answers reach 10).
> 4. **The board's top 6px sits under the question card at 640×320.** Documented, deliberate (the clamp
>    protects the tap targets), and worth one look with a founder's eye.
> 5. **`more` and `match` share one picture and differ by one word** ("the same as" vs "beats"). Gated
>    as distinct types with distinct graders, and worth watching a child on — it is the one place this
>    chapter could read as two names for one question.
> 6. **Everything in the 🗑️ and ✋ blocks below still stands**, including that the rebuild shape for the
>    two deleted chapters is an unanswered founder call. `public/sw.js` is still v91.
> 7. Of this session's faults, **two came from reading the shipped code before touching it, two from
>    the gate before it first ran green, two from driving it at 640×320, one from looking at a
>    screenshot, and one from a lint warning on an unused loop variable. None from the type-checker.**
>
> ✋ **2026-08-13 — FACTOR LAB HAS ITS DAILY ANCHOR AND ITS CAMERA IS FULL SCREEN — AND VERIFYING IT FOUND THREE BUGS THAT WERE ALREADY SHIPPING, ONE OF WHICH MARKED A CORRECT-LOOKING ANSWER WRONG OVER A PICTURE WITH NO GAP IN IT. 🚀 SINCE SHIPPED — `main`@`31067ac`; this block's "NOT COMMITTED" is stale.** `tsc` 0 · **808/808 vitest** (was 787, **+21**) · `next build` 0 · **eslint 15 problems against 15 at HEAD**, i.e. none introduced · 0 console errors · 0 server errors · driven at 1280×720 and 640×320 on BOTH inputs · **22/22 planted regressions caught, six of them against my OWN new assertions.**
>
> **The asks:** *"in band 9-11 ka factor and prime chapter ko kaunse daily real world example se sikha rahe hai… AR-plan md waali file dekho"* → **"ok toh usme convert karo aur full screen camera jaise humne bigg number chapter mein kiye hai, taaki baccha acche se AR ka experience le"**.
>
> ## ⓪ ⚠️ THE ANCHOR EXISTED ONLY IN A PLAN DOC, AND THE PLAN'S OWN VERSION OF IT WAS FALSE
> `docs/story-9-11-ar-plan.md` §5 gives this chapter *arranging desks in equal rows for an exam* —
> and `grep -i desk` over `factors.ts` + `FactorLab.tsx` returned **zero**. The briefing said
> *"Milo splits numbers on the bench"*, i.e. no anchor at all, which is exactly what the Fundraiser
> audit measured last year. So the founder's question was correct on the facts.
> ⚠️ **AND THE PLAN'S THE-PLAN LINE CANNOT BE SHIPPED AS WRITTEN:** *"37 won't go into equal rows at
> all, however you push them"* — 37 desks go in one row of 37, or 37 rows of one. A child does not
> push back on a neon bench; a desk they can picture. The chapter's honest claim is narrower and it
> now says BOTH halves at the moment each applies (see §②).
>
> ## ① THE ANCHOR IS A SIMILE IN THE EXPLANATION, NOT A RE-THEME — AND THAT WAS MEASURED, NOT PREFERRED
> `ANCHOR` in factors.ts rides the **briefing card** (both doors) and the **explore beat**, and
> nothing else; every per-round string still names what is drawn, which is parts on a bench.
> ⚠️ **The plan's own §5 says *anchor the EXPLANATION, keep the world*, and The Fundraiser is the one
> recorded exception because dollar denominations ARE base ten** — the anchor and the manipulative
> were the same object, so re-theming REMOVED a bridge instead of adding one. A desk is a skin over a
> unit, and three things break if it is more than a simile:
> • **the pair test has no desk story** — nobody pairs desks, and the bench header would read
>   *"7 pairs"* under a classroom anchor;
> • ⚠️ **`multiple`'s CRATE would collapse into `factor`'s ROW.** `mkMultiple(5,7)` and `mkSplit(35)`
>   are the same 35 parts; the first accepts only 7 and the second accepts 5 AND 7, and `coverage`
>   guarantees the child meets both in one run. Two near-identical sentences, two graders.
> • **a desk SPRITE is the wrong art** — 18px at the top of the range, 100 `<img>` per round, and it
>   cannot carry the stranded-unit recolour that is the chapter's whole visual argument.
> ⚠️ **AND §7.3's CONSTRAINT IS NOT WHAT IT SAYS.** Measured off the generator: the SPLIT rounds top
> out at **63**, and only `multiple` reaches 100 — at **L2 as well as L3**, so the prescribed
> "one word at the top tier" would miss half of them. Nothing was capped; no per-round string names a
> room. (`PRIMES[1]` is also dead data — `POOL[1]` never draws a prime.) The plan doc carries all of
> this as a dated amendment rather than quietly disagreeing with the code.
>
> ## ② ⚠️⚠️ THREE THINGS THAT WERE ALREADY SHIPPING, AND THE FIRST IS THE ONE THAT MATTERS
> ① **A CORRECT-LOOKING ANSWER WAS MARKED WRONG OVER A BENCH WITH NO GAP IN IT.** `showableRows`
> refuses `f === n` in the GENERATOR (n rows of one is every part on its own, not a split) and
> **nothing refused it at the ANSWER**. So a child holding up 6 on a round about 6 got a red verdict
> reading **"0 left over"** over six clean rows, with the miss line saying *"that leaves a gap"* —
> three statements, two of them false. **Four of the five tier-1 split values are within reach of two
> hands**, so it is met in the first minutes. It is a nudge now, the mirror of the existing 1-row one.
> ② **THE VERDICT STRING LIVED IN THE COMPONENT**, where no gate could see a word the child reads —
> the chapter had 40 green tests and none of them could reach it. It is `verdictFor` in the pure
> module now, driven by the gate, with a source check that the scene prints it rather than building
> its own.
> ③ ⚠️ **AND A LEFTOVER COUNT CAN BE THE ANSWER BY COINCIDENCE.** Eight rows out of a pair test of 15
> strand SEVEN, and seven pairs is what was asked — the count of what did not fit printing the
> answer. The miss-line rule reaching the verdict through arithmetic instead of wording.
> Plus two smaller ones: the demo called a `multiple`'s container a ROW while its prompt said CRATE,
> and the bench header said *"4 pairs"* over four rows of THREE.
>
> ## ③ THE CAMERA IS FULL SCREEN — AND THE HONEST REASON IS DIAGNOSTIC, NOT PEDAGOGICAL
> ⚠️ **The usual argument does not apply here and it is worth writing down.** The Fundraiser goes
> full screen because its hand is a CURSOR; this chapter's answer is a **scalar** and the hand's
> position means nothing, so the glancing problem full screen solves does not exist. What it buys is
> that **a MISREAD becomes readable**: the numbered chips over the child's own fingertips say not
> just how many fingers were counted but WHICH.
> ⚠️ **AND THE CORNER PANEL WAS ALREADY TOO SMALL TO DO THAT ONE JOB** — `drawCount` draws chips at
> R = 18 with a 46px offset into a **76px** short-frame panel, i.e. cramped past reading.
> ⚠️⚠️ **BUT THE MARKERS WERE HIDDEN IN FULL MODE, AND THE REASON WAS A REAL BUG RATHER THAN A
> CHOICE.** The loop mapped a landmark with `y * clientHeight`, which assumes the drawn video fills
> its box — true of a 4:3 stream in a 4:3 panel, false of the same stream cover-cropped into 16:9, so
> markers drifted **up to ~120px at 1280×720**. Fixed at the source (`coverView`/`sxy`, the same
> correction a chapter makes for a painted ground line), so `markers` is now a per-chapter CHOICE:
> on here, off in The Fundraiser, which has its own cursor.
> ⚠️ **It is a FIX for the other AR chapters too, not a no-op** — `openCamera` asks 640×480 with
> `ideal`, not `exact`, so a laptop handing back 16:9 was already drawing every corner overlay in the
> wrong place, the sweep's arming zone included.
> ⚠️ **AND THE OTHER HALF OF THE FULL-SCREEN ARGUMENT IS FALSE, so it is recorded rather than
> repeated:** cover-cropping HIDES 12.5% of the camera frame at each end (16.7% at 640×320), where
> the 4:3 panel showed all of it. For *is my hand fully in frame* the corner panel was better.
> Also: the corner reserve is gone (it cost the bench 32px for a panel that is now `inset: 0`), the
> code-drawn backdrop is not painted under an opaque video, and the bench, the note pill, the banner
> and the question card go **opaque** over a camera — measured, the scrim plus a 0.72 panel passes
> ~18.5% of the room, which takes unit-vs-panel contrast from ~4.9:1 to ~2.3:1 on the surface the
> child has to COUNT.
>
> ## ④ ⚠️ THEN AN ADVERSARIAL PASS FOUND SIX MORE, AND TWO OF THEM WERE MINE FROM AN HOUR EARLIER
> ① ⚠️ **THE CAMERA-NOT-READY WINDOW HAD NO BACKGROUND AT ALL.** `fullCam` cannot consult `camReady`
> — the `<video>` must be mounted before `openCamera` can use it — so between entering the lab and
> the picture arriving the backdrop was already dropped and the video was still `opacity: 0`, and the
> whole chapter rendered on the app's **cream page background**, HUD chrome, Milo and the *"Milo
> needs to see your hands"* card floating on it. **Not an edge case: every camera-path entry, every
> denial, every failure.** One property on the root, which is what OrderDesk already has.
> ② ⚠️ **THE SCRIM PAINTED ON TOP OF THE MARKERS I HAD JUST TURNED ON** — siblings in one stacking
> context with no z-index, so DOM order is paint order, and it dimmed by 34% the exact thing the
> change exists to show. Ordered video → scrim → canvas.
> ③ ⚠️ **MY INTRO-CARD COMMENT INVERTED ITS OWN MEASUREMENT.** It claimed both bodies came out
> SHORTER than the ones they replace (215/200 against 232/217); measured, they were **233/218 against
> 206/194 — twenty-five characters LONGER**, and none of the four numbers in the comment corresponded
> to any string in either version. That is *a comment claiming a rule the code does not follow* at its
> most expensive, because it is the one sentence that stops the next reader checking — and by its own
> cited datum (200 chars ≈ 307px in a 320px frame) the copy would have overflowed into the Start
> button, which this repo has shipped once. Now **206/191**, with the count in the comment.
> ④ ⚠️ **AND MY EXPLORE SIMILE WAS A WHOLE SENTENCE**, which took that card from two lines to three at
> 640×320 and drove the bench **15px into the button below it** — the anchor breaking the reserved-band
> rule it was written under. One clause now.
> ⑤ **`benchBand`'s 90px floor broke the reserve it lives inside.** On the guided round at 640×320 the
> question card wraps to `promptBottom = 142`, leaving 58px between the bands — so the floor handed
> back 90 and the bench was drawn **32px INTO the controls**, over the note pill, across the bottom row
> of units. Pre-existing arithmetic, moved verbatim out of `Stage`, and live at the band's own stated
> short-frame size. **The clamp goes on `top` instead**: the bench slides up under the question card —
> text the child has already read — rather than down onto targets they have to hit.
> ⑥ **`w` had become optional on the shared `CamView`**, so a corner caller omitting it would render a
> 0-wide panel and put every marker at the origin, silently. Required again; full mode passes 0.
>
> ## ⑤ THE GATE — +21 tests, and **22/22 planted regressions caught**
> ⚠️ **Six of the twenty-two were caught only after mutation-testing my OWN new assertions**, every
> one this file's recorded shapes: a verdict rule guarded in ONE direction (collapsing it the other
> way survived); `toMatch(/verdictFor\(/)` proving the function is MENTIONED rather than reached (the
> shipped bug restored behind it stayed green); `expect(top).toBeGreaterThanOrEqual(pb)` where
> `top = max(_, pb + 8)` — a tautology, and planting a zero gap survived; `top + band + bot === vh`
> guarded by `if (…>= 90)`, which excludes precisely the case that fails; **counting `${ANCHOR}` twice
> across a card with two bodies**, which two in one body and none in the other satisfies; and
> **nothing anywhere read `HandInput.tsx`**, so hiding the markers again, putting the scrim back on
> top and re-optionalising `w` all walked through.
> New: [camCoverMap.test.ts](src/__tests__/camCoverMap.test.ts) drives the real `coverView`/`sxy` —
> ⚠️ its first version wrote its OWN copy of the mapper and passed with the real one reverted.
>
> ## ⑥ WHAT WAS ACTUALLY DRIVEN
> **1280×720 and 640×320, camera path AND tap path:** the briefing carrying the anchor · the
> full-screen surface with **`labGrid: 0, labBlur90: 0`** (the backdrop genuinely not painted) ·
> the bench measured **opaque `rgb(20,29,62)`** · the marker canvas `display: block` and **last in
> paint order, after the scrim** · the explore beat · the guided round on a forced `mkSplit(6)`
> where **six fingers produced the new nudge and scored nothing, with the bench left undealt** ·
> three fingers grading `6 = 3 × 2` · the camera-denied gate on the chapter's own navy · every
> fixed layer crossed with every other at 640×320 on both inputs, **0 overlaps, 0 offscreen, no
> h-scroll**. A temp `GUIDED`/phase override was used and **reverted and grepped (0 hits)**.
> ⚠️ Two instrument notes: the held-over dwell guard means `__miloFingers` set BEFORE the round
> mounts is correctly refused — lower the hand and raise it again; and a layer sweep whose selector
> matched the full-screen container reported five phantom overlaps.
>
> ## ▶ OPEN
> 1. ⚠️ **STILL NOBODY HAS HELD A REAL HAND UP TO IT — fourteen readings deep**, and this change is the
>    first that would actually be VISIBLE to one: the numbered chips over the fingertips have never
>    been seen on a real camera, because `__miloFingers` bypasses the detect loop entirely and the
>    preview blocks capture. **The cover-map fix is proven by arithmetic and by a unit test, not by a
>    hand.** It is the single most useful next check.
> 2. ⚠️ **AND THE COST IS STATED RATHER THAN HIDDEN: full screen shows LESS of the camera frame.** If
>    a real child's hand keeps being cut off, that is this change, and the fix is a wider capture
>    request (`ideal: 1280×720`) rather than going back to the corner.
> 3. **No ten-round run, no re-teach seen fire, no mastery exit, and no scored round driven at all** —
>    the guided round was reached only through a temp override, because the three demos take ~30s of
>    wall time in a throttled tab.
> 4. **`multiple` and `factor` are still two questions about the same number** (35 parts: crates of 5
>    accepts 7, splitting 35 accepts 5 and 7). Gated as distinct sentences, and it is worth one look
>    with a child.
> 5. **The re-theme is NOT done and that was deliberate** — §① is the argument. If the founder wants
>    the world itself to become a hall, it needs a desk manipulative that can carry the stranded-unit
>    recolour, and `multiple` needs a container that is not a row.
> 6. **Everything in the 🗑️ block below still stands**, including that the rebuild shape for the two
>    deleted chapters is an unanswered founder call. `public/sw.js` is still v90.
> 7. Of this session's faults, **three came from reading the shipped code before touching it, two from
>    driving it at 640×320, one from measuring the intro card's own characters, and six from
>    mutation-testing my own gate. None from the type-checker.**
>
> 🗑️ **2026-08-13 — TIMES TABLES AND DIVISION ARE DELETED, ON THE FOUNDER'S CALL, AFTER HE ASKED WHAT THE CHILD IS ACTUALLY LEARNING. The AR verb that was built first is gone with them. 🚀 SHIPPED.** `tsc` 0 · **787/787 vitest** (was 901, **−114** — exactly the two deleted gates) · `next build` 0 · 0 console errors · server logs clean.
>
> **The asks, in order:** *"Division chapter ke liye kaunsa daily real world example?"* → *"AR ka kya interaction daalne waale hai?"* → *"kuch aur AR ka idea dhundo naa… zyada interactive"* → A′ built and driven → **"but baccha isme sikh kya raha hai… sirf haath hila raha hai"** → **"yeh chapter aur time table chapter delete kardo… isko baad mein sochte hai kaise karna h"**.
>
> ## ⓪ ⚠️ THE FOUNDER IS RIGHT, AND TRACING THE ROUND IS WHAT SETTLES IT RATHER THAN AN OPINION
> One Supply Run round, honestly: Milo says *"22 tins in, 4 trays out"* — **both numbers are STATED** —
> and the child's loop is *sweep · look at the crate · is there still enough to go round again? · Send.*
> **Step 3 is the only decision and it is not arithmetic, it is looking.** Four objects left is a
> glance for a nine-year-old. The app counts the sweeps; the answer is READ OFF the receivers.
> ⇒ **The child is told 22 and 4 and still never has to divide.** That is the Empty Plot fault (*the
> PLOT decided when it was full*) with a crate instead of a floor, and it survived because the file's
> own header claims the opposite — *"nothing on screen says that's enough, deciding when to stop IS
> the skill"* — which is true of the WORDS and false of the picture, because the crate shows you.
> ⚠️ **The steelman, stated so the rebuild does not throw it away: the MODELLING was real.** Dealing 22
> into 4 groups and finding 5 with 2 over is a legitimate concrete-stage act. What is missing is the
> child's own **BOOKKEEPING** — they never hold a number, never predict one, never state one. **No
> gesture fixes that**, which is why A′ (below) improved the feel and changed nothing that matters.
>
> ## ① WHAT WAS BUILT AND THROWN AWAY THE SAME DAY — and one measurement from it is worth keeping
> Asked for a more interactive AR verb, the founder picked **"ek-ek karke baanto"** — grab a unit from
> the crate, carry it, open your hand over the next receiver. **It was measured before building and it
> cannot work**, which is the reusable part: a drop target must beat the hand's own jitter, MediaPipe's
> palm wanders ~±0.02 of frame width, and `reachSpan` stretches its 0.72 band onto the whole viewport
> — so that lands as **±0.028·vw, i.e. ±18px at 640 and ±36px at 1280**. Against the bench's receivers
> (±9 to ±78px apart) **34 of 36 size × reading × slot-count combinations came out UNHITTABLE, worst
> 0.48×**, and it does NOT improve on a big screen because the jitter scales with the width too.
> ⇒ **A dense row cannot be aimed at.** The Long Level's six checkpoints work only because they span
> the FULL width. The way out is to **pass THROUGH a target instead of hitting one** — that became A′
> ("deal as you pass": units land as the hand crosses each receiver), which was built, gated and driven
> live before the chapter was deleted under it. **Both rules are now in chapter-craft §5** and they are
> the only thing that survives the deletion.
> ⚠️ Two of my own claims were wrong and mutation testing caught both: `ARM_STEPS` 6 → 12 was justified
> by a measurement that does not hold (6 already lands one unit at a time; 12 buys only even spacing),
> and `dealtBy`'s clamp is INERT (`stepSweep` caps `arm` below 1). Both recorded rather than left
> looking like cover.
>
> ## ② WHAT WAS DELETED, AND THE ONE THING THAT COULD NOT BE
> Gone: `SupplyRun.tsx` · `FitOut.tsx` · both gates · **16 bespoke assets** · both registry rows · both
> ids from `ChapterType`, `CHAPTER_META` and both route maps. **−3,848 lines.**
> ⚠️⚠️ **THE SKILLS STAY, AND THAT IS NOT TIDINESS.** `i.multFacts`, `i.multMultiDigit` and `i.division`
> keep their nodes with `chapter: ''`. They cannot be removed: **`learner_progress.chapter` and
> `sessions.chapter` are FK'd to `chapters(id)`**, so deleting the DB rows would cascade a child's
> history, and **`i.multFacts` is one of the most load-bearing nodes in the whole 3–18 graph** (factors,
> dataGraphs, wordProblems and 12–14's ratioProportion all stand on it). `diagnose()` already builds
> `planChapters` with `if (ch && …)`, so a chapter-less skill is simply skipped — nothing crashes.
> ⚠️ **THE COST, STATED RATHER THAN HIDDEN: a child whose ROOT gap is multiplication facts now gets a
> plan that starts at its 6–8 prerequisites and never at the gap itself.** That is the right failure
> while no chapter exists and it is a real hole until one does. A test pins that state (`deeperChapter('factorsMultiples')` → null), so the day a chapter returns it goes red and somebody notices.
>
> ## ③ AN UNKNOWN `?ch=` NOW SAYS SO — the deletion made a silent fallback dangerous
> `/story` fell through to the counting picker for any unrecognised key, which reads as *"that chapter
> is fine"*. For a REMOVED chapter that is the worst available answer. It now names the key and lists
> the ones that work — **derived from `PREVIEW`, never typed out**, so it cannot rot as chapters come
> and go. `/game` needs no such guard: its lookup is type-complete.
>
> ## ④ ⚠️ AND I BROKE THE DEV SERVER MYSELF, EXACTLY THE WAY THIS FILE WARNS ABOUT
> The founder hit **Internal Server Error on `/game`**. Not the deletion: I ran `next build` and then
> `rm -rf .next` **with the dev server still up**, so it was reading `build-manifest.json` out of a
> directory I had removed underneath it — 30+ identical `ENOENT`s. Stop the server, clear `.next`,
> restart. Verified after: `/game` bounces a signed-out visitor to `/auth`, `?ch=factors` and
> `?ch=money` render, `/story?story=farm` still jumps straight in, **0 server errors**.
>
> ## ▶ OPEN — the rebuild question, unanswered on purpose
> 1. ⚠️ **THE SHAPE A REBUILD SHOULD START FROM IS THE EMPTY PLOT'S: state what you cannot see, then
>    let the physical act CHECK it.** Three options were put to the founder and **none is picked**:
>    **(a)** tier-linked — deal freely at L1, predict-then-deal at L2/L3 (cheapest, and the hollowness
>    only bites where the numbers are big); **(b)** predict-then-check every round, FitOut's shape;
>    **(c)** change the QUESTION to one that needs the quotient (*"how many will be left over?"*) so the
>    dealing becomes its check and the gesture stays the answer. **Recommended: (a), with (c) inside it
>    at L3.** Do not start without the answer.
> 2. **`infra/ar/sweep.ts` + its 37-test gate now have NO chapter consumer** (`LevelRun` imports only
>    `SWEEP_MAX_Y`), i.e. dead by the value of a condition. **Kept deliberately** — `SWEEP_ARM`, the
>    band-width ergonomics, the posture gate and the seen-crossing teleport guard are measured
>    constants that a rebuild would otherwise re-derive. Delete it if the rebuild picks another verb.
> 3. **The 9–11 band is now 10 chapters, not 12**, and the plan doc carries a dated amendment saying so
>    rather than quietly disagreeing with the code.
> 4. **Everything in the 🧑‍🏫 block below still stands** except what these two chapters owned — including
>    that **nobody has held a real hand up to any of the AR**, thirteen readings deep.
> 5. Of this session's faults, **one came from the founder asking what the child was learning, two from
>    mutation-testing my own new gate, one from measuring a drop target before building it, one from a
>    drive hook that under-covered the gesture it was verifying, and one from `rm -rf .next` with the
>    server running. None from the type-checker.**
>
---

_Older sessions (2026-06-15 → 2026-08-12) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision._
