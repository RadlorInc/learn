/**
 * THE CONSENT SCREENS AND EMAILS SAY EXACTLY WHAT THE DOCUMENTS SAY — NO MORE, NO LESS.
 *
 * ⚠️ THE EXPECTATION IS READ FROM `docs/legal/`, NOT FROM THE COPY UNDER TEST. Two independent
 * artefacts, compared in BOTH directions:
 *   · every sentence, heading, table cell, list item and button in the document is on the screen —
 *     a dropped line is a notice that no longer says everything the policy says;
 *   · every string on the screen is in the document — a reworded one is two statements about the
 *     same thing, which is the failure this whole exercise exists to prevent.
 * Markdown emphasis and link syntax are stripped on both sides before comparing; the words are not.
 *
 * ⚠️ AND THE NOTICE'S TEXT IS PINNED TO ITS VERSION. Every consent row stores `NOTICE_VERSION` as
 * "what the parent was shown". If the notice changes and the version does not, every later consent
 * records a lie about what was on screen. The hashes below are written out by hand, one per version:
 * changing a word means adding a version here, not editing v1's hash.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { NOTICE, B1, B2, B3, WITHDRAW, WITHDRAW_ALL, WAITING, ATTEST, REASK, PROPOSED, NOTICE_VERSION, type L } from '@/features/consent/copy'

const ROOT = resolve(__dirname, '../..')
const doc = (f: string) => readFileSync(resolve(ROOT, 'docs/legal', f), 'utf8')

/** Same normalisation both sides: drop emphasis, links → their text, collapse whitespace. */
const norm = (s: string) => s
  .replace(/\{name\}/g, '<name>')   // the screen fills the child's name where the document writes <name>
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '')
  .replace(/\s+/g, ' ').trim()

