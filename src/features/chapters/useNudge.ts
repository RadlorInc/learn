'use client'
import { useEffect } from 'react'

/**
 * "What do I tap next?" for KG–2 — founder, 2026-10-02: a small child does not read the screen the way we do, so the
 * thing to tap moves.
 *
 * - A COMMIT control (Ready, Done ✓, Pay ✓, Play again, Let's go ▶ …) bounces once the screen's work is done: the moment
 *   it turns from disabled to enabled (digits typed → Done), or when the child has tapped something else on the screen
 *   and then paused (sharks sent → Ready).
 * - The ANSWER CHOICES wiggle, all of them alike, when a question waits and nobody has tapped for a while.
 *   ⚠️ Never one choice on its own: "nothing may signal the answer before the commit" (BigOrSmall.tsx) — a nudge that
 *   singled out the right choice would hand the answer over.
 *
 * Any tap stops it and restarts the clock. One observer for every chapter: it reads the portal's buttons rather than
 * asking 23 chapters to mark theirs. Motion is the `scale` property, so a control's own `transform` (most are
 * positioned with translate) is untouched; a control with its own inline animation keeps it. Reduced motion: none
 * (globals.css).
 */
const COMMIT = /✓|Ready|Done|Pay\b|Fit\b|Share\b|Say it|Set it|Play again|Back to modules|▶|Let'?s |Tell me|Start|Show me|Next/i
const CHROME = /menu|hear it again|^back$|forward/i   // always live by design; never nudged
const PICK_AFTER_MS = 4000, COMMIT_AFTER_MS = 2000, TICK_MS = 400

export function useNudge() {
  useEffect(() => {
    let lastTap = Date.now(), tappedHere = false
    const wasOff = new WeakSet<Element>()
    const clear = () => document.querySelectorAll('.kg2-nudge-go, .kg2-nudge-pick').forEach(e => e.classList.remove('kg2-nudge-go', 'kg2-nudge-pick'))
    const onTap = (e: PointerEvent) => {
      lastTap = Date.now(); clear()
      const b = (e.target as Element | null)?.closest('button, [role=button]')
      tappedHere = !!b && !COMMIT.test(label(b))   // working on the screen (not committing it)
    }
    const tick = () => {
      const root = document.querySelector('.kg2-chapter')
      if (!root) return
      const idle = Date.now() - lastTap
      const live = [...root.querySelectorAll<HTMLElement>('button, [role=button]')].filter(visibleEnabled)
      const commits = live.filter(b => COMMIT.test(label(b)) && !chrome(b))
      // A commit that just became tappable has its work done: bounce it now.
      for (const b of root.querySelectorAll<HTMLButtonElement>('button')) {
        if (!visible(b)) continue
        if (b.disabled) wasOff.add(b)
        else if (wasOff.has(b) && commits.includes(b)) { wasOff.delete(b); b.classList.add('kg2-nudge-go') }
      }
      // A whole picture that is itself the target (paint the glowing part) is not a choice to wiggle.
      const picks = live.filter(b => !commits.includes(b) && !chrome(b) && !big(b))
      // Work started, then a pause → commit it. Never before: a Done that is always enabled must not invite a commit
      // of nothing. Nothing started → the choices; a screen whose only control is the commit (Let's go ▶, the end
      // card) → the commit.
      if (commits.length && tappedHere && idle > COMMIT_AFTER_MS) commits.forEach(b => b.classList.add('kg2-nudge-go'))
      else if (idle > PICK_AFTER_MS) (picks.length ? picks : commits).forEach(b => b.classList.add(picks.length ? 'kg2-nudge-pick' : 'kg2-nudge-go'))
    }
    window.addEventListener('pointerdown', onTap, true)
    const t = window.setInterval(tick, TICK_MS)
    return () => { window.removeEventListener('pointerdown', onTap, true); window.clearInterval(t); clear() }
  }, [])
}

const label = (e: Element) => ((e as HTMLElement).innerText || e.getAttribute('aria-label') || '').trim()
// Chrome is named by its aria-label as often as by its text (the 🔊 prompt pill reads "Send exactly 3…", labelled "Hear it again").
const chrome = (e: Element) => CHROME.test(e.getAttribute('aria-label') || '') || CHROME.test(label(e))
const visible = (e: HTMLElement) => {
  const r = e.getBoundingClientRect(), cs = getComputedStyle(e)
  return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.2
    && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
}
const visibleEnabled = (e: HTMLElement) => visible(e) && !(e as HTMLButtonElement).disabled && getComputedStyle(e).pointerEvents !== 'none'
const big = (e: HTMLElement) => { const r = e.getBoundingClientRect(); return r.width * r.height > innerWidth * innerHeight * 0.3 }
