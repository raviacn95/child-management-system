import { isLocalAppHost, isOfficialSource, isTrustedSource, LIVE_SITE, pageRoot } from '../features/install/assets'

export const APPLIED_KEY = 'willow-applied-release'
export const RELOAD_GUARD = 'willow-release-reload'
export const RELEASE_MAX_BYTES = 8192
export const INDEX_MAX_BYTES = 1_500_000

export type LiveRelease = {
  id: string
  run?: number
  builtAt?: string
  channel?: string
  fallback?: string
  integrity?: string
}

export type SourceCheck =
  | { status: 'dev' }
  | { status: 'guard' }
  | { status: 'current'; remote: LiveRelease }
  | { status: 'available'; remote: LiveRelease }
  | { status: 'stale-shell'; remote: LiveRelease | null }
  | { status: 'missing' }
  | { status: 'blocked'; reason: 'origin' | 'schema' | 'integrity' }

const RELEASE_ID = /^(dev|[a-f0-9]{7,40})$/i
const INTEGRITY = /^sha256:[a-f0-9]{64}$/i
const STALE_V = /^(looks|framework|return|toppicks|moviesum|design)\d*$/i

export function parseRelease(raw: unknown): LiveRelease | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const rec = raw as Record<string, unknown>
  const id = String(rec.id ?? '').trim()
  if (!RELEASE_ID.test(id)) return null
  const channel = rec.channel === undefined ? undefined : String(rec.channel)
  if (channel && channel !== 'live' && channel !== 'local') return null
  const integrity = rec.integrity === undefined ? undefined : String(rec.integrity)
  if (integrity && !INTEGRITY.test(integrity)) return null
  const builtAt = rec.builtAt === undefined ? undefined : String(rec.builtAt)
  if (builtAt && (builtAt.length > 40 || Number.isNaN(Date.parse(builtAt)))) return null
  const run = Number(rec.run)
  const fallback = rec.fallback === undefined ? undefined : String(rec.fallback)
  if (fallback && fallback.length > 32) return null
  return {
    id,
    run: Number.isFinite(run) ? run : 0,
    builtAt,
    channel,
    fallback,
    integrity,
  }
}

export function sourceRoot(fromHref?: string) {
  const href = fromHref ?? (typeof window !== 'undefined' ? window.location.href : LIVE_SITE)
  if (isLocalAppHost(href)) return pageRoot(href).href
  return LIVE_SITE
}

export function releaseUrl(fromHref?: string) {
  return new URL('release.json', sourceRoot(fromHref)).href
}

export function hasStaleShellQuery(href: string) {
  try {
    const value = new URL(href.split('#')[0]).searchParams.get('v')
    return Boolean(value && STALE_V.test(value))
  } catch {
    return false
  }
}

export function shouldApplyRemote(applied: string | null, remote: LiveRelease) {
  if (!remote.id || remote.id === 'dev' || remote.channel === 'local') return false
  return applied !== remote.id
}

export function nextLiveHref(currentHref: string, id: string) {
  const hashIndex = currentHref.indexOf('#')
  const hash = hashIndex === -1 ? '' : currentHref.slice(hashIndex)
  const url = new URL(isLocalAppHost(currentHref) ? pageRoot(currentHref).href : LIVE_SITE)
  url.searchParams.delete('v')
  url.searchParams.set('willow', id.replace(/[^a-fA-F0-9]/g, '').slice(0, 12) || String(Date.now()))
  return `${url.href}${hash}`
}

export async function sha256Hex(text: string) {
  const bytes = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function headerType(res: { headers?: { get?: (name: string) => string | null } }) {
  return String(res.headers?.get?.('content-type') ?? '').toLowerCase()
}

function responseHref(res: { url?: string }, fallback: string) {
  return (res.url || fallback).split('#')[0]
}

type OfficialRead =
  | { blocked: 'origin' | 'schema' }
  | { missing: true }
  | { text: string }

type FetchedRelease = { blocked: 'origin' | 'schema' } | { missing: true } | { remote: LiveRelease }

async function readOfficialText(
  url: string,
  fetchImpl: typeof fetch,
  maxBytes: number,
  kind: 'json' | 'html',
): Promise<OfficialRead> {
  if (!isTrustedSource(url)) return { blocked: 'origin' as const }
  const res = await fetchImpl(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    redirect: 'follow',
  })
  if (!res.ok) return { missing: true as const }
  const finalHref = responseHref(res, url)
  if (!isTrustedSource(finalHref) || (isOfficialSource(url) && !isOfficialSource(finalHref))) {
    return { blocked: 'origin' as const }
  }
  const text = await res.text()
  if (text.length > maxBytes) return { blocked: 'schema' as const }
  const type = headerType(res)
  if (kind === 'json' && (type.includes('html') || !text.trim().startsWith('{'))) return { blocked: 'schema' as const }
  if (kind === 'html' && type.includes('json')) return { blocked: 'schema' as const }
  return { text }
}

