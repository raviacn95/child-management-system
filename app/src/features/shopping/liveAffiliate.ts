import { z } from 'zod'
import { publicShopInput, type PublicShopInput } from './privacy'
import { shopSourceIdSchema } from './schema'
import { isOfficialShopUrl } from './sources'

const liveItemSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(80),
  brand: z.string().max(40).optional(),
  price: z.number().nonnegative().max(20000),
  source: shopSourceIdSchema,
  affiliateLink: z.string().url().max(500),
  codAvailable: z.boolean().optional(),
  etaMin: z.number().int().nonnegative().max(10080).optional(),
  stock: z.number().int().nonnegative().max(9999).optional(),
})

const liveFeedSchema = z.object({
  items: z.array(liveItemSchema).max(24),
})

export type LiveAffiliateItem = z.infer<typeof liveItemSchema>

export function shopApiRoot() {
  return String(import.meta.env.VITE_SHOP_API || import.meta.env.VITE_QC_API || '').replace(/\/$/, '')
}

export async function fetchLiveAffiliate(
  query: string,
  input: PublicShopInput,
  opts?: { fetchImpl?: typeof fetch; api?: string },
) {
  const api = String(opts?.api ?? shopApiRoot()).replace(/\/$/, '')
  if (!api) return [] as LiveAffiliateItem[]
  const fetchImpl = opts?.fetchImpl ?? fetch
  const safe = publicShopInput(input)
  const q = String(query || '').replace(/[<>]/g, '').slice(0, 80)
  try {
    const res = await fetchImpl(`${api}/affiliate/search`, {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, ageMonths: safe.ageMonths, sizeBand: safe.sizeBand, veg: safe.veg }),
    })
    if (!res.ok) return []
    const parsed = liveFeedSchema.safeParse(await res.json())
    if (!parsed.success) return []
    return parsed.data.items.filter((item) => isOfficialShopUrl(item.affiliateLink))
  } catch {
    return []
  }
}
