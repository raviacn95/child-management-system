import { pageRoot } from '../features/install/assets'

export const APPLIED_KEY = 'willow-applied-release'
export const RELOAD_GUARD = 'willow-release-reload'

export type LiveRelease = {
  id: string
  run?: number
  builtAt?: string
  channel?: string
  fallback?: string
}

export function parseRelease(raw: unknown): LiveRelease | null {
  if (!raw || typeof raw !== 'object') return null
  const id = String((raw as { id?: unknown }).id ?? '').trim()
  if (!id) return null
  const run = Number((raw as { run?: unknown }).run)
  return {
    id,
    run: Number.isFinite(run) ? run : 0,
    builtAt: typeof (raw as { builtAt?: unknown }).builtAt === 'string' ? (raw as { builtAt: string }).builtAt : undefined,
    channel: typeof (raw as { channel?: unknown }).channel === 'string' ? (raw as { channel: string }).channel : undefined,
    fallback: typeof (raw as { fallback?: unknown }).fallback === 'string' ? (raw as { fallback: string }).fallback : undefined,
  }
}

export function releaseUrl(fromHref?: string) {
  const href = fromHref ?? (typeof window !== 'undefined' ? window.location.href : 'https://raviacn95.github.io/child-management-system/')
  return new URL('release.json', pageRoot(href)).href
}

export function shouldApplyRemote(applied: string | null, remote: LiveRelease) {
  if (!remote.id || remote.id === 'dev' || remote.channel === 'local') return false
  return applied !== remote.id
}

export function nextLiveHref(currentHref: string, id: string) {
  const hashIndex = currentHref.indexOf('#')
  const page = hashIndex === -1 ? currentHref : currentHref.slice(0, hashIndex)
  const hash = hashIndex === -1 ? '' : currentHref.slice(hashIndex)
  const url = new URL(page)
  url.searchParams.set('willow', id.replace(/[^a-fA-F0-9]/g, '').slice(0, 12) || String(Date.now()))
  return `${url.href}${hash}`
}

export async function fetchLiveRelease(fromHref?: string, fetchImpl: typeof fetch = fetch) {
  const url = `${releaseUrl(fromHref)}?t=${Date.now()}`
  const res = await fetchImpl(url, { cache: 'no-store' })
  if (!res.ok) return null
  return parseRelease(await res.json())
}

export async function clearClientCaches() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((reg) => reg.unregister()))
  }
  if (typeof caches !== 'undefined') {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
}

export async function syncLiveRelease(opts?: {
  href?: string
  applied?: string | null
  location?: { href: string; replace: (url: string) => void }
  fetchImpl?: typeof fetch
  skipDev?: boolean
}) {
  if (opts?.skipDev !== false && import.meta.env.DEV) return { status: 'dev' as const }
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(RELOAD_GUARD) === '1') {
      sessionStorage.removeItem(RELOAD_GUARD)
      return { status: 'guard' as const }
    }
  } catch {
    /* private mode */
  }
  const remote = await fetchLiveRelease(opts?.href, opts?.fetchImpl).catch(() => null)
  if (!remote) return { status: 'missing' as const }
  const applied =
    opts?.applied !== undefined
      ? opts.applied
      : typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(APPLIED_KEY)
  if (!shouldApplyRemote(applied, remote)) return { status: 'current' as const, id: remote.id }
  try {
    sessionStorage.setItem(RELOAD_GUARD, '1')
    localStorage.setItem(APPLIED_KEY, remote.id)
  } catch {
    /* private mode */
  }
  await clearClientCaches()
  const loc = opts?.location ?? (typeof window === 'undefined' ? null : window.location)
  if (loc) loc.replace(nextLiveHref(loc.href, remote.id))
  return { status: 'reloading' as const, id: remote.id }
}

export async function forceReloadLive() {
  try {
    sessionStorage.removeItem(RELOAD_GUARD)
    localStorage.removeItem(APPLIED_KEY)
  } catch {
    /* private mode */
  }
  await clearClientCaches()
  if (typeof window !== 'undefined') window.location.replace(nextLiveHref(window.location.href, String(Date.now())))
}

export function listenForLiveRelease() {
  if (import.meta.env.DEV || typeof document === 'undefined') return () => undefined
  function onVisible() {
    if (document.visibilityState === 'visible') void syncLiveRelease()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}
