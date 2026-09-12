import { describe, expect, it } from 'vitest'
import { migrateLook, nextLook } from './looks'

describe('UI looks', () => {
  it('migrates the old light/dark toggle into named looks', () => {
    expect(migrateLook('light')).toBe('grove')
    expect(migrateLook('dark')).toBe('cinema')
    expect(migrateLook('system')).toBe('grove')
    expect(migrateLook(null, true)).toBe('cinema')
    expect(migrateLook('harbor')).toBe('harbor')
  })

  it('cycles Grove → Cinema → Harbor', () => {
    expect(nextLook('grove')).toBe('cinema')
    expect(nextLook('cinema')).toBe('harbor')
    expect(nextLook('harbor')).toBe('grove')
  })
})
