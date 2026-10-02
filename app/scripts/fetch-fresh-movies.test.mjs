import { describe, expect, it, vi } from 'vitest'
import {
  attachProviders,
  detailsQuery,
  mapTmdbProviderName,
  mapTmdbProviders,
  mergeProviders,
  tmdbRequest,
  toDetails,
  toFeed,
  wikidataProviders,
} from './fetch-fresh-movies.mjs'

const entry = (qid, title, released = '2026-03-01') => ({
  id: `wd-${qid}`,
  qid,
  title,
  year: 2026,
  released,
  lang: 'ml',
  india: true,
  sitelinks: 4,
})

describe('mapTmdbProviderName', () => {
  it('maps Indian storefront names to Willow platform ids', () => {
    expect(mapTmdbProviderName('Netflix')).toBe('netflix')
    expect(mapTmdbProviderName('Netflix basic with Ads')).toBe('netflix')
    expect(mapTmdbProviderName('Amazon Prime Video')).toBe('prime')
    expect(mapTmdbProviderName('Amazon Prime Video with Ads')).toBe('prime')
    expect(mapTmdbProviderName('Amazon Video')).toBe('prime')
    expect(mapTmdbProviderName('JioHotstar')).toBe('hotstar')
    expect(mapTmdbProviderName('Disney Plus Hotstar')).toBe('hotstar')
    expect(mapTmdbProviderName('Jio Cinema')).toBe('hotstar')
    expect(mapTmdbProviderName('Sony Liv')).toBe('sonyliv')
    expect(mapTmdbProviderName('Zee5')).toBe('zee5')
    expect(mapTmdbProviderName('Sun Nxt')).toBe('sunnxt')
    expect(mapTmdbProviderName('aha')).toBe('aha')
    expect(mapTmdbProviderName('ManoramaMAX')).toBe('manoramamax')
    expect(mapTmdbProviderName('Apple TV')).toBe('appletv')
    expect(mapTmdbProviderName('Apple TV Plus')).toBe('appletv')
    expect(mapTmdbProviderName('Google Play Movies')).toBe('play')
    expect(mapTmdbProviderName('YouTube')).toBe('youtube')
    expect(mapTmdbProviderName('MUBI')).toBe('mubi')
  })

  it('drops providers Willow has no storefront for', () => {
    expect(mapTmdbProviderName('Amazon miniTV')).toBeUndefined()
    expect(mapTmdbProviderName('Ahamovies')).toBeUndefined()
    expect(mapTmdbProviderName('')).toBeUndefined()
    expect(mapTmdbProviderName(undefined)).toBeUndefined()
  })
})

describe('mapTmdbProviders', () => {
  it('turns TMDB results.IN into ordered Willow providers', () => {
    const india = {
      link: 'https://www.themoviedb.org/movie/1/watch?locale=IN',
      buy: [{ provider_id: 2, provider_name: 'Apple TV', display_priority: 4 }],
      rent: [
        { provider_id: 3, provider_name: 'Google Play Movies', display_priority: 2 },
        { provider_id: 2, provider_name: 'Apple TV', display_priority: 4 },
      ],
      flatrate: [
        { provider_id: 2336, provider_name: 'JioHotstar', display_priority: 3 },
        { provider_id: 8, provider_name: 'Netflix', display_priority: 1 },
        { provider_id: 999, provider_name: 'Some Unknown Service', display_priority: 0 },
      ],
      ads: [{ provider_id: 9, provider_name: 'Amazon Prime Video with Ads', display_priority: 5 }],
    }
    expect(mapTmdbProviders(india)).toEqual([
      { platformId: 'netflix', kind: 'stream' },
      { platformId: 'hotstar', kind: 'stream' },
      { platformId: 'prime', kind: 'ads' },
      { platformId: 'play', kind: 'rent' },
      { platformId: 'appletv', kind: 'rent' },
    ])
  })

  it('returns nothing for a missing or malformed region', () => {
    expect(mapTmdbProviders(undefined)).toEqual([])
    expect(mapTmdbProviders({ flatrate: 'nope' })).toEqual([])
  })
})

