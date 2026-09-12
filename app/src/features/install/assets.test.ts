import { describe, expect, it } from 'vitest'
import { apkDownloadUrl, pageRoot, siteAssetUrl } from './assets'

describe('install asset URLs', () => {
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

  it('strips index.html so local assets are not nested under a document', () => {
    expect(siteAssetUrl('downloads/willow-movies.apk', 'https://example.com/app/index.html#/get-app')).toBe(
      'https://example.com/app/downloads/willow-movies.apk',
    )
  })
})
