import { Badge, PageHead } from '../components/ui'
import { useStore } from '../store'

export function Meals() {
  const { state } = useStore()
  return (
    <div>
      <PageHead title="Meals & CACFP" subtitle="Peanut-free kitchen, allergen flags, and daily menus for breakfast through PM snack." />
      <div className="grid gap-4 md:grid-cols-2">
        {state.menus.map((m) => (
          <article key={m.id} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">{m.date}</h2>
              <Badge tone="gold">{m.allergens}</Badge>
            </div>
            <dl className="space-y-2 text-sm">
              <Row k="Breakfast" v={m.breakfast} />
              <Row k="AM snack" v={m.amSnack} />
              <Row k="Lunch" v={m.lunch} />
              <Row k="PM snack" v={m.pmSnack} />
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
