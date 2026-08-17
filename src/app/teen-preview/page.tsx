'use client'
// Dev-only: preview any teen chapter by id, e.g. /teen-preview?c=coordinatePlane
import { useEffect, useState } from 'react'
import TasteBanner from '@/features/chapters/story/TasteBanner'
import { CHAPTER_COMPONENTS } from '@/features/chapters/registry'
import type { ChapterType } from '@/core/chapters'

export default function TeenPreviewPage() {
  const [c, setC] = useState('integers')
  const [taste, setTaste] = useState(false)   // ?taste=1 → logged-out free sample from the diagnostic
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setC(p.get('c') || 'integers')
    setTaste(p.get('taste') === '1')
  }, [])
  const Chapter = CHAPTER_COMPONENTS[c as ChapterType]
  if (!Chapter) return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Unknown chapter: {c}</div>
  return <>{<Chapter onComplete={() => {}} childName="Sam" />}{taste && <TasteBanner />}</>
}
