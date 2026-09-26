/**
 * GATES OVER THE LEGAL PAGES, BECAUSE A LEGAL DOCUMENT THAT DRIFTS BECOMES A FALSE STATEMENT.
 *
 * ① Every legal page is DARK until a human flips its switch in `app/legal/registry.ts`: it renders
 *    its title and the red banner and nothing of the document, is noindex, and is not in the sitemap.
 *    And a document carrying a placeholder is never rendered whatever the switch says.
 * ② The retention number must match the job that ENFORCES it — read out of the migration.
 * ④ The account-deletion control the documents rely on really exists.
 * ⑤ No placeholder marker from docs/legal/ reaches shipped source or a rendered page.
 *
 * ⚠️ 2026-09-23 (item 4 of the legal loop): the pages now render `docs/legal/*.md` through one
 * mechanism, and the in-app drafts in `app/legal/content.ts` were DELETED. Gate ③ (the Terms' §3/§6
 * claims about the schema) and the old DRAFT-flag gate went with them — their subject no longer
 * exists. ⚠️ Gate ③'s idea — every table holding a child's data is named in the document — has NOT
 * been re-anchored on docs/legal/12 and is recorded as open in docs/legal/READINESS.md.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { LEGAL_PAGES, PUBLISHED_LEGAL_ROUTES, MARKER as REG_MARKER, publicBody, assertRenderable, pageBySlug } from '@/app/legal/registry'
import { SURVIVORS } from '@/core/accountDeletion'

const ROOT = resolve(__dirname, '../..')
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')
const flat = (s: string) => s.replace(/\s+/g, ' ')
const pub = (slug: string) => { const p = pageBySlug(slug)!; return publicBody(p, read(`docs/legal/${p.source}`)) }

// ─────────────────────────── ① dark until a human flips it ───────────────────────────
describe('every legal page is dark, and a placeholder is never rendered', () => {
  it('every page has a real public body in its source document — positive control on the boundaries', () => {
    for (const p of LEGAL_PAGES) {
      const body = pub(p.slug)
      expect(body.length, `${p.slug}: the public part of ${p.source} is almost empty — the boundaries are wrong`).toBeGreaterThan(400)
      expect(body, `${p.slug}: the drafters' status block leaked into the public part`).not.toContain('STATUS: DRAFT')
      expect(body, `${p.slug}: attorney notes leaked into the public part`).not.toMatch(/Notes for the attorney/)
    }
  })

  // The private beta (founder, 2026-09-24): exactly these five are published. Terms waits on two founder decisions
  // (§11's liability floor, §14's contact); refunds waits on billing. Written out by hand, never read from the registry.
  // terms joined the beta pages on 2026-09-26 (founder: §12 floor US$100, §14 a plain contact).
  const BETA = ['privacy', 'terms', 'parent-rights', 'subprocessors', 'cookies', 'retention']
  const DARK = ['refunds']
  const EFFECTIVE: Record<string, string> = { terms: '26 September 2026' }   // the rest: 25 September 2026
  it('exactly the beta pages are published, and nothing else', () => {
    expect(LEGAL_PAGES.filter(p => p.published).map(p => p.slug).sort()).toEqual([...BETA].sort())
    expect([...PUBLISHED_LEGAL_ROUTES].sort()).toEqual(BETA.map(s => `/legal/${s}`).sort())
    expect(LEGAL_PAGES.map(p => p.slug).sort(), 'control: every page is either published or dark').toEqual([...BETA, ...DARK].sort())
  })

  it.each(BETA.map(s => [s] as const))('/legal/%s renders its document, the beta label, and no placeholder', async slug => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: LegalPageView, generateMetadata } = await import('@/app/legal/[slug]/page')
    const html = renderToStaticMarkup(await LegalPageView({ params: Promise.resolve({ slug }) }))
    const text = flat(html.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
    expect(text).toContain(pageBySlug(slug)!.title)
    // Markdown the renderer could not parse shows up as bare asterisks — a parent reads "**Or email us" (found 2026-09-24).
    expect(text.match(/.{0,40}[*`].{0,40}/g), `/legal/${slug} shows unparsed markdown (a bare * or \`)`).toBeNull()
    const line = pub(slug).split('\n').map(l => l.replace(/[*#>|`_]/g, '').trim().replace(/^[-+]\s+/, '')).sort((a, b) => b.length - a.length)[0]
    expect(line.length).toBeGreaterThan(80)
    const tight = (x: string) => x.replace(/\s+([,.;:)])/g, '$1')   // a bold word ends in a tag, which leaves "word ,"
    expect(tight(text), `/legal/${slug} is published and does not render its document`).toContain(tight(flat(line)).slice(0, 60))
    // The founder's three requirements for the beta label, written out.
    expect(text).toContain('Beta version.')
    expect(text).toContain(`In effect from ${EFFECTIVE[slug] ?? '25 September 2026'}.`)
    expect(text).toContain('We will email parents before we make any material change to it.')
    expect(text).not.toContain('DRAFT — NOT IN FORCE')
    expect(text).not.toContain(REG_MARKER)
    const m = await generateMetadata({ params: Promise.resolve({ slug }) })
    expect(m.robots, `/legal/${slug} is published but marked noindex`).toBeUndefined()
  })

  it.each(DARK.map(s => [s] as const))('/legal/%s renders the banner and none of the document', async slug => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: LegalPageView, generateMetadata } = await import('@/app/legal/[slug]/page')
    const html = renderToStaticMarkup(await LegalPageView({ params: Promise.resolve({ slug }) }))
    const text = flat(html.replace(/<[^>]*>/g, ' '))
    // Control: the right page rendered at all.
    expect(text).toContain(pageBySlug(slug)!.title)
    // A real sentence of the document — the longest line, so it cannot be page furniture — is absent.
    const line = pub(slug).split('\n').map(l => l.replace(/[*#>|`_]/g, '').trim().replace(/^[-+]\s+/, '')).sort((a, b) => b.length - a.length)[0]
    expect(line.length).toBeGreaterThan(80)
    expect(text, `/legal/${slug} is dark and renders its document`).not.toContain(flat(line).slice(0, 60))
    expect(text).toContain('DRAFT — NOT IN FORCE')
    expect(text).not.toContain(REG_MARKER)
    const m = await generateMetadata({ params: Promise.resolve({ slug }) })
    expect(m.robots, `/legal/${slug} is dark and indexable`).toEqual({ index: false, follow: true })
  })

  it('a dark page is not in the sitemap', async () => {
    const { default: sitemap } = await import('@/app/sitemap')
    const urls = sitemap().map(e => e.url)
    expect(urls.some(u => u.endsWith('/help')), 'control: the sitemap lists public routes at all').toBe(true)
    expect(urls.filter(u => DARK.some(s => u.endsWith(`/legal/${s}`))), 'a dark page is in the sitemap').toEqual([])
    expect(urls.filter(u => u.includes('/legal/')).length, 'control: the published pages are in it').toBe(BETA.length)
  })

  it('refuses to render a document that carries a placeholder — every page, on its real text', () => {
    let refused = 0
    for (const p of LEGAL_PAGES) {
      const body = pub(p.slug)
      if (!body.includes(REG_MARKER)) continue
      expect(() => assertRenderable(p, body)).toThrow(/refused: its text still carries \d+ placeholder/)
      refused++
    }
    expect(refused, 'control: at least one real document carries a placeholder today').toBeGreaterThan(0)
    // …and lets a clean one through, so the refusal is about the marker and not about everything.
    expect(() => assertRenderable(LEGAL_PAGES[0], 'A finished sentence.')).not.toThrow()
  })
})

// ─────────────────────── ② the retention number, one gate, three places ───────────────────────
/**
 * The number production actually enforces. `cron.schedule` on an existing jobname UPDATES it, so the
 * LAST migration to schedule this job is the one in force — read them in filename order and take the
 * final one, exactly as Postgres did.
 */
