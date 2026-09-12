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

export function fireTvIntent(platformId: string, movieTitle?: string, year?: number, originalLang?: MovieLang) {
  const pkg = FIRE_TV_PACKAGES[platformId]
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
