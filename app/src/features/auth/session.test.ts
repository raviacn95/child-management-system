import { describe, expect, it, beforeEach } from 'vitest'
import { clearSession, issueSession, readLastEmail, readSession } from './session'

const user = { id: 'u-1', role: 'parent' as const, email: 'parent@willow.care' }

describe('willow session', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('persists login across reloads for future TV / Fire Stick use', () => {
    issueSession(user, { persist: true })
    sessionStorage.removeItem('willow-session')
    const again = readSession()
    expect(again?.sub).toBe('u-1')
    expect(again?.email).toBeUndefined()
    expect(readLastEmail()).toBe('parent@willow.care')
    expect(localStorage.getItem('willow-session') ?? '').not.toContain('parent@willow.care')
    expect((again?.exp ?? 0) - Date.now()).toBeGreaterThan(80 * 24 * 60 * 60 * 1000)
  })

  it('clears both storages on logout', () => {
    issueSession(user, { persist: true })
    clearSession()
    expect(readSession()).toBeNull()
    expect(readLastEmail()).toBe('')
  })

  it('keeps a tab-only session out of localStorage', () => {
    issueSession(user, { persist: false })
    expect(localStorage.getItem('willow-session')).toBeNull()
    expect(readSession()?.sub).toBe('u-1')
  })
})
