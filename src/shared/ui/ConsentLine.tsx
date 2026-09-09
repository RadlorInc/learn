/**
 * The one-line consent notice, shown wherever an adult hands over an address: the signup form and
 * the cold funnel's lead capture (`features/diagnostic/EmailGate.tsx`).
 *
 * ⚠️ IT LINKS RATHER THAN ASSERTS. A checkbox claiming someone "agreed" to a policy they were never
 * shown is worth nothing and an attorney will say so; a visible link to the actual documents at the
 * moment of submission is the thing that holds up. If the attorney wants an explicit checkbox
 * instead, it goes here and nowhere else.
 *
 * The default colours are /auth's (cream page, warm ink); a dark surface passes its own — the
 * defaults on `PT.bg0` measure 4.5:1, the floor and no more, and the orange is another page's accent.
 *
 * A Server Component — it is two links and a sentence.
 */
import Link from 'next/link'

export function ConsentLine({ align = 'center', color = '#8a7a63', linkColor = '#F26B2C' }: {
  align?: 'center' | 'left'; color?: string; linkColor?: string
}) {
  return (
    <p style={{
      margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color, textAlign: align,
    }}>
      By continuing you agree to our{' '}
      <Link href="/legal/terms" style={{ color: linkColor, fontWeight: 700 }}>Terms</Link>
      {' '}and{' '}
      <Link href="/legal/privacy" style={{ color: linkColor, fontWeight: 700 }}>Privacy Policy</Link>.
    </p>
  )
}
