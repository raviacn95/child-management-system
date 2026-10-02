import { watchUrl } from '../movies/catalog'
import type { MovieLang } from '../movies/schema'
import { deepLinkFor, deviceFor, intentUri, OPENS_LABEL, titleLink, type DeepLinkPlan, type WatchIds } from './deepLink'
import { openOfficialApp } from './watchDesk'
import { watchIdsFor } from './watchIds'

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

const currentUa = () => (typeof navigator !== 'undefined' ? navigator.userAgent : '')

export function tvPackageFor(platformId: string, ua = currentUa()) {
  const map = FIRE_TV_UA.test(ua) ? FIRE_TV_PACKAGES : ANDROID_TV_PACKAGES
  return Object.prototype.hasOwnProperty.call(map, platformId) ? map[platformId] : undefined
}

/** Official page for a movie: its title page when Wikidata knows the platform's ID, else the storefront search. */
export function officialWatchUrl(platformId: string, movieTitle: string, year?: number, originalLang?: MovieLang, ids = watchIdsFor(movieTitle, year)) {
  return titleLink(platformId, ids)?.web ?? watchUrl(platformId, movieTitle, year, originalLang)
}

export function tvDeepLink(
  platformId: string,
  movieTitle?: string,
  year?: number,
  originalLang?: MovieLang,
  ids: WatchIds | undefined = watchIdsFor(movieTitle, year),
  ua = currentUa(),
): DeepLinkPlan {
  const searchUrl = watchUrl(platformId, movieTitle || platformId, year, originalLang)
  return deepLinkFor(platformId, { ids, searchUrl, pkg: tvPackageFor(platformId, ua) }, deviceFor({ tv: true, ua }))
}

export function fireTvIntent(platformId: string, movieTitle?: string, year?: number, originalLang?: MovieLang, ids?: WatchIds) {
  const plan = tvDeepLink(platformId, movieTitle, year, originalLang, ids ?? watchIdsFor(movieTitle, year))
  try {
    return intentUri(plan) ?? plan.web
  } catch {
    return plan.web
  }
}

/** Short TV hint under a Watch button: whether the click lands on the movie, a search, or just the app. */
export function tvOpensLabel(platformId: string, movieTitle: string, year?: number, ids?: WatchIds) {
  return OPENS_LABEL[tvDeepLink(platformId, movieTitle, year, undefined, ids ?? watchIdsFor(movieTitle, year)).opens]
}

export function openStorefront(platformId: string, movieTitle?: string, tv = false) {
  const href = tv ? fireTvIntent(platformId, movieTitle) : watchUrl(platformId, movieTitle || platformId)
  openOfficialApp(href)
}
