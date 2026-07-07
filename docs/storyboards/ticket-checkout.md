# Storyboard — "Ticket Checkout" (Expressions & Variables, 15–16)

> Sibling of [the-shot.md](the-shot.md) in the 15–16 animation upgrade. Medium:
> **hand-authored SVG + Framer Motion** (no generated image assets). The precise
> math skeleton (the price expression `3·x + 5`, the substituted `3(2) + 5`, the
> exact line-item dollars, and the running **total**) stays code-drawn and correct;
> the *stage* around it — the checkout app window, the fanned tickets, the receipt
> rows, the paying total — is vector art authored to this board. One continuous
> checkout, driven by the same `value = {k:'num', n}` protocol GameShell already
> feeds the scene (`n` is the amount currently on the total readout), plus
> `stepIndex` to gate which parts of the order have appeared. Nothing about the
> game loop changes.

## The teaching beat
Worked example: **3x + 5** with **x = 2** tickets. A ticket price is an
*expression* with a variable: `3` = dollars per ticket, `x` = how many tickets,
`+ 5` = the one-off booking fee. To **evaluate**, swap `x` for its value and work
it out: `3(2) + 5 = 6 + 5 = 11`. The total is **$11**. Substitution is the whole
idea — the letter is a placeholder that becomes a number, and the total is what
falls out.

## Stage (persistent set, drawn once)
A stylised checkout screen, all vector:
- **App window** — a cream card at a slight tilt with a title bar (three dots +
  "checkout"), like a receipt caught mid-order. Never competes with the math.
- **Tickets** — two admission tickets that **fan in** when the order is set
  (perforation dashes, a `$3` stub, "ADMIT ONE"); they say "x = 2" physically.
- **Price-formula strip** — the load-bearing skeleton: `price = 3 · [x] + 5`, the
  variable inside a **highlight pill** that flips from `x` to `2` on substitution.
- **Receipt rows** — line items with dotted leaders: `2 tickets × $3 → $6`,
  `booking fee → $5`, then a rule and the **TOTAL**.
- **Total readout** — a large dollar figure that **counts up continuously**
  (0 → 6 → 11) driven by a `useMotionValue`, turning mint when the order settles.

## Shot list

| # | beat | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Establish** (`step 0`, n=0) | Window fades up; formula strip draws in `3·x + 5`; total reads `$0`, "working…". | Card fade 400ms; formula tokens draw; total idles at 0. | `3x + 5` | "checkout" |
| 1 | **The letter** (`step 1`, n=0) | The `x` pill pulses — it's a placeholder for a number. | Variable pill glows/springs. | `x = tickets` | "checkout" |
| 2 | **The order** (`step 2`, n=0) | Two tickets **fan in** from the left, staggered. | Tickets slide + spring, ±tilt, stagger 80ms. | `x = 2` | "checkout" |
| 3 | **Per-ticket price** (`step 3`, n=0) | The `3·` term underlines — $3 each. | Highlight bar springs under `3`. | `3 = $ per ticket` | "checkout" |
| 4 | **Booking fee** (`step 4`, n=0) | The `+ 5` term underlines; the **booking-fee row** reveals `$5`. | Highlight under `+5`; fee value springs in. | `+ 5 = booking fee` | "checkout" |
| 5 | **Substitute** (`step 5`, n=0) | The variable pill **flips** `x → 2`; strip reads `3(2) + 5`. | Pill flip (rotateY) to gold `2`. | `3(2) + 5` | "substitute" |
| 6 | **Ticket part** (`step 6`, n=6) | `3 × 2 = 6`; the **tickets row** reveals `$6`; total glides `0 → 6`. | Tickets-row value springs; total count-up 0→6. | `3 × 2 = 6` | "adding it up" |
| 7 | **Read it** (`step 7`, n=6) | Order now reads `6 + 5`; total holds at `$6`. | Board line writes; total steady. | `6 + 5` | "adding it up" |
| 8 | **Add the fee** (`step 8`, n=6) | The fee row highlights, ready to join the total. | Fee row pulse. | `add the $5 fee` | "adding it up" |
| 9 | **Settle** (`step 9`, n=11) | `6 + 5 = 11`; total glides `6 → 11`. | Total count-up 6→11 with slight overshoot. | `= 11` | "total" |
| 10 | **Paid** (`step 10`, n=11) | Total turns **mint**, a paid shimmer sweeps the card. | Total recolor + pulse; shimmer sweep. | `total = $11` | "total ✓" |

## Non-walkthrough states (intro preview / ended)
The scene is shown in the intro preview (`stepIndex 0`) and holds its end state
once the walkthrough `ended`:
- **intro preview** — the establish frame: formula strip, `$0`, no tickets yet.
- **ended** — the paid frame: tickets fanned, both rows filled, `$11` in mint.

## Motion principles (apply to every 15–16 scene)
1. **Continuous, value-following count-up** — the total rides a `useMotionValue`
   animated to `value.n`, so it *glides* between beats (0 → 6 → 11) instead of
   snapping. Mapped through `useTransform` to a `$N` string bound to `motion.text`.
2. **Anticipation + follow-through** — tickets overshoot as they fan in; the total
   eases with a soft overshoot on the final add; the pill flips, not fades.
3. **Spring the discrete marks** — ticket entrances, row values, and highlights
   use springs, not linear fades.
4. **Draw, don't pop, the lines** — the formula strip and dotted leaders draw with
   `pathLength`.
5. **Math stays exact** — the total readout is the real number, the line-item
   dollars are exact, the strip shows the real substitution; art never displaces a
   number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows the
   end state (tickets in, `$11`), same as the reference scene.
