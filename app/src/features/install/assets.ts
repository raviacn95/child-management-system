/** Live site the Fire Stick APK WebView loads so the app stays current. */
export const LIVE_SITE = 'https://raviacn95.github.io/child-management-system/'

export const APK_FILE = 'downloads/willow-movies.apk'
export const APK_FILENAME = 'willow-movies.apk'

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
