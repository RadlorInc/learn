/**
 * ADDING STUDENTS IS PAUSED WHILE THE CONSENT GATE IS LIVE — A MESSAGE, NOT AN ERROR (deploy loop D1).
 *
 * From migration 20260923120000 every new child needs a parent's granted consent, and no consent route
 * fits a school, so every roster add would be refused with P0C01. The founder's call: the roster says
 * so plainly instead of letting a teacher type a class list and watch each row fail.
 *
 * ⚠️ BOTH HALVES. A roster that was ALWAYS paused would pass a paused-only check and silently stop
 * every teacher today, before the gate exists — so the form must still appear while the consent table
 * is missing, and on any other error (whose per-row failures stay visible).
 * The wording is written out here by hand on purpose: a check that imported it would pass through any
 * rewording.
 */
import { describe, it, expect, vi } from 'vitest'

const db = vi.hoisted(() => ({ answer: { data: [] as unknown, error: null as unknown } }))
vi.mock('@/data/supabase/client', () => {
  const chain = (): unknown => new Proxy(() => {}, {
    get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r(db.answer) : chain()),
    apply: () => chain(),
  })
  return { createClient: () => ({ from: () => chain(), rpc: () => chain() }) }
})

async function paint(): Promise<string> {
  const React = await import('react')
  const { act } = React
  const { createRoot } = await import('react-dom/client')
  const { AddStudents } = await import('@/features/classes/Classes')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(React.createElement(AddStudents, { cls: { id: 'c', name: 'Room 12', grade: 5 } as never, onAdded() {}, onDone() {} }))
  })
  await act(async () => { await new Promise(r => setTimeout(r, 30)) })
  const text = host.textContent ?? ''
  const html = host.innerHTML
  await act(async () => { root.unmount() })
  host.remove()
  return `${text}\n${html}`
}

const PAUSED = 'Adding students is paused for now.'
const WHY = 'We are still setting up how a school gives permission for a child to use Radlic. Until that is ready, new students cannot be added to a class. Students already in your class are not affected.'
const FORM = 'One student per line'   // text only the roster's collection form renders

describe('the roster, once the consent gate is live', () => {
  it('the consent table answers → the pause message, and no way to add a student', async () => {
    db.answer = { data: [], error: null }
    const out = await paint()
    expect(out).toContain(PAUSED)
    expect(out).toContain(WHY)
    expect(out, 'the collection form is still on screen while adds would be refused').not.toContain(FORM)
    expect(out).not.toMatch(/<textarea|<input/)
  })

  it('the consent table is missing (production before the migrations) → the form, as today', async () => {
    db.answer = { data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.parental_consents' in the schema cache" } }
    const out = await paint()
    expect(out).toContain(FORM)
    expect(out).not.toContain(PAUSED)
  })

  it('any other error → the form, not a pause (its per-row errors stay visible)', async () => {
    db.answer = { data: null, error: { code: '500', message: 'network' } }
    const out = await paint()
    expect(out).toContain(FORM)
    expect(out).not.toContain(PAUSED)
  })
})
