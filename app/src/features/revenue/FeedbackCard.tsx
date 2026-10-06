import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui'
import { sendFeedback } from './feedback'

export function FeedbackCard() {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const result = await sendFeedback(note)
    if (!result.ok) {
      setDone('')
      setError(result.error)
      return
    }
    setError('')
    setNote('')
    if (result.via === 'link' && result.href) {
      window.location.assign(result.href)
      setDone('Opening your message.')
      return
    }
    if (result.via === 'copy' && result.text) {
      try {
        await navigator.clipboard.writeText(result.text)
        setDone('Copied. Send it when you are ready.')
      } catch {
        setDone(result.text)
      }
      return
    }
    setDone('Thanks. That was sent.')
  }

  return (
    <form className="card mt-10 p-5" data-testid="feedback" onSubmit={submit}>
      <h2 className="font-display text-xl">What should we build next?</h2>
      <p className="mt-1 text-sm text-muted">One sentence is enough. Leave out child names and health details.</p>
      <textarea
        className="mt-3 w-full rounded-xl border border-line bg-transparent px-3 py-2 text-sm"
        value={note}
        maxLength={500}
        rows={3}
        aria-label="Feedback"
        onChange={(e) => setNote(e.target.value)}
      />
      <Button type="submit" className="mt-3" data-testid="feedback-send">
        Send feedback
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-clay">
          {error}
        </p>
      ) : null}
      {done ? <p className="mt-2 text-sm text-pine">{done}</p> : null}
    </form>
  )
}
