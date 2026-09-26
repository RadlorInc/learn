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

/* The adult surface's palette, from globals.css — same tokens the other parent screens use.
   These pages previously mixed ad-hoc greys (#888 / #6b7280 / #1a1a1a / #f7f8fa) with the brand
   colours, so each one read as a slightly different product. */
const P = {
  page:   'var(--paper)',
  card:   'var(--paper-soft)',
  edge:   'var(--card-border)',
  ink:    'var(--ink)',
  ink2:   'var(--ink-soft)',
  ink3:   'var(--ink-muted)',
  accent: 'var(--milo-orange)',
} as const


export const metadata: Metadata = {
  title: 'Help',
  description:
    'Answers to the questions parents ask about Radlic: lost progress, how lessons adapt, what we store, child logins, game time, and choosing where a child starts.',
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
    a: <>Fully close the app and open it again — not just a refresh. Radlic keeps a copy on the device
       so it works offline, and occasionally that copy is a version behind. Reopening replaces it.</>,
  },
  {
    q: 'My child\u2019s progress has disappeared',
    a: <>Almost always it is still there. Finished lessons are saved to your child&apos;s profile, so check
       that the right child is signed in, or that you opened the right child from your{' '}
       <Link href="/parent" style={{ color: '#F26B2C', fontWeight: 700 }}>dashboard</Link>. If the connection dropped, their answers are
       kept on the device and sent when it is back. Still missing? Email us — do not start again, we can look.</>,
  },
  {
    q: 'I did not get the sign-in email',
    a: <>Check spam first. If it is not there after a few minutes, email us the address you used and
       we will check whether it was sent.</>,
  },
  {
    q: 'How does Radlic decide what to teach?',
    a: <>You choose. On your dashboard you pick what your child sees: whole modules or single topics,
       from any grade from K to 8, or simply every topic. Each lesson explains one idea step by step,
       then practice adjusts to your child: two right in a row brings a different, harder kind of
       question; needing help brings an easier one; and topics they found hard come back later for
       review. Your child never sees a level, a timer or a red cross.</>,
  },
  {
    q: 'Which grade should my child start in?',
    a: <>Start with their school grade. If it feels too hard, choose a module from the grade before; if it
       feels too easy, choose one from the grade after. You can mix grades and change the choice any
       time from your child&apos;s Lessons tab.</>,
  },
  {
    q: 'How does my child sign in on their own?',
    a: <>Give them a username and password from the Login &amp; data tab on their page in your dashboard. They
       sign in with it on any device and go straight to their lessons. If they forget it, set a new one
       there. Teachers do the same from a class&apos;s Students tab.</>,
  },
  {
    q: 'What is game time?',
    a: <>Your child earns points by practicing and can spend them on minutes of a building game. It starts
       on, at up to 20 minutes a day. You can turn it off or change the daily limit on the Game time tab
       on their page.</>,
  },
  {
    q: 'What do you store about my child, and can I see it?',
    a: <>Their name, the lessons you chose for them, which lessons they finished and how their practice
       went, their points and game-time settings, and their login username if you set one. You can
       download a copy of all of it, or delete it permanently, from the Login &amp; data tab on their page in
       your{' '}<Link href="/parent" style={{ color: '#F26B2C', fontWeight: 700 }}>dashboard</Link>.
       Details are in the{' '}
       <Link href="/legal/privacy" style={{ color: '#F26B2C', fontWeight: 700 }}>Privacy Policy</Link>.</>,
  },
  {
    q: 'What if the internet drops during a lesson?',
    a: <>Your child can carry on. Their answers are kept on the device and sent the next time it is online.</>,
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
      minHeight: '100dvh', background: P.page,
      padding: '28px 20px 60px',
    }}>
      <div className="adult-doc">
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: '#F26B2C', textDecoration: 'none' }}>← Radlic</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30, color: P.ink, margin: '14px 0 20px' }}>
          Help
        </h1>

        {FAQ.map(({ q, a }, i) => (
          <section key={i} style={{
            background: 'rgba(255,255,255,.65)', border: '2px solid rgba(61,37,22,.10)',
            borderRadius: 16, padding: '14px 16px', marginBottom: 12,
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: P.ink, margin: '0 0 6px' }}>{q}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: P.ink2 }}>{a}</p>
          </section>
        ))}

        <p style={{ marginTop: 24, fontSize: 15, color: P.ink2 }}>
          Still stuck? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#F26B2C', fontWeight: 700 }}>{SUPPORT_EMAIL}</a>
          {' '}— tell us the device and browser, and we will come back to you.
        </p>
      </div>
      <HelpJsonLd />
    </main>
  )
}
