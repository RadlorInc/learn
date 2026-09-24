/**
 * THE WORDS A CHILD MUST NEVER SEE (founder's rule 6, 2026-09-24): no "failed", "wrong", "locked", "incomplete",
 * "not completed", "quit", "leave", and no bare percentage — on any child screen, in English or in the Spanish drafts.
 *
 * What it reads, and why that is the right boundary:
 *   · every line of `sessionCopy.ts`, both languages, by calling it (functions with sample arguments);
 *   · every SENTENCE on the child screens' UI chrome — JSX text and string literals containing a space — parsed with
 *     the TypeScript compiler, so a comment or an identifier (`'failed'` as a state name, `p.wrong` as a prop) is not a
 *     sentence and cannot trip it.
 *   · NOT the lesson content (`content/`, `ladders/`): Screen 7 deliberately crosses out "the wrong move" and a ladder
 *     level is "spot the mistake". That is maths, not a verdict on the child.
 * ⚠️ The word lists are written out here, not imported: a check that derives its expectation from the code under test
 * passes because the code equals itself.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { SESSION_COPY } from '@/features/lessons/sessionCopy'

// ⚠️ `lock(ed|s)?`, not `locked?`: the second means "locke" + optional "d" and never matched "lock" (found by a planted break).
const EN = /\b(fail(ed|s|ure)?|wrong|lock(ed|s)?|incomplete|not completed?|quit|leave|leaving)\b/i
const ES = /\b(fall(aste|ado|ó|o)|incorrect[oa]|equivocad[oa]|bloquead[oa]|incomplet[oa]|no completad[oa]|salir|abandonar|dejar)\b/i
const PERCENT = /\d\s*%|%\s*$|\$\{[^}]*\}\s*%/

const CHILD_SCREENS = [
  'src/features/lessons/LessonPlayer.tsx', 'src/features/lessons/ModulePractice.tsx', 'src/features/lessons/LessonList.tsx',
  'src/features/lessons/ModuleHome.tsx', 'src/features/lessons/PracticeLayout.tsx', 'src/features/lessons/Frame.tsx',
  'src/features/lessons/Feedback.tsx', 'src/features/lessons/AnswerInput.tsx',
  'src/app/modules/page.tsx', 'src/app/lesson/page.tsx', 'src/app/play/page.tsx',
  'src/features/lessons/VerticalNumberLine.tsx',
]

/** Every line a copy object can produce: strings as they are, functions called with sample arguments. */
function lines(copy: Record<string, unknown>): string[] {
  return Object.values(copy).flatMap(v => (typeof v === 'string' ? [v] : typeof v === 'function' ? [1, 5, 12].map(n => String((v as (...a: unknown[]) => unknown)(n, 'Fractions'))) : []))
}

/** Style code, not words: a `style={…}` attribute, a `<style>` element, or the value of a CSS property in an object
 *  (`{ width: '100%' }`). ⚠️ Only a key the browser knows as a CSS property: a child's sentence kept in an object
 *  (`{ failed: "The game couldn't start…" }` on /play) must still be read — the control below proves it is. */
function isStyle(n: ts.Node): boolean {
  for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
    if (ts.isJsxAttribute(p) && p.name.getText() === 'style') return true
    if (ts.isJsxElement(p) && p.openingElement.tagName.getText() === 'style') return true
    if (ts.isPropertyAssignment(p) && p.name.getText().replace(/['"]/g, '') in document.body.style) return true
  }
  return false
}

/** The sentences in a .tsx file: JSX text, and string/template literals that contain a space, outside style code. */
function sentences(file: string): string[] {
  const src = ts.createSourceFile(file, readFileSync(resolve(__dirname, '../..', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: string[] = []
  const visit = (n: ts.Node) => {
    if (isStyle(n)) return
    if (ts.isJsxText(n)) { const t = n.getText().trim(); if (t) out.push(t) }
    else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { if (/\s/.test(n.text.trim()) && !ts.isImportDeclaration(n.parent)) out.push(n.text) }
    else if (ts.isTemplateExpression(n)) out.push(n.getText().slice(1, -1))
    ts.forEachChild(n, visit)
  }
  visit(src)
  return out
}

describe('child-facing words', () => {
  it('the new session lines, English and the Spanish draft, say none of them', () => {
    const en = lines(SESSION_COPY.en), es = lines(SESSION_COPY.es)
    expect(en.length, 'control: the copy was read').toBeGreaterThan(10)
    expect(en.filter(t => EN.test(t) || PERCENT.test(t))).toEqual([])
    expect(es.filter(t => ES.test(t) || EN.test(t) || PERCENT.test(t))).toEqual([])
    // Both languages have every line — a missing Spanish line would read as a finished one.
    expect(Object.keys(SESSION_COPY.es).sort()).toEqual(Object.keys(SESSION_COPY.en).sort())
  })

  it('the child screens say none of them', () => {
    const found = CHILD_SCREENS.flatMap(f => sentences(f).filter(t => EN.test(t) || PERCENT.test(t)).map(t => `${f}: ${t}`))
    expect(found).toEqual([])
  })

  it('control: the reader sees the screens\' sentences, and the patterns catch each forbidden word', () => {
    expect(sentences('src/features/lessons/LessonPlayer.tsx')).toContain('Watch the lesson again')
    expect(sentences('src/features/lessons/ModuleHome.tsx').join('\n')).toContain('Keep learning')
    expect(sentences('src/features/lessons/LessonPlayer.tsx').join('\n')).toContain('Here&apos;s how this one works:')
    // A sentence kept as an object's value is read; a CSS value is not.
    expect(sentences('src/app/play/page.tsx')).toContain("The game couldn't start. Try again.")
    expect(sentences('src/features/lessons/Frame.tsx').some(t => t.includes('* 100)}%'))).toBe(false)
    for (const w of ['You failed', 'That is wrong', 'Locked', 'Skip the lock', 'Incomplete', 'Not completed', 'Quit', 'Leave now', '23%', '7 %'])
      expect(EN.test(w) || PERCENT.test(w), w).toBe(true)
    for (const w of ['Fallaste', 'Incorrecto', 'Bloqueado', 'Incompleto', 'No completado', 'Salir', 'Abandonar'])
      expect(ES.test(w), w).toBe(true)
    // …and not the ordinary words a child does see.
    for (const w of ['Keep going', 'Take a break', 'Your spot is saved.', 'Keep practicing', 'Seguir practicando'])
      expect(EN.test(w) || ES.test(w) || PERCENT.test(w), w).toBe(false)
  })
})
