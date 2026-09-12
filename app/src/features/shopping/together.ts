import { basketListText, COMBINED_QUERY_MAX, togetherQuery } from './baskets'
import type { RankedShopPick } from './recommend'
import { officialShopUrl, sourceName, type ShopSourceId } from './sources'

export const TOGETHER_APPS: ShopSourceId[] = ['zepto', 'blinkit', 'instamart', 'flipkart', 'meesho', 'amazon']

export type CombinedAppSearch = {
  source: ShopSourceId
  sourceName: string
  query: string
  officialUrl: string
}

export type TogetherSearch = {
  pickId: string
  title: string
  query: string
  source: ShopSourceId
  sourceName: string
  officialUrl: string
  price: number
  deliveryTime: string
}

export function searchesForApp(picks: RankedShopPick[], source: ShopSourceId): TogetherSearch[] {
  return picks.map((pick) => {
    const known = [pick.chosen, ...pick.fallbacks].find((row) => row.source === source)
    return {
      pickId: pick.id,
      title: pick.title,
      query: pick.query,
      source,
      sourceName: sourceName(source),
      officialUrl: known?.officialUrl ?? officialShopUrl(source, pick.query),
      price: known?.price ?? pick.chosen.price,
      deliveryTime: known?.deliveryTime ?? pick.chosen.deliveryTime,
    }
  })
}

export function allSearchesTogether(picks: RankedShopPick[]): TogetherSearch[] {
  return picks.flatMap((pick) => [pick.chosen, ...pick.fallbacks].map((offer) => ({
    pickId: pick.id,
    title: pick.title,
    query: pick.query,
    source: offer.source,
    sourceName: offer.sourceName,
    officialUrl: offer.officialUrl,
    price: offer.price,
    deliveryTime: offer.deliveryTime,
  })))
}

export function combinedSearches(titles: string[], apps: ShopSourceId[] = TOGETHER_APPS): CombinedAppSearch[] {
  const query = togetherQuery(titles)
  return apps.map((source) => ({
    source,
    sourceName: sourceName(source),
    query,
    officialUrl: officialShopUrl(source, query, COMBINED_QUERY_MAX),
  }))
}

export function selectedTogetherList(rows: TogetherSearch[], selectedIds: string[]) {
  const picked = rows.filter((row) => selectedIds.includes(row.pickId))
  const titles = picked.map((row) => row.title)
  const apps = combinedSearches(titles)
  return {
    rows: picked,
    titles,
    listText: basketListText(titles),
    combinedQuery: togetherQuery(titles),
    apps,
    firstUrl: apps[0]?.officialUrl ?? '',
    sourceName: apps[0]?.sourceName ?? '',
  }
}

export function togetherHasPii(rows: TogetherSearch[], extra = '') {
  const blob = `${rows.map((row) => `${row.title} ${row.query}`).join('\n')}\n${extra}`
  return /\bPIN\b|\ballerg|@|childId|medical/i.test(blob)
}
