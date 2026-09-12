const KEY = 'willow-tv-mode'

export function detectFireTv() {
  if (typeof navigator === 'undefined') return false
  return /AFT[A-Z]|AmazonWebAppPlatform|BRAVIA|SmartTV|Web0S|Tizen|CrKey/i.test(navigator.userAgent)
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
