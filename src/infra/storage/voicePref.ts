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
] as const

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
