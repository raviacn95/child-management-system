import { describe, expect, it, beforeEach } from 'vitest'
import {
  beginAway,
  callbackHref,
  clearAway,
  consumeToken,
  currentAway,
  hasPii,
  issueReturnToken,
  parseReturnLink,
  peekToken,
  rememberScreen,
} from './returnSession'

describe('return tokens', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('issues a short-lived opaque token with no child data', () => {
    const record = issueReturnToken({ screen: '/movies', label: 'Prime Video', title: 'Drishyam' })
    expect(record.token).toHaveLength(32)
    expect(record.expiresAt).toBeGreaterThan(Date.now())
    expect(hasPii(record)).toBe(false)
    expect(peekToken(record.token)?.screen).toBe('/movies')
    expect(consumeToken(record.token)?.label).toBe('Prime Video')
    expect(peekToken(record.token)).toBeNull()
  })

  it('rejects expired tokens and never stores child identifiers', () => {
    const record = issueReturnToken({ screen: '/hub', label: 'YouTube Kids', title: 'Learning pack' })
    record.expiresAt = Date.now() - 1
    sessionStorage.setItem('willow-return-v1', JSON.stringify([record]))
    expect(peekToken(record.token)).toBeNull()
    expect(consumeToken(record.token)).toBeNull()
    expect(JSON.stringify(record)).not.toMatch(/childId|PIN|@|allerg/i)
  })

  it('parses Willow callback links and restores the last screen', () => {
    rememberScreen('/learning?band=5-8')
    const record = issueReturnToken({ screen: '/learning?band=5-8', label: 'YouTube Kids', title: 'Learning pack' })
    expect(parseReturnLink(callbackHref(record.token))).toBe(record.token)
    expect(parseReturnLink(`willow://callback?token=${record.token}`)).toBe(record.token)
    beginAway(record, 'https://www.youtube.com/watch?v=demo')
    expect(currentAway()?.label).toBe('YouTube Kids')
    clearAway()
    expect(currentAway()).toBeNull()
  })
})
