const FAIL_KEY = 'willow-boot-fails'

export function isPreviousRelease(href?: string) {
  const path = new URL((href ?? (typeof window !== 'undefined' ? window.location.href : 'https://example.com/')).split('#')[0]).pathname
  return path.includes('/releases/previous')
}

export function previousReleaseUrl(fromHref?: string) {
  const href = fromHref ?? (typeof window !== 'undefined' ? window.location.href : 'https://raviacn95.github.io/child-management-system/')
  const page = href.split('#')[0]
  const u = new URL(page)
  let path = u.pathname
  if (path.endsWith('index.html')) path = path.slice(0, -'index.html'.length)
  if (path.includes('/releases/previous')) {
    u.pathname = path.replace(/\/releases\/previous\/?/, '/')
    if (!u.pathname.endsWith('/')) u.pathname += '/'
    u.hash = ''
    u.search = ''
    return u.href
  }
  if (!path.endsWith('/')) path += '/'
  u.pathname = `${path}releases/previous/`
  u.hash = ''
  u.search = ''
  return u.href
}

export function markBootStart() {
  if (typeof sessionStorage === 'undefined' || isPreviousRelease()) return
  const n = Number(sessionStorage.getItem(FAIL_KEY) || '0') + 1
  sessionStorage.setItem(FAIL_KEY, String(n))
  if (n >= 2) void rollbackToPreviousRelease()
}

export function markBootSuccess() {
  try {
    sessionStorage.setItem(FAIL_KEY, '0')
  } catch {
    /* ignore */
  }
}

export async function rollbackToPreviousRelease() {
  if (typeof window === 'undefined' || isPreviousRelease()) return false
  const url = previousReleaseUrl()
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) return false
  } catch {
    return false
  }
  markBootSuccess()
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((r) => r.unregister()))
  }
  window.location.replace(url)
  return true
}
