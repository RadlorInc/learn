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
import { clipKey, clipCheck } from '@/core/voiceClips'
import { JOSH } from '@/infra/storage/voicePref'
import { AUDIO_BASE } from '@/core/audioBase'

// (Clip-only mode — a missing clip stays silent — was removed 2026-09-24 with the fragment stitcher it depended on;
// its one caller, the teen GameShell, was deleted 2026-09-20. A line with no clip is spoken by the browser.)

/** One module's clips: clip key → [object name (16 hex), clipCheck of the line, and — in a KG–2 chapter's index — the
 *  clip's size in bytes]. Built by scripts/audio/build-manifest.mjs. */
export type ClipIndex = Record<string, [string, string, number?]>

// The voice a SCREEN speaks in, and where that screen's clips are listed — set while a lesson or a KG–2 chapter is mounted
// (LessonPlayer passes its module's index loader, /game the playing chapter's, so infra never imports content).
let _sceneVoice: string | null = null
let _indexLoad: (() => Promise<ClipIndex>) | null = null
export function setSceneVoice(v: string | null, index?: () => Promise<ClipIndex>): void {
  _sceneVoice = v
  _indexLoad = v ? index ?? null : null
  // A new scene starts with nothing held and nothing open: a question belongs to the chapter that opened it.
  _held.clear()
  _onTap.clear()
  _open = 0
}

/**
 * ⚠️⚠️ A QUESTION'S CLIPS ARE ALL ASKED FOR WHEN IT LOADS, AND NONE AFTER THE CHILD ANSWERS (founder, 2026-09-27,
 * docs/decisions.md, 2026-09-27). Some KG–2 lines are built from what the child tapped ("That makes seventeen. I asked
 * for twenty-one."), and a clip is a request to the bucket, so asking for it at the moment of the tap would put "this
 * device chose 17" in the storage provider's logs. So:
 *   · `openQuestion(lines)` — called as a question loads, with EVERY line it can lead to (each option's, right and wrong)
 *     — fetches each line's clip into memory, as a `data:` URL (media-src already allows `data:`; no CSP change);
 *   · while any question is open, a line plays ONLY from memory. A line that was not handed over is spoken by the
 *     device voice and asks for NOTHING — so the requests are the same whichever option is tapped BY CONSTRUCTION, not
 *     because every chapter remembered its lines. Forgetting one costs Josh's voice on that line, never a request;
 *   · a held clip plays from memory even after its question closes (the praise still queued behind the last answer);
 *     only a new scene (`setSceneVoice`) drops them, and each question keeps its own and the previous one's.
 * The next question itself is chosen after the answer (the tier moves), so ITS lines can differ — that is "what comes
 * next", not feedback on this answer, and the guarantee stops where the next question opens.
 */
const _held = new Map<string, { gen: number; src: Promise<string | null> }>()
/**
 * ⚠️ THE ONE EXCEPTION, AND WHY (founder, 2026-09-27): a question's ANSWER lines are fetched ahead only while they total
 * at most `maxBytes`; past that they are fetched when said, as before the lock. Money's are the case — every total the
 * child can lay makes its own line, a median ~380 KB a question (only 1 of 300 measured rounds fits 100 KB). The
 * founder's reason: the answer reaches Supabase anyway through progress sync. Precisely: a signed-in child's CORRECT
 * answer uploads level, streak, mastery and first-try-or-after-a-miss (useAdaptive → record_lesson_progress); a miss
 * clip adds WHICH wrong total was laid, and carries no account.
 * These are the clips allowed on tap while their question is open; every other line is still held or refused.
 */
const _onTap = new Map<string, number>()
let _open = 0
let _gen = 0

function holdClip(url: string): Promise<string | null> {
  return fetch(url)
    .then(r => (r.ok ? r.blob() : null))
    .then(b => b && new Promise<string | null>(res => {
      const fr = new FileReader()
      fr.onload = () => res(typeof fr.result === 'string' ? fr.result : null)
      fr.onerror = () => res(null)
      fr.readAsDataURL(new Blob([b], { type: 'audio/mpeg' }))
    }))
    .catch(() => null)
}

/**
 * A question has loaded: hold the clip of every line it can lead to. Returns the release for when it is answered and gone.
 * `answers` (optional): the lines only a particular answer leads to, held too while their clips total at most `maxBytes`
 * — otherwise allowed to be fetched when said (see `_onTap`). A clip whose size the index does not carry counts as over.
 */
