/**
 * The 404 — a mistyped or dead link.
 *
 * ⚠️ NOT a crash screen and NOT reported: a bad URL is a normal thing that happens, and treating it
 * as an incident would bury the real crashes in the monitoring sink.
 *
 * ⚠️ THIS IS THE *STABLE* PATH ON PURPOSE. This Next version also has `global-not-found.js`, which
 * is experimental, needs `experimental.globalNotFound` in the config, and exists for apps that
 * **cannot** compose a 404 from a root layout (multiple root layouts, or a top-level dynamic
 * segment). Milo has one root layout and no top-level dynamic segment, so the stable
 * layout + `not-found.tsx` path covers it — verified by actually requesting an unmatched URL rather
 * than by trusting the doc.
 *
 * A Server Component: the only control is a link, so there is nothing to hydrate, and the page
 * still works if the JS never arrives.
 */
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
      padding: 24, gap: 18, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, lineHeight: 1 }} aria-hidden>🗺️</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F26B2C', margin: 0 }}>
        Milo can&apos;t find that page
      </h1>
      <p style={{ fontSize: 16, color: '#7a6a55', maxWidth: 340, margin: 0, lineHeight: 1.5 }}>
        It might have moved, or the link might be old. Nothing is lost — let&apos;s get you back.
      </p>
      <Link href="/menu" style={{
        marginTop: 6, minHeight: 52, minWidth: 160,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #F26B2C 0%, #e05a1f 100%)',
        color: '#fff', borderRadius: 50, padding: '15px 34px',
        fontSize: 17, fontWeight: 800, textDecoration: 'none',
      }}>
        Go back home
      </Link>
    </div>
  )
}
