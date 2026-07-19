# Prompt: Full Visual UI/UX Design for Milo (Design Phase — Before Implementation)

Read `docs/ux-design.md` first — it's the psychology-grounded UX analysis (flow theory, cognitive load, self-determination theory, growth mindset, ethical engagement, etc.) already done for this app, broken out by age band (3–5, 6–11, 12–14+) and adult surfaces (parent dashboard, teacher/grades). Everything below builds ON TOP of that doc — don't re-derive the psychology, just design to it. Also skim `docs/teen-game-pattern.md` for the existing Teen Games visual language (chalkboard, motif backdrops, gameKit instruments) so the new design either deliberately extends it or deliberately replaces it — call out which.

I need the actual **visual design** now: colors, typography, components, layout, and mockups — not more analysis. This is the design phase; implementation into code comes after, as a separate step.

## What to produce

For **each of the 5 surfaces** — Story Mode (3–5), lower chapters (6–11), Teen Games (12–14+), Parent Dashboard, Teacher/Grades view — deliver:

1. **Color palette** — primary/secondary/accent/background/feedback colors (success, gentle-error, neutral) as hex values, with a one-line rationale per color tied to the age band's psychology (e.g., why 3–5 gets high-saturation primaries but 12–14 gets a more muted, "not-babyish" palette). Show all 5 palettes together so I can see how they relate as one coherent brand vs. five disconnected looks.

2. **Typography** — font family, sizes, and weights for headings/body/buttons/numbers, with minimum tap-target and font-size rules per age band (tie to the Fitts's Law point from the UX doc).

3. **Component/button design** — for every interactive element type that recurs across the app (primary action button, answer tile, drag/crank/slide instrument handle, the chalkboard board, Milo's speech surface, progress/mastery indicator, coin/wallet display): what it looks like, its states (default/hover/active/disabled/correct/incorrect-gentle), and sizing rules. Flag any component the UX doc said to fix (e.g., mastery stars, coin display) and show BOTH the current-implied look and your redesigned version.

4. **Screen-by-screen overview** — a mockup (as inline HTML/CSS you can render, or a clear annotated layout description if a visual isn't feasible) for these key screens: age-band home/menu, a Story Mode counting screen, a lower-chapter lesson screen, a Teen Game play screen, the diagnostic, the parent dashboard home, the teacher/grades view. Each mockup should show real Milo copy/state, not lorem ipsum.

5. **Motion/interaction rules** — pacing of transitions, how feedback animates (correct/incorrect), how scaffolding visually fades as difficulty rises, tied to the flow-theory and ZPD sections of the UX doc.

6. **Milo the mascot** — a visual design direction for Milo (shape language, expression states: idle/encouraging/thinking/celebrating) consistent across all age bands, since Milo is the one constant across a very wide age range.

7. **One-page design-system summary** at the end: a single reference table (palette swatches, type scale, spacing scale, component states) so this can be handed to an engineer as a build spec.

## Constraints

- Output as a real deliverable file: write it to `docs/ui-design-system.md`, with any HTML/CSS mockups as separate files under `docs/design-mockups/` I can open in a browser.
- Ground every major choice in the existing `docs/ux-design.md` findings — reference the section when you do (e.g., "per §2, cognitive load for 6–11...").
- Don't touch any app code yet — this is designs and specs only. Implementation is a follow-up task once I've reviewed this.
- If anything in `docs/ux-design.md`'s recommendations conflicts with good visual design (e.g., "no visible score" vs. needing SOME progress feedback), resolve it visually and explain the resolution.
