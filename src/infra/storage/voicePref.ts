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

/** Josh — ElevenLabs "Josh - Teacher for Kids", cloned into Chatterbox from scripts/chatterbox-ref/<id>.wav (2026-09-22). */
export const JOSH = 'nzFihrBIvB34imQBuxub'

/**
 * Modules rewritten to the founder's explanation documents and voiced in Josh (founder, 2026-09-22: every module moves,
 * one at a time). A module joins in the same PR that brings its Josh clips — its lines are queued for Kaggle from the
 * moment it is listed, and the PR is not merged until they are rendered, or it plays browser speech.
 */
export const JOSH_MODULES = new Set(['g5m1', 'g3m1', 'g3m2', 'g3m3', 'g3m4', 'g3m5', 'g3m6', 'g4m1', 'g4m3', 'g4m2', 'g4m4', 'g4m5', 'g4m6', 'g5m2', 'g5m3', 'g5m5', 'g5m4', 'g5m6', 'g6m1', 'g6m4', 'g6m2', 'g6m3', 'g6m6', 'g6m5', 'g6m7', 'g7m2', 'g7m1', 'g7m3', 'g8m3'])

/**
 * A new-flow lesson's voice: Josh for a JOSH_MODULES module, else Stevie for Grades 6–8 and Teddy for Grades 3–5. The SAME
 * function scripts/lesson-voice-corpus.mts cuts the render corpus on — the lesson asks exactly the voice its clips were
 * rendered in. Teddy's and Stevie's clips stay on disk, so moving a module back is one line.
 */
export const lessonVoice = (lessonId: string): string =>
  JOSH_MODULES.has(lessonId.split('-')[0]) ? JOSH
    : Number(lessonId.match(/^g(\d)/)?.[1] ?? 3) <= 5 ? 'XjGYkUkzth8BPs29fmcV' : 'IvUJKFyjVb5hItY9dJAT'

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
