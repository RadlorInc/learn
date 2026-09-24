'use client'
/**
 * Play a PRE-RENDERED clip for a spoken line, falling back to browser speech when we
 * don't hold one.
 *
 * Why clips at all: Chrome ships no usable local voice on many machines, so the app was
 * simply silent there — and the teen walkthroughs are where the actual teaching lives.
 *
 * The whole layer is fallback-first: any miss (no clip, no manifest, decode error,
 * autoplay refused) calls `fallback()` and the app behaves exactly as it did before.
 * That matters because the browser-speech path carries hard-won blocked-audio and
 * timed-sweep handling we do not want to duplicate or regress.
 */
import { clipKey } from '@/core/voiceClips'
import { getVoicePref, BAND_VOICE } from '@/infra/storage/voicePref'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'

// When on, a selected custom voice is the ONLY voice: a line with no clip stays silent
// rather than falling back to browser TTS, so the teen game never mixes the two voices.
// Only bites when a real voice is picked — with 'device' there are no clips, so we must
// still fall back or teen games would be silent. Set by the teen GameShell while mounted.
//
// ⚠️⚠️ DO NOT TURN THIS ON FOR A BAND THAT HAS NO FRAGMENT STITCHER. Clip-only does not mean
// "prefer clips" — it means a line we hold no clip for is SILENT, not spoken by the browser, and
// nothing anywhere logs it, because a miss is a normal expected event. 12–14 survives it ONLY
// because its templated lines are stitched from `frag/`. Measured 2026-09-04 by driving the
// generators: one 12–14 chapter's entire spoken space is 22 whole lines, while a 9–11 chapter was
// still producing NEW ones at 24,000 draws (1,653 and climbing). Whole-line coverage of a band
// like that is a FLOOR that never reaches 100%, so clip-only there is a child sitting in front of
// a silent chapter. Before flipping it for 3–5, 6–8, 9–11, 15–16 or 17–18: build that band's
// stitcher first. (Templates and literal RUNS do saturate — that is what makes a stitcher finite
// where whole lines are not: goingViral renders 1,299 distinct lines from 13 templates / 34 runs.)
let _clipOnly = false
export function setClipOnly(v: boolean): void { _clipOnly = v }

// The voice a SCREEN speaks in, whatever the learner's band or the device pick — a new-flow lesson reads in its grade's
// voice (lessonVoice), because that is the voice its clips were rendered in. Set while a lesson is mounted.
// It wins over a stored 'device' pick too (see voiceNow).
let _sceneVoice: string | null = null
export function setSceneVoice(v: string | null): void { _sceneVoice = v }

/**
 * The voice a line plays in, or null for browser speech. A lesson's scene voice wins even over a stored 'device' pick:
 * the picker that set it was deleted (2026-09-17), so the pick could never be undone and the lesson spoke in browser
 * TTS for ever. Elsewhere, the learner's band may own a voice (3–5 → Teddy); otherwise the device pick stands.
 */
function voiceNow(): string | null {
  const pref = getVoicePref()
  return _sceneVoice ?? (pref === 'device' ? null : BAND_VOICE[getActiveLearner()?.age_group ?? ''] ?? pref)
}

let _keys: Set<string> | null = null
let _loading: Promise<void> | null = null
let _loadedFor: string | null = null
let _active: HTMLAudioElement | null = null
let cancelClip: (() => void) | null = null

