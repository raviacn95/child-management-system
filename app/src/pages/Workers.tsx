import { Bot, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Avatar, Badge, Button, PageHead } from '../components/ui'
import { ageYears, childName, formatTime } from '../lib'
import { useStore } from '../store'
import type { TaskPriority, TeacherWorker } from '../types'

const TONE: Record<TaskPriority, 'rose' | 'gold' | 'sky'> = {
  urgent: 'rose',
  soon: 'gold',
  watch: 'sky',
}

export function Workers() {
  const { state, runWorkers, completeWorkerTask } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const staffForUser = state.staff.find((s) => s.email === user.email)

  const workers = useMemo(() => {
    return state.teacherWorkers.filter((w) => {
      const child = state.children.find((c) => c.id === w.childId)
      if (!child) return false
      if (user.role === 'parent') return user.childIds.includes(w.childId)
      if (user.role === 'teacher') {
        return w.staffId === staffForUser?.id || user.classroomIds.includes(child.classroomId)
      }
      return child.siteId === state.currentSiteId
    })
  }, [state, user, staffForUser])

  const [selectedId, setSelectedId] = useState(workers[0]?.id ?? '')
  const [tab, setTab] = useState<'needs' | 'report' | 'meal' | 'health' | 'education'>('needs')

  useEffect(() => {
    if (!workers.some((w) => w.id === selectedId)) setSelectedId(workers[0]?.id ?? '')
  }, [workers, selectedId])

  const runRef = useRef(runWorkers)
  runRef.current = runWorkers

  useEffect(() => {
    runRef.current()
    const id = window.setInterval(() => runRef.current(), 20000)
    return () => window.clearInterval(id)
  }, [])

  const worker = workers.find((w) => w.id === selectedId) ?? workers[0]

  return (
    <div>
      <PageHead
        title="Teacher workers"
        subtitle="Five caseload teachers monitor assigned children, then write a report plus meal, health, and education plans."
        actions={
          <Button onClick={() => runWorkers()}>
            <RefreshCw size={16} /> Run all now
          </Button>
        }
      />
      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {workers.map((w) => (
          <WorkerCard
            key={w.id}
            worker={w}
            active={w.id === worker?.id}
            onSelect={() => {
              setSelectedId(w.id)
              setTab('needs')
            }}
          />
        ))}
      </div>
      {worker ? <WorkerDesk worker={worker} tab={tab} setTab={setTab} completeWorkerTask={completeWorkerTask} /> : null}
    </div>
  )
}

