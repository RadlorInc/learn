/**
 * After a crash the root boundary's way home must be somewhere a CHILD can use. It used to be /parent, which is behind
 * the parent PIN (ParentPinGate), so a child who hit a crash could not get back to their lessons.
 * Rendered and read back after the crash; the expected route is written out by hand.
 */
import { it, expect, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { MiloErrorBoundary } from '@/shared/ui/ErrorBoundary'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Boom(): never { throw new Error('boom') }

it('the crash screen offers the child\'s lessons and a retry — never the PIN-gated /parent', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
  const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(createElement(MiloErrorBoundary, null, createElement(Boom))) })

  expect(host.textContent, 'control: the crash screen is showing').toContain('Oops! Something went wrong')
  const home = [...host.querySelectorAll('a')].find(a => a.textContent === 'Go back home')
  expect(home?.getAttribute('href')).toBe('/modules')
  expect(host.innerHTML).not.toContain('/parent')
  expect([...host.querySelectorAll('button')].map(b => b.textContent)).toContain('Try again')

  await act(async () => root.unmount()); host.remove()
  quiet.mockRestore(); vi.unstubAllGlobals()
})
