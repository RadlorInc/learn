// @vitest-environment jsdom
/**
 * A teacher adds students under their SCHOOL consent (founder, 13 Nov 2026; migration 20261113130000). Before the first
 * student the roster asks for it; once granted, every student is created under it. The real AddStudents is rendered and
 * clicked; the consent reads and the repository calls are stubbed. Words written out by hand.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

const st = vi.hoisted(() => ({ consent: { k: 'none', fresh: true } as Record<string, unknown>, grant: { ok: true, id: 'sc-1' } as Record<string, unknown> }))
const grantSchoolConsent = vi.fn(async () => { st.consent = { k: 'granted', id: 'sc-1', noticeVersion: 'notice-v9', confirmedAt: '' }; return st.grant })
const createLearner = vi.fn(async () => ({ id: 'kid-1' }))
vi.mock('@/features/consent/consentState', () => ({
  readAccountConsent: async () => st.consent, attestationVersion: async (v: string) => v, grantSchoolConsent,
}))
vi.mock('@/data/repositories', () => ({
  createLearner, setChildLogin: async () => ({ ok: true }), deleteLearnerPermanently: async () => ({ ok: true }),
  createClass: vi.fn(), updateClass: vi.fn(), setClassLessons: vi.fn(),
}))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const FORM = 'One student per line'
const ASK = 'First, your school’s permission'
let host: HTMLElement, root: ReturnType<typeof createRoot>
const settle = () => act(async () => { await new Promise(r => setTimeout(r, 0)) })
async function show() {
  const { AddStudents } = await import('@/features/classes/Classes')
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(createElement(AddStudents, { cls: { id: 'c', name: 'Room 12', grade: 5, lesson_ids: null } as never, onAdded() {}, onDone() {} })) })
  await settle()
}
const btn = (label: string) => [...host.querySelectorAll('button')].find(b => b.textContent?.trim() === label) as HTMLButtonElement
const type = async (el: HTMLInputElement | HTMLTextAreaElement, v: string) => act(async () => {
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')!.set!.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
beforeEach(() => { vi.clearAllMocks(); st.consent = { k: 'none', fresh: true }; st.grant = { ok: true, id: 'sc-1' } })
afterEach(() => { act(() => root.unmount()); host.remove() })

describe('a teacher\'s roster and the school consent', () => {
  it('no consent yet → the school form, and no way to add a student', async () => {
    await show()
    expect(host.textContent).toContain(ASK)
    expect(host.textContent, 'the roster form is on screen without a consent').not.toContain(FORM)
    expect(btn('Give permission').disabled, 'it can be given without a name and the tick').toBe(true)
    await type(host.querySelector('input:not([type])') as HTMLInputElement, 'Lincoln Elementary')
    expect(btn('Give permission').disabled, 'it can be given without the tick').toBe(true)
  })

  it('name + tick → the consent is asked for once, then the roster form opens', async () => {
    await show()
    await type(host.querySelector('input:not([type])') as HTMLInputElement, 'Lincoln Elementary')
    await act(async () => { (host.querySelector('input[type="checkbox"]') as HTMLInputElement).click() })
    await act(async () => { btn('Give permission').click() })
    await settle()
    expect(grantSchoolConsent).toHaveBeenCalledWith('Lincoln Elementary')
    expect(host.textContent).toContain(FORM)
  })

  it('a refusal says why and keeps the form', async () => {
    st.grant = { ok: false, error: 'not_eligible' }
    grantSchoolConsent.mockImplementationOnce(async () => st.grant)
    await show()
    await type(host.querySelector('input:not([type])') as HTMLInputElement, 'Lincoln Elementary')
    await act(async () => { (host.querySelector('input[type="checkbox"]') as HTMLInputElement).click() })
    await act(async () => { btn('Give permission').click() })
    await settle()
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('Only a teacher account with a confirmed email can give school permission.')
    expect(host.textContent).not.toContain(FORM)
  })

  it('consent granted → the roster form, and each student is created UNDER that consent', async () => {
    st.consent = { k: 'granted', id: 'sc-1', noticeVersion: 'notice-v9', confirmedAt: '' }
    await show()
    expect(host.textContent).toContain(FORM)
    expect(host.textContent).not.toContain(ASK)
    await act(async () => { btn('One student').click() })
    await type(host.querySelector('input[aria-label="Username"]') as HTMLInputElement, 'kabir')
    const add = [...host.querySelectorAll('button')].find(b => /^Add/.test(b.textContent ?? '') && !b.disabled)!
    await act(async () => { add.click() })
    await settle()
    expect(createLearner).toHaveBeenCalledTimes(1)
    expect((createLearner.mock.calls[0] as unknown[])[4]).toEqual({ id: 'sc-1', noticeVersion: 'notice-v9' })
  })

  it('the consent cannot be read → try again, never the roster form', async () => {
    st.consent = { k: 'error' }
    await show()
    expect(host.textContent).toContain('Could not check your school’s permission.')
    expect(host.textContent).not.toContain(FORM)
  })
})
