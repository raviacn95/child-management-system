import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { mentionsBlockedPlatform } from '../../data/blockedPlatforms'

export const CUSTOM_APPS_KEY = 'willow-custom-apps-v1'
export const MAX_CUSTOM_APPS = 12
const CHANGE_EVENT = 'willow-custom-apps-change'
const TITLE_SLOT = '{q}'
const ANDROID_PACKAGE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/

export type CustomAppScope = 'all' | 'erotic'

function httpsSearch(url: string) {
  try {
    return new URL(url.replaceAll(TITLE_SLOT, 'test')).protocol === 'https:'
  } catch {
    return false
  }
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
        else if (!httpsSearch(url)) ctx.addIssue({ code: 'custom', message: 'Use a full https:// link' })
      }),
    androidPackage: z
      .string()
      .trim()
      .optional()
      .transform((pkg) => pkg?.replace(/\.apk$/i, '') || undefined)
      .refine((pkg) => pkg === undefined || ANDROID_PACKAGE.test(pkg), 'Android package looks like com.example.app'),
    scope: z.enum(['all', 'erotic']),
  })
  .superRefine((app, ctx) => {
    if (!app.searchUrl && !app.androidPackage) {
      ctx.addIssue({ code: 'custom', message: 'Add a website link or an Android package name', path: ['searchUrl'] })
    }
  })

const appSchema = draftSchema.extend({ id: z.string().min(1).max(40) })

export type CustomAppDraft = z.input<typeof draftSchema>
export type CustomApp = {
  id: string
  name: string
  searchUrl?: string
  androidPackage?: string
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

function isBlocked(app: { name: string; searchUrl?: string; androidPackage?: string }) {
  return mentionsBlockedPlatform(app.name) || mentionsBlockedPlatform(hostOf(app.searchUrl ?? '')) || mentionsBlockedPlatform(app.androidPackage ?? '')
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `app-${Date.now().toString(36)}`
}

export function parseCustomApp(input: CustomAppDraft, id = newId()): CustomAppResult {
  const parsed = draftSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the app details' }
  if (isBlocked(parsed.data)) return { ok: false, error: 'This app is blocked in India' }
  return { ok: true, app: { id, ...parsed.data } }
}

export function customSearchUrl(app: CustomApp, title: string, year?: number) {
  if (!app.searchUrl) return ''
  const query = [title.trim(), year].filter(Boolean).join(' ')
  return app.searchUrl.replaceAll(TITLE_SLOT, encodeURIComponent(query))
}

/** A package with no website just opens the app. With a website, the phone and TV open that app at the search. */
export function customAppLink(app: CustomApp, title: string, year?: number) {
  if (!app.searchUrl && app.androidPackage) {
    return `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${app.androidPackage};end`
  }
  const web = customSearchUrl(app, title, year)
  if (!app.androidPackage) return web
  const u = new URL(web)
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=${app.androidPackage};S.browser_fallback_url=${encodeURIComponent(web)};end`
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
