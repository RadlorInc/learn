/**
 * The chalkboard (founder's call, 2026-09-19, after the Pythagoras chalk-talk demo): a teaching screen draws
 * WHAT SHE SAYS, piece by piece, each piece at the word that names it. A screen's `chalk` is a list of marks; each
 * mark belongs to one beat and goes up when that beat reaches its `at` word. Marks of one beat go up one after
 * another (a mark never starts before the one above it in the list has finished), so a list reads as a hand at work.
 *
 * The board is always 600 × 400. Pure data and timing here; drawing is ./Chalkboard.tsx.
 */

export type ChalkColor = 'w' | 'y' | 'b' | 'r' | 'd'   // white, yellow, blue, coral, dim
export const CHALK: Record<ChalkColor, string> = { w: '#F0EBDA', y: '#F2CE6B', b: '#8AC0DB', r: '#E88E74', d: '#A9A897' }

export interface ChalkMark {
  beat: number
  /** A word of that beat's `say`: the mark goes up as she says it. None = at the start of the line. */
  at?: string
  d?: string            // a chalk line (SVG path), traced
  t?: string            // chalk writing, written letter by letter, centred on x, y
  x?: number; y?: number; s?: number
  wash?: boolean        // `d` filled with a thin wash of colour instead of traced
  c?: ChalkColor
  w?: number            // line width (default 3.4)
  /** Does not hold the hand: the next mark starts a moment later instead of waiting for this one (a clock's numbers). */
  quick?: boolean
}

/** How long a line takes to say. The same estimate paces the silent-mode beat clock, so the chalk matches either way. */
export const beatMs = (say: string) => Math.min(6500, 1500 + say.length * 55)

const norm = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')

/** When, in ms into the line, `at` is said: its place among the words times the line's length. -1 = not in the line. */
export function wordMs(say: string, at?: string): number {
  if (!at) return 0
  const words = say.split(/\s+/).map(norm)
  const i = words.indexOf(norm(at))
  return i < 0 ? -1 : Math.round((i / words.length) * beatMs(say))
}

// ── Drawing helpers for authors ─────────────────────────────────────────────────────────────────
type Pt = [number, number]
type At = [beat: number, at?: string]
const P = (pts: Pt[]) => `M${pts.map(p => p.join(' ')).join(' L')}`

export const line = ([beat, at]: At, pts: Pt[], c: ChalkColor = 'w', w?: number): ChalkMark => ({ beat, at, d: P(pts), c, w })
export const write = ([beat, at]: At, t: string, x: number, y: number, s = 30, c: ChalkColor = 'w'): ChalkMark => ({ beat, at, t, x, y, s, c })
export const box = ([beat, at]: At, x: number, y: number, w: number, h: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, d: `M${x} ${y} h${w} v${h} h${-w} Z`, c })
export const wash = ([beat, at]: At, x: number, y: number, w: number, h: number, c: ChalkColor): ChalkMark =>
  ({ beat, at, d: `M${x} ${y} h${w} v${h} h${-w} Z`, c, wash: true })
