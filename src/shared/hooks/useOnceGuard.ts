'use client'
import { useEffect, useRef } from 'react'

/**
 * A "run this effect once per mount" guard that is CORRECT under React StrictMode.
 *
 * ⚠️ THE PLAIN `useRef(false)` VERSION FREEZES THE CHAPTER, AND ONLY IN DEV, WHICH IS WHY IT COST
 * THIS REPO WEEKS. StrictMode invokes an effect twice — mount, cleanup, mount — and a `useRef`
 * SURVIVES that simulated unmount. So the shape every story chapter used:
 *
 *     const ran = useRef(false)
 *     useEffect(() => {
 *       if (ran.current) return; ran.current = true
 *       const cancel = speakSteps(lines, { onStep })
 *       return cancel                       // ← StrictMode calls this…
 *     }, [])                                // ← …then re-runs, and the guard says "already ran"
 *
 * runs the narration, CANCELS it, and then refuses to start it again — so the demo sits on its
 * first beat for ever. Measured 2026-08-21 by instrumenting `speechSynthesis.speak`: on the dev
 * server a chapter's demo produced **zero** speak calls in 42s, while the identical build on
 * production played all seven lines and walked on into the guided round. StrictMode is dev-only,
 * so production was never affected — which is exactly what made it so hard to name, and is why an
 * earlier session read "it works on prod" as evidence AGAINST StrictMode when it was evidence for.
 *
 * It also blocked every attempt to drive a storybook chapter headlessly, because the e2e harness
 * points at the dev server: `e2e/storybook-pills.spec.ts` skips rather than fails for this reason.
 *
 * Resetting the flag in its OWN cleanup fixes it without touching the effect it guards. Cleanups
 * run in declaration order, so this one fires after the guarded effect's own cleanup and before
 * the re-run.
 */
export function useOnceGuard() {
  const ran = useRef(false)
  useEffect(() => () => { ran.current = false }, [])
  return ran
}
