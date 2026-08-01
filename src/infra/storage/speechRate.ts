'use client'
/**
 * How fast Milo talks — a per-DEVICE setting, like volume (mirrors voicePref.ts).
 *
 * Device-scoped on purpose: a kid who needs it slower needs it slower in EVERY
 * chapter, and re-picking it per unit is exactly the friction that made a tester
 * ask for the control in the first place.
 *
 * The value is a MULTIPLIER on whatever rate a surface already uses, so a caller
 * keeps its own tuned base (the walkthrough narrates at 0.8) and this only scales it.
 */
import { kv } from '@/infra/storage/kv'
import { setClipRate } from '@/infra/voiceClipPlayer'

const KEY = 'milo-speech-rate'

/** Normal first, so the default tap is "slower" — the direction people ask for. */
export const RATES = [
  { mult: 1, label: 'Normal' },
  { mult: 0.75, label: 'Slower' },
  { mult: 1.25, label: 'Faster' },
] as const

export function getSpeechRate(): number {
  let n = 1
  try {
    const raw = Number(kv.get(KEY))
    if (RATES.some((r) => r.mult === raw)) n = raw
  } catch {}
  // The clip player is a module singleton with no React lifecycle of its own, so a
  // read is the moment to hand it the stored choice — otherwise a returning learner
  // gets their saved speed on the TTS path and full speed on the recorded one.
  setClipRate(n)
  return n
}

export function setSpeechRate(mult: number): void {
  try { kv.set(KEY, String(mult)) } catch {}
  setClipRate(mult)
}

/** Next rate in the cycle — Normal → Slower → Faster → Normal. */
export function nextSpeechRate(cur: number): number {
  const i = RATES.findIndex((r) => r.mult === cur)
  return RATES[(i + 1) % RATES.length]!.mult
}

export function speechRateLabel(mult: number): string {
  return RATES.find((r) => r.mult === mult)?.label ?? 'Normal'
}
