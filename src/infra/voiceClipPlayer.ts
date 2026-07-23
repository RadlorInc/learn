'use client'
/**
 * Play a PRE-RENDERED clip for a spoken line, falling back to browser speech when we
 * don't hold one.
 *
 * Why clips at all: Chrome ships no usable local voice on many machines, so Milo was
 * simply silent there — and the teen walkthroughs are where the actual teaching lives.
 *
 * The whole layer is fallback-first: any miss (no clip, no manifest, decode error,
 * autoplay refused) calls `fallback()` and the app behaves exactly as it did before.
 * That matters because the browser-speech path carries hard-won blocked-audio and
 * timed-sweep handling we do not want to duplicate or regress.
 */
import { clipKey } from '@/core/voiceClips'
import { getVoicePref } from '@/infra/storage/voicePref'

let _keys: Set<string> | null = null
let _loading: Promise<void> | null = null
let _loadedFor: string | null = null
let _active: HTMLAudioElement | null = null

function loadManifest(voice: string): Promise<void> {
  if (_keys && _loadedFor === voice) return Promise.resolve()
  if (!_loading || _loadedFor !== voice) {
    _loadedFor = voice
    _loading = fetch(`/audio/${voice}/manifest.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((keys: string[]) => { _keys = new Set(keys) })
      .catch(() => { _keys = new Set() })      // no manifest → every line falls back
  }
  return _loading
}

// Switching voice invalidates the cached key set — otherwise the new voice is looked up
// against the old voice's manifest.
if (typeof window !== 'undefined') {
  window.addEventListener('milo-voice-change', () => { _keys = null; _loading = null; _loadedFor = null })
}

/** Warm the manifest early so the first line of a chapter isn't a guaranteed miss. */
export function preloadVoiceClips(): void { void loadManifest(getVoicePref()) }

/** Stop any clip in flight. Called by stopSpeech() so one stop covers both paths. */
export function stopClip(): void {
  if (_active) { try { _active.pause() } catch {} ; _active = null }
}

type Opts = {
  /** Fires per word so callers can drive a highlight, as speechSynthesis onboundary would. */
  onWord?: (i: number) => void
  /** Fires once the clip is actually playing — the analogue of an utterance's onstart. */
  onStart?: () => void
  onDone?: () => void
  /** Run the original browser-speech path. Called on ANY miss or failure. */
  fallback: () => void
  /** Word count, when the caller already split the text (keeps indices aligned). */
  words?: number
}

/**
 * Speak one line. Returns a cancel function immediately — the clip lookup happens
 * async inside, so callers keep their synchronous shape.
 */
export function speakLine(text: string, opts: Opts): () => void {
  const { onWord, onStart, onDone, fallback, words } = opts
  let cancelled = false
  let sweep: ReturnType<typeof setInterval> | null = null
  const cancel = () => {
    if (cancelled) return
    cancelled = true
    if (sweep) { clearInterval(sweep); sweep = null }
    stopClip()
  }

  const voice = getVoicePref()
  if (voice === 'device') { fallback(); return cancel }

  void loadManifest(voice).then(() => {
    if (cancelled) return
    const key = clipKey(text)
    if (!_keys?.has(key)) { fallback(); return }

    const audio = new Audio(`/audio/${voice}/${key}.mp3`)
    _active = audio

    audio.onended = () => {
      if (cancelled) return
      if (sweep) { clearInterval(sweep); sweep = null }
      // Land the highlight on the final word rather than leaving it mid-sentence.
      if (onWord && words) onWord(words - 1)
      _active = null
      onDone?.()
    }
    // Any failure at all → the browser-speech path, so a bad clip is never a silent line.
    audio.onerror = () => { if (!cancelled) { _active = null; fallback() } }

    audio.play().then(() => {
      if (cancelled) { stopClip(); return }
      onStart?.()
      // Drive the word highlight off the clip's REAL duration. This is strictly better
      // than the speech-synthesis fallback's length-weighted guess, which has nothing
      // to pace against when the engine fires no boundary events.
      if (onWord && words && words > 1) {
        const step = Math.max(120, ((audio.duration || words * 0.42) * 1000) / words)
        let i = 0
        onWord(0)
        sweep = setInterval(() => {
          i++
          if (i >= words) { if (sweep) clearInterval(sweep); sweep = null; return }
          onWord(i)
        }, step)
      }
    }).catch(() => {
      // Autoplay refused (no user gesture yet) — fall back rather than going silent.
      if (!cancelled) { _active = null; fallback() }
    })
  })

  return cancel
}