describe('mergeProviders', () => {
  it('keeps the best way to watch per platform, streaming first', () => {
    const tmdb = [
      { platformId: 'prime', kind: 'rent' },
      { platformId: 'play', kind: 'buy' },
    ]
    const wikidata = [
      { platformId: 'prime', kind: 'stream' },
      { platformId: 'netflix', kind: 'stream' },
    ]
    expect(mergeProviders(tmdb, wikidata)).toEqual([
      { platformId: 'prime', kind: 'stream' },
      { platformId: 'netflix', kind: 'stream' },
      { platformId: 'play', kind: 'buy' },
    ])
    expect(tmdb[0]).toEqual({ platformId: 'prime', kind: 'rent' })
  })
})

describe('wikidataProviders', () => {
  it('maps known streaming distributors and ignores theatrical ones', () => {
    expect(wikidataProviders(['Q907311', 'Q168383', 'Q4740856', 'Q907311'])).toEqual([
      { platformId: 'netflix', kind: 'stream' },
      { platformId: 'prime', kind: 'stream' },
    ])
    expect(wikidataProviders([])).toEqual([])
  })
})

describe('detailsQuery / toDetails', () => {
  it('asks only for the listed films', () => {
    const query = detailsQuery(['Q1', 'Q22'])
    expect(query).toContain('VALUES ?film { wd:Q1 wd:Q22 }')
    expect(query).toContain('P4947')
    expect(query).toContain('P345')
  })

  it('reads TMDB ids, IMDb ids and streaming distributors', () => {
    const details = toDetails([
      {
        film: { value: 'http://www.wikidata.org/entity/Q1' },
        tmdb: { value: '12345' },
        imdb: { value: 'tt0000001' },
        streamers: { value: 'http://www.wikidata.org/entity/Q907311 http://www.wikidata.org/entity/Q1' },
      },
      { film: { value: 'http://www.wikidata.org/entity/Q2' }, tmdb: { value: 'abc' }, imdb: { value: 'bad' } },
    ])
    expect(details.get('Q1')).toEqual({ tmdbId: 12345, imdbId: 'tt0000001', streamQids: ['Q907311', 'Q1'] })
    expect(details.get('Q2')).toEqual({ tmdbId: undefined, imdbId: undefined, streamQids: [] })
  })
})

describe('tmdbRequest', () => {
  it('sends a v3 key as a query parameter', () => {
    const req = tmdbRequest('/movie/5/watch/providers', 'a'.repeat(32))
    expect(req.url).toBe(`https://api.themoviedb.org/3/movie/5/watch/providers?api_key=${'a'.repeat(32)}`)
    expect(req.headers.authorization).toBeUndefined()
  })

  it('sends a v4 read token as a bearer header', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.payload.signature'
    const req = tmdbRequest('/find/tt1?external_source=imdb_id', token)
    expect(req.url).toBe('https://api.themoviedb.org/3/find/tt1?external_source=imdb_id')
    expect(req.headers.authorization).toBe(`Bearer ${token}`)
  })
})

