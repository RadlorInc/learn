/**
 * THE DAILY OPS DIGEST (OPS-04 / OPS-07 / FND-11): once a day, NUMBERS ONLY, to the founder.
 *
 * Sent by the one Vercel cron (`/api/consent/cancel-second-notice`) after its B3 drain. Every line is
 * built here from a FIXED list of keys whose values are integers, booleans, pg_cron job names or a
 * GitHub run conclusion from a fixed vocabulary — so nothing a parent or child typed can reach the
 * email, whatever `ops_digest()` or GitHub return. Unknown values render as "unknown".
 *
 * Never throws: a digest that cannot be built still says what it could not read.
 */
import { createHash, timingSafeEqual } from 'node:crypto'
import { rpc, sendEmail, type RpcError } from '@/features/consent/server'

const REPO = 'RadlorInc/learn'
const INT_KEYS = ['error_events_24h', 'cron_runs_failed_24h', 'b3_cancel_failing', 'b3_cancel_missed_7d',
  'consent_pending_overdue', 'consent_request_unsent'] as const
const CONCLUSIONS = new Set(['success', 'failure', 'cancelled', 'skipped', 'timed_out', 'action_required', 'neutral', 'stale', 'startup_failure'])

/** True only for Vercel's cron: it sends `Authorization: Bearer $CRON_SECRET` when that variable is set. */
export function fromCron(req: Request): boolean {
  const s = process.env.CRON_SECRET
  if (!s) return false
  const h = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(h(req.headers.get('authorization') ?? ''), h(`Bearer ${s}`))
}

const num = (v: unknown) => (Number.isInteger(v) ? String(v) : 'unknown')

async function workflow(file: string): Promise<{ latest: string; hoursSinceSuccess: string }> {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${file}/runs?status=completed&per_page=30`,
      { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!r.ok) throw new Error(String(r.status))
    const runs = ((await r.json()) as { workflow_runs?: { conclusion?: unknown; created_at?: unknown }[] }).workflow_runs ?? []
    const c = runs[0]?.conclusion
    const ok = runs.find(x => x.conclusion === 'success')
    const t = typeof ok?.created_at === 'string' ? Date.parse(ok.created_at) : NaN
    return {
      latest: typeof c === 'string' && CONCLUSIONS.has(c) ? c : 'unknown',
      hoursSinceSuccess: Number.isFinite(t) ? String(Math.floor((Date.now() - t) / 3_600_000)) : 'none in last 30 runs',
    }
  } catch { return { latest: 'unknown', hoursSinceSuccess: 'unknown' } }
}

/** The digest's lines and whether anything needs looking at. `drain` is the cron's own B3 drain result. */
export async function buildDigest(drain: string): Promise<{ lines: string[]; attention: number }> {
  const lines: string[] = []
  let attention = 0
  const flag = (bad: boolean, line: string) => { if (bad) attention++; lines.push(`${bad ? '!! ' : '   '}${line}`) }

  let row: Record<string, unknown> | undefined
  let dbState = 'ok'
  try { row = (await rpc<Record<string, unknown>[]>('ops_digest', {}))[0] } catch (e) {
    dbState = (e as RpcError)?.code === 'PGRST202' ? 'digest function missing (migration 20260926100300 not applied)' : `unreadable (${num((e as RpcError)?.status)})`
  }
  flag(dbState !== 'ok', `database: ${dbState}`)
  flag(!/^\d+$/.test(drain), `B3 cancel drain today: ${drain}`)
  if (row) {
    for (const k of INT_KEYS) flag(row[k] !== 0, `${k}: ${num(row[k])}`)
    flag(row.cron_readable !== true, `cron_readable: ${row.cron_readable === true}`)
    const jobs = Array.isArray(row.cron_jobs_failing)
      ? row.cron_jobs_failing.map(j => (typeof j === 'string' && /^[\w.-]{1,64}$/.test(j) ? j : 'unnamed')) : ['unknown']
    flag(jobs.length > 0, `cron_jobs_failing: ${jobs.length ? jobs.join(', ') : 'none'}`)
  }
  for (const f of ['backup.yml', 'deploy.yml']) {
    const w = await workflow(f)
    flag(w.latest !== 'success', `${f}: latest ${w.latest}, last success ${w.hoursSinceSuccess} h ago`)
  }
  return { lines, attention }
}

/** Build and email the digest to OPS_DIGEST_TO. Unset → skip and log. Never throws. */
export async function sendOpsDigest(drain: string): Promise<void> {
  const to = process.env.OPS_DIGEST_TO
  if (!to) { console.warn('[ops-digest] skipped: OPS_DIGEST_TO is not set'); return }
  try {
    const { lines, attention } = await buildDigest(drain)
    const day = new Date().toISOString().slice(0, 10)
    const text = [`Radlic ops digest ${day} (counts only; !! = look at this)`, '', ...lines].join('\n')
    const subject = `Radlic ops ${day}: ${attention ? `${attention} to look at` : 'all clear'}`
    await sendEmail('transactional', to, { subject, text, html: `<pre>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>` }, `ops-digest-${day}`)
  } catch (e) { console.error('[ops-digest] failed', e instanceof Error ? e.message : e) }
}
