'use client'

/**
 * useMiloSpeaker — Milo's speech engine
 *
 * Root cause of silence bug:
 * Chrome's speechSynthesis gets stuck when:
 * 1. cancel() and speak() are called too close together
 * 2. Multiple speak() calls queue up (pending: true, speaking: true, no audio)
 *
 * Fix:
 * - cancel() then wait 100ms BEFORE speak() — gives Chrome time to reset
 * - Dedupe: if same text is already speaking, don't re-queue
 * - Single active utterance — always cancel previous before new one
 */

import { useCallback, useSyncExternalStore } from 'react'
import { pointAt, clearPointer } from '@/infra/miloPointer'
import { speakLine, stopClip, unlockVoiceClips } from '@/infra/voiceClipPlayer'

// ─── Singleton state ──────────────────────────────────────────────────────────
let _voices: SpeechSynthesisVoice[] = []
let _speaking   = false
let _blocked    = false
let _lastText   = ''
let _lastRate   = 0.88
let _lastPitch  = 1.05
let _speakTimer: ReturnType<typeof setTimeout> | null = null
let _onEndCbs: Array<() => void> = []
let _keepalive: ReturnType<typeof setInterval> | null = null
// Safety watchdog for a single utterance: if onstart fires but onend/onerror
// never do (a known mobile interruption), this clears _speaking so SpeakingLock
// can't freeze the whole screen and afterSpeech() callbacks still run.
let _singleWatch: ReturnType<typeof setTimeout> | null = null
// Cancel fn for an in-flight speakSeq(). stopSpeech()/speak() call this so a
// sequence is truly stopped — otherwise cancelling its current utterance just
// makes it advance to the next line (it would keep talking after Skip).
let _activeSeqCancel: (() => void) | null = null

const _subs = new Set<() => void>()
function _notify() { _subs.forEach(f => f()) }

function _setSpeaking(v: boolean) {
  if (_speaking === v) return
  _speaking = v
  _notify()
  if (!v) {
    if (_keepalive) { clearInterval(_keepalive); _keepalive = null }
    if (_singleWatch) { clearTimeout(_singleWatch); _singleWatch = null }
    const cbs = [..._onEndCbs]; _onEndCbs = []
    cbs.forEach(cb => cb())
  }
}

function _setBlocked(v: boolean) {
  if (_blocked === v) return
  _blocked = v
  _notify()
}

// ─── Voice loading ─────────────────────────────────────────────────────────────
function _loadVoices() {
  if (typeof window === 'undefined') return
  const v = window.speechSynthesis?.getVoices() ?? []
  if (v.length) _voices = v
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  _loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', _loadVoices)
}

function _pickVoice(): SpeechSynthesisVoice | null {
  _loadVoices()
  if (!_voices.length) return null
  // Prefer a warm, kid-friendly, US-ENGLISH LOCAL voice. Two reasons for "local first": Chrome's
  // "Google …" voices are network-backed and fail SILENTLY when the endpoint is unreachable (no
  // sound, sometimes no error), whereas a local voice always produces audio. Reason for "US": the
  // product is American English, so we must NOT fall onto the British/Australian/Irish system voices
  // (Daniel/Karen/Moira) that ship alongside the US ones — they were in this list before and gave
  // Milo a non-US accent. Ordered warmest/most kid-appropriate first (Samantha & the enhanced US
  // female voices read best for young children); male US voices and the Windows voices follow.
  const LOCAL_PREFER = [
    'Samantha', 'Ava', 'Allison', 'Susan', 'Nicky',   // macOS/iOS US female (warm)
    'Aaron', 'Alex',                                   // macOS/iOS US male
    'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Microsoft David', // Windows US
  ]
  for (const name of LOCAL_PREFER) {
    const v = _voices.find(v => v.name.includes(name) && v.localService && (v.lang === 'en-US' || v.lang?.startsWith('en')))
    if (v) return v
  }
  // Any local US-English voice, then any local English voice as a floor.
  const localEn =
    _voices.find(v => v.localService && v.lang === 'en-US') ??
    _voices.find(v => v.localService && v.lang?.startsWith('en'))
  if (localEn) return localEn
  // No local English voice at all → the US network voice, then any US voice, then any English.
  const net = _voices.find(v => v.name.includes('Google US English')) ?? _voices.find(v => /US English/i.test(v.name))
  if (net) return net
  return (
    _voices.find(v => v.lang === 'en-US') ??
    _voices.find(v => v.lang?.startsWith('en')) ??
    _voices[0] ?? null
  )
}

