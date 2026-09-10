import { useEffect, useState } from 'react'
import { ExternalLink, Truck, Zap } from 'lucide-react'
import { clothingNeeds } from '../data/catalog'
import { packOf } from '../data/country'
import { autoOrderRemote, buildOrder, partnerShopUrl, placeOrderRemote, QC_APPS } from '../lib/autoOrder'
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
  const [address, setAddress] = useState('')
  const orders = (state.quickOrders ?? []).filter((o) => o.childId === child.id)
  const winnerApp = quote?.decision.app ?? 'zepto'

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
        address: address || `PIN ${state.shopPincode} (sandbox — not sent to ${quote.decision.appName})`,
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
          <p className="text-xs font-semibold tracking-wide text-clay uppercase">Quick-commerce quote (sandbox)</p>
          <h3 className="font-display text-xl">Compare {child.firstName}’s needs on nearby dark stores</h3>
          <p className="mt-1 text-xs text-muted">
            Willow does not have Zepto’s consumer login, so Auto Order cannot dispatch a real rider. Confirming here only
            runs a local timeline. To get groceries at your door, checkout in the official Zepto / Blinkit / Instamart
            app after setting PIN {state.shopPincode || '560105'}.
          </p>
        </div>
        <Button onClick={runQuote} disabled={busy || !state.shopPincode}>
          <Zap size={16} /> {busy ? 'Quoting…' : 'Get sandbox quote'}
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
              Sandbox pick: {quote.decision.appName} · {quote.decision.etaMin} min · {rupee(quote.decision.subtotal)}
            </p>
            <p className="text-xs text-muted">{quote.decision.why}</p>
            <Badge tone="gold">not sent to {quote.decision.appName}</Badge>
            <Badge tone={via === 'middleware' ? 'pine' : 'sand'}>{via === 'middleware' ? 'middleware' : 'local sandbox'}</Badge>
            {quote.decision.allCod ? <Badge>COD would be eligible</Badge> : <Badge>Prepaid / UPI</Badge>}
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
                <a
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-pine"
                  href={partnerShopUrl(winnerApp, p.chosen.name)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open “{p.chosen.name}” on {quote.decision.appName} <ExternalLink size={12} />
                </a>
                {p.runners.length ? (
                  <p className="text-[11px] text-muted">
                    Also: {p.runners.map((r) => `${r.app} ${rupee(r.price)} / ${r.etaMin}m`).join(' · ')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Pay with (sandbox only)">
              <select className={inputClass} value={pay} onChange={(e) => setPay(e.target.value as PayMethod)}>
                <option value="cod">Cash on delivery</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </Field>
            <Field label="Deliver to (saved in Willow only)">
              <input
                className={inputClass}
                value={address}
                placeholder="Your home address — not sent to Zepto"
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-pine px-3.5 py-2 text-sm font-semibold text-white"
              href={partnerShopUrl(winnerApp, quote.picks[0]?.chosen.name ?? 'baby wipes')}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} /> Place a real order on {quote.decision.appName}
            </a>
            <Button variant="soft" onClick={confirm} disabled={busy || !quote.picks.length}>
              <Truck size={16} /> Only simulate in Willow
            </Button>
          </div>
        </div>
      ) : null}

      {orders.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Sandbox tracking (not a real rider)</p>
          <ul className="mt-2 space-y-2">
            {orders.slice(0, 4).map((o) => (
              <li key={o.id} className="rounded-xl bg-paper px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">
                    {o.id} · {o.appName}
                  </span>
                  <Badge tone={o.status === 'delivered' ? 'gold' : 'sand'}>sandbox {o.status}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {rupee(o.total)} · {o.payment.toUpperCase()} · {o.lines.length} SKUs · {o.events.at(-1)?.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
