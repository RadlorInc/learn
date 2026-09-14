/**
 * Which adult page belongs to which role. The map is WRITTEN OUT here on purpose (not derived from
 * the pages): moving a page to another role, or dropping its gate, takes an edit here too.
 * Pages not listed (/parent, /parent/invites, /parent/account) are shared by both roles.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { roleGateRedirect } from '@/shared/ui/RoleGate'

const PAGES: Record<string, 'teacher' | 'parent'> = {
  'src/app/parent/grades/page.tsx':        'teacher',
  'src/app/parent/grades/triage/page.tsx': 'teacher',
  'src/app/parent/plan/page.tsx':          'parent',
}

describe('role gate', () => {
  it('lets the matching role in and sends everyone else to /parent', () => {
    expect(roleGateRedirect('teacher', 'teacher')).toBeNull()
    expect(roleGateRedirect('parent', 'parent')).toBeNull()
    expect(roleGateRedirect('teacher', 'parent')).toBe('/parent')
    expect(roleGateRedirect('parent', 'teacher')).toBe('/parent')
    expect(roleGateRedirect('teacher', null)).toBe('/parent')
    expect(roleGateRedirect('parent', 'learner')).toBe('/parent')
  })

  for (const [file, role] of Object.entries(PAGES)) {
    it(`${file} is ${role}-only`, () => {
      const src = readFileSync(file, 'utf8')
      // The default export itself must be the gate, so nothing renders before the role is known.
      const exp = src.match(/export default function \w+\(\) \{\s*return (<RoleGate role="(\w+)">)/)
      expect(exp, 'default export does not return <RoleGate> first').not.toBeNull()
      expect(exp![2]).toBe(role)
    })
  }
})
