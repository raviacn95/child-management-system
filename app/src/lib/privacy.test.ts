import { describe, expect, it } from 'vitest'
import { createSeed } from '../data/seed'
import { publicRecommendCopy, publicRecommendInput, sanitizeForDisk, withDemoSecrets } from './privacy'

describe('privacy sanitizer', () => {
  it('strips passwords, session user, and delivery addresses before disk', () => {
    const seeded = createSeed()
    const dirty = {
      ...seeded,
      currentUserId: seeded.users[0]?.id ?? 'u-dir',
      shopOrders: [{ ...seeded.shopOrders[0], address: '12 Rose Lane, Anekal' }],
    }
    const stored = sanitizeForDisk(dirty)
    expect(stored.currentUserId).toBeNull()
    expect(stored.users.every((user) => user.password === '')).toBe(true)
    expect(stored.shopOrders[0]?.address).toBe('')
    expect(JSON.stringify(stored)).not.toMatch(/demo/)
    expect(JSON.stringify(stored)).not.toMatch(/Rose Lane/)
  })

  it('puts demo passwords back in memory so sign-in still works', () => {
    const stored = sanitizeForDisk(createSeed())
    const live = withDemoSecrets(stored)
    const director = live.users.find((user) => user.email === 'director@willow.care')
    expect(director?.password).toBe('demo')
  })

  it('never includes child identity or allergies in network recommendation payloads', () => {
    const publicInput = publicRecommendInput({
      childId: 'c-leo',
      childName: 'Leo Shah',
      ageYears: 4,
      stage: 'nursery',
      interests: ['stories'],
      allergies: ['Peanuts'],
      countryCode: 'IN',
    })
    expect(publicInput.childId).toBeUndefined()
    expect(publicInput.childName).toBeUndefined()
    expect(publicInput.allergies).toEqual([])
    expect(publicInput.ageYears).toBe(4)
    expect(publicRecommendCopy({ ageBand: '2-5', channels: [{ id: 'numberblocks', name: 'Numberblocks' }] })).not.toMatch(
      /Leo|Peanuts|c-leo/,
    )
  })
})
