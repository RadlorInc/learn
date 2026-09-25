/**
 * /legal/<slug> — one page component for every legal document in `registry.ts`.
 *
 * ⚠️ A SERVER COMPONENT with `generateStaticParams`, so every page is static HTML: a policy must
 * render for someone who is not signed in, on a bad connection, with JS blocked.
 *
 * ⚠️ DARK UNTIL A HUMAN FLIPS ITS SWITCH. An unpublished page renders its title and the banner and
 * NOTHING of the document — not a preview, not a draft under a warning. It is `noindex` and it is not in
 * the sitemap. The route exists anyway because the consent emails and the collection screens link to
 * it, and a link to a page that says "not yet in force" is honest where a 404 is not.
 */
import { SUPPORT_EMAIL } from '@/app/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { segments } from '@/features/consent/marks'
import { LEGAL_PAGES, pageBySlug, assertRenderable, publishRefusals, type LegalPage } from '../registry'
import { readDoc, readPublic } from '../source'

export const dynamicParams = false

export function generateStaticParams() {
  return LEGAL_PAGES.map(p => ({ slug: p.slug }))
}

/** A published page that should not be: the build stops here, naming every reason. */
function publishedBody(page: LegalPage): string | null {
  if (!page.published) return null
  const es = page.spanish ? readDoc(page.spanish.source) : null
  const why = publishRefusals(page, readDoc(page.source), es)
  if (why.length) throw new Error(`/legal/${page.slug} is switched on but must not be published:\n  - ${why.join('\n  - ')}`)
  const body = readPublic(page)
  assertRenderable(page, body)
  return body
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = pageBySlug(slug)
  if (!page) return { title: 'Radlic' }
  return {
    title: page.title,
    // ⚠️ A dark page must not be indexed; gated on the switch so it lifts itself when a human flips it.
    robots: page.published ? undefined : { index: false, follow: true },
    description: `${page.title} for Radlic by Radlor.`,
    alternates: { canonical: `/legal/${page.slug}` },
  }
}

export default async function LegalPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = pageBySlug(slug)
  if (!page) notFound()
  const body = publishedBody(page)

  return (
    <main style={{
      minHeight: '100dvh', background: 'linear-gradient(180deg, #EAF5FE 0%, #EFF8FF 100%)',
      padding: '28px 20px 60px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: '#0B4FA8', textDecoration: 'none' }}>← Radlic</Link>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, color: '#083d85', margin: '14px 0 20px' }}>
          {page.title}
        </h1>

        {body === null ? (
          /**
           * ⚠️ A STATEMENT OF FACT, SIZED LIKE ONE, AND NOT SOFTENED INTO GOOD NEWS — no "coming soon".
           * PROPOSED wording (2026-09-23), awaiting the founder: it replaces "parts of it are unfinished
           * and left marked in the text below", which stopped being true when the body stopped rendering.
           */
          <div role="alert" data-legal="dark" style={{
            background: '#991B1B', border: '3px solid #7F1D1D', borderRadius: 14,
            padding: '16px 18px', marginBottom: 24, color: '#fff',
          }}>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 0.3, marginBottom: 6 }}>
              ⚠️ DRAFT — NOT IN FORCE
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.55 }}>
              This document has not been published yet, so nothing is shown here and nothing here is
              in force. For anything that matters, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fff', fontWeight: 800 }}>{SUPPORT_EMAIL}</a>.
            </div>
          </div>
        ) : (
          <>
            {/* The private beta (founder, 2026-09-24): the version, its date, and the promise about changes, on the page. */}
            {page.beta && (
              <p data-legal="beta" style={{
                background: '#F3F9FF', border: '2px solid #F2C94C', borderRadius: 12, padding: '10px 14px',
                margin: '0 0 22px', fontSize: 15, lineHeight: 1.5, color: '#083d85',
              }}>
                <strong>Beta version.</strong> In effect from {page.beta.effective}. We will email parents before we make
                any material change to it.
              </p>
            )}
            {/* break-word, not `anywhere`: a long URL wraps instead of widening the page at 320 px, while a table keeps
                its natural column widths and scrolls in its own box. */}
            <div data-legal="published" style={{ fontSize: 16, lineHeight: 1.65, color: '#083d85', overflowWrap: 'break-word' }}>
              {renderDoc(body)}
            </div>
          </>
        )}

        <p style={{ marginTop: 28, fontSize: 14, color: '#3d6fb8' }}>
          Questions about your child&apos;s data? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#0B4FA8' }}>{SUPPORT_EMAIL}</a>.
          You can download or delete everything from the{' '}
          <Link href="/parent" style={{ color: '#0B4FA8' }}>parent dashboard</Link>.
        </p>
      </div>
    </main>
  )
}

/**
 * The markdown the legal documents use — headings, bold, italic, links, bullets and numbered lists,
 * blockquotes, tables, rules. Not a library: a dependency that can render images and raw HTML is one
 * that can also render something pasted into a draft. Inline marks come from the consent copy's own
 * parser (`segments`), so a link is a link in both places.
 *
 * It never sees a placeholder: `assertRenderable` refuses the text before it gets here.
 */
