import { afterEach, describe, expect, it, vi } from 'vitest'
import { ANDROID_TV_PACKAGES, fireTvIntent, FIRE_TV_PACKAGES, tvPackageFor } from './fireTv'

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
