import { describe, expect, it } from 'vitest'
import { catalogStats, platforms, titles } from './catalog'
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
      if (hotstar) {
        expect(hotstar.url).toMatch(/search_query=/)
        expect(decodeURIComponent(hotstar.url)).toContain(t.title)
      }
      const prime = t.watchLinks.find((w) => w.platformId === 'prime')
      if (prime) {
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
