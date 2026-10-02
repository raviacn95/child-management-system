import { describe, expect, it } from 'vitest'
import { adLabelFor, isAdFreeForUser, rankWatchIds } from './adFree'

const platformAds = {
  netflix: 'none',
  prime: 'tiered',
  hotstar: 'tiered',
  mxplayer: 'always',
  justwatch: 'resolver',
} as const

describe('adLabelFor', () => {
  it('marks a plan the user saved as ad-free', () => {
    expect(adLabelFor('prime', { adFreeIds: ['prime'], platformAds })).toBe('ad-free')
  })

  it('treats platforms without an ad tier as ad-free for everyone', () => {
    expect(adLabelFor('netflix', { platformAds })).toBe('ad-free')
  })

  it('flags tiered and always-ads platforms the user has not marked ad-free', () => {
    expect(adLabelFor('prime', { platformAds })).toBe('has-ads')
    expect(adLabelFor('mxplayer', { adFreeIds: ['prime'], platformAds })).toBe('has-ads')
  })

  it('stays unknown for resolvers and platforms without ad data', () => {
    expect(adLabelFor('justwatch', { platformAds })).toBe('unknown')
    expect(adLabelFor('mubi', { platformAds })).toBe('unknown')
    expect(adLabelFor('mubi', {})).toBe('unknown')
  })
})

describe('isAdFreeForUser', () => {
  it('needs the user to have the service, not just an ad-free catalog entry', () => {
    expect(isAdFreeForUser('netflix', { platformAds })).toBe(false)
    expect(isAdFreeForUser('netflix', { platformAds, connectedIds: ['netflix'] })).toBe(true)
    expect(isAdFreeForUser('prime', { platformAds, connectedIds: ['prime'] })).toBe(false)
    expect(isAdFreeForUser('prime', { platformAds, adFreeIds: ['prime'], connectedIds: ['prime'] })).toBe(true)
  })
})

describe('rankWatchIds', () => {
  it('puts listed ad-free plans first, then listed connected, listed, connected-only, always-ads', () => {
    const ids = ['mxplayer', 'prime', 'hotstar', 'netflix', 'mubi', 'sonyliv']
    const ranked = rankWatchIds(ids, {
      listedIds: ['mxplayer', 'prime', 'hotstar', 'netflix'],
      connectedIds: ['sonyliv', 'hotstar', 'netflix', 'mxplayer'],
      adFreeIds: ['netflix'],
      platformAds,
    })
    expect(ranked).toEqual(['netflix', 'hotstar', 'prime', 'sonyliv', 'mubi', 'mxplayer'])
  })

  it('is stable inside a tier and preserves connected order', () => {
    const ranked = rankWatchIds(['prime', 'hotstar', 'zee5', 'aha'], {
      listedIds: ['prime', 'hotstar'],
      connectedIds: ['zee5', 'aha'],
      platformAds,
    })
    expect(ranked).toEqual(['prime', 'hotstar', 'zee5', 'aha'])
  })

  it('never mutates its input', () => {
    const ids = Object.freeze(['prime', 'netflix'])
    const ctx = Object.freeze({
      listedIds: Object.freeze(['prime', 'netflix']),
      connectedIds: Object.freeze(['netflix']),
      platformAds,
    })
    const ranked = rankWatchIds(ids, ctx)
    expect(ranked).toEqual(['netflix', 'prime'])
    expect(ids).toEqual(['prime', 'netflix'])
    expect(ranked).not.toBe(ids)
  })

  it('skips the ad-free boost when the user turns Ad-free first off', () => {
    const ranked = rankWatchIds(['prime', 'netflix'], {
      listedIds: ['prime', 'netflix'],
      connectedIds: ['prime', 'netflix'],
      adFreeIds: ['netflix'],
      preferAdFree: false,
      platformAds,
    })
    expect(ranked).toEqual(['prime', 'netflix'])
  })

  it('does not promote unknown or unmarked plans above other connected ones', () => {
    const ranked = rankWatchIds(['hotstar', 'prime', 'mubi'], {
      listedIds: ['hotstar', 'prime', 'mubi'],
      connectedIds: ['mubi', 'prime'],
      platformAds,
    })
    expect(ranked).toEqual(['prime', 'mubi', 'hotstar'])
  })
})
