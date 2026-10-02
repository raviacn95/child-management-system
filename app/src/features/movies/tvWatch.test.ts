import { describe, expect, it } from 'vitest'
import { titles, watchLinks } from './catalog'
import type { RankedMovie } from './schema'
import { bestLink } from './tvWatch'

const jallikattu = titles.find((t) => t.id === 'jallikattu')!

function ranked(opts: Parameters<typeof watchLinks>[1]): RankedMovie {
  return { ...jallikattu, score: 1, reasons: [], watchLinks: watchLinks(jallikattu, { tv: true, ...opts }) }
}

describe('TV Watch button target', () => {
  it('prefers an ad-free plan the title is listed on', () => {
    const title = ranked({ connectedIds: ['prime', 'netflix'], adFreeIds: ['netflix'] })
    expect(bestLink(title, ['prime', 'netflix'], { adFreeIds: ['netflix'] })).toMatchObject({
      link: { platformId: 'netflix' },
      adFree: true,
    })
  })

  it('falls back to a connected listed plan, then the first official link, never JustWatch first', () => {
    const connected = ranked({ connectedIds: ['mubi'] })
    expect(bestLink(connected, ['mubi']).link?.platformId).toBe('mubi')
    const none = ranked({})
    expect(bestLink(none, []).link?.platformId).toBe('prime')
    expect(bestLink(none, []).adFree).toBe(false)
  })

  it('ignores the ad-free boost when Ad-free first is off', () => {
    const title = ranked({ connectedIds: ['prime', 'netflix'], adFreeIds: ['netflix'], preferAdFree: false })
    const pick = bestLink(title, ['prime', 'netflix'], { adFreeIds: ['netflix'], preferAdFree: false })
    expect(pick.link?.platformId).toBe('prime')
    expect(pick.adFree).toBe(false)
  })

  it('does not send the user to an ad-free service they do not have', () => {
    const title = ranked({ connectedIds: ['prime'] })
    expect(bestLink(title, ['prime']).link?.platformId).toBe('prime')
  })

  it('uses JustWatch only when there is no official link', () => {
    const title: RankedMovie = {
      ...jallikattu,
      score: 1,
      reasons: [],
      watchLinks: watchLinks(jallikattu).filter((w) => w.platformId === 'justwatch'),
    }
    expect(bestLink(title, []).link?.platformId).toBe('justwatch')
  })
})
