'use client'
/**
 * A ref that always holds the newest value of something, for reading LATER — inside a timer, an
 * animation loop, a speech callback or an event listener that was registered once and must not be
 * torn down and rebuilt every time a value changes.
 *
 * This is the single most repeated idiom in the codebase: `const xRef = useRef(x); xRef.current = x`
 * appeared verbatim in 20 files, from the AR hand reader to the shared critter engine. It is now
 * written once, so the reasoning below is written once too.
 *
 * ⚠️ WHY THE WRITE STAYS IN THE RENDER PHASE, WITH THE LINT SILENCED RATHER THAN OBEYED.
 *
 * `react-hooks/refs` is right in general: a render-phase side effect is not safe, because React may
 * render twice (StrictMode) or throw a render away entirely (a discarded concurrent render), and the
 * write has already happened either way. That is a real bug when the write ACCUMULATES — a route
 * that gains a duplicate corner, a list that grows twice — and one of those was found and fixed in
 * WalkHome while clearing this rule.
 *
 * This assignment is different in the one way that matters: it is IDEMPOTENT. It stores the value
 * this render was given, so running it twice stores the same thing, and a discarded render stores a
 * value that the render replacing it immediately overwrites with its own. There is no state to
 * corrupt.
 *
 * The alternative — writing in an effect — is not equivalent and is not obviously safer here. The
 * ref would then be one commit stale for anything that reads it before effects flush, and these refs
 * are read from callbacks whose timing this code does not control (a `speechSynthesis` event, a
 * MediaPipe frame, a `setTimeout` armed elsewhere). Swapping a correct idiom for a subtly different
 * one across 20 files — including the camera path, which cannot be driven headlessly — is risk
 * bought with no behavioural gain.
 *
 * So: one disable, with the argument, instead of 32 scattered violations. The point of clearing the
 * rule is that a NEW render-phase ref write should be visible; that still holds, and this helper is
 * the sanctioned way to say "I meant it".
 *
 * Use it when the value is READ LATER. If you need to accumulate across renders, you want state
 * (see WalkHome's route), not this.
 */
import { useRef, type RefObject } from 'react'

export function useLatestRef<T>(value: T): RefObject<T> {
  // eslint-disable-next-line react-hooks/refs -- idempotent by construction; see the note above
  const ref = useRef(value); ref.current = value
  return ref
}
