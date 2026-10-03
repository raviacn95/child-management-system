import { z } from 'zod'

/** Official per-title IDs from Wikidata (see scripts/fetch-watch-ids.mjs). Each shape is the platform's own ID format. */
export const WATCH_ID_SHAPES = {
  netflix: /^\d{6,9}$/,
  prime: /^amzn1\.dv\.gti\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  hotstar: /^\d{6,12}$/,
  appletv: /^(movie|show)\/umc\.cmc\.[a-z0-9]{22,25}$/,
  sonyliv: /^1\d{9}$/,
} as const

export type WatchIdPlatform = keyof typeof WATCH_ID_SHAPES
export type WatchIds = Partial<Record<WatchIdPlatform, string>>

/** Drops any ID that does not match its platform's shape instead of rejecting the whole record. */
export const watchIdsSchema = z
  .record(z.string(), z.unknown())
  .catch({})
  .transform((raw) => {
    const ids: WatchIds = {}
    for (const [platform, shape] of Object.entries(WATCH_ID_SHAPES) as [WatchIdPlatform, RegExp][]) {
      const value = raw[platform]
      if (typeof value === 'string' && shape.test(value)) ids[platform] = value
    }
    return ids
  })

export type DeepLinkDevice = 'firetv' | 'androidtv' | 'phone' | 'web'

const FIRE_TV_UA = /\bAFT[A-Z0-9]/
const ANDROID_UA = /Android/i

export function deviceFor({ tv, ua }: { tv: boolean; ua: string }): DeepLinkDevice {
  if (tv && FIRE_TV_UA.test(ua)) return 'firetv'
  if (tv && ANDROID_UA.test(ua)) return 'androidtv'
  if (ANDROID_UA.test(ua)) return 'phone'
  return 'web'
}

export type TitleLink = {
  /** Data URI handed to the official app. */
  app: string
  /** Official web page for the same title (browsers, desktop, fallback). */
  web: string
  extras: Record<string, string>
}

const TV_DEVICES: ReadonlySet<DeepLinkDevice> = new Set(['firetv', 'androidtv'])

/** Phone builds. TV shells keep their own packages and must not use these. */
const PHONE_PACKAGES: Record<string, string> = {
  'netflix.com': 'com.netflix.mediaclient',
  'primevideo.com': 'com.amazon.avod.thirdpartyclient',
  'app.primevideo.com': 'com.amazon.avod.thirdpartyclient',
  'hotstar.com': 'in.startv.hotstar',
  'jiohotstar.com': 'in.startv.hotstar',
  'sonyliv.com': 'com.sonyliv',
  'zee5.com': 'com.graymatrix.did',
  'youtube.com': 'com.google.android.youtube',
  'sunnxt.com': 'com.suntv.sunnxt',
}

export function phonePackageFor(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    return PHONE_PACKAGES[host]
  } catch {
    return undefined
  }
}

function idFor(platformId: string, ids: WatchIds | undefined) {
  if (!ids || !Object.prototype.hasOwnProperty.call(WATCH_ID_SHAPES, platformId)) return undefined
  const key = platformId as WatchIdPlatform
  const value = ids[key]
  return value && WATCH_ID_SHAPES[key].test(value) ? value : undefined
}

/**
 * Netflix TV (com.netflix.ninja) only opens the title page when the string extra `source=30` comes with the link,
 * otherwise it stays on its home screen. Prime Video apps open `app.primevideo.com/detail?gti=` share links.
 */
export function titleLink(platformId: string, ids: WatchIds | undefined, device: DeepLinkDevice = 'web'): TitleLink | null {
  const id = idFor(platformId, ids)
  if (!id) return null
  switch (platformId) {
    case 'netflix': {
      const url = `https://www.netflix.com/title/${id}`
      return { app: url, web: url, extras: TV_DEVICES.has(device) ? { source: '30' } : {} }
    }
    case 'prime':
      return {
        app: `https://app.primevideo.com/detail?gti=${id}`,
        web: `https://www.primevideo.com/detail/${id}`,
        extras: {},
      }
    case 'hotstar': {
      const url = `https://www.hotstar.com/in/${id}`
      return { app: url, web: url, extras: {} }
    }
    case 'appletv': {
      const url = `https://tv.apple.com/${id}`
      return { app: url, web: url, extras: {} }
    }
    case 'sonyliv': {
      const url = `https://www.sonyliv.com/shows/${id}`
      return { app: url, web: url, extras: {} }
    }
    default:
      return null
  }
}

export type DeepLinkStep =
  | { kind: 'title'; href: string }
  | { kind: 'search'; href: string }
  | { kind: 'app'; pkg: string }
  | { kind: 'web'; href: string }

export type DeepLinkOpens = 'title' | 'search' | 'app'

export type DeepLinkPlan = {
  opens: DeepLinkOpens
  pkg?: string
  extras: Record<string, string>
  /** Official web page: the title page when an ID is known, else the storefront search. */
  web: string
  steps: DeepLinkStep[]
}

export type DeepLinkInput = {
  ids?: WatchIds
  /** Official storefront search URL for the title (already filled in). */
  searchUrl: string
  /** Native app package on this device, if any. */
  pkg?: string
}

function httpsUrl(href: string) {
  try {
    return new URL(href).protocol === 'https:' ? href : ''
  } catch {
    return ''
  }
}

/**
 * Ordered ways to open a movie: title deep link, storefront search, the app itself, then the official web page.
 * Browsers show search results; TV apps (Netflix included) ignore search links and open on their home screen.
 */
export function deepLinkFor(platformId: string, { ids, searchUrl, pkg }: DeepLinkInput, device: DeepLinkDevice): DeepLinkPlan {
  const title = titleLink(platformId, ids, device)
  const search = httpsUrl(searchUrl)
  const web = title?.web ?? search
  const steps: DeepLinkStep[] = [
    ...(title ? [{ kind: 'title' as const, href: title.app }] : []),
    ...(search ? [{ kind: 'search' as const, href: search }] : []),
    ...(pkg ? [{ kind: 'app' as const, pkg }] : []),
    ...(web ? [{ kind: 'web' as const, href: web }] : []),
  ]
  const nativeTv = TV_DEVICES.has(device) && Boolean(pkg)
  const opens: DeepLinkOpens = title ? 'title' : nativeTv ? 'app' : 'search'
  return { opens, pkg, extras: title?.extras ?? {}, web, steps }
}

/** `intent://` for Android with the app package, title (or search) URI, extras and an https browser fallback. */
export function intentUri(plan: DeepLinkPlan) {
  const target = plan.steps.find((step) => step.kind === 'title' || step.kind === 'search')
  if (!plan.pkg || !target || !('href' in target) || !plan.web) return null
  const u = new URL(target.href)
  const extras = Object.entries(plan.extras).map(([key, value]) => `;S.${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=${plan.pkg};S.browser_fallback_url=${encodeURIComponent(plan.web)}${extras.join('')};end`
}

/** Title links an older app shell may hand straight to Android: the app's own App Links cover the bare domain too. */
export function opensAppByLink(url: string) {
  return /^https:\/\/(www\.)?netflix\.com\/title\/\d{6,9}$/.test(url)
}

export const OPENS_LABEL: Record<DeepLinkOpens, string> = {
  title: 'Opens the movie',
  search: 'Opens search',
  app: 'Opens the app',
}
