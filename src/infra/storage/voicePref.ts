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
