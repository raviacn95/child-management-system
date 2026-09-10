import { useState } from 'react'
import { Badge, Button, Field, PageHead, inputClass } from '../components/ui'
import { packOf } from '../data/country'
import { childName } from '../lib'
import { useStore } from '../store'
import type { IncidentSeverity } from '../types'

export function Health() {
  const { state, addIncident, administerMed, markVaccineGiven } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const visibleKids = state.children.filter((c) => (user.role === 'parent' ? user.childIds.includes(c.id) : c.siteId === state.currentSiteId))
  const ids = new Set(visibleKids.map((c) => c.id))
  const [tab, setTab] = useState<'vaccines' | 'meds' | 'incidents' | 'discipline'>('vaccines')
  const [inc, setInc] = useState({ childId: visibleKids[0]?.id ?? '', type: 'Fall', severity: 'low' as IncidentSeverity, description: '', action: '' })

  const staffId = state.staff.find((s) => s.email === user.email)?.id ?? 's-maya'
  const pack = packOf(state.countryCode)

  return (
    <div>
      <PageHead
        title="Health & safety"
        subtitle={`${pack.vaccineProgram}. ${pack.growthStandard}. Medication only with parent consent.`}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {(['vaccines', 'meds', 'incidents', 'discipline'] as const).map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      {tab === 'vaccines' ? (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Child</th>
                <th>Vaccine ({pack.code})</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.vaccinations
                .filter((v) => ids.has(v.childId))
                .map((v) => {
                  const child = state.children.find((c) => c.id === v.childId)
                  const tone = v.status === 'complete' ? 'pine' : v.status === 'overdue' ? 'rose' : v.status === 'due' ? 'gold' : 'sky'
                  return (
                    <tr key={v.id} className="border-t border-line">
                      <td className="px-4 py-3">{child ? childName(child) : v.childId}</td>
                      <td>{v.vaccine}</td>
                      <td>{v.dueDate}</td>
                      <td>
                        <Badge tone={tone}>{v.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.status !== 'complete' && user.role !== 'parent' ? (
                          <Button variant="soft" onClick={() => markVaccineGiven(v.id)}>
                            Mark given
                          </Button>
                        ) : (
                          v.givenDate ?? ''
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'meds' ? (
        <div className="space-y-3">
          {state.medications
            .filter((m) => ids.has(m.childId))
            .map((m) => {
              const child = state.children.find((c) => c.id === m.childId)
              return (
                <article key={m.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-sm text-muted">
                        {child ? childName(child) : ''} · {m.dosage} · {m.schedule}
                      </p>
                      <p className="text-xs text-muted">
                        Consent: {m.parentConsent ? 'yes' : 'no'} · {m.startDate} → {m.endDate}
                      </p>
                    </div>
                    {user.role !== 'parent' ? (
                      <Button onClick={() => administerMed(m.id, staffId, 'Recorded from Health desk')}>
                        Administer now
                      </Button>
                    ) : null}
                  </div>
                  {m.administrations.length ? (
                    <ul className="mt-3 text-xs text-muted">
                      {m.administrations.map((a, i) => (
                        <li key={i}>
                          {new Date(a.at).toLocaleString()} · {a.notes}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted">No administrations yet.</p>
                  )}
                </article>
              )
            })}
        </div>
      ) : null}

      {tab === 'incidents' ? (
        <div>
          {user.role !== 'parent' ? (
            <form
              className="card mb-4 grid gap-3 p-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                addIncident({
                  ...inc,
                  at: new Date().toISOString(),
                  notifiedParent: true,
                  staffId,
                })
                setInc({ ...inc, description: '', action: '' })
              }}
            >
              <Field label="Child">
                <select className={inputClass} value={inc.childId} onChange={(e) => setInc({ ...inc, childId: e.target.value })}>
                  {visibleKids.map((c) => (
                    <option key={c.id} value={c.id}>
                      {childName(c)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <input className={inputClass} value={inc.type} onChange={(e) => setInc({ ...inc, type: e.target.value })} />
              </Field>
              <Field label="Severity">
                <select className={inputClass} value={inc.severity} onChange={(e) => setInc({ ...inc, severity: e.target.value as IncidentSeverity })}>
                  <option>low</option>
                  <option>medium</option>
                  <option>high</option>
                </select>
              </Field>
              <Field label="Action taken">
                <input className={inputClass} value={inc.action} onChange={(e) => setInc({ ...inc, action: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="What happened">
                  <textarea className={inputClass} rows={2} value={inc.description} onChange={(e) => setInc({ ...inc, description: e.target.value })} />
                </Field>
              </div>
              <Button type="submit">File incident</Button>
            </form>
          ) : null}
          <div className="space-y-3">
            {state.incidents
              .filter((i) => ids.has(i.childId))
              .map((i) => {
                const child = state.children.find((c) => c.id === i.childId)
                return (
                  <article key={i.id} className="card p-4">
                    <div className="flex items-center gap-2">
                      <Badge tone={i.severity === 'high' ? 'rose' : i.severity === 'medium' ? 'gold' : 'sand'}>
                        {i.severity}
                      </Badge>
                      <span className="font-semibold">{i.type}</span>
                      <span className="text-sm text-muted">{child ? childName(child) : ''}</span>
                    </div>
                    <p className="mt-2 text-sm">{i.description}</p>
                    <p className="mt-1 text-sm text-muted">{i.action}</p>
                    <p className="mt-1 text-xs text-muted">
                      Parent notified: {i.notifiedParent ? 'yes' : 'no'} · {new Date(i.at).toLocaleString()}
                    </p>
                  </article>
                )
              })}
          </div>
        </div>
      ) : null}

      {tab === 'discipline' ? (
        <ul className="space-y-3">
          {state.discipline
            .filter((d) => ids.has(d.childId))
            .map((d) => {
              const child = state.children.find((c) => c.id === d.childId)
              return (
                <li key={d.id} className="card p-4 text-sm">
                  <p className="font-semibold">{child ? childName(child) : d.childId}</p>
                  <p className="mt-1">{d.note}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(d.at).toLocaleString()}</p>
                </li>
              )
            })}
        </ul>
      ) : null}
    </div>
  )
}
