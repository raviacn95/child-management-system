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

export function installSurface() {
  if (detectFireTv()) return 'tv' as const
  if (isIosSafari()) return 'ios' as const
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) return 'android' as const
  return 'laptop' as const
}
