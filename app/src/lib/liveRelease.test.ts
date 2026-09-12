import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextLiveHref, parseRelease, shouldApplyRemote, syncLiveRelease } from './liveRelease'

describe('live release pipeline', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('parses a Pages stamp and reloads only when the id changed', () => {
    const remote = parseRelease({ id: 'abc123def456', run: 88, channel: 'live' })
    expect(remote?.id).toBe('abc123def456')
    expect(shouldApplyRemote(null, remote!)).toBe(true)
    expect(shouldApplyRemote('abc123def456', remote!)).toBe(false)
    expect(shouldApplyRemote('old', parseRelease({ id: 'dev', channel: 'local' })!)).toBe(false)
  })

  it('keeps the hash route when swapping the willow cache token', () => {
    expect(nextLiveHref('https://raviacn95.github.io/child-management-system/?v=looks1#/tv', 'deadbeefcafebabe')).toBe(
      'https://raviacn95.github.io/child-management-system/?v=looks1&willow=deadbeefcafe#/tv',
    )
  })

  it('reloads once when the phone still has an older release id', async () => {
    const replace = vi.fn()
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: '111aaa222bbb', channel: 'live' }),
    })) as unknown as typeof fetch
    const result = await syncLiveRelease({
      skipDev: false,
      applied: 'stale',
      href: 'https://raviacn95.github.io/child-management-system/#/movies',
      location: { href: 'https://raviacn95.github.io/child-management-system/#/movies', replace },
      fetchImpl,
    })
    expect(result.status).toBe('reloading')
    expect(replace).toHaveBeenCalledTimes(1)
    expect(String(replace.mock.calls[0][0])).toContain('willow=111aaa222bbb')
    expect(String(replace.mock.calls[0][0])).toContain('#/movies')
  })
})