/** A name in backticks (a cookie, a table) is shown as code, never as bare backticks — which `segments` does not handle,
 *  and which put "`milo-auth`" in front of parents (found 2026-09-24, the first time a page was published). Applied INSIDE
 *  each bold/italic/link segment, so code within bold ("**… `20260923180000` …**") keeps its bold. */
function code(text: string, key: string): React.ReactNode {
  const parts = text.split(/`([^`]+)`/)
  return parts.length === 1 ? text : parts.map((part, i) => i % 2
    ? <code key={`${key}-c${i}`} style={{ fontSize: '0.92em', background: 'rgba(8,61,133,.07)', borderRadius: 4, padding: '0 4px' }}>{part}</code>
    : part)
}

function inline(text: string, key: string) {
  return segments(text).map((x, i) => {
    let n: React.ReactNode = x.href
      ? <a key={`${key}-${i}`} href={x.href.replace(/^https:\/\/radlic\.com(?=\/|$)/, '')} style={{ color: '#0B4FA8' }}>{code(x.text, `${key}-${i}`)}</a>
      : code(x.text, `${key}-${i}`)
    if (x.em) n = <em key={`${key}-${i}`}>{n}</em>
    if (x.bold) n = <strong key={`${key}-${i}`}>{n}</strong>
    return <span key={`${key}-${i}`}>{n}</span>
  })
}

function renderDoc(body: string) {
  const out: React.ReactNode[] = []
  // Blank lines separate blocks; lines INSIDE a block are a hard-wrapped paragraph and are joined,
  // which is what makes the 80-column source file read as prose on a phone.
  const blocks = body.split(/\n\s*\n/)

  blocks.forEach((raw, b) => {
    const block = raw.trim()
    if (!block) return
    const k = `b${b}`

    if (block === '---') {
      out.push(<hr key={k} style={{ border: 0, borderTop: '1px solid #d3e9f9', margin: '26px 0' }} />)
      return
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(block.split('\n')[0])
    if (h) {
      const rest = block.split('\n').slice(1).join(' ').trim()
      const size = h[1].length === 1 ? 26 : h[1].length === 2 ? 20 : 17
      out.push(
        <h2 key={k} style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: size,
          color: '#083d85', margin: '30px 0 8px', lineHeight: 1.25,
        }}>{inline(h[2], k)}</h2>,
      )
      if (rest) out.push(<p key={`${k}-p`} style={{ margin: '0 0 14px' }}>{inline(rest, `${k}-p`)}</p>)
      return
    }
    if (block.startsWith('>')) {
      out.push(
        <blockquote key={k} style={{
          margin: '0 0 18px', padding: '12px 14px', background: '#F7FBFF',
          borderLeft: '4px solid #F6C453', borderRadius: 8, fontSize: 15, color: '#3d6fb8',
        }}>{inline(block.split('\n').map(l => l.replace(/^>\s?/, '')).join(' '), k)}</blockquote>,
      )
      return
    }
    if (block.startsWith('|')) {
      // A table: header row, a --- row, then body rows. Rendered as a real table that scrolls sideways
      // inside itself on a phone, so the page never does.
      const rows = block.split('\n').filter(l => l.startsWith('|') && !/^\|\s*-{3,}/.test(l))
        .map(l => l.split('|').slice(1, -1).map(c => c.trim()))
      const [hd, ...rs] = rows
      out.push(
        <div key={k} style={{ overflowX: 'auto', margin: '0 0 18px' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 14, minWidth: '100%' }}>
            <thead><tr>{hd.map((c, i) => <th key={i} style={cell(true)}>{inline(c, `${k}-h${i}`)}</th>)}</tr></thead>
            <tbody>{rs.map((r, j) => <tr key={j}>{r.map((c, i) => <td key={i} style={cell(false)}>{inline(c, `${k}-${j}-${i}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      )
      return
    }
    if (/^([-*]|\d+\.)\s/.test(block)) {
      // A bullet continues onto the next line until the next line that starts one.
      const items: string[] = []
      for (const line of block.split('\n')) {
        if (/^([-*]|\d+\.)\s/.test(line)) items.push(line.replace(/^([-*]|\d+\.)\s+/, ''))
        else if (items.length) items[items.length - 1] += ' ' + line.trim()
      }
      out.push(
        <ul key={k} style={{ margin: '0 0 16px', paddingLeft: 22 }}>
          {items.map((it, i) => <li key={i} style={{ margin: '0 0 7px' }}>{inline(it, `${k}-${i}`)}</li>)}
        </ul>,
      )
      return
    }
    out.push(<p key={k} style={{ margin: '0 0 14px' }}>{inline(block.split('\n').join(' '), k)}</p>)
  })

  return out
}

const cell = (head: boolean): React.CSSProperties => ({
  border: '1px solid #d3e9f9', padding: '8px 10px', textAlign: 'left', verticalAlign: 'top',
  background: head ? '#F7FBFF' : undefined, fontWeight: head ? 800 : 400,
})
