/**
 * TWO GATES OVER THE LEGAL COPY, BECAUSE A LEGAL DOCUMENT THAT DRIFTS BECOMES A FALSE STATEMENT.
 *
 * ① A draft may never render as live. `/legal/*` carries placeholders — `[DATE]`, `[NN]`, `[URL]`,
 *    the ten `[LAWYER REVIEW — …]` markers and one unwritten refund sentence — each of which marks a
 *    decision nobody has made. They are shown ON SCREEN on purpose. If `DRAFT` is ever flipped to
 *    false with one still present, the banner disappears while the hole does not, and a parent reads
 *    a document that looks finished. `draftGuardError` is what stops that, at module scope, so it
 *    fires in `next build` as well as here.
 *
 * ② The retention number must match the job that ENFORCES it. The documents promise usage events are
 *    deleted after 90 days; the only thing that makes that true is the `purge-old-learner-events`
 *    cron job. The expectation here is read out of the MIGRATION, so changing the cron to 180 and
 *    leaving the copy alone turns this red — which is the moment the terms become a false statement
 *    to a parent. Three places say the number today and one gate holds all three.
 *
 * ⚠️ Neither gate derives its expectation from the thing it guards: ① compares the app's copy
 * against the source markdown, ② compares prose against the SQL. A gate that read the number out of
 * the same file it asserts would pass through any change.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  DRAFT, DOCS, TERMS, PRIVACY, PLACEHOLDERS, unresolvedPlaceholders, draftGuardError,
} from '@/app/legal/content'
import { SURVIVORS } from '@/core/accountDeletion'

/**
 * THE MARKERS STILL OPEN IN THE APP'S TERMS, WRITTEN OUT BY HAND.
 *
 * ⚠️ `PLACEHOLDERS` is the REFUSAL list — nothing carrying one of those may ever render as final,
 * and that list does not shrink when a decision is made. This is the different question: which of
 * them are unresolved *today*. It exists so that resolving one is a diff a human reviews, never a
 * gate quietly going green because there was less left to find.
 *
 * ⚠️ 2026-09-06 — `[DATE]` left this list. The founder set the date to 6 September 2026, which was
 * always theirs to set: `[DATE]` marked "nobody has decided", not "a lawyer must decide". THE
 * DOCUMENT IS STILL A DRAFT and `DRAFT` is still true. A date is not a review, and the four below
 * are still open — including §8's refund sentence, which is not waiting on counsel but is simply
 * unwritten, and which says so in its own text.
 */
const OPEN = ['[LAWYER REVIEW', '[NN]', '[URL]', '[Describe the refund'] as const

const ROOT = resolve(__dirname, '../..')
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

