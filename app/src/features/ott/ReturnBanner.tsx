import { useEffect } from 'react'
import { Button } from '../../components/ui'
import type { AwaySession } from './returnSession'

export function ReturnBanner({
  away,
  onReturn,
  onKeep,
  onStop,
}: {
  away: AwaySession
  onReturn: () => void
  onKeep: () => void
  onStop: () => void
}) {
  useEffect(() => {
    document.querySelector<HTMLButtonElement>('[data-testid="return-now"]')?.focus()
  }, [])

  return (
    <div className="return-banner" data-testid="return-banner" role="status">
      <div className="return-banner-copy">
        <p className="font-semibold">Return to Willow™</p>
        <p className="text-xs text-muted">
          {away.label} is open outside this page. No child records were sent. Use Return, your device Back control, or
          this banner.
        </p>
      </div>
      <div className="return-banner-actions">
        <Button type="button" data-testid="return-now" onClick={onReturn}>
          Return now
        </Button>
        <Button type="button" variant="ghost" onClick={onKeep}>
          Keep playing
        </Button>
        <Button type="button" variant="soft" data-testid="return-stop" onClick={onStop}>
          Stop session
        </Button>
      </div>
    </div>
  )
}
