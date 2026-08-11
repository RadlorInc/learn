'use client'
/**
 * THE SHARED ANSWERING SURFACE FOR THE 9–11 AR CHAPTERS — extracted from Factor Lab, which built
 * every piece of it and was the only consumer until The Angle Shop arrived. (One consumer is not an
 * abstraction; two is.)
 *
 * ⚠️ ONE INSTRUMENT, TWO INPUTS, ONE GRADER — the shape everything here exists to hold.
 * The camera does not ANSWER the question. It sets the same value a tap or a stepper sets, and both
 * land in the chapter's single grading sink. So the two paths cannot drift into grading differently,
 * the chapter's existing sweep covers both at once, and MediaPipe's ~6 MB of wasm + model is fetched
 * only when a child opts in — this app is local-first, and a child who is not using the camera
 * should not pay for it.
 *
 * ⚠️ AND THE TWO PATHS COMMIT DIFFERENTLY, ON PURPOSE. A tap is CONSUMED; a hand is still up when
 * the next question opens. So the camera needs two guards a pointer does not — hold still for
 * DWELL_MS, and ignore the reading held over from the last round — and pushing a tap through them
 * silently swallows it, because a tap whose value matches the held-over reading reads as held-over.
 * A pointer commits directly; only the hand goes through `useDwell`.
 *
 * ⚠️ AND THE LIVE READOUT SAYS ONLY WHAT WAS READ, NEVER WHETHER IT IS RIGHT. That is the hot/cold
 * rule, and on a continuous reading it is not a nicety: a surface that reacted to a hand sweeping
 * through values would be a yes/no oracle at 60 fps.
 *
 * The device's pick is remembered in `infra/storage/handInput`, because "no camera" is a household
 * answer rather than a per-learner one — but BOTH doors are offered every time. The remembered pick
 * decides which is the big button, never which is the only one.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useFingerCounter, type HandRead, type Reads } from '@/infra/ar/useFingerCounter'
import { getHandInput, setHandInput, type HandInput as InputKind } from '@/infra/storage/handInput'

export type { HandRead, Reads }
export type { InputKind }

/** How long a hand must hold still before it counts as an answer. */
export const DWELL_MS = 1200
export const NO_HAND: HandRead = { count: 0, hands: 0, tilt: null, sweeps: 0, sweepArm: 0, sweepArmed: false }

/**
 * The chapter's palette, so this can live in a dark neon lab AND on a painted building site.
 * ⚠️ `accentSoft` is a field rather than `${accent}66`, because half the chapters colour themselves
 * from CSS variables and you cannot concatenate an alpha onto `var(--milo-orange)`.
 */
export interface HandSkin {
  accent: string
  accentSoft: string
  ink: string
  muted: string
  panel: string
  line: string
  /** text drawn ON an accent-filled button */
  onAccent: string
  font: string
  mono: string
}

// ─── the reading, shared down the tree ─────────────────────────────────────────────────
/**
 * The camera is opened ONCE for the whole chapter — re-opening it per round would re-prompt and
 * re-initialise MediaPipe — so the reading is lifted to the top and read through context. That also
 * lets `SkillBeat` construct the play surface itself without any of this being drilled through it.
 *
 * ⚠️ `input` rides in the SAME context rather than being an argument to the beat. A beat is memoised
 * and `SkillBeat` rebuilds its round whenever the beat's identity changes, so threading the input
 * through it would regenerate the question under a child who was mid-answer.
 */
export interface Hand { read: HandRead; input: InputKind }
const HandCtx = createContext<Hand>({ read: NO_HAND, input: 'hand' })
export const useHand = () => useContext(HandCtx)
export const HandProvider = HandCtx.Provider

const DEV = process.env.NODE_ENV !== 'production'

/**
 * Owns the device pick, the camera lifecycle and the reading.
 *
 * `reads` is passed straight through to the detector and decides both what a change IS and what the
 * self-view draws — see useFingerCounter. A chapter that only wants a count must not say 'tilt', or
 * it re-renders at frame rate for a number that has not moved.
 */