function enforcedRetentionDays(): number {
  const dir = resolve(ROOT, 'supabase/migrations')
  let found: { file: string; days: number } | null = null
  for (const file of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(resolve(dir, file), 'utf8')
    // Bound the match on the statement terminator rather than a character window: a byte budget
    // silently walks into the next statement the moment anything above it grows.
    for (const stmt of sql.split(';')) {
      if (!stmt.includes("'purge-old-learner-events'")) continue
      if (!/cron\.schedule/.test(stmt)) continue
      const m = /interval\s+'(\d+)\s+days?'/i.exec(stmt)
      if (m) found = { file, days: Number(m[1]) }
    }
  }
  if (!found) throw new Error('no cron.schedule for purge-old-learner-events found in supabase/migrations')
  return found.days
}

/** Every "<N> days" a source claims. In these three, any such phrase IS the retention promise. */
const dayClaims = (s: string) => [...s.matchAll(/(\d+)[-\s]days?\b/g)].map(m => Number(m[1]))

describe('the retention promise matches the job that enforces it', () => {
  const enforced = enforcedRetentionDays()

  it('reads a real number out of the migration', () => {
    // Positive control on the instrument itself: a parse that silently returned nothing would make
    // every assertion below vacuous.
    expect(Number.isInteger(enforced)).toBe(true)
    expect(enforced).toBeGreaterThan(0)
  })

  const sources: [string, string][] = [
    ['src/data/repositories/exportData.ts (the note in the parent\'s own export)', read('src/data/repositories/exportData.ts')],
  ]

  it.each(sources)('%s states %s', (label, text) => {
    const claims = dayClaims(text)
    // Positive control per source: a reworded sentence that dropped the number entirely would leave
    // nothing to compare, and "no mismatches" would read as good news.
    expect(claims.length, `${label} no longer states any retention period in days — either it was ` +
      `reworded (fix this gate) or the promise was deleted (fix the document)`).toBeGreaterThan(0)
    for (const c of claims) {
      expect(c, `${label} says ${c} days; purge-old-learner-events deletes at ${enforced} days. ` +
        `One of them is a lie to a parent.`).toBe(enforced)
    }
  })
})

