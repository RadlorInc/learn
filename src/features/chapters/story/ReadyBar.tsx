'use client'
/**
 * ReadyBar — the shared "submit when you are ready" control for the storybook chapters.
 *
 * Asked for by a student, 2026-08-27: *"I noticed this game has a Ready option, this feature should
 * be added to all other games or activities, so users can submit their answer when they are ready."*
 * Three chapters had one (HomeTime, HopAlong, MeasureIt) because in those the child BUILDS a set and
 * needs to say when the set is finished; everywhere else a tap was the answer, graded on contact.
 *
 * ⚠️ WHAT THIS DELIBERATELY IS NOT, AND WHY. The obvious build — hold the grade back behind Ready —
 * is an ORACLE in this band, and it took reading the chapters to see it. Every 3–5 chapter is
 * RETRY-IN-PLACE: a wrong tap sets `erred` and lets the child go again, and the round only ends when
 * they are right. So a Ready gating the grade could only ever be pressed on a correct answer — its
 * mere appearance would say *"that one is right"*, which is the craft doc's oldest rule (nothing may
 * signal the answer before the commit), and it could never change an outcome, which makes it
 * ceremony. Here a tap SELECTS and Ready SUBMITS: the bar appears on any selection, right or wrong,
 * so it tells the child nothing, and the wrong answer it submits is still marked wrong and still
 * retried exactly as before.
 *
 * ⚠️ ONE PLACEMENT, SHARED, because the alternative is twenty independent guesses at a band that is
 * already tight — this file's own history is a list of controls landing on other controls at
 * 640×320. Bottom centre: Milo owns bottom-LEFT in every chapter here (`left: 11%`, up to 260px
 * wide, so he reaches x≈118 on a 640 frame), the answer objects sit on their ground line well above,
 * and the shell's own chrome is top-left and top-right.
 *
 * ⚠️ IDENTICAL AT EVERY STATE. Same colour, same words, same size whatever is selected — a control
 * that changes appearance when the selection happens to be right is the hot/cold game again, wearing
 * a button.
 */
import React from 'react'

/**
 * The mark on a CHOSEN-but-not-yet-submitted answer, shared so twenty chapters cannot each invent
 * their own and drift.
 *
 * ⚠️ A RING, NOT A TRANSFORM, AND THAT IS THE WHOLE REASON IT IS A `boxShadow`. Nearly every answer
 * in this band is an absolutely-positioned element carrying an inline `translate(-50%,-100%)`, so a
 * lift or a scale on the same element silently overrides its POSITION — the trap `Nest` already
 * carries a comment about. A shadow composes with any layout and cannot move anything.
 *
 * ⚠️ AND IT IS NEUTRAL ON PURPOSE. Green means CORRECT everywhere in this app; a chosen answer is
 * not yet right or wrong, and marking it in the colour of a verdict would tell the child the answer
 * before they commit it.
 */
export const PICKED_RING = '0 0 0 4px rgba(255,255,255,.95), 0 0 0 9px rgba(61,37,22,.55)'

export default function ReadyBar({ show, onCommit, label = 'Ready ✓', bottom = 10, align = 'center' }: {
  /** A selection exists. The bar is absent otherwise — never present-but-disabled, because a dead
   *  button a child taps is this repo's worst outcome ("a tap that does nothing"). */
  show: boolean
  onCommit: () => void
  label?: string
  /**
   * Distance from the bottom of the frame. The default puts it in the empty strip every chapter
   * has there; a chapter whose ANSWERS already live in that strip (a row of number chips at
   * `bottom: 3.5%`) passes a value that clears its own row — measured from that row, never guessed,
   * because a bar laid across the answers is worse than no bar at all.
   */
  bottom?: number | string
  /**
   * ⚠️ `right` IS FOR A CHAPTER WHOSE BOTTOM BAND IS ALREADY FULL, and it exists because the
   * obvious alternative was measured and found to be worse. In MarketDay and StoryTime the answer
   * chips sit at `bottom: 3.5%` with the `3 × 3 = ?` readout directly above them; centring the bar
   * anywhere in that column covers one or the other — measured live at 640×320, the bar landed on
   * 190–237 against a readout at 193–235, i.e. exactly on top of the thing the child is reading.
   * The chips only span x 212–428 of a 640 frame, so the free space is SIDEWAYS, not upward.
   */
  align?: 'center' | 'right'
}) {
  if (!show) return null
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom, zIndex: 55, display: 'flex',
      justifyContent: align === 'right' ? 'flex-end' : 'center',
      paddingRight: align === 'right' ? 14 : 0, pointerEvents: 'none' }}>
      <button type="button" onClick={onCommit}
        style={{
          pointerEvents: 'auto', minHeight: 44, padding: '11px 34px', borderRadius: 999, cursor: 'pointer',
          border: '3px solid var(--outline)',
          background: 'linear-gradient(135deg,var(--garden-green),var(--garden-green-deep))',
          color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: 'clamp(15px, 2.2vh, 20px)', boxShadow: '0 5px 0 rgba(61,37,22,.22)',
          animation: 'k_bounceIn .3s cubic-bezier(.34,1.56,.64,1) both',
        }}>{label}</button>
    </div>
  )
}
