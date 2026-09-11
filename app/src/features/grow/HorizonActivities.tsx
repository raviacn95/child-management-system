import { Link } from 'react-router-dom'
import { Badge, Button } from '../../components/ui'
import { ageMonths } from '../../lib'
import type { BmiBand, Child, HorizonLog, SkillId } from '../../types'
import { activityForSkill, planHorizonsForChild } from './horizons'
import { SKILLS } from '../../data/grow'

export function HorizonActivities({
  child,
  bmiBand,
  logs,
  onDone,
}: {
  child: Child
  bmiBand?: BmiBand
  logs: HorizonLog[]
  onDone: (activityId: string, skillId: SkillId, minutes: number) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const doneToday = new Set(
    logs.filter((l) => l.childId === child.id && l.at.slice(0, 10) === today).map((l) => l.activityId),
  )
  const plan = planHorizonsForChild(child, bmiBand, [...doneToday])

  return (
    <section data-testid="horizon-activities">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl">Horizon plan · {plan.label}</h2>
          <p className="mt-1 text-sm text-muted">{plan.science}</p>
          <p className="mt-1 text-sm">{plan.bmiCue}</p>
        </div>
        <Badge tone="pine">Ages {plan.ageBand}</Badge>
      </div>
      <div className="mb-4 rounded-xl border border-pine/30 bg-pine-soft p-4" data-testid="horizon-today">
        <p className="text-xs font-semibold tracking-wide text-pine uppercase">Today’s tasks</p>
        <ul className="mt-2 space-y-3">
          {plan.today.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">
                  {a.n}. {a.name}
                </p>
                <p className="text-sm text-ink">{a.task}</p>
                <p className="mt-1 text-xs text-muted">
                  {a.minutesToday} min · {SKILLS.find((s) => s.id === a.skillId)?.name}
                </p>
              </div>
              <Button
                variant={doneToday.has(a.id) ? 'soft' : 'primary'}
                onClick={() => onDone(a.id, a.skillId, a.minutesToday)}
              >
                {doneToday.has(a.id) ? 'Logged' : 'We did this'}
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {plan.activities.map((a) => (
          <li key={a.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">
                {a.n}. {a.name}
              </h3>
              {a.featured ? <Badge tone="gold">Today</Badge> : <Badge tone="sand">{a.minutesToday} min</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted">{a.why}</p>
            <p className="mt-2 text-sm">{a.task}</p>
            <Button className="mt-3" variant="soft" onClick={() => onDone(a.id, a.skillId, a.minutesToday)}>
              {doneToday.has(a.id) ? 'Logged' : 'Log activity'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SkillHorizonLine({
  child,
  skillId,
}: {
  child: Child
  skillId: SkillId
}) {
  const years = ageMonths(child.dob) / 12
  const activity = activityForSkill(skillId, years)
  if (!activity) return null
  const infant = years < 2
  return (
    <p className="mt-2 rounded-lg bg-sand px-2 py-1.5 text-xs text-ink" data-testid={`skill-activity-${skillId}`}>
      <span className="font-semibold">Activity · {activity.name}.</span>{' '}
      {infant && activity.infantTask ? activity.infantTask : activity.todayTask}
    </p>
  )
}

export function HorizonsPanel({
  kids,
  growthBand,
}: {
  kids: Child[]
  growthBand: (id: string) => BmiBand | undefined
}) {
  const sample = kids.slice(0, 3)
  if (!sample.length) return null
  return (
    <section className="card p-5" data-testid="horizons-panel" aria-labelledby="horizons-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="horizons-heading" className="font-display text-xl">
          Today’s horizons
        </h2>
        <Link to="/grow?tab=horizons" className="text-sm font-semibold text-pine">
          Grow at home →
        </Link>
      </div>
      <p className="mb-3 text-xs text-muted">15 evidence-based options. Daily tasks follow age band + BMI percentile.</p>
      <ul className="space-y-3">
        {sample.map((c) => {
          const plan = planHorizonsForChild(c, growthBand(c.id))
          const top = plan.today[0]
          return (
            <li key={c.id} className="rounded-xl border border-line p-3">
              <p className="font-semibold">
                {c.firstName} <span className="text-xs font-normal text-muted">· {plan.ageBand}</span>
              </p>
              {top ? (
                <p className="mt-1 text-sm">
                  {top.n}. {top.name} — {top.task}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted">{plan.bmiCue}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
