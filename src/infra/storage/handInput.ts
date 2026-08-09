'use client'
/**
 * How this device answers an AR chapter — with the camera, or with taps.
 *
 * Device-scoped on purpose, exactly like `voicePref`: it is an INPUT setting like the voice is an
 * output one, and a family sharing a tablet wants one answer rather than one per child. It is also
 * the thing a parent decides once — "no, not the camera" is a household answer, not a per-learner one.
 *
 * ⚠️ `null` means NOT YET ASKED, and that is a third state rather than a default. A chapter offers
 * both on its intro card the first time and remembers the pick; it must never quietly turn a camera
 * on because nobody has said no yet.
 */
import { kv } from '@/infra/storage/kv'

const KEY = 'milo-hand-input'

export type HandInput = 'hand' | 'tap'

/** The stored pick, or `null` if this device has never been asked. */
export function getHandInput(): HandInput | null {
  try {
    const raw = kv.get(KEY)
    if (raw === 'hand' || raw === 'tap') return raw
  } catch {}
  return null
}

export function setHandInput(v: HandInput): void {
  try { kv.set(KEY, v) } catch {}
}
