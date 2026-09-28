// @vitest-environment node
/**
 * scripts/backup-row-counts.sh — what the backup job prints so a change in backup size is explained, not guessed
 * (founder, 2026-09-28). Driven as the job runs it, on a dump in the format `supabase db dump --data-only --use-copy`
 * writes (copied in shape from a real local dump taken 2026-09-28: quoted identifiers, `FROM stdin;`, `\.` ends a
 * block; the rows are made up). Expected numbers written out by hand.
 *
 * Properties: counts per SCHEMA are right, including an empty table and a row holding an escaped newline; no value
 * from a row and no table name reaches the output (the repo is public, so its logs are too); and "could not count"
 * exits 2 with its own words, never as zero rows.
 */
import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SCRIPT = resolve(__dirname, '../../scripts/backup-row-counts.sh')
const dir = mkdtempSync(join(tmpdir(), 'rowcounts-'))

const DUMP = [
  'SET session_replication_role = replica;',
  '',
  '--',
  '-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin',
  '--',
  '',
  'COPY "auth"."users" ("instance_id", "id", "email") FROM stdin;',
  '00000000-0000-0000-0000-000000000000\taaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\tSENTINEL-PARENT@x.test',
  '00000000-0000-0000-0000-000000000000\tbbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\tother@x.test',
  '\\.',
  '',
  'COPY "public"."learners" ("id", "display_name") FROM stdin;',
  'k1\tSENTINEL-CHILD',
  'k2\tTwo\\nlines',
  'k3\tThree',
  '\\.',
  '',
  'COPY "public"."empty_table" ("id") FROM stdin;',
  '\\.',
  '',
  'COPY "storage"."objects" ("id", "bucket_id", "name") FROM stdin;',
  'o1\tlesson-audio\tabcdef0123456789.mp3',
  '\\.',
  '',
  'RESET ALL;',
  '',
].join('\n')

function run(content: string, summary = false) {
  const f = join(dir, `d-${Math.random().toString(36).slice(2)}.sql`)
  writeFileSync(f, content)
  const sum = join(dir, `s-${Math.random().toString(36).slice(2)}.md`)
  const r = spawnSync('bash', [SCRIPT, f], { encoding: 'utf8', env: { ...process.env, GITHUB_STEP_SUMMARY: summary ? sum : '' } })
  return { code: r.status, out: r.stdout + r.stderr, summary: summary ? readFileSync(sum, 'utf8') : '' }
}

describe('backup row counts', () => {
  it('counts rows per schema — an escaped newline is one row, an empty table is zero', () => {
    const r = run(DUMP)
    expect(r.code).toBe(0)
    const line = (s: string) => r.out.split('\n').find(l => l.trim().startsWith(`${s} `))?.trim().split(/\s+/).slice(1, 2)[0]
    expect(line('auth')).toBe('2')
    expect(line('public')).toBe('3')
    expect(line('storage')).toBe('1')
    expect(line('TOTAL')).toBe('6')
  })

  it('prints no value from any row and no table name (the logs of a public repo are public)', () => {
    expect(DUMP, 'control: the fixture carries the values').toContain('SENTINEL-CHILD')
    const r = run(DUMP, true)
    for (const text of [r.out, r.summary]) {
      expect(text).not.toMatch(/SENTINEL|other@x|abcdef0123456789|lesson-audio/)
      expect(text).not.toMatch(/learners|empty_table|objects|users/)
    }
    expect(r.summary).toContain('| storage | 1 |')
  })

  it('a dump with text but no COPY block it can read: exit 2, and it says so — never "0 rows"', () => {
    const r = run('SET x = 1;\nINSERT INTO "public"."learners" VALUES (1);\n')
    expect(r.code).toBe(2)
    expect(r.out).toContain('rows NOT counted')
    expect(r.out).not.toMatch(/TOTAL\s+0/)
  })

  it('an empty file: exit 2', () => {
    expect(run('').code).toBe(2)
  })
})
