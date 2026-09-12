import { useMemo, useState } from 'react'
import { Avatar, Badge, Button, Field, PageHead, inputClass } from '../components/ui'
import { ageYears, childName } from '../lib'
import { packOf } from '../data/country'
import { useStore } from '../store'
import type { ChildStatus } from '../types'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function ChildrenPage() {
  const { state, addChild, updateChild } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', classroomId: '', gender: 'Girl' })

  const list = useMemo(() => {
    return state.children.filter((c) => {
      if (c.siteId !== state.currentSiteId && user.role === 'director') {
        /* still filter current site */
      }
      if (user.role === 'director' && c.siteId !== state.currentSiteId) return false
      if (user.role === 'teacher') {
        const rooms = user.classroomIds.length ? user.classroomIds : ['room-oaks']
        if (!rooms.includes(c.classroomId) && c.status === 'enrolled') {
          /* teachers see their room + waitlist of site */
          if (c.status === 'enrolled') return rooms.includes(c.classroomId)
        }
        if (c.status === 'enrolled' && !rooms.includes(c.classroomId)) return false
      }
      if (user.role === 'parent' && !user.childIds.includes(c.id)) return false
      const hay = `${c.firstName} ${c.lastName}`.toLowerCase()
      return hay.includes(q.toLowerCase())
    })
  }, [state, user, q])

  const selected = state.children.find((c) => c.id === open)

  return (
    <div>
      <PageHead
        title="Children"
        subtitle={`Profiles with ${packOf(state.countryCode).idLabel}, blood group, mother tongue, diet, tiffin, van route, and ${packOf(state.countryCode).stages.map((s) => s.label).join('/')} stage — as in Indian preschool ERPs.`}
        actions={
          user.role !== 'parent' ? (
            <Button onClick={() => setAdding(true)}>Add child</Button>
          ) : null
        }
      />
      <input
        className={`${inputClass} mb-5 max-w-md`}
        placeholder="Search children"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="grid gap-3">
        {list.map((c) => {
          const room = state.classrooms.find((r) => r.id === c.classroomId)
          return (
            <button
              key={c.id}
              className="card flex w-full items-center gap-4 px-4 py-3 text-left hover:border-pine"
              onClick={() => setOpen(c.id)}
            >
              <Avatar name={childName(c)} hue={c.avatarHue} size={44} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {childName(c)} <span className="font-normal text-muted">· {ageYears(c.dob)}</span>
                </p>
                <p className="text-xs text-muted">
                  {room?.name} · {c.gender} · enrolled {c.enrollmentDate || '—'}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {c.allergies.map((a) => (
                  <Badge key={a.name} tone={a.severity === 'severe' ? 'rose' : 'gold'}>
                    {a.name}
                  </Badge>
                ))}
                <Badge tone={c.status === 'enrolled' ? 'pine' : 'sky'}>{c.status}</Badge>
              </div>
            </button>
          )
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink/30" onClick={() => setOpen(null)}>
          <aside className="scrollbar-thin h-full w-full max-w-xl overflow-y-auto bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={childName(selected)} hue={selected.avatarHue} size={52} />
                <div>
                  <h2 className="font-display text-2xl">{childName(selected)}</h2>
                  <p className="text-sm text-muted">
                    {ageYears(selected.dob)} · DOB {selected.dob}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setOpen(null)}>
                Close
              </Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Info label="Room" value={state.classrooms.find((r) => r.id === selected.classroomId)?.name ?? '—'} />
              <Info label="Status" value={selected.status} />
              <Info label="Stage" value={selected.stage ?? '—'} />
              <Info label="Blood group" value={selected.bloodGroup ?? '—'} />
              <Info label="Mother tongue" value={selected.motherTongue ?? '—'} />
              <Info label="Diet" value={selected.dietType || selected.foodPreferences || 'No notes'} />
              <Info label="Tiffin" value={selected.tiffin ? 'Yes' : 'Home packed / milk'} />
              <Info label={packOf(state.countryCode).idLabel} value={selected.idLast4 ? `••••${selected.idLast4}` : 'Not on file'} />
              <Info label="Food" value={selected.foodPreferences || 'No notes'} />
              <Info label="Medical" value={selected.medicalNotes || 'None'} />
            </div>
            <h3 className="mt-6 text-sm font-semibold">Allergies</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {selected.allergies.length ? selected.allergies.map((a) => (
                <Badge key={a.name} tone={a.severity === 'severe' ? 'rose' : 'gold'}>
                  {a.name} · {a.severity}
                </Badge>
              )) : <span className="text-sm text-muted">None recorded</span>}
            </div>
            {selected.custodyNotes ? (
              <p className="mt-4 rounded-xl bg-rose-soft px-3 py-2 text-sm text-rose">{selected.custodyNotes}</p>
            ) : null}
            <h3 className="mt-6 text-sm font-semibold">Weekly schedule</h3>
            <div className="mt-2 flex gap-1">
              {DAYS.map((d, i) => (
                <span
                  key={`${d}-${i}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold ${
                    selected.weeklySchedule[i] ? 'bg-pine text-white' : 'bg-sand text-muted'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>
            <h3 className="mt-6 text-sm font-semibold">Guardians</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {state.guardians
                .filter((g) => g.childIds.includes(selected.id))
                .map((g) => (
                  <li key={g.id} className="rounded-xl border border-line px-3 py-2">
                    <strong>{g.name}</strong> · {g.relationship} · {g.phone}
                    {g.authorizedPickup ? ' · PIN set (handoff desk only)' : ''}
                  </li>
                ))}
            </ul>
            <h3 className="mt-6 text-sm font-semibold">Authorized pickup</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {state.pickups
                .filter((p) => p.childId === selected.id)
                .map((p) => (
                  <li key={p.id} className="rounded-xl border border-line px-3 py-2">
                    {p.name} · {p.relationship} · PIN set (handoff desk only)
                  </li>
                ))}
            </ul>
            <h3 className="mt-6 text-sm font-semibold">Emergency / healthcare</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {state.emergencies
                .filter((p) => p.childId === selected.id)
                .map((p) => (
                  <li key={p.id}>
                    {p.name} · {p.relationship} · {p.phone}
                  </li>
                ))}
            </ul>
            {user.role === 'director' ? (
              <div className="mt-6">
                <Field label="Enrollment status">
                  <select
                    className={inputClass}
                    value={selected.status}
                    onChange={(e) => updateChild(selected.id, { status: e.target.value as ChildStatus })}
                  >
                    <option value="inquiry">inquiry</option>
                    <option value="waitlist">waitlist</option>
                    <option value="enrolled">enrolled</option>
                    <option value="withdrawn">withdrawn</option>
                  </select>
                </Field>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {adding ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4">
          <form
            className="card w-full max-w-md space-y-3 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              addChild({
                ...form,
                classroomId: form.classroomId || state.classrooms.find((r) => r.siteId === state.currentSiteId)?.id || '',
                siteId: state.currentSiteId,
                status: 'enrolled',
                allergies: [],
                medicalNotes: '',
                custodyNotes: '',
                foodPreferences: '',
                enrollmentDate: new Date().toISOString().slice(0, 10),
                parentIds: [],
                weeklySchedule: [true, true, true, true, true, false, false],
              })
              setAdding(false)
            }}
          >
            <h2 className="font-display text-xl">Enroll a child</h2>
            <Field label="First name">
              <input className={inputClass} required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Last name">
              <input className={inputClass} required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
            <Field label="Date of birth">
              <input className={inputClass} type="date" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Classroom">
              <select className={inputClass} value={form.classroomId} onChange={(e) => setForm({ ...form, classroomId: e.target.value })}>
                <option value="">Select</option>
                {state.classrooms
                  .filter((r) => r.siteId === state.currentSiteId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  )
}
