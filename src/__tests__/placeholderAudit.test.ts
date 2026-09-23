/**
 * EVERY PLACEHOLDER IN THE LEGAL DOCUMENTS IS IN ONE TABLE, WITH WHO RESOLVES IT (Round 1, R11).
 *
 * `docs/legal/PLACEHOLDERS.md` lists each `[PLACEHOLDER — …]` in the numbered documents with its file, line,
 * text, category and owner. A table like that is a measurement written into prose — true on the day it was
 * made (CLAUDE.md) — so this test re-measures it on every run: the rows must be EXACTLY the placeholders in
 * the documents, one for one. Add, remove, move or reword a placeholder and this goes red until the table
 * says so too.
 *
 * ⚠️ The expectation comes from the TABLE (written by a person) and the actual from the DOCUMENTS; neither is
 * derived from the other, so the check cannot pass by the code equalling itself.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'docs/legal'
const CATEGORIES = ['built', 'repo', 'rafi', 'attorney', 'provider', 'date', 'marker'] as const

type Row = { file: string; line: number; text: string; category: string }
const key = (r: { file: string; line: number; text: string }) => `${r.file}:${r.line}: ${r.text}`

/** What the documents actually contain. Numbered documents only (01–16); the Spanish drafts and this
 *  folder's own records (README, LOOP-STATE, READINESS, the packet, this table) are not documents. */
export function measure(dir = DIR): { file: string; line: number; text: string }[] {
  const out: { file: string; line: number; text: string }[] = []
  for (const file of readdirSync(dir).filter(f => /^\d\d-.*\.md$/.test(f)).sort()) {
    readFileSync(join(dir, file), 'utf8').split('\n').forEach((l, i) => {
      for (const m of l.matchAll(/\[PLACEHOLDER[^\]]*\]/g)) out.push({ file, line: i + 1, text: m[0] })
    })
  }
  return out
}

/** The table: `| n | file | line | text | category | owner | resolution |`, text in backticks. */
export function table(md = readFileSync(join(DIR, 'PLACEHOLDERS.md'), 'utf8')): Row[] {
  return md.split('\n')
    .filter(l => /^\| \d+ \|/.test(l))
    .map(l => {
      const [, file, line, text, category] = l.split(' | ').map(c => c.trim())
      return { file, line: Number(line), text: text.replace(/^`|`$/g, '').replace(/\\\|/g, '|'), category }
    })
}

describe('PLACEHOLDERS.md is every placeholder, and nothing else', () => {
  const docs = measure(), rows = table()

  it('sees placeholders at all (control — a blind grep and a clean corpus look the same)', () => {
    expect(docs.length, 'the grep found no placeholders — the corpus moved, or the pattern is blind').toBeGreaterThan(20)
    expect(rows.length, 'the table parsed to no rows').toBeGreaterThan(20)
  })

  it('the table count is the grep count', () => {
    const summary = readFileSync(join(DIR, 'PLACEHOLDERS.md'), 'utf8').match(/\*\*Total: (\d+)\*\*/)
    expect(summary, 'PLACEHOLDERS.md has no "**Total: N**" line').not.toBeNull()
    expect(rows.length).toBe(docs.length)
    expect(Number(summary![1])).toBe(docs.length)
  })

  it('every placeholder in a document has its row, and every row is a placeholder in a document', () => {
    const d = docs.map(key).sort(), t = rows.map(key).sort()
    expect(d.filter(x => !t.includes(x)), 'in a document, missing from PLACEHOLDERS.md').toEqual([])
    expect(t.filter(x => !d.includes(x)), 'in PLACEHOLDERS.md, not in any document (resolved, moved or reworded?)').toEqual([])
  })

  it('every row has a known category', () => {
    expect(rows.filter(r => !CATEGORIES.includes(r.category as never)).map(key)).toEqual([])
  })

  it('nothing is left in the "built" or "repo" categories — those are resolved by engineering, not waited on', () => {
    expect(rows.filter(r => r.category === 'built' || r.category === 'repo').map(key)).toEqual([])
  })
})
