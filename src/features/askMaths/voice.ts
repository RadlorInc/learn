/**
 * Ask maths' voice: Pocket TTS (Kyutai), made in the child's own browser on the CPU — no server, no per-line cost,
 * and the spoken text never leaves the device. Ported from the askRadlor app's src/lib/voice.ts (the founder's pick
 * there, 13 Oct 2026); its files are copied into public/ask-tts by scripts/sync-ask-player.mjs.
 *
 * One worker per tab loads the model once: the first time it downloads ~166 MB (pinned, hash-checked; the model from
 * Hugging Face, the voices from our own origin) and keeps it in the browser. speakLine() gives a line's WAV, or null
 * when it cannot (a failed download, an old browser): the player then says the line with the device's own voice.
 * One voice for every child (the default, Alba; credited on /ask).
 *
 * Sound plays through ONE <audio> element on this page, never inside the sandboxed player: an iPhone plays sound only
 * from an element first started inside a tap (unlockSound, on the first click), and refused a line made seconds after
 * "Ask" (13 Oct 2026, the askRadlor founder's iPhone). A line refused anyway waits for "Tap for sound".
 */
import { useSyncExternalStore } from 'react'
import { DEFAULT_VOICE } from '../../../public/ask-tts/pocket-files.mjs'

export type VoiceStatus = { state: 'off' | 'loading' | 'ready' | 'failed'; loaded: number; total: number }

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((f) => f())
const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }

let status: VoiceStatus = { state: 'off', loaded: 0, total: 0 }
const set = (s: Partial<VoiceStatus>) => { status = { ...status, ...s }; emit() }
export const voiceOn = () => typeof Worker !== 'undefined'

let worker: Worker | null = null
let ready: Promise<boolean> | null = null
let nextId = 0
const waiting = new Map<number, (wav: ArrayBuffer | null) => void>()

export function startVoice(): Promise<boolean> {
  if (ready) return ready
  if (!voiceOn()) return (ready = Promise.resolve(false))
  set({ state: 'loading' })
  ready = new Promise<boolean>((resolve) => {
    const fail = (why: string) => {
      console.warn('Ask maths: the made voice is off, the device voice speaks instead:', why)
      set({ state: 'failed' }); resolve(false)
      waiting.forEach((w) => w(null)); waiting.clear()
    }
    try { worker = new Worker('/ask-tts/pocket-worker.js', { type: 'module' }) } catch (e) { fail(String(e)); return }
    worker.onerror = (e) => fail(e.message || 'the worker did not start')
    worker.onmessage = ({ data }) => {
      if ('download' in data) { set({ loaded: data.download, total: data.total }); return }
      if ('stage' in data) return
      if (data.warm) { if (data.warm === 'ok') { set({ state: 'ready' }); resolve(true) } else fail(data.error); return }
      const w = waiting.get(data.id); waiting.delete(data.id)
      w?.(data.error ? null : data.wav)
    }
    worker.postMessage({ warm: true })
  })
  return ready
}

// A line made once is kept for the life of the tab (a replay gets it at once). ponytail: unbounded, ~250 KB a line;
// a child asks at most 20 questions a day of at most 7 lines.
const made = new Map<string, Promise<ArrayBuffer | null>>()
const asked = new Map<string, number>()
export function speakLine(text: string): Promise<ArrayBuffer | null> {
  const hit = made.get(text)
  if (hit) return hit
  const p = (async () => {
    if (!(await startVoice()) || !worker) return null
    const w = worker
    return new Promise<ArrayBuffer | null>((resolve) => {
      const id = nextId++; asked.set(text, id)
      waiting.set(id, (wav) => { asked.delete(text); resolve(wav) })
      w.postMessage({ id, text, voice: DEFAULT_VOICE })
    })
  })()
  made.set(text, p)
  p.then((wav) => { if (!wav) made.delete(text) })
  return p
}
/** Stop making a line nobody needs now (a jump to another step). */
export function cancelLine(text: string) {
  const id = asked.get(text)
  if (id !== undefined) worker?.postMessage({ cancel: id })
}
export const useVoiceStatus = () => useSyncExternalStore(subscribe, () => status, () => status)

// ── Playing the lines ──
let el: HTMLAudioElement | null = null
let unlocked = false
let current: { finish: (played: boolean) => void } | null = null
let blocked = false
const setBlocked = (b: boolean) => { if (blocked !== b) { blocked = b; emit() } }

const silence = () => {   // 0.1 s of silent 16-bit mono WAV, as a blob URL
  const n = 2400, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), s = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, 1, true); v.setUint32(24, 24000, true); v.setUint32(28, 48000, true); v.setUint16(32, 2, true)
  v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 2, true)
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }))
}
export function unlockSound() {
  if (unlocked || typeof Audio === 'undefined') return
  el ||= new Audio()
  if (current) return
  el.src = silence()
  el.play().then(() => { unlocked = true }, () => {})
}

/** Plays one line's WAV; resolves when it ends (true) or cannot play (false). Refused for want of a tap: waits. */
export function playSound(wav: ArrayBuffer, onStart?: () => void): Promise<boolean> {
  stopSound()
  el ||= new Audio()
  const a = el, url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
  return new Promise<boolean>((resolve) => {
    const me = {
      finish: (played: boolean) => {
        if (current !== me) return
        current = null; a.onended = a.onerror = a.onplaying = null; URL.revokeObjectURL(url); setBlocked(false); resolve(played)
      },
    }
    current = me
    a.onended = () => me.finish(true)
    a.onerror = () => me.finish(false)
    a.onplaying = () => { a.onplaying = null; onStart?.() }
    a.src = url
    a.play().then(() => { unlocked = true }, (e: DOMException) => {
      if (e?.name === 'NotAllowedError') setBlocked(true); else me.finish(false)
    })
  })
}
export function pauseSound() { if (current) el?.pause() }
export function resumeSound() { if (current) el?.play().catch(() => {}) }
export function stopSound() { if (!current) return; el?.pause(); current.finish(false) }
export function tapForSound() {
  if (!el || !current) return
  const me = current
  el.play().then(() => { unlocked = true; setBlocked(false) }, () => me.finish(false))
}
export const useSoundBlocked = () => useSyncExternalStore(subscribe, () => blocked, () => false)