export function useHandInput(opts: { reads?: Reads; marker?: { fill: string; ink: string } } = {}) {
  const [input, setInput] = useState<InputKind>('hand')
  // The device's remembered pick, or 'hand' until it has one — the chapter offers both either way,
  // so an un-asked device is never quietly put in front of a camera.
  useEffect(() => { const saved = getHandInput(); if (saved) setInput(saved) }, [])

  const [read, setRead] = useState<HandRead>(NO_HAND)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onRead = useCallback((r: HandRead) => setRead(r), [])
  const { status, error, start, stop } = useFingerCounter(videoRef, canvasRef, { onRead, reads: opts.reads, marker: opts.marker })

  /** Switch to taps: remember it, and make sure the camera is not left running. */
  const useTaps = useCallback(() => { setHandInput('tap'); setInput('tap'); stop(); setRead(NO_HAND) }, [stop])
  const useCamera = useCallback(() => { setHandInput('hand'); setInput('hand'); start() }, [start])

  /**
   * Dev-only drive hooks — a webcam cannot be fed headlessly, so without these nothing past a
   * chapter's intro is verifiable at all. Stripped from production exactly like FloorPlot's
   * `__miloPace`. They stand in for the CAMERA as well as the hand, or the gate would block a drive.
   */
  const [fake, setFake] = useState(false)
  useEffect(() => {
    if (!DEV) return
    const w = window as unknown as Record<string, unknown>
    w.__miloHand = (r: Partial<HandRead>) => { setFake(true); setRead({ ...NO_HAND, hands: 1, ...r }) }
    // ⚠️ SPREAD `NO_HAND` RATHER THAN LISTING THE FIELDS, so the next reading added to `HandRead`
    // costs one edit here instead of one per hook.
    w.__miloFingers = (count: number, hands = 1) => { setFake(true); setRead({ ...NO_HAND, count, hands }) }
    w.__miloTilt = (tilt: number) => { setFake(true); setRead({ ...NO_HAND, hands: 1, tilt }) }
    /**
     * ⚠️ FUNCTIONAL, NOT ABSOLUTE, AND ITS THREE SIBLINGS ARE THE TRAP. They all set a whole
     * reading, which is right for a pose and wrong for a counter: `setRead({ …, sweeps: 1 })` deals
     * the first round and every later call is a no-op, so the second sweep of every round silently
     * does nothing and reads as "the effect is broken". Since a webcam cannot be driven headlessly
     * this hook is the ONLY way the chapter is verified at all, so one that lies makes the whole
     * drive worthless.
     * ⚠️ And it sets `fake`, or `camReady` stays false, `CamGate` covers the screen, and the drive
     * never gets past the intro.
     */
    w.__miloSweep = () => { setFake(true); setRead(r => ({ ...r, hands: 1, sweeps: r.sweeps + 1, sweepArm: 0, sweepArmed: false })) }
    return () => { delete w.__miloHand; delete w.__miloFingers; delete w.__miloTilt; delete w.__miloSweep }
  }, [])

  const camReady = status === 'running' || (DEV && fake)
  const onCam = input === 'hand'
  /** The chapter opens when its answer surface is usable — which on the tap path is immediately. */
  const ready = onCam ? camReady : true
  const hand = useMemo<Hand>(() => ({ read, input }), [read, input])

  return { input, read, hand, onCam, ready, camReady, status, error, start, stop, useTaps, useCamera, videoRef, canvasRef }
}

// ─── the commit ────────────────────────────────────────────────────────────────────────
/**
 * Watch the reading and fire once it has held still on a real answer.
 * Returns how far through the dwell we are, 0..1, so the child can see it arming.
 *
 * `value` is what gets committed, `key` is what "held still" means (they differ: Factor Lab commits
 * a finger count but must also notice a hand LEAVING), and `ready` is whether there is anything
 * worth committing at all — no hand in frame is not an answer, though a fist is.
 */
export function useDwell<T>(
  r: { value: T; key: string; ready: boolean },
  onCommit: (v: T) => void,
  live: boolean,
  ms = DWELL_MS,
): number {
  const { value, key, ready } = r
  const [progress, setProgress] = useState(0)
  const cb = useRef(onCommit); cb.current = onCommit
  const valRef = useRef(value); valRef.current = value
  const keyRef = useRef(key); keyRef.current = key

  /**
   * ⚠️ THE READING THE CHILD WAS ALREADY HOLDING WHEN THE QUESTION APPEARED IS NOT AN ANSWER.
   * Hands do not reset between rounds the way a tap surface does, so without this a hand left up
   * from the last round commits itself DWELL_MS after the next question opens — and if that stale
   * reading happens to be right, the chapter scores a round the child never played. Caught on Factor
   * Lab's first drive: the guided round opened already reading 5, which was its answer.
   */
  const stale = useRef<string | null>(null)
  useEffect(() => { stale.current = live ? keyRef.current : null }, [live])

  useEffect(() => {
    setProgress(0)
    // Any reading that differs from the held-over one is a fresh gesture, and clears the guard for
    // good — including a hand that simply left the frame, so lowering and re-raising also works.
    const held = stale.current !== null && key === stale.current
    if (!held) stale.current = null
    if (!live || !ready || held) return

    // ⚠️ The COMMIT is a timer and only the RING is rAF. requestAnimationFrame is frozen outright in
    // a backgrounded tab, so a commit driven by it silently never fires — untestable, and on a real
    // device it stalls the moment the child switches away and back.
    const done = window.setTimeout(() => cb.current(valRef.current), ms)
    const t0 = performance.now()
    let raf = requestAnimationFrame(function tick() {
      setProgress(Math.min(1, (performance.now() - t0) / ms))
      raf = requestAnimationFrame(tick)
    })
    return () => { window.clearTimeout(done); cancelAnimationFrame(raf) }
  }, [key, ready, live, ms])

  return progress
}

