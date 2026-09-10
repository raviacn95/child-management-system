import { PageHead, Stat } from '../components/ui'
import { today } from '../data/seed'
import { money } from '../lib'
import { packOf } from '../data/country'
import { useStore } from '../store'

export function Reports() {
  const { state } = useStore()
  const t = today()
  const rupee = (n: number) => money(n, state.countryCode)
  const pack = packOf(state.countryCode)
  const enrolled = state.children.filter((c) => c.status === 'enrolled' && c.siteId === state.currentSiteId)
  const present = enrolled.filter((c) =>
    state.attendance.some((a) => a.childId === c.id && a.date === t && a.checkIn && !a.checkOut),
  ).length
  const occupancy = enrolled.length ? Math.round((present / enrolled.length) * 100) : 0
  const rooms = state.classrooms.filter((r) => r.siteId === state.currentSiteId)
  const max = Math.max(
    ...rooms.map((r) => enrolled.filter((c) => c.classroomId === r.id).length),
    1,
  )
  const collected = state.invoices.reduce((s, i) => s + i.paid, 0)
  const billed = state.invoices.reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <PageHead title="Reports" subtitle={`${pack.name}: occupancy, attendance, fee collection, and ${pack.vaccineProgram.split(' ')[0]} immunization compliance.`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Occupancy now" value={`${occupancy}%`} hint={`${present}/${enrolled.length} present`} />
        <Stat
          label="Collection rate"
          value={`${billed ? Math.round((collected / billed) * 100) : 0}%`}
          hint={`${rupee(collected)} of ${rupee(billed)}`}
        />
        <Stat
          label="Vaccine complete"
          value={state.vaccinations.filter((v) => v.status === 'complete').length}
        />
        <Stat label="Incidents logged" value={state.incidents.length} />
      </div>
      <section className="card p-5">
        <h2 className="font-display text-xl">Enrollment by room</h2>
        <div className="mt-4 space-y-3">
          {rooms.map((r) => {
            const n = enrolled.filter((c) => c.classroomId === r.id).length
            return (
              <div key={r.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{r.name}</span>
                  <span>
                    {n}/{r.capacity}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-sand">
                  <div
                    className="h-2 rounded-full bg-pine"
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
