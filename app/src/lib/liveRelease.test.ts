import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkLiveUpdate,
  hasStaleShellQuery,
  nextLiveHref,
  parseRelease,
  shouldApplyRemote,
  sourceStatusCopy,
  syncLiveRelease,
  updateLiveWillow,
} from './liveRelease'

const OFFICIAL_RELEASE = 'https://raviacn95.github.io/child-management-system/release.json'

function jsonRes(body: unknown, url = OFFICIAL_RELEASE) {
  const text = JSON.stringify(body)
  return {
    ok: true,
    url,
    headers: { get: (name: string) => (name === 'content-type' ? 'application/json' : null) },
    text: async (): Promise<string> => text,
    json: async () => body,
  }
}

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

  it('rejects a stamp that is not a safe official payload', () => {
    expect(parseRelease({ id: '<script>alert(1)</script>', channel: 'live' })).toBeNull()
    expect(parseRelease({ id: 'abc123def456', channel: 'evil' })).toBeNull()
    expect(parseRelease({ id: 'abc123def456', channel: 'live', integrity: 'md5:abc' })).toBeNull()
    expect(parseRelease({ id: 'javascript:void(0)', channel: 'live' })).toBeNull()
  })

  it('keeps the hash route and drops a stale APK cache token', () => {
    expect(hasStaleShellQuery('https://raviacn95.github.io/child-management-system/?v=looks1#/tv')).toBe(true)
    expect(nextLiveHref('https://raviacn95.github.io/child-management-system/?v=looks1#/tv', 'deadbeefcafebabe')).toBe(
      'https://raviacn95.github.io/child-management-system/?willow=deadbeefcafe#/tv',
    )
  })

  it('never applies an update onto a foreign host', () => {
    expect(nextLiveHref('https://evil.example/#/movies', 'abc123def456')).toBe(
      'https://raviacn95.github.io/child-management-system/?willow=abc123def456#/movies',
    )
  })

  it('says current when the official source matches this app', async () => {
    const fetchImpl = vi.fn(async () => jsonRes({ id: 'abc123def456', channel: 'live' })) as unknown as typeof fetch
    const result = await checkLiveUpdate({
      skipDev: false,
      applied: 'abc123def456',
      href: 'https://raviacn95.github.io/child-management-system/#/settings',
      fetchImpl,
    })
    expect(result.status).toBe('current')
  })

  it('does not reload when Update finds the official source already applied', async () => {
    const replace = vi.fn()
    const fetchImpl = vi.fn(async () => jsonRes({ id: 'abc123def456', channel: 'live' })) as unknown as typeof fetch
    const result = await updateLiveWillow({
      skipDev: false,
      applied: 'abc123def456',
      href: 'https://raviacn95.github.io/child-management-system/#/settings',
      location: { href: 'https://raviacn95.github.io/child-management-system/#/settings', replace },
      fetchImpl,
    })
    expect(result.status).toBe('current')
    expect(replace).not.toHaveBeenCalled()
    expect(sourceStatusCopy(result)).toMatch(/matches the official Willow source/i)
  })

  it('blocks a release that redirected off the official host', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonRes({ id: 'abc123def456', channel: 'live' }, 'https://evil.example/release.json'),
    ) as unknown as typeof fetch
    const result = await checkLiveUpdate({
      skipDev: false,
      applied: 'old',
      href: 'https://raviacn95.github.io/child-management-system/#/',
      fetchImpl,
    })
    expect(result.status).toBe('blocked')
    if (result.status === 'blocked') expect(result.reason).toBe('origin')
  })

  it('blocks a stamp whose page hash does not match the official index', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const href = String(input)
      if (href.includes('release.json')) {
        return jsonRes({
          id: 'abc123def456',
          channel: 'live',
          integrity: `sha256:${'ab'.repeat(32)}`,
        })
      }
      return {
        ok: true,
        url: 'https://raviacn95.github.io/child-management-system/',
        headers: { get: (name: string) => (name === 'content-type' ? 'text/html' : null) },
        text: async (): Promise<string> => '<html>tampered</html>',
      }
    }) as unknown as typeof fetch
    const result = await checkLiveUpdate({
      skipDev: false,
      applied: 'old',
      href: 'https://raviacn95.github.io/child-management-system/#/',
      fetchImpl,
    })
    expect(result.status).toBe('blocked')
    if (result.status === 'blocked') expect(result.reason).toBe('integrity')
  })

  it('reloads a stale APK query even when the applied id already matches', async () => {
    const replace = vi.fn()
    const fetchImpl = vi.fn(async () => jsonRes({ id: 'abc123def456', channel: 'live' })) as unknown as typeof fetch
    const href = 'https://raviacn95.github.io/child-management-system/?v=moviesum3#/movies'
    const result = await syncLiveRelease({
      skipDev: false,
      applied: 'abc123def456',
      href,
      location: { href, replace },
      fetchImpl,
    })
    expect(result.status).toBe('reloading')
    expect(String(replace.mock.calls[0][0])).not.toContain('v=moviesum3')
    expect(String(replace.mock.calls[0][0])).toContain('#/movies')
  })

  it('reloads once when the phone still has an older release id', async () => {
    const replace = vi.fn()
    const fetchImpl = vi.fn(async () => jsonRes({ id: '111aaa222bbb', channel: 'live' })) as unknown as typeof fetch
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
    expect(String(replace.mock.calls[0][0])).toContain('raviacn95.github.io')
  })
})
