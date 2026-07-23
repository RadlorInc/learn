'use client'
/**
 * ParadeCanvas — React's handle on the Pixi parade scene.
 *
 * React stays the source of truth for the GAME (how many are counted, whether taps are allowed,
 * the answer choices). This component only owns the spawn queue: keep both slots filled until all
 * `n` creatures have been sent through, and tell the parent each time one is counted.
 *
 * Pixi is loaded lazily on mount so the ~350KB renderer never lands in the initial bundle — the
 * 3–11 story chapters are already `next/dynamic`, this keeps it out of everything else too.
 */
import React, { useEffect, useRef } from 'react'
import type { Gait, ParadeStage } from './ParadeStage'

export interface ParadeCanvasProps {
  /** Sprite URL for the creature (the parade `*_side.png` where one exists). */
  src: string
  gait: Gait
  /** Total creatures to send through — the answer to "how many?". */
  n: number
  size: number
  /** Travel lane per slot, viewport % from the top. */
  lane0: number
  lane1: number
  /** Source art drawn facing left, so the travel-direction flip has to invert. */
  artFacesLeft: boolean
  /** Ground/water creatures get a contact shadow; flyers don't. */
  grounded: boolean
  /** Taps only count while the child is meant to answer (not mid-narration). */
  interactive: boolean
  onCount: () => void
}

export const ParadeCanvas: React.FC<ParadeCanvasProps> = ({
  src, gait, n, size, lane0, lane1, artFacesLeft, grounded, interactive, onCount,
}) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<ParadeStage | null>(null)
  // Latest onCount without re-running the mount effect (the scene must never be torn down mid-round).
  const countRef = useRef(onCount)
  countRef.current = onCount
  // `init()` is async, so the interactive effect below can fire while stageRef is still null. Hold
  // the desired value here and apply it once the stage exists — otherwise taps are dead on arrival.
  const wantInteractive = useRef(interactive)
  wantInteractive.current = interactive

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let stage: ParadeStage | null = null
    let cancelled = false
    let spawned = 0

    ;(async () => {
      const { ParadeStage: Stage } = await import('./ParadeStage')
      if (cancelled) return
      stage = new Stage({ onCount: () => countRef.current() })
      stageRef.current = stage
      await stage.init(host)
      if (cancelled) { stage.dispose(); return }
      stage.setInteractive(wantInteractive.current)

      const fill = (slot: 0 | 1) => {
        if (cancelled || spawned >= n) return
        spawned++
        stage!.spawn({
          key: spawned, src, gait, slot, size,
          lanePct: slot === 0 ? lane0 : lane1,
          artFacesLeft, grounded,
          // Send the next one in the MOMENT this is tapped, not once it has finished walking off.
          // Waiting for the exit meant the child answered and then sat watching dead time. They
          // travel the same direction in a slot (enter one side, exit the other) so the outgoing
          // and incoming never cross.
          onCounted: () => fill(slot),
        })
      }
      fill(0)
      // Stagger the second so they don't enter in lockstep — a beat of offset reads far more alive.
      window.setTimeout(() => fill(1), 620)
    })()

    return () => {
      cancelled = true
      stage?.dispose()
      stageRef.current = null
    }
    // Deliberately mount-once per question: `n`/`src`/etc. are fixed for the life of a round, and
    // React remounts this via `key` when the question changes. Re-running would restart the parade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { stageRef.current?.setInteractive(interactive) }, [interactive])

  return <div ref={hostRef} aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 35 }} />
}

export default ParadeCanvas
