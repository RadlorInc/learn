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
let cancelClip: (() => void) | null = null

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

// ── Fragment stitching ────────────────────────────────────────────────────────
// A question prompt carries its numbers ("negative 5 times 3…"), so it can't be one
// clip. We pre-render the literal RUNS between the numbers and a small value
// vocabulary, then play run → value → run. Only the seams are joins; most of the
// sentence is still real speech.
type Frag = { segments: string[]; re: RegExp }
let _frags: Frag[] | null = null
let _fragKeys: Set<string> | null = null
let _fragLoading: Promise<void> | null = null

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function loadFragments(voice: string): Promise<void> {
  if (_frags) return Promise.resolve()
  if (!_fragLoading) {
    _fragLoading = Promise.all([
      fetch(`/audio/${voice}/frag/fragments.json`).then((r) => (r.ok ? r.json() : [])),
      fetch('/audio/fragment-templates.json').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([keys, tpls]: [string[], { segments: string[] }[]]) => {
        _fragKeys = new Set(keys)
        // Anchored, non-greedy holes: the literal runs pin the match, the gaps are values.
        _frags = tpls.map((t) => ({
          segments: t.segments,
          re: new RegExp('^' + t.segments.map(esc).join('([^]*?)') + '$'),
        }))
      })
      .catch(() => { _fragKeys = new Set(); _frags = [] })
  }
  return _fragLoading
}

/** Clip keys for a stitched line, or null if any piece is missing. */
function stitchKeys(text: string): string[] | null {
  if (!_frags || !_fragKeys) return null
  for (const f of _frags) {
    const m = text.match(f.re)
    if (!m) continue
    const keys: string[] = []
    for (let i = 0; i < f.segments.length; i++) {
      const seg = f.segments[i].trim()
      if (seg && /[a-zA-Z]/.test(seg)) keys.push(clipKey(seg))
      const val = m[i + 1]?.trim()
      if (val) {
        // "negative 5" is two fragments, so the vocabulary stays 0–100 plus one word.
        for (const tok of val.split(/\s+/)) {
          const k = clipKey(`#${tok}`)
          if (!_fragKeys.has(k)) return null      // an unvoiceable value ⇒ fall back whole
          keys.push(k)
        }
      }
    }
    // Every piece must exist. A gap mid-sentence reads as a bug; browser speech doesn't.
    return keys.every((k) => _fragKeys!.has(k)) ? keys : null
  }
  return null
}

/** Play clips back to back. Resolves when the last ends; rejects if any fails to load. */
function playSequence(urls: string[], onStart?: () => void): { done: Promise<void>; cancel: () => void } {
  let i = 0, cancelled = false
  let cur: HTMLAudioElement | null = null
  const done = new Promise<void>((resolve, reject) => {
    const next = () => {
      if (cancelled) return resolve()
      if (i >= urls.length) return resolve()
      const a = new Audio(urls[i++])
      cur = a; _active = a
      a.onended = next
      a.onerror = () => reject(new Error('fragment missing'))
      a.play().then(() => { if (i === 1) onStart?.() }).catch(reject)
    }
    next()
  })
  return { done, cancel: () => { cancelled = true; if (cur) { try { cur.pause() } catch {} } } }
}

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
    if (cancelClip) { cancelClip(); cancelClip = null }   // also stops a running stitch
    stopClip()
  }

  const voice = getVoicePref()
  if (voice === 'device') { fallback(); return cancel }

  void loadManifest(voice).then(async () => {
    if (cancelled) return
    const key = clipKey(text)
    if (!_keys?.has(key)) {
      // No whole-line clip — try stitching it from pre-rendered runs + values.
      await loadFragments(voice)
      if (cancelled) return
      const keys = stitchKeys(text)
      if (!keys?.length) { fallback(); return }
      const seq = playSequence(keys.map((k) => `/audio/${voice}/frag/${k}.mp3`), () => onStart?.())
      cancelClip = seq.cancel
      seq.done.then(() => { if (!cancelled) { _active = null; onDone?.() } })
         .catch(() => { if (!cancelled) { _active = null; fallback() } })
      return
    }

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
