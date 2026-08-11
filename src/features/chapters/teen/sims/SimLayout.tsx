'use client'
/**
 * SimLayout — the shared responsive shell for an Explore sim.
 *
 * A sim is a tall column: a square-ish VISUAL on top, then its controls, readouts
 * and a closing line of explanation. That is right on a phone held upright and
 * wrong on one held sideways, where the column measured ~708px against a ~190px
 * band and pushed everything below it off the screen.
 *
 * ── Why the sim declares its own parts ──
 * The first attempt did this reflow from ExploreStep with a descendant selector,
 * treating "the first child" as the visual. That is a GUESS, and it is wrong for at
 * least SequenceExplorer, whose first child is a mode-toggle row and whose chart is
 * second — it reflowed the buttons into the visual slot and left the chart in the
 * text column at every size. Passing `visual` explicitly costs one small edit per
 * sim and cannot be wrong, including for a sim written later.
 *
 * ── Nothing is ever hidden ──
 * Two passes tried to buy height by dropping prose — first the intro, then the
 * closing paragraph. Both were wrong for the same reason: that text is the only
 * thing telling a learner what the sim is for and what to notice in it. Height
 * comes out of the VISUAL, which has room to give, and out of spacing. If a sim
 * genuinely cannot fit, its section scrolls — it does not go quiet.
 */
import type { ReactNode } from 'react'
import { disp } from '@/core/fmt'

const SIM_CSS = `
.mb-sim-controls { display: flex; flex-direction: column; gap: 12px; min-width: 0; }

/* SHORT LANDSCAPE — the phone-held-sideways case. The 469px breakpoint matches the
   teen shell's own gate (GameShell useFrame, innerHeight < 470) so a chapter does
   not change shape halfway down itself.
   NB no backticks in this string: it is a JS template literal, and a backtick in a
   CSS comment silently ends it (cost three build breaks before this note existed). */
@media (max-height: 469px) {
  .mb-sim { flex-direction: row !important; align-items: center !important; max-width: none !important; gap: 18px !important; }
  /* The visual is square and WIDTH-driven (an svg at width:100% in a square
     viewBox), so capping its width is the only way to give it a height. The vh term
     binds on a short frame; the vw term stops it crowding out the controls. */
  .mb-sim-visual { flex: 0 0 auto; width: min(38vw, 52vh) !important; }
  /* !important beats the inline gap the sim passes through for tall frames. */
  .mb-sim-controls { flex: 1 1 auto; gap: 8px !important; align-items: stretch !important; }
}
`

export interface SimLayoutProps {
  /** The chart / grid / diagram — the part that may shrink. */
  visual: ReactNode
  /** Controls, readouts and explanation. Always fully visible. */
  children: ReactNode
  /** The sim's natural column width on a tall frame. */
  maxWidth?: number
  /** The sim's own column gap. Passed through so a TALL frame renders exactly as it
   *  did before the sim was converted — this shell must be invisible above 469px. */
  gap?: number
  /** Likewise the sim's own cross-axis alignment. */
  align?: 'center' | 'stretch'
}

export default function SimLayout({ visual, children, maxWidth = 420, gap = 16, align = 'stretch' }: SimLayoutProps) {
  return (
    <div className="mb-sim" style={{ width: '100%', maxWidth, display: 'flex', flexDirection: 'column', alignItems: align, gap }}>
      <style>{SIM_CSS}</style>
      <div className="mb-sim-visual" style={{ width: '100%' }}>{visual}</div>
      {/* width:100% is load-bearing. Without it this box shrinks to its content under
          `align: center`, and every control that sizes itself `width: '100%'` — which is
          most sliders in these sims — would then measure against the shrunk box instead
          of the sim's real column width. */}
      <div className="mb-sim-controls" style={{ width: '100%', alignItems: align, gap }}>{children}</div>
    </div>
  )
}

/**
 * The one slider every Explore sim drives its parameter with. It was written out
 * thirteen times, differing only in the two column widths and the step — and in how
 * each copy rendered a negative, which is exactly the drift `disp` exists to stop
 * (two of the copies carried their own private re-implementation of it).
 *
 * `labelW`/`valueW` are real per-sim layout numbers, not config: the label column has
 * to fit that sim's longest label ("start value" is wider than "b"). Anything a caller
 * needs to DO to the value — clamping, skipping zero — belongs in its own `onChange`,
 * not in a prop here.
 */
export function Slider({ label, value, min, max, onChange, step = 1, labelW = 64, valueW = 40, suffix = '' }: {
  label: string; value: number; min: number; max: number; onChange: (n: number) => void
  step?: number; labelW?: number; valueW?: number; suffix?: string
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', fontFamily: 'var(--font-body)' }}>
      <span style={{ width: labelW, fontSize: 14, color: 'var(--ink-soft)' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
        aria-label={label}
      />
      <span style={{ width: valueW, textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
        {disp(value)}{suffix}
      </span>
    </label>
  )
}
