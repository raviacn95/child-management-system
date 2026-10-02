import { describe, expect, it } from 'vitest'
import { titles as catalogTitles } from './catalog'
import type { FreshFeed, FreshTitle } from './fresh'
import { freshToCatalogTitles, withFreshTitles } from './freshShelf'
import { recommendMovies } from './recommend'
import { applyYearOrder } from './yearSort'

function fresh(qid: string, overrides: Partial<FreshTitle> = {}): FreshTitle {
  return {
    id: `wd-${qid}`,
    qid,
    title: `Film ${qid}`,
    year: 2026,
    released: '2026-03-01',
    lang: 'ml',
    india: true,
    sitelinks: 3,
    providers: [{ platformId: 'netflix', kind: 'stream' }],
    ...overrides,
  }
}

function feed(list: FreshTitle[]): FreshFeed {
  return { schemaVersion: 1, generatedAt: '2026-10-01T00:00:00Z', year: 2026, source: 'Wikidata (CC0)', titles: list }
}

describe('freshToCatalogTitles', () => {
  it('turns titles with a known channel into catalog movies, newest release first', () => {
    const out = freshToCatalogTitles(
      feed([
        fresh('Q1', {
          released: '2026-02-01',
          providers: [
            { platformId: 'appletv', kind: 'rent' },
            { platformId: 'hotstar', kind: 'stream' },
          ],
        }),
        fresh('Q2', { released: '2026-05-01', lang: 'hi' }),
      ]),
    )
    expect(out.map((t) => t.id)).toEqual(['wd-Q2', 'wd-Q1'])
    expect(out[1]).toMatchObject({
      title: 'Film Q1',
      year: 2026,
      kind: 'movie',
      originalLang: 'ml',
      languages: ['ml'],
      platformIds: ['hotstar', 'appletv'],
      shelf: 'family',
      adult: false,
    })
    expect(out[1].why).toBe('New in 2026, released 2026-02-01.')
    expect(out[1].why).not.toMatch(/JioHotstar|Apple TV|Netflix|Rent on|In India/i)
  })

  it('leaves out films with no channel, an unknown channel or an unknown language', () => {
    const out = freshToCatalogTitles(
      feed([
        fresh('Q1', { providers: [] }),
        fresh('Q2', { providers: [{ platformId: 'notreal', kind: 'stream' }] }),
        fresh('Q3', { lang: '' }),
        fresh('Q4'),
      ]),
    )
    expect(out.map((t) => t.id)).toEqual(['wd-Q4'])
    expect(freshToCatalogTitles(null)).toEqual([])
  })

  it('does not repeat a film already in the static catalog', () => {
    const known = catalogTitles[0]
    const out = freshToCatalogTitles(feed([fresh('Q1', { title: `${known.title.toUpperCase()}!`, year: known.year })]))
    expect(out).toEqual([])
  })
})

describe('withFreshTitles', () => {
  const freshTitles = freshToCatalogTitles(
    feed([
      fresh('Q1', { released: '2026-06-01', lang: 'ml' }),
      fresh('Q2', { released: '2026-05-01', lang: 'hi', providers: [{ platformId: 'prime', kind: 'stream' }] }),
    ]),
  )
  const ranked = recommendMovies({ limit: 10, seed: 'fresh-test' }).titles

  it('puts this year’s films first with their channel links and keeps the shelf size', () => {
    const out = withFreshTitles(ranked, freshTitles, { limit: 10 })
    expect(out).toHaveLength(10)
    expect(out.slice(0, 2).map((t) => t.id)).toEqual(['wd-Q1', 'wd-Q2'])
    expect(out[0].watchLinks.map((link) => link.platformId)).toContain('netflix')
    expect(out[1].watchLinks.map((link) => link.platformId)).toContain('prime')
    expect(out.slice(2).map((t) => t.id)).toEqual(ranked.slice(0, 8).map((t) => t.id))
  })

  it('tops the shelf when ranked newest first', () => {
    const out = applyYearOrder(withFreshTitles(ranked, freshTitles, { limit: 10 }), 'newest')
    expect(out[0].year).toBe(2026)
    expect(out[0].id).toBe('wd-Q1')
  })

  it('keeps a language chip to original-language films only', () => {
    const out = withFreshTitles([], freshTitles, { limit: 10, lang: 'hi' })
    expect(out.map((t) => t.id)).toEqual(['wd-Q2'])
  })

  it('respects the series, channel and country filters', () => {
    expect(withFreshTitles([], freshTitles, { limit: 10, kind: 'series' })).toEqual([])
    expect(withFreshTitles([], freshTitles, { limit: 10, platformId: 'prime' }).map((t) => t.id)).toEqual(['wd-Q2'])
    expect(withFreshTitles([], freshTitles, { limit: 10, region: 'US' })).toEqual([])
    expect(withFreshTitles([], freshTitles, { limit: 10, region: 'in' })).toHaveLength(2)
  })

  it('caps how many new films join the shelf', () => {
    expect(withFreshTitles(ranked, freshTitles, { limit: 10, maxFresh: 1 }).map((t) => t.id)[0]).toBe('wd-Q1')
    expect(withFreshTitles(ranked, freshTitles, { limit: 10, maxFresh: 1 })[1].id).toBe(ranked[0].id)
  })
})
