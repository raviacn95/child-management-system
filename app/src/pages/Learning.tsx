import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, PageHead, inputClass } from '../components/ui'
import { ChannelPack } from '../features/learning/ChannelPack'
import { isOn } from '../lib/flags'
import { childName } from '../lib'
import { packOf } from '../data/country'
import { useStore } from '../store'

export function Learning() {
  const { t } = useTranslation()
  const { state, addObservation } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const kids = state.children.filter((c) =>
    user.role === 'parent' ? user.childIds.includes(c.id) : c.siteId === state.currentSiteId && c.status === 'enrolled',
  )
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const [domain, setDomain] = useState(packOf(state.countryCode).learningDomains[0])
  const [notes, setNotes] = useState('')
  const [nextSteps, setNextSteps] = useState('')

  const obs = state.observations.filter((o) => kids.some((c) => c.id === o.childId))

  return (
    <div>
      <PageHead
        title={t('learning.title')}
        subtitle={`${packOf(state.countryCode).name} domains: ${packOf(state.countryCode).learningDomains.join(', ')}.`}
      />
      {user.role !== 'parent' ? (
        <form
          className="card mb-6 grid gap-3 p-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            addObservation({
              childId,
              date: new Date().toISOString().slice(0, 10),
              domain,
              notes,
              nextSteps,
              authorId: user.id,
            })
            setNotes('')
            setNextSteps('')
          }}
        >
          <Field label={t('learning.pickChild')}>
            <select className={inputClass} value={childId} onChange={(e) => setChildId(e.target.value)}>
              {kids.map((c) => (
                <option key={c.id} value={c.id}>
                  {childName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Domain">
            <select className={inputClass} value={domain} onChange={(e) => setDomain(e.target.value)}>
              {packOf(state.countryCode).learningDomains.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Observation">
            <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Field label="Next steps">
            <textarea className={inputClass} rows={2} value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} />
          </Field>
          <Button type="submit">Save observation</Button>
        </form>
      ) : null}
      <div className="space-y-3">
        {obs.map((o) => {
          const child = state.children.find((c) => c.id === o.childId)
          return (
            <article key={o.id} className="card p-4">
              <p className="text-xs tracking-wide text-muted uppercase">
                {o.domain} · {o.date}
              </p>
              <p className="font-semibold">{child ? childName(child) : o.childId}</p>
              <p className="mt-1 text-sm">{o.notes}</p>
              <p className="mt-1 text-sm text-pine">Next: {o.nextSteps}</p>
            </article>
          )
        })}
      </div>
      {isOn('learningChannels') ? <ChannelPack kids={kids} /> : null}
    </div>
  )
}
