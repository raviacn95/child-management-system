import catalogJson from './essentials.json'
import { shopCatalogSchema, type ShopCatalogItem } from './schema'
import { officialShopUrl, sourceName, type ShopSourceId } from './sources'
import type { PublicShopInput } from './privacy'

export const COD_PARENT_CAP = 200

export type RankedShopPick = {
  id: string
  title: string
  brand: string
  category: ShopCatalogItem['category']
  ageRange: string
  why: string
  rating: number
  query: string
  chosen: {
    source: ShopSourceId
    sourceName: string
    price: number
    mrp: number
    discount: string
    codAvailable: boolean
    deliveryTime: string
    etaMin: number
    stock: number
    officialUrl: string
    affiliateLink: string
  }
  fallbacks: RankedShopPick['chosen'][]
  score: number
  reason: string
}

const catalog = shopCatalogSchema.parse(catalogJson)

export function shoppingCatalog() {
  return catalog
}

export function seasonTags(now = new Date()) {
  const month = now.getMonth()
  const tags: string[] = []
  if (month >= 5 && month <= 8) tags.push('monsoon', 'rain')
  if (month === 5 || month === 6) tags.push('school')
  if (month === 9 || month === 10) tags.push('festival')
  return tags
}

function discountLabel(price: number, mrp: number) {
  if (mrp <= price) return '0%'
  return `${Math.round(((mrp - price) / mrp) * 100)}%`
}

function deliveryTime(etaMin: number) {
  if (etaMin <= 15) return '10 min'
  if (etaMin <= 30) return '20 min'
  if (etaMin < 1440) return `${Math.round(etaMin / 60)} hr`
  return `${Math.round(etaMin / 1440)} day`
}

function hydrateOffer(item: ShopCatalogItem, source: ShopSourceId, row: ShopCatalogItem['offers'][number]) {
  return {
    source,
    sourceName: sourceName(source),
    price: row.price,
    mrp: row.mrp,
    discount: discountLabel(row.price, row.mrp),
    codAvailable: row.codOk,
    deliveryTime: deliveryTime(row.etaMin),
    etaMin: row.etaMin,
    stock: row.stock,
    officialUrl: officialShopUrl(source, item.query),
    affiliateLink: officialShopUrl(source, item.query),
  }
}

function scoreOffer(row: ShopCatalogItem['offers'][number], item: ShopCatalogItem, input: PublicShopInput, seasonal: string[]) {
  let score = 40 + item.rating * 6 - row.etaMin * 0.04 - row.price / 40
  if (input.preferCodCap && row.codOk && row.price <= COD_PARENT_CAP) score += 18
  if (row.etaMin <= 15) score += 10
  if (row.stock > 10) score += 3
  if (input.veg && item.veg) score += 2
  score += item.tags.reduce((n, tag) => n + (input.needTags.includes(tag) ? 3 : 0) + (seasonal.includes(tag) ? 4 : 0), 0)
  return Math.round(score * 10) / 10
}

function allergenHit(item: ShopCatalogItem, allergies: string[]) {
  return item.allergens.some((a) => allergies.some((n) => a.includes(n) || n.includes(a)))
}

export function recommendShopping(input: PublicShopInput, opts?: { includeOverCap?: boolean; limit?: number }): RankedShopPick[] {
  const seasonal = seasonTags(input.now)
  const includeOverCap = Boolean(opts?.includeOverCap)
  const limit = opts?.limit ?? 8
  const picks: RankedShopPick[] = []

  for (const item of catalog.items) {
    if (input.ageMonths < item.ageMinMonths || input.ageMonths > item.ageMaxMonths) continue
    if (allergenHit(item, input.allergyNames)) continue
    if (input.veg && !item.veg) continue
    const inStock = item.offers.filter((o) => o.stock > 0)
    if (!inStock.length) continue
    const eligible = input.preferCodCap && !includeOverCap
      ? inStock.filter((o) => o.codOk && o.price <= COD_PARENT_CAP)
      : inStock
    const pool = eligible.length ? eligible : includeOverCap || !input.preferCodCap ? inStock : []
    if (!pool.length) continue
    const rankedOffers = [...pool].sort((a, b) => scoreOffer(b, item, input, seasonal) - scoreOffer(a, item, input, seasonal))
    const best = rankedOffers[0]
    const chosen = hydrateOffer(item, best.source, best)
    const fallbacks = rankedOffers.slice(1, 3).map((row) => hydrateOffer(item, row.source, row))
    picks.push({
      id: item.id,
      title: item.title,
      brand: item.brand,
      category: item.category,
      ageRange: item.ageRange,
      why: item.why,
      rating: item.rating,
      query: item.query,
      chosen,
      fallbacks,
      score: scoreOffer(best, item, input, seasonal),
      reason: (() => {
        const missed = item.offers.find((o) => o.stock < 1 && o.etaMin < best.etaMin)
        if (missed) return `Fallback after ${sourceName(missed.source)} was out`
        if (best.etaMin <= 15) return `Fastest in-stock option on ${sourceName(best.source)}`
        return `Best official ${sourceName(best.source)} option`
      })(),
    })
  }

  return picks.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function hubShoppingTitle(look: string) {
  return look === 'arcade' ? 'Shopping Essentials' : 'Kids’ essentials'
}
