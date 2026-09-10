import { useState } from 'react'
import { Badge, Button, Field, PageHead, inputClass } from '../components/ui'
import { useStore } from '../store'
import type { CalendarEvent } from '../types'

const TONE: Record<CalendarEvent['type'], 'pine' | 'clay' | 'sky' | 'gold' | 'rose'> = {
  event: 'pine',
  trip: 'sky',
  meeting: 'gold',
  closure: 'rose',
  holiday: 'clay',
}

export function CalendarPage() {
  const { state, addEvent } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<CalendarEvent['type']>('event')
  const events = [...state.events].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <PageHead title="Calendar" subtitle="Closures, trips, picture day, staff meetings, and family events." />
      {user.role !== 'parent' ? (
        <form
          className="card mb-6 flex flex-wrap items-end gap-3 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (title && date) {
              addEvent(title, date, type)
              setTitle('')
            }
          }}
        >
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Date">
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as CalendarEvent['type'])}>
              <option>event</option>
              <option>trip</option>
              <option>meeting</option>
              <option>closure</option>
              <option>holiday</option>
            </select>
          </Field>
          <Button type="submit">Add</Button>
        </form>
      ) : null}
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="card flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-xs text-muted">
                {e.date} · {e.start}–{e.end}
              </p>
            </div>
            <Badge tone={TONE[e.type]}>{e.type}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
