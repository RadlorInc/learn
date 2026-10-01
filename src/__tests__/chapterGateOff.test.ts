/**
 * While the paywall is OFF, the gate opens every chapter and never touches the database.
 *
 * The founder's call (2026-09-08): nothing is restricted until the deployment sets `NEXT_PUBLIC_PAYWALL=on`.
 * `PAYWALL_ENABLED` is the client off-switch, and this guards it — with it false, a learner the database would refuse
 * (`claimTopic` → false) still gets `allowed`, and the RPC is not even called. Flip the flag
 * to true and this test's ① goes red (it would lock), which is the reminder that turning the
 * paywall back on is a deliberate change, not a default.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

const { entitledMock } = vi.hoisted(() => ({ entitledMock: vi.fn(async () => false) }))   // DB would REFUSE
vi.mock('@/data/repositories', () => ({ claimTopic: entitledMock }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => ({ id: 'learner-1' }) }))

import { useTopicGate, PAYWALL_ENABLED } from '@/features/billing/useTopicGate'
import type { GateVerdict } from '@/features/billing/chapterGate'

beforeEach(() => { entitledMock.mockClear() })

async function verdict(id: string): Promise<GateVerdict> {
  let out: GateVerdict = 'checking'
  function Probe() { out = useTopicGate(id); return null }
  const host = document.createElement('div')
  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(host)
  await act(async () => { root.render(createElement(Probe)) })
  await act(async () => { await Promise.resolve() })
  await act(async () => { root.unmount() })
  return out
}

describe('paywall off → nothing is gated', () => {
  it('① a chapter the database would refuse is still allowed', async () => {
    expect(PAYWALL_ENABLED).toBe(false)          // the state this test is about
    expect(await verdict('counting')).toBe('allowed')
  })

  it('② the entitlement RPC is never called while off', async () => {
    await verdict('decimals')
    expect(entitledMock).not.toHaveBeenCalled()
  })
})
