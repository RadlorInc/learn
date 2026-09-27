/**
 * What the public surfaces PROMISE — founder's decision N21, 2026-09-26.
 *
 * Only grades 3–8 were live when N21 was decided; `/play` says games are "coming soon" and spends no points;
 * teachers adding students is paused until a school-consent route exists. So the titles, descriptions, share card,
 * JSON-LD, manifest, llms.txt, /help and /auth must say "grades 3 to 8" and must not sell KG, game time or class
 * rosters. Flip this gate in the SAME change that ships any of them.
 *
 * ⚠️ KG–2 (#233, rebuilt 2026-09-27) puts the KG story chapters INSIDE the app — the child's home and the parent's
 * dashboard label a grade "KG" ("Kínder" in Spanish, in the dashboard's dictionary, i18n.tsx). That is not a public
 * claim, so it does not flip this gate; whether the public surfaces start saying "KG to 8" is the founder's call.
 * What changed here is the instrument for /auth's Spanish: it used to read ALL of i18n.tsx — the whole dashboard's
 * dictionary — as a stand-in for the sign-in screen, and the dashboard's own "KG" label turned it red. It now reads
 * the Spanish of exactly the literal keys /auth passes to `t()` (plus /auth's own source, as before). NOT covered:
 * keys /auth reaches through `errorWording()` rather than a literal.
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

const KG = /\bKG\b|kindergarten|k[ií]nder/i
const GAME_TIME = /game[ -]?time|minutes of (a |the )?(building )?game|spend (them|points|it) on (game|minutes)/i
// One sentence (`[^.]*` cannot cross a full stop): a teacher doing something with classes/students, or any roster.
const ROSTER = /\bteachers?\b[^.]*\b(class(es)?|students?)\b|\brosters?\b/i

async function surfaces(): Promise<[string, string][]> {
  const text = await (llms() as Response).text()
  return [...MARKETING.map(p => [p, src(p)] as [string, string]), ['GET /llms.txt', text]]
}

describe('public claims match what ships (N21)', () => {
  it('positive control: the scan reads the real text, and each surface says grades 3 to 8', async () => {
    for (const [name, text] of await surfaces()) {
      expect(text.length, `${name} read as empty`).toBeGreaterThan(200)
      expect(text, `${name} no longer states the grades`).toMatch(/3 to 8/)
    }
    expect(src('src/app/auth/page.tsx')).toMatch(/grades 3 to 8/)
    // …and the Spanish half reads the screen's real strings: the keys it asks for, translated.
    expect(authKeys().length, 'no t() key read out of /auth').toBeGreaterThan(30)
    expect(authSpanish()[1]).toContain('Continuar con Google')
    expect(authSpanish()[1]).toContain('de 3.º a 8.º grado')
  })

  it('no surface claims KG / kindergarten', async () => {
    const all: [string, string][] = [...(await surfaces()), [AUTH, src(AUTH)], authSpanish()]
    for (const [name, text] of all) expect(text, `${name} claims KG`).not.toMatch(KG)
  })

  it('no marketing surface sells game time', async () => {
    for (const [name, text] of await surfaces()) expect(text, `${name} sells game time`).not.toMatch(GAME_TIME)
  })

  it('no marketing surface claims teacher classes / rosters', async () => {
    for (const [name, text] of await surfaces()) expect(text, `${name} claims teacher rosters`).not.toMatch(ROSTER)
  })
})
