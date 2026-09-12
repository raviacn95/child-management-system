import { applyAffiliate, affiliateDestination, isAffiliateWrapper } from './affiliate'

export const SHOP_SOURCE_IDS = [
  'zepto',
  'blinkit',
  'instamart',
  'flipkart',
  'meesho',
  'amazon',
  'amazonfresh',
  'bigbasket',
  'myntra',
  'nykaa',
] as const

export type ShopSourceId = (typeof SHOP_SOURCE_IDS)[number]

export type ShopSourceKind = 'quick' | 'marketplace'

type SourceMeta = {
  id: ShopSourceId
  name: string
  kind: ShopSourceKind
  host: string
  search: (query: string) => string
}

export const SHOP_SOURCES: Record<ShopSourceId, SourceMeta> = {
  zepto: {
    id: 'zepto',
    name: 'Zepto',
    kind: 'quick',
    host: 'www.zeptonow.com',
    search: (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
  },
  blinkit: {
    id: 'blinkit',
    name: 'Blinkit',
    kind: 'quick',
    host: 'blinkit.com',
    search: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
  },
  instamart: {
    id: 'instamart',
    name: 'Swiggy Instamart',
    kind: 'quick',
    host: 'www.swiggy.com',
    search: (q) => `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(q)}`,
  },
  flipkart: {
    id: 'flipkart',
    name: 'Flipkart',
    kind: 'marketplace',
    host: 'www.flipkart.com',
    search: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
  },
  meesho: {
    id: 'meesho',
    name: 'Meesho',
    kind: 'marketplace',
    host: 'www.meesho.com',
    search: (q) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    kind: 'marketplace',
    host: 'www.amazon.in',
    search: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  },
  amazonfresh: {
    id: 'amazonfresh',
    name: 'Amazon Fresh',
    kind: 'marketplace',
    host: 'www.amazon.in',
    search: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  },
  myntra: {
    id: 'myntra',
    name: 'Myntra',
    kind: 'marketplace',
    host: 'www.myntra.com',
    search: (q) => `https://www.myntra.com/${encodeURIComponent(q.replace(/\s+/g, '-'))}`,
  },
  nykaa: {
    id: 'nykaa',
    name: 'Nykaa',
    kind: 'marketplace',
    host: 'www.nykaa.com',
    search: (q) => `https://www.nykaa.com/search/result/?q=${encodeURIComponent(q)}`,
  },
  bigbasket: {
    id: 'bigbasket',
    name: 'BigBasket',
    kind: 'marketplace',
    host: 'www.bigbasket.com',
    search: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
  },
}

const OFFICIAL_HOSTS = new Set(Object.values(SHOP_SOURCES).map((s) => s.host))

export function officialShopUrl(source: ShopSourceId, query: string, maxLen = 80) {
  const cap = Number.isFinite(maxLen) ? Math.min(Math.max(maxLen, 1), 400) : 80
  const q = String(query || '')
    .replace(/[<>]/g, '')
    .slice(0, cap)
  return applyAffiliate(source, SHOP_SOURCES[source].search(q))
}

export function isOfficialShopUrl(href: string) {
  try {
    const dest = isAffiliateWrapper(href) ? affiliateDestination(href) : href
    const u = new URL(dest)
    return u.protocol === 'https:' && (OFFICIAL_HOSTS.has(u.hostname) || u.hostname === 'dl.flipkart.com')
  } catch {
    return false
  }
}

export function sourceName(id: string) {
  return SHOP_SOURCES[id as ShopSourceId]?.name ?? id
}
