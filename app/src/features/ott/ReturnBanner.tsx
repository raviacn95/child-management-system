import { useEffect } from 'react'
import { Button } from '../../components/ui'
import type { AwaySession } from './returnSession'

export function ReturnBanner({
  away,
  onReturn,
  onKeep,
}: {
  away: AwaySession
  onReturn: () => void
  onKeep: () => void
}) {
  useEffect(() => {
    document.querySelector<HTMLButtonElement>('[data-testid="return-now"]')?.focus()
  }, [])

  return (
    <div className="return-banner" data-testid="return-banner" role="status">
      <div className="return-banner-copy">
        <p className="font-semibold">Return to Willow™</p>
        <p className="text-xs text-muted">
          {away.label} is open. Use Return or your device Back control to come back.
        </p>
      </div>
      <div className="return-banner-actions">
        <Button type="button" data-testid="return-now" onClick={onReturn}>
          Return now
        </Button>
        <Button type="button" variant="ghost" data-testid="return-keep" onClick={onKeep}>
          Keep playing
        </Button>
      </div>
    </div>
  )
}
