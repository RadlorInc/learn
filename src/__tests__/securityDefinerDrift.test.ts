/**
 * ⚠️ `SECURITY DEFINER` MUST NEVER ARRIVE OR VANISH AS A SIDE EFFECT OF REDEFINING A FUNCTION.
 *
 * A DEFINER function runs as its OWNER, and the owner owns the tables, so RLS is not applied to it.
 * This app's entire protection of children's data — one family cannot read another's — is RLS. So
 * adding that one word to a function that did not have it is the most expensive single-word change
 * possible here, and REMOVING it from one that needs it breaks a legitimate write path.
 *
 * It is not hypothetical. On 2026-09-05 `get_insights_rollup` was rebuilt from a partial read while
 * changing one WHERE clause, and the retype silently ADDED a `SECURITY DEFINER` the original does
 * not have. It was caught by eye. This gate is so it does not need to be.
 *
 * The rule (CLAUDE.md): a function definition is `pg_get_functiondef` output with NAMED lines
 * changed. Any diff that adds or removes SECURITY DEFINER, or changes SET search_path, is a
 * SECURITY change and must be declared — here, by adding it to DECLARED_PRIVILEGE_CHANGES with a
 * reason. Silence is what this catches.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = resolve(__dirname, '../../supabase/migrations')

/**
 * Deliberate, reviewed privilege changes. A function appears here ONLY with a reason a human wrote.
 * `null` previous = the function is introduced by that migration.
 */
const DECLARED_PRIVILEGE_CHANGES: Record<string, string> = {
  'sync_session/10':
    'DEFINER -> INVOKER in 20260820111858. Deliberate and surface-REDUCING: the 10-arg version ' +
    'became a forwarder, and the real authorisation check lives in the version it forwards to, ' +
    'where auth.uid() reads the request JWT either way. A DEFINER wrapper would add privilege ' +
    'surface for nothing. The migration says so in a comment; this is where it is enumerated.',
}

interface Def { fn: string; arity: number; file: string; definer: boolean; searchPath: string | null }

/**
 * Arity, by WALKING THE DELIMITERS from the opening paren. Not a regex and not a character window:
 * a parameter list contains `text[]`, `DEFAULT NULL::uuid` and nested parens, and this repo's own
 * rule is that a negated class is structural only if the construct genuinely cannot contain the
 * character — which here it can.
 *
 * ⚠️ THE KEY IS (name, arity), NOT name. `sync_session` exists at three arities: the plpgsql
 * implementation is SECURITY DEFINER and its forwarding shims are deliberately INVOKER, with a
 * comment saying why. Grouping by name alone reported that legitimate pair as drift — a gate going
 * red on correct code, which spends the reader's trust exactly like a false green.
 */
function arityFrom(src: string, openParenIdx: number): number {
  let depth = 1, args = 0, seen = false
  for (let i = openParenIdx; i < src.length; i++) {
    const c = src[i]
    if (c === '(') depth++
    else if (c === ')') { depth--; if (depth === 0) return seen ? args + 1 : 0 }
    else if (c === ',' && depth === 1) args++
    else if (!/\s/.test(c)) seen = true
  }
  return -1
}

function parse(): Def[] {
  const out: Def[] = []
  for (const file of readdirSync(DIR).filter(f => f.endsWith('.sql')).sort()) {
    const src = readFileSync(resolve(DIR, file), 'utf8')
    for (const m of src.matchAll(/create\s+or\s+replace\s+function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi)) {
      const rest = src.slice(m.index! + m[0].length)
      // The header is everything up to the body's opening dollar-tag. A negated class is not safe
      // here (a default like `DEFAULT '{}'::text[]` contains almost anything), so bound it on the
      // tag itself, which is the real terminator.
      const tag = rest.match(/\$[a-z_]*\$/i)
      if (!tag) continue
      const header = rest.slice(0, rest.indexOf(tag[0]))
      // ⚠️ BOTH SPELLINGS. `SET search_path TO public` and `SET search_path = public` are the same
      // thing, and matching only `TO` reported 12 unpinned DEFINER functions that are all pinned in
      // production — a broken search producing a confident finding. Measured against
      // pg_proc.proconfig on 2026-09-05: 20 of 20 DEFINER functions pin it.
      const sp = header.match(/set\s+search_path\s*(?:to|=)\s*([^\n]+)/i)
      out.push({
        fn: m[1].toLowerCase(),
        arity: arityFrom(src, m.index! + m[0].length),
        file,
        definer: /security\s+definer/i.test(header),
        searchPath: sp ? sp[1].trim().replace(/\s+/g, ' ') : null,
      })
    }
  }
  return out
}

describe('SECURITY DEFINER never drifts silently', () => {
  const defs = parse()

  it('parses a meaningful number of definitions — the regex has not rotted', () => {
    expect(defs.length).toBeGreaterThan(30)
    // positive control: a function known to be DEFINER must read as one
    expect(defs.some(d => d.fn === 'sync_session' && d.definer)).toBe(true)
    // and one known NOT to be must not
    expect(defs.some(d => d.fn === 'get_learner_bootstrap' && !d.definer)).toBe(true)
  })

  it('no redefinition adds or removes SECURITY DEFINER without declaring it', () => {
    const byFn = new Map<string, Def[]>()
    for (const d of defs) { const k = `${d.fn}/${d.arity}`; const a = byFn.get(k) ?? []; a.push(d); byFn.set(k, a) }

    const drift: string[] = []
    for (const [fn, ds] of byFn) {
      for (let i = 1; i < ds.length; i++) {
        if (ds[i].definer !== ds[i - 1].definer && !DECLARED_PRIVILEGE_CHANGES[fn]) {
          drift.push(
            `${fn}: ${ds[i - 1].file} had SECURITY ${ds[i - 1].definer ? 'DEFINER' : 'INVOKER'}, ` +
            `${ds[i].file} has SECURITY ${ds[i].definer ? 'DEFINER' : 'INVOKER'}`)
        }
      }
    }
    expect(drift, `a redefinition changed a function's privilege without declaring it:\n  ${drift.join('\n  ')}`).toEqual([])
  })

  it('every SECURITY DEFINER function pins search_path', () => {
    // An unpinned search_path on a DEFINER function is the classic privilege-escalation vector:
    // the caller chooses which schema's `learner_access` the guard reads.
    const unpinned = defs.filter(d => d.definer && !d.searchPath).map(d => `${d.fn} (${d.file})`)
    expect(unpinned, `SECURITY DEFINER without SET search_path:\n  ${unpinned.join('\n  ')}`).toEqual([])
  })
})
