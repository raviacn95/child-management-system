import { Bus } from 'lucide-react'
import { Badge, PageHead } from '../components/ui'
import { packOf } from '../data/country'
import { childName, money } from '../lib'
import { useStore } from '../store'

export function TransportPage() {
  const { state } = useStore()
  const pack = packOf(state.countryCode)
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const routes = (state.transportRoutes ?? []).filter((r) => user.role === 'director' || r.siteId === state.currentSiteId)
  const kids = state.children.filter((c) => {
    if (user.role === 'parent') return user.childIds.includes(c.id)
    return c.siteId === state.currentSiteId
  })

  return (
    <div>
      <PageHead
        title={pack.transportLabel}
        subtitle={`${pack.name} centre vans with attendant, AM/PM slots, and monthly GST-able transport fee. OTP/PIN still required at the gate.`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {routes.map((r) => {
          const riders = kids.filter((c) => c.transportRouteId === r.id)
          return (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-display text-xl">
                    <Bus size={18} /> {r.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">{r.vehicle}</p>
                </div>
                <Badge tone="pine">
                  {r.occupied}/{r.seats}
                </Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted">Attendant</dt>
                  <dd>{r.attendant}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Monthly fee</dt>
                  <dd>{money(r.fee, state.countryCode)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">AM pickup</dt>
                  <dd>{r.am}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">PM drop</dt>
                  <dd>{r.pm}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Stops</p>
              <p className="text-sm">{r.stops.join(' → ')}</p>
              <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Riders</p>
              <ul className="mt-1 text-sm">
                {riders.length ? riders.map((c) => <li key={c.id}>{childName(c)}</li>) : <li className="text-muted">None on this account</li>}
              </ul>
            </article>
          )
        })}
      </div>
    </div>
  )
}
