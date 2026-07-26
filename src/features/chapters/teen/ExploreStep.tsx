'use client'
/**
 * ExploreStep — the "play with it first" screen that hosts a concept simulation
 * before the worked-example lesson. Discovery-first, the active-learning pattern
 * that drives teen engagement. Deliberately does NOT use CalmAdvance (its
 * full-screen scrim would cover the sim); it renders a normal inline Continue.
 *
 * ── The sim gets its own SECTION, and that section is height-bounded ──
 * This screen used to be a plain stack with `minHeight: 100dvh` — a FLOOR, not a
 * cap — inside the portal's `overflowY: auto`. So on a landscape phone it grew to
 * whatever the content wanted and the overflow became a page scroll. Measured at
 * 640×320 before this: the header ate 125px (39% of the screen), only 187 of the
 * graph's 380px were visible, the sim's own sliders sat at y≈690 and
 * "Skip to the game →" at y=824 — 504px below the fold, with 2.7 screens of
 * content and no affordance but a hairline scrollbar. Nothing was broken, which is
 * exactly why nobody caught it: it all scrolled.
 *
 * The fix is the one GameShell already proves, applied a layer up:
 *   • the root is CAPPED at 100dvh with `minHeight: 0` down the flex chain, so
 *     children can actually shrink instead of pushing the footer off the bottom;
 *   • the sim owns the whole middle SECTION and the Continue can never leave the
 *     screen (that section scrolls internally as a backstop, the page never does);
 *   • on a short frame the sim REFLOWS — see EXPLORE_CSS.
 *
 * ⚠️ Scale-to-fit is not reflow. Wrapping the sim in FitBox alone was measured at
 * 0.35 on a 640×320 frame, i.e. 13px sliders — the same wall the 15–16 responsive
 * pass hit (12×12 steppers, a 61×13 commit button). The height has to come out of
 * the LAYOUT first; only then is scaling cheap.
 */
import type { AgeBand } from '@/features/chapters/teen/types'

export interface ExploreStepProps {
  band: AgeBand
  title: string
  intro?: string
  children: React.ReactNode   // the simulation
  onContinue: () => void
  continueLabel?: string
}

/**
 * SHORT-LANDSCAPE reflow, done once here rather than in 21 sim files.
 *
 * It is safe to reach into the sim from outside because every sim in
 * features/chapters/teen/sims is the SAME shape — a `flex-direction: column`
 * root with a fixed `maxWidth` (340–420) whose FIRST child is the square graph
 * and whose remaining children are readouts, controls and a caption. (Verified
 * across all 21: 21 range inputs, 4 buttons, zero custom pointer handlers, so a
 * layout change here cannot break any sim's input — the browser hit-tests native
 * range inputs itself.)
 *
 * The root becomes a GRID rather than a flex row: the graph spans column 1 and
 * every other child stacks down column 2. Flex-row cannot do that — it would put
 * the readout, the controls and the caption side by side and wrap them into a
 * second line taller than the frame.
 *
 * The graph is the dominant term: it is SQUARE and its height is derived from its
 * width (CoordGrid renders `width="100%"` into a square viewBox), so capping its
 * width is what finally gives it a height. `min(38vw, 64vh)` — the vh term is the
 * one that binds on a short frame, the vw term stops it eating the controls'
 * column on a wide one.
 */
const EXPLORE_CSS = `
.mb-explore { height: 100dvh; max-height: 100dvh; overflow: hidden; }
.mb-explore-main { flex: 1; min-height: 0; overflow-y: auto; }
.mb-explore-fit { width: 100%; display: flex; align-items: center; justify-content: center; }

@media (max-height: 469px) {
  /* Buy height back from the CHROME only. Every attempt to buy it from the CONTENT
     was wrong: one pass hid the intro, the next hid the sim's closing paragraph, and
     between them they removed the only text saying what the sim is for and what to
     notice in it. The sim reflows itself instead — see sims/SimLayout.tsx. */
  .mb-explore-intro { font-size: 12px !important; line-height: 1.35 !important; margin-top: 3px !important; }
  .mb-explore-head { padding: 6px 16px 2px !important; }
  .mb-explore-main { max-width: none !important; padding: 2px 14px 4px !important; }
  .mb-explore-foot { padding: 0 16px 8px !important; }
  .mb-explore-fit input[type="range"] { min-height: 24px; }
}
`

export default function ExploreStep({ band, title, intro, children, onContinue, continueLabel = 'Continue' }: ExploreStepProps) {
  void band // theme comes from the ancestor data-band scope
  return (
    <div className="milo-lesson mb-explore" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-page)', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
      <style>{EXPLORE_CSS}</style>
      <header className="mb-explore-head" style={{ width: '100%', maxWidth: 560, padding: '16px 18px 4px', boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Explore</div>
        <h1 style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>{title}</h1>
        {intro && <p className="mb-explore-intro" style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>{intro}</p>}
      </header>

      <main className="mb-explore-main" style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 18px 16px', boxSizing: 'border-box' }}>
        <div className="mb-explore-fit">{children}</div>
      </main>

      <footer className="mb-explore-foot" style={{ width: '100%', maxWidth: 560, padding: '0 18px 24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <button type="button" onClick={onContinue} style={{ padding: '12px 22px', borderRadius: 10, background: 'var(--accent)', border: '1px solid var(--accent)', color: 'var(--fg-on-color)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          {continueLabel} →
        </button>
      </footer>
    </div>
  )
}
