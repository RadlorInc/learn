/**
 * Prints every consent string that has a Spanish version — English beside Spanish — as a markdown
 * sheet a Spanish reviewer can read without opening code. These are the strings a parent sees in the
 * consent notice, the B1/B3 emails and the withdraw/respond screens when their dashboard is in Spanish.
 *
 *   npx tsx scripts/consent-es-sheet.mts > consent-es-review.md
 *
 * Read-only: it prints; it changes nothing. The source of truth stays `src/features/consent/copy.ts`.
 */
import * as copy from '../src/features/consent/copy'

let n = 0, words = 0
const out: string[] = [`# Consent copy — English and Spanish (${copy.SPANISH_REVIEW})`, '']
function walk(v: unknown, path: string) {
  if (v && typeof v === 'object' && 'en' in v && 'es' in v) {
    const { en, es } = v as { en: string; es: string }
    n++; words += es.split(/\s+/).length
    out.push(`## ${path}`, '', `- **EN:** ${en}`, `- **ES:** ${es}`, '')
  } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`)
}
for (const name of ['NOTICE', 'B1', 'B2', 'B3', 'WITHDRAW', 'PROPOSED'] as const) walk(copy[name], name)
out.splice(1, 0, `${n} strings, ${words} Spanish words.`)
console.log(out.join('\n'))
