export const WATCH_RETURN_KEY = 'willow-watch-return'

export type LocationLike = {
  href: string
  assign: (url: string) => void
}

/** Open a storefront in this same page. Back / Close returns to Willow — no extra tabs. */
export function openChannel(url: string, loc: LocationLike = window.location) {
  if (!url) return
  try {
    sessionStorage.setItem(WATCH_RETURN_KEY, loc.href)
  } catch {
    /* private mode */
  }
  loc.assign(url)
}

export function watchReturnHref() {
  try {
    return sessionStorage.getItem(WATCH_RETURN_KEY)
  } catch {
    return null
  }
}

/** Keep Willow on screen. Official apps open in a new context so Back / Close still lands here. */
export function openOfficialApp(url: string, target = 'willow_player') {
  if (!url || typeof window === 'undefined') return false
  try {
    sessionStorage.setItem(WATCH_RETURN_KEY, window.location.href)
  } catch {
    /* private mode */
  }
  const opened = window.open(url, target)
  return Boolean(opened)
}
