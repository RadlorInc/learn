/**
 * A crash screen lets a parent tell us (6 Oct): "Report a problem" opens the support email with the device's details,
 * and a server error's digest — the one string that matches the screen to the server log — rides in it.
 * Driven on the real route error screen (app/error.tsx) and the root boundary, clicked, and read back from the link.
 * Expected values are written by hand.
 */
import { it, expect, vi, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import SegmentError from '@/app/error'
import { MiloErrorBoundary } from '@/shared/ui/ErrorBoundary'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

async function reportFrom(el: ReturnType<typeof createElement>) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(el) })
  expect(host.textContent, 'control: the crash screen is showing').toContain('Oops! Something went wrong')
  const btn = [...host.querySelectorAll('button')].find(b => b.textContent === 'Report a problem')
  expect(btn, 'the crash screen has no "Report a problem"').toBeTruthy()
  await act(async () => { btn!.click() })
  let href = ''
  await vi.waitFor(() => {
    href = decodeURIComponent([...host.querySelectorAll('a')].find(a => a.textContent === 'Email support')?.getAttribute('href') ?? '')
    expect(href, 'the device details were never filled in').toContain('--- Radlic diagnostics')
  })
  await act(async () => root.unmount()); host.remove()
  return href
}

it('a server error: the email goes to support with the digest and the device details', async () => {
  const href = await reportFrom(createElement(SegmentError, { error: Object.assign(new Error('x'), { digest: '4242abcd' }), retry: () => {} }))
  expect(href.startsWith('mailto:support@radlor.com?')).toBe(true)
  expect(href).toContain('error code 4242abcd')
})

it('a crash in the app (root boundary): the same report, and no error-code line when there is no digest', async () => {
  function Boom(): never { throw new Error('boom') }
  const href = await reportFrom(createElement(MiloErrorBoundary, null, createElement(Boom)))
  expect(href.startsWith('mailto:support@radlor.com?')).toBe(true)
  expect(href).not.toContain('error code')
})
