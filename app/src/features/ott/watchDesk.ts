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
