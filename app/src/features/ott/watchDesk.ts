import { isNativeShell, isTvMode } from '../../lib/tv'
import { openPlan, type OpenEnv } from './openPlan'

export const WATCH_RETURN_KEY = 'willow-watch-return'

export type LocationLike = {
  href: string
  assign: (url: string) => void
}

export type Launcher = {
  open: (url: string, target: string, features: string) => unknown
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

export function currentOpenEnv(): OpenEnv {
  return {
    tv: isTvMode(),
    native: isNativeShell(),
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    origin: typeof window !== 'undefined' ? window.location.origin : undefined,
  }
}

const browserLauncher: Launcher = {
  open: (url, target, features) => window.open(url, target, features),
  assign: (url) => window.location.assign(url),
}

/**
 * Keep Willow on screen: apps and TVs get the official app through Android, browsers get a new tab.
 * Must run inside the click handler so the tab is not popup-blocked.
 */
export function openOfficialApp(url: string, env: OpenEnv = currentOpenEnv(), launcher: Launcher = browserLauncher) {
  if (!url || typeof window === 'undefined') return false
  const plan = openPlan({ url, ...env })
  if (!plan) return false
  try {
    sessionStorage.setItem(WATCH_RETURN_KEY, window.location.href)
  } catch {
    /* private mode */
  }
  if (plan.mode === 'navigate') launcher.assign(plan.href)
  else launcher.open(plan.href, '_blank', 'noopener')
  return true
}
