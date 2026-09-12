import { describe, expect, it } from 'vitest'
import { backendHealth, recommendPayload } from './deviceBackend'

describe('device backend', () => {
  it('stays local-first and never marks child PII for egress', () => {
    const health = backendHealth()
    expect(health.mode).toBe('local-first')
    expect(health.piiEgress).toBe(false)
    expect(health.surfaces).toEqual(['windows', 'android-phone', 'fire-stick'])
    const payload = recommendPayload({
      childId: 'c-leo',
      childName: 'Leo Shah',
      ageYears: 4,
      interests: ['stories'],
      allergies: ['Peanuts'],
    })
    expect(payload.ageYears).toBe(4)
    expect(payload.allergies).toEqual([])
    expect(payload).not.toHaveProperty('childName')
    expect(payload).not.toHaveProperty('childId')
  })
})
