/** The name the consent email greets: typed at signup, else Google's — and nothing an account holder
 *  could write into their own metadata survives as markup or a link. Expectations written by hand. */
import { describe, it, expect } from 'vitest'
import { firstNameOf } from '@/features/consent/firstName'

describe('firstNameOf', () => {
  it('prefers the typed first name, then Google\'s given_name, then the first word of full_name / name', () => {
    expect(firstNameOf({ first_name: 'Maya', given_name: 'M', full_name: 'Other Person' })).toBe('Maya')
    expect(firstNameOf({ given_name: 'Rafi', full_name: 'Rafi Kuwari' })).toBe('Rafi')
    expect(firstNameOf({ full_name: 'Ana María López' })).toBe('Ana')
    expect(firstNameOf({ name: 'Zoë' })).toBe('Zoë')
  })
  it('nothing usable → null (the email then says "Hi,")', () => {
    expect(firstNameOf(null)).toBeNull()
    expect(firstNameOf({})).toBeNull()
    expect(firstNameOf({ first_name: '   ' })).toBeNull()
    expect(firstNameOf({ first_name: '<>{}' })).toBeNull()
  })
  it('keeps letters, hyphens and apostrophes only, at most 40', () => {
    expect(firstNameOf({ first_name: "O'Neil-Smith" })).toBe("O'Neil-Smith")
    expect(firstNameOf({ first_name: '<b>Eve</b>' })).toBe('bEveb')
    expect(firstNameOf({ first_name: '[Eve](http://x)' })).toBe('Evehttpx')
    expect(firstNameOf({ first_name: 'a'.repeat(60) })).toHaveLength(40)
  })
})
