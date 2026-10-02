import { describe, expect, it } from 'vitest'
import { BLOCKED_PLATFORMS, mentionsBlockedPlatform } from './blockedPlatforms'
import { EROTIC_ROWS } from './erotic-movies-data'
import platformsJson from './streaming-platforms.json'

const PLATFORMS_COLUMN = 6

describe('blocked platforms', () => {
  it('are not listed as streaming platforms', () => {
    const ids = platformsJson.platforms.map((p) => p.id)
    expect(ids.filter((id) => BLOCKED_PLATFORMS.includes(id))).toEqual([])
  })

  it('are not linked from any erotic shelf title', () => {
    const linked = EROTIC_ROWS.flatMap((row) => String(row[PLATFORMS_COLUMN]).split(','))
    expect(linked.filter((id) => BLOCKED_PLATFORMS.includes(id))).toEqual([])
  })
})

describe('mentionsBlockedPlatform', () => {
  it('spots blocked apps in names and hosts whatever the spacing or case', () => {
    expect(mentionsBlockedPlatform('Ullu')).toBe(true)
    expect(mentionsBlockedPlatform('ALT Balaji')).toBe(true)
    expect(mentionsBlockedPlatform('www.primeplay.co.in')).toBe(true)
    expect(mentionsBlockedPlatform('hit-prime.app')).toBe(true)
  })

  it('leaves legal services alone', () => {
    for (const ok of ['Netflix', 'www.primevideo.com', 'hoichoi.tv', 'www.mxplayer.in', 'Klikk', 'www.zee5.com']) {
      expect(mentionsBlockedPlatform(ok)).toBe(false)
    }
  })
})
