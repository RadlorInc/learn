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

// (Clip-only mode — a missing clip stays silent — was removed 2026-09-24 with the fragment stitcher it depended on;
// its one caller, the teen GameShell, was deleted 2026-09-20. A line with no clip is spoken by the browser.)

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

let _active: HTMLAudioElement | null = null

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

/**
 * The clip keys a voice has, ONE promise per voice.
 *
 * ⚠️ PER VOICE, NOT ONE SHARED SET (2026-09-24). A single `_keys` was filled by whichever manifest answered LAST, so a
 * slow manifest for the voice a page used before a lesson (the band's voice on the child's home) could land after the
 * lesson's own and replace it: every lesson line then looked missing, the player asked for stitching fragments that do
 * not exist (the 404s on /frag/fragments.json in production), and fell back to browser speech. A map cannot mix them up.
 *
 * ⚠️ `no-cache` = REVALIDATE, not "do not cache" — the request still goes out with the ETag and an unchanged manifest
 * comes back 304. `/audio/` was once served with max-age=2592000, so a device that loaded the app before a render kept
 * the previous key list for up to a month and never asked for the new clips (17–18 mute in Chrome) — silent by
 * construction, because a short list is a clean miss and a miss falls back to browser speech.
 */
const _manifests = new Map<string, Promise<Set<string>>>()
function loadManifest(voice: string): Promise<Set<string>> {
  let p = _manifests.get(voice)
  if (!p) {
    p = fetch(`/audio/${voice}/manifest.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : []))
      .then((keys: string[]) => new Set(keys))
      .catch(() => new Set<string>())      // no manifest → every line falls back
    _manifests.set(voice, p)
  }
  return p
}

// A voice change (or a new render arriving) re-reads the manifests.
if (typeof window !== 'undefined') {
  window.addEventListener('milo-voice-change', () => { _manifests.clear() })
}

// ⚠️ There is no fragment stitching any more (removed 2026-09-24). It asked for /audio/<voice>/frag/fragments.json and
// /audio/fragment-templates.json, and no voice has had fragments since the old clips were deleted (2026-09-13): every
// line without a whole clip cost two 404s before it could fall back. A line is a whole clip, or browser speech.

/**
 * Download these lines' clips now, so the next sentence starts the moment the last one ends. Fetched one at a time
 * when due, the download sat between every two sentences of a screen (measured on production: 309 ms, on a fast
 * connection). The service worker keeps them (cache-first), so the <audio> element's own request is a cache hit.
 */
export function prefetchClips(texts: string[]): void {
  const voice = voiceNow()
  if (!voice || typeof fetch === 'undefined') return
  void loadManifest(voice).then(keys => {
    for (const t of texts) {
      const key = clipKey(t)
      if (keys.has(key)) void fetch(`/audio/${voice}/${key}.mp3`).catch(() => {})
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
 * Speak one line. Returns a cancel function immediately — the clip lookup happens async inside, so callers keep their
 * synchronous shape.
 *
 * ⚠️⚠️ ONE LINE, ONE VOICE (production, 2026-09-24: browser speech said the start of a lesson line, then the recorded
 * clip said the same line). A line settles ONCE, as `clip` or as `tts`:
 *   · browser speech (`fallback`) runs only on a CLEAR failure — no clip for this line, the clip will not load, or the
 *     browser refuses to play it. A slow clip is waited for; there is no timer that gives up on it.
 *   · the moment the clip really starts, any browser speech still sounding is cancelled.
 *   · a clip that starts AFTER this line has already fallen back is stopped at once, never played over the speech.
 *   · a clip that fails after it started has spoken: the line ends, it is not said again in the other voice.
 */
export function speakLine(text: string, opts: Opts): () => void {
  const { onWord, onStart, onDone, fallback, words } = opts
  let cancelled = false
  let settled: 'pending' | 'clip' | 'tts' = 'pending'
  let sweep: ReturnType<typeof setInterval> | null = null
  const cancel = () => {
    if (cancelled) return
    cancelled = true
    if (sweep) { clearInterval(sweep); sweep = null }
    stopClip()
  }

  const voice = voiceNow()
  if (!voice) { settled = 'tts'; fallback(); return cancel }

  const end = () => {
    if (sweep) { clearInterval(sweep); sweep = null }
    _active = null
    onDone?.()
  }
  // Only a line still PENDING falls back to browser speech; one that played its clip just ends.
  const miss = () => {
    if (cancelled) return
    if (settled === 'clip') { end(); return }
    if (settled === 'tts') return
    settled = 'tts'
    _active = null
    fallback()
  }

  void loadManifest(voice).then((keys) => {
    if (cancelled) return
    const key = clipKey(text)
    if (!keys.has(key)) { miss(); return }

    const audio = audioEl()
    audio.src = `/audio/${voice}/${key}.mp3`
    _active = audio

    audio.onended = () => {
      if (cancelled) return
      // Land the highlight on the final word rather than leaving it mid-sentence.
      if (onWord && words) onWord(words - 1)
      end()
    }
    // Any failure at all → the browser-speech path (or silence under clip-only) — if the clip has not already spoken.
    audio.onerror = () => miss()

    const started = () => {
      if (cancelled) { stopClip(); return }
      // Too late: this line already went to browser speech. Two voices saying one line is the bug; stop the clip.
      if (settled === 'tts') { try { audio.pause() } catch {} ; return }
      if (settled === 'clip') return
      settled = 'clip'
      // The recorded voice wins over any browser speech still sounding.
      try { window.speechSynthesis?.cancel() } catch {}
      onStart?.()
      // Drive the word highlight off the clip's REAL duration. This is strictly better than the speech-synthesis
      // fallback's length-weighted guess, which has nothing to pace against when the engine fires no boundary events.
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
    }

    audio.play().then(started).catch((e: unknown) => {
      // ⚠️ NOT every rejection is a miss. A play() that WAS running and got replaced or paused rejects with
      // AbortError — which is what our own next line does through the shared element — and treating that as "no clip"
      // spoke the line in browser TTS with its clip sitting right there. Measured on production 2026-09-20: Screen 8
      // said "Now you try…" in the robot voice, key 16ie8k4 in the manifest and 200 on the CDN. A real refusal
      // (NotAllowedError: no gesture yet) still falls back.
      if ((e as DOMException | undefined)?.name === 'AbortError') {
        // A NEWER line took the element: that one speaks, this one is done. Nothing took it (our own pause raced the
        // play) → play it again, because dropping it silently is worse than the robot voice this used to produce.
        if (cancelled) return
        audio.play().then(started).catch(() => miss())
        return
      }
      miss()
    })
  })

  return cancel
}
