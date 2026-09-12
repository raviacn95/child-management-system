import { describe, expect, it, beforeEach } from 'vitest'
import { hashPin, pinsMatch, pushResume, readProfile, unlockAchievement, writeProfile } from './profile'

describe('per-profile experience', () => {
  beforeEach(() => localStorage.clear())

  it('saves a look and resume trail for one user only', () => {
    writeProfile('u-priya', { look: 'cinema', accent: 'gold' })
    pushResume('u-priya', { id: 'm1', kind: 'movie', title: 'Drishyam', href: '/movies', at: 1 })
    unlockAchievement('u-priya', 'hub')
    expect(readProfile('u-priya').look).toBe('cinema')
    expect(readProfile('u-dir').look).toBe('grove')
    expect(readProfile('u-priya').resume[0]?.title).toBe('Drishyam')
    expect(readProfile('u-priya').achievements).toContain('hub')
  })

  it('stores a hashed PIN, never the digits', () => {
    writeProfile('u-priya', { pin: hashPin('2468'), locked: true })
    expect(readProfile('u-priya').pin).not.toBe('2468')
    expect(pinsMatch('2468', readProfile('u-priya').pin)).toBe(true)
    expect(pinsMatch('0000', readProfile('u-priya').pin)).toBe(false)
  })
})