// ─── Core speak ───────────────────────────────────────────────────────────────
function _doSpeak(text: string, rate: number, pitch: number) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  if (!text?.trim()) return

  // A new single utterance supersedes any running sequence (stop it for real).
  if (_activeSeqCancel) { const c = _activeSeqCancel; _activeSeqCancel = null; c() }
  stopClip()

  // A pre-rendered clip if we hold one; otherwise the browser path below, unchanged.
  speakLine(text, {
    onStart: () => _setSpeaking(true),
    onDone: () => _setSpeaking(false),
    fallback: () => _doSpeakBrowser(text, rate, pitch),
  })
}

function _doSpeakBrowser(text: string, rate: number, pitch: number) {

  _lastText  = text
  _lastRate  = rate
  _lastPitch = pitch

  // Cancel any pending scheduled speak
  if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null }

  // Cancel current speech
  try { window.speechSynthesis.cancel() } catch {}

  // CRITICAL: wait 100ms after cancel() before speak()
  // Chrome needs this gap — without it, speak() silently fails
  _speakTimer = setTimeout(() => {
    _speakTimer = null

    // Double-check synthesis isn't stuck
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try { window.speechSynthesis.cancel() } catch {}
      // Wait another 50ms if still stuck
      setTimeout(() => _actuallySpeak(text, rate, pitch), 50)
      return
    }

    _actuallySpeak(text, rate, pitch)
  }, 100)
}

function _actuallySpeak(text: string, rate: number, pitch: number) {
  const u = new SpeechSynthesisUtterance(text)
  u.rate   = rate
  u.pitch  = pitch
  u.volume = 1
  u.lang   = 'en-US'
  const voice = _pickVoice()
  if (voice) u.voice = voice

  u.onstart = () => {
    _setBlocked(false)
    _setSpeaking(true)
    _keepalive = setInterval(() => {
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume()
      } catch {}
    }, 5000)
    // If onend/onerror never arrive, force-clear after a generous ceiling so the
    // invisible SpeakingLock tap-blocker can't stay up over the child forever.
    if (_singleWatch) clearTimeout(_singleWatch)
    _singleWatch = setTimeout(() => _setSpeaking(false), Math.max(6000, text.length * 140))
  }

  u.onend = () => _setSpeaking(false)

  u.onerror = (e) => {
    _setSpeaking(false)
    if (e.error === 'not-allowed') {
      _setBlocked(true)
      return
    }
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('[Milo] Speech error:', e.error)
    }
  }

  try {
    window.speechSynthesis.speak(u)
  } catch (err) {
    console.warn('[Milo] speak() threw:', err)
    _setSpeaking(false)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function speak(text: string, rate = 0.88, pitch = 1.05) {
  clearPointer()          // a plain line isn't about any specific element
  _doSpeak(text, rate, pitch)
}

/**
 * Speak a line AND point Milo's hand at the element it's about. The pointer shows
 * while the line plays and hides when Milo stops. Pass null to just speak.
 */
export function speakAt(text: string, target: HTMLElement | null, rate = 0.88, pitch = 1.05) {
  _doSpeak(text, rate, pitch)
  pointAt(target)
}

export function speakAfterCurrent(text: string, rate = 0.88, pitch = 1.05) {
  clearPointer()
  if (_speaking) {
    _onEndCbs.push(() => setTimeout(() => _doSpeak(text, rate, pitch), 200))
  } else {
    setTimeout(() => _doSpeak(text, rate, pitch), 100)
  }
}

/**
 * Unlock the speech engine from inside a user gesture (a tap/click handler). Mobile browsers
 * (iOS Safari especially) only allow speechSynthesis after the FIRST speak() that runs
 * synchronously within a gesture — a later speak() fired from an effect is silently blocked, which
 * makes a demo fall back to its silent fast-stepping path. Speaking a near-silent token here, in
 * the gesture, unlocks the engine so the demo that mounts next actually narrates aloud. Call it
 * from the intro button's onClick. Cheap and idempotent.
 */
export function unlockSpeech() {
  // Also unlock the pre-rendered clip element in the same gesture — mobile grants
  // <audio> autoplay only to an element played inside a tap, else the auto-started
  // walkthrough clips are rejected and every line falls back to browser TTS.
  unlockVoiceClips()
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    window.speechSynthesis.speak(u)
  } catch {}
}

