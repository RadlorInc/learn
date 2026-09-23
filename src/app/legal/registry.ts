/**
 * EVERY LEGAL PAGE, ONE ROW EACH — WHERE ITS WORDS COME FROM, AND WHETHER IT IS PUBLISHED.
 *
 * ⚠️ THE WORDS COME FROM `docs/legal/`, AND ONLY THE PUBLIC PART OF EACH FILE. Those documents are
 * working drafts: a status block for the drafters at the top, notes for the attorney at the bottom,
 * and in some (06, 07, 04) an internal procedure in between. `after`/`until` name the lines that
 * bound what a reader may see, and `publicBody` refuses — rather than guesses — when either is gone.
 * ⚠️ These boundaries were set by engineering on 2026-09-23 and are part of what the attorney
 * signs off: publishing a line of attorney notes would be a real mistake.
 *
 * ⚠️ `published` IS THE SWITCH, AND IT IS FALSE FOR EVERY PAGE. Flipping it is a human's act, and
 * `publishRefusals` (item 5) names every reason the switch must not yet be flipped; the page throws at
 * build time on any of them. While dark a page renders only its banner — never the document body — is
 * `noindex`, and is left out of the sitemap.
 *
 * Isomorphic on purpose (no `fs`): the sitemap, the consent route and the tests all read this list.
 * The file reads live in `source.ts`, which only server code imports.
 */
export interface LegalPage {
  slug: string
  /** What the page is called on screen. */
  title: string
  /** The file under `docs/legal/`. */
  source: string
  /** The public text starts on the line AFTER the first line that starts with this. Default: the first `---`. */
  after?: string
  /** …and stops before the first line that starts with this. */
  until: string
  /** THE SWITCH. */
  published: boolean
  /** Who signed off, when. `null` = no attorney has. Recorded by a human, never inferred. */
  signoff: { by: string; date: string } | null
  /** The Spanish version, and whether a Spanish reader has reviewed it. `null` = none exists. */
  spanish: { source: string; reviewedBy: string | null } | null
  /** A page that promises something the product must do first. */
  needs?: 'deletion' | 'billing'
}

export const LEGAL_PAGES: LegalPage[] = [
  { slug: 'privacy', title: 'Privacy Policy', source: '11-privacy-policy.md',
    after: '> One dependency survives', until: '### Where this policy must appear',
    published: false, signoff: null, spanish: null },
  { slug: 'terms', title: 'Terms of Service', source: '12-terms-of-service.md',
    until: '### Notes for the attorney', published: false, signoff: null, spanish: null },
  { slug: 'refunds', title: 'Refund and Cancellation Policy', source: '01-refund-and-cancellation-policy.md',
    until: '### Notes for the attorney', published: false, signoff: null, spanish: null, needs: 'billing' },
  { slug: 'parent-rights', title: 'Your rights as a parent', source: '06-parent-rights-procedure.md',
    after: '# Part A — Public page', until: '# Part B — Internal procedure',
    published: false, signoff: null, spanish: null, needs: 'deletion' },
  { slug: 'subprocessors', title: 'Service Providers and Subprocessors', source: '07-subprocessors.md',
    until: '## Two questions still open', published: false, signoff: null, spanish: null },
  { slug: 'cookies', title: 'Cookie and Tracking Notice', source: '08-cookie-and-tracking-notice.md',
    until: '### Notes for the attorney', published: false, signoff: null, spanish: null },
  { slug: 'retention', title: 'Data Retention and Deletion Policy', source: '04-data-retention-policy.md',
    until: '## 7. The purge cliff', published: false, signoff: null, spanish: null },
]

export const pageBySlug = (slug: string) => LEGAL_PAGES.find(p => p.slug === slug)
export const PUBLISHED_LEGAL_ROUTES = LEGAL_PAGES.filter(p => p.published).map(p => `/legal/${p.slug}`)

export const MARKER = '[' + 'PLACEHOLDER'