describe('the documents state the retention the job enforces', () => {
  const enforced = enforcedRetentionDays()
  // Only the lines about product events: these documents also state 10-day and 30-day periods for other things.
  const eventLines = (slug: string) => pub(slug).split('\n').filter(l => /product events/i.test(l) && /days/.test(l))
  it.each([['privacy'], ['retention']] as const)('/legal/%s', slug => {
    const lines = eventLines(slug)
    expect(lines.length, `${slug} no longer states how long product events are kept`).toBeGreaterThan(0)
    for (const l of lines) expect(dayClaims(l), l).toContain(enforced)
  })
})

// ─────────────── ④ §11 promises deletion — assert the control exists ───────────────
/**
 * ⚠️ THE DEFECT THIS CLOSES: §11 said "you may … delete your account at any time from your account
 * settings" while the only occurrence of that phrase in the entire repository was the sentence
 * itself. There was no control, no route, and no RPC — and the database actively refused it
 * (`learners.created_by -> profiles` is ON DELETE RESTRICT, so deleting the auth row raised a
 * foreign-key violation for any parent who had ever added a child).
 *
 * What is asserted here is that the CONTROL exists and is reachable. What the deletion actually
 * removes, table by table, is proved by running it in `accountDeletion.test.ts` against the real
 * schema — a source check could never establish that, and this one does not pretend to.
 */