// ─── the parts ─────────────────────────────────────────────────────────────────────────
/** The arming ring. Its centre says WHAT WAS READ — never whether it is right. */
export function DwellRing({ progress, size, skin, children }: {
  progress: number; size: number; skin: HandSkin; children: React.ReactNode
}) {
  const r = size / 2 - 5
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={skin.line} strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={skin.accent} strokeWidth={4}
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: skin.mono, fontWeight: 800, fontSize: Math.round(size * 0.4), color: skin.ink,
      }}>{children}</div>
    </div>
  )
}

/**
 * The self-view. Small on purpose — the instrument is the thing being read, not the child.
 *
 * ⚠️ MOUNT IT AS SOON AS THE CHAPTER ENTERS ITS LAB, NOT WHEN THE CAMERA SUCCEEDS. `openCamera`
 * needs this <video> to already exist; gating its render on success grants the camera and then
 * throws on a null element, so the child reads "the camera did not start" while Chrome says "Using
 * now". It is merely INVISIBLE until running — it must keep its layout box, because the detect loop
 * reads video.clientWidth / clientHeight.
 */
export function CamView({ videoRef, canvasRef, w, bottom = 10, right = 10, skin, hidden }: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  w: number; bottom?: number; right?: number; skin: HandSkin; hidden?: boolean
}) {
  return (
    <div style={{
      position: 'fixed', right, bottom, width: w, aspectRatio: '4 / 3', zIndex: 36,
      opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto',
      borderRadius: 14, overflow: 'hidden', border: `2px solid ${skin.accentSoft}`,
      boxShadow: '0 10px 26px rgba(0,0,0,.45)', background: '#050a14',
    }}>
      {/* Mirrored, so raising your right hand raises the one on the right of the screen. */}
      <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

/**
 * The camera did not start — and this is not a dead end.
 *
 * ⚠️ "Tap instead" is offered FIRST, and that ordering is the whole point: by the time a child is
 * looking at this card the camera has already failed them, so asking them to try it again before
 * offering the door that works is the wrong way round.
 */
export function CamGate({ status, error, skin, denied, onTaps, onRetry, onExit }: {
  status: string; error: string; skin: HandSkin
  /** the one chapter-specific sentence: what the hand would have done, and that taps do it too */
  denied: string
  onTaps: () => void; onRetry: () => void; onExit: () => void
}) {
  const isDenied = /NotAllowed|Permission/i.test(error)
  const missing = /NotFound|Overconstrained|NotReadable/i.test(error)
  const btn = (primary?: boolean): React.CSSProperties => ({
    fontFamily: skin.font, fontWeight: primary ? 800 : 700, fontSize: 15,
    padding: primary ? '10px 22px' : '10px 20px', borderRadius: 999, cursor: 'pointer',
    border: `1px solid ${primary ? skin.accent : skin.line}`,
    background: primary ? skin.accent : 'transparent',
    color: primary ? skin.onAccent : skin.muted,
  })
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{
        maxWidth: 460, textAlign: 'center', background: skin.panel,
        border: `1px solid ${skin.accentSoft}`, borderRadius: 20, padding: '26px 28px',
        boxShadow: '0 12px 30px rgba(0,0,0,.35)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{isDenied ? '🙈' : '📷'}</div>
        <div style={{ fontFamily: skin.font, fontWeight: 800, fontSize: 20, color: skin.ink, marginBottom: 8 }}>
          {status === 'loading' ? 'Waking the camera…' : isDenied ? 'Milo needs to see your hands' : missing ? 'No camera found' : 'The camera did not start'}
        </div>
        <div style={{ fontFamily: skin.font, fontSize: 15, color: skin.muted, lineHeight: 1.5 }}>
          {status === 'loading' ? 'One moment.'
            : isDenied ? denied
              : missing ? 'No camera on this device — no problem. You can tap instead.'
                : 'Something got in the way. Have another go, or tap instead.'}
        </div>
        {status !== 'loading' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 18 }}>
            <button onClick={onTaps} style={btn(true)}>Tap instead →</button>
            <button onClick={onRetry} style={btn()}>Try the camera again</button>
            <button onClick={onExit} style={btn()}>Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
