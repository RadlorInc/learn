/**
 * What the public surfaces PROMISE — founder's decision N21, 2026-09-26, and the KG flip of 2026-09-28.
 *
 * `/play` says games are "coming soon" and spends no points; teachers adding students is paused until a
 * school-consent route exists. So the titles, descriptions, share card, JSON-LD, manifest, llms.txt, /help and /auth
 * must not sell game time or class rosters. Flip this gate in the SAME change that ships either of them.
 *
 * ⚠️ THE GRADES FLIPPED ON 2026-09-28 (founder): KG, Grade 1 and Grade 2 are live (#305), so every surface says
 * "grades K–8" (short places) or "kindergarten through grade 8" (prose), and none still says the old "3 to 8" —
 * N21's "grades 3 to 8, never KG" is what this gate enforced until then. radlor.com's own gate
 * (`check-site-claims.mjs`) and `smoke:live` flipped in the same change.
 * The instrument for /auth's Spanish reads exactly the literal keys /auth passes to `t()` (plus /auth's own source).
 * NOT covered: keys /auth reaches through `errorWording()` rather than a literal.
 *
 * ⚠️ The forbidden phrases and the required phrase are written out here by hand, not read from the code —
 * a gate that derived them from the files would pass through any rewording. llms.txt is checked on what
 * `GET()` actually returns; the rest are read as source because the root layout cannot be imported under
 * vitest (`next/font` at module scope) and `AppJsonLd` is not exported.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GET as llms } from '@/app/llms.txt/route'
import { ES } from '@/features/dashboard/i18n'

const src = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

// Marketing surfaces: every claim rule applies.
const MARKETING = [
  'src/app/layout.tsx',            // <title>, description, OpenGraph, Twitter
  'src/app/page.tsx',              // SoftwareApplication JSON-LD
  'src/app/opengraph-image.tsx',   // the share card and its alt
  'public/manifest.json',
  'src/app/help/page.tsx',         // FAQ + its FAQPage JSON-LD
]
// Adult sign-in screen + its Spanish strings: only the grade claim (they legitimately mention teachers).
const AUTH = 'src/app/auth/page.tsx'
// Every literal key /auth asks `t()` for — a single-quoted literal cannot contain an unescaped quote, so the class is its
// real boundary — and the Spanish the screen shows for it.
const authKeys = () => [...src(AUTH).matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)].map(m => m[1])
const authSpanish = (): [string, string] => [`${AUTH} in Spanish`, authKeys().map(k => ES[k] ?? '').join('\n')]

// The grades, both ways. OLD catches every form the 3-to-8 claim took ("grades 3 to 8", "from 3 to 8", the Spanish
// "de 3.º a 8.º grado"); a breakdown that must name the lesson grades says "grade 3 through grade 8" (llms.txt).
const K8 = /\bK–8\b|kindergarten through grade 8/i
const OLD_RANGE = /\b3 to 8\b|3\.º a 8\.º/i
const GAME_TIME = /game[ -]?time|minutes of (a |the )?(building )?game|spend (them|points|it) on (game|minutes)/i
// One sentence (`[^.]*` cannot cross a full stop): a teacher doing something with classes/students, or any roster.
const ROSTER = /\bteachers?\b[^.]*\b(class(es)?|students?)\b|\brosters?\b/i

async function surfaces(): Promise<[string, string][]> {
  const text = await (llms() as Response).text()
  return [...MARKETING.map(p => [p, src(p)] as [string, string]), ['GET /llms.txt', text]]
}

describe('public claims match what ships (N21)', () => {
  it('positive control: the scan reads the real text, and each surface says grades K–8', async () => {
    for (const [name, text] of await surfaces()) {
      expect(text.length, `${name} read as empty`).toBeGreaterThan(200)
      expect(text, `${name} does not state the grades as K–8`).toMatch(K8)
    }
    expect(src(AUTH)).toMatch(/grades K–8/)
    // …and the Spanish half reads the screen's real strings: the keys it asks for, translated.
    expect(authKeys().length, 'no t() key read out of /auth').toBeGreaterThan(30)
    expect(authSpanish()[1]).toContain('Continuar con Google')
    expect(authSpanish()[1]).toContain('de kínder a 8.º grado')
  })

  it('no surface still claims the old 3-to-8 range', async () => {
    const all: [string, string][] = [...(await surfaces()), [AUTH, src(AUTH)], authSpanish()]
    for (const [name, text] of all) expect(text, `${name} still says 3 to 8`).not.toMatch(OLD_RANGE)
  })

  it('no marketing surface sells game time', async () => {
    for (const [name, text] of await surfaces()) expect(text, `${name} sells game time`).not.toMatch(GAME_TIME)
  })

  it('no marketing surface claims teacher classes / rosters', async () => {
    for (const [name, text] of await surfaces()) expect(text, `${name} claims teacher rosters`).not.toMatch(ROSTER)
  })
})
