'use client'
/**
 * The child's permanent door to the check — one component, so the menu and the preview route that
 *測 measures it cannot drift apart.
 *
 * ⚠️ IT EXISTS AS A COMPONENT FOR A TESTING REASON, AND THAT REASON IS A REAL GAP: `/menu` needs a
 * signed-in learner, and the e2e harness's token 401s on `getLearnerBootstrap`, so every
 * signed-in surface in this app is unverifiable on screen. Extracted here it renders in isolation
 * at 640×320 under `/ui-preview`, where the same properties the start-card spec asserts — every
 * control whole, nothing painted over the words, text equal to its source — can be measured
 * without auth. A second copy of the markup in the preview would have been the drift this repo
 * keeps paying for.
 */
import { CHECK_DOOR } from '@/core/planCopy'

export default function CheckDoor({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="milo-card" style={{
      width: '100%', maxWidth: 700, padding: '12px 20px', textAlign: 'left', cursor: 'pointer',
      background: 'linear-gradient(135deg, #EEF4FF 0%, #fff 100%)', border: '3px solid #6C8FE8',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <span style={{ fontSize: 30, lineHeight: 1 }} aria-hidden>🔍</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17 }}>{CHECK_DOOR.title}</span>
        <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{CHECK_DOOR.blurb}</span>
      </span>
    </button>
  )
}
