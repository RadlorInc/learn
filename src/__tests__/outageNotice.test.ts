/**
 * The outage notice switch (founder, 6 Oct 2026): `OUTAGE_NOTICE` unset → nothing; set → that text at the top of the
 * page, as TEXT; `on` → the default sentence (English, or Spanish on a device saved to Spanish); over-long → capped.
 *
 * Each case runs the real chain: the env var → `GET /api/notice` (the route itself, its `fetch` answered by calling
 * it) → the bar in the root layout's component. The expected sentences are written out here, not imported.
 */
import { describe, it, expect, afterEach } from 'vitest'

const flush = () => new Promise((r) => setTimeout(r, 0))
let unmount: () => Promise<void> = async () => {}

afterEach(async () => {
  await unmount()
  delete process.env.OUTAGE_NOTICE
  localStorage.clear()
  document.body.innerHTML = ''
})

async function mount(env: string | undefined): Promise<HTMLElement> {
  if (env === undefined) delete process.env.OUTAGE_NOTICE
  else process.env.OUTAGE_NOTICE = env
  const { GET } = await import('@/app/api/notice/route')
  globalThis.fetch = (async (url: string) => {
    expect(url).toBe('/api/notice')
    return GET()
  }) as typeof fetch
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { default: OutageNotice } = await import('@/shared/ui/OutageNotice')
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await React.act(async () => { root.render(React.createElement(OutageNotice)); await flush(); await flush() })
  unmount = async () => { await React.act(async () => root.unmount()) }
  return host
}

const bar = (host: HTMLElement) => host.querySelector('[role="status"]')

describe('outage notice', () => {
  it('unset → no notice at all', async () => {
    const host = await mount(undefined)
    expect(host.innerHTML).toBe('')
  })

  it('blank → no notice', async () => {
    expect((await mount('   ')).innerHTML).toBe('')
  })

  it('set → the founder\'s words, and an HTML string is shown literally, not rendered', async () => {
    const host = await mount('<b>Sign-in</b> is down <img src=x onerror=alert(1)>')
    expect(bar(host)?.textContent).toContain('<b>Sign-in</b> is down <img src=x onerror=alert(1)>')
    expect(host.querySelector('b, img')).toBeNull()
  })

  it('"on" → the default sentence in English', async () => {
    const host = await mount('on')
    expect(bar(host)?.textContent).toContain('We’re fixing a problem. Your child’s progress is safe.')
  })

  it('"on" → Spanish on a device saved to Spanish', async () => {
    localStorage.setItem('al-lang', 'es')
    const host = await mount(' ON ')
    expect(bar(host)?.textContent).toContain('Estamos solucionando un problema. El progreso de su hijo está a salvo.')
  })

  it('over-long text is capped at 160 characters, ending in an ellipsis', async () => {
    const host = await mount('a'.repeat(400))
    const text = bar(host)!.querySelector('span')!.textContent!
    expect(text).toBe('a'.repeat(159) + '…')
  })

  it('the × hides it for this page view only; a new page load shows it again', async () => {
    let host = await mount('on')
    const React = await import('react')
    await React.act(async () => { host.querySelector('button')!.click() })
    expect(bar(host)).toBeNull()
    await unmount()
    host = await mount('on')
    expect(bar(host)).not.toBeNull()
  })
})
