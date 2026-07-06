# Milo — Psychology-Driven UX Design

> A UX design doc grounded in behavioral science, structured by the surfaces that
> actually ship: three learner age bands (3–5, 6–11, 12–14+) and two adult surfaces
> (parent dashboard, teacher/grades view). Each section states the driving
> psychological principle(s), gives concrete UI/interaction recommendations,
> names what to explicitly avoid, and calls out one thing already aligned and one
> thing that conflicts. A closing section pushes back on parts of the current
> design that are psychologically counterproductive.

_Source of truth for future UX implementation work. Written to be actionable, not aspirational._

---

## 0. The ten principles, in one table

| # | Principle | The one-line UX consequence for Milo |
|---|-----------|--------------------------------------|
| 1 | **Flow (Csikszentmihalyi)** | The interface must make challenge≈skill *felt*, not just computed. Pacing, reveal timing and friction are the visible face of the invisible difficulty engine. |
| 2 | **Cognitive load (Sweller)** | Cap simultaneous decisions per screen (≈1 for 3–5, ≤3 for 6–11, ≤4 for teens). Chunk, sequence, and never make the child hold a number in their head that the screen could hold for them. |
| 3 | **Self-Determination (Deci & Ryan)** | Every session must supply *autonomy* (real choice), *competence* (visible growth without a scoreboard) and *relatedness* (Milo as a someone, not a UI chrome). |
| 4 | **Growth mindset (Dweck)** | Wrong answers are data, not verdicts. The re-teach moment is the product's crown jewel — design it as "let me show you," never "you failed." |
| 5 | **ZPD / scaffolding (Vygotsky)** | Scaffolds (voice, highlights, hand-cues, worked lines) must *fade* as the tier rises and *return* on demotion. Support is a dial, not a constant. |
| 6 | **Ethical engagement (anti-dark-pattern)** | Design *against* compulsion. No fake urgency, no guilt, no loss-aversion loops. Rewards reinforce the *activity*, not the *return visit*. |
| 7 | **Perceptual/motor (Fitts + color/complexity)** | Tap targets and gestures matched to motor reality per age; visual complexity and palette matched to attention capacity per age. |
| 8 | **Peak–End (Kahneman)** | Every session ends on a deliberately warm, competence-affirming beat — regardless of the middle. |
| 9 | **Trust & transparency (adults)** | Parents/teachers get clarity, control and evidence — not engagement mechanics. Build the funnel around trust, never conversion pressure. |
| 10 | **Accessibility & inclusion** | The whole range, including math-anxious / ADHD / dyslexic / motor-atypical learners, who are a *core* audience for a fear-free math product — not an edge case. |

**How the invisible engine maps to the visible UI.** The adaptive engine already does the
right *computational* things — demote on wrong, re-teach after 3-in-a-row, mastery early-exit,
resume-at-tier, optional warm-up. This doc is almost entirely about making those computations
*legible to a child's nervous system* without ever surfacing them as numbers. The engine is the
autonomic nervous system; the UX is the face.

---

## 1. Age band 3–5 — Story Mode

**What it is today:** landscape narrative worlds (Counting parade, etc.), Milo narrates
everything, tap-the-thing / tap-the-number answers, real sprites (not emoji), staged reveals,
a green ✓ on correct and Milo speaking gently *only* on wrong.

### Driving principles
Primarily **cognitive load** (working memory at 3–5 is ~1–2 items and largely non-verbal),
**relatedness** (a pre-reader bonds with a voice and a face, not a system), **perceptual/motor**
(fine motor still forming — large targets, forgiving gestures, no drag precision), and
**Peak–End** (a 4-year-old remembers the *feeling*, not the content).

### Concrete recommendations
- **One decision per screen. Non-negotiable.** The parade model already does this well: one
  creature is "live" at a time. Extend the rule everywhere — never show a running total *and*
  a choice *and* a new creature entering simultaneously. Stage them: object → count spoken →
  object settles → *then* the choice appears. (The current staged-reveal work is exactly right;
  make it a hard invariant, not a per-chapter decision.)
