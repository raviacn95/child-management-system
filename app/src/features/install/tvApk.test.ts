import { describe, expect, it, vi } from 'vitest'
import { apkInstallIntent, isOfficialApkUrl, startTvApkInstall } from './tvApk'

const LIVE_APK = 'https://raviacn95.github.io/child-management-system/downloads/willow-movies.apk'

describe('TV APK install', () => {
  it('only opens official Willow APKs', () => {
    expect(isOfficialApkUrl(LIVE_APK)).toBe(true)
    expect(isOfficialApkUrl('https://github.com/raviacn95/child-management-system/releases/latest/download/willow-movies.apk')).toBe(true)
    expect(isOfficialApkUrl('https://evil.example/willow-movies.apk')).toBe(false)
    expect(isOfficialApkUrl('http://raviacn95.github.io/child-management-system/downloads/willow-movies.apk')).toBe(false)
  })

  it('starts a package-install intent so Realme / Android TV can install', () => {
    const assign = vi.fn()
    const result = startTvApkInstall(LIVE_APK, assign, true)
    expect(result.started).toBe(true)
    expect(result.intent).toContain('intent://raviacn95.github.io/child-management-system/downloads/willow-movies.apk')
    expect(result.intent).toContain('application/vnd.android.package-archive')
    expect(assign).toHaveBeenCalledWith(apkInstallIntent(LIVE_APK))
    assign.mockClear()
    startTvApkInstall(LIVE_APK, assign, false)
    expect(assign).toHaveBeenCalledWith(LIVE_APK)
    expect(startTvApkInstall('https://evil.example/x.apk', assign).started).toBe(false)
  })
})
