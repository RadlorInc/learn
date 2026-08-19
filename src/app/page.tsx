/**
 * `/` — the front door, and the only page on this domain a stranger ever sees.
 *
 * ⚠️ IT WAS A REDIRECT WITH A FOX ON IT. Measured on production, the whole document was 66 visible
 * characters: a splash, a session check, and a `router.replace`. So there was no page anywhere on
 * the internet that said what Milo is — every link shared, every crawler, every parent who typed
 * the name got one emoji. `robots.txt` and `sitemap.xml` now exist and point here, which is
 * plumbing without a building until this page has words in it.
 *
 * ⚠️ A SERVER COMPONENT, DELIBERATELY, AND THAT IS THE WHOLE POINT. Everything below renders in the
 * HTML with no JavaScript: it is what a crawler indexes, what a link preview scrapes, and what a
 * parent on a bad connection reads. The ONE thing that needs the client — sending a signed-in
 * parent to their dashboard — is isolated in `<ResumeSignedIn />` so it cannot take the content
 * with it. `/` is also exempt from `StorageGate` (it reads the Supabase session, never kv), or the
 * fox would be back in the HTML and none of this would be visible.
 *
 * ⚠️ THE COPY IS ASSEMBLED FROM WORDS THAT WERE ALREADY WRITTEN, not invented here — the promise is
 * `/help`'s own "How does Milo decide what to teach?" answer, the camera and offline lines are that
 * page's answers verbatim in shorter form, and "no timer, no score, no red cross" is the standing
 * anti-fear rule. Change the words freely; keep them TRUE, because this is the one page that makes
 * a promise before anybody has played anything.
 */
import { APP_ID, APP_NAME, COMPANY, COMPANY_ID, COMPANY_URL, SUPPORT_EMAIL, SITE_URL } from '@/app/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ResumeSignedIn from './ResumeSignedIn'

export const metadata: Metadata = {
  // The root inherits the layout's title/description; only the canonical is page-specific.
  alternates: { canonical: '/' },
}

/**
 * The only structured data in the app, and it lives here because this is the only page a crawler
 * both reaches and can read — everything else is a signed-in surface.
 *
 * ⚠️ It REFERENCES Radlor by `@id` instead of describing it. The company is declared once, on
 * radlor.com. See the note in `site.ts`.
 */
function AppJsonLd() {
  const json = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': APP_ID,
        name: APP_NAME,
        alternateName: `${APP_NAME} by ${COMPANY}`,
        url: SITE_URL,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web browser',
        description:
          'A short placement check finds the deepest gap under a child\u2019s math, then story chapters teach from there with the difficulty moving question by question. Ages 3 to 18.',
        publisher: { '@id': COMPANY_ID },
        brand: { '@id': COMPANY_ID },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      { '@type': 'Organization', '@id': COMPANY_ID, name: COMPANY, url: COMPANY_URL },
    ],
  }
  return <script type="application/ld+json">{JSON.stringify(json)}</script>
}

const POINTS: { h: string; p: string }[] = [
  {
    h: 'It looks underneath',
    p: 'A short check finds the deepest gap worth fixing — not the newest thing your child got wrong, but the thing underneath it. A fifteen-year-old’s gap sometimes turns out to live in grade four.',
  },
  {
    h: 'Nothing to be scared of',
    p: 'No timer, no score, no red cross anywhere. A chapter gets easier after a wrong answer, harder after a run of right ones, and quietly explains again after three misses.',
  },
  {
    h: 'It is a world, not a worksheet',
    p: 'Every chapter is somewhere to be — a market, a rail line, a building plot — with something to do and someone who needs it done. The math is the thing that makes it work.',
  },
]

export default function RootPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
      padding: '32px 20px 56px',
    }}>
      <ResumeSignedIn />

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
          <Image src="/assets/characters/milo-happy.png" alt="" width={44} height={44} priority
            style={{ objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: '#F26B2C' }}>
            AdaptiveLearn
          </span>
          <Link href="/auth" style={{
            marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: '#7a6a55', textDecoration: 'none',
            minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 8px',
          }}>
            Log in
          </Link>
        </header>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 34, lineHeight: 1.2,
          color: '#3d2516', margin: '0 0 14px',
        }}>
          Find the gap that’s holding your child back in math
        </h1>

        <p style={{ fontSize: 18, lineHeight: 1.6, color: '#5b4c39', margin: '0 0 26px' }}>
          Most math trouble is not about the topic your child is failing today — it is about
          something further down that never quite landed. AdaptiveLearn runs a short placement check to find
          that, then builds a plan that fixes it. Ages 3 to 18.
        </p>

        <Link href="/diagnostic" style={{
          minHeight: 56, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #F26B2C 0%, #e05a1f 100%)', color: '#fff',
          borderRadius: 50, padding: '16px 36px', fontSize: 18, fontWeight: 800, textDecoration: 'none',
        }}>
          Start the free check
        </Link>
        <p style={{ fontSize: 14, color: '#8a7a63', margin: '12px 0 34px' }}>
          No account needed to start. It takes about ten minutes.
        </p>

        {POINTS.map(({ h, p }) => (
          <section key={h} style={{
            background: 'rgba(255,255,255,.65)', border: '2px solid rgba(61,37,22,.10)',
            borderRadius: 16, padding: '14px 16px', marginBottom: 12,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
              color: '#3d2516', margin: '0 0 6px',
            }}>{h}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#5b4c39' }}>{p}</p>
          </section>
        ))}

        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#5b4c39', margin: '22px 0 0' }}>
          Chapters play offline, and progress is saved on the device. A few chapters let a child
          answer by holding up fingers to the camera — that is recognised <strong>in the browser</strong>,
          no image is ever uploaded, and every one of those chapters can be tapped instead.
        </p>

        <footer style={{
          marginTop: 34, paddingTop: 18, borderTop: '2px solid rgba(61,37,22,.10)',
          display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 14,
        }}>
          <Link href="/help" style={{ color: '#F26B2C', fontWeight: 700, textDecoration: 'none' }}>Help</Link>
          <Link href="/legal/privacy" style={{ color: '#F26B2C', fontWeight: 700, textDecoration: 'none' }}>Privacy</Link>
          <Link href="/legal/terms" style={{ color: '#F26B2C', fontWeight: 700, textDecoration: 'none' }}>Terms</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#7a6a55', textDecoration: 'none' }}>{SUPPORT_EMAIL}</a>
          <a href={COMPANY_URL} style={{ color: '#7a6a55', textDecoration: 'none', marginLeft: 'auto' }}>
            {APP_NAME} is made by {COMPANY}
          </a>
        </footer>
        <AppJsonLd />
      </div>
    </main>
  )
}
