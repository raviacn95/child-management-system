import { describe, expect, it } from 'vitest'
import { searchWillow } from './searchIndex'

describe('smart search', () => {
  it('finds movies, learning, and parent pages from one box', () => {
    const hits = searchWillow('learn')
    expect(hits.some((hit) => hit.group === 'Learning' || hit.group === 'Pages')).toBe(true)
    expect(searchWillow('drishyam').some((hit) => hit.group === 'Movies')).toBe(true)
    expect(searchWillow('shawshank').some((hit) => hit.title.includes('Shawshank'))).toBe(true)
  })
})
