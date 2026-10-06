import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { mentionsBlockedPlatform } from '../../data/blockedPlatforms'

export const CUSTOM_APPS_KEY = 'willow-custom-apps-v1'
export const MAX_CUSTOM_APPS = 12
const CHANGE_EVENT = 'willow-custom-apps-change'
const TITLE_SLOT = '{q}'
const ANDROID_PACKAGE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/
const CLASS_NAME = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/
const SCHEME_NAME = /^[a-z][a-z0-9+.-]{1,31}$/
const BLOCKED_SCHEMES = new Set(['http', 'javascript', 'intent', 'file', 'content', 'data', 'blob', 'about', 'willow', 'market', 'amzn'])

export type CustomAppScope = 'all' | 'erotic'

export function searchLinkParts(url: string) {
  try {
    const parsed = new URL(url)
    const scheme = parsed.protocol.replace(/:$/, '').toLowerCase()
    if (!SCHEME_NAME.test(scheme) || BLOCKED_SCHEMES.has(scheme)) return null
    if (!parsed.hostname || parsed.username || parsed.password || parsed.hash) return null
    if (/[;\s#]/.test(`${parsed.hostname}${parsed.pathname}${parsed.search}`)) return null
    return { scheme, host: parsed.host, path: parsed.pathname, search: parsed.search }
  } catch {
    return null
  }
}

function allowedSearch(url: string) {
  return searchLinkParts(url.replaceAll(TITLE_SLOT, 'test')) !== null
}

function hostOk(host: string) {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)
}

/** Scheme, host, and path from an app link, with the movie name added as `q`. */
export function appLinkFromParts(scheme: string, host: string, path: string) {
  const name = scheme.trim().toLowerCase()
  const site = host.trim().toLowerCase()
  let route = path.trim()
  if (!name && !site && !route) return { ok: true as const, searchUrl: '' }
  if (!name || !site) return { ok: false as const, error: 'Add both the scheme and the host' }
  if (!SCHEME_NAME.test(name) || BLOCKED_SCHEMES.has(name)) return { ok: false as const, error: 'That scheme cannot be used' }
  if (!hostOk(site)) return { ok: false as const, error: 'Host looks like films.example' }
  if (!route) route = '/'
  if (!route.startsWith('/')) route = `/${route}`
  if (!/^\/[A-Za-z0-9._~/-]*$/.test(route)) return { ok: false as const, error: 'Path looks like /open' }
  const searchUrl = `${name}://${site}${route}?q=${TITLE_SLOT}`
  if (!allowedSearch(searchUrl)) return { ok: false as const, error: 'That app link cannot be used' }
  return { ok: true as const, searchUrl }
}

const draftSchema = z
  .object({
    name: z.string().trim().min(1, 'Give the app a name').max(30, 'Keep the name under 30 letters'),
    searchUrl: z
      .string()
      .trim()
      .max(300, 'That link is too long')
      .optional()
      .transform((url) => url || undefined)
      .superRefine((url, ctx) => {
        if (!url) return
        if (!url.includes(TITLE_SLOT)) ctx.addIssue({ code: 'custom', message: 'Put {q} in the link where the movie name goes' })
        else if (!allowedSearch(url)) {
          ctx.addIssue({ code: 'custom', message: 'Use an https:// link, or the app’s own link like myapp://open?q={q}' })
        }
      }),
    androidPackage: z
      .string()
      .trim()
      .optional()
      .transform((pkg) => pkg?.replace(/\.apk$/i, '') || undefined)
      .refine((pkg) => pkg === undefined || ANDROID_PACKAGE.test(pkg), 'Package name looks like com.example.app'),
    activity: z
      .string()
      .trim()
      .max(120, 'That activity name is too long')
      .optional()
      .transform((activity) => activity || undefined),
    scope: z.enum(['all', 'erotic']),
  })
  .superRefine((app, ctx) => {
    if (!app.activity) return
    if (!app.androidPackage) {
      ctx.addIssue({ code: 'custom', message: 'Add the package name for this screen', path: ['activity'] })
      return
    }
    const full = app.activity.startsWith('.') ? `${app.androidPackage}${app.activity}` : app.activity
    if (!CLASS_NAME.test(full) || !full.startsWith(`${app.androidPackage}.`)) {
      ctx.addIssue({ code: 'custom', message: 'Activity looks like com.example.app.MainActivity', path: ['activity'] })
    }
  })

const appSchema = draftSchema.extend({ id: z.string().min(1).max(40) })

export type CustomAppDraft = z.input<typeof draftSchema>
export type CustomApp = {
  id: string
  name: string
  searchUrl?: string
  androidPackage?: string
  activity?: string
  scope: CustomAppScope
}
export type CustomAppResult = { ok: true; app: CustomApp } | { ok: false; error: string }

function hostOf(searchUrl: string) {
  try {
    return new URL(searchUrl.replaceAll(TITLE_SLOT, 'test')).hostname
  } catch {
    return ''
  }
}

function isBlocked(app: { name: string; searchUrl?: string; androidPackage?: string; activity?: string }) {
  return (
    mentionsBlockedPlatform(app.name) ||
    mentionsBlockedPlatform(hostOf(app.searchUrl ?? '')) ||
    mentionsBlockedPlatform(app.androidPackage ?? '') ||
    mentionsBlockedPlatform(app.activity ?? '')
  )
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `app-${Date.now().toString(36)}`
}

export function parseCustomApp(input: CustomAppDraft, id = newId()): CustomAppResult {
  const parsed = draftSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the app details' }
  if (isBlocked(parsed.data)) return { ok: false, error: 'This app is blocked in India' }
  const activity = parsed.data.activity?.startsWith('.') ? `${parsed.data.androidPackage}${parsed.data.activity}` : parsed.data.activity
  return { ok: true, app: { id, ...parsed.data, activity } }
}

function searchQuery(title: string, year?: number) {
  return [title.trim(), year].filter(Boolean).join(' ')
}

export function customSearchUrl(app: CustomApp, title: string, year?: number) {
  if (!app.searchUrl) return ''
  return app.searchUrl.replaceAll(TITLE_SLOT, encodeURIComponent(searchQuery(title, year)))
}

function launchTail(app: CustomApp) {
  const parts = [
    app.androidPackage ? `package=${app.androidPackage}` : '',
    app.activity ? `S.activity=${encodeURIComponent(app.activity)}` : '',
    `S.app_name=${encodeURIComponent(app.name)}`,
  ].filter(Boolean)
  return parts.join(';')
}

function titleIntent(app: CustomApp, filled: string, parts: NonNullable<ReturnType<typeof searchLinkParts>>, query: string) {
  const packagePart = app.androidPackage ? `;package=${app.androidPackage}` : ''
  const fallback = parts.scheme === 'https' ? `;S.browser_fallback_url=${encodeURIComponent(filled)}` : ''
  const screen = app.activity ? `;S.screen=${encodeURIComponent(app.activity)}` : ''
  return `intent://${parts.host}${parts.path}${parts.search}#Intent;scheme=${parts.scheme}${packagePart};S.app_name=${encodeURIComponent(app.name)};S.query=${encodeURIComponent(query)}${screen}${fallback};end`
}

/** A search link opens that title in the installed app. An https link without a package stays on the web. */
export function customAppLink(app: CustomApp, title: string, year?: number) {
  const query = searchQuery(title, year)
  const filled = app.searchUrl ? customSearchUrl(app, title, year) : ''
  const parts = filled ? searchLinkParts(filled) : null
  if (parts && query && (app.androidPackage || parts.scheme !== 'https')) return titleIntent(app, filled, parts, query)
  if (app.androidPackage || !filled) {
    return `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;${launchTail(app)};end`
  }
  return filled
}

export function appsForShelf(apps: readonly CustomApp[], shelf: 'family' | 'erotic') {
  return apps.filter((app) => app.scope === 'all' || shelf === 'erotic')
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function loadCustomApps(storage: Storage | null = browserStorage()): CustomApp[] {
  if (!storage) return []
  let raw: unknown
  try {
    raw = JSON.parse(storage.getItem(CUSTOM_APPS_KEY) ?? '[]')
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const parsed = appSchema.safeParse(item)
    return parsed.success && !isBlocked(parsed.data) ? [parsed.data] : []
  })
}

function saveCustomApps(apps: CustomApp[], storage: Storage | null) {
  if (!storage) return
  storage.setItem(CUSTOM_APPS_KEY, JSON.stringify(apps))
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function addCustomApp(input: CustomAppDraft, storage: Storage | null = browserStorage()): CustomAppResult {
  const current = loadCustomApps(storage)
  if (current.length >= MAX_CUSTOM_APPS) return { ok: false, error: `You can save up to ${MAX_CUSTOM_APPS} apps` }
  const result = parseCustomApp(input)
  if (!result.ok) return result
  try {
    saveCustomApps([...current, result.app], storage)
  } catch {
    return { ok: false, error: 'Could not save on this device' }
  }
  return result
}

export function removeCustomApp(id: string, storage: Storage | null = browserStorage()) {
  saveCustomApps(
    loadCustomApps(storage).filter((app) => app.id !== id),
    storage,
  )
}

let cachedRaw: string | null | undefined
let cachedApps: CustomApp[] = []

function snapshot() {
  const raw = browserStorage()?.getItem(CUSTOM_APPS_KEY) ?? null
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedApps = loadCustomApps()
  }
  return cachedApps
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === CUSTOM_APPS_KEY) onChange()
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

const EMPTY: CustomApp[] = []

export function useCustomApps() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY)
}
