// @vitest-environment node
/**
 * A failed nightly backup must tell somebody: `backup.yml`'s `notice` job opens one GitHub issue, updates it while the
 * backup stays red and closes it on the next green run. The job is read from the real file; its script is RUN with
 * `gh` replaced by a recorder on PATH, so what is asserted is the calls it makes, written out by hand:
 *   · it is its own job after `dump`, runs whatever `dump` ended as (`always()`), only on main, and may write issues;
 *   · failure + no open issue → `issue create`; failure + open issue → `issue comment` on it;
 *     success + open issue → `issue close`; success + none → nothing.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync, mkdtempSync, chmodSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
type Job = { needs?: string; if?: string; permissions?: Record<string, string>; steps: { run?: string; env?: Record<string, string> }[] }
const wf = yaml.load(readFileSync(resolve(__dirname, '../../.github/workflows/backup.yml'), 'utf8')) as { jobs: Record<string, Job> }

/** Run the notice script with `RESULT` and an open issue number (or none); return the gh calls it made. */
function run(result: string, existing: string): string[] {
  const script = wf.jobs.notice.steps.find(s => s.run)!.run!
  const dir = mkdtempSync(join(tmpdir(), 'backup-notice-'))
  try {
    const log = join(dir, 'calls')
    writeFileSync(log, '')
    // The fake gh: records every call; `issue list` prints the open issue's number (or nothing).
    writeFileSync(join(dir, 'gh'), `#!/usr/bin/env bash\necho "$1 $2" >> "${log}"\nif [ "$1 $2" = "issue list" ]; then printf '%s' "$FAKE_EXISTING"; fi\n`)
    chmodSync(join(dir, 'gh'), 0o755)
    execFileSync('bash', ['-c', script], {
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, RESULT: result, FAKE_EXISTING: existing, REPO: 'o/r', RUN_URL: 'https://run', GH_TOKEN: 'x' },
    })
    return readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).filter(c => c !== 'issue list')
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

describe('backup.yml tells somebody when the backup fails', () => {
  it('notice is its own job: after dump, whatever dump ended as, only on main, allowed to write issues', () => {
    const n = wf.jobs.notice
    expect(n.needs).toBe('dump')
    expect(n.if).toBe("always() && github.ref == 'refs/heads/main'")
    expect(n.permissions).toEqual({ issues: 'write' })
    expect(n.steps.find(s => s.run)?.env?.RESULT).toBe('${{ needs.dump.result }}')
  })

  it('a failed backup with no open issue opens one', () => expect(run('failure', '')).toEqual(['issue create']))
  it('a cancelled or skipped dump counts as failed too', () => expect(run('cancelled', '')).toEqual(['issue create']))
  it('still failing: comments on the open issue instead of opening a second', () => expect(run('failure', '7')).toEqual(['issue comment']))
  it('green again: closes the open issue', () => expect(run('success', '7')).toEqual(['issue close']))
  it('green with nothing open: no call', () => expect(run('success', '')).toEqual([]))
})
