import catalog from '../data/qc-catalog.json'
import type { Child, PayMethod, ShopNeed } from '../types'
import type {
  QcAppId,
  QcDecision,
  QcLinePick,
  QcOffer,
  QcOrder,
  QcQuote,
  QcWebhookEvent,
} from '../types'

type CatalogFile = typeof catalog
type Product = CatalogFile['products'][number]
type AppId = CatalogFile['apps'][number]['id']

const API =
  (import.meta.env.VITE_QC_API as string | undefined)?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? '/qc-api' : '')

export const QC_APPS = catalog.apps

export function pinPrefix(pin: string) {
  return (pin || '').replace(/\D/g, '').slice(0, 2)
}

export function allergenHits(product: Product, allergies: string[]) {
  const needles = allergies.map((a) => a.toLowerCase())
  return product.allergens.filter((a) => needles.some((n) => a.includes(n) || n.includes(a)))
}

function offerFor(product: Product, app: QcAppId, pin: string): QcOffer | null {
  const slot = product.apps[app as keyof typeof product.apps]
  if (!slot) return null
  const prefix = pinPrefix(pin)
  if (prefix && !product.pins.some((p) => prefix.startsWith(p) || p.startsWith(prefix))) return null
  if (slot.stock < 1) return null
  return {
    app,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    price: slot.price,
    mrp: product.mrp,
    etaMin: slot.etaMin,
    stock: slot.stock,
    codOk: product.codOk,
    veg: product.veg,
    allergens: product.allergens,
  }
}

export function searchCatalog(query: string, pin: string, allergies: string[]): QcOffer[] {
  const q = query.toLowerCase()
  const out: QcOffer[] = []
  for (const product of catalog.products) {
    if (allergenHits(product, allergies).length) continue
    const hay = `${product.name} ${product.brand} ${product.sku} ${product.needIds.join(' ')}`.toLowerCase()
    if (q && !hay.includes(q) && !product.needIds.some((id) => q.includes(id))) continue
    for (const app of catalog.apps) {
      const offer = offerFor(product, app.id as QcAppId, pin)
      if (offer) out.push(offer)
    }
  }
  return out
}

export function mapNeedsToSkus(needs: ShopNeed[], child: Child) {
  const mapped: { needId: string; label: string; skus: string[] }[] = []
  const seen = new Set<string>()
  for (const need of needs) {
    const row = catalog.needMap[need.id as keyof typeof catalog.needMap]
    if (!row) continue
    const skus = row.skus.filter((sku) => {
      const product = catalog.products.find((p) => p.sku === sku)
      if (!product) return false
      if (allergenHits(product, child.allergies.map((a) => a.name)).length) return false
      if ((child.dietType?.toLowerCase().includes('veg') || child.foodPreferences.toLowerCase().includes('vegetarian')) && !product.veg)
        return false
      return true
    })
    mapped.push({ needId: need.id, label: need.label, skus })
    skus.forEach((s) => seen.add(s))
  }
  return { mapped, allSkus: [...seen] }
}

function scoreOffer(offer: QcOffer, preferCod: boolean): number {
  let score = 100 - offer.etaMin * 1.4 - offer.price / 25
  if (preferCod && offer.codOk) score += 10
  if (!preferCod && offer.codOk) score += 2
  if (offer.stock > 10) score += 4
  return Math.round(score * 10) / 10
}

export function quoteNeeds(child: Child, needs: ShopNeed[], pin: string, preferCod: boolean): QcQuote {
  const allergies = child.allergies.map((a) => a.name)
  const { mapped } = mapNeedsToSkus(needs, child)
  const picks: QcLinePick[] = []
  const comparison: QcOffer[] = []

  for (const row of mapped) {
    const offers: QcOffer[] = []
    for (const sku of row.skus) {
      const product = catalog.products.find((p) => p.sku === sku)
      if (!product) continue
      for (const app of catalog.apps) {
        const offer = offerFor(product, app.id as QcAppId, pin)
        if (offer) {
          offers.push(offer)
          comparison.push(offer)
        }
      }
    }
    if (!offers.length) continue
    offers.sort((a, b) => scoreOffer(b, preferCod) - scoreOffer(a, preferCod))
    const best = offers[0]
    picks.push({
      needId: row.needId,
      label: row.label,
      chosen: best,
      runners: offers.slice(1, 3),
      score: scoreOffer(best, preferCod),
      reason: preferCod && best.codOk
        ? `Fastest allergy-safe COD on ${appName(best.app)}`
        : `Best ETA × price on ${appName(best.app)}`,
    })
  }

  const appVotes = new Map<QcAppId, { score: number; eta: number; total: number }>()
  for (const pick of picks) {
    const cur = appVotes.get(pick.chosen.app) ?? { score: 0, eta: 0, total: 0 }
    cur.score += pick.score
    cur.eta = Math.max(cur.eta, pick.chosen.etaMin)
    cur.total += pick.chosen.price
    appVotes.set(pick.chosen.app, cur)
  }

  let winner: QcAppId = 'blinkit'
  let winnerScore = -Infinity
  for (const [app, v] of appVotes) {
    const s = v.score - v.eta * 0.5
    if (s > winnerScore) {
      winnerScore = s
      winner = app
    }
  }

  const unified = picks.map((p) => {
    const sameApp = [p.chosen, ...p.runners].find((o) => o.app === winner)
    if (sameApp) {
      return { ...p, chosen: sameApp, score: scoreOffer(sameApp, preferCod), reason: `Consolidated on ${appName(winner)}` }
    }
    return p
  })

  const subtotal = unified.reduce((n, p) => n + p.chosen.price, 0)
  const etaMin = unified.reduce((n, p) => Math.max(n, p.chosen.etaMin), 0)
  const allCod = unified.every((p) => p.chosen.codOk)

  const decision: QcDecision = {
    app: winner,
    appName: appName(winner),
    etaMin,
    subtotal,
    allCod,
    why: `${appName(winner)} won on ETA, PIN ${pin || '—'}, and ${preferCod ? 'COD' : 'UPI'} fit. Allergy-blocked SKUs were dropped before scoring.`,
  }

  return { picks: unified, comparison, decision, mode: 'sandbox' }
}

