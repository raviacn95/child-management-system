import { afterEach, describe, expect, it, vi } from 'vitest'
import { ANDROID_TV_PACKAGES, fireTvIntent, FIRE_TV_PACKAGES, officialWatchUrl, tvOpensLabel, tvPackageFor } from './fireTv'

const FIRE_TV_UA = 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120 Safari/537.36'
const ANDROID_TV_UA = 'Mozilla/5.0 (Linux; Android 11; Realme Smart TV Build/RTV) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Fire TV intents', () => {
  it('opens Prime in the official Fire TV package, not Google Movies', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(FIRE_TV_UA)
    expect(FIRE_TV_PACKAGES.prime).toBe('com.amazon.avod.thirdpartyclient')
    const href = fireTvIntent('prime', 'Drishyam', 2013)
    expect(href).toContain('package=com.amazon.avod.thirdpartyclient')
    expect(href).toContain('Drishyam')
    expect(href).toContain('phrase=')
  })

  it('targets the Android TV app on a Realme / Google TV and keeps the browser fallback', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID_TV_UA)
    const href = fireTvIntent('youtube', 'Drishyam trailer')
    expect(href).toContain('package=com.google.android.youtube.tv')
    expect(href).toContain('S.browser_fallback_url=https%3A%2F%2Fwww.youtube.com')
  })
})

describe('title deep links on TV', () => {
  it('opens the Netflix title in the Fire TV app with source=30 and the title page as fallback', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(FIRE_TV_UA)
    const href = fireTvIntent('netflix', 'Some Movie', 2021, 'ml', { netflix: '81497215' })
    expect(href).toBe(
      `intent://www.netflix.com/title/81497215#Intent;scheme=https;package=com.netflix.ninja;S.browser_fallback_url=${encodeURIComponent('https://www.netflix.com/title/81497215')};S.source=30;end`,
    )
  })

  it('looks the ID up from the committed catalog file by title and year', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID_TV_UA)
    expect(fireTvIntent('netflix', 'Minnal Murali', 2021, 'ml')).toMatch(
      /^intent:\/\/www\.netflix\.com\/title\/\d{6,9}#Intent;scheme=https;package=com\.netflix\.ninja;/,
    )
    expect(tvOpensLabel('netflix', 'Minnal Murali', 2021)).toBe('Opens the movie')
  })

  it('keeps the search intent and says the app opens when no ID is known', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(FIRE_TV_UA)
    expect(fireTvIntent('netflix', 'Unknown Film', 2019)).toContain('intent://www.netflix.com/search?q=Unknown%20Film')
    expect(tvOpensLabel('netflix', 'Unknown Film', 2019)).toBe('Opens the app')
  })

  it('says search in a desktop browser in TV mode, where the storefront search page opens', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0')
    expect(tvOpensLabel('netflix', 'Unknown Film', 2019)).toBe('Opens search')
  })
})

describe('officialWatchUrl', () => {
  it('prefers the official title page and falls back to the storefront search', () => {
    expect(officialWatchUrl('netflix', 'Some Movie', 2021, 'ml', { netflix: '81497215' })).toBe(
      'https://www.netflix.com/title/81497215',
    )
    expect(officialWatchUrl('netflix', 'Unknown Film', 2019)).toBe('https://www.netflix.com/search?q=Unknown%20Film%202019')
    expect(officialWatchUrl('youtube', 'Some Movie', 2021, undefined, { netflix: '81497215' })).toContain('youtube.com/results')
  })
})

describe('tvPackageFor', () => {
  it('uses Fire TV packages when the user agent is an Amazon AFT device', () => {
    expect(tvPackageFor('youtube', FIRE_TV_UA)).toBe('com.amazon.firetv.youtube')
    expect(tvPackageFor('prime', FIRE_TV_UA)).toBe('com.amazon.avod.thirdpartyclient')
  })

  it('uses Android TV / Google TV packages everywhere else', () => {
    expect(tvPackageFor('youtube', ANDROID_TV_UA)).toBe('com.google.android.youtube.tv')
    expect(tvPackageFor('prime', ANDROID_TV_UA)).toBe('com.amazon.amazonvideo.livingroom')
    expect(tvPackageFor('netflix', ANDROID_TV_UA)).toBe('com.netflix.ninja')
    expect(tvPackageFor('hotstar', ANDROID_TV_UA)).toBe('in.startv.hotstar')
    expect(tvPackageFor('manoramamax', ANDROID_TV_UA)).toBe('com.mmtv.manoramamax.android')
  })

  it('falls back to the shared package when Android TV has no override', () => {
    expect(tvPackageFor('mubi', ANDROID_TV_UA)).toBe(FIRE_TV_PACKAGES.mubi)
    expect(ANDROID_TV_PACKAGES.mubi).toBe(FIRE_TV_PACKAGES.mubi)
  })

  it('returns undefined for platforms without a native TV app', () => {
    expect(tvPackageFor('justwatch', ANDROID_TV_UA)).toBeUndefined()
    expect(tvPackageFor('justwatch', FIRE_TV_UA)).toBeUndefined()
  })
})