export async function fetchLiveRelease(
  fromHref?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchedRelease> {
  const url = releaseUrl(fromHref)
  const read = await readOfficialText(url, fetchImpl, RELEASE_MAX_BYTES, 'json')
  if ('blocked' in read) return { blocked: read.blocked }
  if ('missing' in read) return { missing: true as const }
  try {
    const remote = parseRelease(JSON.parse(read.text))
    if (!remote) return { blocked: 'schema' as const }
    return { remote }
  } catch {
    return { blocked: 'schema' as const }
  }
}

export async function verifyReleaseIntegrity(
  remote: LiveRelease,
  fromHref?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { blocked: 'origin' | 'schema' | 'integrity' }> {
  if (!remote.integrity) return { ok: true as const }
  if (typeof crypto === 'undefined' || !crypto.subtle) return { blocked: 'integrity' as const }
  const indexUrl = new URL(sourceRoot(fromHref)).href
  const read = await readOfficialText(indexUrl, fetchImpl, INDEX_MAX_BYTES, 'html')
  if ('blocked' in read) return { blocked: read.blocked }
  if ('missing' in read) return { blocked: 'integrity' as const }
  const digest = `sha256:${await sha256Hex(read.text)}`
  if (digest !== remote.integrity) return { blocked: 'integrity' as const }
  return { ok: true as const }
}

export async function checkLiveUpdate(opts?: {
  href?: string
  applied?: string | null
  fetchImpl?: typeof fetch
  skipDev?: boolean
}): Promise<SourceCheck> {
  if (opts?.skipDev !== false && import.meta.env.DEV) return { status: 'dev' }
  const href = opts?.href ?? (typeof window === 'undefined' ? LIVE_SITE : window.location.href)
  const stale = Boolean(href && hasStaleShellQuery(href))
  const fetched = await fetchLiveRelease(opts?.href ?? href, opts?.fetchImpl).catch(() => ({ missing: true as const }))
  if ('blocked' in fetched) return { status: 'blocked', reason: fetched.blocked }
  if ('missing' in fetched) return stale ? { status: 'stale-shell', remote: null } : { status: 'missing' }
  const remote = fetched.remote
  const verified = await verifyReleaseIntegrity(remote, opts?.href ?? href, opts?.fetchImpl)
  if ('blocked' in verified) return { status: 'blocked', reason: verified.blocked }
  const applied =
    opts?.applied !== undefined
      ? opts.applied
      : typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(APPLIED_KEY)
  if (stale) return { status: 'stale-shell', remote }
  if (!shouldApplyRemote(applied, remote)) return { status: 'current', remote }
  return { status: 'available', remote }
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

function applyHref(currentHref: string, id: string) {
  const next = nextLiveHref(currentHref, id)
  return isTrustedSource(next) ? next : nextLiveHref(LIVE_SITE, id)
}

export async function applyVerifiedRelease(
  check: Extract<SourceCheck, { status: 'available' | 'stale-shell' }>,
  opts?: {
    href?: string
    location?: { href: string; replace: (url: string) => void }
  },
) {
  const loc = opts?.location ?? (typeof window === 'undefined' ? null : window.location)
  const currentHref = opts?.href ?? loc?.href ?? LIVE_SITE
  const id = check.remote?.id && check.remote.channel === 'live' ? check.remote.id : String(Date.now())
  try {
    sessionStorage.setItem(RELOAD_GUARD, '1')
    if (check.remote?.channel === 'live') localStorage.setItem(APPLIED_KEY, check.remote.id)
  } catch {
    /* private mode */
  }
  await clearClientCaches()
  if (loc) loc.replace(applyHref(currentHref, id))
  return { status: 'reloading' as const, id }
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
  const check = await checkLiveUpdate({ ...opts, skipDev: false })
  if (check.status === 'available' || check.status === 'stale-shell') return applyVerifiedRelease(check, opts)
  return check
}

export async function updateLiveWillow(opts?: {
  href?: string
  applied?: string | null
  location?: { href: string; replace: (url: string) => void }
  fetchImpl?: typeof fetch
  skipDev?: boolean
}) {
  if (opts?.skipDev !== false && import.meta.env.DEV) return { status: 'dev' as const }
  const check = await checkLiveUpdate({ ...opts, skipDev: false })
  if (check.status === 'available' || check.status === 'stale-shell') return applyVerifiedRelease(check, opts)
  if (check.status === 'current' && check.remote && shouldReloadCurrent(opts?.href)) {
    return applyVerifiedRelease({ status: 'available', remote: check.remote }, opts)
  }
  return check
}

function shouldReloadCurrent(href?: string) {
  const page = href ?? (typeof window === 'undefined' ? '' : window.location.href)
  if (isOfficialSource(page)) return true
  if (typeof window === 'undefined') return false
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return Boolean(cap?.isNativePlatform?.() || cap)
}

export async function forceReloadLive() {
  try {
    sessionStorage.removeItem(RELOAD_GUARD)
    localStorage.removeItem(APPLIED_KEY)
  } catch {
    /* private mode */
  }
  await clearClientCaches()
  if (typeof window !== 'undefined') window.location.replace(applyHref(window.location.href, String(Date.now())))
}

export function listenForLiveRelease() {
  if (import.meta.env.DEV || typeof document === 'undefined') return () => undefined
  function onVisible() {
    if (document.visibilityState === 'visible') void syncLiveRelease()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}

export function sourceStatusCopy(check: SourceCheck | { status: 'reloading'; id?: string }) {
  switch (check.status) {
    case 'dev':
      return 'This is a local Willow. The installed app checks the official source.'
    case 'current':
      return 'This app matches the official Willow source.'
    case 'available':
      return 'A newer Willow is on the official source. Updating…'
    case 'stale-shell':
      return 'This copy is behind the official source. Updating…'
    case 'reloading':
      return 'Updating from the official Willow source…'
    case 'missing':
      return 'The official source could not be reached. Willow was not changed.'
    case 'blocked':
      return 'The source did not verify. Willow was not changed.'
    case 'guard':
      return 'This app matches the official Willow source.'
    default:
      return 'Checked the official Willow source.'
  }
}
