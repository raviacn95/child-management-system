import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { clothingNeeds, sizeForChild } from '../../data/catalog'
import { ageMonths, clothingSize } from '../../lib'
import { useStore } from '../../store'
import { useTheme } from '../../theme/ThemeProvider'
import { useWatchDesk } from '../ott/WatchPane'
import { copyBasketList, matchingMartIds, offerPartnerCart, packRequiredBaskets, tripHasPii, type ShopBasket } from './baskets'
import { isOfficialShopUrl } from './sources'
import { launchOfficialShop } from './launch'
import { shopInputFromChild } from './privacy'
import { hubShoppingTitle, recommendShopping, type RankedShopPick } from './recommend'
import { recordShopBlocked, recordShopCheck } from './telemetry'

function pinPrefixSafe(pin: string) {
  return pin.replace(/\D/g, '').slice(0, 2)
}

export function ShoppingEssentialsShelf({ childId }: { childId?: string }) {
  const { state, addToCart } = useStore()
  const { look } = useTheme()
  const watch = useWatchDesk()
  const [openId, setOpenId] = useState<string | null>(null)
  const [overCap, setOverCap] = useState(false)
  const [baskets, setBaskets] = useState<ShopBasket[]>([])
  const [basketAt, setBasketAt] = useState(0)
  const [copied, setCopied] = useState(false)
  const [partnerNote, setPartnerNote] = useState('')
  const user = state.users.find((u) => u.id === state.currentUserId)
  const kids = state.children.filter((c) => {
    if (c.status !== 'enrolled') return false
    if (user?.role === 'parent') return user.childIds.includes(c.id)
    return c.siteId === state.currentSiteId
  })
  const child = kids.find((c) => c.id === childId) ?? kids[0]
  const picks = useMemo(() => {
    if (!child) return []
    const input = shopInputFromChild(child, {
      ageMonths: ageMonths(child.dob),
      sizeBand: clothingSize(child.dob),
      needTags: clothingNeeds(child).flatMap((n) => n.tags),
      pinPrefix: pinPrefixSafe(state.shopPincode),
      preferCodCap: !overCap,
    })
    return recommendShopping(input, { includeOverCap: overCap, limit: 8 })
  }, [child, overCap, state.shopPincode])

  useEffect(() => {
    recordShopCheck(picks.length > 0)
  }, [picks.length])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function launchBasket(basket: ShopBasket) {
    if (!isOfficialShopUrl(basket.officialUrl) || tripHasPii([basket])) {
      recordShopBlocked()
      return
    }
    const partner = await offerPartnerCart(basket)
    setPartnerNote(
      partner.status === 'partner'
        ? `${basket.sourceName} accepted the required list. Confirm Add in that official app.`
        : `List copied. Confirm Add on ${basket.sourceName} — Willow cannot write into another company’s cart.`,
    )
    await copyBasketList(basket.listText)
    setCopied(true)
    const screen = `${window.location.pathname}${window.location.search}`
    const title = `${basket.lines.length} required items`
    if (watch) watch.openOfficialNow({ url: basket.officialUrl, title, platformName: basket.sourceName })
    else launchOfficialShop({ url: basket.officialUrl, title, sourceName: basket.sourceName, screen })
  }

  function addMartMatches() {
    if (!child) return
    const ids = matchingMartIds(picks.map((pick) => pick.title))
    for (const id of ids) {
      const item = (state.shopCatalog ?? []).find((row) => row.id === id)
      if (!item) continue
      addToCart(id, child.id, sizeForChild(item, child), 1)
    }
  }

  async function addAllRequired() {
    const packed = packRequiredBaskets(picks)
    if (!packed.length || tripHasPii(packed)) {
      recordShopBlocked()
      return
    }
    setBaskets(packed)
    setBasketAt(0)
    addMartMatches()
    await launchBasket(packed[0])
  }

  function openSource(pick: RankedShopPick, url: string, sourceName: string) {
    if (!isOfficialShopUrl(url)) {
      recordShopBlocked()
      return
    }
    const screen = `${window.location.pathname}${window.location.search}`
    if (watch) {
      watch.openOfficialNow({ url, title: pick.title, platformName: sourceName })
      return
    }
    launchOfficialShop({ url, title: pick.title, sourceName, screen })
  }

  if (!child) return null

  return (
    <section className="mb-8" data-testid="shopping-essentials">
      <div className="mb-3">
        <h2 className="font-display text-2xl font-semibold">{hubShoppingTitle(look)}</h2>
        <p className="mt-1 text-sm text-muted">
          One tap packs required items onto official affiliate deep links (Flipkart, Amazon, Meesho, Myntra, Nykaa, and
          10-minute apps). Checkout stays on those sites. Save your tracking IDs in Settings. Child names stay here.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" data-testid="shop-add-all" disabled={!picks.length} onClick={() => void addAllRequired()}>
            Add all required
          </Button>
        </div>
        {baskets.length ? (
          <div className="shop-handoff" data-testid="shop-handoff">
            <p className="text-sm font-semibold">
              Packed into {baskets.length} official app{baskets.length === 1 ? '' : 's'}
            </p>
            <p className="mt-1 text-xs text-muted">{partnerNote || 'Confirm Add in each official app.'}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {baskets.map((basket, index) => (
                <li key={basket.source} data-testid="shop-handoff-basket">
                  <span className="font-semibold">{basket.sourceName}</span>
                  {' · '}
                  {basket.lines.length} items
                  {index === basketAt ? ' · open now' : ''}
                  <p className="whitespace-pre-line text-xs text-muted">{basket.listText}</p>
                </li>
              ))}
            </ul>
            {copied ? <p className="mt-2 text-xs text-muted">Required list copied — paste into that app’s search if it asks.</p> : null}
            {baskets[basketAt + 1] ? (
              <Button
                type="button"
                className="mt-3"
                data-testid="shop-handoff-next"
                onClick={() => {
                  const next = basketAt + 1
                  setBasketAt(next)
                  void launchBasket(baskets[next])
                }}
              >
                Open next app · {baskets[basketAt + 1].sourceName}
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${!overCap ? 'bg-pine text-[var(--color-pine-ink)]' : 'border border-line'}`}
            data-testid="shop-cod-cap"
            onClick={() => setOverCap(false)}
          >
            COD ≤ ₹200
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${overCap ? 'bg-pine text-[var(--color-pine-ink)]' : 'border border-line'}`}
            data-testid="shop-pay-in-app"
            onClick={() => setOverCap(true)}
          >
            Pay in app
          </button>
        </div>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {picks.map((pick) => {
          const open = openId === pick.id
          const sources = [pick.chosen, ...pick.fallbacks]
          return (
            <li key={pick.id} className="card p-4" data-testid="shop-pick-card">
              {open ? (
                <div data-testid="shop-pick-detail">
                  <Button
                    type="button"
                    variant="ghost"
                    className="movie-back mb-3"
                    data-testid="shop-pick-back"
                    onClick={() => setOpenId(null)}
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <h3 className="font-semibold">{pick.title}</h3>
                  <p className="mt-2 text-sm" data-testid="shop-pick-summary">
                    {pick.why}
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    className="movie-open w-full text-left"
                    data-testid="shop-pick-open"
                    aria-expanded={false}
                    aria-label={`Open ${pick.title}`}
                    onClick={() => setOpenId(pick.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{pick.title}</h3>
                        <p className="text-xs text-muted">
                          {pick.brand} · {pick.ageRange} · {pick.chosen.deliveryTime}
                        </p>
                      </div>
                      <Badge tone={pick.chosen.codAvailable && pick.chosen.price <= 200 ? 'gold' : 'sand'}>
                        {pick.chosen.codAvailable && pick.chosen.price <= 200 ? 'COD ≤ ₹200' : 'Pay in app'}
                      </Badge>
                    </div>
                  </button>
                  <p className="mt-2 text-sm font-semibold">
                    ₹{pick.chosen.price} · {pick.chosen.discount} off
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5" data-testid="shop-pick-sources">
                    {sources.map((offer) => (
                      <button
                        key={`${pick.id}-${offer.source}`}
                        type="button"
                        className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-pine hover:border-pine"
                        onClick={() => openSource(pick, offer.officialUrl, offer.sourceName)}
                      >
                        {offer.sourceName}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="mt-3"
                    data-testid="shop-add-for-child"
                    onClick={() => openSource(pick, pick.chosen.officialUrl, pick.chosen.sourceName)}
                  >
                    Add for {child.firstName}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