/** Split a stretch of markdown into the units a reader sees: lines, list items, table cells. */
function units(md: string, skip: (line: string) => boolean): string[] {
  const out: string[] = []
  for (const raw of md.split('\n')) {
    // A [PLACEHOLDER — …] is a note to the drafters, never words for a parent: it is not on the screen.
    let line = raw.replace(/\[PLACEHOLDER[^\]]*\]/g, '').trim().replace(/^>\s?/, '').trim()
    if (!line || skip(line) || /^\|?\s*-{3,}/.test(line) || line === '---') continue
    if (line.startsWith('|')) { out.push(...line.split('|').map(c => c.trim()).filter(Boolean)); continue }
    // doc 03's B1 button row and "Buttons:" lines: `**[ A ]**    **[ B ]**` and `\`A\` · \`B\``
    const bracketed = [...line.matchAll(/\[ ([^\]]+) \]/g)].map(m => m[1])
    if (bracketed.length) { out.push(...bracketed); continue }
    const ticked = [...line.matchAll(/`([^`]+)`/g)].map(m => m[1])
    if (ticked.length && /^(\*\*|- \*\*)/.test(line)) { out.push(...ticked); continue }
    line = line.replace(/^#{1,6}\s+/, '').replace(/^- /, '')
    out.push(line)
  }
  return out.map(norm).filter(Boolean)
}

const between = (s: string, from: string, to: string) => {
  const a = s.indexOf(from), b = s.indexOf(to, a + from.length)
  if (a < 0 || b < 0) throw new Error(`section markers not found: "${from}" … "${to}" — the document moved; fix the markers, do not weaken the check`)
  return s.slice(a + from.length, b)
}

const en = (xs: (L | string)[]) => xs.map(x => norm(typeof x === 'string' ? x : x.en))

// ── document 02 ──
const D02 = doc('02-coppa-direct-notice-to-parents.md')
const noticeDoc = units(
  between(D02, '## Screen / email title', '### Notes for the attorney'),
  l => l === '## Body' || l === '## Buttons on the screen version',
)
const noticeCopy = en([
  NOTICE.title, NOTICE.intro, NOTICE.collectHeading, ...NOTICE.columns, ...NOTICE.rows.flat(),
  NOTICE.doNotAsk, NOTICE.useHeading, NOTICE.use, NOTICE.thirdParty, NOTICE.weDoNot, ...NOTICE.weDoNotList,
  NOTICE.permissionHeading, NOTICE.permission, NOTICE.permissionHow,
  NOTICE.rightsHeading, NOTICE.rightsIntro, ...NOTICE.rightsList, NOTICE.rightsHow,
  NOTICE.keepHeading, NOTICE.keep, NOTICE.protectHeading, NOTICE.protect,
  NOTICE.detailsHeading, NOTICE.details, NOTICE.contactHeading, ...NOTICE.contact,
  NOTICE.primary, NOTICE.secondary, NOTICE.tertiary,
])

// ── document 03, Path B and the withdrawal screen ──
const D03 = doc('03-consent-and-checkout-screen-copy.md')
const bDoc = units(
  between(D03, '### B1. Consent request email — sent when the parent asks to start', '### Notes for the attorney'),
  l => /^#{2,3} /.test(l) || l === '**Body:**' || l.startsWith('**Timing:**'),
)
const bCopy = en([
  B1.subject, B1.hi, B1.thanks, B1.before, B1.store, ...B1.list, B1.doNot, B1.ignore, B1.details, B1.address, B1.covers, B1.tick, B1.decline,
  B2.heading, ...B2.body,
  B3.subject, B3.hi, B3.yesterday, B3.ifYou, B3.ifNot, B3.anyTime, B3.address,
  WITHDRAW.heading, ...WITHDRAW.body, WITHDRAW.confirm, WITHDRAW.keep,
  // consent-once (2026-09-24): the new screens, each held to document 03 both ways
  ...Object.values(WITHDRAW_ALL), ...Object.values(WAITING), ...Object.values(ATTEST), ...Object.values(REASK),
])

/**
 * ⚠️ DOCUMENT LINES DELIBERATELY NOT ON THE SCREEN — each one because the document itself says so.
 * Doc 03's ⛔ table lists statements that are ahead of the product, with a fix per row; where the fix is
 * "must not be said" until something exists, the line is withheld here by its exact text. The test
 * proves each is still in the document (a stale entry fails) and is NOT on the screen.
 */
const WITHHELD: Record<string, string> = {
  [norm('**Your subscription will be cancelled and we will refund the unused part of it.** You are never charged for exercising a privacy right. The refund reaches your original payment method within 10 business days.')]:
    'doc 03 ⛔: "Withdrawal refunds the unused subscription — True once billing is live; until then it must not be said"',
}

describe('the consent copy is the documents, verbatim', () => {
  it('every withheld line is still in the document, and not on the screen', () => {
    for (const w of Object.keys(WITHHELD)) {
      expect(bDoc, `WITHHELD names a line document 03 no longer has — delete the entry`).toContain(w)
      expect(bCopy, `a withheld line is on the screen: ${WITHHELD[w]}`).not.toContain(w)
    }
  })

  it('never renders a placeholder, and knows it would', () => {
    expect([...noticeCopy, ...bCopy].filter(u => u.includes('PLACEHOLDER'))).toEqual([])
    expect(D02, 'control: document 02 carries placeholders the parser must drop').toMatch(/\[PLACEHOLDER/)
  })

  it('reads the documents at all — positive control', () => {
    expect(noticeDoc.length, 'document 02 yielded almost nothing — the parser is blind, not the copy clean').toBeGreaterThan(40)
    expect(bDoc.length, 'document 03 yielded almost nothing').toBeGreaterThan(25)
    expect(noticeDoc).toContain('How we protect it')
    expect(bDoc).toContain('Thank you — permission recorded')
  })

  it.each([['document 02 (the notice)', noticeDoc, noticeCopy], ['document 03 (B1–B3, withdrawal)', bDoc, bCopy]])(
    '%s — nothing in the document is missing from the screen', (_n, docUnits, copyUnits) => {
      const missing = docUnits.filter(u => !copyUnits.includes(u) && !(u in WITHHELD))
      expect(missing, 'these lines are in the document and not on the screen or in the email').toEqual([])
    })

  it.each([['document 02 (the notice)', noticeDoc, noticeCopy], ['document 03 (B1–B3, withdrawal)', bDoc, bCopy]])(
    '%s — nothing on the screen is absent from the document', (_n, docUnits, copyUnits) => {
      const invented = copyUnits.filter(u => !docUnits.includes(u))
      expect(invented, 'these strings are not in the document — reworded, or invented').toEqual([])
    })

  it('the notice text is the text its version says it is', () => {
    const PINNED: Record<string, string> = {
      // v1 as approved 2026-09-23. A new version is a new line, never an edit to this one.
      'notice-v1': '7e15d9f398ee',
      // v2, 2026-09-23: the v4 export — "your child" not "under 13", username/points/game/feedback rows, one consent path.
      'notice-v2': '366370ec6729',
      // v3, 2026-09-23 (deploy loop D1): withdrawing deletes that child's information and the account stays open.
      'notice-v3': '9631b50821a5',
      // v4, 2026-09-23 (Round 1, R2): "Grade level" was not what is stored — the lessons chosen and a grade
      // band worked out from them, kept as the age range 9–11 / 12–14. No exact grade or age is stored.
      'notice-v4': '7ee78cacb4dc',
      // v5, 2026-09-24 (consent-once): one permission for the account covers every child; each child is attested in the app;
      // withdrawal for one child or every child; Account → Withdraw permission for all my children.
      'notice-v5': '6f9af556a754',
      // v6, 2026-09-24 (the Radlic rename): the product's name and web address (Milo → Radlic, adaptivelearn.radlor.com
      // → radlic.com), and "Withdraw permission for all YOUR children" (was "my"), matching the button and doc 03.
      'notice-v6': 'b24962a84278',
    }
    const h = createHash('sha256').update(noticeCopy.join('\n')).digest('hex').slice(0, 12)
    expect(PINNED[NOTICE_VERSION], `${NOTICE_VERSION} has no pinned hash`).toBeDefined()
    expect(h, `the notice text changed but NOTICE_VERSION is still ${NOTICE_VERSION} — every consent ` +
      'from here on would record the wrong text as "what the parent was shown". Bump the version.').toBe(PINNED[NOTICE_VERSION])
  })
})

describe('Spanish — present everywhere, and never claimed to be reviewed', () => {
  const all: L[] = [
    NOTICE.title, NOTICE.intro, NOTICE.collectHeading, ...NOTICE.columns, ...NOTICE.rows.flat(), NOTICE.doNotAsk,
    NOTICE.useHeading, NOTICE.use, NOTICE.thirdParty, NOTICE.weDoNot, ...NOTICE.weDoNotList, NOTICE.permissionHeading,
    NOTICE.permission, NOTICE.permissionHow, NOTICE.rightsHeading, NOTICE.rightsIntro, ...NOTICE.rightsList,
    NOTICE.rightsHow, NOTICE.keepHeading, NOTICE.keep, NOTICE.protectHeading, NOTICE.protect, NOTICE.detailsHeading,
    NOTICE.details, NOTICE.contactHeading, NOTICE.primary, NOTICE.secondary, NOTICE.tertiary,
    B1.subject, B1.hi, B1.thanks, B1.before, B1.store, ...B1.list, B1.doNot, B1.ignore, B1.details, B1.covers, B1.tick, B1.decline,
    B2.heading, ...B2.body, B3.subject, B3.hi, B3.yesterday, B3.ifYou, B3.ifNot, B3.anyTime,
    WITHDRAW.heading, ...WITHDRAW.body, WITHDRAW.confirm, WITHDRAW.keep, ...Object.values(PROPOSED),
    ...Object.values(WITHDRAW_ALL), ...Object.values(WAITING), ...Object.values(ATTEST), ...Object.values(REASK),
  ]
  it('every string has a Spanish version that is not just the English', () => {
    expect(all.length).toBeGreaterThan(80)
    const bad = all.filter(x => !x.es?.trim() || x.es === x.en).map(x => x.en)
    expect(bad).toEqual([])
  })
  it('the placeholders a screen fills in survive translation', () => {
    for (const x of all) for (const p of x.en.match(/%[A-Z]+%|\{\w+\}/g) ?? [])
      expect(x.es, `"${x.en.slice(0, 40)}…" lost ${p} in Spanish`).toContain(p)
  })
  it('the source says, in words, that the Spanish is unreviewed', () => {
    const src = readFileSync(resolve(ROOT, 'src/features/consent/copy.ts'), 'utf8')
    expect(src).toMatch(/NOT reviewed by a Spanish speaker/)
    expect(src).toMatch(/HAS NOT\s+\*?\s*BEEN REVIEWED BY ANYONE WHO SPEAKS SPANISH/)
  })
})

/**
 * ⚠️ AND WHAT IS ACTUALLY SENT OR PAINTED — not only copy.ts. The checks above compare the copy file to
 * the documents; a sentence added in the email RENDERER or the screen component would never pass
 * through copy.ts and would reach a parent unchecked. So the rendered text of B1, B3 and the withdrawal
 * screen is split into lines, and every line must be a document unit (or one of the renderer's own
 * link lines, named here).
 */
describe('the rendered emails and screen say nothing the documents do not', () => {
  const docLines = new Set([...bDoc, norm(B1.address)])
  const extra = (lines: string[]) => lines.map(l => norm(l.replace(/^- /, '').replace(/ \(https?:[^)]+\)/g, '')))
    .filter(l => l && !docLines.has(l))

  it('B1 and B3, both parts', async () => {
    const { renderB1, renderB3 } = await import('@/features/consent/email')
    // The parent's first name is the one thing the renderer fills in; put the document's {name} back before comparing.
    const named = renderB1('en', 'https://x.test/g', 'Maya')
    const b1 = { ...named, text: named.text.replace('Hi Maya,', 'Hi {name},'), html: named.html.replace('Hi Maya,', 'Hi {name},') }
    const b3 = renderB3('en', 'https://x.test/w')
    const htmlLines = (h: string) => h.split(/<\/(?:p|li)>/).map(s => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))
    // The renderer's own lines: the two buttons in the text part carry their URL.
    const own = (l: string) => /^☐ I've read and agree to the Privacy Policy: https:/.test(l)
    for (const [name, m] of [['B1', b1], ['B3', b3]] as const) {
      expect(extra(m.text.split('\n').filter(l => !own(l))), `${name} text part`).toEqual([])
      expect(extra(htmlLines(m.html).filter(l => !/^I've read and agree to the Privacy Policy$/.test(l.trim()) && !own(l))), `${name} html part`).toEqual([])
      expect(m.text.length, `control: ${name} rendered`).toBeGreaterThan(200)
    }
  })

  it('the withdrawal screen', async () => {
    window.location.hash = '#t=' + 'a'.repeat(43)
    const { vi } = await import('vitest')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 'granted', lang: 'en', name: 'Maya' }), { status: 200 })))
    const React = await import('react')
    const { createRoot } = await import('react-dom/client')
    const { ConsentLink } = await import('@/features/consent/ConsentLink')
    const host = document.createElement('div'); document.body.appendChild(host)
    await React.act(async () => { createRoot(host).render(React.createElement(ConsentLink, { mode: 'withdraw' })) })
    await React.act(async () => { await new Promise(r => setTimeout(r, 20)) })
    vi.unstubAllGlobals()
    const lines = [...host.querySelectorAll('h1, p, button')].map(e => (e.textContent ?? '').replace('Maya', '<name>'))
    expect(lines.length, 'control: the withdrawal screen rendered').toBeGreaterThan(3)
    expect(extra(lines)).toEqual([])
  })
})
