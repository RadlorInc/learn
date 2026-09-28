/**
 * WHAT A CHILD SEES WHEN THEIR ANSWERS CANNOT BE KEPT YET (founder, 2026-09-28): a friendly screen, no error words —
 * driven: a refused child is marked the way lessonSync marks them (childPause), and the real <ConsentPause /> renders.
 * The words it must say and must never say are written out here by hand, not read from the component.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let path = '/modules'
vi.mock('next/navigation', () => ({ usePathname: () => path }))
vi.mock('@/data/repositories/_shared', async (orig) => ({
  ...(await orig<typeof import('@/data/repositories/_shared')>()),
  db: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'child-token' } } }) } }),
}))

// Words a child must never meet here — error words, and the legal ones a five-year-old cannot act on.
const FORBIDDEN = /error|fail|wrong|denied|refus|block|problem|consent|permission|sorry|cannot|can't|invalid|forbidden|not allowed/i

async function render(told: 'sent' | 'none', at: string) {
  path = at
  vi.resetModules()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(told === 'sent' ? { ok: true, sent: true } : { ok: true, sent: false }))))
  const React = await import('react')
  const { act } = React
  const { createRoot } = await import('react-dom/client')
  const { ConsentPause } = await import('@/features/consent/ConsentPause')
  const { markConsentBlocked } = await import('@/features/consent/childPause')
  const host = document.createElement('div'); document.body.appendChild(host)
  await act(async () => { createRoot(host).render(React.createElement(ConsentPause)) })
  await act(async () => { markConsentBlocked('kid-1') })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  return { host, act }
}

beforeEach(() => { document.body.innerHTML = '' })
afterEach(() => { vi.unstubAllGlobals() })

describe('the child\'s screen when their answers wait on the device', () => {
  it('says the work is safe and a grown-up has been sent a message — with no error word', async () => {
    const { host } = await render('sent', '/modules')
    const dialog = host.querySelector('[role="dialog"]')
    expect(dialog, 'no screen appeared for a refused child').not.toBeNull()
    const text = dialog!.textContent ?? ''
    expect(text).toContain('Your work is safe on this device')
    expect(text).toContain('A grown-up needs to say yes')
    expect(text).toContain('We have sent them a message.')
    expect(text).not.toMatch(FORBIDDEN)
  })

  it('when nobody could be emailed it says to ask a grown-up — and never claims a message went', async () => {
    const { host } = await render('none', '/game')
    const text = host.querySelector('[role="dialog"]')?.textContent ?? ''
    expect(text).toContain('Please ask them to open Radlic.')
    expect(text).not.toContain('We have sent them a message')
    expect(text).not.toMatch(FORBIDDEN)
  })

  it('"Keep playing" closes it', async () => {
    const { host, act } = await render('sent', '/lesson/g3m1-t1')
    await act(async () => { host.querySelector<HTMLButtonElement>('[role="dialog"] button')!.click() })
    expect(host.querySelector('[role="dialog"]')).toBeNull()
  })

  it('an adult\'s page never shows it (a dashboard pull can meet the same refusal)', async () => {
    const { host } = await render('sent', '/parent')
    expect(host.querySelector('[role="dialog"]')).toBeNull()
  })

  it('control: the forbidden-word check SEES an error word', () => {
    expect('Something failed: consent error').toMatch(FORBIDDEN)
  })
})
