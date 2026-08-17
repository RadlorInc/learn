import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sinkError, toRow, type ErrorRecord } from '@/infra/errorSink'

/**
 * The crash reporter. Every rule here is one this repo has already paid for somewhere else.
 */
const REC: ErrorRecord = {
  at: '2026-08-17T10:00:00.000Z',
  source: 'client',
  message: 'boom',
  stack: 'at x',
  componentStack: 'in CoinTray',
  url: 'https://x/game',
  ua: 'Chrome',
  learnerId: '11111111-2222-3333-4444-555555555555',
}

const ENV = { ...process.env }
beforeEach(() => { vi.restoreAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { process.env = { ...ENV } })

describe('toRow', () => {
  it('maps every camelCase field onto its snake_case column', () => {
    const row = toRow(REC)
    expect(row.component_stack).toBe('in CoinTray')
    expect(row.learner_id).toBe(REC.learnerId)
    expect(row.message).toBe('boom')
    // ⚠️ A field the mapper forgets is silently dropped by PostgREST, not rejected — so assert the
    // exact column set rather than a handful of samples.
    expect(Object.keys(row).sort()).toEqual(
      ['at', 'component_stack', 'digest', 'learner_id', 'message', 'method', 'route_path', 'source', 'stack', 'ua', 'url'],
    )
  })

  it('nulls a malformed learner id instead of losing the whole row', () => {
    // Postgres rejects a bad uuid, and the insert is the crash report — one unusable id must not
    // cost the stack trace. `cap(…, 64)` upstream bounds the length but says nothing about shape.
    expect(toRow({ ...REC, learnerId: 'not-a-uuid' }).learner_id).toBeNull()
    expect(toRow({ ...REC, learnerId: '' }).learner_id).toBeNull()
    expect(toRow({ ...REC, learnerId: undefined }).learner_id).toBeNull()
  })

  it('nulls absent optionals rather than omitting them', () => {
    const row = toRow({ at: 'x', source: 'server', message: 'm' })
    expect(row.stack).toBeNull()
    expect(row.url).toBeNull()
  })
})

describe('sinkError', () => {
  it('logs to the console FIRST, before any network sink is even attempted', async () => {
    // ⚠️ ORDER, NOT JUST OCCURRENCE. Asserting only that it logged passes just as happily when the
    // log moves BELOW the awaits — and then a function killed mid-await (a serverless timeout, the
    // exact case a crash storm produces) loses the one sink that needs no configuration. Caught by
    // mutation: moving the console.error after `Promise.allSettled` survived the first version.
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    process.env.MONITORING_INGEST_URL = 'https://sink.example/hook'
    const order: string[] = []
    vi.spyOn(console, 'error').mockImplementation(() => { order.push('console') })
    vi.stubGlobal('fetch', vi.fn(() => { order.push('fetch'); return Promise.resolve({ ok: true }) }))
    await sinkError(REC)
    expect(order[0], `sinks ran in the order: ${order.join(' → ')}`).toBe('console')
    expect(order).toContain('fetch')
  })

  it('writes to error_events when a SERVICE-ROLE key is set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    delete process.env.MONITORING_INGEST_URL
    const f = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', f)
    await sinkError(REC)
    expect(f).toHaveBeenCalledOnce()
    const [url, init] = f.mock.calls[0]
    expect(url).toBe('https://db.example/rest/v1/error_events')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer service-key')
    expect(JSON.parse(init.body).component_stack).toBe('in CoinTray')
  })

  it('⚠️ NEVER falls back to the anon key — that is the surface leads_server_only closed', async () => {
    // `diagnostic_leads` opened an anonymous INSERT surface whose named mitigation ("Supabase Auth
    // rate limits") does not apply to a PostgREST write. An anon fallback here would reopen it AND
    // bypass /api/report-error's own 30/min limit.
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.SUPABASE_ANON_KEY = 'anon-key'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.MONITORING_INGEST_URL
    const f = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', f)
    await sinkError(REC)
    expect(f, 'no service-role key must mean no database write at all').not.toHaveBeenCalled()

    const src = readFileSync(join(process.cwd(), 'src/infra/errorSink.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(src, 'anon key must not appear in the sink at all').not.toMatch(/ANON_KEY/)
  })

  it('keeps the MONITORING_INGEST_URL seam, so Sentry stays a one-env-var change', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    process.env.MONITORING_INGEST_URL = 'https://sink.example/hook'
    const f = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', f)
    await sinkError(REC)
    expect(f).toHaveBeenCalledOnce()
    expect(f.mock.calls[0][0]).toBe('https://sink.example/hook')
    // The ingest payload keeps the ORIGINAL camelCase shape — a sink expects the record, not a row.
    expect(JSON.parse(f.mock.calls[0][1].body).componentStack).toBe('in CoinTray')
  })

  it('⚠️ never throws, even when every sink fails — a reporter that dies during a crash makes two bugs', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    process.env.MONITORING_INGEST_URL = 'https://sink.example/hook'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    await expect(sinkError(REC)).resolves.toBeUndefined()
  })

  it('one failing sink does not stop the other', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    process.env.MONITORING_INGEST_URL = 'https://sink.example/hook'
    const f = vi.fn()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', f)
    await sinkError(REC)
    expect(f).toHaveBeenCalledTimes(2)
  })
})
