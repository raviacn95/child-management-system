import catalogJson from '../../data/top-picks.json'
import { platforms, watchUrl } from '../movies/catalog'
import type { LookId } from '../../theme/looks'
import { rankedTopPickSchema, topPicksCatalogSchema, type RankedTopPick } from './schema'

export const topPicksCatalog = topPicksCatalogSchema.parse(catalogJson)

function officialLinks(pick: (typeof topPicksCatalog.items)[number]) {
  const ids = [...pick.platformIds, 'justwatch']
  return [...new Set(ids)].map((id) => {
    const p = platforms.find((item) => item.id === id)
    return {
      platformId: id,
      platformName: p?.name ?? id,
      url: watchUrl(id, pick.title, pick.year, pick.originalLang),
    }
  })
}

function hydrate(): RankedTopPick[] {
  return topPicksCatalog.items.map((item) => rankedTopPickSchema.parse({ ...item, watchLinks: officialLinks(item) }))
}

export function hubRowTitle(look: LookId) {
  if (look === 'cinema') return 'Critics’ movies'
  if (look === 'arcade') return 'Family-night series'
  return 'Top picks'
}

export function recommendTopPicks(look: LookId = 'grove'): RankedTopPick[] {
  const items = hydrate()
  const movies = items.filter((item) => item.kind === 'movie')
  const series = items.filter((item) => item.kind === 'series')
  const family = series.filter((item) => item.familyFirst)
  const otherSeries = series.filter((item) => !item.familyFirst)
  if (look === 'cinema') return [...movies, ...series]
  if (look === 'arcade') return [...family, ...otherSeries, ...movies]
  return [...movies, ...series]
}

export function hasPii(pick: RankedTopPick) {
  return /PIN|allerg|@|childId|medical/i.test(
    `${pick.title} ${pick.summary} ${pick.whyToWatch} ${pick.rating} ${pick.sourceLink}`,
  )
}
