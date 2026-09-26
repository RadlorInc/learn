/**
 * Every STATIC line the KG–2 story chapters can speak, read out of the source with the TypeScript
 * parser — for `chapterVoiceCorpus.test.ts`, which requires each one to have a row in the clip corpus.
 *
 * A literal counts only when it can be the WHOLE spoken string: it is reached from a spoken root
 * through nothing but ternaries, `??`/`||`, parentheses, array elements, arrow/return bodies and
 * `as`. A fragment inside a `${}` template, a `+` concatenation or another call's argument
 * (`.join(', ')`) is not a line and is never collected.
 *
 * Spoken roots, as the chapters actually call them (read 2026-09-25):
 *   • every argument of speak / speakAfterCurrent / speakAt / speakSteps / speakSeq / speakPaced;
 *   • the value of a `say:` property (SkillBeat speaks `beat.say ?? beat.prompt`), and of `prompt:`
 *     in an object literal that has no `say:`;
 *   • `bubble:` (StoryWorld speaks each scene's bubble).
 * An identifier is followed to its declaration in the same file; a call to a same-file function is
 * followed into its returns; `x.foo` is followed to every `foo:` property in the same file.
 */
import ts from 'typescript'
import { readFileSync, readdirSync } from 'node:fs'

const SPEAKERS = new Set(['speak', 'speakAfterCurrent', 'speakAt', 'speakSteps', 'speakSeq', 'speakPaced'])

/** `template` rows carry a `${}`: `text` is then an anchored regex source with each `${}` as `(.*?)`. */
export interface SpokenLiteral { file: string; line: number; text: string; template?: boolean }

const esc = (t: string) => t.replace(/\s+/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function spokenLiterals(files: string[]): SpokenLiteral[] {
  const out: SpokenLiteral[] = []
  type Ix = { decls: Map<string, ts.Node[]>; props: Map<string, ts.Node[]>; imports?: Set<string> }
  const push = (m: Map<string, ts.Node[]>, k: string, v: ts.Node) => { const a = m.get(k) ?? []; a.push(v); m.set(k, a) }
  const all: Ix = { decls: new Map(), props: new Map() }
  const parsed = files.map(file => {
    const src = readFileSync(file, 'utf8')
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const own: Ix = { decls: new Map(), props: new Map(), imports: new Set() }
    const index = (n: ts.Node): void => {
      if (ts.isImportSpecifier(n)) own.imports!.add(n.name.text)
      // `let lines: string[]` … `lines = [...]` — an assignment is a declaration for this purpose
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(n.left)) push(own.decls, n.left.text, n.right)
      for (const ix of [own, all]) {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) push(ix.decls, n.name.text, n.initializer)
        if (ts.isFunctionDeclaration(n) && n.name && n.body) push(ix.decls, n.name.text, n)
        if (ts.isPropertyAssignment(n) && (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name))) push(ix.props, n.name.text, n.initializer)
      }
      ts.forEachChild(n, index)
    }
    index(sf)
    return { file, sf, own }
  })
  // A name is looked up in its own file, and across the chapter set only when the file IMPORTS it
  // (a helper from clock.ts, a table from biomes.ts). An unresolved local — a parameter — stays
  // unresolved: falling back to every same-named declaration pulled in other files' `lines`.
  const look = (ix: Ix, name: string) => ix.decls.get(name) ?? (ix.imports!.has(name) ? all.decls.get(name) : undefined) ?? []
  for (const { file, sf, own } of parsed) {

    // where the LITERAL lives, which is not always the file whose call reached it
    const at = (n: ts.Node, l: { text: string; template?: boolean }): SpokenLiteral => {
      const f = n.getSourceFile()
      return { file: f.fileName, line: f.getLineAndCharacterOfPosition(n.getStart()).line + 1, ...l }
    }
    const seen = new Set<ts.Node>()
    const collect = (n: ts.Node | undefined): void => {
      if (!n || seen.has(n)) return
      seen.add(n)
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
        if (/[A-Za-z0-9]/.test(n.text)) out.push(at(n, { text: n.text }))
      } else if (ts.isTemplateExpression(n)) {
        const parts = [n.head.text, ...n.templateSpans.map(sp => sp.literal.text)]
        out.push(at(n, { template: true,
          text: '^' + parts.map(esc).join('(.*?)').trim() + '$' }))
      } else if (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isNonNullExpression(n) || ts.isSatisfiesExpression(n)) collect(n.expression)
      else if (ts.isConditionalExpression(n)) { collect(n.whenTrue); collect(n.whenFalse) }
      else if (ts.isBinaryExpression(n) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(n.operatorToken.kind)) { collect(n.left); collect(n.right) }
      else if (ts.isArrayLiteralExpression(n)) n.elements.forEach(collect)
      else if (ts.isSpreadElement(n)) collect(n.expression)
      else if (ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n)) collect(n.body)
      else if (ts.isBlock(n)) { const walk = (m: ts.Node): void => { if (ts.isReturnStatement(m)) collect(m.expression); else if (!ts.isFunctionLike(m)) ts.forEachChild(m, walk) }; walk(n) }
      else if (ts.isIdentifier(n)) look(own, n.text).forEach(collect)
      else if (ts.isCallExpression(n)) collect(n.expression)          // f(x) → f's returns; T[k](n) → the table's functions
      else if (ts.isObjectLiteralExpression(n)) n.properties.forEach(p => { if (ts.isPropertyAssignment(p)) collect(p.initializer) })
      else if (ts.isPropertyAccessExpression(n)) (own.props.get(n.name.text) ?? []).forEach(collect)   // properties: own file only (`.label` is everywhere)
      else if (ts.isElementAccessExpression(n)) collect(n.expression)   // LINES[i] → the table
    }

    // A local wrapper that hands its parameter to a speaker IS a speaker:
    //   const say = useCallback((s: string) => { setNote(s); speak(s) }, [])
    const speakers = new Set(SPEAKERS)
    const fnOf = (init: ts.Node | undefined): ts.SignatureDeclaration | undefined => {
      if (!init) return
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init) || ts.isFunctionDeclaration(init)) return init
      if (ts.isCallExpression(init) && init.arguments[0] && (ts.isArrowFunction(init.arguments[0]) || ts.isFunctionExpression(init.arguments[0]))) return init.arguments[0]
    }
    for (let grew = true; grew;) {
      grew = false
      const scan = (n: ts.Node): void => {
        const name = ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) ? n.name.text : ts.isFunctionDeclaration(n) && n.name ? n.name.text : ''
        const fn = name && !speakers.has(name) ? fnOf(ts.isVariableDeclaration(n) ? n.initializer : n) : undefined
        if (fn) {
          const params = new Set(fn.parameters.map(p => (ts.isIdentifier(p.name) ? p.name.text : '')))
          const hands = (m: ts.Node): boolean => (ts.isCallExpression(m) && ts.isIdentifier(m.expression) && speakers.has(m.expression.text)
            && !!m.arguments[0] && ts.isIdentifier(m.arguments[0]) && params.has(m.arguments[0].text)) || !!ts.forEachChild(m, x => hands(x) || undefined)
          if (hands(fn)) { speakers.add(name); grew = true }
        }
        ts.forEachChild(n, scan)
      }
      scan(sf)
    }

    const visit = (n: ts.Node): void => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && speakers.has(n.expression.text)) n.arguments.slice(0, 1).forEach(collect)
      if (ts.isObjectLiteralExpression(n)) {
        const names = n.properties.map(p => p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : '')
        for (const p of n.properties) {
          if (!ts.isPropertyAssignment(p) && !ts.isMethodDeclaration(p)) continue
          const name = names[n.properties.indexOf(p)]
          const spoken = name === 'say' || name === 'bubble' || (name === 'prompt' && !names.includes('say'))
          if (spoken) collect(ts.isPropertyAssignment(p) ? p.initializer : p)
        }
      }
      ts.forEachChild(n, visit)
    }
    visit(sf)
  }
  // one entry per (file, text)
  const key = (l: SpokenLiteral) => l.file + '\0' + l.text + (l.template ? '\0t' : '')
  return [...new Map(out.map(l => [key(l), l])).values()]
}