describe('§11 promises account deletion, and the control is really there', () => {
  const migrations = (() => {
    const dir = resolve(ROOT, 'supabase/migrations')
    return readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
      .map(f => readFileSync(resolve(dir, f), 'utf8')).join('\n')
  })()

  it('a parent can reach it, and only from the parent side', () => {
    const account = read('src/app/parent/account/page.tsx')
    expect(read('src/app/parent/page.tsx'), 'the dashboard no longer links to /parent/account')
      .toContain('href="/parent/account"')
    expect(account, 'the page must call the real deletion path').toContain('deleteMyAccount')

    // ⚠️ AND NOTHING ON THE CHILD'S SIDE MAY LINK TO IT. The threat is a seven-year-old on a
    // signed-in device; a link from a child route would defeat the placement argument however good
    // the guards on the page are. (`/shop` left this list on 2026-09-20 with the coin economy.)
    for (const childRoute of ['src/app/game', 'src/app/menu', 'src/app/modules', 'src/app/lesson', 'src/app/practice', 'src/app/play']) {
      const dir = resolve(ROOT, childRoute)
      const files = readdirSync(dir, { recursive: true }) as string[]
      for (const f of files) {
        if (!/\.tsx?$/.test(f)) continue
        const src = readFileSync(resolve(dir, f), 'utf8')
        expect(src, `${childRoute}/${f} links to the account-deletion page from the child's side`)
          .not.toContain('/parent/account')
      }
    }
  })

  it('the RPC exists, requires re-authentication, and is granted to authenticated only', () => {
    expect(migrations).toContain('create or replace function public.delete_my_account')
    // The three refusals, by name. `accountDeletion.test.ts` drives each one; this is the cheap
    // companion that notices if one is deleted from the source entirely.
    for (const guard of ['not_signed_in', 'reauth_required', 'confirm_mismatch']) {
      expect(migrations, `delete_my_account no longer raises ${guard}`).toContain(guard)
    }
    expect(migrations).toContain('grant execute on function public.delete_my_account(text) to authenticated')
    expect(migrations).toContain('revoke all on function public.delete_my_account(text) from public, anon')
  })

  it('every survivor has a reason and a description at all', () => {
    /**
     * ⚠️ STATE WHAT THIS CHECKS, NOT THE STRONGER THING IT LOOKS LIKE. It catches an EMPTY reason —
     * a table added to SURVIVORS to make a red gate green, with nothing written. It does NOT and
     * cannot judge whether the reason is a good one: gutting the justification down to "we keep it"
     * and leaving the rest of the sentence attached passed this happily when it was run against
     * that exact break. A length threshold on prose is a proxy, and the only real check on the
     * quality of that sentence is a person reading it before §11 is written around it.
     */
    expect(SURVIVORS.length).toBeGreaterThan(0)
    for (const s of SURVIVORS) {
      expect(s.table).toMatch(/^public\./)
      expect(s.why.length, `${s.table} survives deletion with no reason written down`).toBeGreaterThan(60)
      expect(s.what.length).toBeGreaterThan(10)
    }
  })
})

// ────────── ⑤ a draft out of docs/legal/ may never reach a published page ──────────
/**
 * ⚠️ THIS IS NOT GATE ①, AND IT CLOSES A HOLE ① LEAVES WIDE OPEN. ① only fires when `DRAFT` is
 * FALSE. `DRAFT` is true today, so the whole of `docs/legal/11-privacy-policy.md` — thirty
 * `[PLACEHOLDER — …]` markers and a "STATUS: DRAFT — NOT LEGAL ADVICE" banner — could be pasted
 * into `content.ts` this afternoon and every gate above would stay green, because a draft banner is
 * exactly what ① expects to find while the flag is up. The sixteen drafts landed in `docs/legal/` on
 * 2026-09-22 as DOCUMENTS ONLY, wired to nothing; this is the thing that keeps them documents.
 *
 * ⚠️ THE TWO RULES HAVE DIFFERENT SCOPES AND THAT IS DELIBERATE, NOT UNTIDY.
 *   · `[PLACEHOLDER` is looked for in SHIPPED SOURCE. It has no legitimate use there — zero
 *     occurrences in `src/` and `public/` on the day this was written — so the whole tree is fair
 *     game and a paste anywhere in it is caught before it ever renders.
 *   · `DRAFT` is looked for in RENDERED TEXT ONLY. `content.ts` exports `const DRAFT = true`, which
 *     is the repo's own safety flag, and the page's own banner says "⚠️ Draft — …". A source scan
 *     for the word would go red on the two mechanisms that exist to prevent this exact defect, on
 *     every correct commit, for ever. A check that cries wolf is spent exactly like one that never
 *     fires, so the word is hunted where a parent would actually read it: in the text the page
 *     paints. The drafts shout it in capitals (`STATUS: DRAFT`), the repo's banner does not.
 *
 * ⚠️ `docs/legal/**` IS NOT IN SCOPE AND MUST NEVER BE ADDED. The drafts are supposed to be full of
 * markers; a gate that forbade them there would be a gate against the drafts existing.
 */
