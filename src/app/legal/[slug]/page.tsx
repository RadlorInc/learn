/**
 * /legal/privacy and /legal/terms — one page component, two documents.
 *
 * ⚠️ A SERVER COMPONENT with `generateStaticParams`, so both are static HTML: a policy page must
 * render for someone who is not signed in, on a bad connection, with JS blocked. Nothing here
 * needs the client.
 */
import { SUPPORT_EMAIL } from '@/app/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DOCS, DRAFT } from '../content'

export function generateStaticParams() {
  return DOCS.map(d => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const doc = DOCS.find(d => d.slug === slug)
  if (!doc) return { title: 'AdaptiveLearn' }
  return {
    title: doc.title,
    /**
     * ⚠️ A DRAFT POLICY MUST NOT BE INDEXED. Before this, both documents sat in `PUBLIC_ROUTES`,
     * which feeds `sitemap.ts` — so the app was actively submitting an unreviewed policy full of
     * unresolved markers to every crawler, and a search result for "AdaptiveLearn privacy policy"
     * could have returned a page whose first body line is the word PLACEHOLDER. Checked rather
     * than assumed: there was no `robots` key here and no `/legal` entry in `robots.ts`.
     *
     * ⚠️ GATED ON `DRAFT`, NOT HARD-CODED, so it lifts itself the day the documents are finished
     * — a structure with no flag to remember beats a checklist item that has to be. `follow` stays
     * true: the links out of these pages are ordinary app links and there is no reason to burn
     * them. The pages remain in the sitemap, which noindex overrides; see the session report.
     */
    robots: DRAFT ? { index: false, follow: true } : undefined,
    // ⚠️ Without this every legal page inherited the landing page's marketing description, so all
    // of them advertised a placement check instead of saying what the document is.
    description: `${doc.title} for AdaptiveLearn by Radlor — what we store about a child, who can see it, and how to have it deleted.`,
    alternates: { canonical: `/legal/${doc.slug}` },
  }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = DOCS.find(d => d.slug === slug)
  if (!doc) notFound()

  return (
    <main style={{
      minHeight: '100dvh', background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
      padding: '28px 20px 60px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: '#F26B2C', textDecoration: 'none' }}>← AdaptiveLearn</Link>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, color: '#3d2516', margin: '14px 0 4px' }}>
          {doc.title}
        </h1>
        <p style={{ fontSize: 13, color: '#8a7a63', margin: '0 0 20px' }}>Last updated: {doc.updated}</p>

        {/**
          * ⚠️ LOUD, NOT SUBTLE. A placeholder policy that looks finished is worse than no page — a
          * parent would believe it. This banner is why `DRAFT` exists and why a gate asserts it is
          * false before launch.
          */}
        {DRAFT && (
          /**
           * ⚠️ THIS IS A STATEMENT OF FACT, NOT A CAVEAT, AND IT IS SIZED LIKE ONE. The previous
           * version was one 14px line reading "Draft — this text has not been reviewed by a lawyer
           * and is not final", set below the title in the same weight as a subtitle. A parent
           * skimming for "do they sell my child's data" reads past that. The document it sits on
           * opens with the word PLACEHOLDER and carries unresolved markers in its body, so the
           * honest claim is not "not final" — it is NOT IN FORCE, do not rely on this.
           *
           * ⚠️ IT MUST NOT BE SOFTENED INTO GOOD NEWS. No "we're working on it", no "coming soon".
           * The page exists only because /auth links to it and a dead link from the sign-up screen
           * is worse than a visible draft; that is the whole justification for rendering it at all.
           */
          <div role="alert" style={{
            background: '#991B1B', border: '3px solid #7F1D1D', borderRadius: 14,
            padding: '16px 18px', marginBottom: 24, color: '#fff',
          }}>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 0.3, marginBottom: 6 }}>
              ⚠️ DRAFT — NOT IN FORCE
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.55 }}>
              This is not our published policy and you should not rely on it. No lawyer has
              reviewed it, and parts of it are unfinished and left marked in the text below. It is
              shown here so the links from sign-up are not broken. For anything that matters, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fff', fontWeight: 800 }}>{SUPPORT_EMAIL}</a>.
            </div>
          </div>
        )}

        <div style={{ fontSize: 16, lineHeight: 1.65, color: '#3d2516' }}>
          {renderDoc(doc.body)}
        </div>

        <p style={{ marginTop: 28, fontSize: 14, color: '#6b5c47' }}>
          Questions about your child&apos;s data? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#F26B2C' }}>{SUPPORT_EMAIL}</a>.
          You can download or delete everything from the{' '}
          <Link href="/parent" style={{ color: '#F26B2C' }}>parent dashboard</Link>.
        </p>
      </div>
    </main>
  )
}

/**
 * The four markdown constructs the legal copy actually uses — headings, bold, bullets, blockquote —
 * and a rule. Not a markdown library: these documents are two strings in one file, and a dependency
 * that can render tables and images is a dependency that can also render a link somebody pasted.
 *
 * ⚠️ IT MUST NOT SWALLOW A PLACEHOLDER. `[DATE]`, `[NN]`, `[URL]` and `[LAWYER REVIEW — …]` are
 * bracketed, which is markdown link syntax territory; nothing here touches `[`, so they render as
 * the literal text they are. `legalDraft.test.ts` drives this function and asserts exactly that —
 * a renderer that quietly ate a marker would defeat the whole draft banner.
 */
function inline(text: string, key: string) {
  // Split on **bold** and keep the delimiters, so the emphasis a legal sentence carries survives.
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>
      : <span key={`${key}-${i}`}>{part}</span>,
  )
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
      out.push(<hr key={k} style={{ border: 0, borderTop: '1px solid #e7d9bc', margin: '26px 0' }} />)
      return
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(block.split('\n')[0])
    if (h) {
      const rest = block.split('\n').slice(1).join(' ').trim()
      const size = h[1].length === 1 ? 26 : h[1].length === 2 ? 20 : 17
      out.push(
        <h2 key={k} style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: size,
          color: '#3d2516', margin: '30px 0 8px', lineHeight: 1.25,
        }}>{inline(h[2], k)}</h2>,
      )
      if (rest) out.push(<p key={`${k}-p`} style={{ margin: '0 0 14px' }}>{inline(rest, `${k}-p`)}</p>)
      return
    }
    if (block.startsWith('>')) {
      out.push(
        <blockquote key={k} style={{
          margin: '0 0 18px', padding: '12px 14px', background: '#FFF9E8',
          borderLeft: '4px solid #F6C453', borderRadius: 8, fontSize: 15, color: '#6b5c47',
        }}>{inline(block.split('\n').map(l => l.replace(/^>\s?/, '')).join(' '), k)}</blockquote>,
      )
      return
    }
    if (/^[-*]\s/.test(block)) {
      // A bullet continues onto the next line until the next line that starts one.
      const items: string[] = []
      for (const line of block.split('\n')) {
        if (/^[-*]\s/.test(line)) items.push(line.replace(/^[-*]\s+/, ''))
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
