'use client'
/**
 * useFingerCounter — the webcam hand reading for the AR activities.
 *
 * ONE callback, `onRead({ count, hands, tilt })`, fired when the reading CHANGES. Everything a
 * chapter needs comes off the same 21 landmarks per hand that were already being computed every
 * frame and thrown away.
 *
 *   • count — extended fingers, numbered left-to-right, lightly stabilized so a one-frame blip
 *     cannot fool the game. Show whatever fingers however you like; it just counts them.
 *   • hands — ⚠️ NOT DECORATION. A FIST and AN EMPTY FRAME both extend zero fingers, and a chapter
 *     where the fist is a real answer (Factor Lab: "nothing fits, so it is prime") would otherwise
 *     commit that answer the moment a child lowers their hand. Only trust a 0 when hands > 0.
 *   • tilt — the palm's angle as an axis in [0,180), or null when there is no hand. This is the
 *     Angle Shop's whole instrument: the child's forearm IS the ramp.
 *
 * ⚠️ `reads` SAYS WHAT THE CHAPTER IS ACTUALLY READING, AND IT IS NOT DECORATION EITHER. A tilt is
 * continuous, so including it in the change test fires `onRead` at frame rate — which is right for
 * a chapter whose beam follows the hand and wrong for one that only wants a count, where it would
 * re-render the whole tree ~30×/s for a number that has not moved. It also picks the overlay drawn
 * on the self-view: numbering the fingers over an angle chapter is noise.
 *
 * Reusable across future AR activities. On-device only — no frame ever leaves the browser.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { extendedFingerTips, palmTilt, norm180 } from '@/infra/ar/fingerCount'
import {
  palmRead, stepSweep, sweepKey, quantArm, SWEEP_START, SWEEP_ARM, SWEEP_FIRE, SWEEP_MAX_Y,
  type SweepState,
} from '@/infra/ar/sweep'
import { createHandLandmarker, openCamera } from '@/infra/ar/handLandmarker'
import { disposeLandmarker } from '@/infra/ar/dispose'

const STABLE_FRAMES = 3 // a changed count must hold this many frames before we report it
/**
 * ⚠️ THE CALIBRATION KNOB, and a continuous reading does not work without one. MediaPipe's landmark
 * noise on the palm axis is a couple of degrees, which is comparable to the Angle Shop's own 5°
 * step — so an unsmoothed tilt dithers across a step boundary and a commit that waits for stillness
 * NEVER FIRES, i.e. a dead button, which the craft doc calls the worst outcome there is. Raise it
 * for a snappier hand, lower it if a real child cannot hold the reading still.
 */
const TILT_EMA = 0.3

export type FingerStatus = 'idle' | 'loading' | 'running' | 'error'

/**
 * ⚠️ ONE NAME FOR THE READING, EXPORTED, because it was previously written out twice — here and
 * again structurally in `useHandInput`'s options — and neither was exported. Adding a third variant
 * therefore meant editing two literal unions in two files, and a chapter passing the new one failed
 * to typecheck at the WRAPPER rather than at the detector.
 */
export type Reads = 'count' | 'tilt' | 'sweep'

export interface HandRead {
  /** extended fingers across every hand in frame, 0..10 */
  count: number
  /** how many hands are in frame — the thing that tells a fist from an empty room */
  hands: number
  /** the palm's angle as an axis in [0,180), or null when no hand is in frame */
  tilt: number | null
  /**
   * How many left→right sweeps have been read since the camera started. MONOTONE within a detector
   * session — ⚠️ but NOT across a chapter, because `useTaps` and a camera restart both reset the
   * reading. A consumer diffs it against a baseline and must clamp a BACKWARDS jump, or the first
   * "Try the camera again" wedges the gesture for the rest of the run.
   */
  sweeps: number
  /** 0..1 through the sweep band, quantized. Says only WHAT WAS READ. */
  sweepArm: number
  /** whether a crossing would currently count — the thing the chapter's instruction branches on */
  sweepArmed: boolean
}

interface Opts {
  onRead?: (r: HandRead) => void
  /** What this chapter reads — decides the change test, the self-view overlay AND the detector's
   *  own configuration. */
  reads?: Reads
  /** Marker colours, so a chapter can draw in its own palette. Defaults to the 3–5 band's orange. */
  marker?: { fill: string; ink: string }
}

