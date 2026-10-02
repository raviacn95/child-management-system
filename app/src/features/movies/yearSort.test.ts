import { describe, expect, it } from 'vitest'
import { applyYearOrder, sortByYear } from './yearSort'

const ranked = [
  { id: 'a', year: 2019 },
  { id: 'b', year: 2024 },
  { id: 'c', year: 2001 },
  { id: 'd', year: 2024 },
  { id: 'e', year: 2019 },
]

const ids = (list: readonly { id: string }[]) => list.map((item) => item.id)

describe('sortByYear', () => {
  it('puts the newest releases first and keeps the ranking within a year', () => {
    expect(ids(sortByYear(ranked, 'newest'))).toEqual(['b', 'd', 'a', 'e', 'c'])
  })

  it('puts the oldest releases first and keeps the ranking within a year', () => {
    expect(ids(sortByYear(ranked, 'oldest'))).toEqual(['c', 'a', 'e', 'b', 'd'])
  })

  it('never mutates the input list', () => {
    const before = ids(ranked)
    const sorted = sortByYear(ranked, 'newest')
    expect(ids(ranked)).toEqual(before)
    expect(sorted).not.toBe(ranked)
  })

  it('handles empty and single-item lists', () => {
    expect(sortByYear([], 'oldest')).toEqual([])
    expect(ids(sortByYear([{ id: 'x', year: 1999 }], 'newest'))).toEqual(['x'])
  })
})

describe('applyYearOrder', () => {
  it('lifts current-year titles to the top for the ranked order', () => {
    expect(ids(applyYearOrder(ranked, 'ranked', 2024))).toEqual(['b', 'd', 'a', 'c', 'e'])
  })

  it('uses a plain year sort for newest and oldest', () => {
    expect(ids(applyYearOrder(ranked, 'newest', 2001))).toEqual(['b', 'd', 'a', 'e', 'c'])
    expect(ids(applyYearOrder(ranked, 'oldest', 2024))).toEqual(['c', 'a', 'e', 'b', 'd'])
  })
})
