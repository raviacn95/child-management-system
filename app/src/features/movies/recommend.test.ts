import { describe, expect, it } from 'vitest'
import { catalogStats, platforms, titles, watchLinks } from './catalog'
import { recommendMovies } from './recommend'

describe('movie catalog scale', () => {
  it('registers 50+ storefronts and 100+ titles including Malayalam', () => {
    const stats = catalogStats()
    expect(stats.platformCount).toBeGreaterThanOrEqual(50)
    expect(stats.titleCount).toBeGreaterThanOrEqual(100)
    expect(stats.malayalam).toBeGreaterThanOrEqual(50)
    expect(new Set(titles.map((t) => t.id)).size).toBe(titles.length)
    expect(platforms.some((p) => p.id === 'prime')).toBe(true)
    expect(platforms.some((p) => p.id === 'sonyliv')).toBe(true)
    expect(platforms.some((p) => p.id === 'play')).toBe(true)
    expect(platforms.some((p) => p.id === 'justwatch')).toBe(true)
    expect(titles.some((t) => t.title === 'Kumbalangi Nights')).toBe(true)
  })

  it('always returns 100 titles with official watch links', () => {
    const a = recommendMovies({ limit: 100, seed: 'alpha' })
    const b = recommendMovies({ limit: 100, seed: 'beta' })
    expect(a.count).toBe(100)
    expect(b.count).toBe(100)
    expect(a.titles[0]?.id).not.toBe(b.titles[0]?.id)
    for (const t of a.titles) {
      expect(t.watchLinks.length).toBeGreaterThan(0)
      expect(t.watchLinks.every((w) => w.url.startsWith('https://'))).toBe(true)
      const hotstar = t.watchLinks.find((w) => w.platformId === 'hotstar')
      if (hotstar && !/^https:\/\/www\.hotstar\.com\/in\/\d+$/.test(hotstar.url)) {
        expect(hotstar.url).toMatch(/search_query=/)
        expect(decodeURIComponent(hotstar.url)).toContain(t.title)
      }
      const prime = t.watchLinks.find((w) => w.platformId === 'prime')
      if (prime && !/^https:\/\/www\.primevideo\.com\/detail\/amzn1\.dv\.gti\.[0-9a-f-]+$/.test(prime.url)) {
        expect(prime.url).toMatch(/phrase=/)
        expect(decodeURIComponent(prime.url)).toContain(t.title)
      }
    }
  })

  it('language chips keep original-language titles only — no dubbed remakes', () => {
    const ml = recommendMovies({ limit: 100, languages: ['ml'], seed: 'ml-1' })
    expect(ml.originalsOnly).toBe(true)
    expect(ml.count).toBeGreaterThanOrEqual(50)
    expect(ml.count).toBeLessThan(100)
    expect(ml.titles.every((t) => t.originalLang === 'ml')).toBe(true)
    expect(ml.titles.some((t) => t.id === 'papanasam')).toBe(false)
    expect(ml.titles.some((t) => t.id === 'drishyam')).toBe(true)

    const bn = recommendMovies({ shelf: 'erotic', limit: 150, languages: ['bn'], seed: 'bn-1' })
    expect(bn.originalsOnly).toBe(true)
    expect(bn.count).toBeGreaterThanOrEqual(10)
    expect(bn.titles.every((t) => t.originalLang === 'bn')).toBe(true)
    expect(bn.titles.some((t) => t.id === 'er-belle-de-jour')).toBe(false)
    expect(bn.titles.some((t) => t.id === 'er-chokher-bali')).toBe(true)
  })

  it('erotic shelf returns 150 adult titles with official links and no family mix-in by default', () => {
    const stats = catalogStats()
    expect(stats.eroticTitleCount).toBeGreaterThanOrEqual(150)
    const out = recommendMovies({ shelf: 'erotic', limit: 150, seed: 'er-1' })
    expect(out.count).toBe(150)
    expect(out.titles.every((t) => t.adult)).toBe(true)
    expect(out.titles.every((t) => t.genres.includes('erotic'))).toBe(true)
    expect(new Set(out.titles.map((t) => t.id)).size).toBe(150)
    expect(out.originalsOnly).toBe(false)
    expect(out.titles.some((t) => t.originalLang === 'ml')).toBe(true)
    expect(out.titles.some((t) => t.originalLang === 'hi')).toBe(true)
    expect(out.titles.some((t) => t.year < 1980)).toBe(true)
    expect(out.titles.some((t) => t.year >= 2020)).toBe(true)
    for (const t of out.titles) {
      expect(t.watchLinks.length).toBeGreaterThan(0)
      expect(t.watchLinks.every((w) => w.url.startsWith('https://'))).toBe(true)
    }
  })
})

describe('ad-free first watch links', () => {
  const jallikattu = titles.find((t) => t.id === 'jallikattu')!
  const official = (links: ReturnType<typeof watchLinks>) => links.filter((w) => w.platformId !== 'justwatch')

  it('puts a connected ad-free plan the title is listed on first, ahead of the resolver', () => {
    expect(jallikattu.platformIds.slice(0, 2)).toEqual(['prime', 'netflix'])
    const links = watchLinks(jallikattu, { connectedIds: ['prime', 'netflix'], adFreeIds: ['netflix'] })
    expect(links[0]).toMatchObject({ platformId: 'netflix', adFree: true, adLabel: 'ad-free' })
    expect(links.findIndex((w) => w.platformId === 'justwatch')).toBeGreaterThan(0)
    expect(links.find((w) => w.platformId === 'prime')).toMatchObject({ adFree: false, adLabel: 'has-ads' })
    expect(links.every((w) => w.url.startsWith('https://'))).toBe(true)
  })

  it('keeps the listed order when Ad-free first is off', () => {
    const links = watchLinks(jallikattu, { connectedIds: ['netflix'], adFreeIds: ['netflix'], preferAdFree: false })
    expect(links.some((w) => w.platformId === 'justwatch')).toBe(true)
    expect(official(links)[0]?.platformId).toBe('netflix')
    const plain = watchLinks(jallikattu, { preferAdFree: false })
    expect(official(plain).map((w) => w.platformId).slice(0, 2)).toEqual(['prime', 'netflix'])
  })

  it('preserves connected order for platforms the title is not listed on and ranks them after listed ones', () => {
    const links = official(watchLinks(jallikattu, { connectedIds: ['sonyliv', 'hotstar'] }))
    const ids = links.map((w) => w.platformId)
    expect(ids.indexOf('sonyliv')).toBeLessThan(ids.indexOf('hotstar'))
    expect(ids.indexOf('mubi')).toBeLessThan(ids.indexOf('sonyliv'))
  })

  it('passes ad-free options through recommendMovies and keeps every URL https', () => {
    const out = recommendMovies({
      limit: 100,
      seed: 'ad-free-1',
      connectedPlatformIds: ['netflix'],
      adFreePlatformIds: ['netflix'],
      preferAdFree: true,
    })
    for (const t of out.titles) {
      expect(t.watchLinks.some((w) => w.platformId === 'justwatch')).toBe(true)
      expect(t.watchLinks.every((w) => w.url.startsWith('https://'))).toBe(true)
      if (t.platformIds.includes('netflix')) expect(t.watchLinks[0]?.platformId).toBe('netflix')
    }
  })
})
