import { Avatar, Badge, Button, PageHead, Stat } from '../components/ui'
import { today } from '../data/seed'
import { useStore } from '../store'

export function StaffPage() {
  const { state, clockToggle } = useStore()
  const t = today()
  const rooms = state.classrooms.filter((r) => r.siteId === state.currentSiteId)
  const presentKids = state.children.filter((c) =>
    state.attendance.some((a) => a.childId === c.id && a.date === t && a.checkIn && !a.checkOut),
  )

  return (
    <div>
      <PageHead title="Staff, time clock & ratios" subtitle="Shifts, certifications, professional development hours, and licensing ratios." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Clocked in" value={state.staff.filter((s) => s.clockedIn).length} />
        <Stat
          label="PD hours behind"
          value={state.staff.filter((s) => s.trainingHours < s.requiredHours).length}
        />
        <Stat label="On leave" value={state.staff.filter((s) => s.status !== 'active').length} />
      </div>
      <h2 className="font-display mb-3 text-xl">Live ratios</h2>
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {rooms.map((room) => {
          const kids = presentKids.filter((c) => c.classroomId === room.id).length
          const staffOn = state.staff.filter((s) => s.clockedIn && s.classroomIds.includes(room.id)).length
          const need = kids === 0 ? 0 : Math.ceil(kids / room.ratioChildren) * room.ratioStaff
          const ok = staffOn >= need
          return (
            <div key={room.id} className="card p-4">
              <p className="font-semibold">{room.name}</p>
              <p className="text-xs text-muted">
                {room.ageGroup} · required {room.ratioStaff}:{room.ratioChildren}
              </p>
              <p className="mt-2 text-sm">
                {kids} children · {staffOn} staff · need {need}
              </p>
              <Badge tone={ok ? 'pine' : 'rose'}>{ok ? 'In ratio' : 'Out of ratio'}</Badge>
            </div>
          )
        })}
      </div>
      <div className="space-y-3">
        {state.staff.map((s) => (
          <article key={s.id} className="card flex flex-wrap items-center gap-4 p-4">
            <Avatar name={s.name} hue={s.avatarHue} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {s.name} <span className="font-normal text-muted">· {s.title}</span>
              </p>
              <p className="text-xs text-muted">{s.certifications.join(' · ')}</p>
              <p className="text-xs text-muted">
                PD {s.trainingHours}/{s.requiredHours} hrs · hired {s.hireDate}
              </p>
            </div>
            <Badge tone={s.clockedIn ? 'pine' : 'sand'}>{s.clockedIn ? `In ${s.clockedIn}` : 'Out'}</Badge>
            <Button variant="soft" onClick={() => clockToggle(s.id)}>
              {s.clockedIn ? 'Clock out' : 'Clock in'}
            </Button>
          </article>
        ))}
      </div>
      <h2 className="font-display mt-8 mb-3 text-xl">Today’s shifts</h2>
      <ul className="space-y-2">
        {state.shifts
          .filter((sh) => sh.date === t)
          .map((sh) => {
            const st = state.staff.find((s) => s.id === sh.staffId)
            const room = state.classrooms.find((r) => r.id === sh.classroomId)
            return (
              <li key={sh.id} className="card flex justify-between px-4 py-3 text-sm">
                <span>
                  {st?.name} · {room?.name}
                </span>
                <span className="text-muted">
                  {sh.start}–{sh.end}
                </span>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
