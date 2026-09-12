const KEY = 'willow-tv-mode'

const TV_UA =
  /AFT[A-Z]|AmazonWebAppPlatform|BRAVIA|Smart[\s-]?TV|SMART TV|Web0S|Tizen|CrKey|Android\s*TV|AndroidTV|GoogleTV|Google TV|Realme Smart TV|HbbTV|Nexus Player|SHIELD/i

export function detectFireTv(ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  if (TV_UA.test(ua)) return true
  if (typeof window === 'undefined' || !/Android/i.test(ua) || /Mobile|Phone/i.test(ua)) return false
  const wide = window.innerWidth >= 960
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  return wide && coarse
}

export function isTvMode() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === '1') return true
    if (saved === '0') return false
  } catch {
    /* ignore */
  }
  return detectFireTv()
}

export function setTvMode(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
  applyTvMode(on)
}

export function applyTvMode(on = isTvMode()) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.tv = on ? '1' : '0'
  applyDeviceChrome(on)
}

export function applyDeviceChrome(tv = isTvMode()) {
  if (typeof document === 'undefined') return
  const media = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null
  const coarse = media?.('(pointer: coarse)').matches ?? false
  const narrow = media?.('(max-width: 720px)').matches ?? false
  document.documentElement.dataset.device = tv ? 'tv' : coarse || narrow ? 'phone' : 'desktop'
}

export function homePath() {
  return isTvMode() ? '/hub' : '/'
}
