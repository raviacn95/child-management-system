import { describe, expect, it } from 'vitest'
import { deepLinkFor, deviceFor, intentUri, opensAppByLink, titleLink, watchIdsSchema } from './deepLink'

const FIRE_TV_UA = 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633; wv) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'
const ANDROID_TV_UA = 'Mozilla/5.0 (Linux; Android 11; Realme Smart TV Build/RTV; wv) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'

const GTI = 'amzn1.dv.gti.1744bdf3-351d-4617-a849-43bc7f9e8f41'
const NETFLIX_SEARCH = 'https://www.netflix.com/search?q=Minnal%20Murali%202021%20Malayalam'

describe('deviceFor', () => {
  it('tells Fire TV, Android TV, phones and desktop apart', () => {
    expect(deviceFor({ tv: true, ua: FIRE_TV_UA })).toBe('firetv')
    expect(deviceFor({ tv: true, ua: ANDROID_TV_UA })).toBe('androidtv')
    expect(deviceFor({ tv: false, ua: PHONE_UA })).toBe('phone')
    expect(deviceFor({ tv: false, ua: DESKTOP_UA })).toBe('web')
    expect(deviceFor({ tv: true, ua: DESKTOP_UA })).toBe('web')
  })
})

describe('titleLink', () => {
  it('builds official Netflix title links, with source=30 only for the TV app', () => {
    expect(titleLink('netflix', { netflix: '81497215' }, 'web')).toEqual({
      app: 'https://www.netflix.com/title/81497215',
      web: 'https://www.netflix.com/title/81497215',
      extras: {},
    })
    expect(titleLink('netflix', { netflix: '81497215' }, 'firetv')?.extras).toEqual({ source: '30' })
    expect(titleLink('netflix', { netflix: '81497215' }, 'androidtv')?.extras).toEqual({ source: '30' })
    expect(titleLink('netflix', { netflix: '81497215' }, 'phone')?.extras).toEqual({})
  })

  it('uses the Prime Video share link for apps and the detail page on the web', () => {
    expect(titleLink('prime', { prime: GTI })).toEqual({
      app: `https://app.primevideo.com/detail?gti=${GTI}`,
      web: `https://www.primevideo.com/detail/${GTI}`,
      extras: {},
    })
  })

  it('builds JioHotstar, Apple TV and SonyLIV pages', () => {
    expect(titleLink('hotstar', { hotstar: '1271320425' })?.web).toBe('https://www.hotstar.com/in/1271320425')
    expect(titleLink('appletv', { appletv: 'movie/umc.cmc.6q5hghncsr2uqdm6qpt6vbnps' })?.web).toBe(
      'https://tv.apple.com/movie/umc.cmc.6q5hghncsr2uqdm6qpt6vbnps',
    )
    expect(titleLink('sonyliv', { sonyliv: '1700000292' })?.web).toBe('https://www.sonyliv.com/shows/1700000292')
  })

  it('returns null without an ID, for another platform, or for a malformed ID', () => {
    expect(titleLink('netflix', undefined)).toBeNull()
    expect(titleLink('netflix', { prime: GTI })).toBeNull()
    expect(titleLink('youtube', { netflix: '81497215' })).toBeNull()
    expect(titleLink('netflix', { netflix: '8149/../x' })).toBeNull()
    expect(titleLink('toString', { netflix: '81497215' })).toBeNull()
  })
})

describe('watchIdsSchema', () => {
  it('keeps valid IDs and drops anything else', () => {
    expect(
      watchIdsSchema.parse({ netflix: '81497215', prime: 'B01MSPI8JN', hotstar: 1271320425, evil: 'javascript:1' }),
    ).toEqual({ netflix: '81497215' })
    expect(watchIdsSchema.parse('nope')).toEqual({})
  })
})

