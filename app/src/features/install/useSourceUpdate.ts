import { useCallback, useState } from 'react'
import { sourceStatusCopy, updateLiveWillow, type SourceCheck } from '../../lib/liveRelease'

export function useSourceUpdate() {
  const [phase, setPhase] = useState<'idle' | 'checking' | SourceCheck['status'] | 'reloading'>('idle')
  const [message, setMessage] = useState('')

  const run = useCallback(async () => {
    setPhase('checking')
    setMessage('Checking the official Willow source…')
    const result = await updateLiveWillow()
    setPhase(result.status)
    setMessage(sourceStatusCopy(result))
    return result
  }, [])

  return {
    busy: phase === 'checking' || phase === 'reloading' || phase === 'available' || phase === 'stale-shell',
    headerLabel: phase === 'checking' ? 'Checking' : phase === 'current' || phase === 'guard' ? 'Up to date' : 'Update',
    message,
    phase,
    run,
  }
}
