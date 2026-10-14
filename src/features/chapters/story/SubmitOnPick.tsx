'use client'
/**
 * SubmitOnPick — a choice in a storybook chapter is the answer, submitted the moment it is made.
 *
 * Founder, 2026-10-01: the green Ready button goes. The child taps an answer and at once hears and sees
 * whether it is right; a wrong one is still retried in place with an encouraging line, exactly as before.
 * (It replaced the shared Ready bar asked for by a student on 2026-08-27, which held every tap until Ready.)
 *
 * Every chapter keeps its own "chosen" state and its own commit; this is the one place they all route through,
 * so the rule lives here once instead of in fourteen tap handlers. It renders nothing, and it knows nothing
 * about which answer is right: it commits ANY choice, so it cannot hint at the answer.
 */
import { useEffect } from 'react'

/**
 * The mark on a chosen answer, shared so the chapters cannot each invent their own. It is now on screen only
 * for the frame between the tap and its grading.
 *
 * ⚠️ A RING, NOT A TRANSFORM: nearly every answer here is absolutely positioned with an inline
 * `translate(-50%,-100%)`, so a lift or scale on the same element would override its POSITION. And neutral,
 * not green: green means CORRECT in this app.
 */
export const PICKED_RING = '0 0 0 4px rgba(255,255,255,.95), 0 0 0 9px rgba(61,37,22,.55)'

export default function SubmitOnPick({ show, onCommit }: {
  /** A choice exists. */
  show: boolean
  /** The chapter's own commit: grade the chosen answer and clear the choice. */
  onCommit: () => void
}) {
  // After the render that holds the choice, so `onCommit` reads it. The commit clears the choice, so this
  // runs once per tap.
  useEffect(() => { if (show) onCommit() }, [show, onCommit])
  return null
}
