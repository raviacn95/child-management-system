import { describe, expect, it } from 'vitest'
import { canDo, canSee, moduleFromPath } from '../lib/rbac'

describe('RBAC', () => {
  it('lets directors see every module', () => {
    expect(canSee('director', 'settings')).toBe(true)
    expect(canSee('teacher', 'settings')).toBe(false)
    expect(canSee('parent', 'attendance')).toBe(false)
  })

  it('maps paths to modules', () => {
    expect(moduleFromPath('/')).toBe('dashboard')
    expect(moduleFromPath('/learning')).toBe('learning')
    expect(moduleFromPath('/daily-care/foo')).toBe('daily-care')
  })

  it('gates learning observations to staff', () => {
    expect(canDo('parent', 'learning.observe')).toBe(false)
    expect(canDo('teacher', 'learning.observe')).toBe(true)
  })
})
