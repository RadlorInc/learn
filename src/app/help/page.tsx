/**
 * /help — the parent-facing FAQ.
 *
 * ⚠️ NOT A DUPLICATE OF `docs/support.md`. That file is the INTERNAL triage process — priority
 * levels, reply templates, how to read a diagnostic block. This is what a parent reads at 9pm
 * instead of emailing, and every answer here is one of the questions §"what arrives" predicts.
 *
 * The three at the top are the three most likely day-one emails (see runbooks/launch-day.md), in
 * that order, because a FAQ nobody scrolls is a FAQ that answers nothing.
 *
 * A Server Component — it is text and links.
 */
import { SUPPORT_EMAIL } from '@/app/site'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help',
  description:
    'Answers to the questions parents ask about AdaptiveLearn: offline play, lost progress, how it decides what to teach, the camera, and choosing the right level for a child.',
  alternates: { canonical: '/help' },
}

/**
 * The visible answer is the ONLY copy of the answer.
 *
 * ⚠️ The obvious way to add FAQ structured data is a second `plain:` string beside each `a`, and
 * that is the duplicate-fact trap this codebase keeps paying for: the two drift, and the one that
 * drifts is the one nobody reads — the machine copy. Walk the element tree instead. It uses no
 * renderer (so `<Link>` needs no router context) and the schema literally cannot disagree with
 * what is on screen.
 */
function plainText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(plainText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return plainText((node as { props: { children?: React.ReactNode } }).props.children)
  }
  return ''
}

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'The app looks wrong, or older than it should',
    a: <>Fully close the app and open it again — not just a refresh. Milo keeps a copy on the device
       so it works offline, and occasionally that copy is a version behind. Reopening replaces it.</>,
  },
  {
    q: 'My child\u2019s progress has disappeared',
    a: <>Almost always it is still there. Milo saves on the device first, so progress follows the
       <strong> browser and device</strong> you played on unless you are signed in. Check you are on the
       same device, in the same browser, and not in a private window. If you are signed in and it is
       still missing, email us — do not start again, we can look.</>,
  },
  {
    q: 'I did not get the sign-in email',
    a: <>Check spam first. If it is not there after a few minutes, email us the address you used and
       we will check whether it was sent.</>,
  },
  {
    q: 'How does Milo decide what to teach?',
    a: <>A short placement check finds the deepest gap worth fixing — not the newest thing your child
       got wrong, but the thing underneath it. After that, every chapter quietly adjusts: it gets
       easier after a wrong answer, harder after a run of right ones, and re-explains if your child
       gets three wrong in a row. There is no timer, no score and no red cross anywhere.</>,
  },
  {
    q: 'Some chapters use the camera. Is that safe?',
    a: <>Yes, and it never leaves the device. In a few chapters a child can answer by holding up
       fingers instead of tapping. The hand is recognised <strong>in the browser</strong> — no image or
       video is uploaded, and nothing from the camera is stored. Every one of those chapters also has
       a tap option, and you can simply never turn the camera on.</>,
  },
  {
    q: 'What do you store about my child, and can I see it?',
    a: <>Their display name and age band, their placement answers, and which chapters they have
       played. You can download a copy of all of it, or delete it permanently, from the{' '}
       <Link href="/parent" style={{ color: '#F26B2C', fontWeight: 700 }}>parent dashboard</Link>.
       Details are in the{' '}
       <Link href="/legal/privacy" style={{ color: '#F26B2C', fontWeight: 700 }}>Privacy Policy</Link>.</>,
  },
  {
    q: 'Does it work without internet?',
    a: <>Yes. Chapters play offline and progress is saved on the device, then synced the next time you
       are online and signed in.</>,
  },
  {
    q: 'My child is between age groups',
    a: <>Use the placement check rather than the age. It is the more honest answer, and Milo will put
       them where they actually are.</>,
  },
]

function HelpJsonLd() {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        // Collapse the whitespace the JSX indentation introduces.
        text: plainText(f.a).replace(/\s+/g, ' ').trim(),
      },
    })),
  }
  return <script type="application/ld+json">{JSON.stringify(json)}</script>
}

export default function HelpPage() {
  return (
    <main style={{
      minHeight: '100dvh', background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
      padding: '28px 20px 60px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: '#F26B2C', textDecoration: 'none' }}>← AdaptiveLearn</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, color: '#3d2516', margin: '14px 0 20px' }}>
          Help
        </h1>

        {FAQ.map(({ q, a }, i) => (
          <section key={i} style={{
            background: 'rgba(255,255,255,.65)', border: '2px solid rgba(61,37,22,.10)',
            borderRadius: 16, padding: '14px 16px', marginBottom: 12,
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#3d2516', margin: '0 0 6px' }}>{q}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#5b4c39' }}>{a}</p>
          </section>
        ))}

        <p style={{ marginTop: 24, fontSize: 15, color: '#5b4c39' }}>
          Still stuck? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#F26B2C', fontWeight: 700 }}>{SUPPORT_EMAIL}</a>
          {' '}— tell us the device and browser, and we will come back to you.
        </p>
      </div>
      <HelpJsonLd />
    </main>
  )
}
