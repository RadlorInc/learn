# Skill Graph — self-audit, and the teacher's shortlist

**Why this exists.** `src/core/skillGraph.ts` still says *"STATUS: v0.9 DRAFT — prerequisite edges
are pedagogical claims pending teacher validation. **A wrong edge = a wrong root gap.** Do not ship
the guarantee on a band until that band's spine edges are validated."* The diagnostic's SEARCH now
names the exact planted gap 96–98% of the time — so the engine has stopped being the bottleneck and
the graph has started being it. A perfect search over a wrong graph gives a wrong gap, confidently.

[skill-graph-validation.md](skill-graph-validation.md) is the checklist a teacher fills in. It has
74 nodes and 130 edges in it and every box is empty, which is why nobody has started. **This file
cuts that to twelve edges**, ranked by what a wrong answer would actually cost — measured, not
guessed.

---

## ⓪ How the ranking was made, and what it does NOT prove

For every one of the 130 edges: **remove it, re-run all 201 plantable gaps across the five child
bands with a perfect answerer, and count how many diagnoses change.** A perfect answerer is used on
purpose — it isolates the GRAPH's contribution from the items' noise.

Two numbers per edge:
- **roots** — how many children would be told a *different gap*. This is the damage that matters:
  a wrong gap is a wrong 6-week plan and a broken promise.
- **routes** — how many would get the same gap but a different chapter list. Milder: they still
  start in the right place.

⚠️⚠️ **THIS METHOD CANNOT SEE A MISSING EDGE.** It tests only the claims that are written down. The
validation checklist's second question — *"is anything MISSING that a stuck child would be lacking?"*
— is exactly the half no measurement here can reach, and it is the half most likely to be wrong: a
graph is built by writing down what you think of, so the omissions are by definition the things
nobody thought of. **§3 is my own read on that, and it is opinion, not measurement.**

⚠️ It also cannot tell a *correct* edge from a *load-bearing* one. A high score means "if this is
wrong, it costs a lot", never "this is wrong".

---

## ① PRIORITY 1 — the twelve edges that decide a GAP

Every edge below changes at least 3 of 201 diagnoses if it is wrong. **Validate these first.**
Read `X ← A` as *"to succeed at X a child must already have A."*

| roots | routes | edge | the question to ask |
|---|---|---|---|
| **13** | 38 | `p.addTo100` ← `e.addWithin10` | Adding two-digit numbers requires adding within ten. Almost certainly right — flagged only because it carries more diagnoses than any other edge, so a surprise here is expensive. |
| **12** | 52 | `p.subTo100` ← `p.addTo100` | ⚠️ **My strongest doubt — see §3.1.** Does subtracting within 100 really require *adding* within 100, or are they siblings? |
| **8** | 34 | `e.addWithin10` ← `e.matchQty` | Joining two groups requires knowing a numeral names a quantity. |
| **7** | 21 | `m.geomMeasure` ← `i.areaPerimeter` | Area/volume/Pythagoras requires area & perimeter. |
| **5** | 19 | `e.matchQty` ← `e.numeralRecog` | Matching numeral↔quantity requires recognising the numeral. Near-definitional. |
| **5** | 5 | `p.shapes2d3d` ← `e.shapes2d` | 2D/3D attributes require recognising 2D shapes. |
| **4** | 30 | `i.multFacts` ← `p.multConcept` | Fact fluency requires understanding multiplication as equal groups. |
| **4** | 26 | `i.fractionEquiv` ← `p.fractionsIntro` | Equivalence requires unit fractions. |
| **4** | 8 | `i.areaPerimeter` ← `p.shapes2d3d` | ⚠️ Does computing a rectangle's area require the **3D** half of that chapter? Possibly too strong. |
| **3** | 50 | `m.exponentsRoots` ← `i.factors` | ⚠️ Do squares and square roots require *factors, multiples and primes*? Not obvious. |
| **3** | 25 | `m.integers` ← `p.compare100` | Ordering negatives requires comparing to 100. ⚠️ Note this skips the whole 9–11 band — see §4.2. |
| **3** | 11 | `m.coordinatePlane` ← `e.numberOrder` | ⚠️ A grade 6–8 skill reaching straight back to a Pre-K one, past everything between. Looks like a leftover — see §3.3. |