describe('deepLinkFor', () => {
  it('orders title link, search, app launch, then the official title page when an ID is known', () => {
    const plan = deepLinkFor(
      'netflix',
      { ids: { netflix: '81497215' }, searchUrl: NETFLIX_SEARCH, pkg: 'com.netflix.ninja' },
      'firetv',
    )
    expect(plan.opens).toBe('title')
    expect(plan.steps).toEqual([
      { kind: 'title', href: 'https://www.netflix.com/title/81497215' },
      { kind: 'search', href: NETFLIX_SEARCH },
      { kind: 'app', pkg: 'com.netflix.ninja' },
      { kind: 'web', href: 'https://www.netflix.com/title/81497215' },
    ])
    expect(plan.extras).toEqual({ source: '30' })
  })

  it('falls back to search without an ID: search results in browsers, the app itself on TV', () => {
    const tv = deepLinkFor('netflix', { searchUrl: NETFLIX_SEARCH, pkg: 'com.netflix.ninja' }, 'androidtv')
    expect(tv.opens).toBe('app')
    expect(tv.web).toBe(NETFLIX_SEARCH)
    expect(tv.steps.map((step) => step.kind)).toEqual(['search', 'app', 'web'])
    expect(deepLinkFor('netflix', { searchUrl: NETFLIX_SEARCH }, 'web').opens).toBe('search')
    expect(deepLinkFor('netflix', { searchUrl: NETFLIX_SEARCH }, 'phone').opens).toBe('search')
  })

  it('ignores a non-https search URL', () => {
    const plan = deepLinkFor('netflix', { searchUrl: 'javascript:alert(1)' }, 'web')
    expect(plan.web).toBe('')
    expect(plan.steps).toEqual([])
  })
})

describe('intentUri', () => {
  it('targets the app package with the title URI, an encoded https fallback and the TV extra', () => {
    const plan = deepLinkFor(
      'netflix',
      { ids: { netflix: '81497215' }, searchUrl: NETFLIX_SEARCH, pkg: 'com.netflix.ninja' },
      'firetv',
    )
    expect(intentUri(plan)).toBe(
      `intent://www.netflix.com/title/81497215#Intent;scheme=https;package=com.netflix.ninja;S.browser_fallback_url=${encodeURIComponent('https://www.netflix.com/title/81497215')};S.source=30;end`,
    )
  })

  it('keeps the encoded search query when no ID is known', () => {
    const href = intentUri(deepLinkFor('netflix', { searchUrl: NETFLIX_SEARCH, pkg: 'com.netflix.ninja' }, 'firetv'))
    expect(href).toBe(
      `intent://www.netflix.com/search?q=Minnal%20Murali%202021%20Malayalam#Intent;scheme=https;package=com.netflix.ninja;S.browser_fallback_url=${encodeURIComponent(NETFLIX_SEARCH)};end`,
    )
  })

  it('hands Prime the share link and keeps the web detail page as fallback', () => {
    const href = intentUri(
      deepLinkFor('prime', { ids: { prime: GTI }, searchUrl: 'https://www.primevideo.com/search?phrase=x', pkg: 'com.amazon.amazonvideo.livingroom' }, 'androidtv'),
    )
    expect(href).toContain(`intent://app.primevideo.com/detail?gti=${GTI}#Intent;`)
    expect(href).toContain('package=com.amazon.amazonvideo.livingroom')
    expect(href).toContain(`S.browser_fallback_url=${encodeURIComponent(`https://www.primevideo.com/detail/${GTI}`)}`)
  })

  it('returns null without a package', () => {
    expect(intentUri(deepLinkFor('netflix', { ids: { netflix: '81497215' }, searchUrl: NETFLIX_SEARCH }, 'web'))).toBeNull()
  })

  it('carries no child or household data, only the title ID or the movie search', () => {
    const href = intentUri(
      deepLinkFor('netflix', { ids: { netflix: '81497215' }, searchUrl: NETFLIX_SEARCH, pkg: 'com.netflix.ninja' }, 'firetv'),
    )
    expect(href).not.toMatch(/PIN|allerg|childId|household|token/i)
  })
})

describe('opensAppByLink', () => {
  it('accepts only official Netflix title links', () => {
    expect(opensAppByLink('https://www.netflix.com/title/81497215')).toBe(true)
    expect(opensAppByLink('https://netflix.com/title/81497215')).toBe(true)
    expect(opensAppByLink('https://www.netflix.com/search?q=x')).toBe(false)
    expect(opensAppByLink('https://evil.com/netflix.com/title/81497215')).toBe(false)
    expect(opensAppByLink('http://www.netflix.com/title/81497215')).toBe(false)
  })
})
