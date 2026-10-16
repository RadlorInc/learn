/**
 * `sync_batch` (migration 20261016120000) as the database runs it, over a test's per-function `rpc` stub: each item is
 * one call to its function, in order, and the batch stops at the first error, answering how many went through and that
 * error's code. So a suite that stubs `record_lesson_progress` / `record_module_practice` / `save_practice_run` keeps
 * asserting on those calls. The real function's order, stop and idempotency are asserted on the real schema in
 * pointsLedgerRange.test.ts; this only replays that contract, and `batches` counts the requests the app made.
 */
type Rpc = (fn: string, a: Record<string, unknown>) => Promise<{ data?: unknown; error: { code?: string; message?: string } | null }>
const FN = { lesson: 'record_lesson_progress', module: 'record_module_practice', run: 'save_practice_run' } as const

export function unbatch(rpc: Rpc, seen?: { batches: number }): Rpc {
  return async (fn, a) => {
    if (fn !== 'sync_batch') return rpc(fn, a)
    if (seen) seen.batches++
    const items = a.p_items as { k: keyof typeof FN; a: Record<string, unknown> }[]
    for (const [i, it] of items.entries()) {
      const { error } = await rpc(FN[it.k], it.a)
      if (error) return { data: { done: i, code: error.code, message: error.message }, error: null }
    }
    return { data: { done: items.length }, error: null }
  }
}
