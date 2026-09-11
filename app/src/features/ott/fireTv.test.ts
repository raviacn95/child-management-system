import { describe, expect, it } from 'vitest'
import { fireTvIntent, FIRE_TV_PACKAGES } from './fireTv'

describe('Fire TV intents', () => {
  it('opens Prime in the official Fire TV package, not Google Movies', () => {
    expect(FIRE_TV_PACKAGES.prime).toBe('com.amazon.avod.thirdpartyclient')
    const href = fireTvIntent('prime', 'Drishyam', 2013)
    expect(href).toContain('package=com.amazon.avod.thirdpartyclient')
    expect(href).toContain('Drishyam')
    expect(href).toContain('phrase=')
  })
})
