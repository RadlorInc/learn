/**
 * THE "CORRECT <NAME>'S DETAILS" CARD, DRIVEN: rendered on the child's Login & data tab, filled in, saved —
 * and what reaches the save handler is what the parent typed and picked. Not a source grep: the card is
 * owner-only, so a render that silently omitted it would otherwise read as "nothing wrong".
 */
import { describe, it, expect, vi } from 'vitest'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push() {}, replace() {} }), usePathname: () => '/parent', useSearchParams: () => new URLSearchParams() }))

async function mount(owner: boolean, onCorrect: (n: string, band: string | null, avatar: number) => Promise<'ok' | 'other'>) {
  const React = await import('react')
  const { act } = React
  const { createRoot } = await import('react-dom/client')
  const { ChildPage } = await import('@/features/dashboard/ChildPage')
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(React.createElement(ChildPage, {
    id: 'k', name: 'Ana', avatar: '/a.png', avatarIndex: 0, tab: 'login', crumb: { href: '/parent', label: 'Home' }, owner,
    lessonIds: null, due: {}, isDone: () => false, login: undefined, wallet: undefined,
    onLaunch() {}, onSaveLessons: async () => 'ok' as never, onSaveGame: async () => {}, onLogin() {}, onCorrect, dataRights: null,
  })) })
  return { host, act }
}

describe('correct a child\'s details', () => {
  it('the owner sees the card, and Save sends the new name, grade band and avatar', async () => {
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
    // The grade is offered as the four bands the database stores — never grades KG–8 (a change within a band
    // would store nothing and still say "Saved."). Each label and the age range it stores, written out by hand
    // (docs/legal/02, notice-v7): the same ranges add-a-child stores (noticeStoredFields.test.ts drives bandOf).
    expect([...select.options].map(o => [o.textContent, o.value])).toEqual([
      ['Keep it as it is', ''], ['Kindergarten', '3-5'], ['Grades 1–2', '6-8'], ['Grades 3–5', '9-11'], ['Grades 6–8', '12-14'],
    ])
    const avatars = [...card!.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')]
    expect(avatars.length, 'the avatar picker did not render').toBe(4)
    await act(async () => { set(input, 'Bea'); set(select, '12-14'); avatars[2].click() })
    await act(async () => { [...card!.querySelectorAll('button')].find(b => b.textContent === 'Save')!.click() })
    expect(onCorrect).toHaveBeenCalledWith('Bea', '12-14', 2)
    expect(card!.textContent).toContain('Saved.')
  })
  it.each([['Kindergarten', '3-5'], ['Grades 1–2', '6-8'], ['Grades 3–5', '9-11'], ['Grades 6–8', '12-14']])(
    'picking %s saves the age range %s', async (label, range) => {
      const onCorrect = vi.fn(async () => 'ok' as const)
      const { host, act } = await mount(true, onCorrect)
      const card = host.querySelector('[data-tour="correct-card"]')!
      const select = card.querySelector('select')!
      const option = [...select.options].find(o => o.textContent === label)
      expect(option, `no "${label}" choice`).toBeDefined()
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(select, option!.value)
        select.dispatchEvent(new Event('change', { bubbles: true }))
      })
      await act(async () => { [...card.querySelectorAll('button')].find(b => b.textContent === 'Save')!.click() })
      expect(onCorrect).toHaveBeenCalledWith('Ana', range, 0)
    })
  it('no avatar is picked to start with, and saving without a pick keeps the current one', async () => {
    const onCorrect = vi.fn(async () => 'ok' as const)
    const { host, act } = await mount(true, onCorrect)
    const card = host.querySelector('[data-tour="correct-card"]')!
    const pressed = [...card.querySelectorAll('button[aria-pressed]')].map(b => b.getAttribute('aria-pressed'))
    expect(pressed).toEqual(['false', 'false', 'false', 'false'])
    await act(async () => { [...card.querySelectorAll('button')].find(b => b.textContent === 'Save')!.click() })
    expect(onCorrect).toHaveBeenCalledWith('Ana', null, 0)
  })
  it('an adult who only views the child does not get the card', async () => {
    const { host } = await mount(false, async () => 'ok')
    expect(host.textContent, 'control: the login tab rendered').toContain('Share with another adult')
    expect(host.querySelector('[data-tour="correct-card"]')).toBeNull()
  })
})
