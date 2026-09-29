// @vitest-environment node
/**
 * The production secrets are readable only by jobs that run inside a GitHub environment.
 *
 * A repository-level secret is readable by a workflow on ANY branch anyone can push. An environment secret is readable
 * only by a job that names the environment, and the environment limits which branches may use it (and, for
 * production-db, who approves). So every job that touches the production database password, the account-wide Supabase
 * token or the backup passphrase must declare one of the environments below. The secret names and environments are
 * written out here by hand.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
const SECRETS = ['PROD_DB_PASSWORD', 'SUPABASE_ACCESS_TOKEN', 'BACKUP_PASSPHRASE']
const ENVIRONMENTS = ['production-db', 'prod-backup', 'staging']

type Job = { environment?: string | { name?: string }; steps?: unknown[]; with?: unknown; env?: unknown; secrets?: unknown }
type Hit = { where: string; secrets: string[]; environment: string | undefined }

/** Every job in a workflow text that references one of SECRETS, with the environment it declares. */
export function jobsReadingSecrets(file: string, text: string): Hit[] {
  const wf = yaml.load(text) as { jobs?: Record<string, Job> }
  return Object.entries(wf.jobs ?? {}).flatMap(([name, job]) => {
    const body = JSON.stringify(job)
    const used = SECRETS.filter((s) => new RegExp(`secrets\\.${s}\\b`).test(body))
    if (!used.length) return []
    const env = typeof job.environment === 'string' ? job.environment : job.environment?.name
    return [{ where: `${file}/${name}`, secrets: used, environment: env }]
  })
}

const DIR = join(ROOT, '.github/workflows')
const hits = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f)).flatMap((f) => jobsReadingSecrets(f, readFileSync(join(DIR, f), 'utf8')))

describe('production secrets are read only inside an environment', () => {
  it('positive control: the scan finds the jobs that use them (backup, migrate-prod, migrate-staging)', () => {
    expect(hits.map((h) => h.where).sort()).toEqual(['backup.yml/dump', 'deploy.yml/migrate-prod', 'deploy.yml/migrate-staging'])
  })

  it('positive control: a job reading one without an environment is caught by the same predicate', () => {
    const planted = jobsReadingSecrets('x.yml', 'jobs:\n  leak:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ${{ secrets.PROD_DB_PASSWORD }}\n')
    expect(planted).toEqual([{ where: 'x.yml/leak', secrets: ['PROD_DB_PASSWORD'], environment: undefined }])
  })

  it('every such job declares one of the environments', () => {
    expect(hits.filter((h) => !ENVIRONMENTS.includes(h.environment ?? '')).map((h) => `${h.where} reads ${h.secrets.join(', ')} with no environment`)).toEqual([])
  })
})