export function useFingerCounter(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  opts: Opts = {},
) {
  const [status, setStatus] = useState<FingerStatus>('idle')
  const [error, setError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const stableRef = useRef({ count: 0, hands: 0, cand: '', streak: 0 })
  /** the smoothed tilt, held as a DOUBLED-angle unit vector — see below */
  const tiltVecRef = useRef<{ x: number; y: number } | null>(null)
  const sweepRef = useRef<SweepState>(SWEEP_START)
  const lastKey = useRef('')
  const optsRef = useRef(opts)
  optsRef.current = opts

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    disposeLandmarker(videoRef, landmarkerRef, streamRef)
    setStatus('idle')
  }, [videoRef])

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    disposeLandmarker(videoRef, landmarkerRef, streamRef)
  }, [videoRef])

  const loop = useCallback(() => {
    const video = videoRef.current, canvas = canvasRef.current, lm = landmarkerRef.current
    if (!video || !canvas || !lm) return
    const W = video.clientWidth, H = video.clientHeight
    if (canvas.width !== W) canvas.width = W
    if (canvas.height !== H) canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    const fill = optsRef.current.marker?.fill ?? '#F26B2C'
    const ink = optsRef.current.marker?.ink ?? '#3D2516'
    const reads = optsRef.current.reads ?? 'count'

    if (video.readyState >= 2) {
      const res = lm.detectForVideo(video, performance.now())
      const all = (res.landmarks ?? []) as { x: number; y: number; z: number }[][]
      const hands = all.length

      // All extended fingertips this frame → screen positions, left-to-right.
      const pts: { sx: number; sy: number }[] = []
      all.forEach((hand, i) => {
        const handed = res.handednesses?.[i]?.[0]?.categoryName ?? `H${i}`
        extendedFingerTips(hand, handed).forEach(t => pts.push({ sx: (1 - t.x) * W, sy: t.y * H }))
      })
      pts.sort((a, b) => a.sx - b.sx)

      // ⚠️ SMOOTHED ON THE DOUBLED ANGLE'S UNIT VECTOR, not on the degrees. A hand held flat wobbles
      // either side of horizontal, i.e. across the 0/180 seam — and a plain average of 179° and 1°
      // is 90°, which is the WRONG ANSWER at exactly the pose a child is most likely to hold.
      const raw = hands ? palmTilt(all[0]) : null
      let tilt: number | null = null
      if (raw === null) tiltVecRef.current = null
      else {
        const a = (raw * Math.PI) / 90            // 2θ, in radians
        const v = tiltVecRef.current
        const x = v ? v.x + (Math.cos(a) - v.x) * TILT_EMA : Math.cos(a)
        const y = v ? v.y + (Math.sin(a) - v.y) * TILT_EMA : Math.sin(a)
        tiltVecRef.current = { x, y }
        tilt = Math.round(norm180((Math.atan2(y, x) * 90) / Math.PI))
      }

      /**
       * ⚠️ THE SWEEP IS STEPPED ON THE RAW HAND, NOT THE STABILIZED COUNT. `s.count`/`s.hands` need
       * STABLE_FRAMES to follow, which is right for a digit and wrong for a traversal: the disarm
       * would lag three frames behind a hand that has gone, and for those frames `all[0]` is
       * `undefined`. (`palmRead` guards its own length, so that is a null rather than a throw — and
       * a throw here is unrecoverable, because this loop has no try/catch and never reschedules.)
       */
      if (reads === 'sweep') sweepRef.current = stepSweep(sweepRef.current, palmRead(all[0]))
      const sw = sweepRef.current

      if (reads === 'sweep') drawSweep(ctx, all[0], sw, W, H, fill, ink)
      else if (reads === 'tilt') drawTilt(ctx, all[0], W, H, fill, ink)
      else drawCount(ctx, pts, W, fill, ink)

      // The count is stabilized; the tilt is not (it is already smoothed, and a continuous value
      // that had to hold N frames would simply lag). The key carries BOTH count and hands, so a
      // hand closing into a fist (0 fingers, 1 hand) is a change the chapter hears, while a hand
      // leaving frame (0 fingers, 0 hands) is a different one.
      const n = pts.length
      const s = stableRef.current
      const stableKey = `${n}/${hands}`
      if (stableKey !== `${s.count}/${s.hands}`) {
        if (stableKey === s.cand) s.streak++; else { s.cand = stableKey; s.streak = 1 }
        if (s.streak >= STABLE_FRAMES) { s.count = n; s.hands = hands; s.cand = ''; s.streak = 0 }
      } else { s.cand = ''; s.streak = 0 }

      /**
       * ⚠️ THREE ARMS, NOT TWO, AND A MISSING ONE IS A SILENT DEAD BUTTON. This was
       * `reads === 'tilt' ? … : …`, so a third variant fell into the count branch and the key never
       * mentioned the sweep at all — `onRead` would fire only when the FINGER COUNT changed, i.e. a
       * sweep with a steady hand shape reports nothing. It compiles, it type-checks, and the camera
       * does nothing.
       */
      const key = reads === 'sweep' ? `${s.hands}/${sweepKey(sw)}`
        : reads === 'tilt' ? `${s.count}/${s.hands}/${tilt}`
          : `${s.count}/${s.hands}`
      if (key !== lastKey.current) {
        lastKey.current = key
        optsRef.current.onRead?.({
          count: s.count, hands: s.hands, tilt,
          sweeps: sw.sweeps, sweepArm: quantArm(sw.arm), sweepArmed: sw.armed,
        })
      }
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [videoRef, canvasRef])

  const start = useCallback(async () => {
    try {
      setStatus('loading'); setError('')
      stableRef.current = { count: 0, hands: 0, cand: '', streak: 0 }
      tiltVecRef.current = null; sweepRef.current = SWEEP_START; lastKey.current = ''
      /**
       * Counting needs both hands; keep MediaPipe's default 0.5 presence/tracking
       * (the other AR surfaces loosen these to 0.3) — pass them explicitly so the
       * shared helper reproduces this site's exact prior behavior.
       *
       * ⚠️ A SWEEP ASKS FOR ONE HAND, AND THE BRANCH IS LOAD-BEARING IN BOTH DIRECTIONS. With two
       * hands in frame `all[0]` can swap between them frame to frame, and a Schmitt trigger reads
       * that swap as a traversal — it has none of the smoothing that masks the same latent issue
       * under the tilt. Applied UNBRANCHED it would break the other two chapters instead: Factor
       * Lab's answer space is 0..10 with a whole ten-finger-ceiling sweep in its gate, and The
       * Fitting Crew's copy is literally "hold up the tens, then the ones".
       *
       * ⚠️ AND THE CONFIDENCES ARE **NOT** LOOSENED FOR IT, which is the opposite of what the plan
       * asked for. A lower detection threshold reports more marginal objects — a sibling's hand, a
       * face, a patterned cushion — and with `numHands: 1` every such claim EVICTS the tracked hand
       * from the only slot. Each eviction is a discontinuous jump in x, which is the one input class
       * this detector is least able to tell from a real sweep.
       */
      const sweeping = (optsRef.current.reads ?? 'count') === 'sweep'
      landmarkerRef.current = await createHandLandmarker({
        numHands: sweeping ? 1 : 2, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
      })
      streamRef.current = await openCamera(videoRef.current!)
      setStatus('running')
      loop()
    } catch (e) {
      setError(e instanceof Error ? (e.name || e.message) : String(e))
      setStatus('error')
    }
  }, [videoRef, loop])

  return { status, error, start, stop }
}

/** Number the extended fingers 1..N over the hand, height-staggered so the discs do not overlap. */
function drawCount(ctx: CanvasRenderingContext2D, pts: { sx: number; sy: number }[], W: number, fill: string, ink: string) {
  const R = 18, TOP = 46, STAGGER = 34
  pts.forEach((p, i) => {
    const bx = Math.min(Math.max(p.sx, R + 2), W - R - 2)
    const by = Math.max(p.sy - TOP - (i % 2 ? STAGGER : 0), R + 2)
    ctx.beginPath(); ctx.moveTo(bx, by + R); ctx.lineTo(p.sx, p.sy)
    ctx.strokeStyle = fill; ctx.lineWidth = 3; ctx.stroke()
    ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2)
    ctx.fillStyle = fill; ctx.fill()
    ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(String(i + 1), bx, by + 1)
  })
}

