/**
 * `/` — the front door, and the only page on this domain a stranger ever sees.
 *
 * ⚠️ IT WAS A REDIRECT WITH A FOX ON IT. Measured on production, the whole document was 66 visible
 * characters: a splash, a session check, and a `router.replace`. So there was no page anywhere on
 * the internet that said what the product is — every link shared, every crawler, every parent who typed
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
 * `/help`'s own "How does Radlic decide what to teach?" answer, the game-time and offline lines are
 * that page's answers in shorter form, and "no timer, no red cross" is the standing anti-fear rule.
 * Rewritten 2026-09-21: it still sold the placement check, story chapters, ages 3–18 and the camera,
 * all deleted. Change the words freely; keep them TRUE, because this is the one page that makes
 * a promise before anybody has played anything.
 */
import { APP_ID, APP_NAME, COMPANY, COMPANY_ID, COMPANY_URL, SUPPORT_EMAIL, SITE_URL } from '@/app/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import ResumeSignedIn from './ResumeSignedIn'
import LessonDemo, { type Demo } from './LessonDemo'
import { G3M5 } from '@/features/lessons/content/g3m5'
import { G8M4 } from '@/features/lessons/content/g8m4'
import type { Lesson } from '@/features/lessons/script'
import s from './landing.module.css'

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
          'Math for grades KG to 8. Each lesson explains one idea step by step, then practice adapts to what the child gets right and wrong. Parents and teachers choose the lessons.',
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
 * Two real teaching screens, read on the server so only their marks and lines reach the browser (the modules
 * themselves are ~230 KB). A missing topic or screen throws at build time rather than shipping an empty board.
 */
function demo(lessons: Lesson[], id: string, screen: number, tag: string): Demo {
  const sc = lessons.find(l => l.id === id)?.screens[screen]
  if (!sc?.chalk || !sc.beats) throw new Error(`landing demo: ${id} screen ${screen + 1} has no chalkboard`)
  return { id, tag, title: sc.title, label: sc.text, marks: sc.chalk, says: sc.beats.map(b => b.say) }
}
const DEMOS: Demo[] = [
  demo(G3M5, 'g3m5-t1', 4, 'Grade 3 · Fractions'),
  demo(G8M4, 'g8m4-t1', 3, 'Grade 8 · Geometry'),
]

const STEPS: { h: string; p: string }[] = [
  { h: 'Watch', p: 'Each lesson explains one idea step by step, the way a good teacher would at the board. A voice reads every line as the chalk goes up.' },
  { h: 'Practice', p: 'Two right answers in a row bring a different, harder kind of question — from a picture to bare numbers to a word problem. A miss brings the worked steps and an easier kind.' },
  { h: 'Review', p: 'Topics they found hard come back later for review, so nothing slips away quietly.' },
]

const AUDIENCE: { h: string; items: string[] }[] = [
  {
    h: 'For parents',
    items: [
      'Pick whole modules or single topics, from any grade from KG to 8',
      'Add a due date if you like',
      'See which lessons they finished and what they find hard',
      'Children earn points by practicing and spend them on game time, up to a daily limit you set',
    ],
  },
  {
    h: 'For teachers',
    items: [
      'Set up a class with usernames and temporary passwords',
      'Choose the modules for the whole class',
      'Give class exercises, and see results per student and per question',
    ],
  },
]

const Check = () => (
  <svg className={s.check} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function RootPage() {
  return (
    <main className={s.page}>
      <ResumeSignedIn />

      <header className={s.nav}>
        <span className={s.brand}>{APP_NAME}</span>
        <Link href="/help" className={s.navLink}>Help</Link>
        <Link href="/auth" className={s.navLink}>Log in</Link>
      </header>

      <section className={s.hero}>
        <div className={s.heroText}>
          <p className={s.eyebrow}>Math · Grade KG to 8</p>
          <h1 className={s.h1}>Math lessons that adapt to your child</h1>
          <p className={s.lead}>
            A teacher at the board, one idea at a time. Then practice that follows what your child gets right
            and wrong, and brings back what they found hard. For parents and teachers.
          </p>
          <div className={s.ctaRow}>
            <Link href="/auth" className={s.cta}>Sign up free</Link>
            <a href="#how" className={s.ctaGhost}>How it works</a>
          </div>
        </div>
        <div className={s.heroDemo}>
          <LessonDemo demos={DEMOS} />
          <p className={s.demoNote}>Two real lesson screens, exactly as a child sees them.</p>
        </div>
      </section>

      <section id="how" className={s.section}>
        <h2 className={s.h2}>How a lesson works</h2>
        <ol className={s.steps}>
          {STEPS.map(({ h, p }, k) => (
            <li key={h} className={s.step}>
              <span className={s.stepN}>{k + 1}</span>
              <h3 className={s.h3}>{h}</h3>
              <p>{p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.calm}>
        <h2 className={s.h2}>Nothing to be scared of</h2>
        <p>
          No timer, and no red cross anywhere. Your child never sees a level. A wrong answer gets another go,
          then the worked steps — never a mark.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>You choose what they learn</h2>
        <div className={s.cards}>
          {AUDIENCE.map(({ h, items }) => (
            <div key={h} className={s.card}>
              <h3 className={s.h3}>{h}</h3>
              <ul className={s.list}>
                {items.map(t => <li key={t}><Check />{t}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className={s.small}>
          If the connection drops during a lesson, their answers are kept on the device and sent when it is back.
        </p>
      </section>

      <section className={s.final}>
        <h2 className={s.h2}>Start with one lesson tonight</h2>
        <Link href="/auth" className={s.cta}>Sign up free</Link>
      </section>

      {/* Standalone controls, so each owes a 44px tap target — bought in padding (`.foot a`). */}
      <footer className={s.foot}>
        <Link href="/help">Help</Link>
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/terms">Terms</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <a href={COMPANY_URL} className={s.maker}>{APP_NAME} is made by {COMPANY}</a>
      </footer>
      <AppJsonLd />
    </main>
  )
}