// ONE reused <audio> for every clip. Mobile (iOS Safari especially) grants autoplay
// only to the exact element that was played inside a user gesture — a fresh `new Audio()`
// created later when the walkthrough auto-starts is rejected, so speakLine falls back to
// browser TTS. Playing this element (silently) in the intro tap unlocks it for the whole
// session; all clip playback then goes through it. See unlockVoiceClips().
let _el: HTMLAudioElement | null = null
// How fast a clip plays back. A RECORDED clip ignores the `rate` passed to speak()
// — that only ever reached the browser-TTS fallback — so without this the "speech
// speed" control is a dead button for every learner who has clips, which is the
// whole 12–18 band. `preservesPitch` keeps the voice sounding like itself when slowed.
let _rate = 1
export function setClipRate(r: number): void {
  _rate = r
  if (_el) applyRate(_el)
}
function applyRate(a: HTMLAudioElement): void {
  try {
    // defaultPlaybackRate too: loading a new src resets playbackRate TO it, and the whole-line path sets src without
    // calling this again, so a rate set here lasted one clip at most. Measured 2026-09-20: 0.9 asked, 1 played.
    a.defaultPlaybackRate = _rate
    a.playbackRate = _rate
    // Non-standard on older WebKit; harmless where absent.
    ;(a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true
  } catch {}
}
function audioEl(): HTMLAudioElement {
  if (!_el) { _el = new Audio(); applyRate(_el) }
  return _el
}
// A valid 0-sample WAV — decodes everywhere, ends instantly; enough to unlock the element.
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

/** Unlock clip audio from inside a user gesture (call next to unlockSpeech, e.g. the intro tap). */
export function unlockVoiceClips(): void {
  const a = audioEl()
  try { a.src = SILENT; void a.play().then(() => { a.pause(); a.currentTime = 0 }).catch(() => {}) } catch {}
}

function loadManifest(voice: string): Promise<void> {
  if (_keys && _loadedFor === voice) return Promise.resolve()
  if (!_loading || _loadedFor !== voice) {
    _loadedFor = voice
    // ⚠️ `no-cache` = REVALIDATE, not "do not cache" — the request still goes out with the
    // ETag and an unchanged manifest comes back 304. It is here because the header fix alone
    // cannot reach a browser that ALREADY holds the old copy: `/audio/` was served with
    // max-age=2592000, so a device that loaded the app before a render keeps the previous key
    // list for up to a month and simply never asks for the new clips. That is exactly how
    // 17–18 stayed mute in Chrome while 12–14 and 15–16 played (their keys were in the stale
    // list) — and it is silent by construction, because a short list is a clean miss, and a
    // miss falls back to browser speech, which on most Chrome installs is nothing at all.
    _loading = fetch(`/audio/${voice}/manifest.json`, { cache: 'no-cache' })
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
      fetch(`/audio/${voice}/frag/fragments.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : [])),
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
  const a = audioEl(); _active = a
  const done = new Promise<void>((resolve, reject) => {
    const next = () => {
      if (cancelled) return resolve()
      if (i >= urls.length) return resolve()
      a.onended = next
      a.onerror = () => reject(new Error('fragment missing'))
      a.src = urls[i++]
      applyRate(a)   // re-assert per clip: a src change can reset playbackRate
      a.play().then(() => { if (i === 1) onStart?.() }).catch((e: unknown) => { if ((e as DOMException | undefined)?.name !== 'AbortError') reject(e) })
    }
    next()
  })
  return { done, cancel: () => { cancelled = true; try { a.pause() } catch {} } }
}

/**
 * Download these lines' clips now, so the next sentence starts the moment the last one ends. Fetched one at a time
 * when due, the download sat between every two sentences of a screen (measured on production: 309 ms, on a fast
 * connection). The service worker keeps them (cache-first), so the <audio> element's own request is a cache hit.
 */
export function prefetchClips(texts: string[]): void {
  const voice = voiceNow()
  if (!voice || typeof fetch === 'undefined') return
  void loadManifest(voice).then(() => {
    for (const t of texts) {
      const key = clipKey(t)
      if (_keys?.has(key)) void fetch(`/audio/${voice}/${key}.mp3`).catch(() => {})
    }
  })
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

  const voice = voiceNow()
  if (!voice) { fallback(); return cancel }

  // A miss with a custom voice selected: stay silent (custom-voice-only) instead of the
  // free voice, unless clip-only is off — then fall back exactly as before.
  const miss = () => { if (cancelled) return; _active = null; if (_clipOnly) onDone?.(); else fallback() }

  void loadManifest(voice).then(async () => {
    if (cancelled) return
    const key = clipKey(text)
    if (!_keys?.has(key)) {
      // No whole-line clip — try stitching it from pre-rendered runs + values.
      await loadFragments(voice)
      if (cancelled) return
      const keys = stitchKeys(text)
      if (!keys?.length) { miss(); return }
      const seq = playSequence(keys.map((k) => `/audio/${voice}/frag/${k}.mp3`), () => onStart?.())
      cancelClip = seq.cancel
      seq.done.then(() => { if (!cancelled) { _active = null; onDone?.() } })
         .catch(() => miss())
      return
    }

    const audio = audioEl()
    audio.src = `/audio/${voice}/${key}.mp3`
    _active = audio

    audio.onended = () => {
      if (cancelled) return
      if (sweep) { clearInterval(sweep); sweep = null }
      // Land the highlight on the final word rather than leaving it mid-sentence.
      if (onWord && words) onWord(words - 1)
      _active = null
      onDone?.()
    }
    // Any failure at all → the browser-speech path (or silence under clip-only).
    audio.onerror = () => miss()

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
    }).catch((e: unknown) => {
      // ⚠️ NOT every rejection is a miss. A play() that WAS running and got replaced or paused rejects with
      // AbortError — which is what our own next line does through the shared element — and treating that as "no clip"
      // spoke the line in browser TTS with its clip sitting right there. Measured on production 2026-09-20: Screen 8
      // said "Now you try…" in the robot voice, key 16ie8k4 in the manifest and 200 on the CDN. A real refusal
      // (NotAllowedError: no gesture yet) still falls back.
      if ((e as DOMException | undefined)?.name === 'AbortError') {
        // A NEWER line took the element: that one speaks, this one is done. Nothing took it (our own pause raced the
        // play) → play it again, because dropping it silently is worse than the robot voice this used to produce.
        if (cancelled) return
        audio.play().catch(() => miss())
        return
      }
      miss()
    })
  })

  return cancel
}
