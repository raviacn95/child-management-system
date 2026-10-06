import { useEffect, useState } from 'react'
import { Button } from '../../components/ui'
import { checkLiveUpdate, updateLiveWillow, type LiveRelease } from '../../lib/liveRelease'

export function UpdateBanner() {
  const [ready, setReady] = useState(false)
  const [release, setRelease] = useState<LiveRelease | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV) return
    let cancelled = false
    void checkLiveUpdate()
      .then((check) => {
        if (!cancelled && (check.status === 'available' || check.status === 'stale-shell')) {
          setRelease(check.remote)
          setReady(true)
        }
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
        New Willow update{release?.name ? `: ${release.name}` : ''}. {release?.changes ?? 'A refreshed Willow build is ready.'}{' '}
        Update this app — do not uninstall. Child records stay on this device.
      </p>
      <Button type="button" data-testid="update-willow" onClick={() => void updateLiveWillow()}>
        Update
      </Button>
    </div>
  )
}
