import { describe, expect, it } from 'vitest'
import {
  currentYearFirst,
  freshLangs,
  isJustAdded,
  loadFreshCache,
  mergeFreshFeed,
  orderFresh,
  parseFreshFeed,
  saveFreshCache,
  type FreshFeed,
} from './fresh'

const NOW = new Date('2026-09-30T12:00:00Z')

function feed(ids: string[], generatedAt = '2026-09-30T09:00:00Z'): FreshFeed {
  return {
    schemaVersion: 1,
    generatedAt,
    year: 2026,
    source: 'Wikidata (CC0)',
    titles: ids.map((id, i) => ({
      id,
      qid: id.replace('wd-', ''),
      title: `Film ${id}`,
      year: 2026,
      released: `2026-0${(i % 9) + 1}-10`,
      lang: i % 2 ? 'ml' : 'hi',
      india: true,
      sitelinks: 3,
    })),
  }
}

describe('parseFreshFeed', () => {
  it('accepts a valid feed and drops malformed titles', () => {
    const raw = feed(['wd-Q1', 'wd-Q2'])
    const parsed = parseFreshFeed({
      ...raw,
      titles: [...raw.titles, { id: 'bad', title: '<script>', year: 2026, released: 'soon' }],
    })
    expect(parsed?.titles.map((t) => t.id)).toEqual(['wd-Q1', 'wd-Q2'])
  })

  it('rejects junk', () => {
    expect(parseFreshFeed(null)).toBeNull()
    expect(parseFreshFeed({ schemaVersion: 2 })).toBeNull()
    expect(parseFreshFeed('nope')).toBeNull()
  })
})

describe('currentYearFirst', () => {
  it('moves current-year titles to the top and keeps the rest in order', () => {
    const list = [
      { id: 'a', year: 2019 },
      { id: 'b', year: 2026 },
      { id: 'c', year: 2024 },
      { id: 'd', year: 2026 },
    ]
    expect(currentYearFirst(list, 2026).map((t) => t.id)).toEqual(['b', 'd', 'a', 'c'])
    expect(list.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('mergeFreshFeed', () => {
  it('flags only recent releases on first load', () => {
    const first = feed(['wd-Q1', 'wd-Q2'])
    const recent = { ...first, titles: [{ ...first.titles[0], released: '2026-09-27' }, first.titles[1]] }
    const cache = mergeFreshFeed(null, recent, NOW)
    expect(isJustAdded(cache, 'wd-Q1', NOW)).toBe(true)
    expect(isJustAdded(cache, 'wd-Q2', NOW)).toBe(false)
  })

  it('marks titles that appear in a later refresh as just added, then expires them', () => {
    const first = mergeFreshFeed(null, feed(['wd-Q1']), NOW)
    const later = new Date('2026-09-30T15:00:00Z')
    const second = mergeFreshFeed(first, feed(['wd-Q1', 'wd-Q9'], '2026-09-30T15:00:00Z'), later)
    expect(isJustAdded(second, 'wd-Q9', later)).toBe(true)
    expect(isJustAdded(second, 'wd-Q1', later)).toBe(false)
    expect(isJustAdded(second, 'wd-Q9', new Date('2026-10-03T15:00:00Z'))).toBe(false)
    expect(first.addedAt['wd-Q9']).toBeUndefined()
  })
})

describe('orderFresh', () => {
  it('puts just-added titles first, then newest releases', () => {
    const cache = mergeFreshFeed(mergeFreshFeed(null, feed(['wd-Q1', 'wd-Q2']), NOW), feed(['wd-Q1', 'wd-Q2', 'wd-Q3']), NOW)
    expect(orderFresh(cache, NOW).map((t) => t.id)).toEqual(['wd-Q3', 'wd-Q2', 'wd-Q1'])
  })

  it('lists the earliest releases first when asked for oldest', () => {
    const cache = mergeFreshFeed(mergeFreshFeed(null, feed(['wd-Q1', 'wd-Q2']), NOW), feed(['wd-Q1', 'wd-Q2', 'wd-Q3']), NOW)
    expect(orderFresh(cache, NOW, 'oldest').map((t) => t.id)).toEqual(['wd-Q1', 'wd-Q2', 'wd-Q3'])
  })
})

describe('freshLangs', () => {
  it('lists languages present in the feed, Malayalam first', () => {
    expect(freshLangs(feed(['wd-Q1', 'wd-Q2']).titles)).toEqual(['ml', 'hi'])
  })
})

describe('fresh cache', () => {
  it('round-trips through localStorage and ignores corrupt data', () => {
    localStorage.removeItem('willow-fresh-movies-v1')
    expect(loadFreshCache()).toBeNull()
    const cache = mergeFreshFeed(null, feed(['wd-Q1']), NOW)
    saveFreshCache(cache)
    expect(loadFreshCache()?.feed.titles[0]?.id).toBe('wd-Q1')
    localStorage.setItem('willow-fresh-movies-v1', '{oops')
    expect(loadFreshCache()).toBeNull()
  })
})
