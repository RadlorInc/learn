/**
 * N10 (Rafi, 2026-09-26; review MAP-01) — doc 07 must not say the app has no email code while it calls Resend itself.
 * It said "although the application contains no email code of its own" for two days after the consent emails started
 * going out from `features/consent/server.ts`. The fact is measured from the source, the claim from the document,
 * in both languages; expected words written out here.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const read = (p: string) => readFileSync(p, 'utf8')

describe('doc 07 — who sends the email', () => {
  it('POSITIVE CONTROL: the app really does call Resend directly', () => {
    expect(read('src/features/consent/server.ts')).toContain('https://api.resend.com')
  })
  it('so neither language says the app has no email code of its own', () => {
    expect(read('docs/legal/07-subprocessors.md')).not.toMatch(/no email code/i)
    expect(read('docs/legal/es/07-subprocessors.md')).not.toMatch(/no contiene código de correo/i)
  })
  it('and both say the app sends through Resend directly', () => {
    expect(read('docs/legal/07-subprocessors.md')).toContain('The app sends its own emails through Resend directly')
    expect(read('docs/legal/es/07-subprocessors.md')).toContain('La aplicación envía sus propios correos directamente a través de Resend')
  })
})
