import { describe, expect, it } from 'vitest'
import { hasPii, hubRowTitle, recommendTopPicks, topPicksCatalog } from './feed'

describe('top picks feed', () => {
  it('ships five movies and five series with summaries and why-to-watch', () => {
    const picks = recommendTopPicks('grove')
    expect(picks).toHaveLength(10)
    expect(picks.filter((p) => p.kind === 'movie')).toHaveLength(5)
    expect(picks.filter((p) => p.kind === 'series')).toHaveLength(5)
    expect(picks.map((p) => p.title)).toContain('The Shawshank Redemption')
    expect(picks.map((p) => p.title)).toContain('Stranger Things')
    for (const pick of picks) {
      expect(pick.summary.length).toBeGreaterThan(40)
      expect(pick.whyToWatch.length).toBeGreaterThan(20)
      expect(pick.rating).toBeTruthy()
      expect(pick.sourceLink.startsWith('https://')).toBe(true)
      expect(pick.watchLinks.length).toBeGreaterThan(0)
      expect(pick.watchLinks.every((link) => /^https:\/\//.test(link.url))).toBe(true)
      expect(hasPii(pick)).toBe(false)
    }
  })

  it('leads Cinema with movies and Arcade with family series', () => {
    expect(recommendTopPicks('cinema')[0]?.kind).toBe('movie')
    expect(recommendTopPicks('arcade')[0]?.title).toBe('Stranger Things')
    expect(hubRowTitle('cinema')).toMatch(/movies/i)
    expect(hubRowTitle('arcade')).toMatch(/series/i)
  })

  it('keeps the editorial catalog at ten cited titles', () => {
    expect(topPicksCatalog.items).toHaveLength(10)
    expect(topPicksCatalog.source).toMatch(/not a live IMDb scrape/i)
  })
})