/** The part of a document a reader may see. Throws, naming the file, if a boundary line is missing. */
export function publicBody(page: LegalPage, md: string): string {
  const lines = md.split('\n')
  const a = page.after ? lines.findIndex(l => l.startsWith(page.after!)) : lines.findIndex(l => l.trim() === '---')
  const b = lines.findIndex((l, i) => i > a && l.startsWith(page.until))
  if (a < 0 || b < 0) {
    throw new Error(`docs/legal/${page.source}: the ${a < 0 ? `start line "${page.after ?? '---'}"` : `end line "${page.until}"`} ` +
      'is gone, so where the public text begins or ends is unknown. Fix the boundary in registry.ts — never guess it.')
  }
  const body = lines.slice(a + 1, b)
  while (body.length && /^(---)?\s*$/.test(body[body.length - 1])) body.pop()
  while (body.length && /^(---)?\s*$/.test(body[0])) body.shift()
  return body.join('\n')
}

/**
 * ⚠️ THE LAST LINE OF DEFENCE: a document carrying a placeholder is never rendered, whatever the switch
 * says. The page calls this on the text it is about to paint.
 */
export function assertRenderable(page: LegalPage, body: string): void {
  const n = body.split(MARKER).length - 1
  if (n) throw new Error(`/legal/${page.slug} refused: its text still carries ${n} placeholder(s) from docs/legal/${page.source}. A placeholder is a decision nobody has made; it is never shown to a reader.`)
}

// ─────────────────────────────── the switch ───────────────────────────────
/**
 * ⚠️ TWO FACTS THE PRODUCT MUST MAKE TRUE BEFORE A PAGE MAY PROMISE THEM. Each is a literal a human
 * changes in a reviewed commit, never inferred from the environment.
 *   · BILLING_LIVE — the refund policy promises refunds; nothing has ever been charged
 *     (`billing_config.enforced = false` on production, measured 2026-09-23).
 *   · WITHDRAWAL_DELETES — the parent-rights page promises that withdrawing deletes. Set true only
 *     with the proof `consentDeletion.test.ts` provides (item 6), which asserts it back.
 */
export const BILLING_LIVE = false
export const WITHDRAWAL_DELETES = false

/**
 * Every reason this page must not be published, in words a person can act on. Empty = the switch
 * may be flipped. `md` is the whole source file; `es` the Spanish source, if one exists.
 *
 * ⚠️ A SWITCH THAT PUBLISHES WHATEVER IT IS GIVEN IS A BUTTON, NOT A SAFEGUARD. Each reason is checked
 * on its own (`legalSwitch.test.ts`: six pages, each wrong in exactly one way, six refusals).
 */
export function publishRefusals(page: LegalPage, md: string, es: string | null, facts = { billing: BILLING_LIVE, deletion: WITHDRAWAL_DELETES }): string[] {
  const why: string[] = []
  const holes = md.split(MARKER).length - 1
  if (holes) why.push(`placeholders: docs/legal/${page.source} still carries ${holes}`)
  const header = md.split('\n').slice(0, md.split('\n').findIndex(l => l.trim() === '---') + 1 || 12).join('\n')
  if (/STATUS:\s*DRAFT/.test(header)) why.push(`draft: docs/legal/${page.source} still opens "STATUS: DRAFT"`)
  if (!page.signoff) why.push('sign-off: no attorney sign-off is recorded in registry.ts')
  if (!page.spanish || es === null) why.push('spanish: there is no Spanish version')
  else if (!page.spanish.reviewedBy) why.push(`spanish: ${page.spanish.source} has not been reviewed by a Spanish reader`)
  if (page.needs === 'deletion' && !facts.deletion) why.push('deletion: withdrawing consent does not yet delete the child\'s data (WITHDRAWAL_DELETES)')
  if (page.needs === 'billing' && !facts.billing) why.push('billing: billing is not live, so no refund can be given (BILLING_LIVE)')
  return why
}
