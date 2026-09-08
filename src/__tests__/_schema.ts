/**
 * THE REPO'S REAL SCHEMA, IN A REAL POSTGRES, BUILT FROM THE FILES CI BUILDS IT FROM.
 *
 * `supabase/schema/baseline_schema.sql` then every migration in filename order — the same sequence
 * `ci / rls-tests` stages onto a Docker Postgres, run here on pglite so it costs a second instead of
 * a round trip. Nothing about the shape is retyped: a fixture that declares its own tables is a
 * second copy of the schema and drifts from the real one exactly where they can disagree
 * (`adminMetrics.test.ts` cost five red commits on main learning that).
 *
 * ⚠️ WHAT IS SUBSTITUTED, AND WHY EACH ONE IS SAFE. pglite is Postgres without contrib, so three
 * things cannot run — and every one of them is orthogonal to a table, a column or a constraint:
 *   · `create extension …` → `select 1`. `gen_random_uuid()` is core since PG13, so the defaults
 *     the baseline relies on still work.
 *   · `citext` → `text`. Only affects case-folding on a column this repo does not have (it is the
 *     marketing site's waitlist type); no constraint changes.
 *   · `cron.schedule/unschedule` → stubs returning a value. Retention jobs are not schema.
 * Nothing here rewrites a `references`, an `on delete`, a policy or a grant, which are the only
 * things read back out. If a future substitution has to touch one of those, this fixture has
 * stopped being a measurement.
 */
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

/** The scaffolding a Supabase project already has before the first migration runs. */
const SUPABASE_PRELUDE = `
create schema if not exists auth;
create schema if not exists extensions;
create schema if not exists cron;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin; end if;
end $$;
-- The columns this app actually reads off auth.users. It is a managed table; we do not own its shape.
create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  email_confirmed_at timestamptz          -- read by handle_new_user(): a profile is created only once this is set
);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('test.role', true), ''), 'authenticated') $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
create or replace function cron.schedule(text, text, text) returns bigint language sql as $$ select 1::bigint $$;
create or replace function cron.unschedule(text) returns boolean language sql as $$ select true $$;
create table if not exists cron.job (jobid bigint, jobname text, schedule text, command text);
`

const substitute = (sql: string) =>
  sql
    .replace(/create\s+extension[^;]*;/gi, 'select 1;')
    .replace(/\bextensions\.citext\b/gi, 'text')
    .replace(/\bcitext\b/gi, 'text')

export interface Loaded { db: PGlite; files: number }

/** Applies baseline + every migration. Throws on the first failure — a partly-built schema is not
 *  a schema, and swallowing an error here would make every assertion downstream vacuous. */
export async function loadSchema(): Promise<Loaded> {
  const db = new PGlite()
  await db.exec(SUPABASE_PRELUDE)

  const files: [string, string][] = [
    ['baseline_schema.sql', readFileSync(resolve(ROOT, 'supabase/schema/baseline_schema.sql'), 'utf8')],
    ...readdirSync(resolve(ROOT, 'supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
      .map(f => [f, readFileSync(resolve(ROOT, 'supabase/migrations', f), 'utf8')] as [string, string]),
  ]

  for (const [name, sql] of files) {
    try { await db.exec(substitute(sql)) } catch (e) {
      throw new Error(`schema fixture failed applying ${name}: ${(e as Error).message.split('\n')[0]}`)
    }
  }
  return { db, files: files.length }
}

export interface Fk {
  child: string; parent: string; conname: string
  childCols: string; onDelete: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT'
}

/** Every foreign key in the built database, read off `pg_constraint` — the catalog, not the SQL text. */
export async function foreignKeys(db: PGlite): Promise<Fk[]> {
  const { rows } = await db.query<Fk>(`
    select
      src.relnamespace::regnamespace::text || '.' || src.relname as child,
      tgt.relnamespace::regnamespace::text || '.' || tgt.relname as parent,
      c.conname,
      (select string_agg(a.attname, ',' order by k.ord)
         from unnest(c.conkey) with ordinality k(att, ord)
         join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.att) as "childCols",
      case c.confdeltype
        when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
        when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end as "onDelete"
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class tgt on tgt.oid = c.confrelid
    where c.contype = 'f'
    order by parent, child, c.conname
  `)
  return rows
}
