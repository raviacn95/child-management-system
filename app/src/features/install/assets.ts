/** Live site the Fire Stick APK WebView and Windows app load. */
export const LIVE_SITE = 'https://raviacn95.github.io/child-management-system/'
export const LIVE_APP_URL = `${LIVE_SITE}?v=toppicks1`

export const APK_FILE = 'downloads/willow.apk'
export const APK_FILENAME = 'willow.apk'
export const APK_RELEASE_URL =
  'https://github.com/raviacn95/child-management-system/releases/latest/download/willow.apk'
export const APK_TV_FILENAME = 'willow-movies.apk'
export const APK_TV_RELEASE_URL =
  'https://github.com/raviacn95/child-management-system/releases/latest/download/willow-movies.apk'

export function pageRoot(href: string) {
  const u = new URL(href.split('#')[0])
  let path = u.pathname
  if (path.endsWith('index.html')) path = path.slice(0, -'index.html'.length)
  if (!path.endsWith('/')) path += '/'
  u.pathname = path
  u.hash = ''
  u.search = ''
  return u
}

export function siteAssetUrl(relativePath: string, fromHref?: string) {
  const href = fromHref ?? (typeof window !== 'undefined' ? window.location.href : LIVE_SITE)
  const root = pageRoot(href)
  return new URL(relativePath.replace(/^\//, ''), root).href
}

export function apkDownloadUrl() {
  return `${LIVE_SITE}${APK_FILE}`
}

export function apkTvDownloadUrl() {
  return `${LIVE_SITE}downloads/${APK_TV_FILENAME}`
}
