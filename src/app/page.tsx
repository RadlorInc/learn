/**
 * `/` on radlic.com — no longer the landing page. Since 2026-09-25 (founder's decision) the landing page is on
 * radlor.com (`LANDING_URL`, built in the radlor-site repo), and the app stays here. This page only routes:
 * signed in → home, signed out → the landing page (`ResumeSignedIn.tsx`); the markup below is the fallback.
 *
 * ⚠️ A SERVER COMPONENT, and exempt from `StorageGate`, so the fallback and the structured data are in the HTML with
 * no JavaScript. The `SoftwareApplication` block stays: the landing page declares the SAME `@id`, and the two merge.
 */
import { APP_ID, APP_NAME, COMPANY, COMPANY_ID, COMPANY_URL, LANDING_URL, SUPPORT_EMAIL } from '@/app/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import ResumeSignedIn from './ResumeSignedIn'

export const metadata: Metadata = {
  // The home page is `LANDING_URL`; this URL only routes a visitor there or home. Search engines are told so.
  alternates: { canonical: LANDING_URL },
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
        url: LANDING_URL,   // the landing page on radlor.com emits the same @id with this url
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web browser',
        description:
          'Math for grades 3 to 8. Each lesson explains one idea step by step, then practice adapts to what the child gets right and wrong. Parents choose the lessons.',
        publisher: { '@id': COMPANY_ID },
        brand: { '@id': COMPANY_ID },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      { '@type': 'Organization', '@id': COMPANY_ID, name: COMPANY, url: COMPANY_URL },
    ],
  }
  return <script type="application/ld+json">{JSON.stringify(json)}</script>
}

/**
 * The home page itself is `LANDING_URL`, on radlor.com (founder's decision, 2026-09-25). This page only
 * decides where a visitor goes. `<ResumeSignedIn />` sends a signed-in user home and a signed-out visitor to the
 * landing page. What follows is what shows for that moment, and all a visitor without JavaScript ever sees: a way
 * to each. It is deliberately NOT a redirect in next.config: the server cannot see a sign-in (it is in
 * localStorage), so a 308 would send signed-in parents away too.
 */
export default function RootPage() {
  return (
    <main style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: '32px 20px', background: '#F7FBFF', textAlign: 'center',
    }}>
      <ResumeSignedIn />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: '#083D85' }}>{APP_NAME}</span>
      <p style={{ fontSize: 17, color: '#3d6fb8', margin: 0 }}>Math lessons that adapt to your child.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/auth" style={{
          minHeight: 48, display: 'inline-flex', alignItems: 'center', padding: '0 26px', borderRadius: 999,
          background: '#083D85', color: '#fff', fontWeight: 800, textDecoration: 'none',
        }}>Log in or sign up</Link>
        <a href={LANDING_URL} style={{
          minHeight: 48, display: 'inline-flex', alignItems: 'center', padding: '0 20px', borderRadius: 999,
          border: '2px solid rgba(8,30,70,.14)', color: '#083d85', fontWeight: 700, textDecoration: 'none',
        }}>What is {APP_NAME}?</a>
      </div>
      <footer style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 4, fontSize: 14, marginTop: 12 }}>
        <Link href="/help" style={tapRow}>Help</Link>
        <Link href="/legal/privacy" style={tapRow}>Privacy</Link>
        <Link href="/legal/terms" style={tapRow}>Terms</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`} style={tapRow}>{SUPPORT_EMAIL}</a>
        <a href={COMPANY_URL} style={tapRow}>{APP_NAME} is made by {COMPANY}</a>
      </footer>
      <AppJsonLd />
    </main>
  )
}

/** A footer link's hit area: 44px tall, bought in padding. */
const tapRow = { display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 8px', color: '#3d6fb8', textDecoration: 'none' } as const