/**
 * The sweep lane, drawn over the child's own image: where to start, where to finish, and where
 * their palm is right now.
 *
 * ⚠️ THIS IS WHERE POSITIONAL FEEDBACK BELONGS, AND IT IS FREE HERE. The chapter's own lane can
 * only show `arm`, which is 0 for THREE different states — armed and not yet moving, past the end
 * and needing to come back, and no hand at all. A child parked at x 0.9 and a child who has not
 * started see the same bar, and the commonest first attempt is exactly the former: a right hand at
 * rest sits around x 0.63–0.67, i.e. at or past the fire line already. On the canvas the palm is a
 * dot against a marked zone, so "start further left" is visible rather than inferred — and it costs
 * nothing, because this overlay is redrawn every frame regardless and never re-renders React.
 *
 * ⚠️ It shows POSITION, never a verdict — the hot/cold rule. Where your hand is is not the answer;
 * how many times you have crossed is, and that number is nowhere on this canvas.
 */
function drawSweep(
  ctx: CanvasRenderingContext2D,
  hand: { x: number; y: number }[] | undefined,
  sw: SweepState, W: number, H: number, fill: string, ink: string,
) {
  const y = H * 0.5, h = Math.max(8, H * 0.09)
  const x0 = SWEEP_ARM * W, x1 = SWEEP_FIRE * W

  // the lane, and the two zones that matter
  ctx.fillStyle = 'rgba(10,16,26,.45)'
  ctx.fillRect(0, y - h / 2, W, h)
  ctx.fillStyle = sw.armed ? `${fill}` : 'rgba(255,255,255,.22)'
  ctx.globalAlpha = sw.armed ? 0.34 : 1
  ctx.fillRect(0, y - h / 2, x0, h)                       // "start here"
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(255,255,255,.22)'
  ctx.fillRect(x1, y - h / 2, W - x1, h)                  // "finish here"

  // how far through the crossing the trigger has armed
  if (sw.arm > 0) {
    ctx.fillStyle = fill
    ctx.fillRect(x0, y - h / 2, (x1 - x0) * sw.arm, h)
  }
  ctx.strokeStyle = ink; ctx.lineWidth = 2
  ctx.strokeRect(0.5, y - h / 2, W - 1, h)

  // the palm itself — the whole point, and the only thing that says "you are past the end"
  const p = palmRead(hand)
  if (!p) return
  const low = p.y > SWEEP_MAX_Y
  const px = Math.min(Math.max(p.x * W, 9), W - 9)
  ctx.beginPath(); ctx.arc(px, y, 9, 0, Math.PI * 2)
  ctx.fillStyle = low ? 'rgba(255,255,255,.30)' : fill
  ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke()
  if (low) {
    // a hand below the posture line is not answering — say so where the hand is
    ctx.beginPath(); ctx.moveTo(px - 5, y - 5); ctx.lineTo(px + 5, y + 5)
    ctx.moveTo(px + 5, y - 5); ctx.lineTo(px - 5, y + 5)
    ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke()
  }
}

/**
 * A single line along the palm axis. ⚠️ It says WHICH HAND is being read and nothing else — a
 * degree figure drawn here would be the readout the Angle Shop's rule 1 forbids while turning, and
 * the beam on the stage is already showing the reading anyway.
 */
function drawTilt(ctx: CanvasRenderingContext2D, hand: { x: number; y: number }[] | undefined, W: number, H: number, fill: string, ink: string) {
  if (!hand || hand.length < 10) return
  const p = (i: number) => ({ x: (1 - hand[i].x) * W, y: hand[i].y * H })
  const a = p(0), b = p(9)
  const dx = b.x - a.x, dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ext = Math.max(W, H) * 0.42
  const ux = dx / len, uy = dy / len
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
  ctx.beginPath()
  ctx.moveTo(mx - ux * ext, my - uy * ext)
  ctx.lineTo(mx + ux * ext, my + uy * ext)
  ctx.strokeStyle = ink; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke()
  ctx.strokeStyle = fill; ctx.lineWidth = 4; ctx.stroke()
  ctx.beginPath(); ctx.arc(a.x, a.y, 7, 0, Math.PI * 2)
  ctx.fillStyle = fill; ctx.fill()
  ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke()
}
