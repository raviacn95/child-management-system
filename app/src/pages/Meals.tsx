import { Badge, PageHead } from '../components/ui'
import { packOf } from '../data/country'
import { useStore } from '../store'

export function Meals() {
  const { state } = useStore()
  const pack = packOf(state.countryCode)
  return (
    <div>
      <PageHead title={pack.mealsTitle} subtitle={pack.mealsNote} />
      <div className="grid gap-4 md:grid-cols-2">
        {state.menus.map((m) => (
          <article key={m.id} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">{m.date}</h2>
              <Badge tone="gold">{m.allergens}</Badge>
            </div>
            <dl className="space-y-2 text-sm">
              {pack.mealSlots.map((slot) => (
                <Row key={slot.key} k={slot.label} v={m[slot.key]} />
              ))}
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-2">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  )
}
