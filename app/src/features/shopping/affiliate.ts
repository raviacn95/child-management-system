import type { ShopSourceId } from './sources'

export const AFFILIATE_KEY = 'willow-affiliate-ids-v1'

export type AffiliateIds = {
  flipkartAffid: string
  amazonTag: string
  meeshoId: string
  cuelinksPubId: string
  admitadCode: string
}

export const EMPTY_AFFILIATE_IDS: AffiliateIds = {
  flipkartAffid: '',
  amazonTag: '',
  meeshoId: '',
  cuelinksPubId: '',
  admitadCode: '',
}

const WRAPPER_HOSTS = new Set(['dl.flipkart.com', 'linksredirect.com', 'ad.admitad.com'])

export function sanitizeAffiliateId(raw: string, kind: 'id' | 'tag' = 'id') {
  const value = String(raw ?? '').trim()
  if (!value || /@|https?:\/\/|child|allerg|medical|pin\b/i.test(value)) return ''
  if (kind === 'tag') return value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
}

function fromEnv(): AffiliateIds {
  return {
    flipkartAffid: sanitizeAffiliateId(String(import.meta.env.VITE_FLIPKART_AFFILIATE_ID ?? '')),
    amazonTag: sanitizeAffiliateId(String(import.meta.env.VITE_AMAZON_ASSOCIATE_TAG ?? ''), 'tag'),
    meeshoId: sanitizeAffiliateId(String(import.meta.env.VITE_MEESHO_AFFILIATE_ID ?? '')),
    cuelinksPubId: sanitizeAffiliateId(String(import.meta.env.VITE_CUELINKS_PUB_ID ?? '')),
    admitadCode: sanitizeAffiliateId(String(import.meta.env.VITE_ADMITAD_CODE ?? '')),
  }
}

export function readAffiliateIds(): AffiliateIds {
  const envIds = fromEnv()
  try {
    const raw = localStorage.getItem(AFFILIATE_KEY)
    if (!raw) return envIds
    const saved = JSON.parse(raw) as Partial<AffiliateIds>
    return {
      flipkartAffid: sanitizeAffiliateId(saved.flipkartAffid || envIds.flipkartAffid),
      amazonTag: sanitizeAffiliateId(saved.amazonTag || envIds.amazonTag, 'tag'),
      meeshoId: sanitizeAffiliateId(saved.meeshoId || envIds.meeshoId),
      cuelinksPubId: sanitizeAffiliateId(saved.cuelinksPubId || envIds.cuelinksPubId),
      admitadCode: sanitizeAffiliateId(saved.admitadCode || envIds.admitadCode),
    }
  } catch {
    return envIds
  }
}

export function writeAffiliateIds(next: AffiliateIds) {
  const clean: AffiliateIds = {
    flipkartAffid: sanitizeAffiliateId(next.flipkartAffid),
    amazonTag: sanitizeAffiliateId(next.amazonTag, 'tag'),
    meeshoId: sanitizeAffiliateId(next.meeshoId),
    cuelinksPubId: sanitizeAffiliateId(next.cuelinksPubId),
    admitadCode: sanitizeAffiliateId(next.admitadCode),
  }
  try {
    localStorage.setItem(AFFILIATE_KEY, JSON.stringify(clean))
  } catch {
    /* private mode */
  }
  return clean
}

export function affiliateReady(ids: AffiliateIds = readAffiliateIds()) {
  return Boolean(ids.flipkartAffid || ids.amazonTag || ids.meeshoId || ids.cuelinksPubId || ids.admitadCode)
}

function wrapCuelinks(dest: string, pubId: string) {
  return `https://linksredirect.com/?pub_id=${encodeURIComponent(pubId)}&source=linkkit&url=${encodeURIComponent(dest)}`
}

function wrapAdmitad(dest: string, code: string) {
  return `https://ad.admitad.com/g/${encodeURIComponent(code)}/?ulp=${encodeURIComponent(dest)}&subid=willow`
}

export function applyAffiliate(source: ShopSourceId, href: string, ids: AffiliateIds = readAffiliateIds()) {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return href
  }
  if (url.protocol !== 'https:') return href

  if (source === 'flipkart' && ids.flipkartAffid) {
    url.searchParams.set('affid', ids.flipkartAffid)
    url.searchParams.set('affExtParam1', 'willow')
    return url.href
  }
  if ((source === 'amazon' || source === 'amazonfresh') && ids.amazonTag) {
    url.searchParams.set('tag', ids.amazonTag)
    return url.href
  }
  if (source === 'meesho' && ids.meeshoId) {
    url.searchParams.set('utm_source', 'willow')
    url.searchParams.set('aff_id', ids.meeshoId)
  }
  const dest = url.href
  if ((source === 'meesho' || source === 'myntra' || source === 'nykaa') && ids.cuelinksPubId) {
    return wrapCuelinks(dest, ids.cuelinksPubId)
  }
  if ((source === 'myntra' || source === 'nykaa' || source === 'meesho') && ids.admitadCode) {
    return wrapAdmitad(dest, ids.admitadCode)
  }
  return dest
}

export function isAffiliateWrapper(href: string) {
  try {
    return WRAPPER_HOSTS.has(new URL(href).hostname)
  } catch {
    return false
  }
}

export function affiliateDestination(href: string, depth = 0): string {
  if (depth > 2) return href
  try {
    const url = new URL(href)
    if (!WRAPPER_HOSTS.has(url.hostname)) return href
    const dest = url.searchParams.get('url') || url.searchParams.get('ulp')
    if (!dest) return href
    return affiliateDestination(dest, depth + 1)
  } catch {
    return href
  }
}

