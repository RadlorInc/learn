import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * THE DEFECT THIS EXISTS FOR — a padded question that lost its story line.
 *
 * `QuestionBoard` switches to STRUCTURED mode the moment a task supplies `context`
 * OR `instruction` (gameKit, `const structured = ...`), and in that mode the prose
 * `prompt` is never rendered. GameShell then sets `instruction` from
 * `padInstruction` on EVERY padded question:
 *
 *     instruction={padChoices.length ? (task.padInstruction ?? '…') : task.instruction}
 *
 * So a padded task that sets `padInstruction` and no `context` is structured with
 * zone 1 empty: the board shows the math badge and a tap chip, and the sentence the
 * chapter wrote — the one naming what the numbers ARE — is silently dropped.
 *
 * The whole 12–14 band got a `context` in the 2026-07-24 explaining pass. The 15–16
 * band was rebuilt five days earlier and never received it, so five of its twelve
 * chapters shipped with no `context` at all and their prompts were dead code. This
 * gate is what stops the next padded question doing the same.
 *
 * Source check, deliberately: importing these modules pulls framer-motion and the
 * whole React tree in for what is a config-shape invariant. Same reasoning (and
 * same shape) as answerPadGrading.test.ts, its sibling.
 */
const GAMES = join(process.cwd(), 'src/features/chapters/teen/games')

/**
 * Cut a chapter source into one chunk per task literal. Every task in every teen
 * chapter carries a `badge:` — that is the math hero, so a task without one has
 * nothing to show — and `context`/`padInstruction` always follow it in the literal,
 * which makes the badge LINE a reliable delimiter without brace matching.
 *
 * ⚠️ Match the whole line, not `badge:` at its start. An earlier version anchored on
 * `^\s*(?:kind:[^\n]*)?badge:` and so missed every task written `title: …, badge: …`
 * — WeatherStation's four collapsed into one chunk, and a neighbouring task's
 * `context` then covered a missing one. A planted regression walked straight through
 * it. Splitting on more lines can only make the check STRICTER, never looser.
 */
function taskChunks(src: string): string[] {
  const starts: number[] = []
  const re = /^[^\n]*\bbadge:/gm
  for (let m = re.exec(src); m; m = re.exec(src)) starts.push(m.index)
  return starts.map((s, i) => src.slice(s, starts[i + 1] ?? src.length))
}

describe('padded questions keep their story line', () => {
  const files = readdirSync(GAMES).filter((f) => f.endsWith('.tsx'))

  it('finds task literals to check (guards the test against a silent no-op)', () => {
    const total = files.reduce((n, f) => n + taskChunks(readFileSync(join(GAMES, f), 'utf8')).length, 0)
    // 98 across the 24 teen chapters at the time of writing. The floor only has to
    // prove the delimiter still matches something — a regex that silently stops
    // matching would otherwise make every per-file check below vacuously pass.
    expect(total).toBeGreaterThan(80)
  })

  it.each(files)('%s — every padInstruction task also sets a context', (file) => {
    const src = readFileSync(join(GAMES, file), 'utf8')
    const naked = taskChunks(src)
      // `[,:]` — the property may be written `context: '…'` OR as the shorthand
      // `context,` fed by a local computed above the literal (GearLab picks its
      // wording off the exponent that way). Matching only `context:` reported that
      // as a missing story line, which it is not.
      .filter((c) => /\bpadInstruction:/.test(c) && !/^\s*context\s*[,:]/m.test(c))
      // The chunk's own title, for a failure message that names the task.
      .map((c) => (c.match(/title: '([^']+)'/) ?? [, '(untitled)'])[1])

    expect(naked, `${file}: ${naked.length} padded task(s) — ${naked.join(', ')} — set ` +
      '`padInstruction` but no `context`. GameShell maps padInstruction onto the board\'s ' +
      '`instruction`, which puts QuestionBoard in structured mode, and structured mode never ' +
      'renders `prompt`. Those questions show the badge and a tap chip with an EMPTY story ' +
      'zone. Add a `context` line: plain words, names what the numbers are, explains the idea ' +
      'and never the answer — and it must be TRUE FOR EVERY SEED the generator can draw ' +
      '(Leaderboard once told a child two positive changes "partly cancel out").').toEqual([])
  })
})
