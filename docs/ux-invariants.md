# Milo — UX Invariants (non-negotiable product rules)

> These are the rules that must hold across every chapter, band, and surface. They
> are distilled from [`ux-design.md`](ux-design.md) into short, checkable statements
> so they survive well-meaning future changes ("let's add a leaderboard for
> engagement") that would quietly erode the fear-free, intrinsic-motivation product.
>
> Treat a violation of any of these as a bug, not a style preference. When reviewing
> a PR or building a new chapter, check it against this list.

---

## A. Emotional safety (the "math without fear" core)

1. **No timers, no countdowns, no time pressure — anywhere in a learner flow.** Time
   pressure disproportionately punishes ADHD executive function and manufactures the
   exact math anxiety the product exists to prevent. (ux-design.md §7)
2. **No red X, no failure sound, no "wrong" verdict screen.** A wrong answer always
   routes *forward* (reveal → re-teach → next), never parks the child on a
   dead-end/error state. (§1, §2)
3. **No visible score, no per-question "X of Y correct" counter, no leaderboard**
   during play. Running scores and comparison convert a mastery experience into a
   performance one. (§2)
4. **Never end a session on a wrong answer or a re-teach.** Engineer the *ending* to
   be a positive, competence-affirming beat regardless of the middle (Peak–End). If a
   child stops mid-struggle, the *next* session opens with a warm, easy re-entry win.
   (§8)

## B. Cognitive load

5. **3–5: exactly one decision on screen at a time.** Stage reveals (object → count
   spoken → settle → *then* the choice). Never show a running total *and* a choice
   *and* a new object entering at once. (§1)
6. **6–11: at most ~3 simultaneous decisions; 12–14+: at most ~4.** The instrument and
   the one current question are the only high-salience elements; chrome (grids,
   brackets, motifs, HUD) stays low-contrast. (§2, §3)
7. **The screen holds the number, not the child's head.** Don't require a learner to
   retain a value that the interface could display. Walkthrough boards are *windowed*
   (≤4 lines) so they never become a memory load themselves. (§6.3)
8. **Answer options: ≤3 for 3–5, ≤4 for older bands.** (§1)

## C. Autonomy, competence, growth mindset

9. **Never show a learner a difficulty tier, level number, or grade-level label.**
   Adaptive tiers are an *engine* concern, invisible to the child. Especially: a teen
   working a cross-band remediation gap must **never** see a grade-level label — frame
   it only as "the foundation that unlocks what you're working toward." (§2, §6.6)
10. **Wrong-answer and re-teach copy is process-oriented and forward-looking.** "Let me
    show you a trick for this one" / "that's the part everyone trips on — here's the
    move." Never "Oops!", "Wrong", empty "try again", or any ability/trait framing. The
    re-teach animates as Milo *leaning in to help*, never as a penalty. (§2)
11. **Provide real choice, not just "Next."** Surface-level choices (world, instrument,
    theme, warm-up, "I've got it → skip") that don't change the math are enough to
    trigger the autonomy benefit. Never let the child pick their own difficulty
    directly. (§2, §3)
12. **Competence is shown without a scoreboard** — via the skill lighting up / a
    concrete "you can now…" capability statement, not a point total. (§2, §3)

## D. Rewards (anti-dark-pattern)

13. **No streaks, no fake urgency, no guilt/loss-aversion re-engagement mechanics** —
    on any surface, including parent/teacher. (Day-streak was deliberately removed;
    keep it gone.) (§4, §6)
14. **Coins are cosmetic-only and decoupled from the math.** Coins may be spent on
    self-expression (Milo outfits, world themes). Coins must **never** be the headline
    reward for a correct answer, and must **never** gate content, difficulty, or
    features. (Overjustification effect.) (§6.1)
15. **Mastery stars are a private, one-time completion mark, not a persistent status
    label.** Don't display a "⭐⭐⭐ tier" as an ongoing rank. (§6.1)

## E. Perceptual / motor

16. **3–5 tap targets are large (~64–75pt) with generous dead space; gestures are
    tap or a big magnetic drop-zone only** — no pinch, no precision drag, no timed
    gesture. (§1)
17. **Every interaction has a low-precision path.** No task may *require* a drag if a
    child can't drag — offer tap-to-place as an equivalent. (§7)
18. **Precision gestures (drag/crank/slide) are fine — and desirable — for 12–14+,**
    where fine motor is developed and the finesse is part of the satisfaction. (§3)

## F. Multimodal / voice

19. **Voice-first for non-readers (3–5): no reading is ever required in the critical
    path.** Any on-screen text is for the over-the-shoulder adult. (§1)
20. **Essential information is never audio-only.** A Deaf or audio-disabled child must
    be able to play — visual scaffolds carry the method; captions for teens. Milo's
    voice is an always-available *parallel* channel for readers, never the sole one.
    (§7)

## G. Accessibility

21. **Never encode meaning in color alone.** Correct/incorrect, category, and tier all
    need a second channel (shape, icon, motion, or voice). (§7)
22. **Respect `prefers-reduced-motion`: informational animations SNAP to their end
    state; decorative looping motion (bobbing cues, floats, confetti) is stilled.**
    Never *remove* information under reduced motion — the parade/glide reveals are
    load-bearing pedagogy, so they must still reach the same end state. No blunt global
    "kill all animation" override. (§7)

## H. Adult surfaces (parent / teacher)

23. **No engagement mechanics ported from the kid UI** (streaks, coins, urgency,
    vanity metrics like time-on-app) on parent/teacher surfaces. (§4, §5)
24. **Never gate a child's own results/plan behind payment as a pressure lever.**
    Capturing a lead to *save* results is acceptable; withholding the value is not.
    (§4, §6.2)
25. **Report what actually happened — no fabricated "mastery %" / "learning score."**
    Trust breaks the moment an adult senses a made-up number. Lead with the child's
    growth story and honest evidence (the week-N re-check). (§4)
26. **No student-vs-student ranking surfaced to a teacher.** Class views group by
    *shared need* (for instruction), never rank kids against each other. (§5)

---

_If a proposed change requires violating one of these, it needs an explicit,
documented product decision from the founder — not a silent exception._