- **Voice-first, text-never.** For non-readers, the numeral is a *picture*, not text. Keep the
  count number floating above the object as a glyph the child associates with the spoken word.
  No sentences on screen. The prompt pill should be tappable-to-replay (a speaker affordance),
  but the child should never *need* to read it.
- **Tap targets ≥ 44pt, ideally ~64–75pt, with generous dead space between them (Fitts's Law).**
  A 4-year-old's tap lands within a wide radius of intent. The bigger the target and the larger
  the inter-target gap, the fewer "I tapped the wrong duck" frustrations. The responsive
  `clamp()` sizing pass already scales targets up on big screens — good; add a *minimum* floor
  tuned to a toddler thumb, not an adult's.
- **Only forgiving gestures: tap and, at most, a big drag-to-a-large-zone.** No pinch, no
  precision drag, no timed gesture. If a "drag the creature into the basket" mechanic is ever
  added, the drop zone must be huge and magnetic (snaps when *near*, not *on*).
- **Warm, saturated, low-count palette.** 3–5 attention is captured by high-saturation primaries
  and simple figure/ground. Keep backgrounds soft and low-contrast so the *interactive* object
  is unambiguously the brightest, most saturated thing on screen (the current "faint motif +
  hero object" instinct is correct — enforce it: the answer object must always win the
  saliency contest).
- **Milo as a someone.** Milo should have idle "aliveness" (breathing, blink, small looks toward
  the object being counted) so relatedness accrues even in silence. On a wrong tap Milo *helps*
  ("let's count together") — never reacts with disappointment. This is already the intent; make
  Milo's gaze physically point at the current object to guide attention (joint attention is how
  toddlers learn).
- **Peak–End: end every session on a parade bow.** Regardless of how many were wrong, the last
  beat is a short celebratory moment where the creatures the child counted "come back to say
  bye" and Milo names the child's effort ("you counted *so many* today"). Short, warm, same
  every time (ritual = safety for this age).

### Explicitly avoid
- **No timers, no red X, no failure sound.** (Already the philosophy — hold the line hardest
  here; a startle response at 4 is how math anxiety is *born*.)
- **No accumulating on-screen clutter.** Do not let counted objects, tally pills, choices, and
  Milo's speech bubble all coexist. The `CollectTray` collecting-into-one-row idea is good
  *because* it replaces a growing number pill with a single bounded object — keep that discipline.
- **No reading requirement anywhere in the critical path.** Any text is for the over-the-shoulder
  parent, never a gate for the child.
- **No choice overload.** 2–3 answer options maximum. Four is already stretching a 4-year-old's
  comparison capacity.

### One thing already aligned / one that conflicts
- **Aligned:** "Milo speaks gently *only* on a wrong answer, correct shows just a ✓, no spoken
  praise on every question." This is a genuinely sophisticated move — it prevents praise
  inflation (which erodes intrinsic motivation, per Dweck/Deci) *and* reduces per-item cognitive
  load. Keep it.
- **Conflicts:** the parade's *pacing* is a flow risk at the extremes. A confident 5-year-old
  will find the slowed cadence (2.6s travel, 2700ms) *under*-challenging and disengage; a
  struggling 3-year-old may find even that too fast. **Recommendation:** let cadence itself be a
  scaffold that the difficulty tier modulates — faster/tighter as the child succeeds, slower with
  more Milo support on demotion. Right now pacing is a fixed authorial choice; it should be part
  of the ZPD dial.

---

## 2. Age band 6–11 — Skill-graph chapters (story worlds + "Number Lab" HUD)

**What it is today:** 6–8 runs the 3–5 story pattern (world picker → intro → demo → guided →
adaptive practice with re-teach + mastery); 9–11 uses a darker "Mission HUD / Number Lab" look
(neon accents, code-drawn instruments, mono numerals) because storybook reads too young. Baby-step
walkthroughs, question-variety dedupe, resume-at-tier, optional warm-up.

### Driving principles
**Flow** (this is the band where challenge–skill balance is most winnable and most losable),
**ZPD/scaffolding** (the baby-step walkthroughs *are* scaffolding — the question is when they
fade), **growth mindset** (readers can now process worded feedback — so the *words* matter),
and **autonomy/competence** (a 9-year-old wants agency and visible mastery, not a cartoon telling
them "good job").