function WorkerCard({
  worker,
  active,
  onSelect,
}: {
  worker: TeacherWorker
  active: boolean
  onSelect: () => void
}) {
  const { state } = useStore()
  const child = state.children.find((c) => c.id === worker.childId)
  const staff = state.staff.find((s) => s.id === worker.staffId)
  const open = state.workerTasks.filter((t) => t.workerId === worker.id && !t.done)
  const urgent = open.filter((t) => t.priority === 'urgent').length
  if (!child || !staff) return null
  return (
    <button
      className={`card w-full p-4 text-left ${active ? 'border-pine ring-2 ring-pine/20' : 'hover:border-pine'}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <Avatar name={staff.name} hue={staff.avatarHue} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{staff.name}</p>
          <p className="truncate text-[11px] text-muted">Teacher worker</p>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold">{childName(child)}</p>
      <p className="text-xs text-muted">
        {ageYears(child.dob)} · {state.classrooms.find((r) => r.id === child.classroomId)?.name}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Badge tone={urgent ? 'rose' : open.length ? 'gold' : 'pine'}>
          {open.length} open
        </Badge>
        <span className="text-[11px] text-muted">
          {worker.lastRunAt ? formatTime(worker.lastRunAt) : 'queued'}
        </span>
      </div>
    </button>
  )
}

function WorkerDesk({
  worker,
  tab,
  setTab,
  completeWorkerTask,
}: {
  worker: TeacherWorker
  tab: 'needs' | 'report' | 'meal' | 'health' | 'education'
  setTab: (t: 'needs' | 'report' | 'meal' | 'health' | 'education') => void
  completeWorkerTask: (id: string, done?: boolean) => void
}) {
  const { state } = useStore()
  const child = state.children.find((c) => c.id === worker.childId)!
  const staff = state.staff.find((s) => s.id === worker.staffId)!
  const tasks = state.workerTasks.filter((t) => t.workerId === worker.id)
  const report = state.workerReports.find((r) => r.workerId === worker.id)
  const meal = state.mealPlans.find((p) => p.workerId === worker.id)
  const health = state.healthPlans.find((p) => p.workerId === worker.id)
  const edu = state.educationPlans.find((p) => p.workerId === worker.id)

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine-soft text-pine">
            <Bot size={20} />
          </span>
          <div>
            <h2 className="font-display text-2xl">
              {staff.name} → {childName(child)}
            </h2>
            <p className="text-xs text-muted">
              Auto-monitor {worker.status}
              {worker.lastRunAt ? ` · last pass ${new Date(worker.lastRunAt).toLocaleTimeString()}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['needs', 'report', 'meal', 'health', 'education'] as const).map((t) => (
            <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setTab(t)}>
              {t === 'needs' ? 'Needs' : t === 'report' ? 'Report' : t === 'meal' ? 'Meal plan' : t === 'health' ? 'Health plan' : 'Education plan'}
            </Button>
          ))}
        </div>
      </div>

      {tab === 'needs' ? (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-start gap-3 rounded-xl border border-line px-3 py-3 ${t.done ? 'opacity-50' : ''}`}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={t.done}
                onChange={(e) => completeWorkerTask(t.id, e.target.checked)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{t.title}</p>
                  <Badge tone={TONE[t.priority]}>{t.priority}</Badge>
                  <Badge>{t.area}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{t.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'report' && report ? (
        <div>
          <p className="text-sm leading-relaxed">{report.summary}</p>
          <h3 className="mt-4 text-sm font-semibold">Highlights</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {report.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <h3 className="mt-4 text-sm font-semibold">Risks</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {report.risks.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === 'meal' && meal ? (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {meal.goals.map((g) => (
              <Badge key={g} tone="pine">
                {g}
              </Badge>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-3 py-2">Day</th>
                  <th>Breakfast</th>
                  <th>Lunch</th>
                  <th>Snacks</th>
                </tr>
              </thead>
              <tbody>
                {meal.days.map((d) => (
                  <tr key={d.day} className="border-t border-line align-top">
                    <td className="px-3 py-2 font-semibold">{d.day}</td>
                    <td className="py-2 pr-3">{d.breakfast}</td>
                    <td className="py-2 pr-3">{d.lunch}</td>
                    <td className="py-2 pr-3">
                      {d.snacks}
                      <p className="mt-1 text-xs text-muted">{d.notes}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'health' && health ? (
        <div className="grid gap-4 md:grid-cols-2">
          <PlanBlock title="Focus" items={health.focus} />
          <PlanBlock title="Medications" items={health.medications} />
          <PlanBlock title="Immunizations" items={health.immunizations} />
          <PlanBlock title="Monitoring" items={health.monitoring} />
          <div className="md:col-span-2">
            <PlanBlock title="Parent actions" items={health.parentActions} />
          </div>
        </div>
      ) : null}

      {tab === 'education' && edu ? (
        <div className="grid gap-4 md:grid-cols-2">
          <PlanBlock title="Domain focus" items={edu.domainFocus} />
          <PlanBlock title="This week" items={edu.thisWeek} />
          <PlanBlock title="Next steps" items={edu.nextSteps} />
          <PlanBlock title="Ideas for home" items={edu.homeIdeas} />
        </div>
      ) : null}
    </section>
  )
}

function PlanBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-sand px-4 py-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}