/**
 * The KG–2 chapters' source: every file under features/chapters/story (chapters and the helpers they
 * speak through — clock.ts, slice.ts, market.ts), Chapter 1's wrapper, and the shared end card.
 * A glob, not a list, so a new file is scanned without anybody remembering to add it.
 */
export function chapterSourceFiles(root = process.cwd()): string[] {
  const dir = `${root}/src/features/chapters/story/`
  return [
    ...readdirSync(dir).filter(f => /\.tsx?$/.test(f)).sort().map(f => dir + f),
    `${root}/src/features/chapters/game/CountingStoryChapter.tsx`,
    `${root}/src/shared/ui/ChapterDone.tsx`,
  ]
}

/** Which chapter a source file speaks for. Shared plumbing (StoryWorld, WorldSelect, the end card…)
 *  is attributed to `counting`, the first chapter in play order. */
const FILE_CHAPTER: Record<string, string> = {
  FollowTheLeader: 'numberOrdering', NestTree: 'numberRecognition', HomeTime: 'matchingQuantities',
  BigOrSmall: 'numberComparison', ShapeTown: 'shapes', RainbowTown: 'colors', BeadShop: 'patterns',
  PlayTime: 'addition', PlayTimeSub: 'subtraction', MeasureIt: 'measurement',
  NumberTown: 'numbersTo100', BuildingBlocks: 'placeValue', HopAlong: 'skipCounting', StoryTime: 'storyProblems',
  MarketDay: 'multiplication', SliceShop: 'fractions', slice: 'fractions', CoinShop: 'money', market: 'money',
  TickTock: 'time', clock: 'time', SeesawPark: 'compareNumbers', BlockYard: 'additionTo100', yard: 'additionTo100',
  ShapeStudio: 'shapes2d3d',
}
export const chapterOfFile = (file: string) => FILE_CHAPTER[file.replace(/^.*\//, '').replace(/\.tsx?$/, '')] ?? 'counting'
