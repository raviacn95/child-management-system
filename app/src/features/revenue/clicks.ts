import type { AffiliateIds } from '../shopping/affiliate'
import { SHOP_SOURCE_IDS, type ShopSourceId } from '../shopping/sources'

const KEY = 'willow-shop-clicks-v1'

export type ShopClicks = Partial<Record<ShopSourceId, number>>

function isSource(value: string): value is ShopSourceId {
  return (SHOP_SOURCE_IDS as readonly string[]).includes(value)
}

export function readShopClicks(): ShopClicks {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([source, count]) => isSource(source) && Number(count) > 0)
        .map(([source, count]) => [source, Math.floor(Number(count))]),
    ) as ShopClicks
  } catch {
    return {}
  }
}

export function recordShopClick(source: string) {
  if (!isSource(source)) return readShopClicks()
  const current = readShopClicks()
  const next: ShopClicks = { ...current, [source]: (current[source] ?? 0) + 1 }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
  return next
}

export function resetShopClicks() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* private mode */
  }
}

export function sourceEarns(source: ShopSourceId, ids: AffiliateIds) {
  if (source === 'flipkart') return Boolean(ids.flipkartAffid)
  if (source === 'amazon' || source === 'amazonfresh') return Boolean(ids.amazonTag)
  if (source === 'meesho') return Boolean(ids.meeshoId || ids.cuelinksPubId || ids.admitadCode)
  if (source === 'myntra' || source === 'nykaa') return Boolean(ids.cuelinksPubId || ids.admitadCode)
  return false
}

export function hasAffiliateProgram(source: ShopSourceId) {
  return ['flipkart', 'amazon', 'amazonfresh', 'meesho', 'myntra', 'nykaa'].includes(source)
}

export type ClickRow = { source: ShopSourceId; clicks: number; earning: boolean; program: boolean }

export function clickReport(clicks: ShopClicks, ids: AffiliateIds): ClickRow[] {
  return (Object.entries(clicks) as [ShopSourceId, number][])
    .map(([source, count]) => ({
      source,
      clicks: count,
      earning: sourceEarns(source, ids),
      program: hasAffiliateProgram(source),
    }))
    .sort((a, b) => b.clicks - a.clicks)
}

export function missedClicks(rows: ClickRow[]) {
  return rows.filter((row) => row.program && !row.earning).reduce((sum, row) => sum + row.clicks, 0)
}
