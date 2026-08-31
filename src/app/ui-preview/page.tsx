'use client'
/**
 * Dev-only preview of the signed-in surfaces, so their LAYOUT can be measured without a session.
 *
 * ⚠️⚠️ WHY THIS ROUTE EXISTS, AND IT IS A FINDING RATHER THAN A CONVENIENCE. Every signed-in screen
 * in this app is unverifiable on screen today: the e2e harness's token 401s on
 * `getLearnerBootstrap`, so `/menu` bounces to `/parent` and a spec grades the wrong page. That is
 * a standing tax on everything built after it — and on this session's evidence, layout is exactly
 * where the misses live (an occluded line, a truncated one, a control pushed off a short frame),
 * none of which a unit test can see.
 *
 * So the components render here in isolation, from the SAME source the real screens use — never a
 * second copy of the markup, which is the drift this repo keeps paying for. It 404s in production,
 * like `/sim-preview`.
 *
 * ⚠️ It is NOT a substitute for driving the real screen. It proves the layout of a component at a
 * size; it cannot prove the component is reachable, or that the screen around it agrees. Fixing the
 * 401 is still the thing worth doing — see the PR.
 */
import { notFound } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import CheckDoor from '@/shared/ui/CheckDoor'
import { planLine, swapCopy } from '@/core/planCopy'

function Surfaces() {
  const p = useSearchParams().get('p') ?? 'door'
  const swap = swapCopy(4, 7, 9)
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 14, padding: 16, background: 'var(--bg-page, #FDF6E3)', boxSizing: 'border-box' }}>
      {p === 'door' && <CheckDoor onOpen={() => {}} />}

      {/* The plan card's sub-line, in the four states it has. The card itself is the menu's; what is
          measured here is the WORDS — the one thing tsc, the build and a mutation score say nothing
          about, and the only place a child is told WHY a chapter they finished has come back. */}
      {p === 'plan' && (
        <div data-t="plan-lines" style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([['diagnostic', false], ['diagnostic', true], ['gradeStart', false], ['gradeStart', true]] as const).map(([src, played]) => (
            <div key={`${src}${played}`} className="milo-card" style={{ padding: '10px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#1e9e5f', fontWeight: 700 }}>
                {src}{played ? ' · already played' : ''}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{planLine(src, played)}</div>
            </div>
          ))}
        </div>
      )}

      {p === 'swap' && (
        <div data-t="swap" className="milo-card" style={{ width: '100%', maxWidth: 700, padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20 }}>{swap.title}</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '8px 0 14px', lineHeight: 1.45 }}>{swap.body}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ minHeight: 44, borderRadius: 50, padding: '10px 20px', border: 'none', background: '#F26B2C', color: '#fff', fontWeight: 800 }}>{swap.cta}</button>
            <button style={{ minHeight: 44, borderRadius: 50, padding: '10px 20px', border: '2px solid #bbb', background: 'transparent', fontWeight: 700 }}>{swap.alt}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UiPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()   // dev scaffolding — 404 in the shipped app
  return <Suspense><Surfaces /></Suspense>
}
