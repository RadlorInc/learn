/**
 * Structural windows for source gates.
 *
 * ⚠️⚠️ THESE EXIST BECAUSE A CHARACTER BUDGET IS NOT A BOUNDARY. `src.slice(at, at + 700)` and
 * `[\s\S]{0,700}?` are the same fault: a byte count standing in for "this statement" or "this
 * element". Any edit that adds bytes before the target moves it outside the window, after which the
 * gate reports confidently about text it never saw — passing when the rule is broken, or failing on
 * code that is correct. It happened three times in one session (2026-08-24/25): a policy window ran
 * into the NEXT policy, a 700-char slice lost its call when a prop was added above it, and a window
 * stopped at the first `) : (` which was inside the very ternary it was checking.
 *
 * Match on structure instead. These are deliberately small and dumb — no parser, no dependency.
 */

/**
 * From the first `open` at or after `from`, through its MATCHING `close`, inclusive.
 * Returns '' when there is no balanced pair (a caller asserting on '' fails, which is what you
 * want — a gate that cannot find its target must not quietly pass).
 *
 * ⚠️ Delimiter-counting only: it does not know about strings, comments or regex literals. That is
 * fine for the JS/TSX shapes these gates read (a handler body, a JSX expression container) and is
 * why `strip()` below usually runs first.
 */
export function balanced(src: string, from: number, open = '{', close = '}'): string {
  const start = src.indexOf(open, from)
  if (start < 0) return ''
  let depth = 0
  for (let i = start; i < src.length; i++) {
    if (src[i] === open) depth++
    else if (src[i] === close && --depth === 0) return src.slice(start, i + 1)
  }
  return ''
}

/** The whole `<Tag … />` or `<Tag …>` opening element beginning at/after `from`, attributes included. */
export function element(src: string, from: number): string {
  const start = src.indexOf('<', from)
  if (start < 0) return ''
  let depth = 0
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') depth--
    else if (src[i] === '>' && depth === 0) return src.slice(start, i + 1)
  }
  return ''
}

/** Comments removed, so a gate cannot match the prose that explains the rule it enforces. */
export const strip = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
