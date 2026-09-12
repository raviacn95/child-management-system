import { Heart, MapPin, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  SHOP_CATS,
  clothingNeeds,
  codPicks,
  combosFor,
  fitsChild,
  pctOff,
  recommendedItems,
  sizeForChild,
} from '../data/catalog'
import { lookupPincode, packOf } from '../data/country'
import { AutoOrderPanel } from '../components/AutoOrder'
import { ShoppingEssentialsShelf } from '../features/shopping/ShoppingEssentialsShelf'
import { Avatar, Badge, Button, Field, inputClass } from '../components/ui'
import { ageYears, childName, clothingSize, money } from '../lib'
import { useStore } from '../store'
import type { PayMethod, ShopItem, ShopOrderStatus } from '../types'

const ORDER_TONE: Record<ShopOrderStatus, 'gold' | 'sky' | 'pine' | 'sand' | 'rose'> = {
  cart: 'sand',
  placed: 'gold',
  packed: 'sky',
  shipped: 'sky',
  delivered: 'pine',
  cancelled: 'rose',
}

export function Shop() {
  const {
    state,
    addToCart,
    setCartQty,
    placeShopOrder,
    setShopOrderStatus,
    setShopPincode,
    toggleWish,
  } = useStore()
  const pack = packOf(state.countryCode)
  const rupee = (n: number) => money(n, state.countryCode)
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const kids = state.children.filter((c) => {
    if (c.status !== 'enrolled') return false
    if (user.role === 'parent') return user.childIds.includes(c.id)
    return c.siteId === state.currentSiteId
  })
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const [filter, setFilter] = useState<(typeof SHOP_CATS)[number]['id']>('for-you')
  const [pinDraft, setPinDraft] = useState(state.shopPincode)
  const [pay, setPay] = useState<PayMethod>(pack.cod.enabled ? 'cod' : pack.defaultPay)
  const [address, setAddress] = useState(state.sites.find((s) => s.id === state.currentSiteId)?.address ?? '')
  const child = kids.find((c) => c.id === childId) ?? kids[0]
  const catalog = state.shopCatalog ?? []
  const cart = state.shopCart ?? []
  const orders = (state.shopOrders ?? []).filter((o) => user.role === 'director' || o.userId === user.id)
  const pinInfo = lookupPincode(pack, state.shopPincode)

  const needs = child ? clothingNeeds(child) : []
  const ranked = child ? recommendedItems(catalog, child) : []
  const items = useMemo(() => {
    if (!child) return catalog
    if (filter === 'for-you') return ranked.filter((r) => r.score > 0 || fitsChild(r.item, child)).slice(0, 16).map((r) => r.item)
    if (filter === 'cod') return catalog.filter((i) => i.codOk && fitsChild(i, child))
    if (filter === 'all') return catalog.filter((i) => fitsChild(i, child))
    return catalog.filter((i) => i.category === filter && fitsChild(i, child))
  }, [child, filter, ranked, catalog])

  const subtotal = cart.reduce((n, l) => {
    const item = catalog.find((i) => i.id === l.itemId)
    return n + (item?.price ?? 0) * l.qty
  }, 0)
  const gst = cart.reduce((n, l) => {
    const item = catalog.find((i) => i.id === l.itemId)
    return n + Math.round((item?.price ?? 0) * l.qty * (item?.gstRate ?? 0))
  }, 0)
  const allCod = cart.length > 0 && cart.every((l) => catalog.find((i) => i.id === l.itemId)?.codOk)
  const codWindow = subtotal >= pack.cod.min && subtotal <= pack.cod.max
  const recommendCod = pack.cod.enabled && allCod && codWindow && Boolean(pinInfo?.cod)
  const codFee =
    pay === 'cod' && pack.cod.enabled && subtotal < pack.cod.freeAbove && subtotal > 0
      ? pack.cod.fee * (pack.code === 'IN' ? 1 : pack.fxFromInr)
      : 0
  const total = subtotal + gst + Math.round(codFee)

  const firstCartItem = catalog.find((i) => i.id === cart[0]?.itemId)
  const together = firstCartItem ? combosFor(catalog, firstCartItem).slice(0, 3) : child ? ranked.slice(1, 4).map((r) => r.item) : []
  const picks = child ? codPicks(catalog, child) : []

  function addKit() {
    if (!child) return
    ranked.slice(0, 5).forEach(({ item }) => {
      if (item.stock < 1) return
      addToCart(item.id, child.id, sizeForChild(item, child), 1)
    })
  }

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#c81e5b] via-[#e11d48] to-[#ea580c] p-6 text-white">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-80">{pack.shopName}</p>
        <h1 className="font-display mt-1 text-3xl font-semibold">{pack.shopTagline}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Age, classroom stage, allergies, and {pack.pincodeLabel} decide what we recommend. {pack.cod.enabled ? pack.cod.recommend : pack.cod.recommend}
        </p>
        <form
          className="mt-4 flex max-w-lg flex-wrap items-center gap-2 rounded-2xl bg-white/15 p-2"
          onSubmit={(e) => {
            e.preventDefault()
            setShopPincode(pinDraft.trim())
          }}
        >
          <MapPin size={16} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/70 outline-none"
            placeholder={`${pack.pincodeLabel} — ${pack.pincodeHint}`}
            value={pinDraft}
            onChange={(e) => setPinDraft(e.target.value)}
          />
          <Button type="submit" className="!bg-white !text-[#c81e5b]">
            Check delivery
          </Button>
        </form>
        {state.shopPincode ? (
          <p className="mt-2 text-xs text-white/90">
            {pinInfo
              ? `${pinInfo.area} · ${pinInfo.days ? `${pinInfo.days}-day delivery` : 'not serviceable'} · ${pinInfo.cod ? 'COD available' : 'COD not available'}`
              : 'Enter a valid code to check Cash on Delivery.'}
          </p>
        ) : null}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kids.map((c) => (
          <button
            key={c.id}
            className={`card flex items-center gap-3 p-3 text-left ${c.id === child?.id ? 'border-pine ring-2 ring-pine/20' : 'hover:border-pine'}`}
            onClick={() => {
              setChildId(c.id)
              setFilter('for-you')
            }}
          >
            <Avatar name={childName(c)} hue={c.avatarHue} />
            <div>
              <p className="font-semibold">{childName(c)}</p>
              <p className="text-xs text-muted">
                {ageYears(c.dob)} · size {clothingSize(c.dob)} · {c.stage ?? 'enrolled'}
              </p>
            </div>
          </button>
        ))}
      </div>

      <ShoppingEssentialsShelf childId={child?.id} />

      {child ? (
        <div className="mb-6 rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Needs for {child.firstName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {needs.map((n) => (
              <Badge key={n.id} tone="pine">
                {n.label}
              </Badge>
            ))}
            {child.dietType ? <Badge tone="gold">{child.dietType}</Badge> : null}
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {needs.map((n) => (
              <li key={`${n.id}-why`}>
                <strong className="text-ink">{n.label}.</strong> {n.reason}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={addKit}>
              <ShoppingBag size={16} /> Add recommended kit ({clothingSize(child.dob)})
            </Button>
            <Button variant="soft" onClick={() => setFilter('cod')}>
              <Truck size={16} /> Show COD recommendations
            </Button>
          </div>
          <AutoOrderPanel child={child} />
        </div>
      ) : null}

      {picks.length ? (
        <section className="mb-6">
          <h2 className="font-display text-xl">Recommended to buy on COD</h2>
          <p className="text-sm text-muted">Matched to {child?.firstName}’s age and file — pay the rider in cash or UPI.</p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {picks.map(({ item, score }) => (
              <article key={item.id} className="card min-w-[200px] p-3">
                <p className="text-2xl">{item.emoji}</p>
                <p className="mt-1 text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-muted">{item.brand}</p>
                <p className="mt-1 text-sm font-semibold">{rupee(item.price)}</p>
                <Badge tone="gold">COD · score {score}</Badge>
                {child ? (
                  <Button className="mt-2 w-full" variant="soft" onClick={() => addToCart(item.id, child.id, sizeForChild(item, child))}>
                    Add
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {SHOP_CATS.map((c) => (
          <Button key={c.id} variant={filter === c.id ? 'primary' : 'ghost'} onClick={() => setFilter(c.id)}>
            {c.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              childId={child?.id}
              childName={child?.firstName}
              size={child ? sizeForChild(item, child) : item.sizes[0]}
              wished={(state.shopWishlist ?? []).some((w) => w.itemId === item.id && w.childId === child?.id)}
              match={ranked.find((r) => r.item.id === item.id)}
              country={state.countryCode}
              onAdd={() => child && addToCart(item.id, child.id, sizeForChild(item, child))}
              onWish={() => child && toggleWish(item.id, child.id)}
            />
          ))}
        </div>
        <aside className="space-y-4">
          <div className="card p-4">
            <h2 className="font-display text-xl">Bag</h2>
            {cart.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Empty — add a kit or a COD pick.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {cart.map((l) => {
                  const item = catalog.find((i) => i.id === l.itemId)
                  const forChild = state.children.find((c) => c.id === l.childId)
                  return (
                    <li key={l.id} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold">
                          {item?.emoji} {item?.name}
                        </span>
                        <span>{rupee((item?.price ?? 0) * l.qty)}</span>
                      </div>
                      <p className="text-xs text-muted">
                        {forChild?.firstName} · {l.size}
                        {item?.codOk ? ' · COD ok' : ' · prepaid only'}
                      </p>
                      <div className="mt-1 flex gap-2">
                        <Button variant="ghost" onClick={() => setCartQty(l.id, l.qty - 1)}>
                          −
                        </Button>
                        <span className="px-1 py-2">{l.qty}</span>
                        <Button variant="ghost" onClick={() => setCartQty(l.id, l.qty + 1)}>
                          +
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {together.length && cart.length ? (
              <div className="mt-3 rounded-xl bg-sand p-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Frequently bought together</p>
                {together.map((item) => (
                  <button
                    key={item.id}
                    className="mt-1 block w-full text-left text-sm hover:text-pine"
                    onClick={() => child && addToCart(item.id, child.id, sizeForChild(item, child))}
                  >
                    + {item.name} · {rupee(item.price)}
                  </button>
                ))}
              </div>
            ) : null}
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{rupee(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>GST</dt>
                <dd>{rupee(gst)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>COD fee</dt>
                <dd>{rupee(Math.round(codFee))}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>To pay</dt>
                <dd>{rupee(total)}</dd>
              </div>
            </dl>
            {recommendCod ? (
              <p className="mt-3 rounded-xl bg-gold-soft px-3 py-2 text-xs text-gold">
                <Sparkles className="mr-1 inline" size={12} /> {pack.cod.recommend}
              </p>
            ) : pack.cod.enabled && cart.length ? (
              <p className="mt-3 text-xs text-muted">
                {!allCod
                  ? 'A prepaid-only item is in the bag — switch those out to use COD.'
                  : !codWindow
                    ? `COD window is ${rupee(pack.cod.min)}–${rupee(pack.cod.max)}.`
                    : !pinInfo?.cod
                      ? 'This PIN is not eligible for Cash on Delivery.'
                      : ''}
              </p>
            ) : null}
            <div className="mt-3">
            <Field label="Pay with">
              <select className={inputClass} value={pay} onChange={(e) => setPay(e.target.value as PayMethod)}>
                {pack.payments
                  .filter((p) => p.id === 'cod' || p.id === 'upi' || p.id === 'card' || p.id === 'netbanking' || p.id === 'wallet')
                  .map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === 'cod' && !recommendCod && pack.cod.enabled}>
                      {p.label}
                      {p.id === 'cod' && recommendCod ? ' · recommended' : ''}
                    </option>
                  ))}
              </select>
            </Field>
            </div>
            <Field label="Deliver to">
              <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Button
              className="mt-3 w-full"
              disabled={!cart.length}
              onClick={() =>
                placeShopOrder({
                  notes: pay === 'cod' ? 'Pay rider on delivery' : `Prepaid ${pay}`,
                  payment: pay,
                  pincode: state.shopPincode,
                  address,
                })
              }
            >
              {pay === 'cod' ? 'Place COD order' : 'Pay & place order'}
            </Button>
            <p className="mt-2 text-[11px] text-muted">
              Earn {pack.clubName} coins at {Math.round(pack.clubRate * 100)}% of merchandise. Demo checkout — no real payment.
            </p>
          </div>
          <div className="card p-4">
            <h2 className="font-display text-xl">Orders</h2>
            <ul className="mt-3 space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-line px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{o.id}</span>
                    <Badge tone={ORDER_TONE[o.status]}>{o.status}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {o.placedAt.slice(0, 10)} · {rupee(o.total)} · {(o.payment ?? 'cod').toUpperCase()}
                    {o.pincode ? ` · PIN ${o.pincode}` : ''}
                  </p>
                  <ul className="mt-1 text-xs">
                    {o.lines.map((l) => (
                      <li key={`${o.id}-${l.itemId}-${l.size}`}>
                        {l.qty}× {l.name} ({l.size})
                      </li>
                    ))}
                  </ul>
                  {user.role === 'director' && o.status !== 'delivered' && o.status !== 'cancelled' ? (
                    <Button
                      className="mt-2"
                      variant="soft"
                      onClick={() =>
                        setShopOrderStatus(
                          o.id,
                          o.status === 'placed' ? 'packed' : o.status === 'packed' ? 'shipped' : 'delivered',
                        )
                      }
                    >
                      Mark {o.status === 'placed' ? 'packed' : o.status === 'packed' ? 'shipped' : 'delivered'}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ProductCard({
  item,
  childId,
  childName,
  size,
  wished,
  match,
  country,
  onAdd,
  onWish,
}: {
  item: ShopItem
  childId?: string
  childName?: string
  size: string
  wished: boolean
  match?: { score: number }
  country: string
  onAdd: () => void
  onWish: () => void
}) {
  const off = pctOff(item)
  return (
    <article className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{item.emoji}</span>
        <button className={wished ? 'text-rose' : 'text-muted'} onClick={onWish} aria-label="Wishlist">
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className="mt-1 text-[11px] tracking-wide text-muted uppercase">{item.brand}</p>
      <h3 className="font-semibold">{item.name}</h3>
      <p className="mt-1 text-xs text-muted">{item.why}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="font-semibold">{money(item.price, country)}</span>
        {off > 0 ? (
          <>
            <span className="text-xs text-muted line-through">{money(item.mrp, country)}</span>
            <Badge tone="rose">{off}% off</Badge>
          </>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {item.codOk ? <Badge tone="gold">COD</Badge> : <Badge tone="sand">Prepaid</Badge>}
        <Badge tone="sky">{size}</Badge>
        {item.badge ? <Badge tone="pine">{item.badge}</Badge> : null}
        {match && match.score >= 4 ? <Badge tone="pine">for this child</Badge> : null}
      </div>
      <p className="mt-2 text-xs text-muted">
        ★ {item.rating} · {item.sold.toLocaleString()} bought · {item.stock} left · GST {Math.round(item.gstRate * 100)}%
      </p>
      <Button className="mt-3" variant="soft" disabled={!childId || item.stock < 1} onClick={onAdd}>
        Add for {childName ?? 'child'}
      </Button>
    </article>
  )
}
