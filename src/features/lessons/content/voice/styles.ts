/**
 * The four render styles, named after the 2026-09-19 samples (/voice-samples.html) — docs/new-flow/voice.md says which
 * line gets which. The model settings behind each name live in scripts/chatterbox-render.py (STYLES).
 *   A   Chatterbox Turbo, the words as written                  — a line nobody has re-voiced yet (the default)
 *   B   original Chatterbox, exaggeration 0.5, cfg_weight 0.5   — the everyday teacher
 *   B+  original Chatterbox, exaggeration 0.7, cfg_weight 0.3   — the watch-out, a little more punch
 * No emotion tags: [happy] is not a Chatterbox command and may be read out loud (Chatterbox_Audio_Fix, 2026-09-22).
 */
import { G3M1_VOICE } from './g3m1'
import { G3M2_VOICE } from './g3m2'
import { G3M3_VOICE } from './g3m3'
import { G3M4_VOICE } from './g3m4'
import { G3M5_VOICE } from './g3m5'
import { G3M6_VOICE } from './g3m6'
import { G4M1_VOICE } from './g4m1'
import { G4M2_VOICE } from './g4m2'
import { G4M3_VOICE } from './g4m3'
import { G4M4_VOICE } from './g4m4'
import { G4M5_VOICE } from './g4m5'
import { G4M6_VOICE } from './g4m6'
import { G5M1_VOICE } from './g5m1'
import { G5M2_VOICE } from './g5m2'
import { G5M3_VOICE } from './g5m3'
import { G5M4_VOICE } from './g5m4'
import { G5M5_VOICE } from './g5m5'
import { G5M6_VOICE } from './g5m6'
import { G6M1_VOICE } from './g6m1'
import { G6M2_VOICE } from './g6m2'
import { G6M3_VOICE } from './g6m3'
import { G6M4_VOICE } from './g6m4'
import { G6M5_VOICE } from './g6m5'
import { G6M6_VOICE } from './g6m6'
import { G6M7_VOICE } from './g6m7'
import { G7M1_VOICE } from './g7m1'
import { G7M2_VOICE } from './g7m2'
import { G7M3_VOICE } from './g7m3'
import { G7M4_VOICE } from './g7m4'
import { G7M5_VOICE } from './g7m5'
import { G8M1_VOICE } from './g8m1'
import { G8M2_VOICE } from './g8m2'
import { G8M3_VOICE } from './g8m3'
import { G8M4_VOICE } from './g8m4'
import { G8M5_VOICE } from './g8m5'
import { G8M6_VOICE } from './g8m6'

export type VoiceStyle = 'A' | 'B' | 'B+'
export interface VoiceLine { style: VoiceStyle; say?: string }

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const NTH: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth',
  10: 'tenth', 11: 'eleventh', 12: 'twelfth', 13: 'thirteenth', 14: 'fourteenth', 15: 'fifteenth', 16: 'sixteenth', 18: 'eighteenth',
  20: 'twentieth', 24: 'twenty-fourth', 25: 'twenty-fifth', 50: 'fiftieth', 100: 'hundredth', 1000: 'thousandth' }
/** "3/4" → "three fourths"; null when it is not a fraction she can say that way (the line then needs its own `say`). */
const fraction = (n: number, d: number): string | null => {
  const nth = NTH[d], top = ONES[n] ?? (n <= 99 ? String(n) : null)
  if (!nth || top === null) return null
  return `${top} ${n === 1 ? nth : d === 2 ? 'halves' : nth + 's'}`
}
const UNITS: Record<string, string> = { mm: 'millimeters', cm: 'centimeters', m: 'meters', km: 'kilometers', mg: 'milligrams', g: 'grams',
  kg: 'kilograms', mL: 'milliliters', L: 'liters', ft: 'feet', yd: 'yards', mi: 'miles', lb: 'pounds', oz: 'ounces', 'sq ft': 'square feet',
  'sq in': 'square inches', 'sq cm': 'square centimeters', 'sq m': 'square meters' }

/**
 * Symbols a voice model reads badly, said the way she would say them (docs/new-flow/voice.md: math in the mouth is
 * words). What this cannot say safely it leaves alone, and `lessonVoiceSpeakable.test.ts` then names the line, so the
 * lesson gives it a `say` of its own — it never guesses.
 */
