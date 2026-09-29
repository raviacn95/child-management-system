import { COMBINED_QUERY_MAX, togetherQuery } from '../shopping/baskets'
import { officialShopUrl, SHOP_SOURCE_IDS, sourceName, type ShopSourceId } from '../shopping/sources'

const KEY = 'willow-last-basket-v1'
const MAX_TITLES = 30
const MAX_TITLE_LEN = 60
const PII_RE = /\bPIN\b|\ballerg|@|childId|medical/i

export type LastBasket = { titles: string[]; source: ShopSourceId; at: string }

function cleanTitles(titles: unknown): string[] {
  if (!Array.isArray(titles)) return []
  return titles
    .map((title) => String(title ?? '').replace(/[<>]/g, '').trim().slice(0, MAX_TITLE_LEN))
    .filter(Boolean)
    .slice(0, MAX_TITLES)
}

function isSource(value: unknown): value is ShopSourceId {
  return typeof value === 'string' && (SHOP_SOURCE_IDS as readonly string[]).includes(value)
}

export function saveLastBasket(titles: string[], source: ShopSourceId, now = new Date()) {
  const clean = cleanTitles(titles)
  if (!clean.length || PII_RE.test(clean.join(' '))) return null
  const basket: LastBasket = { titles: clean, source, at: now.toISOString() }
  try {
    localStorage.setItem(KEY, JSON.stringify(basket))
  } catch {
    /* private mode */
  }
  return basket
}

export function readLastBasket(): LastBasket | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<LastBasket> | null
    if (!parsed || !isSource(parsed.source)) return null
    const titles = cleanTitles(parsed.titles)
    if (!titles.length || PII_RE.test(titles.join(' '))) return null
    return { titles, source: parsed.source, at: String(parsed.at ?? '') }
  } catch {
    return null
  }
}

export function repeatBasketUrl(basket: LastBasket) {
  return officialShopUrl(basket.source, togetherQuery(basket.titles), COMBINED_QUERY_MAX)
}

export function lastBasketLabel(basket: LastBasket, now = new Date()) {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(basket.at).getTime()) / 86_400_000))
  const when = Number.isFinite(days) ? (days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`) : 'recently'
  return `${basket.titles.length} items in ${sourceName(basket.source)} · ${when}`
}
