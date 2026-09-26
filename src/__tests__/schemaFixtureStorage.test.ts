/**
 * The pglite schema fixture (_schema.ts) skips migrations about the Storage bucket, because pglite has no `storage`
 * schema. A skip is where a check can go blind (CLAUDE.md, row 1), so the list is gated both ways:
 *   · a listed file may touch NOTHING but `storage.*` (and read the catalog) — a public-schema change cannot hide in it;
 *   · every migration that touches `storage.*` must be listed — a new one is a conscious decision, not a surprise.
 * Those files are applied and tested on a real Postgres by `ci / rls-tests` (rls_regression.sql S0–S5).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { STORAGE_ONLY_MIGRATIONS } from './_schema'

const DIR = 'supabase/migrations'
const sql = (f: string) => readFileSync(`${DIR}/${f}`, 'utf8').replace(/--[^\n]*/g, '')   // comments may mention anything
const TOUCHES_STORAGE = /\bstorage\.(buckets|objects|prefixes|s3_)/i
const TOUCHES_ELSE = /\bpublic\.|\bauth\.|create\s+(or\s+replace\s+)?(table|function|view|policy|trigger|type|schema)\b|\balter\s+(table|function|type|role)\b|\bdrop\s+(table|function|policy|type)\b|\bgrant\s|\brevoke\s/i

describe('the schema fixture skips only Storage-bucket migrations', () => {
  it('positive control: the list is not empty and the listed file really exists and really touches storage', () => {
    expect([...STORAGE_ONLY_MIGRATIONS]).toEqual(['20260927100000_lesson_audio_bucket.sql'])
    for (const f of STORAGE_ONLY_MIGRATIONS) expect(TOUCHES_STORAGE.test(sql(f)), f).toBe(true)
  })

  it('a listed migration touches nothing but storage.* (and the catalog)', () => {
    const bad = [...STORAGE_ONLY_MIGRATIONS].filter(f => TOUCHES_ELSE.test(sql(f)))
    expect(bad).toEqual([])
  })

  it('every migration that touches storage.* is listed', () => {
    const touching = readdirSync(DIR).filter(f => f.endsWith('.sql') && TOUCHES_STORAGE.test(sql(f)))
    expect(touching.filter(f => !STORAGE_ONLY_MIGRATIONS.has(f))).toEqual([])
  })

  it("no test replays the migrations itself — only _schema.ts's loadSchema/applyFrom, which honour the list", () => {
    // A hand-rolled `readdirSync('supabase/migrations')… applyFile` loop would apply a storage migration to pglite and
    // fail — or, worse, a future copy that skips differently would drift from the fixture. (emailSuppression had one.)
    const own = readdirSync('src/__tests__').filter(f => f.endsWith('.ts') && f !== '_schema.ts' && f !== 'schemaFixtureStorage.test.ts')
      .filter(f => { const t = readFileSync(`src/__tests__/${f}`, 'utf8'); return /supabase\/migrations/.test(t) && /applyFile\(\s*\w+\s*,\s*f\s*\)/.test(t) })
    expect(own).toEqual([])
  })
})
