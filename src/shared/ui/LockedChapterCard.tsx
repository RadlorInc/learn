'use client'
/**
 * What a CHILD sees when they open a chapter their family is not entitled to.
 *
 * ⚠️⚠️ NO PRICE, NO CHECKOUT LINK, NO UPGRADE BUTTON. A child is reading this. Pricing exists on
 * the parent side and nowhere else — `src/__tests__/chapterGate.test.ts` sweeps this module for
 * currency, digits that could be a price, `/api/checkout` and `/parent/plan`, with a positive
 * control so a search that finds nothing is not mistaken for a clean one.
 *
 * ⚠️⚠️ AND IT NAMES WHAT IS BEHIND THE LOCK RATHER THAN SAYING "LOCKED". The camera consent card
 * settled this: it taught a parent that hand-tracking exists in the same breath as refusing them.
 * A lock that explains itself is doing work; one that just refuses is doing none. So the chapter's
 * own emoji, its name and its one-line hint are the body of the card — the child leaves knowing
 * what they are missing, which is also the only honest thing to hand the grown-up they go and ask.
 */
import Link from 'next/link'
import { lockCopy } from '@/features/billing/chapterGate'

export function LockedChapterCard({ chapterId, onBack }: { chapterId: string; onBack?: () => void }) {
  const copy = lockCopy(chapterId)
  return (
    <main style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#FCEAB6', fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: 460, textAlign: 'center', background: '#fff', borderRadius: 20,
        padding: '30px 26px', boxShadow: '0 10px 30px rgba(60,42,20,.14)',
      }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>{copy.emoji}</div>
        <h1 style={{ fontSize: 22, margin: '14px 0 8px', color: '#3c2a14' }}>
          {copy.title} is waiting for you
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: '#6b5a42', margin: '0 0 6px' }}>
          {copy.what}
        </p>
        {copy.hands && (
          <p style={{ fontSize: 15, lineHeight: 1.55, color: '#6b5a42', margin: '0 0 6px' }}>
            This one you play with your hands, through the camera.
          </p>
        )}
        <p style={{ fontSize: 15, lineHeight: 1.55, color: '#6b5a42', margin: '10px 0 20px', fontWeight: 700 }}>
          Ask a grown-up to open it for you.
        </p>
        {onBack ? (
          <button onClick={onBack} style={{
            background: '#F26B2C', color: '#fff', fontWeight: 800, fontSize: 15, border: 'none',
            borderRadius: 50, padding: '12px 26px', cursor: 'pointer',
          }}>← Pick something else</button>
        ) : (
          <Link href="/menu" style={{
            display: 'inline-block', background: '#F26B2C', color: '#fff', fontWeight: 800,
            fontSize: 15, borderRadius: 50, padding: '12px 26px', textDecoration: 'none',
          }}>← Pick something else</Link>
        )}
      </div>
    </main>
  )
}
