/**
 * AFTER "I GIVE PERMISSION", THE PARENT IS SENT STRAIGHT INTO ADDING THE CHILD — the consent they just gave
 * is what lets the child exist, so B2's button opens the add-a-child flow (`/parent?add=1`) rather than a
 * dashboard where they must find "Add a child" again. Rendered, with the lookup and grant answered as the
 * route answers them.
 */
import { describe, it, expect, vi } from 'vitest'

describe('B2 hands the parent to the add-a-child flow', () => {
  it('the granted screen links to /parent?add=1', async () => {
    window.location.hash = '#t=' + 'a'.repeat(43)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 'granted', lang: 'en' }), { status: 200 })))
    const React = await import('react')
    const { act } = React
    const { createRoot } = await import('react-dom/client')
    const { ConsentLink } = await import('@/features/consent/ConsentLink')
    const host = document.createElement('div'); document.body.appendChild(host)
    await act(async () => { createRoot(host).render(React.createElement(ConsentLink, { mode: 'respond' })) })
    await act(async () => { await new Promise(r => setTimeout(r, 20)) })
    expect(host.textContent, 'control: B2 rendered').toContain('Thank you — permission recorded')
    expect([...host.querySelectorAll('a')].map(a => a.getAttribute('href'))).toContain('/parent?add=1')
    vi.unstubAllGlobals()
  })
})
