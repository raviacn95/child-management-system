import { Badge, PageHead } from '../components/ui'
import { today } from '../data/seed'
import { childName } from '../lib'
import { useStore } from '../store'

export function Classrooms() {
  const { state } = useStore()
  const t = today()
  const rooms = state.classrooms.filter((r) => r.siteId === state.currentSiteId)
  return (
    <div>
      <PageHead title="Rooms & programs" subtitle="Age groups, capacity, assigned teachers, and who is in each room today." />
      <div className="grid gap-4 lg:grid-cols-3">
        {rooms.map((room) => {
          const kids = state.children.filter((c) => c.classroomId === room.id && c.status === 'enrolled')
          const teachers = state.staff.filter((s) => s.classroomIds.includes(room.id))
          return (
            <section key={room.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-2xl" style={{ color: room.color }}>
                  {room.name}
                </h2>
                <Badge>
                  {kids.length}/{room.capacity}
                </Badge>
              </div>
              <p className="text-sm text-muted">{room.ageGroup}</p>
              <p className="mt-1 text-xs text-muted">Teachers: {teachers.map((t) => t.name).join(', ') || 'Unassigned'}</p>
              <ul className="mt-4 space-y-2">
                {kids.map((c) => {
                  const here = state.attendance.some((a) => a.childId === c.id && a.date === t && a.checkIn && !a.checkOut)
                  return (
                    <li key={c.id} className="flex items-center justify-between text-sm">
                      <span>{childName(c)}</span>
                      <Badge tone={here ? 'pine' : 'sand'}>{here ? 'in' : 'out'}</Badge>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