describe('attachProviders', () => {
  const india = { IN: { flatrate: [{ provider_id: 8, provider_name: 'Netflix', display_priority: 1 }] } }

  it('uses Wikidata distributors when there is no TMDB key', async () => {
    const fetchJson = vi.fn()
    const feed = toFeed([entry('Q1', 'Alpha'), entry('Q2', 'Beta')], [], 2026, new Date('2026-10-01T00:00:00Z'))
    const details = new Map([['Q1', { tmdbId: 7, imdbId: undefined, streamQids: ['Q4740856'] }]])
    const out = await attachProviders(feed, details, { key: '', fetchJson })
    expect(fetchJson).not.toHaveBeenCalled()
    expect(out.titles[0]).toMatchObject({ qid: 'Q1', providers: [{ platformId: 'prime', kind: 'stream' }], providersSource: 'wikidata', tmdbId: 7 })
    expect(out.titles[1]).toMatchObject({ qid: 'Q2', providers: [] })
    expect(out.titles[1].providersSource).toBeUndefined()
    expect(out.source).not.toContain('TMDB')
    expect(feed.titles[0].providers).toBeUndefined()
  })

  it('looks up TMDB by id, IMDb id or exact title and keeps failures as empty', async () => {
    const feed = toFeed(
      [entry('Q1', 'Alpha'), entry('Q2', 'Beta'), entry('Q3', 'Gamma'), entry('Q4', 'Delta')],
      [],
      2026,
      new Date('2026-10-01T00:00:00Z'),
    )
    const details = new Map([
      ['Q1', { tmdbId: 11, imdbId: undefined, streamQids: [] }],
      ['Q2', { tmdbId: undefined, imdbId: 'tt0000002', streamQids: [] }],
      ['Q4', { tmdbId: 44, imdbId: undefined, streamQids: [] }],
    ])
    const fetchJson = vi.fn(async (url) => {
      if (url.includes('/movie/11/watch/providers')) return { results: india }
      if (url.includes('/find/tt0000002')) return { movie_results: [{ id: 22 }] }
      if (url.includes('/movie/22/watch/providers')) return { results: {} }
      if (url.includes('/search/movie')) return { results: [{ id: 33, title: 'Gamma', release_date: '2026-02-27' }] }
      if (url.includes('/movie/33/watch/providers')) return { results: { IN: { rent: [{ provider_name: 'Apple TV', display_priority: 1 }] } } }
      throw new Error('TMDB HTTP 500')
    })
    const out = await attachProviders(feed, details, { key: 'k'.repeat(32), fetchJson })
    const byQid = Object.fromEntries(out.titles.map((title) => [title.qid, title]))
    expect(byQid.Q1).toMatchObject({ tmdbId: 11, providersSource: 'tmdb', providers: [{ platformId: 'netflix', kind: 'stream' }] })
    expect(byQid.Q2).toMatchObject({ tmdbId: 22, providersSource: 'tmdb', providers: [] })
    expect(byQid.Q3).toMatchObject({ tmdbId: 33, providersSource: 'tmdb', providers: [{ platformId: 'appletv', kind: 'rent' }] })
    expect(byQid.Q4).toMatchObject({ tmdbId: 44, providers: [] })
    expect(byQid.Q4.providersSource).toBeUndefined()
    expect(out.source).toContain('JustWatch via TMDB')
  })

  it('ignores a TMDB title search that does not match exactly', async () => {
    const feed = toFeed([entry('Q3', 'Gamma')], [], 2026, new Date('2026-10-01T00:00:00Z'))
    const fetchJson = vi.fn(async () => ({ results: [{ id: 9, title: 'Gamma Rising', release_date: '2026-02-27' }] }))
    const out = await attachProviders(feed, new Map(), { key: 'k'.repeat(32), fetchJson })
    expect(out.titles[0]).toMatchObject({ providers: [] })
    expect(out.titles[0].tmdbId).toBeUndefined()
    expect(fetchJson).toHaveBeenCalledTimes(1)
  })

  it('stops calling TMDB once the time budget is spent', async () => {
    const feed = toFeed([entry('Q1', 'Alpha')], [], 2026, new Date('2026-10-01T00:00:00Z'))
    const fetchJson = vi.fn()
    const details = new Map([['Q1', { tmdbId: 11, imdbId: undefined, streamQids: ['Q907311'] }]])
    const out = await attachProviders(feed, details, { key: 'k'.repeat(32), fetchJson, deadline: Date.now() - 1 })
    expect(fetchJson).not.toHaveBeenCalled()
    expect(out.titles[0]).toMatchObject({ providers: [{ platformId: 'netflix', kind: 'stream' }], providersSource: 'wikidata' })
  })
})
