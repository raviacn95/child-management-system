import { ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { clothingNeeds, fitsChild, recommendedItems, sizeForChild } from '../data/catalog'
import { Avatar, Badge, Button, PageHead } from '../components/ui'
import { ageYears, childName, clothingSize, money } from '../lib'
import { useStore } from '../store'
import type { ShopCategory, ShopOrderStatus } from '../types'

const CATS: { id: ShopCategory | 'all' | 'for-you'; label: string }[] = [
  { id: 'for-you', label: 'For this child' },
  { id: 'all', label: 'All ages' },
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'care', label: 'Care extras' },
  { id: 'uniform', label: 'Willow tee' },
]

const ORDER_TONE: Record<ShopOrderStatus, 'gold' | 'sky' | 'pine' | 'sand' | 'rose'> = {
  cart: 'sand',
  placed: 'gold',
  packed: 'sky',
  delivered: 'pine',
  cancelled: 'rose',
}

export function Shop() {
  const { state, addToCart, setCartQty, placeShopOrder, setShopOrderStatus } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const kids = state.children.filter((c) => {
    if (c.status !== 'enrolled') return false
    if (user.role === 'parent') return user.childIds.includes(c.id)
    return c.siteId === state.currentSiteId
  })
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const [filter, setFilter] = useState<(typeof CATS)[number]['id']>('for-you')
  const child = kids.find((c) => c.id === childId) ?? kids[0]
  const catalog = state.shopCatalog ?? []
  const cart = state.shopCart ?? []
  const orders = (state.shopOrders ?? []).filter((o) => user.role === 'director' || o.userId === user.id)

  const needs = child ? clothingNeeds(child) : []
  const ranked = child ? recommendedItems(catalog, child) : []
  const items = useMemo(() => {
    if (!child) return []
    if (filter === 'for-you') return ranked.filter((r) => r.score > 0 || fitsChild(r.item, child)).slice(0, 12).map((r) => r.item)
    if (filter === 'all') return catalog.filter((i) => fitsChild(i, child))
    return catalog.filter((i) => i.category === filter && fitsChild(i, child))
  }, [child, filter, ranked, catalog])

  const cartTotal = cart.reduce((n, l) => {
    const item = catalog.find((i) => i.id === l.itemId)
    return n + (item?.price ?? 0) * l.qty
  }, 0)

  function addKit() {
    if (!child) return
    ranked.slice(0, 5).forEach(({ item }) => {
      if (item.stock < 1) return
      addToCart(item.id, child.id, sizeForChild(item, child), 1)
    })
  }

  return (
    <div>
      <PageHead
        title="Kids’ clothing shop"
        subtitle="Sizes and kits follow each child’s age, allergies, extra-change needs, and classroom life."
      />
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
                {ageYears(c.dob)} · size {clothingSize(c.dob)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {child ? (
        <div className="mb-6 rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Needs for {child.firstName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {needs.map((n) => (
              <Badge key={n.id} tone="pine">
                {n.label}
              </Badge>
            ))}
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {needs.map((n) => (
              <li key={`${n.id}-why`}>
                <strong className="text-ink">{n.label}.</strong> {n.reason}
              </li>
            ))}
          </ul>
          <Button className="mt-4" onClick={addKit}>
            <ShoppingBag size={16} /> Add recommended kit ({clothingSize(child.dob)})
          </Button>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <Button key={c.id} variant={filter === c.id ? 'primary' : 'ghost'} onClick={() => setFilter(c.id)}>
            {c.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const size = child ? sizeForChild(item, child) : item.sizes[0]
            const match = ranked.find((r) => r.item.id === item.id)
            return (
              <article key={item.id} className="card flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <span className="text-sm font-semibold">{money(item.price)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{item.why}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge>{item.category}</Badge>
                  <Badge tone="sky">{size}</Badge>
                  {match && match.score >= 2 ? <Badge tone="pine">matches needs</Badge> : null}
                </div>
                <p className="mt-2 text-xs text-muted">{item.stock} in stock</p>
                <Button
                  className="mt-3"
                  variant="soft"
                  disabled={!child || item.stock < 1}
                  onClick={() => child && addToCart(item.id, child.id, size)}
                >
                  Add for {child?.firstName}
                </Button>
              </article>
            )
          })}
        </div>
        <aside className="space-y-4">
          <div className="card p-4">
            <h2 className="font-display text-xl">Cart</h2>
            {cart.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Empty — add a kit or a single piece.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {cart.map((l) => {
                  const item = catalog.find((i) => i.id === l.itemId)
                  const forChild = state.children.find((c) => c.id === l.childId)
                  return (
                    <li key={l.id} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold">{item?.name}</span>
                        <span>{money((item?.price ?? 0) * l.qty)}</span>
                      </div>
                      <p className="text-xs text-muted">
                        {forChild?.firstName} · {l.size}
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
            <div className="mt-4 flex items-center justify-between">
              <span className="font-semibold">{money(cartTotal)}</span>
              <Button disabled={!cart.length} onClick={() => placeShopOrder('Family clothing order')}>
                Place order
              </Button>
            </div>
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
                    {o.placedAt.slice(0, 10)} · {money(o.total)} · {o.notes}
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
                        setShopOrderStatus(o.id, o.status === 'placed' ? 'packed' : 'delivered')
                      }
                    >
                      Mark {o.status === 'placed' ? 'packed' : 'delivered'}
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
