import { useState } from 'react'
import { Avatar, Badge, Button, Field, PageHead, inputClass } from '../components/ui'
import { today } from '../data/seed'
import { childName } from '../lib'
import { useStore } from '../store'
import type { MealLog } from '../types'

export function DailyCare() {
  const { state, addMeal, addDailyLog } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const t = today()
  const kids = state.children.filter((c) => {
    if (c.status !== 'enrolled') return false
    if (user.role === 'parent') return user.childIds.includes(c.id)
    if (c.siteId !== state.currentSiteId) return false
    return true
  })
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const [meal, setMeal] = useState<MealLog>({ time: '12:00', type: 'Lunch', items: '', amount: 'all' })
  const [nap, setNap] = useState({ start: '13:00', end: '14:30', notes: '', mood: 'Happy' })

  const logs = state.dailyLogs.filter((d) => kids.some((c) => c.id === d.childId))

  return (
    <div>
      <PageHead
        title="Daily care"
        subtitle="Meals, naps, diapers, mood, activities, and photos — the parent-facing diary."
      />
      {user.role !== 'parent' ? (
        <div className="card mb-6 grid gap-3 p-4 md:grid-cols-5">
          <Field label="Child">
            <select className={inputClass} value={childId} onChange={(e) => setChildId(e.target.value)}>
              {kids.map((c) => (
                <option key={c.id} value={c.id}>
                  {childName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Meal">
            <input className={inputClass} value={meal.type} onChange={(e) => setMeal({ ...meal, type: e.target.value })} />
          </Field>
          <Field label="Items">
            <input className={inputClass} value={meal.items} onChange={(e) => setMeal({ ...meal, items: e.target.value })} />
          </Field>
          <Field label="Amount">
            <select className={inputClass} value={meal.amount} onChange={(e) => setMeal({ ...meal, amount: e.target.value as MealLog['amount'] })}>
              <option>all</option>
              <option>most</option>
              <option>some</option>
              <option>none</option>
            </select>
          </Field>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => childId && addMeal(childId, t, { ...meal, time: new Date().toTimeString().slice(0, 5) })}>
              Log meal
            </Button>
          </div>
          <Field label="Nap start">
            <input className={inputClass} value={nap.start} onChange={(e) => setNap({ ...nap, start: e.target.value })} />
          </Field>
          <Field label="Nap end">
            <input className={inputClass} value={nap.end} onChange={(e) => setNap({ ...nap, end: e.target.value })} />
          </Field>
          <Field label="Mood">
            <input className={inputClass} value={nap.mood} onChange={(e) => setNap({ ...nap, mood: e.target.value })} />
          </Field>
          <Field label="Notes">
            <input className={inputClass} value={nap.notes} onChange={(e) => setNap({ ...nap, notes: e.target.value })} />
          </Field>
          <div className="flex items-end">
            <Button
              variant="soft"
              className="w-full"
              onClick={() =>
                childId &&
                addDailyLog({
                  childId,
                  date: t,
                  meals: [],
                  naps: [{ start: nap.start, end: nap.end }],
                  diapers: [],
                  mood: nap.mood,
                  activities: [],
                  notes: nap.notes,
                  photos: 0,
                  authorId: user.id,
                })
              }
            >
              Log nap / note
            </Button>
          </div>
        </div>
      ) : null}
      <div className="space-y-4">
        {logs.map((log) => {
          const child = state.children.find((c) => c.id === log.childId)
          if (!child) return null
          return (
            <article key={log.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={childName(child)} hue={child.avatarHue} />
                <div>
                  <p className="font-semibold">{childName(child)}</p>
                  <p className="text-xs text-muted">{log.date} · {log.mood || 'Mood not set'}</p>
                </div>
                {log.photos ? <Badge tone="sky">{log.photos} photos</Badge> : null}
              </div>
              {log.meals.length ? (
                <ul className="mt-3 space-y-1 text-sm">
                  {log.meals.map((m, i) => (
                    <li key={i}>
                      <strong>{m.type}</strong> {m.time} — {m.items} ({m.amount})
                    </li>
                  ))}
                </ul>
              ) : null}
              {log.naps.length ? (
                <p className="mt-2 text-sm">Naps: {log.naps.map((n) => `${n.start}–${n.end}`).join(', ')}</p>
              ) : null}
              {log.diapers.length ? (
                <p className="mt-2 text-sm">Diapers: {log.diapers.map((d) => `${d.time} ${d.type}`).join(' · ')}</p>
              ) : null}
              {log.activities.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {log.activities.map((a) => (
                    <Badge key={a} tone="pine">
                      {a}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {log.notes ? <p className="mt-2 text-sm text-muted">{log.notes}</p> : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
