/**
 * Reads a legal document from `docs/legal/`. Server only — the pages are static, so this runs in
 * `next build`; the consent route reads it at request time, which is why `next.config.ts` traces
 * `docs/legal/*.md` into that route.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { publicBody, type LegalPage } from './registry'

export const readDoc = (file: string) => readFileSync(join(process.cwd(), 'docs/legal', file), 'utf8')
export const readPublic = (page: LegalPage) => publicBody(page, readDoc(page.source))