export function stopSpeech() {
  if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null }
  _onEndCbs = []
  clearPointer()
  stopClip()
  // Truly stop any running sequence so it can't advance to its next line.
  if (_activeSeqCancel) { const c = _activeSeqCancel; _activeSeqCancel = null; c() }
  _setSpeaking(false)
  try { window.speechSynthesis.cancel() } catch {}
}

/**
 * Speak a list of phrases strictly one after another — each starts only when the
 * previous one's `end` event fires, so words can never overlap or get cut off
 * (regardless of device speech speed). `onWord(i)` fires when phrase i starts
 * (use it to sync visuals). Returns a cancel function.
 */
export function speakSeq(
  words: string[],
  opts: { onWord?: (i: number) => void; onDone?: () => void; rate?: number; pitch?: number; gapMs?: number } = {},
): () => void {
  const { onWord, onDone, rate = 0.88, pitch = 1.05, gapMs = 0 } = opts
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) { onDone?.(); return () => {} }
  clearPointer()   // callers re-point per word via onWord if they want a pointer
  // Supersede any previous sequence cleanly.
  if (_activeSeqCancel) { const c = _activeSeqCancel; _activeSeqCancel = null; c() }
  if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null }
  let cancelled = false
  let i = 0
  let gapTimer: ReturnType<typeof setTimeout> | null = null
  const cancel = () => {
    if (cancelled) return
    cancelled = true
    if (_activeSeqCancel === cancel) _activeSeqCancel = null
    if (gapTimer) { clearTimeout(gapTimer); gapTimer = null }
    stopClip()
    try { window.speechSynthesis.cancel() } catch {}
    _setSpeaking(false)
  }
  const next = () => {
    if (cancelled) return
    if (i >= words.length) {
      if (_activeSeqCancel === cancel) _activeSeqCancel = null
      _setSpeaking(false); onDone?.(); return
    }
    const idx = i; i++
    const txt = words[idx]
    if (!txt || !txt.trim()) { next(); return }
    // Per-line guard: exactly ONE of {onend, onerror, throw, watchdog} advances.
    let moved = false, started = false
    let watch: ReturnType<typeof setTimeout> | null = null
    const clearWatch = () => { if (watch) { clearTimeout(watch); watch = null } }
    // A breathing pause between lines (gapMs) lets the listener absorb each step —
    // but only after a line that really SPOKE (a blocked/errored line shouldn't crawl).
    const advance = () => {
      if (moved || cancelled) return
      moved = true; clearWatch()
      if (gapMs > 0 && started && i < words.length) {
        gapTimer = setTimeout(() => { gapTimer = null; next() }, gapMs)
      } else next()
    }
    const speakBrowser = () => {
      if (moved || cancelled) return
      const u = new SpeechSynthesisUtterance(txt)
      u.rate = rate; u.pitch = pitch; u.volume = 1; u.lang = 'en-US'
      const v = _pickVoice(); if (v) u.voice = v
      u.onstart = () => {
        started = true; _setSpeaking(true); try { onWord?.(idx) } catch {}
        // It started — guard against an end event that never arrives.
        clearWatch(); watch = setTimeout(advance, Math.max(5000, txt.length * 140))
      }
      u.onend   = advance
      u.onerror = advance
      try { window.speechSynthesis.speak(u) } catch { advance(); return }
      // If speech never even STARTS (iOS/Safari can silently drop speak() with no
      // onstart/onend/onerror), advance anyway so the lesson can never hang on a
      // frozen, silent slide. This is the safety net for older speakSeq-only steps.
      watch = setTimeout(() => { if (!started) advance() }, 2200)
    }
    // Try a pre-rendered clip first; ANY miss runs the browser path above unchanged.
    speakLine(txt, {
      onStart: () => {
        started = true; _setSpeaking(true); try { onWord?.(idx) } catch {}
        // A clip has a real duration, but guard a stuck element the same way.
        clearWatch(); watch = setTimeout(advance, Math.max(8000, txt.length * 160))
      },
      onDone: advance,
      fallback: speakBrowser,
    })
  }
  _activeSeqCancel = cancel
  try { window.speechSynthesis.cancel() } catch {}
  _speakTimer = setTimeout(() => { _speakTimer = null; if (!cancelled) next() }, 120)
  return cancel
}

