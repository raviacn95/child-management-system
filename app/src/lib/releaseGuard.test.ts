import { describe, expect, it } from 'vitest'
import { isPreviousRelease, previousReleaseUrl } from './releaseGuard'

describe('previous live release', () => {
  it('keeps a crash fallback next to the GitHub Pages app', () => {
    expect(previousReleaseUrl('https://raviacn95.github.io/child-management-system/#/movies')).toBe(
      'https://raviacn95.github.io/child-management-system/releases/previous/',
    )
    expect(isPreviousRelease('https://raviacn95.github.io/child-management-system/releases/previous/#/')).toBe(true)
  })
})
