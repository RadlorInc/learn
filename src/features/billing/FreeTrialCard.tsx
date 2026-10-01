'use client'
/**
 * The parent's home card for the free trial: once the family has chosen its two free topics (in the add-a-child sheet or
 * a child's Lessons tab, TrialTopicPicker), it names them and offers the purchase. Nothing while there is no trial.
 */
import Link from 'next/link'
import { findLesson } from '@/features/lessons/modules'
import { dcard, dbtn } from '@/features/dashboard/Helpers'
import { useFamilyTrial } from './TrialTopicPicker'

export function FreeTrialCard() {
  const trial = useFamilyTrial()
  if (trial?.state !== 'chosen') return null
  return (
    <section style={dcard}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Your free trial</h2>
      <p style={{ margin: '6px 0 8px', lineHeight: 1.5 }}>Your children can learn these two topics:</p>
      <ul style={{ margin: '0 0 12px', paddingLeft: 18, lineHeight: 1.6 }}>
        {trial.topics.map(t => <li key={t}>{findLesson(t)?.lesson.title ?? t}</li>)}
      </ul>
      <p style={{ margin: '0 0 12px', lineHeight: 1.5 }}>Want every module? Purchase to unlock every topic, in every grade.</p>
      <Link href="/parent/plan" style={dbtn}>Purchase</Link>
    </section>
  )
}