describe('a draft legal document never reaches published content', () => {
  // Built by concatenation so this file can never be the thing it finds — the scope below excludes
  // `src/__tests__/`, and this is what stops a future widening of that scope from making the gate
  // permanently and confusingly red at itself.
  const MARKER = '[' + 'PLACEHOLDER'

  /** Everything shipped to a browser: every route and component, plus the static text in public/. */
  function publishedFiles(): string[] {
    const out: string[] = []
    for (const f of readdirSync(resolve(ROOT, 'src'), { recursive: true }) as string[]) {
      if (!/\.tsx?$/.test(f)) continue
      if (f.startsWith('__tests__')) continue // tests are not published to anyone
      out.push(`src/${f}`)
    }
    for (const f of readdirSync(resolve(ROOT, 'public'), { recursive: true }) as string[]) {
      if (/\.(txt|json|html|webmanifest|md)$/.test(f)) out.push(`public/${f}`)
    }
    return out
  }

  it('no shipped source carries a draft placeholder marker', () => {
    const files = publishedFiles()

    /**
     * ⚠️ "I CANNOT SEE" AND "THERE IS NOTHING TO SEE" MUST NOT RENDER AS THE SAME RESULT. A walk
     * that found no files, or a marker string that could never match anything, would report this
     * page clean in exactly the voice of a real pass. Both halves are controlled: the corpus is
     * non-trivial, and the same search run against a document we KNOW carries the marker finds it.
     */
    expect(files.length, 'the walk found no published files — this gate is blind, not clean')
      .toBeGreaterThan(100)
    // (The Privacy Policy was the control until the beta cleared it, 2026-09-24; the refund policy still carries some.)
    expect(read('docs/legal/01-refund-and-cancellation-policy.md'),
      `positive control: "${MARKER}" was not found in a draft that is known to carry them, ` +
      `so this search could not have found one in src/ either`).toContain(MARKER)

    const hits = files.filter(f => read(f).includes(MARKER))
    expect(hits, `a legal draft's placeholder marker has reached published content. Those markers ` +
      `live in docs/legal/ and mean a decision nobody has made; a page carrying one is an ` +
      `incomplete statement to a parent. Take the text back out — the drafts are not publishable ` +
      `until an attorney has resolved every marker in docs/legal/13-placeholder-worksheet.md.`)
      .toEqual([])
  })
})

describe('a published page never carries a placeholder', () => {
  it('every page whose switch is on has a public text with no placeholder and nothing refusing it', async () => {
    const { publishRefusals } = await import('@/app/legal/registry')
    for (const p of LEGAL_PAGES.filter(p => p.published)) {
      const md = read(`docs/legal/${p.source}`)
      const n = pub(p.slug).split(REG_MARKER).length - 1
      expect(n, `/legal/${p.slug} is published and its document still carries ${n} placeholder(s)`).toBe(0)
      expect(publishRefusals(p, md, p.spanish ? read(`docs/legal/${p.spanish.source}`) : null), `/legal/${p.slug} is published and refused`).toEqual([])
    }
  })
})