export function appName(id: string) {
  return catalog.apps.find((a) => a.id === id)?.name ?? id
}

export function partnerShopUrl(app: QcAppId, query: string) {
  const q = encodeURIComponent(query)
  if (app === 'zepto') return `https://www.zeptonow.com/search?query=${q}`
  if (app === 'blinkit') return `https://blinkit.com/s/?q=${q}`
  return `https://www.swiggy.com/instamart/search?query=${q}`
}

function newId() {
  return `QC-${Math.floor(2400 + Math.random() * 700)}`
}

export function buildOrder(input: {
  childId: string
  userId: string
  quote: QcQuote
  payment: PayMethod
  pincode: string
  address: string
}): QcOrder {
  const now = new Date().toISOString()
  const events: QcWebhookEvent[] = [
    {
      at: now,
      status: 'confirmed',
      note: `Sandbox only — ${input.quote.decision.appName} did not receive this cart. No rider will come.`,
    },
  ]
  return {
    id: newId(),
    childId: input.childId,
    userId: input.userId,
    app: input.quote.decision.app,
    appName: input.quote.decision.appName,
    status: 'confirmed',
    payment: input.payment,
    pincode: input.pincode,
    address: input.address,
    lines: input.quote.picks.map((p) => ({
      sku: p.chosen.sku,
      name: p.chosen.name,
      needId: p.needId,
      price: p.chosen.price,
      app: p.chosen.app,
    })),
    total: input.quote.decision.subtotal,
    etaMin: input.quote.decision.etaMin,
    placedAt: now,
    mode: 'sandbox',
    events,
  }
}

export const QC_PIPELINE: QcOrder['status'][] = ['confirmed', 'packed', 'rider', 'delivered']

export function nextWebhook(order: QcOrder): QcOrder {
  const i = QC_PIPELINE.indexOf(order.status)
  if (i < 0 || i >= QC_PIPELINE.length - 1) return order
  const status = QC_PIPELINE[i + 1]
  const note =
    status === 'packed'
      ? 'Sandbox: pretended the dark store packed the SKUs. Nothing was sent to Zepto / Blinkit / Instamart.'
      : status === 'rider'
        ? 'Sandbox: pretended a rider was assigned. No live location, no real rider.'
        : 'Sandbox: marked delivered in Willow only. The delivery app never saw this order.'
  return {
    ...order,
    status,
    events: [...order.events, { at: new Date().toISOString(), status, note }],
  }
}

export async function autoOrderRemote(payload: {
  child: Child
  needs: ShopNeed[]
  pincode: string
  payment: PayMethod
  address: string
  preferCod: boolean
}): Promise<{ quote: QcQuote; via: 'middleware' | 'local' }> {
  if (API) {
    try {
      const res = await fetch(`${API}/auto_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          needs: payload.needs,
          pinPrefix: pinPrefix(payload.pincode),
          payment: payload.payment,
          preferCod: payload.preferCod,
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as { quote: QcQuote }
        return { quote: { ...data.quote, mode: 'middleware' }, via: 'middleware' }
      }
    } catch {
      /* local sandbox */
    }
  }
  return { quote: quoteNeeds(payload.child, payload.needs, payload.pincode, payload.preferCod), via: 'local' }
}

export async function placeOrderRemote(order: QcOrder): Promise<QcOrder> {
  if (API) {
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          status: order.status,
          lines: order.lines.map((line) => ({ sku: line.sku })),
          payment: order.payment,
        }),
      })
      if (res.ok) return (await res.json()) as QcOrder
    } catch {
      /* local */
    }
  }
  return order
}
