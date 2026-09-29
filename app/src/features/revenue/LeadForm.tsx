import { useState, type FormEvent } from 'react'
import { Button, Field, inputClass } from '../../components/ui'
import { LEAD_KINDS, submitLead, type LeadKind } from './leads'
import { referralFrom } from './referral'

type Draft = { kind: LeadKind; org: string; city: string; size: string; contact: string; message: string }

const EMPTY: Draft = { kind: 'center', org: '', city: '', size: '', contact: '', message: '' }

export function LeadForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((cur) => ({ ...cur, [key]: value }))
    setError('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    const result = await submitLead({ ...draft, size: draft.size || 0 }, { ref: referralFrom() })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (result.via === 'endpoint') setStatus('Thanks — we will reach out within one working day.')
    if (result.via === 'whatsapp' || result.via === 'email') {
      window.open(result.href, '_blank', 'noopener')
      setStatus(`Opening ${result.via === 'whatsapp' ? 'WhatsApp' : 'your email app'} with your details — press Send.`)
    }
    if (result.via === 'copy') {
      try {
        await navigator.clipboard.writeText(result.text)
        setStatus('Details copied. Paste them in a message to the Willow team.')
      } catch {
        setStatus(result.text)
      }
    }
    setDraft(EMPTY)
  }

  return (
    <form className="card p-5" data-testid="lead-form" onSubmit={(e) => void submit(e)}>
      <h2 className="font-display text-2xl font-semibold">Talk to us</h2>
      <p className="mt-1 text-sm text-muted">
        Daycares, schools, parenting creators and brands. Share only organisation details — never child information.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="I am a">
          <select
            className={inputClass}
            value={draft.kind}
            onChange={(e) => update('kind', e.target.value as LeadKind)}
            data-testid="lead-kind"
          >
            {LEAD_KINDS.map((kind) => (
              <option key={kind.id} value={kind.id}>
                {kind.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Organisation">
          <input className={inputClass} value={draft.org} onChange={(e) => update('org', e.target.value)} data-testid="lead-org" />
        </Field>
        <Field label="City">
          <input className={inputClass} value={draft.city} onChange={(e) => update('city', e.target.value)} data-testid="lead-city" />
        </Field>
        <Field label="Children or audience size">
          <input
            className={inputClass}
            inputMode="numeric"
            value={draft.size}
            onChange={(e) => update('size', e.target.value.replace(/\D/g, '').slice(0, 6))}
            data-testid="lead-size"
          />
        </Field>
        <Field label="Work email or phone">
          <input
            className={inputClass}
            value={draft.contact}
            onChange={(e) => update('contact', e.target.value)}
            autoComplete="email"
            data-testid="lead-contact"
          />
        </Field>
        <Field label="Message (optional)">
          <input className={inputClass} value={draft.message} onChange={(e) => update('message', e.target.value)} data-testid="lead-message" />
        </Field>
      </div>
      <Button type="submit" className="mt-4" disabled={busy} data-testid="lead-submit">
        {busy ? 'Sending…' : 'Book a demo'}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-rose" role="alert" data-testid="lead-error">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="mt-2 whitespace-pre-line text-sm text-muted" data-testid="lead-status">
          {status}
        </p>
      ) : null}
    </form>
  )
}
