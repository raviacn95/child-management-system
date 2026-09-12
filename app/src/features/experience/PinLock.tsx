import { useState } from 'react'
import { Button, inputClass } from '../../components/ui'
import { useExperience } from './ExperienceProvider'
import { pinsMatch } from './profile'

export function PinLock() {
  const { profile, patch } = useExperience()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  if (!profile.locked || !profile.pin) return null

  return (
    <div className="pin-lock" data-testid="pin-lock" role="dialog" aria-modal="true" aria-labelledby="pin-lock-title">
      <form
        className="card pin-lock-card p-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (pinsMatch(pin, profile.pin)) {
            patch({ locked: false })
            setPin('')
            setError('')
            return
          }
          setError('That PIN does not match this profile.')
        }}
      >
        <h2 id="pin-lock-title" className="font-display text-2xl">
          Unlock this profile
        </h2>
        <p className="mt-1 text-sm text-muted">Child records stay on this device. Enter the profile PIN to continue.</p>
        <input
          className={`${inputClass} mt-4`}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          aria-label="Profile PIN"
          data-testid="pin-lock-input"
        />
        {error ? <p className="mt-2 text-sm text-rose">{error}</p> : null}
        <Button className="mt-4 w-full" type="submit">
          Unlock
        </Button>
      </form>
    </div>
  )
}
