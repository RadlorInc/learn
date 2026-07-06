# Prompt: Psychology-Driven UX Design for Milo

I'm building **Milo**, an adaptive math-learning app for kids ages 3–18, split into bands: Story Mode (3–5, narrative/tap-based counting), lower chapters (6–11, skill-graph curriculum), and Teen Games (12–14+, real-world scenario games like "Store Checkout" for percentages or "Sky Tower" for signed numbers). Each chapter uses a shared adaptive engine: invisible difficulty tiers (easy/med/hard) that demote on wrong answers, re-teach after 3 wrong in a row, and a mastery early-exit. A mascot named Milo narrates everything (no on-screen text walls for pre-readers). There's a diagnostic placement test, a parent dashboard, a teacher/grades view, and a wallet/coins economy (no streaks, no timers, no red X's, no visible score — the product philosophy is explicitly "math without fear").

I want you to act as a **UX designer applying psychological principles**, not just a visual designer. Produce a UX design grounded in behavioral science, specifically addressing:

1. **Flow theory (Csikszentmihalyi)** — how the adaptive difficulty engine's pacing, feedback timing, and challenge-skill balance should be reflected in the interface itself (transitions, pacing of reveals, when to introduce friction vs. remove it).

2. **Cognitive load theory** — for each age band, how information should be chunked, sequenced, and how many simultaneous decisions a child should ever face on screen. Call out where the current "baby-step" walkthroughs might still overload working memory.

3. **Self-Determination Theory (autonomy, competence, relatedness)** — concrete UI mechanisms that give the child a sense of choice (not just "next"), visible competence growth (without a scoreboard), and relatedness to Milo as a character.

4. **Growth mindset framing (Dweck)** — how copy, error states, and the re-teach moment should be worded and animated so mistakes read as informative, not as failure.

5. **Zone of Proximal Development / scaffolding (Vygotsky)** — how visual/audio scaffolding should fade as competence rises, tied to the existing difficulty-tier and warm-up mechanics.

6. **Ethical engagement, not dark patterns** — since the audience is children, explicitly design AGAINST manipulative retention mechanics (no fake urgency, no guilt-based streaks, no pay-to-win pressure). Propose a reward system that reinforces intrinsic motivation instead of compulsive re-engagement, and flag any current mechanic (wallet/coins, mastery stamps) that risks tipping into extrinsic-only motivation.

7. **Age-appropriate perceptual/motor design** — Fitts's Law tap-target sizing and gesture choice for 3–5 (fine motor still developing) vs. 12–14 (can handle drag/crank/precision gestures); color psychology and visual complexity appropriate to each band; multimodal design (voice-first for non-readers, text-supported for older kids).

8. **Peak-End rule** — how each session should be designed to end on a deliberately positive, memorable beat regardless of how the middle of the session went.

9. **Trust and transparency for the parent/teacher-facing surfaces** — these users need a different psychological approach: clarity, control, and evidence of efficacy rather than engagement mechanics. Design the parent dashboard and diagnostic/lead-capture flow around trust-building, not conversion pressure.

10. **Accessibility and inclusive design** — sensory/motor/cognitive accessibility considerations across the full age range, including neurodivergent learners (many math-anxious or ADHD kids are a core audience for a "fear-free" math product).

**Deliverable format:** For each of the three age bands (3–5, 6–11, 12–14+) and the two adult-facing surfaces (parent dashboard, teacher/grades view), give me:
- The core psychological principle(s) driving that surface's design
- Specific, concrete UI/interaction recommendations (not abstract advice)
- What to explicitly avoid, and why
- One thing in the current design (as I've described it) that already aligns well, and one thing that likely conflicts with the principle

Push back on anything in my description that seems psychologically counterproductive for a children's learning product — I'd rather hear the critique now than after it's built.

**Once the analysis above is done:** write it up as a proper UX design doc at `docs/ux-design.md` in this repo, structured by age band + adult surface as above, so it can guide future implementation work.
