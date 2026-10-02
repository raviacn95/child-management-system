import { watchUrl } from '../movies/catalog'
import type { MovieLang } from '../movies/schema'
import { openOfficialApp } from './watchDesk'

/** Native Fire TV / Android TV packages. Playback stays in the official app (already logged in on the Stick). */
export const FIRE_TV_PACKAGES: Record<string, string> = {
  netflix: 'com.netflix.ninja',
  prime: 'com.amazon.avod.thirdpartyclient',
  hotstar: 'in.startv.hotstar',
  sonyliv: 'com.sonyliv',
  zee5: 'com.graymatrix.did',
  youtube: 'com.amazon.firetv.youtube',
  disney: 'com.disney.disneyplus',
  aha: 'ahaflix.tv',
  sunnxt: 'com.suntv.sunnxt',
  manoramamax: 'com.mnrlabs.manoramamax',
  mxplayer: 'com.mxtech.videoplayer.ad',
  jiocinema: 'com.jio.media.ondemand',
  lionsgate: 'com.lionsgateplay.videoapp',
  mubi: 'com.mubi',
  plex: 'com.plexapp.android',
  discoveryplus: 'com.discovery.discoveryplus.mobile',
  appletv: 'com.apple.atve.amazon.appletv',
}

/** Android TV / Google TV builds (Realme, Sony, Chromecast). Platforms not listed reuse the Fire TV package. */
export const ANDROID_TV_PACKAGES: Record<string, string> = {
  ...FIRE_TV_PACKAGES,
  netflix: 'com.netflix.ninja',
  prime: 'com.amazon.amazonvideo.livingroom',
  hotstar: 'in.startv.hotstar',
  sonyliv: 'com.sonyliv',
  zee5: 'com.graymatrix.did',
  youtube: 'com.google.android.youtube.tv',
  sunnxt: 'com.suntv.sunnxt',
  aha: 'ahaflix.tv',
  manoramamax: 'com.mmtv.manoramamax.android',
}

const FIRE_TV_UA = /\bAFT[A-Z0-9]/

export function tvPackageFor(platformId: string, ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  const map = FIRE_TV_UA.test(ua) ? FIRE_TV_PACKAGES : ANDROID_TV_PACKAGES
  return Object.prototype.hasOwnProperty.call(map, platformId) ? map[platformId] : undefined
}

export function fireTvIntent(platformId: string, movieTitle?: string, year?: number, originalLang?: MovieLang) {
  const pkg = tvPackageFor(platformId)
  const web = watchUrl(platformId, movieTitle || platformId, year, originalLang)
  if (!pkg) return web
  const fallback = encodeURIComponent(web)
  try {
    const u = new URL(web)
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};package=${pkg};S.browser_fallback_url=${fallback};end`
  } catch {
    return web
  }
}

export function openStorefront(platformId: string, movieTitle?: string, tv = false) {
  const href = tv ? fireTvIntent(platformId, movieTitle) : watchUrl(platformId, movieTitle || platformId)
  openOfficialApp(href)
}
