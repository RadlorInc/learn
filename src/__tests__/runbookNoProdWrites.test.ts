/**
 * No runbook may tell its reader to write to production by hand.
 *
 * CLAUDE.md's ⛔ rules: production's schema changes ONLY through `deploy.yml`'s `migrate-prod` behind the
 * `production-db` environment, and production is read ONLY through SQL Rafi runs in the SQL editor. No `psql`,
 * no Supabase MCP, no CLI against a remote. A runbook is what somebody follows at 3 a.m. without re-reading
 * CLAUDE.md, so an instruction in one is an instruction that gets obeyed. `rollback.md` carried two of them
 * (`apply_migration` via MCP, `psql "$PROD_DB_URL" -f rls_regression.sql`) — review finding OPS-10, 2026-09-26.
 *
 * PROPERTY CHECKED (and nothing stronger): no line of `docs/runbooks/*.md` matches one of the hand-written
 * production-access patterns below, unless that same line says "never". It is a text check on the runbooks
 * only — it cannot tell whether an instruction elsewhere reaches production, or catch a phrasing the patterns
 * do not name. The patterns are written out here by hand, deliberately, not derived from any runbook.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(__dirname, '..', '..', 'docs', 'runbooks')

const PATTERNS: [string, RegExp][] = [
  ['psql with a production connection variable', /\bpsql\b.*\$\{?[A-Z_]*PROD[A-Z_]*/],
  ['psql at a Supabase-hosted database', /\bpsql\b.*(supabase\.co|pooler\.supabase\.com)/],
  ['Supabase MCP execute_sql', /\bexecute_sql\b/],
  ['Supabase MCP apply_migration', /\bapply_migration\b/],
  ['supabase db push', /\bsupabase\s+db\s+push\b/],
  ['supabase link', /\bsupabase\s+link\b/],
  ['CLI --linked', /--linked\b/],
  ['CLI --project-ref', /--project-ref\b/],
  ['supabase db/migration against a non-local --db-url', /\bsupabase\s+(db|migration)\b.*--db-url(?!\s*["']?postgres(ql)?:\/\/[^@\s]*@(127\.0\.0\.1|localhost))/],
]

/** The rule the file enforces, as a function, so the positive control drives the same code. */
function offences(text: string): string[] {
  const out: string[] = []
  text.split('\n').forEach((line, i) => {
    if (/\bnever\b/i.test(line)) return
    for (const [name, re] of PATTERNS) if (re.test(line)) out.push(`${i + 1}: ${name}: ${line.trim()}`)
  })
  return out
}

describe('runbooks never instruct a production write', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.md'))

  it('positive control: the corpus is there and the matcher catches planted lines', () => {
    // "I cannot see" must not read as "there is nothing to see".
    expect(files).toContain('rollback.md')
    expect(files.length).toBeGreaterThanOrEqual(4)
    expect(offences('2. `psql "$PROD_DB_URL" -f supabase/tests/rls_regression.sql`')).toHaveLength(1)
    expect(offences('re-apply the policy via `apply_migration`, then commit')).toHaveLength(1)
    expect(offences('run `supabase db push --linked`')).toHaveLength(2)
    expect(offences('psql "postgresql://postgres:x@db.abc.supabase.co:5432/postgres"')).toHaveLength(1)
    expect(offences('supabase db dump --db-url "$DB" -f x.sql')).toHaveLength(1)
    // …and does not fire on what the runbooks legitimately say.
    expect(offences('Never run `supabase db push` or `psql "$PROD_DB_URL"` by hand.')).toEqual([])
    expect(offences('supabase db reset --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres')).toEqual([])
    expect(offences('psql "$PGURL" -f supabase/tests/rls_regression.sql')).toEqual([])
  })

  it('no runbook in docs/runbooks/ has a production-write instruction', () => {
    for (const f of files) expect(offences(readFileSync(join(DIR, f), 'utf8')), f).toEqual([])
  })
})