export function openQuestion(texts: string[], answers?: { lines: string[]; maxBytes: number }): () => void {
  _open++
  const gen = ++_gen
  // A question keeps its own clips and the previous question's (whose last line may still be queued); older ones go.
  for (const [url, h] of _held) if (h.gen < gen - 1) _held.delete(url)
  for (const [url, g] of _onTap) if (g < gen - 1) _onTap.delete(url)
  const load = _indexLoad
  if (voiceNow() && load && typeof fetch !== 'undefined') {
    void loadIndex(load).then(index => {
      const hold = (url: string) => {
        const h = _held.get(url)
        if (h) h.gen = gen
        else _held.set(url, { gen, src: holdClip(url) })
      }
      for (const t of new Set(texts)) { const url = clipUrl(index, t); if (url) hold(url) }
      if (!answers) return
      const clips = [...new Set(answers.lines)].map(t => ({ url: clipUrl(index, t), bytes: index[clipKey(t)]?.[2] }))
        .filter((c): c is { url: string; bytes: number | undefined } => !!c.url)
      const total = clips.reduce((a, c) => a + (c.bytes ?? Infinity), 0)
      for (const c of clips) { if (total <= answers.maxBytes) hold(c.url); else _onTap.set(c.url, gen) }
    })
  }
  let released = false
  return () => { if (!released) { released = true; _open = Math.max(0, _open - 1) } }
}

/**
 * The voice a line plays in, or null for the device voice. ⚠️ ONLY JOSH (founder, 2026-09-26): Stevie and Teddy are
 * deleted, and so are the two things that used to reach them — the per-device pick (default Stevie) and the 3–5 band's
 * voice (Teddy). Anything but JOSH, and any line spoken outside a lesson or a KG–2 chapter, is the device voice, as before
 * (their static lines had 0 clips). One guard, so no path can ask for a deleted voice's files.
 */
function voiceNow(): string | null {
  return _sceneVoice === JOSH ? JOSH : null
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
 * A module's clip index, ONE promise per module loader.
 *
 * ⚠️ WHERE IT COMES FROM (2026-09-26). The clips used to be listed in one /audio/<voice>/manifest.json per voice (70 KB,
 * 34 KB gzip). They now live in the lesson-audio bucket under content-hash names, so a line needs its object NAME, and one
 * index of every name was 109–167 KB gzip — a slower first lesson. So each module carries its own (≈5 KB gzip), a hashed
 * JS chunk loaded with the module: cached immutably like the rest of /_next/static, and it cannot go stale, because a new
 * render means a new build means a new chunk (the stale-manifest class of 2026-09-04 cannot recur).
 *
 * ⚠️ A FAILED load is not remembered as final (BUG-05, 2026-09-26): it answers empty for this call and is retried by a
 * later call, no sooner than INDEX_RETRY_MS after it, so an offline device does not ask on every line.
 */
const _indexes = new Map<() => Promise<ClipIndex>, Promise<ClipIndex>>()
const INDEX_RETRY_MS = 10_000
const _failedAt = new Map<() => Promise<ClipIndex>, number>()
function loadIndex(load: () => Promise<ClipIndex>): Promise<ClipIndex> {
  let p = _indexes.get(load)
  const failed = _failedAt.get(load)
  if (!p || (failed !== undefined && Date.now() - failed >= INDEX_RETRY_MS)) {
    _failedAt.delete(load)
    p = load().catch(() => { _failedAt.set(load, Date.now()); return {} as ClipIndex })   // no index → this line falls back
    _indexes.set(load, p)
  }
  return p
}

/**
 * The URL of a line's clip, or null: `<AUDIO_BASE>/<object name>.mp3` and NOTHING else — no voice, learner, grade, locale
 * or query string (the name is a hash of the audio bytes). A clip is used only when the line's key AND its independent
 * check both match the index; key alone is 32 bits and runtime-built lines collide with real clips (voiceClips.ts), so a
 * line carrying a child's name can never reach a request.
 */
function clipUrl(index: ClipIndex, text: string): string | null {
  const e = index[clipKey(text)]
  return AUDIO_BASE && e && e[1] === clipCheck(text) ? `${AUDIO_BASE}/${e[0]}.mp3` : null
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
  const load = _indexLoad
  if (!voiceNow() || !load || typeof fetch === 'undefined') return
  void loadIndex(load).then(index => {
    for (const t of texts) {
      const url = clipUrl(index, t)
      if (url) void fetch(url).catch(() => {})
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

  const load = _indexLoad
  if (!voiceNow() || !load) { settled = 'tts'; fallback(); return cancel }

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

  void loadIndex(load).then((index) => {
    if (cancelled) return
    const url = clipUrl(index, text)
    if (!url) { miss(); return }
    // Held with a question → play it from memory. Not held while a question is open → the device voice, and no
    // request (see openQuestion). Otherwise the bucket, as before.
    const held = _held.get(url)
    if (held) { void held.src.then(src => { if (!cancelled) { if (src) play(src); else miss() } }); return }
    if (_open > 0 && !_onTap.has(url)) { miss(); return }
    play(url)
  })

  function play(src: string) {
    const audio = audioEl()
    audio.src = src
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
  }

  return cancel
}