/**
 * speakSeq + a "did speech actually start?" fallback — the right way to narrate a multi-line
 * demo/explanation.
 *
 * `lines` play strictly one-after-another (speakSeq, so they can NEVER overlap or clip each
 * other — a fixed-timer speak() clips a slow/long line). `onStep(i)` reveals the visual for
 * line i: driven by the real speech `onstart` when audio works (so visuals stay in sync), OR
 * by fixed timers if speech never starts within ~1.9s (blocked autoplay / no voices) so the
 * demo still plays its visuals silently. `onDone` fires exactly once, after the last line (or
 * the silent fallback) finishes. Returns a cancel fn (call it from the effect cleanup).
 */
export function speakSteps(
  lines: string[],
  opts: { onStep?: (i: number) => void; onDone?: () => void; fallbackStepMs?: number; rate?: number; pitch?: number; gapMs?: number } = {},
): () => void {
  const { onStep, onDone, fallbackStepMs = 1400, rate, pitch, gapMs } = opts
  let started = false, doneOnce = false
  const timers: Array<ReturnType<typeof setTimeout>> = []
  const finish = () => { if (doneOnce) return; doneOnce = true; onDone?.() }
  const cancelSeq = speakSeq(lines, {
    onWord: (i) => { started = true; try { onStep?.(i) } catch {} },
    // CRITICAL: only finish via speakSeq if speech ACTUALLY started. When audio is blocked, each
    // utterance fires onerror (not onstart); speakSeq advances on onerror, so it races through every
    // line in milliseconds and its onDone fires almost instantly — flashing the explanation past with
    // no voice. Gating on `started` makes that blocked/raced case fall through to the deliberate
    // timer-fallback below instead (which paces the reveals + finishes), so a silent demo plays at a
    // watchable speed rather than vanishing. A truly spoken run sets `started` and finishes normally.
    onDone: () => { if (started) finish() },
    rate, pitch, gapMs,
  })
  // The fallback exists ONLY for the silent case (blocked autoplay / no voices). It must not
  // pre-empt a real voice that's just slow to start, so:
  //  - the grace window is generous (a real first utterance can take >2s to start right after
  //    the tap that unlocks audio), and
  //  - EVERY fallback step (and the early finish) bails the instant real speech starts, so a
  //    late-arriving voice takes over cleanly instead of the two racing each other.
  // It also steps slowly so a genuinely silent demo is watchable, not a flash. `started` flips
  // on the FIRST utterance's onstart, so a single redundant onStep(0) is the worst overlap.
  const fb = setTimeout(() => {
    if (started) return
    let t = 0
    lines.forEach((_, i) => {
      timers.push(setTimeout(() => { if (started) return; try { onStep?.(i) } catch {} }, t))
      t += fallbackStepMs
    })
    timers.push(setTimeout(() => { if (started) return; finish() }, t + 600))
  }, 2800)
  return () => { cancelSeq(); clearTimeout(fb); timers.forEach(clearTimeout) }
}

