import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Every Playwright spec a workflow names exists.
 *
 * Why: `npx playwright test a.spec.ts b.spec.ts` with `b` deleted runs `a` and reports green — the missing file is
 * not an error. nightly-e2e.yml and the (since deleted) weekly-layout.yml each went on
 * naming a spec for weeks after it was deleted (found 2026-10). This runs in `ci.yml` on every PR,
 * so the PR that deletes or renames a spec goes red, not a scheduled run nobody watches.
 *
 * Property checked: every `e2e/<name>.spec.ts` token in any `.github/workflows/*.yml` is a file in the repo. The
 * sweep spec the nightly must name is written out by hand below, as the positive control that the scan sees it.
 */
const WF = resolve(process.cwd(), '.github/workflows')
const named = (file: string) =>
  [...readFileSync(resolve(WF, file), 'utf8').matchAll(/e2e\/[A-Za-z0-9_.-]+\.spec\.ts/g)].map((m) => m[0])

describe('workflows name only spec files that exist', () => {
  it('the scan sees the sweep each scheduled job runs (positive control)', () => {
    expect(named('nightly-e2e.yml')).toContain('e2e/all-chapters.spec.ts')
  })

  for (const file of readdirSync(WF).filter((f) => /\.ya?ml$/.test(f))) {
    it(`${file}: every named e2e spec exists`, () => {
      const missing = named(file).filter((p) => !existsSync(resolve(process.cwd(), p)))
      expect(missing, `${file} names spec files that do not exist`).toEqual([])
    })
  }
})
