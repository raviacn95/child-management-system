import { officialShopUrl, sourceName, SHOP_SOURCES, type ShopSourceId } from './sources'
import type { RankedShopPick } from './recommend'

export type BasketLine = {
  id: string
  title: string
  query: string
  officialUrl: string
}

export type ShopBasket = {
  source: ShopSourceId
  sourceName: string
  officialUrl: string
  lines: BasketLine[]
  listText: string
}

function coverSources(pick: RankedShopPick): ShopSourceId[] {
  return [pick.chosen.source, ...pick.fallbacks.map((row) => row.source)]
}

function offerUrl(pick: RankedShopPick, source: ShopSourceId) {
  const match = [pick.chosen, ...pick.fallbacks].find((row) => row.source === source)
  return match?.officialUrl ?? officialShopUrl(source, pick.query)
}

export function basketListText(titles: string[]) {
  return titles
    .map((title) => title.replace(/[<>]/g, '').slice(0, 80))
    .filter(Boolean)
    .join('\n')
}

export function packRequiredBaskets(picks: RankedShopPick[]): ShopBasket[] {
  const remaining = new Set(picks.map((pick) => pick.id))
  const baskets: ShopBasket[] = []

  while (remaining.size) {
    const scores = new Map<ShopSourceId, number>()
    for (const pick of picks) {
      if (!remaining.has(pick.id)) continue
      for (const source of coverSources(pick)) {
        const kindBonus = SHOP_SOURCES[source].kind === 'quick' ? 8 : 0
        scores.set(source, (scores.get(source) ?? 0) + 10 + kindBonus)
      }
    }
    let winner: ShopSourceId | null = null
    let best = -1
    for (const [source, score] of scores) {
      if (score > best) {
        best = score
        winner = source
      }
    }
    if (!winner) break
    const lines: BasketLine[] = []
    for (const pick of picks) {
      if (!remaining.has(pick.id)) continue
      if (!coverSources(pick).includes(winner)) continue
      remaining.delete(pick.id)
      lines.push({
        id: pick.id,
        title: pick.title,
        query: pick.query,
        officialUrl: offerUrl(pick, winner),
      })
    }
    if (!lines.length) break
    baskets.push({
      source: winner,
      sourceName: sourceName(winner),
      officialUrl: lines[0].officialUrl,
      lines,
      listText: basketListText(lines.map((line) => line.title)),
    })
  }

  return baskets
}

export function tripHasPii(baskets: ShopBasket[]) {
  const blob = baskets.map((b) => `${b.sourceName}\n${b.listText}\n${b.officialUrl}`).join('\n')
  return /PIN|allerg|@|childId|medical/i.test(blob)
}

export async function copyBasketList(text: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function offerPartnerCart(basket: ShopBasket, fetchImpl: typeof fetch = fetch) {
  const api = String(import.meta.env.VITE_SHOP_API || import.meta.env.VITE_QC_API || '').replace(/\/$/, '')
  if (!api) return { status: 'handoff' as const }
  try {
    const res = await fetchImpl(`${api}/carts`, {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: basket.source,
        queries: basket.lines.map((line) => line.query),
        titles: basket.lines.map((line) => line.title),
      }),
    })
    if (res.ok) return { status: 'partner' as const }
  } catch {
    /* official handoff */
  }
  return { status: 'handoff' as const }
}

export const MART_TITLE_MATCH: { test: RegExp; itemId: string }[] = [
  { test: /wipes/i, itemId: 'fc-wipes' },
  { test: /rash cream/i, itemId: 'fc-rash' },
  { test: /baby soap|gentle baby soap/i, itemId: 'fc-soap' },
  { test: /hair clips/i, itemId: 'fc-clip' },
  { test: /panchatantra/i, itemId: 'fc-panch' },
  { test: /poncho|rain jacket/i, itemId: 'fc-rain' },
  { test: /ragi|cereal/i, itemId: 'fc-cereal' },
  { test: /night suit/i, itemId: 'fc-night' },
  { test: /sipper/i, itemId: 'fc-sipper' },
  { test: /tiffin/i, itemId: 'fc-tiffin' },
]

export function matchingMartIds(titles: string[]) {
  const ids = new Set<string>()
  for (const title of titles) {
    for (const row of MART_TITLE_MATCH) {
      if (row.test.test(title)) ids.add(row.itemId)
    }
  }
  return [...ids]
}
