/**
 * SEC-07 (docs/review/SECURITY-AUDIT.md): the class roster's "no half-made student" rollback must remove the
 * student the way the dashboard's "Delete" does — the `delete_learner` RPC (→ delete_child_data: consent
 * withdrawn, B3 cancelled) — and never with a REST `DELETE` on `learners`, which skips all of that.
 *
 * Property checked: when a roster add fails at the login step, the calls the client makes to the database are
 * `rpc('delete_learner', { p_learner_id })` and NO `from('learners').delete()`. It does not check what the
 * database does with that call (consentDeletion.test.ts drives delete_child_data itself).
 * Expand side: on a database without delete_learner (PGRST202) the rollback falls back to the row, like the
 * dashboard does. Positive control: the dashboard's deleteLearnerPermanently still calls the same RPC.
 * Expected values are written out by hand.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Call = { table?: string; op: string; args?: unknown }
const h = vi.hoisted(() => ({
  calls: [] as { table?: string; op: string; args?: unknown }[],
  rpcAnswer: { data: null, error: null } as { data: unknown; error: unknown },
}))

vi.mock('@/data/supabase/client', () => {
  const chain = (table: string): unknown => {
    let answer: unknown = { data: null, error: null }
    if (table === 'parental_consents') answer = { data: null, error: { code: 'PGRST205', message: 'missing' } } // form shows
    if (table === 'learner_access') answer = { data: { access_role: 'owner' }, error: null }
    const p: unknown = new Proxy(() => {}, {
      get: (_t, k) => {
        if (k === 'then') return (r: (v: unknown) => void) => r(answer)
        return (...args: unknown[]) => { if (k === 'delete' || k === 'insert' || k === 'update' || k === 'upsert') h.calls.push({ table, op: String(k), args }); return p }
      },
    })
    return p
  }
  return {
    createClient: () => ({
      from: (t: string) => chain(t),
      rpc: (name: string, args: unknown) => { h.calls.push({ op: `rpc:${name}`, args }); return Promise.resolve(h.rpcAnswer) },
      auth: { getSession: async () => ({ data: { session: { user: { id: 'teacher-1' } } } }) },
    }),
  }
})

vi.mock('@/data/repositories', async (orig) => ({
  ...(await orig<object>()),
  createLearner: async () => ({ id: 'kid-1' }),
  setChildLogin: async () => ({ ok: false, error: 'username_taken' }),
}))

async function addOneStudent(): Promise<string> {
  const React = await import('react')
  const { act } = React
  const { createRoot } = await import('react-dom/client')
  const { AddStudents } = await import('@/features/classes/Classes')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(React.createElement(AddStudents, { cls: { id: 'c', name: 'Room 12', grade: 5, lesson_ids: null } as never, onAdded() {}, onDone() {} }))
  })
  await act(async () => { await new Promise(r => setTimeout(r, 20)) })
  const byText = (t: string) => [...host.querySelectorAll('button')].find(b => b.textContent?.startsWith(t))!
  await act(async () => { byText('One student').click() })
  const user = host.querySelector('input[aria-label="Username"]') as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(user, 'aarav7')
    user.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => { byText('Add').click() })
  await act(async () => { await new Promise(r => setTimeout(r, 20)) })
  const text = host.textContent ?? ''
  await act(async () => { root.unmount() })
  host.remove()
  return text
}

const restDeletesOnLearners = (calls: Call[]) => calls.filter(c => c.table === 'learners' && c.op === 'delete')

beforeEach(() => {
  h.calls.length = 0
  h.rpcAnswer = { data: null, error: null }
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
})

describe('the roster rollback removes a half-made student through delete_learner (SEC-07)', () => {
  it('login fails → rpc delete_learner for that child, and no REST DELETE on learners', async () => {
    const text = await addOneStudent()
    expect(restDeletesOnLearners(h.calls), 'the rollback bypassed delete_child_data with a REST delete').toEqual([])
    expect(h.calls.filter(c => c.op === 'rpc:delete_learner')).toEqual([{ op: 'rpc:delete_learner', args: { p_learner_id: 'kid-1' } }])
    // What the teacher sees is unchanged: the row is reported as not added, with the login's reason.
    expect(text).toContain('0 students added · 1 not added')
    expect(text).toContain('✗ username already used — pick another')
  })

  it('a database without delete_learner (PGRST202) → the row fallback, as the dashboard does', async () => {
    h.rpcAnswer = { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } }
    await addOneStudent()
    expect(restDeletesOnLearners(h.calls)).toHaveLength(1)
  })

  it('a failed rollback is reported, not swallowed', async () => {
    h.rpcAnswer = { data: null, error: { code: '42501', message: 'not_owner' } }
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    await addOneStudent()
    expect(err.mock.calls.some(c => c[0] === '[addOne] could not remove the half-made student' && c[1] === 'kid-1')).toBe(true)
    err.mockRestore()
  })

  it('positive control: the dashboard delete still goes through the same RPC', async () => {
    const { deleteLearnerPermanently } = await import('@/data/repositories')
    expect(await deleteLearnerPermanently('kid-9')).toEqual({ ok: true })
    expect(h.calls).toEqual([{ op: 'rpc:delete_learner', args: { p_learner_id: 'kid-9' } }])
  })
})
