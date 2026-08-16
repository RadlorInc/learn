/**
 * /legal/privacy and /legal/terms — one page component, two documents.
 *
 * ⚠️ A SERVER COMPONENT with `generateStaticParams`, so both are static HTML: a policy page must
 * render for someone who is not signed in, on a bad connection, with JS blocked. Nothing here
 * needs the client.
 */
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
  return { title: doc ? `Milo — ${doc.title}` : 'Milo' }
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
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: '#F26B2C', textDecoration: 'none' }}>← Milo</Link>

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
          <div style={{
            background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: 14,
            padding: '12px 14px', marginBottom: 20, color: '#991B1B', fontSize: 14, fontWeight: 700,
          }}>
            ⚠️ Draft — this text has not been reviewed by a lawyer and is not final.
          </div>
        )}

        <div style={{ fontSize: 16, lineHeight: 1.65, color: '#3d2516', whiteSpace: 'pre-wrap' }}>
          {doc.body}
        </div>

        <p style={{ marginTop: 28, fontSize: 14, color: '#6b5c47' }}>
          Questions about your child&apos;s data? Email{' '}
          <a href="mailto:support@mi2utor.com" style={{ color: '#F26B2C' }}>support@mi2utor.com</a>.
          You can download or delete everything from the{' '}
          <Link href="/parent" style={{ color: '#F26B2C' }}>parent dashboard</Link>.
        </p>
      </div>
    </main>
  )
}
