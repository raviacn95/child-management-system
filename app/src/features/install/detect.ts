import { detectFireTv } from '../../lib/tv'

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone === true) return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  )
}

export function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /WebKit/.test(ua)
  const other = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return ios && webkit && !other
}

export function isChromiumDesktop() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Chrome|Edg|Chromium/i.test(ua) && !/Mobile|Android/i.test(ua)
}

export function isHandheld(ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true
  if (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  return false
}

export function isAndroidPhone(ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  if (/Android/i.test(ua) && !/Android\s*TV|BRAVIA|AFT|Fire TV|Smart[\s-]?TV|GoogleTV|Realme Smart TV/i.test(ua)) return true
  if (typeof navigator !== 'undefined') {
    const uaData = navigator as Navigator & { userAgentData?: { mobile?: boolean; platform?: string } }
    if (uaData.userAgentData?.platform === 'Android') return true
    if (uaData.userAgentData?.mobile && /Linux/i.test(ua)) return true
  }
  return false
}

/** Chrome “Desktop site” on a phone still needs the APK, never a .desktop file. */
export function prefersApkInstall(ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  if (isAndroidPhone(ua)) return true
  if (detectFireTv()) return true
  if (typeof window === 'undefined') return false
  const uaData = navigator as Navigator & { userAgentData?: { mobile?: boolean; platform?: string } }
  if (uaData.userAgentData?.mobile && !isIosSafari()) return true
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  if (coarse && window.innerWidth < 900 && !isIosSafari()) return true
  return false
}

export function isDesktopWindows(ua: string) {
  return /Win/i.test(ua) && !/Windows Phone|Mobile/i.test(ua)
}

export function isDesktopMac(ua: string) {
  if (/iPhone|iPad|iPod/i.test(ua)) return false
  if (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return false
  return /Mac OS X|Macintosh/i.test(ua)
}

export function installSurface() {
  if (detectFireTv()) return 'tv' as const
  if (isIosSafari()) return 'ios' as const
  if (prefersApkInstall()) return 'android' as const
  return 'laptop' as const
}