/** A word token in a passage, with its character range in the original text
 *  (so a speech `onboundary` charIndex can be mapped back to the word). */
export interface SpokenWord { word: string; start: number; end: number }

/** Split a passage into word tokens with their char offsets. Both the renderer
 *  (to draw one span per word) and the speaker (to map boundaries) use this, so
 *  the indices always line up. */
export function splitWords(text: string): SpokenWord[] {
  const out: SpokenWord[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) out.push({ word: m[0], start: m.index, end: m.index + m[0].length })
  return out
}

function _wordDur(word: string, rate: number): number {
  // Rough per-word speaking time, length-weighted, with a little extra after a
  // clause/sentence break — used only when the browser gives no word boundaries.
  let ms = Math.max(230, word.length * 62) / rate
  if (/[,.;:!?—-]$/.test(word)) ms += 190 / rate
  return ms
}

/**
 * Speak one passage AND drive a word-by-word "read-along" highlight. `onWord(i)`
 * fires with the index (into splitWords(text)) of the word currently being spoken,
 * and -1 when it finishes (clear the highlight). Uses the utterance's `onboundary`
 * events for exact sync where the browser fires them (Chrome); where it doesn't
 * (Safari) — or when audio is blocked — it falls back to an even, length-weighted
 * timed sweep that still tracks along and finishes with the audio. Returns a cancel
 * fn (call from effect cleanup). Registers as the active speech so a later speak()
 * or stopSpeech() supersedes it cleanly.
 */
