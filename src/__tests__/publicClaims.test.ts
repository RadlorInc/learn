/**
 * What the public surfaces PROMISE — founder's decision N21, 2026-09-26.
 *
 * Only grades 3–8 are live (KG–2 exists only in Draft #233); `/play` says games are "coming soon" and spends
 * no points; teachers adding students is paused until a school-consent route exists. So the titles,
 * descriptions, share card, JSON-LD, manifest, llms.txt, /help and /auth must say "grades 3 to 8" and must not
 * sell KG, game time or class rosters. Flip this gate in the SAME change that ships any of them.
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
const GRADE_ONLY = ['src/app/auth/page.tsx', 'src/features/dashboard/i18n.tsx']

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
  })

  it('no surface claims KG / kindergarten', async () => {
    const all: [string, string][] = [...(await surfaces()), ...GRADE_ONLY.map(p => [p, src(p)] as [string, string])]
    for (const [name, text] of all) expect(text, `${name} claims KG`).not.toMatch(KG)
  })

  it('no marketing surface sells game time', async () => {
    for (const [name, text] of await surfaces()) expect(text, `${name} sells game time`).not.toMatch(GAME_TIME)
  })

  it('no marketing surface claims teacher classes / rosters', async () => {
    for (const [name, text] of await surfaces()) expect(text, `${name} claims teacher rosters`).not.toMatch(ROSTER)
  })
})