export const speakable = (t: string) =>
  t.replace(/(\d+) (\d+)\/(\d+)\b/g, (m, w, n, d) => { const f = fraction(+n, +d); return f ? `${w} and ${f}` : m })
    .replace(/(^|[^\d/])(\d+)\/(\d+)(?![\d/])/g, (m, pre, n, d) => { const f = fraction(+n, +d); return f ? pre + f : m })
    .replace(/(\d) (sq ft|sq in|sq cm|sq m|mm|cm|km|mg|kg|mL|ft|yd|mi|lb|oz|m|g|L)\b(?!\w)/g, (_, d, u) => `${d} ${UNITS[u]}`)
    .replace(/\b(\d{1,2}):00\b/g, "$1 o'clock").replace(/\b(\d{1,2}):0(\d)\b/g, '$1 oh $2').replace(/\b(\d{1,2}):(\d\d)\b/g, '$1 $2')
    .replace(/(\d)²/g, '$1 squared').replace(/(\d)³/g, '$1 cubed').replace(/([a-z])²/g, '$1 squared').replace(/([a-z])³/g, '$1 cubed')
    .replace(/(\d+(?:\.\d+)?)%/g, '$1 percent').replace(/(\d+)° (angle|turn)/g, '$1-degree $2').replace(/(\d+)°/g, '$1 degrees')
    .replace(/\$(\d+(?:,\d{3})*)\.(\d\d)\b/g, (_, d, c) => `${d} ${d === '1' ? 'dollar' : 'dollars'} and ${c} ${c === '01' ? 'cent' : 'cents'}`)
    .replace(/\$(\d+(?:,\d{3})*)\b/g, (_, d) => `${d} ${d === '1' ? 'dollar' : 'dollars'}`)
    .replace(/(^|[\s(])[−-](\d)/g, '$1negative $2')
    .replace(/ × /g, ' times ').replace(/ · /g, ' times ').replace(/ ÷ /g, ' divided by ').replace(/ \+ /g, ' plus ').replace(/ [−–] /g, ' minus ')
    .replace(/ = \?/g, ' equals what?').replace(/ = /g, ' equals ').replace(/ ≈ /g, ' is about ')
    .replace(/ < /g, ' is less than ').replace(/ > /g, ' is greater than ').replace(/ ≤ /g, ' is less than or equal to ').replace(/ ≥ /g, ' is greater than or equal to ')
    .replace(/(\d) : (\d)/g, '$1 to $2')   // a ratio, 3 : 2 — before the prose colon below turns it into "3, 2"
    .replace(/["“”]/g, '').replace(/([^\d]):\s/g, '$1, ').replace(/;\s/g, ', ')
    .replace(/✕s\b/g, 'Xs').replace(/✕/g, 'X')
    .replace(/\b[A-Z]{2,}\b/g, w => (w === 'AM' || w === 'PM' ? w : w.toLowerCase()))   // Chatterbox SPELLS a word in caps: ADD -> A-D-D
    .replace(/π/g, 'pi').replace(/√(\d+)/g, 'the square root of $1')

/** What the voice model may be given, and nothing else: words, digits, and the punctuation that is the performance. */
export const SPEAKABLE = /^[A-Za-z0-9 ,.?!'’—-]*$/

const ALL: Record<string, VoiceLine> = {
  ...G3M1_VOICE, ...G3M2_VOICE, ...G3M3_VOICE, ...G3M4_VOICE, ...G3M5_VOICE, ...G3M6_VOICE, ...G4M1_VOICE, ...G4M2_VOICE, ...G4M3_VOICE, ...G4M4_VOICE, ...G4M5_VOICE, ...G4M6_VOICE, ...G5M1_VOICE, ...G5M2_VOICE, ...G5M3_VOICE, ...G5M4_VOICE, ...G5M5_VOICE, ...G5M6_VOICE, ...G6M1_VOICE, ...G6M2_VOICE, ...G6M3_VOICE, ...G6M4_VOICE, ...G6M5_VOICE, ...G6M6_VOICE, ...G6M7_VOICE, ...G7M1_VOICE, ...G7M2_VOICE, ...G7M3_VOICE, ...G7M4_VOICE, ...G7M5_VOICE, ...G8M1_VOICE, ...G8M2_VOICE, ...G8M3_VOICE, ...G8M4_VOICE, ...G8M5_VOICE, ...G8M6_VOICE,
}

/** What the voice model is given for a line the lesson says. */
export function renderOf(text: string): { style: VoiceStyle; say: string } {
  const v = ALL[text]
  return { style: v?.style ?? 'A', say: speakable(v?.say ?? text) }
}

/** Every line with a render row — the gate checks each is still a line some lesson says. */
export const VOICED_LINES = Object.keys(ALL)
