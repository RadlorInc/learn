'use client'
/**
 * Which voice Milo speaks in — a per-DEVICE setting, not per-learner.
 *
 * Device-scoped on purpose: it's an output preference like volume, and a family
 * sharing a tablet wants one answer, not one per child. `'device'` means fall back
 * to the browser's own speech synthesis (the pre-clip behaviour), which is also what
 * every band without recorded clips uses.
 */
import { kv } from '@/infra/storage/kv'

const KEY = 'milo-voice'

/** Voices we hold rendered clips for. Add a row when a new voice is generated. */
export const VOICES = [
  { id: 'IvUJKFyjVb5hItY9dJAT', label: 'Stevie', hint: 'Warm and expressive' },
  { id: 'XjGYkUkzth8BPs29fmcV', label: 'Teddy', hint: 'Little and playful' },
] as const

/**
 * A band that always hears ITS voice, whatever the device picked — 3–5 is Teddy (founder's call,
 * 2026-09-03). The one thing it never overrides is an explicit 'device', which means "no clips".
 * Add a row when a band gets its own corpus; a band with no row hears the device pick.
 */
export const BAND_VOICE: Partial<Record<string, string>> = { '3-5': 'XjGYkUkzth8BPs29fmcV' }

/**
 * Lessons already re-voiced in Stevie with the expressive render (docs/new-flow/voice.md). Founder, 2026-09-19: every
 * lesson moves to Stevie; a lesson joins this list once its Stevie clips are merged, never before, or it plays
 * browser speech. Started with the pilot, g5m1-t1 and t2.
 */
const STEVIE_NOW = new Set(['g5m1-t1', 'g5m1-t2'])

/**
 * A new-flow lesson's voice: Stevie for Grades 6–8 and for STEVIE_NOW, Teddy for the rest of Grades 3–5. The SAME split
 * scripts/lesson-voice-corpus.mts cuts the render corpus on — change one, change both, or the lesson asks a
 * voice for clips that were rendered in the other.
 */
export const lessonVoice = (lessonId: string): string =>
  Number(lessonId.match(/^g(\d)/)?.[1] ?? 3) <= 5 && !STEVIE_NOW.has(lessonId) ? 'XjGYkUkzth8BPs29fmcV' : 'IvUJKFyjVb5hItY9dJAT'

export type VoiceId = (typeof VOICES)[number]['id'] | 'device'

export function getVoicePref(): VoiceId {
  try {
    const raw = kv.get(KEY)
    if (raw && (raw === 'device' || VOICES.some((v) => v.id === raw))) return raw as VoiceId
  } catch {}
  return VOICES[0]?.id ?? 'device'
}

export function setVoicePref(v: VoiceId): void {
  try { kv.set(KEY, v) } catch {}
  try { window.dispatchEvent(new CustomEvent('milo-voice-change', { detail: v })) } catch {}
}
