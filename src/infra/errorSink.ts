/**
 * The one place a crash goes. Used by both error paths — the browser ErrorBoundary via
 * `/api/report-error`, and Next's server `onRequestError` in `instrumentation.ts`.
 *
 * ⚠️ IT WAS NEVER TRUE THAT CRASHES WENT NOWHERE — they have always been `console.error`'d into
 * Vercel logs. What was missing is RETENTION and someone looking: Hobby keeps runtime logs for
 * about an hour, so a crash at 2am is gone by breakfast. That is the shape of the 2026-08-17
 * plan-pointer P0, which ran three months unseen while production's own tables were saying so.
 *
 * Three sinks, in order, and each is independent of the others:
 *   1. `console.error` — ALWAYS, first, before anything can fail. Vercel logs are the floor and
 *      they work with no configuration at all.
 *   2. `error_events` in Supabase — durable and queryable, when a service-role key is present.
 *   3. `MONITORING_INGEST_URL` — the Sentry/Logtail seam, kept so that moving to a real monitoring
 *      product later stays a one-env-var change with no code edit.
 *
 * ⚠️ THE SERVICE-ROLE KEY IS REQUIRED FOR (2) AND THERE IS NO ANON FALLBACK, DELIBERATELY.
 * `20260816170000_leads_server_only.sql` is this repo's own record of why: `diagnostic_leads`
 * opened an anonymous INSERT surface and the mitigation it named ("Supabase Auth rate limits")
 * does not apply to a PostgREST write, so anyone with the public anon key could fill it for free.
 * Falling back to anon here would reopen exactly that, and would bypass `/api/report-error`'s own
 * rate limit in the process. Without the key this simply does (1) and (3) — which is what happens
 * today, so shipping this changes nothing until the key is set.
 *
 * ⚠️ AND IT MUST NEVER THROW. A crash reporter that fails during a crash turns one bug into two;
 * `onRequestError` runs inside request handling and the client route is answering a browser that
 * has just died.
 */

export interface ErrorRecord {
  at: string
  source: 'client' | 'server'
  message: string
  stack?: string
  componentStack?: string
  url?: string
  ua?: string
  method?: string
  routePath?: string
  digest?: string
  learnerId?: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Postgres wants snake_case columns; the record is camelCase because it is also the JSON that
 *  goes to the ingest URL, where the existing shape is already what a sink expects.
 *  Exported for the gate — the mapping is the part that silently drops a field if it drifts. */
export const toRow = (r: ErrorRecord) => ({
  at: r.at,
  source: r.source,
  message: r.message,
  stack: r.stack ?? null,
  component_stack: r.componentStack ?? null,
  url: r.url ?? null,
  ua: r.ua ?? null,
  method: r.method ?? null,
  route_path: r.routePath ?? null,
  digest: r.digest ?? null,
  // A malformed id must not cost us the whole row — Postgres rejects the insert on a bad uuid.
  learner_id: UUID.test(r.learnerId ?? '') ? r.learnerId : null,
})

export async function sinkError(record: ErrorRecord): Promise<void> {
  // 1. Always, and FIRST — this is the sink that needs no configuration and cannot be misconfigured.
  console.error(record.source === 'client' ? '[milo.client-error]' : '[milo.error]', JSON.stringify(record))

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ingest = process.env.MONITORING_INGEST_URL

  // 2 and 3 run together: neither should delay the other, and neither may take the request down.
  await Promise.allSettled([
    url && key
      ? fetch(`${url}/rest/v1/error_events`, {
          method: 'POST',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(toRow(record)),
          // ⚠️ `fetch` does not throw on 4xx/5xx, so allSettled alone reports a rejected INSERT as
          // fulfilled and the durable sink silently stops recording. Report it to sink (1), which
          // always works — NEVER back into sinkError(), which would recurse on a failing database.
        }).then(res => {
          if (!res.ok) console.error('[milo.sink] error_events insert failed', res.status)
        })
      : null,
    ingest
      ? fetch(ingest, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        })
      : null,
  ])
}