---

## ② PRIORITY 2 — edges that change only the ROUTE

These never change which gap is named; they change which chapters follow it. Worth a second pass,
not a first one. The largest are `a.slopeGraphs ← m.linearRel` (58 routes), `m.orderOps ←
m.exponentsRoots` (53), `m.equationsIneq ← m.algExpressions` (50), `i.factors ← i.division` (47),
`a.functions ← a.slopeGraphs` (59).

⚠️⚠️ **AND ONE OF THEM IS THE CLAIM THE CHECKLIST TOLD THE TEACHER TO VALIDATE FIRST.**
[skill-graph-validation.md](skill-graph-validation.md) marks `i.fractionEquiv ← i.multFacts` as its
**"High-risk claim: does equivalent fractions truly require *fact fluency*, or only skip-counting?"**
Measured, that edge is **0 roots / 16 routes** — if it is wrong, not one child is told the wrong gap.
It is a real question and it belongs in pass two. **The instinct about which claims are risky and
the measurement of which claims are costly do not agree**, which is the whole reason for ranking
this way rather than by hunch.

---

## ③ WHAT I THINK IS ACTUALLY WRONG — opinion, not measurement

### 3.1 `p.subTo100 ← p.addTo100`, and the missing `e.subWithin10` ⚠️ my top finding
Subtracting within 100 is claimed to require *adding* within 100. They are siblings, not a chain:
a child can take away without being fluent at putting together, and the thing subtraction genuinely
needs is **place value** (which is already claimed, via `p.addTo100 ← p.placeValue2`) and **taking
away within ten**.

And `e.subWithin10` exists in the graph and is **nobody's prerequisite**. That is the shape of an
omission: the skill was written down and then never wired to the thing it obviously underpins.

Suggested: `p.subTo100 ← [p.placeValue2, e.subWithin10]`. **12 of 201 diagnoses turn on this edge**,
the second-highest in the graph — so if the shape is wrong, it is wrong expensively.

### 3.2 `m.exponentsRoots ← i.factors`
Squaring a number and taking a square root do not obviously require primes and factor pairs.
Scientific notation certainly does not. My guess is the real prerequisite is `i.multFacts`, which is
already claimed. If `i.factors` is dropped here, 3 roots and 50 routes move.

### 3.3 `m.coordinatePlane ← e.numberOrder`
A 12–14 skill whose prerequisite is a Pre-K one, skipping five bands. `m.coordinatePlane` already
claims `m.integers`, which itself needs ordering — so this reads as a leftover from an earlier draft
rather than a claim anybody would make out loud. It is worth 3 roots.

### 3.4 `i.areaPerimeter` ← `p.shapes2d3d`
`p.shapes2d3d` is "2D **and 3D** shapes & attributes". Rectangle area needs the 2D half. The edge may
be claiming more than it means — the honest prerequisite might be `e.shapes2d`.

### 3.5 `e.colors` does not belong in a maths skill graph
It has no prerequisites, nothing depends on it, no probe reaches it and it has no item. It is inert
— but it is also the one node in a mathematics prerequisite graph that is not mathematics. Either
delete it or say in the file why a colour chapter is tracked here.

### 3.6 The five graph roots are an assertion nobody has checked
`e.counting10`, `e.numeralRecog`, `e.shapes2d`, `e.patterns`, `e.colors` have no prerequisites at
all, which claims *nothing in this product comes before them*. That is probably right and it is
load-bearing: `e.counting10` alone blocks **67 of 74 skills**, so it is where deep diagnoses bottom
out. If something belongs beneath it, every deep diagnosis in the app stops one level too high.

