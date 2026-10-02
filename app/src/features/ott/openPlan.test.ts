import { describe, expect, it } from 'vitest'
import { canEmbed, NATIVE_INTENT_MARKER, openPlan, parseIntent } from './openPlan'

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0'
const FIRE_TV_UA = 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633; wv) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'
const ANDROID_TV_UA = 'Mozilla/5.0 (Linux; Android 11; Realme Smart TV Build/RTV; wv) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'
const ORIGIN = 'https://raviacn95.github.io'

const NETFLIX = 'https://www.netflix.com/search?q=Mardaani%203%202026%20Hindi'
const NETFLIX_INTENT = `intent://www.netflix.com/search?q=Mardaani%203%202026%20Hindi#Intent;scheme=https;package=com.netflix.ninja;S.browser_fallback_url=${encodeURIComponent(NETFLIX)};end`
const TRAILER = 'https://www.youtube.com/embed?listType=search&list=Drishyam%20trailer&autoplay=1&mute=1'

describe('canEmbed', () => {
  it('allows YouTube embed players only', () => {
    expect(canEmbed(TRAILER)).toBe(true)
    expect(canEmbed('https://www.youtube-nocookie.com/embed/abc123')).toBe(true)
    expect(canEmbed('https://www.youtube.com/@Numberblocks?autoplay=0')).toBe(false)
    expect(canEmbed('https://www.youtube.com/embedded-evil')).toBe(false)
  })

  it('refuses storefronts that forbid framing and anything unknown', () => {
    expect(canEmbed(NETFLIX)).toBe(false)
    expect(canEmbed('https://www.primevideo.com/search?phrase=Drishyam')).toBe(false)
    expect(canEmbed('https://www.jiohotstar.com/in/search?q=Drishyam')).toBe(false)
    expect(canEmbed(NETFLIX_INTENT)).toBe(false)
    expect(canEmbed('http://www.youtube.com/embed/abc')).toBe(false)
    expect(canEmbed('javascript:alert(1)')).toBe(false)
    expect(canEmbed('not a url')).toBe(false)
  })

  it('allows Willow pages on the same origin', () => {
    expect(canEmbed(`${ORIGIN}/child-management-system/privacy.html`, ORIGIN)).toBe(true)
    expect(canEmbed(`${ORIGIN}/child-management-system/privacy.html`)).toBe(false)
  })
})

describe('parseIntent', () => {
  it('reads the package, deep link and browser fallback', () => {
    expect(parseIntent(NETFLIX_INTENT)).toEqual({ pkg: 'com.netflix.ninja', target: NETFLIX, fallback: NETFLIX })
  })

  it('ignores plain links and broken intents', () => {
    expect(parseIntent(NETFLIX)).toBeNull()
    expect(parseIntent('intent://www.netflix.com/search')).toBeNull()
    expect(parseIntent('intent:#Intent;action=android.intent.action.VIEW;end')).toBeNull()
  })

  it('reads an intent that only launches an installed app', () => {
    const launch = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.example.films;end'
    expect(parseIntent(launch)).toEqual({ pkg: 'com.example.films', target: '', launch: true })
  })
})

