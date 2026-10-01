'use client'
/**
 * The parent's side of the free trial (20261001120000): which of the family's two free topics are used, and the way to
 * pay and go on. Shown on /parent only while the paywall is on and the family has no paid plan. The child's side,
 * LockedChapterCard, carries no price; this is where the price is reached.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HOLDS_SEATS } from '@/core/billing'
import { getChapter } from '@/core/chapters'
import { findLesson } from '@/features/lessons/modules'
import { getMySubscription, myFreeTopics, type MySubscription } from '@/data/repositories/billing'
import { dcard, dbtn } from '@/features/dashboard/Helpers'
import { PAYWALL_ENABLED } from '@/features/billing/useTopicGate'

const FREE = 2   // the count claim_topic allows; the database is the one that enforces it

const nameOf = (topic: string) => topic.startsWith('c:')
  ? getChapter(topic.slice(2) as Parameters<typeof getChapter>[0])?.name ?? topic
  : findLesson(topic)?.lesson.title ?? topic

export function FreeTrialCard() {
  return PAYWALL_ENABLED ? <Trial /> : null
}

function Trial() {
  const [used, setUsed] = useState<string[] | null>()
  const [sub, setSub] = useState<MySubscription | null>()
  useEffect(() => { myFreeTopics().then(setUsed); getMySubscription().then(s => setSub(s ?? null)) }, [])

  // Paying, or not known yet / could not find out: say nothing rather than something wrong.
  if (used == null || sub === undefined || (sub && HOLDS_SEATS.has(sub.status))) return null
  const left = Math.max(0, FREE - used.length)
  return (
    <section style={dcard}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Free trial: {used.length} of {FREE} topics used</h2>
      <p style={{ margin: '6px 0 12px', lineHeight: 1.5 }}>
        {left > 0
          ? `Your children can open any ${left === FREE ? 'two topics' : 'one more topic'} free, from any grade. After that, pay and continue with everything.`
          : 'Liked it? Pay and continue with every topic, every grade, for your children.'}
      </p>
      {used.length > 0 && (
        <ul style={{ margin: '0 0 12px', paddingLeft: 18, lineHeight: 1.6 }}>
          {used.map(t => <li key={t}>{nameOf(t)}</li>)}
        </ul>
      )}
      <Link href="/parent/plan" style={dbtn}>Pay and continue</Link>
    </section>
  )
}
