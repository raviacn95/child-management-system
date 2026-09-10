import { Button, PageHead } from '../components/ui'
import { useStore } from '../store'

export function SettingsPage() {
  const { state, resetDemo } = useStore()
  return (
    <div>
      <PageHead title="Settings" subtitle="Sites, licensing, and demo data. Role-based access is built in for director, teacher, and parent." />
      <div className="grid gap-4 md:grid-cols-3">
        {state.sites.map((s) => (
          <article key={s.id} className="card p-5">
            <h2 className="font-display text-xl">{s.name}</h2>
            <p className="mt-1 text-sm text-muted">{s.address}</p>
            <p className="mt-3 text-sm">{s.phone}</p>
            <p className="text-sm">License {s.license}</p>
            <p className="text-sm">Licensed capacity {s.capacity}</p>
          </article>
        ))}
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-display text-xl">Demo data</h2>
        <p className="mt-1 text-sm text-muted">
          Willow stores everything in this browser. Reset to restore the seeded multi-site center.
        </p>
        <Button className="mt-4" variant="danger" onClick={resetDemo}>
          Reset demo
        </Button>
      </div>
    </div>
  )
}
