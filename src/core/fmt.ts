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
