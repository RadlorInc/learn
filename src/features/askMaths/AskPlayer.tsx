'use client'
/**
 * The whiteboard board for Ask maths: the askRadlor player (public/ask-player, copied by scripts/sync-ask-player.mjs)
 * in a sandboxed iframe, fed over postMessage (public/ask-player/bridge.js). Ported from the askRadlor app's
 * src/components/Watch.tsx `Player`, kept to what a child needs: the board, the voice, play/pause, back/next, replay.
 *
 * The protocol (bridge.js): page → player `hello`, `reset`, `els {els, voice, drawings}`, `step {step}`,
 * `stepWav {i, wav}`, `done`, `seek {i}`, `pause`, `resume`, `started {id}`, `played {id}`; player → page `ready`,
 * `need {i}`, `at {i, n, done, paused, waiting}`, `size {h}`, `ended`, `play {id, wav}`, `hush`, `pauseSound`,
 * `resumeSound`. Only our own iframe's messages are read (e.source).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { cancelLine, pauseSound, playSound, resumeSound, speakLine, retryVoice, stopSound, tapForSound, useSoundBlocked, voiceOn } from './voice'
import { primary } from '@/features/lessons/Frame'
import { INK } from '@/features/lessons/Pictures'

export type Post = (m: unknown) => void
type At = { i: number; n: number; done: boolean; paused: boolean; waiting: boolean }
const btn = { ...primary, padding: '8px 14px', fontSize: 18, minHeight: 44 } as const

export function AskPlayer({ bind, script, onAt }: {
  bind?: (post: Post) => void                       // the streaming caller sends els / step / done through this
  script?: { els: unknown; drawings?: unknown; steps: { say: string }[] } | null   // or a finished lesson, whole
  onAt?: (playing: boolean) => void
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const ready = useRef(false)
  const pending = useRef<unknown[]>([])
  const [h, setH] = useState<number | null>(null)
  const [at, setAt] = useState<At | null>(null)
  const soundBlocked = useSoundBlocked()
  const raw = useCallback((m: unknown) => {
    if (ready.current) frame.current?.contentWindow?.postMessage(m, '*')
    else pending.current.push(m)
  }, [])

  // The voice is made one line at a time, from the step the board is on (or was jumped to: 'need').
  const feed = useRef({ lines: [] as string[], got: new Set<number>(), want: 0, busy: false, alive: true, epoch: 0, making: -1, dropped: new Set<number>() })
  const pump = useCallback(async () => {
    const f = feed.current
    if (f.busy) return
    f.busy = true
    const ep = f.epoch
    try {
      while (f.alive && ep === f.epoch) {
        const n = f.lines.length
        let i = -1
        for (let k = 0; k < n; k++) { const j = (f.want + k) % n; if (!f.got.has(j)) { i = j; break } }
        if (i < 0) break
        f.got.add(i); f.making = i
        const wav = await speakLine(f.lines[i])
        f.making = -1
        if (!f.alive || ep !== f.epoch) break
        if (f.dropped.delete(i)) continue
        raw({ type: 'stepWav', i, wav })
      }
    } finally { if (ep === f.epoch) f.busy = false }
  }, [raw])
  const post = useCallback<Post>((m) => {
    const msg = m as { type?: string; step?: { say: string } }
    const f = feed.current
    if (msg?.type === 'reset') { f.epoch++; f.lines = []; f.got = new Set(); f.want = 0; f.busy = false }
    if (msg?.type === 'step' && msg.step && voiceOn()) { f.lines.push(msg.step.say); raw({ type: 'step', step: msg.step }); pump(); return }
    if (msg?.type === 'els' && voiceOn()) { raw({ ...(m as object), voice: true }); return }
    raw(m)
  }, [raw, pump])
  useEffect(() => { const f = feed.current; f.alive = true; return () => { f.alive = false } }, [])

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || !e.data) return
      const d = e.data
      if (d.type === 'ready' && !ready.current) { ready.current = true; pending.current.splice(0).forEach(raw) }
      if (d.type === 'size' && Number.isFinite(d.h) && d.h > 50 && d.h < 4000) setH(d.h)
      if (d.type === 'need' && Number.isInteger(d.i)) {
        const f = feed.current
        f.want = d.i
        if (f.making >= 0 && f.making !== d.i && !f.got.has(d.i)) { const k = f.making; f.dropped.add(k); f.got.delete(k); cancelLine(f.lines[k]) }
        pump()
      }
      if (d.type === 'at') { setAt({ i: d.i, n: d.n, done: d.done, paused: d.paused === true, waiting: d.waiting === true }); onAt?.(!d.waiting) }
      if (d.type === 'play' && d.wav instanceof ArrayBuffer) {
        const id = d.id
        playSound(d.wav, () => raw({ type: 'started', id })).then(() => raw({ type: 'played', id }))
      }
      if (d.type === 'hush') stopSound()
      if (d.type === 'pauseSound') pauseSound()
      if (d.type === 'resumeSound') resumeSound()
    }
    addEventListener('message', on)
    frame.current?.contentWindow?.postMessage({ type: 'hello' }, '*')
    return () => { removeEventListener('message', on); stopSound() }
  }, [raw, pump, onAt])
  useEffect(() => { retryVoice() }, [])
  useEffect(() => {
    if (!script) return
    post({ type: 'reset' }); post({ type: 'els', els: script.els, drawings: script.drawings })
    for (const step of script.steps ?? []) post({ type: 'step', step })
    post({ type: 'done' })
  }, [script, post])
  useEffect(() => { bind?.(post) }, [bind, post])

  const seek = (i: number) => { if (at) { feed.current.want = Math.max(0, i); raw({ type: 'seek', i: Math.max(0, Math.min(i, at.n - 1)) }) } }
  const ended = !!at && at.i >= at.n
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {soundBlocked && <button type="button" style={btn} onClick={tapForSound}>🔊 Tap for sound</button>}
      <iframe ref={frame} src="/ask-player/index.html?subject=maths" sandbox="allow-scripts" allow="autoplay" title="Maths board"
        style={{ width: '100%', border: 0, borderRadius: 16, background: '#fff', ...(h ? { height: h } : { aspectRatio: '960/660' }) }} />
      {at && at.n > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={btn} aria-label="Back one step" disabled={at.i === 0} onClick={() => seek(at.i - 1)}>⏮</button>
          {ended ? <button type="button" style={btn} onClick={() => seek(0)}>↻ Watch again</button>
            : <button type="button" style={btn} aria-label={at.paused ? 'Play' : 'Pause'} onClick={() => raw({ type: at.paused ? 'resume' : 'pause' })}>{at.paused ? '▶' : '⏸'}</button>}
          <button type="button" style={btn} aria-label="Next step" disabled={at.i >= at.n - 1} onClick={() => seek(at.i + 1)}>⏭</button>
          <span style={{ fontSize: 18, fontWeight: 700, color: INK }}>{ended ? 'The end' : `Step ${at.i + 1}${at.done ? ` of ${at.n}` : ''}`}</span>
          {at.waiting && <span style={{ fontSize: 16, color: INK }}>Getting the voice ready…</span>}
        </div>
      )}
    </div>
  )
}