---

## ④ STRUCTURAL FINDINGS (measured, no pedagogy needed)

### 4.1 Twenty-one edges change NOTHING when removed
`e.addWithin10 ← e.counting10` · `e.subWithin10 ← e.addWithin10` · `p.wordProbAddSub ← p.addTo100` ·
`i.multFacts ← p.skipCount` · `i.multMultiDigit ← i.multFacts` · `i.factors ← i.multFacts` ·
`i.measureUnits ← i.multFacts` · `m.exponentsRoots ← i.multFacts` · `m.equationsIneq ← m.signedOps` ·
`a.expressions ← m.orderOps` · `a.functions ← a.linearEqIneq` · `a.systems ← a.linearEqIneq` ·
`a.expPolynomials ← m.exponentsRoots` · `a.radicals ← m.exponentsRoots` ·
`c.polynomialFns ← a.factoring` · `c.polynomialFns ← c.functionToolkit` · `c.rationalFns ← a.factoring` ·
`c.rationalFns ← i.fractionOps` · `c.unitCircleTrig ← m.ratioProportion` ·
`c.statsInference ← m.ratioProportion` · `c.introCalculus ← c.functionToolkit`

Most are **transitively redundant** — the same skill is already reached through another prerequisite,
so writing it twice adds nothing. ⚠️ **"Changes nothing" is not "wrong" and not "delete it".** It
means the current probe never has to decide on it. Change the entry points and some of these wake
up. They are simply the last thing worth a teacher's hour.

### 4.2 Two edges skip a whole band
- `m.integers` ← `p.compare100`, `p.subTo100` — a 12–14 skill resting entirely on 6–8, with nothing
  from 9–11 in between. Plausible (integers really are an extension of comparing and taking away),
  but it means a 12–14 child failing integers descends **straight past the 9–11 band**.
- `c.statsInference` ← `i.dataGraphs`, `m.percentages`, `m.ratioProportion` — reaches back to 9–11.

### 4.3 Twenty nodes rest on a single claim
`e.numberOrder`, `e.compare`, `e.subWithin10`, `e.measureCompare`, `p.numbersTo100`, `p.placeValue2`,
`p.compare100`, `p.skipCount`, `p.subTo100`, `p.multConcept`, `p.fractionsIntro`, `p.time`,
`p.shapes2d3d`, `i.bigNumbers`, `i.rounding`, `i.fractionOps`, `i.anglesSymmetry`, `m.signedOps`,
`c.functionToolkit`, `c.systemsMatrices` each have exactly ONE prerequisite. For these the question
is not "is this edge right" but **"is this the ONLY thing a stuck child would be missing?"** — the
omission question, which the sensitivity measurement cannot answer.

### 4.4 Where deep diagnoses bottom out
`e.counting10` blocks 67 skills · `p.numbersTo100` 55 · `p.placeValue2` 51 · `e.numeralRecog` 49 ·
`e.matchQty` 48 · `p.skipCount` 48 · `e.addWithin10` 45 · `p.multConcept` 45 · `i.multFacts` 44.
An edge into or out of one of these is worth more scrutiny than its raw score suggests, because
those nodes are where the search ends.

---

## ⑤ What to do with this

1. **A teacher red-pens §1 — twelve edges.** That is the hour that protects the guarantee.
2. **Then §3 — five specific suggestions**, each of which I believe is wrong and none of which I can
   prove without them.
3. **Then §4.3 asks the omission question** on the twenty single-claim nodes. That is the half no
   measurement reaches, and where the graph is most likely to be incomplete.
4. §2 and §4.1 are pass two and pass three. Nothing in them changes which gap a child is told.

⚠️ Re-run the ranking after any edge changes — it is a property of the whole graph, not of one edge,
and the numbers move when the shape does.
