import { useState } from 'react'
import { Badge, Button, Field, PageHead, inputClass } from '../components/ui'
import { useStore } from '../store'
import type { ApplicationStatus } from '../types'

const PIPELINE: ApplicationStatus[] = ['inquiry', 'tour', 'applied', 'waitlist', 'accepted', 'enrolled', 'declined']

export function Enrollment() {
  const { state, updateApplication, addApplication } = useStore()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    childName: '',
    dob: '',
    parentName: '',
    email: '',
    phone: '',
    desiredStart: '',
    classroomId: '',
    notes: '',
  })
  const rooms = state.classrooms.filter((r) => r.siteId === state.currentSiteId)

  return (
    <div>
      <PageHead
        title="Admissions pipeline"
        subtitle="Inquiry → tour → application → waitlist → offer → enrolled."
        actions={<Button onClick={() => setShow(true)}>New inquiry</Button>}
      />
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-4">
        {PIPELINE.filter((s) => s !== 'declined').map((col) => {
          const cards = state.applications.filter((a) => a.status === col)
          return (
            <section key={col} className="card min-w-[240px] flex-1 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold capitalize">{col}</h2>
                <Badge>{cards.length}</Badge>
              </div>
              <div className="space-y-2">
                {cards.map((a) => (
                  <article key={a.id} className="rounded-xl border border-line bg-white p-3">
                    <p className="font-semibold">{a.childName}</p>
                    <p className="text-xs text-muted">{a.parentName}</p>
                    <p className="mt-1 text-xs text-muted">Start {a.desiredStart}</p>
                    <p className="mt-1 text-xs">{a.notes}</p>
                    <select
                      className={`${inputClass} mt-2`}
                      value={a.status}
                      onChange={(e) => updateApplication(a.id, e.target.value as ApplicationStatus)}
                    >
                      {PIPELINE.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>
      {show ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4">
          <form
            className="card w-full max-w-lg space-y-3 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              addApplication({ ...form, classroomId: form.classroomId || rooms[0]?.id, status: 'inquiry' })
              setShow(false)
            }}
          >
            <h2 className="font-display text-xl">New family inquiry</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Child">
                <input className={inputClass} required value={form.childName} onChange={(e) => setForm({ ...form, childName: e.target.value })} />
              </Field>
              <Field label="DOB">
                <input className={inputClass} type="date" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </Field>
              <Field label="Parent">
                <input className={inputClass} required value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputClass} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Desired start">
                <input className={inputClass} type="date" value={form.desiredStart} onChange={(e) => setForm({ ...form, desiredStart: e.target.value })} />
              </Field>
            </div>
            <Field label="Room preference">
              <select className={inputClass} value={form.classroomId} onChange={(e) => setForm({ ...form, classroomId: e.target.value })}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShow(false)}>
                Cancel
              </Button>
              <Button type="submit">Add to pipeline</Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
