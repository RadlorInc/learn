'use client'
/**
 * The topic gate's wiring. Asks the database once, per topic (a lesson, a `c:<chapter>`, or a module's mixed practice),
 * before it mounts — and that one question also claims it as one of the family's two free topics when a slot is left
 * (`claim_topic`, 20261001120000).
 *
 * ⚠️⚠️ RESOLVED ONCE AND NEVER REVISITED — THAT IS WHAT MAKES "NEVER MID-CHAPTER" STRUCTURAL. The
 * rule is that a child who has started finishes, and the way to keep it is not to remember to keep
 * it: the effect keys on the chapter id, the answer is written once, and `/game` does not mount the
 * chapter component at all until the verdict is `allowed`. There is no later evaluation for a
 * re-render to flip, so there is no state in which a question can be interrupted by money.
 */
import { useEffect, useState } from 'react'
import { claimTopic } from '@/data/repositories'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { gateVerdict, type GateVerdict } from '@/features/billing/chapterGate'

/**
 * ⚠️ PAYWALL OFF unless the deployment says `NEXT_PUBLIC_PAYWALL=on`. This is the CLIENT off-switch, independent
 * of `billing_config.enforced`: while off the gate never asks the database and can never return
 * `locked`, so no stray entitlement row or a mis-flipped DB flag can lock a child out.
 * Turn on = set the env var on the deployment (staging first) AND set `billing_config.enforced` — with only the env
 * var, the database answers TRUE for everything and records nothing.
 */
export const PAYWALL_ENABLED = process.env.NEXT_PUBLIC_PAYWALL === 'on'

export function useTopicGate(topic: string | null): GateVerdict {
  // `undefined` = not answered yet · `null` = asked and could not find out (→ allowed).
  // Keyed by the topic it answers, so moving to another topic shows 'checking', never the last topic's answer.
  const [answer, setAnswer] = useState<{ topic: string; v: boolean | null }>()
  // Read once, at mount, for the same reason: a learner switching under a live chapter must not
  // re-gate the child who is already playing.
  const [learnerId] = useState<string | null>(() => {
    try { return getActiveLearner()?.id ?? null } catch { return null }
  })

  useEffect(() => {
    if (!PAYWALL_ENABLED) return           // paywall off → never ask the database
    if (!topic || !learnerId) return
    let live = true
    claimTopic(learnerId, topic)
      .then(v => { if (live) setAnswer({ topic, v }) })
      // ⚠️ null, not false. A failed lookup is not a refusal — see chapterGate.gateVerdict.
      .catch(() => { if (live) setAnswer({ topic, v: null }) })
    return () => { live = false }
  }, [topic, learnerId])

  // ⚠️ DERIVED DURING RENDER, not assigned inside the effect. An effect runs after paint, so
  // setting the verdict there paints one frame of the previous chapter's answer — the same rule
  // this repo carries for a journey's phase and for the camera guard, and here it would mean one
  // frame of a chapter a child is about to be refused.
  if (!PAYWALL_ENABLED) return 'allowed'  // paywall off → never lock
  return gateVerdict(learnerId, topic && answer?.topic === topic ? answer.v : undefined)
}