export function speakWithHighlight(
  text: string,
  opts: { onWord?: (i: number) => void; onDone?: () => void; rate?: number; pitch?: number } = {},
): () => void {
  const { onWord, onDone, rate = 0.84, pitch = 1.05 } = opts
  const tokens = splitWords(text)
  const emit = (i: number) => { try { onWord?.(i) } catch {} }

  // Supersede any previous sequence/utterance cleanly.
  if (_activeSeqCancel) { const c = _activeSeqCancel; _activeSeqCancel = null; c() }
  if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null }

  let mode: 'pending' | 'boundary' | 'timed' = 'pending'
  let started = false
  let done = false
  let lastIdx = -1
  const timers: Array<ReturnType<typeof setTimeout>> = []
  let grace: ReturnType<typeof setTimeout> | null = null
  let watch: ReturnType<typeof setTimeout> | null = null
  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0 }
  const step = (i: number) => { if (i > lastIdx) { lastIdx = i; emit(i) } }  // forward-only

  let cancelClip: (() => void) | null = null
  const cancel = () => {
    if (done) return
    done = true
    if (_activeSeqCancel === cancel) _activeSeqCancel = null
    clearTimers()
    if (grace) { clearTimeout(grace); grace = null }
    if (watch) { clearTimeout(watch); watch = null }
    if (cancelClip) { cancelClip(); cancelClip = null }
    try { window.speechSynthesis.cancel() } catch {}
    _setSpeaking(false)
  }
  const finish = () => {
    if (done) return
    cancel()
    emit(-1)
    onDone?.()
  }

  // A pre-rendered clip drives the highlight off its REAL duration — strictly better
  // sync than the timed sweep below, which has nothing to pace against when the speech
  // engine fires no boundary events. Any miss runs the original path unchanged.
  let usedClip = false
  cancelClip = speakLine(text, {
    words: tokens.length,
    onStart: () => { usedClip = true; started = true; mode = 'boundary'; _setSpeaking(true) },
    onWord: step,
    onDone: finish,
    fallback: () => { if (!usedClip) startBrowser() },
  })
  return cancel

  function startBrowser() {

  // Timed sweep — highlights the remaining words on estimated timers. Used when no
  // boundaries arrive at all (Safari/blocked) AND as a recovery when the browser
  // fires some boundaries then stalls (Chrome does this mid-sentence). `autoFinish`
  // closes it out for the silent case where onend won't come.
  const startTimed = (from: number, autoFinish: boolean) => {
    if (mode === 'timed') return
    mode = 'timed'
    if (watch) { clearTimeout(watch); watch = null }
    clearTimers()
    // Silent case (autoFinish): no voice to pace against, so _wordDur (tuned to match
    // real speech) reads as words flicking by. Slow it to a readable pace. The Safari
    // recovery case (autoFinish false — voice IS speaking) keeps real-speech pacing so
    // the highlight stays in sync.
    const slow = autoFinish ? 2.1 : 1
    let t = 0
    for (let i = Math.max(from, lastIdx + 1); i < tokens.length; i++) {
      const at = t
      timers.push(setTimeout(() => { if (!done) step(i) }, at))
      t += _wordDur(tokens[i].word, rate) * slow
    }
    if (autoFinish) timers.push(setTimeout(finish, t + 400))
  }

  // Re-arm after each boundary: if the next one doesn't arrive in time (Chrome
  // stalls, especially on long passages), fall through to the timed sweep so the
  // highlight never freezes while Milo keeps talking.
  const armWatch = (ms: number) => {
    if (watch) clearTimeout(watch)
    watch = setTimeout(() => { if (!done && mode !== 'timed') startTimed(lastIdx + 1, false) }, ms)
  }

  _activeSeqCancel = cancel

  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !tokens.length) {
    // No speech engine → still sweep the highlight so the read-along works.
    if (tokens.length) startTimed(0, true); else finish()
    return cancel
  }

  try { window.speechSynthesis.cancel() } catch {}
  _speakTimer = setTimeout(() => {
    _speakTimer = null
    if (done) return
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate; u.pitch = pitch; u.volume = 1; u.lang = 'en-US'
    const v = _pickVoice(); if (v) u.voice = v

    u.onboundary = (e: SpeechSynthesisEvent) => {
      if (done || mode === 'timed') return
      if (e.name && e.name !== 'word') return
      mode = 'boundary'
      const ci = e.charIndex ?? 0
      let idx = tokens.findIndex((t) => ci >= t.start && ci < t.end)
      if (idx < 0) idx = tokens.findIndex((t) => t.start >= ci)
      if (idx >= 0) step(idx)
      armWatch(1400)   // if the next boundary stalls, hand off to the timed sweep
    }
    u.onstart = () => {
      started = true; _setBlocked(false); _setSpeaking(true)
      if (_keepalive) clearInterval(_keepalive)
      _keepalive = setInterval(() => { try { if (window.speechSynthesis.paused) window.speechSynthesis.resume() } catch {} }, 5000)
      step(0)
      // Give real word boundaries a moment; if none arrive, sweep on a timer.
      armWatch(900)
    }
    u.onend = finish
    u.onerror = (e) => {
      if (e.error === 'not-allowed') _setBlocked(true)
      // If it never started (blocked autoplay / no voice), let the grace timer run
      // the silent sweep; otherwise this is a normal end/cancel → finish.
      if (started) finish()
    }
    try { window.speechSynthesis.speak(u) } catch { startTimed(0, true) }
  }, 110)

  // If speech never STARTS (blocked autoplay / Safari drop), sweep silently so the
  // read-along still tracks and completes.
  grace = setTimeout(() => { if (!done && !started) startTimed(0, true) }, 1700)
  }
}

export function useIsSpeaking(): boolean {
  return useSyncExternalStore(
    (cb) => { _subs.add(cb); return () => _subs.delete(cb) },
    () => _speaking,
    () => false,
  )
}

export function useMiloSpeaker(opts?: { rate?: number; pitch?: number }) {
  const rate  = opts?.rate  ?? 0.88
  const pitch = opts?.pitch ?? 1.05

  const speakFn = useCallback((text: string) => {
    speak(text, rate, pitch)
  }, [rate, pitch])

  const stop = useCallback(() => stopSpeech(), [])

  return { speak: speakFn, stop }
}