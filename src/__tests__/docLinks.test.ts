/**
 * The docs point at docs that exist, and nothing in the repo points at a doc that is gone.
 *
 * Written 2026-09-28 when every old doc was deleted and a small fresh set replaced it (docs/START-HERE.md
 * maps it). A deleted doc leaves two kinds of dangling pointer, and this file checks both:
 *
 * PROPERTY CHECKED (and nothing stronger):
 *   (1) every relative markdown link `[text](target)` in a `.md` file of the repo names a file that exists
 *       (the part before `#`, with a trailing `:line` dropped; http/mailto/`#` links are not checked,
 *       and neither are anchors);
 *   (2) every repo path ending in `.md` written in a text file of the repo — a doc named in a code comment,
 *       a test, a script, a workflow or another doc, rooted at one of the repo's top-level folders
 *       (`docs/…`, `e2e/…`, `src/…`) — exists.
 * It cannot tell whether a link names the RIGHT file, and it does not see a doc named without its folder
 * ("see LOOP-STATE.md").
 *
 * Two deliberate exemptions, each for a reason a reader can check:
 *   - `supabase/migrations/**`: applied migrations are left exactly as they were applied (founder's rule,
 *     2026-09-28), so their comments keep the doc paths of their day;
 *   - `<rev>:<path>` (e.g. `fbf193280:docs/review/LATENT-BUGS.md`): git's own syntax for a file in history,
 *     which is how a comment points at a deleted doc on purpose. `git show <rev>:<path>` prints it.
 * And a generated snapshot that records the tree as it was on its date, `supabase/schema/ledger_snapshot_20260824.tsv`,
 * plus the recovered patch `docs/recovered-menu-rpc-work.patch`, whose text is a diff of files as they were.
 */
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

const ROOT = join(__dirname, '..', '..')

const SKIP = (f: string) =>
  f.startsWith('supabase/migrations/')
  || ['supabase/schema/ledger_snapshot_20260824.tsv', 'docs/recovered-menu-rpc-work.patch',
    'src/__tests__/docLinks.test.ts'].includes(f)   // this file: its control strings name made-up docs on purpose

const TEXT = /\.(md|tsx?|jsx?|mjs|cjs|sh|py|ya?ml|sql|css|html|json|txt|toml|patch|tsv)$/

type Found = { file: string; line: number; target: string }

/** (1) Relative markdown links in one .md file. `exists` is injected so the control can drive the same code. */
export function brokenLinks(file: string, text: string, exists: (p: string) => boolean) {
  const broken: Found[] = []
  let checked = 0
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const raw = m[1]
      if (/^(https?:|mailto:|tel:|#)/.test(raw)) continue
      const path = decodeURIComponent(raw.split('#')[0]).replace(/:\d+(-\d+)?$/, '')
      if (!path) continue
      checked++
      const target = path.startsWith('/') ? normalize(path.slice(1)) : normalize(join(dirname(file), path))
      if (!exists(target)) broken.push({ file, line: i + 1, target: raw })
    }
  })
  return { broken, checked }
}

/** (2) Repo paths to .md files named anywhere in one text file. `roots` = the repo's top-level folders. */
export function missingDocPaths(file: string, text: string, roots: string[], exists: (p: string) => boolean) {
  const missing: Found[] = []
  let checked = 0
  const re = new RegExp(`(?<![\\w./:-])((?:${roots.map(r => r.replace(/\./g, '\\.')).join('|')})/[\\w./-]*?\\.md)(?![\\w])`, 'g')
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(re)) {
      checked++
      if (!exists(m[1])) missing.push({ file, line: i + 1, target: m[1] })
    }
  })
  return { missing, checked }
}

const onDisk = (p: string) => existsSync(join(ROOT, p))
// Untracked (not ignored) files are in scope too, so a new doc is checked before its first commit, not only in CI.
// A file deleted from disk but still in git's index is dropped, so the pointers to it are REPORTED rather than the
// read crashing (found by break-check.sh, 2026-09-28: an `rm` of a doc made both checks die on ENOENT).
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(f => f && onDisk(f))
// Floors, not targets. Measured 2026-09-28 on the fresh doc set: 121 links in 48 docs, 191 doc paths in 1,237 files.
// About half of each, so ordinary edits never trip them — but a parser that stops matching reads 0 and fails.
const LINK_FLOOR = 60, PATH_FLOOR = 90
const ROOTS = [...new Set(files.filter(f => f.includes('/')).map(f => f.split('/')[0]))]

describe('doc links', () => {
  it('control: a broken link and a missing doc path are caught; history, URLs and anchors are not', () => {
    const have = new Set(['docs/a.md', 'docs/runbooks/b.md', 'README.md'])
    const exists = (p: string) => have.has(p)
    const links = brokenLinks('docs/runbooks/b.md',
      '[ok](../a.md) [ok](b.md#step-2) [root](/README.md) [gone](../gone.md) [web](https://x.test/y.md) [here](#top)', exists)
    expect(links.broken.map(b => b.target)).toEqual(['../gone.md'])
    expect(links.checked).toBe(4)

    const paths = missingDocPaths('src/x.ts',
      '// see docs/a.md and docs/old/gone.md; history: fbf193280:docs/old/gone.md; node_modules/next/dist/docs/x.md; file-conventions/error.md',
      ['docs', 'src'], exists)
    expect(paths.missing.map(m => m.target)).toEqual(['docs/old/gone.md'])
    expect(paths.checked).toBe(2)
  })

  it('control: the scope is real — the new doc set and the files that point at it are in view', () => {
    expect(files.length, 'git ls-files returned almost nothing').toBeGreaterThan(400)
    for (const f of ['docs/START-HERE.md', 'docs/architecture.md', 'docs/runbooks/migrations.md', 'docs/product/curriculum.md'])
      expect(onDisk(f), `${f} is missing`).toBe(true)
    expect(ROOTS).toEqual(expect.arrayContaining(['docs', 'e2e', 'src', 'scripts', 'supabase', '.github']))
  })

  const md = files.filter(f => f.endsWith('.md') && !SKIP(f))
  const text = files.filter(f => TEXT.test(f) && !SKIP(f))

  it('every relative link in every doc resolves', () => {
    let checked = 0
    const broken: string[] = []
    for (const f of md) {
      const r = brokenLinks(f, readFileSync(join(ROOT, f), 'utf8'), onDisk)
      checked += r.checked
      broken.push(...r.broken.map(b => `${b.file}:${b.line} → ${b.target}`))
    }
    expect(checked, 'the link parser examined almost nothing — "no broken links" would mean nothing').toBeGreaterThan(LINK_FLOOR)
    expect(broken).toEqual([])
  })

  it('no file names a doc that is not there (applied migrations and `<rev>:<path>` excepted)', () => {
    let checked = 0
    const missing: string[] = []
    for (const f of text) {
      const r = missingDocPaths(f, readFileSync(join(ROOT, f), 'utf8'), ROOTS, onDisk)
      checked += r.checked
      missing.push(...r.missing.map(m => `${m.file}:${m.line} → ${m.target}`))
    }
    expect(checked, 'the path scanner examined almost nothing').toBeGreaterThan(PATH_FLOOR)
    expect(missing).toEqual([])
  })
})
