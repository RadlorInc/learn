import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * THE BUG THIS EXISTS FOR.
 *
 * GameShell hands a tapped AnswerPad choice to `config.grade` as a RAW NUMBER.
 * That is only correct for chapters whose value type IS `number`. A chapter with a
 * tagged-union value (`{k:'num',n} | {k:'pick',id}`) evaluates `v.k === 'num'` on a
 * number, gets `undefined`, and marks EVERY answer wrong — including the correct
 * one. `data-test-answer` also resolves to '' because no choice grades true.
 *
 * It shipped to production in Leaderboard and survived a live tap-through, because
 * a wrong answer still advances to the next question: the flow looks perfectly
 * normal. Three separate readers had to notice it independently. Two more chapters
 * then reproduced it within a day.
 *
 * The fix is `GameConfig.padValue`, which maps the number into the chapter's value
 * type. This test asserts nobody can add an `answerPad` to a tagged-union chapter
 * and forget it — a source check, because importing these modules pulls in
 * framer-motion and the whole React tree for what is a config-shape invariant.
 */
const GAMES = join(process.cwd(), 'src/features/chapters/teen/games')

/** A value type is a tagged union when it declares `k: 'literal'` members. */
const isTaggedUnion = (src: string): boolean => {
  const decl = src.match(/^type (?:V|Val) =[\s\S]*?(?=\n(?:interface|const|function|export|\/\*|\/\/)\s)/m)
  return !!decl && /\bk:\s*'/.test(decl[0])
}

/** Does grade defensively accept a bare number? (An equally valid fix.) */
const guardsRawNumber = (src: string): boolean =>
  /typeof\s*\(?\s*(?:v|raw)[^)]*\)?\s*===\s*'number'/.test(src)

describe('AnswerPad grading contract', () => {
  const files = readdirSync(GAMES).filter((f) => f.endsWith('.tsx'))
  const padded = files.filter((f) => readFileSync(join(GAMES, f), 'utf8').includes('answerPad:'))

  it('finds the padded chapters (guards the test itself against a silent no-op)', () => {
    expect(padded.length).toBeGreaterThan(5)
  })

  it.each(padded)('%s — a tapped number reaches grade as this chapter\'s value type', (file) => {
    const src = readFileSync(join(GAMES, file), 'utf8')
    if (!isTaggedUnion(src)) return // V is a number (or number-first union): the cast is honest
    const ok = src.includes('padValue:') || guardsRawNumber(src)
    expect(ok, `${file} has answerPad and a tagged-union value type, but neither a \`padValue\` ` +
      'mapper nor a raw-number guard in `grade`. Every padded question in it will mark correct ' +
      'answers WRONG, silently — the question still advances, so it looks fine. Add ' +
      '`padValue: (n) => ({ k: \'num\', n })` to its GameConfig.').toBe(true)
  })
})