describe('openPlan', () => {
  it('opens OTT storefronts in a new tab on a desktop browser instead of a blocked frame', () => {
    expect(openPlan({ url: NETFLIX, tv: false, native: false, ua: DESKTOP_UA, origin: ORIGIN })).toEqual({
      mode: 'new-tab',
      href: NETFLIX,
    })
  })

  it('turns a TV intent into its official web page when the browser cannot launch apps', () => {
    expect(openPlan({ url: NETFLIX_INTENT, tv: true, native: false, ua: DESKTOP_UA, origin: ORIGIN })).toEqual({
      mode: 'new-tab',
      href: NETFLIX,
    })
    expect(openPlan({ url: NETFLIX_INTENT, tv: false, native: false, ua: DESKTOP_UA })).toEqual({
      mode: 'new-tab',
      href: NETFLIX,
    })
  })

  it('keeps YouTube embeds in the watch desk off TV', () => {
    expect(openPlan({ url: TRAILER, tv: false, native: false, ua: DESKTOP_UA })).toEqual({ mode: 'embed', href: TRAILER })
    expect(openPlan({ url: TRAILER, tv: false, native: true, ua: `${PHONE_UA} ${NATIVE_INTENT_MARKER}` })).toEqual({
      mode: 'embed',
      href: TRAILER,
    })
  })

  it('never frames anything on TV', () => {
    expect(openPlan({ url: TRAILER, tv: true, native: false, ua: DESKTOP_UA })?.mode).toBe('new-tab')
    expect(openPlan({ url: TRAILER, tv: true, native: true, ua: `${FIRE_TV_UA} ${NATIVE_INTENT_MARKER}` })?.mode).toBe(
      'navigate',
    )
  })

  it('launches the official Fire TV app through the intent in an app that handles intents', () => {
    expect(openPlan({ url: NETFLIX_INTENT, tv: true, native: true, ua: `${FIRE_TV_UA} ${NATIVE_INTENT_MARKER}` })).toEqual({
      mode: 'navigate',
      href: NETFLIX_INTENT,
    })
  })

  it('lets a TV browser (Silk / Chrome) hand the intent to Android', () => {
    expect(openPlan({ url: NETFLIX_INTENT, tv: true, native: false, ua: FIRE_TV_UA })).toEqual({
      mode: 'navigate',
      href: NETFLIX_INTENT,
    })
  })

  it('opens an installed app on the phone when there is no website', () => {
    const launch = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.example.films;end'
    expect(openPlan({ url: launch, tv: false, native: false, ua: PHONE_UA })).toEqual({ mode: 'navigate', href: launch })
    expect(openPlan({ url: launch, tv: false, native: true, ua: `${PHONE_UA} ${NATIVE_INTENT_MARKER}` })).toEqual({
      mode: 'navigate',
      href: launch,
    })
    expect(openPlan({ url: launch, tv: true, native: true, ua: `${FIRE_TV_UA} ${NATIVE_INTENT_MARKER}` })).toEqual({
      mode: 'navigate',
      href: launch,
    })
    expect(openPlan({ url: launch, tv: false, native: false, ua: DESKTOP_UA })).toBeNull()
  })

  it('lets a phone browser hand a packaged intent to the installed app', () => {
    expect(openPlan({ url: NETFLIX_INTENT, tv: false, native: false, ua: PHONE_UA })).toEqual({
      mode: 'navigate',
      href: NETFLIX_INTENT,
    })
    expect(openPlan({ url: NETFLIX_INTENT, tv: false, native: true, ua: `${PHONE_UA} ${NATIVE_INTENT_MARKER}` })).toEqual({
      mode: 'navigate',
      href: NETFLIX_INTENT,
    })
  })

  it('wraps a phone link in a package-free intent so Android picks the official app or browser', () => {
    const plan = openPlan({ url: NETFLIX, tv: false, native: true, ua: `${PHONE_UA} ${NATIVE_INTENT_MARKER}` })
    expect(plan?.mode).toBe('navigate')
    expect(plan?.href).toBe(
      `intent://www.netflix.com/search?q=Mardaani%203%202026%20Hindi#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(NETFLIX)};end`,
    )
    expect(plan?.href).not.toContain('package=')
  })

  it('opens the Fire TV Appstore page for the app in older shells that cannot parse intents', () => {
    expect(openPlan({ url: NETFLIX_INTENT, tv: true, native: true, ua: FIRE_TV_UA })).toEqual({
      mode: 'navigate',
      href: 'amzn://apps/android?p=com.netflix.ninja',
    })
    expect(openPlan({ url: NETFLIX_INTENT, tv: true, native: true, ua: ANDROID_TV_UA })).toEqual({
      mode: 'navigate',
      href: 'market://details?id=com.netflix.ninja',
    })
  })

  it('sends older phone shells to the bare official domain so Android opens it outside the WebView', () => {
    expect(openPlan({ url: NETFLIX, tv: false, native: true, ua: PHONE_UA })).toEqual({
      mode: 'navigate',
      href: 'https://netflix.com/search?q=Mardaani%203%202026%20Hindi',
    })
    expect(openPlan({ url: 'https://www.sunnxt.com/search?q=Jailer', tv: false, native: true, ua: PHONE_UA })?.href).toBe(
      'https://sunnxt.com/search?q=Jailer',
    )
    expect(openPlan({ url: 'https://play.google.com/store/search?q=Jailer', tv: false, native: true, ua: PHONE_UA })?.href).toBe(
      'https://play.google.com/store/search?q=Jailer',
    )
  })

  describe('Netflix title links', () => {
    const TITLE = 'https://www.netflix.com/title/81497215'
    const TITLE_INTENT = `intent://www.netflix.com/title/81497215#Intent;scheme=https;package=com.netflix.ninja;S.browser_fallback_url=${encodeURIComponent(TITLE)};S.source=30;end`

    it('reads the title intent with its extra and keeps the title page as fallback', () => {
      expect(parseIntent(TITLE_INTENT)).toEqual({ pkg: 'com.netflix.ninja', target: TITLE, fallback: TITLE })
    })

    it('launches the title intent as-is in the new Fire TV shell', () => {
      expect(openPlan({ url: TITLE_INTENT, tv: true, native: true, ua: `${FIRE_TV_UA} ${NATIVE_INTENT_MARKER}` })).toEqual({
        mode: 'navigate',
        href: TITLE_INTENT,
      })
    })

    it('hands the verified bare-domain title link to Android in older TV shells instead of the Appstore page', () => {
      expect(openPlan({ url: TITLE_INTENT, tv: true, native: true, ua: FIRE_TV_UA })).toEqual({
        mode: 'navigate',
        href: 'https://netflix.com/title/81497215',
      })
      expect(openPlan({ url: TITLE_INTENT, tv: true, native: true, ua: ANDROID_TV_UA })?.href).toBe(
        'https://netflix.com/title/81497215',
      )
    })

    it('opens the title page in a new tab on desktop and through App Links in old phone shells', () => {
      expect(openPlan({ url: TITLE_INTENT, tv: true, native: false, ua: DESKTOP_UA })).toEqual({ mode: 'new-tab', href: TITLE })
      expect(openPlan({ url: TITLE, tv: false, native: false, ua: DESKTOP_UA })).toEqual({ mode: 'new-tab', href: TITLE })
      expect(openPlan({ url: TITLE, tv: false, native: true, ua: PHONE_UA })).toEqual({
        mode: 'navigate',
        href: 'https://netflix.com/title/81497215',
      })
    })

    it('keeps the Appstore page for older TV shells when the link is not a verified title link', () => {
      const prime = `intent://app.primevideo.com/detail?gti=amzn1.dv.gti.1744bdf3-351d-4617-a849-43bc7f9e8f41#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;S.browser_fallback_url=${encodeURIComponent('https://www.primevideo.com/detail/amzn1.dv.gti.1744bdf3-351d-4617-a849-43bc7f9e8f41')};end`
      expect(openPlan({ url: prime, tv: true, native: true, ua: FIRE_TV_UA })?.href).toBe(
        'amzn://apps/android?p=com.amazon.avod.thirdpartyclient',
      )
    })
  })

  it('refuses non-https links and empty input', () => {
    expect(openPlan({ url: '', tv: false, native: false, ua: DESKTOP_UA })).toBeNull()
    expect(openPlan({ url: 'javascript:alert(1)', tv: false, native: false, ua: DESKTOP_UA })).toBeNull()
    expect(openPlan({ url: 'http://www.netflix.com/', tv: false, native: false, ua: DESKTOP_UA })).toBeNull()
    expect(openPlan({ url: 'intent://x#Intent;scheme=javascript;end', tv: true, native: false, ua: DESKTOP_UA })).toBeNull()
  })

  it('never puts extra data into the official link', () => {
    const plan = openPlan({ url: NETFLIX, tv: false, native: false, ua: DESKTOP_UA })
    expect(plan?.href).toBe(NETFLIX)
  })
})
