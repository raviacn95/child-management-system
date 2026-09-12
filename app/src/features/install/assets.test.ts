import { describe, expect, it } from 'vitest'
import { apkDownloadUrl, isOfficialSource, isTrustedSource, liveLaunchUrl, LIVE_SITE, pageRoot, siteAssetUrl } from './assets'

describe('install asset URLs', () => {
  it('launches the live site with a fresh cache token, never a baked moviesum query', () => {
    expect(liveLaunchUrl(1700000000000)).toBe(`${LIVE_SITE}?willow=1700000000000`)
    expect(liveLaunchUrl(1700000000000)).not.toMatch(/moviesum|looks1|framework1/)
  })

  it('keeps the APK next to the GitHub Pages app, not inside the hash route', () => {
    expect(apkDownloadUrl()).toBe(
      'https://raviacn95.github.io/child-management-system/downloads/willow.apk',
    )
  })

  it('treats a path without a trailing slash as the site folder', () => {
    const href = 'https://raviacn95.github.io/child-management-system'
    expect(pageRoot(href).href).toBe('https://raviacn95.github.io/child-management-system/')
    expect(siteAssetUrl('downloads/willow-movies.apk', href)).toBe(
      'https://raviacn95.github.io/child-management-system/downloads/willow-movies.apk',
    )
  })

  it('only trusts the official Pages host or a local app', () => {
    expect(isOfficialSource('https://raviacn95.github.io/child-management-system/release.json')).toBe(true)
    expect(isOfficialSource('https://evil.example/child-management-system/release.json')).toBe(false)
    expect(isOfficialSource('http://raviacn95.github.io/child-management-system/')).toBe(false)
    expect(isTrustedSource('http://127.0.0.1:5173/release.json')).toBe(true)
    expect(isTrustedSource('https://example.com/release.json')).toBe(false)
  })

  it('strips index.html so local assets are not nested under a document', () => {
    expect(siteAssetUrl('downloads/willow-movies.apk', 'https://example.com/app/index.html#/get-app')).toBe(
      'https://example.com/app/downloads/willow-movies.apk',
    )
  })
})