### Concrete recommendations
- **Make challenge–skill balance visible without a score.** Flow depends on the learner sensing
  "this is right at my edge." Surface it as *texture*, not numbers: on a correct answer at the
  current tier, the next question arrives promptly (momentum); after a demotion, the interface
  visibly *slows and softens* (more Milo, a re-shown worked line, a warmer background tint) so the
  child feels "okay, easier now" without being told "you dropped a level." The tier transition
  should be a *felt* change in the room's temperature, not an announcement.
- **Fade scaffolds as the tier rises (this is the core 6–11 lever).** Concretely:
  - *Easy tier:* full walkthrough available, hand-cue on the instrument, worked line on the
    board, Milo narrates the method.
  - *Med tier:* hand-cue gone, board shows only the *setup* not the steps, Milo narrates only the
    first move.
  - *Hard tier:* instrument only, no cue, Milo silent unless asked. The child is now working in
    their independent zone — and *that experience of unaided success is the competence reward.*
  - On demotion, scaffolds return one level. This makes Vygotsky's ZPD a live, self-adjusting
    band rather than a fixed tutorial.
- **Chunk the baby-steps — and let the confident skip.** The ~9–14 baby-step walkthroughs are the
  right *instinct* (each conceptual jump its own beat) but risk overloading working memory the
  *other* way: 14 sequential board lines is itself a memory load, and a child who "gets it" at
  step 4 is now trapped watching 10 more. **Recommendations:** (a) window the board to the last
  ~3–4 lines so earlier lines don't compound visual load (already flagged as an easy follow-up —
  do it); (b) add a gentle "I've got it →" affordance that lets the child *choose* to jump to
  practice (autonomy + respects the child who's ahead); (c) treat walkthrough length itself as
  tier-dependent — full baby-steps at easy, a compressed 3-beat version at hard.
- **Autonomy through real choice, not "Next."** The world/instrument picker is good. Add
  low-stakes choices that don't change the math: which of two equivalent worlds, which Milo
  outfit, whether to warm up. Choice over *surface* is enough to trigger the autonomy benefit;
  you don't need to (and shouldn't) let them choose difficulty directly.
- **Competence made visible without a scoreboard:** a per-skill "you can do this now" moment —
  when the engine fires mastery early-exit, that's a *narrative* beat ("you don't need me for
  this anymore"), not a star count. Show the *skill* lighting up on a small personal map (the
  skill graph the diagnostic already uses) so growth is spatial and cumulative, not point-based.
- **Growth-mindset copy, precisely worded.** Every wrong-answer and re-teach string should be
  *process-oriented and forward-looking*:
  - ✅ "Let me show you a trick for this one." / "Almost — watch what happens when we line them up."
  / "That's the tricky part everyone trips on. Here's the move."
  - ❌ "Oops!", "Not quite, try again" (empty), "Wrong", anything with a frown, any "you" +
    negative-trait framing.
  The re-teach after 3-wrong should feel like *Milo leaning in to help*, not a penalty screen —
  animate it as Milo stepping *closer* / the instrument zooming to show the mechanism, warm
  color shift, unhurried pace.

