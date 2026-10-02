import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FRESH_FEED_FILE,
  FRESH_POLL_MS,
  loadFreshCache,
  mergeFreshFeed,
  parseFreshFeed,
  saveFreshCache,
  type FreshCache,
} from './fresh'

export type FreshStatus = 'idle' | 'loading' | 'error'

const WAKE_THROTTLE_MS = 60 * 1000

async function fetchFeed() {
  const res = await fetch(`${import.meta.env.BASE_URL}${FRESH_FEED_FILE}?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const feed = parseFreshFeed(await res.json())
  if (!feed) throw new Error('Feed failed validation')
  return feed
}

/** This year's releases, re-checked every 10 minutes and whenever the screen comes back into view. */
export function useFreshMovies(enabled = true) {
  const [cache, setCache] = useState<FreshCache | null>(() => loadFreshCache())
  const [status, setStatus] = useState<FreshStatus>('idle')
  const cacheRef = useRef(cache)
  const busy = useRef(false)
  const lastRun = useRef(0)

  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    lastRun.current = Date.now()
    setStatus('loading')
    try {
      const feed = await fetchFeed()
      const prev = cacheRef.current
      const next =
        prev && prev.feed.generatedAt === feed.generatedAt
          ? { ...prev, checkedAt: new Date().toISOString() }
          : mergeFreshFeed(prev, feed, new Date())
      cacheRef.current = next
      saveFreshCache(next)
      setCache(next)
      setStatus('idle')
    } catch (error) {
      console.warn('Fresh movies refresh failed', error)
      setStatus('error')
    } finally {
      busy.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const timer = window.setInterval(() => void refresh(), FRESH_POLL_MS)
    const onWake = () => {
      if (Date.now() - lastRun.current >= WAKE_THROTTLE_MS) void refresh()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') onWake()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onWake)
    window.addEventListener('online', onWake)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onWake)
      window.removeEventListener('online', onWake)
    }
  }, [enabled, refresh])

  return { cache: enabled ? cache : null, status, refresh }
}
