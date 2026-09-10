import { useEffect, useState } from 'react'
import { Truck, Zap } from 'lucide-react'
import { clothingNeeds } from '../data/catalog'
import { packOf } from '../data/country'
import { autoOrderRemote, buildOrder, placeOrderRemote, QC_APPS } from '../lib/autoOrder'
import { childName, money } from '../lib'
import { useStore } from '../store'
import type { Child, PayMethod, QcQuote } from '../types'
import { Badge, Button, Field, inputClass } from './ui'

export function AutoOrderPanel({ child }: { child: Child }) {
  const { state, recordQuickOrder, tickQuickOrder } = useStore()
  const pack = packOf(state.countryCode)
  const rupee = (n: number) => money(n, state.countryCode)
  const needs = clothingNeeds(child)
  const [busy, setBusy] = useState(false)
  const [quote, setQuote] = useState<QcQuote | null>(null)
  const [via, setVia] = useState<'middleware' | 'local' | null>(null)
  const [error, setError] = useState('')
  const [pay, setPay] = useState<PayMethod>(pack.cod.enabled ? 'cod' : 'upi')
  const [address, setAddress] = useState(state.sites.find((s) => s.id === state.currentSiteId)?.address ?? '')
  const orders = (state.quickOrders ?? []).filter((o) => o.childId === child.id)

  useEffect(() => {
    const open = (state.quickOrders ?? []).filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
    if (!open.length) return
    const t = window.setInterval(() => {
      open.forEach((o) => tickQuickOrder(o.id))
    }, 7000)
    return () => window.clearInterval(t)
  }, [state.quickOrders, tickQuickOrder])

  async function runQuote() {
    setBusy(true)
    setError('')
    try {
      const result = await autoOrderRemote({
        child,
        needs,
        pincode: state.shopPincode,
        payment: pay,
        address,
        preferCod: pay === 'cod',
      })
      setQuote(result.quote)
      setVia(result.via)
    } catch {
      setError('Could not quote. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (!quote || !state.currentUserId) return
    setBusy(true)
    try {
      const built = buildOrder({
        childId: child.id,
        userId: state.currentUserId,
        quote,
        payment: pay,
        pincode: state.shopPincode,
        address,
      })
      const placed = await placeOrderRemote(built)
      recordQuickOrder(placed)
      setQuote(null)
    } finally {
      setBusy(false)
    }
  }

  if (pack.code !== 'IN') {
    return (
      <p className="mt-3 text-xs text-muted">
        Auto Order (Zepto / Blinkit / Instamart) is India-only. Switch country pack to India to use it.
      </p>
    )
  }

  return (
    <div className="mt-5 rounded-2xl border border-clay/25 bg-clay-soft/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-clay uppercase">Quick-commerce auto order</p>
          <h3 className="font-display text-xl">Send {child.firstName}’s needs to nearby dark stores</h3>
          <p className="mt-1 text-xs text-muted">
            Maps cubby needs → SKUs, quotes Zepto / Blinkit / Instamart sandbox partner APIs, then picks the best ETA ×
            price × COD. No public order APIs exist — this is the partner-shaped sandbox. Live placement needs a commercial agreement.
          </p>
        </div>
        <Button onClick={runQuote} disabled={busy || !state.shopPincode}>
          <Zap size={16} /> {busy ? 'Quoting…' : 'Auto Order'}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        PIN {state.shopPincode || '—'} · allergy-safe for {childName(child)}
        {child.allergies.length ? ` (block ${child.allergies.map((a) => a.name).join(', ')})` : ''} · {QC_APPS.map((a) => a.name).join(' · ')}
      </p>
      {error ? <p className="mt-2 text-sm text-rose">{error}</p> : null}

      {quote ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-paper p-3">
            <p className="text-sm font-semibold">
              Decision: {quote.decision.appName} · {quote.decision.etaMin} min · {rupee(quote.decision.subtotal)}
            </p>
            <p className="text-xs text-muted">{quote.decision.why}</p>
            <Badge tone={via === 'middleware' ? 'pine' : 'gold'}>{via === 'middleware' ? 'middleware' : 'local sandbox'}</Badge>
            {quote.decision.allCod ? <Badge tone="gold">COD eligible</Badge> : <Badge>Prepaid / UPI</Badge>}
          </div>
          <ul className="space-y-2">
            {quote.picks.map((p) => (
              <li key={p.needId} className="rounded-xl border border-line bg-paper px-3 py-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{p.label}</span>
                  <span>
                    {p.chosen.name} · {rupee(p.chosen.price)} · {p.chosen.etaMin} min · {p.chosen.app}
                  </span>
                </div>
                <p className="text-xs text-muted">{p.reason}</p>
                {p.runners.length ? (
                  <p className="text-[11px] text-muted">
                    Also: {p.runners.map((r) => `${r.app} ${rupee(r.price)} / ${r.etaMin}m`).join(' · ')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Pay with">
              <select className={inputClass} value={pay} onChange={(e) => setPay(e.target.value as PayMethod)}>
                <option value="cod">Cash on delivery</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </Field>
            <Field label="Deliver to">
              <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </div>
          <Button onClick={confirm} disabled={busy || !quote.picks.length}>
            <Truck size={16} /> Confirm {pay.toUpperCase()} on {quote.decision.appName}
          </Button>
        </div>
      ) : null}

      {orders.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Webhook tracking</p>
          <ul className="mt-2 space-y-2">
            {orders.slice(0, 4).map((o) => (
              <li key={o.id} className="rounded-xl bg-paper px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">
                    {o.id} · {o.appName}
                  </span>
                  <Badge tone={o.status === 'delivered' ? 'pine' : o.status === 'rider' ? 'sky' : 'gold'}>{o.status}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {rupee(o.total)} · {o.payment.toUpperCase()} · {o.lines.length} SKUs · {o.events.at(-1)?.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] text-muted">
        Optional live middleware: run <code>node middleware/server.mjs</code>. In Vite
        the Shop UI proxies <code>/qc-api</code> to it automatically.
      </p>
    </div>
  )
}