### Explicitly avoid
- **No visible tier / level-number on the play surface.** Resume-at-tier and warm-up are great
  *engine* features; never label them "Level 3" to the child mid-play (the start-screen "you
  left off at Champion ⭐⭐⭐" is a borderline case — see pushback §6).
- **No leaderboards, no per-question score, no "X of Y correct" counter during play.** Comparison
  and running scores convert a mastery experience into a performance one (Dweck's ego-orientation)
  — corrosive for exactly the math-anxious kids you're built for.
- **No dead-end "wrong" state.** A wrong answer must always route *forward* (reveal/re-teach/next),
  never park the child on a red screen.
- **Don't let the HUD aesthetic add cognitive load.** The 9–11 neon "Mission HUD" is
  motivationally smart (ages up, feels like a tool not a toy) but visually busy. Enforce: the
  *instrument* and the *one current question* are the only high-salience elements; brackets,
  grids, starfields stay low-contrast chrome.

### One thing already aligned / one that conflicts
- **Aligned:** re-teach-after-3-in-a-row that *narrates the method* (`task.work`) is textbook
  ZPD + growth mindset — the support arrives exactly when the child has entered their frustration
  zone, and it teaches rather than judges. This is the single best mechanic in the product.
- **Conflicts:** the baby-step walkthroughs are currently a *fixed authorial length* applied
  regardless of tier or the individual child. That's a cognitive-load and flow hazard: overload
  for the struggling child (14 steps to hold), boredom-drop for the fluent one (no skip). Tie
  walkthrough depth to the tier and give an opt-out, per above.

---

## 3. Age band 12–14+ — Teen Games ("Field Lab")

**What it is today:** real-world scenario games on a shared `GameShell` — Store Checkout
(percentages), Sky Tower (signed numbers), Taxi Meter (algebraic expressions), etc. A permanent
chalkboard carries the math; Milo *speaks* but doesn't print dialog; animated "explainer-video"
walkthroughs act the math out (elevator glides, receipt collapses); precision gestures (drag,
crank, slide, tap-the-plane); mature dark-first visual language.

### Driving principles
**Relevance-as-relatedness** (teens engage when the content connects to a real world they
recognize — the whole "real-world scenario" bet is the right one), **competence** (teens need to
*feel* capably and be treated as capable — no cartoon condescension), **autonomy** (agency and
self-direction spike in adolescence), **flow** (teens can tolerate and *want* more challenge —
under-challenging them reads as "this app thinks I'm a kid"), and **perceptual/motor** (fully
developed fine motor — precision gestures are an *asset* here, a feeling of mastery).

### Concrete recommendations
- **Lean into precision gestures as competence signals.** Drag/crank/slide are correct for this
  band — the physical accuracy *is* part of the satisfaction (Fitts's Law inverts here: a
  slightly demanding target that rewards precision feels good to a 13-year-old the way it would
  frustrate a 4-year-old). Keep targets comfortably tappable but let the gesture carry
  finesse (the elevator gliding floor-by-floor to the exact answer is a great example — the
  motion *is* the reward).
- **The animated walkthrough is the flagship — protect its flow.** "Act the math out, synced to
  narration" is genuinely excellent: it externalizes the working memory load (the child watches
  the transformation instead of holding it). Two refinements: (a) let the teen *scrub or replay*
  a beat (autonomy + supports different processing speeds — a math-anxious teen may need beat 3
  twice); (b) after the first mastery, *offer to skip the walkthrough* — a teen who's got it and
  is forced to re-watch will feel infantilized and disengage.
- **Relevance must be real, not a costume.** The scenarios only pay off if the math genuinely
  belongs to the situation (Taxi Meter fare = base + rate×km is honest). Avoid "theme paint over
  a worksheet" — teens have a sharp radar for fake relevance, and a detected fake *costs* trust.
  Where a scenario is a stretch, prefer a cleaner abstract instrument over a forced theme.
- **Treat mistakes as debugging, not failure.** For this band, growth-mindset framing shifts from
  Milo's warmth to *systems* language teens respect: "Let's find where it breaks." The re-teach
  should feel like a coach reviewing the tape, not a tutor scolding. Milo becomes a
  *collaborator* — the framing docs already call this "character → collaborator"; make the copy
  register match (drop the diminutives, keep the warmth).
- **Visible competence for teens = the skill map + real-world "you could now…" statements.**
  Instead of stamps, close a chapter with a concrete capability claim: "You can now work out any
  discount in your head." That's competence they can *test in the world* — far stronger than a
  coin.
- **Autonomy: let teens choose their path through the skill graph where the graph allows it.**
  If two chapters are both unlocked, present them as a choice, not a queue. Optional "challenge
  mode" (start at hard tier) for teens who want to prove out — opt-in, never defaulted.
- **Text is now an asset, not a hazard.** Teens read fluently; the chalkboard math notation
  (mono, real symbols) is right. You can support voice *with* text rather than replacing it —
  captions on Milo's narration aid accessibility and let teens who prefer reading move faster.

### Explicitly avoid
- **No childish reward theatre.** Confetti, cartoon stamps, and coin jingles read as
  condescension to a 13-year-old and undercut the "we treat you as capable" contract. Reward =
  quiet, credible acknowledgment of a real capability.
- **No under-challenge.** The biggest teen-retention risk isn't difficulty — it's *boredom*. If
  the engine's mastery early-exit is too eager, a strong teen breezes through and concludes the
  app is beneath them. Bias the teen band toward *offering* more challenge.
- **No forced re-watch of walkthroughs once mastered** (see above — the fastest way to lose a teen).
- **No visible "you're behind" framing** even though cross-band remediation means a 15-year-old
  may be working a grade-6 gap. The diagnostic's cross-band design is a *strength* — but the
  surfacing to a teen must be "here's the foundation that unlocks the rest," never "you're at a
  6th-grade level."

### One thing already aligned / one that conflicts
- **Aligned:** the whole "real-world scenario + act-the-math-out + Milo-as-collaborator + no
  visible score/timer" package is a rare, well-reasoned fit for adolescent psychology. The
  animated explainers in particular do real cognitive-load-reduction work while feeling like
  content, not instruction.
- **Conflicts:** the shared wallet/coins economy (inherited across all bands) is *most* corrosive
  here. Coins are a extrinsic-only motivator that, for teens, simultaneously feels childish *and*
  risks the classic overjustification effect (undermining intrinsic interest in the math itself).
  See §6 — the teen band should arguably drop coins for capability-based feedback entirely.

---

## 4. Parent dashboard

**Driving principles:** **trust & transparency**, and a deliberate *absence* of the engagement
psychology used on kids. Parents are evaluating whether to trust you with their child's
confidence and their own money — the operative emotions are reassurance and control, not
excitement.

### Concrete recommendations
- **Lead with the child's growth story, not app-usage metrics.** Show "what they can do now" and
  "the one thing we're working on next" (the diagnostic's root-gap framing is perfect for this:
  strengths → the single snag → the plan). Avoid time-on-app, streak-length, or coins-earned as
  headline numbers — those are engagement vanity metrics that trust-oriented parents (rightly)
  discount or distrust.
- **Make efficacy legible and honest.** The re-check ("the gap closed") loop is the strongest
  trust asset the product has — *show it plainly*: "6 weeks ago, X was stuck on Y. Today, X can do
  Y." Evidence of change beats any promise. If the gap *hasn't* closed, say so and show the
  adjusted plan — honesty here compounds trust far more than a green checkmark ever could.
- **Give parents control, not just visibility.** Let them see (and adjust) the plan, pause,
  choose chapters, set the child's name/theme. Control is the antidote to the "black-box
  algorithm decides my kid's education" anxiety.
- **The diagnostic/lead-capture flow must be trust-first, not conversion-first.** The email gate
  before the diagnostic is a real tension (see §6). Frame it as "so we can save your child's
  results and plan," deliver the full value (the actual root-gap report) *regardless* of whether
  they convert, and never hold results hostage. A parent who gets genuine value ungated converts
  from *trust*; a parent who hits a paywall on their child's results converts from *pressure* and
  churns.
- **Plain language, no jargon, no dark UX.** No "limited time," no "3 other parents viewing," no
  guilt ("you haven't checked in on X in 5 days"). The dashboard should feel like a
  pediatrician's after-visit summary: calm, clear, credible.
- **Respect that the parent is often anxious about *their own* math history.** Copy should never
  assume the parent can help with the math or make them feel judged for their child's gaps. "We've
  got this — here's what's happening" over "here's what you should do."

### Explicitly avoid
- **No engagement mechanics ported from the kid UI** (streaks, coins, urgency). What motivates a
  child bores or alienates a parent.
- **No conversion pressure on child data.** Never gate the child's own results/plan behind
  payment or account creation as a *pressure* lever. (Capturing a lead to *save* results is fine;
  withholding the value is not.)
- **No false precision.** Don't present a "mastery %" or a fabricated "learning score" — parents'
  trust breaks the moment they sense a made-up number. Report what actually happened.

### One thing already aligned / one that conflicts
- **Aligned:** the day-streak was *removed entirely* (including from insights). That's a genuinely
  principled anti-dark-pattern decision — streaks are the canonical guilt/loss-aversion
  retention mechanic, and cutting them from the parent view too shows the philosophy is real, not
  marketing. Keep it gone.
- **Conflicts:** the required-email gate *before* the diagnostic, on cold traffic, is a
  conversion-first move sitting inside a trust-first surface. It's defensible as lead capture, but
  it front-loads a "give me your email before you see any value" ask — exactly the pressure
  pattern the rest of the design avoids. Mitigation in §6.

---

## 5. Teacher / grades view

**Driving principles:** **trust & transparency** again, but the teacher's needs differ from the
parent's: *efficiency, class-level clarity, and actionable grouping* over reassurance. A teacher
is a professional managing 30 kids, not one anxious parent managing one.

### Concrete recommendations
- **Optimize for the "who needs what, right now" glance.** The teacher's core job is triage.
  Surface the class as a grouping: who's stuck on the same root gap (natural small-group
  instruction), who's ready to move on, who hasn't started. Make the *action* (assign, group,
  re-check) one click from the insight.
