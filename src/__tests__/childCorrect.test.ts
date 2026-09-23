/**
 * THE "CORRECT <NAME>'S DETAILS" CARD, DRIVEN: rendered on the child's Login & data tab, filled in, saved —
 * and what reaches the save handler is what the parent typed and picked. Not a source grep: the card is
 * owner-only, so a render that silently omitted it would otherwise read as "nothing wrong".
 */
import { describe, it, expect, vi } from 'vitest'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push() {}, replace() {} }), usePathname: () => '/parent', useSearchParams: () => new URLSearchParams() }))

async function mount(owner: boolean, onCorrect: (n: string, g: number | null) => Promise<'ok' | 'error'>) {
  const React = await import('react')
  const { act } = React
  const { createRoot } = await import('react-dom/client')
  const { ChildPage } = await import('@/features/dashboard/ChildPage')
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(React.createElement(ChildPage, {
    id: 'k', name: 'Ana', avatar: '/a.png', tab: 'login', crumb: { href: '/parent', label: 'Home' }, owner,
    lessonIds: null, due: {}, isDone: () => false, login: undefined, wallet: undefined,
    onLaunch() {}, onSaveLessons: async () => 'ok' as never, onSaveGame: async () => {}, onLogin() {}, onCorrect, dataRights: null,
  })) })
  return { host, act }
}

describe('correct a child\'s details', () => {
  it('the owner sees the card, and Save sends the new name and grade', async () => {
    const onCorrect = vi.fn(async () => 'ok' as const)
    const { host, act } = await mount(true, onCorrect)
    const card = host.querySelector('[data-tour="correct-card"]')
    expect(card, 'the correction card did not render for the owner').not.toBeNull()
    const input = card!.querySelector('input')!, select = card!.querySelector('select')!
    const set = (el: HTMLInputElement | HTMLSelectElement, v: string) => {
      const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLSelectElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v)
      el.dispatchEvent(new Event(el instanceof HTMLInputElement ? 'input' : 'change', { bubbles: true }))
    }
    await act(async () => { set(input, 'Bea'); set(select, '7') })
    await act(async () => { card!.querySelector('button')!.click() })
    expect(onCorrect).toHaveBeenCalledWith('Bea', 7)
    expect(card!.textContent).toContain('Saved.')
  })
  it('an adult who only views the child does not get the card', async () => {
    const { host } = await mount(false, async () => 'ok')
    expect(host.textContent, 'control: the login tab rendered').toContain('Share with another adult')
    expect(host.querySelector('[data-tour="correct-card"]')).toBeNull()
  })
})
