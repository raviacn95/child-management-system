import { useEffect, useState } from 'react'
import { Button } from '../../components/ui'
import { checkLiveUpdate, updateLiveWillow } from '../../lib/liveRelease'

export function UpdateBanner() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return
    let cancelled = false
    void checkLiveUpdate()
      .then((check) => {
        if (!cancelled && (check.status === 'available' || check.status === 'stale-shell')) setReady(true)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) return null

  return (
    <div className="update-banner" data-testid="update-banner" role="status">
      <p className="text-sm">
        A newer Willow is on the official source. Update this app — do not uninstall. Child records stay on this
        device.
      </p>
      <Button type="button" data-testid="update-willow" onClick={() => void updateLiveWillow()}>
        Update
      </Button>
    </div>
  )
}