- **Class-level patterns, not per-kid surveillance.** Show distributions ("8 students share a
  fractions gap") that inform whole-class or small-group teaching. Avoid framing that invites
  ranking students against each other — a teacher-facing leaderboard would leak into how kids get
  treated.
- **Evidence a teacher can defend to *their* stakeholders** (admins, parents). The diagnostic's
  skill-graph root-gap analysis and the week-N re-check are exactly the kind of "here's the
  specific skill, here's the growth" evidence a teacher needs. Make it exportable/printable.
- **Grades = a planning tool, honor its constraints.** The existing grades feature (band + chosen
  chapter subset) is good; the UX should make it fast to build a grade, clone one for next term,
  and see at a glance which chapters a grade has/hasn't covered.
- **Never gamify the teacher.** No engagement mechanics, no "your class earned 500 coins." The
  teacher's reward is *their students' visible progress and their own saved time.*

### Explicitly avoid
- **No student-vs-student ranking surfaced to the teacher** (it changes teacher behavior toward
  kids and violates the fear-free ethos at one remove).
- **No vanity class metrics** (total minutes, total coins) as headline — same reason as the parent
  dashboard, doubled for a professional audience that will discount them instantly.
- **No hiding the method.** Teachers distrust black boxes more than parents do; expose *why* the
  engine placed a student where it did (which prerequisites failed) so the teacher can exercise
  professional judgment and override.

### One thing already aligned / one that conflicts
- **Aligned:** grades scope children to a hand-picked chapter subset — that respects teacher
  autonomy and real curriculum sequencing instead of forcing the app's default order. Good
  professional-tool instinct.
- **Conflicts:** there's currently no evident *class-level triage view* — the strength of the
  system (root-gap analysis) is per-child, but a teacher needs it *aggregated into groups*. Without
  that rollup, the teacher's highest-value use case (small-group instruction by shared gap) isn't
  served. Build the aggregate.

---

## 6. Pushback — where the current design is psychologically counterproductive

You asked to hear the critique now. Here are the places the described design fights its own
philosophy, ordered by how much they matter.

### 6.1 The wallet/coins economy is the biggest philosophical contradiction
A "math without fear," intrinsic-motivation product that also runs a coin economy is in tension
with itself. The research is unusually clear here:
- **Overjustification effect (Deci, Lepper):** paying (in coins) for an activity a child might
  otherwise find interesting *reduces* intrinsic interest over time — the child reframes "I do
  math because it's satisfying" into "I do math to get coins," and engagement collapses when the
  coins lose novelty.
- **Coins are an extrinsic, quantity-based reward** — precisely the class Dweck's work warns
  against, because they pull attention toward *accumulation* (an ego/performance orientation)
  and away from *mastery*.

**Recommendation — don't necessarily delete coins, but change what they're *for*.** Safe
versions: coins buy *expression* (Milo outfits, world themes, cosmetic personalization) — this
keeps them extrinsic-but-autonomy-supporting and *decoupled from the math* (spending on
self-expression doesn't overjustify the learning). Dangerous versions to avoid: coins as the
*headline feedback* for correct answers, coins that gate content, coins with any scarcity/FOMO
pressure. **For the teen band specifically, consider dropping coins entirely** in favor of
capability statements — coins there are both childish and maximally overjustifying.

Also flag the **mastery stamps (⭐⭐⭐)**: three stars is a *score with a different skin*. It's
milder than a number, but "you left off at Champion ⭐⭐⭐" on the start screen (see §2) reintroduces
exactly the visible-tier/performance framing the play surface works so hard to hide. Prefer
"pick up where you left off" over a star-tier badge, or make the stars a private, non-comparative
"you've mastered this" mark shown *once at completion*, not a persistent status label.

### 6.2 The required email gate before the diagnostic undercuts trust
Gating a child's placement results behind an email on cold traffic is a conversion pattern inside
what should be a trust surface (§4). The value (root-gap report) is the strongest trust-builder
you have; front-loading a data ask before delivering it inverts the order. **Recommendation:** run
the diagnostic *first*, show the real report, *then* offer to save it via email/account. You'll
capture fewer raw emails and far more *qualified, trusting* ones — and you won't have taught a
prospective parent that you withhold their child's information as leverage.

### 6.3 Fixed-length baby-step walkthroughs are a two-sided cognitive-load failure
Covered in §2, but it's a genuine risk so it earns a pushback line: a 14-line walkthrough is
simultaneously *too much* (working-memory load, no windowing) for the struggling child and *too
much* (no skip, forced pace) for the fluent one. A scaffold that can't fade isn't a scaffold —
it's a wall. Tie depth to tier; window the board; add an "I've got it" opt-out.

### 6.4 Fixed authorial pacing is an anti-flow constant
The parade cadence (3–5) and, to a lesser extent, walkthrough pacing (6–11) are currently fixed
authorial choices. Flow requires pacing to track skill. A single fixed speed is guaranteed to be
too slow for some children and too fast for others *on the same screen*. Make cadence part of the
difficulty dial.

### 6.5 "No praise on correct" is right for 3–5 — verify it's right for older kids
The decision to speak only on wrong answers and show a bare ✓ is excellent for pre-readers
(§1). But it was noted as an *app-wide* SkillBeat change affecting all story chapters. For 6–11,
a *little* process-specific acknowledgment ("nice — you lined those up right") can reinforce the
*strategy* (Dweck-approved, because it praises process not ability). **Recommendation:** keep
correct answers quiet by default, but allow occasional, *specific, process-oriented* Milo
acknowledgments for older kids — not "good job!" (empty, ability-flavored) but "you found the
common denominator first — that's the trick." Confirm the founder actually wants total silence-on-
correct for the older bands, or whether sparse process-praise is better there.

### 6.6 Cross-band remediation is a strength — but a surfacing landmine
Placing a 15-year-old on a grade-6 gap is pedagogically correct and a real moat. It is also the
single most *shame-triggering* thing the product can do if surfaced carelessly. There must be an
absolute rule: **never show a teen (or their peers) a grade-level label.** Frame purely as
"the foundation that unlocks what you're working toward." This deserves to be a written product
invariant, not a per-screen copy decision.

---

## 7. Cross-cutting: accessibility & inclusive design (all surfaces)

Because the fear-free math audience *is disproportionately* math-anxious, ADHD, dyslexic, and
motor-atypical learners, accessibility is core, not a compliance afterthought.

- **Sensory:** never encode meaning in color alone (correct/incorrect, tier, categories all need a
  second channel — shape, icon, motion, or Milo's voice). Respect `prefers-reduced-motion` — the
  glide/parade animations are load-bearing pedagogy, so provide a reduced-motion variant that
  *snaps* to the same end states rather than removing the information. Keep audio essential-but-
  never-*only*: a Deaf or audio-disabled child must be able to play (visual scaffolds carry the
  method; captions for teens).
- **Motor:** large targets and forgiving gestures for 3–5 (§1); for *all* bands, ensure every
  interaction has a low-precision path (no interaction should *require* a drag if the child can't
  drag — offer tap-to-place as an equivalent). Generous hit areas and no time pressure help ADHD
  and motor-atypical kids equally.
- **Cognitive / attention (ADHD):** one decision per screen (3–5) and few decisions (6–11+) is
  itself an ADHD accommodation. Minimize distractors on the play surface (the "instrument wins
  saliency" rule). Short sessions with strong Peak–End beats suit variable attention. Avoid *any*
  countdown or time pressure — it's disproportionately punishing to ADHD executive function and
  directly manufactures the anxiety you're trying to prevent.
- **Math anxiety specifically:** the entire no-score/no-timer/no-red-X/warm-re-teach stack is,
  in effect, a math-anxiety intervention. Name it as such internally so it's protected from
  well-meaning "let's add a leaderboard for engagement" pressure later.
- **Neurodiverse strengths:** offer the "I've got it, skip ahead" and "challenge mode" opt-outs
  (§2, §3) — twice-exceptional and fast-processing kids need an escape from scaffolding as much
  as struggling kids need the scaffolding itself.
- **Language/reading:** voice-first for non-readers is already the design; for readers, don't
  bury meaning in text a dyslexic child must decode under pressure — keep Milo's voice as an
  always-available parallel channel, and use a dyslexia-friendly type treatment for any numerals/
  labels that matter.

---

## 8. Peak–End, made concrete for every surface

The Peak–End rule (people remember an experience by its emotional peak and its ending, not its
average) is cheap to honor and disproportionately powerful for a learning product a child must
*choose to return to*.

- **3–5:** the parade bow — the counted creatures return, Milo names the *effort*. Same warm
  ritual every time.
- **6–11:** end on the skill lighting up on the personal map + a concrete "you can now…" line.
  If the session was rough, the *last* item is deliberately within reach so the child ends on a
  success (engineer the end, not just the average).
- **12–14+:** end on a credible capability statement tied to the real world ("you can price any
  discount now"). No confetti — a quiet, respected acknowledgment.
- **All bands:** never end a session on a wrong answer or a re-teach. If the child stops mid-
  struggle, the *next* session should open with a warm, easy re-entry win, not the hard item they
  left on. The engineered positive ending is what makes tomorrow's session feel safe to start.

---

## 9. Implementation priorities (what to build first)

Ordered by leverage-to-effort:

1. **Window the walkthrough board to the last ~3–4 lines + add an "I've got it →" opt-out** (6–11,
   teens). Directly fixes the two-sided cognitive-load problem; small change. (§2, §6.3)
2. **Tie scaffold depth and pacing to the difficulty tier** (fade on success, return on demotion;
   modulate parade cadence and walkthrough length). Turns the existing invisible engine into a
   *felt* flow/ZPD experience with mostly presentation-layer work. (§1, §2, §6.4)
3. **Rework the diagnostic → email order to value-first** (show the report, then offer to save).
   Trust win, likely-better qualified conversion. (§4, §6.2)
4. **Build the teacher class-level triage/grouping rollup.** Unlocks the highest-value teacher use
   case. (§5)
5. **Redefine coins as cosmetic/expression-only and drop the persistent ⭐-tier status label**
   (consider removing coins entirely for teens). Resolves the core intrinsic-motivation
   contradiction. (§6.1)
6. **Codify the invariants** as written product rules: one-decision-per-screen (3–5), no visible
   tier/grade-level to any learner, never end on a wrong answer, essential-info-never-audio-only.
   (§1, §6.6, §7, §8)
7. **Reduced-motion variants** that preserve end-state information for the load-bearing
   animations. (§7)

---

_Design philosophy in one sentence: the engine already does the hard adaptive math invisibly —
the UX's whole job is to let a child (and the adults around them) **feel** competence, safety and
genuine choice, and to refuse every shortcut that would trade a child's intrinsic motivation for
a retention metric._
