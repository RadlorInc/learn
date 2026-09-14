'use client'
/** /parent/topics?learner=<id> — the parent chooses which lesson topics that child sees. */
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentUser } from '@/data/auth'
import { getMyLearners, setLearnerLessons, type LearnerWithRole } from '@/data/repositories'
import { getActiveLearner, setActiveLearner } from '@/data/supabase/useLearnerSession'
import { TopicPicker } from '@/features/lessons/TopicPicker'

export default function TopicsPage() {
  // useSearchParams needs a Suspense boundary on a static page (next docs: use-search-params → Prerendering).
  return <Suspense fallback={null}><Topics /></Suspense>
}

function Topics() {
  const router = useRouter()
  const id = useSearchParams().get('learner')
  const [learner, setLearner] = useState<LearnerWithRole | null | 'loading'>('loading')

  useEffect(() => {
    let off = false
    ;(async () => {
      if (!(await getCurrentUser())) { router.replace('/auth'); return }
      const all = await getMyLearners()
      if (!off) setLearner(all.find(l => l.id === id) ?? null)
    })()
    return () => { off = true }
  }, [id, router])

  if (learner === 'loading') return null
  if (!learner) { router.replace('/parent'); return null }

  return (
    <TopicPicker
      childName={learner.display_name}
      initial={learner.lesson_ids}
      canEdit={learner.accessRole === 'owner'}
      onBack={() => router.push('/parent')}
      onSave={async ids => {
        const r = await setLearnerLessons(learner.id, ids)
        if (r === 'ok') {
          setLearner({ ...learner, lesson_ids: ids })
          // The child's screens read a copy of the learner saved when "Start learning" was tapped; keep it in step.
          const active = getActiveLearner()
          if (active?.id === learner.id) setActiveLearner({ ...active, lesson_ids: ids })
        }
        return r
      }}
    />
  )
}
