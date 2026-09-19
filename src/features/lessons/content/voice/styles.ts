/**
 * The four render styles, named after the 2026-09-19 samples (/voice-samples.html) — docs/new-flow/voice.md says which
 * line gets which. The model settings behind each name live in scripts/chatterbox-render.py (STYLES).
 *   A   Chatterbox Turbo, the words as written          — plain explanation (the default)
 *   A+  Turbo with an emotion tag at the front ([happy]) — a reveal, a trick, a win
 *   B   original Chatterbox, expressiveness 0.8          — a warning, a building pattern
 *   B+  B with a sound tag ([sigh]) and — pauses        — a line with a turn in it ("… — but this time, to the right")
 */
import { G5M1_VOICE } from './g5m1'

export type VoiceStyle = 'A' | 'A+' | 'B' | 'B+'
export interface VoiceLine { style: VoiceStyle; say?: string }

/** Symbols a voice model reads badly, said the way she would say them. */
export const speakable = (t: string) =>
  t.replace(/ × /g, ' times ').replace(/ ÷ /g, ' divided by ').replace(/ = \?/g, ' equals what?').replace(/ = /g, ' equals ')
    .replace(/\b1\/10\b/g, 'one tenth')

const ALL: Record<string, VoiceLine> = { ...G5M1_VOICE }

/** What the voice model is given for a line the lesson says. */
export function renderOf(text: string): { style: VoiceStyle; say: string } {
  const v = ALL[text]
  return { style: v?.style ?? 'A', say: v?.say ?? speakable(text) }
}

/** Every line with a render row — the gate checks each is still a line some lesson says. */
export const VOICED_LINES = Object.keys(ALL)
