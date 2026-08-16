/**
 * The one-line consent notice, shown wherever an adult hands over an address: the signup form and
 * the cold funnel's lead capture.
 *
 * ⚠️ IT LINKS RATHER THAN ASSERTS. A checkbox claiming someone "agreed" to a policy they were never
 * shown is worth nothing and an attorney will say so; a visible link to the actual documents at the
 * moment of submission is the thing that holds up. If the attorney wants an explicit checkbox
 * instead, it goes here and nowhere else.
 *
 * A Server Component — it is two links and a sentence.
 */
import Link from 'next/link'

export function ConsentLine({ align = 'center' }: { align?: 'center' | 'left' }) {
  return (
    <p style={{
      margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color: '#8a7a63', textAlign: align,
    }}>
      By continuing you agree to our{' '}
      <Link href="/legal/terms" style={{ color: '#F26B2C', fontWeight: 700 }}>Terms</Link>
      {' '}and{' '}
      <Link href="/legal/privacy" style={{ color: '#F26B2C', fontWeight: 700 }}>Privacy Policy</Link>.
    </p>
  )
}