// ───────────────────────────── ① the draft gate ─────────────────────────────
describe('a draft legal page never renders as live', () => {
  it('is a draft today, and the page renders the banner from that flag', () => {
    expect(DRAFT).toBe(true)
    const page = read('src/app/legal/[slug]/page.tsx')
    // Anchored on the real conditional, not on the words in the banner: the banner's copy may be
    // reworded, but if it stops being gated on DRAFT the flag has stopped meaning anything.
    expect(page).toContain('{DRAFT && (')
  })

  it('flags every placeholder while DRAFT is false, and nothing while it is true', () => {
    // Drives the SAME function the module-scope guard calls — not a re-implementation of the rule.
    expect(draftGuardError(true, DOCS)).toBeNull()

    const err = draftGuardError(false, DOCS)
    expect(err).not.toBeNull()
    for (const p of OPEN) expect(err).toContain(p)
    expect(err).toContain('terms:')
  })

  it('the shipped terms still carry every placeholder the source file has', () => {
    // The positive control for the gate above: if a well-meaning tidy-up resolved the markers, the
    // guard would go quiet and report a clean document. This compares the rendered copy against the
    // markdown it came from, so a removal is a failure rather than a silent pass.
    // ⚠️ THE SOURCE DOCUMENT IS IN THE REPO, and it has to be: this comparison is the positive
    // control for the whole draft gate, and it passed locally for one run against an UNTRACKED file
    // — green on my machine, ENOENT in CI. A check whose corpus is not committed is not a check.
    const md = read('docs/app-terms-of-service.md')
    const count = (hay: string, needle: string) => hay.split(needle).length - 1

    /**
     * ⚠️ COMPARED AGAINST THE WHOLE SHIPPED DOCUMENT, NOT JUST `body` — and that is the half this
     * check would have lost. The source's "Last updated" line is lifted into the `updated` FIELD
     * (the page header renders it) rather than sitting in the body, so a body-only comparison would
     * see `[DATE]` once in the .md and zero times in the shipped copy and call that a resolved
     * placeholder. `unresolvedPlaceholders` reads the same three fields for the same reason.
     */
    const shipped = `${TERMS.title}\n${TERMS.updated}\n${TERMS.body}`

    // ⚠️ BOTH DIRECTIONS, AND THAT IS THE POINT. An OPEN marker that has vanished was resolved by
    // somebody without recording it; a RESOLVED one that has come back means the document regressed.
    // Neither can happen quietly, because both change this list and this list is written by hand.
    for (const p of PLACEHOLDERS) {
      const open = (OPEN as readonly string[]).includes(p)
      if (open) {
        expect(count(md, p),
          `${p} is listed as OPEN but is gone from docs/app-terms-of-service.md — if that decision ` +
          `was made, take it out of OPEN in the same commit and say who made it`).toBeGreaterThan(0)
      } else {
        expect(count(md, p),
          `${p} was resolved, but it is back in docs/app-terms-of-service.md`).toBe(0)
      }
      // Verbatim between source and shipped either way — this is what catches a marker resolved on
      // one side only, which is how the page and the document start telling different stories.
      expect(count(shipped, p), `${p} differs between the .md and the shipped document`)
        .toBe(count(md, p))
    }
    expect([...unresolvedPlaceholders(TERMS)].sort(), 'the markers actually left in the document ' +
      'are not the ones OPEN says are left').toEqual([...OPEN].sort())
  })

  it('the lifted date line still says what the source document says', () => {
    /**
     * ⚠️ THE LIFT IS THE PLACE A PLACEHOLDER COULD BE RESOLVED WITHOUT ANY OTHER CHECK NOTICING.
     * The body comes across verbatim, but `updated` is retyped by hand — so it is the one field
     * where "[DATE]" could quietly become a real date while the .md still carried the marker and
     * every count above still balanced. Bind the two.
     */
    const md = read('docs/app-terms-of-service.md')
    const line = /^\*\*Last updated: (.+?)\*\*$/m.exec(md)
    expect(line, 'the source document no longer carries a "Last updated" line to lift').not.toBeNull()
    expect(TERMS.updated, 'the page header and the source document disagree about the date')
      .toBe(line![1])
  })

  it('carries no internal note addressed to a person', () => {
    // ⚠️ A NOTE TO A NAMED HUMAN ON A PUBLIC LEGAL PAGE MAKES A DELIBERATE DRAFT READ AS AN
    // UNFINISHED ONE, which is a different and worse claim than the banner's. The banner says
    // "not final"; a note saying "delete before publishing" says "nobody checked this page at all".
    for (const hay of [read('docs/app-terms-of-service.md'), TERMS.body, PRIVACY.body]) {
      expect(hay).not.toMatch(/Note to \w+, delete before publishing/)
      expect(hay).not.toContain('Note to Rafi')
    }
  })

  it('the renderer shows placeholders rather than eating them', async () => {
    // `[DATE]` and `[LAWYER REVIEW — …]` are bracketed, which is markdown link territory. A renderer
    // that swallowed them would defeat the banner while every string check above stayed green, so
    // this drives the real render and reads the text a parent would see.
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: LegalPage } = await import('@/app/legal/[slug]/page')
    const html = renderToStaticMarkup(await LegalPage({ params: Promise.resolve({ slug: 'terms' }) }))
    const text = html.replace(/<[^>]*>/g, ' ')
    for (const p of OPEN) expect(text, `${p} is not visible on the rendered page`).toContain(p)
    /**
     * ⚠️ THIS EXPECTATION MOVED WITH THE BANNER, AND IT WENT RED FIRST — which is the gate working.
     * It used to read 'has not been reviewed by a lawyer'. The banner was rewritten on 2026-09-22
     * from a 14px caveat to a red block headed "DRAFT — NOT IN FORCE", and this assertion caught
     * the change rather than sleeping through it. Re-anchored on the STRONGER of the two claims:
     * "not final" is what the old line said, and it is too weak for a document whose first body
     * word is PLACEHOLDER. If a future edit softens this back to a caveat, this goes red again.
     */
    expect(text).toContain('DRAFT — NOT IN FORCE')
    expect(text).toContain('No lawyer has reviewed it')
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
    ['the Privacy Policy body', PRIVACY.body],
    ['the Terms of Service body', TERMS.body],
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

// ─────────────── ③ the factual claims §3 and §6 make about the schema ───────────────
/**
 * ⚠️ THE TERMS SAY THEY WERE "WRITTEN AGAINST THE LIVE PRODUCTION SCHEMA", SO THE SCHEMA IS WHAT
 * THEY HAVE TO KEEP AGREEING WITH. Three claims are checkable without anybody remembering to look:
 * the six age bands, the promise that no date of birth is collected, and §6's enumeration of what
 * is recorded about a child. Everything else in the document is a legal position, a promise about
 * conduct, or a fact about a third party — none of which a schema can settle.
 *
 * ⚠️ Every expectation below is WRITTEN OUT HERE, by hand. Importing the band list from
 * `ageGroups.ts` and asserting the document contains it would be asserting the code equals itself.
 * Two edits to change a band is the mechanism, not the friction.
 */
/**
 * The document is hard-wrapped at 80 columns, which is a property of the source file and not of what
 * a parent reads — a phrase can straddle a line break. Collapse whitespace before matching, so
 * re-wrapping a paragraph cannot turn a gate red on a document that says exactly the same thing.
 */
const flat = (s: string) => s.replace(/\s+/g, ' ')
const TERMS_FLAT = flat(TERMS.body)

const migrationSql = (() => {
  const dir = resolve(ROOT, 'supabase/migrations')
  return [
    read('supabase/schema/baseline_schema.sql'),
    ...readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
      .map(f => readFileSync(resolve(dir, f), 'utf8')),
  ].join('\n')
})()

describe('the terms still agree with the schema they were written against', () => {
  it('§3 names the six age bands the app actually offers', () => {
    // Hand-written, in the order the document lists them.
    for (const band of ['3–5', '6–8', '9–11', '12–14', '15–16', '17–18']) {
      expect(TERMS_FLAT, `§3 no longer names the ${band} band`).toContain(band)
    }
    // …and the app offers no seventh. Derived from the source, compared against the count above.
    const offered = [...read('src/core/ageGroups.ts').matchAll(/\{\s*value:\s*'([\d-]+)'/g)].map(m => m[1])
    expect(offered.length, `the app offers ${offered.length} bands; §3 lists 6`).toBe(6)
  })

  it('§3\'s "we do not collect a date of birth" is still true of the schema', () => {
    // ⚠️ NOT HYPOTHETICAL. `learners.date_of_birth` — an exact birthdate on a child — was in
    // migration zero and was dropped by 20260817174352. Reintroducing it anywhere turns the
    // sharpest COPPA sentence in the document into a false statement.
    expect(TERMS_FLAT).toContain('**We do not collect a date of birth**')
    expect(migrationSql, 'positive control: the drop statement is what makes the claim true')
      .toMatch(/alter table public\.learners drop column if exists date_of_birth/)
    const reintroduced = [...migrationSql.matchAll(/(add column[^;]*|create table[^;]*)date_of_birth/gi)]
      .filter(m => !m[0].includes('create table if not exists public.learners')) // migration zero, then dropped
    expect(reintroduced.map(m => m[0].slice(0, 60)), 'a birthdate column is back in the schema').toEqual([])
  })

  it('§6 describes every table that holds a child\'s data', () => {
    /**
     * Derived from the SQL exactly as `exportCompleteness.test.ts` derives it — a table carrying
     * `learner_id` holds one child's data. Each one is mapped to the WORDS in §6 that cover it, and
     * both halves are asserted: a new table with no entry is a document that has gone incomplete,
     * and a reworded §6 that dropped the phrase is a document that has gone silent about something
     * it still records.
     */
    const COVERED: Record<string, string> = {
      sessions:            'each completed practice run',
      learner_progress:    'cumulative progress per chapter',
      learner_stats:       'totals per child',
      learner_state:       'in-app items bought with earned coins',
      learner_events:      '**usage events**',
      diagnostic_sessions: 'placement checks: which questions were asked',
      diagnostic_plans:    'suggested starting point and practice plan',
      diagnostic_rechecks: 'placement checks',
      error_events:        '**Error reports.**',
      subscription_seats:  'how many seats you have paid for',
      lesson_progress:     'which lesson topics were finished',
      point_events:        'each time points were earned',
      game_settings:       'the game-time settings you choose',
      exercise_results:    'class exercise results',
      lesson_feedback:     'which lesson screen was hard to follow',
      // Adult-to-adult authorisation rather than data about the child — §5, not §6.
      learner_access:      'You may invite another parent or guardian',
      learner_invites:     'You may invite another parent or guardian',
    }
    const childTables = new Set<string>()
    for (const m of migrationSql.matchAll(/create table (?:if not exists )?public\.([a-z_]+)\s*\(([\s\S]*?)\n\);/g)) {
      if (/\blearner_id\b/.test(m[2])) childTables.add(m[1])
    }
    // Reached through a parent key rather than learner_id, same as the export gate.
    childTables.add('diagnostic_items')
    childTables.add('diagnostic_plan_progress')

    expect(childTables.size, 'positive control: the derivation found no tables at all')
      .toBeGreaterThan(10)

    const undescribed = [...childTables].filter(t => !(t in COVERED) && t !== 'diagnostic_items' && t !== 'diagnostic_plan_progress')
    expect(undescribed, 'these tables hold a child\'s data and §6 of the Terms does not mention them — ' +
      'either describe them in the document or add them here with the words that cover them').toEqual([])

    for (const [table, phrase] of Object.entries(COVERED)) {
      expect(TERMS_FLAT, `the words covering ${table} are gone from the Terms: "${phrase}"`).toContain(flat(phrase))
    }
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

  it('the Terms still make the promise', () => {
    // If this sentence is ever removed, the assertions below stop being required — and somebody
    // should have to notice that rather than leave a gate guarding a promise nobody makes.
    expect(TERMS_FLAT).toContain('delete your account at any time from your account settings')
  })

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
    expect(read('docs/legal/11-privacy-policy.md'),
      `positive control: "${MARKER}" was not found in a draft that is known to carry thirty of ` +
      `them, so this search could not have found one in src/ either`).toContain(MARKER)

    const hits = files.filter(f => read(f).includes(MARKER))
    expect(hits, `a legal draft's placeholder marker has reached published content. Those markers ` +
      `live in docs/legal/ and mean a decision nobody has made; a page carrying one is an ` +
      `incomplete statement to a parent. Take the text back out — the drafts are not publishable ` +
      `until an attorney has resolved every marker in docs/legal/13-placeholder-worksheet.md.`)
      .toEqual([])
  })

  it('the rendered legal pages carry no placeholder marker and no DRAFT banner', async () => {
    /**
     * ⚠️ THE SOURCE SCAN ABOVE AND THIS ONE ARE TWO INSTRUMENTS, NOT ONE REPEATED. The scan reads
     * files; this drives the real renderer and reads the text a parent's browser actually paints,
     * which is the only place the claim "no draft text is published" is finally true or false. It
     * also reaches text the scan cannot attribute to a document at all — a banner pasted into the
     * page component rather than into `content.ts` renders identically and is caught here.
     */
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: LegalPage } = await import('@/app/legal/[slug]/page')

    for (const doc of DOCS) {
      const html = renderToStaticMarkup(await LegalPage({ params: Promise.resolve({ slug: doc.slug }) }))
      const text = flat(html.replace(/<[^>]*>/g, ' '))

      /**
       * Control first, and it is not decorative: a slug the router did not recognise, or a body that
       * failed to render, would satisfy every assertion below in perfect silence. Anchor on the
       * document's own title and on real length, so an empty page cannot read as a clean one.
       */
      expect(text, `${doc.slug} did not render its own title — this gate is reading the wrong page`)
        .toContain(doc.title)
      expect(text.length, `${doc.slug} rendered almost nothing — this gate is reading an empty ` +
        `document, not a clean one`).toBeGreaterThan(500)

      expect(text, `${doc.slug} renders "${MARKER}" — a draft has been pasted into a live page`)
        .not.toContain(MARKER)
      expect(text, `${doc.slug} renders the drafts' "STATUS: DRAFT" banner`).not.toContain('STATUS: DRAFT')
    }
  })

  it('no legal DOCUMENT shouts DRAFT, though the page furniture may', () => {
    /**
     * ⚠️ THIS RULE MOVED, AND WHY IT MOVED IS THE POINT. It used to forbid capitalised DRAFT
     * anywhere in the RENDERED page. Then the banner was rewritten to read "⚠️ DRAFT — NOT IN
     * FORCE", because a 14px "Draft —" line was being skimmed past on a document whose first body
     * word is PLACEHOLDER — and the gate went red on the correct fix. A check that fires on the
     * right answer is spent exactly like one that never fires, so the rule was re-aimed rather
     * than deleted or weakened.
     *
     * The risk was never the page's own furniture; it is draft TEXT being pasted into a document.
     * So the page may shout DRAFT as loudly as it likes, and the three fields that carry document
     * content may not. `docs/legal/*.md` open with "STATUS: DRAFT — NOT LEGAL ADVICE"; the check
     * on the rendered page above still catches that exact string wherever it lands.
     */
    for (const doc of DOCS) {
      const content = `${doc.title}\n${doc.updated}\n${doc.body}`
      expect(content, `${doc.slug}'s document text carries the word DRAFT in capitals, which is ` +
        `how the unpublished documents in docs/legal/ mark themselves — the page's banner may ` +
        `say it, the document may not`).not.toMatch(/\bDRAFT\b/)
    }
  })
})
