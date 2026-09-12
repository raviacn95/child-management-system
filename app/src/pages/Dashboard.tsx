import { AlertTriangle, ArrowUpRight, Bot } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, PageHead, Stat } from '../components/ui'
import { LearningPacksPanel } from '../features/learning/LearningPacksPanel'
import { FamilyMealsPanel } from '../features/meals/FamilyMealsPanel'
import { HorizonsPanel } from '../features/grow/HorizonActivities'
import { ParentFeedPanel } from '../features/parent-feed/ParentGrowthFeed'
import { MovieShelf } from '../features/movies/MovieShelf'
import { TopPicksShelf } from '../features/top-picks/TopPicksShelf'
import { today } from '../data/seed'
import { packOf } from '../data/country'
import { ageYears, bmiProfile, childName, money } from '../lib'
import { useStore } from '../store'

export function Dashboard() {
  const { state } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const pack = packOf(state.countryCode)
  const rupee = (n: number) => money(n, state.countryCode)
  const siteChildren = state.children.filter(
    (c) => c.siteId === state.currentSiteId && (user.role !== 'parent' || user.childIds.includes(c.id)),
  )
  const enrolled = siteChildren.filter((c) => c.status === 'enrolled')
  const t = today()
  const present = enrolled.filter((c) =>
    state.attendance.some((a) => a.childId === c.id && a.date === t && a.checkIn && !a.checkOut),
  )
  const rooms = state.classrooms.filter((r) => r.siteId === state.currentSiteId)
  const overdueVax = state.vaccinations.filter(
    (v) => v.status === 'overdue' && enrolled.some((c) => c.id === v.childId),
  )
  const overdueInv = state.invoices.filter((i) => i.status === 'overdue')
  const ratioAlerts = rooms
    .map((room) => {
      const inRoom = present.filter((c) => c.classroomId === room.id).length
      const staffOn = state.staff.filter((s) => s.clockedIn && s.classroomIds.includes(room.id)).length
      const needed = Math.ceil(inRoom / room.ratioChildren) * room.ratioStaff
      return { room, inRoom, staffOn, needed, ok: staffOn >= needed || inRoom === 0 }
    })
    .filter((r) => !r.ok)

  return (
    <div>
      <PageHead
        title={user.role === 'parent' ? `Hi, ${user.name.split(' ')[0]}` : 'Today at a glance'}
        subtitle={
          user.role === 'parent'
            ? 'Home coach: tiffin, horizons, parent growth feed, Willow Mart COD.'
            : `${present.length} children in the building · ${rooms.length} rooms open · ${pack.name}`
        }
      />
      <p className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
        Grove · Cinema · Harbor —{' '}
        <Link className="text-pine" to="/hub">
          Household Hub
        </Link>{' '}
        mixes learning, parent growth, and family movies
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="On site now" value={present.length} hint={`${enrolled.length} enrolled`} />
        <Stat label="Waitlist" value={state.applications.filter((a) => a.status === 'waitlist').length} />
        <Stat
          label="Tuition due"
          value={rupee(
            state.invoices
              .filter((i) => i.status !== 'paid')
              .reduce((s, i) => s + (i.amount - i.paid), 0),
          )}
        />
        <Stat
          label="Mart orders"
          value={(state.shopOrders ?? []).filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length}
          hint="open COD / prepaid"
        />
      </div>

      {ratioAlerts.length > 0 && user.role !== 'parent' ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-clay/30 bg-clay-soft px-4 py-3">
          <AlertTriangle className="mt-0.5 text-clay" size={18} />
          <div>
            <p className="text-sm font-semibold text-clay">Ratio alert</p>
            {ratioAlerts.map((r) => (
              <p key={r.room.id} className="text-sm">
                {r.room.name}: {r.inRoom} children / {r.staffOn} staff (need {r.needed})
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Who is here</h2>
            <Link to="/attendance" className="text-sm font-semibold text-pine">
              Check-in desk
            </Link>
          </div>
          <div className="space-y-2">
            {enrolled.slice(0, 8).map((c) => {
              const att = state.attendance.find((a) => a.childId === c.id && a.date === t)
              const room = rooms.find((r) => r.id === c.classroomId)
              const here = Boolean(att?.checkIn && !att.checkOut)
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sand">
                  <Avatar name={childName(c)} hue={c.avatarHue} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {childName(c)}{' '}
                      <span className="font-normal text-muted">· {ageYears(c.dob)}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {room?.name} {att?.checkIn ? `· in ${att.checkIn}` : '· not yet arrived'}
                    </p>
                  </div>
                  <Badge tone={here ? 'pine' : att?.checkOut ? 'sand' : 'gold'}>
                    {here ? 'Present' : att?.checkOut ? 'Picked up' : 'Expected'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </section>
        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="font-display text-xl">Needs attention</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex justify-between">
                <span>Overdue immunizations</span>
                <span className="font-semibold text-rose">{overdueVax.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Overdue invoices</span>
                <span className="font-semibold text-rose">{overdueInv.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Pending documents</span>
                <span className="font-semibold">
                  {state.documents.filter((d) => d.status === 'pending').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Low supplies</span>
                <span className="font-semibold">
                  {state.inventory.filter((i) => i.qty <= i.reorderAt).length}
                </span>
              </li>
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="font-display text-xl">Teacher workers</h2>
            <p className="mt-1 text-xs text-muted">Auto-monitoring five assigned children.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {state.teacherWorkers.slice(0, 5).map((w) => {
                const child = state.children.find((c) => c.id === w.childId)
                const staff = state.staff.find((s) => s.id === w.staffId)
                if (!child) return null
                if (user.role === 'parent' && !user.childIds.includes(child.id)) return null
                const open = state.workerTasks.filter((t) => t.workerId === w.id && !t.done).length
                return (
                  <li key={w.id} className="flex justify-between gap-2">
                    <span>
                      {staff?.name.split(' ')[0]} → {child.firstName}
                    </span>
                    <span className={open ? 'font-semibold text-clay' : 'text-pine'}>{open} open</span>
                  </li>
                )
              })}
            </ul>
            <Link to="/workers" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pine">
              <Bot size={14} /> Open worker desk
            </Link>
            <Link to="/grow?tab=horizons" className="mt-2 flex items-center gap-1 text-sm font-semibold text-pine">
              Grow at home — tiffin, horizons, 10 skills →
            </Link>
            <Link to="/shop" className="mt-2 flex items-center gap-1 text-sm font-semibold text-pine">
              Willow Mart — buy on COD →
            </Link>
          </div>
          {user.role !== 'parent' ? <LearningPacksPanel /> : null}
          <FamilyMealsPanel kids={enrolled} growthRecords={state.growthRecords ?? []} />
          <HorizonsPanel
            kids={enrolled}
            growthBand={(id) => {
              const c = enrolled.find((x) => x.id === id)
              const g = (state.growthRecords ?? []).find((r) => r.childId === id)
              if (!c || !g) return undefined
              return bmiProfile(c.dob, g.weightKg, g.heightCm, c.gender).band
            }}
          />
          <ParentFeedPanel />
          <div className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">Movies & OTT</h2>
              <div className="flex gap-3 text-sm font-semibold text-pine">
                <Link to="/ott">My OTTs →</Link>
                <Link to="/tv">TV tonight →</Link>
                <Link to="/movies">Full shelf →</Link>
              </div>
            </div>
            <p className="mb-4 text-xs text-muted">
              Critics’ top ten, then 100 ranked titles with official Prime, JioHotstar, SonyLIV and 50+ watch links.
            </p>
            <TopPicksShelf />
            <MovieShelf compact />
          </div>
          <div className="card p-5">
            <h2 className="font-display text-xl">Coming up</h2>
            <ul className="mt-3 space-y-2">
              {state.events.slice(0, 4).map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span>{e.title}</span>
                  <span className="text-muted">{e.date.slice(5)}</span>
                </li>
              ))}
            </ul>
            <Link to="/calendar" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pine">
              Full calendar <ArrowUpRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
