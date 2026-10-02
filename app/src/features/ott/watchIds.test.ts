import { describe, expect, it } from 'vitest'
import watchIdsFile from '../../data/watch-ids.json'
import { indexWatchIds, rememberWatchIds, watchIdsFor, watchKey } from './watchIds'

describe('watchKey', () => {
  it('ignores case, punctuation and bracketed notes', () => {
    expect(watchKey("The Queen's Gambit", 2020)).toBe(watchKey('the queens gambit (miniseries)', 2020))
    expect(watchKey('Drishyam', 2013)).not.toBe(watchKey('Drishyam', 2015))
  })
})

describe('indexWatchIds', () => {
  it('drops a key when two titles disagree instead of guessing', () => {
    const index = indexWatchIds([
      { title: 'Same', year: 2020, watchIds: { netflix: '80000001' } },
      { title: 'Same', year: 2020, watchIds: { netflix: '80000002' } },
      { title: 'Same', year: 2020, watchIds: { netflix: '80000001' } },
      { title: 'Other', year: 2020, watchIds: {} },
    ])
    expect(index.size).toBe(0)
  })
})

describe('watchIdsFor', () => {
  it('finds committed catalog IDs by title and year', () => {
    const [entry] = Object.values(watchIdsFile.titles).filter((t) => 'netflix' in t.ids)
    expect(watchIdsFor(entry.title, entry.year)?.netflix).toMatch(/^\d{6,9}$/)
    expect(watchIdsFor(entry.title, entry.year + 1)).toBeUndefined()
    expect(watchIdsFor(undefined, 2020)).toBeUndefined()
  })

  it('adds IDs from the live feed without overriding the catalog', () => {
    const [entry] = Object.values(watchIdsFile.titles).filter((t) => 'netflix' in t.ids)
    rememberWatchIds([
      { title: 'Fresh Test Movie', year: 2026, watchIds: { netflix: '81999999' } },
      { title: entry.title, year: entry.year, watchIds: { netflix: '81000000' } },
    ])
    expect(watchIdsFor('Fresh Test Movie', 2026)).toEqual({ netflix: '81999999' })
    expect(watchIdsFor(entry.title, entry.year)?.netflix).toBe((entry.ids as { netflix: string }).netflix)
    rememberWatchIds([])
    expect(watchIdsFor('Fresh Test Movie', 2026)).toBeUndefined()
  })
})
