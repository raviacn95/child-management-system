import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, PageHead, inputClass } from '../components/ui'
import { ChannelPack } from '../features/learning/ChannelPack'
import { isOn } from '../lib/flags'
import { childName } from '../lib'
import { packOf } from '../data/country'
import { useStore } from '../store'
import { apiPost } from '../api/client'
import { ageBandFromYears, interestsForChild, yearsFromDob } from '../features/learning/recommend'
import { z } from 'zod'

const grokCoachSchema = z.object({ configured: z.boolean(), text: z.string().optional(), message: z.string().optional() })

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
  const [coachText, setCoachText] = useState('')
  const [coachBusy, setCoachBusy] = useState(false)
  const [coachMessage, setCoachMessage] = useState('')

  const obs = state.observations.filter((o) => kids.some((c) => c.id === o.childId))
  const selectedChild = kids.find((c) => c.id === childId) ?? kids[0]

  async function askGrok() {
    if (!selectedChild) return
    setCoachBusy(true)
    setCoachMessage('')
    try {
      const result = await apiPost(
        '/qc-api/grok/learning-coach',
        {
          ageBand: ageBandFromYears(yearsFromDob(selectedChild.dob)),
          interests: interestsForChild(selectedChild),
          countryCode: state.countryCode,
          module: 'learning',
        },
        grokCoachSchema,
      )
      setCoachText(result.text ?? '')
      setCoachMessage(result.message ?? '')
    } catch {
      setCoachText('')
      setCoachMessage('The AI coach is unavailable. Willow local recommendations remain available.')
    } finally {
      setCoachBusy(false)
    }
  }

  return (
    <div>
      <PageHead
        title={t('learning.title')}
        subtitle={`${packOf(state.countryCode).name} domains: ${packOf(state.countryCode).learningDomains.join(', ')}.`}
      />
      <section className="card mb-6 p-4" data-testid="grok-learning-coach">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Willow Coach</h2>
            <p className="mt-1 text-sm text-muted">Optional AI ideas use only age band, interests, country, and module. Names, notes, allergies, and IDs stay local.</p>
          </div>
          <Button type="button" variant="soft" disabled={coachBusy || !selectedChild} onClick={() => void askGrok()}>
            {coachBusy ? 'Thinking…' : 'Create activity ideas'}
          </Button>
        </div>
        {coachMessage ? <p className="mt-3 text-sm text-muted">{coachMessage}</p> : null}
        {coachText ? <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-line bg-sand p-3 text-sm">{coachText}</pre> : null}
      </section>
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