/** A bar cut into `n` equal cells, drawn as one stroke: the outline, then each cut. */
export const cells = ([beat, at]: At, x: number, y: number, w: number, h: number, n: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${x} ${y} h${w} v${h} h${-w} Z` + Array.from({ length: n - 1 }, (_, i) => ` M${x + (w * (i + 1)) / n} ${y} v${h}`).join('') })
export const arrow = ([beat, at]: At, from: Pt, to: Pt, c: ChalkColor = 'w'): ChalkMark => {
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]), k = 14
  const side = (s: number): Pt => [to[0] - k * Math.cos(a + s), to[1] - k * Math.sin(a + s)]
  return { beat, at, c, d: `${P([from, to])} M${side(0.5).join(' ')} L${to.join(' ')} L${side(-0.5).join(' ')}` }
}
/** A double-headed measuring arrow with end stops. */
export const span = ([beat, at]: At, x1: number, x2: number, y: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${x1} ${y - 10} v20 M${x2} ${y - 10} v20 M${x1} ${y} H${x2} M${x1 + 12} ${y - 8} L${x1} ${y} L${x1 + 12} ${y + 8} M${x2 - 12} ${y - 8} L${x2} ${y} L${x2 - 12} ${y + 8}` })
/** A hop over a number line, from x1 to x2. */
export const hop = ([beat, at]: At, x1: number, x2: number, y: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${x1} ${y} Q${(x1 + x2) / 2} ${y - Math.abs(x2 - x1) * 0.6} ${x2} ${y} M${x2 - 9} ${y - 10} L${x2} ${y} L${x2 + 3} ${y - 12}` })
export const cross = ([beat, at]: At, x: number, y: number, w: number, h: number, c: ChalkColor = 'r'): ChalkMark =>
  ({ beat, at, c, w: 4.5, d: `M${x} ${y} L${x + w} ${y + h} M${x + w} ${y} L${x} ${y + h}` })
export const ring = ([beat, at]: At, x: number, y: number, rx: number, ry: number, c: ChalkColor = 'y'): ChalkMark =>
  ({ beat, at, c, d: `M${x - rx} ${y} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0` })
/** A stick person standing with feet at (x, y). `stride` spreads the legs (a big step). */
export const person = ([beat, at]: At, x: number, y: number, h = 70, stride = 0.25, c: ChalkColor = 'w'): ChalkMark => {
  const r = h * 0.13, hip: Pt = [x, y - h * 0.42], neck: Pt = [x, y - h + r * 2], leg = h * 0.42
  return { beat, at, c, d: `M${x} ${y - h} a${r} ${r} 0 1 0 0.1 0 M${neck.join(' ')} L${hip.join(' ')}`
    + ` L${x - leg * stride * 2} ${y} M${hip.join(' ')} L${x + leg * stride * 2} ${y}`
    + ` M${x - h * 0.22} ${y - h * 0.62} L${neck[0]} ${neck[1] + h * 0.08} L${x + h * 0.22} ${y - h * 0.62}` }
}
export const clock = ([beat, at]: At, x: number, y: number, r = 24, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 M${x} ${y} v${-r * 0.7} M${x} ${y} h${r * 0.5}` })
/** Many small even ticks under a bar: "a lot of little units". */
export const ticks = ([beat, at]: At, x: number, y: number, w: number, n: number, h = 10, c: ChalkColor = 'b'): ChalkMark =>
  ({ beat, at, c, w: 2, d: `M${x} ${y} H${x + w}` + Array.from({ length: n + 1 }, (_, i) => ` M${x + (w * i) / n} ${y} v${h}`).join('') })

// ── Clocks ──────────────────────────────────────────────────────────────────────────────────────
/** The point at clock position `n` (0–12, fractions allowed) on a circle of radius r. */
export const onClock = (cx: number, cy: number, r: number, n: number): Pt => {
  const a = (n / 12) * 2 * Math.PI - Math.PI / 2
  return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))]
}
/** A clock face: the circle, then the numbers written round it (`only` limits which). */
export const clockFace = ([beat, at]: At, cx: number, cy: number, r: number, only?: number[], c: ChalkColor = 'w'): ChalkMark[] => [
  { beat, at, c, quick: true, d: `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 M${cx - 2} ${cy} h4` },
  ...(only ?? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).map(n => {
    const [x, y] = onClock(cx, cy, r * 0.8, n)
    return { beat, at, c, t: String(n), x, y, s: Math.round(r * 0.2), quick: true }
  }),
]
/** A hand from the centre to position `n`. */
export const hand = ([beat, at]: At, cx: number, cy: number, n: number, len: number, c: ChalkColor = 'w', w = 5): ChalkMark =>
  ({ beat, at, c, w, d: P([[cx, cy], onClock(cx, cy, len, n)]) })
/** A hop just outside the face from position `from` to `to` (counting round the clock). */
export const clockHop = ([beat, at]: At, cx: number, cy: number, r: number, from: number, to: number, c: ChalkColor = 'y'): ChalkMark => {
  const [x1, y1] = onClock(cx, cy, r, from), [x2, y2] = onClock(cx, cy, r, to)
  return { beat, at, c, d: `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}` }
}

/**
 * Puts a module's chalk (one file per topic, `content/chalk/<module>/`) onto its screens: `by[topicId][screenIndex]`.
 * Throws on a topic or screen that does not exist — a board written for a screen that moved must not vanish quietly.
 */
export function attachChalk(lessons: { id: string; screens: { chalk?: ChalkMark[]; beats?: unknown[] }[] }[], by: Record<string, (ChalkMark[] | undefined)[]>) {
  for (const [id, screens] of Object.entries(by)) {
    const l = lessons.find(x => x.id === id)
    if (!l) throw new Error(`chalk for ${id}: no such topic`)
    screens.forEach((c, i) => {
      if (!c) return
      if (!l.screens[i]?.beats) throw new Error(`chalk for ${id} screen ${i + 1}: no such teaching screen`)
      l.screens[i].chalk = c
    })
  }
}

/** Roughly how wide chalk writing is: the chalk face averages about half its size per letter. */
export const chalkWidth = (t: string, s: number) => [...t].length * s * 0.5
