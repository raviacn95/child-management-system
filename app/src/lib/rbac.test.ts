import { describe, expect, it } from 'vitest'
import { canDo, canSee, moduleFromPath } from '../lib/rbac'

describe('RBAC', () => {
  it('lets directors see every module', () => {
    expect(canSee('director', 'settings')).toBe(true)
    expect(canSee('teacher', 'settings')).toBe(false)
    expect(canSee('parent', 'attendance')).toBe(false)
    expect(canSee('parent', 'erotic')).toBe(true)
    expect(canSee('teacher', 'erotic')).toBe(false)
    expect(canSee('parent', 'hub')).toBe(true)
    expect(canSee('teacher', 'hub')).toBe(true)
  })

  it('maps paths to modules', () => {
    expect(moduleFromPath('/')).toBe('dashboard')
    expect(moduleFromPath('/hub')).toBe('hub')
    expect(moduleFromPath('/learning')).toBe('learning')
    expect(moduleFromPath('/parent-feed')).toBe('parent-feed')
    expect(moduleFromPath('/movies')).toBe('movies')
    expect(moduleFromPath('/tv')).toBe('tv')
    expect(moduleFromPath('/ott')).toBe('ott')
    expect(moduleFromPath('/erotic')).toBe('erotic')
    expect(moduleFromPath('/daily-care/foo')).toBe('daily-care')
  })

  it('gates learning observations to staff', () => {
    expect(canDo('parent', 'learning.observe')).toBe(false)
    expect(canDo('teacher', 'learning.observe')).toBe(true)
  })
})
