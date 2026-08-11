/**
 * Number formatting that has to look the same everywhere.
 *
 * `disp` existed as four identical copies. It is here because the character matters: a
 * negative is shown with a real MINUS SIGN (U+2212 −), not a hyphen-minus, which renders
 * short and sits at the wrong height beside digits. This repo has already shipped glyph
 * drift once — U+2212 reached a SPOKEN string, where a screen reader says nothing for it.
 * Keep this for what is DISPLAYED; spoken strings want the word (see `signed`).
 */
export const disp = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `${n}`)

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }
/** A power as real superscript digits — `pow(3, 4)` → `3⁴`. Same reason as `disp`: the
 *  glyph matters, and `3^4` reads as a caret to a child. */
export const pow = (base: number | string, exp: number) =>
  `${base}${String(exp).split('').map(c => SUP[c] ?? c).join('')}`
