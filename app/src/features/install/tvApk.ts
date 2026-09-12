import { detectFireTv } from '../../lib/tv'
import { APK_TV_RELEASE_URL, isOfficialSource, isTrustedSource } from './assets'

export function isOfficialApkUrl(href: string) {
  try {
    const u = new URL(href)
    if (u.protocol !== 'https:' || !/\.apk$/i.test(u.pathname)) return false
    if (isOfficialSource(href) || isTrustedSource(href)) return true
    return (
      u.hostname === 'github.com' &&
      u.pathname.startsWith('/raviacn95/child-management-system/releases/') &&
      /willow(-movies)?\.apk$/i.test(u.pathname)
    )
  } catch {
    return false
  }
}

export function apkInstallIntent(apkUrl: string) {
  const u = new URL(apkUrl)
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;action=android.intent.action.VIEW;type=application/vnd.android.package-archive;S.browser_fallback_url=${encodeURIComponent(apkUrl)};end`
}

export function startTvApkInstall(
  apkUrl: string,
  assign: (href: string) => void = (href) => {
    window.location.assign(href)
  },
  livingRoom = detectFireTv(),
) {
  if (!isOfficialApkUrl(apkUrl)) return { started: false as const, href: '', intent: '' }
  const intent = apkInstallIntent(apkUrl)
  assign(livingRoom ? intent : apkUrl)
  if (livingRoom && typeof window !== 'undefined') {
    window.setTimeout(() => {
      if (/get-app/i.test(window.location.hash)) assign(apkUrl)
    }, 800)
  }
  return { started: true as const, href: apkUrl, intent }
}

export function tvApkFallbackUrl() {
  return APK_TV_RELEASE_URL
}
