/**
 * Server observability (Tier 2). Next 16 calls `onRequestError` whenever the server captures an
 * error during a render / route / server action. We emit a single structured line — captured by
 * Vercel logs today — and forward it to an error sink (Sentry/Logtail/etc.) the moment its ingest
 * URL is configured, so wiring monitoring is a one-env-var change with no code edit.
 *
 * SECURITY NOTE: we log the error + coarse request shape (method, path, route) only. We deliberately
 * do NOT log request headers or bodies — those carry the Supabase bearer token and child PII. A
 * spike of these (esp. around auth/RPC paths) is the tripwire for someone probing the API.
 *
 * To activate aggregation: set MONITORING_INGEST_URL (a generic HTTP error sink). For full Sentry,
 * add @sentry/nextjs and swap the fetch for Sentry.captureException — the seam is here.
 */
import type { Instrumentation } from 'next'
import { sinkError } from '@/infra/errorSink'

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err as { message?: string; digest?: string; stack?: string }
  const record = {
    at: new Date().toISOString(),
    source: 'server' as const,
    message: error?.message ?? 'unknown error',
    digest: error?.digest,
    method: request?.method,
    path: request?.path,
    routePath: context?.routePath,
    routeType: context?.routeType,
    stack: error?.stack?.split('\n').slice(0, 8).join('\n'),
  }

  await sinkError(record)
}
