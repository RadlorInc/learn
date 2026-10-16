// @vitest-environment node
/**
 * The production dump is encrypted to the founder's age PUBLIC key, so nothing GitHub holds can open a backup.
 *
 * Before 2026-10-16 the dump was encrypted with a passphrase stored as a GitHub secret: the value that locked a backup
 * also opened it, and the artifacts sit on a public repository. Now the runner gets only `vars.BACKUP_AGE_RECIPIENT`
 * (age1…, encrypt-only). These checks pin the three halves of that by hand:
 *   1. the composite encrypts with `age -r` from its `recipient` input and uploads the `.age` file;
 *   2. both callers (nightly backup, pre-migration backup) pass the recipient from a repository VARIABLE;
 *   3. no workflow or action references anything that decrypts: the old passphrase secret, an age identity, `age -d`,
 *      or openssl's decrypt mode.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
const yaml = createRequire(import.meta.url)('js-yaml') as { load(s: string): unknown }
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

type Step = { name?: string; uses?: string; run?: string; env?: Record<string, string>; with?: Record<string, string> }
const ACTION = '.github/actions/prod-backup/action.yml'
const action = yaml.load(read(ACTION)) as { inputs: Record<string, unknown>; runs: { steps: Step[] } }

/** Every workflow + composite action file, as [path, text]. */
const ciFiles: [string, string][] = [
  ...readdirSync(join(ROOT, '.github/workflows')).filter((f) => /\.ya?ml$/.test(f)).map((f) => `.github/workflows/${f}`),
  ACTION,
].map((p) => [p, read(p)])

/** Lines that could DECRYPT a dump. Written out by hand; comments are ignored (they may explain the old way). */
export function decryptingLines(text: string): string[] {
  return text
    .split('\n')
    .filter((l) => !/^\s*#/.test(l))
    .filter((l) => /secrets\.BACKUP_PASSPHRASE|AGE-SECRET-KEY|\bage\s+(-d|--decrypt)\b|openssl\s+enc\s+-d\b|BACKUP_AGE_KEY/.test(l))
}

describe('backups are encrypted to an offline age key', () => {
  it('the composite takes a recipient input and no passphrase input', () => {
    expect(Object.keys(action.inputs).sort()).toEqual(['access-token', 'artifact-name', 'db-password', 'project-ref', 'recipient'])
  })

  it('the Encrypt step runs age -r with the recipient from its input, then uploads the .age file', () => {
    const steps = action.runs.steps
    const enc = steps.find((s) => s.name === 'Encrypt')
    expect(enc?.env?.RECIPIENT).toBe('${{ inputs.recipient }}')
    expect(enc?.run).toMatch(/\bage -r "\$RECIPIENT" -o milo-backup\.tar\.gz\.age milo-backup\.tar\.gz/)
    const upload = steps.find((s) => s.uses?.startsWith('actions/upload-artifact@'))
    expect(upload?.with?.path).toBe('milo-backup.tar.gz.age')
    // Encrypt comes before Upload, so the plaintext never reaches it.
    expect(steps.indexOf(enc!)).toBeLessThan(steps.indexOf(upload!))
  })

  it('both callers pass the recipient from a repository variable, never a secret', () => {
    const callers = ciFiles
      .filter(([p]) => p.startsWith('.github/workflows/'))
      .flatMap(([p, t]) => {
        const wf = yaml.load(t) as { jobs?: Record<string, { steps?: Step[] }> }
        return Object.entries(wf.jobs ?? {}).flatMap(([job, j]) =>
          (j.steps ?? []).filter((s) => s.uses === './.github/actions/prod-backup').map((s) => ({ where: `${p}/${job}`, recipient: s.with?.recipient })),
        )
      })
    expect(callers).toEqual([
      { where: '.github/workflows/backup.yml/dump', recipient: '${{ vars.BACKUP_AGE_RECIPIENT }}' },
      { where: '.github/workflows/deploy.yml/migrate-prod', recipient: '${{ vars.BACKUP_AGE_RECIPIENT }}' },
    ])
  })

  it('positive control: the decrypt scan catches each shape it is for', () => {
    expect(decryptingLines('      passphrase: ${{ secrets.BACKUP_PASSPHRASE }}')).toHaveLength(1)
    expect(decryptingLines('        run: age -d -i key.txt x.age')).toHaveLength(1)
    expect(decryptingLines('        run: openssl enc -d -aes-256-cbc -in x')).toHaveLength(1)
    expect(decryptingLines('      KEY: ${{ secrets.BACKUP_AGE_KEY }}')).toHaveLength(1)
    expect(decryptingLines('# openssl enc -d … (how older dumps open)')).toEqual([])
  })

  it('no workflow or action holds anything that decrypts a dump', () => {
    expect(ciFiles.flatMap(([p, t]) => decryptingLines(t).map((l) => `${p}: ${l.trim()}`))).toEqual([])
  })
})
