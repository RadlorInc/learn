'use client'
// Dev-only preview of the Integers pilot chapter (12–14). Mounts the real
// chapter component (which portals itself full-screen). No active learner here,
// so finishAndSync is best-effort — gameplay (intro → lesson → practice → done)
// is what we're verifying.
import { notFound } from 'next/navigation'
import IntegersChapter from '@/features/chapters/game/IntegersChapter'

export default function IntegersPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()   // dev scaffolding — 404 in the shipped app
  return <IntegersChapter onComplete={() => {}} childName="Sam" />
}
