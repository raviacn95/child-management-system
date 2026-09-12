import { describe, expect, it } from 'vitest'
import { TV_NAV, tvNavAfter } from './tvNav'

describe('TV living-room nav', () => {
  it('steers Home to Movies, then TV tonight', () => {
    expect(TV_NAV.map((item) => item.to)).toEqual([
      '/hub',
      '/movies',
      '/tv',
      '/ott',
      '/learning',
      '/parent-feed',
      '/shop',
      '/settings',
    ])
    expect(tvNavAfter('/hub')?.to).toBe('/movies')
    expect(tvNavAfter('/movies')?.to).toBe('/tv')
    expect(tvNavAfter('/tv')?.to).toBe('/ott')
  })
})
