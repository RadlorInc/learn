/** Speed Insights sends the page's PATH only — a consent link's `#t=` token and any `?` parameters stay on the device. */
import { describe, it, expect } from 'vitest'
import { pathOnly } from '@/infra/SpeedInsights'

describe('Speed Insights page address', () => {
  it('drops the query and the fragment', () => {
    expect(pathOnly('https://radlic.com/consent/respond#t=abc123')).toBe('https://radlic.com/consent/respond')
    expect(pathOnly('https://radlic.com/modules?grade=4#x')).toBe('https://radlic.com/modules')
    expect(pathOnly('https://radlic.com/modules')).toBe('https://radlic.com/modules')
  })
})
