import { useEffect, useState } from 'react'
import { Button } from '../../components/ui'
import { APPLIED_KEY, fetchLiveRelease, hasStaleShellQuery, shouldApplyRemote, updateLiveWillow } from '../../lib/liveRelease'

export function UpdateBanner() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return
    let cancelled = false
    void fetchLiveRelease()
      .then((remote) => {
        if (cancelled || !remote) return
        const applied = typeof localStorage === 'undefined' ? null : localStorage.getItem(APPLIED_KEY)
        if (shouldApplyRemote(applied, remote) || hasStaleShellQuery(window.location.href)) setReady(true)
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
        A newer Willow is ready. Update this app — do not uninstall. Child records stay on this device.
      </p>
      <Button type="button" data-testid="update-willow" onClick={() => void updateLiveWillow()}>
        Update
      </Button>
    </div>
  )
}
