import { describe, expect, it } from 'vitest'
import { EXPECTED_FEATURED, getLearningPacks, getPackByAgeBand } from './learningPacks'

describe('learningPacks service', () => {
  it('hydrates three unique age packs from JSON', () => {
    const { packs } = getLearningPacks()
    expect(packs.map((p) => p.ageBand)).toEqual(['2-5', '5-8', '8-12'])
    for (const pack of packs) {
      const ids = pack.channels.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(pack.playlistUrl).toMatch(/^https:\/\/www\.youtube\.com\//)
      expect(pack.channels.length).toBe(pack.channelIds.length)
    }
  })

  it('maps featured channels for each band', () => {
    for (const [band, featured] of Object.entries(EXPECTED_FEATURED)) {
      const pack = getPackByAgeBand(band as '2-5')
      expect(pack).toBeTruthy()
      expect(pack!.featuredChannelIds).toEqual(expect.arrayContaining(featured))
    }
  })
})
