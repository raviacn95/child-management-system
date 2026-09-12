import { useMemo, useState } from 'react'
import { Avatar, Badge, Button, Field, PageHead, inputClass } from '../components/ui'
import { today } from '../data/seed'
import { childName } from '../lib'
import { useStore } from '../store'
import type { AttendanceMethod } from '../types'

export function Attendance() {
  const { state, checkIn, checkOut } = useStore()
  const t = today()
  const [person, setPerson] = useState('Parent / guardian')
  const [method, setMethod] = useState<AttendanceMethod>('pin')
  const [pin, setPin] = useState('')
  const [filter, setFilter] = useState('')
  const user = state.users.find((u) => u.id === state.currentUserId)!

  const kids = useMemo(
    () =>
      state.children.filter((c) => {
        if (c.status !== 'enrolled' || c.siteId !== state.currentSiteId) return false
        if (user.role === 'teacher' && user.classroomIds.length && !user.classroomIds.includes(c.classroomId)) {
          return false
        }
        return childName(c).toLowerCase().includes(filter.toLowerCase())
      }),
    [state, user, filter],
  )

  const present = kids.filter((c) =>
    state.attendance.some((a) => a.childId === c.id && a.date === t && a.checkIn && !a.checkOut),
  ).length

  function verifyPin(childId: string) {
    if (method !== 'pin') return true
    const ok = [
      ...state.guardians.filter((g) => g.childIds.includes(childId)),
      ...state.pickups.filter((p) => p.childId === childId),
    ].some((p) => 'pin' in p && p.pin === pin)
    return ok
  }

  return (
    <div>
      <PageHead
        title="Attendance & handoff"
        subtitle="PIN, photo, kiosk, or staff-verified pickup. Full audit trail."
      />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="card p-4 md:col-span-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Kiosk</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Who is signing">
              <input className={inputClass} value={person} onChange={(e) => setPerson(e.target.value)} />
            </Field>
            <Field label="Method">
              <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as AttendanceMethod)}>
                <option value="pin">PIN</option>
                <option value="photo">Photo ID</option>
                <option value="kiosk">Kiosk</option>
                <option value="staff">Staff override</option>
              </select>
            </Field>
            {method === 'pin' ? (
              <Field label="Pickup PIN">
                <input className={inputClass} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Authorized PIN" type="password" inputMode="numeric" />
              </Field>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-muted">Enter the family’s authorized pickup PIN. Willow never shows PINs on child profiles.</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">In building</p>
          <p className="font-display mt-2 text-3xl">{present}</p>
          <p className="text-xs text-muted">of {kids.length} expected</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Today’s handoffs</p>
          <p className="font-display mt-2 text-3xl">
            {state.handoffs.filter((h) => h.at.startsWith(t)).length}
          </p>
        </div>
      </div>
      <input className={`${inputClass} mb-4 max-w-sm`} placeholder="Find a child" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Child</th>
              <th>In</th>
              <th>Out</th>
              <th>Method</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {kids.map((c) => {
              const att = state.attendance.find((a) => a.childId === c.id && a.date === t)
              const here = Boolean(att?.checkIn && !att?.checkOut)
              return (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={childName(c)} hue={c.avatarHue} size={32} />
                      <span>
                        {childName(c)}
                        {c.custodyNotes ? (
                          <span className="ml-2">
                            <Badge tone="rose">custody</Badge>
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td>{att?.checkIn ?? '—'}</td>
                  <td>{att?.checkOut ?? '—'}</td>
                  <td>{att?.method ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {here ? (
                      <Button
                        variant="soft"
                        onClick={() => checkOut(c.id, person)}
                      >
                        Check out
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          if (!verifyPin(c.id)) {
                            alert('PIN does not match an authorized pickup for this child.')
                            return
                          }
                          checkIn(c.id, method, person)
                        }}
                      >
                        Check in
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <h2 className="font-display mt-8 text-xl">Handoff log</h2>
      <ul className="mt-3 space-y-2">
        {state.handoffs.slice(0, 12).map((h) => {
          const child = state.children.find((c) => c.id === h.childId)
          return (
            <li key={h.id} className="card flex items-center justify-between px-4 py-3 text-sm">
              <span>
                <strong>{child ? childName(child) : h.childId}</strong> · {h.type} · {h.personName}
              </span>
              <span className="text-muted">
                {h.method} {h.verified ? '· verified' : ''}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
